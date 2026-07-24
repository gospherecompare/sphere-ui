import React from "react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { Provider } from "react-redux";
import { store } from "./store";
import { HelmetProvider } from "react-helmet-async";
import { installApiAliasFetch } from "./utils/installApiAliasFetch";
import { installFetchActivityTracker } from "./utils/installFetchActivityTracker";
import { installPreloadedFetchInterceptor } from "./utils/installPreloadedFetch";

installApiAliasFetch();
installPreloadedFetchInterceptor();
installFetchActivityTracker();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <HelmetProvider>
        <App />
      </HelmetProvider>
    </Provider>
  </StrictMode>,
);
