// src/components/LaptopList.jsx
import React, { useState, useEffect, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import {
  FaStar,
  FaLaptop,
  FaBatteryFull,
  FaMemory,
  FaMicrochip,
  FaDesktop,
  FaWeightHanging,
  FaFilter,
  FaTimes,
  FaSearch,
  FaStore,
  FaMoneyBill,
  FaWeight,
  FaEye,
  FaShoppingBag,
  FaInfoCircle,
  FaExternalLinkAlt,
  FaPlug,
  FaWindowRestore,
  FaClock,
  FaTag,
} from "react-icons/fa";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  fetchLaptops,
  fetchTrendingLaptops,
  fetchNewLaunchLaptops,
} from "../../store/deviceSlice";
import useStoreLogos from "../../hooks/useStoreLogos";
import Spinner from "../ui/Spinner";
import useTitle from "../../hooks/useTitle";
import { toCanonicalPageUrl } from "../../utils/publicUrl";
import useDevice from "../../hooks/useDevice";
// BannerSlot disabled until completed.
import { generateSlug } from "../../utils/slugGenerator";
import normalizeProduct from "../../utils/normalizeProduct";
import useDeviceFieldProfiles from "../../hooks/useDeviceFieldProfiles";
import { resolveDeviceFieldProfile } from "../../utils/deviceFieldProfiles";
import {
  createCollectionSchema,
  createItemListSchema,
} from "../../utils/schemaGenerators";
import { buildListSeoKeywords } from "../../utils/seoKeywordBuilder";
import {
  computePopularLaptopFeatures,
  getLaptopFeatureSortValue,
  LAPTOP_FEATURE_CATALOG,
  matchesLaptopFeature,
} from "../../utils/laptopPopularFeatures";
import {
  buildLaptopListingPath,
  buildLaptopListingSeoMeta,
  normalizeLaptopBudget,
  normalizeLaptopListingSlug,
  parseLaptopListingPath,
  stripLaptopSeoQueryParams,
} from "../../utils/laptopListingRoutes";
import { isPublishedProduct } from "../../utils/publishedProducts";
import LatestNewsRouteSection from "../ui/LatestNewsRouteSection";
import ProductDiscoverySections from "../ui/ProductDiscoverySections";
import MobileListingControls, {
  MobileSortSheet,
} from "../ui/MobileListingControls";

const LAPTOP_MOBILE_SORT_OPTIONS = [
  {
    value: "featured",
    label: "Featured Laptops",
    description: "Recommended laptops first",
  },
  {
    value: "price-low",
    label: "Price: Low to High",
    description: "Budget-friendly laptops first",
  },
  {
    value: "price-high",
    label: "Price: High to Low",
    description: "Premium laptops first",
  },
  {
    value: "rating",
    label: "Highest Rating",
    description: "Top-rated laptops first",
  },
  {
    value: "newest",
    label: "Latest Entries",
    description: "Recently added laptops first",
  },
  {
    value: "weight",
    label: "Lightweight First",
    description: "Portable laptops first",
  },
  {
    value: "battery",
    label: "Battery Capacity",
    description: "Higher-capacity batteries first",
  },
];

// Enhanced Image Carousel - Reusable from smartphone
// Note: removed mock fallback — rely on `useDevice()` data from the store

