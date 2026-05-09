// src/components/Home/BestPrice.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createProductPath } from "../../utils/slugGenerator";
import useRevealAnimation from "../../hooks/useRevealAnimation";
import {
  FaMobileAlt,
  FaLaptop,
  FaTv,
  FaWifi,
  FaArrowRight,
} from "react-icons/fa";
import {
  HOME_SECTION_LEAD_LIGHT,
  HOME_SECTION_TITLE_LIGHT,
} from "./homeSectionTypography";

const normalizeScore100 = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  if (n <= 1) return Math.max(0, Math.min(100, n * 100));
  if (n <= 10) return Math.max(0, Math.min(100, n * 10));
  return Math.max(0, Math.min(100, n));
};

const mapScoreToDisplayBand = (score, minTarget = 80, maxTarget = 98) => {
  const normalized = normalizeScore100(score);
  if (normalized == null) return null;
  const mapped = minTarget + (normalized / 100) * (maxTarget - minTarget);
  return Number(mapped.toFixed(1));
};

const pickScoreValue = (...values) => {
  for (const value of values) {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
};

const getRowDisplayScore = (row) => {
  const displayScore = pickScoreValue(
    row?.overall_score_display,
    row?.overallScoreDisplay,
    row?.overall_score_v2_display_80_98,
    row?.overallScoreV2Display8098,
    row?.spec_score_v2_display_80_98,
    row?.specScoreV2Display8098,
  );
  if (displayScore != null) return Number(displayScore.toFixed(1));

  const rawScore = pickScoreValue(
    row?.overall_score_v2,
    row?.overallScoreV2,
    row?.spec_score_v2,
    row?.specScoreV2,
    row?.overall_score,
    row?.overallScore,
    row?.spec_score,
    row?.specScore,
    row?.hook_score,
    row?.hookScore,
  );
  return mapScoreToDisplayBand(rawScore);
};

const TrendSpecScoreBadge = ({ score }) => {
  const value = Number.isFinite(Number(score)) ? Number(score) : null;
  const label = value != null ? `${value.toFixed(1)}%` : "--";
  return (
    <div className="inline-flex flex-col items-center justify-center rounded-md border border-violet-200 bg-violet-50/95 px-1.5 py-1 leading-none">
      <span className="text-[10px] font-bold text-violet-700">{label}</span>
      <span className="mt-0.5 text-[8px] font-semibold uppercase tracking-wide text-violet-600">
        Score
      </span>
    </div>
  );
};

const toText = (value) => {
  if (value === null || value === undefined) return null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const normalized = toText(item);
      if (normalized) return normalized;
    }
    return null;
  }
  if (typeof value === "object") {
    const objectCandidate =
      toText(value?.value) ||
      toText(value?.label) ||
      toText(value?.name) ||
      toText(value?.text) ||
      toText(value?.title) ||
      toText(value?.display) ||
      toText(value?.ram) ||
      toText(value?.RAM) ||
      toText(value?.storage) ||
      toText(value?.rom) ||
      toText(value?.ROM) ||
      toText(value?.capacity) ||
      toText(value?.size);
    if (objectCandidate) return objectCandidate;

    const amount = toText(value?.amount ?? value?.val);
    const unit = toText(value?.unit ?? value?.uom);
    if (amount && unit) return `${amount} ${unit}`;
    return null;
  }
  const text = String(value).trim();
  if (!text) return null;
  const lower = text.toLowerCase();
  if (
    lower === "null" ||
    lower === "undefined" ||
    lower === "n/a" ||
    lower === "na"
  ) {
    return null;
  }
  return text.replace(/\s+/g, " ");
};

const parseObjectIfNeeded = (value) => {
  if (!value) return null;
  if (typeof value === "object") return value;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
};

const firstText = (...values) => {
  for (const value of values) {
    const normalized = toText(value);
    if (normalized) return normalized;
  }
  return null;
};

