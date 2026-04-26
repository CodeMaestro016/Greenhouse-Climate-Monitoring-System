import { AlertTriangle } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

const warnings = [
  {
    id: "warning-1",
    title: "Soil moisture dropped to 55%",
    description: "Water stress on lettuce",
    action: "Water the plants",
    severity: "high",
  },
  {
    id: "warning-2",
    title: "Temperature spike",
    description: "Bolting risk",
    action: "Open cooling fans",
    severity: "high",
  },
  {
    id: "warning-3",
    title: "Humidity too high",
    description: "Fungal disease coming",
    action: "Improve ventilation",
    severity: "medium",
  },
];

export function WarningsPanel() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-900">Current Warnings</h2>
      
      {warnings.map((warning) => (
        <Card 
          key={warning.id}
          className={`p-4 ${
            warning.severity === "high" 
              ? "bg-red-50 border-red-200" 
              : "bg-yellow-50 border-yellow-200"
          }`}
        >
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <AlertTriangle 
                className={`h-5 w-5 mt-0.5 ${
                  warning.severity === "high" ? "text-red-600" : "text-yellow-600"
                }`}
              />
              <div className="flex-1">
                <h3 className={`font-semibold ${
                  warning.severity === "high" ? "text-red-900" : "text-yellow-900"
                }`}>
                  Warning! {warning.title}
                </h3>
                <p className={`text-sm mt-1 ${
                  warning.severity === "high" ? "text-red-700" : "text-yellow-700"
                }`}>
                  {warning.description}
                </p>
              </div>
            </div>
            
            <Button 
              size="sm"
              className={`w-full ${
                warning.severity === "high"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-yellow-600 hover:bg-yellow-700"
              }`}
            >
              Do this now: {warning.action}
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
