"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import LoadingSpinner from "@/components/LoadingSpinner";
import { format } from "date-fns";
import { QRCodeCanvas } from "qrcode.react";
import DownloadTicket from "@/components/DownloadTicket";

export default function StudentTicketsPage() {
  const { user, loading: authLoading } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [selectedQRTicket, setSelectedQRTicket] = useState(null);
  const [sortOrder, setSortOrder] = useState("desc");

  useEffect(() => {
    if (!authLoading && user) fetchTickets();
  }, [authLoading, user, sortOrder]);

  const fetchTickets = async () => {
    try {
      const res = await api.get("/tickets/my");

      let sortedTickets = [...res.data].sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
      });

      setTickets(sortedTickets);
    } catch (err) {
      console.error(err);
      setError("⚠️ Failed to fetch tickets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setSelectedTicket(null);
        setSelectedQRTicket(null);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  if (authLoading || loading) return <LoadingSpinner />;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!tickets.length)
    return <p className="text-gray-400">You have no booked tickets.</p>;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold mb-4 text-[#F3E5D7] drop-shadow">
          🎟️ My Booked Tickets
        </h1>

        {/* Sort Dropdown */}
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className="bg-[#5D4037] text-white px-4 py-2 rounded-xl shadow hover:shadow-lg transition"
        >
          <option value="desc">Newest First</option>
          <option value="asc">Oldest First</option>
        </select>
      </div>

      {/* Ticket Table */}
      <div className="overflow-x-auto bg-[#3E2F2C] rounded-2xl shadow-xl border border-[#5D4037]/40">
        <table className="min-w-full divide-y divide-gray-700 text-white">
          <thead className="bg-[#5D4037]/90">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Bus Name</th>
              <th className="px-4 py-3 text-center font-semibold">Seats</th>
              <th className="px-4 py-3 text-center font-semibold">Fare (₹)</th>
              <th className="px-4 py-3 text-center font-semibold">Status</th>
              <th className="px-4 py-3 text-center font-semibold">Details</th>
              <th className="px-4 py-3 text-center font-semibold">QR Code</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/70">
            {tickets.map((ticket) => (
              <tr
                key={ticket._id}
                className="hover:bg-[#4a362b]/70 transition rounded-xl"
              >
                <td className="px-4 py-3">{ticket.bus?.name || "N/A"}</td>
                <td className="px-4 py-3 text-center">{ticket.seats}</td>
                <td className="px-4 py-3 text-center font-semibold">
                  ₹{ticket.fare}
                </td>
                <td
                  className={`px-4 py-3 text-center font-semibold ${
                    ticket.status === "booked"
                      ? "text-green-400"
                      : "text-yellow-400"
                  }`}
                >
                  {ticket.status}
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => setSelectedTicket(ticket)}
                    className="bg-gradient-to-r from-green-600 to-green-700 hover:scale-105 transform transition px-4 py-1.5 rounded-xl shadow"
                  >
                    View
                  </button>
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => setSelectedQRTicket(ticket)}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:scale-105 transform transition px-4 py-1.5 rounded-xl shadow"
                  >
                    Show QR
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Details Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#3E2F2C] rounded-2xl shadow-2xl w-full max-w-lg p-8 relative border border-[#5D4037]/50">
            <button
              onClick={() => setSelectedTicket(null)}
              className="absolute top-3 right-3 text-white text-2xl font-bold hover:scale-110 transition"
            >
              &times;
            </button>

            <h2 className="text-2xl font-bold mb-2 text-[#F3E5D7]">
              {selectedTicket.bus?.name || "N/A"} (
              {selectedTicket.bus?.number || "N/A"})
            </h2>
            <p className="text-sm text-[#CDBFB4] mb-4 italic">
              Route: {selectedTicket.bus?.route?.name || "N/A"}
            </p>

            <div className="space-y-3 text-[#CDBFB4]">
              <p>
                <span className="font-semibold">👨‍✈️ Driver:</span>{" "}
                {selectedTicket.bus?.driver?.name || "N/A"} |{" "}
                {selectedTicket.bus?.driver?.phone || "N/A"}
              </p>
              <p>
                <span className="font-semibold">🪑 Seats:</span>{" "}
                {selectedTicket.seats}
              </p>
              <p>
                <span className="font-semibold">📍 Start:</span>{" "}
                {selectedTicket.startPoint || "N/A"}
              </p>
              <p>
                <span className="font-semibold">🏁 Stop:</span>{" "}
                {selectedTicket.stopPoint || "N/A"}
              </p>
              <p>
                <span className="font-semibold">💰 Fare:</span> ₹
                {selectedTicket.fare || "N/A"}
              </p>
              <p>
                <span className="font-semibold">📌 Status:</span>{" "}
                <span
                  className={`font-semibold ${
                    selectedTicket.status === "booked"
                      ? "text-green-400"
                      : "text-yellow-400"
                  }`}
                >
                  {selectedTicket.status}
                </span>
              </p>
              <p>
                <span className="font-semibold">📅 Booked At:</span>{" "}
                {selectedTicket.createdAt
                  ? format(
                      new Date(selectedTicket.createdAt),
                      "dd MMM yyyy, HH:mm"
                    )
                  : "N/A"}
              </p>
              <p>
                <span className="font-semibold">🕒 Last Updated:</span>{" "}
                {selectedTicket.updatedAt
                  ? format(
                      new Date(selectedTicket.updatedAt),
                      "dd MMM yyyy, HH:mm"
                    )
                  : "N/A"}
              </p>
            </div>

            {/* Download Ticket Button */}
            <DownloadTicket ticket={selectedTicket} />
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {selectedQRTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#3E2F2C] rounded-2xl shadow-2xl w-full max-w-sm p-8 relative flex flex-col items-center border border-[#5D4037]/50">
            <button
              onClick={() => setSelectedQRTicket(null)}
              className="absolute top-3 right-3 text-white text-2xl font-bold hover:scale-110 transition"
            >
              &times;
            </button>

            <h2 className="text-xl font-bold mb-6 text-center text-[#F3E5D7]">
              {selectedQRTicket.bus?.name || "N/A"} 🎟️ QR Code
            </h2>

            <div className="p-4 bg-white rounded-2xl shadow-lg">
              <QRCodeCanvas
                value={selectedQRTicket._id}
                size={260}
                bgColor="#FFFFFF"
                fgColor="#000000"
              />
            </div>

            {selectedQRTicket.used && (
              <p className="text-red-400 mt-4 font-semibold">
                ⚠️ Ticket already used
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
