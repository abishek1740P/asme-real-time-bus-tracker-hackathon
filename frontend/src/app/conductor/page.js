"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import toast from "react-hot-toast";

export default function ConductorDashboard() {
  const [bus, setBus] = useState(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchAssignedBus = async () => {
      try {
        const res = await api.get("/conductors/me/assigned-bus");
        setBus(res.data);
      } catch (err) {
        toast.error("Failed to fetch assigned bus");
      } finally {
        setFetching(false);
      }
    };
    fetchAssignedBus();
  }, []);

  if (fetching) return <p>Loading your assigned bus...</p>;
  if (!bus) return <p>No bus assigned yet.</p>;

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">🚌 Assigned Bus Details</h2>
      <div className="bg-[#2D2421] p-6 rounded-xl space-y-4 max-w-lg">
        <p className="text-lg font-semibold">
          Bus Name: <span className="font-normal">{bus.name}</span>
        </p>
        <p className="text-lg font-semibold">
          Bus Number: <span className="font-normal">{bus.number}</span>
        </p>
        <p className="text-lg font-semibold">
          Route: <span className="font-normal">{bus.route?.name || "N/A"}</span>
        </p>
        <p className="text-lg font-semibold">
          Driver: <span className="font-normal">{bus.driver?.name || "N/A"}</span>
        </p>
        <p className="text-lg font-semibold">
          Driver Phone: <span className="font-normal">{bus.driver?.phone || "N/A"}</span>
        </p>
      </div>
    </div>
  );
}
