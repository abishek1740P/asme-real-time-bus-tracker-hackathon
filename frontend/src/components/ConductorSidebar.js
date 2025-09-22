"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

export default function ConductorSidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { label: "Dashboard", href: "/conductor" },
    { label: "scan", href: "/conductor/scan" },
    { label: "History", href: "/conductor/history" },
  ];

  // Close sidebar on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile Hamburger */}
      <div className="md:hidden fixed top-0 left-0 w-full z-50 p-4 bg-[#2D2421] flex items-center gap-3">
        <button
          className="text-[#F3E5D7]"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Open Menu"
        >
          <Menu size={28} />
        </button>
        <h1 className="text-xl font-bold text-[#F3E5D7]">🚌 Conductor</h1>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 w-64 h-full bg-[#2D2421] text-[#F3E5D7] p-4 z-40 transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:top-16 md:h-[calc(100%-4rem)]`}
      >
        {/* Close button mobile */}
        <div className="flex justify-between items-center mb-6 md:hidden">
          <h2 className="text-xl font-bold">Menu</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-[#F3E5D7]"
            aria-label="Close Menu"
          >
            <X size={26} />
          </button>
        </div>

        <nav className="space-y-3 mt-16 md:mt-0">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-3 py-2 rounded-lg ${
                pathname === item.href
                  ? "bg-[#5D4037] font-semibold"
                  : "hover:bg-[#3E2F2C]"
              }`}
            >
              {item.label}
            </Link>
          ))}

          <button
            onClick={logout}
            className="mt-8 w-full bg-red-600 hover:bg-red-700 py-2 rounded-lg text-white"
          >
            Logout
          </button>
        </nav>
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
