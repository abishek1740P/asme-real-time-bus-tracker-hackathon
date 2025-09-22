const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

const {
  createBus,
  getBuses,
  updateBus,
  deleteBus,
  getBusById,
  getSpeedAlertsByBusId,
  deleteAlertsByDate, // ✅ Make sure this is correctly exported from busController
} = require("../controllers/busController");

// ✅ Public/Authenticated Routes
router.get("/", auth, getBuses);
router.get("/:id", auth, role(["admin", "student"]), getBusById);
router.get("/:id/speed-alerts", auth, role(["admin"]), getSpeedAlertsByBusId);

// ✅ Admin-only routes
router.post("/", auth, role("admin"), createBus);
router.put("/:id", auth, role("admin"), updateBus);
router.delete("/:id", auth, role("admin"), deleteBus);
router.delete("/:id/speed-alerts", auth, role("admin"), deleteAlertsByDate); // ✅ Correct usage

module.exports = router;
