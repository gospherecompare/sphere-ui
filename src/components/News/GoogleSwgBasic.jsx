import React from "react";
import { Helmet } from "react-helmet-async";

const SWG_BASIC_SCRIPT_SRC = "https://news.google.com/swg/js/v1/swg-basic.js";
const SWG_BASIC_PRODUCT_ID = "CAow5KPGDA:openaccess";

const createSwgBasicInitScript = () => `
  (function () {
    if (self.__HOOKS_SWG_BASIC_INITIALIZED__) return;
    self.__HOOKS_SWG_BASIC_INITIALIZED__ = true;

    (self.SWG_BASIC = self.SWG_BASIC || []).push(function (basicSubscriptions) {
      basicSubscriptions.init({
        type: "NewsArticle",
        isPartOfType: ["Product"],
        isPartOfProductId: "${SWG_BASIC_PRODUCT_ID}",
        clientOptions: { theme: "light", lang: "en" }
      });
    });
  })();
`;

const GoogleSwgBasic = () => (
  <Helmet>
    <script
      async
      type="application/javascript"
      src={SWG_BASIC_SCRIPT_SRC}
    />
    <script>{createSwgBasicInitScript()}</script>
  </Helmet>
);

export default GoogleSwgBasic;
