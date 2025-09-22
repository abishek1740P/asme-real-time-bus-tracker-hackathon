"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import AdminSidebar from "@/components/AdminSidebar";
import toast from "react-hot-toast";

export default function RoutesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [routes, setRoutes] = useState([]);
  const [form, setForm] = useState({
    name: "",
    stops: [{ name: "", lat: "", lng: "" }],
    fares: [], // new fares array
  });
  const [editingId, setEditingId] = useState(null);

  // Auth & access check
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

  // Fetch all routes
  const fetchRoutes = async () => {
    try {
      const res = await api.get("/routes");
      setRoutes(res.data);
    } catch (err) {
      toast.error("Failed to fetch routes");
    }
  };

  // Generate all fare combinations whenever stops change
  // Generate all fare combinations whenever stops change
  useEffect(() => {
    if (form.stops.length > 1) {
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
    } else {
      setForm((prev) => ({ ...prev, fares: [] }));
    }
  }, [form.stops.map((s) => s.name).join(",")]);

  // Submit route
  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      stops: form.stops.map((s) => ({
        name: s.name.trim(),
        coordinates: {
          lat: parseFloat(s.lat),
          lng: parseFloat(s.lng),
        },
      })),
      fares: form.fares,
    };

    try {
      if (editingId) {
        await api.put(`/routes/${editingId}`, payload);
        toast.success("Route updated");
      } else {
        await api.post("/routes", payload);
        toast.success("Route added");
      }

      setForm({ name: "", stops: [{ name: "", lat: "", lng: "" }], fares: [] });
      setEditingId(null);
      fetchRoutes();
    } catch (err) {
      toast.error("Route operation failed");
    }
  };

  // Edit route
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
    updatedFares[index].fare = parseFloat(value);
    setForm({ ...form, fares: updatedFares });
  };

  const addStop = () => {
    setForm({
      ...form,
      stops: [...form.stops, { name: "", lat: "", lng: "" }],
    });
  };

  const removeStop = (index) => {
    const updatedStops = form.stops.filter((_, i) => i !== index);
    setForm({ ...form, stops: updatedStops });
  };

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
      <main className="p-4 md:p-8 md:ml-[16rem]">
        <h2 className="text-2xl font-bold mb-6">🗺️ Routes</h2>

        <form
          onSubmit={handleSubmit}
          className="bg-[#2D2421] p-4 rounded-xl mb-6 space-y-4"
        >
          <input
            className="w-full p-2 rounded bg-[#40352F] text-white"
            placeholder="Route Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />

          <h4 className="text-lg font-semibold">🛑 Stops</h4>
          {form.stops.map((stop, index) => (
            <div key={index} className="flex flex-wrap gap-2 mb-2 items-center">
              <input
                className="flex-1 p-2 rounded bg-[#40352F] text-white"
                placeholder="Stop Name"
                value={stop.name}
                onChange={(e) =>
                  handleStopChange(index, "name", e.target.value)
                }
                required
              />
              <input
                type="number"
                step="any"
                className="w-28 p-2 rounded bg-[#40352F] text-white"
                placeholder="Lat"
                value={stop.lat}
                onChange={(e) => handleStopChange(index, "lat", e.target.value)}
                required
              />
              <input
                type="number"
                step="any"
                className="w-28 p-2 rounded bg-[#40352F] text-white"
                placeholder="Lng"
                value={stop.lng}
                onChange={(e) => handleStopChange(index, "lng", e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => removeStop(index)}
                className="text-red-400 hover:underline"
              >
                🗑
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addStop}
            className="text-blue-300 hover:underline"
          >
            ➕ Add Stop
          </button>

          {/* Fares Section */}
          {form.fares.length > 0 && (
            <div className="mt-4">
              <h4 className="text-lg font-semibold">💰 Fares</h4>
              {form.fares.map((f, idx) => (
                <div key={idx} className="flex gap-2 items-center mb-2">
                  <span>
                    {f.from} → {f.to}:
                  </span>
                  <input
                    type="number"
                    min="0"
                    className="w-24 p-2 rounded bg-[#40352F] text-white"
                    value={f.fare}
                    onChange={(e) => handleFareChange(idx, e.target.value)}
                    required
                  />
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 mt-4">
            <button className="bg-[#A9745F] hover:bg-[#8C5F4E] px-4 py-2 rounded text-white">
              {editingId ? "Update Route" : "Add Route"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() =>
                  setForm({
                    name: "",
                    stops: [{ name: "", lat: "", lng: "" }],
                    fares: [],
                  }) || setEditingId(null)
                }
                className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded text-white"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          {routes.map((route) => (
            <div key={route._id} className="bg-[#2D2421] p-4 rounded-lg">
              <p className="text-lg font-medium">{route.name}</p>
              <div className="mt-2 space-y-1 text-sm">
                {route.stops.map((stop, idx) => (
                  <p key={idx}>
                    🚏 <strong>{stop.name}</strong> — {stop.coordinates?.lat},{" "}
                    {stop.coordinates?.lng}
                  </p>
                ))}
              </div>
              {route.fares && route.fares.length > 0 && (
                <div className="mt-2 text-sm">
                  <p className="font-semibold">💰 Fares:</p>
                  {route.fares.map((f, idx) => (
                    <p key={idx}>
                      {f.from} → {f.to}: ₹{f.fare}
                    </p>
                  ))}
                </div>
              )}
              <div className="flex space-x-3 mt-3">
                <button
                  onClick={() => handleEdit(route)}
                  className="text-blue-300 hover:underline"
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => handleDelete(route._id)}
                  className="text-red-400 hover:underline"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
