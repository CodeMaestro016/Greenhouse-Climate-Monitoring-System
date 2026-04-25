import { useDeferredValue, useMemo, useRef, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Thermometer, Droplets, Sprout, Sun, Wind, Download, RefreshCw } from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend,
} from 'recharts';
import { useAppStore } from '../store/appStore';

// ─── Types ───────────────────────────────────────────────────────────────────

type SensorRecord = {
  _id: string;
  sensorId: string;
  timestamp: string;
  readings?: {
    temperature?: number; humidity?: number; lux?: number;
    airppm?: number; soil?: number; fan?: string; buzzer?: string; light?: number;
  };
  temperature?: number; humidity?: number; lux?: number;
  airppm?: number; soil?: number; fan?: string; buzzer?: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Returns ISO date-range strings for a given timeRange key */
const getDateRange = (
  timeRange: string,
  customStartDate: string,
  customEndDate: string
): { startDate: string | null; endDate: string | null } => {
  const now = new Date();
  const iso = (d: Date) => d.toISOString();

  if (timeRange === '24h') return { startDate: iso(new Date(now.getTime() - 86_400_000)), endDate: null };
  if (timeRange === '7d')  return { startDate: iso(new Date(now.getTime() - 7 * 86_400_000)), endDate: null };
  if (timeRange === '20d') return { startDate: iso(new Date(now.getTime() - 20 * 86_400_000)), endDate: null };
  if (timeRange === '3m')  return { startDate: iso(new Date(now.getTime() - 90 * 86_400_000)), endDate: null };
  if (timeRange === 'all') return { startDate: null, endDate: null };
  if (timeRange === 'custom') return {
    startDate: customStartDate || null,
    endDate: customEndDate || null,
  };
  return { startDate: iso(new Date(now.getTime() - 7 * 86_400_000)), endDate: null };
};

const formatDate = (d: Date) => d.toLocaleDateString('en-GB', { timeZone: 'UTC' });
const formatTime = (d: Date) =>
  d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true, timeZone: 'UTC' });

// ─── Component ───────────────────────────────────────────────────────────────

