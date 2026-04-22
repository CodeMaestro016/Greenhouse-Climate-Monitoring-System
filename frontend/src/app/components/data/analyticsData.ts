export const weeklyData = [
  { day: 'Mon', temp: 27, humidity: 75, soil: 52, light: 8200, alerts: 3 },
  { day: 'Tue', temp: 28, humidity: 73, soil: 50, light: 8300, alerts: 5 },
  { day: 'Wed', temp: 26, humidity: 78, soil: 48, light: 7900, alerts: 7 },
  { day: 'Thu', temp: 29, humidity: 70, soil: 46, light: 8500, alerts: 8 },
  { day: 'Fri', temp: 28, humidity: 72, soil: 45, light: 8400, alerts: 6 },
  { day: 'Sat', temp: 27, humidity: 74, soil: 47, light: 8100, alerts: 4 },
  { day: 'Sun', temp: 28, humidity: 72, soil: 45, light: 8500, alerts: 5 }
];

export const performanceMetrics = [
  { name: 'Uptime', value: 99.8, target: 99.5, status: 'excellent' },
  { name: 'Response Time', value: 1.2, target: 2.0, status: 'good', unit: 's' },
  { name: 'Efficiency', value: 94, target: 90, status: 'excellent' },
  { name: 'Energy Use', value: 85, target: 80, status: 'warning' }
];

export const sensorDistribution = [
  { name: 'Optimal', value: 45, color: '#10b981' },
  { name: 'Warning', value: 35, color: '#f59e0b' },
  { name: 'Critical', value: 20, color: '#ef4444' }
];

export const radarData = [
  { metric: 'Temperature', current: 85, optimal: 95 },
  { metric: 'Humidity', current: 70, optimal: 95 },
  { metric: 'Soil', current: 55, optimal: 95 },
  { metric: 'Light', current: 90, optimal: 95 },
  { metric: 'Stability', current: 75, optimal: 95 },
  { metric: 'Efficiency', current: 88, optimal: 95 }
];

export const correlationData = [
  { hour: '00', tempHumidity: 85, soilTemp: 72, lightTemp: 45 },
  { hour: '04', tempHumidity: 88, soilTemp: 75, lightTemp: 48 },
  { hour: '08', tempHumidity: 78, soilTemp: 68, lightTemp: 65 },
  { hour: '12', tempHumidity: 65, soilTemp: 55, lightTemp: 85 },
  { hour: '16', tempHumidity: 62, soilTemp: 52, lightTemp: 88 },
  { hour: '20', tempHumidity: 75, soilTemp: 65, lightTemp: 70 },
  { hour: '23', tempHumidity: 82, soilTemp: 70, lightTemp: 52 }
];

export const healthCards = [
  {
    id: 'irrigation',
    title: 'Irrigation System',
    value: 'Working',
    note: 'Ventilation: Optimal',
    icon: 'Droplets',
    styles: 'border-emerald-200 bg-emerald-50 text-emerald-700'
  },
  {
    id: 'lighting',
    title: 'Lighting',
    value: 'Need Adjustment',
    note: '',
    icon: 'Sun',
    styles: 'border-amber-200 bg-amber-50 text-amber-700'
  },
  {
    id: 'sensor',
    title: 'Sensor Health',
    value: '3 sensor offline',
    note: '',
    icon: 'Gauge',
    styles: 'border-rose-200 bg-rose-50 text-rose-700'
  }
];

export const systemStatus = [
  { id: 'healthy', label: 'Healthy', value: '72%', styles: 'bg-emerald-100 text-emerald-800' },
  { id: 'diseased', label: 'Diseased', value: '10%', styles: 'bg-rose-100 text-rose-800' }
];