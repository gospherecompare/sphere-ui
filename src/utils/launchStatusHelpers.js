/**
 * Launch status helpers for determining product availability state
 * Used across upcoming pages, search results, product cards, and comparisons
 */

/**
 * Normalize launch status values from various possible formats
 * @param {string|null|undefined} value - The raw status value
 * @returns {string|null} Normalized status: "rumored", "announced", "upcoming", "available", "released", or null
 */
export const normalizeLaunchStatus = (value) => {
  if (!value) return null;

  const raw = String(value).trim().toLowerCase();

  // Rumored
  if (/rumou?r|specul|leak|expected/.test(raw)) return "rumored";

  // Announced
  if (/announce|official|confirm|unveil/.test(raw)) return "announced";

  // Upcoming / Coming Soon
  if (/upcoming|coming soon|expected|scheduled|soon/.test(raw))
    return "upcoming";

  // Available / On Sale
  if (/available|on sale|in stock|now|order|buy/.test(raw)) return "available";

  // Released / Launched
  if (/released|launched|out now|available|live/.test(raw)) return "released";

  // Pass through if already normalized
  const normalized = [
    "rumored",
    "announced",
    "upcoming",
    "available",
    "released",
  ];
  if (normalized.includes(raw)) return raw;

  return null;
};

/**
 * Parse a date string or Date object to a Date at midnight UTC
 * @param {string|Date|null|undefined} value - Date value to parse
 * @returns {Date|null} Parsed date at midnight, or null if invalid
 */
export const parseDateValue = (value) => {
  if (!value) return null;

  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;

    // Normalize to midnight UTC
    const normalized = new Date(date);
    normalized.setUTCHours(0, 0, 0, 0);
    return normalized;
  } catch {
    return null;
  }
};

/**
 * Check if a product is upcoming based on launch status and date
 *
 * A product is upcoming if:
 * 1. launch_status_override is explicitly set to "upcoming" (highest priority), OR
 * 2. launch_status indicates upcoming/announced/rumored state, OR
 * 3. launch_date is in the future, OR
 * 4. available_date or sale_start_date is in the future
 *
 * This function does NOT require:
 * - A price (price can be null)
 * - Store entries or prices
 * - Official preorder URL
 *
 * @param {Object} product - Product object with launch/availability metadata
 * @param {Date|string} [today=new Date()] - Reference date for comparison (default: today)
 * @returns {boolean} True if product is upcoming
 */
export const isUpcomingProduct = (product, today = new Date()) => {
  if (!product) return false;

  const override = normalizeLaunchStatus(
    product?.launch_status_override ?? product?.launchStatusOverride ?? "",
  );

  if (override) {
    return ["upcoming", "announced", "rumored"].includes(override);
  }

  const launchStatus = normalizeLaunchStatus(
    product?.launch_status ?? product?.launchStatus ?? "",
  );

  if (["upcoming", "announced", "rumored"].includes(launchStatus)) {
    return true;
  }

  if (["available", "released"].includes(launchStatus)) {
    return false;
  }

  const todayDate = new Date(today);
  todayDate.setUTCHours(0, 0, 0, 0);

  const futureDateSignals = [
    parseDateValue(product?.launch_date ?? product?.launchDate),
    parseDateValue(product?.available_date ?? product?.availableDate ?? ""),
    parseDateValue(product?.sale_start_date ?? product?.saleStartDate ?? ""),
  ].filter(Boolean);

  return futureDateSignals.some((date) => date > todayDate);
};

/**
 * Get a human-readable label for a launch status
 * @param {string} status - Status value (rumored, announced, upcoming, available, released)
 * @returns {string} Human-readable label
 */
export const getLaunchStatusLabel = (status) => {
  const normalized = normalizeLaunchStatus(status);

  const labels = {
    rumored: "Rumored",
    announced: "Announced",
    upcoming: "Upcoming",
    available: "Available",
    released: "Released",
  };

  return labels[normalized] || "Unknown";
};

/**
 * Check if a product is available for sale (has pricing/stores)
 * This is separate from the upcoming status - a product can be upcoming with no pricing
 * @param {Object} product - Product object
 * @returns {boolean} True if product has pricing or store information
 */
export const hasAvailablePricing = (product) => {
  if (!product) return false;

  // Check for base price
  if (product?.base_price || product?.basePrice) {
    return true;
  }

  // Check for store prices
  if (Array.isArray(product?.store_prices) && product.store_prices.length > 0) {
    return product.store_prices.some((store) => store?.price);
  }

  if (Array.isArray(product?.storePrices) && product.storePrices.length > 0) {
    return product.storePrices.some((store) => store?.price);
  }

  return false;
};

/**
 * Check if a product has store links (even if no pricing)
 * @param {Object} product - Product object
 * @returns {boolean} True if product has at least one store link
 */
export const hasStoreLinks = (product) => {
  if (!product) return false;

  const stores = product?.store_prices ?? product?.storePrices ?? [];

  if (!Array.isArray(stores)) return false;

  return stores.some((store) => store?.url);
};
