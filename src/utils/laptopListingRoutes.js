export const LAPTOP_LISTING_BASE_PATH = "/laptops";
export const LAPTOP_DISCOVERY_PRICE_BUCKETS = [
  30000, 50000, 70000, 100000, 150000,
];
export const LAPTOP_FEATURE_ROUTE_META = {
  gaming: { name: "Gaming", description: "RTX and GTX graphics" },
  "high-ram": { name: "16GB+ RAM", description: "Higher multitasking" },
  "high-storage": { name: "512GB+ SSD", description: "Large fast storage" },
  lightweight: { name: "Lightweight", description: "Portable design" },
  "long-battery": { name: "Long Battery", description: "60Wh+ battery" },
  "high-refresh-rate": { name: "120Hz+", description: "Smoother visuals" },
  "oled-display": { name: "OLED Display", description: "Vibrant colors" },
  touchscreen: { name: "Touchscreen", description: "Touch support" },
  intel: { name: "Intel", description: "Intel processors" },
  amd: { name: "AMD", description: "AMD processors" },
};

const safeDecode = (value = "") => {
  try {
    return decodeURIComponent(String(value || ""));
  } catch {
    return String(value || "");
  }
};

export const normalizeLaptopListingSlug = (value = "") =>
  safeDecode(value)
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const TITLE_WORDS = {
  amd: "AMD",
  asus: "ASUS",
  hp: "HP",
  lg: "LG",
  msi: "MSI",
  oled: "OLED",
  ram: "RAM",
  ssd: "SSD",
};

