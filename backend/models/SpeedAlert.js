// models/SpeedAlert.js
const mongoose = require("mongoose");

const speedAlertSchema = new mongoose.Schema(
  {
    bus: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bus",
      required: true,
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      required: true,
    },
    speed: Number,
    speedLimit: Number,
    coordinates: {
      lat: Number,
      lng: Number,
    },
    triggeredAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.SpeedAlert || mongoose.model("SpeedAlert", speedAlertSchema);
