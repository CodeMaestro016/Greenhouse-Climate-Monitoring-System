// frontend/src/app/Pages/AlertsPage.tsx
import { useState, useEffect } from 'react';
import { 
  XCircle, AlertTriangle, AlertCircle, CheckCircle, 
  Bell, ArrowRight, Activity, RefreshCw, Thermometer, Droplet, 
  Wind, Sun, Leaf, Download
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, CartesianGrid, 
  XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell 
} from 'recharts';
import { AlertReport } from './AlertReport';

// Alert interface matching backend schema
interface Alert {
  _id: string;
  sensorId: string;
  timestamp: string;
  field: string;
  value: number;
  min: number;
  max: number;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  message: string;
  createdAt: string;
}

// Safe ranges based on the provided constants
const SAFE_RANGES = {
  temperature: { min: 18, max: 28, unit: '°C' },
  humidity: { min: 70, max: 80, unit: '%' },
  soil_moisture: { min: 60, max: 80, unit: '%' },
  soil: { min: 60, max: 80, unit: '%' },
  air: { min: 0, max: 300, unit: 'ppm' },
  co2: { min: 0, max: 300, unit: 'ppm' },
  light: { min: 5000, max: 10000, unit: 'lux' }
};

function formatTimeLabel(timestamp?: string) {
  if (!timestamp) return 'Just now';
  
  const date = new Date(timestamp);
  const diff = Date.now() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return `${seconds} second${seconds === 1 ? '' : 's'} ago`;
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const getSensorDisplayName = (field: string): string => {
  const mapping: { [key: string]: string } = {
    'temperature': 'Temperature',
    'humidity': 'Humidity',
    'soil_moisture': 'Soil Moisture',
    'soil': 'Soil Moisture',
    'air': 'Air Quality',
    'co2': 'Air Quality',
    'light': 'Light'
  };
  return mapping[field?.toLowerCase()] || field?.toUpperCase() || 'Unknown';
};

const getSensorIcon = (field: string) => {
  const fieldLower = field?.toLowerCase();
  if (fieldLower === 'temperature') return Thermometer;
  if (fieldLower === 'humidity') return Droplet;
  if (fieldLower === 'soil_moisture' || fieldLower === 'soil') return Leaf;
  if (fieldLower === 'air' || fieldLower === 'co2') return Wind;
  if (fieldLower === 'light') return Sun;
  return Activity;
};

const getSensorUnit = (field: string): string => {
  const fieldLower = field?.toLowerCase();
  const safeRange = SAFE_RANGES[fieldLower as keyof typeof SAFE_RANGES];
  if (safeRange) return safeRange.unit;
  
  if (fieldLower === 'temperature') return '°C';
  if (fieldLower === 'humidity') return '%';
  if (fieldLower === 'soil_moisture' || fieldLower === 'soil') return '%';
  if (fieldLower === 'light') return 'lux';
  if (fieldLower === 'air' || fieldLower === 'co2') return 'ppm';
  return '';
};

const getSensorColor = (sensorName: string): string => {
  const colors: { [key: string]: string } = {
    'Temperature': '#ef4444',
    'Humidity': '#3b82f6',
    'Soil Moisture': '#10b981',
    'Air Quality': '#8b5cf6',
    'Light': '#eab308',
    'Unknown': '#6b7280'
  };
  return colors[sensorName] || '#6b7280';
};

const getStatusMessage = (field: string, value: number): string => {
  const fieldLower = field?.toLowerCase();
  const safeRange = SAFE_RANGES[fieldLower as keyof typeof SAFE_RANGES];
  
  if (!safeRange) {
    return `The ${getSensorDisplayName(field)} reading is ${value}${getSensorUnit(field)}.`;
  }
  
  const { min, max, unit } = safeRange;
  const fieldName = getSensorDisplayName(field).toLowerCase();
  
  if (value < min) {
    if (fieldLower === 'temperature') {
      return `The ${fieldName} is ${value}${unit}, which is below the optimal range (${min}-${max}${unit}). Plants may experience slow growth.`;
    } else if (fieldLower === 'humidity') {
      return `The ${fieldName} is ${value}${unit}, which is below the optimal range (${min}-${max}${unit}). Air may be too dry for healthy plant growth.`;
    } else if (fieldLower === 'soil_moisture' || fieldLower === 'soil') {
      return `The ${fieldName} is ${value}${unit}, which is below the optimal range (${min}-${max}${unit}). Plants need immediate watering.`;
    } else if (fieldLower === 'light') {
      return `The ${fieldName} level is ${value}${unit}, which is below the optimal range (${min}-${max}${unit}). Plants may not be getting enough light.`;
    } else if (fieldLower === 'air' || fieldLower === 'co2') {
      return `The ${fieldName} is ${value}${unit}, which is within safe limits (0-${max}${unit}).`;
    }
    return `The ${fieldName} is ${value}${unit}, which is below the optimal range (${min}-${max}${unit}).`;
  } else if (value > max) {
    if (fieldLower === 'temperature') {
      return `The ${fieldName} is ${value}${unit}, which is above the optimal range (${min}-${max}${unit}). Plants may be heat-stressed.`;
    } else if (fieldLower === 'humidity') {
      return `The ${fieldName} is ${value}${unit}, which is above the optimal range (${min}-${max}${unit}). High humidity may promote fungal growth.`;
    } else if (fieldLower === 'soil_moisture' || fieldLower === 'soil') {
      return `The ${fieldName} is ${value}${unit}, which is above the optimal range (${min}-${max}${unit}). Risk of root rot. Stop watering.`;
    } else if (fieldLower === 'light') {
      return `The ${fieldName} level is ${value}${unit}, which is above the optimal range (${min}-${max}${unit}). Plants may get leaf burn.`;
    } else if (fieldLower === 'air' || fieldLower === 'co2') {
      return `The ${fieldName} is ${value}${unit}, which is above the safe limit (${max}${unit}). Poor air quality detected!`;
    }
    return `The ${fieldName} is ${value}${unit}, which is above the optimal range (${min}-${max}${unit}).`;
  }
  
  return `The ${fieldName} is ${value}${unit}, which is within the optimal range (${min}-${max}${unit}). Conditions are ideal.`;
};

const getSeverityColors = (severity: string) => {
  switch(severity.toLowerCase()) {
    case 'critical':
      return { bg: 'bg-red-50', border: 'border-red-500', icon: XCircle, iconColor: 'text-red-600', badge: 'bg-red-100 text-red-700', buttonColor: '#ef4444' };
    case 'high':
      return { bg: 'bg-orange-50', border: 'border-orange-500', icon: AlertTriangle, iconColor: 'text-orange-600', badge: 'bg-orange-100 text-orange-700', buttonColor: '#f97316' };
    case 'medium':
      return { bg: 'bg-yellow-50', border: 'border-yellow-500', icon: AlertCircle, iconColor: 'text-yellow-600', badge: 'bg-yellow-100 text-yellow-700', buttonColor: '#eab308' };
    case 'low':
      return { bg: 'bg-blue-50', border: 'border-blue-500', icon: CheckCircle, iconColor: 'text-blue-600', badge: 'bg-blue-100 text-blue-700', buttonColor: '#3b82f6' };
    case 'info':
      return { bg: 'bg-gray-50', border: 'border-gray-500', icon: Bell, iconColor: 'text-gray-600', badge: 'bg-gray-100 text-gray-700', buttonColor: '#6b7280' };
    default:
      return { bg: 'bg-gray-50', border: 'border-gray-500', icon: Bell, iconColor: 'text-gray-600', badge: 'bg-gray-100 text-gray-700', buttonColor: '#6b7280' };
  }
};

const getSeverityBoxColors = (severity: string) => {
  switch(severity) {
    case 'critical':
      return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        headerBg: 'bg-red-100',
        badgeBg: 'bg-red-500',
        valueBg: 'bg-red-50',
        valueText: 'text-red-700',
        actionBg: 'bg-red-50',
        actionBorder: 'border-red-200',
        actionText: 'text-red-800',
        iconColor: 'text-red-600'
      };
    case 'high':
      return {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        headerBg: 'bg-orange-100',
        badgeBg: 'bg-orange-500',
        valueBg: 'bg-orange-50',
        valueText: 'text-orange-700',
        actionBg: 'bg-orange-50',
        actionBorder: 'border-orange-200',
        actionText: 'text-orange-800',
        iconColor: 'text-orange-600'
      };
    case 'medium':
      return {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        headerBg: 'bg-yellow-100',
        badgeBg: 'bg-yellow-500',
        valueBg: 'bg-yellow-50',
        valueText: 'text-yellow-700',
        actionBg: 'bg-yellow-50',
        actionBorder: 'border-yellow-200',
        actionText: 'text-yellow-800',
        iconColor: 'text-yellow-600'
      };
    case 'low':
      return {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        headerBg: 'bg-blue-100',
        badgeBg: 'bg-blue-500',
        valueBg: 'bg-blue-50',
        valueText: 'text-blue-700',
        actionBg: 'bg-blue-50',
        actionBorder: 'border-blue-200',
        actionText: 'text-blue-800',
        iconColor: 'text-blue-600'
      };
    case 'info':
      return {
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        headerBg: 'bg-gray-100',
        badgeBg: 'bg-gray-500',
        valueBg: 'bg-gray-50',
        valueText: 'text-gray-700',
        actionBg: 'bg-gray-50',
        actionBorder: 'border-gray-200',
        actionText: 'text-gray-800',
        iconColor: 'text-gray-600'
      };
    default:
      return {
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        headerBg: 'bg-gray-100',
        badgeBg: 'bg-gray-500',
        valueBg: 'bg-gray-50',
        valueText: 'text-gray-700',
        actionBg: 'bg-gray-50',
        actionBorder: 'border-gray-200',
        actionText: 'text-gray-800',
        iconColor: 'text-gray-600'
      };
  }
};

