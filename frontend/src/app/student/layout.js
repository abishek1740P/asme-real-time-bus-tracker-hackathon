"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { Bus, Ticket, MessageSquarePlus, Compass } from "lucide-react";

export default function StudentLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && user && user.role !== "student") {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#140c08] text-white flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-[#c9a97f] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const tabs = [
    { name: "Overview", href: "/student", icon: Compass, exact: true },
    { name: "Buses & Track", href: "/student/buses", icon: Bus },
    { name: "Book Ticket", href: "/student/book", icon: Ticket },
    { name: "My Tickets", href: "/student/tickets", icon: Ticket },
    { name: "Feedback", href: "/student/feedback", icon: MessageSquarePlus },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1b1009] via-[#140c08] to-[#0d0705] text-[#F3E5D7] flex flex-col">
      {/* Passenger Sub-Navigation Header */}
      <div className="sticky top-0 z-30 bg-[#23150d]/90 backdrop-blur-md border-b border-[#3d2618]/60 px-4 py-3 shadow-md">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-[#c9a97f]/10 text-[#e6c79c] border border-[#c9a97f]/20">
                🚍
              </span>
              <div>
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[#F3E5D7] flex items-center gap-2">
                  Passenger Portal
                  <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Live
                  </span>
                </h1>
                <p className="text-xs text-[#b89f8b]">
                  Welcome back, <span className="text-[#e2c7a5] font-medium">{user.name || "Passenger"}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Quick Navigation Tabs (Horizontal Scrollable on Mobile) */}
          <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = tab.exact
                ? pathname === tab.href
                : pathname.startsWith(tab.href);

              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                    isActive
                      ? "bg-[#c9a97f] text-[#1e120b] shadow-md shadow-[#c9a97f]/20 font-semibold"
                      : "text-[#d1b8a3] hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon size={15} />
                  <span>{tab.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 md:p-8">
        {children}
      </main>
    </div>
  );
}
