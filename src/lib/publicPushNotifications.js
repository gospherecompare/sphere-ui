import { getApps, initializeApp } from "firebase/app";
import {
  deleteToken,
  getMessaging,
  getToken,
  isSupported,
  onMessage,
} from "firebase/messaging";
import { buildApiUrl } from "../utils/apiUrl";

export const PUBLIC_PUSH_TOPICS = Object.freeze({
  launches: "Product launches",
  news: "Technology news",
  deals: "Price drops and deals",
});

export const DEFAULT_PUBLIC_PUSH_TOPICS = Object.freeze({
  launches: true,
  news: true,
  deals: true,
});

const TOKEN_STORAGE_KEY = "mobilesx-fcm-token";
const TOPICS_STORAGE_KEY = "mobilesx-fcm-topics";
const SYNCED_AT_STORAGE_KEY = "mobilesx-fcm-synced-at";
const SERVICE_WORKER_PATH = "/firebase-messaging-sw.js";
const SUBSCRIPTION_SYNC_INTERVAL_MS = 12 * 60 * 60 * 1000;

const readStorage = (key) => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const writeStorage = (key, value) => {
  try {
    if (value == null || value === "") window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, String(value));
  } catch {
    // The subscription still works when browser storage is unavailable.
  }
};

export const normalizePublicPushTopics = (value) => {
  const source = value && typeof value === "object" ? value : {};
  return Object.fromEntries(
    Object.keys(PUBLIC_PUSH_TOPICS).map((topic) => [
      topic,
      source[topic] === true,
    ]),
  );
};

export const readSavedPublicPushTopics = () => {
  try {
    const value = JSON.parse(readStorage(TOPICS_STORAGE_KEY) || "null");
    const topics = normalizePublicPushTopics(value);
    return Object.values(topics).some(Boolean)
      ? topics
      : { ...DEFAULT_PUBLIC_PUSH_TOPICS };
  } catch {
    return { ...DEFAULT_PUBLIC_PUSH_TOPICS };
  }
};

