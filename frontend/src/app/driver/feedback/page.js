"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import api from "@/lib/api";
import {
  MessageSquare,
  Car,
  Star,
  Send,
  User,
  Phone,
  Mail,
  Bus,
  MapPin,
  CheckCircle,
} from "lucide-react";

export default function DriverFeedbackPage() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    driverId: "",
    phone: "",
    email: "",
    vehicleNumber: "",
    route: "",
    description: "",
    rating: 0,
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingInfo, setLoadingInfo] = useState(true);

  const maxChars = 200;

  useEffect(() => {
    if (user && user.role === "driver") {
      fetchDriverAndBusInfo();
    }
  }, [user]);

  const fetchDriverAndBusInfo = async () => {
    try {
      setLoadingInfo(true);
      const busRes = await api.get("/drivers/me/assigned-bus");

      if (busRes.data) {
        setFormData({
          name: user?.name || user?.username || "",
          driverId: user?.id || user?._id || user?.driverId || "",
          phone: user?.phone || user?.phoneNumber || "",
          email: user?.email || user?.emailAddress || "",
          vehicleNumber: busRes.data.number || busRes.data.vehicleNumber || "",
          route: busRes.data.route?.name || busRes.data.routeName || "",
          description: "",
          rating: 0,
        });
      }
    } catch {
      toast.error("Failed to load driver vehicle data");
    } finally {
      setLoadingInfo(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "description" && value.length > maxChars) return;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRatingClick = (rating) => {
    setFormData((prev) => ({ ...prev, rating }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.driverId ||
      !formData.phone ||
      !formData.email ||
      !formData.vehicleNumber ||
      !formData.route ||
      !formData.description ||
      formData.rating === 0
    ) {
      toast.error("Please fill all fields and choose a rating");
      return;
    }

    try {
      setLoading(true);
      await api.post("/driver/feedback", formData);
      setSubmitted(true);
      toast.success("Driver feedback submitted successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit feedback");
    } finally {
      setLoading(false);
    }
  };

  if (loadingInfo) {
    return (
      <div className="min-h-screen bg-[#140c08] text-white flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-[#c9a97f] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-[#a89078]">Loading driver profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#140c08] text-[#F3E5D7] pt-20 md:pt-24 pb-16 px-4 max-w-xl mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#c9a97f]/10 border border-[#c9a97f]/30 text-[#c9a97f] text-xs font-semibold uppercase tracking-wider mb-2">
          <Car size={13} />
          Driver Road Report
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white">
          Submit Road & Route Feedback
        </h1>
        <p className="text-xs text-[#8c7464] mt-1">
          Report traffic conditions, vehicle performance, or road safety observations to administration.
        </p>
      </div>

      {submitted ? (
        <div className="bg-[#1e130c]/90 border border-emerald-500/40 rounded-3xl p-8 text-center shadow-xl animate-fadeIn">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={30} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Feedback Received!</h2>
          <p className="text-xs text-[#8c7464] mb-6">
            Thank you for your report. The fleet operations team has logged your submission for review.
          </p>
          <button
            onClick={() => {
              setSubmitted(false);
              setFormData((prev) => ({ ...prev, description: "", rating: 0 }));
            }}
            className="px-5 py-2.5 rounded-xl bg-[#2a1a11] hover:bg-[#342217] border border-[#3d2618] text-[#c9a97f] text-xs font-semibold transition-colors"
          >
            Submit Another Report
          </button>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="bg-[#1e130c]/90 border border-[#3d2618] p-6 rounded-3xl shadow-xl space-y-4"
        >
          {/* Readonly Dispatch Summary */}
          <div className="p-3.5 rounded-2xl bg-[#140c08] border border-[#2e1c10] grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[#8c7464] block text-[10px]">Driver</span>
              <span className="text-white font-medium flex items-center gap-1.5 truncate">
                <User size={12} className="text-blue-400 shrink-0" />
                {formData.name || "N/A"}
              </span>
            </div>
            <div>
              <span className="text-[#8c7464] block text-[10px]">Bus Registration</span>
              <span className="text-white font-medium flex items-center gap-1.5 truncate">
                <Bus size={12} className="text-amber-400 shrink-0" />
                {formData.vehicleNumber || "N/A"}
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-[#8c7464] block text-[10px]">Assigned Route</span>
              <span className="text-white font-medium flex items-center gap-1.5 truncate">
                <MapPin size={12} className="text-orange-400 shrink-0" />
                {formData.route || "N/A"}
              </span>
            </div>
          </div>

          {/* Rating */}
          <div>
            <label className="block text-xs font-semibold text-[#c9a97f] mb-2 text-center">
              Overall Trip / Road Rating (1 - 10)
            </label>
            <div className="flex justify-between items-center gap-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleRatingClick(num)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                    formData.rating === num
                      ? "bg-[#c9a97f] text-[#140c08] shadow-md scale-105"
                      : formData.rating > num
                      ? "bg-[#2a1a11] text-[#c9a97f] border border-[#3d2618]"
                      : "bg-[#140c08] text-[#8c7464] border border-[#2e1c10] hover:text-white"
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Remarks */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-medium text-[#c9a97f]">
                Detailed Road & Vehicle Remarks
              </label>
              <span className="text-[10px] text-[#8c7464]">
                {formData.description.length} / {maxChars}
              </span>
            </div>
            <textarea
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleChange}
              placeholder="Report traffic bottlenecks, road diversions, mechanical concerns, or passenger flow notes..."
              className="w-full p-3.5 rounded-xl bg-[#140c08] border border-[#3d2618] text-white text-xs leading-relaxed focus:outline-none focus:border-[#c9a97f] resize-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#b3885c] to-[#c9a97f] hover:from-[#c9a97f] hover:to-[#dfc39e] text-[#140c08] font-bold text-xs shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Send size={14} />
            {loading ? "Submitting Report..." : "Submit Driver Feedback"}
          </button>
        </form>
      )}
    </div>
  );
}
