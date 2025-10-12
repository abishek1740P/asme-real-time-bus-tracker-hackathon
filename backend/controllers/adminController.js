const Bus = require("../models/Bus");
const Driver = require("../models/Driver");
const Route = require("../models/Route");

// ✅ Return counts for dashboard
exports.getStats = async (req, res) => {
  try {
    const [buses, drivers, routes] = await Promise.all([
      Bus.countDocuments(),
      Driver.countDocuments(),
      Route.countDocuments(),
    ]);

    res.json({ buses, drivers, routes });
  } catch (err) {
    console.error("Stats fetch error:", err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
};
