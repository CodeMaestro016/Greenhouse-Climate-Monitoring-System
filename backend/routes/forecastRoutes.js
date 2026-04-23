const express = require("express");
const router = express.Router();
const { getOneHourForecast } = require("../controllers/forecastController");

router.get("/1hour", getOneHourForecast);

module.exports = router;