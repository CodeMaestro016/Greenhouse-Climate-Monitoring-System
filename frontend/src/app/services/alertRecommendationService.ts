const API_BASE_URL = '';

export interface AlertRecommendation {
  alertId: string;
  recommendation: string;
  generatedBy: 'AI' | 'Fallback' | 'System';
  timestamp?: string;
}

export interface CurrentRecommendation {
  field: string;
  value: number;
  safeRange: string;
  recommendation: string;
  severity: string;
}

export interface CurrentRecommendationsResponse {
  recommendations: CurrentRecommendation[];
  generatedBy: 'AI' | 'Fallback' | 'System';
  timestamp: string;
}

/**
 * Get recommendation for specific alert
 */
export const getAlertRecommendation = async (alertId: string): Promise<AlertRecommendation> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/alert-recommendations/${alertId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to get recommendation');
    }

    return data.data;
  } catch (error) {
    console.error('Error fetching alert recommendation:', error);
    // Return fallback recommendation
    return {
      alertId,
      recommendation: 'Monitor conditions and take appropriate action.',
      generatedBy: 'Fallback'
    };
  }
};

/**
 * Get recommendations for multiple alerts
 */
export const getMultipleRecommendations = async (alertIds: string[]): Promise<AlertRecommendation[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/alert-recommendations/multiple`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ alertIds })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to get recommendations');
    }

    return data.data;
  } catch (error) {
    console.error('Error fetching multiple recommendations:', error);
    return [];
  }
};

/**
 * Get recommendations based on current sensor data
 */
export const getCurrentRecommendations = async (): Promise<CurrentRecommendationsResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/alert-recommendations/current`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to get current recommendations');
    }

    return data.data;
  } catch (error) {
    console.error('Error fetching current recommendations:', error);
    return {
      recommendations: [],
      generatedBy: 'Fallback',
      timestamp: new Date().toISOString()
    };
  }
};
