// server.js
require("dotenv").config();
const http = require("http");
const app = require("./app");
const { Server } = require("socket.io");
const locationSocket = require("./sockets/locationSocket");

const PORT = process.env.PORT;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN;

// Create HTTP server from Express app
const server = http.createServer(app);

// Setup Socket.IO with secure CORS
const io = new Server(server, {
  cors: {
    origin: CLIENT_ORIGIN,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Attach location socket handler
locationSocket(io);

// Start server
server.on("error", (err) => {
  console.error("❌ Server error:", err);
});
server.listen(PORT);
console.log(`🚀 Server running on port ${PORT}`);

// Optional: Graceful shutdown
process.on("SIGINT", () => {
  server.close(() => {
    process.exit(0);
  });
});
