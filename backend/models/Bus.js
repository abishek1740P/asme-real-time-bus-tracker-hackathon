const mongoose = require("mongoose");

const busSchema = new mongoose.Schema({
  name: { type: String, required: true },
  number: { type: String, required: true },
  route: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Route",
    required: true,
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Driver",
    required: true,
  },
  conductor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Conductor",
    required: false, // optional, can assign later
  },
  speedLimit: {
    type: Number,
    default: 60,
  },
});

module.exports = mongoose.model("Bus", busSchema);
