import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Progress } from "./ui/progress";

const riskLevel = "MEDIUM";

const contributions = [
  { id: "temp", label: "Hot air", percentage: 35, color: "bg-red-400" },
  { id: "humidity", label: "Too wet air", percentage: 28, color: "bg-blue-400" },
  { id: "soil", label: "Dry soil", percentage: 22, color: "bg-yellow-600" },
  { id: "light", label: "Not enough sun", percentage: 15, color: "bg-orange-400" },
];

const adviceCards = [
  {
    id: "temp-advice",
    condition: "Hot air >28°C",
    warning: "Lettuce will bolt soon!",
    action: "Open vents now",
    severity: "high",
  },
  {
    id: "soil-advice",
    condition: "Dry soil <60%",
    warning: "Plants will suffer!",
    action: "Water the plants now",
    severity: "high",
  },
  {
    id: "humidity-advice",
    condition: "High humidity >80%",
    warning: "Fungal disease risk",
    action: "Reduce watering + open vents",
    severity: "medium",
  },
];

export function SmartRiskEngine() {
  return (
    <div className="space-y-6">
      {/* Circular Gauge */}
      <Card className="p-8">
        <div className="flex flex-col items-center">
          <div className="relative w-64 h-64 flex items-center justify-center">
            {/* Gauge Circle */}
            <svg className="absolute w-full h-full transform -rotate-90">
              <circle
                cx="128"
                cy="128"
                r="100"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="20"
              />
              <circle
                cx="128"
                cy="128"
                r="100"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="20"
                strokeDasharray="628"
                strokeDashoffset="200"
                strokeLinecap="round"
              />
            </svg>
            
            {/* Center Content */}
            <div className="text-center z-10">
              <div className="text-6xl mb-2">😟</div>
              <div className="text-2xl font-bold text-orange-500">{riskLevel}</div>
              <div className="text-sm text-gray-600">danger</div>
            </div>
          </div>
          
          <p className="mt-4 text-lg text-gray-700 text-center">
            Greenhouse is <span className="font-bold text-orange-500">{riskLevel} danger</span> right now
          </p>
        </div>
        
        {/* Contribution Bars */}
        <div className="mt-8 space-y-3">
          <h3 className="font-semibold text-gray-700 mb-4">Risk Factors</h3>
          {contributions.map((item) => (
            <div key={item.id} className="group">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">{item.label}</span>
                <span className="text-sm font-semibold text-gray-900 opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.percentage}%
                </span>
              </div>
              <Progress value={item.percentage} className="h-3" />
            </div>
          ))}
        </div>
      </Card>
      
      {/* Advice Cards */}
      <div className="grid grid-cols-1 gap-4">
        {adviceCards.map((advice) => (
          <Card 
            key={advice.id}
            className={`p-4 border-l-4 ${
              advice.severity === "high" ? "border-l-red-500" : "border-l-yellow-500"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-900">
                  {advice.condition}
                </div>
                <div className={`text-sm mt-1 ${
                  advice.severity === "high" ? "text-red-600" : "text-yellow-600"
                }`}>
                  {advice.warning}
                </div>
              </div>
              <Button 
                size="sm"
                className="ml-4 bg-green-600 hover:bg-green-700"
              >
                {advice.action}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
