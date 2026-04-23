/**
 * Enhanced AI Assistant Service
 * Handles API communication with the backend AI assistant including conversation management
 */

const API_BASE_URL = 'http://localhost:5000';

export interface AIResponse {
  success: boolean;
  response: string;
  conversationId?: string;
  timestamp?: string;
  message?: string;
}

export interface AIStatus {
  success: boolean;
  aiEnabled: boolean;
  provider: string;
  sensorData?: {
    temperature: number;
    humidity: number;
    soilMoisture: number;
    lightLevel: number;
    airQuality: number;
    timestamp: string;
  };
  recommendations?: string[];
  timestamp: string;
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface Conversation {
  conversationId: string;
  sessionId: string;
  messages: ConversationMessage[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Send a question to the AI assistant with conversation support
 */
export const chatWithAI = async (
  question: string, 
  conversationId?: string, 
  sessionId?: string
): Promise<AIResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai-assistant/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        question, 
        conversationId, 
        sessionId: sessionId || 'default_session' 
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: AIResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error chatting with AI:', error);
    // Return a fallback response
    return {
      success: false,
      response: 'I apologize, but I\'m having trouble connecting right now. Please try again in a moment.',
      message: 'API connection failed'
    };
  }
};

/**
 * Get conversation history by ID
 */
export const getConversationHistory = async (conversationId: string): Promise<{
  success: boolean;
  conversation?: Conversation;
  message?: string;
}> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai-assistant/conversation/${conversationId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      conversation: data.conversation
    };
  } catch (error) {
    console.error('Error getting conversation history:', error);
    return {
      success: false,
      message: 'Failed to load conversation history'
    };
  }
};

/**
 * Get AI assistant status with sensor data and recommendations
 */
export const getAIStatus = async (): Promise<AIStatus> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai-assistant/status`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: AIStatus = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting AI status:', error);
    // Return fallback status
    return {
      success: false,
      aiEnabled: false,
      provider: 'Rule-based',
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Generate a unique session ID for the user
 */
export const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};
