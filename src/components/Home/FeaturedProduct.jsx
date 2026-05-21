import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LuArrowRight,
  LuBadgeDollarSign,
  LuBatteryCharging,
  LuBookmark,
  LuCamera,
  LuChartNoAxesColumnIncreasing,
  LuCircleDollarSign,
  LuCoins,
  LuCpu,
  LuGamepad2,
  LuGitCompareArrows,
  LuInfo,
  LuRefreshCcw,
  LuShieldCheck,
  LuSmartphone,
  LuSparkles,
  LuWallet,
  LuZap,
} from "react-icons/lu";
import useRevealAnimation from "../../hooks/useRevealAnimation";
import { buildCanonicalComparePath } from "../../utils/compareRoutes";
import { readPreloadedApiResponse } from "../../utils/preloadedApi";
import { createProductPath } from "../../utils/slugGenerator";
import { buildPublicSmartphoneFeaturePath as buildSmartphoneFeaturePath } from "../../utils/smartphoneListingRoutes";

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL || "https://api.apisphere.in"
).replace(/\/$/, "");
const TRENDING_ENDPOINT = `${API_BASE}/api/public/trending/smartphones?limit=24`;
const MOST_COMPARED_ENDPOINT = `${API_BASE}/api/public/trending/most-compared`;
const RUPEE = "\u20B9";

const BUDGET_BUCKETS = [
  {
    label: `Under ${RUPEE}10,000`,
    slug: "under-10000",
    count: "25+ phones",
    icon: LuWallet,
  },
  {
    label: `Under ${RUPEE}15,000`,
    slug: "under-15000",
    count: "32+ phones",
    icon: LuBadgeDollarSign,
  },
  {
    label: `Under ${RUPEE}20,000`,
    slug: "under-20000",
    count: "41+ phones",
    icon: LuCircleDollarSign,
  },
  {
    label: `Under ${RUPEE}25,000`,
    slug: "under-25000",
    count: "38+ phones",
    icon: LuWallet,
  },
  {
    label: `Under ${RUPEE}30,000`,
    slug: "under-30000",
    count: "34+ phones",
    icon: LuCoins,
  },
  {
    label: `Under ${RUPEE}40,000`,
    slug: "under-40000",
    count: "28+ phones",
    icon: LuBadgeDollarSign,
  },
  {
    label: `Under ${RUPEE}50,000`,
    slug: "under-50000",
    count: "24+ phones",
    icon: LuCircleDollarSign,
  },
];

const SMART_FILTERS = [
  {
    label: "5G Phones",
    feature: "5g",
    icon: LuSmartphone,
    tone: "text-blue-500",
  },
  {
    label: "AMOLED",
    feature: "amoled",
    icon: LuSparkles,
    tone: "text-sky-500",
  },
  {
    label: "120Hz+",
    feature: "high-refresh-rate",
    icon: LuZap,
    tone: "text-blue-500",
  },
  {
    label: "Long Battery",
    feature: "long-battery",
    icon: LuBatteryCharging,
    tone: "text-blue-500",
  },
  {
    label: "Fast Charge",
    feature: "fast-charging",
    icon: LuCpu,
    tone: "text-rose-400",
  },
  {
    label: "Gaming",
    feature: "gaming",
    icon: LuGamepad2,
    tone: "text-blue-500",
  },
];

