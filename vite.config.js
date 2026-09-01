import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  createAboutPageSchema,
  createBreadcrumbSchema,
  createCollectionSchema,
  createContactPageSchema,
  createItemListSchema,
  createNewsArticleSchema,
  createProductSchema,
  createWebApplicationSchema,
  createWebPageSchema,
} from "./src/utils/schemaGenerators.js";
import {
  SMARTPHONE_FEATURE_ROUTE_META,
  buildSmartphoneBrandPath,
  buildSmartphoneFeaturePath,
  parseSmartphoneListingPath,
  getSmartphoneFeatureRouteMeta,
  toReadableListingLabel,
} from "./src/utils/smartphoneListingRoutes.js";
import {
  LAPTOP_DISCOVERY_PRICE_BUCKETS,
  LAPTOP_FEATURE_ROUTE_META,
  buildLaptopListingPath,
  buildLaptopListingSeoMeta,
  parseLaptopListingPath,
} from "./src/utils/laptopListingRoutes.js";
import { toCanonicalPageUrl } from "./src/utils/publicUrl.js";
import {
  NEWS_LISTING_SEO,
  buildNewsArticleSeo,
  escapeNewsHtml,
  sanitizeNewsArticleHtml,
  stripNewsMarkup,
} from "./src/utils/newsSeo.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SITE_ORIGIN = "https://mobilesx.in";
const DEFAULT_REMOTE_API_BASE_URL = "https://api.apisphere.in/api";
const DEFAULT_LOCAL_API_BASE_URL = "http://localhost:5000/api";
const trimTrailingSlash = (value = "") =>
  String(value || "").replace(/\/+$/g, "");
const resolvePrerenderApiBaseUrl = () => {
  const configured =
    process.env.HOOKS_PRERENDER_API_BASE_URL ||
    process.env.VITE_API_BASE_URL ||
    "";
  if (String(configured || "").trim()) return trimTrailingSlash(configured);

  const lifecycle = String(process.env.npm_lifecycle_event || "").toLowerCase();
  const nodeEnv = String(process.env.NODE_ENV || "").toLowerCase();
  const isDevServer =
    nodeEnv === "development" ||
    lifecycle === "dev" ||
    lifecycle === "start" ||
    lifecycle === "serve";

  return isDevServer ? DEFAULT_LOCAL_API_BASE_URL : DEFAULT_REMOTE_API_BASE_URL;
};
const API_BASE_URL = resolvePrerenderApiBaseUrl();
const API_ORIGIN = (() => {
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return new URL(DEFAULT_REMOTE_API_BASE_URL).origin;
  }
})();
const MAX_DETAIL_ROUTES_PER_CATEGORY = 1000;
const MAX_COMPARE_ROUTES = 380;
const MAX_COMPARE_EXPANSION_PRODUCTS = 24;
const MAX_COMPARE_EXPANDED_ROUTES = 240;
const MAX_COMPARE_EXPANDED_CANDIDATES = 360;
const KNOWN_DISCOVERED_COMPARE_ROUTES = [
  "/compare/oneplus-15r-and-realme-p4-5g-and-realme-gt-7-comparison",
];
const MAX_NEWS_ROUTES = 1000;
const POPULAR_COMPARISON_PRELOAD_ROWS = 12;
const SMARTPHONE_SEO_SUFFIX = "-price-in-india";
const SMARTPHONE_LIST_SLUGS = new Set(["upcoming"]);
const SMARTPHONE_FILTER_SEO = {
  "under-10000": { label: "Under ₹10,000" },
  "under-15000": { label: "Under ₹15,000" },
  "under-20000": { label: "Under ₹20,000" },
  "under-25000": { label: "Under ₹25,000" },
  "under-30000": { label: "Under ₹30,000" },
  "under-40000": { label: "Under ₹40,000" },
  "under-50000": { label: "Under ₹50,000" },
  "above-50000": { label: "Above ₹50,000" },
  new: { label: "Latest" },
};
const SMARTPHONE_FILTER_ROUTE_PATHS = new Set(
  Object.keys(SMARTPHONE_FILTER_SEO).map(
    (slug) => `/smartphones/filter/${slug}`,
  ),
);
const TV_FEATURE_ROUTE_META = {
  "large-screen": { name: '55"+ Screen', seoName: "55 Inch and Above" },
  "ultra-hd-4k": { name: "4K Ultra HD", seoName: "4K Ultra HD" },
  "high-refresh-rate": { name: "120Hz+", seoName: "120Hz" },
  "oled-qled": { name: "OLED/QLED", seoName: "OLED and QLED" },
  "smart-tv": { name: "Smart TV", seoName: "Smart" },
  hdr: { name: "HDR", seoName: "HDR" },
  "dolby-audio": { name: "Dolby Audio", seoName: "Dolby Audio" },
  gaming: { name: "Gaming Ready", seoName: "Gaming" },
  wifi: { name: "Wi-Fi", seoName: "Wi-Fi" },
  "voice-assistant": { name: "Voice Assistant", seoName: "Voice Assistant" },
  bluetooth: { name: "Bluetooth", seoName: "Bluetooth" },
  "hdmi-2-1": { name: "HDMI 2.1", seoName: "HDMI 2.1" },
  earc: { name: "eARC", seoName: "eARC" },
  "dolby-vision": { name: "Dolby Vision", seoName: "Dolby Vision" },
  "ai-features": { name: "AI Features", seoName: "AI Smart" },
  "av-input": { name: "AV Input", seoName: "AV Input" },
  usb: { name: "USB", seoName: "USB" },
  "wifi-6": { name: "Wi-Fi 6", seoName: "Wi-Fi 6" },
  "wifi-7": { name: "Wi-Fi 7", seoName: "Wi-Fi 7" },
  "dolby-atmos": { name: "Dolby Atmos", seoName: "Dolby Atmos" },
  "hdr10-plus": { name: "HDR10+", seoName: "HDR10+" },
  vrr: { name: "VRR", seoName: "VRR" },
  allm: { name: "ALLM", seoName: "ALLM" },
  memc: { name: "MEMC", seoName: "MEMC" },
  "filmmaker-mode": { name: "Filmmaker Mode", seoName: "Filmmaker Mode" },
  "screen-mirroring": { name: "Screen Mirroring", seoName: "Screen Mirroring" },
  airplay: { name: "AirPlay", seoName: "AirPlay" },
  chromecast: { name: "Chromecast", seoName: "Chromecast" },
  "google-tv": { name: "Google TV", seoName: "Google TV" },
  ethernet: { name: "Ethernet / LAN", seoName: "Ethernet LAN" },
  "optical-audio": { name: "Optical Audio", seoName: "Optical Audio" },
  "headphone-jack": { name: "Headphone Jack", seoName: "Headphone Jack" },
  "rf-input": { name: "RF Input", seoName: "RF Input" },
};
const TV_FEATURE_ROUTE_PATHS = new Set(
  Object.keys(TV_FEATURE_ROUTE_META).map((slug) => `/tvs/features/${slug}`),
);
const LAPTOP_BUDGET_ROUTE_PATHS = new Set(
  LAPTOP_DISCOVERY_PRICE_BUCKETS.map((budget) =>
    buildLaptopListingPath({ budget }),
  ),
);
const PRELOAD_CANONICAL_PATHS = new Set([
  "/",
  "/news",
  "/popular-comparisons",
  "/smartphones",
  "/smartphones/upcoming",
  ...SMARTPHONE_FILTER_ROUTE_PATHS,
  "/tvs",
  "/tvs/latest",
  "/networking",
  "/compare",
  "/trending/smartphones",
  "/trending/tvs",
  "/trending/networking",
]);
const PRELOAD_API_ENDPOINTS = [
  `${API_BASE_URL}/smartphones?page=1&limit=20`,
  `${API_BASE_URL}/networking`,
  `${API_BASE_URL}/tvs`,
  `${API_BASE_URL}/brand`,
  `${API_BASE_URL}/category`,
  `${API_BASE_URL}/public/trending/smartphones`,
  `${API_BASE_URL}/public/new/smartphones`,
  `${API_BASE_URL}/public/upcoming/smartphones`,
  `${API_BASE_URL}/public/trending/networking`,
  `${API_BASE_URL}/public/new/networking`,
  `${API_BASE_URL}/public/trending/tvs`,
  `${API_BASE_URL}/public/new/tvs`,
  `${API_BASE_URL}/public/smartphones/highlights`,
  `${API_BASE_URL}/public/device-field-profiles`,
  // Home route payloads
  `${API_BASE_URL}/public/search-popularity?productType=smartphone&limit=5`,
  `${API_BASE_URL}/public/blogs?limit=4`,
  `${API_BASE_URL}/public/blogs?limit=4&productType=smartphone`,
  `${API_BASE_URL}/public/blogs?limit=4&productType=tv`,
  `${API_BASE_URL}/public/blogs?limit=18`,
  `${API_BASE_URL}/public/blogs?limit=50`,
  `${API_BASE_URL}/public/trending/smartphones?limit=40`,
  `${API_BASE_URL}/public/trending/smartphones?limit=120`,
  `${API_BASE_URL}/public/trending/tvs?limit=120`,
  `${API_BASE_URL}/public/trending/networking?limit=120`,
  `${API_BASE_URL}/public/trending/all`,
  `${API_BASE_URL}/public/trending/most-compared`,
  `${API_BASE_URL}/public/popular-features?deviceType=smartphone&days=7&limit=16`,
  `${API_BASE_URL}/public/popular-features?deviceType=tv&days=7&limit=16`,
  `${API_BASE_URL}/public/popular-features?deviceType=television&days=7&limit=16`,
  `${API_BASE_URL}/public/popular-features?deviceType=home-appliance&days=7&limit=16`,
  `${API_BASE_URL}/public/online-stores`,
];
const PRELOAD_STRIP_KEY_PATTERNS = [
  /_source$/i,
  /_raw$/i,
  /^field_profile$/i,
  /^hook_rank_score$/i,
  /^spec_score_price$/i,
  /^spec_score_price_band$/i,
  /^spec_score_feature_coverage$/i,
];
const CURRENT_YEAR = new Date().getFullYear();
const CURRENT_FULL_DATE = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "long",
  year: "numeric",
}).format(new Date());
const CURRENT_MONTH_LONG_YEAR = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
}).format(new Date());
const CURRENT_MONTH_SHORT_YEAR = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "numeric",
}).format(new Date());
const SMARTPHONE_FEATURE_TITLE_MAP = {
  "high-mp-camera": "Best Camera Phones",
  "long-battery": "Best Battery Phones",
  gaming: "Best Gaming Phones",
  amoled: "Best AMOLED Display Phones",
  "5g": "Best 5G Smartphones",
  nfc: "Best Smartphones with NFC",
};
const getSmartphoneFeatureTitle = (slug, fallback = "") =>
  SMARTPHONE_FEATURE_TITLE_MAP[slug] || `Best ${fallback} Smartphones`;
const getOrdinalSuffix = (day) => {
  const value = Number(day);
  if (!Number.isFinite(value)) return "";
  if (value % 10 === 1 && value !== 11) return "st";
  if (value % 10 === 2 && value !== 12) return "nd";
  if (value % 10 === 3 && value !== 13) return "rd";
  return "th";
};
// Prefers a real per-product update timestamp (once the API exposes one);
// falls back to today's date, matching meta.js's resolveFreshnessDate.
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
const NEWS_DATE_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});
const parseNewsDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};
const formatNewsDateLabel = (value) => {
  const date = parseNewsDate(value);
  return date ? NEWS_DATE_FORMATTER.format(date) : "";
};
const resolveNewsDateModified = (publishedValue, updatedValue) => {
  const published = publishedValue || updatedValue || undefined;
  const updated = updatedValue || publishedValue || undefined;
  const updatedDate = parseNewsDate(updated);
  if (!updatedDate) return published;

  const publishedDate = parseNewsDate(published);
  if (!publishedDate) return updated;
  if (updatedDate.getTime() <= publishedDate.getTime()) return published;
  if (formatNewsDateLabel(updatedDate) === formatNewsDateLabel(publishedDate)) {
    return published;
  }

  return updated;
};
const BUDGET_PHONE_KEYWORDS =
  "budget phones under 10000, budget phones under 15000, budget phones under 20000, budget phones under 30000, budget phones under 50000";
const DEFAULT_SEO_KEYWORDS = `hook, best gadget comparison site, mobile price comparison india, compare laptops smartphones tvs, compare smartphone tv laptops, compare specs, latest smartphones in india ${CURRENT_YEAR}, best smartphones in ${CURRENT_YEAR}, new launch phones, trending phone in india, most popular mobiles, top selling gadgets india, 5g phones in india, ai phones in india, ${BUDGET_PHONE_KEYWORDS}, latest laptops in india ${CURRENT_YEAR}, laptop prices list ${CURRENT_YEAR}, gaming laptops india, student laptops india, laptop comparison india, vacuum cooler laptop and phone, latest smart tvs in india ${CURRENT_YEAR}, tv prices list ${CURRENT_YEAR}, best 4k tv india, best 8k tv india, oled tv india, android tv price india, led tv under 30000, smart tv comparison india`;
const DEFAULT_INDEX_ROBOTS = "index, follow, max-image-preview:large";
let publishedCompareRouteMeta = new Map();
let publishedNewsRouteMeta = new Map();
const STATIC_PRERENDER_ROUTES = [
  "/",
  "/news",
  "/smartphones",
  "/smartphones/upcoming",
  ...SMARTPHONE_FILTER_ROUTE_PATHS,
  "/tvs",
  "/tvs/latest",
  "/networking",
  "/compare",
  "/popular-comparisons",
  "/trending/smartphones",
  "/trending/tvs",
  "/trending/networking",
  "/about",
  "/careers",
  "/contact",
  "/privacy-policy",
  "/terms",
  "/login",
  "/signup",
  "/account",
  "/wishlist",
];

