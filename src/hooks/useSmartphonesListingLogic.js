import { useState, useEffect, useMemo } from "react";
import {
  FaStar,
  FaBatteryFull,
  FaMemory,
  FaWifi,
  FaShieldAlt,
  FaRobot,
  FaShoppingBag,
  FaMobileAlt,
  FaExchangeAlt,
  FaPlus,
  FaHeart,
  FaCamera,
  FaMicrochip,
  FaGamepad,
  FaRocket,
  FaChartLine,
} from "react-icons/fa";
import { useDevice } from "./useDevice";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  fetchSmartphones,
  fetchTrendingSmartphones,
  fetchNewLaunchSmartphones,
  fetchUpcomingSmartphones,
} from "../store/deviceSlice";
import useStoreLogos from "./useStoreLogos";
import {
  createNewsStoryPath,
  usePublicNewsFeed,
} from "./usePublicNews";
import { generateSlug } from "../utils/slugGenerator";
import useDeviceFieldProfiles from "./useDeviceFieldProfiles";
import { resolveDeviceFieldProfile } from "../utils/deviceFieldProfiles";
import { resolveSmartphoneBadgeScore } from "../utils/smartphoneBadgeScore";
import {
  createCollectionSchema,
  createItemListSchema,
} from "../utils/schemaGenerators";
import { buildListSeoKeywords } from "../utils/seoKeywordBuilder";
import { normalizeSeoTitle } from "../utils/seoTitle";
import {
  computePopularSmartphoneFeatures,
  SMARTPHONE_FEATURE_CATALOG,
} from "../utils/smartphonePopularFeatures";
import {
  buildPublicSmartphoneListingPath as buildSmartphoneListingPath,
  getSmartphoneFeatureRouteMeta,
  normalizeSmartphoneListingSlug,
  stripSmartphoneSeoQueryParams,
} from "../utils/smartphoneListingRoutes";
import { buildCanonicalComparePathFromDevices } from "../utils/compareRoutes";
import { toCanonicalPagePath } from "../utils/publicUrl";
import { isPublishedProduct } from "../utils/publishedProducts";
import { sendDeferredProductView } from "../utils/deferredAnalytics";

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
const SITE_ORIGIN = "https://tryhook.shop";

