"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { getFcmToken } from "@/lib/firebase";
import toast from "react-hot-toast";
import CustomToast from "@/components/CustomToast";
import io from "socket.io-client";

const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL);

export default function StudentBusesPage() {
  const [buses, setBuses] = useState([]);
  const [filteredBuses, setFilteredBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [subscribedBuses, setSubscribedBuses] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [isListeningFrom, setIsListeningFrom] = useState(false);
  const [isListeningTo, setIsListeningTo] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [driverStatuses, setDriverStatuses] = useState({}); // Track driver statuses
  const recognitionFromRef = useRef(null);
  const recognitionToRef = useRef(null);
  const router = useRouter();

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SpeechRecognition) {
        setSpeechSupported(false);
        return;
      }

      // From location recognition
      const recognitionFrom = new SpeechRecognition();
      recognitionFrom.continuous = false;
      recognitionFrom.interimResults = false;
      recognitionFrom.lang = "en-US";

      recognitionFrom.onstart = () => {
        setIsListeningFrom(true);
      };

      recognitionFrom.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setFromLocation(transcript);
        setIsListeningFrom(false);
      };

      recognitionFrom.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListeningFrom(false);
        if (event.error === "not-allowed") {
          toast.custom(() => (
            <CustomToast
              type="error"
              message="Microphone permission denied. Please allow microphone access."
            />
          ));
        }
      };

      recognitionFrom.onend = () => {
        setIsListeningFrom(false);
      };

      // To location recognition
      const recognitionTo = new SpeechRecognition();
      recognitionTo.continuous = false;
      recognitionTo.interimResults = false;
      recognitionTo.lang = "en-US";

      recognitionTo.onstart = () => {
        setIsListeningTo(true);
      };

      recognitionTo.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setToLocation(transcript);
        setIsListeningTo(false);
      };

      recognitionTo.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListeningTo(false);
        if (event.error === "not-allowed") {
          toast.custom(() => (
            <CustomToast
              type="error"
              message="Microphone permission denied. Please allow microphone access."
            />
          ));
        }
      };

      recognitionTo.onend = () => {
        setIsListeningTo(false);
      };

      recognitionFromRef.current = recognitionFrom;
      recognitionToRef.current = recognitionTo;
    }
  }, []);

  // Fetch buses & subscriptions
  useEffect(() => {
    async function fetchData() {
      try {
        const busRes = await api.get("/buses");
        const busesData = busRes.data;
        setBuses(busesData);
        setFilteredBuses(busesData);

        // Check driver statuses for all buses
        busesData.forEach((bus) => {
          const driverId = bus.driver?._id;
          if (driverId) {
            socket.emit("checkDriverStatus", { driverId }, ({ isOnline }) => {
              setDriverStatuses(prev => ({
                ...prev,
                [driverId]: isOnline
              }));
            });
          }
        });

        const subRes = await api.get("/notifications/my-subscriptions");
        setSubscribedBuses(new Set(subRes.data.busIds));
      } catch (err) {
        console.error(err);
        setError("Failed to fetch buses or subscriptions.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    // Listen for real-time driver status updates
    socket.on("driverStatusUpdate", (data) => {
      if (data.driverId) {
        setDriverStatuses(prev => ({
          ...prev,
          [data.driverId]: data.isOnline
        }));
      }
    });

    // Listen for location updates which indicate driver is online
    socket.on("updateLocation", (data) => {
      if (data.driverId) {
        setDriverStatuses(prev => ({
          ...prev,
          [data.driverId]: true
        }));
      }
    });

    return () => {
      socket.off("driverStatusUpdate");
      socket.off("updateLocation");
    };
  }, []);

  // Helper function to check if driver is online
  const isDriverOnline = (bus) => {
    const driverId = bus.driver?._id;
    if (!driverId) return false;
    return driverStatuses[driverId] || false;
  };

  const startListeningFrom = () => {
    if (recognitionFromRef.current) {
      try {
        recognitionFromRef.current.start();
      } catch (error) {
        console.error("Error starting speech recognition:", error);
        setIsListeningFrom(false);
      }
    }
  };

  const startListeningTo = () => {
    if (recognitionToRef.current) {
      try {
        recognitionToRef.current.start();
      } catch (error) {
        console.error("Error starting speech recognition:", error);
        setIsListeningTo(false);
      }
    }
  };

  const stopListeningFrom = () => {
    if (recognitionFromRef.current) {
      recognitionFromRef.current.stop();
      setIsListeningFrom(false);
    }
  };

  const stopListeningTo = () => {
    if (recognitionToRef.current) {
      recognitionToRef.current.stop();
      setIsListeningTo(false);
    }
  };

  const toggleListeningFrom = () => {
    if (isListeningFrom) {
      stopListeningFrom();
    } else {
      startListeningFrom();
    }
  };

  const toggleListeningTo = () => {
    if (isListeningTo) {
      stopListeningTo();
    } else {
      startListeningTo();
    }
  };

  const clearFilters = () => {
    setFromLocation("");
    setToLocation("");
    setSearchTerm("");
  };

  async function handleNotify(busId, e) {
    e.stopPropagation(); // prevent navigating when clicking button

    try {
      if (subscribedBuses.has(busId)) {
        // Unsubscribe
        await api.post("/notifications/unsubscribe", { busId });
        setSubscribedBuses((prev) => {
          const updated = new Set(prev);
          updated.delete(busId);
          return updated;
        });
        toast.custom(() => (
          <CustomToast
            type="info"
            message="Unsubscribed from bus notifications."
          />
        ));
      } else {
        // Subscribe
        const token = await getFcmToken();
        if (!token) {
          toast.custom(() => (
            <CustomToast
              type="error"
              message="Notification permission required. Please allow browser notifications."
            />
          ));
          return;
        }

        await api.post("/notifications/save-token", { token });
        await api.post("/notifications/subscribe", { busId });

        setSubscribedBuses((prev) => {
          const updated = new Set(prev);
          updated.add(busId);
          return updated;
        });
        toast.custom(() => (
          <CustomToast
            type="success"
            message="🔔 Subscribed! You will receive live arrival alerts for this bus."
          />
        ));
      }
    } catch (err) {
      console.error("Subscription error:", err);
      toast.custom(() => (
        <CustomToast type="error" message="Failed to update notification subscription." />
      ));
    }
  }

  // Filter buses by search term and from-to locations
  useEffect(() => {
    if (!searchTerm && !fromLocation && !toLocation) {
      setFilteredBuses(buses);
    } else {
      const searchTermLower = searchTerm.toLowerCase();
      const fromLower = fromLocation.toLowerCase();
      const toLower = toLocation.toLowerCase();

      const filtered = buses.filter((bus) => {
        // General search term matching
        const generalSearchMatch = searchTerm
          ? bus.name.toLowerCase().includes(searchTermLower) ||
            bus.number.toLowerCase().includes(searchTermLower) ||
            (bus.route?.name?.toLowerCase() || "").includes(searchTermLower) ||
            bus.route?.stops?.some((stop) =>
              (stop.name || "").toLowerCase().includes(searchTermLower)
            )
          : true;

        // From-To location matching
        let fromToMatch = true;
        if (fromLocation || toLocation) {
          const stops = bus.route?.stops || [];
          const stopNames = stops.map((stop) => stop.name.toLowerCase());

          if (fromLocation && toLocation) {
            // Check if bus goes from 'fromLocation' to 'toLocation'
            const fromIndex = stopNames.findIndex((stop) =>
              stop.includes(fromLower)
            );
            const toIndex = stopNames.findIndex((stop) =>
              stop.includes(toLower)
            );
            fromToMatch =
              fromIndex !== -1 && toIndex !== -1 && fromIndex < toIndex;
          } else if (fromLocation) {
            // Check if bus has 'fromLocation' in its route
            fromToMatch = stopNames.some((stop) => stop.includes(fromLower));
          } else if (toLocation) {
            // Check if bus has 'toLocation' in its route
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
      {/* Search & Filter Header Card */}
      <div className="bg-[#241710]/95 backdrop-blur-md rounded-3xl p-5 sm:p-6 border border-[#442918] shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#3b2315] pb-3">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[#F3E5D7] flex items-center gap-2">
              <span>🔍</span> Find Campus Buses
            </h2>
            <p className="text-xs text-[#b89f8b]">Search by bus name, number, stop, or select route checkpoints</p>
          </div>
          {(searchTerm || fromLocation || toLocation) && (
            <button
              onClick={clearFilters}
              className="self-start sm:self-auto text-xs px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-[#d1b8a3] hover:text-white border border-white/10 transition-colors"
            >
              Clear All Filters
            </button>
          )}
        </div>

        {/* Global Keyword Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search bus name, number, or stop name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl bg-[#1a100b] border border-[#422919] text-[#F3E5D7] placeholder-[#8c7464] focus:outline-none focus:border-[#c9a97f] focus:ring-1 focus:ring-[#c9a97f] text-sm transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8c7464] hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* From - To Stop Selection with Voice Support */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* From Input */}
          <div>
            <label className="block text-xs font-semibold text-[#c9a97f] mb-1.5">
              Pickup Point (From)
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g., SRIT, Ukkadam, Perur..."
                value={fromLocation}
                onChange={(e) => setFromLocation(e.target.value)}
                className="w-full px-4 py-2.5 pr-11 rounded-2xl bg-[#1a100b] border border-[#422919] text-[#F3E5D7] placeholder-[#8c7464] focus:outline-none focus:border-[#c9a97f] text-sm transition-all"
              />
              {speechSupported && (
                <button
                  type="button"
                  onClick={toggleListeningFrom}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all ${
                    isListeningFrom
                      ? "bg-red-500 text-white animate-pulse"
                      : "bg-[#2d1b11] text-[#c9a97f] hover:bg-[#3d2417]"
                  }`}
                  title={isListeningFrom ? "Stop listening" : "Voice input"}
                  disabled={isListeningTo}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {isListeningFrom ? <rect x="6" y="6" width="12" height="12" rx="1" /> : <><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></>}
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* To Input */}
          <div>
            <label className="block text-xs font-semibold text-[#c9a97f] mb-1.5">
              Drop-off Point (To)
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g., Sulur, Gandhipuram, SRIT..."
                value={toLocation}
                onChange={(e) => setToLocation(e.target.value)}
                className="w-full px-4 py-2.5 pr-11 rounded-2xl bg-[#1a100b] border border-[#422919] text-[#F3E5D7] placeholder-[#8c7464] focus:outline-none focus:border-[#c9a97f] text-sm transition-all"
              />
              {speechSupported && (
                <button
                  type="button"
                  onClick={toggleListeningTo}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all ${
                    isListeningTo
                      ? "bg-red-500 text-white animate-pulse"
                      : "bg-[#2d1b11] text-[#c9a97f] hover:bg-[#3d2417]"
                  }`}
                  title={isListeningTo ? "Stop listening" : "Voice input"}
                  disabled={isListeningFrom}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {isListeningTo ? <rect x="6" y="6" width="12" height="12" rx="1" /> : <><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></>}
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Active Route Tag */}
        {(fromLocation || toLocation) && (
          <div className="flex items-center gap-2 pt-1 text-xs text-[#d1b8a3]">
            <span>Routing Filter:</span>
            <span className="px-3 py-1 rounded-full bg-[#c9a97f]/15 border border-[#c9a97f]/30 text-[#ecd7bf] font-medium">
              📍 {fromLocation || "Anywhere"} → {toLocation || "Anywhere"}
            </span>
          </div>
        )}
      </div>

      {/* Voice Listening Indicators */}
      {(isListeningFrom || isListeningTo) && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-200 flex items-center justify-center gap-3 animate-pulse">
          <div className="flex space-x-1">
            <div className="w-2 h-4 bg-amber-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-4 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
            <div className="w-2 h-4 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
          </div>
          <span className="text-xs sm:text-sm font-medium">
            Listening for {isListeningFrom ? "Pickup Location" : "Destination"}... Speak now!
          </span>
        </div>
      )}

      {/* Buses Listing Section */}
      <div>
        {loading ? (
          <div className="text-center py-16 space-y-3">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-3 border-[#c9a97f] border-t-transparent"></div>
            <p className="text-sm text-[#b89f8b]">Fetching active fleet schedules...</p>
          </div>
        ) : error ? (
          <div className="p-6 rounded-3xl bg-red-950/40 border border-red-800/40 text-red-300 text-center">
            <p>{error}</p>
          </div>
        ) : filteredBuses.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-3xl bg-[#241710]/40 border border-[#3b2315] space-y-3">
            <span className="text-4xl">🚌</span>
            <p className="text-lg font-bold text-[#F3E5D7]">No matching buses found</p>
            <p className="text-xs text-[#b89f8b] max-w-sm mx-auto">
              Try adjusting the pickup/drop-off stops or clearing your search query.
            </p>
            <button
              onClick={clearFilters}
              className="mt-2 px-4 py-2 rounded-xl bg-[#c9a97f] text-[#140c08] text-xs font-semibold"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#cfb6a1] uppercase tracking-wider">
                Fleet Results ({filteredBuses.length})
              </h3>
              <span className="text-xs text-[#8c7464]">Tap card to view live map</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredBuses.map((bus) => {
                const isOnline = isDriverOnline(bus);
                const isSubscribed = subscribedBuses.has(bus._id);

                return (
                  <div
                    key={bus._id}
                    onClick={() => router.push(`/student/buses/${bus._id}`)}
                    className="group relative bg-[#241710] hover:bg-[#2c1c14] border border-[#3d2516] hover:border-[#c9a97f]/60 rounded-3xl p-5 sm:p-6 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Bar with Name and Online Status */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xl">🚍</span>
                            <h2 className="text-lg font-bold text-[#F3E5D7] group-hover:text-[#c9a97f] transition-colors">
                              {bus.name}
                            </h2>
                            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-[#d8c0ad]">
                              {bus.number}
                            </span>
                          </div>
                          <p className="text-xs text-[#bca28f] mt-1">
                            Route: <span className="text-[#e2c7a5] font-medium">{bus.route?.name || "Standard Route"}</span>
                          </p>
                        </div>

                        {/* Online Indicator Badge */}
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                          isOnline
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : "bg-zinc-800 text-zinc-400 border-zinc-700"
                        }`}>
                          <span className={`w-2 h-2 rounded-full ${isOnline ? "bg-emerald-400 animate-ping" : "bg-zinc-500"}`}></span>
                          <span>{isOnline ? "Live Online" : "Offline"}</span>
                        </div>
                      </div>

                      {/* Driver & Route Info Grid */}
                      <div className="mt-4 pt-3 border-t border-[#3b2315] grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-black/20 p-2.5 rounded-xl border border-white/5">
                          <p className="text-[#8c7464]">Assigned Driver</p>
                          <p className="text-[#e8cfb5] font-medium truncate mt-0.5">
                            {bus.driver?.name || "TBA"}
                          </p>
                        </div>
                        <div className="bg-black/20 p-2.5 rounded-xl border border-white/5">
                          <p className="text-[#8c7464]">Route Checkpoints</p>
                          <p className="text-[#e8cfb5] font-medium mt-0.5">
                            {bus.route?.stops ? `${bus.route.stops.length} Stops` : "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="mt-5 pt-3 border-t border-[#3b2315] flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={(e) => handleNotify(bus._id, e)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md active:scale-95 ${
                          isSubscribed
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30"
                            : "bg-white/5 text-[#d1b8a3] hover:text-white border border-white/10 hover:bg-white/10"
                        }`}
                      >
                        <span>{isSubscribed ? "🔔 Subscribed" : "🔕 Alert Me"}</span>
                      </button>

                      <div className="flex items-center gap-1 text-xs font-semibold text-[#c9a97f] group-hover:translate-x-1 transition-transform">
                        <span>Live Tracking</span>
                        <span>→</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}