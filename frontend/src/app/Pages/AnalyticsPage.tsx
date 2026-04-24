import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Brain, ChartLine, Link2 } from 'lucide-react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

type TrendPoint = {
  timestamp: string;
  value: number;
};

type TrendResponse = {
  sensorId: string;
  field: string;
  count: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  slope: number;
  latestValue: number;
  averageValue: number;
  data: TrendPoint[];
  movingAverage: TrendPoint[];
};

type CorrelationPoint = {
  x: number;
  y: number;
};

type CorrelationResponse = {
  sensorId: string;
  field1: string;
  field2: string;
  count: number;
  correlation: number;
  interpretation: string;
  data: CorrelationPoint[];
};

type AnomalyPoint = {
  timestamp?: string;
  value: number;
  isAnomaly: boolean;
};

type MLResponse = {
  sensorId: string;
  field: string;
  method: string;
  count: number;
  anomalyCount: number;
  results: AnomalyPoint[];
  anomalies: AnomalyPoint[];
};

type SensorRecord = {
  sensorId?: string;
};

const FIELD_OPTIONS = [
  { value: 'temperature', label: 'Temperature' },
  { value: 'humidity', label: 'Humidity' },
  { value: 'soil', label: 'Soil moisture' },
  { value: 'airppm', label: 'Air quality' },
  { value: 'light', label: 'Light' }
] as const;

const FIELD_LABELS: Record<string, string> = {
  temperature: 'Temperature',
  humidity: 'Humidity',
  soil: 'Soil moisture',
  airppm: 'Air quality',
  light: 'Light'
};

const TREND_LABELS: Record<TrendResponse['trend'], string> = {
  increasing: 'Rising',
  decreasing: 'Falling',
  stable: 'Steady'
};

const getFieldLabel = (field: string) => FIELD_LABELS[field] || field;

const getRecommendation = (trendData: TrendResponse | null, mlData: MLResponse | null) => {
  if (!trendData) {
    return 'Run analysis to get a plain-language recommendation for the farm.';
  }

  if (mlData?.anomalyCount && mlData.anomalyCount > 0) {
    return `There are ${mlData.anomalyCount} unusual readings in ${getFieldLabel(mlData.field)}. Check that sensor area first.`;
  }

  if (trendData.field === 'soil' && trendData.trend === 'decreasing') {
    return 'Soil moisture is dropping. Water the crop before plants begin to stress.';
  }

  if (trendData.field === 'temperature' && trendData.trend === 'increasing') {
    return 'Temperature is climbing. Open vents or add shade to keep the crop comfortable.';
  }

  if (trendData.field === 'humidity' && trendData.trend === 'decreasing') {
    return 'Humidity is dropping. Mist lightly or reduce ventilation if the crop needs more moisture.';
  }

  return 'Conditions look mostly steady. Keep monitoring and only adjust if the next reading changes.';
};

const getActionHint = (field: string, value: number | null) => {
  if (value === null || !Number.isFinite(value)) {
    return 'No clear action yet';
  }

  if (field === 'soil') {
    if (value < 50) return 'Water now';
    if (value < 60) return 'Plan irrigation soon';
    return 'Soil moisture is healthy';
  }

  if (field === 'temperature') {
    if (value > 30) return 'Open vents and add shade';
    if (value > 28) return 'Watch for heat stress';
    return 'Temperature is comfortable';
  }

  if (field === 'humidity') {
    if (value < 60) return 'Mist or reduce ventilation';
    if (value > 85) return 'Improve airflow';
    return 'Humidity is balanced';
  }

  if (field === 'light') {
    if (value < 4000) return 'Add light or check shading';
    if (value > 30000) return 'Reduce direct exposure';
    return 'Light level is fine';
  }

  if (field === 'airppm') {
    if (value > 1500) return 'Improve ventilation';
    if (value < 400) return 'Air quality is good';
    return 'Check airflow';
  }

  return 'Keep monitoring';
};

