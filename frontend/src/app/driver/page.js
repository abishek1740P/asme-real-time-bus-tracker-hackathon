"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import CustomToast from "@/components/CustomToast";
import api from "@/lib/api";
import { Navigation, MessageSquarePlus, Bus, MapPin, ArrowRight, Hash, Map } from "lucide-react";

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
        router.push("/login");
      } else if (user.role !== "driver") {
        toast.custom(() => (
          <CustomToast type="error" message="Access denied: Drivers only" />
        ));
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
    }
  };

  if (loading || !user || user.role !== "driver") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#140c08] text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#c9a97f] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#c9a97f] text-sm">Verifying access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1b1009] to-[#140c08] text-[#F3E5D7] p-4 sm:p-6">
      <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#2d1a0d] via-[#241408] to-[#1c0f08] border border-[#4d2e16]/60 p-6 sm:p-8 shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#c9a97f]/8 rounded-full blur-3xl pointer-events-none -mr-10 -mt-10" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-2xl bg-[#c9a97f]/15 border border-[#c9a97f]/25">
                <Navigation size={22} className="text-[#c9a97f]" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-[#F3E5D7]">
                  Driver Panel
                </h1>
                <p className="text-xs text-[#8c7464]">Urban Trail Transit Operations</p>
              </div>
            </div>
            <h2 className="text-lg font-semibold text-[#e8cfb5]">
              Welcome back, {user.name} 👋
            </h2>
            <p className="text-sm text-[#9c8474] mt-1">
              Your dashboard for GPS tracking and driver tools.
            </p>
          </div>
        </div>

        {/* Bus Info Card */}
        {bus ? (
          <div className="bg-[#1e140d]/80 border border-[#3d2618] rounded-3xl p-5 shadow-xl">
            <h3 className="text-xs font-semibold text-[#c9a97f] uppercase tracking-wider mb-4">
              Assigned Vehicle
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#140c08]/60 rounded-2xl p-3.5 border border-[#2a1a10]">
                <div className="flex items-center gap-1.5 text-[#6b5040] mb-1.5">
                  <Bus size={14} />
                  <span className="text-[10px] uppercase font-semibold">Bus Name</span>
                </div>
                <p className="text-sm font-bold text-[#F3E5D7] truncate">{bus.name}</p>
              </div>
              <div className="bg-[#140c08]/60 rounded-2xl p-3.5 border border-[#2a1a10]">
                <div className="flex items-center gap-1.5 text-[#6b5040] mb-1.5">
                  <Hash size={14} />
                  <span className="text-[10px] uppercase font-semibold">Number</span>
                </div>
                <p className="text-sm font-bold text-[#F3E5D7]">{bus.number}</p>
              </div>
              <div className="bg-[#140c08]/60 rounded-2xl p-3.5 border border-[#2a1a10]">
                <div className="flex items-center gap-1.5 text-[#6b5040] mb-1.5">
                  <Map size={14} />
                  <span className="text-[10px] uppercase font-semibold">Route</span>
                </div>
                <p className="text-sm font-bold text-[#F3E5D7] truncate">
                  {bus.route?.name || "N/A"}
                </p>
              </div>
            </div>
            {bus.route?.stops?.length > 0 && (
              <div className="mt-3 flex items-center gap-2 text-xs text-[#8c7464]">
                <MapPin size={12} />
                <span>{bus.route.stops.length} stops on this route</span>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-[#1e140d]/80 border border-[#3d2618] rounded-3xl p-5 shadow-xl">
            <div className="flex items-center gap-3 text-[#8c7464]">
              <div className="w-8 h-8 rounded-xl skeleton" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-32 rounded-lg skeleton" />
                <div className="h-3 w-20 rounded-lg skeleton" />
              </div>
            </div>
          </div>
        )}

        {/* Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/driver/gps"
            className="group relative overflow-hidden bg-gradient-to-br from-[#2d1a0d] to-[#1e1009] border border-[#4d2e16] hover:border-[#c9a97f]/60 rounded-3xl p-6 shadow-xl hover:-translate-y-1 hover:shadow-2xl transition-all duration-300"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#c9a97f]/10 rounded-bl-full pointer-events-none group-hover:scale-125 transition-all" />
            <div className="relative z-10 space-y-3">
              <div className="inline-flex p-3 rounded-2xl bg-[#c9a97f]/15 border border-[#c9a97f]/25 text-[#c9a97f]">
                <Navigation size={22} />
              </div>
              <div>
                <h3 className="font-bold text-[#F3E5D7] group-hover:text-[#c9a97f] transition-colors flex items-center gap-1.5">
                  GPS Tracking
                  <ArrowRight size={14} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-[#c9a97f]" />
                </h3>
                <p className="text-xs text-[#9c8474] mt-1">
                  Start broadcasting your live location to students.
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/driver/feedback"
            className="group relative overflow-hidden bg-gradient-to-br from-[#1a1428] to-[#140c08] border border-[#2d2040] hover:border-[#9b6dff]/40 rounded-3xl p-6 shadow-xl hover:-translate-y-1 hover:shadow-2xl transition-all duration-300"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/8 rounded-bl-full pointer-events-none group-hover:scale-125 transition-all" />
            <div className="relative z-10 space-y-3">
              <div className="inline-flex p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                <MessageSquarePlus size={22} />
              </div>
              <div>
                <h3 className="font-bold text-[#F3E5D7] group-hover:text-purple-400 transition-colors flex items-center gap-1.5">
                  View Feedback
                  <ArrowRight size={14} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-purple-400" />
                </h3>
                <p className="text-xs text-[#9c8474] mt-1">
                  Read passenger feedback and ratings for your route.
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
