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

  // Auto-calculate fare
  useEffect(() => {
    if (!bus?.route?.fares) return;

    const matchedFare = bus.route.fares.find(
      (f) =>
        f.from.trim().toUpperCase() === startPoint.trim().toUpperCase() &&
        f.to.trim().toUpperCase() === stopPoint.trim().toUpperCase()
    );

    if (matchedFare) setFare(Number(matchedFare.fare));
    else setFare(0);
  }, [startPoint, stopPoint, bus?.route?.fares]);

  // Handle booking & payment
  async function handleBooking() {
    if (!fare || !startPoint || !stopPoint) {
      toast.custom(() => (
        <CustomToast
          type="error"
          message="Please select start and stop points and ensure fare is valid."
        />
      ));
      return;
    }

    await payWithRazorpay(
      fare,
      {
        prefill: {
          name: "Passenger",
          email: "test@example.com",
          contact: "9597389320",
        },
      },
      async () => {
        try {
          await api.post("/tickets/book", {
            busId: id,
            seats,
            startPoint,
            stopPoint,
            fare,
          });
          toast.custom(() => (
            <CustomToast type="success" message="Booking successful!" />
          ));
          router.push("/student");
        } catch (err) {
          console.error(err);
          toast.custom(() => (
            <CustomToast type="error" message="Booking failed. Try again." />
          ));
        }
      }
    );
  }

  if (loading) return <LoadingSpinner />;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!bus) return <p className="text-gray-400">Bus not found.</p>;

  return (
    <div className="min-h-screen p-4 md:p-12 bg-[#1f1b16] text-[#F3E5D7] space-y-6">
      <div className="bg-[#2D2421] p-6 rounded-2xl shadow-lg max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-2">
          {bus.name} ({bus.number})
        </h2>
        <p className="text-sm text-[#CDB7AE]">
          Route: {bus.route?.name || "N/A"}
        </p>
        <p className="text-sm text-[#CDB7AE]">
          Driver: {bus.driver?.name || "N/A"}
        </p>
        <p className="text-sm text-[#CDB7AE]">
          Phone: {bus.driver?.phone || "N/A"}
        </p>
      </div>

      <div className="bg-[#2D2421] p-6 rounded-2xl shadow-lg max-w-3xl mx-auto">
        <h3 className="text-xl font-bold mb-4 text-center">
          🎟️ Book Your Ticket
        </h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleBooking();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block font-semibold mb-1">Seats</label>
            <input
              type="number"
              min="1"
              max={bus.totalSeats || 50}
              value={seats}
              onChange={(e) => setSeats(parseInt(e.target.value))}
              className="w-24 p-2 rounded-lg bg-[#3a312a] text-[#F3E5D7] border border-[#CDB7AE] focus:outline-none focus:ring-2 focus:ring-[#CDB7AE]"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Start Point</label>
            <select
              value={startPoint}
              onChange={(e) => setStartPoint(e.target.value)}
              className="w-full p-2 rounded-lg bg-[#3a312a] text-[#F3E5D7] border border-[#CDB7AE] focus:outline-none focus:ring-2 focus:ring-[#CDB7AE]"
              required
            >
              <option value="">Select Start</option>
              {bus.route?.stops?.map((stop, idx) => (
                <option key={idx} value={stop.name}>
                  {stop.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1">Stop Point</label>
            <select
              value={stopPoint}
              onChange={(e) => setStopPoint(e.target.value)}
              className="w-full p-2 rounded-lg bg-[#3a312a] text-[#F3E5D7] border border-[#CDB7AE] focus:outline-none focus:ring-2 focus:ring-[#CDB7AE]"
              required
            >
              <option value="">Select Stop</option>
              {bus.route?.stops?.map((stop, idx) => (
                <option key={idx} value={stop.name}>
                  {stop.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1">Fare (₹)</label>
            <input
              type="number"
              min="0"
              value={fare}
              readOnly
              className="w-32 p-2 rounded-lg bg-[#3a312a] text-[#F3E5D7] border border-[#CDB7AE] focus:outline-none focus:ring-2 focus:ring-[#CDB7AE]"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 rounded-2xl bg-[#CDB7AE] text-[#1f1b16] font-semibold hover:bg-[#e0c6ae] transition"
          >
            Pay & Book
          </button>
        </form>
      </div>
    </div>
  );
}
