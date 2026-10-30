"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Eye, EyeOff, User, Mail, Lock, ArrowRight, Bus } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import CustomToast from "@/components/CustomToast";
import { useForm } from "react-hook-form";

export default function RegisterPage() {
  const { register: authRegister } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm({
    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmit = async (data) => {
    try {
      await authRegister({ ...data, role: "student" });
      toast.custom(() => (
        <CustomToast type="success" message="Account created successfully! Welcome aboard 🎉" />
      ));
    } catch (err) {
      const msg = err?.message || "Registration failed. Please try again.";
      toast.custom(() => <CustomToast type="error" message={msg} />);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2a1a10] via-[#1a100a] to-[#140c08] flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-[#c9a97f]/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-amber-900/10 rounded-full blur-[80px]" />
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="relative z-10 bg-[#1e140d]/90 backdrop-blur-xl text-white p-8 rounded-3xl shadow-2xl w-full max-w-md border border-[#3d2618]/60"
      >
        {/* Header */}
        <div className="text-center mb-8 space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-[#c9a97f]/10 border border-[#c9a97f]/20 mb-2">
            <Bus size={28} className="text-[#c9a97f]" />
          </div>
          <h1 className="text-3xl font-extrabold text-[#F3E5D7]">Create Account</h1>
          <p className="text-sm text-[#8c7464]">
            Join Urban Trail as a student passenger
          </p>
        </div>

        {/* Name Field */}
        <div className="mb-4">
          <label htmlFor="name" className="block text-xs font-semibold text-[#c9a97f] mb-1.5 uppercase tracking-wider">
            Full Name
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b5040]">
              <User size={16} />
            </div>
            <input
              id="name"
              type="text"
              autoComplete="name"
              className={`w-full pl-10 pr-4 py-3 rounded-2xl bg-[#140c08] text-white placeholder-[#5c4030] focus:outline-none focus:ring-2 focus:ring-[#c9a97f]/50 border transition-all text-sm ${
                errors.name ? "border-red-500/60" : "border-[#3d2618] focus:border-[#c9a97f]/50"
              }`}
              placeholder="Your full name"
              {...register("name", {
                required: "Name is required",
                minLength: { value: 2, message: "Name must be at least 2 characters" },
              })}
            />
          </div>
          {errors.name && (
            <p className="text-red-400 text-xs mt-1.5">{errors.name.message}</p>
          )}
        </div>

        {/* Email Field */}
        <div className="mb-4">
          <label htmlFor="email" className="block text-xs font-semibold text-[#c9a97f] mb-1.5 uppercase tracking-wider">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b5040]">
              <Mail size={16} />
            </div>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className={`w-full pl-10 pr-4 py-3 rounded-2xl bg-[#140c08] text-white placeholder-[#5c4030] focus:outline-none focus:ring-2 focus:ring-[#c9a97f]/50 border transition-all text-sm ${
                errors.email ? "border-red-500/60" : "border-[#3d2618] focus:border-[#c9a97f]/50"
              }`}
              placeholder="student@srit.org"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address",
                },
              })}
            />
          </div>
          {errors.email && (
            <p className="text-red-400 text-xs mt-1.5">{errors.email.message}</p>
          )}
        </div>

        {/* Password Field */}
        <div className="mb-6">
          <label htmlFor="password" className="block text-xs font-semibold text-[#c9a97f] mb-1.5 uppercase tracking-wider">
            Password
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b5040]">
              <Lock size={16} />
            </div>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              className={`w-full pl-10 pr-11 py-3 rounded-2xl bg-[#140c08] text-white placeholder-[#5c4030] focus:outline-none focus:ring-2 focus:ring-[#c9a97f]/50 border transition-all text-sm ${
                errors.password ? "border-red-500/60" : "border-[#3d2618] focus:border-[#c9a97f]/50"
              }`}
              placeholder="Min. 6 characters"
              {...register("password", {
                required: "Password is required",
                minLength: { value: 6, message: "Password must be at least 6 characters" },
              })}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7a6050] hover:text-[#c9a97f] transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && (
            <p className="text-red-400 text-xs mt-1.5">{errors.password.message}</p>
          )}
        </div>

        {/* Hidden role */}
        <input type="hidden" value="student" />

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#c9a97f] to-[#b3885c] hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed text-[#140c08] py-3.5 rounded-2xl transition-all duration-200 font-bold text-sm shadow-lg shadow-[#c9a97f]/20 active:scale-95"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-[#140c08]/40 border-t-[#140c08] rounded-full animate-spin" />
              Creating account...
            </>
          ) : (
            <>
              Create My Account
              <ArrowRight size={16} />
            </>
          )}
        </button>

        {/* Login Link */}
        <p className="mt-5 text-center text-xs text-[#8c7464]">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-[#c9a97f] hover:text-[#e8cfb5] font-semibold transition-colors"
          >
            Sign in here
          </Link>
        </p>
      </form>
    </div>
  );
}
