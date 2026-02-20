// src/components/DeviceList.jsx
import React, { useState, useEffect, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import {
  FaStar,
  FaBatteryFull,
  FaMemory,
  FaSignal,
  FaSyncAlt,
  FaFingerprint,
  FaWifi,
  FaShieldAlt,
  FaRobot,
  FaTachometerAlt,
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
  FaExchangeAlt,
} from "react-icons/fa";
import { useDevice } from "../../hooks/useDevice";
import {
  useNavigate,
  useLocation,
  useSearchParams,
  useParams,
} from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  fetchSmartphones,
  fetchTrendingSmartphones,
  fetchNewLaunchSmartphones,
} from "../../store/deviceSlice";
import Brandofmonth from "../Home/Brandofmonth";
import ProductNav from "../Home/Products";
import useStoreLogos from "../../hooks/useStoreLogos";
import Spinner from "../ui/Spinner";
import Breadcrumbs from "../Breadcrumbs";
import { generateSlug } from "../../utils/slugGenerator";
import normalizeProduct from "../../utils/normalizeProduct";
import { getHookBadge } from "../../utils/hookScore";
import {
  computePopularSmartphoneFeatures,
  SMARTPHONE_FEATURE_CATALOG,
} from "../../utils/smartphonePopularFeatures";

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
      <div className="relative w-full h-full flex items-center justify-center rounded-lg bg-white">
        <div className="text-center px-3">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-gray-200">
            <FaMobileAlt className="text-gray-400 text-sm" />
          </div>
          <span className="text-xs text-gray-500">No image</span>
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

