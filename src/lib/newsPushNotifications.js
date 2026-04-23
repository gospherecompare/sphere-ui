import { deleteToken, getToken } from "firebase/messaging";
import {
  firebaseVapidKey,
  getFirebaseMessagingClient,
  isFirebaseMessagingConfigured,
  isFirebaseMessagingSupported,
} from "./firebase";

const API_BASE = (() => {
  const configuredBase = String(import.meta.env.VITE_API_BASE_URL || "").trim();
  if (configuredBase) return configuredBase.replace(/\/$/, "");
  return "https://api.apisphere.in";
})();

const NEWS_PUSH_TOPIC = "news-all";
const TOKEN_STORAGE_KEY = "hooks.news_push.token";
const ENABLED_STORAGE_KEY = "hooks.news_push.enabled";
const SW_PATH = "/firebase-messaging-sw.js";

const postJson = async (url, body) => {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  const contentType = String(response.headers.get("content-type") || "").toLowerCase();
  const payload = contentType.includes("application/json")
    ? await response.json().catch(() => ({}))
    : {};

  if (!response.ok) {
    throw new Error(payload?.message || "Push notification request failed");
  }

  return payload;
};

const getStoredToken = () => {
  if (typeof window === "undefined") return "";
  return String(window.localStorage.getItem(TOKEN_STORAGE_KEY) || "").trim();
};

const setStoredToken = (token = "") => {
  if (typeof window === "undefined") return;
  if (token) {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
    window.localStorage.setItem(ENABLED_STORAGE_KEY, "true");
    return;
  }
  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  window.localStorage.removeItem(ENABLED_STORAGE_KEY);
};

const ensureBrowserSupport = async () => {
  if (typeof window === "undefined") {
    return { supported: false, reason: "Push notifications are browser-only." };
  }

  if (!isFirebaseMessagingConfigured) {
    return {
      supported: false,
      reason: "Firebase messaging is not configured yet.",
    };
  }

  if (!("Notification" in window)) {
    return {
      supported: false,
      reason: "This browser does not support notifications.",
    };
  }

  if (!("serviceWorker" in navigator)) {
    return {
      supported: false,
      reason: "This browser does not support service workers.",
    };
  }

  const supported = await isFirebaseMessagingSupported();
  if (!supported) {
    return {
      supported: false,
      reason: "Push notifications are not supported in this browser.",
    };
  }

  return { supported: true, reason: "" };
};

export const getNewsPushStatus = async () => {
  const support = await ensureBrowserSupport();
  const permission =
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "default";
  const enabled =
    support.supported &&
    permission === "granted" &&
    Boolean(getStoredToken()) &&
    String(window.localStorage.getItem(ENABLED_STORAGE_KEY) || "") === "true";

  return {
    supported: support.supported,
    reason: support.reason,
    permission,
    enabled,
  };
};

export const registerForNewsPush = async () => {
  const support = await ensureBrowserSupport();
  if (!support.supported) throw new Error(support.reason);

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error(
      permission === "denied"
        ? "Notifications are blocked in this browser."
        : "Notification permission was not granted.",
    );
  }

  const messaging = await getFirebaseMessagingClient();
  if (!messaging) {
    throw new Error("Firebase messaging is not available in this browser.");
  }

  const registration = await navigator.serviceWorker.register(SW_PATH, {
    scope: "/",
  });

  const token = await getToken(messaging, {
    vapidKey: firebaseVapidKey,
    serviceWorkerRegistration: registration,
  });

  if (!token) {
    throw new Error("Unable to create a browser push token.");
  }

  await postJson(`${API_BASE}/api/public/push/fcm/register`, {
    token,
    topic: NEWS_PUSH_TOPIC,
    permission,
  });

  setStoredToken(token);

  return {
    enabled: true,
    token,
  };
};

export const unregisterFromNewsPush = async () => {
  const support = await ensureBrowserSupport();
  const token = getStoredToken();
  const messaging = support.supported
    ? await getFirebaseMessagingClient()
    : null;

  if (token) {
    await postJson(`${API_BASE}/api/public/push/fcm/unregister`, {
      token,
      topic: NEWS_PUSH_TOPIC,
    }).catch(() => undefined);
  }

  if (messaging) {
    await deleteToken(messaging).catch(() => undefined);
  }

  setStoredToken("");

  return {
    enabled: false,
  };
};
