const express = require("express");
const router = express.Router();
const {
  bookTicket,
  getMyTickets,
  scanTicket,
} = require("../controllers/ticketController");
const protect = require("../middleware/authMiddleware");

router.post("/book", protect, bookTicket);
router.get("/my", protect, getMyTickets);

// ✅ New scan route
router.post("/scan/:ticketId", scanTicket);

module.exports = router;
