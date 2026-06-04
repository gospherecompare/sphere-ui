// src/components/Home/FeaturedProduct.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowRight, FaFire, FaMobileAlt, FaRupeeSign } from "react-icons/fa";
import useRevealAnimation from "../../hooks/useRevealAnimation";
import { createProductPath } from "../../utils/slugGenerator";
import { buildPublicSmartphoneFeaturePath as buildSmartphoneFeaturePath } from "../../utils/smartphoneListingRoutes";
import "../../styles/hideScrollbar.css";

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL || "https://api.apisphere.in"
).replace(/\/$/, "");
const FEATURED_PHONES_LIMIT = 6;
const FEATURED_FETCH_LIMIT = 25;
const RUPEE = "\u20B9";

const budgetRanges = [
  {
    label: "Under Rs. 10,000",
    value: 10000,
    slug: "under-10000",
    accent: "from-cyan-300 via-sky-500 to-blue-600",
  },
  {
    label: "Under Rs. 15,000",
    value: 15000,
    slug: "under-15000",
    accent: "from-sky-400 via-blue-500 to-indigo-600",
  },
  {
    label: "Under Rs. 20,000",
    value: 20000,
    slug: "under-20000",
    accent: "from-blue-400 via-violet-500 to-fuchsia-500",
  },
  {
    label: "Under Rs. 25,000",
    value: 25000,
    slug: "under-25000",
    accent: "from-indigo-400 via-purple-500 to-fuchsia-500",
  },
  {
    label: "Under Rs. 30,000",
    value: 30000,
    slug: "under-30000",
    accent: "from-cyan-400 via-blue-500 to-purple-500",
  },
  {
    label: "Under Rs. 40,000",
    value: 40000,
    slug: "under-40000",
    accent: "from-blue-400 via-indigo-500 to-purple-600",
  },
  {
    label: "Under Rs. 50,000",
    value: 50000,
    slug: "under-50000",
    accent: "from-fuchsia-400 via-violet-500 to-blue-500",
  },
  {
    label: "Under Rs. 60,000",
    value: 60000,
    slug: "under-60000",
    accent: "from-cyan-300 via-indigo-500 to-fuchsia-500",
  },
  {
    label: "Under Rs. 70,000",
    value: 70000,
    slug: "under-70000",
    accent: "from-sky-300 via-blue-600 to-purple-600",
  },
  {
    label: "Under Rs. 80,000",
    value: 80000,
    slug: "under-80000",
    accent: "from-cyan-300 via-violet-500 to-fuchsia-600",
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

const formatBudgetShort = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "";
  if (amount >= 100000) return `${RUPEE}${Math.round(amount / 100000)}L`;
  return `${RUPEE}${Math.round(amount / 1000)}k`;
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
      className={`group relative w-full overflow-hidden rounded-md border text-left transition-all duration-500 ${
        isActive
          ? "border-cyan-200/45 bg-white/[0.085] shadow-[0_18px_46px_rgba(14,165,233,0.18)]"
          : "border-white/10 bg-white/[0.045] hover:border-cyan-200/28 hover:bg-white/[0.075]"
      } ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
      style={{ transitionDelay: `${index * 45}ms` }}
    >
      <div className="absolute inset-y-3 left-0 w-1 rounded-r-full bg-gradient-to-b from-cyan-300 via-blue-400 to-fuchsia-400 opacity-0 transition group-hover:opacity-80" />
      <div
        className={`absolute inset-0 bg-gradient-to-r ${item.accent} transition-opacity duration-300 ${
          isActive
            ? "opacity-[0.12]"
            : isHovered
              ? "opacity-[0.08]"
              : "opacity-0"
        }`}
      />

      <div className="relative z-10 flex items-center gap-2.5 px-3 py-3 sm:gap-3 sm:px-4 sm:py-3.5">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ring-1 transition-all duration-300 sm:h-11 sm:w-11 ${
            isActive
              ? `bg-gradient-to-br ${item.accent} text-white ring-white/20 shadow-lg shadow-cyan-500/20`
              : "bg-white/[0.065] text-cyan-100/62 ring-white/10 group-hover:bg-white/[0.1] group-hover:text-white"
          }`}
        >
          <FaRupeeSign className="h-4 w-4" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-[9px] font-black uppercase tracking-[0.14em] text-cyan-100/46 sm:tracking-[0.18em]">
            Price Range
          </span>
          <span className="mt-1 block whitespace-nowrap text-[13px] font-black text-white sm:text-[15px] xl:text-base">
            {item.label}
          </span>
        </span>

        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/[0.055] text-cyan-100/44 transition duration-300 group-hover:bg-cyan-300/14 group-hover:text-white">
          <FaArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-0.5" />
        </span>
      </div>

      <div
        className={`absolute inset-x-4 bottom-0 h-0.5 rounded-t-full transition-all duration-300 ${
          isActive
            ? `opacity-100 bg-gradient-to-r ${item.accent}`
            : "opacity-0 group-hover:opacity-70"
        }`}
      />
    </button>
  );
};

