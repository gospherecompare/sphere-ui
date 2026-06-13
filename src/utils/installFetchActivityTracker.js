const WINDOW_INSTALLED_KEY = "__HOOKS_FETCH_ACTIVITY_TRACKER_INSTALLED__";
const WINDOW_COUNT_KEY = "__HOOKS_FETCH_IN_FLIGHT__";
const ACTIVITY_EVENT = "hooks:fetch-activity";

const normalizeMethod = (value) =>
  String(value || "GET")
    .trim()
    .toUpperCase();

const toRequestUrl = (input) => {
  if (typeof input === "string" || input instanceof URL) return String(input);
  if (input && typeof input === "object" && typeof input.url === "string") {
    return input.url;
  }
  return null;
};

const isTrackedReadRequest = (input, init = undefined) => {
  const method = normalizeMethod(
    init?.method ??
      (typeof input === "object" && input ? input.method : undefined),
  );
  if (method !== "GET") return false;

  const requestUrl = toRequestUrl(input);
  if (!requestUrl) return false;

  try {
    const parsed = new URL(requestUrl, window.location.origin);
    const pathname = String(parsed.pathname || "");
    if (!pathname.startsWith("/api/")) return false;
    return (
      pathname.startsWith("/api/public/") ||
      /^\/api\/(smartphones|laptops|tvs|networking|brand|category)$/i.test(
        pathname,
      )
    );
  } catch {
    return false;
  }
};

const emitActivity = () => {
  window.dispatchEvent(
    new CustomEvent(ACTIVITY_EVENT, {
      detail: { count: window[WINDOW_COUNT_KEY] || 0 },
    }),
  );
};

const increment = () => {
  window[WINDOW_COUNT_KEY] = Math.max(0, (window[WINDOW_COUNT_KEY] || 0) + 1);
  emitActivity();
};

const decrement = () => {
  window[WINDOW_COUNT_KEY] = Math.max(0, (window[WINDOW_COUNT_KEY] || 0) - 1);
  emitActivity();
};

export const installFetchActivityTracker = () => {
  if (typeof window === "undefined") return;
  if (window[WINDOW_INSTALLED_KEY]) return;
  if (typeof window.fetch !== "function") return;

  const wrappedFetch = window.fetch.bind(window);

  window.fetch = async (input, init = undefined) => {
    const shouldTrack = isTrackedReadRequest(input, init);
    if (shouldTrack) increment();

    try {
      return await wrappedFetch(input, init);
    } finally {
      if (shouldTrack) decrement();
    }
  };

  window[WINDOW_INSTALLED_KEY] = true;
  window[WINDOW_COUNT_KEY] = window[WINDOW_COUNT_KEY] || 0;
};

export default installFetchActivityTracker;
