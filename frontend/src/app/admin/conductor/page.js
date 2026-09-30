"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import AdminSidebar from "@/components/AdminSidebar";
import toast from "react-hot-toast";
import {
  UserCheck,
  Plus,
  Edit2,
  Trash2,
  Search,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  X,
  AlertCircle,
} from "lucide-react";

export default function ConductorsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [conductors, setConductors] = useState([]);
  const [search, setSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
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
      fetchConductors();
    }
  }, [user]);

  const fetchConductors = async () => {
    try {
      const res = await api.get("/conductors");
      setConductors(res.data || []);
    } catch (err) {
      toast.error("Failed to load conductors");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        const { name, email, phone } = form;
        await api.put(`/conductors/${editingId}`, { name, email, phone });
        toast.success("Conductor updated successfully");
      } else {
        await api.post("/conductors", form);
        toast.success("Conductor registered successfully");
      }
      resetForm();
      fetchConductors();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save conductor");
    } finally {
      setSubmitting(false);
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
    setShowForm(false);
    setShowPassword(false);
  };

  const handleEdit = (c) => {
    setEditingId(c._id);
    setForm({
      name: c.name,
      email: c.email,
      password: "",
      phone: c.phone || "",
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading || !user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#140c08] text-white">
        <div className="w-10 h-10 border-4 border-[#c9a97f] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const filteredConductors = conductors.filter(
    (c) =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#140c08] text-[#F3E5D7]">
      <AdminSidebar />
      <main className="pt-20 md:pt-24 pb-16 px-4 md:px-8 md:ml-64 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
              <UserCheck className="text-[#c9a97f]" />
              Conductor Management
            </h1>
            <p className="text-xs md:text-sm text-[#8c7464] mt-0.5">
              Register ticket verification staff and manage conductor permissions.
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
            {showForm ? "Close Form" : "Register Conductor"}
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
                {editingId ? "Update Conductor Profile" : "Register New Conductor"}
              </h2>
              <span className="text-xs text-[#a89078]">
                {editingId ? "Leave password blank to retain current" : "All fields required"}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-[#c9a97f] mb-1.5">
                  Conductor Full Name
                </label>
                <input
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#140c08] border border-[#3d2618] text-white text-sm focus:outline-none focus:border-[#c9a97f] transition-colors"
                  placeholder="e.g. Anand Sharma"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#c9a97f] mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8c7464]" />
                  <input
                    type="email"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#140c08] border border-[#3d2618] text-white text-sm focus:outline-none focus:border-[#c9a97f] transition-colors"
                    placeholder="conductor@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              {!editingId && (
                <div>
                  <label className="block text-xs font-medium text-[#c9a97f] mb-1.5">
                    Account Password
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8c7464]" />
                    <input
                      type={showPassword ? "text" : "password"}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#140c08] border border-[#3d2618] text-white text-sm focus:outline-none focus:border-[#c9a97f] transition-colors"
                      placeholder="Minimum 6 characters"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8c7464] hover:text-[#c9a97f] transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-[#c9a97f] mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8c7464]" />
                  <input
                    type="tel"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#140c08] border border-[#3d2618] text-white text-sm focus:outline-none focus:border-[#c9a97f] transition-colors"
                    placeholder="e.g. +91 98765 43210"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl bg-[#c9a97f] hover:bg-[#b3885c] text-[#140c08] font-bold text-sm transition-colors disabled:opacity-50"
              >
                {submitting ? "Saving..." : editingId ? "Update Profile" : "Register Conductor"}
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
            placeholder="Search conductors by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#1e130c]/70 border border-[#2e1c10] text-sm text-[#F3E5D7] placeholder-[#8c7464] focus:outline-none focus:border-[#c9a97f] transition-colors"
          />
        </div>

        {/* Conductors Grid */}
        {filteredConductors.length === 0 ? (
          <div className="text-center py-16 px-4 bg-[#1e130c]/40 rounded-2xl border border-[#2e1c10]">
            <AlertCircle size={40} className="mx-auto text-[#8c7464] mb-3" />
            <p className="text-base text-[#F3E5D7] font-semibold">No conductors found</p>
            <p className="text-xs text-[#8c7464] mt-1">
              {search ? "No conductor matches your search query" : "Click 'Register Conductor' above to add one"}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {filteredConductors.map((conductor) => {
              const initials = conductor.name
                ? conductor.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)
                : "CD";

              return (
                <div
                  key={conductor._id}
                  className="bg-[#1e130c]/80 border border-[#2e1c10] hover:border-[#c9a97f]/40 p-5 rounded-2xl shadow-lg transition-all duration-200 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-900/60 to-purple-700/30 border border-purple-500/30 text-purple-300 font-bold flex items-center justify-center text-sm shadow-inner">
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-bold text-white truncate">{conductor.name}</h3>
                        <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                          Active Conductor
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs py-3 border-y border-[#2e1c10]/60">
                      <div className="flex items-center gap-2 text-[#a89078]">
                        <Mail size={13} className="text-[#8c7464] shrink-0" />
                        <span className="text-white truncate">{conductor.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[#a89078]">
                        <Phone size={13} className="text-[#8c7464] shrink-0" />
                        <span className="text-white">{conductor.phone || "Not provided"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4 pt-2">
                    <button
                      onClick={() => handleEdit(conductor)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#2a1a11] hover:bg-[#342217] border border-[#3d2618] text-[#c9a97f] hover:text-white text-xs font-medium transition-colors"
                    >
                      <Edit2 size={13} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(conductor._id)}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-red-950/30 hover:bg-red-900/50 border border-red-800/40 text-red-300 text-xs font-medium transition-colors"
                    >
                      <Trash2 size={13} />
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
