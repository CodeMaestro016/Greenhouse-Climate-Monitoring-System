export const historicalData = [
  { time: '00:00', danger: 25, temp: 24, humidity: 80, soil: 55 },
  { time: '04:00', danger: 30, temp: 23, humidity: 82, soil: 54 },
  { time: '08:00', danger: 45, temp: 26, humidity: 78, soil: 52 },
  { time: '12:00', danger: 60, temp: 29, humidity: 75, soil: 48 },
  { time: '16:00', danger: 70, temp: 30, humidity: 72, soil: 46 },
  { time: '20:00', danger: 65, temp: 28, humidity: 74, soil: 45 },
  { time: '23:59', danger: 55, temp: 26, humidity: 76, soil: 45 }
];

export const detailedHistoricalData = [
  { date: 'Mar 5', temp: 26.5, humidity: 78, soil: 55, light: 8100, danger: 25 },
  { date: 'Mar 6', temp: 27.2, humidity: 76, soil: 54, light: 8200, danger: 28 },
  { date: 'Mar 7', temp: 28.0, humidity: 74, soil: 52, light: 8300, danger: 35 },
  { date: 'Mar 8', temp: 27.5, humidity: 75, soil: 51, light: 8150, danger: 32 },
  { date: 'Mar 9', temp: 29.0, humidity: 71, soil: 49, light: 8400, danger: 45 },
  { date: 'Mar 10', temp: 28.8, humidity: 72, soil: 48, light: 8350, danger: 50 },
  { date: 'Mar 11', temp: 29.5, humidity: 70, soil: 46, light: 8500, danger: 58 },
  { date: 'Mar 12', temp: 28.5, humidity: 72, soil: 45, light: 8500, danger: 62 },
];

export const hourlyData = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i.toString().padStart(2, '0')}:00`,
  temp: 24 + Math.sin(i / 3.8) * 5 + Math.random() * 2,
  humidity: 75 + Math.cos(i / 3.8) * 8 + Math.random() * 3,
  soil: 50 - i * 0.3 + Math.random() * 2,
  light: i >= 6 && i <= 18 ? 7000 + Math.sin((i - 6) / 3.8) * 2000 + Math.random() * 500 : 0
}));

export const monthlyAverages = [
  { month: 'Jan', avgTemp: 24.5, avgHumidity: 78, avgSoil: 58, avgLight: 7800 },
  { month: 'Feb', avgTemp: 25.2, avgHumidity: 76, avgSoil: 57, avgLight: 8000 },
  { month: 'Mar', avgTemp: 28.1, avgHumidity: 74, avgSoil: 51, avgLight: 8300 },
];