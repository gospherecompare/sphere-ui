const DEFAULT_API_BASE_URL = "https://api.apisphere.in/api";
const DEFAULT_LOCAL_API_BASE_URL = "http://localhost:5000/api";
const SITE_ORIGIN = "https://tryhook.shop";
const SMARTPHONE_SEO_SUFFIX = "-price-in-india";

const trimTrailingSlash = (value = "") => String(value || "").replace(/\/+$/g, "");

// Keep the browser build compatible with Vite/Vike's module runner. Environment
// keys must be statically named during SSR.
const viteApiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";
const serverApiBaseUrl =
  typeof process !== "undefined" && process?.env
    ? process.env.HOOKS_SSR_API_BASE_URL || process.env.VITE_API_BASE_URL || ""
    : "";
const nodeEnv =
  typeof process !== "undefined" ? String(process.env?.NODE_ENV || "") : "";
const isServerDevelopment =
  typeof window === "undefined" && nodeEnv !== "production";

export const API_BASE_URL = trimTrailingSlash(
  serverApiBaseUrl ||
    viteApiBaseUrl ||
    (isServerDevelopment ? DEFAULT_LOCAL_API_BASE_URL : DEFAULT_API_BASE_URL),
);

export const toSlug = (value = "") =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

export const stripSmartphoneSeoSuffix = (slug = "") => {
  const value = String(slug || "").toLowerCase().trim();
  if (!value) return "";
  if (value.endsWith(SMARTPHONE_SEO_SUFFIX)) {
    return value.slice(0, -SMARTPHONE_SEO_SUFFIX.length).replace(/-+$/g, "");
  }
  return value;
};

export const toSmartphoneSeoSlug = (value = "") => {
  const base = stripSmartphoneSeoSuffix(toSlug(value));
  return base ? `${base}${SMARTPHONE_SEO_SUFFIX}` : "";
};

export const toSmartphonePath = (device = {}) => {
  const slug =
    toSmartphoneSeoSlug(device?.name || device?.product_name || device?.model) ||
    toSmartphoneSeoSlug(device?.slug);
  return slug ? `/smartphones/${slug}` : "/smartphones";
};

export const toCanonicalUrl = (path = "/") => {
  const cleanPath = String(path || "/").startsWith("/")
    ? String(path || "/")
    : `/${path}`;
  return `${SITE_ORIGIN}${cleanPath}`;
};

export const fetchJson = async (path, options = {}) => {
  const url = /^https?:\/\//i.test(path) ? path : `${API_BASE_URL}${path}`;
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    cache: "no-store",
    ...options,
  });
  if (!response.ok) {
    const error = new Error(`HTTP ${response.status} for ${url}`);
    error.statusCode = response.status;
    throw error;
  }
  return response.json();
};

const pickArray = (payload, keys = []) => {
  if (Array.isArray(payload)) return payload;
  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  for (const key of ["data", "results", "rows", "smartphones", "new", "upcoming"]) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  return [];
};

export const toPriceNumber = (value) => {
  if (value == null || value === "") return null;
  const normalized =
    typeof value === "string" ? value.replace(/[^0-9.]/g, "") : value;
  const number = Number(normalized);
  return Number.isFinite(number) && number > 0 ? number : null;
};

export const resolveLowestPrice = (device = {}) => {
  const candidates = [];
  const push = (value) => {
    const price = toPriceNumber(value);
    if (price != null) candidates.push(price);
  };

  const variants = Array.isArray(device?.variants) ? device.variants : [];
  for (const variant of variants) {
    const stores = Array.isArray(variant?.store_prices)
      ? variant.store_prices
      : Array.isArray(variant?.storePrices)
        ? variant.storePrices
        : [];
    for (const store of stores) {
      push(store?.price ?? store?.current_price ?? store?.sale_price);
    }
    push(variant?.base_price ?? variant?.basePrice ?? variant?.price);
  }

  const topLevelStores = Array.isArray(device?.store_prices)
    ? device.store_prices
    : Array.isArray(device?.storePrices)
      ? device.storePrices
      : [];
  for (const store of topLevelStores) {
    push(store?.price ?? store?.current_price ?? store?.sale_price);
  }

  push(
    device?.starting_price ??
      device?.price ??
      device?.base_price ??
      device?.basePrice ??
      device?.numericPrice,
  );

  return candidates.length ? Math.min(...candidates) : null;
};

export const formatInr = (value) => {
  const price = toPriceNumber(value);
  return price == null
    ? ""
    : `₹ ${new Intl.NumberFormat("en-IN", {
        maximumFractionDigits: 0,
      }).format(price)}`;
};

