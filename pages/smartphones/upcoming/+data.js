import { fetchUpcomingSmartphones } from "../../../src/ssr/publicData.js";
import {
  createItemListJsonLd,
  createUpcomingSeo,
} from "../../../src/ssr/seo.js";

export { data };

async function data() {
  const phones = await fetchUpcomingSmartphones({ limit: 24 });
  const seo = createUpcomingSeo();
  return {
    phones,
    seo,
    schemas: [createItemListJsonLd(phones, seo)],
  };
}
