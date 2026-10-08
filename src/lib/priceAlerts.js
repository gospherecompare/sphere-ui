import { getToken } from "firebase/messaging";
import { buildApiUrl } from "../utils/apiUrl";
import {
  ensureAnonymousFirebaseUser,
  firebaseAuth,
  firebaseConfig,
  firebaseVapidKey,
  getFirebaseMessagingClient,
  isFirebaseMessagingSupported,
} from "./firebase";

const SW_PATH = "/firebase-messaging-sw.js";

const requestCustomerApi = async (path, idToken, options = {}) => {
  const response = await fetch(buildApiUrl(path), {
    method: options.method || "GET",
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      Authorization: `Bearer ${idToken}`,
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result?.message || `Request failed (${response.status}).`);
  }
  return result;
};

const ensurePushDeviceRegistered = async (idToken) => {
  if (
    typeof window === "undefined" ||
    !window.isSecureContext ||
    !("Notification" in window) ||
    !("serviceWorker" in navigator)
  ) {
    return "This browser cannot receive push notifications; in-app alerts will still be available.";
  }

  if (!(await isFirebaseMessagingSupported())) {
    return "Push is not supported in this browser; in-app alerts will still be available.";
  }

  const permission =
    Notification.permission === "default"
      ? await Notification.requestPermission()
      : Notification.permission;
  if (permission !== "granted") {
    return "Push permission was not granted; in-app alerts will still be available.";
  }

  const messaging = await getFirebaseMessagingClient();
  if (!messaging) {
    return "Push is not configured in this browser; in-app alerts will still be available.";
  }

  const workerUrl = `${SW_PATH}?${new URLSearchParams(firebaseConfig).toString()}`;
  const registration = await navigator.serviceWorker.register(workerUrl, {
    scope: "/",
  });
  await navigator.serviceWorker.ready;
  const token = await getToken(messaging, {
    vapidKey: firebaseVapidKey,
    serviceWorkerRegistration: registration,
  });
  if (!token) throw new Error("Firebase did not return a push token.");

  await requestCustomerApi("/customer/push/devices", idToken, {
    method: "POST",
    body: { token, platform: "web" },
  });
  return "";
};

const getCurrentIdToken = async ({ create = false } = {}) => {
  if (!create && firebaseAuth) await firebaseAuth.authStateReady();
  const user = create ? await ensureAnonymousFirebaseUser() : firebaseAuth?.currentUser;
  return user ? user.getIdToken() : "";
};

export const createPriceAlertSubscription = async (subscription) => {
  const user = await ensureAnonymousFirebaseUser();
  const idToken = await user.getIdToken();
  let pushWarning = "";
  try {
    pushWarning = await ensurePushDeviceRegistered(idToken);
  } catch (error) {
    console.error("Price alert push registration failed:", error);
    pushWarning =
      "The price alert was saved, but push could not be enabled. In-app alerts will still be available.";
  }

  const result = await requestCustomerApi("/customer/price-alerts", idToken, {
    method: "POST",
    body: subscription,
  });
  return { ...result, pushWarning };
};

export const updatePriceAlertSubscription = async (id, changes) => {
  const idToken = await getCurrentIdToken({ create: true });
  return requestCustomerApi(`/customer/price-alerts/${encodeURIComponent(id)}`, idToken, {
    method: "PATCH",
    body: changes,
  });
};

export const unsubscribePriceAlert = async (id) => {
  const idToken = await getCurrentIdToken({ create: true });
  return requestCustomerApi(`/customer/price-alerts/${encodeURIComponent(id)}`, idToken, {
    method: "DELETE",
  });
};

export const getCurrentCustomerPriceAlerts = async () => {
  const idToken = await getCurrentIdToken();
  if (!idToken) return [];
  const result = await requestCustomerApi("/customer/price-alerts", idToken);
  return Array.isArray(result?.subscriptions) ? result.subscriptions : [];
};

export const getCustomerNotifications = async () => {
  const idToken = await getCurrentIdToken();
  if (!idToken) return { notifications: [], unread_count: 0 };
  return requestCustomerApi("/customer/notifications", idToken);
};

export const markCustomerNotificationRead = async (id) => {
  const idToken = await getCurrentIdToken();
  if (!idToken) return null;
  return requestCustomerApi(
    `/customer/notifications/${encodeURIComponent(id)}/read`,
    idToken,
    { method: "PATCH" },
  );
};

export const markAllCustomerNotificationsRead = async () => {
  const idToken = await getCurrentIdToken();
  if (!idToken) return { ok: true, updated: 0 };
  return requestCustomerApi("/customer/notifications/read-all", idToken, {
    method: "PATCH",
  });
};