const normalizePath = (routePath = "/") => {
  const rawPath = String(routePath || "").trim();
  if (!rawPath) return "/";

  let pathName = rawPath;
  try {
    pathName = /^https?:\/\//i.test(rawPath)
      ? new URL(rawPath).pathname || "/"
      : new URL(rawPath, SITE_ORIGIN).pathname || rawPath;
  } catch {
    pathName = rawPath.split(/[?#]/, 1)[0] || "/";
  }

  if (!pathName.startsWith("/")) {
    pathName = `/${pathName}`;
  }

  if (pathName.length > 1) {
    return pathName.replace(/\/+$/g, "");
  }

  return pathName || "/";
};

const isRemovedLaptopRoute = (routePath = "") => {
  const normalized = normalizePath(routePath).toLowerCase();
  return (
    normalized === "/laptop" ||
    normalized === "/laptops" ||
    normalized === "/trending/laptop" ||
    normalized === "/trending/laptops" ||
    normalized.startsWith("/laptop/") ||
    normalized.startsWith("/laptops/") ||
    normalized.startsWith("/devices/laptop") ||
    normalized.startsWith("/devices/laptops") ||
    normalized.startsWith("/products/laptop") ||
    normalized.startsWith("/products/laptops")
  );
};

const stripSmartphoneSeoSuffix = (slug = "") => {
  const value = String(slug || "")
    .toLowerCase()
    .trim();
  if (!value) return "";
  if (value.endsWith(SMARTPHONE_SEO_SUFFIX)) {
    return value.slice(0, -SMARTPHONE_SEO_SUFFIX.length).replace(/-+$/g, "");
  }
  return value;
};

const toSmartphoneSeoSlug = (slug = "") => {
  const base = stripSmartphoneSeoSuffix(slug);
  return base ? `${base}${SMARTPHONE_SEO_SUFFIX}` : "";
};

const getSmartphoneCanonicalRouteSlug = (row = {}) => {
  for (const value of [
    row?.name,
    row?.product_name,
    row?.productName,
    row?.basic_info?.product_name,
    row?.model,
    row?.model_number,
    row?.basic_info?.model,
    row?.basic_info?.model_number,
  ]) {
    const slug = toSmartphoneSeoSlug(toSlug(value));
    if (slug) return slug;
  }
  return "";
};

const getSmartphoneRouteSlugs = (row = {}) => {
  const orderedSlugs = [];
  const seen = new Set();
  for (const value of [
    row?.name,
    row?.product_name,
    row?.productName,
    row?.basic_info?.product_name,
    row?.model,
    row?.model_number,
    row?.basic_info?.model,
    row?.basic_info?.model_number,
  ]) {
    const slug = toSmartphoneSeoSlug(toSlug(value));
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    orderedSlugs.push(slug);
  }
  return orderedSlugs;
};

const ensureSmartphoneSeoDetailPath = (path = "") => {
  if (!path.startsWith("/smartphones/")) return path;
  const tail = path.slice("/smartphones/".length);
  if (!tail || tail.includes("/")) return path;
  if (SMARTPHONE_LIST_SLUGS.has(tail.toLowerCase())) return path;
  const seoSlug = toSmartphoneSeoSlug(tail);
  return seoSlug ? `/smartphones/${seoSlug}` : path;
};

const canonicalizeSmartphonePath = (path = "") => {
  const listingRoute = parseSmartphoneListingPath(path);
  if (listingRoute) return listingRoute.canonicalPath;
  return ensureSmartphoneSeoDetailPath(path);
};

const toSeoTextWithoutCommas = (value = "") =>
  String(value || "").replace(/,/g, "");

const toReadableTitleFromSlug = (slug = "") => {
  const normalized = (() => {
    try {
      return decodeURIComponent(String(slug || ""));
    } catch {
      return String(slug || "");
    }
  })()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) return "";
  return normalized
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const extractDetailSlugName = (path, prefix, normalizeTail) => {
  if (!path.startsWith(prefix)) return "";
  const tail = path.slice(prefix.length);
  if (!tail || tail.includes("/")) return "";
  const normalizedTail =
    typeof normalizeTail === "function" ? normalizeTail(tail) : tail;
  if (!normalizedTail) return "";
  return toReadableTitleFromSlug(normalizedTail);
};

const getTvListingRouteMeta = (path = "") => {
  if (path === "/tvs/latest") return { type: "latest" };
  const match = String(path || "").match(/^\/tvs\/features\/([^/]+)$/i);
  if (!match) return null;
  const feature = TV_FEATURE_ROUTE_META[String(match[1] || "").toLowerCase()];
  return feature ? { type: "feature", feature } : null;
};

const getTvDetailName = (canonicalPath = "") =>
  getTvListingRouteMeta(canonicalPath)
    ? ""
    : extractDetailSlugName(canonicalPath, "/tvs/");

const extractCompareRouteNames = (path) => {
  const legacyMatch = String(path || "").match(
    /^\/compare\/([^/]+)-vs-([^/]+)$/i,
  );
  if (legacyMatch) {
    return [
      toReadableTitleFromSlug(legacyMatch[1]),
      toReadableTitleFromSlug(legacyMatch[2]),
    ].filter(Boolean);
  }

  const modernMatch = String(path || "").match(
    /^\/compare\/([^/]+?)-comparison$/i,
  );
  if (!modernMatch) return [];

  return String(modernMatch[1] || "")
    .split("-and-")
    .map((part) => toReadableTitleFromSlug(part))
    .filter(Boolean);
};

const joinCompareNamesWithoutCommas = (names = []) => {
  const clean = (Array.isArray(names) ? names : [])
    .map((name) => String(name || "").trim())
    .filter(Boolean);
  if (!clean.length) return "";
  if (clean.length === 1) return clean[0];
  return clean.join(" and ");
};
const limitSeoText = (value, maxLength) => {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(1, maxLength - 3)).trim()}...`;
};

const getSeoFingerprint = (value = "") => {
  let hash = 2166136261;
  for (const character of String(value || "")) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36).slice(0, 5);
};

const compactCompareName = (name = "") => {
  const words = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length <= 3) return words.join(" ");
  return `${words.slice(0, 2).join(" ")} ${words[words.length - 1]}`;
};

const buildCompareSeoTitle = (names = []) => {
  const cleanNames = (Array.isArray(names) ? names : [])
    .map((name) => String(name || "").trim())
    .filter(Boolean);
  if (!cleanNames.length) return "Compare Smartphones, TVs and Devices | MobileX";

  const suffix = ": Specs & Price | MobileX";
  const compactNames = cleanNames.map(compactCompareName);
  const label = compactNames.join(" vs ");
  if (label.length <= 60 - suffix.length) return `${label}${suffix}`;

  const fingerprint = getSeoFingerprint(cleanNames.join("|"));
  const labelBudget = 60 - suffix.length - fingerprint.length - 3;
  const shortened = `${limitSeoText(label, labelBudget)} (${fingerprint})`;
  return `${shortened}${suffix}`;
};

const buildCompareSeoDescription = (names = []) => {
  const label = joinCompareNamesWithoutCommas(names) || "these devices";
  return limitSeoText(
    `Compare ${label} on price, specifications, features, and performance in India with current product details on MobileX.`,
    160,
  );
};

const toSlug = (value = "") =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

const extractCompareRouteSlugParts = (routePath = "") => {
  const match = String(routePath || "").match(/^\/compare\/(.+)-comparison$/i);
  if (!match) return [];
  return String(match[1] || "")
    .split("-and-")
    .map((part) => toSlug(part))
    .filter(Boolean)
    .slice(0, 3);
};

const buildCompareRoutePathFromSlugParts = (parts = []) => {
  const cleanParts = (Array.isArray(parts) ? parts : [])
    .map((part) => toSlug(part))
    .filter(Boolean)
    .slice(0, 3);
  if (cleanParts.length < 2) return "";
  return `/compare/${cleanParts.join("-and-")}-comparison`;
};

const buildCompareResolveEndpoint = (slug = "") =>
  `${API_BASE_URL}/public/compare-pages/resolve?slug=${encodeURIComponent(
    String(slug || "").trim(),
  )}`;

const createCompareRouteMetaFromPage = (page = {}, fallback = {}) => ({
  title: String(page?.title || fallback?.title || "").trim(),
  description: String(
    page?.meta_description ||
      page?.metaDescription ||
      fallback?.description ||
      "",
  ).trim(),
  updatedAt:
    page?.updated_at ||
    page?.updatedAt ||
    page?.last_compared_at ||
    page?.lastComparedAt ||
    fallback?.updatedAt ||
    null,
});

const addCompareRouteMeta = (routePath, meta = {}) => {
  const normalizedRoute = normalizePath(toCanonicalPath(routePath));
  if (
    !normalizedRoute ||
    normalizedRoute === "/compare" ||
    !normalizedRoute.startsWith("/compare/")
  ) {
    return "";
  }

  publishedCompareRouteMeta.set(normalizedRoute, {
    title: String(meta?.title || "").trim(),
    description: String(
      meta?.description || meta?.meta_description || "",
    ).trim(),
    updatedAt: meta?.updatedAt || meta?.updated_at || null,
    compareCount: Number(meta?.compareCount ?? meta?.compare_count) || 0,
  });

  return normalizedRoute;
};

const buildExpandedCompareRouteCandidates = (
  routes = [],
  routeMeta = new Map(),
) => {
  const pairRoutes = [];
  const productStats = new Map();

  const rememberProduct = (slug, index, score = 1) => {
    if (!slug) return;
    const existing = productStats.get(slug) || {
      slug,
      firstIndex: index,
      routeCount: 0,
      score: 0,
    };
    existing.firstIndex = Math.min(existing.firstIndex, index);
    existing.routeCount += 1;
    existing.score += Math.max(1, Number(score) || 1);
    productStats.set(slug, existing);
  };

  routes.forEach((routePath, index) => {
    const parts = extractCompareRouteSlugParts(routePath);
    if (parts.length !== 2) return;
    const meta = routeMeta.get(routePath) || {};
    const score = Number(meta.compareCount ?? meta.compare_count) || 1;
    pairRoutes.push({ routePath, parts, index, score });
    parts.forEach((part) => rememberProduct(part, index, score));
  });

  const candidates = new Map();
  const addCandidate = (parts, score = 1, priority = 1) => {
    const uniqueParts = [];
    const seen = new Set();
    for (const part of Array.isArray(parts) ? parts : []) {
      const slug = toSlug(part);
      if (!slug || seen.has(slug)) continue;
      seen.add(slug);
      uniqueParts.push(slug);
      if (uniqueParts.length === 3) break;
    }
    if (uniqueParts.length !== 3) return;

    const routePath = buildCompareRoutePathFromSlugParts(uniqueParts);
    if (!routePath || routeMeta.has(routePath)) return;
    const existing = candidates.get(routePath);
    const nextScore = Math.max(1, Number(score) || 1);
    const nextPriority = Math.max(1, Number(priority) || 1);
    if (
      !existing ||
      nextPriority > existing.priority ||
      (nextPriority === existing.priority && nextScore > existing.score)
    ) {
      candidates.set(routePath, {
        routePath,
        parts: uniqueParts,
        priority: nextPriority,
        score: nextScore,
      });
    }
  };

  for (let leftIndex = 0; leftIndex < pairRoutes.length; leftIndex += 1) {
    for (
      let rightIndex = leftIndex + 1;
      rightIndex < pairRoutes.length;
      rightIndex += 1
    ) {
      const left = pairRoutes[leftIndex];
      const right = pairRoutes[rightIndex];
      const union = [...new Set([...left.parts, ...right.parts])];
      if (union.length !== 3) continue;
      const orderedUnion = union.sort((a, b) => {
        const aStats = productStats.get(a);
        const bStats = productStats.get(b);
        return (aStats?.firstIndex ?? 9999) - (bStats?.firstIndex ?? 9999);
      });
      addCandidate(orderedUnion, left.score + right.score, 3);
    }
  }

  const topProducts = Array.from(productStats.values())
    .sort((left, right) => {
      const scoreDiff = right.score - left.score;
      if (scoreDiff !== 0) return scoreDiff;
      const countDiff = right.routeCount - left.routeCount;
      if (countDiff !== 0) return countDiff;
      return left.firstIndex - right.firstIndex;
    })
    .slice(0, MAX_COMPARE_EXPANSION_PRODUCTS);

  for (let a = 0; a < topProducts.length; a += 1) {
    for (let b = a + 1; b < topProducts.length; b += 1) {
      for (let c = b + 1; c < topProducts.length; c += 1) {
        const rankSpan = c - a;
        if (rankSpan > 8) break;
        const parts = [
          topProducts[a].slug,
          topProducts[b].slug,
          topProducts[c].slug,
        ];
        const combinedScore =
          topProducts[a].score + topProducts[b].score + topProducts[c].score;
        addCandidate(parts, 100000 - rankSpan * 1000 + combinedScore, 2);
      }
    }
  }

  const fallbackTopProducts = topProducts.slice(0, 18);
  for (let a = 0; a < fallbackTopProducts.length; a += 1) {
    for (let b = a + 1; b < fallbackTopProducts.length; b += 1) {
      for (let c = b + 1; c < fallbackTopProducts.length; c += 1) {
        const parts = [
          fallbackTopProducts[a].slug,
          fallbackTopProducts[b].slug,
          fallbackTopProducts[c].slug,
        ];
        const score =
          fallbackTopProducts[a].score +
          fallbackTopProducts[b].score +
          fallbackTopProducts[c].score;
        addCandidate(parts, score, 1);
      }
    }
  }

  return Array.from(candidates.values())
    .sort((left, right) => {
      const scoreDiff = right.score - left.score;
      if (scoreDiff !== 0) return scoreDiff;
      return right.priority - left.priority;
    })
    .slice(0, MAX_COMPARE_EXPANDED_CANDIDATES);
};

const resolveCompareRouteFromApi = async (
  routePath = "",
  fallbackMeta = {},
) => {
  const slug = getSingleSegmentRouteTail(routePath, "/compare");
  if (!slug) return "";

  const endpoint = buildCompareResolveEndpoint(slug);
  const body = await fetchApiBody(endpoint);
  const page = body?.page || null;
  const items = Array.isArray(page?.items) ? page.items : [];
  if (!page || items.length < 2 || items.length > 3) return "";

  const resolvedRoute = addCompareRouteMeta(
    page.route_path || routePath,
    createCompareRouteMetaFromPage(page, fallbackMeta),
  );
  return resolvedRoute;
};

const toCanonicalPath = (rawPath) => {
  const pathName = normalizePath(rawPath);
  const legacyCompareNames = extractCompareRouteNames(pathName);
  if (
    /^\/compare\/[^/]+-vs-[^/]+$/i.test(pathName) &&
    legacyCompareNames.length >= 2
  ) {
    const compareParts = legacyCompareNames
      .map((name) => toSlug(name))
      .filter(Boolean)
      .slice(0, 3);
    if (compareParts.length >= 2) {
      return `/compare/${compareParts.join("-and-")}-comparison`;
    }
  }
  if (pathName === "/career") return "/careers";
  if (pathName === "/blog" || pathName === "/blogs") return "/";
  if (pathName.startsWith("/blog/") || pathName.startsWith("/blogs/")) {
    return "/";
  }
  if (pathName === "/trending") return "/trending/smartphones";
  if (pathName === "/trending/smartphone") return "/trending/smartphones";
  if (pathName === "/trending/tv") return "/trending/tvs";
  if (pathName === "/products" || pathName === "/products/mobiles")
    return "/smartphones";
  if (pathName === "/devices") return "/smartphones";
  if (pathName === "/mobiles") return "/smartphones";
  const directSmartphoneListing = parseSmartphoneListingPath(pathName);
  if (directSmartphoneListing) {
    return directSmartphoneListing.canonicalPath;
  }
  if (pathName.startsWith("/products/mobiles")) {
    return canonicalizeSmartphonePath(
      pathName.replace("/products/mobiles", "/smartphones"),
    );
  }
  if (pathName.startsWith("/devices/mobiles")) {
    return canonicalizeSmartphonePath(
      pathName.replace("/devices/mobiles", "/smartphones"),
    );
  }
  if (pathName.startsWith("/products/smartphones")) {
    return canonicalizeSmartphonePath(
      pathName.replace("/products/smartphones", "/smartphones"),
    );
  }
  if (pathName.startsWith("/devices/smartphones")) {
    return canonicalizeSmartphonePath(
      pathName.replace("/devices/smartphones", "/smartphones"),
    );
  }
  if (pathName === "/appliances") return "/tvs";
  if (pathName.startsWith("/appliances/")) {
    return pathName.replace("/appliances/", "/tvs/");
  }
  if (pathName.startsWith("/products/tvs")) {
    return pathName.replace("/products/tvs", "/tvs");
  }
  if (pathName.startsWith("/products/appliances")) {
    return pathName.replace("/products/appliances", "/tvs");
  }
  if (pathName.startsWith("/devices/tvs")) {
    return pathName.replace("/devices/tvs", "/tvs");
  }
  if (pathName.startsWith("/devices/appliances")) {
    return pathName.replace("/devices/appliances", "/tvs");
  }
  if (pathName.startsWith("/products/networking")) {
    return pathName.replace("/products/networking", "/networking");
  }
  if (pathName.startsWith("/devices/networking")) {
    return pathName.replace("/devices/networking", "/networking");
  }
  return canonicalizeSmartphonePath(pathName);
};

const routesFromSitemap = () => {
  try {
    const sitemapPath = path.join(__dirname, "public", "sitemap.xml");
    const xml = fs.readFileSync(sitemapPath, "utf8");
    const locMatches = [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)];
    const parsed = locMatches
      .map((m) => m?.[1]?.trim())
      .filter(Boolean)
      .map((loc) => {
        if (loc.startsWith("/")) return normalizePath(loc);
        try {
          const parsedUrl = new URL(loc);
          return normalizePath(parsedUrl.pathname || "/");
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .filter((routePath) => {
        if (!routePath.startsWith("/smartphones/")) return true;
        return (
          routePath === "/smartphones/upcoming" ||
          routePath.startsWith("/smartphones/filter/") ||
          routePath.startsWith("/smartphones/brand/") ||
          routePath.startsWith("/smartphones/feature/")
        );
      })
      .map((routePath) => toCanonicalPath(routePath));

    return parsed;
  } catch (err) {
    console.warn(
      "[prerender] Failed to read sitemap routes, using static route list only.",
    );
    return [];
  }
};

const parseApiRows = (body, preferredKeys = []) => {
  if (Array.isArray(body)) return body;
  for (const key of preferredKeys) {
    if (Array.isArray(body?.[key])) return body[key];
    if (Array.isArray(body?.data?.[key])) return body.data[key];
  }
  if (Array.isArray(body?.data)) return body.data;
  if (Array.isArray(body?.results)) return body.results;
  if (Array.isArray(body?.items)) return body.items;
  if (Array.isArray(body?.payload)) return body.payload;
  if (Array.isArray(body?.rows)) return body.rows;
  if (Array.isArray(body?.data?.rows)) return body.data.rows;
  return [];
};

const getPreloadedRows = (payload, endpoint, preferredKeys = []) =>
  parseApiRows(payload?.byUrl?.[endpoint], preferredKeys);

const getSmartphoneDetailName = (canonicalPath) => {
  const name = extractDetailSlugName(
    canonicalPath,
    "/smartphones/",
    stripSmartphoneSeoSuffix,
  );
  const tail = canonicalPath.startsWith("/smartphones/")
    ? canonicalPath.slice("/smartphones/".length)
    : "";
  if (SMARTPHONE_LIST_SLUGS.has(String(tail || "").toLowerCase())) return "";
  return name;
};

const buildItemListFromRows = (rows = [], options = {}) => {
  const {
    basePath = "",
    toDetailSlug = (slug) => slug,
    getName = (item) => item?.name || item?.model || item?.product_name,
    getImage = (item) =>
      (Array.isArray(item?.images) ? item.images.find(Boolean) : null) ||
      item?.image ||
      item?.photo ||
      item?.thumbnail ||
      null,
  } = options;

  return rows
    .slice(0, 20)
    .map((row) => {
      const name = String(getName(row) || "").trim();
      if (!name) return null;
      const baseSlug = toSlug(name);
      if (!baseSlug) return null;
      const detailSlug = toDetailSlug(baseSlug, row);
      if (!detailSlug) return null;
      const image = getImage(row) || undefined;
      return {
        name,
        url: `${basePath}/${detailSlug}`.replace(/\/+/g, "/"),
        image,
      };
    })
    .filter(Boolean);
};

const fetchApiRows = async (endpoint, preferredKeys = []) => {
  if (typeof fetch !== "function") return [];
  try {
    const response = await fetch(endpoint);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const body = await response.json();
    return parseApiRows(body, preferredKeys);
  } catch (error) {
    console.warn(
      `[prerender] Failed to fetch detail routes from ${endpoint}: ${error?.message || error}`,
    );
    return [];
  }
};

const apiBodyCache = new Map();

const fetchApiBody = async (endpoint) => {
  if (typeof fetch !== "function") return null;
  if (apiBodyCache.has(endpoint)) return apiBodyCache.get(endpoint);

  const request = (async () => {
    try {
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.warn(
        `[prerender] Failed to fetch preloaded payload from ${endpoint}: ${error?.message || error}`,
      );
      return null;
    }
  })();

  apiBodyCache.set(endpoint, request);
  return request;
};

const doesApiEndpointExist = async (endpoint) => {
  if (typeof fetch !== "function") return false;
  try {
    const response = await fetch(endpoint);
    return response.ok;
  } catch {
    return false;
  }
};

const shouldStripPreloadKey = (key = "") =>
  PRELOAD_STRIP_KEY_PATTERNS.some((pattern) => pattern.test(String(key)));

const sanitizePreloadValue = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizePreloadValue(item));
  }
  if (!value || typeof value !== "object") return value;

  const next = {};
  for (const [key, child] of Object.entries(value)) {
    if (shouldStripPreloadKey(key)) continue;
    const sanitizedChild = sanitizePreloadValue(child);
    if (
      (key === "detail_path" || key === "detailPath") &&
      typeof sanitizedChild === "string"
    ) {
      const rawRoute = sanitizedChild.trim();
      next[key] = rawRoute
        ? toCanonicalPath(normalizePath(rawRoute))
        : rawRoute;
      continue;
    }
    next[key] = sanitizedChild;
  }
  return next;
};

const fetchPreloadedApiPayload = async () => {
  const byUrl = {};
  for (const endpoint of PRELOAD_API_ENDPOINTS) {
    const body = await fetchApiBody(endpoint);
    if (body != null) byUrl[endpoint] = sanitizePreloadValue(body);
  }
  if (Object.keys(byUrl).length === 0) return null;
  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    apiOrigin: API_ORIGIN,
    byUrl,
  };
};

const fetchPayloadForEndpoints = async (endpoints = []) => {
  const uniqueEndpoints = [...new Set(endpoints.filter(Boolean))];
  if (!uniqueEndpoints.length) return null;

  const byUrl = {};
  await Promise.all(
    uniqueEndpoints.map(async (endpoint) => {
      const body = await fetchApiBody(endpoint);
      if (body != null) {
        byUrl[endpoint] = sanitizePreloadValue(body);
      }
    }),
  );

  if (!Object.keys(byUrl).length) return null;

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    apiOrigin: API_ORIGIN,
    byUrl,
  };
};

const toPositiveInteger = (value) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const resolveProductId = (row) => {
  if (!row || typeof row !== "object") return null;
  return (
    toPositiveInteger(row.product_id) ||
    toPositiveInteger(row.productId) ||
    toPositiveInteger(row.id) ||
    toPositiveInteger(row?.basic_info?.id)
  );
};

const buildDetailWidgetContextMap = (preloadedApiPayload) => {
  const map = new Map();
  const smartphoneRows = getPreloadedRows(
    preloadedApiPayload,
    `${API_BASE_URL}/smartphones`,
    ["smartphones"],
  );

  for (const row of smartphoneRows) {
    const productId = resolveProductId(row);
    const slugs = getSmartphoneRouteSlugs(row);
    if (!productId || slugs.length === 0) continue;
    for (const slug of slugs) {
      map.set(`/smartphones/${slug}`, {
        productId,
        entityType: "smartphones",
      });
    }
  }

  return map;
};

const getSingleSegmentRouteTail = (canonicalPath = "", basePath = "") => {
  if (!canonicalPath.startsWith(`${basePath}/`)) return "";
  const tail = canonicalPath.slice(basePath.length + 1);
  if (!tail || tail.includes("/")) return "";
  return tail;
};

const getFirstMostComparedSmartphoneId = (preloadedApiPayload) => {
  const rows = getPreloadedRows(
    preloadedApiPayload,
    `${API_BASE_URL}/public/trending/most-compared`,
    ["mostCompared"],
  );

  for (const row of rows) {
    const leftType = String(row?.product_type || "")
      .trim()
      .toLowerCase();
    const rightType = String(row?.compared_product_type || "")
      .trim()
      .toLowerCase();
    const leftId = resolveProductId(row);
    const rightId = toPositiveInteger(
      row?.compared_product_id ?? row?.right_product_id,
    );

    if (leftId && leftType.includes("smartphone")) return leftId;
    if (rightId && rightType.includes("smartphone")) return rightId;
  }

  return null;
};

const getPopularComparisonsPreloadProductIds = (preloadedApiPayload) => {
  const rows = getPreloadedRows(
    preloadedApiPayload,
    `${API_BASE_URL}/public/trending/most-compared`,
    ["mostCompared"],
  );
  const ids = new Set();

  rows.slice(0, POPULAR_COMPARISON_PRELOAD_ROWS).forEach((row) => {
    const leftType = String(row?.product_type || "")
      .trim()
      .toLowerCase();
    const rightType = String(row?.compared_product_type || "")
      .trim()
      .toLowerCase();
    const leftId = resolveProductId(row);
    const rightId = toPositiveInteger(
      row?.compared_product_id ?? row?.right_product_id,
    );

    if (leftId && !leftType.includes("smartphone")) {
      ids.add(leftId);
    }

    if (rightId && !rightType.includes("smartphone")) {
      ids.add(rightId);
    }
  });

  return Array.from(ids);
};

const mergePreloadedPayloads = (...payloads) => {
  const validPayloads = payloads.filter(
    (payload) =>
      payload &&
      payload.byUrl &&
      typeof payload.byUrl === "object" &&
      Object.keys(payload.byUrl).length > 0,
  );

  if (!validPayloads.length) return null;

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    apiOrigin: API_ORIGIN,
    byUrl: Object.assign({}, ...validPayloads.map((payload) => payload.byUrl)),
  };
};

const fetchRouteSpecificPreloadedPayload = async (
  routePath,
  detailWidgetContextMap,
  sharedPreloadedApiPayload,
) => {
  const canonicalPath = toCanonicalPath(normalizePath(routePath || "/"));
  const compareSlug = getSingleSegmentRouteTail(canonicalPath, "/compare");
  if (compareSlug) {
    return fetchPayloadForEndpoints([buildCompareResolveEndpoint(compareSlug)]);
  }

  const smartphoneContext = detailWidgetContextMap.get(canonicalPath);
  if (smartphoneContext?.entityType === "smartphones") {
    const encodedId = encodeURIComponent(smartphoneContext.productId);
    const encodedEntityType = encodeURIComponent(smartphoneContext.entityType);
    return fetchPayloadForEndpoints([
      `${API_BASE_URL}/smartphones`,
      `${API_BASE_URL}/public/product/${encodedId}`,
      `${API_BASE_URL}/public/product/${encodedId}/discovery?entity_type=${encodedEntityType}`,
      `${API_BASE_URL}/public/product/${encodedId}/competitors?entity_type=${encodedEntityType}`,
      `${API_BASE_URL}/public/blogs?limit=3&productId=${encodedId}`,
    ]);
  }

  const tvListingRoute = getTvListingRouteMeta(canonicalPath);
  if (tvListingRoute?.type === "latest") {
    return fetchPayloadForEndpoints([`${API_BASE_URL}/public/new/tvs`]);
  }
  if (tvListingRoute?.type === "feature") {
    return fetchPayloadForEndpoints([`${API_BASE_URL}/tvs`]);
  }

  if (getSingleSegmentRouteTail(canonicalPath, "/tvs")) {
    return fetchPayloadForEndpoints([`${API_BASE_URL}/tvs`]);
  }

  const networkingSlug = getSingleSegmentRouteTail(
    canonicalPath,
    "/networking",
  );
  if (networkingSlug) {
    const endpoints = [`${API_BASE_URL}/networking`];
    const networkingRows = getPreloadedRows(
      sharedPreloadedApiPayload,
      `${API_BASE_URL}/networking`,
      ["networking"],
    );
    const matchedRow = networkingRows.find((row) => {
      const label =
        row?.product_name ||
        row?.name ||
        row?.model_number ||
        row?.model ||
        row?.basic_info?.product_name ||
        row?.basic_info?.title ||
        row?.basic_info?.model_number ||
        row?.basic_info?.model ||
        "";
      return toSlug(label) === networkingSlug;
    });
    const productId = resolveProductId(matchedRow);

    if (productId) {
      endpoints.push(
        `${API_BASE_URL}/public/products/${encodeURIComponent(
          productId,
        )}/ratings`,
      );
    }

    return fetchPayloadForEndpoints(endpoints);
  }

  if (canonicalPath.startsWith("/news/")) {
    const newsSlug = getNewsSlugFromPath(canonicalPath);
    if (!newsSlug) return null;

    return fetchPayloadForEndpoints([
      buildNewsStoryEndpoint(newsSlug),
      `${API_BASE_URL}/public/blogs?limit=18`,
    ]);
  }

  if (canonicalPath === "/popular-comparisons") {
    const endpoints = [];
    const smartphoneId = getFirstMostComparedSmartphoneId(
      sharedPreloadedApiPayload,
    );
    if (smartphoneId) {
      endpoints.push(
        `${API_BASE_URL}/public/product/${encodeURIComponent(
          smartphoneId,
        )}/discovery?entity_type=smartphones`,
      );
    }

    getPopularComparisonsPreloadProductIds(sharedPreloadedApiPayload).forEach(
      (productId) => {
        endpoints.push(
          `${API_BASE_URL}/public/product/${encodeURIComponent(productId)}`,
        );
      },
    );

    return fetchPayloadForEndpoints(endpoints);
  }

  return null;
};

const fetchDetailRoutesFromApi = async () => {
  const sources = [
    {
      endpoint: `${API_BASE_URL}/smartphones`,
      preferredKeys: ["smartphones"],
      basePath: "/smartphones",
      getDetailSlugs: (item) => {
        const slug = getSmartphoneCanonicalRouteSlug(item);
        return slug ? [slug] : [];
      },
      getName: (item) => item?.name || item?.model || item?.product_name,
      toDetailSlug: (slug) => toSmartphoneSeoSlug(slug),
    },
    {
      endpoint: `${API_BASE_URL}/tvs`,
      preferredKeys: ["tvs"],
      basePath: "/tvs",
      getName: (item) =>
        item?.product_name ||
        item?.name ||
        item?.model_number ||
        item?.model ||
        item?.basic_info?.product_name ||
        item?.basic_info?.title ||
        item?.basic_info?.model_number ||
        item?.basic_info?.model,
    },
    {
      endpoint: `${API_BASE_URL}/networking`,
      preferredKeys: ["networking"],
      basePath: "/networking",
      getName: (item) =>
        item?.product_name ||
        item?.name ||
        item?.model_number ||
        item?.model ||
        item?.basic_info?.product_name ||
        item?.basic_info?.title ||
        item?.basic_info?.model_number ||
        item?.basic_info?.model,
    },
  ];

  const routes = [];

  for (const source of sources) {
    const rows = await fetchApiRows(source.endpoint, source.preferredKeys);
    let addedCount = 0;

    for (const row of rows) {
      const detailSlugs = source.getDetailSlugs
        ? source.getDetailSlugs(row)
        : (() => {
            const baseSlug = toSlug(source.getName(row));
            if (!baseSlug) return [];
            const detailSlug = source.toDetailSlug
              ? source.toDetailSlug(baseSlug, row)
              : baseSlug;
            return detailSlug ? [detailSlug] : [];
          })();

      for (const detailSlug of detailSlugs) {
        routes.push(`${source.basePath}/${detailSlug}`);
        addedCount += 1;
        if (addedCount >= MAX_DETAIL_ROUTES_PER_CATEGORY) break;
      }
      if (addedCount >= MAX_DETAIL_ROUTES_PER_CATEGORY) break;
    }
  }

  // Only prerender canonical detail routes. Alias routes should resolve through
  // the SPA router when requested, but should not exist as standalone static
  // HTML files because that creates duplicate crawlable URLs.
  return [...new Set(routes)];
};

const fetchCompareRoutesFromApi = async (existingRoutes = []) => {
  publishedCompareRouteMeta = new Map();
  const body = await fetchApiBody(
    `${API_BASE_URL}/public/compare-pages/routes`,
  );
  const rows = Array.isArray(body?.routes) ? body.routes : [];
  const routes = [];

  // Published comparison URLs are intentionally sticky. Popularity rankings
  // can change between builds, but a valid URL already exposed in the sitemap
  // must not disappear just because a different expansion candidate ranks
  // higher today. Re-resolve each prior URL and retain it when its products are
  // still available; invalid/self-comparison routes are omitted.
  const retainedRoutes = [
    ...KNOWN_DISCOVERED_COMPARE_ROUTES,
    ...existingRoutes,
  ];
  for (const existingRoute of retainedRoutes) {
    if (routes.length >= MAX_COMPARE_ROUTES) break;
    const routePath = normalizePath(existingRoute);
    if (
      !routePath ||
      routePath === "/compare" ||
      !routePath.startsWith("/compare/") ||
      routes.includes(routePath)
    ) {
      continue;
    }

    const resolvedRoute = await resolveCompareRouteFromApi(routePath);
    if (resolvedRoute && !routes.includes(resolvedRoute)) {
      routes.push(resolvedRoute);
    }
  }

  for (const row of rows) {
    if (routes.length >= MAX_COMPARE_ROUTES) break;
    const routePath = normalizePath(
      row?.route_path || (row?.slug ? `/compare/${row.slug}` : ""),
    );
    if (
      !routePath ||
      routePath === "/compare" ||
      !routePath.startsWith("/compare/")
    ) {
      continue;
    }

    if (routes.includes(routePath)) continue;

    const resolvedRoute = await resolveCompareRouteFromApi(routePath, {
      title: String(row?.title || "").trim(),
      description: String(
        row?.meta_description || row?.description || "",
      ).trim(),
      updatedAt: row?.updated_at || null,
      compareCount: row?.compare_count || 0,
    });
    if (resolvedRoute && !routes.includes(resolvedRoute)) {
      routes.push(resolvedRoute);
    }
  }

  const expandedCandidates = buildExpandedCompareRouteCandidates(
    routes,
    publishedCompareRouteMeta,
  );
  let expandedRouteCount = 0;
  for (const candidate of expandedCandidates) {
    if (routes.length >= MAX_COMPARE_ROUTES) break;
    if (expandedRouteCount >= MAX_COMPARE_EXPANDED_ROUTES) break;
    if (publishedCompareRouteMeta.has(candidate.routePath)) continue;
    const resolvedRoute = await resolveCompareRouteFromApi(
      candidate.routePath,
      {
        updatedAt: body?.generated_at || null,
      },
    );
    if (resolvedRoute) {
      routes.push(resolvedRoute);
      expandedRouteCount += 1;
    }
  }

  return [...new Set(routes)];
};

const getNewsSlugFromPath = (canonicalPath = "") => {
  const match = String(canonicalPath || "").match(/^\/news\/([^/]+)\/?$/i);
  if (!match) return "";

  try {
    return decodeURIComponent(match[1]).trim().toLowerCase();
  } catch {
    return String(match[1] || "")
      .trim()
      .toLowerCase();
  }
};

const buildNewsStoryEndpoint = (slug = "") =>
  `${API_BASE_URL}/public/blogs/${encodeURIComponent(String(slug || "").trim())}`;

const fetchNewsRoutesFromSitemap = async () => {
  const endpoint = `${API_BASE_URL}/sitemap.xml`;
  let response;

  try {
    response = await fetch(endpoint);
  } catch (error) {
    throw new Error(
      `[news-prerender] Unable to fetch ${endpoint}: ${error?.message || error}`,
    );
  }

  if (!response.ok) {
    throw new Error(
      `[news-prerender] Unable to fetch ${endpoint}: HTTP ${response.status}`,
    );
  }

  const xml = await response.text();
  const entries = [...xml.matchAll(/<url>\s*([\s\S]*?)\s*<\/url>/gi)]
    .map((match) => {
      const block = match?.[1] || "";
      const loc = block.match(/<loc>\s*([^<]+?)\s*<\/loc>/i)?.[1]?.trim();
      const lastmod = block
        .match(/<lastmod>\s*([^<]+?)\s*<\/lastmod>/i)?.[1]
        ?.trim();
      if (!loc) return null;

      let routePath;
      try {
        routePath = normalizePath(new URL(loc, SITE_ORIGIN).pathname || "");
      } catch {
        return null;
      }

      return getNewsSlugFromPath(routePath)
        ? { routePath, lastmod: lastmod || null }
        : null;
    })
    .filter(Boolean);

  if (!entries.length) {
    throw new Error(
      `[news-prerender] ${endpoint} did not contain any published article routes.`,
    );
  }

  return entries.slice(0, MAX_NEWS_ROUTES);
};

const fetchNewsRoutesFromApi = async () => {
  publishedNewsRouteMeta = new Map();
  const body = await fetchApiBody(`${API_BASE_URL}/public/blogs?limit=50`);
  if (!body) {
    throw new Error(
      "[news-prerender] The published news feed is unavailable; refusing to emit generic article shells.",
    );
  }

  const rows = parseApiRows(body, ["blogs"]);
  if (!rows.length) {
    throw new Error(
      "[news-prerender] The published news feed is empty; refusing to emit an empty news listing.",
    );
  }

  const sitemapEntries = await fetchNewsRoutesFromSitemap();
  const routes = [];

  for (const row of rows) {
    if (routes.length >= MAX_NEWS_ROUTES) break;
    const slug = String(row?.slug || "")
      .trim()
      .toLowerCase();
    if (!slug) continue;
    const routePath = normalizePath(`/news/${slug}`);
    const publishedAt = row?.published_at || row?.updated_at || null;
    const updatedAt = resolveNewsDateModified(
      publishedAt,
      row?.updated_at || publishedAt,
    );
    publishedNewsRouteMeta.set(routePath, {
      title: String(row?.title || row?.meta_title || "").trim(),
      publishedAt,
      updatedAt,
    });
    routes.push(routePath);
  }

  for (const entry of sitemapEntries) {
    if (routes.length >= MAX_NEWS_ROUTES) break;
    if (!publishedNewsRouteMeta.has(entry.routePath)) {
      publishedNewsRouteMeta.set(entry.routePath, {
        title: "",
        publishedAt: null,
        updatedAt: entry.lastmod,
      });
    }
    routes.push(entry.routePath);
  }

  return [...new Set(routes)];
};

const fetchSmartphoneListingRoutesFromApi = async () => {
  const routes = Object.keys(SMARTPHONE_FEATURE_ROUTE_META).map((featureId) =>
    buildSmartphoneFeaturePath(featureId),
  );
  const seen = new Set(routes);
  const rows = await fetchApiRows(`${API_BASE_URL}/smartphones`, [
    "smartphones",
  ]);
  let addedBrandCount = 0;

  for (const row of rows) {
    const brandName =
      row?.brand ||
      row?.brand_name ||
      row?.basic_info?.brand ||
      row?.basic_info?.brand_name ||
      "";
    const routePath = buildSmartphoneBrandPath(brandName);
    if (!brandName || routePath === "/smartphones" || seen.has(routePath)) {
      continue;
    }

    seen.add(routePath);
    routes.push(routePath);
    addedBrandCount += 1;

    if (addedBrandCount >= 160) break;
  }

  return routes;
};

const getLaptopBrandName = (row = {}) =>
  row?.brand ||
  row?.brand_name ||
  row?.basic_info?.brand ||
  row?.basic_info?.brand_name ||
  "";

const getLaptopListingPrice = (row = {}) => {
  const prices = [];
  const visit = (value, key = "") => {
    if (value == null) return;
    if (Array.isArray(value)) {
      value.forEach((item) => visit(item, key));
      return;
    }
    if (typeof value === "object") {
      Object.entries(value).forEach(([childKey, childValue]) =>
        visit(childValue, childKey),
      );
      return;
    }
    if (!/price/i.test(key)) return;
    const numeric = Number(String(value).replace(/[^\d.]/g, ""));
    if (Number.isFinite(numeric) && numeric > 0) prices.push(numeric);
  };
  visit(row);
  return prices.length ? Math.min(...prices) : 0;
};

const matchesLaptopFeatureRoute = (row, featureSlug) => {
  const text = JSON.stringify(row || {}).toLowerCase();
  switch (featureSlug) {
    case "gaming":
      return /gaming|rtx|gtx|geforce|radeon\s*rx/.test(text);
    case "high-ram":
      return /(?:16|24|32|48|64)\s*gb.{0,30}(?:ram|ddr)|(?:ram|ddr).{0,30}(?:16|24|32|48|64)\s*gb/.test(
        text,
      );
    case "high-storage":
      return /(?:512\s*gb|[1-9]\s*tb).{0,30}(?:ssd|storage)|(?:ssd|storage).{0,30}(?:512\s*gb|[1-9]\s*tb)/.test(
        text,
      );
    case "lightweight":
      return /(?:weight|net_weight).{0,20}(?:0\.\d+|1\.[0-5])\s*kg/.test(text);
    case "long-battery":
      return /(?:60|6[1-9]|[7-9]\d|1\d{2})\s*wh/.test(text);
    case "high-refresh-rate":
      return /(?:120|144|165|240)\s*hz/.test(text);
    case "oled-display":
      return /\boled\b/.test(text);
    case "touchscreen":
      return /touch\s*screen|touchscreen/.test(text);
    case "intel":
      return /\bintel\b/.test(text);
    case "amd":
      return /\bamd\b|\bryzen\b/.test(text);
    default:
      return false;
  }
};

const matchesLaptopListingRoute = (row, routeMeta = {}) => {
  const brandSlug = toSlug(getLaptopBrandName(row));
  if (routeMeta.brandSlug && brandSlug !== routeMeta.brandSlug) return false;
  if (
    routeMeta.featureSlugs?.some(
      (featureSlug) => !matchesLaptopFeatureRoute(row, featureSlug),
    )
  ) {
    return false;
  }
  if (routeMeta.budget) {
    const price = getLaptopListingPrice(row);
    if (!price || price > routeMeta.budget) return false;
  }
  return true;
};

const fetchLaptopListingRoutesFromApi = async () => {
  const rows = await fetchApiRows(`${API_BASE_URL}/laptops`, ["laptops"]);
  const routes = new Set(["/laptops/latest", ...LAPTOP_BUDGET_ROUTE_PATHS]);
  const featureIds = Object.keys(LAPTOP_FEATURE_ROUTE_META).filter(
    (featureId) =>
      rows.some((row) => matchesLaptopFeatureRoute(row, featureId)),
  );
  const brands = new Map();

  rows.forEach((row) => {
    const brandName = getLaptopBrandName(row);
    const brandSlug = toSlug(brandName);
    if (!brandSlug) return;
    if (!brands.has(brandSlug)) brands.set(brandSlug, []);
    brands.get(brandSlug).push(row);
  });

  featureIds.forEach((featureId) => {
    routes.add(buildLaptopListingPath({ feature: featureId }));
    LAPTOP_DISCOVERY_PRICE_BUCKETS.forEach((budget) => {
      if (
        rows.some(
          (row) =>
            matchesLaptopFeatureRoute(row, featureId) &&
            getLaptopListingPrice(row) > 0 &&
            getLaptopListingPrice(row) <= budget,
        )
      ) {
        routes.add(buildLaptopListingPath({ feature: featureId, budget }));
      }
    });
  });

  featureIds.forEach((firstFeature, index) => {
    featureIds.slice(index + 1).forEach((secondFeature) => {
      if (
        rows.some(
          (row) =>
            matchesLaptopFeatureRoute(row, firstFeature) &&
            matchesLaptopFeatureRoute(row, secondFeature),
        )
      ) {
        routes.add(
          buildLaptopListingPath({
            features: [firstFeature, secondFeature],
          }),
        );
      }
    });
  });

  brands.forEach((brandRows, brandSlug) => {
    routes.add(buildLaptopListingPath({ brand: brandSlug }));
    LAPTOP_DISCOVERY_PRICE_BUCKETS.forEach((budget) => {
      if (
        brandRows.some((row) => {
          const price = getLaptopListingPrice(row);
          return price > 0 && price <= budget;
        })
      ) {
        routes.add(buildLaptopListingPath({ brand: brandSlug, budget }));
      }
    });
    featureIds.forEach((featureId) => {
      if (brandRows.some((row) => matchesLaptopFeatureRoute(row, featureId))) {
        routes.add(
          buildLaptopListingPath({ brand: brandSlug, feature: featureId }),
        );
      }
    });
  });

  return [...routes];
};

const matchesTvFeatureRoute = (row, featureSlug) => {
  const text = JSON.stringify(row || {}).toLowerCase();
  switch (featureSlug) {
    case "large-screen":
      return /(?:55|5[6-9]|[6-9]\d|1\d{2})\s*(?:inch|inches|")/.test(text);
    case "ultra-hd-4k":
      return /4k|uhd|2160/.test(text);
    case "high-refresh-rate":
      return /(?:120|144|165|240)\s*hz/.test(text);
    case "oled-qled":
      return /oled|qled|mini\s*led|qd-?oled/.test(text);
    case "smart-tv":
      return /smart\s*tv|google\s*tv|android\s*tv|tizen|webos|fire\s*tv/.test(
        text,
      );
    case "hdr":
      return /\bhdr|dolby\s*vision|hlg/.test(text);
    case "dolby-audio":
      return /dolby/.test(text);
    case "gaming":
      return /gaming|\bvrr\b|\ballm\b|freesync|g-?sync|hdmi\s*2(?:\.|\s*)1/.test(
        text,
      );
    case "wifi":
      return /wi-?fi|802\.11/.test(text);
    case "voice-assistant":
      return /alexa|google\s*assistant|voice\s*(assistant|control)/.test(text);
    case "bluetooth":
      return /\bbluetooth\b|\bbt\s*\d/.test(text);
    case "hdmi-2-1":
      return /hdmi\s*2(?:\.|\s*)1/.test(text);
    case "earc":
      return /\bearc\b|enhanced\s+audio\s+return/.test(text);
    case "dolby-vision":
      return /dolby\s*vision/.test(text);
    case "ai-features":
      return /\bai\b|artificial\s+intelligence|ai[-\s]?(picture|sound|upscal|processor|enhance)/.test(
        text,
      );
    case "av-input":
      return /\bav\s*(input|in)\b|composite|rca/.test(text);
    case "usb":
      return /\busb\b/.test(text);
    case "wifi-6":
      return /wi-?fi\s*6|802\.11ax/.test(text);
    case "wifi-7":
      return /wi-?fi\s*7|802\.11be/.test(text);
    case "dolby-atmos":
      return /dolby\s*atmos/.test(text);
    case "hdr10-plus":
      return /hdr\s*10\s*\+|hdr10plus/.test(text);
    case "vrr":
      return /\bvrr\b|variable\s+refresh\s+rate/.test(text);
    case "allm":
      return /\ballm\b|auto(?:matic)?\s+low\s+latency/.test(text);
    case "memc":
      return /\bmemc\b|motion\s+estimation/.test(text);
    case "filmmaker-mode":
      return /filmmaker\s+mode/.test(text);
    case "screen-mirroring":
      return /screen\s+mirror|miracast|screen\s+cast|cast\s+screen/.test(text);
    case "airplay":
      return /airplay/.test(text);
    case "chromecast":
      return /chromecast|google\s+cast/.test(text);
    case "google-tv":
      return /google\s+tv/.test(text);
    case "ethernet":
      return /\bethernet\b|\blan\b|rj-?45/.test(text);
    case "optical-audio":
      return /optical|s\/?pdif|toslink/.test(text);
    case "headphone-jack":
      return /headphone|3\.5\s*mm|audio\s+jack/.test(text);
    case "rf-input":
      return /\brf\s*(input|in)\b|antenna\s*(input|in)/.test(text);
    default:
      return false;
  }
};

const fetchTvListingRoutesFromApi = async () => {
  const rows = await fetchApiRows(`${API_BASE_URL}/tvs`, ["tvs"]);
  return [...TV_FEATURE_ROUTE_PATHS].filter((routePath) => {
    const featureSlug = routePath.slice("/tvs/features/".length);
    return rows.some((row) => matchesTvFeatureRoute(row, featureSlug));
  });
};

const filterValidPrerenderRoutes = async (routes = []) => {
  const uniqueRoutes = [
    ...new Set(
      routes
        .map((route) => toCanonicalPath(normalizePath(route)))
        .filter((route) => route && !isRemovedLaptopRoute(route)),
    ),
  ];
  const filteredRoutes = await Promise.all(
    uniqueRoutes.map(async (routePath) => {
      if (routePath.startsWith("/compare/")) {
        return publishedCompareRouteMeta.has(routePath) ? routePath : null;
      }

      return routePath;
    }),
  );

  return filteredRoutes.filter(Boolean);
};

const getPrerenderRoutes = async () => {
  const sitemapRoutes = routesFromSitemap();
  const detailRoutes = await fetchDetailRoutesFromApi();
  const compareRoutes = await fetchCompareRoutesFromApi(sitemapRoutes);
  const newsRoutes = await fetchNewsRoutesFromApi();
  const smartphoneListingRoutes = await fetchSmartphoneListingRoutesFromApi();
  const tvListingRoutes = await fetchTvListingRoutesFromApi();
  return filterValidPrerenderRoutes([
    ...new Set([
      "/",
      ...STATIC_PRERENDER_ROUTES,
      ...sitemapRoutes,
      ...detailRoutes,
      ...compareRoutes,
      ...newsRoutes,
      ...smartphoneListingRoutes,
      ...tvListingRoutes,
    ]),
  ]);
};

const NOINDEX_SITEMAP_PATHS = new Set([
  "/login",
  "/signup",
  "/account",
  "/wishlist",
]);

const shouldIncludeInSitemap = (routePath = "/") => {
  const normalized = normalizePath(routePath);
  if (!normalized) return false;
  return !NOINDEX_SITEMAP_PATHS.has(normalized);
};

const escapeSitemapXml = (value = "") =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const buildSitemapXml = (routes = []) => {
  const today = new Date().toISOString().slice(0, 10);
  const canonicalRoutes = [
    ...new Set(
      routes
        .map((routePath) => toCanonicalPath(routePath))
        .map((routePath) => normalizePath(routePath))
        .filter((routePath) => shouldIncludeInSitemap(routePath)),
    ),
  ];

  canonicalRoutes.sort((a, b) => {
    if (a === "/") return -1;
    if (b === "/") return 1;
    return a.localeCompare(b);
  });

  const urls = canonicalRoutes
    .map((routePath) => {
      const loc = toCanonicalPageUrl(routePath, SITE_ORIGIN);
      const lastmod = getRouteSitemapLastmod(routePath, today);
      const isDetailPage =
        routePath.startsWith("/smartphones/") ||
        routePath.startsWith("/laptops/") ||
        routePath.startsWith("/tvs/") ||
        routePath.startsWith("/networking/") ||
        routePath.startsWith("/news/");
      const priority = routePath === "/" ? "1.0" : isDetailPage ? "0.8" : "0.7";
      return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
};

const buildNewsSitemapXml = () => {
  const now = Date.now();
  const twoDaysMs = 2 * 24 * 60 * 60 * 1000;
  const entries = [...publishedNewsRouteMeta.entries()]
    .map(([routePath, meta]) => {
      const publishedTime = new Date(
        meta?.publishedAt || meta?.updatedAt || "",
      );
      if (Number.isNaN(publishedTime.getTime())) return null;
      if (now - publishedTime.getTime() > twoDaysMs) return null;

      const title = String(meta?.title || "").trim();
      if (!title) return null;

      return {
        loc: toCanonicalPageUrl(routePath, SITE_ORIGIN),
        title,
        publishedAt: publishedTime.toISOString(),
      };
    })
    .filter(Boolean)
    .slice(0, 1000);

  const urls = entries
    .map(
      (entry) =>
        `  <url>\n    <loc>${escapeSitemapXml(entry.loc)}</loc>\n    <news:news>\n      <news:publication>\n        <news:name>MobilesX</news:name>\n        <news:language>en</news:language>\n      </news:publication>\n      <news:publication_date>${escapeSitemapXml(entry.publishedAt)}</news:publication_date>\n      <news:title>${escapeSitemapXml(entry.title)}</news:title>\n    </news:news>\n  </url>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n${urls}\n</urlset>\n`;
};

const writeSitemapFile = (outputPath, routes = []) => {
  const xml = buildSitemapXml(routes);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, xml, "utf8");
  return outputPath;
};

const syncPublicSitemap = (routes = []) =>
  writeSitemapFile(path.join(__dirname, "public", "sitemap.xml"), routes);

const writeNewsSitemapFile = (outputPath) => {
  const xml = buildNewsSitemapXml();
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, xml, "utf8");
  return outputPath;
};

const syncPublicNewsSitemap = () =>
  writeNewsSitemapFile(path.join(__dirname, "public", "news-sitemap.xml"));

const createSitemapPlugin = (routes = []) => ({
  name: "hook-generate-sitemap",
  apply: "build",
  closeBundle() {
    const outputDir = path.join(__dirname, "dist");
    const outputPath = path.join(outputDir, "sitemap.xml");
    writeSitemapFile(outputPath, routes);
    console.log(`[sitemap] Generated ${outputPath}`);
  },
});

const createNewsSitemapPlugin = () => ({
  name: "hook-generate-news-sitemap",
  apply: "build",
  closeBundle() {
    const outputDir = path.join(__dirname, "dist");
    const outputPath = path.join(outputDir, "news-sitemap.xml");
    writeNewsSitemapFile(outputPath);
    console.log(`[news-sitemap] Generated ${outputPath}`);
  },
});

const createStaticRouteHtmlPlugin = ({
  routes = [],
  getPreloadedPayloadForRoute,
  processHtml,
}) => ({
  name: "hook-generate-route-html",
  apply: "build",
  async closeBundle() {
    const outputDir = path.join(__dirname, "dist");
    const rootHtmlPath = path.join(outputDir, "index.html");

    if (!fs.existsSync(rootHtmlPath)) {
      console.warn(
        `[route-html] Skipped route HTML generation because ${rootHtmlPath} was not found.`,
      );
      return;
    }

    const baseHtml = fs.readFileSync(rootHtmlPath, "utf8");
    const uniqueRoutes = [
      ...new Set(
        routes.map((routePath) => normalizePath(routePath)).filter(Boolean),
      ),
    ];
    let generatedCount = 0;

    for (const routePath of uniqueRoutes) {
      const payload = await getPreloadedPayloadForRoute(routePath);
      const html = processHtml(baseHtml, routePath, payload);

      if (routePath === "/") {
        fs.writeFileSync(rootHtmlPath, html, "utf8");
        generatedCount += 1;
        continue;
      }

      const outputPath = path.join(
        outputDir,
        routePath.replace(/^\/+/, ""),
        "index.html",
      );
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      fs.writeFileSync(outputPath, html, "utf8");
      generatedCount += 1;
    }

    console.log(`[route-html] Generated ${generatedCount} route HTML files.`);
  },
});

const resolveSeo = (routePath) => {
  const canonicalPath = toCanonicalPath(routePath);
  const smartphoneDetailName = (() => {
    const name = extractDetailSlugName(
      canonicalPath,
      "/smartphones/",
      stripSmartphoneSeoSuffix,
    );
    const tail = canonicalPath.startsWith("/smartphones/")
      ? canonicalPath.slice("/smartphones/".length)
      : "";
    if (SMARTPHONE_LIST_SLUGS.has(tail.toLowerCase())) return "";
    return name;
  })();
  const laptopListingRoute = parseLaptopListingPath(canonicalPath);
  const laptopListingSeo = buildLaptopListingSeoMeta(laptopListingRoute || {}, {
    monthYear: CURRENT_MONTH_LONG_YEAR,
    fullDate: CURRENT_FULL_DATE,
  });
  const laptopDetailName = laptopListingRoute
    ? ""
    : extractDetailSlugName(canonicalPath, "/laptops/");
  const tvListingRoute = getTvListingRouteMeta(canonicalPath);
  const tvDetailName = getTvDetailName(canonicalPath);
  const compareNames = extractCompareRouteNames(canonicalPath);
  const smartphoneFilterSlug = (() => {
    const match = canonicalPath.match(/^\/smartphones\/filter\/([^/]+)$/i);
    if (!match) return "";
    return String(match[1] || "").toLowerCase();
  })();
  const smartphoneFilterMeta =
    smartphoneFilterSlug && SMARTPHONE_FILTER_SEO[smartphoneFilterSlug]
      ? SMARTPHONE_FILTER_SEO[smartphoneFilterSlug]
      : null;
  const smartphoneFilterSeoLabel = smartphoneFilterMeta
    ? toSeoTextWithoutCommas(smartphoneFilterMeta.label)
    : "";
  const smartphoneListingRoute = parseSmartphoneListingPath(canonicalPath);
  const smartphoneBrandLabel = smartphoneListingRoute?.brandSlug
    ? toReadableListingLabel(smartphoneListingRoute.brandSlug)
    : "";
  const smartphoneFeatureMeta = smartphoneListingRoute?.featureSlug
    ? getSmartphoneFeatureRouteMeta(smartphoneListingRoute.featureSlug)
    : null;
  const trendingCategory = canonicalPath.split("/")[2] || "smartphones";
  const trendingLabels = {
    smartphones: "Smartphones",
    tvs: "TVs",
    networking: "Networking Devices",
  };
  const trendingKeywordSets = {
    smartphones: `trending smartphones india, trending phone in india, most popular mobiles, latest smartphones in india ${CURRENT_YEAR}`,
    tvs: "trending tvs india, trending smart tvs, popular tvs in india, latest tv deals",
    networking:
      "trending networking devices india, popular wifi routers, latest networking products",
  };
  const rules = [
    {
      test: (p) => p === "/",
      title: "MobilesX: Compare Smartphones, TVs & Gadgets in India",
      description:
        "MobilesX is an AI-powered platform to discover and compare smartphones, TVs, laptops and gadgets in India with latest prices, detailed specs, reviews, comparisons, tech news and AI summaries.",
      keywords: `hook, best gadget comparison site, mobile price comparison india, compare laptops smartphones tvs, latest smartphones in india ${CURRENT_YEAR}, best smartphones in ${CURRENT_YEAR}, latest laptops in india ${CURRENT_YEAR}, latest smart tvs in india ${CURRENT_YEAR}, new launch and trending gadgets, top selling gadgets india, compare specs`,
    },
    {
      test: () => Boolean(smartphoneDetailName),
      title: `${smartphoneDetailName} Price in India, Specs & Features (${CURRENT_MONTH_SHORT_YEAR}) | MobilesX`,
      description: `Discover the ${smartphoneDetailName} price in India, detailed specs, features, variants, reviews, comparisons and AI summary insights. Find its key strengths and compare it with similar smartphones on MobilesX.`,
      keywords: `${smartphoneDetailName.toLowerCase()}, ${smartphoneDetailName.toLowerCase()} price in india, ${smartphoneDetailName.toLowerCase()} specifications, ${smartphoneDetailName.toLowerCase()} launch date, compare smartphones, mobile price comparison india`,
    },
    {
      test: () => Boolean(laptopDetailName),
      title: `${laptopDetailName} Price in India, Specs & Features (${CURRENT_MONTH_SHORT_YEAR}) | MobileX`,
      description: `Compare ${laptopDetailName} laptop price in India, full specifications, variants, and best store offers on MobileX.`,
      keywords: `${laptopDetailName.toLowerCase()}, ${laptopDetailName.toLowerCase()} price in india, ${laptopDetailName.toLowerCase()} specs, compare laptops india, laptop prices list ${CURRENT_YEAR}`,
    },
    {
      test: () => tvListingRoute?.type === "latest",
      title: `Latest TVs in India (${CURRENT_MONTH_LONG_YEAR}) | MobileX`,
      description:
        "Browse newly launched smart TVs in India with updated prices, display specifications, screen sizes, and store availability on MobileX.",
      keywords: `latest smart tvs in india ${CURRENT_YEAR}, new tv launches india, latest tv prices, compare smart tv specs`,
    },
    {
      test: () => tvListingRoute?.type === "feature",
      title: `Best ${tvListingRoute?.feature?.id === "ultra-hd-4k" ? "4K" : tvListingRoute?.feature?.id === "smart-tv" ? "Smart" : tvListingRoute?.feature?.seoName || ""} TVs in India (${CURRENT_MONTH_LONG_YEAR}) | MobileX`,
      description: `Browse the best ${tvListingRoute?.feature?.seoName || ""} TVs in India with updated prices, display specifications, screen sizes, smart features, and store availability on MobileX.`,
      keywords: `best ${String(
        tvListingRoute?.feature?.seoName || "",
      ).toLowerCase()} tvs in india, ${String(
        tvListingRoute?.feature?.seoName || "",
      ).toLowerCase()} tv prices, compare tv specs`,
    },
    {
      test: () => Boolean(tvDetailName),
      title: `${tvDetailName} Price in India, Specs & Features (${CURRENT_MONTH_SHORT_YEAR}) | MobileX`,
      description: `Compare ${tvDetailName} TV price in India, size variants, display specs, smart features, and store offers on MobileX.`,
      keywords: `${tvDetailName.toLowerCase()}, ${tvDetailName.toLowerCase()} tv price in india, ${tvDetailName.toLowerCase()} specifications, smart tv comparison india, tv prices list ${CURRENT_YEAR}`,
    },
    {
      test: () =>
        Boolean(smartphoneBrandLabel) && Boolean(smartphoneFeatureMeta?.name),
      title: `${getSmartphoneFeatureTitle(smartphoneListingRoute?.featureSlug, smartphoneFeatureMeta?.name || "")} in India (${CURRENT_MONTH_LONG_YEAR}) | MobileX`,
      description: `Explore ${smartphoneBrandLabel.toLowerCase()} ${String(
        smartphoneFeatureMeta?.name || "",
      ).toLowerCase()} smartphones in India with updated prices and detailed specifications covering battery camera display and performance comparisons on MobileX. Discover phones focused on ${String(
        smartphoneFeatureMeta?.description || smartphoneFeatureMeta?.name || "",
      ).toLowerCase()}.`,
      keywords: `${smartphoneBrandLabel.toLowerCase()} ${String(
        smartphoneFeatureMeta?.name || "",
      ).toLowerCase()} smartphones, ${smartphoneBrandLabel.toLowerCase()} phones in india, ${String(
        smartphoneFeatureMeta?.name || "",
      ).toLowerCase()} phones, mobile price comparison india, compare smartphone specs`,
    },
    {
      test: () => Boolean(smartphoneFeatureMeta?.name),
      title: `${getSmartphoneFeatureTitle(smartphoneListingRoute?.featureSlug, smartphoneFeatureMeta?.name || "")} in India (${CURRENT_MONTH_LONG_YEAR}) | MobileX`,
      description: `Explore ${String(
        smartphoneFeatureMeta?.name || "",
      ).toLowerCase()} smartphones in India with updated prices and detailed specifications covering battery camera display and performance comparisons on MobileX. Discover phones focused on ${String(
        smartphoneFeatureMeta?.description || smartphoneFeatureMeta?.name || "",
      ).toLowerCase()}.`,
      keywords: `${String(
        smartphoneFeatureMeta?.name || "",
      ).toLowerCase()} smartphones, best ${String(
        smartphoneFeatureMeta?.name || "",
      ).toLowerCase()} phones, mobile price comparison india, compare smartphone specs, ${BUDGET_PHONE_KEYWORDS}`,
    },
    {
      test: () => Boolean(smartphoneBrandLabel),
      title: `Best ${smartphoneBrandLabel} Smartphones in India (${CURRENT_MONTH_LONG_YEAR}) | MobileX`,
      description: `Explore ${smartphoneBrandLabel} smartphones on MobileX. Compare models check prices specifications reviews and find the best phone for your needs.`,
      keywords: `${smartphoneBrandLabel.toLowerCase()} smartphones, ${smartphoneBrandLabel.toLowerCase()} phones in india, ${smartphoneBrandLabel.toLowerCase()} mobile price, compare smartphone specs, mobile price comparison india`,
    },
    {
      test: () => Boolean(smartphoneFilterMeta),
      title:
        smartphoneFilterSlug === "new"
          ? `Latest Smartphones in India (${CURRENT_MONTH_LONG_YEAR}) | MobileX`
          : smartphoneFilterMeta?.label?.startsWith("Under")
            ? `Best Phones Under ${smartphoneFilterMeta.label.replace(/^Under\s+/, "")} in India (${CURRENT_MONTH_LONG_YEAR}) | MobileX`
            : `Best Phones ${smartphoneFilterMeta?.label || ""} in India (${CURRENT_MONTH_LONG_YEAR}) | MobileX`,
      description:
        smartphoneFilterSlug === "new"
          ? "Discover newly launched smartphones with updated prices, full specifications, and reviews. Stay updated with the latest mobile releases on MobileX."
          : `Explore the best smartphones ${String(
              smartphoneFilterSeoLabel || "",
            ).toLowerCase()} with detailed specs latest prices reviews and comparisons to choose the right phone for your budget.`,
      keywords:
        smartphoneFilterSlug === "new"
          ? `latest smartphones ${CURRENT_YEAR}, new launch mobiles, smartphone releases`
          : `smartphones ${String(
              smartphoneFilterMeta?.label || "",
            ).toLowerCase()}, best smartphones ${String(
              smartphoneFilterMeta?.label || "",
            ).toLowerCase()}, mobile price comparison india, compare smartphone specs, ${BUDGET_PHONE_KEYWORDS}`,
    },
    {
      test: (p) => p === "/smartphones/upcoming",
      title: `Upcoming Smartphones in India (${CURRENT_MONTH_LONG_YEAR}) | MobileX`,
      description:
        "Browse upcoming smartphones in India, track expected launch timelines, compare preview specifications, and watch preorder-ready devices before they arrive on MobileX.",
      keywords: `upcoming smartphones ${CURRENT_YEAR}, upcoming mobiles, expected phone prices, smartphone launch dates, mobile price comparison india`,
    },
    {
      test: (p) => p.startsWith("/smartphones"),
      title: `Best Smartphones in India (${CURRENT_MONTH_LONG_YEAR}) | MobileX`,
      description:
        "Compare smartphones by price, RAM/ROM variants, camera, battery, and performance. Find trending and latest mobile launches on MobileX.",
      keywords: `smartphones, latest smartphones in india ${CURRENT_YEAR}, best smartphones in ${CURRENT_YEAR}, new launch mobiles, trending phone in india, most popular mobiles, mobile price comparison india, compare smartphone specs, compare smartphone prices, 5g phones in india, ai phone, ai budget phone, ${BUDGET_PHONE_KEYWORDS}`,
    },
    {
      test: () => Boolean(laptopListingRoute),
      title: laptopListingSeo.title,
      description: laptopListingSeo.description,
      keywords: `laptops, latest laptops in india ${CURRENT_YEAR}, laptop prices list ${CURRENT_YEAR}, compare laptops india, laptop comparison site, laptop compare specs, gaming laptops india, student laptops india, productivity laptops, vacuum cooler laptop and phone`,
    },
    {
      test: (p) => p.startsWith("/tvs"),
      title: `Best TVs in India (${CURRENT_MONTH_LONG_YEAR}) | MobileX`,
      description:
        "Browse the best TVs in India ranked using buyer interest, trend momentum, and freshness signals. Compare screen sizes, specifications, variant pricing, and store availability on MobileX.",
      keywords: `best tvs in india ${CURRENT_YEAR}, smart tv prices list ${CURRENT_YEAR}, smart tv comparison india, compare tv prices india, compare tv specs, 43 inch tv, 55 inch tv, 65 inch tv, 75 inch tv, best 4k tv india, best 8k tv india, oled tv india, android tv price india, led tv under 30000`,
    },
    {
      test: (p) => p.startsWith("/networking"),
      title: `Best Networking Devices in India (${CURRENT_MONTH_LONG_YEAR}) | MobileX`,
      description:
        "Compare routers and networking products with speed, band, and connectivity specs to choose the right setup for your needs.",
      keywords:
        "networking devices, routers, wifi routers, dual band router, compare routers, modem router specs",
    },
    {
      test: (p) => p === "/popular-comparisons",
      title: "Popular Smartphone Comparisons in India | MobileX",
      description:
        "Explore popular smartphone comparisons and compare specifications, features, and important differences side by side.",
      keywords:
        "popular smartphone comparisons, compare smartphones india, smartphone specifications comparison, compare phone features",
    },
    {
      test: (p) => p.startsWith("/compare"),
      title: buildCompareSeoTitle(compareNames),
      description: buildCompareSeoDescription(compareNames),
      keywords:
        compareNames.length >= 2
          ? `${compareNames.map((name) => name.toLowerCase()).join(", ")}, compare ${compareNames.map((name) => name.toLowerCase()).join(" and ")}, compare devices india, smartphone comparison india`
          : "device comparison, compare smartphones laptops tvs, compare smartphone tv laptops, compare spec online, compare prices india, side by side comparison, best gadget comparison site",
    },
    {
      test: (p) => p.startsWith("/trending"),
      title: `Trending ${trendingLabels[trendingCategory] || trendingLabels.smartphones} in India (${CURRENT_MONTH_LONG_YEAR}) | MobileX`,
      description: `Track trending ${String(
        trendingLabels[trendingCategory] || trendingLabels.smartphones,
      ).toLowerCase()} based on momentum and user interest to spot what is popular right now.`,
      keywords:
        trendingKeywordSets[trendingCategory] || trendingKeywordSets.smartphones,
    },
    {
      test: (p) => p === "/news",
      title: NEWS_LISTING_SEO.title,
      description: NEWS_LISTING_SEO.description,
      keywords: NEWS_LISTING_SEO.keywords,
    },
    {
      test: (p) => p.startsWith("/careers"),
      title: "Careers at MobilesX | Join Our Team",
      description:
        "Apply for frontend, backend, content developer, and fullstack opportunities at MobilesX through a simple step-by-step application form.",
      keywords:
        "careers at hook, frontend jobs, backend jobs, fullstack jobs, content developer jobs, tech careers",
    },
    {
      test: (p) => p.startsWith("/about"),
      title: "About MobilesX | Technology Research and Comparisons",
      description:
        "Learn about MobilesX, our mission, and how we help users compare technology products with structured and transparent information.",
      keywords:
        "about hook, product comparison platform, technology discovery, gadget research platform",
    },
    {
      test: (p) => p.startsWith("/contact"),
      title: "Contact MobilesX | Support, Corrections and Partnerships",
      description:
        "Contact MobilesX for product support, partnerships, and press queries. Reach the team through verified contact channels.",
      keywords:
        "contact hook, support hook, partnerships, press inquiries, hook contact details",
    },
    {
      test: (p) => p.startsWith("/privacy-policy"),
      title: "Privacy Policy | MobilesX",
      description:
        "Read the MobilesX Privacy Policy to understand how we collect, use and protect your information and how you can control your privacy.",
      keywords:
        "privacy policy, data privacy, hook policy, personal data rights",
    },
    {
      test: (p) => p.startsWith("/terms"),
      title: "Terms and Conditions | MobilesX",
      description:
        "Read the MobilesX terms of use covering platform usage, content accuracy, and service limitations.",
      keywords: "terms of use, hook terms, website terms, usage policy",
    },
    {
      test: (p) =>
        p.startsWith("/account") ||
        p.startsWith("/wishlist") ||
        p.startsWith("/login") ||
        p.startsWith("/signup"),
      title: "MobilesX Account",
      description:
        "Secure account pages for your MobilesX profile and saved data.",
      keywords: "hook account, user account, login, signup, wishlist",
      robots: "noindex, nofollow",
    },
  ];

  const matched = rules.find((rule) => rule.test(canonicalPath));
  return {
    canonicalPath,
    title:
      matched?.title || "Compare Smartphones, TVs & More in India | MobileX",
    description:
      matched?.description ||
      "Compare smartphones, laptops, TVs, and networking devices with specs, variants, pricing insights, and trend signals on MobileX.",
    keywords: matched?.keywords || DEFAULT_SEO_KEYWORDS,
    robots: matched?.robots || DEFAULT_INDEX_ROBOTS,
  };
};

const stripMarkupForSeo = (value = "") =>
  String(value || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();

const toAbsoluteAssetUrl = (
  value = "",
  fallbackPath = "/mobilex-favicon.svg",
) => {
  const raw = String(value || "").trim();
  const fallback = `${SITE_ORIGIN}${fallbackPath}`;
  if (!raw) return fallback;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("//")) return `https:${raw}`;
  if (raw.startsWith("/")) return `${SITE_ORIGIN}${raw}`;
  return `${SITE_ORIGIN}/${raw}`;
};

const inferImageType = (url = "") => {
  const raw = String(url || "")
    .toLowerCase()
    .split(/[?#]/, 1)[0];
  if (raw.endsWith(".png")) return "image/png";
  if (raw.endsWith(".webp")) return "image/webp";
  if (raw.endsWith(".avif")) return "image/avif";
  if (raw.endsWith(".gif")) return "image/gif";
  return "image/jpeg";
};

const toSitemapLastmod = (value, fallback) => {
  const date = parseNewsDate(value);
  if (!date) return fallback;
  return date.toISOString().slice(0, 10);
};

const getRouteSitemapLastmod = (routePath = "/", fallbackDate = "") => {
  const normalizedRoute = normalizePath(routePath);

  if (normalizedRoute.startsWith("/news/")) {
    const meta = publishedNewsRouteMeta.get(normalizedRoute);
    return toSitemapLastmod(meta?.updatedAt || meta?.publishedAt, fallbackDate);
  }

  if (normalizedRoute.startsWith("/compare/")) {
    const meta = publishedCompareRouteMeta.get(normalizedRoute);
    return toSitemapLastmod(meta?.updatedAt, fallbackDate);
  }

  return fallbackDate;
};

const getComparePageFromPayload = (canonicalPath = "", preloadedApiPayload) => {
  const slug = getSingleSegmentRouteTail(canonicalPath, "/compare");
  if (!slug) return null;

  const page =
    preloadedApiPayload?.byUrl?.[buildCompareResolveEndpoint(slug)]?.page ||
    null;
  const items = Array.isArray(page?.items) ? page.items.filter(Boolean) : [];
  if (!page || items.length < 2 || items.length > 3) return null;

  const resolvedPath = normalizePath(page.route_path || `/compare/${slug}`);
  if (resolvedPath !== normalizePath(canonicalPath)) return null;

  return { ...page, items };
};

const getNewsArticleFromPayload = (canonicalPath = "", preloadedApiPayload) => {
  const slug = getNewsSlugFromPath(canonicalPath);
  if (!slug) return null;
  return (
    preloadedApiPayload?.byUrl?.[buildNewsStoryEndpoint(slug)]?.blog || null
  );
};

const getNewsArticleSeo = (canonicalPath = "", preloadedApiPayload) => {
  const blog = getNewsArticleFromPayload(canonicalPath, preloadedApiPayload);
  if (!blog) return null;

  const sharedSeo = buildNewsArticleSeo(blog);
  if (!sharedSeo.headline) return null;

  const tags = Array.isArray(blog.tags)
    ? blog.tags
    : String(blog.tags || "")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);

  const datePublished = blog.published_at || blog.updated_at || undefined;
  const dateModified = resolveNewsDateModified(
    datePublished,
    blog.updated_at || datePublished,
  );
  const image = toAbsoluteAssetUrl(blog.hero_image || "/mobilex-favicon.svg");
  const imageAlt = stripMarkupForSeo(blog.hero_image_alt || sharedSeo.headline);

  return {
    blog,
    title: sharedSeo.title,
    headline: sharedSeo.headline,
    description: sharedSeo.description,
    canonicalPath: sharedSeo.canonicalPath,
    canonicalUrl: sharedSeo.canonicalUrl,
    image,
    imageAlt,
    imageWidth: 1200,
    imageHeight: 630,
    imageType: inferImageType(image),
    authorName: stripMarkupForSeo(blog.author_name || "MobileX News"),
    articleSection: stripMarkupForSeo(blog.category || "News"),
    keywords: [
      blog.category,
      blog.product_name,
      blog.brand_name,
      ...(tags || []),
    ].filter(Boolean),
    datePublished,
    dateModified,
  };
};

const buildStructuredDataForRoute = (routePath, preloadedApiPayload) => {
  const seo = resolveSeo(routePath);
  const canonicalPath = seo.canonicalPath;
  const canonicalUrl = toCanonicalPageUrl(canonicalPath, SITE_ORIGIN);

  if (canonicalPath === "/") return [];

  if (canonicalPath === "/news") {
    const rows = getPreloadedRows(
      preloadedApiPayload,
      `${API_BASE_URL}/public/blogs?limit=50`,
      ["blogs"],
    );
    const items = rows
      .map((blog) => {
        const articleSeo = buildNewsArticleSeo(blog);
        if (!articleSeo.slug || !articleSeo.headline) return null;
        return {
          name: articleSeo.headline,
          url: articleSeo.canonicalUrl,
          image: blog.hero_image
            ? toAbsoluteAssetUrl(blog.hero_image)
            : undefined,
        };
      })
      .filter(Boolean);

    return [
      createBreadcrumbSchema([
        { label: "Home", url: toCanonicalPageUrl("/", SITE_ORIGIN) },
        { label: "News", url: canonicalUrl },
      ]),
      createCollectionSchema({
        name: "MobileX News",
        description: NEWS_LISTING_SEO.description,
        url: canonicalUrl,
        image: `${SITE_ORIGIN}/mobilex-favicon.svg`,
      }),
      createWebPageSchema({
        name: "MobileX News",
        description: NEWS_LISTING_SEO.description,
        url: canonicalUrl,
      }),
      createItemListSchema({
        name: "Latest News",
        url: canonicalUrl,
        items,
      }),
    ];
  }

  const newsArticleSeo = getNewsArticleSeo(canonicalPath, preloadedApiPayload);
  if (newsArticleSeo) {
    return [
      createBreadcrumbSchema([
        { label: "Home", url: SITE_ORIGIN },
        { label: "News", url: toCanonicalPageUrl("/news", SITE_ORIGIN) },
        { label: newsArticleSeo.headline, url: canonicalUrl },
      ]),
      createNewsArticleSchema({
        headline: newsArticleSeo.headline,
        description: newsArticleSeo.description,
        url: canonicalUrl,
        image: newsArticleSeo.image,
        imageAlt: newsArticleSeo.imageAlt,
        datePublished: newsArticleSeo.datePublished,
        dateModified: newsArticleSeo.dateModified,
        authorName: newsArticleSeo.authorName,
        articleSection: newsArticleSeo.articleSection,
        keywords: newsArticleSeo.keywords,
      }),
    ];
  }

  const smartphoneDetailName = getSmartphoneDetailName(canonicalPath);
  if (smartphoneDetailName) {
    return [
      createWebPageSchema({
        name: seo.title,
        description: seo.description,
        url: canonicalUrl,
      }),
    ];
  }

  const laptopListingRoute = parseLaptopListingPath(canonicalPath);
  const laptopDetailName = laptopListingRoute
    ? ""
    : extractDetailSlugName(canonicalPath, "/laptops/");
  if (laptopDetailName) {
    return [
      createWebPageSchema({
        name: seo.title,
        description: seo.description,
        url: canonicalUrl,
      }),
      createProductSchema({
        name: laptopDetailName,
        description: seo.description,
        url: canonicalUrl,
      }),
    ];
  }

  const tvDetailName = getTvDetailName(canonicalPath);
  if (tvDetailName) {
    return [
      createWebPageSchema({
        name: seo.title,
        description: seo.description,
        url: canonicalUrl,
      }),
      createProductSchema({
        name: tvDetailName,
        description: seo.description,
        url: canonicalUrl,
      }),
    ];
  }

  const networkingDetailName = extractDetailSlugName(
    canonicalPath,
    "/networking/",
  );
  if (networkingDetailName) {
    return [
      createWebPageSchema({
        name: seo.title,
        description: seo.description,
        url: canonicalUrl,
      }),
      createProductSchema({
        name: networkingDetailName,
        description: seo.description,
        url: canonicalUrl,
      }),
    ];
  }

  if (canonicalPath.startsWith("/compare")) {
    const comparePage = getComparePageFromPayload(
      canonicalPath,
      preloadedApiPayload,
    );
    const compareLabel =
      comparePage?.title ||
      extractCompareRouteNames(canonicalPath).join(" vs ") ||
      "Compare Devices";
    const schemas = [
      createBreadcrumbSchema([
        { label: "Home", url: toCanonicalPageUrl("/", SITE_ORIGIN) },
        { label: "Compare", url: toCanonicalPageUrl("/compare", SITE_ORIGIN) },
        ...(canonicalPath === "/compare"
          ? []
          : [{ label: compareLabel, url: canonicalUrl }]),
      ]),
      createWebApplicationSchema({
        name: seo.title,
        description: seo.description,
        url: canonicalUrl,
        applicationCategory: "UtilityApplication",
      }),
    ];

    const compareItemsForSchema = comparePage?.items?.length
      ? comparePage.items.map((item) => ({
          name: item.product_name || item.name || "Compared product",
          url: item.detail_path
            ? toCanonicalPageUrl(item.detail_path, SITE_ORIGIN)
            : undefined,
          image: item.image_url || undefined,
        }))
      : extractCompareRouteNames(canonicalPath).map((name) => ({ name }));
    if (compareItemsForSchema.length >= 2) {
      schemas.push(
        createItemListSchema({
          name: seo.title,
          url: canonicalUrl,
          description: seo.description,
          items: compareItemsForSchema,
        }),
      );
    }

    return schemas;
  }

  if (canonicalPath.startsWith("/about")) {
    return [
      createAboutPageSchema({
        name: seo.title,
        description: seo.description,
        url: canonicalUrl,
      }),
    ];
  }

  if (canonicalPath.startsWith("/contact")) {
    return [
      createContactPageSchema({
        name: seo.title,
        description: seo.description,
        url: canonicalUrl,
        contactEmail: "gospherecompare@gmail.com",
      }),
    ];
  }

  if (
    canonicalPath.startsWith("/privacy-policy") ||
    canonicalPath.startsWith("/terms") ||
    canonicalPath.startsWith("/careers")
  ) {
    return [
      createWebPageSchema({
        name: seo.title,
        description: seo.description,
        url: canonicalUrl,
      }),
    ];
  }

  if (canonicalPath.startsWith("/smartphones")) {
    const rows = getPreloadedRows(
      preloadedApiPayload,
      `${API_BASE_URL}/smartphones`,
      ["smartphones"],
    );
    const items = buildItemListFromRows(rows, {
      basePath: "/smartphones",
      toDetailSlug: (slug) => toSmartphoneSeoSlug(slug),
    });
    return [
      createCollectionSchema({
        name: seo.title,
        description: seo.description,
        url: canonicalUrl,
      }),
      createItemListSchema({
        name: seo.title,
        url: canonicalUrl,
        items,
      }),
    ];
  }

  if (canonicalPath.startsWith("/laptops")) {
    const laptopEndpoint = laptopListingRoute?.latest
      ? `${API_BASE_URL}/public/new/laptops`
      : `${API_BASE_URL}/laptops`;
    const rows = getPreloadedRows(preloadedApiPayload, laptopEndpoint, [
      "laptops",
      "results",
    ]);
    const filteredRows = laptopListingRoute
      ? rows.filter((row) => matchesLaptopListingRoute(row, laptopListingRoute))
      : rows;
    const items = buildItemListFromRows(filteredRows, {
      basePath: "/laptops",
    });
    return [
      createCollectionSchema({
        name: seo.title,
        description: seo.description,
        url: canonicalUrl,
      }),
      createItemListSchema({
        name: seo.title,
        url: canonicalUrl,
        items,
      }),
    ];
  }

  if (canonicalPath.startsWith("/tvs")) {
    const tvListingRoute = getTvListingRouteMeta(canonicalPath);
    const tvEndpoint =
      tvListingRoute?.type === "latest"
        ? `${API_BASE_URL}/public/new/tvs`
        : `${API_BASE_URL}/tvs`;
    const rows = getPreloadedRows(preloadedApiPayload, tvEndpoint, [
      "tvs",
      "results",
    ]);
    const filteredRows =
      tvListingRoute?.type === "feature"
        ? rows.filter((row) =>
            matchesTvFeatureRoute(
              row,
              canonicalPath.slice("/tvs/features/".length),
            ),
          )
        : rows;
    const items = buildItemListFromRows(filteredRows, {
      basePath: "/tvs",
    });
    return [
      createCollectionSchema({
        name: seo.title,
        description: seo.description,
        url: canonicalUrl,
      }),
      items.length
        ? createItemListSchema({
            name: seo.title,
            url: canonicalUrl,
            items,
          })
        : null,
    ].filter(Boolean);
  }

  if (canonicalPath.startsWith("/networking")) {
    const rows = getPreloadedRows(
      preloadedApiPayload,
      `${API_BASE_URL}/networking`,
      ["networking"],
    );
    const items = buildItemListFromRows(rows, {
      basePath: "/networking",
    });
    return [
      createCollectionSchema({
        name: seo.title,
        description: seo.description,
        url: canonicalUrl,
      }),
      createItemListSchema({
        name: seo.title,
        url: canonicalUrl,
        items,
      }),
    ];
  }

  if (canonicalPath.startsWith("/trending")) {
    const category = canonicalPath.split("/")[2] || "smartphones";
    const endpointByCategory = {
      smartphones: `${API_BASE_URL}/public/trending/smartphones?limit=120`,
      tvs: `${API_BASE_URL}/public/trending/tvs?limit=120`,
      networking: `${API_BASE_URL}/public/trending/networking?limit=120`,
    };
    const endpoint =
      endpointByCategory[category] || endpointByCategory.smartphones;
    const rows = getPreloadedRows(preloadedApiPayload, endpoint, ["results"]);
    const basePath =
      category === "laptops"
        ? "/laptops"
        : category === "tvs"
          ? "/tvs"
          : category === "networking"
            ? "/networking"
            : "/smartphones";
    const items = buildItemListFromRows(rows, {
      basePath,
      toDetailSlug:
        basePath === "/smartphones"
          ? (slug) => toSmartphoneSeoSlug(slug)
          : (slug) => slug,
      getName: (item) =>
        item?.product_name || item?.name || item?.model || item?.title || "",
      getImage: (item) =>
        item?.image ||
        (Array.isArray(item?.images) ? item.images.find(Boolean) : null) ||
        null,
    });
    return [
      createCollectionSchema({
        name: seo.title,
        description: seo.description,
        url: canonicalUrl,
      }),
      createItemListSchema({
        name: seo.title,
        url: canonicalUrl,
        items,
      }),
    ];
  }

  return [];
};

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const replaceMetaTag = (html, regex, tag) =>
  regex.test(html)
    ? html.replace(regex, tag)
    : html.replace("</head>", `${tag}\n</head>`);

const escapeInlineJson = (value) =>
  JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");

const injectPreloadedPayload = (html, payload) => {
  if (!payload) return html;
  if (html.includes('id="hook-prerender-data"')) return html;
  const scriptTag = `<script id="hook-prerender-data">window.__HOOKS_PRERENDER_DATA__=${escapeInlineJson(payload)};</script>`;
  return html.replace("</head>", `${scriptTag}\n</head>`);
};

const injectStructuredData = (html, routePath, preloadedApiPayload) => {
  const existing = [
    ...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>/gi),
  ];
  if (existing.length > 2) return html;

  const schemas = buildStructuredDataForRoute(routePath, preloadedApiPayload);
  if (!schemas || schemas.length === 0) return html;

  const canonicalUrl = toCanonicalPageUrl(
    toCanonicalPath(normalizePath(routePath || "/")),
    SITE_ORIGIN,
  );
  const entries = Array.isArray(schemas) ? schemas : [schemas];
  const scripts = entries
    .map(
      (schema) =>
        `<script type="application/ld+json" data-hooks-prerender-schema="true" data-hooks-prerender-canonical="${escapeHtml(canonicalUrl)}">${escapeInlineJson(schema)}</script>`,
    )
    .join("\n");
  return html.replace("</head>", `${scripts}\n</head>`);
};

const comparePriceFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const formatComparePrerenderPrice = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0
    ? comparePriceFormatter.format(numeric)
    : "Price unavailable";
};

const buildCompareDetailPrerenderMarkup = (
  canonicalPath,
  preloadedApiPayload,
) => {
  const page = getComparePageFromPayload(canonicalPath, preloadedApiPayload);
  if (!page) {
    throw new Error(
      `[compare-prerender] Missing a valid 2-3 product payload for ${canonicalPath}.`,
    );
  }

  const seo = resolveSeo(canonicalPath);
  const names = page.items.map(
    (item) => item.product_name || item.name || "Compared product",
  );
  const heading = stripMarkupForSeo(page.title || seo.title);
  const description = stripMarkupForSeo(
    page.meta_description || seo.description,
  );
  const productCards = page.items
    .map((item, index) => {
      const name = stripMarkupForSeo(
        item.product_name || item.name || `Product ${index + 1}`,
      );
      const brand = stripMarkupForSeo(item.brand_name || "");
      const productType = stripMarkupForSeo(item.product_type || "device");
      const detailUrl = item.detail_path
        ? toCanonicalPageUrl(item.detail_path, SITE_ORIGIN)
        : toCanonicalPageUrl("/smartphones", SITE_ORIGIN);
      const image = item.image_url
        ? `<img src="${escapeHtml(toAbsoluteAssetUrl(item.image_url))}" alt="${escapeHtml(name)}" loading="${index === 0 ? "eager" : "lazy"}" class="mx-auto h-44 w-full object-contain" />`
        : "";

      return `<article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
  <a href="${escapeHtml(detailUrl)}" class="block text-slate-950 hover:text-blue-700">
    ${image}
    <h2 class="mt-4 text-xl font-bold">${escapeHtml(name)}</h2>
    <p class="mt-2 text-sm text-slate-600">${escapeHtml(
      [brand, productType].filter(Boolean).join(" · "),
    )}</p>
    <p class="mt-3 font-semibold text-slate-900">${escapeHtml(
      formatComparePrerenderPrice(item.best_price),
    )}</p>
  </a>
</article>`;
    })
    .join("\n");

  return `<main data-compare-prerendered="detail" class="min-h-screen bg-slate-50 text-slate-950">
  <section class="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 lg:px-8">
    <nav aria-label="Breadcrumb" class="text-sm text-slate-500">
      <a href="/" class="hover:text-blue-700">Home</a>
      <span aria-hidden="true"> / </span>
      <a href="/compare/" class="hover:text-blue-700">Compare</a>
      <span aria-hidden="true"> / </span>
      <span aria-current="page">${escapeHtml(names.join(" vs "))}</span>
    </nav>
    <header class="mt-6 max-w-5xl">
      <p class="text-xs font-bold uppercase tracking-wider text-blue-700">Device comparison</p>
      <h1 class="mt-3 text-4xl font-black leading-tight tracking-tight">${escapeHtml(heading)}</h1>
      <p class="mt-4 text-lg leading-8 text-slate-600">${escapeHtml(description)}</p>
    </header>
    <section aria-label="Products in this comparison" class="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      ${productCards}
    </section>
    <section class="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
      <h2 class="text-2xl font-bold">${escapeHtml(names.join(" vs "))}</h2>
      <p class="mt-3 leading-7 text-slate-700">Compare current prices and product details for ${escapeHtml(
        names.join(", "),
      )}. The interactive comparison below adds the complete side-by-side specifications, differences, and available buying information.</p>
    </section>
  </section>
</main>`;
};

const injectCompareRouteContent = (html, routePath, preloadedApiPayload) => {
  const canonicalPath = toCanonicalPath(normalizePath(routePath || "/"));
  if (!canonicalPath.startsWith("/compare/")) return html;

  const emptyRootPattern = /<div\s+id=["']root["'][^>]*>\s*<\/div>/i;
  if (!emptyRootPattern.test(html)) return html;

  const markup = buildCompareDetailPrerenderMarkup(
    canonicalPath,
    preloadedApiPayload,
  );
  return html.replace(emptyRootPattern, `<div id="root">${markup}</div>`);
};

const formatNewsPrerenderDate = (value = "") => {
  const date = parseNewsDate(value);
  if (!date) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

const buildNewsListingPrerenderMarkup = (preloadedApiPayload) => {
  const blogs = getPreloadedRows(
    preloadedApiPayload,
    `${API_BASE_URL}/public/blogs?limit=50`,
    ["blogs"],
  );

  if (!blogs.length) {
    throw new Error(
      "[news-prerender] Missing published stories for the /news listing.",
    );
  }

  const cards = blogs
    .map((blog) => {
      const articleSeo = buildNewsArticleSeo(blog);
      if (!articleSeo.slug || !articleSeo.headline) return "";
      const image = blog.hero_image
        ? `<img src="${escapeNewsHtml(toAbsoluteAssetUrl(blog.hero_image))}" alt="${escapeNewsHtml(blog.hero_image_alt || articleSeo.headline)}" loading="lazy" class="aspect-[16/9] w-full rounded-xl object-cover" />`
        : "";
      const dateValue = blog.published_at || blog.updated_at || "";
      const dateLabel = formatNewsPrerenderDate(dateValue);

      return `<article class="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
  <a href="${escapeNewsHtml(articleSeo.canonicalPath)}" class="group block">
    ${image}
    <p class="mt-4 text-xs font-bold uppercase tracking-wider text-blue-700">${escapeNewsHtml(blog.category || "News")}</p>
    <h2 class="mt-2 text-xl font-bold leading-tight text-slate-950 group-hover:text-blue-700">${escapeNewsHtml(articleSeo.headline)}</h2>
    <p class="mt-3 text-sm leading-6 text-slate-600">${escapeNewsHtml(articleSeo.description)}</p>
    ${dateLabel ? `<time datetime="${escapeNewsHtml(dateValue)}" class="mt-3 block text-xs text-slate-500">${escapeNewsHtml(dateLabel)}</time>` : ""}
  </a>
</article>`;
    })
    .filter(Boolean)
    .join("\n");

  if (!cards) {
    throw new Error(
      "[news-prerender] Published stories did not produce crawlable listing links.",
    );
  }

  return `<main data-news-prerendered="listing" class="min-h-screen bg-white text-slate-950">
  <section class="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8">
    <nav aria-label="Breadcrumb" class="mb-5 text-sm text-slate-500">
      <a href="/" class="hover:text-blue-700">Home</a>
      <span aria-hidden="true"> / </span>
      <span aria-current="page">News</span>
    </nav>
    <header class="max-w-4xl">
      <h1 class="text-4xl font-black tracking-tight text-slate-950">News &amp; Articles</h1>
      <p class="mt-4 text-lg leading-8 text-slate-600">${escapeNewsHtml(NEWS_LISTING_SEO.description)}</p>
    </header>
    <section aria-label="Latest news articles" class="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      ${cards}
    </section>
  </section>
</main>`;
};

const buildNewsArticlePrerenderMarkup = (
  canonicalPath,
  preloadedApiPayload,
) => {
  const articleSeo = getNewsArticleSeo(canonicalPath, preloadedApiPayload);
  if (!articleSeo?.blog || !articleSeo.headline) {
    throw new Error(
      `[news-prerender] Missing article payload for ${canonicalPath}.`,
    );
  }

  const { blog } = articleSeo;
  const articleHtml = sanitizeNewsArticleHtml(blog.content_rendered || "");
  if (!stripNewsMarkup(articleHtml)) {
    throw new Error(
      `[news-prerender] Article ${canonicalPath} does not contain indexable body content.`,
    );
  }

  const relatedBlogs = getPreloadedRows(
    preloadedApiPayload,
    `${API_BASE_URL}/public/blogs?limit=18`,
    ["blogs"],
  )
    .filter((item) => item?.slug && item.slug !== blog.slug)
    .slice(0, 6);
  const relatedLinks = relatedBlogs
    .map((item) => {
      const relatedSeo = buildNewsArticleSeo(item);
      return relatedSeo.slug && relatedSeo.headline
        ? `<li><a href="${escapeNewsHtml(relatedSeo.canonicalPath)}" class="font-semibold text-slate-800 hover:text-blue-700">${escapeNewsHtml(relatedSeo.headline)}</a></li>`
        : "";
    })
    .filter(Boolean)
    .join("\n");
  const image = blog.hero_image
    ? `<figure class="mt-8">
        <img src="${escapeNewsHtml(toAbsoluteAssetUrl(blog.hero_image))}" alt="${escapeNewsHtml(blog.hero_image_alt || articleSeo.headline)}" class="aspect-[16/9] w-full rounded-xl object-cover" />
        ${blog.hero_image_caption ? `<figcaption class="mt-2 text-xs text-slate-500">${escapeNewsHtml(blog.hero_image_caption)}</figcaption>` : ""}
      </figure>`
    : "";
  const publishedValue = blog.published_at || blog.updated_at || "";
  const publishedLabel = formatNewsPrerenderDate(publishedValue);
  const author = stripMarkupForSeo(blog.author_name || "MobileX News");

  return `<main data-news-prerendered="article" class="min-h-screen bg-white text-slate-950">
  <section class="mx-auto max-w-[1120px] px-4 py-8 sm:px-6 lg:px-8">
    <nav aria-label="Breadcrumb" class="text-sm text-slate-500">
      <a href="/" class="hover:text-blue-700">Home</a>
      <span aria-hidden="true"> / </span>
      <a href="/news/" class="hover:text-blue-700">News</a>
      <span aria-hidden="true"> / </span>
      <span aria-current="page">${escapeNewsHtml(articleSeo.headline)}</span>
    </nav>
    <header class="mt-6 max-w-5xl">
      <p class="text-xs font-bold uppercase tracking-wider text-blue-700">${escapeNewsHtml(blog.category || "News")}</p>
      <h1 class="mt-3 text-4xl font-black leading-tight tracking-tight text-slate-950">${escapeNewsHtml(articleSeo.headline)}</h1>
      <p class="mt-4 text-lg leading-8 text-slate-600">${escapeNewsHtml(articleSeo.description)}</p>
      <p class="mt-4 text-sm text-slate-500">By ${escapeNewsHtml(author)}${publishedLabel ? ` · <time datetime="${escapeNewsHtml(publishedValue)}">${escapeNewsHtml(publishedLabel)}</time>` : ""}</p>
    </header>
    ${image}
    <article class="news-article-prose mt-8 space-y-6 text-lg leading-8 text-slate-800">
      ${articleHtml}
    </article>
    ${
      relatedLinks
        ? `<aside aria-label="Related news" class="mt-10 border-t border-slate-200 pt-6">
      <h2 class="text-2xl font-bold text-slate-950">Related News</h2>
      <ul class="mt-4 space-y-3">${relatedLinks}</ul>
    </aside>`
        : ""
    }
  </section>
</main>`;
};

const injectNewsRouteContent = (html, routePath, preloadedApiPayload) => {
  const canonicalPath = toCanonicalPath(normalizePath(routePath || "/"));
  if (canonicalPath !== "/news" && !canonicalPath.startsWith("/news/")) {
    return html;
  }

  const emptyRootPattern = /<div\s+id=["']root["'][^>]*>\s*<\/div>/i;
  if (!emptyRootPattern.test(html)) {
    return html;
  }

  const markup =
    canonicalPath === "/news"
      ? buildNewsListingPrerenderMarkup(preloadedApiPayload)
      : buildNewsArticlePrerenderMarkup(canonicalPath, preloadedApiPayload);

  return html.replace(emptyRootPattern, `<div id="root">${markup}</div>`);
};

const getListingPrerenderRows = (canonicalPath, payload) => {
  const candidates = [];
  if (canonicalPath.startsWith("/trending/")) {
    const category = canonicalPath.split("/")[2] || "smartphones";
    candidates.push(`${API_BASE_URL}/public/trending/${category}?limit=120`);
  } else if (canonicalPath.startsWith("/smartphones")) {
    const listingRoute = parseSmartphoneListingPath(canonicalPath);
    if (listingRoute?.upcoming || canonicalPath.includes("/upcoming")) {
      candidates.push(`${API_BASE_URL}/public/upcoming/smartphones`);
    } else if (listingRoute?.filter === "new" || canonicalPath.includes("/filter/new")) {
      candidates.push(`${API_BASE_URL}/public/new/smartphones`);
    }
    candidates.push(
      `${API_BASE_URL}/smartphones?page=1&limit=20`,
      `${API_BASE_URL}/smartphones`,
    );
  } else if (canonicalPath.startsWith("/tvs")) {
    const tvListingRoute = getTvListingRouteMeta(canonicalPath);
    candidates.push(
      tvListingRoute?.type === "latest"
        ? `${API_BASE_URL}/public/new/tvs`
        : `${API_BASE_URL}/tvs`,
    );
    candidates.push(`${API_BASE_URL}/tvs`);
  } else if (canonicalPath === "/networking") {
    candidates.push(`${API_BASE_URL}/networking`);
  }

  for (const endpoint of [...new Set(candidates)]) {
    const rows = getPreloadedRows(
      payload,
      endpoint,
      endpoint.includes("smartphones") ? ["smartphones"] : ["tvs", "results"],
    );
    if (rows.length) return rows;
  }
  return [];
};

const buildListingPrerenderMarkup = (canonicalPath, payload) => {
  const seo = resolveSeo(canonicalPath);
  const rows = getListingPrerenderRows(canonicalPath, payload);
  const isSmartphoneRoute =
    canonicalPath.startsWith("/smartphones") ||
    canonicalPath === "/trending/smartphones";
  const isNetworkingRoute = canonicalPath === "/trending/networking";
  const basePath = isSmartphoneRoute
    ? "/smartphones"
    : isNetworkingRoute
      ? "/networking"
      : canonicalPath === "/networking" || isNetworkingRoute
        ? "/networking"
        : "/tvs";
  const links = buildItemListFromRows(rows, {
    basePath,
    toDetailSlug: isSmartphoneRoute
      ? (slug) => toSmartphoneSeoSlug(slug)
      : (slug) => slug,
    getName: (item) =>
      item?.product_name ||
      item?.name ||
      item?.model_number ||
      item?.model ||
      item?.basic_info?.product_name ||
      item?.basic_info?.title ||
      item?.basic_info?.model_number ||
      item?.basic_info?.model,
  });
  const productLinks = links
    .map(
      (item) =>
        `<li><a href="${escapeHtml(item.url)}" class="font-semibold text-slate-800 hover:text-blue-700">${escapeHtml(item.name)}</a></li>`,
    )
    .join("\n");

  return `<main data-listing-prerendered="true" class="min-h-screen bg-white text-slate-950">
  <section class="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8">
    <nav aria-label="Breadcrumb" class="mb-5 text-sm text-slate-500">
      <a href="/" class="hover:text-blue-700">Home</a>
      <span aria-hidden="true"> / </span>
      <span aria-current="page">${escapeHtml(seo.title.replace(/\s*\|\s*MobileX$/, ""))}</span>
    </nav>
    <header class="max-w-4xl">
      <h1 class="text-4xl font-black tracking-tight text-slate-950">${escapeHtml(seo.title.replace(/\s*\([^)]*\)\s*\|\s*MobileX$/, ""))}</h1>
      <p class="mt-4 text-lg leading-8 text-slate-600">${escapeHtml(seo.description)}</p>
    </header>
    ${productLinks ? `<section aria-label="Featured products" class="mt-8"><h2 class="text-2xl font-bold text-slate-950">Explore ${isSmartphoneRoute ? "smartphones" : isNetworkingRoute ? "networking devices" : "TVs"}</h2><ul class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">${productLinks}</ul></section>` : ""}
  </section>