const BudgetMobileTile = ({ item, index, isActive, isLoaded, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      className={`group relative min-w-0 overflow-hidden rounded-md border text-left transition-all duration-500 ${
        isActive
          ? "border-cyan-200/45 bg-white/[0.085] shadow-[0_14px_34px_rgba(14,165,233,0.16)]"
          : "border-white/10 bg-white/[0.045] hover:border-cyan-200/26 hover:bg-white/[0.075]"
      } ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
      style={{ transitionDelay: `${index * 35}ms` }}
    >
      <span
        className={`absolute inset-0 bg-gradient-to-br ${item.accent} opacity-0 transition-opacity duration-300 ${
          isActive ? "opacity-[0.12]" : "group-hover:opacity-[0.08]"
        }`}
      />
      <span className="relative z-10 flex min-h-[74px] items-center gap-2.5 px-2.5 py-3">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ring-1 ${
            isActive
              ? `bg-gradient-to-br ${item.accent} text-white ring-white/20`
              : "bg-white/[0.065] text-cyan-100/64 ring-white/10"
          }`}
        >
          <FaRupeeSign className="h-3.5 w-3.5" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-[9px] font-black uppercase tracking-[0.16em] text-cyan-100/46">
            Under
          </span>
          <span className="mt-1 block text-base font-black leading-none text-white">
            {formatBudgetShort(item.value)}
          </span>
        </span>

        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/[0.06] text-cyan-100/46 transition group-hover:bg-cyan-300/14 group-hover:text-white">
          <FaArrowRight className="h-3 w-3" />
        </span>
      </span>
    </button>
  );
};

const FeaturedFilterChip = ({ label, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative shrink-0 snap-start overflow-hidden whitespace-nowrap rounded-md border border-cyan-200/16 bg-white/[0.055] px-4 py-2.5 text-[11px] font-bold text-cyan-50/86 transition-all duration-300 hover:border-fuchsia-200/30 hover:bg-white/[0.08] hover:text-white sm:px-5 sm:text-xs"
    >
      <span className="absolute inset-0 bg-gradient-to-r from-cyan-400/0 via-blue-500/10 to-fuchsia-500/0 opacity-0 transition group-hover:opacity-100" />
      <span className="relative">{label}</span>
    </button>
  );
};

const SpecScoreBadge = ({ score }) => {
  const value = Number.isFinite(Number(score)) ? Number(score) : null;
  const label = value != null ? `${value.toFixed(1)}%` : "--";

  return (
    <div
      className="inline-flex flex-col items-center justify-center rounded-md border border-cyan-200/18 bg-cyan-300/10 px-2 py-1 leading-none"
      aria-label={
        value != null
          ? `Spec score ${value.toFixed(1)} percent`
          : "Spec score unavailable"
      }
    >
      <span className="text-[10px] font-black text-cyan-50">{label}</span>
      <span className="mt-0.5 text-[8px] font-bold uppercase tracking-wide text-cyan-100/64">
        Spec
      </span>
    </div>
  );
};

