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

  const handleNotNow = () => {
    deferPromptUntil(Date.now());
    setGateVisible(false);
    setError("");
  };

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
        handleNotNow();
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
          handleNotNow();
        }
      } else {
        setError(
          "Still blocked. Allow notifications for this site in your browser settings, then tap Check again.",
        );
      }
    } catch (retryError) {
      console.error("Could not restore MobilesX browser notifications:", retryError);
      setError("The browser permission could not be checked. Please retry.");
    } finally {
      setBusy(false);
    }
  };

  if (gateVisible) {
    const isBlocked = permission === "denied";

    return (
      <div className="fixed inset-0 z-[100] flex min-h-[100dvh] items-end justify-center overflow-y-auto bg-slate-950/55 px-2 pb-0 pt-4 backdrop-blur-md sm:px-4 sm:py-6">
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="notification-gate-title"
          className="flex w-full max-w-5xl flex-col gap-4 rounded-t-2xl rounded-b-none border border-b-0 border-slate-300 bg-white px-4 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-[0_-12px_40px_rgba(2,6,23,0.2)] sm:gap-5 sm:rounded-2xl sm:border-b sm:p-5 sm:shadow-[0_18px_60px_rgba(5,18,42,0.22)] lg:flex-row lg:items-center lg:justify-between lg:gap-8 lg:p-8"
        >
          <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center sm:gap-5">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xl text-blue-700 sm:h-14 sm:w-14 sm:text-2xl lg:h-16 lg:w-16 lg:text-3xl">
              <FaBell aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-xl font-extrabold leading-none tracking-tight text-slate-950 sm:text-2xl lg:text-3xl">
                Mobiles<span className="text-sky-500">X</span>
              </p>
              <h1
                id="notification-gate-title"
                className="mt-1.5 text-base font-bold leading-tight text-slate-950 sm:mt-2 sm:text-lg lg:text-2xl"
              >
                Enable notifications to continue
              </h1>
              <p className="mt-1.5 text-xs leading-[1.45] text-slate-600 sm:text-sm sm:leading-5">
                Get product launch, technology news, and price-drop alerts.
              </p>
              {isBlocked ? (
                <p
                  role="status"
                  className="mt-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs leading-5 text-blue-900 sm:text-sm"
                >
                  {error ||
                    "Notifications are blocked for this site. Allow them in your browser settings, then tap Check again."}
                </p>
              ) : error ? (
                <p
                  role="alert"
                  className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs leading-5 text-rose-800 sm:text-sm"
                >
                  {error}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex w-full shrink-0 flex-col gap-2 border-t border-slate-200 pt-4 sm:flex-row lg:w-auto lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            <button
              type="button"
              onClick={
                isBlocked
                  ? handleRetryAfterSettingsChange
                  : handleRequestPermission
              }
              disabled={busy}
              className="inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-lg bg-blue-700 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 disabled:cursor-wait disabled:opacity-60 sm:min-h-14 sm:min-w-44 sm:px-8 sm:text-base lg:min-h-16 lg:w-auto lg:px-10 lg:text-xl"
            >
              {busy
                ? isBlocked
                  ? "Checking..."
                  : "Opening..."
                : isBlocked
                  ? "Check again"
                  : "Allow"}
              <FaArrowRight aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={handleNotNow}
              disabled={busy}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-slate-100 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-300 disabled:opacity-60 sm:min-h-14 sm:min-w-36 sm:px-7 lg:w-auto lg:text-base"
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