</main>`;
};

const injectListingRouteContent = (html, routePath, payload) => {
  const canonicalPath = toCanonicalPath(normalizePath(routePath || "/"));
  const isPopularComparisonsRoute = canonicalPath === "/popular-comparisons";
  const isListingRoute =
    canonicalPath.startsWith("/smartphones") ||
    canonicalPath.startsWith("/tvs") ||
    canonicalPath === "/networking" ||
    canonicalPath === "/trending/smartphones" ||
    canonicalPath === "/trending/tvs" ||
    canonicalPath === "/trending/networking" ||
    isPopularComparisonsRoute;
  if (!isListingRoute || getSmartphoneDetailName(canonicalPath) || getTvDetailName(canonicalPath)) {
    return html;
  }

  const emptyRootPattern = /<div\s+id=["']root["'][^>]*>\s*<\/div>/i;
  if (!emptyRootPattern.test(html)) return html;
  if (isPopularComparisonsRoute) {
    return html.replace(
      emptyRootPattern,
      `<div id="root"><main data-popular-comparisons-prerendered="true" class="min-h-screen bg-white text-slate-950"><section class="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8"><nav aria-label="Breadcrumb" class="mb-5 text-sm text-slate-500"><a href="/" class="hover:text-blue-700">Home</a><span aria-hidden="true"> / </span><span aria-current="page">Popular Comparisons</span></nav><header class="max-w-4xl"><h1 class="text-4xl font-black tracking-tight text-slate-950">Popular Smartphone Comparisons in India</h1><p class="mt-4 text-lg leading-8 text-slate-600">Explore popular smartphone comparisons and compare specifications, features, and important differences side by side.</p></header></section></main></div>`,
    );
  }
  return html.replace(
    emptyRootPattern,
    `<div id="root">${buildListingPrerenderMarkup(canonicalPath, payload)}</div>`,
  );
};

const buildProductPrerenderMarkup = (canonicalPath) => {
  const isSmartphone = canonicalPath.startsWith("/smartphones/");
  const productName = isSmartphone
    ? getSmartphoneDetailName(canonicalPath)
    : getTvDetailName(canonicalPath);
  const seo = resolveSeo(canonicalPath);
  const categoryPath = isSmartphone ? "/smartphones" : "/tvs";
  const categoryLabel = isSmartphone ? "Smartphones" : "TVs";

  return `<main data-product-prerendered="true" class="min-h-screen bg-white text-slate-950">
  <article class="mx-auto max-w-[1120px] px-4 py-8 sm:px-6 lg:px-8">
    <nav aria-label="Breadcrumb" class="text-sm text-slate-500">
      <a href="/" class="hover:text-blue-700">Home</a>
      <span aria-hidden="true"> / </span>
      <a href="${categoryPath}" class="hover:text-blue-700">${categoryLabel}</a>
      <span aria-hidden="true"> / </span>
      <span aria-current="page">${escapeHtml(productName)}</span>
    </nav>
    <header class="mt-6 max-w-4xl">
      <h1 class="text-4xl font-black leading-tight tracking-tight text-slate-950">${escapeHtml(productName)}</h1>
      <p class="mt-4 text-lg leading-8 text-slate-600">${escapeHtml(seo.description)}</p>
    </header>
    <nav aria-label="Related product navigation" class="mt-8 flex flex-wrap gap-4 text-sm font-semibold">
      <a href="${categoryPath}" class="text-blue-700 hover:text-blue-900">Browse all ${categoryLabel.toLowerCase()}</a>
      <a href="/popular-comparisons" class="text-blue-700 hover:text-blue-900">Compare popular devices</a>
    </nav>
  </article>
