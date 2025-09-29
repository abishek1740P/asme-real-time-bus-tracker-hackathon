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
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1f1b16] text-[#F3E5D7] flex">
      <ConductorSidebar />
      <main className="flex-1 p-4 md:p-8 md:ml-64 mt-16 md:mt-0">
        {children}
      </main>
    </div>
  );
}
