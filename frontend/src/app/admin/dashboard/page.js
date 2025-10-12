"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AdminSidebar from "@/components/AdminSidebar";
import toast from "react-hot-toast";
import Link from "next/link";

export default function AdminDashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const [stats, setStats] = useState({
    buses: 0,
    drivers: 0,
    routes: 0,
    conductors: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        toast.error("Please login to continue");
        router.push("/login");
      } else if (user.role !== "admin") {
        toast.error("Access denied: Admins only");
        router.push(`/${user.role}`);
      } else {
        fetchStats();
      }
    }
  }, [user, loading, router]);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/stats`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!res.ok) throw new Error("Failed to load stats");
      const data = await res.json();
      setStats(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setStatsLoading(false);
    }
  };

  const downloadPdf = async (type) => {
    try {
      const res = await fetch(`${API_URL}/admin/${type}/download`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`${res.status}: ${text}`);
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(`Download failed: ${err.message}`);
    }
  };

  if (loading || !user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <p>Checking access...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1f1b16] text-[#F3E5D7]">
      <AdminSidebar />

      <main className="pt-16 md:pt-20 p-4 md:p-8 md:ml-64">
        <h1 className="text-3xl font-bold mb-2">
          Welcome to the Admin Dashboard 🛠️
        </h1>
        <p className="text-lg text-[#D7CCC8] mb-6">
          Use the sidebar to manage buses, routes, and drivers.
        </p>

        {/* === Stats Cards === */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {["buses", "drivers", "routes", "conductors"].map((key) => (
            <div
              key={key}
              className="bg-[#2e2721] rounded-2xl p-6 shadow-md flex flex-col items-center justify-center"
            >
              <p className="text-4xl font-bold text-[#FFB74D]">
                {statsLoading ? "…" : stats[key]}
              </p>
              <p className="mt-2 capitalize text-[#D7CCC8]">{key}</p>
            </div>
          ))}
        </div>

        {/* === Actions === */}
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={() => downloadPdf("drivers")}
            className="bg-[#1E88E5] text-white px-5 py-2.5 rounded-2xl shadow-md transition hover:bg-[#1976D2] hover:scale-105 active:scale-95"
          >
            📥 Download Drivers
          </button>

          {/* ✅ New Button for Conductors */}
          <button
            onClick={() => downloadPdf("conductors")}
            className="bg-[#8E24AA] text-white px-5 py-2.5 rounded-2xl shadow-md transition hover:bg-[#6A1B9A] hover:scale-105 active:scale-95"
          >
            🎟️ Download Conductors
          </button>

          <Link
            href="/admin/view-all-buses"
            className="bg-[#FF7043] text-white px-5 py-2.5 rounded-2xl shadow-md transition hover:bg-[#F4511E] hover:scale-105 active:scale-95"
          >
            🚌 View All Buses
          </Link>
        </div>
      </main>
    </div>
  );
}
