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
import { fetchPublicJson } from "../../utils/publicJsonRequest";
import { buildApiUrl } from "../../utils/apiUrl";

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
  );
  return rawScore != null ? Number(rawScore.toFixed(1)) : null;
};

const TrendSpecScoreBadge = ({ score }) => {
  const value = Number.isFinite(Number(score)) ? Number(score) : null;
  const label = value != null ? `${value.toFixed(1)}%` : "Live";
  return (
    <div className="inline-flex flex-col items-center justify-center rounded-md border border-cyan-200/20 bg-cyan-300/10 px-2 py-1 leading-none shadow-[0_10px_28px_rgba(8,145,178,0.18)]">
      <span className="text-[10px] font-black text-cyan-100">{label}</span>
      <span className="mt-0.5 text-[8px] font-bold uppercase tracking-wide text-cyan-200/70">
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

const parseArrayIfNeeded = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return [];
  const trimmed = value.trim();
  if (!trimmed.startsWith("[") || !trimmed.endsWith("]")) return [];
  try {
    const parsed = JSON.parse(trimmed);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const normalizeImageList = (...values) => {
  const images = [];
  const add = (value) => {
    if (!value) return;
    if (Array.isArray(value)) {
      value.forEach(add);
      return;
    }
    if (typeof value === "string") {
      const parsed = parseArrayIfNeeded(value);
      if (parsed.length) {
        parsed.forEach(add);
        return;
      }
      const image = toText(value);
      if (image) images.push(image);
      return;
    }
    if (typeof value === "object") {
      add(
        value.image_url ||
          value.imageUrl ||
          value.product_image ||
          value.productImage ||
          value.thumbnail ||
          value.src ||
          value.url ||
          value.image,
      );
    }
  };

  values.forEach(add);
  return Array.from(new Set(images.filter(Boolean)));
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
    smartphone: "/api/public/trending/smartphones?limit=120",
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
  if (Array.isArray(row?.variants_json)) return row.variants_json;
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
  const variants = getRowVariants(row);
  const topImage = normalizeImageList(
    row?.image,
    row?.image_url,
    row?.imageUrl,
    row?.product_image,
    row?.productImage,
    row?.thumbnail,
    row?.images,
    row?.images_json,
    row?.metadata?.images,
    row?.metadata?.images_json,
    row?.field_profile?.mandatory_values?.image,
    row?.field_profile?.mandatory_display?.image,
    row?.fieldProfile?.mandatoryValues?.image,
    variants.flatMap((variant) =>
      normalizeImageList(
        variant?.image,
        variant?.image_url,
        variant?.imageUrl,
        variant?.product_image,
        variant?.productImage,
        variant?.images,
        variant?.images_json,
        variant?.variant_images_json,
      ),
    ),
  )[0];
  if (topImage) return topImage;

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

const uniqueBadges = (...values) =>
  Array.from(
    new Set(
      values
        .map((value) => firstText(value))
        .filter(Boolean)
        .map((value) => value.replace(/\s+/g, " ")),
    ),
  ).slice(0, 2);

const BestPriceCard = ({
  device,
  index,
  isLoaded,
  onClick,
  FallbackCardIcon,
}) => {
  const [imageFailed, setImageFailed] = useState(false);
  const priceLabel =
    device.price && device.price !== "N/A" ? device.price : "Explore";
  const metaLabel = device.brand || device.badge || "Trending pick";
  const specBadges = Array.isArray(device.specBadges)
    ? device.specBadges.filter(Boolean)
    : [device.ram, device.storage].filter(Boolean);

  return (
    <button
      type="button"
      aria-label={`Open ${device.name}`}
      onClick={onClick}
      className={`group relative flex w-[15.5rem] shrink-0 snap-start flex-col overflow-hidden rounded-lg border border-cyan-200/14 bg-white/[0.055] p-3 text-left text-white shadow-[0_16px_42px_rgba(2,6,23,0.14)] transition-all duration-300 hover:-translate-y-1 hover:border-cyan-200/28 hover:bg-white/[0.075] sm:w-[16.75rem] sm:p-3.5 lg:w-[18rem] ${
        isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
      style={{ transitionDelay: `${index * 60}ms` }}
    >
      <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_12%,rgba(34,211,238,0.16),transparent_30%),radial-gradient(circle_at_88%_30%,rgba(217,70,239,0.16),transparent_34%)] opacity-80" />
      <span className="pointer-events-none absolute -right-5 top-12 text-8xl font-black leading-none text-white/[0.035] transition-transform duration-300 group-hover:scale-110">
        {String(index + 1).padStart(2, "0")}
      </span>

      <div className="relative z-10 flex items-center justify-between gap-3">
        <span className="rounded-md border border-white/10 bg-white/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-100">
          Pick {String(index + 1).padStart(2, "0")}
        </span>
        <TrendSpecScoreBadge score={device.score} />
      </div>

      <div className="relative z-10 mt-4 flex h-32 w-full items-center justify-center overflow-visible sm:h-36 lg:h-40">
        <span className="absolute bottom-3 h-12 w-28 rounded-full bg-cyan-200/10 blur-2xl" />
        <span className="absolute h-24 w-24 rounded-full bg-gradient-to-br from-cyan-300/12 via-blue-500/10 to-fuchsia-400/12 blur-xl" />
        {device.image && !imageFailed ? (
          <img
            src={device.image}
            alt={device.name}
            className="relative z-10 h-full w-full object-contain p-1 drop-shadow-[0_24px_34px_rgba(2,6,23,0.4)] transition-transform duration-300 group-hover:scale-110"
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : device.short ? (
          <span className="relative z-10 text-lg font-black tracking-wide text-cyan-100/75">
            {device.short}
          </span>
        ) : (
          <FallbackCardIcon className="relative z-10 text-4xl text-cyan-100/60" />
        )}
      </div>

      <div className="relative z-10 mt-3 min-w-0 flex-1">
        <p className="line-clamp-2 text-base font-black leading-snug text-white">
          {device.name}
        </p>
        <p className="mt-1 text-xs font-bold text-cyan-100/65">{metaLabel}</p>
        {specBadges.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {specBadges.map((badge) => (
              <span
                key={badge}
                className="inline-flex max-w-full truncate rounded-md border border-white/10 bg-white/[0.07] px-2 py-1 text-[10px] font-bold text-white/70"
              >
                {badge}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="relative z-10 mt-4 flex items-center justify-between gap-3 border-t border-cyan-100/10 pt-3">
        <span className="text-sm font-black text-white">{priceLabel}</span>
        <span className="grid h-8 w-8 place-items-center rounded-md bg-gradient-to-br from-cyan-400/80 to-fuchsia-500/80 text-white transition-transform duration-300 group-hover:translate-x-1">
          <FaArrowRight className="h-3 w-3" />
        </span>
      </div>
    </button>
  );
};

const BestPriceSkeleton = ({ index, isLoaded }) => (
  <div
    className={`relative flex w-[15.5rem] shrink-0 flex-col overflow-hidden rounded-lg border border-cyan-200/12 bg-white/[0.055] p-3 transition-all duration-300 sm:w-[16.75rem] sm:p-3.5 lg:w-[18rem] ${
      isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
    } animate-pulse`}
    style={{ transitionDelay: `${index * 60}ms` }}
  >
    <div className="flex items-center justify-between gap-3">
      <div className="h-7 w-20 rounded-md bg-white/10" />
      <div className="h-8 w-12 rounded-md bg-white/10" />
    </div>

    <div className="mt-4 flex h-32 w-full items-center justify-center sm:h-36 lg:h-40">
      <div className="h-24 w-20 rounded-md bg-white/10" />
    </div>

    <div className="mt-3 flex-1">
      <div className="h-4 w-4/5 rounded bg-white/12" />
      <div className="mt-2 h-3 w-24 rounded bg-white/10" />
      <div className="mt-3 flex gap-2">
        <div className="h-6 w-16 rounded-md bg-white/10" />
        <div className="h-6 w-20 rounded-md bg-white/10" />
      </div>
    </div>

    <div className="mt-4 flex items-center justify-between gap-3 border-t border-cyan-100/10 pt-3">
      <div className="h-4 w-20 rounded bg-white/12" />
      <div className="h-8 w-8 rounded-md bg-white/10" />
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
        const json = await fetchPublicJson(
          buildApiUrl(endpoint.replace(/^\/api/, "")),
        );
        if (cancelled) return;

        const rows = getTrendingRows(json, activeCategory);
        const mapped = rows.map((row, index) => {
          const basePrice = getRowPrice(row);
          const specs = getRamStorageFromTrendingRow(row);
          const keySpecs =
            parseObjectIfNeeded(row?.key_specs_json || row?.key_specs) || {};
          const displaySpecs =
            parseObjectIfNeeded(row?.display_json || row?.display) || {};
          const smartSpecs =
            parseObjectIfNeeded(row?.smart_tv_json || row?.smart_tv) || {};
          const tvSpecBadges =
            activeCategory === "appliance"
              ? uniqueBadges(
                  keySpecs.screen_size,
                  row?.screen_size,
                  getRowVariants(row)?.[0]?.screen_size,
                  keySpecs.resolution,
                  displaySpecs.resolution,
                  keySpecs.panel_type,
                  displaySpecs.panel_type,
                  keySpecs.refresh_rate,
                  displaySpecs.refresh_rate,
                  keySpecs.operating_system,
                  smartSpecs.operating_system,
                )
              : [];
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
            specBadges:
              activeCategory === "appliance"
                ? tvSpecBadges
                : uniqueBadges(
                    normalizeMemoryValue(specs.ram),
                    normalizeMemoryValue(specs.storage),
                  ),
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
              _specBadges: new Set(row.specBadges || []),
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
          (row.specBadges || []).forEach((badge) =>
            existing._specBadges.add(badge),
          );

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
              specBadges: Array.from(item._specBadges || []).slice(0, 2),
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
  const activeCategoryLabel =
    categories.find((category) => category.id === activeCategory)?.name ||
    "Smartphones";
  const headline =
    activeCategory === "smartphone"
      ? "Trending Smartphones"
      : `Trending ${activeCategoryLabel}`;

  return (
    <section
      className={`relative overflow-hidden bg-[#050712] transition-all duration-700 ${
        isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
    >
      <svg
        className="pointer-events-none absolute inset-0 hidden h-full w-full opacity-34 sm:block"
        viewBox="0 0 1440 660"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="trendingTrace" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#22D3EE" stopOpacity="0" />
            <stop offset="45%" stopColor="#60A5FA" stopOpacity="0.58" />
            <stop offset="100%" stopColor="#D946EF" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="trendingDeviceGlow" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#67E8F9" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#C084FC" stopOpacity="0.18" />
          </linearGradient>
        </defs>
        <path
          d="M-70 150H208c78 0 88 92 168 92h236c92 0 94-126 188-126h238c92 0 102 110 190 110h282"
          stroke="url(#trendingTrace)"
          strokeWidth="2"
          fill="none"
        />
        <path
          d="M-70 540H184c86 0 94-92 178-92h264c88 0 96 120 184 120h238c96 0 104-108 202-108h260"
          stroke="url(#trendingTrace)"
          strokeWidth="2"
          fill="none"
        />
        <rect
          x="84"
          y="286"
          width="146"
          height="92"
          rx="20"
          fill="rgba(14,165,233,0.04)"
          stroke="url(#trendingDeviceGlow)"
          strokeWidth="2"
        />
        <rect
          x="1184"
          y="258"
          width="118"
          height="198"
          rx="28"
          fill="rgba(168,85,247,0.05)"
          stroke="url(#trendingDeviceGlow)"
          strokeWidth="2"
        />
        <circle cx="376" cy="242" r="5" fill="rgba(186,230,253,0.45)" />
        <circle cx="810" cy="568" r="5" fill="rgba(216,180,254,0.4)" />
      </svg>
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-18 sm:hidden"
        viewBox="0 0 390 820"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="trendingMobileTrace" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#22D3EE" stopOpacity="0" />
            <stop offset="48%" stopColor="#60A5FA" stopOpacity="0.46" />
            <stop offset="100%" stopColor="#D946EF" stopOpacity="0" />
          </linearGradient>
          <linearGradient
            id="trendingMobileDeviceGlow"
            x1="0"
            y1="0"
            x2="1"
            y2="1"
          >
            <stop offset="0%" stopColor="#67E8F9" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#C084FC" stopOpacity="0.16" />
          </linearGradient>
        </defs>
        <path
          d="M-34 90H78C118 90 122 148 164 148H258C302 148 306 94 426 94"
          stroke="url(#trendingMobileTrace)"
          strokeWidth="1.6"
          fill="none"
        />
        <path
          d="M-36 560H86C128 560 138 494 182 494H260C302 494 314 604 426 604"
          stroke="url(#trendingMobileTrace)"
          strokeWidth="1.6"
          fill="none"
        />
        <rect
          x="-14"
          y="306"
          width="72"
          height="112"
          rx="18"
          fill="rgba(14,165,233,0.04)"
          stroke="url(#trendingMobileDeviceGlow)"
          strokeWidth="1.5"
        />
        <rect
          x="306"
          y="424"
          width="76"
          height="118"
          rx="20"
          fill="rgba(168,85,247,0.05)"
          stroke="url(#trendingMobileDeviceGlow)"
          strokeWidth="1.5"
        />
        <circle cx="78" cy="90" r="3.5" fill="rgba(186,230,253,0.38)" />
        <circle cx="182" cy="494" r="3.5" fill="rgba(216,180,254,0.34)" />
      </svg>
      <div className="pointer-events-none absolute -left-24 top-16 hidden h-72 w-72 rounded-full border border-cyan-300/12 sm:block" />
      <div className="pointer-events-none absolute -right-28 bottom-8 hidden h-80 w-80 rounded-full border border-fuchsia-300/14 sm:block" />
      <div className="pointer-events-none absolute inset-x-0 top-1/2 hidden h-px bg-gradient-to-r from-transparent via-cyan-300/20 to-transparent sm:block" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-12" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12" />
      <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-12 sm:px-6 sm:pb-14 sm:pt-16 lg:px-8 lg:pb-16 lg:pt-20">
        {/* Header Section */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex rounded-md border border-cyan-200/20 bg-cyan-300/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.24em] text-cyan-100">
              Live Trends
            </span>
            <h2 className="mt-4 max-w-2xl text-3xl font-black leading-[1.02] tracking-[-0.04em] text-white sm:text-5xl lg:text-6xl">
              {headline}
            </h2>
            <p className="mt-4 max-w-xl text-sm font-semibold leading-6 text-cyan-50/72 sm:text-base">
              Live picks ranked by buyer interest, spec strength, and current
              price signals.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 rounded-lg border border-white/10 bg-white/[0.055] p-1.5">
            {categories.map((category) => {
              const Icon = category.icon;
              const isActive = activeCategory === category.id;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setActiveCategory(category.id)}
                  className={`inline-flex items-center gap-2 rounded-md px-3.5 py-2 text-xs font-black transition-all duration-300 ${
                    isActive
                      ? "bg-gradient-to-r from-cyan-400 to-fuchsia-500 text-white shadow-[0_12px_32px_rgba(34,211,238,0.2)]"
                      : "bg-white/[0.04] text-cyan-100/72 hover:bg-white/[0.08] hover:text-white"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {category.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Trending by Hooks - Single Row */}
        <div className="mt-8 flex items-center gap-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-300/35 to-transparent" />
          <span className="whitespace-nowrap rounded-md border border-white/10 bg-white/[0.06] px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-cyan-100/70">
            Live ranking
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-fuchsia-300/30 to-transparent" />
        </div>

        {/* Products Row - Horizontal scroll with fixed-size cards */}
        <div className="no-scrollbar mt-6 flex snap-x snap-mandatory items-stretch gap-4 overflow-x-auto pb-2 pr-8 sm:gap-4 sm:pr-12 md:gap-5">
          {loadingTrending ? (
            Array.from({ length: 8 }).map((_, i) => (
              <BestPriceSkeleton
                key={`skeleton-${i}`}
                index={i}
                isLoaded={isLoaded}
              />
            ))
          ) : currentDevices.length ? (
            currentDevices.map((device, i) => (
              <BestPriceCard
                key={`${device.id || "noid"}-${i}`}
                device={device}
                index={i}
                isLoaded={isLoaded}
                onClick={() => handleDeviceClick(device)}
                FallbackCardIcon={FallbackCardIcon}
              />
            ))
          ) : (
            <div className="w-full rounded-lg border border-cyan-200/14 bg-white/[0.055] p-6 text-sm font-semibold text-cyan-50/70">
              Live trending data is not available right now. Please check back
              in a moment.
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default BestPriceSection;