const FEATURED_BADGES = [
  {
    label: "Best Overall",
    tone: "bg-violet-100 text-violet-700 border-violet-200 shadow-[0_8px_20px_rgba(124,58,237,0.12)]",
    scoreTone:
      "border-violet-200 shadow-[inset_0_0_0_4px_rgba(124,58,237,0.10)]",
  },
  {
    label: "Best Value",
    tone: "bg-blue-100 text-blue-700 border-blue-200 shadow-[0_8px_20px_rgba(37,99,235,0.12)]",
    scoreTone: "border-blue-200 shadow-[inset_0_0_0_4px_rgba(59,130,246,0.10)]",
  },
  {
    label: "Top Rated",
    tone: "bg-amber-100 text-amber-700 border-amber-200 shadow-[0_8px_20px_rgba(245,158,11,0.12)]",
    scoreTone:
      "border-amber-200 shadow-[inset_0_0_0_4px_rgba(251,191,36,0.12)]",
  },
  {
    label: "Gaming Pick",
    tone: "bg-emerald-100 text-emerald-700 border-emerald-200 shadow-[0_8px_20px_rgba(16,185,129,0.12)]",
    scoreTone:
      "border-emerald-200 shadow-[inset_0_0_0_4px_rgba(52,211,153,0.12)]",
  },
  {
    label: "Battery King",
    tone: "bg-cyan-100 text-cyan-700 border-cyan-200 shadow-[0_8px_20px_rgba(6,182,212,0.12)]",
    scoreTone: "border-sky-200 shadow-[inset_0_0_0_4px_rgba(96,165,250,0.12)]",
  },
];

const TRUST_PILLARS = [
  {
    title: "Verified Specifications",
    description: "Accurate specs from trusted and official sources.",
    icon: LuShieldCheck,
  },
  {
    title: "Real Performance",
    description: "Benchmark results and real-world tests you can trust.",
    icon: LuChartNoAxesColumnIncreasing,
  },
  {
    title: "Smart Comparisons",
    description: "Side-by-side comparison to help you choose better.",
    icon: LuGitCompareArrows,
  },
  {
    title: "Always Updated",
    description: "Prices, scores and rankings refreshed daily.",
    icon: LuRefreshCcw,
  },
];

const FALLBACK_FEATURED_PRODUCTS = [
  {
    id: "iphone-16-pro-max",
    name: "iPhone 16 Pro Max",
    brand: "Apple",
    image: "",
    price: 144900,
    score: 92,
    display: '6.9"',
    camera: "48MP",
    processor: "A18 Pro",
    battery: "4685mAh",
    path: createProductPath("smartphones", "iPhone 16 Pro Max"),
  },
  {
    id: "oneplus-13",
    name: "OnePlus 13",
    brand: "OnePlus",
    image: "",
    price: 69999,
    score: 90,
    display: '6.82"',
    camera: "50MP",
    processor: "Snapdragon 8 Elite",
    battery: "6000mAh",
    path: createProductPath("smartphones", "OnePlus 13"),
  },
  {
    id: "nothing-phone-2a",
    name: "Nothing Phone (2a)",
    brand: "Nothing",
    image: "",
    price: 23999,
    score: 89,
    display: '6.7"',
    camera: "50MP",
    processor: "Dimensity 7200 Pro",
    battery: "5000mAh",
    path: createProductPath("smartphones", "Nothing Phone 2a"),
  },
  {
    id: "asus-rog-phone-8",
    name: "ASUS ROG Phone 8",
    brand: "ASUS",
    image: "",
    price: 94999,
    score: 89,
    display: '6.78"',
    camera: "50MP",
    processor: "Snapdragon 8 Gen 3",
    battery: "5500mAh",
    path: createProductPath("smartphones", "ASUS ROG Phone 8"),
  },
  {
    id: "iqoo-z9-5g",
    name: "iQOO Z9 5G",
    brand: "iQOO",
    image: "",
    price: 19999,
    score: 87,
    display: '6.67"',
    camera: "50MP",
    processor: "Dimensity 7200",
    battery: "5000mAh",
    path: createProductPath("smartphones", "iQOO Z9 5G"),
  },
];

