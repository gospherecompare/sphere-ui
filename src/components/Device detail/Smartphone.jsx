// src/components/MobileDetailCard.jsx
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import CompetitorCards from "../ui/CompetitorCards";
import ProductDiscoverySections from "../ui/ProductDiscoverySections";
import RecommendedSmartphones from "../Home/RecommendedSmartphones";
import { useDevice } from "../../hooks/useDevice";
import Cookies from "js-cookie";

import useTitle from "../../hooks/useTitle";
import usePageEngagementTracker from "../../hooks/usePageEngagementTracker";
import {
  FaHeart,
  FaShare,
  FaCamera,
  FaBatteryFull,
  FaMemory,
  FaMicrochip,
  FaMobile,
  FaExpand,
  FaWifi,
  FaShieldAlt,
  FaWater,
  FaBolt,
  FaSync,
  FaFilm,
  FaVolumeUp,
  FaGamepad,
  FaBalanceScale,
  FaArrowRight,
  FaChevronLeft,
  FaChevronRight,
  FaChevronDown,
  FaTag,
  FaCopy,
  FaCheck,
  FaPlus,
  FaShareAlt,
  FaInfoCircle,
  FaWhatsapp,
  FaFacebook,
  FaTwitter,
  FaLink,
  FaEnvelope,
  FaExternalLinkAlt,
  FaStore,
} from "react-icons/fa";
import "../../styles/hideScrollbar.css";
import Spinner from "../ui/Spinner";
import NotFound from "../Static/NotFound";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import SEO from "../SEO";
import { smartphoneMeta } from "../../constants/meta";
import { generateSlug, extractNameFromSlug } from "../../utils/slugGenerator";
import { createWebPageSchema } from "../../utils/schemaGenerators";
import useDeviceFieldProfiles from "../../hooks/useDeviceFieldProfiles";
import useStoreLogos from "../../hooks/useStoreLogos";
import {
  createNewsStoryPath,
  usePublicNewsFeed,
} from "../../hooks/usePublicNews";
import { resolveDeviceFieldProfile } from "../../utils/deviceFieldProfiles";
import { resolveSmartphoneBadgeScore } from "../../utils/smartphoneBadgeScore";
import { buildDeviceSeoKeywords } from "../../utils/seoKeywordBuilder";

const token = Cookies.get("arenak");
const SMARTPHONE_SEO_SUFFIX = "-price-in-india";
const RECENT_STORAGE_KEY = "hooks_recent_smartphones_v1";
const MAX_RECENT_ITEMS = 12;
const SITE_ORIGIN = "https://tryhook.shop";
const LINKED_NEWS_LIMIT = 3;
const CURRENT_MONTH_YEAR = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "numeric",
}).format(new Date());

// ============================================================================
// RESPONSIVE SPACING CONFIGURATION - Easy to Edit for Mobile/Tablet/Desktop
// ============================================================================
const RESPONSIVE_SPACING = {
  // Page padding/margin
  pageMarginX: {
    mobile: "px-3", // 0.75rem - Mobile
    tablet: "sm:px-6", // 1.5rem - Tablet (sm and up)
    desktop: "lg:px-8", // 2rem - Desktop (lg and up)
  },
  pageMarginY: {
    mobile: "py-4", // 1rem - Mobile
    tablet: "sm:py-5", // 1.25rem - Tablet
    desktop: "lg:py-6", // 1.5rem - Desktop
  },

  // Sections padding
  sectionPadding: {
    mobile: "p-3", // 0.75rem
    tablet: "sm:p-5", // 1.25rem
    desktop: "lg:p-6", // 1.5rem
  },

  // Card padding
  cardPadding: {
    mobile: "p-4", // 1rem
    tablet: "sm:p-5", // 1.25rem
    desktop: "lg:p-6", // 1.5rem
  },

  // Gap between elements
  gapSmall: "gap-2",
  gapMedium: "gap-3",
  gapLarge: "gap-4",
  gapXLarge: "gap-6",

  // Image section padding
  imagePadding: {
    mobile: "p-4", // 1rem
    tablet: "sm:p-6", // 1.5rem
    desktop: "lg:p-8", // 2rem
  },

  // Header section styling
  headerPadding: {
    mobile: "p-3",
    tablet: "sm:p-6",
    desktop: "lg:p-7",
  },

  // Content section margin
  contentMarginY: {
    mobile: "my-3",
    tablet: "sm:my-4",
    desktop: "lg:my-6",
  },

  // Grid gaps
  gridGapMobile: "gap-3",
  gridGapTablet: "sm:gap-4",
  gridGapDesktop: "lg:gap-6",

  // Key Specifications responsive gap (smaller on mobile)
  specCardGap: {
    mobile: "gap-2.5", // 0.625rem - Mobile (smaller)
    tablet: "sm:gap-4", // 1rem - Tablet
    desktop: "lg:gap-5", // 1.25rem - Desktop
  },

  // Key Specifications section spacing (reduced on mobile)
  specSectionSpacing: {
    mobile: "mt-3",
    tablet: "sm:mt-5",
    desktop: "lg:mt-6",
  },
};

// Helper function to combine responsive classes
const combineResponsiveClasses = (config) => {
  const classes = [config.mobile];
  if (config.tablet) classes.push(config.tablet);
  if (config.desktop) classes.push(config.desktop);
  return classes.join(" ");
};

const normalizeScore100 = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  if (n <= 1) return Math.max(0, Math.min(100, n * 100));
  if (n <= 10) return Math.max(0, Math.min(100, n * 10));
  return Math.max(0, Math.min(100, n));
};

const remapScoreToBand = (value, min = 80, max = 98) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const clamped = Math.max(0, Math.min(100, n));
  const ratio = clamped / 100;
  return min + (max - min) * ratio;
};

const toAbsoluteUrl = (url) => {
  if (!url) return "";
  if (/^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(url)) return url;
  if (/^(?:data:|blob:)/i.test(url)) return url;
  if (typeof window === "undefined") return url;
  const origin = window.location.origin;
  if (!origin) return url;
  return url.startsWith("/") ? `${origin}${url}` : `${origin}/${url}`;
};

const formatScoreValue = (value) => {
  if (!Number.isFinite(value)) return null;
  return `${Number(value).toFixed(1)}%`;
};

const formatPrice = (price) => {
  if (price == null || price === "") return "N/A";
  const str = String(price);
  const numericPrice = parseInt(str.replace(/[^0-9]/g, ""), 10) || 0;
  return new Intl.NumberFormat("en-IN").format(numericPrice);
};

const extractNumericPrice = (price) => {
  if (price == null || price === "" || price === "NaN") return 0;
  if (typeof price === "number" && Number.isFinite(price)) return price;
  const numeric = parseInt(String(price).replace(/[^0-9]/g, ""), 10);
  return Number.isFinite(numeric) ? numeric : 0;
};

const getStorePriceList = (variant) =>
  Array.isArray(variant?.store_prices)
    ? variant.store_prices
    : Array.isArray(variant?.storePrices)
      ? variant.storePrices
      : [];

const resolveVariantNumericPrice = (variant) => {
  if (!variant) return 0;
  const storeCandidates = getStorePriceList(variant)
    .map((store) => extractNumericPrice(store?.price))
    .filter((n) => n > 0);
  if (storeCandidates.length > 0) {
    return Math.min(...storeCandidates);
  }

  return extractNumericPrice(
    variant.base_price ??
      variant.basePrice ??
      variant.price ??
      variant.base ??
      variant.numericPrice ??
      null,
  );
};

const resolveDeviceNumericPrice = (device) => {
  if (!device) return 0;

  const variantCandidates = Array.isArray(device.variants)
    ? device.variants
        .map((variant) => resolveVariantNumericPrice(variant))
        .filter((n) => n > 0)
    : [];
  if (variantCandidates.length > 0) {
    return Math.min(...variantCandidates);
  }

  const topLevelStores = Array.isArray(device.store_prices)
    ? device.store_prices
    : Array.isArray(device.storePrices)
      ? device.storePrices
      : [];
  const storeCandidates = topLevelStores
    .map((store) => extractNumericPrice(store?.price))
    .filter((n) => n > 0);
  if (storeCandidates.length > 0) {
    return Math.min(...storeCandidates);
  }

  return extractNumericPrice(
    device.base_price ??
      device.price ??
      device.basePrice ??
      device.numericPrice ??
      null,
  );
};

const formatPriceLabel = (value) => {
  const numeric = extractNumericPrice(value);
  return numeric > 0 ? `₹ ${formatPrice(numeric)}` : "";
};

const normalizeStorePriceRow = (
  store = {},
  fallbackIndex = 0,
  variant = null,
) => {
  const storeName =
    store?.display_store_name ||
    store?.displayStoreName ||
    store?.store ||
    store?.store_name ||
    store?.storeName ||
    `Store ${fallbackIndex + 1}`;
  const rawUrl = store?.url || store?.url_link || store?.link || "";
  const price = store?.price ?? store?.base_price ?? store?.basePrice ?? null;

  return {
    ...store,
    id:
      store?.id ??
      `${variant?.variant_id ?? variant?.id ?? "store"}-${fallbackIndex}`,
    variant_id: store?.variant_id ?? variant?.variant_id ?? variant?.id ?? null,
    store: storeName,
    store_name: storeName,
    storeName: storeName,
    display_store_name: storeName,
    price,
    numericPrice: extractNumericPrice(price),
    url: rawUrl,
    cta_label:
      store?.cta_label ||
      store?.ctaLabel ||
      (rawUrl ? "Buy Now" : "Unavailable"),
    availability_status:
      store?.availability_status || store?.availabilityStatus || null,
    sale_start_date:
      store?.sale_start_date ||
      store?.saleStartDate ||
      store?.sale_date ||
      null,
    sale_date: store?.sale_date || store?.saleDate || null,
    is_prebooking:
      store?.is_prebooking === true || store?.isPrebooking === true,
    logo: store?.logo || store?.store_logo || store?.storeLogo || "",
  };
};

const getRenderableStorePriceRows = (source) => {
  if (!source) return [];

  const rows = getStorePriceList(source)
    .map((store, index) => normalizeStorePriceRow(store, index, source))
    .filter((row) => row.store || row.numericPrice > 0 || row.url);

  rows.sort((a, b) => {
    const aPrice = Number(a.numericPrice) || 0;
    const bPrice = Number(b.numericPrice) || 0;
    if (aPrice > 0 && bPrice > 0) return aPrice - bPrice;
    if (aPrice > 0 && bPrice <= 0) return -1;
    if (aPrice <= 0 && bPrice > 0) return 1;
    return String(a.store || "").localeCompare(String(b.store || ""));
  });

  if (rows.length > 0) return rows;

  const fallbackPrice = extractNumericPrice(
    source.base_price ??
      source.basePrice ??
      source.price ??
      source.numericPrice ??
      null,
  );
  if (fallbackPrice > 0) {
    return [
      {
        id: `${source?.variant_id ?? source?.id ?? "variant"}-fallback`,
        variant_id: source?.variant_id ?? source?.id ?? null,
        store: "Variant",
        store_name: "Variant",
        storeName: "Variant",
        display_store_name: "Variant",
        price: fallbackPrice,
        numericPrice: fallbackPrice,
        url: "",
        cta_label: "Buy Now",
        is_prebooking: false,
        logo: "",
      },
    ];
  }

  return [];
};

const HiddenScoreBadge = () => null;

const BaseSpecScoreBadge = ({
  score,
  displayScore = null,
  size = 40,
  showSpecLabel = false,
  zeroFallback = false,
  showValue = true,
  variant = "default",
}) => {
  const normalized = normalizeScore100(score);
  const displayNormalized = normalizeScore100(displayScore);
  const percentageRaw =
    displayNormalized != null
      ? Number(displayNormalized.toFixed(1))
      : normalized != null
        ? Number(normalized.toFixed(1))
        : zeroFallback
          ? 0
          : null;
  const safePercentageRaw =
    !zeroFallback &&
    percentageRaw === 0 &&
    (displayNormalized == null || displayNormalized === 0) &&
    (normalized == null || normalized === 0)
      ? null
      : percentageRaw;
  const percentage =
    safePercentageRaw != null
      ? displayNormalized != null
        ? safePercentageRaw
        : remapScoreToBand(safePercentageRaw, 80, 98)
      : null;
  const label = percentage != null ? `${percentage.toFixed(1)}%` : "--";
  const isGlass = variant === "glass";
  const containerClass = isGlass
    ? "inline-flex flex-col items-center justify-center rounded-xl border border-white/70 bg-white/60 px-2.5 py-1.5 leading-none shadow-[0_8px_24px_rgba(59,130,246,0.10)] backdrop-blur-md ring-1 ring-white/40"
    : "inline-flex flex-col items-center justify-center rounded-md border border-blue-200 bg-blue-50/95 px-1.5 py-1 leading-none";
  const valueClass = isGlass
    ? "text-[11px] font-bold text-slate-700"
    : "text-[11px] font-bold text-blue-700";
  const labelClass = isGlass
    ? `text-[8px] font-semibold uppercase tracking-wide text-slate-500 ${
        showValue ? "mt-0.5" : ""
      }`
    : `text-[8px] font-semibold uppercase tracking-wide text-blue-600 ${
        showValue ? "mt-0.5" : ""
      }`;

  return (
    <div
      className={containerClass}
      style={{ minWidth: `${Math.max(38, Math.round(size))}px` }}
      aria-label={
        showValue
          ? percentage != null
            ? `Overall score ${percentage.toFixed(1)} percent`
            : "Overall score unavailable"
          : showSpecLabel
            ? "Spec score badge"
            : "Score badge"
      }
    >
      {showValue ? <span className={valueClass}>{label}</span> : null}
      {showSpecLabel ? (
        <span className={labelClass}>{showValue ? "Spec" : "Spec Score"}</span>
      ) : null}
    </div>
  );
};

const formatLinkedNewsDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recent update";

  const month = new Intl.DateTimeFormat("en-US", {
    month: "short",
  }).format(date);
  const day = new Intl.DateTimeFormat("en-US", {
    day: "numeric",
  }).format(date);
  const year = new Intl.DateTimeFormat("en-US", {
    year: "2-digit",
  }).format(date);

  return `${month} ${day}, '${year}`;
};

