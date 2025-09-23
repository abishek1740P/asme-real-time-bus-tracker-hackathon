"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export default function BookBusesPage() {
  const [buses, setBuses] = useState([]);
  const [filteredBuses, setFilteredBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function fetchBuses() {
      try {
        const res = await api.get("/buses");
        setBuses(res.data);
        setFilteredBuses(res.data);
      } catch (err) {
        console.error(err);
        setError("⚠️ Failed to fetch buses.");
      } finally {
        setLoading(false);
      }
    }
    fetchBuses();
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
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold text-white mb-4">Available Buses</h1>

      {/* Search Bar */}
      <input
        type="text"
        placeholder="Search by bus name, number, route, or stop..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full mb-4 p-2 rounded border border-gray-300 bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {loading ? (
        <p className="text-gray-400">Loading buses...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : filteredBuses.length === 0 ? (
        <p className="text-gray-400">No buses available.</p>
      ) : (
        <div className="grid gap-4">
          {filteredBuses.map((bus) => (
            <div
              key={bus._id}
              className="bg-[#3E2F2C] hover:bg-[#5D4037] p-4 rounded-lg shadow flex justify-between items-center"
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
                onClick={() => router.push(`/student/book/${bus._id}`)}
                className="ml-4 px-3 py-1 rounded text-white bg-blue-500 hover:bg-blue-600"
              >
                Book
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
