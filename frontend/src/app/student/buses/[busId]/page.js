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
    <div className="space-y-4 p-4">
      <div className="bg-[#3E2F2C] p-4 rounded-lg text-white shadow-md">
        <h2 className="text-xl font-bold">
          {bus.name} ({bus.number})
        </h2>
        <p className="text-sm text-[#CDBFB4]">
          Driver: {bus.driver?.name || "N/A"}
        </p>
        <p className="text-sm text-[#CDBFB4]">
          Phone: {bus.driver?.phone || "N/A"}
        </p>
        <p className="text-sm text-[#CDBFB4]">
          Route: {bus.route?.name || "N/A"}
        </p>
        <p className="text-sm mt-2">
          Status:{" "}
          <span
            className={isDriverConnected ? "text-green-400" : "text-red-400"}
          >
            {isDriverConnected ? "Driver Online" : "Driver Offline"}
          </span>
        </p>
      </div>

      <div className="h-[400px] rounded-lg overflow-hidden border border-gray-600">
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
          <LoadingSpinner />
        )}
      </div>
    </div>
  );
}
