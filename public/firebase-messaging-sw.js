const NEWS_PATH_PREFIX = "/news";

const isRecord = (value) => value && typeof value === "object";

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

const buildNewsUrlFromSlug = (value) => {
  const slug = String(value || "").trim();
  if (!slug) return "";

  return toAbsoluteUrl(`${NEWS_PATH_PREFIX}/${encodeURIComponent(slug)}`);
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
      toAbsoluteUrl(current.link) ||
      toAbsoluteUrl(current.path) ||
      toAbsoluteUrl(current.pathname) ||
      toAbsoluteUrl(current.click_action) ||
      buildNewsUrlFromSlug(current.slug);

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
