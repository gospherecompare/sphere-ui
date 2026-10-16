import { useEffect } from "react";
import { getApps, initializeApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  isSupported,
  onMessage,
} from "firebase/messaging";
import { buildApiUrl } from "../../utils/apiUrl";

const TOKEN_STORAGE_KEY = "mobilesx-fcm-token";
const TOPICS_STORAGE_KEY = "mobilesx-fcm-topics";

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

const getNotificationMessaging = (config) => {
  const appName = "mobilesx-notifications";
  const app =
    getApps().find((existing) => existing.name === appName) ||
    initializeApp(config, appName);
  return getMessaging(app);
};

const hasAllTopicsSubscription = (storedTopics) => {
  try {
    const topics = JSON.parse(storedTopics || "{}");
    return (
      topics.news === true &&
      topics.launches === true &&
      topics.deals === true
    );
  } catch (error) {
    console.error("Could not read the saved MobilesX notification topics.", error);
    return false;
  }
};

export default function NewsPushRegistration() {
  useEffect(() => {
    let active = true;
    let unsubscribe;

    const registerNewsPush = async () => {
      if (
        !window.isSecureContext ||
        !("Notification" in window) ||
        Notification.permission !== "granted" ||
        !("serviceWorker" in navigator) ||
        !(await isSupported())
      ) {
        return;
      }

      const configResult = await requestJson(
        buildApiUrl("/notifications/config"),
      );
      if (!configResult.firebase || !configResult.webConfigReady) {
        throw new Error("Firebase browser notification settings are incomplete.");
      }
      if (!configResult.deliveryReady) {
        throw new Error(
          "Browser notification delivery is waiting for backend Firebase Admin credentials.",
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

      const previousToken = window.localStorage.getItem(TOKEN_STORAGE_KEY);
      const topics = { launches: true, deals: true, news: true };
      if (
        token !== previousToken ||
        !hasAllTopicsSubscription(
          window.localStorage.getItem(TOPICS_STORAGE_KEY),
        )
      ) {
        await requestJson(buildApiUrl("/notifications/push-subscription"), {
          method: "POST",
          body: JSON.stringify({ token }),
        });
        window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
        window.localStorage.setItem(
          TOPICS_STORAGE_KEY,
          JSON.stringify(topics),
        );
      }

      if (!active) return;
      unsubscribe = onMessage(messaging, (payload) => {
        if (Notification.permission !== "granted") return;
        const data = payload.data || {};
        const notification = new Notification(
          String(data.title || "MobilesX update"),
          {
            body: String(data.body || "There is a new technology news update."),
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
    };

    void registerNewsPush().catch((error) => {
      console.error("MobilesX news notification registration failed:", error);
    });

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  return null;
}
