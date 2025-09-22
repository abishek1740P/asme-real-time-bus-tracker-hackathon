const Ticket = require("../models/Ticket");

// Book a ticket
exports.bookTicket = async (req, res) => {
  try {
    const { busId, seats, startPoint, stopPoint, fare, paymentId } = req.body;

    const ticket = new Ticket({
      student: req.user.id, // ✅ from auth middleware
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
        { path: "route", select: "name stops" }, // populate route
        { path: "driver", select: "name phone" }, // populate driver
        { path: "conductor", select: "name phone" }, // optional
      ],
    });

    res.json(tickets);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch tickets" });
  }
};

// ✅ Scan a ticket
exports.scanTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;

    const ticket = await Ticket.findById(ticketId)
      .populate("student", "name email")
      .populate("bus", "name number route");

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    if (ticket.used) {
      return res.status(400).json({ message: "Ticket already used!" });
    }

    // Mark ticket as used
    ticket.used = true;
    await ticket.save();

    res.json({ ticket });
  } catch (err) {
    console.error("Scan error:", err);
    res.status(500).json({ message: "Failed to scan ticket" });
  }
};
