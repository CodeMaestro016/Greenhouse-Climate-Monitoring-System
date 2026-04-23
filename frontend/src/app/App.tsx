/**
 * App.tsx - Main application component for Greenhouse Climate Monitoring System
 * 
 * This is the root component that manages:
 * - Navigation between different pages (Dashboard, Analytics, Live Feed, Alerts, History)
 * - AI Assistant chatbot for user interactions
 * - Overall layout structure with header, sidebar, and main content area
 */

import { useState, useEffect } from 'react';
import { Home, Activity, BarChart3, AlertTriangle, History, Bell, Settings, Sprout, MessageCircle, Bot, Sparkles, Send, X, Minimize2, Maximize2 } from 'lucide-react';
import { DashboardPage } from './Pages/DashboardPage';
import { AnalyticsPage } from './Pages/AnalyticsPage';
import { LiveFeedPage } from './Pages/LiveFeedPage';
import { AlertsPage } from './Pages/AlertsPage';
import { HistoryPage } from './Pages/HistoryPage';
import { chatWithAI, getConversationHistory, getAIStatus, generateSessionId } from '../services/aiAssistantService';
import greenhouseHero from './components/assests/greenhouse-hero.jpg';

// Type definition for available page views
type ViewType = 'dashboard' | 'analytics' | 'livefeed' | 'alerts' | 'history';

// Quick question suggestions for AI Assistant - helps users get started with common queries
const assistantQuickQuestions = [
  'Why is temperature rising?',
  'Is my lettuce safe today?',
  'What should I do now?',
  'Show last 7 day humidity trend'
];

/**
 * Main App Component
 * Manages page navigation, AI assistant state, and overall app layout
 */
