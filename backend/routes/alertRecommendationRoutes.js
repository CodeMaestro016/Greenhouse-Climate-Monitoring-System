const express = require("express");
const router = express.Router();
const {
  getAlertRecommendation,
  getMultipleRecommendations,
  getCurrentRecommendations
} = require("../controllers/alertRecommendationController");

// Get recommendation for specific alert
router.get("/:alertId", getAlertRecommendation);

// Get recommendations for multiple alerts
router.post("/multiple", getMultipleRecommendations);

// Get recommendations based on current sensor data
router.get("/current", getCurrentRecommendations);

module.exports = router;
