const SensorData = require("../models/Sensor");

// Get all sensor data
const getAllSensorData = async (req, res) => {
  try {
    const data = await SensorData.find().sort({ timestamp: -1 }).limit(100);
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
    const data = await SensorData.find({ sensorId }).sort({ timestamp: -1 }).limit(100);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllSensorData,
  getLatestSensorData,
  getSensorDataById
};