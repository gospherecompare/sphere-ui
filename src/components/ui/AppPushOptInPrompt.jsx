import React, { useCallback, useEffect, useState } from "react";
import { FaBell, FaTimes } from "react-icons/fa";
import {
  DEFAULT_PUBLIC_PUSH_TOPICS,
  removePublicPushSubscription,
  subscribeToForegroundPublicPush,
  subscribeToPublicPush,
} from "../../lib/publicPushNotifications";

const DISMISSED_PROMPT_KEY = "mobilesx-notification-prompt-dismissed";

const getBrowserNotificationPermission = () =>
  typeof window !== "undefined" && "Notification" in window
    ? Notification.permission
    : "unsupported";

const hasDismissedPrompt = () => {
  try {
    return window.localStorage.getItem(DISMISSED_PROMPT_KEY) === "true";
  } catch {
    return false;
  }
};

const rememberPromptDismissal = () => {
  try {
    window.localStorage.setItem(DISMISSED_PROMPT_KEY, "true");
  } catch {
    // The prompt remains dismissible even when browser storage is unavailable.
  }
};

const clearPromptDismissal = () => {
  try {
    window.localStorage.removeItem(DISMISSED_PROMPT_KEY);
  } catch {
    // Subscription setup does not depend on local browser storage.
  }
};

