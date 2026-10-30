"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { Menu, X, Bus, LogOut, LayoutDashboard, Home } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, loading } = useAuth();
  const [dashboardLink, setDashboardLink] = useState("/");
  const [mobileOpen, setMobileOpen] = useState(false);

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
        case "conductor":
          setDashboardLink("/conductor");
          break;
        default:
          setDashboardLink("/");
      }
    }
  }, [user]);

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (loading) return null;

  const handleLogout = async () => {
    setMobileOpen(false);
    await logout();
    router.push("/login");
  };

  const isDashboard = user && pathname.startsWith(dashboardLink) && dashboardLink !== "/";

  return (
    <>
      <nav className="bg-[#1e140d]/95 backdrop-blur-md text-white border-b border-[#3d2618]/60 px-4 sm:px-6 py-3.5 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo */}
          <Link
            href={user ? dashboardLink : "/"}
            className="flex items-center gap-2.5 group"
          >
            <div className="p-1.5 rounded-xl bg-[#c9a97f]/15 border border-[#c9a97f]/25 group-hover:bg-[#c9a97f]/25 transition-colors">
              <Bus size={18} className="text-[#c9a97f]" />
            </div>
            <span className="text-lg font-bold text-[#F3E5D7] tracking-tight">
              Urban<span className="text-[#c9a97f]">Trail</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden sm:flex items-center gap-2">
            {!user ? (
              <>
                <Link
                  href="/"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                    pathname === "/"
                      ? "bg-[#c9a97f]/15 text-[#c9a97f] border border-[#c9a97f]/30"
                      : "text-[#d1b8a3] hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Home size={15} />
                  Home
                </Link>
                <Link
                  href="/login"
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-sm font-medium transition-all ${
                    pathname === "/login"
                      ? "bg-[#c9a97f] text-[#140c08] shadow-md"
                      : "bg-[#c9a97f]/15 text-[#c9a97f] border border-[#c9a97f]/30 hover:bg-[#c9a97f] hover:text-[#140c08]"
                  }`}
                >
                  Login
                </Link>
              </>
            ) : (
              <>
                <Link
                  href={dashboardLink}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                    isDashboard
                      ? "bg-[#c9a97f]/15 text-[#c9a97f] border border-[#c9a97f]/30"
                      : "text-[#d1b8a3] hover:text-white hover:bg-white/5"
                  }`}
                >
                  <LayoutDashboard size={15} />
                  {user.role === "driver" ? "Driver Panel" : "Dashboard"}
                </Link>

                <div className="w-px h-4 bg-white/10 mx-1" />

                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/8">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs text-[#d1b8a3] capitalize font-medium">
                    {user.name?.split(" ")[0] || user.role}
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm text-[#d1b8a3] hover:text-white hover:bg-red-500/15 hover:border-red-500/30 border border-transparent transition-all font-medium"
                >
                  <LogOut size={14} />
                  Logout
                </button>
              </>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button
            className="sm:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-[#d1b8a3] hover:text-white hover:bg-white/10 transition-all"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile Dropdown Menu */}
      <div
        className={`sm:hidden fixed top-[57px] inset-x-0 z-40 transition-all duration-300 ease-out ${
          mobileOpen
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 -translate-y-2 pointer-events-none"
        }`}
      >
        <div className="bg-[#1e140d]/98 backdrop-blur-xl border-b border-[#3d2618]/60 shadow-2xl px-4 py-4 space-y-2">
          {!user ? (
            <>
              <Link
                href="/"
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all ${
                  pathname === "/"
                    ? "bg-[#c9a97f]/15 text-[#c9a97f] border border-[#c9a97f]/30"
                    : "text-[#d1b8a3] hover:text-white hover:bg-white/5"
                }`}
              >
                <Home size={17} /> Home
              </Link>
              <Link
                href="/login"
                className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold bg-[#c9a97f] text-[#140c08] transition-all"
              >
                Login to Your Account
              </Link>
              <Link
                href="/register"
                className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-[#d1b8a3] hover:bg-white/5 border border-white/8 transition-all"
              >
                Register as Student
              </Link>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/8">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <div>
                  <p className="text-xs text-[#8c7464]">Signed in as</p>
                  <p className="text-sm font-semibold text-[#F3E5D7]">
                    {user.name || user.role}
                  </p>
                </div>
                <span className="ml-auto text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-[#c9a97f]/15 text-[#c9a97f] border border-[#c9a97f]/30 capitalize">
                  {user.role}
                </span>
              </div>

              <Link
                href={dashboardLink}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all ${
                  isDashboard
                    ? "bg-[#c9a97f]/15 text-[#c9a97f] border border-[#c9a97f]/30"
                    : "text-[#d1b8a3] hover:text-white hover:bg-white/5"
                }`}
              >
                <LayoutDashboard size={17} />
                {user.role === "driver" ? "Driver Panel" : "Dashboard"}
              </Link>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all"
              >
                <LogOut size={17} />
                Logout
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mobile overlay to close menu */}
      {mobileOpen && (
        <div
          className="sm:hidden fixed inset-0 bg-black/50 z-30 top-[57px]"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  );
}
