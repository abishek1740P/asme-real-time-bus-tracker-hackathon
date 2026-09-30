// frontend/public/firebase-messaging-sw.js
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
  messagingSenderId: "751722813063",
  appId: "1:751722813063:web:9df11ad14ab29822b90a22",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload?.notification?.title || "🚍 Bus Alert";
  const options = {
    body: payload?.notification?.body || "Your bus status was updated.",
    icon: "/bus-icon.svg",
    badge: "/bus-icon.svg",
    vibrate: [200, 100, 200],
    data: payload?.data || {},
  };

  self.registration.showNotification(title, options);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow("/student/buses");
      }
    })
  );
});
