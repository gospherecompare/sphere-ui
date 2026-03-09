const WINDOW_PAYLOAD_KEY = "__HOOKS_PRERENDER_DATA__";
const WINDOW_INSTALLED_KEY = "__HOOKS_PRELOADED_FETCH_INSTALLED__";
const PRELOADED_HEADER = "X-Hooks-Preloaded";

const normalizeMethod = (value) =>
  String(value || "GET")
    .trim()
    .toUpperCase();

const toRequestUrl = (input) => {
  if (typeof input === "string" || input instanceof URL) {
    return String(input);
  }
  if (input && typeof input === "object" && typeof input.url === "string") {
    return input.url;
  }
  return null;
};

export const installPreloadedFetchInterceptor = () => {
  if (typeof window === "undefined") return;
  if (window[WINDOW_INSTALLED_KEY]) return;
  if (typeof window.fetch !== "function") return;

  const payload = window[WINDOW_PAYLOAD_KEY];
  if (!payload || typeof payload !== "object") return;

  const byUrl =
    payload.byUrl && typeof payload.byUrl === "object" ? payload.byUrl : {};
  const entries = Object.entries(byUrl);
  if (!entries.length) return;

  const endpointMap = new Map();
  const withNoTrailingSlash = (value = "") => {
    const text = String(value || "");
    if (text.length > 1 && text.endsWith("/")) return text.slice(0, -1);
    return text;
  };

  const registerKey = (key, body) => {
    const normalized = withNoTrailingSlash(key);
    if (!normalized) return;
    endpointMap.set(normalized, body);
  };

  entries.forEach(([rawUrl, body]) => {
    try {
      const parsed = new URL(rawUrl);
      const full = `${parsed.origin}${parsed.pathname}${parsed.search}`;
      const pathWithSearch = `${parsed.pathname}${parsed.search}`;
      const sameOriginFull = `${window.location.origin}${parsed.pathname}${parsed.search}`;

      registerKey(full, body);
      registerKey(pathWithSearch, body);
      registerKey(sameOriginFull, body);

      if (!parsed.search) {
        registerKey(`${parsed.origin}${parsed.pathname}`, body);
        registerKey(parsed.pathname, body);
        registerKey(`${window.location.origin}${parsed.pathname}`, body);
      }
    } catch {
      // Ignore malformed payload keys.
    }
  });

  if (!endpointMap.size) return;

  const nativeFetch = window.fetch.bind(window);

  window.fetch = async (input, init = undefined) => {
    const method = normalizeMethod(
      init?.method ??
        (typeof input === "object" && input ? input.method : undefined),
    );

    if (method !== "GET") {
      return nativeFetch(input, init);
    }

    const requestUrl = toRequestUrl(input);
    if (!requestUrl) return nativeFetch(input, init);

    let parsed;
    try {
      parsed = new URL(requestUrl, window.location.origin);
    } catch {
      return nativeFetch(input, init);
    }

    const full = withNoTrailingSlash(
      `${parsed.origin}${parsed.pathname}${parsed.search}`,
    );
    const fullNoSearch = withNoTrailingSlash(
      `${parsed.origin}${parsed.pathname}`,
    );
    const pathWithSearch = withNoTrailingSlash(
      `${parsed.pathname}${parsed.search}`,
    );
    const pathNoSearch = withNoTrailingSlash(parsed.pathname);
    const sameOriginFull = withNoTrailingSlash(
      `${window.location.origin}${parsed.pathname}${parsed.search}`,
    );
    const sameOriginNoSearch = withNoTrailingSlash(
      `${window.location.origin}${parsed.pathname}`,
    );

    const matchedKey = [
      full,
      sameOriginFull,
      pathWithSearch,
      fullNoSearch,
      sameOriginNoSearch,
      pathNoSearch,
    ].find((key) => endpointMap.has(key));

    if (!matchedKey) {
      return nativeFetch(input, init);
    }

    const body = endpointMap.get(matchedKey);
    const bodyText =
      typeof body === "string" ? body : JSON.stringify(body ?? null);

    return new Response(bodyText, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        [PRELOADED_HEADER]: "1",
      },
    });
  };

  window[WINDOW_INSTALLED_KEY] = true;
};

export default installPreloadedFetchInterceptor;
