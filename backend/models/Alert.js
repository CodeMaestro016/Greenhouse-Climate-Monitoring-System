const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  sensorId: {
    type: String,
    required: true,
    index: true
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  field: {
    type: String,
    required: true,
    lowercase: true,
    enum: ['temperature', 'humidity', 'soil_moisture', 'soil', 'air', 'co2', 'light']
  },
  value: {
    type: Number,
    required: true
  },
  min: {
    type: Number,
    required: true
  },
  max: {
    type: Number,
    required: true
  },
  severity: {
    type: String,
    required: true,
    enum: ['critical', 'high', 'medium', 'low', 'info'],
    default: 'medium'
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Compound indexes for efficient querying
alertSchema.index({ sensorId: 1, createdAt: -1 });
alertSchema.index({ severity: 1, createdAt: -1 });
alertSchema.index({ field: 1, createdAt: -1 });
alertSchema.index({ timestamp: -1 });

module.exports = mongoose.model(
  'Alert',
  alertSchema,
  'alertNotifications'
);