import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getMessaging, isSupported } from "firebase/messaging";

export const firebaseConfig = {
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

export const isFirebaseConfigured = REQUIRED_FIREBASE_FIELDS.every(
  (key) => firebaseConfig[key],
);

export const isFirebaseMessagingConfigured =
  isFirebaseConfigured && Boolean(firebaseVapidKey);

export const firebaseApp = isFirebaseConfigured
  ? getApps()[0] || initializeApp(firebaseConfig)
  : null;

export const firebaseAuth = firebaseApp ? getAuth(firebaseApp) : null;

export const ensureAnonymousFirebaseUser = async () => {
  if (!firebaseAuth) {
    throw new Error("Firebase Authentication is not configured.");
  }
  await firebaseAuth.authStateReady();
  if (firebaseAuth.currentUser) return firebaseAuth.currentUser;
  const credential = await signInAnonymously(firebaseAuth);
  return credential.user;
};

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
