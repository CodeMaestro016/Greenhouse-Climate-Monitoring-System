import { useEffect, useState } from 'react';
import {
  Thermometer,
  Droplets,
  Sprout,
  Sun,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar,
  Bell,
  Settings,
  Home,
  BarChart3,
  AlertCircle,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  Filter,
  Search,
  MoreVertical,
  Check,
  X,
  History as HistoryIcon,
  Download,
  Wind,
  Gauge,
  ArrowRight,
  Bot,
  MessageCircle,
  Send,
  Sparkles,
  Minimize2,
  Maximize2
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  Legend,
  PieChart as RePieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart
} from 'recharts';

// Mock sensor data with trends
const sensorData = {
  temperature: {
    current: 28.5,
    unit: '°C',
    status: 'optimal',
    trend: 'up',
    change: '+1.2',
    trendData: [26, 26.5, 27, 27.2, 27.8, 28.1, 28.5]
  },
  humidity: {
    current: 72,
    unit: '%',
    status: 'warning',
    trend: 'down',
    change: '-3',
    trendData: [78, 77, 76, 75, 74, 73, 72]
  },
  soilMoisture: {
    current: 45,
    unit: '%',
    status: 'critical',
    trend: 'down',
    change: '-8',
    trendData: [55, 53, 51, 49, 47, 46, 45]
  },
  lightIntensity: {
    current: 8500,
    unit: 'lux',
    status: 'optimal',
    trend: 'up',
    change: '+200',
    trendData: [7800, 8000, 8100, 8200, 8300, 8400, 8500]
  }
};

// Risk factors
const riskFactors = [
  { name: 'Soil Moisture', value: 65, color: '#ef4444' },
  { name: 'Humidity', value: 40, color: '#f59e0b' },
  { name: 'Temperature', value: 20, color: '#10b981' },
  { name: 'Light', value: 15, color: '#3b82f6' }
];

// Advice cards
const adviceCards = [
  {
    icon: Droplets,
    title: 'Water your plants now',
    description: 'Soil moisture is low. Irrigate for 15 minutes.',
    priority: 'high',
    action: 'Start Irrigation'
  },
  {
    icon: Sun,
    title: 'Adjust shade cloth',
    description: 'Light levels are good, maintain current setup.',
    priority: 'low',
    action: 'View Settings'
  },
  {
    icon: Thermometer,
    title: 'Temperature rising',
    description: 'Open vents if temp exceeds 30°C.',
    priority: 'medium',
    action: 'Open Vents'
  }
];

// Warnings
const warnings = [
  {
    id: 1,
    severity: 'high',
    title: 'Critical Soil Moisture',
    message: 'Soil moisture at 45% - below safe threshold',
    time: '2 min ago',
    action: 'Irrigate Now'
  },
  {
    id: 2,
    severity: 'medium',
    title: 'Humidity Decreasing',
    message: 'Humidity dropped 3% in last hour',
    time: '15 min ago',
    action: 'Check Misters'
  },
  {
    id: 3,
    severity: 'low',
    title: 'Temperature Normal',
    message: 'All temperature readings within range',
    time: '1 hour ago',
    action: 'View Details'
  }
];

// Historical data
const historicalData = [
  { time: '00:00', danger: 25, temp: 24, humidity: 80, soil: 55 },
  { time: '04:00', danger: 30, temp: 23, humidity: 82, soil: 54 },
  { time: '08:00', danger: 45, temp: 26, humidity: 78, soil: 52 },
  { time: '12:00', danger: 60, temp: 29, humidity: 75, soil: 48 },
  { time: '16:00', danger: 70, temp: 30, humidity: 72, soil: 46 },
  { time: '20:00', danger: 65, temp: 28, humidity: 74, soil: 45 },
  { time: '23:59', danger: 55, temp: 26, humidity: 76, soil: 45 }
];

// Analytics Data
const weeklyData = [
  { day: 'Mon', temp: 27, humidity: 75, soil: 52, light: 8200, alerts: 3 },
  { day: 'Tue', temp: 28, humidity: 73, soil: 50, light: 8300, alerts: 5 },
  { day: 'Wed', temp: 26, humidity: 78, soil: 48, light: 7900, alerts: 7 },
  { day: 'Thu', temp: 29, humidity: 70, soil: 46, light: 8500, alerts: 8 },
  { day: 'Fri', temp: 28, humidity: 72, soil: 45, light: 8400, alerts: 6 },
  { day: 'Sat', temp: 27, humidity: 74, soil: 47, light: 8100, alerts: 4 },
  { day: 'Sun', temp: 28, humidity: 72, soil: 45, light: 8500, alerts: 5 }
];

const performanceMetrics = [
  { name: 'Uptime', value: 99.8, target: 99.5, status: 'excellent' },
  { name: 'Response Time', value: 1.2, target: 2.0, status: 'good', unit: 's' },
  { name: 'Efficiency', value: 94, target: 90, status: 'excellent' },
  { name: 'Energy Use', value: 85, target: 80, status: 'warning' }
];

const sensorDistribution = [
  { name: 'Optimal', value: 45, color: '#10b981' },
  { name: 'Warning', value: 35, color: '#f59e0b' },
  { name: 'Critical', value: 20, color: '#ef4444' }
];

const radarData = [
  { metric: 'Temperature', current: 85, optimal: 95 },
  { metric: 'Humidity', current: 70, optimal: 95 },
  { metric: 'Soil', current: 55, optimal: 95 },
  { metric: 'Light', current: 90, optimal: 95 },
  { metric: 'Stability', current: 75, optimal: 95 },
  { metric: 'Efficiency', current: 88, optimal: 95 }
];

const correlationData = [
  { hour: '00', tempHumidity: 85, soilTemp: 72, lightTemp: 45 },
  { hour: '04', tempHumidity: 88, soilTemp: 75, lightTemp: 48 },
  { hour: '08', tempHumidity: 78, soilTemp: 68, lightTemp: 65 },
  { hour: '12', tempHumidity: 65, soilTemp: 55, lightTemp: 85 },
  { hour: '16', tempHumidity: 62, soilTemp: 52, lightTemp: 88 },
  { hour: '20', tempHumidity: 75, soilTemp: 65, lightTemp: 70 },
  { hour: '23', tempHumidity: 82, soilTemp: 70, lightTemp: 52 }
];

