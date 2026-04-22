import { useState } from 'react';
import { Droplets, Sun, Gauge, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { weeklyData, healthCards, systemStatus, performanceMetrics, radarData, correlationData } from "../components/data/analyticsData";

export function AnalyticsPage() {
  const [analyticsRange, setAnalyticsRange] = useState('3m');

  const getIcon = (iconName: string) => {
    switch(iconName) {
      case 'Droplets': return Droplets;
      case 'Sun': return Sun;
      case 'Gauge': return Gauge;
      default: return Droplets;
    }
  };

  return (
    <div className="space-y-6">
      {/* System Health Overview */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">System Health Overview</h2>

        <div className="grid grid-cols-12 gap-4">
          {healthCards.map((card) => {
            const Icon = getIcon(card.icon);
            return (
              <div key={card.id} className={`col-span-3 rounded-lg border p-4 ${card.styles}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-lg font-semibold text-gray-700">{card.title}</p>
                    <p className="text-xl font-medium mt-1">{card.value}</p>
                    {card.note && <p className="text-base text-gray-600 mt-2">{card.note}</p>}
                  </div>
                  <div className="p-2 rounded-md bg-white/70">
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
              </div>
            );
          })}

          <div className="col-span-3 rounded-lg border border-violet-200 bg-violet-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold text-violet-800">Plant Growth Analysis</p>
                <p className="text-base text-violet-700 mt-1">Weekly progress</p>
              </div>
              <TrendingUp className="w-6 h-6 text-violet-700" />
            </div>
            <div className="mt-4 flex items-end gap-1 h-16">
              <div className="w-3 h-8 bg-violet-300 rounded-sm" />
              <div className="w-3 h-12 bg-violet-400 rounded-sm" />
              <div className="w-3 h-6 bg-violet-200 rounded-sm" />
              <div className="w-3 h-14 bg-violet-500 rounded-sm" />
              <div className="w-3 h-10 bg-violet-300 rounded-sm" />
              <div className="w-3 h-7 bg-violet-200 rounded-sm" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4 mt-4">
          <div className="col-span-7 flex gap-4">
            {systemStatus.map((item) => (
              <div key={item.id} className={`flex-1 rounded-lg px-4 py-3 ${item.styles}`}>
                <p className="text-base font-semibold">{item.label}</p>
                <p className="text-2xl font-bold mt-1">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="col-span-5 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
            <p className="text-base font-semibold text-gray-700">Current Weight: 45KG</p>
            <p className="text-sm text-gray-600 mt-1">Weekly change: +8%</p>
            <div className="mt-3 h-2 rounded-full bg-gray-200 overflow-hidden">
              <div className="h-full w-[65%] rounded-full bg-gray-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">Performance Metrics</h3>
        <div className="grid grid-cols-4 gap-4">
          {performanceMetrics.map((metric) => (
            <div key={metric.name} className="rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-500">{metric.name}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {metric.value}{metric.unit || ''}
              </p>
              <p className={`text-sm mt-2 ${
                metric.status === 'excellent' ? 'text-green-600' :
                metric.status === 'good' ? 'text-blue-600' : 'text-yellow-600'
              }`}>
                Target: {metric.target}{metric.unit || ''}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Environmental Correlation Analysis */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-700">Detailed Reports</h3>
            <p className="text-2xl font-semibold text-gray-900 mt-1">Environmental Correlation Analysis</p>
          </div>
          <select
            value={analyticsRange}
            onChange={(e) => setAnalyticsRange(e.target.value)}
            className="text-base px-3 py-2 border border-gray-200 rounded-md bg-white"
          >
            <option value="1w">Last Week</option>
            <option value="2w">Last 2 Weeks</option>
            <option value="1m">Last Month</option>
            <option value="3m">Last 3 Months</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-6 mt-4">
          {/* Soil Moisture Chart */}
          <div className="rounded-lg border border-gray-200 p-4">
            <h4 className="text-lg font-semibold text-gray-700 mb-3">Soil Moisture Trend</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="day" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="soil" stroke="#6366f1" strokeWidth={2} name="Soil Moisture (%)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Temperature vs Humidity */}
          <div className="rounded-lg border border-gray-200 p-4">
            <h4 className="text-lg font-semibold text-gray-700 mb-3">Temperature vs Humidity Correlation</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyData}>
                  <defs>
                    <linearGradient id="humidityGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="day" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="humidity" stroke="#22c55e" strokeWidth={2} fill="url(#humidityGradient)" name="Humidity (%)" />
                  <Area type="monotone" dataKey="temp" stroke="#ef4444" strokeWidth={2} fill="url(#tempGradient)" name="Temperature (°C)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}