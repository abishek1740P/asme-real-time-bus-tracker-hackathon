"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import {
  History,
  Search,
  Calendar,
  Ticket,
  Eye,
  X,
  IndianRupee,
  MapPin,
  Clock,
  User,
  AlertCircle,
} from "lucide-react";

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
        setHistory(res.data || []);
      } catch (err) {
        toast.error("Failed to fetch scan history");
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
        item.routeName?.toLowerCase().includes(query) ||
        item.ticketId?.toLowerCase().includes(query)) ??
      false;

    const matchesDate = selectedDate
      ? new Date(item.scannedAt).toISOString().slice(0, 10) === selectedDate
      : true;

    return matchesSearch && matchesDate;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-10 h-10 border-4 border-[#c9a97f] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-[#a89078]">Loading validation logs...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
            <History className="text-[#c9a97f]" />
            Ticket Validation History
          </h1>
          <p className="text-xs md:text-sm text-[#8c7464] mt-0.5">
            Audit log of all passenger boarding passes verified during your shifts.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#c9a97f]/10 border border-[#c9a97f]/30 text-[#c9a97f] text-xs font-semibold self-start sm:self-auto">
          {history.length} Total Validations
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8c7464]" />
          <input
            type="text"
            placeholder="Search by passenger name, ticket ID, or route..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#1e130c]/70 border border-[#2e1c10] text-xs md:text-sm text-[#F3E5D7] placeholder-[#8c7464] focus:outline-none focus:border-[#c9a97f]"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8c7464]" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="pl-9 pr-3 py-2 rounded-xl bg-[#1e130c] border border-[#2e1c10] text-xs text-[#F3E5D7] focus:outline-none focus:border-[#c9a97f]"
            />
          </div>
          {selectedDate && (
            <button
              onClick={() => setSelectedDate("")}
              className="px-2.5 py-2 text-xs text-[#a89078] hover:text-white bg-[#2a1a11] rounded-xl border border-[#3d2618]"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* History Records Table (Desktop) */}
      <div className="hidden md:block overflow-hidden rounded-2xl border border-[#2e1c10] bg-[#1e130c]/80 shadow-xl">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#2e1c10] text-[#8c7464] bg-[#140c08]">
              <th className="p-3.5 font-semibold">Passenger</th>
              <th className="p-3.5 font-semibold">Ticket ID</th>
              <th className="p-3.5 font-semibold">Route</th>
              <th className="p-3.5 font-semibold">Fare Paid</th>
              <th className="p-3.5 font-semibold">Scanned At</th>
              <th className="p-3.5 font-semibold text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2e1c10]/60">
            {filteredHistory.map((item) => (
              <tr
                key={item._id}
                className="hover:bg-[#2a1a11]/40 transition-colors"
              >
                <td className="p-3.5 font-semibold text-white">
                  {item.studentName || "Unknown"}
                </td>
                <td className="p-3.5 font-mono text-[#a89078]">
                  {item.ticketId || "N/A"}
                </td>
                <td className="p-3.5 text-[#F3E5D7]">
                  {item.routeName || "N/A"}
                </td>
                <td className="p-3.5 font-medium text-amber-300">
                  {item.fare ? `₹${item.fare}` : "—"}
                </td>
                <td className="p-3.5 text-[#8c7464]">
                  {new Date(item.scannedAt).toLocaleString()}
                </td>
                <td className="p-3.5 text-right">
                  <button
                    onClick={() => setSelectedTicket(item)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2a1a11] hover:bg-[#342217] border border-[#3d2618] text-[#c9a97f] hover:text-white transition-colors"
                  >
                    <Eye size={13} />
                    View
                  </button>
                </td>
              </tr>
            ))}
            {filteredHistory.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center py-12 text-[#8c7464]">
                  No matching scan logs found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile History Cards */}
      <div className="md:hidden space-y-3">
        {filteredHistory.map((item) => (
          <div
            key={item._id}
            className="bg-[#1e130c]/80 border border-[#2e1c10] p-4 rounded-2xl shadow-lg flex flex-col justify-between"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <h3 className="font-bold text-white text-sm">
                  {item.studentName || "Unknown Passenger"}
                </h3>
                <span className="text-[11px] font-mono text-[#8c7464]">
                  {item.ticketId || "N/A"}
                </span>
              </div>
              <span className="text-xs font-bold text-amber-300 px-2 py-0.5 rounded-md bg-[#2a1a11] border border-[#3d2618]">
                {item.fare ? `₹${item.fare}` : "Free"}
              </span>
            </div>

            <div className="text-xs text-[#a89078] space-y-1 py-2 border-y border-[#2e1c10]/60 my-2">
              <div className="flex items-center gap-1.5">
                <MapPin size={12} className="text-orange-400" />
                <span className="truncate">{item.routeName || "Route N/A"}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#8c7464]">
                <Clock size={12} />
                <span>{new Date(item.scannedAt).toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedTicket(item)}
              className="mt-1 w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#2a1a11] text-[#c9a97f] font-semibold text-xs border border-[#3d2618]"
            >
              <Eye size={13} />
              View Full Receipt
            </button>
          </div>
        ))}

        {filteredHistory.length === 0 && (
          <div className="text-center py-12 px-4 bg-[#1e130c]/40 rounded-2xl border border-[#2e1c10]">
            <AlertCircle size={36} className="mx-auto text-[#8c7464] mb-2" />
            <p className="text-sm text-[#F3E5D7]">No scan history found</p>
          </div>
        )}
      </div>

      {/* Ticket Details Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-[#1e130c] border border-[#3d2618] text-[#F3E5D7] p-6 rounded-3xl max-w-sm w-full shadow-2xl relative">
            <button
              onClick={() => setSelectedTicket(null)}
              className="absolute right-4 top-4 text-[#8c7464] hover:text-white p-1 rounded-lg"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-[#2e1c10]">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-[#c9a97f]">
                <Ticket size={18} />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Boarding Ticket</h3>
                <span className="text-[11px] font-mono text-[#8c7464]">
                  {selectedTicket.ticketId || "N/A"}
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-[#2e1c10]/60">
                <span className="text-[#8c7464]">Passenger</span>
                <span className="text-white font-semibold">
                  {selectedTicket.studentName || "Unknown"}
                </span>
              </div>

              {selectedTicket.busNumber && (
                <div className="flex justify-between py-1.5 border-b border-[#2e1c10]/60">
                  <span className="text-[#8c7464]">Vehicle / Bus</span>
                  <span className="text-[#c9a97f] font-mono font-semibold">
                    {selectedTicket.busNumber}
                  </span>
                </div>
              )}

              <div className="flex justify-between py-1.5 border-b border-[#2e1c10]/60">
                <span className="text-[#8c7464]">Route</span>
                <span className="text-white font-medium">
                  {selectedTicket.routeName || "N/A"}
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-[#2e1c10]/60">
                <span className="text-[#8c7464]">Boarding Stop</span>
                <span className="text-emerald-400 font-medium">
                  {selectedTicket.startPoint || "N/A"}
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-[#2e1c10]/60">
                <span className="text-[#8c7464]">Destination Stop</span>
                <span className="text-red-400 font-medium">
                  {selectedTicket.stopPoint || "N/A"}
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-[#2e1c10]/60">
                <span className="text-[#8c7464]">Seats Reserved</span>
                <span className="text-white font-semibold">
                  {selectedTicket.seats || 1}
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-[#2e1c10]/60">
                <span className="text-[#8c7464]">Fare Collected</span>
                <span className="text-amber-300 font-bold">
                  {selectedTicket.fare ? `₹${selectedTicket.fare}` : "N/A"}
                </span>
              </div>

              <div className="flex justify-between py-1.5">
                <span className="text-[#8c7464]">Scanned Timestamp</span>
                <span className="text-[#a89078]">
                  {new Date(selectedTicket.scannedAt).toLocaleString()}
                </span>
              </div>
            </div>

            <button
              onClick={() => setSelectedTicket(null)}
              className="mt-6 w-full py-2.5 rounded-xl bg-gradient-to-r from-[#b3885c] to-[#c9a97f] text-[#140c08] font-bold text-xs shadow-md transition-all active:scale-95"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
