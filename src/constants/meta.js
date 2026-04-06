// Meta templates for product detail pages
const CURRENT_MONTH_YEAR = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "numeric",
}).format(new Date());

export const smartphoneMeta = {
  title: ({ name, brand }) => {
    const identity =
      brand && name
        ? name.toLowerCase().includes(brand.toLowerCase())
          ? name
          : `${brand} ${name}`
        : name || brand || "";
    if (!identity) return "";

    return `${identity} - See full specifications, price & more (${CURRENT_MONTH_YEAR}) - Hooks`;
  },

  description: ({ name, brand, highlights = [] }) => {
    const identity =
      brand && name
        ? name.toLowerCase().includes(brand.toLowerCase())
          ? name
          : `${brand} ${name}`
        : name || brand || "";
    if (!identity) return "";

    const intro = `Explore ${identity} price in India, complete specifications, key features, RAM and storage variants, display, camera and battery details, and a clear buying guide to help you choose the right variant.`;
    const cleanHighlights = Array.isArray(highlights)
      ? highlights.filter(Boolean).slice(0, 3)
      : [];

    return cleanHighlights.length
      ? `${intro} Key highlights: ${cleanHighlights.join(", ")}.`
      : intro;
  },
};

export const laptopMeta = {
  title: ({ name, cpu, ram, storage }) =>
    `${name}${cpu ? ` (${cpu}` : ""}${ram ? `, ${ram} RAM` : ""}${
      storage ? `, ${storage})` : cpu ? ")" : ""
    } (${CURRENT_MONTH_YEAR}) - Price & Specs - Hooks`,

  description: ({ name, cpu, ram, storage, brand }) =>
    `${name}${brand ? ` by ${brand}` : ""}${cpu ? ` powered by ${cpu}` : ""}${
      ram ? ` with ${ram} RAM` : ""
    }${
      storage ? ` and ${storage} storage` : ""
    }. View detailed specifications, compare prices, and find the best laptop deals on Hooks.`,
};

export const tvMeta = {
  title: ({ name, screenSize, resolution }) =>
    `${name}${screenSize ? ` (${screenSize})` : ""}${
      resolution ? ` - ${resolution}` : ""
    } (${CURRENT_MONTH_YEAR}) - Price & Specs - Hooks`,

  description: ({ name, brand, screenSize, resolution, os }) =>
    `${name}${brand ? ` by ${brand}` : ""}${
      screenSize ? ` with ${screenSize} display` : ""
    }${resolution ? `, ${resolution} resolution` : ""}${
      os ? `, and ${os}` : ""
    }. Compare TV prices, key features, and store offers on Hooks.`,
};

export const networkingMeta = {
  title: ({ name, deviceType }) =>
    `${name}${deviceType ? ` (${deviceType})` : ""} (${CURRENT_MONTH_YEAR}) - Specs, Price & Coverage - Hooks`,

  description: ({ name, deviceType, brand }) =>
    `${name}${deviceType ? ` ${deviceType}` : ""}${
      brand ? ` by ${brand}` : ""
    }. Check Wi-Fi standards, speed, coverage, and compare prices from trusted stores on Hooks.`,
};

export const homeApplianceMeta = {
  title: ({ name, applianceType, capacity }) =>
    `${name}${capacity ? ` ${capacity}` : ""}${
      applianceType ? ` ${applianceType}` : ""
    } (${CURRENT_MONTH_YEAR}) - Price & Features - Hooks`,

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
