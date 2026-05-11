// src/components/Home/FeaturedProduct.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowRight,
  FaChartLine,
  FaFire,
  FaMobileAlt,
  FaRupeeSign,
} from "react-icons/fa";
import useRevealAnimation from "../../hooks/useRevealAnimation";
import { createProductPath } from "../../utils/slugGenerator";
import { buildPublicSmartphoneFeaturePath as buildSmartphoneFeaturePath } from "../../utils/smartphoneListingRoutes";
import {
  HOME_SECTION_LEAD_DARK,
  HOME_SECTION_TITLE_DARK,
} from "./homeSectionTypography";

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL || "https://api.apisphere.in"
).replace(/\/$/, "");
const FEATURED_PHONES_LIMIT = 5;
const FEATURED_FETCH_LIMIT = 25;
const RUPEE = "\u20B9";

const budgetRanges = [
  {
    label: "Under Rs. 10,000",
    value: 10000,
    slug: "under-10000",
    accent: "from-blue-600 via-cyan-500 to-blue-600",
  },
  {
    label: "Under Rs. 15,000",
    value: 15000,
    slug: "under-15000",
    accent: "from-blue-600 via-cyan-500 to-blue-600",
  },
  {
    label: "Under Rs. 20,000",
    value: 20000,
    slug: "under-20000",
    accent: "from-blue-600 via-cyan-500 to-blue-600",
  },
  {
    label: "Under Rs. 25,000",
    value: 25000,
    slug: "under-25000",
    accent: "from-blue-600 via-cyan-500 to-blue-600",
  },
  {
    label: "Under Rs. 30,000",
    value: 30000,
    slug: "under-30000",
    accent: "from-blue-600 via-cyan-500 to-blue-600",
  },
  {
    label: "Under Rs. 40,000",
    value: 40000,
    slug: "under-40000",
    accent: "from-blue-600 via-cyan-500 to-blue-600",
  },
  {
    label: "Under Rs. 50,000",
    value: 50000,
    slug: "under-50000",
    accent: "from-blue-600 via-cyan-500 to-blue-600",
  },
  {
    label: "Under Rs. 60,000",
    value: 60000,
    slug: "under-60000",
    accent: "from-blue-600 via-cyan-500 to-blue-600",
  },
  {
    label: "Under Rs. 70,000",
    value: 70000,
    slug: "under-70000",
    accent: "from-blue-600 via-cyan-500 to-blue-600",
  },
];

const quickFilters = [
  { label: "5G Phones", feature: "5g" },
  { label: "AMOLED", feature: "amoled" },
  { label: "120Hz+", feature: "high-refresh-rate" },
  { label: "Long Battery", feature: "long-battery" },
  { label: "Fast Charge", feature: "fast-charging" },
  { label: "Gaming", feature: "gaming" },
];

const toText = (value) => {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) {
    for (const item of value) {
      const normalized = toText(item);
      if (normalized) return normalized;
    }
    return "";
  }
  if (typeof value === "object") {
    return (
      toText(value?.value) ||
      toText(value?.label) ||
      toText(value?.name) ||
      toText(value?.text) ||
      toText(value?.title) ||
      toText(value?.display) ||
      ""
    );
  }
  const text = String(value).trim();
  if (!text) return "";
  if (/^(null|undefined|n\/a|na)$/i.test(text)) return "";
  return text.replace(/\s+/g, " ");
};

const firstText = (...values) => {
  for (const value of values) {
    const normalized = toText(value);
    if (normalized) return normalized;
  }
  return "";
};

const pickNumber = (...values) => {
  for (const value of values) {
    const number = Number(value);
    if (Number.isFinite(number)) return number;
  }
  return null;
};

const parsePriceNumber = (value) => {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const cleaned = String(value).replace(/[^\d.]/g, "");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
};

const formatCurrency = (value) => {
  const amount = parsePriceNumber(value);
  if (amount === null) return "";
  return `${RUPEE} ${Math.round(amount).toLocaleString("en-IN")}`;
};

const normalizeScore100 = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  if (n <= 1) return Math.max(0, Math.min(100, n * 100));
  if (n <= 10) return Math.max(0, Math.min(100, n * 10));
  return Math.max(0, Math.min(100, n));
};

