export interface SensorReading {
  current: number;
  unit: string;
  status: 'optimal' | 'warning' | 'critical';
  trend: 'up' | 'down';
  change: string;
  trendData: number[];
}

export const sensorData = {
  temperature: {
    current: 28.5,
    unit: '°C',
    status: 'optimal',
    trend: 'up',
    change: '+1.2',
    trendData: [26, 26.5, 27, 27.2, 27.8, 28.1, 28.5]
  },
  humidity: {
    current: 72,
    unit: '%',
    status: 'warning',
    trend: 'down',
    change: '-3',
    trendData: [78, 77, 76, 75, 74, 73, 72]
  },
  soilMoisture: {
    current: 45,
    unit: '%',
    status: 'critical',
    trend: 'down',
    change: '-8',
    trendData: [55, 53, 51, 49, 47, 46, 45]
  },
  lightIntensity: {
    current: 8500,
    unit: 'lux',
    status: 'optimal',
    trend: 'up',
    change: '+200',
    trendData: [7800, 8000, 8100, 8200, 8300, 8400, 8500]
  }
} as const;

export const riskFactors = [
  { name: 'Soil Moisture', value: 65, color: '#ef4444' },
  { name: 'Humidity', value: 40, color: '#f59e0b' },
  { name: 'Temperature', value: 20, color: '#10b981' },
  { name: 'Light', value: 15, color: '#3b82f6' }
];

export const adviceCards = [
  {
    icon: 'Droplets',
    title: 'Water your plants now',
    description: 'Soil moisture is low. Irrigate for 15 minutes.',
    priority: 'high',
    action: 'Start Irrigation'
  },
  {
    icon: 'Sun',
    title: 'Adjust shade cloth',
    description: 'Light levels are good, maintain current setup.',
    priority: 'low',
    action: 'View Settings'
  },
  {
    icon: 'Thermometer',
    title: 'Temperature rising',
    description: 'Open vents if temp exceeds 30°C.',
    priority: 'medium',
    action: 'Open Vents'
  }
];

export const warnings = [
  {
    id: 1,
    severity: 'high',
    title: 'Critical Soil Moisture',
    message: 'Soil moisture at 45% - below safe threshold',
    time: '2 min ago',
    action: 'Irrigate Now'
  },
  {
    id: 2,
    severity: 'medium',
    title: 'Humidity Decreasing',
    message: 'Humidity dropped 3% in last hour',
    time: '15 min ago',
    action: 'Check Misters'
  },
  {
    id: 3,
    severity: 'low',
    title: 'Temperature Normal',
    message: 'All temperature readings within range',
    time: '1 hour ago',
    action: 'View Details'
  }
];