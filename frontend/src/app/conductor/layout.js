"use client";

import ConductorSidebar from "@/components/ConductorSidebar";
import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect } from "react";
import toast from "react-hot-toast";
import CustomToast from "@/components/CustomToast";
import { LayoutDashboard, QrCode, History } from "lucide-react";

export default function ConductorLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        toast.custom(() => (
          <CustomToast type="error" message="Please login to continue" />
        ));
        router.push("/login");
      } else if (user.role !== "conductor") {
        toast.custom(() => (
          <CustomToast type="error" message="Access denied: Conductors only" />
        ));
        router.push(`/${user.role}`);
      }
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== "conductor") {
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
    <div className="min-h-screen bg-gradient-to-b from-[#1b1009] to-[#140c08] text-[#F3E5D7]">
      <ConductorSidebar />
      <main className="p-3 sm:p-5 md:p-8 md:ml-64 pb-28 md:pb-12 max-w-7xl">
        {children}
      </main>

      {/* Mobile Bottom Navigation Bar for quick one-handed access */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#160d08]/95 backdrop-blur-xl border-t border-[#3d2618]/70 px-4 py-2 shadow-2xl">
        <div className="flex items-center justify-around max-w-md mx-auto">
          <Link
            href="/conductor"
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
              pathname === "/conductor"
                ? "text-[#c9a97f] font-semibold"
                : "text-[#8c7464] hover:text-[#d1b8a3]"
            }`}
          >
            <LayoutDashboard size={20} />
            <span className="text-[10px]">Dashboard</span>
          </Link>

          <Link
            href="/conductor/scan"
            className={`flex flex-col items-center justify-center -mt-5 transition-transform active:scale-95 ${
              pathname === "/conductor/scan" ? "scale-105" : ""
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#b3885c] via-[#c9a97f] to-[#e4ceb0] text-[#140c08] flex items-center justify-center shadow-lg shadow-amber-950/60 border-2 border-[#160d08]">
              <QrCode size={22} />
            </div>
            <span className="text-[10px] font-bold text-[#c9a97f] mt-0.5">Scan</span>
          </Link>

          <Link
            href="/conductor/history"
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
              pathname.startsWith("/conductor/history")
                ? "text-[#c9a97f] font-semibold"
                : "text-[#8c7464] hover:text-[#d1b8a3]"
            }`}
          >
            <History size={20} />
            <span className="text-[10px]">History</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
