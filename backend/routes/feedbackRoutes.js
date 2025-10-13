const express = require("express");
const router = express.Router();
const feedbackController = require("../controllers/feedbackController");

// POST /api/student/feedback → submit passenger feedback
router.post(
  "/",
  (req, res, next) => {
    // Ensure feedbackType is set to passenger for this route
    req.body.feedbackType = "passenger";
    next();
  },
  feedbackController.createFeedback
);

// GET /api/student/feedback → get all PASSENGER feedback only
router.get(
  "/",
  (req, res, next) => {
    console.log("🚌 Passenger route - setting type to passenger");
    req.query.type = "passenger"; // Filter by passenger feedback only
    next();
  },
  feedbackController.getAllFeedbacks
);

module.exports = router;
