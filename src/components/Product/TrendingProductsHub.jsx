import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FaCalendarAlt,
  FaExternalLinkAlt,
  FaFilter,
  FaLaptop,
  FaMobileAlt,
  FaSearch,
  FaStore,
  FaTv,
  FaTimes,
} from "react-icons/fa";
import Spinner from "../ui/Spinner";
import useDevice from "../../hooks/useDevice";
import useStoreLogos from "../../hooks/useStoreLogos";
import SEO from "../SEO";
import { generateSlug } from "../../utils/slugGenerator";
import {
  createCollectionSchema,
  createItemListSchema,
} from "../../utils/schemaGenerators";
import { buildListSeoKeywords } from "../../utils/seoKeywordBuilder";
import { normalizeSeoTitle } from "../../utils/seoTitle";
import {
  computePopularSmartphoneFeatures,
  SMARTPHONE_FEATURE_CATALOG,
} from "../../utils/smartphonePopularFeatures";
import {
  computePopularLaptopFeatures,
  getLaptopFeatureSortValue,
  matchesLaptopFeature,
} from "../../utils/laptopPopularFeatures";
import {
  computePopularTvFeatures,
  getTvFeatureSortValue,
  matchesTvFeature,
} from "../../utils/tvPopularFeatures";

const ROUTE_FEED_CACHE_KEY = "hooks_smartphone_route_feed_v1";
const RUPEE = "\u20B9";
const API_BASE = "https://api.apisphere.in";
const SITE_ORIGIN = "https://tryhook.shop";
const CURRENT_MONTH_YEAR = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "numeric",
}).format(new Date());
const CURRENT_DAY_MONTH_YEAR = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
}).format(new Date());

const CATEGORIES = {
  smartphones: {
    id: "smartphones",
    label: "Smartphones",
    badge: "TRENDING SMARTPHONES",
    title: `Trending smartphones in India (${CURRENT_DAY_MONTH_YEAR}) - Full Specifications, Features and Price - Hooks`,
    description:
      "Browse trending smartphones across camera, battery, display, and performance so you can quickly spot which device truly fits your needs. Each phone can be evaluated by day-to-day photography, low-light shots, portrait quality, video stabilization, charging speed, chipset performance, RAM, storage, refresh rate, brightness, speaker quality, software experience, and long-term update support. This page brings those details together in one place, along with live prices from trusted online stores, so you do not have to jump between dozens of product pages or reviews. Whether you are searching for a flagship camera phone, a battery-focused budget pick, a gaming-ready powerhouse, or a balanced all-rounder for everyday use, the trending list helps you narrow the field quickly. Use the filters and product cards to sort by brand, price, or feature, then open the models that are gaining the most attention right now. You can also identify phones with fast charging, 5G support, AMOLED or OLED displays, high refresh rates, and generous storage options. The goal is simple: reduce confusion, highlight the strongest contenders, and help you choose a smartphone with confidence, value, and the right blend of performance and features. You can also review warranties, exchange offers, discounts, and color variants to find the best total value before you buy, and every week new launches reshuffle the lineup, so checking trends keeps you current.",
    endpoint: "/api/public/trending/smartphones?limit=120",
    detailPath: "/smartphones",
    icon: FaMobileAlt,
    metaTitle: `Trending smartphones (${CURRENT_DAY_MONTH_YEAR}) - Full Specifications, Features and Price`,
    metaDescription:
      "Browse trending smartphones with detailed specs, latest prices, and best online deals.",
    metaKeywords:
      "trending smartphones, smartphone prices in india, best smartphones, smartphone specs, latest phone deals",
    searchPlaceholder:
      "Search smartphones by brand, model, or specifications...",
  },
  laptops: {
    id: "laptops",
    label: "Laptops",
    badge: "TRENDING LAPTOPS",
    title: `Browse trending laptops in India (${CURRENT_MONTH_YEAR}): Prices, Specs, and Best Deals`,
    description:
      "Browse trending laptops by processor, RAM, storage, display, and battery life, plus live prices from top online stores.",
    endpoint: "/api/public/trending/laptops?limit=120",
    detailPath: "/laptops",
    icon: FaLaptop,
    metaTitle: `Browse trending laptops in India (${CURRENT_MONTH_YEAR}) - Specs, Prices, Deals`,
    metaDescription:
      "Browse trending laptops by processor, RAM, storage, display, and latest offers.",
    metaKeywords:
      "trending laptops, laptop prices in india, best laptops, laptop specs, latest laptop deals",
    searchPlaceholder:
      "Search laptops by brand, model, processor, or memory...",
  },
  tvs: {
    id: "tvs",
    label: "TVs",
    badge: "TRENDING TVS",
    title: `Browse trending TVs in India (${CURRENT_MONTH_YEAR}): Prices, Specs, and Best Deals`,
    description:
      "Browse trending TVs by screen size, resolution, refresh rate, panel type, and smart features, plus live prices from top online stores.",
    endpoint: "/api/public/trending/tvs?limit=120",
    detailPath: "/tvs",
    icon: FaTv,
    metaTitle: `Browse trending TVs in India (${CURRENT_MONTH_YEAR}) - Specs, Prices, Deals`,
    metaDescription:
      "Browse trending TVs with detailed specifications, latest prices, and direct buy links.",
    metaKeywords:
      "trending tvs, smart tv prices in india, best 4k tv, tv specs, latest tv deals",
    searchPlaceholder:
      "Search TVs by brand, model, screen size, or panel type...",
  },
};

const ALIASES = {
  smartphone: "smartphones",
  smartphones: "smartphones",
  mobile: "smartphones",
  mobiles: "smartphones",
  laptop: "laptops",
  laptops: "laptops",
  tv: "tvs",
  tvs: "tvs",
  television: "tvs",
  televisions: "tvs",
};

const text = (v) => {
  if (v === null || v === undefined) return "";
  const t = String(v).trim().replace(/\s+/g, " ");
  if (!t) return "";
  const lc = t.toLowerCase();
  if (lc === "null" || lc === "undefined" || lc === "na" || lc === "n/a")
    return "";
  return t;
};

const first = (...values) => {
  for (const v of values) {
    const t = text(v);
    if (t) return t;
  }
  return "";
};

const num = (v) => {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const n = Number(String(v).replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : null;
};

const clampScore100 = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  if (n <= 1) return Math.max(0, Math.min(100, n * 100));
  if (n <= 10) return Math.max(0, Math.min(100, n * 10));
  return Math.max(0, Math.min(100, n));
};

const mapScoreToDisplayBand = (score, minTarget = 80, maxTarget = 98) => {
  const normalized = clampScore100(score);
  if (normalized == null) return null;
  const mapped = minTarget + (normalized / 100) * (maxTarget - minTarget);
  return Number(mapped.toFixed(1));
};

const resolveSpecScore = (row) => {
  const source = row && typeof row === "object" ? row : {};
  const toFiniteNumber = (value) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  };

  const overallScoreRaw = toFiniteNumber(
    source.spec_score_v2 ??
      source.specScoreV2 ??
      source.overall_score_v2 ??
      source.overallScoreV2 ??
      source.spec_score ??
      source.specScore ??
      source.overall_score ??
      source.overallScore ??
      source.field_profile?.score ??
      source.fieldProfile?.score,
  );

  const overallScoreDisplay = toFiniteNumber(
    source.spec_score_v2_display_80_98 ??
      source.specScoreV2Display8098 ??
      source.overall_score_v2_display_80_98 ??
      source.overallScoreV2Display8098 ??
      source.spec_score_display ??
      source.specScoreDisplay ??
      source.overall_score_display ??
      source.overallScoreDisplay,
  );

  return overallScoreDisplay != null
    ? overallScoreDisplay
    : mapScoreToDisplayBand(overallScoreRaw);
};

const priceLabel = (v) => {
  const n = num(v);
  return n === null
    ? "Price not available"
    : `${RUPEE} ${Math.round(n).toLocaleString("en-IN")}`;
};

const formatStorePriceDisplay = (v) => {
  const n = num(v);
  if (n === null) return "Price not available";
  return `${RUPEE} ${Math.round(n).toLocaleString("en-IN")}`;
};

const arr = (v) => (Array.isArray(v) ? v : []);
const obj = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});

const formatNameList = (items = []) => {
  const list = arr(items)
    .map((item) => text(item))
    .filter(Boolean);
  if (list.length === 0) return "";
  if (list.length === 1) return list[0];
  if (list.length === 2) return `${list[0]} and ${list[1]}`;
  return `${list.slice(0, -1).join(", ")}, and ${list[list.length - 1]}`;
};

const getRows = (payload, cat) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.trending)) return payload.trending;
  if (cat === "smartphones")
    return arr(payload?.smartphones || payload?.data || payload?.rows);
  if (cat === "laptops")
    return arr(payload?.laptops || payload?.data || payload?.rows);
  return arr(payload?.tvs || payload?.data || payload?.rows);
};

const mapStorePrice = (sp) => {
  const s = obj(sp);
  return {
    storeName: first(s.store_name, s.store, s.storeName, "Store"),
    price: num(s.price),
    url: first(s.url, s.link),
    saleStartDate: first(s.sale_start_date, s.sale_date, s.saleStartDate),
    isPrebooking: s.is_prebooking === true,
    isLive: s.is_live === true,
    availabilityStatus: first(s.availability_status),
    ctaLabel: first(s.cta_label),
    logo: first(s.logo),
  };
};

