const WINDOW_INSTALLED_KEY = "__HOOKS_API_ALIAS_FETCH_INSTALLED__";

const API_ALIAS_RULES = [
  { from: /^\/api\/smartphones$/i, to: "/api/gateway/catalog/handset" },
  { from: /^\/api\/networking$/i, to: "/api/gateway/catalog/network-grid" },
  { from: /^\/api\/laptops$/i, to: "/api/gateway/catalog/compute" },
  { from: /^\/api\/tvs$/i, to: "/api/gateway/catalog/vision" },
  { from: /^\/api\/brand$/i, to: "/api/gateway/meta/label" },
  { from: /^\/api\/category$/i, to: "/api/gateway/meta/group" },
  { from: /^\/api\/public\/online-stores$/i, to: "/api/gateway/channel/stores" },
  { from: /^\/api\/public\/popular-features$/i, to: "/api/gateway/insight/features" },
  { from: /^\/api\/public\/trending\/smartphones$/i, to: "/api/gateway/pulse/handset" },
  { from: /^\/api\/public\/trending\/laptops$/i, to: "/api/gateway/pulse/compute" },
  { from: /^\/api\/public\/trending\/tvs$/i, to: "/api/gateway/pulse/vision" },
  { from: /^\/api\/public\/trending\/networking$/i, to: "/api/gateway/pulse/network-grid" },
  { from: /^\/api\/public\/trending\/most-compared$/i, to: "/api/gateway/pulse/duel" },
  { from: /^\/api\/public\/trending\/all$/i, to: "/api/gateway/pulse/all" },
  { from: /^\/api\/public\/new\/smartphones$/i, to: "/api/gateway/release/handset" },
  { from: /^\/api\/public\/new\/laptops$/i, to: "/api/gateway/release/compute" },
  { from: /^\/api\/public\/new\/tvs$/i, to: "/api/gateway/release/vision" },
  { from: /^\/api\/public\/new\/networking$/i, to: "/api/gateway/release/network-grid" },
  { from: /^\/api\/public\/feature-click$/i, to: "/api/gateway/event/feature" },
  { from: /^\/api\/public\/compare$/i, to: "/api/gateway/compare/log" },
  { from: /^\/api\/public\/compare\/scores$/i, to: "/api/gateway/compare/score" },
  { from: /^\/api\/public\/compare\/resolve$/i, to: "/api/gateway/compare/resolve" },
  { from: /^\/api\/search$/i, to: "/api/gateway/query/finder" },
  { from: /^\/api\/public\/blogs$/i, to: "/api/gateway/journal/posts" },
  {
    from: /^\/api\/public\/blogs\/([^/]+)$/i,
    to: (_m, slug) => `/api/gateway/journal/posts/${slug}`,
  },
  {
    from: /^\/api\/public\/product\/([^/]+)$/i,
    to: (_m, id) => `/api/gateway/node/${id}`,
  },
  {
    from: /^\/api\/public\/product\/([^/]+)\/view$/i,
    to: (_m, id) => `/api/gateway/node/${id}/hit`,
  },
  {
    from: /^\/api\/public\/product\/([^/]+)\/discovery$/i,
    to: (_m, id) => `/api/gateway/node/${id}/discovery`,
  },
  {
    from: /^\/api\/public\/product\/([^/]+)\/competitors$/i,
    to: (_m, id) => `/api/gateway/node/${id}/peers`,
  },
  {
    from: /^\/api\/public\/products\/([^/]+)\/ratings$/i,
    to: (_m, id) => `/api/gateway/node/${id}/reviews`,
  },
];

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

const rewriteApiPath = (pathname = "") => {
  for (const rule of API_ALIAS_RULES) {
    const match = String(pathname).match(rule.from);
    if (!match) continue;
    if (typeof rule.to === "function") {
      return rule.to(...match);
    }
    return rule.to;
  }
  return null;
};

const isAliasEligible = (url) => {
  if (!url || typeof url !== "object") return false;
  if (!String(url.pathname || "").startsWith("/api/")) return false;
  const host = String(url.hostname || "").toLowerCase();
  return (
    url.origin === window.location.origin ||
    host === "api.apisphere.in" ||
    host === "localhost" ||
    host === "127.0.0.1"
  );
};

export const installApiAliasFetch = () => {
  if (typeof window === "undefined") return;
  if (window[WINDOW_INSTALLED_KEY]) return;
  if (typeof window.fetch !== "function") return;

  const nativeFetch = window.fetch.bind(window);

  window.fetch = (input, init = undefined) => {
    const requestUrl = toRequestUrl(input);
    if (!requestUrl) return nativeFetch(input, init);

    let parsed;
    try {
      parsed = new URL(requestUrl, window.location.origin);
    } catch {
      return nativeFetch(input, init);
    }

    if (!isAliasEligible(parsed)) {
      return nativeFetch(input, init);
    }

    const rewrittenPath = rewriteApiPath(parsed.pathname);
    if (!rewrittenPath || rewrittenPath === parsed.pathname) {
      return nativeFetch(input, init);
    }

    parsed.pathname = rewrittenPath;
    const nextUrl = parsed.toString();

    if (typeof input === "object" && input instanceof Request) {
      if (init) {
        return nativeFetch(nextUrl, init);
      }
      return nativeFetch(new Request(nextUrl, input));
    }

    return nativeFetch(nextUrl, init);
  };

  window[WINDOW_INSTALLED_KEY] = true;
};

export default installApiAliasFetch;
