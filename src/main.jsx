import React from "react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./styles/design-system.css";
import App from "./App.jsx";
import { Provider } from "react-redux";
import { store } from "./store";
import { HelmetProvider } from "react-helmet-async";
import { installApiAliasFetch } from "./utils/installApiAliasFetch";
import { installFetchActivityTracker } from "./utils/installFetchActivityTracker";
import { installPreloadedFetchInterceptor } from "./utils/installPreloadedFetch";
import { installApiResponseEncryption } from "./utils/apiResponseEncryption";

installApiAliasFetch();
installPreloadedFetchInterceptor();
installFetchActivityTracker();
installApiResponseEncryption();

if (window.location.pathname === "/") {
  void import("./components/Home/Home").catch(() => {});
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <HelmetProvider>
        <App />
      </HelmetProvider>
    </Provider>
  </StrictMode>,
);
