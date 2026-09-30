"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import AdminSidebar from "@/components/AdminSidebar";
import toast from "react-hot-toast";
import {
  MapPin,
  Plus,
  Trash2,
  Edit2,
  X,
  Search,
  IndianRupee,
  Navigation,
  AlertCircle,
} from "lucide-react";

export default function RoutesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [routes, setRoutes] = useState([]);
  const [search, setSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    stops: [{ name: "", lat: "", lng: "" }],
    fares: [],
  });

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
      fetchRoutes();
    }
  }, [user]);

  const fetchRoutes = async () => {
    try {
      const res = await api.get("/routes");
      setRoutes(res.data || []);
    } catch (err) {
      toast.error("Failed to fetch routes");
    }
  };

  useEffect(() => {
    if (form.stops.length > 1 && !editingId) {
      const fares = [];
      for (let i = 0; i < form.stops.length; i++) {
        for (let j = 0; j < form.stops.length; j++) {
          if (i === j) continue;
          fares.push({
            from: form.stops[i].name || `Stop ${i + 1}`,
            to: form.stops[j].name || `Stop ${j + 1}`,
            fare: 0,
          });
        }
      }
      setForm((prev) => ({ ...prev, fares }));
    }
  }, [form.stops.length, editingId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.stops.length < 2) {
      return toast.error("A route must have at least 2 stops");
    }

    setSubmitting(true);
    const payload = {
      name: form.name.trim(),
      stops: form.stops.map((s) => ({
        name: s.name.trim(),
        coordinates: {
          lat: parseFloat(s.lat) || 0,
          lng: parseFloat(s.lng) || 0,
        },
      })),
      fares: form.fares.map((f) => ({
        from: f.from,
        to: f.to,
        fare: parseFloat(f.fare) || 0,
      })),
    };

    try {
      if (editingId) {
        await api.put(`/routes/${editingId}`, payload);
        toast.success("Route updated successfully");
      } else {
        await api.post("/routes", payload);
        toast.success("Route added successfully");
      }

      resetForm();
      fetchRoutes();
    } catch (err) {
      toast.error(err.response?.data?.message || "Route operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm({
      name: "",
      stops: [{ name: "", lat: "", lng: "" }],
      fares: [],
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (route) => {
    setForm({
      name: route.name,
      stops: route.stops.map((stop) => ({
        name: stop.name,
        lat: stop.coordinates?.lat || "",
        lng: stop.coordinates?.lng || "",
      })),
      fares: route.fares || [],
    });
    setEditingId(route._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this route?")) {
      try {
        await api.delete(`/routes/${id}`);
        fetchRoutes();
        toast.success("Route deleted");
      } catch (err) {
        toast.error("Delete failed");
      }
    }
  };

  const handleStopChange = (index, field, value) => {
    const updatedStops = [...form.stops];
    updatedStops[index][field] = value;
    setForm({ ...form, stops: updatedStops });
  };

  const handleFareChange = (index, value) => {
    const updatedFares = [...form.fares];
    updatedFares[index].fare = parseFloat(value) || 0;
    setForm({ ...form, fares: updatedFares });
  };

  const addStop = () => {
    setForm({
      ...form,
      stops: [...form.stops, { name: "", lat: "", lng: "" }],
    });
  };

  const removeStop = (index) => {
    if (form.stops.length <= 1) {
      return toast.error("Route must have at least one stop");
    }
    const updatedStops = form.stops.filter((_, i) => i !== index);
    setForm({ ...form, stops: updatedStops });
  };

  if (loading || !user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#140c08] text-white">
        <div className="w-10 h-10 border-4 border-[#c9a97f] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const filteredRoutes = routes.filter(
    (r) =>
      r.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.stops?.some((s) => s.name?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[#140c08] text-[#F3E5D7]">
      <AdminSidebar />
      <main className="pt-20 md:pt-24 pb-16 px-4 md:px-8 md:ml-64 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
              <Navigation className="text-[#c9a97f]" />
              Route & Fare Management
            </h1>
            <p className="text-xs md:text-sm text-[#8c7464] mt-0.5">
              Define transit lines, intermediate GPS bus stops, and point-to-point ticket fares.
            </p>
          </div>
          <button
            onClick={() => {
              if (showForm && !editingId) {
                setShowForm(false);
              } else {
                resetForm();
                setShowForm(true);
              }
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#b3885c] to-[#c9a97f] hover:from-[#c9a97f] hover:to-[#dfc39e] text-[#140c08] font-bold text-sm shadow-md transition-all active:scale-95"
          >
            {showForm ? <X size={18} /> : <Plus size={18} />}
            {showForm ? "Close Form" : "Create New Route"}
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
                {editingId ? "Edit Route & Fare Plan" : "Create New Route"}
              </h2>
              <span className="text-xs text-[#a89078]">Add at least 2 stops</span>
            </div>

            <div className="mb-5">
              <label className="block text-xs font-medium text-[#c9a97f] mb-1.5">
                Route Name
              </label>
              <input
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#140c08] border border-[#3d2618] text-white text-sm focus:outline-none focus:border-[#c9a97f] transition-colors"
                placeholder="e.g. Campus to City Central (via Highway)"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            {/* Stops Editor */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-medium text-[#c9a97f] flex items-center gap-1.5">
                  <MapPin size={14} />
                  Route Stops & Coordinates ({form.stops.length})
                </label>
                <button
                  type="button"
                  onClick={addStop}
                  className="inline-flex items-center gap-1 text-xs text-[#c9a97f] hover:text-white px-2.5 py-1 rounded-lg bg-[#2a1a11] border border-[#3d2618] transition-colors"
                >
                  <Plus size={13} />
                  Add Another Stop
                </button>
              </div>

              <div className="space-y-2.5">
                {form.stops.map((stop, index) => (
                  <div
                    key={index}
                    className="flex flex-col sm:flex-row gap-2 items-center bg-[#140c08]/80 p-3 rounded-xl border border-[#2e1c10]"
                  >
                    <span className="w-6 h-6 rounded-full bg-[#2a1a11] text-[#c9a97f] text-xs font-bold flex items-center justify-center border border-[#3d2618] shrink-0">
                      {index + 1}
                    </span>
                    <input
                      className="flex-1 w-full sm:w-auto px-3 py-2 rounded-lg bg-[#1e130c] border border-[#3d2618] text-white text-xs focus:outline-none focus:border-[#c9a97f]"
                      placeholder="Stop name (e.g. Gandhipuram)"
                      value={stop.name}
                      onChange={(e) => handleStopChange(index, "name", e.target.value)}
                      required
                    />
                    <div className="flex gap-2 w-full sm:w-auto">
                      <input
                        type="number"
                        step="any"
                        className="w-1/2 sm:w-32 px-3 py-2 rounded-lg bg-[#1e130c] border border-[#3d2618] text-white text-xs focus:outline-none focus:border-[#c9a97f]"
                        placeholder="Latitude"
                        value={stop.lat}
                        onChange={(e) => handleStopChange(index, "lat", e.target.value)}
                        required
                      />
                      <input
                        type="number"
                        step="any"
                        className="w-1/2 sm:w-32 px-3 py-2 rounded-lg bg-[#1e130c] border border-[#3d2618] text-white text-xs focus:outline-none focus:border-[#c9a97f]"
                        placeholder="Longitude"
                        value={stop.lng}
                        onChange={(e) => handleStopChange(index, "lng", e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => removeStop(index)}
                        className="p-2 text-[#8c7464] hover:text-red-400 transition-colors"
                        title="Remove stop"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Fares Matrix */}
            {form.fares.length > 0 && (
              <div className="mb-6 p-4 rounded-xl bg-[#140c08]/60 border border-[#2e1c10]">
                <div className="flex items-center gap-2 mb-3">
                  <IndianRupee size={16} className="text-[#c9a97f]" />
                  <h3 className="text-xs font-semibold text-[#c9a97f] uppercase tracking-wider">
                    Ticket Fares Matrix (₹)
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto pr-1">
                  {form.fares.map((f, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-lg bg-[#1e130c] border border-[#3d2618] text-xs"
                    >
                      <span className="text-[#a89078] truncate mr-2">
                        {f.from} → {f.to}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[#8c7464]">₹</span>
                        <input
                          type="number"
                          min="0"
                          className="w-16 px-2 py-1 rounded bg-[#140c08] border border-[#3d2618] text-white text-right font-medium text-xs focus:outline-none focus:border-[#c9a97f]"
                          value={f.fare}
                          onChange={(e) => handleFareChange(idx, e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl bg-[#c9a97f] hover:bg-[#b3885c] text-[#140c08] font-bold text-sm transition-colors disabled:opacity-50"
              >
                {submitting ? "Saving..." : editingId ? "Update Route" : "Save Route"}
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

        {/* Search */}
        <div className="relative mb-6">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8c7464]" />
          <input
            type="text"
            placeholder="Search routes or stops..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#1e130c]/70 border border-[#2e1c10] text-sm text-[#F3E5D7] placeholder-[#8c7464] focus:outline-none focus:border-[#c9a97f] transition-colors"
          />
        </div>

        {/* Route Cards */}
        {filteredRoutes.length === 0 ? (
          <div className="text-center py-16 px-4 bg-[#1e130c]/40 rounded-2xl border border-[#2e1c10]">
            <AlertCircle size={40} className="mx-auto text-[#8c7464] mb-3" />
            <p className="text-base text-[#F3E5D7] font-semibold">No routes found</p>
            <p className="text-xs text-[#8c7464] mt-1">
              {search ? "No routes match your query" : "Click 'Create New Route' to add your first transit line"}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            {filteredRoutes.map((route) => (
              <div
                key={route._id}
                className="bg-[#1e130c]/80 border border-[#2e1c10] hover:border-[#c9a97f]/40 p-5 rounded-2xl shadow-lg transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <h3 className="text-base font-bold text-white">{route.name}</h3>
                      <p className="text-xs text-[#8c7464] mt-0.5">
                        {route.stops?.length || 0} stops configured
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleEdit(route)}
                        className="p-2 rounded-lg bg-[#2a1a11] hover:bg-[#342217] border border-[#3d2618] text-[#c9a97f] transition-colors"
                        title="Edit route"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(route._id)}
                        className="p-2 rounded-lg bg-red-950/30 hover:bg-red-900/50 border border-red-800/40 text-red-300 transition-colors"
                        title="Delete route"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Stops Timeline */}
                  <div className="my-3 space-y-2 py-2 border-y border-[#2e1c10]/60">
                    <span className="text-[11px] font-semibold text-[#a89078] uppercase tracking-wider block mb-1">
                      Stops Sequence:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {route.stops?.map((stop, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#140c08] border border-[#2e1c10] text-xs text-[#F3E5D7]"
                        >
                          <span className="w-4 h-4 rounded-full bg-[#2a1a11] text-[#c9a97f] text-[10px] flex items-center justify-center font-bold">
                            {idx + 1}
                          </span>
                          {stop.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Fares count summary */}
                  {route.fares && route.fares.length > 0 && (
                    <div className="text-xs text-[#8c7464] flex items-center gap-1.5 mt-2">
                      <IndianRupee size={12} className="text-[#c9a97f]" />
                      <span>{route.fares.length} fare rates defined for this route</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
