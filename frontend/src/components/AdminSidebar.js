"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import {
  Menu, X, LayoutDashboard, Bus, Map, Users, UserCheck,
  MessageSquare, LogOut, ChevronRight
} from "lucide-react";

export default function AdminSidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Buses", href: "/admin/buses", icon: Bus },
    { label: "Routes", href: "/admin/routes", icon: Map },
    { label: "Drivers", href: "/admin/drivers", icon: Users },
    { label: "Conductors", href: "/admin/conductor", icon: UserCheck },
    { label: "Feedback", href: "/admin/feedback", icon: MessageSquare },
  ];

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const SidebarContent = () => (
    <nav className="flex flex-col h-full">
      {/* User Info / Profile */}
      <div className="px-4 py-4 border-b border-[#3d2618]/60">
        <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-[#140c08]/60 border border-[#3d2618]/40">
          <div className="w-8 h-8 rounded-xl bg-[#c9a97f]/20 border border-[#c9a97f]/30 flex items-center justify-center text-[#c9a97f] font-bold text-sm">
            {(user?.name || "A")[0].toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-[#F3E5D7] truncate">
              {user?.name || "Admin"}
            </p>
            <p className="text-[10px] text-[#8c7464]">Administrator</p>
          </div>
        </div>
      </div>

      {/* Nav Items */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-[#c9a97f]/15 text-[#c9a97f] border border-[#c9a97f]/25"
                  : "text-[#c9b49a] hover:text-[#F3E5D7] hover:bg-white/5"
              }`}
            >
              <Icon size={17} className={isActive ? "text-[#c9a97f]" : "text-[#7a6050] group-hover:text-[#c9a97f] transition-colors"} />
              <span className="flex-1">{item.label}</span>
              {isActive && <ChevronRight size={14} className="text-[#c9a97f]/60" />}
            </Link>
          );
        })}
      </div>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-[#3d2618]/40">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium text-[#e87e7e] hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all"
        >
          <LogOut size={17} />
          Logout
        </button>
      </div>
    </nav>
  );

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden sticky top-[57px] z-30 bg-[#1e140d]/95 backdrop-blur-md border-b border-[#3d2618]/60 px-4 py-3 flex items-center gap-3 shadow-md">
        <button
          className="p-2 rounded-xl bg-white/5 border border-white/10 text-[#d1b8a3] hover:text-white hover:bg-white/10 transition-all"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Open Admin Menu"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-base font-bold text-[#F3E5D7]">Admin Panel</h1>
        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25 ml-auto">
          Admin
        </span>
      </div>

      {/* Sidebar - Desktop: always visible | Mobile: drawer */}
      <aside
        className={`fixed top-0 md:top-[57px] left-0 h-full md:h-[calc(100vh-57px)] w-64 bg-[#1a1009] border-r border-[#3d2618]/60 z-40 flex flex-col transform transition-transform duration-300 ease-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"} 
          md:translate-x-0`}
      >
        <div className="h-full flex flex-col overflow-hidden">
          {/* Mobile Close Button */}
          <div className="md:hidden flex justify-between items-center px-4 py-3 border-b border-[#3d2618]/40">
            <span className="text-sm font-semibold text-[#F3E5D7]">Admin Menu</span>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-xl text-[#d1b8a3] hover:text-white hover:bg-white/10 transition-all"
            >
              <X size={18} />
            </button>
          </div>
          <SidebarContent />
        </div>
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
