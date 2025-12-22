import { useEffect } from "react";

function formatTitle({
  page,
  brand,
  name,
  siteName = "Smart Arena Gadget Destination",
  separator = " - ",
}) {
  const parts = [];

  if (page) parts.push(page);

  // Build device part intelligently: Brand + Name + Model
  const deviceParts = [];
  if (brand) deviceParts.push(brand);
  if (name) deviceParts.push(name);
  const device = deviceParts.join(" ").trim();
  if (device) parts.push(device);

  // Always include site name as a suffix for branding/SEO
  if (siteName) parts.push(siteName);

  return parts.filter(Boolean).join(separator);
}

/**
 * useTitle - reusable hook to set document.title
 * Accepts page, brand, model, name (from API) and optional siteName.
 * It composes a clean title like: "Page | Brand Name Model | Smart Arena".
 */
export default function useTitle({ page, brand, model, name, siteName } = {}) {
  useEffect(() => {
    const title = formatTitle({ page, brand, model, name, siteName });
    if (title) document.title = title;
  }, [page, brand, model, name, siteName]);
}

export { formatTitle };
