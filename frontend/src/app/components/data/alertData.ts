export interface Alert {
  id: number;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  message: string;
  time: string;
  date: string;
  sensor: string;
  status: 'active' | 'acknowledged' | 'resolved';
  recommendedAction: string;
}

export const alertsHistory: Alert[] = [
  { 
    id: 1, 
    type: 'Temperature', 
    severity: 'high', 
    title: 'High Temperature Alert', 
    message: 'Temperature exceeded 32°C threshold', 
    time: '2 min ago', 
    date: 'Mar 12, 2026', 
    sensor: 'Temp Sensor #3', 
    status: 'active',
    recommendedAction: 'Reduce temperature to optimal point (26-28°C). Open vents immediately and activate cooling system. Monitor for 15 minutes.'
  },
  { 
    id: 2, 
    type: 'Soil Moisture', 
    severity: 'critical', 
    title: 'Critical Soil Moisture', 
    message: 'Soil moisture at 45% - below safe threshold', 
    time: '5 min ago', 
    date: 'Mar 12, 2026', 
    sensor: 'Soil Sensor #1', 
    status: 'active',
    recommendedAction: 'Irrigate immediately for 15-20 minutes to reach optimal level (50-60%). Check irrigation system for blockages.'
  },
  { 
    id: 3, 
    type: 'Humidity', 
    severity: 'medium', 
    title: 'Humidity Decreasing', 
    message: 'Humidity dropped 3% in last hour', 
    time: '15 min ago', 
    date: 'Mar 12, 2026', 
    sensor: 'Humidity Sensor #2', 
    status: 'active',
    recommendedAction: 'Activate misting system to increase humidity to optimal range (70-80%). Ensure proper ventilation balance.'
  },
  { 
    id: 4, 
    type: 'Light', 
    severity: 'low', 
    title: 'Light Intensity Low', 
    message: 'Light levels below optimal range', 
    time: '1 hour ago', 
    date: 'Mar 12, 2026', 
    sensor: 'Light Sensor #1', 
    status: 'resolved',
    recommendedAction: 'Adjust shade cloth or supplemental lighting to reach 8000-10000 lux. Clean greenhouse panels if dirty.'
  },
  { 
    id: 5, 
    type: 'Temperature', 
    severity: 'medium', 
    title: 'Temperature Rising', 
    message: 'Temperature trending upward', 
    time: '2 hours ago', 
    date: 'Mar 12, 2026', 
    sensor: 'Temp Sensor #1', 
    status: 'acknowledged',
    recommendedAction: 'Monitor temperature closely. Prepare to open vents if temperature exceeds 30°C. Check cooling system readiness.'
  },
  { 
    id: 6, 
    type: 'Soil Moisture', 
    severity: 'high', 
    title: 'Soil Drying Fast', 
    message: 'Rapid moisture loss detected', 
    time: '3 hours ago', 
    date: 'Mar 12, 2026', 
    sensor: 'Soil Sensor #2', 
    status: 'active',
    recommendedAction: 'Start irrigation cycle for 10-15 minutes. Investigate cause of rapid drying - check for drainage issues or heat stress.'
  },
  { 
    id: 7, 
    type: 'Humidity', 
    severity: 'critical', 
    title: 'Low Humidity Alert', 
    message: 'Humidity below 65%', 
    time: '4 hours ago', 
    date: 'Mar 11, 2026', 
    sensor: 'Humidity Sensor #1', 
    status: 'resolved',
    recommendedAction: 'Increase humidity to 70-80% by activating foggers/misters. Close vents partially to retain moisture. Monitor plants for stress.'
  },
  { 
    id: 8, 
    type: 'Light', 
    severity: 'medium', 
    title: 'Light Fluctuation', 
    message: 'Unstable light readings', 
    time: '5 hours ago', 
    date: 'Mar 11, 2026', 
    sensor: 'Light Sensor #2', 
    status: 'acknowledged',
    recommendedAction: 'Check sensor calibration and positioning. Ensure consistent light distribution. Consider adjusting shade cloth controls.'
  },
];

export const alertTrends = [
  { time: '00:00', critical: 2, high: 3, medium: 5, low: 2 },
  { time: '04:00', critical: 1, high: 2, medium: 4, low: 3 },
  { time: '08:00', critical: 3, high: 5, medium: 6, low: 2 },
  { time: '12:00', critical: 5, high: 7, medium: 8, low: 4 },
  { time: '16:00', critical: 4, high: 6, medium: 7, low: 3 },
  { time: '20:00', critical: 2, high: 4, medium: 5, low: 2 },
  { time: '23:59', critical: 3, high: 4, medium: 6, low: 3 }
];

export const alertsByCategory = [
  { name: 'Temperature', value: 25, color: '#ef4444' },
  { name: 'Humidity', value: 30, color: '#3b82f6' },
  { name: 'Soil Moisture', value: 35, color: '#10b981' },
  { name: 'Light Intensity', value: 10, color: '#f59e0b' }
];