export const toLaptopListingLabel = (value = "") => {
  const normalized = safeDecode(value)
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) return "";
  return normalized
    .split(" ")
    .map((word) => TITLE_WORDS[word.toLowerCase()] || `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");
};

export const getLaptopFeatureRouteMeta = (value = "") => {
  const id = normalizeLaptopListingSlug(value);
  if (!id) return null;
  const matched = LAPTOP_FEATURE_ROUTE_META[id];
  return {
    id,
    name: matched?.name || toLaptopListingLabel(id),
    description: matched?.description || toLaptopListingLabel(id),
  };
};

export const normalizeLaptopBudget = (value) => {
  const numeric = Number(String(value ?? "").replace(/[^\d]/g, ""));
  return LAPTOP_DISCOVERY_PRICE_BUCKETS.includes(numeric) ? numeric : null;
};

const toQueryString = (query = null) => {
  if (!query) return "";
  if (typeof query === "string") {
    const normalized = query.replace(/^\?+/, "").trim();
    return normalized ? `?${normalized}` : "";
  }
  if (query instanceof URLSearchParams) {
    const text = query.toString();
    return text ? `?${text}` : "";
  }
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value == null) return;
    const text = String(value).trim();
    if (text) params.set(key, text);
  });
  const text = params.toString();
  return text ? `?${text}` : "";
};

export const buildLaptopListingPath = ({
  brand = "",
  feature = "",
  features = [],
  budget = null,
  latest = false,
  query = null,
} = {}) => {
  const brandSlug = normalizeLaptopListingSlug(brand);
  const featureSlugs = [
    ...(Array.isArray(features) ? features : []),
    feature,
  ]
    .map(normalizeLaptopListingSlug)
    .filter(Boolean)
    .filter((value, index, values) => values.indexOf(value) === index)
    .slice(0, 2);
  const normalizedBudget = normalizeLaptopBudget(budget);

  let path = LAPTOP_LISTING_BASE_PATH;
  if (latest) {
    path += "/latest";
  } else if (brandSlug && featureSlugs[0]) {
    path += `/brands/${brandSlug}/features/${featureSlugs[0]}`;
  } else if (brandSlug && normalizedBudget) {
    path += `/brands/${brandSlug}/under-${normalizedBudget}`;
  } else if (featureSlugs[0] && featureSlugs[1]) {
    path += `/features/${featureSlugs[0]}/${featureSlugs[1]}`;
  } else if (featureSlugs[0] && normalizedBudget) {
    path += `/features/${featureSlugs[0]}/under-${normalizedBudget}`;
  } else if (brandSlug) {
    path += `/brands/${brandSlug}`;
  } else if (featureSlugs[0]) {
    path += `/features/${featureSlugs[0]}`;
  } else if (normalizedBudget) {
    path += `/under-${normalizedBudget}`;
  }

  return `${path}${toQueryString(query)}`;
};

export const stripLaptopSeoQueryParams = (search = "") => {
  const params = new URLSearchParams(search || "");
  [
    "brand",
    "feature",
    "filter",
    "budget",
    "maxPrice",
    "priceMax",
    "max_price",
  ].forEach((key) => params.delete(key));
  return params;
};

export const parseLaptopListingPath = (pathname = "") => {
  const normalizedPath =
    String(pathname || "").trim().replace(/\/+$/g, "") ||
    LAPTOP_LISTING_BASE_PATH;

  if (normalizedPath === LAPTOP_LISTING_BASE_PATH) {
    return {
      brandSlug: "",
      featureSlugs: [],
      budget: null,
      latest: false,
      canonicalPath: LAPTOP_LISTING_BASE_PATH,
    };
  }

  if (normalizedPath === `${LAPTOP_LISTING_BASE_PATH}/latest`) {
    return {
      brandSlug: "",
      featureSlugs: [],
      budget: null,
      latest: true,
      canonicalPath: `${LAPTOP_LISTING_BASE_PATH}/latest`,
    };
  }

  const patterns = [
    {
      regex: /^\/laptops\/brands\/([^/]+)\/features\/([^/]+)$/i,
      toMeta: ([, brand, feature]) => ({ brand, features: [feature] }),
    },
    {
      regex: /^\/laptops\/brands\/([^/]+)\/under-(\d+)$/i,
      toMeta: ([, brand, budget]) => ({ brand, budget }),
    },
    {
      regex: /^\/laptops\/features\/([^/]+)\/under-(\d+)$/i,
      toMeta: ([, feature, budget]) => ({ features: [feature], budget }),
    },
    {
      regex: /^\/laptops\/features\/([^/]+)\/([^/]+)$/i,
      toMeta: ([, firstFeature, secondFeature]) => ({
        features: [firstFeature, secondFeature],
      }),
    },
    {
      regex: /^\/laptops\/brands\/([^/]+)$/i,
      toMeta: ([, brand]) => ({ brand }),
    },
    {
      regex: /^\/laptops\/features\/([^/]+)$/i,
      toMeta: ([, feature]) => ({ features: [feature] }),
    },
    {
      regex: /^\/laptops\/under-(\d+)$/i,
      toMeta: ([, budget]) => ({ budget }),
    },
  ];

  for (const pattern of patterns) {
    const match = normalizedPath.match(pattern.regex);
    if (!match) continue;
    const values = pattern.toMeta(match);
    const brandSlug = normalizeLaptopListingSlug(values.brand);
    const featureSlugs = (values.features || [])
      .map(normalizeLaptopListingSlug)
      .filter(Boolean);
    const budget = normalizeLaptopBudget(values.budget);
    if (values.budget && !budget) return null;
    return {
      brandSlug,
      featureSlugs,
      budget,
      latest: false,
      canonicalPath: buildLaptopListingPath({
        brand: brandSlug,
        features: featureSlugs,
        budget,
      }),
    };
  }

  return null;
};

export const buildLaptopListingSeoMeta = (
  routeMeta = {},
  { brandName = "", monthYear = "", fullDate = "" } = {},
) => {
  const brand = brandName || toLaptopListingLabel(routeMeta.brandSlug);
  const features = (routeMeta.featureSlugs || [])
    .map(getLaptopFeatureRouteMeta)
    .filter(Boolean);
  const [firstFeature, secondFeature] = features;
  const budget = normalizeLaptopBudget(routeMeta.budget);
  const budgetText = budget ? `₹${budget}` : "";

  if (routeMeta.latest) {
    return {
      title: `Latest Laptops in India (${fullDate}) - Prices & Specs - Hooks`,
      description:
        "Browse the latest laptops added in India with updated prices, processor details, RAM, storage, display specifications, and store availability on Hooks.",
      heading: "Latest Laptops in India",
      eyebrow: "LATEST LAPTOPS",
    };
  }

  if (brand && firstFeature) {
    return {
      title: `Best ${brand} ${firstFeature.name} Laptops in India - Hooks`,
      description: `Compare the best ${brand} ${firstFeature.name} laptops in India with updated prices, detailed specifications, and store offers on Hooks.`,
      heading: `${brand} ${firstFeature.name} Laptops`,
      eyebrow: `${brand.toUpperCase()} ${firstFeature.name.toUpperCase()}`,
    };
  }

  if (brand && budget) {
    return {
      title: `Best ${brand} Laptops Under ${budgetText} in India - Hooks`,
      description: `Compare ${brand} laptops under ${budgetText} in India with updated prices, specifications, and store offers on Hooks.`,
      heading: `${brand} Laptops Under ${budgetText}`,
      eyebrow: `${brand.toUpperCase()} BUDGET LAPTOPS`,
    };
  }

  if (firstFeature && secondFeature) {
    return {
      title: `Best ${firstFeature.name} Laptops with ${secondFeature.name} - Hooks`,
      description: `Compare the best ${firstFeature.name} laptops with ${secondFeature.name}, updated prices, detailed specifications, and store offers on Hooks.`,
      heading: `${firstFeature.name} Laptops with ${secondFeature.name}`,
      eyebrow: "FEATURED LAPTOPS",
    };
  }

  if (firstFeature && budget) {
    return {
      title: `Best ${firstFeature.name} Laptops Under ${budgetText} in India - Hooks`,
      description: `Compare the best ${firstFeature.name} laptops under ${budgetText} in India with updated prices, specifications, and store offers on Hooks.`,
      heading: `${firstFeature.name} Laptops Under ${budgetText}`,
      eyebrow: "FEATURE BUDGET LAPTOPS",
    };
  }

  if (budget) {
    return {
      title: `Best Laptops Under ${budgetText} in India - Prices & Specs - Hooks`,
      description: `Compare the best laptops under ${budgetText} in India with updated prices, processor details, RAM, storage, display specifications, and store offers on Hooks.`,
      heading: `Best Laptops Under ${budgetText}`,
      eyebrow: "BUDGET LAPTOPS",
    };
  }

  if (brand) {
    return {
      title: `${brand} Laptops in India - Latest Models Prices & Specs - Hooks`,
      description: `Browse ${brand} laptops in India with the latest models, updated prices, detailed specifications, and store offers on Hooks.`,
      heading: `${brand} Laptops in India`,
      eyebrow: `${brand.toUpperCase()} LAPTOPS`,
    };
  }

  if (firstFeature) {
    return {
      title: `Best ${firstFeature.name} Laptops in India - Prices Specs & Features - Hooks`,
      description: `Compare the best ${firstFeature.name} laptops in India with updated prices, detailed specifications, and store offers on Hooks.`,
      heading: `${firstFeature.name} Laptops in India`,
      eyebrow: `${firstFeature.name.toUpperCase()} LAPTOPS`,
    };
  }

  return {
    title: `Best Laptops in India (${monthYear}) - Hooks`,
    description:
      "Compare the best laptops in India across brands, budgets, processors, RAM, storage, displays, and store prices on Hooks.",
    heading: "Best Laptops in India",
    eyebrow: "LAPTOP COLLECTION",
  };
};
