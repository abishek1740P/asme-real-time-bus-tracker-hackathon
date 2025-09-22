const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    bus: { type: mongoose.Schema.Types.ObjectId, ref: "Bus", required: true },
    seats: { type: Number, required: true },
    startPoint: { type: String, required: true },
    stopPoint: { type: String, required: true },
    fare: { type: Number, required: true },
    status: { type: String, enum: ["booked", "cancelled"], default: "booked" },
    paymentId: { type: String }, 
    used: { type: Boolean, default: false }, // new field
  },
  { timestamps: true }
);

module.exports = mongoose.model("Ticket", ticketSchema);
