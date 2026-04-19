const express = require("express");
const mongoose = require("mongoose");
const mqtt = require("mqtt");
require("dotenv").config();

const Sensor = require("./models/Sensor");

const app = express();

// MongoDB connect
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

// MQTT connect
const client = mqtt.connect("mqtt://broker.hivemq.com");

client.on("connect", () => {
  console.log("MQTT Connected");
  client.subscribe("greenhouse/data");
});

// receive data
client.on("message", async (topic, message) => {
  try {
    const data = JSON.parse(message.toString());

    const newData = new Sensor({
      temperature: data.temperature,
      humidity: data.humidity,
      lux: data.lux,
      airppm: data.airppm,
      soil: data.soil,
      fan: data.fan,
      buzzer: data.buzzer
    });

    await newData.save();
    console.log("Data saved to MongoDB");
  } catch (err) {
    console.log("Error:", err);
  }
});

// API route (for frontend)
app.get("/api/data", async (req, res) => {
  const data = await Sensor.find().sort({ createdAt: -1 }).limit(50);
  res.json(data);
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});