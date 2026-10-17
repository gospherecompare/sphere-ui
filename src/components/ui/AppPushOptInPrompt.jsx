import React, { useEffect, useState } from "react";
import { FaBell, FaCheck } from "react-icons/fa";
import {
  checkPublicPushAvailability,
  DEFAULT_PUBLIC_PUSH_TOPICS,
  removePublicPushSubscription,
  subscribeToForegroundPublicPush,
  subscribeToPublicPush,
} from "../../lib/publicPushNotifications";

const getBrowserNotificationPermission = () =>
  typeof window !== "undefined" && "Notification" in window
    ? Notification.permission
    : "unsupported";

const AppPushOptInPrompt = ({ children }) => {
  const [phase, setPhase] = useState("checking");
  const [messaging, setMessaging] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const initializeNotifications = async () => {
      if (
        typeof window === "undefined" ||
        !window.isSecureContext ||
        !("Notification" in window)
      ) {
        throw new Error(
          "This browser cannot provide the required notifications. Open MobilesX in a supported browser over HTTPS to continue.",
        );
      }

      const permission = Notification.permission;
      if (permission !== "granted") {
        await removePublicPushSubscription();
        if (!active) return;
      }

      if (permission === "denied") {
        if (active) setPhase("denied");
        return;
      }

      if (permission === "granted") {
        const subscription = await subscribeToPublicPush({
          topics: DEFAULT_PUBLIC_PUSH_TOPICS,
        });
        if (!active) return;
        setMessaging(subscription.messaging);
        setPhase("ready");
        return;
      }

      await checkPublicPushAvailability();
      if (active) setPhase("needs-permission");
    };

    void initializeNotifications().catch((initializationError) => {
      if (!active) return;
      setError(
        initializationError?.message ||
          "Notifications could not be prepared. Check your connection and retry.",
      );
      setPhase("error");
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (phase !== "ready" || !messaging) return undefined;

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
  }, [messaging, phase]);

  useEffect(() => {
    if (phase !== "ready") return undefined;
    const checkPermission = () => {
      const permission = getBrowserNotificationPermission();
      if (permission !== "granted") {
        setPhase(permission === "denied" ? "denied" : "needs-permission");
        setError("");
        void removePublicPushSubscription().catch((cleanupError) =>
          console.error(
            "Could not remove the revoked push subscription:",
            cleanupError,
          ),
        );
      }
    };
    document.addEventListener("visibilitychange", checkPermission);
    return () =>
      document.removeEventListener("visibilitychange", checkPermission);
  }, [phase]);

  const handleEnable = async () => {
    setBusy(true);
    setError("");
    try {
      const subscription = await subscribeToPublicPush({
        topics: DEFAULT_PUBLIC_PUSH_TOPICS,
      });
      setMessaging(subscription.messaging);
      setPhase("ready");
    } catch (enableError) {
      setError(
        enableError?.message ||
          "Notifications could not be enabled. Check your connection and retry.",
      );
      setPhase(
        getBrowserNotificationPermission() === "denied"
          ? "denied"
          : "needs-permission",
      );
    } finally {
      setBusy(false);
    }
  };

  const handleRetry = async () => {
    setBusy(true);
    setError("");
    try {
      const permission = getBrowserNotificationPermission();
      if (permission === "granted") {
        const subscription = await subscribeToPublicPush({
          topics: DEFAULT_PUBLIC_PUSH_TOPICS,
        });
        setMessaging(subscription.messaging);
        setPhase("ready");
      } else if (permission === "denied") {
        setPhase("denied");
      } else {
        await checkPublicPushAvailability();
        setPhase("needs-permission");
      }
    } catch (retryError) {
      setError(
        retryError?.message ||
          "Notifications are still unavailable. Check your connection and retry.",
      );
      setPhase(
        getBrowserNotificationPermission() === "denied" ? "denied" : "error",
      );
    } finally {
      setBusy(false);
    }
  };

  const blocking = phase !== "ready";

  return (
    <>
      <div inert={blocking ? "" : undefined}>{children}</div>

      {blocking ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/55 px-4 py-6 backdrop-blur-sm sm:px-6">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="notification-gate-title"
            className="my-auto w-full max-w-lg rounded-[30px] border border-white/70 bg-white p-5 shadow-[0_30px_100px_rgba(2,6,23,0.35)] sm:p-8"
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
                  {phase === "checking"
                    ? "Preparing notifications"
                    : phase === "denied"
                      ? "Allow notifications to continue"
                      : phase === "error"
                        ? "Notifications are unavailable"
                        : "Enable notifications to continue"}
                </h1>
              </div>
            </div>

            <p className="mt-5 text-sm leading-6 text-slate-600">
              Get timely alerts when products launch, technology news is
              published, or prices drop. Your browser will ask you to allow
              MobilesX notifications.
            </p>

            {phase === "denied" ? (
              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
                Notifications are blocked for this site. Open your browser's
                site settings, set Notifications to Allow, return here, and
                choose Retry.
              </div>
            ) : null}
            {error ? (
              <div
                role="alert"
                className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-800"
              >
                {error}
              </div>
            ) : null}

            {phase === "checking" ? (
              <p className="mt-6 text-sm font-medium text-slate-500" aria-live="polite">
                Checking browser and Firebase notification support...
              </p>
            ) : phase === "denied" || phase === "error" ? (
              <button
                type="button"
                onClick={handleRetry}
                disabled={busy}
                className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-blue-700 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-800 disabled:cursor-wait disabled:opacity-60"
              >
                {busy ? "Checking..." : "Retry"}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleEnable}
                disabled={busy}
                className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-blue-700 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-900/15 transition hover:bg-blue-800 disabled:cursor-wait disabled:opacity-60"
              >
                <FaCheck aria-hidden="true" />
                {busy
                  ? "Enabling notifications..."
                  : getBrowserNotificationPermission() === "granted"
                    ? "Retry & continue"
                    : "Allow notifications & continue"}
              </button>
            )}

            <p className="mt-3 text-center text-xs leading-5 text-slate-500">
              Notifications are required to continue. All notification types
              are enabled by default; you can turn them off in browser settings.
            </p>
          </section>
        </div>
      ) : null}
    </>
  );
};

export default AppPushOptInPrompt;
