"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import LoadingSpinner from "@/components/LoadingSpinner";
import { format } from "date-fns";
import { QRCodeCanvas } from "qrcode.react";

export default function StudentTicketsPage() {
  const { user, loading: authLoading } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTicket, setSelectedTicket] = useState(null); // For modal
  const [showQR, setShowQR] = useState(false); // QR toggle state

  useEffect(() => {
    if (!authLoading && user) fetchTickets();
  }, [authLoading, user]);

  const fetchTickets = async () => {
    try {
      const res = await api.get("/tickets/my");
      setTickets(res.data);
    } catch (err) {
      console.error(err);
      setError("⚠️ Failed to fetch tickets.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) return <LoadingSpinner />;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!tickets.length)
    return <p className="text-gray-400">You have no booked tickets.</p>;

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-semibold mb-4 text-[#F3E5D7]">
        My Booked Tickets
      </h1>

      {/* Table */}
      <div className="overflow-x-auto bg-[#3E2F2C] rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-700 text-white">
          <thead className="bg-[#5D4037]">
            <tr>
              <th className="px-4 py-2 text-left">Bus Name</th>
              <th className="px-4 py-2">Seats</th>
              <th className="px-4 py-2">Fare (₹)</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {tickets.map((ticket) => (
              <tr key={ticket._id} className="hover:bg-[#4a362b]">
                <td className="px-4 py-2">{ticket.bus?.name}</td>
                <td className="px-4 py-2 text-center">{ticket.seats}</td>
                <td className="px-4 py-2 text-center">{ticket.fare}</td>
                <td
                  className={`px-4 py-2 text-center font-semibold ${
                    ticket.status === "booked"
                      ? "text-green-400"
                      : "text-yellow-400"
                  }`}
                >
                  {ticket.status}
                </td>
                <td className="px-4 py-2 text-center">
                  <button
                    onClick={() => {
                      setSelectedTicket(ticket);
                      setShowQR(false); // reset QR when opening
                    }}
                    className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-[#3E2F2C] rounded-lg shadow-lg w-full max-w-lg p-6 relative">
            <button
              onClick={() => setSelectedTicket(null)}
              className="absolute top-3 right-3 text-white text-xl font-bold"
            >
              &times;
            </button>

            <h2 className="text-2xl font-bold mb-2">
              {selectedTicket.bus?.name} ({selectedTicket.bus?.number})
            </h2>
            <p className="text-sm text-[#CDBFB4] mb-4">
              Route: {selectedTicket.bus?.route?.name || "N/A"}
            </p>

            <div className="space-y-2 text-[#CDBFB4]">
              <p>
                <span className="font-semibold">Driver:</span>{" "}
                {selectedTicket.bus?.driver?.name || "N/A"} |{" "}
                {selectedTicket.bus?.driver?.phone || "N/A"}
              </p>
              <p>
                <span className="font-semibold">Seats Booked:</span>{" "}
                {selectedTicket.seats}
              </p>
              <p>
                <span className="font-semibold">Start Point:</span>{" "}
                {selectedTicket.startPoint}
              </p>
              <p>
                <span className="font-semibold">Stop Point:</span>{" "}
                {selectedTicket.stopPoint}
              </p>
              <p>
                <span className="font-semibold">Fare:</span> ₹
                {selectedTicket.fare}
              </p>
              <p>
                <span className="font-semibold">Status:</span>{" "}
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
                <span className="font-semibold">Booked At:</span>{" "}
                {format(
                  new Date(selectedTicket.createdAt),
                  "dd MMM yyyy, HH:mm"
                )}
              </p>
              <p>
                <span className="font-semibold">Last Updated:</span>{" "}
                {format(
                  new Date(selectedTicket.updatedAt),
                  "dd MMM yyyy, HH:mm"
                )}
              </p>
            </div>

            {/* QR Code toggle */}
            <div className="mt-4 flex flex-col items-center">
              <button
                onClick={() => setShowQR((prev) => !prev)}
                className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded mb-2"
              >
                {showQR ? "Hide QR Code" : "Show QR Code"}
              </button>

              {showQR && (
                <div className="flex flex-col items-center">
                  <QRCodeCanvas
                    value={selectedTicket._id}
                    size={250}
                    bgColor="#FFFFFF" // white
                    fgColor="#000000" // black
                  />

                  {selectedTicket.used && (
                    <p className="text-red-500 mt-2 font-semibold">
                      Ticket already used
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
