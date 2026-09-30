"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import CustomToast from "@/components/CustomToast";
import api from "@/lib/api";

export default function FeedbackPage() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    description: "",
    rating: 0, // 0 means no rating selected
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const maxChars = 200;

  // Auto-fill user information when component mounts
  useEffect(() => {
    if (user && user.role === "student") {
      setFormData((prev) => ({
        ...prev,
        name: user.name || "",
        email: user.email || "",
        // Phone is not auto-filled since it's not in the database
      }));
    }
  }, [user]);

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
      !formData.phone ||
      !formData.email ||
      !formData.description ||
      formData.rating === 0
    ) {
      toast.custom(() => (
        <CustomToast
          type="error"
          message="Please fill all fields and select a rating"
        />
      ));
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/student/feedback`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to submit feedback");
      }

      const data = await res.json();
 
      setSubmitted(true);

      // Reset only the feedback fields, keep user info
      setFormData((prev) => ({
        ...prev,
        phone: "", // Reset phone since user needs to enter it each time
        description: "",
        rating: 0,
      }));

      toast.custom(() => (
        <CustomToast
          type="success"
          message="Feedback submitted successfully!"
        />
      ));
    } catch (err) {
      console.error(err);
      toast.custom(() => (
        <CustomToast
          type="error"
          message={
            err.message || "Failed to submit feedback. Please try again."
          }
        />
      ));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F3E5D7] flex items-center gap-2">
          <span>📝</span> Passenger Experience Feedback
        </h1>
        <p className="text-xs sm:text-sm text-[#b89f8b]">
          Your ratings and reports help us improve route timing, driver courtesy, and bus safety.
        </p>
      </div>

      {submitted ? (
        <div className="p-8 rounded-3xl bg-emerald-950/40 border border-emerald-700/50 text-center space-y-3 shadow-2xl">
          <span className="text-5xl">🎉</span>
          <h2 className="text-xl font-bold text-emerald-200">Thank You For Your Feedback!</h2>
          <p className="text-xs sm:text-sm text-emerald-300/80 max-w-sm mx-auto">
            Your review has been successfully submitted and dispatched to the campus transit administration team.
          </p>
          <button
            onClick={() => setSubmitted(false)}
            className="mt-4 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs transition"
          >
            Submit Another Feedback
          </button>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="bg-[#241710] rounded-3xl p-6 sm:p-8 border border-[#442918] shadow-2xl space-y-5"
        >
          {/* Identity Notice */}
          <div className="bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-2xl flex items-center gap-3">
            <span className="text-lg">ℹ️</span>
            <p className="text-xs text-amber-200/90 font-medium">
              Profile details are verified automatically. Please rate your transit experience and provide details.
            </p>
          </div>

          {/* Name & Email Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#c9a97f] mb-1.5">Passenger Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                readOnly
                className="w-full px-4 py-2.5 rounded-2xl bg-black/40 text-[#c4aa97] border border-white/5 text-sm cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#c9a97f] mb-1.5">Registered Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                readOnly
                className="w-full px-4 py-2.5 rounded-2xl bg-black/40 text-[#c4aa97] border border-white/5 text-sm cursor-not-allowed truncate"
              />
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-xs font-semibold text-[#c9a97f] mb-1.5">Contact Phone Number *</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="e.g. 9876543210"
              className="w-full px-4 py-2.5 rounded-2xl bg-[#1a100b] border border-[#422919] text-[#F3E5D7] placeholder-[#8c7464] focus:outline-none focus:border-[#c9a97f] text-sm"
              required
            />
          </div>

          {/* Rating Scale */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-[#c9a97f]">
                Rate Service & Safety (1 to 10) *
              </label>
              <span className="text-xs font-bold text-[#e6c79c]">
                {formData.rating === 0 ? "Select Rating" : `${formData.rating} / 10`}
              </span>
            </div>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleRatingClick(star)}
                  className={`py-2 rounded-xl text-xs font-black transition-all ${
                    formData.rating === star
                      ? "bg-[#c9a97f] text-[#140c08] shadow-lg shadow-[#c9a97f]/30 scale-105"
                      : "bg-[#1a100b] text-[#d1b8a3] hover:bg-[#331e12] border border-[#442918]"
                  }`}
                >
                  {star}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-[#c9a97f]">
                Detailed Feedback & Comments *
              </label>
              <span className="text-[11px] text-[#8c7464]">
                {formData.description.length}/{maxChars}
              </span>
            </div>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Share thoughts about driver punctuality, bus cleanliness, ticket scanning, or overall route schedule..."
              className="w-full px-4 py-3 rounded-2xl bg-[#1a100b] border border-[#422919] text-[#F3E5D7] placeholder-[#8c7464] focus:outline-none focus:border-[#c9a97f] text-sm leading-relaxed"
              rows={4}
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#c9a97f] to-[#b3885c] hover:brightness-110 disabled:opacity-50 text-[#140c08] font-bold text-sm shadow-xl shadow-[#c9a97f]/20 active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-[#140c08] border-t-transparent rounded-full animate-spin"></div>
                <span>Submitting Feedback...</span>
              </>
            ) : (
              <>
                <span>✨ Submit Passenger Feedback</span>
                <span>→</span>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