const getCorrelationAction = (field1: string, field2: string, correlation: number | null) => {
  if (correlation === null || !Number.isFinite(correlation)) {
    return 'Not enough data yet to turn this relationship into a field action.';
  }

  const strength = Math.abs(correlation);
  const direction = correlation >= 0 ? 'move together' : 'move in opposite directions';

  if (strength < 0.35) {
    return `These two readings do not strongly affect each other. Do not use this pair alone for farm decisions.`;
  }

  if ((field1 === 'temperature' && field2 === 'humidity') || (field1 === 'humidity' && field2 === 'temperature')) {
    return correlation < 0
      ? 'When temperature rises, humidity usually drops. Open vents carefully and watch for dry-air stress.'
      : 'Temperature and humidity rise together here. Check ventilation and misting, because both may be building up.';
  }

  if ((field1 === 'soil' && field2 === 'temperature') || (field1 === 'temperature' && field2 === 'soil')) {
    return correlation < 0
      ? 'Hotter conditions are drying the soil. Schedule irrigation earlier on warm days.'
      : 'Soil and temperature are moving together. Review shading and watering timing to avoid overreaction.';
  }

  if ((field1 === 'soil' && field2 === 'humidity') || (field1 === 'humidity' && field2 === 'soil')) {
    return correlation > 0
      ? 'Soil moisture and humidity rise together. Keep an eye on fungal risk and avoid extra watering.'
      : 'Soil and humidity move in opposite directions. Use the drier one as your warning signal for watering.';
  }

  if ((field1 === 'light' && field2 === 'temperature') || (field1 === 'temperature' && field2 === 'light')) {
    return correlation > 0
      ? 'More light is also heating the crop area. Shade or vent before the plants overheat.'
      : 'Light and temperature are not moving together strongly. Check whether shade cloth or cloud cover is smoothing heat.';
  }

  if ((field1 === 'airppm' && field2 === 'humidity') || (field1 === 'humidity' && field2 === 'airppm')) {
    return correlation > 0
      ? 'Air is getting heavier as humidity rises. Increase airflow to keep disease risk lower.'
      : 'Air quality improves when humidity changes. Use airflow as the control lever.';
  }

  return `These readings ${direction}. Use this as a support check, then confirm with the crop and the room itself.`;
};

const getAnomalyAction = (field: string, count: number, total: number) => {
  if (!total || count === 0) {
    return 'No unusual pattern detected. Keep monitoring and act only if the next reading changes.';
  }

  const rate = count / total;

  if (field === 'soil') {
    return rate > 0.2
      ? 'Several soil readings are unusual. Inspect irrigation lines, emitters, and dry patches in the beds.'
      : 'One or two soil readings are off. Check the wetter and drier beds before changing the full irrigation plan.';
  }

  if (field === 'temperature') {
    return rate > 0.2
      ? 'Temperature spikes are repeating. Check vents, shade, and fans in the affected zone.'
      : 'A few temperature readings are unusual. Inspect the corner of the house or the sensor location for hot spots.';
  }

  if (field === 'humidity') {
    return rate > 0.2
      ? 'Humidity swings are repeating. Review misting and airflow settings to stop stress and fungus risk.'
      : 'A few humidity readings are unusual. Check for a leaking pipe, open door, or blocked fan.';
  }

  if (field === 'light') {
    return rate > 0.2
      ? 'Light is fluctuating too much. Inspect shade cloth, lamps, or curtains in that area.'
      : 'A small light spike may be a sun angle or sensor issue. Check that corner first.';
  }

  if (field === 'airppm') {
    return rate > 0.2
      ? 'Air quality readings are unstable. Improve ventilation and check for blocked airflow.'
      : 'A small air-quality anomaly may point to poor circulation near the sensor.';
  }

  return 'Check the affected area in person before making a large control change.';
};

