"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import Link from "next/link";
import {
  Bus,
  MapPin,
  User,
  Phone,
  QrCode,
  History,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

export default function ConductorDashboard() {
  const [bus, setBus] = useState(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchAssignedBus = async () => {
      try {
        const res = await api.get("/conductors/me/assigned-bus");
        setBus(res.data);
      } catch (err) {
        toast.error("Failed to fetch assigned bus");
      } finally {
        setFetching(false);
      }
    };
    fetchAssignedBus();
  }, []);

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-10 h-10 border-4 border-[#c9a97f] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-[#a89078]">Loading assigned fleet vehicle...</p>
      </div>
    );
  }

  if (!bus) {
    return (
      <div className="max-w-md mx-auto text-center py-16 px-6 bg-[#1e130c]/80 border border-[#3d2618] rounded-3xl mt-6 shadow-xl">
        <AlertCircle size={44} className="mx-auto text-amber-500 mb-3" />
        <h2 className="text-lg font-bold text-white mb-1">No Bus Assigned Yet</h2>
        <p className="text-xs text-[#8c7464] mb-6">
          Your account is registered as a conductor, but an administrator has not yet assigned a bus to you.
        </p>
        <div className="p-3 bg-[#140c08] border border-[#2e1c10] rounded-xl text-xs text-[#a89078]">
          Please contact campus fleet operations to get your route and bus assigned.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Hero Welcome */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2a1a11] via-[#1e130c] to-[#140c08] border border-[#3d2618] p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#c9a97f]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#c9a97f]/10 border border-[#c9a97f]/30 text-[#c9a97f] text-xs font-semibold uppercase tracking-wider mb-2">
              <ShieldCheck size={13} />
              Ticket Verification Duty
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white">
              Conductor Portal
            </h1>
            <p className="text-xs md:text-sm text-[#8c7464] mt-1">
              Verify student QR boarding passes and audit trip validation logs.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <CheckCircle size={14} />
              Shift Active
            </span>
          </div>
        </div>
      </div>

      {/* Assigned Bus Card */}
      <div className="bg-[#1e130c]/90 border border-[#3d2618] rounded-3xl p-6 md:p-8 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-[#2e1c10]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-[#c9a97f]">
              <Bus size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{bus.name}</h2>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#2a1a11] text-[#c9a97f] border border-[#3d2618]">
                {bus.number}
              </span>
            </div>
          </div>
          <span className="text-xs text-[#8c7464]">Assigned Fleet Vehicle</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-[#140c08] border border-[#2e1c10]">
            <span className="text-[#8c7464] block mb-1 flex items-center gap-1.5">
              <MapPin size={13} className="text-orange-400" />
              Route
            </span>
            <span className="text-white font-semibold text-sm">
              {bus.route?.name || "Not Assigned"}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#140c08] border border-[#2e1c10]">
            <span className="text-[#8c7464] block mb-1 flex items-center gap-1.5">
              <User size={13} className="text-blue-400" />
              Driver in Charge
            </span>
            <span className="text-white font-semibold text-sm">
              {bus.driver?.name || "Not Assigned"}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#140c08] border border-[#2e1c10]">
            <span className="text-[#8c7464] block mb-1 flex items-center gap-1.5">
              <Phone size={13} className="text-emerald-400" />
              Driver Phone
            </span>
            <span className="text-white font-semibold text-sm">
              {bus.driver?.phone || "N/A"}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/conductor/scan"
          className="group p-6 rounded-3xl bg-gradient-to-br from-[#2a1a11] to-[#1e130c] border border-[#3d2618] hover:border-[#c9a97f]/50 shadow-xl transition-all duration-300 hover:scale-[1.02] flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#c9a97f] to-[#b3885c] text-[#140c08] flex items-center justify-center font-bold shadow-lg shadow-amber-950/40">
              <QrCode size={26} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white group-hover:text-[#c9a97f] transition-colors">
                Scan Boarding Pass
              </h3>
              <p className="text-xs text-[#8c7464] mt-0.5">
                Launch camera scanner to validate student QR tickets.
              </p>
            </div>
          </div>
          <ArrowRight size={20} className="text-[#5a4232] group-hover:text-[#c9a97f] group-hover:translate-x-1 transition-all" />
        </Link>

        <Link
          href="/conductor/history"
          className="group p-6 rounded-3xl bg-[#1e130c]/80 hover:bg-[#25170f] border border-[#2e1c10] hover:border-[#c9a97f]/40 shadow-xl transition-all duration-300 hover:scale-[1.02] flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#2a1a11] border border-[#3d2618] text-[#c9a97f] flex items-center justify-center font-bold">
              <History size={26} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white group-hover:text-[#c9a97f] transition-colors">
                Validation History
              </h3>
              <p className="text-xs text-[#8c7464] mt-0.5">
                Audit list of past tickets scanned and passenger logs.
              </p>
            </div>
          </div>
          <ArrowRight size={20} className="text-[#5a4232] group-hover:text-[#c9a97f] group-hover:translate-x-1 transition-all" />
        </Link>
      </div>
    </div>
  );
}
