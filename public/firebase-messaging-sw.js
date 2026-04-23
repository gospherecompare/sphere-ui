self.addEventListener("notificationclick", (event) => {
  const targetUrl = (() => {
    const rawUrl =
      event.notification?.data?.url ||
      event.notification?.data?.link ||
      "/";

    try {
      return new URL(rawUrl, self.location.origin).href;
    } catch {
      return `${self.location.origin}/`;
    }
  })();

  event.notification?.close();

  event.waitUntil(
    (async () => {
      const windowClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      for (const client of windowClients) {
        if (client.url === targetUrl && "focus" in client) {
          return client.focus();
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }

      return undefined;
    })(),
  );
});
