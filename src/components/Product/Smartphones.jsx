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
  FaSort,
  FaShoppingBag,
  FaCalendarAlt,
  FaMobileAlt,
  FaInfoCircle,
  FaChevronRight,
  FaExternalLinkAlt,
  FaExchangeAlt,
  FaPlus,
} from "react-icons/fa";
import { useDevice } from "../../hooks/useDevice";
import {
  useNavigate,
  useLocation,
  useParams,
} from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  fetchSmartphones,
  fetchTrendingSmartphones,
  fetchNewLaunchSmartphones,
} from "../../store/deviceSlice";
// BannerSlot disabled until completed.
import useStoreLogos from "../../hooks/useStoreLogos";
import Spinner from "../ui/Spinner";
import Breadcrumbs from "../Breadcrumbs";
import SEO from "../SEO";
import { generateSlug } from "../../utils/slugGenerator";
import useDeviceFieldProfiles from "../../hooks/useDeviceFieldProfiles";
import { resolveDeviceFieldProfile } from "../../utils/deviceFieldProfiles";
import { resolveSmartphoneBadgeScore } from "../../utils/smartphoneBadgeScore";
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
  buildSmartphoneListingPath,
  getSmartphoneFeatureRouteMeta,
  normalizeSmartphoneListingSlug,
  stripSmartphoneSeoQueryParams,
} from "../../utils/smartphoneListingRoutes";
import "../../styles/hideScrollbar.css";

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

const toSeoTextWithoutCommas = (value = "") => String(value || "").replace(/,/g, "");

