const SensorData = require("../models/Sensor");
const { spawn } = require("child_process");
const path = require("path");

const PRIMARY_COLLECTION   = "sensorData";
const SECONDARY_COLLECTION = process.env.SECONDARY_SENSOR_COLLECTION;

// Parse timestamps that may be Date objects or strings like "1/1/2025 0:20"
function parseTs(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  const d = new Date(value);
  if (!isNaN(d.getTime())) return d;
  const match = String(value).trim().match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
  );
  if (!match) return null;
  const [, day, month, year, h = "0", m = "0", s = "0"] = match;
  const result = new Date(Date.UTC(+year, +month - 1, +day, +h, +m, +s));
  return isNaN(result.getTime()) ? null : result;
}

// Query both primary and secondary collections and return merged docs sorted
// by timestamp ascending — mirrors the approach in sensorController.js
async function fetchDocsFromBothCollections(sensorId, limit) {
  const db = SensorData.db;
  const n  = Math.max(1, Number(limit) || 100);

  // Primary: Mongoose model collection — documents have nested readings
  const primaryDocs = await db.collection(PRIMARY_COLLECTION)
    .find({ sensorId })
    .sort({ timestamp: 1 })
    .limit(n)
    .toArray();

  // Secondary: raw collection — documents store values at top level
  let secondaryDocs = [];
  if (
    SECONDARY_COLLECTION &&
    typeof SECONDARY_COLLECTION === "string" &&
    SECONDARY_COLLECTION.trim() &&
    SECONDARY_COLLECTION.trim() !== PRIMARY_COLLECTION
  ) {
    secondaryDocs = await db.collection(SECONDARY_COLLECTION.trim())
      .find({ sensorId })
      .sort({ timestamp: 1 })
      .limit(n)
      .toArray();
  }

  // Deduplicate by _id then sort ascending by parsed timestamp
  const seen = new Map();
  for (const doc of [...primaryDocs, ...secondaryDocs]) {
    const key = doc._id ? String(doc._id) : `${doc.sensorId}-${doc.timestamp}`;
    if (!seen.has(key)) seen.set(key, doc);
  }

  return Array.from(seen.values())
    .sort((a, b) => {
      const ta = parseTs(a.timestamp);
      const tb = parseTs(b.timestamp);
      if (!ta && !tb) return 0;
      if (!ta) return 1;
      if (!tb) return -1;
      return ta - tb;
    })
    .slice(0, n);
}

const FIELD_ALIASES = {
  light: "lux",
  mq135_raw: "airppm"
};

const ALLOWED_FIELDS = [
  "temperature",
  "humidity",
  "light",
  "lux",
  "mq135_raw",
  "airppm",
  "soil"
];

function resolveFieldName(field) {
  return FIELD_ALIASES[field] || field;
}

function readFieldValue(doc, field) {
  const resolvedField = resolveFieldName(field);
    // 1. Try alias-resolved field in readings (e.g. readings.lux for 'light')
  const fromReadingsResolved = doc.readings?.[resolvedField];
  if (fromReadingsResolved !== undefined && fromReadingsResolved !== null) return fromReadingsResolved;
  // 2. Try original field name in readings (e.g. readings.light for 'light')
  const fromReadingsOriginal = doc.readings?.[field];
  if (fromReadingsOriginal !== undefined && fromReadingsOriginal !== null) return fromReadingsOriginal;
  // 3. Fall back to top-level fields (secondary collection stores values at root level)
  return doc[resolvedField] ?? doc[field] ?? null;
}

function detectAnomaliesWithZScore(values, zThreshold = 2.5) {
  const count = values.length;
  const mean = values.reduce((sum, value) => sum + value, 0) / count;
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / count;
  const stdDev = Math.sqrt(variance);

  if (!Number.isFinite(stdDev) || stdDev === 0) {
    return values.map((value) => ({ value, isAnomaly: false }));
  }

  return values.map((value) => {
    const zScore = Math.abs((value - mean) / stdDev);
    return {
      value,
      isAnomaly: zScore >= zThreshold
    };
  });
}

// Moving average helper
function calculateMovingAverage(data, windowSize = 5) {
  const result = [];

  for (let i = windowSize - 1; i < data.length; i++) {
    const window = data.slice(i - windowSize + 1, i + 1);
    const avg =
      window.reduce((sum, item) => sum + item.value, 0) / window.length;

    result.push({
      timestamp: data[i].timestamp,
      value: Number(avg.toFixed(2))
    });
  }

  return result;
}

// Simple linear regression slope helper
function calculateSlope(data) {
  const n = data.length;
  if (n < 2) return 0;

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (let i = 0; i < n; i++) {
    const x = i;
    const y = data[i].value;

    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  }

  const numerator = n * sumXY - sumX * sumY;
  const denominator = n * sumXX - sumX * sumX;

  if (denominator === 0) return 0;

  return numerator / denominator;
}

function getTrendLabel(slope) {
  if (slope > 0.05) return "increasing";
  if (slope < -0.05) return "decreasing";
  return "stable";
}