// Alerts Data
const alertsHistory = [
  { 
    id: 1, 
    type: 'Temperature', 
    severity: 'high', 
    title: 'High Temperature Alert', 
    message: 'Temperature exceeded 32°C threshold', 
    time: '2 min ago', 
    date: 'Mar 12, 2026', 
    sensor: 'Temp Sensor #3', 
    status: 'active',
    recommendedAction: 'Reduce temperature to optimal point (26-28°C). Open vents immediately and activate cooling system. Monitor for 15 minutes.'
  },
  { 
    id: 2, 
    type: 'Soil Moisture', 
    severity: 'critical', 
    title: 'Critical Soil Moisture', 
    message: 'Soil moisture at 45% - below safe threshold', 
    time: '5 min ago', 
    date: 'Mar 12, 2026', 
    sensor: 'Soil Sensor #1', 
    status: 'active',
    recommendedAction: 'Irrigate immediately for 15-20 minutes to reach optimal level (50-60%). Check irrigation system for blockages.'
  },
  { 
    id: 3, 
    type: 'Humidity', 
    severity: 'medium', 
    title: 'Humidity Decreasing', 
    message: 'Humidity dropped 3% in last hour', 
    time: '15 min ago', 
    date: 'Mar 12, 2026', 
    sensor: 'Humidity Sensor #2', 
    status: 'active',
    recommendedAction: 'Activate misting system to increase humidity to optimal range (70-80%). Ensure proper ventilation balance.'
  },
  { 
    id: 4, 
    type: 'Light', 
    severity: 'low', 
    title: 'Light Intensity Low', 
    message: 'Light levels below optimal range', 
    time: '1 hour ago', 
    date: 'Mar 12, 2026', 
    sensor: 'Light Sensor #1', 
    status: 'resolved',
    recommendedAction: 'Adjust shade cloth or supplemental lighting to reach 8000-10000 lux. Clean greenhouse panels if dirty.'
  },
  { 
    id: 5, 
    type: 'Temperature', 
    severity: 'medium', 
    title: 'Temperature Rising', 
    message: 'Temperature trending upward', 
    time: '2 hours ago', 
    date: 'Mar 12, 2026', 
    sensor: 'Temp Sensor #1', 
    status: 'acknowledged',
    recommendedAction: 'Monitor temperature closely. Prepare to open vents if temperature exceeds 30°C. Check cooling system readiness.'
  },
  { 
    id: 6, 
    type: 'Soil Moisture', 
    severity: 'high', 
    title: 'Soil Drying Fast', 
    message: 'Rapid moisture loss detected', 
    time: '3 hours ago', 
    date: 'Mar 12, 2026', 
    sensor: 'Soil Sensor #2', 
    status: 'active',
    recommendedAction: 'Start irrigation cycle for 10-15 minutes. Investigate cause of rapid drying - check for drainage issues or heat stress.'
  },
  { 
    id: 7, 
    type: 'Humidity', 
    severity: 'critical', 
    title: 'Low Humidity Alert', 
    message: 'Humidity below 65%', 
    time: '4 hours ago', 
    date: 'Mar 11, 2026', 
    sensor: 'Humidity Sensor #1', 
    status: 'resolved',
    recommendedAction: 'Increase humidity to 70-80% by activating foggers/misters. Close vents partially to retain moisture. Monitor plants for stress.'
  },
  { 
    id: 8, 
    type: 'Light', 
    severity: 'medium', 
    title: 'Light Fluctuation', 
    message: 'Unstable light readings', 
    time: '5 hours ago', 
    date: 'Mar 11, 2026', 
    sensor: 'Light Sensor #2', 
    status: 'acknowledged',
    recommendedAction: 'Check sensor calibration and positioning. Ensure consistent light distribution. Consider adjusting shade cloth controls.'
  },
];

const alertTrends = [
  { time: '00:00', critical: 2, high: 3, medium: 5, low: 2 },
  { time: '04:00', critical: 1, high: 2, medium: 4, low: 3 },
  { time: '08:00', critical: 3, high: 5, medium: 6, low: 2 },
  { time: '12:00', critical: 5, high: 7, medium: 8, low: 4 },
  { time: '16:00', critical: 4, high: 6, medium: 7, low: 3 },
  { time: '20:00', critical: 2, high: 4, medium: 5, low: 2 },
  { time: '23:59', critical: 3, high: 4, medium: 6, low: 3 }
];

const alertsByCategory = [
  { name: 'Temperature', value: 25, color: '#ef4444' },
  { name: 'Humidity', value: 30, color: '#3b82f6' },
  { name: 'Soil Moisture', value: 35, color: '#10b981' },
  { name: 'Light Intensity', value: 10, color: '#f59e0b' }
];

// Historical Sensor Data (Extended)
const detailedHistoricalData = [
  { date: 'Mar 5', temp: 26.5, humidity: 78, soil: 55, light: 8100, danger: 25 },
  { date: 'Mar 6', temp: 27.2, humidity: 76, soil: 54, light: 8200, danger: 28 },
  { date: 'Mar 7', temp: 28.0, humidity: 74, soil: 52, light: 8300, danger: 35 },
  { date: 'Mar 8', temp: 27.5, humidity: 75, soil: 51, light: 8150, danger: 32 },
  { date: 'Mar 9', temp: 29.0, humidity: 71, soil: 49, light: 8400, danger: 45 },
  { date: 'Mar 10', temp: 28.8, humidity: 72, soil: 48, light: 8350, danger: 50 },
  { date: 'Mar 11', temp: 29.5, humidity: 70, soil: 46, light: 8500, danger: 58 },
  { date: 'Mar 12', temp: 28.5, humidity: 72, soil: 45, light: 8500, danger: 62 },
];

