/**
 * AnalyticsPage.tsx — Improved Farm Analytics Charts
 */

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle, Brain, ChartLine,
  Droplets, Leaf, Link2, Sun, Thermometer, Wind,
} from 'lucide-react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceDot,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type Field = 'temperature' | 'humidity' | 'soil' | 'airppm' | 'light';
type Direction = 'increasing' | 'decreasing' | 'stable';

type SensorRecord = {
  timestamp: string;
  readings?: Partial<Record<Field, number | null>>;
  [key: string]: unknown;
};

type TrendPoint = { timestamp: string; value: number };
type CorrelationPoint = { x: number; y: number };
type AnomalyPoint = { timestamp?: string; value: number; isAnomaly: boolean };

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

type CorrelationResponse = {
  sensorId: string;
  field1: string;
  field2: string;
  count: number;
  correlation: number;
  interpretation: string;
  data: CorrelationPoint[];
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

const FIELD_OPTIONS = [
  { value: 'temperature', label: 'Temperature' },
  { value: 'humidity', label: 'Humidity' },
  { value: 'soil', label: 'Soil moisture' },
  { value: 'airppm', label: 'Air quality' },
  { value: 'light', label: 'Light' },
] as const;

const FIELD_META: Record<Field, { label: string; unit: string; increasingBad: boolean }> = {
  temperature: { label: 'Temperature', unit: '°C', increasingBad: true },
  humidity: { label: 'Humidity', unit: '%', increasingBad: false },
  soil: { label: 'Soil Moisture', unit: '%', increasingBad: false },
  airppm: { label: 'Air Quality', unit: 'ppm', increasingBad: true },
  light: { label: 'Light', unit: 'lux', increasingBad: false },
};

const TREND_LABELS: Record<TrendResponse['trend'], string> = {
  increasing: 'Rising',
  decreasing: 'Falling',
  stable: 'Stable',
};

const getFieldLabel = (field: string) => FIELD_META[field as Field]?.label ?? field;

const toChartLabel = (value: string | undefined) => {
  if (!value) return '--';
  const d = new Date(value);
  return Number.isFinite(d.getTime())
    ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '--';
};

function FieldIcon({ field, className = 'h-5 w-5' }: { field: Field; className?: string }) {
  switch (field) {
    case 'temperature':
      return <Thermometer className={className} />;
    case 'humidity':
      return <Droplets className={className} />;
    case 'soil':
      return <Leaf className={className} />;
    case 'airppm':
      return <Wind className={className} />;
    case 'light':
      return <Sun className={className} />;
  }
}

const getActionHint = (field: string, value: number | null) => {
  if (value === null || !Number.isFinite(value)) return 'No clear action yet';

  if (field === 'temperature') {
    if (value > 32) return 'Critical heat level. Open vents and add shade now.';
    if (value > 30) return 'Temperature is high. Improve ventilation.';
    if (value < 18) return 'Temperature is low. Close vents if needed.';
    return 'Temperature is comfortable.';
  }

  if (field === 'humidity') {
    if (value < 60) return 'Humidity is low. Watch for dry-air stress.';
    if (value > 85) return 'Humidity is high. Improve airflow.';
    return 'Humidity is balanced.';
  }

  if (field === 'soil') {
    if (value < 45) return 'Soil moisture is low. Inspect root-zone dryness.';
    if (value > 85) return 'Soil may be too wet. Check drainage.';
    return 'Soil moisture is healthy.';
  }

  if (field === 'light') {
    if (value < 4000) return 'Light level is low. Check shade or lamps.';
    if (value > 30000) return 'Light is too strong. Reduce direct exposure.';
    return 'Light level is fine.';
  }

  if (field === 'airppm') {
    if (value > 1500) return 'Air quality is poor. Improve ventilation.';
    return 'Air quality is acceptable.';
  }

  return 'Keep monitoring.';
};

const getTrendBadge = (trend: TrendResponse['trend'], field: string) => {
  const bad =
    field === 'temperature' || field === 'airppm'
      ? trend === 'increasing'
      : trend === 'decreasing';

  if (trend === 'stable') {
    return {
      text: '🟢 Stable Condition',
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    };
  }

  if (bad) {
    return {
      text: '🔴 Needs Attention',
      className: 'bg-rose-50 text-rose-700 border-rose-200',
    };
  }

  return {
    text: '🟡 Monitor',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
  };
};

const getAnomalySeverity = (count: number, total: number) => {
  const rate = total ? count / total : 0;

  if (rate >= 0.2) {
    return {
      label: 'Critical',
      icon: '🔴',
      className: 'bg-rose-50 text-rose-700 border-rose-200',
    };
  }

  if (rate >= 0.1) {
    return {
      label: 'Warning',
      icon: '🟡',
      className: 'bg-amber-50 text-amber-700 border-amber-200',
    };
  }

  return {
    label: 'Low Risk',
    icon: '🟢',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };
};

const getCorrelationSimpleText = (field1: string, field2: string, correlation: number) => {
  const f1 = getFieldLabel(field1);
  const f2 = getFieldLabel(field2);

  if (Math.abs(correlation) < 0.35) {
    return `⚪ ${f1} and ${f2} have a weak relationship`;
  }

  if (correlation > 0) {
    return `🟢 ${f1} ↑ → ${f2} also ↑`;
  }

  return `🔴 ${f1} ↑ → ${f2} ↓`;
};

const getCorrelationAction = (field1: string, field2: string, correlation: number | null) => {
  if (correlation === null || !Number.isFinite(correlation)) {
    return 'Not enough data yet to explain this relationship.';
  }

  const strength = Math.abs(correlation);

  if (strength < 0.35) {
    return 'These two readings do not strongly affect each other.';
  }

  if (
    (field1 === 'temperature' && field2 === 'humidity') ||
    (field1 === 'humidity' && field2 === 'temperature')
  ) {
    return correlation < 0
      ? 'When temperature rises, humidity usually drops. Watch for dry-air stress.'
      : 'Temperature and humidity rise together. Check airflow controls.';
  }

  if (
    (field1 === 'light' && field2 === 'temperature') ||
    (field1 === 'temperature' && field2 === 'light')
  ) {
    return correlation > 0
      ? 'More light is increasing heat. Use shade or ventilation before overheating.'
      : 'Light and temperature are not moving together. Check shade cloth or cloud cover.';
  }

  return 'Use this relationship to identify what condition may be affecting the crop area.';
};

const getAnomalyAction = (field: string, count: number, total: number) => {
  if (!total || count === 0) return 'No unusual readings detected. Keep monitoring.';

  const rate = count / total;

  if (field === 'temperature') {
    return rate > 0.2
      ? 'Temperature spikes are repeating. Check vents, shade, and fans.'
      : 'A few temperature readings are unusual. Inspect hot spots near the sensor.';
  }

  if (field === 'humidity') {
    return rate > 0.2
      ? 'Humidity swings are repeating. Review airflow and sealing.'
      : 'A few humidity readings are unusual. Check fans or local drafts.';
  }

  if (field === 'soil') {
    return rate > 0.2
      ? 'Soil readings are unstable. Check root-zone variation and sensor placement.'
      : 'Small soil variation detected. Inspect wet/dry patches.';
  }

  if (field === 'light') {
    return rate > 0.2
      ? 'Light is fluctuating too much. Inspect shade cloth or lamps.'
      : 'Small light anomaly detected. Check that greenhouse corner.';
  }

  if (field === 'airppm') {
    return rate > 0.2
      ? 'Air quality is unstable. Improve ventilation.'
      : 'Small air-quality anomaly detected. Check airflow near sensor.';
  }

  return 'Check the affected area before making a large control change.';
};

export function AnalyticsPage() {
  const [sensorId, setSensorId] = useState('');
  const [trendField, setTrendField] = useState('temperature');
  const [corrField1, setCorrField1] = useState('temperature');
  const [corrField2, setCorrField2] = useState('humidity');
  const [mlField, setMlField] = useState('temperature');
  const [limit, setLimit] = useState(100);

  const [trendLoading, setTrendLoading] = useState(false);
  const [corrLoading, setCorrLoading] = useState(false);
  const [mlLoading, setMlLoading] = useState(false);

  const [loadError, setLoadError] = useState<string | null>(null);
  const [trendData, setTrendData] = useState<TrendResponse | null>(null);
  const [correlationData, setCorrelationData] = useState<CorrelationResponse | null>(null);
  const [mlData, setMlData] = useState<MLResponse | null>(null);

  const isChartLoading = trendLoading || corrLoading || mlLoading;
  const safeLimit = Math.min(Math.max(Number(limit) || 100, 20), 2000);

  const sensorIdsQuery = useQuery<string[]>({
    queryKey: ['analytics-sensor-ids'],
    queryFn: async () => {
      const res = await fetch('/api/sensors?limit=100');
      if (!res.ok) throw new Error(`Failed to fetch sensors (${res.status})`);
      const data = (await res.json()) as { sensorId?: string }[];

      return Array.from(
        new Set(
          (Array.isArray(data) ? data : [])
            .map((d) => d?.sensorId)
            .filter((id): id is string => Boolean(id)),
        ),
      ).sort((a, b) => a.localeCompare(b));
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const sensorIds = sensorIdsQuery.data ?? [];

  useEffect(() => {
    if (!sensorId && sensorIds.length) setSensorId(sensorIds[0]);
  }, [sensorIds, sensorId]);

  const runTrend = async (sid: string, field: string) => {
    setTrendLoading(true);
    setLoadError(null);

    try {
      const r = await fetch(
        `/api/analysis/trends/${encodeURIComponent(sid)}?field=${encodeURIComponent(
          field,
        )}&limit=${safeLimit}`,
      );

      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        throw new Error((e as any).message || `Trend failed (${r.status})`);
      }

      setTrendData(await r.json());
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Trend analysis failed');
      setTrendData(null);
    } finally {
      setTrendLoading(false);
    }
  };

  const runCorrelation = async (sid: string, f1: string, f2: string) => {
    if (f1 === f2) {
      setLoadError('Correlation fields must be different.');
      return;
    }

    setCorrLoading(true);
    setLoadError(null);

    try {
      const r = await fetch(
        `/api/analysis/correlation/${encodeURIComponent(sid)}?field1=${encodeURIComponent(
          f1,
        )}&field2=${encodeURIComponent(f2)}&limit=${safeLimit}`,
      );

      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        throw new Error((e as any).message || `Correlation failed (${r.status})`);
      }

      setCorrelationData(await r.json());
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Correlation analysis failed');
      setCorrelationData(null);
    } finally {
      setCorrLoading(false);
    }
  };

  const runML = async (sid: string, field: string) => {
    setMlLoading(true);
    setLoadError(null);

    try {
      const r = await fetch(
        `/api/analysis/ml-anomalies/${encodeURIComponent(sid)}?field=${encodeURIComponent(
          field,
        )}&limit=${safeLimit}`,
      );

      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        throw new Error((e as any).message || `ML failed (${r.status})`);
      }

      setMlData(await r.json());
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'ML anomaly analysis failed');
      setMlData(null);
    } finally {
      setMlLoading(false);
    }
  };

  const runAnalysis = () => {
    if (!sensorId) {
      setLoadError('Select a sensor ID to run analysis.');
      return;
    }

    runTrend(sensorId, trendField);
    runCorrelation(sensorId, corrField1, corrField2);
    runML(sensorId, mlField);
  };

  useEffect(() => {
    if (sensorId) runTrend(sensorId, trendField);
  }, [sensorId, trendField]);

  useEffect(() => {
    if (sensorId) runCorrelation(sensorId, corrField1, corrField2);
  }, [sensorId, corrField1, corrField2]);

  useEffect(() => {
    if (sensorId) runML(sensorId, mlField);
  }, [sensorId, mlField]);

  const trendWithAverage = useMemo(() => {
    const maMap = new Map(
      (trendData?.movingAverage || []).map((item) => [item.timestamp, item.value]),
    );

    return (trendData?.data || []).map((point, index) => ({
      index,
      label: toChartLabel(point.timestamp),
      value: point.value,
      movingAverage: maMap.get(point.timestamp),
    }));
  }, [trendData]);

  const trendMaxPoint = useMemo(() => {
    if (!trendWithAverage.length) return null;

    return trendWithAverage.reduce((max, item) =>
      item.value > max.value ? item : max,
    );
  }, [trendWithAverage]);

  const trendMinPoint = useMemo(() => {
    if (!trendWithAverage.length) return null;

    return trendWithAverage.reduce((min, item) =>
      item.value < min.value ? item : min,
    );
  }, [trendWithAverage]);

  const mlChartData = useMemo(
    () =>
      (mlData?.results || []).map((item, index) => ({
        index,
        label: toChartLabel(item.timestamp),
        value: item.value,
        anomalyValue: item.isAnomaly ? item.value : null,
        status: item.isAnomaly ? 'Needs attention' : 'Normal',
      })),
    [mlData],
  );

  const anomalyPeak = useMemo(() => {
    const anomalies = mlChartData.filter((x) => x.anomalyValue !== null);

    if (!anomalies.length) return null;

    return anomalies.reduce((max, item) =>
      Number(item.anomalyValue) > Number(max.anomalyValue) ? item : max,
    );
  }, [mlChartData]);

  const trendBadge = trendData ? getTrendBadge(trendData.trend, trendData.field) : null;
  const anomalySeverity = mlData
    ? getAnomalySeverity(mlData.anomalyCount, mlData.count)
    : null;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-lime-50 p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">Farm Insights</h2>
            <p className="text-sm text-gray-600">
              Clear condition summary, action guidance, and deep-dive charts.
            </p>
          </div>

          <button
            onClick={runAnalysis}
            disabled={isChartLoading || !sensorId}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isChartLoading ? 'Running…' : 'Run Analysis'}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-gray-700">Sensor</span>
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
            <span className="text-sm font-medium text-gray-700">
              Readings to analyse
            </span>
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
      </div>

      {loadError && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Analysis error</p>
            <p className="text-sm">{loadError}</p>
          </div>
        </div>
      )}

      {/* Summary Bar */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-xl border border-emerald-100 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Current Trend</p>
          <p className="mt-1 text-lg font-semibold text-gray-800">
            {trendData
              ? `${getFieldLabel(trendData.field)} is ${TREND_LABELS[trendData.trend]}`
              : 'No trend data yet'}
          </p>
        </div>

        <div className="rounded-xl border border-sky-100 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Relationship</p>
          <p className="mt-1 text-lg font-semibold text-gray-800">
            {correlationData
              ? getCorrelationSimpleText(
                  correlationData.field1,
                  correlationData.field2,
                  correlationData.correlation,
                )
              : 'No correlation data yet'}
          </p>
        </div>

        <div className="rounded-xl border border-rose-100 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Anomaly Risk</p>
          <p className="mt-1 text-lg font-semibold text-gray-800">
            {mlData && anomalySeverity
              ? `${anomalySeverity.icon} ${anomalySeverity.label} — ${mlData.anomalyCount}/${mlData.count}`
              : 'No anomaly data yet'}
          </p>
        </div>
      </div>

      {/* Charts */}
      <section>
        <h3 className="mb-3 text-lg font-semibold text-gray-800">Deep-Dive Charts</h3>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* Trend Chart */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ChartLine className="h-5 w-5 text-emerald-700" />
                <h4 className="text-base font-semibold text-gray-800">
                  Trend over time
                </h4>
              </div>

              <select
                value={trendField}
                onChange={(e) => setTrendField(e.target.value)}
                className="rounded-md border border-gray-300 px-2 py-1 text-sm"
              >
                {FIELD_OPTIONS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            {trendData && trendBadge && (
              <>
                <div
                  className={`mb-3 rounded-lg border px-3 py-2 text-sm font-semibold ${trendBadge.className}`}
                >
                  {trendBadge.text}
                </div>

                <div className="mb-3 grid grid-cols-3 gap-2 text-center text-sm">
                  <div className="rounded-md bg-gray-100 px-2 py-2">
                    <p className="text-gray-500">Trend</p>
                    <p className="font-semibold text-gray-800">
                      {TREND_LABELS[trendData.trend]}
                    </p>
                  </div>

                  <div className="rounded-md bg-gray-100 px-2 py-2">
                    <p className="text-gray-500">Latest</p>
                    <p className="font-semibold text-gray-800">
                      {trendData.latestValue?.toFixed(1)}{' '}
                      {FIELD_META[trendData.field as Field]?.unit}
                    </p>
                  </div>

                  <div className="rounded-md bg-gray-100 px-2 py-2">
                    <p className="text-gray-500">Change speed</p>
                    <p className="font-semibold text-gray-800">
                      {trendData.slope.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="mb-3 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                  {getActionHint(trendData.field, trendData.latestValue)}
                </div>
              </>
            )}

            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendWithAverage}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="label" stroke="#6b7280" minTickGap={20} />
                  <YAxis stroke="#6b7280" />
                  <Tooltip />
                  <Legend />

                  {trendField === 'temperature' && (
                    <>
                      <ReferenceArea y1={18} y2={30} fill="#10b981" fillOpacity={0.08} />
                      <ReferenceArea y1={30} y2={45} fill="#ef4444" fillOpacity={0.08} />
                    </>
                  )}

                  {trendField === 'humidity' && (
                    <>
                      <ReferenceArea y1={60} y2={85} fill="#10b981" fillOpacity={0.08} />
                      <ReferenceArea y1={0} y2={60} fill="#f59e0b" fillOpacity={0.08} />
                    </>
                  )}

                  {trendField === 'soil' && (
                    <>
                      <ReferenceArea y1={50} y2={80} fill="#10b981" fillOpacity={0.08} />
                      <ReferenceArea y1={0} y2={50} fill="#ef4444" fillOpacity={0.08} />
                    </>
                  )}

                  <Line
                    type="monotone"
                    dataKey="value"
                    name="Reading"
                    stroke="#0f766e"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />

                  <Line
                    type="monotone"
                    dataKey="movingAverage"
                    name="Moving avg"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />

                  {trendMaxPoint && (
                    <ReferenceDot
                      x={trendMaxPoint.label}
                      y={trendMaxPoint.value}
                      r={5}
                      fill="#dc2626"
                      stroke="#dc2626"
                      label="Max"
                    />
                  )}

                  {trendMinPoint && (
                    <ReferenceDot
                      x={trendMinPoint.label}
                      y={trendMinPoint.value}
                      r={5}
                      fill="#0284c7"
                      stroke="#0284c7"
                      label="Min"
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Correlation Chart */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link2 className="h-5 w-5 text-sky-700" />
                <h4 className="text-base font-semibold text-gray-800">
                  How factors relate
                </h4>
              </div>

              <div className="flex items-center gap-1">
                {[corrField1, corrField2].map((val, i) => (
                  <select
                    key={i}
                    value={val}
                    onChange={(e) =>
                      i === 0
                        ? setCorrField1(e.target.value)
                        : setCorrField2(e.target.value)
                    }
                    className="rounded-md border border-gray-300 px-2 py-1 text-sm"
                  >
                    {FIELD_OPTIONS.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                ))}
              </div>
            </div>

            {correlationData && (
              <>
                <div className="mb-3 rounded-lg border border-sky-100 bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-800">
                  {getCorrelationSimpleText(
                    correlationData.field1,
                    correlationData.field2,
                    correlationData.correlation,
                  )}
                </div>

                <div className="mb-3 rounded-md bg-gray-100 px-3 py-2 text-sm">
                  <p>
                    <span className="font-semibold text-gray-700">
                      Strength: {correlationData.correlation.toFixed(2)}
                    </span>
                    <span className="ml-2 text-gray-500">
                      — {correlationData.interpretation}
                    </span>
                  </p>
                  <p className="mt-1 text-gray-600">
                    {getCorrelationAction(
                      correlationData.field1,
                      correlationData.field2,
                      correlationData.correlation,
                    )}
                  </p>
                </div>
              </>
            )}

            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="x"
                    name={getFieldLabel(corrField1)}
                    stroke="#6b7280"
                  />
                  <YAxis
                    dataKey="y"
                    name={getFieldLabel(corrField2)}
                    stroke="#6b7280"
                  />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Legend />

                  <Scatter
                    name={`${getFieldLabel(corrField1)} vs ${getFieldLabel(corrField2)}`}
                    data={correlationData?.data || []}
                    fill={
                      correlationData && correlationData.correlation < 0
                        ? '#dc2626'
                        : '#0284c7'
                    }
                    isAnimationActive={false}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Anomaly Chart */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-rose-700" />
                <h4 className="text-base font-semibold text-gray-800">
                  Unusual readings
                </h4>
              </div>

              <select
                value={mlField}
                onChange={(e) => setMlField(e.target.value)}
                className="rounded-md border border-gray-300 px-2 py-1 text-sm"
              >
                {FIELD_OPTIONS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            {mlData && anomalySeverity && (
              <>
                <div
                  className={`mb-3 rounded-lg border px-3 py-2 text-sm font-semibold ${anomalySeverity.className}`}
                >
                  {anomalySeverity.icon} {anomalySeverity.label} Anomaly Level
                </div>

                <div className="mb-2 grid grid-cols-2 gap-2 text-center text-sm">
                  <div className="rounded-md bg-gray-100 px-2 py-2">
                    <p className="text-gray-500">Method</p>
                    <p className="font-semibold text-gray-800">{mlData.method}</p>
                  </div>

                  <div className="rounded-md bg-gray-100 px-2 py-2">
                    <p className="text-gray-500">Unusual</p>
                    <p className="font-semibold text-gray-800">
                      {mlData.anomalyCount} / {mlData.count}
                    </p>
                  </div>
                </div>

                <div className="mb-2 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-800">
                  {getAnomalyAction(mlData.field, mlData.anomalyCount, mlData.count)}
                </div>
              </>
            )}

            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mlChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="label" stroke="#6b7280" minTickGap={20} />
                  <YAxis stroke="#6b7280" />

                  <Tooltip
                    formatter={(value, name) => {
                      if (name === 'Needs attention') {
                        return [`${value}`, '⚠️ Anomaly'];
                      }
                      return [`${value}`, 'Normal Reading'];
                    }}
                  />

                  <Legend />

                  <Line
                    type="monotone"
                    dataKey="value"
                    name="Reading"
                    stroke="#1d4ed8"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />

                  <Line
                    type="monotone"
                    dataKey="anomalyValue"
                    name="Needs attention"
                    stroke="#dc2626"
                    strokeWidth={0}
                    dot={{ r: 5, fill: '#dc2626', stroke: '#dc2626' }}
                    isAnimationActive={false}
                  />

                  {anomalyPeak && (
                    <ReferenceDot
                      x={anomalyPeak.label}
                      y={Number(anomalyPeak.anomalyValue)}
                      r={6}
                      fill="#dc2626"
                      stroke="#dc2626"
                      label="Highest anomaly"
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}