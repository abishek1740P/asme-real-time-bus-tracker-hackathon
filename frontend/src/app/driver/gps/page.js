// frontend/src/app/driver/gps/page.js
// "use client";

// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import api from "@/lib/api";
// import { getSocket } from "@/lib/socket";
// import { useAuth } from "@/context/AuthContext";
// import dynamic from "next/dynamic";
// import LoadingSpinner from "@/components/LoadingSpinner";
// import toast from "react-hot-toast";
// import { Bus } from "lucide-react";

// const MapWithNoSSR = dynamic(() => import("@/components/MapView"), {
//   ssr: false,
//   loading: () => <LoadingSpinner />,
// });

// // Constants
// const arrivalThreshold = 200; // meters
// const leaveThreshold = 300; // meters
// const speedMetersPerSecond = (100 * 1000) / 3600; // 100 km/h → m/s

// // Haversine Formula
// const haversineDistance = (p1, p2) => {
//   const toRad = (deg) => (deg * Math.PI) / 180;
//   const R = 6371000;
//   const dLat = toRad(p2.lat - p1.lat);
//   const dLng = toRad(p2.lng - p1.lng);
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos(toRad(p1.lat)) * Math.cos(toRad(p2.lat)) * Math.sin(dLng / 2) ** 2;
//   return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
// };

// export default function DriverGPSPage() {
//   const { user, loading } = useAuth();
//   const router = useRouter();

//   const [busId, setBusId] = useState(null);
//   const [coords, setCoords] = useState({ lat: null, lng: null });
//   const [checkpoints, setCheckpoints] = useState([]);
//   const [simulate, setSimulate] = useState(false);
//   const [tokenReady, setTokenReady] = useState(false);

//   useEffect(() => {
//     const token = localStorage.getItem("token");
//     if (!token) {
//       toast.error("Not logged in");
//       router.push("/login");
//     } else {
//       setTokenReady(true);
//     }
//   }, []);

//   useEffect(() => {
//     if (loading || !tokenReady) return;

//     if (!user) {
//       toast.error("Please log in to access GPS");
//       router.push("/login");
//       return;
//     }

//     if (user.role !== "driver") {
//       toast.error("Access denied: Drivers only");
//       router.push(`/${user.role}`);
//       return;
//     }

//     const fetchBusAndRoute = async () => {
//       try {
//         const token = localStorage.getItem("token");
//         const res = await api.get("/drivers/me/assigned-bus", {
//           headers: { Authorization: `Bearer ${token}` },
//         });

//         const bus = res.data;
//         setBusId(bus._id);

//         if (bus?.route?._id) {
//           const routeRes = await api.get(`/routes/${bus.route._id}`, {
//             headers: { Authorization: `Bearer ${token}` },
//           });

//           const sanitizedStops = routeRes.data.stops.map((stop) => ({
//             name: stop.name,
//             coordinates: {
//               lat: parseFloat(
//                 stop.coordinates?.lat?.$numberDouble || stop.coordinates?.lat
//               ),
//               lng: parseFloat(
//                 stop.coordinates?.lng?.$numberDouble || stop.coordinates?.lng
//               ),
//             },
//           }));

//           setCheckpoints(sanitizedStops);
//         }
//       } catch {
//         toast.error("Unable to fetch assigned bus/route");
//       }
//     };

//     fetchBusAndRoute();
//   }, [user, loading, tokenReady, router]);

//   useEffect(() => {
//     if (!busId || !user?._id) return;

//     const socket = getSocket();
//     let currentCheckpointIndex = -1;
//     let hasArrived = false;
//     let lastArrivedStop = null; // ✅ Add this line

//     const findNearestStop = (point) => {
//       let nearestStop = null;
//       let nearestIndex = -1;
//       let minDistance = Infinity;

//       checkpoints.forEach((stop, i) => {
//         const dist = haversineDistance(point, stop.coordinates);
//         if (dist < minDistance) {
//           minDistance = dist;
//           nearestStop = stop;
//           nearestIndex = i;
//         }
//       });

//       return { stop: nearestStop, index: nearestIndex, distance: minDistance };
//     };

//     const sendNotification = async (title, body) => {
//       try {
//         await api.post("/notifications/send", {
//           title,
//           body,
//           busId, // ✅ make sure this is present and correct
//         });
//       } catch (err) {
//         console.error("❌ Notification error", {
//           status: err?.response?.status,
//           message: err?.response?.data || err.message,
//           stack: err.stack,
//         });
//       }
//     };

