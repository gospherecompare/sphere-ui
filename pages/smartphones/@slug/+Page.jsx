import React from "react";
import { SsrSmartphoneDetail } from "../../../src/ssr/SsrSmartphoneViews.jsx";

export { Page };

function Page({ data }) {
  return (
    <SsrSmartphoneDetail
      product={data?.product || {}}
      competitors={data?.competitors || []}
    />
  );
}
