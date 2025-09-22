const Feedback = require("../models/Feedback");

// Submit feedback
exports.createFeedback = async (req, res) => {
  try {
    const { name, phone, email, description } = req.body;

    if (!name || !phone || !email || !description) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const feedback = await Feedback.create({ name, phone, email, description });
    res.status(201).json({ message: "Feedback submitted successfully", feedback });
  } catch (err) {
    res.status(500).json({ error: "Failed to submit feedback" });
  }
};

// Get all feedbacks (admin use)
exports.getAllFeedbacks = async (req, res) => {
  try {
    const feedbacks = await Feedback.find().sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch feedbacks" });
  }
};
