const Feedback = require("../models/Feedback");

// Submit feedback for both passenger and driver
exports.createFeedback = async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      description,
      rating,
      driverId,
      vehicleNumber,
      route,
      feedbackType = "passenger",
    } = req.body;

    // Basic required fields validation
    if (!name || !phone || !email || !description || !rating) {
      return res.status(400).json({ error: "All basic fields are required" });
    }

    // Validate rating range
    if (rating < 1 || rating > 10) {
      return res.status(400).json({ error: "Rating must be between 1 and 10" });
    }

    // Validate rating is integer
    if (!Number.isInteger(rating)) {
      return res.status(400).json({ error: "Rating must be a whole number" });
    }

    // Validate feedback type
    if (!["passenger", "driver"].includes(feedbackType)) {
      return res.status(400).json({ error: "Invalid feedback type" });
    }

    // For driver feedback, additional fields might be required
    if (feedbackType === "driver") {
      if (!driverId || !vehicleNumber || !route) {
        return res.status(400).json({
          error:
            "For driver feedback, driverId, vehicleNumber, and route are required",
        });
      }
    }

    const feedback = await Feedback.create({
      name,
      phone,
      email,
      description,
      rating,
      driverId: feedbackType === "driver" ? driverId : undefined,
      vehicleNumber: feedbackType === "driver" ? vehicleNumber : undefined,
      route: feedbackType === "driver" ? route : undefined,
      feedbackType,
    });

    res.status(201).json({
      message: `${
        feedbackType.charAt(0).toUpperCase() + feedbackType.slice(1)
      } feedback submitted successfully`,
      feedback,
    });
  } catch (err) {
    console.error("Feedback submission error:", err);

    // Handle Mongoose validation errors
    if (err.name === "ValidationError") {
      return res.status(400).json({
        error: Object.values(err.errors)
          .map((e) => e.message)
          .join(", "),
      });
    }

    res.status(500).json({ error: "Failed to submit feedback" });
  }
};

// Get all feedbacks (admin use) - with filtering option
// Get all feedbacks (admin use) - with filtering option
exports.getAllFeedbacks = async (req, res) => {
  try {
    const { type } = req.query;

    // Force the filter based on the endpoint
    let filter = {};
    if (req.originalUrl.includes("/student/feedback")) {
      filter.feedbackType = "passenger";
    } else if (req.originalUrl.includes("/driver/feedback")) {
      filter.feedbackType = "driver";
    }

    console.log("🔍 URL:", req.originalUrl);
    console.log("📊 Final filter:", filter);

    const feedbacks = await Feedback.find(filter).sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (err) {
    console.error("Fetch feedbacks error:", err);
    res.status(500).json({ error: "Failed to fetch feedbacks" });
  }
};

// Get feedbacks by type
exports.getFeedbacksByType = async (req, res) => {
  try {
    const { type } = req.params;

    if (!["passenger", "driver"].includes(type)) {
      return res.status(400).json({ error: "Invalid feedback type" });
    }

    const feedbacks = await Feedback.find({ feedbackType: type }).sort({
      createdAt: -1,
    });
    res.json(feedbacks);
  } catch (err) {
    console.error("Fetch feedbacks by type error:", err);
    res.status(500).json({ error: "Failed to fetch feedbacks" });
  }
};