const AppPushOptInPrompt = ({ children }) => {
  const [permission, setPermission] = useState("default");
  const [messaging, setMessaging] = useState(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [promptOpen, setPromptOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const registerSubscription = useCallback(async () => {
    const subscription = await subscribeToPublicPush({
      topics: DEFAULT_PUBLIC_PUSH_TOPICS,
    });
    setMessaging(subscription.messaging);
    setIsSubscribed(true);
    setPermission("granted");
    setError("");
    clearPromptDismissal();
  }, []);

  useEffect(() => {
    let active = true;
    let promptTimer;

    if (
      typeof window === "undefined" ||
      !window.isSecureContext ||
      !("Notification" in window)
    ) {
      setPermission("unsupported");
      return () => {
        active = false;
      };
    }

    const currentPermission = Notification.permission;
    setPermission(currentPermission);

    if (currentPermission === "granted") {
      void registerSubscription().catch((registrationError) => {
        if (!active) return;
        console.error("Could not restore MobilesX push registration:", registrationError);
        setError("Notifications are allowed, but setup could not finish. Try again.");
        setPromptOpen(true);
      });
    } else if (currentPermission === "denied") {
      void removePublicPushSubscription().catch((removeError) =>
        console.error("Could not remove the blocked push subscription:", removeError),
      );
    } else if (!hasDismissedPrompt()) {
      promptTimer = window.setTimeout(() => {
        if (active) setPromptOpen(true);
      }, 900);
    }

    return () => {
      active = false;
      if (promptTimer) window.clearTimeout(promptTimer);
    };
  }, [registerSubscription]);

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
    if (!isSubscribed) return undefined;
    const checkPermission = () => {
      const nextPermission = getBrowserNotificationPermission();
      if (nextPermission === "granted") return;
      setPermission(nextPermission);
      setMessaging(null);
      setIsSubscribed(false);
      void removePublicPushSubscription().catch((removeError) =>
        console.error("Could not remove the revoked push subscription:", removeError),
      );
    };
    document.addEventListener("visibilitychange", checkPermission);
    return () =>
      document.removeEventListener("visibilitychange", checkPermission);
  }, [isSubscribed]);

  const handleDismiss = () => {
    setPromptOpen(false);
    setError("");
    rememberPromptDismissal();
  };

  const handleEnable = async () => {
    setBusy(true);
    setError("");
    try {
      if (!("Notification" in window)) {
        throw new Error("This browser does not support notifications.");
      }

      // Request permission synchronously from this button click. Chrome owns
      // the native prompt shown to the visitor.
      const permissionRequest =
        Notification.permission === "default"
          ? Notification.requestPermission()
          : Promise.resolve(Notification.permission);
      const result = await permissionRequest;
      setPermission(result);

      if (result !== "granted") {
        setPromptOpen(false);
        rememberPromptDismissal();
        if (result === "denied") {
          void removePublicPushSubscription().catch((removeError) =>
            console.error("Could not remove the denied push subscription:", removeError),
          );
        }
        return;
      }

      await registerSubscription();
      setPromptOpen(false);
    } catch (enableError) {
      console.error("Could not enable MobilesX browser notifications:", enableError);
      setError(
        enableError?.message ||
          "Notifications could not be set up. Please try again.",
      );
      setPromptOpen(true);
    } finally {
      setBusy(false);
    }
  };

  const handleRetryAfterSettingsChange = async () => {
    setBusy(true);
    setError("");
    try {
      const currentPermission = getBrowserNotificationPermission();
      setPermission(currentPermission);

      if (currentPermission === "granted") {
        await registerSubscription();
        setPromptOpen(false);
      } else if (currentPermission === "default") {
        const result = await Notification.requestPermission();
        setPermission(result);
        if (result === "granted") {
          await registerSubscription();
          setPromptOpen(false);
        } else if (result === "denied") {
          setError(
            "Notifications are still blocked. Allow them in this site's browser settings, then retry.",
          );
        } else {
          setPromptOpen(false);
          rememberPromptDismissal();
        }
      } else {
        setError(
          "Notifications are still blocked. Allow them in this site's browser settings, then retry.",
        );
      }
    } catch (retryError) {
      console.error("Could not restore MobilesX browser notifications:", retryError);
      setError(
        retryError?.message || "Notifications could not be set up. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  const isBlocked = permission === "denied";
  const showLauncher =
    permission !== "unsupported" && !isSubscribed && !promptOpen;

  return (
    <>
      {children}

      {showLauncher ? (
        <button
          type="button"
          onClick={() => {
            setError("");
            setPermission(getBrowserNotificationPermission());
            setPromptOpen(true);
          }}
          aria-label="Enable MobilesX notifications"
          title="Enable notifications"
          className="fixed bottom-[calc(82px+env(safe-area-inset-bottom))] right-4 z-[70] inline-flex h-12 w-12 items-center justify-center rounded-full border border-blue-100 bg-white text-blue-700 shadow-lg shadow-slate-900/10 transition hover:-translate-y-0.5 hover:bg-blue-50 lg:bottom-5 lg:right-5"
        >
          <FaBell aria-hidden="true" />
        </button>
      ) : null}

      {promptOpen ? (
        <aside
          aria-label="MobilesX notification prompt"
          className="fixed inset-x-4 bottom-[calc(82px+env(safe-area-inset-bottom))] z-[90] rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.24)] sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[370px] sm:p-6"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-lg text-blue-700">
                <FaBell aria-hidden="true" />
              </span>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-700">
                  MobilesX updates
                </p>
                <h2 className="mt-1 text-lg font-bold leading-tight text-slate-950">
                  {isBlocked
                    ? "Turn on notifications"
                    : permission === "granted"
                      ? "Finish setting up notifications"
                      : "Get notifications?"}
                </h2>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Dismiss notification prompt"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100"
            >
              <FaTimes aria-hidden="true" />
            </button>
          </div>

          <p className="mt-4 text-sm leading-6 text-slate-600">
            {isBlocked
              ? "Notifications are blocked for MobilesX. If you want to enable them, open this site's browser settings, allow notifications, then come back and try again."
              : permission === "granted"
                ? "Your browser allows notifications, but MobilesX could not finish push setup. Retry to complete setup."
                : "Get product launch alerts, technology news, and price-drop updates from MobilesX."}
          </p>

          {error ? (
            <p
              role="alert"
              className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm leading-5 text-rose-800"
            >
              {error}
            </p>
          ) : null}

          <button
            type="button"
            onClick={isBlocked ? handleRetryAfterSettingsChange : handleEnable}
            disabled={busy}
            className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-blue-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 disabled:cursor-wait disabled:opacity-60"
          >
            {busy
              ? "Enabling notifications..."
              : isBlocked
                ? "I've updated settings — retry"
                : permission === "granted"
                  ? "Retry setup"
                  : "Enable notifications"}
          </button>
        </aside>
      ) : null}
    </>
  );
};

export default AppPushOptInPrompt;
