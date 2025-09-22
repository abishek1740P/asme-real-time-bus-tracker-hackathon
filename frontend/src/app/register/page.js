"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "student", // locked to student
  });

  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await register(formData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4B2E2E] to-[#1E1A18] flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="bg-[#2F1F1C] text-white p-8 rounded-2xl shadow-xl w-full max-w-md"
      >
        <h2 className="text-3xl font-semibold text-center mb-6 text-[#F3E5D7]">
          📝 Register
        </h2>

        <label className="block mb-2 text-[#F3E5D7]">Name</label>
        <input
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="w-full p-3 mb-4 rounded-lg bg-[#3E2B28] text-white focus:outline-none"
        />

        <label className="block mb-2 text-[#F3E5D7]">Email</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full p-3 mb-4 rounded-lg bg-[#3E2B28] text-white focus:outline-none"
        />

        <label className="block mb-2 text-[#F3E5D7]">Password</label>
        <div className="relative mb-6">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full p-3 pr-10 rounded-lg bg-[#3E2B28] text-white focus:outline-none"
          />
          <div
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute inset-y-0 right-3 flex items-center cursor-pointer text-[#CDB7AE]"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </div>
        </div>

        {/* Hidden role input */}
        <input type="hidden" name="role" value="student" />

        <button
          type="submit"
          className="w-full bg-[#A47551] hover:bg-[#8E6042] text-white py-3 rounded-lg transition-all"
        >
          Register
        </button>

        <p className="text-sm text-center mt-4 text-[#CDB7AE]">
          Already have an account?{" "}
          <a href="/login" className="underline">
            Login
          </a>
        </p>
      </form>
    </div>
  );
}
