"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, loading } = useAuth();
  const [dashboardLink, setDashboardLink] = useState("/");

  useEffect(() => {
    if (user) {
      switch (user.role) {
        case "admin":
          setDashboardLink("/admin/dashboard");
          break;
        case "driver":
          setDashboardLink("/driver");
          break;
        case "student":
          setDashboardLink("/student");
          break;
        default:
          setDashboardLink("/");
      }
    }
  }, [user]);

  if (loading) return null;

  const handleLogout = async () => {
    await logout(); // cleanup + redirect handled in context
    router.push("/login");
  };

  return (
    <nav className="bg-[#2e1f14] text-white border-b border-[#3d2a1f] px-6 py-4 shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="https://asme-commutex-home-page.vercel.app/" className="text-xl font-bold text-[#c9a97f]">
          🚍 Urban Trail
        </Link>

        <div className="flex gap-4 text-sm">
          {!user ? (
            <Link
              href="/login"
              className={`hover:text-[#c9a97f] ${
                pathname === "/login" ? "text-[#c9a97f] font-semibold" : ""
              }`}
            >
              Login
            </Link>
          ) : (
            <>
              <Link
                href={dashboardLink}
                className={`hover:text-[#c9a97f] ${
                  pathname.startsWith(dashboardLink)
                    ? "text-[#c9a97f] font-semibold"
                    : ""
                }`}
              >
                {user.role === "driver" ? "Driver Panel" : "Dashboard"}
              </Link>

              <button
                onClick={handleLogout}
                className="hover:text-[#c9a97f] cursor-pointer"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
