const SensorData = require("../models/Sensor");
const { checkAndCreateAlerts } = require("./alertController");

const PRIMARY_COLLECTION = "sensorData";
const SECONDARY_COLLECTION = process.env.SECONDARY_SENSOR_COLLECTION;

const parseLimit = (value, defaultLimit) => {
  if (value === undefined || value === null || value === "") {
    return defaultLimit;
  }

  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) {
    return defaultLimit;
  }

  if (n === 0) {
    return null;
  }

  return Math.min(Math.floor(n), 50000);
};

const toPlainRecord = (record) => {
  if (!record) return null;
  return typeof record.toObject === "function"
    ? record.toObject({ versionKey: false, depopulate: true })
    : { ...record };
};

const parseTimestamp = (value) => {
  if (value instanceof Date) return value;
  if (typeof value === "number" && Number.isFinite(value)) {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  if (typeof value !== "string") return null;

  const direct = new Date(value);
  if (!Number.isNaN(direct.getTime())) return direct;

  const match = value.trim().match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
  );
  if (!match) return null;

  const [, first, second, year, hour = "0", minute = "0", sec = "0"] = match;
  const d = new Date(Date.UTC(+year, +second - 1, +first, +hour, +minute, +sec));
  return Number.isNaN(d.getTime()) ? null : d;
};

const normalizeRecord = (record) => {
  const raw = toPlainRecord(record);
  if (!raw) return null;

  const readings = raw.readings && typeof raw.readings === "object" ? raw.readings : {};
  const lux = readings.lux ?? readings.light ?? raw.lux ?? raw.light ?? null;
  const airppm =
    readings.airppm ??
    readings.mq135_raw ??
    raw.airppm ??
    raw.mq135_raw ??
    raw.airPPM ??
    null;

  const timestamp = parseTimestamp(raw.timestamp) ?? raw.timestamp;

  return {
    ...raw,
    timestamp,
    readings: {
      temperature: readings.temperature ?? raw.temperature ?? null,
      humidity: readings.humidity ?? raw.humidity ?? null,
      lux,
      light: readings.light ?? raw.light ?? lux,
      airppm,
      soil: readings.soil ?? raw.soil ?? null,
      fan: readings.fan ?? raw.fan ?? null,
      buzzer: readings.buzzer ?? raw.buzzer ?? null
    },
    temperature: raw.temperature ?? readings.temperature ?? null,
    humidity: raw.humidity ?? readings.humidity ?? null,
    lux,
    light: raw.light ?? readings.light ?? lux,
    airppm,
    soil: raw.soil ?? readings.soil ?? null,
    fan: raw.fan ?? readings.fan ?? null,
    buzzer: raw.buzzer ?? readings.buzzer ?? null
  };
};

const buildDateMatch = (query) => {
  const { startDate, endDate } = query;
  if (!startDate && !endDate) return {};

  const range = {};

  if (startDate) {
    const d = new Date(startDate);
    if (!Number.isNaN(d.getTime())) range.$gte = d;
  }

  if (endDate) {
    const d = new Date(endDate);
    if (!Number.isNaN(d.getTime())) range.$lte = d;
  }

  return Object.keys(range).length ? { timestamp: range } : {};
};

const fetchCollectionRecords = async (collectionName, match, limit) => {
  const collection = SensorData.db.collection(collectionName);
  let query = collection.find(match).sort({ timestamp: -1 });

  if (limit !== null) {
    query = query.limit(limit);
  }

  const records = await query.toArray();
  return records.map(normalizeRecord).filter(Boolean);
};

const fetchCombinedRecords = async (match, limit) => {
  const collections = [PRIMARY_COLLECTION];

  if (
    SECONDARY_COLLECTION &&
    typeof SECONDARY_COLLECTION === "string" &&
    SECONDARY_COLLECTION.trim() &&
    SECONDARY_COLLECTION.trim() !== PRIMARY_COLLECTION
  ) {
    collections.push(SECONDARY_COLLECTION.trim());
  }

  const datasets = await Promise.all(
    collections.map((collectionName) => fetchCollectionRecords(collectionName, match, limit))
  );

  const mergedRaw = datasets.flat();
  const dedupedById = new Map();

  for (const record of mergedRaw) {
    const key = record?._id
      ? String(record._id)
      : `${record?.sensorId ?? ""}-${record?.timestamp ?? ""}`;

    if (!dedupedById.has(key)) {
      dedupedById.set(key, record);
    }
  }

  const merged = Array.from(dedupedById.values()).sort((a, b) => {
    const aTime = new Date(a.timestamp).getTime();
    const bTime = new Date(b.timestamp).getTime();

    if (!Number.isFinite(aTime) && !Number.isFinite(bTime)) return 0;
    if (!Number.isFinite(aTime)) return 1;
    if (!Number.isFinite(bTime)) return -1;

    return bTime - aTime;
  });

  return limit === null ? merged : merged.slice(0, limit);
};

// Create new sensor data + create alerts
const createSensorData = async (req, res) => {
  try {
    const newSensorData = await SensorData.create(req.body);

    const alerts = await checkAndCreateAlerts(newSensorData.toObject());

    res.status(201).json({
      success: true,
      message: "Sensor data saved successfully",
      data: newSensorData,
      alertsCreated: alerts.length,
      alerts
    });
  } catch (error) {
    console.error("Error creating sensor data:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get all sensor data
const getAllSensorData = async (req, res) => {
  try {
    const limit = parseLimit(req.query.limit, 5000);
    const dateMatch = buildDateMatch(req.query);
    const data = await fetchCombinedRecords(dateMatch, limit);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get latest reading
const getLatestSensorData = async (req, res) => {
  try {
    const [latest] = await fetchCombinedRecords({}, 1);
    res.json(latest ?? null);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get data by sensorId
const getSensorDataById = async (req, res) => {
  try {
    const { sensorId } = req.params;
    const limit = parseLimit(req.query.limit, 5000);
    const dateMatch = buildDateMatch(req.query);
    const data = await fetchCombinedRecords({ sensorId, ...dateMatch }, limit);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get dataset stats
const getSensorStats = async (req, res) => {
  try {
    const match = {};

    if (req.query.sensorId) {
      match.sensorId = String(req.query.sensorId);
    }

    const [result] = await SensorData.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          oldest: { $min: "$timestamp" },
          newest: { $max: "$timestamp" }
        }
      }
    ]);

    res.json(
      result
        ? {
            count: result.count,
            oldest: result.oldest,
            newest: result.newest
          }
        : {
            count: 0,
            oldest: null,
            newest: null
          }
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createSensorData,
  getAllSensorData,
  getLatestSensorData,
  getSensorStats,
  getSensorDataById
};