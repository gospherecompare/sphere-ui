import React, { useEffect, useState } from "react";
import { FaBell, FaCheck, FaTimes } from "react-icons/fa";
import {
  checkPublicPushAvailability,
  DEFAULT_PUBLIC_PUSH_TOPICS,
  getSavedPublicPushToken,
  normalizePublicPushTopics,
  PUBLIC_PUSH_TOPICS,
  readSavedPublicPushTopics,
  removePublicPushSubscription,
  subscribeToForegroundPublicPush,
  subscribeToPublicPush,
  syncPublicPushSubscription,
  updatePublicPushTopics,
} from "../../lib/publicPushNotifications";

const hasSelectedTopic = (topics) => Object.values(topics).some(Boolean);
const getBrowserNotificationPermission = () =>
  typeof window !== "undefined" && "Notification" in window
    ? Notification.permission
    : "unsupported";

const TopicChoices = ({ topics, onChange, disabled = false }) => (
  <>
    <fieldset className="mt-5 space-y-2" disabled={disabled}>
      <legend className="mb-3 text-sm font-semibold text-slate-800">
        Choose notification categories
      </legend>
      {Object.entries(PUBLIC_PUSH_TOPICS).map(([topic, label]) => (
        <label
          key={topic}
          className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 transition hover:border-blue-300 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50"
        >
          <span className="text-sm font-medium text-slate-700">{label}</span>
          <input
            type="checkbox"
            checked={topics[topic] === true}
            onChange={(event) =>
              onChange({ ...topics, [topic]: event.target.checked })
            }
            className="h-4 w-4 accent-blue-600"
          />
        </label>
      ))}
    </fieldset>
    {!disabled && !hasSelectedTopic(topics) ? (
      <p className="mt-3 text-sm font-medium text-rose-700">
        Keep at least one category enabled.
      </p>
    ) : null}
  </>
);

