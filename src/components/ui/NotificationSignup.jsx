import { useEffect, useState } from "react";
import { getApps, initializeApp } from "firebase/app";
import {
  deleteToken,
  getMessaging,
  getToken,
  isSupported,
  onMessage,
} from "firebase/messaging";
import { buildApiUrl } from "../../utils/apiUrl";

const TOPICS = [
  { id: "launches", label: "New product launches" },
  { id: "deals", label: "Price drops and deals" },
  { id: "news", label: "Technology news" },
];
const STORAGE_KEY = "mobilesx-fcm-token";
const TOPICS_KEY = "mobilesx-fcm-topics";

const requestJson = async (url, options = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.message || `Request failed (${response.status}).`);
  }
  return result;
};

const getSelectedTopics = (topics) =>
  Object.entries(topics)
    .filter(([, selected]) => selected)
    .map(([topic]) => topic);

const getNotificationMessaging = (config) => {
  const appName = "mobilesx-notifications";
  const app =
    getApps().find((existing) => existing.name === appName) ||
    initializeApp(config, appName);
  return getMessaging(app);
};

const getInitialTopics = () => {
  if (typeof window === "undefined") {
    return Object.fromEntries(TOPICS.map(({ id }) => [id, true]));
  }
  try {
    const saved = JSON.parse(window.localStorage.getItem(TOPICS_KEY) || "{}");
    return Object.fromEntries(
      TOPICS.map(({ id }) => [
        id,
        typeof saved[id] === "boolean" ? saved[id] : true,
      ]),
    );
  } catch {
    return Object.fromEntries(TOPICS.map(({ id }) => [id, true]));
  }
};

