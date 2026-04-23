const SensorData = require("../models/Sensor");
const { spawn } = require("child_process");
const path = require("path");

// Moving average helper
function calculateMovingAverage(data, windowSize = 5) {
  const result = [];

  for (let i = windowSize - 1; i < data.length; i++) {
    const window = data.slice(i - windowSize + 1, i + 1);
    const avg =
      window.reduce((sum, item) => sum + item.value, 0) / window.length;

    result.push({
      timestamp: data[i].timestamp,
      value: Number(avg.toFixed(2))
    });
  }

  return result;
}

// Simple linear regression slope helper
function calculateSlope(data) {
  const n = data.length;
  if (n < 2) return 0;

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (let i = 0; i < n; i++) {
    const x = i;
    const y = data[i].value;

    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  }

  const numerator = n * sumXY - sumX * sumY;
  const denominator = n * sumXX - sumX * sumX;

  if (denominator === 0) return 0;

  return numerator / denominator;
}

function getTrendLabel(slope) {
  if (slope > 0.05) return "increasing";
  if (slope < -0.05) return "decreasing";
  return "stable";
}

const getTrendAnalysis = async (req, res) => {
  try {
    const { sensorId } = req.params;
    const { field = "temperature", limit = 100 } = req.query;

    const allowedFields = [
      "temperature",
      "humidity",
      "light",
      "mq135_raw",
      "airppm",
      "soil"
    ];

    if (!allowedFields.includes(field)) {
      return res.status(400).json({
        message: "Invalid field name"
      });
    }

    const docs = await SensorData.find({ sensorId })
      .sort({ timestamp: 1 })
      .limit(Number(limit));

    const data = docs
      .map((doc) => ({
        timestamp: doc.timestamp,
        value: doc.readings?.[field]
      }))
      .filter((item) => item.value !== undefined && item.value !== null);

    if (data.length === 0) {
      return res.status(404).json({
        message: "No data found for trend analysis"
      });
    }

    const movingAverage = calculateMovingAverage(data, 5);
    const slope = calculateSlope(data);
    const trend = getTrendLabel(slope);

    const averageValue =
      data.reduce((sum, item) => sum + item.value, 0) / data.length;

    const latestValue = data[data.length - 1].value;

    res.json({
      sensorId,
      field,
      count: data.length,
      trend,
      slope: Number(slope.toFixed(4)),
      latestValue,
      averageValue: Number(averageValue.toFixed(2)),
      data,
      movingAverage
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

const getCorrelationAnalysis = async (req, res) => {
  try {
    const { sensorId } = req.params;
    const {
      field1 = "temperature",
      field2 = "humidity",
      limit = 100
    } = req.query;

    const allowedFields = [
      "temperature",
      "humidity",
      "light",
      "mq135_raw",
      "airppm",
      "soil"
    ];

    if (!allowedFields.includes(field1) || !allowedFields.includes(field2)) {
      return res.status(400).json({
        message: "Invalid field names"
      });
    }

    const docs = await SensorData.find({ sensorId })
      .sort({ timestamp: 1 })
      .limit(Number(limit));

    const data = docs
      .map((doc) => ({
        x: doc.readings?.[field1],
        y: doc.readings?.[field2]
      }))
      .filter(
        (item) =>
          item.x !== undefined &&
          item.y !== undefined &&
          item.x !== null &&
          item.y !== null
      );

    if (data.length < 2) {
      return res.status(404).json({
        message: "Not enough data for correlation"
      });
    }

    // Pearson Correlation
    const n = data.length;

    const sumX = data.reduce((sum, d) => sum + d.x, 0);
    const sumY = data.reduce((sum, d) => sum + d.y, 0);
    const sumXY = data.reduce((sum, d) => sum + d.x * d.y, 0);
    const sumX2 = data.reduce((sum, d) => sum + d.x * d.x, 0);
    const sumY2 = data.reduce((sum, d) => sum + d.y * d.y, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt(
      (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)
    );

    const correlation = denominator === 0 ? 0 : numerator / denominator;

    let interpretation = "No correlation";

    if (correlation > 0.7) {
      interpretation = "Strong positive correlation";
    } else if (correlation > 0.3) {
      interpretation = "Moderate positive correlation";
    } else if (correlation < -0.7) {
      interpretation = "Strong negative correlation";
    } else if (correlation < -0.3) {
      interpretation = "Moderate negative correlation";
    }

    res.json({
      sensorId,
      field1,
      field2,
      count: data.length,
      correlation: Number(correlation.toFixed(4)),
      interpretation,
      data
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};



const getMLAnomalyAnalysis = async (req, res) => {
  try {
    const { sensorId } = req.params;
    const { field = "temperature", limit = 100 } = req.query;

    const allowedFields = [
      "temperature",
      "humidity",
      "light",
      "mq135_raw",
      "airppm",
      "soil"
    ];

    if (!allowedFields.includes(field)) {
      return res.status(400).json({ message: "Invalid field name" });
    }

    const docs = await SensorData.find({ sensorId })
      .sort({ timestamp: 1 })
      .limit(Number(limit));

    const data = docs
      .map((doc) => ({
        timestamp: doc.timestamp,
        value: doc.readings?.[field]
      }))
      .filter((item) => item.value !== undefined && item.value !== null);

    if (data.length < 5) {
      return res.status(400).json({ message: "Not enough data" });
    }

    const values = data.map((item) => Number(item.value));

    const pythonScriptPath = path.join(__dirname, "../ml/anomaly_model.py");

    // Windows වල python වෙනුවට py safer
    const python = spawn("py", [pythonScriptPath]);

    let dataString = "";
    let errorString = "";
    let hasResponded = false;

    python.stdout.on("data", (chunk) => {
      dataString += chunk.toString();
    });

    python.stderr.on("data", (chunk) => {
      errorString += chunk.toString();
    });

    python.on("error", (error) => {
      if (hasResponded) return;
      hasResponded = true;

      return res.status(500).json({
        message: "Failed to start Python process",
        error: error.message
      });
    });

    python.stdin.write(JSON.stringify({ values }));
    python.stdin.end();

    python.on("close", (code) => {
      if (hasResponded) return;

      console.log("Python exit code:", code);
      console.log("Python stdout:", dataString);
      console.log("Python stderr:", errorString);

      if (code !== 0) {
        hasResponded = true;
        return res.status(500).json({
          message: "Python script execution failed",
          exitCode: code,
          error: errorString || "No stderr output"
        });
      }

      try {
        const result = JSON.parse(dataString);

        // Python side එකෙන් error JSON එකක් ආවොත්
        if (result.error) {
          hasResponded = true;
          return res.status(500).json({
            message: "Python model returned an error",
            error: result.error
          });
        }

        const mergedResults = result.map((item, index) => ({
          timestamp: data[index]?.timestamp,
          value: item.value,
          isAnomaly: item.isAnomaly
        }));

        const anomalies = mergedResults.filter((item) => item.isAnomaly);

        hasResponded = true;
        return res.json({
          sensorId,
          field,
          method: "Isolation Forest (ML)",
          count: mergedResults.length,
          anomalyCount: anomalies.length,
          results: mergedResults,
          anomalies
        });
      } catch (parseError) {
        hasResponded = true;
        return res.status(500).json({
          message: "Failed to parse Python output",
          error: parseError.message,
          rawOutput: dataString
        });
      }
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getTrendAnalysis,
  getCorrelationAnalysis,
  getMLAnomalyAnalysis
};