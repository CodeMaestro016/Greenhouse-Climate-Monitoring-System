const SensorData = require("../models/Sensor");

const parseLimit = (value, defaultLimit) => {
  if (value === undefined || value === null || value === "") {
    return defaultLimit;
  }

  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) {
    return defaultLimit;
  }

  // limit=0 means "no limit" for full-history views.
  if (n === 0) {
    return null;
  }

  return Math.min(Math.floor(n), 50000);
};

// Get all sensor data
const getAllSensorData = async (req, res) => {
  try {
    const limit = parseLimit(req.query.limit, 15000);
    const query = SensorData.find().sort({ timestamp: -1 });
    if (limit !== null) {
      query.limit(limit);
    }
    const data = await query;
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get latest reading
const getLatestSensorData = async (req, res) => {
  try {
    const data = await SensorData.findOne().sort({ timestamp: -1 });
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get data by sensorId
const getSensorDataById = async (req, res) => {
  try {
    const { sensorId } = req.params;
    const limit = parseLimit(req.query.limit, 15000);
    const query = SensorData.find({ sensorId }).sort({ timestamp: -1 });
    if (limit !== null) {
      query.limit(limit);
    }
    const data = await query;
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get dataset stats (count, oldest, newest)
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
        ? { count: result.count, oldest: result.oldest, newest: result.newest }
        : { count: 0, oldest: null, newest: null }
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllSensorData,
  getLatestSensorData,
  getSensorStats,
  getSensorDataById
};