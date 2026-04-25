const express = require("express");
const router = express.Router();

const {
  getAlerts,
  getAlertById,
  getAlertStats,
  deleteOldAlerts
} = require("../controllers/alertController");

// Get all alerts
router.get("/", getAlerts);

// Get alert statistics
router.get("/stats", getAlertStats);

// Get single alert
router.get("/:id", getAlertById);

// Delete old alerts
router.delete("/cleanup", deleteOldAlerts);

module.exports = router;