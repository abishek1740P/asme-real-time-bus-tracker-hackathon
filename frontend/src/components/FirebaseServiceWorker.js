"use client";

import { useEffect } from "react";
import { initMessaging } from "@/lib/firebase-messaging";
import { onMessage } from "firebase/messaging";

export default function FirebaseServiceWorker() {
  useEffect(() => {
    // Register the service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/firebase-messaging-sw.js")
        .then((reg) => {
          console.log("[FCM SW] Service worker registered:", reg.scope);
        })
        .catch((err) => {
          console.warn("[FCM SW] Service worker registration failed:", err);
        });
    }

    // Handle foreground messages (when app is open/focused)
    let unsubscribe = null;
    initMessaging()
      .then((messaging) => {
        if (!messaging) return;
        unsubscribe = onMessage(messaging, (payload) => {
          const title = payload?.notification?.title || "🚍 Bus Alert";
          const body =
            payload?.notification?.body || "Your bus status was updated.";

          // Show a native notification even in foreground
          if (Notification.permission === "granted") {
            const notif = new Notification(title, {
              body,
              icon: "/bus-icon.svg",
              badge: "/bus-icon.svg",
              vibrate: [200, 100, 200],
              tag: "bus-alert", // prevent duplicate notifications
              renotify: true,
            });
            notif.onclick = () => {
              window.focus();
              notif.close();
            };
          }
        });
      })
      .catch((err) => {
        console.warn("[FCM] Failed to init messaging for foreground:", err);
      });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return null;
}
