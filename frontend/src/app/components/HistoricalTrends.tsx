import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { Card } from "./ui/card";

const periods = [
  { id: "today", label: "Today" },
  { id: "week", label: "This Week" },
  { id: "month", label: "This Month" },
];

// Mock data for the main danger trend chart
const dangerTrendData = [
  { time: "12 AM", danger: 20, emoji: "😊" },
  { time: "3 AM", danger: 15, emoji: "😊" },
  { time: "6 AM", danger: 25, emoji: "😊" },
  { time: "9 AM", danger: 40, emoji: "😟" },
  { time: "12 PM", danger: 60, emoji: "😟" },
  { time: "3 PM", danger: 75, emoji: "😨" },
  { time: "6 PM", danger: 50, emoji: "😟" },
  { time: "9 PM", danger: 30, emoji: "😊" },
];

// Mock data for individual sensor trends
const sensorTrends = [
  { 
    id: "temp", 
    name: "Temperature", 
    color: "#ef4444",
    data: [
      { time: "12 AM", value: 22 },
      { time: "6 AM", value: 24 },
      { time: "12 PM", value: 31 },
      { time: "6 PM", value: 27 },
    ]
  },
  { 
    id: "humidity", 
    name: "Humidity", 
    color: "#3b82f6",
    data: [
      { time: "12 AM", value: 70 },
      { time: "6 AM", value: 75 },
      { time: "12 PM", value: 65 },
      { time: "6 PM", value: 68 },
    ]
  },
  { 
    id: "soil", 
    name: "Soil Moisture", 
    color: "#f59e0b",
    data: [
      { time: "12 AM", value: 68 },
      { time: "6 AM", value: 65 },
      { time: "12 PM", value: 55 },
      { time: "6 PM", value: 54 },
    ]
  },
  { 
    id: "light", 
    name: "Light Intensity", 
    color: "#eab308",
    data: [
      { time: "12 AM", value: 0 },
      { time: "6 AM", value: 5000 },
      { time: "12 PM", value: 12500 },
      { time: "6 PM", value: 3000 },
    ]
  },
];

export function HistoricalTrends() {
  const [activePeriod, setActivePeriod] = useState("today");

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold">{payload[0].payload.time}</p>
          <p className="text-sm text-gray-600">
            Danger Level: {payload[0].value}%
          </p>
          {payload[0].payload.emoji && (
            <p className="text-2xl mt-1">{payload[0].payload.emoji}</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Historical Trend Explorer</h2>
        
        {/* Date Filter Tabs */}
        <div className="flex gap-2">
          {periods.map((period) => (
            <button
              key={period.id}
              onClick={() => setActivePeriod(period.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activePeriod === period.id
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Main Danger Trend Chart */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">How the danger changed today</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dangerTrendData}>
              <defs>
                <linearGradient id="dangerGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="danger" 
                stroke="#ef4444" 
                strokeWidth={2}
                fill="url(#dangerGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
      
      {/* Individual Sensor Trend Cards */}
      <div className="grid grid-cols-4 gap-4">
        {sensorTrends.map((sensor) => (
          <Card 
            key={sensor.id}
            className="p-4 cursor-pointer hover:shadow-lg transition-shadow"
          >
            <h4 className="text-sm font-semibold text-gray-700 mb-3">
              {sensor.name}
            </h4>
            <div className="h-24">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sensor.data}>
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke={sensor.color}
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
