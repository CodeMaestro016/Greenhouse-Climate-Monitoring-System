require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || true
  })
);

connectDB();

app.use("/api/sensors", require("./routes/sensorRoutes"));
app.use("/api/analysis", require("./routes/analysisRoutes"));
app.use("/api/forecast", require("./routes/forecastRoutes"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});