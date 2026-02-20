// src/components/HomeApplianceList.jsx
import React, { useState, useEffect, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import {
  FaStar,
  FaHome,
  FaFilter,
  FaTimes,
  FaSearch,
  FaStore,
  FaMoneyBill,
  FaSort,
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
  FaExchangeAlt,
} from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import useStoreLogos from "../../hooks/useStoreLogos";
import Spinner from "../ui/Spinner";
import useTitle from "../../hooks/useTitle";
import { useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { generateSlug } from "../../utils/slugGenerator";
import {
  fetchHomeAppliances,
  fetchTrendingHomeAppliances,
  fetchNewLaunchHomeAppliances,
} from "../../store/deviceSlice";
import useDevice from "../../hooks/useDevice";
import normalizeProduct from "../../utils/normalizeProduct";
import {
  computePopularTvFeatures,
  getTvFeatureSortValue,
  matchesTvFeature,
  TV_FEATURE_CATALOG,
} from "../../utils/tvPopularFeatures";

// Enhanced Image Carousel
const ImageCarousel = ({ images = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setCurrentIndex(0);
  }, [images]);

  const handleNext = (e) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrev = (e) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (!images || images.length === 0) {
    return (
      <div className="relative w-full h-full flex items-center justify-center rounded-lg bg-white">
        <div className="text-center px-3">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-gray-200">
            <FaHome className="text-gray-400 text-sm" />
          </div>
          <span className="text-xs text-gray-500">No image</span>
        </div>
      </div>
    );
  }

  if (images.length === 1) {
    return (
      <div className="relative w-full h-full">
        <img
          src={images[0]}
          alt="product"
          className="w-full h-full object-contain rounded-lg"
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full group">
      <div className="w-full h-full flex items-center justify-center">
        <img
          src={images[currentIndex]}
          alt={`product-view-${currentIndex + 1}`}
          className="w-auto h-auto max-w-full max-h-full object-contain rounded-lg"
          loading="lazy"
        />
      </div>

      <div className="absolute inset-0 flex items-center justify-between p-1 pointer-events-none">
        <button
          onClick={handlePrev}
          className="pointer-events-auto opacity-0 group-hover:opacity-100 md:opacity-100 bg-black/30 hover:bg-black/50 text-white p-1.5 rounded-full transition-all duration-200 transform -translate-x-1"
          aria-label="Previous image"
        >
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <button
          onClick={handleNext}
          className="pointer-events-auto opacity-0 group-hover:opacity-100 md:opacity-100 bg-black/30 hover:bg-black/50 text-white p-1.5 rounded-full transition-all duration-200 transform translate-x-1"
          aria-label="Next image"
        >
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
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
  // Helper function to extract numeric price
  const extractNumericPrice = (price) => {
    if (!price || price === "NaN") return 0;
    const numeric = parseInt(String(price).replace(/[^0-9]/g, ""));
    return isNaN(numeric) ? 0 : numeric;
  };

  // Helper function to format price display
  const formatPriceDisplay = (price) => {
    if (!price || price === "NaN") return "Price not available";
    if (typeof price === "string" && price.includes(",")) return `₹${price}`;
    const numeric = extractNumericPrice(price);
    return numeric > 0
      ? `₹ ${numeric.toLocaleString()}`
      : "Price not available";
  };

  const buildStoreSearchUrl = (storeName, query) => {
    const normalizedStore = String(storeName || "").toLowerCase().trim();
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
      price:
        numericPrice > 0
          ? `₹${numericPrice.toLocaleString()}`
          : "Price not available",
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
    const rows = (Array.isArray(storeRows) ? storeRows : toArrayIfNeeded(storeRows))
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
      return String(a.store_name || "").localeCompare(String(b.store_name || ""));
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
    const audioJson = toObjectIfNeeded(apiDevice.audio_json || apiDevice.audio);
    const smartTvJson = toObjectIfNeeded(
      apiDevice.smart_tv_json || apiDevice.smart_tv,
    );
    const connectivityJson = toObjectIfNeeded(
      apiDevice.connectivity_json || apiDevice.connectivity,
    );
    const portsJson = toObjectIfNeeded(apiDevice.ports_json || apiDevice.ports);
    const powerJson = toObjectIfNeeded(apiDevice.power_json || apiDevice.power);
    const dimensionsJson = toObjectIfNeeded(
      apiDevice.dimensions_json ||
        apiDevice.dimensions ||
        apiDevice.physical_details,
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
      const prices = normalizeTvStoreRows(v.store_prices, `${v.variant_id}-agg`).map(
        (sp, spIdx) => ({
          id: sp.id || `${v.variant_id}-${spIdx}`,
          variant_id: v.variant_id,
          store: sp.store_name || sp.store || "Store",
          price: sp.price,
          url: sp.url,
          offer_text: sp.offer_text,
          delivery_info: sp.delivery_info,
        }),
      );
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

    const screenSize = firstNonEmpty(
      keySpecs.screen_size,
      displayJson.screen_size,
      variants[0]?.screen_size,
    );
    const resolution = firstNonEmpty(
      keySpecs.resolution,
      displayJson.resolution,
    );
    const refreshRate = firstNonEmpty(
      keySpecs.refresh_rate,
      displayJson.refresh_rate,
    );
    const panelType = firstNonEmpty(
      keySpecs.panel_type,
      displayJson.panel_type,
    );
    const operatingSystem = firstNonEmpty(
      keySpecs.operating_system,
      smartTvJson.operating_system,
    );
    const rawEnergyRating = firstNonEmpty(
      powerJson.energy_rating,
      powerJson.energy_star_rating,
      keySpecs.energy_rating,
      keySpecs.energy_star_rating,
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
      price:
        numericPrice > 0
          ? `₹${numericPrice.toLocaleString()}`
          : "Price not available",
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
        apiDevice.country_of_origin,
      ),
      applianceTypeIcon: getApplianceTypeIcon(applianceTypeRaw),
      key_specs_json: keySpecs,
      display_json: displayJson,
      audio_json: audioJson,
      smart_tv_json: smartTvJson,
      connectivity_json: connectivityJson,
      ports_json: portsJson,
      power_json: powerJson,
      dimensions_json: dimensionsJson,
      design_json: designJson,
      gaming_json: gamingJson,
      warranty_json: warrantyJson,
    };
  };

  // Use Redux-provided home appliances (via `useDevice`) or fallback to mock
  const { homeAppliances, homeAppliancesLoading, setDevices } = useDevice();

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

      const price =
        numericPrice > 0
          ? `₹${numericPrice.toLocaleString()}`
          : "Price not available";

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
      const storeName =
        sp.store_name || sp.store || sp.storeName || "Store";
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

    const price =
      numericPrice > 0
        ? `₹${numericPrice.toLocaleString()}`
        : "Price not available";

    const resolvedScreenSize = firstNonEmpty(
      variant?.screen_size,
      variant?.size,
      device.specs?.screenSize,
      device.specs?.capacity,
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
      return extractNumericPrice(variant?.base_price) || Number.POSITIVE_INFINITY;
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
          firstNonEmpty(variant?.screen_size, variant?.size, variant?.variant_key),
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
      applianceTypes: Array.from(meta.applianceTypes).sort(),

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
      releaseYears: Array.from(meta.releaseYears).sort((a, b) => b - a),

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
  const MIN_PRICE = 0;
  const MAX_PRICE = 500000;

  const [filters, setFilters] = useState({
    brand: [],
    priceRange: { min: MIN_PRICE, max: MAX_PRICE },
    applianceType: [],
    energyRating: [],
    capacityRange: [],
    releaseYear: [],

    // Specific filters (will be populated based on appliance type)
    specific: {},
  });

  const [sortBy, setSortBy] = useState("featured");
  const [searchQuery, setSearchQuery] = useState("");
  const [brandFilterQuery, setBrandFilterQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [compareItems, setCompareItems] = useState([]);
  const [selectedVariantByProduct, setSelectedVariantByProduct] = useState({});

  // Set page title
  useTitle({
    page: "tvs",
  });

  const navigate = useNavigate();
  const { search } = useLocation();
  const [params] = useSearchParams();
  const filter = params.get("filter");
  const feature = params.get("feature");
  const normalizedFeature = feature
    ? feature.toString().toLowerCase().replace(/\s+/g, "-")
    : null;
  const dispatch = useDispatch();
  const [popularFeatureOrder, setPopularFeatureOrder] = useState([]);
  const [popularFeatureOrderLoaded, setPopularFeatureOrderLoaded] =
    useState(false);

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
          const res = await fetch(
            `https://api.apisphere.in/api/public/popular-features?deviceType=${encodeURIComponent(deviceType)}&days=7&limit=16`,
            controller ? { signal: controller.signal } : undefined,
          );
          if (!res.ok) continue;

          const data = await res.json();
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

  // Get selected appliance type for specific filters
  const selectedApplianceType =
    filters.applianceType.length === 1 ? filters.applianceType[0] : null;

  const specificFiltersConfig = useMemo(
    () =>
      selectedApplianceType
        ? getSpecificFiltersForType(selectedApplianceType)
        : [],
    [selectedApplianceType],
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

  const deviceContext = useDevice();
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
      selectedApplianceType === device.applianceTypeDisplay &&
      filters.specific
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
      capacityRange: [],
      releaseYear: [],
      specific: {},
    });
    setSearchQuery("");
    setBrandFilterQuery("");
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
    const sp = new URLSearchParams(search || "");
    if (featureId) trackFeatureClick(featureId);
    if (featureId) sp.set("feature", featureId);
    else sp.delete("feature");
    sp.delete("filter");
    const next = sp.toString();
    navigate(`/tvs${next ? `?${next}` : ""}`);
  };

  const handleView = (device, e, store) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const params = new URLSearchParams();
    const productId =
      device.productId ?? device.product_id ?? device.id ?? device.model ?? "";
    if (productId !== null && productId !== undefined && productId !== "") {
      params.set("id", String(productId));
    }
    params.set("type", "home-appliance");
    const variantId =
      device.variant?.variant_id ??
      device.variant?.id ??
      device.variant?.variant_key ??
      null;
    if (variantId) {
      params.set("variantId", String(variantId));
    }
    if (store?.store) {
      params.set("store", String(store.store));
    }

    // Generate SEO-friendly slug-based URL
    const slug =
      generateSlug(
        device.name ||
          device.product_name ||
          device.model ||
          device.brand ||
          String(productId || ""),
      ) || `tv-${String(productId || "detail")}`;
    const qs = params.toString();

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
        fetch(`http://localhost:500/api/public/product/${pid}/view`, {
          method: "POST",
        }).catch(() => {});
      }
    } catch {}

    navigate({
      pathname: `/tvs/${slug}`,
      search: qs ? `?${qs}` : "",
    });
  };

  const handleCompareToggle = (device, e) => {
    if (e) e.stopPropagation();
    const deviceId = device.productId ?? device.id ?? device.model;
    setCompareItems((prev) => {
      const isAlreadyAdded = prev.some(
        (item) => (item.productId ?? item.id ?? item.model) === deviceId,
      );
      if (isAlreadyAdded) {
        return prev.filter(
          (item) => (item.productId ?? item.id ?? item.model) !== deviceId,
        );
      } else {
        return [...prev, device];
      }
    });
  };

  const isCompareSelected = (device) => {
    const deviceId = device.productId ?? device.id ?? device.model;
    return compareItems.some(
      (item) => (item.productId ?? item.id ?? item.model) === deviceId,
    );
  };

  const handleCompareNavigate = (e) => {
    if (e) e.stopPropagation();
    if (compareItems.length === 0) return;

    const queryParams = new URLSearchParams();
    compareItems.forEach((device) => {
      const idVal = device.productId ?? device.id ?? device.model;
      queryParams.append("add", String(idVal));
    });

    navigate(`/compare?${queryParams.toString()}`, {
      state: { initialProducts: compareItems },
    });
  };

  const currentYear = new Date().getFullYear();
  const sanitizeDescription = (desc = "") => {
    const text = String(desc || "")
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim();
    return text.length > 180 ? `${text.slice(0, 177)}...` : text;
  };

  let seoTitle = `Best TVs ${currentYear} - Compare Smart TVs, Prices & Specs | Hook`;
  let seoDescription =
    "Browse the latest TVs with detailed display, audio, smart features, and price comparisons on Hook.";

  if (filter === "trending") {
    seoTitle = `Trending TVs ${currentYear} - Most Popular Smart TVs & Prices | Hook`;
    seoDescription =
      "Explore trending TVs with rising demand, key specifications, and latest prices to find the right smart TV on Hook.";
  } else if (filter === "new") {
    seoTitle = `Latest TVs ${currentYear} - New Smart TV Launches & Prices | Hook`;
    seoDescription =
      "Discover newly launched TVs with updated specifications, panel details, refresh rates, and best store prices on Hook.";
  }

  if (currentBrandObj) {
    seoTitle = `${currentBrandObj.name} TVs ${currentYear} - Models, Prices & Specs | Hook`;
    seoDescription = sanitizeDescription(
      currentBrandObj.description ||
        `Compare ${currentBrandObj.name} TVs with detailed specifications, latest prices, and top store offers on Hook.`,
    );
  }

  // Get appliance type icon component
  const ApplianceTypeIcon = ({ applianceType }) => {
    const IconComponent = getApplianceTypeIcon(applianceType);
    return <IconComponent className="text-sm" />;
  };

  return (
    <div className="min-h-screen  ">
      <style>{animationStyles}</style>
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDescription} />
      </Helmet>
      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-4 sm:p-6 md:p-8 lg:p-10 bg-white">
        {/* Hero Section - Professional Styling */}
        <div className="mb-8 sm:mb-10 lg:mb-12">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-purple-50 backdrop-blur-sm px-3 py-1.5 rounded-full border border-purple-100 mb-4 sm:mb-6">
            <FaHome className="text-purple-600 text-sm" />
            <span className="text-xs sm:text-sm font-semibold text-purple-800">
              SMART TVS
            </span>
          </div>

          {/* Main Heading - Gradient Text */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 sm:mb-4 lg:mb-6 leading-tight">
            Explore Premium{" "}
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              TVs
            </span>
          </h1>

          {/* Subtitle */}
          <h4 className="text-base sm:text-lg lg:text-xl mb-6 sm:mb-8 text-gray-700 leading-relaxed max-w-3xl">
            Discover the latest televisions with detailed display, audio, smart
            features and gaming readiness. Compare specifications and find the
            right TV for your home.
          </h4>
        </div>

        <div className="mb-6 sm:mb-7 md:mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FaFilter className="text-purple-600" />
              <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                Popular Features
              </h3>
            </div>
            {normalizedFeature && (
              <button
                onClick={() => setFeatureParam(null)}
                className="text-xs sm:text-sm text-purple-700 hover:text-purple-900 font-semibold"
              >
                Clear
              </button>
            )}
          </div>
          {popularFeatureOrderLoaded && (
            <p className="text-xs text-gray-600 mb-3">
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
                  className={`flex items-center gap-2 px-3 py-2 rounded-full border text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors ${
                    isActive
                      ? "bg-purple-600 text-white border-purple-600"
                      : "bg-white text-gray-700 border-gray-200 hover:border-purple-300 hover:text-purple-700"
                  }`}
                >
                  <span className={isActive ? "text-white" : "text-purple-600"}>
                    {Icon ? <Icon className="text-base" /> : null}
                  </span>
                  <span>{pf.name}</span>
                </button>
              );
            })}
          </div>
        </div>
        {/* Control Bar */}
        <div className="mb-8">
          {/* Desktop Search and Sort */}
          <div className="hidden lg:flex items-center justify-between mb-6">
            <div className="flex-1 max-w-2xl">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FaSearch className="text-purple-500 group-focus-within:text-purple-600 transition-colors duration-200" />
                </div>
                <input
                  type="text"
                  placeholder="Search TVs by brand, model, display, or features..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <FaFilter className="text-gray-500" />
                <span className="text-sm text-gray-600">Sort by:</span>
              </div>
              <div className="relative min-w-[200px]">
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 text-gray-700 appearance-none cursor-pointer bg-white pr-10 transition-all duration-200 hover:border-purple-400"
                >
                  <option value="featured">Featured Devices</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="newest">Newest First</option>
                  <option value="capacity">Highest Capacity</option>
                  <option value="energy">Best Energy Rating</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
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
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-xl transition-colors"
                >
                  <FaTimes />
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Mobile Search and Filter Bar */}
          <div className="lg:hidden space-y-4 mb-6">
            <div className="relative group">
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-500 group-focus-within:text-purple-600 transition-colors duration-200" />
              <input
                type="text"
                placeholder="Search TVs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 pl-12 pr-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-100 focus:border-purple-500 text-gray-700 transition-all duration-200 placeholder:text-gray-400"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowFilters(true)}
                className="flex items-center justify-center gap-2 flex-1 h-12 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 rounded-xl transition-all duration-300 font-semibold hover:from-purple-600 hover:to-blue-600 hover:shadow-lg hover:-translate-y-0.5"
              >
                <FaFilter />
                Filters
                {getActiveFiltersCount() > 0 && (
                  <span className="text-purple-200 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {getActiveFiltersCount()}
                  </span>
                )}
              </button>

              <button
                onClick={() => setShowSort(true)}
                className="flex items-center justify-center gap-2 flex-1 h-12   text-gray-700 px-4 rounded-xl border border-gray-900 hover:bg-gray-50 transition-all duration-300 font-semibold"
              >
                <FaSort />
                Sort
              </button>
            </div>

            {/* Active Filters Badge - Mobile */}
            {getActiveFiltersCount() > 0 && (
              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl border border-purple-200">
                <div className="flex items-center gap-3">
                  <FaInfoCircle className="text-purple-600" />
                  <div>
                    <span className="text-sm font-medium text-purple-800">
                      {getActiveFiltersCount()} filter
                      {getActiveFiltersCount() > 1 ? "s" : ""} applied
                    </span>
                    <p className="text-xs text-purple-600 mt-0.5">
                      Showing {filteredVariants.length} of {variantCards.length}{" "}
                      products
                    </p>
                  </div>
                </div>
                <button
                  onClick={clearFilters}
                  className="text-purple-600 hover:text-purple-800 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-purple-100 transition-colors duration-200"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* Results Count */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Available TVs
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Browse through our TV collection with detailed specs, size
                options, and latest pricing
              </p>
            </div>
            <div className="hidden lg:block text-sm text-gray-500">
              Showing {sortedVariants.length} of {variantCards.length} products
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Desktop Filter Sidebar */}
          <div className="hidden lg:block lg:w-80 flex-shrink-0">
            <div className="p-6 sticky top-6">
              {/* Filters Header */}
              <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-300">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    Refine Search
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Narrow down TVs by specifications
                  </p>
                </div>
                {getActiveFiltersCount() > 0 && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 font-semibold transition-colors duration-200 px-3 py-1 rounded-lg hover:bg-purple-50"
                  >
                    <FaTimes />
                    Clear all
                  </button>
                )}
              </div>

              {/* Active Filters Badge */}
              {getActiveFiltersCount() > 0 && (
                <div className="mb-6 p-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl border border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-purple-800">
                      Active Filters
                    </span>
                    <span className="text-xs font-bold text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                      {getActiveFiltersCount()}
                    </span>
                  </div>
                  <p className="text-xs text-purple-600">
                    Refine further or clear to see all TVs
                  </p>
                </div>
              )}

              {/* Price Range Filter */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
                    Price Range
                  </h4>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    ₹{filters.priceRange.min?.toLocaleString()} - ₹
                    {filters.priceRange.max?.toLocaleString()}
                  </span>
                </div>
                <div className="bg-gradient-to-r from-purple-50 via-blue-50 to-white rounded-xl p-4 border border-gray-200">
                  <div className="flex justify-between text-sm font-medium text-gray-700 mb-4">
                    <div className="text-center">
                      <div className="text-xs text-gray-500">Minimum</div>
                      <div className="font-bold">
                        ₹{filters.priceRange.min?.toLocaleString()}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500">Maximum</div>
                      <div className="font-bold">
                        ₹{filters.priceRange.max?.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Dual Range Slider */}
                  <div className="relative mb-8">
                    <div className="absolute h-2 bg-gray-200 rounded-full w-full top-1/2 transform -translate-y-1/2"></div>
                    <div
                      className="absolute h-2 bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600 rounded-full top-1/2 transform -translate-y-1/2"
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
                      value={filters.priceRange.min}
                      onChange={(e) =>
                        updatePriceRange(
                          Number(e.target.value),
                          filters.priceRange.max,
                        )
                      }
                      className="absolute w-full top-1/2 transform -translate-y-1/2 appearance-none h-4 bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-purple-500 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer"
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
                      className="absolute w-full top-1/2 transform -translate-y-1/2 appearance-none h-4 bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-purple-500 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer"
                    />
                  </div>

                  <div className="flex justify-between items-center text-xs mb-2">
                    <span className="text-gray-500">
                      ₹{MIN_PRICE.toLocaleString()}
                    </span>
                    <span className="text-gray-500">
                      ₹{MAX_PRICE.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Appliance Type Filter */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
                    Appliance Type
                  </h4>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {filters.applianceType.length} selected
                  </span>
                </div>
                <div className="space-y-2">
                  {extractDynamicFilters.applianceTypes.map((type) => {
                    const Icon = getApplianceTypeIcon(type);
                    return (
                      <label
                        key={type}
                        className={`flex items-center justify-between gap-2 cursor-pointer px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                          filters.applianceType.includes(type)
                            ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
                            : "bg-gray-50 border border-gray-200 text-gray-700 hover:border-gray-300"
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
                        <div className="flex items-center gap-3">
                          <Icon className="text-sm" />
                          <span className="text-sm">{type}</span>
                        </div>
                        <div
                          className={`w-2 h-2 rounded-full ${
                            filters.applianceType.includes(type)
                              ? "bg-white"
                              : "bg-gray-300"
                          }`}
                        ></div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Brand Filter */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
                    Brand
                  </h4>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {filters.brand.length} selected
                  </span>
                </div>
                <div className="relative mb-3">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                  <input
                    type="text"
                    value={brandFilterQuery}
                    onChange={(e) => setBrandFilterQuery(e.target.value)}
                    placeholder="Search brand..."
                    className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {filteredBrandOptions.map((brand) => (
                    <label
                      key={brand}
                      className="flex items-center gap-3 cursor-pointer group hover:bg-gray-50 px-3 py-2.5 rounded-lg transition-all duration-200 border border-transparent hover:border-gray-200"
                    >
                      <input
                        type="checkbox"
                        checked={filters.brand.includes(brand)}
                        onChange={() => handleFilterChange("brand", brand)}
                        className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-2 focus:ring-purple-500 focus:ring-offset-1"
                      />
                      <span className="text-gray-700 group-hover:text-gray-900 font-medium flex-1">
                        {brand}
                      </span>
                      <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
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

              {/* Energy Rating Filter */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
                    Energy Rating
                  </h4>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {filters.energyRating.length} selected
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {extractDynamicFilters.energyRating.map((rating) => (
                    <label
                      key={rating}
                      className={`flex items-center justify-center gap-2 cursor-pointer px-3 py-2.5 rounded-xl transition-all duration-200 font-medium text-sm ${
                        filters.energyRating.includes(rating)
                          ? "bg-gradient-to-b from-purple-600 to-blue-600 text-white shadow-lg"
                          : "bg-gray-50 border border-gray-200 text-gray-700 hover:border-gray-300 hover:shadow-sm"
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

              {/* Capacity Range Filter */}
              {extractDynamicFilters.capacityRanges.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
                      Capacity Range
                    </h4>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {filters.capacityRange.length} selected
                    </span>
                  </div>
                  <div className="space-y-2">
                    {extractDynamicFilters.capacityRanges.map((range) => (
                      <label
                        key={range.id}
                        className={`flex items-center justify-between gap-2 cursor-pointer px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                          filters.capacityRange.includes(range.id)
                            ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
                            : "bg-gray-50 border border-gray-200 text-gray-700 hover:border-gray-300"
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
                              : "bg-gray-300"
                          }`}
                        ></div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Specific Filters for Selected Appliance Type */}
              {selectedApplianceType && specificFiltersConfig.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
                      <FaCog className="text-purple-500" />
                      {selectedApplianceType} Filters
                    </h4>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {Object.values(filters.specific || {}).flat().length}{" "}
                      selected
                    </span>
                  </div>
                  <div className="space-y-4">
                    {specificFiltersConfig.map((filter) => (
                      <div key={filter.key}>
                        <h5 className="font-medium text-gray-800 text-sm mb-2">
                          {filter.label}
                        </h5>
                        <div className="space-y-2">
                          {filter.options.map((option) => (
                            <label
                              key={option}
                              className="flex items-center gap-3 cursor-pointer group hover:bg-gray-50 px-3 py-2 rounded-lg transition-all duration-200"
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
                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                              />
                              <span className="text-gray-700 text-sm group-hover:text-gray-900">
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

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6 auto-rows-fr md:[&>*:nth-child(2n)]:border-l md:[&>*:nth-child(2n)]:border-gray-200 md:[&>*:nth-child(2n)]:pl-6 md:[&>*:nth-child(2n+1)]:pr-6">
              {sortedVariants.map((device, idx) => (
                <div
                  key={`${device.id}-${idx}`}
                  onClick={(e) => handleView(device, e)}
                  className="h-full overflow-hidden rounded-md cursor-pointer"
                >
                  <div className="p-3 sm:p-4 md:p-5 lg:p-6 pt-4 sm:pt-5 md:pt-6">
                    {/* Top Row: Image and Basic Info */}
                    <div className="grid grid-cols-[minmax(0,8.5rem)_minmax(0,1fr)] sm:grid-cols-[minmax(0,9rem)_minmax(0,1fr)] gap-3 w-full items-start">
                      {/* Product Image - Fixed container */}
                      <div className="relative flex-shrink-0 w-full h-36 sm:h-48 rounded-2xl overflow-hidden group bg-white">
                        <div className="w-full h-full flex items-center justify-center p-1.5 sm:p-2">
                          <ImageCarousel images={device.images} />
                        </div>
                        {/* Compare Checkbox Overlay - Top Right */}
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute top-2 right-2 z-10 rounded-md transition-all duration-200 cursor-pointer hover:bg-gray-50"
                          title="Add to compare"
                        >
                          <input
                            type="checkbox"
                            checked={isCompareSelected(device)}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleCompareToggle(device, e);
                            }}
                            className="w-3 h-3 m-1 accent-purple-600 cursor-pointer"
                          />
                        </div>
                      </div>

                      {/* Basic Info */}
                      <div className="flex-1 min-w-0">
                        {/* Brand and Model */}
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700">
                                {device.brand}
                              </span>
                            </div>
                            <h5 className="font-bold text-gray-900 text-base leading-6 break-words">
                              {device.name || device.model || "TV"}
                            </h5>
                            {(() => {
                              const screenSize = String(
                                device.specs?.screenSize ||
                                  device.specs?.capacity ||
                                  "",
                              ).trim();
                              const resolution = String(
                                device.specs?.resolution || "",
                              ).trim();
                              const refreshRate = String(
                                device.specs?.refreshRate || "",
                              ).trim();
                              const panelType = String(
                                device.specs?.displayType ||
                                  device.specs?.type ||
                                  "",
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
                                <p className="mt-1 text-[12px] text-gray-600 leading-5 break-words">
                                  {tvIdentity}
                                </p>
                              );
                            })()}
                          </div>
                        </div>

                        {Array.isArray(device.variants) &&
                          device.variants.length > 0 && (
                            <div className="mb-3">
                              <p className="text-[11px] font-semibold text-gray-500 mb-1.5">
                                Available Sizes
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {device.variants.map((variant, variantIndex) => {
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
                                  const activeVariantId = getTvVariantIdentity(
                                    device.variant,
                                    0,
                                  );
                                  const isSelected = activeVariantId === variantId;

                                  return (
                                    <button
                                      key={`${device.id}-size-${variantId}`}
                                      type="button"
                                      onClick={(event) =>
                                        handleSelectTvSize(device, variant, event)
                                      }
                                      className={`px-2.5 py-1 rounded-full border text-[11px] font-semibold transition-colors ${
                                        isSelected
                                          ? "bg-purple-600 text-white border-purple-600"
                                          : "bg-white text-gray-700 border-gray-300 hover:border-purple-300 hover:text-purple-700"
                                      }`}
                                    >
                                      {label}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                        {/* Price */}
                        <div className="mb-3">
                          <div className="flex items-center justify-between">
                            <div>
                              {(() => {
                                const firstStoreUrl = (
                                  device.storePrices || []
                                )
                                  .map((sp) =>
                                    getStoreVisitUrl(
                                      sp?.url,
                                      sp?.store,
                                      [
                                        device.brand,
                                        device.name || device.model || "TV",
                                        device.specs?.screenSize,
                                        device.specs?.resolution,
                                      ]
                                        .filter(Boolean)
                                        .join(" "),
                                    ),
                                  )
                                  .find((url) => Boolean(url));
                                if (!device.brand) return null;
                                return (
                                  <a
                                    href={firstStoreUrl || "#"}
                                    target={firstStoreUrl ? "_blank" : undefined}
                                    rel={
                                      firstStoreUrl
                                        ? "noopener noreferrer"
                                        : undefined
                                    }
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (!firstStoreUrl) e.preventDefault();
                                    }}
                                    className={`inline-block w-full mb-1 text-[12px] font-medium leading-snug whitespace-nowrap overflow-hidden text-ellipsis ${
                                      firstStoreUrl
                                        ? "text-blue-700 hover:text-blue-800 hover:underline"
                                        : "text-blue-700 cursor-default"
                                    }`}
                                  >
                                    {`Visit the ${device.brand} Store`}
                                  </a>
                                );
                              })()}
                              <div className="text-lg font-bold text-green-600">
                                {device.price}
                              </div>
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* Expanded Details */}
                    <div className="mt-3 sm:mt-4 md:mt-5 pt-3 sm:pt-4 md:pt-5">

                      {/* Store Availability */}
                      {device.storePrices && device.storePrices.length > 0 && (
                        <div className="mb-4">
                          <div className="flex items-center gap-2 mb-3">
                            <h4 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                              <FaStore className="text-green-500" />
                              Available At
                            </h4>
                          </div>
                          <div className="space-y-2">
                            {device.storePrices
                              .slice(0, 3)
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
                                const logoSrcRaw =
                                  storePrice.logo ||
                                  (getStoreLogo
                                    ? getStoreLogo(storeNameCandidate)
                                    : getLogo(storeNameCandidate));
                                const logoSrc = isLikelyImageSrc(logoSrcRaw)
                                  ? logoSrcRaw
                                  : "";
                                const visitUrl = getStoreVisitUrl(
                                  storePrice.url,
                                  storePrice.store,
                                  [
                                    device.brand,
                                    device.name || device.model || "TV",
                                    device.specs?.screenSize,
                                    device.specs?.resolution,
                                  ]
                                    .filter(Boolean)
                                    .join(" "),
                                );
                                return (
                                  <div
                                    key={`${device.id}-store-${i}`}
                                    className="flex items-center justify-between text-sm bg-gradient-to-br from-purple-50 to-blue-50 px-3 py-2 rounded-lg"
                                  >
                                    <div className="flex items-center gap-2">
                                      {logoSrc ? (
                                        <img
                                          src={logoSrc}
                                          alt={storeObj?.name || storePrice.store}
                                          className="w-6 h-6 object-contain"
                                        />
                                      ) : (
                                        <FaStore className="text-gray-400" />
                                      )}
                                      <span className="font-medium text-gray-900 capitalize">
                                        {storePrice.store || storeObj?.name || "Online Store"}
                                      </span>
                                    </div>
                                    <div className="font-bold text-green-600">
                                      {formatPriceDisplay(storePrice.price)}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <a
                                        href={visitUrl || "#"}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (!visitUrl) e.preventDefault();
                                        }}
                                        className="text-blue-600 hover:text-blue-800 text-xs font-medium flex items-center gap-1"
                                      >
                                        Buy Now
                                        <FaExternalLinkAlt className="text-xs opacity-80" />
                                      </a>
                                    </div>
                                  </div>
                                );
                              })}
                            {device.storePrices.length > 3 && (
                              <div className="text-center text-xs text-gray-500">
                                +{device.storePrices.length - 3} more stores
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* No Results State */}
            {sortedVariants.length === 0 && (
              <div className="text-center py-16 bg-white border border-gray-200 rounded-xl">
                <div className="max-w-md mx-auto">
                  <FaSearch className="text-gray-300 text-5xl mx-auto mb-4" />
                  <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                    No TVs found
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Try adjusting your filters or search terms to find what
                    you're looking for. We have a wide range of devices
                    available.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={clearFilters}
                      className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-all duration-200"
                    >
                      Clear All Filters
                    </button>
                    <button
                      onClick={() => setShowFilters(true)}
                      className="bg-white text-gray-700 px-6 py-3 rounded-lg font-semibold border border-gray-300 hover:bg-gray-50 transition-colors duration-200"
                    >
                      Adjust Filters
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Results Footer */}
            {sortedVariants.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="text-sm text-gray-600">
                    Showing {sortedVariants.length} of {variantCards.length}{" "}
                    products
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() =>
                        window.scrollTo({ top: 0, behavior: "smooth" })
                      }
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
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
                    <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                      Last updated: Today
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Sort Modal */}
        {showSort && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div
              className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
              onClick={() => setShowSort(false)}
            ></div>

            <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl transform transition-transform duration-300 max-h-[70vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
                <div className="flex items-center gap-3">
                  <FaSort className="text-blue-600 text-xl" />
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Sort Options
                    </h3>
                    <p className="text-sm text-gray-500">
                      Arrange TVs by preference
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
                    desc: "Curated selection of popular TV models",
                  },
                  {
                    value: "price-low",
                    label: "Price: Low to High",
                    desc: "Budget-friendly options first",
                  },
                  {
                    value: "price-high",
                    label: "Price: High to Low",
                    desc: "Premium TVs first",
                  },
                  {
                    value: "newest",
                    label: "Newest First",
                    desc: "Latest releases",
                  },
                  {
                    value: "capacity",
                    label: "Highest Capacity",
                    desc: "Largest capacity first",
                  },
                  {
                    value: "energy",
                    label: "Best Energy Rating",
                    desc: "Most efficient first",
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

        {/* Mobile Filter Overlay */}
        {showFilters && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div
              className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
              onClick={() => setShowFilters(false)}
            ></div>

            <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl transform transition-transform duration-300 max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
                <div className="flex items-center gap-3">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Refine Search
                    </h3>
                    <p className="text-sm text-gray-500">
                      Filter TVs by specifications
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

              <div className="p-6 overflow-y-auto max-h-[70vh] pb-40 space-y-6">
                {/* Price Range */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900 text-lg">
                      Price Range
                    </h4>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      ₹{filters.priceRange.min?.toLocaleString()} - ₹
                      {filters.priceRange.max?.toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-gradient-to-r from-purple-50 via-blue-50 to-white rounded-xl p-4 border border-gray-200">
                    <div className="relative mb-4">
                      <div className="absolute h-2 bg-gray-200 rounded-full w-full top-1/2 transform -translate-y-1/2"></div>
                      <div
                        className="absolute h-2 bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600 rounded-full top-1/2 transform -translate-y-1/2"
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
                        className="absolute w-full top-1/2 transform -translate-y-1/2 appearance-none h-4 bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-blue-500 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer"
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
                        className="absolute w-full top-1/2 transform -translate-y-1/2 appearance-none h-4 bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-blue-500 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer"
                      />

                      <div className="flex justify-between items-center text-xs mt-6">
                        <span className="text-gray-500">
                          ₹{MIN_PRICE.toLocaleString()}
                        </span>
                        <span className="text-gray-500">
                          ₹{MAX_PRICE.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Appliance Type */}
                <div>
                  <h4 className="font-semibold text-gray-900 text-lg mb-3">
                    Appliance Type
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {extractDynamicFilters.applianceTypes.map((type) => {
                      const Icon = getApplianceTypeIcon(type);
                      return (
                        <label
                          key={type}
                          className={`flex items-center justify-center gap-2 cursor-pointer px-3 py-2.5 rounded-xl transition-all duration-200 font-medium text-sm ${
                            filters.applianceType.includes(type)
                              ? "bg-gradient-to-b from-purple-600 to-blue-600 text-white shadow-lg"
                              : "bg-gray-50 border border-gray-200 text-gray-700 hover:border-gray-300 hover:shadow-sm"
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
                          <Icon className="text-xs" />
                          <span>{type}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Brand */}
                <div>
                  <h4 className="font-semibold text-gray-900 text-lg mb-3">
                    Brand
                  </h4>
                  <div className="relative mb-3">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                    <input
                      type="text"
                      value={brandFilterQuery}
                      onChange={(e) => setBrandFilterQuery(e.target.value)}
                      placeholder="Search brand..."
                      className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {filteredBrandOptions.map((brand) => (
                      <label
                        key={brand}
                        className={`flex items-center justify-center gap-2 cursor-pointer px-3 py-2.5 rounded-xl transition-all duration-200 font-medium text-sm ${
                          filters.brand.includes(brand)
                            ? "bg-gradient-to-b from-purple-600 to-blue-600 text-white shadow-lg"
                            : "bg-gray-50 border border-gray-200 text-gray-700 hover:border-gray-300 hover:shadow-sm"
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
                    <div className="text-sm text-gray-500 mt-2">
                      No brands found
                    </div>
                  )}
                </div>

                {/* Energy Rating */}
                <div>
                  <h4 className="font-semibold text-gray-900 text-lg mb-3">
                    Energy Rating
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {extractDynamicFilters.energyRating.map((rating) => (
                      <label
                        key={rating}
                        className={`flex items-center justify-center gap-2 cursor-pointer px-3 py-2.5 rounded-xl transition-all duration-200 font-medium text-sm ${
                          filters.energyRating.includes(rating)
                            ? "bg-gradient-to-b from-purple-600 to-blue-600 text-white shadow-lg"
                            : "bg-gray-50 border border-gray-200 text-gray-700 hover:border-gray-300 hover:shadow-sm"
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
                        <FaStar className="text-xs" />
                        <span>{rating}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Specific Filters for Selected Appliance Type (Mobile) */}
                {selectedApplianceType && specificFiltersConfig.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 text-lg mb-3">
                      {selectedApplianceType} Filters
                    </h4>
                    <div className="space-y-4">
                      {specificFiltersConfig.slice(0, 2).map((filter) => (
                        <div key={filter.key}>
                          <h5 className="font-medium text-gray-800 text-sm mb-2">
                            {filter.label}
                          </h5>
                          <div className="grid grid-cols-2 gap-2">
                            {filter.options.slice(0, 4).map((option) => (
                              <label
                                key={option}
                                className={`flex items-center justify-center gap-2 cursor-pointer px-3 py-2.5 rounded-xl transition-all duration-200 font-medium text-sm ${
                                  filters.specific[filter.key]?.includes(option)
                                    ? "bg-gradient-to-b from-purple-600 to-blue-600 text-white shadow-lg"
                                    : "bg-gray-50 border border-gray-200 text-gray-700 hover:border-gray-300 hover:shadow-sm"
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
              <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-6">
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowFilters(false)}
                    className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-xl font-semibold hover:bg-gray-200 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-xl font-semibold hover:from-purple-600 hover:to-blue-600 transition-all duration-200 shadow-lg"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Help Section */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-gradient-to-r from-purple-200 to-blue-200 rounded-2xl p-6 lg:p-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Need help choosing?
              </h3>
              <p className="text-gray-600 mb-4 lg:mb-0">
                Use our comparison tool to side-by-side compare TV models by
                screen size, panel, refresh rate, smart features, and price.
              </p>
            </div>
            <button
              onClick={() => navigate("/compare")}
              className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-blue-600 transition-all duration-200 whitespace-nowrap"
            >
              Open Comparison Tool
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TVs;

