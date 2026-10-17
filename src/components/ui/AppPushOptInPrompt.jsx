import React, { useEffect, useState } from "react";
import {
  DEFAULT_PUBLIC_PUSH_TOPICS,
  removePublicPushSubscription,
  subscribeToForegroundPublicPush,
  subscribeToPublicPush,
} from "../../lib/publicPushNotifications";

const AppPushOptInPrompt = ({ children }) => {
  const [messaging, setMessaging] = useState(null);

  useEffect(() => {
    let active = true;
    let permissionRequestStarted = false;

    const removeSubscription = () => {
      void removePublicPushSubscription().catch((error) =>
        console.error("Could not remove the browser push subscription:", error),
      );
    };

    const registerSubscription = async () => {
      try {
        const subscription = await subscribeToPublicPush({
          topics: DEFAULT_PUBLIC_PUSH_TOPICS,
        });
        if (active) setMessaging(subscription.messaging);
      } catch (error) {
        console.error("Could not enable MobilesX browser notifications:", error);
      }
    };

    if (
      typeof window === "undefined" ||
      !window.isSecureContext ||
      !("Notification" in window)
    ) {
      return () => {
        active = false;
      };
    }

    if (Notification.permission === "granted") {
      void registerSubscription();
    } else if (Notification.permission === "denied") {
      removeSubscription();
    }

    const requestNativePermission = () => {
      if (
        permissionRequestStarted ||
        Notification.permission !== "default"
      ) {
        return;
      }
      permissionRequestStarted = true;

      // Call directly in the trusted click handler so the browser can show its
      // own permission UI. The site does not draw a substitute prompt.
      let permissionRequest;
      try {
        permissionRequest = Notification.requestPermission();
      } catch (error) {
        console.error("The browser notification request failed:", error);
        return;
      }

      void Promise.resolve(permissionRequest)
        .then((permission) => {
          if (!active) return;
          if (permission === "granted") {
            return registerSubscription();
          }
          if (permission === "denied") removeSubscription();
          return undefined;
        })
        .catch((error) => {
          console.error("The browser notification request failed:", error);
        });
    };

    document.addEventListener("click", requestNativePermission, {
      capture: true,
      once: true,
    });

    return () => {
      active = false;
      document.removeEventListener("click", requestNativePermission, true);
    };
  }, []);

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
    if (!messaging) return undefined;
    const checkPermission = () => {
      if (Notification.permission === "granted") return;
      setMessaging(null);
      void removePublicPushSubscription().catch((error) =>
        console.error("Could not remove the revoked push subscription:", error),
      );
    };
    document.addEventListener("visibilitychange", checkPermission);
    return () =>
      document.removeEventListener("visibilitychange", checkPermission);
  }, [messaging]);

  return children;
};

export default AppPushOptInPrompt;
