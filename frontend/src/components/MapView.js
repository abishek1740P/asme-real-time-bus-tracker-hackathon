"use client";

import React, { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import RoutingControl from "./RoutingControl";

// Fix Leaflet icon issues (especially in Next.js)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
});

// Custom icons
const startIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
  shadowSize: [41, 41],
});

const checkpointIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
  shadowSize: [41, 41],
});

const endIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-black.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
  shadowSize: [41, 41],
});

const busIcon = new L.Icon({
  iconUrl: "/bus-icon.svg",
  iconSize: [35, 35],
  iconAnchor: [17, 35],
  popupAnchor: [0, -30],
});

// 📍 Recenter Button
function RecenterButton({ lat, lng }) {
  const map = useMap();

  const handleClick = () => {
    if (typeof lat === "number" && typeof lng === "number") {
      map.setView([lat, lng], map.getZoom(), { animate: true });
    }
  };

  return (
    <button
      onClick={handleClick}
      className="absolute bottom-4 right-4 z-[1000] bg-white text-black px-3 py-2 rounded-md shadow-md hover:bg-gray-200 transition"
    >
      📍 Recenter
    </button>
  );
}

// 🗺️ MapView Component
export default function MapView({
  lat,
  lng,
  isConnected = true,
  checkpoints = [],
  passedIndices = [],
  speed,
}) {
  const waypoints = checkpoints
    .map((stop) => {
      const clat = stop?.coordinates?.lat;
      const clng = stop?.coordinates?.lng;
      return typeof clat === "number" && typeof clng === "number"
        ? [clat, clng]
        : null;
    })
    .filter(Boolean);

  // 🔥 Auto-update popup content when speed changes
  const popupRef = useRef(null);
  useEffect(() => {
    if (popupRef.current && popupRef.current.isOpen()) {
      popupRef.current.setContent(`
        <div>
          <p><strong>Status:</strong> ${
            isConnected ? '<span style="color:green">Connected</span>' : '<span style="color:red">Disconnected</span>'
          }</p>
          <p><strong>Speed:</strong> ${speed ? speed + " km/h" : "N/A"}</p>
        </div>
      `);
    }
  }, [speed, isConnected]);

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={[lat, lng]}
        zoom={14}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* 🚌 Bus Marker */}
        {typeof lat === "number" && typeof lng === "number" && (
          <Marker position={[lat, lng]} icon={busIcon}>
            <Popup ref={popupRef}>
              <p>
                <strong>Status:</strong>{" "}
                <span className={isConnected ? "text-green-600" : "text-red-600"}>
                  {isConnected ? "Connected" : "Disconnected"}
                </span>
              </p>
              <p>
                <strong>Speed:</strong> {speed ? speed : "N/A"} km/h
              </p>
            </Popup>
          </Marker>
        )}

        {/* 📍 Checkpoint Markers */}
        {checkpoints.map((stop, index) => {
          const clat = stop?.coordinates?.lat;
          const clng = stop?.coordinates?.lng;
          if (typeof clat !== "number" || typeof clng !== "number") return null;

          const icon =
            index === 0
              ? startIcon
              : index === checkpoints.length - 1
              ? endIcon
              : checkpointIcon;

          return (
            <Marker key={index} position={[clat, clng]} icon={icon}>
              <Popup>
                <p>
                  <strong>Stop:</strong> {stop?.name || `Stop ${index + 1}`}
                </p>
              </Popup>
            </Marker>
          );
        })}

        {/* 🧭 Routing Path */}
        {waypoints.length >= 2 && <RoutingControl waypoints={waypoints} />}

        {/* 📍 Recenter Button */}
        <RecenterButton lat={lat} lng={lng} />
      </MapContainer>
    </div>
  );
}
