import { deleteToken, getToken } from "firebase/messaging";
import {
  firebaseVapidKey,
  getFirebaseMessagingClient,
  isFirebaseMessagingConfigured,
  isFirebaseMessagingSupported,
} from "./firebase";

const DEFAULT_REMOTE_API_BASE = "https://api.apisphere.in/api";
const DEFAULT_LOCAL_API_BASE = "http://localhost:5000/api";
const DEFAULT_PUSH_TOPIC =
  String(import.meta.env.VITE_PUSH_TOPIC || "").trim() || "news-all";

const TOKEN_STORAGE_KEYS = ["hooks.push.token", "hooks.news_push.token"];
const ENABLED_STORAGE_KEYS = ["hooks.push.enabled", "hooks.news_push.enabled"];
const SERVER_STATUS_STORAGE_KEYS = [
  "hooks.push.server_status",
  "hooks.news_push.server_status",
];
const SERVER_STATUS_CACHE_MS = 10 * 60 * 1000;
const SERVER_STATUS_ROUTE = "/api/public/push/fcm/status";
const SW_PATH = "/firebase-messaging-sw.js";
const SW_READY_TIMEOUT_MS = 10000;

const normalizeApiBase = (value = "") =>
  String(value || "").trim().replace(/\/+$/, "");

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

const getWindowHostname = () =>
  String(
    typeof window !== "undefined" ? window.location?.hostname || "" : "",
  ).toLowerCase();

const isLocalDevelopmentHost = (hostname = "") =>
  hostname === "localhost" ||
  hostname === "127.0.0.1" ||
  hostname === "::1" ||
  hostname === "[::1]";

const resolvePrimaryApiBase = () => {
  const configuredBase = normalizeApiBase(import.meta.env.VITE_API_BASE_URL);
  if (configuredBase) return configuredBase;

  if (isLocalDevelopmentHost(getWindowHostname())) {
    return DEFAULT_LOCAL_API_BASE;
  }

  return DEFAULT_REMOTE_API_BASE;
};

const getApiBaseCandidates = () => {
  const candidates = new Set();
  const primaryBase = resolvePrimaryApiBase();

  if (primaryBase) {
    candidates.add(primaryBase);
  }

  if (typeof window !== "undefined" && window.location?.origin) {
    const currentOrigin = normalizeApiBase(window.location.origin);
    const hostname = getWindowHostname();

    if (isLocalDevelopmentHost(hostname) || hostname.startsWith("api.")) {
      candidates.add(currentOrigin);
    }
  }

  candidates.add(DEFAULT_REMOTE_API_BASE);

  return [...candidates].filter(Boolean);
};

const readJsonPayload = async (response) => {
  const contentType = String(
    response.headers.get("content-type") || "",
  ).toLowerCase();
  if (!contentType.includes("application/json")) return {};
  return response.json().catch(() => ({}));
};

const createRequestError = (message, status, url) => {
  const error = new Error(message || "Push notification request failed");
  error.status = status;
  error.url = url;
  return error;
};

