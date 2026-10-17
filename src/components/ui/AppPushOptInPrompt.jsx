import React, { useCallback, useEffect, useRef, useState } from "react";
import { FaBell, FaCheck } from "react-icons/fa";
import {
  DEFAULT_PUBLIC_PUSH_TOPICS,
  removePublicPushSubscription,
  subscribeToForegroundPublicPush,
  subscribeToPublicPush,
} from "../../lib/publicPushNotifications";

const DENIED_AT_KEY = "mobilesx-notification-denied-at";
const DENIED_COOLDOWN_MS = 12 * 60 * 60 * 1000;

const getBrowserNotificationPermission = () => {
  if (
    typeof window === "undefined" ||
    !window.isSecureContext ||
    !("Notification" in window)
  ) {
    return "unsupported";
  }
  return Notification.permission;
};

const readDeniedAt = () => {
  try {
    const value = Number(window.localStorage.getItem(DENIED_AT_KEY));
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch {
    return 0;
  }
};

const writeDeniedAt = (timestamp) => {
  try {
    window.localStorage.setItem(DENIED_AT_KEY, String(timestamp));
  } catch {
    // The permission choice still applies if browser storage is unavailable.
  }
};

const clearDeniedAt = () => {
  try {
    window.localStorage.removeItem(DENIED_AT_KEY);
  } catch {
    // Push registration does not depend on browser storage.
  }
};

const shouldShowInitialGate = () => {
  const permission = getBrowserNotificationPermission();
  if (permission === "default") return true;
  if (permission !== "denied") return false;

  const deniedAt = readDeniedAt();
  if (!deniedAt) return false;
  return Date.now() - deniedAt >= DENIED_COOLDOWN_MS;
};

const AppPushOptInPrompt = ({ children }) => {
  const [permission, setPermission] = useState(getBrowserNotificationPermission);
  const [gateVisible, setGateVisible] = useState(shouldShowInitialGate);
  const [messaging, setMessaging] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const registrationInFlight = useRef(null);

  const registerSubscription = useCallback(async () => {
    if (!registrationInFlight.current) {
      registrationInFlight.current = subscribeToPublicPush({
        topics: DEFAULT_PUBLIC_PUSH_TOPICS,
      }).then((subscription) => {
        setMessaging(subscription.messaging);
        return subscription;
      }).finally(() => {
        registrationInFlight.current = null;
      });
    }
    return registrationInFlight.current;
  }, []);

  const acceptGrantedPermission = useCallback(() => {
    setPermission("granted");
    setGateVisible(false);
    setError("");
    clearDeniedAt();
    void registerSubscription().catch((registrationError) => {
      // Permission has already been granted, so let the visitor continue while
      // recording setup failures for server-side troubleshooting.
      console.error("Could not register MobilesX browser notifications:", registrationError);
    });
  }, [registerSubscription]);

  const acceptBlockedPermission = useCallback(() => {
    setPermission("denied");
    setGateVisible(false);
    setError("");
    writeDeniedAt(Date.now());
    setMessaging(null);
    void removePublicPushSubscription().catch((removeError) =>
      console.error("Could not remove the blocked push subscription:", removeError),
    );
  }, []);

  useEffect(() => {
    const currentPermission = getBrowserNotificationPermission();
    setPermission(currentPermission);

    if (currentPermission === "granted") {
      acceptGrantedPermission();
    } else if (currentPermission === "denied") {
      void removePublicPushSubscription().catch((removeError) =>
        console.error("Could not remove the blocked push subscription:", removeError),
      );
    }
  }, [acceptGrantedPermission]);

  useEffect(() => {
    if (permission !== "denied" || gateVisible) return undefined;

    let deniedAt = readDeniedAt();
    if (!deniedAt) {
      deniedAt = Date.now();
      writeDeniedAt(deniedAt);
    }
    const remainingMs = deniedAt + DENIED_COOLDOWN_MS - Date.now();
    if (remainingMs <= 0) {
      setGateVisible(true);
      return undefined;
    }

    const timeout = window.setTimeout(
      () => setGateVisible(true),
      remainingMs,
    );
    return () => window.clearTimeout(timeout);
  }, [permission, gateVisible]);

  useEffect(() => {
    if (!messaging) return undefined;

    return subscribeToForegroundPublicPush(messaging, async (payload) => {
      if (Notification.permission !== "granted") return;
      const data = payload?.data || {};
      const topic = String(data.topic || "");

      let targetUrl = "/";
      try {
        const candidate = new URL(data.url || "/", window.location.origin);
        if (candidate.origin === window.location.origin) {
          targetUrl = candidate.href;
        }
      } catch {
        targetUrl = "/";
      }

      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(
        String(data.title || "MobilesX update"),
        {
          body: String(data.body || "There is a new update on MobilesX."),
          icon: "/mobilex-favicon.svg",
          badge: "/mobilex-favicon.svg",
          tag: `mobilesx-${topic || "update"}-${data.eventId || Date.now()}`,
          data: { url: targetUrl },
        },
      );
    });
  }, [messaging]);

  useEffect(() => {
    const refreshPermission = () => {
      const currentPermission = getBrowserNotificationPermission();
      if (currentPermission === permission) return;

      if (currentPermission === "granted") {
        acceptGrantedPermission();
      } else if (currentPermission === "denied") {
        acceptBlockedPermission();
      } else {
        setPermission(currentPermission);
        setMessaging(null);
        setError("");
        setGateVisible(currentPermission === "default");
        void removePublicPushSubscription().catch((removeError) =>
          console.error("Could not remove the reset push subscription:", removeError),
        );
      }
    };

    document.addEventListener("visibilitychange", refreshPermission);
    return () =>
      document.removeEventListener("visibilitychange", refreshPermission);
  }, [acceptBlockedPermission, acceptGrantedPermission, permission]);

  const handleRequestPermission = async () => {
    setBusy(true);
    setError("");
    try {
      // Call from this button's click so the browser controls the native prompt.
      const permissionRequest = Notification.requestPermission();
      const result = await permissionRequest;
      if (result === "granted") {
        acceptGrantedPermission();
      } else if (result === "denied") {
        acceptBlockedPermission();
      } else {
        setError("Choose Allow or Block in the browser prompt to continue.");
      }
    } catch (requestError) {
      console.error("The browser notification request failed:", requestError);
      setError("The browser could not open its notification prompt. Please retry.");
    } finally {
      setBusy(false);
    }
  };

  const handleRetryAfterSettingsChange = async () => {
    setBusy(true);
    setError("");
    try {
      const currentPermission = getBrowserNotificationPermission();
      if (currentPermission === "granted") {
        acceptGrantedPermission();
      } else if (currentPermission === "default") {
        const result = await Notification.requestPermission();
        setPermission(result);
        if (result === "granted") {
          acceptGrantedPermission();
        } else if (result === "denied") {
          acceptBlockedPermission();
        } else {
          setError("Choose Allow or Block in the browser prompt to continue.");
        }
      } else {
        setError(
          "Notifications are still blocked. Change this site's notification permission in your browser settings, then retry or continue without notifications.",
        );
      }
    } catch (retryError) {
      console.error("Could not restore MobilesX browser notifications:", retryError);
      setError("The browser permission could not be checked. Please retry.");
    } finally {
      setBusy(false);
    }
  };

  const handleContinueBlocked = () => {
    writeDeniedAt(Date.now());
    setGateVisible(false);
    setError("");
  };

  if (gateVisible) {
    const isBlocked = permission === "denied";

    return (
      <div className="fixed inset-0 z-[100] flex min-h-[100dvh] items-center justify-center overflow-y-auto bg-slate-950/55 px-4 py-6 backdrop-blur-sm sm:px-6">
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="notification-gate-title"
          className="my-auto w-full max-w-md rounded-[28px] border border-white/70 bg-white p-5 shadow-[0_30px_100px_rgba(2,6,23,0.35)] sm:p-8"
        >
          <div className="flex items-start gap-4">
            <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-xl text-blue-700">
              <FaBell aria-hidden="true" />
            </span>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-700">
                MobilesX updates
              </p>
              <h1
                id="notification-gate-title"
                className="mt-1 text-xl font-bold leading-tight text-slate-950 sm:text-2xl"
              >
                {isBlocked ? "Notifications are blocked" : "Get notifications?"}
              </h1>
            </div>
          </div>

          <p className="mt-5 text-sm leading-6 text-slate-600">
            {isBlocked
              ? "Your browser has blocked MobilesX notifications. Change this site's notification permission in browser settings to enable product launches, technology news, and price-drop alerts."
              : "Get timely alerts for product launches, technology news, and price drops. Choose Allow or Block in your browser prompt to continue to MobilesX."}
          </p>

          {error ? (
            <p
              role="alert"
              className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-800"
            >
              {error}
            </p>
          ) : null}

          {isBlocked ? (
            <div className="mt-6 flex flex-col gap-3">
              <button
                type="button"
                onClick={handleRetryAfterSettingsChange}
                disabled={busy}
                className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-blue-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 disabled:cursor-wait disabled:opacity-60"
              >
                {busy ? "Checking settings..." : "Retry after settings change"}
              </button>
              <button
                type="button"
                onClick={handleContinueBlocked}
                disabled={busy}
                className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
              >
                Continue with notifications blocked
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleRequestPermission}
              disabled={busy}
              className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-blue-700 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-900/15 transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 disabled:cursor-wait disabled:opacity-60"
            >
              <FaCheck aria-hidden="true" />
              {busy ? "Opening browser prompt..." : "Enable notifications"}
            </button>
          )}

          <p className="mt-4 text-center text-xs leading-5 text-slate-500">
            {isBlocked
              ? "We'll ask again in 12 hours if you continue without notifications."
              : "MobilesX opens the app after you choose Allow or Block."}
          </p>
        </section>
      </div>
    );
  }

  return children;
};

export default AppPushOptInPrompt;
