"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import toast from "react-hot-toast";

export default function ConductorHistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get("/conductors/me/history");
        setHistory(res.data);
      } catch (err) {
        toast.error("Failed to fetch history");
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) {
    return <p>Loading history...</p>;
  }

  if (!history.length) {
    return <p>No history available.</p>;
  }

  return (
    <div className="min-h-screen">
      <h2 className="text-xl font-bold mb-6">📜 Scan History</h2>

      <div className="space-y-4 max-w-3xl mx-auto">
        {history.map((item) => (
          <div
            key={item._id}
            className="bg-[#2D2421] p-4 rounded-xl flex justify-between items-center"
          >
            <div>
              <p className="font-semibold text-[#F3E5D7]">
                {item.studentName || "Unknown Student"}
              </p>
              <p className="text-sm text-[#CDB7AE]">
                Ticket ID: {item.ticketId || "N/A"}
              </p>
            </div>
            <p className="text-sm text-[#F3E5D7]">
              {new Date(item.scannedAt).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
