export const DEFAULT_REMOTE_API_BASE_URL = "https://api.apisphere.in/api";
export const DEFAULT_LOCAL_API_BASE_URL = "http://localhost:5000/api";

const trimTrailingSlashes = (value = "") =>
  String(value || "")
    .trim()
    .replace(/\/+$/g, "");

const isLocalHostname = (hostname = "") => {
  const normalized = String(hostname || "").toLowerCase();
  return (
    normalized === "localhost" ||
    normalized === "127.0.0.1" ||
    normalized === "::1" ||
    normalized === "[::1]"
  );
};

const getConfiguredApiBaseUrl = (env = {}) => {
  const candidates = [
    env?.VITE_API_BASE_URL,
    env?.API_BASE_URL,
    typeof process !== "undefined" && process?.env
      ? process.env.VITE_API_BASE_URL
      : undefined,
    typeof process !== "undefined" && process?.env
      ? process.env.API_BASE_URL
      : undefined,
  ];

  for (const candidate of candidates) {
    const trimmed = String(candidate || "").trim();
    if (trimmed) return normalizeApiBaseUrl(trimmed);
  }

  return "";
};

export const normalizeApiBaseUrl = (
  value = "",
  fallback = DEFAULT_REMOTE_API_BASE_URL,
) => {
  const normalized = trimTrailingSlashes(value || fallback);
  if (!normalized) return "";
  return /\/api$/i.test(normalized) ? normalized : `${normalized}/api`;
};

export const resolveApiBaseUrl = (options = {}) => {
  const env =
    options.env ??
    (typeof import.meta !== "undefined" ? import.meta.env : {}) ??
    {};
  const configuredBase = options.baseUrl || getConfiguredApiBaseUrl(env);
  if (configuredBase) return configuredBase;

  if (options.isServer === true) {
    return DEFAULT_LOCAL_API_BASE_URL;
  }

  if (options.isServer === false) {
    return DEFAULT_REMOTE_API_BASE_URL;
  }

  // If caller provided an explicit hostname, respect it even when running in
  // a Node environment (tests or SSR harnesses may simulate a browser host).
  if (typeof options.hostname === "string" && options.hostname.trim() !== "") {
    return isLocalHostname(options.hostname)
      ? DEFAULT_LOCAL_API_BASE_URL
      : DEFAULT_REMOTE_API_BASE_URL;
  }

  // If there's no explicit hostname, prefer window.location when available.
  if (typeof window !== "undefined") {
    const hostname = window.location?.hostname ?? "";
    if (hostname)
      return isLocalHostname(hostname)
        ? DEFAULT_LOCAL_API_BASE_URL
        : DEFAULT_REMOTE_API_BASE_URL;
    return DEFAULT_REMOTE_API_BASE_URL;
  }

  // Fallback: assume local when running in pure Node without hostname hints.
  return DEFAULT_LOCAL_API_BASE_URL;
};

export const API_BASE_URL = resolveApiBaseUrl();

export const API_ORIGIN_URL = API_BASE_URL.replace(/\/api$/i, "");

export const buildApiUrl = (routePath = "", baseUrl = API_BASE_URL) => {
  const normalizedBase = normalizeApiBaseUrl(baseUrl);
  const rawPath = String(routePath || "").trim();
  if (/^https?:\/\//i.test(rawPath)) return rawPath;

  let normalizedPath = `/${rawPath.replace(/^\/+/, "")}`;
  if (/^\/api(?:\/|$)/i.test(normalizedPath)) {
    normalizedPath = normalizedPath.replace(/^\/api/i, "") || "/";
  }

  return `${normalizedBase}${normalizedPath}`;
};
