// Meta templates for product detail pages
const CURRENT_SHORT_MONTH_YEAR = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "numeric",
}).format(new Date());
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
  title: ({ name, brand }) => {
    const identity =
      brand && name
        ? name.toLowerCase().includes(brand.toLowerCase())
          ? name
          : `${brand} ${name}`
        : name || brand || "";
    if (!identity) return "";

    return `${identity} Price in India, Specs & Features (${CURRENT_SHORT_MONTH_YEAR}) | MobileX`;
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
    const intro = `Check the latest ${identity} price in India, full specifications, features, images, variants, launch date, availability, reviews, and comparisons on MobileX. Updated ${freshnessDate}.`;
    const cleanHighlights = Array.isArray(highlights)
      ? highlights.filter(Boolean).slice(0, 3)
      : [];

    return cleanHighlights.length
      ? `${intro} Key highlights: ${cleanHighlights.join(", ")}.`
      : intro;
  },
};

export const laptopMeta = {
  title: ({ name }) =>
    `${name} Price in India, Specs & Features (${CURRENT_SHORT_MONTH_YEAR}) | MobileX`,

  description: ({ name, cpu, ram, storage, brand, updatedAt = null }) =>
    `${name}${brand ? ` by ${brand}` : ""}${cpu ? ` powered by ${cpu}` : ""}${
      ram ? ` with ${ram} RAM` : ""
    }${
      storage ? ` and ${storage} storage` : ""
    }. View detailed specifications, compare prices, and find the best laptop deals on MobileX. Updated ${resolveFreshnessDate(updatedAt)}.`,
};

export const tvMeta = {
  title: ({ name }) =>
    `${name} Price in India, Specs & Features (${CURRENT_SHORT_MONTH_YEAR}) | MobileX`,

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
    }. Compare TV prices, key features, and store offers on MobileX. Updated ${resolveFreshnessDate(updatedAt)}.`,
};

export const networkingMeta = {
  title: ({ name }) =>
    `${name} Price in India, Specs & Features (${CURRENT_SHORT_MONTH_YEAR}) | MobileX`,

  description: ({ name, deviceType, brand }) =>
    `${name}${deviceType ? ` ${deviceType}` : ""}${
      brand ? ` by ${brand}` : ""
    }. Check Wi-Fi standards, speed, coverage, and compare prices from trusted stores on MobileX.`,
};

export const homeApplianceMeta = {
  title: ({ name, applianceType, capacity }) =>
    `${name}${capacity ? ` ${capacity}` : ""}${
      applianceType ? ` ${applianceType}` : ""
    } (${CURRENT_MONTH_YEAR}) | Price & Features | MobileX`,

  description: ({ name, applianceType, capacity, brand }) =>
    `${name}${capacity ? ` ${capacity}` : ""}${
      applianceType ? ` ${applianceType}` : ""
    }${brand ? ` by ${brand}` : ""}. Explore energy rating, performance, features, warranty, and compare prices on MobileX.`,
};

export default {
  smartphoneMeta,
  laptopMeta,
  tvMeta,
  networkingMeta,
  homeApplianceMeta,
};
