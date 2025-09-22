"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import AdminSidebar from "@/components/AdminSidebar";
import toast from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";

export default function ConductorsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [conductors, setConductors] = useState([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

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

  // Fetch conductors for admin
  useEffect(() => {
    if (user && user.role === "admin") {
      fetchConductors();
    }
  }, [user]);

  const fetchConductors = async () => {
    try {
      const res = await api.get("/conductors");
      setConductors(res.data);
    } catch (err) {
      toast.error("Failed to load conductors");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        const { name, email, phone } = form;
        await api.put(`/conductors/${editingId}`, { name, email, phone });
        toast.success("Conductor updated");
      } else {
        await api.post("/conductors", form);
        toast.success("Conductor added");
      }
      resetForm();
      fetchConductors();
    } catch (err) {
      toast.error("Failed to submit form");
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this conductor?")) {
      try {
        await api.delete(`/conductors/${id}`);
        fetchConductors();
        toast.success("Conductor deleted");
      } catch (err) {
        toast.error("Delete failed");
      }
    }
  };

  const resetForm = () => {
    setForm({ name: "", email: "", password: "", phone: "" });
    setEditingId(null);
  };

  const handleEdit = (c) => {
    setEditingId(c._id);
    setForm({
      name: c.name,
      email: c.email,
      password: "",
      phone: c.phone,
    });
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
      <main className="p-4 md:p-8 md:ml-64">
        <h2 className="text-xl font-bold text-[#F3E5D7] mb-4">🧑‍✈️ Conductors</h2>

        <form
          onSubmit={handleSubmit}
          className="bg-[#2D2421] p-4 rounded-xl mb-6 space-y-3"
        >
          <input
            className="w-full p-2 rounded bg-[#40352F] text-white"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            className="w-full p-2 rounded bg-[#40352F] text-white"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          {!editingId && (
            <div className="relative">
              <input
                className="w-full p-2 pr-10 rounded bg-[#40352F] text-white"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#CDB7AE] hover:text-white"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          )}
          <input
            className="w-full p-2 rounded bg-[#40352F] text-white"
            placeholder="Phone Number"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            required
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-[#A9745F] hover:bg-[#8C5F4E] px-4 py-2 rounded text-white"
            >
              {editingId ? "Update Conductor" : "Add Conductor"}
            </button>
            {editingId && (
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
          {conductors.map((c) => (
            <div key={c._id} className="bg-[#2D2421] p-4 rounded-lg space-y-1">
              <p className="text-lg font-medium">{c.name}</p>
              <p className="text-sm text-[#F3E5D7]">📧 {c.email}</p>
              <p className="text-sm text-[#F3E5D7]">📞 {c.phone}</p>

              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => handleEdit(c)}
                  className="bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded text-white text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(c._id)}
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
