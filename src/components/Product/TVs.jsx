// src/components/HomeApplianceList.jsx
import React, { useState, useEffect, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import {
  FaHome,
  FaFilter,
  FaTimes,
  FaSearch,
  FaStore,
  FaMoneyBill,
  FaEye,
  FaCalendarAlt,
  FaInfoCircle,
  FaExternalLinkAlt,
  FaSnowflake,
  FaTv,
  FaWind,
  FaShower,
  FaBolt,
  FaTag,
  FaWeightHanging,
  FaRuler,
  FaFire,
  FaThermometerHalf,
  FaCog,
  FaTint,
  FaVolumeUp,
  FaPlug,
  FaBed,
  FaUtensils,
  FaFan,
} from "react-icons/fa";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import useStoreLogos from "../../hooks/useStoreLogos";
import Spinner from "../ui/Spinner";
import LatestNewsRouteSection from "../ui/LatestNewsRouteSection";
import ProductDiscoverySections from "../ui/ProductDiscoverySections";
import useTitle from "../../hooks/useTitle";
import { toCanonicalPageUrl } from "../../utils/publicUrl";
import useDeviceFieldProfiles from "../../hooks/useDeviceFieldProfiles";
import { useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { generateSlug } from "../../utils/slugGenerator";
import { resolveDeviceFieldProfile } from "../../utils/deviceFieldProfiles";
import {
  createCollectionSchema,
  createItemListSchema,
} from "../../utils/schemaGenerators";
import { buildListSeoKeywords } from "../../utils/seoKeywordBuilder";
import {
  fetchHomeAppliances,
  fetchTrendingHomeAppliances,
  fetchNewLaunchHomeAppliances,
} from "../../store/deviceSlice";
import useDevice from "../../hooks/useDevice";
// BannerSlot disabled until completed.
import normalizeProduct from "../../utils/normalizeProduct";
import {
  computeAdditionalTvFeatures,
  computePopularTvFeatures,
  getTvRouteFeatureMeta,
  getTvFeatureSortValue,
  matchesTvAdditionalFeature,
  matchesTvFeature,
  TV_FEATURE_CATALOG,
} from "../../utils/tvPopularFeatures";
import {
  TV_MAX_PRICE,
  TV_MIN_PRICE,
  TV_PRICE_STEP,
} from "../../utils/tvPriceRanges";
import { isPublishedProduct } from "../../utils/publishedProducts";
import { fetchPublicJson } from "../../utils/publicJsonRequest";
import "../../styles/hideScrollbar.css";
import MobileListingControls, {
  MobileSortSheet,
} from "../ui/MobileListingControls";

const SITE_ORIGIN = "https://tryhook.shop";
const TV_MOBILE_SORT_OPTIONS = [
  {
    value: "featured",
    label: "Featured TVs",
    description: "Recommended televisions first",
  },
  {
    value: "price-low",
    label: "Price: Low to High",
    description: "Budget-friendly televisions first",
  },
  {
    value: "price-high",
    label: "Price: High to Low",
    description: "Premium televisions first",
  },
  {
    value: "newest",
    label: "Newest First",
    description: "Recent television entries first",
  },
];

// Enhanced Image Carousel
const ImageCarousel = ({ images = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const imageFrameClass =
    "relative flex h-44 w-32 items-center justify-center overflow-hidden rounded-2xl bg-gray-100 sm:h-48 sm:w-32 lg:h-52 lg:w-36";
  const imageClass = "h-full w-full object-contain p-0.5 sm:p-2";

  useEffect(() => {
    setCurrentIndex(0);
  }, [images]);

  if (!images || images.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className={imageFrameClass}>
          <div className="px-3 text-center">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-gray-200">
              <FaTv className="text-gray-400 text-sm" />
            </div>
            <span className="text-xs text-gray-500">No image</span>
          </div>
        </div>
      </div>
    );
  }

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

const CircularScoreBadge = ({ score, size = 42 }) => {
  const normalized = clampScore100(score);
  const value = normalized != null ? Math.round(normalized) : null;
  if (value == null) return null;

  return (
    <div
      className="inline-flex items-center gap-1.5 leading-none"
      style={{ minWidth: `${Math.max(48, Math.round(size * 1.8))}px` }}
      aria-label={
        value != null ? `Spec score ${value} percent` : "Spec score unavailable"
      }
    >
      <span className="text-[34px] font-semibold leading-none text-blue-600 sm:text-[38px]">
        {value}
      </span>
      <span className="flex flex-col text-[7px] font-semibold uppercase tracking-[0.28em] text-blue-400 leading-[0.92]">
        <span>SPEC</span>
        <span>SCORE</span>
      </span>
    </div>
  );
};

// Helper function to get appliance type icon
const getApplianceTypeIcon = (type) => {
  switch (type?.toLowerCase()) {
    case "washing_machine":
    case "washing machine":
      return FaShower;
    case "refrigerator":
    case "fridge":
      return FaSnowflake;
    case "air_conditioner":
    case "air conditioner":
      return FaWind;
    case "television":
    case "tv":
      return FaTv;
    case "microwave":
      return FaFire;
    case "oven":
      return FaThermometerHalf;
    case "dishwasher":
      return FaUtensils;
    case "vacuum_cleaner":
    case "vacuum cleaner":
      return FaFan;
    default:
      return FaHome;
  }
};

// Fallback mock (kept empty; real data loads from API via Redux)
const mockHomeAppliances = [];

const TVs = () => {
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
    .smooth-transition {
      transition: all 0.3s ease-in-out;
    }
    .fade-in-up {
      animation: slideUp 0.5s ease-out forwards;
    }
  `;

  const { getLogo, getStore, getStoreLogo } = useStoreLogos();
  const deviceFieldProfiles = useDeviceFieldProfiles();
  const RUPEE_SYMBOL = "\u20B9";
  const [showHeroDescription, setShowHeroDescription] = useState(false);

  const formatRupeeNumber = (value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return "Price not available";
    return `${RUPEE_SYMBOL}${numeric.toLocaleString("en-IN")}`;
  };

  // Helper function to extract numeric price
  const extractNumericPrice = (price) => {
    if (!price || price === "NaN") return 0;
    const numeric = parseInt(String(price).replace(/[^0-9]/g, ""));
    return isNaN(numeric) ? 0 : numeric;
  };

  // Helper function to format price display
  const formatPriceDisplay = (price) => {
    const numeric = extractNumericPrice(price);
    return numeric > 0 ? formatRupeeNumber(numeric) : "Price not available";
  };

  const buildStoreSearchUrl = (storeName, query) => {
    const normalizedStore = String(storeName || "")
      .toLowerCase()
      .trim();
    const normalizedQuery = String(query || "").trim();
    if (!normalizedStore || !normalizedQuery) return "";
    if (normalizedStore.includes("base price")) return "";

    const encodedQuery = encodeURIComponent(normalizedQuery);
    if (normalizedStore.includes("amazon")) {
      return `https://www.amazon.in/s?k=${encodedQuery}`;
    }
    if (normalizedStore.includes("flipkart")) {
      return `https://www.flipkart.com/search?q=${encodedQuery}`;
    }
    if (normalizedStore.includes("croma")) {
      return `https://www.croma.com/searchB?q=${encodedQuery}%3Arelevance`;
    }
    if (normalizedStore.includes("reliance")) {
      return `https://www.reliancedigital.in/search?q=${encodedQuery}`;
    }
    if (normalizedStore.includes("vijay sales")) {
      return `https://www.vijaysales.com/search/${encodedQuery}`;
    }

    return `https://www.google.com/search?q=${encodeURIComponent(
      `${storeName} ${normalizedQuery}`,
    )}`;
  };

  const getStoreVisitUrl = (rawUrl, storeName, query) => {
    const resolvedUrl = String(rawUrl || "").trim();
    if (/^https?:\/\//i.test(resolvedUrl)) return resolvedUrl;
    if (/^\/\//.test(resolvedUrl)) return `https:${resolvedUrl}`;
    return buildStoreSearchUrl(storeName, query);
  };

  const isLikelyImageSrc = (src) => {
    if (typeof src !== "string") return false;
    const value = src.trim();
    if (!value) return false;
    return /^(https?:\/\/|\/\/|\/|data:image\/)/i.test(value);
  };

  // Helper to extract numeric capacity from string like "7kg", "320L"
  const extractCapacityValue = (capacityStr) => {
    if (!capacityStr) return 0;
    const match = capacityStr.match(/(\d+(\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
  };

  // Helper to extract energy rating star count
  const extractEnergyRating = (ratingStr) => {
    if (!ratingStr) return 0;
    const match = ratingStr.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  };

  const normalizeScore100 = (value) => {
    const n = Number(value);
    if (!Number.isFinite(n)) return null;
    if (n <= 1) return Math.max(0, Math.min(100, n * 100));
    if (n <= 10) return Math.max(0, Math.min(100, n * 10));
    return Math.max(0, Math.min(100, n));
  };

  const resolveTvSpecScore = (device, fallbackScore = null) => {
    const directScore = normalizeScore100(
      device?.spec_score ?? device?.specScore,
    );
    if (directScore != null) return directScore;

    const derivedScore = normalizeScore100(fallbackScore);
    if (derivedScore != null) return derivedScore;

    return normalizeScore100(
      device?.spec_score_display ??
        device?.specScoreDisplay ??
        device?.overall_score_display ??
        device?.overallScoreDisplay ??
        device?.overall_score ??
        device?.overallScore ??
        device?.spec_score_v2 ??
        device?.specScoreV2 ??
        device?.overall_score_v2 ??
        device?.overallScoreV2,
    );
  };

  // Map API response to device format
  const mapApiToDevice = (apiDevice, idx) => {
    const images = apiDevice.images || [];
    const variants = Array.isArray(apiDevice.variants)
      ? apiDevice.variants
      : [];

    // Aggregate store prices from variants
    let storePrices = [];
    if (variants.length > 0) {
      storePrices = variants.flatMap((v) => {
        const prices = Array.isArray(v.store_prices)
          ? v.store_prices.map((sp) => ({
              id: sp.id,
              variant_id: v.variant_id,
              store: sp.store_name || sp.store || "Store",
              price: sp.price,
              url: sp.url,
              offer_text: sp.offer_text,
              delivery_info: sp.delivery_info,
            }))
          : [];
        if (prices.length === 0 && v.base_price) {
          return [
            {
              id: `v-${v.variant_id || "unknown"}`,
              variant_id: v.variant_id,
              store: "Base Price",
              price: v.base_price,
            },
          ];
        }
        return prices;
      });
    }

    // Compute numeric price
    let numericPrice = 0;
    if (variants.length > 0) {
      const allPrices = variants
        .flatMap((v) => {
          const base = v.base_price || 0;
          const storePrices = Array.isArray(v.store_prices)
            ? v.store_prices.map((sp) => sp.price).filter(Boolean)
            : [];
          return [base, ...storePrices];
        })
        .map((p) => extractNumericPrice(p))
        .filter((p) => p > 0);

      numericPrice = allPrices.length > 0 ? Math.min(...allPrices) : 0;
    }

    // Extract specs based on appliance type
    const capacity = extractCapacityValue(
      apiDevice.specifications?.capacity || "",
    );
    const energyRating = extractEnergyRating(
      apiDevice.performance?.energy_rating || "",
    );
    const releaseYear =
      apiDevice.release_year || new Date(apiDevice.created_at).getFullYear();

    // Determine appliance type display name
    const applianceTypeDisplay = apiDevice.appliance_type
      ? apiDevice.appliance_type
          .replace(/_/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase())
      : "Home Appliance";

    return {
      id: apiDevice.product_id || idx + 1,
      // normalized identity for compare
      productId: apiDevice.product_id || apiDevice.id || idx + 1,
      productType: "home-appliance",
      name: apiDevice.name || "",
      brand: apiDevice.brand_name || "",
      applianceType: apiDevice.appliance_type || "",
      applianceTypeDisplay,
      model: apiDevice.model_number || "",
      price: formatPriceDisplay(numericPrice),
      numericPrice,
      image: images[0] || "",
      images,
      specs: {
        // Common specs
        type: apiDevice.specifications?.type || "",
        capacity: apiDevice.specifications?.capacity || "",
        energyRating: apiDevice.performance?.energy_rating || "",
        features: apiDevice.features || [],
        warranty: apiDevice.warranty?.product || "",

        // Appliance-specific specs
        // Washing Machine
        motor: apiDevice.specifications?.motor || "",
        spinSpeed: apiDevice.specifications?.spin_speed || "",
        waterConsumption: apiDevice.performance?.water_consumption || "",

        // Refrigerator
        technology: apiDevice.specifications?.technology || "",

        // Air Conditioner
        acType: apiDevice.specifications?.type || "",
        compressor: apiDevice.specifications?.compressor || "",
        refrigerant: apiDevice.specifications?.refrigerant || "",
        coolingCapacity: apiDevice.performance?.cooling_capacity || "",

        // Television
        screenSize: apiDevice.specifications?.screen_size || "",
        resolution: apiDevice.specifications?.resolution || "",
        displayType: apiDevice.specifications?.display_type || "",
        refreshRate: apiDevice.specifications?.refresh_rate || "",

        // Physical
        dimensions: apiDevice.physical_details
          ? `${apiDevice.physical_details.width || ""} x ${
              apiDevice.physical_details.height || ""
            } x ${apiDevice.physical_details.depth || ""}`
          : "",
        weight: apiDevice.physical_details?.weight || "",
        color: apiDevice.physical_details?.color || "",
      },
      numericCapacity: capacity,
      numericEnergyRating: energyRating,
      releaseYear,
      launchDate: apiDevice.created_at || "",
      storePrices,
      variants,
      features: apiDevice.features || [],
      warrantyDetails: apiDevice.warranty || {},
      country: apiDevice.country_of_origin || "",
      applianceTypeIcon: getApplianceTypeIcon(apiDevice.appliance_type),
    };
  };

  // TV-aware mapping for the new API payload shape.
  const toObjectIfNeeded = (value) => {
    if (!value) return {};
    if (typeof value === "object" && !Array.isArray(value)) return value;
    if (typeof value !== "string") return {};
    const t = value.trim();
    if (!t) return {};
    if ((t.startsWith("{") && t.endsWith("}")) || t.startsWith("[")) {
      try {
        const parsed = JSON.parse(t);
        return parsed && typeof parsed === "object" && !Array.isArray(parsed)
          ? parsed
          : {};
      } catch {
        return {};
      }
    }
    return {};
  };

  const toArrayIfNeeded = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value !== "string") return [];
    const t = value.trim();
    if (!t) return [];
    if (t.startsWith("[") || t.startsWith("{")) {
      try {
        const parsed = JSON.parse(t);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  const toDisplayText = (value) => {
    if (value === null || value === undefined) return "";

    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return "";
      const lower = trimmed.toLowerCase();
      if (lower === "null" || lower === "undefined" || lower === "nan") {
        return "";
      }
      return trimmed;
    }

    if (typeof value === "number") {
      return Number.isFinite(value) ? String(value) : "";
    }

    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    }

    if (Array.isArray(value)) {
      const parts = value.map((item) => toDisplayText(item)).filter(Boolean);
      return parts.join(", ");
    }

    return "";
  };

  const sanitizeObjectForDisplay = (value) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    const sanitized = {};
    Object.entries(value).forEach(([key, val]) => {
      const text = toDisplayText(val);
      if (text) sanitized[key] = text;
    });
    return sanitized;
  };

  const firstNonEmpty = (...values) => {
    for (const value of values) {
      const text = toDisplayText(value);
      if (text) return text;
    }
    return "";
  };

  const normalizeLooseKey = (value) =>
    String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

  const extractVariantSpecificValue = (rawValue, variantSizeLabel) => {
    const sizeLabel = toDisplayText(variantSizeLabel);
    if (!sizeLabel) return toDisplayText(rawValue);

    if (rawValue && typeof rawValue === "object" && !Array.isArray(rawValue)) {
      const targetKey = normalizeLooseKey(sizeLabel);
      const matchedEntry = Object.entries(rawValue).find(([key]) => {
        const normalizedKey = normalizeLooseKey(key);
        return (
          normalizedKey === targetKey ||
          normalizedKey.includes(targetKey) ||
          targetKey.includes(normalizedKey)
        );
      });
      if (matchedEntry) {
        return toDisplayText(matchedEntry[1]);
      }
    }

    const rawText = toDisplayText(rawValue);
    if (!rawText) return "";

    const segments = rawText
      .split("|")
      .map((segment) => segment.trim())
      .filter(Boolean);
    if (segments.length > 1) {
      const targetKey = normalizeLooseKey(sizeLabel);
      const matchedSegment = segments.find((segment) =>
        normalizeLooseKey(segment).includes(targetKey),
      );
      if (matchedSegment) {
        const colonIndex = matchedSegment.indexOf(":");
        return colonIndex >= 0
          ? matchedSegment.slice(colonIndex + 1).trim()
          : matchedSegment;
      }
    }

    return rawText;
  };

  const toNumericPrice = (value) => {
    if (value === null || value === undefined || value === "") return null;
    if (typeof value === "number") {
      return Number.isFinite(value) ? value : null;
    }
    const cleaned = String(value).replace(/[^0-9.]/g, "");
    if (!cleaned) return null;
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const normalizeTvStoreRows = (storeRows, fallbackKeyPrefix = "tv-store") => {
    const rows = (
      Array.isArray(storeRows) ? storeRows : toArrayIfNeeded(storeRows)
    )
      .map((row, rowIndex) => {
        const storeName = firstNonEmpty(
          row?.store_name,
          row?.store,
          row?.storeName,
        );
        if (!storeName) return null;
        const normalizedPrice = toNumericPrice(row?.price ?? row?.amount);
        return {
          ...row,
          id: row?.id || `${fallbackKeyPrefix}-${rowIndex}`,
          store_name: storeName,
          price: normalizedPrice,
          url: row?.url || row?.link || "",
          offer_text: row?.offer_text || row?.offer || null,
          delivery_info: row?.delivery_info || row?.delivery_time || null,
        };
      })
      .filter(Boolean);

    const byStore = new Map();
    rows.forEach((row) => {
      const key = String(row.store_name || "")
        .trim()
        .toLowerCase();
      if (!key) return;
      const prev = byStore.get(key);
      if (!prev) {
        byStore.set(key, row);
        return;
      }
      const prevPrice = toNumericPrice(prev.price);
      const nextPrice = toNumericPrice(row.price);
      const shouldReplace =
        (nextPrice !== null && prevPrice === null) ||
        (nextPrice !== null && prevPrice !== null && nextPrice < prevPrice);
      if (shouldReplace) byStore.set(key, row);
    });

    return Array.from(byStore.values()).sort((a, b) => {
      const pa = toNumericPrice(a.price);
      const pb = toNumericPrice(b.price);
      if (pa !== null && pb !== null && pa !== pb) return pa - pb;
      if (pa !== null && pb === null) return -1;
      if (pa === null && pb !== null) return 1;
      return String(a.store_name || "").localeCompare(
        String(b.store_name || ""),
      );
    });
  };

  const normalizeTvVariantImages = (variantLike) => {
    const images = [
      ...toArrayIfNeeded(variantLike?.images_json),
      ...(Array.isArray(variantLike?.images) ? variantLike.images : []),
      ...(Array.isArray(variantLike?.variant_images)
        ? variantLike.variant_images
        : []),
      ...toArrayIfNeeded(variantLike?.variant_images_json),
    ]
      .map((img) => String(img || "").trim())
      .filter(Boolean);

    return Array.from(new Set(images));
  };

  const mapTvApiToDevice = (apiDevice, idx) => {
    const legacy = mapApiToDevice(apiDevice, idx);
    const basicInfo = toObjectIfNeeded(
      apiDevice.basic_info_json || apiDevice.basic_info,
    );
    const keySpecs = toObjectIfNeeded(
      apiDevice.key_specs_json ||
        apiDevice.key_specs ||
        apiDevice.specifications,
    );
    const displayJson = toObjectIfNeeded(
      apiDevice.display_json || apiDevice.display,
    );
    const videoEngineJson = toObjectIfNeeded(
      apiDevice.video_engine_json ||
        apiDevice.video_engine ||
        apiDevice.videoEngine ||
        apiDevice.performance_json ||
        apiDevice.performance,
    );
    const audioJson = toObjectIfNeeded(apiDevice.audio_json || apiDevice.audio);
    const smartTvJson = toObjectIfNeeded(
      apiDevice.smart_tv_json || apiDevice.smart_tv,
    );
    const connectivityJson = toObjectIfNeeded(
      apiDevice.connectivity_json || apiDevice.connectivity,
    );
    const portsJson = toObjectIfNeeded(apiDevice.ports_json || apiDevice.ports);
    const powerJson = toObjectIfNeeded(apiDevice.power_json || apiDevice.power);
    const physicalJson = toObjectIfNeeded(
      apiDevice.physical_json ||
        apiDevice.physical ||
        apiDevice.physical_details ||
        apiDevice.dimensions_json ||
        apiDevice.dimensions,
    );
    const dimensionsJson = toObjectIfNeeded(
      apiDevice.dimensions_json ||
        apiDevice.dimensions ||
        apiDevice.physical_details ||
        physicalJson,
    );
    const designJson = toObjectIfNeeded(
      apiDevice.design_json || apiDevice.design,
    );
    const gamingJson = toObjectIfNeeded(
      apiDevice.gaming_json || apiDevice.gaming,
    );
    const warrantyJson = toObjectIfNeeded(
      apiDevice.warranty_json || apiDevice.warranty,
    );
    const productDetailsJson = toObjectIfNeeded(
      apiDevice.product_details_json || apiDevice.product_details,
    );
    const inTheBoxJson = toObjectIfNeeded(
      apiDevice.in_the_box_json || apiDevice.in_the_box,
    );

    const images = (() => {
      const fromJson = toArrayIfNeeded(apiDevice.images_json);
      if (fromJson.length) return fromJson.filter(Boolean);
      if (Array.isArray(apiDevice.images))
        return apiDevice.images.filter(Boolean);
      return [];
    })();

    const rawVariants = Array.isArray(apiDevice.variants_json)
      ? apiDevice.variants_json
      : Array.isArray(apiDevice.variants)
        ? apiDevice.variants
        : toArrayIfNeeded(apiDevice.variants_json || apiDevice.variants);
    const fallbackTopLevelStores = normalizeTvStoreRows(
      apiDevice.store_prices || apiDevice.storePrices || [],
      `${idx}-top`,
    );

    const variants = rawVariants.map((v, vIdx) => {
      const attributes = toObjectIfNeeded(v?.attributes);
      const variantScreenSize = firstNonEmpty(
        v.screen_size,
        v.size,
        attributes.screen_size,
        attributes.size,
        keySpecs.screen_size,
        displayJson.screen_size,
      );
      const variantSummary = firstNonEmpty(
        v.specification_summary,
        v.variant_key,
        variantScreenSize,
        attributes.resolution,
        keySpecs.resolution,
      );
      const variantStores = normalizeTvStoreRows(
        Array.isArray(v.store_prices)
          ? v.store_prices
          : Array.isArray(v.storePrices)
            ? v.storePrices
            : Array.isArray(attributes.store_prices)
              ? attributes.store_prices
              : [],
        `${idx}-${vIdx}`,
      );
      const variantImages = normalizeTvVariantImages({
        ...attributes,
        ...v,
      });
      const basePrice = toNumericPrice(
        v.base_price ?? v.price ?? attributes.base_price,
      );

      return {
        ...v,
        ...attributes,
        variant_id:
          v.variant_id ||
          v.id ||
          v.variantId ||
          v.variant_key ||
          `${idx}-${vIdx}`,
        variant_key: firstNonEmpty(
          v.variant_key,
          attributes.variant_key,
          variantScreenSize,
          `${idx}-${vIdx}`,
        ),
        base_price: basePrice,
        screen_size: variantScreenSize || "",
        screen_size_value:
          v.screen_size_value ?? extractCapacityValue(variantScreenSize || ""),
        specification_summary: variantSummary || "",
        images: variantImages,
        store_prices: variantStores.length
          ? variantStores
          : fallbackTopLevelStores.map((store) => ({ ...store })),
      };
    });

    const aggregatedVariantStores = variants.flatMap((v) => {
      const prices = normalizeTvStoreRows(
        v.store_prices,
        `${v.variant_id}-agg`,
      ).map((sp, spIdx) => ({
        id: sp.id || `${v.variant_id}-${spIdx}`,
        variant_id: v.variant_id,
        store: sp.store_name || sp.store || "Store",
        price: sp.price,
        url: sp.url,
        offer_text: sp.offer_text,
        delivery_info: sp.delivery_info,
      }));
      if (prices.length === 0 && v.base_price) {
        return [
          {
            id: `v-${v.variant_id || "unknown"}`,
            variant_id: v.variant_id,
            store: "Base Price",
            price: v.base_price,
          },
        ];
      }
      return prices;
    });
    const storePrices = aggregatedVariantStores.length
      ? aggregatedVariantStores
      : fallbackTopLevelStores.map((store, storeIndex) => ({
          id: store.id || `${idx}-fallback-${storeIndex}`,
          variant_id: null,
          store: store.store_name || "Store",
          price: store.price,
          url: store.url || "",
          offer_text: store.offer_text || null,
          delivery_info: store.delivery_info || null,
        }));

    const numericCandidates = [];
    storePrices.forEach((sp) => {
      const p = toNumericPrice(sp.price);
      if (p !== null && p > 0) numericCandidates.push(p);
    });
    variants.forEach((v) => {
      const base = extractNumericPrice(v.base_price);
      if (base > 0) numericCandidates.push(base);
      (v.store_prices || []).forEach((sp) => {
        const p = extractNumericPrice(sp.price);
        if (p > 0) numericCandidates.push(p);
      });
    });
    const numericPrice = numericCandidates.length
      ? Math.min(...numericCandidates)
      : 0;
    const profileSource = {
      ...apiDevice,
      basic_info_json: basicInfo,
      key_specs_json: keySpecs,
      display_json: displayJson,
      video_engine_json: videoEngineJson,
      audio_json: audioJson,
      smart_tv_json: smartTvJson,
      connectivity_json: connectivityJson,
      ports_json: portsJson,
      power_json: powerJson,
      physical_json: physicalJson,
      product_details_json: productDetailsJson,
      in_the_box_json: inTheBoxJson,
      warranty_json: warrantyJson,
      images,
      variants,
      variants_json: variants,
    };
    const profileResult = resolveDeviceFieldProfile(
      "tv",
      profileSource,
      deviceFieldProfiles,
    );
    const profileDisplay = profileResult.display_display || {};
    const overallScoreRaw = resolveTvSpecScore(apiDevice, profileResult.score);

    const screenSize = firstNonEmpty(
      keySpecs.screen_size,
      displayJson.screen_size,
      variants[0]?.screen_size,
      profileDisplay.screen_size,
    );
    const resolution = firstNonEmpty(
      keySpecs.resolution,
      displayJson.resolution,
      profileDisplay.resolution,
    );
    const refreshRate = firstNonEmpty(
      keySpecs.refresh_rate,
      displayJson.refresh_rate,
      profileDisplay.refresh_rate,
    );
    const panelType = firstNonEmpty(
      keySpecs.panel_type,
      displayJson.panel_type,
      profileDisplay.panel_type,
    );
    const operatingSystem = firstNonEmpty(
      keySpecs.operating_system,
      smartTvJson.operating_system,
      profileDisplay.os,
    );
    const rawEnergyRating = firstNonEmpty(
      powerJson.energy_rating,
      powerJson.energy_star_rating,
      keySpecs.energy_rating,
      keySpecs.energy_star_rating,
      profileDisplay.energy_rating,
    );
    const energyRating =
      rawEnergyRating && /^\d+(\.\d+)?$/.test(String(rawEnergyRating))
        ? `${rawEnergyRating} Star`
        : rawEnergyRating;

    const features = [
      ...(Array.isArray(keySpecs.hdr_support) ? keySpecs.hdr_support : []),
      ...(Array.isArray(keySpecs.ai_features) ? keySpecs.ai_features : []),
      ...(Array.isArray(displayJson.gaming_features)
        ? displayJson.gaming_features
        : []),
      ...(Array.isArray(audioJson.audio_features)
        ? audioJson.audio_features
        : []),
      ...(Array.isArray(smartTvJson.supported_apps)
        ? smartTvJson.supported_apps
        : []),
      ...(Array.isArray(smartTvJson.voice_assistant)
        ? smartTvJson.voice_assistant
        : []),
      ...(Array.isArray(gamingJson.extra_features)
        ? gamingJson.extra_features
        : []),
    ]
      .map((feature) => toDisplayText(feature))
      .filter(Boolean);

    const releaseYear =
      apiDevice.release_year ||
      basicInfo.launch_year ||
      (apiDevice.created_at
        ? new Date(apiDevice.created_at).getFullYear()
        : null);

    const applianceTypeRaw = firstNonEmpty(
      apiDevice.appliance_type,
      apiDevice.category,
      apiDevice.product_type,
      "television",
    );
    const applianceTypeDisplay = /tv|television/i.test(
      String(applianceTypeRaw).toLowerCase(),
    )
      ? "Television"
      : String(applianceTypeRaw)
          .replace(/_/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase());

    const capacity = extractCapacityValue(screenSize || "");
    const numericEnergyRating = extractEnergyRating(String(energyRating || ""));
    const dimensions = [
      dimensionsJson.width,
      dimensionsJson.height,
      dimensionsJson.depth,
    ]
      .filter(Boolean)
      .join(" x ");

    const productName = firstNonEmpty(
      apiDevice.product_name,
      apiDevice.name,
      basicInfo.title,
      apiDevice.model,
    );
    const brandName = firstNonEmpty(
      apiDevice.brand_name,
      apiDevice.brand,
      basicInfo.brand_name,
      basicInfo.brand,
    );

    const sanitizedWarrantyDetails = sanitizeObjectForDisplay(warrantyJson);

    return {
      ...legacy,
      ...apiDevice,
      id: apiDevice.product_id || apiDevice.id || idx + 1,
      productId: apiDevice.product_id || apiDevice.id || idx + 1,
      productType: "home-appliance",
      name: productName || "",
      brand: brandName || "",
      applianceType: /tv|television/i.test(
        String(applianceTypeRaw).toLowerCase(),
      )
        ? "television"
        : applianceTypeRaw,
      applianceTypeDisplay,
      model: firstNonEmpty(
        apiDevice.model,
        basicInfo.model_number,
        apiDevice.model_number,
      ),
      spec_score: overallScoreRaw,
      overall_score: overallScoreRaw,
      spec_score_v2: overallScoreRaw,
      overall_score_v2: overallScoreRaw,
      spec_score_display: overallScoreRaw,
      overall_score_display: overallScoreRaw,
      price: formatPriceDisplay(numericPrice),
      numericPrice,
      image: images[0] || "",
      images,
      specs: {
        type: firstNonEmpty(panelType, keySpecs.category, "Smart TV"),
        capacity: screenSize || "",
        energyRating: energyRating || "",
        warranty: firstNonEmpty(
          warrantyJson.product_warranty,
          warrantyJson.product,
          warrantyJson.warranty,
        ),
        screenSize: screenSize || "",
        resolution: resolution || "",
        displayType: panelType || "",
        refreshRate: refreshRate || "",
        operatingSystem: operatingSystem || "",
        hdr:
          (Array.isArray(keySpecs.hdr_support) &&
            keySpecs.hdr_support.join(", ")) ||
          (Array.isArray(displayJson.hdr_formats) &&
            displayJson.hdr_formats.join(", ")) ||
          "",
        audioOutput: firstNonEmpty(
          keySpecs.audio_output,
          audioJson.output_power,
          profileDisplay.audio_output,
        ),
        hdmi: firstNonEmpty(portsJson.hdmi),
        usb: firstNonEmpty(portsJson.usb),
        wifi: firstNonEmpty(connectivityJson.wifi),
        bluetooth: firstNonEmpty(connectivityJson.bluetooth),
        dimensions: firstNonEmpty(dimensions),
        weight: firstNonEmpty(dimensionsJson.weight),
        color: firstNonEmpty(designJson.body_color, designJson.stand_color),
      },
      numericCapacity: capacity,
      numericEnergyRating,
      releaseYear,
      launchDate: apiDevice.created_at || "",
      storePrices,
      variants,
      features,
      warrantyDetails: sanitizedWarrantyDetails,
      country: firstNonEmpty(
        warrantyJson.country_of_origin,
        productDetailsJson.country_of_origin,
        apiDevice.country_of_origin,
      ),
      applianceTypeIcon: getApplianceTypeIcon(applianceTypeRaw),
      basic_info_json: basicInfo,
      key_specs_json: keySpecs,
      display_json: displayJson,
      video_engine_json: videoEngineJson,
      audio_json: audioJson,
      smart_tv_json: smartTvJson,
      connectivity_json: connectivityJson,
      ports_json: portsJson,
      power_json: powerJson,
      physical_json: physicalJson,
      dimensions_json: dimensionsJson,
      design_json: designJson,
      gaming_json: gamingJson,
      product_details_json: productDetailsJson,
      in_the_box_json: inTheBoxJson,
      warranty_json: warrantyJson,
      field_profile: profileResult,
    };
  };

  // Use Redux-provided home appliances (via `useDevice`) or fallback to mock
  const { homeAppliances, homeAppliancesLoading, setDevices } = useDevice({
    resources: ["tvs"],
  });

  const sourceDevices =
    Array.isArray(homeAppliances) && homeAppliances.length
      ? homeAppliances
      : mockHomeAppliances;

  const devices = sourceDevices.map((device, i) => mapTvApiToDevice(device, i));

  // Register normalized devices into global device store so Compare can see them
  useEffect(() => {
    if (typeof setDevices !== "function") return;

    try {
      const current = Array.isArray(homeAppliances) ? homeAppliances : [];

      // Quick identity check: if lengths differ, update
      if (current.length !== (devices || []).length) {
        setDevices("home-appliance", devices || []);
        return;
      }

      // Compare by id/product_id/productId to avoid shallow-reference updates
      const currentIds = new Set(
        current.map((d) => d.id || d.product_id || d.productId),
      );

      const hasDifference = (devices || []).some(
        (d) => !currentIds.has(d.id || d.product_id || d.productId),
      );

      if (hasDifference) {
        setDevices("home-appliance", devices || []);
      }
    } catch (err) {
      // ignore
    }
  }, [devices, setDevices, homeAppliances]);

  // Legacy variant-card flow kept for backward compatibility debugging.
  const legacyVariantCards = devices.flatMap((device) => {
    const vars =
      Array.isArray(device.variants) && device.variants.length
        ? device.variants
        : [];

    if (vars.length === 0) {
      return [{ ...device, id: `${device.id}-default` }];
    }

    return vars.map((v, vIdx) => {
      const rawVariantStorePrices = Array.isArray(v.store_prices)
        ? v.store_prices
        : [];

      const mappedVariantStores = rawVariantStorePrices.map((sp, spIdx) => ({
        id: sp.id || `${device.id}-${v.variant_id || vIdx}-${spIdx}`,
        store: sp.store_name || sp.store || "Store",
        price: sp.price ?? sp.amount ?? null,
        url: sp.url || sp.link || null,
        offer_text: sp.offer_text || sp.offer || null,
        delivery_info: sp.delivery_info || sp.delivery_time || null,
      }));

      const base = v.base_price || 0;

      const storePrices =
        mappedVariantStores.length > 0
          ? mappedVariantStores
          : base > 0
            ? [
                {
                  id: `variant-base-${device.id}-${v.variant_id || vIdx}`,
                  store: "Base Price",
                  price: base,
                  url: null,
                },
              ]
            : device.storePrices || [];

      const candidatePrices = storePrices
        .map((p) => extractNumericPrice(p.price))
        .filter((n) => n > 0);
      const numericPrice = candidatePrices.length
        ? Math.min(...candidatePrices)
        : device.numericPrice || 0;

      const price = formatPriceDisplay(numericPrice);

      return {
        ...device,
        id: `${device.id}-${v.variant_id || vIdx}`,
        variant: v,
        storePrices,
        price,
        numericPrice,
        specs: {
          ...device.specs,
          screenSize:
            v.screen_size ||
            device.specs?.screenSize ||
            device.specs?.capacity ||
            "",
          capacity:
            v.screen_size ||
            device.specs?.capacity ||
            device.specs?.screenSize ||
            "",
        },
      };
    });
  });

  const getTvVariantIdentity = (variant, fallbackIndex = 0) =>
    String(
      variant?.variant_id ??
        variant?.id ??
        variant?.variant_key ??
        `variant-${fallbackIndex}`,
    );

  const mapVariantStorePrices = (device, variant) => {
    const rawVariantStorePrices = normalizeTvStoreRows(
      Array.isArray(variant?.store_prices) ? variant.store_prices : [],
      `${device.id}-${getTvVariantIdentity(variant, 0)}`,
    );

    const mappedVariantStores = rawVariantStorePrices.map((sp, spIdx) => {
      const storeName = sp.store_name || sp.store || sp.storeName || "Store";
      const storeObj = getStore ? getStore(storeName) : null;
      const logo =
        (getStoreLogo ? getStoreLogo(storeName) : null) ||
        getLogo(storeName) ||
        null;
      return {
        id:
          sp.id ||
          `${device.id}-${getTvVariantIdentity(variant, spIdx)}-${spIdx}`,
        store: storeName,
        storeObj,
        logo,
        price: sp.price ?? sp.amount ?? null,
        url: sp.url || sp.link || null,
        offer_text: sp.offer_text || sp.offer || null,
        delivery_info: sp.delivery_info || sp.delivery_time || null,
      };
    });

    // Keep one row per store (lowest valid price first) for a cleaner card view.
    const dedupedByStore = [];
    const bestByStore = new Map();
    mappedVariantStores.forEach((storeRow) => {
      const key = String(storeRow?.store || "")
        .trim()
        .toLowerCase();
      if (!key) return;
      const price = extractNumericPrice(storeRow?.price);
      const previous = bestByStore.get(key);
      if (!previous) {
        bestByStore.set(key, storeRow);
        return;
      }
      const prevPrice = extractNumericPrice(previous?.price);
      const shouldReplace =
        (price > 0 && prevPrice <= 0) || (price > 0 && price < prevPrice);
      if (shouldReplace) bestByStore.set(key, storeRow);
    });
    bestByStore.forEach((value) => dedupedByStore.push(value));
    dedupedByStore.sort((a, b) => {
      const pa = extractNumericPrice(a?.price);
      const pb = extractNumericPrice(b?.price);
      if (pa > 0 && pb > 0 && pa !== pb) return pa - pb;
      if (pa > 0 && pb <= 0) return -1;
      if (pb > 0 && pa <= 0) return 1;
      return String(a?.store || "").localeCompare(String(b?.store || ""));
    });

    if (dedupedByStore.length > 0) return dedupedByStore;

    const fallbackDeviceStores = Array.isArray(device?.storePrices)
      ? device.storePrices
      : [];
    if (fallbackDeviceStores.length > 0) {
      return fallbackDeviceStores.map((store, storeIndex) => ({
        ...store,
        id:
          store.id ||
          `${device.id}-${getTvVariantIdentity(variant, 0)}-fallback-${storeIndex}`,
      }));
    }

    const base = variant?.base_price || 0;
    if (extractNumericPrice(base) > 0) {
      return [
        {
          id: `variant-base-${device.id}-${getTvVariantIdentity(variant, 0)}`,
          store: "Base Price",
          price: base,
          url: null,
        },
      ];
    }

    return [];
  };

  const resolveDeviceWithVariant = (device, variant) => {
    if (!variant) return device;

    const storePrices = mapVariantStorePrices(device, variant);
    const candidatePrices = storePrices
      .map((p) => extractNumericPrice(p.price))
      .filter((n) => n > 0);
    const variantBasePrice = extractNumericPrice(variant?.base_price);
    const numericPrice = candidatePrices.length
      ? Math.min(...candidatePrices)
      : variantBasePrice > 0
        ? variantBasePrice
        : device.numericPrice || 0;

    const price = formatPriceDisplay(numericPrice);

    const resolvedScreenSize = firstNonEmpty(
      variant?.screen_size,
      variant?.size,
      device.specs?.screenSize,
      device.specs?.capacity,
    );
    const variantSummary = firstNonEmpty(variant?.specification_summary);
    const variantSummaryIsSize =
      normalizeLooseKey(variantSummary) ===
      normalizeLooseKey(resolvedScreenSize);
    const usableVariantSummary = variantSummaryIsSize ? "" : variantSummary;
    const resolvedResolution = firstNonEmpty(
      variant?.resolution,
      usableVariantSummary,
      variant?.variant_resolution,
      variant?.attributes?.resolution,
      extractVariantSpecificValue(device.specs?.resolution, resolvedScreenSize),
      device.specs?.resolution,
    );
    const resolvedRefreshRate = firstNonEmpty(
      variant?.refresh_rate,
      variant?.attributes?.refresh_rate,
      extractVariantSpecificValue(
        device.specs?.refreshRate,
        resolvedScreenSize,
      ),
      device.specs?.refreshRate,
    );
    const resolvedPanelType = firstNonEmpty(
      variant?.panel_type,
      variant?.display_type,
      variant?.attributes?.panel_type,
      extractVariantSpecificValue(
        device.specs?.displayType,
        resolvedScreenSize,
      ),
      device.specs?.displayType,
      device.specs?.type,
    );

    const variantImages = Array.isArray(variant?.images)
      ? variant.images.filter(Boolean)
      : [];
    const resolvedImages = variantImages.length ? variantImages : device.images;

    return {
      ...device,
      variant,
      storePrices,
      price,
      numericPrice,
      image: resolvedImages?.[0] || device.image,
      images: resolvedImages,
      specs: {
        ...device.specs,
        screenSize: resolvedScreenSize || "",
        capacity:
          resolvedScreenSize ||
          device.specs?.capacity ||
          device.specs?.screenSize ||
          "",
        resolution: resolvedResolution || "",
        refreshRate: resolvedRefreshRate || "",
        displayType: resolvedPanelType || "",
      },
      numericCapacity:
        extractCapacityValue(
          resolvedScreenSize ||
            device.specs?.capacity ||
            device.specs?.screenSize ||
            "",
        ) || device.numericCapacity,
    };
  };

  // Product-level TV cards with switchable size variants.
  const variantCards = devices.map((device) => {
    const vars =
      Array.isArray(device.variants) && device.variants.length
        ? device.variants
        : [];

    if (vars.length === 0) {
      return { ...device, availableSizes: [] };
    }

    const normalizedVariants = vars
      .map((variant, vIdx) => ({
        ...variant,
        variant_id:
          variant?.variant_id ||
          variant?.id ||
          variant?.variant_key ||
          `${device.id}-${vIdx}`,
        screen_size: firstNonEmpty(
          variant?.screen_size,
          variant?.size,
          variant?.variant_key,
          device.specs?.screenSize,
          device.specs?.capacity,
        ),
      }))
      .sort((a, b) => {
        const sizeA = extractCapacityValue(a?.screen_size || "");
        const sizeB = extractCapacityValue(b?.screen_size || "");
        if (sizeA !== sizeB) return sizeA - sizeB;
        const priceA = extractNumericPrice(a?.base_price);
        const priceB = extractNumericPrice(b?.base_price);
        return priceA - priceB;
      });

    const getVariantEffectivePrice = (variant) => {
      const stores = mapVariantStorePrices(device, variant);
      const candidateStorePrices = stores
        .map((store) => extractNumericPrice(store?.price))
        .filter((price) => price > 0);
      if (candidateStorePrices.length) return Math.min(...candidateStorePrices);
      return (
        extractNumericPrice(variant?.base_price) || Number.POSITIVE_INFINITY
      );
    };

    const uniqueVariantMap = new Map();
    const variantsWithoutSize = [];
    normalizedVariants.forEach((variant) => {
      const sizeLabel = firstNonEmpty(
        variant?.screen_size,
        variant?.size,
        variant?.variant_key,
      );
      const sizeKey = String(sizeLabel || "")
        .trim()
        .toLowerCase();
      if (!sizeKey) {
        variantsWithoutSize.push(variant);
        return;
      }
      const prev = uniqueVariantMap.get(sizeKey);
      if (!prev) {
        uniqueVariantMap.set(sizeKey, variant);
        return;
      }
      if (getVariantEffectivePrice(variant) < getVariantEffectivePrice(prev)) {
        uniqueVariantMap.set(sizeKey, variant);
      }
    });

    const dedupedVariants = [
      ...Array.from(uniqueVariantMap.values()),
      ...variantsWithoutSize,
    ].sort((a, b) => {
      const sizeA = extractCapacityValue(a?.screen_size || "");
      const sizeB = extractCapacityValue(b?.screen_size || "");
      if (sizeA !== sizeB) return sizeA - sizeB;
      return getVariantEffectivePrice(a) - getVariantEffectivePrice(b);
    });

    const defaultVariant = dedupedVariants.reduce((best, current) => {
      const bestStores = mapVariantStorePrices(device, best);
      const currentStores = mapVariantStorePrices(device, current);
      const bestPriceCandidates = bestStores
        .map((sp) => extractNumericPrice(sp?.price))
        .filter((n) => n > 0);
      const currentPriceCandidates = currentStores
        .map((sp) => extractNumericPrice(sp?.price))
        .filter((n) => n > 0);
      const bestPrice = bestPriceCandidates.length
        ? Math.min(...bestPriceCandidates)
        : extractNumericPrice(best?.base_price);
      const currentPrice = currentPriceCandidates.length
        ? Math.min(...currentPriceCandidates)
        : extractNumericPrice(current?.base_price);

      if (bestPrice <= 0 && currentPrice > 0) return current;
      if (currentPrice > 0 && currentPrice < bestPrice) return current;
      return best;
    }, dedupedVariants[0]);

    const resolved = resolveDeviceWithVariant(
      { ...device, variants: dedupedVariants },
      defaultVariant,
    );

    return {
      ...resolved,
      variants: dedupedVariants,
      availableSizes: dedupedVariants
        .map((variant) =>
          firstNonEmpty(
            variant?.screen_size,
            variant?.size,
            variant?.variant_key,
          ),
        )
        .filter(Boolean),
    };
  });

  // DYNAMIC FILTER EXTRACTION - Based on your design
  const extractDynamicFilters = useMemo(() => {
    const meta = {
      brands: new Set(),
      applianceTypes: new Set(),

      // Washing Machine filters
      loadType: new Set(),
      capacity: new Set(),
      energyRating: new Set(),
      features: new Set(),

      // Refrigerator filters
      doorType: new Set(),
      fridgeTechnology: new Set(),

      // AC filters
      acType: new Set(),
      acCapacity: new Set(),

      // TV filters
      screenSize: new Set(),
      resolution: new Set(),
      tvFeatures: new Set(),

      // Common numeric ranges
      releaseYears: new Set(),
      capacities: new Set(),
    };

    devices.forEach((p) => {
      // Common filters
      meta.brands.add(p.brand);
      meta.applianceTypes.add(p.applianceTypeDisplay);
      meta.releaseYears.add(p.releaseYear);

      // Capacity extraction (numeric for ranges)
      if (p.numericCapacity > 0) {
        meta.capacities.add(p.numericCapacity);
      }

      // Appliance type specific filters
      if (p.applianceType === "washing_machine") {
        if (p.specs.type) meta.loadType.add(p.specs.type);
        if (p.specs.capacity) meta.capacity.add(p.specs.capacity);
        if (p.specs.energyRating) meta.energyRating.add(p.specs.energyRating);
        if (p.features) {
          p.features.forEach((f) => meta.features.add(f));
        }
      } else if (p.applianceType === "refrigerator") {
        if (p.specs.type) meta.doorType.add(p.specs.type);
        if (p.specs.capacity) meta.capacity.add(p.specs.capacity);
        if (p.specs.technology) meta.fridgeTechnology.add(p.specs.technology);
        if (p.specs.energyRating) meta.energyRating.add(p.specs.energyRating);
      } else if (p.applianceType === "air_conditioner") {
        if (p.specs.acType) meta.acType.add(p.specs.acType);
        if (p.specs.capacity) meta.acCapacity.add(p.specs.capacity);
        if (p.specs.energyRating) meta.energyRating.add(p.specs.energyRating);
        if (p.features) {
          p.features.forEach((f) => meta.features.add(f));
        }
      } else if (p.applianceType === "television") {
        const tvVariantSizes = Array.isArray(p.variants)
          ? p.variants
              .map((variant) =>
                firstNonEmpty(
                  variant?.screen_size,
                  variant?.size,
                  variant?.variant_key,
                ),
              )
              .filter(Boolean)
          : [];
        if (tvVariantSizes.length) {
          tvVariantSizes.forEach((sizeText) => {
            meta.screenSize.add(sizeText);
            const numeric = extractCapacityValue(sizeText);
            if (numeric > 0) meta.capacities.add(numeric);
          });
        } else if (p.specs.screenSize) {
          meta.screenSize.add(p.specs.screenSize);
        }
        if (p.specs.resolution) meta.resolution.add(p.specs.resolution);
        if (p.features) {
          p.features.forEach((f) => meta.tvFeatures.add(f));
        }
      }
    });

    // Convert to arrays and sort
    return {
      brands: Array.from(meta.brands).sort(),
      applianceTypes: Array.from(meta.applianceTypes).filter(Boolean).sort(),

      // Washing Machine
      loadType: Array.from(meta.loadType).sort(),
      capacity: Array.from(meta.capacity).sort((a, b) => {
        const numA = extractCapacityValue(a);
        const numB = extractCapacityValue(b);
        return numA - numB;
      }),
      energyRating: Array.from(meta.energyRating).sort((a, b) => {
        const numA = extractEnergyRating(a);
        const numB = extractEnergyRating(b);
        return numB - numA; // Higher stars first
      }),
      features: Array.from(meta.features).sort(),

      // Refrigerator
      doorType: Array.from(meta.doorType).sort(),
      fridgeTechnology: Array.from(meta.fridgeTechnology).sort(),

      // AC
      acType: Array.from(meta.acType).sort(),
      acCapacity: Array.from(meta.acCapacity).sort((a, b) => {
        const numA = extractCapacityValue(a);
        const numB = extractCapacityValue(b);
        return numA - numB;
      }),

      // TV
      screenSize: Array.from(meta.screenSize).sort((a, b) => {
        const numA = extractCapacityValue(a);
        const numB = extractCapacityValue(b);
        return numA - numB;
      }),
      resolution: Array.from(meta.resolution).sort(),
      tvFeatures: Array.from(meta.tvFeatures).sort(),

      // Common
      releaseYears: Array.from(meta.releaseYears)
        .filter(Boolean)
        .sort((a, b) => b - a),

      // Capacity ranges (dynamic)
      capacityRanges: (() => {
        const capacities = Array.from(meta.capacities).sort((a, b) => a - b);
        if (capacities.length === 0) return [];

        const ranges = [];
        for (let i = 0; i < capacities.length; i++) {
          const capacity = capacities[i];
          if (capacity < 10) {
            // For washing machines (kg)
            if (capacity >= 6 && capacity < 7) {
              ranges.push({ id: "6-7kg", label: "6-6.9 kg", min: 6, max: 7 });
            } else if (capacity >= 7 && capacity < 8) {
              ranges.push({ id: "7-8kg", label: "7-7.9 kg", min: 7, max: 8 });
            } else if (capacity >= 8) {
              ranges.push({
                id: "8kg+",
                label: "8 kg+",
                min: 8,
                max: Infinity,
              });
            }
          } else {
            // For refrigerators (L)
            if (capacity >= 200 && capacity < 300) {
              ranges.push({
                id: "200-300L",
                label: "200-300 L",
                min: 200,
                max: 300,
              });
            } else if (capacity >= 300 && capacity < 400) {
              ranges.push({
                id: "300-400L",
                label: "300-400 L",
                min: 300,
                max: 400,
              });
            } else if (capacity >= 400) {
              ranges.push({
                id: "400L+",
                label: "400 L+",
                min: 400,
                max: Infinity,
              });
            }
          }
        }

        // Remove duplicates
        return [...new Map(ranges.map((item) => [item.id, item])).values()];
      })(),
    };
  }, [devices]);

  // Determine which specific filters to show based on selected appliance type
  const getSpecificFiltersForType = (applianceType) => {
    if (!applianceType) return [];

    const type = applianceType.toLowerCase();

    if (type.includes("washing") || type === "washing_machine") {
      return [
        {
          key: "loadType",
          label: "Load Type",
          options: extractDynamicFilters.loadType,
        },
        {
          key: "capacity",
          label: "Capacity",
          options: extractDynamicFilters.capacity,
        },
        {
          key: "energyRating",
          label: "Energy Rating",
          options: extractDynamicFilters.energyRating,
        },
        {
          key: "features",
          label: "Features",
          options: extractDynamicFilters.features,
        },
      ];
    } else if (type.includes("refrigerator") || type.includes("fridge")) {
      return [
        {
          key: "doorType",
          label: "Door Type",
          options: extractDynamicFilters.doorType,
        },
        {
          key: "capacity",
          label: "Capacity",
          options: extractDynamicFilters.capacity,
        },
        {
          key: "energyRating",
          label: "Energy Rating",
          options: extractDynamicFilters.energyRating,
        },
        {
          key: "technology",
          label: "Technology",
          options: extractDynamicFilters.fridgeTechnology,
        },
      ];
    } else if (type.includes("air conditioner") || type === "air_conditioner") {
      return [
        {
          key: "acType",
          label: "AC Type",
          options: extractDynamicFilters.acType,
        },
        {
          key: "acCapacity",
          label: "Capacity",
          options: extractDynamicFilters.acCapacity,
        },
        {
          key: "energyRating",
          label: "Energy Rating",
          options: extractDynamicFilters.energyRating,
        },
        {
          key: "features",
          label: "Features",
          options: extractDynamicFilters.features,
        },
      ];
    } else if (type.includes("television") || type === "tv") {
      return [
        {
          key: "screenSize",
          label: "Screen Size",
          options: extractDynamicFilters.screenSize,
        },
        {
          key: "resolution",
          label: "Resolution",
          options: extractDynamicFilters.resolution,
        },
        {
          key: "features",
          label: "Features",
          options: extractDynamicFilters.tvFeatures,
        },
      ];
    }

    return [];
  };

  // Price range
  const MIN_PRICE = TV_MIN_PRICE;
  const MAX_PRICE = TV_MAX_PRICE;

  const [filters, setFilters] = useState({
    brand: [],
    priceRange: { min: MIN_PRICE, max: MAX_PRICE },
    applianceType: [],
    energyRating: [],
    additionalFeatures: [],
    capacityRange: [],
    releaseYear: [],

    // Specific filters (will be populated based on appliance type)
    specific: {},
  });

  const [sortBy, setSortBy] = useState("featured");
  const [searchQuery, setSearchQuery] = useState("");
  const [brandFilterQuery, setBrandFilterQuery] = useState("");
  const [additionalFeatureQuery, setAdditionalFeatureQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [selectedVariantByProduct, setSelectedVariantByProduct] = useState({});

  // Set page title
  useTitle({
    page: "tvs",
  });

  const navigate = useNavigate();
  const location = useLocation();
  const { search } = location;
  const { featureSlug: routeFeatureSlugParam } = useParams();
  const [params] = useSearchParams();
  const normalizedPathname =
    String(location.pathname || "/").replace(/\/+$/g, "") || "/";
  const isLatestPath = normalizedPathname === "/tvs/latest";
  const routeFeatureSlug = String(routeFeatureSlugParam || "")
    .trim()
    .toLowerCase();
  const routeFeatureMeta = getTvRouteFeatureMeta(routeFeatureSlug);
  const filter = isLatestPath ? "new" : params.get("filter");
  const feature = routeFeatureMeta?.id || params.get("feature");
  const normalizedFeature = feature
    ? feature.toString().toLowerCase().replace(/\s+/g, "-")
    : null;
  const dispatch = useDispatch();
  const [popularFeatureOrder, setPopularFeatureOrder] = useState([]);
  const [popularFeatureOrderLoaded, setPopularFeatureOrderLoaded] =
    useState(false);

  useEffect(() => {
    const legacyFeature = params.get("feature");
    const legacyFilter = params.get("filter");
    const legacyFeatureMeta = getTvRouteFeatureMeta(legacyFeature);

    if (routeFeatureSlug && !routeFeatureMeta) {
      navigate("/tvs", { replace: true });
      return;
    }
    if (routeFeatureMeta && search) {
      navigate(`/tvs/features/${routeFeatureMeta.id}`, { replace: true });
      return;
    }
    if (isLatestPath && search) {
      navigate("/tvs/latest", { replace: true });
      return;
    }
    if (legacyFeatureMeta) {
      navigate(`/tvs/features/${legacyFeatureMeta.id}`, { replace: true });
      return;
    }
    if (legacyFilter === "new" && !isLatestPath) {
      navigate("/tvs/latest", { replace: true });
    }
  }, [
    isLatestPath,
    navigate,
    params,
    routeFeatureMeta,
    routeFeatureSlug,
    search,
  ]);

  useEffect(() => {
    if (filter === "trending") dispatch(fetchTrendingHomeAppliances());
    else if (filter === "new") dispatch(fetchNewLaunchHomeAppliances());
    else dispatch(fetchHomeAppliances());
  }, [filter, dispatch]);

  useEffect(() => {
    let cancelled = false;
    const controller =
      typeof AbortController !== "undefined" ? new AbortController() : null;

    (async () => {
      const deviceTypeCandidates = ["tv", "television", "home-appliance"];
      for (const deviceType of deviceTypeCandidates) {
        try {
          const data = await fetchPublicJson(
            `https://api.apisphere.in/api/public/popular-features?deviceType=${encodeURIComponent(deviceType)}&days=7&limit=16`,
            { signal: controller?.signal },
          );
          const order = Array.isArray(data?.results)
            ? data.results
                .map((r) => r.feature_id || r.featureId || r.id)
                .filter(Boolean)
            : [];
          if (!cancelled) {
            if (order.length) setPopularFeatureOrder(order);
            setPopularFeatureOrderLoaded(true);
          }
          if (order.length) return;
        } catch {
          // ignore popularity fetch errors
        }
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
    let base = computePopularTvFeatures(devices, { limit: 0 });

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

    if (normalizedFeature && !base.some((f) => f.id === normalizedFeature)) {
      const def = TV_FEATURE_CATALOG.find((f) => f.id === normalizedFeature);
      if (def) base = [{ ...def, count: 0 }, ...base];
    }

    return base.slice(0, 16);
  }, [devices, normalizedFeature, popularFeatureOrder]);

  const additionalFeatureOptions = useMemo(
    () => computeAdditionalTvFeatures(devices),
    [devices],
  );

  const filteredAdditionalFeatureOptions = useMemo(() => {
    const query = String(additionalFeatureQuery || "")
      .trim()
      .toLowerCase();
    if (!query) return additionalFeatureOptions;
    return additionalFeatureOptions.filter((feature) =>
      [feature.name, feature.description]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [additionalFeatureOptions, additionalFeatureQuery]);

  // Get selected appliance type for specific filters
  const selectedApplianceType =
    filters.applianceType.length === 1 ? filters.applianceType[0] : null;
  const effectiveSpecificFilterType =
    selectedApplianceType ||
    (extractDynamicFilters.screenSize.length ||
    extractDynamicFilters.resolution.length ||
    extractDynamicFilters.tvFeatures.length
      ? "tv"
      : null);

  const specificFiltersConfig = useMemo(
    () =>
      effectiveSpecificFilterType
        ? getSpecificFiltersForType(effectiveSpecificFilterType).filter(
            (filter) => Array.isArray(filter.options) && filter.options.length,
          )
        : [],
    [effectiveSpecificFilterType, extractDynamicFilters],
  );

  // Apply query param filters
  useEffect(() => {
    const params = new URLSearchParams(search);
    const brandParam = params.get("brand");
    const typeParam = params.get("type");
    const qParam =
      params.get("q") || params.get("query") || params.get("search") || null;
    const sortParam = params.get("sort");

    // Parse list params
    const toArray = (val) =>
      val && val.length
        ? val
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

    const brandArr = toArray(brandParam);
    const typeArr = toArray(typeParam);
    const energyArr = toArray(params.get("energy"));

    // Parse price range
    const rawMin = params.get("priceMin") || params.get("minPrice");
    const rawMax = params.get("priceMax") || params.get("maxPrice");
    const priceMin = rawMin ? Number(rawMin) : MIN_PRICE;
    const priceMax = rawMax ? Number(rawMax) : MAX_PRICE;

    setFilters((prev) => ({
      ...prev,
      brand: brandArr.length ? brandArr : prev.brand,
      applianceType: typeArr.length ? typeArr : prev.applianceType,
      energyRating: energyArr.length ? energyArr : prev.energyRating,
      priceRange: {
        min: !isNaN(priceMin) ? priceMin : prev.priceRange.min,
        max: !isNaN(priceMax) ? priceMax : prev.priceRange.max,
      },
    }));

    if (typeParam && !sortParam) {
      setSortBy("newest");
    } else if (sortParam) {
      setSortBy(sortParam);
    }

    if (qParam !== null) {
      setSearchQuery(qParam);
    }
  }, [search]);

  const deviceContext = useDevice({ resources: ["tvs", "brands"] });
  const filterBrand =
    Array.isArray(filters?.brand) && filters.brand[0] ? filters.brand[0] : null;
  const currentBrandObj = (() => {
    const b = filterBrand;
    if (!b) return null;
    const all = deviceContext?.brands || [];
    const norm = (s) => (s || "").toString().toLowerCase();
    return (
      all.find((br) => {
        const slug =
          br.slug ||
          (br.name || "").toString().toLowerCase().replace(/\s+/g, "-");
        return (
          slug === b.toString().toLowerCase() ||
          norm(br.name) === b.toString().toLowerCase()
        );
      }) || null
    );
  })();

  const filteredBrandOptions = useMemo(() => {
    const q = String(brandFilterQuery || "")
      .trim()
      .toLowerCase();
    if (!q) return extractDynamicFilters.brands;
    return extractDynamicFilters.brands.filter((brand) =>
      String(brand || "")
        .toLowerCase()
        .includes(q),
    );
  }, [extractDynamicFilters.brands, brandFilterQuery]);

  const updatePriceRange = (newMin, newMax) => {
    let min = Number(newMin ?? filters.priceRange.min);
    let max = Number(newMax ?? filters.priceRange.max);
    if (min > max) max = min;
    if (max < min) min = max;
    setFilters((prev) => ({ ...prev, priceRange: { min, max } }));
  };

  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => {
      const currentArr = Array.isArray(prev[filterType])
        ? prev[filterType]
        : [];
      const nextArr = currentArr.includes(value)
        ? currentArr.filter((item) => item !== value)
        : [...currentArr, value];
      return { ...prev, [filterType]: nextArr };
    });
  };

  const handleSpecificFilterChange = (filterKey, value) => {
    setFilters((prev) => ({
      ...prev,
      specific: {
        ...prev.specific,
        [filterKey]: prev.specific[filterKey]?.includes(value)
          ? prev.specific[filterKey].filter((item) => item !== value)
          : [...(prev.specific[filterKey] || []), value],
      },
    }));
  };

  const handleSortChange = (value) => {
    setSortBy(value);
    setShowSort(false);
    try {
      const params = new URLSearchParams(search);
      if (value && value !== "featured") params.set("sort", value);
      else params.delete("sort");
      const qs = params.toString();
      const path = `/tvs${qs ? `?${qs}` : ""}`;
      navigate(path, { replace: true });
    } catch {
      // ignore
    }
  };

  const handleSelectTvSize = (device, variant, event) => {
    if (event?.stopPropagation) event.stopPropagation();
    const productKey = String(
      device.productId ?? device.product_id ?? device.id ?? "",
    );
    if (!productKey) return;
    setSelectedVariantByProduct((prev) => ({
      ...prev,
      [productKey]: getTvVariantIdentity(variant),
    }));
  };

  useEffect(() => {
    const validProductKeys = new Set(
      variantCards.map((device) =>
        String(device.productId ?? device.product_id ?? device.id ?? ""),
      ),
    );
    setSelectedVariantByProduct((prev) => {
      let changed = false;
      const next = {};
      Object.entries(prev).forEach(([key, value]) => {
        if (validProductKeys.has(key)) next[key] = value;
        else changed = true;
      });
      return changed ? next : prev;
    });
  }, [variantCards]);

  const resolvedVariantCards = useMemo(() => {
    return variantCards.map((device) => {
      const variants = Array.isArray(device.variants) ? device.variants : [];
      if (!variants.length) return device;

      const productKey = String(
        device.productId ?? device.product_id ?? device.id ?? "",
      );
      const selectedVariantId = selectedVariantByProduct[productKey];
      if (!selectedVariantId) return device;

      const selectedVariant = variants.find(
        (variant, variantIndex) =>
          getTvVariantIdentity(variant, variantIndex) ===
          String(selectedVariantId),
      );

      if (!selectedVariant) return device;

      const resolved = resolveDeviceWithVariant(device, selectedVariant);
      return {
        ...resolved,
        variants: device.variants,
        availableSizes: device.availableSizes,
      };
    });
  }, [variantCards, selectedVariantByProduct]);

  // Filter logic
  const filteredVariants = resolvedVariantCards.filter((device) => {
    // Search filter
    if (searchQuery) {
      if (!isPublishedProduct(device)) return false;
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        device.name.toLowerCase().includes(query) ||
        device.brand.toLowerCase().includes(query) ||
        device.applianceTypeDisplay.toLowerCase().includes(query) ||
        device.features.some((f) => f.toLowerCase().includes(query));
      if (!matchesSearch) return false;
    }

    if (normalizedFeature && !matchesTvFeature(device, normalizedFeature)) {
      return false;
    }

    // Brand filter
    if (filters.brand.length > 0 && !filters.brand.includes(device.brand)) {
      return false;
    }

    // Appliance type filter
    if (
      filters.applianceType.length > 0 &&
      !filters.applianceType.includes(device.applianceTypeDisplay)
    ) {
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

    // Energy rating filter
    if (filters.energyRating.length > 0) {
      const energy = device.specs.energyRating || "";
      if (!filters.energyRating.includes(energy)) return false;
    }

    if (
      filters.additionalFeatures.length > 0 &&
      !filters.additionalFeatures.every((featureId) =>
        matchesTvAdditionalFeature(device, featureId),
      )
    ) {
      return false;
    }

    // Capacity range filter
    if (filters.capacityRange.length > 0) {
      const capacity = device.numericCapacity || 0;
      const matchesCapacity = filters.capacityRange.some((rangeId) => {
        const range = extractDynamicFilters.capacityRanges.find(
          (r) => r.id === rangeId,
        );
        if (!range) return false;
        return capacity >= range.min && capacity <= range.max;
      });
      if (!matchesCapacity) return false;
    }

    // Release year filter
    if (filters.releaseYear.length > 0) {
      const year = device.releaseYear || 0;
      if (!filters.releaseYear.includes(String(year))) return false;
    }

    // Specific filters (only if appliance type matches)
    if (
      filters.specific &&
      (selectedApplianceType
        ? selectedApplianceType === device.applianceTypeDisplay
        : true)
    ) {
      for (const [filterKey, selectedValues] of Object.entries(
        filters.specific,
      )) {
        if (selectedValues && selectedValues.length > 0) {
          let deviceValue;

          // Map filter keys to device properties
          switch (filterKey) {
            case "loadType":
              deviceValue = device.specs.type;
              break;
            case "doorType":
              deviceValue = device.specs.type;
              break;
            case "acType":
              deviceValue = device.specs.acType;
              break;
            case "capacity":
              deviceValue = device.specs.capacity;
              break;
            case "acCapacity":
              deviceValue = device.specs.capacity;
              break;
            case "technology":
              deviceValue = device.specs.technology;
              break;
            case "screenSize":
              deviceValue =
                Array.isArray(device.variants) && device.variants.length
                  ? device.variants
                      .map((variant) =>
                        firstNonEmpty(
                          variant?.screen_size,
                          variant?.size,
                          variant?.variant_key,
                        ),
                      )
                      .filter(Boolean)
                  : device.specs.screenSize;
              break;
            case "resolution":
              deviceValue = device.specs.resolution;
              break;
            case "features":
              deviceValue = device.features;
              break;
            default:
              continue;
          }

          if (Array.isArray(deviceValue)) {
            // For features array
            const hasMatchingFeature = !selectedValues.every(
              (selected) =>
                !deviceValue.some((feature) =>
                  feature.toLowerCase().includes(selected.toLowerCase()),
                ),
            );
            if (!hasMatchingFeature) return false;
          } else if (!selectedValues.includes(deviceValue)) {
            return false;
          }
        }
      }
    }

    return true;
  });

  const sortedVariants = [...filteredVariants].sort((a, b) => {
    if (sortBy === "featured" && normalizedFeature) {
      const av = getTvFeatureSortValue(a, normalizedFeature);
      const bv = getTvFeatureSortValue(b, normalizedFeature);
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (bv !== av) return bv - av;
      if (a.numericPrice !== b.numericPrice)
        return a.numericPrice - b.numericPrice;
      return String(a.name || "").localeCompare(String(b.name || ""));
    }

    switch (sortBy) {
      case "price-low":
        return a.numericPrice - b.numericPrice;
      case "price-high":
        return b.numericPrice - a.numericPrice;
      case "newest":
        return new Date(b.launchDate) - new Date(a.launchDate);
      case "capacity":
        return b.numericCapacity - a.numericCapacity;
      case "energy":
        return b.numericEnergyRating - a.numericEnergyRating;
      default:
        return 0;
    }
  });

  const clearFilters = () => {
    setFilters({
      brand: [],
      priceRange: { min: MIN_PRICE, max: MAX_PRICE },
      applianceType: [],
      energyRating: [],
      additionalFeatures: [],
      capacityRange: [],
      releaseYear: [],
      specific: {},
    });
    setSearchQuery("");
    setBrandFilterQuery("");
    setAdditionalFeatureQuery("");
    try {
      const params = new URLSearchParams(search);
      params.delete("brand");
      params.delete("type");
      params.delete("q");
      params.delete("energy");
      if (sortBy && sortBy !== "featured") {
        params.set("sort", sortBy);
      } else {
        params.delete("sort");
      }
      const qs = params.toString();
      const path = `/tvs${qs ? `?${qs}` : ""}`;
      navigate(path, { replace: true });
    } catch {}
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.brand && filters.brand.length) count += filters.brand.length;
    if (filters.applianceType && filters.applianceType.length)
      count += filters.applianceType.length;
    if (filters.energyRating && filters.energyRating.length)
      count += filters.energyRating.length;
    if (filters.additionalFeatures && filters.additionalFeatures.length)
      count += filters.additionalFeatures.length;
    if (filters.capacityRange && filters.capacityRange.length)
      count += filters.capacityRange.length;
    if (filters.releaseYear && filters.releaseYear.length)
      count += filters.releaseYear.length;

    // Count specific filters
    if (filters.specific) {
      Object.values(filters.specific).forEach((arr) => {
        if (arr && arr.length) count += arr.length;
      });
    }

    if (
      filters.priceRange &&
      (filters.priceRange.min > 0 || filters.priceRange.max < MAX_PRICE)
    )
      count += 1;
    return count;
  };

  const trackFeatureClick = (featureId) => {
    try {
      const url = "https://api.apisphere.in/api/public/feature-click";
      const body = new URLSearchParams({
        device_type: "tv",
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
          device_type: "tv",
          feature_id: featureId,
        }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      // ignore
    }
  };

  const setFeatureParam = (featureId) => {
    if (featureId) trackFeatureClick(featureId);
    const featureMeta = getTvRouteFeatureMeta(featureId);
    navigate(featureMeta ? `/tvs/features/${featureMeta.id}` : "/tvs");
  };

  const handleView = (device, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const productId =
      device.productId ?? device.product_id ?? device.id ?? device.model ?? "";

    // Generate SEO-friendly slug-based URL
    const slug =
      generateSlug(
        device.name ||
          device.product_name ||
          device.model ||
          device.brand ||
          String(productId || ""),
      ) || `tv-${String(productId || "detail")}`;

    // record a product view for trending metrics
    try {
      const rawPid =
        device.product_id ??
        device.productId ??
        device.id ??
        device.model ??
        null;
      const pid = Number(rawPid);
      if (Number.isInteger(pid) && pid > 0) {
        fetch(`https://api.apisphere.in/api/public/product/${pid}/view`, {
          method: "POST",
        }).catch(() => {});
      }
    } catch {}

    navigate(`/tvs/${slug}`);
  };

  const currentYear = new Date().getFullYear();
  const currentMonthYear = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date());
  const currentFullDate = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date());
  const routeFeatureSeoName = routeFeatureMeta?.seoName || "";
  const sanitizeDescription = (desc = "") => {
    const text = String(desc || "")
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim();
    return text.length > 180 ? `${text.slice(0, 177)}...` : text;
  };

  const headerLabel = routeFeatureMeta
    ? `${String(routeFeatureSeoName).toUpperCase()} TVs`
    : currentBrandObj
    ? `${String(currentBrandObj.name).toUpperCase()} TVs`
    : filter === "trending"
      ? "TRENDING NOW"
      : filter === "new"
        ? "LATEST COLLECTION"
        : "BEST TVS IN INDIA";

  const heroTitleText = routeFeatureMeta
    ? `Best ${routeFeatureSeoName} TVs`
    : currentBrandObj
    ? `${currentBrandObj.name} TVs`
    : filter === "trending"
      ? "Trending TVs"
      : filter === "new"
        ? "Latest TVs"
        : "Best TVs in India";

  const heroSubtitleText = routeFeatureMeta
    ? `Browse the best ${routeFeatureSeoName} TVs in India with updated prices, screen sizes, display details, smart features, and store availability. Compare matching models and choose the TV that fits your viewing needs.`
    : currentBrandObj
    ? sanitizeDescription(
        currentBrandObj.description ||
          `Browse ${currentBrandObj.name} TVs with detailed specifications, updated prices, and store offers before you decide.`,
      )
    : filter === "trending"
      ? "Browse the TVs buyers are watching most and quickly spot the models that are getting attention right now. This page brings together updated prices, display technology, panel type, resolution, refresh rate, audio features, smart features, and model variants in one place so you can compare the practical details that matter without opening multiple store pages. Whether you are looking for a budget smart TV, a 4K home-theater screen, a gaming-friendly panel, or a premium flagship display, the trending collection helps you narrow the field with confidence. Use the filters and product cards to sort by brand, price, screen size, resolution, and feature, then open the listings that look the most promising."
      : filter === "new"
        ? "Browse the newest TV releases and keep up with fresh launches as they arrive. This page brings together updated pricing, panel details, refresh rates, audio information, smart platform options, and screen sizes so you can track what is new in one place. If you are waiting for a newly announced model, planning a living-room upgrade, or checking how the latest releases stack up, the new-launch collection makes it easy to review the important details without jumping between many product pages. Use the filters and product cards to sort by brand, price, size, resolution, and feature, then open the TVs that are most worth watching."
        : "Browse the best TVs in India ranked using current buyer interest, product momentum, and freshness signals from Hooks. Compare brands, prices, screen sizes, panel types, smart features, refresh rates, audio output, and model variants in one place. Whether you want a budget smart TV, a family viewing screen, a gaming display, or a premium home-theater panel, use the filters and product cards to narrow the shortlist and open the TVs that fit your needs.";

  const isExpandedHeroDescriptionPath =
    Boolean(routeFeatureMeta) ||
    filter === "trending" ||
    filter === "new" ||
    !currentBrandObj;
  const heroSubtitleStyle =
    isExpandedHeroDescriptionPath && !showHeroDescription
      ? {
          display: "-webkit-box",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: 1,
          overflow: "hidden",
        }
      : undefined;
  const heroSubtitleWidthClass = "max-w-7xl";
  useEffect(() => {
    if (isExpandedHeroDescriptionPath) {
      setShowHeroDescription(false);
    }
  }, [isExpandedHeroDescriptionPath]);

  let seoTitle = `Best TVs in India (${currentMonthYear}) - Hooks`;
  let seoDescription =
    "Browse the best TVs in India ranked using buyer interest, trend momentum, and freshness signals. Compare updated prices, screen sizes, display specifications, and smart TV features on Hooks.";

  if (filter === "trending") {
    seoTitle = `Trending TVs (${currentMonthYear}) - Most Popular Smart TVs & Prices - Hooks`;
    seoDescription =
      "Browse trending TVs with rising demand, key specifications, and latest prices to find the right smart TV on Hooks.";
  } else if (filter === "new") {
    seoTitle = `Latest Smart TVs in India (${currentFullDate}) - Hooks`;
    seoDescription =
      "Browse newly launched TVs with updated specifications, panel details, refresh rates, and best store prices on Hooks.";
  }

  if (routeFeatureMeta) {
    seoTitle = `Best ${routeFeatureSeoName} TVs in India (${currentFullDate}) - Hooks`;
    seoDescription = `Browse the best ${routeFeatureSeoName} TVs in India with updated prices, display specifications, screen sizes, smart features, and store availability on Hooks.`;
  }

  if (currentBrandObj && !routeFeatureMeta) {
    seoTitle = `${currentBrandObj.name} TVs (${currentMonthYear}) - Models, Prices & Specs - Hooks`;
    seoDescription = sanitizeDescription(
      currentBrandObj.description ||
        `Browse ${currentBrandObj.name} TVs with detailed specifications, latest prices, and top store offers on Hooks.`,
    );
  }
  const seoKeywords = useMemo(
    () =>
      buildListSeoKeywords({
        devices: sortedVariants,
        category: "smart tv",
        currentYear,
        baseTerms: ["smart tv", "tv price in india", "compare tv specs"],
        contextTerms: [
          filter === "new" ? "latest tv launches" : "",
          filter === "trending" ? "trending tvs" : "",
          routeFeatureSeoName ? `${routeFeatureSeoName} tv` : "",
          routeFeatureSeoName ? `best ${routeFeatureSeoName} tv in india` : "",
          currentBrandObj?.name ? `${currentBrandObj.name} tv` : "",
          currentBrandObj?.name ? `${currentBrandObj.name} smart tv` : "",
        ],
      }),
    [
      currentYear,
      filter,
      routeFeatureSeoName,
      currentBrandObj,
      sortedVariants,
    ],
  );

  const siteOrigin =
    typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : "https://tryhook.shop";

  const toAbsoluteUrl = (value) => {
    if (!value) return "";
    if (/^(https?:|data:|blob:)/i.test(value)) return value;
    if (String(value).startsWith("//")) return `https:${value}`;
    return String(value).startsWith("/")
      ? `${siteOrigin}${value}`
      : `${siteOrigin}/${value}`;
  };

  const getListingProductImage = (device) => {
    if (!device || typeof device !== "object") return "";
    const directImages = [
      ...(Array.isArray(device.images) ? device.images : []),
      ...(Array.isArray(device.images_json) ? device.images_json : []),
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
            (Array.isArray(entry.images_json) && entry.images_json.find(Boolean)) ||
            entry.image ||
            entry.image_url ||
            entry.imageUrl
          );
        })
      : null;
    if (!variant) return "";
    return (
      (Array.isArray(variant.images) && variant.images.find(Boolean)) ||
      (Array.isArray(variant.images_json) && variant.images_json.find(Boolean)) ||
      variant.image ||
      variant.image_url ||
      variant.imageUrl ||
      ""
    );
  };

  const listOgImage = useMemo(() => {
    const firstWithImage = sortedVariants.find((device) =>
      Boolean(getListingProductImage(device)),
    );
    const raw = getListingProductImage(firstWithImage);
    return toAbsoluteUrl(raw) || `${SITE_ORIGIN}/hook-logo.png`;
  }, [sortedVariants, siteOrigin]);

  const listCanonicalPath = isLatestPath
    ? "/tvs/latest"
    : routeFeatureMeta
      ? `/tvs/features/${routeFeatureMeta.id}`
      : "/tvs";
  const listSchemaUrl = toCanonicalPageUrl(listCanonicalPath, SITE_ORIGIN);

  const listSchemaItems = useMemo(() => {
    const items = sortedVariants.slice(0, 20).map((device) => {
      const name = String(
        device?.name || device?.product_name || device?.model || "",
      ).trim();
      if (!name) return null;
      const slug =
        generateSlug(
          device?.name ||
            device?.product_name ||
            device?.model ||
            device?.brand ||
            device?.id,
        ) || "";
      const imageRaw = Array.isArray(device?.images)
        ? device.images.find(Boolean)
        : device?.image;
      return {
        name,
        url: toCanonicalPageUrl(`/tvs/${slug || "detail"}`, SITE_ORIGIN),
        image: imageRaw ? toAbsoluteUrl(imageRaw) : undefined,
      };
    });
    return items.filter(Boolean);
  }, [sortedVariants, siteOrigin]);

  const listSchema = useMemo(() => {
    const collectionSchema = createCollectionSchema({
      name: seoTitle,
      description: seoDescription,
      url: listSchemaUrl,
      image: listOgImage || undefined,
    });
    const itemListSchema = createItemListSchema({
      name: seoTitle,
      url: listSchemaUrl,
      items: listSchemaItems,
    });
    return [collectionSchema, itemListSchema];
  }, [seoTitle, seoDescription, listSchemaUrl, listOgImage, listSchemaItems]);

  const listSchemaJson = useMemo(
    () => (listSchema ? JSON.stringify(listSchema) : null),
    [listSchema],
  );

  // Get appliance type icon component
  const ApplianceTypeIcon = ({ applianceType }) => {
    const IconComponent = getApplianceTypeIcon(applianceType);
    return <IconComponent className="text-sm" />;
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <style>{animationStyles}</style>
      <Helmet prioritizeSeoTags>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <meta name="keywords" content={seoKeywords} />

        {/* Canonical URL - CRITICAL for SEO per route */}
        <link rel="canonical" href={listSchemaUrl} />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:url" content={listSchemaUrl} />
        {listOgImage ? (
          <meta key="tvs-og-image" property="og:image" content={listOgImage} />
        ) : null}

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDescription} />
        {listOgImage ? (
          <meta
            key="tvs-twitter-image"
            name="twitter:image"
            content={listOgImage}
          />
        ) : null}

        {listSchemaJson && (
          <script type="application/ld+json">{listSchemaJson}</script>
        )}
      </Helmet>
      {/* Main Content */}
      <div className="relative mx-auto max-w-7xl px-4 pt-0 pb-8 sm:px-6 sm:pb-12 md:pb-16 lg:px-8 lg:pb-20">
        <section className="relative left-1/2 isolate w-screen -translate-x-1/2 overflow-hidden px-4 pb-0 pt-3 sm:px-6 sm:pt-4 lg:px-8 lg:pt-5">
          <div className="relative mx-auto max-w-7xl">
            <div className="max-w-7xl">
              <h1 className="text-[11px] font-bold uppercase tracking-[0.32em] text-purple-600 sm:text-xs">
                {heroTitleText}
              </h1>

              <h4
                className={`mt-3 ${heroSubtitleWidthClass} text-sm leading-7 text-slate-600 sm:text-base sm:leading-8`}
                style={heroSubtitleStyle}
              >
                {heroSubtitleText}
              </h4>

              {isExpandedHeroDescriptionPath ? (
                <button
                  type="button"
                  onClick={() => setShowHeroDescription((prev) => !prev)}
                  className="mt-2.5 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 transition-colors duration-200 hover:text-blue-900"
                  aria-expanded={showHeroDescription}
                >
                  {showHeroDescription ? "Read less" : "Read more"}
                </button>
              ) : null}

            </div>
          </div>
        </section>

        <div className="mt-3 sm:mt-4">
          <MobileListingControls
            activeFilterCount={getActiveFiltersCount()}
            onOpenFilters={() => setShowFilters(true)}
            onOpenSort={() => setShowSort(true)}
          />
        </div>

        <div className="overflow-hidden pt-0 pb-2 sm:pb-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FaFilter className="text-blue-600" />
              <h3 className="text-sm font-semibold text-slate-900 sm:text-base">
                Popular Features
              </h3>
            </div>
            {normalizedFeature && (
              <button
                onClick={() => setFeatureParam(null)}
                className="text-xs font-semibold text-blue-700 transition-colors duration-200 hover:text-blue-900 sm:text-sm"
              >
                Clear
              </button>
            )}
          </div>
          {popularFeatureOrderLoaded && (
            <p className="mb-2 text-xs text-slate-500">
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
                  className={`flex items-center gap-2 rounded-full px-3 py-2 text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors duration-200 ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  <span className={isActive ? "text-white" : "text-blue-600"}>
                    {Icon ? <Icon className="text-base" /> : null}
                  </span>
                  <span>{pf.name}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="mb-3 overflow-hidden">
          <div className="hidden items-center justify-end gap-4 lg:flex">
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

          <div className="space-y-3 sm:space-y-4 lg:hidden">
            {getActiveFiltersCount() > 0 && (
              <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-4 shadow-[0_2px_2px_rgba(0,0,0,0.1)]">
                <div className="flex items-center gap-3">
                  <FaInfoCircle className="text-blue-500" />
                  <div>
                    <span className="text-sm font-medium text-slate-900">
                      {getActiveFiltersCount()} filter
                      {getActiveFiltersCount() > 1 ? "s" : ""} applied
                    </span>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Found {filteredVariants.length} of {variantCards.length}{" "}
                      options
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

        <div className="flex flex-col gap-4 lg:flex-row md:gap-6">
          {/* Desktop Filter Sidebar */}
          <div className="hidden lg:block lg:w-72 flex-shrink-0">
            <div className="sticky top-6 rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_2px_2px_rgba(0,0,0,0.1)] lg:p-6">
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
                    Clear all
                  </button>
                )}
              </div>

              {/* Active Filters Badge */}
              {getActiveFiltersCount() > 0 && (
                <div className="mb-6 rounded-xl border border-slate-100 bg-white p-4 shadow-[0_2px_2px_rgba(0,0,0,0.1)] sm:mb-8">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-slate-900">
                      Active Filters
                    </span>
                    <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-bold text-blue-600">
                      {getActiveFiltersCount()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Refine further or clear to see all TVs
                  </p>
                </div>
              )}

              {/* Brand Filter */}
              <div className="mb-8">
                <div className="mb-4 flex items-center justify-between">
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
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
                  <input
                    type="text"
                    value={brandFilterQuery}
                    onChange={(e) => setBrandFilterQuery(e.target.value)}
                    placeholder="Search brand..."
                    className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-3 text-sm text-slate-900 transition-all placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div className="no-scrollbar max-h-60 space-y-2 overflow-y-auto pr-2">
                  {filteredBrandOptions.map((brand) => (
                    <label
                      key={brand}
                      className="group flex cursor-pointer items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 transition-all duration-200 hover:border-slate-200 hover:bg-slate-50"
                    >
                      <input
                        type="checkbox"
                        checked={filters.brand.includes(brand)}
                        onChange={() => handleFilterChange("brand", brand)}
                        className="h-4 w-4 appearance-none rounded border border-slate-300 bg-white transition-all duration-200 checked:border-blue-500 checked:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1"
                      />
                      <span className="flex-1 font-medium text-slate-700 group-hover:text-slate-900">
                        {brand}
                      </span>
                      <div className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-500">
                        {devices.filter((d) => d.brand === brand).length}
                      </div>
                    </label>
                  ))}
                  {filteredBrandOptions.length === 0 && (
                    <div className="px-2 py-1 text-sm text-slate-500">
                      No brands found
                    </div>
                  )}
                </div>
              </div>

              {/* Appliance Type Filter */}
              {extractDynamicFilters.applianceTypes.length > 1 && (
                <div className="mb-8">
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="text-lg font-semibold text-slate-900">
                      TV Type
                    </h4>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500">
                      {filters.applianceType.length} selected
                    </span>
                  </div>
                  <div className="space-y-2">
                    {extractDynamicFilters.applianceTypes.map((type) => (
                      <label
                        key={type}
                        className={`flex cursor-pointer items-center justify-between gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-colors duration-200 ${
                          filters.applianceType.includes(type)
                            ? "border-blue-400 bg-blue-50 text-blue-700"
                            : "border-slate-100 bg-white text-slate-700 hover:border-blue-200 hover:text-blue-700"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={filters.applianceType.includes(type)}
                          onChange={() =>
                            handleFilterChange("applianceType", type)
                          }
                          className="sr-only"
                        />
                        <span>{type}</span>
                        <span
                          className={`h-2 w-2 rounded-full ${
                            filters.applianceType.includes(type)
                              ? "bg-blue-600"
                              : "bg-slate-300"
                          }`}
                        />
                      </label>
                    ))}
                  </div>
                </div>
              )}

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
                    {formatRupeeNumber(filters.priceRange.min)} -{" "}
                    {formatRupeeNumber(filters.priceRange.max)}
                  </span>
                </div>
                <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-[0_2px_2px_rgba(0,0,0,0.1)]">
                  <div className="flex justify-between text-sm font-medium text-slate-700 mb-4">
                    <div className="text-center">
                      <div className="text-xs text-slate-500">Minimum</div>
                      <div className="font-bold">
                        {formatRupeeNumber(filters.priceRange.min)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-slate-500">Maximum</div>
                      <div className="font-bold">
                        {formatRupeeNumber(filters.priceRange.max)}
                      </div>
                    </div>
                  </div>

                  {/* Dual Range Slider */}
                  <div className="relative mb-8">
                    <div className="absolute h-2 bg-slate-200 rounded-full w-full top-1/2 transform -translate-y-1/2"></div>
                    <div
                      className="absolute h-2 bg-gradient-to-r from-blue-300 via-blue-700 to-blue-900 rounded-full top-1/2 transform -translate-y-1/2"
                      style={{
                        left: `${Math.max(
                          0,
                          Math.min(
                            100,
                            ((filters.priceRange.min || 0) / (MAX_PRICE || 1)) *
                              100,
                          ),
                        )}%`,
                        width: `${Math.max(
                          0,
                          Math.min(
                            100,
                            ((filters.priceRange.max - filters.priceRange.min) /
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
                      step={TV_PRICE_STEP}
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
                      step={TV_PRICE_STEP}
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

                  <div className="flex justify-between items-center text-xs mb-2">
                    <span className="text-slate-500">
                      {formatRupeeNumber(MIN_PRICE)}
                    </span>
                    <span className="text-slate-500">
                      {formatRupeeNumber(MAX_PRICE)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Additional Features Filter */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-slate-900 text-lg flex items-center gap-2">
                    Additional Features
                  </h4>
                  <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                    {filters.additionalFeatures.length} selected
                  </span>
                </div>
                <div className="relative mb-3">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
                  <input
                    type="text"
                    value={additionalFeatureQuery}
                    onChange={(event) =>
                      setAdditionalFeatureQuery(event.target.value)
                    }
                    placeholder="Search features..."
                    className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-3 text-sm text-slate-900 transition-all placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div className="no-scrollbar max-h-72 space-y-1.5 overflow-y-auto pr-1">
                  {filteredAdditionalFeatureOptions.map((feature) => {
                    return (
                      <label
                        key={feature.id}
                        className="group flex cursor-pointer items-center gap-3 rounded-lg border border-transparent px-2.5 py-2 transition-all duration-200 hover:border-slate-200 hover:bg-slate-50"
                      >
                        <input
                          type="checkbox"
                          checked={filters.additionalFeatures.includes(
                            feature.id,
                          )}
                          onChange={() =>
                            handleFilterChange("additionalFeatures", feature.id)
                          }
                          className="h-4 w-4 shrink-0 appearance-none rounded border border-slate-300 bg-white transition-all duration-200 checked:border-blue-500 checked:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1"
                        />
                        <span className="min-w-0 flex-1 text-sm font-medium text-slate-700 group-hover:text-slate-900">
                          {feature.name}
                        </span>
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-500">
                          {feature.count}
                        </span>
                      </label>
                    );
                  })}
                  {filteredAdditionalFeatureOptions.length === 0 && (
                    <div className="px-2 py-3 text-sm text-slate-500">
                      No matching features
                    </div>
                  )}
                </div>
              </div>

              {/* Capacity Range Filter */}
              {extractDynamicFilters.capacityRanges.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-slate-900 text-lg flex items-center gap-2">
                      Capacity Range
                    </h4>
                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                      {filters.capacityRange.length} selected
                    </span>
                  </div>
                  <div className="space-y-2">
                    {extractDynamicFilters.capacityRanges.map((range) => (
                      <label
                        key={range.id}
                        className={`flex items-center justify-between gap-2 cursor-pointer px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                          filters.capacityRange.includes(range.id)
                            ? "bg-gradient-to-r from-blue-500 to-sky-500 text-white border border-blue-400"
                            : "border border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={filters.capacityRange.includes(range.id)}
                          onChange={() =>
                            handleFilterChange("capacityRange", range.id)
                          }
                          className="sr-only"
                        />
                        <div className="flex items-center gap-3">
                          <span className="text-sm">{range.label}</span>
                        </div>
                        <div
                          className={`w-2 h-2 rounded-full ${
                            filters.capacityRange.includes(range.id)
                              ? "bg-white"
                              : "bg-slate-300"
                          }`}
                        ></div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Energy Rating Filter */}
              {extractDynamicFilters.energyRating.length > 0 && (
                <div className="mb-8">
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="text-lg font-semibold text-slate-900">
                      Energy Rating
                    </h4>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500">
                      {filters.energyRating.length} selected
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {extractDynamicFilters.energyRating.map((rating) => (
                      <label
                        key={rating}
                        className={`flex cursor-pointer items-center justify-center rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors duration-200 ${
                          filters.energyRating.includes(rating)
                            ? "border-blue-400 bg-blue-50 text-blue-700"
                            : "border-slate-100 bg-white text-slate-700 hover:border-blue-200 hover:text-blue-700"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={filters.energyRating.includes(rating)}
                          onChange={() =>
                            handleFilterChange("energyRating", rating)
                          }
                          className="sr-only"
                        />
                        <span>{rating}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Release Year Filter */}
              {extractDynamicFilters.releaseYears.length > 0 && (
                <div className="mb-8">
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="text-lg font-semibold text-slate-900">
                      Release Year
                    </h4>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500">
                      {filters.releaseYear.length} selected
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {extractDynamicFilters.releaseYears.map((year) => {
                      const value = String(year);
                      return (
                        <label
                          key={value}
                          className={`flex cursor-pointer items-center justify-center rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors duration-200 ${
                            filters.releaseYear.includes(value)
                              ? "border-blue-400 bg-blue-50 text-blue-700"
                              : "border-slate-100 bg-white text-slate-700 hover:border-blue-200 hover:text-blue-700"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={filters.releaseYear.includes(value)}
                            onChange={() =>
                              handleFilterChange("releaseYear", value)
                            }
                            className="sr-only"
                          />
                          <span>{value}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Specific Filters for Selected Appliance Type */}
              {effectiveSpecificFilterType &&
                specificFiltersConfig.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-slate-900 text-lg flex items-center gap-2">
                      <FaCog className="text-blue-500" />
                      {selectedApplianceType || "TV"} Filters
                    </h4>
                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                      {Object.values(filters.specific || {}).flat().length}{" "}
                      selected
                    </span>
                  </div>
                  <div className="space-y-4">
                    {specificFiltersConfig.map((filter) => (
                      <div key={filter.key}>
                        <h5 className="font-medium text-slate-800 text-sm mb-2">
                          {filter.label}
                        </h5>
                        <div className="space-y-2">
                          {filter.options.map((option) => (
                            <label
                              key={option}
                              className="flex items-center gap-3 cursor-pointer group hover:bg-slate-50 px-3 py-2 rounded-lg transition-all duration-200"
                            >
                              <input
                                type="checkbox"
                                checked={
                                  filters.specific[filter.key]?.includes(
                                    option,
                                  ) || false
                                }
                                onChange={() =>
                                  handleSpecificFilterChange(filter.key, option)
                                }
                                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                              />
                              <span className="text-slate-700 text-sm group-hover:text-slate-900">
                                {option}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Products List - Right */}
          <div className="flex-1">
            {/* Results Summary */}
            {/* BannerSlot disabled (incomplete). */}

            {/* Products Grid */}
            <div className="grid grid-cols-1 gap-4 sm:gap-5 md:gap-6 auto-rows-max">
              {sortedVariants.map((device, idx) => {
                const hasStoreSection =
                  Array.isArray(device.storePrices) &&
                  device.storePrices.length > 0;
                const launchDateParsed = device.launchDate
                  ? new Date(device.launchDate)
                  : null;
                const hasLaunchDate =
                  launchDateParsed &&
                  !Number.isNaN(launchDateParsed.getTime());

                return (
                  <div
                    key={`${device.id}-${idx}`}
                    onClick={(e) => handleView(device, e)}
                    className="smooth-transition fade-in-up h-full w-full mx-auto overflow-hidden rounded-lg border border-slate-100 bg-white shadow-[0_2px_2px_rgba(0,0,0,0.1)] cursor-pointer transition-all duration-300 hover:bg-slate-50"
                  >
                    <div className="p-5 sm:p-6 transition-all duration-300">
                      {/* Desktop Header Section - Hidden on mobile */}
                      <div className="hidden flex-col gap-4 lg:flex lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 flex-1">
                          <h3 className="max-w-3xl text-[1.45rem] font-semibold tracking-tight text-[#14255e] sm:text-[1.8rem]">
                            {device.name || device.model || "TV"}
                          </h3>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                          <div className="text-xl font-semibold tracking-tight text-[#14255e] sm:text-2xl">
                            {formatPriceDisplay(device.price)}
                          </div>
                        </div>
                      </div>

                      {/* Desktop Score and Launch Date Section */}
                      <div className="mt-4 hidden flex-col gap-3 lg:flex lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex flex-wrap items-center gap-4">
                          <CircularScoreBadge
                            score={device.spec_score}
                            size={42}
                          />
                        </div>

                        {hasLaunchDate ? (
                          <div className="flex items-center gap-1.5 text-sm text-slate-700 sm:justify-end">
                            <FaCalendarAlt className="text-slate-400" />
                            <span>
                              Listed:{" "}
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

                      {/* Main Content Grid */}
                      <div className="mt-5 grid grid-cols-[128px_minmax(0,1fr)] gap-3 sm:grid-cols-[120px_minmax(0,1fr)] lg:grid-cols-[180px_minmax(0,1fr)] sm:gap-4 lg:gap-5">
                        {/* Image Column */}
                        <div className="relative flex items-start justify-start sm:justify-center">
                          <span className="absolute left-0 top-0 z-10 inline-flex items-center rounded-full bg-yellow-600 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                            Smart TV
                          </span>
                          <div className="flex w-full justify-start sm:justify-center">
                            <ImageCarousel images={device.images} />
                          </div>
                        </div>

                        {/* Right Column - Info */}
                        <div className="space-y-3 pt-1">
                          {/* Mobile Brand, Title, Score */}
                          <div className="space-y-1 lg:hidden">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="inline-block text-sm font-semibold text-blue-600">
                                {device.brand}
                              </span>
                            </div>
                            <h5 className="text-[1.05rem] font-semibold tracking-tight text-[#14255e] leading-6 break-words">
                              {device.name || device.model || "TV"}
                            </h5>
                            <CircularScoreBadge
                              score={device.spec_score}
                              size={42}
                            />
                          </div>

                          {/* Specs Summary - Desktop Only */}
                          <div className="hidden lg:block text-[13px] leading-6 text-slate-700 sm:text-sm sm:leading-7 sm:text-base">
                            {(() => {
                              const activeSize = firstNonEmpty(
                                device.variant?.screen_size,
                                device.variant?.size,
                                device.variant?.variant_key,
                                device.specs?.screenSize,
                                device.specs?.capacity,
                              );
                              const screenSize = String(
                                activeSize || device.specs?.screenSize || "",
                              ).trim();
                              const variantSummary = firstNonEmpty(
                                device.variant?.specification_summary,
                              );
                              const variantSummaryIsSize =
                                normalizeLooseKey(variantSummary) ===
                                normalizeLooseKey(screenSize);
                              const resolution = String(
                                firstNonEmpty(
                                  device.variant?.resolution,
                                  variantSummaryIsSize ? "" : variantSummary,
                                  device.variant?.variant_resolution,
                                  extractVariantSpecificValue(
                                    device.specs?.resolution,
                                    screenSize,
                                  ),
                                  device.specs?.resolution,
                                ),
                              ).trim();
                              const refreshRate = String(
                                firstNonEmpty(
                                  device.variant?.refresh_rate,
                                  extractVariantSpecificValue(
                                    device.specs?.refreshRate,
                                    screenSize,
                                  ),
                                  device.specs?.refreshRate,
                                ),
                              ).trim();
                              const panelType = String(
                                firstNonEmpty(
                                  device.variant?.panel_type,
                                  device.variant?.display_type,
                                  extractVariantSpecificValue(
                                    device.specs?.displayType,
                                    screenSize,
                                  ),
                                  device.specs?.displayType,
                                  device.specs?.type || "",
                                ),
                              ).trim();
                              const operatingSystem = String(
                                device.specs?.operatingSystem || "",
                              ).trim();
                              const tvIdentity = [
                                screenSize,
                                resolution,
                                refreshRate,
                                panelType,
                                operatingSystem,
                              ]
                                .filter(Boolean)
                                .join(" | ");
                              return tvIdentity || "TV specifications";
                            })()}
                          </div>

                          {/* Mobile Price */}
                          <div className="lg:hidden text-lg font-semibold tracking-tight text-[#14255e] sm:text-xl">
                            {formatPriceDisplay(device.price)}
                          </div>

                          {/* Mobile Specs and Details */}
                          <div className="lg:hidden space-y-3">
                            {(() => {
                              const activeSize = firstNonEmpty(
                                device.variant?.screen_size,
                                device.variant?.size,
                                device.variant?.variant_key,
                                device.specs?.screenSize,
                                device.specs?.capacity,
                              );
                              const screenSize = String(
                                activeSize || device.specs?.screenSize || "",
                              ).trim();
                              const variantSummary = firstNonEmpty(
                                device.variant?.specification_summary,
                              );
                              const variantSummaryIsSize =
                                normalizeLooseKey(variantSummary) ===
                                normalizeLooseKey(screenSize);
                              const resolution = String(
                                firstNonEmpty(
                                  device.variant?.resolution,
                                  variantSummaryIsSize ? "" : variantSummary,
                                  device.variant?.variant_resolution,
                                  extractVariantSpecificValue(
                                    device.specs?.resolution,
                                    screenSize,
                                  ),
                                  device.specs?.resolution,
                                ),
                              ).trim();
                              const refreshRate = String(
                                firstNonEmpty(
                                  device.variant?.refresh_rate,
                                  extractVariantSpecificValue(
                                    device.specs?.refreshRate,
                                    screenSize,
                                  ),
                                  device.specs?.refreshRate,
                                ),
                              ).trim();
                              const panelType = String(
                                firstNonEmpty(
                                  device.variant?.panel_type,
                                  device.variant?.display_type,
                                  extractVariantSpecificValue(
                                    device.specs?.displayType,
                                    screenSize,
                                  ),
                                  device.specs?.displayType,
                                  device.specs?.type || "",
                                ),
                              ).trim();
                              const operatingSystem = String(
                                device.specs?.operatingSystem || "",
                              ).trim();
                              const tvIdentity = [
                                screenSize,
                                resolution,
                                refreshRate,
                                panelType,
                                operatingSystem,
                              ]
                                .filter(Boolean)
                                .join(" | ");

                              if (!tvIdentity) return null;
                              return (
                                <p className="mt-1 text-[13px] leading-6 text-slate-700 break-words">
                                  {tvIdentity}
                                </p>
                              );
                            })()}
                          </div>

                          {Array.isArray(device.variants) &&
                            device.variants.length > 0 && (
                              <div>
                                <p className="text-[11px] font-semibold text-slate-500 mb-1.5">
                                  Available Sizes
                                </p>
                                <div className="flex flex-nowrap gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                                  {device.variants.map(
                                    (variant, variantIndex) => {
                                      const label = firstNonEmpty(
                                        variant?.screen_size,
                                        variant?.size,
                                        variant?.variant_key,
                                      );
                                      if (!label) return null;
                                      const variantId = getTvVariantIdentity(
                                        variant,
                                        variantIndex,
                                      );
                                      const activeVariantId =
                                        getTvVariantIdentity(device.variant, 0);
                                      const isSelected =
                                        activeVariantId === variantId;

                                      return (
                                        <button
                                          key={`${device.id}-size-${variantId}`}
                                          type="button"
                                          onClick={(event) =>
                                            handleSelectTvSize(
                                              device,
                                              variant,
                                              event,
                                            )
                                          }
                                          className={`shrink-0 px-2.5 py-1 rounded-full border text-[11px] font-semibold transition-colors ${
                                            isSelected
                                              ? "bg-blue-600 text-white border-blue-600"
                                              : "bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-slate-50 hover:text-blue-700"
                                          }`}
                                        >
                                          {label}
                                        </button>
                                      );
                                    },
                                  )}
                                </div>
                              </div>
                            )}

                          {/* Store Prices - Desktop */}
                          {hasStoreSection && (
                            <div className="hidden rounded-[24px] border border-slate-100 bg-white p-2.5 shadow-[0_2px_2px_rgba(0,0,0,0.1)] sm:p-4 lg:block">
                              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                                <FaStore className="text-emerald-500" />
                                Check Price On
                              </div>
                              <div className="space-y-2">
                                {device.storePrices
                                  .slice(0, 2)
                                  .map((storePrice, i) => {
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
                                      storePrice.store ||
                                      storePrice.store_name ||
                                      storePrice.storeName ||
                                      storeObj?.name ||
                                      "";
                                    const logoSrc =
                                      storePrice.logo ||
                                      (getStoreLogo
                                        ? getStoreLogo(storeNameCandidate)
                                        : getLogo(storeNameCandidate));
                                    return (
                                      <div
                                        key={`${device.id}-store-${i}`}
                                        className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 px-2.5 py-2.5 sm:px-3 sm:py-3"
                                      >
                                        <div className="flex min-w-0 items-center gap-3">
                                          {logoSrc ? (
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center">
                                              <img
                                                src={logoSrc}
                                                alt={storePrice.store}
                                                className="h-full w-full object-contain"
                                              />
                                            </div>
                                          ) : (
                                            <FaStore className="h-8 w-8 text-slate-300" />
                                          )}
                                          <span className="min-w-0 flex-1 text-sm font-medium text-slate-900">
                                            {storePrice.store || "Online Store"}
                                          </span>
                                        </div>
                                        <div className="flex flex-wrap items-center justify-end gap-3">
                                          <div className="flex flex-col items-end">
                                            <span className="text-sm font-bold text-emerald-600">
                                              {formatPriceDisplay(
                                                storePrice.price,
                                              )}
                                            </span>
                                          </div>
                                          {storePrice.url ? (
                                            <a
                                              href={storePrice.url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              onClick={(e) =>
                                                e.stopPropagation()
                                              }
                                              className="flex shrink-0 items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
                                            >
                                              Buy Now
                                              <FaExternalLinkAlt className="text-xs opacity-80" />
                                            </a>
                                          ) : (
                                            <span className="shrink-0 text-xs font-semibold text-slate-400">
                                              Coming Soon
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                {device.storePrices.length > 2 ? (
                                  <div className="text-center text-xs text-slate-500 py-2">
                                    +{device.storePrices.length - 2} more stores
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-end gap-3">
                        {hasLaunchDate ? (
                          <div className="flex items-center gap-1.5 text-sm text-slate-700 lg:hidden">
                            <FaCalendarAlt className="text-slate-400" />
                            <span>
                              Listed:{" "}
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

                      {hasStoreSection && (
                        <div className="mt-4 rounded-[20px] border border-slate-100 bg-white p-3 shadow-[0_2px_2px_rgba(0,0,0,0.1)] sm:p-4 lg:hidden">
                          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                            <FaStore className="text-emerald-500" />
                            Check Price On
                          </div>
                          <div className="space-y-2">
                            {device.storePrices
                              .slice(0, 2)
                              .map((storePrice, i) => {
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
                                  storePrice.store ||
                                  storePrice.store_name ||
                                  storePrice.storeName ||
                                  storeObj?.name ||
                                  "";
                                const logoSrc =
                                  storePrice.logo ||
                                  (getStoreLogo
                                    ? getStoreLogo(storeNameCandidate)
                                    : getLogo(storeNameCandidate));
                                return (
                                  <div
                                    key={`${device.id}-mobile-store-${i}`}
                                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2.5"
                                  >
                                    <div className="flex min-w-0 items-center gap-3">
                                      {logoSrc ? (
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white">
                                          <img
                                            src={logoSrc}
                                            alt={storePrice.store}
                                            className="h-full w-full object-contain"
                                          />
                                        </div>
                                      ) : (
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f7fbff] ring-1 ring-[#dbe7f7]">
                                          <FaStore className="text-xs text-slate-400" />
                                        </div>
                                      )}
                                      <span className="truncate text-sm font-medium text-slate-800">
                                        {storePrice.store || "Online Store"}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <span className="whitespace-nowrap text-sm font-semibold text-emerald-600">
                                        {formatPriceDisplay(storePrice.price)}
                                      </span>
                                      {storePrice.url ? (
                                        <a
                                          href={storePrice.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          onClick={(e) => e.stopPropagation()}
                                          className="inline-flex items-center gap-1 whitespace-nowrap text-sm font-semibold text-blue-600 transition-colors hover:text-blue-700"
                                        >
                                          Buy Now
                                          <FaExternalLinkAlt className="text-xs" />
                                        </a>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 whitespace-nowrap text-sm font-semibold text-slate-400">
                                          Coming Soon
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* No Results State */}
            {sortedVariants.length === 0 && (
              <div className="rounded-xl border border-slate-100 bg-white py-16 text-center shadow-[0_2px_2px_rgba(0,0,0,0.1)] transition-all duration-300">
                <div className="max-w-md mx-auto">
                  <FaSearch className="text-slate-300 text-5xl mx-auto mb-4" />
                  <h3 className="text-2xl font-semibold text-slate-900 mb-3">
                    No TVs found
                  </h3>
                  <p className="text-slate-600 mb-6">
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
                      className="rounded-lg border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 transition-all duration-300 hover:border-slate-400 hover:bg-slate-50 hover:shadow-md"
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
                    products
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-end">
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
              </div>
            )}
          </div>
        </div>

        <LatestNewsRouteSection
          className="mt-6"
          productType="tv"
          subtitle="Fresh TV launches, display technology updates, and buying context from the Hooks news desk."
        />

        <ProductDiscoverySections
          entityType="tvs"
          catalogItems={devices}
          brandCatalog={deviceContext?.brands || []}
          currentBrand={currentBrandObj?.name || filterBrand || ""}
          className="mt-6"
          layout="latestPhones"
        />

        <MobileSortSheet
          open={showSort}
          onClose={() => setShowSort(false)}
          onChange={handleSortChange}
          options={TV_MOBILE_SORT_OPTIONS}
          sortBy={sortBy}
          subtitle="Arrange televisions by preference"
        />

        {/* Mobile Filter Overlay */}
        {showFilters && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div
              className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
              onClick={() => setShowFilters(false)}
            ></div>

            <div className="absolute bottom-0 left-0 right-0 mx-auto flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-slate-100 bg-white shadow-[0_2px_2px_rgba(0,0,0,0.1)] transform transition-transform duration-300 sm:bottom-4 sm:rounded-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 bg-white p-6">
                <div className="flex items-center gap-3">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">
                      Refine Search
                    </h3>
                    <p className="text-sm text-slate-500">
                      Filter TVs by specifications
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowFilters(false)}
                  className="rounded-lg p-2 transition-colors duration-200 hover:bg-slate-100"
                >
                  <FaTimes className="text-slate-500 text-lg" />
                </button>
              </div>

              <div className="no-scrollbar flex-1 space-y-6 overflow-y-auto p-6 pb-40">
                {/* Brand */}
                <div>
                  <h4 className="font-semibold text-slate-900 text-lg mb-3">
                    Brand
                  </h4>
                  <div className="relative mb-3">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                    <input
                      type="text"
                      value={brandFilterQuery}
                      onChange={(e) => setBrandFilterQuery(e.target.value)}
                      placeholder="Search brand..."
                      className="w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 py-2 text-sm shadow-[0_1px_2px_rgba(15,23,42,0.04)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {filteredBrandOptions.map((brand) => (
                      <label
                        key={brand}
                        className={`flex items-center justify-center gap-2 cursor-pointer px-3 py-2.5 rounded-xl transition-all duration-200 font-medium text-sm border ${
                          filters.brand.includes(brand)
                            ? "bg-gradient-to-b from-blue-500 to-sky-500 text-white border-blue-400"
                            : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={filters.brand.includes(brand)}
                          onChange={() => handleFilterChange("brand", brand)}
                          className="sr-only"
                        />
                        <span>{brand}</span>
                      </label>
                    ))}
                  </div>
                  {filteredBrandOptions.length === 0 && (
                    <div className="text-sm text-slate-500 mt-2">
                      No brands found
                    </div>
                  )}
                </div>

                {/* TV Type */}
                {extractDynamicFilters.applianceTypes.length > 0 && (
                  <div>
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h4 className="text-lg font-semibold text-slate-900">
                        TV Type
                      </h4>
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500">
                        {filters.applianceType.length} selected
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {extractDynamicFilters.applianceTypes.map((type) => (
                        <label
                          key={type}
                          className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors duration-200 ${
                            filters.applianceType.includes(type)
                              ? "border-blue-400 bg-blue-50 text-blue-700"
                              : "border-slate-100 bg-white text-slate-700 hover:border-blue-200 hover:text-blue-700"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={filters.applianceType.includes(type)}
                            onChange={() =>
                              handleFilterChange("applianceType", type)
                            }
                            className="sr-only"
                          />
                          <span>{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Price Range */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-slate-900 text-lg">
                      Price Range
                    </h4>
                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                      {formatRupeeNumber(filters.priceRange.min)} -{" "}
                      {formatRupeeNumber(filters.priceRange.max)}
                    </span>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-[0_2px_2px_rgba(0,0,0,0.1)]">
                    <div className="relative mb-4">
                      <div className="absolute h-2 bg-slate-200 rounded-full w-full top-1/2 transform -translate-y-1/2"></div>
                      <div
                        className="absolute h-2 bg-gradient-to-r from-blue-400 to-sky-400 rounded-full top-1/2 transform -translate-y-1/2"
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
                        step={TV_PRICE_STEP}
                        value={filters.priceRange.min}
                        onChange={(e) =>
                          updatePriceRange(
                            Number(e.target.value),
                            filters.priceRange.max,
                          )
                        }
                        className="absolute w-full top-1/2 transform -translate-y-1/2 appearance-none h-4 bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-blue-500 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer"
                      />

                      <input
                        type="range"
                        min={MIN_PRICE}
                        max={MAX_PRICE}
                        step={TV_PRICE_STEP}
                        value={filters.priceRange.max}
                        onChange={(e) =>
                          updatePriceRange(
                            filters.priceRange.min,
                            Number(e.target.value),
                          )
                        }
                        className="absolute w-full top-1/2 transform -translate-y-1/2 appearance-none h-4 bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-blue-500 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer"
                      />

                      <div className="flex justify-between items-center text-xs mt-6">
                        <span className="text-slate-500">
                          {formatRupeeNumber(MIN_PRICE)}
                        </span>
                        <span className="text-slate-500">
                          {formatRupeeNumber(MAX_PRICE)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Features */}
                <div>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h4 className="text-lg font-semibold text-slate-900">
                      Additional Features
                    </h4>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500">
                      {filters.additionalFeatures.length} selected
                    </span>
                  </div>
                  <div className="relative mb-3">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
                    <input
                      type="text"
                      value={additionalFeatureQuery}
                      onChange={(event) =>
                        setAdditionalFeatureQuery(event.target.value)
                      }
                      placeholder="Search TV features..."
                      className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-8 pr-3 text-sm text-slate-900 transition-all placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
                    {filteredAdditionalFeatureOptions.map((feature) => {
                      return (
                        <label
                          key={feature.id}
                          className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                            filters.additionalFeatures.includes(feature.id)
                              ? "border-blue-400 bg-blue-50 text-blue-700"
                              : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-slate-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={filters.additionalFeatures.includes(
                              feature.id,
                            )}
                            onChange={() =>
                              handleFilterChange(
                                "additionalFeatures",
                                feature.id,
                              )
                            }
                            className="h-4 w-4 shrink-0 appearance-none rounded border border-slate-300 bg-white transition-all duration-200 checked:border-blue-500 checked:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1"
                          />
                          <span className="min-w-0 flex-1">{feature.name}</span>
                          <span className="text-[11px] text-slate-400">
                            {feature.count}
                          </span>
                        </label>
                      );
                    })}
                    {filteredAdditionalFeatureOptions.length === 0 && (
                      <div className="col-span-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-4 text-center text-sm text-slate-500">
                        No matching features
                      </div>
                    )}
                  </div>
                </div>

                {/* Capacity Range */}
                {extractDynamicFilters.capacityRanges.length > 0 && (
                  <div>
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h4 className="text-lg font-semibold text-slate-900">
                        Size Range
                      </h4>
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500">
                        {filters.capacityRange.length} selected
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
                      {extractDynamicFilters.capacityRanges.map((range) => (
                        <label
                          key={range.id}
                          className={`flex cursor-pointer items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors duration-200 ${
                            filters.capacityRange.includes(range.id)
                              ? "border-blue-400 bg-blue-50 text-blue-700"
                              : "border-slate-100 bg-white text-slate-700 hover:border-blue-200 hover:text-blue-700"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={filters.capacityRange.includes(range.id)}
                            onChange={() =>
                              handleFilterChange("capacityRange", range.id)
                            }
                            className="sr-only"
                          />
                          <span>{range.label}</span>
                          <span
                            className={`h-2 w-2 rounded-full ${
                              filters.capacityRange.includes(range.id)
                                ? "bg-blue-600"
                                : "bg-slate-300"
                            }`}
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Energy Rating */}
                {extractDynamicFilters.energyRating.length > 0 && (
                  <div>
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h4 className="text-lg font-semibold text-slate-900">
                        Energy Rating
                      </h4>
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500">
                        {filters.energyRating.length} selected
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {extractDynamicFilters.energyRating.map((rating) => (
                        <label
                          key={rating}
                          className={`flex cursor-pointer items-center justify-center rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors duration-200 ${
                            filters.energyRating.includes(rating)
                              ? "border-blue-400 bg-blue-50 text-blue-700"
                              : "border-slate-100 bg-white text-slate-700 hover:border-blue-200 hover:text-blue-700"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={filters.energyRating.includes(rating)}
                            onChange={() =>
                              handleFilterChange("energyRating", rating)
                            }
                            className="sr-only"
                          />
                          <span>{rating}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Release Year */}
                {extractDynamicFilters.releaseYears.length > 0 && (
                  <div>
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h4 className="text-lg font-semibold text-slate-900">
                        Release Year
                      </h4>
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500">
                        {filters.releaseYear.length} selected
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {extractDynamicFilters.releaseYears.map((year) => {
                        const value = String(year);
                        return (
                          <label
                            key={value}
                            className={`flex cursor-pointer items-center justify-center rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors duration-200 ${
                              filters.releaseYear.includes(value)
                                ? "border-blue-400 bg-blue-50 text-blue-700"
                                : "border-slate-100 bg-white text-slate-700 hover:border-blue-200 hover:text-blue-700"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={filters.releaseYear.includes(value)}
                              onChange={() =>
                                handleFilterChange("releaseYear", value)
                              }
                              className="sr-only"
                            />
                            <span>{value}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Specific Filters for Selected Appliance Type (Mobile) */}
                {effectiveSpecificFilterType &&
                  specificFiltersConfig.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-slate-900 text-lg mb-3">
                      {selectedApplianceType || "TV"} Filters
                    </h4>
                    <div className="space-y-4">
                      {specificFiltersConfig.map((filter) => (
                        <div key={filter.key}>
                          <h5 className="font-medium text-slate-800 text-sm mb-2">
                            {filter.label}
                          </h5>
                          <div className="grid grid-cols-2 gap-2">
                            {filter.options.map((option) => (
                              <label
                                key={option}
                                className={`flex items-center justify-center gap-2 cursor-pointer px-3 py-2.5 rounded-xl transition-all duration-200 font-medium text-sm border ${
                                  filters.specific[filter.key]?.includes(option)
                                    ? "border-blue-400 bg-blue-50 text-blue-700"
                                    : "border-slate-100 bg-white text-slate-700 hover:border-blue-200 hover:text-blue-700"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={
                                    filters.specific[filter.key]?.includes(
                                      option,
                                    ) || false
                                  }
                                  onChange={() =>
                                    handleSpecificFilterChange(
                                      filter.key,
                                      option,
                                    )
                                  }
                                  className="sr-only"
                                />
                                <span className="text-xs">{option}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Apply Button */}
              <div className="absolute bottom-0 left-0 right-0 border-t border-slate-200 bg-white p-6">
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowFilters(false)}
                    className="flex-1 rounded-xl bg-slate-100 py-4 font-semibold text-slate-700 transition-colors duration-200 hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 py-4 font-semibold text-white shadow-lg transition-all duration-200 hover:from-blue-700 hover:to-blue-600"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default TVs;
