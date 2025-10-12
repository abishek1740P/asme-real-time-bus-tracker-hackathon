"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import CustomToast from "@/components/CustomToast";

export default function FeedbackPage() {
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

      if (!res.ok) throw new Error("Failed to submit feedback");

      const data = await res.json();
      console.log("✅ Feedback saved:", data);
      setSubmitted(true);
      setFormData({
        name: "",
        phone: "",
        email: "",
        description: "",
        rating: 0,
      });
    } catch (err) {
      console.error(err);
      toast.custom(() => (
        <CustomToast
          type="error"
          message="Failed to submit feedback. Please try again."
        />
      ));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-lg mx-auto text-white">
      <h1 className="text-2xl font-bold mb-4">📝 Passenger Feedback</h1>

      {submitted ? (
        <div className="bg-green-700 text-white p-3 rounded-md shadow">
          ✅ Thank you for your feedback!
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="space-y-4 bg-[#3E2F2C] p-4 rounded-lg shadow-md"
        >
          {/* Name */}
          <div>
            <label className="block mb-1 font-medium">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your name"
              className="w-full p-2 rounded-md shadow-sm bg-[#5D4037] text-white border border-[#3E2F2C] focus:ring-2 focus:ring-[#7B4B32] outline-none"
              required
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block mb-1 font-medium">Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Enter your phone number"
              className="w-full p-2 rounded-md shadow-sm bg-[#5D4037] text-white border border-[#3E2F2C] focus:ring-2 focus:ring-[#7B4B32] outline-none"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block mb-1 font-medium">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              className="w-full p-2 rounded-md shadow-sm bg-[#5D4037] text-white border border-[#3E2F2C] focus:ring-2 focus:ring-[#7B4B32] outline-none"
              required
            />
          </div>

          {/* Rating */}
          <div>
            <label className="block mb-3 font-medium">
              ⭐ How would you rate your experience? (1-10)
            </label>
            <div className="flex flex-wrap gap-2 justify-center">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleRatingClick(star)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200 transform hover:scale-110 ${
                    formData.rating === star
                      ? "bg-[#FFD700] text-[#3E2F2C] shadow-lg"
                      : "bg-[#5D4037] text-white hover:bg-[#7B4B32]"
                  }`}
                >
                  {star}
                </button>
              ))}
            </div>
            <p className="text-center text-sm text-gray-400 mt-2">
              {formData.rating === 0
                ? "Click a number to rate"
                : `You rated: ${formData.rating}/10`}
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block mb-1 font-medium">
              Feedback / Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Write your feedback..."
              className="w-full p-2 rounded-md shadow-sm bg-[#5D4037] text-white border border-[#3E2F2C] focus:ring-2 focus:ring-[#7B4B32] outline-none"
              rows={5}
              required
            />
            <p className="text-sm text-gray-400 mt-1">
              {formData.description.length}/{maxChars} characters
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#5D4037] hover:bg-[#7B4B32] text-white py-2 rounded-lg shadow disabled:opacity-50 transition-colors duration-200 font-medium"
          >
            {loading ? "Submitting..." : "✨ Submit Feedback"}
          </button>
        </form>
      )}
    </div>
  );
}
