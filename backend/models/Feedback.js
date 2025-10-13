const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    description: { type: String, required: true },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
      validate: {
        validator: Number.isInteger,
        message: "Rating must be a whole number between 1 and 10",
      },
    },
    // New fields for driver feedback
    driverId: { type: String }, // Optional for driver feedback
    vehicleNumber: { type: String }, // Optional for driver feedback
    route: { type: String }, // Optional for driver feedback
    feedbackType: {
      type: String,
      enum: ["passenger", "driver"],
      default: "passenger",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Feedback", feedbackSchema);
