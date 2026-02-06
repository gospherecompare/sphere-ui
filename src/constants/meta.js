// Meta templates for product detail pages
export const smartphoneMeta = {
  title: ({ name, ram, storage }) =>
    `${name}${ram ? ` (${ram} RAM` : ""}${
      storage ? `, ${storage} Storage)` : ram ? ")" : ""
    } – Price, Specs & Offers`,

  description: ({ name, ram, storage, brand }) =>
    `${name} by ${brand || ""}${ram ? ` with ${ram} RAM` : ""}${
      storage ? ` and ${storage} storage` : ""
    }. Compare prices, variants, specifications, and latest offers across top stores on SmartArena.`,
};

export const laptopMeta = {
  title: ({ name, cpu, ram, storage }) =>
    `${name}${cpu ? ` (${cpu}` : ""}${ram ? `, ${ram} RAM` : ""}${
      storage ? `, ${storage})` : cpu ? ")" : ""
    } – Price & Specs`,

  description: ({ name, cpu, ram, storage, brand }) =>
    `${name} by ${brand || ""}${cpu ? ` powered by ${cpu}` : ""}${
      ram ? ` with ${ram} RAM` : ""
    }${
      storage ? ` and ${storage} storage` : ""
    }. View detailed specs, compare prices, and find the best laptop deals on SmartArena.`,
};

export const networkingMeta = {
  title: ({ name, deviceType }) =>
    `${name}${deviceType ? ` (${deviceType})` : ""} – Specs, Price & Coverage`,

  description: ({ name, deviceType, brand }) =>
    `${name}${deviceType ? ` ${deviceType}` : ""} by ${
      brand || ""
    }. Check Wi-Fi standards, speed, coverage, performance, and compare prices from trusted stores on SmartArena.`,
};

export const homeApplianceMeta = {
  title: ({ name, applianceType, capacity }) =>
    `${name}${capacity ? ` ${capacity}` : ""}${
      applianceType ? ` ${applianceType}` : ""
    } – Price & Features`,

  description: ({ name, applianceType, capacity, brand }) =>
    `${name}${capacity ? ` ${capacity}` : ""}${
      applianceType ? ` ${applianceType}` : ""
    } by ${
      brand || ""
    }. Explore energy rating, performance, features, warranty, and compare prices on SmartArena.`,
};

export default {
  smartphoneMeta,
  laptopMeta,
  networkingMeta,
  homeApplianceMeta,
};
