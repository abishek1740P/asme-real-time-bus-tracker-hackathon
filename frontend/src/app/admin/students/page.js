"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import AdminSidebar from "@/components/AdminSidebar";
import toast from "react-hot-toast";
import { Eye, EyeOff, Search } from "lucide-react";

export default function StudentsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [students, setStudents] = useState([]);
  const [buses, setBuses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [form, setForm] = useState({
    name: "",
    registerNo: "",
    email: "",
    password: "",
    phone: "",
    bus: "",
  });

  const [editingId, setEditingId] = useState(null);

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
    if (user?.role === "admin") {
      fetchStudents();
      fetchBuses();
    }
  }, [user]);

  const fetchStudents = async () => {
    try {
      const res = await api.get("/students");
      setStudents(res.data);
    } catch (err) {
      toast.error("Failed to load students");
    }
  };

  const fetchBuses = async () => {
    try {
      const res = await api.get("/buses");
      setBuses(res.data);
    } catch (err) {
      toast.error("Failed to load buses");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        const { name, registerNo, email, phone, bus } = form;
        await api.put(`/students/${editingId}`, {
          name,
          registerNo,
          email,
          phone,
          bus,
        });
        toast.success("Student updated");
      } else {
        await api.post("/students", form);
        toast.success("Student added");
      }
      resetForm();
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to submit form");
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this student?")) {
      try {
        await api.delete(`/students/${id}`);
        fetchStudents();
        toast.success("Student deleted");
      } catch (err) {
        toast.error("Delete failed");
      }
    }
  };

  const resetForm = () => {
    setForm({
      name: "",
      registerNo: "",
      email: "",
      password: "",
      phone: "",
      bus: "",
    });
    setEditingId(null);
  };

  const handleEdit = (s) => {
    setEditingId(s._id);
    setForm({
      name: s.name,
      registerNo: s.registerNo,
      email: s.email,
      password: "",
      phone: s.phone,
      bus: s.bus?._id || "",
    });
  };

  if (loading || !user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <p>Checking access...</p>
      </div>
    );
  }

  const filteredStudents = students.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#1f1b16] text-[#F3E5D7]">
      <AdminSidebar />
      <main className="p-4 md:p-8 md:ml-64">
        <h2 className="text-xl font-bold mb-4">Passengers</h2>

        {/* Student Form */}
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
            placeholder="Register Number"
            value={form.registerNo}
            onChange={(e) => setForm({ ...form, registerNo: e.target.value })}
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
                onClick={() => setShowPassword((prev) => !prev)}
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
          <select
            className="w-full p-2 rounded bg-[#40352F] text-white"
            value={form.bus}
            onChange={(e) => setForm({ ...form, bus: e.target.value })}
            required
          >
            <option value="">Select Bus</option>
            {buses.map((bus) => (
              <option key={bus._id} value={bus._id}>
                {bus.name} ({bus.number})
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-[#A9745F] hover:bg-[#8C5F4E] px-4 py-2 rounded text-white"
            >
              {editingId ? "Update Student" : "Add Student"}
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

        {/* 🔍 Search Input (moved below the form) */}
        <div className="mb-6 relative">
          <input
            type="text"
            placeholder="Search by name..."
            className="w-full p-2 pl-10 rounded bg-[#40352F] text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#CDB7AE]"
            size={18}
          />
        </div>

        {/* Student List */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          {filteredStudents.map((s) => (
            <div key={s._id} className="bg-[#2D2421] p-4 rounded-lg space-y-1">
              <p className="text-lg font-medium">{s.name}</p>
              <p className="text-sm">🆔 {s.registerNo}</p>
              <p className="text-sm">📧 {s.email}</p>
              <p className="text-sm">📞 {s.phone}</p>
              <p className="text-sm">
                🚌 {s.bus?.name || "Unassigned"} ({s.bus?.number || "N/A"})
              </p>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => handleEdit(s)}
                  className="bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded text-white text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(s._id)}
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
