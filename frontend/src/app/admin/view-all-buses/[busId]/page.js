//admin/view-all-buses/[busId]/page.js
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import dynamic from "next/dynamic";
import LoadingSpinner from "@/components/LoadingSpinner";
import io from "socket.io-client";
import AdminSidebar from "@/components/AdminSidebar";
import { format } from "date-fns";

const MapWithNoSSR = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => <LoadingSpinner />,
});

const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL);

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

export default function AdminBusLivePage() {
  const { busId } = useParams();
  const [bus, setBus] = useState(null);
  const [location, setLocation] = useState(null);
  const [checkpoints, setCheckpoints] = useState([]);
  const [isDriverConnected, setIsDriverConnected] = useState(false);
  const [passedCheckpoints, setPassedCheckpoints] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [showAlerts, setShowAlerts] = useState(false);
  const [speed, setSpeed] = useState(null);
  const [lastUpdate, setLastUpdate] = useState({ time: null, coords: null });

  useEffect(() => {
    const fetchBus = async () => {
      const res = await api.get(`/buses/${busId}`);
      const busData = res.data;
      setBus(busData);

      const sanitizedStops = (busData.route?.stops || []).map((stop) => {
        const lat = parseFloat(stop.coordinates?.lat ?? stop.coordinates?.[1]);
        const lng = parseFloat(stop.coordinates?.lng ?? stop.coordinates?.[0]);
        return { ...stop, coordinates: { lat, lng } };
      });

      setCheckpoints(sanitizedStops);

      const loc = busData.driver?.currentLocation?.coordinates;
      if (loc?.length === 2) setLocation([loc[1], loc[0]]);

      const driverId = busData.driver?._id;
      if (driverId) {
        socket.emit("checkDriverStatus", { driverId }, ({ isOnline }) => {
          setIsDriverConnected(isOnline);
        });
      }

      socket.emit("join-bus-room", busId);
    };

    fetchBus();

    socket.on("updateLocation", (data) => {
      if (data.driverId === bus?.driver?._id) {
        const driverLatLng = [data.lat, data.lng];
        setLocation(driverLatLng);
        setIsDriverConnected(true);

        // ✅ Speed calculation
        const now = Date.now();
        if (
          lastUpdate.time &&
          lastUpdate.coords &&
          typeof lastUpdate.coords[0] === "number" &&
          typeof lastUpdate.coords[1] === "number"
        ) {
          const distanceMeters = getDistance(
            lastUpdate.coords[0],
            lastUpdate.coords[1],
            data.lat,
            data.lng
          );
          const timeSeconds = (now - lastUpdate.time) / 1000;
          const speedKmh = (distanceMeters / timeSeconds / 1000) * 3600;

          if (!isNaN(speedKmh) && isFinite(speedKmh)) {
            setSpeed(speedKmh.toFixed(1));
          }
        }

        setLastUpdate({ time: now, coords: [data.lat, data.lng] });

        // ✅ Checkpoint tracking logic
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

    return () => {
      socket.off("updateLocation");
    };
  }, [busId, checkpoints, passedCheckpoints, bus]);

  const fetchSpeedAlerts = async () => {
    try {
      const res = await api.get(`/buses/${busId}/speed-alerts?sort=desc`);
      setAlerts(res.data.alerts);
      setShowAlerts(true);
    } catch (err) {
      console.error("Error fetching speed alerts:", err);
    }
  };

  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return format(today, "yyyy-MM-dd"); // default to today
  });

  // Handle delete alerts for selected date
  const handleDeleteAlertsByDate = async () => {
    try {
      const res = await api.delete(
        `/buses/${busId}/speed-alerts?date=${selectedDate}`
      );
      alert(res.data.message);
      fetchSpeedAlerts(); // refresh alerts
    } catch (err) {
      console.error("Delete failed", err);
      alert("Failed to delete alerts");
    }
  };

  if (!bus) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-[#1f1b16] text-white">
      <AdminSidebar />
      <main className="p-4 md:p-8 md:ml-64">
        <div className="bg-[#3E2F2C] p-4 rounded-lg mb-6 shadow-md">
          <h2 className="text-xl font-bold">
            {bus.name} ({bus.number})
          </h2>
          <p>Driver: {bus.driver?.name || "N/A"}</p>
          <p>Phone: {bus.driver?.phone || "N/A"}</p>
          <p>Route: {bus.route?.name || "N/A"}</p>
          <p className="mt-2">
            Status:{" "}
            <span
              className={isDriverConnected ? "text-green-400" : "text-red-400"}
            >
              {isDriverConnected ? "Online" : "Offline"}
            </span>
          </p>

          {isDriverConnected && speed && (
            <p className="mt-1 text-yellow-300">
              Current Speed: <span className="font-semibold">{speed} km/h</span>
            </p>
          )}

          {/* Buttons */}
          <div className="flex flex-col md:flex-row gap-4 mt-4 items-start md:items-center">
            <button
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              onClick={fetchSpeedAlerts}
            >
              View Speed Alerts
            </button>

            <div className="flex items-center gap-2">
              <input
                type="date"
                className="bg-[#2e2e2e] border border-gray-500 text-white rounded px-2 py-1"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
              <button
                className="px-4 py-2 bg-yellow-700 text-white rounded hover:bg-yellow-800"
                onClick={handleDeleteAlertsByDate}
              >
                🗑️ Delete Alerts from Date
              </button>
            </div>
          </div>
        </div>

        {/* Map */}
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

        {/* Speed Alert Table */}
        {showAlerts && (
          <div className="mt-8 bg-[#2e2e2e] p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Speed Alerts</h3>
            {alerts.length === 0 ? (
              <p className="text-gray-400">No speed alerts found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-white">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-4 py-2">Timestamp</th>
                      <th className="px-4 py-2">Speed (km/h)</th>
                      <th className="px-4 py-2">Speed Limit</th>
                      <th className="px-4 py-2">Latitude</th>
                      <th className="px-4 py-2">Longitude</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alerts.map((alert, i) => (
                      <tr key={i} className="border-t border-gray-600">
                        <td className="px-4 py-2">
                          {new Date(alert.triggeredAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-2">{alert.speed?.toFixed(1)}</td>
                        <td className="px-4 py-2">{alert.speedLimit}</td>
                        <td className="px-4 py-2">{alert.coordinates?.lat}</td>
                        <td className="px-4 py-2">{alert.coordinates?.lng}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
