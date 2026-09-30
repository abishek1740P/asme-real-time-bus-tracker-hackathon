//student/buses/[busId]/page.js
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import dynamic from "next/dynamic";
import LoadingSpinner from "@/components/LoadingSpinner";
import io from "socket.io-client";
import toast from "react-hot-toast";
import CustomToast from "@/components/CustomToast";

// No SSR for map
const MapWithNoSSR = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => <LoadingSpinner />,
});

const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL);

// Haversine formula to calculate distance in meters
function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function BusLivePage() {
  const { busId } = useParams();
  const [bus, setBus] = useState(null);
  const [checkpoints, setCheckpoints] = useState([]);
  const [location, setLocation] = useState(null);
  const [isDriverConnected, setIsDriverConnected] = useState(false);
  const [passedCheckpoints, setPassedCheckpoints] = useState([]);
  const [speed, setSpeed] = useState(null);
  const [lastUpdate, setLastUpdate] = useState({ time: null, coords: null });

  useEffect(() => {
    const fetchBus = async () => {
      const res = await api.get(`/buses/${busId}`);
      const busData = res.data;
      setBus(busData);

      // 🔧 Sanitize stops
      const sanitizedStops = (busData.route?.stops || []).map((stop) => {
        const latRaw = stop.coordinates?.lat ?? stop.coordinates?.[1];
        const lngRaw = stop.coordinates?.lng ?? stop.coordinates?.[0];

        const lat = parseFloat(latRaw?.$numberDouble ?? latRaw);
        const lng = parseFloat(lngRaw?.$numberDouble ?? lngRaw);

        return {
          ...stop,
          coordinates: { lat, lng },
        };
      });

      setCheckpoints(sanitizedStops);

      // Set initial location
      const loc = busData.driver?.currentLocation?.coordinates;
      if (loc && loc.length === 2) {
        setLocation([loc[1], loc[0]]);
      }

      const driverId = busData.driver?._id;
      if (driverId) {
        socket.emit("checkDriverStatus", { driverId }, ({ isOnline }) => {
          setIsDriverConnected(isOnline);
        });
      }

      if (busId) {
        socket.emit("join-bus-room", busId);
      }
    };

    fetchBus();

    // Listen for live updates
    socket.on("updateLocation", (data) => {
      if (data.driverId === bus?.driver?._id) {
        const driverLatLng = [data.lat, data.lng];
        setLocation(driverLatLng);
        setIsDriverConnected(true);

        // Speed calculation logic
        const now = Date.now();
        const previous = lastUpdate;

        if (
          previous.time &&
          previous.coords &&
          typeof previous.coords[0] === "number" &&
          typeof previous.coords[1] === "number"
        ) {
          const distanceMeters = getDistance(
            previous.coords[0],
            previous.coords[1],
            data.lat,
            data.lng
          );

          const timeSeconds = (now - previous.time) / 1000;
          const speedKmh = (distanceMeters / timeSeconds / 1000) * 3600;

          if (!isNaN(speedKmh) && isFinite(speedKmh)) {
            setSpeed(speedKmh.toFixed(1) || "0.0");
          }
        }

        setLastUpdate({ time: now, coords: [data.lat, data.lng] });

        // Checkpoints logic
        const newlyPassed = [];
        checkpoints.forEach((stop, index) => {
          const stopLat = stop.coordinates?.lat;
          const stopLng = stop.coordinates?.lng;

          if (typeof stopLat !== "number" || typeof stopLng !== "number")
            return;

          const distance = getDistance(data.lat, data.lng, stopLat, stopLng);
          if (distance < 50 && !passedCheckpoints.includes(index)) {
            newlyPassed.push(index);
          }
        });

        if (newlyPassed.length > 0) {
          setPassedCheckpoints((prev) => [
            ...new Set([...prev, ...newlyPassed]),
          ]);
        }
      }
    });

    socket.on("checkpoint-reached", (data) => {
      if (data?.busId === busId) {
        toast.custom(() => (
          <CustomToast
            type="info"
            message={`🛑 Bus has reached checkpoint: ${data.stopName}`}
          />
        ));
      }
    });

    return () => {
      socket.off("updateLocation");
      socket.off("checkpoint-reached");
    };
  }, [busId, checkpoints, passedCheckpoints, bus]);

  if (!bus) return <LoadingSpinner />;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Telemetry Header Card */}
      <div className="bg-[#241710] rounded-3xl p-6 border border-[#442918] shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🚍</span>
              <h2 className="text-xl sm:text-2xl font-black text-[#F3E5D7]">
                {bus.name}
              </h2>
              <span className="font-mono text-xs px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-[#d8c0ad] font-semibold">
                {bus.number}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#c4aa97]">
              Route: <span className="text-[#F3E5D7] font-semibold">{bus.route?.name || "Regular Line"}</span>
            </p>
          </div>

          {/* Telemetry Stats Strip */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Online Status */}
            <div className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl border text-xs font-semibold ${
              isDriverConnected
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                : "bg-red-500/10 text-red-400 border-red-500/30"
            }`}>
              <span className={`w-2.5 h-2.5 rounded-full ${isDriverConnected ? "bg-emerald-400 animate-ping" : "bg-red-400"}`}></span>
              <span>{isDriverConnected ? "Driver Online" : "Driver Offline"}</span>
            </div>

            {/* Live Speed */}
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-black/30 border border-white/10 text-xs">
              <span className="text-[#8c7464]">Speed:</span>
              <span className="font-mono font-bold text-amber-300 text-sm">
                {speed ? `${speed} km/h` : "0.0 km/h"}
              </span>
            </div>

            {/* Driver Contact */}
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-black/30 border border-white/10 text-xs">
              <span className="text-[#8c7464]">Driver:</span>
              <span className="font-semibold text-[#F3E5D7]">
                {bus.driver?.name || "TBA"}
              </span>
              {bus.driver?.phone && (
                <a
                  href={`tel:${bus.driver.phone}`}
                  className="ml-1 text-[#c9a97f] hover:underline"
                >
                  📞 {bus.driver.phone}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Map & Checkpoints Dual Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map View */}
        <div className="lg:col-span-2 h-[450px] sm:h-[520px] rounded-3xl overflow-hidden border border-[#442918] shadow-2xl relative bg-[#180f0a]">
          {location ? (
            <MapWithNoSSR
              lat={location[0]}
              lng={location[1]}
              isConnected={isDriverConnected}
              checkpoints={checkpoints}
              passedIndices={passedCheckpoints}
              speed={speed}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-3">
              <div className="w-10 h-10 border-3 border-[#c9a97f] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-[#b89f8b]">Awaiting GPS location signal from bus...</p>
            </div>
          )}
        </div>

        {/* Route Stops / Timeline */}
        <div className="bg-[#241710] rounded-3xl p-6 border border-[#442918] shadow-2xl flex flex-col h-[450px] sm:h-[520px]">
          <div className="flex items-center justify-between pb-3 border-b border-[#3b2315] mb-4">
            <h3 className="font-bold text-[#F3E5D7] flex items-center gap-2">
              <span>📍</span> Route Stops
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[#c9a97f]">
              {checkpoints.length} Checkpoints
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
            {checkpoints.length === 0 ? (
              <p className="text-xs text-[#8c7464] text-center py-10">No stop checkpoints configured for this route.</p>
            ) : (
              checkpoints.map((stop, idx) => {
                const isPassed = passedCheckpoints.includes(idx);
                const isFirst = idx === 0;
                const isLast = idx === checkpoints.length - 1;

                return (
                  <div
                    key={idx}
                    className={`flex items-start gap-3 p-3 rounded-2xl border transition-all ${
                      isPassed
                        ? "bg-emerald-950/20 border-emerald-800/40 text-emerald-300"
                        : "bg-black/20 border-white/5 text-[#d1b8a3]"
                    }`}
                  >
                    <div className="flex flex-col items-center pt-0.5">
                      <div className={`w-3 h-3 rounded-full ${
                        isFirst
                          ? "bg-emerald-400 ring-4 ring-emerald-500/20"
                          : isLast
                          ? "bg-amber-400 ring-4 ring-amber-500/20"
                          : isPassed
                          ? "bg-emerald-500"
                          : "bg-zinc-600"
                      }`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="font-medium text-xs sm:text-sm text-[#F3E5D7] truncate">
                          {stop.name || `Stop #${idx + 1}`}
                        </p>
                        {isFirst && <span className="text-[10px] text-emerald-400 font-semibold uppercase">Start</span>}
                        {isLast && <span className="text-[10px] text-amber-400 font-semibold uppercase">Terminal</span>}
                      </div>
                      <p className="text-[11px] text-[#8c7464] mt-0.5">
                        {isPassed ? "✅ Checkpoint Passed" : "⏳ Pending Arrival"}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
