/**
 * AnalyticsPage.tsx — Farm Insights + Analysis Charts
 *
 * Top section  : Condition Summary cards (one per sensor reading) + Best Time to Act
 * Bottom section: Trend chart, Correlation chart, ML Anomaly chart
 */

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle, Brain, ChartLine, Clock,
  Droplets, Leaf, Link2, Sun, Thermometer, Wind, Droplet,
} from 'lucide-react';
import {
  CartesianGrid, Legend, Line, LineChart, ResponsiveContainer,
  Scatter, ScatterChart, Tooltip, XAxis, YAxis,
} from 'recharts';

// ─── Types ────────────────────────────────────────────────────────────────────

type SensorRecord = {
  timestamp: string;
  readings?: Partial<Record<Field, number | null>>;
  [key: string]: unknown;
};

type Field     = 'temperature' | 'humidity' | 'soil' | 'airppm' | 'light';
type Direction = 'increasing' | 'decreasing' | 'stable';

type ConditionSummary = {
  field: Field; label: string; unit: string;
  avg: number; recentAvg: number;
  arrow: '↑' | '↓' | '→'; arrowColor: string;
  direction: Direction; message: string; borderColor: string;
};

type TrendPoint       = { timestamp: string; value: number };
type CorrelationPoint = { x: number; y: number };
type AnomalyPoint     = { timestamp?: string; value: number; isAnomaly: boolean };

type TrendResponse = {
  sensorId: string; field: string; count: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  slope: number; latestValue: number; averageValue: number;
  data: TrendPoint[]; movingAverage: TrendPoint[];
};
type CorrelationResponse = {
  sensorId: string; field1: string; field2: string; count: number;
  correlation: number; interpretation: string; data: CorrelationPoint[];
};
type MLResponse = {
  sensorId: string; field: string; method: string;
  count: number; anomalyCount: number;
  results: AnomalyPoint[]; anomalies: AnomalyPoint[];
};


// ─── Constants ────────────────────────────────────────────────────────────────

const FIELDS: Field[] = ['temperature', 'humidity', 'soil', 'airppm', 'light'];

const FIELD_OPTIONS = [
  { value: 'temperature', label: 'Temperature'  },
  { value: 'humidity',    label: 'Humidity'      },
  { value: 'soil',        label: 'Soil moisture' },
  { value: 'airppm',      label: 'Air quality'   },
  { value: 'light',       label: 'Light'         },
] as const;

const FIELD_META: Record<Field, { label: string; unit: string; increasingBad: boolean }> = {
  temperature: { label: 'Temperature',   unit: '°C',  increasingBad: true  },
  humidity:    { label: 'Humidity',      unit: '%',   increasingBad: false },
  soil:        { label: 'Soil Moisture', unit: '%',   increasingBad: false },
  airppm:      { label: 'Air Quality',   unit: 'ppm', increasingBad: true  },
  light:       { label: 'Light',         unit: 'lux', increasingBad: false },
};

const FIELD_MESSAGES: Record<Field, Record<Direction, string>> = {
  temperature: {
    increasing: 'Temperature is climbing — open vents or add shade.',
    decreasing: 'Temperature is falling — close vents at night to protect crops.',
    stable:     'Temperature is stable — no action needed.',
  },
  humidity: {
    increasing: 'Humidity is rising — improve airflow to reduce fungal risk.',
    decreasing: 'Humidity is dropping — reduce heat stress and monitor air dryness.',
    stable:     'Humidity is balanced — no action needed.',
  },
  soil: {
    increasing: 'Soil is getting wetter — check for drainage issues and sensor drift.',
    decreasing: 'Soil moisture is decreasing — inspect root-zone conditions soon.',
    stable:     'Soil moisture is steady — keep current environment settings.',
  },
  airppm: {
    increasing: 'Air quality is worsening — open vents to flush out CO₂.',
    decreasing: 'Air quality is improving — ventilation is working well.',
    stable:     'Air quality is steady — no action needed.',
  },
  light: {
    increasing: 'Light levels are climbing — watch for heat build-up from direct sun.',
    decreasing: 'Light is fading — check if shade cloth is blocking too much.',
    stable:     'Light levels are consistent — no action needed.',
  },
};

