"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import Link from "next/link";
import LoadingSpinner from "@/components/LoadingSpinner";
import AdminSidebar from "@/components/AdminSidebar";

export default function AdminViewAllBusesPage() {
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/buses")
      .then((res) => {
        setBuses(res.data);
        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
      });
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-[#1f1b16] text-[#F3E5D7]">
      <AdminSidebar />
      <main className="p-4 md:p-8 md:ml-64">
        <h1 className="text-3xl font-bold mb-6">🚌 All Registered Buses</h1>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {buses.map((bus) => (
            <Link
              href={`/admin/view-all-buses/${bus._id}`}
              key={bus._id}
              className="bg-[#3E2F2C] text-white rounded-lg p-4 shadow hover:shadow-lg transition"
            >
              <h2 className="text-xl font-semibold">
                {bus.name} ({bus.number})
              </h2>
              <p className="text-sm text-[#CDBFB4] mt-1">
                Route: {bus.route?.name || "Not Assigned"}
              </p>
              <p className="text-sm text-[#CDBFB4]">
                Driver: {bus.driver?.name || "Not Assigned"}
              </p>
              <p className="text-sm text-[#CDBFB4]">
                Phone: {bus.driver?.phone || "N/A"}
              </p>
              <p className="text-sm text-blue-300 mt-2 underline">
                🔍 View Live Status
              </p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
