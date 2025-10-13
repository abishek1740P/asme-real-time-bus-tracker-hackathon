const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const {
  bookTicket,
  getMyTickets,
  scanTicket,
} = require("../controllers/ticketController");

router.post("/book", auth, bookTicket);
router.get("/my", auth, getMyTickets);

// ✅ FIXED: Add authentication and role protection for scan route
router.post("/scan/:ticketId", auth, role(["conductor"]), scanTicket);

module.exports = router;
