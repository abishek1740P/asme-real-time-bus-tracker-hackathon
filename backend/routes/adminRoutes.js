const express = require("express");
const router = express.Router();


const protect = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");

const {
  generateStudentsPdf,
  generateDriversPdf,
} = require("../controllers/pdfController");


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

module.exports = router;
