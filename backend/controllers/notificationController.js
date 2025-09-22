const NotificationToken = require("../models/NotificationToken");
const User = require("../models/User");
const { sendMulticastNotification } = require("../utils/notify");

// ✅ Save FCM token (per student)
exports.saveFcmToken = async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: "FCM token is required" });

  const user = req.user;
  if (!user || user.role !== "student")
    return res.status(403).json({ error: "Only students can save tokens" });

  try {
    const student = await User.findOne({ email: user.email, role: "student" });
    if (!student) return res.status(404).json({ error: "Student not found" });

    // ✅ Upsert token (only 1 per student)
    await NotificationToken.updateOne(
      { studentId: student._id },
      { $set: { token } },
      { upsert: true }
    );

    res.status(200).json({ message: "FCM token saved successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ✅ Subscribe student to a bus
exports.subscribeToBus = async (req, res) => {
  const { busId } = req.body;
  if (!busId) return res.status(400).json({ error: "busId is required" });

  try {
    const student = await User.findOne({ email: req.user.email, role: "student" });
    if (!student) return res.status(404).json({ error: "Student not found" });

    // Add busId if not already present
    if (!student.subscribedBuses.includes(busId)) {
      student.subscribedBuses.push(busId);
      await student.save();
    }

    res.status(200).json({ message: "Subscribed to bus successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ✅ Unsubscribe student from a bus
exports.unsubscribeFromBus = async (req, res) => {
  const { busId } = req.body;
  if (!busId) return res.status(400).json({ error: "busId is required" });

  try {
    const student = await User.findOne({ email: req.user.email, role: "student" });
    if (!student) return res.status(404).json({ error: "Student not found" });

    student.subscribedBuses = student.subscribedBuses.filter(
      (id) => id.toString() !== busId
    );
    await student.save();

    res.status(200).json({ message: "Unsubscribed from bus successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ✅ Get my subscriptions
exports.getMySubscriptions = async (req, res) => {
  try {
    const student = await User.findOne({ email: req.user.email, role: "student" });
    if (!student) return res.status(404).json({ busIds: [] });

    res.json({ busIds: student.subscribedBuses.map((id) => id.toString()) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ busIds: [] });
  }
};

// ✅ Send bus update notification
exports.sendBusUpdateNotification = async (req, res) => {
  const { title, body, busId } = req.body;
  if (!busId) return res.status(400).json({ error: "busId is required" });

  try {
    // Find students subscribed to this bus
    const students = await User.find({ subscribedBuses: busId });
    if (!students.length) {
      return res.status(200).json({ message: "No subscriptions for this bus." });
    }

    // Get their FCM tokens
    const tokensDocs = await NotificationToken.find({
      studentId: { $in: students.map((s) => s._id) },
    });
    const tokens = tokensDocs.map((doc) => doc.token);

    if (!tokens.length) {
      return res.status(200).json({ message: "No tokens for subscribed students." });
    }

    // Send notifications
    const result = await sendMulticastNotification(
      tokens,
      title || "🚌 Bus Update",
      body || "The bus has reached a new location."
    );

    res.status(200).json({
      success: true,
      sent: result.successCount,
      failed: result.failureCount,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send notification" });
  }
};
