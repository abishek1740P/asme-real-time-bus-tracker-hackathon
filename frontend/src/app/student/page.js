"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api"; // ✅ your existing axios instance

export default function StudentHomePage() {
  const [studentName, setStudentName] = useState("");

  useEffect(() => {
    const fetchStudentName = async () => {
      try {
        // ✅ Use your existing backend API call
        const res = await api.get("/students/profile");

        // If your backend returns driver info + bus info
        // e.g., { _id, name, email, bus: {...} }
        if (res.data && res.data.name) {
          setStudentName(res.data.name);
        }
      } catch (err) {
        console.error("Error fetching student name:", err);
      }
    };

    fetchStudentName();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">
        Welcome {studentName || "Passenger"}
      </h1>

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
