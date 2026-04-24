/**
 * Dynamic AI Assistant Controller
 * Handles AI assistant requests with OpenAI integration and real sensor data
 */

const axios = require('axios');
const Conversation = require('../models/Conversation');
const SensorData = require('../models/Sensor');


/**
 * Get latest sensor data for greenhouse context
 */
const getLatestSensorData = async () => {
  try {
    const latestData = await SensorData.findOne().sort({ timestamp: -1 });
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
          avgLux: { $avg: "$readings.lux" },
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
 * Generate fallback response based on sensor data when AI fails
 */
const generateFallbackResponse = (question, sensorData) => {
  const isSafetyQuery = question.toLowerCase().includes('safe') || 
                        question.toLowerCase().includes('danger') || 
                        question.toLowerCase().includes('risk') ||
                        question.toLowerCase().includes('ok') ||
                        question.toLowerCase().includes('good');
  
  const isRecommendationQuery = question.toLowerCase().includes('recommend') || 
                               question.toLowerCase().includes('suggest') || 
                               question.toLowerCase().includes('should') || 
                               question.toLowerCase().includes('what should') ||
                               question.toLowerCase().includes('advice');

  if (isSafetyQuery && sensorData && sensorData.readings) {
    const readings = sensorData.readings;
    const temp = readings.temperature;
    const humidity = readings.humidity;
    const soil = readings.soil;
    
    let safetyStatus = 'appears safe';
    let concerns = [];
    
    if (temp > 30) concerns.push('high temperature');
    if (temp < 15) concerns.push('low temperature');
    if (humidity > 80) concerns.push('high humidity');
    if (humidity < 40) concerns.push('low humidity');
    if (soil < 30) concerns.push('dry soil');
    
    if (concerns.length > 0) {
      safetyStatus = `needs attention - ${concerns.join(', ')}`;
    }
    
    return `Based on current sensor data, your lettuce ${safetyStatus}. Temp: ${temp}°C, Humidity: ${humidity}%, Soil: ${soil}%`;
  }
  
  if (isRecommendationQuery && sensorData && sensorData.readings) {
    const readings = sensorData.readings;
    const recommendations = [];
    
    if (readings.temperature > 28) recommendations.push('consider cooling');
    if (readings.temperature < 18) recommendations.push('consider heating');
    if (readings.humidity > 75) recommendations.push('improve ventilation');
    if (readings.humidity < 45) recommendations.push('increase humidity');
    if (readings.soil < 40) recommendations.push('water the plants');
    if (readings.lux < 200) recommendations.push('check lighting');
    
    if (recommendations.length > 0) {
      return `Recommendations: ${recommendations.join(', ')}.`;
    } else {
      return 'Current conditions appear optimal for your lettuce.';
    }
  }
  
  return 'I apologize, but I\'m having trouble connecting to the AI service. Please check your sensor data manually or try again later.';
};

/**
 * Get dynamic AI response using OpenAI API with real sensor data and retry logic
 */
const getAIResponse = async (question, conversationHistory = [], retryCount = 0) => {
  const maxRetries = 2;
  
  try {
    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key not configured');
      const sensorData = await getLatestSensorData();
      return generateFallbackResponse(question, sensorData);
    }
    
    // Get latest sensor data for context
    const sensorData = await getLatestSensorData();
    
    // Debug: Log the actual sensor data structure
    if (sensorData) {
      console.log('Sensor data structure:', JSON.stringify(sensorData, null, 2));
      console.log('Readings object:', JSON.stringify(sensorData.readings, null, 2));
    }
    
    // Check if user is asking for trends/historical data
    const isTrendQuery = question.toLowerCase().includes('trend') || 
                        question.toLowerCase().includes('last') || 
                        question.toLowerCase().includes('history') || 
                        question.toLowerCase().includes('past') ||
                        question.toLowerCase().includes('previous');
    
    let historicalContext = '';
    if (isTrendQuery) {
      // Extract number of days from question (default to 7)
      const daysMatch = question.match(/(\d+)\s*(?:day|days)/i);
      const days = daysMatch ? parseInt(daysMatch[1]) : 7;
      
      const dailyAggregates = await getDailyAggregates(days);
      if (dailyAggregates.length > 0) {
        historicalContext = `
Historical Data Analysis (Last ${days} days):
${dailyAggregates.map((day, index) => 
  `Day ${index + 1}: Avg Temp ${day.avgTemperature?.toFixed(1)}°C, Avg Humidity ${day.avgHumidity?.toFixed(1)}%, Avg Light ${day.avgLux?.toFixed(0)} lux`
).join('\n')}
`;
      }
    }
    
    // Build sensor data context with correct field mapping
    let sensorContext = '';
    if (sensorData && sensorData.readings) {
      console.log('Building sensor context with data:', JSON.stringify(sensorData, null, 2));
      console.log('Readings object:', JSON.stringify(sensorData.readings, null, 2));
      console.log('Light value:', sensorData.readings.lux);
      console.log('Has readings:', !!sensorData.readings);
      
      const readings = sensorData.readings;
      sensorContext = `
Current Greenhouse Sensor Data:
- Temperature: ${readings.temperature || 'N/A'}°C
- Humidity: ${readings.humidity || 'N/A'}%
- Soil Moisture: ${readings.soil || 'N/A'}%
- Light Level: ${readings.lux || 'N/A'} lux
- Air Quality: ${readings.airppm || 'N/A'} ppm
- Last Updated: ${sensorData.timestamp || 'N/A'}
`;
    } else {
      sensorContext = 'No sensor data currently available.';
    }

    // Build conversation history for context (last 3 messages)
    const historyContext = conversationHistory.slice(-6).map(msg => 
      `${msg.role}: ${msg.content}`
    ).join('\n');

    // Determine if user is asking for recommendations
    const isRecommendationQuery = question.toLowerCase().includes('recommend') || 
                                 question.toLowerCase().includes('suggest') || 
                                 question.toLowerCase().includes('should') || 
                                 question.toLowerCase().includes('what should') ||
                                 question.toLowerCase().includes('advice');

    // Build system prompt based on query type
    let systemPrompt = 'You are an expert greenhouse monitoring assistant. ';
    if (isRecommendationQuery) {
      systemPrompt += 'Analyze current and historical sensor data and provide specific, actionable recommendations to improve greenhouse conditions. ';
    } else if (isTrendQuery) {
      systemPrompt += 'Analyze the historical data trends and summarize patterns (increasing, decreasing, stable) with specific values. ';
    } else {
      systemPrompt += 'Answer questions about greenhouse conditions based on current sensor data. ';
    }
    systemPrompt += 'Always be concise (max 3 sentences), specific, and reference actual sensor values when relevant.';

    const fullPrompt = `${sensorContext}

${historicalContext}

Previous conversation context:
${historyContext}

User Question: ${question}

Provide a short, clear, and context-aware response based on the current sensor data and any available historical trends.`;

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
            content: fullPrompt
          }
        ],
        max_tokens: 150,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
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
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
      return getAIResponse(question, conversationHistory, retryCount + 1);
    }
    
    // Fallback response
    console.log('Using fallback response due to API failure');
    const sensorData = await getLatestSensorData();
    return generateFallbackResponse(question, sensorData);
  }
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
        lightLevel: sensorData.readings?.lux || 'N/A',
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
  getAIStatus
};
