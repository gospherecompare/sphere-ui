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
  FaSort,
  FaEye,
  FaShoppingBag,
  FaCalendarAlt,
  FaInfoCircle,
  FaExternalLinkAlt,
  FaPlug,
  FaWindowRestore,
  FaClock,
  FaTag,
  FaExchangeAlt,
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
import useDevice from "../../hooks/useDevice";
import { generateSlug } from "../../utils/slugGenerator";
import normalizeProduct from "../../utils/normalizeProduct";
import {
  computePopularLaptopFeatures,
  getLaptopFeatureSortValue,
  LAPTOP_FEATURE_CATALOG,
  matchesLaptopFeature,
} from "../../utils/laptopPopularFeatures";

// Enhanced Image Carousel - Reusable from smartphone
// Note: removed mock fallback — rely on `useDevice()` data from the store

// Image carousel used across device lists
const ImageCarousel = ({ images = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => setCurrentIndex(0), [images]);

  const handleNext = (e) => {
    e?.stopPropagation();
    setCurrentIndex((p) => (p + 1) % images.length);
  };
  const handlePrev = (e) => {
    e?.stopPropagation();
    setCurrentIndex((p) => (p - 1 + images.length) % images.length);
  };

  if (!images || images.length === 0) {
    return (
      <div className="relative w-full h-full flex items-center justify-center rounded-lg bg-gray-100">
        <div className="text-center px-3">
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

  const [params] = useSearchParams();
  const filter = params.get("filter");
  const feature = params.get("feature");
  const normalizedFeature = feature
    ? feature.toString().toLowerCase().replace(/\s+/g, "-")
    : null;
  const dispatch = useDispatch();
  const [sortBy, setSortBy] = useState("featured");
  const [popularFeatureOrder, setPopularFeatureOrder] = useState([]);
  const [popularFeatureOrderLoaded, setPopularFeatureOrderLoaded] =
    useState(false);

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
    if (typeof price === "string" && price.includes(",")) return `₹${price}`;
    const numeric = extractNumericPrice(price);
    return numeric > 0
      ? `₹ ${numeric.toLocaleString()}`
      : "Price not available";
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

    const processorName = pickFirstString(
      performance.processor_name,
      performance.processor,
      `${performance.brand || ""} ${performance.model || ""}`.trim(),
      raw.processor,
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
    );
    const resolution = pickFirstString(display.resolution);
    const refreshRate = pickFirstString(display.refresh_rate);
    const displayLabel = pickFirstString(
      display.display_size,
      display.size,
      display.size_cm,
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
      );

    const storageText =
      storageOptions.join(" / ") ||
      pickFirstString(
        storage.capacity,
        storage.storage,
        storage.size,
        storage.storage_type,
        storage.type,
      );

    const gpuLabel = pickFirstString(
      performance.gpu,
      raw.graphics?.model,
      raw.gpu,
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
      const n = Number(value);
      return Number.isFinite(n) ? n : null;
    };
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
      (trendViews7d - trendViewsPrev7d);
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
          ? `Rs ${numericPrice.toLocaleString()}`
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
        ),
        batteryLife: pickFirstString(
          battery.battery_life,
          battery.life,
          battery.backup_time,
        ),
        touchscreen:
          display.touchscreen ?? display.touch_support ?? display.touch ?? "",
        os: pickFirstString(software.operating_system, software.os),
        weight: physical.weight || "",
        color: colorOptions.join(" / ") || pickFirstString(physical.color),
        ports: pickFirstString(
          ports.ports_description,
          Array.isArray(connectivity.ports) ? connectivity.ports.join(", ") : "",
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
      launchDate:
        raw.launch_date ||
        basicInfo.launch_date ||
        raw.created_at ||
        metadata.created_at ||
        "",
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
    };
  };

  // Transform API/store data to devices array
  const { laptops, laptopsLoading } = useDevice();

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
      const def = LAPTOP_FEATURE_CATALOG.find((f) => f.id === normalizedFeature);
      if (def) base = [{ ...def, count: 0 }, ...base];
    }

    return base.slice(0, 16);
  }, [devices, normalizedFeature, popularFeatureOrder]);

  // Extract filter options dynamically from all devices
  const brands = [...new Set(devices.map((d) => d.brand).filter(Boolean))];

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

  // Graphics types
  const graphicsTypes = [
    ...new Set(
      devices.map((d) =>
        d.specs.graphics?.includes("RTX")
          ? "Dedicated"
          : d.specs.graphics?.includes("Radeon")
            ? "Integrated"
            : d.specs.graphics?.includes("Iris")
              ? "Integrated"
              : "Integrated",
      ),
    ),
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
  const [compareItems, setCompareItems] = useState([]);

  // Set page title
  useTitle({
    page: "laptops",
  });

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
    if (!q) return brands;
    return brands.filter((brand) =>
      String(brand || "")
        .toLowerCase()
        .includes(q),
    );
  }, [brands, brandFilterQuery]);

  const navigate = useNavigate();
  const { search } = useLocation();

  // Apply query param filters
  useEffect(() => {
    const params = new URLSearchParams(search);
    const brandParam = params.get("brand");
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
    const rawMax = params.get("priceMax") || params.get("maxPrice");
    const priceMin = rawMin ? Number(rawMin) : MIN_PRICE;
    const priceMax = rawMax ? Number(rawMax) : MAX_PRICE;

    setFilters((prev) => ({
      ...prev,
      brand: brandParam ? [brandParam] : prev.brand,
      priceRange: {
        min: !isNaN(priceMin) ? priceMin : prev.priceRange.min,
        max: !isNaN(priceMax) ? priceMax : prev.priceRange.max,
      },
      ram: ramArr.length ? ramArr : prev.ram,
      storage: storageArr.length ? storageArr : prev.storage,
      cpuBrand: cpuArr.length ? cpuArr : prev.cpuBrand,
      os: osArr.length ? osArr : prev.os,
    }));

    if (brandParam && !sortParam) {
      setSortBy("newest");
    } else if (sortParam) {
      setSortBy(sortParam);
    }

    if (qParam !== null) {
      setSearchQuery(qParam);
    }
  }, [search]);

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

  const handleSortChange = (value) => {
    setSortBy(value);
    setShowSort(false);
    try {
      const params = new URLSearchParams(search);
      if (value && value !== "featured") params.set("sort", value);
      else params.delete("sort");
      const qs = params.toString();
      const path = `/laptops${qs ? `?${qs}` : ""}`;
      navigate(path, { replace: true });
    } catch {
      // ignore
    }
  };

  // Filter logic
  const filteredVariants = variantCards.filter((device) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        device.name.toLowerCase().includes(query) ||
        device.brand.toLowerCase().includes(query) ||
        device.specs.cpu.toLowerCase().includes(query) ||
        device.specs.features.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    if (normalizedFeature && !matchesLaptopFeature(device, normalizedFeature)) {
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
        return new Date(b.launchDate) - new Date(a.launchDate);
      case "weight":
        return a.numericWeight - b.numericWeight;
      case "battery":
        return b.numericBattery - a.numericBattery;
      default:
        return 0;
    }
  });

  const getSelectedFeatureValueLabel = (device) => {
    if (!normalizedFeature || !device) return "";

    const val = getLaptopFeatureSortValue(device, normalizedFeature);
    switch (normalizedFeature) {
      case "long-battery":
        return val != null ? `${Math.round(Number(val))} Wh Battery` : "";
      case "high-refresh-rate":
        return val != null ? `${Math.round(Number(val))} Hz Display` : "";
      case "lightweight": {
        if (val == null) return "";
        const kg = Math.abs(Number(val));
        return Number.isFinite(kg) && kg > 0 ? `${kg.toFixed(2)} kg` : "";
      }
      case "oled-display":
        return /oled/i.test(String(device?.specs?.display || ""))
          ? "OLED Display"
          : "";
      case "touchscreen": {
        const raw = device?.specs?.touchscreen;
        if (typeof raw === "boolean") return raw ? "Touchscreen" : "";
        if (raw == null) return "";
        const s = String(raw).toLowerCase();
        return /true|yes|supported|touch/.test(s) ? "Touchscreen" : "";
      }
      case "gaming":
        return "Gaming Focus";
      default:
        return "";
    }
  };

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
      const params = new URLSearchParams(search);
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
    } catch {}
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
    const sp = new URLSearchParams(search || "");
    if (featureId) trackFeatureClick(featureId);
    if (featureId) sp.set("feature", featureId);
    else sp.delete("feature");
    sp.delete("filter");
    const next = sp.toString();
    navigate(`/laptops${next ? `?${next}` : ""}`);
  };

  const handleView = (device, e, store) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const params = new URLSearchParams();
    params.set("type", "laptop");

    // Prefer brand and model names over internal ids
    if (device.brand) params.set("brand", String(device.brand));
    if (device.name) params.set("model", String(device.name));

    // Variant-level details (ram/storage/variant id)
    if (device.variant?.variant_id)
      params.set("variantId", String(device.variant.variant_id));
    if (device.variant?.ram) params.set("ram", String(device.variant.ram));
    if (device.variant?.storage)
      params.set("storage", String(device.variant.storage));

    // Additional spec filters useful for detail page
    if (device.specs?.cpuBrand)
      params.set("cpu", String(device.specs.cpuBrand));
    if (device.specs?.os) params.set("os", String(device.specs.os));

    // Store info
    if (store?.id) params.set("storeId", String(store.id));
    if (store?.store) params.set("storeName", String(store.store));

    // Generate SEO-friendly slug-based URL
    const slug = generateSlug(
      device.name || device.model || device.brand || String(device.id),
    );
    const qs = params.toString();

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

    navigate(`/laptops/${slug}${qs ? `?${qs}` : ""}`);
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

  const headerLabel =
    filter === "trending"
      ? "TRENDING NOW"
      : filter === "new"
        ? "LATEST COLLECTION"
        : "LAPTOP COLLECTION";

  const currentYear = new Date().getFullYear();
  const sanitizeDescription = (desc = "") => {
    const text = String(desc || "")
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim();
    return text.length > 180 ? `${text.slice(0, 177)}...` : text;
  };

  let seoTitle = `Best Laptops ${currentYear} - Compare Prices, Specs & Deals | Hook`;
  let seoDescription =
    "Browse the latest laptops with full specifications, prices, and feature comparisons on Hook.";

  if (filter === "trending") {
    seoTitle = `Trending Laptops ${currentYear} - Most Popular Models & Prices | Hook`;
    seoDescription =
      "Explore trending laptops with rising buyer interest, latest prices, and key specs to find the best option quickly on Hook.";
  } else if (filter === "new") {
    seoTitle = `Latest Laptops ${currentYear} - New Launches, Specs & Prices | Hook`;
    seoDescription =
      "Discover newly launched laptops with updated prices, processor details, RAM and storage options, and full spec breakdowns on Hook.";
  }

  if (currentBrandObj) {
    seoTitle = `${currentBrandObj.name} Laptops ${currentYear} - Models, Prices & Specs | Hook`;
    seoDescription = sanitizeDescription(
      currentBrandObj.description ||
        `Compare ${currentBrandObj.name} laptops with detailed specifications, latest prices, and top deals on Hook.`,
    );
  }

  return (
    <div className="min-h-screen">
      <style>{animationStyles}</style>
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDescription} />
      </Helmet>
      {/* Page Header */}

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-4 sm:p-6 md:p-8 lg:p-10 bg-white">
        <div className="mb-8 sm:mb-10 lg:mb-12">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-purple-50 backdrop-blur-sm px-3 py-1.5 rounded-full border border-purple-100 mb-4 sm:mb-6">
            <FaLaptop className="text-purple-600 text-sm" />
            <span className="text-xs sm:text-sm font-semibold text-purple-800">
              {headerLabel}
            </span>
          </div>

          {/* Main Heading - Gradient Text */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 sm:mb-4 lg:mb-6 leading-tight">
            Explore Premium{" "}
            <span className="bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600 bg-clip-text text-transparent">
              Laptops
            </span>
          </h1>

          {/* Subtitle */}
          <h4 className="text-base sm:text-lg lg:text-xl mb-6 sm:mb-8 text-gray-700 leading-relaxed max-w-3xl">
            Discover detailed specifications, compare models, and find the best
            deals on the latest laptops. Use our advanced filters to narrow down
            your search from our curated collection of premium devices.
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
                  placeholder="Search laptops by brand, model, processor, or features..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl
             border border-gray-300
              text-gray-700 placeholder:text-gray-400
              focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
              text-sm sm:text-base
              disabled:opacity-50 disabled:cursor-not-allowed
 "
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
                  <option value="rating">Highest Rated</option>
                  <option value="newest">Newest First</option>
                  <option value="weight">Lightest First</option>
                  <option value="battery">Best Battery</option>
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
                placeholder="Search laptops..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 pl-12 pr-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-100 focus:border-purple-500 text-gray-700 transition-all duration-200 placeholder:text-gray-400 bg-white"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowFilters(true)}
                className="flex items-center justify-center gap-2 flex-1 h-12 bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600 text-white px-4 rounded-xl transition-all duration-300 font-semibold hover:from-purple-600 hover:to-blue-600 hover:shadow-lg hover:-translate-y-0.5"
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
                className="flex items-center justify-center gap-2 flex-1 h-12 text-gray-700 px-4 rounded-xl border border-gray-900 hover:bg-gray-50 transition-all duration-300 font-semibold"
              >
                <FaSort />
                Sort
              </button>
            </div>

            {/* Active Filters Badge - Mobile */}
            {getActiveFiltersCount() > 0 && (
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-100 to-blue-50 rounded-xl border border-purple-200">
                <div className="flex items-center gap-3">
                  <FaInfoCircle className="text-purple-600" />
                  <div>
                    <span className="text-sm font-medium text-purple-800">
                      {getActiveFiltersCount()} filter
                      {getActiveFiltersCount() > 1 ? "s" : ""} applied
                    </span>
                    <p className="text-xs text-purple-600 mt-0.5">
                      Showing {filteredVariants.length} of {variantCards.length}{" "}
                      options
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
                Available Laptops
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Browse through our collection of laptops with detailed
                specifications and competitive prices
              </p>
            </div>
            <div className="hidden lg:block text-sm text-gray-500">
              Showing {sortedVariants.length} of {variantCards.length} options
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Desktop Filter Sidebar */}
          <div className="hidden lg:block lg:w-80 flex-shrink-0">
            <div className="p-6 sticky top-6">
              {/* Filters Header */}
              <div
                className="flex justify-between items-center mb-8 pb-4
           border-b border-indigo-100 px-4"
              >
                <div>
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    Refine Search
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Narrow down laptops by specifications
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
                <div className="mb-6 p-4 bg-gradient-to-r from-purple-100 to-blue-50 rounded-xl border border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-purple-800">
                      Active Filters
                    </span>
                    <span className="text-xs font-bold text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                      {getActiveFiltersCount()}
                    </span>
                  </div>
                  <p className="text-xs text-purple-600">
                    Refine further or clear to see all laptops
                  </p>
                </div>
              )}

              {/* Price Range Filter */}
              <div className="mb-8 ">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-bold text-gray-900 text-base">
                      Price Range
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      Budget for your purchase
                    </p>
                  </div>
                  <span className="text-xs font-bold text-purple-600 bg-purple-100 px-2.5 py-1.5 rounded-full">
                    ₹{filters.priceRange.min?.toLocaleString()}
                  </span>
                </div>

                <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-blue-50 border border-indigo-100 rounded-xl p-4">
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

              {/* RAM Filter */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-bold text-gray-900 text-base">
                      Memory (RAM)
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      Multitasking performance
                    </p>
                  </div>
                  <span className="text-xs font-bold text-purple-600 bg-purple-100 px-2.5 py-1.5 rounded-full">
                    {filters.ram.length}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {allRams.map((ram) => (
                    <label
                      key={ram}
                      className={`flex items-center justify-center gap-2 cursor-pointer px-3 py-2.5 rounded-xl transition-all duration-200 font-medium ${
                        filters.ram.includes(ram)
                          ? "bg-gradient-to-b from-purple-200 to-blue-200 text-blue-500  "
                          : "text-gray-700 hover:border-gray-300 bg-gradient-to-br from-purple-50 to-blue-50 border  border-indigo-100"
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
                    <h4 className="font-bold text-gray-900 text-base">
                      Storage Capacity
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      Apps and media space
                    </p>
                  </div>
                  <span className="text-xs font-bold text-purple-600 bg-purple-100 px-2.5 py-1.5 rounded-full">
                    {filters.storage.length}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {allStorages.map((storage) => (
                    <label
                      key={storage}
                      className={`flex items-center justify-center gap-2 cursor-pointer px-3 py-2.5 rounded-xl transition-all duration-200 font-medium ${
                        filters.storage.includes(storage)
                          ? "bg-gradient-to-b from-purple-200 to-blue-200 text-blue-500 "
                          : "bg-gradient-to-br from-purple-50 to-blue-50 border border-indigo-100 text-gray-700 hover:border-gray-300 hover: "
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={filters.storage.includes(storage)}
                        onChange={() => handleFilterChange("storage", storage)}
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
                    <h4 className="font-bold text-gray-900 text-base">
                      Processor Brand
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      Select CPU manufacturer
                    </p>
                  </div>
                  <span className="text-xs font-bold text-purple-600 bg-purple-100 px-2.5 py-1.5 rounded-full">
                    {filters.cpuBrand.length}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {cpuBrands.map((brand) => (
                    <label
                      key={brand}
                      className={`flex items-center justify-center gap-2 cursor-pointer px-3 py-2.5 rounded-xl transition-all duration-200 font-medium ${
                        filters.cpuBrand.includes(brand)
                          ? "bg-gradient-to-b from-purple-200 to-blue-200 text-blue-500  "
                          : "text-gray-700 hover:border-gray-300 bg-gradient-to-br from-purple-50 to-blue-50 border  border-indigo-100"
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
                    <h4 className="font-bold text-gray-900 text-base">
                      Operating System
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      Choose device OS
                    </p>
                  </div>
                  <span className="text-xs font-bold text-purple-600 bg-purple-100 px-2.5 py-1.5 rounded-full">
                    {filters.os.length}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {osOptions.map((os) => (
                    <label
                      key={os}
                      className={`flex items-center justify-center gap-2 cursor-pointer px-3 py-2.5 rounded-xl transition-all duration-200 font-medium ${
                        filters.os.includes(os)
                          ? "bg-gradient-to-b from-purple-200 to-blue-200 text-blue-500  "
                          : "text-gray-700 hover:border-gray-300 bg-gradient-to-br from-purple-50 to-blue-50 border  border-indigo-100"
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
                    <h4 className="font-bold text-gray-900 text-base">
                      Screen Size
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      Display diagonal measurement
                    </p>
                  </div>
                  <span className="text-xs font-bold text-purple-600 bg-purple-100 px-2.5 py-1.5 rounded-full">
                    {filters.displaySize.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {displaySizeRanges.map((range) => (
                    <label
                      key={range.id}
                      className={`flex items-center justify-between gap-2 cursor-pointer px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                        filters.displaySize.includes(range.id)
                          ? "bg-gradient-to-r from-purple-200 to-blue-200 text-blue-500 "
                          : "bg-gradient-to-br from-purple-50 to-blue-50 border border-b border-indigo-100 text-gray-700 hover:border-gray-300"
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
                    <h4 className="font-bold text-gray-900 text-base">
                      Weight
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      Device portability
                    </p>
                  </div>
                  <span className="text-xs font-bold text-purple-600 bg-purple-100 px-2.5 py-1.5 rounded-full">
                    {filters.weight.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {WEIGHT_RANGES.map((range) => (
                    <label
                      key={range.id}
                      className={`flex items-center justify-between gap-2 cursor-pointer px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                        filters.weight.includes(range.id)
                          ? "bg-gradient-to-r from-purple-200 to-blue-200 text-blue-500 "
                          : "bg-gradient-to-br from-purple-50 to-blue-50 border border-b border-indigo-100 text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={filters.weight.includes(range.id)}
                        onChange={() => handleFilterChange("weight", range.id)}
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
          <div className="flex-1">
            {/* Results Summary */}

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6 auto-rows-fr md:[&>*:nth-child(2n)]:border-l md:[&>*:nth-child(2n)]:border-gray-200 md:[&>*:nth-child(2n)]:pl-6 md:[&>*:nth-child(2n+1)]:pr-6">
              {sortedVariants.map((device, idx) => (
                <div
                  key={`${device.id ?? device.model ?? ""}-${idx}`}
                  onClick={(e) => handleView(device, e)}
                  className={`h-full smooth-transition fade-in-up overflow-hidden rounded-2xl bg-white cursor-pointer transition-all duration-200 md:rounded-none md:bg-white ${
                    isCompareSelected(device)
                      ? "ring-2 ring-purple-300 bg-purple-50"
                      : ""
                  }`}
                >
                  <div className="p-3 sm:p-4 md:p-5 lg:p-6 pt-4 sm:pt-5 md:pt-6">
                    {/* Top Row: Image and Basic Info */}
                    <div className="grid grid-cols-[minmax(0,8.5rem)_minmax(0,1fr)] sm:grid-cols-[minmax(0,9rem)_minmax(0,1fr)] gap-3 w-full items-start">
                      {/* Product Image - Fixed container with checkbox overlay */}
                      <div className="relative flex-shrink-0 w-full h-36 sm:h-48 rounded-2xl overflow-hidden group bg-gray-50 border border-gray-200">
                        <div className="w-full h-full flex items-center justify-center p-1.5 sm:p-2">
                          <ImageCarousel images={device.images} />
                        </div>
                        {/* Compare Checkbox Overlay - Top Right */}
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute top-2 right-2 z-10 rounded-md transition-all duration-200 cursor-pointer hover:bg-gray-50 hover:border-purple-500"
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
                        <div className="mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1 md:flex-nowrap">
                              <span className="text-xs font-semibold text-purple-700">
                                {device.brand}
                              </span>
                              {(filter === "trending" || device.trendBadge) && (
                                <span
                                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 whitespace-nowrap ${
                                    device.trendManualBoost
                                      ? "bg-blue-50 text-blue-700 ring-blue-200"
                                      : (device.trendDelta || 0) > 0
                                        ? "bg-orange-50 text-orange-700 ring-orange-200"
                                        : "bg-sky-50 text-sky-700 ring-sky-200"
                                  }`}
                                  title={
                                    device.trendScore != null
                                      ? "Trending device"
                                      : "Trending"
                                  }
                                >
                                  {device.trendBadge || "Trending"}
                                </span>
                              )}
                            </div>
                            <div className="leading-snug">
                              {(() => {
                                const name = device.name || device.model || "";
                                const ram = String(
                                  device.specs?.ram ?? "",
                                ).trim();
                                const storage = (
                                  device.specs?.storage ?? ""
                                ).trim();
                                const display = String(
                                  device.specs?.displaySize ?? "",
                                ).trim();
                                const cpu = String(
                                  device.specs?.cpu ?? "",
                                ).trim();
                                const selectedFeatureValue =
                                  getSelectedFeatureValueLabel(device);

                                const parts = [];

                                if (ram) {
                                  const ramLabel =
                                    ram.toLowerCase().includes("gb") ||
                                    ram.toLowerCase().includes("tb")
                                      ? ram
                                      : `${ram} RAM`;
                                  parts.push(ramLabel);
                                }
                                if (storage) {
                                  const storageLabel =
                                    storage.toLowerCase().includes("gb") ||
                                    storage.toLowerCase().includes("tb")
                                      ? storage
                                      : `${storage} Storage`;
                                  parts.push(storageLabel);
                                }
                                if (display) parts.push(`${display}"`);

                                if (cpu) parts.push(cpu);

                                const summary = parts.filter(Boolean).join(" | ");

                                return (
                                  <>
                                    <h5 className="font-bold text-gray-900 text-[15px] leading-5 whitespace-normal break-normal">
                                      {name}
                                    </h5>
                                    {summary ? (
                                      <p className="mt-1 text-[12px] text-gray-600 leading-5 whitespace-normal break-normal">
                                        {summary}
                                      </p>
                                    ) : null}
                                    {selectedFeatureValue ? (
                                      <p className="mt-1 text-[11px] font-semibold text-purple-700 leading-5">
                                        {selectedFeatureValue}
                                      </p>
                                    ) : null}
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                        </div>

                        {/* Price and Rating */}
                        <div className="mb-3">
                          <div className="flex items-center justify-between">
                            <div>
                              {(() => {
                                const brandStoreUrl =
                                  (device.storePrices || []).find(
                                    (sp) =>
                                      typeof sp?.url === "string" &&
                                      sp.url.trim().length > 0,
                                  )?.url || null;
                                if (!device.brand) return null;
                                return (
                                  <a
                                    href={brandStoreUrl || "#"}
                                    target={brandStoreUrl ? "_blank" : undefined}
                                    rel={
                                      brandStoreUrl
                                        ? "noopener noreferrer"
                                        : undefined
                                    }
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (!brandStoreUrl) e.preventDefault();
                                    }}
                                    className={`inline-block w-full mb-1 text-[12px] font-medium leading-snug whitespace-nowrap overflow-hidden text-ellipsis ${
                                      brandStoreUrl
                                        ? "text-blue-700 hover:text-blue-800 hover:underline"
                                        : "text-blue-700 cursor-default"
                                    }`}
                                  >
                                    {`Visit the ${device.brand} Store`}
                                  </a>
                                );
                              })()}
                              {device.price !== "Price not available" && (
                                <div className="text-xs text-gray-500 mb-0.5">
                                  Starting from
                                </div>
                              )}
                              <div
                                className={`text-lg font-bold ${
                                  device.price === "Price not available"
                                    ? "text-gray-400"
                                    : "text-green-600"
                                }`}
                              >
                                {device.price}
                              </div>
                              {(filter === "trending" || device.trendViews7d > 0) && (
                                <div className="text-[11px] text-gray-500 mt-0.5">
                                  {device.trendDelta > 0
                                    ? `+${device.trendDelta} views vs last 7d`
                                    : `${device.trendViews7d || 0} views in last 7d`}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Key Specs Badges */}
                      </div>
                    </div>

                    {/* Expanded Details */}
                    <div className="mt-3 sm:mt-4 md:mt-5 pt-3 sm:pt-4 md:pt-5 border-t border-indigo-100">
                      {/* Store Availability */}
                      {device.storePrices && device.storePrices.length > 0 && (
                        <div className="mb-4">
                          <div className="flex items-center justify-between gap-2 mb-3">
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
                                const logoSrc =
                                  storePrice.logo ||
                                  (getStoreLogo
                                    ? getStoreLogo(storeNameCandidate)
                                    : getLogo(storeNameCandidate));
                                return (
                                  <div
                                    key={`${device.id}-store-${i}`}
                                    className="flex items-center justify-between text-sm bg-gradient-to-br from-purple-50 to-blue-50 px-3 py-2 rounded-lg"
                                  >
                                    <div className="flex items-center gap-2">
                                      {logoSrc ? (
                                        <img
                                          src={logoSrc}
                                          alt={storePrice.store}
                                          className="w-6 h-6 object-contain"
                                        />
                                      ) : (
                                        <FaStore className="text-gray-400" />
                                      )}
                                      <span className="font-medium text-gray-900 capitalize">
                                        {storePrice.store || "Online Store"}
                                      </span>
                                    </div>
                                    <div className="font-bold text-green-600">
                                      {formatPriceDisplay(storePrice.price)}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <a
                                        href={storePrice.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="text-purple-600 hover:text-blue-800 text-xs font-medium flex items-center gap-1"
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

                      {/* Launch Date */}
                      {(() => {
                        if (!device.launchDate) return null;
                        const parsed = new Date(device.launchDate);
                        if (Number.isNaN(parsed.getTime())) return null;
                        return (
                          <div className="flex items-center gap-2 text-xs text-gray-600 mb-4">
                            <FaCalendarAlt className="text-gray-400" />
                            <span>
                              Released:{" "}
                              {parsed.toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-4 items-center">
                      <div className="flex-1"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Floating Compare Bar - Appears when 2+ items selected */}
            {compareItems.length >= 2 && (
              <div className="fixed bottom-6 left-4 right-4 md:bottom-8 md:left-auto md:right-8 z-40 max-w-sm bg-white rounded-xl p-4 animate-slide-up md:shadow-2xl md:border-2 md:border-purple-500">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {compareItems.length} laptops selected
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      Ready to compare specifications
                    </p>
                  </div>
                  <button
                    onClick={handleCompareNavigate}
                    className="flex-shrink-0 bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:from-purple-600 hover:to-blue-600 transition-all duration-200 whitespace-nowrap text-sm"
                  >
                    Compare Now
                  </button>
                </div>
              </div>
            )}

            {/* No Results State */}
            {sortedVariants.length === 0 && (
              <div className="text-center py-16 bg-gradient-to-b from-white to-blue-50 border border-purple-100 rounded-xl transition-all duration-300 ">
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
                      className="bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-blue-600 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 "
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
                  <FaSort className="text-purple-600 text-xl" />
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Sort Options
                    </h3>
                    <p className="text-sm text-gray-500">
                      Arrange laptops by preference
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
                    desc: "Premium laptops first",
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
                  {
                    value: "weight",
                    label: "Lightest First",
                    desc: "Portable laptops first",
                  },
                  {
                    value: "battery",
                    label: "Best Battery Life",
                    desc: "Longest battery first",
                  },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleSortChange(option.value)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                      sortBy === option.value
                        ? "bg-purple-50 border-purple-500 text-purple-700"
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
                  <div className="bg-gradient-to-r from-purple-50 via-blue-50 purple-50 to-white rounded-xl p-4 border border-gray-200">
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
                            ? "bg-gradient-to-b from-blue-600 via-purple-500 to-blue-600 text-white shadow-lg"
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
                            ? "bg-gradient-to-b from-blue-600 via-purple-500 to-blue-600 text-white shadow-lg"
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
                            ? "bg-gradient-to-b from-blue-600 via-purple-500 to-blue-600 text-white shadow-lg"
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
                            ? "bg-gradient-to-b from-blue-600 via-purple-500 to-blue-600 text-white shadow-lg"
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
                            ? "bg-gradient-to-b from-blue-600 via-purple-500 to-blue-600 text-white shadow-lg"
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
                    className="flex-1 bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600 text-white py-4 rounded-xl font-semibold hover:from-purple-600 hover:to-blue-600 transition-all duration-200 shadow-lg"
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
                Use our comparison tool to side-by-side compare multiple laptops
                based on performance, features, and value for money.
              </p>
            </div>
            <button
              onClick={() => navigate("/compare")}
              className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-blue-600 transition-all duration-200   whitespace-nowrap"
            >
              Open Comparison Tool
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Laptops;
