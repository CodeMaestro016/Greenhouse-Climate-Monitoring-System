// frontend/src/app/Pages/AlertReport.tsx
import { useState } from 'react';
import { ArrowLeft, Printer } from 'lucide-react';

interface Alert {
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
}

const SAFE_RANGES = {
  temperature: { min: 18, max: 28, unit: '°C' },
  humidity: { min: 70, max: 80, unit: '%' },
  soil_moisture: { min: 60, max: 80, unit: '%' },
  soil: { min: 60, max: 80, unit: '%' },
  air: { min: 0, max: 300, unit: 'ppm' },
  co2: { min: 0, max: 300, unit: 'ppm' },
  light: { min: 5000, max: 10000, unit: 'lux' }
};

const getSensorDisplayName = (field: string): string => {
  const mapping: { [key: string]: string } = {
    'temperature': 'Temperature',
    'humidity': 'Humidity',
    'soil_moisture': 'Soil Moisture',
    'soil': 'Soil Moisture',
    'air': 'Air Quality',
    'co2': 'Air Quality',
    'light': 'Light'
  };
  return mapping[field?.toLowerCase()] || field?.toUpperCase() || 'Unknown';
};

const getSensorUnit = (field: string): string => {
  const fieldLower = field?.toLowerCase();
  const safeRange = SAFE_RANGES[fieldLower as keyof typeof SAFE_RANGES];
  if (safeRange) return safeRange.unit;
  
  if (fieldLower === 'temperature') return '°C';
  if (fieldLower === 'humidity') return '%';
  if (fieldLower === 'soil_moisture' || fieldLower === 'soil') return '%';
  if (fieldLower === 'light') return 'lux';
  if (fieldLower === 'air' || fieldLower === 'co2') return 'ppm';
  return '';
};

const getStatusMessage = (field: string, value: number): string => {
  const fieldLower = field?.toLowerCase();
  const safeRange = SAFE_RANGES[fieldLower as keyof typeof SAFE_RANGES];
  
  if (!safeRange) {
    return `The ${getSensorDisplayName(field)} reading is ${value}${getSensorUnit(field)}.`;
  }
  
  const { min, max, unit } = safeRange;
  const fieldName = getSensorDisplayName(field).toLowerCase();
  
  if (value < min) {
    if (fieldLower === 'temperature') {
      return `The ${fieldName} is ${value}${unit}, which is below the optimal range (${min}-${max}${unit}). Plants may experience slow growth.`;
    } else if (fieldLower === 'humidity') {
      return `The ${fieldName} is ${value}${unit}, which is below the optimal range (${min}-${max}${unit}). Air may be too dry for healthy plant growth.`;
    } else if (fieldLower === 'soil_moisture' || fieldLower === 'soil') {
      return `The ${fieldName} is ${value}${unit}, which is below the optimal range (${min}-${max}${unit}). Plants need immediate watering.`;
    } else if (fieldLower === 'light') {
      return `The ${fieldName} level is ${value}${unit}, which is below the optimal range (${min}-${max}${unit}). Plants may not be getting enough light.`;
    } else if (fieldLower === 'air' || fieldLower === 'co2') {
      return `The ${fieldName} is ${value}${unit}, which is within safe limits (0-${max}${unit}).`;
    }
    return `The ${fieldName} is ${value}${unit}, which is below the optimal range (${min}-${max}${unit}).`;
  } else if (value > max) {
    if (fieldLower === 'temperature') {
      return `The ${fieldName} is ${value}${unit}, which is above the optimal range (${min}-${max}${unit}). Plants may be heat-stressed.`;
    } else if (fieldLower === 'humidity') {
      return `The ${fieldName} is ${value}${unit}, which is above the optimal range (${min}-${max}${unit}). High humidity may promote fungal growth.`;
    } else if (fieldLower === 'soil_moisture' || fieldLower === 'soil') {
      return `The ${fieldName} is ${value}${unit}, which is above the optimal range (${min}-${max}${unit}). Risk of root rot. Stop watering.`;
    } else if (fieldLower === 'light') {
      return `The ${fieldName} level is ${value}${unit}, which is above the optimal range (${min}-${max}${unit}). Plants may get leaf burn.`;
    } else if (fieldLower === 'air' || fieldLower === 'co2') {
      return `The ${fieldName} is ${value}${unit}, which is above the safe limit (${max}${unit}). Poor air quality detected!`;
    }
    return `The ${fieldName} is ${value}${unit}, which is above the optimal range (${min}-${max}${unit}).`;
  }
  
  return `The ${fieldName} is ${value}${unit}, which is within the optimal range (${min}-${max}${unit}). Conditions are ideal.`;
};

