"use client";

import { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import api from "@/lib/api";
import {
  QrCode,
  Camera,
  Play,
  Square,
  Upload,
  Bus,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RotateCcw,
  IndianRupee,
  MapPin,
  Users,
} from "lucide-react";

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

  useEffect(() => {
    const fetchConductorBus = async () => {
      try {
        const res = await api.get("/buses/conductor/my-bus");
        setConductorBus(res.data.bus);
      } catch (err) {
        if (err.response?.status === 404) {
          setError("No bus assigned to you. Please contact your administrator.");
        } else {
          setError("Failed to load conductor bus profile");
        }
      }
    };

    fetchConductorBus();
  }, []);

  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((cams) => {
        setDevices(cams || []);
        if (cams && cams.length > 0) setSelectedDeviceId(cams[0].id);
      })
      .catch(() => setError("No camera hardware detected"));
  }, []);

  const startScan = async () => {
    if (!selectedDeviceId) return;
    setError("");
    setScanResult(null);

    try {
      scannerRef.current = new Html5Qrcode("reader", { verbose: false });

      await scannerRef.current.start(
        { deviceId: { exact: selectedDeviceId } },
        {
          fps: 10,
          qrbox: { width: 240, height: 240 },
          disableFlip: false,
        },
        async (decodedText) => {
          await handleScan(decodedText);
        },
        () => {}
      );

      setScanActive(true);
    } catch (err) {
      setError("Failed to access camera. Please allow camera permissions.");
    }
  };

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
      setScanResult(null);
      if (err.response?.status === 404) {
        setError("Invalid boarding ticket (Not found)");
      } else if (err.response?.status === 403) {
        setError("Unauthorized ticket — belongs to another bus!");
      } else if (err.response?.status === 400) {
        setError(err.response.data.message || "Ticket already redeemed");
      } else {
        setError(err.response?.data?.message || "Failed to verify ticket");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    await stopScan();

    const html5QrCode = new Html5Qrcode("reader");
    try {
      const result = await html5QrCode.scanFile(file, true);
      await handleScan(result);
    } catch (err) {
      setError("Could not read QR code from image. Please ensure good lighting.");
    }
  };

  return (
    <div className="max-w-xl mx-auto flex flex-col items-center">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center justify-center gap-2">
          <QrCode className="text-[#c9a97f]" />
          Passenger QR Scanner
        </h1>
        <p className="text-xs text-[#8c7464] mt-1">
          Aim camera at passenger ticket barcode or upload a digital pass snapshot.
        </p>
      </div>

      {/* Conductor Bus Info Banner */}
      {conductorBus && (
        <div className="mb-5 p-4 bg-[#1e130c]/90 border border-[#3d2618] rounded-2xl w-full shadow-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-[#c9a97f]">
              <Bus size={20} />
            </div>
            <div>
              <p className="font-bold text-sm text-white">{conductorBus.name}</p>
              <p className="text-xs text-[#8c7464]">
                Vehicle No: <span className="text-[#c9a97f] font-mono">{conductorBus.number}</span>
              </p>
            </div>
          </div>
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
            Active Bus
          </span>
        </div>
      )}

      {/* Main Scanner Container */}
      <div className="bg-[#1e130c]/80 border border-[#2e1c10] p-5 md:p-6 rounded-3xl shadow-2xl w-full flex flex-col items-center">
        {/* Camera Selector */}
        {devices.length > 1 && (
          <div className="w-full mb-4">
            <label className="text-xs text-[#8c7464] block mb-1">Select Camera</label>
            <select
              value={selectedDeviceId || ""}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              className="p-2.5 rounded-xl bg-[#140c08] text-white text-xs w-full border border-[#3d2618] focus:outline-none focus:border-[#c9a97f]"
            >
              {devices.map((device, i) => (
                <option key={device.id} value={device.id}>
                  {device.label || `Camera ${i + 1}`}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex gap-2.5 mb-4 w-full">
          {!scanActive ? (
            <button
              onClick={startScan}
              disabled={!conductorBus}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-[#b3885c] to-[#c9a97f] hover:from-[#c9a97f] hover:to-[#dfc39e] text-[#140c08] rounded-xl shadow-lg font-bold text-xs md:text-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              <Play size={16} />
              <span>{conductorBus ? "Start Camera Scanner" : "Loading Vehicle..."}</span>
            </button>
          ) : (
            <button
              onClick={stopScan}
              className="flex-1 py-3 px-4 bg-red-600/90 hover:bg-red-600 text-white rounded-xl shadow-lg font-bold text-xs md:text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Square size={16} />
              <span>Stop Scanner</span>
            </button>
          )}
        </div>

        {/* Upload QR File */}
        <div className="mb-4 w-full">
          <label className="block w-full text-center cursor-pointer bg-[#140c08] p-3 rounded-xl border border-dashed border-[#3d2618] hover:border-[#c9a97f] transition-all group">
            <div className="flex items-center justify-center gap-2 text-xs text-[#a89078] group-hover:text-white">
              <Upload size={14} className="text-[#c9a97f]" />
              <span>Upload Ticket Image / QR Screenshot</span>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* Camera Viewfinder */}
        <div className="relative w-full h-72 md:h-80 rounded-2xl overflow-hidden bg-[#0d0705] border-2 border-[#3d2618] shadow-inner">
          <div id="reader" className="w-full h-full" />
          {scanActive && (
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#c9a97f] to-transparent animate-scan-line shadow-[0_0_12px_#c9a97f]" />
          )}
          {!scanActive && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 gap-2 p-4 text-center">
              <Camera size={32} className="text-[#5a4232]" />
              <p className="text-white text-xs font-semibold">Camera is Idle</p>
              <p className="text-[11px] text-[#8c7464]">
                Tap "Start Camera Scanner" above to initiate verification
              </p>
            </div>
          )}
        </div>

        {/* Verification Loading State */}
        {loading && (
          <div className="mt-4 p-3 bg-[#140c08] rounded-xl w-full text-center border border-[#3d2618] flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-[#c9a97f] border-t-transparent rounded-full animate-spin" />
            <p className="text-[#c9a97f] font-semibold text-xs">Authenticating Ticket with Database...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mt-4 p-3.5 bg-red-950/40 border border-red-800/50 rounded-2xl w-full text-center shadow-lg">
            <div className="flex items-center justify-center gap-2 text-red-300 text-xs font-semibold">
              <AlertTriangle size={15} />
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Verification Success Details */}
        {scanResult && showDetails && (
          <div className="mt-5 w-full bg-gradient-to-b from-[#1e130c] to-[#140c08] border border-emerald-500/40 rounded-3xl p-5 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-center gap-2 mb-4 pb-3 border-b border-[#2e1c10]">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <CheckCircle size={18} />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-white text-sm">Boarding Pass Validated</h3>
                <p className="text-[10px] text-emerald-400">Authorized for immediate boarding</p>
              </div>
            </div>

            <div className="space-y-3 text-xs mb-5">
              <div className="p-3 rounded-xl bg-[#140c08] border border-[#2e1c10] text-center">
                <span className="text-[#8c7464] block text-[11px] mb-0.5">Passenger</span>
                <span className="text-white font-bold text-sm">
                  {scanResult.student?.name || "Passenger"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl bg-[#140c08] border border-[#2e1c10] text-center">
                  <span className="text-[#8c7464] block text-[10px]">Bus</span>
                  <span className="text-white font-semibold">{scanResult.bus?.number}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#140c08] border border-[#2e1c10] text-center">
                  <span className="text-[#8c7464] block text-[10px]">Fare</span>
                  <span className="text-amber-300 font-bold">₹{scanResult.fare}</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-[#140c08] border border-[#2e1c10] flex items-center justify-between text-[11px]">
                <span className="text-white font-medium">{scanResult.startPoint}</span>
                <span className="text-[#8c7464]">→</span>
                <span className="text-white font-medium">{scanResult.stopPoint}</span>
              </div>
            </div>

            <button
              onClick={() => {
                setShowDetails(false);
                setScanResult(null);
              }}
              className="w-full py-3 rounded-xl bg-[#c9a97f] hover:bg-[#b3885c] text-[#140c08] font-bold text-xs transition-colors shadow-md"
            >
              Scan Next Ticket
            </button>
          </div>
        )}
      </div>

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
      `}</style>
    </div>
  );
}
