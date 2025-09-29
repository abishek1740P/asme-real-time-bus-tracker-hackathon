"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import CustomToast from "@/components/CustomToast";
import api from "@/lib/api";

export default function DriverHomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [bus, setBus] = useState(null);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        toast.custom(() => (
          <CustomToast type="error" message="Please login to continue" />
        ));
        // toast.error("Please login to continue");
        router.push("/login");
      } else if (user.role !== "driver") {
        toast.custom(() => (
          <CustomToast type="error" message="Access denied: Drivers only" />
        ));
        // toast.error("Access denied: Drivers only");
        router.push(`/${user.role}`);
      } else {
        fetchBusDetails();
      }
    }
  }, [user, loading]);

  const fetchBusDetails = async () => {
    try {
      const res = await api.get("/drivers/me/assigned-bus");
      setBus(res.data);
    } catch (err) {
      toast.custom(() => (
        <CustomToast type="error" message="Failed to fetch bus info" />
      ));
      // toast.error("Failed to fetch bus info");
    }
  };

  if (loading || !user || user.role !== "driver") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1A0E0E] text-white">
        <p>Checking access...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1A0E0E] text-[#FCE8E8] p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-[#FF6B6B] mb-6 border-b border-[#4B1C1C] pb-2">
          🚍 Driver Panel
        </h1>

        <h2 className="text-2xl font-semibold mb-2">Welcome, {user.name}</h2>
        <p className="text-md text-[#E3BEBE] mb-4">
          Access your tools and navigation below.
        </p>

        {bus && (
          <div className="bg-[#2F1515] p-4 rounded-lg mb-6 shadow text-sm space-y-1">
            <p>
              🚌 <strong>Bus Name:</strong> {bus.name}
            </p>
            <p>
              🔢 <strong>Bus Number:</strong> {bus.number}
            </p>
            <p>
              🗺️ <strong>Route:</strong> {bus.route?.name || "N/A"}
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/driver/gps"
            className="bg-[#8B0000] hover:bg-[#A30000] text-white font-semibold px-5 py-3 rounded-lg shadow transition duration-200 text-center"
          >
            Go to GPS Tracking
          </Link>
        </div>
      </div>
    </div>
  );
}
