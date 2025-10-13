const express = require("express");
const router = express.Router();
const feedbackController = require("../controllers/feedbackController");

// POST /api/driver/feedback → submit driver feedback
router.post(
  "/",
  (req, res, next) => {
    // Ensure feedbackType is set to driver for this route
    req.body.feedbackType = "driver";
    next();
  },
  feedbackController.createFeedback
);

// GET /api/driver/feedback → get all driver feedback
router.get(
  "/",
  (req, res, next) => {
    console.log("🚗 Driver route - setting type to driver");
    req.query.type = "driver"; // Filter by driver feedback only
    next();
  },
  feedbackController.getAllFeedbacks
);

module.exports = router;
