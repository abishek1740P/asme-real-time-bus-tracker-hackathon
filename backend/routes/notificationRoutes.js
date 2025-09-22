const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

const {
  saveFcmToken,
  subscribeToBus,
  unsubscribeFromBus,
  getMySubscriptions,
  sendBusUpdateNotification,
} = require("../controllers/notificationController");

// ✅ Save FCM token (students only)
router.post("/save-token", auth, saveFcmToken);

// ✅ Subscribe to a bus (students only)
router.post("/subscribe", auth, subscribeToBus);

// ✅ Unsubscribe from a bus (students only)
router.post("/unsubscribe", auth, unsubscribeFromBus);

// ✅ Get my subscriptions (students only)
router.get("/my-subscriptions", auth, getMySubscriptions);

// ✅ Send notification to all students in a bus (drivers only)
router.post("/send", auth, role("driver"), sendBusUpdateNotification);

module.exports = router;