const getVariants = (row) => {
  const meta = obj(row.metadata || row.metadata_json);
  const sections = obj(meta.spec_sections);
  const variants = arr(row.variants).length
    ? row.variants
    : arr(row.variants_json).length
      ? row.variants_json
      : arr(meta.variants).length
        ? meta.variants
        : arr(meta.variants_json).length
          ? meta.variants_json
          : arr(sections.variants_json);
  return arr(variants).map((v, i) => {
    const parsed = obj(v);
    return {
      id: parsed.variant_id ?? parsed.id ?? i,
      ram: first(parsed.ram, parsed.memory),
      storage: first(parsed.storage, parsed.rom, parsed.internal_storage),
      basePrice: num(parsed.base_price ?? parsed.price),
      stores: arr(parsed.store_prices).map(mapStorePrice),
    };
  });
};

const getImages = (row, cat) => {
  if (cat === "laptops") {
    const meta = obj(row.metadata || row.metadata_json);
    const sections = obj(meta.spec_sections);
    return arr(row.images || meta.images || sections.images_json)
      .map(text)
      .filter(Boolean);
  }
  if (cat === "tvs")
    return arr(row.images_json || row.images)
      .map(text)
      .filter(Boolean);
  return arr(row.images || row.images_json)
    .map(text)
    .filter(Boolean);
};

const getStorePrices = (row, variants) => {
  const list = [
    ...variants.flatMap((v) => arr(v.stores)),
    ...arr(row.store_prices).map(mapStorePrice),
  ].filter((s) => s.storeName);
  if (!list.length) {
    const top = num(row.price ?? row.base_price ?? row.starting_price);
    if (top !== null)
      list.push({ storeName: "Online Store", price: top, url: "" });
  }
  const seen = new Set();
  const dedup = [];
  list.forEach((s) => {
    const key = `${String(s.storeName).toLowerCase()}-${s.price || "na"}-${s.url || ""}`;
    if (seen.has(key)) return;
    seen.add(key);
    dedup.push(s);
  });
  dedup.sort(
    (a, b) =>
      (a.price ?? Number.MAX_SAFE_INTEGER) -
      (b.price ?? Number.MAX_SAFE_INTEGER),
  );
  return dedup;
};

const getIndiaDateOnly = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const tokens = {};
  parts.forEach((part) => {
    if (part.type !== "literal") tokens[part.type] = part.value;
  });
  return `${tokens.year}-${tokens.month}-${tokens.day}`;
};

const normalizeDateOnly = (value) => {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
};

const formatSaleStartLabel = (value) => {
  const normalized = normalizeDateOnly(value);
  if (!normalized) return "";
  const date = new Date(`${normalized}T00:00:00+05:30`);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const isPrebookingStore = (store, launchDate = null) => {
  if (store?.isPrebooking === true) return true;
  if (store?.availabilityStatus === "prebooking") return true;
  if (
    /^(pre(book|order)|coming\s*soon)$/i.test(
      String(store?.ctaLabel || "").trim(),
    )
  )
    return true;
  const saleStartDate = normalizeDateOnly(store?.saleStartDate);
  if (saleStartDate) {
    return saleStartDate > getIndiaDateOnly();
  }
  if (!saleStartDate) {
    const normalizedLaunchDate = normalizeDateOnly(launchDate);
    return Boolean(
      normalizedLaunchDate && normalizedLaunchDate >= getIndiaDateOnly(),
    );
  }
  return false;
};

const normalizeStoreKey = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const normalizeAssetUrl = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return null;
  if (/^(https?:|data:|blob:)/i.test(raw)) return raw;
  if (raw.startsWith("//")) return `https:${raw}`;
  if (raw.startsWith("/")) return `${API_BASE}${raw}`;
  if (/^(uploads|assets|images)\//i.test(raw)) {
    return `${API_BASE}/${raw.replace(/^\/+/, "")}`;
  }
  return raw;
};

const getOfficialBrandStoreUrl = (stores, brandName, brandWebsite = null) => {
  if (typeof brandWebsite === "string" && brandWebsite.trim()) {
    return brandWebsite.trim();
  }
  const brandKey = normalizeStoreKey(brandName);
  if (!brandKey) return null;

  return (
    arr(stores).find((store) => {
      const storeName = normalizeStoreKey(
        store?.storeName || store?.store || store?.store_name,
      );
      if (!store?.url || !storeName) return false;
      return (
        storeName === brandKey ||
        storeName.includes(`${brandKey}store`) ||
        storeName.includes(`${brandKey}official`) ||
        storeName.includes(`official${brandKey}`)
      );
    })?.url || null
  );
};

const getAvailabilityRows = (
  stores,
  brandName,
  brandLogo,
  brandWebsite = null,
  launchDate = null,
) => {
  const normalizedStores = arr(stores).map((store) => {
    const saleStartDate = normalizeDateOnly(store?.saleStartDate);
    const prebooking = isPrebookingStore(store, launchDate);
    return {
      ...store,
      saleStartDate,
      isPrebooking: prebooking,
      isLive: !prebooking,
      ctaLabel: prebooking ? "Coming Soon" : store?.ctaLabel || "Buy Now",
    };
  });

  const liveStores = normalizedStores.filter((store) => !store.isPrebooking);
  liveStores.sort(
    (a, b) =>
      (a.price ?? Number.MAX_SAFE_INTEGER) -
      (b.price ?? Number.MAX_SAFE_INTEGER),
  );
  if (liveStores.length > 0) {
    return { mode: "live", stores: liveStores, hiddenCount: 0 };
  }

  const prebookingStores = normalizedStores.filter(
    (store) => store.isPrebooking,
  );
  prebookingStores.sort(
    (a, b) =>
      (a.price ?? Number.MAX_SAFE_INTEGER) -
      (b.price ?? Number.MAX_SAFE_INTEGER),
  );
  if (prebookingStores.length === 0) {
    return { mode: "live", stores: normalizedStores, hiddenCount: 0 };
  }

  const primaryPrebooking = prebookingStores[0];
  const officialBrandUrl = getOfficialBrandStoreUrl(
    normalizedStores,
    brandName,
    brandWebsite,
  );
  return {
    mode: "prebooking",
    stores: [
      {
        ...primaryPrebooking,
        storeName: brandName || primaryPrebooking.storeName || "Brand Store",
        logo: brandLogo || primaryPrebooking.logo || null,
        url: officialBrandUrl || null,
        ctaLabel: "Coming Soon",
        availabilityNote: primaryPrebooking.saleStartDate
          ? `Sale starts ${formatSaleStartLabel(primaryPrebooking.saleStartDate)}`
          : "",
      },
    ],
    hiddenCount: 0,
  };
};

const cameraLabel = (row) => {
  const camera = obj(row.camera);
  const rear = obj(camera.rear_camera);
  const candidates = [];
  const push = (v) => {
    const n = num(v);
    if (n !== null) candidates.push(n);
  };
  push(camera.main_camera_megapixels);
  push(camera.rear_camera_megapixels);
  Object.values(rear).forEach((lens) => push(obj(lens).resolution));
  return candidates.length
    ? `${Math.max(...candidates)} MP Camera`
    : first(camera.resolution);
};

const batteryLabel = (row) => {
  const battery = obj(row.battery);
  const cap = first(
    battery.capacity,
    battery.battery_capacity,
    row.battery_capacity,
  );
  if (!cap) return "";
  const n = num(cap);
  if (n === null) return cap;
  return /wh/i.test(cap) ? `${n} Wh Battery` : `${n} mAh Battery`;
};

