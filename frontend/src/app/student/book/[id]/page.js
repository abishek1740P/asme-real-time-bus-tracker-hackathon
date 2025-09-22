"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import LoadingSpinner from "@/components/LoadingSpinner";
import { payWithRazorpay } from "@/lib/razorpay";

export default function BookBusPage() {
  const { id } = useParams();
  const router = useRouter();
  const [bus, setBus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form state
  const [seats, setSeats] = useState(1);
  const [startPoint, setStartPoint] = useState("");
  const [stopPoint, setStopPoint] = useState("");
  const [fare, setFare] = useState("");

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

  async function handleBooking() {
    if (!fare || !startPoint || !stopPoint) return;

    // Call modular Razorpay utility
    await payWithRazorpay(fare, {
      prefill: {
        name: "Passenger",
        email: "test@example.com",
        contact: "9999999999",
      },
    }, async () => {
      // Save booking after payment
      await api.post("/tickets/book", {
        busId: id,
        seats,
        startPoint,
        stopPoint,
        fare,
      });
      alert("✅ Booking successful!");
      router.push("/student/book");
    });
  }

  if (loading) return <LoadingSpinner />;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!bus) return <p className="text-gray-400">Bus not found.</p>;

  return (
    <div className="p-4 space-y-4">
      {/* Bus Info */}
      <div className="bg-[#3E2F2C] p-4 rounded-lg text-white shadow-md">
        <h2 className="text-xl font-bold">{bus.name} ({bus.number})</h2>
        <p className="text-sm text-[#CDBFB4]">Route: {bus.route?.name || "N/A"}</p>
        <p className="text-sm text-[#CDBFB4]">Driver: {bus.driver?.name || "N/A"}</p>
        <p className="text-sm text-[#CDBFB4]">Phone: {bus.driver?.phone || "N/A"}</p>
      </div>

      {/* Booking Form */}
      <div className="bg-[#5D4037] p-4 rounded-lg shadow text-white">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleBooking();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium mb-1">Seats</label>
            <input
              type="number"
              min="1"
              max={bus.totalSeats || 50}
              value={seats}
              onChange={(e) => setSeats(parseInt(e.target.value))}
              className="w-24 p-2 rounded bg-[#3E2F2C] text-white border border-gray-500"
            />
          </div>

          {/* Start Point Dropdown */}
          <div>
            <label className="block text-sm font-medium mb-1">Start Point</label>
            <select
              value={startPoint}
              onChange={(e) => setStartPoint(e.target.value)}
              className="w-full p-2 rounded bg-[#3E2F2C] text-white border border-gray-500"
              required
            >
              <option value="">Select Start</option>
              {bus.route?.stops?.map((stop, idx) => (
                <option key={idx} value={stop.name}>{stop.name}</option>
              ))}
            </select>
          </div>

          {/* Stop Point Dropdown */}
          <div>
            <label className="block text-sm font-medium mb-1">Stop Point</label>
            <select
              value={stopPoint}
              onChange={(e) => setStopPoint(e.target.value)}
              className="w-full p-2 rounded bg-[#3E2F2C] text-white border border-gray-500"
              required
            >
              <option value="">Select Stop</option>
              {bus.route?.stops?.map((stop, idx) => (
                <option key={idx} value={stop.name}>{stop.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Fare (₹)</label>
            <input
              type="number"
              min="1"
              value={fare}
              onChange={(e) => setFare(e.target.value)}
              className="w-32 p-2 rounded bg-[#3E2F2C] text-white border border-gray-500"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 rounded bg-green-600 hover:bg-green-700 text-white font-semibold"
          >
            Pay & Book
          </button>
        </form>
      </div>
    </div>
  );
}
