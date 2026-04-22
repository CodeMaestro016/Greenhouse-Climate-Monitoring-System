import { useState, useEffect } from 'react';
import { 
  XCircle, AlertTriangle, AlertCircle, CheckCircle, 
  Bell, Download, MoreVertical, ArrowRight, Filter,
  Calendar, TrendingUp, Activity
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, CartesianGrid, 
  XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell 
} from 'recharts';
import { alertsHistory, alertTrends, alertsByCategory } from "../components/data/alertData";
interface AlertsPageProps {
  selectedAlertId?: number | null;
}

export function AlertsPage({ selectedAlertId }: AlertsPageProps) {
  const [trendRange, setTrendRange] = useState<'24h' | '48h' | '72h' | 'all'>('24h');
  const [historyRange, setHistoryRange] = useState<'24h' | '48h' | '72h' | 'all'>('24h');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');

  const chartPointsByRange = {
    '24h': 4,
    '48h': 5,
    '72h': 7,
    all: alertTrends.length
  };

  const historyRowsByRange = {
    '24h': 4,
    '48h': 6,
    '72h': alertsHistory.length,
    all: alertsHistory.length
  };

  const filteredAlertTrends = alertTrends.slice(-chartPointsByRange[trendRange]);
  
  const filteredAlertsHistory = alertsHistory
    .slice(0, historyRowsByRange[historyRange])
    .filter(alert => selectedSeverity === 'all' || alert.severity === selectedSeverity);

  useEffect(() => {
    if (selectedAlertId && historyRange !== 'all' && !filteredAlertsHistory.some(alert => alert.id === selectedAlertId)) {
      setHistoryRange('all');
    }
  }, [selectedAlertId, historyRange, filteredAlertsHistory]);

  useEffect(() => {
    if (selectedAlertId && filteredAlertsHistory.some(alert => alert.id === selectedAlertId)) {
      const element = document.getElementById(`alert-${selectedAlertId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('ring-2', 'ring-emerald-400', 'ring-offset-2');
        setTimeout(() => {
          element.classList.remove('ring-2', 'ring-emerald-400', 'ring-offset-2');
        }, 2000);
      }
    }
  }, [selectedAlertId, filteredAlertsHistory]);

  const activeAlerts = alertsHistory.filter(alert => alert.status === 'active').length;
  const criticalCount = alertsHistory.filter(alert => alert.severity === 'critical').length;
  const highCount = alertsHistory.filter(alert => alert.severity === 'high').length;
  const mediumCount = alertsHistory.filter(alert => alert.severity === 'medium').length;
  const lowCount = alertsHistory.filter(alert => alert.severity === 'low').length;

  const summaryCards = [
    {
      title: 'Critical Alerts',
      value: criticalCount,
      delta: '+5 today',
      tag: 'Critical',
      icon: XCircle,
      styles: 'from-red-50 to-red-100/60 border-red-200 text-red-700'
    },
    {
      title: 'High Priority',
      value: highCount,
      delta: '+3 today',
      tag: 'High',
      icon: AlertTriangle,
      styles: 'from-orange-50 to-orange-100/60 border-orange-200 text-orange-700'
    },
    {
      title: 'Medium Priority',
      value: mediumCount,
      delta: '+2 today',
      tag: 'Medium',
      icon: AlertCircle,
      styles: 'from-yellow-50 to-yellow-100/60 border-yellow-200 text-yellow-700'
    },
    {
      title: 'Low Priority',
      value: lowCount,
      delta: '+1 today',
      tag: 'Low',
      icon: CheckCircle,
      styles: 'from-blue-50 to-blue-100/60 border-blue-200 text-blue-700'
    }
  ];

  const getSeverityColors = (severity: string) => {
    switch(severity) {
      case 'critical':
        return { bg: 'bg-red-50', border: 'border-red-500', icon: XCircle, iconColor: 'text-red-600', textColor: 'text-red-700' };
      case 'high':
        return { bg: 'bg-orange-50', border: 'border-orange-500', icon: AlertTriangle, iconColor: 'text-orange-600', textColor: 'text-orange-700' };
      case 'medium':
        return { bg: 'bg-yellow-50', border: 'border-yellow-500', icon: AlertCircle, iconColor: 'text-yellow-600', textColor: 'text-yellow-700' };
      default:
        return { bg: 'bg-blue-50', border: 'border-blue-500', icon: CheckCircle, iconColor: 'text-blue-600', textColor: 'text-blue-700' };
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active': return 'bg-red-100 text-red-700';
      case 'acknowledged': return 'bg-blue-100 text-blue-700';
      default: return 'bg-green-100 text-green-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Alerts Management</h2>
          <p className="text-base text-gray-500 mt-1">Monitor and manage all system alerts and notifications</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white px-4 py-2">
          <p className="text-sm text-gray-500">Active Alerts</p>
          <p className="text-2xl font-semibold text-gray-900">{activeAlerts}</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className={`rounded-xl border bg-gradient-to-br ${card.styles} shadow-sm p-4`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-md bg-white/80 flex items-center justify-center">
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-sm font-semibold bg-white/80 px-2 py-1 rounded-full">
                  {card.tag}
                </span>
              </div>
              <p className="text-sm font-medium text-gray-700">{card.title}</p>
              <div className="mt-1 flex items-end gap-1">
                <span className="text-3xl font-bold text-gray-900">{card.value}</span>
                <span className="text-sm text-gray-600">{card.delta}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Main Content - Left Column */}
        <div className="col-span-9 space-y-6">
          {/* Alert Trends Chart */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Alert Trends</h3>
              <select
                value={trendRange}
                onChange={(e) => setTrendRange(e.target.value as any)}
                className="text-sm px-3 py-1.5 rounded-md border border-gray-200 bg-white"
              >
                <option value="24h">Last 24 Hours</option>
                <option value="48h">Last 48 Hours</option>
                <option value="72h">Last 72 Hours</option>
                <option value="all">All Time</option>
              </select>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={filteredAlertTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="time" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="critical" stroke="#ef4444" strokeWidth={2} name="Critical" />
                  <Line type="monotone" dataKey="high" stroke="#f97316" strokeWidth={2} name="High" />
                  <Line type="monotone" dataKey="medium" stroke="#eab308" strokeWidth={2} name="Medium" />
                  <Line type="monotone" dataKey="low" stroke="#3b82f6" strokeWidth={2} name="Low" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Alert History */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Alert History</h3>
              <div className="flex items-center gap-2">
                <select
                  value={selectedSeverity}
                  onChange={(e) => setSelectedSeverity(e.target.value)}
                  className="text-sm px-3 py-1.5 rounded-md border border-gray-200 bg-white"
                >
                  <option value="all">All Severities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <select
                  value={historyRange}
                  onChange={(e) => setHistoryRange(e.target.value as any)}
                  className="text-sm px-3 py-1.5 rounded-md border border-gray-200 bg-white"
                >
                  <option value="24h">Last 24 Hours</option>
                  <option value="48h">Last 48 Hours</option>
                  <option value="72h">Last 72 Hours</option>
                  <option value="all">All Time</option>
                </select>
              </div>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {filteredAlertsHistory.map((alert) => {
                const colors = getSeverityColors(alert.severity);
                const Icon = colors.icon;
                
                return (
                  <div
                    key={alert.id}
                    id={`alert-${alert.id}`}
                    className={`rounded-lg border-l-4 ${colors.bg} ${colors.border} p-4 transition-all`}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className={`w-5 h-5 mt-0.5 ${colors.iconColor}`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h4 className="text-base font-semibold text-gray-900">{alert.title}</h4>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getStatusColor(alert.status)}`}>
                            {alert.status}
                          </span>
                          <span className="text-xs text-gray-400">{alert.date}</span>
                        </div>
                        <p className="text-sm text-gray-600">{alert.message}</p>
                        <p className="text-xs text-gray-400 mt-1">{alert.time} • {alert.sensor}</p>
                        
                        <div className="mt-3 rounded-md bg-white/60 p-3">
                          <div className="flex items-center gap-1 mb-1">
                            <ArrowRight className="w-3 h-3 text-emerald-700" />
                            <span className="text-xs font-bold text-emerald-800">Recommended Action</span>
                          </div>
                          <p className="text-sm text-gray-700">{alert.recommendedAction}</p>
                        </div>
                      </div>
                      <button className="p-1 hover:bg-white/70 rounded transition-colors">
                        <MoreVertical className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar - Right Column */}
        <div className="col-span-3 space-y-6">
          {/* Alerts by Category Pie Chart */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Alerts by Category</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={alertsByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    dataKey="value"
                    label
                  >
                    {alertsByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {alertsByCategory.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-gray-700">{item.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button className="w-full flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 hover:bg-emerald-100 transition-colors">
                <Bell className="w-4 h-4 text-emerald-600" />
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-800">Configure Notifications</p>
                  <p className="text-xs text-gray-600">Set alert channels</p>
                </div>
              </button>
              <button className="w-full flex items-center gap-3 rounded-lg border border-violet-200 bg-violet-50 px-4 py-3 hover:bg-violet-100 transition-colors">
                <Download className="w-4 h-4 text-violet-600" />
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-800">Export Alert Report</p>
                  <p className="text-xs text-gray-600">Download summary</p>
                </div>
              </button>
              <button className="w-full flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 hover:bg-blue-100 transition-colors">
                <Filter className="w-4 h-4 text-blue-600" />
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-800">Advanced Filters</p>
                  <p className="text-xs text-gray-600">Custom alert views</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}