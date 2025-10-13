// "use client";

// import { useState, useEffect, useRef } from "react";
// import { Html5Qrcode } from "html5-qrcode";
// import api from "@/lib/api";

// export default function ScanTicketPage() {
//   const [scanResult, setScanResult] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [devices, setDevices] = useState([]);
//   const [selectedDeviceId, setSelectedDeviceId] = useState(null);
//   const [scanActive, setScanActive] = useState(false);
//   const [showDetails, setShowDetails] = useState(false); // Show ticket details

//   const scannerRef = useRef(null);

//   // Detect cameras
//   useEffect(() => {
//     Html5Qrcode.getCameras()
//       .then((cams) => {
//         setDevices(cams);
//         if (cams.length > 0) setSelectedDeviceId(cams[0].id);
//       })
//       .catch(() => setError("❌ No cameras found"));
//   }, []);

//   // Start scanning
//   const startScan = async () => {
//     if (!selectedDeviceId) return;
//     setError("");
//     setScanResult(null);

//     try {
//       scannerRef.current = new Html5Qrcode("reader", { verbose: true });

//       await scannerRef.current.start(
//         { deviceId: { exact: selectedDeviceId } },
//         {
//           fps: 10,
//           qrbox: { width: 250, height: 250 },
//           disableFlip: false,
//         },
//         async (decodedText) => {
//           console.log("QR decoded:", decodedText);
//           await handleScan(decodedText);
//         },
//         (err) => {
//           console.log("Decode error:", err);
//         }
//       );

//       setScanActive(true);
//     } catch (err) {
//       console.error("Start scan error:", err);
//       setError("❌ Failed to start camera. Make sure permission is granted.");
//     }
//   };

//   // Stop scanning
//   const stopScan = async () => {
//     if (scannerRef.current) {
//       try {
//         await scannerRef.current.stop();
//         await scannerRef.current.clear();
//       } catch {}
//       scannerRef.current = null;
//     }
//     setScanActive(false);
//   };

//   // Handle scanned QR
//   const handleScan = async (data) => {
//     if (!data) return;
//     setLoading(true);
//     setError("");

//     try {
//       // Stop scanner immediately after scanning
//       await stopScan();

//       const res = await api.post(`/tickets/scan/${data}`);
//       setScanResult(res.data.ticket);

//       // Show ticket details
//       setShowDetails(true);
//     } catch (err) {
//       console.error("API error:", err);
//       setScanResult(null);
//       setError(err.response?.data?.message || "❌ Failed to verify ticket");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Handle QR image upload
//   const handleFileUpload = async (e) => {
//     const file = e.target.files[0];
//     if (!file) return;

//     await stopScan();

//     const html5QrCode = new Html5Qrcode("reader");
//     try {
//       const result = await html5QrCode.scanFile(file, true);
//       await handleScan(result);
//     } catch (err) {
//       console.error("File scan error:", err);
//       setError(
//         "❌ Could not read QR from image. Make sure it's clear and upright."
//       );
//     }
//   };

//   return (
//     <div className="p-6 flex flex-col items-center min-h-screen bg-gradient-to-b from-[#F3E5D7]/20 to-[#3E2F2C]/20">
//       <h1 className="text-3xl font-extrabold mb-6 text-[#F3E5D7] drop-shadow-lg">
//         🎟️ Scan Student Ticket
//       </h1>

//       <div className="bg-[#3E2F2C] p-6 rounded-2xl shadow-lg w-full max-w-md flex flex-col items-center border-2 border-[#F3E5D7]/30">
//         {/* Camera selector */}
//         {devices.length > 1 && (
//           <select
//             value={selectedDeviceId || ""}
//             onChange={(e) => setSelectedDeviceId(e.target.value)}
//             className="mb-4 p-3 rounded-xl bg-white text-black w-full shadow-inner hover:scale-105 transition-transform duration-200"
//           >
//             {devices.map((device, i) => (
//               <option key={device.id} value={device.id}>
//                 {device.label || `Camera ${i + 1}`}
//               </option>
//             ))}
//           </select>
//         )}

