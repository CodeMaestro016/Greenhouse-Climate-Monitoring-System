const express = require("express");
const router = express.Router();

const {
  getTrendAnalysis,
  getCorrelationAnalysis,
  getMLAnomalyAnalysis
} = require("../controllers/analysisController");

router.get("/trends/:sensorId", getTrendAnalysis);
router.get("/correlation/:sensorId", getCorrelationAnalysis);
router.get("/ml-anomalies/:sensorId", getMLAnomalyAnalysis);

module.exports = router;