import { useEffect, useRef } from "react";

const API_URL = "https://api.apisphere.in/api/public/page-engagement";
const MAX_DURATION_MS = 30 * 60 * 1000;

const clampDuration = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.min(MAX_DURATION_MS, Math.max(0, Math.floor(parsed)));
};

const buildPayload = ({ productId, pagePath, source, durationMs }) => ({
  product_id: productId,
  page_path: pagePath || null,
  source: source || "detail",
  duration_ms: clampDuration(durationMs),
});

const sendEngagement = (payload) => {
  if (typeof window === "undefined") return;

  try {
    const body = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon(API_URL, blob);
      return;
    }

    fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // ignore analytics failures
  }
};

export default function usePageEngagementTracker({
  productId,
  pagePath,
  source = "detail",
  enabled = true,
} = {}) {
  const startedAtRef = useRef(0);
  const sentRef = useRef(false);

  useEffect(() => {
    if (!enabled || !productId || typeof window === "undefined") return undefined;

    startedAtRef.current = Date.now();
    sentRef.current = false;

    const sendOnce = () => {
      if (sentRef.current) return;
      const durationMs = Date.now() - startedAtRef.current;
      sendEngagement(
        buildPayload({
          productId,
          pagePath: pagePath || window.location.pathname,
          source,
          durationMs,
        }),
      );
      sentRef.current = true;
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        sendOnce();
      }
    };

    window.addEventListener("pagehide", sendOnce);
    window.addEventListener("beforeunload", sendOnce);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      sendOnce();
      window.removeEventListener("pagehide", sendOnce);
      window.removeEventListener("beforeunload", sendOnce);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled, pagePath, productId, source]);
}