function App() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [selectedAlertId, setSelectedAlertId] = useState<number | null>(null);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantFullscreen, setAssistantFullscreen] = useState(false);
  const [assistantInput, setAssistantInput] = useState('');
  const [assistantTab, setAssistantTab] = useState<'chat' | 'search' | 'contact'>('chat');
  const [assistantMessages, setAssistantMessages] = useState([
    { id: 1, role: 'assistant', text: 'I am here to answer greenhouse questions in plain language. Try one of the quick questions below.' }
  ]);
  const [conversationId, setConversationId] = useState<string>('');
  const [sessionId] = useState(generateSessionId());
  const [sensorData, setSensorData] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);

  const dangerLevel = 62;

  const getAssistantReply = (question: string) => {
    const prompt = question.toLowerCase();
    if (prompt.includes('temperature rising')) {
      return 'Temperature is rising due to stronger midday light and dropping humidity. Open roof vents to 40% and monitor for 10 minutes.';
    }
    if (prompt.includes('lettuce') || prompt.includes('safe')) {
      return 'Lettuce is mostly safe today, but moisture stress is emerging. Soil moisture is 45%, so run irrigation now to avoid leaf curl risk.';
    }
    if (prompt.includes('what should i do now')) {
      return 'Priority steps: 1) Start irrigation for 15 minutes. 2) Keep humidity between 70-80%. 3) Re-check danger score after one control cycle.';
    }
    if (prompt.includes('last 7 day humidity trend')) {
      return '7-day humidity trend shows gradual decrease from 78% to 72%. Consider increasing misting frequency.';
    }
    return 'I can explain live risks, suggest immediate actions, and summarize trends. Ask about temperature, humidity, irrigation, or safety status.';
  };

  const sendAssistantMessage = async (questionText?: string) => {
    const question = (questionText ?? assistantInput).trim();
    if (!question) return;
    
    // Add user message immediately
    setAssistantMessages(prev => [
      ...prev,
      { id: Date.now(), role: 'user', text: question }
    ]);
    
    // Add loading message
    const loadingId = Date.now() + 1;
    setAssistantMessages(prev => [
      ...prev,
      { id: loadingId, role: 'assistant', text: 'Thinking...' }
    ]);
    
    try {
      const response = await chatWithAI(question, conversationId, sessionId);
      
      // Update conversation ID if this is a new conversation
      if (response.conversationId && !conversationId) {
        setConversationId(response.conversationId);
      }
      
      // Replace loading message with actual response
      setAssistantMessages(prev => 
        prev.map(msg => 
          msg.id === loadingId 
            ? { ...msg, text: response.response }
            : msg
        )
      );
    } catch (error) {
      // Replace loading message with error message
      setAssistantMessages(prev => 
        prev.map(msg => 
          msg.id === loadingId 
            ? { ...msg, text: 'Sorry, I encountered an error. Please try again.' }
            : msg
        )
      );
    }
    
    setAssistantInput('');
  };

  useEffect(() => {
    if (assistantOpen) {
      getAIStatus().then(status => {
        if (status.success) {
          setSensorData(status.sensorData);
          setRecommendations(status.recommendations || []);
        }
      });
    }
  }, [assistantOpen]);

  const handleOpenAlert = (warning: { title: string; message: string; severity: string }) => {
    setCurrentView('alerts');
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'livefeed', label: 'Live Feed', icon: Activity },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
    { id: 'history', label: 'History', icon: History },
  ];

  const renderPage = () => {
    switch (currentView) {
      case 'analytics':
        return <AnalyticsPage />;
      case 'livefeed':
        return <LiveFeedPage />;
      case 'alerts':
        return <AlertsPage selectedAlertId={selectedAlertId} />;
      case 'history':
        return <HistoryPage />;
      default:
        return <DashboardPage dangerLevel={dangerLevel} onOpenAlert={handleOpenAlert} />;
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background with greenhouse hero image */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-green-50/90 via-emerald-50/80 to-lime-50/90"></div>
        <img 
          src={greenhouseHero} 
          alt="Greenhouse Background" 
          className="absolute inset-0 w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-green-100/30 via-transparent to-green-50/20"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 glass-morphism border-b border-green-200/20 px-6 py-4 sticky top-0 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
              <Sprout className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-xl text-gray-800 tracking-tight">Mochiforge Greenhouse Monitor</h1>
              <p className="text-sm text-green-700 font-medium">
                {currentView === 'dashboard' && 'Climate Control Dashboard'}
                {currentView === 'analytics' && 'Advanced Analytics'}
                {currentView === 'livefeed' && 'Live Data Feed'}
                {currentView === 'alerts' && 'Alerts Management'}
                {currentView === 'history' && 'Historical Sensor Data'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2.5 hover:bg-green-100/50 rounded-xl transition-all duration-200 text-green-700 hover:text-green-800 hover:scale-105">
              <Bell className="w-5 h-5" />
            </button>
            <button className="p-2.5 hover:bg-green-100/50 rounded-xl transition-all duration-200 text-green-700 hover:text-green-800 hover:scale-105">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex relative z-10">
        {/* Sidebar */}
        <aside className="w-64 glass-morphism border-r border-green-200/20 min-h-[calc(100vh-89px)] p-4 sticky top-[89px] backdrop-blur-md hidden lg:block">
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id as ViewType)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 text-sm ${
                    isActive 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg transform scale-105' 
                      : 'text-green-700 hover:bg-green-100/50 hover:scale-102'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Mobile Navigation */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 glass-morphism border-t border-green-200/20 backdrop-blur-md">
          <nav className="flex justify-around py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id as ViewType)}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 text-xs ${
                    isActive 
                      ? 'text-green-600 bg-green-100/50' 
                      : 'text-green-700 hover:bg-green-100/30'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-6 relative pb-20 lg:pb-6">
          <div className="hero-gradient rounded-2xl p-1 mb-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 lg:p-6">
              {renderPage()}
            </div>
          </div>
        </main>
      </div>

      {/* AI Assistant Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setAssistantOpen(!assistantOpen)}
          className="group relative inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-green-700 text-white shadow-lg transition-transform hover:scale-105"
        >
          <MessageCircle className="h-6 w-6" />
          <span className="absolute -top-1 -right-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-emerald-700">
            AI
          </span>
        </button>
      </div>

      {/* AI Assistant Modal */}
      {assistantOpen && (
        <div className="fixed inset-0 z-40 pointer-events-none">
          <div className="absolute inset-0 bg-black/10" onClick={() => { setAssistantOpen(false); setAssistantFullscreen(false); }} />
          <div className={`pointer-events-auto border border-emerald-100 bg-white shadow-xl ${
            assistantFullscreen
              ? 'absolute inset-3 rounded-2xl md:inset-6'
              : 'absolute right-3 bottom-24 h-[560px] w-[calc(100%-1.5rem)] max-w-[400px] rounded-2xl md:right-6'
          }`}>
            <div className="h-1 rounded-t-2xl bg-gradient-to-r from-emerald-500 to-green-500" />
            <div className="flex h-12 items-center justify-between border-b border-gray-200 px-4">
              <div className="flex items-center gap-2">
                <div className="rounded-md bg-emerald-50 p-1.5 text-emerald-700">
                  <Bot className="h-3.5 w-3.5" />
                </div>
                <p className="text-sm font-semibold text-gray-800">AI Assistant</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setAssistantFullscreen(!assistantFullscreen)} className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100">
                  {assistantFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                </button>
                <button onClick={() => { setAssistantOpen(false); setAssistantFullscreen(false); }} className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <div className="h-[calc(100%-48px)] flex flex-col">
              <div className="border-b border-gray-100 px-3 py-2">
                <div className="flex gap-1 rounded-lg bg-gray-100 p-1 text-xs">
                  {['chat', 'search', 'contact'].map((tab) => (
                    <button key={tab} onClick={() => setAssistantTab(tab as any)} className={`flex-1 rounded-md px-2 py-1.5 transition-colors ${
                      assistantTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'hover:bg-white/60'
                    }`}>
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              {assistantTab === 'chat' ? (
                <>
                  <div className="px-3 py-2 border-b border-gray-100">
                    <div className="flex flex-wrap gap-1.5">
                      {assistantQuickQuestions.map((q) => (
                        <button key={q} onClick={() => sendAssistantMessage(q)} className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100">
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto bg-gradient-to-b from-white to-gray-50 px-3 py-3 space-y-2">
                    {assistantMessages.map((msg) => (
                      <div key={msg.id} className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                        msg.role === 'assistant' ? 'bg-white border border-gray-200 text-gray-700' : 'ml-auto bg-emerald-600 text-white'
                      }`}>
                        {msg.text}
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-gray-200 px-3 py-2">
                    <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-2 py-1">
                      <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
                      <input value={assistantInput} onChange={(e) => setAssistantInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendAssistantMessage()} placeholder="Ask me a question..." className="flex-1 border-none bg-transparent text-sm text-gray-700 outline-none" />
                      <button onClick={() => sendAssistantMessage()} className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white hover:bg-emerald-700">
                        <Send className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </>
              ) : assistantTab === 'search' ? (
                <div className="flex-1 p-4">
                  <h4 className="text-sm font-semibold text-gray-800">Quick Search</h4>
                  <p className="text-xs text-gray-500 mt-1">Use Chat tab for full conversation</p>
                  <div className="mt-3 space-y-2">
                    <button onClick={() => { setAssistantTab('chat'); sendAssistantMessage('Show last 7 day humidity trend'); }} className="block w-full rounded-lg border border-gray-200 px-3 py-2 text-left text-sm hover:bg-gray-50">
                      Show last 7 day humidity trend
                    </button>
                    <button onClick={() => { setAssistantTab('chat'); sendAssistantMessage('Why is temperature rising?'); }} className="block w-full rounded-lg border border-gray-200 px-3 py-2 text-left text-sm hover:bg-gray-50">
                      Why is temperature rising?
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 p-4">
                  <h4 className="text-sm font-semibold text-gray-800">Support Contact</h4>
                  <p className="text-sm text-gray-600 mt-2">Need human support? Contact:</p>
                  <p className="text-sm text-emerald-700 mt-2 font-medium">ops@mochiforge.local</p>
                  <p className="text-sm text-emerald-700">+1 (555) 010-2448</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;