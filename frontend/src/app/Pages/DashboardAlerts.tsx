import { useEffect } from "react";
import { Bell, Leaf } from "lucide-react";
import { useAppStore } from "../store/appStore";

type DashboardAlertsProps = {
  onOpenAlert?: (alert: {
    title: string;
    message: string;
    severity: string;
  }) => void;
};

const formatTimeAgo = (dateString?: string) => {
  if (!dateString) return "Just now";

  const date = new Date(dateString);
  const diffSeconds = Math.max(
    0,
    Math.floor((Date.now() - date.getTime()) / 1000)
  );

  if (diffSeconds < 60) return `${diffSeconds}s ago`;

  const minutes = Math.floor(diffSeconds / 60);
  if (minutes < 60) return `${minutes} minutes ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;

  return date.toLocaleDateString();
};

const getSeverityStyle = (severity: string) => {
  switch (severity) {
    case "critical":
      return {
        card: "border-red-300 bg-red-50",
        icon: "text-red-600",
        badge: "bg-red-600 text-white"
      };
    case "high":
      return {
        card: "border-orange-300 bg-orange-50",
        icon: "text-orange-600",
        badge: "bg-orange-500 text-white"
      };
    case "medium":
      return {
        card: "border-yellow-300 bg-yellow-50",
        icon: "text-yellow-600",
        badge: "bg-yellow-500 text-white"
      };
    case "low":
      return {
        card: "border-blue-300 bg-blue-50",
        icon: "text-blue-600",
        badge: "bg-blue-500 text-white"
      };
    default:
      return {
        card: "border-gray-300 bg-gray-50",
        icon: "text-gray-600",
        badge: "bg-gray-500 text-white"
      };
  }
};

const alertsChanged = (
  currentAlerts: Array<{ _id: string; timestamp: string; createdAt?: string }>,
  newAlerts: Array<{ _id: string; timestamp: string; createdAt?: string }>
) => {
  if (currentAlerts.length !== newAlerts.length) return true;

  for (let i = 0; i < currentAlerts.length; i += 1) {
    const current = currentAlerts[i];
    const incoming = newAlerts[i];

    if (
      current._id !== incoming._id ||
      current.timestamp !== incoming.timestamp ||
      current.createdAt !== incoming.createdAt
    ) {
      return true;
    }
  }

  return false;
};

export function DashboardAlerts({ onOpenAlert }: DashboardAlertsProps) {
  const alerts = useAppStore((state) => state.dashboardAlerts);
  const loading = useAppStore((state) => state.dashboardAlertsLoading);
  const setAlerts = useAppStore((state) => state.setDashboardAlerts);
  const setLoading = useAppStore((state) => state.setDashboardAlertsLoading);

  const fetchTodayAlerts = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);

      const start = new Date();
      start.setHours(0, 0, 0, 0);

      const end = new Date();
      end.setHours(23, 59, 59, 999);

      const response = await fetch(
        `/api/alerts?limit=200&startDate=${start.toISOString()}&endDate=${end.toISOString()}`
      );

      if (!response.ok) throw new Error("Failed to fetch alerts");

      const result = await response.json();
      const newAlerts = result.data || [];
      const currentAlerts = useAppStore.getState().dashboardAlerts;

      if (alertsChanged(currentAlerts, newAlerts)) {
        setAlerts(newAlerts);
      }
    } catch (error) {
      console.error("Error fetching dashboard alerts:", error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayAlerts(alerts.length === 0);

    const interval = window.setInterval(() => {
      fetchTodayAlerts(false);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">Today Alerts</h2>

        <span className="text-sm font-semibold text-red-700 bg-red-100 px-2 py-1 rounded-full">
          {alerts.length} Today
        </span>
      </div>

      <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
        {loading ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm text-gray-600">Loading alerts...</p>
          </div>
        ) : alerts.length === 0 ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-emerald-600" />
              <p className="text-sm font-semibold text-emerald-700">
                No alerts today
              </p>
            </div>
            <p className="text-sm text-emerald-600 mt-1">
              Greenhouse conditions are stable.
            </p>
          </div>
        ) : (
          alerts.map((alert) => {
            const style = getSeverityStyle(alert.severity);

            return (
              <button
                key={alert._id}
                type="button"
                onClick={() =>
                  onOpenAlert?.({
                    title: alert.title,
                    message: alert.message,
                    severity: alert.severity
                  })
                }
                className={`w-full text-left rounded-xl border overflow-hidden transition-all hover:shadow-sm ${style.card}`}
              >
                <div className="px-4 py-3 border-b border-black/10">
                  <div className="flex items-start gap-2">
                    <Leaf className={`w-5 h-5 flex-shrink-0 mt-0.5 ${style.icon}`} />

                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-gray-900 text-base leading-snug break-words">
                        {alert.title}
                      </h3>

                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span
                          className={`text-xs font-bold px-3 py-1 rounded-full ${style.badge}`}
                        >
                          {alert.severity.toUpperCase()}
                        </span>

                        <span className="text-xs font-medium text-gray-500">
                          {formatTimeAgo(alert.createdAt || alert.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-4 py-3 bg-white/60">
                  <p className="text-sm text-gray-700 leading-relaxed break-words">
                    {alert.message}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}