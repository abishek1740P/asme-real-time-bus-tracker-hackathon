const Feedback = require("../models/Feedback");

// Submit feedback
exports.createFeedback = async (req, res) => {
  try {
    const { name, phone, email, description, rating } = req.body;

    if (!name || !phone || !email || !description || !rating) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Validate rating range
    if (rating < 1 || rating > 10) {
      return res.status(400).json({ error: "Rating must be between 1 and 10" });
    }

    // Validate rating is integer
    if (!Number.isInteger(rating)) {
      return res.status(400).json({ error: "Rating must be a whole number" });
    }

    const feedback = await Feedback.create({
      name,
      phone,
      email,
      description,
      rating,
    });

    res.status(201).json({
      message: "Feedback submitted successfully",
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

// Get all feedbacks (admin use)
exports.getAllFeedbacks = async (req, res) => {
  try {
    const feedbacks = await Feedback.find().sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (err) {
    console.error("Fetch feedbacks error:", err);
    res.status(500).json({ error: "Failed to fetch feedbacks" });
  }
};