const getJson = async (routePath) => {
  const urls = [
    ...new Set(getApiBaseCandidates().map((base) => buildApiUrl(base, routePath))),
  ];
  let lastError = null;

  for (let index = 0; index < urls.length; index += 1) {
    const url = urls[index];

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      const payload = await readJsonPayload(response);

      if (response.ok) {
        return payload;
      }

      const error = createRequestError(
        payload?.message || "Push notification status request failed",
        response.status,
        url,
      );

      if (response.status === 404 && index < urls.length - 1) {
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

  throw lastError || new Error("Push notification status request failed");
};

const postJson = async (routePath, body) => {
  const urls = [
    ...new Set(getApiBaseCandidates().map((base) => buildApiUrl(base, routePath))),
  ];
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
    throw createRequestError(
      "Push notifications are not configured for this app yet.",
      404,
      urls[urls.length - 1] || "",
    );
  }

  throw lastError || new Error("Push notification request failed");
};

const readStoredValue = (keys = [], fallback = "") => {
  if (typeof window === "undefined") return fallback;

  for (const key of keys) {
    const value = window.localStorage.getItem(key);
    if (value != null && `${value}` !== "") {
      return value;
    }
  }

  return fallback;
};

const writeStoredValue = (keys = [], value = "") => {
  if (typeof window === "undefined" || !keys.length) return;

  const [primaryKey, ...legacyKeys] = keys;

  if (value === "" || value == null) {
    [primaryKey, ...legacyKeys].forEach((key) =>
      window.localStorage.removeItem(key),
    );
    return;
  }

  window.localStorage.setItem(primaryKey, String(value));
  legacyKeys.forEach((key) => window.localStorage.removeItem(key));
};

const readStoredServerStatus = () => {
  if (typeof window === "undefined") return null;

  try {
    const raw = readStoredValue(SERVER_STATUS_STORAGE_KEYS, "");
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    if (Date.now() - Number(parsed.checkedAt || 0) > SERVER_STATUS_CACHE_MS) {
      return null;
    }

    return {
      configured: parsed.configured === true,
      reason: String(parsed.reason || ""),
    };
  } catch (_error) {
    return null;
  }
};

const writeStoredServerStatus = (status) => {
  if (typeof window === "undefined") return;

  try {
    writeStoredValue(
      SERVER_STATUS_STORAGE_KEYS,
      JSON.stringify({
        configured: status?.configured === true,
        reason: String(status?.reason || ""),
        checkedAt: Date.now(),
      }),
    );
  } catch (_error) {
    // Local storage can be unavailable in private browsing modes.
  }
};

const getPushServerStatus = async ({ force = false } = {}) => {
  if (!force) {
    const cached = readStoredServerStatus();
    if (cached) return cached;
  }

  try {
    const payload = await getJson(SERVER_STATUS_ROUTE);
    const configured = payload?.configured === true;
    const status = {
      configured,
      reason: configured
        ? ""
        : payload?.message ||
          "Push notifications are not configured on this app yet.",
    };

    writeStoredServerStatus(status);
    return status;
  } catch (error) {
    const status =
      error?.status === 404
        ? {
            configured: false,
            reason: "Push notifications are not configured on this app yet.",
          }
        : {
            configured: false,
            reason: "Update alerts are temporarily unavailable. Please try again later.",
          };

    writeStoredServerStatus(status);
    return status;
  }
};

const getStoredToken = () => String(readStoredValue(TOKEN_STORAGE_KEYS, "")).trim();

const setStoredToken = (token = "") => {
  writeStoredValue(TOKEN_STORAGE_KEYS, token ? String(token) : "");
  writeStoredValue(ENABLED_STORAGE_KEYS, token ? "true" : "");
};

const ensureClientPushSupport = async () => {
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

const ensureAppPushSupport = async () => {
  const clientSupport = await ensureClientPushSupport();
  if (!clientSupport.supported) return clientSupport;

  const serverStatus = await getPushServerStatus();
  if (!serverStatus.configured) {
    return {
      supported: false,
      reason: serverStatus.reason,
    };
  }

  return { supported: true, reason: "" };
};

const waitForServiceWorkerReady = async (timeoutMs = SW_READY_TIMEOUT_MS) => {
  const timeoutPromise = new Promise((_, reject) => {
    window.setTimeout(() => {
      reject(new Error("Service worker did not become active in time."));
    }, timeoutMs);
  });

  return Promise.race([navigator.serviceWorker.ready, timeoutPromise]);
};

export const getAppPushStatus = async () => {
  const support = await ensureAppPushSupport();
  const permission =
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "default";
  const enabled =
    support.supported &&
    permission === "granted" &&
    Boolean(getStoredToken()) &&
    String(readStoredValue(ENABLED_STORAGE_KEYS, "") || "") === "true";

  return {
    supported: support.supported,
    reason: support.reason,
    permission,
    enabled,
  };
};

export const registerForAppPush = async () => {
  const support = await ensureAppPushSupport();
  if (!support.supported) throw new Error(support.reason);

  const serverStatus = await getPushServerStatus({ force: true });
  if (!serverStatus.configured) {
    throw new Error(serverStatus.reason);
  }

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

  try {
    await postJson("/api/public/push/fcm/register", {
      token,
      topic: DEFAULT_PUSH_TOPIC,
      permission,
    });
  } catch (error) {
    if ([502, 503, 504].includes(Number(error?.status))) {
      writeStoredServerStatus({
        configured: false,
        reason: "Update alerts are temporarily unavailable. Please try again later.",
      });
      throw new Error("Update alerts are temporarily unavailable. Please try again later.");
    }

    throw error;
  }

  setStoredToken(token);

  return {
    enabled: true,
    token,
  };
};

export const unregisterFromAppPush = async () => {
  const clientSupport = await ensureClientPushSupport();
  const token = getStoredToken();
  const messaging = clientSupport.supported
    ? await getFirebaseMessagingClient()
    : null;

  if (token) {
    await postJson("/api/public/push/fcm/unregister", {
      token,
      topic: DEFAULT_PUSH_TOPIC,
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
