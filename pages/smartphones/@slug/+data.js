import { render } from "vike/abort";
import { fetchSmartphoneDetailBySlug } from "../../../src/ssr/publicData.js";
import {
  createBreadcrumbJsonLd,
  createProductJsonLd,
  createSmartphoneDetailSeo,
} from "../../../src/ssr/seo.js";

export { data };

async function data(pageContext) {
  const { slug = "" } = pageContext.routeParams || {};

  try {
    const { product, competitors } = await fetchSmartphoneDetailBySlug(slug);
    const seo = createSmartphoneDetailSeo(product);
    return {
      product,
      competitors,
      seo,
      schemas: [
        createBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Smartphones", path: "/smartphones" },
          { name: product?.name || "Smartphone", path: seo.canonicalPath },
        ]),
        createProductJsonLd(product, seo),
      ],
    };
  } catch (error) {
    if (error?.statusCode === 404) {
      throw render(404, "Smartphone not found");
    }
    throw error;
  }
}
