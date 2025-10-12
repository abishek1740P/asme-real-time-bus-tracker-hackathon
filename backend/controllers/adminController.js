const Bus = require("../models/Bus");
const Driver = require("../models/Driver");
const Route = require("../models/Route");
const Conductor = require("../models/Conductor");

// ✅ Return counts for dashboard
exports.getStats = async (req, res) => {
  try {
    const [buses, drivers, routes, conductors] = await Promise.all([
      Bus.countDocuments(),
      Driver.countDocuments(),
      Route.countDocuments(),
      Conductor.countDocuments(),
    ]);

    res.json({ buses, drivers, routes, conductors });
  } catch (err) {
    console.error("Stats fetch error:", err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
};
