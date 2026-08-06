import { createProductPath } from "../../utils/slugGenerator";
import { isPublishedProduct } from "../../utils/publishedProducts";

export const safeText = (...values) => {
  for (const value of values) {
    if (value == null) continue;
    if (Array.isArray(value)) {
      const nested = safeText(...value);
      if (nested) return nested;
      continue;
    }
    if (typeof value === "object") {
      const nested = safeText(
        value.value,
        value.label,
        value.name,
        value.text,
        value.title,
        value.display,
        value.url,
        value.src,
        value.image_url,
        value.imageUrl,
      );
      if (nested) return nested;
      continue;
    }
    const text = String(value).replace(/\s+/g, " ").trim();
    if (text && !/^(null|undefined|n\/a|na)$/i.test(text)) return text;
  }
  return "";
};

export const toNumber = (...values) => {
  for (const value of values) {
    if (value == null || value === "") continue;
    if (typeof value === "number" && Number.isFinite(value)) return value;
    const parsed = Number(String(value).replace(/[^0-9.-]/g, ""));
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

const parseArray = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return [];
  const text = value.trim();
  if (!text || (!text.startsWith("[") && !text.startsWith("{"))) return [];
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return [];
  }
};

const firstImage = (item = {}) => {
  const images = [
    item.image,
    item.image_url,
    item.imageUrl,
    item.product_image,
    item.productImage,
    item.thumbnail,
    item.basic_info?.image,
    item.basic_info?.product_image,
    ...(Array.isArray(item.images) ? item.images : parseArray(item.images)),
    ...(Array.isArray(item.images_json)
      ? item.images_json
      : parseArray(item.images_json)),
    ...(Array.isArray(item.metadata?.images) ? item.metadata.images : []),
  ];
  return safeText(...images);
};

const variantsFor = (item = {}) => {
  if (Array.isArray(item.variants)) return item.variants;
  if (Array.isArray(item.variants_json)) return item.variants_json;
  return parseArray(item.variants || item.variants_json);
};

const lowestPriceFor = (item = {}) => {
  const prices = [
    toNumber(item.lowestPrice),
    toNumber(item.lowest_price),
    toNumber(item.price),
    toNumber(item.base_price),
    toNumber(item.basePrice),
    toNumber(item.starting_price),
    toNumber(item.min_price),
    toNumber(item.minPrice),
  ].filter((value) => Number.isFinite(value) && value > 0);

  const addStorePrices = (stores) => {
    if (!Array.isArray(stores)) return;
    stores.forEach((store) => {
      const price = toNumber(store?.price, store?.sale_price, store?.offer_price);
      if (Number.isFinite(price) && price > 0) prices.push(price);
    });
  };

  variantsFor(item).forEach((variant) => {
    const price = toNumber(
      variant?.price,
      variant?.base_price,
      variant?.basePrice,
    );
    if (Number.isFinite(price) && price > 0) prices.push(price);
    addStorePrices(variant?.store_prices || variant?.storePrices);
  });
  addStorePrices(item.store_prices || item.storePrices);

  return prices.length ? Math.min(...prices) : null;
};

const resolveType = (item = {}, fallback = "smartphones") => {
  const raw = safeText(
    item.product_type,
    item.productType,
    item.deviceType,
    item.type,
    fallback,
  ).toLowerCase();
  if (raw.includes("laptop") || raw.includes("notebook")) return "laptops";
  if (raw.includes("network") || raw.includes("router") || raw.includes("wifi")) {
    return "networking";
  }
  if (raw.includes("tv") || raw.includes("television") || raw.includes("appliance")) {
    return "tvs";
  }
  return "smartphones";
};

const specText = (item = {}) =>
  safeText(
    item.performance?.chipset,
    item.performance?.processor,
    item.chipset,
    item.processor,
    item.display?.screen_size,
    item.display?.display_size,
    item.screen_size,
    item.battery?.capacity,
    item.battery_capacity,
    item.network?.wifi,
  );

const secondarySpecText = (item = {}) =>
  safeText(
    item.camera?.rear_camera,
    item.camera?.primary_camera,
    item.primary_camera,
    item.display?.refresh_rate,
    item.refresh_rate,
    item.battery?.fast_charging,
    item.fast_charging,
  );