const getTrendAnalysis = async (req, res) => {
  try {
    const { sensorId } = req.params;
    const { field = "temperature", limit = 100 } = req.query;

    if (!ALLOWED_FIELDS.includes(field)) {
      return res.status(400).json({
        message: "Invalid field name"
      });
    }

    const docs = await fetchDocsFromBothCollections(sensorId, limit);


    const data = docs
      .map((doc) => ({
        timestamp: doc.timestamp,
        value: readFieldValue(doc, field)
      }))
      .filter((item) => item.value !== undefined && item.value !== null);

    if (data.length === 0) {
      return res.status(404).json({
        message: "No data found for trend analysis"
      });
    }

    const movingAverage = calculateMovingAverage(data, 5);
    const slope = calculateSlope(data);
    const trend = getTrendLabel(slope);

    const averageValue =
      data.reduce((sum, item) => sum + item.value, 0) / data.length;

    const latestValue = data[data.length - 1].value;

    res.json({
      sensorId,
      field,
      count: data.length,
      trend,
      slope: Number(slope.toFixed(4)),
      latestValue,
      averageValue: Number(averageValue.toFixed(2)),
      data,
      movingAverage
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

const getCorrelationAnalysis = async (req, res) => {
  try {
    const { sensorId } = req.params;
    const {
      field1 = "temperature",
      field2 = "humidity",
      limit = 100
    } = req.query;

    if (!ALLOWED_FIELDS.includes(field1) || !ALLOWED_FIELDS.includes(field2)) {
      return res.status(400).json({
        message: "Invalid field names"
      });
    }

    const docs = await fetchDocsFromBothCollections(sensorId, limit);

    const data = docs
      .map((doc) => ({
        x: readFieldValue(doc, field1),
        y: readFieldValue(doc, field2)
      }))
      .filter(
        (item) =>
          item.x !== undefined &&
          item.y !== undefined &&
          item.x !== null &&
          item.y !== null
      );

    if (data.length < 2) {
      return res.status(404).json({
        message: "Not enough data for correlation"
      });
    }

    // Pearson Correlation
    const n = data.length;

    const sumX = data.reduce((sum, d) => sum + d.x, 0);
    const sumY = data.reduce((sum, d) => sum + d.y, 0);
    const sumXY = data.reduce((sum, d) => sum + d.x * d.y, 0);
    const sumX2 = data.reduce((sum, d) => sum + d.x * d.x, 0);
    const sumY2 = data.reduce((sum, d) => sum + d.y * d.y, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt(
      (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)
    );

    const correlation = denominator === 0 ? 0 : numerator / denominator;

    let interpretation = "No correlation";

    if (correlation > 0.7) {
      interpretation = "Strong positive correlation";
    } else if (correlation > 0.3) {
      interpretation = "Moderate positive correlation";
    } else if (correlation < -0.7) {
      interpretation = "Strong negative correlation";
    } else if (correlation < -0.3) {
      interpretation = "Moderate negative correlation";
    }

    res.json({
      sensorId,
      field1,
      field2,
      count: data.length,
      correlation: Number(correlation.toFixed(4)),
      interpretation,
      data
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};



const getMLAnomalyAnalysis = async (req, res) => {
  try {
    const { sensorId } = req.params;
    const { field = "temperature", limit = 100 } = req.query;

    if (!ALLOWED_FIELDS.includes(field)) {
      return res.status(400).json({ message: "Invalid field name" });
    }

    const docs = await fetchDocsFromBothCollections(sensorId, limit);

    const data = docs
      .map((doc) => ({
        timestamp: doc.timestamp,
        value: readFieldValue(doc, field)
      }))
      .filter((item) => item.value !== undefined && item.value !== null);

    if (data.length < 5) {
      return res.status(400).json({ message: "Not enough data" });
    }

    const values = data.map((item) => Number(item.value));
    const toResponse = (resultRows, method, fallbackReason) => {
      const mergedResults = resultRows.map((item, index) => ({
        timestamp: data[index]?.timestamp,
        value: item.value,
        isAnomaly: item.isAnomaly
      }));

      const anomalies = mergedResults.filter((item) => item.isAnomaly);

      return {
        sensorId,
        field,
        method,
        count: mergedResults.length,
        anomalyCount: anomalies.length,
        results: mergedResults,
        anomalies,
        ...(fallbackReason ? { fallbackReason } : {})
      };
    };

    const pythonScriptPath = path.join(__dirname, "../ml/anomaly_model.py");

    // Windows වල python වෙනුවට py safer
    const python = spawn("py", [pythonScriptPath]);

    let dataString = "";
    let errorString = "";
    let hasResponded = false;

    python.stdout.on("data", (chunk) => {
      dataString += chunk.toString();
    });

    python.stderr.on("data", (chunk) => {
      errorString += chunk.toString();
    });

    python.on("error", (error) => {
      if (hasResponded) return;
      hasResponded = true;

      const fallback = detectAnomaliesWithZScore(values);
      return res.json(
        toResponse(
          fallback,
          "Z-Score (Fallback)",
          `Python process failed: ${error.message}`
        )
      );
    });

    python.stdin.write(JSON.stringify({ values }));
    python.stdin.end();

    python.on("close", (code) => {
      if (hasResponded) return;

      console.log("Python exit code:", code);
      console.log("Python stdout:", dataString);
      console.log("Python stderr:", errorString);

      if (code !== 0) {
        hasResponded = true;

        const fallback = detectAnomaliesWithZScore(values);
        return res.json(
          toResponse(
            fallback,
            "Z-Score (Fallback)",
            `Python script failed (exit ${code}): ${
              errorString || "No stderr output"
            }`
          )
        );
      }

      try {
        const result = JSON.parse(dataString);

        // Python side එකෙන් error JSON එකක් ආවොත්
        if (result.error) {
          hasResponded = true;
          return res.status(500).json({
            message: "Python model returned an error",
            error: result.error
          });
        }

        hasResponded = true;
        return res.json(toResponse(result, "Isolation Forest (ML)"));
      } catch (parseError) {
        hasResponded = true;

        const fallback = detectAnomaliesWithZScore(values);
        return res.json(
          toResponse(
            fallback,
            "Z-Score (Fallback)",
            `Failed to parse Python output: ${parseError.message}`
          )
        );
      }
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getTrendAnalysis,
  getCorrelationAnalysis,
  getMLAnomalyAnalysis
};