const hourlyData = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i.toString().padStart(2, '0')}:00`,
  temp: 24 + Math.sin(i / 3.8) * 5 + Math.random() * 2,
  humidity: 75 + Math.cos(i / 3.8) * 8 + Math.random() * 3,
  soil: 50 - i * 0.3 + Math.random() * 2,
  light: i >= 6 && i <= 18 ? 7000 + Math.sin((i - 6) / 3.8) * 2000 + Math.random() * 500 : 0
}));

const monthlyAverages = [
  { month: 'Jan', avgTemp: 24.5, avgHumidity: 78, avgSoil: 58, avgLight: 7800 },
  { month: 'Feb', avgTemp: 25.2, avgHumidity: 76, avgSoil: 57, avgLight: 8000 },
  { month: 'Mar', avgTemp: 28.1, avgHumidity: 74, avgSoil: 51, avgLight: 8300 },
];

const assistantQuickQuestions = [
  'Why is temperature rising?',
  'Is my lettuce safe today?',
  'What should I do now?',
  'Show last 7 day humidity trend'
];

export default function App() {
  const [selectedDateRange, setSelectedDateRange] = useState('today');
  const [currentView, setCurrentView] = useState<'dashboard' | 'analytics' | 'livefeed' | 'alerts' | 'history'>('dashboard');
  const [selectedAlertId, setSelectedAlertId] = useState<number | null>(null);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantInput, setAssistantInput] = useState('');
  const [assistantTab, setAssistantTab] = useState<'chat' | 'search' | 'contact'>('chat');
  const [assistantFullscreen, setAssistantFullscreen] = useState(false);
  const [assistantMessages, setAssistantMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      text: 'I am here to answer greenhouse questions in plain language. Try one of the quick questions below.'
    }
  ]);
  const dangerLevel = 62; // Current overall danger level

  const getAssistantReply = (question: string) => {
    const prompt = question.toLowerCase();

    if (prompt.indexOf('temperature rising') !== -1) {
      return 'Temperature is rising due to stronger midday light and dropping humidity. Open roof vents to 40% and monitor for 10 minutes.';
    }

    if (prompt.indexOf('lettuce') !== -1 || prompt.indexOf('safe') !== -1) {
      return 'Lettuce is mostly safe today, but moisture stress is emerging. Soil moisture is 45%, so run irrigation now to avoid leaf curl risk.';
    }

    if (prompt.indexOf('what should i do now') !== -1 || prompt.indexOf('do now') !== -1) {
      return 'Priority steps: 1) Start irrigation for 15 minutes. 2) Keep humidity between 70-80%. 3) Re-check danger score after one control cycle.';
    }

    if (prompt.indexOf('last 7 day humidity trend') !== -1 || prompt.indexOf('humidity trend') !== -1) {
      const trendSummary = weeklyData.map((entry) => `${entry.day}: ${entry.humidity}%`).join(' | ');
      return `7-day humidity trend: ${trendSummary}. Overall pattern is slightly downward.`;
    }

    return 'I can explain live risks, suggest immediate actions, and summarize trends. Ask about temperature, humidity, irrigation, or safety status.';
  };

  const sendAssistantMessage = (questionText?: string) => {
    const question = (questionText ?? assistantInput).trim();
    if (!question) {
      return;
    }

    setAssistantMessages((prev) => [
      ...prev,
      { id: Date.now(), role: 'user', text: question },
      { id: Date.now() + 1, role: 'assistant', text: getAssistantReply(question) }
    ]);
    setAssistantInput('');
  };

  const handleOpenAlertFromDashboard = (warning: { title: string; message: string; severity: string }) => {
    const matchedAlert = alertsHistory.find((alert) =>
      alert.title.toLowerCase() === warning.title.toLowerCase() ||
      alert.message.toLowerCase() === warning.message.toLowerCase()
    );

    if (matchedAlert) {
      setSelectedAlertId(matchedAlert.id);
    } else {
      const fallbackAlert = alertsHistory.find((alert) => alert.severity === warning.severity);
      setSelectedAlertId(fallbackAlert ? fallbackAlert.id : null);
    }

    setCurrentView('alerts');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Sprout className="w-8 h-8 text-green-600" />
              <div>
                <h1 className="font-bold text-xl text-gray-900">Mochiforge Greenhouse Monitor</h1>
                <p className="text-sm text-gray-500">
                  {currentView === 'dashboard' ? 'Climate Control Dashboard' :
                   currentView === 'analytics' ? 'Advanced Analytics' : 
                   currentView === 'livefeed' ? 'Live Data Feed' : 
                   currentView === 'alerts' ? 'Alerts Management' : 'Historical Sensor Data'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Settings className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-screen p-4">
          <nav className="space-y-2">
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors text-base ${
                currentView === 'dashboard' ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Home className="w-5 h-5" />
              Dashboard
            </button>
            <button
              onClick={() => setCurrentView('alerts')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors text-base ${
                currentView === 'alerts' ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
              Alerts
            </button>
            <button
              onClick={() => setCurrentView('livefeed')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors text-base ${
                currentView === 'livefeed' ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Activity className="w-5 h-5" />
              Live Feed
            </button>
            <button
              onClick={() => setCurrentView('analytics')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors text-base ${
                currentView === 'analytics' ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              Analytics
            </button>
            <button
              onClick={() => setCurrentView('history')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors text-base ${
                currentView === 'history' ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <HistoryIcon className="w-5 h-5" />
              History
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {currentView === 'dashboard' ? (
            <DashboardView
              selectedDateRange={selectedDateRange}
              setSelectedDateRange={setSelectedDateRange}
              dangerLevel={dangerLevel}
              onOpenAlert={handleOpenAlertFromDashboard}
            />
          ) : currentView === 'analytics' ? (
            <AnalyticsView />
          ) : currentView === 'history' ? (
            <HistoricalDataView />
          ) : currentView === 'livefeed' ? (
            <LiveFeedView />
          ) : (
            <AlertsView selectedAlertId={selectedAlertId} />
          )}
        </main>
      </div>

      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setAssistantOpen((prev) => !prev)}
          className="group relative inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-green-700 text-white shadow-[0_14px_34px_rgba(22,163,74,0.35)] transition-transform hover:scale-105"
          aria-label="Open conversational assistant"
        >
          <MessageCircle className="h-7 w-7" />
          <span className="absolute -top-1 -right-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-emerald-700">
            AI
          </span>
        </button>
      </div>

      {assistantOpen && (
        <div className="fixed inset-0 z-40 pointer-events-none">
          <div
            className="absolute inset-0 bg-black/10 backdrop-blur-[1px]"
            onClick={() => {
              setAssistantOpen(false);
              setAssistantFullscreen(false);
            }}
          />

          <div
            className={`pointer-events-auto border border-emerald-100 bg-white shadow-[0_22px_60px_rgba(15,23,42,0.25)] ${
              assistantFullscreen
                ? 'absolute inset-3 rounded-2xl md:inset-6'
                : 'absolute right-3 bottom-24 h-[78vh] w-[calc(100%-1.5rem)] max-w-[410px] rounded-2xl md:right-6 md:bottom-24 md:h-[560px]'
            }`}
          >
            <div className="h-1.5 rounded-t-2xl bg-gradient-to-r from-emerald-500 via-green-500 to-lime-400" />

            <div className="flex h-[52px] items-center justify-between border-b border-gray-200 px-4">
              <div className="flex items-center gap-2">
                <div className="rounded-md bg-emerald-50 p-1.5 text-emerald-700">
                  <Bot className="h-4 w-4" />
                </div>
                <p className={`font-semibold text-gray-800 ${assistantFullscreen ? 'text-base' : 'text-sm'}`}>AI assistant</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setAssistantFullscreen((prev) => !prev)}
                  className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100"
                  aria-label={assistantFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                >
                  {assistantFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => {
                    setAssistantOpen(false);
                    setAssistantFullscreen(false);
                  }}
                  className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100"
                  aria-label="Close assistant"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="h-[calc(100%-52px)] flex flex-col">
              <div className="border-b border-gray-100 px-3 py-2">
                <div className={`flex items-center gap-1 rounded-lg bg-gray-100 p-1 font-medium text-gray-600 ${assistantFullscreen ? 'text-sm' : 'text-xs'}`}>
                  {[
                    { id: 'chat', label: 'Chat' },
                    { id: 'search', label: 'Search' },
                    { id: 'contact', label: 'Contact' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setAssistantTab(tab.id as 'chat' | 'search' | 'contact')}
                      className={`flex-1 rounded-md px-2 py-1.5 transition-colors ${
                        assistantTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'hover:bg-white/60'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {assistantTab === 'chat' ? (
                <>
                  <div className="px-3 py-2 border-b border-gray-100">
                    <div className="flex flex-wrap gap-2">
                      {assistantQuickQuestions.map((chip) => (
                        <button
                          key={chip}
                          onClick={() => sendAssistantMessage(chip)}
                          className={`rounded-full border border-emerald-200 bg-emerald-50 font-medium text-emerald-700 hover:bg-emerald-100 ${assistantFullscreen ? 'px-4 py-2 text-sm' : 'px-3 py-1 text-xs'}`}
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto bg-gradient-to-b from-white to-gray-50 px-3 py-3 space-y-3">
                    {assistantMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`max-w-[86%] rounded-xl leading-relaxed ${assistantFullscreen ? 'px-4 py-3 text-base' : 'px-3 py-2 text-sm'} ${
                          message.role === 'assistant'
                            ? 'bg-white border border-gray-200 text-gray-700'
                            : 'ml-auto bg-emerald-600 text-white'
                        }`}
                      >
                        {message.text}
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-gray-200 px-3 py-2.5">
                    <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-2 py-1.5 shadow-sm">
                      <Sparkles className={`${assistantFullscreen ? 'h-5 w-5' : 'h-4 w-4'} text-emerald-500`} />
                      <input
                        value={assistantInput}
                        onChange={(e) => setAssistantInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            sendAssistantMessage();
                          }
                        }}
                        placeholder="Ask me a question..."
                        className={`flex-1 border-none bg-transparent text-gray-700 outline-none ${assistantFullscreen ? 'h-10 text-base' : 'h-8 text-sm'}`}
                      />
                      <button
                        onClick={() => sendAssistantMessage()}
                        className={`inline-flex items-center justify-center rounded-full bg-emerald-600 text-white hover:bg-emerald-700 ${assistantFullscreen ? 'h-10 w-10' : 'h-8 w-8'}`}
                        aria-label="Send message"
                      >
                        <Send className={assistantFullscreen ? 'h-5 w-5' : 'h-4 w-4'} />
                      </button>
                    </div>
                  </div>
                </>
              ) : assistantTab === 'search' ? (
                <div className="flex-1 p-4">
                  <h4 className={`font-semibold text-gray-800 ${assistantFullscreen ? 'text-lg' : 'text-sm'}`}>Quick Search Prompts</h4>
                  <p className={`text-gray-500 mt-1 ${assistantFullscreen ? 'text-sm' : 'text-xs'}`}>Use Chat tab for full conversation.</p>
                  <div className={`mt-3 space-y-2 ${assistantFullscreen ? 'text-base' : 'text-sm'}`}>
                    <button onClick={() => { setAssistantTab('chat'); sendAssistantMessage('Show last 7 day humidity trend'); }} className={`block w-full rounded-lg border border-gray-200 text-left hover:bg-gray-50 ${assistantFullscreen ? 'px-4 py-3' : 'px-3 py-2'}`}>Show last 7 day humidity trend</button>
                    <button onClick={() => { setAssistantTab('chat'); sendAssistantMessage('Why is temperature rising?'); }} className={`block w-full rounded-lg border border-gray-200 text-left hover:bg-gray-50 ${assistantFullscreen ? 'px-4 py-3' : 'px-3 py-2'}`}>Why is temperature rising?</button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 p-4">
                  <h4 className={`font-semibold text-gray-800 ${assistantFullscreen ? 'text-lg' : 'text-sm'}`}>Support Contact</h4>
                  <p className={`text-gray-600 mt-2 ${assistantFullscreen ? 'text-base' : 'text-sm'}`}>Need human support? Contact greenhouse operations at:</p>
                  <p className={`text-emerald-700 mt-2 font-medium ${assistantFullscreen ? 'text-base' : 'text-sm'}`}>ops@mochiforge.local</p>
                  <p className={`text-emerald-700 ${assistantFullscreen ? 'text-base' : 'text-sm'}`}>+1 (555) 010-2448</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Dashboard View Component
function DashboardView({ dangerLevel, onOpenAlert }: any) {
  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-9 space-y-6">
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

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-5">Smart Risk Engine</h2>

          <div className="grid grid-cols-[260px_1fr] gap-8 items-center">
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

// Analytics View Component
function AnalyticsView() {
  const [analyticsRange, setAnalyticsRange] = useState('3m');

  const healthCards = [
    {
      id: 'irrigation',
      title: 'Irrigation System',
      value: 'Working',
      note: 'Ventilation: Optimal',
      icon: Droplets,
      styles: 'border-emerald-200 bg-emerald-50 text-emerald-700'
    },
    {
      id: 'lighting',
      title: 'Lighting',
      value: 'Need Adjustment',
      note: '',
      icon: Sun,
      styles: 'border-amber-200 bg-amber-50 text-amber-700'
    },
    {
      id: 'sensor',
      title: 'Sensor Health',
      value: '3 sensor offline',
      note: '',
      icon: Gauge,
      styles: 'border-rose-200 bg-rose-50 text-rose-700'
    }
  ];

  const systemStatus = [
    { id: 'healthy', label: 'Healthy', value: '72%', styles: 'bg-emerald-100 text-emerald-800' },
    { id: 'diseased', label: 'Diseased', value: '10%', styles: 'bg-rose-100 text-rose-800' }
  ];

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">System Health Overview</h2>
        </div>

        <div className="grid grid-cols-12 gap-3 mt-3">
          {healthCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.id} className={`col-span-3 rounded-lg border p-4 ${card.styles}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-lg font-semibold text-gray-700">{card.title}</p>
                    <p className="text-xl font-medium mt-1">{card.value}</p>
                    {card.note ? <p className="text-lg text-gray-600 mt-2">{card.note}</p> : null}
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
            <div className="mt-2 flex items-end gap-1">
              <div className="w-3 h-7 bg-violet-300 rounded-sm" />
              <div className="w-3 h-10 bg-violet-400 rounded-sm" />
              <div className="w-3 h-5 bg-violet-200 rounded-sm" />
              <div className="w-3 h-12 bg-violet-500 rounded-sm" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-3 mt-3">
          <div className="col-span-7 flex gap-3">
            {systemStatus.map((item) => (
              <div key={item.id} className={`flex-1 rounded-lg px-4 py-3 ${item.styles}`}>
                <p className="text-lg font-semibold">{item.label}</p>
                <p className="text-2xl font-bold mt-0.5">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="col-span-5 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
            <p className="text-lg font-semibold text-gray-700">Current Weight: 45KG</p>
            <p className="text-base text-gray-600 mt-1">Weekly change: +8%</p>
            <div className="mt-2 h-2 rounded-full bg-gray-200 overflow-hidden">
              <div className="h-full w-[65%] rounded-full bg-gray-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <h3 className="text-xl font-semibold text-gray-700">Detailed reports</h3>
        <p className="text-2xl font-semibold text-gray-900 mt-1">Environmental Correlation Analysis</p>

        <div className="grid grid-cols-12 gap-4 mt-3">
          <div className="col-span-4 rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xl font-semibold text-gray-700">Soil Moisture vs Growth Rate</h4>
              <select
                value={analyticsRange}
                onChange={(e) => setAnalyticsRange(e.target.value)}
                className="text-lg px-3 py-2.5 border border-gray-200 rounded-md bg-white"
              >
                <option value="1m">1M</option>
                <option value="3m">3M</option>
                <option value="6m">6M</option>
              </select>
            </div>

            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="day" stroke="#6b7280" style={{ fontSize: '14px' }} />
                  <YAxis stroke="#6b7280" style={{ fontSize: '14px' }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="soil" stroke="#6366f1" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="col-span-8 rounded-lg border border-gray-200 p-4">
            <h4 className="text-xl font-semibold text-gray-700 mb-2">Temperature vs Humidity</h4>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyData}>
                  <defs>
                    <linearGradient id="analyticsHumidity" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="day" stroke="#6b7280" style={{ fontSize: '14px' }} />
                  <YAxis stroke="#6b7280" style={{ fontSize: '14px' }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="humidity" stroke="#22c55e" strokeWidth={2} fill="url(#analyticsHumidity)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Live Feed View Component
function LiveFeedView() {
  const [liveData] = useState({
    temperature: 28.5,
    humidity: 72,
    soil: 45,
    light: 8500
  });

  const sensorCards = [
    {
      id: 'temperature',
      name: 'Temperature',
      value: `${liveData.temperature} °C`,
      subtitle: 'Updated 2s ago',
      icon: Thermometer,
      progress: 72,
      tone: 'red'
    },
    {
      id: 'humidity',
      name: 'Humidity',
      value: `${liveData.humidity}%`,
      subtitle: 'Updated 2s ago',
      icon: Droplets,
      progress: 72,
      tone: 'blue'
    },
    {
      id: 'soil',
      name: 'Soil Moisture',
      value: `${liveData.soil}%`,
      subtitle: 'Updated 2s ago',
      icon: Sprout,
      progress: 45,
      tone: 'green'
    },
    {
      id: 'light',
      name: 'Light Intensity',
      value: `${liveData.light} lux`,
      subtitle: 'Updated 2s ago',
      icon: Sun,
      progress: 85,
      tone: 'amber'
    }
  ];

  const activityFeed = [
    { id: 1, icon: AlertTriangle, title: 'Critical Alert', message: 'Soil moisture dropped below 45%', time: '2 seconds ago', status: 'critical' },
    { id: 2, icon: AlertCircle, title: 'Warning', message: 'Humidity decreasing - currently at 72%', time: '3 minutes ago', status: 'warning' },
    { id: 3, icon: Activity, title: 'Sensor Update', message: 'Temperature sensor reading: 28.5°C', time: '5 seconds ago', status: 'info' },
    { id: 4, icon: Droplets, title: 'Irrigation Started', message: 'Auto-irrigation system activated', time: '10 minutes ago', status: 'success' }
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
  } as const;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Live Data Feed</h2>
          <p className="text-lg text-gray-500 mt-1">Real-time sensor readings and system activity</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-4 py-2.5 border border-gray-200 rounded-lg bg-white text-right">
            <p className="text-lg text-gray-500">Active Sensors</p>
            <p className="text-2xl font-semibold text-gray-800">4/4</p>
          </div>
          <div className="px-4 py-2.5 border border-gray-200 rounded-lg bg-white flex items-center gap-2">
            <span className="text-lg font-semibold text-gray-800">Live</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-8 bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <h3 className="text-xl font-semibold text-gray-800 mb-3">Live Sensor Readings</h3>

          <div className="space-y-3">
            {sensorCards.map((sensor) => {
              const Icon = sensor.icon;
              const styles = toneClasses[sensor.tone as keyof typeof toneClasses];

              return (
                <div key={sensor.id} className={`rounded-lg border p-4 ${styles.wrapper}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
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

                  <div className={`mt-2 h-2 rounded-full ${styles.barBg}`}>
                    <div className={`h-2 rounded-full ${styles.bar}`} style={{ width: `${sensor.progress}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="col-span-4 bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <h3 className="text-xl font-semibold text-gray-800 mb-3">Activity Feed</h3>

          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {activityFeed.map((activity) => (
              <div
                key={activity.id}
                className={`p-4 rounded-lg border-l-4 ${
                  activity.status === 'critical' ? 'bg-red-50 border-red-500' :
                  activity.status === 'warning' ? 'bg-amber-50 border-amber-500' :
                  activity.status === 'success' ? 'bg-emerald-50 border-emerald-500' :
                  'bg-blue-50 border-blue-500'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <activity.icon className={`w-6 h-6 flex-shrink-0 mt-0.5 ${
                    activity.status === 'critical' ? 'text-red-600' :
                    activity.status === 'warning' ? 'text-amber-600' :
                    activity.status === 'success' ? 'text-emerald-600' :
                    'text-blue-600'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-lg font-semibold ${
                      activity.status === 'critical' ? 'text-red-700' :
                      activity.status === 'warning' ? 'text-amber-700' :
                      activity.status === 'success' ? 'text-emerald-700' :
                      'text-blue-700'
                    }`}>
                      {activity.title}
                    </p>
                    <p className="text-base text-gray-600 mt-1 leading-snug">{activity.message}</p>
                    <p className="text-base text-gray-500 mt-1.5">{activity.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Alerts View Component
function AlertsView({ selectedAlertId }: { selectedAlertId?: number | null }) {
  const [trendRange, setTrendRange] = useState<'24h' | '48h' | '72h' | 'all'>('24h');
  const [historyRange, setHistoryRange] = useState<'24h' | '48h' | '72h' | 'all'>('24h');

  const chartPointsByRange = {
    '24h': 4,
    '48h': 5,
    '72h': 7,
    all: alertTrends.length
  } as const;

  const historyRowsByRange = {
    '24h': 4,
    '48h': 6,
    '72h': alertsHistory.length,
    all: alertsHistory.length
  } as const;

  const filteredAlertTrends = alertTrends.slice(-chartPointsByRange[trendRange]);
  const filteredAlertsHistory = alertsHistory.slice(0, historyRowsByRange[historyRange]);

  useEffect(() => {
    if (!selectedAlertId) {
      return;
    }

    if (historyRange !== 'all' && !filteredAlertsHistory.some((alert) => alert.id === selectedAlertId)) {
      setHistoryRange('all');
    }
  }, [selectedAlertId, historyRange, filteredAlertsHistory]);

  useEffect(() => {
    if (!selectedAlertId || !filteredAlertsHistory.some((alert) => alert.id === selectedAlertId)) {
      return;
    }

    const selectedElement = document.getElementById(`alert-history-${selectedAlertId}`);
    if (selectedElement) {
      selectedElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
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

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Alerts Management</h2>
          <p className="text-lg text-gray-500 mt-1">Monitor and manage all system alerts and notifications</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-right">
            <p className="text-lg text-gray-500">Active Alerts</p>
            <p className="text-2xl font-semibold text-gray-900">{activeAlerts}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className={`rounded-xl border bg-gradient-to-br ${card.styles} shadow-sm p-4`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-7 h-7 rounded-md bg-white/80 flex items-center justify-center">
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-base font-semibold bg-white/80 px-3 py-1.5 rounded-full">
                  {card.tag}
                </span>
              </div>
              <p className="text-lg font-medium text-gray-700">{card.title}</p>
              <div className="mt-1 flex items-end gap-1.5">
                <span className="text-4xl font-bold text-gray-900">{card.value}</span>
                <span className="text-lg text-gray-600">{card.delta}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-9 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-semibold text-gray-800">Alert Trends</h3>
              <select
                value={trendRange}
                onChange={(e) => setTrendRange(e.target.value as '24h' | '48h' | '72h' | 'all')}
                className="text-lg px-3 py-2.5 rounded-md border border-gray-200 bg-white hover:bg-gray-50"
              >
                <option value="24h">Last 24 Hours</option>
                <option value="72h">Last 72 Hours</option>
                <option value="48h">Last 48 Hours</option>
                <option value="all">All</option>
              </select>
            </div>

            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={filteredAlertTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="time" stroke="#6b7280" style={{ fontSize: '14px' }} />
                  <YAxis stroke="#6b7280" style={{ fontSize: '14px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="critical" stroke="#ef4444" strokeWidth={2} dot={false} name="Critical" />
                  <Line type="monotone" dataKey="high" stroke="#f97316" strokeWidth={2} dot={false} name="High" />
                  <Line type="monotone" dataKey="medium" stroke="#eab308" strokeWidth={2} dot={false} name="Medium" />
                  <Line type="monotone" dataKey="low" stroke="#3b82f6" strokeWidth={2} dot={false} name="Low" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-semibold text-gray-800">Alert History</h3>
              <select
                value={historyRange}
                onChange={(e) => setHistoryRange(e.target.value as '24h' | '48h' | '72h' | 'all')}
                className="text-lg px-3 py-2.5 rounded-md border border-gray-200 bg-white hover:bg-gray-50"
              >
                <option value="24h">Last 24 Hours</option>
                <option value="72h">Last 72 Hours</option>
                <option value="48h">Last 48 Hours</option>
                <option value="all">All</option>
              </select>
            </div>

            <div className="space-y-2.5 max-h-[430px] overflow-y-auto pr-1">
              {filteredAlertsHistory.map((alert) => (
                <div
                  key={alert.id}
                  id={`alert-history-${alert.id}`}
                  className={`rounded-lg border-l-4 ${
                    alert.severity === 'critical' ? 'bg-red-50 border-red-500' :
                    alert.severity === 'high' ? 'bg-orange-50 border-orange-500' :
                    alert.severity === 'medium' ? 'bg-yellow-50 border-yellow-500' :
                    'bg-blue-50 border-blue-500'
                  } ${selectedAlertId === alert.id ? 'ring-2 ring-emerald-400 ring-offset-1' : ''}`}
                >
                  <div className="p-4">
                    <div className="flex items-start gap-2.5">
                      <div>
                        {alert.severity === 'critical' ? (
                          <XCircle className="w-4 h-4 text-red-600 mt-0.5" />
                        ) : alert.severity === 'high' ? (
                          <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5" />
                        ) : alert.severity === 'medium' ? (
                          <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                        ) : (
                          <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-lg font-semibold text-gray-900">{alert.title}</h4>
                          <span className={`text-base font-semibold px-3 py-1.5 rounded-full ${
                            alert.status === 'active' ? 'bg-red-100 text-red-700' :
                            alert.status === 'acknowledged' ? 'bg-blue-100 text-blue-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {alert.status}
                          </span>
                        </div>
                        <p className="text-lg text-gray-600">{alert.message}</p>
                        <p className="text-base text-gray-500 mt-1.5">{alert.time}</p>

                        <div className="mt-3 rounded-md border border-white/60 bg-white/60 p-3">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <ArrowRight className="w-4 h-4 text-emerald-700" />
                            <span className="text-lg font-bold text-emerald-800">Recommended Action</span>
                          </div>
                          <p className="text-base text-gray-700 leading-relaxed">{alert.recommendedAction}</p>
                        </div>
                      </div>

                      <button className="p-1 hover:bg-white/70 rounded transition-colors">
                        <MoreVertical className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-span-3 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Alerts by Category</h3>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={alertsByCategory}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={62}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {alertsByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RePieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 space-y-2">
              {alertsByCategory.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-lg text-gray-700">{item.name}</span>
                  </div>
                  <span className="text-lg font-semibold text-gray-900">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <button className="w-full flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 hover:bg-emerald-100 transition-colors">
                <Bell className="w-4 h-4 text-emerald-600" />
                <div className="text-left">
                  <p className="text-lg font-semibold text-gray-800">Configure Notifications</p>
                  <p className="text-base text-gray-600">Set alert channels</p>
                </div>
              </button>

              <button className="w-full flex items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-4 py-3 hover:bg-violet-100 transition-colors">
                <Download className="w-4 h-4 text-violet-600" />
                <div className="text-left">
                  <p className="text-lg font-semibold text-gray-800">Request Report</p>
                  <p className="text-base text-gray-600">Download alert summary</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Historical Data View Component
function HistoricalDataView() {
  const [timeRange, setTimeRange] = useState('7d');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [tableSearch, setTableSearch] = useState('');
  const [tableFilterStart, setTableFilterStart] = useState('');
  const [tableFilterEnd, setTableFilterEnd] = useState('');
  const recentTrendData = detailedHistoricalData.slice(-7);

  const buildSyntheticTrendData = (points: number) => {
    return Array.from({ length: points }, (_, idx) => {
      const source = recentTrendData[idx % recentTrendData.length];
      const smoothOffset = (idx % 4) - 1.5;

      return {
        label: `D${idx + 1}`,
        temp: Number((source.temp + smoothOffset * 0.3).toFixed(1)),
        humidity: Math.round(source.humidity + smoothOffset * 1.5),
        soil: Math.round(source.soil + smoothOffset * 1.2),
        light: Math.max(0, Math.round(source.light + smoothOffset * 120))
      };
    });
  };

  const getCustomPoints = () => {
    if (!customStartDate || !customEndDate) {
      return 7;
    }

    const start = new Date(customStartDate);
    const end = new Date(customEndDate);
    const dayDiff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    if (Number.isNaN(dayDiff) || dayDiff < 1) {
      return 7;
    }

    return Math.min(dayDiff, 90);
  };

  const trendDataByRange = {
    '24h': hourlyData.map((item) => ({
      label: item.hour,
      temp: Number(item.temp.toFixed(1)),
      humidity: Math.round(item.humidity),
      soil: Math.round(item.soil),
      light: Math.round(item.light)
    })),
    '7d': recentTrendData.map((item) => ({
      label: item.date,
      temp: item.temp,
      humidity: item.humidity,
      soil: item.soil,
      light: item.light
    })),
    '20d': buildSyntheticTrendData(20),
    '3m': monthlyAverages.map((item) => ({
      label: item.month,
      temp: item.avgTemp,
      humidity: item.avgHumidity,
      soil: item.avgSoil,
      light: item.avgLight
    })),
    custom: buildSyntheticTrendData(getCustomPoints())
  } as const;

  const rangeLabelByKey = {
    '24h': 'Last 24 Hours',
    '7d': 'Last 7 Days',
    '20d': 'Last 20 Days',
    '3m': 'Last 3 Months',
    custom: 'Custom Range'
  } as const;

  const currentTrendData = trendDataByRange[timeRange as keyof typeof trendDataByRange] || trendDataByRange['7d'];
  const currentRangeLabel = rangeLabelByKey[timeRange as keyof typeof rangeLabelByKey] || rangeLabelByKey['7d'];

  const getTableRowCount = () => {
    if (timeRange === '24h') {
      return 24;
    }
    if (timeRange === '7d') {
      return 7;
    }
    if (timeRange === '20d') {
      return 20;
    }
    if (timeRange === '3m') {
      return 45;
    }
    return getCustomPoints();
  };

  const getStepInHours = () => {
    if (timeRange === '24h') {
      return 1;
    }
    return 24;
  };

  const sensorHistoryRows = Array.from({ length: getTableRowCount() }, (_, index) => {
    const profile = currentTrendData[index % currentTrendData.length];
    const timestamp = new Date(Date.now() - index * getStepInHours() * 60 * 60 * 1000);

    return {
      recordedAt: timestamp,
      humidity: Math.max(0, Math.round(profile.humidity)),
      soil: Math.max(0, Math.round(profile.soil)),
      light: Math.max(0, Math.round(profile.light)),
      temp: Number(profile.temp.toFixed(1))
    };
  });

  const formatHistoryDate = (dateInput: Date) => {
    return dateInput.toLocaleDateString('en-GB');
  };

  const formatHistoryTime = (dateInput: Date) => {
    return dateInput.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const filteredSensorHistoryRows = sensorHistoryRows.filter((row) => {
    const startDate = tableFilterStart ? new Date(tableFilterStart) : null;
    const endDate = tableFilterEnd ? new Date(tableFilterEnd) : null;
    const matchesStart = !startDate || row.recordedAt >= startDate;
    const matchesEnd = !endDate || row.recordedAt <= endDate;

    const searchSource = [
      formatHistoryDate(row.recordedAt),
      formatHistoryTime(row.recordedAt),
      `${row.humidity}`,
      `${row.soil}`,
      `${row.light}`,
      `${row.temp}`
    ].join(' ').toLowerCase();

    const normalizedSearch = tableSearch.trim().toLowerCase();
    const matchesSearch = !normalizedSearch || searchSource.includes(normalizedSearch);

    return matchesStart && matchesEnd && matchesSearch;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Historical Sensor Data</h2>
          <p className="text-sm text-gray-500 mt-1">View and analyze historical sensor readings and trends</p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2.5 border border-gray-200 rounded-md text-lg bg-white"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="20d">Last 20 Days</option>
            <option value="3m">Last 3 Months</option>
            <option value="custom">Custom Range</option>
          </select>

          {timeRange === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-2.5 border border-gray-200 rounded-md text-lg bg-white"
              />
              <span className="text-lg text-gray-500">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-2.5 border border-gray-200 rounded-md text-lg bg-white"
              />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-red-100 rounded-md">
              <Thermometer className="w-4 h-4 text-red-600" />
            </div>
            <div className="flex-1">
              <p className="text-lg text-gray-600">Average Temperature</p>
              <p className="text-4xl font-bold text-gray-900">28.1°C</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2">Range: 24.5°C - 30.2°C</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-blue-100 rounded-md">
              <Droplets className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-lg text-gray-600">Average Humidity</p>
              <p className="text-4xl font-bold text-gray-900">74%</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2">Range: 68% - 82%</p>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-emerald-100 rounded-md">
              <Sprout className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex-1">
              <p className="text-lg text-gray-600">Average Soil Moisture</p>
              <p className="text-4xl font-bold text-gray-900">61%</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2">Range: 43% - 89%</p>
          <div className="w-full h-1.5 bg-emerald-100 rounded-full mt-2 overflow-hidden">
            <div className="w-[61%] h-full bg-emerald-500 rounded-full" />
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-amber-100 rounded-md">
              <Sun className="w-4 h-4 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-lg text-gray-600">Average Light Intensity</p>
              <p className="text-4xl font-bold text-gray-900">10.3K</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2">Range: 7.8K - 18K lux</p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="text-xl font-semibold text-gray-800 mb-3">{currentRangeLabel} Temperature Sensor Trends</h3>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={currentTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="label" stroke="#6b7280" style={{ fontSize: '10px' }} />
                <YAxis stroke="#6b7280" style={{ fontSize: '10px' }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="temp" stroke="#ef4444" strokeWidth={2} name="Temperature (°C)" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="col-span-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="text-xl font-semibold text-gray-800 mb-3">{currentRangeLabel} Humidity Sensor Trends</h3>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={currentTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="label" stroke="#6b7280" style={{ fontSize: '10px' }} />
                <YAxis stroke="#6b7280" style={{ fontSize: '10px' }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="humidity" stroke="#3b82f6" strokeWidth={2} name="Humidity (%)" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="col-span-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="text-xl font-semibold text-gray-800 mb-3">{currentRangeLabel} Soil Moisture Sensor Trends</h3>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={currentTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="label" stroke="#6b7280" style={{ fontSize: '10px' }} />
                <YAxis stroke="#6b7280" style={{ fontSize: '10px' }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="soil" stroke="#22c55e" strokeWidth={2} name="Soil Moisture (%)" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="col-span-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="text-xl font-semibold text-gray-800 mb-3">{currentRangeLabel} Light Intensity Sensor Trends</h3>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={currentTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="label" stroke="#6b7280" style={{ fontSize: '10px' }} />
                <YAxis stroke="#6b7280" style={{ fontSize: '10px' }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="light" stroke="#f59e0b" strokeWidth={2} name="Light Intensity (lux)" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="col-span-12 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xl font-semibold text-gray-900">Sensor Data History</h3>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="pl-8 pr-3 py-2 border border-gray-200 rounded-md text-lg bg-gray-50"
              />
            </div>
          </div>

          <div className="mb-3 rounded-md border border-gray-200 bg-gray-50 p-2.5">
            <div className="flex flex-wrap items-end gap-2">
              <div>
                <label className="block text-lg text-gray-600 mb-1.5">Custom Filter Start</label>
                <input
                  type="datetime-local"
                  value={tableFilterStart}
                  onChange={(e) => setTableFilterStart(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-md text-lg bg-white"
                />
              </div>
              <div>
                <label className="block text-lg text-gray-600 mb-1.5">Custom Filter End</label>
                <input
                  type="datetime-local"
                  value={tableFilterEnd}
                  onChange={(e) => setTableFilterEnd(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-md text-lg bg-white"
                />
              </div>
              <button
                onClick={() => {
                  setTableFilterStart('');
                  setTableFilterEnd('');
                  setTableSearch('');
                }}
                className="px-4 py-2 border border-gray-200 rounded-md text-lg bg-white hover:bg-gray-100"
              >
                Clear Filter
              </button>
            </div>
          </div>

          <div className="max-h-[220px] overflow-auto">
            <table className="w-full text-base">
              <thead>
                <tr className="border-b border-gray-200 text-gray-700">
                  <th className="text-left py-3 px-3 font-semibold">Date</th>
                  <th className="text-left py-3 px-3 font-semibold">Time</th>
                  <th className="text-left py-3 px-3 font-semibold">Humidity</th>
                  <th className="text-left py-3 px-3 font-semibold">Soil Moisture</th>
                  <th className="text-left py-3 px-3 font-semibold">Light(lux)</th>
                  <th className="text-left py-3 px-3 font-semibold">Temperature</th>
                </tr>
              </thead>
              <tbody>
                {filteredSensorHistoryRows.map((row, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-3 text-gray-700">{formatHistoryDate(row.recordedAt)}</td>
                    <td className="py-3 px-3 text-gray-700">{formatHistoryTime(row.recordedAt)}</td>
                    <td className="py-3 px-3 text-gray-700">
                      <div className="flex items-center gap-2">
                        <Droplets className="w-4 h-4 text-blue-500" />
                        {row.humidity}%
                      </div>
                    </td>
                    <td className="py-3 px-3 text-gray-700">
                      <div className="flex items-center gap-2">
                        <Sprout className="w-4 h-4 text-emerald-500" />
                        {row.soil}%
                      </div>
                    </td>
                    <td className="py-3 px-3 text-gray-700">
                      <div className="flex items-center gap-2">
                        <Sun className="w-4 h-4 text-amber-500" />
                        {row.light}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-gray-700">
                      <div className="flex items-center gap-2">
                        <Thermometer className="w-4 h-4 text-red-500" />
                        {row.temp}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredSensorHistoryRows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-sm text-gray-500">
                      No records match this custom filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sensor Card Component
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

      {/* Mini Trend Chart */}
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