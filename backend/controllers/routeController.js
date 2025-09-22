const Route = require("../models/Route");

exports.createRoute = async (req, res) => {
  try {
    const route = await Route.create(req.body);
    res.status(201).json(route);
  } catch (err) {
    res.status(500).json({ error: "Could not create route" });
  }
};

exports.getRoutes = async (req, res) => {
  try {
    const routes = await Route.find();
    res.json(routes);
  } catch (err) {
    res.status(500).json({ error: "Could not fetch routes" });
  }
};

exports.updateRoute = async (req, res) => {
  try {
    const updated = await Route.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updated) return res.status(404).json({ error: "Route not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Could not update route" });
  }
};

exports.deleteRoute = async (req, res) => {
  try {
    const deleted = await Route.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Route not found" });
    res.json({ message: "Route deleted" });
  } catch (err) {
    res.status(500).json({ error: "Could not delete route" });
  }
};

// Add this to routeController.js
exports.getRouteById = async (req, res) => {
  try {
    const route = await Route.findById(req.params.id);
    if (!route) return res.status(404).json({ error: "Route not found" });
    res.json(route);
  } catch (err) {
    res.status(500).json({ error: "Could not fetch route" });
  }
};