export default function NotificationSignup() {
  const [topics, setTopics] = useState(getInitialTopics);
  const [pushToken, setPushToken] = useState(() =>
    typeof window === "undefined"
      ? ""
      : window.localStorage.getItem(STORAGE_KEY) || "",
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const selectedTopics = getSelectedTopics(topics);

  useEffect(() => {
    if (!pushToken) return undefined;

    let active = true;
    let unsubscribe;
    const attachForegroundHandler = async () => {
      try {
        const configResult = await requestJson(
          buildApiUrl("/notifications/config"),
        );
        if (!configResult.firebase || !configResult.webConfigReady) {
          throw new Error("Firebase browser notification settings are incomplete.");
        }
        const messaging = getNotificationMessaging(configResult.firebase);
        unsubscribe = onMessage(messaging, (payload) => {
          if (Notification.permission !== "granted") return;
          const data = payload.data || {};
          const notification = new Notification(
            String(data.title || "MobilesX update"),
            {
              body: String(data.body || "There is a new update on MobilesX."),
              icon: "/mobilex-favicon.svg",
              data: { url: data.url || "/" },
            },
          );
          notification.onclick = () => {
            const target = new URL(
              String(data.url || "/"),
              window.location.origin,
            );
            if (target.origin === window.location.origin) {
              window.location.assign(target.href);
            }
            notification.close();
          };
        });
      } catch (requestError) {
        if (active) setError(requestError.message);
      }
    };

    void attachForegroundHandler();
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [pushToken]);

  const handleEnablePush = async () => {
    setBusy(true);
    setMessage("");
    setError("");
    try {
      if (!window.isSecureContext || !("Notification" in window)) {
        throw new Error(
          "Browser notifications require a supported browser and a secure (HTTPS) connection.",
        );
      }
      if (!("serviceWorker" in navigator) || !(await isSupported())) {
        throw new Error(
          "This browser does not support Firebase browser notifications.",
        );
      }
      if (!selectedTopics.length) {
        throw new Error("Select at least one notification topic.");
      }

      const configResult = await requestJson(
        buildApiUrl("/notifications/config"),
      );
      if (!configResult.firebase || !configResult.webConfigReady) {
        throw new Error(
          "Firebase browser notification settings are incomplete.",
        );
      }
      if (!configResult.deliveryReady) {
        throw new Error(
          "Browser notification delivery is waiting for backend Firebase Admin credentials.",
        );
      }

      const permission =
        Notification.permission === "default"
          ? await Notification.requestPermission()
          : Notification.permission;
      if (permission !== "granted") {
        throw new Error(
          permission === "denied"
            ? "Notifications are blocked in this browser. Allow them in browser settings, then try again."
            : "Allow notifications to enable browser updates.",
        );
      }

      const workerUrl = new URL(
        "/firebase-messaging-sw.js",
        window.location.origin,
      );
      const workerFirebaseConfig = { ...configResult.firebase };
      delete workerFirebaseConfig.vapidKey;
      workerUrl.searchParams.set(
        "firebaseConfig",
        JSON.stringify(workerFirebaseConfig),
      );
      const registration = await navigator.serviceWorker.register(workerUrl);
      const messaging = getNotificationMessaging(configResult.firebase);
      const token = await getToken(messaging, {
        vapidKey: configResult.firebase.vapidKey,
        serviceWorkerRegistration: registration,
      });
      if (!token) {
        throw new Error("Firebase did not return a browser notification token.");
      }

      await requestJson(buildApiUrl("/notifications/push-subscription"), {
        method: "POST",
        body: JSON.stringify({ token, topics: selectedTopics }),
      });
      window.localStorage.setItem(STORAGE_KEY, token);
      window.localStorage.setItem(TOPICS_KEY, JSON.stringify(topics));
      setPushToken(token);
      setMessage("Browser notifications are enabled for your selected topics.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  const handleDisablePush = async () => {
    if (!pushToken) return;
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const configResult = await requestJson(
        buildApiUrl("/notifications/config"),
      );
      await requestJson(buildApiUrl("/notifications/push-subscription"), {
        method: "DELETE",
        body: JSON.stringify({ token: pushToken }),
      });
      if (configResult.firebase && (await isSupported())) {
        const messaging = getNotificationMessaging(configResult.firebase);
        await deleteToken(messaging);
      }
      window.localStorage.removeItem(STORAGE_KEY);
      setPushToken("");
      setMessage("Browser notifications are disabled.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section
      aria-labelledby="mobilesx-notifications-title"
      className="mt-10 rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:p-6"
    >
      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
        <div>
          <h2
            id="mobilesx-notifications-title"
            className="text-lg font-black text-white"
          >
            Get MobilesX browser alerts
          </h2>
          <p className="mt-2 max-w-lg text-sm leading-6 text-slate-400">
            Get browser notifications as soon as new products, deals, or
            technology news are published. Email updates will be added later.
          </p>
        </div>

        <div>
          <fieldset>
            <legend className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Choose notification topics
            </legend>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-3">
              {TOPICS.map(({ id, label }) => (
                <label
                  key={id}
                  className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-300"
                >
                  <input
                    type="checkbox"
                    checked={Boolean(topics[id])}
                    onChange={(event) =>
                      setTopics((current) => ({
                        ...current,
                        [id]: event.target.checked,
                      }))
                    }
                    className="h-4 w-4 accent-blue-500"
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          {selectedTopics.length === 0 && (
            <p className="mt-3 text-sm text-amber-300" role="status">
              Select at least one topic to subscribe.
            </p>
          )}

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleEnablePush}
              disabled={busy || selectedTopics.length === 0}
              className="rounded-lg border border-white/20 px-4 py-2.5 text-sm font-bold text-white transition hover:border-blue-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy
                ? "Please wait..."
                : pushToken
                  ? "Update browser alert topics"
                  : "Enable browser alerts"}
            </button>
            {pushToken && (
              <button
                type="button"
                onClick={handleDisablePush}
                disabled={busy}
                className="rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-400 transition hover:text-white disabled:opacity-50"
              >
                Turn off browser alerts
              </button>
            )}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Requires your permission and a secure HTTPS connection.
          </p>
        </div>
      </div>

      {message && (
        <p className="mt-4 text-sm text-emerald-300" role="status">
          {message}
        </p>
      )}
      {error && (
        <p className="mt-4 text-sm text-rose-300" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
