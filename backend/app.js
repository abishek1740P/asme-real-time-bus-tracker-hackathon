// backend/app.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Routes
const authRoutes = require("./routes/authRoutes");
const busRoutes = require("./routes/busRoutes");
const routeRoutes = require("./routes/routeRoutes");
const driverRoutes = require("./routes/driverRoutes");
const conductorRoutes = require("./routes/conductorRoutes"); // ✅ added
const adminRoutes = require("./routes/adminRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
// const feedbackRoutes = require("./routes/feedbackRoutes");
const ticketRoutes = require("./routes/ticketRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

const app = express();

// ✅ CORRECT CORS SETUP
const corsOptions = {
  origin: process.env.CLIENT_ORIGIN,
  credentials: true,
};
app.use(cors(corsOptions));

app.use(express.json());

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/buses", busRoutes);
app.use("/api/routes", routeRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api/conductors", conductorRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);
// Add this to your main router file
app.use("/api/student/feedback", require("./routes/feedbackRoutes"));
app.use("/api/driver/feedback", require("./routes/driverFeedback"));
app.use("/api/tickets", ticketRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/students", require("./routes/studentRoutes"));

module.exports = app;
