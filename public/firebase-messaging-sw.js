const isRecord = (value) => value && typeof value === "object";
const ASSET_CACHE_NAME = "hooks-assets-v1";

const isCacheableAssetRequest = (request) => {
  if (request.method !== "GET") return false;

  try {
    const url = new URL(request.url);
    if (url.origin !== self.location.origin) return false;
    if (!url.pathname.startsWith("/assets/")) return false;

    return ["script", "style", "font", "image"].includes(
      request.destination,
    );
  } catch {
    return false;
  }
};

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter(
              (cacheName) =>
                cacheName.startsWith("hooks-assets-") &&
                cacheName !== ASSET_CACHE_NAME,
            )
            .map((cacheName) => caches.delete(cacheName)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (!isCacheableAssetRequest(event.request)) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then((response) => {
        if (!response.ok) return response;

        const responseCopy = response.clone();
        caches.open(ASSET_CACHE_NAME).then((cache) =>
          cache.put(event.request, responseCopy),
        );
        return response;
      });
    }),
  );
});

const toAbsoluteUrl = (value) => {
  const rawValue = String(value || "").trim();
  if (!rawValue) return "";

  try {
    const parsed = new URL(rawValue, self.location.origin);
    if (!/^https?:$/i.test(parsed.protocol)) return "";
    return parsed.href;
  } catch {
    return "";
  }
};

const normalizeSlugPath = (value = "") =>
  String(value || "")
    .trim()
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");

const encodeSlugPath = (value = "") =>
  normalizeSlugPath(value)
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");

const resolveRoutePrefix = (value = "") => {
  const hint = String(value || "").trim().toLowerCase();

  if (!hint) return "";
  if (
    /^(?:news|article|story|blog|journal)$/.test(hint) ||
    hint.includes("news")
  ) {
    return "/news";
  }
  if (
    /(?:smartphone|mobile|phone|handset|android|iphone)/.test(hint)
  ) {
    return "/smartphones";
  }
  if (/(?:tv|television|vision|appliance)/.test(hint)) {
    return "/tvs";
  }
  if (/(?:network|router|wifi)/.test(hint)) {
    return "/networking";
  }
  if (/(?:compare|comparison)/.test(hint)) {
    return "/compare";
  }

  return "";
};

const buildUrlFromSlug = (value, routeHint = "") => {
  const slugPath = encodeSlugPath(value);
  if (!slugPath) return "";

  const routePrefix = resolveRoutePrefix(routeHint) || "/news";
  return toAbsoluteUrl(`${routePrefix}/${slugPath}`);
};

const resolveNotificationTargetUrl = (notification) => {
  const queue = [notification?.data];
  const seen = new Set();

  while (queue.length) {
    const current = queue.shift();
    if (!isRecord(current) || seen.has(current)) continue;
    seen.add(current);

    const candidateUrl =
      toAbsoluteUrl(current.url) ||
      toAbsoluteUrl(current.targetUrl) ||
      toAbsoluteUrl(current.canonicalUrl) ||
      toAbsoluteUrl(current.link) ||
      toAbsoluteUrl(current.href) ||
      toAbsoluteUrl(current.route) ||
      toAbsoluteUrl(current.path) ||
      toAbsoluteUrl(current.targetPath) ||
      toAbsoluteUrl(current.canonicalPath) ||
      toAbsoluteUrl(current.pathname) ||
      toAbsoluteUrl(current.deepLink) ||
      toAbsoluteUrl(current.click_action) ||
      buildUrlFromSlug(
        current.slug,
        current.routeBase ||
          current.basePath ||
          current.section ||
          current.category ||
          current.type ||
          current.productType ||
          current.entityType,
      );

    if (candidateUrl) return candidateUrl;

    [
      current.FCM_MSG,
      current.data,
      current.fcmOptions,
      current.notification,
      current.webpush,
    ].forEach((value) => {
      if (isRecord(value)) queue.push(value);
    });
  }

  return `${self.location.origin}/`;
};

const urlsMatch = (left, right) => {
  try {
    const leftUrl = new URL(left);
    const rightUrl = new URL(right);
    return (
      leftUrl.origin === rightUrl.origin &&
      leftUrl.pathname === rightUrl.pathname &&
      leftUrl.search === rightUrl.search
    );
  } catch {
    return left === right;
  }
};

self.addEventListener("notificationclick", (event) => {
  const targetUrl = resolveNotificationTargetUrl(event.notification);

  event.notification?.close();

  event.waitUntil(
    (async () => {
      const windowClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      for (const client of windowClients) {
        if (urlsMatch(client.url, targetUrl) && "focus" in client) {
          return client.focus();
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }

      return undefined;
    })(),
  );
});