const toChartLabel = (value: string | undefined) => {
  if (!value) {
    return '--';
  }

  const d = new Date(value);
  if (!Number.isFinite(d.getTime())) {
    return '--';
  }

  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export function AnalyticsPage() {
  const [sensorIds, setSensorIds] = useState<string[]>([]);
  const [sensorId, setSensorId] = useState('');

  const [trendField, setTrendField] = useState('temperature');
  const [corrField1, setCorrField1] = useState('temperature');
  const [corrField2, setCorrField2] = useState('humidity');
  const [mlField, setMlField] = useState('temperature');
  const [limit, setLimit] = useState(100);

  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [trendData, setTrendData] = useState<TrendResponse | null>(null);
  const [correlationData, setCorrelationData] = useState<CorrelationResponse | null>(null);
  const [mlData, setMlData] = useState<MLResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSensorIds() {
      try {
        const response = await fetch('/api/sensors?limit=5000');
        if (!response.ok) {
          throw new Error(`Failed to fetch sensors (${response.status})`);
        }

        const payload = (await response.json()) as SensorRecord[];
        const ids = Array.from(
          new Set(
            (Array.isArray(payload) ? payload : [])
              .map((item) => item?.sensorId)
              .filter((id): id is string => Boolean(id))
          )
        ).sort((a, b) => a.localeCompare(b));

        if (!cancelled) {
          setSensorIds(ids);
          setSensorId((prev) => prev || ids[0] || '');
        }
      } catch {
        if (!cancelled) {
          setSensorIds([]);
        }
      }
    }

    loadSensorIds();
    return () => {
      cancelled = true;
    };
  }, []);

  const runAnalysis = async () => {
    if (!sensorId) {
      setLoadError('Select a sensor ID to run analysis.');
      return;
    }

    if (corrField1 === corrField2) {
      setLoadError('Correlation fields must be different.');
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    try {
      const safeLimit = Math.min(Math.max(Number(limit) || 100, 20), 2000);
      const encodedSensor = encodeURIComponent(sensorId);

      const [trendResp, correlationResp, mlResp] = await Promise.all([
        fetch(`/api/analysis/trends/${encodedSensor}?field=${encodeURIComponent(trendField)}&limit=${safeLimit}`),
        fetch(
          `/api/analysis/correlation/${encodedSensor}?field1=${encodeURIComponent(corrField1)}&field2=${encodeURIComponent(corrField2)}&limit=${safeLimit}`
        ),
        fetch(`/api/analysis/ml-anomalies/${encodedSensor}?field=${encodeURIComponent(mlField)}&limit=${safeLimit}`)
      ]);

      if (!trendResp.ok) {
        const trendError = await trendResp.json().catch(() => ({}));
        throw new Error(trendError.message || `Trend analysis failed (${trendResp.status})`);
      }

      if (!correlationResp.ok) {
        const correlationError = await correlationResp.json().catch(() => ({}));
        throw new Error(correlationError.message || `Correlation analysis failed (${correlationResp.status})`);
      }

      if (!mlResp.ok) {
        const mlError = await mlResp.json().catch(() => ({}));
        throw new Error(mlError.message || `ML anomaly analysis failed (${mlResp.status})`);
      }

      const trendPayload = (await trendResp.json()) as TrendResponse;
      const correlationPayload = (await correlationResp.json()) as CorrelationResponse;
      const mlPayload = (await mlResp.json()) as MLResponse;

      setTrendData(trendPayload);
      setCorrelationData(correlationPayload);
      setMlData(mlPayload);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to run analysis';
      setLoadError(message);
      setTrendData(null);
      setCorrelationData(null);
      setMlData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!sensorId) {
      return;
    }

    runAnalysis();
    // Defaults are refreshed when sensorId changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sensorId]);

  const trendChartData = useMemo(
    () =>
      (trendData?.data || []).map((point, index) => ({
        index,
        rawValue: point.value,
        label: toChartLabel(point.timestamp)
      })),
    [trendData]
  );

  const movingAverageMap = useMemo(() => {
    const map = new Map<string, number>();

    (trendData?.movingAverage || []).forEach((item) => {
      map.set(item.timestamp, item.value);
    });

    return map;
  }, [trendData]);

  const trendWithAverage = useMemo(
    () =>
      (trendData?.data || []).map((point, index) => ({
        index,
        label: toChartLabel(point.timestamp),
        value: point.value,
        movingAverage: movingAverageMap.get(point.timestamp)
      })),
    [movingAverageMap, trendData]
  );

  const mlChartData = useMemo(
    () =>
      (mlData?.results || []).map((item, index) => ({
        index,
        label: toChartLabel(item.timestamp),
        value: item.value,
        anomalyValue: item.isAnomaly ? item.value : null
      })),
    [mlData]
  );

  const farmSummary = useMemo(() => {
    const trendLabel = trendData ? TREND_LABELS[trendData.trend] : '--';
    const trendFieldLabel = trendData ? getFieldLabel(trendData.field) : 'selected reading';
    const anomalyLabel = mlData ? `${mlData.anomalyCount} unusual readings` : '--';
    const latestValue = trendData ? Number(trendData.latestValue) : null;
    const actionHint = trendData ? getActionHint(trendData.field, latestValue) : 'Run analysis to get an action hint';
    const correlationMeaning = correlationData
      ? getCorrelationAction(correlationData.field1, correlationData.field2, correlationData.correlation)
      : 'Check whether two readings move together';
    const anomalyAction = mlData
      ? getAnomalyAction(mlData.field, mlData.anomalyCount, mlData.count)
      : 'Run analysis to see where to inspect the farm';

    return {
      trendLabel,
      trendFieldLabel,
      anomalyLabel,
      recommendation: getRecommendation(trendData, mlData),
      latestValue,
      actionHint,
      correlationMeaning,
      anomalyAction
    };
  }, [mlData, trendData]);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-lime-50 p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">Farm Insight Dashboard</h2>
            <p className="text-sm text-gray-600">Simple guidance for a farmer: what is changing, what is unusual, and what to do next.</p>
          </div>
          <button
            onClick={runAnalysis}
            disabled={isLoading || !sensorId}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? 'Running...' : 'Run Analysis'}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-gray-700">Field / sensor</span>
            <select
              value={sensorId}
              onChange={(e) => setSensorId(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              {sensorIds.length === 0 && <option value="">No sensors found</option>}
              {sensorIds.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-gray-700">How much history to check</span>
            <input
              type="number"
              min={20}
              max={2000}
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-emerald-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Farm meaning</p>
            <p className="mt-2 text-lg font-semibold text-gray-800">
              {trendData ? `${farmSummary.trendFieldLabel} is ${farmSummary.trendLabel}` : 'Run analysis to see the trend'}
            </p>
            <p className="mt-1 text-sm text-gray-600">
              {trendData ? `Latest: ${trendData.latestValue} | Normal range insight: ${trendData.averageValue}` : 'We will show the current pattern in plain language.'}
            </p>
          </div>

          <div className="rounded-xl border border-emerald-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">What to do now</p>
            <p className="mt-2 text-lg font-semibold text-gray-800">{farmSummary.actionHint}</p>
            <p className="mt-1 text-sm text-gray-600">This turns the reading into a practical step for the farm.</p>
          </div>

          <div className="rounded-xl border border-emerald-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Why it matters</p>
            <p className="mt-2 text-lg font-semibold text-gray-800">{farmSummary.recommendation}</p>
          </div>
        </div>
      </div>

      {loadError && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
          <AlertTriangle className="mt-0.5 h-5 w-5" />
          <div>
            <p className="font-semibold">Analysis error</p>
            <p className="text-sm">{loadError}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ChartLine className="h-5 w-5 text-emerald-700" />
              <h3 className="text-lg font-semibold text-gray-800">How one farm condition is changing</h3>
            </div>
            <select
              value={trendField}
              onChange={(e) => setTrendField(e.target.value)}
              className="rounded-md border border-gray-300 px-2 py-1 text-sm"
            >
              {FIELD_OPTIONS.map((field) => (
                <option key={field.value} value={field.value}>
                  {field.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-3 grid grid-cols-3 gap-2 text-center text-sm">
            <div className="rounded-md bg-gray-100 px-2 py-2">
              <p className="text-gray-500">Trend</p>
              <p className="font-semibold text-gray-800">{trendData ? TREND_LABELS[trendData.trend] : '--'}</p>
            </div>
            <div className="rounded-md bg-gray-100 px-2 py-2">
              <p className="text-gray-500">Change speed</p>
              <p className="font-semibold text-gray-800">{trendData?.slope?.toFixed(2) ?? '--'}</p>
            </div>
            <div className="rounded-md bg-gray-100 px-2 py-2">
              <p className="text-gray-500">Action cue</p>
              <p className="font-semibold text-gray-800">{farmSummary.actionHint}</p>
            </div>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendWithAverage}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="label" stroke="#6b7280" minTickGap={20} />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="value" name="Current reading" stroke="#0f766e" strokeWidth={2.2} dot={false} />
                <Line type="monotone" dataKey="movingAverage" name="Normal pace" stroke="#2563eb" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-sky-700" />
              <h3 className="text-lg font-semibold text-gray-800">How one factor affects another</h3>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={corrField1}
                onChange={(e) => setCorrField1(e.target.value)}
                className="rounded-md border border-gray-300 px-2 py-1 text-sm"
              >
                {FIELD_OPTIONS.map((field) => (
                  <option key={field.value} value={field.value}>
                    {field.label}
                  </option>
                ))}
              </select>
              <select
                value={corrField2}
                onChange={(e) => setCorrField2(e.target.value)}
                className="rounded-md border border-gray-300 px-2 py-1 text-sm"
              >
                {FIELD_OPTIONS.map((field) => (
                  <option key={field.value} value={field.value}>
                    {field.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-3 grid grid-cols-2 gap-2 text-center text-sm">
            <div className="rounded-md bg-gray-100 px-2 py-2">
              <p className="text-gray-500">Strength</p>
              <p className="font-semibold text-gray-800">
                {typeof correlationData?.correlation === 'number' ? correlationData.correlation.toFixed(2) : '--'}
              </p>
            </div>
            <div className="rounded-md bg-gray-100 px-2 py-2">
              <p className="text-gray-500">Farmer meaning</p>
              <p className="font-semibold text-gray-800">{farmSummary.correlationMeaning}</p>
            </div>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="x" name={getFieldLabel(corrField1)} stroke="#6b7280" />
                <YAxis dataKey="y" name={getFieldLabel(corrField2)} stroke="#6b7280" />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Legend />
                <Scatter name={`${getFieldLabel(corrField1)} vs ${getFieldLabel(corrField2)}`} data={correlationData?.data || []} fill="#0284c7" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-rose-700" />
              <h3 className="text-lg font-semibold text-gray-800">Support check for unusual readings</h3>
            </div>
            <select
              value={mlField}
              onChange={(e) => setMlField(e.target.value)}
              className="rounded-md border border-gray-300 px-2 py-1 text-sm"
            >
              {FIELD_OPTIONS.map((field) => (
                <option key={field.value} value={field.value}>
                  {field.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-3 grid grid-cols-2 gap-2 text-center text-sm">
            <div className="rounded-md bg-gray-100 px-2 py-2">
              <p className="text-gray-500">Signal check</p>
              <p className="font-semibold text-gray-800">{mlData?.method || '--'}</p>
            </div>
            <div className="rounded-md bg-gray-100 px-2 py-2">
              <p className="text-gray-500">Unusual readings</p>
              <p className="font-semibold text-gray-800">
                {mlData ? `${mlData.anomalyCount} / ${mlData.count}` : '--'}
              </p>
            </div>
          </div>

          <div className="mb-3 rounded-md bg-rose-50 px-3 py-3 text-sm text-rose-800">
            <p className="font-semibold">What to inspect</p>
            <p className="mt-1">{farmSummary.anomalyAction}</p>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mlChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="label" stroke="#6b7280" minTickGap={20} />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="value" name="Reading" stroke="#1d4ed8" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="anomalyValue" name="Needs attention" stroke="#dc2626" strokeWidth={0} dot={{ r: 4, fill: '#dc2626' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {trendChartData.length === 0 && !isLoading && !loadError && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 text-sm text-gray-600">
          No farm insights yet. Choose a field sensor and click Run Analysis.
        </div>
      )}
    </div>
  );
}