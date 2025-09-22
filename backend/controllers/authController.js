const User = require("../models/User");
const Driver = require("../models/Driver");
const Conductor = require("../models/Conductor"); // ✅ import conductor model
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

// Register for users (students by default) and drivers
exports.register = async (req, res) => {
  const { name, email, password, phone, role } = req.body;

  try {
    // 🚗 Driver registration
    if (role === "driver") {
      const existingDriver = await Driver.findOne({ email });
      if (existingDriver) {
        return res
          .status(400)
          .json({ message: "Driver email already registered" });
      }

      const hashed = await bcrypt.hash(password, 10);
      const driver = await Driver.create({
        name,
        email,
        password: hashed,
        phone,
      });

      const token = jwt.sign(
        { id: driver._id, role: "driver", email: driver.email },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      return res.status(201).json({
        token,
        role: "driver",
        name: driver.name,
        _id: driver._id,
      });
    }

    // 🎓 Default: Student registration (via User model)
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashed,
      phone,
      role: "student", // force student role
    });

    const token = jwt.sign(
      { id: user._id, role: "student", email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      token,
      role: "student",
      name: user.name,
      _id: user._id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Registration failed" });
  }
};

// Login for users (student/admin), drivers, and conductors
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    let role = user ? user.role : null;

    // 🔍 If not found in User, check Driver
    if (!user) {
      user = await Driver.findOne({ email });
      if (user) role = "driver";
    }

    // 🔍 If not found in Driver, check Conductor
    if (!user) {
      user = await Conductor.findOne({ email });
      if (user) role = "conductor";
    }

    // ❌ If still not found
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role,
        email: user.email,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, role, name: user.name, _id: user._id });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
};

// Get logged-in user info (student/admin), driver, or conductor
exports.getMe = async (req, res) => {
  try {
    if (req.user.role === "driver") {
      const driver = await Driver.findById(req.user.id).select("-password");
      return res.json({ ...driver.toObject(), role: "driver" });
    } else if (req.user.role === "conductor") {
      const conductor = await Conductor.findById(req.user.id).select(
        "-password"
      );
      return res.json({ ...conductor.toObject(), role: "conductor" });
    } else {
      const user = await User.findById(req.user.id).select("-password");
      return res.json({ ...user.toObject(), role: user.role });
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
};