//     if (simulate) {
//       const path = [
//         { lat: 10.941926, lng: 76.901515 }, // SRIT

//         // Between SRIT → Pachapalayam Pirivu
//         { lat: 10.951, lng: 76.90151 },
//         { lat: 10.96, lng: 76.901512 },
//         { lat: 10.967865, lng: 76.901513 }, // Pachapalayam Pirivu

//         // Pachapalayam Pirivu → Perur
//         { lat: 10.9705, lng: 76.908 },
//         { lat: 10.973, lng: 76.9115 },
//         { lat: 10.975635, lng: 76.915238 }, // Perur

//         // Perur → Selvapuram
//         { lat: 10.98, lng: 76.92 },
//         { lat: 10.985, lng: 76.928 },
//         { lat: 10.987584, lng: 76.934437 }, // Selvapuram

//         // Selvapuram → Town Hall
//         { lat: 10.99, lng: 76.94 },
//         { lat: 10.9915, lng: 76.948 },
//         { lat: 10.992788, lng: 76.953317 }, // Town Hall

//         // Town Hall → Gandhipuram
//         { lat: 11.0, lng: 76.96 },
//         { lat: 11.008, lng: 76.965 },
//         { lat: 11.013734, lng: 76.967581 }, // Gandhipuram Bus Stop

//         // Gandhipuram → Ganapathy
//         { lat: 11.025, lng: 76.972 },
//         { lat: 11.03, lng: 76.975 },
//         { lat: 11.034996, lng: 76.978275 }, // Ganapathy

//         // Ganapathy → Kovilpalayam
//         { lat: 11.05, lng: 76.985 },
//         { lat: 11.09, lng: 77.01 },
//         { lat: 11.12, lng: 77.025 },
//         { lat: 11.137203, lng: 77.035867 }, // Kovilpalayam

//       ];

//       let index = 0;

//       const moveToNextPoint = async () => {
//         if (index >= path.length) {
//           // Final check after delay
//           setTimeout(async () => {
//             if (lastArrivedStop && coords.lat && coords.lng) {
//               const finalDistance = haversineDistance(
//                 coords,
//                 lastArrivedStop.coordinates
//               );
//               if (finalDistance > leaveThreshold) {
//                 await api.post("/notifications/send", {
//                   title: "🚍 Bus Left",
//                   body: `Bus has departed from ${lastArrivedStop.name}`,
//                   busId, // ✅ FIXED — lowercase
//                 });
//                 toast.success("Departure notification sent");
//               }
//             }

//             toast.success("Simulation complete");
//           }, 4000); // 4s delay for realism

//           return;
//         }

//         const point = path[index];
//         const next = path[index + 1];
//         setCoords(point);
//         if (socket?.connected) socket.emit("busLocation", point);

//         const { stop, index: stopIndex, distance } = findNearestStop(point);

//         if (
//           distance <= arrivalThreshold &&
//           stopIndex !== currentCheckpointIndex
//         ) {
//           currentCheckpointIndex = stopIndex;
//           hasArrived = true;
//           lastArrivedStop = stop;
//           await sendNotification(
//             "📍 Bus Arrived",
//             `Bus has reached ${stop.name}`
//           );
//         }

//         if (hasArrived && distance > leaveThreshold) {
//           hasArrived = false;

//           if (lastArrivedStop) {
//             await api.post("/notifications/send", {
//               title: "📍 Bus Arrived",
//               body: `Bus has reached ${stop.name}`,
//               busId, // ✅ include busId here too
//             });
//           }

//           lastArrivedStop = null;
//         }

//         if (!next) return;
//         const delay =
//           (haversineDistance(point, next) / speedMetersPerSecond) * 10;
//         index++;
//         setTimeout(moveToNextPoint, delay);
//       };

//       moveToNextPoint();
//       return () => {
//         index = path.length;
//       }; // Cancel on unmount
//     } else {
//       if (!navigator.geolocation) {
//         toast.error("Geolocation not supported");
//         return;
//       }

//       const watchId = navigator.geolocation.watchPosition(
//         async (position) => {
//           const point = {
//             lat: position.coords.latitude,
//             lng: position.coords.longitude,
//           };
//           setCoords(point);
//           if (socket?.connected) socket.emit("busLocation", point);

//           const { stop, index: stopIndex, distance } = findNearestStop(point);

