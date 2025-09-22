"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export default function BookBusesPage() {
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function fetchBuses() {
      try {
        const res = await api.get("/buses");
        setBuses(res.data);
      } catch (err) {
        console.error(err);
        setError("⚠️ Failed to fetch buses.");
      } finally {
        setLoading(false);
      }
    }
    fetchBuses();
  }, []);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold text-white mb-4">Available Buses</h1>

      {loading ? (
        <p className="text-gray-400">Loading buses...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : buses.length === 0 ? (
        <p className="text-gray-400">No buses available.</p>
      ) : (
        <div className="grid gap-4">
          {buses.map((bus) => (
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