export default function useSmartphonesListingLogic({ onlyUpcoming = false } = {}) {
 // Add animation styles
  const animationStyles = `
    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(100%);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    .animate-slide-up {
      animation: slideUp 0.3s ease-out forwards;
    }
  `;

  const deviceContext = useDevice();
  const deviceFieldProfiles = useDeviceFieldProfiles();
  const { smartphone, smartphoneAll } = deviceContext || {};
  const location = useLocation();
  const navigate = useNavigate();
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
  const listFilter = normalizedFilterSlug;
  const isUpcomingView =
    Boolean(onlyUpcoming) ||
    normalizedFilterSlug === "upcoming" ||
    listFilter === "upcoming";
  const normalizedBrandSlug = normalizeSmartphoneListingSlug(
    routeBrandSlug || legacyBrandParam || "",
  );
  const normalizedFeature = normalizeSmartphoneListingSlug(
    routeFeatureSlug || legacyFeatureParam || "",
  );

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
        const res = await fetch(
          "https://api.apisphere.in/api/public/popular-features?deviceType=smartphone&days=7&limit=16",
          controller ? { signal: controller.signal } : undefined,
        );
        if (!res.ok) return;
        const data = await res.json();
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

  const isListFilter = listFilter === "trending" || listFilter === "new";
  const usesDedicatedRouteFeed = isListFilter || isUpcomingView;
  const smartphonesForList = useMemo(() => {
    if (isUpcomingView) {
      return Array.isArray(smartphone) ? smartphone : [];
    }
    if (isListFilter) {
      const list = Array.isArray(smartphone) ? smartphone : [];
      return list.length ? list : phonesForFeatureList;
    }
    return phonesForFeatureList;
  }, [isUpcomingView, isListFilter, smartphone, phonesForFeatureList]);

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
    if (isUpcomingView) dispatch(fetchUpcomingSmartphones());
    else if (listFilter === "trending") dispatch(fetchTrendingSmartphones());
    else if (listFilter === "new") dispatch(fetchNewLaunchSmartphones());
    else if (!smartphoneAll || smartphoneAll.length === 0)
      dispatch(fetchSmartphones());
  }, [
    isUpcomingView,
    listFilter,
    dispatch,
    smartphoneAll ? smartphoneAll.length : 0,
  ]);

  // Normalize legacy query-based brand/feature routes into the canonical path shape.
  useEffect(() => {
    const hasLegacySeoQueryRoute =
      !normalizedFilterSlug &&
      (Boolean(legacyBrandParam) || Boolean(legacyFeatureParam));
    const hasSeoListingRoute =
      Boolean(routeBrandSlug) || Boolean(routeFeatureSlug) || hasLegacySeoQueryRoute;

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

  // When route filters change, scroll back to top so the
  // user immediately sees the updated cards.
  useEffect(() => {
    try {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      // ignore scroll errors (SSR / old browsers)
    }
  }, [normalizedBrandSlug, normalizedFeature, listFilter]);

  const { getLogo, getStore, getStoreLogo } = useStoreLogos();

  // Helper function to extract numeric price
  const extractNumericPrice = (price) => {
    if (!price || price === "NaN") return 0;
    const numeric = parseInt(String(price).replace(/[^0-9]/g, ""));
    return isNaN(numeric) ? 0 : numeric;
  };

  const parseDateValue = (value) => {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
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

  const normalizeSaleStatus = (value) => {
    if (!value) return null;
    const text = String(value).trim().toLowerCase();
    if (!text) return null;
    if (/(pre[-\s]?order|pre[-\s]?book|prebooking|presale)/i.test(text))
      return "preorder";
    if (/(sale[\s_-]?scheduled|scheduled)/i.test(text))
      return "sale_scheduled";
    if (/(sale[\s_-]?started|started)/i.test(text)) return "sale_started";
    if (/(store[\s_-]?pending|store[\s_-]?listing[\s_-]?pending)/i.test(text))
      return "store_pending";
    if (/(on sale|in stock|sale live|live)/i.test(text)) return "on_sale";
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
      if (Array.isArray(variant?.storePrices)) rows.push(...variant.storePrices);
      else if (Array.isArray(variant?.store_prices))
        rows.push(...variant.store_prices);
    });

    return rows.filter(Boolean);
  };

  const hasLiveStoreSignal = (store) => {
    if (!store || typeof store !== "object") return false;
    if (isPrebookingStore(store)) return false;

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
    if (/(live|on sale|in stock|available|buy now|shop now)/i.test(availabilityText))
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
    const allowCompare = typeof allowCompareRaw === "boolean" ? allowCompareRaw : false;
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
    const explicitLaunchStage = normalizeLaunchStatus(
      device.launchStatus ||
        device.launch_status ||
        device.launchStatusOverride ||
        device.launch_status_override ||
        device.launchStatusText ||
        device.launch_status_text ||
        device.status ||
        device.availability ||
        device.badge,
    );
    const saleStage = resolveSaleStage(device);
    const saleStartDate = resolveSaleStartDate(device);
    const storeRows = getDeviceStoreRows(device);
    const storeStage = String(device.storeStage || device.store_stage || "")
      .trim()
      .toLowerCase();
    const hasLiveStore = storeRows.some(hasLiveStoreSignal) || storeStage === "live";
    const hasPrebookingStore =
      storeRows.some(isPrebookingStore) || storeStage === "prebooking";
    const now = Date.now();

    if (
      saleStage === "preorder" ||
      saleStage === "sale_scheduled" ||
      saleStage === "store_pending" ||
      saleStage === "sale_tbd"
    ) {
      return "upcoming";
    }

    if (saleStage === "sale_started" || saleStage === "on_sale") {
      return "available";
    }

    if (saleStartDate) {
      if (saleStartDate.getTime() > now) return "upcoming";
      return "available";
    }

    if (hasPrebookingStore) return "upcoming";
    if (hasLiveStore) return "available";

    if (explicitLaunchStage) {
      if (explicitLaunchStage === "released") {
        return "upcoming";
      }
      return explicitLaunchStage;
    }

    return "upcoming";
  };

  const resolveSaleStage = (device) => {
    if (!device) return "sale_tbd";
    return (
      normalizeSaleStatus(device.saleStatus || device.sale_status) ||
      normalizeSaleStatus(device.saleStatusText || device.sale_status_text) ||
      normalizeSaleStatus(device.availabilityStatus || device.availability_status) ||
      "sale_tbd"
    );
  };

  const resolveStoreStage = (device) => {
    if (!device) return "none";
    const storeRows = getDeviceStoreRows(device);
    if (storeRows.some(hasLiveStoreSignal)) return "live";
    if (storeRows.some(isPrebookingStore)) {
      return "prebooking";
    }
    if (storeRows.some(hasStoreMarketSignal)) return "listed";
    return "none";
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

  const isPrebookingStore = (storePrice) => {
    if (!storePrice) return false;
    if (storePrice.is_prebooking === true) return true;
    const storeStatusText = String(
      storePrice.availability_status ??
        storePrice.availabilityStatus ??
        storePrice.sale_status ??
        storePrice.saleStatus ??
        "",
    )
      .trim()
      .toLowerCase();
    if (
      /(pre(book|order)|upcoming|coming\s*soon|not[\s_-]*started|pre[\s-]*sale)/i.test(
        storeStatusText,
      )
    ) {
      return true;
    }

    const ctaText = String(storePrice.cta_label || "").trim();
    if (/^(pre(book|order)|coming\s*soon)$/i.test(ctaText)) return true;

    return false;
  };

  const isUpcomingDevice = (device) => {
    if (!device) return false;
    const stage = resolveLaunchStage(device);
    if (stage === "rumored" || stage === "announced" || stage === "upcoming")
      return true;
    return false;
  };

  const getUpcomingBadge = (device) => {
    if (!device) return null;
    if (!isUpcomingDevice(device)) return null;

    const stage = resolveLaunchStage(device);
    if (stage === "rumored") return "Rumored";
    if (stage === "announced") return "Announced";
    if (stage === "available" || stage === "released") return null;

    if (device.is_prebooking) return "Coming Soon";

    const storePrices = Array.isArray(device.storePrices)
      ? device.storePrices
      : [];
    if (storePrices.some((store) => isPrebookingStore(store))) {
      return "Coming Soon";
    }

    return "Upcoming";
  };

  const sortStoreRows = (stores = []) =>
    [...stores].sort(
      (a, b) => extractNumericPrice(a?.price) - extractNumericPrice(b?.price),
    );

  const getAvailabilityState = (
    stores,
    brandName,
  ) => {
    const normalizedStores = (Array.isArray(stores) ? stores : []).map(
      (store) => {
        const prebooking = isPrebookingStore(store);
        return {
          ...store,
          is_prebooking: prebooking || store?.is_prebooking === true,
          cta_label:
            store?.cta_label ||
            (prebooking || store?.is_prebooking === true
              ? "Coming Soon"
              : "Buy Now"),
        };
      },
    );

    if (normalizedStores.length === 0) {
      return { stores: [], hiddenCount: 0, mode: "none" };
    }

    const hasStoreUrl = (value) => Boolean(String(value || "").trim());
    const liveStores = sortStoreRows(
      normalizedStores.filter(
        (store) => !store.is_prebooking && hasStoreUrl(store?.url),
      ),
    );
    if (liveStores.length > 0) {
      return {
        stores: liveStores,
        hiddenCount: Math.max(liveStores.length - 3, 0),
        mode: "live",
      };
    }

    const prebookingStores = sortStoreRows(
      normalizedStores.filter((store) => store.is_prebooking),
    );
    if (prebookingStores.length === 0) {
      return {
        stores: sortStoreRows(normalizedStores),
        hiddenCount: Math.max(normalizedStores.length - 3, 0),
        mode: "fallback",
      };
    }

    return {
      stores: prebookingStores.map((store) => ({
        ...store,
        display_store_name:
          store.display_store_name || store.store_name || brandName || "Store",
        store: store.store || store.store_name || brandName || "Store",
        store_name: store.store_name || store.store || brandName || "Store",
        storeName: store.storeName || store.store_name || store.store || "",
        logo: normalizeAssetUrl(store.logo || null),
        cta_label: "Coming Soon",
        is_prebooking: true,
      })),
      hiddenCount: Math.max(prebookingStores.length - 3, 0),
      mode: "prebooking",
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
    const profileResult = resolveDeviceFieldProfile(
      "smartphone",
      apiDevice,
      deviceFieldProfiles,
    );
    const profileDisplay = profileResult.display_display || {};

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
                is_prebooking:
                  sp.is_prebooking === true || sp.isPrebooking === true,
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
            is_prebooking:
              sp.is_prebooking === true || sp.isPrebooking === true,
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

    const overallScoreRaw = toNumber(
      apiDevice.spec_score_v2 ??
        apiDevice.specScoreV2 ??
        apiDevice.overall_score_v2 ??
        apiDevice.overallScoreV2 ??
        apiDevice.spec_score ??
        apiDevice.specScore ??
        apiDevice.overall_score ??
        apiDevice.overallScore,
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
        toString(apiDevice.official_preorder_url),
        toString(apiDevice.officialPreorderUrl),
        toString(apiDevice.brand_website),
        toString(apiDevice.brandWebsite),
        toString(apiDevice.brand_url),
        toString(apiDevice.brandUrl),
        "",
      ),
      officialPreorderUrl: pick(
        toString(apiDevice.official_preorder_url),
        toString(apiDevice.officialPreorderUrl),
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
      is_prebooking:
        apiDevice.is_prebooking === true ||
        apiDevice.isPrebooking === true ||
        /(pre(book|order)|upcoming|coming\s*soon|not[\s_-]*started|pre[\s-]*sale)/i.test(
          String(
            apiDevice.availability_status ??
              apiDevice.availabilityStatus ??
              apiDevice.sale_status ??
              apiDevice.saleStatus ??
              "",
          ).trim(),
        ),
      spec_score: overallScoreRaw,
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
        overallScoreDisplay != null
          ? overallScoreDisplay
          : overallScoreRaw,
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
      field_profile: profileResult,
    };
    baseDevice.launchStatus = resolveLaunchStage(baseDevice);
    baseDevice.saleStatus = resolveSaleStage(baseDevice);
    baseDevice.storeStatus = resolveStoreStage(baseDevice);
    if (!isSpecScoreAllowed(baseDevice)) {
      baseDevice.allowSpecScore = false;
      baseDevice.spec_score = null;
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

  // Build variant-level cards so each variant (ram/storage) gets its own card
  const variantCards = useMemo(() => {
    return devices.flatMap((device) => {
      const vars =
        Array.isArray(device.variants) && device.variants.length
          ? device.variants
          : [];

      if (vars.length === 0) {
        // fallback: create a single card representing the device
        return [{ ...device, id: `${device.id}-default` }];
      }

      return vars.map((v, variantIndex) => {
        // map store prices for this variant (if any)
        const rawVariantStorePrices = Array.isArray(v.store_prices)
          ? v.store_prices
          : [];
        // Map variant-level store prices (keep original price strings)
        const mappedVariantStores = rawVariantStorePrices.map((sp) => {
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
            // leave logo resolution to render-time via getLogo(store)
            price: sp.price,
            url: sp.url || sp.url_link || sp.link,
            cta_label: sp.cta_label || sp.ctaLabel || null,
            availability_status:
              sp.availability_status || sp.availabilityStatus || null,
            sale_start_date:
              sp.sale_start_date || sp.saleStartDate || sp.sale_date || null,
            sale_date: sp.sale_date || sp.saleDate || null,
            is_prebooking:
              sp.is_prebooking === true || sp.isPrebooking === true,
            logo: normalizeAssetUrl(
              sp.logo || sp.store_logo || sp.storeLogo || null,
            ),
          };
        });

        // Variant base numeric price (if provided)
        const variantBaseNumeric = extractNumericPrice(
          v.base_price || v.basePrice || v.base,
        );

        // 1) Preferred: lowest numeric price among this variant's store_prices
        const variantStoreNumericPrices = mappedVariantStores
          .map((p) => extractNumericPrice(p.price))
          .filter((n) => n > 0);
        const lowestVariantStorePrice =
          variantStoreNumericPrices.length > 0
            ? Math.min(...variantStoreNumericPrices)
            : 0;

        // 2) Price resolution per requirements:
        // First -> lowestVariantStorePrice, Second -> variantBaseNumeric, Third -> device.numericPrice
        let resolvedNumericPrice = 0;
        if (lowestVariantStorePrice > 0)
          resolvedNumericPrice = lowestVariantStorePrice;
        else if (variantBaseNumeric > 0)
          resolvedNumericPrice = variantBaseNumeric;
        else if (device.numericPrice > 0)
          resolvedNumericPrice = device.numericPrice;

        const priceDisplay =
          resolvedNumericPrice > 0
            ? `₹ ${resolvedNumericPrice.toLocaleString()}`
            : "";

        // Store prices to expose on card: prefer mappedVariantStores when available, else an empty list
        const storePricesToExpose =
          mappedVariantStores.length > 0 ? mappedVariantStores : [];

        // RAM and Storage must come from variant (per requirement)
        const variantRam = v.ram || v.RAM || "";
        const variantStorage =
          v.storage || v.storage_capacity || v.ROM || v.rom || "";

        // Card title in strict format: {device name} - {variant RAM} / {variant Storage} - {price or N/A}
        const cardTitle = `${device.name || device.model || "Unnamed"} - ${variantRam || ""} / ${variantStorage || ""} - ${priceDisplay}`;
        const variantSaleStartDate =
          v.sale_start_date ||
          v.saleStartDate ||
          v.sale_date ||
          v.saleDate ||
          v.first_sale_date ||
          v.firstSaleDate ||
          device.saleStartDate ||
          null;
        const variantIsPrebooking =
          v.is_prebooking === true ||
          v.isPrebooking === true ||
          String(
            v.availability_status || v.availabilityStatus || "",
          ).toLowerCase() === "prebooking" ||
          device.is_prebooking === true;

        return {
          // keep device-level info but override ram/storage/price and add cardTitle
          ...device,
          id: `${device.id}-${
            v.variant_id ?? v.id ?? v.variantId ?? `v${variantIndex}`
          }`,
          variantIndex,
          variant: v,
          specs: {
            ...device.specs,
            ram: variantRam || device.specs.ram,
            storage: variantStorage || device.specs.storage,
          },
          storePrices: storePricesToExpose,
          price: priceDisplay,
          numericPrice: resolvedNumericPrice,
          saleStartDate: variantSaleStartDate,
          is_prebooking: variantIsPrebooking,
          cardTitle,
        };
      });
    });
  }, [devices, getStore]);

  // Unique filter lists derived from all variants
  const uniqueRams = [
    ...new Set(allVariants.map((v) => v?.ram).filter(Boolean)),
  ];
  const uniqueStorage = [
    ...new Set(allVariants.map((v) => v?.storage).filter(Boolean)),
  ];
  const uniqueColors = [
    ...new Set(
      allVariants
        .map((v) => v?.color_name || v?.color_name || v?.color || v?.colorName)
        .filter(Boolean),
    ),
  ];

  // Sort ram and storage options (numeric-aware)
  uniqueRams.sort(
    (a, b) =>
      parseInt(String(a).replace(/[^0-9]/g, "")) -
      parseInt(String(b).replace(/[^0-9]/g, "")),
  );
  const parseStorageValue = (s) => {
    if (!s) return 0;
    const str = String(s).toUpperCase();
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

  // Helper functions for individual options
  const extractIndividualRamOptions = (devices) => {
    const allRamValues = devices.flatMap((device) => {
      const ram = device.specs.ram;
      if (!ram) return [];

      // Split values like "8GB/12GB" into ["8GB", "12GB"]
      const individualRams = ram.split("/").map((r) => r.trim());
      return individualRams.filter((ram) => ram && ram !== "NaN");
    });

    // Remove duplicates and sort by numeric value
    const uniqueRams = [...new Set(allRamValues)].sort((a, b) => {
      const numA = parseInt(a.replace(/[^0-9]/g, ""));
      const numB = parseInt(b.replace(/[^0-9]/g, ""));
      return numA - numB;
    });

    return uniqueRams.length > 0
      ? uniqueRams
      : ["4GB", "6GB", "8GB", "12GB", "16GB"];
  };

  const extractIndividualStorageOptions = (devices) => {
    const allStorageValues = devices.flatMap((device) => {
      const storage = device.specs.storage;
      if (!storage) return [];

      // Split values like "128GB/256GB" into ["128GB", "256GB"]
      const individualStorages = storage.split("/").map((s) => s.trim());
      return individualStorages.filter(
        (storage) => storage && storage !== "NaN",
      );
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
      : ["64GB", "128GB", "256GB", "512GB", "1TB"];
  };

  // Get individual options (use variant-derived unique lists)
  const ramOptions =
    uniqueRams.length > 0 ? uniqueRams : extractIndividualRamOptions(devices);
  const storageOptions =
    uniqueStorage.length > 0
      ? uniqueStorage
      : extractIndividualStorageOptions(devices);
  const colorOptions = uniqueColors;

  // Battery ranges (fixed)
  const BATTERY_RANGES = [
    {
      id: "3000-4000",
      label: "3000 - 4000 mAh",
      min: 3000,
      max: 4000,
      icon: FaBatteryFull,
    },
    {
      id: "4000-5000",
      label: "4000 - 5000 mAh",
      min: 4000,
      max: 5000,
      icon: FaBatteryFull,
    },
    {
      id: "5000-6000",
      label: "5000 - 6000 mAh",
      min: 5000,
      max: 6000,
      icon: FaBatteryFull,
    },
    {
      id: "more",
      label: "More than 6000 mAh",
      min: 6000,
      max: Infinity,
      icon: FaBatteryFull,
    },
  ];

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

  const getCameraOptions = (devices) => {
    // collect numeric camera counts (ignore unknown/0)
    const counts = devices
      .map((d) => {
        const c = d.specs.cameraCount;
        const n = Number(c);
        return Number.isFinite(n) && n > 0 ? Math.max(0, Math.floor(n)) : null;
      })
      .filter((v) => v !== null);

    // map to labels and dedupe
    const labels = counts.map((n) => (n >= 4 ? "4+" : String(n)));
    const unique = [...new Set(labels)];

    // sort numeric labels ascending, with "4+" at the end
    unique.sort((a, b) => {
      if (a === "4+") return 1;
      if (b === "4+") return -1;
      return parseInt(a, 10) - parseInt(b, 10);
    });
    return unique;
  };

  const processorOptions = getProcessorOptions(devices);
  const refreshRateOptions = getRefreshRateOptions(devices);
  const cameraOptions = getCameraOptions(devices);
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

  const [filters, setFilters] = useState({
    brand: [],
    priceRange: { min: MIN_PRICE, max: MAX_PRICE },
    ram: [],
    storage: [],
    color: [],
    battery: [],
    processor: [],
    network: [],
    refreshRate: [],
    camera: [],
    launchStatus: [],
    userRating: [],
  });

  const [sortBy, setSortBy] = useState("featured");
  const [searchQuery, setSearchQuery] = useState("");
  const [brandFilterQuery, setBrandFilterQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [showHeroDescription, setShowHeroDescription] = useState(false);
  const [showAllDesktopBrands, setShowAllDesktopBrands] = useState(false);
  const [desktopExpandedFilters, setDesktopExpandedFilters] = useState({});
  const [compareItems, setCompareItems] = useState([]);
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
    String(search || "").replace(/^\?+/, "").trim(),
  );
  const isSingleSmartphonePath = pathname === "/smartphone";
  const isNewFilterPath = listFilter === "new";
  const currentYear = new Date().getFullYear();
  const currentMonthYear = new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
  }).format(new Date());
  const currentDayMonthYear = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
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

  let seoTitle = `Smartphones (${currentYear}) - Price, Specifications and Features in India - Hooks`;
  let seoDescription = sanitizeDescription(
    "Browse the latest smartphones on Hooks with updated prices, key specifications, and featured launches. Use filters to explore brands, budgets, and performance tiers in one place.",
  );
  const featureHeroText = currentFeatureMeta
    ? `Browse smartphones focused on ${currentFeatureMeta.name.toLowerCase()} and compare how different brands approach this feature across budget, mid-range, and flagship models. This page helps you review battery life, charging behavior, display quality, chipset efficiency, camera tradeoffs, RAM, storage, and software support so you can shortlist phones that suit your needs without opening multiple product pages. Use the feature cards to spot the models that stand out, then open the listings that match your priority.`
    : "";

  if (isUpcomingView) {
    seoTitle = `Upcoming Smartphones (${currentDayMonthYear}) - Expected Launches, Features and Prices - Hooks`;
    seoDescription =
      "Browse upcoming smartphones in India, track expected launch timelines, compare preview specifications, and watch preorder-ready devices before they arrive on Hooks.";
  } else if (isSingleSmartphonePath) {
    seoTitle = `Smartphones (${currentYear}) - Price, Specifications and Features in India - Hooks`;
    seoDescription =
      "Browse the latest smartphones on Hooks. Explore detailed specifications, prices, reviews, and featured launches before you buy.";
  } else if (isNewFilterPath) {
    seoTitle = `Latest Smartphones (${currentDayMonthYear}) - Full Specifications, Features and Price - Hooks`;
    seoDescription =
      "Browse the latest smartphones across camera, battery, display, and performance with updated prices, full specifications, and launch details on Hooks.";
  } else if (currentFeatureMeta) {
    const featureContextParts = [
      currentBrandObj?.name ? `${currentBrandObj.name}` : "",
      currentFeatureMeta.name,
      "Smartphones",
      seoPriceFilterLabel,
    ].filter(Boolean);
    const featureContext = featureContextParts.join(" ");
    const featureLabel = currentFeatureMeta.name.toLowerCase();
    const featureDescription = currentFeatureMeta.description
      ? `${currentFeatureMeta.description.toLowerCase()}`
      : featureLabel;

    seoTitle = `${featureContext} (${currentMonthYear}) - Prices, Specs & Comparison - Hooks`;
    seoDescription = sanitizeDescription(
      `Explore ${featureContext.toLowerCase()} in India with updated prices and detailed specifications covering battery camera display and performance comparisons on Hooks. Discover phones focused on ${featureDescription}.`,
    );
  } else if (priceFilter) {
    seoTitle = `Best Smartphones ${seoPriceFilterLabel} (${currentMonthYear}) - Full Specifications Features and Price - Hooks`;
    seoDescription = `Explore the best smartphones ${seoPriceFilterLabel.toLowerCase()} with detailed specs latest prices reviews and comparisons to choose the right phone for your budget.`;
  } else if (currentBrandObj) {
    seoTitle = `${currentBrandObj.name} Smartphones (${currentMonthYear}) - Full Specifications, Features and Price - Hooks`;
    seoDescription = sanitizeDescription(
      currentBrandObj.description ||
        `Explore ${currentBrandObj.name} smartphones on Hooks. Compare models, check prices, specifications, reviews, and find the best phone for your needs.`,
    );
  }
  // Heading label: prefer new launches, then price-filtered collection
  const isNewLaunchHeading =
    (location &&
      String(location.pathname || "")
        .toLowerCase()
        .includes("newlaunch")) ||
    listFilter === "new";
  const headerLabel = isUpcomingView
    ? "UPCOMING SMARTPHONES"
    : isNewLaunchHeading
      ? "LATEST SMARTPHONES"
      : currentFeatureMeta
        ? `${currentFeatureMeta.name.toUpperCase()} SMARTPHONES`
        : priceFilter
          ? `BEST SMARTPHONE ${priceFilter.label.toUpperCase()}`
          : "SMARTPHONE COLLECTION";
  const heroTitleText = isUpcomingView
    ? "Upcoming Smartphones"
    : isNewFilterPath
      ? "Latest Smartphones"
      : currentFeatureMeta
        ? `${currentFeatureMeta.name} Smartphones`
        : priceFilter
          ? `${priceFilter.label} Smartphones in India`
          : "Popular Mobile Phone";
  const isExpandedHeroDescriptionPath =
    isUpcomingView ||
    isNewFilterPath ||
    isListFilter ||
    Boolean(currentFeatureMeta) ||
    Boolean(priceFilter) ||
    pathname === "/smartphones" ||
    pathname === "/mobiles";
  const heroSubtitleText = isUpcomingView
    ? "Browse upcoming smartphones in India and keep track of devices that are expected to launch soon, all in one place. This page helps you follow new phone announcements, rumored launch windows, preorder-ready models, and early specification leaks without jumping between multiple news posts. Use it to scan expected camera setups, battery sizes, charging speeds, display details, chipset hints, storage variants, and brand lineups so you can plan your next upgrade with a clearer view of what is coming. Whether you are waiting for a flagship launch, a battery-focused phone, a gaming-ready model, or a balanced everyday device, the upcoming collection gives you an easy way to watch the next wave of releases as they build up. You can also use the filters and product cards to follow the brands and categories that matter most, then return later when launch details and prices are confirmed."
    : isNewFilterPath
      ? "Browse the latest smartphones in India and keep up with new launches as they arrive, all in one place. This page brings together updated prices, fresh variants, and the key specifications people care about most, including camera quality, low-light results, portrait shots, video stability, battery life, charging speed, display brightness, refresh rate, chipset performance, RAM, storage, software experience, and long-term update support. Use it to scan the newest phones from leading brands, spot which models are getting attention, and quickly narrow your shortlist without opening dozens of tabs. If you are looking for a flagship camera phone, a balanced all-rounder, a battery-first option, or a gaming-ready device, the latest collection helps you focus on the right candidates at a glance. The filters and product cards make it easy to sort by brand, price, and feature, while the latest-launch focus keeps the page current as new phones arrive. You can also check live prices, offers, and variants so you can judge value before you buy."
      : currentFeatureMeta
        ? featureHeroText
        : priceFilter || currentBrandObj
          ? seoDescription
          : "Browse popular mobile phones in India with updated prices, detailed specifications, launch timelines, and key highlights from leading brands. Use the filters to narrow phones by budget, features, network support, battery, RAM, storage, and refresh rate, then compare your shortlisted options faster and focus on the models that best match your daily needs and buying priorities.";
  const heroSubtitleStyle =
    isExpandedHeroDescriptionPath && !showHeroDescription
      ? {
          display: "-webkit-box",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: 2,
          overflow: "hidden",
        }
      : undefined;
  const heroContentWidthClass = shouldHideInteractiveFilters
    ? "max-w-5xl"
    : isExpandedHeroDescriptionPath
      ? "max-w-4xl"
      : "max-w-3xl";
  const heroTitleWidthClass = shouldHideInteractiveFilters
    ? "max-w-4xl"
    : "max-w-3xl";
  const heroSubtitleWidthClass = shouldHideInteractiveFilters
    ? "max-w-4xl"
    : isExpandedHeroDescriptionPath
      ? "max-w-4xl"
      : "max-w-3xl";
  const productColumnWidthClass = shouldHideInteractiveFilters
    ? "w-full max-w-5xl"
    : "flex-1";
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

  // Defer render check until after all Hooks are declared to keep Hooks order stable
  const noDataAndNotLoading =
    (!smartphonesForList ||
      (Array.isArray(smartphonesForList) && smartphonesForList.length === 0)) &&
    !loading;

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

    const ramArr = toArray(ramParam);
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
      const base = hasExplicitUrlFilters
        ? {
            ...prev,
            brand: [],
            priceRange: { min: MIN_PRICE, max: MAX_PRICE },
            ram: [],
            network: [],
            processor: [],
            refreshRate: [],
          }
        : prev;

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
      return areFilterStatesEqual(prev, next) ? prev : next;
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
      const ctx = contextFilters;
      setFilters((prev) => {
        try {
          if (JSON.stringify(prev) === JSON.stringify(ctx)) return prev;
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
      try {
        const hasCustomRange =
          prev &&
          prev.priceRange &&
          (Number(prev.priceRange.min) !== MIN_PRICE ||
            Number(prev.priceRange.max) !== MAX_PRICE);
        const hasDefaultRange =
          prev &&
          prev.priceRange &&
          Number(prev.priceRange.min) === MIN_PRICE &&
          Number(prev.priceRange.max) === MAX_PRICE;
        if (hasCustomRange) {
          return prev;
        }
        if (hasDefaultRange) return prev;
      } catch {
        // ignore and initialize
      }
      return { ...prev, priceRange: { min: MIN_PRICE, max: MAX_PRICE } };
    });
  }, [devices.length, contextFilters]);

  const handleView = (device, e, store) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const identifier = device.model || device.id;
    const variantId = device.variant?.variant_id ?? device.variant?.id ?? null;
    const storeId = store?.id ?? null;

    sendDeferredProductView(
      device.product_id ?? device.productId ?? device.id ?? identifier,
    );

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
    if (filterType === "brand") {
      const current = Array.isArray(filters.brand) ? filters.brand : [];
      const next = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];

      setFilters((prev) => ({ ...prev, brand: next }));

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
          ...(deviceContext.filters || {}),
          brand: next,
        });
      } catch {}
      return;
    }
    const currentArr = Array.isArray(filters[filterType])
      ? filters[filterType]
      : [];
    const nextArr = currentArr.includes(value)
      ? currentArr.filter((item) => item !== value)
      : [...currentArr, value];
    const next = { ...filters, [filterType]: nextArr };
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
    setFilters((prev) => ({ ...prev, priceRange: { min, max } }));
  };

  // Filter logic (operates on variant-level cards) - memoized so it updates
  // when device data, filters, searchQuery or feature change.
  const filteredVariants = useMemo(() => {
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
        const deviceRams = device.specs.ram
          ? device.specs.ram.split("/").map((r) => r.trim())
          : [];
        const hasMatchingRam = filters.ram.some((selectedRam) =>
          deviceRams.includes(selectedRam),
        );
        if (!hasMatchingRam) return false;
      }

      // Storage filter - check individual values
      if (filters.storage.length > 0) {
        const deviceStorages = device.specs.storage
          ? device.specs.storage.split("/").map((s) => s.trim())
          : [];
        const hasMatchingStorage = filters.storage.some((selectedStorage) =>
          deviceStorages.includes(selectedStorage),
        );
        if (!hasMatchingStorage) return false;
      }

      // Battery filter (ranges)
      if (filters.battery && filters.battery.length > 0) {
        const b = Number(device.numericBattery || 0);
        const matchesBattery = filters.battery.some((rangeId) => {
          const range = BATTERY_RANGES.find((r) => r.id === rangeId);
          if (!range) return false;
          return b >= range.min && b <= range.max;
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

      // Camera filter (by count)
      if (filters.camera && filters.camera.length > 0) {
        const count = Number(device.specs.cameraCount || 0);
        const hasCam = filters.camera.some((c) => {
          if (c === "4+") return count >= 4;
          return Number(c) === count;
        });
        if (!hasCam) return false;
      }

      if (filters.launchStatus && filters.launchStatus.length > 0) {
        const launchDate = device.launchDate ? new Date(device.launchDate) : null;
        const hasLaunchDate =
          launchDate && !Number.isNaN(launchDate.getTime());
        const daysSinceLaunch = hasLaunchDate
          ? (Date.now() - launchDate.getTime()) / (1000 * 60 * 60 * 24)
          : null;
        const matchesLaunch = filters.launchStatus.some((status) => {
          if (status === "Upcoming") return isUpcomingDevice(device);
          if (status === "New Launch") {
            return (
              hasLaunchDate &&
              daysSinceLaunch !== null &&
              daysSinceLaunch >= 0 &&
              daysSinceLaunch <= 120
            );
          }
          if (status === "Available") return !isUpcomingDevice(device);
          return true;
        });
        if (!matchesLaunch) return false;
      }

      if (filters.userRating && filters.userRating.length > 0) {
        const rawRating = Number(device.rating);
        const scoreRating = Number(resolveSmartphoneBadgeScore(device)) / 20;
        const effectiveRating = Number.isFinite(rawRating) && rawRating > 0
          ? rawRating
          : Number.isFinite(scoreRating)
            ? scoreRating
            : 0;
        const matchesRating = filters.userRating.some(
          (rating) => effectiveRating >= Number(rating),
        );
        if (!matchesRating) return false;
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

  const getPopularitySortValue = (card) => {
    const score = Number(resolveSmartphoneBadgeScore(card));
    const launchDate = card?.launchDate ? new Date(card.launchDate) : null;
    const launchTime =
      launchDate && !Number.isNaN(launchDate.getTime())
        ? launchDate.getTime()
        : 0;
    const hasImage = normalizeAssetUrl(
      (Array.isArray(card?.images) ? card.images.find(Boolean) : "") ||
        card?.image ||
        "",
    )
      ? 1
      : 0;
    const price = Number(card?.numericPrice || 0);

    return (
      (Number.isFinite(score) ? score : 0) * 1000000 +
      hasImage * 100000 +
      Math.min(price, 250000) / 10 +
      Math.min(launchTime / 1000000000, 99999)
    );
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
        return getPopularitySortValue(b) - getPopularitySortValue(a);
    }
  });
  const totalPages = Math.max(
    1,
    Math.ceil(sortedVariants.length / SMARTPHONES_PER_PAGE),
  );
  const currentPageSafe = Math.min(currentPage, totalPages);
  const paginatedVariants = useMemo(() => {
    const startIndex = (currentPageSafe - 1) * SMARTPHONES_PER_PAGE;
    return sortedVariants.slice(startIndex, startIndex + SMARTPHONES_PER_PAGE);
  }, [currentPageSafe, sortedVariants]);
  const visibleVariants = shouldShowAllMatches
    ? sortedVariants
    : paginatedVariants;
  const visibleResultsStart = sortedVariants.length
    ? shouldShowAllMatches
      ? 1
      : (currentPageSafe - 1) * SMARTPHONES_PER_PAGE + 1
    : 0;
  const visibleResultsEnd = sortedVariants.length
    ? shouldShowAllMatches
      ? sortedVariants.length
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
          isUpcomingView ? "upcoming smartphones" : "",
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
      isUpcomingView,
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
      camera: [],
      launchStatus: [],
      userRating: [],
    };
    setFilters(empty);
    try {
      deviceContext?.setFilters?.(empty);
    } catch {
      // ignore
    }
    setSearchQuery("");
    setBrandFilterQuery("");
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
    if (filters.camera && filters.camera.length) count += filters.camera.length;
    if (filters.launchStatus && filters.launchStatus.length)
      count += filters.launchStatus.length;
    if (filters.userRating && filters.userRating.length)
      count += filters.userRating.length;
    if (
      filters.priceRange &&
      (filters.priceRange.min > 0 || filters.priceRange.max < MAX_PRICE)
    )
      count += 1;
    return count;
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
      : "https://tryhook.shop";

  const toAbsoluteUrl = (value) => {
    const raw = normalizeAssetUrl(value);
    if (!raw) return "";
    if (/^(https?:|data:|blob:)/i.test(raw)) return raw;
    if (raw.startsWith("//")) return `https:${raw}`;
    return raw.startsWith("/") ? `${siteOrigin}${raw}` : `${siteOrigin}/${raw}`;
  };

  const listOgImage = useMemo(() => {
    const firstWithImage = sortedVariants.find((device) =>
      Array.isArray(device?.images) ? device.images.find(Boolean) : false,
    );
    const raw =
      firstWithImage?.images?.find(Boolean) || firstWithImage?.image || "";
    const abs = toAbsoluteUrl(raw);
    return abs || `${SITE_ORIGIN}/hook-logo.svg`;
  }, [sortedVariants, siteOrigin]);

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

  const { stories: desktopNewsStories } = usePublicNewsFeed({
    limit: 4,
    productType: "smartphone",
  });

  const desktopBrandCards = useMemo(() => {
    const byBrand = new Map();
    baseDevices.forEach((device) => {
      const brandName = String(device?.brand || "").trim();
      if (!brandName) return;
      const current = byBrand.get(brandName) || {
        name: brandName,
        count: 0,
        logo: "",
      };
      current.count += 1;
      current.logo =
        current.logo ||
        normalizeAssetUrl(
          device?.brandLogo ||
            device?.brandLogoUrl ||
            device?.brand_image ||
            device?.brand?.logo,
        );
      byBrand.set(brandName, current);
    });

    const preferred = [
      "Samsung",
      "OnePlus",
      "Apple",
      "vivo",
      "iQOO",
      "realme",
      "Xiaomi",
    ];
    const ordered = [
      ...preferred
        .map((name) => byBrand.get(name))
        .filter(Boolean),
      ...Array.from(byBrand.values()).filter(
        (brand) => !preferred.includes(brand.name),
      ),
    ];

    return ordered.slice(0, 7);
  }, [baseDevices]);

  const desktopPriceBuckets = [
    {
      label: "Under ₹10,000",
      subLabel: "72 phones",
      min: MIN_PRICE,
      max: 10000,
      to: buildSmartphoneListingPath({ query: { priceMax: 10000 } }),
    },
    {
      label: "₹10,000 - ₹15,000",
      subLabel: "64 phones",
      min: 10000,
      max: 15000,
      to: buildSmartphoneListingPath({
        query: { priceMin: 10000, priceMax: 15000 },
      }),
    },
    {
      label: "₹15,000 - ₹25,000",
      subLabel: "108 phones",
      min: 15000,
      max: 25000,
      to: buildSmartphoneListingPath({
        query: { priceMin: 15000, priceMax: 25000 },
      }),
    },
    {
      label: "₹25,000 - ₹40,000",
      subLabel: "96 phones",
      min: 25000,
      max: 40000,
      to: buildSmartphoneListingPath({
        query: { priceMin: 25000, priceMax: 40000 },
      }),
    },
    {
      label: "Above ₹40,000",
      subLabel: "138 phones",
      min: 40000,
      max: MAX_PRICE,
      to: buildSmartphoneListingPath({ query: { priceMin: 40000 } }),
    },
  ];

  const DESKTOP_PRICE_MAX = 65000;
  const desktopPriceRangeLabel =
    Number(filters.priceRange.max) >= DESKTOP_PRICE_MAX
      ? `₹ ${Number(filters.priceRange.min || 0).toLocaleString("en-IN")} - ₹65,000+`
      : currentPriceRangeLabel;

  const desktopHighlightCards = [
    { label: "Camera Phones", icon: FaCamera, feature: "high-camera" },
    {
      label: "Battery Phones",
      icon: FaBatteryFull,
      feature: "long-battery",
    },
    { label: "5G Phones", icon: FaWifi, query: { network: "5G" } },
    { label: "Gaming Phones", icon: FaGamepad, feature: "gaming" },
    { label: "New Launches", icon: FaRocket, to: "/smartphones/filter/new" },
    {
      label: "Upcoming Phones",
      icon: FaMobileAlt,
      to: "/smartphones/upcoming",
    },
    {
      label: "Trending Phones",
      icon: FaChartLine,
      to: "/smartphones/filter/trending",
    },
  ];

  const formatDesktopDate = (value) => {
    const parsed = value ? new Date(value) : null;
    if (!parsed || Number.isNaN(parsed.getTime())) return "";
    return parsed.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getDesktopImage = (device) =>
    normalizeAssetUrl(
      (Array.isArray(device?.images) ? device.images.find(Boolean) : "") ||
        device?.image ||
        "",
    );

  const desktopProductKey = (device) =>
    String(
      device?.product_id ??
        device?.productId ??
        device?.baseId ??
        device?.model ??
        device?.name ??
        device?.id ??
        "",
    )
      .trim()
      .toLowerCase();

  const desktopSortedProducts = useMemo(() => {
    const seen = new Set();
    return sortedVariants.filter((device) => {
      const key = desktopProductKey(device);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [sortedVariants]);

  const desktopVisibleProducts = shouldShowAllMatches
    ? desktopSortedProducts
    : desktopSortedProducts.slice(0, currentPageSafe * SMARTPHONES_PER_PAGE);

  const desktopHeroImages = [
    {
      src: "https://res.cloudinary.com/dyksxeshr/image/upload/v1780571145/gn1zjy4xfkecbogxqqxw.webp",
      alt: "Xiaomi 17T",
      className: "h-[94px] w-[96px]",
    },
    {
      src: "https://res.cloudinary.com/dyksxeshr/image/upload/v1776243242/kf7qdeh0dj0lhimugles.webp",
      alt: "OPPO F33 Pro 5G",
      className: "h-[118px] w-[118px]",
    },
    {
      src: "https://res.cloudinary.com/dyksxeshr/image/upload/v1774016310/q1ljq1jlwwxvhg10zxks.png",
      alt: "vivo T5x",
      className: "h-[84px] w-[78px]",
    },
  ];

  const getDesktopSpecs = (device) => {
    const displayRaw = device?.display || device?.specs?.display || {};
    const display =
      typeof displayRaw === "string"
        ? displayRaw.split("|")[0]?.trim()
        : displayRaw?.size ||
          displayRaw?.display_size ||
          displayRaw?.displaySize ||
          "Display";
    const processor =
      device?.specs?.processor ||
      device?.processor ||
      device?.performance?.processor ||
      "Processor";
    const ram = device?.specs?.ram || device?.ram || "RAM";
    const storage = device?.specs?.storage || device?.storage || "Storage";
    const cameraMp =
      parseFirstInt(device?.specs?.rearCameraResolution) ||
      getRearCameraMp(device) ||
      "";
    const batteryMah = getBatteryMah(device);

    return [
      { icon: FaMicrochip, label: processor },
      { icon: FaMemory, label: `${ram} | ${storage}` },
      { icon: FaCamera, label: cameraMp ? `${cameraMp}MP Rear Camera` : "Camera" },
      {
        icon: FaBatteryFull,
        label: batteryMah ? `${batteryMah} mAh Battery` : "Battery",
      },
      { icon: FaMobileAlt, label: display },
    ];
  };

  const mobileProductsPerPage = 3;
  const mobileVisibleProducts = shouldShowAllMatches
    ? desktopSortedProducts
    : desktopSortedProducts.slice(
        0,
        Math.max(mobileProductsPerPage, currentPageSafe * mobileProductsPerPage),
      );
  const mobileResultCountLabel = "1,248";

  const mobileHighlightCards = [
    { label: "Best Camera", icon: FaCamera, feature: "high-camera" },
    { label: "Battery", icon: FaBatteryFull, feature: "long-battery" },
    { label: "Gaming", icon: FaGamepad, feature: "gaming" },
    { label: "5G", icon: FaWifi, query: { network: "5G" } },
    { label: "AI", icon: FaRobot, feature: "ai-features" },
    { label: "New Launches", icon: FaRocket, to: "/smartphones/filter/new" },
    { label: "More", icon: FaPlus, to: "/smartphones" },
  ];

  const mobileActionCards = [
    [
      "Compare Phones",
      "Compare up to 4 smartphones side by side.",
      FaExchangeAlt,
      "Compare Now",
    ],
    [
      "Check Hook Score",
      "Our unique score to help you choose better phones.",
      FaShieldAlt,
      "Learn More",
    ],
    ["Expert Reviews", "In-depth reviews, tests and buying guides.", FaStar, "Read Reviews"],
    ["Shortlist & Save", "Shortlist your favorite phones and compare anytime.", FaHeart, "View Shortlist"],
  ];

  const mobileOfferCards = [
    ["amazon.in", "Up to ₹3,000 Off on selected smartphones", "₹37,999"],
    ["Flipkart", "Extra ₹2,000 Off on select bank cards", "₹37,999"],
    ["SAMSUNG", "Up to 15% Off on Samsung smartphones", "₹39,999"],
  ];

  const mobileActiveFilterLabels = [
    Number(filters.priceRange.min) !== MIN_PRICE ||
    Number(filters.priceRange.max) !== MAX_PRICE
      ? desktopPriceRangeLabel
      : "",
    ...filters.brand,
    ...filters.ram,
    ...filters.storage,
    ...filters.refreshRate,
  ]
    .filter(Boolean)
    .slice(0, 6);

  const mobileRecommendedProducts = desktopSortedProducts
    .slice(3, 8)
    .filter(Boolean);

  const desktopNewsItems =
    desktopNewsStories && desktopNewsStories.length
      ? desktopNewsStories.slice(0, 4).map((story) => ({
          title: story.title,
          image: story.image,
          meta: `${story.author || "TryHook"} • ${
            formatDesktopDate(story.publishedAt || story.updatedAt) || "Latest"
          }`,
          to: createNewsStoryPath(story.slug),
        }))
      : visibleVariants.slice(0, 4).map((device) => ({
          title: `${device.name || device.model || "Smartphone"} price, specs and offers updated`,
          image: getDesktopImage(device),
          meta: "TryHook • Latest",
          to: `/smartphones/${generateSlug(device.model || device.name || device.id)}-price-in-india`,
        }));

  const desktopPopularSearches = [
    "Best Camera Phones",
    "Best Battery Phones",
    "5G Phones",
    "Gaming Phones",
    "New Launches",
    "Upcoming Phones",
    "Phones under 20000",
    "Phones under 15000",
    "AMOLED Display Phones",
    "Snapdragon Phones",
  ];

  const toggleDesktopFilterGroup = (id) => {
    setDesktopExpandedFilters((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const desktopFilterSections = [
    {
      id: "ram",
      label: "RAM",
      values: ramOptions,
      getLabel: (value) => value,
    },
    {
      id: "storage",
      label: "Storage",
      values: storageOptions,
      getLabel: (value) => value,
    },
    {
      id: "refreshRate",
      label: "Display",
      values: refreshRateOptions,
      getLabel: (value) => value,
    },
    {
      id: "camera",
      label: "Camera",
      values: cameraOptions,
      getLabel: (value) => (value === "4+" ? "4+ Cameras" : `${value} Camera`),
    },
    {
      id: "battery",
      label: "Battery",
      values: BATTERY_RANGES.map((range) => range.id),
      getLabel: (value) =>
        BATTERY_RANGES.find((range) => range.id === value)?.label || value,
    },
    {
      id: "processor",
      label: "Processor",
      values: processorOptions,
      getLabel: (value) => value,
    },
    {
      id: "launchStatus",
      label: "Launch Status",
      values: ["Available", "New Launch", "Upcoming"],
      getLabel: (value) => value,
    },
    {
      id: "userRating",
      label: "User Rating",
      values: ["4.5", "4", "3.5"],
      getLabel: (value) => `${value}+ Rating`,
    },
  ].filter((section) => Array.isArray(section.values) && section.values.length > 0);
  return {
    addToHistory,
    allVariants,
    animationStyles,
    baseDevices,
    BATTERY_RANGES,
    brandFilterQuery,
    brands,
    cameraOptions,
    clearFilters,
    colorOptions,
    compareItems,
    compareLimit,
    contextFilters,
    currentBrandObj,
    currentDayMonthYear,
    currentFeatureMeta,
    currentMonthYear,
    currentPage,
    currentPageSafe,
    currentPriceRangeLabel,
    currentYear,
    DESKTOP_PRICE_MAX,
    desktopBrandCards,
    desktopExpandedFilters,
    desktopFilterSections,
    desktopHeroImages,
    desktopHighlightCards,
    desktopNewsItems,
    desktopNewsStories,
    desktopPopularSearches,
    desktopPriceBuckets,
    desktopPriceRangeLabel,
    desktopProductKey,
    desktopSortedProducts,
    desktopVisibleProducts,
    deviceContext,
    deviceFieldProfiles,
    devicePrices,
    devices,
    dispatch,
    extractIndividualRamOptions,
    extractIndividualStorageOptions,
    extractNumericPrice,
    featuredDiscoveryProduct,
    featureHeroText,
    filterBrand,
    filteredBrandOptions,
    filteredVariants,
    filters,
    filterSlug,
    formatDesktopDate,
    getActiveFiltersCount,
    getAiFeatureCount,
    getAvailabilityState,
    getBatteryMah,
    getCameraOptions,
    getCompareDeviceKey,
    getCompareLimitForDevices,
    getCompareLimitForStage,
    getCompareProductId,
    getCompareVariantIndex,
    getDesktopImage,
    getDesktopSpecs,
    getDeviceStoreRows,
    getFastChargeWatt,
    getFeatureSortValue,
    getIpRatingScore,
    getLogo,
    getMaxRamGb,
    getPopularitySortValue,
    getProcessorBrand,
    getProcessorOptions,
    getRearCameraMp,
    getRefreshRateHz,
    getRefreshRateOptions,
    getStore,
    getStoreLogo,
    getUpcomingBadge,
    getWirelessChargeWatt,
    handleCompareNavigate,
    handleCompareToggle,
    handleFilterChange,
    handleLikeToggle,
    handlePageChange,
    handleView,
    hasLiveStoreSignal,
    hasSearchParams,
    hasSpecScoreMarketSignal,
    hasStoreMarketSignal,
    hasUrlDrivenFilters,
    headerLabel,
    heroContentWidthClass,
    heroSubtitleStyle,
    heroSubtitleText,
    heroSubtitleWidthClass,
    heroTitleText,
    heroTitleWidthClass,
    isBudgetCollectionRoute,
    isCompareSelected,
    isDeviceLiked,
    isExpandedHeroDescriptionPath,
    isListFilter,
    isNewFilterPath,
    isNewLaunchHeading,
    isPrebookingStore,
    isSingleSmartphonePath,
    isSpecScoreAllowed,
    isUpcomingDevice,
    isUpcomingView,
    legacyBrandParam,
    legacyFeatureParam,
    likedItems,
    listFilter,
    listOgImage,
    listOgImageMeta,
    listRobots,
    listSchema,
    listSchemaItems,
    listSchemaUrl,
    loading,
    location,
    mapApiToDevice,
    MAX_PRICE,
    MIN_PRICE,
    mobileActionCards,
    mobileActiveFilterLabels,
    mobileHighlightCards,
    mobileOfferCards,
    mobileProductsPerPage,
    mobileRecommendedProducts,
    mobileResultCountLabel,
    mobileVisibleProducts,
    navigate,
    networkOptions,
    noDataAndNotLoading,
    normalizeAssetUrl,
    normalizedBrandSlug,
    normalizedFeature,
    normalizedFilterSlug,
    normalizedSeoTitle,
    normalizeLaunchStatus,
    normalizeSaleStatus,
    paginatedVariants,
    params,
    parseDateValue,
    parseFirstInt,
    parseMarketPriceValue,
    parseStorageValue,
    pathname,
    phonesForFeatureList,
    popularFeatureOrder,
    popularFeatureOrderLoaded,
    popularFeatures,
    priceFilter,
    priceFilterMap,
    processorOptions,
    productColumnWidthClass,
    ramOptions,
    refreshRateOptions,    resolveDevicePolicy,
    resolveLaunchStage,
    resolveSaleStage,
    resolveSaleStartDate,
    resolveStoreStage,
    routeBrandSlug,
    routeFeatureSlug,
    sanitizeDescription,
    search,
    searchQuery,
    selectDeviceById,
    selectDeviceByModel,
    seoDescription,
    seoKeywords,
    seoPriceFilterLabel,
    seoTitle,
    setBrandFilterQuery,
    setCompareItems,
    setCurrentPage,
    setDesktopExpandedFilters,
    setFeatureParam,
    setFilters,
    setLikedItems,
    setPopularFeatureOrder,
    setPopularFeatureOrderLoaded,
    setSearchQuery,
    setShowAllDesktopBrands,
    setShowFilters,
    setShowHeroDescription,
    setShowSort,
    setSortBy,
    shouldHideInteractiveFilters,
    shouldShowAllMatches,
    showAllDesktopBrands,
    showFilters,
    showHeroDescription,
    showSort,
    siteOrigin,
    smartphone,
    SMARTPHONE_MOBILE_SORT_OPTIONS,
    smartphoneAll,
    smartphonesForList,
    sortBy,
    sortedVariants,
    sortStoreRows,
    storageOptions,
    toAbsoluteUrl,
    toggleDesktopFilterGroup,
    toNumberOrNull,
    totalPages,
    trackFeatureClick,
    uniqueColors,
    uniqueRams,
    uniqueStorage,
    updatePriceRange,
    usesDedicatedRouteFeed,
    variantCards,
    visibleResultsEnd,
    visibleResultsStart,
    visibleVariants,
  };
}
