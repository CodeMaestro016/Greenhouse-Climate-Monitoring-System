const axios = require('axios');
const aiAssistantController = require('./aiAssistantController');

/**
 * Generate AI-powered recommendation for alert
 */
const generateRecommendation = async (alert) => {
  try {
    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key not configured for recommendations');
      return getFallbackRecommendation(alert);
    }

    // Get current sensor data for context
    const sensorData = await aiAssistantController.getLatestSensorData();
    
    // Build context with current sensor readings
    let sensorContext = '';
    if (sensorData && sensorData.readings) {
      const readings = sensorData.readings;
      sensorContext = `
Current Greenhouse Conditions:
- Temperature: ${readings.temperature || 'N/A'}°C
- Humidity: ${readings.humidity || 'N/A'}%
- Soil Moisture: ${readings.soil || 'N/A'}%
- Light Level: ${readings.light || 'N/A'} lux
- Air Quality: ${readings.airppm || 'N/A'} ppm
`;
    } else {
      sensorContext = 'Current sensor data not available.';
    }

    const prompt = `You are a greenhouse monitoring expert. Based on the following alert, provide ONE clear, practical recommendation.

${sensorContext}

Alert Details:
- Type: ${alert.field || 'Unknown'}
- Current Value: ${alert.value}
- Safe Range: ${alert.min} - ${alert.max}
- Severity: ${alert.severity}

RULES:
- Maximum 15 words total
- One specific action only
- Use simple, direct language
- No explanations or extra text
- Start with action verb

Examples:
"Water plants for 5 minutes immediately."
"Open vents to reduce temperature by 3°C."
"Stop watering and check drainage."

Provide ONLY the action, nothing else:`;

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful greenhouse monitoring assistant that provides short, practical recommendations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 30,
        temperature: 0.3
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      }
    );

    const recommendation = response.data.choices[0].message.content.trim();
    
    // Validate recommendation length and simplicity
    if (recommendation.length > 80 || recommendation.split(' ').length > 15) {
      console.warn('AI recommendation too long, using fallback');
      return getFallbackRecommendation(alert);
    }

    return recommendation;
  } catch (error) {
    console.error('Error generating AI recommendation:', error.message);
    return getFallbackRecommendation(alert);
  }
};

/**
 * Fallback recommendations when AI is unavailable
 */
const getFallbackRecommendation = (alert) => {
  const field = alert.field?.toLowerCase();
  const severity = alert.severity?.toLowerCase();
  
  const recommendations = {
    temperature: {
      critical: 'Lower temperature immediately to prevent plant damage.',
      high: 'Reduce temperature by 2-3°C for optimal growth.',
      medium: 'Monitor temperature closely and adjust if needed.',
      low: 'Temperature is near limit - keep monitoring.'
    },
    humidity: {
      critical: 'Increase ventilation to reduce humidity quickly.',
      high: 'Improve air circulation to lower humidity.',
      medium: 'Watch humidity levels and adjust ventilation.',
      low: 'Humidity is approaching limit - stay alert.'
    },
    soil_moisture: {
      critical: 'Water plants immediately to prevent wilting.',
      high: 'Stop watering and check drainage.',
      medium: 'Adjust watering schedule as needed.',
      low: 'Soil moisture is near limit - monitor closely.'
    },
    soil: {
      critical: 'Water plants immediately to prevent wilting.',
      high: 'Stop watering and check drainage.',
      medium: 'Adjust watering schedule as needed.',
      low: 'Soil moisture is near limit - monitor closely.'
    },
    light: {
      critical: 'Adjust lighting to prevent plant damage.',
      high: 'Reduce light intensity or move plants.',
      medium: 'Monitor light levels and adjust if needed.',
      low: 'Light is near limit - keep watching.'
    },
    air: {
      critical: 'Improve ventilation immediately.',
      high: 'Increase air circulation now.',
      medium: 'Monitor air quality and ventilate.',
      low: 'Air quality is near limit - stay alert.'
    },
    co2: {
      critical: 'Improve ventilation immediately.',
      high: 'Increase air circulation now.',
      medium: 'Monitor air quality and ventilate.',
      low: 'Air quality is near limit - stay alert.'
    }
  };

  return recommendations[field]?.[severity] || 'Monitor conditions and take appropriate action.';
};

