/**
 * Dynamic AI Assistant Controller
 * Handles AI assistant requests with OpenAI integration and real sensor data
 */

const axios = require('axios');
const Conversation = require('../models/Conversation');
const SensorData = require('../models/Sensor');
const Alert = require('../models/Alert');
const { SAFE_RANGES } = require('./alertController');


/**
 * Get latest sensor data for greenhouse context
 */
const getLatestSensorData = async () => {
  try {
    const latestData = await SensorData.findOne().sort({ timestamp: -1 }).lean();
    return latestData;
  } catch (error) {
    console.error('Error fetching sensor data:', error);
    return null;
  }
};

/**
 * Get historical sensor data for trend analysis
 */
const getHistoricalSensorData = async (days = 7) => {
  try {
    const cutoffTime = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const historicalData = await SensorData.find({ 
      timestamp: { $gte: cutoffTime } 
    }).sort({ timestamp: 1 });
    
    return historicalData;
  } catch (error) {
    console.error('Error fetching historical sensor data:', error);
    return [];
  }
};

/**
 * Aggregate sensor data by day for trend analysis
 */
const getDailyAggregates = async (days = 7) => {
  try {
    const cutoffTime = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const dailyData = await SensorData.aggregate([
      {
        $match: {
          timestamp: { $gte: cutoffTime }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$timestamp"
            }
          },
          avgTemperature: { $avg: "$readings.temperature" },
          avgHumidity: { $avg: "$readings.humidity" },
          avgLight: { $avg: "$readings.light" },
          avgAirPPM: { $avg: "$readings.airppm" },
          avgSoil: { $avg: "$readings.soil" },
          minTemperature: { $min: "$readings.temperature" },
          maxTemperature: { $max: "$readings.temperature" },
          minHumidity: { $min: "$readings.humidity" },
          maxHumidity: { $max: "$readings.humidity" },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    return dailyData;
  } catch (error) {
    console.error('Error aggregating daily sensor data:', error);
    return [];
  }
};

/**
 * Get sensor data trends for analysis
 */
const getSensorTrends = async (hours = 24) => {
  try {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    const trendData = await SensorData.find({ 
      timestamp: { $gte: cutoffTime } 
    }).sort({ timestamp: 1 });
    
    return trendData;
  } catch (error) {
    console.error('Error fetching sensor trends:', error);
    return [];
  }
};

/**
 * Get comprehensive greenhouse data for AI analysis
 */
const getComprehensiveGreenhouseData = async () => {
  try {
    // Get current sensor data
    const currentData = await getLatestSensorData();
    
    // Get recent alerts (last 24 hours)
    const recentAlerts = await Alert.find({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    }).sort({ createdAt: -1 }).limit(20);
    
    // Get historical data for trend analysis (last 7 days)
    const historicalData = await getHistoricalSensorData(7);
    
    // Get daily aggregates for patterns
    const dailyAggregates = await getDailyAggregates(7);
    
    // Get recent trends (last 24 hours)
    const recentTrends = await getSensorTrends(24);
    
    return {
      current: currentData,
      alerts: recentAlerts,
      historical: historicalData,
      dailyAggregates: dailyAggregates,
      recentTrends: recentTrends,
      thresholds: SAFE_RANGES,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error fetching comprehensive greenhouse data:', error);
    return null;
  }
};

/**
 * Analyze sensor data for anomalies and patterns
 */
const analyzeSensorPatterns = async (data) => {
  if (!data || !data.recentTrends || data.recentTrends.length === 0) {
    return { anomalies: [], patterns: [], insights: [] };
  }

  const anomalies = [];
  const patterns = [];
  const insights = [];
  const trends = data.recentTrends;
  
  // Analyze each sensor parameter
  const sensors = ['temperature', 'humidity', 'soil', 'light', 'airppm'];
  
  sensors.forEach(sensor => {
    const values = trends.map(t => t.readings[sensor]).filter(v => v !== undefined && v !== null);
    
    if (values.length < 3) return;
    
    // Calculate basic statistics
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    
    // Detect anomalies (values far from average)
    const threshold = range * 0.3; // 30% of range
    values.forEach((value, index) => {
      if (Math.abs(value - avg) > threshold) {
        anomalies.push({
          sensor,
          value,
          timestamp: trends[index].timestamp,
          type: value > avg ? 'spike' : 'drop',
          severity: Math.abs(value - avg) > threshold * 2 ? 'high' : 'medium'
        });
      }
    });
    
    // Detect trends
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    const trendPercent = ((secondAvg - firstAvg) / firstAvg) * 100;
    
    if (Math.abs(trendPercent) > 10) { // 10% change threshold
      patterns.push({
        sensor,
        trend: trendPercent > 0 ? 'increasing' : 'decreasing',
        changePercent: Math.abs(trendPercent).toFixed(1),
        avgValue: avg.toFixed(1),
        range: `${min.toFixed(1)} - ${max.toFixed(1)}`
      });
    }
    
    // Generate insights based on threshold comparison
    if (data.thresholds[sensor]) {
      const { min: safeMin, max: safeMax } = data.thresholds[sensor];
      const violations = values.filter(v => v < safeMin || v > safeMax);
      
      if (violations.length > 0) {
        insights.push({
          sensor,
          type: 'threshold_violations',
          count: violations.length,
          percentage: ((violations.length / values.length) * 100).toFixed(1),
          safeRange: `${safeMin}-${safeMax}`,
          currentRange: `${min.toFixed(1)}-${max.toFixed(1)}`
        });
      }
    }
  });
  
  return { anomalies, patterns, insights };
};

/**
 * Get dashboard context and visualization information
 */
const getDashboardContext = () => {
  return {
    sections: {
      overview: {
        description: "Main dashboard showing current sensor readings and system status",
        metrics: ["temperature", "humidity", "soil moisture", "light", "air quality"],
        purpose: "Quick overview of greenhouse conditions"
      },
      alerts: {
        description: "Active alerts and notifications for out-of-range values",
        types: ["critical", "high", "medium", "low"],
        purpose: "Monitor and respond to environmental issues"
      },
      history: {
        description: "Historical sensor data and trends over time",
        features: ["charts", "time filters", "data export"],
        purpose: "Analyze patterns and historical performance"
      },
      aiAssistant: {
        description: "AI-powered insights and recommendations",
        capabilities: ["data analysis", "trend detection", "recommendations", "dashboard guidance"],
        purpose: "Get intelligent assistance for greenhouse management"
      }
    },
    visualizations: {
      lineCharts: {
        purpose: "Show trends over time",
        insights: ["increasing/decreasing patterns", "seasonal variations", "sudden changes"],
        actions: ["identify trends", "spot anomalies", "compare time periods"]
      },
      barCharts: {
        purpose: "Compare values across categories",
        insights: ["highest/lowest values", "comparative performance", "distribution patterns"],
        actions: ["rank parameters", "compare categories", "identify extremes"]
      },
      pieCharts: {
        purpose: "Show proportions and distributions",
        insights: ["percentage breakdown", "dominant factors", "relative contributions"],
        actions: ["understand composition", "identify major factors", "see distribution"]
      },
      scatterPlots: {
        purpose: "Show relationships between variables",
        insights: ["correlations", "cause-effect patterns", "outlier detection"],
        actions: ["find relationships", "identify correlations", "spot outliers"]
      }
    },
    filters: {
      timeRange: {
        purpose: "Focus on specific time periods",
        options: ["24h", "48h", "7d", "30d"],
        impact: "Affects trend analysis and anomaly detection"
      },
      sensorType: {
        purpose: "Filter by specific parameters",
        options: ["temperature", "humidity", "soil", "light", "air"],
        impact: "Focuses analysis on selected sensors"
      },
      severity: {
        purpose: "Filter alerts by importance",
        options: ["critical", "high", "medium", "low"],
        impact: "Prioritizes urgent issues"
      }
    }
  };
};


/**
 * Generate enhanced fallback response based on comprehensive data when AI fails
 */
const generateEnhancedFallbackResponse = (question, data) => {
  if (!data || !data.current) {
    return 'I apologize, but I\'m having trouble accessing the greenhouse data. Please try again in a moment.';
  }

  const readings = data.current.readings || {};
  const thresholds = data.thresholds || {};
  const alerts = data.alerts || [];
  const analysis = { anomalies: [], patterns: [], insights: [] }; // Basic fallback analysis
  
  const queryType = determineQueryType(question);
  
  switch (queryType) {
    case 'recommendation':
      return generateFallbackRecommendations(readings, thresholds, alerts);
    case 'trend_analysis':
      return generateFallbackTrendAnalysis(data);
    case 'anomaly_detection':
      return generateFallbackAnomalyDetection(readings, thresholds);
    case 'navigation':
      return generateFallbackNavigation();
    case 'threshold':
      return generateFallbackThresholdInfo(thresholds, readings);
    case 'comparison':
      return generateFallbackComparison(readings);
    case 'decision_support':
      return generateFallbackDecisionSupport(readings, thresholds, alerts);
    case 'visualization_analysis':
      return generateFallbackVisualizationAnalysis(readings, thresholds, data);
    case 'causal_analysis':
      return generateFallbackCausalAnalysis(readings, thresholds, alerts);
    case 'change_analysis':
      return generateFallbackChangeAnalysis(readings, thresholds, data);
    default:
      return generateFallbackGeneralStatus(readings, thresholds, alerts);
  }
};

/**
 * Generate fallback recommendations
 */
const generateFallbackRecommendations = (readings, thresholds, alerts) => {
  const recommendations = [];
  
  if (readings.temperature && thresholds.temperature) {
    if (readings.temperature > thresholds.temperature.max) {
      recommendations.push(`Reduce temperature to ${thresholds.temperature.max}°C`);
    } else if (readings.temperature < thresholds.temperature.min) {
      recommendations.push(`Increase temperature to ${thresholds.temperature.min}°C`);
    }
  }
  
  if (readings.humidity && thresholds.humidity) {
    if (readings.humidity > thresholds.humidity.max) {
      recommendations.push(`Improve ventilation`);
    } else if (readings.humidity < thresholds.humidity.min) {
      recommendations.push(`Increase humidity`);
    }
  }
  
  if (readings.soil && thresholds.soil) {
    if (readings.soil < thresholds.soil.min) {
      recommendations.push(`Water plants (${readings.soil}% moisture)`);
    } else if (readings.soil > thresholds.soil.max) {
      recommendations.push(`Reduce watering`);
    }
  }
  
  if (recommendations.length === 0) {
    return 'Conditions are optimal. No actions needed.';
  }
  
  return recommendations.length <= 2 ? 
    `${recommendations.join(' and ')}.` : 
    `${recommendations.slice(0, 2).join(' and ')}. Also ${recommendations[2]}.`;
};

/**
 * Generate fallback trend analysis
 */
const generateFallbackTrendAnalysis = (data) => {
  if (!data.dailyAggregates || data.dailyAggregates.length < 2) {
    return 'Need more historical data for trend analysis.';
  }
  
  const latest = data.dailyAggregates[data.dailyAggregates.length - 1];
  const previous = data.dailyAggregates[data.dailyAggregates.length - 2];
  
  const trends = [];
  
  if (latest.avgTemperature && previous.avgTemperature) {
    const change = latest.avgTemperature - previous.avgTemperature;
    trends.push(`Temp ${change >= 0 ? '+' : ''}${change.toFixed(1)}°C`);
  }
  
  if (latest.avgHumidity && previous.avgHumidity) {
    const change = latest.avgHumidity - previous.avgHumidity;
    trends.push(`Humidity ${change >= 0 ? '+' : ''}${change.toFixed(1)}%`);
  }
  
  return trends.length > 0 ? `Recent changes: ${trends.join(', ')}.` : 'Stable conditions recently.';
};

/**
 * Generate fallback anomaly detection
 */
const generateFallbackAnomalyDetection = (readings, thresholds) => {
  const anomalies = [];
  
  Object.entries(readings).forEach(([sensor, value]) => {
    if (value && thresholds[sensor]) {
      const { min, max } = thresholds[sensor];
      if (value < min) {
        anomalies.push(`${sensor} is unusually low: ${value} (safe range: ${min}-${max})`);
      } else if (value > max) {
        anomalies.push(`${sensor} is unusually high: ${value} (safe range: ${min}-${max})`);
      }
    }
  });
  
  if (anomalies.length === 0) {
    return 'No anomalies detected. All sensor readings are within normal ranges.';
  }
  
  return `Anomalies detected: ${anomalies.join('; ')}.`;
};

/**
 * Generate fallback navigation help
 */
const generateFallbackNavigation = () => {
  return `Dashboard: Overview shows current readings, Alerts displays notifications, History has charts, and AI Assistant answers questions. Use the menu to navigate.`;
};

/**
 * Generate fallback threshold information
 */
const generateFallbackThresholdInfo = (thresholds, readings) => {
  const info = [];
  
  Object.entries(thresholds).forEach(([sensor, range]) => {
    const current = readings[sensor];
    const status = current ? ` (now: ${current}${range.unit})` : '';
    info.push(`${sensor}: ${range.min}-${range.max}${range.unit}${status}`);
  });
  
  return `Safe ranges: ${info.join(', ')}. These ensure optimal plant growth.`;
};

/**
 * Generate fallback comparison
 */
const generateFallbackComparison = (readings) => {
  const params = Object.entries(readings).filter(([key, value]) => value !== undefined && value !== null);
  
  if (params.length < 2) {
    return 'Need at least 2 active sensor readings for comparison.';
  }
  
  const sorted = params.sort((a, b) => b[1] - a[1]);
  const highest = sorted[0];
  const lowest = sorted[sorted.length - 1];
  
  return `Sensor comparison: ${highest[0]} is highest at ${highest[1]}, ${lowest[0]} is lowest at ${lowest[1]}.`;
};

/**
 * Generate fallback decision support
 */
const generateFallbackDecisionSupport = (readings, thresholds, alerts) => {
  const criticalIssues = alerts.filter(a => a.severity === 'critical').length;
  const highIssues = alerts.filter(a => a.severity === 'high').length;
  
  if (criticalIssues > 0) {
    return `URGENT: ${criticalIssues} critical issues require immediate attention. Check alerts section for details.`;
  } else if (highIssues > 0) {
    return `ATTENTION: ${highIssues} high-priority issues need action soon. Review recommendations.`;
  } else {
    return 'All systems operating normally. Continue routine monitoring.';
  }
};

/**
 * Generate fallback visualization analysis
 */
const generateFallbackVisualizationAnalysis = (readings, thresholds, data) => {
  const insights = [];
  
  // Analyze current readings for visualization insights
  if (readings.temperature && thresholds.temperature) {
    const status = readings.temperature > thresholds.temperature.max ? 'above' : 
                  readings.temperature < thresholds.temperature.min ? 'below' : 'within';
    insights.push(`Temperature chart shows ${status} safe range at ${readings.temperature}°C`);
  }
  
  if (readings.humidity && thresholds.humidity) {
    const status = readings.humidity > thresholds.humidity.max ? 'above' : 
                  readings.humidity < thresholds.humidity.min ? 'below' : 'within';
    insights.push(`Humidity line chart indicates ${status} optimal range (${readings.humidity}%)`);
  }
  
  if (data.dailyAggregates && data.dailyAggregates.length > 1) {
    const latest = data.dailyAggregates[data.dailyAggregates.length - 1];
    const previous = data.dailyAggregates[data.dailyAggregates.length - 2];
    
    if (latest.avgTemperature && previous.avgTemperature) {
      const change = latest.avgTemperature - previous.avgTemperature;
      insights.push(`Temperature trend shows ${change >= 0 ? 'upward' : 'downward'} pattern`);
    }
  }
  
  return insights.length > 0 ? insights.join('. ') + '.' : 'Charts show current sensor readings within normal ranges.';
};

/**
 * Generate fallback causal analysis
 */
const generateFallbackCausalAnalysis = (readings, thresholds, alerts) => {
  const causes = [];
  
  // Analyze potential causes for current conditions
  if (readings.temperature && readings.temperature > (thresholds.temperature?.max || 28)) {
    causes.push('High temperature likely caused by poor ventilation or excessive heating');
  } else if (readings.temperature && readings.temperature < (thresholds.temperature?.min || 18)) {
    causes.push('Low temperature probably due to insufficient heating or cold external conditions');
  }
  
  if (readings.humidity && readings.humidity > (thresholds.humidity?.max || 80)) {
    causes.push('High humidity caused by inadequate air circulation or overwatering');
  } else if (readings.humidity && readings.humidity < (thresholds.humidity?.min || 70)) {
    causes.push('Low humidity likely from dry conditions or insufficient misting');
  }
  
  if (alerts.length > 0) {
    causes.push(`Alerts triggered by sensor readings exceeding safe thresholds`);
  }
  
  return causes.length > 0 ? causes.join('. ') + '.' : 'Current conditions appear normal with no obvious causes for concern.';
};

/**
 * Generate fallback change analysis
 */
const generateFallbackChangeAnalysis = (readings, thresholds, data) => {
  const changes = [];
  
  if (data.dailyAggregates && data.dailyAggregates.length > 1) {
    const latest = data.dailyAggregates[data.dailyAggregates.length - 1];
    const previous = data.dailyAggregates[data.dailyAggregates.length - 2];
    
    if (latest.avgTemperature && previous.avgTemperature) {
      const tempChange = latest.avgTemperature - previous.avgTemperature;
      if (Math.abs(tempChange) > 1) {
        changes.push(`Temperature changed by ${tempChange.toFixed(1)}°C - ${tempChange > 0 ? 'consider adjusting cooling' : 'may need heating'}`);
      }
    }
    
    if (latest.avgHumidity && previous.avgHumidity) {
      const humidChange = latest.avgHumidity - previous.avgHumidity;
      if (Math.abs(humidChange) > 5) {
        changes.push(`Humidity shifted ${humidChange.toFixed(1)}% - ${humidChange > 0 ? 'improve ventilation' : 'increase moisture'}`);
      }
    }
  }
  
  return changes.length > 0 ? changes.join('. ') + '.' : 'No significant changes detected in recent data.';
};

/**
 * Generate fallback general status
 */
const generateFallbackGeneralStatus = (readings, thresholds, alerts) => {
  const activeAlerts = alerts.length;
  const status = activeAlerts === 0 ? 'optimal' : activeAlerts <= 2 ? 'good' : 'needs attention';
  
  return `Status: ${status}. ${activeAlerts} alerts. Temp: ${readings.temperature || 'N/A'}°C, Humidity: ${readings.humidity || 'N/A'}%, Soil: ${readings.soil || 'N/A'}%.`;
};

/**
 * Enhanced AI response with comprehensive data analysis and intelligent insights
 */
const getAIResponse = async (question, conversationHistory = [], retryCount = 0) => {
  const maxRetries = 2;
  
  try {
    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key not configured');
      const data = await getComprehensiveGreenhouseData();
      return generateEnhancedFallbackResponse(question, data);
    }
    
    // Get comprehensive greenhouse data
    const data = await getComprehensiveGreenhouseData();
    
    if (!data) {
      return "I'm having trouble accessing the greenhouse data. Please try again in a moment.";
    }
    
    // Analyze patterns and anomalies
    const analysis = await analyzeSensorPatterns(data);
    
    // Get dashboard context for navigation questions
    const dashboardContext = getDashboardContext();
    
    // Build comprehensive context for AI
    const context = buildComprehensiveContext(question, data, analysis, dashboardContext, conversationHistory);
    
    // Determine query type and build appropriate system prompt
    const queryType = determineQueryType(question);
    const systemPrompt = buildSystemPrompt(queryType, data, analysis);
    
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: context
          }
        ],
        max_tokens: 180, // Medium-length responses
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000 // Increased timeout
      }
    );

    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error('OpenAI API Error (attempt', retryCount + 1, '):', error.message);
    
    // Retry logic
    if (retryCount < maxRetries && 
        (error.code === 'ECONNRESET' || 
         error.code === 'ETIMEDOUT' || 
         error.response?.status >= 500)) {
      console.log(`Retrying OpenAI API call (${retryCount + 1}/${maxRetries})...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
      return getAIResponse(question, conversationHistory, retryCount + 1);
    }
    
    // Enhanced fallback response
    console.log('Using enhanced fallback response due to API failure');
    const data = await getComprehensiveGreenhouseData();
    return generateEnhancedFallbackResponse(question, data);
  }
};

/**
 * Build concise context for AI analysis with dashboard visualization awareness
 */
const buildComprehensiveContext = (question, data, analysis, dashboardContext, conversationHistory) => {
  const currentReadings = data.current?.readings || {};
  const thresholds = data.thresholds || {};
  
  // Current sensor data context with visualization context
  let sensorContext = '\n=== DASHBOARD VIEW ===\n';
  sensorContext += `Current Readings: Temp ${currentReadings.temperature || 'N/A'}°C, Humidity ${currentReadings.humidity || 'N/A'}%, Soil ${currentReadings.soil || 'N/A'}%, Light ${currentReadings.light || 'N/A'} lux, Air ${currentReadings.airppm || 'N/A'} ppm\n`;
  sensorContext += `Safe Ranges: Temp ${thresholds.temperature?.min}-${thresholds.temperature?.max}°C, Humidity ${thresholds.humidity?.min}-${thresholds.humidity?.max}%, Soil ${thresholds.soil?.min}-${thresholds.soil?.max}%\n`;
  
  // Alerts context with dashboard impact
  if (data.alerts && data.alerts.length > 0) {
    const criticalCount = data.alerts.filter(a => a.severity === 'critical').length;
    const highCount = data.alerts.filter(a => a.severity === 'high').length;
    sensorContext += `\nAlerts Panel: ${data.alerts.length} active (${criticalCount} critical, ${highCount} high) - visible in dashboard alerts section\n`;
  } else {
    sensorContext += '\nAlerts Panel: Clear - no active alerts\n';
  }
  
  // Analysis context with visualization implications
  if (analysis.anomalies.length > 0) {
    sensorContext += `\nChart Anomalies: ${analysis.anomalies.length} visible patterns - likely shown as spikes/drops in line charts\n`;
  }
  if (analysis.patterns.length > 0) {
    sensorContext += `Trend Patterns: ${analysis.patterns.length} detected - visible as upward/downward trends in charts\n`;
  }
  
  // Historical context for time-based visualizations
  if (data.dailyAggregates && data.dailyAggregates.length > 0) {
    const latestDay = data.dailyAggregates[data.dailyAggregates.length - 1];
    sensorContext += `\nHistorical Charts: Latest daily averages - Temp ${latestDay.avgTemperature?.toFixed(1) || 'N/A'}°C, Humidity ${latestDay.avgHumidity?.toFixed(1) || 'N/A'}%\n`;
  }
  
  // Dashboard visualization context for chart-related questions
  const isVisualizationQuery = question.toLowerCase().includes('chart') || question.toLowerCase().includes('graph') || 
                               question.toLowerCase().includes('visualization') || question.toLowerCase().includes('plot') ||
                               question.toLowerCase().includes('seeing') || question.toLowerCase().includes('line chart') ||
                               question.toLowerCase().includes('bar chart') || question.toLowerCase().includes('pie chart');
  
  if (isVisualizationQuery) {
    sensorContext += '\n=== VISUALIZATION CONTEXT ===\n';
    sensorContext += 'Line Charts: Show time-series trends for each sensor\n';
    sensorContext += 'Bar Charts: Compare values across categories or time periods\n';
    sensorContext += 'Pie Charts: Show distributions and proportions\n';
    sensorContext += 'Filters: Time range (24h, 7d, 30d) and sensor type filters affect what\'s visible\n';
  }
  
  // Brief conversation history
  const historyContext = conversationHistory.slice(-2).map(msg => 
    `${msg.role}: ${msg.content}`
  ).join('\n');
  
  return `${sensorContext}

${historyContext ? `\nRecent Context: ${historyContext}\n` : ''}
User Question: ${question}

Analyze what the user is seeing in their current dashboard view. Explain patterns visible in the charts and provide decision-support recommendations based on the visualization data.`;
};

/**
 * Determine the type of query to customize the AI response
 */
const determineQueryType = (question) => {
  const lowerQuestion = question.toLowerCase();
  
  if (lowerQuestion.includes('recommend') || lowerQuestion.includes('suggest') || lowerQuestion.includes('should') || lowerQuestion.includes('advice')) {
    return 'recommendation';
  } else if (lowerQuestion.includes('trend') || lowerQuestion.includes('pattern') || lowerQuestion.includes('historical') || lowerQuestion.includes('over time')) {
    return 'trend_analysis';
  } else if (lowerQuestion.includes('anomaly') || lowerQuestion.includes('unusual') || lowerQuestion.includes('strange') || lowerQuestion.includes('weird')) {
    return 'anomaly_detection';
  } else if (lowerQuestion.includes('navigate') || lowerQuestion.includes('dashboard') || lowerQuestion.includes('how to') ||
                           lowerQuestion.includes('where is') || lowerQuestion.includes('chart')) {
    return 'navigation';
  } else if (lowerQuestion.includes('compare') || lowerQuestion.includes('difference') || lowerQuestion.includes('versus') || lowerQuestion.includes('vs')) {
    return 'comparison';
  } else if (lowerQuestion.includes('threshold') || lowerQuestion.includes('safe') || lowerQuestion.includes('range') || lowerQuestion.includes('limit')) {
    return 'threshold';
  } else if (lowerQuestion.includes('decision') || lowerQuestion.includes('action') || lowerQuestion.includes('optimize') || lowerQuestion.includes('improve')) {
    return 'decision_support';
  } else if (lowerQuestion.includes('chart') || lowerQuestion.includes('graph') || lowerQuestion.includes('visualization') || 
             lowerQuestion.includes('plot') || lowerQuestion.includes('line chart') || lowerQuestion.includes('bar chart') ||
             lowerQuestion.includes('pie chart') || lowerQuestion.includes('scatter') || lowerQuestion.includes('seeing')) {
    return 'visualization_analysis';
  } else if (lowerQuestion.includes('why') || lowerQuestion.includes('cause') || lowerQuestion.includes('reason') || 
             lowerQuestion.includes('explain') || lowerQuestion.includes('meaning') || lowerQuestion.includes('happening')) {
    return 'causal_analysis';
  } else if (lowerQuestion.includes('increase') || lowerQuestion.includes('decrease') || lowerQuestion.includes('rise') || 
             lowerQuestion.includes('fall') || lowerQuestion.includes('drop') || lowerQuestion.includes('spike')) {
    return 'change_analysis';
  } else {
    return 'general';
  }
};

/**
 * Build system prompt based on query type and available data
 */
const buildSystemPrompt = (queryType, data, analysis) => {
  let prompt = 'You are an AI assistant integrated into a visual analytics dashboard for greenhouse monitoring. ';
  
  switch (queryType) {
    case 'recommendation':
      prompt += 'Provide 2-3 specific, actionable recommendations based on current conditions and safe thresholds. Focus on immediate actions greenhouse managers should take. ';
      break;
    case 'trend_analysis':
      prompt += 'Analyze trends visible in the dashboard charts. Explain increases, decreases, and patterns over time in simple terms. Connect patterns to real-world meanings. ';
      break;
    case 'anomaly_detection':
      prompt += 'Identify and explain anomalies visible in the data visualization. Focus on what the user is seeing in their current view and why it matters. ';
      break;
    case 'navigation':
      prompt += 'Guide users through dashboard features and visualizations. Explain how to interpret charts and use filters effectively. ';
      break;
    case 'comparison':
      prompt += 'Compare parameters visible in the current dashboard view. Highlight relationships and relative performance the user can see. ';
      break;
    case 'threshold':
      prompt += 'Explain threshold violations visible in the current view. Connect safe ranges to the data patterns the user is seeing. ';
      break;
    case 'decision_support':
      prompt += 'Provide decision-support based on current dashboard view. Recommend specific actions considering all visible data patterns. ';
      break;
    case 'visualization_analysis':
      prompt += 'Analyze the specific chart or visualization the user is referring to. Describe what is happening in that visualization, including increases, decreases, and patterns. ';
      break;
    case 'causal_analysis':
      prompt += 'Explain why patterns are occurring in the data. Connect causes to effects visible in the dashboard and explain the underlying reasons. ';
      break;
    case 'change_analysis':
      prompt += 'Analyze increases, decreases, spikes, or drops visible in the charts. Explain what these changes mean and what actions they suggest. ';
      break;
    default:
      prompt += 'Analyze the current dashboard view and provide insights about what the user is seeing. Focus on key patterns and their meanings. ';
  }
  
  prompt += 'Always consider the current visualization, filters, and what the user is viewing. Explain insights based on the dashboard data, not generic information. Connect patterns to real-world meanings and provide decision-support recommendations. Keep responses concise (2-4 sentences) and focused on helping greenhouse managers make informed decisions quickly.';
  
  return prompt;
};


/**
 * Handle AI assistant chat request with conversation storage
 */
const chatWithAI = async (req, res) => {
  try {
    const { question, conversationId, sessionId } = req.body;

    if (!question) {
      return res.status(400).json({
        success: false,
        message: 'Question is required'
      });
    }

    // Generate or use existing conversation ID
    const convId = conversationId || `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const userSessionId = sessionId || 'default_session';

    let conversationHistory = [];

    // Try to get conversation history, but don't fail if MongoDB is unavailable
    try {
      let conversation = await Conversation.findOne({ conversationId: convId });
      if (conversation) {
        conversationHistory = conversation.messages;
        
        // Add messages to conversation
        conversation.messages.push({
          role: 'user',
          content: question,
          timestamp: new Date()
        });

        // Get AI response
        const response = await getAIResponse(question, conversationHistory);

        conversation.messages.push({
          role: 'assistant',
          content: response,
          timestamp: new Date()
        });

        // Update the updatedAt field manually before saving
        conversation.updatedAt = new Date();
        
        // Try to save conversation
        try {
          await conversation.save();
        } catch (saveError) {
          console.error('Failed to save conversation:', saveError.message);
          // Continue without saving - AI response is still valid
        }

        res.json({
          success: true,
          response: response,
          conversationId: convId,
          timestamp: new Date().toISOString()
        });
      } else {
        // Create new conversation
        conversation = new Conversation({
          conversationId: convId,
          sessionId: userSessionId,
          messages: []
        });

        // Get AI response
        const response = await getAIResponse(question, conversationHistory);

        // Add messages to conversation
        conversation.messages.push({
          role: 'user',
          content: question,
          timestamp: new Date()
        });

        conversation.messages.push({
          role: 'assistant',
          content: response,
          timestamp: new Date()
        });

        // Try to save conversation
        try {
          await conversation.save();
        } catch (saveError) {
          console.error('Failed to save new conversation:', saveError.message);
          // Continue without saving - AI response is still valid
        }

        res.json({
          success: true,
          response: response,
          conversationId: convId,
          timestamp: new Date().toISOString()
        });
      }
    } catch (dbError) {
      console.error('Database error, using AI without conversation history:', dbError.message);
      
      // Get AI response without conversation history
      const response = await getAIResponse(question, []);

      res.json({
        success: true,
        response: response,
        conversationId: convId,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('AI Assistant Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process AI request'
    });
  }
};

/**
 * Get conversation history
 */
const getConversationHistory = async (req, res) => {
  try {
    const { conversationId } = req.params;

    if (!conversationId) {
      return res.status(400).json({
        success: false,
        message: 'Conversation ID is required'
      });
    }

    const conversation = await Conversation.findOne({ conversationId });
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    res.json({
      success: true,
      conversation: conversation,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get Conversation Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get conversation'
    });
  }
};

/**
 * Get AI assistant status with sensor data
 */
const getAIStatus = async (req, res) => {
  try {
    const hasAIKey = !!process.env.OPENAI_API_KEY;
    const sensorData = await getLatestSensorData();
    
    res.json({
      success: true,
      aiEnabled: hasAIKey,
      provider: hasAIKey ? 'OpenAI' : 'Disabled',
      sensorData: sensorData ? {
        temperature: sensorData.readings?.temperature || 'N/A',
        humidity: sensorData.readings?.humidity || 'N/A',
        soilMoisture: sensorData.readings?.soil || 'N/A',
        lightLevel: sensorData.readings?.light || 'N/A',
        airQuality: sensorData.readings?.airppm || 'N/A',
        timestamp: sensorData.timestamp || 'N/A'
      } : null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('AI Status Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get AI status'
    });
  }
};

module.exports = {
  chatWithAI,
  getConversationHistory,
  getAIStatus,
  getLatestSensorData,
  getHistoricalSensorData,
  getDailyAggregates,
  getSensorTrends,
  getComprehensiveGreenhouseData,
  analyzeSensorPatterns,
  getDashboardContext
};