// Image carousel used across device lists
const ImageCarousel = ({ images = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => setCurrentIndex(0), [images]);

  if (!images || images.length === 0) {
    return (
      <div className="relative flex h-[180px] w-[140px] items-center justify-center overflow-hidden rounded-[20px] border border-slate-100 bg-[#f4f5f8] shadow-[0_1px_2px_rgba(15,23,42,0.03)] sm:h-[210px] sm:w-[160px]">
        <div className="px-3 text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-gray-200">
            <FaLaptop className="text-gray-400 text-sm" />
          </div>
          <span className="text-xs text-gray-500">No image</span>
        </div>
      </div>
    );
  }

  if (images.length === 1) {
    return (
      <div className="relative flex h-[180px] w-[140px] items-center justify-center overflow-hidden rounded-[20px] border border-slate-100 bg-[#f4f5f8] shadow-[0_1px_2px_rgba(15,23,42,0.03)] sm:h-[210px] sm:w-[160px]">
        <img
          src={images[0]}
          alt="product"
          className="h-full w-full object-contain p-2.5 sm:p-3"
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div className="relative flex h-[180px] w-[140px] items-center justify-center overflow-hidden rounded-[20px] border border-slate-100 bg-[#f4f5f8] shadow-[0_1px_2px_rgba(15,23,42,0.03)] sm:h-[210px] sm:w-[160px]">
      <img
        src={images[currentIndex]}
        alt={`product-view-${currentIndex + 1}`}
        className="h-full w-full object-contain p-2.5 sm:p-3"
        loading="lazy"
      />
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
        <div className="flex items-center gap-1 rounded-full bg-white/85 px-2 py-1 shadow-[0_2px_8px_rgba(15,23,42,0.04)] ring-1 ring-slate-100">
          {images.map((_, index) => (
            <button
              key={`dot-${index}`}
              onClick={(e) => {
                e?.stopPropagation?.();
                setCurrentIndex(index);
              }}
              aria-label={`Go to image ${index + 1}`}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                currentIndex === index
                  ? "w-5 bg-violet-500"
                  : "w-1.5 bg-gray-300 hover:bg-gray-400"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const SITE_ORIGIN = "https://tryhook.shop";

const clampScore100 = (value) => {
  if (value === null || value === undefined || value === "") return null;
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

const Laptops = () => {
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

  const navigate = useNavigate();
  const location = useLocation();
  const { search } = location;
  const [params] = useSearchParams();
  const listingRouteMeta = useMemo(
    () => parseLaptopListingPath(location.pathname),
    [location.pathname],
  );
  const legacyFilter = params.get("filter");
  const legacyFeature = params.get("feature");
  const filter = listingRouteMeta?.latest ? "new" : legacyFilter;
  const normalizedFeatures = useMemo(() => {
    const values = listingRouteMeta?.featureSlugs?.length
      ? listingRouteMeta.featureSlugs
      : legacyFeature
        ? [legacyFeature]
        : [];
    return values.map(normalizeLaptopListingSlug).filter(Boolean);
  }, [legacyFeature, listingRouteMeta]);
  const normalizedFeature = normalizedFeatures[0] || null;
  const routeBrandSlug = listingRouteMeta?.brandSlug || "";
  const routeBudget = listingRouteMeta?.budget || null;
  const dispatch = useDispatch();
  const deviceFieldProfiles = useDeviceFieldProfiles();
  const [sortBy, setSortBy] = useState("featured");
  const [popularFeatureOrder, setPopularFeatureOrder] = useState([]);
  const [popularFeatureOrderLoaded, setPopularFeatureOrderLoaded] =
    useState(false);
  const [showHeroDescription, setShowHeroDescription] = useState(false);

  useEffect(() => {
    if (filter === "trending") dispatch(fetchTrendingLaptops());
    else if (filter === "new") dispatch(fetchNewLaunchLaptops());
    else dispatch(fetchLaptops());
  }, [filter, dispatch]);

  useEffect(() => {
    if (filter === "trending") {
      setSortBy("featured");
    }
  }, [filter]);

  useEffect(() => {
    let cancelled = false;
    const controller =
      typeof AbortController !== "undefined" ? new AbortController() : null;

    (async () => {
      const deviceTypeCandidates = ["laptop", "notebook"];
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
    const numeric = extractNumericPrice(price);
    if (numeric > 0) return `₹ ${numeric.toLocaleString("en-IN")}`;
    const text = String(price).trim();
    if (!text) return "Price not available";
    return text
      .replace(/^Rs\.?\s*/i, "₹ ")
      .replace(/^INR\s*/i, "₹ ")
      .replace(/^₹\s*/i, "₹ ");
  };

  // Helper to extract numeric weight
  const extractWeight = (weightStr) => {
    if (!weightStr) return 0;
    const match = weightStr.match(/(\d+(\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
  };

  // Helper to extract display size
  const extractDisplaySize = (sizeStr) => {
    if (!sizeStr) return 0;
    const match = sizeStr.match(/(\d+(\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
  };

  // Helper to extract battery capacity
  const extractBatteryCapacity = (batteryStr) => {
    if (!batteryStr) return 0;
    const text = String(batteryStr);

    // Prefer explicit Wh values (e.g. "59 Wh", "3-cell, 41 Wh Li-ion")
    const whMatches = [...text.matchAll(/(\d+(?:\.\d+)?)\s*wh\b/gi)]
      .map((m) => Number(m[1]))
      .filter((n) => Number.isFinite(n) && n > 0);
    if (whMatches.length) return Math.round(Math.max(...whMatches));

    // Fallback: use the largest number to avoid picking "3-cell" over "41"
    const nums = [...text.matchAll(/(\d+(?:\.\d+)?)/g)]
      .map((m) => Number(m[1]))
      .filter((n) => Number.isFinite(n) && n > 0);
    return nums.length ? Math.round(Math.max(...nums)) : 0;
  };

  const toObject = (value) =>
    value && typeof value === "object" && !Array.isArray(value) ? value : {};

  const toArray = (value) => (Array.isArray(value) ? value : []);

  const pickFirstObject = (...values) => {
    for (const value of values) {
      const obj = toObject(value);
      if (Object.keys(obj).length > 0) return obj;
    }
    return {};
  };

  const pickFirstArray = (...values) => {
    for (const value of values) {
      if (Array.isArray(value)) return value;
    }
    return [];
  };

  const pickFirstString = (...values) => {
    for (const value of values) {
      if (value === null || value === undefined) continue;
      const text = String(value).trim();
      if (text) return text;
    }
    return "";
  };

  const detectCpuBrand = (processorName = "") => {
    const normalized = String(processorName).toLowerCase();
    if (normalized.includes("intel")) return "Intel";
    if (normalized.includes("amd")) return "AMD";
    if (normalized.includes("apple")) return "Apple";
    if (normalized.includes("qualcomm")) return "Qualcomm";
    if (normalized.includes("mediatek")) return "MediaTek";
    return "";
  };

  // Map API response to device format
  const mapApiToDevice = (apiDevice, idx) => {
    const raw = toObject(apiDevice);
    const identity = normalizeProduct(raw, "laptop");
    const basicInfo = pickFirstObject(raw.basic_info, raw.basicInfo);
    const metadata = pickFirstObject(raw.metadata, raw.meta);
    const performance = pickFirstObject(raw.performance, raw.cpu);
    const display = pickFirstObject(raw.display);
    const memory = pickFirstObject(raw.memory);
    const storage = pickFirstObject(raw.storage);
    const battery = pickFirstObject(raw.battery);
    const camera = pickFirstObject(raw.camera);
    const ports = pickFirstObject(raw.ports);
    const physical = pickFirstObject(raw.physical);
    const software = pickFirstObject(raw.software);
    const multimedia = pickFirstObject(raw.multimedia);
    const connectivity = pickFirstObject(
      raw.connectivity,
      metadata.connectivity,
    );
    const warranty = pickFirstObject(raw.warranty, metadata.warranty);

    const imageCandidates = [
      ...pickFirstArray(raw.images, metadata.images),
      raw.image,
      raw.image_url,
    ].filter(Boolean);
    const images = Array.from(new Set(imageCandidates));

    const rawVariants = pickFirstArray(raw.variants, metadata.variants);
    const variants = rawVariants.map((variant) => {
      const v = toObject(variant);
      const storeRows = pickFirstArray(v.store_prices, v.stores);
      return {
        ...v,
        variant_id: v.variant_id || v.id || null,
        ram: v.ram || v.memory || "",
        storage: v.storage || v.storage_size || "",
        base_price: v.base_price ?? v.price ?? v.mrp ?? null,
        store_prices: storeRows.map((store) => {
          const sp = toObject(store);
          return {
            ...sp,
            id: sp.id || null,
            store_name: sp.store_name || sp.store || "",
            price: sp.price ?? sp.amount ?? null,
            url: sp.url || sp.link || "",
            offer_text: sp.offer_text || sp.offer || "",
            delivery_info: sp.delivery_info || sp.offers || "",
          };
        }),
      };
    });

    let storePrices = [];
    if (variants.length > 0) {
      storePrices = variants.flatMap((v) => {
        const variantBase = v.base_price || 0;
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
        if (prices.length === 0 && variantBase) {
          return [
            {
              id: `v-${v.variant_id || "unknown"}`,
              variant_id: v.variant_id,
              store: "Variant",
              price: variantBase,
            },
          ];
        }
        return prices;
      });
    }

    let numericPrice = 0;
    if (variants.length > 0) {
      const allPrices = variants
        .flatMap((v) => {
          const base = v.base_price || 0;
          const variantStorePrices = Array.isArray(v.store_prices)
            ? v.store_prices.map((sp) => sp.price).filter(Boolean)
            : [];
          return [base, ...variantStorePrices];
        })
        .map((p) => extractNumericPrice(p))
        .filter((p) => p > 0);

      numericPrice = allPrices.length > 0 ? Math.min(...allPrices) : 0;
    }

    if (numericPrice <= 0) {
      numericPrice = extractNumericPrice(
        raw.price || raw.starting_price || raw.base_price || raw.min_price,
      );
    }

    const displaySize = extractDisplaySize(
      display.display_size || display.size || "",
    );
    const weight = extractWeight(physical.weight || "");
    const batteryCapacity = extractBatteryCapacity(
      pickFirstString(
        battery.capacity,
        battery.battery_capacity,
        battery.capacity_wh,
        battery.wh,
        battery.battery_type,
      ),
    );

    const ramOptions = [...new Set(variants.map((v) => v.ram).filter(Boolean))];
    const storageOptions = [
      ...new Set(variants.map((v) => v.storage).filter(Boolean)),
    ];
    const colorOptionsRaw = [
      ...variants.map((v) => v.color).filter(Boolean),
      ...toArray(basicInfo.colors).map((color) =>
        typeof color === "object"
          ? color.name || color.label || color.value
          : color,
      ),
    ];
    const colorOptions = [
      ...new Set(colorOptionsRaw.filter(Boolean).map((value) => String(value))),
    ];
    const profileResult = resolveDeviceFieldProfile(
      "laptop",
      raw,
      deviceFieldProfiles,
    );
    const profileDisplay = profileResult.display_display || {};

    const processorName = pickFirstString(
      performance.processor_name,
      performance.processor,
      `${performance.brand || ""} ${performance.model || ""}`.trim(),
      raw.processor,
      profileDisplay.processor,
    );

    const cpuBrand = pickFirstString(
      performance.brand,
      performance.cpu_brand,
      detectCpuBrand(processorName),
    );

    const cpuModel = pickFirstString(
      performance.model,
      performance.processor_model,
      processorName.replace(cpuBrand, "").trim(),
    );

    const displayType = pickFirstString(
      display.panel_type,
      display.type,
      display.panel,
      profileDisplay.panel_type,
    );
    const resolution = pickFirstString(
      display.resolution,
      profileDisplay.resolution,
    );
    const refreshRate = pickFirstString(
      display.refresh_rate,
      profileDisplay.refresh_rate,
    );
    const displayLabel = pickFirstString(
      display.display_size,
      display.size,
      display.size_cm,
      profileDisplay.display_size,
    );
    const displaySummary = [
      displayLabel,
      displayType,
      resolution,
      refreshRate ? `(${refreshRate})` : "",
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    const ramText =
      ramOptions.join(" / ") ||
      pickFirstString(
        memory.ram,
        memory.capacity,
        memory.size,
        memory.ram_type,
        memory.type,
        profileDisplay.ram,
      );

    const storageText =
      storageOptions.join(" / ") ||
      pickFirstString(
        storage.capacity,
        storage.storage,
        storage.size,
        storage.storage_type,
        storage.type,
        profileDisplay.storage,
      );

    const gpuLabel = pickFirstString(
      performance.gpu,
      raw.graphics?.model,
      raw.gpu,
      profileDisplay.graphics,
    );

    const graphics =
      gpuLabel && performance.gpu_type
        ? `${gpuLabel} (${performance.gpu_type})`
        : gpuLabel || "Integrated Graphics";

    const featureList = pickFirstArray(raw.features, multimedia.features)
      .filter(Boolean)
      .map((item) => String(item))
      .slice(0, 5);

    const ratingNumber =
      typeof raw.rating === "number"
        ? raw.rating
        : raw.rating && typeof raw.rating === "object"
          ? Number(
              raw.rating.averageRating || raw.rating.avg || raw.rating.rating,
            ) || 0
          : Number(raw.rating) || 0;

    const toFiniteNumber = (value) => {
      if (value === null || value === undefined || value === "") return null;
      const n = Number(value);
      return Number.isFinite(n) ? n : null;
    };
    const overallScoreRaw = toFiniteNumber(
      raw.spec_score_v2 ?? raw.specScoreV2,
    );
    const trendScore = toFiniteNumber(
      raw.trend_score ?? raw.trending_score ?? raw.trendScore,
    );
    const trendViews7d =
      toFiniteNumber(raw.trend_views_7d ?? raw.views_7d ?? raw.trendViews7d) ??
      0;
    const trendViewsPrev7d =
      toFiniteNumber(
        raw.trend_views_prev_7d ?? raw.views_prev_7d ?? raw.trendViewsPrev7d,
      ) ?? 0;
    const trendDelta =
      toFiniteNumber(raw.trend_delta ?? raw.trendDelta) ??
      trendViews7d - trendViewsPrev7d;
    const trendVelocity = toFiniteNumber(
      raw.trend_velocity ?? raw.velocity ?? raw.trendVelocity,
    );
    const trendBadge = pickFirstString(
      raw.trend_badge,
      raw.badge,
      raw.trend_label,
      raw.trendLabel,
    );
    const trendCalculatedAt = pickFirstString(
      raw.trend_calculated_at,
      raw.trending_calculated_at,
      raw.calculated_at,
    );
    const trendManualBoost = Boolean(
      raw.trend_manual_boost ?? raw.manual_boost ?? false,
    );

    return {
      id: raw.product_id || raw.id || identity.productId || idx + 1,
      product_id: raw.product_id || raw.id || identity.productId || idx + 1,
      productId: raw.product_id || raw.id || identity.productId || idx + 1,
      productType:
        (raw.product_type || basicInfo.product_type || "laptop")
          .toString()
          .toLowerCase() || "laptop",
      name:
        raw.name ||
        raw.product_name ||
        basicInfo.product_name ||
        basicInfo.title ||
        identity.name ||
        "",
      brand:
        raw.brand_name ||
        raw.brand ||
        basicInfo.brand_name ||
        basicInfo.brand ||
        identity.brand ||
        "",
      model: raw.model || basicInfo.model || "",
      price:
        numericPrice > 0
          ? `₹ ${numericPrice.toLocaleString("en-IN")}`
          : "Price not available",
      numericPrice,
      rating: ratingNumber,
      reviews: raw.reviews_count
        ? `${raw.reviews_count} reviews`
        : ratingNumber > 0
          ? "No reviews yet"
          : "",
      image: images[0] || "",
      images,
      spec_score_v2: overallScoreRaw,
      spec_score: overallScoreRaw,
      specs: {
        cpu: processorName || `${cpuBrand} ${cpuModel}`.trim(),
        cpuBrand,
        cpuModel,
        cpuGeneration: pickFirstString(
          performance.processor_generation,
          performance.generation,
        ),
        display: displaySummary,
        displaySize,
        displayType,
        resolution,
        refreshRate,
        ram: ramText,
        storage: storageText,
        graphics,
        battery: pickFirstString(
          battery.capacity,
          battery.battery_capacity,
          battery.capacity_wh,
          battery.wh,
          battery.battery_type,
          profileDisplay.battery,
        ),
        batteryLife: pickFirstString(
          battery.battery_life,
          battery.life,
          battery.backup_time,
        ),
        touchscreen:
          display.touchscreen ?? display.touch_support ?? display.touch ?? "",
        os: pickFirstString(
          software.operating_system,
          software.os,
          profileDisplay.os,
        ),
        weight: physical.weight || "",
        color: colorOptions.join(" / ") || pickFirstString(physical.color),
        ports: pickFirstString(
          ports.ports_description,
          Array.isArray(connectivity.ports)
            ? connectivity.ports.join(", ")
            : "",
        ),
        wifi: pickFirstString(connectivity.wifi, connectivity.wireless),
        warranty: pickFirstString(
          warranty.warranty,
          warranty.service,
          warranty.years ? `${warranty.years} years` : "",
        ),
        webcam: pickFirstString(camera.webcam),
        features: featureList.join(", "),
      },
      numericWeight: weight,
      numericDisplaySize: displaySize,
      numericBattery: batteryCapacity,
      entryDate:
        raw.created_at ||
        metadata.created_at ||
        "",
      overall_score: overallScoreRaw,
      overall_score_display: overallScoreRaw,
      trendBadge:
        trendBadge ||
        (trendScore != null
          ? trendScore >= 80
            ? "Trending Now"
            : trendScore >= 60
              ? "Popular This Week"
              : "Gaining Attention"
          : ""),
      trendScore,
      trendViews7d,
      trendViewsPrev7d,
      trendDelta,
      trendVelocity,
      trendCalculatedAt,
      trendManualBoost,
      battery,
      display,
      performance,
      camera,
      storePrices,
      variants,
      ramOptions,
      storageOptions,
      colorOptions,
      features: featureList,
      field_profile: profileResult,
    };
  };

  // Transform API/store data to devices array
  const { laptops } = useDevice();

  const sourceDevices = Array.isArray(laptops) ? laptops : [];

  const devices = sourceDevices.map((device, i) => mapApiToDevice(device, i));

  // Build variant-level cards
  const variantCards = devices.flatMap((device) => {
    const vars =
      Array.isArray(device.variants) && device.variants.length
        ? device.variants
        : [];

    if (vars.length === 0) {
      return [{ ...device, id: `${device.id}-default` }];
    }

    return vars.map((v) => {
      const rawVariantStorePrices = Array.isArray(v.store_prices)
        ? v.store_prices
        : [];

      const mappedVariantStores = rawVariantStorePrices.map((sp) => ({
        id: sp.id,
        store: sp.store_name || sp.store || "Store",
        price: sp.price,
        url: sp.url,
        offer_text: sp.offer_text,
        delivery_info: sp.delivery_info,
      }));

      const base = v.base_price || 0;

      const storePrices =
        mappedVariantStores.length > 0
          ? mappedVariantStores
          : base > 0
            ? [
                {
                  id: `variant-base-${
                    v.variant_id || Math.random().toString(36).slice(2, 8)
                  }`,
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
        id: `${device.id}-${
          v.variant_id || Math.random().toString(36).slice(2, 8)
        }`,
        variant: v,
        specs: {
          ...device.specs,
          ram: v.ram || device.specs.ram,
          storage: v.storage || device.specs.storage,
          color: v.color || device.specs.color,
        },
        storePrices,
        price,
        numericPrice,
      };
    });
  });

  const popularFeatures = useMemo(() => {
    let base = computePopularLaptopFeatures(devices, { limit: 0 });

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
      const def = LAPTOP_FEATURE_CATALOG.find(
        (f) => f.id === normalizedFeature,
      );
      if (def) base = [{ ...def, count: 0 }, ...base];
    }

    return base.slice(0, 16);
  }, [devices, normalizedFeature, popularFeatureOrder]);

  // Extract filter options dynamically from all devices
  const brands = [...new Set(devices.map((d) => d.brand).filter(Boolean))];
  const brandsKey = brands
    .map((brand) => normalizeLaptopListingSlug(brand))
    .join("|");

  // Extract all unique RAM values from variants
  const allRams = [
    ...new Set(
      devices.flatMap(
        (d) => d.variants?.map((v) => v.ram).filter(Boolean) || [],
      ),
    ),
  ].sort((a, b) => {
    const numA = parseInt(a.replace(/[^0-9]/g, "")) || 0;
    const numB = parseInt(b.replace(/[^0-9]/g, "")) || 0;
    return numA - numB;
  });

  // Extract all unique storage values
  const allStorages = [
    ...new Set(
      devices.flatMap(
        (d) => d.variants?.map((v) => v.storage).filter(Boolean) || [],
      ),
    ),
  ].sort((a, b) => {
    const parseStorage = (s) => {
      if (!s) return 0;
      const str = s.toUpperCase();
      if (str.includes("TB")) return parseFloat(str) * 1024;
      return parseInt(str.replace(/[^0-9]/g, "")) || 0;
    };
    return parseStorage(a) - parseStorage(b);
  });

  // Extract CPU brands
  const cpuBrands = [
    ...new Set(devices.map((d) => d.specs.cpuBrand).filter(Boolean)),
  ];

  // Extract OS options
  const osOptions = [
    ...new Set(devices.map((d) => d.specs.os).filter(Boolean)),
  ].map((os) => os.split(" ")[0]); // Get base OS name

  // Extract display size ranges
  const getDisplaySizeRanges = () => {
    const sizes = devices
      .map((d) => d.numericDisplaySize)
      .filter((size) => size > 0);
    if (sizes.length === 0) return [];

    const min = Math.floor(Math.min(...sizes));
    const max = Math.ceil(Math.max(...sizes));

    const ranges = [];
    for (let i = min; i <= max; i += 2) {
      if (i + 2 <= max) {
        ranges.push({
          id: `${i}-${i + 2}`,
          label: `${i}" - ${i + 2}"`,
          min: i,
          max: i + 2,
        });
      } else {
        ranges.push({
          id: `${i}+`,
          label: `${i}"+`,
          min: i,
          max: Infinity,
        });
      }
    }
    return ranges.slice(0, 4); // Limit to 4 ranges
  };

  const displaySizeRanges = getDisplaySizeRanges();

  // Weight ranges
  const WEIGHT_RANGES = [
    { id: "ultra-light", label: "Ultra Light (<1.2kg)", min: 0, max: 1.2 },
    { id: "light", label: "Light (1.2-1.5kg)", min: 1.2, max: 1.5 },
    { id: "standard", label: "Standard (1.5-2kg)", min: 1.5, max: 2 },
    { id: "heavy", label: "Heavy (>2kg)", min: 2, max: Infinity },
  ];

  // Battery capacity ranges
  const BATTERY_RANGES = [
    { id: "small", label: "Small (<40Wh)", min: 0, max: 40 },
    { id: "medium", label: "Medium (40-60Wh)", min: 40, max: 60 },
    { id: "large", label: "Large (60-80Wh)", min: 60, max: 80 },
    { id: "extra-large", label: "Extra Large (>80Wh)", min: 80, max: Infinity },
  ];

  // Rating ranges
  const RATING_RANGES = [
    { id: "4.5+", label: "4.5+ Stars", min: 4.5, max: 5 },
    { id: "4.0+", label: "4.0+ Stars", min: 4.0, max: 5 },
    { id: "3.5+", label: "3.5+ Stars", min: 3.5, max: 5 },
    { id: "any", label: "Any Rating", min: 0, max: 5 },
  ];

  // Price range
  const MIN_PRICE = 0;
  const MAX_PRICE = 300000;

  const [filters, setFilters] = useState({
    brand: [],
    priceRange: { min: MIN_PRICE, max: MAX_PRICE },
    ram: [],
    storage: [],
    cpuBrand: [],
    os: [],
    displaySize: [],
    weight: [],
    battery: [],
    graphics: [],
    rating: [],
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [brandFilterQuery, setBrandFilterQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);

  // Set page title
  useTitle({
    page: "laptops",
  });

  const deviceContext = useDevice();
  const filterBrand =
    routeBrandSlug ||
    (Array.isArray(filters?.brand) && filters.brand[0] ? filters.brand[0] : null);
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
    if (!q) return brands;
    return brands.filter((brand) =>
      String(brand || "")
        .toLowerCase()
        .includes(q),
    );
  }, [brands, brandFilterQuery]);

  useEffect(() => {
    const searchParams = new URLSearchParams(search || "");
    const legacyBrand = searchParams.get("brand") || "";
    const legacySeoFeature = searchParams.get("feature") || "";
    const legacyBudget = normalizeLaptopBudget(
      searchParams.get("maxPrice") ||
        searchParams.get("priceMax") ||
        searchParams.get("max_price") ||
        searchParams.get("budget"),
    );
    const hasPathSeoIntent = Boolean(
      listingRouteMeta?.latest ||
        listingRouteMeta?.brandSlug ||
        listingRouteMeta?.featureSlugs?.length ||
        listingRouteMeta?.budget,
    );
    const hasLegacySeoIntent = Boolean(
      legacyBrand ||
        legacySeoFeature ||
        legacyBudget ||
        searchParams.get("filter") === "new",
    );
    if (!hasPathSeoIntent && !hasLegacySeoIntent) return;

    const nextParams = stripLaptopSeoQueryParams(search);
    const desiredUrl = buildLaptopListingPath({
      brand: listingRouteMeta?.brandSlug || legacyBrand,
      features: listingRouteMeta?.featureSlugs?.length
        ? listingRouteMeta.featureSlugs
        : legacySeoFeature
          ? [legacySeoFeature]
          : [],
      budget: listingRouteMeta?.budget || legacyBudget,
      latest: listingRouteMeta?.latest || searchParams.get("filter") === "new",
      query: nextParams,
    });
    const currentUrl = `${location.pathname}${search || ""}`;
    if (desiredUrl !== currentUrl) {
      navigate(desiredUrl, { replace: true });
    }
  }, [listingRouteMeta, location.pathname, navigate, search]);

  // Apply query param filters
  useEffect(() => {
    const params = new URLSearchParams(search);
    const brandParam = routeBrandSlug || params.get("brand");
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

    const ramArr = toArray(params.get("ram"));
    const storageArr = toArray(params.get("storage"));
    const cpuArr = toArray(params.get("cpu"));
    const osArr = toArray(params.get("os"));

    // Parse price range
    const rawMin = params.get("priceMin") || params.get("minPrice");
    const rawMax =
      routeBudget || params.get("priceMax") || params.get("maxPrice");
    const priceMin = rawMin ? Number(rawMin) : MIN_PRICE;
    const priceMax = rawMax ? Number(rawMax) : MAX_PRICE;

    setFilters((prev) => {
      const nextBrand = brandParam
        ? [
            brands.find(
              (brand) =>
                normalizeLaptopListingSlug(brand) ===
                normalizeLaptopListingSlug(brandParam),
            ) || brandParam,
          ]
        : [];
      const nextPriceRange = {
        min: !isNaN(priceMin) ? priceMin : prev.priceRange.min,
        max: !isNaN(priceMax) ? priceMax : prev.priceRange.max,
      };
      const matchesArray = (left = [], right = []) =>
        left.length === right.length &&
        left.every((value, index) => value === right[index]);
      const unchanged =
        matchesArray(prev.brand, nextBrand) &&
        prev.priceRange.min === nextPriceRange.min &&
        prev.priceRange.max === nextPriceRange.max &&
        matchesArray(prev.ram, ramArr) &&
        matchesArray(prev.storage, storageArr) &&
        matchesArray(prev.cpuBrand, cpuArr) &&
        matchesArray(prev.os, osArr);

      if (unchanged) return prev;
      return {
        ...prev,
        brand: nextBrand,
        priceRange: nextPriceRange,
        ram: ramArr,
        storage: storageArr,
        cpuBrand: cpuArr,
        os: osArr,
      };
    });

    if (brandParam && !sortParam) {
      setSortBy("newest");
    } else if (sortParam) {
      setSortBy(sortParam);
    }

    if (qParam !== null) {
      setSearchQuery(qParam);
    }
  }, [brandsKey, routeBrandSlug, routeBudget, search]);

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

  // Filter logic
  const filteredVariants = variantCards.filter((device) => {
    // Search filter
    if (searchQuery) {
      if (!isPublishedProduct(device)) return false;
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        device.name.toLowerCase().includes(query) ||
        device.brand.toLowerCase().includes(query) ||
        device.specs.cpu.toLowerCase().includes(query) ||
        device.specs.features.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    if (
      normalizedFeatures.some(
        (featureId) => !matchesLaptopFeature(device, featureId),
      )
    ) {
      return false;
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

    // RAM filter
    if (filters.ram.length > 0) {
      const deviceRams = device.specs.ram
        ? device.specs.ram.split("/").map((r) => r.trim())
        : [device.specs.ram];
      const hasMatchingRam = filters.ram.some((selectedRam) =>
        deviceRams.includes(selectedRam),
      );
      if (!hasMatchingRam) return false;
    }

    // Storage filter
    if (filters.storage.length > 0) {
      const deviceStorages = device.specs.storage
        ? device.specs.storage.split("/").map((s) => s.trim())
        : [device.specs.storage];
      const hasMatchingStorage = filters.storage.some((selectedStorage) =>
        deviceStorages.includes(selectedStorage),
      );
      if (!hasMatchingStorage) return false;
    }

    // CPU Brand filter
    if (filters.cpuBrand.length > 0) {
      const cpuBrand = device.specs.cpuBrand || "";
      if (!filters.cpuBrand.includes(cpuBrand)) return false;
    }

    // OS filter
    if (filters.os.length > 0) {
      const os = device.specs.os || "";
      const hasMatchingOS = filters.os.some((selectedOS) =>
        os.toLowerCase().includes(selectedOS.toLowerCase()),
      );
      if (!hasMatchingOS) return false;
    }

    // Display size filter
    if (filters.displaySize.length > 0) {
      const size = device.numericDisplaySize || 0;
      const matchesSize = filters.displaySize.some((rangeId) => {
        const range = displaySizeRanges.find((r) => r.id === rangeId);
        if (!range) return false;
        return size >= range.min && size <= range.max;
      });
      if (!matchesSize) return false;
    }

    // Weight filter
    if (filters.weight.length > 0) {
      const weight = device.numericWeight || 0;
      const matchesWeight = filters.weight.some((rangeId) => {
        const range = WEIGHT_RANGES.find((r) => r.id === rangeId);
        if (!range) return false;
        return weight >= range.min && weight <= range.max;
      });
      if (!matchesWeight) return false;
    }

    // Battery filter
    if (filters.battery.length > 0) {
      const battery = device.numericBattery || 0;
      const matchesBattery = filters.battery.some((rangeId) => {
        const range = BATTERY_RANGES.find((r) => r.id === rangeId);
        if (!range) return false;
        return battery >= range.min && battery <= range.max;
      });
      if (!matchesBattery) return false;
    }

    // Graphics filter
    if (filters.graphics.length > 0) {
      const graphics = device.specs.graphics || "";
      const isDedicated =
        graphics.toLowerCase().includes("rtx") ||
        graphics.toLowerCase().includes("gtx") ||
        (graphics.toLowerCase().includes("radeon") &&
          !graphics.toLowerCase().includes("integrated"));

      const graphicsType = isDedicated ? "Dedicated" : "Integrated";
      if (!filters.graphics.includes(graphicsType)) return false;
    }

    // Rating filter
    if (filters.rating.length > 0) {
      const rating = device.rating || 0;
      const matchesRating = filters.rating.some((rangeId) => {
        const range = RATING_RANGES.find((r) => r.id === rangeId);
        if (!range) return false;
        return rating >= range.min && rating <= range.max;
      });
      if (!matchesRating) return false;
    }

    return true;
  });

  const sortedVariants = [...filteredVariants].sort((a, b) => {
    if (sortBy === "featured" && normalizedFeature) {
      const av = getLaptopFeatureSortValue(a, normalizedFeature);
      const bv = getLaptopFeatureSortValue(b, normalizedFeature);
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
      case "rating":
        return b.rating - a.rating;
      case "newest":
        return new Date(b.entryDate) - new Date(a.entryDate);
      case "weight":
        return a.numericWeight - b.numericWeight;
      case "battery":
        return b.numericBattery - a.numericBattery;
      default:
        return 0;
    }
  });

  const clearFilters = () => {
    setFilters({
      brand: [],
      priceRange: { min: MIN_PRICE, max: MAX_PRICE },
      ram: [],
      storage: [],
      cpuBrand: [],
      os: [],
      displaySize: [],
      weight: [],
      battery: [],
      graphics: [],
      rating: [],
    });
    setSearchQuery("");
    setBrandFilterQuery("");
    try {
      const params = stripLaptopSeoQueryParams(search);
      params.delete("brand");
      params.delete("q");
      params.delete("ram");
      params.delete("storage");
      params.delete("cpu");
      params.delete("os");
      if (sortBy && sortBy !== "featured") {
        params.set("sort", sortBy);
      } else {
        params.delete("sort");
      }
      const qs = params.toString();
      const path = `/laptops${qs ? `?${qs}` : ""}`;
      navigate(path, { replace: true });
    } catch {
      return;
    }
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.brand && filters.brand.length) count += filters.brand.length;
    if (filters.ram && filters.ram.length) count += filters.ram.length;
    if (filters.storage && filters.storage.length)
      count += filters.storage.length;
    if (filters.cpuBrand && filters.cpuBrand.length)
      count += filters.cpuBrand.length;
    if (filters.os && filters.os.length) count += filters.os.length;
    if (filters.displaySize && filters.displaySize.length)
      count += filters.displaySize.length;
    if (filters.weight && filters.weight.length) count += filters.weight.length;
    if (filters.battery && filters.battery.length)
      count += filters.battery.length;
    if (filters.graphics && filters.graphics.length)
      count += filters.graphics.length;
    if (filters.rating && filters.rating.length) count += filters.rating.length;
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
        device_type: "laptop",
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
          device_type: "laptop",
          feature_id: featureId,
        }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      // ignore
    }
  };

  const setFeatureParam = (featureId) => {
    const sp = stripLaptopSeoQueryParams(search || "");
    if (featureId) trackFeatureClick(featureId);
    navigate(
      buildLaptopListingPath({
        brand: routeBrandSlug,
        feature: featureId || "",
        budget: routeBudget,
        query: sp,
      }),
    );
  };

  const handleView = (device, e, store) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const slug = generateSlug(
      device.name ||
        device.model ||
        device.brand ||
        String(device.product_id ?? device.productId ?? device.id ?? ""),
    );
    if (!slug) return;

    navigate(`/laptops/${slug}`);

    // record a product view (best-effort) for trending stats
    try {
      const rawPid = device.product_id ?? device.productId ?? device.id;
      const pid = Number(rawPid);
      if (Number.isInteger(pid) && pid > 0) {
        fetch(`https://api.apisphere.in/api/public/product/${pid}/view`, {
          method: "POST",
        }).catch(() => {});
      }
    } catch {}
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
  const sanitizeDescription = (desc = "") => {
    const text = String(desc || "")
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim();
    return text.length > 180 ? `${text.slice(0, 177)}...` : text;
  };

  const seoLandingMeta = buildLaptopListingSeoMeta(listingRouteMeta || {}, {
    brandName: currentBrandObj?.name || "",
    monthYear: currentMonthYear,
    fullDate: currentFullDate,
  });
  const hasSpecificSeoLanding = Boolean(
    listingRouteMeta?.latest ||
      listingRouteMeta?.brandSlug ||
      listingRouteMeta?.featureSlugs?.length ||
      listingRouteMeta?.budget,
  );
  const headerLabel =
    filter === "trending" ? "TRENDING NOW" : seoLandingMeta.eyebrow;
  const isLongHeroDescriptionPath =
    !currentBrandObj && !hasSpecificSeoLanding;

  const heroTitleText =
    filter === "trending" ? "Trending Laptops" : seoLandingMeta.heading;

  const heroSubtitleText =
    filter === "trending"
      ? "Browse the laptops buyers are watching most and quickly spot the models that are getting attention right now. This page brings together updated prices, processor details, RAM, storage, battery life, display quality, and laptop variants in one place so you can compare the practical details that matter without opening multiple store pages. Whether you are looking for a thin-and-light everyday machine, a gaming-ready notebook, a creator-focused device, or a budget-friendly student laptop, the trending collection helps you narrow the field with confidence. Use the filters and product cards to sort by brand, price, memory, storage, and feature, then open the listings that look the most promising."
      : filter === "new"
        ? "Browse the latest laptops added to Hooks and keep up with fresh entries as they arrive. This page brings together updated pricing, processor details, RAM, storage, battery information, display sizes, and variant options so you can track what is new in one place. If you are planning an upgrade or checking how recently added models stack up, the latest collection makes it easy to review the important details without jumping between many product pages. Use the filters and product cards to sort by brand, price, processor, and feature, then open the laptops that are most worth watching."
        : hasSpecificSeoLanding
          ? seoLandingMeta.description
          : "Browse laptops in India across brands, price ranges, processor families, memory options, display sizes, and battery capacities so you can quickly find a device that matches your work, study, or gaming needs. This page brings updated prices, key specifications, ratings, and model variants together in one place, making it easier to review performance, portability, battery life, storage, and value without switching between multiple store pages. Whether you are looking for a budget laptop, a gaming machine, a creator notebook, or a reliable everyday system, the collection helps you scan what is new, what is popular, and what is worth shortlisting. Use the filters, search, and product cards to narrow results by brand, price, or feature, then open the laptops that stand out most.";
  useEffect(() => {
    if (isLongHeroDescriptionPath) {
      setShowHeroDescription(false);
    }
  }, [isLongHeroDescriptionPath, filter]);

  const seoTitle = seoLandingMeta.title;
  const seoDescription = sanitizeDescription(seoLandingMeta.description);
  const seoKeywords = useMemo(
    () =>
      buildListSeoKeywords({
        devices: sortedVariants,
        category: "laptops",
        currentYear,
        baseTerms: ["laptops", "laptop price in india", "compare laptop specs"],
        contextTerms: [
          filter === "new" ? "recently added laptops" : "",
          currentBrandObj?.name ? `${currentBrandObj.name} laptops` : "",
          routeBudget ? `laptops under ${routeBudget}` : "",
          ...normalizedFeatures.map((item) => `${item} laptops`),
        ],
      }),
    [
      currentYear,
      filter,
      currentBrandObj,
      normalizedFeatures,
      routeBudget,
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

  const listCanonicalPath =
    listingRouteMeta?.canonicalPath || "/laptops";
  const listSchemaUrl = toCanonicalPageUrl(listCanonicalPath, SITE_ORIGIN);
  const listRobots = search
    ? "noindex, follow, max-image-preview:large"
    : "index, follow, max-image-preview:large";

  const listSchemaItems = useMemo(() => {
    const items = sortedVariants.slice(0, 20).map((device) => {
      const name = String(
        device?.name || device?.model || device?.title || "",
      ).trim();
      if (!name) return null;
      const slug = generateSlug(
        device?.name || device?.model || device?.brand || device?.id,
      );
      const imageRaw = Array.isArray(device?.images)
        ? device.images.find(Boolean)
        : device?.image;
      return {
        name,
        url: toCanonicalPageUrl(`/laptops/${slug}`, SITE_ORIGIN),
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

  return (
    <div
      className="min-h-screen bg-[#eef2ff] text-slate-900"
      data-page-label={headerLabel}
    >
      <style>{animationStyles}</style>
      <Helmet prioritizeSeoTags>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <meta name="keywords" content={seoKeywords} />
        <meta name="robots" content={listRobots} />

        {/* Canonical URL - CRITICAL for SEO per route */}
        <link rel="canonical" href={listSchemaUrl} />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:url" content={listSchemaUrl} />
        {listOgImage ? (
          <meta
            key="laptops-og-image"
            property="og:image"
            content={listOgImage}
          />
        ) : null}

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDescription} />
        {listOgImage ? (
          <meta
            key="laptops-twitter-image"
            name="twitter:image"
            content={listOgImage}
          />
        ) : null}

        {listSchemaJson && (
          <script type="application/ld+json">{listSchemaJson}</script>
        )}
      </Helmet>
      {/* Main Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-0 pb-8 sm:pb-12 md:pb-16 lg:pb-20">
        <div className="relative">
          <section className="relative left-1/2 isolate w-screen -translate-x-1/2 overflow-hidden px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
            <div className="relative mx-auto max-w-7xl">
              <div
                className={
                  isLongHeroDescriptionPath ? "max-w-6xl" : "max-w-4xl"
                }
              >
                <h1 className="text-[11px] font-bold uppercase tracking-[0.32em] text-purple-600 sm:text-xs">
                  {heroTitleText}
                </h1>

                <h4
                  className={`mt-3 ${
                    isLongHeroDescriptionPath ? "max-w-6xl" : "max-w-3xl"
                  } text-sm leading-7 text-slate-600 sm:text-base sm:leading-8`}
                  style={
                    isLongHeroDescriptionPath && !showHeroDescription
                      ? {
                          display: "-webkit-box",
                          WebkitBoxOrient: "vertical",
                          WebkitLineClamp: 3,
                          overflow: "hidden",
                        }
                      : undefined
                  }
                >
                  {heroSubtitleText}
                </h4>

                {isLongHeroDescriptionPath ? (
                  <button
                    type="button"
                    onClick={() => setShowHeroDescription((prev) => !prev)}
                    className="mt-2.5 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 transition-colors duration-200 hover:text-blue-900"
                    aria-expanded={showHeroDescription}
                  >
                    {showHeroDescription ? "Show less" : "Read more"}
                  </button>
                ) : null}

              </div>
            </div>
          </section>

          <div className="mt-4">
            <div className="overflow-hidden pt-0 pb-2 sm:pb-3">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FaFilter className="text-blue-500" />
                  <h3 className="text-sm sm:text-base font-semibold text-slate-900">
                    Popular Features
                  </h3>
                </div>
                {normalizedFeature && (
                  <button
                    onClick={() => setFeatureParam(null)}
                    className="text-xs sm:text-sm text-blue-600 hover:text-blue-500 font-semibold"
                  >
                    Clear
                  </button>
                )}
              </div>
              {popularFeatureOrderLoaded && (
                <p className="text-xs text-slate-500 mb-3">
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
                      <span
                        className={isActive ? "text-white" : "text-blue-500"}
                      >
                        {Icon ? <Icon className="text-base" /> : null}
                      </span>
                      <span>{pf.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <MobileListingControls
              activeFilterCount={getActiveFiltersCount()}
              onOpenFilters={() => setShowFilters(true)}
              onOpenSort={() => setShowSort(true)}
            />

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
                  <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4">
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
          </div>

          <div className="flex flex-col gap-4 lg:flex-row md:gap-6">
            {/* Desktop Filter Sidebar */}
            <div className="hidden lg:block lg:w-72 flex-shrink-0 ">
              <div className="sticky top-6 rounded-2xl border border-white p-5 shadow-[0_2px_4px_rgba(0,0,0,0.1)] lg:p-6">
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
                      <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-bold text-blue-600">
                        {getActiveFiltersCount()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Refine further or clear to see all laptops
                    </p>
                  </div>
                )}

                <div className="flex flex-col">
                {/* Price Range Filter */}
                <div className="order-2 mb-8">
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
                      ₹{filters.priceRange.min?.toLocaleString()}
                    </span>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-[#f8fbff] p-4">
                    <div className="mb-4 flex justify-between text-sm font-medium text-slate-900">
                      <div className="text-center">
                        <div className="text-xs text-slate-500">Minimum</div>
                        <div className="font-bold">
                          ₹{filters.priceRange.min?.toLocaleString()}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-slate-500">Maximum</div>
                        <div className="font-bold">
                          ₹{filters.priceRange.max?.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* Dual Range Slider */}
                    <div className="relative mb-8">
                      <div className="absolute top-1/2 h-2 w-full -translate-y-1/2 rounded-full bg-slate-200"></div>
                      <div
                        className="absolute h-2 rounded-full top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-blue-400 to-sky-400"
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

                    <div className="mb-3 flex items-center justify-between text-xs">
                      <span className="text-slate-500">
                        ₹{MIN_PRICE.toLocaleString()}
                      </span>
                      <span className="text-slate-500">
                        ₹{MAX_PRICE.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Brand Filter */}
                <div className="order-1 mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
                      Brands
                    </h4>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-gray-500">
                      {filters.brand.length} selected
                    </span>
                  </div>
                  <div className="relative mb-4">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                    <input
                      type="text"
                      value={brandFilterQuery}
                      onChange={(e) => setBrandFilterQuery(e.target.value)}
                      placeholder="Search brand..."
                      className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-3 text-sm text-slate-900  transition-all placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  <div className="no-scrollbar space-y-2 max-h-60 overflow-y-auto pr-2">
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
                    {allRams.map((ram) => (
                      <label
                        key={ram}
                        className={`flex items-center justify-center gap-2 cursor-pointer px-3 py-2.5 rounded-xl transition-all duration-200 font-medium ${
                          filters.ram.includes(ram)
                            ? "bg-gradient-to-b from-blue-600 via-blue-500 to-blue-600 text-white shadow-lg"
                            : "bg-gray-50 border border-gray-200 text-gray-700 hover:border-gray-300 hover:shadow-sm"
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
                    {allStorages.map((storage) => (
                      <label
                        key={storage}
                        className={`flex items-center justify-center gap-2 cursor-pointer px-3 py-2.5 rounded-xl transition-all duration-200 font-medium ${
                          filters.storage.includes(storage)
                            ? "bg-gradient-to-b from-blue-600 via-blue-500 to-blue-600 text-white shadow-lg"
                            : "bg-gray-50 border border-gray-200 text-gray-700 hover:border-gray-300 hover:shadow-sm"
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

                {/* CPU Brand Filter */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-base font-bold text-slate-900">
                        Processor Brand
                      </h4>
                      <p className="mt-1 text-xs text-slate-500">
                        Select CPU manufacturer
                      </p>
                    </div>
                    <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-bold text-blue-600">
                      {filters.cpuBrand.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {cpuBrands.map((brand) => (
                      <label
                        key={brand}
                        className={`flex items-center justify-center gap-2 cursor-pointer px-3 py-2.5 rounded-xl transition-all duration-200 font-medium ${
                          filters.cpuBrand.includes(brand)
                            ? "bg-gradient-to-b from-blue-600 via-blue-500 to-blue-600 text-white shadow-lg"
                            : "bg-gray-50 border border-gray-200 text-gray-700 hover:border-gray-300 hover:shadow-sm"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={filters.cpuBrand.includes(brand)}
                          onChange={() => handleFilterChange("cpuBrand", brand)}
                          className="sr-only"
                        />
                        <span>{brand}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* OS Filter */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-base font-bold text-slate-900">
                        Operating System
                      </h4>
                      <p className="mt-1 text-xs text-slate-500">
                        Choose device OS
                      </p>
                    </div>
                    <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-bold text-blue-600">
                      {filters.os.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {osOptions.map((os) => (
                      <label
                        key={os}
                        className={`flex items-center justify-center gap-2 cursor-pointer px-3 py-2.5 rounded-xl transition-all duration-200 font-medium ${
                          filters.os.includes(os)
                            ? "bg-gradient-to-b from-blue-600 via-blue-500 to-blue-600 text-white shadow-lg"
                            : "bg-gray-50 border border-gray-200 text-gray-700 hover:border-gray-300 hover:shadow-sm"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={filters.os.includes(os)}
                          onChange={() => handleFilterChange("os", os)}
                          className="sr-only"
                        />
                        <span>{os}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Display Size Filter */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-base font-bold text-slate-900">
                        Screen Size
                      </h4>
                      <p className="mt-1 text-xs text-slate-500">
                        Display diagonal measurement
                      </p>
                    </div>
                    <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-bold text-blue-600">
                      {filters.displaySize.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {displaySizeRanges.map((range) => (
                      <label
                        key={range.id}
                        className={`flex items-center justify-between gap-2 cursor-pointer px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                          filters.displaySize.includes(range.id)
                            ? "bg-gradient-to-b from-blue-600 via-blue-500 to-blue-600 text-white shadow-lg"
                            : "bg-gray-50 border border-gray-200 text-gray-700 hover:border-gray-300 hover:shadow-sm"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={filters.displaySize.includes(range.id)}
                          onChange={() =>
                            handleFilterChange("displaySize", range.id)
                          }
                          className="sr-only"
                        />
                        <span>{range.label}</span>
                        <div
                          className={`w-2 h-2 rounded-full ${
                            filters.displaySize.includes(range.id)
                              ? " "
                              : "bg-gray-300"
                          }`}
                        ></div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Weight Filter */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-base font-bold text-slate-900">
                        Weight
                      </h4>
                      <p className="mt-1 text-xs text-slate-500">
                        Device portability
                      </p>
                    </div>
                    <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-bold text-blue-600">
                      {filters.weight.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {WEIGHT_RANGES.map((range) => (
                      <label
                        key={range.id}
                        className={`flex items-center justify-between gap-2 cursor-pointer px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                          filters.weight.includes(range.id)
                            ? "bg-gradient-to-b from-blue-600 via-blue-500 to-blue-600 text-white shadow-lg"
                            : "bg-gray-50 border border-gray-200 text-gray-700 hover:border-gray-300 hover:shadow-sm"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={filters.weight.includes(range.id)}
                          onChange={() =>
                            handleFilterChange("weight", range.id)
                          }
                          className="sr-only"
                        />
                        <span>{range.label}</span>
                        <div
                          className={`w-2 h-2 rounded-full ${
                            filters.weight.includes(range.id)
                              ? " "
                              : "bg-gray-300"
                          }`}
                        ></div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Products List - Right */}
            <div className="min-w-0 flex-1">
              {/* Results Summary */}
              {/* BannerSlot disabled (incomplete). */}

              {/* Products Grid */}
              <div className="grid grid-cols-1 gap-4 sm:gap-5 md:gap-6 auto-rows-max">
                {sortedVariants.map((device, idx) => {
                  const cardBadgeLabel =
                    filter === "trending" || device.trendBadge
                      ? device.trendBadge || "Trending"
                      : "Laptop";
                  const storePrices = Array.isArray(device.storePrices)
                    ? device.storePrices
                    : [];
                  const specLine = (() => {
                    const parts = [];
                    const pushPart = (value) => {
                      const text = String(value ?? "").trim();
                      if (text) parts.push(text);
                    };

                    pushPart(device.specs?.ram);
                    pushPart(device.specs?.storage);
                    pushPart(device.specs?.cpu);
                    pushPart(device.specs?.display);
                    pushPart(device.specs?.battery);

                    return parts.length
                      ? parts.join(" | ")
                      : "Laptop specifications";
                  })();

                  return (
                    <div
                      key={`${device.id ?? device.model ?? ""}-${idx}`}
                      onClick={(e) => handleView(device, e)}
                      className="h-full w-full mx-auto smooth-transition fade-in-up overflow-hidden rounded-lg bg-white cursor-pointer transition-all duration-300 hover:bg-slate-50"
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
                              {formatPriceDisplay(device.price)}
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 hidden flex-col gap-3 lg:flex lg:flex-row lg:items-center lg:justify-between">
                          <div className="flex flex-wrap items-center gap-4">
                            <CircularScoreBadge
                              score={device.overall_score_display}
                              size={42}
                            />
                          </div>

                        </div>

                        <div className="mt-5 grid grid-cols-[128px_minmax(0,1fr)] gap-3 sm:grid-cols-[120px_minmax(0,1fr)] lg:grid-cols-[180px_minmax(0,1fr)] sm:gap-4 lg:gap-5">
                          <div className="relative flex items-start justify-start sm:justify-center">
                            {cardBadgeLabel ? (
                              <span className="absolute left-0 top-0 z-10 inline-flex items-center rounded-full bg-amber-600 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                                {cardBadgeLabel}
                              </span>
                            ) : null}
                            <div className="flex w-full justify-start sm:justify-center">
                              <ImageCarousel images={device.images} />
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

                              <CircularScoreBadge
                                score={device.overall_score_display}
                                size={42}
                              />
                            </div>
                            <div className="hidden lg:block text-[13px] leading-6 text-slate-700 sm:text-sm sm:leading-7 sm:text-base">
                              {specLine}
                            </div>

                            <div className="lg:hidden text-lg font-semibold tracking-tight text-[#14255e] sm:text-xl">
                              {formatPriceDisplay(device.price)}
                            </div>

                            {storePrices.length > 0 ? (
                              <div className="rounded-[24px] border border-blue-100 bg-[#f8fbff] p-2.5 sm:p-4 hidden lg:block">
                                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                                  <FaStore className="text-emerald-500" />
                                  Check Price On
                                </div>
                                <div className="space-y-2">
                                  {storePrices
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
                                              {storePrice.store ||
                                                "Online Store"}
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
                                  {storePrices.length > 2 ? (
                                    <div className="text-center text-xs text-gray-500 py-2">
                                      +{storePrices.length - 2} more stores
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                            ) : null}

                          </div>
                        </div>
                      </div>

                      {storePrices.length > 0 ? (
                        <div className="mt-4 rounded-[20px] border border-blue-100 bg-[#f8fbff] p-3 sm:p-4 lg:hidden">
                          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                            <FaStore className="text-emerald-500" />
                            Check Price On
                          </div>
                          <div className="space-y-2">
                            {storePrices.slice(0, 2).map((storePrice, i) => {
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
                                      <FaStore className="h-8 w-8 shrink-0 text-slate-300" />
                                    )}
                                    <span className="truncate text-sm font-medium text-slate-900">
                                      {storePrice.store || "Online Store"}
                                    </span>
                                  </div>
                                  <div className="flex shrink-0 items-center gap-2">
                                    <span className="text-sm font-bold text-emerald-600">
                                      {formatPriceDisplay(storePrice.price)}
                                    </span>
                                    {storePrice.url ? (
                                      <a
                                        href={storePrice.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
                                      >
                                        Buy Now
                                        <FaExternalLinkAlt className="text-xs opacity-80" />
                                      </a>
                                    ) : (
                                      <span className="text-xs font-semibold text-slate-400">
                                        Coming Soon
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
                  );
                })}
              </div>

              {/* No Results State */}
              {sortedVariants.length === 0 && (
                <div className="text-center py-16 bg-white border border-slate-200 rounded-[24px] shadow-[0_12px_30px_rgba(15,23,42,0.05)] transition-all duration-300 ">
                  <div className="max-w-md mx-auto">
                    <FaSearch className="text-gray-300 text-5xl mx-auto mb-4" />
                    <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                      No laptops found
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Try adjusting your filters or search terms to find what
                      you're looking for. We have a wide range of devices
                      available.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <button
                        onClick={clearFilters}
                        className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-600 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 "
                      >
                        Clear All Filters
                      </button>
                      <button
                        onClick={() => setShowFilters(true)}
                        className="text-gray-700 px-6 py-3 rounded-lg font-semibold border border-gray-300 hover:bg-gray-50 transition-all duration-300 hover:shadow-md hover:border-gray-400 "
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
                      options
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

          <LatestNewsRouteSection
            className="mt-6"
            productType="laptop"
            subtitle="Fresh laptop launches, processor updates, and buying context from the Hooks news desk."
          />

          <ProductDiscoverySections
            entityType="laptops"
            catalogItems={devices}
            brandCatalog={deviceContext?.brands || []}
            currentBrand={currentBrandObj?.name || filterBrand || ""}
            className="mt-6"
          />

          <MobileSortSheet
            open={showSort}
            onClose={() => setShowSort(false)}
            onChange={setSortBy}
            options={LAPTOP_MOBILE_SORT_OPTIONS}
            sortBy={sortBy}
            subtitle="Arrange laptops by preference"
          />

          {/* Mobile Filter Overlay */}
          {showFilters && (
            <div className="lg:hidden fixed inset-0 z-50">
              <div
                className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
                onClick={() => setShowFilters(false)}
              ></div>

              <div className="absolute bottom-0 left-0 right-0 flex max-h-[90vh] transform flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl transition-transform duration-300">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
                  <div className="flex items-center gap-3">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        Refine Search
                      </h3>
                      <p className="text-sm text-gray-500">
                        Filter laptops by specifications
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
                  <div className="flex flex-col gap-6">
                  {/* Price Range */}
                  <div className="order-2">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900 text-lg">
                        Price Range
                      </h4>
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-gray-500">
                        ₹{filters.priceRange.min?.toLocaleString()} - ₹
                        {filters.priceRange.max?.toLocaleString()}
                      </span>
                    </div>
                    <div className="bg-gradient-to-r from-blue-50 via-blue-50 to-white rounded-xl p-4 border border-gray-200">
                      <div className="relative mb-4">
                        <div className="absolute h-2 bg-gray-200 rounded-full w-full top-1/2 transform -translate-y-1/2"></div>
                        <div
                          className="absolute h-2 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 rounded-full top-1/2 transform -translate-y-1/2"
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

                  {/* Brand */}
                  <div className="order-1">
                    <h4 className="font-semibold text-gray-900 text-lg mb-3">
                      Brands
                    </h4>
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
                    <div className="grid grid-cols-2 gap-2">
                      {filteredBrandOptions.map((brand) => (
                        <label
                          key={brand}
                          className={`flex items-center justify-center gap-2 cursor-pointer px-3 py-2.5 rounded-xl transition-all duration-200 font-medium text-sm ${
                            filters.brand.includes(brand)
                              ? "bg-gradient-to-b from-blue-600 via-blue-500 to-blue-600 text-white shadow-lg"
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
                  </div>

                  {/* RAM */}
                  <div>
                    <h4 className="font-semibold text-gray-900 text-lg mb-3">
                      RAM
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                      {allRams.map((ram) => (
                        <label
                          key={ram}
                          className={`flex items-center justify-center gap-2 cursor-pointer px-3 py-2.5 rounded-xl transition-all duration-200 font-medium text-sm ${
                            filters.ram.includes(ram)
                              ? "bg-gradient-to-b from-blue-600 via-blue-500 to-blue-600 text-white shadow-lg"
                              : "bg-gray-50 border border-gray-200 text-gray-700 hover:border-gray-300 hover:shadow-sm"
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

                  {/* Storage */}
                  <div>
                    <h4 className="font-semibold text-gray-900 text-lg mb-3">
                      Storage
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                      {allStorages.map((storage) => (
                        <label
                          key={storage}
                          className={`flex items-center justify-center gap-2 cursor-pointer px-3 py-2.5 rounded-xl transition-all duration-200 font-medium text-sm ${
                            filters.storage.includes(storage)
                              ? "bg-gradient-to-b from-blue-600 via-blue-500 to-blue-600 text-white shadow-lg"
                              : "bg-gray-50 border border-gray-200 text-gray-700 hover:border-gray-300 hover:shadow-sm"
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

                  {/* CPU Brand */}
                  <div>
                    <h4 className="font-semibold text-gray-900 text-lg mb-3">
                      Processor
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {cpuBrands.map((brand) => (
                        <label
                          key={brand}
                          className={`flex items-center justify-center gap-2 cursor-pointer px-3 py-2.5 rounded-xl transition-all duration-200 font-medium text-sm ${
                            filters.cpuBrand.includes(brand)
                              ? "bg-gradient-to-b from-blue-600 via-blue-500 to-blue-600 text-white shadow-lg"
                              : "bg-gray-50 border border-gray-200 text-gray-700 hover:border-gray-300 hover:shadow-sm"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={filters.cpuBrand.includes(brand)}
                            onChange={() =>
                              handleFilterChange("cpuBrand", brand)
                            }
                            className="sr-only"
                          />
                          <span>{brand}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* OS */}
                  <div>
                    <h4 className="font-semibold text-gray-900 text-lg mb-3">
                      Operating System
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {osOptions.map((os) => (
                        <label
                          key={os}
                          className={`flex items-center justify-center gap-2 cursor-pointer px-3 py-2.5 rounded-xl transition-all duration-200 font-medium text-sm ${
                            filters.os.includes(os)
                              ? "bg-gradient-to-b from-blue-600 via-blue-500 to-blue-600 text-white shadow-lg"
                              : "bg-gray-50 border border-gray-200 text-gray-700 hover:border-gray-300 hover:shadow-sm"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={filters.os.includes(os)}
                            onChange={() => handleFilterChange("os", os)}
                            className="sr-only"
                          />
                          <span>{os}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Apply Button */}
                <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 bg-white p-6">
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowFilters(false)}
                      className="flex-1 rounded-xl bg-gray-100 py-4 font-semibold text-gray-700 transition-colors duration-200 hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => setShowFilters(false)}
                      className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 py-4 font-semibold text-white shadow-lg transition-all duration-200 hover:from-blue-600 hover:to-blue-600"
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

    </div>
  );
};

export default Laptops;
