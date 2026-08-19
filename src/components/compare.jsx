// src/components/compare.jsx
import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  FaBatteryFull,
  FaBluetoothB,
  FaBolt,
  FaCalendarAlt,
  FaCamera,
  FaChartBar,
  FaChevronLeft,
  FaChevronRight,
  FaChevronDown,
  FaCube,
  FaDesktop,
  FaFilter,
  FaHeadphones,
  FaHdd,
  FaInfoCircle,
  FaMagic,
  FaMemory,
  FaMicrochip,
  FaMobileAlt,
  FaPage4,
  FaPlus,
  FaRobot,
  FaRulerCombined,
  FaSearch,
  FaShareAlt,
  FaSignal,
  FaShieldAlt,
  FaStar,
  FaStore,
  FaTrophy,
  FaSun,
  FaTachometerAlt,
  FaTimes,
  FaTrash,
  FaWifi,
  FaWeightHanging,
} from "react-icons/fa";
import "../styles/hideScrollbar.css";
import "../styles/compare-studio.css";
import useDevice from "../hooks/useDevice";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import normalizeProduct from "../utils/normalizeProduct";
import { Helmet } from "react-helmet-async";
import {
  createWebApplicationSchema,
  createItemListSchema,
  createProductSchema,
} from "../utils/schemaGenerators";
import { buildListSeoKeywords } from "../utils/seoKeywordBuilder";
import { normalizeSeoTitle } from "../utils/seoTitle";
import { toCanonicalPageUrl } from "../utils/publicUrl";
import { readPreloadedApiResponse } from "../utils/preloadedApi";
import { buildCanonicalComparePathFromDevices } from "../utils/compareRoutes";
import { normalizeApiBaseUrl } from "../utils/apiUrl";

const Search = FaSearch;
const X = FaTimes;
const Cpu = FaMicrochip;
const Camera = FaCamera;
const Battery = FaBatteryFull;
const Wifi = FaWifi;
const Smartphone = FaMobileAlt;
const Monitor = FaDesktop;
const Zap = FaBolt;
const Headphones = FaHeadphones;
const ChevronRight = FaChevronRight;
const ChevronDown = FaChevronDown;
const Plus = FaPlus;
const Trash2 = FaTrash;
const BarChart3 = FaChartBar;
const Star = FaStar;
const ChevronLeft = FaChevronLeft;
const Sparkles = FaMagic;
const Filter = FaFilter;
const Share2 = FaShareAlt;
const Info = FaInfoCircle;
const Calendar = FaCalendarAlt;
const Cube = FaCube;
const Ruler = FaRulerCombined;
const Weight = FaWeightHanging;
const Shield = FaShieldAlt;
const Memory = FaMemory;
const Storage = FaHdd;
const Sun = FaSun;
const Bluetooth = FaBluetoothB;
const Gauge = FaTachometerAlt;
const Signal = FaSignal;
const Bot = FaRobot;

const SECTIONS = [
  {
    id: "overview",
    label: "Overview",
    icon: Smartphone,
    color: "blue",
  },
  {
    id: "display",
    label: "Display",
    icon: Monitor,
    color: "sky",
  },
  {
    id: "performance",
    label: "Performance",
    icon: Cpu,
    color: "emerald",
  },
  {
    id: "camera",
    label: "Camera",
    icon: Camera,
    color: "blue",
  },
  {
    id: "battery",
    label: "Battery",
    icon: Battery,
    color: "amber",
  },
  {
    id: "network",
    label: "Connectivity",
    icon: Signal,
    color: "cyan",
  },
  {
    id: "audio",
    label: "Audio",
    icon: Headphones,
    color: "teal",
  },
  {
    id: "build_design",
    label: "Build & Design",
    icon: Cube,
    color: "slate",
  },
  {
    id: "features",
    label: "Features",
    icon: Bot,
    color: "orange",
  },
];

const SECTION_ICON_BY_ID = Object.freeze(
  Object.fromEntries(SECTIONS.map((section) => [section.id, section.icon])),
);

const SECTION_SPEC_ORDER = Object.freeze({
  overview: [
    "launchdate",
    "releasedate",
    "body",
    "dimensions",
    "weight",
    "iprating",
  ],
  display: [
    "displaytype",
    "screensize",
    "displaysize",
    "resolution",
    "refreshrate",
    "peakbrightness",
    "brightness",
    "protection",
  ],
  performance: [
    "chipset",
    "processor",
    "cpu",
    "gpu",
    "ram",
    "memory",
    "storage",
    "storageoptions",
    "os",
    "operatingsystem",
  ],
  camera: [
    "maincamera",
    "rearcamera",
    "ultrawide",
    "ultrawidecamera",
    "telephoto",
    "periscope",
    "frontcamera",
    "videorecording",
  ],
  battery: [
    "batterycapacity",
    "capacity",
    "wiredcharging",
    "charging",
    "wirelesscharging",
    "reversewirelesscharging",
  ],
  network: ["5g", "wifi", "bluetooth", "nfc", "usb", "sim"],
  audio: ["speakers", "audiojack", "microphone", "dolbyatmos"],
  build_design: [
    "protection",
    "durability",
    "waterdustresistance",
    "designfeatures",
    "materials",
  ],
  features: ["aifeatures", "sensors", "specialfeatures", "features"],
});

const SECTION_COLOR_CLASSES = Object.freeze({
  overview: "text-blue-600",
  display: "text-sky-600",
  camera: "text-blue-500",
  performance: "text-emerald-500",
  battery: "text-amber-500",
  network: "text-cyan-500",
  audio: "text-teal-500",
  build_design: "text-slate-500",
  features: "text-orange-500",
});

const SPEC_ROW_ICONS = Object.freeze({
  launch_date: Calendar,
  release_date: Calendar,
  body: Cube,
  dimensions: Ruler,
  weight: Weight,
  ip_rating: Shield,
  display_type: Monitor,
  resolution: Monitor,
  refresh_rate: Gauge,
  peak_brightness: Sun,
  brightness: Sun,
  protection: Shield,
  processor: Cpu,
  chipset: Cpu,
  ram: Memory,
  memory: Memory,
  storage: Storage,
  storage_options: Storage,
  os: Bot,
  operating_system: Bot,
  battery_capacity: Battery,
  capacity: Battery,
  wired_charging: Zap,
  charging: Zap,
  wireless_charging: Zap,
  main_camera: Camera,
  rear_camera: Camera,
  ultra_wide: Camera,
  ultra_wide_camera: Camera,
  telephoto: Camera,
  periscope: Camera,
  front_camera: Camera,
  video_recording: Camera,
  "5g": Signal,
  wifi: Wifi,
  wi_fi: Wifi,
  bluetooth: Bluetooth,
  nfc: Signal,
  durability: Shield,
  water_dust_resistance: Shield,
  design_features: Cube,
  ai_features: Bot,
  sensors: Smartphone,
});

const COMPARE_VIEW_TABS = [
  { id: "performance", label: "Performance", icon: Cpu, target: "processor" },
  { id: "display", label: "Display", icon: Monitor, target: "display" },
  { id: "camera", label: "Camera", icon: Camera, target: "camera" },
  { id: "battery", label: "Battery", icon: Battery, target: "battery" },
  {
    id: "connectivity",
    label: "Connectivity",
    icon: Signal,
    target: "network",
  },
  { id: "all", label: "All Specs", icon: BarChart3, target: "key" },
];

const MAX_DEVICES = 4;
const MIN_DEVICES = 2;
const SITE_ORIGIN = "https://tryhook.shop";
const resolveCompareApiBase = () => {
  const configured = String(import.meta.env.VITE_API_BASE_URL || "").trim();
  if (configured) return normalizeApiBaseUrl(configured);

  if (typeof window !== "undefined") {
    const hostname = window.location?.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://localhost:5000/api";
    }
  }

  return "https://api.apisphere.in/api";
};
const API_BASE = resolveCompareApiBase();
const COMPARE_PAGE_RESOLVE_ENDPOINT = `${API_BASE}/public/compare-pages/resolve`;

const normalizeLaunchStage = (value) => {
  if (!value) return null;
  const text = String(value).trim().toLowerCase();
  if (!text) return null;
  if (/rumou?r/.test(text)) return "rumored";
  if (/announce/.test(text)) return "announced";
  if (/(upcoming|coming soon|expected|scheduled)/i.test(text))
    return "upcoming";
  if (/(available|on sale|in stock)/i.test(text)) return "available";
  if (/(released|launched|out now)/i.test(text)) return "released";
  return null;
};

const parseDateOnly = (value) => {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const d = new Date(`${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}T00:00:00`);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  parsed.setHours(0, 0, 0, 0);
  return parsed;
};

const resolveSaleStartDate = (device) => {
  if (!device) return null;
  const direct = parseDateOnly(
    device.sale_start_date ||
      device.saleStartDate ||
      device.sale_date ||
      device.saleDate ||
      null,
  );
  if (direct) return direct;

  const storePrices = Array.isArray(device.storePrices)
    ? device.storePrices
    : Array.isArray(device.store_prices)
      ? device.store_prices
      : [];
  for (const store of storePrices) {
    const storeDate = parseDateOnly(
      store?.sale_start_date ||
        store?.saleStartDate ||
        store?.sale_date ||
        store?.saleDate ||
        store?.available_from ||
        store?.availableFrom ||
        null,
    );
    if (storeDate) return storeDate;
  }

  const variants = Array.isArray(device.variants)
    ? device.variants
    : Array.isArray(device.variants_json)
      ? device.variants_json
      : [];
  for (const variant of variants) {
    const variantDate = parseDateOnly(
      variant?.sale_start_date ||
        variant?.saleStartDate ||
        variant?.sale_date ||
        variant?.saleDate ||
        null,
    );
    if (variantDate) return variantDate;
    const stores = Array.isArray(variant?.store_prices)
      ? variant.store_prices
      : Array.isArray(variant?.storePrices)
        ? variant.storePrices
        : [];
    for (const store of stores) {
      const storeDate = parseDateOnly(
        store?.sale_start_date ||
          store?.saleStartDate ||
          store?.sale_date ||
          store?.saleDate ||
          store?.available_from ||
          store?.availableFrom ||
          null,
      );
      if (storeDate) return storeDate;
    }
  }
  return null;
};

const collectStoreRows = (device) => {
  const rows = [];
  if (Array.isArray(device?.store_prices)) rows.push(...device.store_prices);
  if (Array.isArray(device?.storePrices)) rows.push(...device.storePrices);
  const variants = Array.isArray(device?.variants)
    ? device.variants
    : Array.isArray(device?.variants_json)
      ? device.variants_json
      : [];
  for (const variant of variants) {
    if (Array.isArray(variant?.store_prices))
      rows.push(...variant.store_prices);
    if (Array.isArray(variant?.storePrices)) rows.push(...variant.storePrices);
  }
  return rows.filter(Boolean);
};

const hasStoreEntrySignal = (store) =>
  Boolean(
    store?.price ||
    store?.url ||
    store?.store ||
    store?.store_name ||
    store?.storeName ||
    store?.display_store_name ||
    store?.sale_start_date ||
    store?.saleStartDate,
  );

const resolveLaunchStage = (device) => {
  if (!device) return null;
  const saleStart = resolveSaleStartDate(device);
  if (saleStart) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return saleStart > today ? "upcoming" : "available";
  }

  if (!collectStoreRows(device).some(hasStoreEntrySignal)) return "upcoming";

  return "available";
};

const getCompareLimitForStage = (stage) => {
  if (stage === "upcoming") return 0;
  if (stage === "rumored") return 0;
  if (stage === "announced") return 2;
  return MAX_DEVICES;
};

const resolveComparePolicy = (device) => {
  const allowCompareRaw = device?.allowCompare ?? device?.allow_compare ?? null;
  const compareLimitRaw = Number(
    device?.compareLimit ?? device?.compare_limit ?? NaN,
  );
  const stage = resolveLaunchStage(device);
  const allowCompare =
    typeof allowCompareRaw === "boolean"
      ? allowCompareRaw
      : stage !== "rumored" && stage !== "upcoming";
  const fallbackLimit = getCompareLimitForStage(stage);
  const compareLimit = Number.isFinite(compareLimitRaw)
    ? compareLimitRaw
    : fallbackLimit;

  return {
    allowCompare,
    compareLimit: allowCompare ? compareLimit : 0,
  };
};

const getCompareLimitForDevices = (devices = []) => {
  return (Array.isArray(devices) ? devices : []).reduce((limit, device) => {
    const policy = resolveComparePolicy(device);
    const deviceLimit = Number.isFinite(policy.compareLimit)
      ? policy.compareLimit
      : limit;
    return Math.min(limit, deviceLimit);
  }, MAX_DEVICES);
};

const normalizeVariantIndex = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
};

const isDigitsOnly = (value = "") => /^\d+$/.test(String(value || "").trim());

const dedupeCompareEntries = (entries = []) => {
  const seen = new Set();
  const output = [];
  for (const entry of entries) {
    const baseId = String(entry?.baseId || "").trim();
    if (!baseId) continue;
    const variantIndex = normalizeVariantIndex(entry?.variantIndex ?? 0);
    const key = `${baseId}:${variantIndex}`;
    if (seen.has(key)) continue;
    seen.add(key);
    output.push({ baseId, variantIndex });
  }
  return output;
};

const parseCompareDevicesParam = (value = "") => {
  if (!value) return [];
  const parts = String(value)
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  const entries = parts.map((part) => {
    const [baseIdRaw, variantRaw] = part.split(":");
    const baseId = String(baseIdRaw || "").trim();
    if (!baseId) return null;
    return {
      baseId,
      variantIndex: normalizeVariantIndex(variantRaw ?? 0),
    };
  });

  return dedupeCompareEntries(entries.filter(Boolean));
};

const decodeRouteSegment = (value = "") => {
  try {
    return decodeURIComponent(String(value || ""));
  } catch {
    return String(value || "");
  }
};

const toCompareSlug = (value = "") =>
  decodeRouteSegment(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/-price-in-india$/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const resolveLowestPriceForSeo = (device) => {
  if (!device || typeof device !== "object") return null;
  const direct = Number(
    device.price ??
      device.base_price ??
      device.basePrice ??
      device.numericPrice,
  );
  const directPrice = Number.isFinite(direct) && direct > 0 ? direct : null;

  const variants = Array.isArray(device.variants) ? device.variants : [];
  const variantPrice = variants.reduce((lowest, variant) => {
    const base = Number(
      variant?.base_price ?? variant?.price ?? variant?.basePrice,
    );
    const basePrice = Number.isFinite(base) && base > 0 ? base : null;
    const stores = Array.isArray(variant?.store_prices)
      ? variant.store_prices
      : Array.isArray(variant?.storePrices)
        ? variant.storePrices
        : [];
    const storePrice = stores.reduce((storeLowest, store) => {
      const value = Number(store?.price);
      if (!Number.isFinite(value) || value <= 0) return storeLowest;
      if (storeLowest == null) return value;
      return Math.min(storeLowest, value);
    }, null);

    const candidate =
      basePrice != null && storePrice != null
        ? Math.min(basePrice, storePrice)
        : basePrice != null
          ? basePrice
          : storePrice;

    if (candidate == null) return lowest;
    if (lowest == null) return candidate;
    return Math.min(lowest, candidate);
  }, null);

  if (directPrice != null && variantPrice != null)
    return Math.min(directPrice, variantPrice);
  return variantPrice != null ? variantPrice : directPrice;
};

const resolveSmartphoneSegmentLabel = (devices = []) => {
  const prices = (Array.isArray(devices) ? devices : [])
    .map((device) => resolveLowestPriceForSeo(device))
    .filter((value) => Number.isFinite(value) && value > 0);
  if (prices.length === 0) return "";

  const averagePrice =
    prices.reduce((sum, value) => sum + value, 0) / prices.length;
  if (averagePrice <= 10000) return "Entry";
  if (averagePrice <= 20000) return "Budget";
  if (averagePrice <= 30000) return "Lower Mid Range";
  if (averagePrice <= 45000) return "Mid Range";
  if (averagePrice <= 65000) return "Upper Mid Range";
  if (averagePrice <= 90000) return "Premium";
  if (averagePrice <= 130000) return "Flagship";
  return "Ultra Flagship";
};

const joinCompareNamesWithoutCommas = (names = []) => {
  const clean = (Array.isArray(names) ? names : [])
    .map((name) => String(name || "").trim())
    .filter(Boolean);
  if (clean.length === 0) return "";
  if (clean.length === 1) return clean[0];
  return clean.join(" and ");
};

const getCurrentMonthLongYear = () =>
  new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(
    new Date(),
  );

const buildCompareTitleText = ({
  names = [],
  segmentLabel = "",
  publishedTitle = "",
} = {}) => {
  const overridden = String(publishedTitle || "").trim();
  if (overridden) return overridden;

  const vsJoined = names.filter(Boolean).join(" vs ");
  const monthYear = getCurrentMonthLongYear();

  if (!vsJoined)
    return `Compare Smartphones, Laptops & TVs Side-by-Side (${monthYear}) | Hooks`;

  const segment = String(segmentLabel || "").trim();
  if (segment) {
    return `${vsJoined} — ${segment} Segment: Price, Specs & Comparison (${monthYear}) | Hooks`;
  }

  return `${vsJoined}: Price, Specs & Comparison in India (${monthYear}) | Hooks`;
};

const buildCompareDescriptionText = ({
  names = [],
  segmentLabel = "",
  publishedDescription = "",
} = {}) => {
  const overridden = String(publishedDescription || "").trim();
  if (overridden) return overridden;

  const joined = joinCompareNamesWithoutCommas(names);
  if (!joined) {
    return "Compare devices with latest price specifications camera battery performance and features in India. | Hooks";
  }

  const segment = String(segmentLabel || "").trim();
  if (segment) {
    return `See how ${joined} compare in the ${segment} segment on price, specifications, camera, battery, and performance in India. | Hooks`;
  }

  return `See how ${joined} compare on price, specifications, camera, battery, and performance in India. | Hooks`;
};

const sortCompareEntries = (left, right) => {
  const leftId = String(left?.baseId || "");
  const rightId = String(right?.baseId || "");

  if (isDigitsOnly(leftId) && isDigitsOnly(rightId)) {
    const diff = Number(leftId) - Number(rightId);
    if (diff !== 0) return diff;
  } else {
    const diff = leftId.localeCompare(rightId);
    if (diff !== 0) return diff;
  }

  return (
    normalizeVariantIndex(left?.variantIndex) -
    normalizeVariantIndex(right?.variantIndex)
  );
};

const stringifyCompareDevicesParam = (entries = []) =>
  dedupeCompareEntries(entries)
    .map(
      (entry) => `${entry.baseId}:${normalizeVariantIndex(entry.variantIndex)}`,
    )
    .join(",");

const upsertMetaTag = (selector, attributes) => {
  if (typeof document === "undefined") return;
  let tag = document.head.querySelector(selector);
  if (!tag) {
    tag = document.createElement("meta");
    document.head.appendChild(tag);
  }
  Object.entries(attributes || {}).forEach(([key, value]) => {
    if (value == null) return;
    tag.setAttribute(key, String(value));
  });
};

const upsertCanonicalLink = (href) => {
  if (typeof document === "undefined" || !href) return;
  let link = document.head.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.setAttribute("href", href);
};

const getResolvedProductId = (device) =>
  device?.productId ||
  device?.product_id ||
  device?.id ||
  device?.smartphoneId ||
  device?.model ||
  null;

const getResolvedProductType = (device) =>
  device?.productType || device?.deviceType || device?.product_type || null;

const SCORING_GLOSSARY = {
  chipset:
    "Chipset is the main processor family. Newer flagship tiers are scored higher.",
  refreshRate:
    "Refresh rate (Hz) means how many times screen updates per second. Higher is smoother.",
  panelType:
    "Panel type (AMOLED, OLED, IPS) affects contrast, colors, and viewing quality.",
  megapixels:
    "Main camera megapixels indicate sensor resolution. It is one factor, not full photo quality.",
  sensorCount:
    "Camera sensor count estimates lens versatility (main, ultrawide, telephoto, etc.).",
  batteryCapacity:
    "Battery capacity is measured in mAh. Larger battery usually means longer usage.",
  priceValue:
    "Value score compares spec strength against current selected variant price.",
};

const QUICK_FILTER_CHIPS = [
  { id: "all", label: "All Phones", icon: FaMobileAlt },
  { id: "aiFeatures", label: "AI Phones", icon: FaMagic },
  { id: "fiveG", label: "5G Ready", icon: FaSignal },
  { id: "highMpCamera", label: "High Camera Score", icon: FaCamera },
  { id: "longBattery", label: "Long Battery Life", icon: FaBatteryFull },
  { id: "fastCharge", label: "Fast Charging", icon: FaBolt },
];

const SEARCH_SORT_OPTIONS = [
  { id: "popularity", label: "Popularity" },
  { id: "priceAsc", label: "Price: Low to High" },
  { id: "priceDesc", label: "Price: High to Low" },
  { id: "nameAsc", label: "Name" },
];

const SEARCH_PRICE_RANGE_OPTIONS = [
  { id: "all", label: "Any price" },
  { id: "0-20000", label: "Under ₹20,000" },
  { id: "20000-40000", label: "₹20,000 to ₹40,000" },
  { id: "40000-70000", label: "₹40,000 to ₹70,000" },
  { id: "70000+", label: "Above ₹70,000" },
];

const PRODUCT_TYPE_LABELS = Object.freeze({
  smartphone: "Smartphones",
  laptop: "Laptops",
  tv: "TVs",
  tablet: "Tablets",
  audio: "Audio",
  networking: "Networking",
});

const formatProductTypeLabel = (value) => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  if (!normalized) return "All categories";
  return (
    PRODUCT_TYPE_LABELS[normalized] ||
    normalized.replace(/[_-]+/g, " ").replace(/^./, (ch) => ch.toUpperCase())
  );
};

const getDeviceLaunchYear = (device) => {
  const direct =
    parseDateOnly(
      device?.launch_date ||
        device?.launchDate ||
        device?.release_date ||
        device?.releaseDate ||
        null,
    ) || null;
  if (direct) return direct.getFullYear();

  const fallbackText = String(
    device?.launch_date ||
      device?.launchDate ||
      device?.release_date ||
      device?.releaseDate ||
      "",
  ).trim();
  const yearMatch = fallbackText.match(/\b(20\d{2})\b/);
  return yearMatch ? Number(yearMatch[1]) : null;
};

const matchesPriceRange = (price, rangeId) => {
  if (rangeId === "all") return true;
  if (!Number.isFinite(price) || price <= 0) return false;
  if (rangeId === "0-20000") return price < 20000;
  if (rangeId === "20000-40000") return price >= 20000 && price < 40000;
  if (rangeId === "40000-70000") return price >= 40000 && price < 70000;
  if (rangeId === "70000+") return price >= 70000;
  return true;
};

const EMPTY_COMPARE_INSIGHTS = Object.freeze({
  scoreVersion: "",
  productType: "",
  overallWinner: null,
  categoryWinners: {},
  warnings: [],
});

const EMPTY_COMPARE_DECISION = Object.freeze({
  generatedAt: "",
  overallVerdict: null,
  categoryVerdicts: [],
  keyDifferences: [],
  commonFeatures: [],
  upgradeStory: null,
  useCasePicks: [],
  priceVerdict: null,
  tradeoffs: [],
  confidence: null,
});

const CATEGORY_WINNER_LABELS = Object.freeze({
  performance: "Performance Lead",
  display: "Display Lead",
  camera: "Camera Lead",
  battery: "Battery Lead",
  priceValue: "Value Highlight",
  memory: "Memory Lead",
  portability: "Portability Lead",
  connectivity: "Connectivity Lead",
  smart: "Smart TV Lead",
  audio: "Audio Lead",
  gaming: "Gaming Lead",
  coverage: "Coverage Lead",
  ports: "Ports Lead",
  features: "Feature Lead",
  security: "Security Lead",
});

const SPEC_LABEL_OVERRIDES = Object.freeze({
  "5g": "5G",
  ai_features: "AI Features",
  bluetooth: "Bluetooth",
  gpu: "GPU",
  ip_rating: "IP Rating",
  nfc: "NFC",
  os: "OS",
  usb: "USB",
  water_dust_resistance: "Water/Dust Resistance",
  wifi: "Wi-Fi",
  wi_fi: "Wi-Fi",
});

const formatNaturalList = (items) => {
  const values = Array.from(
    new Set(
      (items || []).map((item) => String(item || "").trim()).filter(Boolean),
    ),
  );
  if (values.length === 0) return "";
  if (values.length === 1) return values[0];
  if (values.length === 2) return `${values[0]} and ${values[1]}`;
  return `${values.slice(0, -1).join(", ")}, and ${values[values.length - 1]}`;
};

const normalizeCategorySummaryLabel = (label, key) => {
  const base = String(label || key || "")
    .replace(/\s+(Lead|Highlight)$/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!base) return "";
  return `${base.charAt(0).toLowerCase()}${base.slice(1)}`;
};

const lowerFirst = (value) => {
  const text = String(value || "").trim();
  if (!text) return "";
  return `${text.charAt(0).toLowerCase()}${text.slice(1)}`;
};

const formatSpecScoreLabel = (score) => {
  if (score == null || !Number.isFinite(score)) return null;
  return `${score.toFixed(1)}%`;
};