//           if (
//             distance <= arrivalThreshold &&
//             stopIndex !== currentCheckpointIndex
//           ) {
//             currentCheckpointIndex = stopIndex;
//             hasArrived = true;
//             await sendNotification(
//               "📍 Bus Arrived",
//               `Bus has reached ${stop.name}`
//             );
//           }

//           if (hasArrived && distance > leaveThreshold) {
//             hasArrived = false;
//             await sendNotification(
//               "🚍 Bus Left",
//               `Bus has departed from ${stop.name}`
//             );
//           }
//         },
//         (error) => toast.error(`GPS Error: ${error.message}`),
//         { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
//       );

//       return () => navigator.geolocation.clearWatch(watchId);
//     }
//   }, [busId, user, simulate, checkpoints]);

//   if (loading || !user || user.role !== "driver") {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-[#1A0E0E] text-white">
//         <p>Checking access...</p>
//       </div>
//     );
//   }

//   return (
//     <div className="bg-[#1A0E0E] text-[#F3E5D7] min-h-screen p-6 flex flex-col items-center">
//       <h1 className="text-2xl font-bold mb-2">
//         {simulate ? "🧪 Simulating GPS..." : "📡 Sending GPS..."}
//       </h1>
//       <p className="text-[#EBDACF] mb-4">
//         {simulate
//           ? "Simulated location is updating every 2s."
//           : "Your real location is updating live."}
//       </p>

//       {!simulate && (
//         <button
//           onClick={() => setSimulate(true)}
//           className="mb-6 bg-blue-700 hover:bg-blue-600 text-white px-4 py-2 rounded"
//         >
//           Start Simulation
//         </button>
//       )}

//       {coords.lat && coords.lng ? (
//         <>
//           <div className="bg-[#382b24] p-4 rounded-xl shadow-lg mb-6">
//             <p className="text-lg font-semibold">
//               Latitude:{" "}
//               <span className="text-green-400">{coords.lat.toFixed(6)}</span>
//             </p>
//             <p className="text-lg font-semibold">
//               Longitude:{" "}
//               <span className="text-green-400">{coords.lng.toFixed(6)}</span>
//             </p>
//           </div>

//           <div className="w-full max-w-3xl h-[400px] rounded-lg overflow-hidden border border-[#503838]">
//             <MapWithNoSSR
//               lat={coords.lat}
//               lng={coords.lng}
//               isConnected={true}
//               checkpoints={checkpoints}
//             />
//           </div>
//         </>
//       ) : (
//         <p className="text-[#EBDACF]">Waiting for GPS signal...</p>
//       )}
//     </div>
//   );
// }

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { useAuth } from "@/context/AuthContext";
import LoadingSpinner from "@/components/LoadingSpinner";

const MapWithNoSSR = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => <LoadingSpinner />,
});

// Constants
const arrivalThreshold = 200; // meters
const leaveThreshold = 300; // meters
const speedMetersPerSecond = (100 * 1000) / 3600; // 100 km/h in m/s

