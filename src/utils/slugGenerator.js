// src/utils/slugGenerator.js

/**
 * Generate a URL-friendly slug from a product name
 * @param {string} name - Product name
 * @returns {string} - URL-friendly slug
 */
export const generateSlug = (name) => {
  if (!name) return "";
  return String(name)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
};

/**
 * Create a SEO-friendly URL path for a product
 * @param {string} category - Product category (smartphones, laptops, appliances, networking)
 * @param {string} productName - Product name/model
 * @returns {string} - Complete URL path
 */
export const createProductPath = (category, productName) => {
  const SMARTPHONE_SEO_SUFFIX = "-price-in-india";
  const normalizedCategory = String(category || "")
    .replace(/^\/+|\/+$/g, "")
    .toLowerCase();
  const isSmartphoneCategory =
    normalizedCategory === "smartphones" ||
    normalizedCategory === "smartphone" ||
    normalizedCategory === "mobiles" ||
    normalizedCategory === "mobile";
  const baseCategory = normalizedCategory || "smartphones";
  const slug = generateSlug(productName);
  if (!slug) return `/${baseCategory}`;
  if (isSmartphoneCategory) {
    const baseSlug = slug.replace(new RegExp(`${SMARTPHONE_SEO_SUFFIX}$`, "i"), "");
    return `/smartphones/${baseSlug}${SMARTPHONE_SEO_SUFFIX}`;
  }
  return `/${baseCategory}/${slug}`;
};

/**
 * Extract product name from slug for API query
 * @param {string} slug - URL slug
 * @returns {string} - Product name
 */
export const extractNameFromSlug = (slug) => {
  if (!slug) return "";
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export default {
  generateSlug,
  createProductPath,
  extractNameFromSlug,
};
