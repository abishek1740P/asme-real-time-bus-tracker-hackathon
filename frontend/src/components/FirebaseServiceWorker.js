"use client";

import { useEffect } from "react";

export default function FirebaseServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/firebase-messaging-sw.js")
        .catch(() => {
          // Optional: handle error silently or show toast if needed
        });
    }
  }, []);

  return null;
}