const requestJson = async (path, options = {}) => {
  const response = await fetch(buildApiUrl(path), {
    ...options,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(
      payload?.message || `Notification request failed (${response.status}).`,
    );
    error.status = response.status;
    throw error;
  }
  return payload;
};

const getPublicPushConfig = async () => {
  const result = await requestJson("/notifications/config");
  if (!result?.pushEnabled || !result?.firebase?.vapidKey) {
    throw new Error(
      "Browser notifications are not fully configured on MobilesX yet.",
    );
  }
  return result.firebase;
};

const getNotificationMessaging = (config) => {
  const appName = "mobilesx-notifications";
  const options = { ...config };
  delete options.vapidKey;
  const app =
    getApps().find((existing) => existing.name === appName) ||
    initializeApp(options, appName);
  return getMessaging(app);
};

const assertPushSupport = async () => {
  if (typeof window === "undefined" || !window.isSecureContext) {
    throw new Error("Notifications require a secure HTTPS connection.");
  }
  if (!("Notification" in window) || !("serviceWorker" in navigator)) {
    throw new Error("This browser cannot receive push notifications.");
  }
  if (!(await isSupported().catch(() => false))) {
    throw new Error("This browser does not support Firebase push notifications.");
  }
};

export const checkPublicPushAvailability = async () => {
  await assertPushSupport();
  await getPublicPushConfig();
};

const registerPublicPush = async ({ topics, forceSync = false }) => {
  if (Notification.permission !== "granted") {
    throw new Error("Allow notifications in your browser to continue.");
  }

  await assertPushSupport();
  const firebaseConfig = await getPublicPushConfig();
  const workerConfig = { ...firebaseConfig };
  delete workerConfig.vapidKey;

  const workerUrl = new URL(SERVICE_WORKER_PATH, window.location.origin);
  workerUrl.searchParams.set("firebaseConfig", JSON.stringify(workerConfig));
  const registration = await navigator.serviceWorker.register(workerUrl, {
    scope: "/",
  });
  await navigator.serviceWorker.ready;

  const messaging = getNotificationMessaging(firebaseConfig);
  const token = await getToken(messaging, {
    vapidKey: firebaseConfig.vapidKey,
    serviceWorkerRegistration: registration,
  });
  if (!token) throw new Error("Firebase did not return a browser push token.");

  let normalizedTopics = normalizePublicPushTopics(topics);
  if (!Object.values(normalizedTopics).some(Boolean)) {
    throw new Error("Choose at least one notification category.");
  }

  const previousToken = readStorage(TOKEN_STORAGE_KEY);
  const syncedAt = Number(readStorage(SYNCED_AT_STORAGE_KEY) || 0);
  const hasSavedTopics = Boolean(readStorage(TOPICS_STORAGE_KEY));
  let serverSubscription = null;
  const shouldCheckServer =
    !forceSync &&
    (token !== previousToken ||
      !hasSavedTopics ||
      Date.now() - syncedAt > SUBSCRIPTION_SYNC_INTERVAL_MS);

  if (shouldCheckServer) {
    try {
      serverSubscription = await requestJson(
        "/notifications/push-subscription/status",
        {
          method: "POST",
          body: JSON.stringify({ token }),
        },
      );
    } catch (error) {
      if (error?.status !== 404) throw error;
    }
    if (serverSubscription?.subscribed && serverSubscription.topics) {
      const serverTopics = normalizePublicPushTopics(serverSubscription.topics);
      if (Object.values(serverTopics).some(Boolean)) normalizedTopics = serverTopics;
    }
  }

  const previousTopics = readSavedPublicPushTopics();
  const shouldSync =
    forceSync ||
    serverSubscription?.subscribed === false ||
    token !== previousToken ||
    JSON.stringify(normalizedTopics) !== JSON.stringify(previousTopics) ||
    Date.now() - syncedAt > SUBSCRIPTION_SYNC_INTERVAL_MS;

  if (shouldSync) {
    await requestJson("/notifications/push-subscription", {
      method: "POST",
      body: JSON.stringify({ token, topics: normalizedTopics }),
    });
    writeStorage(SYNCED_AT_STORAGE_KEY, Date.now());
  }

  writeStorage(TOKEN_STORAGE_KEY, token);
  writeStorage(TOPICS_STORAGE_KEY, JSON.stringify(normalizedTopics));

  return { token, messaging, registration, topics: normalizedTopics };
};

export const subscribeToPublicPush = async ({ topics }) => {
  if (typeof window === "undefined" || !("Notification" in window)) {
    throw new Error("This browser cannot receive push notifications.");
  }
  if (!window.isSecureContext) {
    throw new Error("Notifications require a secure HTTPS connection.");
  }

  // Request permission directly from the click handler, before any async setup.
  const permission =
    Notification.permission === "default"
      ? await Notification.requestPermission()
      : Notification.permission;
  if (permission !== "granted") {
    throw new Error(
      permission === "denied"
        ? "Notifications are blocked. Allow them in your browser site settings, then retry."
        : "Allow notifications in your browser to continue.",
    );
  }

  return registerPublicPush({ topics, forceSync: true });
};

export const syncPublicPushSubscription = ({ topics }) =>
  registerPublicPush({ topics, forceSync: false });

export const updatePublicPushTopics = async ({ token, topics }) => {
  const normalizedTopics = normalizePublicPushTopics(topics);
  if (!Object.values(normalizedTopics).some(Boolean)) {
    throw new Error("Select at least one notification category.");
  }
  if (!token) {
    return syncPublicPushSubscription({ topics: normalizedTopics });
  }

  await requestJson("/notifications/push-subscription", {
    method: "POST",
    body: JSON.stringify({ token, topics: normalizedTopics }),
  });
  writeStorage(TOPICS_STORAGE_KEY, JSON.stringify(normalizedTopics));
  writeStorage(SYNCED_AT_STORAGE_KEY, Date.now());
  return { topics: normalizedTopics };
};

export const getSavedPublicPushToken = () => readStorage(TOKEN_STORAGE_KEY) || "";

export const removePublicPushSubscription = async () => {
  const token = getSavedPublicPushToken();
  if (token) {
    await requestJson("/notifications/push-subscription", {
      method: "DELETE",
      body: JSON.stringify({ token }),
    });
  }

  const app = getApps().find(
    (existing) => existing.name === "mobilesx-notifications",
  );
  if (app) {
    try {
      await deleteToken(getMessaging(app));
    } catch {
      // The browser may already have removed its push subscription.
    }
  }

  writeStorage(TOKEN_STORAGE_KEY, "");
  writeStorage(TOPICS_STORAGE_KEY, "");
  writeStorage(SYNCED_AT_STORAGE_KEY, "");
};

export const subscribeToForegroundPublicPush = (messaging, callback) =>
  onMessage(messaging, callback);