const pickScoreValue = (...values) => {
  for (const value of values) {
    const number = Number(value);
    if (Number.isFinite(number)) return number;
  }
  return null;
};

const parseDateTs = (value) => {
  const text = firstText(value);
  if (!text) return null;
  const ts = new Date(text).getTime();
  return Number.isFinite(ts) ? ts : null;
};

const formatMetricNumber = (value) => {
  const text = firstText(value);
  if (!text) return "";
  const match = text.match(/(\d+(?:\.\d+)?)/);
  return match ? match[1] : text;
};

const normalizeCameraLabel = (value) => {
  const text = firstText(value);
  if (!text) return "";
  const match = text.match(/(\d+(?:\.\d+)?)\s*mp/i);
  if (match) return `${match[1]}MP`;
  const metric = formatMetricNumber(text);
  return metric ? `${metric}MP` : text;
};

const normalizeBatteryLabel = (value) => {
  const text = firstText(value);
  if (!text) return "";
  const match = text.match(/(\d+(?:\.\d+)?)\s*mah/i);
  if (match) return `${match[1]}mAh`;
  const metric = formatMetricNumber(text);
  return metric ? `${metric}mAh` : text;
};

const normalizeMemoryLabel = (value) => {
  const text = firstText(value);
  if (!text) return "";
  const match = text.match(/(\d+(?:\.\d+)?)\s*(GB|TB|MB)/i);
  if (match) return `${match[1]}${match[2].toUpperCase()}`;
  return text.replace(/\s+/g, " ");
};

const getTrendingRows = (payload) => {
  if (Array.isArray(payload?.trending)) return payload.trending;
  if (Array.isArray(payload?.smartphones)) return payload.smartphones;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (Array.isArray(payload)) return payload;
  return [];
};

const getRowVariants = (row) =>
  Array.isArray(row?.variants)
    ? row.variants
    : Array.isArray(row?.metadata?.variants)
      ? row.metadata.variants
      : Array.isArray(row?.variants_json)
        ? row.variants_json
        : [];

const getRowName = (row) =>
  firstText(
    row?.name,
    row?.product_name,
    row?.model,
    row?.title,
    row?.basic_info?.product_name,
    row?.basic_info?.title,
    row?.basic_info?.model,
  );

const getRowBrand = (row) =>
  firstText(
    row?.brand,
    row?.brand_name,
    row?.basic_info?.brand_name,
    row?.basic_info?.brand,
  );

const getRowImage = (row) =>
  firstText(row?.image, row?.image_url, row?.product_image) ||
  firstText(row?.images?.[0], row?.metadata?.images?.[0]) ||
  "";

const getRowProcessor = (row) =>
  firstText(
    row?.performance?.processor,
    row?.processor,
    row?.cpu,
    row?.specs?.processor,
    row?.basic_info?.processor,
  );

const getRowCamera = (row) =>
  firstText(
    row?.camera?.main_camera_megapixels,
    row?.camera?.main,
    row?.camera?.primary,
    row?.specs?.camera,
    row?.camera?.rear_camera?.main?.megapixels,
  );

const getRowBattery = (row) =>
  firstText(
    row?.battery?.capacity_mAh,
    row?.battery?.capacity,
    row?.battery?.battery_capacity_mah,
    row?.battery?.battery_capacity,
    row?.specs?.battery,
  );

const getRowFastCharge = (row) =>
  firstText(
    row?.battery?.fast_charging,
    row?.battery?.fastCharging,
    row?.battery?.fast_charge,
    row?.specs?.fast_charging,
    row?.specs?.fastCharging,
  );

const getRowRefreshRate = (row) =>
  firstText(
    row?.display?.refresh_rate,
    row?.display?.refreshRate,
    row?.specs?.refresh_rate,
    row?.specs?.refreshRate,
  );

const getRowRam = (row) => {
  const values = [
    row?.performance?.ram,
    row?.specs?.ram,
    row?.memory?.ram,
    row?.ram,
    row?.memory,
  ];
  for (const variant of getRowVariants(row)) {
    values.push(variant?.ram, variant?.memory);
  }
  return firstText(...values);
};

