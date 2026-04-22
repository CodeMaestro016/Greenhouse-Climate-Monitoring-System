import { useState, useEffect } from 'react';
import { Thermometer, Droplets, Sprout, Sun, AlertTriangle, AlertCircle, Activity, Wifi, WifiOff } from 'lucide-react';

interface SensorReading {
  id: string;
  name: string;
  value: string;
  subtitle: string;
  icon: any;
  progress: number;
  tone: 'red' | 'blue' | 'green' | 'amber';
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
  const [isConnected, setIsConnected] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  
  const [liveData, setLiveData] = useState({
    temperature: 28.5,
    humidity: 72,
    soil: 45,
    light: 8500
  });

  const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([
    { id: 1, icon: AlertTriangle, title: 'Critical Alert', message: 'Soil moisture dropped below 45%', time: '2 seconds ago', status: 'critical' },
    { id: 2, icon: AlertCircle, title: 'Warning', message: 'Humidity decreasing - currently at 72%', time: '3 minutes ago', status: 'warning' },
    { id: 3, icon: Activity, title: 'Sensor Update', message: 'Temperature sensor reading: 28.5°C', time: '5 seconds ago', status: 'info' },
    { id: 4, icon: Droplets, title: 'Irrigation Started', message: 'Auto-irrigation system activated', time: '10 minutes ago', status: 'success' }
  ]);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveData(prev => ({
        temperature: +(prev.temperature + (Math.random() - 0.5) * 0.5).toFixed(1),
        humidity: Math.min(100, Math.max(0, prev.humidity + (Math.random() - 0.5) * 2)),
        soil: Math.min(100, Math.max(0, prev.soil + (Math.random() - 0.5) * 1)),
        light: Math.min(20000, Math.max(0, prev.light + (Math.random() - 0.5) * 100))
      }));
      setLastUpdate(new Date());
      
      // Add random activity update
      if (Math.random() > 0.7) {
        const newActivity: ActivityItem = {
          id: Date.now(),
          icon: Activity,
          title: 'Sensor Reading',
          message: `New reading: Temp ${liveData.temperature}°C, Humidity ${liveData.humidity}%`,
          time: 'Just now',
          status: 'info'
        };
        setActivityFeed(prev => [newActivity, ...prev.slice(0, 9)]);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const sensorCards: SensorReading[] = [
    {
      id: 'temperature',
      name: 'Temperature',
      value: `${liveData.temperature} °C`,
      subtitle: `Updated ${Math.floor((Date.now() - lastUpdate.getTime()) / 1000)}s ago`,
      icon: Thermometer,
      progress: (liveData.temperature / 40) * 100,
      tone: 'red',
      unit: '°C'
    },
    {
      id: 'humidity',
      name: 'Humidity',
      value: `${Math.round(liveData.humidity)}%`,
      subtitle: `Updated ${Math.floor((Date.now() - lastUpdate.getTime()) / 1000)}s ago`,
      icon: Droplets,
      progress: liveData.humidity,
      tone: 'blue',
      unit: '%'
    },
    {
      id: 'soil',
      name: 'Soil Moisture',
      value: `${Math.round(liveData.soil)}%`,
      subtitle: `Updated ${Math.floor((Date.now() - lastUpdate.getTime()) / 1000)}s ago`,
      icon: Sprout,
      progress: liveData.soil,
      tone: 'green',
      unit: '%'
    },
    {
      id: 'light',
      name: 'Light Intensity',
      value: `${Math.round(liveData.light).toLocaleString()} lux`,
      subtitle: `Updated ${Math.floor((Date.now() - lastUpdate.getTime()) / 1000)}s ago`,
      icon: Sun,
      progress: (liveData.light / 20000) * 100,
      tone: 'amber',
      unit: 'lux'
    }
  ];

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Live Data Feed</h2>
          <p className="text-base text-gray-500 mt-1">Real-time sensor readings and system activity</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-right">
            <p className="text-sm text-gray-500">Active Sensors</p>
            <p className="text-2xl font-semibold text-gray-800">4/4</p>
          </div>
          <div className="px-4 py-2 border border-gray-200 rounded-lg bg-white flex items-center gap-2">
            {isConnected ? (
              <>
                <Wifi className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-semibold text-gray-800">Live</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-red-500" />
                <span className="text-sm font-semibold text-gray-800">Disconnected</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Sensor Cards - Left Column */}
        <div className="col-span-8 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
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
                          <p className="text-base font-semibold text-gray-900">{sensor.name}</p>
                          <p className="text-sm text-gray-500">{sensor.subtitle}</p>
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
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 h-[600px] flex flex-col">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Activity Feed</h3>
            
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {activityFeed.map((activity) => {
                const Icon = activity.icon;
                return (
                  <div
                    key={activity.id}
                    className={`p-3 rounded-lg border-l-4 ${getStatusColor(activity.status)} bg-opacity-50 transition-all hover:shadow-sm`}
                  >
                    <div className="flex items-start gap-2">
                      <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${getStatusIconColor(activity.status)}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold ${getStatusTextColor(activity.status)}`}>
                          {activity.title}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">{activity.message}</p>
                        <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
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
                  {lastUpdate.toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}