const FeaturedPhoneCard = ({ phone, index, isLoaded, onClick }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const brandLabel = phone.brandName || phone.brand || "Smartphone";
  const priceLabel = formatCurrency(phone.price);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Open ${phone.name}`}
      className={`group relative flex min-w-[19rem] shrink-0 snap-start items-center gap-2.5 overflow-hidden rounded-lg border border-cyan-200/14 bg-white/[0.055] p-3 text-left text-white shadow-[0_16px_42px_rgba(2,6,23,0.14)] transition-all duration-300 hover:-translate-y-1 hover:border-cyan-200/28 hover:bg-white/[0.075] sm:min-w-[21rem] sm:gap-3 sm:p-3.5 lg:min-w-0 lg:shrink ${
        isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
      style={{ transitionDelay: `${index * 60}ms` }}
    >
      <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_22%_12%,rgba(56,189,248,0.16),transparent_32%),radial-gradient(circle_at_86%_28%,rgba(168,85,247,0.18),transparent_36%)] opacity-90" />
      <span className="pointer-events-none absolute -right-5 top-8 text-8xl font-black leading-none text-white/[0.035] transition-transform duration-300 group-hover:scale-110">
        {String(index + 1).padStart(2, "0")}
      </span>
      <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-visible rounded-md border border-transparent bg-transparent sm:h-28 sm:w-28">
        <span className="absolute bottom-2 h-9 w-16 rounded-full bg-cyan-200/14 blur-xl" />
        <span className="absolute h-16 w-16 rounded-full bg-gradient-to-br from-cyan-300/12 to-fuchsia-400/12 blur-xl sm:h-20 sm:w-20" />
        {phone.image && !imageFailed ? (
          <img
            src={phone.image}
            alt={phone.name}
            className="relative h-full w-full object-contain p-1 drop-shadow-[0_18px_26px_rgba(2,6,23,0.38)] transition-transform duration-300 group-hover:scale-110"
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <span className="text-base font-black tracking-wide text-cyan-100/48 sm:text-lg">
            {phone.short}
          </span>
        )}
      </div>

      <div className="relative min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <span className="inline-flex rounded-md bg-white/[0.06] px-2 py-1 text-[10px] font-black uppercase text-cyan-100/72 ring-1 ring-white/10">
            Pick {String(index + 1).padStart(2, "0")}
          </span>
          <SpecScoreBadge score={phone.score} />
        </div>
        <p className="mt-2 line-clamp-1 text-[13px] font-black leading-5 text-white sm:text-[15px]">
          {phone.name}
        </p>
        <p className="mt-1 text-xs font-semibold text-cyan-100/60">
          {brandLabel}
        </p>
        <p className="mt-1 line-clamp-1 text-[10px] font-medium leading-4 text-cyan-100/58 sm:text-[11px]">
          {phone.note}
        </p>
        <span className="mt-3 flex items-center justify-between gap-2 border-t border-white/10 pt-2">
          <span className="text-sm font-black text-white">
            {priceLabel || "View price"}
          </span>
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-cyan-400/80 to-fuchsia-500/80 text-white transition-transform duration-300 group-hover:translate-x-1">
            <FaArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-0.5" />
          </span>
        </span>
      </div>
    </button>
  );
};