const getRowPrice = (row) => {
  const prices = [];
  const add = (value) => {
    const price = parsePriceNumber(value);
    if (price !== null) prices.push(price);
  };

  add(row?.price);
  add(row?.base_price);
  add(row?.starting_price);
  add(row?.min_price);

  for (const variant of getRowVariants(row)) {
    add(variant?.base_price);
    add(variant?.price);
    add(variant?.amount);
    for (const store of Array.isArray(variant?.store_prices)
      ? variant.store_prices
      : []) {
      add(store?.price);
    }
  }

  return prices.length ? Math.min(...prices) : null;
};

const getRowScore = (row) => {
  const displayScore = pickScoreValue(
    row?.overall_score_display,
    row?.overallScoreDisplay,
    row?.overall_score_v2_display_80_98,
    row?.overallScoreV2Display8098,
    row?.spec_score_v2_display_80_98,
    row?.specScoreV2Display8098,
  );
  if (displayScore !== null) return Number(displayScore.toFixed(1));

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

  return rawScore !== null ? normalizeScore100(rawScore) : null;
};

const buildFeaturedNote = (row) => {
  const parts = [];
  const processor = getRowProcessor(row);
  const refreshRate = formatMetricNumber(getRowRefreshRate(row));
  const camera = normalizeCameraLabel(getRowCamera(row));
  const battery = normalizeBatteryLabel(getRowBattery(row));
  const fastCharge = formatMetricNumber(getRowFastCharge(row));
  const ram = normalizeMemoryLabel(getRowRam(row));

  if (processor) parts.push(processor);
  if (refreshRate) parts.push(`${refreshRate}Hz display`);
  if (camera) parts.push(`${camera} camera`);
  if (battery) parts.push(`${battery} battery`);
  if (fastCharge) parts.push(`${fastCharge}W charging`);
  if (ram) parts.push(`${ram} RAM`);

  if (parts.length === 0) {
    const price = getRowPrice(row);
    if (price !== null) return `Live price ${formatCurrency(price)}`;
  }

  return parts.length
    ? parts.slice(0, 2).join(" \u2022 ")
    : "Live handset pick";
};

const getShortLabel = (name, brand) => {
  const source = firstText(brand, name);
  if (!source) return "PH";
  const words = source.split(/\s+/).filter(Boolean);
  if (!words.length) return "PH";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return words
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();
};

const getDevicePath = (device) => {
  const rawName = device.name || device.brand || "smartphone";
  return createProductPath("smartphones", rawName);
};

