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

  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: "/logo.png",
  });
});
