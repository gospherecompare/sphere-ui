// Meta templates for product detail pages
const CURRENT_MONTH_YEAR = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
}).format(new Date());

const getOrdinalSuffix = (day) => {
  const value = Number(day);
  if (!Number.isFinite(value)) return "";
  if (value % 10 === 1 && value !== 11) return "st";
  if (value % 10 === 2 && value !== 12) return "nd";
  if (value % 10 === 3 && value !== 13) return "rd";
  return "th";
};

// Formats a date as "13th July, 2026" (matches the freshness-date style
// used by 91mobiles/Beebom). Prefers a real per-product update timestamp;
// falls back to today's date when the product record has no such field yet.
const resolveFreshnessDate = (rawUpdatedAt) => {
  const parsed = rawUpdatedAt ? new Date(rawUpdatedAt) : null;
  const date = parsed && !Number.isNaN(parsed.getTime()) ? parsed : new Date();

  const day = date.getDate();
  const month = new Intl.DateTimeFormat("en-US", { month: "long" }).format(
    date,
  );
  const year = date.getFullYear();

  return `${day}${getOrdinalSuffix(day)} ${month}, ${year}`;
};

export const smartphoneMeta = {
  title: ({ name, brand, updatedAt = null }) => {
    const identity =
      brand && name
        ? name.toLowerCase().includes(brand.toLowerCase())
          ? name
          : `${brand} ${name}`
        : name || brand || "";
    if (!identity) return "";

    return `${identity} - Full Specifications & Price in India (${resolveFreshnessDate(updatedAt)}) | Hooks`;
  },

  description: ({ name, brand, highlights = [], updatedAt = null }) => {
    const identity =
      brand && name
        ? name.toLowerCase().includes(brand.toLowerCase())
          ? name
          : `${brand} ${name}`
        : name || brand || "";
    if (!identity) return "";

    const freshnessDate = resolveFreshnessDate(updatedAt);
    const intro = `Check the latest ${identity} price in India, full specifications, features, images, variants, launch date, availability, reviews, and comparisons on Hooks. Updated ${freshnessDate}.`;
    const cleanHighlights = Array.isArray(highlights)
      ? highlights.filter(Boolean).slice(0, 3)
      : [];

    return cleanHighlights.length
      ? `${intro} Key highlights: ${cleanHighlights.join(", ")}.`
      : intro;
  },
};

export const laptopMeta = {
  title: ({ name, cpu, ram, storage, updatedAt = null }) =>
    `${name}${cpu ? ` (${cpu}` : ""}${ram ? `, ${ram} RAM` : ""}${
      storage ? `, ${storage})` : cpu ? ")" : ""
    } - Full Specifications & Price in India (${resolveFreshnessDate(updatedAt)}) | Hooks`,

  description: ({ name, cpu, ram, storage, brand, updatedAt = null }) =>
    `${name}${brand ? ` by ${brand}` : ""}${cpu ? ` powered by ${cpu}` : ""}${
      ram ? ` with ${ram} RAM` : ""
    }${
      storage ? ` and ${storage} storage` : ""
    }. View detailed specifications, compare prices, and find the best laptop deals on Hooks. Updated ${resolveFreshnessDate(updatedAt)}.`,
};

export const tvMeta = {
  title: ({ name, screenSize, resolution, updatedAt = null }) =>
    `${name}${screenSize ? ` (${screenSize})` : ""}${
      resolution ? ` - ${resolution}` : ""
    } - Full Specifications & Price in India (${resolveFreshnessDate(updatedAt)}) | Hooks`,

  description: ({
    name,
    brand,
    screenSize,
    resolution,
    os,
    updatedAt = null,
  }) =>
    `${name}${brand ? ` by ${brand}` : ""}${
      screenSize ? ` with ${screenSize} display` : ""
    }${resolution ? `, ${resolution} resolution` : ""}${
      os ? `, and ${os}` : ""
    }. Compare TV prices, key features, and store offers on Hooks. Updated ${resolveFreshnessDate(updatedAt)}.`,
};

export const networkingMeta = {
  title: ({ name, deviceType }) =>
    `${name}${deviceType ? ` (${deviceType})` : ""} (${CURRENT_MONTH_YEAR}) | Specs, Price & Coverage | Hooks`,

  description: ({ name, deviceType, brand }) =>
    `${name}${deviceType ? ` ${deviceType}` : ""}${
      brand ? ` by ${brand}` : ""
    }. Check Wi-Fi standards, speed, coverage, and compare prices from trusted stores on Hooks.`,
};

export const homeApplianceMeta = {
  title: ({ name, applianceType, capacity }) =>
    `${name}${capacity ? ` ${capacity}` : ""}${
      applianceType ? ` ${applianceType}` : ""
    } (${CURRENT_MONTH_YEAR}) | Price & Features | Hooks`,

  description: ({ name, applianceType, capacity, brand }) =>
    `${name}${capacity ? ` ${capacity}` : ""}${
      applianceType ? ` ${applianceType}` : ""
    }${brand ? ` by ${brand}` : ""}. Explore energy rating, performance, features, warranty, and compare prices on Hooks.`,
};

export default {
  smartphoneMeta,
  laptopMeta,
  tvMeta,
  networkingMeta,
  homeApplianceMeta,
};
