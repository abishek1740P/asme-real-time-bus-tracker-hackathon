"use client";

import { motion } from "framer-motion";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

export default function CustomToast({ type = "info", message }) {
  const icons = {
    success: <CheckCircle className="text-green-500 w-6 h-6" />,
    error: <XCircle className="text-red-500 w-6 h-6" />,
    info: <AlertCircle className="text-blue-400 w-6 h-6" />,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="flex items-center gap-3 bg-[#2D2421]/90 backdrop-blur-md border border-[#CDB7AE] text-[#F3E5D7] px-4 py-3 rounded-xl shadow-lg"
    >
      {icons[type]}
      <p className="font-medium">{message}</p>
    </motion.div>
  );
}
