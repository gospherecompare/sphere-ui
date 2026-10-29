import React, { useCallback, useEffect, useRef, useState } from "react";
import { FaBell } from "react-icons/fa";
import {
  DEFAULT_PUBLIC_PUSH_TOPICS,
  removePublicPushSubscription,
  subscribeToForegroundPublicPush,
  subscribeToPublicPush,
} from "../../lib/publicPushNotifications";

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

const AppPushOptInPrompt = ({ children }) => {
  const [permission, setPermission] = useState(getBrowserNotificationPermission);
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
    setError("");
    void registerSubscription().catch((registrationError) => {
      // Permission has already been granted, so let the visitor continue while
      // recording setup failures for server-side troubleshooting.
      console.error("Could not register MobilesX browser notifications:", registrationError);
    });
  }, [registerSubscription]);

  const acceptBlockedPermission = useCallback(() => {
    setPermission("denied");
    setError("");
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
    if (!messaging) return undefined;

    return subscribeToForegroundPublicPush(messaging, async (payload) => {
      if (Notification.permission !== "granted") return;
      const data = payload?.data || {};
      const topic = String(data.topic || "");
      const type = String(
        data.type ||
          (topic === "deals"
            ? "deal"
            : topic === "launches"
              ? "launch"
              : "news"),
      );

      let targetUrl = "/";
      try {
        const candidate = new URL(data.url || "/", window.location.origin);
        if (candidate.origin === window.location.origin) {
          targetUrl = candidate.href;
        }
      } catch {
        targetUrl = "/";
      }

      let imageUrl = "";
      try {
        const imageCandidate = String(data.imageUrl || "").trim();
        if (imageCandidate) {
          const candidate = new URL(imageCandidate, window.location.origin);
          if (
            candidate.protocol === "https:" ||
            candidate.origin === window.location.origin
          ) {
            imageUrl = candidate.href;
          }
        }
      } catch {
        // Keep the text notification if the optional image URL is invalid.
      }

      const actionTitle =
        type === "deal"
          ? "View deal"
          : type === "launch"
            ? "View product"
            : "Read article";
      const options = {
        body: String(data.body || "There is a new update on MobilesX."),
        icon: "/mobilex-favicon.svg",
        badge: "/mobilex-favicon.svg",
        ...(imageUrl ? { image: imageUrl } : {}),
        tag: `mobilesx-${topic || "update"}-${data.eventId || Date.now()}`,
        data: {
          url: targetUrl,
          type,
          actionUrls: { open: targetUrl },
        },
      };
      const supportedActionCount = Number(Notification.maxActions) || 0;
      if (supportedActionCount > 0) {
        options.actions = [
          { action: "open", title: actionTitle },
        ].slice(0, supportedActionCount);
      }

      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(
        String(data.title || "MobilesX update"),
        options,
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
        setPermission("default");
      }
    } catch (requestError) {
      console.error("The browser notification request failed:", requestError);
      setError("The browser could not open its notification prompt. Please retry.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {children}
      {permission === "default" && (
        <button
          type="button"
          onClick={handleRequestPermission}
          disabled={busy}
          aria-label="Get product launch, technology news, and price-drop notifications"
          title={error || "Get product launch, technology news, and price-drop alerts"}
          className="fixed bottom-[calc(64px+env(safe-area-inset-bottom)+0.75rem)] left-4 z-[70] inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-300 bg-white/95 px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-lg backdrop-blur transition hover:border-blue-400 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 disabled:cursor-wait disabled:opacity-60 sm:bottom-6 sm:left-6 sm:text-sm"
        >
          <FaBell aria-hidden="true" />
          {busy ? "Opening..." : "Get alerts"}
        </button>
      )}
    </>
  );
};

export default AppPushOptInPrompt;
