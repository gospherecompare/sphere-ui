// src/components/DeviceList.jsx
import React, { useState, useEffect, useMemo } from "react";
import {
  FaStar,
  FaBatteryFull,
  FaMemory,
  FaSyncAlt,
  FaFingerprint,
  FaWifi,
  FaShieldAlt,
  FaRobot,
  FaFilter,
  FaTimes,
  FaSearch,
  FaStore,
  FaMoneyBill,
  FaWeight,
  FaShoppingBag,
  FaCalendarAlt,
  FaMobileAlt,
  FaInfoCircle,
  FaChevronDown,
  FaChevronRight,
  FaExternalLinkAlt,
  FaPlus,
} from "react-icons/fa";
import { useDevice } from "../../hooks/useDevice";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import LatestNewsRouteSection from "../ui/LatestNewsRouteSection";
import {
  fetchSmartphones,
  fetchTrendingSmartphones,
  fetchNewLaunchSmartphones,
  fetchUpcomingSmartphones,
} from "../../store/deviceSlice";
// BannerSlot disabled until completed.
import useStoreLogos from "../../hooks/useStoreLogos";
import Spinner from "../ui/Spinner";
import Breadcrumbs from "../Breadcrumbs";
import SEO from "../SEO";
import ProductDiscoverySections from "../ui/ProductDiscoverySections";
import PopularMobileComparisonsStrip from "../ui/PopularMobileComparisonsStrip";
import MobilePhoneHighlights from "../ui/MobilePhoneHighlights";
import MobileListingControls, {
  MobileSortSheet,
} from "../ui/MobileListingControls";
import { generateSlug } from "../../utils/slugGenerator";
import {
  formatSmartphoneBadgeScore,
  resolveSmartphoneBadgeScore,
} from "../../utils/smartphoneBadgeScore";
import {
  createCollectionSchema,
  createItemListSchema,
} from "../../utils/schemaGenerators";
import { buildListSeoKeywords } from "../../utils/seoKeywordBuilder";
import {
  getSmartphoneFeatureTitle,
  normalizeSeoTitle,
} from "../../utils/seoTitle";
import {
  computePopularSmartphoneFeatures,
  SMARTPHONE_FEATURE_CATALOG,
} from "../../utils/smartphonePopularFeatures";
import {
  buildPublicSmartphoneListingPath as buildSmartphoneListingPath,
  getSmartphoneFeatureRouteMeta,
  normalizeSmartphoneListingSlug,
  stripSmartphoneSeoQueryParams,
} from "../../utils/smartphoneListingRoutes";
import { buildCanonicalComparePathFromDevices } from "../../utils/compareRoutes";
import { toCanonicalPagePath } from "../../utils/publicUrl";
import { isPublishedProduct } from "../../utils/publishedProducts";
import { fetchPublicJson } from "../../utils/publicJsonRequest";
import MobilesXSpecScore from "../ui/MobileXSpecScore";
import ProductFilterSheet from "../ui/ProductFilterSheet";

const ROUTE_FEED_CACHE_KEY = "hooks_smartphone_route_feed_v1";
const SMARTPHONES_PER_PAGE = 20;
const SMARTPHONE_SKELETON_COUNT = 8;
const SMARTPHONE_MOBILE_SORT_OPTIONS = [
  {
    value: "featured",
    label: "Featured Phones",
    description: "Recommended phones first",
  },
  {
    value: "price-low",
    label: "Price: Low to High",
    description: "Budget-friendly phones first",
  },
  {
    value: "price-high",
    label: "Price: High to Low",
    description: "Premium phones first",
  },
  {
    value: "rating",
    label: "Highest Rating",
    description: "Top-rated phones first",
  },
  {
    value: "newest",
    label: "Newest First",
    description: "Recent phone launches first",
  },
];

const toFeatureSeoLabel = (value = "") => {
  const normalized = (() => {
    try {
      return decodeURIComponent(String(value || ""));
    } catch {
      return String(value || "");
    }
  })()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) return "";
  return normalized
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const areFilterStatesEqual = (left, right) => {
  try {
    return JSON.stringify(left) === JSON.stringify(right);
  } catch {
    return false;
  }
};

const toSeoTextWithoutCommas = (value = "") =>
  String(value || "").replace(/,/g, "");

const normalizeMemoryFilterLabel = (value = "", fallbackUnit = "GB") => {
  const raw = String(value || "").trim();
  if (!raw || raw.toLowerCase() === "nan") return "";

  const match = raw.toUpperCase().match(/(\d+(?:\.\d+)?)\s*(TB|GB|MB)?/);
  if (!match) return raw.replace(/\s+/g, " ");

  const amount = Number(match[1]);
  const amountLabel = Number.isInteger(amount)
    ? String(amount)
    : String(amount).replace(/\.0$/, "");
  const unit = (match[2] || fallbackUnit || "GB").toUpperCase();

  return `${amountLabel} ${unit}`;
};

const extractMemoryFilterLabels = (value = "", fallbackUnit = "GB") =>
  String(value || "")
    .split(/[\/,|]+/)
    .map((item) => normalizeMemoryFilterLabel(item, fallbackUnit))
    .filter(Boolean);

const compareMemoryFilterLabels = (a, b) => {
  const parse = (value) => {
    const label = normalizeMemoryFilterLabel(value);
    const match = label.match(/(\d+(?:\.\d+)?)\s*(TB|GB|MB)/i);
    if (!match) return 0;
    const amount = Number(match[1]);
    const unit = match[2].toUpperCase();
    if (unit === "TB") return amount * 1024;
    if (unit === "MB") return amount / 1024;
    return amount;
  };

  return parse(a) - parse(b);
};