const FeaturedPhoneSkeleton = ({ index, isLoaded }) => {
  return (
    <div
      className={`flex min-w-[19rem] shrink-0 snap-start items-center gap-2.5 rounded-lg border border-cyan-200/12 bg-white/[0.055] p-3 text-cyan-50 transition-all duration-300 sm:min-w-[21rem] sm:gap-3 sm:p-3.5 lg:min-w-0 lg:shrink ${
        isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      } animate-pulse`}
      style={{ transitionDelay: `${index * 60}ms` }}
    >
      <span className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md border border-white/10 bg-white/[0.045] sm:h-28 sm:w-28">
        <span className="h-10 w-10 rounded bg-white/10" />
      </span>

      <span className="flex-1">
        <span className="block h-3 w-4/5 rounded bg-white/15" />
        <span className="mt-2 block h-2 w-16 rounded bg-white/10" />
        <span className="mt-3 block h-2 w-full rounded bg-white/10" />
        <span className="mt-3 block h-2.5 w-20 rounded bg-white/15" />
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
      className={`relative overflow-hidden bg-[#050712] text-white transition-all duration-700 ${
        isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
    >
      <svg
        className="pointer-events-none absolute inset-0 hidden h-full w-full opacity-70 sm:block"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <path
          d="M-36 194H222c94 0 102-116 192-116h252c100 0 98 150 208 150h606"
          fill="none"
          stroke="rgba(125,211,252,0.18)"
          strokeWidth="3"
        />
        <path
          d="M910 150h214c84 0 86 104 166 104h194"
          fill="none"
          stroke="rgba(216,180,254,0.16)"
          strokeWidth="3"
        />
        <path
          d="M-18 700h244c88 0 104-144 196-144h324c104 0 114 160 224 160h490"
          fill="none"
          stroke="rgba(56,189,248,0.14)"
          strokeWidth="3"
        />
        <rect
          x="1018"
          y="322"
          width="218"
          height="118"
          rx="28"
          fill="none"
          stroke="rgba(125,211,252,0.13)"
          strokeWidth="3"
        />
        <rect
          x="170"
          y="540"
          width="184"
          height="104"
          rx="28"
          fill="none"
          stroke="rgba(216,180,254,0.12)"
          strokeWidth="3"
        />
      </svg>
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-65 sm:hidden"
        viewBox="0 0 390 1180"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <path
          d="M-34 102H108c60 0 58 82 116 82h202"
          fill="none"
          stroke="rgba(125,211,252,0.18)"
          strokeWidth="2"
        />
        <path
          d="M52 420h108c45 0 44 68 90 68h176"
          fill="none"
          stroke="rgba(216,180,254,0.15)"
          strokeWidth="2"
        />
        <path
          d="M-20 760h120c52 0 52-76 104-76h214"
          fill="none"
          stroke="rgba(56,189,248,0.12)"
          strokeWidth="2"
        />
        <rect
          x="286"
          y="316"
          width="78"
          height="112"
          rx="20"
          fill="none"
          stroke="rgba(125,211,252,0.13)"
          strokeWidth="2"
        />
        <rect
          x="24"
          y="614"
          width="92"
          height="142"
          rx="22"
          fill="none"
          stroke="rgba(216,180,254,0.12)"
          strokeWidth="2"
        />
        <circle cx="108" cy="102" r="4" fill="rgba(103,232,249,0.55)" />
        <circle cx="250" cy="488" r="4" fill="rgba(216,180,254,0.5)" />
      </svg>
      <div className="pointer-events-none absolute left-[-7rem] top-12 hidden h-80 w-80 rounded-full border border-cyan-300/12 sm:block" />
      <div className="pointer-events-none absolute right-[-8rem] bottom-8 hidden h-80 w-80 rounded-full border border-fuchsia-300/14 sm:block" />
      <div className="pointer-events-none absolute inset-x-0 top-1/2 hidden h-px bg-gradient-to-r from-transparent via-cyan-300/18 to-transparent sm:block" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-[#050712]/32 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#050712]/32 to-transparent" />
      <div className="relative mx-auto max-w-7xl px-4 pb-8 pt-10 sm:px-6 sm:pb-12 sm:pt-16 lg:px-8 lg:pb-14 lg:pt-20">
        <div className="grid items-start gap-6 sm:gap-8 lg:grid-cols-[minmax(0,0.82fr)_minmax(520px,1.18fr)] lg:gap-10 xl:grid-cols-[minmax(0,0.82fr)_minmax(640px,1.18fr)]">
          <div className="relative min-w-0 max-w-4xl lg:pt-4">
            <p className="inline-flex max-w-full items-center gap-2 rounded-md border border-cyan-200/20 bg-cyan-300/10 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.08em] text-cyan-100 shadow-[0_0_32px_rgba(14,165,233,0.16)] backdrop-blur sm:text-[11px]">
              <FaMobileAlt className="h-3 w-3 text-sky-300" />
              Featured Phones By Budget
            </p>

            <h2 className="mt-5 max-w-3xl text-[2.15rem] font-black leading-[1.03] text-white sm:mt-6 sm:text-5xl sm:leading-[1.02] lg:text-6xl">
              Featured phones
              <span className="block bg-gradient-to-r from-sky-200 via-white to-fuchsia-200 bg-clip-text text-transparent">
                across every budget.
              </span>
            </h2>

            <p className="mt-4 max-w-2xl text-sm font-medium leading-6 text-cyan-50/76 sm:mt-5 sm:text-lg sm:leading-7">
              Start with a price range, then explore trend filters and live
              picks that match how people actually compare smartphones.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
              <button
                type="button"
                onClick={() => handleBudgetClick(budgetRanges[2])}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-gradient-to-r from-sky-400 via-blue-500 to-fuchsia-500 px-3 py-3 text-center text-xs font-black text-white shadow-[0_16px_36px_rgba(59,130,246,0.34)] transition hover:brightness-110 sm:px-5 sm:text-sm"
              >
                Browse under {RUPEE}20k
                <FaArrowRight className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => navigate("/trending/smartphones")}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-fuchsia-200/20 bg-purple-500/14 px-3 py-3 text-center text-xs font-bold text-white transition hover:border-purple-300/50 hover:bg-purple-400/18 sm:px-5 sm:text-sm"
              >
                See live picks
                <FaFire className="h-3.5 w-3.5 text-fuchsia-200" />
              </button>
            </div>
          </div>

          {/* Mobile: Horizontal Scroll, Desktop: Grid */}
          <div className="relative mt-2 min-w-0 overflow-hidden rounded-lg border border-cyan-200/14 bg-white/[0.055] p-3 shadow-[0_16px_42px_rgba(2,6,23,0.14)] sm:mt-10 sm:p-5 sm:shadow-[0_18px_48px_rgba(2,6,23,0.14)] lg:mt-0">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_22%_12%,rgba(56,189,248,0.14),transparent_32%),radial-gradient(circle_at_86%_24%,rgba(168,85,247,0.16),transparent_36%)] opacity-90" />
            <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/60 to-transparent" />
            <div className="relative z-10 mb-4 flex items-center justify-between gap-3 sm:mb-5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100/54 sm:tracking-[0.2em]">
                  Choose Price
                </p>
                <h3 className="mt-1 text-lg font-black text-white sm:text-xl">
                  Browse by budget
                </h3>
              </div>
              <span className="hidden rounded-md border border-white/10 bg-white/[0.055] px-3 py-2 text-xs font-bold text-cyan-50/72 sm:inline-flex">
                {budgetRanges.length} price ranges
              </span>
            </div>
            {/* Mobile compact grid, desktop wider cards */}
            <div className="relative z-10 grid grid-cols-2 gap-2 lg:hidden">
              {budgetRanges.map((item, index) => (
                <BudgetMobileTile
                  key={item.slug}
                  item={item}
                  index={index}
                  isActive={activeBudget === item.value}
                  isLoaded={isLoaded}
                  onClick={() => handleBudgetClick(item)}
                />
              ))}
            </div>

            {/* Desktop grid */}
            <div className="relative z-10 hidden grid-cols-2 gap-2.5 lg:grid">
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
        </div>

        <div className="relative mt-6 overflow-hidden rounded-lg border border-cyan-200/14 bg-white/[0.055] p-3 sm:mt-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_22%,rgba(56,189,248,0.08),transparent_28%),radial-gradient(circle_at_84%_36%,rgba(168,85,247,0.1),transparent_34%)]" />
          <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <span className="inline-flex w-fit items-center gap-2 whitespace-nowrap rounded-md border border-white/10 bg-white/[0.045] px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-white/90 sm:text-xs sm:tracking-[0.2em]">
              <FaFire className="h-3.5 w-3.5 text-fuchsia-200" />
              Trending filters
            </span>

            <div className="flex flex-wrap gap-2">
              {quickFilters.map((filter) => (
                <FeaturedFilterChip
                  key={filter.feature}
                  label={filter.label}
                  onClick={() => handleFilterClick(filter.feature)}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="relative mt-6 overflow-hidden rounded-lg border border-cyan-200/18 bg-white/[0.055] p-3 shadow-[0_16px_42px_rgba(2,6,23,0.12)] sm:mt-8 sm:p-5 sm:shadow-[0_18px_48px_rgba(2,6,23,0.14)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_22%_12%,rgba(56,189,248,0.14),transparent_32%),radial-gradient(circle_at_86%_24%,rgba(168,85,247,0.16),transparent_36%)] opacity-90" />
          <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/60 to-transparent" />
          <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-100/54">
                Live Standouts
              </p>
              <h3 className="mt-2 text-xl font-black text-white sm:text-3xl">
                Featured Picks on Hooks
              </h3>
              <p className="mt-2 max-w-xl text-sm font-medium leading-6 text-blue-100/58">
                Live standout devices picked from recent trend activity.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/trending/smartphones")}
              className="inline-flex w-fit items-center gap-2 rounded-md border border-cyan-200/18 bg-cyan-300/10 px-4 py-2.5 text-xs font-bold text-cyan-50/82 transition hover:border-fuchsia-200/30 hover:bg-fuchsia-400/12 hover:text-white"
            >
              View all trends
              <FaArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className="relative z-10 no-scrollbar mt-5 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 pr-8 lg:grid lg:grid-cols-2 lg:overflow-visible lg:pb-0 lg:pr-0 xl:grid-cols-3">
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
            <div className="relative z-10 mt-6 rounded-lg border border-cyan-200/14 bg-white/[0.06] px-4 py-5 text-center text-sm font-semibold text-cyan-50/70">
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