const haversineDistance = (p1, p2) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(p2.lat - p1.lat);
  const dLng = toRad(p2.lng - p1.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(p1.lat)) * Math.cos(toRad(p2.lat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export default function DriverGPSPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [busId, setBusId] = useState(null);
  const [coords, setCoords] = useState({ lat: null, lng: null });
  const [checkpoints, setCheckpoints] = useState([]);
  const [simulate, setSimulate] = useState(false);
  const [tokenReady, setTokenReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Not logged in");
      router.push("/login");
    } else {
      setTokenReady(true);
    }
  }, []);

  useEffect(() => {
    if (loading || !tokenReady) return;

    if (!user) {
      toast.error("Please log in to access GPS");
      router.push("/login");
      return;
    }

    if (user.role !== "driver") {
      toast.error("Access denied: Drivers only");
      router.push(`/${user.role}`);
      return;
    }

    const fetchBusAndRoute = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await api.get("/drivers/me/assigned-bus", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const bus = res.data;
        setBusId(bus._id);

        if (bus?.route?._id) {
          const routeRes = await api.get(`/routes/${bus.route._id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          const sanitizedStops = routeRes.data.stops.map((stop) => ({
            name: stop.name,
            coordinates: {
              lat: parseFloat(
                stop.coordinates?.lat?.$numberDouble || stop.coordinates?.lat
              ),
              lng: parseFloat(
                stop.coordinates?.lng?.$numberDouble || stop.coordinates?.lng
              ),
            },
          }));

          setCheckpoints(sanitizedStops);
        }
      } catch {
        toast.error("Unable to fetch assigned bus/route");
      }
    };

    fetchBusAndRoute();
  }, [user, loading, tokenReady, router]);

  useEffect(() => {
    if (!busId || !user?._id) return;

    const socket = getSocket();
    let currentCheckpointIndex = -1;
    let hasArrived = false;
    let lastArrivedStop = null;

    const findNearestStop = (point) => {
      let nearestStop = null;
      let nearestIndex = -1;
      let minDistance = Infinity;

      checkpoints.forEach((stop, i) => {
        const dist = haversineDistance(point, stop.coordinates);
        if (dist < minDistance) {
          minDistance = dist;
          nearestStop = stop;
          nearestIndex = i;
        }
      });

      return { stop: nearestStop, index: nearestIndex, distance: minDistance };
    };

    let notificationQueue = Promise.resolve(); // Queue for sequential sending

    const sendNotification = (title, body) => {
      // Append to queue
      notificationQueue = notificationQueue.then(() =>
        api
          .post("/notifications/send", { title, body, busId })
          .catch((err) => console.error("Notification error:", err))
      );
      return notificationQueue; // return the promise for await if needed
    };

    if (simulate) {
      const path = [
        { lat: 11.204751, lng: 76.894641 }, // Selvapuram
        // Selvapuram → Ukkadam
        { lat: 11.15, lng: 76.91 },
        { lat: 11.12, lng: 76.925 },
        { lat: 11.08, lng: 76.945 },
        { lat: 10.98876, lng: 76.959711 }, // Ukkadam
        // Ukkadam → Ukkadam Bypass
        { lat: 10.9885, lng: 76.961 },
        { lat: 10.988149, lng: 76.963971 }, // Ukkadam Bypass
        // Ukkadam Bypass → Sungam
        { lat: 10.991, lng: 76.97 },
        { lat: 10.994, lng: 76.976 },
        { lat: 10.997668, lng: 76.984999 }, // Sungam
        // Sungam → Singanallur
        { lat: 10.998, lng: 76.99 },
        { lat: 10.99923, lng: 77.02328 }, // Singanallur
        // Singanallur → Ondipudhur
        { lat: 11.0, lng: 77.035 },
        { lat: 11.002873, lng: 77.062279 }, // Ondipudhur
        // Ondipudhur → Sulur
        { lat: 11.01, lng: 77.08 },
        { lat: 11.02, lng: 77.105 },
        { lat: 11.025493, lng: 77.124774 }, // Sulur
        // Sulur → SRIT
        { lat: 11.018, lng: 77.14 },
        { lat: 11.01, lng: 77.155 },
        { lat: 10.99, lng: 77.175 },
        { lat: 10.97, lng: 77.18 },
        { lat: 10.95, lng: 77.17 },
        { lat: 10.941926, lng: 76.901515 }, // SRIT
      ];

      let index = 0;

      const moveToNextPoint = async () => {
        if (index >= path.length) {
          setTimeout(async () => {
            if (lastArrivedStop && coords.lat && coords.lng) {
              const finalDistance = haversineDistance(
                coords,
                lastArrivedStop.coordinates
              );
              if (finalDistance > leaveThreshold) {
                await sendNotification(
                  "🚍 Bus Left",
                  `Bus has departed from ${lastArrivedStop.name}`
                );
              }
            }

            toast.success("Simulation complete");
          }, 4000);
          return;
        }

        const point = path[index];
        const next = path[index + 1];
        setCoords(point);
        if (socket?.connected) socket.emit("busLocation", point);

        const { stop, index: stopIndex, distance } = findNearestStop(point);

        if (
          distance <= arrivalThreshold &&
          stopIndex !== currentCheckpointIndex
        ) {
          currentCheckpointIndex = stopIndex;
          hasArrived = true;
          lastArrivedStop = stop;
          await sendNotification(
            "📍 Bus Arrived",
            `Bus has reached ${stop.name}`
          );
        }

        if (hasArrived && distance > leaveThreshold) {
          hasArrived = false;
          if (lastArrivedStop) {
            await sendNotification(
              "🚍 Bus Left",
              `Bus has departed from ${lastArrivedStop.name}`
            );
          }
          lastArrivedStop = null;
        }

        if (!next) return;
        const delay =
          (haversineDistance(point, next) / speedMetersPerSecond) * 10;
        index++;
        setTimeout(moveToNextPoint, delay);
      };

      moveToNextPoint();
      return () => {
        index = path.length;
      };
    } else {
      if (!navigator.geolocation) {
        toast.error("Geolocation not supported");
        return;
      }

      const watchId = navigator.geolocation.watchPosition(
        async (position) => {
          const point = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCoords(point);
          if (socket?.connected) socket.emit("busLocation", point);

          const { stop, index: stopIndex, distance } = findNearestStop(point);

          if (
            distance <= arrivalThreshold &&
            stopIndex !== currentCheckpointIndex
          ) {
            currentCheckpointIndex = stopIndex;
            hasArrived = true;
            await sendNotification(
              "📍 Bus Arrived",
              `Bus has reached ${stop.name}`
            );
          }

          if (hasArrived && distance > leaveThreshold) {
            hasArrived = false;
            await sendNotification(
              "🚍 Bus Left",
              `Bus has departed from ${stop.name}`
            );
          }
        },
        (error) => toast.error(`GPS Error: ${error.message}`),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [busId, user, simulate, checkpoints]);

  if (loading || !user || user.role !== "driver") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1A0E0E] text-white">
        <p>Checking access...</p>
      </div>
    );
  }

  return (
    <div className="bg-[#1A0E0E] text-[#F3E5D7] min-h-screen p-6 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-2">
        {simulate ? "🧪 Simulating GPS..." : "📡 Sending GPS..."}
      </h1>
      <p className="text-[#EBDACF] mb-4">
        {simulate
          ? "Simulated location is updating."
          : "Your real location is updating live."}
      </p>

      {!simulate && (
        <button
          onClick={() => setSimulate(true)}
          className="mb-6 bg-blue-700 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Start Simulation
        </button>
      )}

      {coords.lat && coords.lng ? (
        <>
          <div className="bg-[#382b24] p-4 rounded-xl shadow-lg mb-6">
            <p className="text-lg font-semibold">
              Latitude:{" "}
              <span className="text-green-400">{coords.lat.toFixed(6)}</span>
            </p>
            <p className="text-lg font-semibold">
              Longitude:{" "}
              <span className="text-green-400">{coords.lng.toFixed(6)}</span>
            </p>
          </div>

          <div className="w-full max-w-3xl h-[400px] rounded-lg overflow-hidden border border-[#503838]">
            <MapWithNoSSR
              lat={coords.lat}
              lng={coords.lng}
              isConnected={true}
              checkpoints={checkpoints}
            />
          </div>
        </>
      ) : (
        <p className="text-[#EBDACF]">Waiting for GPS signal...</p>
      )}
    </div>
  );
}

// { lat: 11.204751, lng: 76.894641 }, // Selvapuram

// // Selvapuram → Ukkadam
// { lat: 11.15, lng: 76.91 },
// { lat: 11.12, lng: 76.925 },
// { lat: 11.08, lng: 76.945 },
// { lat: 10.98876, lng: 76.959711 }, // Ukkadam

// // Ukkadam → Ukkadam Bypass
// { lat: 10.9885, lng: 76.961 },
// { lat: 10.988149, lng: 76.963971 }, // Ukkadam Bypass

// // Ukkadam Bypass → Sungam
// { lat: 10.991, lng: 76.97 },
// { lat: 10.994, lng: 76.976 },
// { lat: 10.997668, lng: 76.984999 }, // Sungam

// // Sungam → Singanallur
// { lat: 10.998, lng: 76.99 },
// { lat: 10.99923, lng: 77.02328 }, // Singanallur

// // Singanallur → Ondipudhur
// { lat: 11.0, lng: 77.035 },
// { lat: 11.002873, lng: 77.062279 }, // Ondipudhur

// // Ondipudhur → Sulur
// { lat: 11.01, lng: 77.08 },
// { lat: 11.02, lng: 77.105 },
// { lat: 11.025493, lng: 77.124774 }, // Sulur

// // Sulur → SRIT
// { lat: 11.018, lng: 77.14 },
// { lat: 11.01, lng: 77.155 },
// { lat: 10.99, lng: 77.175 },
// { lat: 10.97, lng: 77.18 },
// { lat: 10.95, lng: 77.17 },
// { lat: 10.941926, lng: 76.901515 }, // SRIT
