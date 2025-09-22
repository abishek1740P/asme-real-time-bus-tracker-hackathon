const express = require("express");
const router = express.Router();
const { initiatePayment, verifyPayment } = require("../controllers/paymentController");

// Initiate payment
router.post("/initiate", initiatePayment);

// Verify payment
router.post("/verify", verifyPayment);

module.exports = router;
