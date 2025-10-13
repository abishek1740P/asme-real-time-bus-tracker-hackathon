const Bus = require("../models/Bus");
const SpeedAlert = require("../models/SpeedAlert");
const Conductor = require("../models/Conductor");

// Create a new bus (admin only)
exports.createBus = async (req, res) => {
  try {
    const bus = await Bus.create(req.body);
    res.status(201).json(bus);
  } catch (err) {
    res.status(500).json({ error: "Could not create bus" });
  }
};

// Get all buses (admin only or general dashboard)
exports.getBuses = async (req, res) => {
  try {
    const buses = await Bus.find()
      .populate({
        path: "route",
        select: "name stops",
      })
      .populate("driver", "name phone")
      .populate("conductor", "name phone");

    res.json(buses);
  } catch (err) {
    res.status(500).json({ error: "Could not fetch buses" });
  }
};

// Get a single bus by ID (for student view)
exports.getBusById = async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id)
      .populate({
        path: "route",
        select: "name stops fares",
      })
      .populate({
        path: "driver",
        select: "name phone currentLocation",
      })
      .populate({
        path: "conductor",
        select: "name phone",
      });

    if (!bus) {
      return res.status(404).json({ error: "Bus not found" });
    }

    res.json(bus);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch bus" });
  }
};

// Get conductor's assigned bus
exports.getMyBus = async (req, res) => {
  try {
    const conductorId = req.user.id;

    const bus = await Bus.findOne({ conductor: conductorId })
      .populate("route", "name stops")
      .populate("driver", "name phone");

    if (!bus) {
      return res
        .status(404)
        .json({ error: "No bus assigned to this conductor" });
    }

    res.json({ bus });
  } catch (err) {
    console.error("Get conductor bus error:", err);
    res.status(500).json({ error: "Failed to fetch conductor bus" });
  }
};

// ✅ KEEP ONLY THIS assignConductor function (remove the duplicate)
exports.assignConductor = async (req, res) => {
  try {
    const { busId, conductorId } = req.body;

    // Update bus with conductor
    const bus = await Bus.findByIdAndUpdate(
      busId,
      { conductor: conductorId },
      { new: true }
    ).populate("conductor", "name phone");

    if (!bus) {
      return res.status(404).json({ error: "Bus not found" });
    }

    // Update conductor with bus
    await Conductor.findByIdAndUpdate(
      conductorId,
      { bus: busId },
      { new: true }
    );

    res.json({
      message: "Conductor assigned successfully",
      bus,
    });
  } catch (err) {
    console.error("Assign conductor error:", err);
    res.status(500).json({ error: "Failed to assign conductor" });
  }
};

// Update a bus (admin only)
exports.updateBus = async (req, res) => {
  try {
    const updated = await Bus.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    })
      .populate("route", "name")
      .populate("driver", "name phone")
      .populate("conductor", "name phone");

    if (!updated) {
      return res.status(404).json({ error: "Bus not found" });
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Could not update bus" });
  }
};

// Speed alerts
exports.getSpeedAlertsByBusId = async (req, res) => {
  try {
    const { id } = req.params;

    const alerts = await SpeedAlert.find({ bus: id })
      .sort({ triggeredAt: -1 })
      .limit(100)
      .populate("driver", "name phone")
      .populate("bus", "name number");

    res.json({ alerts });
  } catch (err) {
    console.error("Speed Alert fetch error:", err);
    res.status(500).json({ error: "Failed to fetch speed alerts" });
  }
};

// Delete alerts by date
exports.deleteAlertsByDate = async (req, res) => {
  const { id } = req.params;
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ message: "Date is required" });
  }

  const start = new Date(date);
  const end = new Date(date);
  end.setDate(end.getDate() + 1);

  await SpeedAlert.deleteMany({
    bus: id,
    triggeredAt: { $gte: start, $lt: end },
  });

  res.json({ message: `Alerts from ${date} deleted` });
};

// Delete recent alerts
exports.deleteRecentSpeedAlerts = async (req, res) => {
  try {
    const { id } = req.params;
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const result = await SpeedAlert.deleteMany({
      bus: id,
      timestamp: { $gte: oneDayAgo },
    });

    res.json({
      message: `${result.deletedCount} alerts deleted from past 1 day.`,
    });
  } catch (err) {
    console.error("Delete speed alerts failed", err);
    res.status(500).json({ error: "Failed to delete alerts" });
  }
};

// Delete a bus (admin only)
exports.deleteBus = async (req, res) => {
  try {
    const deleted = await Bus.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ error: "Bus not found" });
    }

    res.json({ message: "Bus deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Could not delete bus" });
  }
};
