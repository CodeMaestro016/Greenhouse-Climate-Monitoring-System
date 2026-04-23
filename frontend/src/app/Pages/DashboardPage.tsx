import { useEffect, useMemo, useState } from 'react'; 
import { 
  Thermometer, Droplets, Sprout, Sun, Wind, TrendingUp, 
  TrendingDown, XCircle, AlertCircle, CheckCircle, Wifi, WifiOff, Activity
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line } from 'recharts';
import { ForecastView } from './ForecastView';

type SensorStatus = 'optimal' | 'warning' | 'critical';

type SensorRecord = {
  timestamp?: string;
  readings?: {
    temperature?: number;
    humidity?: number;
    soil?: number;
    lux?: number;
    light?: number;
    airppm?: number;
  };
  temperature?: number;
  humidity?: number;
  soil?: number;
  lux?: number;
  airppm?: number;
  sensorId?: string;
};

type DashboardWarning = {
  id: number;
  severity: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  time: string;
  action: string;
};

interface DashboardPageProps {
  dangerLevel: number;
  onOpenAlert: (warning: { title: string; message: string; severity: string }) => void;
}

// Helper function for relative time
const formatRelativeUpdateTime = (date: Date | null): string => {
  if (!date) return 'Waiting for first update';
  
  const diffSeconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  
  if (diffSeconds < 10) return 'Just now';
  if (diffSeconds < 60) return `${diffSeconds}s ago`;
  
  const minutes = Math.floor(diffSeconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m ago` : `${hours}h ago`;
  }
  
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

// Temperature messages
const getTemperatureMessage = (temp: number | null): string => {
  if (temp === null) return 'No reading';
  if (temp < 20) return 'Too cold';
  if (temp <= 22) return 'Slightly cool';
  if (temp <= 26) return 'Good condition';
  if (temp <= 28) return 'Slightly warm';
  return 'Too hot';
};

// Humidity messages
const getHumidityMessage = (hum: number | null): string => {
  if (hum === null) return 'No reading';
  if (hum < 50) return 'Too dry';
  if (hum <= 55) return 'Slightly dry';
  if (hum <= 65) return 'Good condition';
  if (hum <= 75) return 'Slightly humid';
  return 'Too humid';
};

// Soil messages
const getSoilMessage = (soil: number | null): string => {
  if (soil === null) return 'No reading';
  if (soil < 60) return 'Soil is dry';
  if (soil <= 65) return 'Soil slightly dry';
  if (soil <= 75) return 'Good condition';
  if (soil <= 80) return 'Soil slightly wet';
  return 'Soil too wet';
};

// Light messages
const getLightMessage = (light: number | null): string => {
  if (light === null) return 'No reading';
  if (light < 8000) return 'Low light';
  if (light <= 10000) return 'Light slightly low';
  if (light <= 15000) return 'Good condition';
  if (light <= 20000) return 'Light slightly strong';
  return 'Too much light';
};

// Air quality messages
const getAirMessage = (air: number | null): string => {
  if (air === null) return 'No reading';
  if (air <= 150) return 'Clean air';
  if (air <= 300) return 'Air needs attention';
  return 'Bad air';
};

// Helper function to get status display text with emoji
const getStatusDisplay = (status: SensorStatus): string => {
  switch (status) {
    case 'optimal':
      return '🟢 Good';
    case 'warning':
      return '🟡 Watch';
    case 'critical':
      return '🔴 Action needed';
    default:
      return '🟢 Good';
  }
};

// TimeAgo Component
const TimeAgo = ({ date, className = '' }: { date: Date | null; className?: string }) => {
  const [, forceUpdate] = useState({});
  
  useEffect(() => {
    const interval = window.setInterval(() => forceUpdate({}), 1000);
    return () => clearInterval(interval);
  }, []);
  
  if (!date) return <span className={className}>No data</span>;
  
  const isStale = (Date.now() - date.getTime()) > 300000;
  const timeText = formatRelativeUpdateTime(date);
  
  return (
    <span className={`${className} ${isStale ? 'text-red-500' : 'text-gray-400'}`}>
      {timeText}
    </span>
  );
};

// SensorCard component
function SensorCard({ 
  icon: Icon, 
  name, 
  value, 
  unit, 
  status, 
  trendData, 
  color,
  lastUpdate,
  message
}: any) {
  const colorClasses = {
    red: 'bg-red-50 text-red-600 border-red-200',
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    violet: 'bg-violet-50 text-violet-600 border-violet-200'
  };

  const getStatusBadgeClass = (status: string) => {
    if (status === 'optimal') return 'bg-green-100 text-green-700';
    if (status === 'warning') return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  const messageParts = message.split('\n');
  const mainMessage = messageParts[0];
  const actionMessage = messageParts[1];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all cursor-pointer group flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className={`text-sm font-medium px-2 py-1 rounded-full ${getStatusBadgeClass(status)}`}>
          {getStatusDisplay(status)}
        </span>
      </div>

      <h3 className="text-base font-medium text-gray-600 mb-2">{name}</h3>

      <div className="flex items-end justify-between mb-1">
        <div>
          <span className="text-2xl font-bold text-gray-900">{value}</span>
          <span className="text-base text-gray-500 ml-1">{unit}</span>
        </div>
      </div>

      <div className="mb-2">
        <TimeAgo date={lastUpdate} className="text-xs" />
      </div>

      <div className="h-12 mb-3">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trendData.map((val: number, idx: number) => ({ value: val, index: idx }))}>
            <Line
              type="monotone"
              dataKey="value"
              stroke={
                color === 'red' ? '#ef4444' :
                color === 'blue' ? '#3b82f6' :
                color === 'green' ? '#10b981' :
                color === 'violet' ? '#7c3aed' :
                '#f59e0b'
              }
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex-grow"></div>

      <div className="mt-2 pt-2 border-t border-gray-100">
        <p className="text-sm font-medium text-gray-700 text-center">
          {mainMessage}
        </p>
        {actionMessage && (
          <p className="text-xs font-semibold text-emerald-600 text-center mt-1">
            {actionMessage}
          </p>
        )}
      </div>
    </div>
  );
}

export function DashboardPage({ dangerLevel, onOpenAlert }: DashboardPageProps) {
  const [dashboardRecords, setDashboardRecords] = useState<SensorRecord[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [currentSensorId, setCurrentSensorId] = useState<string>('GH001');
  const [coordinates] = useState({ lat: 6.9271, lon: 79.8612 });
  
  // Force re-render every second for time-ago updates
  useEffect(() => {
    const interval = window.setInterval(() => {
      setDashboardRecords(prev => [...prev]);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch dashboard data
  useEffect(() => {
    let cancelled = false;
    let retryTimeout: number | undefined;

    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/api/sensors?limit=180');
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }

        const payload = await response.json();
        if (!cancelled && Array.isArray(payload)) {
          setDashboardRecords(payload);
          setIsConnected(true);
          if (payload.length > 0 && payload[0].sensorId) {
            setCurrentSensorId(payload[0].sensorId);
          }
        }
      } catch (error) {
        console.error('Error fetching sensor data:', error);
        if (!cancelled) {
          setIsConnected(false);
          setDashboardRecords([]);
          retryTimeout = window.setTimeout(fetchDashboardData, 5000);
        }
      }
    };

    fetchDashboardData();
    const interval = window.setInterval(fetchDashboardData, 5000);

    return () => {
      cancelled = true;
      clearInterval(interval);
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, []);

  // Parse and process sensor records
  const parsedRows = useMemo(
    () =>
      dashboardRecords
        .map((rec) => ({
          recordedAt: new Date(rec.timestamp ?? ''),
          temperature: rec.readings?.temperature ?? rec.temperature,
          humidity: rec.readings?.humidity ?? rec.humidity,
          soil: rec.readings?.soil ?? rec.soil,
          light: rec.readings?.lux ?? rec.readings?.light ?? rec.lux,
          airppm: rec.readings?.airppm ?? rec.airppm
        }))
        .filter((row) => Number.isFinite(row.recordedAt.getTime()))
        .sort((a, b) => a.recordedAt.getTime() - b.recordedAt.getTime()),
    [dashboardRecords]
  );

  // Get latest timestamp for time-ago display
  const latestTimestamp = useMemo(() => {
    if (dashboardRecords.length === 0) return null;
    const timestamps = dashboardRecords
      .map(rec => rec.timestamp ? new Date(rec.timestamp).getTime() : 0)
      .filter(t => t > 0);
    if (timestamps.length === 0) return null;
    return new Date(Math.max(...timestamps));
  }, [dashboardRecords]);

  const getSeries = (key: 'temperature' | 'humidity' | 'soil' | 'light' | 'airppm') => {
    const values = parsedRows
      .map((row) => row[key])
      .filter((value): value is number => Number.isFinite(value))
      .slice(-24);

    return values;
  };

  const tempSeries = getSeries('temperature');
  const humiditySeries = getSeries('humidity');
  const soilSeries = getSeries('soil');
  const lightSeries = getSeries('light');
  const airppmSeries = getSeries('airppm');

  const latestTemp = tempSeries[tempSeries.length - 1] ?? null;
  const latestHumidity = humiditySeries[humiditySeries.length - 1] ?? null;
  const latestSoil = soilSeries[soilSeries.length - 1] ?? null;
  const latestLight = lightSeries[lightSeries.length - 1] ?? null;
  const latestAirPpm = airppmSeries[airppmSeries.length - 1] ?? null;

  // Get descriptive messages for each sensor
  const tempMessage = getTemperatureMessage(latestTemp);
  const humidityMessage = getHumidityMessage(latestHumidity);
  const soilMessage = getSoilMessage(latestSoil);
  const lightMessage = getLightMessage(latestLight);
  const airMessage = getAirMessage(latestAirPpm);

  // Temperature status based on ranges
  const getTempStatus = (v: number): SensorStatus => 
    (v > 28 || v < 20 ? 'critical' : v > 26 || v < 22 ? 'warning' : 'optimal');
  
  // Humidity status based on ranges
  const getHumidityStatus = (v: number): SensorStatus => 
    (v > 75 || v < 50 ? 'critical' : v > 65 || v < 55 ? 'warning' : 'optimal');
  
  // Soil status based on ranges
  const getSoilStatus = (v: number): SensorStatus => 
    (v > 80 || v < 60 ? 'critical' : v > 75 || v < 65 ? 'warning' : 'optimal');
  
  // Light status based on ranges
  const getLightStatus = (v: number): SensorStatus => 
    (v > 20000 || v < 8000 ? 'critical' : v > 15000 || v < 10000 ? 'warning' : 'optimal');
  
  // Air quality status based on 0-150 = GOOD, 151-300 = WARNING, 300+ = CRITICAL
  const getAirPpmStatus = (v: number): SensorStatus => {
    if (v <= 150) return 'optimal';
    if (v <= 300) return 'warning';
    return 'critical';
  };

  const tempStatus = typeof latestTemp === 'number' ? getTempStatus(latestTemp) : 'warning';
  const humidityStatus = typeof latestHumidity === 'number' ? getHumidityStatus(latestHumidity) : 'warning';
  const soilStatus = typeof latestSoil === 'number' ? getSoilStatus(latestSoil) : 'warning';
  const lightStatus = typeof latestLight === 'number' ? getLightStatus(latestLight) : 'warning';
  const airPpmStatus = typeof latestAirPpm === 'number' ? getAirPpmStatus(latestAirPpm) : 'warning';

  // Calculate active sensor count
  const activeSensorCount = [
    latestTemp, 
    latestHumidity, 
    latestSoil, 
    latestLight, 
    latestAirPpm
  ].filter(v => typeof v === 'number' && v !== null).length;

  const toWarningSeverity = (status: SensorStatus): DashboardWarning['severity'] => {
    if (status === 'critical') return 'high';
    if (status === 'warning') return 'medium';
    return 'low';
  };

  const warnings: DashboardWarning[] = [
    ...(typeof latestSoil === 'number' && soilStatus !== 'optimal'
      ? [{
          id: 1,
          severity: toWarningSeverity(soilStatus),
          title: soilStatus === 'critical' ? '💧 Critical Soil Moisture Alert' : '💧 Soil Moisture Warning',
          message: `Soil moisture is at ${latestSoil}%, which is ${soilMessage.toLowerCase().replace('\n', ' - ')}. Plants need immediate attention.`,
          time: '10 seconds ago',
          action: 'Start Irrigation'
        }]
      : []),
    ...(typeof latestHumidity === 'number' && humidityStatus !== 'optimal'
      ? [{
          id: 2,
          severity: toWarningSeverity(humidityStatus),
          title: humidityStatus === 'critical' ? '💨 Critical Humidity Alert' : '💨 Humidity Warning',
          message: `Humidity level is ${latestHumidity}%, ${humidityMessage.toLowerCase().replace('\n', ' - ')}. This affects plant health.`,
          time: '25 seconds ago',
          action: 'Check Misters'
        }]
      : []),
    ...(typeof latestTemp === 'number' && tempStatus !== 'optimal'
      ? [{
          id: 3,
          severity: toWarningSeverity(tempStatus),
          title: tempStatus === 'critical' ? '🌡️ Critical Temperature Alert' : '🌡️ Temperature Warning',
          message: `Temperature is ${latestTemp}°C, ${tempMessage.toLowerCase().replace('\n', ' - ')}. Monitor plant stress indicators.`,
          time: '1 minute ago',
          action: 'Adjust Vents'
        }]
      : []),
    ...(typeof latestLight === 'number' && lightStatus !== 'optimal'
      ? [{
          id: 4,
          severity: toWarningSeverity(lightStatus),
          title: lightStatus === 'critical' ? '☀️ Critical Light Alert' : '☀️ Light Intensity Warning',
          message: `Light intensity is ${latestLight} lux, ${lightMessage.toLowerCase().replace('\n', ' - ')}. Plants may not get enough light.`,
          time: '2 minutes ago',
          action: 'Adjust Shade'
        }]
      : []),
    ...(typeof latestAirPpm === 'number' && airPpmStatus !== 'optimal'
      ? [{
          id: 5,
          severity: toWarningSeverity(airPpmStatus),
          title: airPpmStatus === 'critical' ? '🌬️ Critical Air Quality Alert' : '🌬️ Air Quality Warning',
          message: `Air quality is ${latestAirPpm} ppm, ${airMessage.toLowerCase().replace('\n', ' - ')}. Ventilation needed.`,
          time: '3 minutes ago',
          action: 'Check Ventilation'
        }]
      : [])
  ];

  const fallbackWarnings: DashboardWarning[] =
    warnings.length > 0
      ? warnings
      : [
          parsedRows.length === 0
            ? {
                id: 99,
                severity: 'low',
                title: !isConnected ? '🔌 Connection Lost' : '⏳ Waiting for Sensor Data',
                message: !isConnected
                  ? 'Unable to connect to sensor API. Please check backend service and network connection.'
                  : 'No live sensor records available yet. System is initializing.',
                time: 'Just now',
                action: 'View Details'
              }
            : {
                id: 100,
                severity: 'low',
                title: '✅ All Systems Stable',
                message: 'All sensor readings are within the optimal range. Greenhouse conditions are perfect for plant growth.',
                time: '5 minutes ago',
                action: 'View Details'
              }
        ];

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Connection Status Bar */}
      {!isConnected && (
        <div className="col-span-12 mb-2">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Connection lost. Retrying...
            </p>
          </div>
        </div>
      )}

      {/* Left Column - Sensors and Forecast */}
      <div className="col-span-9 space-y-6">
        {/* Sensor Cards Grid */}
        <div className="grid grid-cols-5 gap-4">
          <SensorCard
            icon={Thermometer}
            name="Temperature"
            value={typeof latestTemp === 'number' ? latestTemp : '--'}
            unit="°C"
            status={tempStatus}
            trendData={tempSeries}
            color="red"
            lastUpdate={latestTimestamp}
            message={tempMessage}
          />
          <SensorCard
            icon={Droplets}
            name="Humidity"
            value={typeof latestHumidity === 'number' ? latestHumidity : '--'}
            unit="%"
            status={humidityStatus}
            trendData={humiditySeries}
            color="blue"
            lastUpdate={latestTimestamp}
            message={humidityMessage}
          />
          <SensorCard
            icon={Sprout}
            name="Soil Moisture"
            value={typeof latestSoil === 'number' ? latestSoil : '--'}
            unit="%"
            status={soilStatus}
            trendData={soilSeries}
            color="green"
            lastUpdate={latestTimestamp}
            message={soilMessage}
          />
          <SensorCard
            icon={Sun}
            name="Light Intensity"
            value={typeof latestLight === 'number' ? latestLight : '--'}
            unit="lux"
            status={lightStatus}
            trendData={lightSeries}
            color="yellow"
            lastUpdate={latestTimestamp}
            message={lightMessage}
          />
          <SensorCard
            icon={Wind}
            name="Air Quality"
            value={typeof latestAirPpm === 'number' ? latestAirPpm : '--'}
            unit="ppm"
            status={airPpmStatus}
            trendData={airppmSeries}
            color="violet"
            lastUpdate={latestTimestamp}
            message={airMessage}
          />
        </div>

        {/* Forecast Section - Simplified without duplicate header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <ForecastView 
            sensorId={currentSensorId}
            lat={coordinates.lat}
            lon={coordinates.lon}
          />
        </div>
      </div>

      {/* Right Column - Alerts and Sensor Status */}
      <div className="col-span-3 space-y-6">
        {/* Alerts Panel */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Alerts</h2>
            <span className="text-sm font-semibold text-red-700 bg-red-100 px-2 py-1 rounded-full">
              {fallbackWarnings.length} Active
            </span>
          </div>

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {fallbackWarnings.map((warning) => {
              const isHigh = warning.severity === 'high';
              const isMedium = warning.severity === 'medium';

              return (
                <button
                  type="button"
                  key={warning.id}
                  onClick={() => onOpenAlert?.(warning)}
                  className={`rounded-lg border p-3 ${
                    isHigh
                      ? 'border-red-200 bg-red-50 hover:bg-red-100'
                      : isMedium
                      ? 'border-amber-200 bg-amber-50 hover:bg-amber-100'
                      : 'border-blue-200 bg-blue-50 hover:bg-blue-100'
                  } text-left w-full transition-all hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400`}
                >
                  <div className="flex items-start gap-2.5">
                    {isHigh ? (
                      <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                    ) : isMedium ? (
                      <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className={`text-sm font-semibold px-2 py-0.5 rounded-full ${
                          isHigh ? 'bg-red-100 text-red-700' : isMedium ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {isHigh ? '🔴 Critical' : isMedium ? '🟡 Warning' : '🔵 Info'}
                        </p>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          {warning.title.includes('Soil') ? '💧 Soil' :
                           warning.title.includes('Humidity') ? '💨 Humidity' :
                           warning.title.includes('Temperature') ? '🌡️ Temperature' :
                           warning.title.includes('Light') ? '☀️ Light' :
                           warning.title.includes('Air') ? '🌬️ Air Quality' : '📊 System'}
                        </span>
                      </div>
                      <p className="text-base font-medium text-gray-900 leading-snug">{warning.title}</p>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{warning.message}</p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-gray-400">{warning.time}</p>
                        <p className="text-xs text-emerald-600 font-medium">{warning.action}</p>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sensor Status Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-bold text-gray-900">Sensor Status</h2>
            </div>
            <div className="flex items-center gap-2">
              {isConnected ? (
                <>
                  <Wifi className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs text-emerald-600 font-medium">Live</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-red-500" />
                  <span className="text-xs text-red-600 font-medium">Offline</span>
                </>
              )}
            </div>
          </div>

          {/* Active Sensors Count */}
          <div className="text-center mb-4 pb-3 border-b border-gray-100">
            <div className="text-3xl font-bold text-gray-900">{activeSensorCount}/5</div>
            <p className="text-sm text-gray-500 mt-1">Active Sensors</p>
          </div>
          
          {/* Last Update Footer */}
          <div className="mt-4 pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Last update:</span>
              <TimeAgo date={latestTimestamp} className="text-gray-600 font-medium" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}