/**
 * Get recommendation for specific alert
 */
const getAlertRecommendation = async (req, res) => {
  try {
    const { alertId } = req.params;

    if (!alertId) {
      return res.status(400).json({
        success: false,
        message: 'Alert ID is required'
      });
    }

    // Get alert from database
    const Alert = require('../models/Alert');
    const alert = await Alert.findById(alertId);

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }

    // Generate recommendation
    const recommendation = await generateRecommendation(alert);

    res.json({
      success: true,
      data: {
        alertId: alert._id,
        recommendation: recommendation,
        generatedBy: process.env.OPENAI_API_KEY ? 'AI' : 'Fallback',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error getting alert recommendation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate recommendation'
    });
  }
};

/**
 * Get recommendations for multiple alerts
 */
const getMultipleRecommendations = async (req, res) => {
  try {
    const { alertIds } = req.body;

    if (!alertIds || !Array.isArray(alertIds)) {
      return res.status(400).json({
        success: false,
        message: 'Alert IDs array is required'
      });
    }

    const Alert = require('../models/Alert');
    const alerts = await Alert.find({ _id: { $in: alertIds } });

    if (alerts.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No alerts found'
      });
    }

    // Generate recommendations for all alerts
    const recommendations = await Promise.all(
      alerts.map(alert => generateRecommendation(alert))
    );

    const results = alerts.map((alert, index) => ({
      alertId: alert._id,
      recommendation: recommendations[index],
      generatedBy: process.env.OPENAI_API_KEY ? 'AI' : 'Fallback'
    }));

    res.json({
      success: true,
      data: results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting multiple recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate recommendations'
    });
  }
};

/**
 * Get recommendation based on current sensor data
 */
const getCurrentRecommendations = async (req, res) => {
  try {
    const sensorData = await aiAssistantController.getLatestSensorData();

    if (!sensorData || !sensorData.readings) {
      return res.status(404).json({
        success: false,
        message: 'No sensor data available'
      });
    }

    // Create mock alerts for current readings to get recommendations
    const Alert = require('../models/Alert');
    const { SAFE_RANGES } = require('./alertController');

    const mockAlerts = [];
    const readings = sensorData.readings;

    // Check each sensor reading against safe ranges
    Object.entries(SAFE_RANGES).forEach(([field, range]) => {
      const fieldName = field;
      let value;

      // Map field names to actual reading values
      if (fieldName === 'temperature') value = readings.temperature;
      else if (fieldName === 'humidity') value = readings.humidity;
      else if (fieldName === 'soil_moisture' || fieldName === 'soil') value = readings.soil;
      else if (fieldName === 'light') value = readings.light;
      else if (fieldName === 'air' || fieldName === 'co2') value = readings.airppm;

      if (value !== undefined && value !== null) {
        const { min, max } = range;
        
        // Create mock alert if value is outside safe range
        if (value < min || value > max) {
          mockAlerts.push({
            field: fieldName,
            value: value,
            min: min,
            max: max,
            severity: value < min - (max - min) * 0.2 || value > max + (max - min) * 0.2 ? 'critical' : 'high'
          });
        }
      }
    });

    if (mockAlerts.length === 0) {
      return res.json({
        success: true,
        data: {
          recommendation: 'All sensor values are within safe ranges. Continue monitoring.',
          generatedBy: 'System',
          alerts: []
        }
      });
    }

    // Generate recommendations for problematic readings
    const recommendations = await Promise.all(
      mockAlerts.map(alert => generateRecommendation(alert))
    );

    const results = mockAlerts.map((alert, index) => ({
      field: alert.field,
      value: alert.value,
      safeRange: `${alert.min} - ${alert.max}`,
      recommendation: recommendations[index],
      severity: alert.severity
    }));

    res.json({
      success: true,
      data: {
        recommendations: results,
        generatedBy: process.env.OPENAI_API_KEY ? 'AI' : 'Fallback',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error getting current recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate recommendations'
    });
  }
};

module.exports = {
  getAlertRecommendation,
  getMultipleRecommendations,
  getCurrentRecommendations,
  generateRecommendation
};
