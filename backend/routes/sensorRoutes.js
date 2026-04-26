const express = require("express");
const router = express.Router();

const {
  createSensorData,   // ✅ ADDED: used to save sensor data + trigger alerts
  getAllSensorData,
  getLatestSensorData,
  getSensorStats,
  getSensorDataById
} = require("../controllers/sensorController");

// When data comes → alert logic will run
router.post("/", createSensorData);

// Existing routes (no change)
router.get("/", getAllSensorData);
router.get("/stats", getSensorStats);
router.get("/latest", getLatestSensorData);
router.get("/:sensorId", getSensorDataById);

module.exports = router;