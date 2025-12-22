// src/components/DeviceList.jsx
import React, { useState, useEffect } from "react";
import {
  FaStar,
  FaCamera,
  FaBatteryFull,
  FaMemory,
  FaMicrochip,
  FaSignal,
  FaSyncAlt,
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
  FaMobileAlt,
  FaInfoCircle,
  FaChevronRight,
  FaExternalLinkAlt,
} from "react-icons/fa";
import { useDevice } from "../../hooks/useDevice";
import { useNavigate, useLocation } from "react-router-dom";
import Brandofmonth from "../Home/Brandofmonth";
import CategoryNav from "../Home/Category";
import { STORE_LOGOS } from "../../constants/storeLogos";
import Spinner from "../ui/Spinner";
import useTitle from "../../hooks/useTitle";

// Enhanced Image Carousel - Simplified without counts/indicators
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

  // If no images or single image, show static image
  if (!images || images.length === 0) {
    return (
      <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg">
        <div className="text-center">
          <FaMobileAlt className="text-gray-300 text-3xl mx-auto mb-2" />
          <span className="text-gray-400 text-sm">No image</span>
        </div>
      </div>
    );
  }

  // Single image case
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

  // Multiple images case - simplified without indicators
  return (
    <div className="relative w-full h-full group">
      {/* Main Image */}
      <div className="w-full h-full flex items-center justify-center">
        <img
          src={images[currentIndex]}
          alt={`product-view-${currentIndex + 1}`}
          className="w-auto h-auto max-w-full max-h-full object-contain rounded-lg"
          loading="lazy"
        />
      </div>

      {/* Navigation Arrows (only show on hover for mobile, always for desktop) */}
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

const Smartphonelist = () => {
  const deviceContext = useDevice();
  const { smartphone } = deviceContext || {};

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

  // Map API response to device format
  const mapApiToDevice = (apiDevice, idx) => {
    // Images
    const images = apiDevice.images || [];

    // Use `variants` array provided by Redux (already normalized at store level)
    const variants = Array.isArray(apiDevice.variants)
      ? apiDevice.variants
      : [];

    // Aggregate store prices from variants -> store_prices
    let storePrices = [];
    if (variants.length > 0) {
      storePrices = variants.flatMap((v) => {
        const variantBase = v.base_price || v.basePrice || v.base;
        const prices = Array.isArray(v.store_prices)
          ? v.store_prices.map((sp) => ({
              id: sp.id,
              variant_id: v.id,
              store: sp.store_name || sp.store || sp.storeName || sp.storeName,
              price: sp.price,
              url: sp.url || sp.url_link || sp.link,
              last_updated: sp.last_updated || sp.lastUpdated,
            }))
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
        storePrices = apiDevice.store_prices.map((sp) => ({
          id: sp.id,
          store: sp.store_name || sp.store || sp.storeName || "Store",
          price: sp.price,
          url: sp.url,
        }));
      }
    }

    // Compute numeric price as lowest available store price or variant/base price
    // Prefer variant base_price over store prices
    const variantBaseCandidates = variants.length
      ? variants
          .map((v) =>
            extractNumericPrice(v.base_price || v.basePrice || v.base)
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

    // Battery
    const batteryRaw =
      apiDevice.battery?.battery_capacity_mah ||
      apiDevice.battery?.battery_capacity ||
      apiDevice.battery?.capacity ||
      apiDevice.battery_capacity_mah ||
      apiDevice.battery_capacity ||
      "";
    const numericBattery = parseInt(
      String(batteryRaw).replace(/[^0-9]/g, "") || "0"
    );

    // Refresh rate
    const refreshRate =
      apiDevice.display?.refresh_rate || apiDevice.display?.refreshRate || "";

    // Network support (connectivity_network in JSON)
    let networkSupport = "";
    try {
      const conn =
        apiDevice.connectivity_network || apiDevice.connectivity || {};
      const fiveFlag =
        conn._5g_support ?? conn["5g_support"] ?? conn["5G_support"];
      if (typeof fiveFlag === "string") {
        if (fiveFlag.toLowerCase().startsWith("y")) networkSupport = "5G";
        else networkSupport = "4G";
      } else if (typeof fiveFlag === "boolean") {
        networkSupport = fiveFlag ? "5G" : "4G";
      }
      if (!networkSupport) {
        const tech = (
          conn.network_technology ||
          conn.network ||
          apiDevice.performance?.network ||
          apiDevice.network ||
          ""
        ).toString();
        if (/5g/i.test(tech)) networkSupport = "5G";
        else if (/4g/i.test(tech)) networkSupport = "4G";
      }
    } catch {
      networkSupport =
        apiDevice.performance?.network || apiDevice.network || "";
    }

    // Camera count - infer from available camera fields
    const cam = apiDevice.camera || {};
    const cameraFields = [
      "main_camera_megapixels",
      "telephoto_camera_megapixels",
      "ultrawide_camera_megapixels",
      "front_camera_megapixels",
    ];
    const cameraCount = cameraFields.reduce(
      (acc, k) =>
        cam[k] || cam[k.replace(/_megapixels$/, "")] ? acc + 1 : acc,
      0
    );

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
          "";

    const variantRams = variants.length
      ? [...new Set(variants.map((v) => v.ram).filter(Boolean))]
      : [];
    const ramStr =
      variantRams.length > 0
        ? variantRams.join(" / ")
        : apiDevice.performance?.ram || "";

    return {
      id: apiDevice.id || idx + 1,
      name: apiDevice.name || apiDevice.model || "",
      model: apiDevice.model || "",
      brand: apiDevice.brand || "",
      price:
        numericPrice > 0
          ? `₹${numericPrice.toLocaleString()}`
          : "Price not available",
      numericPrice: numericPrice,
      rating: parseFloat(apiDevice.rating) || 0,
      reviews:
        apiDevice.reviews && typeof apiDevice.reviews === "number"
          ? `${apiDevice.reviews} reviews`
          : apiDevice.reviews || "",
      image: images[0] || "",
      images: images,
      specs: {
        display: `${apiDevice.display?.size || ""} ${
          apiDevice.display?.type || ""
        }`.trim(),
        processor: apiDevice.performance?.processor || "",
        ram: ramStr,
        storage: storageStr,
        camera: cam.main_camera_megapixels || cam.main_camera || "",
        battery:
          batteryRaw || (numericBattery > 0 ? `${numericBattery} mAh` : ""),
        os:
          apiDevice.performance?.operating_system ||
          apiDevice.performance?.operatingSystem ||
          apiDevice.performance?.os ||
          "",
        refreshRate: refreshRate,
        network: networkSupport,
        cameraCount: cameraCount,
      },
      numericBattery: numericBattery,
      launchDate:
        apiDevice.launch_date ||
        apiDevice.created_at ||
        apiDevice.createdAt ||
        "",
      storePrices: storePrices,
      variants: variants,
    };
  };

  // Transform API data to devices array
  const devices = Array.isArray(smartphone)
    ? smartphone.map((device, i) => mapApiToDevice(device, i))
    : smartphone
    ? [mapApiToDevice(smartphone, 0)]
    : [];

  // Aggregate all variants across smartphones (supports variants array or singular variant)
  const allVariants = (
    Array.isArray(smartphone) ? smartphone : smartphone ? [smartphone] : []
  ).flatMap((s) => (Array.isArray(s.variants) ? s.variants : []));

  // Build variant-level cards so each variant (ram/storage) gets its own card
  const variantCards = devices.flatMap((device) => {
    const vars =
      Array.isArray(device.variants) && device.variants.length
        ? device.variants
        : [];

    if (vars.length === 0) {
      // fallback: create a single card representing the device
      return [{ ...device, id: `${device.id}-default` }];
    }

    return vars.map((v) => {
      // map store prices for this variant (if any)
      const rawVariantStorePrices = Array.isArray(v.store_prices)
        ? v.store_prices
        : [];

      const mappedVariantStores = rawVariantStorePrices.map((sp) => ({
        id: sp.id,
        store: sp.store_name || sp.store || sp.storeName || "Store",
        price: sp.price,
        url: sp.url,
      }));

      const base = extractNumericPrice(v.base_price || v.basePrice || v.base);

      // prefer variant store prices; if none, expose the variant base price as a single "Variant" store entry;
      // only fallback to device-level aggregated stores when neither variant stores nor base price are available.
      const storePrices =
        mappedVariantStores.length > 0
          ? mappedVariantStores
          : base > 0
          ? [
              {
                id: `variant-base-${
                  v.variant_id ?? v.id ?? Math.random().toString(36).slice(2, 8)
                }`,
                store: "Variant",
                price: base,
                url: null,
              },
            ]
          : device.storePrices || [];

      // compute numeric price for variant: prefer lowest store price, else base_price, else device.numericPrice
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
        // keep device-level info but override ram/storage/price
        ...device,
        id: `${device.id}-${
          v.variant_id ?? v.id ?? Math.random().toString(36).slice(2, 8)
        }`,
        variant: v,
        specs: {
          ...device.specs,
          ram: v.ram || device.specs.ram,
          storage: v.storage || device.specs.storage,
        },
        storePrices: storePrices.length > 0 ? storePrices : device.storePrices,
        price,
        numericPrice,
      };
    });
  });

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
        .filter(Boolean)
    ),
  ];

  // Sort ram and storage options (numeric-aware)
  uniqueRams.sort(
    (a, b) =>
      parseInt(String(a).replace(/[^0-9]/g, "")) -
      parseInt(String(b).replace(/[^0-9]/g, ""))
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
        (storage) => storage && storage !== "NaN"
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
    const opts = [
      ...new Set(devices.map((d) => d.specs.network || "").filter(Boolean)),
    ];
    return opts.length > 0 ? opts : ["5G", "4G"];
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
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);

  // Set page title based on active filters or search query
  const filterBrand =
    Array.isArray(filters?.brand) && filters.brand[0] ? filters.brand[0] : null;
  const filterSummary = filterBrand
    ? filterBrand
    : searchQuery
    ? searchQuery
    : null;
  useTitle({
    page: filterSummary ? `Smartphones - ${filterSummary}` : "Smartphones",
  });

  // Extract unique brands from devices
  const brands = [...new Set(devices.map((d) => d.brand).filter(Boolean))];

  const {
    selectDeviceById,
    selectDeviceByModel,
    addToHistory,
    loading,
    filters: contextFilters,
  } = deviceContext || {};
  const navigate = useNavigate();
  const { search } = useLocation();

  // Apply query param filters
  useEffect(() => {
    const params = new URLSearchParams(search);
    const brandParam = params.get("brand");
    const qParam =
      params.get("q") || params.get("query") || params.get("search") || null;
    const sortParam = params.get("sort");

    // Parse price and list params (comma-separated lists supported)
    const rawMin =
      params.get("priceMin") || params.get("minPrice") || params.get("min");
    const rawMax =
      params.get("priceMax") || params.get("maxPrice") || params.get("max");
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

    // Build next filters state using provided params; fall back to current state
    setFilters((prev) => {
      const next = {
        ...prev,
        brand: brandParam ? [brandParam] : prev.brand,
        priceRange: {
          min:
            priceMin !== null && !Number.isNaN(priceMin)
              ? priceMin
              : prev.priceRange.min,
          max:
            priceMax !== null && !Number.isNaN(priceMax)
              ? priceMax
              : prev.priceRange.max,
        },
        ram: ramArr.length ? ramArr : prev.ram,
        network: networkArr.length ? networkArr : prev.network,
        processor: processorArr.length ? processorArr : prev.processor,
        refreshRate: refreshArr.length ? refreshArr : prev.refreshRate,
      };

      // Also sync to device context filters so other components remain consistent
      try {
        deviceContext?.setFilters?.(next);
      } catch {}

      return next;
    });

    if (brandParam) {
      if (sortParam) setSortBy(sortParam);
      else setSortBy("newest");
    }

    if (qParam !== null) {
      setSearchQuery(qParam);
    } else if (sortParam) {
      setSortBy(sortParam);
    }
  }, [search]);

  // Sync filters when DeviceContext provides filters
  // Depend only on `contextFilters` so local changes don't trigger an overwrite.
  useEffect(() => {
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
  }, [contextFilters]);

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
        if (
          prev &&
          prev.priceRange &&
          (Number(prev.priceRange.min) !== MIN_PRICE ||
            Number(prev.priceRange.max) !== MAX_PRICE)
        ) {
          return prev;
        }
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
    const storeName = store?.store ?? store?.store_name ?? null;

    if (device.model) {
      selectDeviceByModel?.(device.model);
    } else {
      selectDeviceById?.(device.id);
    }

    addToHistory?.({ id: device.id, model: device.model, variantId, storeId });

    const params = new URLSearchParams();
    if (identifier) params.set("model", identifier);
    if (variantId) params.set("variantId", String(variantId));
    if (storeId) params.set("storeId", String(storeId));
    if (storeName) params.set("storeName", String(storeName));

    navigate(`/devicedetail/smartphone?${params.toString()}`);
  };

  const handleFilterChange = (filterType, value) => {
    if (filterType === "brand") {
      const current = Array.isArray(filters.brand) ? filters.brand : [];
      const next = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];

      setFilters((prev) => ({ ...prev, brand: next }));

      try {
        const params = new URLSearchParams(search);
        if (next.length > 0) params.set("brand", next[0]);
        else params.delete("brand");
        if (sortBy && sortBy !== "featured") params.set("sort", sortBy);
        else params.delete("sort");
        const qs = params.toString();
        const path = `/devicelist/smartphones${qs ? `?${qs}` : ""}`;
        navigate(path, { replace: true });
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

    setFilters((prev) => {
      const currentArr = Array.isArray(prev[filterType])
        ? prev[filterType]
        : [];
      const nextArr = currentArr.includes(value)
        ? currentArr.filter((item) => item !== value)
        : [...currentArr, value];
      const next = { ...prev, [filterType]: nextArr };
      try {
        deviceContext?.setFilters?.(next);
      } catch {
        // ignore
      }
      return next;
    });
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
      if (value && value !== "featured") params.set("sort", value);
      else params.delete("sort");
      const qs = params.toString();
      const path = `/devicelist/smartphones${qs ? `?${qs}` : ""}`;
      navigate(path, { replace: true });
    } catch {
      // ignore
    }
  };

  // Filter logic (operates on variant-level cards)
  const filteredVariants = variantCards.filter((device) => {
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
        deviceRams.includes(selectedRam)
      );
      if (!hasMatchingRam) return false;
    }

    // Storage filter - check individual values
    if (filters.storage.length > 0) {
      const deviceStorages = device.specs.storage
        ? device.specs.storage.split("/").map((s) => s.trim())
        : [];
      const hasMatchingStorage = filters.storage.some((selectedStorage) =>
        deviceStorages.includes(selectedStorage)
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
          (device.specs.processor || "").toLowerCase().includes(p.toLowerCase())
        );
      if (!hasMatch) return false;
    }

    // Network support filter (5G/4G)
    if (filters.network && filters.network.length > 0) {
      const net = String(
        device.specs.network || device.specs.network || ""
      ).toLowerCase();
      const hasNet = filters.network.some((n) => net.includes(n.toLowerCase()));
      if (!hasNet) return false;
    }

    // Refresh rate filter
    if (filters.refreshRate && filters.refreshRate.length > 0) {
      const rr = String(device.specs.refreshRate || "").toLowerCase();
      const hasRR = filters.refreshRate.some((r) =>
        rr.includes(r.toLowerCase())
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

  const sortedVariants = [...filteredVariants].sort((a, b) => {
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

  const clearFilters = () => {
    const empty = {
      brand: [],
      priceRange: { min: 0, max: MAX_PRICE },
      ram: [],
      storage: [],
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
    try {
      const params = new URLSearchParams(search);
      params.delete("brand");
      params.delete("q");
      params.delete("query");
      params.delete("search");
      if (sortBy && sortBy !== "featured") {
        params.set("sort", sortBy);
      } else {
        params.delete("sort");
      }
      const qs = params.toString();
      const path = `/devicelist/smartphones${qs ? `?${qs}` : ""}`;
      navigate(path, { replace: true });
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Page Header with Descriptive Content */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex-1">
              <h1 className="text-3xl lg:text-4xl font-bold mb-3 flex items-center gap-3">
                <FaMobileAlt className="text-blue-200" />
                Smartphone Directory
              </h1>
              <h6 className="text-blue-100 text-lg mb-4 max-w-3xl">
                Explore our comprehensive collection of smartphones with
                detailed specifications, price comparisons, and expert reviews.
                Find the perfect device that matches your needs and budget.
              </h6>
              <div className="flex flex-wrap gap-3 text-sm">
                <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full">
                  <FaInfoCircle className="text-blue-200" />
                  <span>{devices.length} devices cataloged</span>
                </div>
                <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full">
                  <FaStore className="text-blue-200" />
                  <span>Multiple store comparisons</span>
                </div>
                <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full">
                  <FaStar className="text-yellow-300" />
                  <span>Verified user ratings</span>
                </div>
              </div>
            </div>
            <div className="hidden lg:block text-right">
              <div className="text-blue-200 text-sm mb-2">
                Updated regularly
              </div>
              <div className="text-2xl font-bold">
                Latest Models {new Date().getFullYear()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4 lg:p-6">
        {/* Quick Stats Bar */}

        {/* Control Bar */}
        <div className="mb-8">
          {/* Desktop Search and Sort */}
          <div className="hidden lg:flex items-center justify-between mb-6">
            <div className="flex-1 max-w-2xl">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search smartphones by brand, model, or specifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <span className="text-sm text-gray-500">
                    {filteredVariants.length} results
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <FaFilter className="text-gray-500" />
                <span className="text-sm text-gray-600">Sort by:</span>
              </div>
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white text-gray-700 min-w-[180px]"
              >
                <option value="featured">Featured Devices</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="newest">Newest First</option>
              </select>

              {getActiveFiltersCount() > 0 && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <FaTimes />
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Mobile Search and Filter Bar */}
          <div className="lg:hidden space-y-4 mb-6">
            <div className="relative">
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search smartphones..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 pl-12 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowFilters(true)}
                className="flex items-center justify-center gap-2 flex-1 h-12 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
              >
                <FaFilter />
                Filters
                {getActiveFiltersCount() > 0 && (
                  <span className="bg-white text-blue-600 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {getActiveFiltersCount()}
                  </span>
                )}
              </button>

              <button
                onClick={() => setShowSort(true)}
                className="flex items-center justify-center gap-2 flex-1 h-12 bg-white text-gray-700 px-4 rounded-xl border border-gray-300 hover:bg-gray-50 transition-all duration-300 font-semibold"
              >
                <FaSort />
                Sort
              </button>
            </div>

            {/* Active Filters Badge - Mobile */}
            {getActiveFiltersCount() > 0 && (
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-center gap-3">
                  <FaInfoCircle className="text-blue-600" />
                  <div>
                    <span className="text-sm font-medium text-blue-800">
                      {getActiveFiltersCount()} filter
                      {getActiveFiltersCount() > 1 ? "s" : ""} applied
                    </span>
                    <p className="text-xs text-blue-600 mt-0.5">
                      Showing {filteredVariants.length} of {variantCards.length}{" "}
                      options
                    </p>
                  </div>
                </div>
                <button
                  onClick={clearFilters}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors duration-200"
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
                Available Smartphones
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Browse through our curated selection of smartphones with
                detailed specifications and competitive prices
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
              <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-300">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <FaFilter className="text-blue-500" />
                    Refine Search
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Narrow down devices by specifications
                  </p>
                </div>
                {getActiveFiltersCount() > 0 && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-semibold transition-colors duration-200 px-3 py-1 rounded-lg hover:bg-blue-50"
                  >
                    <FaTimes />
                    Clear all
                  </button>
                )}
              </div>

              {/* Active Filters Badge */}
              {getActiveFiltersCount() > 0 && (
                <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-blue-800">
                      Active Filters
                    </span>
                    <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                      {getActiveFiltersCount()}
                    </span>
                  </div>
                  <p className="text-xs text-blue-600">
                    Refine further or clear to see all devices
                  </p>
                </div>
              )}

              {/* Brand Filter */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
                    <FaStore className="text-blue-500" />
                    Manufacturer Brands
                  </h4>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {filters.brand.length} selected
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Select smartphone brands to compare
                </p>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {brands.map((brand) => (
                    <label
                      key={brand}
                      className="flex items-center gap-3 cursor-pointer group hover:bg-gray-50 px-3 py-2.5 rounded-lg transition-all duration-200 border border-transparent hover:border-gray-200"
                    >
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={filters.brand.includes(brand)}
                          onChange={() => handleFilterChange("brand", brand)}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all duration-200"
                        />
                      </div>
                      <span className="text-gray-700 group-hover:text-gray-900 font-medium flex-1">
                        {brand}
                      </span>
                      <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {devices.filter((d) => d.brand === brand).length}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range Filter */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
                    <FaMoneyBill className="text-green-500" />
                    Price Range
                  </h4>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    ₹{filters.priceRange.min?.toLocaleString()} - ₹
                    {filters.priceRange.max?.toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Set your budget range for smartphone purchase
                </p>

                <div className="bg-gradient-to-b from-gray-50 to-white rounded-xl p-4 border border-gray-200">
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
                      className="absolute h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full top-1/2 transform -translate-y-1/2"
                      style={{
                        left: `${Math.max(
                          0,
                          Math.min(
                            100,
                            ((filters.priceRange.min || 0) / (MAX_PRICE || 1)) *
                              100
                          )
                        )}%`,
                        width: `${Math.max(
                          0,
                          Math.min(
                            100,
                            ((filters.priceRange.max - filters.priceRange.min) /
                              (MAX_PRICE || 1)) *
                              100
                          )
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
                          filters.priceRange.max
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
                          Number(e.target.value)
                        )
                      }
                      className="absolute w-full top-1/2 transform -translate-y-1/2 appearance-none h-4 bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-blue-500 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer"
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
                  <div className="flex justify-center">
                    <button
                      onClick={() => updatePriceRange(MIN_PRICE, MAX_PRICE)}
                      className="text-blue-600 hover:text-blue-700 font-medium px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors duration-200"
                    >
                      Reset Range
                    </button>
                  </div>
                </div>
              </div>

              {/* RAM Filter */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
                    <FaMemory className="text-purple-500" />
                    Memory (RAM)
                  </h4>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {filters.ram.length} selected
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Choose RAM capacity for multitasking performance
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {ramOptions.map((ram) => (
                    <label
                      key={ram}
                      className={`flex items-center justify-center gap-2 cursor-pointer px-3 py-2.5 rounded-xl transition-all duration-200 font-medium ${
                        filters.ram.includes(ram)
                          ? "bg-gradient-to-b from-blue-500 to-purple-600 text-white shadow-lg"
                          : "bg-gray-50 border border-gray-200 text-gray-700 hover:border-gray-300 hover:shadow-sm"
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

              {/* Storage Filter */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
                    <FaMemory className="text-green-500" />
                    Storage Capacity
                  </h4>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {filters.storage.length} selected
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Select internal storage options for apps and media
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {storageOptions.map((storage) => (
                    <label
                      key={storage}
                      className={`flex items-center justify-center gap-2 cursor-pointer px-3 py-2.5 rounded-xl transition-all duration-200 font-medium ${
                        filters.storage.includes(storage)
                          ? "bg-gradient-to-b from-green-500 to-blue-500 text-white shadow-lg"
                          : "bg-gray-50 border border-gray-200 text-gray-700 hover:border-gray-300 hover:shadow-sm"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={filters.storage.includes(storage)}
                        onChange={() => handleFilterChange("storage", storage)}
                        className="sr-only"
                      />
                      <FaShoppingBag className="text-sm" />
                      <span>{storage}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Battery Filter */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
                    <FaBatteryFull className="text-orange-500" />
                    Battery Capacity
                  </h4>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {filters.battery.length} selected
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Filter by battery capacity for longer usage time
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {BATTERY_RANGES.map((r) => {
                    const Icon = r.icon;
                    return (
                      <label
                        key={r.id}
                        className={`flex items-center justify-between gap-2 cursor-pointer px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                          filters.battery.includes(r.id)
                            ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg"
                            : "bg-gray-50 border border-gray-200 text-gray-700 hover:border-gray-300"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={filters.battery.includes(r.id)}
                          onChange={() => handleFilterChange("battery", r.id)}
                          className="sr-only"
                        />
                        <div className="flex items-center gap-3">
                          <Icon className="text-sm" />
                          <span>{r.label}</span>
                        </div>
                        <div
                          className={`w-2 h-2 rounded-full ${
                            filters.battery.includes(r.id)
                              ? "bg-white"
                              : "bg-gray-300"
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
                className="w-full lg:hidden mt-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg"
              >
                Show More Filters
              </button>
            </div>
          </div>

          {/* Products List - Right */}
          <div className="flex-1">
            {/* Results Summary */}
            <div className="mb-6 p-4 bg-gradient-to-r from-white to-blue-50 rounded-xl border border-blue-100">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">
                    Smartphone Results
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Found {sortedVariants.length} option
                    {sortedVariants.length !== 1 ? "s" : ""} matching your
                    criteria
                    {sortedVariants.length > 0 &&
                      " - sorted by " +
                        (sortBy === "price-low"
                          ? "lowest price"
                          : sortBy === "price-high"
                          ? "highest price"
                          : sortBy === "rating"
                          ? "user rating"
                          : sortBy === "newest"
                          ? "release date"
                          : "featured devices")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="hidden sm:block text-sm text-gray-500">
                    {sortedVariants.length} options
                  </div>
                  <button
                    onClick={() =>
                      window.scrollTo({ top: 0, behavior: "smooth" })
                    }
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors duration-200"
                  >
                    Back to top
                  </button>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sortedVariants.map((device, _idx) => (
                <div
                  key={`${device.id ?? device.model ?? ""}-${_idx}`}
                  className={`bg-white  shadow-sm rounded-sm border border-gray-100 hover:border-blue-50 transition-all duration-300 overflow-hidden`}
                >
                  {/* Mobile Optimized Card Layout */}
                  <div className="p-4 pt-6">
                    {/* Top Row: Image and Basic Info */}
                    <div className="flex gap-4">
                      {/* Product Image - Fixed container */}
                      <div className="flex-shrink-0 w-32 h-32 bg-gray-50 rounded-lg overflow-hidden">
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageCarousel images={device.images} />
                        </div>
                      </div>

                      {/* Basic Info */}
                      <div className="flex-1 min-w-0">
                        {/* Brand and Model */}
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                {device.brand}
                              </span>
                              {device.specs.network && (
                                <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded">
                                  {device.specs.network}
                                </span>
                              )}
                            </div>
                            <h3 className="font-bold text-gray-900 text-sm line-clamp-2">
                              {device.name}
                            </h3>
                          </div>
                          {/* Details always expanded - removed toggle button */}
                        </div>

                        {/* Price and Rating */}
                        <div className="mb-3">
                          <div className="flex items-center justify-between">
                            <div className="text-lg font-bold text-green-600">
                              {device.price}
                            </div>
                            <div className="flex items-center gap-1">
                              <FaStar className="text-yellow-500 text-sm" />
                              <span className="font-bold text-gray-900 text-sm">
                                {device.rating}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Key Specs Badges */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {device.specs.processor && (
                            <div className="flex items-center gap-1 text-xs bg-gray-50 px-2 py-1 rounded">
                              <FaMicrochip className="text-gray-500" />
                              <span className="font-medium text-gray-700">
                                {device.specs.processor.split(" ")[0]}
                              </span>
                            </div>
                          )}
                          {device.specs.ram && (
                            <div className="flex items-center gap-1 text-xs bg-gray-50 px-2 py-1 rounded">
                              <FaMemory className="text-gray-500" />
                              <span className="font-medium text-gray-700">
                                {device.specs.ram.split("/")[0]}
                              </span>
                            </div>
                          )}
                          {device.specs.camera && (
                            <div className="flex items-center gap-1 text-xs bg-gray-50 px-2 py-1 rounded">
                              <FaCamera className="text-gray-500" />
                              <span className="font-medium text-gray-700">
                                {device.specs.camera.split("+")[0]}
                              </span>
                            </div>
                          )}
                          {device.specs.battery && (
                            <div className="flex items-center gap-1 text-xs bg-gray-50 px-2 py-1 rounded">
                              <FaBatteryFull className="text-gray-500" />
                              <span className="font-medium text-gray-700">
                                {device.specs.battery}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Expanded Details */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      {/* Detailed Specifications */}
                      <div className="mb-4">
                        <h4 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2">
                          <FaInfoCircle className="text-blue-500" />
                          Device Specifications
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="text-xs">
                            <div className="text-gray-500">Display</div>
                            <div className="font-medium text-gray-900">
                              {device.specs.display || "N/A"}
                            </div>
                          </div>
                          <div className="text-xs">
                            <div className="text-gray-500">Storage</div>
                            <div className="font-medium text-gray-900">
                              {device.specs.storage || "N/A"}
                            </div>
                          </div>
                          <div className="text-xs">
                            <div className="text-gray-500">OS Version</div>
                            <div className="font-medium text-gray-900">
                              {device.specs.os || "N/A"}
                            </div>
                          </div>
                          <div className="text-xs">
                            <div className="text-gray-500">Refresh Rate</div>
                            <div className="font-medium text-gray-900">
                              {device.specs.refreshRate || "N/A"}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Store Availability */}
                      {device.storePrices && device.storePrices.length > 0 && (
                        <div className="mb-4">
                          <h4 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2">
                            <FaStore className="text-green-500" />
                            Available At
                          </h4>
                          <div className="space-y-2">
                            {device.storePrices
                              .slice(0, 3)
                              .map((storePrice, i) => {
                                const logoSrc =
                                  STORE_LOGOS[
                                    (storePrice.store || "").toLowerCase()
                                  ];
                                return (
                                  <div
                                    key={`${
                                      device.id ?? device.model ?? ""
                                    }-store-${i}`}
                                    className="flex items-center justify-between text-sm bg-gray-50 px-3 py-2 rounded-lg"
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

                      {/* Launch Date */}
                      {device.launchDate && (
                        <div className="flex items-center gap-2 text-xs text-gray-600 mb-4">
                          <FaCalendarAlt className="text-gray-400" />
                          <span>
                            Released:{" "}
                            {new Date(device.launchDate).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              }
                            )}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={(e) => handleView(device, e)}
                        className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2.5 rounded-lg text-sm font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-sm"
                      >
                        <FaEye className="text-sm" />
                        View Details
                        <FaExternalLinkAlt className="text-xs opacity-80" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          try {
                            const idOrModel = encodeURIComponent(
                              device.id ?? device.model
                            );
                            navigate(`/compare?add=${idOrModel}`);
                          } catch (err) {
                            console.error("Navigation error:", err);
                          }
                        }}
                        className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white py-2.5 rounded-lg text-sm font-semibold hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-sm"
                      >
                        <FaFilter className="text-sm" />
                        Compare
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* No Results State */}
            {sortedVariants.length === 0 && (
              <div className="text-center py-16 bg-gradient-to-b from-white to-gray-50 border border-gray-200 rounded-xl shadow-sm">
                <div className="max-w-md mx-auto">
                  <FaSearch className="text-gray-300 text-5xl mx-auto mb-4" />
                  <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                    No smartphones found
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Try adjusting your filters or search terms to find what
                    you're looking for. We have a wide range of devices
                    available.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={clearFilters}
                      className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg"
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
                <div className="mt-4 text-center text-xs text-gray-500">
                  <p>
                    Prices and availability are subject to change. Always verify
                    details with the respective stores before making a purchase.
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

            <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl transform transition-transform duration-300 max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
                <div className="flex items-center gap-3">
                  <FaFilter className="text-blue-600 text-xl" />
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

              <div className="p-6 overflow-y-auto max-h-[70vh] pb-40 space-y-6">
                {/* Brand Filter (mobile) */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
                      <FaStore className="text-blue-500" />
                      Manufacturer Brands
                    </h4>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {filters.brand.length} selected
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mb-3">
                    Select smartphone brands to compare
                  </div>
                  <div className="space-y-2">
                    {brands.map((brand) => (
                      <label
                        key={brand}
                        className="flex items-center gap-3 cursor-pointer group hover:bg-gray-50 px-3 py-2.5 rounded-lg transition-all duration-200 border border-transparent hover:border-gray-200"
                      >
                        <input
                          type="checkbox"
                          checked={filters.brand.includes(brand)}
                          onChange={() => handleFilterChange("brand", brand)}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                        />
                        <span className="text-gray-700 font-medium">
                          {brand}
                        </span>
                        <div className="ml-auto text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {devices.filter((d) => d.brand === brand).length}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Price Range (mobile) */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
                      <FaMoneyBill className="text-green-500" />
                      Price Range
                    </h4>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      ₹{filters.priceRange.min?.toLocaleString()} - ₹
                      {filters.priceRange.max?.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mb-3">
                    Set your budget range for smartphone purchase
                  </div>
                  <div className="bg-gradient-to-b from-gray-50 to-white rounded-xl p-4 border border-gray-200">
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
                        className="absolute h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full top-1/2 transform -translate-y-1/2"
                        style={{
                          left: `${Math.max(
                            0,
                            Math.min(
                              100,
                              ((filters.priceRange.min || 0) /
                                (MAX_PRICE || 1)) *
                                100
                            )
                          )}%`,
                          width: `${Math.max(
                            0,
                            Math.min(
                              100,
                              ((filters.priceRange.max -
                                filters.priceRange.min) /
                                (MAX_PRICE || 1)) *
                                100
                            )
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
                            filters.priceRange.max
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
                            Number(e.target.value)
                          )
                        }
                        className="absolute w-full top-1/2 transform -translate-y-1/2 appearance-none h-4 bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-blue-500 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer"
                      />

                      <div className="flex justify-between items-center text-xs mb-2">
                        <span className="text-gray-500">
                          ₹{MIN_PRICE.toLocaleString()}
                        </span>
                        <span className="text-gray-500">
                          ₹{MAX_PRICE.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-center">
                        <button
                          onClick={() => updatePriceRange(MIN_PRICE, MAX_PRICE)}
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
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
                      <FaMemory className="text-purple-500" /> Memory (RAM)
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
                            ? "bg-gradient-to-b from-blue-500 to-purple-600 text-white shadow-lg"
                            : "bg-gray-50 border border-gray-200 text-gray-700 hover:border-gray-300 hover:shadow-sm"
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
                            ? "bg-gradient-to-b from-green-500 to-blue-500 text-white shadow-lg"
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
                              ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg"
                              : "bg-gray-50 border border-gray-200 text-gray-700 hover:border-gray-300"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={filters.battery.includes(r.id)}
                            onChange={() => handleFilterChange("battery", r.id)}
                            className="sr-only"
                          />
                          <div className="flex items-center gap-3">
                            <Icon className="text-sm" />
                            <span>{r.label}</span>
                          </div>
                          <div
                            className={`${
                              filters.battery.includes(r.id)
                                ? "bg-white"
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
                            onChange={() => handleFilterChange("processor", p)}
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
                            onChange={() => handleFilterChange("network", n)}
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

                  <div>
                    <h5 className="font-semibold text-gray-800 mb-2">Camera</h5>
                    <div className="space-y-2">
                      {cameraOptions.map((c) => (
                        <label
                          key={c}
                          className="flex items-center gap-3 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={filters.camera.includes(c)}
                            onChange={() => handleFilterChange("camera", c)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">{c}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              {/* ... [Filter content from original] ... */}

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
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg"
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
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 lg:p-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Need help choosing?
              </h3>
              <p className="text-gray-600 mb-4 lg:mb-0">
                Use our comparison tool to side-by-side compare up to 4
                smartphones and make an informed decision based on your specific
                requirements.
              </p>
            </div>
            <button
              onClick={() => navigate("/compare")}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg whitespace-nowrap"
            >
              Open Comparison Tool
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Smartphonelist;