const dateLabel = (v) => {
  const raw = text(v);
  if (!raw) return "";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "";
  // Avoid rendering placeholder epoch-style dates from invalid/null-like values.
  if (d.getUTCFullYear() <= 1971) return "";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const ImageCarousel = ({ images = [], fallbackIcon = FaMobileAlt }) => {
  const safeImages = arr(images).filter(Boolean);
  const [currentIndex, setCurrentIndex] = useState(0);
  const FallbackIcon = fallbackIcon || FaMobileAlt;
  const imageFrameClass =
    "h-44 w-32 sm:h-48 sm:w-32 lg:h-52 lg:w-36 rounded-2xl bg-gray-100 overflow-hidden flex items-center justify-center";
  const imageClass = "h-full w-full object-contain p-0.5 sm:p-2";

  useEffect(() => {
    setCurrentIndex(0);
  }, [safeImages.length]);

  if (!safeImages.length) {
    return (
      <div className="relative flex h-full w-full items-center justify-center">
        <div className={imageFrameClass}>
          <div className="text-center px-3">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-gray-200">
              <FallbackIcon className="text-gray-400 text-sm" />
            </div>
            <span className="text-xs text-slate-500">No image</span>
          </div>
        </div>
      </div>
    );
  }

  if (safeImages.length === 1) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className={imageFrameClass}>
          <img
            src={safeImages[0]}
            alt="product"
            className={imageClass}
            loading="lazy"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <div className="flex h-full w-full items-center justify-center">
        <div className={`${imageFrameClass} relative`}>
          <img
            src={safeImages[currentIndex]}
            alt={`product-view-${currentIndex + 1}`}
            className={imageClass}
            loading="lazy"
          />
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
            <div className="flex items-center gap-1 rounded-full px-2">
              {safeImages.map((_, index) => (
                <button
                  key={`dot-${index}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    setCurrentIndex(index);
                  }}
                  aria-label={`Go to image ${index + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-200 ${
                    currentIndex === index
                      ? "w-5 bg-violet-500"
                      : "w-1.5 bg-gray-300 hover:bg-gray-400"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SpecScoreBadge = ({ score }) => {
  const normalized = clampScore100(score);
  const label = normalized != null ? Math.round(normalized) : null;

  return (
    <div
      className="inline-flex items-end gap-1 leading-none"
      aria-label={
        normalized != null
          ? `Hooks score ${normalized.toFixed(1)} percent`
          : "Hooks score unavailable"
      }
    >
      <span className="text-3xl font-semibold leading-none text-violet-600 sm:text-4xl">
        {label != null ? label : "--"}
      </span>
      <div className="flex flex-col items-start leading-none">
        <span className="text-[8px] font-semibold uppercase tracking-[0.32em] text-violet-400">
          Hooks
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-violet-500">
          Score
        </span>
      </div>
    </div>
  );
};

const buildProduct = (row, cat, index) => {
  const variants = getVariants(row);
  const stores = getStorePrices(row, variants);
  const lowest = stores[0]?.price ?? num(row.price ?? row.base_price);
  const images = getImages(row, cat);
  const specScore = resolveSpecScore(row);

  if (cat === "laptops") {
    const basic = obj(row.basic_info || row.basic_info_json);
    const performance = obj(row.performance);
    const memory = obj(row.memory);
    const storage = obj(row.storage);
    const display = obj(row.display);
    const ram = first(memory.ram, variants[0]?.ram);
    const rom = first(storage.capacity, variants[0]?.storage);
    const screen = first(display.display_size, display.size_cm);
    const resolution = first(display.resolution);
    const processor = first(
      performance.processor_name,
      performance.processor,
      performance.cpu,
    );
    const normalizedRam = text(ram).replace(/\s+RAM$/i, "");
    const normalizedStorage = text(rom).replace(/\s+(STORAGE|ROM)$/i, "");
    const normalizedScreen = first(screen, resolution);
    return {
      key: row.product_id ?? row.id ?? `${cat}-${index}`,
      id: row.product_id ?? row.id ?? null,
      name: first(
        row.name,
        basic.product_name,
        row.model,
        basic.model,
        "Laptop",
      ),
      brand: first(row.brand_name, basic.brand_name, basic.brand),
      image: images[0] || "",
      images,
      stores,
      price: lowest,
      priceText: priceLabel(lowest),
      release: first(basic.launch_date, row.launch_date, row.created_at),
      specLine: [normalizedRam, normalizedStorage, normalizedScreen, processor]
        .filter(Boolean)
        .join(" | "),
      filterMeta: { ram, storage: rom, screen, resolution },
      detailPath: CATEGORIES.laptops.detailPath,
      variantId: variants[0]?.id ?? null,
      specScore,
      featurePayload: {
        specs: {
          cpu: processor,
          cpuBrand: processor,
          ram,
          storage: rom,
          display: [screen, resolution, first(display.refresh_rate)]
            .filter(Boolean)
            .join(" | "),
          refreshRate: first(display.refresh_rate),
          graphics: first(performance.gpu),
          battery: first(
            obj(row.battery).battery_type,
            obj(row.battery).battery_life,
          ),
          weight: first(obj(row.physical).weight),
        },
        variants: variants.map((v) => ({ ram: v.ram, storage: v.storage })),
      },
    };
  }

  if (cat === "tvs") {
    const keySpecs = obj(row.key_specs_json || row.key_specs);
    const display = obj(row.display_json || row.display);
    const smart = obj(row.smart_tv_json || row.smart_tv);
    const audio = obj(row.audio_json || row.audio);
    const connectivity = obj(row.connectivity_json || row.connectivity);
    const screen = first(keySpecs.screen_size, row.screen_size);
    const resolution = first(keySpecs.resolution, display.resolution);
    const refresh = first(keySpecs.refresh_rate, display.refresh_rate);
    const panel = first(keySpecs.panel_type, display.panel_type);
    const sound = first(keySpecs.audio_output, audio.output_power);
    const os = first(keySpecs.operating_system, smart.operating_system);
    return {
      key: row.product_id ?? row.id ?? `${cat}-${index}`,
      id: row.product_id ?? row.id ?? null,
      name: first(row.product_name, row.name, row.model, "TV"),
      brand: first(row.brand_name, row.brand),
      image: images[0] || "",
      images,
      stores,
      price: lowest,
      priceText: priceLabel(lowest),
      release: first(
        obj(row.basic_info_json).launch_year,
        row.launch_year,
        row.created_at,
      ),
      specLine: [screen, resolution, refresh, panel, os || sound]
        .filter(Boolean)
        .join(" | "),
      filterMeta: { ram: "", storage: "", screen, resolution },
      detailPath: CATEGORIES.tvs.detailPath,
      variantId: variants[0]?.id ?? null,
      specScore,
      featurePayload: {
        specs: {
          screenSize: screen,
          capacity: screen,
          resolution,
          displayType: panel,
          type: first(row.category),
          hdr: arr(keySpecs.hdr_support).join(" "),
          audioOutput: sound,
          operatingSystem: first(
            keySpecs.operating_system,
            smart.operating_system,
          ),
          wifi: first(connectivity.wifi),
          refreshRate: refresh,
        },
      },
    };
  }

  const display = obj(row.display);
  const performance = obj(row.performance);
  const ram = first(variants[0]?.ram);
  const storage = first(variants[0]?.storage);
  return {
    key: row.product_id ?? row.id ?? `${cat}-${index}`,
    id: row.product_id ?? row.id ?? null,
    name: first(row.name, row.product_name, row.model, "Smartphone"),
    brand: first(row.brand_name, row.brand),
    brand_logo: first(row.brand_logo, row.brandLogo),
    brand_website: first(row.brand_website, row.brandWebsite),
    image: images[0] || "",
    images,
    stores,
    price: lowest,
    priceText: priceLabel(lowest),
    release: first(row.launch_date, row.created_at),
    specLine: [
      ram,
      storage,
      cameraLabel(row),
      batteryLabel(row),
      first(display.size),
      first(performance.processor),
    ]
      .filter(Boolean)
      .join(" | "),
    filterMeta: { ram, storage, screen: "", resolution: "" },
    detailPath: CATEGORIES.smartphones.detailPath,
    variantId: variants[0]?.id ?? null,
    specScore,
    featurePayload: row,
  };
};

const mergeProducts = (items) => {
  const dedupeStores = (stores) => {
    const seen = new Set();
    const deduped = [];
    arr(stores).forEach((store) => {
      const key = `${String(store.storeName || "").toLowerCase()}-${store.price || "na"}-${store.url || ""}`;
      if (seen.has(key)) return;
      seen.add(key);
      deduped.push(store);
    });
    deduped.sort(
      (a, b) =>
        (a.price ?? Number.MAX_SAFE_INTEGER) -
        (b.price ?? Number.MAX_SAFE_INTEGER),
    );
    return deduped;
  };

  const map = new Map();
  items.forEach((item) => {
    const key = item.id != null ? String(item.id) : item.key;
    if (!map.has(key)) {
      map.set(key, item);
      return;
    }
    const existing = map.get(key);
    if (
      num(item.price) !== null &&
      (num(existing.price) === null || num(item.price) < num(existing.price))
    ) {
      existing.price = item.price;
      existing.priceText = item.priceText;
      existing.variantId = item.variantId || existing.variantId;
      existing.specLine = item.specLine || existing.specLine;
    }
    if (existing.specScore == null && item.specScore != null) {
      existing.specScore = item.specScore;
    }
    if (!existing.brand_logo && item.brand_logo)
      existing.brand_logo = item.brand_logo;
    if (!existing.brand_website && item.brand_website) {
      existing.brand_website = item.brand_website;
    }
    if (!existing.image && item.image) existing.image = item.image;
    if (
      (!existing.images || !existing.images.length) &&
      arr(item.images).length
    ) {
      existing.images = item.images;
    }
    existing.stores = dedupeStores([...existing.stores, ...item.stores]);
  });
  return Array.from(map.values());
};

const getProductId = (item) => {
  const id =
    item?.product_id ??
    item?.id ??
    item?.productId ??
    item?.basic_info?.product_id ??
    item?.basic_info_json?.product_id ??
    null;
  return id == null ? null : String(id);
};

const pickFirstArray = (...values) => {
  for (const value of values) {
    if (arr(value).length) return arr(value);
  }
  return [];
};

const enrichRowWithCatalog = (row, catalogItem) => {
  if (!catalogItem) return row;

  const merged = { ...catalogItem, ...row };

  const objectSectionKeys = [
    "battery",
    "camera",
    "display",
    "performance",
    "memory",
    "storage",
    "physical",
    "connectivity",
    "network",
    "audio",
    "multimedia",
    "basic_info",
    "basic_info_json",
    "key_specs_json",
    "display_json",
    "audio_json",
    "smart_tv_json",
    "gaming_json",
    "ports_json",
    "connectivity_json",
    "product_details_json",
    "metadata_json",
  ];

  objectSectionKeys.forEach((section) => {
    const catalogSection = obj(catalogItem[section]);
    const rowSection = obj(row[section]);
    if (Object.keys(catalogSection).length || Object.keys(rowSection).length) {
      merged[section] = { ...catalogSection, ...rowSection };
    }
  });

  const catalogMeta = obj(catalogItem.metadata || catalogItem.metadata_json);
  const rowMeta = obj(row.metadata || row.metadata_json);
  if (Object.keys(catalogMeta).length || Object.keys(rowMeta).length) {
    merged.metadata = { ...catalogMeta, ...rowMeta };
    const catalogSpecSections = obj(catalogMeta.spec_sections);
    const rowSpecSections = obj(rowMeta.spec_sections);
    if (
      Object.keys(catalogSpecSections).length ||
      Object.keys(rowSpecSections).length
    ) {
      merged.metadata.spec_sections = {
        ...catalogSpecSections,
        ...rowSpecSections,
      };
    }
  }

  const rowSpecSections = obj(rowMeta.spec_sections);
  const catalogSpecSections = obj(catalogMeta.spec_sections);

  const variants = pickFirstArray(
    row.variants,
    row.variants_json,
    rowMeta.variants,
    rowMeta.variants_json,
    rowSpecSections.variants_json,
    catalogItem.variants,
    catalogItem.variants_json,
    catalogMeta.variants,
    catalogMeta.variants_json,
    catalogSpecSections.variants_json,
  );
  if (variants.length) merged.variants = variants;

  const images = pickFirstArray(
    row.images,
    row.images_json,
    rowMeta.images,
    rowSpecSections.images_json,
    catalogItem.images,
    catalogItem.images_json,
    catalogMeta.images,
    catalogSpecSections.images_json,
  );
  if (images.length) merged.images = images;

  const storePrices = pickFirstArray(
    row.store_prices,
    catalogItem.store_prices,
  );
  if (storePrices.length) merged.store_prices = storePrices;

  return merged;
};

const TrendingProductsHub = () => {
  const navigate = useNavigate();
  const { category } = useParams();
  const deviceStore = useDevice();
  const { getStoreLogo, getLogo, getStore } = useStoreLogos();

  const activeCategory =
    ALIASES[String(category || "").toLowerCase()] || "smartphones";
  const config = CATEGORIES[activeCategory];
  const HeroIcon = config.icon;
  const heroTitleText =
    activeCategory === "laptops"
      ? "Trending Laptops"
      : activeCategory === "tvs"
        ? "Trending TVs"
        : "Trending Smartphones";

  const [rawRows, setRawRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("featured");
  const [selectedFeature, setSelectedFeature] = useState("");
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedRam, setSelectedRam] = useState([]);
  const [selectedStorage, setSelectedStorage] = useState([]);
  const [selectedScreen, setSelectedScreen] = useState([]);
  const [selectedResolution, setSelectedResolution] = useState([]);
  const [brandFilterQuery, setBrandFilterQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);

  const smartphoneCatalog = useMemo(() => {
    if (arr(deviceStore?.smartphoneAll).length)
      return deviceStore.smartphoneAll;
    return arr(deviceStore?.smartphone);
  }, [deviceStore?.smartphoneAll, deviceStore?.smartphone]);

  const laptopCatalog = useMemo(
    () => arr(deviceStore?.laptops),
    [deviceStore?.laptops],
  );

  const tvCatalog = useMemo(
    () => arr(deviceStore?.homeAppliances),
    [deviceStore?.homeAppliances],
  );

  const heroDescriptionStyle = showFullDescription
    ? undefined
    : {
        display: "-webkit-box",
        WebkitBoxOrient: "vertical",
        WebkitLineClamp: 3,
        overflow: "hidden",
      };
  const heroDescriptionWidthClass = "max-w-6xl";

  const catalogLookup = useMemo(() => {
    const source =
      activeCategory === "laptops"
        ? laptopCatalog
        : activeCategory === "tvs"
          ? tvCatalog
          : smartphoneCatalog;

    const lookup = new Map();
    source.forEach((item) => {
      const id = getProductId(item);
      if (id) lookup.set(id, item);
    });
    return lookup;
  }, [activeCategory, smartphoneCatalog, laptopCatalog, tvCatalog]);

  useEffect(() => {
    if (!category || activeCategory !== category) {
      navigate(`/trending/${activeCategory}`, { replace: true });
    }
  }, [category, activeCategory, navigate]);

  useEffect(() => {
    setSearch("");
    setSortBy("featured");
    setSelectedFeature("");
    setShowFullDescription(false);
    setSelectedBrands([]);
    setSelectedRam([]);
    setSelectedStorage([]);
    setSelectedScreen([]);
    setSelectedResolution([]);
    setBrandFilterQuery("");
    setShowFilters(false);
  }, [activeCategory]);

  useEffect(() => {
    let canceled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API_BASE}${config.endpoint}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const payload = await res.json();
        if (canceled) return;
        const rows = getRows(payload, activeCategory);
        setRawRows(rows);
      } catch {
        if (!canceled) {
          setRawRows([]);
          setError("Unable to load products right now.");
        }
      } finally {
        if (!canceled) setLoading(false);
      }
    };
    load();
    return () => {
      canceled = true;
    };
  }, [activeCategory, config.endpoint]);

  const products = useMemo(() => {
    const enrichedRows = rawRows.map((row) => {
      const id = getProductId(row);
      const catalogItem = id ? catalogLookup.get(id) : null;
      return enrichRowWithCatalog(row, catalogItem);
    });
    return mergeProducts(
      enrichedRows.map((row, index) =>
        buildProduct(row, activeCategory, index),
      ),
    );
  }, [rawRows, activeCategory, catalogLookup]);

  const popularFeatures = useMemo(() => {
    if (activeCategory === "laptops") {
      return computePopularLaptopFeatures(
        products.map((p) => p.featurePayload),
        { limit: 16 },
      );
    }
    if (activeCategory === "tvs") {
      return computePopularTvFeatures(
        products.map((p) => p.featurePayload),
        { limit: 16 },
      );
    }
    return computePopularSmartphoneFeatures(
      products.map((p) => p.featurePayload),
      { limit: 16 },
    );
  }, [products, activeCategory]);

  const visible = useMemo(() => {
    const q = text(search).toLowerCase();
    const byFeature = (p) => {
      if (!selectedFeature) return true;
      if (activeCategory === "laptops")
        return matchesLaptopFeature(p.featurePayload, selectedFeature);
      if (activeCategory === "tvs")
        return matchesTvFeature(p.featurePayload, selectedFeature);
      const def = SMARTPHONE_FEATURE_CATALOG.find(
        (f) => f.id === selectedFeature,
      );
      return def ? Boolean(def.match(p.featurePayload)) : true;
    };
    const filtered = products.filter((p) => {
      if (selectedBrands.length && !selectedBrands.includes(text(p.brand)))
        return false;
      if (selectedRam.length && !selectedRam.includes(text(p.filterMeta?.ram)))
        return false;
      if (
        selectedStorage.length &&
        !selectedStorage.includes(text(p.filterMeta?.storage))
      )
        return false;
      if (
        selectedScreen.length &&
        !selectedScreen.includes(text(p.filterMeta?.screen))
      )
        return false;
      if (
        selectedResolution.length &&
        !selectedResolution.includes(text(p.filterMeta?.resolution))
      )
        return false;
      if (!byFeature(p)) return false;
      if (q && !`${p.name} ${p.brand} ${p.specLine}`.toLowerCase().includes(q))
        return false;
      return true;
    });
    const sorted = [...filtered];
    if (sortBy === "price-low")
      sorted.sort(
        (a, b) =>
          (a.price ?? Number.MAX_SAFE_INTEGER) -
          (b.price ?? Number.MAX_SAFE_INTEGER),
      );
    else if (sortBy === "price-high")
      sorted.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    else if (sortBy === "newest")
      sorted.sort(
        (a, b) => new Date(b.release).getTime() - new Date(a.release).getTime(),
      );
    else if (selectedFeature && activeCategory === "laptops") {
      sorted.sort(
        (a, b) =>
          (getLaptopFeatureSortValue(b.featurePayload, selectedFeature) ?? -1) -
          (getLaptopFeatureSortValue(a.featurePayload, selectedFeature) ?? -1),
      );
    } else if (selectedFeature && activeCategory === "tvs") {
      sorted.sort(
        (a, b) =>
          (getTvFeatureSortValue(b.featurePayload, selectedFeature) ?? -1) -
          (getTvFeatureSortValue(a.featurePayload, selectedFeature) ?? -1),
      );
    }
    return sorted;
  }, [
    products,
    search,
    selectedBrands,
    selectedRam,
    selectedStorage,
    selectedScreen,
    selectedResolution,
    selectedFeature,
    sortBy,
    activeCategory,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (activeCategory !== "smartphones") return;
    try {
      window.localStorage.setItem(
        ROUTE_FEED_CACHE_KEY,
        JSON.stringify(visible || []),
      );
    } catch {
      // ignore cache failures
    }
  }, [activeCategory, visible]);

  const brands = useMemo(
    () =>
      Array.from(
        new Set(products.map((p) => text(p.brand)).filter(Boolean)),
      ).sort((a, b) => a.localeCompare(b)),
    [products],
  );

  const heroDescription = useMemo(() => {
    const categoryName = config.label.toLowerCase();
    const selectedBrandNames = selectedBrands.filter(Boolean);
    const topBrandNames = brands.slice(0, 5);
    const brandLead = selectedBrandNames.length
      ? `You are currently filtering this ${categoryName} list to ${formatNameList(selectedBrandNames)}.`
      : topBrandNames.length
        ? `Popular brands in this collection include ${formatNameList(topBrandNames)}.`
        : "";

    return brandLead
      ? `${brandLead} ${config.description}`
      : config.description;
  }, [
    activeCategory,
    brands,
    config.description,
    config.label,
    selectedBrands,
  ]);

  const filteredBrandOptions = useMemo(() => {
    const query = text(brandFilterQuery).toLowerCase();
    if (!query) return brands;
    return brands.filter((brand) => brand.toLowerCase().includes(query));
  }, [brands, brandFilterQuery]);

  const ramOptions = useMemo(
    () =>
      Array.from(
        new Set(products.map((p) => text(p.filterMeta?.ram)).filter(Boolean)),
      ).sort((a, b) => (num(a) || 0) - (num(b) || 0)),
    [products],
  );

  const storageOptions = useMemo(
    () =>
      Array.from(
        new Set(
          products.map((p) => text(p.filterMeta?.storage)).filter(Boolean),
        ),
      ).sort((a, b) => (num(a) || 0) - (num(b) || 0)),
    [products],
  );

  const screenOptions = useMemo(
    () =>
      Array.from(
        new Set(
          products.map((p) => text(p.filterMeta?.screen)).filter(Boolean),
        ),
      ).sort((a, b) => (num(a) || 0) - (num(b) || 0)),
    [products],
  );

  const resolutionOptions = useMemo(
    () =>
      Array.from(
        new Set(
          products.map((p) => text(p.filterMeta?.resolution)).filter(Boolean),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [products],
  );

  const activeFilterCount =
    selectedBrands.length +
    selectedRam.length +
    selectedStorage.length +
    selectedScreen.length +
    selectedResolution.length +
    (selectedFeature ? 1 : 0);

  const clearAllFilters = () => {
    setSelectedFeature("");
    setSelectedBrands([]);
    setSelectedRam([]);
    setSelectedStorage([]);
    setSelectedScreen([]);
    setSelectedResolution([]);
  };

  const openDetail = (p) => {
    const slug = generateSlug(p.name || `product-${p.id || ""}`);
    const params = new URLSearchParams();
    if (p.id != null) params.set("id", String(p.id));
    if (p.variantId != null) params.set("variantId", String(p.variantId));
    const isSmartphone = p.detailPath === "/smartphones";
    const detailPath = isSmartphone
      ? `/smartphones/${slug}-price-in-india`
      : `${p.detailPath}/${slug}`;
    navigate(
      `${detailPath}${params.toString() ? `?${params.toString()}` : ""}`,
    );
  };

  const seoTitle = `${config.metaTitle} - Hooks`;
  const seoDescription = config.metaDescription;
  const seoKeywords = useMemo(() => {
    const baseKeywords = String(config.metaKeywords || "")
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    const sample = arr(visible).length ? arr(visible) : arr(products);
    return buildListSeoKeywords({
      devices: sample,
      category: `${activeCategory} trending`,
      baseTerms: baseKeywords,
      contextTerms: [
        `${activeCategory} trending`,
        `trending ${activeCategory} in india`,
      ],
    });
  }, [config.metaKeywords, activeCategory, visible, products]);
  const canonicalPath = `/trending/${activeCategory}`;
  const canonicalUrl = `${SITE_ORIGIN}${canonicalPath}`;
  const ogImage = first(
    arr(visible).find((p) => text(p?.image))?.image,
    arr(products).find((p) => text(p?.image))?.image,
  );
  const ogImageUrl = ogImage || `${SITE_ORIGIN}/hook-logo.svg`;
  const ogImageMeta = {
    url: ogImageUrl,
    width: 1200,
    height: 630,
    alt: `${normalizeSeoTitle(seoTitle)
      .replace(/\s*Hooks$/i, "")
      .trim()} preview image`,
  };
  const normalizedSeoTitle = normalizeSeoTitle(seoTitle);

  const listSchemaItems = useMemo(() => {
    const base = arr(visible).length ? arr(visible) : arr(products);
    const items = base.slice(0, 20).map((p) => {
      const name = text(p?.name);
      if (!name) return null;
      const slug = generateSlug(name || `product-${p?.id || ""}`);
      const detailPath =
        p?.detailPath === "/smartphones"
          ? `/smartphones/${slug}-price-in-india`
          : `${p?.detailPath || "/smartphones"}/${slug}`;
      return {
        name,
        url: `${SITE_ORIGIN}${detailPath}`,
        image: p?.image || undefined,
      };
    });
    return items.filter(Boolean);
  }, [visible, products]);

  const listSchema = useMemo(() => {
    const collectionSchema = createCollectionSchema({
      name: normalizedSeoTitle,
      description: seoDescription,
      url: canonicalUrl,
      image: ogImageMeta || undefined,
    });
    const itemListSchema = createItemListSchema({
      name: normalizedSeoTitle,
      url: canonicalUrl,
      items: listSchemaItems,
    });
    return [collectionSchema, itemListSchema];
  }, [
    normalizedSeoTitle,
    seoDescription,
    canonicalUrl,
    ogImageMeta,
    listSchemaItems,
  ]);

  return (
    <div className="min-h-screen bg-[#eef2ff] text-slate-900">
      <SEO
        title={seoTitle}
        description={seoDescription}
        keywords={seoKeywords}
        image={ogImageMeta}
        url={canonicalUrl}
        robots="index, follow, max-image-preview:large"
        schema={listSchema}
      />

      <div className="relative mx-auto max-w-7xl px-4 pt-0 pb-8 sm:px-6 sm:pb-12 md:pb-16 lg:px-8 lg:pb-20">
        <div className="relative">
          <section className="relative left-1/2 isolate w-screen -translate-x-1/2 overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950 px-4 py-6 text-white sm:px-6 sm:py-8 lg:px-8 lg:py-10">
            <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:72px_72px]" />
            <div className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute right-0 top-20 h-80 w-80 rounded-full bg-cyan-300/10 blur-3xl" />
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/10 to-transparent" />

            <div className="relative mx-auto max-w-7xl">
              <div className="max-w-6xl">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-100">
                  <HeroIcon className="h-3.5 w-3.5" />
                  {config.badge}
                </span>

                <h1 className="mt-6 max-w-7xl text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
                  {heroTitleText}
                </h1>

                <h4
                  className={`mt-4 ${heroDescriptionWidthClass} text-base leading-7 text-white/80 sm:text-lg sm:leading-8`}
                  style={heroDescriptionStyle}
                >
                  {heroDescription}
                </h4>
                <button
                  type="button"
                  onClick={() => setShowFullDescription((prev) => !prev)}
                  className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-cyan-100 transition-colors duration-200 hover:text-white"
                  aria-expanded={showFullDescription}
                >
                  {showFullDescription ? "Show less" : "Read more"}
                </button>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-6 rounded-2xl border-b border-slate-100 sm:p-5">
          <div className="overflow-hidden pt-0 pb-4 sm:pb-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FaFilter className="text-blue-600" />
                <h3 className="text-sm font-semibold text-slate-900 sm:text-base">
                  Popular Features
                </h3>
              </div>
              {selectedFeature ? (
                <button
                  onClick={() => setSelectedFeature("")}
                  className="text-xs font-semibold text-blue-700 transition-colors duration-200 hover:text-blue-900"
                >
                  Clear
                </button>
              ) : null}
            </div>
            <p className="mb-3 text-xs text-slate-500">
              Popular choices from other users
            </p>
            <div className="flex gap-2.5 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {popularFeatures.map((feature) => {
                const Icon = feature.icon;
                const active = selectedFeature === feature.id;
                return (
                  <button
                    key={feature.id}
                    onClick={() => setSelectedFeature(active ? "" : feature.id)}
                    className={`flex items-center gap-2 rounded-full border px-3 py-2 text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors duration-200 ${
                      active
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-200 hover:bg-white"
                    }`}
                  >
                    <span className={active ? "text-white" : "text-blue-600"}>
                      {Icon ? <Icon className="text-base" /> : null}
                    </span>
                    <span>{feature.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="overflow-hidden sm:p-5">
          <div className="hidden lg:flex items-center justify-between mb-6">
            <div className="relative flex-1 min-w-0 max-w-4xl">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                <FaSearch className="text-blue-500" />
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={config.searchPlaceholder}
                className="w-full rounded-md border border-slate-200 bg-white pl-12 pr-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 transition-all duration-200 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:text-base"
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <FaFilter className="text-slate-500" />
                <span className="text-sm text-slate-600">Sort by:</span>
              </div>
              <div className="relative min-w-[220px]">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full cursor-pointer appearance-none rounded-md border border-slate-200 bg-white px-4 py-2.5 pr-10 text-slate-700 transition-all duration-200 hover:border-blue-300 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="featured" className="bg-white">
                    Featured Devices
                  </option>
                  <option value="price-low" className="bg-white">
                    Price: Low to High
                  </option>
                  <option value="price-high" className="bg-white">
                    Price: High to Low
                  </option>
                  <option value="newest" className="bg-white">
                    Newest First
                  </option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                  <svg
                    className="fill-current h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>

              {activeFilterCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="flex items-center gap-2 rounded-[18px] px-4 py-2.5 text-sm font-medium text-blue-600 transition-all duration-200 hover:bg-blue-50 hover:text-blue-700"
                >
                  <FaTimes />
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="lg:hidden space-y-3 sm:space-y-4 mb-6 sm:mb-8">
            <div className="relative group">
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-500 group-focus-within:text-blue-600 transition-colors duration-200" />
              <input
                type="text"
                placeholder={config.searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-12 pl-12 pr-4 py-2 border border-slate-200 bg-white rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent text-slate-900 placeholder:text-slate-400 transition-all duration-200"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowFilters(true)}
                className="flex items-center justify-center gap-2 flex-1 h-12 text-white px-4 rounded-xl bg-gradient-to-r from-blue-500 to-sky-500 transition-all duration-300 font-semibold hover:from-blue-600 hover:to-sky-600 hover:shadow-lg hover:shadow-blue-500/20 border border-blue-400/50"
              >
                <FaFilter />
                Filters
                {activeFilterCount > 0 && (
                  <span className="text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center bg-white/20">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              <div className="relative flex-1">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full h-12 px-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent text-slate-700 appearance-none cursor-pointer bg-white pr-10 transition-all duration-200 hover:border-blue-300"
                >
                  <option value="featured">Featured Devices</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="newest">Newest First</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                  <svg
                    className="fill-current h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
            </div>

            {activeFilterCount > 0 && (
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3">
                  <FaInfoCircle className="text-blue-500" />
                  <div>
                    <span className="text-sm font-medium text-slate-900">
                      {activeFilterCount} filter
                      {activeFilterCount > 1 ? "s" : ""} applied
                    </span>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Showing {visible.length} of {products.length} options
                    </p>
                  </div>
                </div>
                <button
                  onClick={clearAllFilters}
                  className="text-blue-600 hover:text-blue-500 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors duration-200"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          <div className="hidden">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-end">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-500">
                  Sort By:
                </span>
                <div className="relative min-w-[170px]">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 pr-10 font-semibold text-slate-900 shadow-sm transition-all duration-200 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="featured" className="bg-white">
                      Popularity
                    </option>
                    <option value="price-low" className="bg-white">
                      Price: Low to High
                    </option>
                    <option value="price-high" className="bg-white">
                      Price: High to Low
                    </option>
                    <option value="newest" className="bg-white">
                      Newest First
                    </option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                    <svg
                      className="h-4 w-4 fill-current"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6 md:gap-8 lg:flex-row lg:items-start">
            <div className="hidden lg:block lg:w-72 flex-shrink-0">
              <div className="sticky top-6 border border-slate-200 bg-white p-5 lg:p-6">
                <div className="mb-6 flex items-center justify-between border-b border-slate-200 px-2 pb-4 sm:mb-8 sm:px-3 md:px-4">
                  <div>
                    <h3 className="flex items-center gap-2 text-xl font-bold text-slate-900">
                      Refine Search
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Narrow down {config.label.toLowerCase()} by specifications
                    </p>
                  </div>
                  {activeFilterCount > 0 && (
                    <button
                      onClick={clearAllFilters}
                      className="flex items-center gap-2 rounded-lg px-3 py-1 text-sm font-semibold text-blue-600 transition-colors duration-200 hover:bg-blue-50 hover:text-blue-500"
                    >
                      <FaTimes />
                      RESET
                    </button>
                  )}
                </div>

                {activeFilterCount > 0 && (
                  <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm sm:mb-8">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-900">
                        Active Filters
                      </span>
                      <span className="rounded-full border border-blue-400/30 bg-blue-500/20 px-2 py-1 text-xs font-bold text-blue-300">
                        {activeFilterCount}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {visible.length} devices match
                    </p>
                  </div>
                )}

                <div className="mb-6 sm:mb-7 lg:mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-base font-bold text-slate-900">
                        Brands
                      </h4>
                      <p className="mt-1 text-xs text-slate-500">
                        Select devices by manufacturer
                      </p>
                    </div>
                    <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-bold text-blue-600">
                      {selectedBrands.length}
                    </span>
                  </div>
                  <div className="relative mb-3">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                    <input
                      type="text"
                      value={brandFilterQuery}
                      onChange={(e) => setBrandFilterQuery(e.target.value)}
                      placeholder="Search brand..."
                      className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-3 text-sm text-slate-900 transition-all placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  <div className="no-scrollbar space-y-2 max-h-60 overflow-y-auto pr-2">
                    {filteredBrandOptions.map((brand) => (
                      <label
                        key={brand}
                        className="group flex cursor-pointer items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 transition-all duration-200 hover:border-slate-200 hover:bg-slate-50"
                      >
                        <input
                          type="checkbox"
                          checked={selectedBrands.includes(brand)}
                          onChange={() =>
                            setSelectedBrands((prev) =>
                              prev.includes(brand)
                                ? prev.filter((b) => b !== brand)
                                : [...prev, brand],
                            )
                          }
                          className="h-4 w-4 appearance-none rounded border border-slate-300 bg-white transition-all duration-200 checked:border-blue-500 checked:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1"
                        />
                        <span className="flex-1 font-medium text-slate-700 group-hover:text-slate-900">
                          {brand}
                        </span>
                        <div className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-500">
                          {
                            products.filter((p) => text(p.brand) === brand)
                              .length
                          }
                        </div>
                      </label>
                    ))}
                    {filteredBrandOptions.length === 0 && (
                      <div className="px-2 py-1 text-sm text-slate-400">
                        No brands found
                      </div>
                    )}
                  </div>
                </div>

                {(activeCategory === "smartphones" ||
                  activeCategory === "laptops") && (
                  <>
                    {ramOptions.length > 0 && (
                      <div className="mb-6 sm:mb-7 lg:mb-8">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="text-base font-bold text-slate-900">
                              Memory (RAM)
                            </h4>
                            <p className="mt-1 text-xs text-slate-500">
                              Multitasking performance
                            </p>
                          </div>
                          <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-bold text-blue-600">
                            {selectedRam.length}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {ramOptions.map((ram) => (
                            <label
                              key={ram}
                              className={`flex items-center justify-center gap-2 cursor-pointer px-3 py-2.5 rounded-xl transition-all duration-200 font-medium ${
                                selectedRam.includes(ram)
                                  ? "border border-blue-400 bg-gradient-to-b from-blue-500 to-sky-500 text-white"
                                  : "border border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-slate-50"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={selectedRam.includes(ram)}
                                onChange={() =>
                                  setSelectedRam((prev) =>
                                    prev.includes(ram)
                                      ? prev.filter((value) => value !== ram)
                                      : [...prev, ram],
                                  )
                                }
                                className="sr-only"
                              />
                              <span>{ram}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {storageOptions.length > 0 && (
                      <div className="mb-6 sm:mb-7 lg:mb-8">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="text-base font-bold text-slate-900">
                              Storage Capacity
                            </h4>
                            <p className="mt-1 text-xs text-slate-500">
                              Apps and media space
                            </p>
                          </div>
                          <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-bold text-blue-600">
                            {selectedStorage.length}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {storageOptions.map((storage) => (
                            <label
                              key={storage}
                              className={`flex items-center justify-center gap-2 cursor-pointer px-3 py-2.5 rounded-xl transition-all duration-200 font-medium ${
                                selectedStorage.includes(storage)
                                  ? "border border-blue-400 bg-gradient-to-b from-blue-500 to-sky-500 text-white"
                                  : "border border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-slate-50"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={selectedStorage.includes(storage)}
                                onChange={() =>
                                  setSelectedStorage((prev) =>
                                    prev.includes(storage)
                                      ? prev.filter(
                                          (value) => value !== storage,
                                        )
                                      : [...prev, storage],
                                  )
                                }
                                className="sr-only"
                              />
                              <span>{storage}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {activeCategory === "tvs" && (
                  <>
                    {screenOptions.length > 0 && (
                      <div className="mb-6 sm:mb-7 lg:mb-8">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="text-base font-bold text-slate-900">
                              Screen Size
                            </h4>
                            <p className="mt-1 text-xs text-slate-500">
                              Select preferred display size
                            </p>
                          </div>
                          <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-bold text-blue-600">
                            {selectedScreen.length}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                          {screenOptions.map((screen) => (
                            <label
                              key={screen}
                              className={`flex items-center justify-between gap-2 cursor-pointer px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                                selectedScreen.includes(screen)
                                  ? "border border-blue-400 bg-gradient-to-r from-blue-500 to-sky-500 text-white"
                                  : "border border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-slate-50"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={selectedScreen.includes(screen)}
                                onChange={() =>
                                  setSelectedScreen((prev) =>
                                    prev.includes(screen)
                                      ? prev.filter((value) => value !== screen)
                                      : [...prev, screen],
                                  )
                                }
                                className="sr-only"
                              />
                              <span>{screen}</span>
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  selectedScreen.includes(screen)
                                    ? "bg-white/90"
                                    : "bg-slate-300"
                                }`}
                              />
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {resolutionOptions.length > 0 && (
                      <div className="mb-6 sm:mb-7 lg:mb-8">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="text-base font-bold text-slate-900">
                              Resolution
                            </h4>
                            <p className="mt-1 text-xs text-slate-500">
                              Filter by panel resolution
                            </p>
                          </div>
                          <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-bold text-blue-600">
                            {selectedResolution.length}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                          {resolutionOptions.map((resolution) => (
                            <label
                              key={resolution}
                              className={`flex items-center justify-between gap-2 cursor-pointer px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                                selectedResolution.includes(resolution)
                                  ? "border border-blue-400 bg-gradient-to-r from-blue-500 to-sky-500 text-white"
                                  : "border border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-slate-50"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={selectedResolution.includes(
                                  resolution,
                                )}
                                onChange={() =>
                                  setSelectedResolution((prev) =>
                                    prev.includes(resolution)
                                      ? prev.filter(
                                          (value) => value !== resolution,
                                        )
                                      : [...prev, resolution],
                                  )
                                }
                                className="sr-only"
                              />
                              <span>{resolution}</span>
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  selectedResolution.includes(resolution)
                                    ? "bg-white/90"
                                    : "bg-slate-300"
                                }`}
                              />
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              {loading ? (
                <div className="py-20 flex items-center justify-center">
                  <Spinner />
                </div>
              ) : null}
              {!loading && error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
                  {error}
                </div>
              ) : null}

              {!loading && !error && (
                <div className="grid grid-cols-1 gap-4 sm:gap-5 md:gap-6 auto-rows-max">
                  {visible.map((p) => {
                    const dedupedStoreMap = new Map();
                    arr(p.stores).forEach((s) => {
                      const storeName =
                        text(
                          s?.store || s?.store_name || s?.storeName || s?.name,
                        ) || "Online Store";
                      const key = storeName.toLowerCase();
                      const candidate = {
                        store: storeName,
                        store_name: text(
                          s?.store_name || s?.store || s?.storeName || s?.name,
                        ),
                        storeName: text(
                          s?.storeName || s?.store || s?.store_name || s?.name,
                        ),
                        price: num(s?.price),
                        url: text(s?.url),
                        storeObj: s?.storeObj || null,
                        logo: text(s?.logo),
                        saleStartDate: text(
                          s?.saleStartDate ||
                            s?.sale_start_date ||
                            s?.sale_date,
                        ),
                        isPrebooking:
                          s?.isPrebooking === true || s?.is_prebooking === true,
                        isLive: s?.isLive === true || s?.is_live === true,
                        availabilityStatus: text(
                          s?.availabilityStatus || s?.availability_status,
                        ),
                        ctaLabel: text(s?.ctaLabel || s?.cta_label),
                      };
                      const existing = dedupedStoreMap.get(key);
                      if (!existing) {
                        dedupedStoreMap.set(key, candidate);
                        return;
                      }
                      const currentPrice = num(existing.price);
                      const nextPrice = num(candidate.price);
                      if (
                        nextPrice != null &&
                        (currentPrice == null || nextPrice < currentPrice)
                      ) {
                        dedupedStoreMap.set(key, { ...existing, ...candidate });
                        return;
                      }
                      if (!existing.url && candidate.url)
                        existing.url = candidate.url;
                      if (!existing.logo && candidate.logo)
                        existing.logo = candidate.logo;
                      if (!existing.saleStartDate && candidate.saleStartDate) {
                        existing.saleStartDate = candidate.saleStartDate;
                      }
                      if (!existing.ctaLabel && candidate.ctaLabel) {
                        existing.ctaLabel = candidate.ctaLabel;
                      }
                    });
                    const availableStores = Array.from(
                      dedupedStoreMap.values(),
                    ).sort(
                      (a, b) =>
                        (num(a.price) ?? Number.MAX_SAFE_INTEGER) -
                        (num(b.price) ?? Number.MAX_SAFE_INTEGER),
                    );
                    const availabilityState =
                      activeCategory === "smartphones"
                        ? getAvailabilityRows(
                            availableStores,
                            p.brand,
                            p.brand_logo || p.brandLogo || null,
                            p.brand_website || p.brandWebsite || null,
                            p.release || null,
                          )
                        : {
                            mode: "live",
                            stores: availableStores,
                            hiddenCount: 0,
                          };
                    const renderedStores = availabilityState.stores || [];
                    const resolvedPriceText =
                      activeCategory === "smartphones" &&
                      renderedStores[0]?.price != null
                        ? formatStorePriceDisplay(renderedStores[0].price)
                        : p.priceText;
                    const releasedOn = dateLabel(p.release);
                    const cardBadgeLabel = "Trending";
                    const visibleStoreRows = renderedStores.slice(0, 2);
                    const renderStoreRow = (
                      store,
                      storeIdx,
                      mobile = false,
                    ) => {
                      const storeObj =
                        store.storeObj ||
                        (getStore
                          ? getStore(
                              store.store ||
                                store.store_name ||
                                store.storeName ||
                                "",
                            )
                          : null);
                      const storeNameCandidate =
                        store.display_store_name ||
                        store.store ||
                        store.store_name ||
                        store.storeName ||
                        storeObj?.name ||
                        "Online Store";
                      const ctaText = store.ctaLabel || "Buy Now";
                      const isPreorderCta =
                        store.isPrebooking === true ||
                        /^(pre(book|order)|coming\s*soon)$/i.test(
                          String(ctaText).trim(),
                        );
                      const logoSrc = normalizeAssetUrl(
                        store.logo ||
                          (store.isPrebooking
                            ? p.brand_logo || p.brandLogo || null
                            : getStoreLogo
                              ? getStoreLogo(storeNameCandidate)
                              : getLogo(storeNameCandidate)),
                      );
                      return (
                        <div
                          key={`${p.key}-store-${storeIdx}${mobile ? "-mobile" : ""}`}
                          className={`flex items-center justify-between gap-3 ${
                            mobile
                              ? "rounded-xl border border-slate-100 bg-white px-3 py-2.5"
                              : "rounded-lg border border-slate-100 px-2.5 py-2.5 sm:px-3 sm:py-3"
                          }`}
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            {logoSrc ? (
                              <div
                                className={
                                  mobile
                                    ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white"
                                    : "flex h-8 w-8 shrink-0 items-center justify-center"
                                }
                              >
                                <img
                                  src={logoSrc}
                                  alt={storeObj?.name || storeNameCandidate}
                                  className="h-full w-full object-contain"
                                  loading="lazy"
                                />
                              </div>
                            ) : (
                              <div
                                className={
                                  mobile
                                    ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f7fbff] ring-1 ring-[#dbe7f7]"
                                    : "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f7fbff] ring-1 ring-[#dbe7f7]"
                                }
                              >
                                <FaStore className="text-slate-400 text-xs" />
                              </div>
                            )}
                            <span className="truncate text-sm font-medium text-slate-800">
                              {storeNameCandidate}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="whitespace-nowrap text-sm font-semibold text-emerald-600">
                              {formatStorePriceDisplay(store.price)}
                            </span>
                            {store.url ? (
                              <a
                                href={store.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className={`inline-flex items-center gap-1 whitespace-nowrap text-sm font-semibold transition-colors ${
                                  isPreorderCta
                                    ? "text-blue-600 hover:text-blue-700"
                                    : "text-violet-600 hover:text-violet-700"
                                }`}
                              >
                                {ctaText || "Buy Now"}
                                <FaExternalLinkAlt className="text-xs" />
                              </a>
                            ) : (
                              <span className="inline-flex items-center gap-1 whitespace-nowrap text-sm font-semibold text-slate-400">
                                {ctaText || "Unavailable"}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    };

                    return (
                      <article
                        key={p.key}
                        onClick={() => openDetail(p)}
                        className="group relative h-full overflow-hidden  border border-slate-200 bg-white cursor-pointer transition-all duration-300"
                      >
                        <div className="p-5 sm:p-6 transition-all duration-300">
                          <div className="hidden flex-col gap-4 lg:flex lg:flex-row lg:items-start lg:justify-between">
                            <div className="min-w-0 flex-1">
                              <h3 className="max-w-3xl text-[1.45rem] font-semibold tracking-tight text-[#14255e] sm:text-[1.8rem]">
                                {p.name}
                              </h3>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                              <div className="text-xl font-semibold tracking-tight text-[#14255e] sm:text-2xl">
                                {resolvedPriceText}
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 hidden flex-col gap-3 lg:flex lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex flex-wrap items-center gap-4">
                              {p.specScore != null ? (
                                <SpecScoreBadge score={p.specScore} />
                              ) : null}
                            </div>

                            {releasedOn ? (
                              <div className="flex items-center gap-1.5 text-sm text-slate-700 sm:justify-end">
                                <FaCalendarAlt className="text-slate-400" />
                                <span>
                                  Launched:{" "}
                                  <span className="font-semibold text-slate-900">
                                    {releasedOn}
                                  </span>
                                </span>
                              </div>
                            ) : null}
                          </div>

                          <div className="mt-5 grid grid-cols-[128px_minmax(0,1fr)] gap-3 sm:grid-cols-[120px_minmax(0,1fr)] lg:grid-cols-[180px_minmax(0,1fr)] sm:gap-4 lg:gap-5">
                            <div className="relative flex items-start justify-start sm:justify-center">
                              {cardBadgeLabel ? (
                                <span className="absolute left-0 top-0 z-10 inline-flex items-center rounded-full bg-amber-600 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                                  {cardBadgeLabel}
                                </span>
                              ) : null}
                              <div className="flex w-full justify-start sm:justify-center">
                                <ImageCarousel
                                  images={
                                    arr(p.images).length
                                      ? p.images
                                      : p.image
                                        ? [p.image]
                                        : []
                                  }
                                  fallbackIcon={HeroIcon}
                                />
                              </div>
                            </div>

                            <div className="space-y-3 pt-1">
                              <div className="space-y-1 lg:hidden">
                                {p.brand ? (
                                  <p className="text-sm font-semibold text-blue-600">
                                    {p.brand}
                                  </p>
                                ) : null}
                                <h3 className="max-w-3xl text-[1.05rem] font-semibold tracking-tight text-[#14255e] sm:text-[1.2rem]">
                                  {p.name}
                                </h3>

                                {p.specScore != null ? (
                                  <SpecScoreBadge score={p.specScore} />
                                ) : null}
                              </div>

                              <div className="hidden lg:block text-[13px] leading-6 text-slate-700 sm:text-sm sm:leading-7 sm:text-base">
                                {p.specLine}
                              </div>

                              <div className="lg:hidden text-lg font-semibold tracking-tight text-[#14255e] sm:text-xl">
                                {resolvedPriceText}
                              </div>

                              {visibleStoreRows.length > 0 ? (
                                <div
                                  className="hidden rounded-[24px] border border-blue-100 bg-[#f8fbff] p-2.5 sm:p-4 lg:block"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                                    <FaStore className="text-emerald-500" />
                                    Check Price On
                                  </div>
                                  <div className="space-y-2">
                                    {visibleStoreRows.map((store, storeIdx) =>
                                      renderStoreRow(store, storeIdx, false),
                                    )}
                                    {availabilityState.hiddenCount > 0 ? (
                                      <div className="text-center text-xs text-slate-500">
                                        +{availabilityState.hiddenCount} more
                                        stores
                                      </div>
                                    ) : null}
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          </div>

                          <div className="mt-4 flex items-center justify-between gap-3">
                            <label
                              className="flex cursor-pointer items-center gap-2 text-slate-700"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <input
                                type="checkbox"
                                onClick={(e) => e.stopPropagation()}
                                className="h-4 w-4 appearance-none rounded border border-slate-300 bg-white transition-all duration-200 checked:border-emerald-600 checked:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-1"
                                aria-label="Select for compare"
                              />
                              <span className="text-sm font-semibold">
                                Add to Compare
                              </span>
                            </label>

                            {releasedOn ? (
                              <div className="flex items-center gap-1.5 text-sm text-slate-700 lg:hidden">
                                <FaCalendarAlt className="text-slate-400" />
                                <span>
                                  Launched:{" "}
                                  <span className="font-semibold text-slate-900">
                                    {releasedOn}
                                  </span>
                                </span>
                              </div>
                            ) : null}
                          </div>

                          <div className="mt-4 space-y-3 lg:hidden">
                            <div className="text-[13px] leading-6 text-slate-700 sm:text-sm sm:leading-7 sm:text-base">
                              {p.specLine}
                            </div>

                            {visibleStoreRows.length > 0 ? (
                              <div
                                className="rounded-[20px] border border-blue-100 bg-[#f8fbff] p-3 sm:p-4"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                                  <FaStore className="text-emerald-500" />
                                  Check Price On
                                </div>
                                <div className="space-y-2">
                                  {visibleStoreRows.map((store, storeIdx) =>
                                    renderStoreRow(store, storeIdx, true),
                                  )}
                                  {availabilityState.hiddenCount > 0 ? (
                                    <div className="text-center text-xs text-slate-500">
                                      +{availabilityState.hiddenCount} more
                                      stores
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {showFilters && (
            <div className="lg:hidden fixed inset-0 z-50">
              <div
                className="absolute inset-0 bg-black/50 transition-opacity duration-300"
                onClick={() => setShowFilters(false)}
              />

              <div className="absolute bottom-0 left-0 right-0 flex max-h-[90vh] flex-col overflow-hidden rounded-t-3xl bg-white">
                <div className="flex items-center justify-between border-b border-slate-200 p-6">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">
                      Refine Search
                    </h3>
                    <p className="text-sm text-slate-500">
                      Narrow down {config.label.toLowerCase()} by specifications
                    </p>
                  </div>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="rounded-lg p-2 transition-colors duration-200 hover:bg-slate-100"
                  >
                    <FaTimes className="text-lg text-slate-500" />
                  </button>
                </div>

                <div className="no-scrollbar flex-1 space-y-6 overflow-y-auto p-6">
                  {activeFilterCount > 0 && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-900">
                          Active Filters
                        </span>
                        <span className="rounded-full border border-blue-400/30 bg-blue-500/20 px-2 py-1 text-xs font-bold text-blue-300">
                          {activeFilterCount}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Refine further or clear to see all devices
                      </p>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-base font-bold text-slate-900">
                          Brands
                        </h4>
                        <p className="mt-1 text-xs text-slate-500">
                          Select devices by manufacturer
                        </p>
                      </div>
                      <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-bold text-blue-600">
                        {selectedBrands.length}
                      </span>
                    </div>
                    <div className="relative mb-3">
                      <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                      <input
                        type="text"
                        value={brandFilterQuery}
                        onChange={(e) => setBrandFilterQuery(e.target.value)}
                        placeholder="Search brand..."
                        className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-3 text-sm text-slate-900 transition-all placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {filteredBrandOptions.map((brand) => (
                        <label
                          key={brand}
                          className="group flex cursor-pointer items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 transition-all duration-200 hover:border-slate-200 hover:bg-slate-50"
                        >
                          <input
                            type="checkbox"
                            checked={selectedBrands.includes(brand)}
                            onChange={() =>
                              setSelectedBrands((prev) =>
                                prev.includes(brand)
                                  ? prev.filter((b) => b !== brand)
                                  : [...prev, brand],
                              )
                            }
                            className="h-4 w-4 appearance-none rounded border border-slate-300 bg-white transition-all duration-200 checked:border-blue-500 checked:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1"
                          />
                          <span className="flex-1 font-medium text-slate-700">
                            {brand}
                          </span>
                          <div className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-500">
                            {
                              products.filter((p) => text(p.brand) === brand)
                                .length
                            }
                          </div>
                        </label>
                      ))}
                      {filteredBrandOptions.length === 0 && (
                        <div className="px-2 py-1 text-sm text-slate-400">
                          No brands found
                        </div>
                      )}
                    </div>
                  </div>

                  {(activeCategory === "smartphones" ||
                    activeCategory === "laptops") && (
                    <>
                      {ramOptions.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h4 className="text-base font-bold text-slate-900">
                                Memory (RAM)
                              </h4>
                              <p className="mt-1 text-xs text-slate-500">
                                Multitasking performance
                              </p>
                            </div>
                            <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-bold text-blue-600">
                              {selectedRam.length}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {ramOptions.map((ram) => (
                              <label
                                key={ram}
                                className={`flex items-center justify-center cursor-pointer px-3 py-2.5 rounded-xl transition-all duration-200 font-medium ${
                                  selectedRam.includes(ram)
                                    ? "border border-blue-400 bg-gradient-to-b from-blue-500 to-sky-500 text-white"
                                    : "border border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-slate-50"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedRam.includes(ram)}
                                  onChange={() =>
                                    setSelectedRam((prev) =>
                                      prev.includes(ram)
                                        ? prev.filter((value) => value !== ram)
                                        : [...prev, ram],
                                    )
                                  }
                                  className="sr-only"
                                />
                                <span>{ram}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}

                      {storageOptions.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h4 className="text-base font-bold text-slate-900">
                                Storage Capacity
                              </h4>
                              <p className="mt-1 text-xs text-slate-500">
                                Apps and media space
                              </p>
                            </div>
                            <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-bold text-blue-600">
                              {selectedStorage.length}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {storageOptions.map((storage) => (
                              <label
                                key={storage}
                                className={`flex items-center justify-center cursor-pointer px-3 py-2.5 rounded-xl transition-all duration-200 font-medium ${
                                  selectedStorage.includes(storage)
                                    ? "border border-blue-400 bg-gradient-to-b from-blue-500 to-sky-500 text-white"
                                    : "border border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-slate-50"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedStorage.includes(storage)}
                                  onChange={() =>
                                    setSelectedStorage((prev) =>
                                      prev.includes(storage)
                                        ? prev.filter(
                                            (value) => value !== storage,
                                          )
                                        : [...prev, storage],
                                    )
                                  }
                                  className="sr-only"
                                />
                                <span className="text-sm">{storage}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {activeCategory === "tvs" && (
                    <>
                      {screenOptions.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h4 className="text-base font-bold text-slate-900">
                                Screen Size
                              </h4>
                              <p className="mt-1 text-xs text-slate-500">
                                Select preferred display size
                              </p>
                            </div>
                            <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-bold text-blue-600">
                              {selectedScreen.length}
                            </span>
                          </div>
                          <div className="space-y-2">
                            {screenOptions.map((screen) => (
                              <label
                                key={screen}
                                className={`flex items-center justify-between gap-2 cursor-pointer px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                                  selectedScreen.includes(screen)
                                    ? "border border-blue-400 bg-gradient-to-r from-blue-500 to-sky-500 text-white"
                                    : "border border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-slate-50"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedScreen.includes(screen)}
                                  onChange={() =>
                                    setSelectedScreen((prev) =>
                                      prev.includes(screen)
                                        ? prev.filter(
                                            (value) => value !== screen,
                                          )
                                        : [...prev, screen],
                                    )
                                  }
                                  className="sr-only"
                                />
                                <span>{screen}</span>
                                <div
                                  className={`w-2 h-2 rounded-full ${
                                    selectedScreen.includes(screen)
                                      ? "bg-white/90"
                                      : "bg-slate-300"
                                  }`}
                                />
                              </label>
                            ))}
                          </div>
                        </div>
                      )}

                      {resolutionOptions.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h4 className="text-base font-bold text-slate-900">
                                Resolution
                              </h4>
                              <p className="mt-1 text-xs text-slate-500">
                                Filter by panel resolution
                              </p>
                            </div>
                            <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-bold text-blue-600">
                              {selectedResolution.length}
                            </span>
                          </div>
                          <div className="space-y-2">
                            {resolutionOptions.map((resolution) => (
                              <label
                                key={resolution}
                                className={`flex items-center justify-between gap-2 cursor-pointer px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                                  selectedResolution.includes(resolution)
                                    ? "border border-blue-400 bg-gradient-to-r from-blue-500 to-sky-500 text-white"
                                    : "border border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-slate-50"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedResolution.includes(
                                    resolution,
                                  )}
                                  onChange={() =>
                                    setSelectedResolution((prev) =>
                                      prev.includes(resolution)
                                        ? prev.filter(
                                            (value) => value !== resolution,
                                          )
                                        : [...prev, resolution],
                                    )
                                  }
                                  className="sr-only"
                                />
                                <span>{resolution}</span>
                                <div
                                  className={`w-2 h-2 rounded-full ${
                                    selectedResolution.includes(resolution)
                                      ? "bg-white/90"
                                      : "bg-slate-300"
                                  }`}
                                />
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="flex gap-3 border-t border-slate-200 bg-white p-4">
                  <button
                    onClick={clearAllFilters}
                    className="h-11 flex-1 rounded-xl border border-slate-300 font-semibold text-slate-700"
                  >
                    Clear all
                  </button>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="h-11 flex-1 rounded-xl bg-gradient-to-r from-blue-500 to-sky-500 font-semibold text-white"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrendingProductsHub;