const parseVariantRamStorage = (label) => {
  const text = toText(label);
  if (!text) return { ram: null, storage: null };

  const pair = text.match(
    /(\d+(?:\.\d+)?)\s*(GB|MB)\s*(?:RAM)?\s*(?:\/|\+|\|)\s*(\d+(?:\.\d+)?)\s*(GB|TB)/i,
  );
  if (pair) {
    return {
      ram: `${pair[1]} ${pair[2]}`.toUpperCase(),
      storage: `${pair[3]} ${pair[4]}`.toUpperCase(),
    };
  }

  const ram = text.match(/(\d+(?:\.\d+)?)\s*(GB|MB)\s*RAM/i);
  const storage = text.match(/(\d+(?:\.\d+)?)\s*(GB|TB)\s*(?:ROM|STORAGE)?/i);

  return {
    ram: ram ? `${ram[1]} ${ram[2]}`.toUpperCase() : null,
    storage: storage ? `${storage[1]} ${storage[2]}`.toUpperCase() : null,
  };
};

const getRamStorageFromTrendingRow = (row) => {
  const attrs = parseObjectIfNeeded(
    row?.attributes ?? row?.variant_attributes ?? row?.variantAttributes,
  );
  const specs = parseObjectIfNeeded(row?.specs);
  const perf = parseObjectIfNeeded(row?.performance);
  const variant = parseObjectIfNeeded(row?.variant);

  let ram = firstText(
    row?.ram,
    row?.RAM,
    row?.memory,
    row?.variant_ram,
    row?.variantRam,
    attrs?.ram,
    attrs?.RAM,
    attrs?.memory,
    specs?.ram,
    specs?.RAM,
    perf?.ram,
    perf?.RAM,
    variant?.ram,
    variant?.RAM,
    row?.memory?.ram,
    row?.memory?.RAM,
    row?.memory?.memory,
  );

  let storage = firstText(
    row?.storage,
    row?.internal_storage,
    row?.storage_capacity,
    row?.rom,
    row?.ROM,
    row?.variant_storage,
    row?.variantStorage,
    attrs?.storage,
    attrs?.internal_storage,
    attrs?.rom,
    attrs?.ROM,
    specs?.storage,
    specs?.rom,
    specs?.ROM,
    perf?.storage,
    perf?.rom,
    perf?.ROM_storage,
    variant?.storage,
    variant?.rom,
    row?.storage?.capacity,
    row?.storage?.storage,
    row?.storage?.rom,
    row?.storage?.ROM,
    row?.storage?.internal_storage,
  );

  if (!ram || !storage) {
    const fromLabel = parseVariantRamStorage(
      firstText(
        row?.variant_name,
        row?.variant_title,
        row?.variant_label,
        row?.title,
      ),
    );
    if (!ram) ram = fromLabel.ram;
    if (!storage) storage = fromLabel.storage;
  }

  return { ram, storage };
};

