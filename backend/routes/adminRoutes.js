const express = require("express");
const router = express.Router();


const protect = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");

const {
  generateStudentsPdf,
  generateDriversPdf,
} = require("../controllers/pdfController");

const { getStats } = require("../controllers/adminController");

router.get(
  "/students/download",
  protect,
  requireRole("admin"),
  generateStudentsPdf
);

router.get(
  "/drivers/download",
  protect,
  requireRole("admin"),
  generateDriversPdf
);

// ✅ Dashboard stats
router.get("/stats", protect, requireRole("admin"), getStats);

module.exports = router;
