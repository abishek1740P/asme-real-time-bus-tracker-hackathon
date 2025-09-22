const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const {
  getAllDrivers,
  addDriver,
  updateDriver,
  deleteDriver,
  getAssignedBus,
} = require("../controllers/driverController");

router.get("/", auth, role("admin"), getAllDrivers);
router.post("/", auth, role("admin"), addDriver);
router.put("/:id", auth, role("admin"), updateDriver);
router.delete("/:id", auth, role("admin"), deleteDriver);

// ✅ Driver route with /me
router.get("/me/assigned-bus", auth, role("driver"), getAssignedBus);

module.exports = router;
