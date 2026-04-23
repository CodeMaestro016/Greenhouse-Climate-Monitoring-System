import { useState, useEffect } from 'react';
import { Thermometer, Droplets, Sprout, Sun, Wind, AlertTriangle, AlertCircle, Activity, Wifi, WifiOff } from 'lucide-react';

interface SensorReading {
  id: string;
  name: string;
  value: string;
  subtitle: string;
  icon: any;
  progress: number;
  tone: 'red' | 'blue' | 'green' | 'amber' | 'violet';
  unit: string;
}

interface ActivityItem {
  id: number;
  icon: any;
  title: string;
  message: string;
  time: string;
  status: 'critical' | 'warning' | 'info' | 'success';
}

export function LiveFeedPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  const [liveData, setLiveData] = useState({
    temperature: null as number | null,
    humidity: null as number | null,
    soil: null as number | null,
    light: null as number | null,
    airppm: null as number | null
  });

  const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    const fetchLatestData = async () => {
      try {
        const response = await fetch('/api/sensors/latest');
        if (!response.ok) {
          throw new Error('Failed to fetch latest data');
        }

        const latest = await response.json();
        if (cancelled || !latest) {
          return;
        }

        const temperature = latest.readings?.temperature ?? latest.temperature ?? null;
        const humidity = latest.readings?.humidity ?? latest.humidity ?? null;
        const soil = latest.readings?.soil ?? latest.soil ?? null;
        const light = latest.readings?.lux ?? latest.readings?.light ?? latest.lux ?? null;
        const airppm = latest.readings?.airppm ?? latest.airppm ?? null;

        setLiveData({ temperature, humidity, soil, light, airppm });
        setLastUpdate(latest.timestamp ? new Date(latest.timestamp) : new Date());
        setIsConnected(true);

        const activityEntries: ActivityItem[] = [
          {
            id: Date.now(),
            icon: Activity,
            title: 'Sensor Update',
            message: `Temp ${typeof temperature === 'number' ? `${temperature}°C` : '--'}, Humidity ${typeof humidity === 'number' ? `${humidity}%` : '--'}, Air PPM ${typeof airppm === 'number' ? airppm : '--'}`,
            time: 'Just now',
            status: 'info'
          }
        ];

        if (typeof soil === 'number' && soil < 45) {
          activityEntries.unshift({
            id: Date.now() + 1,
            icon: AlertTriangle,
            title: 'Critical Alert',
            message: `Soil moisture dropped to ${soil}%`,
            time: 'Just now',
            status: 'critical'
          });
        }

        if (typeof humidity === 'number' && humidity < 65) {
          activityEntries.unshift({
            id: Date.now() + 2,
            icon: AlertCircle,
            title: 'Warning',
            message: `Humidity is low at ${humidity}%`,
            time: 'Just now',
            status: 'warning'
          });
        }

        setActivityFeed((prev) => [...activityEntries, ...prev].slice(0, 10));
      } catch {
        if (!cancelled) {
          setIsConnected(false);
        }
      }
    };

    fetchLatestData();
    const interval = window.setInterval(fetchLatestData, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const clamp = (value: number | null, min: number, max: number) => {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return 0;
    }

    return Math.min(max, Math.max(min, value));
  };

  const formatRelativeUpdateTime = (date: Date | null) => {
    if (!date) {
      return 'Waiting for first update';
    }

    const diffSeconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));

    if (diffSeconds < 10) {
      return 'Updated just now';
    }

    if (diffSeconds < 60) {
      return `Updated ${diffSeconds}s ago`;
    }

    const minutes = Math.floor(diffSeconds / 60);
    if (minutes < 60) {
      return `Updated ${minutes}m ago`;
    }

    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 ? `Updated ${hours}h ${remainingMinutes}m ago` : `Updated ${hours}h ago`;
    }

    return `Updated on ${date.toLocaleString()}`;
  };

  const subtitleText = isConnected ? formatRelativeUpdateTime(lastUpdate) : 'Disconnected from live source';

  const sensorCards: SensorReading[] = [
    {
      id: 'temperature',
      name: 'Temperature',
      value: typeof liveData.temperature === 'number' ? `${liveData.temperature} °C` : '--',
      subtitle: subtitleText,
      icon: Thermometer,
      progress: (clamp(liveData.temperature, 0, 50) / 50) * 100,
      tone: 'red',
      unit: '°C'
    },
    {
      id: 'humidity',
      name: 'Humidity',
      value: typeof liveData.humidity === 'number' ? `${liveData.humidity}%` : '--',
      subtitle: subtitleText,
      icon: Droplets,
      progress: clamp(liveData.humidity, 0, 100),
      tone: 'blue',
      unit: '%'
    },
    {
      id: 'soil',
      name: 'Soil Moisture',
      value: typeof liveData.soil === 'number' ? `${liveData.soil}%` : '--',
      subtitle: subtitleText,
      icon: Sprout,
      progress: clamp(liveData.soil, 0, 100),
      tone: 'green',
      unit: '%'
    },
    {
      id: 'light',
      name: 'Light Intensity',
      value: typeof liveData.light === 'number' ? `${liveData.light} lux` : '--',
      subtitle: subtitleText,
      icon: Sun,
      progress: (clamp(liveData.light, 0, 50000) / 50000) * 100,
      tone: 'amber',
      unit: 'lux'
    },
    {
      id: 'airppm',
      name: 'Air',
      value: typeof liveData.airppm === 'number' ? `${liveData.airppm} ppm` : '--',
      subtitle: subtitleText,
      icon: Wind,
      progress: (clamp(liveData.airppm, 0, 3000) / 3000) * 100,
      tone: 'violet',
      unit: 'ppm'
    }
  ];

  const activeSensorCount = [liveData.temperature, liveData.humidity, liveData.soil, liveData.light, liveData.airppm].filter(
    (v) => typeof v === 'number'
  ).length;

  const toneClasses = {
    red: {
      wrapper: 'bg-red-50 border-red-200',
      icon: 'bg-red-100 text-red-600',
      bar: 'bg-red-500',
      barBg: 'bg-red-100'
    },
    blue: {
      wrapper: 'bg-blue-50 border-blue-200',
      icon: 'bg-blue-100 text-blue-600',
      bar: 'bg-blue-500',
      barBg: 'bg-blue-100'
    },
    green: {
      wrapper: 'bg-emerald-50 border-emerald-200',
      icon: 'bg-emerald-100 text-emerald-600',
      bar: 'bg-emerald-500',
      barBg: 'bg-emerald-100'
    },
    amber: {
      wrapper: 'bg-amber-50 border-amber-200',
      icon: 'bg-amber-100 text-amber-600',
      bar: 'bg-amber-500',
      barBg: 'bg-amber-100'
    },
    violet: {
      wrapper: 'bg-violet-50 border-violet-200',
      icon: 'bg-violet-100 text-violet-600',
      bar: 'bg-violet-500',
      barBg: 'bg-violet-100'
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'critical': return 'bg-red-50 border-red-500';
      case 'warning': return 'bg-amber-50 border-amber-500';
      case 'success': return 'bg-emerald-50 border-emerald-500';
      default: return 'bg-blue-50 border-blue-500';
    }
  };

  const getStatusIconColor = (status: string) => {
    switch(status) {
      case 'critical': return 'text-red-600';
      case 'warning': return 'text-amber-600';
      case 'success': return 'text-emerald-600';
      default: return 'text-blue-600';
    }
  };

  const getStatusTextColor = (status: string) => {
    switch(status) {
      case 'critical': return 'text-red-700';
      case 'warning': return 'text-amber-700';
      case 'success': return 'text-emerald-700';
      default: return 'text-blue-700';
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Live Data Feed</h2>
          <p className="text-lg text-gray-500 mt-1">Real-time sensor readings and system activity</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-right">
            <p className="text-lg text-gray-500">Active Sensors</p>
            <p className="text-2xl font-semibold text-gray-800">{activeSensorCount}/5</p>
          </div>
          <div className="px-4 py-2 border border-gray-200 rounded-lg bg-white flex items-center gap-2">
            {isConnected ? (
              <>
                <Wifi className="w-4 h-4 text-emerald-500" />
                <span className="text-lg font-semibold text-gray-800">Live</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-red-500" />
                <span className="text-lg font-semibold text-gray-800">Offline</span>
              </>
            )}
          </div>
        </div>
      </div>

      {!isConnected ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Live feed unavailable. Check backend API and MQTT ingestion service.
        </div>
      ) : null}

      <div className="grid grid-cols-12 gap-6">
        {/* Sensor Cards - Left Column */}
        <div className="col-span-8 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Live Sensor Readings</h3>
            <div className="space-y-3">
              {sensorCards.map((sensor) => {
                const Icon = sensor.icon;
                const styles = toneClasses[sensor.tone];

                return (
                  <div key={sensor.id} className={`rounded-lg border p-4 ${styles.wrapper} transition-all hover:shadow-md`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-md ${styles.icon}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-gray-900">{sensor.name}</p>
                          <p className="text-base text-gray-600">{sensor.subtitle}</p>
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{sensor.value}</p>
                    </div>
                    <div className={`mt-3 h-2 rounded-full ${styles.barBg} overflow-hidden`}>
                      <div 
                        className={`h-full rounded-full ${styles.bar} transition-all duration-500`} 
                        style={{ width: `${Math.min(100, Math.max(0, sensor.progress))}%` }} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Activity Feed - Right Column */}
        <div className="col-span-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 h-[600px] flex flex-col">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Activity Feed</h3>
            
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {activityFeed.length === 0 ? (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-500">
                  Waiting for live sensor activity...
                </div>
              ) : activityFeed.map((activity) => {
                const Icon = activity.icon;
                return (
                  <div
                    key={activity.id}
                    className={`p-4 rounded-lg border-l-4 ${getStatusColor(activity.status)} bg-opacity-50 transition-all hover:shadow-sm`}
                  >
                    <div className="flex items-start gap-2">
                      <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${getStatusIconColor(activity.status)}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-lg font-semibold ${getStatusTextColor(activity.status)}`}>
                          {activity.title}
                        </p>
                        <p className="text-base text-gray-600 mt-1">{activity.message}</p>
                        <p className="text-base text-gray-500 mt-1">{activity.time}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Connection Status Footer */}
            <div className="mt-4 pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Last update:</span>
                <span className="text-gray-700 font-medium">
                  {lastUpdate ? lastUpdate.toLocaleTimeString() : '--'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}