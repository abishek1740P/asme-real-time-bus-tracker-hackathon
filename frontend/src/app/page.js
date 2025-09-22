"use client";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex-grow w-full bg-gradient-to-br from-[#3A2217] to-[#1e120b] text-white flex items-center justify-center p-6">
      <div className="bg-[#2F1F1C] rounded-3xl p-10 shadow-xl max-w-xl w-full text-center space-y-6 border border-[#3e2b20]">
        <div className="flex justify-center">
          <Image
            src="/bus-svgrepo-com.svg"
            alt="Bus logo"
            width={100}
            height={100}
            className="animate-bounce"
          />
        </div>
        <h1 className="text-4xl font-bold text-[#F3E5D7]">🚍 College Bus Tracker</h1>
        <p className="text-lg text-[#c9a97f]">
          Real-time bus tracking for Students.
        </p>

        <div className="flex gap-4 justify-center pt-4">
          <Link
            href="/login"
            className="bg-[#c9a97f] text-black px-6 py-2 rounded-full hover:bg-[#b88f62] font-semibold transition"
          >
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}
