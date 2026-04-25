const Alert = require("../models/Alert");

// Safe ranges
const SAFE_RANGES = {
  temperature: { min: 18, max: 28, unit: "°C" },
  humidity: { min: 70, max: 80, unit: "%" },
  soil_moisture: { min: 60, max: 80, unit: "%" },
  soil: { min: 60, max: 80, unit: "%" },
  air: { min: 0, max: 300, unit: "ppm" },
  co2: { min: 0, max: 300, unit: "ppm" },
  light: { min: 5000, max: 10000, unit: "lux" }
};

// Field names
const getFieldName = (field) => {
  return {
    temperature: "Temperature",
    humidity: "Humidity",
    soil_moisture: "Soil Moisture",
    soil: "Soil Moisture",
    air: "Air Quality",
    co2: "Air Quality",
    light: "Light"
  }[field] || field;
};

// Normalize sensor fields
const normalizeFieldName = (field) => {
  const normalized = String(field).toLowerCase();

  switch (normalized) {
    case "lux":
      return "light";
    case "airppm":
      return "air";
    case "soil":
      return "soil_moisture";
    default:
      return normalized;
  }
};

// Severity logic
const getSeverity = (value, min, max) => {
  const range = max - min;

  // 10% near boundary = low warning
  const nearLimit = range * 0.1;

  // 20% outside boundary = critical
  const criticalLimit = range * 0.2;

  // Medium: exactly reaches boundary
  if (value === min || value === max) {
    return "medium";
  }

  // Low: inside safe range but close to min or max
  if (
    value > min &&
    value < max &&
    (value <= min + nearLimit || value >= max - nearLimit)
  ) {
    return "low";
  }

  // High: slightly outside range
  if (
    (value < min && value >= min - criticalLimit) ||
    (value > max && value <= max + criticalLimit)
  ) {
    return "high";
  }

  // Critical: far outside range
  if (value < min - criticalLimit || value > max + criticalLimit) {
    return "critical";
  }

  // Middle safe area: no alert
  return null;
};

// Alert content
const generateAlertContent = (field, value, min, max) => {
  const fieldName = getFieldName(field);
  const unit = SAFE_RANGES[field]?.unit || "";
  const severity = getSeverity(value, min, max);

  let title = "";
  let message = "";

  if (severity === "low") {
    title = `${fieldName} Near Limit`;
    message = `${fieldName} is ${value}${unit}. It is still safe, but near the limit (${min}-${max}${unit}). Keep monitoring.`;
  } else if (severity === "medium") {
    title = `${fieldName} Reached Limit`;
    message = `${fieldName} is ${value}${unit}. It has reached the safe boundary (${min}-${max}${unit}). Action may be needed soon.`;
  } else if (severity === "high") {
    title = `${fieldName} Outside Safe Range`;
    message = `${fieldName} is ${value}${unit}. It is outside the safe range (${min}-${max}${unit}). Action is needed.`;
  } else if (severity === "critical") {
    title = `${fieldName} Critical Alert`;
    message = `${fieldName} is ${value}${unit}. It is far outside the safe range (${min}-${max}${unit}). Immediate action is required.`;
  }

  return { title, message, severity };
};

// Create alert
const createAlert = async (sensorId, field, value, min, max) => {
  const { title, message, severity } = generateAlertContent(
    field,
    value,
    min,
    max
  );

  // If value is fully safe, do not create alert
  if (!severity) {
    return null;
  }

  const alert = new Alert({
    sensorId,
    timestamp: new Date(),
    field,
    value,
    min,
    max,
    severity,
    title,
    message
  });

  await alert.save();
  return alert;
};

// Check only NEW sensor data
const checkAndCreateAlerts = async (sensorData) => {
  const alerts = [];

  try {
    const dataEntries = [];

    if (sensorData && typeof sensorData === "object") {
      if (sensorData.readings && typeof sensorData.readings === "object") {
        dataEntries.push(...Object.entries(sensorData.readings));
      }

      dataEntries.push(
        ...Object.entries(sensorData).filter(
          ([field]) =>
            !["sensorId", "timestamp", "_id", "__v", "readings", "createdAt", "updatedAt"].includes(field)
        )
      );
    }

    for (const [field, rawValue] of dataEntries) {
      const normalizedField = normalizeFieldName(field);
      const value = Number(rawValue);

      if (!SAFE_RANGES[normalizedField] || !Number.isFinite(value)) {
        continue;
      }

      const { min, max } = SAFE_RANGES[normalizedField];

      const alert = await createAlert(
        sensorData.sensorId || "unknown",
        normalizedField,
        value,
        min,
        max
      );

      if (alert) {
        alerts.push(alert);
      }
    }

    return alerts;
  } catch (error) {
    console.error("Error checking alerts:", error);
    return alerts;
  }
};

// Get alerts
const getAlerts = async (req, res) => {
  try {
    const {
      severity,
      field,
      sensorId,
      startDate,
      endDate,
      limit = 100,
      page = 1,
      sort = "-createdAt"
    } = req.query;

    const query = {};

    if (severity) query.severity = severity;
    if (field) query.field = field;
    if (sensorId) query.sensorId = sensorId;

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const alerts = await Alert.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Alert.countDocuments(query);

    res.json({
      success: true,
      data: alerts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error("Error fetching alerts:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get single alert
const getAlertById = async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);

    if (!alert) {
      return res.status(404).json({
        success: false,
        error: "Alert not found"
      });
    }

    res.json({ success: true, data: alert });
  } catch (error) {
    console.error("Error fetching alert:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get alert stats
const getAlertStats = async (req, res) => {
  try {
    const stats = await Alert.aggregate([
      {
        $group: {
          _id: "$severity",
          count: { $sum: 1 }
        }
      }
    ]);

    const recentAlerts = await Alert.find()
      .sort("-createdAt")
      .limit(10);

    const totalAlerts = await Alert.countDocuments();

    const activeAlerts = await Alert.countDocuments({
      createdAt: {
        $gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
      }
    });

    res.json({
      success: true,
      data: {
        total: totalAlerts,
        active24h: activeAlerts,
        bySeverity: stats,
        recent: recentAlerts
      }
    });
  } catch (error) {
    console.error("Error fetching alert stats:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete old alerts
const deleteOldAlerts = async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));

    const result = await Alert.deleteMany({
      createdAt: { $lt: cutoffDate }
    });

    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} alerts older than ${days} days`
    });
  } catch (error) {
    console.error("Error deleting old alerts:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  createAlert,
  checkAndCreateAlerts,
  getAlerts,
  getAlertById,
  getAlertStats,
  deleteOldAlerts,
  SAFE_RANGES
};