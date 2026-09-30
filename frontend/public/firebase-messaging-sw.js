// frontend/public/firebase-messaging-sw.js
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyClOvH-4r6lKwMnT63HL_-GFHIeOQ-0fz8",
  authDomain: "asme-real-time-bus-tracker.firebaseapp.com",
  projectId: "asme-real-time-bus-tracker",
  storageBucket: "asme-real-time-bus-tracker.appspot.com",
  messagingSenderId: "751722813063",
  appId: "1:751722813063:web:9df11ad14ab29822b90a22",
});

// ✅ Force-activate new SW immediately when requested
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

const messaging = firebase.messaging();

// ✅ Background message handler — fires when app is NOT in focus
messaging.onBackgroundMessage((payload) => {
  console.log("[FCM SW] onBackgroundMessage:", payload);

  const title = payload?.notification?.title || "🚍 Bus Alert";
  const body = payload?.notification?.body || "Your bus status was updated.";

  // Use absolute URL for icon — relative paths can fail in SW context
  const iconUrl = self.location.origin + "/bus-icon.png";

  return self.registration.showNotification(title, {
    body,
    icon: iconUrl,
    badge: iconUrl,
    vibrate: [200, 100, 200],
    tag: "bus-alert-" + Date.now(), // unique tag = new popup every time
    data: { url: "/student/buses" },
  });
});

// ✅ Raw push event — fires for ALL pushes (including when app is open)
// CRITICAL: Must use event.waitUntil so Chrome doesn't kill SW before notif shows
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload = {};
  try {
    payload = event.data.json();
  } catch (_) {
    return;
  }

  console.log("[FCM SW] Raw push event:", payload);

  // Check if there's a focused client (app is open and in focus)
  const notifyPromise = clients
    .matchAll({ type: "window", includeUncontrolled: true })
    .then((clientList) => {
      // If ANY client is focused → send postMessage so the page shows a toast
      // The FCM compat library will ALSO call onBackgroundMessage if no focused client
      const hasFocusedClient = clientList.some((c) => c.focused);

      if (hasFocusedClient) {
        // App is open & focused — tell the page to show an in-app toast
        clientList.forEach((client) => {
          if (client.focused) {
            client.postMessage({
              type: "FCM_FOREGROUND_NOTIFICATION",
              title: payload?.notification?.title || "🚍 Bus Alert",
              body: payload?.notification?.body || "Your bus was updated.",
            });
          }
        });
        // Don't show OS notification (avoid double notification)
        return;
      }

      // App not focused → FCM compat's onBackgroundMessage will handle it.
      // But as a safety net, also show one here if FCM compat misses it.
      // (FCM compat fires onBackgroundMessage async; this is a fallback)
      const title = payload?.notification?.title || "🚍 Bus Alert";
      const body = payload?.notification?.body || "Your bus status was updated.";
      const iconUrl = self.location.origin + "/bus-icon.png";

      // Use a small delay to let FCM compat fire first; if it does, the tag deduplicates
      return new Promise((resolve) =>
        setTimeout(() => {
          self.registration
            .showNotification(title, {
              body,
              icon: iconUrl,
              badge: iconUrl,
              vibrate: [200, 100, 200],
              tag: "bus-alert",
              renotify: true,
              data: { url: "/student/buses" },
            })
            .then(resolve)
            .catch(resolve);
        }, 500)
      );
    });

  event.waitUntil(notifyPromise);
});

// ✅ Notification click handler
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification?.data?.url || "/student/buses";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ("navigate" in client && "focus" in client) {
            return client.navigate(targetUrl).then(() => client.focus());
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});