const MobileCompare = () => {
  const [selectedDevices, setSelectedDevices] = useState([]);
  const [comparedDevices, setComparedDevices] = useState([]);
  const [variantSelection, setVariantSelection] = useState({});
  const [rankingByDeviceId, setRankingByDeviceId] = useState({});
  const [compareInsights, setCompareInsights] = useState(
    EMPTY_COMPARE_INSIGHTS,
  );
  const [compareInsightsLoading, setCompareInsightsLoading] = useState(false);
  const [compareDecision, setCompareDecision] = useState(
    EMPTY_COMPARE_DECISION,
  );
  const [activeDecisionQuestion, setActiveDecisionQuestion] =
    useState("overall");
  const [activeStudioView, setActiveStudioView] = useState("performance");
  const [activeMobilePair, setActiveMobilePair] = useState("0-1");
  const [expandedStudioSections, setExpandedStudioSections] = useState(() =>
    Object.fromEntries(
      [
        "key",
        "general",
        "display",
        "body",
        "processor",
        "battery",
        "camera",
        "network",
        "features",
        "audio",
      ].map((sectionId) => [
        sectionId,
        ["key", "processor", "battery", "camera"].includes(sectionId),
      ]),
    ),
  );
  const [expandedSections, setExpandedSections] = useState(() =>
    Object.fromEntries(SECTIONS.map((section) => [section.id, true])),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSort, setSearchSort] = useState("popularity");
  const [catalogCategoryFilter, setCatalogCategoryFilter] = useState("all");
  const [catalogBrandFilter, setCatalogBrandFilter] = useState("all");
  const [catalogPriceFilter, setCatalogPriceFilter] = useState("all");
  const [catalogReleaseYearFilter, setCatalogReleaseYearFilter] =
    useState("all");
  const [catalogVisibleCount, setCatalogVisibleCount] = useState(6);
  const [isComparing, setIsComparing] = useState(false);
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [activeCatalogSlot, setActiveCatalogSlot] = useState(0);
  const [sharedDescription, setSharedDescription] = useState("");
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [modalDevice, setModalDevice] = useState(null);
  const [modalSection, setModalSection] = useState("specifications");
  const [trendSignalsByProductId, setTrendSignalsByProductId] = useState({});
  const [compareSignalsByProductId, setCompareSignalsByProductId] = useState(
    {},
  );
  const [signalsFetched, setSignalsFetched] = useState(false);
  const [activeQuickFilter, setActiveQuickFilter] = useState("all");
  const [hideCommonSpecs, setHideCommonSpecs] = useState(false);
  const [showStickyCompareBar, setShowStickyCompareBar] = useState(false);
  const searchResultsRef = useRef(null);
  const catalogSearchInputRef = useRef(null);
  const comparisonHeroRef = useRef(null);

  const {
    devices: availableDevices = [],
    loading,
    getDevice,
  } = useDevice({
    resources: ["smartphones", "networking", "laptops", "tvs"],
  });
  const location = useLocation();
  const navigate = useNavigate();
  const { compareSlug = "" } = useParams();
  const normalizedCompareSlug = String(compareSlug || "").trim();
  const publishedCompareEndpoint = normalizedCompareSlug
    ? `${COMPARE_PAGE_RESOLVE_ENDPOINT}?slug=${encodeURIComponent(
        normalizedCompareSlug,
      )}`
    : "";
  const [publishedComparePage, setPublishedComparePage] = useState(() => {
    const preloaded = publishedCompareEndpoint
      ? readPreloadedApiResponse(publishedCompareEndpoint)
      : null;
    return preloaded?.page || null;
  });
  const [publishedCompareLoading, setPublishedCompareLoading] = useState(() =>
    Boolean(
      publishedCompareEndpoint &&
      !readPreloadedApiResponse(publishedCompareEndpoint),
    ),
  );
  const isSeoCompareRoute = Boolean(normalizedCompareSlug);

  const activeDevices = isComparing ? comparedDevices : selectedDevices;

  useEffect(() => {
    if (
      !isComparing ||
      activeDevices.length < MIN_DEVICES ||
      typeof IntersectionObserver === "undefined" ||
      !comparisonHeroRef.current
    ) {
      setShowStickyCompareBar(false);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyCompareBar(!entry.isIntersecting),
      {
        threshold: 0.04,
        rootMargin: "-96px 0px 0px 0px",
      },
    );

    observer.observe(comparisonHeroRef.current);
    return () => observer.disconnect();
  }, [isComparing, activeDevices.length]);

  const maxDevices = useMemo(() => {
    const typeSource = isComparing ? comparedDevices : selectedDevices;
    const compareType = getResolvedProductType(typeSource?.[0]);
    if (compareType !== "smartphone") return MAX_DEVICES;
    return getCompareLimitForDevices(typeSource);
  }, [isComparing, comparedDevices, selectedDevices]);
  const usedSlots = isComparing
    ? comparedDevices.length + selectedDevices.length
    : selectedDevices.length;
  const visibleRemainingSlots = Math.max(0, maxDevices - activeDevices.length);
  const compareSlotCount = Math.max(1, maxDevices, activeDevices.length);
  const emptyCompareSlotCount = Math.max(
    0,
    compareSlotCount - activeDevices.length,
  );
  const selectedSetupProgress = maxDevices
    ? Math.min(100, Math.round((activeDevices.length / maxDevices) * 100))
    : 0;
  const catalogLockedType = getResolvedProductType(
    (isComparing && comparedDevices.length > 0
      ? comparedDevices
      : selectedDevices)?.[0],
  );
  const activeDeviceIdSet = useMemo(
    () =>
      new Set(
        activeDevices
          .map((device) => getResolvedProductId(device) ?? device?.id)
          .filter((value) => value != null)
          .map((value) => String(value)),
      ),
    [activeDevices],
  );

  const openCatalogPanel = (_slotIndex = activeDevices.length) => {
    const safeSlot = Math.max(
      0,
      Math.min(activeDevices.length, maxDevices - 1),
    );
    setActiveCatalogSlot(safeSlot);
    setSearchQuery("");
    setShowCatalogModal(true);
    requestAnimationFrame(() => {
      catalogSearchInputRef.current?.focus();
    });
  };

  const closeCatalogModal = () => {
    setShowCatalogModal(false);
    setSearchQuery("");
  };

  const startComparison = () => {
    if (activeDevices.length < MIN_DEVICES) return;

    if (!isComparing) {
      setComparedDevices(selectedDevices.slice(0, maxDevices));
      setSelectedDevices([]);
      setIsComparing(true);
    }

    closeCatalogModal();
    if (typeof document === "undefined") return;
    requestAnimationFrame(() => {
      document
        .getElementById("compare-spec-workspace")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const getDeviceRankingKeys = (device) =>
    [
      device?.id,
      device?.productId,
      device?.product_id,
      getResolvedProductId(device),
    ]
      .filter((entry) => entry != null)
      .map((entry) => String(entry));

  const getServerScoreEntry = (device) => {
    const keys = getDeviceRankingKeys(device);
    for (const key of keys) {
      const entry = rankingByDeviceId?.[key];
      if (entry) return entry;
    }
    return null;
  };

  const overallWinnerId =
    compareInsights?.overallWinner?.product_id != null
      ? String(compareInsights.overallWinner.product_id)
      : "";

  useEffect(() => {
    if (selectedDevices.length > maxDevices) {
      setSelectedDevices((prev) => prev.slice(0, maxDevices));
    }
    if (comparedDevices.length > maxDevices) {
      setComparedDevices((prev) => prev.slice(0, maxDevices));
    }
  }, [maxDevices, selectedDevices.length, comparedDevices.length]);

  useEffect(() => {
    if (!showCatalogModal || typeof document === "undefined") return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setShowCatalogModal(false);
        setSearchQuery("");
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showCatalogModal]);

  const productLookupById = useMemo(() => {
    const lookup = new Map();
    (availableDevices || []).forEach((device) => {
      const resolvedId = String(getResolvedProductId(device) || "").trim();
      if (!resolvedId || lookup.has(resolvedId)) return;
      lookup.set(resolvedId, {
        id: resolvedId,
        name: device?.name || device?.model || device?.title || "",
        type: getResolvedProductType(device) || "",
      });
    });
    return lookup;
  }, [availableDevices]);

  const categoryWinnerEntries = useMemo(
    () =>
      Object.entries(compareInsights?.categoryWinners || {})
        .map(([key, winner]) => ({
          key,
          summaryLabel: normalizeCategorySummaryLabel(
            CATEGORY_WINNER_LABELS[key] ||
              String(key || "")
                .replace(/([A-Z])/g, " $1")
                .replace(/[_-]+/g, " ")
                .replace(/\s+/g, " ")
                .trim()
                .replace(/^./, (ch) => ch.toUpperCase()),
            key,
          ),
          winner,
        }))
        .filter(({ winner }) => winner?.product_id != null),
    [compareInsights?.categoryWinners],
  );

  const comparisonRecommendationText = useMemo(() => {
    const recommendationName =
      compareInsights?.overallWinner?.product_name || "";
    if (!recommendationName) return "";

    const rawReason = String(
      compareInsights?.overallWinner?.reason || "",
    ).trim();
    const reasonCore = rawReason.replace(/[.!?]+$/, "");
    const intro = `For this comparison, ${recommendationName} looks like the most well-rounded choice overall.`;
    const reasonSentence = reasonCore
      ? `Its advantage here comes from ${lowerFirst(reasonCore)}.`
      : "";

    const overallWinnerKey = String(
      compareInsights?.overallWinner?.product_id ?? overallWinnerId ?? "",
    );
    const categoryGroups = categoryWinnerEntries.reduce((acc, entry) => {
      const productKey = String(
        entry?.winner?.product_id ?? entry?.winner?.product_name ?? "",
      ).trim();
      if (!productKey || !entry?.summaryLabel) return acc;

      if (!acc[productKey]) {
        acc[productKey] = {
          productName: entry?.winner?.product_name || "This device",
          categories: [],
        };
      }

      acc[productKey].categories.push(entry.summaryLabel);
      return acc;
    }, {});

    const overallLeadCategories =
      (overallWinnerKey && categoryGroups[overallWinnerKey]?.categories) || [];
    const overallLeadSentence = overallLeadCategories.length
      ? `Its strongest areas in this lineup are ${formatNaturalList(
          overallLeadCategories,
        )}.`
      : "";

    const supportingLeaderSentences = Object.entries(categoryGroups)
      .filter(([productKey]) => productKey !== overallWinnerKey)
      .map(([, entry]) => {
        const categories = formatNaturalList(entry.categories);
        if (!categories || !entry?.productName) return "";
        return `${entry.productName} is the stronger alternative if your focus is ${categories}.`;
      })
      .filter(Boolean);

    return [
      intro,
      reasonSentence,
      overallLeadSentence,
      ...supportingLeaderSentences,
      "This summary updates automatically whenever you change devices or variants.",
    ]
      .filter(Boolean)
      .join(" ");
  }, [compareInsights?.overallWinner, categoryWinnerEntries, overallWinnerId]);

  const comparisonRecommendationPoints = useMemo(() => {
    const winner = compareInsights?.overallWinner;
    if (!winner?.product_name) return [];

    const rawReason = String(winner.reason || "")
      .trim()
      .replace(/[.!?]+$/, "");
    const winnerKey = String(winner.product_id ?? overallWinnerId ?? "").trim();

    const winnerCategories = categoryWinnerEntries
      .filter(({ winner: categoryWinner }) => {
        const productKey = String(
          categoryWinner?.product_id ?? categoryWinner?.product_name ?? "",
        ).trim();
        return productKey && productKey === winnerKey;
      })
      .map((entry) => entry.summaryLabel)
      .filter(Boolean);

    const competitorHighlight = categoryWinnerEntries.find(
      ({ winner: categoryWinner }) => {
        const productKey = String(
          categoryWinner?.product_id ?? categoryWinner?.product_name ?? "",
        ).trim();
        return productKey && productKey !== winnerKey;
      },
    );

    return [
      rawReason
        ? `${winner.product_name} stands out for ${lowerFirst(rawReason)}.`
        : "",
      winnerCategories.length
        ? `Strongest areas in this set: ${formatNaturalList(winnerCategories)}.`
        : "",
      competitorHighlight?.winner?.product_name &&
      competitorHighlight?.summaryLabel
        ? `${competitorHighlight.winner.product_name} is the better pick if your priority is ${competitorHighlight.summaryLabel}.`
        : "",
    ].filter(Boolean);
  }, [categoryWinnerEntries, compareInsights?.overallWinner, overallWinnerId]);

  const toCompareSelectedEntry = (base, variantIndex = 0) => {
    if (!base) return null;
    const typeVal =
      base.productType || base.deviceType || base.product_type || "";
    const normalized = normalizeProduct(base, typeVal);
    const deviceObj = { ...base, ...normalized };
    const resolvedProductId =
      deviceObj.productId ?? deviceObj.product_id ?? deviceObj.id ?? null;
    if (resolvedProductId == null) return null;

    const resolvedType =
      deviceObj.productType ||
      deviceObj.deviceType ||
      deviceObj.product_type ||
      null;
    const resolvedName =
      deviceObj.name || deviceObj.model || deviceObj.title || null;

    return {
      ...deviceObj,
      id: `${resolvedProductId}`,
      productId: resolvedProductId,
      baseId: resolvedProductId,
      productType: resolvedType,
      name: resolvedName,
      selectedVariantIndex: normalizeVariantIndex(variantIndex),
    };
  };

  useEffect(() => {
    if (!publishedCompareEndpoint) {
      setPublishedComparePage(null);
      setPublishedCompareLoading(false);
      return;
    }

    const preloaded = readPreloadedApiResponse(publishedCompareEndpoint);
    if (preloaded?.page) {
      setPublishedComparePage(preloaded.page);
      setPublishedCompareLoading(false);
      return;
    }

    let cancelled = false;
    const run = async () => {
      setPublishedCompareLoading(true);
      try {
        const response = await fetch(publishedCompareEndpoint);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (!cancelled) {
          setPublishedComparePage(data?.page || null);
        }
      } catch {
        if (!cancelled) {
          setPublishedComparePage(null);
        }
      } finally {
        if (!cancelled) {
          setPublishedCompareLoading(false);
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [publishedCompareEndpoint]);

  const routeDeviceEntries = useMemo(() => {
    if (
      publishedComparePage?.items &&
      Array.isArray(publishedComparePage.items) &&
      publishedComparePage.items.length >= 2
    ) {
      return dedupeCompareEntries(
        publishedComparePage.items.map((item) => ({
          baseId: String(item?.product_id || "").trim(),
          variantIndex: 0,
        })),
      );
    }

    if (
      !normalizedCompareSlug ||
      !Array.isArray(availableDevices) ||
      availableDevices.length === 0
    ) {
      return [];
    }

    let matchedLeft = null;
    let matchedDevices = [];

    const legacyVsMatch = normalizedCompareSlug.match(/^(.+)-vs-(.+)$/i);
    const nameParts = legacyVsMatch
      ? [legacyVsMatch[1], legacyVsMatch[2]]
      : normalizedCompareSlug.endsWith("-comparison")
        ? normalizedCompareSlug
            .replace(/-comparison$/i, "")
            .split("-and-")
            .filter(Boolean)
        : [];

    if (nameParts.length < 2) return [];

    const getDeviceSlug = (device) =>
      toCompareSlug(device?.name || device?.model || device?.title || "");

    for (const part of nameParts) {
      const normalizedSlug = toCompareSlug(part);
      const match = availableDevices.find(
        (device) => getDeviceSlug(device) === normalizedSlug,
      );
      if (!match) {
        matchedDevices = [];
        break;
      }
      matchedDevices.push(match);
    }

    const uniqueIds = new Set();
    const normalizedMatches = matchedDevices.filter((device) => {
      const resolvedId = String(getResolvedProductId(device) || "").trim();
      if (!resolvedId || uniqueIds.has(resolvedId)) return false;
      uniqueIds.add(resolvedId);
      return true;
    });

    if (normalizedMatches.length < 2) return [];

    const expectedType = String(
      getResolvedProductType(normalizedMatches[0]) || "",
    ).trim();
    if (
      !expectedType ||
      normalizedMatches.some(
        (device) =>
          String(getResolvedProductType(device) || "").trim() !== expectedType,
      )
    ) {
      return [];
    }

    return dedupeCompareEntries(
      normalizedMatches.map((device) => ({
        baseId: String(getResolvedProductId(device) || "").trim(),
        variantIndex: 0,
      })),
    );
  }, [availableDevices, normalizedCompareSlug, publishedComparePage]);

  const queryDeviceEntries = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const fromQuery = parseCompareDevicesParam(params.get("devices"));
    if (fromQuery.length > 0) return fromQuery;
    if (routeDeviceEntries.length > 0) return routeDeviceEntries;
    return [];
  }, [routeDeviceEntries, location.search]);

  const activeCompareEntries = useMemo(() => {
    if (activeDevices.length > 0) {
      const entries = activeDevices
        .map((device) => {
          const baseIdRaw =
            device?.baseId ??
            device?.productId ??
            device?.product_id ??
            device?.id ??
            device?.model ??
            "";
          const baseId = String(baseIdRaw || "").trim();
          if (!baseId) return null;

          const variantIndex = normalizeVariantIndex(
            variantSelection[device.id] ?? device.selectedVariantIndex ?? 0,
          );

          return { baseId, variantIndex };
        })
        .filter(Boolean);

      return dedupeCompareEntries(entries);
    }

    return queryDeviceEntries;
  }, [activeDevices, queryDeviceEntries, variantSelection]);

  const canonicalCompareEntries = useMemo(() => {
    const entries = [...activeCompareEntries];
    entries.sort(sortCompareEntries);
    return entries;
  }, [activeCompareEntries]);

  const canonicalCompareSlugPath = useMemo(() => {
    if (publishedComparePage?.route_path)
      return publishedComparePage.route_path;
    const slugPath = buildCanonicalComparePathFromDevices({
      devices: activeDevices,
      getName: (device) => device?.name || device?.model || "",
      getId: (device) =>
        device?.productId ??
        device?.product_id ??
        device?.id ??
        device?.baseId ??
        null,
      getVariantIndex: (device) =>
        variantSelection[device?.id] ?? device?.selectedVariantIndex ?? 0,
    });
    return slugPath && slugPath !== "/compare" ? slugPath : "";
  }, [activeDevices, publishedComparePage, variantSelection]);

  const legacyCompareRedirectPath = useMemo(() => {
    const isLegacyCompareSlug = /-vs-/i.test(normalizedCompareSlug);
    if (!isLegacyCompareSlug || routeDeviceEntries.length < 2) return "";

    const names = routeDeviceEntries
      .map(
        (entry) =>
          productLookupById.get(String(entry.baseId || "").trim())?.name,
      )
      .filter(Boolean)
      .slice(0, 3);

    if (names.length < 2) return "";

    const devicesForSlug = names.map((name, index) => ({
      name,
      productId: routeDeviceEntries[index]?.baseId ?? null,
      selectedVariantIndex: 0,
    }));
    const nextPath = buildCanonicalComparePathFromDevices({
      devices: devicesForSlug,
      getName: (device) => device?.name || "",
      getId: (device) => device?.productId ?? null,
      getVariantIndex: () => 0,
    });

    if (
      !nextPath ||
      nextPath === "/compare" ||
      nextPath === location.pathname
    ) {
      return "";
    }

    return nextPath;
  }, [
    location.pathname,
    normalizedCompareSlug,
    productLookupById,
    routeDeviceEntries,
  ]);

  useEffect(() => {
    if (!legacyCompareRedirectPath) return;
    navigate(legacyCompareRedirectPath, { replace: true });
  }, [legacyCompareRedirectPath, navigate]);

  const canonicalComparePath = useMemo(() => {
    if (publishedComparePage?.route_path)
      return publishedComparePage.route_path;
    const isLegacyCompareSlug = /-vs-/i.test(normalizedCompareSlug);
    if (
      !isLegacyCompareSlug &&
      normalizedCompareSlug &&
      location.pathname.startsWith("/compare/")
    ) {
      return location.pathname;
    }
    if (canonicalCompareSlugPath) return canonicalCompareSlugPath;
    return "/compare";
  }, [
    canonicalCompareSlugPath,
    location.pathname,
    normalizedCompareSlug,
    publishedComparePage,
  ]);

  const canonicalCompareUrl = useMemo(
    () => toCanonicalPageUrl(canonicalComparePath, SITE_ORIGIN),
    [canonicalComparePath],
  );

  // If navigation state provides compare items, use them immediately.
  useEffect(() => {
    try {
      const state = location.state || {};
      const initialItems = Array.isArray(state.initialProducts)
        ? state.initialProducts
        : state.initialProduct
          ? [state.initialProduct]
          : [];
      if (initialItems.length === 0) return;

      const entries = initialItems
        .map((initial) => {
          if (!initial) return null;

          const typeVal =
            initial.productType ||
            initial.deviceType ||
            initial.product_type ||
            "";
          const normalized = normalizeProduct(initial, typeVal);
          const deviceObj = { ...initial, ...normalized };

          const resolvedProductId =
            deviceObj.productId ?? deviceObj.product_id ?? deviceObj.id ?? null;
          if (resolvedProductId == null) return null;

          const resolvedType =
            deviceObj.productType ||
            deviceObj.deviceType ||
            deviceObj.product_type ||
            null;
          const resolvedName =
            deviceObj.name || deviceObj.model || deviceObj.title || null;

          return {
            ...deviceObj,
            id: `${resolvedProductId}`,
            productId: resolvedProductId,
            baseId: resolvedProductId,
            productType: resolvedType,
            name: resolvedName,
            selectedVariantIndex: normalizeVariantIndex(
              initial.selectedVariantIndex ??
                initial.variantIndex ??
                initial.selected_variant_index ??
                0,
            ),
          };
        })
        .filter(Boolean);

      if (entries.length === 0) return;

      if (entries.length >= MIN_DEVICES) {
        setComparedDevices(entries.slice(0, MAX_DEVICES));
        setSelectedDevices([]);
        setIsComparing(true);
      } else {
        setSelectedDevices((prev) => {
          const next = [...prev];
          entries.forEach((entry) => {
            if (next.some((item) => String(item.id) === String(entry.id))) {
              return;
            }
            next.push(entry);
          });
          return next;
        });
      }
      setVariantSelection((vs) => {
        const next = { ...vs };
        entries.forEach((entry) => {
          next[entry.id] = normalizeVariantIndex(
            entry.selectedVariantIndex ?? 0,
          );
        });
        return next;
      });

      // Remove navigation state after hydrating the compare page.
      try {
        navigate(`${location.pathname}${location.search}`, { replace: true });
      } catch (e) {}
    } catch (err) {
      // defensive
    }
    // run when navigation state changes
  }, [location.pathname, location.state, navigate]);

  // Record comparison on initial render when URL/devices present
  useEffect(() => {
    try {
      // Parse devices from URL or current selectedDevices once comparison starts
      const params = new URLSearchParams(location.search);
      const devicesParam = params.get("devices");
      // If there is a devices param, it contains entries like "<id>:<variant>"
      const ids = [];
      const fallbackDevices = isComparing ? comparedDevices : selectedDevices;

      // Only proceed automatically if URL contains devices OR the comparison UI is active
      if (!devicesParam && !isComparing) return;

      if (devicesParam) {
        const parts = devicesParam
          .split(",")
          .map((p) => p.trim())
          .filter(Boolean);
        parts.forEach((part) => {
          const [idOrModel] = part.split(":");
          const n = Number(idOrModel);
          if (Number.isInteger(n) && n > 0) ids.push(n);
        });
      } else if (fallbackDevices && fallbackDevices.length >= 2) {
        // fallback to currently selected devices in the UI
        fallbackDevices.forEach((d) => {
          const baseId = d.baseId ?? d.id;
          const n = Number(baseId);
          if (Number.isInteger(n) && n > 0) ids.push(n);
        });
      }

      if (ids.length < 2) return;

      // Use only first two ids for recording a pairwise compare on page load
      const [aRaw, bRaw] = [ids[0], ids[1]];
      if (!aRaw || !bRaw) return;
      const [l, r] = [Number(aRaw), Number(bRaw)].sort((x, y) => x - y);
      const sessionKey = `compare_${l}_${r}`;
      if (
        typeof sessionStorage !== "undefined" &&
        sessionStorage.getItem(sessionKey)
      )
        return;

      // Post the normalized comparison to backend
      (async () => {
        try {
          await fetch(`${API_BASE}/public/compare`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              left_product_id: l,
              right_product_id: r,
              product_type:
                fallbackDevices[0]?.productType ||
                fallbackDevices[0]?.deviceType ||
                fallbackDevices[0]?.product_type ||
                null,
            }),
          });
        } catch (err) {
          // ignore network errors
        }

        try {
          if (typeof sessionStorage !== "undefined")
            sessionStorage.setItem(sessionKey, "true");
        } catch (err) {}
      })();
    } catch (err) {
      // defensive
    }
    // Run when location.search changes or when comparison UI is activated
  }, [location.search, isComparing, comparedDevices, selectedDevices]);

  // Build a list of candidate items: one entry per product using the active or default variant.
  const filteredDevices = useMemo(() => {
    const parseNumber = (input) => {
      if (typeof input === "number" && Number.isFinite(input)) return input;
      if (typeof input !== "string") return null;
      const match = input.replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
      if (!match) return null;
      const parsed = Number(match[1]);
      return Number.isFinite(parsed) ? parsed : null;
    };

    const mergeObjects = (...objects) =>
      objects.reduce((acc, obj) => {
        if (obj && typeof obj === "object" && !Array.isArray(obj)) {
          return { ...acc, ...obj };
        }
        return acc;
      }, {});

    const toLowerBlob = (value) => {
      if (value == null) return "";
      if (Array.isArray(value)) {
        return value.map((entry) => toLowerBlob(entry)).join(" ");
      }
      if (typeof value === "object") {
        return Object.values(value)
          .map((entry) => toLowerBlob(entry))
          .join(" ");
      }
      return String(value).toLowerCase();
    };

    const readMainCameraMp = (camera) => {
      const direct = parseNumber(camera?.main_camera_megapixels);
      if (direct) return direct;

      const rear = camera?.rear_camera;
      if (!rear) return null;

      if (typeof rear === "string") {
        return parseNumber(rear);
      }

      if (typeof rear === "object") {
        let highest = null;
        Object.values(rear).forEach((lensSpec) => {
          if (lensSpec == null) return;
          if (typeof lensSpec === "object" && !Array.isArray(lensSpec)) {
            const candidate =
              parseNumber(lensSpec?.resolution) ||
              parseNumber(lensSpec?.megapixels) ||
              parseNumber(lensSpec?.main_camera_megapixels);
            if (candidate && (highest == null || candidate > highest)) {
              highest = candidate;
            }
            return;
          }
          const candidate = parseNumber(lensSpec);
          if (candidate && (highest == null || candidate > highest)) {
            highest = candidate;
          }
        });
        return highest;
      }

      return null;
    };

    const readChargingWatt = (battery) => {
      const explicit =
        parseNumber(battery?.charging_speed_watt) ||
        parseNumber(battery?.fast_charging_watt) ||
        parseNumber(battery?.charging_wattage) ||
        parseNumber(battery?.wired_charging);
      if (explicit) return explicit;

      const chargingText = [
        battery?.charging,
        battery?.charging_speed,
        battery?.fast_charging,
        battery?.charging_tech,
      ]
        .filter(Boolean)
        .join(" ");
      const wattMatch = chargingText.match(/(\d+(?:\.\d+)?)\s*w/i);
      if (!wattMatch) return null;
      const watt = Number(wattMatch[1]);
      return Number.isFinite(watt) ? watt : null;
    };

    const readRefreshRate = (display) => {
      const explicit =
        parseNumber(display?.refresh_rate) ||
        parseNumber(display?.max_refresh_rate) ||
        parseNumber(display?.screen_refresh_rate) ||
        parseNumber(display?.refreshRate);
      if (explicit) return explicit;

      const blob = toLowerBlob(display);
      const match = blob.match(/(\d+(?:\.\d+)?)\s*hz/);
      if (!match) return null;
      const refresh = Number(match[1]);
      return Number.isFinite(refresh) ? refresh : null;
    };

    const getCandidatePrice = (base, variant) => {
      const variantPrice =
        variant?.base_price ?? variant?.price ?? variant?.basePrice ?? null;
      if (variantPrice != null && Number(variantPrice) > 0) {
        return Number(variantPrice);
      }

      const basePrice =
        base?.price ??
        base?.base_price ??
        base?.basePrice ??
        base?.numericPrice ??
        null;
      if (basePrice != null && Number(basePrice) > 0) {
        return Number(basePrice);
      }

      const stores = Array.isArray(variant?.store_prices)
        ? variant.store_prices
        : Array.isArray(variant?.storePrices)
          ? variant.storePrices
          : [];
      const storePrice = stores
        .map((store) => Number(store?.price))
        .filter((value) => Number.isFinite(value) && value > 0)
        .sort((left, right) => left - right)[0];
      return storePrice || null;
    };

    const getTrendSortScore = (base) => {
      const productId = getResolvedProductId(base);
      if (productId == null) return 0;
      const key = String(productId);
      const trend = trendSignalsByProductId[key] || {};
      const compareCount = Number(
        compareSignalsByProductId[key] ??
          base?.compare_count ??
          base?.compareCount ??
          0,
      );
      const views7d = Number(trend?.views7d ?? 0);
      const viewsPrev7d = Number(trend?.viewsPrev7d ?? 0);
      const trendScore = Number(trend?.trendScore ?? 0);
      const rank = Number(trend?.rank ?? 9999);

      const safeViews = Number.isFinite(views7d) ? Math.max(0, views7d) : 0;
      const safePrev = Number.isFinite(viewsPrev7d)
        ? Math.max(0, viewsPrev7d)
        : 0;
      const safeCompare = Number.isFinite(compareCount)
        ? Math.max(0, compareCount)
        : 0;
      const safeTrendScore = Number.isFinite(trendScore)
        ? Math.max(0, trendScore)
        : 0;
      const growthRatio =
        safePrev > 0
          ? (safeViews - safePrev) / safePrev
          : safeViews > 0
            ? 1
            : 0;
      const growthBoost = Math.max(0, Math.min(2, growthRatio));
      const rankBoost =
        Number.isFinite(rank) && rank > 0 ? Math.max(0, 140 - rank * 2.5) : 0;

      return (
        safeTrendScore * 5 +
        Math.log1p(safeViews) * 18 +
        Math.log1p(safeCompare) * 26 +
        growthBoost * 20 +
        rankBoost
      );
    };

    const quickFilterMatch = (base, variant) => {
      if (activeQuickFilter === "all") return true;

      const display = mergeObjects(base?.display, base?.display_json);
      const performance = mergeObjects(
        base?.performance,
        base?.performance_json,
      );
      const camera = mergeObjects(base?.camera, base?.camera_json);
      const battery = mergeObjects(base?.battery, base?.battery_json);
      const connectivity = mergeObjects(
        base?.connectivity,
        base?.network,
        base?.network_json,
        base?.ports,
      );

      const displayBlob = toLowerBlob(display);
      const performanceBlob = toLowerBlob(performance);
      const batteryBlob = toLowerBlob(battery);
      const networkBlob = toLowerBlob(connectivity);
      const aiBlob = toLowerBlob([
        base?.ai_features,
        performance?.ai_features,
        camera?.ai_features,
        display?.ai_features,
        battery?.ai_features,
      ]);

      const cameraMp = readMainCameraMp(camera) || 0;
      const batteryCapacity =
        parseNumber(battery?.battery_capacity_mah) ||
        parseNumber(battery?.battery_capacity) ||
        parseNumber(battery?.capacity_mah) ||
        parseNumber(battery?.capacity) ||
        0;
      const chargingWatt = readChargingWatt(battery) || 0;
      const refreshRate = readRefreshRate(display) || 0;

      const ramValue =
        parseNumber(variant?.ram) ||
        parseNumber(base?.ram) ||
        parseNumber(performance?.ram) ||
        0;
      const storageValue =
        parseNumber(variant?.storage) ||
        parseNumber(base?.storage) ||
        parseNumber(base?.internal_storage) ||
        0;

      switch (activeQuickFilter) {
        case "wireless":
          return (
            /wireless\s*(charging|charge|power)/i.test(batteryBlob) ||
            /\bqi\b/.test(batteryBlob)
          );
        case "highMpCamera":
          return cameraMp >= 50;
        case "fiveG":
          return (
            /\b5g\b/.test(networkBlob) ||
            /\b5g\b/.test(performanceBlob) ||
            /\b5g\b/.test(toLowerBlob(base?.name))
          );
        case "fastCharge":
          return chargingWatt >= 44;
        case "aiFeatures":
          return aiBlob.trim().length > 0;
        case "longBattery":
          return batteryCapacity >= 5000;
        case "amoled":
          return /\bamoled\b|\boled\b|\bp-?oled\b|\bltpo\b/.test(displayBlob);
        case "refresh120":
          return refreshRate >= 120;
        case "wifi":
          return (
            /wi[\s-]?fi/.test(networkBlob) ||
            /802\.11/.test(networkBlob) ||
            /\bwlan\b/.test(networkBlob)
          );
        case "highRam":
          return ramValue >= 8;
        case "highStorage":
          return storageValue >= 256;
        default:
          return true;
      }
    };

    let candidates = (availableDevices || []).map((device) => {
      const resolvedId = getResolvedProductId(device);
      const matchedEntry = [...comparedDevices, ...selectedDevices].find(
        (entry) => String(entry?.id) === String(resolvedId),
      );
      const variants =
        Array.isArray(device.variants) && device.variants.length
          ? device.variants
          : [];
      const rawVariantIndex =
        variantSelection[resolvedId] ?? matchedEntry?.selectedVariantIndex ?? 0;
      const safeVariantIndex =
        variants.length > 0 && variants[rawVariantIndex] ? rawVariantIndex : 0;

      return {
        base: device,
        variant: variants[safeVariantIndex] || null,
        variantIndex: safeVariantIndex,
      };
    });

    const effectiveCategory =
      catalogLockedType ||
      (catalogCategoryFilter !== "all" ? catalogCategoryFilter : "");

    if (effectiveCategory) {
      candidates = candidates.filter((candidate) => {
        const candidateType = getResolvedProductType(candidate.base);
        return candidateType === effectiveCategory;
      });
    }

    if (catalogBrandFilter !== "all") {
      candidates = candidates.filter(
        (candidate) =>
          String(candidate.base?.brand || "")
            .trim()
            .toLowerCase() === catalogBrandFilter,
      );
    }

    candidates = candidates
      .map((candidate) => {
        const displayPrice = getCandidatePrice(
          candidate.base,
          candidate.variant,
        );
        const releaseYear = getDeviceLaunchYear(candidate.base);
        return {
          ...candidate,
          displayPrice,
          releaseYear,
          trendSortScore: getTrendSortScore(candidate.base),
        };
      })
      .filter((candidate) =>
        matchesPriceRange(candidate.displayPrice, catalogPriceFilter),
      )
      .filter((candidate) =>
        catalogReleaseYearFilter === "all"
          ? true
          : String(candidate.releaseYear || "") === catalogReleaseYearFilter,
      );

    const query = searchQuery.trim().toLowerCase();
    const searched = query
      ? candidates.filter((it) => {
          const searchableBlob = toLowerBlob([
            it.base?.name,
            it.base?.brand,
            it.base?.model,
            it.variant?.ram,
            it.variant?.storage,
            it.base?.display,
            it.base?.performance,
            it.base?.camera,
            it.base?.battery,
            it.base?.connectivity,
            it.base?.network,
            it.base?.ai_features,
          ]);
          return searchableBlob.includes(query);
        })
      : candidates;

    const quickFiltered = searched.filter((it) =>
      quickFilterMatch(it.base, it.variant),
    );

    return quickFiltered
      .sort((a, b) => {
        if (searchSort === "priceAsc" || searchSort === "priceDesc") {
          const aPrice = Number.isFinite(a.displayPrice)
            ? a.displayPrice
            : Infinity;
          const bPrice = Number.isFinite(b.displayPrice)
            ? b.displayPrice
            : Infinity;
          if (aPrice !== bPrice) {
            return searchSort === "priceAsc"
              ? aPrice - bPrice
              : bPrice - aPrice;
          }
        }

        if (searchSort === "nameAsc") {
          return String(a.base?.name || "").localeCompare(
            String(b.base?.name || ""),
          );
        }

        const trendDiff = (b.trendSortScore || 0) - (a.trendSortScore || 0);
        if (Math.abs(trendDiff) > 0.001) return trendDiff;

        const aCompare = Number(
          compareSignalsByProductId[String(getResolvedProductId(a.base))] || 0,
        );
        const bCompare = Number(
          compareSignalsByProductId[String(getResolvedProductId(b.base))] || 0,
        );
        if (aCompare !== bCompare) return bCompare - aCompare;

        return String(a.base?.name || "").localeCompare(
          String(b.base?.name || ""),
        );
      })
      .map(({ trendSortScore, displayPrice, releaseYear, ...item }) => item);
  }, [
    availableDevices,
    searchQuery,
    selectedDevices,
    comparedDevices,
    isComparing,
    variantSelection,
    trendSignalsByProductId,
    compareSignalsByProductId,
    activeQuickFilter,
    searchSort,
    catalogLockedType,
    catalogCategoryFilter,
    catalogBrandFilter,
    catalogPriceFilter,
    catalogReleaseYearFilter,
  ]);

  const catalogCategoryOptions = useMemo(() => {
    const types = Array.from(
      new Set(
        (availableDevices || [])
          .map((device) => getResolvedProductType(device))
          .filter(Boolean),
      ),
    ).sort();

    return [
      { id: "all", label: "All categories" },
      ...types.map((type) => ({
        id: type,
        label: formatProductTypeLabel(type),
      })),
    ];
  }, [availableDevices]);

  const catalogBrandOptions = useMemo(() => {
    const effectiveCategory =
      catalogLockedType ||
      (catalogCategoryFilter !== "all" ? catalogCategoryFilter : "");

    const brands = Array.from(
      new Set(
        (availableDevices || [])
          .filter((device) => {
            if (!effectiveCategory) return true;
            return getResolvedProductType(device) === effectiveCategory;
          })
          .map((device) => String(device?.brand || "").trim())
          .filter(Boolean),
      ),
    ).sort((left, right) => left.localeCompare(right));

    return [
      { id: "all", label: "All brands" },
      ...brands.map((brand) => ({ id: brand.toLowerCase(), label: brand })),
    ];
  }, [availableDevices, catalogCategoryFilter, catalogLockedType]);

  const catalogReleaseYearOptions = useMemo(() => {
    const effectiveCategory =
      catalogLockedType ||
      (catalogCategoryFilter !== "all" ? catalogCategoryFilter : "");

    const years = Array.from(
      new Set(
        (availableDevices || [])
          .filter((device) => {
            if (!effectiveCategory) return true;
            return getResolvedProductType(device) === effectiveCategory;
          })
          .map((device) => getDeviceLaunchYear(device))
          .filter((value) => Number.isFinite(value)),
      ),
    ).sort((left, right) => right - left);

    return [
      { id: "all", label: "Any year" },
      ...years.map((year) => ({ id: String(year), label: String(year) })),
    ];
  }, [availableDevices, catalogCategoryFilter, catalogLockedType]);

  const visibleCatalogDevices = useMemo(
    () => filteredDevices.slice(0, catalogVisibleCount),
    [filteredDevices, catalogVisibleCount],
  );

  useEffect(() => {
    if (
      catalogBrandFilter !== "all" &&
      !catalogBrandOptions.some((option) => option.id === catalogBrandFilter)
    ) {
      setCatalogBrandFilter("all");
    }
  }, [catalogBrandFilter, catalogBrandOptions]);

  useEffect(() => {
    if (
      catalogReleaseYearFilter !== "all" &&
      !catalogReleaseYearOptions.some(
        (option) => option.id === catalogReleaseYearFilter,
      )
    ) {
      setCatalogReleaseYearFilter("all");
    }
  }, [catalogReleaseYearFilter, catalogReleaseYearOptions]);

  useEffect(() => {
    if (signalsFetched || (availableDevices || []).length === 0) return;

    let cancelled = false;

    const loadSignals = async () => {
      try {
        const [trendingRes, comparedRes] = await Promise.all([
          fetch("https://api.apisphere.in/api/public/trending/all"),
          fetch("https://api.apisphere.in/api/public/trending/most-compared"),
        ]);

        if (!cancelled && trendingRes.ok) {
          const trendingJson = await trendingRes.json();
          const rows = Array.isArray(trendingJson?.trending)
            ? trendingJson.trending
            : [];

          const trendMap = {};
          rows.forEach((row, index) => {
            const pid = Number(
              row?.product_id ?? row?.productId ?? row?.id ?? null,
            );
            if (!Number.isFinite(pid)) return;

            const views7d = Number(
              row?.trend_views_7d ?? row?.views_7d ?? row?.views ?? 0,
            );
            const viewsPrev7d = Number(
              row?.trend_views_prev_7d ?? row?.views_prev_7d ?? 0,
            );
            const trendScore = Number(
              row?.trend_score ?? row?.trending_score ?? 0,
            );

            trendMap[String(pid)] = {
              views7d: Number.isFinite(views7d) ? views7d : 0,
              viewsPrev7d: Number.isFinite(viewsPrev7d) ? viewsPrev7d : 0,
              trendScore: Number.isFinite(trendScore) ? trendScore : 0,
              rank: index + 1,
            };
          });

          setTrendSignalsByProductId(trendMap);
        }

        if (!cancelled && comparedRes.ok) {
          const comparedJson = await comparedRes.json();
          const rows = Array.isArray(comparedJson?.mostCompared)
            ? comparedJson.mostCompared
            : [];

          const compareMap = {};
          rows.forEach((row) => {
            const count = Number(row?.compare_count ?? row?.compareCount ?? 0);
            if (!Number.isFinite(count) || count <= 0) return;

            [row?.product_id, row?.compared_product_id].forEach((idRaw) => {
              const pid = Number(idRaw);
              if (!Number.isFinite(pid)) return;
              const key = String(pid);
              compareMap[key] = (compareMap[key] || 0) + count;
            });
          });

          setCompareSignalsByProductId(compareMap);
        }
      } catch {
        // ignore signal fetch failures
      } finally {
        if (!cancelled) setSignalsFetched(true);
      }
    };

    loadSignals();
    return () => {
      cancelled = true;
    };
  }, [availableDevices, signalsFetched]);

  useEffect(() => {
    const container = searchResultsRef.current;
    if (!container) return;
    container.scrollTop = 0;
    setCatalogVisibleCount(6);
  }, [
    searchQuery,
    activeQuickFilter,
    searchSort,
    catalogCategoryFilter,
    catalogBrandFilter,
    catalogPriceFilter,
    catalogReleaseYearFilter,
  ]);

  // Get device specs
  // Format price (hoisted so it can be used by other functions)
  function formatPrice(price) {
    if (!price || price === 0) return "N/A";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  }

  const toNormalCase = (raw) => {
    if (!raw) return "";
    const normalizedKey = String(raw || "")
      .trim()
      .toLowerCase();
    if (SPEC_LABEL_OVERRIDES[normalizedKey]) {
      return SPEC_LABEL_OVERRIDES[normalizedKey];
    }
    let s = String(raw);
    s = s.replace(/_/g, " ").replace(/([a-z0-9])([A-Z])/g, "$1 $2");
    const parts = s.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
    return parts
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  };

  const normalizeSpecOrderKey = (value) =>
    String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

  const getOrderedSpecIndex = (sectionId, specKey) => {
    const order = SECTION_SPEC_ORDER[sectionId] || [];
    return order.indexOf(normalizeSpecOrderKey(specKey));
  };

  const getSpecRowIcon = (sectionId, specKey) => {
    const mappedIcon = SPEC_ROW_ICONS[specKey];
    if (mappedIcon) return mappedIcon;
    return SECTION_ICON_BY_ID[sectionId] || Info;
  };

  const pickFirstRenderable = (...values) => {
    for (const value of values) {
      if (hasRenderableValue(value)) return value;
    }
    return null;
  };

  const COMPARE_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const extractScalarSpecText = (value) => {
    if (!hasRenderableValue(value)) return null;
    if (typeof value === "string") {
      const text = value.trim();
      return text || null;
    }
    if (typeof value === "number") {
      return Number.isFinite(value) ? String(value) : null;
    }
    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    }
    return null;
  };

  const formatLaunchDateValue = (value) => {
    const directText = extractScalarSpecText(value);
    if (!directText) return null;

    if (/^[A-Za-z]{3,9}\s+\d{4}$/.test(directText)) return directText;
    if (/^[A-Za-z]{3,9}\s+\d{1,2},\s*\d{4}$/.test(directText))
      return directText;
    if (/^\d{4}$/.test(directText)) return directText;

    const monthOnlyMatch = directText.match(/^(\d{4})-(\d{2})$/);
    if (monthOnlyMatch) {
      const monthDate = parseDateOnly(
        `${monthOnlyMatch[1]}-${monthOnlyMatch[2]}-01`,
      );
      return monthDate
        ? monthDate.toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          })
        : directText;
    }

    const parsed = parseDateOnly(directText);
    return parsed ? COMPARE_DATE_FORMATTER.format(parsed) : directText;
  };

  const extractMeasurementText = (value, fallbackUnit = "") => {
    const scalar = extractScalarSpecText(value);
    if (scalar) {
      if (!fallbackUnit || /[a-zA-Z]/.test(scalar)) return scalar;
      return `${scalar} ${fallbackUnit}`.trim();
    }

    if (Array.isArray(value)) {
      for (const entry of value) {
        const text = extractMeasurementText(entry, fallbackUnit);
        if (text) return text;
      }
      return null;
    }

    if (!value || typeof value !== "object") return null;

    const direct = extractScalarSpecText(
      value.value ??
        value.measurement ??
        value.dimension ??
        value.size ??
        value.amount ??
        value.number ??
        value.numeric_value ??
        null,
    );
    const directUnit = extractScalarSpecText(value.unit ?? value.units ?? null);
    if (direct) {
      if (directUnit && !new RegExp(`${directUnit}\\s*$`, "i").test(direct)) {
        return `${direct} ${directUnit}`.trim();
      }
      if (!directUnit && fallbackUnit && !/[a-zA-Z]/.test(direct)) {
        return `${direct} ${fallbackUnit}`.trim();
      }
      return direct;
    }

    const unitKeyMap = {
      mm: "mm",
      millimeter: "mm",
      millimeters: "mm",
      cm: "cm",
      centimeter: "cm",
      centimeters: "cm",
      m: "m",
      meter: "m",
      meters: "m",
      in: "in",
      inch: "in",
      inches: "in",
      g: "g",
      gm: "g",
      gms: "g",
      gram: "g",
      grams: "g",
      kg: "kg",
    };

    for (const [key, unit] of Object.entries(unitKeyMap)) {
      if (hasRenderableValue(value[key])) {
        const text = extractMeasurementText(value[key], unit);
        if (text) return text;
      }
    }

    const usableEntries = Object.entries(value).filter(([, entryValue]) =>
      hasRenderableValue(entryValue),
    );
    if (usableEntries.length === 1) {
      const [nestedKey, nestedValue] = usableEntries[0];
      const text = extractMeasurementText(
        nestedValue,
        unitKeyMap[nestedKey.toLowerCase()] || fallbackUnit,
      );
      if (text) return text;
    }

    return null;
  };

  const buildStructuredDimensionsText = (source) => {
    if (!hasRenderableValue(source)) return null;

    const direct = extractScalarSpecText(source);
    if (direct) return direct;

    if (!source || typeof source !== "object") return null;

    const values = [
      extractMeasurementText(
        source.height ?? source.length ?? source.h ?? source.l,
      ),
      extractMeasurementText(
        source.width ?? source.breadth ?? source.w ?? source.b,
      ),
      extractMeasurementText(
        source.thickness ?? source.depth ?? source.d ?? source.t,
      ),
    ].filter(Boolean);

    return values.length >= 2 ? values.join(" x ") : null;
  };

  const getVariantSpecHints = (selectedVariant) =>
    [
      selectedVariant?.color_name,
      selectedVariant?.color,
      selectedVariant?.colour,
      selectedVariant?.variant_name,
      selectedVariant?.variant_title,
      selectedVariant?.variant_label,
      selectedVariant?.name,
      selectedVariant?.title,
    ]
      .map((entry) =>
        String(entry || "")
          .trim()
          .toLowerCase(),
      )
      .filter(Boolean);

  const buildWeightSpecValue = (source, selectedVariant = null) => {
    const direct = extractMeasurementText(source, "g");
    if (direct) return direct;

    if (Array.isArray(source)) {
      const values = source
        .map((entry) => extractMeasurementText(entry, "g"))
        .filter(Boolean);
      return values.length ? Array.from(new Set(values)).join(" / ") : null;
    }

    if (!source || typeof source !== "object") return null;

    const variantHints = getVariantSpecHints(selectedVariant);
    if (variantHints.length) {
      for (const [key, value] of Object.entries(source)) {
        const normalizedKey = String(key || "")
          .trim()
          .toLowerCase();
        if (
          normalizedKey &&
          variantHints.some(
            (hint) =>
              normalizedKey.includes(hint) || hint.includes(normalizedKey),
          )
        ) {
          const matched = extractMeasurementText(value, "g");
          if (matched) return matched;
        }
      }
    }

    const values = Object.values(source)
      .map((entry) => extractMeasurementText(entry, "g"))
      .filter(Boolean);

    if (!values.length) return null;
    return Array.from(new Set(values)).join(" / ");
  };

  const buildBodySpecValue = (buildSpecs = {}, physicalSpecs = {}) => {
    const direct = pickFirstRenderable(
      buildSpecs?.body,
      physicalSpecs?.body,
      buildSpecs?.materials,
      buildSpecs?.material,
    );
    if (direct) return direct;

    const parts = [
      buildSpecs?.front_material || buildSpecs?.front,
      buildSpecs?.frame_material || buildSpecs?.frame,
      buildSpecs?.back_material || buildSpecs?.back,
    ]
      .map((part) => String(part || "").trim())
      .filter(Boolean);

    return parts.length ? parts.join(", ") : null;
  };

  const buildDimensionsSpecValue = (buildSpecs = {}, physicalSpecs = {}) => {
    const direct = pickFirstRenderable(
      physicalSpecs?.dimensions,
      buildSpecs?.dimensions,
    );
    const directText = buildStructuredDimensionsText(direct);
    if (directText) return directText;

    const values = [
      extractMeasurementText(
        pickFirstRenderable(physicalSpecs?.height, buildSpecs?.height),
      ),
      extractMeasurementText(
        pickFirstRenderable(physicalSpecs?.width, buildSpecs?.width),
      ),
      extractMeasurementText(
        pickFirstRenderable(
          physicalSpecs?.thickness,
          buildSpecs?.thickness,
          physicalSpecs?.depth,
          buildSpecs?.depth,
        ),
      ),
    ].filter(Boolean);

    return values.length >= 2 ? values.join(" x ") : null;
  };

  const formatSpecValue = (value, key, depth = 0) => {
    if (value == null || value === "") return "N/A";
    if (Array.isArray(value)) {
      const items = value
        .map((item) => formatSpecValue(item, key, depth + 1))
        .filter((item) => item && item !== "N/A");
      return items.length ? items.join(", ") : "N/A";
    }
    if (typeof value === "object") {
      const parts = Object.entries(value)
        .map(([k, v]) => {
          if (v == null || v === "") return null;
          const nested = formatSpecValue(v, k, depth + 1);
          if (!nested || nested === "N/A") return null;
          if (typeof v === "object") {
            if (Array.isArray(v)) return `${toNormalCase(k)}: ${nested}`;
            return `${toNormalCase(k)} (${nested})`;
          }
          return `${toNormalCase(k)}: ${nested}`;
        })
        .filter(Boolean);
      return parts.length ? parts.join(depth === 0 ? " | " : ", ") : "N/A";
    }
    if (value === true) return "Yes";
    if (value === false) return "No";
    return String(value);
  };

  const renderStructuredSpecValue = (value, specKey) => {
    if (value == null || value === "" || value === "N/A") {
      return "N/A";
    }

    if (Array.isArray(value)) {
      const entries = value.filter((entry) => hasRenderableValue(entry));
      if (entries.length === 0) return "N/A";

      return (
        <div className="space-y-1">
          {entries.map((entry, index) => (
            <div
              key={`${specKey}-array-${index}`}
              className="leading-5 break-words"
            >
              {formatSpecValue(entry, specKey, 1)}
            </div>
          ))}
        </div>
      );
    }

    if (typeof value === "object") {
      const entries = Object.entries(value).filter(([, nestedValue]) =>
        hasRenderableValue(nestedValue),
      );

      if (entries.length === 0) return "N/A";

      return (
        <div className="space-y-1">
          {entries.map(([nestedKey, nestedValue]) => (
            <div
              key={`${specKey}-${nestedKey}`}
              className="leading-5 break-words"
            >
              <span className="font-semibold text-gray-700">
                {toNormalCase(nestedKey)}:
              </span>{" "}
              <span>{formatSpecValue(nestedValue, nestedKey, 1)}</span>
            </div>
          ))}
        </div>
      );
    }

    return formatSpecValue(value, specKey);
  };

  const renderCameraComparisonValue = (value, specKey) => {
    if (value == null || value === "" || value === "N/A") return "N/A";

    const CAMERA_FIELD_ALIASES = {
      fov: "FOV",
      ois: "OIS",
      eis: "EIS",
      af: "Autofocus",
      autofocus: "Autofocus",
      focus: "Focus",
      lens: "Lens",
      lenses: "Lens",
      aperture: "Aperture",
      pixel: "Pixel Size",
      pixelsize: "Pixel Size",
      resolution: "Resolution",
      megapixel: "Resolution",
      megapixels: "Resolution",
      sensor: "Sensor",
      sensorsize: "Sensor",
      focallength: "Focal Length",
      macrodistance: "Macro Distance",
      stabilization: "Stabilization",
      features: "Features",
      flash: "Flash",
    };

    const CAMERA_FIELD_ORDER = [
      "Resolution",
      "Sensor",
      "Aperture",
      "Pixel Size",
      "OIS",
      "EIS",
      "Autofocus",
      "Focus",
      "FOV",
      "Focal Length",
      "Lens",
      "Macro Distance",
      "Stabilization",
      "Flash",
      "Features",
    ];

    const CAMERA_SECTION_ORDER = [
      "Main Camera",
      "Rear Camera",
      "Ultra Wide Camera",
      "Telephoto Camera",
      "Periscope Camera",
      "Depth Camera",
      "Macro Camera",
      "Front Camera",
      "Rear Video",
      "Video Recording",
      "Camera Features",
      "Features",
    ];

    const getFieldOrderIndex = (field) => {
      const index = CAMERA_FIELD_ORDER.indexOf(field);
      return index === -1 ? 999 : index;
    };

    const normalizeFieldToken = (token) =>
      String(token || "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");

    const normalizeCameraField = (raw) => {
      const token = String(raw || "").trim();
      if (!token) return "";
      const compact = normalizeFieldToken(token);
      const aliased = CAMERA_FIELD_ALIASES[compact];
      if (aliased) return aliased;
      if (compact === "hdr") return "HDR";
      return toNormalCase(token);
    };

    const dedupeAndSortPairs = (pairs) => {
      const map = new Map();
      (pairs || []).forEach(([field, fieldValue]) => {
        if (!field || !fieldValue) return;
        const normalizedField = normalizeCameraField(field);
        const normalizedValue = String(fieldValue).trim();
        if (!normalizedField || !normalizedValue) return;
        if (map.has(normalizedField)) {
          const existing = map.get(normalizedField);
          if (!existing.includes(normalizedValue)) {
            map.set(normalizedField, `${existing} | ${normalizedValue}`);
          }
          return;
        }
        map.set(normalizedField, normalizedValue);
      });

      return Array.from(map.entries()).sort((a, b) => {
        const orderDiff = getFieldOrderIndex(a[0]) - getFieldOrderIndex(b[0]);
        if (orderDiff !== 0) return orderDiff;
        return a[0].localeCompare(b[0]);
      });
    };

    const sortSections = (sections) =>
      [...(sections || [])].sort((a, b) => {
        const aLabel = a?.label || "";
        const bLabel = b?.label || "";
        const aIndex = CAMERA_SECTION_ORDER.indexOf(aLabel);
        const bIndex = CAMERA_SECTION_ORDER.indexOf(bLabel);
        const left = aIndex === -1 ? 999 : aIndex;
        const right = bIndex === -1 ? 999 : bIndex;
        if (left !== right) return left - right;
        return aLabel.localeCompare(bLabel);
      });

    const FEATURE_ITEM_LIMIT = 10;
    const featureKey = String(specKey || "").toLowerCase();
    const isFeatureLikeSpec =
      featureKey.includes("feature") || featureKey.includes("mode");

    const normalizeFeatureItem = (rawItem) => {
      const item = String(rawItem || "")
        .replace(/\s+/g, " ")
        .trim();
      if (!item) return "";

      const supportedMatch = item.match(/^(.*?):\s*(yes|true|supported)$/i);
      if (supportedMatch?.[1]) {
        return toNormalCase(supportedMatch[1].trim());
      }

      if (/^(na|n\/a|null|undefined|not specified)$/i.test(item)) return "";

      return item.length > 48 ? `${item.slice(0, 45)}...` : item;
    };

    const toFeatureItems = (input) => {
      const flatText = String(formatSpecValue(input, specKey, 1) || "").trim();
      if (!flatText || flatText === "N/A") return [];

      return Array.from(
        new Set(
          flatText
            .replace(/\r?\n/g, ",")
            .replace(/\|/g, ",")
            .replace(/;/g, ",")
            .split(",")
            .map((token) => normalizeFeatureItem(token))
            .filter(Boolean),
        ),
      );
    };

    const toPairsFromText = (text) => {
      const normalized = String(text || "")
        .replace(/\r?\n/g, " | ")
        .replace(/;/g, " | ")
        .replace(/,\s+(?=[A-Za-z][A-Za-z0-9 ()/+.-]{1,32}\s*:)/g, " | ")
        .replace(/\s+/g, " ")
        .trim();

      if (!normalized || !normalized.includes(":")) return [];

      return normalized
        .split("|")
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part) => {
          const separatorIndex = part.indexOf(":");
          if (separatorIndex === -1) return null;
          const field = normalizeCameraField(part.slice(0, separatorIndex));
          const fieldValue = part.slice(separatorIndex + 1).trim();
          if (!field || !fieldValue) return null;
          return [field, fieldValue];
        })
        .filter(Boolean);
    };

    const sectionRegex =
      /(Main Camera|Rear Camera|Ultra Wide Camera|Front Camera|Telephoto Camera|Periscope Camera|Macro Camera|Depth Camera|Rear Video|Video Recording|Camera Features|Features)\s*:/gi;

    const toSectionsFromText = (text) => {
      const source = String(text || "").trim();
      if (!source) return [];

      const matches = Array.from(source.matchAll(sectionRegex));
      if (matches.length < 2) return [];

      return matches
        .map((match, index) => {
          const start = (match.index ?? 0) + match[0].length;
          const end =
            index + 1 < matches.length
              ? (matches[index + 1].index ?? source.length)
              : source.length;
          const sectionLabel = normalizeCameraField(match[1]);
          const body = source.slice(start, end).trim();
          const pairs = toPairsFromText(body);
          return { label: sectionLabel, pairs, text: body };
        })
        .filter((section) => hasRenderableValue(section.text));
    };

    const toSectionsFromObject = (obj, label = null) => {
      if (!obj || typeof obj !== "object" || Array.isArray(obj)) return [];

      const primitivePairs = [];
      const nestedSections = [];

      Object.entries(obj).forEach(([nestedKey, nestedValue]) => {
        if (!hasRenderableValue(nestedValue)) return;

        if (
          nestedValue &&
          typeof nestedValue === "object" &&
          !Array.isArray(nestedValue)
        ) {
          nestedSections.push(
            ...toSectionsFromObject(
              nestedValue,
              normalizeCameraField(nestedKey),
            ),
          );
          return;
        }

        const formatted = formatSpecValue(nestedValue, nestedKey, 1);
        if (!formatted || formatted === "N/A") return;
        primitivePairs.push([normalizeCameraField(nestedKey), formatted]);
      });

      const sections = [];
      if (primitivePairs.length) {
        sections.push({ label, pairs: primitivePairs, text: "" });
      }
      if (nestedSections.length) {
        sections.push(...nestedSections);
      }
      return sections;
    };

    const renderPairsTable = (pairs, keyPrefix) => {
      if (!Array.isArray(pairs) || pairs.length === 0) return null;

      const normalizedPairs = dedupeAndSortPairs(pairs);
      if (normalizedPairs.length === 0) return null;

      const visiblePairs = normalizedPairs.slice(0, 8);
      const hiddenCount = normalizedPairs.length - visiblePairs.length;

      return (
        <div className="bg-white">
          <table className="w-full">
            <tbody className="divide-y divide-slate-100">
              {visiblePairs.map(([field, fieldValue], index) => (
                <tr key={`${keyPrefix}-${field}-${index}`}>
                  <td className="w-[42%] px-2 py-1.5 text-[11px] font-semibold text-slate-600">
                    {field}
                  </td>
                  <td className="px-2 py-1.5 text-[11px] text-slate-900 break-words">
                    {fieldValue}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {hiddenCount > 0 ? (
            <p className="px-2 pt-1 text-[10px] font-medium text-slate-500">
              +{hiddenCount} more details
            </p>
          ) : null}
        </div>
      );
    };

    const renderSectionList = (sections, keyPrefix) => (
      <div className="space-y-2">
        {sortSections(sections).map((section, index) => (
          <div key={`${keyPrefix}-section-${index}`} className="space-y-1">
            {section.label ? (
              <p className="text-[11px] font-semibold text-slate-700">
                {section.label}
              </p>
            ) : null}
            {section.pairs?.length ? (
              renderPairsTable(section.pairs, `${keyPrefix}-${index}`)
            ) : (
              <p className="text-[12px] leading-5 text-slate-800">
                {section.text}
              </p>
            )}
          </div>
        ))}
      </div>
    );

    if (typeof value === "object" && !Array.isArray(value)) {
      const objectSections = toSectionsFromObject(value);
      if (objectSections.length > 0) {
        return renderSectionList(objectSections, `${specKey}-object`);
      }
    }

    if (Array.isArray(value)) {
      const entries = value
        .map((item) => String(formatSpecValue(item, specKey, 1) || "").trim())
        .filter((item) => item && item !== "N/A");
      if (entries.length === 0) return "N/A";
      return (
        <div className="space-y-1">
          {entries.map((entry, index) => (
            <p
              key={`${specKey}-array-${index}`}
              className="text-[12px] leading-5 text-slate-800"
            >
              {entry}
            </p>
          ))}
        </div>
      );
    }

    const text = String(formatSpecValue(value, specKey) || "").trim();
    if (!text || text === "N/A") return "N/A";

    if (isFeatureLikeSpec) {
      const featureItems = toFeatureItems(value);
      if (featureItems.length > 0) {
        const visibleItems = featureItems.slice(0, FEATURE_ITEM_LIMIT);
        const hiddenCount = featureItems.length - visibleItems.length;

        return (
          <div className="space-y-1.5">
            <p className="text-[11px] font-medium text-slate-500">
              {featureItems.length} features
            </p>
            <div className="flex flex-wrap gap-1.5">
              {visibleItems.map((item, index) => (
                <span
                  key={`${specKey}-feature-${index}`}
                  className="inline-flex items-center border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] leading-4 text-slate-700"
                >
                  {item}
                </span>
              ))}
              {hiddenCount > 0 ? (
                <span className="inline-flex items-center border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-medium leading-4 text-blue-600">
                  +{hiddenCount} more
                </span>
              ) : null}
            </div>
          </div>
        );
      }
    }

    const textSections = toSectionsFromText(text);
    if (textSections.length > 0) {
      return renderSectionList(textSections, `${specKey}-text-sections`);
    }

    const textPairs = toPairsFromText(text);
    if (textPairs.length >= 2) {
      return renderPairsTable(textPairs, `${specKey}-text-pairs`);
    }

    return (
      <p className="text-[12px] leading-5 text-slate-800 break-words">{text}</p>
    );
  };

  const hasRenderableValue = (value) => {
    if (value == null || value === false) return false;
    if (typeof value === "string") {
      const t = value.trim();
      if (!t) return false;
      const lower = t.toLowerCase();
      if (
        lower === "n/a" ||
        lower === "na" ||
        lower === "null" ||
        lower === "undefined" ||
        lower === "not specified" ||
        t === "{}" ||
        t === "[]"
      ) {
        return false;
      }
      return true;
    }
    if (typeof value === "number") return Number.isFinite(value);
    if (Array.isArray(value))
      return value.some((entry) => hasRenderableValue(entry));
    if (typeof value === "object") {
      return Object.values(value).some((entry) => hasRenderableValue(entry));
    }
    return Boolean(value);
  };

  const mergeSpecObjects = (...objects) =>
    objects.reduce((acc, obj) => {
      if (obj && typeof obj === "object" && !Array.isArray(obj)) {
        return { ...acc, ...obj };
      }
      return acc;
    }, {});

  const toArray = (value) => {
    if (Array.isArray(value))
      return value.filter((item) => item != null && item !== "");
    if (typeof value === "string") return value.trim() ? [value.trim()] : [];
    return [];
  };

  const collectAiFeatures = (device) => {
    const buckets = [
      device?.ai_features,
      device?.performance?.ai_features,
      device?.camera?.ai_features,
      device?.display?.ai_features,
      device?.battery?.ai_features,
      device?.connectivity?.ai_features,
      device?.multimedia?.ai_features,
      device?.build_design?.ai_features,
      device?.buildDesign?.ai_features,
    ];

    return Array.from(
      new Set(
        buckets.flatMap((bucket) =>
          toArray(bucket).map((x) => String(x).trim()),
        ),
      ),
    ).filter(Boolean);
  };

  const cleanSpecs = (specs) => {
    if (!specs || typeof specs !== "object") return {};
    const blocked = new Set(["sphere_rating"]);
    return Object.fromEntries(
      Object.entries(specs).filter(
        ([k, v]) =>
          !blocked.has(k) &&
          !/(^|[_-])score$/i.test(k) &&
          hasRenderableValue(v),
      ),
    );
  };

  const hasAiFeatures = (device) => {
    return collectAiFeatures(device).length > 0;
  };

  // Render specification table with professional styling
  const renderSpecTable = (specs) => {
    if (
      !specs ||
      (typeof specs === "object" && Object.keys(specs).length === 0)
    ) {
      return (
        <div className="text-center py-4 text-gray-500">No data available</div>
      );
    }

    const entries = Object.entries(specs).filter(
      ([k, v]) =>
        k !== "sphere_rating" &&
        !/(^|[_-])score$/i.test(k) &&
        hasRenderableValue(v),
    );

    if (entries.length === 0) {
      return (
        <div className="text-center py-4 text-gray-500">No data available</div>
      );
    }

    return (
      <div className="space-y-2">
        {entries.map(([key, value]) => (
          <div
            key={key}
            className="flex items-center justify-between   border border-slate-200 bg-white px-4 py-3 transition-colors hover:border-blue-200 hover:bg-slate-50"
          >
            <span className="flex-1 text-sm font-semibold text-slate-700">
              {toNormalCase(key)}
            </span>
            <span className="flex-1 break-words text-right text-sm font-bold text-blue-600">
              {formatSpecValue(value, key)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  // Render camera specifications table
  const renderCameraTable = (camera) => {
    if (!camera) {
      return (
        <div className="text-center py-4 text-gray-500">
          No camera data available
        </div>
      );
    }

    const rows = [];

    if (camera.main_camera_megapixels) {
      rows.push(["Main Camera", `${camera.main_camera_megapixels} MP`]);
    }

    if (camera.rear_camera) {
      if (
        typeof camera.rear_camera === "object" &&
        !Array.isArray(camera.rear_camera)
      ) {
        Object.entries(camera.rear_camera).forEach(([lens, spec]) => {
          if (hasRenderableValue(spec)) {
            rows.push([toNormalCase(lens), formatSpecValue(spec, lens)]);
          }
        });
      } else {
        rows.push([
          "Rear Camera",
          formatSpecValue(camera.rear_camera, "rear_camera"),
        ]);
      }
    }

    if (camera.front_camera) {
      const frontVal =
        typeof camera.front_camera === "object"
          ? Object.entries(camera.front_camera)
              .map(([k, v]) => `${toNormalCase(k)}: ${formatSpecValue(v, k)}`)
              .join(" | ")
          : String(camera.front_camera);
      rows.push(["Front Camera", frontVal]);
    }

    if (camera.shooting_modes) {
      rows.push([
        "Shooting Modes",
        formatSpecValue(camera.shooting_modes, "shooting_modes"),
      ]);
    }

    if (Array.isArray(camera.features) && camera.features.length) {
      rows.push(["Features", camera.features.join(", ")]);
    }

    if (Array.isArray(camera.ai_features) && camera.ai_features.length) {
      rows.push(["AI Features", camera.ai_features.join(", ")]);
    }

    if (rows.length === 0) {
      return (
        <div className="text-center py-4 text-gray-500">
          No camera data available
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <tbody className="bg-white">
            {rows.map(([label, value], idx) => (
              <tr
                key={idx}
                className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
              >
                <td className="px-6 py-3 text-sm font-medium text-gray-600 w-1/3 align-top">
                  {label}
                </td>
                <td className="px-6 py-3 text-sm text-gray-900 w-2/3">
                  {value || "Not specified"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Get device specs
  const getDeviceSpecs = (device, section) => {
    const displaySpecs = mergeSpecObjects(
      device?.display,
      device?.display_json,
    );
    const performanceSpecs = mergeSpecObjects(
      device?.performance,
      device?.performance_json,
    );
    const cameraSpecs = mergeSpecObjects(device?.camera, device?.camera_json);
    const batterySpecs = mergeSpecObjects(
      device?.battery,
      device?.battery_json,
    );
    const networkSpecs = mergeSpecObjects(
      device?.connectivity,
      device?.connectivity_json,
      device?.network,
      device?.network_json,
      device?.ports,
    );
    const audioSpecs = mergeSpecObjects(
      device?.audio,
      device?.multimedia,
      device?.multimedia_json,
    );
    const buildSpecs = mergeSpecObjects(
      device?.build_design,
      device?.buildDesign,
    );
    const physicalSpecs = mergeSpecObjects(
      device?.physical,
      device?.physical_json,
    );
    const buildDesignSpecs = {
      protection:
        device?.display?.cover_glass ||
        buildSpecs?.front_protection ||
        buildSpecs?.protection_glass ||
        null,
      durability:
        buildSpecs?.durability ||
        buildSpecs?.military_grade_certification ||
        null,
      water_dust_resistance:
        buildSpecs?.water_dust_resistance || buildSpecs?.ip_rating || null,
      design_features: buildSpecs?.design_features || [],
    };
    const featureSpecs = {
      ai_features: collectAiFeatures(device),
      sensors: device?.sensors || null,
    };

    if (section === "overview") {
      const selectedVariant = getSelectedVariant(device);
      const launchDateRaw = device?.launch_date ?? device?.launchDate ?? null;
      const launchDateText = formatLaunchDateValue(launchDateRaw) || "N/A";
      return {
        launch_date: launchDateText,
        body: buildBodySpecValue(buildSpecs, physicalSpecs) || "N/A",
        dimensions:
          buildDimensionsSpecValue(buildSpecs, physicalSpecs) || "N/A",
        weight:
          buildWeightSpecValue(
            pickFirstRenderable(
              physicalSpecs?.weight,
              buildSpecs?.weight,
              physicalSpecs?.weight_gms,
              buildSpecs?.weight_gms,
            ),
            selectedVariant,
          ) || "N/A",
        ip_rating:
          pickFirstRenderable(
            buildSpecs?.ip_rating,
            buildSpecs?.water_dust_resistance,
            buildSpecs?.durability,
          ) || "N/A",
      };
    }

    if (section === "display") return cleanSpecs(displaySpecs);
    if (section === "camera") return cleanSpecs(cameraSpecs);
    if (section === "performance") return cleanSpecs(performanceSpecs);
    if (section === "battery") return cleanSpecs(batterySpecs);
    if (section === "network") return cleanSpecs(networkSpecs);
    if (section === "audio") return cleanSpecs(audioSpecs);
    if (section === "build_design") return cleanSpecs(buildDesignSpecs);
    if (section === "features") return cleanSpecs(featureSpecs);

    return cleanSpecs(device[section] || {});
  };

  const getRenderedCompareSpecValue = (device, sectionId, specKey) => {
    const specs = getDeviceSpecs(device, sectionId);
    const value = specs[specKey];
    const isEmpty =
      value === undefined || value === null || value === "" || value === "N/A";
    const renderedValue = isEmpty
      ? null
      : sectionId === "camera"
        ? renderCameraComparisonValue(value, specKey)
        : renderStructuredSpecValue(value, specKey);
    const missingValue = isEmpty || renderedValue === "N/A";

    return {
      missingValue,
      renderedValue,
    };
  };

  // Get selected variant for a device
  const getSelectedVariant = (device) => {
    const variantIndex = normalizeVariantIndex(
      variantSelection[device?.id] ?? device?.selectedVariantIndex ?? 0,
    );
    if (Array.isArray(device.variants) && device.variants.length > 0) {
      return device.variants[variantIndex] || device.variants[0];
    }
    return null;
  };

  useEffect(() => {
    if (!isComparing || comparedDevices.length < MIN_DEVICES) {
      setRankingByDeviceId({});
      setCompareInsights(EMPTY_COMPARE_INSIGHTS);
      setCompareDecision(EMPTY_COMPARE_DECISION);
      setCompareInsightsLoading(false);
      return;
    }

    const dedupe = new Set();
    const payloadDevices = comparedDevices
      .map((device) => {
        const productId = Number(
          device?.productId ?? device?.product_id ?? device?.id,
        );
        if (!Number.isInteger(productId) || productId <= 0) return null;
        if (dedupe.has(productId)) return null;
        dedupe.add(productId);

        const selectedIndex = Number(
          variantSelection[device.id] ?? device.selectedVariantIndex ?? 0,
        );
        const variants = Array.isArray(device?.variants) ? device.variants : [];
        const selectedVariant = variants[selectedIndex] || variants[0] || null;
        const variantId = Number(
          selectedVariant?.variant_id ?? selectedVariant?.id,
        );

        const entry = { product_id: productId };
        if (Number.isInteger(variantId) && variantId > 0) {
          entry.variant_id = variantId;
        } else if (Number.isInteger(selectedIndex) && selectedIndex >= 0) {
          entry.variant_index = selectedIndex;
        }

        return entry;
      })
      .filter(Boolean);

    if (payloadDevices.length < MIN_DEVICES) {
      setRankingByDeviceId({});
      setCompareInsights(EMPTY_COMPARE_INSIGHTS);
      setCompareDecision(EMPTY_COMPARE_DECISION);
      setCompareInsightsLoading(false);
      return;
    }

    const controller = new AbortController();
    setRankingByDeviceId({});
    setCompareInsights(EMPTY_COMPARE_INSIGHTS);
    setCompareDecision(EMPTY_COMPARE_DECISION);
    setCompareInsightsLoading(true);

    (async () => {
      try {
        const response = await fetch(`${API_BASE}/public/compare/scores`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ devices: payloadDevices }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        const rows = Array.isArray(data?.scores) ? data.scores : [];
        const nextScores = {};

        rows.forEach((row) => {
          const productId = String(row?.product_id ?? "");
          const overallScore = Number(row?.overall_score);
          if (!productId || !Number.isFinite(overallScore)) return;
          nextScores[productId] = {
            totalScore: overallScore,
            rank: Number(row?.rank ?? 0) || null,
            confidence: Number(row?.confidence ?? 0) || null,
            price:
              row?.price == null || Number.isNaN(Number(row.price))
                ? null
                : Number(row.price),
            reasons: Array.isArray(row?.reasons) ? row.reasons : [],
            breakdown:
              row?.breakdown && typeof row.breakdown === "object"
                ? row.breakdown
                : {},
            details:
              row?.details && typeof row.details === "object"
                ? row.details
                : {},
          };
        });

        if (!controller.signal.aborted) {
          setRankingByDeviceId(nextScores);
          setCompareInsights({
            scoreVersion: String(data?.score_version || "").trim(),
            productType: String(data?.product_type || "").trim(),
            overallWinner:
              data?.overall_winner && typeof data.overall_winner === "object"
                ? data.overall_winner
                : null,
            categoryWinners:
              data?.category_winners &&
              typeof data.category_winners === "object"
                ? data.category_winners
                : {},
            warnings: Array.isArray(data?.warnings) ? data.warnings : [],
          });
          setCompareDecision({
            generatedAt: String(data?.generated_at || "").trim(),
            overallVerdict:
              data?.overall_verdict && typeof data.overall_verdict === "object"
                ? data.overall_verdict
                : null,
            categoryVerdicts: Array.isArray(data?.category_verdicts)
              ? data.category_verdicts
              : [],
            keyDifferences: Array.isArray(data?.key_differences)
              ? data.key_differences
              : [],
            commonFeatures: Array.isArray(data?.common_features)
              ? data.common_features
              : [],
            upgradeStory:
              data?.upgrade_story && typeof data.upgrade_story === "object"
                ? data.upgrade_story
                : null,
            useCasePicks: Array.isArray(data?.use_case_picks)
              ? data.use_case_picks
              : [],
            priceVerdict:
              data?.price_verdict && typeof data.price_verdict === "object"
                ? data.price_verdict
                : null,
            tradeoffs: Array.isArray(data?.tradeoffs) ? data.tradeoffs : [],
            confidence:
              data?.confidence && typeof data.confidence === "object"
                ? data.confidence
                : null,
          });
          setCompareInsightsLoading(false);
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Failed to fetch compare scores:", error);
        setRankingByDeviceId({});
        setCompareInsights(EMPTY_COMPARE_INSIGHTS);
        setCompareDecision(EMPTY_COMPARE_DECISION);
        setCompareInsightsLoading(false);
      }
    })();

    return () => controller.abort();
  }, [isComparing, comparedDevices, variantSelection]);

  const getSpecHint = (sectionId, specKey) => {
    const key = String(specKey || "").toLowerCase();
    if (key.includes("processor") || key.includes("chipset")) {
      return SCORING_GLOSSARY.chipset;
    }
    if (key.includes("refresh")) {
      return SCORING_GLOSSARY.refreshRate;
    }
    if (sectionId === "display" && (key === "type" || key.includes("panel"))) {
      return SCORING_GLOSSARY.panelType;
    }
    if (key.includes("megapixel") || key.includes("resolution")) {
      return SCORING_GLOSSARY.megapixels;
    }
    if (key.includes("sensor")) {
      return SCORING_GLOSSARY.sensorCount;
    }
    if (key.includes("battery") || key.includes("capacity")) {
      return SCORING_GLOSSARY.batteryCapacity;
    }
    if (sectionId === "overview" && key === "price") {
      return SCORING_GLOSSARY.priceValue;
    }
    return null;
  };

  const parseMegapixelValue = (value) => {
    if (value == null || value === "") return null;
    if (typeof value === "number") return `${value} MP`;
    const match = String(value).match(/(\d+(?:\.\d+)?)\s*mp/i);
    return match ? `${match[1]} MP` : null;
  };

  const getQuickProcessorText = (device) =>
    device?.performance?.processor ||
    device?.performance?.chipset ||
    device?.processor ||
    "N/A";

  const getQuickDisplayText = (device) => {
    const display = device?.display || {};
    const size = display.size_inches || display.screen_size || display.size;
    const resolution = display.resolution || display.screen_resolution;

    if (size && resolution) {
      const sizeText = String(size);
      return `${sizeText.includes('"') ? sizeText : `${sizeText}"`} | ${resolution}`;
    }
    if (size) {
      const sizeText = String(size);
      return sizeText.includes('"') ? sizeText : `${sizeText}"`;
    }
    return resolution || "N/A";
  };

  const getQuickBatteryText = (device) => {
    const battery = device?.battery || {};
    const capacity =
      battery.battery_capacity_mah ||
      battery.battery_capacity ||
      battery.capacity_mah ||
      battery.capacity ||
      battery.battery ||
      null;
    if (!capacity) return battery.type || "N/A";
    const capacityText = String(capacity);
    return /mah/i.test(capacityText) ? capacityText : `${capacityText} mAh`;
  };

  const getQuickCameraText = (device) => {
    const camera = device?.camera || {};

    const directMain = parseMegapixelValue(camera.main_camera_megapixels);
    if (directMain) return directMain;

    const rear = camera.rear_camera;
    if (rear && typeof rear === "object" && !Array.isArray(rear)) {
      const rearValues = Object.values(rear);
      for (const lensSpec of rearValues) {
        if (!lensSpec) continue;
        if (typeof lensSpec === "object" && !Array.isArray(lensSpec)) {
          const nestedValue =
            lensSpec.resolution ||
            lensSpec.megapixels ||
            lensSpec.main_camera_megapixels;
          const parsedNested = parseMegapixelValue(nestedValue);
          if (parsedNested) return parsedNested;
        }
        const parsedLens = parseMegapixelValue(lensSpec);
        if (parsedLens) return parsedLens;
      }
    }

    const parsedRear = parseMegapixelValue(rear);
    if (parsedRear) return parsedRear;

    const parsedFront = parseMegapixelValue(camera.front_camera);
    if (parsedFront) return `Front ${parsedFront}`;

    return "N/A";
  };

  const sectionSpecKeys = useMemo(() => {
    const out = {};
    for (const s of SECTIONS) out[s.id] = [];
    const devicesForSpecs = isComparing ? comparedDevices : selectedDevices;
    if (devicesForSpecs.length === 0) return out;

    for (const section of SECTIONS) {
      const specKeys = new Set();
      devicesForSpecs.forEach((device) => {
        const specs = getDeviceSpecs(device, section.id);
        Object.keys(specs).forEach((key) => {
          if (hasRenderableValue(specs[key])) specKeys.add(key);
        });
      });

      const sortedKeys = Array.from(specKeys).sort((a, b) => {
        const aIndex = getOrderedSpecIndex(section.id, a);
        const bIndex = getOrderedSpecIndex(section.id, b);
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        return toNormalCase(a).localeCompare(toNormalCase(b));
      });

      out[section.id] = sortedKeys;
    }

    return out;
  }, [selectedDevices, comparedDevices, isComparing, variantSelection]);

  const visibleCompareSections = useMemo(
    () =>
      SECTIONS.filter(
        (section) => (sectionSpecKeys[section.id] || []).length > 0,
      ),
    [sectionSpecKeys],
  );

  useEffect(() => {
    setExpandedSections((prev) => {
      const next = {};

      visibleCompareSections.forEach((section) => {
        next[section.id] = prev[section.id] ?? true;
      });

      return next;
    });
  }, [visibleCompareSections]);

  const toggleCompareSection = (sectionId) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  // Open details modal
  const openDetailsModal = (device, section = "specifications") => {
    setModalDevice(device);
    setModalSection(section);
    setShowDetailsModal(true);
  };

  const makeSelectedEntry = (base, variantIndex = 0) => {
    const resolvedProductId = getResolvedProductId(base);
    const resolvedType = getResolvedProductType(base);
    const resolvedName = base?.name || base?.model || base?.title || null;
    const id = `${resolvedProductId}`;
    return {
      ...base,
      id,
      productId: resolvedProductId,
      baseId: resolvedProductId,
      productType: resolvedType,
      name: resolvedName,
      selectedVariantIndex: variantIndex,
    };
  };

  const formatVariantLabel = (variant, index) => {
    if (!variant || typeof variant !== "object") return `Variant ${index + 1}`;
    const ram = variant.ram || variant.variantRam || null;
    const storage = variant.storage || variant.variantStorage || null;
    const price =
      variant.base_price ?? variant.basePrice ?? variant.price ?? null;

    const main = [ram, storage].filter(Boolean).join(" / ");
    const priceText =
      price != null && !Number.isNaN(Number(price))
        ? ` | ${formatPrice(Number(price))}`
        : "";

    return `${main || `Variant ${index + 1}`}${priceText}`;
  };

  const formatVariantCompactLabel = (variant, index) => {
    if (!variant || typeof variant !== "object") return `Variant ${index + 1}`;
    const ram = String(variant.ram || variant.variantRam || "").trim();
    const storage = String(
      variant.storage || variant.variantStorage || "",
    ).trim();
    const main = [ram, storage].filter(Boolean).join(" + ");
    return main || `Variant ${index + 1}`;
  };

  const formatVariantPrimaryLabel = (variant, index) => {
    if (!variant || typeof variant !== "object") return `Variant ${index + 1}`;
    const ram = String(variant.ram || variant.variantRam || "").trim();
    const storage = String(
      variant.storage || variant.variantStorage || "",
    ).trim();
    return [ram, storage].filter(Boolean).join(" / ") || `Variant ${index + 1}`;
  };

  const getVariantAvailabilityLabel = (variant, device) => {
    if (!variant || typeof variant !== "object") return "Available";

    const booleanAvailability = [
      variant.in_stock,
      variant.inStock,
      variant.available,
      variant.is_available,
    ].find((value) => typeof value === "boolean");
    if (typeof booleanAvailability === "boolean") {
      return booleanAvailability ? "In stock" : "Out of stock";
    }

    const rawStatus = String(
      variant.availability ||
        variant.status ||
        variant.stock_status ||
        variant.stockStatus ||
        variant.availability_text ||
        variant.availabilityText ||
        device?.availability ||
        device?.status ||
        "",
    ).trim();

    if (rawStatus) {
      if (/(out of stock|sold out|unavailable)/i.test(rawStatus)) {
        return "Out of stock";
      }
      if (/(available|in stock|on sale|ready)/i.test(rawStatus)) {
        return "In stock";
      }
    }

    const stores = Array.isArray(variant.store_prices)
      ? variant.store_prices
      : Array.isArray(variant.storePrices)
        ? variant.storePrices
        : [];
    if (stores.length > 0) return "In stock";

    return "Available";
  };

  const getVariantAvailabilityTone = (availabilityLabel) => {
    const value = String(availabilityLabel || "")
      .trim()
      .toLowerCase();
    if (!value) return "text-slate-500";
    if (/out of stock|unavailable|sold out/.test(value)) return "text-rose-600";
    if (/in stock|available|ready/.test(value)) return "text-emerald-600";
    return "text-slate-500";
  };

  const getVariantSecondaryMeta = (variant, device) => {
    const color = String(
      variant?.color_name ||
        variant?.color ||
        variant?.colour ||
        variant?.variant_name ||
        variant?.variant_title ||
        variant?.variant_label ||
        "",
    ).trim();
    const availability = getVariantAvailabilityLabel(variant, device);
    return { color, availability };
  };

  const getCardPrice = (device, selectedVariant) => {
    const variantPrice =
      selectedVariant?.base_price ??
      selectedVariant?.price ??
      selectedVariant?.basePrice ??
      null;
    if (variantPrice && Number(variantPrice) > 0) {
      return Number(variantPrice);
    }

    const devicePrice =
      device?.price ??
      device?.base_price ??
      device?.basePrice ??
      device?.numericPrice ??
      null;
    if (devicePrice && Number(devicePrice) > 0) {
      return Number(devicePrice);
    }

    if (
      selectedVariant?.store_prices &&
      Array.isArray(selectedVariant.store_prices)
    ) {
      const storePrice = selectedVariant.store_prices
        .map((store) => Number(store.price))
        .filter((value) => value > 0)
        .sort((left, right) => left - right)[0];
      if (storePrice) return storePrice;
    }

    return null;
  };

  // Add device (base device + variantIndex)
  const addDevice = (baseDevice, variantIndex = 0) => {
    const entry = makeSelectedEntry(baseDevice, variantIndex);

    const existsInPending = selectedDevices.some(
      (s) => String(s.id) === String(entry.id),
    );
    const existsInCompared = comparedDevices.some(
      (s) => String(s.id) === String(entry.id),
    );

    if (existsInPending || existsInCompared) {
      setVariantSelection((vs) => ({ ...vs, [entry.id]: variantIndex }));
      setSelectedDevices((prev) =>
        prev.map((d) =>
          String(d.id) === String(entry.id)
            ? { ...d, selectedVariantIndex: variantIndex }
            : d,
        ),
      );
      setComparedDevices((prev) =>
        prev.map((d) =>
          String(d.id) === String(entry.id)
            ? { ...d, selectedVariantIndex: variantIndex }
            : d,
        ),
      );
      return;
    }

    // If there is already a selected device, enforce same product type
    const typeSource =
      isComparing && comparedDevices.length > 0
        ? comparedDevices
        : selectedDevices;
    const compareType = getResolvedProductType(baseDevice);
    const nextLimit =
      compareType === "smartphone"
        ? getCompareLimitForDevices([...typeSource, baseDevice])
        : MAX_DEVICES;

    if (compareType === "smartphone" && nextLimit === 0) {
      alert("Comparison is available after announcement.");
      return;
    }

    if (usedSlots >= nextLimit) {
      alert(`Maximum ${nextLimit} devices can be compared`);
      return;
    }
    if (typeSource.length > 0) {
      const existingType = getResolvedProductType(typeSource[0]);
      const newType = getResolvedProductType(baseDevice);
      if (existingType && newType && String(existingType) !== String(newType)) {
        alert(
          `Cannot compare different device types. Selected devices must all be the same type.`,
        );
        return;
      }
    }

    if (isComparing) {
      setComparedDevices((prev) => [...prev, entry].slice(0, nextLimit));
    } else {
      setSelectedDevices((prev) => [...prev, entry]);
    }
    setVariantSelection((vs) => ({ ...vs, [entry.id]: variantIndex }));
  };

  // Hydrate compare state from slug or legacy URL params.
  useEffect(() => {
    (async () => {
      try {
        if (selectedDevices.length > 0 || comparedDevices.length > 0) return;

        const params = new URLSearchParams(location.search);
        const toAdd = params.get("add");
        const devicesParam = params.get("devices");
        const forcedType = params.get("type");
        const descParam = params.get("desc");
        const routeEntries = Array.isArray(routeDeviceEntries)
          ? routeDeviceEntries
          : [];
        if (publishedCompareLoading) return;

        const getProductId = (d) =>
          d?.productId ?? d?.id ?? d?.product_id ?? null;

        const resolveDevice = async (idValue, typeValue) => {
          if (!idValue) return false;
          if (typeValue) {
            let found = null;
            try {
              found = getDevice ? getDevice(typeValue, idValue) : null;
            } catch (e) {
              found = null;
            }
            if (found) return found;
          }

          const foundAny = (availableDevices || []).find((d) => {
            const pid = String(getProductId(d) ?? "");
            return pid && String(pid) === String(idValue);
          });
          return foundAny || null;
        };

        const hydratedEntries = [];
        if (toAdd) {
          const found = await resolveDevice(toAdd, forcedType);
          const entry = toCompareSelectedEntry(found, 0);
          if (entry) hydratedEntries.push(entry);
        }

        if (devicesParam) {
          const parts = devicesParam
            .split(",")
            .map((p) => p.trim())
            .filter(Boolean);
          for (const part of parts) {
            const [idOrModel, variantIdxRaw] = part.split(":");
            const variantIdx = variantIdxRaw ? parseInt(variantIdxRaw, 10) : 0;
            const found = await resolveDevice(idOrModel, forcedType);
            const entry = toCompareSelectedEntry(found, variantIdx || 0);
            if (entry) hydratedEntries.push(entry);
          }
        }
        if (!toAdd && !devicesParam && routeEntries.length > 0) {
          for (const entry of routeEntries) {
            const found = await resolveDevice(entry.baseId, null);
            const selectedEntry = toCompareSelectedEntry(
              found,
              normalizeVariantIndex(entry.variantIndex ?? 0),
            );
            if (selectedEntry) hydratedEntries.push(selectedEntry);
          }
        }

        if (descParam) setSharedDescription(String(descParam));
        if (hydratedEntries.length >= MIN_DEVICES) {
          const deduped = [];
          const seen = new Set();
          hydratedEntries.forEach((entry) => {
            const key = String(entry.id || "");
            if (!key || seen.has(key)) return;
            seen.add(key);
            deduped.push(entry);
          });

          setComparedDevices(deduped.slice(0, MAX_DEVICES));
          setSelectedDevices([]);
          setIsComparing(true);
          setVariantSelection((prev) => {
            const next = { ...prev };
            deduped.forEach((entry) => {
              next[entry.id] = normalizeVariantIndex(
                entry.selectedVariantIndex ?? 0,
              );
            });
            return next;
          });
        } else if (hydratedEntries.length === 1) {
          setSelectedDevices(hydratedEntries);
        }

        if (location.search) {
          navigate(location.pathname, { replace: true });
        }
      } catch (err) {
        // ignore
      }
    })();
  }, [
    availableDevices,
    comparedDevices.length,
    getDevice,
    location.pathname,
    location.search,
    navigate,
    publishedCompareLoading,
    routeDeviceEntries,
    selectedDevices.length,
  ]);
  // Sync variant selection
  useEffect(() => {
    setVariantSelection((prev) => {
      const next = { ...prev };
      const all = [...comparedDevices, ...selectedDevices];
      all.forEach((d) => {
        if (d?.id == null) return;
        if (next[d.id] === undefined) next[d.id] = 0;
      });
      Object.keys(next).forEach((k) => {
        if (!all.some((d) => String(d.id) === String(k))) {
          delete next[k];
        }
      });
      return next;
    });
  }, [selectedDevices, comparedDevices]);

  // Remove pending device
  const removeDevice = (deviceId) => {
    setSelectedDevices((prev) =>
      prev.filter((d) => String(d.id) !== String(deviceId)),
    );
  };

  // Remove compared device
  const removeComparedDevice = (deviceId) => {
    setComparedDevices((prev) =>
      prev.filter((d) => String(d.id) !== String(deviceId)),
    );
  };

  // (formatPrice hoisted above)

  // Get device image
  const getPrimaryImage = (device) => {
    if (!device) return "";
    if (device.image) return device.image;
    if (Array.isArray(device.images) && device.images.length)
      return device.images[0];
    return "";
  };

  const normalizeScore100 = (value) => {
    if (value === null || value === undefined) return null;
    if (typeof value === "string" && value.trim() === "") return null;

    const n = Number(value);
    if (!Number.isFinite(n)) return null;
    if (n <= 0) return null;
    if (n <= 1) return Math.max(0, Math.min(100, n * 100));
    if (n <= 10) return Math.max(0, Math.min(100, n * 10));
    return Math.max(0, Math.min(100, n));
  };

  const pickScore100 = (...values) => {
    for (const value of values) {
      const normalized = normalizeScore100(value);
      if (normalized != null) return normalized;
    }
    return null;
  };

  const getDeviceSpecScore = (device) => {
    if (!device) return null;

    const normalizeScoreSource = (value) =>
      String(value || "")
        .trim()
        .toLowerCase();
    const resolvePersistedScore = (value, source) => {
      const normalized = normalizeScore100(value);
      if (normalized == null) return null;

      const sourceKey = normalizeScoreSource(source);
      if (sourceKey && sourceKey.includes("fallback")) {
        return null;
      }

      return normalized;
    };

    const specScoreV2Source =
      device?.spec_score_v2_source ?? device?.specScoreV2Source;
    const specScoreSource =
      device?.spec_score_source ?? device?.specScoreSource;

    const persistedSpecScore = pickScore100(
      resolvePersistedScore(device?.spec_score_v2_raw, specScoreV2Source),
      resolvePersistedScore(device?.specScoreV2Raw, specScoreV2Source),
      resolvePersistedScore(device?.spec_score_v2, specScoreV2Source),
      resolvePersistedScore(device?.specScoreV2, specScoreV2Source),
      resolvePersistedScore(device?.spec_score, specScoreSource),
      resolvePersistedScore(device?.specScore, specScoreSource),
    );

    const scoreFromDevice = pickScore100(persistedSpecScore);
    return scoreFromDevice != null ? Number(scoreFromDevice.toFixed(1)) : null;
  };

  const getCardSummary = (device, variant) => {
    const performance = mergeSpecObjects(
      device?.performance,
      device?.performance_json,
    );
    const display = mergeSpecObjects(device?.display, device?.display_json);
    const battery = mergeSpecObjects(device?.battery, device?.battery_json);

    const processorRaw = String(
      performance?.processor || performance?.chipset || "",
    )
      .replace(/\s+/g, " ")
      .trim();
    const processor = processorRaw
      ? processorRaw
          .replace(/mobile platform/i, "")
          .replace(/\s+/g, " ")
          .trim()
      : "";

    const displaySizeRaw = extractMeasurementText(
      pickFirstRenderable(
        display?.size,
        display?.screen_size,
        display?.display_size,
        display?.screenSize,
      ),
    );
    const displaySize = displaySizeRaw
      ? `${displaySizeRaw
          .replace(/"/g, "")
          .replace(/\b(inches|inch|in)\b/i, '"')
          .replace(/\s+/g, " ")
          .trim()} display`
      : "";

    const batteryRaw = extractMeasurementText(
      pickFirstRenderable(
        battery?.battery_capacity_mah,
        battery?.battery_capacity,
        battery?.capacity_mah,
        battery?.capacity,
      ),
      "mAh",
    );
    const batteryText = batteryRaw ? `${batteryRaw} battery` : "";

    const variantText = [
      variant?.ram ? `${variant.ram} RAM` : "",
      variant?.storage ? `${variant.storage}` : "",
    ]
      .filter(Boolean)
      .join(" | ");

    const parts = [variantText, processor, displaySize, batteryText]
      .filter(Boolean)
      .slice(0, 4);
    if (parts.length) return parts.join(" | ");

    return "Balanced specs for daily use";
  };

  const getCardSignalLabel = (device) => {
    const productId = getResolvedProductId(device);
    const key = productId != null ? String(productId) : null;
    if (!key) return "";

    const trend = trendSignalsByProductId[key] || {};
    const views7d = Number(trend?.views7d ?? 0);
    const trendScore = Number(trend?.trendScore ?? 0);
    const compareCount = Number(
      compareSignalsByProductId[key] ??
        device?.compare_count ??
        device?.compareCount ??
        device?.comparison_count ??
        0,
    );

    const parts = [];

    if (
      (Number.isFinite(views7d) && views7d > 0) ||
      (Number.isFinite(trendScore) && trendScore >= 70)
    ) {
      parts.push("Trending in last 7 days");
    }

    if (Number.isFinite(compareCount) && compareCount > 0) {
      if (compareCount >= 8) {
        parts.push("Most compared in last 7 days");
      } else {
        parts.push("Compared in last 7 days");
      }
    }

    return parts.join(" | ");
  };

  const clearAll = () => {
    setSelectedDevices([]);
    setComparedDevices([]);
    setIsComparing(false);
    closeCatalogModal();
    navigate("/compare", { replace: true });
  };

  const buildShareUrl = () => {
    const overviewDesc = activeDevices
      .map((d) => {
        try {
          const specs = getDeviceSpecs(d, "performance");
          const selectedVariant = getSelectedVariant(d);
          const priceLabel = formatPrice(
            selectedVariant?.base_price ||
              selectedVariant?.basePrice ||
              selectedVariant?.price ||
              d?.price ||
              0,
          );
          return `${d.name} ${specs.processor || specs.chipset || ""} ${
            priceLabel !== "N/A" ? priceLabel : ""
          }`.trim();
        } catch {
          return d.name;
        }
      })
      .filter(Boolean)
      .join(" | ");

    const fallbackDesc =
      overviewDesc.length > 240
        ? `${overviewDesc.slice(0, 237)}...`
        : overviewDesc;
    const desc =
      String(sharedDescription || "").trim() ||
      String(metaDescription || "").trim() ||
      fallbackDesc;

    const sharePath =
      publishedComparePage?.route_path ||
      (location.pathname.startsWith("/compare") ? location.pathname : "") ||
      canonicalComparePath ||
      "/compare";

    return {
      url: `${SITE_ORIGIN}${sharePath}`,
      desc,
    };
  };

  const copyToClipboard = async (text) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.top = "-9999px";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(textarea);
      return ok;
    } catch (err) {
      return false;
    }
  };

  // Share comparison
  const shareComparison = async () => {
    if (!activeDevices || activeDevices.length === 0) {
      alert("No devices selected to share");
      return;
    }

    const { url, desc } = buildShareUrl();

    if (navigator.share) {
      try {
        await navigator.share({
          title: normalizedMetaTitle || "Compare Devices",
          text: desc || "Compare these devices",
          url,
        });
        return;
      } catch (err) {
        // fall back to copy if share is cancelled or fails
      }
    }

    const copied = await copyToClipboard(url);
    if (copied) {
      alert("Comparison link copied to clipboard!");
    } else {
      alert("Unable to copy link. Please copy it from the address bar.");
    }
  };

  const querySelectedNames = useMemo(() => {
    if (!queryDeviceEntries.length || !Array.isArray(availableDevices))
      return [];

    const nameByProductId = new Map();
    (availableDevices || []).forEach((device) => {
      const productId = getResolvedProductId(device);
      const key = String(productId || "").trim();
      const name = device?.name || device?.model || device?.title || "";
      if (!key || !name || nameByProductId.has(key)) return;
      nameByProductId.set(key, name);
    });

    return queryDeviceEntries
      .map((entry) => nameByProductId.get(String(entry.baseId || "")))
      .filter(Boolean);
  }, [queryDeviceEntries, availableDevices]);

  const selectedNames = activeDevices.map((d) => d.name).filter(Boolean);
  const publishedCompareNames = Array.isArray(publishedComparePage?.items)
    ? publishedComparePage.items
        .map((item) => item?.product_name || "")
        .filter(Boolean)
    : [];
  const seoSelectedNames =
    publishedCompareNames.length > 0
      ? publishedCompareNames
      : selectedNames.length > 0
        ? selectedNames
        : querySelectedNames;

  const comparisonNames =
    seoSelectedNames.length > 0
      ? joinCompareNamesWithoutCommas(seoSelectedNames.slice(0, maxDevices))
      : canonicalCompareEntries.length > 0
        ? `Selected ${canonicalCompareEntries.length} Devices`
        : "Device Comparison";

  const currentYear = new Date().getFullYear();
  const seoSegmentLabel =
    publishedComparePage?.segment_label ||
    (getResolvedProductType(activeDevices?.[0]) === "smartphone"
      ? resolveSmartphoneSegmentLabel(
          activeDevices.length > 0 ? activeDevices : [],
        )
      : "");
  const metaTitle =
    seoSelectedNames.length > 0
      ? buildCompareTitleText({
          names: seoSelectedNames.slice(0, maxDevices),
          segmentLabel: seoSegmentLabel,
          publishedTitle: publishedComparePage?.title || "",
        })
      : canonicalCompareEntries.length > 0
        ? `Compare Selected Devices: Specs, Prices & Differences | Hooks`
        : `Compare Technology Products Side by Side | Hooks`;
  const normalizedMetaTitle = normalizeSeoTitle(metaTitle);

  const metaDescription =
    seoSelectedNames.length > 0
      ? buildCompareDescriptionText({
          names: seoSelectedNames.slice(0, maxDevices),
          segmentLabel: seoSegmentLabel,
          publishedDescription: publishedComparePage?.meta_description || "",
        })
      : canonicalCompareEntries.length > 0
        ? "Compare selected devices with detailed specifications, price, camera, display, battery, performance, software, benchmarks, and key differences on Hooks."
        : "Compare devices with detailed specifications, price, camera, display, battery, performance, software, benchmarks, and key differences on Hooks.";
  const _metaKeywords = useMemo(
    () =>
      buildListSeoKeywords({
        devices: activeDevices,
        category: "device comparison",
        currentYear,
        baseTerms: [
          "device comparison",
          "compare smartphones laptops tvs",
          "side by side specs comparison",
        ],
        contextTerms: [
          seoSelectedNames.length > 0
            ? `${comparisonNames} comparison`
            : `compare ${canonicalCompareEntries.length || 0} devices`,
        ],
        maxKeywords: 45,
      }),
    [
      activeDevices,
      currentYear,
      seoSelectedNames.length,
      comparisonNames,
      canonicalCompareEntries.length,
    ],
  );

  const compareSchemaJson = useMemo(() => {
    const schema = createWebApplicationSchema({
      name: normalizedMetaTitle,
      description: metaDescription,
      url: canonicalCompareUrl,
      applicationCategory: "UtilityApplication",
    });
    return JSON.stringify(schema);
  }, [normalizedMetaTitle, metaDescription, canonicalCompareUrl]);

  const compareItemListSchemaJson = useMemo(() => {
    if (!Array.isArray(activeDevices) || activeDevices.length < 2) return null;

    const schema = createItemListSchema({
      name: normalizedMetaTitle,
      url: canonicalCompareUrl,
      description: metaDescription,
      items: activeDevices.map((device) => ({
        name: device?.name || device?.model || device?.title || "",
        image:
          device?.image ||
          (Array.isArray(device?.images) ? device.images[0] : ""),
        url: canonicalCompareUrl,
      })),
    });
    return JSON.stringify(schema);
  }, [
    activeDevices,
    normalizedMetaTitle,
    metaDescription,
    canonicalCompareUrl,
  ]);

  const compareProductSchemasJson = useMemo(() => {
    if (!Array.isArray(activeDevices) || activeDevices.length < 2) return [];

    return activeDevices
      .map((device) => {
        const name = device?.name || device?.model || device?.title || "";
        if (!name) return null;
        const price = resolveLowestPriceForSeo(device);
        const schema = createProductSchema({
          name,
          description: `${name} price, specifications, and comparison details on Hooks.`,
          image:
            device?.image ||
            (Array.isArray(device?.images) ? device.images[0] : ""),
          url: canonicalCompareUrl,
          brand: device?.brand || "",
          price: price != null ? price : undefined,
          priceCurrency: "INR",
        });
        return JSON.stringify(schema);
      })
      .filter(Boolean);
  }, [activeDevices, canonicalCompareUrl]);

  useEffect(() => {
    if (typeof document === "undefined") return;

    document.title = normalizedMetaTitle;
    upsertMetaTag('meta[name="description"]', {
      name: "description",
      content: metaDescription,
    });
    upsertMetaTag('meta[property="og:title"]', {
      property: "og:title",
      content: normalizedMetaTitle,
    });
    upsertMetaTag('meta[property="og:description"]', {
      property: "og:description",
      content: metaDescription,
    });
    upsertMetaTag('meta[property="og:url"]', {
      property: "og:url",
      content: canonicalCompareUrl,
    });
    upsertMetaTag('meta[name="twitter:title"]', {
      name: "twitter:title",
      content: normalizedMetaTitle,
    });
    upsertMetaTag('meta[name="twitter:description"]', {
      name: "twitter:description",
      content: metaDescription,
    });
    upsertMetaTag('meta[name="twitter:url"]', {
      name: "twitter:url",
      content: canonicalCompareUrl,
    });
    upsertCanonicalLink(canonicalCompareUrl);
  }, [canonicalCompareUrl, metaDescription, normalizedMetaTitle]);

  const effectiveCatalogCategoryValue =
    catalogLockedType || catalogCategoryFilter;

  const resetCatalogFilters = () => {
    setSearchQuery("");
    setActiveQuickFilter("all");
    setSearchSort("popularity");
    setCatalogCategoryFilter("all");
    setCatalogBrandFilter("all");
    setCatalogPriceFilter("all");
    setCatalogReleaseYearFilter("all");
    setCatalogVisibleCount(6);
    requestAnimationFrame(() => {
      catalogSearchInputRef.current?.focus();
    });
  };

  const compareNavItems = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "differences", label: "Key Differences", icon: Sparkles },
    { id: "specifications", label: "All Specs", icon: Cpu },
    { id: "prices", label: "Prices", icon: FaStore },
    { id: "faqs", label: "FAQs", icon: Info },
  ];

  const getDeviceName = (device) =>
    device?.name || device?.model || device?.title || "Device";

  const getDeviceKey = (device) =>
    String(getResolvedProductId(device) ?? device?.id ?? "");

  const updateVariantSelection = (device, nextIndex) => {
    const variantIndex = normalizeVariantIndex(nextIndex);
    setVariantSelection((previous) => ({
      ...previous,
      [device.id]: variantIndex,
    }));

    const updateEntry = (entry) =>
      String(entry.id) === String(device.id)
        ? { ...entry, selectedVariantIndex: variantIndex }
        : entry;

    if (isComparing) {
      setComparedDevices((previous) => previous.map(updateEntry));
    } else {
      setSelectedDevices((previous) => previous.map(updateEntry));
    }
  };

  const getQuickChargingText = (device) => {
    const battery = mergeSpecObjects(device?.battery, device?.battery_json);
    return (
      extractMeasurementText(
        pickFirstRenderable(
          battery?.wired_charging,
          battery?.charging,
          battery?.charging_speed,
          battery?.fast_charging,
          battery?.charging_tech,
          battery?.charging_speed_watt,
          battery?.fast_charging_watt,
        ),
        "W",
      ) || "N/A"
    );
  };

  const getQuickMemoryText = (device) => {
    const variant = getSelectedVariant(device);
    const direct = [variant?.ram, variant?.storage].filter(Boolean).join(" / ");
    if (direct) return direct;

    const performance = mergeSpecObjects(
      device?.performance,
      device?.performance_json,
    );
    return (
      [performance?.ram || performance?.memory, performance?.storage]
        .filter(Boolean)
        .join(" / ") || "N/A"
    );
  };

  const getWinnerForCategory = (categoryKey) => {
    const winner = compareInsights?.categoryWinners?.[categoryKey];
    return winner?.product_id != null ? String(winner.product_id) : "";
  };

  const isCategoryWinner = (device, categoryKey) => {
    const winnerId = getWinnerForCategory(categoryKey);
    return winnerId && getDeviceRankingKeys(device).includes(winnerId);
  };

  const quickDifferenceRows = [
    {
      key: "processor",
      label: "Processor",
      category: "performance",
      getValue: getQuickProcessorText,
    },
    {
      key: "display",
      label: "Display",
      category: "display",
      getValue: getQuickDisplayText,
    },
    {
      key: "battery",
      label: "Battery",
      category: "battery",
      getValue: getQuickBatteryText,
    },
    {
      key: "charging",
      label: "Charging",
      category: "battery",
      getValue: getQuickChargingText,
    },
    {
      key: "camera",
      label: "Rear Camera",
      category: "camera",
      getValue: getQuickCameraText,
    },
    {
      key: "memory",
      label: "RAM / Storage",
      category: "memory",
      getValue: getQuickMemoryText,
    },
    {
      key: "price",
      label: "Starting Price",
      category: "priceValue",
      getValue: (device) => {
        const price = getCardPrice(device, getSelectedVariant(device));
        return price ? formatPrice(price) : "N/A";
      },
    },
  ];

  const overallWinnerDevice = activeDevices.find((device) =>
    overallWinnerId
      ? getDeviceRankingKeys(device).includes(overallWinnerId)
      : false,
  );

  const fallbackOverallWinner = [...activeDevices]
    .map((device) => ({
      device,
      score: getDeviceSpecScore(device) || 0,
    }))
    .sort((left, right) => right.score - left.score)[0]?.device;

  const resolvedOverallWinner = overallWinnerDevice || fallbackOverallWinner;

  const getDeviceCategoryLabels = (device) =>
    categoryWinnerEntries
      .filter(({ winner }) =>
        getDeviceRankingKeys(device).includes(String(winner?.product_id ?? "")),
      )
      .map((entry) => entry.summaryLabel)
      .filter(Boolean);

  const getVerdictLabel = (device) => {
    if (
      resolvedOverallWinner &&
      String(getDeviceKey(resolvedOverallWinner)) ===
        String(getDeviceKey(device))
    ) {
      return "Best overall choice";
    }

    const categories = getDeviceCategoryLabels(device);
    if (categories.length) {
      return `Best for ${categories[0].replace(/ lead| highlight/i, "")}`;
    }

    const prices = activeDevices
      .map((item) => getCardPrice(item, getSelectedVariant(item)))
      .filter((price) => Number.isFinite(price) && price > 0);
    const price = getCardPrice(device, getSelectedVariant(device));
    if (prices.length && price === Math.min(...prices)) return "Lowest price";
    return "Balanced alternative";
  };

  const buildDeviceInsights = (device) => {
    const ranking = getServerScoreEntry(device);
    const positive = [];
    const negative = [];

    (Array.isArray(ranking?.reasons) ? ranking.reasons : []).forEach(
      (reason) => {
        const text = String(reason || "").trim();
        if (!text) return;
        if (
          /lower|less|slower|smaller|heavier|weaker|behind|limited/i.test(text)
        ) {
          negative.push(text);
        } else {
          positive.push(text);
        }
      },
    );

    getDeviceCategoryLabels(device).forEach((category) => {
      positive.push(`Leads this comparison in ${category.toLowerCase()}`);
    });

    if (!positive.length) {
      const score = getDeviceSpecScore(device);
      if (score) positive.push(`${score}/100 Hooks specification score`);
      const price = getCardPrice(device, getSelectedVariant(device));
      if (price) positive.push(`Available from ${formatPrice(price)}`);
    }

    if (!negative.length) {
      const otherLeader = categoryWinnerEntries.find(
        ({ winner }) =>
          !getDeviceRankingKeys(device).includes(
            String(winner?.product_id ?? ""),
          ),
      );
      if (otherLeader?.summaryLabel) {
        negative.push(
          `Another phone leads in ${otherLeader.summaryLabel.toLowerCase()}`,
        );
      }
    }

    const firstDevice = activeDevices[0];
    const similarities = [];
    if (firstDevice && String(firstDevice.id) !== String(device.id)) {
      [
        ["Processor", getQuickProcessorText],
        ["Display", getQuickDisplayText],
        ["Battery", getQuickBatteryText],
        ["Camera", getQuickCameraText],
      ].forEach(([label, resolver]) => {
        const left = String(resolver(firstDevice) || "").toLowerCase();
        const right = String(resolver(device) || "").toLowerCase();
        if (left && right && left !== "n/a" && left === right) {
          similarities.push(
            `Same ${String(label).toLowerCase()} specification`,
          );
        }
      });
    }

    return {
      positive: Array.from(new Set(positive)).slice(0, 3),
      negative: Array.from(new Set(negative)).slice(0, 3),
      similarities: Array.from(new Set(similarities)).slice(0, 2),
    };
  };

  const getStoreRowsForDevice = (device) => {
    const selectedVariant = getSelectedVariant(device);
    const selectedVariantRows = [
      ...(Array.isArray(selectedVariant?.store_prices)
        ? selectedVariant.store_prices
        : []),
      ...(Array.isArray(selectedVariant?.storePrices)
        ? selectedVariant.storePrices
        : []),
    ];
    const sourceRows = selectedVariantRows.length
      ? selectedVariantRows
      : collectStoreRows(device);
    const seen = new Set();

    return sourceRows
      .map((store) => {
        const price = Number(store?.price);
        const storeName = String(
          store?.display_store_name ||
            store?.store_name ||
            store?.storeName ||
            store?.store ||
            "Store",
        ).trim();
        const url = store?.url || store?.affiliate_url || store?.link || "";
        return {
          storeName,
          price: Number.isFinite(price) && price > 0 ? price : null,
          url,
        };
      })
      .filter((row) => {
        const key = `${row.storeName.toLowerCase()}-${row.price || "na"}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return row.price || row.url;
      })
      .slice(0, 3);
  };

  const renderSelectorDeviceCard = (device, index) => {
    const variant = getSelectedVariant(device);
    const selectedIndex = normalizeVariantIndex(
      variantSelection[device.id] ?? device.selectedVariantIndex ?? 0,
    );
    const price = getCardPrice(device, variant);
    const variants = Array.isArray(device?.variants) ? device.variants : [];

    return (
      <article
        key={`selector-${device.id}`}
        className="relative min-w-[250px] snap-start rounded-[16px] border border-slate-200 bg-white p-3 sm:min-w-0"
      >
        <span className="absolute left-3 top-3 z-10 inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-[11px] font-black text-white">
          {index + 1}
        </span>
        <button
          type="button"
          onClick={() =>
            isComparing
              ? removeComparedDevice(device.id)
              : removeDevice(device.id)
          }
          className="absolute right-3 top-3 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
          aria-label={`Remove ${getDeviceName(device)}`}
        >
          <X className="h-3.5 w-3.5" />
        </button>

        <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-3 pt-5">
          <div className="flex h-32 items-center justify-center rounded-[12px] bg-slate-50 p-2">
            <img
              src={getPrimaryImage(device) || null}
              alt={getDeviceName(device)}
              className="h-full w-full object-contain"
            />
          </div>
          <div className="min-w-0 pt-1">
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-[10px] font-black text-blue-700">
              <span className="text-blue-600">✓</span> Selected
            </span>
            <h2 className="mt-2 line-clamp-2 text-sm font-black leading-snug text-slate-950">
              {getDeviceName(device)}
            </h2>
            <p className="mt-1 truncate text-[11px] font-medium text-slate-500">
              {variant
                ? formatVariantCompactLabel(variant, selectedIndex)
                : getQuickMemoryText(device)}
            </p>
            <p className="mt-3 text-base font-black tracking-tight text-slate-950">
              {price ? formatPrice(price) : "Price unavailable"}
            </p>
          </div>
        </div>

        {variants.length > 1 ? (
          <label className="mt-3 block">
            <span className="sr-only">Choose variant</span>
            <select
              value={selectedIndex}
              onChange={(event) =>
                updateVariantSelection(device, event.target.value)
              }
              className="h-9 w-full rounded-[9px] border border-slate-200 bg-white px-3 text-[11px] font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              {variants.map((item, variantIndex) => (
                <option
                  key={`${device.id}-variant-${variantIndex}`}
                  value={variantIndex}
                >
                  {formatVariantCompactLabel(item, variantIndex)}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </article>
    );
  };

  const categoryCounts = (availableDevices || []).reduce((acc, device) => {
    const type = getResolvedProductType(device) || "other";
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const brandCounts = (availableDevices || []).reduce((acc, device) => {
    const brand = String(device?.brand || "")
      .trim()
      .toLowerCase();
    if (brand) acc[brand] = (acc[brand] || 0) + 1;
    return acc;
  }, {});

  const getSectionRowKeys = (sectionId) => {
    const keys = Array.from(
      new Set(
        activeDevices.flatMap((device) =>
          Object.keys(getDeviceSpecs(device, sectionId) || {}),
        ),
      ),
    ).filter((key) =>
      activeDevices.some((device) =>
        hasRenderableValue(getDeviceSpecs(device, sectionId)?.[key]),
      ),
    );

    return keys.sort((left, right) => {
      const leftIndex = getOrderedSpecIndex(sectionId, left);
      const rightIndex = getOrderedSpecIndex(sectionId, right);
      if (leftIndex === -1 && rightIndex === -1) {
        return toNormalCase(left).localeCompare(toNormalCase(right));
      }
      if (leftIndex === -1) return 1;
      if (rightIndex === -1) return -1;
      return leftIndex - rightIndex;
    });
  };

  const hasModalSearchQuery = searchQuery.trim().length > 0;
  const modalSearchResults = hasModalSearchQuery
    ? filteredDevices
        .filter((item) => {
          const productId = getResolvedProductId(item?.base);
          return productId == null || !activeDeviceIdSet.has(String(productId));
        })
        .slice(0, 6)
    : [];

  const handleCatalogSelection = (item) => {
    if (!item?.base) return;
    addDevice(item.base, item.variantIndex ?? 0);
    setSearchQuery("");
    setActiveCatalogSlot((slot) =>
      Math.min(maxDevices - 1, Math.max(slot + 1, activeDevices.length + 1)),
    );
    requestAnimationFrame(() => {
      catalogSearchInputRef.current?.focus();
    });
  };

  const getResolvedComparisonScore = (device) => {
    const serverScore = Number(getServerScoreEntry(device)?.totalScore);
    if (Number.isFinite(serverScore)) return serverScore;
    const hooksScore = Number(getDeviceSpecScore(device));
    return Number.isFinite(hooksScore) ? hooksScore : null;
  };

  const formatComparisonScore = (score) => {
    if (!Number.isFinite(Number(score))) return "—";
    const numeric = Number(score);
    if (numeric <= 10) return `${numeric.toFixed(1)}/10`;
    return `${(numeric / 10).toFixed(1)}/10`;
  };

  const normalizeComparableSpecValue = (value) => {
    if (value == null || value === "" || value === "N/A") return "__na__";
    if (typeof value === "number") return String(value);
    if (typeof value === "string") {
      return value.replace(/\s+/g, " ").trim().toLowerCase();
    }
    try {
      return JSON.stringify(value);
    } catch (error) {
      return String(value);
    }
  };

  const extractFirstNumber = (value) => {
    const match = String(value ?? "")
      .replace(/,/g, "")
      .match(/-?\d+(?:\.\d+)?/);
    return match ? Number(match[0]) : null;
  };

  const clampMetricScore = (value) =>
    Math.max(
      0,
      Math.min(100, Number.isFinite(Number(value)) ? Number(value) : 0),
    );

  const getBreakdownScore = (device, keys = []) => {
    const ranking = getServerScoreEntry(device);
    const breakdown = ranking?.breakdown || {};
    const details = ranking?.details || {};

    for (const key of keys) {
      const direct = Number(breakdown?.[key]);
      if (Number.isFinite(direct)) return clampMetricScore(direct);

      const detailValue = Number(details?.[key]?.score ?? details?.[key]);
      if (Number.isFinite(detailValue)) return clampMetricScore(detailValue);
    }

    return null;
  };

  const getFallbackMetricScore = (device, category) => {
    const overall = Number(getResolvedComparisonScore(device));

    if (category === "performance") {
      return Number.isFinite(overall) ? clampMetricScore(overall) : 0;
    }

    if (category === "display") {
      const displayText = getQuickDisplayText(device);
      const refreshRate = extractFirstNumber(
        String(displayText).match(/\d+(?:\.\d+)?\s*hz/i)?.[0] || "",
      );
      const displaySize = extractFirstNumber(displayText);
      return clampMetricScore(
        (Number.isFinite(refreshRate) ? (refreshRate / 165) * 70 : 35) +
          (Number.isFinite(displaySize) ? (displaySize / 7.2) * 30 : 15),
      );
    }

    if (category === "camera") {
      const megapixels = extractFirstNumber(getQuickCameraText(device));
      return clampMetricScore(
        Number.isFinite(megapixels) ? megapixels / 2 : overall,
      );
    }

    if (category === "battery") {
      const capacity = extractFirstNumber(getQuickBatteryText(device));
      return clampMetricScore(
        Number.isFinite(capacity) ? capacity / 70 : overall,
      );
    }

    if (category === "body") {
      const overview = getDeviceSpecs(device, "overview");
      const weight = extractFirstNumber(overview?.weight);
      if (Number.isFinite(weight)) {
        return clampMetricScore(100 - Math.max(0, weight - 150) * 0.65);
      }
      return Number.isFinite(overall) ? clampMetricScore(overall) : 0;
    }

    return Number.isFinite(overall) ? clampMetricScore(overall) : 0;
  };

  const comparisonReasonDefinitions = [
    {
      id: "performance",
      label: "Performance",
      icon: Cpu,
      scoreKeys: ["performance", "gaming", "memory"],
      winnerKeys: ["performance", "gaming", "memory"],
    },
    {
      id: "camera",
      label: "Camera",
      icon: Camera,
      scoreKeys: ["camera"],
      winnerKeys: ["camera"],
    },
    {
      id: "display",
      label: "Display",
      icon: Monitor,
      scoreKeys: ["display"],
      winnerKeys: ["display"],
    },
    {
      id: "battery",
      label: "Battery",
      icon: Battery,
      scoreKeys: ["battery"],
      winnerKeys: ["battery"],
    },
    {
      id: "body",
      label: "Body",
      icon: Cube,
      scoreKeys: ["portability", "body", "design"],
      winnerKeys: ["portability", "body", "design"],
    },
  ];

  const findWinnerDeviceForKeys = (keys = []) => {
    for (const key of keys) {
      const winner = compareInsights?.categoryWinners?.[key];
      if (!winner) continue;
      const winnerId = String(winner?.product_id ?? "");
      const matched = activeDevices.find((device) =>
        getDeviceRankingKeys(device).includes(winnerId),
      );
      if (matched) return matched;
    }
    return null;
  };

  const comparisonReasonCards = comparisonReasonDefinitions.map(
    (definition) => {
      const serverWinner = findWinnerDeviceForKeys(definition.winnerKeys);
      const rows = activeDevices
        .map((device) => {
          const serverScore = getBreakdownScore(device, definition.scoreKeys);
          const value =
            serverScore == null
              ? getFallbackMetricScore(device, definition.id)
              : serverScore;
          return {
            id: getDeviceKey(device),
            device,
            name: getDeviceName(device),
            value: clampMetricScore(value),
            isServerScore: serverScore != null,
          };
        })
        .sort((left, right) => right.value - left.value);

      const fallbackWinner = rows[0]?.device || null;
      const winnerDevice = serverWinner || fallbackWinner;

      return {
        ...definition,
        winnerDevice,
        rows: rows.map((row) => ({
          ...row,
          isWinner:
            winnerDevice &&
            String(getDeviceKey(winnerDevice)) ===
              String(getDeviceKey(row.device)),
        })),
      };
    },
  );

  const comparisonTableDefinitions = [
    {
      id: "general",
      label: "General",
      winnerKeys: ["priceValue"],
      sources: [
        {
          sectionId: "overview",
          include: (key) => !["body", "dimensions", "weight"].includes(key),
        },
      ],
    },
    {
      id: "display",
      label: "Display",
      winnerKeys: ["display"],
      sources: [{ sectionId: "display" }],
    },
    {
      id: "body",
      label: "Body",
      winnerKeys: ["portability", "body", "design"],
      sources: [
        {
          sectionId: "overview",
          include: (key) => ["body", "dimensions", "weight"].includes(key),
        },
        { sectionId: "build_design" },
      ],
    },
    {
      id: "processor",
      label: "Processor",
      winnerKeys: ["performance", "gaming", "memory"],
      sources: [{ sectionId: "performance" }],
    },
    {
      id: "battery",
      label: "Battery",
      winnerKeys: ["battery"],
      sources: [{ sectionId: "battery" }],
    },
    {
      id: "camera",
      label: "Main Camera",
      winnerKeys: ["camera"],
      sources: [{ sectionId: "camera" }],
    },
    {
      id: "network",
      label: "Network",
      winnerKeys: ["connectivity", "coverage", "network"],
      sources: [{ sectionId: "network" }],
    },
    {
      id: "features",
      label: "Features",
      winnerKeys: ["features", "security", "smart"],
      sources: [{ sectionId: "features" }],
    },
    {
      id: "audio",
      label: "Audio",
      winnerKeys: ["audio"],
      sources: [{ sectionId: "audio" }],
    },
  ];

  const getComparisonTableRows = (definition) => {
    const seen = new Set();
    const rows = [];

    definition.sources.forEach((source) => {
      getSectionRowKeys(source.sectionId).forEach((specKey) => {
        if (source.include && !source.include(specKey)) return;
        const rowKey = `${source.sectionId}:${specKey}`;
        if (seen.has(rowKey)) return;
        seen.add(rowKey);

        const normalizedValues = activeDevices.map((device) =>
          normalizeComparableSpecValue(
            getDeviceSpecs(device, source.sectionId)?.[specKey],
          ),
        );
        const isCommon =
          normalizedValues.length > 1 &&
          normalizedValues.every((value) => value === normalizedValues[0]);
        if (hideCommonSpecs && isCommon) return;

        rows.push({
          rowKey,
          sectionId: source.sectionId,
          specKey,
          label: SPEC_LABEL_OVERRIDES[specKey] || toNormalCase(specKey),
        });
      });
    });

    return rows;
  };

  const comparisonTables = comparisonTableDefinitions
    .map((definition) => ({
      ...definition,
      rows: getComparisonTableRows(definition),
      winnerDevice: findWinnerDeviceForKeys(definition.winnerKeys),
    }))
    .filter((definition) => definition.rows.length > 0);

  const keySpecificationRows = quickDifferenceRows
    .filter((row) =>
      ["processor", "display", "camera", "battery", "memory", "price"].includes(
        row.key,
      ),
    )
    .filter((row) => {
      if (!hideCommonSpecs || activeDevices.length < 2) return true;
      const values = activeDevices.map((device) =>
        normalizeComparableSpecValue(row.getValue(device)),
      );
      return !values.every((value) => value === values[0]);
    });

  const compareSummaryCards = activeDevices.map((device) => {
    const selectedVariant = getSelectedVariant(device);
    const price = getCardPrice(device, selectedVariant);
    const comparisonScore = getResolvedComparisonScore(device);
    const verdict = getVerdictLabel(device);
    const isOverallWinner = resolvedOverallWinner
      ? String(getDeviceKey(resolvedOverallWinner)) ===
        String(getDeviceKey(device))
      : false;

    return {
      device,
      price,
      selectedVariant,
      comparisonScore,
      verdict,
      isOverallWinner,
    };
  });

  const STUDIO_CATEGORY_META = {
    performance: { label: "Performance", icon: Cpu },
    camera: { label: "Camera", icon: Camera },
    display: { label: "Display", icon: Monitor },
    battery: { label: "Battery", icon: Battery },
    software: { label: "Software longevity", icon: Shield },
    portability: { label: "Design & portability", icon: Cube },
    connectivity: { label: "Connectivity", icon: Signal },
    value: { label: "Value", icon: FaStore },
  };

  const findActiveDeviceByProductId = (productId) =>
    activeDevices.find((device) =>
      getDeviceRankingKeys(device).includes(String(productId ?? "")),
    ) || null;

  const getCategoryWinnerFromVerdict = (verdict) =>
    verdict?.winner_product_id != null
      ? findActiveDeviceByProductId(verdict.winner_product_id)
      : null;

  const fallbackCategoryVerdicts = comparisonReasonCards.map((card) => {
    const category = card.id === "body" ? "portability" : card.id;
    return {
      category,
      label: STUDIO_CATEGORY_META[category]?.label || card.label,
      winner_product_id: card.winnerDevice
        ? Number(getResolvedProductId(card.winnerDevice))
        : null,
      winner_name: card.winnerDevice ? getDeviceName(card.winnerDevice) : null,
      is_tie: false,
      gap:
        card.rows.length > 1
          ? Math.max(
              0,
              Number(card.rows[0]?.value || 0) -
                Number(card.rows[1]?.value || 0),
            )
          : 0,
      confidence: 0.58,
      scores: Object.fromEntries(
        card.rows.map((row) => [
          String(getResolvedProductId(row.device)),
          Math.round(row.value),
        ]),
      ),
      reason: card.winnerDevice
        ? `${getDeviceName(card.winnerDevice)} has the strongest available ${card.label.toLowerCase()} profile in this comparison.`
        : `${card.label} is closely matched with the available data.`,
    };
  });

  const priceFallbackRows = activeDevices
    .map((device) => ({
      device,
      id: String(getResolvedProductId(device)),
      price: getCardPrice(device, getSelectedVariant(device)),
      quality: Number(getResolvedComparisonScore(device)) || 55,
    }))
    .filter((row) => Number.isFinite(row.price) && row.price > 0);

  const fallbackValueVerdict = (() => {
    if (!priceFallbackRows.length) return null;
    const minPrice = Math.min(...priceFallbackRows.map((row) => row.price));
    const maxPrice = Math.max(...priceFallbackRows.map((row) => row.price));
    const scored = priceFallbackRows
      .map((row) => {
        const priceAdvantage =
          maxPrice === minPrice
            ? 50
            : ((maxPrice - row.price) / (maxPrice - minPrice)) * 100;
        return { ...row, score: row.quality * 0.72 + priceAdvantage * 0.28 };
      })
      .sort((left, right) => right.score - left.score);
    const winner = scored[0];
    return {
      category: "value",
      label: "Value",
      winner_product_id: Number(winner.id),
      winner_name: getDeviceName(winner.device),
      is_tie:
        scored.length > 1 && Math.abs(scored[0].score - scored[1].score) < 1.5,
      gap: scored.length > 1 ? Math.abs(scored[0].score - scored[1].score) : 0,
      confidence: 0.56,
      scores: Object.fromEntries(
        scored.map((row) => [row.id, Math.round(row.score)]),
      ),
      reason: `${getDeviceName(winner.device)} gives the strongest available score-to-price balance for the selected variant.`,
    };
  })();

  const resolvedCategoryVerdicts = (
    compareDecision.categoryVerdicts.length
      ? compareDecision.categoryVerdicts
      : [
          ...fallbackCategoryVerdicts,
          ...(fallbackValueVerdict ? [fallbackValueVerdict] : []),
        ]
  )
    .filter((verdict) => verdict?.category)
    .filter(
      (verdict, index, list) =>
        list.findIndex((item) => item.category === verdict.category) === index,
    );

  const fallbackKeyDifferences = quickDifferenceRows
    .map((row) => {
      const values = activeDevices.map((device) => row.getValue(device));
      const normalized = values.map(normalizeComparableSpecValue);
      if (
        normalized.length < 2 ||
        normalized.every((value) => value === normalized[0])
      ) {
        return null;
      }

      const numericValues = values.map(extractFirstNumber);
      let winnerDevice = null;
      if (
        row.key === "price" &&
        numericValues.filter(Number.isFinite).length >= 2
      ) {
        const best = Math.min(...numericValues.filter(Number.isFinite));
        winnerDevice =
          activeDevices[numericValues.findIndex((value) => value === best)] ||
          null;
      } else {
        const verdict = resolvedCategoryVerdicts.find(
          (item) =>
            item.category === row.category ||
            (row.category === "priceValue" && item.category === "value") ||
            (row.category === "memory" && item.category === "performance"),
        );
        winnerDevice = getCategoryWinnerFromVerdict(verdict);
        if (
          !winnerDevice &&
          numericValues.filter(Number.isFinite).length >= 2
        ) {
          const best = Math.max(...numericValues.filter(Number.isFinite));
          winnerDevice =
            activeDevices[numericValues.findIndex((value) => value === best)] ||
            null;
        }
      }

      const finiteValues = numericValues.filter(Number.isFinite);
      const deltaRatio =
        finiteValues.length >= 2
          ? Math.abs(Math.max(...finiteValues) - Math.min(...finiteValues)) /
            Math.max(
              1,
              Math.min(...finiteValues.map((value) => Math.abs(value))),
            )
          : 0.12;

      return {
        id: `fallback-${row.key}`,
        category:
          row.category === "priceValue"
            ? "value"
            : row.category === "memory"
              ? "performance"
              : row.category,
        property: row.label,
        values: Object.fromEntries(
          activeDevices.map((device, index) => [
            String(getResolvedProductId(device)),
            values[index],
          ]),
        ),
        winner_product_id: winnerDevice
          ? Number(getResolvedProductId(winnerDevice))
          : null,
        winner_name: winnerDevice ? getDeviceName(winnerDevice) : null,
        importance:
          deltaRatio >= 0.3 ? "high" : deltaRatio >= 0.1 ? "medium" : "low",
        difference_type: row.key === "price" ? "price" : "specification",
        explanation: winnerDevice
          ? `${getDeviceName(winnerDevice)} has the clearer ${row.label.toLowerCase()} advantage in the available data.`
          : `${row.label} differs between the selected phones.`,
      };
    })
    .filter(Boolean);

  const fallbackCommonFeatures = quickDifferenceRows
    .map((row) => {
      const values = activeDevices.map((device) => row.getValue(device));
      const normalized = values.map(normalizeComparableSpecValue);
      if (
        normalized.length < 2 ||
        !normalized.every((value) => value === normalized[0]) ||
        normalized[0] === "__na__"
      ) {
        return null;
      }
      return {
        id: `common-${row.key}`,
        category: row.category,
        property: row.label,
        value: values[0],
      };
    })
    .filter(Boolean);

  const resolvedKeyDifferences = compareDecision.keyDifferences.length
    ? compareDecision.keyDifferences
    : fallbackKeyDifferences;
  const resolvedCommonFeatures = compareDecision.commonFeatures.length
    ? compareDecision.commonFeatures
    : fallbackCommonFeatures;

  const fallbackTradeoffs = activeDevices.map((device) => {
    const productId = Number(getResolvedProductId(device));
    const categoryWins = resolvedCategoryVerdicts
      .filter((verdict) => Number(verdict.winner_product_id) === productId)
      .map((verdict) => verdict.label);
    const categoryLosses = resolvedCategoryVerdicts
      .filter(
        (verdict) =>
          verdict.winner_product_id != null &&
          Number(verdict.winner_product_id) !== productId,
      )
      .map((verdict) => verdict.label);
    const differenceWins = resolvedKeyDifferences
      .filter(
        (difference) => Number(difference.winner_product_id) === productId,
      )
      .map((difference) => difference.property);
    const differenceLosses = resolvedKeyDifferences
      .filter(
        (difference) =>
          difference.winner_product_id != null &&
          Number(difference.winner_product_id) !== productId,
      )
      .map((difference) => difference.property);
    return {
      product_id: productId,
      product_name: getDeviceName(device),
      gain: Array.from(new Set([...differenceWins, ...categoryWins])).slice(
        0,
        5,
      ),
      give_up: Array.from(
        new Set([...differenceLosses, ...categoryLosses]),
      ).slice(0, 5),
    };
  });

  const resolvedTradeoffs = compareDecision.tradeoffs.length
    ? compareDecision.tradeoffs
    : fallbackTradeoffs;

  const fallbackUseCaseDefinitions = [
    ["gaming", "Best for gaming", "performance"],
    ["photography", "Best for photography", "camera"],
    ["battery", "Best for battery life", "battery"],
    ["long_term", "Best for long-term use", "software"],
    ["compact", "Best for portability", "portability"],
    ["value", "Best value", "value"],
  ];
  const fallbackUseCasePicks = fallbackUseCaseDefinitions
    .map(([useCase, label, category]) => {
      const verdict = resolvedCategoryVerdicts.find(
        (item) => item.category === category,
      );
      const winner = getCategoryWinnerFromVerdict(verdict);
      if (!winner) return null;
      return {
        use_case: useCase,
        label,
        winner_product_id: Number(getResolvedProductId(winner)),
        winner_name: getDeviceName(winner),
        score:
          Number(verdict?.scores?.[String(getResolvedProductId(winner))]) ||
          null,
        confidence: Number(verdict?.confidence) || 0.55,
        reason:
          verdict?.reason ||
          `${getDeviceName(winner)} has the strongest ${category} profile.`,
      };
    })
    .filter(Boolean);

  const resolvedUseCasePicks = compareDecision.useCasePicks.length
    ? compareDecision.useCasePicks
    : fallbackUseCasePicks;

  const fallbackPriceVerdict = (() => {
    if (priceFallbackRows.length < 2) {
      return {
        available: false,
        label: "Insufficient current-price data",
        summary:
          "Selected-variant prices are required to judge whether the premium is worth paying.",
      };
    }
    const ordered = [...priceFallbackRows].sort(
      (left, right) => left.price - right.price,
    );
    const cheaper = ordered[0];
    const premium = ordered[ordered.length - 1];
    const difference = premium.price - cheaper.price;
    const premiumWins = resolvedCategoryVerdicts
      .filter(
        (verdict) => Number(verdict.winner_product_id) === Number(premium.id),
      )
      .map((verdict) => verdict.label);
    const cheaperWins = resolvedCategoryVerdicts
      .filter(
        (verdict) => Number(verdict.winner_product_id) === Number(cheaper.id),
      )
      .map((verdict) => verdict.label);
    return {
      available: true,
      label:
        premiumWins.length >= 3
          ? "Premium is supported by several advantages"
          : cheaperWins.length >= premiumWins.length
            ? "Better value at the lower price"
            : "Premium is partly justified",
      summary: `${getDeviceName(premium.device)} costs ${formatPrice(difference)} more than ${getDeviceName(cheaper.device)}. ${
        premiumWins.length
          ? `The extra cost mainly supports ${formatNaturalList(premiumWins.slice(0, 3)).toLowerCase()}.`
          : "The available data does not show a clear major improvement for the extra cost."
      }`,
      difference,
      percentage: (difference / cheaper.price) * 100,
      premium_product_id: Number(premium.id),
      premium_product_name: getDeviceName(premium.device),
      cheaper_product_id: Number(cheaper.id),
      cheaper_product_name: getDeviceName(cheaper.device),
      extra_cost_provides: premiumWins.slice(0, 5),
      cheaper_phone_keeps: cheaperWins.slice(0, 5),
    };
  })();
  const resolvedPriceVerdict =
    compareDecision.priceVerdict || fallbackPriceVerdict;

  const fallbackUpgradeStory = (() => {
    const dated = activeDevices
      .map((device) => ({
        device,
        time: new Date(
          device?.launch_date ?? device?.launchDate ?? "",
        ).getTime(),
      }))
      .filter((entry) => Number.isFinite(entry.time))
      .sort((left, right) => left.time - right.time);
    if (dated.length < 2) {
      return {
        available: false,
        title: "What changes when you switch?",
        summary:
          "Launch dates are incomplete, so the newer phone cannot be identified reliably.",
        major_gains: resolvedKeyDifferences
          .filter((item) => item.importance === "high")
          .slice(0, 4)
          .map((item) => item.property),
        minor_gains: resolvedKeyDifferences
          .filter((item) => item.importance !== "high")
          .slice(0, 4)
          .map((item) => item.property),
        mostly_unchanged: resolvedCommonFeatures
          .slice(0, 4)
          .map((item) => item.property),
        tradeoffs: [],
      };
    }
    const older = dated[0];
    const newer = dated[dated.length - 1];
    const gapMonths =
      Math.round(((newer.time - older.time) / 2629800000) * 10) / 10;
    const newerId = Number(getResolvedProductId(newer.device));
    const olderId = Number(getResolvedProductId(older.device));
    return {
      available: true,
      title: `What changes with ${getDeviceName(newer.device)}?`,
      summary: `${getDeviceName(newer.device)} launched about ${gapMonths} months after ${getDeviceName(older.device)}. Newer does not automatically mean better in every area.`,
      older_product_id: olderId,
      older_product_name: getDeviceName(older.device),
      newer_product_id: newerId,
      newer_product_name: getDeviceName(newer.device),
      launch_gap_months: gapMonths,
      major_gains: resolvedKeyDifferences
        .filter(
          (item) =>
            Number(item.winner_product_id) === newerId &&
            item.importance === "high",
        )
        .slice(0, 5)
        .map((item) => item.property),
      minor_gains: resolvedKeyDifferences
        .filter(
          (item) =>
            Number(item.winner_product_id) === newerId &&
            item.importance !== "high",
        )
        .slice(0, 5)
        .map((item) => item.property),
      mostly_unchanged: resolvedCommonFeatures
        .slice(0, 5)
        .map((item) => item.property),
      tradeoffs: resolvedKeyDifferences
        .filter((item) => Number(item.winner_product_id) === olderId)
        .slice(0, 5)
        .map((item) => item.property),
    };
  })();
  const resolvedUpgradeStory =
    compareDecision.upgradeStory || fallbackUpgradeStory;

  const fallbackConfidence = {
    score: compareInsights.overallWinner ? 0.68 : 0.52,
    level: compareInsights.overallWinner ? "medium" : "low",
    comparable_fields: comparisonTables.reduce(
      (sum, section) => sum + section.rows.length,
      0,
    ),
    explanation: compareInsights.overallWinner
      ? "Based on available specification scores and selected-variant prices."
      : "The server verdict is unavailable, so Hooks is showing a directional specification-based comparison.",
  };
  const resolvedConfidence = compareDecision.confidence || fallbackConfidence;

  const resolvedOverallVerdict = compareDecision.overallVerdict || {
    winner_product_id: resolvedOverallWinner
      ? Number(getResolvedProductId(resolvedOverallWinner))
      : null,
    winner_name: resolvedOverallWinner
      ? getDeviceName(resolvedOverallWinner)
      : null,
    confidence: resolvedConfidence.score,
    confidence_level: resolvedConfidence.level,
    is_close_comparison: false,
    reason:
      comparisonRecommendationText ||
      (resolvedOverallWinner
        ? `${getDeviceName(resolvedOverallWinner)} has the strongest available overall specification balance.`
        : "The available data does not support a confident overall winner."),
  };

  const decisionQuestions = [
    { id: "overall", label: "Best overall" },
    { id: "price", label: "Worth the extra price?" },
    { id: "latest", label: "Which is newer?" },
  ];

  const activeDecisionAnswer = (() => {
    if (activeDecisionQuestion === "price") {
      return {
        title: resolvedPriceVerdict?.label || "Price decision",
        copy:
          resolvedPriceVerdict?.summary ||
          "Current selected-variant prices are incomplete.",
      };
    }
    if (activeDecisionQuestion === "latest") {
      return {
        title: resolvedUpgradeStory?.title || "Which phone is newer?",
        copy:
          resolvedUpgradeStory?.summary ||
          "Launch-date information is incomplete.",
      };
    }
    return {
      title: resolvedOverallVerdict?.winner_name
        ? `${resolvedOverallVerdict.winner_name} has the overall edge`
        : "This comparison is closely matched",
      copy:
        resolvedOverallVerdict?.reason ||
        "Choose based on the categories that matter most to you.",
    };
  })();

  const devicePairs = [];
  for (let left = 0; left < activeDevices.length; left += 1) {
    for (let right = left + 1; right < activeDevices.length; right += 1) {
      devicePairs.push({ key: `${left}-${right}`, left, right });
    }
  }
  const selectedPair =
    devicePairs.find((pair) => pair.key === activeMobilePair) ||
    devicePairs[0] ||
    null;
  const focusedMobileDevices = selectedPair
    ? [
        activeDevices[selectedPair.left],
        activeDevices[selectedPair.right],
      ].filter(Boolean)
    : activeDevices.slice(0, 2);

  const getDifferenceValue = (difference, device) => {
    const productId = String(getResolvedProductId(device));
    const value = difference?.values?.[productId];
    return value == null || value === "" ? "—" : value;
  };

  const formatTradeoffItem = (item, tone = "gain") => {
    const value = String(item || "").trim();
    const key = value.toLowerCase();
    const readableLabels = {
      "current selected-variant price": {
        gain: "Better selected-variant price",
        giveup: "Higher selected-variant price",
      },
      "display refresh rate": {
        gain: "Smoother display refresh",
        giveup: "Lower refresh rate",
      },
      "peak brightness": { gain: "Brighter display", giveup: "Lower brightness" },
      "main-camera resolution": {
        gain: "Higher main-camera resolution",
        giveup: "Lower main-camera resolution",
      },
      "battery capacity": { gain: "Larger battery", giveup: "Smaller battery" },
      "wired charging": { gain: "Faster wired charging", giveup: "Slower wired charging" },
      "selected ram": { gain: "More selected RAM", giveup: "Less selected RAM" },
      "selected storage": { gain: "More selected storage", giveup: "Less selected storage" },
      weight: { gain: "Better weight balance", giveup: "Less favorable weight" },
      thickness: { gain: "Slimmer body", giveup: "Thicker body" },
      performance: { gain: "Stronger performance", giveup: "Lower performance" },
      value: { gain: "Better value score", giveup: "Lower value score" },
      "software longevity": {
        gain: "Longer software support",
        giveup: "Shorter software support",
      },
    };
    return readableLabels[key]?.[tone] || value.replace(/-/g, " ");
  };

  const getTradeoffItems = (items, fallback, tone) =>
    (Array.isArray(items) && items.length ? items : [fallback])
      .map((item) => formatTradeoffItem(item, tone))
      .filter(Boolean);
  const getStudioSectionCategory = (definitionId) => {
    const map = {
      general: "value",
      display: "display",
      body: "portability",
      processor: "performance",
      battery: "battery",
      camera: "camera",
      network: "connectivity",
      features: "software",
      audio: "connectivity",
      key: "performance",
    };
    return map[definitionId] || definitionId;
  };

  const getStudioSectionWinner = (definition) => {
    const category = getStudioSectionCategory(definition.id);
    const verdict = resolvedCategoryVerdicts.find(
      (item) => item.category === category,
    );
    return (
      getCategoryWinnerFromVerdict(verdict) || definition.winnerDevice || null
    );
  };

  const flattenStudioPropertyPairs = (value, prefix = "", depth = 0) => {
    if (value == null || value === "" || depth > 4) return [];
    if (Array.isArray(value)) {
      if (value.every((item) => item == null || typeof item !== "object")) {
        return [
          [prefix || "Details", value.map((item) => String(item)).join(", ")],
        ];
      }
      return value.flatMap((item, index) =>
        flattenStudioPropertyPairs(
          item,
          `${prefix || "Item"} ${index + 1}`,
          depth + 1,
        ),
      );
    }
    if (typeof value !== "object") {
      const formatted = formatSpecValue(value, prefix || "value");
      return [[prefix || "Details", formatted || String(value)]];
    }
    return Object.entries(value).flatMap(([key, item]) => {
      const label = toNormalCase(key);
      if (item && typeof item === "object") {
        return flattenStudioPropertyPairs(
          item,
          prefix ? `${prefix} · ${label}` : label,
          depth + 1,
        );
      }
      const formatted = formatSpecValue(item, key);
      return formatted && formatted !== "N/A"
        ? [[prefix ? `${prefix} · ${label}` : label, formatted]]
        : [];
    });
  };

  const getCameraStudioGroups = (device) => {
    const camera = getDeviceSpecs(device, "camera");
    const groupOrder = [
      "main_camera",
      "rear_camera",
      "wide_camera",
      "telephoto_camera",
      "periscope_camera",
      "ultra_wide_camera",
      "ultrawide_camera",
      "macro_camera",
      "depth_camera",
      "front_camera",
      "video_recording",
      "rear_video",
      "features",
      "camera_features",
      "ai_features",
    ];
    const entries = Object.entries(camera || {}).filter(([, value]) =>
      hasRenderableValue(value),
    );
    entries.sort(([left], [right]) => {
      const leftIndex = groupOrder.indexOf(left);
      const rightIndex = groupOrder.indexOf(right);
      if (leftIndex === -1 && rightIndex === -1)
        return left.localeCompare(right);
      if (leftIndex === -1) return 1;
      if (rightIndex === -1) return -1;
      return leftIndex - rightIndex;
    });
    return entries.map(([key, value]) => {
      const pairs = flattenStudioPropertyPairs(value, "").slice(0, 16);
      return {
        key,
        label: toNormalCase(key),
        pairs: pairs.length
          ? pairs
          : [["Details", formatSpecValue(value, key)]],
      };
    });
  };

  const sensorRows = (() => {
    const sensorsByDevice = activeDevices.map((device) =>
      flattenStudioPropertyPairs(device?.sensors || {}, "")
        .map(([label, value]) => ({ label, value }))
        .filter((item) => item.label && hasRenderableValue(item.value)),
    );
    const labels = Array.from(
      new Set(
        sensorsByDevice.flatMap((rows) => rows.map((item) => item.label)),
      ),
    );
    return labels
      .map((label) => {
        const values = sensorsByDevice.map(
          (rows) => rows.find((item) => item.label === label)?.value ?? null,
        );
        const normalized = values.map(normalizeComparableSpecValue);
        if (
          hideCommonSpecs &&
          normalized.length > 1 &&
          normalized.every((value) => value === normalized[0])
        ) {
          return null;
        }
        return {
          rowKey: `sensor:${label}`,
          sectionId: "features",
          specKey: `sensor_${label}`,
          label,
          customValues: Object.fromEntries(
            activeDevices.map((device, index) => [
              String(getResolvedProductId(device)),
              values[index],
            ]),
          ),
          groupLabel: "Sensors",
        };
      })
      .filter(Boolean);
  })();

  const studioComparisonTables = [
    {
      id: "key",
      label: "Key specifications",
      rows: keySpecificationRows.map((row) => ({
        rowKey: `key:${row.key}`,
        sectionId: "key",
        specKey: row.key,
        label: row.label,
        customResolver: row.getValue,
        category: row.category,
      })),
      winnerDevice: resolvedOverallWinner,
    },
    ...comparisonTables.map((definition) => ({
      ...definition,
      rows:
        definition.id === "features"
          ? [
              ...definition.rows.filter((row) => row.specKey !== "sensors"),
              ...sensorRows,
            ]
          : definition.rows,
      winnerDevice: getStudioSectionWinner(definition),
    })),
  ].filter(
    (definition) => definition.rows.length > 0 || definition.id === "camera",
  );

  const studioViewTargets = {
    performance: ["processor"],
    display: ["display"],
    camera: ["camera"],
    battery: ["battery"],
    connectivity: ["network"],
    all: studioComparisonTables.map((definition) => definition.id),
  };

  const visibleStudioComparisonTables =
    activeStudioView === "all"
      ? studioComparisonTables
      : studioComparisonTables.filter((definition) =>
          (studioViewTargets[activeStudioView] || []).includes(definition.id),
        );

  const selectStudioView = (viewId, shouldScroll = true) => {
    setActiveStudioView(viewId);
    const sectionIds = studioViewTargets[viewId] || [];
    if (sectionIds.length) {
      setExpandedStudioSections((previous) => ({
        ...previous,
        ...Object.fromEntries(sectionIds.map((sectionId) => [sectionId, true])),
      }));
    }
    if (!shouldScroll || typeof document === "undefined") return;
    requestAnimationFrame(() => {
      document
        .getElementById("compare-specifications")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const getStudioRowValue = (row, device) => {
    if (row.customValues) {
      const value = row.customValues[String(getResolvedProductId(device))];
      return { missingValue: !hasRenderableValue(value), renderedValue: value };
    }
    if (row.customResolver) {
      const value = row.customResolver(device);
      return { missingValue: !hasRenderableValue(value), renderedValue: value };
    }
    return getRenderedCompareSpecValue(device, row.sectionId, row.specKey);
  };

  const suggestedDevices = (availableDevices || [])
    .filter((candidate) => {
      const candidateId = String(getResolvedProductId(candidate) ?? "");
      if (!candidateId || activeDeviceIdSet.has(candidateId)) return false;
      const activeType = getResolvedProductType(activeDevices[0]);
      const candidateType = getResolvedProductType(candidate);
      return !activeType || !candidateType || activeType === candidateType;
    })
    .slice(0, 4);

  const applySuggestedComparison = (candidate) => {
    const firstDevice = activeDevices[0];
    const nextCandidate = toCompareSelectedEntry(candidate, 0);
    if (!firstDevice || !nextCandidate) return;
    setComparedDevices([firstDevice, nextCandidate]);
    setSelectedDevices([]);
    setIsComparing(true);
    setVariantSelection((previous) => ({
      ...previous,
      [nextCandidate.id]: 0,
    }));
    requestAnimationFrame(() => {
      comparisonHeroRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  const meaningfulDifferenceCount = resolvedKeyDifferences.length;
  const commonFeatureCount = resolvedCommonFeatures.length;
  const uncertainResultCount = Math.max(
    0,
    resolvedCategoryVerdicts.filter(
      (verdict) => verdict.is_tie || Number(verdict.confidence || 0) < 0.55,
    ).length + (compareInsights.warnings?.length || 0),
  );

  const comparisonPickerModal = showCatalogModal ? (
    <div
      className="hc-picker-backdrop fixed inset-0 z-[1000] flex items-end justify-center p-0 sm:items-center sm:p-5"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeCatalogModal();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="compare-picker-title"
        className="hc-picker-modal flex max-h-[100dvh] w-full flex-col overflow-hidden shadow-2xl sm:max-h-[min(820px,calc(100vh-40px))] sm:max-w-[700px] sm:rounded-[22px]"
      >
        <header className="hc-picker-header flex items-start justify-between gap-4 border-b px-4 py-4 sm:px-6 sm:py-5">
          <div>
            <h2
              id="compare-picker-title"
              className="bg-gradient-to-r from-blue-600 via-violet-500 to-orange-500 bg-clip-text text-2xl font-black tracking-[-0.03em] text-transparent sm:text-3xl"
            >
              Comparison
            </h2>
            <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
              Select two to {maxDevices} phones, then start the side-by-side
              comparison.
            </p>
          </div>
          <button
            type="button"
            onClick={closeCatalogModal}
            className="inline-flex h-11 w-11 flex-none items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
            aria-label="Close comparison picker"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="hc-picker-body min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          {Array.from({ length: maxDevices }, (_, slotIndex) => {
            const device = activeDevices[slotIndex];
            const variant = device ? getSelectedVariant(device) : null;
            const selectedIndex = device
              ? normalizeVariantIndex(
                  variantSelection[device.id] ??
                    device.selectedVariantIndex ??
                    0,
                )
              : 0;
            const isActiveEmptySlot =
              !device && activeCatalogSlot === slotIndex;

            return (
              <React.Fragment key={`picker-slot-${slotIndex}`}>
                <div className="relative">
                  {device ? (
                    <div className="flex min-h-[66px] items-center gap-3 rounded-[12px] border border-slate-200 bg-white px-3 py-2.5 shadow-[0_6px_20px_rgba(15,23,42,0.05)]">
                      <div className="flex h-11 w-10 flex-none items-center justify-center rounded-[8px] bg-slate-50 p-1">
                        <img
                          src={getPrimaryImage(device) || null}
                          alt={getDeviceName(device)}
                          className="h-full w-full object-contain"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black text-slate-950 sm:text-base">
                          {getDeviceName(device)}
                        </p>
                        <p className="mt-0.5 truncate text-[11px] font-medium text-slate-500">
                          {variant
                            ? formatVariantCompactLabel(variant, selectedIndex)
                            : getQuickMemoryText(device)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          isComparing
                            ? removeComparedDevice(device.id)
                            : removeDevice(device.id)
                        }
                        className="inline-flex h-9 w-9 flex-none items-center justify-center rounded-full text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                        aria-label={`Remove ${getDeviceName(device)}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        ref={isActiveEmptySlot ? catalogSearchInputRef : null}
                        type="search"
                        value={isActiveEmptySlot ? searchQuery : ""}
                        onFocus={() => {
                          setActiveCatalogSlot(slotIndex);
                          setSearchQuery("");
                        }}
                        onChange={(event) => {
                          setActiveCatalogSlot(slotIndex);
                          setSearchQuery(event.target.value);
                        }}
                        placeholder="Search phones for compare..."
                        autoComplete="off"
                        aria-expanded={isActiveEmptySlot && hasModalSearchQuery}
                        className={`h-14 w-full rounded-[12px] border bg-white pl-11 pr-4 text-sm font-semibold text-slate-800 outline-none transition placeholder:font-medium placeholder:text-slate-400 ${
                          isActiveEmptySlot
                            ? "border-blue-400 ring-4 ring-blue-50"
                            : "border-slate-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                        }`}
                      />

                      {isActiveEmptySlot && hasModalSearchQuery ? (
                        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-40 max-h-[270px] overflow-y-auto rounded-[12px] border border-slate-200 bg-white p-1.5 shadow-[0_20px_55px_rgba(15,23,42,0.18)]">
                          <p className="px-3 pb-1.5 pt-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                            Search results
                          </p>
                          {modalSearchResults.map((item) => {
                            const base = item.base;
                            const variantItem = item.variant;
                            const variantIndex = item.variantIndex ?? 0;
                            const productId = getResolvedProductId(base);
                            const price = getCardPrice(base, variantItem);
                            return (
                              <button
                                key={`picker-result-${productId ?? getDeviceName(base)}-${variantIndex}`}
                                type="button"
                                onClick={() => handleCatalogSelection(item)}
                                className="flex w-full items-center gap-3 rounded-[9px] px-3 py-2.5 text-left transition hover:bg-blue-50"
                              >
                                <div className="flex h-10 w-9 flex-none items-center justify-center rounded-[7px] bg-slate-50 p-1">
                                  <img
                                    src={getPrimaryImage(base) || null}
                                    alt=""
                                    className="h-full w-full object-contain"
                                  />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-bold text-slate-900">
                                    {getDeviceName(base)}
                                  </p>
                                  <p className="mt-0.5 truncate text-[10px] font-medium text-slate-500">
                                    {formatVariantCompactLabel(
                                      variantItem,
                                      variantIndex,
                                    )}
                                  </p>
                                </div>
                                <span className="flex-none text-xs font-black text-slate-700">
                                  {price ? formatPrice(price) : ""}
                                </span>
                              </button>
                            );
                          })}
                          {modalSearchResults.length === 0 ? (
                            <div className="px-4 py-8 text-center">
                              <p className="text-sm font-bold text-slate-700">
                                No phones found
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                Try another phone or brand name.
                              </p>
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>

                {slotIndex < maxDevices - 1 ? (
                  <div className="flex h-9 items-center justify-center">
                    <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full border border-slate-300 bg-white px-1 text-[10px] font-black text-slate-950">
                      VS
                    </span>
                  </div>
                ) : null}
              </React.Fragment>
            );
          })}
        </div>

        <footer className="hc-picker-footer border-t px-4 py-4 sm:px-6">
          <button
            type="button"
            onClick={startComparison}
            disabled={activeDevices.length < MIN_DEVICES}
            className={`inline-flex h-12 w-full items-center justify-center rounded-[10px] text-sm font-black transition ${
              activeDevices.length >= MIN_DEVICES
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "cursor-not-allowed bg-slate-300 text-white"
            }`}
          >
            {activeDevices.length >= MIN_DEVICES
              ? `Compare ${activeDevices.length} Phones`
              : "Select at least 2 phones"}
          </button>
          <p className="mt-2 text-center text-[11px] font-medium text-slate-500">
            {activeDevices.length >= MIN_DEVICES
              ? `You can add ${Math.max(0, maxDevices - activeDevices.length)} more phone${maxDevices - activeDevices.length === 1 ? "" : "s"}.`
              : `${MIN_DEVICES - activeDevices.length} more phone${MIN_DEVICES - activeDevices.length === 1 ? "" : "s"} needed to compare.`}
          </p>
        </footer>
      </section>
    </div>
  ) : null;

  return (
    <main className="hooks-compare-page pb-16">
      <Helmet prioritizeSeoTags>
        <title key="compare-title">{normalizedMetaTitle}</title>
        <meta
          key="compare-description"
          name="description"
          content={metaDescription}
        />
        <link
          key="compare-canonical"
          rel="canonical"
          href={canonicalCompareUrl}
        />
        <meta key="compare-og-type" property="og:type" content="website" />
        <meta
          key="compare-og-title"
          property="og:title"
          content={normalizedMetaTitle}
        />
        <meta
          key="compare-og-description"
          property="og:description"
          content={metaDescription}
        />
        <meta
          key="compare-og-url"
          property="og:url"
          content={canonicalCompareUrl}
        />
        <meta
          key="compare-twitter-card"
          name="twitter:card"
          content="summary"
        />
        <meta
          key="compare-twitter-title"
          name="twitter:title"
          content={normalizedMetaTitle}
        />
        <meta
          key="compare-twitter-description"
          name="twitter:description"
          content={metaDescription}
        />
        <meta
          key="compare-twitter-url"
          name="twitter:url"
          content={canonicalCompareUrl}
        />
        {compareSchemaJson ? (
          <script type="application/ld+json">{compareSchemaJson}</script>
        ) : null}
        {compareItemListSchemaJson ? (
          <script type="application/ld+json">
            {compareItemListSchemaJson}
          </script>
        ) : null}
        {compareProductSchemasJson.map((json, index) => (
          <script
            key={`compare-product-schema-${index}`}
            type="application/ld+json"
          >
            {json}
          </script>
        ))}
      </Helmet>

      <div className="hc-shell pt-5 lg:pt-7">
        <nav className="flex items-center gap-2 overflow-x-auto whitespace-nowrap text-xs font-semibold text-slate-500 hide-scrollbar">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="hover:text-blue-600"
          >
            Home
          </button>
          <ChevronRight className="h-3 w-3 text-slate-300" />
          <span className="text-blue-600">Compare</span>
        </nav>

        <header className="hc-section flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="hc-eyebrow">Hooks comparison intelligence</p>
            <h1 className="hc-heading">Compare smartphones side by side</h1>
            <p className="hc-copy">
              {isComparing && activeDevices.length >= MIN_DEVICES
                ? `${activeDevices.map((device) => getDeviceName(device)).join(" vs ")} — compare price, performance, camera, battery, launch timing and complete specifications in one decision-focused view.`
                : "Select two to four phones. Hooks will explain meaningful differences, the newer choice, category leaders, price value and the trade-offs you make."}
            </p>
          </div>

          <div className="hc-top-actions">
            {isComparing && activeDevices.length < maxDevices ? (
              <button
                type="button"
                onClick={() => openCatalogPanel(activeDevices.length)}
                className="hc-action hc-action--primary"
              >
                <Plus className="h-3.5 w-3.5" /> Add phone
              </button>
            ) : null}
            {activeDevices.length > 0 ? (
              <button
                type="button"
                onClick={shareComparison}
                className="hc-action"
              >
                <Share2 className="h-3.5 w-3.5" /> Share
              </button>
            ) : null}
            {activeDevices.length > 0 ? (
              <button type="button" onClick={clearAll} className="hc-action">
                <Trash2 className="h-3.5 w-3.5" /> Clear
              </button>
            ) : null}
          </div>
        </header>

        {!isComparing ? (
          <section className="hc-section hc-card hc-setup">
            <div className="hc-setup-grid">
              {Array.from({ length: maxDevices }, (_, slotIndex) => {
                const device = activeDevices[slotIndex];
                if (!device) {
                  return (
                    <div key={`setup-slot-${slotIndex}`} className="hc-slot">
                      <button
                        type="button"
                        onClick={() => openCatalogPanel(slotIndex)}
                        className="hc-slot-add"
                      >
                        <span>
                          <span className="hc-slot-add__icon">
                            <Plus className="h-6 w-6" />
                          </span>
                          <strong className="block text-sm font-black text-slate-900">
                            Add phone {slotIndex + 1}
                          </strong>
                          <span className="mt-1 block text-xs text-slate-500">
                            Search by phone or brand
                          </span>
                        </span>
                      </button>
                    </div>
                  );
                }

                const variant = getSelectedVariant(device);
                const selectedIndex = normalizeVariantIndex(
                  variantSelection[device.id] ??
                    device.selectedVariantIndex ??
                    0,
                );
                const variants = Array.isArray(device?.variants)
                  ? device.variants
                  : [];
                const price = getCardPrice(device, variant);
                return (
                  <article
                    key={`setup-device-${device.id}`}
                    className="hc-slot hc-slot--filled"
                  >
                    <button
                      type="button"
                      onClick={() => removeDevice(device.id)}
                      className="hc-device__remove"
                      aria-label={`Remove ${getDeviceName(device)}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                    <div className="hc-device__image !h-[122px] !pt-2">
                      <img
                        src={getPrimaryImage(device) || null}
                        alt={getDeviceName(device)}
                      />
                    </div>
                    <h2 className="hc-device__name !min-h-0 !text-sm">
                      {getDeviceName(device)}
                    </h2>
                    <p className="hc-device__price !text-base">
                      {price ? formatPrice(price) : "Price unavailable"}
                    </p>
                    {variants.length > 1 ? (
                      <select
                        value={selectedIndex}
                        onChange={(event) =>
                          updateVariantSelection(device, event.target.value)
                        }
                      >
                        {variants.map((item, index) => (
                          <option
                            key={`${device.id}-setup-variant-${index}`}
                            value={index}
                          >
                            {formatVariantCompactLabel(item, index)}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="mt-2 text-[11px] font-semibold text-slate-500">
                        {variant
                          ? formatVariantCompactLabel(variant, selectedIndex)
                          : getQuickMemoryText(device)}
                      </p>
                    )}
                  </article>
                );
              })}
            </div>

            <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                <Info className="h-3.5 w-3.5 text-blue-600" /> Select at least
                two phones. Every result updates when the selected variant
                changes.
              </p>
              <div className="flex flex-wrap gap-2">
                {activeDevices.length < maxDevices ? (
                  <button
                    type="button"
                    onClick={() => openCatalogPanel(activeDevices.length)}
                    className="hc-action"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add phone
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={startComparison}
                  disabled={activeDevices.length < MIN_DEVICES}
                  className={`hc-action hc-action--primary ${activeDevices.length < MIN_DEVICES ? "cursor-not-allowed opacity-45" : ""}`}
                >
                  Compare {Math.max(MIN_DEVICES, activeDevices.length)} phones
                </button>
              </div>
            </div>
          </section>
        ) : null}
      </div>

      {isComparing && activeDevices.length >= MIN_DEVICES ? (
        <>
          <section
            ref={comparisonHeroRef}
            className="hc-shell hc-section hc-stage"
            id="compare-spec-workspace"
          >
            <div
              className="hc-stage-grid"
              style={{ "--hc-device-count": Math.max(2, activeDevices.length) }}
            >
              {compareSummaryCards.map(
                (
                  {
                    device,
                    price,
                    selectedVariant,
                    comparisonScore,
                    isOverallWinner,
                  },
                  deviceIndex,
                ) => {
                  const selectedIndex = normalizeVariantIndex(
                    variantSelection[device.id] ??
                      device.selectedVariantIndex ??
                      0,
                  );
                  const variants = Array.isArray(device?.variants)
                    ? device.variants
                    : [];
                  return (
                    <article
                      key={`studio-device-${device.id}`}
                      className={`hc-device ${isOverallWinner ? "hc-device--winner" : ""} ${deviceIndex < compareSummaryCards.length - 1 ? "hc-device--with-vs" : ""}`}
                    >
                      <span className="hc-device__index">
                        {deviceIndex + 1}
                      </span>
                      {isOverallWinner ? (
                        <span className="hc-device__badge">
                          <FaTrophy className="h-3 w-3" /> Best overall
                        </span>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => removeComparedDevice(device.id)}
                        className="hc-device__remove"
                        aria-label={`Remove ${getDeviceName(device)}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                      <div className="hc-device__main">
                        <div className="hc-device__image">
                          <img
                            src={getPrimaryImage(device) || null}
                            alt={getDeviceName(device)}
                          />
                        </div>
                        <div className="hc-device__details">
                          <p className="hc-device__brand">
                            {String(
                              device?.brand ||
                                device?.manufacturer ||
                                "Smartphone",
                            )}
                          </p>
                          <h3 className="hc-device__name">
                            {getDeviceName(device)}
                          </h3>
                          <p className="hc-device__variant">
                            {selectedVariant
                              ? formatVariantCompactLabel(
                                  selectedVariant,
                                  selectedIndex,
                                )
                              : getQuickMemoryText(device)}
                          </p>
                          <p className="hc-device__price">
                            {price ? formatPrice(price) : "Price unavailable"}
                          </p>
                          <div className="hc-device__score">
                            <strong>
                              {formatComparisonScore(comparisonScore)}
                            </strong>
                            <span>Hooks score</span>
                          </div>
                        </div>
                      </div>
                      {variants.length > 1 ? (
                        <select
                          value={selectedIndex}
                          onChange={(event) =>
                            updateVariantSelection(device, event.target.value)
                          }
                          aria-label={`Change ${getDeviceName(device)} variant`}
                        >
                          {variants.map((item, index) => (
                            <option
                              key={`${device.id}-studio-variant-${index}`}
                              value={index}
                            >
                              {formatVariantCompactLabel(item, index)}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openCatalogPanel(deviceIndex)}
                          className="hc-device__change"
                        >
                          Change phone
                        </button>
                      )}
                    </article>
                  );
                },
              )}
            </div>
          </section>

          <div
            className={`hc-compare-toolbar ${showStickyCompareBar ? "is-condensed" : ""}`}
          >
            <div className="hc-shell hc-compare-toolbar__inner">
              <label className="hc-toggle hc-toolbar-toggle">
                <input
                  type="checkbox"
                  checked={hideCommonSpecs}
                  onChange={(event) => setHideCommonSpecs(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                Hide common features
              </label>
              <nav className="hc-view-tabs" aria-label="Comparison categories">
                {COMPARE_VIEW_TABS.map((tab) => {
                  const TabIcon = tab.icon;
                  const active = activeStudioView === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => selectStudioView(tab.id)}
                      className={`hc-view-tab ${active ? "is-active" : ""}`}
                    >
                      <TabIcon className="h-4 w-4" /> {tab.label}
                    </button>
                  );
                })}
              </nav>
              <div
                className="hc-toolbar-devices"
                aria-hidden={!showStickyCompareBar}
              >
                {showStickyCompareBar
                  ? activeDevices.map((device) => (
                      <span
                        key={`toolbar-device-${device.id}`}
                        className="hc-toolbar-device"
                      >
                        <img src={getPrimaryImage(device) || null} alt="" />
                        <span>{getDeviceName(device)}</span>
                      </span>
                    ))
                  : null}
              </div>
            </div>
          </div>

          <section
            className="hc-shell hc-section hc-analysis-grid"
            id="compare-overview"
          >
            <article className="hc-verdict-card">
              <div className="hc-verdict-card__art">
                <FaTrophy className="h-16 w-16" />
              </div>
              <div className="hc-verdict-card__content">
                <p className="hc-eyebrow">Hooks comparison verdict</p>
                <span className="hc-verdict-badge">Best overall</span>
                <h2>
                  {resolvedOverallWinner
                    ? getDeviceName(resolvedOverallWinner)
                    : activeDecisionAnswer.title}
                </h2>
                <p>{activeDecisionAnswer.copy}</p>
                <div className="hc-question-tabs">
                  {decisionQuestions.map((question) => (
                    <button
                      key={question.id}
                      type="button"
                      onClick={() => setActiveDecisionQuestion(question.id)}
                      className={`hc-question-tab ${activeDecisionQuestion === question.id ? "hc-question-tab--active" : ""}`}
                    >
                      {question.label}
                    </button>
                  ))}
                </div>
                {compareInsightsLoading ? (
                  <p className="hc-recalculating">
                    Recalculating with the selected variants…
                  </p>
                ) : null}
              </div>
            </article>

            <article className="hc-reasons-panel">
              <div className="hc-section-title hc-section-title--compact">
                <div>
                  <p className="hc-eyebrow">Reasons to consider</p>
                  <h2>Category leaders at a glance</h2>
                </div>
              </div>
              <div className="hc-reason-grid">
                {comparisonReasonCards.slice(0, 5).map((card) => {
                  const CardIcon = card.icon || Info;
                  const leadingRow = card.rows[0];
                  const leader = card.winnerDevice || leadingRow?.device;
                  const leaderScore =
                    card.rows.find(
                      (row) =>
                        leader &&
                        String(getDeviceKey(row.device)) ===
                          String(getDeviceKey(leader)),
                    )?.value ??
                    leadingRow?.value ??
                    0;
                  return (
                    <div
                      key={`reason-card-${card.id}`}
                      className="hc-reason-card"
                    >
                      <div className="hc-reason-card__icon">
                        <CardIcon className="h-4 w-4" />
                      </div>
                      <p className="hc-reason-card__label">{card.label}</p>
                      <strong>
                        {(leaderScore <= 10
                          ? leaderScore
                          : leaderScore / 10
                        ).toFixed(1)}
                        <span>/10</span>
                      </strong>
                      <p className="hc-reason-card__winner">
                        {leader ? getDeviceName(leader) : "Closely matched"}
                      </p>
                      <span className="hc-reason-card__track">
                        <i
                          style={{
                            width: `${Math.max(4, Math.min(100, leaderScore))}%`,
                          }}
                        />
                      </span>
                    </div>
                  );
                })}
              </div>
            </article>
          </section>

          <section
            className="hc-shell hc-section hc-card hc-key-specs"
            id="compare-key-specifications"
          >
            <div className="hc-key-specs__head">
              <div>
                <p className="hc-eyebrow">Key specifications</p>
                <h2>Important differences in one scan</h2>
              </div>
              <div className="hc-stage-metrics">
                <span>
                  <strong>{meaningfulDifferenceCount}</strong> differences
                </span>
                <span>
                  <strong>{commonFeatureCount}</strong> shared
                </span>
                <span>
                  <strong>{uncertainResultCount}</strong> uncertain
                </span>
              </div>
            </div>
            <div className="hc-key-table-wrap">
              <table className="hc-key-table">
                <thead>
                  <tr>
                    <th colSpan="2">Specification</th>
                    {activeDevices.map((device) => (
                      <th key={`key-head-${device.id}`}>
                        <div className="hc-key-phone">
                          <img src={getPrimaryImage(device) || null} alt="" />
                          <span>
                            <strong>{getDeviceName(device)}</strong>
                            <small>{getQuickMemoryText(device)}</small>
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {keySpecificationRows.map((row, rowIndex) => {
                    const category =
                      row.category === "priceValue"
                        ? "value"
                        : row.category === "memory"
                          ? "performance"
                          : row.category;
                    const categoryMeta = STUDIO_CATEGORY_META[category] || {
                      label: toNormalCase(category),
                      icon: Info,
                    };
                    const CategoryIcon = categoryMeta.icon || Info;
                    const previousCategoryRaw =
                      keySpecificationRows[rowIndex - 1]?.category;
                    const previousCategory =
                      previousCategoryRaw === "priceValue"
                        ? "value"
                        : previousCategoryRaw === "memory"
                          ? "performance"
                          : previousCategoryRaw;
                    const showCategory =
                      rowIndex === 0 || previousCategory !== category;
                    const categoryRowCount = keySpecificationRows.filter(
                      (candidate) => {
                        const candidateCategory =
                          candidate.category === "priceValue"
                            ? "value"
                            : candidate.category === "memory"
                              ? "performance"
                              : candidate.category;
                        return candidateCategory === category;
                      },
                    ).length;
                    const verdict = resolvedCategoryVerdicts.find(
                      (item) => item.category === category,
                    );
                    const winnerDevice = getCategoryWinnerFromVerdict(verdict);
                    return (
                      <tr key={`key-row-${row.key}`} data-category={categoryMeta.label}>
                        {showCategory ? (
                          <th
                            rowSpan={categoryRowCount}
                            className="hc-key-category"
                          >
                            <CategoryIcon className="h-4 w-4" />
                            <span>{categoryMeta.label}</span>
                          </th>
                        ) : null}
                        <th className="hc-key-property">{row.label}</th>
                        {activeDevices.map((device) => {
                          const value = row.getValue(device);
                          const isWinner =
                            winnerDevice &&
                            String(getDeviceKey(winnerDevice)) ===
                              String(getDeviceKey(device));
                          return (
                            <td
                              key={`key-value-${row.key}-${device.id}`}
                              data-device={getDeviceName(device)}
                              className={isWinner ? "is-winner" : ""}
                            >
                              {hasRenderableValue(value) ? (
                                value
                              ) : (
                                <span className="text-slate-300">—</span>
                              )}
                              {isWinner ? (
                                <span
                                  className="hc-key-win-dot"
                                  title="Category leader"
                                >
                                  ✓
                                </span>
                              ) : null}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="hc-key-legend">
              <span>✓</span> marks the category leader based on the current
              compare response and selected variants.
            </p>
          </section>

          {resolvedKeyDifferences.length ? (
            <section className="hc-shell hc-section hc-card rounded-[20px] p-4 sm:p-5">
              <div className="hc-section-title">
                <div>
                  <p className="hc-eyebrow">Meaningful differences</p>
                  <h2>What actually changes</h2>
                  <p>
                    High-impact differences appear first. Camera megapixels are
                    described as listed resolution, not treated as complete
                    image-quality proof.
                  </p>
                </div>
              </div>
              <div className="grid gap-3 lg:grid-cols-2">
                {resolvedKeyDifferences.slice(0, 10).map((difference) => {
                  const winner = findActiveDeviceByProductId(
                    difference.winner_product_id,
                  );
                  return (
                    <article
                      key={
                        difference.id ||
                        `${difference.category}-${difference.property}`
                      }
                      className="rounded-[14px] border border-slate-200 bg-slate-50/70 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.13em] text-blue-600">
                            {difference.importance || "medium"} impact
                          </p>
                          <h3 className="mt-1 text-sm font-black text-slate-950">
                            {difference.property}
                          </h3>
                        </div>
                        {winner ? (
                          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-black text-blue-700">
                            {getDeviceName(winner)} leads
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {activeDevices.slice(0, 4).map((device) => (
                          <div
                            key={`${difference.id}-${getResolvedProductId(device)}`}
                            className="rounded-[9px] bg-white px-3 py-2"
                          >
                            <p className="truncate text-[9px] font-black uppercase tracking-[0.08em] text-slate-400">
                              {getDeviceName(device)}
                            </p>
                            <p className="mt-1 text-xs font-bold text-slate-800">
                              {getDifferenceValue(difference, device)}
                            </p>
                          </div>
                        ))}
                      </div>
                      <p className="mt-3 text-xs leading-5 text-slate-600">
                        {difference.explanation}
                      </p>
                    </article>
                  );
                })}
              </div>
            </section>
          ) : null}

          {resolvedUseCasePicks.length ? (
            <section className="hc-shell hc-section">
              <div className="hc-section-title">
                <div>
                  <p className="hc-eyebrow">User-fit picks</p>
                  <h2>Choose by the way you use your phone</h2>
                  <p>
                    Hooks translates category scores into common buying goals
                    and only shows recommendations supported by available data.
                  </p>
                </div>
              </div>
              <div className="hc-goal-grid">
                {resolvedUseCasePicks.slice(0, 7).map((pick) => (
                  <article
                    key={pick.use_case || pick.label}
                    className="hc-goal"
                  >
                    <p className="hc-goal__label">{pick.label}</p>
                    <h3>
                      {pick.winner_name ||
                        getDeviceName(
                          findActiveDeviceByProductId(pick.winner_product_id),
                        )}
                    </h3>
                    <p>{pick.reason}</p>
                    {Number.isFinite(Number(pick.score)) ? (
                      <p className="!mt-3 font-black text-blue-600">
                        Hooks fit score {Math.round(Number(pick.score))}
                      </p>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          <section className="hc-shell hc-section hc-story-grid">
            <article className="hc-card hc-story">
              <p className="hc-eyebrow">Upgrade / switch story</p>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.035em] text-slate-950">
                {resolvedUpgradeStory?.title || "What changes when you switch?"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {resolvedUpgradeStory?.summary}
              </p>
              {resolvedUpgradeStory?.older_product_name &&
              resolvedUpgradeStory?.newer_product_name ? (
                <div className="hc-timeline">
                  <span className="hc-timeline__node">
                    {resolvedUpgradeStory.older_product_name}
                  </span>
                  <span className="hc-timeline__gap">
                    {resolvedUpgradeStory.launch_gap_months || "—"} months
                  </span>
                  <span className="hc-timeline__node">
                    {resolvedUpgradeStory.newer_product_name}
                  </span>
                </div>
              ) : null}
              <div className="hc-story-columns">
                <div className="hc-story-list">
                  <h4>Major gains</h4>
                  <ul>
                    {(resolvedUpgradeStory?.major_gains?.length
                      ? resolvedUpgradeStory.major_gains
                      : ["No major gain is confirmed with current data"]
                    ).map((item) => (
                      <li key={`major-${item}`}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="hc-story-list">
                  <h4>Smaller gains</h4>
                  <ul>
                    {(resolvedUpgradeStory?.minor_gains?.length
                      ? resolvedUpgradeStory.minor_gains
                      : ["No smaller gain identified"]
                    ).map((item) => (
                      <li key={`minor-${item}`}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="hc-story-list">
                  <h4>Mostly unchanged</h4>
                  <ul>
                    {(resolvedUpgradeStory?.mostly_unchanged?.length
                      ? resolvedUpgradeStory.mostly_unchanged
                      : ["No fully matched key feature identified"]
                    ).map((item) => (
                      <li key={`same-${item}`}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="hc-story-list">
                  <h4>Trade-offs</h4>
                  <ul>
                    {(resolvedUpgradeStory?.tradeoffs?.length
                      ? resolvedUpgradeStory.tradeoffs
                      : ["No clear regression identified"]
                    ).map((item) => (
                      <li key={`trade-${item}`}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>

            <article className="hc-card hc-price-card">
              <p className="hc-eyebrow">Price decision</p>
              <p className="hc-price-number">
                {resolvedPriceVerdict?.available &&
                Number.isFinite(Number(resolvedPriceVerdict.difference))
                  ? formatPrice(resolvedPriceVerdict.difference)
                  : "Price data needed"}
              </p>
              <span className="hc-price-label">
                {resolvedPriceVerdict?.label || "Selected-variant comparison"}
              </span>
              <p className="mt-4">{resolvedPriceVerdict?.summary}</p>
              {resolvedPriceVerdict?.extra_cost_provides?.length ? (
                <div className="mt-4 border-t border-slate-200 pt-4">
                  <h4 className="text-xs font-black text-slate-900">
                    What the extra cost provides
                  </h4>
                  <ul className="mt-2 space-y-1.5 text-xs text-slate-600">
                    {resolvedPriceVerdict.extra_cost_provides.map((item) => (
                      <li key={`premium-${item}`}>+ {item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </article>
          </section>

          <section className="hc-shell hc-section hc-tradeoffs-section">
            <div className="hc-section-title">
              <div>
                <p className="hc-eyebrow">Gain / give up</p>
                <h2>The trade-off behind each choice</h2>
                <p>
                  Clear wins and compromises for each selected phone, based on
                  the current variants in this comparison.
                </p>
              </div>
            </div>
            <div className="hc-tradeoff-grid">
              {resolvedTradeoffs.map((tradeoff) => {
                const device = findActiveDeviceByProductId(tradeoff.product_id);
                if (!device) return null;
                const gainItems = getTradeoffItems(
                  tradeoff.gain,
                  "Balanced everyday experience",
                  "gain",
                );
                const giveUpItems = getTradeoffItems(
                  tradeoff.give_up,
                  "No major verified compromise",
                  "giveup",
                );
                return (
                  <article
                    key={`tradeoff-${tradeoff.product_id}`}
                    className="hc-tradeoff"
                  >
                    <div className="hc-tradeoff__head">
                      <span className="hc-tradeoff__thumb">
                        <img src={getPrimaryImage(device) || null} alt="" />
                      </span>
                      <div className="hc-tradeoff__title">
                        <p className="hc-tradeoff__eyebrow">
                          Choose this phone
                        </p>
                        <h3>{getDeviceName(device)}</h3>
                        <p>
                          {gainItems.length} gain{gainItems.length === 1 ? "" : "s"}
                          {" / "}
                          {giveUpItems.length} give-up
                          {giveUpItems.length === 1 ? "" : "s"}
                        </p>
                      </div>
                    </div>
                    <div className="hc-tradeoff__body">
                      <div className="hc-tradeoff__column hc-gain">
                        <h4>
                          <span>You gain</span>
                          <small>{gainItems.length}</small>
                        </h4>
                        <ul>
                          {gainItems.map((item) => (
                            <li key={`gain-${tradeoff.product_id}-${item}`}>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="hc-tradeoff__column hc-giveup">
                        <h4>
                          <span>You give up</span>
                          <small>{giveUpItems.length}</small>
                        </h4>
                        <ul>
                          {giveUpItems.map((item) => (
                            <li key={`give-${tradeoff.product_id}-${item}`}>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="hc-shell hc-section hc-confidence">
            <div className="hc-confidence__signal" aria-hidden="true">
              {Array.from({ length: 5 }, (_, index) => (
                <i
                  key={`confidence-dot-${index}`}
                  className={
                    index <
                    Math.round(Number(resolvedConfidence?.score || 0.5) * 5)
                      ? "is-active"
                      : ""
                  }
                />
              ))}
            </div>
            <div>
              <p className="hc-eyebrow">
                {String(resolvedConfidence?.level || "medium").toUpperCase()}
                -confidence verdict
              </p>
              <h2 className="mt-1 text-lg font-black text-slate-950">
                Based on {resolvedConfidence?.comparable_fields || 0} comparable
                fields
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                {resolvedConfidence?.explanation}
              </p>
              {compareInsights.warnings?.length ? (
                <p className="mt-2 text-xs font-semibold text-amber-700">
                  {compareInsights.warnings.join(" ")}
                </p>
              ) : null}
            </div>
          </section>

          <section
            className="hc-shell hc-section hc-card hc-spec"
            id="compare-specifications"
          >
            <div className="hc-spec__toolbar">
              <div>
                <p className="hc-eyebrow">Full comparison explorer</p>
                <h2 className="mt-1 text-2xl font-black tracking-[-0.035em] text-slate-950">
                  Inspect every available detail
                </h2>
              </div>
              <label className="hc-toggle">
                <input
                  type="checkbox"
                  checked={hideCommonSpecs}
                  onChange={(event) => setHideCommonSpecs(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />{" "}
                Hide shared
              </label>
            </div>
            <div className="hc-spec-view-tabs">
              {COMPARE_VIEW_TABS.map((tab) => {
                const TabIcon = tab.icon;
                return (
                  <button
                    key={`spec-tab-${tab.id}`}
                    type="button"
                    onClick={() => selectStudioView(tab.id, false)}
                    className={`hc-spec-view-tab ${activeStudioView === tab.id ? "is-active" : ""}`}
                  >
                    <TabIcon className="h-3.5 w-3.5" /> {tab.label}
                  </button>
                );
              })}
            </div>

            {devicePairs.length > 1 ? (
              <div className="hc-mobile-pairs">
                {devicePairs.map((pair) => (
                  <button
                    key={pair.key}
                    type="button"
                    onClick={() => setActiveMobilePair(pair.key)}
                    className={`hc-mobile-pair ${(selectedPair?.key || devicePairs[0]?.key) === pair.key ? "is-active" : ""}`}
                  >
                    {getDeviceName(activeDevices[pair.left])} vs{" "}
                    {getDeviceName(activeDevices[pair.right])}
                  </button>
                ))}
              </div>
            ) : null}

            <div>
              {visibleStudioComparisonTables.map((definition) => {
                const isExpanded = Boolean(
                  expandedStudioSections[definition.id],
                );
                const winner =
                  definition.winnerDevice || getStudioSectionWinner(definition);
                return (
                  <article
                    key={`studio-spec-${definition.id}`}
                    className="hc-spec-section"
                    id={`compare-${definition.id}`}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedStudioSections((previous) => ({
                          ...previous,
                          [definition.id]: !previous[definition.id],
                        }))
                      }
                      className="hc-spec-section__button"
                    >
                      <div>
                        <h3>{definition.label}</h3>
                        {winner ? (
                          <span className="hc-spec-section__winner">
                            Hooks lead · {getDeviceName(winner)}
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold text-slate-500">
                            No confident standalone winner
                          </span>
                        )}
                      </div>
                      <ChevronDown
                        className={`h-4 w-4 text-slate-500 transition ${isExpanded ? "rotate-180" : ""}`}
                      />
                    </button>

                    {isExpanded && definition.id === "camera" ? (
                      <>
                        <div
                          className="hc-camera-grid"
                          style={{
                            "--hc-device-count": Math.max(
                              2,
                              activeDevices.length,
                            ),
                          }}
                        >
                          {activeDevices.map((device) => (
                            <article
                              key={`camera-card-${device.id}`}
                              className="hc-camera-card"
                            >
                              <div className="hc-camera-card__phone">
                                <img
                                  src={getPrimaryImage(device) || null}
                                  alt=""
                                />
                                <div>
                                  <p className="text-xs font-black text-slate-950">
                                    {getDeviceName(device)}
                                  </p>
                                  <p className="mt-0.5 text-[10px] font-semibold text-slate-500">
                                    Camera system details
                                  </p>
                                </div>
                              </div>
                              {getCameraStudioGroups(device).map((group) => (
                                <section
                                  key={`${device.id}-${group.key}`}
                                  className="hc-camera-group"
                                >
                                  <h4>{group.label}</h4>
                                  <dl className="hc-property-list">
                                    {group.pairs.map(
                                      ([label, value], index) => (
                                        <div
                                          key={`${group.key}-${label}-${index}`}
                                          className="hc-property"
                                        >
                                          <dt>{label}</dt>
                                          <dd>{value}</dd>
                                        </div>
                                      ),
                                    )}
                                  </dl>
                                </section>
                              ))}
                              {!getCameraStudioGroups(device).length ? (
                                <p className="text-xs text-slate-500">
                                  No structured camera data available.
                                </p>
                              ) : null}
                            </article>
                          ))}
                        </div>
                        <div className="hc-mobile-specs">
                          {focusedMobileDevices.map((device) => (
                            <article
                              key={`mobile-camera-${device.id}`}
                              className="hc-camera-card"
                            >
                              <div className="hc-camera-card__phone">
                                <img
                                  src={getPrimaryImage(device) || null}
                                  alt=""
                                />
                                <strong className="text-xs">
                                  {getDeviceName(device)}
                                </strong>
                              </div>
                              {getCameraStudioGroups(device).map((group) => (
                                <section
                                  key={`mobile-${device.id}-${group.key}`}
                                  className="hc-camera-group"
                                >
                                  <h4>{group.label}</h4>
                                  <dl className="hc-property-list">
                                    {group.pairs.map(
                                      ([label, value], index) => (
                                        <div
                                          key={`${group.key}-${label}-${index}`}
                                          className="hc-property"
                                        >
                                          <dt>{label}</dt>
                                          <dd>{value}</dd>
                                        </div>
                                      ),
                                    )}
                                  </dl>
                                </section>
                              ))}
                            </article>
                          ))}
                        </div>
                      </>
                    ) : isExpanded ? (
                      <>
                        <div className="hc-spec-table-wrap">
                          <table className="hc-spec-table">
                            <tbody>
                              {definition.rows.map((row, rowIndex) => (
                                <React.Fragment key={row.rowKey}>
                                  {row.groupLabel &&
                                  (rowIndex === 0 ||
                                    definition.rows[rowIndex - 1]
                                      ?.groupLabel !== row.groupLabel) ? (
                                    <tr className="hc-subheading-row">
                                      <th colSpan={activeDevices.length + 1}>
                                        {row.groupLabel}
                                      </th>
                                    </tr>
                                  ) : null}
                                  <tr>
                                    <th>{row.label}</th>
                                    {activeDevices.map((device) => {
                                      const { missingValue, renderedValue } =
                                        getStudioRowValue(row, device);
                                      const isWinner =
                                        winner &&
                                        String(getDeviceKey(winner)) ===
                                          String(getDeviceKey(device));
                                      return (
                                        <td key={`${row.rowKey}-${device.id}`}>
                                          {missingValue ? (
                                            <span className="text-slate-300">
                                              —
                                            </span>
                                          ) : (
                                            renderedValue
                                          )}
                                          {isWinner && !missingValue ? (
                                            <span className="hc-lead">
                                              Leads
                                            </span>
                                          ) : null}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                </React.Fragment>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="hc-mobile-specs">
                          {definition.rows.map((row) => (
                            <article
                              key={`mobile-${definition.id}-${row.rowKey}`}
                              className="hc-mobile-property"
                            >
                              <h4>
                                {row.groupLabel
                                  ? `${row.groupLabel} · ${row.label}`
                                  : row.label}
                              </h4>
                              <div className="hc-mobile-property__values">
                                {focusedMobileDevices.map((device) => {
                                  const { missingValue, renderedValue } =
                                    getStudioRowValue(row, device);
                                  const isWinner =
                                    winner &&
                                    String(getDeviceKey(winner)) ===
                                      String(getDeviceKey(device));
                                  return (
                                    <div
                                      key={`${row.rowKey}-mobile-${device.id}`}
                                      className="hc-mobile-value"
                                    >
                                      <strong>{getDeviceName(device)}</strong>
                                      <div>
                                        {missingValue ? (
                                          <span className="text-slate-300">
                                            —
                                          </span>
                                        ) : (
                                          renderedValue
                                        )}
                                        {isWinner && !missingValue ? (
                                          <span className="hc-lead">Leads</span>
                                        ) : null}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </article>
                          ))}
                        </div>
                      </>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </section>

          <section
            className="hc-shell hc-section hc-card rounded-[20px] p-4 sm:p-5"
            id="compare-prices"
          >
            <div className="hc-section-title">
              <div>
                <p className="hc-eyebrow">Current store prices</p>
                <h2>Check the selected variant before buying</h2>
                <p>
                  Store rows remain tied to each selected variant so a cheaper
                  unrelated configuration does not distort the comparison.
                </p>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {activeDevices.map((device) => {
                const stores = getStoreRowsForDevice(device);
                const price = getCardPrice(device, getSelectedVariant(device));
                return (
                  <article
                    key={`stores-${device.id}`}
                    className="rounded-[14px] border border-slate-200 bg-slate-50/60 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={getPrimaryImage(device) || null}
                        alt=""
                        className="h-14 w-11 object-contain"
                      />
                      <div>
                        <h3 className="text-sm font-black text-slate-950">
                          {getDeviceName(device)}
                        </h3>
                        <p className="mt-1 text-sm font-black text-blue-600">
                          {price ? formatPrice(price) : "Price unavailable"}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      {(stores.length
                        ? stores
                        : [{ storeName: "Selected variant", price, url: "" }]
                      ).map((store, index) => (
                        <div
                          key={`${device.id}-store-${store.storeName}-${index}`}
                          className="flex items-center justify-between gap-3 rounded-[9px] bg-white px-3 py-2.5"
                        >
                          <span className="text-xs font-bold text-slate-700">
                            {store.storeName}
                          </span>
                          {store.url ? (
                            <a
                              href={store.url}
                              target="_blank"
                              rel="nofollow sponsored noopener noreferrer"
                              className="text-xs font-black text-blue-600"
                            >
                              {store.price ? formatPrice(store.price) : "View"}
                            </a>
                          ) : (
                            <span className="text-xs font-black text-slate-900">
                              {store.price ? formatPrice(store.price) : "—"}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          {suggestedDevices.length ? (
            <section className="hc-shell hc-section">
              <div className="hc-section-title">
                <div>
                  <p className="hc-eyebrow">Try another match</p>
                  <h2>Continue your research</h2>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {suggestedDevices.map((candidate) => (
                  <button
                    key={`suggestion-${getResolvedProductId(candidate)}`}
                    type="button"
                    onClick={() => applySuggestedComparison(candidate)}
                    className="flex items-center gap-3 rounded-[14px] border border-slate-200 bg-white p-3 text-left transition hover:border-blue-300"
                  >
                    <img
                      src={getPrimaryImage(candidate) || null}
                      alt=""
                      className="h-16 w-12 object-contain"
                    />
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-xs font-black text-slate-900">
                        {getDeviceName(candidate)}
                      </p>
                      <p className="mt-1 text-[10px] font-bold text-blue-600">
                        Compare with first phone
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          <section
            className="hc-shell hc-section hc-card rounded-[20px] p-4 sm:p-5"
            id="compare-faqs"
          >
            <div className="hc-section-title">
              <div>
                <p className="hc-eyebrow">Comparison FAQs</p>
                <h2>Understand the Hooks verdict</h2>
              </div>
            </div>
            <div className="grid gap-3 lg:grid-cols-3">
              <article className="rounded-[13px] bg-slate-50 p-4">
                <h3 className="text-sm font-black text-slate-950">
                  Does the highest score always mean best?
                </h3>
                <p className="mt-2 text-xs leading-5 text-slate-600">
                  No. The overall score balances categories, while user-fit
                  picks show which phone is better for gaming, camera, battery,
                  value or long-term use.
                </p>
              </article>
              <article className="rounded-[13px] bg-slate-50 p-4">
                <h3 className="text-sm font-black text-slate-950">
                  Why can a category have no winner?
                </h3>
                <p className="mt-2 text-xs leading-5 text-slate-600">
                  Hooks avoids false certainty when the score gap is very small
                  or important fields are missing. Check the confidence section
                  for data-quality warnings.
                </p>
              </article>
              <article className="rounded-[13px] bg-slate-50 p-4">
                <h3 className="text-sm font-black text-slate-950">
                  Are prices variant-specific?
                </h3>
                <p className="mt-2 text-xs leading-5 text-slate-600">
                  Yes. Changing RAM or storage updates the selected-variant
                  price, value result and price-premium verdict whenever server
                  data is available.
                </p>
              </article>
            </div>
          </section>
        </>
      ) : null}

      {comparisonPickerModal}
    </main>
  );
};

export default MobileCompare;
