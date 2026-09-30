"use client";

import { useEffect } from "react";
import { initMessaging } from "@/lib/firebase-messaging";
import { onMessage } from "firebase/messaging";
import toast from "react-hot-toast";

export default function FirebaseServiceWorker() {
  useEffect(() => {
    // ── 1. Register Service Worker ─────────────────────────────────────────
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/firebase-messaging-sw.js")
        .then(async (reg) => {
          console.log("[FCM SW] Service worker registered:", reg.scope);

          // Force the new SW to take over immediately (skip waiting)
          if (reg.waiting) {
            reg.waiting.postMessage({ type: "SKIP_WAITING" });
          }
          reg.addEventListener("updatefound", () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                  // New SW installed — force activate it
                  newWorker.postMessage({ type: "SKIP_WAITING" });
                }
              });
            }
          });

          // Check for update
          await reg.update().catch(() => {});
        })
        .catch((err) => {
          console.warn("[FCM SW] Registration failed:", err);
        });
    }

    // ── 2. Foreground onMessage (FCM library route) ────────────────────────
    // Fires when the app IS focused and FCM compat routes to the page
    let unsubscribe = null;
    initMessaging()
      .then((messaging) => {
        if (!messaging) {
          console.warn("[FCM] Messaging not supported in this browser.");
          return;
        }
        console.log("[FCM] Foreground listener active.");

        unsubscribe = onMessage(messaging, (payload) => {
          console.log("[FCM] Foreground message received:", payload);
          showInAppNotification(
            payload?.notification?.title || "🚍 Bus Alert",
            payload?.notification?.body || "Your bus was updated."
          );
        });
      })
      .catch((err) => {
        console.warn("[FCM] Failed to init messaging:", err);
      });

    // ── 3. SW postMessage route (for focused-tab foreground notifications) ──
    // The SW sends postMessage when it detects the app is focused
    const handleSWMessage = (event) => {
      if (event.data?.type === "FCM_FOREGROUND_NOTIFICATION") {
        console.log("[FCM] SW postMessage notification:", event.data);
        showInAppNotification(event.data.title, event.data.body);
      }
    };
    navigator.serviceWorker?.addEventListener("message", handleSWMessage);

    return () => {
      if (unsubscribe) unsubscribe();
      navigator.serviceWorker?.removeEventListener("message", handleSWMessage);
    };
  }, []);

  return null;
}

// ── Rich in-app toast notification ──────────────────────────────────────────
function showInAppNotification(title, body) {
  toast.custom(
    (t) => (
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "12px",
          background: "linear-gradient(135deg, #1e120b, #2d1a0e)",
          border: "1px solid rgba(201,169,127,0.35)",
          borderRadius: "14px",
          padding: "14px 16px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          maxWidth: "360px",
          opacity: t.visible ? 1 : 0,
          transform: t.visible ? "translateY(0)" : "translateY(-8px)",
          transition: "all 0.3s ease",
          cursor: "pointer",
        }}
        onClick={() => toast.dismiss(t.id)}
      >
        <span style={{ fontSize: "28px", lineHeight: 1 }}>🚍</span>
        <div style={{ flex: 1 }}>
          <p
            style={{
              margin: 0,
              fontSize: "14px",
              fontWeight: 700,
              color: "#e6c79c",
              letterSpacing: "0.01em",
            }}
          >
            {title}
          </p>
          <p
            style={{
              margin: "4px 0 0",
              fontSize: "13px",
              color: "#b89f8b",
              lineHeight: 1.4,
            }}
          >
            {body}
          </p>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); toast.dismiss(t.id); }}
          style={{
            background: "none",
            border: "none",
            color: "#7a6355",
            cursor: "pointer",
            fontSize: "16px",
            padding: 0,
            lineHeight: 1,
          }}
        >
          ✕
        </button>
      </div>
    ),
    {
      duration: 6000,
      position: "top-right",
    }
  );
}
