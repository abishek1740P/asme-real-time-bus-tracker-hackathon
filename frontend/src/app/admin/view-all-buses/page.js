"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import Link from "next/link";
import AdminSidebar from "@/components/AdminSidebar";
import {
  Bus,
  MapPin,
  User,
  Phone,
  ArrowRight,
  Search,
  Gauge,
  Activity,
  AlertCircle,
} from "lucide-react";

export default function AdminViewAllBusesPage() {
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api
      .get("/buses")
      .then((res) => {
        setBuses(res.data || []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const filteredBuses = buses.filter(
    (b) =>
      b.name?.toLowerCase().includes(search.toLowerCase()) ||
      b.number?.toLowerCase().includes(search.toLowerCase()) ||
      b.route?.name?.toLowerCase().includes(search.toLowerCase()) ||
      b.driver?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#140c08] text-[#F3E5D7]">
      <AdminSidebar />
      <main className="pt-20 md:pt-24 pb-16 px-4 md:px-8 md:ml-64 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
              <Bus className="text-[#c9a97f]" />
              Live Fleet Tracking Directory
            </h1>
            <p className="text-xs md:text-sm text-[#8c7464] mt-0.5">
              Select any bus to inspect its live GPS telemetry, driver connectivity, and speed history.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {buses.length} Fleet Vehicles
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8c7464]" />
          <input
            type="text"
            placeholder="Search by bus name, registration number, route, or driver..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#1e130c]/70 border border-[#2e1c10] text-sm text-[#F3E5D7] placeholder-[#8c7464] focus:outline-none focus:border-[#c9a97f] transition-colors"
          />
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="w-10 h-10 border-4 border-[#c9a97f] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-[#a89078]">Loading fleet vehicles...</p>
          </div>
        ) : filteredBuses.length === 0 ? (
          <div className="text-center py-16 px-4 bg-[#1e130c]/40 rounded-2xl border border-[#2e1c10]">
            <AlertCircle size={40} className="mx-auto text-[#8c7464] mb-3" />
            <p className="text-base text-[#F3E5D7] font-semibold">No buses match your filter</p>
            <p className="text-xs text-[#8c7464] mt-1">Try another search term or verify buses are created in the admin panel.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredBuses.map((bus) => (
              <Link
                href={`/admin/view-all-buses/${bus._id}`}
                key={bus._id}
                className="group relative bg-[#1e130c]/80 hover:bg-[#25170f] border border-[#2e1c10] hover:border-[#c9a97f]/50 rounded-2xl p-5 shadow-lg transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <h2 className="text-base font-bold text-white group-hover:text-[#c9a97f] transition-colors">
                        {bus.name}
                      </h2>
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#2a1a11] text-[#c9a97f] border border-[#3d2618] mt-1">
                        {bus.number}
                      </span>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-[#2a1a11] border border-[#3d2618] flex items-center justify-center text-[#c9a97f] group-hover:bg-[#c9a97f] group-hover:text-[#140c08] transition-colors">
                      <Activity size={18} />
                    </div>
                  </div>

                  <div className="space-y-2 text-xs py-3 border-y border-[#2e1c10]/60">
                    <div className="flex items-center gap-2 text-[#a89078]">
                      <MapPin size={14} className="text-orange-400 shrink-0" />
                      <span className="text-[#8c7464]">Route:</span>
                      <span className="text-white font-medium truncate">
                        {bus.route?.name || "Not Assigned"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[#a89078]">
                      <User size={14} className="text-blue-400 shrink-0" />
                      <span className="text-[#8c7464]">Driver:</span>
                      <span className="text-white font-medium truncate">
                        {bus.driver?.name || "Not Assigned"}
                      </span>
                    </div>
                    {bus.driver?.phone && (
                      <div className="flex items-center gap-2 text-[#a89078]">
                        <Phone size={14} className="text-emerald-400 shrink-0" />
                        <span className="text-[#8c7464]">Phone:</span>
                        <span className="text-white font-medium">{bus.driver.phone}</span>
                      </div>
                    )}
                    {bus.speedLimit && (
                      <div className="flex items-center gap-2 text-[#a89078]">
                        <Gauge size={14} className="text-amber-400 shrink-0" />
                        <span className="text-[#8c7464]">Speed Limit:</span>
                        <span className="text-white font-medium">{bus.speedLimit} km/h</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-2 text-xs text-[#c9a97f] font-semibold group-hover:translate-x-1 transition-transform">
                  <span>Open Live Telemetry Map</span>
                  <ArrowRight size={14} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
