"use client";

import Link from "next/link";

export default function StudentHomePage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Welcome Passenger</h1>

      <div className="mt-6 space-y-3">
        <Link
          href="/student/buses"
          className="block bg-[#3E2F2C] hover:bg-[#5D4037] text-white p-4 rounded-lg shadow"
        >
          🚍 View All Buses
        </Link>
        <Link
          href="/student/feedback"
          className="block bg-[#3E2F2C] hover:bg-[#5D4037] text-white p-4 rounded-lg shadow"
        >
          📝 Give Feedback
        </Link>
        <Link
          href="/student/book"
          className="block bg-[#3E2F2C] hover:bg-[#5D4037] text-white p-4 rounded-lg shadow"
        >
          🎟️ Book Ticket
        </Link>
        <Link
          href="/student/tickets"
          className="block bg-[#3E2F2C] hover:bg-[#5D4037] text-white p-4 rounded-lg shadow"
        >
          📂 My Tickets
        </Link>
      </div>
    </div>
  );
}
