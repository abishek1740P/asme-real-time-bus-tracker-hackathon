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
  const [sortOrder, setSortOrder] = useState("newest");
  const [filterDate, setFilterDate] = useState("");

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

  // Calculate rating statistics
  const calculateRatingStats = () => {
    const filtered = feedbacks.filter((fb) => {
      if (!filterDate) return true;
      const fbDate = new Date(fb.createdAt).toISOString().split("T")[0];
      return fbDate === filterDate;
    });

    const total = filtered.length;
    if (total === 0) return null;

    const average = (
      filtered.reduce((sum, fb) => sum + fb.rating, 0) / total
    ).toFixed(1);

    const distribution = Array(10).fill(0);
    filtered.forEach((fb) => distribution[fb.rating - 1]++);

    // Calculate percentages for pie chart
    let currentAngle = 0;
    const pieData = distribution.map((count, index) => {
      const percentage = (count / total) * 100;
      const angle = (percentage / 100) * 360;
      const data = {
        rating: index + 1,
        count,
        percentage: percentage.toFixed(1),
        angle,
        startAngle: currentAngle,
        endAngle: currentAngle + angle,
      };
      currentAngle += angle;
      return data;
    });

    return {
      total,
      average,
      distribution: pieData,
    };
  };

  const stats = calculateRatingStats();

  // Color palette for pie chart
  const ratingColors = [
    "#EF4444",
    "#F97316",
    "#F59E0B",
    "#EAB308",
    "#84CC16",
    "#22C55E",
    "#10B981",
    "#06B6D4",
    "#3B82F6",
    "#8B5CF6",
  ];

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
          Passenger Feedback Analytics
        </h2>

        {/* Rating Demographics */}
        {stats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Overall Stats */}
            <div className="bg-[#2D2421] p-6 rounded-lg border border-[#40352F]">
              <h3 className="text-lg font-bold mb-4 text-[#F3E5D7]">
                Overall Rating
              </h3>
              <div className="text-center">
                <div className="text-4xl font-bold text-[#FFD700] mb-2">
                  {stats.average}/10
                </div>
                <div className="text-gray-400">Average Rating</div>
                <div className="text-sm text-gray-400 mt-2">
                  Based on {stats.total} feedbacks
                </div>

                {/* Rating Breakdown */}
                <div className="mt-6 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Excellent (9-10):</span>
                    <span className="text-[#FFD700]">
                      {stats.distribution
                        .slice(8)
                        .reduce((sum, item) => sum + item.count, 0)}{" "}
                      feedbacks
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Good (7-8):</span>
                    <span className="text-[#84CC16]">
                      {stats.distribution
                        .slice(6, 8)
                        .reduce((sum, item) => sum + item.count, 0)}{" "}
                      feedbacks
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Average (5-6):</span>
                    <span className="text-[#F59E0B]">
                      {stats.distribution
                        .slice(4, 6)
                        .reduce((sum, item) => sum + item.count, 0)}{" "}
                      feedbacks
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Poor (1-4):</span>
                    <span className="text-[#EF4444]">
                      {stats.distribution
                        .slice(0, 4)
                        .reduce((sum, item) => sum + item.count, 0)}{" "}
                      feedbacks
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Circular Pie Chart */}
            <div className="bg-[#2D2421] p-6 rounded-lg border border-[#40352F]">
              <h3 className="text-lg font-bold mb-4 text-[#F3E5D7] text-center">
                Rating Distribution
              </h3>
              <div className="flex flex-col lg:flex-row items-center justify-center gap-6">
                {/* Pie Chart */}
                <div className="relative w-48 h-48">
                  <svg
                    viewBox="0 0 100 100"
                    className="w-full h-full transform -rotate-90"
                  >
                    {stats.distribution.map(
                      (item, index) =>
                        item.percentage > 0 && (
                          <circle
                            key={item.rating}
                            cx="50"
                            cy="50"
                            r="40"
                            fill="transparent"
                            stroke={ratingColors[index]}
                            strokeWidth="20"
                            strokeDasharray={`${item.percentage} ${
                              100 - item.percentage
                            }`}
                            strokeDashoffset={
                              100 - item.startAngle * (100 / 360)
                            }
                            className="transition-all duration-500 ease-out"
                          />
                        )
                    )}
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-[#FFD700]">
                        {stats.total}
                      </div>
                      <div className="text-xs text-gray-400">Total</div>
                    </div>
                  </div>
                </div>

                {/* Legend */}
                <div className="space-y-2 max-w-xs">
                  <h4 className="font-medium text-[#F3E5D7] mb-2">
                    Rating Legend
                  </h4>
                  {stats.distribution.map(
                    (item, index) =>
                      item.count > 0 && (
                        <div
                          key={item.rating}
                          className="flex items-center justify-between text-sm"
                        >
                          <div className="flex items-center space-x-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: ratingColors[index] }}
                            ></div>
                            <span>{item.rating} ⭐</span>
                          </div>
                          <span className="text-gray-400">
                            {item.count} ({item.percentage}%)
                          </span>
                        </div>
                      )
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Alternative: Donut Chart View */}
        {stats && (
          <div className="bg-[#2D2421] p-6 rounded-lg border border-[#40352F] mb-8">
            <h3 className="text-lg font-bold mb-4 text-[#F3E5D7] text-center">
              Detailed Rating Analysis
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {stats.distribution.map((item, index) => (
                <div key={item.rating} className="text-center">
                  <div className="relative inline-block mb-2">
                    <svg
                      width="80"
                      height="80"
                      className="transform -rotate-90"
                    >
                      <circle
                        cx="40"
                        cy="40"
                        r="35"
                        fill="transparent"
                        stroke="#3A2E2A"
                        strokeWidth="6"
                      />
                      <circle
                        cx="40"
                        cy="40"
                        r="35"
                        fill="transparent"
                        stroke={ratingColors[index]}
                        strokeWidth="6"
                        strokeDasharray={`${item.percentage} ${
                          100 - item.percentage
                        }`}
                        className="transition-all duration-700 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div>
                        <div className="text-lg font-bold text-[#FFD700]">
                          {item.rating}
                        </div>
                        <div className="text-xs text-gray-400">⭐</div>
                      </div>
                    </div>
                  </div>
                  <div className="text-sm">
                    <div className="font-medium">{item.count}</div>
                    <div className="text-gray-400 text-xs">
                      {item.percentage}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="bg-[#2D2421] text-white px-3 py-2 rounded-lg border border-[#40352F]"
          >
            <option value="newest">📅 Sort by Newest</option>
            <option value="oldest">📅 Sort by Oldest</option>
          </select>

          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="bg-[#2D2421] text-white px-3 py-2 rounded-lg border border-[#40352F]"
          />

          {filterDate && (
            <button
              onClick={() => setFilterDate("")}
              className="bg-[#5D4037] hover:bg-[#7B4B32] px-4 py-2 rounded text-white transition-colors"
            >
              Clear Date Filter
            </button>
          )}
        </div>

        {/* Table */}
        {processedFeedbacks.length === 0 ? (
          <p className="text-gray-400">No feedback found.</p>
        ) : (
          <div className="overflow-x-auto bg-[#2D2421] rounded-lg border border-[#40352F]">
            <table className="min-w-full">
              <thead className="bg-[#3A2E2A]">
                <tr>
                  <th className="px-4 py-3 border-b border-[#40352F] text-left">
                    Name
                  </th>
                  <th className="px-4 py-3 border-b border-[#40352F] text-left">
                    Phone
                  </th>
                  <th className="px-4 py-3 border-b border-[#40352F] text-left">
                    Email
                  </th>
                  <th className="px-4 py-3 border-b border-[#40352F] text-left">
                    Rating
                  </th>
                  <th className="px-4 py-3 border-b border-[#40352F] text-left">
                    Feedback
                  </th>
                  <th className="px-4 py-3 border-b border-[#40352F] text-left">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {processedFeedbacks.map((fb) => (
                  <tr
                    key={fb._id}
                    className="hover:bg-[#3A2E2A] border-b border-[#40352F] last:border-b-0"
                  >
                    <td className="px-4 py-3">{fb.name}</td>
                    <td className="px-4 py-3">{fb.phone}</td>
                    <td className="px-4 py-3">{fb.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white"
                        style={{
                          backgroundColor: ratingColors[fb.rating - 1],
                          boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                        }}
                      >
                        ⭐ {fb.rating}/10
                      </span>
                    </td>
                    <td
                      className="px-4 py-3 max-w-xs truncate"
                      title={fb.description}
                    >
                      {fb.description}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">
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