// Enhanced Image Carousel - Simplified without counts/indicators
const ImageCarousel = ({ images = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const imageFrameClass =
    "h-44 w-32 sm:h-48 sm:w-32 lg:h-52 lg:w-36 rounded-2xl bg-gray-100 overflow-hidden flex items-center justify-center";
  const imageClass = "h-full w-full object-contain p-0.5 sm:p-2";

  useEffect(() => {
    setCurrentIndex(0);
  }, [images]);

  // If no images or single image, show static image
  if (!images || images.length === 0) {
    return (
      <div className="relative flex h-full w-full items-center justify-center">
        <div className={imageFrameClass}>
          <div className="text-center px-3">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-gray-200">
              <FaMobileAlt className="text-gray-400 text-sm" />
            </div>
            <span className="text-xs text-gray-500">No image</span>
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
            alt="product"
            className={imageClass}
            loading="lazy"
          />
        </div>
      </div>
    );
  }

  // Multiple images case - dots only
  return (
    <div className="relative h-full w-full">
      {/* Main Image */}
      <div className="flex h-full w-full items-center justify-center">
        <div className={`${imageFrameClass} relative`}>
          <img
            src={images[currentIndex]}
            alt={`product-view-${currentIndex + 1}`}
            className={imageClass}
            loading="lazy"
          />
          {/* Dots inside image frame */}
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
            <div className="flex items-center gap-1 rounded-full px-2">
              {images.map((_, index) => (
                <button
                  key={`dot-${index}`}
                  onClick={(e) => {
                    e?.stopPropagation();
                    setCurrentIndex(index);
                  }}
                  aria-label={`Go to image ${index + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-200 ${
                    currentIndex === index
                      ? "w-5 bg-blue-500"
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

const Smartphones = ({ onlyUpcoming = false } = {}) => {
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
  const smartphonesForList = useMemo(() => {
    if (isListFilter) {
      const list = Array.isArray(smartphone) ? smartphone : [];
      return list.length ? list : phonesForFeatureList;
    }
    return phonesForFeatureList;
  }, [isListFilter, smartphone, phonesForFeatureList]);
  const dispatch = useDispatch();

  useEffect(() => {
    if (listFilter === "trending") dispatch(fetchTrendingSmartphones());
    else if (listFilter === "new") dispatch(fetchNewLaunchSmartphones());
    else if (!smartphoneAll || smartphoneAll.length === 0)
      dispatch(fetchSmartphones());
  }, [listFilter, dispatch, smartphoneAll ? smartphoneAll.length : 0]);

  // Normalize legacy query-based brand/feature routes into the canonical path shape.
  useEffect(() => {
    const hasSeoListingRoute =
      Boolean(routeBrandSlug) ||
      Boolean(routeFeatureSlug) ||
      Boolean(legacyBrandParam) ||
      Boolean(legacyFeatureParam);

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

  const getCompareLimitForStage = (stage) => {
    if (stage === "rumored") return 0;
    if (stage === "announced") return 2;
    return 4;
  };

  const isSpecScoreAllowed = (stage) =>
    stage === "released" || stage === "available";

  const toNumberOrNull = (value) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  };

  const resolveDevicePolicy = (device) => {
    const stage = resolveLaunchStage(device);
    const allowCompareRaw =
      device?.allowCompare ?? device?.allow_compare ?? null;
    const allowCompare =
      typeof allowCompareRaw === "boolean"
        ? allowCompareRaw
        : stage !== "rumored";
    const allowSpecScore = isSpecScoreAllowed(stage);
    const compareLimitRaw = toNumberOrNull(
      device?.compareLimit ?? device?.compare_limit,
    );
    const compareLimit = allowCompare
      ? (compareLimitRaw ?? getCompareLimitForStage(stage))
      : 0;

    return {
      stage,
      allowCompare,
      compareLimit,
      allowSpecScore,
    };
  };

  const resolveSaleStartDate = (device) => {
    if (!device) return null;
    const direct =
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
    const override = normalizeLaunchStatus(
      device.launchStatus ||
        device.launch_status ||
        device.launchStatusOverride ||
        device.launch_status_override ||
        device.launchStatusText ||
        device.launch_status_text,
    );
    if (override) return override;

    const statusHint = normalizeLaunchStatus(
      device.status || device.availability || device.badge,
    );
    if (statusHint) return statusHint;

    const saleStart = resolveSaleStartDate(device);
    if (saleStart) return saleStart > new Date() ? "upcoming" : "available";

    const launch = parseDateValue(device.launchDate || device.launch_date);
    if (launch) return launch > new Date() ? "upcoming" : "released";

    return "released";
  };

  const getCompareLimitForDevices = (devices = []) =>
    (Array.isArray(devices) ? devices : []).reduce((limit, device) => {
      const policy = resolveDevicePolicy(device);
      const deviceLimit = Number.isFinite(policy.compareLimit)
        ? policy.compareLimit
        : limit;
      return Math.min(limit, deviceLimit);
    }, 4);

  const normalizeStoreKey = (value) =>
    String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

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

  const isPrebookingStore = (storePrice, launchDate = null) => {
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

    const saleStart =
      storePrice.sale_start_date ??
      storePrice.sale_date ??
      storePrice.saleStartDate ??
      null;
    const saleDate = parseDateValue(saleStart);
    if (saleDate && saleDate > new Date()) return true;

    const launch = parseDateValue(launchDate);
    if (launch && launch > new Date()) return true;

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
    if (
      storePrices.some((store) => isPrebookingStore(store, device.launchDate))
    ) {
      return "Coming Soon";
    }

    return "Upcoming";
  };

  const sortStoreRows = (stores = []) =>
    [...stores].sort(
      (a, b) => extractNumericPrice(a?.price) - extractNumericPrice(b?.price),
    );

  const getOfficialBrandStoreUrl = (stores, brandName, brandWebsite = null) => {
    const brandKey = normalizeStoreKey(brandName);
    const normalizedBrandWebsite = String(brandWebsite || "").trim();

    if (brandKey) {
      const matchingStore = (Array.isArray(stores) ? stores : []).find(
        (store) => {
          const storeName = normalizeStoreKey(
            store?.display_store_name ||
              store?.store ||
              store?.store_name ||
              store?.storeName,
          );
          if (!storeName || !String(store?.url || "").trim()) return false;

          return (
            storeName === brandKey ||
            storeName.includes(`${brandKey}store`) ||
            storeName.includes(`${brandKey}official`) ||
            storeName.includes(`official${brandKey}`)
          );
        },
      );
      if (matchingStore?.url) return matchingStore.url;
    }

    return normalizedBrandWebsite || null;
  };

  const getAvailabilityState = (
    stores,
    brandName,
    brandWebsite = null,
    launchDate = null,
    brandLogo = null,
    saleStartDate = null,
    deviceIsPrebooking = false,
    deviceStage = null,
    fallbackPrice = null,
  ) => {
    const now = new Date();
    const launch = parseDateValue(launchDate);
    const saleStart = parseDateValue(saleStartDate);
    const forcePrebooking =
      deviceIsPrebooking ||
      Boolean(
        (saleStart && saleStart > now) ||
        (!saleStart && launch && launch > now),
      );

    const normalizedStores = (Array.isArray(stores) ? stores : []).map(
      (store) => {
        const prebooking =
          forcePrebooking ||
          isPrebookingStore(store, saleStartDate || launchDate);
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
      if (deviceStage === "released") {
        const officialStoreUrl = getOfficialBrandStoreUrl(
          [],
          brandName,
          brandWebsite,
        );
        return {
          stores: [
            {
              id: "brand-store-fallback",
              store: brandName || "Brand Store",
              store_name: brandName || "Brand Store",
              display_store_name: brandName || "Brand Store",
              logo: normalizeAssetUrl(brandLogo || null),
              url: officialStoreUrl || "",
              cta_label: "Coming Soon",
              is_prebooking: true,
              price: fallbackPrice || null,
            },
          ],
          hiddenCount: 0,
          mode: "prebooking",
        };
      }
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

    const prebookingSignals =
      forcePrebooking || normalizedStores.some((store) => store.is_prebooking);
    const inferredPrebookingStores = prebookingSignals
      ? normalizedStores.filter((store) => store.is_prebooking)
      : [];

    const prebookingStores = sortStoreRows(inferredPrebookingStores);
    if (prebookingStores.length === 0) {
      const hasOnlineStore = normalizedStores.some((store) => {
        const name = String(
          store?.store_name || store?.store || store?.storeName || "",
        )
          .trim()
          .toLowerCase();
        return name && name !== "variant";
      });
      if (deviceStage === "released" && !hasOnlineStore) {
        const officialStoreUrl = getOfficialBrandStoreUrl(
          normalizedStores,
          brandName,
          brandWebsite,
        );
        const inferredPrices = normalizedStores
          .map((store) => extractNumericPrice(store?.price))
          .filter((price) => price > 0);
        const fallbackStorePrice =
          fallbackPrice ||
          (inferredPrices.length ? Math.min(...inferredPrices) : null);
        return {
          stores: [
            {
              id: "brand-store-fallback",
              store: brandName || "Brand Store",
              store_name: brandName || "Brand Store",
              display_store_name: brandName || "Brand Store",
              logo: normalizeAssetUrl(brandLogo || null),
              url: officialStoreUrl || "",
              cta_label: "Coming Soon",
              is_prebooking: true,
              price: fallbackStorePrice,
            },
          ],
          hiddenCount: 0,
          mode: "prebooking",
        };
      }
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
    const asText = (v) => {
      if (v == null) return "";
      if (typeof v === "string") return v.trim();
      if (typeof v === "number" || typeof v === "boolean") return String(v);
      return "";
    };
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

    // toString: safely convert various shapes to a usable string
    const toString = (v) => {
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
          if (k === "refresh_rate" || k === "refreshRate" || k === "hz")
            return formatHz(v[k]);
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
    };

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
        apiDevice.overallScore ??
        profileResult.score,
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
      launchStatusOverride: pick(
        toString(apiDevice.launch_status_override),
        toString(apiDevice.launchStatusOverride),
        toString(apiDevice.launch_status),
        toString(apiDevice.launchStatus),
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
        toString(apiDevice.sale_start_date),
        toString(apiDevice.saleStartDate),
        toString(apiDevice.sale_date),
        toString(apiDevice.saleDate),
        toString(apiDevice.first_sale_date),
        toString(apiDevice.firstSaleDate),
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
      Hookss_score: toNumber(
        apiDevice.Hookss_score ??
          apiDevice.HookssScore ??
          apiDevice.hook_score ??
          apiDevice.hookScore,
      ),
      spec_score: overallScoreRaw,
      overall_score: overallScoreRaw,
      overall_score_display:
        overallScoreDisplay != null
          ? overallScoreDisplay
          : mapScoreToDisplayBand(overallScoreRaw),
      buyer_intent: toNumber(apiDevice.buyer_intent ?? apiDevice.buyerIntent),
      trend_velocity: toNumber(
        apiDevice.trend_velocity ?? apiDevice.trendVelocity,
      ),
      freshness: toNumber(apiDevice.freshness),
      Hookss_calculated_at:
        apiDevice.Hookss_calculated_at ??
        apiDevice.HookssCalculatedAt ??
        apiDevice.hook_calculated_at ??
        apiDevice.hookCalculatedAt ??
        null,
      price: numericPrice > 0 ? `₹ ${numericPrice.toLocaleString()}` : "",
      numericPrice: numericPrice,
      rating: parseFloat(apiDevice.rating) || 0,
      reviews:
        apiDevice.reviews && typeof apiDevice.reviews === "number"
          ? `${apiDevice.reviews} reviews`
          : apiDevice.reviews || "",
      image: images[0] || "",
      images: images,
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
      launchDate: pick(
        toString(apiDevice.launch_date),
        toString(apiDevice.created_at),
        toString(apiDevice.createdAt),
        "",
      ),
      storePrices: storePrices,
      variants: variants,
      field_profile: profileResult,
    };
    baseDevice.launchStatus = resolveLaunchStage(baseDevice);
    if (!isSpecScoreAllowed(baseDevice.launchStatus)) {
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
  const devices = isUpcomingView
    ? baseDevices.filter((device) => isUpcomingDevice(device))
    : baseDevices;

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
  });

  const [sortBy, setSortBy] = useState("featured");
  const [searchQuery, setSearchQuery] = useState("");
  const [brandFilterQuery, setBrandFilterQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [showHeroDescription, setShowHeroDescription] = useState(false);
  const [compareItems, setCompareItems] = useState([]);
  const compareLimit = useMemo(
    () => getCompareLimitForDevices(compareItems),
    [compareItems],
  );

  // Brand-based SEO helper
  const filterBrand =
    normalizedBrandSlug ||
    (Array.isArray(filters?.brand) && filters.brand[0] ? filters.brand[0] : null);
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
    "above-50000": { min: 50000, max: MAX_PRICE, label: "Above ₹ 50,000" },
  };
  const priceFilter = priceFilterMap[normalizedFilterSlug] || null;
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
      selected?.name || fallbackMeta?.name || toFeatureSeoLabel(normalizedFeature),
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
      : priceFilter
        ? `BEST SMARTPHONE ${priceFilter.label.toUpperCase()}`
        : "SMARTPHONE COLLECTION";
  const heroTitleText = isUpcomingView
    ? "Upcoming Smartphones"
    : isNewFilterPath
      ? "Latest Smartphones"
    : priceFilter
      ? `${priceFilter.label} Smartphones in India`
      : "Browse Smartphones in India";
  const isExpandedHeroDescriptionPath =
    isUpcomingView ||
    isNewFilterPath ||
    pathname === "/smartphones" ||
    pathname === "/mobiles";
  const heroSubtitleText = isUpcomingView
    ? "Browse upcoming smartphones in India and keep track of devices that are expected to launch soon, all in one place. This page helps you follow new phone announcements, rumored launch windows, preorder-ready models, and early specification leaks without jumping between multiple news posts. Use it to scan expected camera setups, battery sizes, charging speeds, display details, chipset hints, storage variants, and brand lineups so you can plan your next upgrade with a clearer view of what is coming. Whether you are waiting for a flagship launch, a battery-focused phone, a gaming-ready model, or a balanced everyday device, the upcoming collection gives you an easy way to watch the next wave of releases as they build up. You can also use the filters and product cards to follow the brands and categories that matter most, then return later when launch details and prices are confirmed."
    : isNewFilterPath
      ? "Browse the latest smartphones in India and keep up with new launches as they arrive, all in one place. This page brings together updated prices, fresh variants, and the key specifications people care about most, including camera quality, low-light results, portrait shots, video stability, battery life, charging speed, display brightness, refresh rate, chipset performance, RAM, storage, software experience, and long-term update support. Use it to scan the newest phones from leading brands, spot which models are getting attention, and quickly narrow your shortlist without opening dozens of tabs. If you are looking for a flagship camera phone, a balanced all-rounder, a battery-first option, or a gaming-ready device, the latest collection helps you focus on the right candidates at a glance. The filters and product cards make it easy to sort by brand, price, and feature, while the latest-launch focus keeps the page current as new phones arrive. You can also check live prices, offers, and variants so you can judge value before you buy."
      : "Browse smartphones in India across brands, price ranges, launch windows, and performance tiers so you can quickly find a device that matches your budget and daily use. The collection brings updated prices, key specifications, ratings, and variant details together in one place, making it easier to check camera quality, low-light results, portrait shots, video stability, battery life, charging speed, display brightness, refresh rate, chipset performance, RAM, storage, software support, and long-term update value. Whether you are looking for a flagship camera phone, a balanced all-rounder, a battery-focused option, or a gaming-ready device, the page helps you scan what is new, what is popular, and what is worth shortlisting without opening multiple tabs. Use the filters, search, and product cards to narrow results by brand, budget, or feature, then open the phones that stand out most.";
  const heroSubtitleStyle =
    isExpandedHeroDescriptionPath && !showHeroDescription
      ? {
          display: "-webkit-box",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: 3,
          overflow: "hidden",
        }
      : undefined;
  const heroSubtitleWidthClass = isExpandedHeroDescriptionPath
    ? "max-w-6xl"
    : "max-w-3xl";
  useEffect(() => {
    if (isExpandedHeroDescriptionPath) {
      setShowHeroDescription(false);
    }
  }, [isExpandedHeroDescriptionPath]);
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
        if (
          hasCustomRange
        ) {
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

    const queryParams = new URLSearchParams();
    const deviceEntries = compareItems
      .map((device) => {
        const productId = getCompareProductId(device);
        if (productId == null) return null;
        const variantIndex = getCompareVariantIndex(device);
        return `${productId}:${variantIndex}`;
      })
      .filter(Boolean);

    if (deviceEntries.length === 0) return;

    queryParams.set("devices", deviceEntries.join(","));
    queryParams.set("type", "smartphone");

    navigate(`/compare?${queryParams.toString()}`, {
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

  const handleSortChange = (value) => {
    setSortBy(value);
    setShowSort(false);
    try {
      const params = new URLSearchParams(search);
      if (params.has("sort")) {
        params.delete("sort");
        const qs = params.toString();
        const path = `${location.pathname}${qs ? `?${qs}` : ""}`;
        navigate(path, { replace: true });
      }
    } catch {
      // ignore
    }
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
      const today = new Date();
      const parseDate = (s) => {
        if (!s) return null;
        const d = new Date(s);
        return Number.isNaN(d.getTime()) ? null : d;
      };

      const datedCards = variantCards.map((d) => ({
        device: d,
        date: parseDate(d.launchDate || d.launch_date),
      }));
      const hasValidDate = datedCards.some((item) => item.date);
      if (hasValidDate) {
        const released = datedCards.filter(
          (item) => item.date && item.date <= today,
        );
        const usable = released.length
          ? released
          : datedCards.filter((item) => item.date);
        usable.sort((a, b) => b.date - a.date);
        const noDate = datedCards.filter((item) => !item.date);
        baseCards = [
          ...usable.map((item) => item.device),
          ...noDate.map((item) => item.device),
        ];
      }
    }

    return baseCards.filter((device) => {
      // Search filter
      if (searchQuery) {
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
      navigate(buildSmartphoneListingPath({ query: params }), { replace: true });
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

  const listSchemaUrl = useMemo(() => {
    const basePath =
      normalizedBrandSlug || normalizedFeature
        ? buildSmartphoneListingPath({
            brand: normalizedBrandSlug,
            feature: normalizedFeature,
          })
        : location?.pathname || "/smartphones";
    return `${SITE_ORIGIN}${basePath}`;
  }, [location?.pathname, normalizedBrandSlug, normalizedFeature]);

  const listSchemaItems = useMemo(() => {
    const items = sortedVariants.slice(0, 20).map((device) => {
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
        url: `${SITE_ORIGIN}/smartphones/${slug}-price-in-india`,
        image,
      };
    });
    return items.filter(Boolean);
  }, [sortedVariants]);

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

  if (noDataAndNotLoading) return null;

  return (
    <div className="min-h-screen  text-slate-900" data-page-label={headerLabel}>
      <style>{animationStyles}</style>
      <SEO
        title={seoTitle}
        description={seoDescription}
        keywords={seoKeywords}
        image={listOgImageMeta}
        url={listSchemaUrl}
        robots="index, follow, max-image-preview:large"
        schema={listSchema}
      />
      {/* Main Content */}
      <div className="relative mx-auto max-w-7xl px-4 pt-0 pb-8 sm:px-6 sm:pb-12 md:pb-16 lg:px-8 lg:pb-20">
        <div className="relative">
          <section className="relative left-1/2 isolate w-screen -translate-x-1/2 overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950 px-4 py-6 text-white sm:px-6 sm:py-8 lg:px-8 lg:py-10">
            <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:72px_72px]" />
            <div className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute right-0 top-20 h-80 w-80 rounded-full bg-cyan-300/10 blur-3xl" />
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/10 to-transparent" />

            <div className="relative mx-auto max-w-7xl">
              <div className={isExpandedHeroDescriptionPath ? "max-w-6xl" : "max-w-4xl"}>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-100">
                  <FaMobileAlt className="h-3.5 w-3.5" />
                  {headerLabel}
                </span>

                <h1 className="mt-6 max-w-7xl text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
                  {heroTitleText}
                </h1>

                <h4
                  className={`mt-4 ${heroSubtitleWidthClass} text-base leading-7 text-white/80 sm:text-lg sm:leading-8`}
                  style={heroSubtitleStyle}
                >
                  {heroSubtitleText}
                </h4>

                {isExpandedHeroDescriptionPath ? (
                  <button
                    type="button"
                    onClick={() => setShowHeroDescription((prev) => !prev)}
                    className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-cyan-100 transition-colors duration-200 hover:text-white"
                    aria-expanded={showHeroDescription}
                  >
                    {showHeroDescription ? "Show less" : "Read more"}
                  </button>
                ) : null}

                <div className="mt-8 flex flex-wrap gap-3">
                  <button
                    onClick={() => navigate("/compare")}
                    className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition-colors duration-200 hover:bg-slate-100"
                  >
                    Compare devices
                    <FaExchangeAlt className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => navigate("/brands")}
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:border-white/25 hover:bg-white/15"
                  >
                    Browse brands
                    <FaChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="hidden  rounded-2xl border border-white/10 p-4 sm:p-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <FaFilter className="text-cyan-100" />
                    <h3 className="text-sm font-semibold text-white sm:text-base">
                      Popular Features
                    </h3>
                  </div>
                  {normalizedFeature && (
                    <button
                      onClick={() => setFeatureParam(null)}
                      className="text-xs font-semibold text-cyan-100 transition-colors duration-200 hover:text-white"
                    >
                      Clear
                    </button>
                  )}
                </div>
                {popularFeatureOrderLoaded && (
                  <p className="mb-3 text-xs text-white/60">
                    Popular choices from other users (last 7 days)
                  </p>
                )}
                <div className="flex gap-2.5 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {popularFeatures.map((pf) => {
                    const isActive = normalizedFeature === pf.id;
                    const Icon = pf.icon;
                    return (
                      <button
                        key={pf.id}
                        onClick={() => setFeatureParam(pf.id)}
                        className={`flex items-center gap-2 rounded-full border px-3 py-2 text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors duration-200 ${
                          isActive
                            ? "border-white bg-white text-slate-950"
                            : "border-white/10 bg-white/10 text-white hover:bg-white/15"
                        }`}
                      >
                        <span
                          className={
                            isActive ? "text-slate-950" : "text-cyan-100"
                          }
                        >
                          {Icon ? <Icon className="text-base" /> : null}
                        </span>
                        <span>{pf.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="hidden  rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
                {/* Desktop Search and Sort */}
                <div className="hidden items-center justify-between gap-4 lg:flex">
                  <div className="min-w-0 flex-1 max-w-4xl">
                    <div className="relative group">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                        <FaSearch className="text-cyan-100 transition-colors duration-200 group-focus-within:text-white" />
                      </div>
                      <input
                        type="text"
                        placeholder="Search smartphones by brand, model, or specifications..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-md border border-white/10 bg-white/10 pl-12 pr-4 py-3 text-sm text-white placeholder:text-white/50 transition-colors duration-200 focus:border-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-200/40 sm:text-base disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <FaSort className="text-cyan-100" />
                      <span className="text-sm text-white/75">Sort by:</span>
                    </div>
                    <div className="relative min-w-[200px]">
                      <select
                        value={sortBy}
                        onChange={(e) => handleSortChange(e.target.value)}
                        className="w-full cursor-pointer appearance-none rounded-md border border-white/10 bg-white/10 px-4 py-2.5 pr-10 text-white transition-colors duration-200 hover:border-white/20 focus:border-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-200/40"
                      >
                        <option value="featured" className="bg-slate-900">
                          Featured Devices
                        </option>
                        <option value="price-low" className="bg-slate-900">
                          Price: Low to High
                        </option>
                        <option value="price-high" className="bg-slate-900">
                          Price: High to Low
                        </option>
                        <option value="rating" className="bg-slate-900">
                          Highest Rated
                        </option>
                        <option value="newest" className="bg-slate-900">
                          Newest First
                        </option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-white/70">
                        <svg
                          className="h-4 w-4 fill-current"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                        </svg>
                      </div>
                    </div>

                    {getActiveFiltersCount() > 0 && (
                      <button
                        onClick={clearFilters}
                        className="flex items-center gap-2 rounded-[18px] border border-white/10 px-4 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-white/10"
                      >
                        <FaTimes />
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Mobile Search and Filter Bar */}
                <div className="space-y-3 sm:space-y-4 lg:hidden">
                  <div className="relative group">
                    <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-100 transition-colors duration-200 group-focus-within:text-white" />
                    <input
                      type="text"
                      placeholder="Search smartphones..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-12 w-full rounded-xl border border-white/10 bg-white/10 pl-12 pr-4 py-2 text-white placeholder:text-white/50 transition-colors duration-200 focus:border-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-200/40"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowFilters(true)}
                      className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 font-semibold text-white transition-colors duration-300 hover:bg-white/15"
                    >
                      <FaFilter />
                      Filters
                      {getActiveFiltersCount() > 0 && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs font-bold text-white">
                          {getActiveFiltersCount()}
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => setShowSort(true)}
                      className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 font-semibold text-white transition-colors duration-300 hover:bg-white/15"
                    >
                      <FaSort />
                      Sort
                    </button>
                  </div>

                  {/* Active Filters Badge - Mobile */}
                  {getActiveFiltersCount() > 0 && (
                    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center gap-3">
                        <FaInfoCircle className="text-cyan-100" />
                        <div>
                          <span className="text-sm font-medium text-white">
                            {getActiveFiltersCount()} filter
                            {getActiveFiltersCount() > 1 ? "s" : ""} applied
                          </span>
                          <p className="mt-0.5 text-xs text-white/60">
                            Showing {filteredVariants.length} of{" "}
                            {variantCards.length} options
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={clearFilters}
                        className="rounded-lg px-3 py-1.5 text-sm font-medium text-cyan-100 transition-colors duration-200 hover:bg-white/10 hover:text-white"
                      >
                        Clear all
                      </button>
                    </div>
                  )}
                </div>

                {/* Results Count */}
                <div className="hidden">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-end">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-slate-500">
                        Sort By:
                      </span>
                      <div className="relative min-w-[170px]">
                        <select
                          value={sortBy}
                          onChange={(e) => handleSortChange(e.target.value)}
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
                          <option value="rating" className="bg-white">
                            Highest Rated
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
              </div>
            </div>
          </section>

          <div className="mt-6">
            <div className="overflow-hidden pt-0 pb-4 sm:pb-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <FaFilter className="text-blue-600" />
                  <h3 className="text-sm font-semibold text-slate-900 sm:text-base">
                    Popular Features
                  </h3>
                </div>
                {normalizedFeature && (
                  <button
                    onClick={() => setFeatureParam(null)}
                    className="text-xs font-semibold text-blue-700 transition-colors duration-200 hover:text-blue-900"
                  >
                    Clear
                  </button>
                )}
              </div>
              {popularFeatureOrderLoaded && (
                <p className="mb-3 text-xs text-slate-500">
                  Popular choices from other users (last 7 days)
                </p>
              )}
              <div className="flex gap-2.5 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {popularFeatures.map((pf) => {
                  const isActive = normalizedFeature === pf.id;
                  const Icon = pf.icon;
                  return (
                    <button
                      key={pf.id}
                      onClick={() => setFeatureParam(pf.id)}
                      className={`flex items-center gap-2 rounded-full border px-3 py-2 text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors duration-200 ${
                        isActive
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-200 hover:bg-white"
                      }`}
                    >
                      <span
                        className={isActive ? "text-white" : "text-blue-600"}
                      >
                        {Icon ? <Icon className="text-base" /> : null}
                      </span>
                      <span>{pf.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mb-4 overflow-hidden">
              <div className="hidden items-center justify-between gap-4 lg:flex">
                <div className="min-w-0 flex-1 max-w-4xl">
                  <div className="relative group">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                      <FaSearch className="text-blue-500 transition-colors duration-200 group-focus-within:text-blue-600" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search smartphones by brand, model, or specifications..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-md border border-slate-200 bg-white pl-12 pr-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 transition-colors duration-200 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:text-base disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <FaSort className="text-slate-500" />
                    <span className="text-sm text-slate-600">Sort by:</span>
                  </div>
                  <div className="relative min-w-[200px]">
                    <select
                      value={sortBy}
                      onChange={(e) => handleSortChange(e.target.value)}
                      className="w-full cursor-pointer appearance-none rounded-md border border-slate-200 bg-white px-4 py-2.5 pr-10 text-slate-700 transition-colors duration-200 hover:border-blue-300 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
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
                      <option value="rating" className="bg-white">
                        Highest Rated
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

                  {getActiveFiltersCount() > 0 && (
                    <button
                      onClick={clearFilters}
                      className="flex items-center gap-2 rounded-[18px] px-4 py-2.5 text-sm font-medium text-blue-600 transition-colors duration-200 hover:bg-blue-50 hover:text-blue-700"
                    >
                      <FaTimes />
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-3 sm:space-y-4 lg:hidden">
                <div className="relative group">
                  <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500 transition-colors duration-200 group-focus-within:text-blue-600" />
                  <input
                    type="text"
                    placeholder="Search smartphones..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-12 pr-4 py-2 text-slate-900 placeholder:text-slate-400 transition-colors duration-200 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowFilters(true)}
                    className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-sky-500 px-4 font-semibold text-white transition-colors duration-300 hover:from-blue-600 hover:to-sky-600"
                  >
                    <FaFilter />
                    Filters
                    {getActiveFiltersCount() > 0 && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs font-bold text-white">
                        {getActiveFiltersCount()}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => setShowSort(true)}
                    className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 font-semibold text-slate-700 transition-colors duration-300 hover:bg-slate-50"
                  >
                    <FaSort />
                    Sort
                  </button>
                </div>

                {getActiveFiltersCount() > 0 && (
                  <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center gap-3">
                      <FaInfoCircle className="text-blue-500" />
                      <div>
                        <span className="text-sm font-medium text-slate-900">
                          {getActiveFiltersCount()} filter
                          {getActiveFiltersCount() > 1 ? "s" : ""} applied
                        </span>
                        <p className="mt-0.5 text-xs text-slate-500">
                          Showing {filteredVariants.length} of{" "}
                          {variantCards.length} options
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={clearFilters}
                      className="rounded-lg px-3 py-1.5 text-sm font-medium text-blue-600 transition-colors duration-200 hover:bg-slate-100 hover:text-blue-700"
                    >
                      Clear all
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <section className="">
            <div className="mt-8 flex flex-col lg:flex-row gap-6 md:gap-8">
              {/* Desktop Filter Sidebar */}
              <div className="hidden lg:block lg:w-72 flex-shrink-0">
                <div className="sticky top-6  p-5 border border-gray-100 bg-white border border-slate-200 lg:p-6">
                  {/* Filters Header */}
                  <div className="mb-6 flex items-center justify-between border-b border-slate-200 px-2 pb-4 sm:mb-8 sm:px-3 md:px-4">
                    <div>
                      <h3 className="flex items-center gap-2 text-xl font-bold text-slate-900">
                        Filters
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Narrow down by specifications
                      </p>
                    </div>
                    {getActiveFiltersCount() > 0 && (
                      <button
                        onClick={clearFilters}
                        className="flex items-center gap-2 rounded-lg px-3 py-1 text-sm font-semibold text-blue-600 transition-colors duration-200 hover:bg-slate-50 hover:text-blue-500"
                      >
                        <FaTimes />
                        RESET
                      </button>
                    )}
                  </div>

                  {/* Active Filters Badge */}
                  {getActiveFiltersCount() > 0 && (
                    <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm sm:mb-8">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-slate-900">
                          Active Filters
                        </span>
                        <span className="text-xs font-bold text-blue-300 bg-blue-500/20 px-2 py-1 rounded-full border border-blue-400/30">
                          {getActiveFiltersCount()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {filteredVariants.length} devices match
                      </p>
                    </div>
                  )}

                  {/* Brand Filter */}
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-base font-bold text-slate-900">
                          Brands
                        </h4>
                        <p className="mt-1 text-xs text-slate-500">
                          Select by manufacturer
                        </p>
                      </div>
                      <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-bold text-blue-600">
                        {filters.brand.length}
                      </span>
                    </div>
                    <div className="relative mb-4">
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
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={filters.brand.includes(brand)}
                              onChange={() =>
                                handleFilterChange("brand", brand)
                              }
                              className="h-4 w-4 appearance-none rounded border border-slate-300 bg-white transition-all duration-200 checked:border-blue-500 checked:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1"
                            />
                          </div>
                          <span className="flex-1 font-medium text-slate-700 group-hover:text-slate-900">
                            {brand}
                          </span>
                          <div className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-500">
                            {devices.filter((d) => d.brand === brand).length}
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

                  {/* Price Range Filter */}
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-base font-bold text-slate-900">
                          Price Range
                        </h4>
                        <p className="mt-1 text-xs text-slate-500">
                          Set your budget
                        </p>
                      </div>
                      <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-bold text-blue-600">
                        ₹ {filters.priceRange.min?.toLocaleString()}
                      </span>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-[#f8fbff] p-4">
                      <div className="mb-4 flex justify-between text-sm font-medium text-slate-900">
                        <div className="text-center">
                          <div className="text-xs text-slate-500">Minimum</div>
                          <div className="font-bold">
                            ₹ {filters.priceRange.min?.toLocaleString()}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-slate-500">Maximum</div>
                          <div className="font-bold">
                            ₹ {filters.priceRange.max?.toLocaleString()}
                          </div>
                        </div>
                      </div>

                      {/* Dual Range Slider */}
                      <div className="relative mb-8">
                        <div className="absolute top-1/2 h-2 w-full -translate-y-1/2 rounded-full bg-slate-200"></div>
                        <div
                          className="absolute h-2 bg-gradient-to-r from-blue-300 via-blue-700 to-blue-900 rounded-full top-1/2 transform -translate-y-1/2"
                          style={{
                            left: `${Math.max(
                              0,
                              Math.min(
                                100,
                                ((filters.priceRange.min || 0) /
                                  (MAX_PRICE || 1)) *
                                  100,
                              ),
                            )}%`,
                            width: `${Math.max(
                              0,
                              Math.min(
                                100,
                                ((filters.priceRange.max -
                                  filters.priceRange.min) /
                                  (MAX_PRICE || 1)) *
                                  100,
                              ),
                            )}%`,
                          }}
                        ></div>

                        <input
                          type="range"
                          min={MIN_PRICE}
                          max={MAX_PRICE}
                          value={filters.priceRange.min}
                          onChange={(e) =>
                            updatePriceRange(
                              Number(e.target.value),
                              filters.priceRange.max,
                            )
                          }
                          className="absolute w-full top-1/2 h-4 -translate-y-1/2 appearance-none bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-blue-400 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-blue-500/30 [&::-webkit-slider-thumb]:cursor-pointer"
                        />

                        <input
                          type="range"
                          min={MIN_PRICE}
                          max={MAX_PRICE}
                          value={filters.priceRange.max}
                          onChange={(e) =>
                            updatePriceRange(
                              filters.priceRange.min,
                              Number(e.target.value),
                            )
                          }
                          className="absolute w-full top-1/2 h-4 -translate-y-1/2 appearance-none bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-blue-400 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-blue-500/30 [&::-webkit-slider-thumb]:cursor-pointer"
                        />
                      </div>

                      <div className="flex justify-between items-center text-xs mb-3">
                        <span className="text-slate-500">
                          ₹ {MIN_PRICE.toLocaleString()}
                        </span>
                        <span className="text-slate-500">
                          ₹ {MAX_PRICE.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-center">
                        <button
                          onClick={() => updatePriceRange(MIN_PRICE, MAX_PRICE)}
                          className="rounded-lg px-3 py-1.5 font-medium text-blue-600 transition-colors duration-200 hover:bg-slate-100 hover:text-blue-500"
                        >
                          Reset Range
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* RAM Filter */}
                  <div className="mb-8">
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
                        {filters.ram.length}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {ramOptions.map((ram) => (
                        <label
                          key={ram}
                          className={`flex items-center justify-center gap-2 cursor-pointer px-3 py-2.5 rounded-xl transition-all duration-200 font-medium border ${
                            filters.ram.includes(ram)
                              ? "bg-gradient-to-b from-blue-500 to-sky-500 text-white border-blue-400"
                              : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-slate-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={filters.ram.includes(ram)}
                            onChange={() => handleFilterChange("ram", ram)}
                            className="sr-only"
                          />
                          <span>{ram}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Storage Filter */}
                  <div className="mb-8">
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
                        {filters.storage.length}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {storageOptions.map((storage) => (
                        <label
                          key={storage}
                          className={`flex items-center justify-center gap-2 cursor-pointer px-3 py-2.5 rounded-xl transition-all duration-200 font-medium border ${
                            filters.storage.includes(storage)
                              ? "bg-gradient-to-b from-blue-500 to-sky-500 text-white border-blue-400"
                              : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-slate-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={filters.storage.includes(storage)}
                            onChange={() =>
                              handleFilterChange("storage", storage)
                            }
                            className="sr-only"
                          />
                          <span>{storage}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Battery Filter */}
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-base font-bold text-slate-900">
                          Battery Capacity
                        </h4>
                        <p className="mt-1 text-xs text-slate-500">
                          Usage time and endurance
                        </p>
                      </div>
                      <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-bold text-blue-600">
                        {filters.battery.length}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {BATTERY_RANGES.map((r) => {
                        return (
                          <label
                            key={r.id}
                            className={`flex items-center justify-between gap-2 cursor-pointer px-4 py-3 rounded-xl transition-all duration-300 font-medium border ${
                              filters.battery.includes(r.id)
                                ? "bg-gradient-to-r from-blue-500 to-sky-500 text-white border-blue-400"
                                : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-slate-50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={filters.battery.includes(r.id)}
                              onChange={() =>
                                handleFilterChange("battery", r.id)
                              }
                              className="sr-only"
                            />
                            <span>{r.label}</span>
                            <div
                              className={`w-2 h-2 rounded-full ${
                                filters.battery.includes(r.id)
                                  ? "bg-white/80"
                                  : "bg-slate-300"
                              }`}
                            ></div>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Additional filters button */}
                  <button
                    onClick={() => setShowFilters(true)}
                    className="mt-6 w-full rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 py-3 font-semibold text-white transition-all duration-300 hover:from-blue-700 hover:to-blue-600 hover:shadow-lg lg:hidden"
                  >
                    Show More Filters
                  </button>
                </div>
              </div>

              {/* Products List - Right */}
              <div className="flex-1">
                {/* Products Grid */}
                <div className="grid grid-cols-1 gap-4 sm:gap-5 md:gap-6 auto-rows-max">
                  {sortedVariants.map((device, _idx) => {
                    const devicePolicy = resolveDevicePolicy(device);
                    const availabilityState = getAvailabilityState(
                      device.storePrices || [],
                      device.brand,
                      device.brandWebsite || null,
                      device.launchDate || null,
                      device.brandLogo || null,
                      device.saleStartDate || null,
                      isUpcomingDevice(device) || device.is_prebooking === true,
                      devicePolicy.stage,
                      device.price,
                    );
                    const availableStoreRows = availabilityState.stores || [];
                    const shouldFilterEmptyStores = listFilter === "new";
                    const storeRowsForDisplay = shouldFilterEmptyStores
                      ? availableStoreRows.filter((storePrice) => {
                          if (!storePrice) return false;
                          const hasUrl = Boolean(
                            String(storePrice.url || "").trim(),
                          );
                          const hasPrice =
                            extractNumericPrice(storePrice.price) > 0;
                          const isPrebookingRow =
                            storePrice.is_prebooking === true ||
                            /^(pre(book|order)|coming\s*soon)$/i.test(
                              String(storePrice.cta_label || "").trim(),
                            );
                          return hasUrl || hasPrice || isPrebookingRow;
                        })
                      : availableStoreRows;
                    const launchDateParsed = device.launchDate
                      ? new Date(device.launchDate)
                      : null;
                    const hasLaunchDate =
                      launchDateParsed &&
                      !Number.isNaN(launchDateParsed.getTime());
                    const upcomingBadge = isUpcomingView
                      ? getUpcomingBadge(device)
                      : null;
                    const allowSpecScore = devicePolicy.allowSpecScore;
                    const scoreValueRaw = allowSpecScore
                      ? Number(resolveSmartphoneBadgeScore(device))
                      : null;
                    const scoreValue = Number.isFinite(scoreValueRaw)
                      ? Math.round(scoreValueRaw)
                      : null;
                    const marketStatusLabel =
                      devicePolicy.stage === "upcoming"
                        ? "Coming Soon"
                        : devicePolicy.stage === "announced"
                          ? "Announced"
                          : devicePolicy.stage === "rumored"
                            ? "Rumored"
                            : "In Stock";
                    const marketStatusClass =
                      devicePolicy.stage === "upcoming" ||
                      devicePolicy.stage === "announced"
                        ? "text-amber-600"
                        : devicePolicy.stage === "rumored"
                          ? "text-slate-500"
                          : "text-emerald-600";
                    const isAiDevice = Boolean(
                      device.specs?.isAiPhone || getAiFeatureCount(device) > 0,
                    );
                    const cardBadgeLabel =
                      upcomingBadge ||
                      (isAiDevice ? "AI Phone" : null) ||
                      (Number(device.trend_velocity || 0) > 0 ||
                      listFilter === "trending"
                        ? "Trending"
                        : null);
                    const deviceCompareLimit = Number.isFinite(
                      devicePolicy.compareLimit,
                    )
                      ? devicePolicy.compareLimit
                      : compareLimit;
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
                        device.brandLogo ||
                        null,
                    );
                    const primaryStoreUrl =
                      primaryStoreRow?.url || brandStoreUrl || null;
                    const priceRowsForDisplay = storeRowsForDisplay
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
                    const displaySummary = (() => {
                      const rawDisplay =
                        device.display || device.specs?.display;
                      if (typeof rawDisplay === "string" && rawDisplay.trim()) {
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
                    const ramValue = formatGbLabel(device.specs?.ram, "8 GB");
                    const storageValue = formatGbLabel(
                      device.specs?.storage,
                      "256 GB",
                    );
                    const memorySummary = `${ramValue} | ${storageValue}`;
                    const compactSpecLine = [
                      memorySummary,
                      cameraSummary,
                      batterySummary,
                      displaySummary,
                      processorSummary,
                    ]
                      .filter(Boolean)
                      .join(" | ");
                    const formatStorePrice = (price) => {
                      if (price == null || price === "" || price === "NaN") {
                        return "";
                      }
                      const numeric = extractNumericPrice(price);
                      if (numeric > 0)
                        return `₹ ${numeric.toLocaleString("en-IN")}`;
                      const raw = String(price).trim();
                      return raw.startsWith("₹") ? raw : `₹ ${raw}`;
                    };

                    return (
                      <div
                        key={`${device.id ?? device.model ?? ""}-${_idx}`}
                        onClick={(e) => handleView(device, e)}
                        className={`h-full w-full mx-auto smooth-transition fade-in-up overflow-hidden bg-white border border-slate-200 cursor-pointer transition-all duration-300 ${
                          isCompareSelected(device)
                            ? "ring-2 ring-blue-400 border-blue-400 bg-blue-50"
                            : "hover:border-blue-200  "
                        }`}
                      >
                        <div className="p-5 sm:p-6 transition-all duration-300">
                          <div className="hidden flex-col gap-4 lg:flex lg:flex-row lg:items-start lg:justify-between">
                            <div className="min-w-0 flex-1">
                              <h3 className="max-w-3xl text-[1.45rem] font-semibold tracking-tight text-[#14255e] sm:text-[1.8rem]">
                                {device.name || device.model}
                              </h3>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                              <div className="text-xl font-semibold tracking-tight text-[#14255e] sm:text-2xl">
                                {device.price}
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 hidden flex-col gap-3 lg:flex lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex flex-wrap items-center gap-4">
                              {scoreValue != null ? (
                                <div className="flex items-end gap-1 leading-none">
                                  <span className="text-3xl font-semibold leading-none text-blue-600">
                                    {scoreValue}
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
                              ) : null}
                            </div>

                            {hasLaunchDate ? (
                              <div className="flex items-center gap-1.5 text-sm text-slate-700 sm:justify-end">
                                <FaCalendarAlt className="text-slate-400" />
                                <span>
                                  Launched:{" "}
                                  <span className="font-semibold text-slate-900">
                                    {launchDateParsed.toLocaleDateString(
                                      "en-US",
                                      {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                      },
                                    )}
                                  </span>
                                </span>
                              </div>
                            ) : null}
                          </div>

                          <div className="mt-5 grid grid-cols-[128px_minmax(0,1fr)] gap-3 sm:grid-cols-[120px_minmax(0,1fr)] lg:grid-cols-[180px_minmax(0,1fr)] sm:gap-4 lg:gap-5">
                            {" "}
                            <div className="relative flex items-start justify-start sm:justify-center">
                              {cardBadgeLabel ? (
                                <span className="absolute left-0 top-0 z-10 inline-flex items-center rounded-full bg-yellow-600 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                                  {cardBadgeLabel}
                                </span>
                              ) : null}
                              <div className="flex w-full justify-start sm:justify-center">
                                <ImageCarousel
                                  images={device.images}
                                  className="shadow-md"
                                />
                              </div>
                            </div>
                            <div className="space-y-3 pt-1">
                              <div className="space-y-1 lg:hidden">
                                {device.brand ? (
                                  <p className="text-sm font-semibold text-blue-600">
                                    {device.brand}
                                  </p>
                                ) : null}
                                <h3 className="max-w-3xl text-[1.05rem] font-semibold tracking-tight text-[#14255e] sm:text-[1.2rem]">
                                  {device.name || device.model}
                                </h3>

                                {scoreValue != null ? (
                                  <div className="flex items-end gap-1 leading-none">
                                    <span className="text-3xl font-semibold leading-none text-blue-600">
                                      {scoreValue}
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
                                ) : null}
                              </div>

                              <div className="hidden lg:block text-[13px] leading-6 text-slate-700 sm:text-sm sm:leading-7 sm:text-base">
                                {compactSpecLine}
                              </div>

                              <div className="lg:hidden text-lg font-semibold tracking-tight text-[#14255e] sm:text-xl">
                                {device.price}
                              </div>

                              {priceRowsForDisplay.length > 0 ? (
                                <div className="hidden rounded-[24px] border border-blue-100 bg-[#f8fbff] p-2.5 sm:p-4 lg:block">
                                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                                    <FaStore className="text-emerald-500" />
                                    Check Price On
                                  </div>
                                  <div className="space-y-2">
                                    {priceRowsForDisplay.map(
                                      (storePrice, i) => {
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
                                        const ctaText =
                                          storePrice.cta_label || "Buy Now";
                                        const isPreorderCta =
                                          storePrice.is_prebooking === true ||
                                          /^(pre(book|order)|coming\s*soon)$/i.test(
                                            String(ctaText).trim(),
                                          );
                                        const rawLogoSrc =
                                          storePrice.logo ||
                                          (storeNameCandidate
                                            ? getStoreLogo
                                              ? getStoreLogo(storeNameCandidate)
                                              : getLogo(storeNameCandidate)
                                            : null) ||
                                          device.brandLogo ||
                                          null;
                                        const logoSrc =
                                          normalizeAssetUrl(rawLogoSrc);
                                        const priceLabel = formatStorePrice(
                                          storePrice.price,
                                        );

                                        return (
                                          <div
                                            key={`${
                                              device.id ?? device.model ?? ""
                                            }-price-${i}`}
                                            className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 px-2.5 py-2.5 sm:px-3 sm:py-3"
                                          >
                                            <div className="flex min-w-0 items-center gap-3">
                                              {logoSrc ? (
                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center">
                                                  <img
                                                    src={logoSrc}
                                                    alt={
                                                      storeObj?.name ||
                                                      storeNameCandidate
                                                    }
                                                    className="h-full w-full object-contain"
                                                  />
                                                </div>
                                              ) : (
                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f7fbff] ring-1 ring-[#dbe7f7]">
                                                  <FaStore className="text-slate-400 text-xs" />
                                                </div>
                                              )}
                                              <span className="truncate text-sm font-medium text-slate-800">
                                                {storeNameCandidate ||
                                                  "Online Store"}
                                              </span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                              <span className="whitespace-nowrap text-sm font-semibold text-emerald-600">
                                                {priceLabel}
                                              </span>
                                              {storePrice.url ? (
                                                <a
                                                  href={storePrice.url}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  onClick={(e) =>
                                                    e.stopPropagation()
                                                  }
                                                  className={`inline-flex items-center gap-1 whitespace-nowrap text-sm font-semibold transition-colors ${
                                                    isPreorderCta
                                                      ? "text-blue-600 hover:text-blue-700"
                                                      : "text-blue-600 hover:text-blue-700"
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
                                      },
                                    )}
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          </div>

                          <div className="mt-4 flex items-center justify-between gap-3">
                            <label
                              className={`flex cursor-pointer items-center gap-2 ${compareDisabled ? "cursor-not-allowed opacity-50" : ""}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <input
                                type="checkbox"
                                checked={compareItems.includes(device._id)}
                                disabled={
                                  compareDisabled ||
                                  (!compareItems.includes(device._id) &&
                                    compareItems.length >=
                                      effectiveCompareLimit)
                                }
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => handleCompareToggle(device, e)}
                                className="h-4 w-4 appearance-none rounded border border-slate-300 bg-white transition-all duration-200 checked:border-emerald-600 checked:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-1 disabled:cursor-not-allowed"
                              />
                              <span className="text-sm font-semibold text-slate-700">
                                Add to Compare
                              </span>
                            </label>
                            {hasLaunchDate ? (
                              <div className="flex items-center gap-1.5 text-sm text-slate-700 lg:hidden">
                                <FaCalendarAlt className="text-slate-400" />
                                <span>
                                  Launched:{" "}
                                  <span className="font-semibold text-slate-900">
                                    {launchDateParsed.toLocaleDateString(
                                      "en-US",
                                      {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                      },
                                    )}
                                  </span>
                                </span>
                              </div>
                            ) : null}
                          </div>
                          <div className="mt-4 space-y-3 lg:hidden">
                            <div className="text-[13px] leading-6 text-slate-700 sm:text-sm sm:leading-7 sm:text-base">
                              {compactSpecLine}
                            </div>

                            {priceRowsForDisplay.length > 0 ? (
                              <div className="rounded-[20px] border border-blue-100 bg-[#f8fbff] p-3 sm:p-4">
                                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                                  <FaStore className="text-emerald-500" />
                                  Check Price On
                                </div>
                                <div className="space-y-2">
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
                                    const ctaText =
                                      storePrice.cta_label || "Buy Now";
                                    const isPreorderCta =
                                      storePrice.is_prebooking === true ||
                                      /^(pre(book|order)|coming\s*soon)$/i.test(
                                        String(ctaText).trim(),
                                      );
                                    const rawLogoSrc =
                                      storePrice.logo ||
                                      (storeNameCandidate
                                        ? getStoreLogo
                                          ? getStoreLogo(storeNameCandidate)
                                          : getLogo(storeNameCandidate)
                                        : null) ||
                                      device.brandLogo ||
                                      null;
                                    const logoSrc =
                                      normalizeAssetUrl(rawLogoSrc);
                                    const priceLabel = formatStorePrice(
                                      storePrice.price,
                                    );

                                    return (
                                      <div
                                        key={`${
                                          device.id ?? device.model ?? ""
                                        }-mobile-price-${i}`}
                                        className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2.5"
                                      >
                                        <div className="flex min-w-0 items-center gap-3">
                                          {logoSrc ? (
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white">
                                              <img
                                                src={logoSrc}
                                                alt={
                                                  storeObj?.name ||
                                                  storeNameCandidate
                                                }
                                                className="h-full w-full object-contain"
                                              />
                                            </div>
                                          ) : (
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f7fbff] ring-1 ring-[#dbe7f7]">
                                              <FaStore className="text-slate-400 text-xs" />
                                            </div>
                                          )}
                                          <span className="truncate text-sm font-medium text-slate-800">
                                            {storeNameCandidate ||
                                              "Online Store"}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                          <span className="whitespace-nowrap text-sm font-semibold text-emerald-600">
                                            {priceLabel}
                                          </span>
                                          {storePrice.url ? (
                                            <a
                                              href={storePrice.url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              onClick={(e) =>
                                                e.stopPropagation()
                                              }
                                              className={`inline-flex items-center gap-1 whitespace-nowrap text-sm font-semibold transition-colors ${
                                                isPreorderCta
                                                  ? "text-blue-600 hover:text-blue-700"
                                                  : "text-blue-600 hover:text-blue-700"
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
                                  })}
                                </div>
                              </div>
                            ) : null}
                          </div>
                        </div>
                        <div className="hidden" />
                      </div>
                    );
                  })}
                </div>

                {/* Floating Compare Bar - Appears when 2+ items selected */}
                {compareItems.length >= 2 && (
                  <div className="fixed bottom-6 left-4 right-4 z-40 max-w-sm rounded-xl border border-slate-200 bg-white p-4 shadow-lg animate-slide-up md:bottom-8 md:left-auto md:right-8 md:shadow-2xl">
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
                {sortedVariants.length === 0 && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 py-16 text-center transition-all duration-300">
                    <div className="max-w-md mx-auto">
                      <FaSearch className="mx-auto mb-4 text-5xl text-slate-300" />
                      <h3 className="mb-3 text-2xl font-semibold text-slate-900">
                        No smartphones found
                      </h3>
                      <p className="mb-6 text-slate-600">
                        Try adjusting your filters or search terms to find what
                        you're looking for. We have a wide range of devices
                        available.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                          onClick={clearFilters}
                          className="rounded-lg bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 px-6 py-3 font-semibold text-white transition-all duration-300 hover:from-blue-700 hover:to-blue-600 hover:shadow-lg hover:-translate-y-0.5"
                        >
                          Clear All Filters
                        </button>
                        <button
                          onClick={() => setShowFilters(true)}
                          className="rounded-lg border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition-all duration-300 hover:border-slate-400 hover:bg-slate-50 hover:shadow-md"
                        >
                          Adjust Filters
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Results Footer */}
                {sortedVariants.length > 0 && (
                  <div className="mt-8 border-t border-slate-200 pt-6">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                      <div className="text-sm text-slate-500">
                        Showing {sortedVariants.length} of {variantCards.length}{" "}
                        options
                      </div>
                      <div className="flex items-center gap-3">
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
                        verify details with the respective stores before making
                        a purchase.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Sort Modal */}
            {showSort && (
              <div className="lg:hidden fixed inset-0 z-50">
                <div
                  className="absolute inset-0 bg-black bg-opacity-50 transition-all duration-300"
                  onClick={() => setShowSort(false)}
                ></div>

                <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl transform transition-all duration-300 max-h-[70vh] overflow-hidden">
                  <div className="flex items-center justify-between p-6 border-b border-gray-200  ">
                    <div className="flex items-center gap-3">
                      <FaSort className="text-blue-600 text-xl" />
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          Sort Options
                        </h3>
                        <p className="text-sm text-gray-500">
                          Arrange smartphones by preference
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowSort(false)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                    >
                      <FaTimes className="text-gray-500 text-lg" />
                    </button>
                  </div>

                  <div className="p-6 space-y-3">
                    {[
                      {
                        value: "featured",
                        label: "Featured Devices",
                        desc: "Curated selection of popular models",
                      },
                      {
                        value: "price-low",
                        label: "Price: Low to High",
                        desc: "Budget-friendly options first",
                      },
                      {
                        value: "price-high",
                        label: "Price: High to Low",
                        desc: "Premium devices first",
                      },
                      {
                        value: "rating",
                        label: "Top Rated",
                        desc: "Highest user ratings",
                      },
                      {
                        value: "newest",
                        label: "Newest First",
                        desc: "Latest releases",
                      },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleSortChange(option.value)}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                          sortBy === option.value
                            ? "bg-blue-50 border-blue-500 text-blue-700"
                            : "bg-gray-50 border-gray-200 text-gray-700 hover:border-gray-300"
                        }`}
                      >
                        <div className="font-semibold">{option.label}</div>
                        <div className="text-sm text-gray-500 mt-1">
                          {option.desc}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Mobile Filter Overlay - Remains the same but with enhanced descriptions */}
            {showFilters && (
              <div className="lg:hidden fixed inset-0 z-50">
                <div
                  className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
                  onClick={() => setShowFilters(false)}
                ></div>

                <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl transform transition-transform duration-300 max-h-[90vh] overflow-hidden flex flex-col">
                  <div className="flex items-center justify-between p-6 border-b border-gray-200  ">
                    <div className="flex items-center gap-3">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          Refine Search
                        </h3>
                        <p className="text-sm text-gray-500">
                          Filter smartphones by specifications
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowFilters(false)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                    >
                      <FaTimes className="text-gray-500 text-lg" />
                    </button>
                  </div>

                  <div className="no-scrollbar flex-1 space-y-6 overflow-y-auto p-6">
                    {/* Brand Filter (mobile) */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
                          Manufacturer Brands
                        </h4>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          {filters.brand.length} selected
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mb-3">
                        Select smartphone brands to compare
                      </div>
                      <div className="relative mb-3">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                        <input
                          type="text"
                          value={brandFilterQuery}
                          onChange={(e) => setBrandFilterQuery(e.target.value)}
                          placeholder="Search brand..."
                          className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="space-y-2">
                        {filteredBrandOptions.map((brand) => (
                          <label
                            key={brand}
                            className="flex items-center gap-3 cursor-pointer group hover:bg-gray-50 px-3 py-2.5 rounded-lg transition-all duration-200 border border-transparent hover:border-gray-200"
                          >
                            <input
                              type="checkbox"
                              checked={filters.brand.includes(brand)}
                              onChange={() =>
                                handleFilterChange("brand", brand)
                              }
                              className="w-4 h-4 appearance-none rounded border border-gray-300 bg-white transition-all duration-200 checked:border-blue-600 checked:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                            />
                            <span className="text-gray-700 font-medium">
                              {brand}
                            </span>
                            <div className="ml-auto text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              {devices.filter((d) => d.brand === brand).length}
                            </div>
                          </label>
                        ))}
                        {filteredBrandOptions.length === 0 && (
                          <div className="text-sm text-gray-500 px-2 py-1">
                            No brands found
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Price Range (mobile) */}
                    <div>
                      <div className="flex items-center justify-between mb-3 ">
                        <h4 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
                          Price Range
                        </h4>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          ₹ {filters.priceRange.min?.toLocaleString()} - ₹
                          {filters.priceRange.max?.toLocaleString()}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mb-3">
                        Set your budget range for smartphone purchase
                      </div>
                      <div className="rounded-xl border border-gray-200 bg-[#f8fbff] p-4">
                        <div className="flex justify-between text-sm font-medium text-gray-700 mb-4">
                          <div className="text-center">
                            <div className="text-xs text-gray-500">Minimum</div>
                            <div className="font-bold">
                              ₹ {filters.priceRange.min?.toLocaleString()}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-gray-500">Maximum</div>
                            <div className="font-bold">
                              ₹ {filters.priceRange.max?.toLocaleString()}
                            </div>
                          </div>
                        </div>

                        <div className="relative mb-4">
                          <div className="absolute h-2 bg-gray-200 rounded-full w-full top-1/2 transform -translate-y-1/2"></div>
                          <div
                            className="absolute h-2 bg-gradient-to-r from-blue-900 via-blue-850 to-blue-950 rounded-full top-1/2 transform -translate-y-1/2"
                            style={{
                              left: `${Math.max(
                                0,
                                Math.min(
                                  100,
                                  ((filters.priceRange.min || 0) /
                                    (MAX_PRICE || 1)) *
                                    100,
                                ),
                              )}%`,
                              width: `${Math.max(
                                0,
                                Math.min(
                                  100,
                                  ((filters.priceRange.max -
                                    filters.priceRange.min) /
                                    (MAX_PRICE || 1)) *
                                    100,
                                ),
                              )}%`,
                            }}
                          />

                          <input
                            type="range"
                            min={MIN_PRICE}
                            max={MAX_PRICE}
                            value={filters.priceRange.min}
                            onChange={(e) =>
                              updatePriceRange(
                                Number(e.target.value),
                                filters.priceRange.max,
                              )
                            }
                            className="absolute w-full top-1/2 transform -translate-y-1/2 appearance-none h-4 bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-indigo-500 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer"
                          />

                          <input
                            type="range"
                            min={MIN_PRICE}
                            max={MAX_PRICE}
                            value={filters.priceRange.max}
                            onChange={(e) =>
                              updatePriceRange(
                                filters.priceRange.min,
                                Number(e.target.value),
                              )
                            }
                            className="absolute w-full top-1/2 transform -translate-y-1/2 appearance-none h-4 bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:  [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-blue-500 [&::-webkit-slider-thumb]:  [&::-webkit-slider-thumb]:cursor-pointer"
                          />

                          <div className="flex justify-between items-center text-xs mb-2">
                            <span className="text-gray-500">
                              ₹ {MIN_PRICE.toLocaleString()}
                            </span>
                            <span className="text-gray-500">
                              ₹ {MAX_PRICE.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-center">
                            <button
                              onClick={() =>
                                updatePriceRange(MIN_PRICE, MAX_PRICE)
                              }
                              className="text-blue-600 hover:text-blue-700 font-medium px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors duration-200"
                            >
                              Reset Range
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* RAM */}
                    <div>
                      <div className="flex items-center justify-between mb-3 ">
                        <h4 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
                          <FaMemory className="text-blue-500" /> Memory (RAM)
                        </h4>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          {filters.ram.length} selected
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mb-3">
                        Choose RAM capacity for multitasking performance
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {ramOptions.map((ram) => (
                          <label
                            key={ram}
                            className={`flex items-center justify-center gap-2 cursor-pointer px-3 py-2.5 rounded-xl transition-all duration-200 font-medium ${
                              filters.ram.includes(ram)
                                ? "bg-gradient-to-b from-blue-600 via-blue-500 to-blue-600 text-white  "
                                : "bg-gray-50 border border-gray-200 text-gray-700 hover:border-gray-300 hover: "
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={filters.ram.includes(ram)}
                              onChange={() => handleFilterChange("ram", ram)}
                              className="sr-only"
                            />
                            <FaMemory className="text-sm" />
                            <span>{ram}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Storage */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
                          <FaShoppingBag className="text-green-500" /> Storage
                          Capacity
                        </h4>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          {filters.storage.length} selected
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mb-3">
                        Select internal storage options for apps and media
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {storageOptions.map((storage) => (
                          <label
                            key={storage}
                            className={`flex items-center justify-center gap-2 cursor-pointer px-3 py-2.5 rounded-xl transition-all duration-200 font-medium ${
                              filters.storage.includes(storage)
                                ? "bg-gradient-to-b from-blue-600 via-blue-500 to-blue-600 text-white  "
                                : "bg-gray-50 border border-gray-200 text-gray-700 hover:border-gray-300 hover: "
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={filters.storage.includes(storage)}
                              onChange={() =>
                                handleFilterChange("storage", storage)
                              }
                              className="sr-only"
                            />
                            <span className="text-sm">{storage}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Battery Ranges */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
                          <FaBatteryFull className="text-orange-500" /> Battery
                          Capacity
                        </h4>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          {filters.battery.length} selected
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mb-3">
                        Filter by battery capacity for longer usage time
                      </div>
                      <div className="space-y-2">
                        {BATTERY_RANGES.map((r) => {
                          const Icon = r.icon;
                          return (
                            <label
                              key={r.id}
                              className={`flex items-center justify-between gap-2 cursor-pointer px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                                filters.battery.includes(r.id)
                                  ? "bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 text-white  "
                                  : "bg-gray-50 border border-gray-200 text-gray-700 hover:border-gray-300"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={filters.battery.includes(r.id)}
                                onChange={() =>
                                  handleFilterChange("battery", r.id)
                                }
                                className="sr-only"
                              />
                              <div className="flex items-center gap-3">
                                <Icon className="text-sm" />
                                <span>{r.label}</span>
                              </div>
                              <div
                                className={`${
                                  filters.battery.includes(r.id)
                                    ? " "
                                    : "bg-gray-300"
                                } w-2 h-2 rounded-full`}
                              />
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* Processor / Network / Refresh / Camera */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h5 className="font-semibold text-gray-800 mb-2">
                          Processor
                        </h5>
                        <div className="space-y-2">
                          {processorOptions.map((p) => (
                            <label
                              key={p}
                              className="flex items-center gap-3 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={filters.processor.includes(p)}
                                onChange={() =>
                                  handleFilterChange("processor", p)
                                }
                                className="w-4 h-4"
                              />
                              <span className="text-sm">{p}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h5 className="font-semibold text-gray-800 mb-2">
                          Network
                        </h5>
                        <div className="space-y-2">
                          {networkOptions.map((n) => (
                            <label
                              key={n}
                              className="flex items-center gap-3 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={filters.network.includes(n)}
                                onChange={() =>
                                  handleFilterChange("network", n)
                                }
                                className="w-4 h-4"
                              />
                              <span className="text-sm">{n}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h5 className="font-semibold text-gray-800 mb-2">
                          Refresh Rate
                        </h5>
                        <div className="space-y-2">
                          {refreshRateOptions.map((r) => (
                            <label
                              key={r}
                              className="flex items-center gap-3 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={filters.refreshRate.includes(r)}
                                onChange={() =>
                                  handleFilterChange("refreshRate", r)
                                }
                                className="w-4 h-4"
                              />
                              <span className="text-sm">{r}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* ... [Filter content from original] ... */}

                  {/* Apply Button */}
                  <div className="mt-auto shrink-0 border-t border-slate-200 bg-white p-6">
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowFilters(false)}
                        className="flex-1 rounded-xl bg-slate-100 py-4 font-semibold text-slate-700 transition-colors duration-200 hover:bg-slate-200"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => setShowFilters(false)}
                        className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 py-4 font-semibold text-white transition-all duration-200 hover:from-indigo-700 hover:to-blue-700"
                      >
                        Apply Filters
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Help Section */}
      <div className="mt-12 lg:mt-16">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm lg:p-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="mb-2 text-xl font-bold text-slate-900">
                Need help choosing?
              </h3>
              <p className="mb-4 text-slate-600 lg:mb-0">
                Use our comparison tool to side-by-side compare up to 4
                smartphones and make an informed decision based on your specific
                requirements.
              </p>
            </div>
            <button
              onClick={() => navigate("/compare")}
              className="whitespace-nowrap rounded-xl border border-blue-400/50 bg-gradient-to-r from-blue-500 to-sky-500 px-8 py-3 font-semibold text-white transition-all duration-200 hover:from-blue-600 hover:to-sky-600"
            >
              Open Comparison Tool
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Smartphones;
