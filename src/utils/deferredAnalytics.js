const scheduleIdle = (callback) => {
  if (typeof window === "undefined") return;
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(callback, { timeout: 2500 });
    return;
  }
  window.setTimeout(callback, 900);
};

const toJsonBlob = (value) =>
  new Blob([JSON.stringify(value ?? {})], { type: "application/json" });

export const sendDeferredPost = (url, body = {}) => {
  if (!url || typeof window === "undefined") return;

  scheduleIdle(() => {
    try {
      if (
        typeof navigator !== "undefined" &&
        typeof navigator.sendBeacon === "function"
      ) {
        navigator.sendBeacon(url, toJsonBlob(body));
        return;
      }
    } catch {
      // Fall through to fetch.
    }

    try {
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body ?? {}),
        keepalive: true,
      }).catch(() => {});
    } catch {
      // Best-effort analytics should never affect page rendering.
    }
  });
};

export const sendDeferredProductView = (productId) => {
  const pid = Number(productId);
  if (!Number.isInteger(pid) || pid <= 0) return;
  sendDeferredPost(
    `https://api.apisphere.in/api/public/product/${pid}/view`,
    {},
  );
};
