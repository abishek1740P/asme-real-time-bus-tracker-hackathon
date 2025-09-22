"use client";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#2F1F1C] text-[#CDB7AE] py-6">
      <div className="max-w-6xl mx-auto px-4 text-center text-sm">
        &copy; {new Date().getFullYear()} Bus Tracker. All rights reserved.
      </div>
    </footer>
  );
}
