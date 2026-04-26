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
import { buildSmartphoneFeaturePath } from "../../utils/smartphoneListingRoutes";

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
      className={`group relative w-full overflow-hidden bg-white rounded-lg transition-all duration-500 ${
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

      <div className="relative z-10 flex items-center gap-3 px-2 py-3 sm:p-5">
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
      className="group relative shrink-0 snap-start whitespace-nowrap rounded-full border border-white/25 bg-white/8 px-5 py-2.5 text-xs font-semibold text-white/95 backdrop-blur-md transition-all duration-300 hover:border-white/40 hover:bg-white/15 hover:shadow-lg"
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
  const priceLabel =
    phone.price !== null && phone.price !== undefined
      ? formatCurrency(phone.price)
      : "";
  const scoreLabel =
    phone.score !== null && phone.score !== undefined
      ? `Spec score ${Number(phone.score).toFixed(1)}`
      : "Live pick";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Open ${phone.name}`}
      className={`group flex w-full shrink-0 snap-start flex-col gap-4 rounded-3xl border border-white/30 bg-gradient-to-br from-white/15 to-white/8 backdrop-blur-2xl p-5 text-left text-white/95 shadow-2xl transition-all duration-300 hover:border-white/50 hover:from-white/20 hover:to-white/12 hover:shadow-3xl sm:flex-row sm:items-center sm:gap-5 sm:p-6 ${
        isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
      style={{ transitionDelay: `${index * 60}ms` }}
    >
      <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/30 bg-gradient-to-br from-white/10 to-white/5 ring-1 ring-white/30 backdrop-blur-md sm:h-24 sm:w-24">
        {phone.image && !imageFailed ? (
          <img
            src={phone.image}
            alt={phone.name}
            className="h-full w-full object-contain p-3 transition-transform duration-300 group-hover:scale-110 sm:p-2"
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <FaMobileAlt className="text-4xl text-white/40 sm:text-2xl" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        {phone.brand ? (
          <p className="truncate text-[11px] font-bold uppercase tracking-[0.28em] text-cyan-200">
            {phone.brand}
          </p>
        ) : null}

        <h6 className="mt-1 line-clamp-2 text-lg font-bold leading-snug text-white transition-colors duration-200 group-hover:text-cyan-50 sm:text-base">
          {phone.name}
        </h6>

        <p className="mt-2 line-clamp-2 text-xs leading-snug text-white/70 sm:text-xs">
          {phone.note}
        </p>
      </div>

      <div className="flex w-full items-center justify-between gap-3 border-t border-white/15 pt-3 sm:border-0 sm:border-l sm:border-l-white/15 sm:pl-3 sm:pt-0">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/60">
            {priceLabel ? "Price" : "Score"}
          </p>
          <p className="mt-1 truncate text-base font-black text-white sm:text-sm">
            {priceLabel || scoreLabel}
          </p>
        </div>

        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-white/20 to-white/10 text-white/90 transition-all duration-300 group-hover:from-white/30 group-hover:to-white/15 group-hover:translate-x-1 sm:h-9 sm:w-9">
          <FaArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </button>
  );
};

const FeaturedPhoneSkeleton = ({ index, isLoaded }) => {
  return (
    <div
      className={`flex w-full shrink-0 snap-start flex-col gap-4 rounded-3xl border border-white/30 bg-gradient-to-br from-white/15 to-white/8 p-5 text-white/95 backdrop-blur-2xl transition-all duration-300 sm:flex-row sm:items-center sm:gap-5 sm:p-6 ${
        isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      } animate-pulse`}
      style={{ transitionDelay: `${index * 60}ms` }}
    >
      <span className="flex h-28 w-28 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/12 ring-1 ring-white/30 sm:h-24 sm:w-24">
        <span className="h-12 w-12 rounded bg-white/20 sm:h-10 sm:w-10" />
      </span>

      <span className="min-w-0 flex-1 space-y-3">
        <span className="block h-2 w-16 rounded bg-white/20" />
        <span className="block h-3.5 w-4/5 rounded bg-white/20" />
        <span className="block h-2 w-full rounded bg-white/10" />
        <span className="block h-2 w-3/4 rounded bg-white/10" />
        <span className="mt-4 block h-px w-full bg-white/15" />
        <span className="block h-2.5 w-24 rounded bg-white/20" />
      </span>

      <span className="h-10 w-10 rounded-full bg-white/15 sm:h-9 sm:w-9" />
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
      className={`relative isolate overflow-hidden bg-gradient-to-br from-slate-950 via-blue-900 to-indigo-950 transition-all duration-700 ${
        isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
    >
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-30px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-float-slow {
          animation: float-slow 4s ease-in-out infinite;
        }
      `}</style>

      {/* Animated gradient orbs */}
      <div className="absolute inset-0 opacity-50 [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:72px_72px]" />
      <div className="absolute -top-40 -left-32 h-96 w-96 rounded-full bg-gradient-to-br from-cyan-500/30 to-blue-500/20 blur-3xl animate-pulse" />
      <div
        className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-gradient-to-tl from-purple-600/25 to-pink-500/15 blur-3xl animate-pulse"
        style={{ animationDelay: "1s" }}
      />
      <div
        className="absolute top-1/2 left-1/3 h-72 w-72 rounded-full bg-gradient-to-r from-indigo-600/20 to-transparent blur-3xl animate-pulse"
        style={{ animationDelay: "2s" }}
      />

      {/* Animated accent circles */}
      <div
        className="absolute top-20 right-1/4 h-48 w-48 rounded-full border border-cyan-400/20 blur-sm animate-pulse"
        style={{ animationDelay: "1.5s" }}
      />
      <div
        className="absolute bottom-1/3 left-1/4 h-64 w-64 rounded-full border border-purple-400/15 blur-sm animate-pulse"
        style={{ animationDelay: "0.5s" }}
      />

      {/* Floating dots */}
      <div className="absolute top-1/4 left-10 h-3 w-3 rounded-full bg-cyan-400/60 blur-sm animate-float" />
      <div
        className="absolute top-1/3 right-1/3 h-2 w-2 rounded-full bg-blue-400/50 blur-sm animate-float"
        style={{ animationDelay: "0.5s" }}
      />
      <div className="absolute bottom-1/4 right-1/4 h-3 w-3 rounded-full bg-purple-400/50 blur-sm animate-float-slow" />

      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-3 sm:px-4 pb-12 sm:pb-16 md:pb-20 lg:pb-24 pt-8 sm:pt-12 md:pt-16 lg:pt-24">
        <div className="mx-auto max-w-5xl text-center">
          <h1 className="mt-6 sm:mt-8 text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-black leading-tight text-white">
            <span className="block">Discover Featured Phones by</span>
            <span className="bg-gradient-to-r from-cyan-200 via-white to-sky-100 bg-clip-text text-transparent animate-pulse">
              Budget
            </span>
          </h1>

          <p className="mx-auto mt-4 sm:mt-6 max-w-2xl text-sm sm:text-lg lg:text-xl leading-6 sm:leading-8 text-white/85 font-medium">
            Use the budget lanes below to jump into curated phones, then tap the
            trending feature filters to narrow things down even faster.
          </p>
        </div>

        {/* Mobile: Horizontal Scroll, Desktop: Grid */}
        <div className="mx-auto mt-8 sm:mt-14 max-w-5xl">
          {/* Mobile Horizontal Scroll */}
          <div className="lg:hidden">
            <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
              {budgetRanges.map((item, index) => (
                <div key={item.slug} className="flex-shrink-0 w-80">
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
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            <span className="inline-flex items-center gap-2 whitespace-nowrap text-xs font-bold uppercase tracking-[0.2em] text-white/90 sm:text-sm sm:tracking-[0.3em]">
              <FaFire className="h-3.5 w-3.5 text-cyan-300" />
              Featured Picks on Hooks
            </span>
            <span className="hidden rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-200 backdrop-blur-md sm:inline-flex">
              Live feed
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          </div>

          <div className="no-scrollbar mt-10 grid grid-flow-col auto-cols-[88%] gap-3 overflow-x-auto pb-2 snap-x snap-mandatory sm:grid-flow-row sm:auto-cols-auto sm:overflow-visible sm:pb-0 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
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
            <div className="mt-6 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md px-4 py-5 text-center text-sm text-white/80">
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
