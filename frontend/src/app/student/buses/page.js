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
        alert("❌ You have unsubscribed from this bus.");
      } else {
        // Subscribe
        const token = await getFcmToken();
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
            message="You will now receive notifications for this bus."
          />
        ));
      }
    } catch (err) {
      console.error(err);
      toast.custom(() => (
        <CustomToast type="error" message="Failed to update subscription." />
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
    <div className="space-y-4">
      {/* From - To Section */}
      <div className="bg-[#F5F1ED] rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[#3E2F2C] font-semibold text-sm">
            Find Your Route
          </h3>
          {(fromLocation || toLocation) && (
            <button
              onClick={clearFilters}
              className="text-xs text-[#8B7355] hover:text-[#3E2F2C] transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {/* Vertical layout for mobile, horizontal for larger screens */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* From Input */}
          <div className="relative">
            <label className="block text-xs text-[#8B7355] mb-1 font-medium">
              From
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Starting point..."
                value={fromLocation}
                onChange={(e) => setFromLocation(e.target.value)}
                className="w-full p-3 pr-10 rounded-xl border border-[#CDBFB4] bg-white text-black focus:outline-none focus:ring-2 focus:ring-[#8B7355] text-sm transition-all duration-200"
              />
              {speechSupported && (
                <button
                  type="button"
                  onClick={toggleListeningFrom}
                  className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full ${
                    isListeningFrom
                      ? "bg-red-500 text-white animate-pulse"
                      : "bg-[#E8D5C4] text-[#8B7355] hover:bg-[#D4B8A4]"
                  } transition-colors duration-200`}
                  title={
                    isListeningFrom ? "Stop listening" : "Voice input for From"
                  }
                  disabled={isListeningTo}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {isListeningFrom ? (
                      <rect x="6" y="6" width="12" height="12" rx="1" />
                    ) : (
                      <>
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      </>
                    )}
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* To Input */}
          <div className="relative">
            <label className="block text-xs text-[#8B7355] mb-1 font-medium">
              To
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Destination..."
                value={toLocation}
                onChange={(e) => setToLocation(e.target.value)}
                className="w-full p-3 pr-10 rounded-xl border border-[#CDBFB4] bg-white text-black focus:outline-none focus:ring-2 focus:ring-[#8B7355] text-sm transition-all duration-200"
              />
              {speechSupported && (
                <button
                  type="button"
                  onClick={toggleListeningTo}
                  className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full ${
                    isListeningTo
                      ? "bg-red-500 text-white animate-pulse"
                      : "bg-[#E8D5C4] text-[#8B7355] hover:bg-[#D4B8A4]"
                  } transition-colors duration-200`}
                  title={
                    isListeningTo ? "Stop listening" : "Voice input for To"
                  }
                  disabled={isListeningFrom}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {isListeningTo ? (
                      <rect x="6" y="6" width="12" height="12" rx="1" />
                    ) : (
                      <>
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      </>
                    )}
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Route Display */}
        {(fromLocation || toLocation) && (
          <div className="text-center pt-2">
            <span className="text-xs text-[#3E2F2C] bg-[#E8D5C4] px-3 py-1 rounded-full">
              🚌 {fromLocation || "Anywhere"} → {toLocation || "Anywhere"}
            </span>
          </div>
        )}
      </div>

      {/* Listening Indicators */}
      {(isListeningFrom || isListeningTo) && (
        <div className="p-3 bg-[#E8F4FD] border border-[#8B7355] rounded-xl text-[#3E2F2C] flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1">
              <div className="w-2 h-4 bg-[#8B7355] rounded-full animate-bounce"></div>
              <div
                className="w-2 h-4 bg-[#8B7355] rounded-full animate-bounce"
                style={{ animationDelay: "0.1s" }}
              ></div>
              <div
                className="w-2 h-4 bg-[#8B7355] rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              ></div>
            </div>
            <span className="text-sm">
              Listening for {isListeningFrom ? "'From'" : "'To'"}... Speak now
            </span>
          </div>
        </div>
      )}

      {/* Browser Support Warning */}
      {!speechSupported && (
        <div className="p-3 bg-[#FFF3CD] border border-[#FFEaa6] rounded-xl text-[#856404] text-sm">
          🎤 Voice search is not supported in your browser. Try Chrome, Edge, or
          Safari.
        </div>
      )}

      {/* Results Section */}
      <div>
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B7355]"></div>
            <p className="mt-2 text-[#3E2F2C]">Loading buses...</p>
          </div>
        ) : error ? (
          <p className="text-red-500 text-center py-4">{error}</p>
        ) : filteredBuses.length === 0 ? (
          <div className="text-center py-8 text-[#8B7355]">
            <p className="text-lg">🚫 No buses found</p>
            <p className="text-sm mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-[#3E2F2C] font-semibold">
                Available Buses ({filteredBuses.length})
              </h3>
            </div>

            <div className="grid gap-3">
              {filteredBuses.map((bus) => (
                <div
                  key={bus._id}
                  onClick={() => router.push(`/student/buses/${bus._id}`)}
                  className="bg-[#3E2F2C] hover:bg-[#5D4037] p-4 rounded-xl shadow-lg flex justify-between items-center cursor-pointer transform hover:scale-[1.02] transition-all duration-200 border border-[#CDBFB4]"
                >
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-white">
                      {bus.name} ({bus.number})
                    </h2>

                    {/* Horizontal Driver Status */}
                    <div className="flex items-center space-x-4 mt-2">
                      <div className="flex items-center space-x-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            isDriverOnline(bus)
                              ? "bg-green-400 animate-pulse"
                              : "bg-red-400"
                          }`}
                        ></div>
                        <span className="text-xs text-[#CDBFB4]">
                          Driver:{" "}
                          {isDriverOnline(bus) ? "🟢 Online" : "🔴 Offline"}
                        </span>
                      </div>

                      <span className="text-xs text-[#A1887F]">
                        Route: {bus.route?.name || "Not Assigned"}
                      </span>

                      {bus.route?.stops && (
                        <span className="text-xs text-[#A1887F]">
                          Stops: {bus.route.stops.length}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleNotify(bus._id, e)}
                    className={`ml-4 px-4 py-2 rounded-xl text-white font-medium transition-all duration-200 ${
                      subscribedBuses.has(bus._id)
                        ? "bg-red-500 hover:bg-red-600 shadow-lg"
                        : "bg-[#8B7355] hover:bg-[#6B5B4D] shadow-lg hover:shadow-xl"
                    }`}
                  >
                    {subscribedBuses.has(bus._id)
                      ? "🔔 Subscribed"
                      : "🔔 Notify Me"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}