const FALLBACK_MOST_COMPARED = [
  {
    left_id: "iphone-16-pro-max",
    left_name: "iPhone 16 Pro Max",
    left_image: "",
    right_id: "galaxy-s25-ultra",
    right_name: "Galaxy S25 Ultra",
    right_image: "",
    compare_count: 12540,
  },
  {
    left_id: "nothing-phone-3",
    left_name: "Nothing Phone (3)",
    left_image: "",
    right_id: "oneplus-13",
    right_name: "OnePlus 13",
    right_image: "",
    compare_count: 8420,
  },
  {
    left_id: "pixel-9-pro",
    left_name: "Pixel 9 Pro",
    left_image: "",
    right_id: "iphone-15-pro-max",
    right_name: "iPhone 15 Pro Max",
    right_image: "",
    compare_count: 6310,
  },
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
      toText(value?.title) ||
      toText(value?.display) ||
      ""
    );
  }
  const text = String(value).trim();
  if (!text || /^(null|undefined|n\/a|na)$/i.test(text)) return "";
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
  return `${RUPEE}${Math.round(amount).toLocaleString("en-IN")}`;
};

const normalizeScore100 = (value, fallback = null) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  if (numeric <= 1)
    return Math.max(0, Math.min(100, Math.round(numeric * 100)));
  if (numeric <= 10)
    return Math.max(0, Math.min(100, Math.round(numeric * 10)));
  return Math.max(0, Math.min(100, Math.round(numeric)));
};

const formatMetricNumber = (value) => {
  const text = firstText(value);
  if (!text) return "";
  const match = text.match(/(\d+(?:\.\d+)?)/);
  return match ? match[1] : text;
};

