// Load environment variables with explicit path
const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, ".env");
console.log("Looking for .env at:", envPath);
console.log(".env exists:", fs.existsSync(envPath));

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");

  envContent.split("\n").forEach((line) => {
    const [key, ...valueParts] = line.split("=");

    if (key && valueParts.length > 0) {
      const value = valueParts.join("=").trim();
      process.env[key.trim()] = value;
      console.log(`Loaded ${key}: ${value.substring(0, 10)}...`);
    }
  });
} else {
  console.log(".env file not found, using environment variables");
}

if (!process.env.OPENAI_API_KEY) {
  console.log("WARNING: OpenAI API key not found in environment variables");
} else {
  console.log("OpenAI API key loaded successfully");
}

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

// ✅ ADDED: watches only NEW sensor data inserted into MongoDB
const { watchSensorDataInserts } = require("./services/alertService");

const app = express();

app.use(express.json());

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || true
  })
);

// ✅ UPDATED:
// Connect MongoDB first, then start watching only NEW inserts.
// Existing old sensor data will NOT create alerts.
connectDB()
  .then(() => {
    console.log("MongoDB Connected");

    // ✅ This triggers alerts only when new sensor data is inserted
    watchSensorDataInserts();
  })
  .catch((error) => {
    console.error("Failed to initialize database:", error);
  });

app.use("/api/sensors", require("./routes/sensorRoutes"));
app.use("/api/analysis", require("./routes/analysisRoutes"));
app.use("/api/ai-assistant", require("./routes/aiAssistantRoutes"));
app.use("/api/forecast", require("./routes/forecastRoutes"));
app.use("/api/alerts", require("./routes/alertRoutes"));

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});