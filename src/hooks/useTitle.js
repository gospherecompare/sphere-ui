import { useEffect } from "react";
import { normalizeSeoTitle } from "../utils/seoTitle";

const SITE_NAME = "Hooks";
const BRAND_TAGLINE = "Gadget Destination";
const CURRENT_MONTH_YEAR = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "numeric",
}).format(new Date());

// SEO-friendly titles for different pages
const PAGE_TITLES = {
  home: `Compare Smartphones, Laptops & TVs in India - Specs, Prices & Reviews - ${SITE_NAME}`,
  smartphones: `Best Smartphones (${CURRENT_MONTH_YEAR}) - Compare Prices - ${SITE_NAME}`,
  laptops: `Best Laptops (${CURRENT_MONTH_YEAR}) - Compare Prices & Specs - ${SITE_NAME}`,
  tvs: `Best TVs (${CURRENT_MONTH_YEAR}) - Compare Prices & Features - ${SITE_NAME}`,
  appliances: `Home Appliances (${CURRENT_MONTH_YEAR}) - Compare Prices & Features - ${SITE_NAME}`,
  networking: `Networking Devices (${CURRENT_MONTH_YEAR}) - Routers, Modems & Switches - ${SITE_NAME}`,
  signin: `Sign In - ${SITE_NAME}`,
  signup: `Create Account - ${SITE_NAME}`,
  account: `My Account - ${SITE_NAME}`,
  compare: `Compare Gadgets - ${SITE_NAME}`,
  wishlist: `My Wishlist - ${SITE_NAME}`,
  careers: `Careers at ${SITE_NAME} - Join Hooks Team`,
  about: `About ${SITE_NAME} - Product Discovery & Comparison`,
  contact: `Contact ${SITE_NAME} - Support and Partnerships`,
  privacypolicy: `Privacy Policy - ${SITE_NAME}`,
  terms: `Terms of Use - ${SITE_NAME}`,
};

function formatTitle({
  siteName = SITE_NAME,
  name,
  page,
  brand,
} = {}) {
  // Check if page is a predefined route with SEO title
  const pageKey = page?.toLowerCase().replace(/\s+/g, "");
  if (pageKey && PAGE_TITLES[pageKey]) {
    return normalizeSeoTitle(PAGE_TITLES[pageKey]);
  }

  const parts = [];

  if (page) parts.push(page);

  // Build device part: include only the product `name` (exclude `brand`)
  const device = (name || "").toString().trim();
  if (device) parts.push(device);

  // Always include site name as a suffix for branding/SEO
  if (siteName) parts.push(siteName);

  return normalizeSeoTitle(parts.filter(Boolean).join(" - "));
}

/**
 * useTitle - reusable hook to set document.title and meta description
 * Accepts page, brand, name and optional siteName.
 *
 * Usage:
 * - useTitle({ page: "Home" }) -> "Compare Smartphones, Laptops & TVs in India - Specs, Prices & Reviews - Hooks"
 * - useTitle({ page: "Smartphones" }) -> "Best Smartphones (Mar 2026) - Compare Prices - Hooks"
 * - useTitle({ page: "Product", brand: "Apple", name: "iPhone 15" }) -> "Product - iPhone 15 - Hooks"
 */
export default function useTitle({ page, brand, name, siteName } = {}) {
  useEffect(() => {
    const title = normalizeSeoTitle(formatTitle({ page, brand, name, siteName }));
    if (title) document.title = title;

    // Also set Open Graph and Twitter meta tags for better social sharing
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute("content", title);
    } else {
      const meta = document.createElement("meta");
      meta.setAttribute("property", "og:title");
      meta.setAttribute("content", title);
      document.head.appendChild(meta);
    }
  }, [page, brand, name, siteName]);
}

export { formatTitle, PAGE_TITLES, SITE_NAME, BRAND_TAGLINE };

