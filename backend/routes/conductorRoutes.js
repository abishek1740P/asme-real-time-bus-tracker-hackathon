const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const {
  getAllConductors,
  createConductor,
  updateConductor,
  deleteConductor,
  getAssignedBus,
} = require("../controllers/conductorController");

// ✅ Admin-only routes
router.get("/", auth, role("admin"), getAllConductors);
router.post("/", auth, role("admin"), createConductor);
router.put("/:id", auth, role("admin"), updateConductor);
router.delete("/:id", auth, role("admin"), deleteConductor);

// ✅ Conductor-specific route to get assigned bus
router.get("/me/assigned-bus", auth, role("conductor"), getAssignedBus);

module.exports = router;
