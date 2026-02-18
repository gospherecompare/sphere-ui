// Meta templates for product detail pages
export const smartphoneMeta = {
  title: ({ name, ram, storage }) =>
    `${name}${ram ? ` (${ram} RAM` : ""}${
      storage ? `, ${storage} Storage)` : ram ? ")" : ""
    } - Price, Specs & Offers | Hook`,

  description: ({ name, ram, storage, brand }) =>
    `${name}${brand ? ` by ${brand}` : ""}${ram ? ` with ${ram} RAM` : ""}${
      storage ? ` and ${storage} storage` : ""
    }. Compare prices, variants, and full specifications on Hook.`,
};

export const laptopMeta = {
  title: ({ name, cpu, ram, storage }) =>
    `${name}${cpu ? ` (${cpu}` : ""}${ram ? `, ${ram} RAM` : ""}${
      storage ? `, ${storage})` : cpu ? ")" : ""
    } - Price & Specs | Hook`,

  description: ({ name, cpu, ram, storage, brand }) =>
    `${name}${brand ? ` by ${brand}` : ""}${cpu ? ` powered by ${cpu}` : ""}${
      ram ? ` with ${ram} RAM` : ""
    }${
      storage ? ` and ${storage} storage` : ""
    }. View detailed specifications, compare prices, and find the best laptop deals on Hook.`,
};

export const tvMeta = {
  title: ({ name, screenSize, resolution }) =>
    `${name}${screenSize ? ` (${screenSize})` : ""}${
      resolution ? ` - ${resolution}` : ""
    } - Price & Specs | Hook`,

  description: ({ name, brand, screenSize, resolution, os }) =>
    `${name}${brand ? ` by ${brand}` : ""}${
      screenSize ? ` with ${screenSize} display` : ""
    }${resolution ? `, ${resolution} resolution` : ""}${
      os ? `, and ${os}` : ""
    }. Compare TV prices, key features, and store offers on Hook.`,
};

export const networkingMeta = {
  title: ({ name, deviceType }) =>
    `${name}${deviceType ? ` (${deviceType})` : ""} - Specs, Price & Coverage | Hook`,

  description: ({ name, deviceType, brand }) =>
    `${name}${deviceType ? ` ${deviceType}` : ""}${
      brand ? ` by ${brand}` : ""
    }. Check Wi-Fi standards, speed, coverage, and compare prices from trusted stores on Hook.`,
};

export const homeApplianceMeta = {
  title: ({ name, applianceType, capacity }) =>
    `${name}${capacity ? ` ${capacity}` : ""}${
      applianceType ? ` ${applianceType}` : ""
    } - Price & Features | Hook`,

  description: ({ name, applianceType, capacity, brand }) =>
    `${name}${capacity ? ` ${capacity}` : ""}${
      applianceType ? ` ${applianceType}` : ""
    }${brand ? ` by ${brand}` : ""}. Explore energy rating, performance, features, warranty, and compare prices on Hook.`,
};

export default {
  smartphoneMeta,
  laptopMeta,
  tvMeta,
  networkingMeta,
  homeApplianceMeta,
};