const normalizeDisplayLabel = (value) => {
  const text = firstText(value);
  if (!text) return "";
  const match = text.match(/(\d+(?:\.\d+)?)\s*(?:inch|inches|in|")/i);
  if (match) return `${match[1]}"`;
  return text;
};

const normalizeCameraLabel = (value) => {
  const text = firstText(value);
  if (!text) return "";
  const match = text.match(/(\d+(?:\.\d+)?)\s*mp/i);
  if (match) return `${match[1]}MP`;
  const numeric = formatMetricNumber(text);
  return numeric ? `${numeric}MP` : text;
};

const normalizeBatteryLabel = (value) => {
  const text = firstText(value);
  if (!text) return "";
  const match = text.match(/(\d+(?:\.\d+)?)\s*mah/i);
  if (match) return `${match[1]}mAh`;
  const numeric = formatMetricNumber(text);
  return numeric ? `${numeric}mAh` : text;
};

const getInitials = (value = "") => {
  const parts = String(value).split(/\s+/).filter(Boolean).slice(0, 2);
  if (!parts.length) return "HK";
  return parts.map((part) => part.charAt(0).toUpperCase()).join("");
};

const getRowVariants = (row) =>
  Array.isArray(row?.variants)
    ? row.variants
    : Array.isArray(row?.metadata?.variants)
      ? row.metadata.variants
      : Array.isArray(row?.variants_json)
        ? row.variants_json
        : [];

const getTrendingRows = (payload) => {
  if (Array.isArray(payload?.trending)) return payload.trending;
  if (Array.isArray(payload?.smartphones)) return payload.smartphones;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (Array.isArray(payload)) return payload;
  return [];
};

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

const getRowDisplay = (row) =>
  firstText(
    row?.display?.size,
    row?.display?.display_size,
    row?.display?.screen_size,
    row?.specs?.display,
    row?.specs?.screen_size,
    row?.screen?.size,
  );

const getRowCamera = (row) =>
  firstText(
    row?.camera?.main_camera_megapixels,
    row?.camera?.main,
    row?.camera?.primary,
    row?.specs?.camera,
    row?.camera?.rear_camera?.main?.megapixels,
  );

const getRowProcessor = (row) =>
  firstText(
    row?.performance?.processor,
    row?.processor,
    row?.cpu,
    row?.specs?.processor,
    row?.basic_info?.processor,
  );

const getRowBattery = (row) =>
  firstText(
    row?.battery?.capacity_mAh,
    row?.battery?.capacity,
    row?.battery?.battery_capacity_mah,
    row?.battery?.battery_capacity,
    row?.specs?.battery,
  );

const getRowPrice = (row) => {
  const prices = [];
  const addPrice = (value) => {
    const parsed = parsePriceNumber(value);
    if (parsed !== null) prices.push(parsed);
  };

  addPrice(row?.price);
  addPrice(row?.base_price);
  addPrice(row?.starting_price);
  addPrice(row?.min_price);

  for (const variant of getRowVariants(row)) {
    addPrice(variant?.base_price);
    addPrice(variant?.price);
    addPrice(variant?.amount);

    const stores = Array.isArray(variant?.store_prices)
      ? variant.store_prices
      : [];
    for (const store of stores) addPrice(store?.price);
  }

  return prices.length ? Math.min(...prices) : null;
};

const getRowScore = (row) => {
  const displayScore = pickNumber(
    row?.overall_score_display,
    row?.overallScoreDisplay,
    row?.overall_score_v2_display_80_98,
    row?.overallScoreV2Display8098,
    row?.spec_score_v2_display_80_98,
    row?.specScoreV2Display8098,
  );
  if (displayScore !== null) return normalizeScore100(displayScore, 88);

  return normalizeScore100(
    pickNumber(
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
    ),
    88,
  );
};

const getDevicePath = (device) => {
  const source = device.name || device.brand || "smartphone";
  return createProductPath("smartphones", source);
};

const mapMostComparedRows = (payload) =>
  (payload?.mostCompared || []).map((row) => ({
    left_id: row.product_id,
    left_name: row.product_name,
    left_image: row.product_image || "",
    right_id: row.compared_product_id,
    right_name: row.compared_product_name,
    right_image: row.compared_product_image || "",
    compare_count: Number(row.compare_count) || 0,
  }));

const formatCompareCount = (value) => {
  const numeric = Number(value) || 0;
  return `${numeric.toLocaleString("en-IN")} compares`;
};

const computeTrendDelta = (value, average, index) => {
  if (!average) return index === 1 ? -1 : 2;
  const delta = Math.round(((value - average) / average) * 10);
  if (delta !== 0) return delta;
  return index === 1 ? -1 : 2;
};

const SectionLabel = ({ icon: Icon, children }) => (
  <div className="flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-[0.03em] text-slate-900">
    <Icon className="h-[14px] w-[14px] text-violet-500" />
    <span>{children}</span>
  </div>
);

const BudgetCard = ({ item, isActive, onClick }) => {
  const Icon = item.icon;
  const [lead, amount] = item.label.split(/ (.+)/);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex h-[60px] min-w-0 w-full items-center gap-2.5 rounded-[16px] border bg-white px-3 text-left shadow-[0_8px_24px_rgba(15,23,42,0.04)] transition-all duration-300 ${
        isActive
          ? "border-violet-300 shadow-[0_0_0_1px_rgba(196,181,253,0.45),0_14px_32px_rgba(124,58,237,0.10)]"
          : "border-[#E7EAF3] hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-[0_14px_28px_rgba(124,58,237,0.08)]"
      }`}
    >
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
          isActive
            ? "border-violet-100 bg-violet-50 text-violet-600"
            : "border-slate-100 bg-slate-50 text-violet-500"
        }`}
      >
        <Icon className="h-[15px] w-[15px]" />
      </span>
      <span className="min-w-0 leading-none">
        <span className="block text-[10px] font-semibold tracking-[-0.01em] text-slate-500">
          {lead}
        </span>
        <span className="mt-0.5 block text-[12px] font-bold tracking-[-0.03em] text-slate-900">
          {amount}
        </span>
        <span className="mt-1 block text-[10px] font-medium text-slate-400">
          {item.count}
        </span>
      </span>
    </button>
  );
};

