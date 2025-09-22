const mongoose = require("mongoose");

const notificationTokenSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true, // ✅ one token per student
  },
  token: {
    type: String,
    required: true,
  },
});

// Each student has only 1 active token
// If a student logs in from another device, you update/replace it
module.exports = mongoose.model("NotificationToken", notificationTokenSchema);
