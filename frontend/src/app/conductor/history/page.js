"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { FaEye, FaSearch } from "react-icons/fa";

export default function ConductorHistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

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

  const filteredHistory = history.filter((item) => {
    const query = searchQuery.toLowerCase();

    const matchesSearch =
      (item.studentName?.toLowerCase().includes(query) ||
        item.routeName?.toLowerCase().includes(query)) ??
      false;

    const matchesDate = selectedDate
      ? new Date(item.scannedAt).toISOString().slice(0, 10) === selectedDate
      : true;

    return matchesSearch && matchesDate;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[#F3E5D7]">
        <p className="text-lg font-medium animate-pulse">
          Loading your scan history...
        </p>
      </div>
    );
  }

  if (!history.length) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[#F3E5D7]">
        <p className="text-lg font-medium">No scan history yet. 🎉</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-12 bg-[#1f1b16] text-[#F3E5D7]">
      <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center">
        📜 Scan History
      </h2>

      {/* Search & Date Filter */}
      <div className="max-w-3xl mx-auto mb-8 flex flex-col md:flex-row gap-4">
        {/* Search Bar */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by passenger name or route..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-3 pl-10 rounded-xl bg-[#2D2421] text-[#F3E5D7] placeholder-[#CDB7AE] focus:outline-none focus:ring-2 focus:ring-[#CDB7AE]"
          />
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#CDB7AE]" />
        </div>

        {/* Date Picker */}
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="p-3 rounded-xl bg-[#2D2421] text-[#F3E5D7] focus:outline-none focus:ring-2 focus:ring-[#CDB7AE]"
        />
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto max-w-6xl mx-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#2D2421]">
              <th className="p-3 rounded-tl-xl">Passenger Name</th>
              <th className="p-3">Ticket ID</th>
              <th className="p-3">Route</th>
              <th className="p-3">Fare</th>
              <th className="p-3">Scanned At</th>
              <th className="p-3 rounded-tr-xl">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredHistory.map((item) => (
              <tr
                key={item._id}
                className="bg-[#3a312a] hover:bg-[#4a3b32] transition-colors"
              >
                <td className="p-3 font-semibold">
                  {item.studentName || "Unknown"}
                </td>
                <td className="p-3 text-sm text-[#CDB7AE]">
                  {item.ticketId || "N/A"}
                </td>
                <td className="p-3">{item.routeName || "N/A"}</td>
                <td className="p-3">{item.fare ? `₹${item.fare}` : "N/A"}</td>
                <td className="p-3 text-sm">
                  {new Date(item.scannedAt).toLocaleString()}
                </td>
                <td className="p-3">
                  <button
                    onClick={() => setSelectedTicket(item)}
                    className="flex items-center gap-2 bg-[#CDB7AE] text-[#1f1b16] px-3 py-1 rounded-lg hover:bg-[#e0c6ae] transition"
                  >
                    <FaEye /> View
                  </button>
                </td>
              </tr>
            ))}
            {!filteredHistory.length && (
              <tr>
                <td
                  colSpan="6"
                  className="text-center p-4 text-[#CDB7AE] italic"
                >
                  No matching results
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {filteredHistory.map((item) => (
          <div
            key={item._id}
            className="bg-[#2D2421] p-4 rounded-2xl shadow-lg flex flex-col gap-2"
          >
            <p className="font-semibold">{item.studentName || "Unknown"}</p>
            <p className="text-sm text-[#CDB7AE]">
              Ticket ID: {item.ticketId || "N/A"}
            </p>
            <p className="text-sm">Route: {item.routeName || "N/A"}</p>
            <p className="text-sm">
              Fare: {item.fare ? `₹${item.fare}` : "N/A"}
            </p>
            <p className="text-sm">
              Scanned At: {new Date(item.scannedAt).toLocaleString()}
            </p>
            <button
              onClick={() => setSelectedTicket(item)}
              className="mt-2 bg-[#CDB7AE] text-[#1f1b16] px-3 py-1 rounded-lg hover:bg-[#e0c6ae] transition"
            >
              View Details
            </button>
          </div>
        ))}

        {!filteredHistory.length && (
          <p className="text-center text-[#CDB7AE] italic">
            No matching results
          </p>
        )}
      </div>

      {/* Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#2D2421] text-[#F3E5D7] p-6 rounded-2xl max-w-md w-full space-y-2">
            <h3 className="text-xl font-bold mb-2">Ticket Details</h3>
            <p>
              <span className="font-semibold">Passenger Name: </span>
              {selectedTicket.studentName || "Unknown"}
            </p>
            <p>
              <span className="font-semibold">Ticket ID: </span>
              {selectedTicket.ticketId || "N/A"}
            </p>
            <p>
              <span className="font-semibold">Route: </span>
              {selectedTicket.routeName || "N/A"}
            </p>
            <p>
              <span className="font-semibold">Start Point: </span>
              {selectedTicket.startPoint || "N/A"}
            </p>
            <p>
              <span className="font-semibold">Stop Point: </span>
              {selectedTicket.stopPoint || "N/A"}
            </p>
            <p>
              <span className="font-semibold">Fare: </span>
              {selectedTicket.fare ? `₹${selectedTicket.fare}` : "N/A"}
            </p>
            <p>
              <span className="font-semibold">Scanned At: </span>
              {new Date(selectedTicket.scannedAt).toLocaleString()}
            </p>
            <button
              onClick={() => setSelectedTicket(null)}
              className="mt-4 bg-[#CDB7AE] text-[#1f1b16] px-4 py-2 rounded-lg hover:bg-[#e0c6ae] transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
