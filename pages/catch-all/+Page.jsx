import React from "react";
import { LegacyAppPage } from "../../src/ssr/LegacyAppPage.jsx";

export { Page };

function Page({ pageContext, helmetContext }) {
  return (
    <LegacyAppPage
      pageContext={pageContext}
      helmetContext={helmetContext}
    />
  );
}
