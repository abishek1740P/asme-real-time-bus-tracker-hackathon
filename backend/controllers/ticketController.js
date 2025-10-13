const Ticket = require("../models/Ticket");
const Bus = require("../models/Bus");

// Book a ticket
exports.bookTicket = async (req, res) => {
  try {
    const { busId, seats, startPoint, stopPoint, fare, paymentId } = req.body;

    const ticket = new Ticket({
      student: req.user.id,
      bus: busId,
      seats,
      startPoint,
      stopPoint,
      fare,
      paymentId,
    });

    await ticket.save();
    res.status(201).json(ticket);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to book ticket" });
  }
};

// Get my tickets
exports.getMyTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({ student: req.user.id }).populate({
      path: "bus",
      populate: [
        { path: "route", select: "name stops" },
        { path: "driver", select: "name phone" },
        { path: "conductor", select: "name phone" },
      ],
    });

    res.json(tickets);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch tickets" });
  }
};

// ✅ Scan a ticket - Only conductor of that bus can validate
exports.scanTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const conductorId = req.user.id; // ✅ from auth middleware

    // Find conductor's assigned bus
    const bus = await Bus.findOne({ conductor: conductorId });
    if (!bus) {
      return res
        .status(400)
        .json({ message: "Conductor not assigned to any bus" });
    }

    const ticket = await Ticket.findById(ticketId)
      .populate("student", "name email")
      .populate("bus", "name number route");

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // ✅ Check if ticket belongs to conductor's bus
    if (ticket.bus._id.toString() !== bus._id.toString()) {
      return res.status(403).json({
        message: "Unauthorized: This ticket is for a different bus!",
      });
    }

    if (ticket.used) {
      return res.status(400).json({ message: "Ticket already used!" });
    }

    // Mark ticket as used
    ticket.used = true;
    await ticket.save();

    res.json({
      message: "Ticket validated successfully!",
      ticket,
    });
  } catch (err) {
    console.error("Scan error:", err);
    res.status(500).json({ message: "Failed to scan ticket" });
  }
};
