"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import AdminSidebar from "@/components/AdminSidebar";
import toast from "react-hot-toast";

export default function FeedbackPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [feedbacks, setFeedbacks] = useState([]);
  const [sortOrder, setSortOrder] = useState("newest"); // newest | oldest
  const [filterDate, setFilterDate] = useState(""); // yyyy-mm-dd

  // 🚫 Admin Access Check
  useEffect(() => {
    if (!loading) {
      if (!user) {
        toast.error("Please login to continue");
        router.push("/login");
      } else if (user.role !== "admin") {
        toast.error("Access denied: Admins only");
        router.push(`/${user.role}`);
      }
    }
  }, [user, loading, router]);

  // Fetch Feedback
  useEffect(() => {
    if (user && user.role === "admin") {
      fetchFeedbacks();
    }
  }, [user]);

  const fetchFeedbacks = async () => {
    try {
      const res = await api.get("/student/feedback");
      setFeedbacks(res.data);
    } catch (err) {
      toast.error("Failed to load feedback");
    }
  };

  // Apply sorting + filtering
  const processedFeedbacks = feedbacks
    .filter((fb) => {
      if (!filterDate) return true;
      const fbDate = new Date(fb.createdAt).toISOString().split("T")[0];
      return fbDate === filterDate;
    })
    .sort((a, b) => {
      if (sortOrder === "newest") {
        return new Date(b.createdAt) - new Date(a.createdAt);
      } else {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
    });

  if (loading || !user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <p>Checking access...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1f1b16] text-[#F3E5D7]">
      <AdminSidebar />
      <main className="p-4 md:p-8 md:ml-64">
        <h2 className="text-xl font-bold text-[#F3E5D7] mb-6">
          📝 Passenger Feedback
        </h2>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="bg-[#2D2421] text-white px-3 py-2 rounded-lg"
          >
            <option value="newest">📅 Sort by Newest</option>
            <option value="oldest">📅 Sort by Oldest</option>
          </select>

          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="bg-[#2D2421] text-white px-3 py-2 rounded-lg"
          />

          {filterDate && (
            <button
              onClick={() => setFilterDate("")}
              className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded text-white"
            >
              Clear Date Filter
            </button>
          )}
        </div>

        {/* Table */}
        {processedFeedbacks.length === 0 ? (
          <p className="text-gray-400">No feedback found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-[#40352F] rounded-lg">
              <thead className="bg-[#2D2421] text-[#F3E5D7]">
                <tr>
                  <th className="px-4 py-2 border border-[#40352F]">Name</th>
                  <th className="px-4 py-2 border border-[#40352F]">Phone</th>
                  <th className="px-4 py-2 border border-[#40352F]">Email</th>
                  <th className="px-4 py-2 border border-[#40352F]">Feedback</th>
                  <th className="px-4 py-2 border border-[#40352F]">Date</th>
                </tr>
              </thead>
              <tbody>
                {processedFeedbacks.map((fb) => (
                  <tr key={fb._id} className="hover:bg-[#3A2E2A]">
                    <td className="px-4 py-2 border border-[#40352F]">
                      {fb.name}
                    </td>
                    <td className="px-4 py-2 border border-[#40352F]">
                      {fb.phone}
                    </td>
                    <td className="px-4 py-2 border border-[#40352F]">
                      {fb.email}
                    </td>
                    <td className="px-4 py-2 border border-[#40352F]">
                      {fb.description}
                    </td>
                    <td className="px-4 py-2 border border-[#40352F] text-sm text-gray-300">
                      {new Date(fb.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
