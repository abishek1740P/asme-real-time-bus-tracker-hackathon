"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AdminSidebar from "@/components/AdminSidebar";
import toast from "react-hot-toast";
import Link from "next/link";
import {
  Bus,
  Users,
  MapPin,
  UserCheck,
  Download,
  ExternalLink,
  Shield,
  Activity,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";

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
  const [downloading, setDownloading] = useState("");

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
      toast.error(err.message || "Failed to load stats");
    } finally {
      setStatsLoading(false);
    }
  };

  const downloadPdf = async (type) => {
    setDownloading(type);
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
      a.download = `${type}_report_${new Date().toISOString().split("T")[0]}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success(`${type} PDF downloaded successfully!`);
    } catch (err) {
      toast.error(`Download failed: ${err.message}`);
    } finally {
      setDownloading("");
    }
  };

  if (loading || !user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#140c08] text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#c9a97f] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#a89078] text-sm animate-pulse">Authenticating Admin Access...</p>
        </div>
      </div>
    );
  }

  const statItems = [
    {
      key: "buses",
      label: "Active Buses",
      icon: Bus,
      href: "/admin/buses",
      color: "from-amber-500/20 to-amber-700/10",
      border: "border-amber-500/30",
      text: "text-amber-400",
    },
    {
      key: "routes",
      label: "Assigned Routes",
      icon: MapPin,
      href: "/admin/routes",
      color: "from-orange-500/20 to-orange-700/10",
      border: "border-orange-500/30",
      text: "text-orange-400",
    },
    {
      key: "drivers",
      label: "Registered Drivers",
      icon: Users,
      href: "/admin/drivers",
      color: "from-blue-500/20 to-blue-700/10",
      border: "border-blue-500/30",
      text: "text-blue-400",
    },
    {
      key: "conductors",
      label: "Conductors",
      icon: UserCheck,
      href: "/admin/conductor",
      color: "from-purple-500/20 to-purple-700/10",
      border: "border-purple-500/30",
      text: "text-purple-400",
    },
  ];

  return (
    <div className="min-h-screen bg-[#140c08] text-[#F3E5D7]">
      <AdminSidebar />

      <main className="pt-20 md:pt-24 pb-16 px-4 md:px-8 md:ml-64 max-w-7xl">
        {/* === Header Hero === */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#c9a97f]/10 border border-[#c9a97f]/30 text-[#c9a97f] text-xs font-semibold uppercase tracking-wider mb-3">
            <Shield size={13} />
            Operations Command Center
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-4xl font-extrabold text-[#F3E5D7] tracking-tight">
                Welcome back, <span className="text-[#c9a97f]">{user.name || "Administrator"}</span> 👋
              </h1>
              <p className="text-sm md:text-base text-[#8c7464] mt-1">
                Real-time transport fleet monitoring and management dashboard.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Live Network Active
              </span>
            </div>
          </div>
        </div>

        {/* === Stats Grid === */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          {statItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.key}
                href={item.href}
                className={`group relative overflow-hidden rounded-2xl bg-[#1e130c]/80 border ${item.border} p-5 hover:scale-[1.02] hover:shadow-xl transition-all duration-300`}
              >
                <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${item.color} rounded-bl-full pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity`} />
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl bg-[#2a1a11] flex items-center justify-center ${item.text} border border-[#3d2618]`}>
                    <Icon size={20} />
                  </div>
                  <ArrowUpRight size={16} className="text-[#5a4232] group-hover:text-[#c9a97f] transition-colors" />
                </div>
                <div className="text-3xl font-extrabold text-white mb-1">
                  {statsLoading ? (
                    <div className="h-8 w-16 bg-[#2a1a11] rounded animate-pulse" />
                  ) : (
                    stats[item.key] ?? 0
                  )}
                </div>
                <div className="text-xs md:text-sm text-[#a89078] font-medium">{item.label}</div>
              </Link>
            );
          })}
        </div>

        {/* === Quick Action Toolbar === */}
        <div className="rounded-2xl bg-[#1e130c]/70 border border-[#2e1c10] p-6 mb-8 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#2e1c10]">
            <div className="flex items-center gap-2">
              <Activity size={18} className="text-[#c9a97f]" />
              <h2 className="text-base md:text-lg font-bold text-[#F3E5D7]">Quick Fleet Actions & Reports</h2>
            </div>
            <span className="text-xs text-[#8c7464]">Instant exports & views</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => downloadPdf("drivers")}
              disabled={downloading === "drivers"}
              className="flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl bg-[#2a1a11] hover:bg-[#342217] border border-[#3d2618] text-white font-medium text-sm transition-all hover:border-[#c9a97f]/50 disabled:opacity-50"
            >
              <Download size={16} className="text-blue-400" />
              {downloading === "drivers" ? "Exporting..." : "Download Drivers PDF"}
            </button>

            <button
              onClick={() => downloadPdf("conductors")}
              disabled={downloading === "conductors"}
              className="flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl bg-[#2a1a11] hover:bg-[#342217] border border-[#3d2618] text-white font-medium text-sm transition-all hover:border-[#c9a97f]/50 disabled:opacity-50"
            >
              <Download size={16} className="text-purple-400" />
              {downloading === "conductors" ? "Exporting..." : "Download Conductors PDF"}
            </button>

            <Link
              href="/admin/view-all-buses"
              className="flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl bg-gradient-to-r from-[#b3885c] to-[#c9a97f] hover:from-[#c9a97f] hover:to-[#dfc39e] text-[#140c08] font-bold text-sm transition-all shadow-lg shadow-amber-950/40"
            >
              <Bus size={16} />
              View Live Fleet Map
              <ExternalLink size={14} />
            </Link>
          </div>
        </div>

        {/* === Management Shortcuts === */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-[#1e130c]/50 border border-[#2e1c10]">
            <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
              <TrendingUp size={16} className="text-[#c9a97f]" />
              System Fleet Health
            </h3>
            <p className="text-xs text-[#8c7464] mb-4">
              All services operational. GPS telemetry sockets, database connections, and Firebase messaging active.
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs py-1.5 px-3 rounded-lg bg-[#140c08]/60 border border-[#2e1c10]">
                <span className="text-[#a89078]">Socket.io Location Relay</span>
                <span className="text-emerald-400 font-semibold">Active</span>
              </div>
              <div className="flex items-center justify-between text-xs py-1.5 px-3 rounded-lg bg-[#140c08]/60 border border-[#2e1c10]">
                <span className="text-[#a89078]">FCM Push Notifications</span>
                <span className="text-emerald-400 font-semibold">Ready</span>
              </div>
              <div className="flex items-center justify-between text-xs py-1.5 px-3 rounded-lg bg-[#140c08]/60 border border-[#2e1c10]">
                <span className="text-[#a89078]">Booking & QR Verification</span>
                <span className="text-emerald-400 font-semibold">Operational</span>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#1e130c]/50 border border-[#2e1c10]">
            <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
              <Shield size={16} className="text-[#c9a97f]" />
              Admin Management Shortcuts
            </h3>
            <p className="text-xs text-[#8c7464] mb-4">
              Quickly navigate to configure routes, verify conductors, or review feedback.
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Link
                href="/admin/buses"
                className="p-2.5 rounded-xl bg-[#2a1a11]/60 hover:bg-[#2a1a11] border border-[#3d2618] text-[#F3E5D7] text-center font-medium transition-colors"
              >
                🚌 Manage Buses
              </Link>
              <Link
                href="/admin/routes"
                className="p-2.5 rounded-xl bg-[#2a1a11]/60 hover:bg-[#2a1a11] border border-[#3d2618] text-[#F3E5D7] text-center font-medium transition-colors"
              >
                🗺️ Manage Routes
              </Link>
              <Link
                href="/admin/drivers"
                className="p-2.5 rounded-xl bg-[#2a1a11]/60 hover:bg-[#2a1a11] border border-[#3d2618] text-[#F3E5D7] text-center font-medium transition-colors"
              >
                👨‍✈️ Manage Drivers
              </Link>
              <Link
                href="/admin/feedback"
                className="p-2.5 rounded-xl bg-[#2a1a11]/60 hover:bg-[#2a1a11] border border-[#3d2618] text-[#F3E5D7] text-center font-medium transition-colors"
              >
                💬 User Feedback
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
