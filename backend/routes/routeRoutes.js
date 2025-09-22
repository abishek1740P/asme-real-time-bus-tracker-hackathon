const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const {
  createRoute,
  getRoutes,
  updateRoute,
  deleteRoute,
  getRouteById,
} = require("../controllers/routeController");

router.post("/", auth, role("admin"), createRoute);
router.get("/", auth, role("admin"), getRoutes);
router.get("/:id", auth, role(["admin", "driver"]), getRouteById);
router.put("/:id", auth, role("admin"), updateRoute);
router.delete("/:id", auth, role("admin"), deleteRoute);


module.exports = router;