const FilterChip = ({ item, active, onClick }) => {
  const Icon = item.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-[14px] font-medium shadow-[0_8px_20px_rgba(15,23,42,0.03)] transition-all duration-300 ${
        active
          ? "border-violet-300 bg-violet-50 text-violet-700"
          : "border-slate-200/90 bg-white text-slate-700 hover:border-violet-200 hover:text-violet-700"
      }`}
    >
      <Icon
        className={`h-[15px] w-[15px] ${
          active ? "text-violet-600" : item.tone || "text-slate-500"
        }`}
      />
      {item.label}
    </button>
  );
};

const HookScoreCircle = ({ score, tone }) => (
  <div className="flex shrink-0 flex-col items-center text-center">
    <div
      className={`flex h-[42px] w-[42px] items-center justify-center rounded-full border-2 bg-white text-[15px] font-bold leading-none text-slate-900 ${tone}`}
    >
      {Number(score) || "--"}
    </div>
    <span className="mt-1 text-[9px] font-medium leading-none text-slate-400">
      HookScore
    </span>
  </div>
);

const SpecItem = ({ icon: Icon, value }) => (
  <div className="flex min-w-0 items-center gap-1.5 text-[10px] leading-none text-slate-500">
    <Icon className="h-[11px] w-[11px] shrink-0 text-slate-400" />
    <span className="truncate">{value || "--"}</span>
  </div>
);

const FeaturedDeviceCard = ({ device, badge, onOpen, onCompare }) => {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <article className="rounded-[10px] border border-slate-200 bg-white px-3 pb-3 pt-3 shadow-[0_8px_18px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <span
          className={`inline-flex items-center gap-1 rounded-[7px] border px-2 py-0.5 text-[8px] font-bold uppercase ${badge.tone}`}
        >
          <span className="h-1 w-1 rounded-full bg-current opacity-80" />
          {badge.label}
        </span>
        <button
          type="button"
          aria-label={`Bookmark ${device.name}`}
          className="text-slate-400 transition-colors hover:text-violet-600"
        >
          <LuBookmark className="h-[15px] w-[15px]" />
        </button>
      </div>

      <div className="relative mt-2 min-h-[84px]">
        <button
          type="button"
          onClick={onOpen}
          className="flex w-full justify-start pr-12"
        >
          <div className="flex h-[82px] w-[86px] items-center justify-center overflow-hidden rounded-[6px] bg-transparent">
            {device.image && !imageFailed ? (
              <img
                src={device.image}
                alt={device.name}
                className="h-[78px] w-auto object-contain"
                loading="lazy"
                onError={() => setImageFailed(true)}
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-[8px] bg-gradient-to-br from-violet-500 to-blue-600 text-base font-bold text-white shadow-[0_16px_30px_rgba(37,99,235,0.16)]">
                {getInitials(device.name)}
              </div>
            )}
          </div>
        </button>
        <div className="absolute right-0 top-2">
          <HookScoreCircle score={device.score} tone={badge.scoreTone} />
        </div>
      </div>

      <div className="mt-2">
        <button type="button" onClick={onOpen} className="text-left">
          <h3 className="line-clamp-2 min-h-[30px] text-[12px] font-bold leading-[1.16] text-slate-900 xl:text-[13px]">
            {device.name}
          </h3>
        </button>
        <p className="mt-0.5 text-[10px] font-medium text-slate-500">
          {device.brand}
        </p>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1.5">
        <SpecItem icon={LuSmartphone} value={device.display} />
        <SpecItem icon={LuCamera} value={device.camera} />
        <SpecItem icon={LuCpu} value={device.processor} />
        <SpecItem icon={LuBatteryCharging} value={device.battery} />
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-2.5">
        <div className="min-w-0">
          <p className="text-[13px] font-bold leading-none text-slate-900 xl:text-[14px]">
            {formatCurrency(device.price) || "Price soon"}
          </p>
        </div>
        <button
          type="button"
          onClick={onCompare}
          className="inline-flex items-center gap-1 whitespace-nowrap text-[11px] font-semibold text-violet-700 transition-colors hover:text-violet-800"
        >
          Compare
          <LuGitCompareArrows className="h-3 w-3" />
        </button>
      </div>
    </article>
  );
};

const MostComparedRow = ({ row, delta, onOpen }) => {
  const positive = delta >= 0;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full border-b border-slate-100 py-3.5 text-left last:border-b-0"
    >
      <div className="flex items-center gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100">
            {row.left_image ? (
              <img
                src={row.left_image}
                alt={row.left_name}
                className="h-full w-full object-contain p-1.5"
                loading="lazy"
              />
            ) : (
              <span className="text-xs font-bold text-slate-500">
                {getInitials(row.left_name)}
              </span>
            )}
          </div>
          <p className="line-clamp-2 text-[13px] font-semibold leading-4 text-slate-900">
            {row.left_name}
          </p>
        </div>

        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-700">
          VS
        </span>

        <div className="flex min-w-0 flex-1 items-center gap-2.5 text-right">
          <p className="line-clamp-2 flex-1 text-[13px] font-semibold leading-4 text-slate-900">
            {row.right_name}
          </p>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100">
            {row.right_image ? (
              <img
                src={row.right_image}
                alt={row.right_name}
                className="h-full w-full object-contain p-1.5"
                loading="lazy"
              />
            ) : (
              <span className="text-xs font-bold text-slate-500">
                {getInitials(row.right_name)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-2.5 flex items-center justify-between text-[11px]">
        <span className="font-medium text-slate-500">
          {formatCompareCount(row.compare_count)}
        </span>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-1 font-semibold ${
            positive
              ? "bg-emerald-50 text-emerald-600"
              : "bg-rose-50 text-rose-600"
          }`}
        >
          {positive ? "+" : ""}
          {delta}
        </span>
      </div>
    </button>
  );
};

