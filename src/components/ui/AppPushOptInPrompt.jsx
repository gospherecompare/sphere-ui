import React, { useCallback, useEffect, useRef, useState } from "react";
import { FaArrowRight, FaBell } from "react-icons/fa";
import {
  DEFAULT_PUBLIC_PUSH_TOPICS,
  removePublicPushSubscription,
  subscribeToForegroundPublicPush,
  subscribeToPublicPush,
} from "../../lib/publicPushNotifications";

// Keep the existing key so people who already deferred or blocked retain
// their current 12-hour cooldown.
const PROMPT_DEFERRED_AT_KEY = "mobilesx-notification-denied-at";
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

const readPromptDeferredAt = () => {
  try {
    const value = Number(window.localStorage.getItem(PROMPT_DEFERRED_AT_KEY));
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch {
    return 0;
  }
};

const deferPromptUntil = (timestamp) => {
  try {
    window.localStorage.setItem(PROMPT_DEFERRED_AT_KEY, String(timestamp));
  } catch {
    // The permission choice still applies if browser storage is unavailable.
  }
};

const clearDeniedAt = () => {
  try {
    window.localStorage.removeItem(PROMPT_DEFERRED_AT_KEY);
  } catch {
    // Push registration does not depend on browser storage.
  }
};

const shouldShowInitialGate = () => {
  const permission = getBrowserNotificationPermission();
  if (permission !== "default" && permission !== "denied") return false;

  const deferredAt = readPromptDeferredAt();
  return !deferredAt || Date.now() - deferredAt >= DENIED_COOLDOWN_MS;
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
    if (
      (permission !== "denied" && permission !== "default") ||
      gateVisible
    ) {
      return undefined;
    }

    let deferredAt = readPromptDeferredAt();
    if (!deferredAt) {
      deferredAt = Date.now();
      deferPromptUntil(deferredAt);
    }
    const remainingMs = deferredAt + DENIED_COOLDOWN_MS - Date.now();
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

  const handleNotNow = () => {
    deferPromptUntil(Date.now());
    setGateVisible(false);
    setError("");
  };

  if (gateVisible) {
    const isBlocked = permission === "denied";

    return (
      <div className="fixed inset-0 z-[100] flex min-h-[100dvh] items-end justify-center overflow-y-auto bg-slate-950/55 px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 backdrop-blur-md sm:px-6 sm:pb-6">
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="notification-gate-title"
          className="flex w-full max-w-[2000px] flex-col gap-5 rounded-2xl border border-slate-300 bg-white p-4 shadow-[0_24px_80px_rgba(2,6,23,0.28)] sm:gap-6 sm:p-6 md:flex-row md:items-center md:justify-between md:gap-8 md:p-7"
        >
          <div className="flex min-w-0 flex-1 items-center gap-4 sm:gap-6">
            <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[27px] text-blue-700 sm:h-16 sm:w-16 sm:text-3xl">
              <FaBell aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-2xl font-extrabold leading-none tracking-tight text-slate-950 sm:text-3xl">
                Mobiles<span className="text-sky-500">X</span>
              </p>
              <h1
                id="notification-gate-title"
                className="mt-2 text-lg font-bold leading-tight text-slate-950 sm:text-2xl"
              >
                Enable notifications to continue
              </h1>
              <p className="mt-1.5 text-xs leading-5 text-slate-600 sm:text-sm">
                Get product launch, technology news, and price-drop alerts.
              </p>
              {error ? (
                <p
                  role="alert"
                  className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs leading-5 text-rose-800 sm:text-sm"
                >
                  {error}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-2 border-t border-slate-200 pt-4 sm:flex-row md:border-l md:border-t-0 md:pl-6 md:pt-0">
            <button
              type="button"
              onClick={
                isBlocked
                  ? handleRetryAfterSettingsChange
                  : handleRequestPermission
              }
              disabled={busy}
              className="inline-flex min-h-14 w-full items-center justify-center gap-4 rounded-lg bg-blue-700 px-8 py-3 text-base font-bold text-white shadow-sm transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 disabled:cursor-wait disabled:opacity-60 sm:min-w-44 sm:text-xl md:min-h-16 md:px-10 md:w-auto"
            >
              {busy
                ? isBlocked
                  ? "Checking..."
                  : "Opening..."
                : "Allow"}
              <FaArrowRight aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={handleNotNow}
              disabled={busy}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-slate-100 px-7 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-300 disabled:opacity-60 sm:min-w-36 md:min-h-14 md:w-auto md:text-base"
            >
              Not now
            </button>
          </div>
        </section>
      </div>
    );
  }

  return children;
};

export default AppPushOptInPrompt;