const TREND_LABELS: Record<TrendResponse['trend'], string> = {
  increasing: 'Rising', decreasing: 'Falling', stable: 'Steady',
};

// ─── Card helpers ─────────────────────────────────────────────────────────────

function getFieldValues(records: SensorRecord[], field: Field): number[] {
  return records
    .map(r => (r.readings?.[field] ?? (r as any)[field]) as unknown)
    .filter((v): v is number => v !== null && v !== undefined && Number.isFinite(Number(v)))
    .map(Number);
}

function getTrend(values: number[]): { arrow: '↑' | '↓' | '→'; direction: Direction } {
  if (values.length < 6) return { arrow: '→', direction: 'stable' };
  const half      = Math.floor(values.length / 2);
  const firstAvg  = values.slice(0, half).reduce((s, v) => s + v, 0) / half;
  const secondAvg = values.slice(half).reduce((s, v) => s + v, 0) / (values.length - half);
  const change    = (secondAvg - firstAvg) / (Math.abs(firstAvg) || 1);
  if (change >  0.02) return { arrow: '↑', direction: 'increasing' };
  if (change < -0.02) return { arrow: '↓', direction: 'decreasing' };
  return { arrow: '→', direction: 'stable' };
}

function getArrowColor(field: Field, direction: Direction): string {
  if (direction === 'stable') return 'text-gray-400';
  const bad = FIELD_META[field].increasingBad
    ? direction === 'increasing' : direction === 'decreasing';
  return bad ? 'text-rose-500' : 'text-emerald-500';
}

function getBorderColor(field: Field, direction: Direction): string {
  if (direction === 'stable') return 'border-gray-200';
  const bad = FIELD_META[field].increasingBad
    ? direction === 'increasing' : direction === 'decreasing';
  return bad ? 'border-rose-300' : 'border-emerald-300';
}

// ─── Best-time helpers ────────────────────────────────────────────────────────

function formatHour(h: number): string {
  return `${h % 12 || 12} ${h >= 12 ? 'PM' : 'AM'}`;
}

function buildTimeInsights(records: SensorRecord[]) {
  const buckets: Record<Field, number[][]> = {
    temperature: Array.from({ length: 24 }, () => []),
    humidity:    Array.from({ length: 24 }, () => []),
    soil:        Array.from({ length: 24 }, () => []),
    airppm:      Array.from({ length: 24 }, () => []),
    light:       Array.from({ length: 24 }, () => []),
  };
  for (const r of records) {
    const ts = new Date(r.timestamp);
    if (isNaN(ts.getTime())) continue;
    const h = ts.getHours();
    for (const f of FIELDS) {
      const v = r.readings?.[f] ?? (r as any)[f];
      if (v !== null && v !== undefined && Number.isFinite(Number(v)))
        buckets[f][h].push(Number(v));
    }
  }
  const insights: { field: Field; label: string; insight: string }[] = [];
  for (const field of FIELDS) {
    const avgs = buckets[field]
      .map((vals, hour) =>
        vals.length >= 2 ? { hour, avg: vals.reduce((s, v) => s + v, 0) / vals.length } : null)
      .filter((x): x is { hour: number; avg: number } => x !== null);
    if (avgs.length < 4) continue;
    const maxH   = avgs.reduce((a, b) => a.avg > b.avg ? a : b);
    const minH   = avgs.reduce((a, b) => a.avg < b.avg ? a : b);
    const label  = FIELD_META[field].label;
    const prevOf = (h: number) => formatHour(Math.max(0, h - 1));
    let insight = '';
    if      (field === 'temperature') insight = `Temperature peaks around ${formatHour(maxH.hour)} — open vents by ${prevOf(maxH.hour)}.`;
    else if (field === 'humidity')    insight = `Humidity is lowest around ${formatHour(minH.hour)} — plan airflow checks before ${formatHour(minH.hour)}.`;
    else if (field === 'soil')        insight = `Soil moisture is lowest around ${formatHour(minH.hour)} — inspect root-zone conditions before ${formatHour(minH.hour)}.`;
    else if (field === 'light')       insight = `Light is strongest around ${formatHour(maxH.hour)} — check shade cloth by ${prevOf(maxH.hour)}.`;
    else if (field === 'airppm')      insight = `Air quality is worst around ${formatHour(maxH.hour)} — ensure vents are open by ${prevOf(maxH.hour)}.`;
    if (insight) insights.push({ field, label, insight });
  }
  return insights;
}

