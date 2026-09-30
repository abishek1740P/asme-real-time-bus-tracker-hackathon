"use client";
import Link from "next/link";
import { Bus, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#140c08] border-t border-[#2e1c10]/60 text-[#8c7464] py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#c9a97f]/10 border border-[#c9a97f]/20">
              <Bus size={14} className="text-[#c9a97f]" />
            </div>
            <span className="text-sm font-bold text-[#d1b8a3]">
              Commu<span className="text-[#c9a97f]">tex</span>
            </span>
          </div>

          {/* Center */}
          <p className="text-xs flex items-center gap-1.5">
            Built with{" "}
            <Heart size={11} className="text-red-400 fill-red-400" />
            {" "}by{" "}
            <span className="text-[#c9a97f] font-medium">SRIT</span>
            {" "}· © {new Date().getFullYear()}
          </p>

          {/* Links */}
          {/* <div className="flex items-center gap-4 text-xs">
            <Link
              href="https://asme-commutex-home-page.vercel.app/"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#c9a97f] transition-colors"
            >
              About
            </Link>
            <Link href="/login" className="hover:text-[#c9a97f] transition-colors">
              Login
            </Link>
          </div> */}
        </div>
      </div>
    </footer>
  );
}
