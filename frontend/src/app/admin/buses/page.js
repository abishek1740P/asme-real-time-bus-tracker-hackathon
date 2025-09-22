"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import AdminSidebar from "@/components/AdminSidebar";
import toast from "react-hot-toast";

export default function BusesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [conductors, setConductors] = useState([]);
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
          const [busRes, routeRes, driverRes, conductorRes] = await Promise.all(
            [
              api.get("/buses"),
              api.get("/routes"),
              api.get("/drivers"),
              api.get("/conductors"),
            ]
          );
          setBuses(busRes.data);
          setRoutes(routeRes.data);
          setDrivers(driverRes.data);
          setConductors(conductorRes.data);
        } catch (err) {
          toast.error("Failed to fetch data");
        }
      };
      fetchData();
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingBusId) {
        await api.put(`/buses/${editingBusId}`, form);
        toast.success("Bus updated");
      } else {
        await api.post("/buses", form);
        toast.success("Bus added");
      }
      resetForm();
      const updated = await api.get("/buses");
      setBuses(updated.data);
    } catch (err) {
      toast.error("Error submitting form");
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
  };

  const handleEdit = (bus) => {
    setForm({
      name: bus.name,
      number: bus.number,
      route: bus.route?._id || "",
      driver: bus.driver?._id || "",
      conductor: bus.conductor?._id || "",
      speedLimit: bus.speedLimit || "",
    });
    setEditingBusId(bus._id);
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
      <div className="min-h-screen flex items-center justify-center text-white">
        <p>Checking access...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1f1b16] text-[#F3E5D7] relative">
      <AdminSidebar />
      <main className="p-4 md:p-8 md:ml-64">
        <h2 className="text-xl font-bold text-[#F3E5D7] mb-4">🚌 Buses</h2>

        <form
          onSubmit={handleSubmit}
          className="bg-[#2D2421] p-4 rounded-xl mb-6 space-y-3"
        >
          <input
            className="w-full p-2 rounded bg-[#40352F] text-white"
            placeholder="Bus Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            className="w-full p-2 rounded bg-[#40352F] text-white"
            placeholder="Bus Number"
            value={form.number}
            onChange={(e) => setForm({ ...form, number: e.target.value })}
            required
          />
          <input
            className="w-full p-2 rounded bg-[#40352F] text-white"
            placeholder="Speed Limit (km/h)"
            type="number"
            value={form.speedLimit}
            onChange={(e) => setForm({ ...form, speedLimit: e.target.value })}
            required
          />
          <select
            className="w-full p-2 rounded bg-[#40352F] text-white"
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
          <select
            className="w-full p-2 rounded bg-[#40352F] text-white"
            value={form.driver}
            onChange={(e) => setForm({ ...form, driver: e.target.value })}
            required
          >
            <option value="">Select Driver</option>
            {drivers.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name}
              </option>
            ))}
          </select>
          <select
            className="w-full p-2 rounded bg-[#40352F] text-white"
            value={form.conductor}
            onChange={(e) => setForm({ ...form, conductor: e.target.value })}
            required
          >
            <option value="">Select Conductor</option>
            {conductors.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-[#A9745F] hover:bg-[#8C5F4E] px-4 py-2 rounded text-white"
            >
              {editingBusId ? "Update Bus" : "Add Bus"}
            </button>
            {editingBusId && (
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded text-white"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          {buses.map((bus) => (
            <div
              key={bus._id}
              className="bg-[#2D2421] p-4 rounded-lg space-y-1"
            >
              <p className="text-lg font-medium">
                {bus.name} ({bus.number})
              </p>
              <p className="text-sm text-[#F3E5D7]">
                🗺️ Route: {bus.route?.name || "N/A"}
              </p>
              <p className="text-sm text-[#F3E5D7]">
                👨‍✈️ Driver: {bus.driver?.name || "N/A"}
              </p>
              <p className="text-sm text-[#F3E5D7]">
                🧑‍✈️ Conductor: {bus.conductor?.name || "N/A"}
              </p>
              <p className="text-sm text-[#F3E5D7]">
                🚨 Speed Limit: {bus.speedLimit || "N/A"} km/h
              </p>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => handleEdit(bus)}
                  className="bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded text-white text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(bus._id)}
                  className="bg-red-600 hover:bg-red-500 px-3 py-1 rounded text-white text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
