"use client";

import { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import api from "@/lib/api";

export default function ScanTicketPage() {
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [scanActive, setScanActive] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [conductorBus, setConductorBus] = useState(null);

  const scannerRef = useRef(null);

  // Get conductor's bus info on component mount
  useEffect(() => {
    const fetchConductorBus = async () => {
      try {
        const res = await api.get("/buses/conductor/my-bus");
        setConductorBus(res.data.bus);
      } catch (err) {
        console.error("Failed to fetch conductor bus:", err);
        if (err.response?.status === 404) {
          setError("No bus assigned to you. Please contact admin.");
        } else {
          setError("Failed to load conductor information");
        }
      }
    };

    fetchConductorBus();
  }, []);

  // Detect cameras
  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((cams) => {
        setDevices(cams);
        if (cams.length > 0) setSelectedDeviceId(cams[0].id);
      })
      .catch(() => setError("❌ No cameras found"));
  }, []);

  // Start scanning
  const startScan = async () => {
    if (!selectedDeviceId) return;
    setError("");
    setScanResult(null);

    try {
      scannerRef.current = new Html5Qrcode("reader", { verbose: true });

      await scannerRef.current.start(
        { deviceId: { exact: selectedDeviceId } },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          disableFlip: false,
        },
        async (decodedText) => {
          console.log("QR decoded:", decodedText);
          await handleScan(decodedText);
        },
        (err) => {
          console.log("Decode error:", err);
        }
      );

      setScanActive(true);
    } catch (err) {
      console.error("Start scan error:", err);
      setError("❌ Failed to start camera. Make sure permission is granted.");
    }
  };

  // Stop scanning
  const stopScan = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch {}
      scannerRef.current = null;
    }
    setScanActive(false);
  };

  // Handle scanned QR
  const handleScan = async (data) => {
    if (!data) return;
    setLoading(true);
    setError("");

    try {
      await stopScan();

      const res = await api.post(`/tickets/scan/${data}`);
      setScanResult(res.data.ticket);
      setShowDetails(true);
    } catch (err) {
      console.error("API error:", err);
      setScanResult(null);

      if (err.response?.status === 404) {
        setError("❌ Ticket not found");
      } else if (err.response?.status === 403) {
        setError("This ticket is for a different bus!");
      } else if (err.response?.status === 400) {
        setError("" + (err.response.data.message || "Ticket already used"));
      } else {
        setError(err.response?.data?.message || "❌ Failed to verify ticket");
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle QR image upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    await stopScan();

    const html5QrCode = new Html5Qrcode("reader");
    try {
      const result = await html5QrCode.scanFile(file, true);
      await handleScan(result);
    } catch (err) {
      console.error("File scan error:", err);
      setError(
        "❌ Could not read QR from image. Make sure it's clear and upright."
      );
    }
  };

  return (
    <div className="p-6 flex flex-col items-center min-h-screen bg-gradient-to-b from-[#F3E5D7]/20 to-[#3E2F2C]/20">
      <h1 className="text-3xl font-extrabold mb-6 text-[#3E2F2C] drop-shadow-lg">
        🎫 Scan Student Ticket
      </h1>

      {/* Conductor Bus Info */}
      {conductorBus && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl text-white text-center shadow-lg border border-white/20 w-full max-w-md">
          <div className="flex items-center justify-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-xl">🚌</span>
            </div>
            <div>
              <p className="font-bold text-lg">{conductorBus.name}</p>
              <p className="text-sm opacity-90">
                Bus No: {conductorBus.number}
              </p>
            </div>
          </div>
          <p className="text-xs mt-2 opacity-80">
            You can only validate tickets for this bus
          </p>
        </div>
      )}

      {!conductorBus && !error && (
        <div className="mb-6 p-4 bg-yellow-500 rounded-2xl text-white text-center shadow-lg w-full max-w-md">
          <p className="flex items-center justify-center space-x-2">
            <span className="animate-spin">⏳</span>
            <span>Loading bus information...</span>
          </p>
        </div>
      )}

      <div className="bg-white p-6 rounded-3xl shadow-2xl w-full max-w-md flex flex-col items-center border border-gray-200">
        {/* Camera selector */}
        {devices.length > 1 && (
          <select
            value={selectedDeviceId || ""}
            onChange={(e) => setSelectedDeviceId(e.target.value)}
            className="mb-4 p-3 rounded-xl bg-gray-50 text-gray-800 w-full shadow-inner border border-gray-200 hover:border-blue-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
          >
            {devices.map((device, i) => (
              <option key={device.id} value={device.id}>
                {device.label || `Camera ${i + 1}`}
              </option>
            ))}
          </select>
        )}

        {/* Control Buttons */}
        <div className="flex gap-3 mb-4 w-full">
          {!scanActive ? (
            <button
              onClick={startScan}
              disabled={!conductorBus}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl shadow-lg hover:from-green-600 hover:to-emerald-700 hover:scale-105 transition-all duration-200 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed disabled:scale-100 font-semibold flex items-center justify-center space-x-2"
            >
              <span>▶</span>
              <span>{conductorBus ? "Start Scan" : "Loading..."}</span>
            </button>
          ) : (
            <button
              onClick={stopScan}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl shadow-lg hover:from-red-600 hover:to-pink-700 hover:scale-105 transition-all duration-200 font-semibold flex items-center justify-center space-x-2"
            >
              <span>⏹</span>
              <span>Stop Scan</span>
            </button>
          )}
        </div>

        {/* Upload QR Image */}
        <div className="mb-4 w-full">
          <label className="block w-full text-center text-gray-700 cursor-pointer bg-gradient-to-r from-purple-50 to-blue-50 p-3 rounded-xl shadow-inner border-2 border-dashed border-purple-200 hover:border-purple-400 hover:bg-purple-50 transition-all duration-200 group">
            <div className="flex items-center justify-center space-x-2">
              <span className="text-lg group-hover:scale-110 transition-transform">
                📁
              </span>
              <span className="font-medium">Upload QR Image</span>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* Camera Preview */}
        <div className="relative w-full h-80 rounded-2xl overflow-hidden bg-gray-900 border-4 border-white shadow-2xl">
          <div id="reader" className="w-full h-full"></div>
          {scanActive && (
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent animate-scan-line shadow-lg"></div>
          )}
          {!scanActive && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <p className="text-white text-lg font-semibold">
                Camera Inactive
              </p>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="mt-4 p-4 bg-blue-50 rounded-2xl w-full text-center border border-blue-200">
            <div className="flex items-center justify-center space-x-3">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-blue-700 font-medium">Verifying ticket...</p>
            </div>
          </div>
        )}

        {/* Ticket Details - Cute & Sleek Design */}
        {scanResult && showDetails && (
          <div className="mt-4 w-full">
            <div className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-3xl shadow-2xl border-2 border-white/30 overflow-hidden animate-fadeIn">
              {/* Header */}
              <div className="bg-white/20 p-4 text-center border-b border-white/20">
                <div className="flex items-center justify-center space-x-3">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-2xl">✅</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white drop-shadow-md">
                      Valid Ticket
                    </h3>
                    <p className="text-white/80 text-sm">
                      Successfully verified
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                {/* Passenger Info */}
                <div className="text-center mb-6">
                  <p className="text-white/80 text-sm mb-1">Passenger</p>
                  <p className="text-white font-bold text-xl">
                    {scanResult.student?.name}
                  </p>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-white/10 rounded-xl p-3 text-center backdrop-blur-sm">
                    <p className="text-white/70 text-xs mb-1">Bus</p>
                    <p className="text-white font-semibold">
                      {scanResult.bus?.number}
                    </p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3 text-center backdrop-blur-sm">
                    <p className="text-white/70 text-xs mb-1">Seats</p>
                    <p className="text-white font-semibold">
                      {scanResult.seats}
                    </p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3 text-center backdrop-blur-sm">
                    <p className="text-white/70 text-xs mb-1">Fare</p>
                    <p className="text-white font-semibold">
                      ₹{scanResult.fare}
                    </p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3 text-center backdrop-blur-sm">
                    <p className="text-white/70 text-xs mb-1">Status</p>
                    <p
                      className={`font-semibold text-sm ${
                        scanResult.used ? "text-red-200" : "text-green-200"
                      }`}
                    >
                      {scanResult.used ? "Used" : "Active"}
                    </p>
                  </div>
                </div>

                {/* Route */}
                <div className="bg-white/10 rounded-xl p-4 mb-6 backdrop-blur-sm">
                  <p className="text-white/70 text-xs text-center mb-3">
                    Route
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="text-center flex-1">
                      <p className="text-white font-bold text-sm">
                        {scanResult.startPoint}
                      </p>
                      <p className="text-white/60 text-xs">From</p>
                    </div>
                    <div className="mx-2">
                      <span className="text-white/60 text-xl">→</span>
                    </div>
                    <div className="text-center flex-1">
                      <p className="text-white font-bold text-sm">
                        {scanResult.stopPoint}
                      </p>
                      <p className="text-white/60 text-xs">To</p>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => {
                    setShowDetails(false);
                    setScanResult(null);
                  }}
                  className="w-full bg-white text-emerald-600 font-bold py-4 rounded-xl hover:bg-gray-100 active:scale-95 transition-all duration-200 shadow-lg hover:shadow-xl border-0"
                >
                  Scan Next Ticket
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mt-4 p-4 bg-gradient-to-r from-red-500 to-pink-600 rounded-2xl w-full text-white text-center shadow-lg border border-white/20 animate-shake">
            <div className="flex items-center justify-center space-x-2">
              <span className="text-lg">❌</span>
              <p className="font-medium">{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes scanLine {
          0% {
            top: 0;
          }
          50% {
            top: calc(100% - 4px);
          }
          100% {
            top: 0;
          }
        }
        .animate-scan-line {
          animation: scanLine 2s linear infinite;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-5px);
          }
          75% {
            transform: translateX(5px);
          }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}
