const SensorData = require("../models/Sensor");
const weatherService = require("../services/weatherService");
const forecastEngine = require("../services/forecastEngine");

const getOneHourForecast = async (req, res) => {
  try {
    const { sensorId, lat, lon } = req.query;

    if (!sensorId) {
      return res.status(400).json({ message: "sensorId is required" });
    }

    // Get recent sensor data as plain JS objects
    let sensorHistory = await SensorData.find({ sensorId })
      .sort({ timestamp: -1 })
      .limit(50)
      .lean();

    if (!sensorHistory || sensorHistory.length === 0) {
      return res.status(404).json({ message: "No sensor data found" });
    }

    sensorHistory = sensorHistory.reverse();
    const latestReading = sensorHistory[sensorHistory.length - 1];

    const getReading = (reading, field) => {
      if (!reading || !reading.readings) return null;

      // Map DB field "light" to forecast field "lux"
      if (field === "lux") {
        if (
          reading.readings.light !== undefined &&
          reading.readings.light !== null
        ) {
          return reading.readings.light;
        }

        if (
          reading.readings.lux !== undefined &&
          reading.readings.lux !== null
        ) {
          return reading.readings.lux;
        }

        return null;
      }

      const value = reading.readings[field];
      return value !== undefined && value !== null ? value : null;
    };

    // Current values
    const currentTemp = getReading(latestReading, "temperature");
    const currentHumidity = getReading(latestReading, "humidity");
    const currentSoil = getReading(latestReading, "soil");
    const currentAir = getReading(latestReading, "airppm");
    const currentLight = getReading(latestReading, "lux");

    // History arrays
    const tempHistory = sensorHistory
      .map((r) => r?.readings?.temperature)
      .filter((v) => v !== null && v !== undefined);

    const humidityHistory = sensorHistory
      .map((r) => r?.readings?.humidity)
      .filter((v) => v !== null && v !== undefined);

    const lightHistory = sensorHistory
      .map((r) => {
        if (!r?.readings) return null;

        if (r.readings.light !== undefined && r.readings.light !== null) {
          return r.readings.light;
        }

        if (r.readings.lux !== undefined && r.readings.lux !== null) {
          return r.readings.lux;
        }

        return null;
      })
      .filter((v) => v !== null && v !== undefined);

    const soilHistory = sensorHistory
      .map((r) => r?.readings?.soil)
      .filter((v) => v !== null && v !== undefined);

    const airHistory = sensorHistory
      .map((r) => r?.readings?.airppm)
      .filter((v) => v !== null && v !== undefined);

    // Weather data
    let currentWeather = null;
    let weatherForecast = null;

    if (lat && lon) {
      try {
        currentWeather = await weatherService.getCurrentWeather(lat, lon);
        weatherForecast = await weatherService.getWeatherForecast(lat, lon, 1);
      } catch (weatherError) {
        // Continue without weather data
      }
    }

    // Predictions
    const temperature = forecastEngine.predictTemperature(
      currentTemp,
      tempHistory,
      currentWeather,
      weatherForecast
    );

    const humidity = forecastEngine.predictHumidity(
      currentHumidity,
      humidityHistory,
      currentWeather,
      weatherForecast
    );

    const light = forecastEngine.predictLight(
      currentLight,
      lightHistory,
      currentWeather,
      weatherForecast
    );

    const soil = forecastEngine.predictSoilMoisture(
      currentSoil,
      soilHistory,
      currentWeather
    );

    const air = forecastEngine.predictAirQuality(
      currentAir,
      airHistory,
      currentWeather
    );

    const getOverallOutlook = () => {
      const predictions = [temperature, humidity, light, soil, air];
      const changingCount = predictions.filter(
        (p) => p && p.trend !== "stable"
      ).length;

      if (changingCount <= 1) {
        return "Conditions are expected to remain stable and safe for plants in the next 1 hour.";
      } else if (changingCount <= 3) {
        return "Some parameters are changing. Monitor conditions closely in the next hour.";
      } else {
        return "Multiple parameters are fluctuating. Consider taking preventive action.";
      }
    };

    const getActionNeeded = () => {
      const predictions = [temperature, humidity, light, soil, air];
      const changingCount = predictions.filter(
        (p) => p && p.trend !== "stable"
      ).length;

      if (changingCount <= 1) return "No Action Needed";
      if (changingCount <= 3) return "Monitor Closely";
      return "Action Recommended";
    };

    const responseData = {
      timestamp: new Date(),
      location: lat && lon ? { lat, lon } : null,
      weatherUsed: !!(currentWeather && weatherForecast),
      forecasts: {
        temperature,
        humidity,
        lux: light,
        soil,
        air,
      },
      overallOutlook: getOverallOutlook(),
      actionNeeded: getActionNeeded(),
    };

    return res.json(responseData);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { getOneHourForecast };