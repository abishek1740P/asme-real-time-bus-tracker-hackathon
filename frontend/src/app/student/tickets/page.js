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

  if (authLoading || loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-3 border-[#c9a97f] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-[#b89f8b]">Retrieving your digital tickets...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-3xl bg-red-950/40 border border-red-800/40 text-red-300 text-center">
        {error}
      </div>
    );
  }

  if (!tickets.length) {
    return (
      <div className="text-center py-20 px-4 rounded-3xl bg-[#241710] border border-[#3b2315] space-y-4 max-w-lg mx-auto">
        <span className="text-5xl">🎟️</span>
        <h2 className="text-xl font-bold text-[#F3E5D7]">No Booked Tickets Found</h2>
        <p className="text-xs sm:text-sm text-[#b89f8b]">
          You haven't reserved any bus tickets yet. Choose your route and secure your campus transit seats in seconds.
        </p>
        <a
          href="/student/book"
          className="inline-block mt-2 px-6 py-3 rounded-2xl bg-[#c9a97f] text-[#140c08] font-bold text-sm shadow-lg shadow-[#c9a97f]/20 hover:brightness-110 active:scale-95 transition-all"
        >
          Book Your First Ticket →
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F3E5D7] flex items-center gap-2">
            <span>🎟️</span> My Digital Boarding Passes
          </h1>
          <p className="text-xs text-[#b89f8b]">Active passes with QR codes ready for conductor validation</p>
        </div>

        {/* Sort Dropdown */}
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className="self-start sm:self-auto bg-[#241710] text-[#F3E5D7] border border-[#442918] px-4 py-2 rounded-2xl text-xs sm:text-sm font-medium focus:outline-none focus:border-[#c9a97f] transition shadow-md"
        >
          <option value="desc">Newest Bookings First</option>
          <option value="asc">Oldest Bookings First</option>
        </select>
      </div>

      {/* Mobile Card View (hidden on sm screens and up) */}
      <div className="grid grid-cols-1 gap-4 sm:hidden">
        {tickets.map((ticket) => (
          <div
            key={ticket._id}
            className="bg-[#241710] rounded-3xl p-5 border border-[#442918] shadow-xl space-y-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-mono text-[#8c7464]">BUS TRIP</span>
                <h3 className="font-bold text-[#F3E5D7] text-base">{ticket.bus?.name || "Campus Bus"}</h3>
                <p className="text-xs text-[#b89f8b]">{ticket.startPoint} → {ticket.stopPoint}</p>
              </div>
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                  ticket.used
                    ? "bg-red-500/10 text-red-400 border-red-500/20"
                    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                }`}
              >
                {ticket.used ? "Used Pass" : "Valid Active"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-[#3b2315]">
              <div className="bg-black/20 p-2.5 rounded-xl">
                <span className="text-[#8c7464] block">Seats</span>
                <span className="font-bold text-[#F3E5D7]">{ticket.seats} Passenger(s)</span>
              </div>
              <div className="bg-black/20 p-2.5 rounded-xl">
                <span className="text-[#8c7464] block">Total Fare</span>
                <span className="font-bold text-[#c9a97f]">₹{ticket.fare}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setSelectedQRTicket(ticket)}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-white font-semibold text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <span>📲</span>
                <span>Show QR Pass</span>
              </button>
              <button
                onClick={() => setSelectedTicket(ticket)}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-[#F3E5D7] font-semibold text-xs border border-white/10 active:scale-95 transition-all"
              >
                Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View (hidden on mobile) */}
      <div className="hidden sm:block overflow-hidden bg-[#241710] rounded-3xl shadow-2xl border border-[#442918]">
        <table className="min-w-full divide-y divide-[#3b2315] text-[#F3E5D7] text-sm">
          <thead className="bg-[#1c1009] text-xs uppercase tracking-wider text-[#b89f8b]">
            <tr>
              <th className="px-5 py-4 text-left font-semibold">Bus Info</th>
              <th className="px-4 py-4 text-left font-semibold">Route Checkpoints</th>
              <th className="px-4 py-4 text-center font-semibold">Seats</th>
              <th className="px-4 py-4 text-center font-semibold">Fare</th>
              <th className="px-4 py-4 text-center font-semibold">Ticket Status</th>
              <th className="px-5 py-4 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#331e12]">
            {tickets.map((ticket) => (
              <tr
                key={ticket._id}
                className="hover:bg-white/5 transition-colors"
              >
                <td className="px-5 py-4">
                  <div className="font-bold text-[#F3E5D7]">{ticket.bus?.name || "Campus Bus"}</div>
                  <div className="text-xs font-mono text-[#8c7464]">{ticket.bus?.number || "No. N/A"}</div>
                </td>
                <td className="px-4 py-4 text-xs text-[#cfb6a1]">
                  <span className="font-medium text-[#F3E5D7]">{ticket.startPoint || "Start"}</span>
                  <span className="text-[#8c7464] mx-1.5">→</span>
                  <span className="font-medium text-[#F3E5D7]">{ticket.stopPoint || "Stop"}</span>
                </td>
                <td className="px-4 py-4 text-center font-semibold">{ticket.seats}</td>
                <td className="px-4 py-4 text-center font-bold text-[#c9a97f]">
                  ₹{ticket.fare}
                </td>
                <td className="px-4 py-4 text-center">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${
                      ticket.used
                        ? "bg-red-500/10 text-red-400 border-red-500/20"
                        : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    }`}
                  >
                    {ticket.used ? "Used" : "⏳ Active Pass"}
                  </span>
                </td>
                <td className="px-5 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setSelectedQRTicket(ticket)}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 active:scale-95 transition-all px-3 py-1.5 rounded-xl text-white font-semibold text-xs shadow-md flex items-center gap-1"
                    >
                      <span>📲</span>
                      <span>QR Code</span>
                    </button>
                    <button
                      onClick={() => setSelectedTicket(ticket)}
                      className="bg-white/10 hover:bg-white/15 text-[#F3E5D7] px-3 py-1.5 rounded-xl text-xs font-medium border border-white/10 transition"
                    >
                      Details
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Details Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-[#241710] rounded-3xl shadow-2xl w-full max-w-lg p-6 sm:p-8 relative border border-[#442918] max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedTicket(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition"
            >
              ✕
            </button>

            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">🎟️</span>
              <h2 className="text-xl sm:text-2xl font-black text-[#F3E5D7]">
                {selectedTicket.bus?.name || "Campus Bus"}
              </h2>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-lg bg-white/5 text-[#d8c0ad]">
                {selectedTicket.bus?.number || "N/A"}
              </span>
            </div>
            <p className="text-xs text-[#c4aa97] mb-6">
              Assigned Route: <span className="text-[#F3E5D7] font-semibold">{selectedTicket.bus?.route?.name || "Standard Route"}</span>
            </p>

            <div className="space-y-2.5 text-xs sm:text-sm text-[#d1b8a3]">
              <div className="p-3 rounded-2xl bg-black/30 border border-white/5 flex items-center justify-between">
                <span className="text-[#8c7464]">Driver Info</span>
                <span className="font-semibold text-[#F3E5D7]">{selectedTicket.bus?.driver?.name || "TBA"} ({selectedTicket.bus?.driver?.phone || "No Phone"})</span>
              </div>
              <div className="p-3 rounded-2xl bg-black/30 border border-white/5 flex items-center justify-between">
                <span className="text-[#8c7464]">Passenger Seats</span>
                <span className="font-bold text-[#F3E5D7]">{selectedTicket.seats} Seat(s)</span>
              </div>
              <div className="p-3 rounded-2xl bg-black/30 border border-white/5 flex items-center justify-between">
                <span className="text-[#8c7464]">Boarding Checkpoint</span>
                <span className="font-semibold text-[#F3E5D7]">{selectedTicket.startPoint || "N/A"}</span>
              </div>
              <div className="p-3 rounded-2xl bg-black/30 border border-white/5 flex items-center justify-between">
                <span className="text-[#8c7464]">Destination Checkpoint</span>
                <span className="font-semibold text-[#F3E5D7]">{selectedTicket.stopPoint || "N/A"}</span>
              </div>
              <div className="p-3 rounded-2xl bg-black/30 border border-white/5 flex items-center justify-between">
                <span className="text-[#8c7464]">Total Fare Paid</span>
                <span className="font-black text-lg text-[#c9a97f]">₹{selectedTicket.fare || "0"}</span>
              </div>
              <div className="p-3 rounded-2xl bg-black/30 border border-white/5 flex items-center justify-between">
                <span className="text-[#8c7464]">Validation Status</span>
                <span
                  className={`font-semibold px-2.5 py-0.5 rounded-full text-xs ${
                    selectedTicket.used ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  }`}
                >
                  {selectedTicket.used ? "Used / Validated" : "Valid Active Pass"}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-black/30 border border-white/5 flex items-center justify-between">
                <span className="text-[#8c7464]">Booking Timestamp</span>
                <span className="font-mono text-xs text-[#cfb6a1]">
                  {selectedTicket.createdAt
                    ? format(new Date(selectedTicket.createdAt), "dd MMM yyyy, HH:mm")
                    : "N/A"}
                </span>
              </div>
            </div>

            {/* Download Ticket Button */}
            <div className="mt-6">
              <DownloadTicket ticket={selectedTicket} />
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {selectedQRTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-[#241710] rounded-3xl shadow-2xl w-full max-w-sm p-6 sm:p-8 relative flex flex-col items-center border border-[#442918]">
            <button
              onClick={() => setSelectedQRTicket(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition"
            >
              ✕
            </button>

            <span className="text-3xl mb-2">🎟️</span>
            <h2 className="text-lg sm:text-xl font-bold mb-1 text-center text-[#F3E5D7]">
              {selectedQRTicket.bus?.name || "Campus Bus"} Pass
            </h2>
            <p className="text-xs text-[#b89f8b] mb-6 text-center">
              Present this QR to conductor for instant boarding scan
            </p>

            <div className="p-4 bg-white rounded-3xl shadow-2xl">
              <QRCodeCanvas
                value={selectedQRTicket._id}
                size={230}
                bgColor="#FFFFFF"
                fgColor="#000000"
              />
            </div>

            <div className="mt-5 text-center">
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${
                  selectedQRTicket.used
                    ? "bg-red-500/10 text-red-400 border-red-500/20"
                    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                }`}
              >
                {selectedQRTicket.used ? "Pass Already Scanned" : "Ready For Conductor Scan"}
              </span>
              <p className="font-mono text-[10px] text-[#8c7464] mt-2">
                ID: {selectedQRTicket._id}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