// Product image carousel with automatic five-second rotation
const ImageCarousel = ({
  images = [],
  fallbackTitle = "Official teaser pending",
  fallbackSubtitle = "Image coming soon",
  fallbackLogo = "",
  compact = false,
  altText = "Smartphone product image",
  priority = false,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const imageSignature = Array.isArray(images)
    ? images.map((image) => String(image || "")).join("|")
    : "";
  const imageFrameClass = compact
    ? "flex h-40 w-28 items-center justify-center overflow-hidden rounded-xl bg-transparent sm:h-44 sm:w-32"
    : "flex h-48 w-32 items-center justify-center overflow-hidden rounded-xl bg-transparent sm:h-56 sm:w-40 lg:h-[340px] lg:w-[210px]";
  const imageClass = compact
    ? "h-full w-full scale-105 object-contain p-1"
    : "h-full w-full object-contain p-1 sm:p-2 lg:p-3";

  useEffect(() => {
    setCurrentIndex(0);
  }, [imageSignature]);

  useEffect(() => {
    if (!Array.isArray(images) || images.length <= 1) return undefined;

    const carouselTimer = window.setInterval(() => {
      setCurrentIndex((index) => (index + 1) % images.length);
    }, 5000);

    return () => window.clearInterval(carouselTimer);
  }, [images.length]);

  // If no images or single image, show static image
  if (!images || images.length === 0) {
    return (
      <div className="relative flex h-full w-full items-center justify-center">
        <div
          className={`${imageFrameClass} border border-slate-100 bg-gradient-to-br from-slate-50 via-white to-blue-50`}
        >
          <div className="px-3 text-center">
            <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-blue-100">
              {fallbackLogo ? (
                <img
                  src={fallbackLogo}
                  alt=""
                  className="h-7 w-7 object-contain"
                  loading="lazy"
                />
              ) : (
                <FaMobileAlt className="text-blue-500 text-sm" />
              )}
            </div>
            <span className="block text-[11px] font-semibold text-slate-600">
              {fallbackTitle}
            </span>
            <span className="mt-1 block text-[10px] text-slate-400">
              {fallbackSubtitle}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Single image case
  if (images.length === 1) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className={imageFrameClass}>
          <img
            src={images[0]}
            alt={altText}
            className={imageClass}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
          />
        </div>
      </div>
    );
  }

  // Multiple images rotate automatically every five seconds.
  return (
    <div className="flex h-full w-full flex-col items-center justify-center">
      <div className={`${imageFrameClass} relative`}>
        <img
          src={images[currentIndex]}
          alt={`${altText} view ${currentIndex + 1}`}
          className={imageClass}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
        />
      </div>

      <div
        className="mt-1.5 flex items-center justify-center"
        aria-label="Product image carousel"
      >
        <div className="flex max-w-[100px] items-center justify-center gap-1 overflow-hidden">
          {images.slice(0, 6).map((_, index) => (
            <button
              key={`dot-${index}`}
              type="button"
              onClick={(event) => {
                event?.stopPropagation();
                setCurrentIndex(index);
              }}
              aria-label={`Go to image ${index + 1}`}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                currentIndex === index
                  ? "w-4 bg-blue-600"
                  : "w-1.5 bg-slate-300 hover:bg-slate-400"
              }`}
            />
          ))}
        </div>
      </div>
      <span className="mt-0.5 text-[8px] font-semibold text-slate-400">
        {currentIndex + 1}/{images.length}
      </span>
    </div>
  );
};

const SmartphoneGridSkeleton = ({ count = SMARTPHONE_SKELETON_COUNT }) => (
  <div
    className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 md:gap-5 xl:grid-cols-3 xl:gap-6"
    aria-label="Loading smartphones"
    aria-busy="true"
  >
    {Array.from({ length: count }).map((_, index) => (
      <div
        key={`smartphone-skeleton-${index}`}
        className="min-h-[440px] animate-pulse rounded-3xl border border-slate-200 bg-white p-4 shadow-sm  "
      >
        <div className="mx-auto h-52 w-36 rounded-2xl bg-slate-200 " />
        <div className="mt-5 h-3 w-24 rounded bg-slate-200 " />
        <div className="mt-3 h-6 w-4/5 rounded bg-slate-200 " />
        <div className="mt-3 h-4 w-3/5 rounded bg-slate-200 " />
        <div className="mt-8 h-16 rounded-2xl bg-slate-100 " />
        <div className="mt-5 h-10 rounded-xl bg-slate-200 " />
      </div>
    ))}
  </div>
);

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

const API_ASSET_ORIGIN = "https://api.apisphere.in";
const SITE_ORIGIN = "https://mobilesx.in";

const Smartphones = ({ onlyUpcoming = false } = {}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const deviceContext = useDevice({
    resources: ["brands"],
  });
  const { smartphone, smartphoneAll, smartphonePagination } =
    deviceContext || {};
  const {
    filterSlug,
    brandSlug: routeBrandSlug = "",
    featureSlug: routeFeatureSlug = "",
  } = useParams();
  const params = useMemo(
    () => new URLSearchParams(location.search || ""),
    [location.search],
  );
  const legacyBrandParam = params.get("brand");
  const legacyFeatureParam = params.get("feature");
  const normalizedFilterSlug = String(filterSlug || "")
    .trim()
    .toLowerCase();
  const normalizedRoutePathname = String(location?.pathname || "")
    .replace(/\/+$/, "")
    .toLowerCase();
  const listFilter =
    onlyUpcoming || normalizedRoutePathname === "/smartphones/upcoming"
      ? "upcoming"
      : normalizedRoutePathname === "/trending/smartphones"
        ? "trending"
        : normalizedFilterSlug;
  const normalizedBrandSlug = normalizeSmartphoneListingSlug(
    routeBrandSlug || legacyBrandParam || "",
  );
  const normalizedFeature = normalizeSmartphoneListingSlug(
    routeFeatureSlug || legacyFeatureParam || "",
  );
  const shouldUseServerPagination =
    normalizedRoutePathname === "/smartphones" &&
    !location.search &&
    !onlyUpcoming;

  const [popularFeatureOrder, setPopularFeatureOrder] = useState([]);
  const [popularFeatureOrderLoaded, setPopularFeatureOrderLoaded] =
    useState(false);

  const phonesForFeatureList = useMemo(() => {
    if (Array.isArray(smartphoneAll) && smartphoneAll.length)
      return smartphoneAll;
    return Array.isArray(smartphone) ? smartphone : [];
  }, [smartphoneAll, smartphone]);

  useEffect(() => {
    let cancelled = false;
    const controller =
      typeof AbortController !== "undefined" ? new AbortController() : null;

    (async () => {
      try {
        const data = await fetchPublicJson(
          "https://api.apisphere.in/api/public/popular-features?deviceType=smartphone&days=7&limit=16",
          { signal: controller?.signal },
        );
        const order = Array.isArray(data?.results)
          ? data.results
              .map((r) => r.feature_id || r.featureId || r.id)
              .filter(Boolean)
          : [];
        if (!cancelled) {
          setPopularFeatureOrder(order);
          setPopularFeatureOrderLoaded(true);
        }
      } catch {
        // ignore popularity fetch errors
      }
    })();

    return () => {
      cancelled = true;
      try {
        controller?.abort?.();
      } catch {
        // ignore
      }
    };
  }, []);

  const popularFeatures = useMemo(() => {
    let base = computePopularSmartphoneFeatures(phonesForFeatureList, {
      limit: 0,
    });

    // Reorder by real user clicks (last 7 days) when available
    if (popularFeatureOrder && popularFeatureOrder.length) {
      const byId = new Map(base.map((f) => [f.id, f]));
      const ordered = [];
      for (const id of popularFeatureOrder) {
        if (!byId.has(id)) continue;
        ordered.push(byId.get(id));
        byId.delete(id);
      }
      ordered.push(...byId.values());
      base = ordered;
    }

    // Ensure current selection is visible even if it has 0 matching devices
    if (normalizedFeature && !base.some((f) => f.id === normalizedFeature)) {
      const def = SMARTPHONE_FEATURE_CATALOG.find(
        (f) => f.id === normalizedFeature,
      );
      if (def) base = [{ ...def, count: 0 }, ...base];
    }

    return base.slice(0, 16);
  }, [phonesForFeatureList, normalizedFeature, popularFeatureOrder]);

  const isListFilter =
    listFilter === "trending" ||
    listFilter === "new" ||
    listFilter === "upcoming";
  const usesDedicatedRouteFeed = isListFilter;
  const smartphonesForList = useMemo(() => {
    if (isListFilter) {
      const list = Array.isArray(smartphone) ? smartphone : [];
      return list.length ? list : phonesForFeatureList;
    }
    return phonesForFeatureList;
  }, [isListFilter, smartphone, phonesForFeatureList]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!usesDedicatedRouteFeed) return;
    try {
      window.localStorage.setItem(
        ROUTE_FEED_CACHE_KEY,
        JSON.stringify(smartphonesForList || []),
      );
    } catch {
      // ignore cache failures
    }
  }, [usesDedicatedRouteFeed, smartphonesForList]);

  const dispatch = useDispatch();

  useEffect(() => {
    if (!shouldUseServerPagination) return;
    dispatch(
      fetchSmartphones({ page: 1, limit: SMARTPHONES_PER_PAGE, force: true }),
    );
  }, [dispatch, shouldUseServerPagination]);

  useEffect(() => {
    if (shouldUseServerPagination) return;
    if (listFilter === "trending") dispatch(fetchTrendingSmartphones());
    else if (listFilter === "new") dispatch(fetchNewLaunchSmartphones());
    else if (listFilter === "upcoming") dispatch(fetchUpcomingSmartphones());
    else if (!smartphoneAll || smartphoneAll.length === 0)
      dispatch(fetchSmartphones());
  }, [
    listFilter,
    dispatch,
    shouldUseServerPagination,
    smartphoneAll ? smartphoneAll.length : 0,
  ]);

  // Normalize legacy query-based brand/feature routes into the canonical path shape.
  useEffect(() => {
    const hasLegacySeoQueryRoute =
      !normalizedFilterSlug &&
      (Boolean(legacyBrandParam) || Boolean(legacyFeatureParam));
    const hasSeoListingRoute =
      Boolean(routeBrandSlug) ||
      Boolean(routeFeatureSlug) ||
      hasLegacySeoQueryRoute;

    if (!hasSeoListingRoute) return;

    const nextParams = stripSmartphoneSeoQueryParams(location.search || "");
    const desiredUrl = buildSmartphoneListingPath({
      brand: normalizedBrandSlug,
      feature: normalizedFeature,
      query: nextParams,
    });
    const currentUrl = `${location.pathname}${location.search || ""}`;

    if (desiredUrl !== currentUrl) {
      navigate(desiredUrl, { replace: true });
    }
  }, [
    location.pathname,
    location.search,
    navigate,
    normalizedBrandSlug,
    normalizedFeature,
    normalizedFilterSlug,
    routeBrandSlug,
    routeFeatureSlug,
    legacyBrandParam,
    legacyFeatureParam,
  ]);

  const { getLogo, getStore, getStoreLogo } = useStoreLogos();

  // Helper function to extract numeric price
  const extractNumericPrice = (price) => {
    if (!price || price === "NaN") return 0;
    const numeric = parseInt(String(price).replace(/[^0-9]/g, ""));
    return isNaN(numeric) ? 0 : numeric;
  };

  const getLocalDateOnlyString = (value = new Date()) => {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const normalizeDateOnlyString = (value) => {
    if (!value) return null;
    if (value instanceof Date) return getLocalDateOnlyString(value);
    const raw = String(value).trim();
    if (!raw) return null;
    const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
    const dmyMatch = raw.match(/^(\d{1,2})[\s/-](\d{1,2})[\s/-](\d{4})$/);
    if (dmyMatch) {
      const day = String(Number(dmyMatch[1])).padStart(2, "0");
      const month = String(Number(dmyMatch[2])).padStart(2, "0");
      return `${dmyMatch[3]}-${month}-${day}`;
    }
    return getLocalDateOnlyString(raw);
  };

  const parseDateValue = (value) => {
    const dateOnly = normalizeDateOnlyString(value);
    if (!dateOnly) return null;
    const [year, month, day] = dateOnly.split("-").map(Number);
    const parsed = new Date(year, month - 1, day);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const isFutureDateValue = (value) => {
    const dateOnly = normalizeDateOnlyString(value);
    const today = getLocalDateOnlyString();
    return Boolean(dateOnly && today && dateOnly > today);
  };

  const normalizeLaunchStatus = (value) => {
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

  const normalizeSaleStatus = (value) => {
    if (!value) return null;
    const text = String(value).trim().toLowerCase();
    if (!text) return null;
    if (/(sale[\s_-]?scheduled|upcoming|coming soon|expected)/i.test(text))
      return "sale_scheduled";
    if (/(sale[\s_-]?started|started)/i.test(text)) return "sale_started";
    if (/(store[\s_-]?pending|store[\s_-]?listing[\s_-]?pending)/i.test(text))
      return "store_pending";
    if (/(out[\s_-]?of[\s_-]?stock|sold[\s_-]?out)/i.test(text))
      return "out_of_stock";
    if (/(on sale|in stock|sale live|live)/i.test(text)) return "on_sale";
    if (/sale[\s_-]?live/i.test(text)) return "sale_live";
    if (/(sale[\s_-]?tbd|sale[\s_-]?ta|tbd)/i.test(text)) return "sale_tbd";
    return null;
  };

  const getCompareLimitForStage = (stage) => {
    if (stage === "rumored") return 0;
    if (stage === "announced") return 2;
    return 4;
  };

  const parseMarketPriceValue = (value) => {
    if (value == null || value === "") return null;
    const normalized = Number(String(value).replace(/[^0-9.]/g, ""));
    return Number.isFinite(normalized) && normalized > 0 ? normalized : null;
  };

  const hasStoreMarketSignal = (store) => {
    if (!store || typeof store !== "object") return false;
    return Boolean(
      parseMarketPriceValue(
        store.price ??
          store.current_price ??
          store.sale_price ??
          store.offer_price ??
          store.mrp,
      ) ||
      store.url ||
      store.store ||
      store.store_name ||
      store.storeName ||
      store.display_store_name ||
      store.sale_start_date ||
      store.saleStartDate ||
      store.sale_date ||
      store.saleDate ||
      store.available_from ||
      store.availableFrom,
    );
  };

  const getDeviceStoreRows = (device) => {
    const rows = [];

    if (Array.isArray(device?.storePrices)) rows.push(...device.storePrices);
    else if (Array.isArray(device?.store_prices))
      rows.push(...device.store_prices);

    const variants = Array.isArray(device?.variants) ? device.variants : [];
    variants.forEach((variant) => {
      if (Array.isArray(variant?.storePrices))
        rows.push(...variant.storePrices);
      else if (Array.isArray(variant?.store_prices))
        rows.push(...variant.store_prices);
    });

    return rows.filter(Boolean);
  };

  const hasLiveStoreSignal = (store) => {
    if (!store || typeof store !== "object") return false;
    if (
      isFutureDateValue(
        store.sale_start_date ||
          store.saleStartDate ||
          store.sale_date ||
          store.saleDate ||
          store.available_from ||
          store.availableFrom,
      )
    ) {
      return false;
    }

    const availabilityText = String(
      store?.availability_status ??
        store?.availabilityStatus ??
        store?.sale_status ??
        store?.saleStatus ??
        store?.cta_label ??
        store?.ctaLabel ??
        "",
    )
      .trim()
      .toLowerCase();

    if (store?.is_live === true || store?.isLive === true) return true;
    if (
      /(live|on sale|in stock|available|buy now|shop now)/i.test(
        availabilityText,
      )
    )
      return true;

    return Boolean(
      parseMarketPriceValue(
        store.price ??
          store.current_price ??
          store.sale_price ??
          store.offer_price ??
          store.mrp,
      ) ||
      String(
        store.url ||
          store.link ||
          store.affiliate_link ||
          store.affiliateUrl ||
          "",
      ).trim(),
    );
  };

  const hasSpecScoreMarketSignal = (device) => {
    if (!device || typeof device !== "object") return false;

    if (resolveSaleStartDate(device)) return true;

    if (
      parseMarketPriceValue(
        device.price ??
          device.current_price ??
          device.launch_price ??
          device.starting_price ??
          device.price_in_india ??
          device.expected_price,
      )
    ) {
      return true;
    }

    const stores = Array.isArray(device.storePrices)
      ? device.storePrices
      : Array.isArray(device.store_prices)
        ? device.store_prices
        : [];
    if (stores.some(hasStoreMarketSignal)) return true;

    const variants = Array.isArray(device.variants) ? device.variants : [];
    return variants.some((variant) => {
      if (!variant || typeof variant !== "object") return false;
      if (
        parseDateValue(
          variant.saleStartDate ??
            variant.sale_start_date ??
            variant.saleDate ??
            variant.sale_date,
        )
      ) {
        return true;
      }
      if (
        parseMarketPriceValue(
          variant.price ??
            variant.current_price ??
            variant.launch_price ??
            variant.starting_price ??
            variant.expected_price,
        )
      ) {
        return true;
      }
      const variantStores = Array.isArray(variant.storePrices)
        ? variant.storePrices
        : Array.isArray(variant.store_prices)
          ? variant.store_prices
          : [];
      return variantStores.some(hasStoreMarketSignal);
    });
  };

  const isSpecScoreAllowed = (device = null) =>
    device?.allowSpecScore === true || device?.allow_spec_score === true;

  const toNumberOrNull = (value) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  };

  const resolveDevicePolicy = (device) => {
    const stage = resolveLaunchStage(device);
    const allowCompareRaw =
      device?.allowCompare ?? device?.allow_compare ?? null;
    const allowCompare =
      typeof allowCompareRaw === "boolean" ? allowCompareRaw : false;
    const compareLimitRaw = toNumberOrNull(
      device?.compareLimit ?? device?.compare_limit,
    );
    const allowSpecScoreRaw =
      device?.allowSpecScore ?? device?.allow_spec_score ?? null;
    const competitorLimitRaw = toNumberOrNull(
      device?.competitorLimit ?? device?.competitor_limit,
    );

    return {
      stage,
      allowCompare,
      compareLimit: Number.isFinite(compareLimitRaw) ? compareLimitRaw : 0,
      competitorLimit: Number.isFinite(competitorLimitRaw)
        ? competitorLimitRaw
        : 0,
      allowSpecScore: allowSpecScoreRaw === true,
    };
  };

  const resolveSaleStartDate = (device) => {
    if (!device) return null;
    const direct =
      device.availableDate ||
      device.available_date ||
      device.predictedAvailableDate ||
      device.predicted_available_date ||
      device.saleStartDate ||
      device.sale_start_date ||
      device.saleDate ||
      device.sale_date ||
      null;
    const directDate = parseDateValue(direct);
    if (directDate) return directDate;

    const storePrices = Array.isArray(device.storePrices)
      ? device.storePrices
      : Array.isArray(device.store_prices)
        ? device.store_prices
        : [];
    const dates = storePrices
      .map((store) =>
        parseDateValue(
          store?.sale_start_date ||
            store?.saleStartDate ||
            store?.sale_date ||
            store?.saleDate ||
            store?.available_from ||
            store?.availableFrom ||
            null,
        ),
      )
      .filter(Boolean);
    if (dates.length) return dates.sort((a, b) => a - b)[0];

    const variants = Array.isArray(device.variants) ? device.variants : [];
    for (const variant of variants) {
      const variantDate = parseDateValue(
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
        const storeDate = parseDateValue(
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

  const resolveLaunchStage = (device) => {
    if (!device) return null;
    const saleStartDate = resolveSaleStartDate(device);
    if (isFutureDateValue(saleStartDate)) return "upcoming";
    const hasStoreEntries =
      getDeviceStoreRows(device).some(hasStoreMarketSignal);
    if (!hasStoreEntries) return "upcoming";
    return "available";
  };

  const resolveSaleStage = (device) => {
    if (!device) return "sale_tbd";
    return (
      normalizeSaleStatus(
        device.saleStatusOverride || device.sale_status_override,
      ) ||
      normalizeSaleStatus(device.saleStatus || device.sale_status) ||
      normalizeSaleStatus(device.saleStatusText || device.sale_status_text) ||
      normalizeSaleStatus(
        device.availabilityStatus || device.availability_status,
      ) ||
      "sale_tbd"
    );
  };

  const resolveStoreStage = (device) => {
    if (!device) return "none";
    const storeRows = getDeviceStoreRows(device);
    if (isFutureDateValue(resolveSaleStartDate(device))) {
      return storeRows.some(hasStoreMarketSignal) ? "scheduled" : "none";
    }
    const explicitStage = String(
      device.storeStage ||
        device.store_stage ||
        device.storeStageOverride ||
        "",
    )
      .trim()
      .toLowerCase();
    if (explicitStage === "live") return "live";
    if (explicitStage === "listed" || explicitStage === "store_pending") {
      return "listed";
    }
    if (explicitStage === "none") return "none";
    if (storeRows.some(hasLiveStoreSignal)) return "live";
    if (storeRows.some(hasStoreMarketSignal)) return "listed";
    return "none";
  };

  const formatLaunchDate = (date) =>
    date
      ? date.toLocaleDateString("en-US", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "";

  const resolveLaunchDateLabel = (device, launchDate) => {
    const typeText = String(
      device?.launchDateType ||
        device?.launch_date_type ||
        device?.launchStatus ||
        device?.launch_status ||
        "",
    ).toLowerCase();
    if (/confirm|official|announc/.test(typeText)) return "Launch date";
    if (/rumou?r|estimate|expect|predict/.test(typeText))
      return "Expected launch";
    return "Launch date";
  };

  const resolveUpcomingExpectedPriceMeta = (device) => {
    const numeric = extractNumericPrice(
      device?.expected_price ||
        device?.expectedPrice ||
        device?.manual_expected_price ||
        device?.manualExpectedPrice,
    );
    const source = String(
      device?.expected_price_source || device?.expectedPriceSource || "",
    )
      .trim()
      .toLowerCase();
    return { numeric, source };
  };

  const resolveUpcomingPriceLabel = (device, fallbackNumericPrice = 0) => {
    const originalNumeric =
      extractNumericPrice(
        device?.original_price ||
          device?.originalPrice ||
          device?.starting_price ||
          device?.startingPrice ||
          device?.price,
      ) || fallbackNumericPrice;
    if (originalNumeric > 0) {
      return `₹ ${originalNumeric.toLocaleString("en-IN")}`;
    }

    const expected = resolveUpcomingExpectedPriceMeta(device);
    if (expected.numeric > 0) {
      return `₹ ${expected.numeric.toLocaleString("en-IN")}`;
    }

    return "Price not confirmed";
  };

  const getRenderType = (device) => {
    const backendRenderType = String(
      device?.render_type || device?.renderType || "",
    )
      .trim()
      .toLowerCase();

    const saleStartDate = resolveSaleStartDate(device);
    if (isFutureDateValue(saleStartDate)) return "upcoming";
    const storeRows = getDeviceStoreRows(device);
    const hasStoreEntries = storeRows.some(hasStoreMarketSignal);
    if (!hasStoreEntries) return "upcoming";
    if (saleStartDate) return "available";
    if (backendRenderType === "available") return "available";

    const launchStage = resolveLaunchStage(device);
    if (
      launchStage === "upcoming" ||
      launchStage === "rumored" ||
      launchStage === "announced"
    ) {
      return "upcoming";
    }
    const saleStage = resolveSaleStage(device);
    const storeStage = resolveStoreStage(device);

    if (
      storeStage === "live" ||
      saleStage === "on_sale" ||
      saleStage === "sale_live" ||
      saleStage === "out_of_stock" ||
      storeStage === "listed"
    ) {
      return "available";
    }

    return "available";
  };

  const getCompareLimitForDevices = (devices = []) =>
    (Array.isArray(devices) ? devices : []).reduce((limit, device) => {
      const policy = resolveDevicePolicy(device);
      const deviceLimit = Number.isFinite(policy.compareLimit)
        ? policy.compareLimit
        : limit;
      return Math.min(limit, deviceLimit);
    }, 4);

  const normalizeAssetUrl = (value) => {
    const raw = String(value || "").trim();
    if (!raw) return null;
    if (/^(https?:|data:|blob:)/i.test(raw)) return raw;
    if (raw.startsWith("//")) return `https:${raw}`;
    if (raw.startsWith("/")) return `${API_ASSET_ORIGIN}${raw}`;
    if (/^(uploads|assets|images)\//i.test(raw)) {
      return `${API_ASSET_ORIGIN}/${raw.replace(/^\/+/, "")}`;
    }
    return raw;
  };

  const sortStoreRows = (stores = []) =>
    [...stores].sort(
      (a, b) => extractNumericPrice(a?.price) - extractNumericPrice(b?.price),
    );

  const getAvailabilityState = (stores, brandName) => {
    const normalizedStores = (Array.isArray(stores) ? stores : []).map(
      (store) => {
        return {
          ...store,
          cta_label: store?.cta_label || "Buy Now",
        };
      },
    );

    if (normalizedStores.length === 0) {
      return { stores: [], hiddenCount: 0, mode: "none" };
    }

    const hasStoreUrl = (value) => Boolean(String(value || "").trim());
    const liveStores = sortStoreRows(
      normalizedStores.filter((store) => hasStoreUrl(store?.url)),
    );
    if (liveStores.length > 0) {
      return {
        stores: liveStores,
        hiddenCount: Math.max(liveStores.length - 3, 0),
        mode: "live",
      };
    }

    return {
      stores: sortStoreRows(normalizedStores),
      hiddenCount: Math.max(normalizedStores.length - 3, 0),
      mode: "fallback",
    };
  };

  // Map API response to device format
  const mapApiToDevice = (apiDevice, idx) => {
    function toString(v) {
      if (v == null) return "";
      if (typeof v === "string") return v.trim();
      if (typeof v === "number" || typeof v === "boolean") return String(v);
      if (typeof v === "object") {
        const common = [
          "name",
          "title",
          "model",
          "label",
          "value",
          "processor",
          "chipset",
          "cpu",
          "gpu",
          "display",
          "brand",
          "size",
          "display_size",
          "displaySize",
          "type",
          "display_type",
          "displayType",
          "resolution",
          "display_resolution",
          "refresh_rate",
          "refreshRate",
          "hz",
          "rate",
          "ram",
          "storage",
          "battery",
          "capacity",
        ];
        for (const k of common) {
          if (v[k] == null) continue;
          if (k === "refresh_rate" || k === "refreshRate" || k === "hz") {
            const raw = v[k];
            const text =
              typeof raw === "number" || typeof raw === "boolean"
                ? String(raw)
                : String(raw || "").trim();
            return text ? (/hz/i.test(text) ? text : `${text} Hz`) : "";
          }
          return String(v[k]).trim();
        }
        const scalarValues = Object.values(v)
          .filter(
            (val) =>
              typeof val === "string" ||
              typeof val === "number" ||
              typeof val === "boolean",
          )
          .map((val) => String(val).trim())
          .filter(Boolean);
        if (scalarValues.length) return scalarValues.join(" ");
        return "";
      }
      return "";
    }
    const toNumber = (v) => {
      if (v == null || v === "") return null;
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };
    // pick: choose first non-null, non-empty value
    const pick = (...vals) =>
      vals.find((v) => v != null && String(v).trim() !== "");
    const profileDisplay = {};

    // If this device already looks normalized (from Redux), return as-is to avoid double-normalization
    if (
      apiDevice &&
      apiDevice.productType === "smartphone" &&
      apiDevice.specs &&
      typeof apiDevice.specs === "object"
    ) {
      return { ...apiDevice };
    }
    // Images
    const images = apiDevice.images || [];

    // Normalize `variants` array: prefer `variant_id` as `id` so downstream
    // code can rely on `v.id` existing (API sometimes uses `variant_id`).
    const variants = Array.isArray(apiDevice.variants)
      ? apiDevice.variants.map((v) => ({
          ...v,
          id: v.id ?? v.variant_id ?? v.variantId,
        }))
      : [];

    // Aggregate store prices from variants -> store_prices
    let storePrices = [];
    if (variants.length > 0) {
      storePrices = variants.flatMap((v) => {
        const variantBase = v.base_price || v.basePrice || v.base;
        const prices = Array.isArray(v.store_prices)
          ? v.store_prices.map((sp) => {
              const storeName =
                sp.store_name || sp.store || sp.storeName || sp.storeName;
              return {
                ...sp,
                id: sp.id,
                variant_id: v.id,
                store: storeName,
                store_name: storeName,
                storeName: storeName,
                display_store_name:
                  sp.display_store_name || sp.displayStoreName || storeName,
                storeObj: getStore ? getStore(storeName) : null,
                // do not persist logo here â€” resolve at render time via getLogo()
                price: sp.price,
                url: sp.url || sp.url_link || sp.link,
                last_updated: sp.last_updated || sp.lastUpdated,
                cta_label: sp.cta_label || sp.ctaLabel || null,
                availability_status:
                  sp.availability_status || sp.availabilityStatus || null,
                sale_start_date:
                  sp.sale_start_date ||
                  sp.saleStartDate ||
                  sp.sale_date ||
                  null,
                sale_date: sp.sale_date || sp.saleDate || null,
                logo: normalizeAssetUrl(
                  sp.logo || sp.store_logo || sp.storeLogo || null,
                ),
              };
            })
          : [];
        // include variant base price if no store prices present for this variant
        if (prices.length === 0 && variantBase) {
          return [
            {
              id: `v-${v.id || "unknown"}`,
              variant_id: v.id,
              store: "Variant",
              price: variantBase,
            },
          ];
        }
        return prices;
      });
    }

    // If still empty, try top-level store_prices or variants fallback
    if (storePrices.length === 0) {
      if (Array.isArray(apiDevice.store_prices)) {
        storePrices = apiDevice.store_prices.map((sp) => {
          const storeName =
            sp.store_name || sp.store || sp.storeName || "Store";
          return {
            ...sp,
            id: sp.id,
            store: storeName,
            store_name: storeName,
            storeName: storeName,
            display_store_name:
              sp.display_store_name || sp.displayStoreName || storeName,
            storeObj: getStore ? getStore(storeName) : null,
            // resolve logo at render time via getLogo(storeName)
            price: sp.price,
            url: sp.url || sp.url_link || sp.link,
            cta_label: sp.cta_label || sp.ctaLabel || null,
            availability_status:
              sp.availability_status || sp.availabilityStatus || null,
            sale_start_date:
              sp.sale_start_date || sp.saleStartDate || sp.sale_date || null,
            sale_date: sp.sale_date || sp.saleDate || null,
            logo: normalizeAssetUrl(
              sp.logo || sp.store_logo || sp.storeLogo || null,
            ),
          };
        });
      }
    }

    // Compute numeric price as lowest available store price or variant/base price
    // Prefer variant base_price over store prices
    const variantBaseCandidates = variants.length
      ? variants
          .map((v) =>
            extractNumericPrice(v.base_price || v.basePrice || v.base),
          )
          .filter((n) => n > 0)
      : [];

    let numericPrice = 0;
    if (variantBaseCandidates.length > 0) {
      numericPrice = Math.min(...variantBaseCandidates);
    } else {
      const candidatePrices = storePrices
        .map((p) => extractNumericPrice(p.price))
        .filter((n) => n > 0);
      numericPrice = candidatePrices.length ? Math.min(...candidatePrices) : 0;
    }
    const serverBestPriceRaw = pick(
      toString(apiDevice.best_price),
      toString(apiDevice.bestPrice),
      toString(apiDevice.lowest_price),
      toString(apiDevice.lowestPrice),
      "",
    );
    const serverBestPriceNumeric = extractNumericPrice(serverBestPriceRaw);
    if (serverBestPriceNumeric > 0) {
      numericPrice = serverBestPriceNumeric;
    }
    const expectedPriceRaw = pick(
      apiDevice.expected_price,
      apiDevice.expectedPrice,
      apiDevice.manual_expected_price,
      apiDevice.manualExpectedPrice,
      "",
    );
    const expectedPriceNumeric = extractNumericPrice(expectedPriceRaw);
    const expectedPriceSource = pick(
      toString(apiDevice.expected_price_source),
      toString(apiDevice.expectedPriceSource),
      "",
    );
    const expectedPriceBasis = pick(
      toString(apiDevice.expected_price_basis),
      toString(apiDevice.expectedPriceBasis),
      "",
    );
    const expectedPriceConfidence = pick(
      toString(apiDevice.expected_price_confidence),
      toString(apiDevice.expectedPriceConfidence),
      "",
    );
    const originalPriceNumeric = extractNumericPrice(
      apiDevice.original_price || apiDevice.originalPrice,
    );
    const startingPriceNumeric = extractNumericPrice(
      apiDevice.starting_price || apiDevice.startingPrice,
    );
    const priceSource = pick(
      toString(apiDevice.price_source),
      toString(apiDevice.priceSource),
      "",
    );

    // Battery (support multiple shapes)
    const batteryRaw =
      apiDevice.battery?.battery_capacity_mah ||
      apiDevice.battery?.battery_capacity ||
      apiDevice.battery?.capacity_mAh ||
      apiDevice.battery?.capacity_mah ||
      apiDevice.battery?.capacity ||
      apiDevice.battery?.battery ||
      apiDevice.battery_capacity_mah ||
      apiDevice.battery_capacity ||
      apiDevice.capacity_mAh ||
      apiDevice.capacity_mah ||
      apiDevice.battery ||
      profileDisplay.battery ||
      "";
    const numericBattery = parseInt(
      String(batteryRaw).replace(/[^0-9]/g, "") || "0",
    );

    const formatHz = (val) => {
      if (val == null) return "";
      const raw =
        typeof val === "number" || typeof val === "boolean"
          ? String(val)
          : String(val || "").trim();
      if (!raw) return "";
      return /hz/i.test(raw) ? raw : `${raw} Hz`;
    };

    // Refresh rate
    const refreshRate = formatHz(
      apiDevice.display?.refresh_rate ||
        apiDevice.display?.refreshRate ||
        profileDisplay.refresh_rate ||
        "",
    );

    // Build / design specifics (dimensions, weight, thickness, back material)
    const build = apiDevice.build_design || apiDevice.build || {};
    const dimensionWidth = build.width || build.size || apiDevice.width || "";
    const dimensionHeight = build.height || apiDevice.height || "";
    // weight may be an object with variants (alpha_black, legend_white, etc.)
    let weightStr = "";
    if (build.weight) {
      if (typeof build.weight === "string") weightStr = build.weight;
      else if (typeof build.weight === "object") {
        const vals = Object.values(build.weight).filter(Boolean);
        weightStr = vals.length ? String(vals[0]) : "";
      }
    }
    const thicknessStr =
      build.thickness && typeof build.thickness === "string"
        ? build.thickness
        : build.thickness && typeof build.thickness === "object"
          ? Object.values(build.thickness).find(Boolean) || ""
          : "";
    const backMaterial =
      (build.back_material &&
        (typeof build.back_material === "string"
          ? build.back_material
          : Object.values(build.back_material || {}).find(Boolean))) ||
      apiDevice.back_material ||
      "";

    // Connectivity details
    const connectivity =
      apiDevice.connectivity || apiDevice.connectivity_network || {};
    const wifiSupport = Array.isArray(connectivity.wifi)
      ? connectivity.wifi.join(", ")
      : connectivity.wifi || "";
    const bluetooth = connectivity.bluetooth || "";
    const gps = connectivity.gps || "";
    const nfc = connectivity.nfc || "";
    const otg = connectivity.otg || "";
    const usb = connectivity.usb || "";

    // Network support (5G / 4G) â€” keep this human-readable for filters/UI
    const supports5g = () => {
      const sources = [
        apiDevice.connectivity_network,
        apiDevice.connectivity,
        apiDevice.network,
      ].filter(Boolean);

      const parseSupportFlag = (obj) => {
        if (!obj || typeof obj !== "object") return null;
        const raw =
          obj._5g_support ?? obj["5g_support"] ?? obj["5G_support"] ?? null;
        if (raw === null || raw === undefined) return null;
        if (typeof raw === "boolean") return raw;
        const s = String(raw).trim().toLowerCase();
        if (!s) return null;
        if (s.startsWith("y") || s === "true" || s.includes("supported"))
          return true;
        if (s.startsWith("n") || s === "false" || s.includes("not"))
          return false;
        return null;
      };

      const get5gBands = (obj) => {
        if (!obj || typeof obj !== "object") return null;
        return (
          obj["5g_bands"] ||
          obj["5G_bands"] ||
          obj.five_g_bands ||
          obj.fiveGBands ||
          obj.five_g ||
          obj.fiveG ||
          obj["5g"] ||
          obj.bands?.["5g"] ||
          obj.bands?.five_g ||
          obj.bands?.fiveG ||
          null
        );
      };

      // Prefer any "true" flag; keep "false" only as a fallback
      let flagged = null;
      for (const src of sources) {
        const flag = parseSupportFlag(src);
        if (flag === true) return true;
        if (flag === false) flagged = false;
      }

      for (const src of sources) {
        const bands = get5gBands(src);
        if (Array.isArray(bands)) {
          if (bands.length > 0) return true;
          continue;
        }
        if (typeof bands === "string") {
          if (bands.trim()) return true;
          continue;
        }
      }

      const techCandidates = [
        apiDevice.connectivity_network?.network_technology,
        apiDevice.connectivity?.network_technology,
        apiDevice.connectivity_network?.network,
        apiDevice.connectivity?.network,
        apiDevice.performance?.network,
      ];
      for (const t of techCandidates) {
        if (!t) continue;
        if (/5g/i.test(String(t))) return true;
      }

      return flagged === true ? true : false;
    };

    const networkSupport = supports5g() ? "5G" : "4G";

    // Camera count and details - prefer structured `camera.rear_camera` if present
    const cam = apiDevice.camera || apiDevice.cameras || {};
    let cameraCount = 0;
    const cameraDetails = [];
    if (cam.rear_camera && typeof cam.rear_camera === "object") {
      const rear = cam.rear_camera;
      if (rear.main) {
        cameraCount += 1;
        cameraDetails.push(
          `${rear.main?.resolution || rear.main?.megapixels || ""}`.trim(),
        );
      }
      if (rear.ultra_wide) {
        cameraCount += 1;
        cameraDetails.push(
          `${rear.ultra_wide?.resolution || rear.ultra_wide?.megapixels || ""}`.trim(),
        );
      }
      if (rear.periscope_telephoto) {
        cameraCount += 1;
        cameraDetails.push(
          `${rear.periscope_telephoto?.zoom ? `${rear.periscope_telephoto.zoom} ` : ""}${rear.periscope_telephoto?.resolution || rear.periscope_telephoto?.megapixels || ""}`.trim(),
        );
      }
    } else {
      const cameraFields = [
        "main_camera_megapixels",
        "telephoto_camera_megapixels",
        "ultrawide_camera_megapixels",
        "front_camera_megapixels",
        "main_camera",
        "front_camera",
      ];
      cameraCount = cameraFields.reduce(
        (acc, k) =>
          cam && (cam[k] || cam[k.replace(/_megapixels$/, "")]) ? acc + 1 : acc,
        0,
      );
    }

    // Rear camera specific resolutions (safe extraction)
    const rearMainRes =
      cam?.rear_camera?.main?.resolution ||
      cam?.rear_camera?.main?.megapixels ||
      "";
    const rearUltraRes =
      cam?.rear_camera?.ultra_wide?.resolution ||
      cam?.rear_camera?.ultra_wide?.megapixels ||
      "";
    const rearPeriscopeRes =
      cam?.rear_camera?.periscope_telephoto?.resolution ||
      cam?.rear_camera?.periscope_telephoto?.megapixels ||
      "";
    const periscopeZoom =
      cam?.rear_camera?.periscope_telephoto?.zoom ||
      cam?.periscope_telephoto?.zoom ||
      "";
    // Use only rear main resolution for the concise camera display
    const rearCameraResolution = [rearMainRes].filter(Boolean).join(" + ");
    if (!cameraCount) {
      const topCount =
        parseInt(
          apiDevice.camera_count ||
            apiDevice.cameraCount ||
            apiDevice.number_of_cameras ||
            apiDevice.cameras_count ||
            0,
          10,
        ) || 0;
      cameraCount = topCount;
    }

    // Performance-provided ram/storage options
    const perf = apiDevice.performance || {};
    const perfRamOptions = Array.isArray(perf.ram_options)
      ? perf.ram_options
      : perf.ram
        ? [perf.ram]
        : [];
    const perfStorageOptions = Array.isArray(perf.storage_options)
      ? perf.storage_options
      : perf.storage
        ? [perf.storage]
        : [];

    // Storage and RAM options from variants or performance
    const variantStorages = variants.length
      ? [...new Set(variants.map((v) => v.storage).filter(Boolean))]
      : [];
    const storageStr =
      variantStorages.length > 0
        ? variantStorages.join(" / ")
        : apiDevice.performance?.ROM_storage ||
          apiDevice.performance?.rom ||
          apiDevice.performance?.storage ||
          profileDisplay.storage ||
          "";

    const variantRams = variants.length
      ? [...new Set(variants.map((v) => v.ram).filter(Boolean))]
      : [];
    const ramStr =
      variantRams.length > 0
        ? variantRams.join(" / ")
        : apiDevice.performance?.ram || profileDisplay.ram || "";

    // build safe display string
    const displayStr =
      typeof apiDevice.display === "string"
        ? apiDevice.display
        : `${apiDevice.display?.size || profileDisplay.display_size || ""} ${apiDevice.display?.type || ""}`.trim();

    const processorCandidate = pick(
      toString(apiDevice.processor),
      toString(apiDevice.cpu),
      toString(apiDevice.performance?.processor),
      profileDisplay.processor,
    );

    const ramCandidate = pick(
      toString(ramStr),
      toString(apiDevice.performance?.ram),
    );

    const storageCandidate = pick(
      toString(storageStr),
      toString(apiDevice.performance?.ROM_storage),
      toString(apiDevice.performance?.rom),
      toString(apiDevice.performance?.storage),
    );

    // Prefer structured rear_camera details (keep `resolution` field),
    // fall back to common flat camera fields or string shapes.
    let cameraCandidate = "";
    let frontStr = "";
    if (Array.isArray(cameraDetails) && cameraDetails.length > 0) {
      const front = cam.front_camera || cam.front || cam.frontCamera || null;
      if (front) {
        const fRes = front?.resolution || front?.megapixels || "";
        frontStr = `${fRes || ""}`.trim();
      }
      cameraCandidate = frontStr
        ? `${cameraDetails.join(" | ")} | Front: ${frontStr}`
        : cameraDetails.join(" | ");
    } else {
      cameraCandidate = pick(
        typeof cam === "string"
          ? toString(cam)
          : toString(cam.main_camera_megapixels) ||
              toString(cam.main_camera) ||
              toString(cam.primary),
        profileDisplay.main_camera,
      );
    }

    // Detect if this device advertises AI capabilities in common fields
    const detectAiPhone = () => {
      if (
        apiDevice.is_ai ||
        apiDevice.ai_phone ||
        apiDevice.isAi ||
        apiDevice.ai
      )
        return true;
      const candidates = [
        apiDevice.features,
        apiDevice.tags,
        apiDevice.keywords,
        apiDevice.ai_features,
        apiDevice.performance?.ai_features,
        apiDevice.camera?.ai,
        apiDevice.camera?.ai_features,
        apiDevice.description,
        apiDevice.summary,
      ];
      for (const c of candidates) {
        if (!c) continue;
        if (Array.isArray(c) && c.some((x) => /ai/i.test(String(x))))
          return true;
        if (typeof c === "string" && /\bai\b/i.test(c)) return true;
      }
      try {
        if (/\bai\b/i.test(JSON.stringify(cam || {}))) return true;
      } catch {}
      return false;
    };
    const isAiPhone = detectAiPhone();

    const specScoreRaw = toNumber(
      apiDevice.spec_score ?? apiDevice.specScore ?? null,
    );
    const overallScoreRaw = toNumber(
      apiDevice.overall_score ?? apiDevice.overallScore ?? null,
    );
    const hookScoreRaw = toNumber(
      apiDevice.hook_score ??
        apiDevice.hookScore ??
        apiDevice.Hookss_score ??
        apiDevice.HookssScore ??
        null,
    );
    const overallScoreDisplay = toNumber(
      apiDevice.spec_score_v2_display_80_98 ??
        apiDevice.specScoreV2Display8098 ??
        apiDevice.overall_score_v2_display_80_98 ??
        apiDevice.overallScoreV2Display8098 ??
        apiDevice.spec_score_display ??
        apiDevice.specScoreDisplay ??
        apiDevice.overall_score_display ??
        apiDevice.overallScoreDisplay,
    );

    const baseDevice = {
      id: pick(
        apiDevice.id,
        apiDevice.product_id,
        apiDevice.productId,
        idx + 1,
      ),
      productId: pick(
        apiDevice.id,
        apiDevice.product_id,
        apiDevice.productId,
        idx + 1,
      ),
      productType: "smartphone",
      name: pick(toString(apiDevice.name), toString(apiDevice.model), "") || "",
      model: toString(apiDevice.model) || "",
      brand: pick(
        toString(apiDevice.brand_name),
        toString(apiDevice.brand),
        "",
      ),
      brandLogo: normalizeAssetUrl(
        pick(
          toString(apiDevice.brand_logo),
          toString(apiDevice.brandLogo),
          toString(apiDevice.brand_image),
          toString(apiDevice.brandImage),
          toString(apiDevice.brand_logo_url),
          toString(apiDevice.brandLogoUrl),
          toString(apiDevice.logo_url),
          toString(apiDevice.logo),
          toString(apiDevice.brand?.logo),
          "",
        ),
      ),
      brandLogoUrl: normalizeAssetUrl(
        pick(
          toString(apiDevice.brand_logo_url),
          toString(apiDevice.brandLogoUrl),
          toString(apiDevice.brand_logo),
          toString(apiDevice.brandLogo),
          toString(apiDevice.brand_image),
          toString(apiDevice.brandImage),
          toString(apiDevice.logo_url),
          toString(apiDevice.logo),
          toString(apiDevice.brand?.logo),
          "",
        ),
      ),
      brandWebsite: pick(
        toString(apiDevice.brand_website),
        toString(apiDevice.brandWebsite),
        toString(apiDevice.brand_url),
        toString(apiDevice.brandUrl),
        "",
      ),
      launchStatus: pick(
        toString(apiDevice.launch_status),
        toString(apiDevice.launchStatus),
        "",
      ),
      launchStatusOverride: pick(
        toString(apiDevice.launch_status_override),
        toString(apiDevice.launchStatusOverride),
        "",
      ),
      saleStatusOverride: pick(
        toString(apiDevice.sale_status_override),
        toString(apiDevice.saleStatusOverride),
        "",
      ),
      saleStatus: pick(
        toString(apiDevice.sale_status),
        toString(apiDevice.saleStatus),
        "",
      ),
      saleStatusText: pick(
        toString(apiDevice.sale_status_text),
        toString(apiDevice.saleStatusText),
        "",
      ),
      trendBadge: pick(
        toString(apiDevice.trend_badge),
        toString(apiDevice.trendBadge),
        toString(apiDevice.trend_label),
        toString(apiDevice.trendLabel),
        "",
      ),
      availabilityStatus: pick(
        toString(apiDevice.availability_status),
        toString(apiDevice.availabilityStatus),
        "",
      ),
      storeStage: pick(
        toString(apiDevice.store_stage),
        toString(apiDevice.storeStage),
        "",
      ),
      storeStageOverride: pick(
        toString(apiDevice.store_stage_override),
        toString(apiDevice.storeStageOverride),
        "",
      ),
      render_type: pick(
        toString(apiDevice.render_type),
        toString(apiDevice.renderType),
        "",
      ),
      renderType: pick(
        toString(apiDevice.renderType),
        toString(apiDevice.render_type),
        "",
      ),
      display_status: pick(
        toString(apiDevice.display_status),
        toString(apiDevice.displayStatus),
        "",
      ),
      displayStatus: pick(
        toString(apiDevice.displayStatus),
        toString(apiDevice.display_status),
        "",
      ),
      launchDateType: pick(
        toString(apiDevice.launch_date_type),
        toString(apiDevice.launchDateType),
        "",
      ),
      priceConfidence: pick(
        toString(apiDevice.price_confidence),
        toString(apiDevice.priceConfidence),
        "",
      ),
      original_price: originalPriceNumeric > 0 ? originalPriceNumeric : "",
      originalPrice: originalPriceNumeric > 0 ? originalPriceNumeric : "",
      starting_price: startingPriceNumeric > 0 ? startingPriceNumeric : "",
      startingPrice: startingPriceNumeric > 0 ? startingPriceNumeric : "",
      price_source: priceSource,
      priceSource: priceSource,
      expected_price: expectedPriceNumeric > 0 ? expectedPriceNumeric : "",
      expectedPrice: expectedPriceNumeric > 0 ? expectedPriceNumeric : "",
      expected_price_source: expectedPriceSource,
      expectedPriceSource: expectedPriceSource,
      expected_price_basis: expectedPriceBasis,
      expectedPriceBasis: expectedPriceBasis,
      expected_price_confidence: expectedPriceConfidence,
      expectedPriceConfidence: expectedPriceConfidence,
      price_is_expected:
        apiDevice.price_is_expected === true ||
        apiDevice.priceIsExpected === true ||
        expectedPriceNumeric > 0,
      priceIsExpected:
        apiDevice.priceIsExpected === true ||
        apiDevice.price_is_expected === true ||
        expectedPriceNumeric > 0,
      price_is_estimated:
        apiDevice.price_is_estimated === true ||
        apiDevice.priceIsEstimated === true ||
        expectedPriceSource === "algorithm",
      priceIsEstimated:
        apiDevice.priceIsEstimated === true ||
        apiDevice.price_is_estimated === true ||
        expectedPriceSource === "algorithm",
      specConfidence: pick(
        toString(apiDevice.spec_confidence),
        toString(apiDevice.specConfidence),
        "",
      ),
      allowCompare:
        typeof apiDevice.allow_compare === "boolean"
          ? apiDevice.allow_compare
          : typeof apiDevice.allowCompare === "boolean"
            ? apiDevice.allowCompare
            : null,
      allowCompetitors:
        typeof apiDevice.allow_competitors === "boolean"
          ? apiDevice.allow_competitors
          : typeof apiDevice.allowCompetitors === "boolean"
            ? apiDevice.allowCompetitors
            : null,
      compareLimit: toNumber(
        apiDevice.compare_limit ?? apiDevice.compareLimit ?? null,
      ),
      competitorLimit: toNumber(
        apiDevice.competitor_limit ?? apiDevice.competitorLimit ?? null,
      ),
      allowSpecScore:
        typeof apiDevice.allow_spec_score === "boolean"
          ? apiDevice.allow_spec_score
          : typeof apiDevice.allowSpecScore === "boolean"
            ? apiDevice.allowSpecScore
            : null,
      saleStartDate: pick(
        toString(apiDevice.available_date),
        toString(apiDevice.availableDate),
        toString(apiDevice.predicted_available_date),
        toString(apiDevice.predictedAvailableDate),
        toString(apiDevice.sale_start_date),
        toString(apiDevice.saleStartDate),
        toString(apiDevice.sale_date),
        toString(apiDevice.saleDate),
        toString(apiDevice.first_sale_date),
        toString(apiDevice.firstSaleDate),
        "",
      ),
      availableDate: pick(
        toString(apiDevice.available_date),
        toString(apiDevice.availableDate),
        toString(apiDevice.sale_start_date),
        toString(apiDevice.saleStartDate),
        toString(apiDevice.predicted_available_date),
        toString(apiDevice.predictedAvailableDate),
        "",
      ),
      predictedAvailableDate: pick(
        toString(apiDevice.predicted_available_date),
        toString(apiDevice.predictedAvailableDate),
        "",
      ),
      availableDateLabel: pick(
        toString(apiDevice.available_date_label),
        toString(apiDevice.availableDateLabel),
        "",
      ),
      spec_score: specScoreRaw,
      ranking_score: toNumber(
        apiDevice.ranking_score ?? apiDevice.rankingScore ?? null,
      ),
      ranking_score_source: pick(
        toString(apiDevice.ranking_score_source),
        toString(apiDevice.rankingScoreSource),
        "",
      ),
      hook_score: hookScoreRaw,
      hookScore: hookScoreRaw,
      spec_score_v2_raw: toNumber(
        apiDevice.spec_score_v2_raw ?? apiDevice.specScoreV2Raw ?? null,
      ),
      spec_score_v2: toNumber(
        apiDevice.spec_score_v2 ?? apiDevice.specScoreV2 ?? null,
      ),
      spec_score_source: pick(
        toString(apiDevice.spec_score_source),
        toString(apiDevice.specScoreSource),
        "",
      ),
      spec_score_v2_source: pick(
        toString(apiDevice.spec_score_v2_source),
        toString(apiDevice.specScoreV2Source),
        "",
      ),
      overall_score: overallScoreRaw,
      overall_score_display:
        overallScoreDisplay != null ? overallScoreDisplay : overallScoreRaw,
      price: numericPrice > 0 ? `₹ ${numericPrice.toLocaleString()}` : "",
      numericPrice: numericPrice,
      rating: parseFloat(apiDevice.rating) || 0,
      reviews:
        apiDevice.reviews && typeof apiDevice.reviews === "number"
          ? `${apiDevice.reviews} reviews`
          : apiDevice.reviews || "",
      image: images[0] || "",
      images: images,
      bestPrice:
        serverBestPriceNumeric > 0
          ? `₹ ${serverBestPriceNumeric.toLocaleString()}`
          : numericPrice > 0
            ? `₹ ${numericPrice.toLocaleString()}`
            : "",
      bestPriceValue:
        serverBestPriceNumeric > 0
          ? serverBestPriceNumeric
          : numericPrice > 0
            ? numericPrice
            : null,
      specs: {
        display: pick(toString(displayStr), toString(apiDevice.display), ""),
        processor: pick(processorCandidate, toString(apiDevice.processor), ""),
        ram: pick(ramCandidate, toString(apiDevice.performance?.ram), ""),
        storage: pick(
          storageCandidate,
          toString(apiDevice.performance?.storage),
          "",
        ),
        camera: pick(cameraCandidate, toString(cameraCandidate), ""),
        rearCameraResolution: pick(rearCameraResolution, ""),
        isAiPhone: isAiPhone,
        periscopeZoom: pick(periscopeZoom, ""),
        frontCameraResolution: pick(frontStr, ""),
        battery: pick(
          toString(batteryRaw),
          numericBattery > 0 ? `${numericBattery} mAh` : null,
          "",
        ),
        os: pick(
          toString(apiDevice.performance?.operating_system),
          toString(apiDevice.performance?.operatingSystem),
          toString(apiDevice.performance?.os),
          "",
        ),
        refreshRate: pick(toString(refreshRate), ""),
        network: pick(toString(networkSupport), ""),
        cameraCount: cameraCount || 0,
      },
      numericBattery: numericBattery,
      // preserve raw nested fields so feature-filtering can inspect original shapes
      battery: apiDevice.battery ?? apiDevice.battery_raw ?? null,
      camera: apiDevice.camera ?? apiDevice.cameras ?? null,
      performance: apiDevice.performance ?? apiDevice.perf ?? null,
      connectivity:
        apiDevice.connectivity ??
        apiDevice.connectivity_network ??
        apiDevice.connectivityNetwork ??
        null,
      network:
        apiDevice.network ??
        apiDevice.connectivity ??
        apiDevice.connectivity_network ??
        null,
      build_design: apiDevice.build_design ?? apiDevice.design ?? null,
      sensors: apiDevice.sensors ?? apiDevice.sensor ?? null,
      display: apiDevice.display ?? null,
      category: apiDevice.category ?? apiDevice.product_type ?? null,
      launchDate: pick(toString(apiDevice.launch_date), ""),
      createdAt: pick(
        toString(apiDevice.created_at),
        toString(apiDevice.createdAt),
        "",
      ),
      storePrices: storePrices,
      variants: variants,
    };
    baseDevice.launchStatus = resolveLaunchStage(baseDevice);
    baseDevice.saleStatus = resolveSaleStage(baseDevice);
    baseDevice.storeStatus = resolveStoreStage(baseDevice);
    if (!isSpecScoreAllowed(baseDevice)) {
      baseDevice.allowSpecScore = false;
      baseDevice.spec_score_v2_raw = null;
      baseDevice.spec_score_v2 = null;
      baseDevice.spec_score = null;
      baseDevice.hook_score = null;
      baseDevice.hookScore = null;
      baseDevice.overall_score = null;
      baseDevice.overall_score_display = null;
    }
    return baseDevice;
  };

  // Transform API data to devices array
  const baseDevices = (smartphonesForList || []).map((device, i) =>
    mapApiToDevice(device, i),
  );
  const devices = baseDevices;

  // Aggregate all variants across smartphones (supports variants array or singular variant)
  const allVariants = devices.flatMap((device) =>
    Array.isArray(device?.variants) ? device.variants : [],
  );
  const [selectedVariantByProduct, setSelectedVariantByProduct] = useState({});

  const getSmartphoneProductKey = (device) =>
    String(
      device?.productId ??
        device?.product_id ??
        device?.baseId ??
        device?.variantProductKey ??
        device?.id ??
        device?.model ??
        "",
    );

  const getVariantIdentity = (variant, variantIndex = 0) =>
    String(
      variant?.variant_id ??
        variant?.id ??
        variant?.variantId ??
        `variant-${variantIndex}`,
    );

  const resolveVariantCardData = (device, variant, variantIndex = 0) => {
    const rawVariantStorePrices = Array.isArray(variant?.store_prices)
      ? variant.store_prices
      : Array.isArray(variant?.storePrices)
        ? variant.storePrices
        : [];
    const mappedVariantStores = rawVariantStorePrices.map((sp) => {
      const storeName = sp.store_name || sp.store || sp.storeName || "Store";
      return {
        ...sp,
        id: sp.id,
        store: storeName,
        store_name: storeName,
        storeName: storeName,
        display_store_name:
          sp.display_store_name || sp.displayStoreName || storeName,
        storeObj: getStore ? getStore(storeName) : null,
        price: sp.price,
        url: sp.url || sp.url_link || sp.link,
        cta_label: sp.cta_label || sp.ctaLabel || null,
        availability_status:
          sp.availability_status || sp.availabilityStatus || null,
        sale_start_date:
          sp.sale_start_date || sp.saleStartDate || sp.sale_date || null,
        sale_date: sp.sale_date || sp.saleDate || null,
        logo: normalizeAssetUrl(
          sp.logo || sp.store_logo || sp.storeLogo || null,
        ),
      };
    });

    const variantBaseNumeric = extractNumericPrice(
      variant?.base_price || variant?.basePrice || variant?.base,
    );
    const variantStoreNumericPrices = mappedVariantStores
      .map((p) => extractNumericPrice(p.price))
      .filter((n) => n > 0);
    const lowestVariantStorePrice =
      variantStoreNumericPrices.length > 0
        ? Math.min(...variantStoreNumericPrices)
        : 0;
    let resolvedNumericPrice = 0;
    if (lowestVariantStorePrice > 0)
      resolvedNumericPrice = lowestVariantStorePrice;
    else if (variantBaseNumeric > 0) resolvedNumericPrice = variantBaseNumeric;
    else if (device.numericPrice > 0)
      resolvedNumericPrice = device.numericPrice;

    const priceDisplay =
      resolvedNumericPrice > 0
        ? `₹ ${resolvedNumericPrice.toLocaleString()}`
        : "";
    const variantRam = variant?.ram || variant?.RAM || "";
    const variantStorage =
      variant?.storage ||
      variant?.storage_capacity ||
      variant?.ROM ||
      variant?.rom ||
      "";
    const variantId = getVariantIdentity(variant, variantIndex);
    const variantLabel =
      [variantRam, variantStorage].filter(Boolean).join(" / ") ||
      `Variant ${variantIndex + 1}`;
    const variantSaleStartDate =
      variant?.sale_start_date ||
      variant?.saleStartDate ||
      variant?.sale_date ||
      variant?.saleDate ||
      variant?.first_sale_date ||
      variant?.firstSaleDate ||
      device.saleStartDate ||
      null;
    return {
      variant,
      variantId,
      variantIndex,
      label: variantLabel,
      ram: variantRam,
      storage: variantStorage,
      storePrices: mappedVariantStores,
      price: priceDisplay,
      numericPrice: resolvedNumericPrice,
      saleStartDate: variantSaleStartDate,
    };
  };

  const getDefaultVariantOption = (options) => {
    if (!options.length) return null;
    const pricedOptions = options.filter((option) => option.numericPrice > 0);
    if (!pricedOptions.length) return options[0];
    return pricedOptions.reduce((best, option) =>
      option.numericPrice < best.numericPrice ? option : best,
    );
  };

  // Build one product card and let the card switch RAM/storage dynamically.
  const variantCards = useMemo(() => {
    return devices.map((device) => {
      const vars =
        Array.isArray(device.variants) && device.variants.length
          ? device.variants
          : [];

      if (vars.length === 0) {
        const productKey = getSmartphoneProductKey(device);
        return {
          ...device,
          id: `${device.id}-product`,
          variantProductKey: productKey,
          variantOptions: [],
          selectedVariantIndex: 0,
        };
      }

      const variantOptions = vars.map((variant, variantIndex) =>
        resolveVariantCardData(device, variant, variantIndex),
      );
      const productKey = getSmartphoneProductKey(device);
      const selectedVariantId = selectedVariantByProduct[productKey];
      const selectedOption =
        variantOptions.find(
          (option) => String(option.variantId) === String(selectedVariantId),
        ) || getDefaultVariantOption(variantOptions);

      return {
        ...device,
        id: `${device.id}-product`,
        variantProductKey: productKey,
        variantIndex: selectedOption?.variantIndex ?? 0,
        selectedVariantIndex: selectedOption?.variantIndex ?? 0,
        selectedVariantId: selectedOption?.variantId ?? null,
        variant: selectedOption?.variant ?? null,
        variantOptions,
        specs: {
          ...device.specs,
          ram: selectedOption?.ram || device.specs.ram,
          storage: selectedOption?.storage || device.specs.storage,
        },
        storePrices: selectedOption?.storePrices || [],
        price: selectedOption?.price || device.price,
        numericPrice: selectedOption?.numericPrice || device.numericPrice,
        saleStartDate: selectedOption?.saleStartDate || device.saleStartDate,
        cardTitle: device.name || device.model || "Unnamed",
      };
    });
  }, [devices, getStore, selectedVariantByProduct]);

  // Unique filter lists derived from all variants
  const uniqueRams = [
    ...new Set(
      allVariants.flatMap((v) => extractMemoryFilterLabels(v?.ram, "GB")),
    ),
  ];
  const uniqueStorage = [
    ...new Set(
      allVariants.flatMap((v) => extractMemoryFilterLabels(v?.storage, "GB")),
    ),
  ];
  const uniqueColors = [
    ...new Set(
      allVariants
        .map((v) => v?.color_name || v?.color_name || v?.color || v?.colorName)
        .filter(Boolean),
    ),
  ];

  // Sort ram and storage options (numeric-aware)
  uniqueRams.sort(compareMemoryFilterLabels);
  const parseStorageValue = (s) => {
    if (!s) return 0;
    const str = normalizeMemoryFilterLabel(s, "GB").toUpperCase();
    if (str.includes("TB")) return parseFloat(str) * 1024;
    return parseInt(str.replace(/[^0-9]/g, "")) || 0;
  };
  uniqueStorage.sort((a, b) => parseStorageValue(a) - parseStorageValue(b));

  // Calculate min/max prices from actual device data
  const devicePrices = devices
    .map((device) => device.numericPrice)
    .filter((price) => price > 0);

  // Use fixed price bounds: min = 0, max = 300000 (3 lakh)
  const MIN_PRICE = 0;
  const MAX_PRICE = 300000;

  const createDefaultFilters = () => ({
    brand: [],
    priceRange: { min: MIN_PRICE, max: MAX_PRICE },
    ram: [],
    storage: [],
    color: [],
    battery: [],
    processor: [],
    network: [],
    refreshRate: [],
    display: [],
    rearCamera: [],
    frontCamera: [],
    additionalFeatures: [],
  });

  const normalizeFilters = (value = {}) => {
    const incoming =
      value && typeof value === "object" && !Array.isArray(value) ? value : {};
    const defaults = createDefaultFilters();
    const priceRange =
      incoming.priceRange &&
      typeof incoming.priceRange === "object" &&
      !Array.isArray(incoming.priceRange)
        ? incoming.priceRange
        : {};
    const asArray = (items) => (Array.isArray(items) ? items : []);
    const asNumber = (number, fallback) => {
      const parsed = Number(number);
      return Number.isFinite(parsed) ? parsed : fallback;
    };

    return {
      ...defaults,
      ...incoming,
      brand: asArray(incoming.brand),
      ram: asArray(incoming.ram),
      storage: asArray(incoming.storage),
      color: asArray(incoming.color),
      battery: asArray(incoming.battery),
      processor: asArray(incoming.processor),
      network: asArray(incoming.network),
      refreshRate: asArray(incoming.refreshRate),
      display: asArray(incoming.display),
      rearCamera: asArray(incoming.rearCamera),
      frontCamera: asArray(incoming.frontCamera),
      additionalFeatures: asArray(incoming.additionalFeatures),
      priceRange: {
        min: asNumber(priceRange.min, defaults.priceRange.min),
        max: asNumber(priceRange.max, defaults.priceRange.max),
      },
    };
  };

  // Helper functions for individual options
  const extractIndividualRamOptions = (devices) => {
    const allRamValues = devices.flatMap((device) => {
      const ram = device.specs.ram;
      if (!ram) return [];
      return extractMemoryFilterLabels(ram, "GB");
    });

    // Remove duplicates and sort by numeric value
    const uniqueRams = [...new Set(allRamValues)].sort(
      compareMemoryFilterLabels,
    );

    return uniqueRams.length > 0
      ? uniqueRams
      : ["4 GB", "6 GB", "8 GB", "12 GB", "16 GB"];
  };

  const extractIndividualStorageOptions = (devices) => {
    const allStorageValues = devices.flatMap((device) => {
      const storage = device.specs.storage;
      if (!storage) return [];
      return extractMemoryFilterLabels(storage, "GB");
    });

    // Remove duplicates and sort by numeric value
    const uniqueStorages = [...new Set(allStorageValues)].sort((a, b) => {
      // Handle TB values by converting to GB for comparison
      const getValueInGB = (str) => {
        if (str.includes("TB")) {
          return parseInt(str) * 1024;
        }
        return parseInt(str);
      };
      return getValueInGB(a) - getValueInGB(b);
    });

    return uniqueStorages.length > 0
      ? uniqueStorages
      : ["64 GB", "128 GB", "256 GB", "512 GB", "1 TB"];
  };

  // Get individual options (use variant-derived unique lists)
  const ramOptions =
    uniqueRams.length > 0 ? uniqueRams : extractIndividualRamOptions(devices);
  const storageOptions =
    uniqueStorage.length > 0
      ? uniqueStorage
      : extractIndividualStorageOptions(devices);
  const colorOptions = uniqueColors;

  const BATTERY_FEATURES = [
    {
      id: "5000mah-plus",
      label: "5000 mAh+ Battery",
      type: "capacity",
      min: 5000,
      icon: FaBatteryFull,
    },
    {
      id: "6000mah-plus",
      label: "6000 mAh+ Battery",
      type: "capacity",
      min: 6000,
      icon: FaBatteryFull,
    },
    {
      id: "7000mah-plus",
      label: "7000 mAh+ Battery",
      type: "capacity",
      min: 7000,
      icon: FaBatteryFull,
    },
    {
      id: "fast-charge-33w-plus",
      label: "33W+ Fast Charging",
      type: "fastCharge",
      min: 33,
      icon: FaBatteryFull,
    },
    {
      id: "fast-charge-65w-plus",
      label: "65W+ Fast Charging",
      type: "fastCharge",
      min: 65,
      icon: FaBatteryFull,
    },
    {
      id: "wireless-charging",
      label: "Wireless Charging",
      type: "wireless",
      icon: FaBatteryFull,
    },
  ];

  const parseBatteryNumberForFilter = (value) => {
    if (value === null || value === undefined) return null;
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    const match = String(value).match(/(\d+(?:\.\d+)?)/);
    if (!match) return null;
    const parsed = Number(match[1]);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const resolveBatteryCapacityForFilter = (device) => {
    const b = device?.battery;
    if (Number(device?.numericBattery || 0) > 0)
      return Number(device.numericBattery);
    if (!b) return parseBatteryNumberForFilter(device?.specs?.battery);
    if (typeof b !== "object") return parseBatteryNumberForFilter(b);
    return (
      parseBatteryNumberForFilter(b.battery_capacity_mah) ??
      parseBatteryNumberForFilter(b.capacity_mAh) ??
      parseBatteryNumberForFilter(b.capacity_mah) ??
      parseBatteryNumberForFilter(b.battery_capacity) ??
      parseBatteryNumberForFilter(b.capacity) ??
      parseBatteryNumberForFilter(b.battery) ??
      parseBatteryNumberForFilter(device?.specs?.battery) ??
      null
    );
  };

  const resolveFastChargeWattForFilter = (device) => {
    const b = device?.battery;
    const values = [];
    if (b && typeof b === "object") {
      values.push(
        b.fast_charging,
        b.fastCharging,
        b.fast_charge,
        b.fastCharge,
        b.charging_speed,
        b.chargingSpeed,
        b.wired_charging,
        b.wiredCharging,
        b.charging,
      );
    } else if (b) {
      values.push(b);
    }
    values.push(device?.specs?.battery);

    const watts = values
      .filter(Boolean)
      .map((value) => parseBatteryNumberForFilter(value))
      .filter((value) => Number.isFinite(value) && value > 0);
    return watts.length ? Math.max(...watts) : null;
  };

  const hasWirelessChargingForFilter = (device) => {
    const b = device?.battery;
    const raw =
      b && typeof b === "object"
        ? (b.wireless_charging ??
          b.wirelessCharging ??
          b.wireless_charge ??
          b.wirelessCharge)
        : null;
    if (typeof raw === "boolean") return raw;
    const text = String(raw ?? device?.specs?.battery ?? b ?? "").toLowerCase();
    return /wireless/.test(text) && !/(no|not|without)\s+wireless/.test(text);
  };

  const matchesBatteryFeature = (device, feature) => {
    if (!feature) return false;
    if (feature.type === "capacity") {
      const capacity = resolveBatteryCapacityForFilter(device) || 0;
      return capacity >= feature.min;
    }
    if (feature.type === "fastCharge") {
      const watts = resolveFastChargeWattForFilter(device) || 0;
      return watts >= feature.min;
    }
    if (feature.type === "wireless") {
      return hasWirelessChargingForFilter(device);
    }
    return false;
  };

  const getProcessorBrand = (processorStr = "") => {
    const p = String(processorStr).toLowerCase();
    if (!p) return "Other";
    if (p.includes("snapdragon")) return "Snapdragon";
    if (p.includes("mediatek") || p.includes("dimensity")) return "MediaTek";
    if (p.includes("apple") || p.includes("a-series") || /a\d{1,2}/.test(p))
      return "Apple";
    if (p.includes("exynos")) return "Exynos";
    if (p.includes("kirin")) return "Kirin";
    return "Other";
  };

  const getProcessorOptions = (devices) => {
    const all = devices.map((d) => getProcessorBrand(d.specs.processor));
    return [...new Set(all)].filter(Boolean);
  };

  const getRefreshRateOptions = (devices) => {
    const labels = devices
      .map((d) => String(d.specs.refreshRate || "").trim())
      .filter(Boolean)
      .map((text) => {
        // extract all numbers, choose the largest (handles ranges like "60-120Hz")
        const nums = (text.match(/\d+/g) || []).map((n) => parseInt(n, 10));
        if (nums.length === 0) return null;
        const max = Math.max(...nums);
        return `${max}Hz`;
      })
      .filter(Boolean);

    // dedupe and sort (descending refresh rate first)
    const unique = [...new Set(labels)];
    unique.sort((a, b) => {
      const na = parseInt(a.replace(/[^0-9]/g, ""), 10) || 0;
      const nb = parseInt(b.replace(/[^0-9]/g, ""), 10) || 0;
      return nb - na;
    });
    return unique;
  };

  const parseCameraMpForFilter = (value) => {
    if (value === null || value === undefined) return null;
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    const text = String(value || "").trim();
    if (!text) return null;
    const mpMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:mp|megapixel)/i);
    const plainMatch = text.match(/^(\d+(?:\.\d+)?)$/);
    const match = mpMatch || plainMatch;
    if (!match) return null;
    const parsed = Number(match[1]);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  };

  const maxCameraMp = (...values) => {
    const numbers = values
      .flat()
      .map((value) => parseCameraMpForFilter(value))
      .filter((value) => Number.isFinite(value) && value > 0);
    return numbers.length ? Math.max(...numbers) : null;
  };

  const lensCameraMp = (lens) => {
    if (!lens) return null;
    if (typeof lens !== "object") return parseCameraMpForFilter(lens);
    return maxCameraMp(
      lens.resolution,
      lens.resolution_mp,
      lens.megapixels,
      lens.mp,
      lens.res,
    );
  };

  const resolveRearCameraMpForFilter = (device) => {
    const cam = device?.camera || {};
    const rear = cam?.rear_camera || cam?.rearCamera || {};
    return maxCameraMp(
      device?.specs?.rearCameraResolution,
      lensCameraMp(rear.main),
      lensCameraMp(rear.primary),
      lensCameraMp(rear.wide),
      lensCameraMp(rear.ultra_wide),
      lensCameraMp(rear.ultrawide),
      lensCameraMp(rear.telephoto),
      lensCameraMp(rear.periscope_telephoto),
      lensCameraMp(cam.main),
      lensCameraMp(cam.primary),
      lensCameraMp(cam.wide),
      lensCameraMp(cam.rear),
      cam.main_camera_megapixels,
      cam.rear_camera_megapixels,
      cam.main_camera,
      cam.primary_camera,
    );
  };

  const resolveFrontCameraMpForFilter = (device) => {
    const cam = device?.camera || {};
    const front = cam?.front_camera || cam?.frontCamera || cam?.front || null;
    return maxCameraMp(
      device?.specs?.frontCameraResolution,
      lensCameraMp(front),
      lensCameraMp(cam.selfie),
      lensCameraMp(cam.selfie_camera),
      cam.front_camera_megapixels,
      cam.selfie_camera_megapixels,
      cam.front_camera,
      cam.front,
    );
  };

  const getCameraMpOptions = (devices, resolver) => {
    const labels = devices
      .map((device) => resolver(device))
      .filter((mp) => Number.isFinite(mp) && mp > 0)
      .map((mp) => `${Math.round(mp)} MP+`);
    const unique = [...new Set(labels)];
    unique.sort(
      (a, b) => parseCameraMpForFilter(b) - parseCameraMpForFilter(a),
    );
    return unique;
  };

  const processorOptions = getProcessorOptions(devices);
  const refreshRateOptions = getRefreshRateOptions(devices);
  const displayOptions = (() => {
    const values = devices
      .map((device) => {
        const raw = device?.display || device?.specs?.display || {};
        if (raw && typeof raw === "object") {
          return (
            raw.panel || raw.type || raw.display_type || raw.technology || ""
          );
        }
        return raw;
      })
      .map((value) => String(value || "").trim())
      .filter(Boolean);
    const unique = [...new Set(values)];
    return unique.sort((a, b) => a.localeCompare(b));
  })();

  const rearCameraOptions = getCameraMpOptions(
    devices,
    resolveRearCameraMpForFilter,
  );
  const frontCameraOptions = getCameraMpOptions(
    devices,
    resolveFrontCameraMpForFilter,
  );
  const networkOptions = (() => {
    const raw = devices
      .map((d) => String(d?.specs?.network || "").trim())
      .filter(Boolean)
      .map((s) => {
        const upper = s.toUpperCase();
        if (upper.includes("5G")) return "5G";
        if (upper.includes("4G")) return "4G";
        return "";
      })
      .filter(Boolean);

    const set = new Set(raw);
    const out = [];
    if (set.has("5G")) out.push("5G");
    if (set.has("4G")) out.push("4G");
    return out.length > 0 ? out : ["5G", "4G"];
  })();

  const [filters, setFilters] = useState(() => createDefaultFilters());

  const [sortBy, setSortBy] = useState("featured");
  const [searchQuery, setSearchQuery] = useState("");
  const [brandFilterQuery, setBrandFilterQuery] = useState("");
  const [ramFilterQuery, setRamFilterQuery] = useState("");
  const [storageFilterQuery, setStorageFilterQuery] = useState("");
  const [batteryFilterQuery, setBatteryFilterQuery] = useState("");
  const [processorFilterQuery, setProcessorFilterQuery] = useState("");
  const [networkFilterQuery, setNetworkFilterQuery] = useState("");
  const [refreshRateFilterQuery, setRefreshRateFilterQuery] = useState("");
  const [displayFilterQuery, setDisplayFilterQuery] = useState("");
  const [additionalFeatureQuery, setAdditionalFeatureQuery] = useState("");
  const [rearCameraFilterQuery, setRearCameraFilterQuery] = useState("");
  const [frontCameraFilterQuery, setFrontCameraFilterQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [openDesktopFilterSection, setOpenDesktopFilterSection] =
    useState("Search & Brands");
  const [openMobileFilterSection, setOpenMobileFilterSection] = useState("");
  const [showAllDesktopBrands, setShowAllDesktopBrands] = useState(false);
  const [showPopularFeaturePicker, setShowPopularFeaturePicker] =
    useState(false);
  const [pendingPopularFeature, setPendingPopularFeature] = useState("");
  const [showHeroDescription, setShowHeroDescription] = useState(false);
  const [compareItems, setCompareItems] = useState([]);

  useEffect(() => {
    if (
      (!showFilters && !showPopularFeaturePicker) ||
      typeof document === "undefined"
    ) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key !== "Escape") return;
      setShowFilters(false);
      setShowPopularFeaturePicker(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showFilters, showPopularFeaturePicker]);
  const [likedItems, setLikedItems] = useState(() => {
    try {
      const stored = localStorage.getItem("likedSmartphones");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [currentPage, setCurrentPage] = useState(1);
  const compareLimit = useMemo(
    () => getCompareLimitForDevices(compareItems),
    [compareItems],
  );

  // Like/Unlike handler
  const handleLikeToggle = (device, e) => {
    e.stopPropagation();
    const deviceId = device._id || device.id || device.model;
    setLikedItems((prevLiked) => {
      const isCurrentlyLiked = prevLiked.includes(deviceId);
      const updated = isCurrentlyLiked
        ? prevLiked.filter((id) => id !== deviceId)
        : [...prevLiked, deviceId];
      try {
        localStorage.setItem("likedSmartphones", JSON.stringify(updated));
      } catch {
        // Handle localStorage quota exceeded
      }
      return updated;
    });
  };

  // Check if device is liked
  const isDeviceLiked = (device) => {
    const deviceId = device._id || device.id || device.model;
    return likedItems.includes(deviceId);
  };

  // Brand-based SEO helper
  const filterBrand =
    normalizedBrandSlug ||
    (Array.isArray(filters?.brand) && filters.brand[0]
      ? filters.brand[0]
      : null);
  const currentBrandObj = (() => {
    const b = filterBrand;
    if (!b) return null;
    const all = deviceContext?.brands || [];
    const norm = (s) => (s || "").toString().toLowerCase();
    const asNumber = Number.isNaN(Number(b)) ? null : Number(b);
    return (
      all.find((br) => {
        if (!br) return false;
        const name = br.name || "";
        const slug = normalizeSmartphoneListingSlug(br.slug || name);
        const idMatches =
          typeof br.id === "number"
            ? asNumber !== null && br.id === asNumber
            : typeof br.id === "string"
              ? br.id === b || norm(br.id) === norm(b)
              : false;
        return idMatches || slug === norm(b) || norm(name) === norm(b);
      }) || {
        name: toFeatureSeoLabel(b),
        slug: normalizeSmartphoneListingSlug(b),
      }
    );
  })();

  // Extract unique brands from devices
  const brands = useMemo(
    () => [...new Set(devices.map((d) => d.brand).filter(Boolean))],
    [devices],
  );
  const filteredBrandOptions = useMemo(() => {
    const q = String(brandFilterQuery || "")
      .trim()
      .toLowerCase();
    if (!q) return brands;
    return brands.filter((brand) =>
      String(brand || "")
        .toLowerCase()
        .includes(q),
    );
  }, [brands, brandFilterQuery]);
  const filteredRamOptions = useMemo(() => {
    const q = String(ramFilterQuery || "")
      .trim()
      .toLowerCase();
    if (!q) return ramOptions;
    return ramOptions.filter((ram) => String(ram).toLowerCase().includes(q));
  }, [ramOptions, ramFilterQuery]);
  const filteredStorageOptions = useMemo(() => {
    const q = String(storageFilterQuery || "")
      .trim()
      .toLowerCase();
    if (!q) return storageOptions;
    return storageOptions.filter((storage) =>
      String(storage).toLowerCase().includes(q),
    );
  }, [storageOptions, storageFilterQuery]);
  const filteredBatteryFeatures = useMemo(() => {
    const q = String(batteryFilterQuery || "")
      .trim()
      .toLowerCase();
    if (!q) return BATTERY_FEATURES;
    return BATTERY_FEATURES.filter((feature) =>
      `${feature.label} ${feature.id}`.toLowerCase().includes(q),
    );
  }, [batteryFilterQuery]);
  const filteredProcessorOptions = useMemo(() => {
    const q = String(processorFilterQuery || "")
      .trim()
      .toLowerCase();
    if (!q) return processorOptions;
    return processorOptions.filter((processor) =>
      String(processor).toLowerCase().includes(q),
    );
  }, [processorOptions, processorFilterQuery]);
  const filteredNetworkOptions = useMemo(() => {
    const q = String(networkFilterQuery || "")
      .trim()
      .toLowerCase();
    if (!q) return networkOptions;
    return networkOptions.filter((network) =>
      String(network).toLowerCase().includes(q),
    );
  }, [networkOptions, networkFilterQuery]);
  const filteredRefreshRateOptions = useMemo(() => {
    const q = String(refreshRateFilterQuery || "")
      .trim()
      .toLowerCase();
    if (!q) return refreshRateOptions;
    return refreshRateOptions.filter((rate) =>
      String(rate).toLowerCase().includes(q),
    );
  }, [refreshRateOptions, refreshRateFilterQuery]);
  const filteredDisplayOptions = useMemo(() => {
    const q = String(displayFilterQuery || "")
      .trim()
      .toLowerCase();
    if (!q) return displayOptions;
    return displayOptions.filter((value) =>
      String(value).toLowerCase().includes(q),
    );
  }, [displayOptions, displayFilterQuery]);

  const additionalFeatureOptions = useMemo(() => {
    const list = Array.isArray(SMARTPHONE_FEATURE_CATALOG)
      ? SMARTPHONE_FEATURE_CATALOG
      : [];
    const q = String(additionalFeatureQuery || "")
      .trim()
      .toLowerCase();
    return q
      ? list.filter((feature) =>
          `${feature.name} ${feature.description || ""}`
            .toLowerCase()
            .includes(q),
        )
      : list;
  }, [additionalFeatureQuery]);
  const filteredRearCameraOptions = useMemo(() => {
    const q = String(rearCameraFilterQuery || "")
      .trim()
      .toLowerCase();
    if (!q) return rearCameraOptions;
    return rearCameraOptions.filter((camera) =>
      String(camera).toLowerCase().includes(q),
    );
  }, [rearCameraOptions, rearCameraFilterQuery]);
  const filteredFrontCameraOptions = useMemo(() => {
    const q = String(frontCameraFilterQuery || "")
      .trim()
      .toLowerCase();
    if (!q) return frontCameraOptions;
    return frontCameraOptions.filter((camera) =>
      String(camera).toLowerCase().includes(q),
    );
  }, [frontCameraOptions, frontCameraFilterQuery]);

  const {
    selectDeviceById,
    selectDeviceByModel,
    addToHistory,
    loading,
    filters: contextFilters,
  } = deviceContext || {};
  const { search } = location;
  const pathname = String(location?.pathname || "").toLowerCase();
  const hasSearchParams = Boolean(
    String(search || "")
      .replace(/^\?+/, "")
      .trim(),
  );
  const isSingleSmartphonePath = pathname === "/smartphone";
  const isNewFilterPath = listFilter === "new";
  const isTrendingFilterPath = listFilter === "trending";
  const isUpcomingFilterPath = listFilter === "upcoming";
  const currentYear = new Date().getFullYear();
  const currentMonthYear = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date());
  const priceFilterMap = {
    "under-10000": { min: 0, max: 10000, label: "Under ₹ 10,000" },
    "under-15000": { min: 0, max: 15000, label: "Under ₹ 15,000" },
    "under-20000": { min: 0, max: 20000, label: "Under ₹ 20,000" },
    "under-25000": { min: 0, max: 25000, label: "Under ₹ 25,000" },
    "under-30000": { min: 0, max: 30000, label: "Under ₹ 30,000" },
    "under-40000": { min: 0, max: 40000, label: "Under ₹ 40,000" },
    "under-50000": { min: 0, max: 50000, label: "Under ₹ 50,000" },
    "above-50000": { min: 50001, max: MAX_PRICE, label: "Above ₹ 50,000" },
  };
  const priceFilter = priceFilterMap[normalizedFilterSlug] || null;
  const isBudgetCollectionRoute = Boolean(priceFilter);
  const shouldHideInteractiveFilters = false;
  const shouldShowAllMatches = isBudgetCollectionRoute;
  const seoPriceFilterLabel = priceFilter
    ? toSeoTextWithoutCommas(priceFilter.label)
    : "";
  const currentFeatureMeta = useMemo(() => {
    if (!normalizedFeature) return null;

    const selected =
      popularFeatures.find((item) => item?.id === normalizedFeature) ||
      SMARTPHONE_FEATURE_CATALOG.find((item) => item?.id === normalizedFeature);
    const fallbackMeta = getSmartphoneFeatureRouteMeta(normalizedFeature);

    const name = String(
      selected?.name ||
        fallbackMeta?.name ||
        toFeatureSeoLabel(normalizedFeature),
    ).trim();
    if (!name) return null;

    return {
      id: normalizedFeature,
      name,
      description: String(
        selected?.description || fallbackMeta?.description || "",
      ).trim(),
    };
  }, [normalizedFeature, popularFeatures]);

  const sanitizeDescription = (desc = "") => {
    const text = String(desc || "")
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim();
    return text.length > 180 ? `${text.slice(0, 177)}...` : text;
  };

  let seoTitle = `Best Smartphones in India (${currentMonthYear}) | MobilesX`;
  let seoDescription = sanitizeDescription(
    "Explore the latest smartphones with prices in India, full specifications, features, reviews, comparisons, images, and buying guides on MobilesX.",
  );
  const featureHeroText = currentFeatureMeta
    ? `Browse smartphones focused on ${currentFeatureMeta.name.toLowerCase()} and compare how different brands approach this feature across budget, mid-range, and flagship models. This page helps you review battery life, charging behavior, display quality, chipset efficiency, camera tradeoffs, RAM, storage, and software support so you can shortlist phones that suit your needs without opening multiple product pages. Use the feature cards to spot the models that stand out, then open the listings that match your priority.`
    : "";

  if (isSingleSmartphonePath) {
    seoTitle = `Best Smartphones in India (${currentMonthYear}) | MobilesX`;
    seoDescription =
      "Explore the latest smartphones with prices in India, full specifications, features, reviews, comparisons, images, and buying guides on MobilesX.";
  } else if (isNewFilterPath) {
    seoTitle = `Latest Smartphones in India (${currentMonthYear}) | MobilesX`;
    seoDescription =
      "Browse the latest smartphones across camera, battery, display, and performance with updated prices, full specifications, and launch details on MobilesX.";
  } else if (isTrendingFilterPath) {
    seoTitle = `Trending Smartphones in India (${currentMonthYear}) | MobilesX`;
    seoDescription =
      "Browse trending smartphones in India with updated prices, full specifications, and key features across camera, battery, display, performance, RAM, storage, and network support on MobilesX.";
  } else if (isUpcomingFilterPath) {
    seoTitle = `Upcoming Smartphones in India (${currentMonthYear}) | MobilesX`;
    seoDescription =
      "Browse upcoming smartphones in India, track expected launch timelines, compare preview specifications, and watch preorder-ready devices before they arrive on MobilesX.";
  } else if (currentFeatureMeta) {
    const featureContextParts = [
      currentBrandObj?.name ? `${currentBrandObj.name}` : "",
      currentFeatureMeta.name,
      "Smartphones",
      seoPriceFilterLabel,
    ].filter(Boolean);
    const featureContext = featureContextParts.join(" ");
    const featureLabel = currentFeatureMeta.name.toLowerCase();
    const featureTitle = getSmartphoneFeatureTitle(currentFeatureMeta.name);
    const featureDescription = currentFeatureMeta.description
      ? `${currentFeatureMeta.description.toLowerCase()}`
      : featureLabel;

    seoTitle = currentBrandObj
      ? `Best ${currentBrandObj.name} ${featureTitle} in India (${currentMonthYear}) | MobilesX`
      : `Best ${featureTitle} in India (${currentMonthYear}) | MobilesX`;
    seoDescription = sanitizeDescription(
      `Explore ${featureContext.toLowerCase()} in India with updated prices and detailed specifications covering battery camera display and performance comparisons on MobilesX. Discover phones focused on ${featureDescription}.`,
    );
  } else if (priceFilter) {
    const priceLabel = priceFilter.max.toLocaleString("en-IN");
    seoTitle =
      priceFilter.max === MAX_PRICE
        ? `Best Phones Above ₹${priceFilter.min.toLocaleString("en-IN")} in India (${currentMonthYear}) | MobilesX`
        : `Best Phones Under ₹${priceLabel} in India (${currentMonthYear}) | MobilesX`;
    seoDescription = `Explore the best smartphones ${seoPriceFilterLabel.toLowerCase()} with detailed specs, latest prices, reviews, and comparisons to choose the right phone for your budget on MobilesX.`;
  } else if (currentBrandObj) {
    const brandTitle =
      currentBrandObj.name.toLowerCase() === "apple"
        ? "Apple iPhones"
        : `${currentBrandObj.name} Smartphones`;
    seoTitle = `Best ${brandTitle} in India (${currentMonthYear}) | MobilesX`;
    seoDescription = sanitizeDescription(
      currentBrandObj.description ||
        `Discover the latest ${currentBrandObj.name} smartphones with prices, specifications, launches, reviews, comparisons, news, and buying guides on MobilesX.`,
    );
  }
  // Heading label: prefer new launches, then price-filtered collection
  const isNewLaunchHeading =
    (location &&
      String(location.pathname || "")
        .toLowerCase()
        .includes("newlaunch")) ||
    listFilter === "new";
  const headerLabel = isNewLaunchHeading
    ? "LATEST SMARTPHONES"
    : isTrendingFilterPath
      ? "TRENDING SMARTPHONES"
      : isUpcomingFilterPath
        ? "UPCOMING SMARTPHONES"
        : currentFeatureMeta
          ? `${currentFeatureMeta.name.toUpperCase()} SMARTPHONES`
          : priceFilter
            ? `BEST SMARTPHONE ${priceFilter.label.toUpperCase()}`
            : "SMARTPHONE COLLECTION";
  const heroTitleText = isNewFilterPath
    ? "Latest Smartphones"
    : isTrendingFilterPath
      ? "Trending Smartphones"
      : isUpcomingFilterPath
        ? "Upcoming Smartphones"
        : currentFeatureMeta
          ? `${currentFeatureMeta.name} Smartphones`
          : priceFilter
            ? `${priceFilter.label} Smartphones in India`
            : "Popular Mobile Phone";
  const isExpandedHeroDescriptionPath =
    isNewFilterPath ||
    isListFilter ||
    Boolean(currentFeatureMeta) ||
    Boolean(priceFilter) ||
    pathname === "/smartphones" ||
    pathname === "/mobiles";
  const heroSubtitleText = isNewFilterPath
    ? "Browse the latest smartphones in India and keep up with new launches as they arrive, all in one place. This page brings together updated prices, fresh variants, and the key specifications people care about most, including camera quality, low-light results, portrait shots, video stability, battery life, charging speed, display brightness, refresh rate, chipset performance, RAM, storage, software experience, and long-term update support. Use it to scan the newest phones from leading brands, spot which models are getting attention, and quickly narrow your shortlist without opening dozens of tabs. If you are looking for a flagship camera phone, a balanced all-rounder, a battery-first option, or a gaming-ready device, the latest collection helps you focus on the right candidates at a glance. The filters and product cards make it easy to sort by brand, price, and feature, while the latest-launch focus keeps the page current as new phones arrive. You can also check live prices, offers, and variants so you can judge value before you buy."
    : isTrendingFilterPath
      ? "Browse trending smartphones in India with updated prices, specifications, and buying signals from models people are actively comparing. Use the filters to narrow popular phones by brand, budget, RAM, storage, processor, network support, battery features, refresh rate, and camera resolution so the trending list stays useful instead of becoming a mixed feed."
      : isUpcomingFilterPath
        ? "Browse upcoming smartphones in India and keep track of devices that are expected to launch soon, all in one place. This page helps you follow new phone announcements, rumored launch windows, preorder-ready models, and early specification leaks without jumping between multiple news posts. Use it to scan expected camera setups, battery sizes, charging speeds, display details, chipset hints, storage variants, and brand lineups so you can plan your next upgrade with a clearer view of what is coming. Whether you are waiting for a flagship launch, a battery-focused phone, a gaming-ready model, or a balanced everyday device, the upcoming collection gives you an easy way to watch the next wave of releases as they build up. You can also use the filters and product cards to follow the brands and categories that matter most, then return later when launch details and prices are confirmed."
        : currentFeatureMeta
          ? featureHeroText
          : priceFilter || currentBrandObj
            ? seoDescription
            : "Compare live prices, key specifications, variants and seller options across popular smartphones in India.";
  const heroSubtitleStyle =
    isExpandedHeroDescriptionPath && !showHeroDescription
      ? {
          display: "-webkit-box",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: 1,
          overflow: "hidden",
        }
      : undefined;
  const heroContentWidthClass = "max-w-7xl";
  const heroTitleWidthClass = "max-w-7xl";
  const heroSubtitleWidthClass = "max-w-7xl";
  const productColumnWidthClass = "w-full";
  useEffect(() => {
    if (isExpandedHeroDescriptionPath) {
      setShowHeroDescription(false);
    }
  }, [
    isExpandedHeroDescriptionPath,
    normalizedFilterSlug,
    normalizedBrandSlug,
    normalizedFeature,
    pathname,
  ]);
  const currentPriceRangeLabel =
    priceFilter ||
    Number(filters.priceRange.min) !== MIN_PRICE ||
    Number(filters.priceRange.max) !== MAX_PRICE
      ? priceFilter
        ? priceFilter.label
        : `₹ ${filters.priceRange.min?.toLocaleString()} - ₹ ${filters.priceRange.max?.toLocaleString()}`
      : `₹ ${filters.priceRange.min?.toLocaleString()} - ₹ ${filters.priceRange.max?.toLocaleString()}`;

  const hasUrlDrivenFilters = useMemo(() => {
    const qp = new URLSearchParams(search || "");
    return Boolean(
      normalizedFilterSlug ||
      normalizedBrandSlug ||
      normalizedFeature ||
      qp.get("network") ||
      qp.get("ram") ||
      qp.get("processor") ||
      qp.get("refreshRate") ||
      qp.get("priceMin") ||
      qp.get("minPrice") ||
      qp.get("min") ||
      qp.get("min_price") ||
      qp.get("priceMax") ||
      qp.get("maxPrice") ||
      qp.get("max") ||
      qp.get("max_price"),
    );
  }, [search, normalizedFilterSlug, normalizedBrandSlug, normalizedFeature]);

  // Apply query param filters
  useEffect(() => {
    const params = new URLSearchParams(search);
    const brandParam = normalizedBrandSlug || null;
    const qParam =
      params.get("q") || params.get("query") || params.get("search") || null;

    // Parse price and list params (comma-separated lists supported)
    const rawMin =
      params.get("priceMin") ||
      params.get("minPrice") ||
      params.get("min") ||
      params.get("min_price");
    const rawMax =
      params.get("priceMax") ||
      params.get("maxPrice") ||
      params.get("max") ||
      params.get("max_price");
    const priceMin = rawMin ? Number(rawMin) : null;
    const priceMax = rawMax ? Number(rawMax) : null;

    const ramParam = params.get("ram");
    const networkParam = params.get("network");
    const processorParam = params.get("processor");
    const refreshParam = params.get("refreshRate");

    const toArray = (val) =>
      val && val.length
        ? val
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

    const ramArr = toArray(ramParam)
      .map((value) => normalizeMemoryFilterLabel(value, "GB"))
      .filter(Boolean);
    const networkArr = toArray(networkParam);
    const processorArr = toArray(processorParam);
    const refreshArr = toArray(refreshParam);
    const hasExplicitUrlFilters = Boolean(
      brandParam ||
      rawMin ||
      rawMax ||
      ramParam ||
      networkParam ||
      processorParam ||
      refreshParam ||
      priceFilter,
    );

    // Helper to resolve a brand param (slug or name) to the display brand name
    const resolveBrandName = (bp) => {
      if (!bp) return null;
      const paramStr = bp.toString();
      const candidates = deviceContext?.brands || brands || [];
      try {
        // If candidates are objects with `name`/`slug`, try to match
        for (const c of candidates) {
          if (!c) continue;
          const name = c.name || (typeof c === "string" ? c : null);
          const slug = normalizeSmartphoneListingSlug(c.slug || name);
          if (
            slug === normalizeSmartphoneListingSlug(paramStr) ||
            (name || "").toString().toLowerCase() ===
              paramStr.toString().toLowerCase()
          ) {
            return name || paramStr;
          }
        }
      } catch {}

      // Fallback: convert slug-like strings to capitalized words (e.g. "samsung-galaxy" -> "Samsung Galaxy")
      if (paramStr.includes("-")) {
        return toFeatureSeoLabel(paramStr);
      }

      return paramStr;
    };

    // Build next filters state using provided params; fall back to current state
    setFilters((prev) => {
      const normalizedPrev = normalizeFilters(prev);
      const base = hasExplicitUrlFilters
        ? createDefaultFilters()
        : normalizedPrev;

      const resolvedBrand = brandParam ? resolveBrandName(brandParam) : null;
      const next = {
        ...base,
        brand: resolvedBrand ? [resolvedBrand] : base.brand,
        priceRange: {
          min:
            priceFilter?.min ??
            (priceMin !== null && !Number.isNaN(priceMin)
              ? priceMin
              : base.priceRange.min),
          max:
            priceFilter?.max ??
            (priceMax !== null && !Number.isNaN(priceMax)
              ? priceMax
              : base.priceRange.max),
        },
        ram: ramArr.length ? ramArr : base.ram,
        network: networkArr.length ? networkArr : base.network,
        processor: processorArr.length ? processorArr : base.processor,
        refreshRate: refreshArr.length ? refreshArr : base.refreshRate,
      };
      const normalizedNext = normalizeFilters(next);
      return areFilterStatesEqual(normalizedPrev, normalizedNext)
        ? prev
        : normalizedNext;
    });

    if (brandParam) {
      setSortBy("newest");
    }

    if (qParam !== null) {
      setSearchQuery(qParam);
    }
  }, [
    search,
    normalizedBrandSlug,
    normalizedFilterSlug,
    priceFilter,
    deviceContext?.brands,
    brands,
  ]);

  // Sync filters when DeviceContext provides filters
  // Depend only on `contextFilters` so local changes don't trigger an overwrite.
  useEffect(() => {
    if (hasUrlDrivenFilters) return;
    if (!contextFilters) return;
    try {
      const ctx = normalizeFilters(contextFilters);
      setFilters((prev) => {
        const normalizedPrev = normalizeFilters(prev);
        try {
          if (JSON.stringify(normalizedPrev) === JSON.stringify(ctx))
            return prev;
        } catch {
          return ctx;
        }
        return ctx;
      });
    } catch {
      // ignore
    }
  }, [contextFilters, hasUrlDrivenFilters]);

  // Update price range when devices data changes
  useEffect(() => {
    if (devices.length === 0) return;

    // If the global/device-context filters already have a non-default priceRange,
    // do not overwrite them. This prevents navigation from budget cards from
    // being clobbered by this initializer when devices load.
    try {
      if (
        contextFilters &&
        contextFilters.priceRange &&
        (Number(contextFilters.priceRange.min) !== MIN_PRICE ||
          Number(contextFilters.priceRange.max) !== MAX_PRICE)
      ) {
        return;
      }
    } catch {
      // ignore parsing errors and fall through to safe init
    }

    setFilters((prev) => {
      const normalizedPrev = normalizeFilters(prev);
      try {
        const hasCustomRange =
          normalizedPrev.priceRange &&
          (Number(normalizedPrev.priceRange.min) !== MIN_PRICE ||
            Number(normalizedPrev.priceRange.max) !== MAX_PRICE);
        const hasDefaultRange =
          normalizedPrev.priceRange &&
          Number(normalizedPrev.priceRange.min) === MIN_PRICE &&
          Number(normalizedPrev.priceRange.max) === MAX_PRICE;
        if (hasCustomRange) {
          return normalizedPrev;
        }
        if (hasDefaultRange) return normalizedPrev;
      } catch {
        // ignore and initialize
      }
      return normalizeFilters({
        ...normalizedPrev,
        priceRange: { min: MIN_PRICE, max: MAX_PRICE },
      });
    });
  }, [devices.length, contextFilters]);

  const handleView = (device, e, store) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const identifier = device.model || device.id;
    const variantId = device.variant?.variant_id ?? device.variant?.id ?? null;
    const storeId = store?.id ?? null;

    // record a product view for trending metrics (best-effort)
    try {
      const rawPid =
        device.product_id ?? device.productId ?? device.id ?? identifier;
      const pid = Number(rawPid);
      if (Number.isInteger(pid) && pid > 0) {
        fetch(`https://api.apisphere.in/api/public/product/${pid}/view`, {
          method: "POST",
        }).catch(() => {});
      }
    } catch {}

    if (device.model) {
      selectDeviceByModel?.(device.model);
    } else {
      selectDeviceById?.(device.id);
    }

    addToHistory?.({ id: device.id, model: device.model, variantId, storeId });

    // Generate clean SEO URL (avoid variant/store query params in detail URLs)
    const productSlug = generateSlug(device.model || device.name || device.id);
    navigate(`/smartphones/${productSlug}-price-in-india`);
  };

  const getCompareProductId = (device) => {
    if (!device) return null;
    return (
      device.productId ??
      device.product_id ??
      device.baseId ??
      device.model ??
      null
    );
  };

  const getCompareVariantIndex = (device) => {
    if (!device) return 0;

    const direct = Number(device.variantIndex ?? device.selectedVariantIndex);
    if (Number.isInteger(direct) && direct >= 0) return direct;

    const vars = Array.isArray(device.variants) ? device.variants : [];
    const selectedVariant = device.variant ?? null;
    if (!selectedVariant || vars.length === 0) return 0;

    const selectedVariantId =
      selectedVariant.variant_id ??
      selectedVariant.id ??
      selectedVariant.variantId ??
      null;
    if (selectedVariantId == null) return 0;

    const idx = vars.findIndex(
      (v) =>
        String(v?.id ?? v?.variant_id ?? v?.variantId) ===
        String(selectedVariantId),
    );
    return idx >= 0 ? idx : 0;
  };

  const getCompareDeviceKey = (device) => {
    if (!device) return null;
    const variant = device.variant ?? {};
    const variantId =
      variant.variant_id ?? variant.id ?? variant.variantId ?? null;
    if (variantId != null) return `variant:${variantId}`;

    const productId = getCompareProductId(device);
    if (productId != null)
      return `product:${productId}:variant:${getCompareVariantIndex(device)}`;

    const fallback = device.id ?? device.model ?? null;
    return fallback != null ? `fallback:${fallback}` : null;
  };

  const handleCompareToggle = (device, e) => {
    if (e) e.stopPropagation();
    const compareKey = getCompareDeviceKey(device);
    if (compareKey == null) return;

    setCompareItems((prev) => {
      const isAlreadyAdded = prev.some(
        (item) => getCompareDeviceKey(item) === compareKey,
      );

      if (isAlreadyAdded) {
        return prev.filter((item) => getCompareDeviceKey(item) !== compareKey);
      } else {
        const policy = resolveDevicePolicy(device);
        const deviceLimit = Number.isFinite(policy.compareLimit)
          ? policy.compareLimit
          : getCompareLimitForDevices(prev);
        if (deviceLimit === 0) return prev;
        const currentLimit = getCompareLimitForDevices(prev);
        const nextLimit = Math.min(currentLimit, deviceLimit);
        if (prev.length >= nextLimit) return prev;
        return [...prev, device];
      }
    });
  };

  const isCompareSelected = (device) => {
    const compareKey = getCompareDeviceKey(device);
    if (compareKey == null) return false;

    return compareItems.some(
      (item) => getCompareDeviceKey(item) === compareKey,
    );
  };

  const handleCompareNavigate = (e) => {
    if (e) e.stopPropagation();
    if (compareItems.length === 0) return;

    const comparePath = buildCanonicalComparePathFromDevices({
      devices: compareItems,
      type: "smartphone",
      getName: (device) => device?.name || device?.model || "",
      getId: getCompareProductId,
      getVariantIndex: getCompareVariantIndex,
    });

    navigate(comparePath, {
      state: { initialProducts: compareItems },
    });
  };

  const handleFilterChange = (filterType, value) => {
    const currentFilters = normalizeFilters(filters);

    if (filterType === "brand") {
      const current = currentFilters.brand;
      const next = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];

      setFilters((prev) => normalizeFilters({ ...prev, brand: next }));

      try {
        const params = stripSmartphoneSeoQueryParams(search);
        params.delete("sort");
        navigate(
          buildSmartphoneListingPath({
            brand: next[0] || "",
            feature: normalizedFeature,
            query: params,
          }),
          { replace: true },
        );
      } catch {
        // ignore
      }
      // also sync to global device context
      try {
        deviceContext?.setFilters?.({
          ...normalizeFilters(deviceContext.filters || {}),
          brand: next,
        });
      } catch {}
      return;
    }
    const currentArr = Array.isArray(currentFilters[filterType])
      ? currentFilters[filterType]
      : [];
    const memoryUnit =
      filterType === "ram" || filterType === "storage" ? "GB" : null;
    const normalizedValue = memoryUnit
      ? normalizeMemoryFilterLabel(value, memoryUnit)
      : value;
    const isSelected = memoryUnit
      ? currentArr.some(
          (item) =>
            normalizeMemoryFilterLabel(item, memoryUnit) === normalizedValue,
        )
      : currentArr.includes(normalizedValue);
    const nextArr = isSelected
      ? currentArr.filter((item) =>
          memoryUnit
            ? normalizeMemoryFilterLabel(item, memoryUnit) !== normalizedValue
            : item !== normalizedValue,
        )
      : [...currentArr, normalizedValue];
    const next = normalizeFilters({ ...currentFilters, [filterType]: nextArr });
    setFilters(next);
    try {
      deviceContext?.setFilters?.(next);
    } catch {
      // ignore
    }
  };

  const updatePriceRange = (newMin, newMax) => {
    let min = Number(newMin ?? filters.priceRange.min);
    let max = Number(newMax ?? filters.priceRange.max);
    if (min > max) max = min;
    if (max < min) min = max;
    setFilters((prev) =>
      normalizeFilters({ ...prev, priceRange: { min, max } }),
    );
  };

  // Filter logic (operates on variant-level cards) - memoized so it updates
  // when device data, filters, searchQuery or feature change.
  const filteredVariants = React.useMemo(() => {
    // Do not attempt to apply feature filters while data is loading â€”
    // wait for server response to avoid empty results on first render.
    if (loading) return [];

    // When asking for new launches, prefer devices with a parseable
    // launch date that is not in the future and sort them newest-first.
    // If dates are missing, fall back to the original list so the route
    // never renders empty on refresh.
    let baseCards = variantCards;
    if (listFilter === "new") {
      const parseDate = (s) => {
        if (!s) return null;
        const d = new Date(s);
        return Number.isNaN(d.getTime()) ? null : d;
      };

      baseCards = variantCards
        .map((device) => ({
          device,
          date: parseDate(
            device.saleStartDate ||
              device.sale_start_date ||
              device.launchDate ||
              device.launch_date,
          ),
        }))
        .sort((a, b) => {
          if (a.date && b.date && a.date.getTime() !== b.date.getTime()) {
            return b.date - a.date;
          }
          if (a.date) return -1;
          if (b.date) return 1;
          return 0;
        })
        .map((item) => item.device);
    }

    baseCards = baseCards.filter((device) =>
      listFilter === "upcoming"
        ? getRenderType(device) === "upcoming"
        : getRenderType(device) === "available",
    );

    return baseCards.filter((device) => {
      // Search filter
      if (searchQuery) {
        if (!isPublishedProduct(device)) return false;
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          device.name.toLowerCase().includes(query) ||
          device.brand.toLowerCase().includes(query) ||
          (device.model && device.model.toLowerCase().includes(query));
        if (!matchesSearch) return false;
      }

      // Brand filter
      if (filters.brand.length > 0 && !filters.brand.includes(device.brand)) {
        return false;
      }

      // Price range filter
      if (filters.priceRange) {
        const devicePrice = device.numericPrice;
        if (
          devicePrice < filters.priceRange.min ||
          devicePrice > filters.priceRange.max
        )
          return false;
      }

      // RAM filter - check individual values
      if (filters.ram.length > 0) {
        const variantRams = Array.isArray(device.variantOptions)
          ? device.variantOptions.map((option) => option.ram).filter(Boolean)
          : [];
        const deviceRams = variantRams.length
          ? variantRams.flatMap((ram) => extractMemoryFilterLabels(ram, "GB"))
          : device.specs.ram
            ? extractMemoryFilterLabels(device.specs.ram, "GB")
            : [];
        const hasMatchingRam = filters.ram.some((selectedRam) =>
          deviceRams.includes(normalizeMemoryFilterLabel(selectedRam, "GB")),
        );
        if (!hasMatchingRam) return false;
      }

      // Storage filter - check individual values
      if (filters.storage.length > 0) {
        const variantStorages = Array.isArray(device.variantOptions)
          ? device.variantOptions
              .map((option) => option.storage)
              .filter(Boolean)
          : [];
        const deviceStorages = variantStorages.length
          ? variantStorages.flatMap((storage) =>
              extractMemoryFilterLabels(storage, "GB"),
            )
          : device.specs.storage
            ? extractMemoryFilterLabels(device.specs.storage, "GB")
            : [];
        const hasMatchingStorage = filters.storage.some((selectedStorage) =>
          deviceStorages.includes(
            normalizeMemoryFilterLabel(selectedStorage, "GB"),
          ),
        );
        if (!hasMatchingStorage) return false;
      }

      // Battery feature filters
      if (filters.battery && filters.battery.length > 0) {
        const matchesBattery = filters.battery.some((featureId) => {
          const feature = BATTERY_FEATURES.find(
            (item) => item.id === featureId,
          );
          return matchesBatteryFeature(device, feature);
        });
        if (!matchesBattery) return false;
      }

      // Processor filter (brand match)
      if (filters.processor && filters.processor.length > 0) {
        const brand = getProcessorBrand(device.specs.processor || "");
        const hasMatch =
          filters.processor.includes(brand) ||
          filters.processor.some((p) =>
            (device.specs.processor || "")
              .toLowerCase()
              .includes(p.toLowerCase()),
          );
        if (!hasMatch) return false;
      }

      // Network support filter (5G/4G)
      if (filters.network && filters.network.length > 0) {
        const net = String(
          device.specs.network || device.specs.network || "",
        ).toLowerCase();
        const hasNet = filters.network.some((n) =>
          net.includes(n.toLowerCase()),
        );
        if (!hasNet) return false;
      }

      // Display panel/type filter
      if (filters.display && filters.display.length > 0) {
        const raw = device?.display || device?.specs?.display || {};
        const displayText =
          raw && typeof raw === "object"
            ? [raw.panel, raw.type, raw.display_type, raw.technology]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
            : String(raw || "").toLowerCase();
        const hasDisplay = filters.display.some((value) =>
          displayText.includes(String(value).toLowerCase()),
        );
        if (!hasDisplay) return false;
      }

      // Additional feature filters use the existing feature catalog matchers.
      if (filters.additionalFeatures && filters.additionalFeatures.length > 0) {
        const hasAllFeatures = filters.additionalFeatures.every((featureId) => {
          const feature = SMARTPHONE_FEATURE_CATALOG.find(
            (item) => item.id === featureId,
          );
          if (!feature || typeof feature.match !== "function") return false;
          try {
            return Boolean(feature.match(device));
          } catch {
            return false;
          }
        });
        if (!hasAllFeatures) return false;
      }

      // Feature filter from query param (e.g., ?feature=amoled)
      if (normalizedFeature) {
        const f = String(normalizedFeature).toLowerCase();

        const parseFirstInt = (val) => {
          if (val === null || val === undefined) return null;
          const m = String(val).match(/(\d{1,6})/);
          return m ? parseInt(m[1], 10) : null;
        };

        const parseBatteryMah = () => {
          const b = device?.battery;
          if (!b) return null;
          if (typeof b === "number") return Number.isFinite(b) ? b : null;
          if (typeof b === "string") return parseFirstInt(b);
          return (
            parseFirstInt(b.battery_capacity_mah) ??
            parseFirstInt(b.capacity_mAh) ??
            parseFirstInt(b.capacity_mah) ??
            parseFirstInt(b.battery_capacity) ??
            parseFirstInt(b.battery) ??
            parseFirstInt(b.capacity) ??
            null
          );
        };

        const parseFastChargeWatt = () => {
          const b = device?.battery;
          if (!b) return null;
          if (typeof b === "object") {
            const raw =
              b.fast_charging ??
              b.fastCharging ??
              b.fast_charge ??
              b.fastCharge ??
              null;
            return raw ? parseFirstInt(raw) : null;
          }
          const s = String(b);
          if (!/w/i.test(s)) return null;
          return parseFirstInt(s);
        };

        const hasFastCharge = () => {
          const w = parseFastChargeWatt();
          if (w !== null) return w >= 65;

          // If a fast-charging field exists but we can't parse a wattage, still treat as supported
          if (
            device.battery &&
            (device.battery.fast_charging ||
              device.battery.fastCharging ||
              device.battery.fast_charge ||
              device.battery.fastCharge)
          )
            return true;

          const s = String(device.specs?.battery || device.battery || "");
          if (/\bw\b/i.test(s)) {
            const sw = parseFirstInt(s);
            if (sw !== null) return sw >= 65;
          }
          return /\b(fast|flash|supervooc|ultra\s*charge)\b/i.test(s);
        };

        const isAmoled = () => {
          const disp = device.display || device.specs?.display || "";
          const t =
            (disp && typeof disp === "object" && (disp.panel || disp.type)) ||
            disp;
          return String(t).toLowerCase().includes("amoled");
        };

        const isGaming = () => {
          const proc = String(
            device.specs?.processor ||
              device.processor ||
              device.performance?.processor ||
              "",
          ).toLowerCase();
          const cat = String(device.category || "").toLowerCase();
          return (
            /snapdragon\s*8|dimensity|exynos|apple\s*a|mediatek/i.test(proc) ||
            cat.includes("flagship") ||
            cat.includes("gaming")
          );
        };

        const hasHighRam = () => {
          // check variants first (API shape uses `variants[]`)
          if (Array.isArray(device.variants) && device.variants.length) {
            const has = device.variants.some(
              (v) => (parseFirstInt(v?.ram) || 0) >= 12,
            );
            if (has) return true;
          }
          // check single selected variant (fallback)
          const vram = device.variant?.ram || device.variant?.RAM || null;
          const val =
            parseFirstInt(vram) || parseFirstInt(device.specs?.ram) || 0;
          if (val >= 12) return true;
          // check performance ram_options array
          const rOpts =
            device.performance?.ram_options || device.performance?.ram || null;
          if (Array.isArray(rOpts))
            return rOpts.some(
              (r) => (parseInt(String(r).replace(/[^0-9]/g, "")) || 0) >= 12,
            );
          return false;
        };

        const hasLongBattery = () => {
          const nb =
            Number(device.numericBattery) ||
            parseBatteryMah() ||
            parseFirstInt(device.specs?.battery) ||
            0;
          return Number(nb || 0) >= 6000;
        };

        const hasHighMpCamera = () => {
          const cam = device.camera || {};
          const candidates = [];
          const add = (val) => {
            const n = parseFirstInt(val);
            if (n && Number.isFinite(n)) candidates.push(n);
          };

          add(device.specs?.rearCameraResolution);
          add(cam.main_camera_megapixels);
          add(cam.telephoto_camera_megapixels);
          add(cam.ultrawide_camera_megapixels);

          const addFromLens = (lens) => {
            if (!lens) return;
            if (typeof lens === "number" || typeof lens === "string") {
              const s = String(lens);
              if (/mp/i.test(s)) add(s);
              return;
            }
            if (typeof lens !== "object") return;
            add(lens.resolution);
            add(lens.resolution_mp);
            add(lens.megapixels);
            add(lens.mp);
            add(lens.res);

            for (const v of Object.values(lens)) {
              if (v && typeof v === "object" && !Array.isArray(v)) {
                add(v.resolution);
                add(v.resolution_mp);
                add(v.megapixels);
                add(v.mp);
                add(v.res);
              }
            }
          };

          const rear = cam.rear_camera;
          if (rear && typeof rear === "object") {
            for (const lens of Object.values(rear)) addFromLens(lens);
          }

          addFromLens(cam.main);
          addFromLens(cam.wide);
          addFromLens(cam.telephoto);
          addFromLens(cam.ultra_wide);
          addFromLens(cam.periscope_telephoto);

          const max = candidates.length ? Math.max(...candidates) : 0;
          return max >= 50;
        };

        const hasInDisplayFp = () => {
          const s =
            device.sensors || device.specs?.sensors || device.sensor || "";
          if (Array.isArray(s))
            return s.some((x) => /fingerprint/i.test(String(x)));
          return /fingerprint/i.test(String(s));
        };

        const has5g = () => {
          const n =
            device.network ||
            device.connectivity ||
            device.specs?.network ||
            device.networks ||
            {};
          if (!n) return false;
          if (Array.isArray(n["5g_bands"] || n.five_g_bands || n.fiveGBands))
            return (n["5g_bands"] || n.five_g_bands || n.fiveGBands).length > 0;
          if (Array.isArray(n.five_g || n.fiveG || n["5g"]))
            return (n.five_g || n.fiveG || n["5g"]).length > 0;
          if (Array.isArray(device.five_g || device.fiveG || device["5g"]))
            return (device.five_g || device.fiveG || device["5g"]).length > 0;
          return (
            /5g/i.test(String(n)) || Boolean(n.five_g || n.fiveG || n["5g"])
          );
        };

        const hasHighRefreshRate = () => {
          const disp = device.display || device.display_json || {};
          const raw =
            (disp && typeof disp === "object" && disp.refresh_rate) ||
            device.specs?.refreshRate ||
            device.specs?.refresh_rate ||
            device.refresh_rate ||
            "";
          const rr = parseFirstInt(raw) || 0;
          return rr >= 120;
        };

        const hasWifi7 = () => {
          const w = device?.connectivity?.wifi;
          if (Array.isArray(w))
            return w.some((x) => /wi-?fi\s*7|802\.11be/i.test(String(x)));
          return /wi-?fi\s*7|802\.11be/i.test(String(w || ""));
        };

        const hasWirelessCharging = () => {
          const raw =
            device?.battery?.wireless_charging ??
            device?.battery?.wirelessCharging;
          return raw != null && String(raw).trim() !== "";
        };

        const hasIpRating = () => {
          const bd = device?.build_design || device?.design || {};
          const raw =
            (bd && typeof bd === "object" && bd.water_dust_resistance) ||
            device?.water_dust_resistance ||
            "";
          return /\bip\d{2}\b/i.test(String(raw));
        };

        const hasAiFeatures = () => {
          const buckets = [
            device?.ai_features,
            device?.features,
            device?.performance?.ai_features,
            device?.camera?.ai_features,
            device?.connectivity?.ai_features,
            device?.multimedia?.ai_features,
          ];
          for (const b of buckets) {
            if (!b) continue;
            if (Array.isArray(b) && b.length) return true;
            if (typeof b === "string" && /\bai\b/i.test(b)) return true;
          }
          return false;
        };

        const hasEsim = () => {
          const raw =
            device?.connectivity?.esim ??
            device?.connectivity?.eSIM ??
            device?.network?.sim ??
            device?.network?.sim_type ??
            device?.network?.simType ??
            null;
          if (raw === null || raw === undefined) return false;
          if (typeof raw === "boolean") return raw;
          if (Array.isArray(raw))
            return raw.some((x) => /esim/i.test(String(x)));
          return /esim/i.test(String(raw));
        };

        const hasNfc = () => {
          const raw = device?.connectivity?.nfc ?? device?.nfc ?? null;
          if (raw === null || raw === undefined) return false;
          if (typeof raw === "boolean") return raw;
          const s = String(raw).toLowerCase();
          if (!s) return false;
          if (s.includes("not supported") || s.includes("unsupported"))
            return false;
          return (
            s.includes("supported") || s.includes("yes") || s.includes("true")
          );
        };

        const hasOis = () => {
          const cam = device?.camera || {};
          const rear = cam?.rear_camera;
          const lenses = [];
          if (rear && typeof rear === "object")
            lenses.push(...Object.values(rear));
          lenses.push(
            cam.main,
            cam.wide,
            cam.telephoto,
            cam.ultra_wide,
            cam.periscope_telephoto,
          );
          for (const lens of lenses) {
            if (!lens) continue;
            const raw = lens?.ois ?? lens?.OIS ?? null;
            if (raw == null) continue;
            if (typeof raw === "boolean") return raw;
            const s = String(raw).toLowerCase();
            if (!s) continue;
            if (s.includes("not")) continue;
            if (
              s.includes("supported") ||
              s.includes("yes") ||
              s.includes("true")
            )
              return true;
          }
          return false;
        };

        const hasPeriscope = () => {
          return Boolean(
            device?.camera?.rear_camera?.periscope_telephoto ||
            device?.camera?.periscope_telephoto,
          );
        };

        const hasUfs4 = () => {
          const raw =
            device?.performance?.storage_type ??
            device?.performance?.storageType ??
            "";
          return /ufs\s*4/i.test(String(raw));
        };

        const hasLpddr5x = () => {
          const raw =
            device?.performance?.ram_type ?? device?.performance?.ramType ?? "";
          return /lpddr\s*5x/i.test(String(raw));
        };

        const featureMatch = (() => {
          switch (f) {
            case "fast-charging":
            case "fast_charge":
            case "fastcharge":
              return hasFastCharge();
            case "amoled":
              return isAmoled();
            case "high-refresh-rate":
            case "120hz":
            case "120-hz":
            case "144hz":
            case "144-hz":
              return hasHighRefreshRate();
            case "wifi-7":
            case "wifi7":
              return hasWifi7();
            case "wireless-charging":
            case "wirelesscharging":
              return hasWirelessCharging();
            case "ip-rating":
            case "ip":
            case "ip68":
            case "ip69":
              return hasIpRating();
            case "ai-features":
            case "ai":
              return hasAiFeatures();
            case "esim":
            case "e-sim":
            case "e_sim":
              return hasEsim();
            case "nfc":
              return hasNfc();
            case "ois":
              return hasOis();
            case "periscope":
              return hasPeriscope();
            case "ufs-4":
            case "ufs4":
              return hasUfs4();
            case "lpddr5x":
            case "lpddr-5x":
              return hasLpddr5x();
            case "gaming":
              return isGaming();
            case "high-ram":
            case "highram":
              return hasHighRam();
            case "long-battery":
            case "longbattery":
              return hasLongBattery();
            case "high-camera":
            case "high-mp-camera":
            case "highmpcamera":
              return hasHighMpCamera();
            case "fingerprint":
            case "in-display-fp":
            case "in-display":
            case "in-display-fingerprint":
              return hasInDisplayFp();
            case "5g":
            case "5g-ready":
            case "5gready":
              return has5g();
            default:
              return true;
          }
        })();

        if (!featureMatch) return false;
      }

      // Refresh rate filter
      if (filters.refreshRate && filters.refreshRate.length > 0) {
        const rr = String(device.specs.refreshRate || "").toLowerCase();
        const hasRR = filters.refreshRate.some((r) =>
          rr.includes(r.toLowerCase()),
        );
        if (!hasRR) return false;
      }

      // Rear camera filter (by main/highest MP capability)
      if (filters.rearCamera && filters.rearCamera.length > 0) {
        const rearMp = resolveRearCameraMpForFilter(device) || 0;
        const hasRearCameraMatch = filters.rearCamera.some((selected) => {
          const threshold = parseCameraMpForFilter(selected) || 0;
          return threshold > 0 && rearMp >= threshold;
        });
        if (!hasRearCameraMatch) return false;
      }

      // Front/selfie camera filter (by MP capability)
      if (filters.frontCamera && filters.frontCamera.length > 0) {
        const frontMp = resolveFrontCameraMpForFilter(device) || 0;
        const hasFrontCameraMatch = filters.frontCamera.some((selected) => {
          const threshold = parseCameraMpForFilter(selected) || 0;
          return threshold > 0 && frontMp >= threshold;
        });
        if (!hasFrontCameraMatch) return false;
      }

      return true;
    });
  }, [variantCards, filters, searchQuery, normalizedFeature]);

  const parseFirstInt = (val) => {
    if (val === null || val === undefined) return null;
    const m = String(val).match(/(\d{1,6})/);
    return m ? parseInt(m[1], 10) : null;
  };

  const getBatteryMah = (card) => {
    const b = card?.battery;
    if (!b) return null;
    if (typeof b === "number") return Number.isFinite(b) ? b : null;
    if (typeof b === "string") return parseFirstInt(b);
    return (
      parseFirstInt(b.battery_capacity_mah) ??
      parseFirstInt(b.capacity_mAh) ??
      parseFirstInt(b.capacity_mah) ??
      parseFirstInt(b.battery_capacity) ??
      parseFirstInt(b.battery) ??
      parseFirstInt(b.capacity) ??
      null
    );
  };

  const getFastChargeWatt = (card) => {
    const b = card?.battery;
    if (!b) return null;
    if (typeof b === "object") {
      const raw =
        b.fast_charging ??
        b.fastCharging ??
        b.fast_charge ??
        b.fastCharge ??
        "";
      return parseFirstInt(raw);
    }
    const s = String(b);
    if (!/w/i.test(s)) return null;
    return parseFirstInt(s);
  };

  const getWirelessChargeWatt = (card) => {
    const raw =
      card?.battery?.wireless_charging ??
      card?.battery?.wirelessCharging ??
      null;
    return raw ? parseFirstInt(raw) : null;
  };

  const getRearCameraMp = (card) => {
    const candidates = [];

    const add = (val) => {
      const n = parseFirstInt(val);
      if (n && Number.isFinite(n)) candidates.push(n);
    };

    // Keep backward-compatible value (often rear main MP)
    add(card?.specs?.rearCameraResolution);

    const cam = card?.camera;
    if (!cam) return candidates.length ? Math.max(...candidates) : null;

    // Common flattened fields
    add(cam.main_camera_megapixels);
    add(cam.telephoto_camera_megapixels);
    add(cam.ultrawide_camera_megapixels);

    const addFromLens = (lens) => {
      if (!lens) return;
      if (typeof lens === "number" || typeof lens === "string") {
        // Only parse raw values that explicitly mention MP to avoid picking up zoom values (e.g. "2X")
        const s = String(lens);
        if (/mp/i.test(s)) add(s);
        return;
      }
      if (typeof lens !== "object") return;
      add(lens.resolution);
      add(lens.resolution_mp);
      add(lens.megapixels);
      add(lens.mp);
      add(lens.res);

      // Some datasets nest lens info (e.g., { main: {...} })
      for (const v of Object.values(lens)) {
        if (v && typeof v === "object" && !Array.isArray(v)) {
          add(v.resolution);
          add(v.resolution_mp);
          add(v.megapixels);
          add(v.mp);
          add(v.res);
        }
      }
    };

    // Structured rear camera object (pick the MAX MP across all lenses)
    const rear = cam.rear_camera;
    if (rear && typeof rear === "object") {
      for (const lens of Object.values(rear)) addFromLens(lens);
    }

    // Fallback to top-level camera object
    addFromLens(cam.main);
    addFromLens(cam.wide);
    addFromLens(cam.telephoto);
    addFromLens(cam.ultra_wide);
    addFromLens(cam.periscope_telephoto);

    return candidates.length ? Math.max(...candidates) : null;
  };

  const getMaxRamGb = (card) => {
    // for variant cards, prefer the specific variant RAM
    const vram = parseFirstInt(card?.variant?.ram ?? card?.ram ?? null);
    if (vram) return vram;
    const arr = Array.isArray(card?.variants) ? card.variants : [];
    const maxFromVariants = arr.reduce((acc, v) => {
      const n = parseFirstInt(v?.ram) || 0;
      return Math.max(acc, n);
    }, 0);
    return maxFromVariants || parseFirstInt(card?.specs?.ram) || null;
  };

  const getRefreshRateHz = (card) => {
    const disp =
      card?.display || card?.display_json || card?.specs?.display || {};
    const raw =
      (disp && typeof disp === "object" && disp.refresh_rate) ||
      card?.specs?.refreshRate ||
      card?.refresh_rate ||
      "";
    return parseFirstInt(raw);
  };

  const getIpRatingScore = (card) => {
    const bd = card?.build_design || card?.design || {};
    const raw =
      (bd && typeof bd === "object" && bd.water_dust_resistance) ||
      card?.water_dust_resistance ||
      "";
    const m = String(raw).match(/\bip(\d{2})\b/i);
    return m ? parseInt(m[1], 10) : null;
  };

  const hasAiPhoneSignal = (card) => {
    const aiKeyPattern =
      /(?:^|[_-])ai(?:$|[_-])|ai(?:features?|phone)|isai|artificial/i;
    const aiTextPattern =
      /\bai\b|artificial intelligence|ai[-\s]?powered|ai[-\s]?phone/i;
    const visit = (value, key = "") => {
      if (value == null) return false;
      if (aiKeyPattern.test(String(key))) {
        if (typeof value === "boolean") return value;
        const normalized = String(value).trim().toLowerCase();
        if (["", "0", "false", "no", "none", "null"].includes(normalized)) {
          return false;
        }
        return Array.isArray(value) ? value.length > 0 : Boolean(value);
      }
      if (typeof value === "string") return aiTextPattern.test(value);
      if (Array.isArray(value)) return value.some((item) => visit(item));
      if (typeof value === "object") {
        return Object.entries(value).some(([entryKey, entryValue]) =>
          visit(entryValue, entryKey),
        );
      }
      return false;
    };
    const explicitSignals = [
      card?.isAiPhone,
      card?.is_ai,
      card?.ai_phone,
      card?.aiPhone,
      card?.isAi,
      card?.ai,
      card?.ai_features,
      card?.aiFeatures,
      card?.specs?.isAiPhone,
      card?.specs?.ai_features,
      card?.specs?.ai,
      card?.specs?.aiFeatures,
      card?.specifications?.ai_features,
      card?.key_specs_json?.ai_features,
      card?.software?.ai_features,
      card?.performance?.ai_features,
      card?.camera?.ai,
      card?.camera?.ai_features,
      card?.multimedia?.ai_features,
    ];
    if (explicitSignals.some((value) => visit(value, "ai"))) return true;
    return [
      card?.features,
      card?.tags,
      card?.keywords,
      card?.description,
      card?.summary,
      card?.name,
      card?.model,
    ].some((value) => visit(value));
  };
  const getAiFeatureCount = (card) => {
    const buckets = [
      card?.ai_features,
      card?.features,
      card?.performance?.ai_features,
      card?.camera?.ai_features,
      card?.connectivity?.ai_features,
      card?.multimedia?.ai_features,
    ];
    let count = 0;
    for (const b of buckets) {
      if (!b) continue;
      if (Array.isArray(b)) count += b.length;
      else if (typeof b === "string" && b.trim()) count += 1;
    }
    return count || null;
  };

  const getFeatureSortValue = (card, featureId) => {
    switch (featureId) {
      case "long-battery":
        return getBatteryMah(card);
      case "fast-charging":
        return getFastChargeWatt(card);
      case "wireless-charging":
        return getWirelessChargeWatt(card);
      case "high-camera":
      case "high-mp-camera":
        return getRearCameraMp(card);
      case "high-ram":
        return getMaxRamGb(card);
      case "high-refresh-rate":
        return getRefreshRateHz(card);
      case "ip-rating":
        return getIpRatingScore(card);
      case "ai-features":
        return getAiFeatureCount(card);
      default:
        return null;
    }
  };

  const sortedVariants = [...filteredVariants].sort((a, b) => {
    // If user is browsing by a popular feature and hasn't chosen an explicit sort,
    // auto-rank by the feature value (high -> low) so higher-capability devices come first.
    if (sortBy === "featured" && normalizedFeature) {
      const av = getFeatureSortValue(a, normalizedFeature);
      const bv = getFeatureSortValue(b, normalizedFeature);
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (bv !== av) return bv - av;
      // Tie-breaker: cheaper first, then name
      if (a.numericPrice !== b.numericPrice)
        return a.numericPrice - b.numericPrice;
      return String(a.name || "").localeCompare(String(b.name || ""));
    }
    switch (sortBy) {
      case "price-low":
        return a.numericPrice - b.numericPrice;
      case "price-high":
        return b.numericPrice - a.numericPrice;
      case "rating":
        return b.rating - a.rating;
      case "newest":
        return new Date(b.launchDate) - new Date(a.launchDate);
      default:
        return 0;
    }
  });
  const totalPages = shouldUseServerPagination
    ? Math.max(
        1,
        Math.ceil(
          Number(smartphonePagination?.total || sortedVariants.length) /
            SMARTPHONES_PER_PAGE,
        ),
      )
    : Math.max(1, Math.ceil(sortedVariants.length / SMARTPHONES_PER_PAGE));
  const currentPageSafe = Math.min(currentPage, totalPages);
  const paginatedVariants = useMemo(() => {
    const startIndex = (currentPageSafe - 1) * SMARTPHONES_PER_PAGE;
    return sortedVariants.slice(startIndex, startIndex + SMARTPHONES_PER_PAGE);
  }, [currentPageSafe, sortedVariants]);
  const visibleVariants =
    shouldShowAllMatches || shouldUseServerPagination
      ? sortedVariants
      : paginatedVariants;
  const visibleResultsStart = sortedVariants.length
    ? shouldShowAllMatches
      ? 1
      : (currentPageSafe - 1) * SMARTPHONES_PER_PAGE + 1
    : 0;
  const visibleResultsEnd = sortedVariants.length
    ? shouldShowAllMatches
      ? shouldUseServerPagination
        ? Math.min(
            currentPageSafe * SMARTPHONES_PER_PAGE,
            Number(smartphonePagination?.total || sortedVariants.length),
          )
        : sortedVariants.length
      : visibleResultsStart + paginatedVariants.length - 1
    : 0;
  const featuredDiscoveryProduct = useMemo(
    () =>
      visibleVariants.find((device) => {
        const productId = Number(
          device?.productId ?? device?.product_id ?? device?.baseId ?? NaN,
        );
        return Number.isInteger(productId) && productId > 0;
      }) || null,
    [visibleVariants],
  );
  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    filters,
    searchQuery,
    sortBy,
    normalizedFilterSlug,
    normalizedBrandSlug,
    normalizedFeature,
    pathname,
  ]);

  const handlePageChange = (nextPage) => {
    const targetPage = Math.max(1, Math.min(totalPages, nextPage));
    if (targetPage === currentPageSafe) return;
    if (shouldUseServerPagination) {
      dispatch(
        fetchSmartphones({
          page: targetPage,
          limit: SMARTPHONES_PER_PAGE,
          force: true,
        }),
      );
    }
    setCurrentPage(targetPage);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };
  const seoKeywords = useMemo(
    () =>
      buildListSeoKeywords({
        devices: sortedVariants,
        category: "smartphones",
        currentYear,
        baseTerms: [
          "smartphones",
          "mobile price comparison india",
          "compare smartphone specs",
        ],
        contextTerms: [
          isNewFilterPath ? "latest smartphones" : "",
          priceFilter ? `best smartphones ${priceFilter.label}` : "",
          currentBrandObj?.name ? `${currentBrandObj.name} smartphones` : "",
          currentFeatureMeta?.name
            ? `${currentFeatureMeta.name} smartphones`
            : "",
          currentFeatureMeta?.name
            ? `smartphones with ${currentFeatureMeta.name}`
            : "",
        ],
      }),
    [
      currentYear,
      isNewFilterPath,
      priceFilter,
      currentBrandObj,
      currentFeatureMeta,
      sortedVariants,
    ],
  );

  const clearFilters = () => {
    const empty = {
      brand: [],
      priceRange: { min: MIN_PRICE, max: MAX_PRICE },
      ram: [],
      storage: [],
      color: [],
      battery: [],
      processor: [],
      network: [],
      refreshRate: [],
      display: [],
      rearCamera: [],
      frontCamera: [],
      additionalFeatures: [],
    };
    setFilters(empty);
    try {
      deviceContext?.setFilters?.(empty);
    } catch {
      // ignore
    }
    setSearchQuery("");
    setBrandFilterQuery("");
    setRamFilterQuery("");
    setStorageFilterQuery("");
    setBatteryFilterQuery("");
    setProcessorFilterQuery("");
    setNetworkFilterQuery("");
    setRefreshRateFilterQuery("");
    setDisplayFilterQuery("");
    setAdditionalFeatureQuery("");
    setRearCameraFilterQuery("");
    setFrontCameraFilterQuery("");
    try {
      const params = stripSmartphoneSeoQueryParams(search);
      [
        "q",
        "query",
        "search",
        "network",
        "ram",
        "processor",
        "refreshRate",
        "priceMin",
        "minPrice",
        "min",
        "min_price",
        "priceMax",
        "maxPrice",
        "max",
        "max_price",
      ].forEach((key) => params.delete(key));
      params.delete("sort");
      navigate(buildSmartphoneListingPath({ query: params }), {
        replace: true,
      });
    } catch {
      // ignore URL update errors
    }
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.brand && filters.brand.length) count += filters.brand.length;
    if (filters.ram && filters.ram.length) count += filters.ram.length;
    if (filters.storage && filters.storage.length)
      count += filters.storage.length;
    if (filters.battery && filters.battery.length)
      count += filters.battery.length;
    if (filters.processor && filters.processor.length)
      count += filters.processor.length;
    if (filters.network && filters.network.length)
      count += filters.network.length;
    if (filters.refreshRate && filters.refreshRate.length)
      count += filters.refreshRate.length;
    if (filters.display && filters.display.length)
      count += filters.display.length;
    if (filters.additionalFeatures && filters.additionalFeatures.length)
      count += filters.additionalFeatures.length;
    if (filters.rearCamera && filters.rearCamera.length)
      count += filters.rearCamera.length;
    if (filters.frontCamera && filters.frontCamera.length)
      count += filters.frontCamera.length;
    if (
      filters.priceRange &&
      (filters.priceRange.min > 0 || filters.priceRange.max < MAX_PRICE)
    )
      count += 1;
    return count;
  };

  const renderFilterBadge = (value) => (
    <span className="inline-flex min-w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 px-2 py-1 text-[11px] font-bold text-blue-600">
      {value}
    </span>
  );

  const renderFilterSearchInput = ({
    value,
    onChange,
    placeholder,
    clearLabel,
    className = "",
  }) => (
    <div className={`relative ${className}`}>
      <FaSearch className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-blue-200 bg-transparent pl-10 pr-10 text-sm font-medium text-slate-900 outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-2.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label={clearLabel}
        >
          <FaTimes className="text-[11px]" />
        </button>
      ) : null}
    </div>
  );

  const renderFilterOptionList = ({
    items,
    emptyText,
    isSelected,
    onChange,
    getLabel = (item) => item,
    getKey = (item) => getLabel(item),
    getMeta = null,
    maxHeightClass = "max-h-52",
  }) => (
    <div
      className={`[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${maxHeightClass} mt-3 grid grid-cols-1 gap-2 overflow-y-auto md:grid-cols-2 xl:grid-cols-3`}
    >
      {items.map((item) => {
        const selected = isSelected(item);
        const label = getLabel(item);
        const meta = typeof getMeta === "function" ? getMeta(item) : null;
        return (
          <label
            key={getKey(item)}
            className={`group flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-sm transition ${
              selected
                ? "border-blue-300 bg-blue-50 text-blue-700"
                : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-slate-50"
            }`}
          >
            <span className="flex min-w-0 items-center gap-3">
              <span
                className={`grid h-4.5 w-4.5 shrink-0 place-items-center rounded-md border text-[9px] transition ${
                  selected
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-slate-300 bg-white text-transparent group-hover:border-blue-300"
                }`}
              >
                ✓
              </span>
              <input
                type="checkbox"
                checked={selected}
                onChange={() => onChange(item)}
                className="sr-only"
              />
              <span className="min-w-0 truncate text-[13px] font-bold">
                {label}
              </span>
            </span>
            {meta !== null && meta !== undefined ? (
              <span
                className={`shrink-0 text-[10px] font-bold ${
                  selected ? "text-blue-500" : "text-slate-400"
                }`}
              >
                {meta}
              </span>
            ) : null}
          </label>
        );
      })}
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-400 md:col-span-2 xl:col-span-3">
          {emptyText}
        </div>
      ) : null}
    </div>
  );

  const renderDesktopFilterNavItem = ({
    title,
    badge = 0,
    icon: Icon = FaFilter,
  }) => {
    const isActive = openDesktopFilterSection === title;
    return (
      <button
        key={`desktop-filter-nav-${title}`}
        type="button"
        onClick={() => setOpenDesktopFilterSection(title)}
        className={`flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3.5 text-left transition ${
          isActive
            ? "bg-blue-50 text-blue-700 ring-1 ring-blue-100"
            : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
        }`}
        aria-pressed={isActive}
      >
        <span className="flex min-w-0 items-center gap-3">
          <span
            className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
              isActive
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            <Icon className="text-sm" />
          </span>
          <strong className="truncate text-sm font-bold">{title}</strong>
        </span>
        {renderFilterBadge(badge)}
      </button>
    );
  };

  const renderDesktopFilterPanel = ({ title, subtitle, children }) => {
    if (openDesktopFilterSection !== title) return null;

    const content =
      title === "Search & Brands" ? (
        <div className="space-y-7">
          <div>
            <label className="mb-3 block text-sm font-bold text-slate-900">
              Search Phones
            </label>
            {renderFilterSearchInput({
              value: searchQuery,
              onChange: setSearchQuery,
              placeholder: "Search smartphone model, name or brand",
              clearLabel: "Clear smartphone search",
            })}
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between gap-4">
              <h5 className="text-sm font-bold text-slate-900">
                Popular Brands
              </h5>
              {filters.brand.length > 0 ? (
                <span className="text-xs font-bold text-blue-600">
                  {filters.brand.length} selected
                </span>
              ) : null}
            </div>
            <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-5">
              {brands
                .slice(0, showAllDesktopBrands ? brands.length : 7)
                .map((brand) => {
                  const selected = filters.brand.includes(brand);
                  const count = devices.filter(
                    (device) => device.brand === brand,
                  ).length;
                  return (
                    <button
                      key={`desktop-brand-tile-${brand}`}
                      type="button"
                      onClick={() => handleFilterChange("brand", brand)}
                      className={`flex min-h-[64px] items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition ${
                        selected
                          ? "border-blue-300 bg-blue-50 text-blue-700"
                          : "border-slate-200 bg-white text-slate-900 hover:border-blue-200 hover:bg-slate-50"
                      }`}
                    >
                      <span
                        className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[10px] font-black uppercase ${
                          selected
                            ? "bg-blue-600 text-white"
                            : "bg-blue-50 text-blue-600"
                        }`}
                      >
                        {String(brand).slice(0, 2)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <strong className="block truncate text-sm">
                          {brand}
                        </strong>
                        <small
                          className={`mt-1 block text-[10px] font-medium ${
                            selected ? "text-blue-600" : "text-slate-400"
                          }`}
                        >
                          {count} phones
                        </small>
                      </span>
                    </button>
                  );
                })}
              {brands.length > 7 ? (
                <button
                  type="button"
                  onClick={() => setShowAllDesktopBrands((current) => !current)}
                  className="flex min-h-20 items-center justify-center gap-2 rounded-2xl bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
                >
                  <FaPlus className={showAllDesktopBrands ? "rotate-45" : ""} />
                  {showAllDesktopBrands ? "Show less" : "View all"}
                </button>
              ) : null}
            </div>
          </div>

          {showAllDesktopBrands ? (
            <div className="rounded-xl bg-slate-50 p-4">
              {renderFilterSearchInput({
                value: brandFilterQuery,
                onChange: setBrandFilterQuery,
                placeholder: "Search all brands",
                clearLabel: "Clear brand search",
              })}
              {renderFilterOptionList({
                items: filteredBrandOptions,
                emptyText: "No brands found",
                isSelected: (brand) => filters.brand.includes(brand),
                onChange: (brand) => handleFilterChange("brand", brand),
                getMeta: (brand) =>
                  devices.filter((device) => device.brand === brand).length,
                maxHeightClass: "max-h-52",
              })}
            </div>
          ) : null}
        </div>
      ) : (
        children
      );

    return (
      <section key={`desktop-filter-panel-${title}`} className="min-w-0">
        <div className="mb-6">
          <h4 className="text-lg font-black tracking-tight text-slate-950">
            {title}
          </h4>
          {subtitle ? (
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          ) : null}
        </div>
        <div className="max-w-none">{content}</div>
      </section>
    );
  };

  const renderMobileFilterBlock = ({
    title,
    badge = 0,
    icon: Icon = FaFilter,
    children,
    className = "",
  }) => {
    const isExpanded = openMobileFilterSection === title;
    return (
      <section
        key={title}
        className={`overflow-hidden rounded-2xl bg-white ring-1 transition ${
          isExpanded ? "ring-blue-500" : "ring-slate-200"
        } ${className}`}
      >
        <button
          type="button"
          className="flex min-h-14 w-full items-center justify-between gap-3 px-4 py-3 text-left"
          onClick={() =>
            setOpenMobileFilterSection((current) =>
              current === title ? "" : title,
            )
          }
          aria-expanded={isExpanded}
        >
          <span className="flex min-w-0 items-center gap-3">
            <Icon
              className={`shrink-0 text-sm ${
                isExpanded ? "text-blue-600" : "text-slate-500"
              }`}
            />
            <strong
              className={`truncate text-sm font-bold ${
                isExpanded ? "text-blue-700" : "text-slate-900"
              }`}
            >
              {title}
            </strong>
          </span>
          <span className="flex shrink-0 items-center gap-3 text-slate-500">
            {renderFilterBadge(badge)}
            <FaChevronRight
              className={`text-xs transition-transform ${
                isExpanded ? "rotate-90 text-blue-600" : ""
              }`}
            />
          </span>
        </button>
        {isExpanded ? (
          <div className="border-t border-slate-100 bg-slate-50/70 p-3">
            <div className="rounded-2xl bg-white p-3">{children}</div>
          </div>
        ) : null}
      </section>
    );
  };

  const renderSelectedFiltersSummary = ({ compact = false } = {}) => {
    const chips = [];
    const push = (label, key) =>
      chips.push({ key: `${key}-${chips.length}`, label });

    filters.brand.forEach((value) => push(value, "brand"));
    filters.ram.forEach((value) => push(`${value} RAM`, "ram"));
    filters.storage.forEach((value) => push(`${value} Storage`, "storage"));
    filters.display.forEach((value) => push(value, "display"));
    filters.processor.forEach((value) => push(value, "processor"));
    filters.battery.forEach((value) => {
      const item = BATTERY_FEATURES.find((entry) => entry.id === value);
      push(item?.label || value, "battery");
    });
    filters.network.forEach((value) => push(value, "network"));
    filters.refreshRate.forEach((value) => push(value, "refreshRate"));
    filters.rearCamera.forEach((value) => push(`Rear ${value}`, "rearCamera"));
    filters.frontCamera.forEach((value) =>
      push(`Front ${value}`, "frontCamera"),
    );
    filters.additionalFeatures.forEach((value) => {
      const item = SMARTPHONE_FEATURE_CATALOG.find(
        (entry) => entry.id === value,
      );
      push(item?.name || value, "additionalFeatures");
    });
    if (
      filters.priceRange.min > MIN_PRICE ||
      filters.priceRange.max < MAX_PRICE
    ) {
      push(
        `₹${Number(filters.priceRange.min).toLocaleString()} – ₹${Number(filters.priceRange.max).toLocaleString()}`,
        "price",
      );
    }

    const count = chips.length;
    return (
      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h5 className="text-[13px] font-black text-slate-900">
            Selected filters{count ? ` (${count})` : ""}
          </h5>
          {count > 0 ? (
            <button
              type="button"
              onClick={clearFilters}
              className="text-[11px] font-bold text-blue-600 transition hover:text-blue-700"
            >
              Clear all
            </button>
          ) : null}
        </div>
        {count > 0 ? (
          <div className="flex flex-wrap gap-2">
            {chips.slice(0, compact ? 16 : 30).map((chip) => (
              <span
                key={chip.key}
                className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1.5 text-[10px] font-bold text-blue-700"
              >
                {chip.label}
              </span>
            ))}
            {count > (compact ? 16 : 30) ? (
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1.5 text-[10px] font-bold text-slate-500">
                +{count - (compact ? 16 : 30)} more
              </span>
            ) : null}
          </div>
        ) : (
          <p className="text-xs font-medium leading-5 text-slate-400">
            Choose options to narrow the catalogue.
          </p>
        )}
      </section>
    );
  };

  const renderFilterSections = (renderBlock) => (
    <>
      {renderBlock({
        title: "Search & Brands",
        subtitle: "Find a model or manufacturer",
        badge: filters.brand.length,
        icon: FaSearch,
        children: (
          <div className="space-y-4">
            <div>
              {renderFilterSearchInput({
                value: searchQuery,
                onChange: setSearchQuery,
                placeholder: "Model, name, or brand",
                clearLabel: "Clear smartphone search",
              })}
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                  Brands
                </label>
                <span className="text-[11px] font-semibold text-slate-400">
                  {brands.length} available
                </span>
              </div>
              {renderFilterSearchInput({
                value: brandFilterQuery,
                onChange: setBrandFilterQuery,
                placeholder: "Search brands",
                clearLabel: "Clear brand search",
              })}
              {renderFilterOptionList({
                items: filteredBrandOptions,
                emptyText: "No brands found",
                isSelected: (brand) => filters.brand.includes(brand),
                onChange: (brand) => handleFilterChange("brand", brand),
                getMeta: (brand) =>
                  devices.filter((device) => device.brand === brand).length,
                maxHeightClass: "max-h-60",
              })}
            </div>
          </div>
        ),
      })}

      {renderBlock({
        title: "Price Range",
        subtitle: "Set your preferred budget",
        badge:
          filters.priceRange.min > MIN_PRICE ||
          filters.priceRange.max < MAX_PRICE
            ? 1
            : 0,
        icon: FaMoneyBill,
        children: renderPriceRangeControl(),
      })}

      {renderBlock({
        title: "Memory (RAM)",
        subtitle: "Multitasking performance",
        badge: filters.ram.length,
        icon: FaMemory,
        children: (
          <>
            {renderFilterSearchInput({
              value: ramFilterQuery,
              onChange: setRamFilterQuery,
              placeholder: "Search RAM",
              clearLabel: "Clear RAM search",
            })}
            {renderFilterOptionList({
              items: filteredRamOptions,
              emptyText: "No RAM options found",
              isSelected: (ram) =>
                filters.ram.some(
                  (value) => normalizeMemoryFilterLabel(value, "GB") === ram,
                ),
              onChange: (ram) => handleFilterChange("ram", ram),
            })}
          </>
        ),
      })}

      {renderBlock({
        title: "Storage Capacity",
        subtitle: "Apps, media and files",
        badge: filters.storage.length,
        icon: FaShoppingBag,
        children: (
          <>
            {renderFilterSearchInput({
              value: storageFilterQuery,
              onChange: setStorageFilterQuery,
              placeholder: "Search storage",
              clearLabel: "Clear storage search",
            })}
            {renderFilterOptionList({
              items: filteredStorageOptions,
              emptyText: "No storage options found",
              isSelected: (storage) =>
                filters.storage.some(
                  (value) =>
                    normalizeMemoryFilterLabel(value, "GB") === storage,
                ),
              onChange: (storage) => handleFilterChange("storage", storage),
            })}
          </>
        ),
      })}

      {renderBlock({
        title: "Battery Features",
        subtitle: "Capacity and charging",
        badge: filters.battery.length,
        icon: FaBatteryFull,
        children: (
          <>
            {renderFilterSearchInput({
              value: batteryFilterQuery,
              onChange: setBatteryFilterQuery,
              placeholder: "Search battery features",
              clearLabel: "Clear battery search",
            })}
            {renderFilterOptionList({
              items: filteredBatteryFeatures,
              emptyText: "No battery options found",
              isSelected: (item) => filters.battery.includes(item.id),
              onChange: (item) => handleFilterChange("battery", item.id),
              getLabel: (item) => item.label,
              getKey: (item) => item.id,
            })}
          </>
        ),
      })}

      {processorOptions.length > 0
        ? renderBlock({
            title: "Processor",
            subtitle: "Chipset family",
            badge: filters.processor.length,
            icon: FaRobot,
            children: (
              <>
                {renderFilterSearchInput({
                  value: processorFilterQuery,
                  onChange: setProcessorFilterQuery,
                  placeholder: "Search processor",
                  clearLabel: "Clear processor search",
                })}
                {renderFilterOptionList({
                  items: filteredProcessorOptions,
                  emptyText: "No processor options found",
                  isSelected: (processor) =>
                    filters.processor.includes(processor),
                  onChange: (processor) =>
                    handleFilterChange("processor", processor),
                })}
              </>
            ),
          })
        : null}

      {networkOptions.length > 0
        ? renderBlock({
            title: "Network",
            subtitle: "Cellular connectivity",
            badge: filters.network.length,
            icon: FaWifi,
            children: (
              <>
                {renderFilterSearchInput({
                  value: networkFilterQuery,
                  onChange: setNetworkFilterQuery,
                  placeholder: "Search network",
                  clearLabel: "Clear network search",
                })}
                {renderFilterOptionList({
                  items: filteredNetworkOptions,
                  emptyText: "No network options found",
                  isSelected: (network) => filters.network.includes(network),
                  onChange: (network) => handleFilterChange("network", network),
                })}
              </>
            ),
          })
        : null}

      {refreshRateOptions.length > 0
        ? renderBlock({
            title: "Refresh Rate",
            subtitle: "Display smoothness",
            badge: filters.refreshRate.length,
            icon: FaSyncAlt,
            children: (
              <>
                {renderFilterSearchInput({
                  value: refreshRateFilterQuery,
                  onChange: setRefreshRateFilterQuery,
                  placeholder: "Search refresh rate",
                  clearLabel: "Clear refresh rate search",
                })}
                {renderFilterOptionList({
                  items: filteredRefreshRateOptions,
                  emptyText: "No refresh rate options found",
                  isSelected: (rate) => filters.refreshRate.includes(rate),
                  onChange: (rate) => handleFilterChange("refreshRate", rate),
                })}
              </>
            ),
          })
        : null}

      {displayOptions.length > 0
        ? renderBlock({
            title: "Display",
            subtitle: "Panel and display technology",
            badge: filters.display.length,
            icon: FaMobileAlt,
            children: (
              <>
                {renderFilterSearchInput({
                  value: displayFilterQuery,
                  onChange: setDisplayFilterQuery,
                  placeholder: "Search display",
                  clearLabel: "Clear display search",
                })}
                {renderFilterOptionList({
                  items: filteredDisplayOptions,
                  emptyText: "No display options found",
                  isSelected: (value) => filters.display.includes(value),
                  onChange: (value) => handleFilterChange("display", value),
                  getLabel: (value) => value,
                  getMeta: (value) =>
                    devices.filter((device) => {
                      const raw =
                        device?.display || device?.specs?.display || {};
                      const displayText =
                        raw && typeof raw === "object"
                          ? [
                              raw.panel,
                              raw.type,
                              raw.display_type,
                              raw.technology,
                            ]
                              .filter(Boolean)
                              .join(" ")
                              .toLowerCase()
                          : String(raw || "").toLowerCase();
                      return displayText.includes(String(value).toLowerCase());
                    }).length,
                })}
              </>
            ),
          })
        : null}

      {additionalFeatureOptions.length > 0
        ? renderBlock({
            title: "Additional Features",
            subtitle: "Extra hardware and software capabilities",
            badge: filters.additionalFeatures.length,
            icon: FaStar,
            children: (
              <>
                {renderFilterSearchInput({
                  value: additionalFeatureQuery,
                  onChange: setAdditionalFeatureQuery,
                  placeholder: "Search features",
                  clearLabel: "Clear feature search",
                })}
                {renderFilterOptionList({
                  items: additionalFeatureOptions,
                  emptyText: "No additional features found",
                  isSelected: (feature) =>
                    filters.additionalFeatures.includes(feature.id),
                  onChange: (feature) =>
                    handleFilterChange("additionalFeatures", feature.id),
                  getLabel: (feature) => feature.name,
                  getKey: (feature) => feature.id,
                  getMeta: (feature) => {
                    try {
                      return devices.filter((device) => feature.match?.(device))
                        .length;
                    } catch {
                      return 0;
                    }
                  },
                })}
              </>
            ),
          })
        : null}

      {rearCameraOptions.length > 0 || frontCameraOptions.length > 0
        ? renderBlock({
            title: "Camera",
            subtitle: "Rear and selfie resolution",
            badge: filters.rearCamera.length + filters.frontCamera.length,
            icon: FaMobileAlt,
            children: (
              <div className="space-y-5">
                {rearCameraOptions.length > 0 ? (
                  <div>
                    <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                      Rear camera
                    </label>
                    {renderFilterSearchInput({
                      value: rearCameraFilterQuery,
                      onChange: setRearCameraFilterQuery,
                      placeholder: "Search rear camera",
                      clearLabel: "Clear rear camera search",
                    })}
                    {renderFilterOptionList({
                      items: filteredRearCameraOptions,
                      emptyText: "No rear camera options found",
                      isSelected: (camera) =>
                        filters.rearCamera.includes(camera),
                      onChange: (camera) =>
                        handleFilterChange("rearCamera", camera),
                    })}
                  </div>
                ) : null}
                {frontCameraOptions.length > 0 ? (
                  <div>
                    <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                      Front camera
                    </label>
                    {renderFilterSearchInput({
                      value: frontCameraFilterQuery,
                      onChange: setFrontCameraFilterQuery,
                      placeholder: "Search front camera",
                      clearLabel: "Clear front camera search",
                    })}
                    {renderFilterOptionList({
                      items: filteredFrontCameraOptions,
                      emptyText: "No front camera options found",
                      isSelected: (camera) =>
                        filters.frontCamera.includes(camera),
                      onChange: (camera) =>
                        handleFilterChange("frontCamera", camera),
                    })}
                  </div>
                ) : null}
              </div>
            ),
          })
        : null}
    </>
  );

  const buildMobileFilterSections = () => {
    const collected = [];
    renderFilterSections(
      ({ title, badge = 0, icon: Icon = FaFilter, children }) => {
        collected.push({
          id: title,
          title,
          badge,
          icon: Icon,
          content: children,
        });
        return null;
      },
    );
    return collected;
  };

  const filterSectionDefinitions = [
    {
      id: "Search & Brands",
      title: "Search & Brands",
      badge: filters.brand.length,
      icon: FaSearch,
    },
    {
      id: "Price Range",
      title: "Price Range",
      badge:
        filters.priceRange.min > MIN_PRICE || filters.priceRange.max < MAX_PRICE
          ? 1
          : 0,
      icon: FaMoneyBill,
    },
    {
      id: "Memory (RAM)",
      title: "Memory (RAM)",
      badge: filters.ram.length,
      icon: FaMemory,
    },
    {
      id: "Storage Capacity",
      title: "Storage Capacity",
      badge: filters.storage.length,
      icon: FaShoppingBag,
    },
    {
      id: "Display",
      title: "Display",
      badge: filters.display.length,
      icon: FaMobileAlt,
      hidden: displayOptions.length === 0,
    },
    {
      id: "Processor",
      title: "Processor",
      badge: filters.processor.length,
      icon: FaRobot,
      hidden: processorOptions.length === 0,
    },
    {
      id: "Camera",
      title: "Camera",
      badge: filters.rearCamera.length + filters.frontCamera.length,
      icon: FaMobileAlt,
      hidden: rearCameraOptions.length === 0 && frontCameraOptions.length === 0,
    },
    {
      id: "Battery Features",
      title: "Battery Features",
      badge: filters.battery.length,
      icon: FaBatteryFull,
    },
    {
      id: "Network",
      title: "Network",
      badge: filters.network.length,
      icon: FaWifi,
      hidden: networkOptions.length === 0,
    },
    {
      id: "Refresh Rate",
      title: "Refresh Rate",
      badge: filters.refreshRate.length,
      icon: FaSyncAlt,
      hidden: refreshRateOptions.length === 0,
    },
    {
      id: "Additional Features",
      title: "Additional Features",
      badge: filters.additionalFeatures.length,
      icon: FaStar,
      hidden: additionalFeatureOptions.length === 0,
    },
  ].filter((item) => !item.hidden);

  const renderPriceRangeControl = () => {
    const priceMin = Number(filters.priceRange?.min ?? MIN_PRICE);
    const priceMax = Number(filters.priceRange?.max ?? MAX_PRICE);
    const minPercent = Math.max(
      0,
      Math.min(100, ((priceMin || 0) / (MAX_PRICE || 1)) * 100),
    );
    const rangePercent = Math.max(
      0,
      Math.min(100, ((priceMax - priceMin) / (MAX_PRICE || 1)) * 100),
    );

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
              Budget range
            </p>
            <p className="mt-1 text-lg font-black text-slate-950">
              ₹{priceMin.toLocaleString()} – ₹{priceMax.toLocaleString()}
            </p>
          </div>
          <button
            type="button"
            onClick={() => updatePriceRange(MIN_PRICE, MAX_PRICE)}
            className="rounded-full bg-blue-50 px-3 py-1.5 text-[10px] font-extrabold text-blue-700 transition hover:bg-blue-100"
          >
            Reset range
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-5">
          <div className="mb-4 flex items-center justify-between text-[11px] font-semibold text-slate-400">
            <span>₹0</span>
            <span>₹1.5L</span>
            <span>₹3L+</span>
          </div>

          <div className="relative h-8">
            <div className="absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-slate-200" />
            <div
              className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-blue-600"
              style={{ left: `${minPercent}%`, width: `${rangePercent}%` }}
            />
            <input
              type="range"
              min={MIN_PRICE}
              max={MAX_PRICE}
              value={priceMin}
              onChange={(event) =>
                updatePriceRange(Number(event.target.value), priceMax)
              }
              className="absolute inset-x-0 top-1/2 h-6 w-full -translate-y-1/2 appearance-none bg-transparent [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-blue-500 [&::-webkit-slider-thumb]:bg-white"
            />
            <input
              type="range"
              min={MIN_PRICE}
              max={MAX_PRICE}
              value={priceMax}
              onChange={(event) =>
                updatePriceRange(priceMin, Number(event.target.value))
              }
              className="absolute inset-x-0 top-1/2 h-6 w-full -translate-y-1/2 appearance-none bg-transparent [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-blue-500 [&::-webkit-slider-thumb]:bg-white"
            />
          </div>
        </div>
      </div>
    );
  };

  // Expand/collapse removed: details are always shown by default.

  const trackFeatureClick = (featureId) => {
    try {
      const url = "https://api.apisphere.in/api/public/feature-click";
      const body = new URLSearchParams({
        device_type: "smartphone",
        feature_id: featureId,
      });
      if (navigator && typeof navigator.sendBeacon === "function") {
        navigator.sendBeacon(url, body);
        return;
      }
    } catch {
      // fall back to fetch
    }

    try {
      fetch("https://api.apisphere.in/api/public/feature-click", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
        body: new URLSearchParams({
          device_type: "smartphone",
          feature_id: featureId,
        }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      // ignore
    }
  };

  const setFeatureParam = (featureId) => {
    const sp = stripSmartphoneSeoQueryParams(location.search || "");
    if (featureId) trackFeatureClick(featureId);
    // Feature selection should win over "trending/new" list filters
    sp.delete("filter");
    navigate(
      buildSmartphoneListingPath({
        brand: normalizedBrandSlug,
        feature: featureId || "",
        query: sp,
      }),
    );
  };

  const siteOrigin =
    typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : "https://mobilesx.in";

  const toAbsoluteUrl = (value) => {
    const raw = normalizeAssetUrl(value);
    if (!raw) return "";
    if (/^(https?:|data:|blob:)/i.test(raw)) return raw;
    if (raw.startsWith("//")) return `https:${raw}`;
    return raw.startsWith("/") ? `${siteOrigin}${raw}` : `${siteOrigin}/${raw}`;
  };

  const getListingProductImage = (device) => {
    if (!device || typeof device !== "object") return "";
    const directImages = [
      ...(Array.isArray(device.images) ? device.images : []),
      device.image,
      device.image_url,
      device.imageUrl,
      device.thumbnail,
      device.thumbnail_url,
      device.thumbnailUrl,
      device.primary_image,
      device.primaryImage,
      device.product_image,
      device.productImage,
    ];
    const direct = directImages.find(Boolean);
    if (direct) return direct;

    const variant = Array.isArray(device.variants)
      ? device.variants.find((entry) => {
          if (!entry || typeof entry !== "object") return false;
          return (
            (Array.isArray(entry.images) && entry.images.find(Boolean)) ||
            entry.image ||
            entry.image_url ||
            entry.imageUrl
          );
        })
      : null;
    if (!variant) return "";
    return (
      (Array.isArray(variant.images) && variant.images.find(Boolean)) ||
      variant.image ||
      variant.image_url ||
      variant.imageUrl ||
      ""
    );
  };

  const listOgImage = useMemo(() => {
    const sourceRows = visibleVariants.length
      ? visibleVariants
      : sortedVariants;
    const firstWithImage = sourceRows.find((device) =>
      Boolean(getListingProductImage(device)),
    );
    const raw = getListingProductImage(firstWithImage);
    const abs = toAbsoluteUrl(raw);
    return abs || `${SITE_ORIGIN}/mobilex-favicon.svg`;
  }, [visibleVariants, sortedVariants, siteOrigin]);

  const listOgImageMeta = listOgImage
    ? {
        url: listOgImage,
        width: 1200,
        height: 630,
        alt: `${normalizeSeoTitle(seoTitle)
          .replace(/\s*Hooks$/i, "")
          .trim()} preview image`,
      }
    : null;
  const normalizedSeoTitle = normalizeSeoTitle(seoTitle);
  const listRobots = hasSearchParams
    ? "noindex, follow, max-image-preview:large"
    : "index, follow, max-image-preview:large";

  const listSchemaUrl = useMemo(() => {
    const basePath = hasSearchParams
      ? toCanonicalPagePath(location?.pathname || "/smartphones")
      : normalizedBrandSlug || normalizedFeature
        ? buildSmartphoneListingPath({
            brand: normalizedBrandSlug,
            feature: normalizedFeature,
          })
        : toCanonicalPagePath(location?.pathname || "/smartphones");
    return `${SITE_ORIGIN}${basePath}`;
  }, [
    hasSearchParams,
    location?.pathname,
    normalizedBrandSlug,
    normalizedFeature,
  ]);

  const listSchemaItems = useMemo(() => {
    const items = visibleVariants.map((device) => {
      const name = String(
        device?.name || device?.model || device?.title || "",
      ).trim();
      if (!name) return null;
      const slug = generateSlug(device?.model || device?.name || device?.id);
      const imageRaw = Array.isArray(device?.images)
        ? device.images.find(Boolean)
        : device?.image;
      const image = normalizeAssetUrl(imageRaw) || undefined;
      return {
        name,
        url: `${SITE_ORIGIN}${toCanonicalPagePath(
          `/smartphones/${slug}-price-in-india`,
        )}`,
        image,
      };
    });
    return items.filter(Boolean);
  }, [visibleVariants]);

  const listSchema = useMemo(() => {
    const collectionSchema = createCollectionSchema({
      name: normalizedSeoTitle,
      description: seoDescription,
      url: listSchemaUrl,
      image: listOgImageMeta || undefined,
    });
    const itemListSchema = createItemListSchema({
      name: normalizedSeoTitle,
      url: listSchemaUrl,
      items: listSchemaItems,
    });
    return [collectionSchema, itemListSchema];
  }, [
    normalizedSeoTitle,
    seoDescription,
    listSchemaUrl,
    listOgImageMeta,
    listSchemaItems,
  ]);

  return (
    <div
      className="hooks-smartphones-page min-h-screen bg-[#f3f6fb] text-[#0f172a]  "
      data-page-label={headerLabel}
    >
      <SEO
        title={seoTitle}
        description={seoDescription}
        keywords={seoKeywords}
        image={listOgImageMeta}
        url={listSchemaUrl}
        robots={listRobots}
        schema={listSchema}
      />
      {/* Main Content */}
      <div className="relative mx-auto max-w-[1440px] px-3 pb-10 sm:px-6 sm:pb-14 lg:px-8 lg:pb-20">
        <div className="relative">
          <section className="smartphones-hero relative left-1/2 isolate w-screen -translate-x-1/2 overflow-hidden bg-gradient-to-b from-white via-blue-50/70 to-[#f3f6fb]   ">
            {normalizedRoutePathname === "/smartphones" ? (
              <Breadcrumbs variant="plain" />
            ) : null}

            <div className="px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-8">
              <div className="relative mx-auto max-w-7xl">
                <div className="grid items-center gap-4 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8">
                  <div className={`${heroContentWidthClass} min-w-0`}>
                    <div className="mb-2 inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-blue-700 ">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
                      Live smartphone catalogue
                    </div>
                    <h1
                      className={`${heroTitleWidthClass} max-w-4xl font-[Space_Grotesk] text-4xl font-bold leading-[0.98] tracking-[-0.055em] text-[#0f172a] sm:text-5xl lg:text-7xl `}
                    >
                      {heroTitleText}
                    </h1>

                    <p
                      className={`${heroSubtitleWidthClass} mt-3 max-w-3xl text-sm leading-6 text-[#64748b] sm:text-base `}
                      style={heroSubtitleStyle}
                    >
                      {heroSubtitleText}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setShowFilters(true)}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
                      >
                        <FaFilter /> Refine phones
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowSort(true)}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#ffffff] px-5 py-2.5 text-sm font-bold text-[#1e293b] ring-1 ring-[#e2e8f0] transition hover:bg-[#f8fafc] lg:hidden    "
                      >
                        <FaSyncAlt /> Sort results
                      </button>
                      {isExpandedHeroDescriptionPath ? (
                        <button
                          type="button"
                          onClick={() =>
                            setShowHeroDescription((prev) => !prev)
                          }
                          className="inline-flex min-h-11 items-center gap-2 px-2 text-sm font-bold text-blue-700 transition hover:text-blue-900  "
                          aria-expanded={showHeroDescription}
                        >
                          {showHeroDescription
                            ? "Show less"
                            : "Read buying context"}
                          <FaChevronRight />
                        </button>
                      ) : null}
                    </div>
                  </div>

                  <div
                    className="relative mx-auto hidden h-[190px] w-full max-w-[350px] sm:h-[220px] lg:block lg:h-[230px]"
                    aria-label="Smartphone technology illustration"
                    role="img"
                  >
                    <div className="absolute inset-x-10 top-7 h-36 rounded-full bg-blue-500/15 blur-3xl" />
                    <div className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-200/70" />
                    <div className="absolute left-1/2 top-1/2 h-28 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full border border-indigo-200/60 -rotate-12" />
                    <div className="absolute left-[17%] top-[18%] h-[152px] w-[78px] -rotate-12 rounded-[22px] bg-slate-950 p-1.5 sm:h-[174px] sm:w-[88px]">
                      <div className="relative h-full w-full overflow-hidden rounded-[18px] bg-gradient-to-br from-slate-700 via-blue-700 to-indigo-700">
                        <div className="absolute left-2 top-2 grid h-9 w-9 grid-cols-2 gap-1 rounded-xl bg-slate-950/65 p-1.5">
                          <span className="rounded-full bg-blue-200" />
                          <span className="rounded-full bg-slate-400" />
                          <span className="rounded-full bg-indigo-300" />
                          <span className="rounded-full bg-slate-700" />
                        </div>
                        <span className="absolute bottom-4 left-1/2 h-1 w-8 -translate-x-1/2 rounded-full bg-white/35" />
                      </div>
                    </div>
                    <div className="absolute left-[46%] top-[4%] h-[174px] w-[86px] rotate-6 rounded-[24px] bg-slate-950 p-1.5 sm:h-[198px] sm:w-[98px]">
                      <div className="relative h-full w-full overflow-hidden rounded-[20px] bg-gradient-to-br from-cyan-300 via-blue-500 to-indigo-700">
                        <span className="absolute left-1/2 top-2 h-2 w-2 -translate-x-1/2 rounded-full bg-slate-950/80" />
                        <span className="absolute -left-10 top-12 h-28 w-28 rounded-full border-[16px] border-white/25" />
                        <span className="absolute -right-10 bottom-5 h-24 w-24 rounded-full border-[14px] border-cyan-100/25" />
                      </div>
                    </div>
                    <div className="absolute left-1 top-3 grid h-11 w-11 place-items-center rounded-xl bg-white/75 text-blue-600 ring-1 ring-blue-100 backdrop-blur-sm   ">
                      <FaRobot />
                    </div>
                    <div className="absolute bottom-4 left-4 grid h-10 w-10 place-items-center rounded-xl bg-white/75 text-blue-600 ring-1 ring-blue-100 backdrop-blur-sm   ">
                      <FaWifi />
                    </div>
                    <div className="absolute right-3 top-8 grid h-11 w-11 place-items-center rounded-xl bg-white/75 text-blue-600 ring-1 ring-blue-100 backdrop-blur-sm   ">
                      <FaBatteryFull />
                    </div>
                    <div className="absolute bottom-3 right-8 grid h-10 w-10 place-items-center rounded-xl bg-white/75 text-blue-600 ring-1 ring-blue-100 backdrop-blur-sm   ">
                      <FaMobileAlt />
                    </div>
                    <span className="absolute right-2 top-1/2 h-2.5 w-2.5 rounded-full bg-cyan-400" />
                    <span className="absolute bottom-8 left-1/3 h-2 w-2 rounded-full bg-indigo-400" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="mt-0">
            <MobileListingControls
              activeFilterCount={getActiveFiltersCount()}
              activeFeatureCount={normalizedFeature ? 1 : 0}
              onOpenFilters={() => setShowFilters(true)}
              onOpenPopularFeatures={() => {
                setPendingPopularFeature(normalizedFeature || "");
                setShowPopularFeaturePicker(true);
              }}
              currentFeatureLabel={
                currentFeatureMeta?.name || "All popular features"
              }
              sortBy={sortBy}
              sortOptions={SMARTPHONE_MOBILE_SORT_OPTIONS}
              onSortChange={setSortBy}
            />

            {!shouldHideInteractiveFilters ? (
              <>
                {showPopularFeaturePicker ? (
                  <div
                    className="fixed inset-0 z-[90] flex items-end justify-center p-0 sm:items-center sm:p-6"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="popular-feature-filter-title"
                  >
                    <button
                      type="button"
                      className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
                      aria-label="Close popular feature filter"
                      onClick={() => setShowPopularFeaturePicker(false)}
                    />

                    <div className="relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[30px] bg-white sm:max-h-[84vh] sm:max-w-5xl sm:rounded-[30px]">
                      <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-4 py-4 sm:px-6 sm:py-5">
                        <div className="flex min-w-0 items-start gap-3">
                          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-600">
                            <FaStar className="text-sm" />
                          </span>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3
                                id="popular-feature-filter-title"
                                className="text-lg font-black tracking-tight text-slate-950 sm:text-2xl"
                              >
                                {isUpcomingFilterPath
                                  ? "Launch Signal Filter"
                                  : "Popular Feature Filter"}
                              </h3>
                              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-blue-700">
                                {pendingPopularFeature
                                  ? "1 selected"
                                  : "None selected"}
                              </span>
                            </div>
                            <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
                              Select one feature, review the selection, and
                              apply it to the smartphone catalogue.
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowPopularFeaturePicker(false)}
                          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200 hover:text-slate-950"
                          aria-label="Close popular feature filter"
                        >
                          <FaTimes />
                        </button>
                      </div>

                      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
                        <div className="grid gap-5 lg:grid-cols-[15rem_minmax(0,1fr)]">
                          <aside className="rounded-3xl bg-slate-50 p-4 lg:sticky lg:top-0 lg:self-start">
                            <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-blue-700">
                              Feature filter
                            </span>
                            <h4 className="mt-2 text-lg font-black tracking-tight text-slate-950">
                              Choose one priority
                            </h4>
                            <p className="mt-2 text-xs leading-5 text-slate-500">
                              The catalogue supports one popular-feature route
                              at a time. Your choice is applied only after
                              pressing the Apply button.
                            </p>

                            <div className="mt-4 rounded-2xl bg-white p-3">
                              <span className="block text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
                                Pending selection
                              </span>
                              <span className="mt-1 block text-sm font-bold text-slate-800">
                                {popularFeatures.find(
                                  (item) => item.id === pendingPopularFeature,
                                )?.name || "All popular features"}
                              </span>
                            </div>
                          </aside>

                          <div className="min-w-0">
                            <div className="mb-3 flex items-center justify-between gap-3">
                              <div>
                                <h4 className="text-sm font-black text-slate-950 sm:text-base">
                                  Available features
                                </h4>
                                <p className="mt-0.5 text-[11px] text-slate-400 sm:text-xs">
                                  Tap an option to stage it for filtering.
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => setPendingPopularFeature("")}
                                className="inline-flex min-h-9 items-center gap-2 rounded-xl bg-slate-100 px-3 text-xs font-bold text-slate-700 transition hover:bg-slate-200"
                              >
                                <FaSyncAlt className="text-[10px]" />
                                Clear
                              </button>
                            </div>

                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                              {popularFeatures.map((pf) => {
                                const isSelected =
                                  pendingPopularFeature === pf.id;
                                const Icon = pf.icon;
                                return (
                                  <button
                                    key={pf.id}
                                    type="button"
                                    aria-pressed={isSelected}
                                    onClick={() =>
                                      setPendingPopularFeature(
                                        isSelected ? "" : pf.id,
                                      )
                                    }
                                    className={`group flex min-h-[72px] min-w-0 items-center gap-3 rounded-2xl px-3.5 py-3 text-left transition-colors ${
                                      isSelected
                                        ? "bg-blue-600 text-white"
                                        : "bg-slate-50 text-slate-700 hover:bg-blue-50 hover:text-blue-800"
                                    }`}
                                  >
                                    <span
                                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-sm transition-colors ${
                                        isSelected
                                          ? "bg-white/15 text-white"
                                          : "bg-white text-blue-600 group-hover:bg-blue-100"
                                      }`}
                                    >
                                      {Icon ? <Icon /> : <FaStar />}
                                    </span>
                                    <span className="min-w-0 flex-1">
                                      <span className="block text-sm font-bold leading-5">
                                        {pf.name}
                                      </span>
                                      <span
                                        className={`mt-0.5 block text-[10px] font-medium ${
                                          isSelected
                                            ? "text-blue-100"
                                            : "text-slate-400"
                                        }`}
                                      >
                                        {isSelected
                                          ? "Ready to apply"
                                          : "Select feature"}
                                      </span>
                                    </span>
                                    <span
                                      className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[10px] ${
                                        isSelected
                                          ? "bg-white text-blue-600"
                                          : "bg-slate-100 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600"
                                      }`}
                                    >
                                      {isSelected ? "✓" : <FaPlus />}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-100 bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:flex-row sm:justify-end sm:px-6 sm:py-4">
                        <button
                          type="button"
                          onClick={() => {
                            setPendingPopularFeature(normalizedFeature || "");
                            setShowPopularFeaturePicker(false);
                          }}
                          className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-slate-100 px-5 text-sm font-extrabold text-slate-700 transition hover:bg-slate-200"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFeatureParam(pendingPopularFeature || null);
                            setShowPopularFeaturePicker(false);
                          }}
                          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 text-sm font-extrabold text-white transition hover:bg-blue-700"
                        >
                          <FaFilter className="text-xs" />
                          {pendingPopularFeature
                            ? "Apply feature filter"
                            : "Show all features"}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}
              </>
            ) : null}
            <section className="smartphones-toolbar space-y-4">
              <div className="hidden items-center gap-3 py-2 lg:flex">
                <button
                  type="button"
                  onClick={() => setShowFilters(true)}
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-[#e2e8f0] bg-transparent text-blue-600 transition-colors hover:border-blue-300 hover:bg-blue-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2      "
                  aria-label="Open smartphone search"
                >
                  <FaSearch className="text-sm" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPendingPopularFeature(normalizedFeature || "");
                    setShowPopularFeaturePicker(true);
                  }}
                  className="group flex min-h-12 min-w-[13.5rem] items-center gap-3 rounded-2xl border border-[#e2e8f0] bg-transparent px-4 text-left transition-colors hover:border-blue-300 hover:bg-blue-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2     "
                >
                  <FaStar className="shrink-0 text-sm text-blue-600" />
                  <span className="min-w-0 flex-1 truncate text-sm font-bold text-[#0f172a] ">
                    {currentFeatureMeta?.name || "Popular Features"}
                  </span>
                  {normalizedFeature ? (
                    <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-blue-600 px-1 text-[10px] font-black text-white">
                      1
                    </span>
                  ) : null}
                  <FaChevronDown className="shrink-0 text-[10px] text-slate-500 transition-transform group-hover:text-blue-600" />
                </button>

                <button
                  type="button"
                  onClick={() => setShowFilters(true)}
                  className="group flex min-h-12 min-w-[11.5rem] items-center gap-3 rounded-2xl border border-[#e2e8f0] bg-transparent px-4 text-left transition-colors hover:border-blue-300 hover:bg-blue-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2     "
                >
                  <FaFilter className="shrink-0 text-sm text-blue-600" />
                  <span className="min-w-0 flex-1 truncate text-sm font-bold text-[#0f172a] ">
                    All Filters
                  </span>
                  {getActiveFiltersCount() > 0 ? (
                    <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-blue-600 px-1 text-[10px] font-black text-white">
                      {getActiveFiltersCount()}
                    </span>
                  ) : null}
                  <FaChevronDown className="shrink-0 text-[10px] text-slate-500 transition-transform group-hover:text-blue-600" />
                </button>

                <label className="ml-auto flex min-h-12 min-w-[15.5rem] items-center gap-3 rounded-2xl border border-[#e2e8f0] bg-transparent px-4 transition-colors hover:border-blue-300 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/20    ">
                  <FaSyncAlt className="shrink-0 text-sm text-blue-600" />
                  <span className="min-w-0 flex-1">
                    <span className="mr-2 text-sm font-medium text-[#64748b] ">
                      Sort by:
                    </span>
                    <select
                      value={sortBy}
                      onChange={(event) => setSortBy(event.target.value)}
                      aria-label="Sort smartphones"
                      className="max-w-[10rem] cursor-pointer appearance-none bg-transparent pr-6 text-sm font-bold text-[#0f172a] outline-none  "
                    >
                      {SMARTPHONE_MOBILE_SORT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </span>
                  <FaChevronDown className="pointer-events-none shrink-0 text-[10px] text-slate-500" />
                </label>
              </div>
              <div className="mt-4 flex flex-col gap-5 md:gap-6 lg:flex-row">
                {/* Products List */}
                <div className={productColumnWidthClass}>
                  {/* Products Grid */}
                  {loading && !smartphonesForList.length ? (
                    <SmartphoneGridSkeleton />
                  ) : (
                    <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 md:items-stretch md:gap-5 md:auto-rows-fr xl:grid-cols-3 xl:gap-6">
                      {visibleVariants.map((device, _idx) => {
                        const devicePolicy = resolveDevicePolicy(device);
                        const availabilityState = getAvailabilityState(
                          device.storePrices || [],
                          device.brand,
                        );
                        const availableStoreRows =
                          availabilityState.stores || [];
                        const shouldFilterEmptyStores = listFilter === "new";
                        const storeRowsForDisplay = shouldFilterEmptyStores
                          ? availableStoreRows.filter((storePrice) => {
                              if (!storePrice) return false;
                              const hasUrl = Boolean(
                                String(storePrice.url || "").trim(),
                              );
                              const hasPrice =
                                extractNumericPrice(storePrice.price) > 0;
                              return hasUrl || hasPrice;
                            })
                          : availableStoreRows;
                        const renderType = getRenderType(device);
                        const isUpcomingCard =
                          isUpcomingFilterPath || renderType === "upcoming";
                        const launchDateParsed =
                          parseDateValue(device.launchDate) ||
                          resolveSaleStartDate(device) ||
                          null;
                        const hasLaunchDate =
                          launchDateParsed &&
                          !Number.isNaN(launchDateParsed.getTime());
                        const launchDateText = hasLaunchDate
                          ? formatLaunchDate(launchDateParsed)
                          : "Date not confirmed";
                        const launchDateLabel = isUpcomingCard
                          ? resolveLaunchDateLabel(device, launchDateParsed)
                          : "Launched";
                        const allowSpecScore = devicePolicy.allowSpecScore;
                        const resolvedScoreValue = allowSpecScore
                          ? resolveSmartphoneBadgeScore(device)
                          : null;
                        const scoreValueRaw =
                          resolvedScoreValue == null
                            ? null
                            : Number(resolvedScoreValue);
                        const scoreValue = Number.isFinite(scoreValueRaw)
                          ? formatSmartphoneBadgeScore(scoreValueRaw)
                          : null;
                        const isAiDevice = hasAiPhoneSignal(device);
                        const statusLabel = isUpcomingCard
                          ? null
                          : device.display_status ||
                            device.displayStatus ||
                            (renderType === "available"
                              ? "Available now"
                              : null);
                        const marketStatusLabel = isUpcomingCard
                          ? "Upcoming"
                          : statusLabel || "Available now";
                        const cardBadgeLabel = isAiDevice ? "AI Phone" : null;
                        const deviceCompareLimit = Number.isFinite(
                          devicePolicy.compareLimit,
                        )
                          ? devicePolicy.compareLimit
                          : compareLimit;
                        const compareSelected = isCompareSelected(device);
                        const compareDisabled =
                          deviceCompareLimit === 0 ||
                          devicePolicy.allowCompare === false;
                        const effectiveCompareLimit = Math.min(
                          compareLimit,
                          deviceCompareLimit,
                        );
                        const brandStoreUrl =
                          availabilityState.stores?.find(
                            (sp) =>
                              typeof sp?.url === "string" &&
                              sp.url.trim().length > 0,
                          )?.url || null;
                        const brandLogoSrc = normalizeAssetUrl(
                          device.brandLogo || device.brandLogoUrl || null,
                        );
                        const brandPriceNumeric = extractNumericPrice(
                          device.numericPrice || device.price,
                        );
                        const upcomingExpectedPrice =
                          resolveUpcomingExpectedPriceMeta(device);
                        const shouldUseBrandPriceFallback =
                          storeRowsForDisplay.length === 0 &&
                          brandPriceNumeric > 0;
                        const brandPriceFallbackRow =
                          shouldUseBrandPriceFallback
                            ? {
                                id: `${device.id ?? device.model ?? "phone"}-brand-price`,
                                store: device.brand || "Brand",
                                store_name: device.brand || "Brand",
                                storeName: device.brand || "Brand",
                                display_store_name: device.brand || "Brand",
                                logo: brandLogoSrc,
                                price: device.price || brandPriceNumeric,
                                cta_label: "Brand price",
                                is_brand_price: true,
                              }
                            : null;
                        const shouldUseExpectedPriceFallback =
                          isUpcomingCard &&
                          storeRowsForDisplay.length === 0 &&
                          !shouldUseBrandPriceFallback &&
                          upcomingExpectedPrice.numeric > 0;
                        const expectedPriceFallbackRow =
                          shouldUseExpectedPriceFallback
                            ? {
                                id: `${device.id ?? device.model ?? "phone"}-expected-price`,
                                store: device.brand || "Expected",
                                store_name: device.brand || "Expected",
                                storeName: device.brand || "Expected",
                                display_store_name: device.brand || "Expected",
                                logo: brandLogoSrc,
                                price: upcomingExpectedPrice.numeric,
                                cta_label: "Expected price",
                                is_expected_price: true,
                              }
                            : null;
                        const primaryStoreRow = storeRowsForDisplay[0] || null;
                        const primaryStoreName =
                          primaryStoreRow?.display_store_name ||
                          primaryStoreRow?.store ||
                          primaryStoreRow?.store_name ||
                          primaryStoreRow?.storeName ||
                          "";
                        const primaryStoreLogo = normalizeAssetUrl(
                          primaryStoreRow?.logo ||
                            (primaryStoreName
                              ? getStoreLogo
                                ? getStoreLogo(primaryStoreName)
                                : getLogo(primaryStoreName)
                              : null) ||
                            brandLogoSrc ||
                            null,
                        );
                        const primaryStoreUrl =
                          primaryStoreRow?.url || brandStoreUrl || null;
                        const storePriceRowsForDisplay = storeRowsForDisplay
                          .filter(
                            (row) =>
                              row &&
                              (row.price ||
                                row.url ||
                                row.store ||
                                row.store_name ||
                                row.storeName),
                          )
                          .slice(0, 2);
                        const priceRowsForDisplay =
                          storePriceRowsForDisplay.length > 0
                            ? storePriceRowsForDisplay
                            : brandPriceFallbackRow
                              ? [brandPriceFallbackRow]
                              : expectedPriceFallbackRow
                                ? [expectedPriceFallbackRow]
                                : [];
                        const isBrandPriceOnly =
                          priceRowsForDisplay.length > 0 &&
                          priceRowsForDisplay.every(
                            (row) => row?.is_brand_price,
                          );
                        const isExpectedPriceOnly =
                          priceRowsForDisplay.length > 0 &&
                          priceRowsForDisplay.every(
                            (row) => row?.is_expected_price,
                          );
                        const hasListedPrice =
                          brandPriceNumeric > 0 ||
                          priceRowsForDisplay.some(
                            (row) =>
                              !row?.is_expected_price &&
                              extractNumericPrice(row?.price) > 0,
                          );
                        const upcomingPriceEyebrow = hasListedPrice
                          ? "Price"
                          : upcomingExpectedPrice.numeric > 0
                            ? "Expected price"
                            : "Price";
                        const pricePanelTitle = isBrandPriceOnly
                          ? "Brand Price"
                          : isExpectedPriceOnly
                            ? "Expected Price"
                            : "Check Price On";
                        const upcomingPriceLabel = isUpcomingCard
                          ? resolveUpcomingPriceLabel(device, brandPriceNumeric)
                          : "";
                        const cardPriceLabel =
                          device.price ||
                          (isUpcomingCard &&
                          upcomingPriceLabel &&
                          upcomingPriceLabel !== "Price not confirmed"
                            ? upcomingPriceLabel
                            : "");
                        const availableDateRaw =
                          device.saleStartDate ||
                          device.sale_start_date ||
                          device.availableDate ||
                          device.available_date ||
                          device.predictedAvailableDate ||
                          device.predicted_available_date ||
                          null;
                        const availableDateParsed =
                          parseDateValue(availableDateRaw);
                        const availableOnText = null;
                        const displaySummary = (() => {
                          const rawDisplay =
                            device.display || device.specs?.display;
                          if (
                            typeof rawDisplay === "string" &&
                            rawDisplay.trim()
                          ) {
                            return rawDisplay.trim().split("|")[0].trim();
                          }
                          if (rawDisplay && typeof rawDisplay === "object") {
                            const size =
                              rawDisplay.size ||
                              rawDisplay.display_size ||
                              rawDisplay.displaySize ||
                              "";
                            const inches =
                              rawDisplay.inches || rawDisplay.sizeInches || "";
                            if (size && inches) return `${size} (${inches})`;
                            if (size) return size;
                          }
                          return "Display Info";
                        })();
                        const processorSummary =
                          device.specs?.processor ||
                          device.processor ||
                          device.performance?.processor ||
                          "Processor Info";
                        const cameraMp =
                          parseFirstInt(device.specs?.rearCameraResolution) ||
                          getRearCameraMp(device) ||
                          50;
                        const cameraSummary = `${cameraMp} MP Camera`;
                        const batteryCapacity = getBatteryMah(device);
                        const batterySummary = `${
                          batteryCapacity || "5000"
                        } mAh Battery`;
                        const formatGbLabel = (value, fallback) => {
                          const normalized = parseFirstInt(value);
                          if (normalized) return `${normalized} GB`;
                          const raw = String(value || "").trim();
                          return raw || fallback;
                        };
                        const ramValue = formatGbLabel(
                          device.specs?.ram,
                          "8 GB",
                        );
                        const storageValue = formatGbLabel(
                          device.specs?.storage,
                          "256 GB",
                        );
                        const memorySummary = `${ramValue} | ${storageValue}`;
                        const specHighlights = [
                          {
                            label: "Memory",
                            value: memorySummary,
                            Icon: FaMemory,
                          },
                          {
                            label: "Camera",
                            value: cameraSummary,
                            Icon: FaMobileAlt,
                          },
                          {
                            label: "Battery",
                            value: batterySummary,
                            Icon: FaBatteryFull,
                          },
                          {
                            label: "Chipset",
                            value: processorSummary,
                            Icon: FaRobot,
                          },
                        ];
                        const formatStorePrice = (price) => {
                          if (
                            price == null ||
                            price === "" ||
                            price === "NaN"
                          ) {
                            return "";
                          }
                          const numeric = extractNumericPrice(price);
                          if (numeric > 0)
                            return `₹ ${numeric.toLocaleString("en-IN")}`;
                          const raw = String(price).trim();
                          return raw.startsWith("₹") ? raw : `₹ ${raw}`;
                        };
                        const variantOptions = Array.isArray(
                          device.variantOptions,
                        )
                          ? device.variantOptions
                          : [];
                        const selectedVariantId = String(
                          device.selectedVariantId ?? "",
                        );
                        const renderVariantSelector = (
                          mode = "desktop",
                          className = "",
                        ) => {
                          if (variantOptions.length <= 1) return null;

                          const isCompact = mode === "compact";
                          const isMobile = mode === "mobile";
                          const wrapperSpacing = isCompact
                            ? "mt-2"
                            : isMobile
                              ? "mt-3"
                              : "mt-5";
                          const labelClass =
                            isCompact || isMobile
                              ? "mb-2 block text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500 sm:text-xs"
                              : "mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500";
                          const gridClass =
                            isCompact || isMobile
                              ? "grid grid-cols-2 gap-1.5"
                              : "grid gap-2 sm:grid-cols-2";

                          return (
                            <div
                              className={`${wrapperSpacing} ${className}`}
                              onClick={(event) => event.stopPropagation()}
                            >
                              <span className={labelClass}>Select variant</span>
                              <div className={gridClass}>
                                {variantOptions.map((option) => {
                                  const isSelected =
                                    String(option.variantId) ===
                                      selectedVariantId ||
                                    option.variantIndex ===
                                      device.selectedVariantIndex;
                                  const baseClass = isCompact
                                    ? "flex min-h-11 min-w-0 items-center justify-between gap-1 rounded-lg px-3 text-left text-xs font-extrabold transition"
                                    : isMobile
                                      ? "flex min-h-11 min-w-0 items-center justify-between gap-1 rounded-lg px-3 text-left text-[11px] font-bold transition sm:text-xs"
                                      : "flex min-h-11 items-center justify-between rounded-xl px-4 text-left text-sm font-bold transition";
                                  const selectedClass = isCompact
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-blue-600 text-white";
                                  const idleClass = isCompact
                                    ? "bg-slate-100 text-slate-600 hover:bg-slate-100"
                                    : "bg-slate-100 text-slate-700 hover:bg-slate-100";

                                  return (
                                    <button
                                      key={`${device.id}-variant-${option.variantId}`}
                                      type="button"
                                      aria-pressed={isSelected}
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        const productKey =
                                          getSmartphoneProductKey(device);
                                        if (!productKey) return;
                                        setSelectedVariantByProduct((prev) => ({
                                          ...prev,
                                          [productKey]: option.variantId,
                                        }));
                                      }}
                                      className={`${baseClass} ${
                                        isSelected ? selectedClass : idleClass
                                      }`}
                                    >
                                      <span className="min-w-0 truncate">
                                        {option.label}
                                      </span>
                                      {isSelected ? (
                                        <span
                                          className={`grid shrink-0 place-items-center rounded-full text-[8px] ${
                                            isCompact
                                              ? "h-5 w-5 bg-blue-600 text-white"
                                              : "h-6 w-6 bg-white/20 text-white"
                                          }`}
                                          aria-hidden="true"
                                        >
                                          ✓
                                        </span>
                                      ) : null}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        };
                        const renderSpecScore = (compact = false) => (
                          <MobilesXSpecScore
                            score={scoreValue}
                            compact={compact}
                          />
                        );

                        const renderStoreRows = (compact = false) => (
                          <div
                            className={compact ? "space-y-1.5" : "space-y-2"}
                          >
                            {priceRowsForDisplay.map((storePrice, i) => {
                              const storeObj =
                                storePrice.storeObj ||
                                (getStore
                                  ? getStore(
                                      storePrice.store ||
                                        storePrice.store_name ||
                                        storePrice.storeName ||
                                        "",
                                    )
                                  : null);
                              const storeNameCandidate =
                                storePrice.display_store_name ||
                                storePrice.store ||
                                storePrice.store_name ||
                                storePrice.storeName ||
                                storeObj?.name ||
                                "";
                              const ctaText = storePrice.cta_label || "Buy Now";
                              const rawLogoSrc =
                                storePrice.logo ||
                                (storeNameCandidate
                                  ? getStoreLogo
                                    ? getStoreLogo(storeNameCandidate)
                                    : getLogo(storeNameCandidate)
                                  : null) ||
                                device.brandLogo ||
                                null;
                              const logoSrc = normalizeAssetUrl(rawLogoSrc);
                              const priceLabel = formatStorePrice(
                                storePrice.price,
                              );

                              return (
                                <div
                                  key={`${
                                    device.id ?? device.model ?? ""
                                  }-${compact ? "mobile-" : ""}price-${i}`}
                                  className={`flex items-center justify-between gap-2 bg-white ${
                                    compact
                                      ? "min-h-12 rounded-lg px-2.5 py-2"
                                      : "min-h-14 rounded-lg px-3 py-2"
                                  }`}
                                >
                                  <div className="flex min-w-0 items-center gap-2">
                                    {logoSrc ? (
                                      <div
                                        className={`flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white ${
                                          compact ? "h-8 w-8" : "h-9 w-9"
                                        }`}
                                      >
                                        <img
                                          src={logoSrc}
                                          alt={
                                            storeObj?.name || storeNameCandidate
                                          }
                                          className="h-full w-full object-contain"
                                        />
                                      </div>
                                    ) : (
                                      <div
                                        className={`flex shrink-0 items-center justify-center rounded-lg bg-blue-50 ${
                                          compact ? "h-8 w-8" : "h-9 w-9"
                                        }`}
                                      >
                                        <FaStore className="text-[9px] text-slate-400" />
                                      </div>
                                    )}
                                    <span
                                      className={`truncate font-semibold text-slate-700 ${
                                        compact
                                          ? "max-w-28 text-[11px] sm:text-xs"
                                          : "text-xs sm:text-sm"
                                      }`}
                                    >
                                      {storeNameCandidate || "Online Store"}
                                    </span>
                                  </div>
                                  <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
                                    <span
                                      className={`whitespace-nowrap font-extrabold text-emerald-600 ${
                                        compact
                                          ? "text-[11px] sm:text-xs"
                                          : "text-sm"
                                      }`}
                                    >
                                      {priceLabel}
                                    </span>
                                    {storePrice.url ? (
                                      <a
                                        href={storePrice.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(event) =>
                                          event.stopPropagation()
                                        }
                                        className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md bg-blue-600 font-bold text-white transition hover:bg-blue-700 ${
                                          compact
                                            ? "min-h-9 px-3 text-[10px] sm:text-[11px]"
                                            : "min-h-9 px-3 py-2 text-[10px] sm:text-xs"
                                        }`}
                                      >
                                        {ctaText || "Buy Now"}
                                        <FaExternalLinkAlt className="text-[8px]" />
                                      </a>
                                    ) : (
                                      <span
                                        className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md bg-slate-200 font-bold text-slate-500 ${
                                          compact
                                            ? "min-h-9 px-3 text-[10px] sm:text-[11px]"
                                            : "min-h-9 px-3 py-2 text-[10px] sm:text-xs"
                                        }`}
                                      >
                                        {ctaText || "Unavailable"}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                        return (
                          <div
                            key={`${device.id ?? device.model ?? ""}-${_idx}`}
                            onClick={(e) => handleView(device, e)}
                            className={` mx-auto h-auto w-full cursor-pointer overflow-hidden rounded-2xl bg-transparent transition duration-200 md:h-full                 ${
                              isCompareSelected(device) ? "bg-blue-50/50" : ""
                            }`}
                          >
                            <div className="flex h-auto flex-col p-0 md:h-full">
                              <div className="hidden">
                                <div className="min-w-0 flex-1">
                                  <h3 className="text-2xl font-black text-slate-950">
                                    {device.name || device.model}
                                  </h3>
                                </div>

                                <div className="shrink-0">
                                  {cardPriceLabel ? (
                                    <div className="text-right">
                                      {isUpcomingCard ? (
                                        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                          {upcomingPriceEyebrow}
                                        </div>
                                      ) : null}
                                      <div className="text-2xl font-black text-slate-950">
                                        {cardPriceLabel}
                                      </div>
                                    </div>
                                  ) : null}
                                </div>
                              </div>

                              <div className="hidden">
                                <div className="flex items-center">
                                  {renderSpecScore()}
                                </div>

                                {hasLaunchDate ? (
                                  <div className="flex items-center gap-1.5 text-sm text-slate-700 sm:justify-end">
                                    <FaCalendarAlt className="text-slate-400" />
                                    <span>
                                      {launchDateLabel}:{" "}
                                      <span className="font-semibold text-slate-900">
                                        {launchDateText}
                                      </span>
                                    </span>
                                  </div>
                                ) : null}
                              </div>

                              <div className="hidden">
                                <div className="smartphone-card-media relative flex min-h-[560px] items-center justify-center overflow-hidden border-r border-slate-200/70 bg-gradient-to-b from-blue-50 to-slate-50 p-8">
                                  {cardBadgeLabel ? (
                                    <span className="smartphone-card-ai-badge absolute left-6 top-6 z-10 inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1.5 text-xs font-bold text-white">
                                      <FaRobot aria-hidden="true" />
                                      {cardBadgeLabel}
                                    </span>
                                  ) : null}
                                  <ImageCarousel
                                    images={device.images}
                                    fallbackTitle={
                                      isUpcomingCard ? "" : "No image"
                                    }
                                    fallbackSubtitle={
                                      isUpcomingCard
                                        ? device.brand || "Launch image coming"
                                        : "Image coming soon"
                                    }
                                    fallbackLogo={brandLogoSrc}
                                    altText={
                                      device.name ||
                                      device.model ||
                                      "Smartphone"
                                    }
                                  />
                                </div>

                                <div className="min-w-0 p-6 xl:p-8">
                                  <div className="flex items-start justify-between gap-6 border-b border-slate-200/80 pb-5">
                                    <div className="min-w-0">
                                      {device.brand ? (
                                        <p className="mb-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-blue-700">
                                          {device.brand}
                                        </p>
                                      ) : null}
                                      <h3 className="text-3xl font-black tracking-[-0.045em] text-slate-950 xl:text-4xl">
                                        {device.name || device.model}
                                      </h3>
                                      {hasLaunchDate ? (
                                        <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 [&_svg]:text-slate-400 [&_strong]:font-bold [&_strong]:text-slate-700">
                                          <FaCalendarAlt />
                                          <span>
                                            {launchDateLabel}:{" "}
                                            <strong>{launchDateText}</strong>
                                          </span>
                                        </div>
                                      ) : null}
                                      <div className="mt-2 text-xs text-slate-500">
                                        Market status:{" "}
                                        <span className="font-bold text-slate-700">
                                          {marketStatusLabel}
                                        </span>
                                      </div>
                                    </div>
                                    {cardPriceLabel ? (
                                      <div className="shrink-0 text-right">
                                        <strong className="block text-2xl font-black tracking-tight text-slate-950">
                                          {cardPriceLabel}
                                        </strong>
                                        <span className="mt-1 block text-[10px] font-semibold text-slate-500">
                                          {isUpcomingCard
                                            ? upcomingPriceEyebrow
                                            : "Starting price"}
                                        </span>
                                      </div>
                                    ) : null}
                                  </div>

                                  <div className="mt-4 grid grid-cols-[150px_minmax(0,1fr)] gap-3">
                                    <div className="flex items-center justify-center rounded-xl bg-blue-50 p-3">
                                      {renderSpecScore()}
                                    </div>
                                    <div className="grid min-w-0 grid-cols-4 gap-2">
                                      {specHighlights.map(
                                        ({ label, value, Icon }) => (
                                          <div
                                            className="flex min-w-0 flex-col items-center justify-center rounded-xl bg-slate-50 px-2 py-3 text-center"
                                            key={`desktop-${label}`}
                                          >
                                            <span className="mb-2 grid h-8 w-8 place-items-center rounded-xl bg-blue-50 text-xs text-blue-600">
                                              <Icon />
                                            </span>
                                            <strong className="w-full break-words text-xs font-bold leading-4 text-slate-800">
                                              {value}
                                            </strong>
                                            <small className="mt-1 text-[9px] font-bold uppercase tracking-wide text-slate-400">
                                              {label}
                                            </small>
                                          </div>
                                        ),
                                      )}
                                    </div>
                                  </div>

                                  {renderVariantSelector("desktop")}

                                  {availableOnText ? (
                                    <div className="mt-4 flex items-center gap-1.5 text-sm text-slate-700">
                                      <FaCalendarAlt className="text-slate-400" />
                                      <span>
                                        Available on:{" "}
                                        <span className="font-semibold text-slate-900">
                                          {availableOnText}
                                        </span>
                                      </span>
                                    </div>
                                  ) : null}

                                  {priceRowsForDisplay.length > 0 ? (
                                    <div className="mt-5 rounded-xl bg-slate-50 p-3">
                                      <div className="mb-2 flex items-center justify-between gap-3 px-1">
                                        <span className="inline-flex items-center gap-2 text-xs font-bold text-slate-800 [&_svg]:text-emerald-500">
                                          <FaStore />
                                          {pricePanelTitle}
                                        </span>
                                        <span className="text-[9px] font-semibold text-slate-400">
                                          Best prices · Trusted stores
                                        </span>
                                      </div>
                                      {renderStoreRows(false)}
                                    </div>
                                  ) : null}
                                </div>
                              </div>

                              <div className="flex-1">
                                <div className="grid grid-cols-[116px_minmax(0,1fr)] gap-3 p-3 sm:grid-cols-[136px_minmax(0,1fr)] sm:gap-4 sm:p-4 xl:grid-cols-[148px_minmax(0,1fr)]">
                                  <div className="smartphone-card-media relative flex min-h-[190px] items-center justify-center overflow-hidden rounded-xl bg-gradient-to-b from-blue-50 via-white to-slate-50 p-2 sm:min-h-[210px] xl:min-h-[226px]    ">
                                    {cardBadgeLabel ? (
                                      <span className="smartphone-card-ai-badge absolute left-2 top-2 z-10 inline-flex max-w-[110px] items-center gap-1 truncate rounded-full bg-blue-600 px-2.5 py-1 text-[8px] font-bold text-white sm:max-w-[124px] sm:text-[9px]">
                                        <FaRobot aria-hidden="true" />
                                        {cardBadgeLabel}
                                      </span>
                                    ) : null}
                                    <ImageCarousel
                                      images={device.images}
                                      fallbackTitle=""
                                      fallbackSubtitle=""
                                      fallbackLogo={brandLogoSrc}
                                      compact
                                      priority={_idx < 4}
                                      altText={
                                        device.name ||
                                        device.model ||
                                        "Smartphone"
                                      }
                                    />
                                  </div>

                                  <div className="min-w-0 pt-0.5">
                                    {device.brand ? (
                                      <p className="truncate text-[10px] font-extrabold uppercase tracking-[0.14em] text-blue-700 sm:text-[11px]">
                                        {device.brand}
                                      </p>
                                    ) : null}
                                    <h3 className="mt-1 line-clamp-2 text-base font-black leading-5 tracking-tight text-slate-950 sm:text-lg sm:leading-6 xl:text-xl xl:leading-7">
                                      {device.name || device.model}
                                    </h3>

                                    <div className="mt-2 flex flex-wrap items-center gap-2">
                                      {renderSpecScore(true)}
                                    </div>

                                    <div className="mt-2 space-y-1 text-[11px] font-semibold text-slate-500 sm:text-xs">
                                      <div>
                                        Market status:{" "}
                                        <span className="font-bold text-slate-700">
                                          {marketStatusLabel}
                                        </span>
                                      </div>
                                      {hasLaunchDate ? (
                                        <div className="flex items-center gap-1.5">
                                          <FaCalendarAlt className="text-slate-400" />
                                          <span>
                                            {launchDateLabel}:{" "}
                                            <span className="font-bold text-slate-700">
                                              {launchDateText}
                                            </span>
                                          </span>
                                        </div>
                                      ) : null}
                                    </div>

                                    {cardPriceLabel ? (
                                      <div className="mt-3 text-xl font-black leading-none tracking-tight text-slate-950 sm:text-2xl">
                                        {cardPriceLabel}
                                      </div>
                                    ) : null}
                                  </div>
                                </div>

                                <div className="mx-2.5 grid grid-cols-4 divide-x divide-slate-200/70 overflow-hidden rounded-xl bg-slate-50 sm:mx-3">
                                  {specHighlights.map(
                                    ({ label, value, Icon }) => (
                                      <div
                                        className="flex min-w-0 flex-col items-center px-1 py-2 text-center sm:px-2 sm:py-2.5"
                                        key={`mobile-${label}`}
                                      >
                                        <span className="mb-1 grid h-7 w-7 place-items-center rounded-lg bg-blue-50 text-[9px] text-blue-600 sm:h-8 sm:w-8 sm:text-[10px]">
                                          <Icon />
                                        </span>
                                        <small className="text-[8px] font-bold uppercase tracking-[0.04em] text-slate-500 sm:text-[9px]">
                                          {label}
                                        </small>
                                        <strong className="mt-1 line-clamp-3 w-full break-words text-[9px] font-bold leading-[11px] text-slate-800 sm:text-[10px] sm:leading-[12px]">
                                          {value}
                                        </strong>
                                      </div>
                                    ),
                                  )}
                                </div>

                                <div className="px-2.5 pb-2.5 sm:px-3 sm:pb-3">
                                  {renderVariantSelector("mobile")}

                                  {availableOnText ? (
                                    <div className="mt-3 flex items-center gap-1.5 text-[10px] text-slate-600">
                                      <FaCalendarAlt className="text-slate-400" />
                                      <span>
                                        Available on:{" "}
                                        <span className="font-semibold text-slate-900">
                                          {availableOnText}
                                        </span>
                                      </span>
                                    </div>
                                  ) : null}

                                  {priceRowsForDisplay.length > 0 ? (
                                    <div className="mt-3 rounded-xl bg-slate-50 p-2">
                                      <div className="mb-1.5 flex items-center justify-between gap-2 px-1">
                                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-800 sm:text-xs [&_svg]:text-emerald-500">
                                          <FaStore />
                                          {pricePanelTitle}
                                        </span>
                                        <span className="text-[9px] font-semibold text-slate-400 sm:text-[10px]">
                                          Best prices
                                        </span>
                                      </div>
                                      {renderStoreRows(true)}
                                    </div>
                                  ) : null}
                                </div>
                              </div>

                              <div className="smartphone-card-footer mt-1 flex min-h-10 items-center justify-between gap-2 px-3 py-2 md:mt-auto xl:min-h-12 xl:px-4 xl:py-3">
                                <label
                                  className={`flex cursor-pointer items-center gap-2 ${compareDisabled ? "cursor-not-allowed opacity-50" : ""}`}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <input
                                    type="checkbox"
                                    checked={compareSelected}
                                    disabled={
                                      compareDisabled ||
                                      (!compareSelected &&
                                        compareItems.length >=
                                          effectiveCompareLimit)
                                    }
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) =>
                                      handleCompareToggle(device, e)
                                    }
                                    className="h-4 w-4 appearance-none rounded border border-slate-300 bg-white transition-all duration-200 checked:border-emerald-600 checked:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-1 disabled:cursor-not-allowed"
                                  />
                                  <span className="text-sm font-semibold text-slate-700">
                                    Compare
                                  </span>
                                </label>
                                <span className="inline-flex items-center gap-1 text-sm font-bold text-blue-700">
                                  View full details <FaChevronRight />
                                </span>
                              </div>
                            </div>
                            <div className="hidden" />
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Floating Compare Bar - Appears when 2+ items selected */}
                  {compareItems.length >= 2 && (
                    <div className="fixed bottom-6 left-4 right-4 z-40 max-w-sm rounded-2xl bg-white p-4 md:bottom-8 md:left-auto md:right-8">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {compareItems.length} devices selected
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            Ready to compare specifications
                          </p>
                        </div>
                        <button
                          onClick={handleCompareNavigate}
                          className="flex-shrink-0 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-600 transition-all duration-200 whitespace-nowrap text-sm"
                        >
                          Compare Now
                        </button>
                      </div>
                    </div>
                  )}

                  {/* No Results State */}
                  {!loading && sortedVariants.length === 0 && (
                    <div className="rounded-3xl bg-white py-16 text-center transition-all duration-300">
                      <div className="max-w-md mx-auto">
                        <FaSearch className="mx-auto mb-4 text-5xl text-slate-300" />
                        <h3 className="mb-3 text-2xl font-semibold text-slate-900">
                          No smartphones found
                        </h3>
                        <p className="mb-6 text-slate-600">
                          {shouldHideInteractiveFilters
                            ? "No smartphones are available in this price range right now. Try browsing the full smartphone collection for more options."
                            : "Try adjusting your filters to find what you're looking for. We have a wide range of devices available."}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                          <button
                            onClick={clearFilters}
                            className="rounded-lg bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 px-6 py-3 font-semibold text-white transition-all duration-300 hover:from-blue-700 hover:to-blue-600 hover:shadow-lg hover:-translate-y-0.5"
                          >
                            {shouldHideInteractiveFilters
                              ? "Browse All Smartphones"
                              : "Clear All Filters"}
                          </button>
                          {!shouldHideInteractiveFilters ? (
                            <button
                              onClick={() => setShowFilters(true)}
                              className="rounded-lg border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition-all duration-300 hover:border-slate-400 hover:bg-slate-50 hover:shadow-md"
                            >
                              Adjust Filters
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Results Footer */}
                  {sortedVariants.length > 0 && (
                    <div className="mt-8 border-t border-slate-200 pt-6">
                      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="text-sm text-slate-500">
                          {shouldShowAllMatches
                            ? `Showing all ${sortedVariants.length} options`
                            : `Showing ${visibleResultsStart}-${visibleResultsEnd} of ${sortedVariants.length} options`}
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-end">
                          {!shouldShowAllMatches && totalPages > 1 ? (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  handlePageChange(currentPageSafe - 1)
                                }
                                disabled={currentPageSafe === 1}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Previous
                              </button>
                              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                                Page {currentPageSafe} of {totalPages}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  handlePageChange(currentPageSafe + 1)
                                }
                                disabled={currentPageSafe === totalPages}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Next
                              </button>
                            </div>
                          ) : null}
                          <button
                            onClick={() =>
                              window.scrollTo({ top: 0, behavior: "smooth" })
                            }
                            className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 10l7-7m0 0l7 7m-7-7v18"
                              />
                            </svg>
                            Back to top
                          </button>
                          <div className="rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-500">
                            Last updated: Today
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 text-center text-xs text-slate-500">
                        <p>
                          Prices and availability are subject to change. Always
                          verify details with the respective stores before
                          making a purchase.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {!isUpcomingFilterPath && sortedVariants.length > 1 ? (
                <PopularMobileComparisonsStrip
                  devices={sortedVariants}
                  className="mt-8"
                />
              ) : null}

              <LatestNewsRouteSection className="mt-6" />

              <MobilePhoneHighlights
                devices={baseDevices}
                className="mt-6"
                context={
                  isUpcomingFilterPath
                    ? "upcoming"
                    : isNewFilterPath
                      ? "latest"
                      : "default"
                }
              />

              <MobileSortSheet
                open={showSort}
                onClose={() => setShowSort(false)}
                onChange={setSortBy}
                options={SMARTPHONE_MOBILE_SORT_OPTIONS}
                sortBy={sortBy}
                subtitle="Arrange smartphones by preference"
              />

              {/* Responsive filter workspace */}
              <ProductFilterSheet
                open={showFilters}
                onClose={() => setShowFilters(false)}
                onReset={clearFilters}
                onApply={() => setShowFilters(false)}
                title="Filters"
                subtitle={
                  isUpcomingFilterPath
                    ? "Refine upcoming smartphones by launch signals"
                    : "Refine smartphones by specifications and features"
                }
                applyLabel="Apply filters"
                resultCount={filteredVariants.length}
                sections={filterSectionDefinitions}
                activeSection={openDesktopFilterSection}
                onSectionChange={setOpenDesktopFilterSection}
                desktopContent={
                  <div className="min-h-full">
                    {renderFilterSections(renderDesktopFilterPanel)}
                  </div>
                }
                selectedSummary={renderSelectedFiltersSummary()}
                mobileSections={buildMobileFilterSections()}
              />
            </section>
          </div>
        </div>
      </div>

      {!isUpcomingFilterPath && featuredDiscoveryProduct ? (
        <section className="mx-auto mt-8 w-full max-w-[1440px] px-3 pb-8 sm:mt-10 sm:px-6 sm:pb-12 md:pb-16 lg:px-8 lg:pb-20">
          <ProductDiscoverySections
            productId={featuredDiscoveryProduct.productId}
            currentBrand={
              currentBrandObj?.name || featuredDiscoveryProduct.brand || ""
            }
            entityType="smartphones"
            layout="latestPhones"
          />
        </section>
      ) : null}
    </div>
  );
};

export default Smartphones;
