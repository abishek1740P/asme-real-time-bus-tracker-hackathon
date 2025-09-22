const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["admin", "student", "driver"], 
    default: "student",
  },

  // store bus subscriptions directly
  subscribedBuses: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bus", // reference Bus collection
    },
  ],
});

module.exports = mongoose.model("User", userSchema);
