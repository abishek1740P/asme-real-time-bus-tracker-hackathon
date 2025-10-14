"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { getFcmToken } from "@/lib/firebase";
import toast from "react-hot-toast";
import CustomToast from "@/components/CustomToast";

export default function StudentBusesPage() {
  const [buses, setBuses] = useState([]);
  const [filteredBuses, setFilteredBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [subscribedBuses, setSubscribedBuses] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const recognitionRef = useRef(null);
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

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setSearchTerm(transcript);
        setIsListening(false);
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        if (event.error === "not-allowed") {
          toast.custom(() => (
            <CustomToast
              type="error"
              message="Microphone permission denied. Please allow microphone access."
            />
          ));
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const startListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error("Error starting speech recognition:", error);
        setIsListening(false);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
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

  // Fetch buses & subscriptions
  useEffect(() => {
    async function fetchData() {
      try {
        const busRes = await api.get("/buses");
        setBuses(busRes.data);
        setFilteredBuses(busRes.data);

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
  }, []);

  // Filter buses by search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredBuses(buses);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = buses.filter((bus) => {
        const busNameMatch = bus.name.toLowerCase().includes(term);
        const busNumberMatch = bus.number.toLowerCase().includes(term);
        const routeNameMatch = (bus.route?.name?.toLowerCase() || "").includes(
          term
        );
        const stopNameMatch =
          bus.route?.stops?.some((stop) =>
            (stop.name || "").toLowerCase().includes(term)
          ) || false;

        return (
          busNameMatch || busNumberMatch || routeNameMatch || stopNameMatch
        );
      });
      setFilteredBuses(filtered);
    }
  }, [searchTerm, buses]);

  return (
    <div>
      {/* Search Bar with Speech Recognition */}
      <div className="relative w-full mb-4">
        <input
          type="text"
          placeholder="Search by bus name, number, route, or stop..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 pr-12 rounded border border-gray-300 bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Voice Search Button */}
        {speechSupported && (
          <button
            type="button"
            onClick={toggleListening}
            className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full ${
              isListening
                ? "bg-red-500 text-white animate-pulse"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            } transition-colors duration-200`}
            title={isListening ? "Stop listening" : "Start voice search"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {isListening ? (
                // Stop icon when listening
                <>
                  <rect x="6" y="6" width="12" height="12" rx="1" />
                </>
              ) : (
                // Mic icon when not listening
                <>
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </>
              )}
            </svg>
          </button>
        )}
      </div>

      {/* Listening Indicator */}
      {isListening && (
        <div className="mb-4 p-3 bg-blue-100 border border-blue-300 rounded-lg text-blue-700 flex items-center">
          <div className="flex space-x-1 mr-3">
            <div className="w-2 h-6 bg-blue-500 rounded-full animate-bounce"></div>
            <div
              className="w-2 h-6 bg-blue-500 rounded-full animate-bounce"
              style={{ animationDelay: "0.1s" }}
            ></div>
            <div
              className="w-2 h-6 bg-blue-500 rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            ></div>
          </div>
          Listening... Speak now
        </div>
      )}

      {/* Browser Support Warning */}
      {!speechSupported && (
        <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg text-yellow-700">
          Voice search is not supported in your browser. Try Chrome, Edge, or
          Safari.
        </div>
      )}

      {loading ? (
        <p>Loading buses...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : filteredBuses.length === 0 ? (
        <p className="text-gray-500">No buses match your search.</p>
      ) : (
        <div className="grid gap-4">
          {filteredBuses.map((bus) => (
            <div
              key={bus._id}
              onClick={() => router.push(`/student/buses/${bus._id}`)}
              className="bg-[#3E2F2C] hover:bg-[#5D4037] p-4 rounded-lg shadow flex justify-between items-center cursor-pointer"
            >
              <div>
                <h2 className="text-lg font-semibold">
                  {bus.name} ({bus.number})
                </h2>
                <p className="text-sm text-[#CDBFB4]">
                  Route: {bus.route?.name || "Not Assigned"}
                </p>
              </div>
              <button
                onClick={(e) => handleNotify(bus._id, e)}
                className={`ml-4 px-3 py-1 rounded text-white ${
                  subscribedBuses.has(bus._id)
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-blue-500 hover:bg-blue-600"
                }`}
              >
                {subscribedBuses.has(bus._id) ? "Unsubscribe" : "Notify Me"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