</main>`;
};

const injectProductRouteContent = (html, routePath) => {
  const canonicalPath = toCanonicalPath(normalizePath(routePath || "/"));
  const smartphoneSlug = getSingleSegmentRouteTail(
    canonicalPath,
    "/smartphones",
  );
  const tvSlug = getSingleSegmentRouteTail(canonicalPath, "/tvs");
  const isSmartphoneDetail =
    Boolean(smartphoneSlug) && !SMARTPHONE_LIST_SLUGS.has(smartphoneSlug);
  const isTvDetail = Boolean(tvSlug) && !getTvListingRouteMeta(canonicalPath);
  if (!isSmartphoneDetail && !isTvDetail) return html;

  const emptyRootPattern = /<div\s+id=["']root["'][^>]*>\s*<\/div>/i;
  if (!emptyRootPattern.test(html)) return html;
  return html.replace(
    emptyRootPattern,
    `<div id="root">${buildProductPrerenderMarkup(canonicalPath)}</div>`,
  );
};

const PUBLIC_STATIC_PRERENDER_CONTENT = {
  "/": {
    heading: "Compare Smartphones, TVs & More in India",
    description:
      "Compare smartphones, laptops, TVs, and networking devices in India with specifications, prices, variants, and trend insights on MobileX.",
  },
  "/about": {
    heading: "About MobileX",
    description:
      "Learn about MobileX and how we help people discover, compare, and understand technology products with structured information.",
  },
  "/careers": {
    heading: "Careers at MobileX",
    description:
      "Explore frontend, backend, content, and fullstack opportunities at MobileX.",
  },
  "/contact": {
    heading: "Contact MobileX",
    description:
      "Contact MobileX for product support, corrections, partnerships, and press enquiries.",
  },
  "/privacy-policy": {
    heading: "Privacy Policy",
    description:
      "Read the MobileX privacy policy to understand how information is collected, used, stored, and protected.",
  },
  "/terms": {
    heading: "Terms and Conditions",
    description:
      "Read the MobileX terms of use covering platform usage, content accuracy, and service limitations.",
  },
  "/compare": {
    heading: "Compare Smartphones Side by Side",
    description:
      "Select two to four phones and compare price, performance, camera, battery, launch timing, and complete specifications.",
  },
};

const injectPublicStaticRouteContent = (html, routePath) => {
  const canonicalPath = toCanonicalPath(normalizePath(routePath || "/"));
  const content = PUBLIC_STATIC_PRERENDER_CONTENT[canonicalPath];
  if (!content) return html;

  const emptyRootPattern = /<div\s+id=["']root["'][^>]*>\s*<\/div>/i;
  if (!emptyRootPattern.test(html)) return html;
  return html.replace(
    emptyRootPattern,
    `<div id="root"><main data-static-prerendered="true" class="min-h-screen bg-white text-slate-950"><section class="mx-auto max-w-[1120px] px-4 py-8 sm:px-6 lg:px-8"><nav aria-label="Breadcrumb" class="mb-5 text-sm text-slate-500"><a href="/" class="hover:text-blue-700">Home</a><span aria-hidden="true"> / </span><span aria-current="page">${escapeHtml(content.heading)}</span></nav><header class="max-w-4xl"><h1 class="text-4xl font-black tracking-tight text-slate-950">${escapeHtml(content.heading)}</h1><p class="mt-4 text-lg leading-8 text-slate-600">${escapeHtml(content.description)}</p></header></section></main></div>`,
  );
};

const applySeoToHtml = (html, routePath) => {
  const seo = resolveSeo(routePath);
  const canonicalUrl = toCanonicalPageUrl(seo.canonicalPath, SITE_ORIGIN);
  const normalizedRoute = normalizePath(routePath || "/");
  const isAliasRoute = normalizedRoute !== seo.canonicalPath;
  let next = html;

  next = next.replace(
    /<title>[\s\S]*?<\/title>/i,
    `<title>${escapeHtml(seo.title)}</title>`,
  );
  next = replaceMetaTag(
    next,
    /<meta\s+name=["']robots["'][^>]*>/i,
    `<meta name="robots" content="${escapeHtml(seo.robots)}">`,
  );
  next = replaceMetaTag(
    next,
    /<meta\s+name=["']description["'][^>]*>/i,
    `<meta name="description" content="${escapeHtml(seo.description)}">`,
  );
  next = replaceMetaTag(
    next,
    /<meta\s+name=["']keywords["'][^>]*>/i,
    `<meta name="keywords" content="${escapeHtml(seo.keywords)}">`,
  );
  next = replaceMetaTag(
    next,
    /<meta\s+property=["']og:title["'][^>]*>/i,
    `<meta property="og:title" content="${escapeHtml(seo.title)}">`,
  );
  next = replaceMetaTag(
    next,
    /<meta\s+property=["']og:description["'][^>]*>/i,
    `<meta property="og:description" content="${escapeHtml(seo.description)}">`,
  );
  next = replaceMetaTag(
    next,
    /<meta\s+property=["']og:url["'][^>]*>/i,
    `<meta property="og:url" content="${escapeHtml(canonicalUrl)}">`,
  );
  next = replaceMetaTag(
    next,
    /<meta\s+name=["']twitter:title["'][^>]*>/i,
    `<meta name="twitter:title" content="${escapeHtml(seo.title)}">`,
  );
  next = replaceMetaTag(
    next,
    /<meta\s+name=["']twitter:description["'][^>]*>/i,
    `<meta name="twitter:description" content="${escapeHtml(seo.description)}">`,
  );
  next = replaceMetaTag(
    next,
    /<link\s+rel=["']canonical["'][^>]*>/i,
    `<link rel="canonical" href="${escapeHtml(canonicalUrl)}">`,
  );

  if (isAliasRoute) {
    next = replaceMetaTag(
      next,
      /<meta\s+http-equiv=["']refresh["'][^>]*>/i,
      `<meta http-equiv="refresh" content="0;url=${escapeHtml(canonicalUrl)}">`,
    );
  }

  return next;
};

const applyNewsArticleSeoToHtml = (html, routePath, preloadedApiPayload) => {
  const canonicalPath = toCanonicalPath(normalizePath(routePath || "/"));
  const articleSeo = getNewsArticleSeo(canonicalPath, preloadedApiPayload);
  if (!articleSeo) return html;

  const canonicalUrl = toCanonicalPageUrl(canonicalPath, SITE_ORIGIN);
  let next = html;

  next = next.replace(
    /<title>[\s\S]*?<\/title>/i,
    `<title>${escapeHtml(articleSeo.title)}</title>`,
  );
  next = replaceMetaTag(
    next,
    /<meta\s+name=["']description["'][^>]*>/i,
    `<meta name="description" content="${escapeHtml(articleSeo.description)}">`,
  );
  next = replaceMetaTag(
    next,
    /<meta\s+name=["']keywords["'][^>]*>/i,
    `<meta name="keywords" content="${escapeHtml(articleSeo.keywords.join(", "))}">`,
  );
  next = replaceMetaTag(
    next,
    /<meta\s+name=["']robots["'][^>]*>/i,
    `<meta name="robots" content="${DEFAULT_INDEX_ROBOTS}">`,
  );
  next = replaceMetaTag(
    next,
    /<link\s+rel=["']canonical["'][^>]*>/i,
    `<link rel="canonical" href="${escapeHtml(canonicalUrl)}">`,
  );
  next = replaceMetaTag(
    next,
    /<meta\s+property=["']og:type["'][^>]*>/i,
    '<meta property="og:type" content="article">',
  );
  next = replaceMetaTag(
    next,
    /<meta\s+property=["']og:title["'][^>]*>/i,
    `<meta property="og:title" content="${escapeHtml(articleSeo.title)}">`,
  );
  next = replaceMetaTag(
    next,
    /<meta\s+property=["']og:description["'][^>]*>/i,
    `<meta property="og:description" content="${escapeHtml(articleSeo.description)}">`,
  );
  next = replaceMetaTag(
    next,
    /<meta\s+property=["']og:url["'][^>]*>/i,
    `<meta property="og:url" content="${escapeHtml(canonicalUrl)}">`,
  );
  next = replaceMetaTag(
    next,
    /<meta\s+property=["']og:image["'][^>]*>/i,
    `<meta property="og:image" content="${escapeHtml(articleSeo.image)}">`,
  );
  next = replaceMetaTag(
    next,
    /<meta\s+property=["']og:image:secure_url["'][^>]*>/i,
    `<meta property="og:image:secure_url" content="${escapeHtml(articleSeo.image)}">`,
  );
  next = replaceMetaTag(
    next,
    /<meta\s+property=["']og:image:type["'][^>]*>/i,
    `<meta property="og:image:type" content="${escapeHtml(articleSeo.imageType)}">`,
  );
  next = replaceMetaTag(
    next,
    /<meta\s+property=["']og:image:width["'][^>]*>/i,
    `<meta property="og:image:width" content="${articleSeo.imageWidth}">`,
  );
  next = replaceMetaTag(
    next,
    /<meta\s+property=["']og:image:height["'][^>]*>/i,
    `<meta property="og:image:height" content="${articleSeo.imageHeight}">`,
  );
  if (articleSeo.imageAlt) {
    next = replaceMetaTag(
      next,
      /<meta\s+property=["']og:image:alt["'][^>]*>/i,
      `<meta property="og:image:alt" content="${escapeHtml(articleSeo.imageAlt)}">`,
    );
  }
  next = replaceMetaTag(
    next,
    /<meta\s+name=["']twitter:card["'][^>]*>/i,
    '<meta name="twitter:card" content="summary_large_image">',
  );
  next = replaceMetaTag(
    next,
    /<meta\s+name=["']twitter:title["'][^>]*>/i,
    `<meta name="twitter:title" content="${escapeHtml(articleSeo.title)}">`,
  );
  next = replaceMetaTag(
    next,
    /<meta\s+name=["']twitter:description["'][^>]*>/i,
    `<meta name="twitter:description" content="${escapeHtml(articleSeo.description)}">`,
  );
  next = replaceMetaTag(
    next,
    /<meta\s+name=["']twitter:image["'][^>]*>/i,
    `<meta name="twitter:image" content="${escapeHtml(articleSeo.image)}">`,
  );
  if (articleSeo.imageAlt) {
    next = replaceMetaTag(
      next,
      /<meta\s+name=["']twitter:image:alt["'][^>]*>/i,
      `<meta name="twitter:image:alt" content="${escapeHtml(articleSeo.imageAlt)}">`,
    );
  }

  if (articleSeo.datePublished) {
    next = replaceMetaTag(
      next,
      /<meta\s+property=["']article:published_time["'][^>]*>/i,
      `<meta property="article:published_time" content="${escapeHtml(articleSeo.datePublished)}">`,
    );
  }
  if (articleSeo.dateModified) {
    next = replaceMetaTag(
      next,
      /<meta\s+property=["']article:modified_time["'][^>]*>/i,
      `<meta property="article:modified_time" content="${escapeHtml(articleSeo.dateModified)}">`,
    );
  }
  if (articleSeo.authorName) {
    next = replaceMetaTag(
      next,
      /<meta\s+property=["']article:author["'][^>]*>/i,
      `<meta property="article:author" content="${escapeHtml(articleSeo.authorName)}">`,
    );
  }
  if (articleSeo.articleSection) {
    next = replaceMetaTag(
      next,
      /<meta\s+property=["']article:section["'][^>]*>/i,
      `<meta property="article:section" content="${escapeHtml(articleSeo.articleSection)}">`,
    );
  }

  return next;
};

const processRouteHtml = (html, routePath, preloadedApiPayload) => {
  const normalizedRoute = normalizePath(routePath || "/");
  let nextHtml = applySeoToHtml(html, normalizedRoute);
  nextHtml = applyNewsArticleSeoToHtml(
    nextHtml,
    normalizedRoute,
    preloadedApiPayload,
  );
  nextHtml = injectStructuredData(
    nextHtml,
    normalizedRoute,
    preloadedApiPayload,
  );

  if (preloadedApiPayload) {
    nextHtml = injectPreloadedPayload(nextHtml, preloadedApiPayload);
  }

  nextHtml = injectCompareRouteContent(
    nextHtml,
    normalizedRoute,
    preloadedApiPayload,
  );

  nextHtml = injectNewsRouteContent(
    nextHtml,
    normalizedRoute,
    preloadedApiPayload,
  );

  nextHtml = injectListingRouteContent(
    nextHtml,
    normalizedRoute,
    preloadedApiPayload,
  );

  nextHtml = injectProductRouteContent(nextHtml, normalizedRoute);

  nextHtml = injectPublicStaticRouteContent(nextHtml, normalizedRoute);

  return nextHtml;
};

const resolvePrerenderRoutePath = (renderedRoute) => {
  if (
    renderedRoute &&
    Object.prototype.hasOwnProperty.call(renderedRoute, "originalRoute")
  ) {
    return normalizePath(renderedRoute.originalRoute || "/");
  }

  return normalizePath(renderedRoute?.route || "/");
};

const usesSharedPreloadedPayload = (canonicalPath = "/") =>
  PRELOAD_CANONICAL_PATHS.has(canonicalPath) ||
  SMARTPHONE_FILTER_ROUTE_PATHS.has(canonicalPath) ||
  canonicalPath.startsWith("/tvs/features/") ||
  Boolean(
    parseSmartphoneListingPath(canonicalPath)?.canonicalPath &&
    canonicalPath !== "/smartphones",
  ) ||
  canonicalPath === "/compare";

export default defineConfig(async () => {
  const prerenderRoutes = await getPrerenderRoutes();
  syncPublicSitemap(prerenderRoutes);
  syncPublicNewsSitemap();
  const sharedPreloadedApiPayload = await fetchPreloadedApiPayload();
  const detailWidgetContextMap = buildDetailWidgetContextMap(
    sharedPreloadedApiPayload,
  );
  const routePayloadCache = new Map();
  const getPreloadedPayloadForRoute = async (routePath) => {
    const canonicalPath = toCanonicalPath(normalizePath(routePath || "/"));
    if (routePayloadCache.has(canonicalPath)) {
      return routePayloadCache.get(canonicalPath);
    }

    const sharedPayload = usesSharedPreloadedPayload(canonicalPath)
      ? sharedPreloadedApiPayload
      : null;
    const routeSpecificPayload = await fetchRouteSpecificPreloadedPayload(
      canonicalPath,
      detailWidgetContextMap,
      sharedPreloadedApiPayload,
    );
    const mergedPayload = mergePreloadedPayloads(
      sharedPayload,
      routeSpecificPayload,
    );

    if (
      canonicalPath.startsWith("/compare/") &&
      !getComparePageFromPayload(canonicalPath, mergedPayload)
    ) {
      throw new Error(
        `[compare-prerender] Refusing to emit ${canonicalPath} because its canonical comparison payload is unavailable.`,
      );
    }

    routePayloadCache.set(canonicalPath, mergedPayload);
    return mergedPayload;
  };
  const processHtml = (html, routePath, payload) =>
    processRouteHtml(html, routePath, payload);

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: "hooks-route-seo-dev",
        apply: "serve",
        async transformIndexHtml(html, ctx) {
          const rawPath = String(ctx?.path || ctx?.url || "/")
            .split("?")[0]
            .split("#")[0];
          const payload = await getPreloadedPayloadForRoute(rawPath || "/");
          return processHtml(html, rawPath || "/", payload);
        },
      },
      createStaticRouteHtmlPlugin({
        routes: prerenderRoutes,
        getPreloadedPayloadForRoute,
        processHtml,
      }),
      createSitemapPlugin(prerenderRoutes),
      createNewsSitemapPlugin(),
    ],
    server: {
      port: 3000,
      host: true,
    },
    base: "/",
  };
});
