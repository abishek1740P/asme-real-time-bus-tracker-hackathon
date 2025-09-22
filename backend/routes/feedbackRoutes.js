const express = require("express");
const router = express.Router();
const feedbackController = require("../controllers/feedbackController");

// POST /api/student/feedback → submit feedback
router.post("/", feedbackController.createFeedback);

// GET /api/student/feedback → get all feedback (admin side)
router.get("/", feedbackController.getAllFeedbacks);

module.exports = router;
