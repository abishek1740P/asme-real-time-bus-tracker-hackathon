"use client";

import ConductorSidebar from "@/components/ConductorSidebar";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import toast from "react-hot-toast";
import CustomToast from "@/components/CustomToast";

export default function ConductorLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        toast.custom(() => (
          <CustomToast type="error" message="Please login to continue" />
        ));
        // toast.error("Please login to continue");
        router.push("/login");
      } else if (user.role !== "conductor") {
        toast.custom(() => (
          <CustomToast type="error" message="Access denied: Conductors only" />
        ));
        //
        // toast.error("Access denied: Conductors only");
        router.push(`/${user.role}`);
      }
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== "conductor") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#140c08] text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#c9a97f] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#c9a97f] text-sm">Verifying access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1b1009] to-[#140c08] text-[#F3E5D7] flex">
      <ConductorSidebar />
      <main className="flex-1 p-4 md:p-8 md:ml-64">
        {children}
      </main>
    </div>
  );
}
