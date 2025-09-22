"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { getFcmToken } from "@/lib/firebase";

export default function StudentBusesPage() {
  const [buses, setBuses] = useState([]);
  const [filteredBuses, setFilteredBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [subscribedBuses, setSubscribedBuses] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

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
        alert("✅ You will now receive notifications for this bus.");
      }
    } catch (err) {
      console.error(err);
      alert("⚠️ Failed to update subscription.");
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
        const routeNameMatch = (bus.route?.name?.toLowerCase() || "").includes(term);
        const stopNameMatch =
          bus.route?.stops?.some((stop) =>
            (stop.name || "").toLowerCase().includes(term)
          ) || false;

        return busNameMatch || busNumberMatch || routeNameMatch || stopNameMatch;
      });
      setFilteredBuses(filtered);
    }
  }, [searchTerm, buses]);

  return (
    <div>
      {/* Search Bar */}
      <input
        type="text"
        placeholder="Search by bus name, number, route, or stop..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full mb-4 p-2 rounded border border-gray-300 bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

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
