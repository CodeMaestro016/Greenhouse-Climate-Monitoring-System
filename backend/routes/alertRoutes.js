const express = require("express");
const router = express.Router();

const {
  getAlerts,
  getAlertById,
  getAlertStats,
  deleteOldAlerts,
  deleteAllAlerts 
} = require("../controllers/alertController");

// Get all alerts
router.get("/", getAlerts);

// Get alert statistics
router.get("/stats", getAlertStats);

// Get single alert
router.get("/:id", getAlertById);

// Delete old alerts
router.delete("/cleanup", deleteOldAlerts);

// ✅ NEW: Clear all alerts
router.delete("/clear", deleteAllAlerts);

module.exports = router;