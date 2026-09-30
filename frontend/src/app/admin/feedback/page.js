"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import AdminSidebar from "@/components/AdminSidebar";
import toast from "react-hot-toast";
import {
  MessageSquare,
  Users,
  Car,
  Star,
  Calendar,
  Search,
  Filter,
  BarChart3,
  AlertCircle,
} from "lucide-react";

export default function FeedbackPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [feedbacks, setFeedbacks] = useState([]);
  const [sortOrder, setSortOrder] = useState("newest");
  const [search, setSearch] = useState("");
  const [feedbackType, setFeedbackType] = useState("passenger");
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(false);

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

  useEffect(() => {
    if (user && user.role === "admin") {
      fetchFeedbacks();
    }
  }, [user, feedbackType]);

  const fetchFeedbacks = async () => {
    try {
      setLoadingFeedbacks(true);
      const endpoint =
        feedbackType === "passenger" ? "/student/feedback" : "/driver/feedback";
      const res = await api.get(endpoint);
      setFeedbacks(res.data || []);
    } catch (err) {
      toast.error(`Failed to load ${feedbackType} feedback`);
    } finally {
      setLoadingFeedbacks(false);
    }
  };

  const calculateRatingStats = () => {
    const total = feedbacks.length;
    if (total === 0) return null;

    const average = (
      feedbacks.reduce((sum, fb) => sum + (fb.rating || 0), 0) / total
    ).toFixed(1);

    const distribution = Array(10).fill(0);
    feedbacks.forEach((fb) => {
      if (fb.rating >= 1 && fb.rating <= 10) {
        distribution[fb.rating - 1]++;
      }
    });

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

  const processedFeedbacks = feedbacks
    .filter(
      (fb) =>
        fb.name?.toLowerCase().includes(search.toLowerCase()) ||
        fb.email?.toLowerCase().includes(search.toLowerCase()) ||
        fb.description?.toLowerCase().includes(search.toLowerCase()) ||
        (fb.vehicleNumber &&
          fb.vehicleNumber.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => {
      if (sortOrder === "newest") {
        return new Date(b.createdAt) - new Date(a.createdAt);
      } else {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
    });

  if (loading || !user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#140c08] text-white">
        <div className="w-10 h-10 border-4 border-[#c9a97f] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#140c08] text-[#F3E5D7]">
      <AdminSidebar />
      <main className="pt-20 md:pt-24 pb-16 px-4 md:px-8 md:ml-64 max-w-7xl">
        {/* Header with Type Selector */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
              <MessageSquare className="text-[#c9a97f]" />
              {feedbackType === "passenger" ? "Passenger" : "Driver"} Feedback Analytics
            </h1>
            <p className="text-xs md:text-sm text-[#8c7464] mt-0.5">
              Review passenger satisfaction ratings and driver road reports.
            </p>
          </div>

          {/* Toggle pill */}
          <div className="flex items-center gap-1.5 bg-[#1e130c] p-1.5 rounded-2xl border border-[#3d2618]">
            <button
              onClick={() => setFeedbackType("passenger")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                feedbackType === "passenger"
                  ? "bg-[#c9a97f] text-[#140c08] shadow-md"
                  : "text-[#8c7464] hover:text-white"
              }`}
            >
              <Users size={15} />
              Passenger Feedback
            </button>
            <button
              onClick={() => setFeedbackType("driver")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                feedbackType === "driver"
                  ? "bg-[#c9a97f] text-[#140c08] shadow-md"
                  : "text-[#8c7464] hover:text-white"
              }`}
            >
              <Car size={15} />
              Driver Feedback
            </button>
          </div>
        </div>

        {/* Loading */}
        {loadingFeedbacks ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-3 border-[#c9a97f] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-[#8c7464]">Loading feedback telemetry...</p>
          </div>
        ) : (
          <>
            {/* Stats Summary */}
            {stats && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
                {/* Average score card */}
                <div className="bg-[#1e130c]/80 border border-[#2e1c10] p-6 rounded-2xl flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#a89078]">
                      Net Rating Score
                    </span>
                    <Star size={18} className="text-amber-400 fill-amber-400" />
                  </div>
                  <div>
                    <div className="text-4xl md:text-5xl font-black text-white flex items-baseline gap-1">
                      {stats.average}
                      <span className="text-base text-[#8c7464] font-normal">/ 10</span>
                    </div>
                    <p className="text-xs text-[#8c7464] mt-2">
                      Aggregated across {stats.total} total {feedbackType} reviews
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#2e1c10] flex items-center justify-between text-xs">
                    <span className="text-[#a89078]">Response Sentiment</span>
                    <span className="text-emerald-400 font-semibold">
                      {parseFloat(stats.average) >= 7 ? "Very Positive" : "Moderate"}
                    </span>
                  </div>
                </div>

                {/* Rating Distribution Bar */}
                <div className="lg:col-span-2 bg-[#1e130c]/80 border border-[#2e1c10] p-6 rounded-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <BarChart3 size={16} className="text-[#c9a97f]" />
                      Rating Spread (1 to 10 Stars)
                    </h3>
                    <span className="text-xs text-[#8c7464]">{stats.total} total submissions</span>
                  </div>
                  <div className="grid grid-cols-10 gap-1.5 items-end h-28 pt-2">
                    {stats.distribution.map((item) => {
                      const heightPercent = stats.total > 0 ? (item.count / stats.total) * 100 : 0;
                      return (
                        <div key={item.rating} className="flex flex-col items-center h-full justify-end group">
                          <div className="text-[10px] text-[#8c7464] mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {item.count}
                          </div>
                          <div
                            className="w-full rounded-t-md transition-all duration-300"
                            style={{
                              height: `${Math.max(heightPercent, 6)}%`,
                              backgroundColor: ratingColors[item.rating - 1],
                            }}
                          />
                          <span className="text-[10px] text-[#a89078] mt-1.5 font-medium">
                            {item.rating}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8c7464]" />
                <input
                  type="text"
                  placeholder="Search reviews by name, email, or remarks..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#1e130c]/70 border border-[#2e1c10] text-xs md:text-sm text-[#F3E5D7] placeholder-[#8c7464] focus:outline-none focus:border-[#c9a97f]"
                />
              </div>

              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="px-3 py-2.5 rounded-xl bg-[#1e130c] border border-[#2e1c10] text-xs text-[#F3E5D7] focus:outline-none focus:border-[#c9a97f]"
              >
                <option value="newest">Latest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>

            {/* Feedback Cards & Table */}
            {processedFeedbacks.length === 0 ? (
              <div className="text-center py-16 px-4 bg-[#1e130c]/40 rounded-2xl border border-[#2e1c10]">
                <AlertCircle size={40} className="mx-auto text-[#8c7464] mb-3" />
                <p className="text-base text-[#F3E5D7] font-semibold">No feedback records found</p>
                <p className="text-xs text-[#8c7464] mt-1">
                  {search ? "Try refining your search terms" : "No responses collected yet"}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                {processedFeedbacks.map((fb) => (
                  <div
                    key={fb._id}
                    className="bg-[#1e130c]/80 border border-[#2e1c10] p-5 rounded-2xl shadow-lg flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <h4 className="text-sm font-bold text-white">{fb.name}</h4>
                          <span className="text-xs text-[#8c7464]">{fb.email}</span>
                        </div>
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-white shadow-sm shrink-0"
                          style={{
                            backgroundColor: ratingColors[(fb.rating || 1) - 1],
                          }}
                        >
                          <Star size={11} className="fill-white" />
                          {fb.rating}/10
                        </span>
                      </div>

                      {feedbackType === "driver" && (
                        <div className="grid grid-cols-3 gap-2 p-2 rounded-xl bg-[#140c08] border border-[#2e1c10] mb-3 text-[11px]">
                          <div>
                            <span className="text-[#8c7464] block">Driver ID</span>
                            <span className="text-white font-medium truncate block">{fb.driverId || "—"}</span>
                          </div>
                          <div>
                            <span className="text-[#8c7464] block">Vehicle</span>
                            <span className="text-white font-medium truncate block">{fb.vehicleNumber || "—"}</span>
                          </div>
                          <div>
                            <span className="text-[#8c7464] block">Route</span>
                            <span className="text-white font-medium truncate block">{fb.route || "—"}</span>
                          </div>
                        </div>
                      )}

                      <p className="text-xs text-[#D7CCC8] leading-relaxed bg-[#140c08]/50 p-3 rounded-xl border border-[#2e1c10]">
                        "{fb.description || "No comment provided."}"
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#8c7464] mt-3 pt-2 border-t border-[#2e1c10]/60">
                      <span>{fb.phone || "No phone"}</span>
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        {new Date(fb.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}