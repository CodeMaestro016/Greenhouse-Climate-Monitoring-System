import { Home, Activity, Calendar, AlertTriangle, Settings } from "lucide-react";
import { useState } from "react";

const menuItems = [
  { id: "home", label: "Home", icon: Home },
  { id: "live", label: "Live Readings", icon: Activity },
  { id: "past", label: "Past Days", icon: Calendar },
  { id: "warnings", label: "Warnings", icon: AlertTriangle },
  { id: "settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const [activeItem, setActiveItem] = useState("home");

  return (
    <aside className="w-64 bg-gray-50 border-r border-gray-200 h-full">
      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.id;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => setActiveItem(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-green-600 text-white"
                      : "text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
