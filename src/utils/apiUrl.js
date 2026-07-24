const DEFAULT_REMOTE_API_BASE_URL = "https://api.apisphere.in/api";
const DEFAULT_LOCAL_API_BASE_URL = "http://localhost:5000/api";

const trimTrailingSlashes = (value = "") =>
  String(value || "").trim().replace(/\/+$/g, "");

const isLocalBrowser = () => {
  if (typeof window === "undefined") return false;
  const hostname = String(window.location?.hostname || "").toLowerCase();
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname === "[::1]"
  );
};

export const normalizeApiBaseUrl = (
  value = "",
  fallback = DEFAULT_REMOTE_API_BASE_URL,
) => {
  const normalized = trimTrailingSlashes(value || fallback);
  if (!normalized) return "";
  return /\/api$/i.test(normalized) ? normalized : `${normalized}/api`;
};

export const API_BASE_URL = normalizeApiBaseUrl(
  import.meta.env.VITE_API_BASE_URL,
  isLocalBrowser()
    ? DEFAULT_LOCAL_API_BASE_URL
    : DEFAULT_REMOTE_API_BASE_URL,
);

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