const BudgetCard = ({
  item,
  index,
  isActive,
  isHovered,
  isLoaded,
  onClick,
  onMouseEnter,
  onMouseLeave,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      aria-pressed={isActive}
      className={`group relative w-full overflow-hidden rounded-2xl border border-red/50 bg-white/95 backdrop-blur-sm transition-all duration-500 ${
        isActive
          ? "transform -translate-y-1 shadow-[0_18px_36px_rgba(15,23,42,0.1)]"
          : "hover:bg-slate-50"
      } ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
      style={{ transitionDelay: `${index * 45}ms` }}
    >
      <div
        className={`absolute inset-0 transition-opacity duration-300 ${
          isActive
            ? `opacity-20 bg-gradient-to-r ${item.accent}`
            : isHovered
              ? `opacity-10 bg-gradient-to-r ${item.accent}`
              : "opacity-0"
        }`}
      />

      <div className="relative z-10 flex items-center gap-3 px-3 py-3 sm:p-5">
        <span
          className={`flex h-10 w-10 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl ring-1 transition-all duration-300 ${
            isActive
              ? "bg-gradient-to-br from-blue-600 via-cyan-500 to-blue-600 text-white ring-transparent shadow-lg shadow-cyan-200/40"
              : "bg-slate-100 text-slate-400 ring-slate-200 group-hover:bg-slate-200 group-hover:text-slate-500"
          }`}
        >
          <FaRupeeSign className="h-4 w-4 sm:h-6 sm:w-6" />
        </span>

        <span className="flex-1 min-w-0">
          <span className="block text-[9px] sm:text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
            Budget lane
          </span>
          <span className="block text-xs sm:text-lg font-bold text-slate-900 truncate">
            {item.label}
          </span>
        </span>

        <FaArrowRight className="hidden sm:block h-4 w-4 shrink-0 text-slate-400 transition-transform duration-300 group-hover:translate-x-1" />
      </div>

      <div
        className={`absolute bottom-0 left-1/2 h-1 w-16 -translate-x-1/2 rounded-t-full transition-all duration-300 ${
          isActive ? `opacity-100 bg-gradient-to-r ${item.accent}` : "opacity-0"
        }`}
      />
    </button>
  );
};

const FeaturedFilterChip = ({ label, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative shrink-0 snap-start whitespace-nowrap rounded-full border border-white/15 bg-white/10 px-5 py-2.5 text-xs font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:border-white/25 hover:bg-white/15"
    >
      {label}
    </button>
  );
};

const SpecScoreBadge = ({ score }) => {
  const value = Number.isFinite(Number(score)) ? Number(score) : null;
  const label = value != null ? `${value.toFixed(1)}%` : "--";

  return (
    <div
      className="inline-flex flex-col items-center justify-center rounded-md border border-blue-200 bg-blue-50/95 px-1.5 py-1 leading-none"
      aria-label={
        value != null
          ? `Spec score ${value.toFixed(1)} percent`
          : "Spec score unavailable"
      }
    >
      <span className="text-[10px] font-bold text-blue-700">{label}</span>
      <span className="mt-0.5 text-[8px] font-semibold uppercase tracking-wide text-blue-600">
        Spec
      </span>
    </div>
  );
};

const FeaturedPhoneCard = ({ phone, index, isLoaded, onClick }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const brandLabel = phone.brandName || phone.brand || "Smartphone";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Open ${phone.name}`}
      className={`group relative flex min-w-[160px] sm:min-w-[180px] md:min-w-[200px] shrink-0 flex-col gap-2.5 rounded-2xl sm:rounded-3xl p-4 sm:p-5 text-left text-white backdrop-blur-lg transition-all duration-300 ${
        isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
      style={{ transitionDelay: `${index * 60}ms` }}
    >
      <div className="flex h-32 w-full sm:h-40 lg:h-44 items-center justify-center overflow-hidden rounded-xl sm:rounded-2xl border border-sky-300/20 bg-blue-950/40">
        {phone.image && !imageFailed ? (
          <img
            src={phone.image}
            alt={phone.name}
            className="h-full w-full object-contain p-2 transition-transform duration-300 group-hover:scale-110 sm:p-3"
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <span className="text-base sm:text-lg font-bold tracking-wide text-slate-500">
            {phone.short}
          </span>
        )}
      </div>

      <div className="flex-1">
        <p className="text-xs sm:text-sm font-bold leading-snug text-white">
          {phone.name}
        </p>
        <p className="mt-0.5 text-[10px] sm:text-xs font-medium text-sky-200/70">
          {brandLabel}
        </p>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-sky-300/20 pt-2.5 sm:pt-3">
        <span className="text-[10px] sm:text-xs font-semibold text-sky-200">
          View Details
        </span>
        <span className="transition-transform duration-300 group-hover:translate-x-1">
          <FaArrowRight className="h-2.5 w-2.5 sm:h-3 sm:w-3.5 text-sky-200" />
        </span>
      </div>
    </button>
  );
};

const FeaturedPhoneSkeleton = ({ index, isLoaded }) => {
  return (
    <div
      className={`flex min-w-[160px] sm:min-w-[180px] md:min-w-[200px] shrink-0 snap-start flex-col gap-2.5 rounded-2xl sm:rounded-3xl p-4 sm:p-5 text-slate-100 backdrop-blur-lg transition-all duration-300 ${
        isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      } animate-pulse`}
      style={{ transitionDelay: `${index * 60}ms` }}
    >
      <span className="flex h-32 w-full items-center justify-center overflow-hidden rounded-xl border border-sky-300/20 bg-blue-950/40 sm:h-40 lg:h-44 sm:rounded-2xl">
        <span className="h-12 w-12 rounded bg-white/10" />
      </span>

      <span className="flex-1">
        <span className="block h-3 w-4/5 rounded bg-white/15" />
        <span className="mt-2 block h-2 w-16 rounded bg-white/10" />
      </span>

      <span className="flex items-center justify-between gap-2 border-t border-sky-300/20 pt-2.5 sm:pt-3">
        <span className="block h-2.5 w-20 rounded bg-white/15" />
        <span className="block h-3 w-3 rounded-full bg-white/15 sm:h-3.5 sm:w-3.5" />
      </span>
    </div>
  );
};

const FeaturedProduct = () => {
  const navigate = useNavigate();
  const [activeBudget, setActiveBudget] = useState(null);
  const [hoveredBudget, setHoveredBudget] = useState(null);
  const [featuredPhones, setFeaturedPhones] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [featuredError, setFeaturedError] = useState("");
  const isLoaded = useRevealAnimation();

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const fetchFeaturedPhones = async () => {
      setLoadingFeatured(true);
      setFeaturedError("");
      setFeaturedPhones([]);

      try {
        const response = await fetch(
          `${API_BASE}/api/public/trending/smartphones?limit=${FEATURED_FETCH_LIMIT}`,
          {
            cache: "no-store",
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const payload = await response.json();
        if (cancelled) return;

        const normalized = getTrendingRows(payload)
          .map((row, index) => {
            const name = getRowName(row);
            if (!name) return null;

            const brand = getRowBrand(row);
            const id =
              row?.product_id ??
              row?.productId ??
              row?.id ??
              row?.basic_info?.id ??
              null;
            const launchTs = parseDateTs(
              firstText(
                row?.launch_date,
                row?.launchDate,
                row?.created_at,
                row?.createdAt,
                row?.release_date,
                row?.releaseDate,
              ),
            );

            return {
              id,
              name,
              brand,
              image: getRowImage(row),
              price: getRowPrice(row),
              note: buildFeaturedNote(row),
              short: getShortLabel(name, brand),
              score: getRowScore(row),
              trendVelocity: pickNumber(
                row?.trend_velocity,
                row?.trendVelocity,
              ),
              freshness: pickNumber(row?.freshness),
              launchTs,
              _rowIndex: index,
            };
          })
          .filter(Boolean);

        const deduped = [];
        const seen = new Set();
        for (const item of normalized) {
          const key =
            item.id != null
              ? `id:${String(item.id)}`
              : `name:${String(item.name || "").toLowerCase()}`;
          if (seen.has(key)) continue;
          seen.add(key);
          deduped.push(item);
        }

        deduped.sort((a, b) => {
          const scoreA = a.score ?? -1;
          const scoreB = b.score ?? -1;
          if (scoreB !== scoreA) return scoreB - scoreA;

          const trendA = a.trendVelocity ?? -1;
          const trendB = b.trendVelocity ?? -1;
          if (trendB !== trendA) return trendB - trendA;

          const freshnessA = a.freshness ?? -1;
          const freshnessB = b.freshness ?? -1;
          if (freshnessB !== freshnessA) return freshnessB - freshnessA;

          const launchA = a.launchTs ?? -1;
          const launchB = b.launchTs ?? -1;
          if (launchB !== launchA) return launchB - launchA;

          return a._rowIndex - b._rowIndex;
        });

        const next = deduped.slice(0, FEATURED_PHONES_LIMIT).map((item) => ({
          ...item,
          path: getDevicePath(item),
        }));

        if (!cancelled) {
          setFeaturedPhones(next);
        }
      } catch (error) {
        if (error?.name === "AbortError") return;
        console.error("Failed to load featured picks:", error);
        if (!cancelled) {
          setFeaturedError("Live featured picks are unavailable right now.");
          setFeaturedPhones([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingFeatured(false);
        }
      }
    };

    fetchFeaturedPhones();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  const displayPhones = useMemo(
    () => featuredPhones.slice(0, FEATURED_PHONES_LIMIT),
    [featuredPhones],
  );

  const handleBudgetClick = (item) => {
    setActiveBudget(item.value);
    navigate(`/smartphones/filter/${item.slug}`);
  };

  const handleFilterClick = (feature) => {
    navigate(buildSmartphoneFeaturePath(feature));
  };

  return (
    <section
      className={`relative overflow-hidden border-t border-sky-900/60 bg-gradient-to-b from-[#030b19] via-[#0a2f6d] to-[#030b19] transition-all duration-700 ${
        isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(186,230,253,0.28),_transparent_30%),radial-gradient(circle_at_75%_18%,_rgba(56,189,248,0.22),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(34,211,238,0.18),_transparent_28%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(186,230,253,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(186,230,253,0.07)_1px,transparent_1px)] [background-size:34px_34px] [mask-image:radial-gradient(circle_at_center,white,transparent_88%)]" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-sky-950/20 to-transparent" />
      <div className="relative mx-auto max-w-7xl px-3 sm:px-4 pb-12 sm:pb-16 md:pb-20 lg:pb-24 pt-8 sm:pt-12 md:pt-16 lg:pt-24">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-[11px] font-bold uppercase tracking-[0.32em] text-sky-600 sm:text-xs">
            Featured Phones By Budget
          </h1>

          <p className={HOME_SECTION_LEAD_DARK}>
            Curated phones across all price ranges, with trending features to
            help you find exactly what you need.
          </p>
        </div>

        {/* Mobile: Horizontal Scroll, Desktop: Grid */}
        <div className="mx-auto mt-8 sm:mt-14 max-w-5xl">
          {/* Mobile Horizontal Scroll */}
          <div className="lg:hidden">
            <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
              {budgetRanges.map((item, index) => (
                <div
                  key={item.slug}
                  className="w-[84vw] max-w-[20rem] flex-shrink-0"
                >
                  <BudgetCard
                    item={item}
                    index={index}
                    isActive={activeBudget === item.value}
                    isHovered={hoveredBudget === item.value}
                    isLoaded={isLoaded}
                    onClick={() => handleBudgetClick(item)}
                    onMouseEnter={() => setHoveredBudget(item.value)}
                    onMouseLeave={() => setHoveredBudget(null)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Desktop Grid (3 columns) */}
          <div className="hidden lg:grid gap-4 grid-cols-3">
            {budgetRanges.map((item, index) => (
              <BudgetCard
                key={item.slug}
                item={item}
                index={index}
                isActive={activeBudget === item.value}
                isHovered={hoveredBudget === item.value}
                isLoaded={isLoaded}
                onClick={() => handleBudgetClick(item)}
                onMouseEnter={() => setHoveredBudget(item.value)}
                onMouseLeave={() => setHoveredBudget(null)}
              />
            ))}
          </div>
        </div>

        <div className="no-scrollbar mt-6 flex w-full items-center justify-start gap-2 overflow-x-auto px-1 pb-2 snap-x snap-mandatory sm:mt-10 sm:justify-center sm:px-0">
          <span className="inline-flex items-center gap-2 whitespace-nowrap text-xs font-bold uppercase tracking-[0.3em] text-white/90">
            <FaChartLine className="h-3.5 w-3.5 text-cyan-300" />
            Trending
          </span>

          {quickFilters.map((filter) => (
            <FeaturedFilterChip
              key={filter.feature}
              label={filter.label}
              onClick={() => handleFilterClick(filter.feature)}
            />
          ))}
        </div>

        <div className="mt-10 sm:mt-16">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-yellow-200/50 to-transparent" />
            <span className="inline-flex items-center gap-2 whitespace-nowrap text-xs font-bold uppercase tracking-[0.2em] text-white/90 sm:text-sm sm:tracking-[0.3em]">
              Featured Picks on Hooks
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-yellow-200/50 to-transparent" />
          </div>

          <p className="mt-4 text-center text-[11px] font-medium text-white/60 sm:text-xs">
            Live standout devices picked from recent trend activity.
          </p>

          <div className="no-scrollbar mt-8 flex items-center gap-3 overflow-x-auto pb-2 sm:gap-4 md:gap-5">
            {loadingFeatured
              ? Array.from({ length: FEATURED_PHONES_LIMIT }).map(
                  (_, index) => (
                    <FeaturedPhoneSkeleton
                      key={`featured-skeleton-${index}`}
                      index={index}
                      isLoaded={isLoaded}
                    />
                  ),
                )
              : displayPhones.map((phone, index) => (
                  <FeaturedPhoneCard
                    key={`${phone.id || phone.name}-${index}`}
                    phone={phone}
                    index={index}
                    isLoaded={isLoaded}
                    onClick={() => navigate(phone.path || "/smartphones")}
                  />
                ))}
          </div>

          {!loadingFeatured && displayPhones.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-5 text-center text-sm text-slate-300 backdrop-blur-sm">
              {featuredError ||
                "Live featured picks are unavailable right now."}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
};

export default FeaturedProduct;
