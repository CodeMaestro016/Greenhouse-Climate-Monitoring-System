const express = require("express");
const router = express.Router();
const {
  getAllSensorData,
  getLatestSensorData,
  getSensorDataById
} = require("../controllers/sensorController");

router.get("/", getAllSensorData);
router.get("/latest", getLatestSensorData);
router.get("/:sensorId", getSensorDataById);

module.exports = router;