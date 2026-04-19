import { Thermometer, Droplets, Sprout, Sun } from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";

interface SensorData {
  id: string;
  name: string;
  value: string;
  unit: string;
  status: "safe" | "watch" | "low" | "good";
  icon: typeof Thermometer;
  trendData: { value: number }[];
}

const sensorCards: SensorData[] = [
  {
    id: "temperature",
    name: "Temperature",
    value: "28",
    unit: "°C",
    status: "safe",
    icon: Thermometer,
    trendData: [
      { value: 24 }, { value: 25 }, { value: 26 }, { value: 27 }, 
      { value: 27 }, { value: 28 }, { value: 28 }
    ],
  },
  {
    id: "humidity",
    name: "Humidity",
    value: "65",
    unit: "%",
    status: "watch",
    icon: Droplets,
    trendData: [
      { value: 60 }, { value: 61 }, { value: 63 }, { value: 64 }, 
      { value: 65 }, { value: 65 }, { value: 65 }
    ],
  },
  {
    id: "soil-moisture",
    name: "Soil Moisture",
    value: "55",
    unit: "%",
    status: "low",
    icon: Sprout,
    trendData: [
      { value: 70 }, { value: 68 }, { value: 65 }, { value: 62 }, 
      { value: 58 }, { value: 56 }, { value: 55 }
    ],
  },
  {
    id: "light",
    name: "Light Intensity",
    value: "12,500",
    unit: "lux",
    status: "good",
    icon: Sun,
    trendData: [
      { value: 8000 }, { value: 9500 }, { value: 11000 }, { value: 12000 }, 
      { value: 12500 }, { value: 12500 }, { value: 12500 }
    ],
  },
];

const statusConfig = {
  safe: { label: "Safe", color: "bg-green-500" },
  watch: { label: "Watch", color: "bg-yellow-500" },
  low: { label: "Low", color: "bg-red-500" },
  good: { label: "Good", color: "bg-green-500" },
};

export function LiveSensorPanel() {
  return (
    <div className="grid grid-cols-4 gap-4">
      {sensorCards.map((sensor) => {
        const Icon = sensor.icon;
        const statusInfo = statusConfig[sensor.status];
        
        return (
          <Card 
            key={sensor.id}
            className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-700">{sensor.name}</h3>
                <Icon className="h-6 w-6 text-gray-400" />
              </div>
              
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-gray-900">
                  {sensor.value}
                </span>
                <span className="text-xl text-gray-500">{sensor.unit}</span>
              </div>
              
              <Badge className={`${statusInfo.color} text-white`}>
                {statusInfo.label}
              </Badge>
              
              <div className="h-12 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sensor.trendData}>
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke={sensor.status === "low" ? "#ef4444" : "#10b981"}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
