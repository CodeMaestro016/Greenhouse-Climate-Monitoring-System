import { useEffect, useState } from 'react';

interface ForecastData {
  timestamp: string;
  weatherUsed: boolean;
  forecasts: {
    temperature: {
      current: number;
      predicted: number;
      trend: string;
      change: string;
      reason: string;
    };
    humidity: {
      current: number;
      predicted: number;
      trend: string;
      change: string;
      reason: string;
    };
    lux: {
      current: number;
      predicted: number;
      trend: string;
      change: string;
      reason: string;
    };
    soil: {
      current: number;
      predicted: number;
      trend: string;
      change: string;
      reason: string;
    };
    air: {
      current: number;
      predicted: number;
      trend: string;
      change: string;
      reason: string;
    };
  };
  overallOutlook: string;
  actionNeeded: string;
}

interface ForecastViewProps {
  sensorId?: string;
  lat?: number;
  lon?: number;
}

export function ForecastView({ sensorId = 'GH001', lat = 6.9271, lon = 79.8612 }: ForecastViewProps) {
  const [forecastData, setForecastData] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchForecast = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const response = await fetch(`/api/forecast/1hour?sensorId=${sensorId}&lat=${lat}&lon=${lon}`);
      if (!response.ok) {
        throw new Error('Failed to fetch forecast');
      }
      const data = await response.json();
      setForecastData(data);
    } catch (err) {
      console.error('Error fetching forecast:', err);
      setError('Unable to load forecast data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchForecast(true);
  };

  useEffect(() => {
    fetchForecast();
    const interval = setInterval(() => fetchForecast(true), 120000);
    return () => clearInterval(interval);
  }, [sensorId, lat, lon]);

  const generateTimeSeriesData = (current: number, predicted: number) => {
    if (current === 0 && predicted === 0) {
      return [0, 0, 0];
    }
    return [
      Number(current.toFixed(1)),
      Number(((current + predicted) / 2).toFixed(1)),
      Number(predicted.toFixed(1)),
    ];
  };

  const getYAxisDomain = (data: number[]) => {
    const min = Math.min(...data);
    const max = Math.max(...data);

    if (min === max) {
      if (min === 0) {
        return { min: 0, max: 100 };
      }
      return { min: min - 1, max: max + 1 };
    }

    const padding = (max - min) * 0.25;
    return { min: min - padding, max: max + padding };
  };

  // FARMER-FRIENDLY: Simple air quality messages
  const getAirQualityStatus = (value: number): string => {
    if (value <= 150) return 'Clean ✅';
    if (value <= 300) return 'Okay ⚠️';
    return 'Bad ❌';
  };

  // FARMER-FRIENDLY: Simple trend messages for air
  const getAirQualityTrendMessage = (current: number, predicted: number): string => {
    if (current === 0 && predicted === 0) return 'No data';
    
    const diff = predicted - current;
    if (Math.abs(diff) < 0.01) {
      return `👉 Will stay at ${predicted} ppm (${getAirQualityStatus(predicted)})`;
    }
    if (diff > 0) {
      return `👉 May reach ${predicted} ppm (${getAirQualityStatus(predicted)})`;
    }
    return `👉 May drop to ${predicted} ppm (${getAirQualityStatus(predicted)})`;
  };

  // HELPER: Get trend based on ACTUAL difference (0.01 threshold for any change)
  const getActualTrend = (current: number, predicted: number): 'up' | 'down' | 'stable' => {
    const diff = predicted - current;
    if (Math.abs(diff) < 0.01) return 'stable';
    return diff > 0 ? 'up' : 'down';
  };

  const forecastMetrics = [
    {
      id: 'temperature',
      title: 'Temperature',
      unit: '°C',
      getData: () => forecastData?.forecasts.temperature,
      icon: '🌡️',
      lineColor: '#ef4444',
      fillColor: 'rgba(239, 68, 68, 0.10)',
      leftBg: 'bg-red-50',
      rightBg: 'bg-red-50',
      rightText: 'text-red-600',
      borderColor: 'border-red-100',
      getStatusMessage: (current: number, predicted: number) => {
        const trend = getActualTrend(current, predicted);
        if (trend === 'stable') return 'Temperature steady';
        if (trend === 'up') return 'Will get warmer';
        return 'Will get cooler';
      },
      getReachMessage: (current: number, predicted: number) => {
        const trend = getActualTrend(current, predicted);
        const formatted = predicted.toFixed(1);
        if (trend === 'stable') return `👉 Stays at ${formatted}°C`;
        if (trend === 'up') return `👉 May reach ${formatted}°C`;
        return `👉 May drop to ${formatted}°C`;
      }
    },
    {
      id: 'humidity',
      title: 'Humidity',
      unit: '%',
      getData: () => forecastData?.forecasts.humidity,
      icon: '💧',
      lineColor: '#2563eb',
      fillColor: 'rgba(37, 99, 235, 0.10)',
      leftBg: 'bg-blue-50',
      rightBg: 'bg-blue-50',
      rightText: 'text-blue-600',
      borderColor: 'border-blue-100',
      getStatusMessage: (current: number, predicted: number) => {
        const trend = getActualTrend(current, predicted);
        if (trend === 'stable') return 'Humidity steady';
        if (trend === 'up') return 'Will get more humid';
        return 'Will get drier';
      },
      getReachMessage: (current: number, predicted: number) => {
        const trend = getActualTrend(current, predicted);
        const formatted = predicted.toFixed(1);
        if (trend === 'stable') return `👉 Stays at ${formatted}%`;
        if (trend === 'up') return `👉 May reach ${formatted}%`;
        return `👉 May drop to ${formatted}%`;
      }
    },
    {
      id: 'soil',
      title: 'Soil Moisture',
      unit: '%',
      getData: () => forecastData?.forecasts.soil,
      icon: '🌱',
      lineColor: '#16a34a',
      fillColor: 'rgba(22, 163, 74, 0.10)',
      leftBg: 'bg-green-50',
      rightBg: 'bg-green-50',
      rightText: 'text-green-600',
      borderColor: 'border-green-100',
      getStatusMessage: (current: number, predicted: number) => {
        const trend = getActualTrend(current, predicted);
        if (trend === 'stable') return 'Soil moisture steady';
        if (trend === 'up') return 'Soil getting wetter';
        return 'Soil getting drier';
      },
      getReachMessage: (current: number, predicted: number) => {
        const trend = getActualTrend(current, predicted);
        const formatted = predicted.toFixed(1);
        if (trend === 'stable') return `👉 Stays at ${formatted}%`;
        if (trend === 'up') return `👉 May reach ${formatted}%`;
        return `👉 May drop to ${formatted}%`;
      }
    },
    {
      id: 'lux',
      title: 'Light',
      unit: 'lux',
      getData: () => forecastData?.forecasts.lux,
      icon: '☀️',
      lineColor: '#f97316',
      fillColor: 'rgba(249, 115, 22, 0.10)',
      leftBg: 'bg-orange-50',
      rightBg: 'bg-orange-50',
      rightText: 'text-orange-600',
      borderColor: 'border-orange-100',
      getStatusMessage: (current: number, predicted: number) => {
        if (current === 0 && predicted === 0) return 'No light data';
        const trend = getActualTrend(current, predicted);
        if (trend === 'stable') return 'Light steady';
        if (trend === 'up') return 'Will get brighter';
        return 'Will get darker';
      },
      getReachMessage: (current: number, predicted: number) => {
        if (current === 0 && predicted === 0) return '👉 No light sensor';
        const trend = getActualTrend(current, predicted);
        const formatted = predicted.toFixed(0);
        if (trend === 'stable') return `👉 Stays at ${formatted} lux`;
        if (trend === 'up') return `👉 May reach ${formatted} lux`;
        return `👉 May drop to ${formatted} lux`;
      }
    },
    {
      id: 'air',
      title: 'Air Quality',
      unit: 'ppm',
      getData: () => forecastData?.forecasts.air,
      icon: '🌬️',
      lineColor: '#7c3aed',
      fillColor: 'rgba(124, 58, 237, 0.10)',
      leftBg: 'bg-purple-50',
      rightBg: 'bg-purple-50',
      rightText: 'text-purple-600',
      borderColor: 'border-purple-100',
      getStatusMessage: (current: number, predicted: number) => {
        if (current === 0 && predicted === 0) return 'No air data';
        const trend = getActualTrend(current, predicted);
        if (trend === 'stable') return 'Air quality steady';
        if (trend === 'up') return 'Air getting worse';
        return 'Air getting better';
      },
      getReachMessage: (current: number, predicted: number) => {
        if (current === 0 && predicted === 0) return '👉 No air quality data';
        return getAirQualityTrendMessage(current, predicted);
      }
    },
  ];

  const TrendArrow = ({ trend, colorClass }: { trend: string; colorClass: string }) => {
    if (trend === 'stable') {
      return <span className={`text-3xl font-bold leading-none ${colorClass}`}>→</span>;
    }
    const arrow = trend === 'up' ? '↑' : '↓';
    return <span className={`text-3xl font-bold leading-none ${colorClass}`}>{arrow}</span>;
  };

  const ForecastLineChart = ({ data, color, fillColor }: { data: number[]; color: string; fillColor: string }) => {
    const width = 520;
    const height = 90;
    const leftPad = 28;
    const rightPad = 28;
    const topPad = 18;
    const bottomPad = 28;

    const domain = getYAxisDomain(data);

    const points = data.map((value, index) => {
      const x = leftPad + (index / (data.length - 1)) * (width - leftPad - rightPad);
      const y = topPad + ((domain.max - value) / (domain.max - domain.min)) * (height - topPad - bottomPad);
      return { x, y, value };
    });

    const linePoints = points.map((p) => `${p.x},${p.y}`).join(' ');
    const areaPoints = `${points[0].x},${height - bottomPad} ${linePoints} ${points[points.length - 1].x},${height - bottomPad}`;

    return (
      <div className="w-full">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[88px] overflow-visible" preserveAspectRatio="none">
          <polygon points={areaPoints} fill={fillColor} />
          <polyline points={linePoints} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {points.map((point, index) => (
            <g key={index}>
              <circle cx={point.x} cy={point.y} r="4.5" fill={color} stroke="white" strokeWidth="2" />
              <text x={point.x} y={point.y - 10} textAnchor="middle" fontSize="12" fontWeight="700" fill="#1f2937">
                {point.value}
              </text>
            </g>
          ))}
        </svg>
        <div className="grid grid-cols-3 text-xs text-gray-500 mt-1 px-1">
          <span className="text-left">Now</span>
          <span className="text-center">30 min</span>
          <span className="text-right">60 min</span>
        </div>
      </div>
    );
  };

  // Show loading state
  if (loading && !forecastData) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="text-center py-8">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-48 mx-auto mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-72 mx-auto"></div>
          </div>
          <p className="text-sm text-gray-500 mt-4">Loading forecast...</p>
        </div>
      </div>
    );
  }

  if (error || !forecastData) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="text-center py-8">
          <p className="text-red-500 text-sm">{error || 'No forecast available'}</p>
          <button onClick={handleRefresh} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header - Simplified for farmers */}
      <div className="px-6 pt-5 pb-4 flex items-start justify-between border-b border-gray-100">
        <div>
          <h2 className="text-[30px] font-bold text-gray-900 leading-tight">Next Hour Forecast</h2>
          <p className="text-sm text-gray-600 mt-1">What to expect in the next hour</p>
        </div>
        <div className="flex items-center gap-3">
          {forecastData.weatherUsed && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 border border-blue-100">
              <span className="text-lg">🌤️</span>
              <span className="text-sm font-semibold text-blue-600">Using weather data</span>
            </div>
          )}
          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg 
              className={`w-5 h-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
              />
            </svg>
            <span className="text-sm font-medium text-gray-700">
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </span>
          </button>
        </div>
      </div>

      {/* Forecast Rows - Farmer friendly */}
      <div className="px-6 py-2">
        {forecastMetrics.map((metric, index) => {
          const data = metric.getData();
          if (!data) return null;

          // Calculate trend based on ACTUAL difference between current and predicted
          const actualTrend = getActualTrend(data.current, data.predicted);
          
          const timeSeriesData = generateTimeSeriesData(data.current, data.predicted);
          
          // Get status and reach messages using actual current/predicted values
          const statusMessage = metric.getStatusMessage(data.current, data.predicted);
          const reachMessage = metric.getReachMessage(data.current, data.predicted);

          const showTrendArrow = !(metric.id === 'lux' && data.current === 0 && data.predicted === 0);
          const specialIcon = (metric.id === 'lux' && data.current === 0 && data.predicted === 0) ? '⚠️' : null;

          return (
            <div
              key={metric.id}
              className={`grid grid-cols-[70px_140px_1fr_280px] gap-5 items-center py-5 ${
                index !== forecastMetrics.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              {/* Left icon box */}
              <div className={`w-[54px] h-[54px] rounded-2xl flex items-center justify-center ${metric.leftBg}`}>
                <span className="text-3xl">{metric.icon}</span>
              </div>

              {/* Label + current value */}
              <div>
                <div className="text-[15px] font-semibold text-gray-800 leading-tight">{metric.title}</div>
                <div className="text-sm text-gray-500 mt-0.5">{metric.unit}</div>
                <div className="text-[28px] font-bold text-gray-900 mt-2 leading-none">{data.current}</div>
              </div>

              {/* Chart  */}
              <div className="min-w-0">
                <ForecastLineChart data={timeSeriesData} color={metric.lineColor} fillColor={metric.fillColor} />
              </div>

              {/* Right insight box - FARMER FRIENDLY simplified text */}
              <div className={`rounded-2xl px-5 py-4 border ${metric.borderColor} ${metric.rightBg}`}>
                <div className="flex items-center gap-3">
                  {specialIcon ? (
                    <span className="text-2xl">{specialIcon}</span>
                  ) : showTrendArrow ? (
                    <TrendArrow trend={actualTrend} colorClass={metric.rightText} />
                  ) : (
                    <span className="text-2xl">📊</span>
                  )}
                  <div className="flex-1">
                    <div className={`text-[15px] font-bold ${metric.rightText}`}>{statusMessage}</div>
                    <div className="text-sm text-gray-700 mt-1">{reachMessage}</div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}