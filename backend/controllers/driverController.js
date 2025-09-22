const Driver = require("../models/Driver");
const Bus = require("../models/Bus");
const bcrypt = require("bcryptjs");

// Get all drivers (admin only)
exports.getAllDrivers = async (req, res) => {
  try {
    const drivers = await Driver.find().select("-password");
    res.json(drivers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add new driver
exports.addDriver = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    const existing = await Driver.findOne({ email });
    if (existing) {
      return res
        .status(400)
        .json({ error: "Driver with this email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const driver = new Driver({ name, email, password: hashedPassword, phone });
    await driver.save();

    res.status(201).json({
      _id: driver._id,
      name: driver.name,
      email: driver.email,
      phone: driver.phone,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update driver
exports.updateDriver = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone } = req.body;

    const updatedDriver = await Driver.findByIdAndUpdate(
      id,
      { name, email, phone },
      { new: true }
    );

    if (!updatedDriver) {
      return res.status(404).json({ error: "Driver not found" });
    }

    res.json(updatedDriver);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete driver
exports.deleteDriver = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Driver.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: "Driver not found" });
    res.json({ message: "Driver deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get bus assigned to the currently logged-in driver
// Get bus assigned to the currently logged-in driver
// Get bus assigned to the currently logged-in driver
exports.getAssignedBus = async (req, res) => {
  try {
    const driverId = req.user.id;

    // ✅ Populate the full route including stops
    const bus = await Bus.findOne({ driver: driverId }).populate("route");

    if (!bus) {
      return res.status(404).json({ message: "No bus assigned to this driver" });
    }

    res.json({
      _id: bus._id,
      name: bus.name,
      number: bus.number,
      route: bus.route, // ✅ send full route with stops!
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