const AppPushOptInPrompt = ({ children }) => {
  const [phase, setPhase] = useState("checking");
  const [topics, setTopics] = useState({ ...DEFAULT_PUBLIC_PUSH_TOPICS });
  const [draftTopics, setDraftTopics] = useState({ ...DEFAULT_PUBLIC_PUSH_TOPICS });
  const [token, setToken] = useState("");
  const [messaging, setMessaging] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const initializeNotifications = async () => {
      const savedTopics = normalizePublicPushTopics(
        readSavedPublicPushTopics(),
      );
      if (active) {
        setTopics(savedTopics);
        setDraftTopics(savedTopics);
      }

      if (
        typeof window === "undefined" ||
        !window.isSecureContext ||
        !("Notification" in window)
      ) {
        throw new Error(
          "This browser cannot provide the required notifications. Open MobilesX in a supported browser over HTTPS to continue.",
        );
      }

      if (Notification.permission !== "granted") {
        await removePublicPushSubscription();
        if (!active) return;
      }

      if (Notification.permission === "denied") {
        if (active) setPhase("denied");
        return;
      }

      if (Notification.permission === "granted") {
        const subscription = await syncPublicPushSubscription({
          topics: savedTopics,
        });
        if (!active) return;
        setToken(subscription.token);
        setMessaging(subscription.messaging);
        setTopics(subscription.topics);
        setDraftTopics(subscription.topics);
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
      if (topic && topics[topic] !== true) return;

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
  }, [messaging, phase, topics]);

  useEffect(() => {
    if (phase !== "ready") return undefined;
    const checkPermission = () => {
      const permission = getBrowserNotificationPermission();
      if (permission !== "granted") {
        setPhase(permission === "denied" ? "denied" : "needs-permission");
        setSettingsOpen(false);
        setError("");
        void removePublicPushSubscription().catch((cleanupError) =>
          console.error("Could not remove the revoked push subscription:", cleanupError),
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
      const subscription = await subscribeToPublicPush({ topics });
      setToken(subscription.token);
      setMessaging(subscription.messaging);
      setTopics(subscription.topics);
      setDraftTopics(subscription.topics);
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
        const subscription = await syncPublicPushSubscription({ topics });
        setToken(subscription.token);
        setMessaging(subscription.messaging);
        setTopics(subscription.topics);
        setDraftTopics(subscription.topics);
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

  const handleSavePreferences = async () => {
    if (!hasSelectedTopic(draftTopics)) {
      setError("Select at least one category to keep using MobilesX.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const result = await updatePublicPushTopics({
        token: token || getSavedPublicPushToken(),
        topics: draftTopics,
      });
      const nextTopics = normalizePublicPushTopics(
        result?.topics || draftTopics,
      );
      setTopics(nextTopics);
      setDraftTopics(nextTopics);
      setMessaging((current) => result?.messaging || current);
      setSettingsOpen(false);
    } catch (saveError) {
      setError(
        saveError?.message || "Notification preferences could not be saved.",
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
              published, or prices drop. Choose at least one category below.
              Your browser will ask you to allow MobilesX notifications.
            </p>

            {phase !== "checking" ? (
              <TopicChoices
                topics={draftTopics}
                onChange={setDraftTopics}
                disabled={busy || phase === "denied" || phase === "error"}
              />
            ) : null}

            {phase === "denied" ? (
              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
                Notifications are blocked for this site. Open your browser’s
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
                Checking browser and Firebase notification support…
              </p>
            ) : phase === "denied" || phase === "error" ? (
              <button
                type="button"
                onClick={handleRetry}
                disabled={busy}
                className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-blue-700 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-800 disabled:cursor-wait disabled:opacity-60"
              >
                {busy ? "Checking…" : "Retry"}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleEnable}
                disabled={busy || !hasSelectedTopic(draftTopics)}
                className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-blue-700 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-900/15 transition hover:bg-blue-800 disabled:cursor-wait disabled:opacity-60"
              >
                <FaCheck aria-hidden="true" />
                {busy
                  ? "Enabling notifications…"
                  : getBrowserNotificationPermission() === "granted"
                    ? "Retry & continue"
                    : "Allow notifications & continue"}
              </button>
            )}

            <p className="mt-3 text-center text-xs leading-5 text-slate-500">
              Notifications are required to continue. You can change the
              categories later in Notification settings.
            </p>
          </section>
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={() => {
              setError("");
              setDraftTopics({ ...topics });
              setSettingsOpen(true);
            }}
            aria-label="Notification settings"
            title="Notification settings"
            className="fixed bottom-[calc(82px+env(safe-area-inset-bottom))] right-4 z-[70] inline-flex h-12 w-12 items-center justify-center rounded-full border border-blue-100 bg-white text-blue-700 shadow-lg shadow-slate-900/10 transition hover:-translate-y-0.5 hover:bg-blue-50 lg:bottom-5 lg:right-5"
          >
            <FaBell aria-hidden="true" />
          </button>

          {settingsOpen ? (
            <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/45 px-4 py-6 backdrop-blur-sm sm:px-6">
              <button
                type="button"
                aria-label="Close notification settings"
                className="absolute inset-0 cursor-default"
                onClick={() => {
                  setSettingsOpen(false);
                  setError("");
                }}
              />
              <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="notification-settings-title"
                className="relative z-[1] my-auto w-full max-w-lg rounded-[30px] border border-white/70 bg-white p-5 shadow-[0_30px_100px_rgba(2,6,23,0.35)] sm:p-8"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-700">
                      MobilesX updates
                    </p>
                    <h2
                      id="notification-settings-title"
                      className="mt-1 text-xl font-bold text-slate-950"
                    >
                      Notification settings
                    </h2>
                  </div>
                  <button
                    type="button"
                    aria-label="Close notification settings"
                    onClick={() => {
                      setSettingsOpen(false);
                      setError("");
                    }}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100"
                  >
                    <FaTimes aria-hidden="true" />
                  </button>
                </div>

                <p className="mt-4 text-sm leading-6 text-slate-600">
                  Choose which MobilesX updates you want to receive. Keep at
                  least one category enabled while notifications are required
                  for app access.
                </p>
                <TopicChoices
                  topics={draftTopics}
                  onChange={setDraftTopics}
                  disabled={busy}
                />
                {error ? (
                  <div
                    role="alert"
                    className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
                  >
                    {error}
                  </div>
                ) : null}
                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setSettingsOpen(false);
                      setError("");
                    }}
                    disabled={busy}
                    className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSavePreferences}
                    disabled={busy || !hasSelectedTopic(draftTopics)}
                    className="inline-flex min-h-11 items-center justify-center rounded-full bg-blue-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {busy ? "Saving…" : "Save preferences"}
                  </button>
                </div>
              </section>
            </div>
          ) : null}
        </>
      )}
    </>
  );
};

export default AppPushOptInPrompt;