// ─── Chart helpers ────────────────────────────────────────────────────────────

const getFieldLabel = (field: string) => FIELD_META[field as Field]?.label ?? field;

const toChartLabel = (value: string | undefined) => {
  if (!value) return '--';
  const d = new Date(value);
  return Number.isFinite(d.getTime())
    ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '--';
};

const getActionHint = (field: string, value: number | null) => {
  if (value === null || !Number.isFinite(value)) return 'No clear action yet';
  if (field === 'soil') {
    if (value < 50) return 'Inspect root-zone dryness now';
    if (value < 60) return 'Plan a soil condition check soon';
    return 'Soil moisture is healthy';
  }
  if (field === 'temperature') {
    if (value > 30) return 'Open vents and add shade';
    if (value > 28) return 'Watch for heat stress';
    return 'Temperature is comfortable';
  }
  if (field === 'humidity') {
    if (value < 60) return 'Reduce ventilation loss and monitor dryness';
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
    if (value < 400)  return 'Air quality is good';
    return 'Check airflow';
  }
  return 'Keep monitoring';
};

const getCorrelationAction = (field1: string, field2: string, correlation: number | null) => {
  if (correlation === null || !Number.isFinite(correlation))
    return 'Not enough data yet to turn this relationship into a field action.';
  const strength  = Math.abs(correlation);
  const direction = correlation >= 0 ? 'move together' : 'move in opposite directions';
  if (strength < 0.35) return 'These two readings do not strongly affect each other.';
  if ((field1 === 'temperature' && field2 === 'humidity') || (field1 === 'humidity' && field2 === 'temperature'))
    return correlation < 0
      ? 'When temperature rises, humidity usually drops. Open vents carefully and watch for dry-air stress.'
      : 'Temperature and humidity rise together here. Check airflow controls.';
  if ((field1 === 'soil' && field2 === 'temperature') || (field1 === 'temperature' && field2 === 'soil'))
    return correlation < 0
      ? 'Hotter conditions are drying the soil. Increase soil-condition checks on warm days.'
      : 'Soil and temperature are moving together. Review shading and heat management timing.';
  if ((field1 === 'soil' && field2 === 'humidity') || (field1 === 'humidity' && field2 === 'soil'))
    return correlation > 0
      ? 'Soil moisture and humidity rise together. Watch for fungal risk.'
      : 'Soil and humidity move in opposite directions. Use the drier one as your warning signal.';
  if ((field1 === 'light' && field2 === 'temperature') || (field1 === 'temperature' && field2 === 'light'))
    return correlation > 0
      ? 'More light is also heating the crop area. Shade or vent before the plants overheat.'
      : 'Light and temperature are not moving together. Check shade cloth or cloud cover.';
  if ((field1 === 'airppm' && field2 === 'humidity') || (field1 === 'humidity' && field2 === 'airppm'))
    return correlation > 0
      ? 'Air is getting heavier as humidity rises. Increase airflow to keep disease risk lower.'
      : 'Air quality improves when humidity changes. Use airflow as the control lever.';
  return `These readings ${direction}. Confirm with the crop and the room itself.`;
};

const getAnomalyAction = (field: string, count: number, total: number) => {
  if (!total || count === 0) return 'No unusual pattern detected. Keep monitoring.';
  const rate = count / total;
  if (field === 'soil')        return rate > 0.2 ? 'Several soil readings are unusual. Inspect root-zone variability and sensor placement.' : 'One or two soil readings are off. Check localized wet/dry zones.';
  if (field === 'temperature') return rate > 0.2 ? 'Temperature spikes are repeating. Check vents, shade, and fans.' : 'A few temperature readings are unusual. Inspect the sensor location for hot spots.';
  if (field === 'humidity')    return rate > 0.2 ? 'Humidity swings are repeating. Review airflow settings and enclosure sealing.' : 'A few humidity readings are unusual. Check for blocked fans or local drafts.';
  if (field === 'light')       return rate > 0.2 ? 'Light is fluctuating too much. Inspect shade cloth or lamps.' : 'A small light spike — check that corner first.';
  if (field === 'airppm')      return rate > 0.2 ? 'Air quality readings are unstable. Improve ventilation.' : 'A small air-quality anomaly may point to poor circulation near the sensor.';
  return 'Check the affected area in person before making a large control change.';
};

