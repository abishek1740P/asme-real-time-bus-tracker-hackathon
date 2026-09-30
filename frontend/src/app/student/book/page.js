"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import toast from "react-hot-toast";
import io from "socket.io-client";
import {
  Bus,
  Search,
  Mic,
  MicOff,
  MapPin,
  ArrowRight,
  Radio,
  X,
  Navigation,
  AlertCircle,
} from "lucide-react";

const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL);

export default function BookBusesPage() {
  const [buses, setBuses] = useState([]);
  const [filteredBuses, setFilteredBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [isListeningFrom, setIsListeningFrom] = useState(false);
  const [isListeningTo, setIsListeningTo] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [driverStatuses, setDriverStatuses] = useState({});
  const recognitionFromRef = useRef(null);
  const recognitionToRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SpeechRecognition) {
        setSpeechSupported(false);
        return;
      }

      const recognitionFrom = new SpeechRecognition();
      recognitionFrom.continuous = false;
      recognitionFrom.interimResults = false;
      recognitionFrom.lang = "en-US";

      recognitionFrom.onstart = () => setIsListeningFrom(true);
      recognitionFrom.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setFromLocation(transcript);
        setIsListeningFrom(false);
      };
      recognitionFrom.onerror = () => setIsListeningFrom(false);
      recognitionFrom.onend = () => setIsListeningFrom(false);

      const recognitionTo = new SpeechRecognition();
      recognitionTo.continuous = false;
      recognitionTo.interimResults = false;
      recognitionTo.lang = "en-US";

      recognitionTo.onstart = () => setIsListeningTo(true);
      recognitionTo.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setToLocation(transcript);
        setIsListeningTo(false);
      };
      recognitionTo.onerror = () => setIsListeningTo(false);
      recognitionTo.onend = () => setIsListeningTo(false);

      recognitionFromRef.current = recognitionFrom;
      recognitionToRef.current = recognitionTo;
    }
  }, []);

  const checkDriverStatuses = (busList) => {
    busList.forEach((bus) => {
      const driverId = bus.driver?._id;
      if (driverId) {
        socket.emit("checkDriverStatus", { driverId }, (response) => {
          if (response && typeof response.isOnline === "boolean") {
            setDriverStatuses((prev) => ({
              ...prev,
              [driverId]: response.isOnline,
            }));
          }
        });
      }
    });
  };

  useEffect(() => {
    const fetchBuses = async () => {
      try {
        setLoading(true);
        const res = await api.get("/buses");
        setBuses(res.data || []);
        setFilteredBuses(res.data || []);
        checkDriverStatuses(res.data || []);
      } catch (err) {
        setError("Failed to load transit buses");
      } finally {
        setLoading(false);
      }
    };

    fetchBuses();

    socket.on("driverStatusChanged", ({ driverId, isOnline }) => {
      setDriverStatuses((prev) => ({
        ...prev,
        [driverId]: isOnline,
      }));
    });

    const interval = setInterval(() => {
      if (buses.length > 0) {
        checkDriverStatuses(buses);
      }
    }, 15000);

    return () => {
      socket.off("driverStatusChanged");
      clearInterval(interval);
    };
  }, [buses.length]);

  const isDriverOnline = (bus) => {
    const driverId = bus.driver?._id;
    return driverId ? Boolean(driverStatuses[driverId]) : false;
  };

  const startListeningFrom = () => {
    if (recognitionFromRef.current && !isListeningFrom) {
      try {
        recognitionFromRef.current.start();
      } catch (e) {}
    }
  };

  const stopListeningFrom = () => {
    if (recognitionFromRef.current) {
      recognitionFromRef.current.stop();
      setIsListeningFrom(false);
    }
  };

  const startListeningTo = () => {
    if (recognitionToRef.current && !isListeningTo) {
      try {
        recognitionToRef.current.start();
      } catch (e) {}
    }
  };

  const stopListeningTo = () => {
    if (recognitionToRef.current) {
      recognitionToRef.current.stop();
      setIsListeningTo(false);
    }
  };

  const clearFilters = () => {
    setFromLocation("");
    setToLocation("");
    setSearchTerm("");
  };

  useEffect(() => {
    if (!searchTerm && !fromLocation && !toLocation) {
      setFilteredBuses(buses);
    } else {
      const searchTermLower = searchTerm.toLowerCase();
      const fromLower = fromLocation.toLowerCase();
      const toLower = toLocation.toLowerCase();

      const filtered = buses.filter((bus) => {
        const generalSearchMatch = searchTerm
          ? bus.name.toLowerCase().includes(searchTermLower) ||
            bus.number.toLowerCase().includes(searchTermLower) ||
            (bus.route?.name?.toLowerCase() || "").includes(searchTermLower) ||
            bus.route?.stops?.some((stop) =>
              (stop.name || "").toLowerCase().includes(searchTermLower)
            )
          : true;

        let fromToMatch = true;
        if (fromLocation || toLocation) {
          const stops = bus.route?.stops || [];
          const stopNames = stops.map((stop) => stop.name.toLowerCase());

          if (fromLocation && toLocation) {
            const fromIndex = stopNames.findIndex((stop) =>
              stop.includes(fromLower)
            );
            const toIndex = stopNames.findIndex((stop) =>
              stop.includes(toLower)
            );
            fromToMatch =
              fromIndex !== -1 && toIndex !== -1 && fromIndex < toIndex;
          } else if (fromLocation) {
            fromToMatch = stopNames.some((stop) => stop.includes(fromLower));
          } else if (toLocation) {
            fromToMatch = stopNames.some((stop) => stop.includes(toLower));
          }
        }

        return generalSearchMatch && fromToMatch;
      });
      setFilteredBuses(filtered);
    }
  }, [searchTerm, fromLocation, toLocation, buses]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
          <Bus className="text-[#c9a97f]" />
          Book Transit Bus Ticket
        </h1>
        <p className="text-xs md:text-sm text-[#8c7464] mt-0.5">
          Select boarding point and destination to find available buses with instant seat booking.
        </p>
      </div>

      {/* Route Finder Filter Card */}
      <div className="bg-[#1e130c]/90 border border-[#3d2618] rounded-3xl p-5 md:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#2e1c10]">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Navigation size={16} className="text-[#c9a97f]" />
            Find Bus by Route Stops
          </h2>
          {(fromLocation || toLocation || searchTerm) && (
            <button
              onClick={clearFilters}
              className="text-xs text-[#c9a97f] hover:text-white transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* From Input */}
          <div>
            <label className="block text-xs text-[#a89078] mb-1.5 font-medium">
              Boarding Stop (From)
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. Gandhipuram or Campus..."
                value={fromLocation}
                onChange={(e) => setFromLocation(e.target.value)}
                className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-[#140c08] border border-[#3d2618] text-white text-xs focus:outline-none focus:border-[#c9a97f] transition-colors"
              />
              {speechSupported && (
                <button
                  type="button"
                  onClick={() =>
                    isListeningFrom ? stopListeningFrom() : startListeningFrom()
                  }
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors ${
                    isListeningFrom
                      ? "bg-red-500 text-white animate-pulse"
                      : "text-[#8c7464] hover:text-[#c9a97f]"
                  }`}
                  title="Voice input"
                >
                  {isListeningFrom ? <MicOff size={14} /> : <Mic size={14} />}
                </button>
              )}
            </div>
          </div>

          {/* To Input */}
          <div>
            <label className="block text-xs text-[#a89078] mb-1.5 font-medium">
              Destination Stop (To)
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. SRIT Campus or Ukkadam..."
                value={toLocation}
                onChange={(e) => setToLocation(e.target.value)}
                className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-[#140c08] border border-[#3d2618] text-white text-xs focus:outline-none focus:border-[#c9a97f] transition-colors"
              />
              {speechSupported && (
                <button
                  type="button"
                  onClick={() =>
                    isListeningTo ? stopListeningTo() : startListeningTo()
                  }
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors ${
                    isListeningTo
                      ? "bg-red-500 text-white animate-pulse"
                      : "text-[#8c7464] hover:text-[#c9a97f]"
                  }`}
                  title="Voice input"
                >
                  {isListeningTo ? <MicOff size={14} /> : <Mic size={14} />}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Selected Route Visual Strip */}
        {(fromLocation || toLocation) && (
          <div className="pt-2 flex items-center justify-center">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#140c08] border border-[#2e1c10] text-xs text-[#F3E5D7]">
              <span className="text-white font-medium">{fromLocation || "Any Stop"}</span>
              <ArrowRight size={13} className="text-[#c9a97f]" />
              <span className="text-white font-medium">{toLocation || "Any Stop"}</span>
            </span>
          </div>
        )}
      </div>

      {/* General Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8c7464]" />
        <input
          type="text"
          placeholder="Filter by bus name or number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#1e130c]/70 border border-[#2e1c10] text-xs md:text-sm text-[#F3E5D7] placeholder-[#8c7464] focus:outline-none focus:border-[#c9a97f]"
        />
      </div>

      {/* Bus Listing */}
      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-3 border-[#c9a97f] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-[#8c7464]">Searching routes...</p>
        </div>
      ) : error ? (
        <p className="text-red-400 text-xs text-center py-4">{error}</p>
      ) : filteredBuses.length === 0 ? (
        <div className="text-center py-16 px-4 bg-[#1e130c]/40 rounded-2xl border border-[#2e1c10]">
          <AlertCircle size={40} className="mx-auto text-[#8c7464] mb-3" />
          <p className="text-base text-[#F3E5D7] font-semibold">No matching buses found</p>
          <p className="text-xs text-[#8c7464] mt-1">Try modifying your boarding or destination stops</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-[#8c7464]">
            <span>Available Route Vehicles</span>
            <span>{filteredBuses.length} buses found</span>
          </div>

          <div className="grid gap-3">
            {filteredBuses.map((bus) => (
              <div
                key={bus._id}
                onClick={() => router.push(`/student/book/${bus._id}`)}
                className="group bg-[#1e130c]/80 hover:bg-[#25170f] border border-[#2e1c10] hover:border-[#c9a97f]/50 p-4 md:p-5 rounded-2xl shadow-lg transition-all duration-200 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-bold text-white group-hover:text-[#c9a97f] transition-colors">
                      {bus.name}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#2a1a11] text-[#c9a97f] border border-[#3d2618]">
                      {bus.number}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#8c7464] mt-2">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isDriverOnline(bus)
                            ? "bg-emerald-400 animate-pulse"
                            : "bg-red-400/80"
                        }`}
                      />
                      <span className={isDriverOnline(bus) ? "text-emerald-400 font-medium" : "text-[#8c7464]"}>
                        Driver {isDriverOnline(bus) ? "Online" : "Offline"}
                      </span>
                    </div>

                    <span>•</span>

                    <span className="text-[#a89078]">
                      Route: {bus.route?.name || "Unassigned"}
                    </span>

                    {bus.route?.stops && (
                      <>
                        <span>•</span>
                        <span className="text-[#8c7464]">
                          {bus.route.stops.length} stops
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/student/book/${bus._id}`);
                  }}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#b3885c] to-[#c9a97f] hover:from-[#c9a97f] hover:to-[#dfc39e] text-[#140c08] font-bold text-xs shadow-md transition-all active:scale-95 self-start sm:self-auto"
                >
                  Select & Book Seats
                  <ArrowRight size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
