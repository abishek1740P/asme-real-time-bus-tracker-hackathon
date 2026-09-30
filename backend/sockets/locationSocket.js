const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Driver = require("../models/Driver");
const Bus = require("../models/Bus");
const Route = require("../models/Route");
const User = require("../models/User");
const SpeedAlert = require("../models/SpeedAlert");
const NotificationToken = require("../models/NotificationToken");
const { isWithinRadius } = require("../utils/geoUtils");
const haversine = require("haversine-distance");
const { sendMulticastNotification } = require("../utils/notify");

const connectedDrivers = new Set();
const lastDriverData = new Map();
// Cache driver to bus object: driverId -> { bus, cachedAt }
const driverBusCache = new Map();
const BUS_CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

// Throttle DB location updates: driverId -> timestamp
const lastDbLocationUpdate = new Map();
const DB_UPDATE_INTERVAL_MS = 4000; // write to MongoDB at most once every 4 seconds

// Cooldown map: key = `${busId}:${stopName}`, value = timestamp of last notification
const notifiedStops = new Map();
const NOTIFICATION_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

// Helper to get cached bus or fetch from DB
const getDriverBus = async (driverId) => {
  const cached = driverBusCache.get(driverId);
  const now = Date.now();
  if (cached && now - cached.cachedAt < BUS_CACHE_TTL_MS) {
    return cached.bus;
  }

  // Only query DB if connected
  if (mongoose.connection.readyState === 1) {
    try {
      const bus = await Bus.findOne({ driver: driverId }).populate("route").lean();
      if (bus) {
        driverBusCache.set(driverId, { bus, cachedAt: now });
        return bus;
      }
    } catch (err) {
      if (!isTransientMongoError(err)) {
        console.warn("[Socket] Bus lookup warning:", err.message);
      }
      if (cached) return cached.bus; // return stale cache if available
    }
  } else if (cached) {
    return cached.bus;
  }

  return null;
};

// Check if error is a transient pool clearing or connection reset error
const isTransientMongoError = (err) => {
  if (!err) return false;
  const msg = err.message || "";
  const name = err.name || "";
  return (
    name === "MongoPoolClearedError" ||
    name === "PoolClearedError" ||
    msg.includes("ECONNRESET") ||
    msg.includes("connection pool was cleared") ||
    msg.includes("Topology is closed")
  );
};

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
    if (driverId) {
      connectedDrivers.add(driverId);
      io.emit("driverStatusUpdate", { driverId, isOnline: true });
    }

    socket.on("busLocation", async ({ lat, lng }) => {
      if (lat == null || lng == null) return;

      try {
        const now = Date.now();

        // 1. Get bus details (from cache or fast lookup)
        const bus = await getDriverBus(driverId);
        const busId = bus?._id ? bus._id.toString() : null;

        // 2. IMMEDIATELY emit real-time update to all listeners (zero database lag!)
        io.emit("updateLocation", {
          busId,
          driverId,
          lat,
          lng,
        });

        // 3. Throttle MongoDB driver coordinates persistence (once every 4 seconds)
        const lastDbTime = lastDbLocationUpdate.get(driverId) || 0;
        if (now - lastDbTime >= DB_UPDATE_INTERVAL_MS && mongoose.connection.readyState === 1) {
          lastDbLocationUpdate.set(driverId, now);
          Driver.findByIdAndUpdate(driverId, {
            currentLocation: {
              type: "Point",
              coordinates: [Number(lng), Number(lat)],
            },
          }).catch((err) => {
            if (!isTransientMongoError(err)) {
              console.warn("[Socket] Driver location DB save error:", err.message);
            }
          });
        }

        // If no bus or route assigned, we're done with telemetry
        if (!bus || !bus.route) return;

        // 4. Check if near any checkpoint (within 100m)
        for (let stop of bus.route.stops || []) {
          const stopCoords = stop.coordinates;
          if (!stopCoords) continue;

          const isNear = isWithinRadius(
            { lat, lng },
            { lat: stopCoords.lat, lng: stopCoords.lng },
            100
          );

          if (isNear) {
            io.to(`bus:${busId}`).emit("checkpoint-reached", {
              busId,
              checkpoint: stop.name,
              lat: stopCoords.lat,
              lng: stopCoords.lng,
              message: `Bus is near checkpoint: ${stop.name}`,
            });

            // 🔔 Notify students via FCM (with 5-minute cooldown per stop)
            const cooldownKey = `${busId}:${stop.name}`;
            const lastNotified = notifiedStops.get(cooldownKey) || 0;
            if (now - lastNotified > NOTIFICATION_COOLDOWN_MS) {
              notifiedStops.set(cooldownKey, now);
              notifyBusArrival(bus._id, stop.name);
            }
            break;
          }
        }

        // 5. Speed Monitoring
        const last = lastDriverData.get(driverId);
        if (last) {
          const timeDiffHr = (now - last.timestamp) / (1000 * 60 * 60);
          if (timeDiffHr > 0) {
            const distMeters = haversine(
              { lat: last.lat, lng: last.lng },
              { lat, lng }
            );
            const distKm = distMeters / 1000;
            const speed = distKm / timeDiffHr;

            const speedLimit = bus.speedLimit || 60;

            if (speed > speedLimit) {
              // Create alert in DB without blocking socket
              if (mongoose.connection.readyState === 1) {
                SpeedAlert.create({
                  bus: bus._id,
                  driver: driverId,
                  speed: Number(speed.toFixed(2)),
                  speedLimit: speedLimit,
                  coordinates: { lat, lng },
                  triggeredAt: new Date(),
                }).catch((err) => {
                  if (!isTransientMongoError(err)) {
                    console.warn("[Socket] SpeedAlert DB save error:", err.message);
                  }
                });
              }

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
        }

        // 6. Store for next speed calculation
        lastDriverData.set(driverId, { lat, lng, timestamp: now });
      } catch (err) {
        if (!isTransientMongoError(err)) {
          console.error("[Socket] busLocation handler error:", err.message);
        }
      }
    });

    // Driver Online Check
    socket.on("checkDriverStatus", ({ driverId: reqDriverId }, callback) => {
      const isOnline = connectedDrivers.has(reqDriverId);
      if (typeof callback === "function") callback({ isOnline });
    });

    socket.on("disconnect", () => {
      if (driverId) {
        connectedDrivers.delete(driverId);
        driverBusCache.delete(driverId);
        io.emit("driverStatusUpdate", { driverId, isOnline: false });
      }
    });
  });
};

// 🔔 Send FCM Notification to students of a specific bus
const notifyBusArrival = async (busId, stopName) => {
  if (mongoose.connection.readyState !== 1) return;

  try {
    const students = await User.find({ subscribedBuses: busId }).lean();
    if (!students || students.length === 0) return;

    const tokensDocs = await NotificationToken.find({
      studentId: { $in: students.map((s) => s._id) },
    }).lean();
    const tokens = tokensDocs.map((t) => t.token).filter(Boolean);
    if (!tokens.length) return;

    const title = "🚌 Bus Approaching!";
    const body = stopName
      ? `Your bus is near checkpoint: ${stopName}`
      : "Your bus has reached a nearby stop.";

    await sendMulticastNotification(tokens, title, body);
  } catch (err) {
    if (!isTransientMongoError(err)) {
      console.error("[notifyBusArrival error]:", err.message);
    }
  }
};
