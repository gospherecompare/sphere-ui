import { deleteToken, getToken } from "firebase/messaging";
import {
  firebaseVapidKey,
  getFirebaseMessagingClient,
  isFirebaseMessagingConfigured,
  isFirebaseMessagingSupported,
} from "./firebase";

const DEFAULT_API_BASE = "https://api.apisphere.in";

const NEWS_PUSH_TOPIC = "news-all";
const TOKEN_STORAGE_KEY = "hooks.news_push.token";
const ENABLED_STORAGE_KEY = "hooks.news_push.enabled";
const SW_PATH = "/firebase-messaging-sw.js";
const SW_READY_TIMEOUT_MS = 10000;

const normalizeApiBase = (value = "") => String(value || "").trim().replace(/\/+$/, "");

const buildApiUrl = (base, routePath) => {
  const normalizedBase = normalizeApiBase(base);
  const normalizedPath = `/${String(routePath || "")
    .trim()
    .replace(/^\/+/, "")}`;

  if (!normalizedBase) return normalizedPath;

  if (
    /\/api$/i.test(normalizedBase) &&
    /^\/api(?:\/|$)/i.test(normalizedPath)
  ) {
    return `${normalizedBase}${normalizedPath.replace(/^\/api/i, "")}`;
  }

  return `${normalizedBase}${normalizedPath}`;
};

const getApiBaseCandidates = () => {
  const candidates = new Set();
  const configuredBase = normalizeApiBase(import.meta.env.VITE_API_BASE_URL);

  if (configuredBase) {
    candidates.add(configuredBase);
  }

  candidates.add(DEFAULT_API_BASE);

  if (typeof window !== "undefined" && window.location?.origin) {
    const currentOrigin = normalizeApiBase(window.location.origin);

    try {
      const hostname = new URL(currentOrigin).hostname.toLowerCase();
      const isLocalDevHost =
        hostname === "localhost" ||
        hostname === "127.0.0.1" ||
        hostname === "[::1]";
      const isApiHost = hostname.startsWith("api.");

      if (isLocalDevHost || isApiHost) {
        candidates.add(currentOrigin);
      }
    } catch (_error) {
      // Ignore invalid origins and rely on explicit API bases instead.
    }
  }

  return [...candidates].filter(Boolean);
};

const readJsonPayload = async (response) => {
  const contentType = String(response.headers.get("content-type") || "").toLowerCase();
  if (!contentType.includes("application/json")) return {};
  return response.json().catch(() => ({}));
};

const createRequestError = (message, status, url) => {
  const error = new Error(message || "Push notification request failed");
  error.status = status;
  error.url = url;
  return error;
};

const postJson = async (routePath, body) => {
  const urls = [...new Set(getApiBaseCandidates().map((base) => buildApiUrl(base, routePath)))];
  let lastError = null;
  let sawRouteMissing = false;

  for (let index = 0; index < urls.length; index += 1) {
    const url = urls[index];

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
      });

      const payload = await readJsonPayload(response);

      if (response.ok) {
        return payload;
      }

      const error = createRequestError(
        payload?.message || "Push notification request failed",
        response.status,
        url,
      );

      if (response.status === 404) {
        sawRouteMissing = true;
        lastError = error;
        continue;
      }

      throw error;
    } catch (error) {
      lastError = error;

      if (
        index < urls.length - 1 &&
        (error?.status === 404 || typeof error?.status === "undefined")
      ) {
        continue;
      }

      break;
    }
  }

  if (sawRouteMissing) {
    const targetHost = (() => {
      try {
        return new URL(urls[0] || DEFAULT_API_BASE).origin;
      } catch (_error) {
        return DEFAULT_API_BASE;
      }
    })();

    throw createRequestError(
      `Push notifications are not available on ${targetHost} yet.`,
      404,
      urls[urls.length - 1] || "",
    );
  }

  throw lastError || new Error("Push notification request failed");
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

  if (!window.isSecureContext) {
    return {
      supported: false,
      reason: "Push notifications require HTTPS or localhost.",
    };
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

const waitForServiceWorkerReady = async (timeoutMs = SW_READY_TIMEOUT_MS) => {
  const timeoutPromise = new Promise((_, reject) => {
    window.setTimeout(() => {
      reject(
        new Error("Service worker did not become active in time."),
      );
    }, timeoutMs);
  });

  return Promise.race([navigator.serviceWorker.ready, timeoutPromise]);
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
  const readyRegistration = registration.active
    ? registration
    : await waitForServiceWorkerReady();

  const token = await getToken(messaging, {
    vapidKey: firebaseVapidKey,
    serviceWorkerRegistration: readyRegistration,
  });

  if (!token) {
    throw new Error("Unable to create a browser push token.");
  }

  await postJson("/api/public/push/fcm/register", {
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
    await postJson("/api/public/push/fcm/unregister", {
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
