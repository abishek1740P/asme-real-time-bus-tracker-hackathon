// backend/controllers/studentController.js
const User = require("../models/User");


exports.getStudentProfile = async (req, res) => {
  try {
    const studentId = req.user.id; 

    const student = await User.findById(studentId).select("name email role");

    if (!student || student.role !== "student") {
      return res.status(404).json({ error: "Student not found" });
    }

    res.json({
      name: student.name,
      email: student.email,
      role: student.role,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
