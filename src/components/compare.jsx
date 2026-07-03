// src/components/MobileCompare.jsx
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
  FaSun,
  FaTachometerAlt,
  FaTimes,
  FaTrash,
  FaWifi,
  FaWeightHanging,
} from "react-icons/fa";
import "../styles/hideScrollbar.css";
import useDevice from "../hooks/useDevice";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import normalizeProduct from "../utils/normalizeProduct";
import { Helmet } from "react-helmet-async";
import { createWebApplicationSchema } from "../utils/schemaGenerators";
import { buildListSeoKeywords } from "../utils/seoKeywordBuilder";
import { normalizeSeoTitle } from "../utils/seoTitle";
import { toCanonicalPageUrl } from "../utils/publicUrl";
import { readPreloadedApiResponse } from "../utils/preloadedApi";
import { buildCanonicalComparePathFromDevices } from "../utils/compareRoutes";

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

const MAX_DEVICES = 4;
const MIN_DEVICES = 2;
const SITE_ORIGIN = "https://tryhook.shop";
const resolveCompareApiBase = () => {
  const configured = String(import.meta.env.VITE_API_BASE_URL || "")
    .trim()
    .replace(/\/$/, "");
  if (configured) return configured;

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
    if (Array.isArray(variant?.store_prices)) rows.push(...variant.store_prices);
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

const buildCompareTitleText = ({
  names = [],
  segmentLabel = "",
  publishedTitle = "",
} = {}) => {
  const overridden = String(publishedTitle || "").trim();
  if (overridden) return overridden;

  const joined = joinCompareNamesWithoutCommas(names);
  if (!joined)
    return "Device Comparison Price Specifications and Features in India";

  const segment = String(segmentLabel || "").trim();
  if (segment) {
    return `Compare ${joined} in the ${segment} Segment Price Specifications and Features in India`;
  }

  return `Compare ${joined} Price Specifications and Features in India`;
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
    return "Compare devices with latest price specifications camera battery performance and features in India.";
  }

  const segment = String(segmentLabel || "").trim();
  if (segment) {
    return `Compare ${joined} in the ${segment} Segment with latest price specifications camera battery performance and features in India`;
  }

  return `Compare ${joined} with latest price specifications camera battery performance and features in India`;
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
  const searchResultsRef = useRef(null);
  const catalogSearchInputRef = useRef(null);

  const { devices: availableDevices = [], loading, getDevice } = useDevice();
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

  const openCatalogPanel = () => {
    setShowCatalogModal(true);
    requestAnimationFrame(() => {
      catalogSearchInputRef.current?.focus();
    });
  };

  const closeCatalogModal = () => {
    setShowCatalogModal(false);
  };

  useEffect(() => {
    if (isComparing || selectedDevices.length < MIN_DEVICES) return;

    setShowCatalogModal(false);
    setComparedDevices(selectedDevices);
    setSelectedDevices([]);
    setIsComparing(true);
    if (typeof document === "undefined") return;
    setTimeout(() => {
      document
        .getElementById("comparison-section")
        ?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, [isComparing, selectedDevices]);

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

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setShowCatalogModal(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
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
          await fetch(`https://api.apisphere.in/api/public/compare`, {
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
      setCompareInsightsLoading(false);
      return;
    }

    const controller = new AbortController();
    setRankingByDeviceId({});
    setCompareInsights(EMPTY_COMPARE_INSIGHTS);
    setCompareInsightsLoading(true);

    (async () => {
      try {
        const response = await fetch(
          "https://api.apisphere.in/api/public/compare/scores",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ devices: payloadDevices }),
            signal: controller.signal,
          },
        );

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
          setCompareInsightsLoading(false);
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Failed to fetch compare scores:", error);
        setRankingByDeviceId({});
        setCompareInsights(EMPTY_COMPARE_INSIGHTS);
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

  const renderSelectedDeviceCard = (device, comparing = false) => {
    const selectedVariant = getSelectedVariant(device);
    const price = getCardPrice(device, selectedVariant);
    const serverScoreEntry = comparing ? getServerScoreEntry(device) : null;
    const isOverallWinner =
      comparing &&
      overallWinnerId &&
      getDeviceRankingKeys(device).includes(overallWinnerId);
    const liveRank =
      serverScoreEntry?.rank || (isOverallWinner ? 1 : null) || null;

    return (
      <div
        key={device.id}
        className="relative flex h-full min-h-[27rem] flex-col rounded-[24px] border border-slate-200 bg-white px-6 py-6 transition-colors hover:border-blue-200"
      >
        <button
          type="button"
          onClick={() =>
            comparing
              ? removeComparedDevice(device.id)
              : removeDevice(device.id)
          }
          className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
          aria-label="Remove device"
          title="Remove device"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-1 flex-col">
          <div className="flex h-[170px] items-center justify-center">
            <div className="relative flex h-full w-full items-center justify-center">
              <img
                src={getPrimaryImage(device) || null}
                alt={device.name}
                className="h-full max-h-[168px] w-full max-w-[86%] object-contain"
                onError={(event) => {
                  event.target.src = `/api/placeholder/320/240?text=${encodeURIComponent(
                    (device.brand || "D").slice(0, 1),
                  )}`;
                }}
              />
            </div>
          </div>

          <div className="mt-5 text-left">
            <p className="text-sm font-bold uppercase tracking-wide text-blue-600">
              {device.brand || "Brand"}
            </p>
            <h3 className="mt-3 text-[1.65rem] font-semibold leading-tight tracking-tight text-slate-950">
              {device.name || device.model || device.title || "Device"}
            </h3>
          </div>

          <div className="mt-9 text-left">
            <p
              className={`text-[2.15rem] font-semibold tracking-tight ${
                price ? "text-slate-900" : "text-slate-400"
              }`}
              title={price ? "Price" : "Price not available"}
            >
              {price ? formatPrice(price) : "N/A"}
            </p>
            {comparing ? (
              <p className="mt-5 text-sm leading-7 text-slate-500">
                Live compare score{" "}
                <span className="font-medium text-slate-700">
                  {serverScoreEntry?.totalScore != null
                    ? formatSpecScoreLabel(serverScoreEntry.totalScore)
                    : "N/A"}
                </span>
                {liveRank ? (
                  <>
                    , currently ranked{" "}
                    <span className="font-semibold text-blue-600">
                      #{liveRank}
                    </span>{" "}
                    overall.
                  </>
                ) : (
                  "."
                )}
              </p>
            ) : (
              <div className="mt-5 flex items-center gap-1.5 text-sm text-slate-500">
                <span>Score available after comparison</span>
                <Info className="h-3.5 w-3.5" />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderCompactMobileDeviceCard = (device, comparing = false) => {
    const selectedVariant = getSelectedVariant(device);
    const price = getCardPrice(device, selectedVariant);
    const serverScoreEntry = comparing ? getServerScoreEntry(device) : null;
    const isOverallWinner =
      comparing &&
      overallWinnerId &&
      getDeviceRankingKeys(device).includes(overallWinnerId);
    const liveRank =
      serverScoreEntry?.rank || (isOverallWinner ? 1 : null) || null;
    const mobileLabel = comparing
      ? serverScoreEntry?.totalScore != null
        ? formatSpecScoreLabel(serverScoreEntry.totalScore)
        : "N/A"
      : "Score available after comparison";

    return (
      <div className="relative flex h-full min-h-[14rem] flex-col rounded-[22px] border border-slate-300 bg-white p-3 sm:min-h-[19rem] sm:rounded-[28px] sm:p-4">
        <button
          type="button"
          onClick={() =>
            comparing
              ? removeComparedDevice(device.id)
              : removeDevice(device.id)
          }
          className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-500"
          aria-label="Remove device"
          title="Remove device"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex justify-center pt-1 sm:pt-2">
          <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-[18px] border border-slate-300 bg-slate-50 p-2 sm:h-[132px] sm:w-[132px] sm:rounded-[24px] sm:p-3">
            <img
              src={getPrimaryImage(device) || null}
              alt={device.name}
              className="h-full w-full object-contain"
              onError={(event) => {
                event.target.src = `/api/placeholder/320/240?text=${encodeURIComponent(
                  (device.brand || "D").slice(0, 1),
                )}`;
              }}
            />
          </div>
        </div>

        <div className="mt-3 text-center sm:mt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            {device.brand || "Brand"}
          </p>
          <h3 className="mt-1.5 line-clamp-2 text-sm font-semibold leading-tight tracking-tight text-slate-900 sm:text-[1.15rem]">
            {device.name || device.model || device.title || "Device"}
          </h3>
        </div>

        <div className="mt-auto pt-4 text-center sm:mt-5 sm:pt-0">
          <p className="text-lg font-semibold tracking-tight text-slate-900 sm:text-[1.6rem]">
            {price ? formatPrice(price) : "N/A"}
          </p>
          <p className="mt-1.5 text-[11px] text-slate-500 sm:mt-2 sm:text-sm">
            {comparing ? (
              <>
                Live compare score{" "}
                <span className="font-medium text-slate-700">
                  {mobileLabel}
                </span>
                {liveRank ? (
                  <>
                    , ranked{" "}
                    <span className="font-semibold text-blue-600">
                      #{liveRank}
                    </span>
                  </>
                ) : null}
              </>
            ) : (
              <>
                <span>{mobileLabel}</span>
              </>
            )}
          </p>
        </div>
      </div>
    );
  };

  const renderEmptyCompareSlot = (slotIndex) => (
    <button
      key={`empty-compare-slot-${slotIndex}`}
      type="button"
      onClick={openCatalogPanel}
      className="group flex h-full min-h-[27rem] flex-col items-center justify-center rounded-[24px] border-2 border-dashed border-slate-300 bg-white px-5 py-6 text-center transition-colors hover:border-blue-300 hover:bg-blue-50/40"
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-full border border-slate-200 bg-white text-blue-600 transition-colors group-hover:border-blue-300 group-hover:bg-blue-50">
        <Plus className="h-9 w-9" />
      </div>
      <p className="mt-7 text-2xl font-semibold tracking-tight text-slate-950">
        Add Device
      </p>
      <p className="mt-3 text-base text-slate-500">
        Slot {activeDevices.length + slotIndex + 1} of {compareSlotCount}
      </p>
    </button>
  );

  const renderCompareBenefitStrip = () => {
    const benefits = [
      {
        icon: BarChart3,
        title: "Compare side by side",
        description: "View detailed specifications",
      },
      {
        icon: Star,
        title: "Find the best match",
        description: "Choose what suits you",
      },
      {
        icon: Share2,
        title: "Share your comparison",
        description: "Get opinions from others",
      },
    ];

    return (
      <div className="border-t border-slate-200 bg-white px-6 py-6">
        <div className="grid gap-5 md:grid-cols-3">
          {benefits.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className={`flex items-center gap-4 ${
                  index > 0 ? "md:border-l md:border-slate-200 md:pl-8" : ""
                }`}
              >
                <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <Icon className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-950">
                    {item.title}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Start comparison
  const startComparison = () => {
    const scrollToComparison = () => {
      setTimeout(() => {
        document.getElementById("comparison-section")?.scrollIntoView({
          behavior: "smooth",
        });
      }, 100);
    };

    if (!isComparing) {
      if (selectedDevices.length < MIN_DEVICES) {
        alert(`Please select at least ${MIN_DEVICES} devices to compare`);
        return;
      }
      closeCatalogModal();
      setComparedDevices(selectedDevices);
      setSelectedDevices([]);
      setIsComparing(true);
      scrollToComparison();
      return;
    }

    scrollToComparison();
  };

  // Clear all
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
        ? "Compare Selected Devices Price Specifications and Features in India"
        : "Device Comparison Price Specifications and Features in India";
  const normalizedMetaTitle = normalizeSeoTitle(metaTitle);

  const metaDescription =
    seoSelectedNames.length > 0
      ? buildCompareDescriptionText({
          names: seoSelectedNames.slice(0, maxDevices),
          segmentLabel: seoSegmentLabel,
          publishedDescription: publishedComparePage?.meta_description || "",
        })
      : canonicalCompareEntries.length > 0
        ? "Compare selected devices with detailed specifications, price, camera, display, battery, performance, software, benchmarks, and key differences on TryHook."
        : "Compare devices with detailed specifications, price, camera, display, battery, performance, software, benchmarks, and key differences on TryHook.";
  const metaKeywords = useMemo(
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

  useEffect(() => {
    if (typeof document === "undefined") return;

    document.title = normalizedMetaTitle;
    upsertMetaTag('meta[name="description"]', {
      name: "description",
      content: metaDescription,
    });
    upsertMetaTag('meta[name="keywords"]', {
      name: "keywords",
      content: metaKeywords,
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
  }, [canonicalCompareUrl, metaDescription, metaKeywords, normalizedMetaTitle]);

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

  const catalogSidebar = (
    <aside className="w-full">
      <div className="overflow-hidden rounded-none border-0 bg-white sm:rounded-2xl sm:border sm:border-slate-300">
        <div className="p-3 sm:p-5">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">
            Add a product
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Search and select a product to add to your comparison.
          </p>

          <div className="relative mt-4">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
              <Search className="h-4 w-4" />
            </div>
            <input
              ref={catalogSearchInputRef}
              type="text"
              placeholder="Search for phones, laptops..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder:text-slate-400"
            />
          </div>

          <div className="mt-5 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Filters</h3>
            <button
              type="button"
              onClick={resetCatalogFilters}
              className="text-sm font-medium text-slate-500 transition-colors hover:text-blue-600"
            >
              Reset
            </button>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Category
              </span>
              <select
                value={effectiveCatalogCategoryValue || "all"}
                onChange={(event) =>
                  setCatalogCategoryFilter(event.target.value)
                }
                disabled={Boolean(catalogLockedType)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-slate-50"
              >
                {catalogCategoryOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Brand
              </span>
              <select
                value={catalogBrandFilter}
                onChange={(event) => setCatalogBrandFilter(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              >
                {catalogBrandOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Price range
              </span>
              <select
                value={catalogPriceFilter}
                onChange={(event) => setCatalogPriceFilter(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              >
                {SEARCH_PRICE_RANGE_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Release year
              </span>
              <select
                value={catalogReleaseYearFilter}
                onChange={(event) =>
                  setCatalogReleaseYearFilter(event.target.value)
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              >
                {catalogReleaseYearOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Sort by
              </span>
              <select
                value={searchSort}
                onChange={(event) => setSearchSort(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              >
                {SEARCH_SORT_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
            {QUICK_FILTER_CHIPS.map((chip) => {
              const Icon = chip.icon;
              const active = activeQuickFilter === chip.id;
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setActiveQuickFilter(chip.id)}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? "border-blue-300 bg-blue-50 text-blue-700"
                      : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-700"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{chip.label}</span>
                </button>
              );
            })}
          </div>

          <p className="mt-4 text-xs font-medium text-slate-500">
            {filteredDevices.length.toLocaleString("en-IN")} results found
          </p>
        </div>

        <div
          ref={searchResultsRef}
          className="max-h-none space-y-3 overflow-visible border-t border-slate-200 px-3 py-3 sm:max-h-[560px] sm:overflow-y-auto sm:px-5 sm:py-4"
        >
          {visibleCatalogDevices.map((item) => {
            const base = item.base;
            const variant = item.variant;
            const variantIndex = item.variantIndex ?? 0;
            const productId = getResolvedProductId(base);
            const isSelected =
              productId != null && activeDeviceIdSet.has(String(productId));
            const canAdd = isSelected || visibleRemainingSlots > 0;
            const price = getCardPrice(base, variant);

            return (
              <div
                key={`catalog-${productId ?? base?.model ?? variantIndex}`}
                className="grid grid-cols-[3.5rem_minmax(0,1fr)] gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:flex sm:items-center"
              >
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-1.5">
                  <img
                    src={getPrimaryImage(base) || null}
                    alt={base.name}
                    className="h-full w-full object-contain"
                    onError={(event) => {
                      event.target.src = `/api/placeholder/160/160?text=${encodeURIComponent(
                        (base.brand || "D").slice(0, 1),
                      )}`;
                    }}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {base.name || base.model || "Device"}
                  </p>
                  <p className="mt-1 truncate text-xs text-slate-500">
                    {formatVariantCompactLabel(variant, variantIndex)}
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-700">
                    {price ? formatPrice(price) : "N/A"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => addDevice(base, variantIndex)}
                  disabled={!canAdd}
                  className={`col-span-2 inline-flex h-10 w-full items-center justify-center rounded-lg px-3 text-sm font-semibold transition-colors sm:col-span-1 sm:w-auto ${
                    isSelected
                      ? "border border-blue-200 bg-blue-50 text-blue-700"
                      : canAdd
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400"
                  }`}
                >
                  {isSelected ? "Added" : canAdd ? "Add" : "Full"}
                </button>
              </div>
            );
          })}

          {filteredDevices.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              No products matched these filters.
            </div>
          ) : null}
        </div>

        {filteredDevices.length > visibleCatalogDevices.length ? (
          <div className="border-t border-slate-200 px-4 py-3 sm:px-5">
            <button
              type="button"
              onClick={() =>
                setCatalogVisibleCount((count) =>
                  Math.min(count + 6, filteredDevices.length),
                )
              }
              className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              Load more
            </button>
          </div> 
        ) : null}
      </div>
    </aside>
  );

  const setupPanel =
    activeDevices.length === 0 ? (
      <div className="  px-4 py-10 text-center sm:px-6 sm:py-16">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 sm:h-16 sm:w-16">
          <BarChart3 className="h-7 w-7 sm:h-8 sm:w-8" />
        </div>
        <h2 className="mt-5 text-xl font-semibold text-slate-900 sm:text-2xl">
          Start your comparison
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500 sm:text-base">
          Open Add product to choose up to {maxDevices} devices. Once you have
          at least {MIN_DEVICES}, you can compare them side by side here.
        </p>
        <button
          type="button"
          onClick={openCatalogPanel}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Add product
        </button>
      </div>
    ) : isComparing ? null : (
      <>
        <div className="overflow-hidden rounded-2xl border border-slate-300 bg-white lg:hidden">
          <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto p-3 pb-4 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-4 sm:p-4 sm:pb-5 [&::-webkit-scrollbar]:hidden">
            {activeDevices.map((device) => (
              <div
                key={`mobile-selected-${device.id}`}
                className="min-w-[64vw] max-w-[260px] snap-start sm:min-w-[360px] sm:max-w-[340px]"
              >
                {renderCompactMobileDeviceCard(device, false)}
              </div>
            ))}
            {visibleRemainingSlots > 0 ? (
              <button
                type="button"
                onClick={openCatalogPanel}
                className="group flex min-w-[56vw] max-w-[220px] snap-start flex-col items-center justify-center rounded-[22px] border-2 border-dashed border-slate-200 bg-white px-5 py-7 text-center transition-colors hover:border-slate-300 hover:bg-slate-50/50 sm:min-w-[68vw] sm:max-w-[260px] sm:rounded-[28px] sm:px-6 sm:py-8"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-900 transition-colors group-hover:bg-slate-200">
                  <Plus className="h-7 w-7" />
                </div>
                <p className="mt-6 text-2xl font-semibold tracking-tight text-slate-900">
                  Add Device
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  {visibleRemainingSlots} slot
                  {visibleRemainingSlots !== 1 ? "s" : ""} left
                </p>
              </button>
            ) : null}
          </div>
        </div>

        <div className="hidden overflow-hidden rounded-[28px] border border-slate-200 bg-white lg:block">
          <div
            className="grid gap-5 p-5 lg:p-6"
            style={{
              gridTemplateColumns: `repeat(${compareSlotCount}, minmax(0, 1fr))`,
            }}
          >
            {activeDevices.map((device) =>
              renderSelectedDeviceCard(device, false),
            )}
            {Array.from({ length: emptyCompareSlotCount }, (_, index) =>
              renderEmptyCompareSlot(index),
            )}
          </div>

          {renderCompareBenefitStrip()}
        </div>
      </>
    );

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-900">
      <Helmet prioritizeSeoTags>
        <title key="compare-title">{normalizedMetaTitle}</title>
        <meta
          key="compare-description"
          name="description"
          content={metaDescription}
        />
        <meta key="compare-keywords" name="keywords" content={metaKeywords} />
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
        {compareSchemaJson && (
          <script type="application/ld+json">{compareSchemaJson}</script>
        )}
      </Helmet>
      {/* Page Header */}
      <div className="sticky top-0 z-40 w-full  px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1560px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center border border-slate-300 text-slate-600 md:hidden"
              aria-label="Go back"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h1 className="text-[15px] font-bold uppercase tracking-[0.32em] text-purple-600 sm:text-xs">
                Compare
              </h1>
              <p className="mt-1 text-[10px] text-slate-600">
                Up to {maxDevices} products
              </p>
            </div>
          </div>

          {(activeDevices.length > 0 || selectedDevices.length > 0) && (
            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              {visibleRemainingSlots > 0 ? (
                <button
                  type="button"
                  onClick={openCatalogPanel}
                  className="inline-flex items-center gap-2 border border-blue-500 px-4 py-2 text-sm font-semibold text-blue-600"
                  title={`${visibleRemainingSlots} compare slot${
                    visibleRemainingSlots !== 1 ? "s" : ""
                  } available`}
                >
                  <Plus className="h-4 w-4" />
                  Add product
                </button>
              ) : null}
              {activeDevices.length > 0 ? (
                <button
                  type="button"
                  onClick={shareComparison}
                  className="inline-flex items-center gap-2 border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
                  title="Share comparison"
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </button>
              ) : null}
              <button
                type="button"
                onClick={clearAll}
                className="inline-flex items-center gap-2 border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
              >
                <Trash2 className="h-4 w-4" />
                Clear all
              </button>
            </div>
          )}
        </div>
      </div>

      {showCatalogModal && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/45 p-0 backdrop-blur-md sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="compare-add-product-title"
          onMouseDown={closeCatalogModal}
        >
          <div className="flex min-h-full items-stretch justify-center sm:items-center">
            <div
              className="flex h-full max-h-none w-full max-w-[1120px] flex-col overflow-hidden rounded-none border-0 bg-white sm:h-auto sm:max-h-[92vh] sm:rounded-[28px] sm:border sm:border-slate-300"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
                <div>
                  <h2
                    id="compare-add-product-title"
                    className="text-lg font-semibold text-slate-900"
                  >
                    Add product
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Search and select devices to compare.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeCatalogModal}
                  className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-500 transition-colors hover:bg-slate-50"
                  aria-label="Close add product modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="overflow-y-auto p-3 sm:p-6">{catalogSidebar}</div>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-[1560px] px-3 pb-8 pt-3 sm:px-6 sm:pb-10 sm:pt-6 lg:px-8">
        <div>
          <div className="space-y-6">
            {setupPanel}
            {false ? (
              <>
                {/* Hero Section */}
                {usedSlots === 0 && (
                  <div className="mb-6 px-4 py-4 text-center sm:px-6">
                    <div className="mx-auto max-w-5xl border border-slate-200 bg-white p-6 sm:p-7">
                      <div className="flex items-center justify-center gap-3 mb-4">
                        <Sparkles className="h-8 w-8 text-blue-600" />
                        <h2 className="text-lg font-semibold text-slate-900">
                          How to Compare
                        </h2>
                      </div>
                      <p className="mx-auto mb-5 max-w-2xl text-sm text-slate-500">
                        Add 2 to 4 devices, pick the categories you care about,
                        and compare price, specs, and features side by side.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="rounded-[24px] border border-slate-300 bg-slate-50 p-4">
                          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-[16px] bg-blue-50">
                            <span className="font-bold text-blue-600">1</span>
                          </div>
                          <p className="text-sm text-slate-700">
                            {maxDevices === 2
                              ? "Add 2 devices"
                              : `Add 2-${maxDevices} devices`}
                          </p>
                        </div>
                        <div className="rounded-[24px] border border-slate-300 bg-slate-50 p-4">
                          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-[16px] bg-sky-50">
                            <span className="font-bold text-blue-600">2</span>
                          </div>
                          <p className="text-sm text-slate-700">
                            Select categories
                          </p>
                        </div>
                        <div className="rounded-[24px] border border-slate-300 bg-slate-50 p-4">
                          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-[16px] bg-blue-50">
                            <span className="font-bold text-blue-600">3</span>
                          </div>
                          <p className="text-sm text-slate-700">
                            Compare & decide
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {/* Selected Devices Section */}
                {isComparing ? (
                  <div className="mb-8 overflow-hidden ">
                    <div className="xl:grid xl:grid-cols-[220px_minmax(0,1fr)]">
                      <aside className="flex flex-col justify-between gap-6 border-b border-slate-200 bg-white p-5 xl:border-b-0 xl:border-r xl:p-6">
                        <div>
                          <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                            Add or remove products
                          </h2>
                          <p className="mt-3 text-sm leading-6 text-slate-500">
                            You can compare up to {maxDevices} devices at a
                            time.
                          </p>
                        </div>

                        {visibleRemainingSlots > 0 ? (
                          <button
                            type="button"
                            onClick={openCatalogPanel}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-blue-300 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 transition-colors hover:border-blue-400 hover:bg-blue-100"
                          >
                            <Plus className="h-4 w-4" />
                            Add product
                          </button>
                        ) : null}
                      </aside>

                      <div
                        className="grid min-h-full divide-y divide-slate-200 xl:divide-x xl:divide-y-0"
                        style={{
                          gridTemplateColumns: `repeat(${compareSlotCount}, minmax(0, 1fr))`,
                        }}
                      >
                        {activeDevices.map((device) =>
                          renderSelectedDeviceCard(device, true),
                        )}
                        {Array.from(
                          { length: emptyCompareSlotCount },
                          (_, index) => renderEmptyCompareSlot(index),
                        )}
                      </div>
                    </div>
                  </div>
                ) : activeDevices.length > 0 ? (
                  <div className="mb-8 overflow-hidden rounded-[32px] border border-slate-300 bg-white">
                    <div className="xl:grid xl:grid-cols-[250px_minmax(0,1fr)]">
                      <aside className="border-b border-slate-200 bg-white p-8 xl:border-b-0 xl:border-r">
                        <div className="flex h-full flex-col gap-8">
                          <div className="space-y-8">
                            <div>
                              <h2 className="text-[2rem] font-semibold tracking-tight text-slate-900">
                                Selected devices
                              </h2>
                              <p className="mt-4 max-w-[15rem] text-lg leading-8 text-slate-600">
                                Compare 2 to {maxDevices} products side by side.
                              </p>
                            </div>

                            <div className="space-y-3">
                              <div className="flex items-center gap-3 text-sm font-medium text-slate-700">
                                <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                                  <Smartphone className="h-4 w-4" />
                                </div>
                                <span>
                                  {activeDevices.length} of {maxDevices}{" "}
                                  selected
                                </span>
                              </div>
                              <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                                <div
                                  className="h-full rounded-full bg-blue-600 transition-all duration-300"
                                  style={{ width: `${selectedSetupProgress}%` }}
                                />
                              </div>
                            </div>

                            {visibleRemainingSlots > 0 ? (
                              <button
                                type="button"
                                onClick={openCatalogPanel}
                                className="inline-flex w-full items-center justify-center gap-3 rounded-2xl border border-blue-500 bg-white px-5 py-4 text-base font-semibold text-blue-600 transition-colors hover:bg-blue-50"
                              >
                                <Plus className="h-5 w-5" />
                                Add Device
                              </button>
                            ) : null}
                          </div>

                          <div className="mt-auto rounded-[26px] border border-slate-200 bg-slate-50/80 p-5">
                            <div className="flex items-start gap-3">
                              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-blue-200 bg-white text-blue-600">
                                <Info className="h-5 w-5" />
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold text-slate-900">
                                  Variant matters
                                </h3>
                                <p className="mt-2 text-sm leading-7 text-slate-500">
                                  Different variants can affect specs, features,
                                  and price.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </aside>

                      <div className="p-5 sm:p-6">
                        <div className="grid auto-rows-fr grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                          {activeDevices.map((device) => {
                            const selectedVariant = getSelectedVariant(device);
                            const price = getCardPrice(device, selectedVariant);
                            return (
                              <div
                                key={device.id}
                                className="relative flex h-full min-h-[24rem] flex-col rounded-[28px] border border-slate-300 bg-white p-5 transition-colors hover:border-slate-400"
                              >
                                <button
                                  type="button"
                                  onClick={() => removeDevice(device.id)}
                                  className="absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-500 transition-colors hover:border-slate-400 hover:text-slate-700"
                                  aria-label="Remove device"
                                  title="Remove device"
                                >
                                  <X className="h-4 w-4" />
                                </button>

                                <div className="flex justify-center">
                                  <div className="relative flex h-[200px] w-full max-w-[250px] items-center justify-center overflow-hidden rounded-[24px] border border-slate-300 bg-slate-50 px-4">
                                    <img
                                      src={getPrimaryImage(device) || null}
                                      alt={device.name}
                                      className="h-full w-full object-contain py-4"
                                      onError={(event) => {
                                        event.target.src = `/api/placeholder/320/240?text=${encodeURIComponent(
                                          (device.brand || "D").slice(0, 1),
                                        )}`;
                                      }}
                                    />
                                  </div>
                                </div>

                                <div className="mt-5 flex flex-1 flex-col">
                                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                    {device.brand || "Brand"}
                                  </p>
                                  <h3 className="mt-2 text-[2rem] font-semibold leading-tight tracking-tight text-slate-900">
                                    {device.name || device.model || "Device"}
                                  </h3>
                                  <div className="mt-7">
                                    <p
                                      className={`text-[2rem] font-semibold tracking-tight ${
                                        price
                                          ? "text-slate-900"
                                          : "text-slate-400"
                                      }`}
                                      title={
                                        price ? "Price" : "Price not available"
                                      }
                                    >
                                      {price ? formatPrice(price) : "N/A"}
                                    </p>
                                    <div className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
                                      <span>
                                        Score available after comparison
                                      </span>
                                      <Info className="h-3.5 w-3.5" />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}

                          {visibleRemainingSlots > 0 ? (
                            <button
                              type="button"
                              onClick={openCatalogPanel}
                              className="group flex h-full min-h-[24rem] flex-col items-center justify-center rounded-[28px] border-2 border-dashed border-slate-200 bg-white px-6 py-8 text-center transition-colors hover:border-slate-300 hover:bg-slate-50/50"
                            >
                              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-slate-900 transition-colors group-hover:bg-slate-200">
                                <Plus className="h-8 w-8" />
                              </div>
                              <p className="mt-8 text-[2.2rem] font-semibold tracking-tight text-slate-900">
                                Add Device
                              </p>
                              <p className="mt-3 text-lg text-slate-500">
                                {visibleRemainingSlots} slot
                                {visibleRemainingSlots !== 1 ? "s" : ""} left
                              </p>
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-200 bg-slate-50/60 px-5 py-6 sm:px-6">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-start gap-3">
                          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-300 bg-white text-slate-700">
                            <Shield className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-base font-medium text-slate-900">
                              Your comparison is private and saved
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              You can come back anytime and continue.
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 lg:items-end">
                          <button
                            type="button"
                            onClick={startComparison}
                            disabled={activeDevices.length < MIN_DEVICES}
                            className="inline-flex items-center justify-center gap-3 rounded-2xl bg-slate-900 px-8 py-4 text-base font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                          >
                            Start Comparing
                            <ChevronRight className="h-4 w-4" />
                          </button>
                          <p className="text-sm text-slate-500">
                            {activeDevices.length >= MIN_DEVICES
                              ? "Ready to continue with your selected devices."
                              : `Select at least ${MIN_DEVICES} devices to continue.`}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
                {/* Search Modal */}
                {false && (
                  <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/45 p-4 backdrop-blur-md sm:p-6 lg:p-10">
                    <div className="mx-auto flex min-h-full items-center justify-center">
                      <div className="flex max-h-[94vh] w-full max-w-[1180px] flex-col overflow-hidden rounded-[32px] border border-slate-300 bg-white">
                        <div className="border-b border-slate-200 px-5 py-4 sm:px-7 sm:py-5">
                          <div className="flex items-start justify-between gap-5">
                            <div className="flex min-w-0 items-start gap-4 sm:gap-5">
                              <div className="inline-flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-[20px] border border-blue-200 bg-blue-50 text-blue-600">
                                <Sparkles className="h-6 w-6" />
                              </div>
                              <div className="min-w-0">
                                <h3 className="text-[1.9rem] font-semibold tracking-tight text-slate-900 sm:text-[2.25rem]">
                                  Add Devices
                                </h3>
                                <p className="mt-1.5 text-sm leading-6 text-slate-500 sm:text-base">
                                  Select devices to add to your comparison.
                                </p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                  <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700">
                                    {activeDevices.length} selected
                                  </span>
                                  <span className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700">
                                    {visibleRemainingSlots} slot
                                    {visibleRemainingSlots !== 1
                                      ? "s"
                                      : ""}{" "}
                                    left
                                  </span>
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setShowSearch(false)}
                              className="inline-flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700 sm:h-14 sm:w-14"
                              aria-label="Close add devices modal"
                            >
                              <X className="h-5 w-5 sm:h-6 sm:w-6" />
                            </button>
                          </div>

                          <div className="mt-5 space-y-3">
                            <div className="relative max-w-4xl">
                              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-5 text-slate-400">
                                <Search className="h-5 w-5" />
                              </div>
                              <input
                                type="text"
                                placeholder="Search by brand, model, or feature..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full rounded-2xl border-2 border-blue-500 bg-white py-4 pl-14 pr-5 text-base text-slate-700 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100 placeholder:text-slate-400 sm:py-5 sm:text-lg"
                                autoFocus
                              />
                            </div>

                            <div className="rounded-2xl border border-slate-300 bg-slate-50/80 px-4 py-3.5">
                              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                                <div className="flex min-w-0 items-start gap-3">
                                  <div className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                                    <Filter className="h-4 w-4" />
                                  </div>
                                  <div className="min-w-0">
                                    <h4 className="text-sm font-semibold text-slate-900">
                                      Quick filters
                                    </h4>
                                    <p className="mt-1 text-sm text-slate-500">
                                      Popular features users are comparing right
                                      now
                                    </p>
                                  </div>
                                </div>

                                <div className="flex gap-2 overflow-x-auto pb-1 xl:max-w-[68%]">
                                  {QUICK_FILTER_CHIPS.map((chip) => {
                                    const Icon = chip.icon;
                                    const active =
                                      activeQuickFilter === chip.id;
                                    return (
                                      <button
                                        key={chip.id}
                                        type="button"
                                        onClick={() =>
                                          setActiveQuickFilter(chip.id)
                                        }
                                        className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                                          active
                                            ? "border-blue-300 bg-blue-50 text-blue-700"
                                            : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-slate-50"
                                        }`}
                                      >
                                        <Icon className="h-4 w-4" />
                                        <span>{chip.label}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div
                          ref={searchResultsRef}
                          className="flex-1 overflow-y-auto bg-white"
                        >
                          <div className="sticky top-0 z-10 border-b border-slate-200 bg-white px-5 py-3.5 sm:px-7">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600 sm:text-base">
                                <span className="font-medium text-slate-900">
                                  {filteredDevices.length}
                                </span>
                                <span>results found</span>
                              </div>
                              <label className="inline-flex items-center gap-3 text-sm text-slate-500 sm:text-base">
                                <span>Sort by</span>
                                <select
                                  value={searchSort}
                                  onChange={(event) =>
                                    setSearchSort(event.target.value)
                                  }
                                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100 sm:text-base"
                                >
                                  {SEARCH_SORT_OPTIONS.map((option) => (
                                    <option key={option.id} value={option.id}>
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                              </label>
                            </div>
                          </div>

                          {filteredDevices.length === 0 ? (
                            <div className="px-5 py-16 sm:px-7 sm:py-20">
                              <div className="rounded-[28px] border border-dashed border-slate-400 bg-white px-6 py-14 text-center">
                                <Search className="mx-auto mb-5 h-14 w-14 text-slate-300" />
                                <h4 className="text-2xl font-semibold text-slate-900">
                                  No devices found
                                </h4>
                                <p className="mt-3 text-base text-slate-500">
                                  Try a different search term or adjust your
                                  filters.
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 gap-4 px-5 py-4 md:grid-cols-2 sm:px-7 sm:py-5">
                              {filteredDevices.map((it, _idx) => {
                                const base = it.base;
                                const variant = it.variant;
                                const vi = it.variantIndex ?? 0;
                                const showAiTag = hasAiFeatures(base);
                                const specScore = getDeviceSpecScore(base);
                                const summaryText = getCardSummary(
                                  base,
                                  variant,
                                );
                                const signalLabel = getCardSignalLabel(base);
                                const trendText = signalLabel
                                  ? signalLabel.includes("|")
                                    ? String(signalLabel)
                                        .split("|")
                                        .map((part) => part.trim())
                                        .find((part) =>
                                          /most compared/i.test(part),
                                        ) ||
                                      String(signalLabel).split("|")[0].trim()
                                    : signalLabel
                                  : "";
                                const baseId =
                                  base?.id ||
                                  base?.product_id ||
                                  base?.productId ||
                                  base?.smartphoneId ||
                                  base?.model ||
                                  null;
                                const key = `${baseId ?? "unknown"}-${vi}-${_idx}`;
                                const displayVariant =
                                  variant ||
                                  (base.variants && base.variants[vi]) ||
                                  null;
                                const displayPrice = getCardPrice(
                                  base,
                                  displayVariant,
                                );
                                const variantMeta = getVariantSecondaryMeta(
                                  displayVariant,
                                  base,
                                );
                                const isAlreadySelected =
                                  baseId != null &&
                                  activeDeviceIdSet.has(String(baseId));

                                return (
                                  <button
                                    key={key}
                                    type="button"
                                    onClick={() => addDevice(base, vi)}
                                    className={`group h-full rounded-[26px] border p-5 text-left transition duration-200 hover:border-blue-300 ${
                                      isAlreadySelected
                                        ? "border-blue-200 bg-blue-50/40"
                                        : "border-slate-200 bg-white hover:bg-slate-50"
                                    }`}
                                  >
                                    <div className="grid h-full gap-4 sm:grid-cols-[112px_minmax(0,1fr)]">
                                      <div className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-[22px] border border-slate-300 bg-slate-50">
                                        {specScore != null ? (
                                          <div className="absolute left-3 top-3 z-10 inline-flex flex-col items-center justify-center rounded-[18px] border border-blue-300 bg-blue-50/95 px-2.5 py-2 leading-none text-blue-700">
                                            <span className="text-sm font-semibold">
                                              {formatSpecScoreLabel(specScore)}
                                            </span>
                                            <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em]">
                                              SPEC
                                            </span>
                                          </div>
                                        ) : null}
                                        <img
                                          src={getPrimaryImage(base) || null}
                                          alt={base.name}
                                          className="h-full w-full object-contain p-2.5"
                                          onError={(event) => {
                                            event.target.src = `/api/placeholder/320/240?text=${encodeURIComponent(
                                              (base.brand || "D").slice(0, 1),
                                            )}`;
                                          }}
                                        />
                                      </div>

                                      <div className="flex min-w-0 flex-1 flex-col">
                                        <div className="flex flex-wrap items-center gap-2">
                                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
                                            {base.brand}
                                          </p>
                                          {isAlreadySelected ? (
                                            <span className="rounded-full border border-blue-200 bg-white px-2.5 py-1 text-xs font-medium text-blue-700">
                                              Selected
                                            </span>
                                          ) : null}
                                          {showAiTag ? (
                                            <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                                              AI Phone
                                            </span>
                                          ) : null}
                                        </div>

                                        <h4 className="mt-2.5 text-[1.45rem] font-semibold leading-tight tracking-tight text-slate-900 sm:text-[1.6rem]">
                                          {base.name}
                                        </h4>

                                        <p className="mt-2 text-sm font-medium text-slate-700">
                                          {formatVariantPrimaryLabel(
                                            displayVariant,
                                            vi,
                                          )}
                                          {variantMeta.color
                                            ? ` | ${variantMeta.color}`
                                            : ""}
                                        </p>

                                        <p className="mt-2.5 text-sm leading-6 text-slate-500 line-clamp-2">
                                          {summaryText}
                                        </p>

                                        {trendText ? (
                                          <div className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-blue-600">
                                            <BarChart3 className="h-4 w-4" />
                                            <span>{trendText}</span>
                                          </div>
                                        ) : null}

                                        <div className="mt-auto flex flex-wrap items-end justify-between gap-4 pt-4">
                                          <div>
                                            <p className="text-[1.7rem] font-semibold tracking-tight text-slate-900">
                                              {displayPrice
                                                ? formatPrice(displayPrice)
                                                : "N/A"}
                                            </p>
                                            <p
                                              className={`mt-1 text-sm ${getVariantAvailabilityTone(
                                                variantMeta.availability,
                                              )}`}
                                            >
                                              {variantMeta.availability}
                                            </p>
                                          </div>

                                          <span
                                            className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] ${
                                              isAlreadySelected
                                                ? "border-blue-200 bg-white text-blue-700"
                                                : "border-slate-200 bg-slate-50 text-slate-600 group-hover:border-blue-200 group-hover:text-blue-700"
                                            }`}
                                          >
                                            {isAlreadySelected
                                              ? "Update Variant"
                                              : "Compare"}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        <div className="border-t border-slate-200 bg-white px-5 py-3.5 sm:px-7 sm:py-4">
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-start gap-4">
                              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-300 bg-white text-blue-600">
                                <Shield className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-slate-900 sm:text-base">
                                  Your comparison stays private while you build
                                  it
                                </p>
                                <p className="mt-1 text-sm text-slate-500">
                                  {filteredDevices.length} results available and{" "}
                                  {visibleRemainingSlots} slot
                                  {visibleRemainingSlots !== 1 ? "s" : ""} left
                                  to fill.
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setShowSearch(false)}
                              className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 sm:px-7 sm:text-base"
                            >
                              Close
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : null}
            {/* Comparison Section */}
            {isComparing && comparedDevices.length >= MIN_DEVICES && (
              <div
                id="comparison-section"
                className="scroll-mt-32 space-y-6 animate-in fade-in duration-500"
              >
                {compareInsightsLoading ? (
                  <div className="rounded-sm border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-800">
                    Refreshing the live comparison recommendation from the
                    server...
                  </div>
                ) : null}

                {Array.isArray(compareInsights?.warnings) &&
                compareInsights.warnings.length > 0 ? (
                  <div className="rounded-sm border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    {compareInsights.warnings[0]}
                  </div>
                ) : null}

                <div className="grid gap-3 sm:gap-4">
                  <div className="space-y-3 sm:space-y-4">
                    {visibleCompareSections.map((section, sectionIndex) => {
                      const specKeys = sectionSpecKeys[section.id] || [];
                      if (specKeys.length === 0) return null;

                      const Icon = section.icon;
                      const isExpanded = expandedSections[section.id] ?? false;
                      const fixedCompareSlots = Array.from(
                        { length: MAX_DEVICES },
                        (_, slotIndex) => comparedDevices[slotIndex] || null,
                      );
                      const fixedProductSlotCount = fixedCompareSlots.length;
                      const labelColumnWidth = 220;
                      const productColumnWidth = 240;
                      const tableMinWidth = Math.max(
                        520,
                        labelColumnWidth +
                          fixedProductSlotCount * productColumnWidth,
                      );

                      return (
                        <section
                          key={`section-${section.id}`}
                          id={`spec-${section.id}`}
                          className="scroll-mt-32 overflow-hidden rounded-sm border border-slate-200/70 bg-white"
                        >
                          <button
                            type="button"
                            onClick={() => toggleCompareSection(section.id)}
                            className="flex w-full items-center justify-between gap-3 bg-slate-100 px-4 py-3.5 text-left sm:px-6 sm:py-4"
                          >
                            <div className="flex items-center gap-3">
                              <Icon
                                className={`h-4 w-4 ${
                                  SECTION_COLOR_CLASSES[section.id] ||
                                  "text-blue-600"
                                }`}
                              />
                              <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-700 sm:text-sm">
                                {section.label}
                              </h3>
                            </div>
                            <ChevronRight
                              className={`h-4 w-4 text-slate-400 transition-transform ${
                                isExpanded ? "rotate-90" : "rotate-0"
                              }`}
                            />
                          </button>

                          {isExpanded ? (
                            <div className="border-t border-slate-100">
                              <div className="hidden">
                                <div
                                  className="grid"
                                  style={{
                                    gridTemplateColumns: `${labelColumnWidth}px repeat(${fixedProductSlotCount}, ${productColumnWidth}px)`,
                                    minWidth: `${tableMinWidth}px`,
                                  }}
                                >
                                  <>
                                    <div className="sticky left-0 z-30 border-b border-r border-slate-200 bg-slate-100 px-2 py-3 text-left align-top text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-700">
                                      {section.label}
                                    </div>
                                    {fixedCompareSlots.map(
                                      (device, deviceIndex) => {
                                        if (!device) {
                                          return (
                                            <button
                                              key={`${section.id}-mobile-head-empty-${deviceIndex}`}
                                              type="button"
                                              onClick={openCatalogPanel}
                                              className={`flex ${
                                                section.id === "overview"
                                                  ? "min-h-[8.5rem]"
                                                  : "min-h-[5rem]"
                                              } flex-col items-center justify-center border-b border-slate-100 bg-slate-100 px-2.5 py-3 text-center text-slate-400 ${
                                                deviceIndex <
                                                fixedCompareSlots.length - 1
                                                  ? "border-r"
                                                  : ""
                                              }`}
                                            >
                                              <Plus className="h-5 w-5" />
                                              <span className="mt-2 text-xs font-semibold">
                                                Add product
                                              </span>
                                              <span className="mt-1 text-[10px]">
                                                Slot {deviceIndex + 1} of{" "}
                                                {MAX_DEVICES}
                                              </span>
                                            </button>
                                          );
                                        }

                                        const selectedVariant =
                                          getSelectedVariant(device);
                                        const name =
                                          device.name ||
                                          device.model ||
                                          device.title ||
                                          "Device";
                                        const price = getCardPrice(
                                          device,
                                          selectedVariant,
                                        );
                                        const specScoreRaw =
                                          getDeviceSpecScore(device);
                                        const specScoreValue =
                                          specScoreRaw == null
                                            ? null
                                            : Number(specScoreRaw);
                                        const hasSpecScore =
                                          Number.isFinite(specScoreValue);
                                        const serverScoreEntry =
                                          getServerScoreEntry(device);
                                        const overallScoreValue = Number(
                                          serverScoreEntry?.totalScore,
                                        );
                                        const hasOverallScore =
                                          Number.isFinite(overallScoreValue);

                                        return (
                                          <div
                                            key={`${section.id}-mobile-head-${device.id}`}
                                            className={`border-b border-slate-100 bg-slate-100 px-2.5 py-3 text-left align-top ${
                                              deviceIndex <
                                              fixedCompareSlots.length - 1
                                                ? "border-r"
                                                : ""
                                            }`}
                                          >
                                            <div className="flex flex-col items-start gap-2">
                                              <div className="flex h-14 w-full items-center justify-center overflow-hidden rounded-sm border border-slate-200 bg-white p-1.5">
                                                <img
                                                  src={
                                                    getPrimaryImage(device) ||
                                                    null
                                                  }
                                                  alt={name}
                                                  className="h-full w-full object-contain"
                                                  onError={(event) => {
                                                    event.target.src = `/api/placeholder/160/160?text=${encodeURIComponent(
                                                      (
                                                        device.brand || "D"
                                                      ).slice(0, 1),
                                                    )}`;
                                                  }}
                                                />
                                              </div>
                                              <div className="min-w-0 space-y-1">
                                                <div className="line-clamp-2 min-h-[2rem] text-[11px] font-bold leading-4 tracking-tight text-slate-950">
                                                  {name}
                                                </div>
                                                {selectedVariant ? (
                                                  <div className="text-[10px] font-medium leading-4 text-slate-500">
                                                    {formatVariantCompactLabel(
                                                      selectedVariant,
                                                      0,
                                                    )}
                                                  </div>
                                                ) : null}
                                                {section.id === "overview" ? (
                                                  <div className="text-xs font-bold text-slate-950">
                                                    {price
                                                      ? formatPrice(price)
                                                      : "N/A"}
                                                  </div>
                                                ) : null}
                                                {section.id === "overview" &&
                                                hasSpecScore ? (
                                                  <div
                                                    className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-white px-2 py-0.5 text-blue-700"
                                                    title="Spec score"
                                                  >
                                                    <span className="text-xs font-bold leading-none">
                                                      {Math.round(
                                                        specScoreValue,
                                                      )}
                                                    </span>
                                                    <span className="text-[6px] font-bold uppercase leading-none tracking-[0.18em]">
                                                      Spec
                                                    </span>
                                                  </div>
                                                ) : null}
                                                {section.id === "overview" &&
                                                hasOverallScore ? (
                                                  <div className="max-w-[7rem]">
                                                    <div className="flex items-center justify-between gap-2">
                                                      <span className="text-[8px] font-bold uppercase tracking-[0.12em] text-slate-500">
                                                        Compare
                                                      </span>
                                                      <span className="text-[10px] font-bold text-blue-700">
                                                        {formatSpecScoreLabel(
                                                          overallScoreValue,
                                                        )}
                                                      </span>
                                                    </div>
                                                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-blue-100">
                                                      <div
                                                        className="h-full rounded-full bg-blue-600"
                                                        style={{
                                                          width: `${Math.max(
                                                            0,
                                                            Math.min(
                                                              100,
                                                              overallScoreValue,
                                                            ),
                                                          )}%`,
                                                        }}
                                                      />
                                                    </div>
                                                  </div>
                                                ) : null}
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      },
                                    )}
                                  </>

                                  {specKeys.map((specKey, index) => {
                                    const specHint = getSpecHint(
                                      section.id,
                                      specKey,
                                    );
                                    const RowIcon = getSpecRowIcon(
                                      section.id,
                                      specKey,
                                    );

                                    return (
                                      <React.Fragment
                                        key={`${section.id}-mobile-grid-${specKey}`}
                                      >
                                        <div
                                          className={`sticky left-0 z-20 border-r border-t border-slate-200 px-2 py-3 align-top text-[9px] font-semibold text-slate-700 ${
                                            index % 2 === 0
                                              ? "bg-white"
                                              : "bg-slate-50"
                                          }`}
                                        >
                                          <div className="flex items-start gap-1.5">
                                            <RowIcon className="mt-0.5 h-3 w-3 flex-shrink-0 text-slate-400" />
                                            <div className="min-w-0">
                                              <div className="inline-flex items-center gap-1.5">
                                                <span>
                                                  {toNormalCase(specKey)}
                                                </span>
                                                {specHint ? (
                                                  <span
                                                    className="inline-flex cursor-help text-slate-400"
                                                    title={specHint}
                                                  >
                                                    <Info className="h-3.5 w-3.5" />
                                                  </span>
                                                ) : null}
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                        {fixedCompareSlots.map(
                                          (device, deviceIndex) => {
                                            if (!device) {
                                              return (
                                                <div
                                                  key={`${section.id}-mobile-empty-${deviceIndex}-${specKey}`}
                                                  className={`border-t border-slate-100 px-2.5 py-3 text-center text-[11px] leading-5 text-slate-300 ${
                                                    deviceIndex <
                                                    fixedCompareSlots.length - 1
                                                      ? "border-r"
                                                      : ""
                                                  }`}
                                                >
                                                  -
                                                </div>
                                              );
                                            }

                                            const {
                                              missingValue,
                                              renderedValue,
                                            } = getRenderedCompareSpecValue(
                                              device,
                                              section.id,
                                              specKey,
                                            );

                                            return (
                                              <div
                                                key={`${section.id}-mobile-${device.id}-${specKey}`}
                                                className={`border-t border-slate-100 px-2.5 py-3 text-[11px] leading-5 text-slate-700 ${
                                                  deviceIndex <
                                                  fixedCompareSlots.length - 1
                                                    ? "border-r"
                                                    : ""
                                                }`}
                                              >
                                                {missingValue ? (
                                                  <span className="text-slate-400">
                                                    Not available
                                                  </span>
                                                ) : (
                                                  renderedValue
                                                )}
                                              </div>
                                            );
                                          },
                                        )}
                                      </React.Fragment>
                                    );
                                  })}
                                </div>
                              </div>

                              <div className="overflow-x-auto">
                                <table
                                  className="w-full table-fixed border-collapse"
                                  style={{
                                    minWidth: `${tableMinWidth}px`,
                                  }}
                                >
                                  <colgroup>
                                    <col
                                      style={{ width: `${labelColumnWidth}px` }}
                                    />
                                    {fixedCompareSlots.map(
                                      (device, slotIndex) => (
                                        <col
                                          key={`${section.id}-col-slot-${slotIndex}-${device?.id || "empty"}`}
                                          style={{
                                            width: `${productColumnWidth}px`,
                                          }}
                                        />
                                      ),
                                    )}
                                  </colgroup>
                                  {section.id === "overview" ? (
                                    <thead>
                                      <tr className="bg-slate-100">
                                        <th className="sticky left-0 z-30 min-w-[92px] border-b border-r border-slate-200 bg-slate-100 px-2 py-3 text-left align-top text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-700 sm:min-w-[180px] sm:px-5 sm:py-4 sm:text-sm sm:tracking-[0.12em]">
                                          {section.label}
                                        </th>
                                        {fixedCompareSlots.map(
                                          (device, deviceIndex) => {
                                            if (!device) {
                                              return (
                                                <th
                                                  key={`${section.id}-head-empty-${deviceIndex}`}
                                                  className={`border-b border-slate-100 bg-slate-100 px-2.5 py-3 text-left align-top sm:px-5 sm:py-4 ${
                                                    deviceIndex <
                                                    fixedCompareSlots.length - 1
                                                      ? "border-r"
                                                      : ""
                                                  }`}
                                                >
                                                  <button
                                                    type="button"
                                                    onClick={openCatalogPanel}
                                                    className="flex min-h-[9rem] w-full flex-col items-center justify-center rounded-sm border border-dashed border-slate-300 bg-white/60 px-3 py-4 text-center text-slate-400 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                                                  >
                                                    <Plus className="h-5 w-5" />
                                                    <span className="mt-2 text-xs font-semibold">
                                                      Add product
                                                    </span>
                                                    <span className="mt-1 text-[10px]">
                                                      Slot {deviceIndex + 1} of{" "}
                                                      {MAX_DEVICES}
                                                    </span>
                                                  </button>
                                                </th>
                                              );
                                            }

                                            const selectedVariant =
                                              getSelectedVariant(device);
                                            const name =
                                              device.name ||
                                              device.model ||
                                              device.title ||
                                              "Device";
                                            const price = getCardPrice(
                                              device,
                                              selectedVariant,
                                            );
                                            const specScoreRaw =
                                              getDeviceSpecScore(device);
                                            const specScoreValue =
                                              specScoreRaw == null
                                                ? null
                                                : Number(specScoreRaw);
                                            const hasSpecScore =
                                              Number.isFinite(specScoreValue);
                                            const serverScoreEntry =
                                              getServerScoreEntry(device);
                                            const overallScoreValue = Number(
                                              serverScoreEntry?.totalScore,
                                            );
                                            const hasOverallScore =
                                              Number.isFinite(
                                                overallScoreValue,
                                              );
                                            const overallScorePercent =
                                              hasOverallScore
                                                ? Math.max(
                                                    0,
                                                    Math.min(
                                                      100,
                                                      overallScoreValue,
                                                    ),
                                                  )
                                                : null;

                                            return (
                                              <th
                                                key={`${section.id}-head-${device.id}`}
                                                className={`relative border-b border-slate-100 bg-slate-100 px-2.5 py-3 pr-10 text-left align-top sm:px-5 sm:py-4 sm:pr-24 md:sticky md:top-0 md:z-10 ${
                                                  deviceIndex <
                                                  fixedCompareSlots.length - 1
                                                    ? "border-r"
                                                    : ""
                                                }`}
                                              >
                                                {hasSpecScore ? (
                                                  <div
                                                    className="absolute right-2 top-2 inline-flex items-end gap-0.5 text-blue-600 sm:right-5 sm:top-4 sm:gap-1.5"
                                                    title="Spec score"
                                                  >
                                                    <span className="text-base font-semibold leading-none tracking-tight sm:text-[2rem]">
                                                      {Math.round(
                                                        specScoreValue,
                                                      )}
                                                    </span>
                                                    <span className="mb-0.5 flex flex-col text-[5px] font-bold uppercase leading-[0.9] tracking-[0.16em] sm:text-[8px] sm:tracking-[0.28em]">
                                                      <span>Spec</span>
                                                      <span>Score</span>
                                                    </span>
                                                  </div>
                                                ) : null}
                                                <div className="flex flex-col items-start gap-2.5">
                                                  <div className="min-w-0">
                                                    <div className="line-clamp-2 text-xs font-semibold tracking-tight text-slate-900 sm:text-base">
                                                      {name}
                                                    </div>
                                                    {selectedVariant ? (
                                                      <div className="mt-1 text-[10px] font-medium text-slate-500 sm:text-sm">
                                                        {formatVariantCompactLabel(
                                                          selectedVariant,
                                                          0,
                                                        )}
                                                      </div>
                                                    ) : null}
                                                    <div className="mt-1.5 text-xs font-semibold text-slate-900 sm:mt-2 sm:text-sm">
                                                      {price
                                                        ? formatPrice(price)
                                                        : "N/A"}
                                                    </div>
                                                    {hasOverallScore ? (
                                                      <div className="mt-2 max-w-[7rem] sm:mt-3 sm:max-w-[11rem]">
                                                        <div className="flex items-center justify-between gap-3">
                                                          <span className="text-[8px] font-semibold uppercase tracking-[0.12em] text-slate-500 sm:text-[11px] sm:tracking-[0.14em]">
                                                            Compare
                                                          </span>
                                                          <span className="text-[10px] font-semibold text-blue-700 sm:text-sm">
                                                            {formatSpecScoreLabel(
                                                              overallScoreValue,
                                                            )}
                                                          </span>
                                                        </div>
                                                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-200">
                                                          <div
                                                            className="h-full rounded-full bg-blue-600"
                                                            style={{
                                                              width: `${overallScorePercent}%`,
                                                            }}
                                                          />
                                                        </div>
                                                      </div>
                                                    ) : null}
                                                  </div>
                                                </div>
                                              </th>
                                            );
                                          },
                                        )}
                                      </tr>
                                    </thead>
                                  ) : null}
                                  <tbody>
                                    {specKeys.map((specKey, index) => {
                                      const specHint = getSpecHint(
                                        section.id,
                                        specKey,
                                      );
                                      const RowIcon = getSpecRowIcon(
                                        section.id,
                                        specKey,
                                      );

                                      return (
                                        <tr
                                          key={`${section.id}-${specKey}`}
                                          className={
                                            index % 2 === 0
                                              ? "bg-white"
                                              : "bg-slate-50/30"
                                          }
                                        >
                                          <td
                                            className={`sticky left-0 z-20 border-r border-t border-slate-200 px-2 py-3 align-top text-[9px] font-semibold text-slate-700 sm:px-5 sm:py-4 sm:text-sm ${
                                              index % 2 === 0
                                                ? "bg-white"
                                                : "bg-slate-50"
                                            }`}
                                          >
                                            <div className="flex items-start gap-1.5 sm:gap-3">
                                              <RowIcon className="mt-0.5 h-3 w-3 flex-shrink-0 text-slate-400 sm:h-4 sm:w-4" />
                                              <div className="min-w-0">
                                                <div className="inline-flex items-center gap-1.5">
                                                  <span>
                                                    {toNormalCase(specKey)}
                                                  </span>
                                                  {specHint ? (
                                                    <span
                                                      className="inline-flex cursor-help text-slate-400 hover:text-blue-500"
                                                      title={specHint}
                                                    >
                                                      <Info className="h-3.5 w-3.5" />
                                                    </span>
                                                  ) : null}
                                                </div>
                                              </div>
                                            </div>
                                          </td>
                                          {fixedCompareSlots.map(
                                            (device, deviceIndex) => {
                                              if (!device) {
                                                return (
                                                  <td
                                                    key={`${section.id}-empty-${deviceIndex}-${specKey}`}
                                                    className={`border-t border-slate-100 px-2.5 py-3 align-top text-center text-[11px] leading-5 text-slate-300 sm:px-5 sm:py-4 sm:text-sm sm:leading-7 ${
                                                      deviceIndex <
                                                      fixedCompareSlots.length -
                                                        1
                                                        ? "border-r"
                                                        : ""
                                                    }`}
                                                  >
                                                    -
                                                  </td>
                                                );
                                              }

                                              const {
                                                missingValue,
                                                renderedValue,
                                              } = getRenderedCompareSpecValue(
                                                device,
                                                section.id,
                                                specKey,
                                              );

                                              return (
                                                <td
                                                  key={`${section.id}-${device.id}-${specKey}`}
                                                  className={`border-t border-slate-100 px-2.5 py-3 align-top text-[11px] leading-5 text-slate-700 sm:px-5 sm:py-4 sm:text-sm sm:leading-7 ${
                                                    deviceIndex <
                                                    fixedCompareSlots.length - 1
                                                      ? "border-r"
                                                      : ""
                                                  }`}
                                                >
                                                  {missingValue ? (
                                                    <span className="text-slate-400">
                                                      Not available
                                                    </span>
                                                  ) : (
                                                    renderedValue
                                                  )}
                                                </td>
                                              );
                                            },
                                          )}
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          ) : null}
                        </section>
                      );
                    })}
                  </div>
                </div>
                {compareInsights?.overallWinner &&
                comparisonRecommendationText ? (
                  <div className="rounded-sm p-5">
                    <h3 className="text-base font-semibold text-slate-900">
                      Recommendation
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-slate-700 sm:text-base">
                      {comparisonRecommendationText}
                    </p>
                    {comparisonRecommendationPoints.length > 0 ? (
                      <ul className="mt-4 space-y-2 text-sm text-slate-700">
                        {comparisonRecommendationPoints.map((point, index) => (
                          <li
                            key={`recommendation-point-${index}`}
                            className="flex items-start gap-2"
                          >
                            <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-600" />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
        {/* Empty State */}
        {false && usedSlots === 0 && (
          <div className="py-8 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center   bg-blue-50">
              <BarChart3 className="h-10 w-10 text-blue-600" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-slate-900">
              Start Comparing
            </h3>
            <p className="mx-auto mb-4 max-w-md text-slate-600">
              Add 2-4 devices to see detailed specifications side by side
            </p>
            <button
              onClick={openCatalogPanel}
              className="inline-flex items-center gap-2   bg-blue-600 px-6 py-2.5 font-semibold text-white transition-colors hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Add Your First Device
            </button>
          </div>
        )}
        {/* Details Modal */}
        {showDetailsModal && modalDevice && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white   max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-300">
              {/* Modal Header */}
              <div className="sticky top-0 z-20 bg-white px-6 py-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 flex-shrink-0 overflow-hidden rounded-[18px] border border-blue-200 bg-blue-50 p-1">
                      <img
                        src={getPrimaryImage(modalDevice)}
                        alt={modalDevice.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">
                        {modalDevice.name}
                      </h2>
                      <p className="text-sm text-gray-600">
                        {modalDevice.brand}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="rounded-[18px] p-2 transition-colors hover:bg-gray-100"
                  >
                    <X className="h-5 w-5 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Modal Content - Single View */}
              <div className="p-6 space-y-6 overflow-y-auto">
                {/* Specifications Section */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {[
                      {
                        label: "Brand",
                        value: modalDevice.brand,
                        icon: "🏷️",
                      },
                      {
                        label: "Model",
                        value: modalDevice.model || modalDevice.name,
                        icon: "📱",
                      },
                      {
                        label: "Price",
                        value: formatPrice(
                          getSelectedVariant(modalDevice)?.base_price ||
                            modalDevice.price ||
                            0,
                        ),
                        icon: "💰",
                        color: "green",
                      },
                      {
                        label: "Variant",
                        value: getSelectedVariant(modalDevice)
                          ? `${getSelectedVariant(modalDevice).ram}/${getSelectedVariant(modalDevice).storage}`
                          : "N/A",
                        icon: "📦",
                      },
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        className="  border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="mb-2 text-2xl">{item.icon}</div>
                        <div className="mb-1 text-xs font-medium text-slate-600">
                          {item.label}
                        </div>
                        <div
                          className={`font-bold text-sm ${
                            item.color === "green"
                              ? "text-green-600"
                              : "text-slate-900"
                          }`}
                        >
                          {item.value}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="overflow-hidden   border border-slate-200 bg-white">
                    <table className="w-full">
                      <tbody className="divide-y divide-slate-100">
                        {[
                          {
                            label: "Operating System",
                            value: modalDevice.performance?.os || "N/A",
                          },
                          {
                            label: "Processor",
                            value: modalDevice.performance?.processor || "N/A",
                          },
                          {
                            label: "RAM",
                            value:
                              getSelectedVariant(modalDevice)?.ram ||
                              modalDevice.performance?.ram ||
                              "N/A",
                          },
                          {
                            label: "Storage",
                            value:
                              getSelectedVariant(modalDevice)?.storage ||
                              modalDevice.performance?.storage ||
                              "N/A",
                          },
                          {
                            label: "Launch Date",
                            value: modalDevice.launch_date
                              ? new Date(
                                  modalDevice.launch_date,
                                ).toLocaleDateString()
                              : "N/A",
                          },
                        ].map((item, idx) => (
                          <tr
                            key={idx}
                            className={
                              idx % 2 === 0 ? "bg-white" : "bg-slate-50"
                            }
                          >
                            <td className="w-1/3 px-6 py-3 text-sm font-medium text-slate-600">
                              {item.label}
                            </td>
                            <td className="w-2/3 px-6 py-3 text-sm font-semibold text-slate-900">
                              {item.value}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Performance Section */}
              <div className="space-y-3">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
                  <div className="rounded-[16px] bg-amber-500 p-2">
                    <Cpu className="h-5 w-5 text-white" />
                  </div>
                  Performance
                </h3>
                <div className="overflow-hidden   border border-slate-200 bg-white">
                  <table className="w-full">
                    <tbody className="divide-y divide-slate-100">
                      {modalDevice.performance &&
                        Object.entries(modalDevice.performance)
                          .filter(
                            ([k, v]) =>
                              v &&
                              !["ai_features", "sphere_rating"].includes(k),
                          )
                          .map(([key, value], idx) => (
                            <tr
                              key={key}
                              className={
                                idx % 2 === 0 ? "bg-white" : "bg-slate-50"
                              }
                            >
                              <td className="w-1/3 px-6 py-3 text-sm font-medium text-slate-600">
                                {toNormalCase(key)}
                              </td>
                              <td className="w-2/3 px-6 py-3 text-sm font-semibold text-slate-900">
                                {formatSpecValue(value, key)}
                              </td>
                            </tr>
                          ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Display Section */}
              <div className="space-y-3">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
                  <div className="rounded-[16px] bg-sky-500 p-2">
                    <Monitor className="h-5 w-5 text-white" />
                  </div>
                  Display
                </h3>
                <div className="overflow-hidden   border border-slate-200 bg-white">
                  <table className="w-full">
                    <tbody className="divide-y divide-slate-100">
                      {modalDevice.display &&
                        Object.entries(modalDevice.display)
                          .filter(([k, v]) => v && !["ai_features"].includes(k))
                          .map(([key, value], idx) => (
                            <tr
                              key={key}
                              className={
                                idx % 2 === 0 ? "bg-white" : "bg-slate-50"
                              }
                            >
                              <td className="w-1/3 px-6 py-3 text-sm font-medium text-slate-600">
                                {toNormalCase(key)}
                              </td>
                              <td className="w-2/3 px-6 py-3 text-sm font-semibold text-slate-900">
                                {formatSpecValue(value, key)}
                              </td>
                            </tr>
                          ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Camera Section */}
              <div className="space-y-3">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
                  <div className="rounded-[16px] bg-blue-500 p-2">
                    <Camera className="h-5 w-5 text-white" />
                  </div>
                  Camera
                </h3>
                <div className="overflow-hidden   border border-slate-200 bg-white">
                  <table className="w-full">
                    <tbody className="divide-y divide-slate-100">
                      {[
                        {
                          label: "Main Camera",
                          value: (() => {
                            const cam = modalDevice.camera || {};
                            if (cam.main_camera_megapixels) {
                              return `${cam.main_camera_megapixels} MP`;
                            }
                            const rearMain =
                              cam.rear_camera?.main_camera ||
                              cam.rear_camera?.main ||
                              cam.main_camera ||
                              cam.main ||
                              null;
                            if (!rearMain) return "N/A";
                            if (typeof rearMain === "object") {
                              return (
                                rearMain.resolution ||
                                rearMain.megapixels ||
                                formatSpecValue(rearMain, "main_camera")
                              );
                            }
                            return formatSpecValue(rearMain, "main_camera");
                          })(),
                        },
                        {
                          label: "Front Camera",
                          value: modalDevice.camera?.front_camera
                            ? formatSpecValue(
                                modalDevice.camera.front_camera,
                                "front_camera",
                              )
                            : "N/A",
                        },
                        {
                          label: "Recording",
                          value:
                            modalDevice.camera?.video_recording ||
                            modalDevice.camera?.recording ||
                            "N/A",
                        },
                        {
                          label: "Features",
                          value:
                            modalDevice.camera
                              ?.rear_camera_photography_features ||
                            modalDevice.camera?.features ||
                            modalDevice.camera?.ai_features ||
                            "N/A",
                        },
                      ].map((item, idx) => (
                        <tr
                          key={idx}
                          className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}
                        >
                          <td className="w-1/3 px-6 py-3 text-sm font-medium text-slate-600">
                            {item.label}
                          </td>
                          <td className="w-2/3 px-6 py-3 text-sm font-semibold text-slate-900">
                            {formatSpecValue(item.value, item.label)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Battery Section */}
              <div className="space-y-3">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
                  <div className="rounded-[16px] bg-emerald-500 p-2">
                    <Battery className="h-5 w-5 text-white" />
                  </div>
                  Battery
                </h3>
                <div className="overflow-hidden   border border-slate-200 bg-white">
                  <table className="w-full">
                    <tbody className="divide-y divide-slate-100">
                      {[
                        {
                          label: "Capacity",
                          value: (() => {
                            const b = modalDevice.battery || {};
                            const cap =
                              b.battery_capacity_mah ||
                              b.battery_capacity ||
                              b.capacity_mah ||
                              b.capacity ||
                              b.battery ||
                              null;
                            if (!cap) return "N/A";
                            const capText = String(cap);
                            return /mah/i.test(capText)
                              ? capText
                              : `${capText} mAh`;
                          })(),
                        },
                        {
                          label: "Type",
                          value:
                            modalDevice.battery?.type ||
                            modalDevice.battery?.battery_type ||
                            "N/A",
                        },
                        {
                          label: "Fast Charging",
                          value:
                            modalDevice.battery?.fast_charging ||
                            modalDevice.battery?.charging_power ||
                            modalDevice.battery?.charging ||
                            "N/A",
                        },
                        {
                          label: "Wireless Charging",
                          value:
                            modalDevice.battery?.wireless_charging ||
                            modalDevice.battery?.wireless_reverse_charging ||
                            "N/A",
                        },
                      ].map((item, idx) => (
                        <tr
                          key={idx}
                          className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}
                        >
                          <td className="w-1/3 px-6 py-3 text-sm font-medium text-slate-600">
                            {item.label}
                          </td>
                          <td className="w-2/3 px-6 py-3 text-sm font-semibold text-slate-900">
                            {formatSpecValue(item.value, item.label)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Network Section */}
              <div className="space-y-3">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
                  <div className="rounded-[16px] bg-cyan-500 p-2">
                    <Wifi className="h-5 w-5 text-white" />
                  </div>
                  Network
                </h3>
                <div className="overflow-hidden   border border-slate-200 bg-white">
                  <table className="w-full">
                    <tbody className="divide-y divide-slate-100">
                      {[
                        {
                          label: "5G",
                          value:
                            modalDevice.network?.["5g"] ||
                            modalDevice.network?.["5g_bands"] ||
                            modalDevice.network?.five_g ||
                            modalDevice.connectivity?.["5g_bands"] ||
                            modalDevice.connectivity?.network_type ||
                            "N/A",
                        },
                        {
                          label: "WiFi",
                          value:
                            modalDevice.connectivity?.wifi ||
                            modalDevice.network?.wifi ||
                            "N/A",
                        },
                        {
                          label: "Bluetooth",
                          value:
                            modalDevice.connectivity?.bluetooth ||
                            modalDevice.network?.bluetooth ||
                            "N/A",
                        },
                        {
                          label: "GPS",
                          value:
                            modalDevice.network?.gps ||
                            modalDevice.connectivity?.gps ||
                            "N/A",
                        },
                        {
                          label: "NFC",
                          value:
                            modalDevice.connectivity?.nfc ||
                            modalDevice.network?.nfc ||
                            "N/A",
                        },
                      ].map((item, idx) => (
                        <tr
                          key={idx}
                          className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}
                        >
                          <td className="w-1/3 px-6 py-3 text-sm font-medium text-slate-600">
                            {item.label}
                          </td>
                          <td className="w-2/3 px-6 py-3 text-sm font-semibold text-slate-900">
                            {formatSpecValue(item.value, item.label)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 flex gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="flex-1 rounded-[18px] px-4 py-2 font-medium text-slate-700 transition-colors hover:bg-white hover:text-slate-900"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileCompare;
