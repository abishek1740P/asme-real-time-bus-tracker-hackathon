const jwt = require("jsonwebtoken");
const Driver = require("../models/Driver");
const Bus = require("../models/Bus");
const Route = require("../models/Route");
const SpeedAlert = require("../models/SpeedAlert");
const NotificationToken = require("../models/NotificationToken");
const { isWithinRadius } = require("../utils/geoUtils");
const haversine = require("haversine-distance");
const admin = require("../utils/notify");

const connectedDrivers = new Set();
const lastDriverData = new Map();

module.exports = (io) => {
  // Middleware: Authenticate driver socket using JWT
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(); // allow guest sockets for monitoring

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.role !== "driver") return next(new Error("Forbidden"));
      socket.driverId = decoded.id;
      next();
    } catch (err) {
      return next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const driverId = socket.driverId;
    connectedDrivers.add(driverId);

    socket.on("busLocation", async ({ lat, lng }) => {
      if (lat == null || lng == null) return;

      try {
        // 1. Update driver's current location
        const updatedDriver = await Driver.findByIdAndUpdate(
          driverId,
          {
            currentLocation: {
              type: "Point",
              coordinates: [Number(lng), Number(lat)],
            },
          },
          { new: true }
        );
        if (!updatedDriver) return;

        const bus = await Bus.findOne({ driver: driverId }).populate("route");
        if (!bus || !bus.route) return;

        const busId = bus._id.toString();

        // 2. Emit real-time update
        io.emit("updateLocation", {
          busId,
          driverId,
          lat,
          lng,
        });

        // 3. Check if near any checkpoint (within 100m)
        for (let stop of bus.route.stops || []) {
          const isNear = isWithinRadius(
            { lat, lng },
            { lat: stop.coordinates.lat, lng: stop.coordinates.lng },
            100
          );

          if (isNear) {
            // Notify frontend clients
            io.to(`bus:${busId}`).emit("checkpoint-reached", {
              busId,
              checkpoint: stop.name,
              lat: stop.coordinates.lat,
              lng: stop.coordinates.lng,
              message: `Bus is near checkpoint: ${stop.name}`,
            });

            // 🔔 Notify students via FCM
            await notifyBusArrival(bus._id, stop.name);
            break;
          }
        }

        // 4. Speed Monitoring
        const now = Date.now();
        const last = lastDriverData.get(driverId);

        if (last) {
          const timeDiffHr = (now - last.timestamp) / (1000 * 60 * 60);
          const distMeters = haversine(
            { lat: last.lat, lng: last.lng },
            { lat, lng }
          );
          const distKm = distMeters / 1000;
          const speed = distKm / timeDiffHr;

          const speedLimit = bus.speedLimit || 60;

          if (speed > speedLimit) {
            await SpeedAlert.create({
              bus: bus._id,
              driver: driverId,
              speed: Number(speed.toFixed(2)),
              speedLimit: speedLimit,
              coordinates: { lat, lng },
              triggeredAt: new Date(),
            });

            io.to("admin-room").emit("speed-alert", {
              busId,
              driverId,
              lat,
              lng,
              speed: speed.toFixed(1),
              threshold: speedLimit,
            });
          }
        }

        // 5. Store for next speed calculation
        lastDriverData.set(driverId, { lat, lng, timestamp: now });
      } catch (err) {
      }
    });

    // Driver Online Check
    socket.on("checkDriverStatus", ({ driverId }, callback) => {
      const isOnline = connectedDrivers.has(driverId);
      callback({ isOnline });
    });

    socket.on("disconnect", () => {
      connectedDrivers.delete(driverId);
    });
  });
};

// 🔔 Send FCM Notification to students of a specific bus
const notifyBusArrival = async (busId) => {
  const students = await Student.find({ bus: busId });
  const tokens = await NotificationToken.find({
    studentId: { $in: students.map((s) => s._id) },
  });

  const message = {
    notification: {
      title: "🚌 Bus is here!",
      body: "Your bus has reached a nearby checkpoint.",
    },
    tokens: tokens.map((t) => t.token),
  };

  try {
    const response = await admin.messaging().sendMulticast(message);

    // 🧹 Remove invalid tokens
    const failedTokens = [];
    response.responses.forEach((resp, idx) => {
      if (!resp.success) {
        failedTokens.push(message.tokens[idx]);
      }
    });

    if (failedTokens.length > 0) {
      await NotificationToken.deleteMany({ token: { $in: failedTokens } });
    }
  } catch (err) {
  }
};
