/* global importScripts, firebase */
importScripts(
  "https://www.gstatic.com/firebasejs/12.12.1/firebase-app-compat.js",
  "https://www.gstatic.com/firebasejs/12.12.1/firebase-messaging-compat.js",
);

const configValue = new URL(self.location.href).searchParams.get(
  "firebaseConfig",
);
let firebaseConfig = null;
try {
  firebaseConfig = configValue ? JSON.parse(configValue) : null;
} catch (error) {
  console.error("Invalid Firebase configuration in the notification worker URL:", error);
}

if (!firebaseConfig?.projectId || !firebaseConfig?.messagingSenderId) {
  console.error("The MobilesX notification worker is missing Firebase configuration.");
} else {
  firebase.initializeApp(firebaseConfig);
  firebase
    .messaging()
    .onBackgroundMessage((payload) => {
      const data = payload.data || {};
      const title = String(data.title || "MobilesX update");
      const body = String(data.body || "There is a new update on MobilesX.");
      const type = String(
        data.type ||
          (data.topic === "deals"
            ? "deal"
            : data.topic === "launches"
              ? "launch"
              : "news"),
      );
      let targetUrl = "/";
      try {
        const candidate = new URL(data.url || "/", self.location.origin);
        if (candidate.origin === self.location.origin) {
          targetUrl = candidate.href;
        }
      } catch (error) {
        console.error("Invalid MobilesX notification link:", error);
      }

      let imageUrl = "";
      try {
        const imageCandidate = String(data.imageUrl || "").trim();
        if (imageCandidate) {
          const candidate = new URL(imageCandidate, self.location.origin);
          if (
            candidate.protocol === "https:" ||
            candidate.origin === self.location.origin
          ) {
            imageUrl = candidate.href;
          }
        }
      } catch {
        // An image is optional; keep the text notification if its URL is invalid.
      }

      const actionTitle =
        type === "deal"
          ? "View deal"
          : type === "launch"
            ? "View product"
            : "Read article";
      const options = {
        body,
        icon: "/mobilex-favicon.svg",
        badge: "/mobilex-favicon.svg",
        ...(imageUrl ? { image: imageUrl } : {}),
        tag: `mobilesx-${data.topic || "update"}-${data.eventId || Date.now()}`,
        data: {
          url: targetUrl,
          type,
          actionUrls: { open: targetUrl },
        },
      };
      const supportedActionCount = Number(self.Notification?.maxActions) || 0;
      if (supportedActionCount > 0) {
        options.actions = [
          { action: "open", title: actionTitle },
        ].slice(0, supportedActionCount);
      }

      return self.registration.showNotification(title, options);
    });
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const notificationData = event.notification.data || {};
  const requestedUrl =
    notificationData.actionUrls?.[event.action] || notificationData.url || "/";
  let target;
  try {
    target = new URL(requestedUrl, self.location.origin);
    if (target.origin !== self.location.origin) {
      target = new URL("/", self.location.origin);
    }
  } catch {
    target = new URL("/", self.location.origin);
  }

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(
      (windows) => {
        const sameOriginWindow = windows.find(
          (client) => new URL(client.url).origin === self.location.origin,
        );
        if (sameOriginWindow) {
          return sameOriginWindow
            .navigate(target.href)
            .then(() => sameOriginWindow.focus());
        }
        return self.clients.openWindow(target.href);
      },
    ),
  );
});

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
