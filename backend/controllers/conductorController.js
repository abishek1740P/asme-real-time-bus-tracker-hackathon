const Conductor = require("../models/Conductor");
const Ticket = require("../models/Ticket");
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

    // ✅ CORRECTED: Find bus where conductor field matches conductorId
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
      checkpoints,
      driver: bus.driver,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// Get scan history for the logged-in conductor
exports.getHistory = async (req, res) => {
  try {
    const conductorId = req.user.id;

    // Find the bus assigned to this conductor
    const bus = await Bus.findOne({ conductor: conductorId }).populate({
      path: "route",
      select: "name stops",
    });
    if (!bus) return res.status(404).json({ error: "No bus assigned" });

    // Find tickets that belong to this bus and have been scanned (used: true)
    const tickets = await Ticket.find({ bus: bus._id, used: true })
      .populate("student", "name email") // fetch student info
      .populate({
        path: "bus",
        populate: {
          path: "route",
          select: "name stops",
        },
      })
      .sort({ updatedAt: -1 });

    // Map tickets to frontend-friendly format
    const history = tickets.map((t) => ({
      _id: t._id,
      studentName: t.student?.name || "Unknown Student",
      ticketId: t._id,
      scannedAt: t.updatedAt,
      routeName: t.bus?.route?.name || "N/A",
      startPoint: t.startPoint || "N/A",
      stopPoint: t.stopPoint || "N/A",
      fare: t.fare || "N/A",
    }));

    res.json(history);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