const TrustCard = ({ item, className = "" }) => {
  const Icon = item.icon;

  return (
    <div className={`flex items-start gap-4 px-5 py-4 ${className}`}>
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-blue-100 text-violet-700">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <h3 className="text-[16px] font-semibold leading-tight text-slate-900">
          {item.title}
        </h3>
        <p className="mt-1 text-[13px] leading-5 text-slate-500">
          {item.description}
        </p>
      </div>
    </div>
  );
};

const FeaturedProduct = () => {
  const navigate = useNavigate();
  const isLoaded = useRevealAnimation();
  const [activeBudget, setActiveBudget] = useState(BUDGET_BUCKETS[0].slug);
  const [activeFilter, setActiveFilter] = useState("");
  const [featuredDevices, setFeaturedDevices] = useState([]);
  const [mostCompared, setMostCompared] = useState([]);

  useEffect(() => {
    const preloaded = readPreloadedApiResponse(TRENDING_ENDPOINT);
    if (preloaded) {
      const mapped = getTrendingRows(preloaded)
        .map((row, index) => {
          const name = getRowName(row);
          if (!name) return null;

          return {
            id:
              row?.product_id ??
              row?.productId ??
              row?.id ??
              `featured-${index}`,
            name,
            brand: getRowBrand(row) || "Smartphone",
            image: getRowImage(row),
            price: getRowPrice(row),
            score: getRowScore(row) ?? 88 - index,
            display: normalizeDisplayLabel(getRowDisplay(row)),
            camera: normalizeCameraLabel(getRowCamera(row)),
            processor: firstText(getRowProcessor(row), "Flagship chipset"),
            battery: normalizeBatteryLabel(getRowBattery(row)),
            path: getDevicePath({ name }),
            _rank: index,
          };
        })
        .filter(Boolean);

      if (mapped.length) setFeaturedDevices(mapped);
      return undefined;
    }

    let cancelled = false;
    const controller =
      typeof AbortController !== "undefined" ? new AbortController() : null;

    (async () => {
      try {
        const response = await fetch(TRENDING_ENDPOINT, {
          cache: "no-store",
          signal: controller?.signal,
        });
        if (!response.ok) return;
        const payload = await response.json();
        if (cancelled) return;

        const mapped = getTrendingRows(payload)
          .map((row, index) => {
            const name = getRowName(row);
            if (!name) return null;

            return {
              id:
                row?.product_id ??
                row?.productId ??
                row?.id ??
                `featured-${index}`,
              name,
              brand: getRowBrand(row) || "Smartphone",
              image: getRowImage(row),
              price: getRowPrice(row),
              score: getRowScore(row) ?? 88 - index,
              display: normalizeDisplayLabel(getRowDisplay(row)),
              camera: normalizeCameraLabel(getRowCamera(row)),
              processor: firstText(getRowProcessor(row), "Flagship chipset"),
              battery: normalizeBatteryLabel(getRowBattery(row)),
              path: getDevicePath({ name }),
              _rank: index,
            };
          })
          .filter(Boolean);

        if (mapped.length) setFeaturedDevices(mapped);
      } catch {
        // Fall back to the local premium dataset when live content is unavailable.
      }
    })();

    return () => {
      cancelled = true;
      controller?.abort?.();
    };
  }, []);

  useEffect(() => {
    const preloaded = readPreloadedApiResponse(MOST_COMPARED_ENDPOINT);
    if (preloaded) {
      const mapped = mapMostComparedRows(preloaded);
      if (mapped.length) setMostCompared(mapped);
      return undefined;
    }

    let cancelled = false;
    const controller =
      typeof AbortController !== "undefined" ? new AbortController() : null;

    (async () => {
      try {
        const response = await fetch(MOST_COMPARED_ENDPOINT, {
          cache: "no-store",
          signal: controller?.signal,
        });
        if (!response.ok) return;
        const payload = await response.json();
        if (cancelled) return;
        const mapped = mapMostComparedRows(payload);
        if (mapped.length) setMostCompared(mapped);
      } catch {
        // Keep the widget alive with fallback comparisons.
      }
    })();

    return () => {
      cancelled = true;
      controller?.abort?.();
    };
  }, []);

  const displayDevices = useMemo(() => {
    const source = featuredDevices.length
      ? featuredDevices.slice().sort((left, right) => {
          const scoreDelta = (right.score || 0) - (left.score || 0);
          if (scoreDelta !== 0) return scoreDelta;
          return (left._rank || 0) - (right._rank || 0);
        })
      : FALLBACK_FEATURED_PRODUCTS;

    return source.slice(0, 5).map((device, index) => ({
      ...device,
      badge: FEATURED_BADGES[index % FEATURED_BADGES.length],
    }));
  }, [featuredDevices]);

  const comparedRows = useMemo(() => {
    const source = (
      mostCompared.length ? mostCompared : FALLBACK_MOST_COMPARED
    ).slice(0, 3);
    const average =
      source.reduce((sum, row) => sum + (row.compare_count || 0), 0) /
      (source.length || 1);

    return source.map((row, index) => ({
      ...row,
      delta: computeTrendDelta(row.compare_count || 0, average, index),
      path: buildCanonicalComparePath({
        leftName: row.left_name,
        rightName: row.right_name,
      }),
    }));
  }, [mostCompared]);

  const handleBudgetClick = (slug) => {
    setActiveBudget(slug);
    navigate(`/smartphones/filter/${slug}`);
  };

  const handleFilterClick = (feature) => {
    setActiveFilter(feature);
    navigate(buildSmartphoneFeaturePath(feature));
  };

  const openDevice = (device) => {
    navigate(device.path || createProductPath("smartphones", device.name));
  };

  const compareDevice = (device, index) => {
    const fallbackTarget = displayDevices[(index + 1) % displayDevices.length];
    if (!fallbackTarget) {
      navigate("/compare");
      return;
    }

    navigate(
      buildCanonicalComparePath({
        leftName: device.name,
        rightName: fallbackTarget.name,
      }),
    );
  };

  return (
    <section
      className={`relative overflow-hidden bg-[linear-gradient(180deg,#F8FAFC_0%,#EEF4FF_100%)] text-slate-900 transition-all duration-700 ${
        isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.07),transparent_26%),radial-gradient(circle_at_88%_20%,rgba(37,99,235,0.08),transparent_20%)]" />
      <div className="relative mx-auto max-w-[1440px] px-4 pb-16 pt-[72px] sm:px-6 lg:px-8 lg:pb-20">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-6">
            <div>
              <SectionLabel icon={LuWallet}>Discover by Budget</SectionLabel>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-[repeat(8,minmax(0,1fr))_46px]">
                {BUDGET_BUCKETS.map((item) => (
                  <BudgetCard
                    key={item.slug}
                    item={item}
                    isActive={activeBudget === item.slug}
                    onClick={() => handleBudgetClick(item.slug)}
                  />
                ))}
                <button
                  type="button"
                  onClick={() => navigate("/smartphones")}
                  aria-label="View more budget categories"
                  className="hidden h-[60px] w-[46px] items-center justify-center self-center justify-self-end rounded-full border border-slate-200 bg-white text-slate-700 shadow-[0_8px_24px_rgba(15,23,42,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-200 hover:text-violet-700 hover:shadow-[0_14px_28px_rgba(124,58,237,0.10)] xl:flex"
                >
                  <LuArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <SectionLabel icon={LuSparkles}>Smart Filters</SectionLabel>
                <button
                  type="button"
                  onClick={() => navigate("/smartphones")}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-violet-700 transition-colors hover:text-violet-800"
                >
                  View all filters
                  <LuArrowRight className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                {SMART_FILTERS.map((item) => (
                  <FilterChip
                    key={item.feature}
                    item={item}
                    active={activeFilter === item.feature}
                    onClick={() => handleFilterClick(item.feature)}
                  />
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-[12px] font-black uppercase text-slate-900">
                  Top Picks For You
                </h2>
                <LuInfo className="h-3.5 w-3.5 text-slate-400" />
              </div>
              <div className="mt-3 xl:hidden">
                <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                  {displayDevices.map((device, index) => (
                    <div
                      key={device.id || device.name}
                      className="w-[176px] shrink-0"
                    >
                      <FeaturedDeviceCard
                        device={device}
                        badge={device.badge}
                        onOpen={() => openDevice(device)}
                        onCompare={() => compareDevice(device, index)}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-3 hidden gap-3 xl:grid xl:grid-cols-[repeat(5,176px)_36px] xl:items-start">
                {displayDevices.map((device, index) => (
                  <FeaturedDeviceCard
                    key={device.id || device.name}
                    device={device}
                    badge={device.badge}
                    onOpen={() => openDevice(device)}
                    onCompare={() => compareDevice(device, index)}
                  />
                ))}
                <button
                  type="button"
                  onClick={() => navigate("/smartphones")}
                  aria-label="View more featured devices"
                  className="flex h-9 w-9 items-center justify-center self-center justify-self-end rounded-full border border-slate-200 bg-white text-slate-700 shadow-[0_8px_20px_rgba(15,23,42,0.05)] transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-200 hover:text-violet-700 hover:shadow-[0_12px_24px_rgba(124,58,237,0.12)]"
                >
                  <LuArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          <aside className="self-start rounded-[26px] border border-slate-200/80 bg-white/80 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)] backdrop-blur-sm">
            <div className="flex items-center justify-between gap-3">
              <SectionLabel icon={LuGitCompareArrows}>
                Most Compared
              </SectionLabel>
              <button
                type="button"
                onClick={() => navigate("/popular-comparisons")}
                className="inline-flex items-center gap-1 text-sm font-semibold text-violet-700 transition-colors hover:text-violet-800"
              >
                View all
                <LuArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3">
              {comparedRows.map((row) => (
                <MostComparedRow
                  key={`${row.left_id || row.left_name}-${row.right_id || row.right_name}`}
                  row={row}
                  delta={row.delta}
                  onOpen={() => navigate(row.path)}
                />
              ))}
            </div>
          </aside>
        </div>

        <div className="mt-4 overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/75 shadow-[0_10px_30px_rgba(15,23,42,0.05)] backdrop-blur-sm">
          <div className="grid sm:grid-cols-2 xl:grid-cols-4">
            {TRUST_PILLARS.map((item, index) => (
              <TrustCard
                key={item.title}
                item={item}
                className={`${
                  index === 0
                    ? "border-b border-slate-200/70 sm:border-r xl:border-b-0"
                    : ""
                } ${
                  index === 1
                    ? "border-b border-slate-200/70 xl:border-r xl:border-b-0"
                    : ""
                } ${index === 2 ? "sm:border-r xl:border-r" : ""}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProduct;
