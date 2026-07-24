import React from "react";
import { SsrUpcomingSmartphones } from "../../../src/ssr/SsrSmartphoneViews.jsx";

export { Page };

function Page({ data }) {
  return <SsrUpcomingSmartphones phones={data?.phones || []} />;
}
