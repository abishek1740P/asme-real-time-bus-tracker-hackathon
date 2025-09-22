const Conductor = require("../models/Conductor");
const Bus = require("../models/Bus");
const bcrypt = require("bcryptjs");

// Get all conductors (admin only)
exports.getAllConductors = async (req, res) => {
  try {
    const conductors = await Conductor.find().select("-password");
    res.json(conductors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create a new conductor (admin only)
exports.createConductor = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // check if email already exists
    const existing = await Conductor.findOne({ email });
    if (existing) {
      return res
        .status(400)
        .json({ error: "Conductor with this email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const conductor = new Conductor({
      name,
      email,
      password: hashedPassword,
      phone,
    });
    await conductor.save();

    res.status(201).json({
      _id: conductor._id,
      name: conductor.name,
      email: conductor.email,
      phone: conductor.phone,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update conductor
exports.updateConductor = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone } = req.body;

    const updatedConductor = await Conductor.findByIdAndUpdate(
      id,
      { name, email, phone },
      { new: true }
    );

    if (!updatedConductor) {
      return res.status(404).json({ error: "Conductor not found" });
    }

    res.json(updatedConductor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete conductor
exports.deleteConductor = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Conductor.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: "Conductor not found" });
    res.json({ message: "Conductor deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get bus assigned to the currently logged-in conductor
exports.getAssignedBus = async (req, res) => {
  try {
    const conductorId = req.user.id;

    // ✅ Populate the full route including stops
    // ConductorController.js -> getAssignedBus
    const bus = await Bus.findOne({ conductor: conductorId })
      .populate({
        path: "route",
        select: "name stops",
      })
      .populate("driver", "name phone");

    if (!bus) return res.status(404).json({ message: "No bus assigned" });

    // Map stops to an array of names for convenience
    const checkpoints = bus.route.stops.map((s) => s.name);

    res.json({
      _id: bus._id,
      name: bus.name,
      number: bus.number,
      route: bus.route,
      checkpoints, // ✅ added
      driver: bus.driver,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};
