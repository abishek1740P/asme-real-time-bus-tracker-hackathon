// "use client";

// import { useEffect } from "react";
// import { useMap } from "react-leaflet";
// import L from "leaflet";

// export default function ORSRouting({ waypoints = [] }) {
//   const map = useMap();

//   useEffect(() => {
//     if (waypoints.length < 2) return;

//     const fetchRoute = async () => {
//       const coords = waypoints.map(([lat, lng]) => [lng, lat]); // ORS expects [lng, lat]

//       const body = {
//         coordinates: coords,
//         format: "geojson",
//       };

//       try {
//         const res = await fetch("https://api.openrouteservice.org/v2/directions/driving-car/geojson", {
//           method: "POST",
//           headers: {
//             "Authorization": process.env.NEXT_PUBLIC_ORS_API_KEY,
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify(body),
//         });

//         const data = await res.json();
//         const routeCoords = data.features[0].geometry.coordinates.map(
//           ([lng, lat]) => [lat, lng]
//         );

//         const routeLine = L.polyline(routeCoords, {
//           color: "blue",
//           weight: 5,
//         }).addTo(map);

//         map.fitBounds(routeLine.getBounds());

//         return () => {
//           map.removeLayer(routeLine);
//         };
//       } catch (err) {
//         console.error("Routing Error:", err);
//       }
//     };

//     fetchRoute();
//   }, [map, JSON.stringify(waypoints)]);

//   return null;
// }




"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

export default function OSRMRouting({ waypoints = [] }) {
  const map = useMap();

  useEffect(() => {
    if (waypoints.length < 2) return;

    const fetchRoute = async () => {
      // OSRM expects "lng,lat" pairs joined by ";"
      const coords = waypoints.map(([lat, lng]) => `${lng},${lat}`).join(";");

      try {
        const res = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`
        );

        const data = await res.json();

        if (!data.routes || data.routes.length === 0) return;

        const routeCoords = data.routes[0].geometry.coordinates.map(
          ([lng, lat]) => [lat, lng]
        );

        const routeLine = L.polyline(routeCoords, {
          color: "red",
          weight: 5,
        }).addTo(map);

        map.fitBounds(routeLine.getBounds());

        return () => {
          map.removeLayer(routeLine);
        };
      } catch (err) {
        console.error("OSRM Routing Error:", err);
      }
    };

    fetchRoute();
  }, [map, JSON.stringify(waypoints)]);

  return null;
}
