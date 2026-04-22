import { useEffect, useMemo, useState } from 'react';
import { Thermometer, Droplets, Sprout, Sun, Wind, TrendingUp, TrendingDown, XCircle, AlertCircle, CheckCircle } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line } from 'recharts';

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

function SensorCard({ icon: Icon, name, value, unit, status, trend, change, trendData, color }: any) {
  const colorClasses = {
    red: 'bg-red-50 text-red-600 border-red-200',
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    violet: 'bg-violet-50 text-violet-600 border-violet-200'
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
                color === 'violet' ? '#7c3aed' :
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
  const [dashboardRecords, setDashboardRecords] = useState<SensorRecord[]>([]);

  useEffect(() => {
    let cancelled = false;

    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/api/sensors?limit=180');
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }

        const payload = await response.json();
        if (!cancelled && Array.isArray(payload)) {
          setDashboardRecords(payload);
        }
      } catch {
        if (!cancelled) {
          setDashboardRecords([]);
        }
      }
    };

    fetchDashboardData();
    const timer = window.setInterval(fetchDashboardData, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

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

  const getTrendMeta = (series: number[]) => {
    if (series.length < 2) {
      return { trend: 'up' as const, change: '+0.0' };
    }

    const prev = series[series.length - 2];
    const curr = series[series.length - 1];
    const delta = curr - prev;
    const trend = delta >= 0 ? 'up' : 'down';
    const change = `${delta >= 0 ? '+' : ''}${Math.abs(delta)}`;

    return { trend, change };
  };

  const tempTrend = getTrendMeta(tempSeries);
  const humidityTrend = getTrendMeta(humiditySeries);
  const soilTrend = getTrendMeta(soilSeries);
  const lightTrend = getTrendMeta(lightSeries);
  const airPpmTrend = getTrendMeta(airppmSeries);

  const getTempStatus = (v: number): SensorStatus => (v > 32 || v < 18 ? 'critical' : v > 30 || v < 20 ? 'warning' : 'optimal');
  const getHumidityStatus = (v: number): SensorStatus => (v < 55 || v > 90 ? 'critical' : v < 65 || v > 85 ? 'warning' : 'optimal');
  const getSoilStatus = (v: number): SensorStatus => (v < 40 || v > 85 ? 'critical' : v < 50 || v > 75 ? 'warning' : 'optimal');
  const getLightStatus = (v: number): SensorStatus => (v < 1500 || v > 40000 ? 'critical' : v < 4000 || v > 30000 ? 'warning' : 'optimal');
  const getAirPpmStatus = (v: number): SensorStatus => (v < 300 || v > 2000 ? 'critical' : v < 400 || v > 1500 ? 'warning' : 'optimal');

  const tempStatus = typeof latestTemp === 'number' ? getTempStatus(latestTemp) : 'warning';
  const humidityStatus = typeof latestHumidity === 'number' ? getHumidityStatus(latestHumidity) : 'warning';
  const soilStatus = typeof latestSoil === 'number' ? getSoilStatus(latestSoil) : 'warning';
  const lightStatus = typeof latestLight === 'number' ? getLightStatus(latestLight) : 'warning';
  const airPpmStatus = typeof latestAirPpm === 'number' ? getAirPpmStatus(latestAirPpm) : 'warning';

  const calcRisk = (value: number, min: number, max: number) => {
    if (!Number.isFinite(value)) {
      return 0;
    }

    if (value >= min && value <= max) {
      return 0;
    }

    const distance = value < min ? min - value : value - max;
    const spread = Math.max(1, max - min);
    return Math.max(0, Math.min(100, (distance / spread) * 100));
  };

  const tempRisk = calcRisk(typeof latestTemp === 'number' ? latestTemp : NaN, 20, 30);
  const humidityRisk = calcRisk(typeof latestHumidity === 'number' ? latestHumidity : NaN, 65, 85);
  const soilRisk = calcRisk(typeof latestSoil === 'number' ? latestSoil : NaN, 50, 75);
  const lightRisk = calcRisk(typeof latestLight === 'number' ? latestLight : NaN, 4000, 30000);
  const airPpmRisk = calcRisk(typeof latestAirPpm === 'number' ? latestAirPpm : NaN, 400, 1500);

  const liveDangerLevel = (tempRisk + humidityRisk + soilRisk + lightRisk + airPpmRisk) / 5;
  const currentDanger = Number.isFinite(liveDangerLevel) && parsedRows.length > 0 ? liveDangerLevel : dangerLevel;

  const riskFactors = [
    { name: 'Soil Moisture', value: soilRisk, color: '#ef4444' },
    { name: 'Humidity', value: humidityRisk, color: '#f59e0b' },
    { name: 'Temperature', value: tempRisk, color: '#10b981' },
    { name: 'Light', value: lightRisk, color: '#3b82f6' },
    { name: 'Air', value: airPpmRisk, color: '#7c3aed' }
  ];

  const toWarningSeverity = (status: SensorStatus): DashboardWarning['severity'] => {
    if (status === 'critical') {
      return 'high';
    }

    if (status === 'warning') {
      return 'medium';
    }

    return 'low';
  };

  const warnings: DashboardWarning[] = [
    ...(typeof latestSoil === 'number' && soilStatus !== 'optimal'
      ? [
          {
            id: 1,
            severity: toWarningSeverity(soilStatus),
            title: soilStatus === 'critical' ? 'Critical Soil Moisture' : 'Soil Moisture Warning',
            message: `Soil moisture is ${latestSoil}%`,
            time: 'Live',
            action: 'Start Irrigation'
          }
        ]
      : []),
    ...(typeof latestHumidity === 'number' && humidityStatus !== 'optimal'
      ? [
          {
            id: 2,
            severity: toWarningSeverity(humidityStatus),
            title: humidityStatus === 'critical' ? 'Critical Humidity' : 'Humidity Warning',
            message: `Humidity is ${latestHumidity}%`,
            time: 'Live',
            action: 'Check Misters'
          }
        ]
      : []),
    ...(typeof latestTemp === 'number' && tempStatus !== 'optimal'
      ? [
          {
            id: 3,
            severity: toWarningSeverity(tempStatus),
            title: tempStatus === 'critical' ? 'Critical Temperature' : 'Temperature Warning',
            message: `Temperature is ${latestTemp}°C`,
            time: 'Live',
            action: 'Adjust Vents'
          }
        ]
      : []),
    ...(typeof latestLight === 'number' && lightStatus !== 'optimal'
      ? [
          {
            id: 4,
            severity: toWarningSeverity(lightStatus),
            title: lightStatus === 'critical' ? 'Critical Light Intensity' : 'Light Intensity Warning',
            message: `Light intensity is ${latestLight} lux`,
            time: 'Live',
            action: 'Adjust Shade'
          }
        ]
      : []),
    ...(typeof latestAirPpm === 'number' && airPpmStatus !== 'optimal'
      ? [
          {
            id: 5,
            severity: toWarningSeverity(airPpmStatus),
            title: airPpmStatus === 'critical' ? 'Critical Air' : 'Air Warning',
            message: `Air is ${latestAirPpm} ppm`,
            time: 'Live',
            action: 'Check Ventilation'
          }
        ]
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
                title: 'Waiting for Sensor Data',
                message: 'No live sensor records available yet',
                time: 'Live',
                action: 'View Details'
              }
            : {
                id: 100,
                severity: 'low',
                title: 'All Sensors Stable',
                message: 'Current readings are within safe range',
                time: 'Live',
                action: 'View Details'
              }
        ];

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Left Column - Sensors and Risk Engine */}
      <div className="col-span-9 space-y-6">
        {/* Sensor Cards Grid */}
        <div className="grid grid-cols-5 gap-4">
          <SensorCard
            icon={Thermometer}
            name="Temperature"
            value={typeof latestTemp === 'number' ? latestTemp : '--'}
            unit="°C"
            status={tempStatus}
            trend={tempTrend.trend}
            change={tempTrend.change}
            trendData={tempSeries}
            color="red"
          />
          <SensorCard
            icon={Droplets}
            name="Humidity"
            value={typeof latestHumidity === 'number' ? latestHumidity : '--'}
            unit="%"
            status={humidityStatus}
            trend={humidityTrend.trend}
            change={humidityTrend.change}
            trendData={humiditySeries}
            color="blue"
          />
          <SensorCard
            icon={Sprout}
            name="Soil Moisture"
            value={typeof latestSoil === 'number' ? latestSoil : '--'}
            unit="%"
            status={soilStatus}
            trend={soilTrend.trend}
            change={soilTrend.change}
            trendData={soilSeries}
            color="green"
          />
          <SensorCard
            icon={Sun}
            name="Light Intensity"
            value={typeof latestLight === 'number' ? latestLight : '--'}
            unit="lux"
            status={lightStatus}
            trend={lightTrend.trend}
            change={lightTrend.change}
            trendData={lightSeries}
            color="yellow"
          />
          <SensorCard
            icon={Wind}
            name="Air"
            value={typeof latestAirPpm === 'number' ? latestAirPpm : '--'}
            unit="ppm"
            status={airPpmStatus}
            trend={airPpmTrend.trend}
            change={airPpmTrend.change}
            trendData={airppmSeries}
            color="violet"
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
                    stroke={currentDanger >= 70 ? '#ef4444' : currentDanger >= 40 ? '#f59e0b' : '#22c55e'}
                    strokeWidth="18"
                    strokeDasharray={`${Math.max(0, Math.min(100, currentDanger)) * 4.4} ${440 - Math.max(0, Math.min(100, currentDanger)) * 4.4}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-gray-900">{currentDanger.toFixed(2)}%</span>
                  <span className="text-base text-gray-500 uppercase tracking-wide">Danger Level</span>
                  <span className="text-sm mt-1 text-amber-700 font-medium">
                    {currentDanger > 70 ? 'High Risk' : currentDanger > 40 ? 'Medium Risk' : 'Low Risk'}
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
                      <span className="text-base font-semibold text-gray-900">{factor.value.toFixed(2)}%</span>
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
              {fallbackWarnings.length} Active
            </span>
          </div>

          <div className="space-y-3 overflow-y-auto pr-1">
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