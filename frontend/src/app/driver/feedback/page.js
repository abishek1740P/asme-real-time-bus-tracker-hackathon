"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import CustomToast from "@/components/CustomToast";
import api from "@/lib/api";

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
  const [busInfo, setBusInfo] = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(true);

  const maxChars = 200;

  // Fetch driver and bus information when component mounts
  useEffect(() => {
    if (user && user.role === "driver") {
      fetchDriverAndBusInfo();
    }
  }, [user]);

  const fetchDriverAndBusInfo = async () => {
    try {
      setLoadingInfo(true);
      console.log("🔄 Fetching driver info:", user); // Debug log

      // Fetch assigned bus info
      const busRes = await api.get("/drivers/me/assigned-bus");
      console.log("🚌 Bus response:", busRes.data); // Debug log

      if (busRes.data) {
        setBusInfo(busRes.data);

        // Auto-fill form with driver and bus information
        // Use proper field access based on your user object structure
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
    } catch (err) {
      console.error("Error fetching driver/bus info:", err);
      toast.custom(() => (
        <CustomToast type="error" message="Failed to load driver information" />
      ));
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
        `${process.env.NEXT_PUBLIC_API_URL}/driver/feedback`,
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
      console.log("✅ Driver feedback saved:", data);
      setSubmitted(true);

      // Reset only the feedback fields, keep auto-filled info
      setFormData((prev) => ({
        ...prev,
        description: "",
        rating: 0,
      }));

      toast.custom(() => (
        <CustomToast
          type="success"
          message="Driver feedback submitted successfully!"
        />
      ));
    } catch (err) {
      console.error("Feedback submission error:", err);
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

  // If still loading info, show loading state
  if (loadingInfo) {
    return (
      <div className="p-4 max-w-lg mx-auto text-white">
        <h1 className="text-2xl font-bold mb-4">🚗 Driver Feedback</h1>
        <div className="text-center py-8">
          <div className="inline-flex items-center gap-2 text-[#3498DB]">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#3498DB]"></div>
            Loading driver information...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-lg mx-auto text-white">
      <h1 className="text-2xl font-bold mb-4">🚗 Driver Feedback</h1>

      {submitted ? (
        <div className="bg-green-700 text-white p-3 rounded-md shadow">
          ✅ Thank you for your feedback! We'll review it shortly.
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="space-y-4 bg-[#2C3E50] p-4 rounded-lg shadow-md"
        >
          {/* Auto-filled Information Notice */}
          <div className="bg-[#34495E] p-3 rounded-md border border-[#3498DB]">
            <p className="text-sm text-[#3498DB] font-medium">
              ℹ️ Your driver information has been automatically filled. You only
              need to add your rating and feedback comments.
            </p>
          </div>

          {/* Name (Read-only since it's auto-filled) */}
          <div>
            <label className="block mb-1 font-medium">Driver Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              readOnly
              className="w-full p-2 rounded-md shadow-sm bg-[#2C3E50] text-gray-300 border border-[#34495E] cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">
              {formData.name
                ? "Auto-filled from your profile"
                : "Not available"}
            </p>
          </div>

          {/* Phone (Read-only) */}
          <div>
            <label className="block mb-1 font-medium">Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              readOnly
              className="w-full p-2 rounded-md shadow-sm bg-[#2C3E50] text-gray-300 border border-[#34495E] cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">
              {formData.phone
                ? "Auto-filled from your profile"
                : "Not available in profile"}
            </p>
          </div>

          {/* Email (Read-only) */}
          <div>
            <label className="block mb-1 font-medium">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              readOnly
              className="w-full p-2 rounded-md shadow-sm bg-[#2C3E50] text-gray-300 border border-[#34495E] cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">
              {formData.email
                ? "Auto-filled from your profile"
                : "Not available"}
            </p>
          </div>

          {/* Vehicle Number (Read-only) */}
          <div>
            <label className="block mb-1 font-medium">Vehicle Number</label>
            <input
              type="text"
              name="vehicleNumber"
              value={formData.vehicleNumber}
              readOnly
              className="w-full p-2 rounded-md shadow-sm bg-[#2C3E50] text-gray-300 border border-[#34495E] cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">
              {formData.vehicleNumber
                ? "Auto-filled from your assigned bus"
                : "No bus assigned"}
            </p>
          </div>

          {/* Route (Read-only) */}
          <div>
            <label className="block mb-1 font-medium">Route</label>
            <input
              type="text"
              name="route"
              value={formData.route}
              readOnly
              className="w-full p-2 rounded-md shadow-sm bg-[#2C3E50] text-gray-300 border border-[#34495E] cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">
              {formData.route
                ? "Auto-filled from your assigned route"
                : "No route assigned"}
            </p>
          </div>

          {/* Rating - User needs to select this */}
          <div>
            <label className="block mb-3 font-medium">
              ⭐ How would you rate your experience? (1-10) *
            </label>
            <div className="flex flex-wrap gap-2 justify-center">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleRatingClick(star)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200 transform hover:scale-110 ${
                    formData.rating === star
                      ? "bg-[#3498DB] text-white shadow-lg"
                      : "bg-[#34495E] text-white hover:bg-[#2980B9]"
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

          {/* Description - User needs to fill this */}
          <div>
            <label className="block mb-1 font-medium">
              Feedback / Comments *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Write your feedback about your experience, challenges, suggestions, etc."
              className="w-full p-2 rounded-md shadow-sm bg-[#34495E] text-white border border-[#2C3E50] focus:ring-2 focus:ring-[#3498DB] outline-none"
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
            disabled={loading || !formData.phone || !formData.email}
            className="w-full bg-[#34495E] hover:bg-[#3498DB] text-white py-2 rounded-lg shadow disabled:opacity-50 transition-colors duration-200 font-medium"
          >
            {loading ? "Submitting..." : "📝 Submit Driver Feedback"}
          </button>
        </form>
      )}

      {/* Driver Information Summary */}
      {!submitted && (
        <div className="mt-6 bg-[#34495E] p-4 rounded-lg border border-[#2C3E50]">
          <h3 className="font-medium mb-2 text-[#3498DB]">Your Information</h3>
          <div className="text-sm text-gray-300 space-y-1">
            <p>
              👤 <strong>Name:</strong> {formData.name || "Not available"}
            </p>
            <p>
              📞 <strong>Phone:</strong>{" "}
              {formData.phone || "Not available in profile"}
            </p>
            <p>
              📧 <strong>Email:</strong> {formData.email || "Not available"}
            </p>
            <p>
              🚌 <strong>Vehicle:</strong>{" "}
              {formData.vehicleNumber || "No bus assigned"}
            </p>
            <p>
              🗺️ <strong>Route:</strong> {formData.route || "No route assigned"}
            </p>
            <p className="text-xs text-gray-400 mt-2">
              All fields above are automatically filled from your driver profile
              and assigned bus.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
