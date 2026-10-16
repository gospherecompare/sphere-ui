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
      let targetUrl = "/";
      try {
        const candidate = new URL(data.url || "/", self.location.origin);
        if (candidate.origin === self.location.origin) {
          targetUrl = candidate.href;
        }
      } catch (error) {
        console.error("Invalid MobilesX notification link:", error);
      }

      return self.registration.showNotification(title, {
        body,
        icon: "/mobilex-favicon.svg",
        badge: "/mobilex-favicon.svg",
        tag: `mobilesx-${data.topic || "update"}-${data.eventId || Date.now()}`,
        data: { url: targetUrl },
      });
    });
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const requestedUrl = event.notification.data?.url || "/";
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
