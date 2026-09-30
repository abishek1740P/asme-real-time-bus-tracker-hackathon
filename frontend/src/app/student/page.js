"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { Bus, Ticket, MessageSquarePlus, Clock, ArrowRight, ShieldCheck, MapPin, Sparkles } from "lucide-react";

export default function StudentHomePage() {
  const [studentName, setStudentName] = useState("");
  const [ticketCount, setTicketCount] = useState(0);
  const [busesCount, setBusesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, ticketsRes, busesRes] = await Promise.allSettled([
          api.get("/students/profile"),
          api.get("/tickets/my"),
          api.get("/buses"),
        ]);

        if (profileRes.status === "fulfilled" && profileRes.value.data?.name) {
          setStudentName(profileRes.value.data.name);
        }
        if (ticketsRes.status === "fulfilled" && Array.isArray(ticketsRes.value.data)) {
          setTicketCount(ticketsRes.value.data.length);
        }
        if (busesRes.status === "fulfilled" && Array.isArray(busesRes.value.data)) {
          setBusesCount(busesRes.value.data.length);
        }
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const features = [
    {
      title: "Live Bus Tracking",
      description: "Track real-time bus locations, current speed, and checkpoint arrival updates on Leaflet map.",
      href: "/student/buses",
      icon: Bus,
      badge: "Real-time GPS",
      color: "from-amber-500/20 via-orange-500/10 to-transparent",
      accent: "#e69550",
    },
    {
      title: "Book Digital Ticket",
      description: "Select origin and destination stops, calculate automatic fares, and pay securely via Razorpay.",
      href: "/student/book",
      icon: Ticket,
      badge: "Instant Seat Booking",
      color: "from-emerald-500/20 via-teal-500/10 to-transparent",
      accent: "#34d399",
    },
    {
      title: "My QR Tickets",
      description: "Access and view active boarding passes with QR codes for conductor ticket scanning.",
      href: "/student/tickets",
      icon: Clock,
      badge: `${ticketCount} Booked`,
      color: "from-blue-500/20 via-cyan-500/10 to-transparent",
      accent: "#60a5fa",
    },
    {
      title: "Passenger Feedback",
      description: "Share route experience, rate your bus driver, and report issues directly to the administration.",
      href: "/student/feedback",
      icon: MessageSquarePlus,
      badge: "Voice & Text",
      color: "from-purple-500/20 via-pink-500/10 to-transparent",
      accent: "#c084fc",
    },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#382014] via-[#2a170d] to-[#1c0f08] border border-[#52331f]/60 p-6 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#c9a97f]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#c9a97f]/15 border border-[#c9a97f]/30 text-[#e8cfb5] text-xs font-medium">
              <Sparkles size={14} className="text-[#c9a97f]" />
              Commutex Smart Transit System
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#F3E5D7] tracking-tight">
              Hello, {studentName || "Passenger"} 👋
            </h1>
            <p className="text-sm sm:text-base text-[#cfb6a1] leading-relaxed">
              Plan your campus journey effortlessly. Check live bus positions, receive instant arrival notifications, and board safely with digital QR tickets.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-3">
            <Link
              href="/student/buses"
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-[#c9a97f] to-[#b3885c] text-[#140c08] font-bold text-sm shadow-lg shadow-[#c9a97f]/25 hover:brightness-110 active:scale-95 transition-all"
            >
              <Bus size={18} />
              <span>Track Buses</span>
            </Link>
            <Link
              href="/student/book"
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-[#F3E5D7] font-semibold text-sm border border-white/10 backdrop-blur-sm active:scale-95 transition-all"
            >
              <Ticket size={18} />
              <span>Book Ticket</span>
            </Link>
          </div>
        </div>

        {/* Quick Mini Stats Strip */}
        <div className="mt-8 pt-6 border-t border-[#4d301e]/60 grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="bg-black/25 backdrop-blur-sm rounded-2xl p-3 sm:p-4 border border-white/5">
            <p className="text-xs text-[#b89f8b]">Active Network Buses</p>
            <p className="text-xl sm:text-2xl font-bold text-[#F3E5D7] mt-0.5">
              {loading ? "..." : busesCount || "5+"}
            </p>
          </div>
          <div className="bg-black/25 backdrop-blur-sm rounded-2xl p-3 sm:p-4 border border-white/5">
            <p className="text-xs text-[#b89f8b]">My Booked Tickets</p>
            <p className="text-xl sm:text-2xl font-bold text-[#F3E5D7] mt-0.5">
              {loading ? "..." : ticketCount}
            </p>
          </div>
          <div className="col-span-2 sm:col-span-1 bg-black/25 backdrop-blur-sm rounded-2xl p-3 sm:p-4 border border-white/5 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <ShieldCheck size={20} />
            </div>
            <div>
              <p className="text-xs text-[#b89f8b]">GPS Telemetry</p>
              <p className="text-sm font-semibold text-emerald-400">WebSocket Live</p>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[#F3E5D7]">Quick Access Hub</h2>
          <span className="text-xs text-[#b89f8b]">Select an option to proceed</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {features.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group relative overflow-hidden rounded-3xl bg-[#241710] hover:bg-[#2b1c14] border border-[#442918] hover:border-[#c9a97f]/50 p-6 transition-all duration-300 shadow-xl hover:-translate-y-1 hover:shadow-2xl"
              >
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${item.color} rounded-bl-full pointer-events-none transition-all duration-300 group-hover:scale-125`}></div>

                <div className="relative z-10 flex flex-col justify-between h-full space-y-4">
                  <div className="flex items-start justify-between">
                    <div
                      className="p-3.5 rounded-2xl border transition-all duration-300 group-hover:scale-110"
                      style={{
                        backgroundColor: `${item.accent}15`,
                        borderColor: `${item.accent}30`,
                        color: item.accent,
                      }}
                    >
                      <Icon size={24} />
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[#d8c0ad]">
                      {item.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-[#F3E5D7] group-hover:text-[#c9a97f] transition-colors flex items-center gap-1.5">
                      {item.title}
                      <ArrowRight size={16} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-[#c9a97f]" />
                    </h3>
                    <p className="text-xs sm:text-sm text-[#bca28f] mt-1.5 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
