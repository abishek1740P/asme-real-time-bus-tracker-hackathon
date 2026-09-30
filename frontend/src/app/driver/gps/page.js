"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { useAuth } from "@/context/AuthContext";
import LoadingSpinner from "@/components/LoadingSpinner";
import {
  Radio,
  Navigation,
  Play,
  CheckCircle,
  MapPin,
  Compass,
  Activity,
  Layers,
  Sparkles,
} from "lucide-react";

const MapWithNoSSR = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => <LoadingSpinner />,
});

const arrivalThreshold = 200; // meters
const leaveThreshold = 300; // meters
const speedMetersPerSecond = (100 * 1000) / 3600; // 100 km/h in m/s

const haversineDistance = (p1, p2) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(p2.lat - p1.lat);
  const dLng = toRad(p2.lng - p1.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(p1.lat)) * Math.cos(toRad(p2.lat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export default function DriverGPSPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [busId, setBusId] = useState(null);
  const [busName, setBusName] = useState("");
  const [coords, setCoords] = useState({ lat: null, lng: null });
  const [checkpoints, setCheckpoints] = useState([]);
  const [simulate, setSimulate] = useState(false);
  const [tokenReady, setTokenReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Not logged in");
      router.push("/login");
    } else {
      setTokenReady(true);
    }
  }, [router]);

  useEffect(() => {
    if (loading || !tokenReady) return;

    if (!user) {
      toast.error("Please log in to access GPS");
      router.push("/login");
      return;
    }

    if (user.role !== "driver") {
      toast.error("Access denied: Drivers only");
      router.push(`/${user.role}`);
      return;
    }

    const fetchBusAndRoute = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await api.get("/drivers/me/assigned-bus", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const bus = res.data;
        setBusId(bus._id);
        setBusName(bus.name || "Assigned Bus");

        if (bus?.route?._id) {
          const routeRes = await api.get(`/routes/${bus.route._id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          const sanitizedStops = (routeRes.data.stops || []).map((stop) => ({
            name: stop.name,
            coordinates: {
              lat: parseFloat(
                stop.coordinates?.lat?.$numberDouble || stop.coordinates?.lat
              ),
              lng: parseFloat(
                stop.coordinates?.lng?.$numberDouble || stop.coordinates?.lng
              ),
            },
          }));

          setCheckpoints(sanitizedStops);
        }
      } catch {
        toast.error("Unable to fetch assigned bus/route");
      }
    };

    fetchBusAndRoute();
  }, [user, loading, tokenReady, router]);

  useEffect(() => {
    if (!busId || !user?._id) return;

    const socket = getSocket();
    let currentCheckpointIndex = -1;
    let hasArrived = false;
    let lastArrivedStop = null;
    let latestCoords = null;
    let timerId = null;

    const findNearestStop = (point) => {
      let nearestStop = null;
      let nearestIndex = -1;
      let minDistance = Infinity;

      checkpoints.forEach((stop, i) => {
        const dist = haversineDistance(point, stop.coordinates);
        if (dist < minDistance) {
          minDistance = dist;
          nearestStop = stop;
          nearestIndex = i;
        }
      });

      return { stop: nearestStop, index: nearestIndex, distance: minDistance };
    };

    let notificationQueue = Promise.resolve();

    const sendNotification = (title, body) => {
      notificationQueue = notificationQueue.then(() =>
        api
          .post("/notifications/send", { title, body, busId })
          .catch((err) => console.error("Notification error:", err))
      );
      return notificationQueue;
    };

    if (simulate) {
      const path = [
        { lat: 11.204751, lng: 76.894641 }, // Selvapuram
        { lat: 11.15, lng: 76.91 },
        { lat: 11.12, lng: 76.925 },
        { lat: 11.08, lng: 76.945 },
        { lat: 10.98876, lng: 76.959711 }, // Ukkadam
        { lat: 10.9885, lng: 76.961 },
        { lat: 10.988149, lng: 76.963971 }, // Ukkadam Bypass
        { lat: 10.991, lng: 76.97 },
        { lat: 10.994, lng: 76.976 },
        { lat: 10.997668, lng: 76.984999 }, // Sungam
        { lat: 10.998, lng: 76.99 },
        { lat: 10.99923, lng: 77.02328 }, // Singanallur
        { lat: 11.0, lng: 77.035 },
        { lat: 11.002873, lng: 77.062279 }, // Ondipudhur
        { lat: 11.01, lng: 77.08 },
        { lat: 11.02, lng: 77.105 },
        { lat: 11.025493, lng: 77.124774 }, // Sulur
        { lat: 11.018, lng: 77.14 },
        { lat: 11.01, lng: 77.155 },
        { lat: 10.99, lng: 77.175 },
        { lat: 10.97, lng: 77.18 },
        { lat: 10.95, lng: 77.17 },
        { lat: 10.941926, lng: 76.901515 }, // SRIT
      ];

      let index = 0;

      const moveToNextPoint = async () => {
        if (index >= path.length) {
          timerId = setTimeout(async () => {
            if (lastArrivedStop && latestCoords?.lat && latestCoords?.lng) {
              const finalDistance = haversineDistance(
                latestCoords,
                lastArrivedStop.coordinates
              );
              if (finalDistance > leaveThreshold) {
                await sendNotification(
                  "🚍 Bus Left",
                  `Bus has departed from ${lastArrivedStop.name}`
                );
              }
            }
            toast.success("GPS simulation completed");
          }, 4000);
          return;
        }

        const point = path[index];
        const next = path[index + 1];
        latestCoords = point;
        setCoords(point);
        if (socket?.connected) socket.emit("busLocation", point);

        const { stop, index: stopIndex, distance } = findNearestStop(point);

        if (
          distance <= arrivalThreshold &&
          stopIndex !== currentCheckpointIndex
        ) {
          currentCheckpointIndex = stopIndex;
          hasArrived = true;
          lastArrivedStop = stop;
          await sendNotification(
            "📍 Bus Arrived",
            `Bus has reached ${stop.name}`
          );
        }

        if (hasArrived && distance > leaveThreshold) {
          hasArrived = false;
          if (lastArrivedStop) {
            await sendNotification(
              "🚍 Bus Left",
              `Bus has departed from ${lastArrivedStop.name}`
            );
          }
          lastArrivedStop = null;
        }

        if (!next) return;
        const delay =
          (haversineDistance(point, next) / speedMetersPerSecond) * 10;
        index++;
        timerId = setTimeout(moveToNextPoint, delay);
      };

      moveToNextPoint();
      return () => {
        if (timerId) clearTimeout(timerId);
        index = path.length;
      };
    } else {
      if (!navigator.geolocation) {
        toast.error("Geolocation not supported by this browser");
        return;
      }

      const watchId = navigator.geolocation.watchPosition(
        async (position) => {
          const point = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          latestCoords = point;
          setCoords(point);
          if (socket?.connected) socket.emit("busLocation", point);

          const { stop, index: stopIndex, distance } = findNearestStop(point);

          if (
            distance <= arrivalThreshold &&
            stopIndex !== currentCheckpointIndex
          ) {
            currentCheckpointIndex = stopIndex;
            hasArrived = true;
            await sendNotification(
              "📍 Bus Arrived",
              `Bus has reached ${stop.name}`
            );
          }

          if (hasArrived && distance > leaveThreshold) {
            hasArrived = false;
            await sendNotification(
              "🚍 Bus Left",
              `Bus has departed from ${stop.name}`
            );
          }
        },
        (error) => toast.error(`GPS Error: ${error.message}`),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [busId, user?._id, simulate, checkpoints]);

  if (loading || !user || user.role !== "driver") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#140c08] text-white">
        <div className="w-10 h-10 border-4 border-[#c9a97f] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#140c08] text-[#F3E5D7] pt-20 md:pt-24 pb-16 px-4 md:px-8 max-w-5xl mx-auto flex flex-col items-center">
      {/* Header Banner */}
      <div className="w-full text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
          <Radio size={14} className="animate-pulse" />
          {simulate ? "Simulation Mode Active" : "Live Hardware Telemetry"}
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white">
          GPS Beacon Transmission
        </h1>
        <p className="text-xs md:text-sm text-[#8c7464] mt-1">
          {simulate
            ? "Broadcasting synthetic waypoint coordinates across Coimbatore transit route."
            : "Transmitting your real device GPS coordinates to live passenger tracking apps."}
        </p>
      </div>

      {/* Control Strip */}
      <div className="w-full bg-[#1e130c]/90 border border-[#3d2618] rounded-2xl p-4 md:p-5 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-[#c9a97f]">
            <Navigation size={20} />
          </div>
          <div>
            <span className="text-xs text-[#8c7464] block">Broadcasting For</span>
            <span className="text-white font-bold text-sm">{busName}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {!simulate ? (
            <button
              onClick={() => {
                setSimulate(true);
                toast.success("Simulation route started");
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#b3885c] to-[#c9a97f] hover:from-[#c9a97f] hover:to-[#dfc39e] text-[#140c08] font-bold text-xs shadow-md transition-all active:scale-95"
            >
              <Sparkles size={14} />
              Simulate Transit Route
            </button>
          ) : (
            <button
              onClick={() => {
                setSimulate(false);
                toast("Switched back to device GPS");
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#2a1a11] hover:bg-[#342217] border border-[#3d2618] text-[#c9a97f] text-xs font-semibold transition-colors"
            >
              <Radio size={14} />
              Use Live Device GPS
            </button>
          )}
        </div>
      </div>

      {/* Telemetry Coordinates Badges */}
      {coords.lat && coords.lng ? (
        <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="p-3.5 rounded-xl bg-[#1e130c] border border-[#2e1c10] text-center">
            <span className="text-[11px] text-[#8c7464] block">Latitude</span>
            <span className="font-mono text-emerald-400 font-bold text-xs md:text-sm">
              {coords.lat.toFixed(6)}
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-[#1e130c] border border-[#2e1c10] text-center">
            <span className="text-[11px] text-[#8c7464] block">Longitude</span>
            <span className="font-mono text-emerald-400 font-bold text-xs md:text-sm">
              {coords.lng.toFixed(6)}
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-[#1e130c] border border-[#2e1c10] text-center">
            <span className="text-[11px] text-[#8c7464] block">Waypoints</span>
            <span className="text-white font-bold text-xs md:text-sm">
              {checkpoints.length} stops
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-[#1e130c] border border-[#2e1c10] text-center">
            <span className="text-[11px] text-[#8c7464] block">Socket Relay</span>
            <span className="text-emerald-400 font-semibold text-xs flex items-center justify-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Connected
            </span>
          </div>
        </div>
      ) : (
        <div className="w-full p-4 mb-6 rounded-2xl bg-[#1e130c]/60 border border-[#2e1c10] flex items-center justify-center gap-2 text-xs text-[#a89078]">
          <div className="w-4 h-4 border-2 border-[#c9a97f] border-t-transparent rounded-full animate-spin" />
          <span>Locking GPS satellite fix... please grant location permissions if prompted.</span>
        </div>
      )}

      {/* Map View Container */}
      <div className="w-full h-[450px] md:h-[520px] rounded-3xl overflow-hidden border border-[#3d2618] shadow-2xl bg-[#1e130c]">
        {coords.lat && coords.lng ? (
          <MapWithNoSSR
            lat={coords.lat}
            lng={coords.lng}
            isConnected={true}
            checkpoints={checkpoints}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-[#8c7464] gap-2">
            <Compass size={36} className="text-[#5a4232] animate-pulse" />
            <p className="text-xs">Waiting for GPS coordinates fix...</p>
          </div>
        )}
      </div>
    </div>
  );
}
