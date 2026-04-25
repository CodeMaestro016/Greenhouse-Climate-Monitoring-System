import { create } from 'zustand';

export type ViewType = 'dashboard' | 'analytics' | 'alerts' | 'history';

export type DashboardAlertNotification = {
  _id: string;
  title: string;
  message: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  timestamp: string;
  createdAt?: string;
};

export type AlertsPageAlert = {
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
};

type AppState = {
  currentView: ViewType;
  selectedAlertId: number | null;
  dashboardAlerts: DashboardAlertNotification[];
  dashboardAlertsLoading: boolean;
  alertsPageAlerts: AlertsPageAlert[];
  alertsPageLoading: boolean;
  historyTimeRange: string;
  historyCustomStartDate: string;
  historyCustomEndDate: string;
  historyTableSearch: string;
  historySelectedSensorId: string;
  setCurrentView: (view: ViewType) => void;
  setSelectedAlertId: (id: number | null) => void;
  setDashboardAlerts: (alerts: DashboardAlertNotification[]) => void;
  setDashboardAlertsLoading: (value: boolean) => void;
  setAlertsPageAlerts: (alerts: AlertsPageAlert[]) => void;
  setAlertsPageLoading: (value: boolean) => void;
  setHistoryTimeRange: (value: string) => void;
  setHistoryCustomStartDate: (value: string) => void;
  setHistoryCustomEndDate: (value: string) => void;
  setHistoryTableSearch: (value: string) => void;
  setHistorySelectedSensorId: (value: string) => void;
};

export const useAppStore = create<AppState>((set) => ({
  currentView: 'dashboard',
  selectedAlertId: null,
  dashboardAlerts: [],
  dashboardAlertsLoading: true,
  alertsPageAlerts: [],
  alertsPageLoading: true,
  historyTimeRange: '7d',
  historyCustomStartDate: '',
  historyCustomEndDate: '',
  historyTableSearch: '',
  historySelectedSensorId: 'all',
  setCurrentView: (view) => set({ currentView: view }),
  setSelectedAlertId: (id) => set({ selectedAlertId: id }),
  setDashboardAlerts: (alerts) => set({ dashboardAlerts: alerts }),
  setDashboardAlertsLoading: (value) => set({ dashboardAlertsLoading: value }),
  setAlertsPageAlerts: (alerts) => set({ alertsPageAlerts: alerts }),
  setAlertsPageLoading: (value) => set({ alertsPageLoading: value }),
  setHistoryTimeRange: (value) => set({ historyTimeRange: value }),
  setHistoryCustomStartDate: (value) => set({ historyCustomStartDate: value }),
  setHistoryCustomEndDate: (value) => set({ historyCustomEndDate: value }),
  setHistoryTableSearch: (value) => set({ historyTableSearch: value }),
  setHistorySelectedSensorId: (value) => set({ historySelectedSensorId: value })
}));
