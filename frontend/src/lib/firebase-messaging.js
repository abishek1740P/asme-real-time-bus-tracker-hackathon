// src/lib/firebase-messaging.js
"use client";

import { getMessaging, isSupported } from "firebase/messaging";
import { firebaseApp } from "./firebase";

let messagingInstance = null;

export const initMessaging = async () => {
  const supported = await isSupported();
  if (!supported) return null;

  if (!messagingInstance) {
    messagingInstance = getMessaging(firebaseApp);
  }
  return messagingInstance;
};
