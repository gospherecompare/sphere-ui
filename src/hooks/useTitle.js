import { useEffect } from "react";

const SITE_NAME = "Smart Arena";
const BRAND_TAGLINE = "Gadget Destination";
const CURRENT_YEAR = new Date().getFullYear();

// SEO-friendly titles for different pages
const PAGE_TITLES = {
  home: `Compare & Buy Latest Gadgets | ${SITE_NAME}`,
  smartphones: `Best Smartphones ${CURRENT_YEAR} | Compare Prices | ${SITE_NAME}`,
  laptops: `Laptops Online | Compare & Buy Best Laptops | ${SITE_NAME}`,
  appliances: `Home Appliances | Compare Prices & Features | ${SITE_NAME}`,
  networking: `Networking Devices | Routers, Modems & Switches | ${SITE_NAME}`,
  signin: `Sign In | ${SITE_NAME}`,
  signup: `Create Account | ${SITE_NAME}`,
  account: `My Account | ${SITE_NAME}`,
  compare: `Compare Gadgets | ${SITE_NAME}`,
  wishlist: `My Wishlist | ${SITE_NAME}`,
};

function formatTitle({
  siteName = SITE_NAME,
  separator = " | ",
  name,
  page,
  brand,
} = {}) {
  // Check if page is a predefined route with SEO title
  const pageKey = page?.toLowerCase().replace(/\s+/g, "");
  if (pageKey && PAGE_TITLES[pageKey]) {
    return PAGE_TITLES[pageKey];
  }

  const parts = [];

  if (page) parts.push(page);

  // Build device part: include only the product `name` (exclude `brand`)
  const device = (name || "").toString().trim();
  if (device) parts.push(device);

  // Always include site name as a suffix for branding/SEO
  if (siteName) parts.push(siteName);

  return parts.filter(Boolean).join(separator);
}

/**
 * useTitle - reusable hook to set document.title and meta description
 * Accepts page, brand, name and optional siteName.
 *
 * Usage:
 * - useTitle({ page: "Home" }) → "Compare & Buy Latest Gadgets | Smart Arena"
 * - useTitle({ page: "Smartphones" }) → "Best Smartphones 2025 | Compare Prices | Smart Arena"
 * - useTitle({ page: "Product", brand: "Apple", name: "iPhone 15" }) → "Product | iPhone 15 | Smart Arena"
 */
export default function useTitle({ page, brand, name, siteName } = {}) {
  useEffect(() => {
    const title = formatTitle({ page, brand, name, siteName });
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
