import { getApp, getApps, initializeApp } from "firebase/app";
import { getMessaging, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: String(import.meta.env.VITE_FIREBASE_API_KEY || "").trim(),
  authDomain: String(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "").trim(),
  projectId: String(import.meta.env.VITE_FIREBASE_PROJECT_ID || "").trim(),
  storageBucket: String(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "").trim(),
  messagingSenderId: String(
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  ).trim(),
  appId: String(import.meta.env.VITE_FIREBASE_APP_ID || "").trim(),
  measurementId: String(import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "").trim(),
};

const REQUIRED_FIREBASE_FIELDS = [
  "apiKey",
  "authDomain",
  "projectId",
  "storageBucket",
  "messagingSenderId",
  "appId",
];

export const firebaseVapidKey = String(
  import.meta.env.VITE_FIREBASE_VAPID_KEY || "",
).trim();

export const isFirebaseMessagingConfigured = REQUIRED_FIREBASE_FIELDS.every(
  (key) => firebaseConfig[key],
) && Boolean(firebaseVapidKey);

export const firebaseApp = isFirebaseMessagingConfigured
  ? getApps()[0] || initializeApp(firebaseConfig)
  : null;

export const isFirebaseMessagingSupported = async () => {
  if (!isFirebaseMessagingConfigured || typeof window === "undefined") {
    return false;
  }

  return isSupported().catch(() => false);
};

export const getFirebaseMessagingClient = async () => {
  const supported = await isFirebaseMessagingSupported();
  if (!supported) return null;

  const app = firebaseApp || getApps()[0] || getApp();
  return getMessaging(app);
};
