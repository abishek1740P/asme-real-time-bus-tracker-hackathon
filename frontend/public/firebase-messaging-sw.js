// frontend/public/firebase-messaging-sw.js
// ============================================================
// Firebase Cloud Messaging Service Worker
// This runs in the background and handles push notifications
// ============================================================

importScripts(
  "https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyClOvH-4r6lKwMnT63HL_-GFHIeOQ-0fz8",
  authDomain: "asme-real-time-bus-tracker.firebaseapp.com",
  projectId: "asme-real-time-bus-tracker",
  storageBucket: "asme-real-time-bus-tracker.appspot.com",
  messagingSenderId: "751722813063",
  appId: "1:751722813063:web:9df11ad14ab29822b90a22",
});

const messaging = firebase.messaging();

// ✅ Background message handler (app closed / not focused)
messaging.onBackgroundMessage((payload) => {
  console.log("[FCM SW] Background message received:", payload);

  const title = payload?.notification?.title || "🚍 Bus Alert";
  const options = {
    body: payload?.notification?.body || "Your bus status was updated.",
    icon: "/bus-icon.svg",
    badge: "/bus-icon.svg",
    vibrate: [200, 100, 200],
    tag: "bus-alert",
    renotify: true,
    data: { url: payload?.data?.url || "/student/buses" },
  };

  self.registration.showNotification(title, options);
});

// ✅ Explicit push event handler - catches pushes that bypass FCM library
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload = {};
  try {
    payload = event.data.json();
  } catch (_) {
    // Not JSON, skip
    return;
  }

  // FCM compat library handles this - but we log for debug
  console.log("[FCM SW] Push event received (raw):", payload);
});

// ✅ Notification click handler
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification?.data?.url || "/student/buses";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // If there's already a window open, navigate it
        for (const client of clientList) {
          if ("navigate" in client && "focus" in client) {
            return client.navigate(targetUrl).then(() => client.focus());
          }
        }
        // Otherwise open a new window
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});