const scoreFor = (item = {}) => {
  const raw = toNumber(
    item.hook_score,
    item.hookScore,
    item.score,
    item.rating,
    item.trend_score,
    item.trending_score,
  );
  if (!Number.isFinite(raw)) return null;
  if (raw <= 1) return Math.round(raw * 100);
  if (raw <= 10) return Math.round(raw * 10);
  return Math.max(0, Math.min(100, Math.round(raw)));
};

const dateFor = (item = {}) => {
  const value = safeText(
    item.launch_date,
    item.launchDate,
    item.release_date,
    item.releaseDate,
    item.created_at,
    item.createdAt,
  );
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const normalizeHomeProduct = (item = {}, fallbackType = "smartphones") => {
  if (!item || typeof item !== "object" || !isPublishedProduct(item)) return null;
  const name = safeText(
    item.name,
    item.product_name,
    item.productName,
    item.model,
    item.title,
    item.basic_info?.product_name,
    item.basic_info?.model,
  );
  if (!name) return null;

  const type = resolveType(item, fallbackType);
  const id = safeText(
    item.product_id,
    item.productId,
    item.id,
    item.basic_info?.id,
    name,
  );
  const brand = safeText(
    item.brand_name,
    item.brandName,
    item.brand,
    item.manufacturer,
    item.basic_info?.brand,
  );
  const price = lowestPriceFor(item);
  const launchDate = dateFor(item);
  const signal = toNumber(
    item.search_count_30d,
    item.searchCount,
    item.compare_count,
    item.trend_score,
    item.trending_score,
    item.search_popularity_score,
  ) || 0;

  return {
    id,
    name,
    brand,
    type,
    image: firstImage(item),
    price,
    score: scoreFor(item),
    spec: specText(item),
    secondarySpec: secondarySpecText(item),
    launchDate,
    signal,
    path: createProductPath(type, name),
    raw: item,
  };
};

export const productRowsFromPayload = (payload) => {
  const candidates = [
    payload?.trending,
    payload?.new,
    payload?.latest,
    payload?.launches,
    payload?.smartphones,
    payload?.products,
    payload?.results,
    payload?.data,
    payload?.devices,
    Array.isArray(payload) ? payload : null,
  ];
  return candidates.find(Array.isArray) || [];
};

export const uniqueProducts = (products = []) => {
  const seen = new Set();
  return products.filter((product) => {
    if (!product?.name) return false;
    const key = `${product.type}:${product.id || product.name}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const excludeProducts = (products = [], used = []) => {
  const keys = new Set(
    used.map((product) => `${product?.type}:${product?.id || product?.name}`.toLowerCase()),
  );
  return products.filter(
    (product) =>
      !keys.has(`${product?.type}:${product?.id || product?.name}`.toLowerCase()),
  );
};

export const normalizeBrand = (brand = {}) => {
  const name = safeText(brand?.name, brand?.brand_name, brand);
  if (!name) return null;
  return {
    id: safeText(brand?.id, brand?.brand_id, name),
    name,
    slug: safeText(brand?.slug) || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    logo: safeText(brand?.logo, brand?.image, brand?.logo_url, brand?.brand_logo),
    category: safeText(brand?.category, brand?.product_type).toLowerCase(),
  };
};

export const normalizeComparison = (row = {}) => {
  const leftName = safeText(row.product_name, row.left_name, row.leftName);
  const rightName = safeText(
    row.compared_product_name,
    row.right_name,
    row.rightName,
  );
  if (!leftName || !rightName) return null;
  return {
    leftId: safeText(row.product_id, row.left_id, row.leftId, leftName),
    leftName,
    leftImage: safeText(row.product_image, row.left_image, row.leftImage),
    rightId: safeText(
      row.compared_product_id,
      row.right_id,
      row.rightId,
      rightName,
    ),
    rightName,
    rightImage: safeText(
      row.compared_product_image,
      row.right_image,
      row.rightImage,
    ),
    count: toNumber(row.compare_count, row.count) || 0,
  };
};

export const formatPrice = (value) => {
  if (!Number.isFinite(value) || value <= 0) return "Price pending";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatCompact = (value) => {
  const number = Number(value) || 0;
  return new Intl.NumberFormat("en-IN", {
    notation: number >= 1000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(number);
};

export const formatLaunchDate = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "Recently added";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
};
