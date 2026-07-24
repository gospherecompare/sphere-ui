import {
  formatInr,
  resolveImage,
  resolveLowestPrice,
  summarizeSpecs,
  toCanonicalUrl,
  toSmartphonePath,
} from "./publicData.js";

export const SITE_NAME = "Hooks";
export const SITE_ORIGIN = "https://tryhook.shop";
export const DEFAULT_DESCRIPTION =
  "Compare smartphones, laptops, TVs, and networking devices with live specs, prices, launch status, and competitor signals on Hooks.";

const cleanText = (value = "") =>
  String(value || "")
    .replace(/\s+/g, " ")
    .trim();

export const createSmartphoneDetailSeo = (product = {}) => {
  const name = cleanText(product?.name || product?.product_name || "Smartphone");
  const price = resolveLowestPrice(product);
  const priceText = formatInr(price);
  const specs = summarizeSpecs(product).slice(0, 4).join(", ");
  const path = toSmartphonePath(product);
  const title = `${name}${priceText ? ` Price ${priceText}` : ""}, Specs and Compare | Hooks`;
  const description = cleanText(
    `${name} details with live price, launch status, key specs${
      specs ? ` including ${specs}` : ""
    }, and closest competing phones on Hooks.`,
  );

  return {
    title,
    description,
    canonicalPath: path,
    canonicalUrl: toCanonicalUrl(path),
    image: resolveImage(product),
    price,
  };
};

export const createUpcomingSeo = () => ({
  title: "Upcoming Smartphones in India: Launch Dates, Specs and Prices | Hooks",
  description:
    "Track upcoming smartphones in India with launch dates, expected pricing, key specs, battery, chipset, camera, and brand-wise upcoming mobile releases.",
  canonicalPath: "/smartphones/upcoming",
  canonicalUrl: toCanonicalUrl("/smartphones/upcoming"),
  image: `${SITE_ORIGIN}/hook-logo.png`,
});

export const createProductJsonLd = (product = {}, seo = {}) => ({
  "@context": "https://schema.org",
  "@type": "Product",
  name: product?.name || product?.product_name || "Smartphone",
  brand: product?.brand
    ? {
        "@type": "Brand",
        name: product.brand,
      }
    : undefined,
  image: seo.image ? [seo.image] : undefined,
  description: seo.description,
  url: seo.canonicalUrl,
  offers:
    seo.price != null
      ? {
          "@type": "Offer",
          priceCurrency: "INR",
          price: String(seo.price),
          availability: "https://schema.org/InStock",
          url: seo.canonicalUrl,
        }
      : undefined,
});

export const createBreadcrumbJsonLd = (items = []) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: toCanonicalUrl(item.path),
  })),
});

export const createItemListJsonLd = (items = [], seo = {}) => ({
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: seo.title || "Hooks smartphone list",
  url: seo.canonicalUrl,
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    url: toCanonicalUrl(toSmartphonePath(item)),
    name: item?.name || item?.product_name || `Smartphone ${index + 1}`,
  })),
});