interface AlertsPageProps {
  selectedAlertId?: string | null;
}

export function AlertsPage({ selectedAlertId }: AlertsPageProps) {
  const [showReport, setShowReport] = useState(false);
  const [trendRange, setTrendRange] = useState<'24h' | '48h' | '72h'>('24h');
  const [chartSeverityFilter, setChartSeverityFilter] = useState<string[]>(['critical', 'high', 'medium', 'low']);
  const [historySeverityFilter, setHistorySeverityFilter] = useState<string>('all');
  const [historyTimeFilter, setHistoryTimeFilter] = useState<'24h' | '48h' | '72h' | '7d' | '30d'>('24h');
  const [categoryTimeFilter, setCategoryTimeFilter] = useState<'24h' | '48h' | '72h' | '7d' | '30d'>('24h');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Auto refresh every 2 seconds
  useEffect(() => {
    fetchAlerts();

    const interval = setInterval(() => {
      fetchAlerts(false);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedAlertId) {
      const element = document.getElementById(`alert-${selectedAlertId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('ring-2', 'ring-emerald-500');
        setTimeout(() => {
          element.classList.remove('ring-2', 'ring-emerald-500');
        }, 2000);
      }
    }
  }, [selectedAlertId, alerts]);

  const fetchAlerts = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }

      setError(null);

      const response = await fetch('/api/alerts?limit=100000');

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const newAlerts = data.data || (Array.isArray(data) ? data : []);

      setAlerts(prev => {
        if (JSON.stringify(prev) !== JSON.stringify(newAlerts)) {
          console.log(`Alerts updated: ${prev.length} -> ${newAlerts.length}`);
          return newAlerts;
        }
        return prev;
      });

    } catch (err) {
      console.error('Error fetching alerts:', err);
      setError(err instanceof Error ? err.message : 'Failed to load alerts');
    } finally {
      if (showLoading) {
        setLoading(false);
      }
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAlerts(true);
  };

  const handleClearAllAlerts = async () => {
    if (!confirm("Are you sure you want to delete ALL alerts? This action cannot be undone.")) return;

    try {
      const res = await fetch("/api/alerts/clear", {
        method: "DELETE"
      });

      const data = await res.json();
      console.log(data.message);
      
      // Refresh the alerts list
      await fetchAlerts(true);
    } catch (err) {
      console.error("Failed to clear alerts", err);
      alert("Failed to clear alerts. Please try again.");
    }
  };

  const toggleChartSeverity = (severity: string) => {
    if (chartSeverityFilter.includes(severity)) {
      if (chartSeverityFilter.length === 1) return;
      setChartSeverityFilter(chartSeverityFilter.filter(s => s !== severity));
    } else {
      setChartSeverityFilter([...chartSeverityFilter, severity]);
    }
  };

  const applyTimeFilter = (alertsList: Alert[], timeFilter: string) => {
    const now = new Date();
    let hours = 0;
    switch(timeFilter) {
      case '24h': hours = 24; break;
      case '48h': hours = 48; break;
      case '72h': hours = 72; break;
      case '7d': hours = 168; break;
      case '30d': hours = 720; break;
      default: return alertsList;
    }
    
    const cutoffTime = new Date(now.getTime() - hours * 60 * 60 * 1000);
    return alertsList.filter(alert => new Date(alert.timestamp) >= cutoffTime);
  };

  const getTrendFilteredAlerts = () => {
    let filtered = alerts;
    const now = new Date();
    let hours = 24;
    switch(trendRange) {
      case '24h': hours = 24; break;
      case '48h': hours = 48; break;
      case '72h': hours = 72; break;
    }
    const cutoffTime = new Date(now.getTime() - hours * 60 * 60 * 1000);
    filtered = filtered.filter(alert => new Date(alert.timestamp) >= cutoffTime);
    return filtered;
  };

  const getHistoryFilteredAlerts = () => {
    let filtered = alerts;
    if (historySeverityFilter !== 'all') {
      filtered = filtered.filter(alert => alert.severity === historySeverityFilter);
    }
    filtered = applyTimeFilter(filtered, historyTimeFilter);
    return filtered;
  };

  const getCategoryFilteredAlerts = () => {
    let filtered = alerts;
    filtered = applyTimeFilter(filtered, categoryTimeFilter);
    return filtered;
  };

  const getXAxisLabels = () => {
    switch(trendRange) {
      case '24h': return ['Now', '6h ago', '12h ago', '18h ago', '24h ago'];
      case '48h': return ['Now', '12h ago', '24h ago', '36h ago', '48h ago'];
      case '72h': return ['Now', '18h ago', '36h ago', '54h ago', '72h ago'];
      default: return ['Now', '6h ago', '12h ago', '18h ago', '24h ago'];
    }
  };

  const getAlertTrends = () => {
    const filteredAlerts = getTrendFilteredAlerts();
    if (filteredAlerts.length === 0) return [];

    const now = new Date();
    let totalHours = 24;
    let numIntervals = 4; // 5 points means 4 intervals
    
    switch(trendRange) {
      case '24h': 
        totalHours = 24; 
        numIntervals = 4;
        break;
      case '48h': 
        totalHours = 48; 
        numIntervals = 4;
        break;
      case '72h': 
        totalHours = 72; 
        numIntervals = 4;
        break;
    }

    const xAxisLabels = getXAxisLabels();
    
    // Initialize trend data structure
    const trends: { [key: string]: { critical: number; high: number; medium: number; low: number } } = {};
    
    xAxisLabels.forEach(label => {
      trends[label] = { critical: 0, high: 0, medium: 0, low: 0 };
    });
    
    // Calculate hours per interval
    const hoursPerInterval = totalHours / numIntervals;
    
    // Process each alert
    filteredAlerts.forEach(alert => {
      // Check if severity should be included
      if (!chartSeverityFilter.includes(alert.severity.toLowerCase())) return;
      
      const alertDate = new Date(alert.timestamp);
      const hoursDiff = (now.getTime() - alertDate.getTime()) / (1000 * 60 * 60);
      
      // Skip alerts outside the time range
      if (hoursDiff > totalHours) return;
      
      // Calculate which interval this alert belongs to
      let intervalIndex = Math.floor(hoursDiff / hoursPerInterval);
      
      // Ensure interval index is within bounds
      if (intervalIndex >= numIntervals) intervalIndex = numIntervals - 1;
      if (intervalIndex < 0) intervalIndex = 0;
      
      // Map interval index to x-axis label
      const xAxisLabel = xAxisLabels[intervalIndex + 1] || xAxisLabels[xAxisLabels.length - 1];
      
      const severity = alert.severity.toLowerCase();
      if (severity === 'critical') trends[xAxisLabel].critical++;
      else if (severity === 'high') trends[xAxisLabel].high++;
      else if (severity === 'medium') trends[xAxisLabel].medium++;
      else if (severity === 'low') trends[xAxisLabel].low++;
    });
    
    // Convert to array format for recharts
    return xAxisLabels.map(label => ({
      time: label,
      critical: trends[label]?.critical || 0,
      high: trends[label]?.high || 0,
      medium: trends[label]?.medium || 0,
      low: trends[label]?.low || 0
    }));
  };

  const getAlertsByCategory = () => {
    const filteredAlerts = getCategoryFilteredAlerts();
    if (filteredAlerts.length === 0) return [];
    
    const categoryCount: { [key: string]: number } = {};
    filteredAlerts.forEach(alert => {
      const displayName = getSensorDisplayName(alert.field);
      categoryCount[displayName] = (categoryCount[displayName] || 0) + 1;
    });
    
    const total = Object.values(categoryCount).reduce((a, b) => a + b, 0);
    return Object.entries(categoryCount).map(([name, count]) => ({
      name: name,
      value: count,
      percentage: ((count / total) * 100).toFixed(0),
      color: getSensorColor(name)
    }));
  };

  const activeAlerts = alerts.filter(alert => {
    const alertDate = new Date(alert.createdAt || alert.timestamp);
    const hoursSince = (Date.now() - alertDate.getTime()) / (1000 * 60 * 60);
    return hoursSince <= 24;
  }).length;
  
  const criticalCount = alerts.filter(alert => alert.severity === 'critical').length;
  const highCount = alerts.filter(alert => alert.severity === 'high').length;
  const mediumCount = alerts.filter(alert => alert.severity === 'medium').length;
  const lowCount = alerts.filter(alert => alert.severity === 'low').length;

  const historyAlerts = getHistoryFilteredAlerts()
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 50);

  const summaryCards = [
    { title: 'Critical Alerts', value: criticalCount, tag: '🔴 Critical', icon: XCircle, styles: 'from-red-50 to-red-100/60 border-red-200', description: 'Immediate action required', severity: 'critical' },
    { title: 'High Priority', value: highCount, tag: '🟠 High', icon: AlertTriangle, styles: 'from-orange-50 to-orange-100/60 border-orange-200', description: 'Action needed soon', severity: 'high' },
    { title: 'Medium Priority', value: mediumCount, tag: '🟡 Medium', icon: AlertCircle, styles: 'from-yellow-50 to-yellow-100/60 border-yellow-200', description: 'Monitor closely', severity: 'medium' },
    { title: 'Low Priority', value: lowCount, tag: '🔵 Low', icon: CheckCircle, styles: 'from-blue-50 to-blue-100/60 border-blue-200', description: 'Informational only', severity: 'low' }
  ];

  const formatYAxisTick = (value: number) => {
    if (Number.isInteger(value)) return value.toString();
    return value.toFixed(1);
  };

  // If showing report, render AlertReport
  if (showReport) {
    return <AlertReport alerts={alerts} onBack={() => setShowReport(false)} />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading alerts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Alerts Management</h2>
          <p className="text-base text-gray-500 mt-1">Monitor and manage all system alerts and notifications</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 flex items-center gap-2 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="text-sm">Refresh</span>
          </button>
          <div className="rounded-lg border border-gray-200 bg-white px-4 py-2">
            <p className="text-sm text-gray-500">Active Alerts</p>
            <p className="text-2xl font-semibold text-gray-900">{activeAlerts}</p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 text-sm">{error}</p>
          <button onClick={() => fetchAlerts(true)} className="mt-2 text-sm text-yellow-700 hover:text-yellow-900 underline">
            Click to retry
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className={`rounded-xl border bg-gradient-to-br ${card.styles} shadow-sm p-4 cursor-pointer transition-all hover:scale-105`}
              onClick={() => setHistorySeverityFilter(historySeverityFilter === card.severity ? 'all' : card.severity)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-md bg-white/80 flex items-center justify-center">
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-sm font-semibold bg-white/80 px-2 py-1 rounded-full">{card.tag}</span>
              </div>
              <p className="text-sm font-medium text-gray-700">{card.title}</p>
              <p className="text-xs text-gray-600 mt-0.5">{card.description}</p>
              <div className="mt-1">
                <span className="text-3xl font-bold text-gray-900">{card.value}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left Column */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {/* Alert Trends Chart */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <h3 className="text-xl font-semibold text-gray-800">Alert Trends</h3>
              <select
                value={trendRange}
                onChange={(e) => setTrendRange(e.target.value as any)}
                className="text-sm px-3 py-1.5 rounded-md border border-gray-200 bg-white"
              >
                <option value="24h">Last 24 Hours</option>
                <option value="48h">Last 48 Hours</option>
                <option value="72h">Last 72 Hours</option>
              </select>
            </div>
            
            <div className="mb-4 flex items-center gap-2 flex-wrap border-b border-gray-200 pb-3">
              <span className="text-sm text-gray-500 mr-2">Show on chart:</span>
              {['critical', 'high', 'medium', 'low'].map((severity) => {
                const isActive = chartSeverityFilter.includes(severity);
                const colors = getSeverityColors(severity);
                return (
                  <button
                    key={severity}
                    onClick={() => toggleChartSeverity(severity)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      isActive ? 'text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    style={isActive ? { backgroundColor: colors.buttonColor } : {}}
                  >
                    {severity.charAt(0).toUpperCase() + severity.slice(1)}
                  </button>
                );
              })}
            </div>
            
            <div className="h-64">
              {getAlertTrends().length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={getAlertTrends()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="time" stroke="#6b7280" height={40} interval={0} />
                    <YAxis stroke="#6b7280" tickFormatter={formatYAxisTick} domain={[0, 'auto']} />
                    <Tooltip formatter={(value: number, name: string) => [`${value} alerts`, name]} />
                    <Legend />
                    {chartSeverityFilter.includes('critical') && <Line type="monotone" dataKey="critical" stroke="#ef4444" strokeWidth={2} name="Critical" dot={{ r: 4 }} />}
                    {chartSeverityFilter.includes('high') && <Line type="monotone" dataKey="high" stroke="#f97316" strokeWidth={2} name="High" dot={{ r: 4 }} />}
                    {chartSeverityFilter.includes('medium') && <Line type="monotone" dataKey="medium" stroke="#eab308" strokeWidth={2} name="Medium" dot={{ r: 4 }} />}
                    {chartSeverityFilter.includes('low') && <Line type="monotone" dataKey="low" stroke="#3b82f6" strokeWidth={2} name="Low" dot={{ r: 4 }} />}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-gray-500">No alert data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Alert History */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <h3 className="text-xl font-semibold text-gray-800">Alert History</h3>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleClearAllAlerts}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-md text-sm transition-colors"
                >
                  Clear All
                </button>

                <select
                  value={historySeverityFilter}
                  onChange={(e) => setHistorySeverityFilter(e.target.value)}
                  className="text-sm px-3 py-1.5 rounded-md border border-gray-200 bg-white"
                >
                  <option value="all">All Severities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>

                <select
                  value={historyTimeFilter}
                  onChange={(e) => setHistoryTimeFilter(e.target.value as any)}
                  className="text-sm px-3 py-1.5 rounded-md border border-gray-200 bg-white"
                >
                  <option value="24h">Last 24 Hours</option>
                  <option value="48h">Last 48 Hours</option>
                  <option value="72h">Last 72 Hours</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                </select>
              </div>
            </div>

            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
              {historyAlerts.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No alerts found</p>
                  <p className="text-sm text-gray-400 mt-1">Try changing your filters</p>
                </div>
              ) : (
                historyAlerts.map((alert) => {
                  const SensorIcon = getSensorIcon(alert.field);
                  const unit = getSensorUnit(alert.field);
                  const safeRange = SAFE_RANGES[alert.field?.toLowerCase() as keyof typeof SAFE_RANGES];
                  const min = safeRange?.min || alert.min;
                  const max = safeRange?.max || alert.max;
                  const isLow = alert.value < min;
                  const isHigh = alert.value > max;
                  const boxColors = getSeverityBoxColors(alert.severity);
                  const statusMessage = getStatusMessage(alert.field, alert.value);
                  
                  return (
                    <div
                      key={alert._id}
                      id={`alert-${alert._id}`}
                      className={`rounded-lg border ${boxColors.border} ${boxColors.bg} shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden`}
                    >
                      <div className={`px-4 py-3 border-b ${boxColors.border} ${boxColors.headerBg}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <SensorIcon className={`w-5 h-5 ${boxColors.iconColor}`} />
                            <h4 className="font-semibold text-gray-900">
                              {alert.title || `${getSensorDisplayName(alert.field)} Alert`}
                            </h4>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full text-white ${boxColors.badgeBg}`}>
                              {alert.severity?.toUpperCase() || 'INFO'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatTimeLabel(alert.timestamp)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="p-4">
                        <p className="text-gray-700 text-sm">
                          {alert.message || statusMessage}
                        </p>

                        <div className="mt-4 grid grid-cols-2 gap-3">
                          <div className={`rounded-lg p-3 ${boxColors.valueBg} border ${boxColors.border}`}>
                            <p className="text-xs text-gray-500 mb-1">Current Value</p>
                            <p className={`text-xl font-bold ${isLow || isHigh ? boxColors.valueText : 'text-green-600'}`}>
                              {alert.value}{unit}
                            </p>
                          </div>
                          <div className={`rounded-lg p-3 ${boxColors.valueBg} border ${boxColors.border}`}>
                            <p className="text-xs text-gray-500 mb-1">Safe Range</p>
                            <p className="text-base font-semibold text-gray-700">
                              {min} - {max}{unit}
                            </p>
                          </div>
                        </div>

                        <div className={`mt-4 rounded-lg p-3 border ${boxColors.actionBorder} ${boxColors.actionBg}`}>
                          <div className="flex items-start gap-2">
                            <ArrowRight className={`w-4 h-4 ${boxColors.actionText} mt-0.5`} />
                            <div className="flex-1">
                              <p className={`text-xs font-medium ${boxColors.actionText}`}>Recommended Action:</p>
                              <p className={`text-sm ${boxColors.actionText}`}>
                                {isLow ? `Increase ${getSensorDisplayName(alert.field).toLowerCase()} to optimal range (${min}-${max}${unit})` :
                                 isHigh ? `Reduce ${getSensorDisplayName(alert.field).toLowerCase()} to optimal range (${min}-${max}${unit})` :
                                 `Maintain current ${getSensorDisplayName(alert.field).toLowerCase()} levels`}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* Alerts by Category */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Alerts by Category</h3>
              <select
                value={categoryTimeFilter}
                onChange={(e) => setCategoryTimeFilter(e.target.value as any)}
                className="text-sm px-3 py-1.5 rounded-md border border-gray-200 bg-white"
              >
                <option value="24h">Last 24 Hours</option>
                <option value="48h">Last 48 Hours</option>
                <option value="72h">Last 72 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
            </div>
            
            {getAlertsByCategory().length > 0 ? (
              <>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={getAlertsByCategory()}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        dataKey="value"
                        label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                        labelLine={true}
                      >
                        {getAlertsByCategory().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number, name: string, props: any) => [`${value} (${props.payload.percentage}%)`, name]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                  {getAlertsByCategory().map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm text-gray-700">{item.name}</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">
                        {item.value} ({item.percentage}%)
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-48 flex items-center justify-center">
                <p className="text-gray-500 text-sm">No category data available</p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button 
                onClick={handleRefresh}
                disabled={refreshing}
                className="w-full flex items-center gap-3 rounded-lg border border-violet-200 bg-violet-50 px-4 py-3 hover:bg-violet-100 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 text-violet-600 ${refreshing ? 'animate-spin' : ''}`} />
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-800">Refresh Alerts</p>
                  <p className="text-xs text-gray-600">Get latest updates</p>
                </div>
              </button>
              
              <button 
                onClick={() => setShowReport(true)}
                className="w-full flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 hover:bg-blue-100 transition-colors"
              >
                <Download className="w-4 h-4 text-blue-600" />
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-800">Generate Report</p>
                  <p className="text-xs text-gray-600">View and export detailed report</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}