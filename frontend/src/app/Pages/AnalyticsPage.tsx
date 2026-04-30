/**
 * AnalyticsPage.tsx - Farm Insights + Analysis Charts
 *
 * Top section  : Condition Summary cards (one per sensor reading) + Best Time to Act
 * Bottom section: Trend chart, Correlation chart, ML Anomaly chart
 */

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle, Brain, ChartLine, Clock,
  Droplets, Leaf, Link2, Sun, Thermometer, Wind,
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
type CorrelationSeverity = 'neutral' | 'warning' | 'critical' | 'good';

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
    increasing: 'Temperature is climbing - open vents or add shade.',
    decreasing: 'Temperature is falling - close vents at night to protect crops.',
    stable:     'Temperature is stable - no action needed.',
  },
  humidity: {
    increasing: 'Humidity is rising - improve airflow to reduce fungal risk.',
    decreasing: 'Humidity is dropping - reduce heat stress and monitor air dryness.',
    stable:     'Humidity is balanced - no action needed.',
  },
  soil: {
    increasing: 'Soil is getting wetter - check for drainage issues and sensor drift.',
    decreasing: 'Soil moisture is decreasing - inspect root-zone conditions soon.',
    stable:     'Soil moisture is steady - keep current environment settings.',
  },
  airppm: {
    increasing: 'Air quality is worsening - open vents to flush out CO₂.',
    decreasing: 'Air quality is improving - ventilation is working well.',
    stable:     'Air quality is steady - no action needed.',
  },
  light: {
    increasing: 'Light levels are climbing - watch for heat build-up from direct sun.',
    decreasing: 'Light is fading - check if shade cloth is blocking too much.',
    stable:     'Light levels are consistent - no action needed.',
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
    if      (field === 'temperature') insight = `Temperature peaks around ${formatHour(maxH.hour)} - open vents by ${prevOf(maxH.hour)}.`;
    else if (field === 'humidity')    insight = `Humidity is lowest around ${formatHour(minH.hour)} - plan airflow checks before ${formatHour(minH.hour)}.`;
    else if (field === 'soil')        insight = `Soil moisture is lowest around ${formatHour(minH.hour)} - inspect root-zone conditions before ${formatHour(minH.hour)}.`;
    else if (field === 'light')       insight = `Light is strongest around ${formatHour(maxH.hour)} - check shade cloth by ${prevOf(maxH.hour)}.`;
    else if (field === 'airppm')      insight = `Air quality is worst around ${formatHour(maxH.hour)} - ensure vents are open by ${prevOf(maxH.hour)}.`;
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

// Rule-based insight: temperature vs humidity only
const getCorrelationInsight = (
  correlation: number | null,
  tempDirection: 'increasing' | 'decreasing' | 'stable' | null
) : { prediction: string | null; action: string | null; severity: CorrelationSeverity } => {
  if (correlation === null || !Number.isFinite(correlation))
    return { prediction: null, action: null, severity: 'neutral' };

  const abs  = Math.abs(correlation);
  const dir  = tempDirection ?? 'stable';

  // Strength tiers
  const isStrong   = abs > 0.7;
  const isModerate = abs >= 0.35 && abs <= 0.7;
  const isWeak     = abs < 0.35;
  const qualifier  = isStrong ? 'very likely' : isModerate ? 'likely' : 'slight chance';

  if (correlation < 0) {
    // Inverse: as temperature rises, humidity falls (and vice-versa)
    if (dir === 'increasing') return {
      prediction: isWeak
        ? 'Temperature is rising. There is a slight chance humidity will drop — keep an eye on it.'
        : `Temperature is rising. Humidity will ${qualifier} drop soon.`,
      action: isWeak
        ? 'Keep an eye on humidity levels over the next few hours.'
        : isStrong
          ? 'Open vents now and prepare to mist the plants — humidity will fall fast.'
          : 'Open vents and prepare to mist the plants.',
      severity: isWeak ? 'neutral' : 'warning',
    };
    if (dir === 'decreasing') return {
      prediction: isWeak
        ? 'Temperature is falling. There is a slight chance humidity will rise — keep an eye on it.'
        : `Temperature is falling. Humidity will ${qualifier} rise.`,
      action: isWeak
        ? 'Keep an eye on humidity levels over the next few hours.'
        : isStrong
          ? 'Run the fans straight away — rising moisture increases mould risk fast.'
          : 'Run the fans to stop moisture building up and prevent mould.',
      severity: isWeak ? 'neutral' : 'warning',
    };
    // stable
    return {
      prediction: 'Temperature and humidity are holding steady right now.',
      action:     'Keep current ventilation and check in on conditions.',
      severity:   'good',
    };
  } else {
    // Positive: both move in the same direction
    if (dir === 'increasing') return {
      prediction: isWeak
        ? 'Temperature and humidity are both rising slightly.'
        : 'Temperature and humidity are both climbing.',
      action: isWeak
        ? 'Keep an eye on conditions — check that ventilation is working.'
        : isStrong
          ? 'Open vents immediately — high heat and moisture together raise disease risk fast.'
          : 'Open vents now — heat and moisture together increase disease risk.',
      severity: isWeak ? 'neutral' : 'critical',
    };
    if (dir === 'decreasing') return {
      prediction: isWeak
        ? 'Temperature and humidity are both easing off slightly.'
        : 'Temperature and humidity are both dropping.',
      action: isWeak
        ? 'Keep an eye on conditions — protect sensitive plants if it gets colder.'
        : isStrong
          ? 'Protect sensitive crops now — consider heating and misting straight away.'
          : 'Protect sensitive crops from cold and dry stress. Consider heating.',
      severity: isWeak ? 'neutral' : 'warning',
    };
    // stable
    return {
      prediction: 'Temperature and humidity are moving together and holding steady.',
      action:     'No action needed right now. Keep monitoring.',
      severity:   'good',
    };
  }
};

const getAnomalyAction = (field: string, count: number, total: number) => {
  if (!total || count === 0) return 'No unusual pattern detected. Keep monitoring.';
  const rate = count / total;
  if (field === 'soil')        return rate > 0.2 ? 'Several soil readings are unusual. Inspect root-zone variability and sensor placement.' : 'One or two soil readings are off. Check localized wet/dry zones.';
  if (field === 'temperature') return rate > 0.2 ? 'Temperature spikes are repeating. Check vents, shade, and fans.' : 'A few temperature readings are unusual. Inspect the sensor location for hot spots.';
  if (field === 'humidity')    return rate > 0.2 ? 'Humidity swings are repeating. Review airflow settings and enclosure sealing.' : 'A few humidity readings are unusual. Check for blocked fans or local drafts.';
  if (field === 'light')       return rate > 0.2 ? 'Light is fluctuating too much. Inspect shade cloth or lamps.' : 'A small light spike - check that corner first.';
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
  const [mlField,    setMlField]    = useState('temperature');
  const [limit,      setLimit]      = useState(100);

  const [trendLoading, setTrendLoading] = useState(false);
  const [corrLoading,  setCorrLoading]  = useState(false);
  const [mlLoading,    setMlLoading]    = useState(false);
  const isChartLoading = trendLoading || corrLoading || mlLoading;

  const [loadError,       setLoadError]       = useState<string | null>(null);
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
    runCorrelation(sensorId, 'temperature', 'humidity');
    runML(sensorId, mlField);
  };

  useEffect(() => { if (sensorId) runTrend(sensorId, trendField); },                          [sensorId, trendField]);
  useEffect(() => { if (sensorId) runCorrelation(sensorId, 'temperature', 'humidity'); },     [sensorId]);
  useEffect(() => { if (sensorId) runML(sensorId, mlField); },                                [sensorId, mlField]);

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
        {/* ── Temperature / Humidity insight (rule-based) ── */}
        {(() => {
          const tempDir = trendData?.field === 'temperature' ? trendData.trend : null;
          const insight = getCorrelationInsight(correlationData?.correlation ?? null, tempDir);
          const borderCls = insight.severity === 'critical' ? 'border-rose-300 bg-rose-50'
                          : insight.severity === 'warning'  ? 'border-amber-300 bg-amber-50'
                          : insight.severity === 'good'     ? 'border-emerald-200 bg-emerald-50'
                          : 'border-gray-200 bg-gray-50';
          const labelCls  = insight.severity === 'critical' ? 'text-rose-700'
                          : insight.severity === 'warning'  ? 'text-amber-700'
                          : insight.severity === 'good'     ? 'text-emerald-700'
                          : 'text-gray-500';
          return (
            <div className={`mb-4 rounded-xl border-2 p-5 ${borderCls}`}>
              <div className="mb-3 flex items-center gap-2">
                <Link2 className="h-5 w-5 text-sky-700" />
                <h4 className="text-base font-semibold text-gray-800">Temperature &amp; Humidity — What to expect next</h4>
              </div>
              {corrLoading && <p className="text-sm text-gray-500">Calculating…</p>}
              {!corrLoading && correlationData && insight.prediction && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className={`mb-1 text-xs font-semibold uppercase tracking-wide ${labelCls}`}>What is likely to happen</p>
                    <p className="text-lg font-semibold text-gray-800">{insight.prediction}</p>
                  </div>
                  <div>
                    <p className={`mb-1 text-xs font-semibold uppercase tracking-wide ${labelCls}`}>What to do</p>
                    <p className="text-lg font-semibold text-gray-800">{insight.action}</p>
                  </div>
                </div>
              )}
              {!corrLoading && !correlationData && (
                <p className="text-sm text-gray-500">Click Run Analysis to see the insight.</p>
              )}
            </div>
          );
        })()}

        <h3 className="mb-3 text-lg font-semibold text-gray-800">Deep-Dive Charts</h3>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

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
                  { label: 'Trend',        val: TREND_LABELS[trendData.trend] },
                  { label: 'Change speed', val: trendData.slope.toFixed(2)    },
                  { label: 'What it means', val: getActionHint(trendData.field, trendData.latestValue) },
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
                  <Line type="monotone" dataKey="value"         name="Reading"    stroke="#3b82f6" strokeWidth={3} dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="movingAverage" name="Moving avg"  stroke="#f97316" strokeWidth={3} dot={false} isAnimationActive={false} />
                </LineChart>
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

          {/* Correlation chart */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link2 className="h-5 w-5 text-sky-600" />
                <h4 className="text-base font-semibold text-gray-800">Sensor Correlation</h4>
              </div>
            </div>

            {correlationData && (
              <>
                <div className="mb-3 grid grid-cols-2 gap-2 text-center text-sm">
                  <div className="rounded-md bg-gray-100 px-2 py-2">
                    <p className="text-gray-500">Correlation</p>
                    <p className={`font-semibold ${
                      Math.abs(correlationData.correlation) > 0.7 ? 'text-rose-600' :
                      Math.abs(correlationData.correlation) > 0.35 ? 'text-amber-600' :
                      'text-emerald-600'
                    }`}>
                      {correlationData.correlation.toFixed(2)}
                    </p>
                  </div>
                  <div className="rounded-md bg-gray-100 px-2 py-2">
                    <p className="text-gray-500">Fields</p>
                    <p className="text-xs font-semibold text-gray-800">
                      {getFieldLabel(correlationData.field1)} vs<br />{getFieldLabel(correlationData.field2)}
                    </p>
                  </div>
                </div>
                <div className="mb-2 rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-800">
                  {correlationData.interpretation}
                </div>
              </>
            )}

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" dataKey="x" stroke="#6b7280" name={correlationData?.field1 ? getFieldLabel(correlationData.field1) : 'Field 1'} />
                  <YAxis type="number" dataKey="y" stroke="#6b7280" name={correlationData?.field2 ? getFieldLabel(correlationData.field2) : 'Field 2'} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter name="Data Points" data={correlationData?.data || []} fill="#8b5cf6" />
                </ScatterChart>
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