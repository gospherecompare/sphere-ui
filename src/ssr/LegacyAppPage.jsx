import React from "react";
import { Provider } from "react-redux";
import { HelmetProvider } from "react-helmet-async";
import App from "../App.jsx";
import { store } from "../store/index.js";

export function LegacyAppPage({ pageContext, helmetContext }) {
  const ssrLocation =
    typeof window === "undefined"
      ? pageContext?.urlPathname || pageContext?.urlOriginal || "/"
      : undefined;

  return (
    <Provider store={store}>
        <HelmetProvider context={helmetContext}>
        <App ssrLocation={ssrLocation} />
      </HelmetProvider>
    </Provider>
  );
}