const LinkedNewsStoryCard = ({ story, compact = false }) => {
  if (!story?.slug || !story?.title) return null;

  const storyPath = createNewsStoryPath(story.slug);
  const authorLabel = story?.author || "Hooks newsroom";
  const dateLabel = formatLinkedNewsDate(
    story?.publishedIso || story?.updatedIso || story?.publishedAt,
  );
  const baseCardClass = compact
    ? "group grid h-full gap-3 rounded-[22px] border border-white/80 bg-white/90 p-3 shadow-[0_10px_28px_rgba(90,108,179,0.10)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(90,108,179,0.16)] sm:grid-cols-[96px,1fr]"
    : "group flex h-full flex-col rounded-[24px] border border-[#e8edfb] bg-white p-3 shadow-[0_14px_34px_rgba(90,108,179,0.12)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(90,108,179,0.18)]";
  const imageWrapClass = compact
    ? "aspect-[6/5] overflow-hidden rounded-[16px] border border-[#edf1fc] bg-[#eef2ff] sm:h-full"
    : "aspect-[5/3] overflow-hidden rounded-[16px] border border-[#edf1fc] bg-[#eef2ff]";
  const titleClass = compact
    ? "text-[0.98rem] leading-6 text-[#082a72] line-clamp-3"
    : "text-[1.15rem] leading-8 text-[#082a72] line-clamp-3";

  return (
    <Link to={storyPath} className={baseCardClass}>
      <div className={imageWrapClass}>
        {story?.image ? (
          <img
            src={story.image}
            alt={story?.heroImageAlt || story.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-end bg-gradient-to-br from-[#ed174c] via-[#f35b4f] to-[#f7b267] p-4 text-white">
            <div className="max-w-[11rem]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/80">
                {story?.label || "News"}
              </p>
              <h3 className="mt-3 text-base font-black leading-tight">
                {story.title}
              </h3>
            </div>
          </div>
        )}
      </div>

      <div
        className={
          compact
            ? "min-w-0 self-stretch py-1"
            : "flex flex-1 flex-col px-1 pb-1 pt-4"
        }
      >
        {!compact ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#5f74c6]">
            {story?.label || "News"}
          </p>
        ) : null}

        <h3
          className={`font-bold transition-colors group-hover:text-[#3557d3] ${titleClass} ${
            compact ? "" : "mt-2"
          }`}
        >
          {story.title}
        </h3>

        <div
          className={`flex items-center justify-between gap-3 text-[13px] ${
            compact ? "mt-3" : "mt-auto pt-5"
          }`}
        >
          <span className="min-w-0 truncate font-medium text-[#946739]">
            {authorLabel}
          </span>
          <span className="shrink-0 text-[#6f7d9f]">{dateLabel}</span>
        </div>
      </div>
    </Link>
  );
};

const MobileDetailCard = () => {
  const [activeTab, setActiveTab] = useState("specifications");
  const [activeImage, setActiveImage] = useState(0);
  const [showAllSpecs, setShowAllSpecs] = useState(true);
  const [showHeaderSummaryFull, setShowHeaderSummaryFull] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const variantInitKeyRef = useRef("");
  const recentStoreKeyRef = useRef("");
  const detailFetchKeyRef = useRef("");
  const {
    selectedDevice,
    fetchDevice,
    loading,
    error,
    smartphone,
    refreshDevices,
  } = useDevice();
  const deviceFieldProfiles = useDeviceFieldProfiles();
  const { getLogo, getStore, getStoreLogo } = useStoreLogos();
  const navigate = useNavigate();

  const params = useParams();
  const location = useLocation();
  const normalizeSeoSlug = useCallback((slugValue) => {
    const slug = String(slugValue || "")
      .toLowerCase()
      .trim();
    if (!slug) return "";
    if (slug.endsWith(SMARTPHONE_SEO_SUFFIX)) {
      return slug.slice(0, -SMARTPHONE_SEO_SUFFIX.length).replace(/-+$/g, "");
    }
    return slug;
  }, []);
  const toSeoDetailSlug = useCallback(
    (slugValue) => {
      const base = normalizeSeoSlug(slugValue);
      return base ? `${base}${SMARTPHONE_SEO_SUFFIX}` : "";
    },
    [normalizeSeoSlug],
  );
  const query = new URLSearchParams(location.search);
  const model = query.get("model");
  let id = query.get("id");
  const variantQuery = query.get("variantId") || query.get("variant_id");
  const ramParam = query.get("ram");
  const storageParam = query.get("storage");

  // Extract slug from route params (SEO-friendly slug-based URL)
  const routeSlug = params.slug || null;
  const normalizedRouteSlug = useMemo(
    () =>
      String(routeSlug || "")
        .toLowerCase()
        .trim()
        .replace(/\/+$/g, ""),
    [routeSlug],
  );
  const routeBaseSlug = useMemo(
    () => normalizeSeoSlug(routeSlug),
    [normalizeSeoSlug, routeSlug],
  );
  const canonicalRouteSlug = useMemo(
    () => (routeSlug ? toSeoDetailSlug(routeSlug) : ""),
    [routeSlug, toSeoDetailSlug],
  );
  const shouldRenderAliasNotFound = Boolean(
    routeSlug &&
    canonicalRouteSlug &&
    normalizedRouteSlug !== canonicalRouteSlug,
  );

  // Convert slug to searchable model name
  const modelFromSlug = routeBaseSlug
    ? extractNameFromSlug(routeBaseSlug)
    : null;
  const searchModel = model || modelFromSlug;

  // Try to find device locally by slug match first
  const findDeviceBySlug = useCallback(
    (slug) => {
      if (!slug || !smartphone) return null;
      const searchSlug = generateSlug(normalizeSeoSlug(slug));
      return (Array.isArray(smartphone) ? smartphone : [smartphone]).find((d) =>
        [
          d?.name,
          d?.model,
          d?.product_name,
          d?.productName,
          d?.model_number,
          d?.basic_info?.product_name,
          d?.basic_info?.model,
          d?.basic_info?.model_number,
        ].some((value) => generateSlug(normalizeSeoSlug(value)) === searchSlug),
      );
    },
    [smartphone, normalizeSeoSlug],
  );

  useEffect(() => {
    if (!canonicalRouteSlug || shouldRenderAliasNotFound) return;
    const currentPath =
      typeof window !== "undefined"
        ? window.location.pathname
        : location.pathname || "";
    const normalizedCurrentPath =
      currentPath && currentPath.length > 1
        ? currentPath.replace(/\/+$/g, "")
        : currentPath || "/";
    const desiredPath = `/smartphones/${canonicalRouteSlug}`;

    if (normalizedCurrentPath !== desiredPath) {
      navigate(`${desiredPath}${location.search || ""}`, { replace: true });
    }
  }, [
    canonicalRouteSlug,
    location.pathname,
    location.search,
    navigate,
    shouldRenderAliasNotFound,
  ]);

  useEffect(() => {
    if (shouldRenderAliasNotFound) return;
    // If an explicit numeric id is present, fetch that exact device.
    if (id) {
      fetchDevice(id);
      return;
    }

    // If we have a slug/model route, try to resolve locally first. If not
    // present, refresh the smartphone list (API fallback) so the device can be
    // resolved after the list loads.
    if (routeSlug) {
      const localDevice = findDeviceBySlug(routeSlug);
      if (localDevice) return; // already available locally

      // If devices not loaded or currently empty, trigger a refresh
      if (!Array.isArray(smartphone) || smartphone.length === 0) {
        // Refresh the full smartphone list so the slug can be resolved locally
        try {
          refreshDevices();
        } catch (e) {
          // ignore
        }
      }
    }
    // If nothing else, no-op; the global loader will fetch lists on mount.
  }, [
    id,
    routeSlug,
    searchModel,
    fetchDevice,
    findDeviceBySlug,
    smartphone,
    shouldRenderAliasNotFound,
  ]);

  // Update URL to match canonical slug-based path if needed
  useEffect(() => {
    if (shouldRenderAliasNotFound) return;
    const mobileDataLocal = selectedDevice?.smartphones?.[0] || selectedDevice;
    if (!mobileDataLocal || !routeSlug) return;

    const canonicalBaseSlug = generateSlug(
      mobileDataLocal.name ||
        mobileDataLocal.model ||
        mobileDataLocal.brand ||
        "",
    );
    const canonicalSeoSlug = toSeoDetailSlug(canonicalBaseSlug);
    if (!canonicalSeoSlug) return;

    const desiredPath = `/smartphones/${canonicalSeoSlug}`;
    const nextSearchParams = new URLSearchParams(location.search || "");
    // Clean noisy lookup/share query params from detail URL for SEO.
    [
      "id",
      "model",
      "shared",
      "variantId",
      "variant_id",
      "storeId",
      "store_id",
      "storeName",
      "store",
    ].forEach((key) => nextSearchParams.delete(key));
    const nextSearch = nextSearchParams.toString();
    const desiredUrl = `${desiredPath}${nextSearch ? `?${nextSearch}` : ""}`;
    const currentUrl = `${window.location.pathname}${window.location.search}`;

    if (currentUrl !== desiredUrl) {
      navigate(desiredUrl, { replace: true });
    }
  }, [
    selectedDevice,
    routeSlug,
    toSeoDetailSlug,
    navigate,
    location.search,
    shouldRenderAliasNotFound,
  ]);

  // Prefer a locally-resolved device (by slug) before falling back to
  // `selectedDevice` which may have been set via other flows.
  const localResolved = routeSlug ? findDeviceBySlug(routeBaseSlug) : null;
  const selectedResolved =
    selectedDevice?.smartphones?.[0] || selectedDevice || null;
  const doesDeviceMatchRoute = useCallback(
    (device) => {
      if (!device || !routeBaseSlug) return false;
      const searchSlug = generateSlug(normalizeSeoSlug(routeBaseSlug));
      return [
        device?.name,
        device?.model,
        device?.product_name,
        device?.productName,
        device?.model_number,
        device?.basic_info?.product_name,
        device?.basic_info?.model,
        device?.basic_info?.model_number,
      ].some((value) => generateSlug(normalizeSeoSlug(value)) === searchSlug);
    },
    [normalizeSeoSlug, routeBaseSlug],
  );
  const selectedResolvedForRoute = useMemo(
    () =>
      routeSlug
        ? doesDeviceMatchRoute(selectedResolved)
          ? selectedResolved
          : null
        : selectedResolved,
    [doesDeviceMatchRoute, routeSlug, selectedResolved],
  );

  useEffect(() => {
    if (shouldRenderAliasNotFound || id || !routeSlug) return;
    const resolvedId = localResolved?.id ?? localResolved?.product_id ?? null;
    if (resolvedId == null) return;
    const fetchKey = `${routeSlug}:${resolvedId}`;
    const selectedId =
      selectedResolvedForRoute?.id ??
      selectedResolvedForRoute?.product_id ??
      null;
    if (selectedId != null && String(selectedId) === String(resolvedId)) {
      detailFetchKeyRef.current = fetchKey;
      return;
    }
    if (detailFetchKeyRef.current === fetchKey) return;
    detailFetchKeyRef.current = fetchKey;
    fetchDevice(resolvedId);
  }, [
    fetchDevice,
    id,
    localResolved,
    routeSlug,
    selectedResolvedForRoute,
    shouldRenderAliasNotFound,
  ]);
  // Normalize incoming device object into a shape the UI expects.
  const detectAiPhone = (d) => {
    if (!d) return false;
    if (d.is_ai || d.ai_phone || d.isAi || d.ai) return true;
    const candidates = [
      d.features,
      d.tags,
      d.keywords,
      d.ai_features,
      d.performance?.ai_features,
      d.camera?.ai,
      d.camera?.ai_features,
      d.description,
      d.summary,
    ];
    for (const c of candidates) {
      if (!c) continue;
      if (Array.isArray(c) && c.some((x) => /ai/i.test(String(x)))) return true;
      if (typeof c === "string" && /\bai\b/i.test(c)) return true;
    }
    try {
      if (/\bai\b/i.test(JSON.stringify(d.camera || {}))) return true;
    } catch (e) {}
    return false;
  };

  const pickFirstBatteryValue = (...values) => {
    for (const value of values) {
      if (value === 0) return value;
      if (value === null || value === undefined) continue;
      if (typeof value === "string" && value.trim() === "") continue;
      return value;
    }
    return null;
  };

  const normalizeDateLikeValue = (value) => {
    if (value == null) return null;
    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : value.toISOString();
    }
    if (typeof value === "object") return null;
    const dt = new Date(value);
    return Number.isNaN(dt.getTime()) ? null : dt.toISOString();
  };

  const formatDateForDisplay = (value) => {
    const normalized = normalizeDateLikeValue(value);
    if (!normalized) return "N/A";
    try {
      return new Date(normalized).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch (e) {
      return "N/A";
    }
  };

  const normalizeLaunchStatus = (value) => {
    if (!value) return null;
    const text = String(value).trim().toLowerCase();
    if (!text) return null;
    if (/rumou?r/.test(text)) return "rumored";
    if (/announce/.test(text)) return "announced";
    if (/(pre[-\s]?order|pre[-\s]?book|prebooking|presale)/i.test(text))
      return "upcoming";
    if (/(upcoming|coming soon|expected|launching soon)/i.test(text))
      return "upcoming";
    if (/(available|on sale|in stock)/i.test(text)) return "available";
    if (/(released|launched|out now)/i.test(text)) return "released";
    return null;
  };

  const getCompareLimitForStage = (stage) => {
    if (stage === "rumored") return 0;
    if (stage === "announced") return 2;
    return 4;
  };

  const getCompetitorLimitForStage = (stage) => {
    if (stage === "rumored") return 0;
    if (stage === "announced") return 2;
    return 10;
  };

  const isSpecScoreAllowed = (stage) =>
    stage === "released" || stage === "available";

  const getSaleStartDateFromDevice = (device) => {
    if (!device) return null;
    const direct = normalizeDateLikeValue(
      device.sale_start_date ||
        device.saleStartDate ||
        device.sale_date ||
        device.saleDate ||
        null,
    );
    if (direct) return new Date(direct);

    const variants = Array.isArray(device.variants)
      ? device.variants
      : Array.isArray(device.variants_json)
        ? device.variants_json
        : [];
    for (const variant of variants) {
      const variantDate = normalizeDateLikeValue(
        variant?.sale_start_date ||
          variant?.saleStartDate ||
          variant?.sale_date ||
          variant?.saleDate ||
          null,
      );
      if (variantDate) return new Date(variantDate);
      const stores = Array.isArray(variant?.store_prices)
        ? variant.store_prices
        : Array.isArray(variant?.storePrices)
          ? variant.storePrices
          : [];
      for (const store of stores) {
        const storeDate = normalizeDateLikeValue(
          store?.sale_start_date ||
            store?.saleStartDate ||
            store?.sale_date ||
            store?.saleDate ||
            store?.available_from ||
            store?.availableFrom ||
            null,
        );
        if (storeDate) return new Date(storeDate);
      }
    }
    return null;
  };

  const getDeviceLaunchStatus = (device) => {
    if (!device) return null;
    const override = normalizeLaunchStatus(
      device.launch_status_override ||
        device.launchStatusOverride ||
        device.launch_status ||
        device.launchStatus,
    );
    if (override) return override;

    const statusHint = normalizeLaunchStatus(
      device.status || device.availability || device.badge,
    );
    if (statusHint) return statusHint;

    const saleStart = getSaleStartDateFromDevice(device);
    if (saleStart instanceof Date && !Number.isNaN(saleStart.getTime())) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return saleStart > today ? "upcoming" : "available";
    }

    const dateValue = normalizeDateLikeValue(
      device.launch_date || device.launchDate,
    );
    if (dateValue) {
      const dt = new Date(dateValue);
      if (!Number.isNaN(dt.getTime())) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (dt > today) return "upcoming";
        return "released";
      }
    }

    return "released";
  };

  const getBatteryCapacityRaw = (deviceData) => {
    if (!deviceData) return null;
    const batteryData = deviceData?.battery;
    const nested =
      batteryData && typeof batteryData === "object"
        ? pickFirstBatteryValue(
            batteryData.battery_capacity_mah,
            batteryData.battery_capacity,
            batteryData.capacity_mAh,
            batteryData.capacity_mah,
            batteryData.capacity,
            batteryData.battery,
          )
        : null;

    return pickFirstBatteryValue(
      nested,
      typeof batteryData === "string" || typeof batteryData === "number"
        ? batteryData
        : null,
      deviceData?.battery_capacity_mah,
      deviceData?.battery_capacity,
      deviceData?.batteryCapacity,
    );
  };

  const getBatteryCapacityMah = (deviceData) => {
    const raw = getBatteryCapacityRaw(deviceData);
    if (raw === null || raw === undefined) return null;
    if (typeof raw === "number" && Number.isFinite(raw)) return raw;
    const m = String(raw).match(/(\d{3,6})/);
    return m ? parseInt(m[1], 10) : null;
  };

  const parseMegapixelValue = (value) => {
    if (value == null || value === "") return null;
    if (typeof value === "number" && Number.isFinite(value)) return value;
    const str = String(value);
    const mpMatch = str.match(/(\d+(?:\.\d+)?)\s*mp/i);
    if (mpMatch) return Number(mpMatch[1]);
    const numMatch = str.match(/(\d{1,4}(?:\.\d+)?)/);
    return numMatch ? Number(numMatch[1]) : null;
  };

  const getMainCameraMp = (deviceData) => {
    if (!deviceData) return null;
    const camera = deviceData.camera || {};

    const direct = parseMegapixelValue(camera.main_camera_megapixels);
    if (direct) return Math.round(direct);

    const tryObjects = [
      camera.main_camera,
      camera.main,
      camera.primary,
      camera.rear_camera?.main_camera,
      camera.rear_camera?.main,
      camera.rear_camera?.wide,
      camera.rear_camera?.primary,
    ];

    for (const item of tryObjects) {
      if (!item) continue;
      if (typeof item === "object") {
        const nested =
          parseMegapixelValue(item.resolution) ||
          parseMegapixelValue(item.megapixels) ||
          parseMegapixelValue(item.main_camera_megapixels) ||
          parseMegapixelValue(item.sensor);
        if (nested) return Math.round(nested);
      }
      const parsed = parseMegapixelValue(item);
      if (parsed) return Math.round(parsed);
    }

    const rear = camera.rear_camera;
    if (rear && typeof rear === "object" && !Array.isArray(rear)) {
      const candidates = Object.values(rear)
        .map((lens) => {
          if (!lens) return null;
          if (typeof lens === "object") {
            return (
              parseMegapixelValue(lens.resolution) ||
              parseMegapixelValue(lens.megapixels) ||
              parseMegapixelValue(lens.main_camera_megapixels)
            );
          }
          return parseMegapixelValue(lens);
        })
        .filter((v) => Number.isFinite(v));
      if (candidates.length > 0) {
        return Math.round(Math.max(...candidates));
      }
    }

    return null;
  };

  const normalizeSmartphone = (d) => {
    if (!d) return null;
    const out = { ...d };

    out.id = d.product_id ?? d.id ?? d._id ?? null;
    out.brand = d.brand_name ?? d.brand ?? d.manufacturer ?? "";
    out.name = d.name ?? d.model ?? d.title ?? "";
    out.model = d.model ?? d.name ?? out.name;
    out.images = d.images ?? d.photos ?? d.images_urls ?? [];
    out.launch_date =
      normalizeDateLikeValue(d.launch_date) ||
      normalizeDateLikeValue(d.launchDate) ||
      normalizeDateLikeValue(d.created_at) ||
      normalizeDateLikeValue(d.createdAt);
    out.official_preorder_url =
      d.official_preorder_url ||
      d.officialPreorderUrl ||
      out.official_preorder_url ||
      null;
    out.launch_status_override =
      d.launch_status_override ||
      d.launchStatusOverride ||
      out.launch_status_override ||
      null;

    // Normalize performance (clone to avoid mutating possibly read-only objects)
    const perfSrc = d.performance || out.performance || {};
    const perf = { ...perfSrc };
    perf.processor = perf.processor || d.processor || d.cpu || "";
    if (!perf.ram) {
      perf.ram = d.performance?.ram || d.ram || "";
      if (!perf.ram && Array.isArray(d.performance?.ram_options)) {
        perf.ram = d.performance.ram_options.join(" / ");
      }
    }
    perf.operating_system =
      perf.operating_system ||
      d.performance?.operating_system ||
      d.performance?.os ||
      "";

    // Normalize storage
    perf.storage =
      perf.storage ||
      d.performance?.storage ||
      d.performance?.ROM_storage ||
      "";
    if (!perf.storage && Array.isArray(d.performance?.storage_options)) {
      perf.storage = d.performance.storage_options.join(" / ");
    }
    out.performance = perf;

    // Normalize variants
    out.variants = (d.variants || d.variant || []).map((v) => ({
      id: v.variant_id ?? v.id ?? v.variantId ?? null,
      variant_id: v.variant_id ?? v.id ?? v.variantId ?? null,
      ram: v.ram ?? v.memory ?? v.RAM ?? "",
      storage: v.storage ?? v.ROM_storage ?? v.storage_options ?? "",
      base_price: v.base_price ?? v.price ?? v.basePrice ?? null,
      store_prices: v.store_prices ?? v.storePrices ?? v.stores ?? [],
      color_name: v.color_name ?? v.color ?? v.colour ?? "",
      color_code: v.color_code ?? v.colorCode ?? v.hex ?? null,
      ...v,
    }));
    out.base_price = d.base_price ?? d.basePrice ?? out.base_price ?? null;
    out.price = d.price ?? out.price ?? null;
    out.numericPrice = d.numericPrice ?? out.numericPrice ?? null;
    out.store_prices =
      d.store_prices ?? d.storePrices ?? out.store_prices ?? [];
    out.storePrices = d.storePrices ?? d.store_prices ?? out.storePrices ?? [];

    // Pick sensible defaults for performance.ram/storage from variants if missing
    if (
      (!out.performance.ram || out.performance.ram === "") &&
      out.variants.length
    ) {
      out.performance.ram = out.variants[0].ram || out.performance.ram;
    }
    if (
      (!out.performance.storage || out.performance.storage === "") &&
      out.variants.length
    ) {
      out.performance.storage =
        out.variants[0].storage || out.performance.storage;
    }

    // Camera main megapixels heuristic
    out.camera = out.camera || {};
    // Try common camera locations (clone camera object before mutating)
    const camSrc = d.camera || out.camera || {};
    const cam = { ...camSrc };
    const parsedMainMp = getMainCameraMp(d);
    if (!cam.main_camera_megapixels && parsedMainMp != null) {
      cam.main_camera_megapixels = parsedMainMp;
    }
    out.camera = cam;

    // Normalize battery capacity in mAh (clone to avoid mutating originals)
    const battSrc = d.battery || out.battery || {};
    const batt = { ...battSrc };
    const capRaw = getBatteryCapacityRaw(d);
    const capMah = getBatteryCapacityMah(d);
    if (capRaw != null) {
      if (!batt.battery_capacity_mah && capMah != null) {
        batt.battery_capacity_mah = capMah;
      }
      if (!batt.capacity) {
        batt.capacity = capRaw;
      }
      if (!batt.battery) {
        batt.battery = d.battery?.battery ?? capRaw;
      }
      if (!batt.battery_capacity && d.battery?.battery_capacity != null) {
        batt.battery_capacity = d.battery.battery_capacity;
      }
    }
    out.battery = batt;

    // Keep other friendly aliases (connectivity/network/ports/audio/sensors)
    out.connectivity = out.connectivity || d.connectivity || {};
    out.network = out.network || d.network || {};
    out.ports = out.ports || d.ports || {};
    out.audio = out.audio || d.audio || {};
    out.multimedia = out.multimedia || d.multimedia || {};
    out.build_design = out.build_design || d.build_design || d.design || {};
    out.sensors = Array.isArray(d.sensors)
      ? d.sensors
      : typeof d.sensors === "string"
        ? [d.sensors]
        : out.sensors || [];

    // Provide UI-friendly JSON shapes for components (follow the provided UI type rules)
    out.display_json =
      d.display_json ||
      d.display ||
      (d.screen || d.screen_size
        ? {
            size: d.display?.size || d.screen_size || d.screen || "",
            resolution: d.display?.resolution || d.resolution || "",
            refresh_rate: d.display?.refresh_rate || d.refresh_rate || "",
            touch_sampling_rate:
              d.display?.touch_sampling_rate || d.touch_sampling_rate || "",
            screen_to_body_ratio:
              d.display?.screen_to_body_ratio || d.screen_to_body_ratio || "",
            panel: d.display?.panel || d.panel || "",
            pixel_density: d.display?.pixel_density || d.pixel_density || "",
            brightness: d.display?.brightness || d.brightness || {},
            color_gamut: d.display?.color_gamut || {},
            color_depth: d.display?.color_depth || "",
            protection: d.display?.protection || "",
            ai_features: d.display?.ai_features || [],
          }
        : d.display_json || {});

    out.performance_json =
      d.performance_json ||
      d.performance ||
      (perf
        ? {
            operating_system: perf.operating_system || perf.os || "",
            processor: perf.processor || perf.cpu || "",
            cpu: perf.cpu || perf.processor || "",
            gpu: perf.gpu || "",
            ram_type: d.ram_type || perf.ram_type || "",
            storage_type: d.storage_type || perf.storage_type || "",
            ram: perf.ram || "",
            storage: perf.storage || "",
            ai_features: d.performance?.ai_features || [],
          }
        : {});

    out.battery_json =
      d.battery_json ||
      d.battery ||
      (batt
        ? {
            capacity: batt.battery_capacity_mah
              ? `${batt.battery_capacity_mah} mAh`
              : batt.capacity || batt.battery || "",
            rated_capacity: batt.rated_capacity || "",
            fast_charging: batt.fast_charging || d.fast_charging || "",
            ai_features: batt.ai_features || [],
          }
        : {});

    out.camera_json =
      d.camera_json ||
      d.camera ||
      (d.camera || cam
        ? {
            rear_camera:
              d.camera?.rear_camera ||
              camSrc?.rear_camera ||
              cam?.rear_camera ||
              d.camera?.rear ||
              cam?.rear ||
              cam,
            front_camera:
              d.camera?.front_camera || d.front_camera || cam?.front || {},
            shooting_modes: d.camera?.shooting_modes || d.shooting_modes || {},
            ai_features: d.camera?.ai_features || d.ai_features || [],
          }
        : {});

    out.multimedia_json = d.multimedia_json || d.multimedia || d.media || {};

    out.connectivity_json =
      d.connectivity_json || out.connectivity || d.connectivity || {};

    out.network_json = d.network_json || out.network || d.network || {};

    out.positioning_json =
      d.positioning_json || d.positioning || out.positioning || {};

    out.variants_json =
      d.variants_json ||
      (Array.isArray(d.variants) && d.variants.length
        ? d.variants.map((v) => ({
            ram: v.ram || v.memory || "",
            storage: v.storage || v.ROM_storage || "",
            base_price: v.base_price ?? v.price ?? null,
            variant_id: v.variant_id ?? v.id ?? v.variantId ?? null,
            store_prices: v.store_prices || v.storePrices || v.stores || [],
            color_name: v.color_name || v.color || v.colour || "",
            color_code: v.color_code || v.colorCode || v.hex || null,
          }))
        : out.variants || []);

    const mergeAi = new Set([
      ...(d.ai_features_json || d.ai_features || []),
      ...(d.performance?.ai_features || []),
      ...(d.camera?.ai_features || []),
      ...(d.multimedia?.ai_features || []),
    ]);
    out.ai_features_json = Array.from(mergeAi).filter(Boolean);

    out.isAiPhone = detectAiPhone(d);

    out.images_json = d.images_json || d.images || out.images || [];

    out.build_design_json = d.build_design_json ||
      d.design ||
      out.build_design || {
        height: d.height || d.dimensions?.height || "",
        width: d.width || d.dimensions?.width || "",
        thickness: d.thickness || d.dimensions?.thickness || [],
        weight: d.weight || "",
        colors: d.colors || out.colors || [],
        water_dust_resistance: d.water_dust_resistance || d.ip_rating || "",
      };

    out.sensors = Array.isArray(d.sensors)
      ? d.sensors
      : typeof d.sensors === "string"
        ? [d.sensors]
        : out.sensors || [];

    out.biometrics = d.biometrics || out.biometrics || {};
    const profileResult = resolveDeviceFieldProfile(
      "smartphone",
      out,
      deviceFieldProfiles,
    );
    out.field_profile = profileResult;
    const canShowSpecScore = isSpecScoreAllowed(getDeviceLaunchStatus(out));
    if (!canShowSpecScore) {
      out.spec_score = null;
      out.specScore = null;
      out.spec_score_v2 = null;
      out.specScoreV2 = null;
      out.spec_score_display = null;
      out.specScoreDisplay = null;
      out.spec_score_v2_display_80_98 = null;
      out.specScoreV2Display8098 = null;
      out.overall_score = null;
      out.overallScore = null;
      out.overall_score_v2 = null;
      out.overallScoreV2 = null;
      out.overall_score_display = null;
      out.overallScoreDisplay = null;
      out.overall_score_v2_display_80_98 = null;
      out.overallScoreV2Display8098 = null;
    } else if (
      out.spec_score == null &&
      out.overall_score == null &&
      out.hook_score == null
    ) {
      out.spec_score = profileResult.score;
      out.overall_score = profileResult.score;
    }

    return out;
  };

  const mobileData = useMemo(
    () =>
      normalizeSmartphone(
        selectedResolvedForRoute || localResolved || selectedResolved,
      ),
    [localResolved, selectedResolved, selectedResolvedForRoute],
  );
  const carouselImages = Array.isArray(mobileData?.images)
    ? mobileData.images.filter(Boolean)
    : [];

  useEffect(() => {
    setActiveImage(0);
  }, [mobileData]);

  const goToPreviousImage = useCallback(() => {
    if (carouselImages.length <= 1) return;
    setActiveImage(
      (current) =>
        (current - 1 + carouselImages.length) % carouselImages.length,
    );
  }, [carouselImages.length]);

  const goToNextImage = useCallback(() => {
    if (carouselImages.length <= 1) return;
    setActiveImage((current) => (current + 1) % carouselImages.length);
  }, [carouselImages.length]);

  useEffect(() => {
    if (carouselImages.length <= 1) {
      if (activeImage !== 0) setActiveImage(0);
      return;
    }
    if (activeImage >= carouselImages.length) {
      setActiveImage(0);
    }
  }, [activeImage, carouselImages.length]);

  useEffect(() => {
    if (carouselImages.length <= 1) return;
    const intervalId = window.setInterval(() => {
      setActiveImage((current) => (current + 1) % carouselImages.length);
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [carouselImages.length]);

  const launchStatus = useMemo(
    () => getDeviceLaunchStatus(mobileData),
    [mobileData],
  );
  const serverPolicy = useMemo(() => {
    const allowCompareRaw =
      mobileData?.allowCompare ?? mobileData?.allow_compare ?? null;
    const allowCompetitorsRaw =
      mobileData?.allowCompetitors ?? mobileData?.allow_competitors ?? null;
    const allowSpecScoreRaw =
      mobileData?.allowSpecScore ?? mobileData?.allow_spec_score ?? null;
    const compareLimitRaw = Number(
      mobileData?.compareLimit ?? mobileData?.compare_limit ?? NaN,
    );
    const competitorLimitRaw = Number(
      mobileData?.competitorLimit ?? mobileData?.competitor_limit ?? NaN,
    );

    return {
      allowCompare:
        typeof allowCompareRaw === "boolean" ? allowCompareRaw : null,
      allowCompetitors:
        typeof allowCompetitorsRaw === "boolean" ? allowCompetitorsRaw : null,
      allowSpecScore:
        typeof allowSpecScoreRaw === "boolean" ? allowSpecScoreRaw : null,
      compareLimit: Number.isFinite(compareLimitRaw) ? compareLimitRaw : null,
      competitorLimit: Number.isFinite(competitorLimitRaw)
        ? competitorLimitRaw
        : null,
    };
  }, [mobileData]);
  const launchStatusLabel = useMemo(() => {
    if (!launchStatus) return null;
    if (launchStatus === "rumored") return "RUMORED";
    if (launchStatus === "announced") return "ANNOUNCED";
    if (launchStatus === "upcoming") return "UPCOMING";
    if (launchStatus === "available") return "AVAILABLE";
    if (launchStatus === "released") return "RELEASED";
    return String(launchStatus).toUpperCase();
  }, [launchStatus]);
  const launchStatusBadgeClass = useMemo(() => {
    if (launchStatus === "rumored") {
      return "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
    }
    if (launchStatus === "announced") {
      return "bg-blue-50 text-blue-700 ring-1 ring-blue-200";
    }
    if (launchStatus === "upcoming") {
      return "bg-sky-50 text-sky-700 ring-1 ring-sky-200";
    }
    if (launchStatus === "available") {
      return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
    }
    if (launchStatus === "released") {
      return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
    }
    return "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
  }, [launchStatus]);
  const launchDateRaw =
    mobileData?.launch_date ?? mobileData?.launchDate ?? null;
  const launchDateParsed = launchDateRaw ? new Date(launchDateRaw) : null;
  const hasLaunchDate =
    Boolean(launchDateRaw) &&
    !Number.isNaN(launchDateParsed?.getTime?.() ?? Number.NaN);
  const compareLimit = useMemo(() => {
    if (serverPolicy.allowCompare === false) return 0;
    if (Number.isFinite(serverPolicy.compareLimit))
      return serverPolicy.compareLimit;
    return getCompareLimitForStage(launchStatus);
  }, [launchStatus, serverPolicy]);
  const compareDisabled = compareLimit === 0;
  const competitorLimit = useMemo(() => {
    if (serverPolicy.allowCompetitors === false) return 0;
    if (Number.isFinite(serverPolicy.competitorLimit))
      return serverPolicy.competitorLimit;
    return getCompetitorLimitForStage(launchStatus);
  }, [launchStatus, serverPolicy]);
  const allowSpecScore =
    typeof serverPolicy.allowSpecScore === "boolean"
      ? serverPolicy.allowSpecScore
      : isSpecScoreAllowed(launchStatus);
  const SpecScoreBadge = allowSpecScore ? BaseSpecScoreBadge : HiddenScoreBadge;
  const headerSpecScoreValue = useMemo(() => {
    if (!allowSpecScore || !mobileData) return null;
    const rawValue = Number(resolveSmartphoneBadgeScore(mobileData));
    return Number.isFinite(rawValue) ? Math.round(rawValue) : null;
  }, [allowSpecScore, mobileData]);
  const headerSpecScoreBlock =
    headerSpecScoreValue != null ? (
      <div className="flex items-end gap-1 leading-none">
        <span className="text-3xl font-semibold leading-none text-blue-600">
          {headerSpecScoreValue}
        </span>
        <div className="flex flex-col items-start leading-none">
          <span className="text-[8px] font-semibold uppercase tracking-[0.32em] text-blue-400">
            Spec
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-blue-500">
            Score
          </span>
        </div>
      </div>
    ) : null;
  const pickScore100 = useCallback((...values) => {
    for (const value of values) {
      const normalized = normalizeScore100(value);
      if (normalized != null) return normalized;
    }
    return null;
  }, []);
  const buildScoreSummary = useCallback(
    (deviceData, options = {}) => {
      if (!deviceData) {
        return {
          overall: null,
          overallDisplay: null,
          sections: [],
        };
      }

      const {
        allowProfileSectionFallback = true,
        allowProfileOverallFallback = true,
        allowSectionAverageFallback = true,
        allowFallbackPersistedScores = true,
      } = options;

      const normalizeScoreSource = (value) =>
        String(value || "")
          .trim()
          .toLowerCase();
      const resolvePersistedScore = (value, source) => {
        const normalized = normalizeScore100(value);
        if (normalized == null) return null;

        const sourceKey = normalizeScoreSource(source);
        if (
          normalized === 0 &&
          (!sourceKey || sourceKey.includes("unavailable"))
        ) {
          return null;
        }
        if (
          !allowFallbackPersistedScores &&
          sourceKey &&
          sourceKey.includes("fallback")
        ) {
          return null;
        }

        return normalized;
      };

      const sphereRating =
        deviceData.sphere_rating ||
        deviceData.ratings ||
        deviceData.rating_json ||
        {};
      const specScoreV2Source =
        deviceData.spec_score_v2_source ?? deviceData.specScoreV2Source;
      const overallScoreV2Source =
        deviceData.overall_score_v2_source ?? deviceData.overallScoreV2Source;
      const specScoreSource =
        deviceData.spec_score_source ?? deviceData.specScoreSource;
      const overallScoreSource =
        deviceData.overall_score_source ?? deviceData.overallScoreSource;
      const persistedSpecScore = pickScore100(
        resolvePersistedScore(deviceData.spec_score_v2, specScoreV2Source),
        resolvePersistedScore(deviceData.specScoreV2, specScoreV2Source),
        resolvePersistedScore(deviceData.spec_score, specScoreSource),
        resolvePersistedScore(deviceData.specScore, specScoreSource),
      );
      const persistedOverallScore = pickScore100(
        resolvePersistedScore(
          deviceData.overall_score_v2,
          overallScoreV2Source,
        ),
        resolvePersistedScore(deviceData.overallScoreV2, overallScoreV2Source),
        resolvePersistedScore(deviceData.overall_score, overallScoreSource),
        resolvePersistedScore(deviceData.overallScore, overallScoreSource),
      );
      const persistedOverallScoreDisplay = pickScore100(
        resolvePersistedScore(
          deviceData.overall_score_v2_display_80_98,
          overallScoreV2Source,
        ),
        resolvePersistedScore(
          deviceData.overallScoreV2Display8098,
          overallScoreV2Source,
        ),
        resolvePersistedScore(
          deviceData.spec_score_v2_display_80_98,
          specScoreV2Source,
        ),
        resolvePersistedScore(
          deviceData.specScoreV2Display8098,
          specScoreV2Source,
        ),
        resolvePersistedScore(deviceData.spec_score_display, specScoreSource),
        resolvePersistedScore(deviceData.specScoreDisplay, specScoreSource),
        resolvePersistedScore(
          deviceData.overall_score_display,
          overallScoreSource,
        ),
        resolvePersistedScore(
          deviceData.overallScoreDisplay,
          overallScoreSource,
        ),
      );

      const sections = [
        {
          key: "performance",
          label: "Performance",
          icon: FaBolt,
          fillColor: "#6d28d9",
          score: pickScore100(
            deviceData.performance?.score,
            deviceData.performance_json?.score,
            sphereRating?.performance?.score,
            sphereRating?.performance,
            allowProfileSectionFallback
              ? deviceData.field_profile?.section_scores?.core
              : null,
          ),
        },
        {
          key: "display",
          label: "Display",
          icon: FaExpand,
          fillColor: "#2563eb",
          score: pickScore100(
            deviceData.display?.score,
            deviceData.display_json?.score,
            sphereRating?.display?.score,
            sphereRating?.display,
            allowProfileSectionFallback
              ? deviceData.field_profile?.section_scores?.display
              : null,
          ),
        },
        {
          key: "camera",
          label: "Camera",
          icon: FaCamera,
          fillColor: "#0d9488",
          score: pickScore100(
            deviceData.camera?.score,
            deviceData.camera_json?.score,
            sphereRating?.camera?.score,
            sphereRating?.camera,
          ),
        },
        {
          key: "battery",
          label: "Battery",
          icon: FaBatteryFull,
          fillColor: "#059669",
          score: pickScore100(
            deviceData.battery?.score,
            deviceData.battery_json?.score,
            sphereRating?.battery?.score,
            sphereRating?.battery,
            allowProfileSectionFallback
              ? deviceData.field_profile?.section_scores?.core
              : null,
          ),
        },
        {
          key: "network",
          label: "Network",
          icon: FaWifi,
          fillColor: "#7c3aed",
          score: pickScore100(
            deviceData.network?.score,
            deviceData.network_json?.score,
            deviceData.connectivity?.score,
            deviceData.connectivity_json?.score,
            sphereRating?.network?.score,
            sphereRating?.connectivity?.score,
            sphereRating?.network,
            sphereRating?.connectivity,
          ),
        },
      ];

      const numericSectionScores = sections
        .map((section) => section.score)
        .filter((score) => Number.isFinite(score) && score > 0);
      const sectionAverage =
        numericSectionScores.length > 0
          ? numericSectionScores.reduce((sum, score) => sum + score, 0) /
            numericSectionScores.length
          : null;

      const overall = pickScore100(
        persistedOverallScore,
        persistedSpecScore,
        allowProfileOverallFallback ? deviceData.field_profile?.score : null,
        allowSectionAverageFallback ? sectionAverage : null,
      );
      const overallDisplay =
        persistedOverallScoreDisplay != null
          ? persistedOverallScoreDisplay
          : remapScoreToBand(overall, 80, 98);

      return {
        overall,
        overallDisplay,
        sections,
      };
    },
    [pickScore100],
  );
  const scoreSummary = useMemo(() => {
    if (!mobileData || !allowSpecScore) {
      return {
        overall: null,
        overallDisplay: null,
        sections: [],
      };
    }
    return buildScoreSummary(mobileData, {
      allowProfileSectionFallback: true,
      allowProfileOverallFallback: false,
      allowSectionAverageFallback: true,
      allowFallbackPersistedScores: true,
    });
  }, [mobileData, buildScoreSummary, allowSpecScore]);
  const getSectionScore = useCallback(
    (key) => {
      if (!key || key === "overall") return scoreSummary.overall;
      const matched = scoreSummary.sections.find(
        (section) => section.key === key,
      );
      return matched?.score ?? scoreSummary.overall;
    },
    [scoreSummary],
  );
  const getSectionScoreDisplay = useCallback(
    (key) => {
      if (!allowSpecScore) return null;
      if (!key || key === "overall") {
        return resolveSmartphoneBadgeScore(mobileData);
      }
      const matched = scoreSummary.sections.find(
        (section) => section.key === key,
      );
      return matched?.score ?? scoreSummary.overall;
    },
    [allowSpecScore, mobileData, scoreSummary],
  );

  const smartphoneTabTitle = mobileData?.name
    ? smartphoneMeta.title({
        name: mobileData?.name || mobileData?.model || "",
        brand: mobileData?.brand || mobileData?.brand_name || "",
      })
    : `Smartphone Details - See full specifications, price & more (${CURRENT_MONTH_YEAR}) - Hooks`;

  useTitle({
    page: smartphoneTabTitle,
    siteName: "",
  });

  useEffect(() => {
    if (error) console.error("Device fetch error:", error);
  }, [error]);

  // While fetching, show spinner to avoid null access to `mobileData`
  const showInitialLoading = loading && !mobileData;

  const variants = useMemo(
    () =>
      mobileData?.variants ?? (mobileData?.variant ? [mobileData.variant] : []),
    [mobileData],
  );
  const variantsSignature = useMemo(
    () =>
      (variants || [])
        .map((v, index) =>
          [
            v?.variant_id ?? v?.id ?? v?.variantId ?? `idx-${index}`,
            v?.ram ?? "",
            v?.storage ?? "",
            v?.base_price ?? "",
            Array.isArray(v?.store_prices) ? v.store_prices.length : 0,
          ].join("|"),
        )
        .join("::"),
    [variants],
  );

  useEffect(() => {
    if (selectedVariant >= variants.length) setSelectedVariant(0);
  }, [variants.length, selectedVariant]);

  useEffect(() => {
    if (!variants || variants.length === 0) return;
    const productKey = String(
      mobileData?.id ??
        mobileData?.product_id ??
        routeSlug ??
        searchModel ??
        "",
    );
    const initKey = [
      productKey,
      variantQuery ?? "",
      ramParam ?? "",
      storageParam ?? "",
      variantsSignature,
    ].join("::");
    if (variantInitKeyRef.current === initKey) return;
    variantInitKeyRef.current = initKey;

    let nextVariantIndex = -1;

    if (variantQuery) {
      const idx = variants.findIndex(
        (v) =>
          String(v.variant_id ?? v.id ?? v.variantId) === String(variantQuery),
      );
      if (idx >= 0) nextVariantIndex = idx;
    }
    // If ram/storage params provided, prefer matching variant
    if (
      nextVariantIndex < 0 &&
      (ramParam || storageParam) &&
      variants.length > 0
    ) {
      const idx = variants.findIndex((v) => {
        const ramOk = ramParam
          ? String(v.ram).toLowerCase() === String(ramParam).toLowerCase()
          : true;
        const storageOk = storageParam
          ? String(v.storage).toLowerCase() ===
            String(storageParam).toLowerCase()
          : true;
        return ramOk && storageOk;
      });
      if (idx >= 0) nextVariantIndex = idx;
    }

    if (nextVariantIndex >= 0) setSelectedVariant(nextVariantIndex);
  }, [
    variants,
    variantsSignature,
    variantQuery,
    ramParam,
    storageParam,
    mobileData?.id,
    mobileData?.product_id,
    routeSlug,
    searchModel,
  ]);

  const currentVariant = variants?.[selectedVariant];
  const currentVariantNumericPrice = resolveVariantNumericPrice(currentVariant);
  const currentDeviceNumericPrice = resolveDeviceNumericPrice(mobileData);
  const resolvedCurrentNumericPrice =
    currentVariantNumericPrice > 0
      ? currentVariantNumericPrice
      : currentDeviceNumericPrice;
  const currentPriceDisplay =
    resolvedCurrentNumericPrice > 0
      ? `₹ ${formatPrice(resolvedCurrentNumericPrice)}`
      : "";
  const currentProductId =
    mobileData?.id ?? mobileData?.product_id ?? mobileData?.productId ?? null;
  const { stories: linkedNewsStories } = usePublicNewsFeed({
    limit: LINKED_NEWS_LIMIT,
    category: "",
    productId: currentProductId,
    enabled: Boolean(currentProductId),
  });
  const exactLinkedNewsStories = useMemo(() => {
    const resolvedProductId = Number(currentProductId);
    if (!Number.isInteger(resolvedProductId) || resolvedProductId <= 0) {
      return [];
    }

    return linkedNewsStories.filter((story) => {
      const storyProductId = Number(story?.productId);
      const storyProductType = String(story?.productType || "")
        .trim()
        .toLowerCase();

      return (
        Number.isInteger(storyProductId) &&
        storyProductId === resolvedProductId &&
        Boolean(story?.productLinked) &&
        (!storyProductType || storyProductType === "smartphone")
      );
    });
  }, [currentProductId, linkedNewsStories]);
  const linkedNewsHeroStory = exactLinkedNewsStories[0] || null;
  const linkedNewsSecondaryStories = exactLinkedNewsStories.slice(1, 3);
  const linkedNewsHeading =
    mobileData?.name || mobileData?.model || "Smartphone";
  const shouldShowLinkedNews = exactLinkedNewsStories.length > 0;
  const currentVariantStoreRows = useMemo(() => {
    const variantRows = getRenderableStorePriceRows(currentVariant);
    if (variantRows.length > 0) return variantRows;

    const deviceRows = getRenderableStorePriceRows(mobileData);
    if (deviceRows.length > 0) return deviceRows;

    return [];
  }, [currentVariant, mobileData]);

  useEffect(() => {
    const pid = Number(currentProductId);
    if (!Number.isInteger(pid) || pid <= 0) return;

    try {
      const viewedKey = `viewed_product_${pid}`;
      if (
        typeof sessionStorage !== "undefined" &&
        sessionStorage.getItem(viewedKey)
      ) {
        return;
      }

      fetch(`https://api.apisphere.in/api/public/product/${pid}/view`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }).catch((err) => console.error("View insert failed", err));

      try {
        if (typeof sessionStorage !== "undefined") {
          sessionStorage.setItem(viewedKey, "true");
        }
      } catch {}
    } catch (err) {
      console.error("Product view tracking error:", err);
    }
  }, [currentProductId]);

  usePageEngagementTracker({
    productId: currentProductId,
    pagePath:
      typeof window !== "undefined" ? window.location.pathname : "/smartphones",
    source: "smartphone-detail",
    enabled: Boolean(currentProductId),
  });

  useEffect(() => {
    if (!currentProductId || !mobileData || typeof window === "undefined") {
      return;
    }

    const entry = {
      id: currentProductId,
      name:
        mobileData?.name || mobileData?.model || mobileData?.brand || "Device",
      brand:
        mobileData?.brand ||
        mobileData?.brand_name ||
        mobileData?.manufacturer ||
        "",
      image:
        mobileData?.images?.[0] ||
        mobileData?.image ||
        mobileData?.image_url ||
        "",
      price: currentPriceDisplay || null,
      segment: mobileData?.category || mobileData?.product_type || "smartphone",
      processor:
        mobileData?.performance?.processor ||
        mobileData?.processor ||
        mobileData?.cpu ||
        "",
      cameraMp: getMainCameraMp(mobileData),
      ram:
        currentVariant?.ram ||
        mobileData?.performance?.ram ||
        mobileData?.ram ||
        "",
      storage:
        currentVariant?.storage ||
        mobileData?.performance?.storage ||
        mobileData?.storage ||
        "",
      visitedAt: Date.now(),
    };

    const entryKey = String(entry.id || "");
    if (recentStoreKeyRef.current === entryKey) return;
    recentStoreKeyRef.current = entryKey;

    try {
      const raw = window.localStorage.getItem(RECENT_STORAGE_KEY);
      const parsed = JSON.parse(raw || "[]");
      const list = Array.isArray(parsed) ? parsed : [];
      const next = [
        entry,
        ...list.filter((item) => String(item?.id) !== String(entry.id)),
      ].slice(0, MAX_RECENT_ITEMS);
      window.localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore storage errors
    }
  }, [currentProductId, mobileData, currentVariant]);

  const popularComparisonTargets = useMemo(() => {
    const list = Array.isArray(smartphone) ? smartphone : [];
    if (!currentProductId || list.length === 0) return [];

    const normalizePrice = (d) => {
      const vars = Array.isArray(d?.variants) ? d.variants : [];
      const raw = vars?.[0]?.base_price ?? d?.base_price ?? d?.price ?? null;
      const n = Number(raw);
      return Number.isFinite(n) ? n : null;
    };

    const normalized = list
      .map((d) => normalizeSmartphone(d))
      .filter(Boolean)
      .filter((d) => String(d.id ?? "") !== String(currentProductId));

    const currentBrand = String(mobileData?.brand || "").toLowerCase();

    return normalized
      .map((d) => {
        const brand = String(d.brand || "").toLowerCase();
        const sameBrand = Boolean(currentBrand && brand === currentBrand);
        const rating = Number(d.rating ?? d.avg_rating ?? 0) || 0;
        const price = normalizePrice(d);
        return { d, sameBrand, rating, price };
      })
      .sort((a, b) => {
        if (a.sameBrand !== b.sameBrand) return a.sameBrand ? -1 : 1;
        if (b.rating !== a.rating) return b.rating - a.rating;
        if (a.price == null && b.price != null) return 1;
        if (a.price != null && b.price == null) return -1;
        if (a.price != null && b.price != null) return a.price - b.price;
        return 0;
      })
      .slice(0, 6)
      .map((x) => x.d);
  }, [smartphone, currentProductId, mobileData?.brand]);

  const handlePopularCompare = useCallback(
    (other) => {
      if (compareDisabled) return;
      const otherId =
        other?.id ?? other?.product_id ?? other?.productId ?? null;
      if (!currentProductId || !otherId) return;
      navigate(`/compare?devices=${currentProductId}:0,${otherId}:0`, {
        state: { initialProduct: mobileData },
      });
    },
    [navigate, currentProductId, mobileData, compareDisabled],
  );

  const toNormalCase = (raw) => {
    if (raw == null) return "";
    const ACRONYMS = new Set([
      "MP",
      "FOV",
      "ROM",
      "RAM",
      "NFC",
      "GPS",
      "USB",
      "AI",
      "OS",
      "GPU",
      "CPU",
      "Hz",
      "FPS",
      "GB",
      "mah",
      "Ghz",
      "cm",
      "gm",
      "IP",
      "5g",
      "K",
      "X",
      "Li-on",
    ]);

    let s = String(raw);
    s = s.replace(/_/g, " ").replace(/([a-z0-9])([A-Z])/g, "$1 $2");

    const parts = s.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);

    const normalized = parts
      .map((w) => {
        const clean = w.replace(/[^a-zA-Z0-9/()-]/g, "");
        const upper = clean.toUpperCase();
        if (ACRONYMS.has(upper)) return upper;
        if (/\d/.test(w) || /\//.test(w) || /[()\-]/.test(w)) {
          return w.charAt(0).toUpperCase() + w.slice(1);
        }
        return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
      })
      .join(" ");

    return normalized;
  };

  const formatSpecValue = (value, key) => {
    if (value == null || value === "") return "Not specified";
    if (Array.isArray(value)) return value.join(", ");
    if (typeof value === "object") {
      const parts = Object.entries(value)
        .map(([k, v]) => {
          if (v == null || v === "") return null;
          if (Array.isArray(v)) return `${toNormalCase(k)}: ${v.join(", ")}`;
          if (typeof v === "object")
            return `${toNormalCase(k)}: ${JSON.stringify(v)}`;
          return `${toNormalCase(k)}: ${String(v)}`;
        })
        .filter(Boolean);
      return parts.length ? parts.join(" | ") : JSON.stringify(value);
    }
    if (value === true) return "âœ“ Yes";
    if (value === false) return "âœ— No";
    return String(value);
  };

  const normalizeSpecToken = (value) =>
    String(value ?? "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

  const getLogicalSpecKey = (key, formattedValue = "") => {
    const token = normalizeSpecToken(key);
    const valueText = String(formattedValue ?? "").toLowerCase();
    const looksLikeMah =
      /(\d{3,6})\s*mah/.test(valueText) || /^\d{3,6}$/.test(valueText.trim());

    // Treat battery aliases as one logical key when they represent capacity.
    if (
      [
        "capacity",
        "capacitymah",
        "batterycapacity",
        "batterycapacitymah",
        "batterymah",
      ].includes(token)
    ) {
      return "batterycapacity";
    }
    if (token === "battery" && looksLikeMah) return "batterycapacity";

    // Main camera aliases (including computed MP field).
    if (
      ["maincamera", "maincameramegapixels", "primarycamera"].includes(token)
    ) {
      return "maincamera";
    }

    return token;
  };

  const normalizeSpecValueForCompare = (value) =>
    String(value ?? "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();

  const dedupeSpecEntries = (entries = []) => {
    const seen = new Set();
    const unique = [];

    for (const [key, value] of entries) {
      const formatted = formatSpecValue(value, key);
      const logicalKey = getLogicalSpecKey(key, formatted);
      const normalizedValue = normalizeSpecValueForCompare(formatted);
      const signature = `${logicalKey}::${normalizedValue}`;
      if (seen.has(signature)) continue;
      seen.add(signature);
      unique.push([key, value]);
    }

    return unique;
  };

  const dedupeSpecRowsByLabel = (rows = []) => {
    const scoreValue = (value) => {
      const text = String(value ?? "");
      const structuredBonus =
        (text.includes("|") ? 60 : 0) +
        (text.includes(":") ? 30 : 0) +
        (/\b(focus|sensor|aperture|resolution|fov)\b/i.test(text) ? 30 : 0);
      return text.length + structuredBonus;
    };

    const byKey = new Map();
    for (const row of rows) {
      const [label, value] = row;
      const logicalKey = getLogicalSpecKey(label, value);
      const existing = byKey.get(logicalKey);
      if (!existing || scoreValue(value) > scoreValue(existing[1])) {
        byKey.set(logicalKey, row);
      }
    }
    return Array.from(byKey.values());
  };

  const isPrimitive = (v) =>
    v == null || (typeof v !== "object" && typeof v !== "function");

  const isLikelyModelCode = (value) => {
    if (!value) return false;
    const s = String(value).trim();
    if (!s || /\s/.test(s)) return false;
    return /^(?:[a-z]{0,3})?[a-z]+[-]?\d+[a-z0-9-]*$/i.test(s);
  };

  const getDisplayProductName = (data) => {
    if (!data) return "";
    const preferred = String(data.name || data.title || "").trim();
    if (preferred) return preferred;

    const model = String(data.model || "").trim();
    if (!model) return "";
    if (isLikelyModelCode(model)) {
      return String(data.brand || data.brand_name || "").trim();
    }
    return model;
  };

  // Build descriptive title for visible heading and meta title (exclude brand)
  const buildDescriptiveTitle = (data, variant) => {
    if (!data) return "";

    const displayName = getDisplayProductName(data);

    const processorRaw =
      variant?.processor || data.performance?.processor || data.processor || "";
    const processor =
      !isPrimitive(processorRaw) || processorRaw === ""
        ? ""
        : formatSpecValue(processorRaw, "processor")
            .replace(/\s+/g, " ")
            .trim();

    // ðŸ‘‰ Format RAM properly (ignore non-primitive inputs)
    const ramRaw = variant?.ram || data.performance?.ram || "";
    const ram =
      !isPrimitive(ramRaw) || ramRaw === ""
        ? ""
        : String(ramRaw).toUpperCase().includes("GB")
          ? `${ramRaw} RAM`
          : `${ramRaw}GB RAM`;

    // ðŸ‘‰ Format Storage properly (ignore non-primitive inputs)
    const storageRaw =
      variant?.storage ||
      data.performance?.storage ||
      data.performance?.ROM_storage ||
      "";
    const storage =
      !isPrimitive(storageRaw) || storageRaw === ""
        ? ""
        : String(storageRaw).toUpperCase().includes("GB")
          ? `${storageRaw} Storage`
          : `${storageRaw}GB Storage`;

    // Camera formatting
    const cameraMPValue = getMainCameraMp(data);
    const cameraRaw = data.camera?.main_camera || data.camera || "";
    const camera = cameraMPValue
      ? `${cameraMPValue}MP Camera`
      : !isPrimitive(cameraRaw) || cameraRaw === ""
        ? ""
        : formatSpecValue(cameraRaw, "camera");

    // ðŸ‘‰ Battery formatting (ignore non-primitive inputs)
    const batteryValue = getBatteryCapacityMah(data);
    const batteryRaw = getBatteryCapacityRaw(data) ?? "";
    const battery = batteryValue
      ? `${batteryValue}mAh Battery`
      : !isPrimitive(batteryRaw) || batteryRaw === ""
        ? ""
        : formatSpecValue(batteryRaw, "battery");

    const primary = displayName;

    const specs = [];

    if (processor) specs.push(processor);

    if (ram || storage) {
      specs.push([ram, storage].filter(Boolean).join(" / "));
    }

    if (camera) specs.push(camera);

    if (battery) specs.push(battery);

    return specs.length ? `${primary} - ${specs.join(" ")}` : primary;
  };

  const buildMetaDescription = (data, variant) => {
    if (!data) return "";

    const brand = data.brand || data.brand_name || data.manufacturer || "";
    const name = getDisplayProductName(data);
    const identity =
      brand && name
        ? name.toLowerCase().includes(brand.toLowerCase())
          ? name
          : `${brand} ${name}`
        : name || brand || "";
    if (!identity) return "";

    const processorRaw =
      variant?.processor || data.performance?.processor || data.processor || "";
    const processor =
      !isPrimitive(processorRaw) || processorRaw === ""
        ? ""
        : getCompactProcessorLabel(processorRaw);

    const ramRaw = variant?.ram || data.performance?.ram || "";
    const ram = normalizeMemoryLabel(ramRaw);

    const storageRaw =
      variant?.storage ||
      data.performance?.storage ||
      data.performance?.ROM_storage ||
      "";
    const storage = normalizeMemoryLabel(storageRaw);

    const cameraValue = getMainCameraMp(data);
    const cameraRaw = data.camera?.main_camera || data.camera || "";
    const camera =
      cameraValue != null
        ? `${cameraValue}MP Camera`
        : !isPrimitive(cameraRaw) || cameraRaw === ""
          ? ""
          : `${formatSpecValue(cameraRaw, "camera")
              .replace(/\s+/g, " ")
              .trim()} Camera`;

    const batteryValue = getBatteryCapacityMah(data);
    const batteryRaw = getBatteryCapacityRaw(data) ?? "";
    const battery =
      batteryValue != null
        ? `${batteryValue}mAh Battery`
        : !isPrimitive(batteryRaw) || batteryRaw === ""
          ? ""
          : `${formatSpecValue(batteryRaw, "battery")
              .replace(/\s+/g, " ")
              .trim()} Battery`;

    const displayRaw = data.display?.size || data.display || "";
    const display =
      !isPrimitive(displayRaw) || displayRaw === ""
        ? ""
        : getCompactDisplayLabel(displayRaw);

    const highlights = [
      processor,
      ram && `${ram} RAM`,
      storage && `${storage} Storage`,
      display && `${display} Display`,
      camera,
      battery,
    ]
      .filter(Boolean)
      .slice(0, 3);

    return smartphoneMeta.description({
      name,
      brand,
      highlights,
    });
  };

  const getCompactProcessorLabel = (raw) => {
    const text = String(raw || "")
      .replace(/\s+/g, " ")
      .trim();
    if (!text) return "";

    const dimensity = text.match(/Dimensity\s+\d+\w*(?:[-\s]?Ultra)?/i);
    if (dimensity) return dimensity[0].trim();

    const snapdragon = text.match(
      /Snapdragon\s+[A-Za-z0-9+\-]+(?:\s+Gen\s+\d+)?/i,
    );
    if (snapdragon) return snapdragon[0].trim();

    const tensor = text.match(/Tensor\s+G\d+/i);
    if (tensor) return tensor[0].trim();

    const exynos = text.match(/Exynos\s+\d+/i);
    if (exynos) return exynos[0].trim();

    const apple = text.match(/A\d+\s*Bionic/i);
    if (apple) return apple[0].trim();

    return text.split(" ").slice(0, 4).join(" ");
  };

  const getCompactDisplayLabel = (raw) => {
    const text = String(raw || "")
      .replace(/\s+/g, " ")
      .trim();
    if (!text) return "";
    const match = text.match(/(\d+(?:\.\d+)?)\s*(?:inch|inches|in|")/i);
    if (match) return `${match[1]}"`;
    return text;
  };

  const capitalizeFirst = (raw) => {
    const text = String(raw || "").trim();
    if (!text) return "";
    return text.charAt(0).toUpperCase() + text.slice(1);
  };

  const batteryForShareRaw =
    getBatteryCapacityMah(mobileData) ??
    getBatteryCapacityRaw(mobileData) ??
    mobileData?.specs?.battery ??
    "";
  const batteryForShare = batteryForShareRaw
    ? String(batteryForShareRaw).toLowerCase().includes("mah")
      ? String(batteryForShareRaw)
      : `${batteryForShareRaw}mAh`
    : "";

  // Share functionality
  const currentMainCameraMp = getMainCameraMp(mobileData);
  const currentVariantLabel = [currentVariant?.ram, currentVariant?.storage]
    .filter(Boolean)
    .join(" / ");
  const headerTitle = capitalizeFirst(
    getDisplayProductName(mobileData) ||
      [mobileData?.brand, mobileData?.name].filter(Boolean).join(" "),
  );
  const headerType = toNormalCase(
    mobileData?.product_type || mobileData?.category || "Smartphone",
  );
  const headerProcessor = getCompactProcessorLabel(
    currentVariant?.processor ||
      mobileData?.performance?.processor ||
      mobileData?.processor ||
      mobileData?.cpu ||
      "",
  );
  const headerDisplayRaw =
    mobileData?.display?.size ??
    mobileData?.display_json?.size ??
    mobileData?.specs?.display ??
    (isPrimitive(mobileData?.display) ? mobileData?.display : "");
  const headerDisplay = getCompactDisplayLabel(headerDisplayRaw);
  const headerDescriptor = [
    headerType,
    headerProcessor,
    headerDisplay && `${headerDisplay} Display`,
  ]
    .filter(Boolean)
    .join(" | ");
  const productDisplayName =
    getDisplayProductName(mobileData) ||
    [mobileData?.brand, mobileData?.name].filter(Boolean).join(" ");
  const shareCameraText = currentMainCameraMp
    ? `${currentMainCameraMp}MP Camera`
    : "Main camera details";
  const shareData = {
    title: `${productDisplayName}${
      currentVariantLabel ? ` (${currentVariantLabel})` : ""
    }`,
    text: `Check out ${productDisplayName} - ${
      mobileData?.performance?.processor
    }, ${shareCameraText}, ${batteryForShare} Battery. Price starts at ${
      currentPriceDisplay || "N/A"
    }`,
    url: window.location.href,
  };

  // Generate detailed share content with product information
  const generateShareContent = () => {
    const brand = mobileData?.brand || mobileData?.manufacturer || "Device";
    const model = productDisplayName || "Unknown";
    const processor =
      mobileData?.performance?.processor ||
      mobileData?.processor ||
      mobileData?.cpu ||
      mobileData?.specs?.processor ||
      "Processor info not available";
    const cameraMp = getMainCameraMp(mobileData);
    const camera =
      cameraMp ||
      mobileData?.camera?.main ||
      mobileData?.mainCamera ||
      mobileData?.specs?.camera ||
      "Camera info not available";
    const battery =
      getBatteryCapacityMah(mobileData) ||
      getBatteryCapacityRaw(mobileData) ||
      mobileData?.batteryCapacity ||
      mobileData?.specs?.battery ||
      "Battery info not available";
    const batteryText = String(battery).toLowerCase().includes("mah")
      ? String(battery)
      : `${battery}mAh`;
    const price = currentPriceDisplay || "Price not available";
    const display =
      mobileData?.display?.size ||
      mobileData?.display ||
      mobileData?.specs?.display ||
      "Display info not available";

    return {
      title: `${brand} ${model}${
        currentVariantLabel ? ` (${currentVariantLabel})` : ""
      }`,
      description: `${processor}  ${camera}${
        cameraMp ? "MP" : ""
      } Camera | ${batteryText} Battery | ${display}" Display | Price: ${price}`,
      shortDescription: `${brand} ${model} - ${processor}, ${camera}${
        cameraMp ? "MP" : ""
      }, ${batteryText}, Price: ${price}`,
      fullDetails: `
${brand} ${model}
processor: ${processor}
Camera: ${camera}${cameraMp ? "MP" : ""}
Battery: ${batteryText}
Display: ${display}"
Price: ${price}
      `,
    };
  };

  // compute canonical product URL for sharing/copying
  const slugify = (str = "") =>
    String(str)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const getCanonicalUrl = useMemo(() => {
    if (canonicalRouteSlug) {
      return `${SITE_ORIGIN}/smartphones/${canonicalRouteSlug}`;
    }
    const path = location?.pathname || "/";
    const normalizedPath =
      path && path.length > 1 ? path.replace(/\/+$/g, "") : path;
    return `${SITE_ORIGIN}${normalizedPath || "/"}`;
  }, [canonicalRouteSlug, location.pathname]);
  const normalizedPathname = useMemo(() => {
    const path = location?.pathname || "/";
    return path && path.length > 1 ? path.replace(/\/+$/g, "") : path || "/";
  }, [location.pathname]);
  const canonicalPathname = canonicalRouteSlug
    ? `/smartphones/${canonicalRouteSlug}`
    : normalizedPathname;
  const hasDuplicateQueryParams = [
    "id",
    "model",
    "shared",
    "variantId",
    "variant_id",
    "storeId",
    "store_id",
    "storeName",
    "store",
  ].some((key) => query.has(key));
  const seoRobots =
    normalizedPathname !== canonicalPathname || hasDuplicateQueryParams
      ? "noindex, follow"
      : "index, follow";
  const isSharedLink =
    query.get("shared") === "1" || query.get("shared") === "true";

  const copyTextToClipboard = async (text) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise((resolve, reject) => {
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(ta);
        if (ok) resolve();
        else reject(new Error("copy failed"));
      } catch (e) {
        reject(e);
      }
    });
  };

  const handleShare = async () => {
    try {
      const urlStr = getCanonicalUrl;
      const content = generateShareContent();
      const payload = {
        title: content.title,
        text: content.description,
        url: urlStr,
      };

      if (navigator.share) {
        // Native share (works on HTTPS / localhost when supported)
        try {
          await navigator.share(payload);
          return;
        } catch (err) {
          console.warn("Native share failed:", err);
        }
      }

      // Fallback: copy the share URL to clipboard and open share modal so
      // user has explicit platform choices.
      try {
        await copyTextToClipboard(urlStr);
        alert("Link copied to clipboard â€” paste to share");
        setShowShareMenu(true);
      } catch (err) {
        console.error("Clipboard fallback failed:", err);
        // Last resort: open share modal
        setShowShareMenu(true);
      }
    } catch (e) {
      console.error("Share failed:", e);
      setShowShareMenu(true);
    }
  };

  // copy link functionality removed â€” share-only flow

  const shareToWhatsApp = () => {
    const urlToShare = getCanonicalUrl;
    const content = generateShareContent();
    const message = `${content.fullDetails}\n\nðŸ”— Check it out: ${urlToShare}`;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  const shareToFacebook = () => {
    const urlToShare = getCanonicalUrl;
    // Facebook uses Open Graph tags, so just share the URL with description
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      urlToShare,
    )}`;
    window.open(url, "_blank");
  };

  const shareToTwitter = () => {
    const urlToShare = getCanonicalUrl;
    const content = generateShareContent();
    const tweet = `Check out: ${content.title}\n${content.shortDescription}\n\n#Smartphones #Tech`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      tweet,
    )}&url=${encodeURIComponent(urlToShare)}`;
    window.open(url, "_blank");
  };

  const shareViaEmail = () => {
    const urlToShare = getCanonicalUrl;
    const content = generateShareContent();
    const subject = `Check out: ${content.title}`;
    const body = `${content.fullDetails}\n\nView details: ${urlToShare}`;
    const url = `mailto:?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;
    window.location.href = url;
  };

  const toggleFavorite = async () => {
    const token = Cookies.get("arenak");
    if (!token) {
      navigate("/login", { state: { returnTo: location.pathname } });
      return;
    }

    const productId = mobileData?.id || mobileData?.model;

    if (!isFavorite) {
      try {
        const res = await fetch("https://api.apisphere.in/api/wishlist", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            product_id: productId,
            product_type: "smartphone",
          }),
        });

        if (res.status === 401) {
          navigate("/login");
          return;
        }

        if (!res.ok) throw new Error(`Add favorite failed: ${res.status}`);
        setIsFavorite(true);
      } catch (err) {
        console.error("Failed to add favorite via API:", err);
      }
    } else {
      try {
        const res = await fetch(
          `https://api.apisphere.in/api/wishlist/${encodeURIComponent(productId)}`,
          {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (res.status === 401) {
          navigate("/login");
          return;
        }

        if (!res.ok) throw new Error(`Remove favorite failed: ${res.status}`);
        setIsFavorite(false);
      } catch (err) {
        console.error("Failed to remove favorite via API:", err);
      }
    }
  };

  useEffect(() => {
    const initFavorite = async () => {
      const token = Cookies.get("arenak");
      if (!token) return;
      const productId = mobileData?.id || mobileData?.model;
      if (!productId) return;

      try {
        const res = await fetch("https://api.apisphere.in/api/wishlist", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const json = await res.json();
        const items = json.rows || json.wishlist || json.items || json || [];
        const found = (Array.isArray(items) ? items : []).some(
          (it) =>
            String(it.product_id || it.id || it.favoriteId) ===
            String(productId),
        );
        if (found) setIsFavorite(true);
      } catch (err) {
        console.error("Failed to initialize favorite status:", err);
      }
    };

    initFavorite();
  }, [mobileData?.id, mobileData?.model]);

  const mobileTabs = [
    { id: "specifications", label: "Basic", icon: FaMicrochip },
    { id: "display", label: "Display", icon: FaExpand },
    { id: "performance", label: "Performance", icon: FaBolt },
    { id: "camera", label: "Camera", icon: FaCamera },
    { id: "battery", label: "Battery", icon: FaBatteryFull },
  ];

  const desktopTabs = [
    ...mobileTabs,
    { id: "build_design", label: "Build & Design", icon: FaMobile },
    { id: "connectivity", label: "Connectivity", icon: FaWifi },
    { id: "multimedia", label: "Multimedia", icon: FaFilm },
  ];

  const tabs = window.innerWidth < 768 ? mobileTabs : desktopTabs;
  // Determine whether a piece of spec data actually contains useful content
  const hasContent = (data) => {
    if (data == null || data === false) return false;
    if (typeof data === "string") {
      const t = data.trim();
      if (!t) return false;
      const lower = t.toLowerCase();
      if (
        lower === "n/a" ||
        lower === "na" ||
        lower === "null" ||
        lower === "undefined" ||
        lower === "invalid date" ||
        t === "{}" ||
        t === "[]"
      ) {
        return false;
      }
      return true;
    }
    if (typeof data === "number") return Number.isFinite(data);
    if (Array.isArray(data)) return data.some((item) => hasContent(item));
    if (typeof data === "object") {
      return Object.values(data).some((value) => hasContent(value));
    }
    return Boolean(data);
  };

  // Map tab ids to the fields we consider for presence checks
  const filterTabByData = (tabId) => {
    const displayData = mobileData?.display || mobileData?.display_json;
    const performanceData =
      mobileData?.performance || mobileData?.performance_json;
    const cameraData = mobileData?.camera || mobileData?.camera_json;
    const batteryData = mobileData?.battery || mobileData?.battery_json;
    const buildData = mobileData?.build_design || mobileData?.build_design_json;
    const connectivityData =
      mobileData?.connectivity || mobileData?.connectivity_json;
    const networkData = mobileData?.network || mobileData?.network_json;
    const multimediaData =
      mobileData?.multimedia || mobileData?.multimedia_json;

    switch (tabId) {
      case "specifications":
        return [
          mobileData?.brand,
          mobileData?.model,
          mobileData?.category,
          performanceData,
          displayData,
          cameraData,
          batteryData,
        ].some((v) => hasContent(v));
      case "display":
        return hasContent(displayData);
      case "performance":
        return hasContent(performanceData);
      case "camera":
        return hasContent(cameraData);
      case "battery":
        return hasContent(batteryData);
      case "build_design":
        return hasContent(buildData);
      case "connectivity":
        return (
          hasContent(connectivityData) ||
          hasContent(networkData) ||
          hasContent(mobileData?.ports) ||
          hasContent(mobileData?.positioning_json)
        );
      case "multimedia":
        return hasContent(mobileData?.audio) || hasContent(multimediaData);
      default:
        return true;
    }
  };

  const availableTabs = tabs.filter((t) => filterTabByData(t.id));

  // Keep activeTab in sync: if current activeTab no longer available, pick first available
  useEffect(() => {
    if (!availableTabs || availableTabs.length === 0) return;
    if (!availableTabs.some((t) => t.id === activeTab)) {
      setActiveTab(availableTabs[0].id);
    }
  }, [availableTabs, activeTab]);

  // When a tab is clicked we prefer to navigate/scroll to the corresponding
  // section inside the main "specifications" view instead of rendering
  // a separate tab modal. If the target section is not present we fall back
  // to activating the tab normally so its standalone content renders.
  const handleTabClick = (tabId) => {
    // If the clicked tab is already active and is the specifications tab,
    // just scroll to top of the specs container.
    if (tabId === "specifications") {
      setActiveTab("specifications");
      const topEl = document.getElementById("spec-specifications");
      if (topEl) topEl.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    // Ensure the specifications view is rendered, then try to scroll to the
    // specific subsection (e.g. spec-display, spec-camera). If the subsection
    // doesn't exist, fall back to activating the tab so its own content shows.
    setActiveTab("specifications");
    window.requestAnimationFrame(() => {
      const el = document.getElementById(`spec-${tabId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        // subsection not present â€” activate the tab normally
        setActiveTab(tabId);
      }
    });
  };

  const isScoreKey = (key) => /(^|[_-])score$/i.test(String(key || ""));

  const renderSpecItems = (data, limit = 5) => {
    if (!data || typeof data !== "object") {
      return (
        <div className="text-center py-4 text-gray-500">No data available</div>
      );
    }
    const entries = Object.entries(data).filter(
      ([key, value]) =>
        hasContent(value) && key !== "sphere_rating" && !isScoreKey(key),
    );

    if (entries.length === 0) {
      return (
        <div className="text-center py-4 text-gray-500">No data available</div>
      );
    }

    // Detect grouped specs (e.g., foldable screens: { fold: {...}, flip: {...} })
    const hasGroups = entries.some(
      ([_, value]) =>
        value && typeof value === "object" && !Array.isArray(value),
    );

    if (hasGroups) {
      // Separate primitive entries and grouped entries
      const primitiveEntries = entries.filter(
        ([_, value]) =>
          !(value && typeof value === "object" && !Array.isArray(value)),
      );
      const groupedEntries = entries.filter(
        ([_, value]) =>
          value && typeof value === "object" && !Array.isArray(value),
      );

      // Order common fold states first
      const groupOrder = ["fold", "flip"];
      groupedEntries.sort(([a], [b]) => {
        const ai = groupOrder.indexOf(a.toLowerCase());
        const bi = groupOrder.indexOf(b.toLowerCase());
        if (ai === -1 && bi === -1) return a.localeCompare(b);
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
      });

      return (
        <div className="space-y-4">
          {primitiveEntries.length > 0 && (
            <div className="space-y-2">
              {primitiveEntries.map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center justify-between rounded-lg border border-slate-100 bg-gradient-to-r from-blue-600/10 to-transparent px-4 py-3 transition-all duration-200 hover:border-blue-200 hover:shadow-sm"
                >
                  <span className="text-gray-700 font-semibold text-sm flex-1">
                    {toNormalCase(key)}
                  </span>
                  <span className="text-right text-sm font-bold text-blue-600 break-words flex-1">
                    {formatSpecValue(value, key)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {groupedEntries.map(([gkey, group]) => {
            const subEntries = Object.entries(group).filter(
              ([k, v]) => hasContent(v) && !isScoreKey(k),
            );
            if (subEntries.length === 0) return null;
            return (
              <div
                key={gkey}
                className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-600/10 to-white p-4 shadow-sm"
              >
                <h4 className="mb-3 text-sm font-bold uppercase tracking-wide text-blue-900">
                  {toNormalCase(gkey)}
                </h4>
                <div className="space-y-2">
                  {subEntries.map(([skey, sval]) => (
                    <div
                      key={skey}
                      className="flex items-center justify-between rounded-lg bg-white/70 px-3 py-2 transition-all hover:bg-white"
                    >
                      <span className="text-gray-700 text-sm flex-1 font-medium">
                        {toNormalCase(skey)}
                      </span>
                      <span className="text-right text-sm font-semibold text-blue-600 break-words flex-1">
                        {formatSpecValue(sval, skey)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    const displayEntries = showAllSpecs ? entries : entries.slice(0, limit);

    return (
      <>
        <div className="space-y-2">
          {displayEntries.map(([key, value]) => (
            <div
              key={key}
              className="flex items-center justify-between rounded-lg border border-slate-100 bg-gradient-to-r from-blue-600/10 to-transparent px-4 py-3 transition-all duration-200 hover:border-blue-200 hover:bg-blue-50/40 hover:shadow-md"
            >
              <span className="text-gray-700 font-semibold text-sm flex-1">
                {toNormalCase(key)}
              </span>
              <span className="text-right text-sm font-bold text-blue-600 break-words flex-1">
                {formatSpecValue(value, key)}
              </span>
            </div>
          ))}
        </div>
        {entries.length > limit && (
          <button
            onClick={() => setShowAllSpecs(!showAllSpecs)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 px-4 py-3 text-sm font-bold text-white shadow-md transition-all duration-200 hover:shadow-lg"
          >
            {showAllSpecs
              ? "Show Less"
              : `Show ${entries.length - limit} More Specs`}
            <FaChevronDown
              className={`text-xs transition-transform ${
                showAllSpecs ? "rotate-180" : ""
              }`}
            />
          </button>
        )}
      </>
    );
  };

  const renderCameraTable = (camera) => {
    if (!camera || !hasContent(camera))
      return (
        <div className="text-center py-4 text-gray-500">
          No camera data available
        </div>
      );

    const pickFirstContent = (...values) =>
      values.find((value) => hasContent(value)) ?? null;

    const normalizeCameraMetricLabel = (rawKey) => {
      const key = normalizeSpecToken(rawKey);
      if (["focus", "autofocus"].includes(key)) return "Focus";
      if (["resolution", "megapixels", "maincameramegapixels"].includes(key)) {
        return "Resolution";
      }
      if (key === "aperture") return "Aperture";
      if (key === "sensor") return "Sensor";
      if (["stabilization", "ois", "eis"].includes(key)) return "Stabilization";
      if (key === "zoom") return "Zoom";
      if (key === "rear") return "Rear";
      if (key === "front") return "Front";
      if (["reareis", "rear_eis"].includes(key)) return "Rear EIS";
      if (["timelapse", "time_lapse"].includes(key)) return "Time Lapse";
      if (["slowmotion", "slow_motion"].includes(key)) return "Slow Motion";
      if (["hdrvideo", "hdr_video"].includes(key)) return "HDR Video";
      if (key === "video_recording" || key === "recording") {
        return "Video Recording";
      }
      if (
        key === "photographyfeatures" ||
        key === "photography_features" ||
        key === "rearcameraphotographyfeatures"
      ) {
        return "Photography Features";
      }
      if (key === "ai_features" || key === "aifeatures") return "AI Features";
      if (key === "shootingmodes" || key === "shooting_modes") {
        return "Shooting Modes";
      }
      return toNormalCase(rawKey);
    };

    const formatCameraDisplayValue = (value, key = "") => {
      if (!hasContent(value)) return "";
      if (Array.isArray(value)) {
        return value
          .map((item) => formatCameraDisplayValue(item, key))
          .filter((item) => hasContent(item))
          .join(", ");
      }
      if (typeof value === "object") {
        const parts = Object.entries(value)
          .filter(
            ([nestedKey, nestedValue]) =>
              hasContent(nestedValue) && !isScoreKey(nestedKey),
          )
          .map(([nestedKey, nestedValue]) => {
            const nestedLabel = normalizeCameraMetricLabel(nestedKey);
            const nestedText = formatCameraDisplayValue(nestedValue, nestedKey);
            if (!hasContent(nestedText)) return null;
            return `${nestedLabel}: ${nestedText}`;
          })
          .filter(Boolean);
        return parts.join(" | ");
      }
      const text = String(formatSpecValue(value, key))
        .replace(/\s+/g, " ")
        .trim();
      return hasContent(text) && text !== "Not specified" ? text : "";
    };

    const formatMegapixelDisplay = (value) => {
      const parsed = parseMegapixelValue(value);
      if (parsed != null) return `${parsed} MP`;
      const text = formatCameraDisplayValue(value, "resolution");
      if (!hasContent(text)) return "";
      return /mp\b/i.test(text) ? text : text;
    };

    const pushCameraItem = (items, label, value, key = label) => {
      const text =
        key === "resolution"
          ? formatMegapixelDisplay(value)
          : formatCameraDisplayValue(value, key);
      if (!hasContent(text) || text === "Not specified") return;
      items.push({ label, value: text, key });
    };

    const appendRemainingItems = (source, items, skippedKeys = []) => {
      if (!source || typeof source !== "object" || Array.isArray(source))
        return;
      const skipped = new Set([
        ...skippedKeys,
        "score",
        "camera_score",
        "spec_score",
        "video_recording",
        "recording",
        "features",
        "ai_features",
        "shooting_modes",
        "photography_features",
        "rear_camera_photography_features",
      ]);
      Object.entries(source).forEach(([key, value]) => {
        if (skipped.has(key) || !hasContent(value)) return;
        const text = formatCameraDisplayValue(value, key);
        if (!hasContent(text)) return;
        items.push({
          label: normalizeCameraMetricLabel(key),
          value: text,
          key,
        });
      });
    };

    const dedupeCameraItems = (items = []) => {
      const seen = new Set();
      return items.filter(({ label, value }) => {
        const key = String(label || "").toLowerCase();
        if (!hasContent(value) || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    };

    const buildMainCameraItems = (source) => {
      const items = [];
      if (source && typeof source === "object" && !Array.isArray(source)) {
        const handled = [
          "focus",
          "autofocus",
          "resolution",
          "megapixels",
          "main_camera_megapixels",
          "aperture",
          "sensor",
          "stabilization",
          "ois",
          "eis",
          "zoom",
        ];
        pushCameraItem(
          items,
          "Focus",
          source.focus ?? source.autofocus,
          "focus",
        );
        pushCameraItem(
          items,
          "Resolution",
          source.resolution ??
            source.megapixels ??
            source.main_camera_megapixels,
          "resolution",
        );
        pushCameraItem(items, "Aperture", source.aperture, "aperture");
        pushCameraItem(items, "Sensor", source.sensor, "sensor");
        pushCameraItem(
          items,
          "Stabilization",
          source.stabilization ?? source.ois ?? source.eis,
          "stabilization",
        );
        pushCameraItem(items, "Zoom", source.zoom, "zoom");
        appendRemainingItems(source, items, handled);
      } else if (hasContent(source)) {
        pushCameraItem(items, "Resolution", source, "main_camera");
      }

      if (!items.length && hasContent(camera.main_camera_megapixels)) {
        pushCameraItem(
          items,
          "Resolution",
          `${camera.main_camera_megapixels} MP`,
          "main_camera_megapixels",
        );
      }

      return dedupeCameraItems(items);
    };

    const buildFrontCameraItems = (source) => {
      const items = [];
      if (source && typeof source === "object" && !Array.isArray(source)) {
        const handled = [
          "resolution",
          "megapixels",
          "focus",
          "autofocus",
          "aperture",
          "sensor",
          "stabilization",
          "ois",
          "eis",
        ];
        pushCameraItem(
          items,
          "Resolution",
          source.resolution ??
            source.megapixels ??
            source.main_camera_megapixels,
          "resolution",
        );
        pushCameraItem(
          items,
          "Focus",
          source.focus ?? source.autofocus,
          "focus",
        );
        pushCameraItem(items, "Aperture", source.aperture, "aperture");
        pushCameraItem(items, "Sensor", source.sensor, "sensor");
        pushCameraItem(
          items,
          "Stabilization",
          source.stabilization ?? source.ois ?? source.eis,
          "stabilization",
        );
        appendRemainingItems(source, items, handled);
      } else if (hasContent(source)) {
        pushCameraItem(items, "Resolution", source, "front_camera");
      }

      return dedupeCameraItems(items);
    };

    const buildVideoItems = (source) => {
      const items = [];
      if (source && typeof source === "object" && !Array.isArray(source)) {
        const handled = [
          "rear",
          "back",
          "main",
          "front",
          "rear_eis",
          "eis",
          "time_lapse",
          "timelapse",
          "slow_motion",
          "hdr_video",
          "hdr",
        ];
        pushCameraItem(
          items,
          "Rear",
          source.rear ?? source.back ?? source.main,
          "rear",
        );
        pushCameraItem(items, "Front", source.front, "front");
        pushCameraItem(
          items,
          "Rear EIS",
          source.rear_eis ?? source.eis,
          "rear_eis",
        );
        pushCameraItem(
          items,
          "Time Lapse",
          source.time_lapse ?? source.timelapse,
          "time_lapse",
        );
        pushCameraItem(items, "Slow Motion", source.slow_motion, "slow_motion");
        pushCameraItem(
          items,
          "HDR Video",
          source.hdr_video ?? source.hdr,
          "hdr_video",
        );
        appendRemainingItems(source, items, handled);
      } else if (hasContent(source)) {
        pushCameraItem(items, "Details", source, "video_recording");
      }

      return dedupeCameraItems(items);
    };

    const buildFeatureSummary = (source) => {
      const values = [];
      const seen = new Set();

      const push = (entry) => {
        if (!hasContent(entry)) return;
        if (Array.isArray(entry)) {
          entry.forEach(push);
          return;
        }
        if (typeof entry === "object") {
          const entries = Object.entries(entry);
          const primitiveValues = entries
            .map(([, nestedValue]) => nestedValue)
            .filter((nestedValue) => {
              if (!hasContent(nestedValue)) return false;
              if (Array.isArray(nestedValue)) return true;
              if (typeof nestedValue === "object") return true;
              const text = String(nestedValue).trim().toLowerCase();
              return !["true", "false", "null", "undefined", ""].includes(text);
            });

          if (primitiveValues.length > 0) {
            primitiveValues.forEach(push);
            return;
          }

          entries.forEach(([key, nestedValue]) => {
            if (typeof nestedValue === "boolean") {
              if (nestedValue) push(normalizeCameraMetricLabel(key));
              return;
            }
            if (!hasContent(nestedValue)) {
              push(normalizeCameraMetricLabel(key));
              return;
            }
            push(nestedValue);
          });
          return;
        }

        const text = String(entry)
          .replace(/_/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        if (
          !text ||
          ["true", "false", "null", "undefined"].includes(text.toLowerCase())
        ) {
          return;
        }
        const key = text.toLowerCase();
        if (seen.has(key)) return;
        seen.add(key);
        values.push(text);
      };

      push(source);
      return values.join(", ");
    };

    const formatCameraScore = (value) => {
      const normalized = normalizeScore100(value);
      if (normalized == null) return "";
      return Number(normalized).toFixed(1);
    };

    const mainCameraSource = pickFirstContent(
      camera.rear_camera?.main_camera,
      camera.rear_camera?.main,
      camera.rear_camera?.wide,
      camera.rear_camera?.primary,
      camera.main_camera,
      camera.main,
      camera.primary,
    );
    const frontCameraSource = pickFirstContent(
      camera.front_camera,
      camera.front,
      camera.frontCamera,
    );
    const videoRecordingSource = pickFirstContent(
      camera.video_recording,
      camera.recording,
      camera.rear_camera?.video_recording,
      camera.front_camera?.video_recording,
    );
    const photographySource = pickFirstContent(
      camera.rear_camera_photography_features,
      camera.photography_features,
      camera.features,
      camera.ai_features,
      camera.shooting_modes,
      camera.rear_camera?.photography_features,
      camera.rear_camera?.ai_features,
      camera.front_camera?.ai_features,
    );
    const scoreValue = pickFirstContent(
      camera.score,
      camera.camera_score,
      camera.cameraScore,
      camera.spec_score,
    );

    const mainCameraItems = buildMainCameraItems(mainCameraSource);
    const frontCameraItems = buildFrontCameraItems(frontCameraSource);
    const videoRecordingItems = buildVideoItems(videoRecordingSource);
    const photographySummary = buildFeatureSummary(photographySource);
    const cameraScore = formatCameraScore(scoreValue);

    const groups = [];
    if (mainCameraItems.length) {
      groups.push({
        key: "main",
        title: "Main Camera",
        layout: "tiles",
        columns: "sm:grid-cols-2",
        items: mainCameraItems,
      });
    }
    if (frontCameraItems.length) {
      groups.push({
        key: "front",
        title: "Front Camera",
        layout: frontCameraItems.length === 1 ? "inline" : "tiles",
        columns: "sm:grid-cols-2",
        items: frontCameraItems,
      });
    }
    if (videoRecordingItems.length) {
      groups.push({
        key: "video",
        title: "Video Recording",
        layout: "tiles",
        columns: "sm:grid-cols-2 lg:grid-cols-3",
        items: videoRecordingItems,
      });
    }
    if (photographySummary) {
      groups.push({
        key: "photo",
        title: "Photography Features",
        layout: "text",
        value: photographySummary,
      });
    }
    if (cameraScore) {
      groups.push({
        key: "score",
        title: "Score",
        layout: "score",
        value: cameraScore,
      });
    }

    if (!groups.length) {
      return (
        <div className="text-center py-4 text-gray-500">
          No camera data available
        </div>
      );
    }

    const renderRowTable = (rows, options = {}) => {
      if (!rows.length) return null;
      const { valueClassName = "", singleValue = false } = options;

      return (
        <div className="space-y-3">
          {rows.map((row, idx) => {
            if (singleValue) {
              return (
                <div
                  key={`${row.key}-${idx}`}
                  className="text-sm leading-7 text-slate-700 break-words"
                >
                  {row.value}
                </div>
              );
            }

            return (
              <div
                key={`${row.label}-${idx}`}
                className="grid gap-2 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] sm:gap-6"
              >
                <div className="text-sm font-medium text-slate-600">
                  {row.label}
                </div>
                <div
                  className={`text-sm font-semibold leading-6 text-slate-900 break-words sm:text-left ${valueClassName}`}
                >
                  {row.value}
                </div>
              </div>
            );
          })}
        </div>
      );
    };

    const renderGroupContent = (group) => {
      if (group.layout === "text") {
        return renderRowTable([{ key: group.key, value: group.value }], {
          singleValue: true,
        });
      }

      if (group.layout === "score") {
        return renderRowTable(
          [{ key: group.key, label: "Score", value: group.value }],
          {
            valueClassName:
              "text-2xl font-semibold tracking-tight text-blue-600",
          },
        );
      }

      return renderRowTable(group.items);
    };

    return (
      <div className="space-y-5">
        {groups.map((group, idx) => (
          <section
            key={group.key}
            className={
              idx !== groups.length - 1 ? "border-b border-slate-100 pb-5" : ""
            }
          >
            <div className="flex items-center justify-between gap-4">
              <h5 className="text-sm font-semibold text-slate-900 sm:text-base">
                {group.title}
              </h5>
            </div>
            <div className="mt-4">{renderGroupContent(group)}</div>
          </section>
        ))}
      </div>
    );
  };

  const renderSpecTable = (data, limit = 5) => {
    if (!data || (typeof data === "object" && Object.keys(data).length === 0))
      return (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 py-6 text-center text-sm text-slate-500">
          No data available
        </div>
      );

    const entries = dedupeSpecEntries(
      Object.entries(data).filter(
        ([k]) =>
          k !== "sphere_rating" &&
          !/ai[_-]?features?/i.test(k) &&
          !isScoreKey(k),
      ),
    );

    const displayEntries = showAllSpecs ? entries : entries.slice(0, limit);

    return (
      <>
        {/* Mobile: Stacked Layout */}
        <div className="sm:hidden space-y-2 px-1">
          {displayEntries.map(([key, value]) => (
            <div
              key={key}
              className="rounded-md border border-slate-200 bg-white p-2.5"
            >
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-600 mb-0.5">
                {toNormalCase(key)}
              </div>
              <div className="text-sm font-semibold text-slate-900 break-words">
                {formatSpecValue(value, key)}
              </div>
            </div>
          ))}
        </div>

        {/* Desktop: Table Layout */}
        <div className="hidden sm:block overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3 text-left text-sm font-semibold text-slate-700">
                  Spec
                </th>
                <th className="px-5 py-3 text-left text-sm font-semibold text-slate-700">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayEntries.map(([key, value], idx) => (
                <tr
                  key={key}
                  className={`transition-colors hover:bg-blue-50 ${
                    idx % 2 === 0 ? "bg-white" : "bg-slate-50"
                  }`}
                >
                  <td className="px-5 py-4 text-sm font-medium text-slate-600 w-1/3">
                    {toNormalCase(key)}
                  </td>
                  <td className="px-5 py-4 text-sm font-semibold text-slate-900 break-words w-2/3">
                    {formatSpecValue(value, key)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  };

  // Display-specific renderer â€” fallback to generic spec table when possible
  const renderDisplayTable = (display, limit = 5) => {
    if (
      !display ||
      (typeof display === "object" && Object.keys(display).length === 0)
    ) {
      return (
        <div className="text-center py-4 text-gray-500">
          No display data available
        </div>
      );
    }

    // If a display JSON shape is nested under display_json, prefer that
    const d = display.display_json || display;

    // If it's a simple string or primitive, show directly
    if (typeof d === "string" || typeof d === "number") {
      return <div className="text-sm text-gray-900">{String(d)}</div>;
    }

    // Reuse generic table renderer for object-like display data
    return renderSpecTable(d, limit);
  };

  const toSectionTableData = (raw, fallbackKey) => {
    if (!hasContent(raw)) return null;
    if (Array.isArray(raw)) return { [fallbackKey]: raw };
    if (typeof raw === "object") return raw;
    return { [fallbackKey]: raw };
  };

  const renderTabContent = () => {
    if (!mobileData) return null;

    switch (activeTab) {
      case "specifications": {
        const displayData = mobileData.display || mobileData.display_json;
        const performanceData =
          mobileData.performance || mobileData.performance_json || {};
        const cameraData = mobileData.camera || mobileData.camera_json;
        const batteryData = mobileData.battery || mobileData.battery_json || {};
        const connectivityData = toSectionTableData(
          mobileData.connectivity || mobileData.connectivity_json,
          "connectivity",
        );
        const networkData = toSectionTableData(
          mobileData.network || mobileData.network_json,
          "network",
        );
        const audioData = toSectionTableData(mobileData.audio, "audio");
        const sensorsData = toSectionTableData(mobileData.sensors, "sensors");
        const buildData =
          mobileData.build_design || mobileData.build_design_json;
        const generalData = {
          Launch: formatDateForDisplay(
            mobileData.launch_date || mobileData.launchDate,
          ),
          "Launch Country":
            mobileData.launch_country || mobileData.country || "India",
          "Launch Price": currentPriceDisplay || "N/A",
          Colors: Array.isArray(mobileData.colors)
            ? mobileData.colors.join(", ")
            : mobileData.build_design?.colors || "N/A",
          "SIM Type":
            mobileData.network?.sim_type || mobileData.sim || "Dual Sim",
          Weight: (() => {
            const w = mobileData.build_design?.weight;
            if (!w) return "N/A";
            const ws = String(w).trim();
            return /\bg\b/i.test(ws) ? ws : `${ws} g`;
          })(),
        };
        const processorData = {
          Processor:
            performanceData?.processor || mobileData.processor || "N/A",
          Chipset: performanceData?.chipset || mobileData.chipset || "N/A",
          "CPU Clock":
            performanceData?.cpu_clock_speed ||
            performanceData?.cpu_clock ||
            "N/A",
          GPU: performanceData?.gpu || mobileData.gpu || "N/A",
        };
        const osData = {
          "Operating System":
            formatOsHeadline() ||
            performanceData?.operating_system ||
            performanceData?.os ||
            "N/A",
          Version:
            performanceData?.os_version ||
            performanceData?.version ||
            mobileData.os_version ||
            "N/A",
          "Custom UI": mobileData.ui || "Stock",
          Updates:
            performanceData?.update_policy ||
            mobileData.software?.update_policy ||
            mobileData.updates ||
            "N/A",
        };
        const specJumpSections = [
          { id: "spec-general", label: "General", visible: true },
          {
            id: "spec-display",
            label: "Display",
            visible: hasContent(displayData),
          },
          { id: "spec-body", label: "Body", visible: hasContent(buildData) },
          {
            id: "spec-performance",
            label: "Processor",
            visible: hasContent(processorData),
          },
          {
            id: "spec-camera",
            label: "Main Camera",
            visible: hasContent(cameraData),
          },
          {
            id: "spec-os",
            label: "Operating System",
            visible: hasContent(osData),
          },
          {
            id: "spec-battery",
            label: "Battery",
            visible: hasContent(batteryData),
          },
          {
            id: "spec-connectivity",
            label: "Connectivity",
            visible: hasContent(connectivityData),
          },
          {
            id: "spec-network",
            label: "Network",
            visible: hasContent(networkData),
          },
          { id: "spec-audio", label: "Audio", visible: hasContent(audioData) },
          {
            id: "spec-sensors",
            label: "Sensors",
            visible: hasContent(sensorsData),
          },
        ].filter((section) => section.visible);
        const scrollToSpecSection = (sectionId) => {
          const el = document.getElementById(sectionId);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        };
        const sectionCardClass =
          "rounded-lg border border-slate-200 bg-white p-5 sm:p-6";
        const sectionDividerClass =
          "mt-4 h-px w-full bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400";
        const renderSectionCard = (sectionId, title, content) => (
          <section id={sectionId} className={sectionCardClass}>
            <h4 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
              {title}
            </h4>
            <div className={sectionDividerClass} />
            <div className="mt-5">{content}</div>
          </section>
        );

        return (
          <div
            id="spec-specifications"
            className={`w-full max-w-3xl p-2 sm:p-0 ${combineResponsiveClasses(RESPONSIVE_SPACING.contentMarginY)}`}
          >
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <h3 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-[2rem]">
                  {metaName}
                  {currentVariantLabel ? ` (${currentVariantLabel})` : ""}
                  <span className="ml-2 bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400 bg-clip-text text-transparent">
                    Full Specifications
                  </span>
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-600">
                  Expanded View
                </span>
                <button
                  type="button"
                  onClick={() => setShowAllSpecs((prev) => !prev)}
                  aria-pressed={showAllSpecs}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                    showAllSpecs ? "bg-blue-600" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform duration-200 ${
                      showAllSpecs ? "translate-x-7" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="relative mt-5">
              <div
                className={`flex ${RESPONSIVE_SPACING.gapMedium} overflow-x-auto pb-1 no-scrollbar`}
              >
                {specJumpSections.map((section) => (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => scrollToSpecSection(section.id)}
                    className="inline-flex flex-shrink-0 items-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-all hover:border-blue-300 hover:text-blue-600"
                  >
                    {section.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 space-y-5">
              {renderSectionCard(
                "spec-general",
                "General",
                renderSpecTable(generalData, 5),
              )}
              {hasContent(displayData) &&
                renderSectionCard(
                  "spec-display",
                  "Display",
                  renderDisplayTable(displayData, 5),
                )}
              {hasContent(buildData) &&
                renderSectionCard(
                  "spec-body",
                  "Body",
                  renderSpecTable(buildData, 5),
                )}
              {hasContent(processorData) &&
                renderSectionCard(
                  "spec-performance",
                  "Processor",
                  renderSpecTable(processorData, 5),
                )}
              {hasContent(cameraData) &&
                renderSectionCard(
                  "spec-camera",
                  "Main Camera",
                  renderCameraTable(cameraData),
                )}
              {hasContent(osData) &&
                renderSectionCard(
                  "spec-os",
                  "Operating System",
                  renderSpecTable(osData, 5),
                )}
              {hasContent(batteryData) &&
                renderSectionCard(
                  "spec-battery",
                  "Battery",
                  renderSpecTable(batteryData, 5),
                )}
              {hasContent(connectivityData) &&
                renderSectionCard(
                  "spec-connectivity",
                  "Connectivity",
                  renderSpecTable(connectivityData, 5),
                )}
              {hasContent(networkData) &&
                renderSectionCard(
                  "spec-network",
                  "Network",
                  renderSpecTable(networkData, 5),
                )}
              {hasContent(audioData) &&
                renderSectionCard(
                  "spec-audio",
                  "Audio",
                  renderSpecTable(audioData, 5),
                )}
              {hasContent(sensorsData) &&
                renderSectionCard(
                  "spec-sensors",
                  "Sensors",
                  renderSpecTable(sensorsData, 5),
                )}
            </div>
          </div>
        );
      }

      case "display":
        return (
          <div className="bg-white rounded-lg p-4">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FaExpand className="text-green-500" />
                Display
              </h3>
              <SpecScoreBadge score={getSectionScore("display")} size={38} />
            </div>
            {renderSpecTable(mobileData.display)}
          </div>
        );

      case "performance":
        return (
          <div className="bg-white rounded-lg p-4">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FaBolt className="text-yellow-500" />
                Performance
              </h3>
              <SpecScoreBadge
                score={getSectionScore("performance")}
                size={38}
              />
            </div>
            {renderSpecTable(mobileData.performance)}
          </div>
        );

      case "camera":
        return (
          <div className="bg-white rounded-lg p-4">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FaCamera className="text-blue-500" />
                Camera
              </h3>
              <SpecScoreBadge score={getSectionScore("camera")} size={38} />
            </div>
            {renderCameraTable(mobileData.camera)}
          </div>
        );

      case "battery":
        return (
          <div className="bg-white rounded-lg p-4">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FaBatteryFull className="text-blue-500" />
                Battery
              </h3>
              <SpecScoreBadge score={getSectionScore("battery")} size={38} />
            </div>
            {renderSpecTable(mobileData.battery)}
          </div>
        );

      case "connectivity": {
        const connectivityData = toSectionTableData(
          mobileData.connectivity || mobileData.connectivity_json,
          "connectivity",
        );
        const networkData = toSectionTableData(
          mobileData.network || mobileData.network_json,
          "network",
        );
        const portsData = toSectionTableData(mobileData.ports, "ports");

        return (
          <div className="bg-white rounded-lg p-4">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FaWifi className="text-blue-500" />
                Connectivity
              </h3>
              <SpecScoreBadge score={getSectionScore("network")} size={38} />
            </div>
            {hasContent(connectivityData)
              ? renderSpecTable(connectivityData)
              : null}
            {hasContent(networkData) ? (
              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h4 className="font-semibold text-gray-800">Network</h4>
                </div>
                {renderSpecTable(networkData)}
              </div>
            ) : null}
            {hasContent(portsData) ? (
              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h4 className="font-semibold text-gray-800">Ports</h4>
                </div>
                {renderSpecTable(portsData)}
              </div>
            ) : null}
          </div>
        );
      }

      case "multimedia": {
        const audioData = toSectionTableData(mobileData.audio, "audio");
        const multimediaData = toSectionTableData(
          mobileData.multimedia || mobileData.multimedia_json,
          "multimedia",
        );
        const sensorsData = toSectionTableData(mobileData.sensors, "sensors");

        return (
          <div className="bg-white rounded-lg p-4">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FaFilm className="text-indigo-500" />
                Multimedia
              </h3>
            </div>
            {hasContent(multimediaData)
              ? renderSpecTable(multimediaData)
              : null}
            {hasContent(audioData) ? (
              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h4 className="font-semibold text-gray-800">Audio</h4>
                </div>
                {renderSpecTable(audioData)}
              </div>
            ) : null}
            {hasContent(sensorsData) ? (
              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h4 className="font-semibold text-gray-800">Sensors</h4>
                </div>
                {renderSpecTable(sensorsData)}
              </div>
            ) : null}
          </div>
        );
      }

      case "build_design":
        return (
          <div className="bg-white rounded-lg p-4">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FaMobile className="text-indigo-500" />
                Build & Design
              </h3>
            </div>
            {renderSpecTable(mobileData.build_design)}
          </div>
        );

      default:
        return (
          <div className="bg-white rounded-lg p-4">
            <div className="text-center py-8 text-gray-500">
              No data available for this section
            </div>
          </div>
        );
    }
  };

  const canonicalUrl = getCanonicalUrl;

  // compute SEO meta values
  const metaName = getDisplayProductName(mobileData) || mobileData?.name || "";
  const metaBrand = mobileData?.brand || mobileData?.brand_name || "";
  const metaRam = currentVariant?.ram || mobileData?.performance?.ram || "";
  const metaStorage =
    currentVariant?.storage ||
    mobileData?.performance?.ROM_storage ||
    mobileData?.performance?.storage ||
    "";
  const descriptiveTitle = buildDescriptiveTitle(mobileData, currentVariant);
  const titleWithBrand =
    metaBrand && descriptiveTitle
      ? descriptiveTitle.toLowerCase().includes(metaBrand.toLowerCase())
        ? descriptiveTitle
        : `${metaBrand} ${descriptiveTitle}`
      : descriptiveTitle;
  const metaTitleBase = smartphoneMeta.title({
    name: metaName,
    brand: metaBrand,
  });
  const metaVariantTag = [currentVariant?.ram, currentVariant?.storage]
    .filter(Boolean)
    .join(" / ");
  const metaTitle = metaTitleBase;

  const normalizeMemoryLabel = (raw) => {
    const text = String(raw || "")
      .replace(/\s+/g, " ")
      .trim();
    if (!text) return "";

    const cleaned = text
      .replace(/\b(RAM|Storage)\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();

    if (!cleaned) return "";
    return cleaned.toUpperCase().includes("GB") ? cleaned : `${cleaned}GB`;
  };

  const metaDescription =
    buildMetaDescription(mobileData, currentVariant) ||
    smartphoneMeta.description({
      name: metaName,
      brand: metaBrand,
      highlights: [
        headerProcessor,
        normalizeMemoryLabel(metaRam) && `${normalizeMemoryLabel(metaRam)} RAM`,
        normalizeMemoryLabel(metaStorage) &&
          `${normalizeMemoryLabel(metaStorage)} Storage`,
        currentMainCameraMp && `${currentMainCameraMp}MP Camera`,
        batteryForShare && `${batteryForShare} Battery`,
      ]
        .filter(Boolean)
        .slice(0, 3),
    });
  const headerSummaryPrice = resolvedCurrentNumericPrice;
  const headerSummary = useMemo(() => {
    const processorText = headerProcessor || "a capable chipset";
    const displayText = headerDisplay
      ? `a ${headerDisplay} display`
      : "a clear display";
    const variantText = currentVariantLabel
      ? `the ${currentVariantLabel} configuration`
      : "multiple memory options";
    const cameraText = currentMainCameraMp
      ? `${currentMainCameraMp} MP main camera`
      : "balanced camera hardware";
    const batteryText = batteryForShare
      ? `${batteryForShare} battery`
      : "reliable battery life";
    const priceText =
      headerSummaryPrice > 0 ? `₹ ${formatPrice(headerSummaryPrice)}` : "";

    const intro = `${headerTitle} is powered by ${processorText} and brings ${displayText}, ${variantText}, ${cameraText}, and ${batteryText} together in one balanced package.`;
    const priceSentence = priceText
      ? `Price starts at ${priceText} for the selected configuration, and the cards below make it easy to compare other storage and pricing options.`
      : "Pricing details are shown in the cards below, making it easy to compare available storage options.";
    const closing =
      "It is designed for users who want a balanced everyday smartphone experience with smooth performance, clear media viewing, dependable photography, and enough battery life to get through a full day without feeling overcomplicated.";

    return `${intro} ${priceSentence} ${closing}`;
  }, [
    batteryForShare,
    currentMainCameraMp,
    currentVariantLabel,
    headerDisplay,
    headerProcessor,
    headerTitle,
    headerSummaryPrice,
  ]);
  const headerSummaryWords = headerSummary.trim().split(/\s+/).filter(Boolean);
  const headerSummaryLimit = 50;
  const headerSummaryHasMore = headerSummaryWords.length > headerSummaryLimit;
  const headerSummaryPreview = headerSummaryHasMore
    ? `${headerSummaryWords.slice(0, headerSummaryLimit).join(" ")}...`
    : headerSummary;
  const visibleHeaderSummary = showHeaderSummaryFull
    ? headerSummary
    : headerSummaryPreview;

  useEffect(() => {
    setShowHeaderSummaryFull(false);
  }, [mobileData?.id, currentVariant?.ram, currentVariant?.storage]);

  const primaryImage = Array.isArray(mobileData?.images)
    ? mobileData.images[0]
    : null;
  const ogImage = toAbsoluteUrl(primaryImage);
  const ogImageWidth = 1200;
  const ogImageHeight = 630;
  const ogImageAlt =
    [metaBrand, metaName].filter(Boolean).join(" ").trim() || metaTitle;
  const pageSchema = useMemo(() => {
    const name = metaName || metaTitleBase || metaTitle || "";
    if (!name) return null;
    return createWebPageSchema({
      name,
      description: metaDescription,
      url: canonicalUrl,
    });
  }, [metaName, metaTitleBase, metaTitle, metaDescription, canonicalUrl]);
  const metaKeywords = useMemo(
    () =>
      buildDeviceSeoKeywords({
        device: mobileData,
        productName: titleWithBrand || metaName || metaTitleBase || "",
        brand: metaBrand,
        category: "smartphones",
        currentYear: new Date().getFullYear(),
        baseTerms: [
          "smartphones",
          "mobile price comparison india",
          "compare smartphone specs",
          metaVariantTag ? `${metaVariantTag}` : "",
          metaRam ? `${metaRam} RAM phone` : "",
          metaStorage ? `${metaStorage} storage phone` : "",
        ],
        maxKeywords: 45,
      }),
    [
      mobileData,
      titleWithBrand,
      metaName,
      metaTitleBase,
      metaBrand,
      metaVariantTag,
      metaRam,
      metaStorage,
    ],
  );

  if (loading && !mobileData) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-white rounded-lg p-8 text-center">
          <Spinner />
          <div className="text-sm text-gray-500 mt-3">Please wait</div>
        </div>
      </div>
    );
  }

  if (!loading && !mobileData) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-white rounded-lg p-8 text-center">
          <div className="text-gray-400 text-6xl mb-4">ðŸ“±</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Device Not Found
          </h3>
          <p className="text-gray-600 text-sm">
            The requested mobile device could not be found.
          </p>
        </div>
      </div>
    );
  }

  const rearMainCamera = mobileData?.camera?.rear_camera?.main_camera;
  const rearUltraCamera =
    mobileData?.camera?.rear_camera?.ultra_wide_camera ||
    mobileData?.camera?.rear_camera?.ultra_wide;
  const rearTeleCamera =
    mobileData?.camera?.rear_camera?.telephoto ||
    mobileData?.camera?.rear_camera?.periscope;
  const frontCamera = mobileData?.camera?.front_camera;
  const rearVideoRaw = mobileData?.camera?.video_recording?.rear;
  const frontVideoRaw = mobileData?.camera?.video_recording?.front;
  const rearVideoSummary = Array.isArray(rearVideoRaw)
    ? rearVideoRaw.slice(0, 3).join(", ")
    : rearVideoRaw;
  const frontVideoSummary = Array.isArray(frontVideoRaw)
    ? frontVideoRaw.slice(0, 2).join(", ")
    : frontVideoRaw;
  const getSectionTone = (score) => {
    const value = Number(score);
    if (!Number.isFinite(value)) return "Balanced";
    if (value >= 95) return "Top-tier";
    if (value >= 90) return "Strong";
    if (value >= 80) return "Balanced";
    return "Basic";
  };
  const getSectionDescription = (sectionKey, score) => {
    const tone = getSectionTone(score);
    switch (sectionKey) {
      case "performance":
        return `${tone} chipset setup for smooth daily use.`;
      case "display":
        return `${tone} screen for clear, fluid viewing.`;
      case "camera":
        return `${tone} rear camera for everyday shots.`;
      case "camera-front":
        return `${tone} selfie camera for calls and portraits.`;
      case "battery":
        return `${tone} battery for longer screen time.`;
      default:
        return `${tone} hardware summary.`;
    }
  };

  const normalizePointText = (value) => {
    if (!hasContent(value)) return null;
    const text = String(formatSpecValue(value, "")).replace(/\s+/g, " ").trim();
    return hasContent(text) ? text : null;
  };

  const toUniquePoints = (values = []) => {
    const seen = new Set();
    return values
      .map((value) => normalizePointText(value))
      .filter((value) => {
        if (!hasContent(value)) return false;
        const key = String(value).toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  };

  const formatMemoryPoint = (value, label) => {
    const text = normalizePointText(value);
    if (!text) return null;

    let out = text.replace(/(\d)\s*(gb|mb|tb)\b/gi, "$1 $2");
    if (/^\d+(\.\d+)?$/i.test(out)) out = `${out} GB`;

    return new RegExp(`\\b${label}\\b`, "i").test(out)
      ? out
      : `${out} ${label}`;
  };

  const withPrefix = (value, prefix) => {
    const text = normalizePointText(value);
    if (!text) return null;
    return new RegExp(`^${prefix}\\b`, "i").test(text)
      ? text
      : `${prefix}: ${text}`;
  };

  const formatRefreshRatePoint = (value) => {
    const text = normalizePointText(value);
    if (!text) return null;
    if (/refresh rate/i.test(text)) return text;
    if (/hz/i.test(text)) return `${text} refresh rate`;
    return `Refresh rate: ${text}`;
  };

  const formatMegapixelHeadline = (value) => {
    const text = normalizePointText(value);
    if (!text) return null;
    return text.replace(/\b(\d+(?:\.\d+)?)\s*MP\b/gi, "$1MP");
  };

  const formatCapacityHeadline = (value) => {
    const text = normalizePointText(value);
    if (!text) return null;
    return text
      .replace(/\b(\d+(?:\.\d+)?)\s*mAh\b/gi, "$1mAh")
      .replace(/\b(\d+(?:\.\d+)?)\s*Wh\b/gi, "$1Wh");
  };

  const formatMemoryHeadline = (value, typeValue = "") => {
    const text = normalizePointText(value);
    if (!text) return null;
    const compact = text.replace(/\b(\d+(?:\.\d+)?)\s*(GB|MB|TB)\b/gi, "$1$2");
    const typeText = normalizePointText(typeValue);
    return typeText ? `${compact} (${typeText})` : compact;
  };

  const formatDisplayHeadline = () => {
    const rawSize =
      mobileData?.display?.size || mobileData?.display?.screen_size;
    const sizeMatch = String(rawSize || "").match(/(\d+(?:\.\d+)?)/);
    const size = sizeMatch
      ? `${Number(sizeMatch[1]).toFixed(1)}"`
      : getCompactDisplayLabel(rawSize);
    const refresh = normalizePointText(
      mobileData?.display?.refresh_rate ||
        mobileData?.display?.refreshRate ||
        "",
    );
    if (size && refresh) {
      return `${size} (${refresh.replace(/\s+Hz\b/i, "Hz")})`;
    }
    return size || refresh?.replace(/\s+Hz\b/i, "Hz") || null;
  };

  const formatDimensionHeadline = (design = {}) => {
    const parts = [design.height, design.width, design.thickness]
      .flatMap((value) => (Array.isArray(value) ? value : [value]))
      .map((value) => normalizePointText(value))
      .filter(Boolean);
    if (parts.length === 0) return null;
    return parts.join(" × ");
  };

  const formatWeightHeadline = (value) => {
    const text = normalizePointText(value);
    if (!text) return null;
    return /\b(g|kg)\b/i.test(text) ? text : `${text} g`;
  };

  const formatColorsHeadline = (colors) => {
    if (Array.isArray(colors)) {
      const items = colors
        .map((item) => normalizePointText(item))
        .filter(Boolean);
      return items.length ? items.join(" / ") : null;
    }
    return normalizePointText(colors);
  };

  const formatDesignHeadline = (design = {}) =>
    formatDimensionHeadline(design) ||
    formatColorsHeadline(design.colors) ||
    formatWeightHeadline(design.weight) ||
    normalizePointText(design.water_dust_resistance) ||
    null;

  const formatOsHeadline = () => {
    const os = normalizePointText(
      mobileData?.performance?.operating_system ||
        mobileData?.performance?.os ||
        "",
    );
    const ui = normalizePointText(mobileData?.ui);
    if (os && ui && !os.toLowerCase().includes(ui.toLowerCase())) {
      return `${os} (${ui})`;
    }
    return os || ui || null;
  };

  const buildDesignData =
    mobileData?.build_design || mobileData?.build_design_json || {};
  const osLeadText = formatOsHeadline();

  const frontCameraModePoint = frontCamera?.focus
    ? withPrefix(frontCamera.focus, "Focus")
    : frontCamera?.autofocus
      ? withPrefix(frontCamera.autofocus, "Autofocus")
      : frontCamera?.type
        ? withPrefix(frontCamera.type, "Type")
        : null;

  const highlightIconMap = {
    performance: { Icon: FaMicrochip, color: "text-blue-600" },
    memory: { Icon: FaMemory, color: "text-sky-600" },
    display: { Icon: FaExpand, color: "text-emerald-600" },
    camera: { Icon: FaCamera, color: "text-sky-600" },
    "camera-front": { Icon: FaCamera, color: "text-blue-600" },
    battery: { Icon: FaBatteryFull, color: "text-orange-500" },
    design: { Icon: FaMobile, color: "text-violet-600" },
    os: { Icon: FaSync, color: "text-cyan-600" },
  };

  const infoKeySections = [
    {
      key: "performance",
      scoreKey: "performance",
      title: "Processor",
      leadPoint: normalizePointText(
        mobileData?.performance?.processor || mobileData?.processor,
      ),
      points: toUniquePoints([
        withPrefix(mobileData?.performance?.cpu_clock_speed, "Clock speed"),
        withPrefix(mobileData?.performance?.gpu, "GPU"),
        withPrefix(
          mobileData?.performance?.operating_system ||
            mobileData?.performance?.os,
          "OS",
        ),
      ]),
    },
    {
      key: "memory",
      title: "RAM/Storage",
      leadPoint: formatMemoryHeadline(
        currentVariant?.ram || mobileData?.performance?.ram,
        mobileData?.performance?.ram_type || mobileData?.ram_type,
      ),
      points: toUniquePoints([
        formatMemoryHeadline(
          currentVariant?.storage ||
            mobileData?.performance?.storage ||
            mobileData?.performance?.ROM_storage,
          mobileData?.performance?.storage_type || mobileData?.storage_type,
        ),
      ]),
    },
    {
      key: "display",
      scoreKey: "display",
      title: "Display",
      leadPoint: formatDisplayHeadline(),
      points: toUniquePoints([
        withPrefix(mobileData?.display?.panel, "Panel"),
        withPrefix(mobileData?.display?.resolution, "Resolution"),
        withPrefix(mobileData?.display?.touch_sampling_rate, "Touch sampling"),
        withPrefix(mobileData?.display?.protection, "Protection"),
      ]),
    },
    {
      key: "camera",
      scoreKey: "camera",
      title: "Rear Camera",
      leadPoint: formatMegapixelHeadline(
        rearMainCamera?.resolution ||
          (getMainCameraMp(mobileData) != null
            ? `${getMainCameraMp(mobileData)} MP main camera`
            : null),
      ),
      points: toUniquePoints([
        rearUltraCamera?.resolution
          ? `${formatMegapixelHeadline(rearUltraCamera.resolution)} ultra-wide`
          : null,
        rearTeleCamera?.resolution
          ? `${formatMegapixelHeadline(rearTeleCamera.resolution)} telephoto`
          : null,
        rearVideoSummary ? `Video: ${rearVideoSummary}` : null,
        withPrefix(rearMainCamera?.aperture, "Aperture"),
        withPrefix(rearMainCamera?.sensor, "Sensor"),
      ]),
    },
    {
      key: "camera-front",
      scoreKey: "camera",
      title: "Front Camera",
      leadPoint: formatMegapixelHeadline(frontCamera?.resolution),
      points: toUniquePoints([
        frontCameraModePoint,
        frontVideoSummary ? `Video: ${frontVideoSummary}` : null,
        withPrefix(frontCamera?.aperture, "Aperture"),
        withPrefix(frontCamera?.sensor, "Sensor"),
      ]),
    },
    {
      key: "battery",
      scoreKey: "battery",
      title: "Battery",
      leadPoint: formatCapacityHeadline(
        getBatteryCapacityMah(mobileData) != null
          ? `${getBatteryCapacityMah(mobileData)} mAh`
          : getBatteryCapacityRaw(mobileData),
      ),
      points: toUniquePoints([
        withPrefix(
          mobileData?.battery?.charging_power ||
            mobileData?.battery?.fast_charging,
          "Charging",
        ),
        withPrefix(mobileData?.battery?.battery_type, "Type"),
        withPrefix(
          mobileData?.battery?.rated_capacity ||
            mobileData?.battery?.ratedCapacity,
          "Rated",
        ),
        withPrefix(
          mobileData?.battery?.wireless_charging ||
            mobileData?.battery?.wireless,
          "Wireless",
        ),
      ]),
    },
    {
      key: "design",
      title: "Design",
      leadPoint: formatDesignHeadline(buildDesignData),
      points: toUniquePoints([
        formatWeightHeadline(buildDesignData.weight),
        formatColorsHeadline(buildDesignData.colors),
        withPrefix(buildDesignData.water_dust_resistance, "Water resistance"),
      ]),
    },
    {
      key: "os",
      title: "OS",
      leadPoint: osLeadText,
      points: toUniquePoints([
        withPrefix(
          mobileData?.performance?.os_version ||
            mobileData?.performance?.version ||
            mobileData?.os_version,
          "Version",
        ),
        withPrefix(
          mobileData?.performance?.update_policy ||
            mobileData?.software?.update_policy ||
            mobileData?.updates,
          "Updates",
        ),
      ]),
    },
  ].filter(
    (section) => hasContent(section.leadPoint) || section.points.length > 0,
  );

  const compareTarget = popularComparisonTargets[0] || null;
  const detailInfoSections = infoKeySections.filter(Boolean);

  if (shouldRenderAliasNotFound) {
    return <NotFound />;
  }

  // If initial loading state (no mobileData yet), render spinner now
  if (showInitialLoading) {
    return (
      <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        <div className="bg-white rounded-lg p-8 text-center shadow-sm">
          <Spinner />
          <div className="text-sm text-gray-500 mt-3">Please wait</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full sm:px-4 lg:px-6 m-0">
      <SEO
        title={metaTitle}
        description={metaDescription}
        keywords={metaKeywords}
        image={ogImage}
        imageWidth={ogImageWidth}
        imageHeight={ogImageHeight}
        imageAlt={ogImageAlt}
        url={canonicalUrl}
        robots={seoRobots}
        ogType="product"
        schema={pageSchema}
      />
      {isSharedLink && (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 rounded">
            Shared link detected â€” showing the shared product details.
          </div>
        </div>
      )}
      {/* Share Menu Modal */}
      {showShareMenu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[24px] border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-slate-900">
                Share Device
              </h3>
              <button
                onClick={() => setShowShareMenu(false)}
                className="text-slate-400 transition-colors hover:text-slate-600"
              >
                Ã—
              </button>
            </div>
            <div className="space-y-3">
              <button
                onClick={shareToWhatsApp}
                className="w-full flex items-center gap-3 rounded-xl border border-green-100 bg-green-50 p-3 font-medium text-green-700 transition-colors hover:bg-green-100"
              >
                <FaWhatsapp className="text-xl" />
                Share on WhatsApp
              </button>
              <button
                onClick={shareToFacebook}
                className="w-full flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 font-medium text-slate-700 transition-colors hover:bg-slate-100"
              >
                <FaFacebook className="text-xl text-blue-600" />
                Share on Facebook
              </button>
              <button
                onClick={shareToTwitter}
                className="w-full flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 font-medium text-slate-700 transition-colors hover:bg-slate-100"
              >
                <FaTwitter className="text-xl text-sky-500" />
                Share on Twitter
              </button>
              <button
                onClick={shareViaEmail}
                className="w-full flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 font-medium text-slate-700 transition-colors hover:bg-slate-100"
              >
                <FaEnvelope className="text-xl" />
                Share via Email
              </button>
              {/* Copy link removed â€” share-only option provided above */}
            </div>
            <button
              onClick={() => setShowShareMenu(false)}
              className="mt-4 w-full py-2 font-medium text-slate-600 transition-colors hover:text-slate-800"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <section className="w-full text-slate-900">
        <div
          className={`mx-auto max-w-7xl ${combineResponsiveClasses(RESPONSIVE_SPACING.pageMarginX)} ${combineResponsiveClasses(RESPONSIVE_SPACING.pageMarginY)}`}
        >
          <div
            className={combineResponsiveClasses(
              RESPONSIVE_SPACING.headerPadding,
            )}
          >
            <div
              className={`flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between`}
            >
              <div className="min-w-0 flex-1">
                {headerDescriptor ? (
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.32em] text-blue-500 sm:text-xs">
                    {headerDescriptor}
                  </p>
                ) : null}
                <div
                  className={`flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center ${RESPONSIVE_SPACING.gapMedium}`}
                >
                  <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-[2rem]">
                    {headerTitle}
                  </h1>
                  <button
                    onClick={() => {
                      if (compareTarget) {
                        handlePopularCompare(compareTarget);
                        return;
                      }
                      navigate("/compare");
                    }}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-800 sm:w-auto"
                  >
                    <FaPlus className="text-sm" />
                    Compare
                  </button>
                </div>
                {headerSummary ? (
                  <div className="mt-2 max-w-3xl">
                    <p className="text-sm leading-6 text-slate-600 sm:text-base">
                      {visibleHeaderSummary}
                    </p>
                    {headerSummaryHasMore ? (
                      <button
                        type="button"
                        onClick={() =>
                          setShowHeaderSummaryFull((prev) => !prev)
                        }
                        className="mt-2 inline-flex items-center text-sm font-semibold text-blue-600 transition-colors hover:text-blue-700"
                        aria-expanded={showHeaderSummaryFull}
                      >
                        {showHeaderSummaryFull ? "Show less" : "Read more"}
                      </button>
                    ) : null}
                  </div>
                ) : null}

                <div className="mt-3 flex flex-wrap items-center gap-2 text-[13px] sm:text-sm">
                  {currentVariantLabel ? (
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-medium text-slate-700">
                      {currentVariantLabel}
                    </span>
                  ) : null}
                  {launchStatus &&
                  launchStatus !== "released" &&
                  launchStatus !== "upcoming" ? (
                    <span
                      className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold leading-none ${launchStatusBadgeClass}`}
                    >
                      {launchStatusLabel}
                    </span>
                  ) : null}
                  {mobileData?.isAiPhone ? (
                    <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold leading-none text-sky-700 ring-1 ring-sky-100">
                      <span
                        className="inline-flex items-center justify-center h-3 w-3"
                        aria-hidden="true"
                      >
                        <svg viewBox="0 0 64 64" className="h-3 w-3">
                          <path
                            d="M32 2C34.5 14.5 40 20 52 22C40 24 34.5 29.5 32 42C29.5 29.5 24 24 12 22C24 20 29.5 14.5 32 2Z"
                            fill="red"
                          />
                          <path
                            d="M50 34C51.5 41.5 55 45 62 46C55 47 51.5 50.5 50 58C48.5 50.5 45 47 38 46C45 45 48.5 41.5 50 34Z"
                            fill="#7E57C2"
                          />
                        </svg>
                      </span>
                      <span>AI Phone</span>
                    </span>
                  ) : null}
                </div>

                {currentVariant || headerSpecScoreBlock ? (
                  <div className="mt-4 flex items-start justify-between gap-3 sm:block">
                    <div className="min-w-0">
                      {currentVariant ? (
                        <>
                          <div className="text-[2rem] font-bold tracking-tight text-emerald-600 sm:text-3xl">
                            {currentPriceDisplay || "Price not available"}
                          </div>
                          <div className="text-[13px] text-slate-500 sm:pb-0.5 sm:text-sm">
                            ({currentVariant.ram} / {currentVariant.storage})
                          </div>
                        </>
                      ) : null}
                    </div>
                    {headerSpecScoreBlock ? (
                      <div className="shrink-0 sm:hidden">
                        {headerSpecScoreBlock}
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <div className="mt-5 flex flex-col gap-3 xl:hidden">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleFavorite}
                      className="rounded-full border border-slate-200 p-2 transition-colors hover:bg-slate-50"
                    >
                      <FaHeart
                        className={`text-lg ${
                          isFavorite
                            ? "text-rose-500 fill-current"
                            : "text-slate-500"
                        }`}
                      />
                    </button>
                    <button
                      onClick={handleShare}
                      className="rounded-full border border-slate-200 p-2 transition-colors hover:bg-slate-50"
                    >
                      <FaShareAlt className="text-lg text-slate-500" />
                    </button>
                  </div>

                  {headerSpecScoreBlock ? (
                    <div className="hidden flex-wrap items-center gap-2 text-[13px] text-slate-600 sm:flex sm:gap-3 sm:text-sm">
                      {headerSpecScoreBlock}
                    </div>
                  ) : null}

                  {hasLaunchDate ? (
                    <div className="flex flex-wrap items-center gap-2 text-[13px] text-slate-600 sm:text-sm">
                      <span>
                        Launched On:{" "}
                        <span className="font-semibold text-slate-900">
                          {launchDateParsed.toLocaleDateString("en-US", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="hidden flex-col items-start gap-3 xl:flex xl:items-end">
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleFavorite}
                    className="rounded-full border border-slate-200 p-2 transition-colors hover:bg-slate-50"
                  >
                    <FaHeart
                      className={`text-lg ${
                        isFavorite
                          ? "text-rose-500 fill-current"
                          : "text-slate-500"
                      }`}
                    />
                  </button>
                  <button
                    onClick={handleShare}
                    className="rounded-full border border-slate-200 p-2 transition-colors hover:bg-slate-50"
                  >
                    <FaShareAlt className="text-lg text-slate-500" />
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[13px] text-slate-600 sm:gap-3 sm:text-sm">
                  {headerSpecScoreBlock}
                </div>

                {hasLaunchDate ? (
                  <div className="flex flex-wrap items-center gap-2 text-[13px] text-slate-600 sm:text-sm">
                    <span
                      className="hidden h-4 w-px bg-slate-200 sm:inline-block"
                      aria-hidden="true"
                    />
                    <span>
                      Launched On:{" "}
                      <span className="font-semibold text-slate-900">
                        {launchDateParsed.toLocaleDateString("en-US", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Comparisons */}
      {!compareDisabled && popularComparisonTargets.length > 0 && (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8  pb-1">
          <div className="mb-3 flex flex-col gap-1 sm:mb-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-500">
              Recommended Comparisons
            </p>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">
              Compare with{" "}
              <span className="text-blue-600">{metaBrand || "this brand"}</span>{" "}
              devices
            </h2>
            <p className="max-w-3xl text-sm leading-6 text-slate-500">
              Explore popular alternatives and see how this model stacks up
              against other phones from the same brand.
            </p>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-3">
            {popularComparisonTargets
              .slice(
                0,
                compareLimit === 2 ? 2 : popularComparisonTargets.length,
              )
              .map((d) => {
                const otherId = d?.id ?? d?.product_id ?? d?.productId ?? null;
                const otherName = d?.name || d?.model || "Device";
                const otherImg = d?.images?.[0] || d?.image || "";

                return (
                  <button
                    key={String(otherId || otherName)}
                    type="button"
                    onClick={() => handlePopularCompare(d)}
                    className="min-w-[84vw] max-w-[280px] flex-shrink-0 rounded-lg border border-slate-200 bg-white p-3 text-left transition-all hover:border-blue-200 hover:shadow-sm sm:min-w-[240px]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-md bg-slate-100">
                        {otherImg ? (
                          <img
                            src={otherImg}
                            alt={otherName}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[11px] text-slate-500">
                          Compare with
                        </div>
                        <div className="truncate text-sm font-semibold text-slate-900">
                          {otherName}
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-blue-700">
                        Compare
                      </span>
                    </div>
                  </button>
                );
              })}
          </div>
        </div>
      )}

      <div
        className={`mx-auto max-w-7xl ${combineResponsiveClasses(RESPONSIVE_SPACING.pageMarginX)} py-6`}
      >
        <div
          className={`flex flex-col lg:flex-row ${RESPONSIVE_SPACING.gapXLarge}`}
        >
          {/* Images Section */}
          <div
            className={`lg:w-2/5 rounded-md bg-transparent ${combineResponsiveClasses(RESPONSIVE_SPACING.imagePadding)} shadow-none`}
          >
            <div className="space-y-5">
              {/* Main Image */}
              <div className="relative overflow-hidden rounded-[28px] bg-white px-4 py-8 sm:px-10 sm:py-12">
                {carouselImages.length > 1 ? (
                  <>
                    <button
                      type="button"
                      onClick={goToPreviousImage}
                      aria-label="Previous image"
                      className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full border border-slate-200 bg-white/95 p-3 text-slate-600 shadow-md transition-all hover:border-blue-300 hover:text-blue-700"
                    >
                      <FaChevronLeft className="text-sm" />
                    </button>
                    <button
                      type="button"
                      onClick={goToNextImage}
                      aria-label="Next image"
                      className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full border border-slate-200 bg-white/95 p-3 text-slate-600 shadow-md transition-all hover:border-blue-300 hover:text-blue-700"
                    >
                      <FaChevronRight className="text-sm" />
                    </button>
                  </>
                ) : null}

                <div className="flex min-h-[340px] items-center justify-center sm:min-h-[420px]">
                  <img
                    src={
                      carouselImages[activeImage] ||
                      carouselImages[0] ||
                      "/placeholder-image.jpg"
                    }
                    alt={mobileData.name}
                    className="h-auto max-h-[260px] w-auto object-contain drop-shadow-[0_16px_24px_rgba(15,23,42,0.12)] sm:max-h-[360px]"
                    onError={(e) => {
                      e.target.src =
                        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='14' fill='%239ca3af'%3ENo Image%3C/text%3E%3C/svg%3E";
                    }}
                  />
                </div>

                {carouselImages.length > 1 ? (
                  <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2">
                    {carouselImages.map((_, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setActiveImage(index)}
                        aria-label={`Go to image ${index + 1}`}
                        className={`h-2 rounded-full transition-all duration-300 ${
                          activeImage === index
                            ? "w-10 bg-slate-700"
                            : "w-2.5 bg-slate-300 hover:bg-slate-400"
                        }`}
                      />
                    ))}
                  </div>
                ) : null}
              </div>

              {/* color section */}

              {/* Variant selection */}

              {/* Share and Copy Link Buttons - Mobile */}
              <div className="lg:hidden flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={handleShare}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-gradient-to-r from-blue-50 to-blue-50 py-3 font-semibold text-slate-700 transition-all hover:from-blue-100 hover:to-blue-100"
                >
                  <FaShareAlt className="text-blue-500" />
                  <span>Share</span>
                </button>
              </div>

              {variants && variants.length > 0 && (
                <div className="mb-2">
                  <div className="mb-3">
                    <h4 className="text-base font-semibold text-slate-900">
                      Available Variants
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {variants.map((variant, index) => (
                      <button
                        key={variant.variant_id ?? variant.id ?? index}
                        type="button"
                        onClick={() => setSelectedVariant(index)}
                        aria-pressed={selectedVariant === index}
                        aria-label={`Select ${variant.ram} / ${variant.storage} variant`}
                        className={`relative w-full rounded-2xl border p-3 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 sm:p-4 ${
                          selectedVariant === index
                            ? "border-blue-600 bg-gradient-to-br from-blue-600 via-blue-500 to-blue-600 text-white shadow-md"
                            : "border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50"
                        }`}
                      >
                        {selectedVariant === index ? (
                          <span className="absolute right-2 top-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm">
                            <FaCheck className="text-[9px]" />
                          </span>
                        ) : null}
                        <div className="flex items-start gap-2 sm:gap-2.5">
                          <span
                            className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 sm:h-8 sm:w-8 ${
                              selectedVariant === index
                                ? "bg-white/15 text-white ring-white/20"
                                : "bg-slate-50 text-slate-600 ring-slate-200"
                            }`}
                          >
                            <FaMemory className="text-[13px] sm:text-sm" />
                          </span>
                          <div className="min-w-0">
                            <div
                              className={`text-[13px] font-semibold leading-tight sm:text-sm ${
                                selectedVariant === index
                                  ? "text-white"
                                  : "text-slate-900"
                              }`}
                            >
                              {variant.ram} / {variant.storage}
                            </div>
                            <div
                              className={`mt-1 text-[13px] font-bold sm:text-sm ${
                                selectedVariant === index
                                  ? "text-emerald-200"
                                  : "text-emerald-600"
                              }`}
                            >
                              {formatPriceLabel(
                                resolveVariantNumericPrice(variant),
                              ) || "Price not available"}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {currentVariantStoreRows.length > 0 ? (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
                        Store Prices
                      </p>
                      <h4 className="mt-1 text-base font-semibold text-slate-900">
                        Buy {currentVariantLabel || "this variant"} from a store
                      </h4>
                    </div>
                    <span className="shrink-0 text-xs font-medium text-slate-500">
                      {currentVariantStoreRows.length} offers
                    </span>
                  </div>

                  <div className="mt-4 space-y-2">
                    {currentVariantStoreRows.map((storePrice, index) => {
                      const storeObj =
                        storePrice.storeObj ||
                        (storePrice.store ||
                        storePrice.store_name ||
                        storePrice.storeName
                          ? getStore?.(
                              storePrice.store ||
                                storePrice.store_name ||
                                storePrice.storeName ||
                                "",
                            )
                          : null);
                      const storeName =
                        storePrice.display_store_name ||
                        storePrice.store ||
                        storePrice.store_name ||
                        storePrice.storeName ||
                        storeObj?.name ||
                        "Online Store";
                      const ctaText = storePrice.cta_label || "Buy Now";
                      const isPreorderCta =
                        storePrice.is_prebooking === true ||
                        /^(pre(book|order)|coming\s*soon)$/i.test(
                          String(ctaText).trim(),
                        );
                      const rawLogoSrc =
                        storePrice.logo ||
                        (storeName ? getStoreLogo?.(storeName) : null) ||
                        (storeName ? getLogo?.(storeName) : null) ||
                        storeObj?.logo ||
                        "";
                      const logoSrc = rawLogoSrc
                        ? toAbsoluteUrl(rawLogoSrc)
                        : "";

                      return (
                        <div
                          key={`${storePrice.id || storeName || index}`}
                          className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 px-3 py-3"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            {logoSrc ? (
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white ring-1 ring-slate-200">
                                <img
                                  src={logoSrc}
                                  alt={storeName}
                                  className="h-full w-full object-contain"
                                />
                              </div>
                            ) : (
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 ring-1 ring-slate-200">
                                <FaStore className="text-xs text-slate-400" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="truncate text-sm font-semibold text-slate-900">
                                {storeName}
                              </div>
                              <div className="mt-0.5 text-sm font-bold text-emerald-600">
                                {formatPriceLabel(storePrice.price) ||
                                  "Price not available"}
                              </div>
                            </div>
                          </div>

                          <div className="flex shrink-0 items-center gap-3">
                            {storePrice.url ? (
                              <a
                                href={toAbsoluteUrl(storePrice.url)}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-2 text-xs font-semibold transition-colors ${
                                  isPreorderCta
                                    ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                                    : "bg-blue-600 text-white hover:bg-blue-700"
                                }`}
                              >
                                {ctaText || "Buy Now"}
                                <FaExternalLinkAlt className="text-[10px]" />
                              </a>
                            ) : (
                              <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-400">
                                {ctaText || "Unavailable"}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {/* Details Section - Right Side */}
          <div className="lg:w-3/5">
            {/* Desktop Header */}
            <div className="hidden">
              <div className="flex justify-between items-start mb-2">
                <div>
                  {headerDescriptor ? (
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-1">
                      {headerDescriptor}
                    </p>
                  ) : null}
                  <h1 className="text-2xl font-extrabold tracking-tight mb-2">
                    {headerTitle}
                  </h1>
                  <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-700">
                    {currentVariantLabel ? (
                      <span>{currentVariantLabel}</span>
                    ) : null}
                    {launchStatus &&
                    launchStatus !== "released" &&
                    launchStatus !== "upcoming" ? (
                      <span
                        className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold leading-none ${launchStatusBadgeClass}`}
                      >
                        {launchStatusLabel}
                      </span>
                    ) : null}
                    {mobileData?.isAiPhone ? (
                      <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-gradient-to-r from-blue-50 to-blue-50 px-2 py-0.5 text-[10px] font-semibold leading-none text-sky-700 ring-1 ring-sky-100">
                        <span
                          className="inline-flex items-center justify-center w-3 h-3"
                          aria-hidden="true"
                        >
                          <svg viewBox="0 0 64 64" className="w-3 h-3">
                            <path
                              d="M32 2C34.5 14.5 40 20 52 22C40 24 34.5 29.5 32 42C29.5 29.5 24 24 12 22C24 20 29.5 14.5 32 2Z"
                              fill="red"
                            />
                            <path
                              d="M50 34C51.5 41.5 55 45 62 46C55 47 51.5 50.5 50 58C48.5 50.5 45 47 38 46C45 45 48.5 41.5 50 34Z"
                              fill="#7E57C2"
                            />
                          </svg>
                        </span>
                        <span>AI Phone</span>
                      </span>
                    ) : null}
                  </h4>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleFavorite}
                    className="p-2 rounded-full hover:bg-gray-100"
                    title="Add to favorites"
                  >
                    <FaHeart
                      className={`text-xl ${
                        isFavorite
                          ? "text-gray-500 fill-current"
                          : "text-gray-500"
                      }`}
                    />
                  </button>
                  <button
                    onClick={handleShare}
                    className="p-2 rounded-full hover:bg-gray-100"
                    title="Share"
                  >
                    <FaShareAlt className="text-xl text-gray-500" />
                  </button>
                  {/* Copy link removed â€” share-only */}
                </div>
              </div>
              <div className="flex items-center gap-3 mb-6">
                {currentVariant && (
                  <>
                    <span className="text-3xl font-bold text-green-600">
                      {currentPriceDisplay || "Price not available"}
                    </span>
                    <span className="text-sm text-gray-500">
                      ({currentVariant.ram} / {currentVariant.storage} )
                    </span>
                  </>
                )}
              </div>
            </div>

            {detailInfoSections.length > 0 ? (
              <div
                className={`${combineResponsiveClasses(RESPONSIVE_SPACING.specSectionSpacing)} space-y-5`}
              >
                <div className="max-w-2xl ">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-blue-600">
                    Key Specifications
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-slate-900 sm:text-2xl">
                    Main hardware highlights
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500 sm:text-base">
                    A quick breakdown of the processor, display, camera, and
                    battery details that matter most.
                  </p>
                </div>
                <div className="rounded-2xl bg-white p-4 sm:p-5">
                  <div
                    className={`grid grid-cols-1 items-stretch ${combineResponsiveClasses(RESPONSIVE_SPACING.specCardGap)} md:grid-cols-2`}
                  >
                    {detailInfoSections.map((section) => {
                      const iconMeta = highlightIconMap[section.key];
                      const Icon = iconMeta?.Icon;
                      const cardTitle =
                        section.key === "performance"
                          ? "Processor"
                          : section.key === "memory"
                            ? "RAM/Storage"
                            : section.key === "camera"
                              ? "Rear Camera"
                              : section.key === "design"
                                ? "Design"
                                : section.key === "os"
                                  ? "OS"
                                  : section.title;
                      const leadPoint =
                        section.leadPoint || section.points?.[0] || null;
                      const bulletPoints = section.leadPoint
                        ? section.points
                        : section.points?.slice(1) || [];

                      return (
                        <div
                          key={section.key}
                          className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-4 transition-all duration-200 sm:p-5"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50`}
                            >
                              {Icon ? (
                                <Icon
                                  className={`text-[11px] ${iconMeta.color}`}
                                />
                              ) : null}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-sm font-medium leading-none text-slate-600">
                                {cardTitle}
                              </h4>
                            </div>
                          </div>
                          {leadPoint ? (
                            <div className="mt-3 text-[1.05rem] font-bold leading-snug text-slate-900 sm:text-[1.12rem]">
                              {formatSpecValue(leadPoint, section.title)}
                            </div>
                          ) : null}
                          {bulletPoints.length > 0 ? (
                            <ul className="mt-3 space-y-1.5">
                              {bulletPoints.slice(0, 3).map((point, idx) => (
                                <li
                                  key={idx}
                                  className="flex items-start gap-2 text-[13px] leading-5 text-slate-600"
                                >
                                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-500" />
                                  <span className="min-w-0">
                                    {formatSpecValue(point, section.title)}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="flex justify-center pt-1 sm:justify-end">
                  <button
                    type="button"
                    onClick={() => handleTabClick("specifications")}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 transition-all duration-200 "
                  >
                    See full specifications
                    <FaChevronRight className="text-xs" />
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="w-full">
        <div className="mx-auto max-w-7xl px-0 py-0 sm:px-6 sm:py-8 lg:px-8">
          <div className="space-y-4 sm:space-y-6">
            {competitorLimit > 0 ? (
              <CompetitorCards
                title={
                  mobileData?.name
                    ? `Competitors For ${mobileData.name}`
                    : "Top Competitors"
                }
                productName={
                  mobileData?.name || mobileData?.model || "This Device"
                }
                productId={currentProductId}
                onCompare={handlePopularCompare}
                compareDisabled={compareDisabled}
                fallbackCompetitors={popularComparisonTargets}
                currentBrand={mobileData?.brand || ""}
                currentPrice={resolvedCurrentNumericPrice}
                maxCards={competitorLimit}
                className="w-full"
              />
            ) : null}
            <div className="space-y-4 sm:space-y-6">
              <RecommendedSmartphones />
            </div>
          </div>
        </div>
      </div>

      {shouldShowLinkedNews ? (
        <div className="w-full">
          <div className="mx-auto max-w-7xl px-0 py-0 sm:px-6 sm:py-8 lg:px-8">
            <section className="overflow-hidden rounded-[30px] border border-white/70 bg-gradient-to-br from-[#eef1ff] via-[#f4f7ff] to-[#eef5ff] p-4 shadow-[0_18px_44px_rgba(90,108,179,0.10)] sm:p-6 lg:p-8">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-[#082a72] sm:text-[2.1rem]">
                    {linkedNewsHeading}{" "}
                    <span className="bg-gradient-to-r from-[#4a66ff] via-[#8b63ff] to-[#ff7b39] bg-clip-text text-transparent">
                      News
                    </span>
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm text-[#5f6d8f]">
                    This block appears only when the newsroom has a
                    product-linked story saved for this exact smartphone.
                  </p>
                </div>
                {linkedNewsSecondaryStories.length > 0 ? (
                  <div className="inline-flex items-center rounded-full border border-white/80 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#6373a0] shadow-[0_10px_24px_rgba(90,108,179,0.08)]">
                    {exactLinkedNewsStories.length} Linked Stories
                  </div>
                ) : null}
              </div>
              <div className="mt-5 h-px w-full bg-[#cfd8f1]" />

              {linkedNewsHeroStory ? (
                <div className="mt-6 grid items-start gap-4 xl:grid-cols-[264px,minmax(0,1fr)]">
                  <div className="max-w-[264px]">
                    <LinkedNewsStoryCard story={linkedNewsHeroStory} />
                  </div>
                  {linkedNewsSecondaryStories.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2 xl:max-w-[420px]">
                      {linkedNewsSecondaryStories.map((story) => (
                        <LinkedNewsStoryCard
                          key={story.slug}
                          story={story}
                          compact={true}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div className="mt-8 flex justify-center">
                <Link
                  to="/news"
                  className="inline-flex items-center gap-3 text-lg font-semibold text-[#082a72] transition-colors hover:text-[#3557d3]"
                >
                  View All News
                  <FaArrowRight className="text-base" />
                </Link>
              </div>
            </section>
          </div>
        </div>
      ) : null}

      {activeTab === "specifications" ? (
        <div className="w-full">
          <div className="mx-auto max-w-7xl px-0 py-0 sm:px-6 sm:py-8 lg:px-8">
            <div className="min-w-0">{renderTabContent()}</div>
            <div className="mt-6 px-1 sm:px-0">
              <ProductDiscoverySections
                productId={currentProductId}
                currentBrand={mobileData?.brand || ""}
                className="w-full"
                layout="latestPhones"
              />
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="w-full">
            <div className="mx-auto max-w-7xl px-0 py-0 sm:px-6 sm:py-8 lg:px-8">
              {renderTabContent()}
            </div>
          </div>

          <div className="w-full">
            <div className="mx-auto max-w-7xl px-0 py-0 sm:px-6 sm:py-8 lg:px-8">
              <div className="px-4 sm:px-0">
                <ProductDiscoverySections
                  productId={currentProductId}
                  currentBrand={mobileData?.brand || ""}
                  className="w-full"
                  layout="latestPhones"
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MobileDetailCard;
