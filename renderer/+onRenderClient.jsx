import React from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import "../src/index.css";

export { onRenderClient };

let root;
let assetServiceWorkerRegistration;

const registerAssetServiceWorker = () => {
  if (
    assetServiceWorkerRegistration ||
    !import.meta.env.PROD ||
    typeof window === "undefined" ||
    !window.isSecureContext ||
    !("serviceWorker" in navigator)
  ) {
    return;
  }

  const register = () => {
    assetServiceWorkerRegistration = navigator.serviceWorker
      .register("/firebase-messaging-sw.js", { scope: "/" })
      .catch(() => undefined);
  };

  if (document.readyState === "complete") {
    register();
  } else {
    window.addEventListener("load", register, { once: true });
  }
};

function onRenderClient(pageContext) {
  const { Page, data } = pageContext;
  const container = document.getElementById("root");
  const page = <Page pageContext={pageContext} data={data} />;

  if (container?.innerHTML) {
    hydrateRoot(container, page);
    registerAssetServiceWorker();
    return;
  }

  if (!root) {
    root = createRoot(container);
  }
  root.render(page);
  registerAssetServiceWorker();
}
