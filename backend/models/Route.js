const mongoose = require("mongoose");

const routeSchema = new mongoose.Schema({
  name: String,
  stops: [
    {
      name: String,
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },
  ],
});

module.exports = mongoose.model("Route", routeSchema);