const Smartphones = () => {
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
  const { smartphone, smartphoneAll } = deviceContext || {};
  const [params] = useSearchParams();
  const filter = params.get("filter");
  const feature = params.get("feature");
  const normalizedFeature = feature
    ? feature.toString().toLowerCase().replace(/\s+/g, "-")
    : null;

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

  const smartphonesForList = useMemo(() => {
    if (filter === "trending" || filter === "new") {
      return Array.isArray(smartphone) ? smartphone : [];
    }
    return phonesForFeatureList;
  }, [filter, smartphone, phonesForFeatureList]);
  const dispatch = useDispatch();

  useEffect(() => {
    if (filter === "trending") dispatch(fetchTrendingSmartphones());
    else if (filter === "new") dispatch(fetchNewLaunchSmartphones());
    else if (!smartphoneAll || smartphoneAll.length === 0)
      dispatch(fetchSmartphones());
  }, [filter, dispatch, smartphoneAll ? smartphoneAll.length : 0]);

  // When query filters change (feature / list filters), scroll back to top so the
  // user immediately sees the updated cards.
  useEffect(() => {
    try {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      // ignore scroll errors (SSR / old browsers)
    }
  }, [feature, filter]);

  const { getLogo, getStore, getStoreLogo } = useStoreLogos();

  // Helper function to extract numeric price
  const extractNumericPrice = (price) => {
    if (!price || price === "NaN") return 0;
    const numeric = parseInt(String(price).replace(/[^0-9]/g, ""));
    return isNaN(numeric) ? 0 : numeric;
  };

  // Helper function to format price display
  const formatPriceDisplay = (price) => {
    if (!price || price === "NaN") return "";
    if (typeof price === "string" && price.includes(",")) return `₹${price}`;
    const numeric = extractNumericPrice(price);
    return numeric > 0 ? `₹ ${numeric.toLocaleString()}` : "";
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
                id: sp.id,
                variant_id: v.id,
                store: storeName,
                storeObj: getStore ? getStore(storeName) : null,
                // do not persist logo here — resolve at render time via getLogo()
                price: sp.price,
                url: sp.url || sp.url_link || sp.link,
                last_updated: sp.last_updated || sp.lastUpdated,
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
            id: sp.id,
            store: storeName,
            storeObj: getStore ? getStore(storeName) : null,
            // resolve logo at render time via getLogo(storeName)
            price: sp.price,
            url: sp.url,
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
      "";
    const numericBattery = parseInt(
      String(batteryRaw).replace(/[^0-9]/g, "") || "0",
    );

    // Refresh rate
    const refreshRate =
      apiDevice.display?.refresh_rate || apiDevice.display?.refreshRate || "";

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

    // Network support (5G / 4G) — keep this human-readable for filters/UI
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
          "";

    const variantRams = variants.length
      ? [...new Set(variants.map((v) => v.ram).filter(Boolean))]
      : [];
    const ramStr =
      variantRams.length > 0
        ? variantRams.join(" / ")
        : apiDevice.performance?.ram || "";

    // build safe display string
    const displayStr =
      typeof apiDevice.display === "string"
        ? apiDevice.display
        : `${apiDevice.display?.size || ""} ${apiDevice.display?.type || ""}`.trim();

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
          "display",
          "brand",
        ];
        for (const k of common) {
          if (v[k]) return String(v[k]).trim();
        }
        try {
          const s = JSON.stringify(v);
          return s === "{}" ? "" : s;
        } catch {
          return "";
        }
      }
      return "";
    };

    const processorCandidate = pick(
      toString(apiDevice.processor),
      toString(apiDevice.cpu),
      toString(apiDevice.performance?.processor),
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

    return {
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
      hook_score: toNumber(apiDevice.hook_score ?? apiDevice.hookScore),
      buyer_intent: toNumber(apiDevice.buyer_intent ?? apiDevice.buyerIntent),
      trend_velocity: toNumber(
        apiDevice.trend_velocity ?? apiDevice.trendVelocity,
      ),
      freshness: toNumber(apiDevice.freshness),
      hook_calculated_at:
        apiDevice.hook_calculated_at ?? apiDevice.hookCalculatedAt ?? null,
      price: numericPrice > 0 ? `₹${numericPrice.toLocaleString()}` : "",
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
    };
  };

  // Transform API data to devices array
  const devices = (smartphonesForList || []).map((device, i) =>
    mapApiToDevice(device, i),
  );

  // Aggregate all variants across smartphones (supports variants array or singular variant)
  const allVariants = (smartphonesForList || []).flatMap((s) =>
    Array.isArray(s?.variants) ? s.variants : [],
  );

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

    return vars.map((v, variantIndex) => {
      // map store prices for this variant (if any)
      const rawVariantStorePrices = Array.isArray(v.store_prices)
        ? v.store_prices
        : [];
      // Map variant-level store prices (keep original price strings)
      const mappedVariantStores = rawVariantStorePrices.map((sp) => {
        const storeName = sp.store_name || sp.store || sp.storeName || "Store";
        return {
          id: sp.id,
          store: storeName,
          storeObj: getStore ? getStore(storeName) : null,
          // leave logo resolution to render-time via getLogo(store)
          price: sp.price,
          url: sp.url,
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
          ? `₹${resolvedNumericPrice.toLocaleString()}`
          : "";

      // Store prices to expose on card: prefer mappedVariantStores when available, else an empty list
      const storePricesToExpose =
        mappedVariantStores.length > 0 ? mappedVariantStores : [];

      // RAM and Storage must come from variant (per requirement)
      const variantRam = v.ram || v.RAM || "";
      const variantStorage =
        v.storage || v.storage_capacity || v.ROM || v.rom || "";

      // Card title in strict format: {device name} | {variant RAM} / {variant Storage} | {price or N/A}
      const cardTitle = `${device.name || device.model || "Unnamed"} | ${variantRam || ""} / ${variantStorage || ""} | ${priceDisplay}`;

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
        cardTitle,
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
  const [compareItems, setCompareItems] = useState([]);
  const MAX_COMPARE_ITEMS = 4;

  // Brand-based SEO helper
  const filterBrand =
    Array.isArray(filters?.brand) && filters.brand[0] ? filters.brand[0] : null;
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
        const slug =
          br.slug || name.toString().toLowerCase().replace(/\s+/g, "-");
        const idMatches =
          typeof br.id === "number"
            ? asNumber !== null && br.id === asNumber
            : typeof br.id === "string"
              ? br.id === b || norm(br.id) === norm(b)
              : false;
        return idMatches || slug === norm(b) || norm(name) === norm(b);
      }) || null
    );
  })();

  // Extract unique brands from devices
  const brands = [...new Set(devices.map((d) => d.brand).filter(Boolean))];
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
  const navigate = useNavigate();
  const location = useLocation();
  const { filterSlug } = useParams();
  const { search } = location;
  const pathname = String(location?.pathname || "").toLowerCase();
  const isSingleSmartphonePath = pathname === "/smartphone";
  const isNewFilterPath = pathname === "/smartphones" && filter === "new";
  const currentYear = new Date().getFullYear();
  const normalizedFilterSlug = String(filterSlug || "")
    .trim()
    .toLowerCase();

  const priceFilterMap = {
    "under-10000": { min: 0, max: 10000, label: "Under ₹10,000" },
    "under-15000": { min: 0, max: 15000, label: "Under ₹15,000" },
    "under-20000": { min: 0, max: 20000, label: "Under ₹20,000" },
    "under-25000": { min: 0, max: 25000, label: "Under ₹25,000" },
    "under-30000": { min: 0, max: 30000, label: "Under ₹30,000" },
    "under-40000": { min: 0, max: 40000, label: "Under ₹40,000" },
    "under-50000": { min: 0, max: 50000, label: "Under ₹50,000" },
    "above-50000": { min: 50000, max: MAX_PRICE, label: "Above ₹50,000" },
  };
  const priceFilter = priceFilterMap[normalizedFilterSlug] || null;

  const sanitizeDescription = (desc = "") => {
    const text = String(desc || "")
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim();
    return text.length > 180 ? `${text.slice(0, 177)}...` : text;
  };

  let seoTitle = `Smartphones ${currentYear} - Specs, Prices & Reviews | Hook`;
  let seoDescription = sanitizeDescription(
    "Browse the latest smartphones with detailed specs, prices, reviews, and comparisons on Hook.",
  );

  if (isSingleSmartphonePath) {
    seoTitle = `Smartphones ${currentYear} - Compare Specs, Prices & Reviews | Hook`;
    seoDescription =
      "Compare the latest smartphones on Hook. Explore detailed specifications, prices, reviews, and side-by-side comparisons before you buy.";
  } else if (isNewFilterPath) {
    seoTitle = `Latest Smartphones ${currentYear} - New Launches & Prices | Hook`;
    seoDescription =
      "Discover newly launched smartphones with updated prices, full specifications, and reviews. Stay updated with the latest mobile releases on Hook.";
  } else if (priceFilter) {
    seoTitle = `Best Smartphones ${priceFilter.label} in ${currentYear} - Reviews, Specs & Deals | Hook`;
    seoDescription = `Explore the best smartphones ${priceFilter.label.toLowerCase()} with detailed specs, latest prices, reviews, and comparisons to choose the right phone for your budget.`;
  } else if (currentBrandObj) {
    seoTitle = `${currentBrandObj.name} Smartphones ${currentYear} - Models, Prices & Specs | Hook`;
    seoDescription = sanitizeDescription(
      currentBrandObj.description ||
        `Explore ${currentBrandObj.name} smartphones on Hook. Compare models, check prices, specifications, reviews, and find the best phone for your needs.`,
    );
  }

  // Heading label: prefer new launches, then price-filtered collection
  const isNewLaunchHeading =
    (location &&
      String(location.pathname || "")
        .toLowerCase()
        .includes("newlaunch")) ||
    (params && params.get("filter") === "new");
  const headerLabel = isNewLaunchHeading
    ? "LATEST COLLECTION"
    : priceFilter
      ? `BEST SMARTPHONE ${priceFilter.label.toUpperCase()}`
      : "SMARTPHONE COLLECTION";

  // Defer render check until after all hooks are declared to keep hook order stable
  const noDataAndNotLoading =
    (!smartphonesForList ||
      (Array.isArray(smartphonesForList) && smartphonesForList.length === 0)) &&
    !loading;

  // Apply query param filters
  useEffect(() => {
    const params = new URLSearchParams(search);
    const brandParam = params.get("brand");
    const qParam =
      params.get("q") || params.get("query") || params.get("search") || null;
    const sortParam = params.get("sort");

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
          const slug =
            c.slug ||
            (name || "").toString().toLowerCase().replace(/\s+/g, "-");
          if (
            slug === paramStr.toString().toLowerCase() ||
            (name || "").toString().toLowerCase() ===
              paramStr.toString().toLowerCase()
          ) {
            return name || paramStr;
          }
        }
      } catch {}

      // Fallback: convert slug-like strings to capitalized words (e.g. "samsung-galaxy" -> "Samsung Galaxy")
      if (paramStr.includes("-")) {
        return paramStr
          .split("-")
          .map((s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s))
          .join(" ");
      }

      return paramStr;
    };

    // Build next filters state using provided params; fall back to current state
    setFilters((prev) => {
      const resolvedBrand = brandParam ? resolveBrandName(brandParam) : null;
      const next = {
        ...prev,
        brand: resolvedBrand ? [resolvedBrand] : prev.brand,
        priceRange: {
          min:
            priceFilter?.min ??
            (priceMin !== null && !Number.isNaN(priceMin)
              ? priceMin
              : prev.priceRange.min),
          max:
            priceFilter?.max ??
            (priceMax !== null && !Number.isNaN(priceMax)
              ? priceMax
              : prev.priceRange.max),
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
  }, [search, normalizedFilterSlug]);

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

    // Generate SEO-friendly slug-based URL
    const productSlug = generateSlug(device.model || device.name || device.id);
    const params = new URLSearchParams();
    if (variantId) params.set("variantId", String(variantId));
    if (storeId) params.set("storeId", String(storeId));
    if (storeName) params.set("storeName", String(storeName));

    navigate(
      `/smartphones/${productSlug}${
        params.toString() ? "?" + params.toString() : ""
      }`,
    );
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
        if (prev.length >= MAX_COMPARE_ITEMS) return prev;
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
        const params = new URLSearchParams(search);
        if (next.length > 0) params.set("brand", next[0]);
        else params.delete("brand");
        if (sortBy && sortBy !== "featured") params.set("sort", sortBy);
        else params.delete("sort");
        const qs = params.toString();
        const path = `/smartphones${qs ? `?${qs}` : ""}`;
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
      const path = `/smartphones${qs ? `?${qs}` : ""}`;
      navigate(path, { replace: true });
    } catch {
      // ignore
    }
  };

  // Filter logic (operates on variant-level cards) - memoized so it updates
  // when device data, filters, searchQuery or feature change.
  const filteredVariants = React.useMemo(() => {
    // Do not attempt to apply feature filters while data is loading —
    // wait for server response to avoid empty results on first render.
    if (loading) return [];

    // When asking for new launches, prefer devices with a parseable
    // launch date that is not in the future and sort them newest-first.
    let baseCards = variantCards;
    if (filter === "new") {
      const today = new Date();
      const parseDate = (s) => {
        if (!s) return null;
        const d = new Date(s);
        return Number.isNaN(d.getTime()) ? null : d;
      };

      baseCards = variantCards
        .filter((d) => {
          const ld = parseDate(d.launchDate || d.launch_date || d.launch_date);
          return ld && ld <= today;
        })
        .sort((a, b) => {
          const da = parseDate(a.launchDate) || new Date(0);
          const db = parseDate(b.launchDate) || new Date(0);
          return db - da;
        });
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
  }, [variantCards, filters, searchQuery, feature]);

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
    setBrandFilterQuery("");
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

  if (noDataAndNotLoading) return null;

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
    const sp = new URLSearchParams(location.search || "");
    if (featureId) trackFeatureClick(featureId);
    if (featureId) sp.set("feature", featureId);
    else sp.delete("feature");
    // Feature selection should win over "trending/new" list filters
    sp.delete("filter");
    const next = sp.toString();
    navigate(`/smartphones${next ? `?${next}` : ""}`);
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
      {/* Page Header with Descriptive Content */}

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-4 sm:p-6 md:p-8 lg:p-10 bg-white">
        {/* Hero Section - Professional Styling */}
        <div className="mb-6 sm:mb-8 md:mb-10 lg:mb-12">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-purple-50 backdrop-blur-sm px-3 py-1.5 rounded-full border border-purple-100 mb-4 sm:mb-6">
            <FaMobileAlt className="text-purple-600 text-sm" />
            <span className="text-xs sm:text-sm font-semibold text-purple-800">
              {headerLabel}
            </span>
          </div>

          {/* Main Heading - Gradient Text */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-4xl xl:text-5xl font-bold mb-2 sm:mb-3 md:mb-4 lg:mb-6 leading-tight">
            Explore Premium{" "}
            <span className="bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600 bg-clip-text text-transparent">
              Smartphones
            </span>
          </h1>

          {/* Subtitle */}
          <h4 className="text-base sm:text-lg md:text-lg lg:text-xl mb-4 sm:mb-6 md:mb-8 text-gray-700 leading-relaxed max-w-3xl">
            Discover detailed specifications, compare models, and find the best
            deals on the latest smartphones. Use our advanced filters to narrow
            down your search from our curated collection of premium devices.
          </h4>
        </div>

        {/* Feature Quick Filters */}
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
        {/* Quick Stats Bar */}

        {/* Control Bar */}
        <div className="mb-6 sm:mb-7 md:mb-8">
          {/* Desktop Search and Sort */}
          <div className="hidden lg:flex items-center justify-between mb-4 md:mb-5 lg:mb-6">
            <div className="flex-1 max-w-2xl">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FaSearch className="text-purple-500 group-focus-within:text-purple-600 transition-colors duration-200" />
                </div>
                <input
                  type="text"
                  placeholder="Search smartphones by brand, model, or specifications..."
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
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-colors"
                >
                  <FaTimes />
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Mobile Search and Filter Bar */}
          <div className="lg:hidden space-y-3 sm:space-y-4 mb-4 sm:mb-5 md:mb-6">
            <div className="relative group">
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-500 group-focus-within:text-purple-600 transition-colors duration-200" />
              <input
                type="text"
                placeholder="Search smartphones..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 pl-12 pr-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-100 focus:border-purple-500 text-gray-700 transition-all duration-200 placeholder:text-gray-400"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowFilters(true)}
                className="flex items-center justify-center gap-2 flex-1 h-12 bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600 text-white px-4 rounded-xl   transition-all duration-300 font-semibold"
              >
                <FaFilter />
                Filters
                {getActiveFiltersCount() > 0 && (
                  <span className="  text-purple-200 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
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
          <div className="flex items-center justify-between mb-4 sm:mb-5 md:mb-6">
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

        <div className="flex flex-col lg:flex-row gap-4 sm:gap-5 md:gap-6">
          {/* Desktop Filter Sidebar */}
          <div className="hidden lg:block lg:w-80 flex-shrink-0">
            <div className="p-4 md:p-5 lg:p-6 sticky top-6">
              {/* Filters Header */}
              <div
                className="flex justify-between items-center mb-6 sm:mb-7 md:mb-8 pb-3 sm:pb-4
           border-b border-indigo-100 px-2 sm:px-3 md:px-4"
              >
                <div>
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    Refine Search
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Narrow down devices by specifications
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
                <div className="mb-4 sm:mb-5 md:mb-6 p-3 sm:p-4 bg-gradient-to-r from-purple-100 to-blue-50 rounded-xl border border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-purple-800">
                      Active Filters
                    </span>
                    <span className="text-xs font-bold text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                      {getActiveFiltersCount()}
                    </span>
                  </div>
                  <p className="text-xs text-purple-600">
                    Refine further or clear to see all devices
                  </p>
                </div>
              )}

              {/* Brand Filter */}
              <div className="mb-6 sm:mb-7 md:mb-8">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-bold text-gray-900 text-base">
                      Brands
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      Select devices by manufacturer
                    </p>
                  </div>
                  <span className="text-xs font-bold text-purple-600 bg-purple-100 px-2.5 py-1.5 rounded-full">
                    {filters.brand.length}
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
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={filters.brand.includes(brand)}
                          onChange={() => handleFilterChange("brand", brand)}
                          className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-2 focus:ring-purple-500 focus:ring-offset-1 transition-all duration-200"
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
                  {filteredBrandOptions.length === 0 && (
                    <div className="text-sm text-gray-500 px-2 py-1">
                      No brands found
                    </div>
                  )}
                </div>
              </div>

              {/* Price Range Filter */}
              <div className="mb-6 sm:mb-7 md:mb-8">
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
                  <div className="flex justify-center">
                    <button
                      onClick={() => updatePriceRange(MIN_PRICE, MAX_PRICE)}
                      className="text-purple-600 hover:text-purple-700 font-medium px-3 py-1.5 rounded-lg hover:bg-purple-50 transition-colors duration-200"
                    >
                      Reset Range
                    </button>
                  </div>
                </div>
              </div>

              {/* RAM Filter */}
              <div className="mb-6 sm:mb-7 md:mb-8">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-bold text-gray-900 text-base">
                      Memory (RAM)
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      Multitasking performance
                    </p>
                  </div>
                  <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2.5 py-1.5 rounded-full">
                    {filters.ram.length}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {ramOptions.map((ram) => (
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
              <div className="mb-6 sm:mb-7 md:mb-8">
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
                  {storageOptions.map((storage) => (
                    <label
                      key={storage}
                      className={`flex items-center justify-center gap-2 cursor-pointer px-3 py-2.5 rounded-xl transition-all duration-200 font-medium ${
                        filters.storage.includes(storage)
                          ? "bg-gradient-to-b from-purple-200 to-blue-200 text-blue-500  "
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

              {/* Battery Filter */}
              <div className="mb-6 sm:mb-7 md:mb-8">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-bold text-gray-900 text-base">
                      Battery Capacity
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      Usage time and endurance
                    </p>
                  </div>
                  <span className="text-xs font-bold text-purple-600 bg-purple-100 px-2.5 py-1.5 rounded-full">
                    {filters.battery.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {BATTERY_RANGES.map((r) => {
                    return (
                      <label
                        key={r.id}
                        className={`flex items-center justify-between gap-2 cursor-pointer px-4 py-3 rounded-xl transition-all duration-300 font-medium ${
                          filters.battery.includes(r.id)
                            ? "bg-gradient-to-r from-purple-200 to-blue-200 text-blue-500 "
                            : "bg-gradient-to-br from-purple-50 to-blue-50 border border-b border-indigo-100 text-gray-700 hover:border-gray-300"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={filters.battery.includes(r.id)}
                          onChange={() => handleFilterChange("battery", r.id)}
                          className="sr-only"
                        />
                        <span>{r.label}</span>
                        <div
                          className={`w-2 h-2 rounded-full ${
                            filters.battery.includes(r.id) ? " " : "bg-gray-300"
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
                className="w-full lg:hidden mt-6 bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600 text-white py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-blue-600 transition-all duration-300 hover:shadow-lg"
              >
                Show More Filters
              </button>
            </div>
          </div>

          {/* Products List - Right */}
          <div className="flex-1">
            {/* Results Summary */}

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6 auto-rows-fr md:[&>*:nth-child(2n)]:border-l md:[&>*:nth-child(2n)]:border-gray-200 md:[&>*:nth-child(2n)]:pl-6 md:[&>*:nth-child(2n+1)]:pr-6">
              {sortedVariants.map((device, _idx) => (
                <div
                  key={`${device.id ?? device.model ?? ""}-${_idx}`}
                  onClick={(e) => handleView(device, e)}
                  className={`h-full smooth-transition fade-in-up overflow-hidden rounded-2xl bg-white cursor-pointer transition-all duration-200 md:rounded-none md:bg-white ${
                    isCompareSelected(device)
                      ? "ring-2 ring-purple-300 bg-purple-50"
                      : ""
                  }`}
                >
                  {/* Mobile Optimized Card Layout */}
                  <div className="p-3 sm:p-4 md:p-5 lg:p-4 pt-4 sm:pt-5 md:pt-6 transition-all duration-300">
                    {/* Top Row: Image and Basic Info */}
                    <div className="grid grid-cols-[minmax(0,8.5rem)_minmax(0,1fr)] sm:grid-cols-[minmax(0,9rem)_minmax(0,1fr)] gap-3 w-full items-start">
                      {/* Product Image - Fixed container with checkbox overlay */}
                      <div className="relative flex-shrink-0 w-full h-36 sm:h-48 rounded-2xl overflow-hidden group bg-white">
                        <div className="w-full h-full flex items-center justify-center p-1.5 sm:p-2">
                          <ImageCarousel images={device.images} />
                        </div>
                        {/* Compare Checkbox Overlay - Top Right */}
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute top-2 right-2 z-10 rounded-md  transition-all duration-200 cursor-pointer hover:bg-gray-50 hover:border-purple-500"
                          title={
                            !isCompareSelected(device) &&
                            compareItems.length >= MAX_COMPARE_ITEMS
                              ? `You can compare up to ${MAX_COMPARE_ITEMS} devices`
                              : "Add to compare"
                          }
                        >
                          <input
                            type="checkbox"
                            checked={isCompareSelected(device)}
                            disabled={
                              !isCompareSelected(device) &&
                              compareItems.length >= MAX_COMPARE_ITEMS
                            }
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleCompareToggle(device, e);
                            }}
                            className={`w-3 h-3 m-1 accent-purple-600 ${
                              !isCompareSelected(device) &&
                              compareItems.length >= MAX_COMPARE_ITEMS
                                ? "cursor-not-allowed opacity-60"
                                : "cursor-pointer"
                            }`}
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
                              {device.specs?.isAiPhone ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-purple-50 to-blue-100 px-2 py-0.5 text-[10px] font-semibold text-purple-700 ring-1 ring-purple-200 whitespace-nowrap">
                                  <span
                                    className="inline-flex items-center justify-center w-3 h-3"
                                    aria-hidden="true"
                                  >
                                    <svg
                                      viewBox="0 0 64 64"
                                      className="w-3 h-3"
                                    >
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
                              {(() => {
                                const badge = getHookBadge(device);
                                if (!badge) return null;
                                return (
                                  <span
                                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 whitespace-nowrap ${badge.className}`}
                                    title={badge.title}
                                  >
                                    {badge.label}
                                  </span>
                                );
                              })()}
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
                                  device.specs?.display ?? "",
                                ).trim();
                                const processor = String(
                                  device.specs?.processor ?? "",
                                ).trim();
                                const rearCameraMp = getRearCameraMp(device);
                                const rearCameraRaw = String(
                                  device.specs?.rearCameraResolution ?? "",
                                ).trim();
                                const batteryMah = getBatteryMah(device);
                                const batteryRaw = String(
                                  device.specs?.battery ?? "",
                                ).trim();

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
                                if (rearCameraMp) {
                                  parts.push(`${rearCameraMp} MP Camera`);
                                } else if (rearCameraRaw) {
                                  parts.push(
                                    /camera/i.test(rearCameraRaw)
                                      ? rearCameraRaw
                                      : `${rearCameraRaw} Camera`,
                                  );
                                }
                                if (batteryMah) {
                                  parts.push(`${batteryMah} mAh Battery`);
                                } else if (batteryRaw) {
                                  parts.push(
                                    /battery/i.test(batteryRaw)
                                      ? batteryRaw
                                      : `${batteryRaw} Battery`,
                                  );
                                }
                                if (display) parts.push(display);
                                if (processor) parts.push(processor);

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
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                          {/* Details always expanded - removed toggle button */}
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
                              <div className="text-lg font-bold text-green-600">
                                {device.price}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Expanded Details */}
                    <div className="mt-3 sm:mt-4 md:mt-5 pt-3 sm:pt-4 md:pt-5 border-t border-indigo-100">
                      {/* Detailed Specifications */}

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
                                    key={`${
                                      device.id ?? device.model ?? ""
                                    }-store-${i}`}
                                    className="flex items-center justify-between text-sm bg-gradient-to-br from-purple-50 to-blue-50 px-3 py-2 rounded-lg"
                                  >
                                    <div className="flex items-center gap-2">
                                      {logoSrc ? (
                                        <img
                                          src={logoSrc}
                                          alt={
                                            storeObj?.name || storePrice.store
                                          }
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
                      {compareItems.length} devices selected
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
              className="absolute inset-0 bg-black bg-opacity-50 transition-all duration-300"
              onClick={() => setShowSort(false)}
            ></div>

            <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl transform transition-all duration-300 max-h-[70vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200  ">
                <div className="flex items-center gap-3">
                  <FaSort className="text-purple-600 text-xl" />
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

              <div className="flex-1 p-6 overflow-y-auto space-y-6">
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
                      className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                      ₹{filters.priceRange.min?.toLocaleString()} - ₹
                      {filters.priceRange.max?.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mb-3">
                    Set your budget range for smartphone purchase
                  </div>
                  <div className="bg-gradient-to-r from-purple-50 via-blue-50 purple-50 to-white rounded-xl p-4 border border-gray-200">
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
                  <div className="flex items-center justify-between mb-3 ">
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
                            ? "bg-gradient-to-b from-blue-600 via-purple-500 to-blue-600 text-white  "
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
                            ? "bg-gradient-to-b from-blue-600 via-purple-500 to-blue-600 text-white  "
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
                              ? "bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600 text-white  "
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
                </div>
              </div>
              {/* ... [Filter content from original] ... */}

              {/* Apply Button */}
              <div className="border-t border-gray-200 p-6 bg-white mt-auto shrink-0">
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowFilters(false)}
                    className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-xl font-semibold hover:bg-gray-200 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="flex-1 bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600 text-white py-4 rounded-xl font-semibold hover:from-purple-600 hover:to-blue-600 transition-all duration-200  "
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
                Use our comparison tool to side-by-side compare up to 4
                smartphones and make an informed decision based on your specific
                requirements.
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

export default Smartphones;
