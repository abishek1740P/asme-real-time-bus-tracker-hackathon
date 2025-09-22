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
  fares: [
    {
      from: String, // start stop
      to: String, // end stop
      fare: Number,
    },
  ],
});

module.exports = mongoose.model("Route", routeSchema);