export function HistoryPage() {
  const timeRange        = useAppStore((s) => s.historyTimeRange);
  const setTimeRange     = useAppStore((s) => s.setHistoryTimeRange);
  const customStartDate  = useAppStore((s) => s.historyCustomStartDate);
  const setCustomStartDate = useAppStore((s) => s.setHistoryCustomStartDate);
  const customEndDate    = useAppStore((s) => s.historyCustomEndDate);
  const setCustomEndDate = useAppStore((s) => s.setHistoryCustomEndDate);
  const tableSearch      = useAppStore((s) => s.historyTableSearch);
  const setTableSearch   = useAppStore((s) => s.setHistoryTableSearch);
  const selectedSensorId = useAppStore((s) => s.historySelectedSensorId);
  const setSelectedSensorId = useAppStore((s) => s.setHistorySelectedSensorId);

  const deferredSearch = useDeferredValue(tableSearch);

  // ── Build API URL with server-side date filter ──────────────────────────
  const { startDate, endDate } = useMemo(
    () => getDateRange(timeRange, customStartDate, customEndDate),
    [timeRange, customStartDate, customEndDate]
  );

  const apiUrl = useMemo(() => {
    const base =
      selectedSensorId && selectedSensorId !== 'all'
        ? `/api/sensors/${encodeURIComponent(selectedSensorId)}`
        : '/api/sensors';

    const params = new URLSearchParams();
    // Send date range to backend — avoids downloading 25k records
    if (startDate) params.set('startDate', startDate);
    if (endDate)   params.set('endDate', endDate);
    // Scale the limit to the selected range so longer views aren't cut short
    const limitByRange: Record<string, string> = {
      '24h': '20000',
      '7d':  '70000',
      '20d': '300000',
      '3m':  '500000',
    };
    params.set('limit', limitByRange[timeRange] ?? '0');

    return `${base}?${params.toString()}`;
  }, [selectedSensorId, startDate, endDate, timeRange]);

  // ── Query with aggressive caching ──────────────────────────────────────
  const { data, isLoading, isFetching, error, refetch } = useQuery<SensorRecord[]>({
    queryKey: ['sensor-history', timeRange, selectedSensorId, customStartDate, customEndDate], // logical filter — stable across navigations
    queryFn: async ({ signal }) => {
      const resp = await fetch(apiUrl, { signal, cache: 'no-store' });
      if (!resp.ok) throw new Error(`Failed to load sensor history (${resp.status})`);
      const json = await resp.json();
      return Array.isArray(json) ? json : json ? [json] : [];
    },
    staleTime:  5 * 60 * 1000,   // treat data as fresh for 5 min — no auto-refetch on nav
    gcTime:    30 * 60 * 1000,   // keep in cache 30 min
    retry: 1,
  });

  const historyError = error instanceof Error ? error.message : null;

  // ── Parse + sort once ───────────────────────────────────────────────────
  const parsedRecords = useMemo(() => {
    if (!data?.length) return [];
    return data
      .map((rec) => ({
        _id: rec._id,
        sensorId: rec.sensorId,
        recordedAt: new Date(rec.timestamp),
        humidity: rec.readings?.humidity ?? rec.humidity ?? null,
        soil: rec.readings?.soil ?? rec.soil ?? null,
        light: rec.readings?.lux ?? rec.readings?.light ?? rec.lux ?? null,
        airppm:
          rec.readings?.airppm ??
          (rec.readings as any)?.mq135_raw ??
          rec.airppm ??
          (rec as any).mq135_raw ??
          (rec as any).airPPM ??
          null,
        temp: rec.readings?.temperature ?? rec.temperature ?? null,
        fan: rec.readings?.fan ?? rec.fan ?? null,
        buzzer: rec.readings?.buzzer ?? rec.buzzer ?? null,
      }))
      .filter((r) => Number.isFinite(r.recordedAt.getTime()))
      .sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime());
  }, [data]);

  // ── Sensor list for the dropdown ────────────────────────────────────────
  // Derived from current data but accumulated into a persistent set so the
  // dropdown never collapses when the user switches to a single-sensor view.
  const knownSensorIdsRef = useRef<Set<string>>(new Set());

  const allSensorIds = useMemo(() => {
    parsedRecords.forEach((r) => { if (r.sensorId) knownSensorIdsRef.current.add(r.sensorId); });
    return Array.from(knownSensorIdsRef.current).sort();
  }, [parsedRecords]);

  // ── Search filter (deferred so typing stays snappy) ─────────────────────
  const filteredRows = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    if (!q) return parsedRecords;
    return parsedRecords.filter((row) => {
      const text = [
        row.sensorId, formatDate(row.recordedAt), formatTime(row.recordedAt),
        row.humidity, row.soil, row.light, row.temp, row.airppm, row.fan, row.buzzer,
      ].join(' ').toLowerCase();
      return text.includes(q);
    });
  }, [parsedRecords, deferredSearch]);

  // Only render first 200 rows — avoids layout thrash on huge result sets
  const visibleRows = filteredRows.slice(0, 200);

  // ── Stats ───────────────────────────────────────────────────────────────
  const calcStats = (vals: (number | null)[]) => {
    const nums = vals.filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
    if (!nums.length) return null;
    const sum = nums.reduce((a, v) => a + v, 0);
    return { avg: sum / nums.length, min: Math.min(...nums), max: Math.max(...nums) };
  };

  const tempStats    = useMemo(() => calcStats(parsedRecords.map((r) => r.temp)),     [parsedRecords]);
  const humidityStats = useMemo(() => calcStats(parsedRecords.map((r) => r.humidity)), [parsedRecords]);
  const soilStats    = useMemo(() => calcStats(parsedRecords.map((r) => r.soil)),     [parsedRecords]);
  const lightStats   = useMemo(() => calcStats(parsedRecords.map((r) => r.light)),    [parsedRecords]);
  const airppmStats  = useMemo(() => calcStats(parsedRecords.map((r) => r.airppm)),   [parsedRecords]);

  // ── Chart data (bucketed, max 30 points) ───────────────────────────────
  const trendData = useMemo(() => {
    const rowsAsc = [...parsedRecords].sort((a, b) => a.recordedAt.getTime() - b.recordedAt.getTime());
    const useHourly = timeRange === '24h';
    const buckets = new Map<string, { label: string; temp: number[]; humidity: number[]; soil: number[]; light: number[]; airppm: number[] }>();

    for (const row of rowsAsc) {
      const d = row.recordedAt;
      const key = useHourly
        ? `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}-${d.getUTCHours()}`
        : `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
      const label = useHourly
        ? d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'UTC' })
        : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', timeZone: 'UTC' });

      if (!buckets.has(key)) buckets.set(key, { label, temp: [], humidity: [], soil: [], light: [], airppm: [] });
      const b = buckets.get(key)!;
      if (typeof row.temp     === 'number') b.temp.push(row.temp);
      if (typeof row.humidity === 'number') b.humidity.push(row.humidity);
      if (typeof row.soil     === 'number') b.soil.push(row.soil);
      if (typeof row.light    === 'number') b.light.push(row.light);
      if (typeof row.airppm   === 'number') b.airppm.push(row.airppm);
    }

    const avg = (nums: number[]) => nums.length ? nums.reduce((a, v) => a + v, 0) / nums.length : null;
    const result = Array.from(buckets.values()).map((b) => ({
      label: b.label, temp: avg(b.temp), humidity: avg(b.humidity),
      soil: avg(b.soil), light: avg(b.light), airppm: avg(b.airppm),
    }));

    const max = useHourly ? 24 : 30;
    return result.slice(Math.max(0, result.length - max));
  }, [parsedRecords, timeRange]);

  // ── Latest reading per sensor (for "All sensors" view) ─────────────────
  const latestBySensorId = useMemo(() => {
    const map = new Map<string, typeof parsedRecords[number]>();
    for (const row of parsedRecords) if (!map.has(row.sensorId)) map.set(row.sensorId, row);
    return map;
  }, [parsedRecords]);

  // ── CSV download — fetches ALL records for the active filter (no display cap) ─
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadCsv = useCallback(async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      // Build the same URL as the display query but with limit=0 (no cap)
      const base =
        selectedSensorId && selectedSensorId !== 'all'
          ? `/api/sensors/${encodeURIComponent(selectedSensorId)}`
          : '/api/sensors';
      const params = new URLSearchParams();
      if (startDate) params.set('startDate', startDate);
      if (endDate)   params.set('endDate',   endDate);
      params.set('limit', '0'); // fetch everything for the selected range

      const resp = await fetch(`${base}?${params.toString()}`);
      if (!resp.ok) throw new Error(`Download failed (${resp.status})`);
      const json = await resp.json();
      const allRecords: typeof parsedRecords = (Array.isArray(json) ? json : json ? [json] : [])
        .map((rec: SensorRecord) => ({
          _id: rec._id,
          sensorId: rec.sensorId,
          recordedAt: new Date(rec.timestamp),
          humidity: rec.readings?.humidity ?? rec.humidity ?? null,
          soil:     rec.readings?.soil     ?? rec.soil     ?? null,
          light:    rec.readings?.lux      ?? rec.readings?.light ?? rec.lux ?? null,
          airppm:   rec.readings?.airppm   ?? (rec.readings as any)?.mq135_raw ?? rec.airppm ?? (rec as any).mq135_raw ?? (rec as any).airPPM ?? null,
          temp:     rec.readings?.temperature ?? rec.temperature ?? null,
          fan:      rec.readings?.fan  ?? rec.fan  ?? null,
          buzzer:   rec.readings?.buzzer ?? rec.buzzer ?? null,
        }))
        .filter((r: any) => Number.isFinite(r.recordedAt.getTime()));

      // Apply the active search filter so the CSV matches what the user sees
      const q = tableSearch.trim().toLowerCase();
      const rows = (q
        ? allRecords.filter((row) =>
            [row.sensorId, formatDate(row.recordedAt), formatTime(row.recordedAt),
             row.humidity, row.soil, row.light, row.temp, row.airppm, row.fan, row.buzzer]
              .join(' ').toLowerCase().includes(q))
        : allRecords
      );

      const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
      const headers = ['Sensor ID','Date','Time (UTC)','Humidity','Soil Moisture','Light (lux)','Temperature','Air Quality (PPM)'];
      const csvRows = rows.map((r) => [
        r.sensorId, formatDate(r.recordedAt), formatTime(r.recordedAt),
        r.humidity ?? '', r.soil ?? '', r.light ?? '', r.temp ?? '', r.airppm ?? '',
      ]);
      const csv = [headers, ...csvRows].map((l) => l.map(esc).join(',')).join('\n');
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
      const a = Object.assign(document.createElement('a'), {
        href: url,
        download: `history-${new Date().toISOString().replace(/[:.]/g, '-')}.csv`,
      });
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('CSV download error:', err);
    } finally {
      setIsDownloading(false);
    }
  }, [isDownloading, selectedSensorId, startDate, endDate, tableSearch, parsedRecords]);

  // ── Metric cards config ────────────────────────────────────────────────
  const toProgress = (val: number | null | undefined, max: number) =>
    typeof val === 'number' && Number.isFinite(val) && max > 0
      ? Math.max(0, Math.min(100, Math.round((val / max) * 100)))
      : null;

  const metricCards = [
    { id: 'temp',     title: 'Avg Temperature',    icon: Thermometer, tone: 'red',     stats: tempStats,     value: tempStats     ? `${tempStats.avg.toFixed(1)}°C`                           : '--', range: tempStats     ? `${tempStats.min.toFixed(1)}°C – ${tempStats.max.toFixed(1)}°C`                                         : '--', progress: toProgress(tempStats?.avg,     50)    },
    { id: 'humidity', title: 'Avg Humidity',        icon: Droplets,    tone: 'blue',    stats: humidityStats, value: humidityStats ? `${Math.round(humidityStats.avg)}%`                      : '--', range: humidityStats ? `${Math.round(humidityStats.min)}% – ${Math.round(humidityStats.max)}%`                           : '--', progress: toProgress(humidityStats?.avg, 100)   },
    { id: 'soil',     title: 'Avg Soil Moisture',   icon: Sprout,      tone: 'emerald', stats: soilStats,     value: soilStats     ? `${Math.round(soilStats.avg)}%`                          : '--', range: soilStats     ? `${Math.round(soilStats.min)}% – ${Math.round(soilStats.max)}%`                                         : '--', progress: toProgress(soilStats?.avg,     100)   },
    { id: 'light',    title: 'Avg Light Intensity', icon: Sun,         tone: 'amber',   stats: lightStats,    value: lightStats    ? `${Math.round(lightStats.avg).toLocaleString()} lux`     : '--', range: lightStats    ? `${Math.round(lightStats.min).toLocaleString()} – ${Math.round(lightStats.max).toLocaleString()} lux` : '--', progress: toProgress(lightStats?.avg,    20000) },
    { id: 'airppm', title: 'Avg Air Quality (PPM)', icon: Wind, tone: 'violet', stats: airppmStats, value: airppmStats ? `${Math.round(airppmStats.avg).toLocaleString()} ppm` : '--', range: airppmStats ? `${Math.round(airppmStats.min).toLocaleString()} – ${Math.round(airppmStats.max).toLocaleString()} ppm` : '--', progress: toProgress(airppmStats?.avg, 2000) },
  ] as const;

  const chartDefs = [
    { key: 'temp',     title: 'Temperature Trends',    color: '#ef4444', name: 'Temperature (°C)' },
    { key: 'humidity', title: 'Humidity Trends',        color: '#3b82f6', name: 'Humidity (%)'     },
    { key: 'soil',     title: 'Soil Moisture Trends',   color: '#22c55e', name: 'Soil Moisture (%)'},
    { key: 'light',    title: 'Light Intensity Trends', color: '#f59e0b', name: 'Light (lux)'      },
    { key: 'airppm', title: 'Air Quality Trends', color: '#7c3aed', name: 'Air Quality (PPM)' },
  ] as const;

  const toneClass = (tone: string, type: 'card' | 'icon' | 'track' | 'fill') => {
    const map: Record<string, Record<string, string>> = {
      red:     { card: 'bg-red-50 border-red-200',       icon: 'bg-red-100 text-red-600',       track: 'bg-red-100',    fill: 'bg-red-500'    },
      blue:    { card: 'bg-blue-50 border-blue-200',     icon: 'bg-blue-100 text-blue-600',     track: 'bg-blue-100',   fill: 'bg-blue-500'   },
      emerald: { card: 'bg-emerald-50 border-emerald-200', icon: 'bg-emerald-100 text-emerald-600', track: 'bg-emerald-100', fill: 'bg-emerald-500' },
      amber:   { card: 'bg-amber-50 border-amber-200',   icon: 'bg-amber-100 text-amber-600',   track: 'bg-amber-100',  fill: 'bg-amber-500'  },
      violet:  { card: 'bg-violet-50 border-violet-200', icon: 'bg-violet-100 text-violet-700', track: 'bg-violet-100', fill: 'bg-violet-500' },
    };
    return map[tone]?.[type] ?? '';
  };

  const rangeLabelByKey: Record<string, string> = {
    '24h': 'Last 24 Hours', '7d': 'Last 7 Days', '20d': 'Last 20 Days',
    '3m': 'Last 3 Months', all: 'All Time', custom: 'Custom Range',
  };

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Header + Filters */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Historical Sensor Data</h2>
          <p className="text-sm text-gray-500 mt-1">View and analyze historical sensor readings and trends</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedSensorId}
            onChange={(e) => setSelectedSensorId(e.target.value)}
            className="px-3 py-2.5 border border-gray-200 rounded-md text-sm bg-white"
          >
            <option value="all">All sensors</option>
            {allSensorIds.map((id) => <option key={id} value={id}>{id}</option>)}
          </select>

          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2.5 border border-gray-200 rounded-md text-sm bg-white"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="20d">Last 20 Days</option>
            <option value="3m">Last 3 Months</option>
            <option value="all">All time</option>
            <option value="custom">Custom Range</option>
          </select>

          {timeRange === 'custom' && (
            <>
              <input type="datetime-local" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-2.5 border border-gray-200 rounded-md text-sm bg-white" />
              <span className="text-sm text-gray-500">to</span>
              <input type="datetime-local" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-2.5 border border-gray-200 rounded-md text-sm bg-white" />
            </>
          )}

          {/* Manual refresh button — shows spinner while background refetch runs */}
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2.5 border border-gray-200 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 text-gray-600 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Status bar */}
      {isFetching && !isLoading && (
        <div className="text-xs text-gray-400 flex items-center gap-1.5">
          <RefreshCw className="w-3 h-3 animate-spin" /> Refreshing in background…
        </div>
      )}

      {/* All-sensors overview */}
      {selectedSensorId === 'all' ? (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Latest reading per sensor</h3>
              <p className="text-sm text-gray-500">Most recent record per sensor ID</p>
            </div>
            <span className="text-sm font-semibold text-gray-700 bg-gray-100 px-3 py-1.5 rounded-full">
              {latestBySensorId.size} sensors
            </span>
          </div>

          <div className="mt-4 grid grid-cols-12 gap-3">
            {Array.from(latestBySensorId.entries()).map(([sensorId, row]) => (
              <div key={sensorId} className="col-span-12 md:col-span-6 xl:col-span-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-600">Sensor</p>
                    <p className="text-xl font-bold text-gray-900 truncate">{sensorId}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatDate(row.recordedAt)} {formatTime(row.recordedAt)} (UTC)</p>
                  </div>
                  <button type="button" onClick={() => setSelectedSensorId(sensorId)}
                    className="shrink-0 rounded-lg bg-white border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-100">
                    View
                  </button>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  {[
                    { label: 'Temp',     val: row.temp,     unit: '°C' },
                    { label: 'Humidity', val: row.humidity, unit: '%'  },
                    { label: 'Soil',     val: row.soil,     unit: '%'  },
                    { label: 'Light',    val: row.light,    unit: ''   },
                  ].map(({ label, val, unit }) => (
                    <div key={label} className="rounded-md bg-white border border-gray-200 p-2">
                      <p className="text-xs text-gray-500">{label}</p>
                      <p className="font-semibold text-gray-900">
                        {typeof val === 'number' ? `${typeof val === 'number' && label === 'Light' ? val.toLocaleString() : val}${unit}` : '--'}
                      </p>
                    </div>
                  ))}
                  <div className="col-span-2 rounded-md bg-white border border-gray-200 p-2">
                    <p className="text-xs text-gray-500">Air Quality</p>
                    <p className="font-semibold text-gray-900">{row.airppm ?? '--'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Metric cards (single sensor view) */
        <div className="grid grid-cols-12 gap-4">
          {metricCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.id} className={`col-span-12 sm:col-span-6 xl:col-span-4 rounded-lg border p-3 ${toneClass(card.tone, 'card')}`}>
                <div className="flex items-center gap-2.5">
                  <div className={`p-1.5 rounded-md ${toneClass(card.tone, 'icon')}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">{card.title}</p>
                    <p className="text-3xl font-bold text-gray-900">{card.value}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-2">Range: {card.range}</p>
                {typeof card.progress === 'number' && (
                  <div className={`w-full h-1.5 rounded-full mt-2 overflow-hidden ${toneClass(card.tone, 'track')}`}>
                    <div className={`h-full rounded-full ${toneClass(card.tone, 'fill')}`} style={{ width: `${card.progress}%` }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Error / empty / loading states */}
      {isLoading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm flex items-center gap-3">
          <RefreshCw className="w-5 h-5 animate-spin text-gray-400" />
          <p className="text-base text-gray-600">Loading sensor history…</p>
        </div>
      ) : historyError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm">
          <p className="text-base font-semibold text-red-800">Failed to load history</p>
          <p className="text-sm text-red-700 mt-1">{historyError}</p>
        </div>
      ) : parsedRecords.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-base font-semibold text-gray-800">No records found for this range.</p>
          <p className="text-sm text-gray-600 mt-1">Try a larger time range or "All sensors".</p>
        </div>
      ) : null}

      {/* Charts */}
      <div className="grid grid-cols-12 gap-4">
        {chartDefs.map((chart) => (
          <div key={chart.key} className="col-span-12 lg:col-span-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h3 className="text-base font-semibold text-gray-800 mb-3">
              {rangeLabelByKey[timeRange]} {chart.title}
            </h3>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="label" stroke="#6b7280" style={{ fontSize: '10px' }} />
                  <YAxis stroke="#6b7280" style={{ fontSize: '10px' }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey={chart.key as string} stroke={chart.color}
                    strokeWidth={2} name={chart.name} dot={false} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}

        {/* Data table */}
        <div className="col-span-12 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-gray-900">
              Sensor Data History
              {filteredRows.length > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({filteredRows.length.toLocaleString()} records)
                </span>
              )}
            </h3>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search"
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  className="pl-8 pr-3 py-2 border border-gray-200 rounded-md text-sm bg-gray-50"
                />
              </div>
              <button type="button" onClick={downloadCsv} disabled={isDownloading || parsedRecords.length === 0}
                className="px-4 py-2 border border-gray-200 rounded-md text-sm bg-white hover:bg-gray-100 disabled:opacity-50 inline-flex items-center gap-2">
                {isDownloading
                  ? <><RefreshCw className="w-4 h-4 animate-spin" /> Downloading…</>
                  : <><Download className="w-4 h-4" /> Download</>
                }
              </button>
            </div>
          </div>

          <div className="max-h-[260px] overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-gray-700">
                  {['Sensor ID','Date','Time','Humidity','Soil Moisture','Light (lux)','Temperature','Air Quality (PPM)'].map((h) => (
                    <th key={h} className="sticky top-0 z-10 bg-white text-left py-3 px-3 font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => (
                  <tr key={row._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-3 text-gray-700 font-medium">{row.sensorId}</td>
                    <td className="py-2 px-3 text-gray-700">{formatDate(row.recordedAt)}</td>
                    <td className="py-2 px-3 text-gray-700">{formatTime(row.recordedAt)}</td>
                    <td className="py-2 px-3 text-gray-700">
                      <span className="inline-flex items-center gap-1"><Droplets className="w-3.5 h-3.5 text-blue-500" />{row.humidity ?? '--'}{typeof row.humidity === 'number' ? '%' : ''}</span>
                    </td>
                    <td className="py-2 px-3 text-gray-700">
                      <span className="inline-flex items-center gap-1"><Sprout className="w-3.5 h-3.5 text-emerald-500" />{row.soil ?? '--'}{typeof row.soil === 'number' ? '%' : ''}</span>
                    </td>
                    <td className="py-2 px-3 text-gray-700">
                      <span className="inline-flex items-center gap-1"><Sun className="w-3.5 h-3.5 text-amber-500" />{typeof row.light === 'number' ? row.light.toLocaleString() : '--'}</span>
                    </td>
                    <td className="py-2 px-3 text-gray-700">
                      <span className="inline-flex items-center gap-1"><Thermometer className="w-3.5 h-3.5 text-red-500" />{row.temp ?? '--'}</span>
                    </td>
                    <td className="py-2 px-3 text-gray-700">
                      <span className="inline-flex items-center gap-1"><Wind className="w-3.5 h-3.5 text-violet-500" />{row.airppm ?? '--'}</span>
                    </td>
                  </tr>
                ))}
                {filteredRows.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-sm text-gray-500">No records match this filter.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {filteredRows.length > visibleRows.length && (
            <p className="mt-2 text-xs text-gray-500">
              Showing first {visibleRows.length} of {filteredRows.length.toLocaleString()} records. Use search or narrow the date range to see more.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}