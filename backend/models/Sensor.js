const mongoose = require("mongoose");

const sensorSchema = new mongoose.Schema(
  {
    sensorId: {
      type: String,
      required: true,
      index: true
    },
    timestamp: {
      type: Date,
      required: true,
      index: true
    },
    readings: {
      temperature: { type: Number },
      humidity: { type: Number },
      lux: { type: Number },
      airppm: { type: Number },
      soil: { type: Number },
      fan: { type: String },
      buzzer: { type: String }
    }
  },
  {
    versionKey: false
  }
);

module.exports = mongoose.model("SensorData", sensorSchema, "sensorData");