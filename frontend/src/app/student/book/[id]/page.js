"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import LoadingSpinner from "@/components/LoadingSpinner";
import { payWithRazorpay } from "@/lib/razorpay";
import toast from "react-hot-toast";
import CustomToast from "@/components/CustomToast";

export default function BookBusPage() {
  const { id } = useParams();
  const router = useRouter();
  const [bus, setBus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [seats, setSeats] = useState(1);
  const [startPoint, setStartPoint] = useState("");
  const [stopPoint, setStopPoint] = useState("");
  const [fare, setFare] = useState("");

  // Fetch bus details
  useEffect(() => {
    async function fetchBus() {
      try {
        const res = await api.get(`/buses/${id}`);
        setBus(res.data);
      } catch (err) {
        console.error(err);
        setError("⚠️ Failed to fetch bus details.");
      } finally {
        setLoading(false);
      }
    }
    fetchBus();
  }, [id]);

  // Auto-calculate fare with bidirectional support
  useEffect(() => {
    if (!bus?.route?.fares || !startPoint || !stopPoint) {
      setFare("");
      return;
    }

    const s = startPoint.trim().toUpperCase();
    const e = stopPoint.trim().toUpperCase();

    // Check direct matching or reverse directional matching
    const matchedFare = bus.route.fares.find(
      (f) =>
        (f.from?.trim().toUpperCase() === s && f.to?.trim().toUpperCase() === e) ||
        (f.from?.trim().toUpperCase() === e && f.to?.trim().toUpperCase() === s)
    );

    if (matchedFare && matchedFare.fare) {
      const baseFare = Number(matchedFare.fare);
      if (!isNaN(baseFare) && !isNaN(seats) && baseFare > 0 && seats > 0) {
        const totalFare = baseFare * seats;
        setFare(totalFare.toString());
      } else {
        setFare("");
      }
    } else {
      // Default estimate based on stop index distance if exact fare pair isn't defined
      const stops = bus.route?.stops || [];
      const sIdx = stops.findIndex(st => st.name?.trim().toUpperCase() === s);
      const eIdx = stops.findIndex(st => st.name?.trim().toUpperCase() === e);
      if (sIdx !== -1 && eIdx !== -1 && sIdx !== eIdx) {
        const stopDistance = Math.abs(eIdx - sIdx);
        const estimatedBase = Math.max(10, stopDistance * 10);
        setFare((estimatedBase * seats).toString());
      } else {
        setFare("");
      }
    }
  }, [startPoint, stopPoint, bus?.route?.fares, bus?.route?.stops, seats]);

  // Handle booking & payment
  async function handleBooking() {
    const fareValue = Number(fare);

    if (!fareValue || !startPoint || !stopPoint || isNaN(fareValue)) {
      toast.custom(() => (
        <CustomToast
          type="error"
          message="Please select pickup and drop-off stops to calculate fare."
        />
      ));
      return;
    }

    if (startPoint === stopPoint) {
      toast.custom(() => (
        <CustomToast
          type="error"
          message="Pickup point and drop-off point cannot be the same."
        />
      ));
      return;
    }

    await payWithRazorpay(
      fareValue,
      {
        prefill: {
          name: "Passenger",
          email: "passenger@commutex.com",
          contact: "9876543210",
        },
      },
      async () => {
        try {
          await api.post("/tickets/book", {
            busId: id,
            seats,
            startPoint,
            stopPoint,
            fare: fareValue,
          });
          toast.custom(() => (
            <CustomToast type="success" message="Booking confirmed! Ticket added to My Tickets." />
          ));
          router.push("/student/tickets");
        } catch (err) {
          console.error("Booking failed:", err);
          toast.custom(() => (
            <CustomToast type="error" message="Booking failed. Please try again." />
          ));
        }
      }
    );
  }

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-3 border-[#c9a97f] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-[#b89f8b]">Fetching bus route & fares...</p>
      </div>
    );
  }
  if (error) return <div className="p-6 rounded-3xl bg-red-950/40 border border-red-800/40 text-red-300 text-center">{error}</div>;
  if (!bus) return <div className="p-6 rounded-3xl bg-zinc-900 text-center text-zinc-400">Bus not found.</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
      {/* Bus Header Card */}
      <div className="bg-[#241710] rounded-3xl p-6 border border-[#442918] shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🚍</span>
              <h2 className="text-xl sm:text-2xl font-black text-[#F3E5D7]">
                {bus.name}
              </h2>
              <span className="font-mono text-xs px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-[#d8c0ad] font-semibold">
                {bus.number}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#c4aa97] mt-1">
              Route: <span className="text-[#F3E5D7] font-semibold">{bus.route?.name || "Assigned Route"}</span>
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="bg-black/30 px-3.5 py-2 rounded-2xl border border-white/10">
              <span className="text-[#8c7464]">Driver: </span>
              <span className="font-semibold text-[#F3E5D7]">{bus.driver?.name || "Assigned Driver"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Ticket Booking Form Card */}
      <div className="bg-[#241710] rounded-3xl p-6 sm:p-8 border border-[#442918] shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-[#3b2315] mb-6">
          <h3 className="text-lg sm:text-xl font-bold text-[#F3E5D7] flex items-center gap-2">
            <span>🎟️</span> Configure Digital Ticket
          </h3>
          <span className="text-xs text-[#b89f8b]">Instant Razorpay Checkout</span>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleBooking();
          }}
          className="space-y-5"
        >
          {/* Seats Selector */}
          <div>
            <label className="block text-xs font-semibold text-[#c9a97f] mb-1.5">
              Number of Passengers / Seats
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                max={bus.totalSeats || 50}
                value={seats}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 1;
                  setSeats(Math.max(1, Math.min(bus.totalSeats || 50, value)));
                }}
                className="w-28 px-4 py-2.5 rounded-2xl bg-[#1a100b] border border-[#422919] text-[#F3E5D7] focus:outline-none focus:border-[#c9a97f] text-sm font-bold"
              />
              <span className="text-xs text-[#8c7464]">
                Max {bus.totalSeats || 50} seats available per transaction
              </span>
            </div>
          </div>

          {/* Stops Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Start Point */}
            <div>
              <label className="block text-xs font-semibold text-[#c9a97f] mb-1.5">
                Pickup Checkpoint (Origin)
              </label>
              <select
                value={startPoint}
                onChange={(e) => setStartPoint(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-[#1a100b] border border-[#422919] text-[#F3E5D7] focus:outline-none focus:border-[#c9a97f] text-sm"
                required
              >
                <option value="">Select Boarding Stop</option>
                {bus.route?.stops?.map((stop, idx) => (
                  <option key={idx} value={stop.name}>
                    {idx + 1}. {stop.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Stop Point */}
            <div>
              <label className="block text-xs font-semibold text-[#c9a97f] mb-1.5">
                Destination Checkpoint (Drop-off)
              </label>
              <select
                value={stopPoint}
                onChange={(e) => setStopPoint(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-[#1a100b] border border-[#422919] text-[#F3E5D7] focus:outline-none focus:border-[#c9a97f] text-sm"
                required
              >
                <option value="">Select Destination Stop</option>
                {bus.route?.stops?.map((stop, idx) => (
                  <option key={idx} value={stop.name}>
                    {idx + 1}. {stop.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Fare Summary Box */}
          <div className="p-4 sm:p-5 rounded-2xl bg-black/30 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs text-[#8c7464]">Calculated Total Amount</p>
              <p className="text-2xl sm:text-3xl font-black text-[#c9a97f] mt-0.5">
                {fare ? `₹${fare}` : "₹ --"}
              </p>
            </div>
            <div className="text-xs text-[#bca28f] sm:text-right">
              <p>{seats} Seat(s) &bull; Standard Transit Fare</p>
              <p className="text-[#8c7464] mt-0.5">Includes digital boarding pass & QR code</p>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!fare}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#c9a97f] to-[#b3885c] hover:brightness-110 disabled:opacity-40 disabled:hover:brightness-100 text-[#140c08] font-bold text-base shadow-xl shadow-[#c9a97f]/20 active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <span>Proceed to Payment</span>
            <span>→</span>
          </button>
        </form>
      </div>
    </div>
  );
}