const normalizeMemoryValue = (value) => {
  const text = toText(value);
  if (!text) return null;

  const matches = Array.from(text.matchAll(/(\d+(?:\.\d+)?)\s*(TB|GB|MB)/gi));
  if (matches.length > 1) {
    const parts = matches.map((match) => {
      const amount = Number(match[1]);
      const unit = match[2].toUpperCase();
      return `${Number.isFinite(amount) ? amount : match[1]} ${unit}`;
    });
    const unique = Array.from(new Set(parts));
    unique.sort((a, b) => {
      const diff = memoryToMb(a) - memoryToMb(b);
      if (diff !== 0) return diff;
      return String(a).localeCompare(String(b));
    });
    return unique.join(" / ");
  }

  const parsed = text.match(/(\d+(?:\.\d+)?)\s*(TB|GB|MB)/i);
  if (parsed) {
    const amount = Number(parsed[1]);
    const unit = parsed[2].toUpperCase();
    return `${Number.isFinite(amount) ? amount : parsed[1]} ${unit}`;
  }

  const cleaned = text
    .replace(/\b(ram|rom|storage|internal|memory)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned || text;
};

const memoryToMb = (value) => {
  const text = toText(value);
  if (!text) return Number.MAX_SAFE_INTEGER;
  const parsed = text.match(/(\d+(?:\.\d+)?)\s*(TB|GB|MB)/i);
  if (!parsed) return Number.MAX_SAFE_INTEGER;

  const amount = Number(parsed[1]);
  if (!Number.isFinite(amount)) return Number.MAX_SAFE_INTEGER;
  const unit = parsed[2].toUpperCase();

  if (unit === "TB") return amount * 1024 * 1024;
  if (unit === "GB") return amount * 1024;
  return amount;
};

const combineMemoryValues = (values) => {
  if (!values || values.size === 0) return null;

  const sorted = Array.from(values)
    .filter(Boolean)
    .sort((a, b) => {
      const diff = memoryToMb(a) - memoryToMb(b);
      if (diff !== 0) return diff;
      return String(a).localeCompare(String(b));
    });

  return sorted.length ? sorted.join(" / ") : null;
};

const parsePriceNumber = (value) => {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;

  const cleaned = String(value).replace(/[^\d.]/g, "");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
};

const getCategoryEndpoint = (activeCategory) => {
  const endpointMap = {
    smartphone: "/api/public/trending/smartphones?limit=15",
    laptop: "/api/public/trending/laptops?limit=15",
    appliance: "/api/public/trending/tvs?limit=15",
    networking: "/api/public/trending/networking?limit=15",
  };
  return endpointMap[activeCategory] || endpointMap.smartphone;
};

const getTrendingRows = (json, activeCategory) => {
  if (Array.isArray(json?.trending)) return json.trending;

  if (activeCategory === "laptop" && Array.isArray(json?.laptops)) {
    return json.laptops;
  }
  if (activeCategory === "appliance" && Array.isArray(json?.tvs)) {
    return json.tvs;
  }
  if (activeCategory === "smartphone" && Array.isArray(json?.smartphones)) {
    return json.smartphones;
  }
  if (activeCategory === "networking" && Array.isArray(json?.networking)) {
    return json.networking;
  }

  if (Array.isArray(json)) return json;
  return [];
};

const getRowVariants = (row) => {
  if (Array.isArray(row?.variants)) return row.variants;
  if (Array.isArray(row?.metadata?.variants)) return row.metadata.variants;
  return [];
};

const getRowPrice = (row) => {
  const topLevelPrice = parsePriceNumber(
    row?.price ?? row?.base_price ?? row?.starting_price ?? row?.min_price,
  );
  if (topLevelPrice !== null) return topLevelPrice;

  const variants = getRowVariants(row);
  if (!variants.length) return null;

  const prices = [];
  variants.forEach((variant) => {
    const base = parsePriceNumber(variant?.base_price ?? variant?.price);
    if (base !== null) prices.push(base);

    const storePrices = Array.isArray(variant?.store_prices)
      ? variant.store_prices
      : [];
    storePrices.forEach((store) => {
      const sp = parsePriceNumber(store?.price);
      if (sp !== null) prices.push(sp);
    });
  });

  if (!prices.length) return null;
  return Math.min(...prices);
};

const getRowName = (row) =>
  firstText(
    row?.name,
    row?.product_name,
    row?.model,
    row?.basic_info?.product_name,
    row?.basic_info?.title,
    row?.basic_info?.model,
  ) || "";

const getRowBrand = (row) =>
  firstText(
    row?.brand,
    row?.brand_name,
    row?.basic_info?.brand_name,
    row?.basic_info?.brand,
  ) || "";

const getRowImage = (row) => {
  const topImage = firstText(row?.image, row?.image_url, row?.product_image);
  if (topImage) return topImage;

  if (Array.isArray(row?.images) && row.images.length) {
    return firstText(row.images[0]) || "";
  }
  if (Array.isArray(row?.metadata?.images) && row.metadata.images.length) {
    return firstText(row.metadata.images[0]) || "";
  }

  const variants = getRowVariants(row);
  const variantImage = firstText(
    variants?.[0]?.image,
    variants?.[0]?.image_url,
    variants?.[0]?.product_image,
  );
  return variantImage || "";
};

const getRowBadge = (row) =>
  firstText(
    row?.badge,
    row?.trend_badge,
    row?.trend_label,
    row?.manual_badge,
  ) || "Best Deal";

const getShortLabel = (name, brand) => {
  const source = firstText(brand, name) || "Device";
  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
};

const getDeviceMetaLabel = (device) => {
  const parts = [];
  if (device?.brand) parts.push(device.brand);
  if (device?.price && device.price !== "N/A") parts.push(device.price);
  if (parts.length) return parts.join(" · ");
  return device?.badge || "Trending pick";
};

const BestPriceCard = ({
  device,
  index,
  isLoaded,
  onClick,
  FallbackCardIcon,
}) => {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <button
      type="button"
      aria-label={`Open ${device.name}`}
      onClick={onClick}
      className={`group relative flex min-w-[160px] sm:min-w-[180px] md:min-w-[200px] shrink-0 flex-col gap-2.5 rounded-2xl sm:rounded-3xl  bg-transparent p-4 sm:p-5 text-left text-slate-900  backdrop-blur-lg transition-all duration-300 hover:-translate-y-0.5  ${
        isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
      style={{ transitionDelay: `${index * 60}ms` }}
    >
      <div className="flex h-32 w-full sm:h-40 lg:h-44 items-center justify-center overflow-hidden rounded-xl sm:rounded-2xl border border-slate-200 bg-slate-50">
        {device.image && !imageFailed ? (
          <img
            src={device.image}
            alt={device.name}
            className="h-full w-full object-contain p-2 sm:p-3 transition-transform duration-300 group-hover:scale-110"
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : device.short ? (
          <span className="text-base sm:text-lg font-bold tracking-wide text-slate-400">
            {device.short}
          </span>
        ) : (
          <FallbackCardIcon className="text-4xl text-slate-400" />
        )}
      </div>

      <div className="flex-1">
        <p className="line-clamp-2 text-xs sm:text-sm font-bold leading-snug text-slate-900">
          {device.name}
        </p>
        <p className="mt-0.5 text-[10px] sm:text-xs font-medium text-slate-500">
          {getDeviceMetaLabel(device)}
        </p>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-slate-200 pt-2.5 sm:pt-3">
        <span className="text-[10px] sm:text-xs font-semibold text-slate-700">
          View Details
        </span>
        <span className="transition-transform duration-300 group-hover:translate-x-1">
          <FaArrowRight className="h-2.5 w-2.5 sm:h-3 sm:w-3.5 text-slate-500" />
        </span>
      </div>
    </button>
  );
};

const BestPriceSkeleton = ({ index, isLoaded }) => (
  <div
    className={`flex min-w-[160px] sm:min-w-[180px] md:min-w-[200px] shrink-0 flex-col gap-2.5 rounded-2xl sm:rounded-3xl p-4 sm:p-5 text-slate-900  backdrop-blur-lg transition-all duration-300 ${
      isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
    } animate-pulse`}
    style={{ transitionDelay: `${index * 60}ms` }}
  >
    <div className="flex h-32 w-full items-center justify-center overflow-hidden rounded-xl sm:rounded-2xl border border-slate-200 bg-slate-50 sm:h-40 lg:h-44">
      <div className="h-12 w-12 rounded bg-slate-200" />
    </div>

    <div className="flex-1">
      <div className="h-3 w-4/5 rounded bg-slate-200" />
      <div className="mt-2 h-2 w-24 rounded bg-slate-100" />
    </div>

    <div className="flex items-center justify-between gap-2 border-t border-slate-200 pt-2.5 sm:pt-3">
      <div className="h-2.5 w-20 rounded bg-slate-200" />
      <div className="h-3 w-3 rounded-full bg-slate-200 sm:h-3.5 sm:w-3.5" />
    </div>
  </div>
);

const BestPriceSection = () => {
  const [activeCategory, setActiveCategory] = useState("smartphone");
  const [currentDevices, setCurrentDevices] = useState([]);
  const [loadingTrending, setLoadingTrending] = useState(false);
  const navigate = useNavigate();
  const isLoaded = useRevealAnimation();

  // Trending categories
  const categories = [
    {
      id: "smartphone",
      name: "Smartphones",
      icon: FaMobileAlt,
    },
    {
      id: "laptop",
      name: "Laptops",
      icon: FaLaptop,
    },
    {
      id: "appliance",
      name: "TVs",
      icon: FaTv,
    },
  ];

  // Fetch trending products for active category
  useEffect(() => {
    let cancelled = false;
    const fetchTrending = async () => {
      setLoadingTrending(true);
      setCurrentDevices([]);
      const endpoint = getCategoryEndpoint(activeCategory);

      try {
        const r = await fetch(`https://api.apisphere.in${endpoint}`);
        if (!r.ok) throw new Error("Failed to fetch trending");
        const json = await r.json();
        if (cancelled) return;

        const rows = getTrendingRows(json, activeCategory);
        const mapped = rows.map((row, index) => {
          const basePrice = getRowPrice(row);
          const specs = getRamStorageFromTrendingRow(row);
          const priceStr =
            basePrice !== null && basePrice !== undefined && basePrice !== ""
              ? `₹${Number(basePrice).toLocaleString()}`
              : "N/A";
          const productId =
            row.product_id ??
            row.productId ??
            row.id ??
            row.basic_info?.id ??
            null;
          const variantId = row.variant_id ?? row.variantId ?? null;
          const formattedPriceStr =
            basePrice !== null && basePrice !== undefined && basePrice !== ""
              ? `Rs. ${Number(basePrice).toLocaleString("en-IN")}`
              : "N/A";

          return {
            id: productId,
            variantId,
            name: getRowName(row),
            brand: getRowBrand(row),
            badge: getRowBadge(row),
            base_price: basePrice !== null ? String(basePrice) : null,
            price: formattedPriceStr,
            ram: normalizeMemoryValue(specs.ram),
            storage: normalizeMemoryValue(specs.storage),
            image: getRowImage(row),
            score: getRowDisplayScore(row),
            short: getShortLabel(getRowName(row), getRowBrand(row)),
            _rowIndex: index,
            _priceNumber: basePrice,
          };
        });

        const grouped = new Map();

        mapped.forEach((row) => {
          const key =
            row.id != null ? `product-${row.id}` : `row-${row._rowIndex}`;
          const existing = grouped.get(key);

          if (!existing) {
            grouped.set(key, {
              ...row,
              variantId: null,
              _ramValues: new Set(row.ram ? [row.ram] : []),
              _storageValues: new Set(row.storage ? [row.storage] : []),
              _minPrice:
                row._priceNumber !== null && row._priceNumber !== undefined
                  ? row._priceNumber
                  : null,
              _minPriceStr: row.price,
              _score: row.score,
            });
            return;
          }

          if (row.ram) existing._ramValues.add(row.ram);
          if (row.storage) existing._storageValues.add(row.storage);

          if (!existing.image && row.image) existing.image = row.image;
          if (!existing.brand && row.brand) existing.brand = row.brand;
          if (!existing.name && row.name) existing.name = row.name;
          if (
            Number.isFinite(row.score) &&
            (!Number.isFinite(existing._score) || row.score > existing._score)
          ) {
            existing._score = row.score;
          }

          if (row._priceNumber !== null && row._priceNumber !== undefined) {
            if (
              existing._minPrice === null ||
              row._priceNumber < existing._minPrice
            ) {
              existing._minPrice = row._priceNumber;
              existing._minPriceStr = row.price;
            }
          }
        });

        const combined = Array.from(grouped.values())
          .map((item) => {
            const combinedRam = combineMemoryValues(item._ramValues);
            const combinedStorage = combineMemoryValues(item._storageValues);
            const minPrice =
              item._minPrice !== null && item._minPrice !== undefined
                ? item._minPrice
                : null;

            return {
              id: item.id,
              variantId: null,
              name: item.name,
              brand: item.brand,
              badge: item.badge,
              base_price:
                minPrice !== null ? String(minPrice) : item.base_price,
              price: minPrice !== null ? item._minPriceStr : item.price,
              ram: combinedRam,
              storage: combinedStorage,
              image: item.image,
              score: Number.isFinite(item._score) ? item._score : null,
              short: item.short,
            };
          })
          .slice(0, 15);

        setCurrentDevices(combined);
      } catch (err) {
        console.error("Failed to load trending:", err);
        setCurrentDevices([]);
      } finally {
        if (!cancelled) setLoadingTrending(false);
      }
    };

    fetchTrending();
    return () => {
      cancelled = true;
    };
  }, [activeCategory]);

  const getDevicePath = (device) => {
    const routeMap = {
      smartphone: "smartphones",
      laptop: "laptops",
      appliance: "tvs",
      networking: "networking",
    };
    const category = routeMap[activeCategory] || "smartphones";
    const rawName =
      device.name || device.model || device.product_name || device.brand || "";
    return createProductPath(category, rawName);
  };

  const handleDeviceClick = (device) => {
    navigate(getDevicePath(device));
  };

  const FallbackCardIcon =
    activeCategory === "laptop"
      ? FaLaptop
      : activeCategory === "appliance"
        ? FaTv
        : activeCategory === "networking"
          ? FaWifi
          : FaMobileAlt;

  return (
    <section
      className={`relative overflow-hidden border-t border-slate-200  transition-all duration-700 ${
        isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] [background-size:34px_34px] [mask-image:radial-gradient(circle_at_center,white,transparent_88%)]" />
      <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-16 lg:px-8 lg:pb-24 lg:pt-24">
        {/* Header Section */}
        <div className="mx-auto mb-12 max-w-5xl text-center">
          <h1
            className={` text-[11px] font-bold uppercase tracking-[0.32em] text-purple-600 sm:text-xs`}
          >
            Trending Smartphones
          </h1>
          <p className={HOME_SECTION_LEAD_LIGHT}>
            Compare the highest-scoring devices across smartphones, laptops,
            TVs, and networking gear.
          </p>
        </div>

        {/* Category Tabs - Single Row */}

        {/* Trending by Hooks - Single Row */}
        <div className="mt-10 flex items-center gap-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-300 to-transparent" />
          <span className="whitespace-nowrap text-xs font-bold uppercase tracking-[0.3em] text-slate-500">
            Trending
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
        </div>

        {/* Products Row - Horizontal scroll with fixed-size cards */}
        <div className="no-scrollbar mt-10 flex items-center gap-3 overflow-x-auto pb-2 sm:gap-4 md:gap-5">
          {loadingTrending
            ? Array.from({ length: 8 }).map((_, i) => (
                <BestPriceSkeleton
                  key={`skeleton-${i}`}
                  index={i}
                  isLoaded={isLoaded}
                />
              ))
            : currentDevices.map((device, i) => (
                <BestPriceCard
                  key={`${device.id || "noid"}-${i}`}
                  device={device}
                  index={i}
                  isLoaded={isLoaded}
                  onClick={() => handleDeviceClick(device)}
                  FallbackCardIcon={FallbackCardIcon}
                />
              ))}
        </div>
      </div>
    </section>
  );
};

export default BestPriceSection;
