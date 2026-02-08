// src/components/MobileDetailCard.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import PopularComparisons from "../Home/Brandshowcase";
import { useDevice } from "../../hooks/useDevice";
import Cookies from "js-cookie";

import useTitle from "../../hooks/useTitle";
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
  FaShoppingCart,
  FaBalanceScale,
  FaChevronRight,
  FaStore,
  FaChevronLeft,
  FaChevronDown,
  FaExternalLinkAlt,
  FaTag,
  FaCopy,
  FaCheck,
  FaShareAlt,
  FaInfoCircle,
  FaWhatsapp,
  FaFacebook,
  FaTwitter,
  FaLink,
  FaEnvelope,
} from "react-icons/fa";
import useStoreLogos from "../../hooks/useStoreLogos";
import "../../styles/hideScrollbar.css";
import Spinner from "../ui/Spinner";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { smartphoneMeta } from "../../constants/meta";
import { generateSlug, extractNameFromSlug } from "../../utils/slugGenerator";

const token = Cookies.get("arenak");

const MobileDetailCard = () => {
  const [activeTab, setActiveTab] = useState("specifications");
  const [activeImage, setActiveImage] = useState(0);
  const [showAllSpecs, setShowAllSpecs] = useState(false);
  const [showAllStores, setShowAllStores] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [activeStoreId, setActiveStoreId] = useState(null);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const {
    selectedDevice,
    fetchDevice,
    loading,
    error,
    smartphone,
    refreshDevices,
  } = useDevice();
  const navigate = useNavigate();

  const params = useParams();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const model = query.get("model");
  let id = query.get("id");
  const variantQuery = query.get("variantId") || query.get("variant_id");
  const storeQuery = query.get("storeId") || query.get("store_id");
  const ramParam = query.get("ram");
  const storageParam = query.get("storage");
  const storeNameParam = query.get("storeName") || query.get("store");

  // Extract slug from route params (SEO-friendly slug-based URL)
  const routeSlug = params.slug || null;

  // Convert slug to searchable model name
  const modelFromSlug = routeSlug ? extractNameFromSlug(routeSlug) : null;
  const searchModel = model || modelFromSlug;

  // Try to find device locally by slug match first
  const findDeviceBySlug = useCallback(
    (slug) => {
      if (!slug || !smartphone) return null;
      const searchSlug = generateSlug(slug);
      return (Array.isArray(smartphone) ? smartphone : [smartphone]).find(
        (d) => generateSlug(d.name || d.model || "") === searchSlug,
      );
    },
    [smartphone],
  );
  useEffect(() => {
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
  }, [id, routeSlug, searchModel, fetchDevice, findDeviceBySlug, smartphone]);

  // Update URL to match canonical slug-based path if needed
  useEffect(() => {
    const mobileDataLocal = selectedDevice?.smartphones?.[0] || selectedDevice;
    if (!mobileDataLocal || !routeSlug) return;

    const canonicalSlug = generateSlug(
      mobileDataLocal.name ||
        mobileDataLocal.model ||
        mobileDataLocal.brand ||
        "",
    );

    // If current slug doesn't match canonical slug, replace URL with canonical one
    if (canonicalSlug && routeSlug !== canonicalSlug) {
      const desiredPath = `/smartphones/${canonicalSlug}`;
      const currentPath = window.location.pathname;
      if (currentPath !== desiredPath) {
        navigate(desiredPath + (location.search || ""), { replace: true });
      }
    }
  }, [selectedDevice, routeSlug, navigate, location.search]);

  // Prefer a locally-resolved device (by slug) before falling back to
  // `selectedDevice` which may have been set via other flows.
  const localResolved = routeSlug ? findDeviceBySlug(routeSlug) : null;
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

  const normalizeSmartphone = (d) => {
    if (!d) return null;
    const out = { ...d };

    out.id = d.product_id ?? d.id ?? d._id ?? null;
    out.brand = d.brand_name ?? d.brand ?? d.manufacturer ?? "";
    out.name = d.name ?? d.model ?? d.title ?? "";
    out.model = d.model ?? d.name ?? out.name;
    out.images = d.images ?? d.photos ?? d.images_urls ?? [];

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
    const tryParseMP = (val) => {
      if (!val) return null;
      const m =
        String(val).match(/(\d{1,4})(?=\s*MP|MP| megapixel|MP\b)/i) ||
        String(val).match(/(\d{1,4})\s*MP/i) ||
        String(val).match(/(\d{1,4})/);
      return m ? parseInt(m[1], 10) : null;
    };

    // Try common camera locations (clone camera object before mutating)
    const camSrc = d.camera || out.camera || {};
    const cam = { ...camSrc };
    const rearMain =
      d.camera?.rear_camera?.main ||
      d.camera?.rear_camera ||
      d.camera?.main ||
      d.camera;
    cam.main_camera_megapixels =
      cam.main_camera_megapixels ||
      tryParseMP(
        rearMain?.resolution ||
          rearMain?.resolution_mp ||
          rearMain?.megapixels ||
          rearMain?.sensor ||
          rearMain,
      );
    out.camera = cam;

    // Normalize battery capacity in mAh (clone to avoid mutating originals)
    const battSrc = d.battery || out.battery || {};
    const batt = { ...battSrc };
    const capRaw =
      d.battery?.capacity ||
      d.battery?.battery_capacity ||
      d.battery?.capacity_mAh ||
      d.battery;
    if (capRaw && !batt.battery_capacity_mah) {
      const m = String(capRaw).match(/(\d{3,5})/);
      batt.battery_capacity_mah = m ? parseInt(m[1], 10) : null;
      batt.capacity = d.battery?.capacity ?? d.battery;
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
              : batt.capacity || "",
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

    return out;
  };

  const mobileData = normalizeSmartphone(
    localResolved || selectedDevice?.smartphones?.[0] || selectedDevice,
  );

  useTitle({
    brand: mobileData?.brand,
    name: mobileData?.name,
  });

  useEffect(() => {
    if (error) console.error("Device fetch error:", error);
  }, [error]);

  // While fetching, show spinner to avoid null access to `mobileData`
  const showInitialLoading = loading && !mobileData;

  const variants =
    mobileData?.variants ?? (mobileData?.variant ? [mobileData.variant] : []);

  useEffect(() => {
    if (selectedVariant >= variants.length) setSelectedVariant(0);
  }, [variants, selectedVariant]);

  useEffect(() => {
    if (!variants || variants.length === 0) return;
    if (variantQuery) {
      const idx = variants.findIndex(
        (v) =>
          String(v.variant_id ?? v.id ?? v.variantId) === String(variantQuery),
      );
      if (idx >= 0) setSelectedVariant(idx);
    }
    // If ram/storage params provided, prefer matching variant
    if ((ramParam || storageParam) && variants.length > 0) {
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
      if (idx >= 0) setSelectedVariant(idx);
    }

    if (storeQuery) {
      setActiveStoreId(String(storeQuery));
    }

    // If store name provided, try to find store id from variant stores
    if (storeNameParam && variants.length > 0 && !storeQuery) {
      for (let i = 0; i < variants.length; i++) {
        const v = variants[i];
        const sp = (v.store_prices || []).find(
          (s) =>
            String(s.store_name || s.store).toLowerCase() ===
            String(storeNameParam).toLowerCase(),
        );
        if (sp) {
          setSelectedVariant(i);
          setActiveStoreId(String(sp.id || sp.store_id || sp.storeId));
          break;
        }
      }
    }
  }, [variants, variantQuery, storeQuery]);

  const currentVariant = variants?.[selectedVariant];
  const currentProductId =
    mobileData?.id ?? mobileData?.product_id ?? mobileData?.productId ?? null;

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
      const otherId =
        other?.id ?? other?.product_id ?? other?.productId ?? null;
      if (!currentProductId || !otherId) return;
      navigate(`/compare?devices=${currentProductId}:0,${otherId}:0`, {
        state: { initialProduct: mobileData },
      });
    },
    [navigate, currentProductId, mobileData],
  );

  const allStorePrices =
    variants.flatMap(
      (variant) =>
        variant.store_prices?.map((store) => ({
          ...store,
          variantName: `${variant.ram} ${variant.storage} ${variant.color_name}`,
          variantRam: variant.ram,
          variantStorage: variant.storage,
          variantColor: variant.color_name,
        })) || [],
    ) || [];

  const variantStorePrices =
    currentVariant?.store_prices?.map((sp) => ({
      ...sp,
      variantName: `${currentVariant.ram} ${currentVariant.storage} ${currentVariant.color_name}`,
      variantRam: currentVariant.ram,
      variantStorage: currentVariant.storage,
      variantColor: currentVariant.color_name,
    })) || [];

  const { getLogo } = useStoreLogos();

  const formatPrice = (price) => {
    if (price == null || price === "") return "N/A";
    const str = String(price);
    const numericPrice = parseInt(str.replace(/[^0-9]/g, "")) || 0;
    return new Intl.NumberFormat("en-IN").format(numericPrice);
  };

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
    if (value === true) return "✓ Yes";
    if (value === false) return "✗ No";
    return String(value);
  };

  const isPrimitive = (v) =>
    v == null || (typeof v !== "object" && typeof v !== "function");

  // Build descriptive title for visible heading and meta title (exclude brand)
  const buildDescriptiveTitle = (data, variant) => {
    if (!data) return "";

    const model = data.name || data.model || "";

    const processorRaw =
      variant?.processor || data.performance?.processor || data.processor || "";
    const processor =
      !isPrimitive(processorRaw) || processorRaw === ""
        ? ""
        : formatSpecValue(processorRaw, "processor")
            .replace(/\s+/g, " ")
            .trim();

    // 👉 Format RAM properly (ignore non-primitive inputs)
    const ramRaw = variant?.ram || data.performance?.ram || "";
    const ram =
      !isPrimitive(ramRaw) || ramRaw === ""
        ? ""
        : String(ramRaw).toUpperCase().includes("GB")
          ? `${ramRaw} RAM`
          : `${ramRaw}GB RAM`;

    // 👉 Format Storage properly (ignore non-primitive inputs)
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

    // 👉 Camera formatting — treat structured/object camera specs as empty
    const cameraMPValue = data.camera?.main_camera_megapixels;
    const cameraRaw = data.camera?.main_camera || data.camera || "";
    const camera = cameraMPValue
      ? `${cameraMPValue}MP Camera`
      : !isPrimitive(cameraRaw) || cameraRaw === ""
        ? ""
        : formatSpecValue(cameraRaw, "camera");

    // 👉 Battery formatting (ignore non-primitive inputs)
    const batteryValue = data.battery?.battery_capacity_mah;
    const batteryRaw = data.battery?.capacity || "";
    const battery = batteryValue
      ? `${batteryValue}mAh Battery`
      : !isPrimitive(batteryRaw) || batteryRaw === ""
        ? ""
        : formatSpecValue(batteryRaw, "battery");

    const primary = model || data.name || "";

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
    const name = data.name || data.model || "";

    const processorRaw =
      variant?.processor || data.performance?.processor || data.processor || "";
    const processor =
      !isPrimitive(processorRaw) || processorRaw === ""
        ? ""
        : formatSpecValue(processorRaw, "processor")
            .replace(/\s+/g, " ")
            .trim();

    const ramRaw = variant?.ram || data.performance?.ram || "";
    const ram =
      !isPrimitive(ramRaw) || ramRaw === ""
        ? ""
        : String(ramRaw).toUpperCase().includes("GB")
          ? ramRaw
          : `${ramRaw}GB`;

    const storageRaw =
      variant?.storage ||
      data.performance?.storage ||
      data.performance?.ROM_storage ||
      "";
    const storage =
      !isPrimitive(storageRaw) || storageRaw === ""
        ? ""
        : String(storageRaw).toUpperCase().includes("GB")
          ? storageRaw
          : `${storageRaw}GB`;

    const cameraValue = data.camera?.main_camera_megapixels;
    const cameraRaw = data.camera?.main_camera || data.camera || "";
    const camera =
      cameraValue != null
        ? `${cameraValue}MP`
        : !isPrimitive(cameraRaw) || cameraRaw === ""
          ? ""
          : formatSpecValue(cameraRaw, "camera").trim();

    const batteryValue = data.battery?.battery_capacity_mah;
    const batteryRaw = data.battery?.capacity || "";
    const battery =
      batteryValue != null
        ? `${batteryValue}mAh`
        : !isPrimitive(batteryRaw) || batteryRaw === ""
          ? ""
          : formatSpecValue(batteryRaw, "battery").trim();

    const displayRaw = data.display?.size || data.display || "";
    const display =
      !isPrimitive(displayRaw) || displayRaw === ""
        ? ""
        : String(displayRaw).replace(/"/g, "").trim();

    const priceText =
      variant?.base_price != null
        ? `Price starts at ₹${formatPrice(variant.base_price)}`
        : "";

    const highlights = [
      processor && `Processor: ${processor}`,
      camera && `${camera} Camera`,
      battery && `${battery} Battery`,
      display && `${display}" Display`,
      ram && `${ram} RAM`,
      storage && `${storage} Storage`,
    ].filter(Boolean);

    const identity = [brand, name].filter(Boolean).join(" ").trim();
    if (!identity) return "";
    const highlightText = highlights.length
      ? ` — ${highlights.slice(0, 4).join(" · ")}`
      : "";
    const priceSuffix = priceText ? `. ${priceText}.` : ".";

    return `${identity}${highlightText}${priceSuffix} Compare prices, variants, and detailed specs on Hook.`;
  };

  const sortedVariantStores = variantStorePrices.slice().sort((a, b) => {
    const priceA =
      parseInt(String(a?.price ?? "").replace(/[^0-9]/g, "")) || Infinity;
    const priceB =
      parseInt(String(b?.price ?? "").replace(/[^0-9]/g, "")) || Infinity;
    return priceA - priceB;
  });

  // All stores across variants, sorted by numeric price (ascending)
  const sortedStores = allStorePrices.slice().sort((a, b) => {
    const priceA =
      parseInt(String(a?.price ?? "").replace(/[^0-9]/g, "")) || Infinity;
    const priceB =
      parseInt(String(b?.price ?? "").replace(/[^0-9]/g, "")) || Infinity;
    return priceA - priceB;
  });

  const displayedStores = showAllStores
    ? sortedStores
    : sortedVariantStores.slice(0, 3);

  // Share functionality
  const shareData = {
    title: `${mobileData?.brand} ${mobileData?.model}`,
    text: `Check out ${mobileData?.brand} ${mobileData?.model} - ${
      mobileData?.performance?.processor
    }, ${mobileData?.camera?.main_camera_megapixels || ""}MP Camera, ${
      mobileData?.battery?.battery_capacity_mah || ""
    }mAh Battery. Price starts at ₹${
      currentVariant?.base_price
        ? formatPrice(currentVariant.base_price)
        : "N/A"
    }`,
    url: window.location.href,
  };

  // Generate detailed share content with product information
  const generateShareContent = () => {
    const brand = mobileData?.brand || mobileData?.manufacturer || "Device";
    const model = mobileData?.model || mobileData?.name || "Unknown";
    const processor =
      mobileData?.performance?.processor ||
      mobileData?.processor ||
      mobileData?.cpu ||
      mobileData?.specs?.processor ||
      "Processor info not available";
    const camera =
      mobileData?.camera?.main_camera_megapixels ||
      mobileData?.camera?.main ||
      mobileData?.mainCamera ||
      mobileData?.specs?.camera ||
      "Camera info not available";
    const battery =
      mobileData?.battery?.battery_capacity_mah ||
      mobileData?.battery?.capacity ||
      mobileData?.batteryCapacity ||
      mobileData?.specs?.battery ||
      "Battery info not available";
    const price = currentVariant?.base_price
      ? `₹${formatPrice(currentVariant.base_price)}`
      : "Price not available";
    const display =
      mobileData?.display?.size ||
      mobileData?.display ||
      mobileData?.specs?.display ||
      "Display info not available";

    return {
      title: `${brand} ${model}`,
      description: `${processor}  ${camera}MP Camera | ${battery}mAh Battery | ${display}" Display | Price: ${price}`,
      shortDescription: `${brand} ${model} - ${processor}, ${camera}MP, ${battery}mAh, Price: ${price}`,
      fullDetails: `
${brand} ${model}
processor: ${processor}
Camera: ${camera}MP
Battery: ${battery}mAh
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

  const getCanonicalUrl = () => {
    try {
      const slug = generateSlug(mobileData?.name || mobileData?.model || "");
      if (!slug) return window.location.href;
      const path = `/smartphones/${slug}`;
      return window.location.origin + path + (location.search || "");
    } catch (e) {
      return window.location.href;
    }
  };
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
    // Build a shareable URL that includes product id so the receiving page
    // can fetch/display the product. We keep the canonical slug path and
    // append the `id` and `shared=1` params.
    try {
      const base = getCanonicalUrl();
      const shareUrl = new URL(base);
      const productId = mobileData?.id || mobileData?.model || "";
      if (productId) shareUrl.searchParams.set("id", String(productId));
      shareUrl.searchParams.set("shared", "1");

      const urlStr = shareUrl.toString();
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
        alert("Link copied to clipboard — paste to share");
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

  // copy link functionality removed — share-only flow

  const shareToWhatsApp = () => {
    const base = getCanonicalUrl();
    const shareUrl = new URL(base);
    const productId = mobileData?.id || mobileData?.model || "";
    if (productId) shareUrl.searchParams.set("id", String(productId));
    shareUrl.searchParams.set("shared", "1");
    const urlToShare = shareUrl.toString();
    const content = generateShareContent();
    const message = `${content.fullDetails}\n\n🔗 Check it out: ${urlToShare}`;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  const shareToFacebook = () => {
    const base = getCanonicalUrl();
    const shareUrl = new URL(base);
    const productId = mobileData?.id || mobileData?.model || "";
    if (productId) shareUrl.searchParams.set("id", String(productId));
    shareUrl.searchParams.set("shared", "1");
    const urlToShare = shareUrl.toString();
    // Facebook uses Open Graph tags, so just share the URL with description
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      urlToShare,
    )}`;
    window.open(url, "_blank");
  };

  const shareToTwitter = () => {
    const base = getCanonicalUrl();
    const shareUrl = new URL(base);
    const productId = mobileData?.id || mobileData?.model || "";
    if (productId) shareUrl.searchParams.set("id", String(productId));
    shareUrl.searchParams.set("shared", "1");
    const urlToShare = shareUrl.toString();
    const content = generateShareContent();
    const tweet = `Check out: ${content.title}\n${content.shortDescription}\n\n#Smartphones #Tech`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      tweet,
    )}&url=${encodeURIComponent(urlToShare)}`;
    window.open(url, "_blank");
  };

  const shareViaEmail = () => {
    const base = getCanonicalUrl();
    const shareUrl = new URL(base);
    const productId = mobileData?.id || mobileData?.model || "";
    if (productId) shareUrl.searchParams.set("id", String(productId));
    shareUrl.searchParams.set("shared", "1");
    const urlToShare = shareUrl.toString();
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
    if (data == null) return false;
    if (typeof data === "object") {
      const entries = Object.entries(data).filter(
        ([_, value]) => value !== "" && value != null && value !== false,
      );
      return entries.length > 0;
    }
    return String(data).trim() !== "";
  };

  // Map tab ids to the fields we consider for presence checks
  const filterTabByData = (tabId) => {
    switch (tabId) {
      case "specifications":
        return [
          mobileData?.brand,
          mobileData?.model,
          mobileData?.category,
          mobileData?.performance,
          mobileData?.display,
          mobileData?.camera,
          mobileData?.battery,
        ].some((v) => hasContent(v));
      case "display":
        return hasContent(mobileData?.display);
      case "performance":
        return hasContent(mobileData?.performance);
      case "camera":
        return hasContent(mobileData?.camera);
      case "battery":
        return hasContent(mobileData?.battery);
      case "build_design":
        return hasContent(mobileData?.build_design);
      case "connectivity":
        return (
          hasContent(mobileData?.connectivity_network) ||
          hasContent(mobileData?.ports)
        );
      case "multimedia":
        return (
          hasContent(mobileData?.audio) || hasContent(mobileData?.multimedia)
        );
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
        // subsection not present — activate the tab normally
        setActiveTab(tabId);
      }
    });
  };

  const renderSpecItems = (data, limit = 5) => {
    if (!data || typeof data !== "object") {
      return (
        <div className="text-center py-4 text-gray-500">No data available</div>
      );
    }
    const entries = Object.entries(data).filter(
      ([key, value]) =>
        value !== "" &&
        value != null &&
        value !== false &&
        key !== "sphere_rating",
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
                  className="flex justify-between items-center py-3 px-4 bg-gradient-to-r from-purple-600 to-transparent rounded-lg border border-slate-100 hover:border-purple-200 hover:shadow-sm transition-all duration-200"
                >
                  <span className="text-gray-700 font-semibold text-sm flex-1">
                    {toNormalCase(key)}
                  </span>
                  <span className="text-gray-900 font-bold text-sm text-right flex-1 break-words text-purple-600">
                    {formatSpecValue(value, key)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {groupedEntries.map(([gkey, group]) => {
            const subEntries = Object.entries(group).filter(
              ([_, v]) => v !== "" && v != null && v !== false,
            );
            if (subEntries.length === 0) return null;
            return (
              <div
                key={gkey}
                className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl p-4 border border-purple-100 shadow-sm"
              >
                <h4 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide text-purple-900">
                  {toNormalCase(gkey)}
                </h4>
                <div className="space-y-2">
                  {subEntries.map(([skey, sval]) => (
                    <div
                      key={skey}
                      className="flex justify-between items-center py-2 px-3 bg-white/60 rounded-lg hover:bg-white/80 transition-all"
                    >
                      <span className="text-gray-700 text-sm flex-1 font-medium">
                        {toNormalCase(skey)}
                      </span>
                      <span className="text-gray-900 font-semibold text-sm text-right flex-1 break-words text-purple-600">
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
              className="flex justify-between items-center py-3 px-4 bg-gradient-to-r from-purple-600 to-transparent rounded-lg border border-slate-100 hover:border-purple-300 hover:shadow-md hover:bg-purple-50/30 transition-all duration-200"
            >
              <span className="text-gray-700 font-semibold text-sm flex-1">
                {toNormalCase(key)}
              </span>
              <span className="text-gray-900 font-bold text-sm text-right flex-1 break-words text-purple-600">
                {formatSpecValue(value, key)}
              </span>
            </div>
          ))}
        </div>
        {entries.length > limit && (
          <button
            onClick={() => setShowAllSpecs(!showAllSpecs)}
            className="w-full mt-4 py-3 px-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-600 hover:to-blue-600 text-white font-bold text-sm rounded-lg flex items-center justify-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg"
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
    if (!camera)
      return (
        <div className="text-center py-4 text-gray-500">
          No camera data available
        </div>
      );

    const rows = [];

    if (camera.main_camera_megapixels) {
      rows.push(["Main Camera", `${camera.main_camera_megapixels} MP`]);
    }

    // Rear camera can be an object with lenses or a string
    if (camera.rear_camera) {
      if (
        typeof camera.rear_camera === "object" &&
        !Array.isArray(camera.rear_camera)
      ) {
        Object.entries(camera.rear_camera).forEach(([lens, spec]) => {
          rows.push([toNormalCase(lens), formatSpecValue(spec, lens)]);
        });
      } else {
        rows.push([
          "Rear Camera",
          formatSpecValue(camera.rear_camera, "rear_camera"),
        ]);
      }
    }

    // Front camera
    if (camera.front_camera) {
      const frontVal =
        typeof camera.front_camera === "object"
          ? Object.entries(camera.front_camera)
              .map(([k, v]) => `${toNormalCase(k)}: ${formatSpecValue(v, k)}`)
              .join(" | ")
          : String(camera.front_camera);
      rows.push(["Front Camera", frontVal]);
    }

    // Shooting modes / features
    if (camera.shooting_modes) {
      rows.push([
        "Shooting Modes",
        formatSpecValue(camera.shooting_modes, "shooting_modes"),
      ]);
    }

    if (Array.isArray(camera.features) && camera.features.length) {
      rows.push(["Features", camera.features.join(", ")]);
    }

    if (Array.isArray(camera.ai_features) && camera.ai_features.length) {
      rows.push(["AI Features", camera.ai_features.join(", ")]);
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <tbody className="bg-white">
            {rows.map(([label, value], idx) => (
              <tr
                key={idx}
                className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
              >
                <td className="px-6 py-3 text-sm font-medium text-gray-600 w-1/3 align-top">
                  {label}
                </td>
                <td className="px-6 py-3 text-sm text-gray-900 w-2/3">
                  {value || "Not specified"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderSpecTable = (data) => {
    if (!data || (typeof data === "object" && Object.keys(data).length === 0))
      return (
        <div className="text-center py-4 text-gray-500">No data available</div>
      );

    const entries = Object.entries(data).filter(
      ([k]) => k !== "sphere_rating" && !/ai[_-]?features?/i.test(k),
    );

    return (
      <div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <tbody className="bg-white">
              {entries.map(([key, value], idx) => (
                <tr
                  key={key}
                  className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  <td className="px-6 py-3 text-sm font-medium text-gray-600 w-1/3 align-top">
                    {toNormalCase(key)}
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-900 w-2/3">
                    {formatSpecValue(value, key)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Display-specific renderer — fallback to generic spec table when possible
  const renderDisplayTable = (display) => {
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
    return renderSpecTable(d);
  };

  const renderTabContent = () => {
    if (!mobileData) return null;

    switch (activeTab) {
      case "specifications":
        return (
          <div id="spec-specifications" className="space-y-6">
            {/* Key Specs Highlight Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                {
                  label: "Processor",
                  value: mobileData.performance?.processor || "N/A",
                  icon: FaMicrochip,
                  color: "bg-purple-50 text-purple-700",
                },
                {
                  label: "RAM",
                  value: mobileData.performance?.ram || "N/A",
                  icon: FaMemory,
                  color: "bg-purple-50 text-purple-700",
                },
                {
                  label: "Storage",
                  value:
                    mobileData.performance?.storage ||
                    mobileData.performance?.ROM_storage ||
                    "N/A",
                  icon: FaMobile,
                  color: "bg-green-50 text-green-700",
                },
                {
                  label: "Battery",
                  value: mobileData.battery?.battery_capacity_mah
                    ? `${mobileData.battery.battery_capacity_mah} mAh`
                    : mobileData.battery?.capacity || "N/A",
                  icon: FaBatteryFull,
                  color: "bg-blue-50 text-blue-700",
                },
              ].map((spec, idx) => (
                <div
                  key={idx}
                  className={`${spec.color} p-4`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <spec.icon className="text-lg" />
                    <span className="text-xs font-semibold uppercase tracking-wide">
                      {spec.label}
                    </span>
                  </div>
                  <div className="text-sm font-bold truncate">{spec.value}</div>
                </div>
              ))}
            </div>

            {/* Main Specs Table - Professional Layout */}
            <div className="bg-white overflow-hidden">
              {/* Brand & Model Header */}
              <div className="border-b border-gray-200"></div>

              {/* Specs Sections */}
              <div className="divide-y divide-gray-100">
                {/* General Section */}
                <div
                  id="spec-general"
                  className="px-1 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4"
                >
                  <h4 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide">
                    General
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100">
                      <tbody className="bg-white">
                        {[
                          { label: "Brand", value: mobileData.brand },
                          { label: "Model", value: mobileData.model },
                          { label: "Segment", value: mobileData.category },
                          {
                            label: "Release Date",
                            value: mobileData.launch_date
                              ? new Date(
                                  mobileData.launch_date,
                                ).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                })
                              : "N/A",
                          },
                          {
                            label: "Operating System",
                            value:
                              mobileData.performance?.operating_system ||
                              mobileData.performance?.os ||
                              "N/A",
                          },
                          {
                            label: "Custom UI",
                            value: mobileData.ui || "Stock",
                          },
                          {
                            label: "Colors",
                            value: Array.isArray(mobileData.colors)
                              ? mobileData.colors.join(", ")
                              : mobileData.build_design?.colors || "N/A",
                          },
                          {
                            label: "Sim Type",
                            value:
                              mobileData.network?.sim_type ||
                              mobileData.sim ||
                              "Dual Sim",
                          },
                          {
                            label: "Weight",
                            value: mobileData.build_design?.weight
                              ? `${mobileData.build_design.weight} g`
                              : "N/A",
                          },
                        ]
                          .filter(
                            (it) =>
                              it.value !== undefined &&
                              it.value !== null &&
                              it.value !== "",
                          )
                          .map((item, idx) => (
                            <tr
                              key={idx}
                              className={
                                idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                              }
                            >
                              <td className="px-6 py-2 text-sm font-medium text-gray-600 w-1/3 align-top">
                                {item.label}
                              </td>
                              <td className="px-6 py-2 text-sm text-gray-900 w-2/3">
                                {formatSpecValue(item.value, item.label)}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Display Section */}
                {hasContent(mobileData.display) && (
                  <div
                    id="spec-display"
                    className="px-1 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4"
                  >
                    <h4 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                      <FaExpand className="text-purple-500" />
                      Display
                    </h4>

                    {renderDisplayTable(mobileData.display)}
                  </div>
                )}

                {/* Performance Section */}
                {hasContent(mobileData.performance) && (
                  <div
                    id="spec-performance"
                    className="px-1 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4"
                  >
                    <h4 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                      <FaBolt className="text-yellow-500" />
                      Performance
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-100">
                        <tbody className="bg-white">
                          {Object.entries(mobileData.performance || {})
                            .filter(
                              ([k, v]) =>
                                v &&
                                !["sphere_rating", "ai_features"].includes(k),
                            )
                            .map(([key, value], idx) => (
                              <tr
                                key={key}
                                className={
                                  idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                                }
                              >
                                <td className="px-6 py-2 text-sm font-medium text-gray-600 w-1/3 align-top">
                                  {toNormalCase(key)}
                                </td>
                                <td className="px-6 py-2 text-sm text-gray-900 w-2/3">
                                  {formatSpecValue(value, key)}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Camera Section - Using nested object structure */}
                {hasContent(mobileData.camera) && (
                  <div
                    id="spec-camera"
                    className="px-1 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4"
                  >
                    <h4 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                      <FaCamera className="text-purple-500" />
                      Camera
                    </h4>

                    {renderCameraTable(mobileData.camera)}
                  </div>
                )}

                {/* Battery Section */}
                {hasContent(mobileData.battery) && (
                  <div
                    id="spec-battery"
                    className="px-1 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4"
                  >
                    <h4 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                      <FaBatteryFull className="text-green-500" />
                      Battery
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-100">
                        <tbody className="bg-white">
                          {Object.entries(mobileData.battery || {})
                            .filter(
                              ([k, v]) => v && !/ai[_-]?features?/i.test(k),
                            )
                            .map(([key, value], idx) => (
                              <tr
                                key={key}
                                className={
                                  idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                                }
                              >
                                <td className="px-6 py-2 text-sm font-medium text-gray-600 w-1/3 align-top">
                                  {toNormalCase(key)}
                                </td>
                                <td className="px-6 py-2 text-sm text-gray-900 w-2/3">
                                  {key === "battery_capacity_mah"
                                    ? `${value} mAh`
                                    : formatSpecValue(value, key)}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Connectivity Section */}
                {hasContent(mobileData.connectivity) && (
                  <div
                    id="spec-connectivity"
                    className="px-1 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4"
                  >
                    <h4 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                      <FaWifi className="text-purple-500" />
                      Connectivity
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-100">
                        <tbody className="bg-white">
                          {Object.entries(mobileData.connectivity || {})
                            .filter(
                              ([k, v]) => v && !/ai[_-]?features?/i.test(k),
                            )
                            .map(([key, value], idx) => (
                              <tr
                                key={key}
                                className={
                                  idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                                }
                              >
                                <td className="px-6 py-2 text-sm font-medium text-gray-600 w-1/3 align-top">
                                  {toNormalCase(key)}
                                </td>
                                <td className="px-6 py-2 text-sm text-gray-900 w-2/3">
                                  {formatSpecValue(value, key)}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Available colors removed */}
                {/* Price Comparison Call to Action */}
              </div>
            </div>
          </div>
        );

      case "display":
        return (
          <div className="bg-white rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FaExpand className="text-green-500" />
              Display
            </h3>
            {renderSpecTable(mobileData.display)}
          </div>
        );

      case "performance":
        return (
          <div className="bg-white rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FaBolt className="text-yellow-500" />
              Performance
            </h3>
            {renderSpecTable(mobileData.performance)}
          </div>
        );

      case "camera":
        return (
          <div className="bg-white rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FaCamera className="text-purple-500" />
              Camera
            </h3>
            {renderCameraTable(mobileData.camera)}
          </div>
        );

      case "battery":
        return (
          <div className="bg-white rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FaBatteryFull className="text-blue-500" />
              Battery
            </h3>
            {renderSpecTable(mobileData.battery)}
          </div>
        );

      case "connectivity":
        return (
          <div className="bg-white rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FaWifi className="text-purple-500" />
              Connectivity
            </h3>
            {renderSpecTable(
              mobileData.connectivity || mobileData.connectivity_json,
            )}
          </div>
        );

      case "multimedia":
        return (
          <div className="bg-white rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FaFilm className="text-indigo-500" />
              Multimedia
            </h3>
            {renderSpecTable(
              mobileData.multimedia || mobileData.multimedia_json,
            )}
          </div>
        );

      case "build_design":
        return (
          <div className="bg-white rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FaMobile className="text-indigo-500" />
              Build & Design
            </h3>
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

  if (loading && !mobileData) {
    return (
      <div className="max-w-6xl mx-auto p-8">
        <div className="bg-white rounded-lg p-8 text-center">
          <Spinner />
          <div className="text-sm text-gray-500 mt-3">Please wait…</div>
        </div>
      </div>
    );
  }

  if (!loading && !mobileData) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <div className="bg-white rounded-lg p-8 text-center">
          <div className="text-gray-400 text-6xl mb-4">📱</div>
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

  // compute SEO meta values
  const metaName = mobileData?.name || mobileData?.model || "";
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
  const currentDateLabel = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const metaTitle =
    titleWithBrand ||
    smartphoneMeta.title({
      name: metaName,
      ram: metaRam,
      storage: metaStorage,
    });
  const metaTitleWithDate = `${metaTitle} [${currentDateLabel}]`;

  const metaDescription =
    buildMetaDescription(mobileData, currentVariant) ||
    smartphoneMeta.description({
      name: metaName,
      ram: metaRam,
      storage: metaStorage,
      brand: metaBrand,
    });

  const toAbsoluteUrl = (url) => {
    if (!url) return "";
    if (/^https?:\/\//i.test(url)) return url;
    if (typeof window === "undefined") return url;
    const origin = window.location.origin;
    if (!origin) return url;
    return url.startsWith("/") ? `${origin}${url}` : `${origin}/${url}`;
  };

  const canonicalUrl =
    typeof window !== "undefined" ? window.location.href : "";
  const primaryImage = Array.isArray(mobileData?.images)
    ? mobileData.images[0]
    : null;
  const ogImage = toAbsoluteUrl(primaryImage);

  // If initial loading state (no mobileData yet), render spinner now
  if (showInitialLoading) {
    return (
      <div className="max-w-6xl mx-auto p-8">
        <div className="bg-white rounded-lg p-8 text-center">
          <Spinner />
          <div className="text-sm text-gray-500 mt-3">Please wait…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto mb-8">
      <Helmet>
        <title>{metaTitleWithDate}</title>
        <meta name="description" content={metaDescription} />
        <meta property="og:type" content="product" />
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDescription} />
        {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
        {ogImage && <meta property="og:image" content={ogImage} />}
        {ogImage && <meta property="og:image:secure_url" content={ogImage} />}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={metaTitle} />
        <meta name="twitter:description" content={metaDescription} />
        {ogImage && <meta name="twitter:image" content={ogImage} />}
      </Helmet>
      {isSharedLink && (
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 rounded">
            Shared link detected — showing the shared product details.
          </div>
        </div>
      )}
      {/* Share Menu Modal */}
      {showShareMenu && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Share Device
              </h3>
              <button
                onClick={() => setShowShareMenu(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <div className="space-y-3">
              <button
                onClick={shareToWhatsApp}
                className="w-full flex items-center gap-3 p-3 bg-green-50 hover:bg-green-100 rounded-lg text-green-700 font-medium"
              >
                <FaWhatsapp className="text-xl" />
                Share on WhatsApp
              </button>
              <button
                onClick={shareToFacebook}
                className="w-full flex items-center gap-3 p-3 bg-purple-50 hover:bg-purple-100 rounded-lg text-purple-700 font-medium"
              >
                <FaFacebook className="text-xl" />
                Share on Facebook
              </button>
              <button
                onClick={shareToTwitter}
                className="w-full flex items-center gap-3 p-3 bg-purple-50 hover:bg-purple-100 rounded-lg text-purple-400 font-medium"
              >
                <FaTwitter className="text-xl" />
                Share on Twitter
              </button>
              <button
                onClick={shareViaEmail}
                className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-700 font-medium"
              >
                <FaEnvelope className="text-xl" />
                Share via Email
              </button>
              {/* Copy link removed — share-only option provided above */}
            </div>
            <button
              onClick={() => setShowShareMenu(false)}
              className="w-full mt-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="bg-gray-50 overflow-hidden">
        {/* Mobile Header */}
        <div className="p-4 bg-white border-b border-gray-200 lg:hidden">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h1 className="text-xl font-extrabold tracking-tight mb-1 text-gray-900 leading-tight">
                {buildDescriptiveTitle(mobileData, currentVariant)}
              </h1>
              <p className="text-purple-700 text-sm font-medium flex items-center gap-2">
                <span>{mobileData?.model}</span>
                {mobileData?.isAiPhone ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600 px-2 py-0.5 text-[10px] font-semibold text-white ring-1 ring-white/30">
                    <span
                      className="inline-flex items-center justify-center w-3 h-3"
                      aria-hidden="true"
                    >
                      <svg viewBox="0 0 64 64" className="w-3 h-3">
                        <path
                          d="M32 2C34.5 14.5 40 20 52 22C40 24 34.5 29.5 32 42C29.5 29.5 24 24 12 22C24 20 29.5 14.5 32 2Z"
                          fill="#2196F3"
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
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleFavorite}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <FaHeart
                  className={`text-lg ${
                    isFavorite ? "text-blue-500 fill-current" : "text-gray-400"
                  }`}
                />
              </button>
              <button
                onClick={handleShare}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <FaShareAlt className="text-lg text-gray-600" />
              </button>
            </div>
          </div>
          {currentVariant && (
            <span className="text-2xl font-bold text-green-600 mt-3">
              ₹{formatPrice(currentVariant.base_price)}
            </span>
          )}
        </div>

        {/* Popular Comparisons */}
        {popularComparisonTargets.length > 0 && (
          <div className="px-4 pt-4 pb-1">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-gray-900">
                Popular comparisons
              </h2>
              <button
                type="button"
                onClick={() =>
                  navigate("/compare", {
                    state: { initialProduct: mobileData },
                  })
                }
                className="text-xs font-semibold text-purple-700 hover:text-purple-800"
              >
                Open compare
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-3">
              {popularComparisonTargets.map((d) => {
                const otherId = d?.id ?? d?.product_id ?? d?.productId ?? null;
                const otherName = d?.name || d?.model || "Device";
                const otherImg = d?.images?.[0] || d?.image || "";

                return (
                  <button
                    key={String(otherId || otherName)}
                    type="button"
                    onClick={() => handlePopularCompare(d)}
                    className="min-w-[240px] max-w-[280px] flex-shrink-0 rounded-xl border border-gray-200 bg-white p-3 hover:border-purple-200 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center flex-shrink-0">
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
                        <div className="text-[11px] text-gray-500 truncate">
                          Compare with
                        </div>
                        <div className="text-sm font-semibold text-gray-900 truncate">
                          {otherName}
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-purple-700">
                        Compare
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row">
          {/* Images Section */}
          <div className="lg:w-2/5 p-4 border-b lg:border-b-0 lg:border-r border-indigo-200">
            {/* Main Image */}
            <div className="rounded-lg p-6 mb-4 relative">
              <img
                src={
                  mobileData.images?.[activeImage] || "/placeholder-image.jpg"
                }
                alt={mobileData.name}
                className="w-full h-48 object-contain"
                onError={(e) => {
                  e.target.src =
                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='14' fill='%239ca3af'%3ENo Image%3C/text%3E%3C/svg%3E";
                }}
              />
              {/* Action buttons on image */}
              <div className="absolute top-2 right-2 flex flex-col gap-2">
                <button
                  onClick={toggleFavorite}
                  className="p-2 bg-white rounded-full shadow-md hover:shadow-lg"
                >
                  <FaHeart
                    className={`${
                      isFavorite
                        ? "text-blue-500 fill-current"
                        : "text-gray-600"
                    }`}
                  />
                </button>
                <button
                  onClick={handleShare}
                  className="p-2 bg-white rounded-full shadow-md hover:shadow-lg"
                >
                  <FaShare className="text-gray-600" />
                </button>
              </div>
            </div>

            {/* Thumbnails */}
            {mobileData.images && mobileData.images.length > 1 && (
              <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar">
                {mobileData.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveImage(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg p-1 border-1 transition-all duration-200 ${
                      activeImage === index
                        ? "border-purple-500 bg-purple-50"
                        : "border-indigo-100 hover:border-purple-100"
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${mobileData.name} view ${index + 1}`}
                      className="w-full h-full object-contain"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* color section */}

            {/* Variant selection */}

            {/* Share and Copy Link Buttons - Mobile */}
            <div className="lg:hidden flex gap-2 mb-4">
              <button
                onClick={handleShare}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg font-medium"
              >
                <FaShareAlt />
                <span>Share</span>
              </button>
            </div>

            {/* Quick Specs - Mobile Only */}
            <div className="lg:hidden grid grid-cols-3 gap-3 mb-4">
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <FaMicrochip className="text-purple-600 text-lg mx-auto mb-1" />
                <div className="font-bold text-purple-900 text-sm">
                  {mobileData.performance?.processor?.split(" ")[0] || "-"}
                </div>
                <div className="text-xs text-purple-700">Processor</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <FaCamera className="text-green-600 text-lg mx-auto mb-1" />
                <div className="font-bold text-green-900 text-sm">
                  {mobileData.camera?.main_camera_megapixels || "-"} MP
                </div>
                <div className="text-xs text-green-700">Main Camera</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <FaBatteryFull className="text-purple-600 text-lg mx-auto mb-1" />
                <div className="font-bold text-purple-900 text-sm">
                  {mobileData.battery?.battery_capacity_mah || "-"} mAh
                </div>
                <div className="text-xs text-purple-700">Battery</div>
              </div>
            </div>
            {variants && variants.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Available Variants
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {variants.map((variant, index) => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(index)}
                      className={`p-3 rounded-lg border-2 transition-all duration-150 ${
                        selectedVariant === index
                          ? "border-purple-500 bg-purple-50"
                          : "border-purple-200 hover:border-indigo-300"
                      }`}
                    >
                      <div className="text-sm font-semibold text-gray-900">
                        <FaMemory className="text-gray-600 text-lg center" />
                        {variant.ram} / {variant.storage}
                      </div>
                      <div className="text-sm font-bold text-green-600">
                        ₹{formatPrice(variant.base_price)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Details Section - Right Side */}
          <div className="lg:w-3/5 p-4">
            {/* Desktop Header */}
            <div className="hidden lg:block mb-6">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h1 className="text-2xl font-extrabold tracking-tight mb-2">
                    {buildDescriptiveTitle(mobileData, currentVariant)}
                  </h1>
                  <h4 className="text-purple-700 mb-3 font-medium text-sm flex items-center gap-2">
                    <span>{mobileData?.model}</span>
                    {mobileData?.isAiPhone ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-purple-50 to-blue-100 px-2 py-0.5 text-[10px] font-semibold text-purple-700 ring-1 ring-purple-200">
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
                          ? "text-blue-500 fill-current"
                          : "text-gray-400"
                      }`}
                    />
                  </button>
                  <button
                    onClick={handleShare}
                    className="p-2 rounded-full hover:bg-gray-100"
                    title="Share"
                  >
                    <FaShareAlt className="text-xl text-gray-600" />
                  </button>
                  {/* Copy link removed — share-only */}
                </div>
              </div>
              <div className="flex items-center gap-3 mb-6">
                {currentVariant && (
                  <>
                    <span className="text-3xl font-bold text-green-600">
                      ₹ {formatPrice(currentVariant.base_price)}
                    </span>
                    <span className="text-sm text-gray-500">
                      ({currentVariant.ram} / {currentVariant.storage} )
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Ratings Card removed from details column — rendered below tabs */}

            {/* Store Prices Section */}
            {sortedStores.length > 0 && (
              <div className="mb-6 mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <FaStore className="text-purple-500" />
                    Available at
                  </h3>
                  {sortedStores.length > 3 && (
                    <button
                      onClick={() => setShowAllStores(!showAllStores)}
                      className="text-purple-600 text-sm font-medium flex items-center gap-1"
                    >
                      {showAllStores ? "Show Less" : "View All"}
                      <FaChevronDown
                        className={`text-xs transition-transform ${
                          showAllStores ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {displayedStores.map((store, index) => {
                    const isActive = String(store.id) === String(activeStoreId);
                    return (
                      <div
                        key={store.id || index}
                        className={`bg-white border rounded-xl p-3 transition-all duration-200 ${
                          isActive
                            ? "border-purple-400 shadow-md bg-purple-50"
                            : "border-indigo-200 hover:border-purple-300 hover:shadow-md"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          {/* Store Info */}
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center p-2 shadow-sm">
                              <img
                                src={getLogo(store.store_name)}
                                alt={store.store_name}
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  e.target.src = getLogo("");
                                }}
                              />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-bold text-gray-900 text-md capitalize">
                                {store.store_name}
                              </h4>
                              <p className="text-xs text-gray-500">
                                {store.variantRam} / {store.variantStorage} •
                              </p>
                            </div>
                          </div>

                          {/* Price & CTA */}
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="text-md font-bold text-green-600">
                                ₹ {formatPrice(store.price)}
                              </div>
                            </div>
                            <a
                              href={store.url}
                              target="_blank"
                              rel="noopener noreferrer nofollow"
                              className="bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 hover:from-purple-600 hover:to-blue-600 text-purple-500 px-4 py-2 rounded-full hover:text-white font-semibold text-sm flex items-center gap-2 transition-all duration-200 hover:shadow-lg"
                            >
                              <FaExternalLinkAlt className="text-xs" />
                              Buy Now
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Desktop Quick Specs */}
            <div className="hidden lg:grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-purple-50 rounded-xl">
                <FaMicrochip className="text-purple-600 text-xl mx-auto mb-2" />
                <div className="font-bold text-purple-900">
                  {mobileData.performance?.processor || "-"}
                </div>
                <div className="text-sm text-purple-700">Processor</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <FaCamera className="text-green-600 text-xl mx-auto mb-2" />
                <div className="font-bold text-green-900">
                  {mobileData.camera?.main_camera_megapixels || "-"} MP
                </div>
                <div className="text-sm text-green-700">Main Camera</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-xl">
                <FaBatteryFull className="text-purple-600 text-xl mx-auto mb-2" />
                <div className="font-bold text-purple-900">
                  {mobileData.battery?.battery_capacity_mah || "-"} mAh
                </div>
                <div className="text-sm text-purple-700">Battery</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="border-t border-indigo-200">
          <div className="flex overflow-x-auto no-scrollbar border-b border-indigo-200">
            {availableTabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors duration-200 flex-shrink-0 
                    ${
                      activeTab === tab.id
                        ? "border-purple-500 text-purple-600 bg-purple-50"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                >
                  <IconComponent className="text-sm" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="p-4">{renderTabContent()}</div>
        </div>
      </div>
      <div className="px-3 sm:px-4 lg:px-0">
        <PopularComparisons variant="flat" className="mt-6 rounded-md" />
      </div>
    </div>
  );
};

export default MobileDetailCard;
