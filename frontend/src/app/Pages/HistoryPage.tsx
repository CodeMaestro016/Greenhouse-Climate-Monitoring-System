import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Search, Thermometer, Droplets, Sprout, Sun, Wind, Download } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';

type SensorRecord = {
  _id: string;
  sensorId: string;
  timestamp: string;
  readings?: {
    temperature?: number;
    humidity?: number;
    lux?: number;
    airppm?: number;
    soil?: number;
    fan?: string;
    buzzer?: string;
    light?: number;
  };
  temperature?: number;
  humidity?: number;
  lux?: number;
  airppm?: number;
  soil?: number;
  fan?: string;
  buzzer?: string;
};

export function HistoryPage() {
  const [timeRange, setTimeRange] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [tableSearch, setTableSearch] = useState('');
  const [selectedSensorId, setSelectedSensorId] = useState<string>('all');
  const [sensorRecords, setSensorRecords] = useState<SensorRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const deferredTableSearch = useDeferredValue(tableSearch);

  useEffect(() => {
    let cancelled = false;

    const getHistoryFetchLimit = () => {
      return selectedSensorId === 'all' ? 5000 : 10000;
    };

    async function loadHistory() {
      setHistoryLoading(true);
      setHistoryError(null);

      try {
        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), 12000);

        const baseEndpoint =
          selectedSensorId && selectedSensorId !== 'all'
            ? `/api/sensors/${encodeURIComponent(selectedSensorId)}`
            : '/api/sensors';

        const endpoint = `${baseEndpoint}?limit=${getHistoryFetchLimit()}`;
        const resp = await fetch(endpoint, { signal: controller.signal, cache: 'no-store' });
        window.clearTimeout(timeoutId);
        if (!resp.ok) {
          throw new Error(`Failed to load sensor history (${resp.status})`);
        }

        const json = await resp.json();
        const normalized = Array.isArray(json) ? json : json ? [json] : [];

        if (!cancelled) {
          setSensorRecords(normalized);
        }
      } catch (err: any) {
        if (!cancelled) {
          if (err?.name === 'AbortError') {
            setHistoryError('Loading timed out. Try selecting a smaller range or specific sensor.');
          } else {
            setHistoryError(err?.message || 'Failed to load sensor history');
          }
          setSensorRecords([]);
        }
      } finally {
        if (!cancelled) {
          setHistoryLoading(false);
        }
      }
    }

    loadHistory();
    return () => {
      cancelled = true;
    };
  }, [selectedSensorId]);

  const getCustomPoints = () => {
    if (!customStartDate || !customEndDate) return 7;

    const start = new Date(customStartDate);
    const end = new Date(customEndDate);
    const dayDiff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    if (Number.isNaN(dayDiff) || dayDiff < 1) return 7;
    return Math.min(dayDiff, 90);
  };

  const rangeLabelByKey = {
    '24h': 'Last 24 Hours',
    '7d': 'Last 7 Days',
    '20d': 'Last 20 Days',
    '3m': 'Last 3 Months',
    all: 'All time',
    custom: 'Custom Range'
  } as const;

  const currentRangeLabel = rangeLabelByKey[timeRange as keyof typeof rangeLabelByKey] || rangeLabelByKey['7d'];

  const parsedRecords = useMemo(
    () =>
      sensorRecords
        .map((rec) => ({
          _id: rec._id,
          sensorId: rec.sensorId,
          recordedAt: new Date(rec.timestamp),
          humidity: rec.readings?.humidity ?? rec.humidity ?? null,
          soil: rec.readings?.soil ?? rec.soil ?? null,
          light: rec.readings?.lux ?? rec.readings?.light ?? rec.lux ?? null,
          airppm: rec.readings?.airppm ?? rec.airppm ?? null,
          temp: rec.readings?.temperature ?? rec.temperature ?? null,
          fan: rec.readings?.fan ?? rec.fan ?? null,
          buzzer: rec.readings?.buzzer ?? rec.buzzer ?? null
        }))
        .filter((row) => Number.isFinite(row.recordedAt.getTime()))
        .sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime()),
    [sensorRecords]
  );

  const allSensorIds = useMemo(
    () => Array.from(new Set(parsedRecords.map((r) => r.sensorId).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [parsedRecords]
  );

  const getRangeStartDate = () => {
    const now = new Date();
    if (timeRange === '24h') return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    if (timeRange === '7d') return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    if (timeRange === '20d') return new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000);
    if (timeRange === '3m') return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    if (timeRange === 'all') return new Date(0);
    if (timeRange === 'custom') {
      const start = customStartDate ? new Date(customStartDate) : null;
      const end = customEndDate ? new Date(customEndDate) : null;
      if (start && !Number.isNaN(start.getTime())) return start;
      if (end && !Number.isNaN(end.getTime())) {
        return new Date(end.getTime() - Math.max(1, getCustomPoints()) * 24 * 60 * 60 * 1000);
      }
    }
    return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  };

  const getRangeEndDate = () => {
    if (timeRange !== 'custom' || !customEndDate) return null;
    const end = new Date(customEndDate);
    if (Number.isNaN(end.getTime())) return null;
    return end;
  };

  const rangeStart = getRangeStartDate();
  const rangeEnd = getRangeEndDate();

  const rangeFilteredRows = useMemo(
    () =>
      parsedRecords.filter((row) => {
        if (row.recordedAt < rangeStart) return false;
        if (rangeEnd && row.recordedAt > rangeEnd) return false;
        return true;
      }),
    [parsedRecords, rangeStart, rangeEnd]
  );

  const formatHistoryDate = (dateInput: Date) => {
    return dateInput.toLocaleDateString('en-GB', { timeZone: 'UTC' });
  };

  const formatHistoryTime = (dateInput: Date) => {
    return dateInput.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      timeZone: 'UTC'
    });
  };

  const indexedRangeRows = useMemo(
    () =>
      rangeFilteredRows.map((row) => {
        const dateText = formatHistoryDate(row.recordedAt);
        const timeText = formatHistoryTime(row.recordedAt);
        const searchText = [
          row.sensorId,
          dateText,
          timeText,
          `${row.humidity ?? ''}`,
          `${row.soil ?? ''}`,
          `${row.light ?? ''}`,
          `${row.temp ?? ''}`,
          `${row.airppm ?? ''}`,
          `${row.fan ?? ''}`,
          `${row.buzzer ?? ''}`
        ]
          .join(' ')
          .toLowerCase();

        return { row, searchText };
      }),
    [rangeFilteredRows]
  );

  const filteredSensorHistoryRows = useMemo(() => {
    const normalizedSearch = deferredTableSearch.trim().toLowerCase();

    return indexedRangeRows
      .filter(({ searchText }) => {
        const matchesSearch = !normalizedSearch || searchText.includes(normalizedSearch);
        return matchesSearch;
      })
      .map((entry) => entry.row);
  }, [indexedRangeRows, deferredTableSearch]);

  const downloadFilteredHistoryAsCsv = () => {
    if (!filteredSensorHistoryRows.length) return;

    const csvEscape = (value: string | number | null | undefined) => {
      const raw = value == null ? '' : String(value);
      return `"${raw.replace(/"/g, '""')}"`;
    };

    const headers = ['Sensor ID', 'Date', 'Time (UTC)', 'Humidity', 'Soil Moisture', 'Light (lux)', 'Temperature', 'Air (PPM)'];
    const rows = filteredSensorHistoryRows.map((row) => [
      row.sensorId,
      formatHistoryDate(row.recordedAt),
      formatHistoryTime(row.recordedAt),
      row.humidity ?? '',
      row.soil ?? '',
      row.light ?? '',
      row.temp ?? '',
      row.airppm ?? ''
    ]);

    const csvContent = [headers, ...rows].map((line) => line.map((col) => csvEscape(col)).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    anchor.href = url;
    anchor.download = `history-filtered-${timestamp}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const calcStats = (values: Array<number | null>) => {
    const numeric = values.filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
    if (numeric.length === 0) return null;
    const sum = numeric.reduce((acc, v) => acc + v, 0);
    const min = Math.min(...numeric);
    const max = Math.max(...numeric);
    return { avg: sum / numeric.length, min, max };
  };

  const tempStats = useMemo(() => calcStats(rangeFilteredRows.map((r) => r.temp)), [rangeFilteredRows]);
  const humidityStats = useMemo(() => calcStats(rangeFilteredRows.map((r) => r.humidity)), [rangeFilteredRows]);
  const soilStats = useMemo(() => calcStats(rangeFilteredRows.map((r) => r.soil)), [rangeFilteredRows]);
  const lightStats = useMemo(() => calcStats(rangeFilteredRows.map((r) => r.light)), [rangeFilteredRows]);
  const airppmStats = useMemo(() => calcStats(rangeFilteredRows.map((r) => r.airppm)), [rangeFilteredRows]);

  const toProgress = (value: number | null | undefined, max: number) => {
    if (typeof value !== 'number' || !Number.isFinite(value) || max <= 0) return null;
    return Math.max(0, Math.min(100, Math.round((value / max) * 100)));
  };

  const latestBySensorId = useMemo(() => {
    const map = new Map<string, (typeof parsedRecords)[number]>();
    for (const row of parsedRecords) {
      if (!map.has(row.sensorId)) {
        map.set(row.sensorId, row);
      }
    }
    return map;
  }, [parsedRecords]);

  const currentTrendData = useMemo(() => {
    const rowsAsc = [...rangeFilteredRows].sort((a, b) => a.recordedAt.getTime() - b.recordedAt.getTime());
    const buckets = new Map<
      string,
      {
        label: string;
        temp: number[];
        humidity: number[];
        soil: number[];
        light: number[];
        airppm: number[];
      }
    >();

    const useHourly = timeRange === '24h';
    for (const row of rowsAsc) {
      const d = row.recordedAt;
      const key = useHourly
        ? `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}-${d.getUTCHours()}`
        : `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
      const label = useHourly
        ? d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'UTC' })
        : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', timeZone: 'UTC' });

      if (!buckets.has(key)) {
        buckets.set(key, { label, temp: [], humidity: [], soil: [], light: [], airppm: [] });
      }
      const bucket = buckets.get(key)!;

      if (typeof row.temp === 'number') bucket.temp.push(row.temp);
      if (typeof row.humidity === 'number') bucket.humidity.push(row.humidity);
      if (typeof row.soil === 'number') bucket.soil.push(row.soil);
      if (typeof row.light === 'number') bucket.light.push(row.light);
      if (typeof row.airppm === 'number') bucket.airppm.push(row.airppm);
    }

    const asArray = Array.from(buckets.values()).map((b) => {
      const avg = (nums: number[]) => (nums.length ? nums.reduce((a, v) => a + v, 0) / nums.length : null);
      return {
        label: b.label,
        temp: avg(b.temp),
        humidity: avg(b.humidity),
        soil: avg(b.soil),
        light: avg(b.light),
        airppm: avg(b.airppm)
      };
    });

    const maxPoints = useHourly ? 24 : 30;
    return asArray.slice(Math.max(0, asArray.length - maxPoints));
  }, [rangeFilteredRows, timeRange]);
  const visibleSensorHistoryRows = filteredSensorHistoryRows.slice(0, 200);

  const metricCards = [
    {
      id: 'temp',
      title: 'Average Temperature',
      icon: Thermometer,
      tone: 'red' as const,
      value: tempStats ? `${tempStats.avg.toFixed(1)}°C` : '--',
      range: tempStats ? `${tempStats.min.toFixed(1)}°C - ${tempStats.max.toFixed(1)}°C` : '--',
      progress: toProgress(tempStats?.avg ?? null, 50)
    },
    {
      id: 'humidity',
      title: 'Average Humidity',
      icon: Droplets,
      tone: 'blue' as const,
      value: humidityStats ? `${Math.round(humidityStats.avg)}%` : '--',
      range: humidityStats ? `${Math.round(humidityStats.min)}% - ${Math.round(humidityStats.max)}%` : '--',
      progress: toProgress(humidityStats?.avg ?? null, 100)
    },
    {
      id: 'soil',
      title: 'Average Soil Moisture',
      icon: Sprout,
      tone: 'emerald' as const,
      value: soilStats ? `${Math.round(soilStats.avg)}%` : '--',
      range: soilStats ? `${Math.round(soilStats.min)}% - ${Math.round(soilStats.max)}%` : '--',
      progress: soilStats ? Math.max(0, Math.min(100, Math.round(soilStats.avg))) : null
    },
    {
      id: 'light',
      title: 'Average Light Intensity',
      icon: Sun,
      tone: 'amber' as const,
      value: lightStats ? `${Math.round(lightStats.avg).toLocaleString()}` : '--',
      range: lightStats ? `${Math.round(lightStats.min).toLocaleString()} - ${Math.round(lightStats.max).toLocaleString()} lux` : '--',
      progress: toProgress(lightStats?.avg ?? null, 20000)
    },
    {
      id: 'airppm',
      title: 'Average Air (PPM)',
      icon: Wind,
      tone: 'violet' as const,
      value: airppmStats ? `${Math.round(airppmStats.avg).toLocaleString()}` : '--',
      range: airppmStats ? `${Math.round(airppmStats.min).toLocaleString()} - ${Math.round(airppmStats.max).toLocaleString()} ppm` : '--',
      progress: toProgress(airppmStats?.avg ?? null, 2000),
      hidden: !airppmStats
    }
  ].filter((c) => !(c as any).hidden);

  const chartDefs = [
    { key: 'temp', title: 'Temperature Sensor Trends', color: '#ef4444', name: 'Temperature (°C)' },
    { key: 'humidity', title: 'Humidity Sensor Trends', color: '#3b82f6', name: 'Humidity (%)' },
    { key: 'soil', title: 'Soil Moisture Sensor Trends', color: '#22c55e', name: 'Soil Moisture (%)' },
    { key: 'light', title: 'Light Intensity Sensor Trends', color: '#f59e0b', name: 'Light Intensity (lux)' },
    ...(airppmStats ? [{ key: 'airppm', title: 'Air Sensor Trends', color: '#7c3aed', name: 'Air (PPM)' }] : [])
  ] as const;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Historical Sensor Data</h2>
          <p className="text-sm text-gray-500 mt-1">View and analyze historical sensor readings and trends</p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedSensorId}
            onChange={(e) => setSelectedSensorId(e.target.value)}
            className="px-3 py-2.5 border border-gray-200 rounded-md text-lg bg-white"
            title="Sensor ID"
          >
            <option value="all">All sensors</option>
            {allSensorIds.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>

          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2.5 border border-gray-200 rounded-md text-lg bg-white"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="20d">Last 20 Days</option>
            <option value="3m">Last 3 Months</option>
            <option value="all">All time</option>
            <option value="custom">Custom Range</option>
          </select>

          {timeRange === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="datetime-local"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-2.5 border border-gray-200 rounded-md text-lg bg-white"
              />
              <span className="text-lg text-gray-500">to</span>
              <input
                type="datetime-local"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-2.5 border border-gray-200 rounded-md text-lg bg-white"
              />
            </div>
          )}
        </div>
      </div>

      {selectedSensorId === 'all' ? (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Latest reading per sensor</h3>
              <p className="text-sm text-gray-500">Based on the newest record for each sensor ID</p>
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
                    <p className="text-xs text-gray-500 mt-1">
                      {formatHistoryDate(row.recordedAt)} {formatHistoryTime(row.recordedAt)} (UTC)
                    </p>
                  </div>
                  <button
                    type="button"
                    className="shrink-0 rounded-lg bg-white border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-100"
                    onClick={() => setSelectedSensorId(sensorId)}
                  >
                    View
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-md bg-white border border-gray-200 p-2">
                    <p className="text-xs text-gray-500">Temp</p>
                    <p className="font-semibold text-gray-900">{row.temp ?? '--'}{typeof row.temp === 'number' ? '°C' : ''}</p>
                  </div>
                  <div className="rounded-md bg-white border border-gray-200 p-2">
                    <p className="text-xs text-gray-500">Humidity</p>
                    <p className="font-semibold text-gray-900">{row.humidity ?? '--'}{typeof row.humidity === 'number' ? '%' : ''}</p>
                  </div>
                  <div className="rounded-md bg-white border border-gray-200 p-2">
                    <p className="text-xs text-gray-500">Soil</p>
                    <p className="font-semibold text-gray-900">{row.soil ?? '--'}{typeof row.soil === 'number' ? '%' : ''}</p>
                  </div>
                  <div className="rounded-md bg-white border border-gray-200 p-2">
                    <p className="text-xs text-gray-500">Light</p>
                    <p className="font-semibold text-gray-900">{typeof row.light === 'number' ? row.light.toLocaleString() : '--'}</p>
                  </div>
                  <div className="rounded-md bg-white border border-gray-200 p-2 col-span-2">
                    <p className="text-xs text-gray-500">Air</p>
                    <p className="font-semibold text-gray-900">{row.airppm ?? '--'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-4">
          {metricCards.map((card) => {
            const Icon = card.icon;
            const toneStyles =
              card.tone === 'red'
                ? 'bg-red-50 border-red-200'
                : card.tone === 'blue'
                ? 'bg-blue-50 border-blue-200'
                : card.tone === 'emerald'
                ? 'bg-emerald-50 border-emerald-200'
                : card.tone === 'amber'
                ? 'bg-amber-50 border-amber-200'
                : card.tone === 'violet'
                ? 'bg-violet-50 border-violet-200'
                : 'bg-slate-50 border-slate-200';

            const iconStyles =
              card.tone === 'red'
                ? 'bg-red-100 text-red-600'
                : card.tone === 'blue'
                ? 'bg-blue-100 text-blue-600'
                : card.tone === 'emerald'
                ? 'bg-emerald-100 text-emerald-600'
                : card.tone === 'amber'
                ? 'bg-amber-100 text-amber-600'
                : card.tone === 'violet'
                ? 'bg-violet-100 text-violet-700'
                : 'bg-slate-100 text-slate-700';

            const progressTrackStyles =
              card.tone === 'red'
                ? 'bg-red-100'
                : card.tone === 'blue'
                ? 'bg-blue-100'
                : card.tone === 'emerald'
                ? 'bg-emerald-100'
                : card.tone === 'amber'
                ? 'bg-amber-100'
                : card.tone === 'violet'
                ? 'bg-violet-100'
                : 'bg-slate-200';

            const progressFillStyles =
              card.tone === 'red'
                ? 'bg-red-500'
                : card.tone === 'blue'
                ? 'bg-blue-500'
                : card.tone === 'emerald'
                ? 'bg-emerald-500'
                : card.tone === 'amber'
                ? 'bg-amber-500'
                : card.tone === 'violet'
                ? 'bg-violet-500'
                : 'bg-slate-500';

            return (
              <div key={card.id} className={`col-span-12 sm:col-span-6 xl:col-span-4 rounded-lg border p-3 ${toneStyles}`}>
                <div className="flex items-center gap-2.5">
                  <div className={`p-1.5 rounded-md ${iconStyles}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-lg text-gray-600">{card.title}</p>
                    <p className="text-4xl font-bold text-gray-900">{card.value}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-2">Range: {card.range}</p>
                {typeof (card as any).progress === 'number' ? (
                  <div className={`w-full h-1.5 rounded-full mt-2 overflow-hidden ${progressTrackStyles}`}>
                    <div className={`h-full rounded-full ${progressFillStyles}`} style={{ width: `${(card as any).progress}%` }} />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {historyLoading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-base text-gray-600">Loading sensor history...</p>
        </div>
      ) : historyError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm">
          <p className="text-base font-semibold text-red-800">Failed to load history</p>
          <p className="text-sm text-red-700 mt-1">{historyError}</p>
          <p className="text-sm text-red-700 mt-2">Make sure the backend is running on port 5000 and exposes GET /api/sensors.</p>
        </div>
      ) : rangeFilteredRows.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-base font-semibold text-gray-800">No sensor records found for this range.</p>
          <p className="text-sm text-gray-600 mt-1">Try selecting All sensors or a larger time range.</p>
        </div>
      ) : null}

      <div className="grid grid-cols-12 gap-4">
        {chartDefs.map((chart) => (
          <div key={chart.key} className="col-span-12 lg:col-span-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              {currentRangeLabel} {chart.title}
            </h3>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={currentTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="label" stroke="#6b7280" style={{ fontSize: '10px' }} />
                  <YAxis stroke="#6b7280" style={{ fontSize: '10px' }} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey={chart.key as any}
                    stroke={chart.color}
                    strokeWidth={2}
                    name={chart.name}
                    dot={false}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}

        <div className="col-span-12 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xl font-semibold text-gray-900">Sensor Data History</h3>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search"
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  className="pl-8 pr-3 py-2 border border-gray-200 rounded-md text-lg bg-gray-50"
                />
              </div>
              <button
                type="button"
                onClick={downloadFilteredHistoryAsCsv}
                disabled={filteredSensorHistoryRows.length === 0}
                className="px-4 py-2 border border-gray-200 rounded-md text-lg bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          </div>

          <div className="max-h-[220px] overflow-auto">
            <table className="w-full text-base">
              <thead>
                <tr className="border-b border-gray-200 text-gray-700">
                  <th className="text-left py-3 px-3 font-semibold">Sensor ID</th>
                  <th className="text-left py-3 px-3 font-semibold">Date</th>
                  <th className="text-left py-3 px-3 font-semibold">Time</th>
                  <th className="text-left py-3 px-3 font-semibold">Humidity</th>
                  <th className="text-left py-3 px-3 font-semibold">Soil Moisture</th>
                  <th className="text-left py-3 px-3 font-semibold">Light(lux)</th>
                  <th className="text-left py-3 px-3 font-semibold">Temperature</th>
                  <th className="text-left py-3 px-3 font-semibold">Air (PPM)</th>
                </tr>
              </thead>
              <tbody>
                {visibleSensorHistoryRows.map((row) => (
                  <tr key={row._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-3 text-gray-700 font-medium">{row.sensorId}</td>
                    <td className="py-3 px-3 text-gray-700">{formatHistoryDate(row.recordedAt)}</td>
                    <td className="py-3 px-3 text-gray-700">{formatHistoryTime(row.recordedAt)}</td>
                    <td className="py-3 px-3 text-gray-700">
                      <div className="flex items-center gap-2">
                        <Droplets className="w-4 h-4 text-blue-500" />
                        {row.humidity ?? '--'}{typeof row.humidity === 'number' ? '%' : ''}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-gray-700">
                      <div className="flex items-center gap-2">
                        <Sprout className="w-4 h-4 text-emerald-500" />
                        {row.soil ?? '--'}{typeof row.soil === 'number' ? '%' : ''}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-gray-700">
                      <div className="flex items-center gap-2">
                        <Sun className="w-4 h-4 text-amber-500" />
                        {typeof row.light === 'number' ? row.light.toLocaleString() : '--'}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-gray-700">
                      <div className="flex items-center gap-2">
                        <Thermometer className="w-4 h-4 text-red-500" />
                        {row.temp ?? '--'}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-gray-700">
                      <div className="flex items-center gap-2">
                        <Wind className="w-4 h-4 text-violet-500" />
                        {row.airppm ?? '--'}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredSensorHistoryRows.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-sm text-gray-500">
                      No records match this custom filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {filteredSensorHistoryRows.length > visibleSensorHistoryRows.length && (
            <p className="mt-2 text-xs text-gray-500">
              Showing first {visibleSensorHistoryRows.length} rows out of {filteredSensorHistoryRows.length} matches. Narrow filters to view faster.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