//         {/* Start / Stop buttons */}
//         <div className="flex gap-4 mb-4">
//           {!scanActive ? (
//             <button
//               onClick={startScan}
//               className="px-5 py-3 bg-green-600 text-white rounded-2xl shadow-md hover:bg-green-500 hover:scale-105 transition-all duration-200"
//             >
//               ▶ Start Scan
//             </button>
//           ) : (
//             <button
//               onClick={stopScan}
//               className="px-5 py-3 bg-red-600 text-white rounded-2xl shadow-md hover:bg-red-500 hover:scale-105 transition-all duration-200"
//             >
//               ⏹ Stop Scan
//             </button>
//           )}
//         </div>

//         {/* Upload QR image */}
//         <div className="mb-4 w-full">
//           <label className="block w-full text-center text-sm text-[#F3E5D7] cursor-pointer bg-[#5A423C] p-2 rounded-xl shadow-inner hover:bg-[#6b5248] transition-colors">
//             📁 Upload QR Image
//             <input
//               type="file"
//               accept="image/*"
//               onChange={handleFileUpload}
//               className="hidden"
//             />
//           </label>
//         </div>

//         {/* Camera preview */}
//         <div className="relative w-full h-80 rounded-xl overflow-hidden bg-black border-4 border-[#F3E5D7]/20 shadow-inner">
//           <div id="reader" className="w-full h-full"></div>
//           {scanActive && (
//             <div className="absolute top-0 left-0 w-full h-1 bg-red-500 animate-scan-line"></div>
//           )}
//         </div>

//         {loading && (
//           <p className="text-yellow-400 mt-4 font-medium animate-pulse">
//             🔄 Verifying ticket...
//           </p>
//         )}

//         {scanResult && showDetails && (
//           <div className="mt-4 p-4 bg-green-600 rounded-2xl w-full text-white text-center shadow-lg animate-fadeIn">
//             ✅ Ticket Valid! <br />
//             <span className="font-semibold">Passenger:</span>{" "}
//             {scanResult.student?.name} <br />
//             <span className="font-semibold">Bus:</span> {scanResult.bus?.name} (
//             {scanResult.bus?.number}) <br />
//             <span className="font-semibold">Seats:</span> {scanResult.seats}{" "}
//             <br />
//             <span className="font-semibold">Route:</span>{" "}
//             {scanResult.startPoint} → {scanResult.stopPoint} <br />
//             <span className="font-semibold">Fare:</span> ₹{scanResult.fare}{" "}
//             <br />
//             <span className="font-semibold">Status:</span> {scanResult.status}{" "}
//             <br />
//             <span className="font-semibold">Used:</span>{" "}
//             {scanResult.used ? "Yes" : "No"} <br />
//             <button
//               onClick={() => {
//                 setShowDetails(false);
//                 setScanResult(null);
//               }}
//               className="mt-2 px-4 py-2 bg-yellow-500 rounded-xl hover:bg-yellow-400 transition-colors"
//             >
//               Close
//             </button>
//           </div>
//         )}

//         {error && (
//           <div className="mt-4 p-4 bg-red-600 rounded-2xl w-full text-white text-center shadow-md animate-shake">
//             {error}
//           </div>
//         )}
//       </div>

