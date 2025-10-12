// src/app/layout.js
import "./globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "@/components/Navbar";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "react-hot-toast";
import Footer from "@/components/Footer";
import FirebaseServiceWorker from "@/components/FirebaseServiceWorker";
import Script from "next/script"; // <-- import Script

const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata = {
  title: "Commutex",
  description: "Track the bus in real-time",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/svg+xml" href="/bus-icon.svg" />
        <link rel="alternate icon" href="/bus-icon.png" />
        <link rel="apple-touch-icon" href="/bus-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="College Bus Tracker" />
        <meta name="theme-color" content="#1e120b" />
      </head>
      <body
        className={`
          ${geistSans.variable} ${geistMono.variable}
          bg-[#1e120b] text-white antialiased font-sans
          flex flex-col min-h-screen
        `}
      >
        {/* Razorpay Checkout Script */}
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="beforeInteractive"
        />

        <AuthProvider>
          <FirebaseServiceWorker />
          <Navbar />
          <main className="flex-1 flex flex-col">{children}</main>
          <Footer />
          <Toaster position="top-center" reverseOrder={false} />
        </AuthProvider>
      </body>
    </html>
  );
}