// ─── Field icon ───────────────────────────────────────────────────────────────

function FieldIcon({ field, className = 'h-5 w-5' }: { field: Field; className?: string }) {
  switch (field) {
    case 'temperature': return <Thermometer className={className} />;
    case 'humidity':    return <Droplets    className={className} />;
    case 'soil':        return <Leaf        className={className} />;
    case 'airppm':      return <Wind        className={className} />;
    case 'light':       return <Sun         className={className} />;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AnalyticsPage() {
  const [sensorId,   setSensorId]   = useState('');
  const [trendField, setTrendField] = useState('temperature');
  const [corrField1, setCorrField1] = useState('temperature');
  const [corrField2, setCorrField2] = useState('humidity');
  const [mlField,    setMlField]    = useState('temperature');
  const [limit,      setLimit]      = useState(100);

  const [trendLoading, setTrendLoading] = useState(false);
  const [corrLoading,  setCorrLoading]  = useState(false);
  const [mlLoading,    setMlLoading]    = useState(false);
  const isChartLoading = trendLoading || corrLoading || mlLoading;

  const [loadError,  setLoadError]  = useState<string | null>(null);
  const [trendData,       setTrendData]       = useState<TrendResponse | null>(null);
  const [correlationData, setCorrelationData] = useState<CorrelationResponse | null>(null);
  const [mlData,          setMlData]          = useState<MLResponse | null>(null);

  // ── Sensor ID dropdown ─────────────────────────────────────────────────────
  const sensorIdsQuery = useQuery<string[]>({
    queryKey: ['analytics-sensor-ids'],
    queryFn: async () => {
      const res = await fetch('/api/sensors?limit=100');
      if (!res.ok) throw new Error(`Failed to fetch sensors (${res.status})`);
      const data = (await res.json()) as { sensorId?: string }[];
      return Array.from(
        new Set(
          (Array.isArray(data) ? data : [])
            .map(d => d?.sensorId)
            .filter((id): id is string => Boolean(id)),
        ),
      ).sort((a, b) => a.localeCompare(b));
    },
    staleTime: 5  * 60 * 1000,
    gcTime:    30 * 60 * 1000,
  });

  const sensorIds = sensorIdsQuery.data ?? [];

  useEffect(() => {
    if (!sensorId && sensorIds.length) setSensorId(sensorIds[0]);
  }, [sensorIds, sensorId]);

  // ── Raw sensor data for condition cards ────────────────────────────────────
  const dataQuery = useQuery<SensorRecord[]>({
    queryKey: ['analytics-data', sensorId],
    queryFn: async () => {
      const res = await fetch(`/api/sensors/${encodeURIComponent(sensorId)}?limit=500`);
      if (!res.ok) throw new Error(`Failed to fetch data (${res.status})`);
      return res.json();
    },
    enabled: Boolean(sensorId),
    staleTime: 2 * 60 * 1000,
    gcTime:   10 * 60 * 1000,
  });

  const records: SensorRecord[] = dataQuery.data ?? [];

  // ── Chart fetch functions ──────────────────────────────────────────────────
  const safeLimit = Math.min(Math.max(Number(limit) || 100, 20), 2000);

  const runTrend = async (sid: string, field: string) => {
    setTrendLoading(true); setLoadError(null);
    try {
      const r = await fetch(`/api/analysis/trends/${encodeURIComponent(sid)}?field=${encodeURIComponent(field)}&limit=${safeLimit}`);
      if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error((e as any).message || `Trend failed (${r.status})`); }
      setTrendData(await r.json());
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Trend analysis failed');
      setTrendData(null);
    } finally { setTrendLoading(false); }
  };

  const runCorrelation = async (sid: string, f1: string, f2: string) => {
    if (f1 === f2) { setLoadError('Correlation fields must be different.'); return; }
    setCorrLoading(true); setLoadError(null);
    try {
      const r = await fetch(`/api/analysis/correlation/${encodeURIComponent(sid)}?field1=${encodeURIComponent(f1)}&field2=${encodeURIComponent(f2)}&limit=${safeLimit}`);
      if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error((e as any).message || `Correlation failed (${r.status})`); }
      setCorrelationData(await r.json());
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Correlation analysis failed');
      setCorrelationData(null);
    } finally { setCorrLoading(false); }
  };

  const runML = async (sid: string, field: string) => {
    setMlLoading(true); setLoadError(null);
    try {
      const r = await fetch(`/api/analysis/ml-anomalies/${encodeURIComponent(sid)}?field=${encodeURIComponent(field)}&limit=${safeLimit}`);
      if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error((e as any).message || `ML failed (${r.status})`); }
      setMlData(await r.json());
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'ML anomaly analysis failed');
      setMlData(null);
    } finally { setMlLoading(false); }
  };

  const runAnalysis = () => {
    if (!sensorId) { setLoadError('Select a sensor ID to run analysis.'); return; }
    runTrend(sensorId, trendField);
    runCorrelation(sensorId, corrField1, corrField2);
    runML(sensorId, mlField);
  };

  useEffect(() => { if (sensorId) runTrend(sensorId, trendField); },                    [sensorId, trendField]);
  useEffect(() => { if (sensorId) runCorrelation(sensorId, corrField1, corrField2); },  [sensorId, corrField1, corrField2]);
  useEffect(() => { if (sensorId) runML(sensorId, mlField); },                          [sensorId, mlField]);

  // ── Derived card data ─────────────────────────────────────────────────────
  const conditions = useMemo((): ConditionSummary[] => {
    if (!records.length) return [];
    return FIELDS.flatMap(field => {
      const values = getFieldValues(records, field);
      if (values.length === 0) return [];
      const avg       = values.reduce((s, v) => s + v, 0) / values.length;
      const recentN   = Math.max(5, Math.floor(values.length * 0.15));
      const recent    = values.slice(-recentN);
      const recentAvg = recent.reduce((s, v) => s + v, 0) / recent.length;
      const { arrow, direction } = getTrend(values);
      return [{
        field, label: FIELD_META[field].label, unit: FIELD_META[field].unit,
        avg: Number(avg.toFixed(1)), recentAvg: Number(recentAvg.toFixed(1)),
        arrow, direction,
        arrowColor:  getArrowColor(field, direction),
        message:     FIELD_MESSAGES[field][direction],
        borderColor: getBorderColor(field, direction),
      }];
    });
  }, [records]);

  const timeInsights = useMemo(() => buildTimeInsights(records), [records]);

  // ── Derived chart data ────────────────────────────────────────────────────
  const trendWithAverage = useMemo(() => {
    const maMap = new Map((trendData?.movingAverage || []).map(item => [item.timestamp, item.value]));
    return (trendData?.data || []).map((point, index) => ({
      index, label: toChartLabel(point.timestamp),
      value: point.value, movingAverage: maMap.get(point.timestamp),
    }));
  }, [trendData]);

  const mlChartData = useMemo(() =>
    (mlData?.results || []).map((item, index) => ({
      index, label: toChartLabel(item.timestamp),
      value: item.value, anomalyValue: item.isAnomaly ? item.value : null,
    })),
  [mlData]);

  const isLoading = sensorIdsQuery.isLoading || dataQuery.isFetching;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── Controls ──────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-lime-50 p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">Farm Insights</h2>
            <p className="text-sm text-gray-600">
              Current conditions, best times to act, and deep-dive charts.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isLoading && <span className="text-sm font-medium text-emerald-700">Loading…</span>}
            <button
              onClick={runAnalysis}
              disabled={isChartLoading || !sensorId}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isChartLoading ? 'Running…' : 'Run Analysis'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-gray-700">Sensor</span>
            <select value={sensorId} onChange={e => setSensorId(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
              {sensorIds.length === 0 && <option value="">No sensors found</option>}
              {sensorIds.map(id => <option key={id} value={id}>{id}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-gray-700">Readings to analyse (charts)</span>
            <input type="number" min={20} max={2000} value={limit}
              onChange={e => setLimit(Number(e.target.value))}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </label>
        </div>
      </div>

      {/* Error */}
      {loadError && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Analysis error</p>
            <p className="text-sm">{loadError}</p>
          </div>
        </div>
      )}



      {/* ── 3. Analysis Charts ────────────────────────────────────────────── */}
      <section>
        <h3 className="mb-3 text-lg font-semibold text-gray-800">Deep-Dive Charts</h3>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

          {/* Trend chart */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ChartLine className="h-5 w-5 text-emerald-700" />
                <h4 className="text-base font-semibold text-gray-800">Trend over time</h4>
              </div>
              <select value={trendField} onChange={e => setTrendField(e.target.value)}
                className="rounded-md border border-gray-300 px-2 py-1 text-sm">
                {FIELD_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>

            {trendData && (
              <div className="mb-3 grid grid-cols-3 gap-2 text-center text-sm">
                {[
                  { label: 'Trend',        val: TREND_LABELS[trendData.trend]         },
                  { label: 'Change speed', val: trendData.slope.toFixed(2)            },
                  { label: 'Action',       val: getActionHint(trendData.field, trendData.latestValue) },
                ].map(({ label, val }) => (
                  <div key={label} className="rounded-md bg-gray-100 px-2 py-2">
                    <p className="text-gray-500">{label}</p>
                    <p className="font-semibold text-gray-800">{val}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendWithAverage}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="label" stroke="#6b7280" minTickGap={20} />
                  <YAxis stroke="#6b7280" />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="value"         name="Reading"      stroke="#0f766e" strokeWidth={2} dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="movingAverage" name="Moving avg"   stroke="#2563eb" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Correlation chart */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link2 className="h-5 w-5 text-sky-700" />
                <h4 className="text-base font-semibold text-gray-800">How factors relate</h4>
              </div>
              <div className="flex items-center gap-1">
                {[corrField1, corrField2].map((val, i) => (
                  <select key={i} value={val}
                    onChange={e => i === 0 ? setCorrField1(e.target.value) : setCorrField2(e.target.value)}
                    className="rounded-md border border-gray-300 px-2 py-1 text-sm">
                    {FIELD_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                ))}
              </div>
            </div>

            {correlationData && (
              <div className="mb-3 rounded-md bg-gray-100 px-3 py-2 text-sm">
                <span className="font-semibold text-gray-700">Strength: {correlationData.correlation.toFixed(2)}</span>
                <span className="ml-2 text-gray-500">— {correlationData.interpretation}</span>
                <p className="mt-1 text-gray-600">{getCorrelationAction(correlationData.field1, correlationData.field2, correlationData.correlation)}</p>
              </div>
            )}

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="x" name={getFieldLabel(corrField1)} stroke="#6b7280" />
                  <YAxis dataKey="y" name={getFieldLabel(corrField2)} stroke="#6b7280" />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Legend />
                  <Scatter
                    name={`${getFieldLabel(corrField1)} vs ${getFieldLabel(corrField2)}`}
                    data={correlationData?.data || []}
                    fill="#0284c7" isAnimationActive={false} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Anomaly chart */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-rose-700" />
                <h4 className="text-base font-semibold text-gray-800">Unusual readings</h4>
              </div>
              <select value={mlField} onChange={e => setMlField(e.target.value)}
                className="rounded-md border border-gray-300 px-2 py-1 text-sm">
                {FIELD_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>

            {mlData && (
              <>
                <div className="mb-2 grid grid-cols-2 gap-2 text-center text-sm">
                  <div className="rounded-md bg-gray-100 px-2 py-2">
                    <p className="text-gray-500">Method</p>
                    <p className="font-semibold text-gray-800">{mlData.method}</p>
                  </div>
                  <div className="rounded-md bg-gray-100 px-2 py-2">
                    <p className="text-gray-500">Unusual</p>
                    <p className="font-semibold text-gray-800">{mlData.anomalyCount} / {mlData.count}</p>
                  </div>
                </div>
                <div className="mb-2 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-800">
                  {getAnomalyAction(mlData.field, mlData.anomalyCount, mlData.count)}
                </div>
              </>
            )}

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mlChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="label" stroke="#6b7280" minTickGap={20} />
                  <YAxis stroke="#6b7280" />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="value"        name="Reading"         stroke="#1d4ed8" strokeWidth={2}  dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="anomalyValue" name="Needs attention"  stroke="#dc2626" strokeWidth={0}  dot={{ r: 4, fill: '#dc2626' }} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </section>

      {!isLoading && records.length === 0 && sensorId && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 text-sm text-gray-600">
          No data found for sensor <strong>{sensorId}</strong>.
        </div>
      )}

    </div>
  );
}
