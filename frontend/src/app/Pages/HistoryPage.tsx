import { useState } from 'react';
import { 
  Search, Download, Filter, Calendar, Thermometer, 
  Droplets, Sprout, Sun, TrendingUp, TrendingDown 
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, CartesianGrid, 
  XAxis, YAxis, Tooltip, Legend, Area, ComposedChart, Bar 
} from 'recharts';
import { detailedHistoricalData, hourlyData, monthlyAverages } from "../components/data/historicalData";
export function HistoryPage() {
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedSensor, setSelectedSensor] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const getChartData = () => {
    switch(timeRange) {
      case '24h': return hourlyData.slice(0, 24);
      case '7d': return detailedHistoricalData;
      case '30d': return [...detailedHistoricalData, ...detailedHistoricalData.map(d => ({ ...d, date: `Mar ${parseInt(d.date.split(' ')[1]) + 7}` }))];
      case '3m': return monthlyAverages;
      default: return detailedHistoricalData;
    }
  };

  const chartData = getChartData();
  const xAxisKey = timeRange === '24h' ? 'hour' : timeRange === '3m' ? 'month' : 'date';

  const statsCards = [
    {
      title: 'Average Temperature',
      value: '28.1°C',
      range: '24.5°C - 30.2°C',
      trend: '+0.8°C',
      trendUp: true,
      icon: Thermometer,
      color: 'red'
    },
    {
      title: 'Average Humidity',
      value: '74%',
      range: '68% - 82%',
      trend: '-3%',
      trendUp: false,
      icon: Droplets,
      color: 'blue'
    },
    {
      title: 'Average Soil Moisture',
      value: '51%',
      range: '43% - 89%',
      trend: '-8%',
      trendUp: false,
      icon: Sprout,
      color: 'green'
    },
    {
      title: 'Average Light Intensity',
      value: '10.3K lux',
      range: '7.8K - 18K lux',
      trend: '+5%',
      trendUp: true,
      icon: Sun,
      color: 'amber'
    }
  ];

  const getColorClass = (color: string) => {
    switch(color) {
      case 'red': return 'bg-red-50 border-red-200';
      case 'blue': return 'bg-blue-50 border-blue-200';
      case 'green': return 'bg-emerald-50 border-emerald-200';
      case 'amber': return 'bg-amber-50 border-amber-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getIconColorClass = (color: string) => {
    switch(color) {
      case 'red': return 'bg-red-100 text-red-600';
      case 'blue': return 'bg-blue-100 text-blue-600';
      case 'green': return 'bg-emerald-100 text-emerald-600';
      case 'amber': return 'bg-amber-100 text-amber-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  // Sample historical table data
  const historicalTableData = [
    { date: '2026-03-12', time: '14:30:00', temperature: 28.5, humidity: 72, soilMoisture: 45, light: 8500 },
    { date: '2026-03-12', time: '13:30:00', temperature: 28.2, humidity: 73, soilMoisture: 46, light: 8200 },
    { date: '2026-03-12', time: '12:30:00', temperature: 29.1, humidity: 71, soilMoisture: 47, light: 9100 },
    { date: '2026-03-12', time: '11:30:00', temperature: 28.8, humidity: 72, soilMoisture: 48, light: 8800 },
    { date: '2026-03-12', time: '10:30:00', temperature: 27.9, humidity: 74, soilMoisture: 49, light: 7500 },
    { date: '2026-03-12', time: '09:30:00', temperature: 26.5, humidity: 76, soilMoisture: 50, light: 6200 },
  ];

  const filteredTableData = historicalTableData.filter(row => {
    const matchesSearch = !searchQuery || 
      row.date.includes(searchQuery) || 
      row.time.includes(searchQuery) ||
      row.temperature.toString().includes(searchQuery);
    
    const matchesDateRange = (!dateRange.start || row.date >= dateRange.start) &&
      (!dateRange.end || row.date <= dateRange.end);
    
    return matchesSearch && matchesDateRange;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Historical Data</h2>
          <p className="text-base text-gray-500 mt-1">View and analyze historical sensor readings and trends</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="3m">Last 3 Months</option>
          </select>
          <button className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className={`rounded-lg border p-4 ${getColorClass(stat.color)}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{stat.range}</p>
                </div>
                <div className={`p-2 rounded-md ${getIconColorClass(stat.color)}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-3">
                {stat.trendUp ? (
                  <TrendingUp className="w-3 h-3 text-green-600" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-600" />
                )}
                <span className={`text-xs font-medium ${stat.trendUp ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.trend}
                </span>
                <span className="text-xs text-gray-500 ml-1">vs last period</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6">
        {/* Temperature Chart */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Temperature Trends</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey={xAxisKey} stroke="#6b7280" />
                <YAxis stroke="#6b7280" domain={['auto', 'auto']} />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey={timeRange === '3m' ? 'avgTemp' : 'temp'} 
                  stroke="#ef4444" 
                  strokeWidth={2} 
                  name="Temperature (°C)"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Humidity Chart */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Humidity Trends</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey={xAxisKey} stroke="#6b7280" />
                <YAxis stroke="#6b7280" domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey={timeRange === '3m' ? 'avgHumidity' : 'humidity'} 
                  stroke="#3b82f6" 
                  strokeWidth={2} 
                  name="Humidity (%)"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Soil Moisture Chart */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Soil Moisture Trends</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey={xAxisKey} stroke="#6b7280" />
                <YAxis stroke="#6b7280" domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey={timeRange === '3m' ? 'avgSoil' : 'soil'} 
                  stroke="#22c55e" 
                  strokeWidth={2} 
                  name="Soil Moisture (%)"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Light Intensity Chart */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Light Intensity Trends</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey={xAxisKey} stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey={timeRange === '3m' ? 'avgLight' : 'light'} 
                  stroke="#f59e0b" 
                  strokeWidth={2} 
                  name="Light Intensity (lux)"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Sensor Data History</h3>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm bg-white"
              />
              <span className="text-sm text-gray-500">to</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm bg-white"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200">
              <tr className="text-left text-gray-600">
                <th className="pb-3 font-semibold">Date</th>
                <th className="pb-3 font-semibold">Time</th>
                <th className="pb-3 font-semibold">Temperature</th>
                <th className="pb-3 font-semibold">Humidity</th>
                <th className="pb-3 font-semibold">Soil Moisture</th>
                <th className="pb-3 font-semibold">Light Intensity</th>
              </tr>
            </thead>
            <tbody>
              {filteredTableData.map((row, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 text-gray-700">{row.date}</td>
                  <td className="py-3 text-gray-700">{row.time}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-1">
                      <Thermometer className="w-3 h-3 text-red-500" />
                      <span className="text-gray-700">{row.temperature}°C</span>
                    </div>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-1">
                      <Droplets className="w-3 h-3 text-blue-500" />
                      <span className="text-gray-700">{row.humidity}%</span>
                    </div>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-1">
                      <Sprout className="w-3 h-3 text-emerald-500" />
                      <span className="text-gray-700">{row.soilMoisture}%</span>
                    </div>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-1">
                      <Sun className="w-3 h-3 text-amber-500" />
                      <span className="text-gray-700">{row.light.toLocaleString()} lux</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}