interface AlertReportProps {
  alerts: Alert[];
  onBack: () => void;
}

export function AlertReport({ alerts, onBack }: AlertReportProps) {
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | '24h' | '48h' | '72h' | '7d' | '30d'>('all');

  const criticalCount = alerts.filter(alert => alert.severity === 'critical').length;
  const highCount = alerts.filter(alert => alert.severity === 'high').length;
  const mediumCount = alerts.filter(alert => alert.severity === 'medium').length;
  const lowCount = alerts.filter(alert => alert.severity === 'low').length;
  const infoCount = alerts.filter(alert => alert.severity === 'info').length;
  
  const activeAlerts = alerts.filter(alert => {
    const alertDate = new Date(alert.createdAt || alert.timestamp);
    const hoursSince = (Date.now() - alertDate.getTime()) / (1000 * 60 * 60);
    return hoursSince <= 24;
  }).length;

  const applyTimeFilter = (alertsList: Alert[], timeFilter: string) => {
    if (timeFilter === 'all') return alertsList;
    
    const now = new Date();
    let hours = 0;
    switch(timeFilter) {
      case '24h': hours = 24; break;
      case '48h': hours = 48; break;
      case '72h': hours = 72; break;
      case '7d': hours = 168; break;
      case '30d': hours = 720; break;
      default: return alertsList;
    }
    
    const cutoffTime = new Date(now.getTime() - hours * 60 * 60 * 1000);
    return alertsList.filter(alert => new Date(alert.timestamp) >= cutoffTime);
  };

  const getFilteredAlerts = () => {
    let filtered = alerts;
    if (severityFilter !== 'all') {
      filtered = filtered.filter(alert => alert.severity === severityFilter);
    }
    filtered = applyTimeFilter(filtered, timeFilter);
    return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const filteredAlerts = getFilteredAlerts();

  const handlePrint = () => {
    window.print();
  };

  const getFilterLabel = () => {
    const severityLabel = severityFilter === 'all' ? 'All' : severityFilter.charAt(0).toUpperCase() + severityFilter.slice(1);
    let timeLabel = 'All Time';
    switch(timeFilter) {
      case '24h': timeLabel = 'Last 24 Hours'; break;
      case '48h': timeLabel = 'Last 48 Hours'; break;
      case '72h': timeLabel = 'Last 72 Hours'; break;
      case '7d': timeLabel = 'Last 7 Days'; break;
      case '30d': timeLabel = 'Last 30 Days'; break;
    }
    return { severityLabel, timeLabel };
  };

  const { severityLabel, timeLabel } = getFilterLabel();

  const getSeverityClass = (severity: string) => {
    switch(severity) {
      case 'critical': return 'text-red-700 bg-red-50';
      case 'high': return 'text-orange-700 bg-orange-50';
      case 'medium': return 'text-yellow-700 bg-yellow-50';
      case 'low': return 'text-blue-700 bg-blue-50';
      case 'info': return 'text-gray-700 bg-gray-50';
      default: return 'text-gray-700 bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header with controls - hidden when printing */}
      <div className="print:hidden mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Alerts</span>
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Alert Report</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4 flex items-center gap-3 bg-white p-4 rounded-lg border border-gray-200 flex-wrap">
          <span className="text-sm font-medium text-gray-700">Filters:</span>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="text-sm px-3 py-1.5 rounded-md border border-gray-200 bg-white"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
            <option value="info">Info</option>
          </select>
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value as any)}
            className="text-sm px-3 py-1.5 rounded-md border border-gray-200 bg-white"
          >
            <option value="all">All Time</option>
            <option value="24h">Last 24 Hours</option>
            <option value="48h">Last 48 Hours</option>
            <option value="72h">Last 72 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* Report Content - This is what gets printed */}
      <div className="report-content">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Alerts Report</h1>
          <p className="text-gray-600">Generated on: {new Date().toLocaleString()}</p>
        </div>

        {/* Filter Info */}
        <div className="bg-gray-100 p-4 rounded-lg mb-6 print:bg-gray-50">
          <p className="text-sm text-gray-700">
            <strong>Applied Filters:</strong> Severity: {severityLabel} | Time Range: {timeLabel}
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          <div className="border border-red-200 rounded-lg p-4 text-center bg-red-50">
            <h3 className="text-sm font-medium text-gray-700 mb-1">Critical</h3>
            <p className="text-3xl font-bold text-red-600">{criticalCount}</p>
          </div>
          <div className="border border-orange-200 rounded-lg p-4 text-center bg-orange-50">
            <h3 className="text-sm font-medium text-gray-700 mb-1">High</h3>
            <p className="text-3xl font-bold text-orange-600">{highCount}</p>
          </div>
          <div className="border border-yellow-200 rounded-lg p-4 text-center bg-yellow-50">
            <h3 className="text-sm font-medium text-gray-700 mb-1">Medium</h3>
            <p className="text-3xl font-bold text-yellow-600">{mediumCount}</p>
          </div>
          <div className="border border-blue-200 rounded-lg p-4 text-center bg-blue-50">
            <h3 className="text-sm font-medium text-gray-700 mb-1">Low</h3>
            <p className="text-3xl font-bold text-blue-600">{lowCount}</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4 text-center bg-gray-50">
            <h3 className="text-sm font-medium text-gray-700 mb-1">Info</h3>
            <p className="text-3xl font-bold text-gray-600">{infoCount}</p>
          </div>
        </div>

        {/* Alert Details Table */}
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Alert Details</h2>
        
        {filteredAlerts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-500">No alerts found with the selected filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-3 text-left text-sm font-semibold text-gray-700">Time</th>
                  <th className="border border-gray-300 p-3 text-left text-sm font-semibold text-gray-700">Sensor</th>
                  <th className="border border-gray-300 p-3 text-left text-sm font-semibold text-gray-700">Alert Message</th>
                  <th className="border border-gray-300 p-3 text-left text-sm font-semibold text-gray-700">Severity</th>
                  <th className="border border-gray-300 p-3 text-left text-sm font-semibold text-gray-700">Value</th>
                  <th className="border border-gray-300 p-3 text-left text-sm font-semibold text-gray-700">Safe Range</th>
                </tr>
              </thead>
              <tbody>
                {filteredAlerts.map((alert) => {
                  const safeRange = SAFE_RANGES[alert.field?.toLowerCase() as keyof typeof SAFE_RANGES];
                  const rangeText = safeRange ? `${safeRange.min} - ${safeRange.max}${safeRange.unit}` : `${alert.min} - ${alert.max}${getSensorUnit(alert.field)}`;
                  
                  return (
                    <tr key={alert._id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 p-3 text-sm text-gray-600">
                        {new Date(alert.timestamp).toLocaleString()}
                      </td>
                      <td className="border border-gray-300 p-3 text-sm font-medium text-gray-800">
                        {getSensorDisplayName(alert.field)}
                      </td>
                      <td className="border border-gray-300 p-3 text-sm text-gray-600 max-w-md">
                        {alert.message || getStatusMessage(alert.field, alert.value)}
                      </td>
                      <td className="border border-gray-300 p-3">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getSeverityClass(alert.severity)}`}>
                          {alert.severity?.toUpperCase()}
                        </span>
                      </td>
                      <td className="border border-gray-300 p-3 text-sm text-gray-700">
                        {alert.value}{getSensorUnit(alert.field)}
                      </td>
                      <td className="border border-gray-300 p-3 text-sm text-gray-700">
                        {rangeText}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-gray-300 text-center">
          <p className="text-xs text-gray-500">
            This report was generated automatically by the Alert Management System.
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Total Alerts: {filteredAlerts.length} | Active Alerts (last 24h): {activeAlerts}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Safe Ranges: Temperature (18-28°C) | Humidity (70-80%) | Soil Moisture (60-80%) | Light (5000-10000 lux) | Air Quality (0-300 ppm)
          </p>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          .print\\:hidden {
            display: none !important;
          }
          .report-content {
            padding: 0;
            margin: 0;
          }
          body {
            background: white;
            margin: 0;
            padding: 0;
          }
          .min-h-screen {
            min-height: auto;
            padding: 0;
          }
          table {
            page-break-inside: avoid;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: avoid;
          }
          .border {
            border-color: #e5e7eb !important;
          }
          @page {
            size: portrait;
            margin: 2cm;
          }
        }
      `}</style>
    </div>
  );
}