//       {/* Tailwind custom animation */}
//       <style jsx>{`
//         @keyframes scanLine {
//           0% {
//             top: 0;
//           }
//           50% {
//             top: calc(100% - 4px);
//           }
//           100% {
//             top: 0;
//           }
//         }
//         .animate-scan-line {
//           animation: scanLine 2s linear infinite;
//         }
//       `}</style>
//     </div>
//   );
// }

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

  // Get conductor's bus info on component mount - FIXED ENDPOINT
  useEffect(() => {
    const fetchConductorBus = async () => {
      try {
        // ✅ CORRECT ENDPOINT: Use buses/conductor/my-bus OR conductors/me/assigned-bus
        const res = await api.get("/buses/conductor/my-bus");
        // OR: const res = await api.get("/conductors/me/assigned-bus");
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

  // Handle scanned QR - IMPROVED ERROR HANDLING
  const handleScan = async (data) => {
    if (!data) return;
    setLoading(true);
    setError("");

    try {
      await stopScan();

      // ✅ Make sure the ticket ID is valid and endpoint exists
      const res = await api.post(`/tickets/scan/${data}`);
      setScanResult(res.data.ticket);
      setShowDetails(true);
    } catch (err) {
      console.error("API error:", err);
      setScanResult(null);

      // Better error messages
      if (err.response?.status === 404) {
        setError("❌ Ticket not found");
      } else if (err.response?.status === 403) {
        setError("❌ This ticket is for a different bus!");
      } else if (err.response?.status === 400) {
        setError("❌ " + (err.response.data.message || "Ticket already used"));
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
      <h1 className="text-3xl font-extrabold mb-6 text-[#F3E5D7] drop-shadow-lg">
        Scan Student Ticket
      </h1>

      {/* Conductor Bus Info */}
      {conductorBus && (
        <div className="mb-4 p-4 bg-blue-600 rounded-2xl text-white text-center">
          <p className="font-semibold">Your Bus: {conductorBus.name}</p>
          <p>Bus Number: {conductorBus.number}</p>
          <p className="text-sm opacity-90">
            You can only validate tickets for this bus
          </p>
        </div>
      )}

      {!conductorBus && !error && (
        <div className="mb-4 p-4 bg-yellow-600 rounded-2xl text-white text-center">
          <p>Loading bus information...</p>
        </div>
      )}

      <div className="bg-[#3E2F2C] p-6 rounded-2xl shadow-lg w-full max-w-md flex flex-col items-center border-2 border-[#F3E5D7]/30">
        {/* Camera selector */}
        {devices.length > 1 && (
          <select
            value={selectedDeviceId || ""}
            onChange={(e) => setSelectedDeviceId(e.target.value)}
            className="mb-4 p-3 rounded-xl bg-white text-black w-full shadow-inner hover:scale-105 transition-transform duration-200"
          >
            {devices.map((device, i) => (
              <option key={device.id} value={device.id}>
                {device.label || `Camera ${i + 1}`}
              </option>
            ))}
          </select>
        )}

        <div className="flex gap-4 mb-4">
          {!scanActive ? (
            <button
              onClick={startScan}
              disabled={!conductorBus}
              className="px-5 py-3 bg-green-600 text-white rounded-2xl shadow-md hover:bg-green-500 hover:scale-105 transition-all duration-200 disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
              {conductorBus ? "▶ Start Scan" : "⏳ Loading..."}
            </button>
          ) : (
            <button
              onClick={stopScan}
              className="px-5 py-3 bg-red-600 text-white rounded-2xl shadow-md hover:bg-red-500 hover:scale-105 transition-all duration-200"
            >
              ⏹ Stop Scan
            </button>
          )}
        </div>

        <div className="mb-4 w-full">
          <label className="block w-full text-center text-sm text-[#F3E5D7] cursor-pointer bg-[#5A423C] p-2 rounded-xl shadow-inner hover:bg-[#6b5248] transition-colors">
            📁 Upload QR Image
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        <div className="relative w-full h-80 rounded-xl overflow-hidden bg-black border-4 border-[#F3E5D7]/20 shadow-inner">
          <div id="reader" className="w-full h-full"></div>
          {scanActive && (
            <div className="absolute top-0 left-0 w-full h-1 bg-red-500 animate-scan-line"></div>
          )}
        </div>

        {loading && (
          <p className="text-yellow-400 mt-4 font-medium animate-pulse">
            🔄 Verifying ticket...
          </p>
        )}

        {scanResult && showDetails && (
          <div className="mt-4 p-4 bg-green-600 rounded-2xl w-full text-white text-center shadow-lg animate-fadeIn">
            Ticket Valid! <br />
            <span className="font-semibold">Passenger:</span>{" "}
            {scanResult.student?.name} <br />
            <span className="font-semibold">Bus:</span> {scanResult.bus?.name} (
            {scanResult.bus?.number}) <br />
            <span className="font-semibold">Seats:</span> {scanResult.seats}{" "}
            <br />
            <span className="font-semibold">Route:</span>{" "}
            {scanResult.startPoint} → {scanResult.stopPoint} <br />
            <span className="font-semibold">Fare:</span> ₹{scanResult.fare}{" "}
            <br />
            <span className="font-semibold">Status:</span> {scanResult.status}{" "}
            <br />
            <span className="font-semibold">Used:</span>{" "}
            {scanResult.used ? "Yes" : "No"} <br />
            <button
              onClick={() => {
                setShowDetails(false);
                setScanResult(null);
              }}
              className="mt-2 px-4 py-2 bg-yellow-500 rounded-xl hover:bg-yellow-400 transition-colors"
            >
              Close
            </button>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-600 rounded-2xl w-full text-white text-center shadow-md animate-shake">
            {error}
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
