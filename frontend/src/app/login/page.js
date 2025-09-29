"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import CustomToast from "@/components/CustomToast";

export default function LoginPage() {
  const { login, user } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // 👇 Track if the user just logged in
  const justLoggedIn = useRef(false);

  useEffect(() => {
    // Only show "Already logged in!" on page load / refresh
    if (user && !justLoggedIn.current) {
      toast.custom(() => (
        <CustomToast type="info" message="Already logged in!" />
      ));

      const redirectPath =
        user.role === "admin"
          ? "/admin/dashboard"
          : user.role === "driver"
          ? "/driver"
          : user.role === "conductor"
          ? "/conductor"
          : "/student";

      router.push(redirectPath);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      justLoggedIn.current = true; // ✅ mark before login
      await login(email, password);
      toast.custom(() => (
        <CustomToast type="success" message="Login successful!" />
      ));
    } catch (err) {
      justLoggedIn.current = false; // reset if login fails
      const msg = err?.message || "Login failed";
      toast.custom(() => <CustomToast type="error" message={msg} />);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4B2E2E] to-[#1E1A18] flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="bg-[#2F1F1C] text-white p-8 rounded-2xl shadow-xl w-full max-w-md"
      >
        <h2 className="text-3xl font-semibold text-center mb-6 text-[#F3E5D7]">
          🚌 Login
        </h2>

        <label className="block mb-2 text-[#F3E5D7]">Email</label>
        <input
          type="email"
          className="w-full p-3 mb-4 rounded-lg bg-[#3E2B28] text-white focus:outline-none"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label className="block mb-2 text-[#F3E5D7]">Password</label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            className="w-full p-3 pr-10 rounded-lg bg-[#3E2B28] text-white focus:outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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

        <button
          type="submit"
          className="w-full bg-[#A47551] hover:bg-[#8E6042] text-white py-3 mt-6 rounded-lg transition-all"
        >
          Login
        </button>

        <p className="mt-4 text-center text-sm text-[#CDB7AE]">
          Don’t have an account?{" "}
          <Link href="/register" className="text-[#F3E5D7] hover:underline">
            Register here
          </Link>
        </p>
      </form>
    </div>
  );
}
