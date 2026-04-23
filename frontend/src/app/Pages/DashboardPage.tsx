import { Thermometer, Droplets, Sprout, Sun, TrendingUp, TrendingDown, XCircle, AlertCircle, CheckCircle } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line } from 'recharts';
import { sensorData, riskFactors, warnings } from "../components/data/sensorData";
interface DashboardPageProps {
  dangerLevel: number;
  onOpenAlert: (warning: { title: string; message: string; severity: string }) => void;
}

function SensorCard({ icon: Icon, name, value, unit, status, trend, change, trendData, color }: any) {
  const colorClasses = {
    red: 'bg-gradient-to-br from-red-100 to-red-50 text-red-600 border-red-200',
    blue: 'bg-gradient-to-br from-blue-100 to-blue-50 text-blue-600 border-blue-200',
    green: 'bg-gradient-to-br from-green-100 to-green-50 text-green-600 border-green-200',
    yellow: 'bg-gradient-to-br from-yellow-100 to-yellow-50 text-yellow-600 border-yellow-200'
  };

  const statusColors = {
    optimal: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md',
    warning: 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white shadow-md',
    critical: 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-md'
  };

  return (
    <div className="greenhouse-card rounded-2xl p-5 hover:scale-105 cursor-pointer group relative overflow-hidden">
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-200/20 to-transparent rounded-full -translate-y-10 translate-x-10"></div>
      
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className={`p-3 rounded-xl ${colorClasses[color as keyof typeof colorClasses]} shadow-sm group-hover:scale-110 transition-transform duration-200`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${statusColors[status as keyof typeof statusColors]} shadow-sm`}>
          {status}
        </span>
      </div>

      <h3 className="text-sm font-semibold text-gray-700 mb-3 relative z-10">{name}</h3>

      <div className="flex items-end justify-between mb-4 relative z-10">
        <div>
          <span className="text-3xl font-bold sensor-value">{value}</span>
          <span className="text-lg text-gray-600 ml-1">{unit}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {trend === 'up' ? (
            <TrendingUp className="w-4 h-4 text-green-600" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-600" />
          )}
          <span className={`text-sm font-semibold ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
            {change}
          </span>
        </div>
      </div>

      <div className="h-14 relative z-10">
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
              strokeWidth={2.5}
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
      {/* Left Column - Sensors and Risk Engine */}
      <div className="col-span-1 lg:col-span-9 space-y-4 lg:space-y-6">
        {/* Sensor Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
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
        <div className="greenhouse-card rounded-2xl p-6 nature-shadow">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg">
              <AlertCircle className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Smart Risk Engine</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 lg:gap-8 items-center">
            {/* Gauge */}
            <div className="flex items-center justify-center">
              <div className="relative w-48 h-48">
                <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 rounded-full"></div>
                <svg className="w-full h-full -rotate-90 relative">
                  <circle cx="96" cy="96" r="75" fill="none" stroke="rgba(34, 197, 94, 0.1)" strokeWidth="20" />
                  <circle
                    cx="96"
                    cy="96"
                    r="75"
                    fill="none"
                    stroke={dangerLevel >= 70 ? '#ef4444' : dangerLevel >= 40 ? '#f59e0b' : '#22c55e'}
                    strokeWidth="20"
                    strokeDasharray={`${dangerLevel * 4.7} ${470 - dangerLevel * 4.7}`}
                    strokeLinecap="round"
                    className="drop-shadow-sm"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold sensor-value">{dangerLevel}%</span>
                  <span className="text-sm text-gray-600 uppercase tracking-wider font-medium">Danger Level</span>
                  <span className={`text-sm mt-2 px-3 py-1 rounded-full text-white font-semibold text-xs ${
                    dangerLevel > 70 ? 'bg-gradient-to-r from-red-500 to-rose-600' : 
                    dangerLevel > 40 ? 'bg-gradient-to-r from-yellow-500 to-amber-600' : 
                    'bg-gradient-to-r from-green-500 to-emerald-600'
                  }`}>
                    {dangerLevel > 70 ? 'High Risk' : dangerLevel > 40 ? 'Medium Risk' : 'Low Risk'}
                  </span>
                </div>
              </div>
            </div>

            {/* Risk Factors */}
            <div className="space-y-5">
              <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Risk Factors Analysis
              </h3>
              <div className="space-y-4">
                {riskFactors.map((factor) => (
                  <div key={factor.name} className="group">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 group-hover:text-green-700 transition-colors">{factor.name}</span>
                      <span className="text-sm font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded-lg">{factor.value}%</span>
                    </div>
                    <div className="h-3 rounded-full bg-gray-100 overflow-hidden shadow-inner">
                      <div
                        className="h-full rounded-full transition-all duration-500 ease-out shadow-sm"
                        style={{ 
                          width: `${factor.value}%`, 
                          backgroundColor: factor.color,
                          boxShadow: `0 0 10px ${factor.color}40`
                        }}
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
      <div className="col-span-1 lg:col-span-3">
        <div className="greenhouse-card rounded-2xl h-[420px] lg:h-[420px] p-4 lg:p-5 flex flex-col nature-shadow">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl shadow-lg">
                <AlertCircle className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-lg font-bold text-gray-800">Alerts</h2>
            </div>
            <span className="text-xs font-bold text-white bg-gradient-to-r from-red-500 to-rose-600 px-3 py-1.5 rounded-full shadow-md">
              {warnings.length} Active
            </span>
          </div>

          <div className="space-y-3 overflow-y-auto pr-2 flex-1">
            {warnings.map((warning) => {
              const isHigh = warning.severity === 'high';
              const isMedium = warning.severity === 'medium';

              return (
                <button
                  type="button"
                  key={warning.id}
                  onClick={() => onOpenAlert?.(warning)}
                  className={`rounded-xl border p-4 transition-all duration-200 hover:scale-102 hover:shadow-md ${
                    isHigh
                      ? 'border-red-200/50 bg-gradient-to-br from-red-50 to-rose-50 hover:border-red-300/70'
                      : isMedium
                      ? 'border-amber-200/50 bg-gradient-to-br from-amber-50 to-yellow-50 hover:border-amber-300/70'
                      : 'border-blue-200/50 bg-gradient-to-br from-blue-50 to-sky-50 hover:border-blue-300/70'
                  } text-left w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400 relative overflow-hidden group`}
                >
                  <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-white/20 to-transparent rounded-full -translate-y-8 translate-x-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <div className="flex items-start gap-3 relative z-10">
                    <div className={`p-2 rounded-lg ${
                      isHigh 
                        ? 'bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-md' 
                        : isMedium 
                        ? 'bg-gradient-to-br from-amber-500 to-yellow-600 text-white shadow-md'
                        : 'bg-gradient-to-br from-blue-500 to-sky-600 text-white shadow-md'
                    }`}>
                      {isHigh ? (
                        <XCircle className="w-4 h-4" />
                      ) : isMedium ? (
                        <AlertCircle className="w-4 h-4" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-bold uppercase tracking-wide mb-1 ${
                        isHigh ? 'text-red-700' : isMedium ? 'text-amber-700' : 'text-blue-700'
                      }`}>
                        {isHigh ? 'Critical' : isMedium ? 'Medium' : 'Low'}
                      </p>
                      <p className="text-sm font-semibold text-gray-900 leading-snug mb-1">{warning.title}</p>
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">{warning.message}</p>
                      <p className="text-xs text-gray-500 font-medium">{warning.time}</p>
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