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
  MapPin,
  Users,
  ShieldCheck,
  SwitchCamera,
  Navigation,
  Clock,
  Sparkles,
  AlertCircle,
} from "lucide-react";

export default function ScanTicketPage() {
  const [scanResult, setScanResult] = useState(null);
  const [scanStatus, setScanStatus] = useState("valid"); // "valid" | "already_used" | "wrong_bus"
  const [statusMessage, setStatusMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [scanActive, setScanActive] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [conductorBus, setConductorBus] = useState(null);
  const [validatedAt, setValidatedAt] = useState(null);

  const scannerRef = useRef(null);

  // Play audio chime on successful scan
  const playSuccessChime = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {}
  };

  // Play error buzz on failed scan
  const playErrorBuzz = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {}
  };

  // Trigger haptic vibration on mobile
  const triggerHaptic = (pattern = [100, 50, 100]) => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch {}
    }
  };

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
        if (cams && cams.length > 0) {
          // On mobile phones, prefer the back / rear / environment camera
          const backCam = cams.find((c) =>
            /back|rear|environment|facing\s*back/i.test(c.label)
          );
          setSelectedDeviceId(backCam ? backCam.id : cams[cams.length - 1].id);
        }
      })
      .catch(() => setError("No camera hardware detected"));

    return () => {
      stopScan();
    };
  }, []);

  const startScan = async (devId) => {
    const targetDevId = devId || selectedDeviceId;
    if (!targetDevId) return;
    setError("");
    setScanResult(null);
    setShowDetails(false);

    try {
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
          await scannerRef.current.clear();
        } catch {}
      }

      scannerRef.current = new Html5Qrcode("reader", { verbose: false });

      await scannerRef.current.start(
        { deviceId: { exact: targetDevId } },
        {
          fps: 15,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minDim = Math.min(viewfinderWidth, viewfinderHeight);
            return {
              width: Math.floor(minDim * 0.75),
              height: Math.floor(minDim * 0.75),
            };
          },
          disableFlip: false,
        },
        async (decodedText) => {
          await handleScan(decodedText);
        },
        () => {}
      );

      setScanActive(true);
    } catch (err) {
      setError("Failed to access camera. Please allow camera permissions in browser.");
      setScanActive(false);
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

  const switchCamera = async () => {
    if (devices.length < 2) return;
    const currentIndex = devices.findIndex((d) => d.id === selectedDeviceId);
    const nextDevice = devices[(currentIndex + 1) % devices.length];
    setSelectedDeviceId(nextDevice.id);

    if (scanActive) {
      await stopScan();
      setTimeout(() => {
        startScan(nextDevice.id);
      }, 300);
    }
  };

  const handleScan = async (data) => {
    if (!data) return;
    setLoading(true);
    setError("");

    try {
      await stopScan();
      const res = await api.post(`/tickets/scan/${data}`);
      setScanResult(res.data.ticket);
      setScanStatus("valid");
      setStatusMessage("Ticket validated successfully for boarding!");
      setValidatedAt(new Date());
      setShowDetails(true);
      playSuccessChime();
      triggerHaptic([100, 50, 100]);
    } catch (err) {
      playErrorBuzz();
      triggerHaptic([200, 100, 200]);

      const resData = err.response?.data;

      // When ticket is already used, show full details with clear Warning
      if (resData?.alreadyUsed && resData?.ticket) {
        setScanResult(resData.ticket);
        setScanStatus("already_used");
        setStatusMessage(resData.message || "This ticket was already redeemed previously!");
        setValidatedAt(new Date(resData.ticket.updatedAt || Date.now()));
        setShowDetails(true);
        setError("⚠️ Ticket already redeemed previously!");
        return;
      }

      // When ticket is for a different bus, show details with Wrong Bus warning
      if (resData?.wrongBus && resData?.ticket) {
        setScanResult(resData.ticket);
        setScanStatus("wrong_bus");
        setStatusMessage(resData.message || "Unauthorized: Ticket belongs to another bus!");
        setValidatedAt(new Date());
        setShowDetails(true);
        setError(resData.message || "Ticket booked for a different bus!");
        return;
      }

      setScanResult(null);
      if (err.response?.status === 404) {
        setError("Invalid boarding ticket (Not found in database)");
      } else if (err.response?.status === 403) {
        setError("Unauthorized: This ticket is booked for a DIFFERENT bus!");
      } else if (err.response?.status === 400) {
        setError(err.response.data.message || "Ticket already redeemed!");
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
      setError("Could not read QR code from image. Please ensure ticket image is clear.");
    }
  };

  return (
    <div className="max-w-xl mx-auto flex flex-col items-center w-full px-1">
      {/* Header */}
      <div className="text-center mb-4 sm:mb-6 w-full">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#c9a97f]/10 border border-[#c9a97f]/30 text-[#c9a97f] text-[11px] font-semibold uppercase tracking-wider mb-2">
          <Sparkles size={13} />
          Boarding Pass Validator
        </div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white flex items-center justify-center gap-2">
          <QrCode className="text-[#c9a97f]" size={24} />
          Passenger QR Scanner
        </h1>
        <p className="text-xs text-[#8c7464] mt-1">
          Scan student boarding passes to verify ride authorization in real time.
        </p>
      </div>

      {/* Assigned Bus Info Banner */}
      {conductorBus && (
        <div className="mb-4 p-3.5 sm:p-4 bg-[#1e130c]/90 border border-[#3d2618] rounded-2xl w-full shadow-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-[#c9a97f] shrink-0">
              <Bus size={20} />
            </div>
            <div className="overflow-hidden">
              <p className="font-bold text-sm text-white truncate">{conductorBus.name}</p>
              <p className="text-[11px] text-[#8c7464]">
                Plate: <span className="text-[#c9a97f] font-mono font-semibold">{conductorBus.number}</span>
              </p>
            </div>
          </div>
          <span className="text-[10px] sm:text-[11px] px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 font-semibold shrink-0">
            Active Bus
          </span>
        </div>
      )}

      {/* Main Scanner Container */}
      <div className="bg-[#1e130c]/85 border border-[#2e1c10] p-4 sm:p-6 rounded-3xl shadow-2xl w-full flex flex-col items-center">
        {/* Camera Selector & Switcher */}
        {devices.length > 1 && (
          <div className="w-full mb-3 flex items-center gap-2">
            <div className="flex-1">
              <select
                value={selectedDeviceId || ""}
                onChange={(e) => {
                  setSelectedDeviceId(e.target.value);
                  if (scanActive) {
                    stopScan().then(() => {
                      setTimeout(() => startScan(e.target.value), 200);
                    });
                  }
                }}
                className="p-2.5 rounded-xl bg-[#140c08] text-white text-xs w-full border border-[#3d2618] focus:outline-none focus:border-[#c9a97f]"
              >
                {devices.map((device, i) => (
                  <option key={device.id} value={device.id}>
                    {device.label || `Camera ${i + 1}`}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={switchCamera}
              title="Flip camera"
              className="p-2.5 rounded-xl bg-[#140c08] border border-[#3d2618] hover:border-[#c9a97f] text-[#c9a97f] hover:text-white transition-all flex items-center justify-center"
              aria-label="Switch Camera"
            >
              <SwitchCamera size={18} />
            </button>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex gap-2.5 mb-3.5 w-full">
          {!scanActive ? (
            <button
              onClick={() => startScan()}
              disabled={!conductorBus}
              className="flex-1 py-3.5 px-4 bg-gradient-to-r from-[#b3885c] via-[#c9a97f] to-[#e4ceb0] hover:brightness-110 text-[#140c08] rounded-2xl shadow-lg shadow-amber-950/40 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              <Play size={16} />
              <span>{conductorBus ? "Start Camera Scanner" : "Loading Vehicle..."}</span>
            </button>
          ) : (
            <button
              onClick={stopScan}
              className="flex-1 py-3.5 px-4 bg-red-600/90 hover:bg-red-600 text-white rounded-2xl shadow-lg font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Square size={16} />
              <span>Stop Scanner</span>
            </button>
          )}
        </div>

        {/* Upload QR File fallback */}
        <div className="mb-3.5 w-full">
          <label className="block w-full text-center cursor-pointer bg-[#140c08] p-2.5 sm:p-3 rounded-2xl border border-dashed border-[#3d2618] hover:border-[#c9a97f] transition-all group">
            <div className="flex items-center justify-center gap-2 text-xs text-[#a89078] group-hover:text-white">
              <Upload size={14} className="text-[#c9a97f]" />
              <span>Upload Ticket Snapshot / QR Image</span>
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
        <div className="relative w-full aspect-square max-h-80 rounded-2xl overflow-hidden bg-[#0d0705] border-2 border-[#3d2618] shadow-inner flex items-center justify-center">
          <div id="reader" className="w-full h-full" />

          {scanActive && (
            <>
              {/* Animated laser scanner line */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#c9a97f] to-transparent animate-scan-line shadow-[0_0_12px_#c9a97f] pointer-events-none" />
              {/* Corner targeting guides */}
              <div className="absolute inset-4 pointer-events-none border-2 border-[#c9a97f]/30 rounded-xl" />
            </>
          )}

          {!scanActive && !showDetails && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 gap-2 p-4 text-center">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-[#a89078]">
                <Camera size={30} />
              </div>
              <p className="text-white text-xs font-semibold">Camera is Idle</p>
              <p className="text-[11px] text-[#8c7464]">
                Tap "Start Camera Scanner" to scan passenger passes
              </p>
            </div>
          )}
        </div>

        {/* Verification Loading State */}
        {loading && (
          <div className="mt-4 p-3.5 bg-[#140c08] rounded-2xl w-full text-center border border-[#3d2618] flex items-center justify-center gap-2.5">
            <div className="w-4 h-4 border-2 border-[#c9a97f] border-t-transparent rounded-full animate-spin" />
            <p className="text-[#c9a97f] font-semibold text-xs">Authenticating Ticket with Database...</p>
          </div>
        )}

        {/* Error Notification when no ticket details can be shown */}
        {error && !showDetails && (
          <div className="mt-4 p-3.5 bg-red-950/50 border border-red-800/60 rounded-2xl w-full text-center shadow-lg">
            <div className="flex items-center justify-center gap-2 text-red-300 text-xs font-semibold">
              <AlertTriangle size={16} className="shrink-0" />
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Complete Ride & Verification Details (Shown for Valid, Already Used, and Wrong Bus) */}
        {scanResult && showDetails && (
          <div
            className={`mt-5 w-full rounded-3xl p-4 sm:p-6 shadow-2xl animate-fadeIn space-y-4 border-2 ${
              scanStatus === "already_used"
                ? "bg-gradient-to-b from-[#26160b] via-[#1a0f08] to-[#140a05] border-amber-500/70"
                : scanStatus === "wrong_bus"
                ? "bg-gradient-to-b from-[#290d0b] via-[#1a0a08] to-[#140504] border-red-500/70"
                : "bg-gradient-to-b from-[#22150c] to-[#150d08] border-emerald-500/60"
            }`}
          >
            {/* Header: Validated / Warning Status */}
            <div className="flex items-center justify-between pb-3.5 border-b border-[#3d2618]">
              <div className="flex items-center gap-3">
                {scanStatus === "already_used" ? (
                  <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shadow-lg shadow-amber-950/40 shrink-0">
                    <AlertTriangle size={22} className="animate-pulse" />
                  </div>
                ) : scanStatus === "wrong_bus" ? (
                  <div className="w-11 h-11 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/40 flex items-center justify-center shadow-lg shadow-red-950/40 shrink-0">
                    <XCircle size={22} />
                  </div>
                ) : (
                  <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shadow-lg shadow-emerald-950/40 shrink-0">
                    <CheckCircle size={22} className="animate-pulse" />
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2">
                    <h3
                      className={`font-extrabold text-base ${
                        scanStatus === "already_used"
                          ? "text-amber-300"
                          : scanStatus === "wrong_bus"
                          ? "text-red-300"
                          : "text-white"
                      }`}
                    >
                      {scanStatus === "already_used"
                        ? "Ticket Already Used"
                        : scanStatus === "wrong_bus"
                        ? "Wrong Bus Ticket"
                        : "Boarding Authorized"}
                    </h3>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                        scanStatus === "already_used"
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                          : scanStatus === "wrong_bus"
                          ? "bg-red-500/20 text-red-300 border-red-500/40"
                          : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                      }`}
                    >
                      {scanStatus === "already_used"
                        ? "ALREADY REDEEMED"
                        : scanStatus === "wrong_bus"
                        ? "WRONG BUS"
                        : "VALID PASS"}
                    </span>
                  </div>
                  <p
                    className={`text-[11px] font-medium ${
                      scanStatus === "already_used"
                        ? "text-amber-400/90"
                        : scanStatus === "wrong_bus"
                        ? "text-red-400/90"
                        : "text-emerald-400/90"
                    }`}
                  >
                    {scanStatus === "already_used"
                      ? "This ticket has already been used for a ride"
                      : scanStatus === "wrong_bus"
                      ? "Booked for a different bus vehicle"
                      : "Passenger authorized for immediate boarding"}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-[#8c7464] block">Ticket ID</span>
                <span className="text-xs font-mono font-bold text-[#c9a97f]">
                  #{scanResult._id?.slice(-6).toUpperCase()}
                </span>
              </div>
            </div>

            {/* Alert Banner for Already Used Ticket */}
            {scanStatus === "already_used" && (
              <div className="p-3 rounded-2xl bg-amber-950/60 border border-amber-600/40 flex items-start gap-2.5 text-xs text-amber-200">
                <AlertCircle size={17} className="text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-300">Duplicate Scan Notice</p>
                  <p className="text-[11px] text-amber-200/80 mt-0.5">
                    This ticket has already been redeemed and marked as boarded. Please check with the passenger if they are reusing the QR code.
                  </p>
                </div>
              </div>
            )}

            {/* Alert Banner for Wrong Bus */}
            {scanStatus === "wrong_bus" && (
              <div className="p-3 rounded-2xl bg-red-950/60 border border-red-600/40 flex items-start gap-2.5 text-xs text-red-200">
                <XCircle size={17} className="text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-red-300">Invalid Vehicle</p>
                  <p className="text-[11px] text-red-200/80 mt-0.5">
                    This pass was booked for <strong className="text-white">Bus {scanResult.bus?.number || "another bus"}</strong>. The passenger must board their assigned bus.
                  </p>
                </div>
              </div>
            )}

            {/* Passenger Info */}
            <div className="p-3.5 rounded-2xl bg-[#140c08]/80 border border-[#3d2618] flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 rounded-xl bg-[#c9a97f]/15 border border-[#c9a97f]/30 flex items-center justify-center text-[#c9a97f] font-bold text-sm shrink-0">
                  {(scanResult.student?.name || "P")[0].toUpperCase()}
                </div>
                <div className="overflow-hidden">
                  <span className="text-[10px] text-[#8c7464] uppercase font-semibold tracking-wider block">Passenger</span>
                  <p className="text-sm font-bold text-white truncate">
                    {scanResult.student?.name || "Registered Passenger"}
                  </p>
                  <p className="text-[11px] text-[#a89078] truncate">
                    {scanResult.student?.email || "Student Account"}
                  </p>
                </div>
              </div>

              <div className="text-right bg-[#1e130c] px-3 py-1.5 rounded-xl border border-[#3d2618] shrink-0">
                <span className="text-[10px] text-[#8c7464] block">Seats</span>
                <span className="text-sm font-bold text-amber-300 flex items-center gap-1 justify-end">
                  <Users size={12} />
                  {scanResult.seats || 1}
                </span>
              </div>
            </div>

            {/* Complete Ride & Route Details */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#1c120a] to-[#120a06] border border-[#3d2618] space-y-3">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-[#2e1c10]">
                <div className="flex items-center gap-1.5 text-[#c9a97f] font-semibold">
                  <Navigation size={13} />
                  <span className="truncate max-w-[170px] sm:max-w-none">
                    {scanResult.bus?.route?.name || "Transit Route"}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-[#a89078]">
                  Bus {scanResult.bus?.number || conductorBus?.number}
                </span>
              </div>

              {/* Journey Checkpoints Visualization */}
              <div className="relative pl-6 space-y-3.5 py-1">
                {/* Connecting track line */}
                <div className="absolute left-2.5 top-3 bottom-3 w-0.5 border-l-2 border-dashed border-[#c9a97f]/40" />

                {/* Boarding Stop */}
                <div className="relative flex items-start justify-between">
                  <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider block">
                      Boarding Point (Pickup)
                    </span>
                    <p className="text-sm font-bold text-white">{scanResult.startPoint}</p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                    PICKUP
                  </span>
                </div>

                {/* Destination Stop */}
                <div className="relative flex items-start justify-between">
                  <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-red-500/20 border-2 border-red-400 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-red-400 tracking-wider block">
                      Drop Point (Destination)
                    </span>
                    <p className="text-sm font-bold text-white">{scanResult.stopPoint}</p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-red-500/10 text-red-400 border border-red-500/20 font-medium">
                    DROP
                  </span>
                </div>
              </div>
            </div>

            {/* Ride Fare & Payment Metadata */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-[#140c08] border border-[#2e1c10] flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-300 flex items-center justify-center font-bold text-sm shrink-0">
                  ₹
                </div>
                <div className="overflow-hidden">
                  <span className="text-[10px] text-[#8c7464] block">Fare Paid</span>
                  <span className="text-sm font-extrabold text-amber-300">
                    ₹{scanResult.fare}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#140c08] border border-[#2e1c10] flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    scanStatus === "already_used"
                      ? "bg-amber-500/10 text-amber-400"
                      : "bg-emerald-500/10 text-emerald-400"
                  }`}
                >
                  <ShieldCheck size={16} />
                </div>
                <div className="overflow-hidden">
                  <span className="text-[10px] text-[#8c7464] block">Payment Mode</span>
                  <span className="text-xs font-semibold text-[#F3E5D7] truncate block">
                    {scanResult.paymentId ? "Prepaid Online" : "Prepaid"}
                  </span>
                </div>
              </div>
            </div>

            {/* Scan Timestamp & Status */}
            <div className="flex items-center justify-between text-[11px] text-[#8c7464] px-1 pt-1">
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {scanStatus === "already_used"
                  ? `Previously Scanned: ${new Date(scanResult.updatedAt || validatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                  : `Validated: ${validatedAt ? validatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : "Just now"}`}
              </span>
              <span
                className={`font-semibold ${
                  scanStatus === "already_used"
                    ? "text-amber-400"
                    : scanStatus === "wrong_bus"
                    ? "text-red-400"
                    : "text-emerald-400"
                }`}
              >
                {scanStatus === "already_used"
                  ? "Already Redeemed"
                  : scanStatus === "wrong_bus"
                  ? "Wrong Vehicle"
                  : "Boarded"}
              </span>
            </div>

            {/* Scan Next Passenger Button */}
            <button
              onClick={() => {
                setShowDetails(false);
                setScanResult(null);
                setScanStatus("valid");
                setError("");
                startScan();
              }}
              className="w-full py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-[#b3885c] via-[#c9a97f] to-[#e4ceb0] hover:brightness-110 text-[#140c08] font-extrabold text-sm sm:text-base transition-all active:scale-95 shadow-xl shadow-amber-950/50 flex items-center justify-center gap-2 mt-2"
            >
              <RotateCcw size={18} />
              <span>Scan Next Passenger</span>
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
