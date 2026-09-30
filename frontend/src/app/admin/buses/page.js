"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import AdminSidebar from "@/components/AdminSidebar";
import toast from "react-hot-toast";
import {
  Bus,
  Plus,
  Edit2,
  Trash2,
  Search,
  MapPin,
  User,
  Gauge,
  UserCheck,
  X,
  AlertCircle,
} from "lucide-react";

export default function BusesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [conductors, setConductors] = useState([]);
  const [search, setSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    name: "",
    number: "",
    route: "",
    driver: "",
    conductor: "",
    speedLimit: "",
  });
  const [editingBusId, setEditingBusId] = useState(null);

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
      const fetchData = async () => {
        try {
          const [busRes, routeRes, driverRes, conductorRes] = await Promise.all([
            api.get("/buses"),
            api.get("/routes"),
            api.get("/drivers"),
            api.get("/conductors"),
          ]);
          setBuses(busRes.data || []);
          setRoutes(routeRes.data || []);
          setDrivers(driverRes.data || []);
          setConductors(conductorRes.data || []);
        } catch (err) {
          toast.error("Failed to fetch fleet data");
        }
      };
      fetchData();
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingBusId) {
        await api.put(`/buses/${editingBusId}`, form);
        toast.success("Bus updated successfully");
      } else {
        await api.post("/buses", form);
        toast.success("New bus registered successfully");
      }
      resetForm();
      const updated = await api.get("/buses");
      setBuses(updated.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Error submitting form");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm({
      name: "",
      number: "",
      route: "",
      driver: "",
      conductor: "",
      speedLimit: "",
    });
    setEditingBusId(null);
    setShowForm(false);
  };

  const handleEdit = (bus) => {
    setForm({
      name: bus.name || "",
      number: bus.number || "",
      route: bus.route?._id || "",
      driver: bus.driver?._id || "",
      conductor: bus.conductor?._id || "",
      speedLimit: bus.speedLimit || "",
    });
    setEditingBusId(bus._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this bus?")) {
      try {
        await api.delete(`/buses/${id}`);
        setBuses(buses.filter((bus) => bus._id !== id));
        toast.success("Bus deleted");
      } catch (err) {
        toast.error("Failed to delete bus");
      }
    }
  };

  if (loading || !user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#140c08] text-white">
        <div className="w-10 h-10 border-4 border-[#c9a97f] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const filteredBuses = buses.filter(
    (b) =>
      b.name?.toLowerCase().includes(search.toLowerCase()) ||
      b.number?.toLowerCase().includes(search.toLowerCase()) ||
      b.route?.name?.toLowerCase().includes(search.toLowerCase())
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
              Bus Fleet Management
            </h1>
            <p className="text-xs md:text-sm text-[#8c7464] mt-0.5">
              Configure buses, assign routes, drivers, and conductors.
            </p>
          </div>
          <button
            onClick={() => {
              if (showForm && !editingBusId) {
                setShowForm(false);
              } else {
                resetForm();
                setShowForm(true);
              }
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#b3885c] to-[#c9a97f] hover:from-[#c9a97f] hover:to-[#dfc39e] text-[#140c08] font-bold text-sm shadow-md transition-all active:scale-95"
          >
            {showForm ? <X size={18} /> : <Plus size={18} />}
            {showForm ? "Close Form" : "Add New Bus"}
          </button>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="bg-[#1e130c]/90 border border-[#3d2618] p-5 md:p-6 rounded-2xl mb-8 shadow-xl backdrop-blur-md animate-fadeIn"
          >
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#2e1c10]">
              <h2 className="font-semibold text-lg text-white">
                {editingBusId ? "Edit Bus Details" : "Register New Bus"}
              </h2>
              <span className="text-xs text-[#a89078]">* All fields required</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-[#c9a97f] mb-1.5">
                  Bus Name / Label
                </label>
                <input
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#140c08] border border-[#3d2618] text-white text-sm focus:outline-none focus:border-[#c9a97f] transition-colors"
                  placeholder="e.g. Express Line Alpha"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#c9a97f] mb-1.5">
                  Registration / Bus Number
                </label>
                <input
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#140c08] border border-[#3d2618] text-white text-sm focus:outline-none focus:border-[#c9a97f] transition-colors"
                  placeholder="e.g. TN 37 AB 1234"
                  value={form.number}
                  onChange={(e) => setForm({ ...form, number: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#c9a97f] mb-1.5">
                  Speed Limit (km/h)
                </label>
                <input
                  type="number"
                  min="20"
                  max="120"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#140c08] border border-[#3d2618] text-white text-sm focus:outline-none focus:border-[#c9a97f] transition-colors"
                  placeholder="e.g. 50"
                  value={form.speedLimit}
                  onChange={(e) => setForm({ ...form, speedLimit: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#c9a97f] mb-1.5">
                  Assigned Route
                </label>
                <select
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#140c08] border border-[#3d2618] text-white text-sm focus:outline-none focus:border-[#c9a97f] transition-colors"
                  value={form.route}
                  onChange={(e) => setForm({ ...form, route: e.target.value })}
                  required
                >
                  <option value="">Select Route</option>
                  {routes.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#c9a97f] mb-1.5">
                  Assigned Driver
                </label>
                <select
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#140c08] border border-[#3d2618] text-white text-sm focus:outline-none focus:border-[#c9a97f] transition-colors"
                  value={form.driver}
                  onChange={(e) => setForm({ ...form, driver: e.target.value })}
                  required
                >
                  <option value="">Select Driver</option>
                  {drivers.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name} ({d.phone || "No phone"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#c9a97f] mb-1.5">
                  Assigned Conductor
                </label>
                <select
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#140c08] border border-[#3d2618] text-white text-sm focus:outline-none focus:border-[#c9a97f] transition-colors"
                  value={form.conductor}
                  onChange={(e) => setForm({ ...form, conductor: e.target.value })}
                  required
                >
                  <option value="">Select Conductor</option>
                  {conductors.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({c.phone || "No phone"})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl bg-[#c9a97f] hover:bg-[#b3885c] text-[#140c08] font-bold text-sm transition-colors disabled:opacity-50"
              >
                {submitting ? "Saving..." : editingBusId ? "Update Bus" : "Save Bus"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2.5 rounded-xl bg-[#2a1a11] hover:bg-[#342217] border border-[#3d2618] text-[#a89078] text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Search bar */}
        <div className="relative mb-6">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8c7464]" />
          <input
            type="text"
            placeholder="Search buses by name, number, or route..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#1e130c]/70 border border-[#2e1c10] text-sm text-[#F3E5D7] placeholder-[#8c7464] focus:outline-none focus:border-[#c9a97f] transition-colors"
          />
        </div>

        {/* Bus List Grid */}
        {filteredBuses.length === 0 ? (
          <div className="text-center py-16 px-4 bg-[#1e130c]/40 rounded-2xl border border-[#2e1c10]">
            <AlertCircle size={40} className="mx-auto text-[#8c7464] mb-3" />
            <p className="text-base text-[#F3E5D7] font-semibold">No buses found</p>
            <p className="text-xs text-[#8c7464] mt-1">
              {search ? "No buses match your search criteria" : "Click 'Add New Bus' above to create one"}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {filteredBuses.map((bus) => (
              <div
                key={bus._id}
                className="bg-[#1e130c]/80 border border-[#2e1c10] hover:border-[#c9a97f]/40 p-5 rounded-2xl shadow-lg transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <h3 className="text-base font-bold text-white">{bus.name}</h3>
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#2a1a11] text-[#c9a97f] border border-[#3d2618] mt-1">
                        {bus.number}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#140c08] border border-[#2e1c10] text-xs text-[#c9a97f]">
                      <Gauge size={13} />
                      <span>{bus.speedLimit || "—"} km/h</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs py-3 border-y border-[#2e1c10]/60">
                    <div className="flex items-center gap-2 text-[#a89078]">
                      <MapPin size={14} className="text-orange-400 shrink-0" />
                      <span className="text-[#8c7464]">Route:</span>
                      <span className="text-white font-medium truncate">
                        {bus.route?.name || "Unassigned"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[#a89078]">
                      <User size={14} className="text-blue-400 shrink-0" />
                      <span className="text-[#8c7464]">Driver:</span>
                      <span className="text-white font-medium truncate">
                        {bus.driver?.name || "Unassigned"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[#a89078]">
                      <UserCheck size={14} className="text-purple-400 shrink-0" />
                      <span className="text-[#8c7464]">Conductor:</span>
                      <span className="text-white font-medium truncate">
                        {bus.conductor?.name || "Unassigned"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4 pt-2">
                  <button
                    onClick={() => handleEdit(bus)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#2a1a11] hover:bg-[#342217] border border-[#3d2618] text-[#c9a97f] hover:text-white text-xs font-medium transition-colors"
                  >
                    <Edit2 size={13} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(bus._id)}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-red-950/30 hover:bg-red-900/50 border border-red-800/40 text-red-300 text-xs font-medium transition-colors"
                  >
                    <Trash2 size={13} />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
