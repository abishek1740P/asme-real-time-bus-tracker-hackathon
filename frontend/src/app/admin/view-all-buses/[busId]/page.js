"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import dynamic from "next/dynamic";
import LoadingSpinner from "@/components/LoadingSpinner";
import io from "socket.io-client";
import AdminSidebar from "@/components/AdminSidebar";
import { format } from "date-fns";
import toast from "react-hot-toast";
import {
  Bus,
  MapPin,
  User,
  Phone,
  Gauge,
  AlertTriangle,
  Calendar,
  Trash2,
  ChevronDown,
  ChevronUp,
  Activity,
  Radio,
} from "lucide-react";

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
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return format(today, "yyyy-MM-dd");
  });

  useEffect(() => {
    const fetchBus = async () => {
      try {
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
      } catch (err) {
        toast.error("Failed to load bus data");
      }
    };

    fetchBus();

    socket.on("updateLocation", (data) => {
      if (data.driverId === bus?.driver?._id) {
        const driverLatLng = [data.lat, data.lng];
        setLocation(driverLatLng);
        setIsDriverConnected(true);

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
  }, [busId, checkpoints, passedCheckpoints, bus, lastUpdate]);

  const fetchSpeedAlerts = async () => {
    try {
      const res = await api.get(`/buses/${busId}/speed-alerts?sort=desc`);
      setAlerts(res.data.alerts || []);
      setShowAlerts(true);
    } catch (err) {
      toast.error("Error fetching speed alerts");
    }
  };

  const handleDeleteAlertsByDate = async () => {
    if (confirm(`Delete all alerts for date ${selectedDate}?`)) {
      try {
        const res = await api.delete(
          `/buses/${busId}/speed-alerts?date=${selectedDate}`
        );
        toast.success(res.data.message || "Alerts deleted");
        fetchSpeedAlerts();
      } catch (err) {
        toast.error("Failed to delete alerts");
      }
    }
  };

  if (!bus) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-[#140c08] text-[#F3E5D7]">
      <AdminSidebar />
      <main className="pt-20 md:pt-24 pb-16 px-4 md:px-8 md:ml-64 max-w-7xl">
        {/* Top Info Card */}
        <div className="bg-[#1e130c]/90 border border-[#3d2618] p-5 md:p-6 rounded-2xl mb-6 shadow-xl backdrop-blur-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#2e1c10]">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                  <Bus className="text-[#c9a97f]" />
                  {bus.name}
                </h1>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#2a1a11] text-[#c9a97f] border border-[#3d2618]">
                  {bus.number}
                </span>
              </div>
              <p className="text-xs text-[#8c7464] mt-1 flex items-center gap-1.5">
                <MapPin size={13} className="text-orange-400" />
                Route: <span className="text-white font-medium">{bus.route?.name || "Not Assigned"}</span>
              </p>
            </div>

            {/* Connection Status Badge */}
            <div className="flex items-center gap-3">
              <div
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border ${
                  isDriverConnected
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "bg-red-500/10 border-red-500/30 text-red-400"
                }`}
              >
                <Radio
                  size={14}
                  className={isDriverConnected ? "animate-pulse" : ""}
                />
                Driver {isDriverConnected ? "Online & Transmitting" : "Offline"}
              </div>

              {speed && isDriverConnected && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
                  <Gauge size={14} />
                  {speed} km/h
                </div>
              )}
            </div>
          </div>

          {/* Details Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 text-xs">
            <div>
              <span className="text-[#8c7464] block mb-0.5">Assigned Driver</span>
              <span className="text-white font-medium flex items-center gap-1.5">
                <User size={13} className="text-blue-400" />
                {bus.driver?.name || "N/A"}
              </span>
            </div>
            <div>
              <span className="text-[#8c7464] block mb-0.5">Contact Phone</span>
              <span className="text-white font-medium flex items-center gap-1.5">
                <Phone size={13} className="text-emerald-400" />
                {bus.driver?.phone || "N/A"}
              </span>
            </div>
            <div>
              <span className="text-[#8c7464] block mb-0.5">Speed Threshold</span>
              <span className="text-white font-medium flex items-center gap-1.5">
                <Gauge size={13} className="text-amber-400" />
                {bus.speedLimit || "—"} km/h
              </span>
            </div>
            <div>
              <span className="text-[#8c7464] block mb-0.5">Stops Passed</span>
              <span className="text-white font-medium flex items-center gap-1.5">
                <Activity size={13} className="text-purple-400" />
                {passedCheckpoints.length} / {checkpoints.length} stops
              </span>
            </div>
          </div>

          {/* Actions & Speed Alert Management */}
          <div className="flex flex-wrap items-center gap-3 pt-5 mt-4 border-t border-[#2e1c10]">
            <button
              onClick={() => {
                if (showAlerts) setShowAlerts(false);
                else fetchSpeedAlerts();
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2a1a11] hover:bg-[#342217] border border-[#3d2618] text-amber-300 text-xs font-semibold transition-colors"
            >
              <AlertTriangle size={14} />
              {showAlerts ? "Hide Speed Alerts" : "View Speed Alerts"}
              {showAlerts ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            <div className="flex items-center gap-2 ml-auto">
              <input
                type="date"
                className="bg-[#140c08] border border-[#3d2618] text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-[#c9a97f]"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
              <button
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 text-red-300 text-xs rounded-xl font-medium transition-colors"
                onClick={handleDeleteAlertsByDate}
              >
                <Trash2 size={13} />
                Prune Date
              </button>
            </div>
          </div>
        </div>

        {/* Speed Alert Table Collapsible */}
        {showAlerts && (
          <div className="mb-6 bg-[#1e130c]/90 border border-[#3d2618] p-5 rounded-2xl shadow-xl animate-fadeIn">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
              <AlertTriangle size={16} className="text-amber-400" />
              Recorded Speed Overlimit Incidents ({alerts.length})
            </h3>
            {alerts.length === 0 ? (
              <p className="text-xs text-[#8c7464] py-4 text-center">
                Clean safety record — no speed overlimit alerts logged for this vehicle.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs text-white">
                  <thead>
                    <tr className="border-b border-[#2e1c10] text-[#8c7464]">
                      <th className="px-3 py-2 text-left">Incident Timestamp</th>
                      <th className="px-3 py-2 text-left">Recorded Speed</th>
                      <th className="px-3 py-2 text-left">Speed Limit</th>
                      <th className="px-3 py-2 text-left">GPS Coordinates</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alerts.map((alert, i) => (
                      <tr key={i} className="border-b border-[#2e1c10]/50 hover:bg-[#2a1a11]/40">
                        <td className="px-3 py-2.5">
                          {new Date(alert.triggeredAt).toLocaleString()}
                        </td>
                        <td className="px-3 py-2.5 font-bold text-amber-400">
                          {alert.speed?.toFixed(1)} km/h
                        </td>
                        <td className="px-3 py-2.5 text-[#8c7464]">
                          {alert.speedLimit} km/h
                        </td>
                        <td className="px-3 py-2.5 text-xs text-[#a89078] font-mono">
                          {alert.coordinates?.lat?.toFixed(5)}, {alert.coordinates?.lng?.toFixed(5)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Live Map Display */}
        <div className="h-[520px] rounded-2xl overflow-hidden border border-[#3d2618] shadow-2xl bg-[#1e130c] relative">
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
            <div className="h-full flex flex-col items-center justify-center gap-3 text-[#8c7464]">
              <div className="w-8 h-8 border-3 border-[#c9a97f] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs">Awaiting driver GPS coordinates broadcast...</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