const findSpecText = (source, keys = []) => {
  for (const key of keys) {
    const value = source?.[key];
    if (value == null || value === "") continue;
    if (typeof value === "string" || typeof value === "number") {
      return String(value).trim();
    }
    if (typeof value === "object") {
      for (const childKey of [
        "value",
        "name",
        "type",
        "size",
        "resolution",
        "capacity",
        "chipset",
        "processor",
        "primary",
      ]) {
        if (value?.[childKey]) return String(value[childKey]).trim();
      }
    }
  }
  return "";
};

export const summarizeSpecs = (device = {}) => {
  const display = findSpecText(device?.display || device, [
    "display_size",
    "screen_size",
    "size",
    "display",
  ]);
  const battery = findSpecText(device?.battery || device, [
    "battery_capacity",
    "capacity",
    "battery",
  ]);
  const chipset = findSpecText(device?.performance || device, [
    "chipset",
    "processor",
    "soc",
    "performance",
  ]);
  const camera = findSpecText(device?.camera || device, [
    "rear_camera",
    "primary",
    "camera",
  ]);
  const variant = Array.isArray(device?.variants) ? device.variants[0] : null;
  const memory = [variant?.ram, variant?.storage].filter(Boolean).join(" | ");

  return [
    memory,
    camera && `${camera} Camera`,
    battery && (String(battery).toLowerCase().includes("mah") ? battery : `${battery} Battery`),
    display,
    chipset,
  ].filter(Boolean);
};

export const resolveImage = (device = {}) => {
  if (Array.isArray(device?.images) && device.images[0]) return device.images[0];
  return (
    device?.image_url ||
    device?.image ||
    device?.hero_image ||
    device?.brand_logo ||
    "/hook-logo.png"
  );
};

const SSR_UPCOMING_CACHE_TTL_MS = 30 * 1000;
let upcomingSmartphonesCache = { loadedAt: 0, rows: [] };
let upcomingSmartphonesPromise = null;

const getProductId = (item = {}) =>
  Number(item?.id ?? item?.product_id ?? item?.productId ?? 0) || null;

const matchesSmartphoneSlug = (item = {}, requestedSlug = "") => {
  const target = stripSmartphoneSeoSuffix(requestedSlug);
  if (!target) return false;
  const candidates = [
    item?.slug,
    item?.name,
    item?.product_name,
    item?.model,
    item?.basic_info?.product_name,
    item?.basic_info?.model,
  ];
  return candidates.some((value) => {
    const slug = stripSmartphoneSeoSuffix(toSlug(value || ""));
    return slug && slug === target;
  });
};

export async function fetchSmartphoneDetailBySlug(slug) {
  const catalogPayload = await fetchJson("/smartphones");
  const catalog = pickArray(catalogPayload, ["smartphones", "new", "data", "rows"]);
  const catalogItem = catalog.find((item) => matchesSmartphoneSlug(item, slug));
  const productId = getProductId(catalogItem);
  if (!catalogItem || !productId) {
    const error = new Error("Smartphone not found");
    error.statusCode = 404;
    throw error;
  }

  const [product, competitorPayload] = await Promise.all([
    fetchJson(`/public/product/${encodeURIComponent(productId)}`),
    fetchJson(`/public/product/${encodeURIComponent(productId)}/competitors?limit=3`).catch(
      () => ({ competitors: [] }),
    ),
  ]);

  return {
    product: {
      ...catalogItem,
      ...product,
      id: product?.id ?? productId,
      name: product?.name || catalogItem?.name || catalogItem?.product_name,
      brand: product?.brand || catalogItem?.brand || catalogItem?.brand_name,
    },
    competitors: pickArray(competitorPayload, ["competitors"]).slice(0, 3),
  };
}

export async function fetchUpcomingSmartphones({ limit = 24 } = {}) {
  const safeLimit = Math.max(1, Math.min(80, Number(limit) || 24));
  const now = Date.now();
  if (
    upcomingSmartphonesCache.loadedAt &&
    now - upcomingSmartphonesCache.loadedAt < SSR_UPCOMING_CACHE_TTL_MS
  ) {
    return upcomingSmartphonesCache.rows.slice(0, safeLimit);
  }

  if (!upcomingSmartphonesPromise) {
    upcomingSmartphonesPromise = fetchJson(
      "/public/upcoming/smartphones?limit=80",
    )
      .then((payload) => {
        const rows = pickArray(payload, [
          "upcoming",
          "smartphones",
          "data",
          "rows",
        ]).slice(0, 80);
        upcomingSmartphonesCache = { loadedAt: Date.now(), rows };
        return rows;
      })
      .finally(() => {
        upcomingSmartphonesPromise = null;
      });
  }

  const rows = await upcomingSmartphonesPromise;
  return rows.slice(0, safeLimit);
}
