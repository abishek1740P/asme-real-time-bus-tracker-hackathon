// src/lib/firebase.js
import { initializeApp } from "firebase/app";
import { getMessaging, getToken } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseApp = initializeApp(firebaseConfig);

// FCM: get token utility
export async function getFcmToken() {
  if (typeof window === "undefined") return null;

  try {
    if (!("Notification" in window)) {
      console.warn("This browser does not support desktop notifications.");
      return null;
    }

    // Ask user for permission if not yet decided
    let permission = Notification.permission;
    if (permission === "default") {
      permission = await Notification.requestPermission();
    }

    if (permission !== "granted") {
      console.warn("Notification permission was not granted:", permission);
      return null;
    }

    // Ensure service worker is registered
    let swReg = null;
    if ("serviceWorker" in navigator) {
      swReg = await navigator.serviceWorker.ready.catch(() => null);
      if (!swReg) {
        swReg = await navigator.serviceWorker.register("/firebase-messaging-sw.js").catch(() => null);
      }
    }

    const messaging = getMessaging(firebaseApp);
    const tokenOptions = {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    };
    if (swReg) {
      tokenOptions.serviceWorkerRegistration = swReg;
    }

    const currentToken = await getToken(messaging, tokenOptions);
    if (currentToken) {
      localStorage.setItem("fcmToken", currentToken);
    }
    return currentToken;
  } catch (error) {
    console.error("FCM token error:", error);
    return null;
  }
}
