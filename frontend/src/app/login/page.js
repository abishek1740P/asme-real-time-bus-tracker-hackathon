"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import CustomToast from "@/components/CustomToast";
import { useForm } from "react-hook-form";

export default function LoginPage() {
  const { login, user } = useAuth();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const justLoggedIn = useRef(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Load saved credentials from localStorage
  useEffect(() => {
    const savedEmail = localStorage.getItem("savedEmail");
    if (savedEmail) {
      setValue("email", savedEmail);
    }
  }, [setValue]);

  useEffect(() => {
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
  }, [user, router]);

  const onSubmit = async (data) => {
    try {
      justLoggedIn.current = true;

      // Save email to localStorage for autofill
      if (data.email) {
        localStorage.setItem("savedEmail", data.email);
      }

      await login(data.email, data.password);
      toast.custom(() => (
        <CustomToast type="success" message="Login successful!" />
      ));
    } catch (err) {
      justLoggedIn.current = false;
      const msg = err?.message || "Login failed";
      toast.custom(() => <CustomToast type="error" message={msg} />);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4B2E2E] to-[#1E1A18] flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-[#2F1F1C] text-white p-8 rounded-2xl shadow-xl w-full max-w-md"
      >
        <h2 className="text-3xl font-semibold text-center mb-6 text-[#F3E5D7]">
          🚌 Login
        </h2>

        {/* Email Field */}
        <div className="mb-4">
          <label htmlFor="email" className="block mb-2 text-[#F3E5D7]">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className={`w-full p-3 rounded-lg bg-[#3E2B28] text-white focus:outline-none focus:ring-2 focus:ring-[#A47551] border ${
              errors.email ? "border-red-500" : "border-transparent"
            }`}
            placeholder="Enter your email"
            {...register("email", {
              required: "Email is required",
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Invalid email address",
              },
            })}
          />
          {errors.email && (
            <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>

        {/* Password Field */}
        <div className="mb-6">
          <label htmlFor="password" className="block mb-2 text-[#F3E5D7]">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              className={`w-full p-3 pr-10 rounded-lg bg-[#3E2B28] text-white focus:outline-none focus:ring-2 focus:ring-[#A47551] border ${
                errors.password ? "border-red-500" : "border-transparent"
              }`}
              placeholder="Enter your password"
              {...register("password", {
                required: "Password is required",
                minLength: {
                  value: 6,
                  message: "Password must be at least 6 characters",
                },
              })}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#CDB7AE] hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {errors.password && (
            <p className="text-red-400 text-sm mt-1">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Remember Me Checkbox */}
        {/* <div className="flex items-center mb-4">
          <input
            id="remember"
            type="checkbox"
            className="w-4 h-4 text-[#A47551] bg-[#3E2B28] border-[#5D4037] rounded focus:ring-[#A47551] focus:ring-2"
            onChange={(e) => {
              if (e.target.checked) {
                const email = watch("email");
                if (email) {
                  localStorage.setItem("savedEmail", email);
                }
              } else {
                localStorage.removeItem("savedEmail");
              }
            }}
          />
          <label htmlFor="remember" className="ml-2 text-sm text-[#CDB7AE]">
            Remember my email
          </label>
        </div> */}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[#A47551] hover:bg-[#8E6042] disabled:bg-[#5D4037] disabled:cursor-not-allowed text-white py-3 rounded-lg transition-all duration-200 font-medium"
        >
          {isSubmitting ? "Logging in..." : "Login"}
        </button>

        {/* Register Link */}
        <p className="mt-4 text-center text-sm text-[#CDB7AE]">
          Don't have an account?{" "}
          <Link
            href="/register"
            className="text-[#F3E5D7] hover:underline transition-colors"
          >
            Register here
          </Link>
        </p>
      </form>
    </div>
  );
}
