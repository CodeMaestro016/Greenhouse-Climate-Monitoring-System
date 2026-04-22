import { Thermometer, Droplets, Sprout, Sun, TrendingUp, TrendingDown, XCircle, AlertCircle, CheckCircle } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line } from 'recharts';
import { sensorData, riskFactors, warnings } from "../components/data/sensorData";
interface DashboardPageProps {
  dangerLevel: number;
  onOpenAlert: (warning: { title: string; message: string; severity: string }) => void;
}

function SensorCard({ icon: Icon, name, value, unit, status, trend, change, trendData, color }: any) {
  const colorClasses = {
    red: 'bg-red-50 text-red-600 border-red-200',
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200'
  };

  const statusColors = {
    optimal: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    critical: 'bg-red-100 text-red-700'
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all cursor-pointer group">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className={`text-sm font-medium px-2 py-1 rounded-full ${statusColors[status as keyof typeof statusColors]}`}>
          {status}
        </span>
      </div>

      <h3 className="text-base font-medium text-gray-600 mb-2">{name}</h3>

      <div className="flex items-end justify-between mb-3">
        <div>
          <span className="text-2xl font-bold text-gray-900">{value}</span>
          <span className="text-base text-gray-500 ml-1">{unit}</span>
        </div>
        <div className="flex items-center gap-1">
          {trend === 'up' ? (
            <TrendingUp className="w-4 h-4 text-green-600" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-600" />
          )}
          <span className={`text-sm font-medium ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
            {change}
          </span>
        </div>
      </div>

      <div className="h-12">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trendData.map((val: number, idx: number) => ({ value: val, index: idx }))}>
            <Line
              type="monotone"
              dataKey="value"
              stroke={
                color === 'red' ? '#ef4444' :
                color === 'blue' ? '#3b82f6' :
                color === 'green' ? '#10b981' :
                '#f59e0b'
              }
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function DashboardPage({ dangerLevel, onOpenAlert }: DashboardPageProps) {
  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Left Column - Sensors and Risk Engine */}
      <div className="col-span-9 space-y-6">
        {/* Sensor Cards Grid */}
        <div className="grid grid-cols-4 gap-4">
          <SensorCard
            icon={Thermometer}
            name="Temperature"
            value={sensorData.temperature.current}
            unit={sensorData.temperature.unit}
            status={sensorData.temperature.status}
            trend={sensorData.temperature.trend}
            change={sensorData.temperature.change}
            trendData={sensorData.temperature.trendData}
            color="red"
          />
          <SensorCard
            icon={Droplets}
            name="Humidity"
            value={sensorData.humidity.current}
            unit={sensorData.humidity.unit}
            status={sensorData.humidity.status}
            trend={sensorData.humidity.trend}
            change={sensorData.humidity.change}
            trendData={sensorData.humidity.trendData}
            color="blue"
          />
          <SensorCard
            icon={Sprout}
            name="Soil Moisture"
            value={sensorData.soilMoisture.current}
            unit={sensorData.soilMoisture.unit}
            status={sensorData.soilMoisture.status}
            trend={sensorData.soilMoisture.trend}
            change={sensorData.soilMoisture.change}
            trendData={sensorData.soilMoisture.trendData}
            color="green"
          />
          <SensorCard
            icon={Sun}
            name="Light Intensity"
            value={sensorData.lightIntensity.current}
            unit={sensorData.lightIntensity.unit}
            status={sensorData.lightIntensity.status}
            trend={sensorData.lightIntensity.trend}
            change={sensorData.lightIntensity.change}
            trendData={sensorData.lightIntensity.trendData}
            color="yellow"
          />
        </div>

        {/* Smart Risk Engine */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-5">Smart Risk Engine</h2>

          <div className="grid grid-cols-[260px_1fr] gap-8 items-center">
            {/* Gauge */}
            <div className="flex items-center justify-center">
              <div className="relative w-44 h-44">
                <svg className="w-full h-full -rotate-90">
                  <circle cx="88" cy="88" r="70" fill="none" stroke="#f3f4f6" strokeWidth="18" />
                  <circle
                    cx="88"
                    cy="88"
                    r="70"
                    fill="none"
                    stroke={dangerLevel >= 70 ? '#ef4444' : dangerLevel >= 40 ? '#f59e0b' : '#22c55e'}
                    strokeWidth="18"
                    strokeDasharray={`${dangerLevel * 4.4} ${440 - dangerLevel * 4.4}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-gray-900">{dangerLevel}%</span>
                  <span className="text-base text-gray-500 uppercase tracking-wide">Danger Level</span>
                  <span className="text-sm mt-1 text-amber-700 font-medium">
                    {dangerLevel > 70 ? 'High Risk' : dangerLevel > 40 ? 'Medium Risk' : 'Low Risk'}
                  </span>
                </div>
              </div>
            </div>

            {/* Risk Factors */}
            <div>
              <h3 className="text-base font-semibold text-gray-700 mb-4">Risk Factors</h3>
              <div className="space-y-4">
                {riskFactors.map((factor) => (
                  <div key={factor.name}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-base text-gray-700">{factor.name}</span>
                      <span className="text-base font-semibold text-gray-900">{factor.value}%</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${factor.value}%`, backgroundColor: factor.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Alerts Panel */}
      <div className="col-span-3">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm h-[420px] p-4 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Alerts</h2>
            <span className="text-sm font-semibold text-red-700 bg-red-100 px-2 py-1 rounded-full">
              {warnings.length} Active
            </span>
          </div>

          <div className="space-y-3 overflow-y-auto pr-1">
            {warnings.map((warning) => {
              const isHigh = warning.severity === 'high';
              const isMedium = warning.severity === 'medium';

              return (
                <button
                  type="button"
                  key={warning.id}
                  onClick={() => onOpenAlert?.(warning)}
                  className={`rounded-lg border p-3 ${
                    isHigh
                      ? 'border-red-200 bg-red-50'
                      : isMedium
                      ? 'border-amber-200 bg-amber-50'
                      : 'border-blue-200 bg-blue-50'
                  } text-left w-full hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400`}
                >
                  <div className="flex items-start gap-2.5">
                    {isHigh ? (
                      <XCircle className="w-4 h-4 text-red-600 mt-0.5" />
                    ) : isMedium ? (
                      <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                    )}
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold ${isHigh ? 'text-red-700' : isMedium ? 'text-amber-700' : 'text-blue-700'}`}>
                        {isHigh ? 'Critical' : isMedium ? 'Medium' : 'Low'}
                      </p>
                      <p className="text-base font-medium text-gray-900 leading-snug mt-0.5">{warning.title}</p>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{warning.message}</p>
                      <p className="text-sm text-gray-500 mt-1.5">{warning.time}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}