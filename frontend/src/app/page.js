"use client";
import Link from "next/link";
import { Bus, MapPin, Bell, Ticket, ArrowRight, Shield, Zap, Users } from "lucide-react";

export default function Home() {
  const features = [
    {
      icon: MapPin,
      title: "Live GPS Tracking",
      desc: "Real-time bus locations with WebSocket-powered updates on interactive maps.",
      color: "#e69550",
    },
    {
      icon: Bell,
      title: "Push Notifications",
      desc: "Get instant alerts when your bus approaches your stop — even with the app closed.",
      color: "#60a5fa",
    },
    {
      icon: Ticket,
      title: "Digital Tickets",
      desc: "Book seats, pay via Razorpay, and board with QR code scanning — paperless.",
      color: "#34d399",
    },
    {
      icon: Shield,
      title: "Speed Monitoring",
      desc: "Admin-level speed alerts ensure driver safety compliance in real time.",
      color: "#c084fc",
    },
  ];

  return (
    <div className="flex-grow w-full bg-[#140c08] text-white overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center px-4 py-16 overflow-hidden">
        {/* Background glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#c9a97f]/8 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-amber-900/15 rounded-full blur-[100px]" />
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[#c9a97f]/5 rounded-full blur-[80px]" />
        </div>

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(201,169,127,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(201,169,127,0.5) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#c9a97f]/30 bg-[#c9a97f]/10 text-[#e8cfb5] text-xs font-semibold tracking-wide">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Real-time Campus Transit System
          </div>

          {/* Hero Title */}
          <div className="space-y-2">
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-tight">
              <span className="text-[#F3E5D7]">Your Campus</span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#c9a97f] via-[#e8d5b5] to-[#c9a97f]">
                Bus. Tracked Live.
              </span>
            </h1>
          </div>

          {/* Sub-heading */}
          <p className="text-base sm:text-lg text-[#b89f8b] max-w-2xl mx-auto leading-relaxed">
            Urban Trail brings you real-time GPS tracking, instant push notifications, and
            seamless digital ticketing — all in one platform built for SRIT students.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-2">
            <Link
              href="/login"
              className="group flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-[#c9a97f] to-[#b3885c] text-[#140c08] font-bold text-sm shadow-lg shadow-[#c9a97f]/25 hover:brightness-110 hover:scale-105 active:scale-95 transition-all duration-200"
            >
              Get Started
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            {/* <Link
              href="/register"
              className="flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-[#F3E5D7] font-semibold text-sm border border-white/10 backdrop-blur-sm active:scale-95 transition-all duration-200"
            >
              Register as Student
            </Link> */}
          </div>

          {/* Stats Row */}
          <div className="pt-6 flex flex-wrap justify-center gap-6 sm:gap-10">
            {[
              { label: "Campus Buses", value: "2+" },
              { label: "Active Students", value: "60+" },
              { label: "Stops Tracked", value: "10+" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl sm:text-3xl font-extrabold text-[#c9a97f]">
                  {stat.value}
                </p>
                <p className="text-xs text-[#8c7464] mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 pb-20 max-w-6xl mx-auto">
        <div className="text-center mb-10 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#F3E5D7]">
            Everything You Need
          </h2>
          <p className="text-sm text-[#8c7464]">
            Powerful features built for students, drivers, and administrators.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="group relative bg-[#1e130c] hover:bg-[#261810] border border-[#3a2415] hover:border-[#5a3820] rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 shadow-xl hover:shadow-2xl"
              >
                <div
                  className="inline-flex p-3 rounded-2xl mb-4 transition-all duration-300 group-hover:scale-110"
                  style={{
                    backgroundColor: `${f.color}15`,
                    border: `1px solid ${f.color}30`,
                    color: f.color,
                  }}
                >
                  <Icon size={22} />
                </div>
                <h3 className="text-base font-bold text-[#F3E5D7] mb-2">
                  {f.title}
                </h3>
                <p className="text-xs text-[#9c8474] leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA Strip */}
      <section className="px-4 pb-20">
        <div className="max-w-3xl mx-auto relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#3a1f0f] via-[#2d1608] to-[#3a1f0f] border border-[#5a3020]/60 p-8 sm:p-12 text-center shadow-2xl">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-[#c9a97f]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-5">
            <div className="inline-flex p-4 rounded-2xl bg-[#c9a97f]/10 border border-[#c9a97f]/20 mb-2">
              <Bus size={32} className="text-[#c9a97f]" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#F3E5D7]">
              Ready to Track Your Bus?
            </h2>
            <p className="text-[#b89f8b] text-sm max-w-md mx-auto">
              Join hundreds of SRIT students who never miss their bus. Log in and start tracking right now.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#c9a97f] to-[#b3885c] text-[#140c08] font-bold text-sm shadow-lg shadow-[#c9a97f]/20 hover:brightness-110 active:scale-95 transition-all"
            >
              Login Now
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
