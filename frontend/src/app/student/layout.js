"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function StudentLayout({ children }) {
  const { user, loading } = useAuth(); // Ensure loading is considered
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && user.role !== "student") {
      router.push("/login");
    }
  }, [user, loading]);

  if (loading || !user) return null; // prevent flicker or premature render

  return (
    <div className="min-h-screen bg-[#1E1A18] text-white p-4">
      <h1 className="text-2xl font-semibold text-[#F3E5D7] mb-4">Passenger Panel</h1>
      {children}
    </div>
  );
}
