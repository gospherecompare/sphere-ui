// src/components/MobileDetailCard.jsx
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import CompetitorCards from "../ui/CompetitorCards";
import ProductDiscoverySections from "../ui/ProductDiscoverySections";
import RecommendedSmartphones from "../Home/RecommendedSmartphones";
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
import useDeviceFieldProfiles from "../../hooks/useDeviceFieldProfiles";
import { resolveDeviceFieldProfile } from "../../utils/deviceFieldProfiles";

const token = Cookies.get("arenak");
const SMARTPHONE_SEO_SUFFIX = "-price-in-india";
const RECENT_STORAGE_KEY = "hooks_recent_smartphones_v1";
const MAX_RECENT_ITEMS = 12;

const normalizeScore100 = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  if (n <= 1) return Math.max(0, Math.min(100, n * 100));
  if (n <= 10) return Math.max(0, Math.min(100, n * 10));
  return Math.max(0, Math.min(100, n));
};

const formatScoreValue = (value) => {
  if (!Number.isFinite(value)) return null;
  return `${Number(value).toFixed(1)}%`;
};

// Spec score badge removed on detail page per request.
const SpecScoreBadge = () => null;

const MobileDetailCard = () => {
  const [activePrimaryTab, setActivePrimaryTab] = useState("info");
  const [activeTab, setActiveTab] = useState("specifications");
  const [activeImage, setActiveImage] = useState(0);
  const [showAllSpecs, setShowAllSpecs] = useState(false);
  const [showAllStores, setShowAllStores] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [activeStoreId, setActiveStoreId] = useState(null);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isPrimaryTabsSticky, setIsPrimaryTabsSticky] = useState(false);
  const [primaryTabsHeight, setPrimaryTabsHeight] = useState(0);
  const primaryTabsRef = useRef(null);
  const primaryTabsSentinelRef = useRef(null);
  const variantInitKeyRef = useRef("");
  const recentStoreKeyRef = useRef("");
  const {
    selectedDevice,
    fetchDevice,
    loading,
    error,
    smartphone,
    refreshDevices,
  } = useDevice();
  const deviceFieldProfiles = useDeviceFieldProfiles();
  const navigate = useNavigate();

  const params = useParams();
  const location = useLocation();
  const normalizeSeoSlug = useCallback((slugValue) => {
    const slug = String(slugValue || "")
      .toLowerCase()
      .trim();
    if (!slug) return "";
    if (slug.endsWith(SMARTPHONE_SEO_SUFFIX)) {
      return slug.slice(0, -SMARTPHONE_SEO_SUFFIX.length).replace(/-+$/g, "");
    }
    return slug;
  }, []);
  const toSeoDetailSlug = useCallback(
    (slugValue) => {
      const base = normalizeSeoSlug(slugValue);
      return base ? `${base}${SMARTPHONE_SEO_SUFFIX}` : "";
    },
    [normalizeSeoSlug],
  );
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
  const routeBaseSlug = useMemo(
    () => normalizeSeoSlug(routeSlug),
    [normalizeSeoSlug, routeSlug],
  );

  // Convert slug to searchable model name
  const modelFromSlug = routeBaseSlug
    ? extractNameFromSlug(routeBaseSlug)
    : null;
  const searchModel = model || modelFromSlug;

  // Try to find device locally by slug match first
  const findDeviceBySlug = useCallback(
    (slug) => {
      if (!slug || !smartphone) return null;
      const searchSlug = generateSlug(normalizeSeoSlug(slug));
      return (Array.isArray(smartphone) ? smartphone : [smartphone]).find(
        (d) => generateSlug(d.name || d.model || "") === searchSlug,
      );
    },
    [smartphone, normalizeSeoSlug],
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

  useEffect(() => {
    if (!primaryTabsRef.current) return;
    const updateHeight = () => {
      setPrimaryTabsHeight(primaryTabsRef.current?.offsetHeight || 0);
    };
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  useEffect(() => {
    const sentinel = primaryTabsSentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsPrimaryTabsSticky(!entry.isIntersecting);
      },
      { threshold: [1] },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  // Update URL to match canonical slug-based path if needed
  useEffect(() => {
    const mobileDataLocal = selectedDevice?.smartphones?.[0] || selectedDevice;
    if (!mobileDataLocal || !routeSlug) return;

    const canonicalBaseSlug = generateSlug(
      mobileDataLocal.name ||
        mobileDataLocal.model ||
        mobileDataLocal.brand ||
        "",
    );
    const canonicalSeoSlug = toSeoDetailSlug(canonicalBaseSlug);
    if (!canonicalSeoSlug) return;

    const desiredPath = `/smartphones/${canonicalSeoSlug}`;
    const nextSearchParams = new URLSearchParams(location.search || "");
    // Clean noisy variant/store query params from detail URL for SEO.
    [
      "variantId",
      "variant_id",
      "storeId",
      "store_id",
      "storeName",
      "store",
    ].forEach((key) => nextSearchParams.delete(key));
    const nextSearch = nextSearchParams.toString();
    const desiredUrl = `${desiredPath}${nextSearch ? `?${nextSearch}` : ""}`;
    const currentUrl = `${window.location.pathname}${window.location.search}`;

    if (currentUrl !== desiredUrl) {
      navigate(desiredUrl, { replace: true });
    }
  }, [selectedDevice, routeSlug, toSeoDetailSlug, navigate, location.search]);

  // Prefer a locally-resolved device (by slug) before falling back to
  // `selectedDevice` which may have been set via other flows.
  const localResolved = routeSlug ? findDeviceBySlug(routeBaseSlug) : null;
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

  const pickFirstBatteryValue = (...values) => {
    for (const value of values) {
      if (value === 0) return value;
      if (value === null || value === undefined) continue;
      if (typeof value === "string" && value.trim() === "") continue;
      return value;
    }
    return null;
  };

  const normalizeDateLikeValue = (value) => {
    if (value == null) return null;
    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : value.toISOString();
    }
    if (typeof value === "object") return null;
    const dt = new Date(value);
    return Number.isNaN(dt.getTime()) ? null : dt.toISOString();
  };

const formatDateForDisplay = (value) => {
  const normalized = normalizeDateLikeValue(value);
  if (!normalized) return "N/A";
  try {
    return new Date(normalized).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch (e) {
    return "N/A";
  }
};

const normalizeLaunchStatus = (value) => {
  if (!value) return null;
  const text = String(value).trim().toLowerCase();
  if (!text) return null;
  if (/(pre[-\s]?order|pre[-\s]?book)/i.test(text)) return "preorder";
  if (/(upcoming|coming soon|expected|launching soon|rumored)/i.test(text))
    return "upcoming";
  if (/(released|available|launched|out now|on sale)/i.test(text))
    return "released";
  return null;
};

const getDeviceLaunchStatus = (device) => {
  if (!device) return null;
  const override = normalizeLaunchStatus(
    device.launch_status_override ||
      device.launchStatusOverride ||
      device.launch_status ||
      device.launchStatus,
  );
  if (override) return override;

  const preorderUrl =
    device.official_preorder_url || device.officialPreorderUrl;
  if (preorderUrl) return "preorder";

  const statusHint = normalizeLaunchStatus(
    device.status || device.availability || device.badge,
  );
  if (statusHint) return statusHint;

  const dateValue = normalizeDateLikeValue(device.launch_date);
  if (dateValue) {
    const dt = new Date(dateValue);
    if (!Number.isNaN(dt.getTime())) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (dt > today) return "upcoming";
      return "released";
    }
  }

  return null;
};

  const getBatteryCapacityRaw = (deviceData) => {
    if (!deviceData) return null;
    const batteryData = deviceData?.battery;
    const nested =
      batteryData && typeof batteryData === "object"
        ? pickFirstBatteryValue(
            batteryData.battery_capacity_mah,
            batteryData.battery_capacity,
            batteryData.capacity_mAh,
            batteryData.capacity_mah,
            batteryData.capacity,
            batteryData.battery,
          )
        : null;

    return pickFirstBatteryValue(
      nested,
      typeof batteryData === "string" || typeof batteryData === "number"
        ? batteryData
        : null,
      deviceData?.battery_capacity_mah,
      deviceData?.battery_capacity,
      deviceData?.batteryCapacity,
    );
  };

  const getBatteryCapacityMah = (deviceData) => {
    const raw = getBatteryCapacityRaw(deviceData);
    if (raw === null || raw === undefined) return null;
    if (typeof raw === "number" && Number.isFinite(raw)) return raw;
    const m = String(raw).match(/(\d{3,6})/);
    return m ? parseInt(m[1], 10) : null;
  };

  const parseMegapixelValue = (value) => {
    if (value == null || value === "") return null;
    if (typeof value === "number" && Number.isFinite(value)) return value;
    const str = String(value);
    const mpMatch = str.match(/(\d+(?:\.\d+)?)\s*mp/i);
    if (mpMatch) return Number(mpMatch[1]);
    const numMatch = str.match(/(\d{1,4}(?:\.\d+)?)/);
    return numMatch ? Number(numMatch[1]) : null;
  };

  const getMainCameraMp = (deviceData) => {
    if (!deviceData) return null;
    const camera = deviceData.camera || {};

    const direct = parseMegapixelValue(camera.main_camera_megapixels);
    if (direct) return Math.round(direct);

    const tryObjects = [
      camera.main_camera,
      camera.main,
      camera.primary,
      camera.rear_camera?.main_camera,
      camera.rear_camera?.main,
      camera.rear_camera?.wide,
      camera.rear_camera?.primary,
    ];

    for (const item of tryObjects) {
      if (!item) continue;
      if (typeof item === "object") {
        const nested =
          parseMegapixelValue(item.resolution) ||
          parseMegapixelValue(item.megapixels) ||
          parseMegapixelValue(item.main_camera_megapixels) ||
          parseMegapixelValue(item.sensor);
        if (nested) return Math.round(nested);
      }
      const parsed = parseMegapixelValue(item);
      if (parsed) return Math.round(parsed);
    }

    const rear = camera.rear_camera;
    if (rear && typeof rear === "object" && !Array.isArray(rear)) {
      const candidates = Object.values(rear)
        .map((lens) => {
          if (!lens) return null;
          if (typeof lens === "object") {
            return (
              parseMegapixelValue(lens.resolution) ||
              parseMegapixelValue(lens.megapixels) ||
              parseMegapixelValue(lens.main_camera_megapixels)
            );
          }
          return parseMegapixelValue(lens);
        })
        .filter((v) => Number.isFinite(v));
      if (candidates.length > 0) {
        return Math.round(Math.max(...candidates));
      }
    }

    return null;
  };

  const normalizeSmartphone = (d) => {
    if (!d) return null;
    const out = { ...d };

    out.id = d.product_id ?? d.id ?? d._id ?? null;
    out.brand = d.brand_name ?? d.brand ?? d.manufacturer ?? "";
    out.name = d.name ?? d.model ?? d.title ?? "";
    out.model = d.model ?? d.name ?? out.name;
    out.images = d.images ?? d.photos ?? d.images_urls ?? [];
    out.launch_date =
      normalizeDateLikeValue(d.launch_date) ||
      normalizeDateLikeValue(d.launchDate) ||
      normalizeDateLikeValue(d.created_at) ||
      normalizeDateLikeValue(d.createdAt);
    out.official_preorder_url =
      d.official_preorder_url ||
      d.officialPreorderUrl ||
      out.official_preorder_url ||
      null;
    out.launch_status_override =
      d.launch_status_override ||
      d.launchStatusOverride ||
      out.launch_status_override ||
      null;

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
    // Try common camera locations (clone camera object before mutating)
    const camSrc = d.camera || out.camera || {};
    const cam = { ...camSrc };
    const parsedMainMp = getMainCameraMp(d);
    if (!cam.main_camera_megapixels && parsedMainMp != null) {
      cam.main_camera_megapixels = parsedMainMp;
    }
    out.camera = cam;

    // Normalize battery capacity in mAh (clone to avoid mutating originals)
    const battSrc = d.battery || out.battery || {};
    const batt = { ...battSrc };
    const capRaw = getBatteryCapacityRaw(d);
    const capMah = getBatteryCapacityMah(d);
    if (capRaw != null) {
      if (!batt.battery_capacity_mah && capMah != null) {
        batt.battery_capacity_mah = capMah;
      }
      if (!batt.capacity) {
        batt.capacity = capRaw;
      }
      if (!batt.battery) {
        batt.battery = d.battery?.battery ?? capRaw;
      }
      if (!batt.battery_capacity && d.battery?.battery_capacity != null) {
        batt.battery_capacity = d.battery.battery_capacity;
      }
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
              : batt.capacity || batt.battery || "",
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
    const profileResult = resolveDeviceFieldProfile(
      "smartphone",
      out,
      deviceFieldProfiles,
    );
    out.field_profile = profileResult;
    if (
      out.spec_score == null &&
      out.overall_score == null &&
      out.hook_score == null
    ) {
      out.spec_score = profileResult.score;
      out.overall_score = profileResult.score;
    }

    return out;
  };

  const mobileData = useMemo(
    () =>
      normalizeSmartphone(
        localResolved || selectedDevice?.smartphones?.[0] || selectedDevice,
      ),
    [localResolved, selectedDevice],
  );
  const launchStatus = useMemo(
    () => getDeviceLaunchStatus(mobileData),
    [mobileData],
  );
  const launchStatusLabel = useMemo(() => {
    if (!launchStatus) return null;
    if (launchStatus === "preorder") return "PREORDER";
    if (launchStatus === "upcoming") return "UPCOMING";
    if (launchStatus === "released") return "RELEASED";
    return String(launchStatus).toUpperCase();
  }, [launchStatus]);
  const launchStatusBadgeClass = useMemo(() => {
    if (launchStatus === "preorder") {
      return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
    }
    if (launchStatus === "upcoming") {
      return "bg-sky-50 text-sky-700 ring-1 ring-sky-200";
    }
    if (launchStatus === "released") {
      return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
    }
    return "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
  }, [launchStatus]);
  const pickScore100 = useCallback((...values) => {
    for (const value of values) {
      const normalized = normalizeScore100(value);
      if (normalized != null) return normalized;
    }
    return null;
  }, []);
  const buildScoreSummary = useCallback(
    (deviceData, options = {}) => {
      if (!deviceData) {
        return {
          overall: null,
          overallDisplay: null,
          sections: [],
        };
      }

      const {
        allowProfileSectionFallback = true,
        allowProfileOverallFallback = true,
        allowSectionAverageFallback = true,
        allowFallbackPersistedScores = true,
      } = options;

      const normalizeScoreSource = (value) =>
        String(value || "")
          .trim()
          .toLowerCase();
      const resolvePersistedScore = (value, source) => {
        const normalized = normalizeScore100(value);
        if (normalized == null) return null;

        const sourceKey = normalizeScoreSource(source);
        if (
          !allowFallbackPersistedScores &&
          sourceKey &&
          sourceKey.includes("fallback")
        ) {
          return null;
        }

        return normalized;
      };

      const sphereRating =
        deviceData.sphere_rating ||
        deviceData.ratings ||
        deviceData.rating_json ||
        {};
      const specScoreV2Source =
        deviceData.spec_score_v2_source ?? deviceData.specScoreV2Source;
      const overallScoreV2Source =
        deviceData.overall_score_v2_source ?? deviceData.overallScoreV2Source;
      const specScoreSource =
        deviceData.spec_score_source ?? deviceData.specScoreSource;
      const overallScoreSource =
        deviceData.overall_score_source ?? deviceData.overallScoreSource;
      const persistedSpecScore = pickScore100(
        resolvePersistedScore(deviceData.spec_score_v2, specScoreV2Source),
        resolvePersistedScore(deviceData.specScoreV2, specScoreV2Source),
        resolvePersistedScore(deviceData.spec_score, specScoreSource),
        resolvePersistedScore(deviceData.specScore, specScoreSource),
      );
      const persistedOverallScore = pickScore100(
        resolvePersistedScore(
          deviceData.overall_score_v2,
          overallScoreV2Source,
        ),
        resolvePersistedScore(deviceData.overallScoreV2, overallScoreV2Source),
        resolvePersistedScore(deviceData.overall_score, overallScoreSource),
        resolvePersistedScore(deviceData.overallScore, overallScoreSource),
      );
      const persistedOverallScoreDisplay = pickScore100(
        resolvePersistedScore(
          deviceData.overall_score_v2_display_80_98,
          overallScoreV2Source,
        ),
        resolvePersistedScore(
          deviceData.overallScoreV2Display8098,
          overallScoreV2Source,
        ),
        resolvePersistedScore(
          deviceData.spec_score_v2_display_80_98,
          specScoreV2Source,
        ),
        resolvePersistedScore(
          deviceData.specScoreV2Display8098,
          specScoreV2Source,
        ),
      );

      const sections = [
        {
          key: "performance",
          label: "Performance",
          icon: FaBolt,
          fillColor: "#6d28d9",
          score: pickScore100(
            deviceData.performance?.score,
            deviceData.performance_json?.score,
            sphereRating?.performance?.score,
            sphereRating?.performance,
            allowProfileSectionFallback
              ? deviceData.field_profile?.section_scores?.core
              : null,
          ),
        },
        {
          key: "display",
          label: "Display",
          icon: FaExpand,
          fillColor: "#2563eb",
          score: pickScore100(
            deviceData.display?.score,
            deviceData.display_json?.score,
            sphereRating?.display?.score,
            sphereRating?.display,
            allowProfileSectionFallback
              ? deviceData.field_profile?.section_scores?.display
              : null,
          ),
        },
        {
          key: "camera",
          label: "Camera",
          icon: FaCamera,
          fillColor: "#0d9488",
          score: pickScore100(
            deviceData.camera?.score,
            deviceData.camera_json?.score,
            sphereRating?.camera?.score,
            sphereRating?.camera,
          ),
        },
        {
          key: "battery",
          label: "Battery",
          icon: FaBatteryFull,
          fillColor: "#059669",
          score: pickScore100(
            deviceData.battery?.score,
            deviceData.battery_json?.score,
            sphereRating?.battery?.score,
            sphereRating?.battery,
            allowProfileSectionFallback
              ? deviceData.field_profile?.section_scores?.core
              : null,
          ),
        },
        {
          key: "network",
          label: "Network",
          icon: FaWifi,
          fillColor: "#7c3aed",
          score: pickScore100(
            deviceData.network?.score,
            deviceData.network_json?.score,
            deviceData.connectivity?.score,
            deviceData.connectivity_json?.score,
            sphereRating?.network?.score,
            sphereRating?.connectivity?.score,
            sphereRating?.network,
            sphereRating?.connectivity,
          ),
        },
      ];

      const numericSectionScores = sections
        .map((section) => section.score)
        .filter((score) => Number.isFinite(score));
      const sectionAverage =
        numericSectionScores.length > 0
          ? numericSectionScores.reduce((sum, score) => sum + score, 0) /
            numericSectionScores.length
          : null;

      const overall = pickScore100(
        persistedOverallScore,
        persistedSpecScore,
        allowProfileOverallFallback ? deviceData.field_profile?.score : null,
        allowSectionAverageFallback ? sectionAverage : null,
      );
      const overallDisplay = pickScore100(
        persistedOverallScoreDisplay,
        overall,
      );

      return {
        overall,
        overallDisplay,
        sections,
      };
    },
    [pickScore100],
  );
  const scoreSummary = useMemo(() => {
    if (!mobileData) {
      return {
        overall: null,
        overallDisplay: null,
        sections: [],
      };
    }
    return buildScoreSummary(mobileData, {
      allowProfileSectionFallback: true,
      allowProfileOverallFallback: false,
      allowSectionAverageFallback: true,
      allowFallbackPersistedScores: true,
    });
  }, [mobileData, buildScoreSummary]);
  const getSectionScore = useCallback(
    (key) => {
      if (!key || key === "overall") return scoreSummary.overall;
      const matched = scoreSummary.sections.find(
        (section) => section.key === key,
      );
      return matched?.score ?? scoreSummary.overall;
    },
    [scoreSummary],
  );
  const getSectionScoreDisplay = useCallback(
    (key) => {
      if (!key || key === "overall") {
        return scoreSummary.overallDisplay ?? scoreSummary.overall;
      }
      const matched = scoreSummary.sections.find(
        (section) => section.key === key,
      );
      return matched?.score ?? scoreSummary.overall;
    },
    [scoreSummary],
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

  const variants = useMemo(
    () =>
      mobileData?.variants ?? (mobileData?.variant ? [mobileData.variant] : []),
    [mobileData],
  );
  const variantsSignature = useMemo(
    () =>
      (variants || [])
        .map((v, index) =>
          [
            v?.variant_id ?? v?.id ?? v?.variantId ?? `idx-${index}`,
            v?.ram ?? "",
            v?.storage ?? "",
            v?.base_price ?? "",
            Array.isArray(v?.store_prices) ? v.store_prices.length : 0,
          ].join("|"),
        )
        .join("::"),
    [variants],
  );

  useEffect(() => {
    if (selectedVariant >= variants.length) setSelectedVariant(0);
  }, [variants.length, selectedVariant]);

  useEffect(() => {
    if (!variants || variants.length === 0) return;
    const productKey = String(
      mobileData?.id ??
        mobileData?.product_id ??
        routeSlug ??
        searchModel ??
        "",
    );
    const initKey = [
      productKey,
      variantQuery ?? "",
      ramParam ?? "",
      storageParam ?? "",
      storeQuery ?? "",
      storeNameParam ?? "",
      variantsSignature,
    ].join("::");
    if (variantInitKeyRef.current === initKey) return;
    variantInitKeyRef.current = initKey;

    let nextVariantIndex = -1;
    let nextStoreId = null;

    if (variantQuery) {
      const idx = variants.findIndex(
        (v) =>
          String(v.variant_id ?? v.id ?? v.variantId) === String(variantQuery),
      );
      if (idx >= 0) nextVariantIndex = idx;
    }
    // If ram/storage params provided, prefer matching variant
    if (
      nextVariantIndex < 0 &&
      (ramParam || storageParam) &&
      variants.length > 0
    ) {
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
      if (idx >= 0) nextVariantIndex = idx;
    }

    if (storeQuery) {
      nextStoreId = String(storeQuery);
    }

    // If store name provided, try to find store id from variant stores
    if (
      nextVariantIndex < 0 &&
      storeNameParam &&
      variants.length > 0 &&
      !storeQuery
    ) {
      for (let i = 0; i < variants.length; i++) {
        const v = variants[i];
        const sp = (v.store_prices || []).find(
          (s) =>
            String(s.store_name || s.store).toLowerCase() ===
            String(storeNameParam).toLowerCase(),
        );
        if (sp) {
          nextVariantIndex = i;
          nextStoreId = String(sp.id || sp.store_id || sp.storeId);
          break;
        }
      }
    }

    if (nextVariantIndex >= 0) setSelectedVariant(nextVariantIndex);
    if (nextStoreId !== null) setActiveStoreId(nextStoreId);
  }, [
    variants,
    variantsSignature,
    variantQuery,
    storeQuery,
    ramParam,
    storageParam,
    storeNameParam,
    mobileData?.id,
    mobileData?.product_id,
    routeSlug,
    searchModel,
  ]);

  const currentVariant = variants?.[selectedVariant];
  const currentProductId =
    mobileData?.id ?? mobileData?.product_id ?? mobileData?.productId ?? null;

  useEffect(() => {
    if (!currentProductId || !mobileData || typeof window === "undefined") {
      return;
    }

    const entry = {
      id: currentProductId,
      name:
        mobileData?.name ||
        mobileData?.model ||
        mobileData?.brand ||
        "Device",
      brand:
        mobileData?.brand ||
        mobileData?.brand_name ||
        mobileData?.manufacturer ||
        "",
      image:
        mobileData?.images?.[0] ||
        mobileData?.image ||
        mobileData?.image_url ||
        "",
      price:
        currentVariant?.base_price ??
        mobileData?.price ??
        mobileData?.base_price ??
        null,
      segment:
        mobileData?.category || mobileData?.product_type || "smartphone",
      processor:
        mobileData?.performance?.processor ||
        mobileData?.processor ||
        mobileData?.cpu ||
        "",
      cameraMp: getMainCameraMp(mobileData),
      ram:
        currentVariant?.ram ||
        mobileData?.performance?.ram ||
        mobileData?.ram ||
        "",
      storage:
        currentVariant?.storage ||
        mobileData?.performance?.storage ||
        mobileData?.storage ||
        "",
      visitedAt: Date.now(),
    };

    const entryKey = String(entry.id || "");
    if (recentStoreKeyRef.current === entryKey) return;
    recentStoreKeyRef.current = entryKey;

    try {
      const raw = window.localStorage.getItem(RECENT_STORAGE_KEY);
      const parsed = JSON.parse(raw || "[]");
      const list = Array.isArray(parsed) ? parsed : [];
      const next = [
        entry,
        ...list.filter((item) => String(item?.id) !== String(entry.id)),
      ].slice(0, MAX_RECENT_ITEMS);
      window.localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore storage errors
    }
  }, [currentProductId, mobileData, currentVariant]);

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

  const getIndiaDateOnly = () => {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date());
    const tokens = {};
    parts.forEach((part) => {
      if (part.type !== "literal") tokens[part.type] = part.value;
    });
    return `${tokens.year}-${tokens.month}-${tokens.day}`;
  };

  const normalizeDateOnly = (value) => {
    if (!value) return null;
    const raw = String(value).trim();
    if (!raw) return null;
    const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString().slice(0, 10);
  };

  const formatSaleStartLabel = (value) => {
    const normalized = normalizeDateOnly(value);
    if (!normalized) return "";
    const date = new Date(`${normalized}T00:00:00+05:30`);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const isPrebookingStore = (store, launchDate = null) => {
    if (store?.is_prebooking === true) return true;
    if (store?.availability_status === "prebooking") return true;
    if (/^pre(book|order)$/i.test(String(store?.cta_label || "").trim()))
      return true;
    const saleStartDate = normalizeDateOnly(
      store?.sale_start_date ?? store?.sale_date ?? store?.saleStartDate,
    );
    if (saleStartDate) {
      return saleStartDate > getIndiaDateOnly();
    }
    if (!saleStartDate) {
      const hasBuyLink = Boolean(String(store?.url || "").trim());
      if (!hasBuyLink) return true;
      const normalizedLaunchDate = normalizeDateOnly(launchDate);
      return Boolean(
        normalizedLaunchDate && normalizedLaunchDate >= getIndiaDateOnly(),
      );
    }
    return false;
  };

  const normalizeStoreKey = (value) =>
    String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

  const getOfficialBrandStoreUrl = (
    stores,
    brandName,
    brandWebsite = null,
    officialPreorderUrl = null,
  ) => {
    if (typeof officialPreorderUrl === "string" && officialPreorderUrl.trim()) {
      return officialPreorderUrl.trim();
    }
    if (typeof brandWebsite === "string" && brandWebsite.trim()) {
      return brandWebsite.trim();
    }
    const brandKey = normalizeStoreKey(brandName);
    if (!brandKey) return null;

    return (
      (Array.isArray(stores) ? stores : []).find((store) => {
        const storeName = normalizeStoreKey(
          store?.store_name || store?.store || store?.storeName,
        );
        if (!store?.url || !storeName) return false;
        return (
          storeName === brandKey ||
          storeName.includes(`${brandKey}store`) ||
          storeName.includes(`${brandKey}official`) ||
          storeName.includes(`official${brandKey}`)
        );
      })?.url || null
    );
  };

  const getAvailabilityRows = (
    stores,
    brandName,
    brandLogo,
    brandWebsite = null,
    launchDate = null,
    officialPreorderUrl = null,
  ) => {
    const normalizedStores = (Array.isArray(stores) ? stores : []).map(
      (store) => {
        const saleStartDate = normalizeDateOnly(
          store?.sale_start_date ?? store?.sale_date ?? store?.saleStartDate,
        );
        const prebooking = isPrebookingStore(store, launchDate);
        return {
          ...store,
          sale_start_date: saleStartDate,
          is_prebooking: prebooking,
          is_live: !prebooking,
          cta_label: prebooking ? "Preorder" : "Buy Now",
        };
      },
    );

    const sortedLiveStores = normalizedStores
      .filter((store) => !store.is_prebooking)
      .sort((a, b) => {
        const priceA =
          parseInt(String(a?.price ?? "").replace(/[^0-9]/g, "")) || Infinity;
        const priceB =
          parseInt(String(b?.price ?? "").replace(/[^0-9]/g, "")) || Infinity;
        return priceA - priceB;
      });
    if (sortedLiveStores.length > 0) {
      return { mode: "live", stores: sortedLiveStores, hiddenCount: 0 };
    }

    const sortedPrebookingStores = normalizedStores
      .filter((store) => store.is_prebooking)
      .sort((a, b) => {
        const priceA =
          parseInt(String(a?.price ?? "").replace(/[^0-9]/g, "")) || Infinity;
        const priceB =
          parseInt(String(b?.price ?? "").replace(/[^0-9]/g, "")) || Infinity;
        return priceA - priceB;
      });

    const officialBrandUrl = getOfficialBrandStoreUrl(
      normalizedStores,
      brandName,
      brandWebsite,
      officialPreorderUrl,
    );
    if (sortedPrebookingStores.length === 0) {
      if (!officialBrandUrl) {
        return { mode: "live", stores: normalizedStores, hiddenCount: 0 };
      }
      return {
        mode: "prebooking",
        stores: [
          {
            store_name: brandName || "Brand Store",
            display_store_name: brandName || "Brand Store",
            brand_logo: brandLogo || null,
            url: officialBrandUrl,
            is_prebooking: true,
            is_live: false,
            availability_status: "prebooking",
            cta_label: "Preorder",
            availability_note: launchDate
              ? `Expected ${formatSaleStartLabel(launchDate)}`
              : "",
          },
        ],
        hiddenCount: 0,
      };
    }

    const primaryPrebooking = sortedPrebookingStores[0];
    return {
      mode: "prebooking",
      stores: [
        {
          ...primaryPrebooking,
          display_store_name:
            brandName || primaryPrebooking.store_name || "Brand Store",
          brand_logo: brandLogo || null,
          url: officialBrandUrl || primaryPrebooking.url || null,
          cta_label: "Preorder",
          availability_note: primaryPrebooking.sale_start_date
            ? `Sale starts ${formatSaleStartLabel(
                primaryPrebooking.sale_start_date,
              )}`
            : "",
        },
      ],
      hiddenCount: 0,
    };
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
    if (value === true) return "âœ“ Yes";
    if (value === false) return "âœ— No";
    return String(value);
  };

  const normalizeSpecToken = (value) =>
    String(value ?? "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

  const getLogicalSpecKey = (key, formattedValue = "") => {
    const token = normalizeSpecToken(key);
    const valueText = String(formattedValue ?? "").toLowerCase();
    const looksLikeMah =
      /(\d{3,6})\s*mah/.test(valueText) || /^\d{3,6}$/.test(valueText.trim());

    // Treat battery aliases as one logical key when they represent capacity.
    if (
      [
        "capacity",
        "capacitymah",
        "batterycapacity",
        "batterycapacitymah",
        "batterymah",
      ].includes(token)
    ) {
      return "batterycapacity";
    }
    if (token === "battery" && looksLikeMah) return "batterycapacity";

    // Main camera aliases (including computed MP field).
    if (
      ["maincamera", "maincameramegapixels", "primarycamera"].includes(token)
    ) {
      return "maincamera";
    }

    return token;
  };

  const normalizeSpecValueForCompare = (value) =>
    String(value ?? "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();

  const dedupeSpecEntries = (entries = []) => {
    const seen = new Set();
    const unique = [];

    for (const [key, value] of entries) {
      const formatted = formatSpecValue(value, key);
      const logicalKey = getLogicalSpecKey(key, formatted);
      const normalizedValue = normalizeSpecValueForCompare(formatted);
      const signature = `${logicalKey}::${normalizedValue}`;
      if (seen.has(signature)) continue;
      seen.add(signature);
      unique.push([key, value]);
    }

    return unique;
  };

  const dedupeSpecRowsByLabel = (rows = []) => {
    const scoreValue = (value) => {
      const text = String(value ?? "");
      const structuredBonus =
        (text.includes("|") ? 60 : 0) +
        (text.includes(":") ? 30 : 0) +
        (/\b(focus|sensor|aperture|resolution|fov)\b/i.test(text) ? 30 : 0);
      return text.length + structuredBonus;
    };

    const byKey = new Map();
    for (const row of rows) {
      const [label, value] = row;
      const logicalKey = getLogicalSpecKey(label, value);
      const existing = byKey.get(logicalKey);
      if (!existing || scoreValue(value) > scoreValue(existing[1])) {
        byKey.set(logicalKey, row);
      }
    }
    return Array.from(byKey.values());
  };

  const isPrimitive = (v) =>
    v == null || (typeof v !== "object" && typeof v !== "function");

  const isLikelyModelCode = (value) => {
    if (!value) return false;
    const s = String(value).trim();
    if (!s || /\s/.test(s)) return false;
    return /^(?:[a-z]{0,3})?[a-z]+[-]?\d+[a-z0-9-]*$/i.test(s);
  };

  const getDisplayProductName = (data) => {
    if (!data) return "";
    const preferred = String(data.name || data.title || "").trim();
    if (preferred) return preferred;

    const model = String(data.model || "").trim();
    if (!model) return "";
    if (isLikelyModelCode(model)) {
      return String(data.brand || data.brand_name || "").trim();
    }
    return model;
  };

  // Build descriptive title for visible heading and meta title (exclude brand)
  const buildDescriptiveTitle = (data, variant) => {
    if (!data) return "";

    const displayName = getDisplayProductName(data);

    const processorRaw =
      variant?.processor || data.performance?.processor || data.processor || "";
    const processor =
      !isPrimitive(processorRaw) || processorRaw === ""
        ? ""
        : formatSpecValue(processorRaw, "processor")
            .replace(/\s+/g, " ")
            .trim();

    // ðŸ‘‰ Format RAM properly (ignore non-primitive inputs)
    const ramRaw = variant?.ram || data.performance?.ram || "";
    const ram =
      !isPrimitive(ramRaw) || ramRaw === ""
        ? ""
        : String(ramRaw).toUpperCase().includes("GB")
          ? `${ramRaw} RAM`
          : `${ramRaw}GB RAM`;

    // ðŸ‘‰ Format Storage properly (ignore non-primitive inputs)
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

    // Camera formatting
    const cameraMPValue = getMainCameraMp(data);
    const cameraRaw = data.camera?.main_camera || data.camera || "";
    const camera = cameraMPValue
      ? `${cameraMPValue}MP Camera`
      : !isPrimitive(cameraRaw) || cameraRaw === ""
        ? ""
        : formatSpecValue(cameraRaw, "camera");

    // ðŸ‘‰ Battery formatting (ignore non-primitive inputs)
    const batteryValue = getBatteryCapacityMah(data);
    const batteryRaw = getBatteryCapacityRaw(data) ?? "";
    const battery = batteryValue
      ? `${batteryValue}mAh Battery`
      : !isPrimitive(batteryRaw) || batteryRaw === ""
        ? ""
        : formatSpecValue(batteryRaw, "battery");

    const primary = displayName;

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
    const name = getDisplayProductName(data);

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

    const cameraValue = getMainCameraMp(data);
    const cameraRaw = data.camera?.main_camera || data.camera || "";
    const camera =
      cameraValue != null
        ? `${cameraValue}MP`
        : !isPrimitive(cameraRaw) || cameraRaw === ""
          ? ""
          : formatSpecValue(cameraRaw, "camera").trim();

    const batteryValue = getBatteryCapacityMah(data);
    const batteryRaw = getBatteryCapacityRaw(data) ?? "";
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
      ? ` â€” ${highlights.slice(0, 4).join(" Â· ")}`
      : "";
    const priceSuffix = priceText ? `. ${priceText}.` : ".";

    return `${identity}${highlightText}${priceSuffix} Compare prices, variants, and detailed specs on Hooks.`;
  };

  const getCompactProcessorLabel = (raw) => {
    const text = String(raw || "")
      .replace(/\s+/g, " ")
      .trim();
    if (!text) return "";

    const dimensity = text.match(/Dimensity\s+\d+\w*(?:[-\s]?Ultra)?/i);
    if (dimensity) return dimensity[0].trim();

    const snapdragon = text.match(
      /Snapdragon\s+[A-Za-z0-9+\-]+(?:\s+Gen\s+\d+)?/i,
    );
    if (snapdragon) return snapdragon[0].trim();

    const tensor = text.match(/Tensor\s+G\d+/i);
    if (tensor) return tensor[0].trim();

    const exynos = text.match(/Exynos\s+\d+/i);
    if (exynos) return exynos[0].trim();

    const apple = text.match(/A\d+\s*Bionic/i);
    if (apple) return apple[0].trim();

    return text.split(" ").slice(0, 4).join(" ");
  };

  const getCompactDisplayLabel = (raw) => {
    const text = String(raw || "")
      .replace(/\s+/g, " ")
      .trim();
    if (!text) return "";
    const match = text.match(/(\d+(?:\.\d+)?)\s*(?:inch|inches|in|")/i);
    if (match) return `${match[1]}"`;
    return text;
  };

  const capitalizeFirst = (raw) => {
    const text = String(raw || "").trim();
    if (!text) return "";
    return text.charAt(0).toUpperCase() + text.slice(1);
  };

  const storeAvailabilityState = getAvailabilityRows(
    allStorePrices,
    mobileData?.brand || mobileData?.brand_name || "",
    mobileData?.brand_logo || mobileData?.brandLogo || null,
    mobileData?.brand_website || mobileData?.brandWebsite || null,
    mobileData?.launch_date ||
      mobileData?.launchDate ||
      mobileData?.created_at ||
      null,
    mobileData?.official_preorder_url ||
      mobileData?.officialPreorderUrl ||
      null,
  );
  const sortedStores = storeAvailabilityState.stores || [];
  const displayedStores = showAllStores
    ? sortedStores
    : sortedStores.slice(0, 3);

  const batteryForShareRaw =
    getBatteryCapacityMah(mobileData) ??
    getBatteryCapacityRaw(mobileData) ??
    mobileData?.specs?.battery ??
    "";
  const batteryForShare = batteryForShareRaw
    ? String(batteryForShareRaw).toLowerCase().includes("mah")
      ? String(batteryForShareRaw)
      : `${batteryForShareRaw}mAh`
    : "";

  // Share functionality
  const currentMainCameraMp = getMainCameraMp(mobileData);
  const currentVariantLabel = [currentVariant?.ram, currentVariant?.storage]
    .filter(Boolean)
    .join(" / ");
  const headerTitle = capitalizeFirst(
    getDisplayProductName(mobileData) ||
      [mobileData?.brand, mobileData?.name].filter(Boolean).join(" "),
  );
  const headerType = toNormalCase(
    mobileData?.product_type || mobileData?.category || "Smartphone",
  );
  const headerProcessor = getCompactProcessorLabel(
    currentVariant?.processor ||
      mobileData?.performance?.processor ||
      mobileData?.processor ||
      mobileData?.cpu ||
      "",
  );
  const headerDisplayRaw =
    mobileData?.display?.size ??
    mobileData?.display_json?.size ??
    mobileData?.specs?.display ??
    (isPrimitive(mobileData?.display) ? mobileData?.display : "");
  const headerDisplay = getCompactDisplayLabel(headerDisplayRaw);
  const headerDescriptor = [
    headerType,
    headerProcessor,
    headerDisplay && `${headerDisplay} Display`,
  ]
    .filter(Boolean)
    .join(" | ");
  const productDisplayName =
    getDisplayProductName(mobileData) ||
    [mobileData?.brand, mobileData?.name].filter(Boolean).join(" ");
  const shareCameraText = currentMainCameraMp
    ? `${currentMainCameraMp}MP Camera`
    : "Main camera details";
  const shareData = {
    title: `${productDisplayName}${
      currentVariantLabel ? ` (${currentVariantLabel})` : ""
    }`,
    text: `Check out ${productDisplayName} - ${
      mobileData?.performance?.processor
    }, ${shareCameraText}, ${batteryForShare} Battery. Price starts at ₹${
      currentVariant?.base_price
        ? formatPrice(currentVariant.base_price)
        : "N/A"
    }`,
    url: window.location.href,
  };

  // Generate detailed share content with product information
  const generateShareContent = () => {
    const brand = mobileData?.brand || mobileData?.manufacturer || "Device";
    const model = productDisplayName || "Unknown";
    const processor =
      mobileData?.performance?.processor ||
      mobileData?.processor ||
      mobileData?.cpu ||
      mobileData?.specs?.processor ||
      "Processor info not available";
    const cameraMp = getMainCameraMp(mobileData);
    const camera =
      cameraMp ||
      mobileData?.camera?.main ||
      mobileData?.mainCamera ||
      mobileData?.specs?.camera ||
      "Camera info not available";
    const battery =
      getBatteryCapacityMah(mobileData) ||
      getBatteryCapacityRaw(mobileData) ||
      mobileData?.batteryCapacity ||
      mobileData?.specs?.battery ||
      "Battery info not available";
    const batteryText = String(battery).toLowerCase().includes("mah")
      ? String(battery)
      : `${battery}mAh`;
    const price = currentVariant?.base_price
      ? `₹${formatPrice(currentVariant.base_price)}`
      : "Price not available";
    const display =
      mobileData?.display?.size ||
      mobileData?.display ||
      mobileData?.specs?.display ||
      "Display info not available";

    return {
      title: `${brand} ${model}${
        currentVariantLabel ? ` (${currentVariantLabel})` : ""
      }`,
      description: `${processor}  ${camera}${
        cameraMp ? "MP" : ""
      } Camera | ${batteryText} Battery | ${display}" Display | Price: ${price}`,
      shortDescription: `${brand} ${model} - ${processor}, ${camera}${
        cameraMp ? "MP" : ""
      }, ${batteryText}, Price: ${price}`,
      fullDetails: `
${brand} ${model}
processor: ${processor}
Camera: ${camera}${cameraMp ? "MP" : ""}
Battery: ${batteryText}
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
      const path = `/smartphones/${toSeoDetailSlug(slug) || slug}`;
      return window.location.origin + path;
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
        alert("Link copied to clipboard â€” paste to share");
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

  // copy link functionality removed â€” share-only flow

  const shareToWhatsApp = () => {
    const base = getCanonicalUrl();
    const shareUrl = new URL(base);
    const productId = mobileData?.id || mobileData?.model || "";
    if (productId) shareUrl.searchParams.set("id", String(productId));
    shareUrl.searchParams.set("shared", "1");
    const urlToShare = shareUrl.toString();
    const content = generateShareContent();
    const message = `${content.fullDetails}\n\nðŸ”— Check it out: ${urlToShare}`;
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
  const primaryTabs = [
    { id: "info", label: "Info" },
    { id: "specs", label: "Specs" },
    { id: "competitors", label: "Competitors" },
  ];

  // Determine whether a piece of spec data actually contains useful content
  const hasContent = (data) => {
    if (data == null || data === false) return false;
    if (typeof data === "string") {
      const t = data.trim();
      if (!t) return false;
      const lower = t.toLowerCase();
      if (
        lower === "n/a" ||
        lower === "na" ||
        lower === "null" ||
        lower === "undefined" ||
        lower === "invalid date" ||
        t === "{}" ||
        t === "[]"
      ) {
        return false;
      }
      return true;
    }
    if (typeof data === "number") return Number.isFinite(data);
    if (Array.isArray(data)) return data.some((item) => hasContent(item));
    if (typeof data === "object") {
      return Object.values(data).some((value) => hasContent(value));
    }
    return Boolean(data);
  };

  // Map tab ids to the fields we consider for presence checks
  const filterTabByData = (tabId) => {
    const displayData = mobileData?.display || mobileData?.display_json;
    const performanceData =
      mobileData?.performance || mobileData?.performance_json;
    const cameraData = mobileData?.camera || mobileData?.camera_json;
    const batteryData = mobileData?.battery || mobileData?.battery_json;
    const buildData = mobileData?.build_design || mobileData?.build_design_json;
    const connectivityData =
      mobileData?.connectivity || mobileData?.connectivity_json;
    const networkData = mobileData?.network || mobileData?.network_json;
    const multimediaData =
      mobileData?.multimedia || mobileData?.multimedia_json;

    switch (tabId) {
      case "specifications":
        return [
          mobileData?.brand,
          mobileData?.model,
          mobileData?.category,
          performanceData,
          displayData,
          cameraData,
          batteryData,
        ].some((v) => hasContent(v));
      case "display":
        return hasContent(displayData);
      case "performance":
        return hasContent(performanceData);
      case "camera":
        return hasContent(cameraData);
      case "battery":
        return hasContent(batteryData);
      case "build_design":
        return hasContent(buildData);
      case "connectivity":
        return (
          hasContent(connectivityData) ||
          hasContent(networkData) ||
          hasContent(mobileData?.ports) ||
          hasContent(mobileData?.positioning_json)
        );
      case "multimedia":
        return hasContent(mobileData?.audio) || hasContent(multimediaData);
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
        // subsection not present â€” activate the tab normally
        setActiveTab(tabId);
      }
    });
  };

  const isScoreKey = (key) => /(^|[_-])score$/i.test(String(key || ""));

  const renderSpecItems = (data, limit = 5) => {
    if (!data || typeof data !== "object") {
      return (
        <div className="text-center py-4 text-gray-500">No data available</div>
      );
    }
    const entries = Object.entries(data).filter(
      ([key, value]) =>
        hasContent(value) && key !== "sphere_rating" && !isScoreKey(key),
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
              ([k, v]) => hasContent(v) && !isScoreKey(k),
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
    if (!camera || !hasContent(camera))
      return (
        <div className="text-center py-4 text-gray-500">
          No camera data available
        </div>
      );

    const rows = [];

    const normalizeCameraLensLabel = (lensKey) => {
      const key = String(lensKey || "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");

      if (
        ["main", "maincamera", "wide", "primary", "primarycamera"].includes(key)
      ) {
        return "Main Camera";
      }
      if (["ultrawide", "ultrawidecamera", "ultrawideangle"].includes(key)) {
        return "Ultra Wide Camera";
      }
      if (["telephoto", "periscope", "periscopetelephoto"].includes(key)) {
        return "Telephoto Camera";
      }
      return toNormalCase(lensKey);
    };

    const normalizeCameraLabel = (rawKey) => {
      const key = normalizeSpecToken(rawKey);
      if (
        ["maincamera", "maincameramegapixels", "primarycamera"].includes(key)
      ) {
        return "Main Camera";
      }
      if (key === "rearcamera") return "Rear Camera";
      if (key === "frontcamera") return "Front Camera";
      if (key === "shootingmodes") return "Shooting Modes";
      if (key === "videorecording") return "Video Recording";
      if (key === "aifeatures") return "AI Features";
      if (key === "camerafeatures") return "Camera Features";
      if (key === "rearcameraphotographyfeatures")
        return "Photography Features";
      return toNormalCase(rawKey);
    };

    const formatCameraObject = (value, key) => {
      if (!hasContent(value)) return "";
      if (Array.isArray(value)) {
        return value
          .map((item) => formatCameraObject(item, key))
          .filter((item) => hasContent(item))
          .join(", ");
      }
      if (typeof value === "object") {
        const parts = Object.entries(value)
          .filter(([, v]) => hasContent(v))
          .map(([k, v]) => `${toNormalCase(k)}: ${formatCameraObject(v, k)}`)
          .filter(Boolean);
        return parts.join(" | ");
      }
      return formatSpecValue(value, key);
    };

    const addRow = (label, value, key = label) => {
      const formatted = formatCameraObject(value, key);
      if (!hasContent(formatted) || formatted === "Not specified") return;
      rows.push([label, formatted]);
    };

    const mainCandidates = [
      camera.main_camera,
      camera.main,
      camera.primary,
      camera.rear_camera?.main_camera,
      camera.rear_camera?.main,
      camera.rear_camera?.wide,
      camera.rear_camera?.primary,
    ];

    const mainCameraMp = getMainCameraMp({ camera });
    const detailedMain = mainCandidates.find((entry) => hasContent(entry));
    if (detailedMain) {
      addRow("Main Camera", detailedMain, "main_camera");
    } else if (mainCameraMp) {
      addRow("Main Camera", `${mainCameraMp} MP`, "main_camera_megapixels");
    }

    // Rear camera can be an object with lenses or a string
    if (camera.rear_camera) {
      if (
        typeof camera.rear_camera === "object" &&
        !Array.isArray(camera.rear_camera)
      ) {
        Object.entries(camera.rear_camera).forEach(([lens, spec]) => {
          if (hasContent(spec)) {
            addRow(normalizeCameraLensLabel(lens), spec, lens);
          }
        });
      } else {
        addRow("Rear Camera", camera.rear_camera, "rear_camera");
      }
    }

    // Front camera
    if (camera.front_camera) {
      addRow("Front Camera", camera.front_camera, "front_camera");
    }

    // Add remaining dynamic keys so camera stays future-proof for varying JSON shapes.
    const handledKeys = new Set([
      "main_camera",
      "main",
      "primary",
      "main_camera_megapixels",
      "rear_camera",
      "front_camera",
    ]);

    Object.entries(camera).forEach(([key, value]) => {
      if (handledKeys.has(key)) return;
      if (!hasContent(value)) return;
      addRow(normalizeCameraLabel(key), value, key);
    });

    const uniqueRows = dedupeSpecRowsByLabel(rows).filter(([, value]) =>
      hasContent(value),
    );
    if (!uniqueRows.length) {
      return (
        <div className="text-center py-4 text-gray-500">
          No camera data available
        </div>
      );
    }

    const renderCameraValueCell = (value) => {
      const text = String(value ?? "").trim();
      if (!text) return "Not specified";

      // Convert "Key: Value | Key: Value" into a readable mini table.
      if (text.includes("|") && text.includes(":")) {
        const pairs = text
          .split("|")
          .map((part) => part.trim())
          .filter(Boolean)
          .map((part) => {
            const separatorIndex = part.indexOf(":");
            if (separatorIndex === -1) return null;
            const field = part.slice(0, separatorIndex).trim();
            const fieldValue = part.slice(separatorIndex + 1).trim();
            if (!field || !fieldValue) return null;
            return [field, fieldValue];
          })
          .filter(Boolean);

        if (pairs.length >= 2) {
          return (
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
              {pairs.map(([field, fieldValue]) => (
                <div
                  key={`${field}-${fieldValue}`}
                  className="border border-slate-200 bg-white px-2 py-1.5"
                >
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                    {field}
                  </div>
                  <div className="mt-0.5 text-[12px] leading-snug text-slate-900 break-words">
                    {fieldValue}
                  </div>
                </div>
              ))}
            </div>
          );
        }
      }

      return text;
    };

    return (
      <div className="divide-y divide-slate-200 bg-white">
        {uniqueRows.map(([label, value], idx) => (
          <section key={idx} className="py-3 first:pt-0 last:pb-0">
            <h5 className="mb-2 text-sm font-semibold text-slate-800">
              {label}
            </h5>
            <div className="text-sm text-slate-900">
              {renderCameraValueCell(value)}
            </div>
          </section>
        ))}
      </div>
    );
  };

  const renderSpecTable = (data) => {
    if (!data || (typeof data === "object" && Object.keys(data).length === 0))
      return (
        <div className="text-center py-4 text-gray-500">No data available</div>
      );

    const entries = dedupeSpecEntries(
      Object.entries(data).filter(
        ([k]) =>
          k !== "sphere_rating" &&
          !/ai[_-]?features?/i.test(k) &&
          !isScoreKey(k),
      ),
    );

    return (
      <div className="overflow-x-auto rounded-md">
        <table className="w-full min-w-[360px] sm:min-w-full shadow-none">
          <tbody className="bg-white">
            {entries.map(([key, value], idx) => (
              <tr
                key={key}
                className={`transition-colors ${
                  idx % 2 === 0 ? "bg-white" : "bg-slate-50/40"
                } hover:bg-violet-50/30`}
              >
                <td className="w-[32%] px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-slate-600 align-top">
                  {toNormalCase(key)}
                </td>
                <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-slate-900 align-top">
                  {formatSpecValue(value, key)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Display-specific renderer â€” fallback to generic spec table when possible
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

  const toSectionTableData = (raw, fallbackKey) => {
    if (!hasContent(raw)) return null;
    if (Array.isArray(raw)) return { [fallbackKey]: raw };
    if (typeof raw === "object") return raw;
    return { [fallbackKey]: raw };
  };

  const renderTabContent = () => {
    if (!mobileData) return null;

    switch (activeTab) {
      case "specifications": {
        const displayData = mobileData.display || mobileData.display_json;
        const performanceData =
          mobileData.performance || mobileData.performance_json || {};
        const cameraData = mobileData.camera || mobileData.camera_json;
        const batteryData = mobileData.battery || mobileData.battery_json || {};
        const connectivityData = toSectionTableData(
          mobileData.connectivity || mobileData.connectivity_json,
          "connectivity",
        );
        const networkData = toSectionTableData(
          mobileData.network || mobileData.network_json,
          "network",
        );
        const audioData = toSectionTableData(mobileData.audio, "audio");
        const sensorsData = toSectionTableData(mobileData.sensors, "sensors");
        const sectionScore = (key) => getSectionScore(key);
        const sectionScoreDisplay = (key) => getSectionScoreDisplay(key);

        return (
          <div id="spec-specifications" className="space-y-4">
            {/* Specs Sections */}
            <div className="space-y-4">
              {/* General Section */}
              <div
                id="spec-general"
                className="rounded-xl bg-white px-3 py-3 sm:px-5 sm:py-4 md:px-6 md:py-5"
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h4 className="flex items-center gap-2 text-[15px] font-semibold text-slate-900">
                    <FaInfoCircle className="text-sm text-violet-400" />
                    General
                  </h4>
                  <div className="flex items-center gap-1.5">
                    <SpecScoreBadge
                      score={sectionScoreDisplay("overall")}
                      size={38}
                    />
                  </div>
                </div>
                <div className="overflow-hidden rounded-md">
                  <table className="min-w-full">
                    <tbody className="bg-white">
                      {[
                        { label: "Brand", value: mobileData.brand },
                        { label: "Model", value: mobileData.model },
                        { label: "Segment", value: mobileData.category },
                        {
                          label: "Release Date",
                          value: formatDateForDisplay(
                            mobileData.launch_date || mobileData.launchDate,
                          ),
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
                          value: (() => {
                            const w = mobileData.build_design?.weight;
                            if (!w) return "N/A";
                            const ws = String(w).trim();
                            return /\bg\b/i.test(ws) ? ws : `${ws} g`;
                          })(),
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
                            className={`transition-colors ${
                              idx % 2 === 0 ? "bg-white" : "bg-slate-50/40"
                            } hover:bg-violet-50/30`}
                          >
                            <td className="w-[32%] px-3 py-2.5 text-[13px] font-medium text-slate-600 align-top sm:px-4 md:px-5">
                              {item.label}
                            </td>
                            <td className="w-[68%] px-3 py-2.5 text-[13px] text-slate-900 sm:px-4 md:px-5">
                              {formatSpecValue(item.value, item.label)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Display Section */}
              {hasContent(displayData) && (
                <div
                  id="spec-display"
                  className="rounded-xl bg-white px-3 py-3 sm:px-5 sm:py-4 md:px-6 md:py-5"
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <h4 className="flex items-center gap-2 text-[15px] font-semibold text-slate-900">
                      <FaExpand className="text-purple-400" />
                      Display
                    </h4>
                    <div className="flex items-center gap-1.5">
                      <SpecScoreBadge
                        score={sectionScore("display")}
                        size={38}
                      />
                    </div>
                  </div>

                  {renderDisplayTable(displayData)}
                </div>
              )}

              {/* Performance Section */}
              {hasContent(performanceData) && (
                <div
                  id="spec-performance"
                  className="rounded-xl bg-white px-3 py-3 sm:px-5 sm:py-4 md:px-6 md:py-5"
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <h4 className="flex items-center gap-2 text-[15px] font-semibold text-slate-900">
                      <FaBolt className="text-yellow-500" />
                      Performance
                    </h4>
                    <div className="flex items-center gap-1.5">
                      <SpecScoreBadge
                        score={sectionScore("performance")}
                        size={38}
                      />
                    </div>
                  </div>
                  <div className="overflow-hidden rounded-md">
                    <table className="min-w-full">
                      <tbody className="bg-white">
                        {dedupeSpecEntries(
                          Object.entries(performanceData || {}).filter(
                            ([k, v]) =>
                              hasContent(v) &&
                              !["sphere_rating", "ai_features"].includes(k) &&
                              !isScoreKey(k),
                          ),
                        ).map(([key, value], idx) => (
                          <tr
                            key={key}
                            className={`transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/40"} hover:bg-violet-50/30`}
                          >
                            <td className="w-[32%] px-3 py-2.5 text-[13px] font-medium text-slate-600 sm:px-4 md:px-5 align-top">
                              {toNormalCase(key)}
                            </td>
                            <td className="w-[68%] px-3 py-2.5 text-[13px] text-slate-900 sm:px-4 md:px-5">
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
              {hasContent(cameraData) && (
                <div
                  id="spec-camera"
                  className="rounded-xl bg-white px-3 py-3 sm:px-5 sm:py-4 md:px-6 md:py-5"
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <h4 className="flex items-center gap-2 text-[15px] font-semibold text-slate-900">
                      <FaCamera className="text-purple-400" />
                      Camera
                    </h4>
                    <div className="flex items-center gap-1.5">
                      <SpecScoreBadge
                        score={sectionScore("camera")}
                        size={38}
                      />
                    </div>
                  </div>

                  {renderCameraTable(cameraData)}
                </div>
              )}

              {/* Battery Section */}
              {hasContent(batteryData) && (
                <div
                  id="spec-battery"
                  className="rounded-xl bg-white px-3 py-3 sm:px-5 sm:py-4 md:px-6 md:py-5"
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <h4 className="flex items-center gap-2 text-[15px] font-semibold text-slate-900">
                      <FaBatteryFull className="text-green-500" />
                      Battery
                    </h4>
                    <div className="flex items-center gap-1.5">
                      <SpecScoreBadge
                        score={sectionScore("battery")}
                        size={38}
                      />
                    </div>
                  </div>
                  <div className="overflow-hidden rounded-md">
                    <table className="min-w-full">
                      <tbody className="bg-white">
                        {dedupeSpecEntries(
                          Object.entries(batteryData || {}).filter(
                            ([k, v]) =>
                              hasContent(v) &&
                              !/ai[_-]?features?/i.test(k) &&
                              !isScoreKey(k),
                          ),
                        ).map(([key, value], idx) => (
                          <tr
                            key={key}
                            className={`transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/40"} hover:bg-violet-50/30`}
                          >
                            <td className="w-[32%] px-3 py-2.5 text-[13px] font-medium text-slate-600 sm:px-4 md:px-5 align-top">
                              {toNormalCase(key)}
                            </td>
                            <td className="w-[68%] px-3 py-2.5 text-[13px] text-slate-900 sm:px-4 md:px-5">
                              {[
                                "battery_capacity_mah",
                                "battery_capacity",
                              ].includes(key)
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
              {hasContent(connectivityData) && (
                <div
                  id="spec-connectivity"
                  className="rounded-xl bg-white px-3 py-3 sm:px-5 sm:py-4 md:px-6 md:py-5"
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <h4 className="flex items-center gap-2 text-[15px] font-semibold text-slate-900">
                      <FaWifi className="text-purple-400" />
                      Connectivity
                    </h4>
                    <div className="flex items-center gap-1.5">
                      <SpecScoreBadge
                        score={sectionScore("network")}
                        size={38}
                      />
                    </div>
                  </div>
                  <div className="overflow-hidden rounded-md">
                    <table className="min-w-full">
                      <tbody className="bg-white">
                        {dedupeSpecEntries(
                          Object.entries(connectivityData || {}).filter(
                            ([k, v]) =>
                              hasContent(v) &&
                              !/ai[_-]?features?/i.test(k) &&
                              !isScoreKey(k),
                          ),
                        ).map(([key, value], idx) => (
                          <tr
                            key={key}
                            className={`transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/40"} hover:bg-violet-50/30`}
                          >
                            <td className="w-[32%] px-3 py-2.5 text-[13px] font-medium text-slate-600 sm:px-4 md:px-5 align-top">
                              {toNormalCase(key)}
                            </td>
                            <td className="w-[68%] px-3 py-2.5 text-[13px] text-slate-900 sm:px-4 md:px-5">
                              {formatSpecValue(value, key)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Network Section */}
              {hasContent(networkData) && (
                <div
                  id="spec-network"
                  className="rounded-xl bg-white px-3 py-3 sm:px-5 sm:py-4 md:px-6 md:py-5"
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <h4 className="flex items-center gap-2 text-[15px] font-semibold text-slate-900">
                      <FaWifi className="text-indigo-500" />
                      Network
                    </h4>
                    <div className="flex items-center gap-1.5">
                      <SpecScoreBadge
                        score={sectionScore("network")}
                        size={38}
                      />
                    </div>
                  </div>
                  {renderSpecTable(networkData)}
                </div>
              )}

              {/* Audio Section */}
              {hasContent(audioData) && (
                <div
                  id="spec-audio"
                  className="rounded-xl bg-white px-3 py-3 sm:px-5 sm:py-4 md:px-6 md:py-5"
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <h4 className="flex items-center gap-2 text-[15px] font-semibold text-slate-900">
                      <FaVolumeUp className="text-pink-500" />
                      Audio
                    </h4>
                    <SpecScoreBadge
                      score={sectionScoreDisplay("overall")}
                      size={38}
                    />
                  </div>
                  {renderSpecTable(audioData)}
                </div>
              )}

              {/* Sensors Section */}
              {hasContent(sensorsData) && (
                <div
                  id="spec-sensors"
                  className="rounded-xl bg-white px-3 py-3 sm:px-5 sm:py-4 md:px-6 md:py-5"
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <h4 className="flex items-center gap-2 text-[15px] font-semibold text-slate-900">
                      <FaShieldAlt className="text-teal-500" />
                      Sensors
                    </h4>
                    <SpecScoreBadge
                      score={sectionScoreDisplay("overall")}
                      size={38}
                    />
                  </div>
                  {renderSpecTable(sensorsData)}
                </div>
              )}

              {/* Available colors removed */}
              {/* Price Comparison Call to Action */}
            </div>
          </div>
        );
      }

      case "display":
        return (
          <div className="bg-white rounded-lg p-4">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FaExpand className="text-green-500" />
                Display
              </h3>
              <SpecScoreBadge score={getSectionScore("display")} size={38} />
            </div>
            {renderSpecTable(mobileData.display)}
          </div>
        );

      case "performance":
        return (
          <div className="bg-white rounded-lg p-4">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FaBolt className="text-yellow-500" />
                Performance
              </h3>
              <SpecScoreBadge
                score={getSectionScore("performance")}
                size={38}
              />
            </div>
            {renderSpecTable(mobileData.performance)}
          </div>
        );

      case "camera":
        return (
          <div className="bg-white rounded-lg p-4">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FaCamera className="text-purple-400" />
                Camera
              </h3>
              <SpecScoreBadge score={getSectionScore("camera")} size={38} />
            </div>
            {renderCameraTable(mobileData.camera)}
          </div>
        );

      case "battery":
        return (
          <div className="bg-white rounded-lg p-4">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FaBatteryFull className="text-blue-500" />
                Battery
              </h3>
              <SpecScoreBadge score={getSectionScore("battery")} size={38} />
            </div>
            {renderSpecTable(mobileData.battery)}
          </div>
        );

      case "connectivity": {
        const connectivityData = toSectionTableData(
          mobileData.connectivity || mobileData.connectivity_json,
          "connectivity",
        );
        const networkData = toSectionTableData(
          mobileData.network || mobileData.network_json,
          "network",
        );
        const portsData = toSectionTableData(mobileData.ports, "ports");

        return (
          <div className="bg-white rounded-lg p-4">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FaWifi className="text-purple-400" />
                Connectivity
              </h3>
              <SpecScoreBadge score={getSectionScore("network")} size={38} />
            </div>
            {hasContent(connectivityData)
              ? renderSpecTable(connectivityData)
              : null}
            {hasContent(networkData) ? (
              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h4 className="font-semibold text-gray-800">Network</h4>
                  <SpecScoreBadge
                    score={getSectionScore("network")}
                    size={34}
                  />
                </div>
                {renderSpecTable(networkData)}
              </div>
            ) : null}
            {hasContent(portsData) ? (
              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h4 className="font-semibold text-gray-800">Ports</h4>
                  <SpecScoreBadge
                    score={getSectionScoreDisplay("overall")}
                    size={34}
                  />
                </div>
                {renderSpecTable(portsData)}
              </div>
            ) : null}
          </div>
        );
      }

      case "multimedia": {
        const audioData = toSectionTableData(mobileData.audio, "audio");
        const multimediaData = toSectionTableData(
          mobileData.multimedia || mobileData.multimedia_json,
          "multimedia",
        );
        const sensorsData = toSectionTableData(mobileData.sensors, "sensors");

        return (
          <div className="bg-white rounded-lg p-4">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FaFilm className="text-indigo-500" />
                Multimedia
              </h3>
              <SpecScoreBadge
                score={getSectionScoreDisplay("overall")}
                size={38}
              />
            </div>
            {hasContent(multimediaData)
              ? renderSpecTable(multimediaData)
              : null}
            {hasContent(audioData) ? (
              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h4 className="font-semibold text-gray-800">Audio</h4>
                  <SpecScoreBadge
                    score={getSectionScoreDisplay("overall")}
                    size={34}
                  />
                </div>
                {renderSpecTable(audioData)}
              </div>
            ) : null}
            {hasContent(sensorsData) ? (
              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h4 className="font-semibold text-gray-800">Sensors</h4>
                  <SpecScoreBadge
                    score={getSectionScoreDisplay("overall")}
                    size={34}
                  />
                </div>
                {renderSpecTable(sensorsData)}
              </div>
            ) : null}
          </div>
        );
      }

      case "build_design":
        return (
          <div className="bg-white rounded-lg p-4">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FaMobile className="text-indigo-500" />
                Build & Design
              </h3>
              <SpecScoreBadge
                score={getSectionScoreDisplay("overall")}
                size={38}
              />
            </div>
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
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-white rounded-lg p-8 text-center">
          <Spinner />
          <div className="text-sm text-gray-500 mt-3">Please waitâ€¦</div>
        </div>
      </div>
    );
  }

  if (!loading && !mobileData) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-white rounded-lg p-8 text-center">
          <div className="text-gray-400 text-6xl mb-4">ðŸ“±</div>
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
  const metaName = getDisplayProductName(mobileData) || mobileData?.name || "";
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
  const metaTitleBase =
    titleWithBrand ||
    smartphoneMeta.title({
      name: metaName,
      ram: metaRam,
      storage: metaStorage,
    });
  const metaVariantTag = [currentVariant?.ram, currentVariant?.storage]
    .filter(Boolean)
    .join(" / ");
  const metaTitle =
    metaVariantTag && !String(metaTitleBase).includes(metaVariantTag)
      ? `${metaTitleBase} (${metaVariantTag})`
      : metaTitleBase;
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

  const canonicalUrl = getCanonicalUrl();
  const primaryImage = Array.isArray(mobileData?.images)
    ? mobileData.images[0]
    : null;
  const ogImage = toAbsoluteUrl(primaryImage);
  const extractNumericPrice = (value) => {
    if (value == null) return null;
    const cleaned = String(value).replace(/[^0-9]/g, "");
    if (!cleaned) return null;
    const num = parseInt(cleaned, 10);
    return Number.isFinite(num) && num > 0 ? num : null;
  };
  const productJsonLd = useMemo(() => {
    if (!mobileData) return null;
    const name = metaTitle || mobileData?.name || mobileData?.model || "";
    if (!name) return null;
    const url =
      canonicalUrl ||
      (typeof window !== "undefined" ? window.location.href : "");
    const brandName =
      mobileData?.brand ||
      mobileData?.brand_name ||
      mobileData?.manufacturer ||
      "";
    const imageCandidates = [
      primaryImage,
      ...(Array.isArray(mobileData?.images) ? mobileData.images : []),
      mobileData?.image,
      mobileData?.image_url,
    ]
      .filter(Boolean)
      .map(toAbsoluteUrl)
      .filter(Boolean);
    const images = Array.from(new Set(imageCandidates));
    const priceValue = extractNumericPrice(
      currentVariant?.base_price ??
        mobileData?.price ??
        mobileData?.base_price ??
        null,
    );
    const availability =
      launchStatus === "preorder" || launchStatus === "upcoming"
        ? "https://schema.org/PreOrder"
        : "https://schema.org/InStock";
    const offers =
      priceValue != null
        ? {
            "@type": "Offer",
            priceCurrency: "INR",
            price: priceValue,
            availability,
            url,
            itemCondition: "https://schema.org/NewCondition",
          }
        : null;
    const schema = {
      "@context": "https://schema.org",
      "@type": "Product",
      name,
      description: metaDescription,
      url,
    };
    if (images.length) schema.image = images;
    if (brandName) schema.brand = { "@type": "Brand", name: brandName };
    const sku =
      mobileData?.model || mobileData?.id || mobileData?.product_id || null;
    if (sku) schema.sku = String(sku);
    if (offers) schema.offers = offers;
    return JSON.stringify(schema);
  }, [
    mobileData,
    metaTitle,
    metaDescription,
    canonicalUrl,
    currentVariant,
    launchStatus,
    primaryImage,
  ]);
  const infoOsSummary =
    mobileData?.performance?.operating_system ||
    mobileData?.performance?.os ||
    mobileData?.operating_system;
  const rearMainCamera = mobileData?.camera?.rear_camera?.main_camera;
  const rearUltraCamera =
    mobileData?.camera?.rear_camera?.ultra_wide_camera ||
    mobileData?.camera?.rear_camera?.ultra_wide;
  const rearTeleCamera =
    mobileData?.camera?.rear_camera?.telephoto ||
    mobileData?.camera?.rear_camera?.periscope;
  const frontCamera = mobileData?.camera?.front_camera;
  const rearVideoRaw = mobileData?.camera?.video_recording?.rear;
  const frontVideoRaw = mobileData?.camera?.video_recording?.front;
  const rearVideoSummary = Array.isArray(rearVideoRaw)
    ? rearVideoRaw.slice(0, 3).join(", ")
    : rearVideoRaw;
  const frontVideoSummary = Array.isArray(frontVideoRaw)
    ? frontVideoRaw.slice(0, 2).join(", ")
    : frontVideoRaw;
  const getSectionTone = (score) => {
    const value = Number(score);
    if (!Number.isFinite(value)) return "Balanced";
    if (value >= 95) return "Top-tier";
    if (value >= 90) return "Strong";
    if (value >= 80) return "Balanced";
    return "Basic";
  };
  const getSectionDescription = (sectionKey, score) => {
    const tone = getSectionTone(score);
    switch (sectionKey) {
      case "performance":
        return `${tone} processing setup for app handling, multitasking, and stable daily speed.`;
      case "display":
        return `${tone} display quality for media viewing, readability, and smoother interaction.`;
      case "camera":
        return `${tone} rear camera setup for daylight details and flexible shooting modes.`;
      case "camera-front":
        return `${tone} front camera quality for selfies, social uploads, and video calls.`;
      case "battery":
        return `${tone} battery and charging setup for longer screen time and quick top-ups.`;
      default:
        return `${tone} section-level hardware profile.`;
    }
  };

  const normalizePointText = (value) => {
    if (!hasContent(value)) return null;
    const text = String(formatSpecValue(value, "")).replace(/\s+/g, " ").trim();
    return hasContent(text) ? text : null;
  };

  const toUniquePoints = (values = []) => {
    const seen = new Set();
    return values
      .map((value) => normalizePointText(value))
      .filter((value) => {
        if (!hasContent(value)) return false;
        const key = String(value).toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  };

  const formatMemoryPoint = (value, label) => {
    const text = normalizePointText(value);
    if (!text) return null;

    let out = text.replace(/(\d)\s*(gb|mb|tb)\b/gi, "$1 $2");
    if (/^\d+(\.\d+)?$/i.test(out)) out = `${out} GB`;

    return new RegExp(`\\b${label}\\b`, "i").test(out)
      ? out
      : `${out} ${label}`;
  };

  const withPrefix = (value, prefix) => {
    const text = normalizePointText(value);
    if (!text) return null;
    return new RegExp(`^${prefix}\\b`, "i").test(text)
      ? text
      : `${prefix}: ${text}`;
  };

  const formatRefreshRatePoint = (value) => {
    const text = normalizePointText(value);
    if (!text) return null;
    if (/refresh rate/i.test(text)) return text;
    if (/hz/i.test(text)) return `${text} refresh rate`;
    return `Refresh rate: ${text}`;
  };

  const performanceRamPoint = formatMemoryPoint(
    currentVariant?.ram || mobileData?.performance?.ram,
    "RAM",
  );
  const performanceStoragePoint = formatMemoryPoint(
    currentVariant?.storage ||
      mobileData?.performance?.storage ||
      mobileData?.performance?.ROM_storage,
    "Storage",
  );

  const frontCameraModePoint = frontCamera?.focus
    ? withPrefix(frontCamera.focus, "Focus")
    : frontCamera?.autofocus
      ? withPrefix(frontCamera.autofocus, "Autofocus")
      : frontCamera?.type
        ? withPrefix(frontCamera.type, "Type")
        : null;

  const highlightIconMap = {
    performance: { Icon: FaBolt, color: "text-yellow-500" },
    display: { Icon: FaExpand, color: "text-green-500" },
    camera: { Icon: FaCamera, color: "text-purple-500" },
    "camera-front": { Icon: FaCamera, color: "text-pink-500" },
    battery: { Icon: FaBatteryFull, color: "text-orange-500" },
  };

  const infoKeySections = [
    {
      key: "performance",
      scoreKey: "performance",
      title: "Performance",
      score: getSectionScore("performance"),
      description: getSectionDescription(
        "performance",
        getSectionScore("performance"),
      ),
      points: toUniquePoints([
        mobileData?.performance?.processor || mobileData?.processor,
        withPrefix(mobileData?.performance?.cpu_clock_speed, "Clock speed"),
        performanceRamPoint,
        performanceStoragePoint,
        withPrefix(mobileData?.performance?.gpu, "GPU"),
        withPrefix(
          mobileData?.performance?.operating_system ||
            mobileData?.performance?.os,
          "OS",
        ),
      ]),
    },
    {
      key: "display",
      scoreKey: "display",
      title: "Display",
      score: getSectionScore("display"),
      description: getSectionDescription("display", getSectionScore("display")),
      points: toUniquePoints([
        [mobileData?.display?.size, mobileData?.display?.panel]
          .filter(Boolean)
          .join(" | "),
        withPrefix(mobileData?.display?.resolution, "Resolution"),
        formatRefreshRatePoint(mobileData?.display?.refresh_rate),
        withPrefix(mobileData?.display?.touch_sampling_rate, "Touch sampling"),
        withPrefix(mobileData?.display?.pixel_density, "Pixel density"),
        withPrefix(mobileData?.display?.protection, "Protection"),
      ]),
    },
    {
      key: "camera",
      scoreKey: "camera",
      title: "Rear Camera",
      score: getSectionScore("camera"),
      description: getSectionDescription("camera", getSectionScore("camera")),
      points: toUniquePoints([
        getMainCameraMp(mobileData) != null
          ? `${getMainCameraMp(mobileData)} MP main camera`
          : rearMainCamera?.resolution,
        rearUltraCamera?.resolution
          ? `${rearUltraCamera.resolution} ultra-wide`
          : null,
        rearTeleCamera?.resolution
          ? `${rearTeleCamera.resolution} telephoto`
          : null,
        rearVideoSummary ? `Video: ${rearVideoSummary}` : null,
        withPrefix(rearMainCamera?.aperture, "Aperture"),
        withPrefix(rearMainCamera?.sensor, "Sensor"),
      ]),
    },
    {
      key: "camera-front",
      scoreKey: "camera",
      title: "Front Camera",
      score: getSectionScore("camera"),
      description: getSectionDescription(
        "camera-front",
        getSectionScore("camera"),
      ),
      points: toUniquePoints([
        frontCamera?.resolution
          ? `${frontCamera.resolution} selfie camera`
          : null,
        frontCameraModePoint,
        frontVideoSummary ? `Video: ${frontVideoSummary}` : null,
        withPrefix(frontCamera?.aperture, "Aperture"),
        withPrefix(frontCamera?.sensor, "Sensor"),
      ]),
    },
    {
      key: "battery",
      scoreKey: "battery",
      title: "Battery",
      score: getSectionScore("battery"),
      description: getSectionDescription("battery", getSectionScore("battery")),
      points: toUniquePoints([
        getBatteryCapacityMah(mobileData) != null
          ? `${getBatteryCapacityMah(mobileData)} mAh`
          : getBatteryCapacityRaw(mobileData),
        withPrefix(
          mobileData?.battery?.charging_power ||
            mobileData?.battery?.fast_charging,
          "Charging",
        ),
        withPrefix(mobileData?.battery?.battery_type, "Type"),
        withPrefix(
          mobileData?.battery?.rated_capacity ||
            mobileData?.battery?.ratedCapacity,
          "Rated",
        ),
        withPrefix(
          mobileData?.battery?.wireless_charging ||
            mobileData?.battery?.wireless,
          "Wireless",
        ),
      ]),
    },
  ].filter((section) => section.points.length > 0);

  // If initial loading state (no mobileData yet), render spinner now
  if (showInitialLoading) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-white rounded-lg p-8 text-center">
          <Spinner />
          <div className="text-sm text-gray-500 mt-3">Please waitâ€¦</div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-2 lg:px-4 mx-auto bg-white max-w-4xl w-full m-0">
      <Helmet>
        <title>{metaTitleWithDate}</title>
        <meta name="description" content={metaDescription} />
        {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
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
        {productJsonLd ? (
          <script type="application/ld+json">{productJsonLd}</script>
        ) : null}
      </Helmet>
      {isSharedLink && (
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 rounded">
            Shared link detected â€” showing the shared product details.
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
                Ã—
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
                <FaFacebook className="text-xl text-purple-400" />
                Share on Facebook
              </button>
              <button
                onClick={shareToTwitter}
                className="w-full flex items-center gap-3 p-3 bg-purple-50 hover:bg-purple-100 rounded-lg text-purple-400 font-medium"
              >
                <FaTwitter className="text-xl text-purple-400" />
                Share on Twitter
              </button>
              <button
                onClick={shareViaEmail}
                className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-700 font-medium"
              >
                <FaEnvelope className="text-xl" />
                Share via Email
              </button>
              {/* Copy link removed â€” share-only option provided above */}
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

      <div className="bg-white">
        {/* Mobile Header */}
        <div className="p-4 bg-white border-b border-gray-200 lg:hidden">
          <div className="flex justify-between items-start mb-2">
            <div>
              {headerDescriptor ? (
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 mb-1">
                  {headerDescriptor}
                </p>
              ) : null}
              <h1 className="text-xl font-extrabold tracking-tight mb-1 text-gray-900 leading-tight">
                {headerTitle}
              </h1>
              <p className="text-purple-700 text-sm font-medium flex flex-wrap items-center gap-2">
                {currentVariantLabel ? (
                  <span>{currentVariantLabel}</span>
                ) : null}
                {launchStatus === "upcoming" ? (
                  <span
                    className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold leading-none ${launchStatusBadgeClass}`}
                  >
                    {launchStatusLabel}
                  </span>
                ) : null}
                {mobileData?.isAiPhone ? (
                  <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-gradient-to-r from-purple-50 to-blue-100 px-2 py-0.5 text-[10px] font-semibold leading-none text-purple-700 ring-1 ring-purple-200">
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
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleFavorite}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <FaHeart
                  className={`text-lg ${
                    isFavorite
                      ? "text-violet-400 fill-current"
                      : "text-violet-400"
                  }`}
                />
              </button>
              <button
                onClick={handleShare}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <FaShareAlt className="text-lg text-violet-400" />
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

        {/* Top Tabs Section */}
        <div ref={primaryTabsSentinelRef} className="h-px" />
        {isPrimaryTabsSticky && primaryTabsHeight ? (
          <div style={{ height: `${primaryTabsHeight}px` }} />
        ) : null}
        <div
          ref={primaryTabsRef}
          className={
            isPrimaryTabsSticky
              ? "fixed left-0 right-0 z-40 top-[var(--mobile-header-height,0px)] md:top-[var(--desktop-header-height,0px)]"
              : "sticky z-20 top-[var(--mobile-header-height,0px)] md:top-[var(--desktop-header-height,0px)]"
          }
        >
          <div
            className={`mx-auto max-w-4xl w-full ${
              isPrimaryTabsSticky ? "px-2 lg:px-4" : ""
            }`}
          >
            <div className="border-y border-slate-200 bg-white">
              <div className="flex overflow-x-auto no-scrollbar bg-white">
                {primaryTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActivePrimaryTab(tab.id)}
                    className={`relative px-4 py-3 font-semibold text-xs uppercase tracking-wide whitespace-nowrap transition-colors duration-200 flex-shrink-0 focus-visible:outline-none ${
                      activePrimaryTab === tab.id
                        ? "bg-white"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <span
                      className={
                        activePrimaryTab === tab.id
                          ? "bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600 bg-clip-text text-transparent"
                          : ""
                      }
                    >
                      {tab.label}
                    </span>
                    {activePrimaryTab === tab.id ? (
                      <span className="pointer-events-none absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600" />
                    ) : null}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {activePrimaryTab === "info" ? (
          <>
            <div className="flex flex-col lg:flex-row">
              {/* Images Section */}
              <div className="lg:w-2/5 p-4 border-b lg:border-b-0 lg:border-r border-slate-200">
                {/* Main Image */}
                <div className="bg-gray-100 rounded-md p-6 mb-4 relative">
                  <div className="absolute left-2 top-2 z-10 pointer-events-none">
                    <SpecScoreBadge
                      score={
                        scoreSummary.overallDisplay ?? scoreSummary.overall
                      }
                      size={40}
                      showSpecLabel
                      zeroFallback
                    />
                  </div>
                  <img
                    src={
                      mobileData.images?.[activeImage] ||
                      "/placeholder-image.jpg"
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
                      className="p-2  hover:shadow-lg"
                    >
                      <FaHeart
                        className={`${
                          isFavorite
                            ? "text-gray-500 fill-current"
                            : "text-gray-500"
                        }`}
                      />
                    </button>
                    <button
                      onClick={handleShare}
                      className="p-2  hover:shadow-lg"
                    >
                      <FaShare className="text-gray-500" />
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
                            ? "bg-gray-100 rounded-lg border-slate-300"
                            : "border-slate-200 hover:border-slate-300"
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
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-purple-100 hover:bg-purple-200 text-gray-600 rounded-lg font-medium"
                  >
                    <FaShareAlt className="text-gray-500" />
                    <span>Share</span>
                  </button>
                </div>

                {variants && variants.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-800 mb-2">
                      Available Variants
                    </h4>
                    <div className="grid grid-cols-2 gap-2.5">
                      {variants.map((variant, index) => (
                        <button
                          key={variant.variant_id ?? variant.id ?? index}
                          onClick={() => setSelectedVariant(index)}
                          aria-pressed={selectedVariant === index}
                          className={`relative p-2.5 rounded-xl border text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${
                            selectedVariant === index
                              ? "border-violet-600 bg-violet-50 shadow-sm"
                              : "border-slate-200 bg-white hover:border-violet-300 hover:bg-violet-50/40"
                          }`}
                        >
                          {selectedVariant === index ? (
                            <span className="absolute top-2 right-2 inline-flex items-center justify-center w-4 h-4 rounded-full bg-violet-600 text-white">
                              <FaCheck className="text-[9px]" />
                            </span>
                          ) : null}
                          <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                            <FaMemory className="text-gray-600 text-sm" />
                            <span className="leading-tight">
                              {variant.ram} / {variant.storage}
                            </span>
                          </div>
                          <div className="mt-1 text-sm font-bold text-green-600">
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
                      {headerDescriptor ? (
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-1">
                          {headerDescriptor}
                        </p>
                      ) : null}
                      <h1 className="text-2xl font-extrabold tracking-tight mb-2">
                        {headerTitle}
                      </h1>
                      <h4 className="text-purple-700 mb-3 font-medium text-sm flex items-center gap-2">
                        {currentVariantLabel ? (
                          <span>{currentVariantLabel}</span>
                        ) : null}
                        {launchStatus === "upcoming" ? (
                          <span
                            className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold leading-none ${launchStatusBadgeClass}`}
                          >
                            {launchStatusLabel}
                          </span>
                        ) : null}
                        {mobileData?.isAiPhone ? (
                          <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-gradient-to-r from-purple-50 to-blue-100 px-2 py-0.5 text-[10px] font-semibold leading-none text-purple-700 ring-1 ring-purple-200">
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
                              ? "text-gray-500 fill-current"
                              : "text-gray-500"
                          }`}
                        />
                      </button>
                      <button
                        onClick={handleShare}
                        className="p-2 rounded-full hover:bg-gray-100"
                        title="Share"
                      >
                        <FaShareAlt className="text-xl text-gray-500" />
                      </button>
                      {/* Copy link removed â€” share-only */}
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

                {/* Ratings Card removed from details column â€” rendered below tabs */}

                {/* Store Prices Section */}
                {sortedStores.length > 0 && (
                  <div className="mb-5 mt-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <FaStore className="text-green-500" />
                        Check Price On
                      </h3>
                      {storeAvailabilityState.mode === "live" &&
                        sortedStores.length > 3 && (
                          <button
                            onClick={() => setShowAllStores(!showAllStores)}
                            className="text-purple-600 text-sm font-medium flex items-center gap-1"
                          >
                            {showAllStores ? "Show Less" : "View All"}
                            <FaChevronDown
                              className={`text-xs text-purple-400 transition-transform ${
                                showAllStores ? "rotate-180" : ""
                              }`}
                            />
                          </button>
                        )}
                    </div>

                    <div className="space-y-3">
                      {displayedStores.map((store, index) => {
                        const isActive =
                          String(store.id) === String(activeStoreId);
                        const hasStoreUrl = Boolean(store.url);
                        const logoSrc = store.is_prebooking
                          ? store.brand_logo ||
                            mobileData?.brand_logo ||
                            mobileData?.brandLogo ||
                            getLogo("")
                          : getLogo(store.store_name);
                        const storeTitle =
                          store.display_store_name ||
                          store.store_name ||
                          mobileData?.brand ||
                          "Store";
                        const ctaText = store.cta_label || "Buy Now";
                        const isPreorderCta = /^pre(book|order)$/i.test(
                          String(ctaText).trim(),
                        );
                        return (
                          <div
                            key={store.id || index}
                            className={` border rounded-xl p-2.5 transition-all duration-200 bg-purple-50 ${
                              isActive
                                ? "border-violet-500 ring-2 ring-violet-200  bg-violet-50/40"
                                : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              {/* Store Info */}
                              <div className="flex items-center gap-2.5 flex-1 px-1">
                                <div
                                  className={` flex items-center justify-center p-2">
                                    isPreorderCta
                                      ? "w-11 h-11 rounded-lg"
                                      : "w-10 h-10 rounded-md"
                                  }`}
                                >
                                  <img
                                    src={logoSrc}
                                    alt={storeTitle}
                                    className="w-full h-full object-contain "
                                    onError={(e) => {
                                      e.target.src = getLogo("");
                                    }}
                                  />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-bold text-gray-900 text-sm capitalize">
                                    {storeTitle}
                                  </h4>
                                  {store.availability_note ? (
                                    <p className="text-[11px] text-gray-500">
                                      {store.availability_note}
                                    </p>
                                  ) : (
                                    <p className="text-[11px] text-gray-500">
                                      {store.variantRam} /{" "}
                                      {store.variantStorage}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Price & CTA */}
                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <div className="text-sm font-bold text-green-600">
                                    ₹ {formatPrice(store.price)}
                                  </div>
                                </div>
                                {hasStoreUrl ? (
                                  <a
                                    href={store.url}
                                    target="_blank"
                                    rel="noopener noreferrer nofollow"
                                    className="inline-flex rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 p-[1px] transition-all duration-200 hover:shadow-md"
                                  >
                                    <span className="inline-flex items-center gap-1.5 rounded-[7px] bg-white px-3 py-1.5 text-xs font-semibold">
                                      {isPreorderCta ? (
                                        <FaShoppingCart className="text-[11px] text-violet-400" />
                                      ) : (
                                        <FaExternalLinkAlt className="text-[11px] text-violet-400" />
                                      )}
                                      <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                                        {ctaText}
                                      </span>
                                    </span>
                                  </a>
                                ) : (
                                  <span
                                    aria-disabled="true"
                                    className={`inline-flex cursor-not-allowed items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${
                                      isPreorderCta
                                        ? "bg-violet-100 text-violet-700"
                                        : "bg-gray-200 text-gray-500"
                                    }`}
                                  >
                                    {isPreorderCta ? (
                                      <FaShoppingCart className="text-xs" />
                                    ) : (
                                      <FaExternalLinkAlt className="text-xs" />
                                    )}
                                    {isPreorderCta ? ctaText : "Unavailable"}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {infoKeySections.length > 0 ? (
                  <div className="mt-5  p-3 sm:p-4 ">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200/70">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 tracking-tight">
                          Highlighted Specs
                        </h3>
                      </div>
                      {hasContent(infoOsSummary) ? (
                        <span className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-medium text-violet-700">
                          {formatSpecValue(infoOsSummary, "OS")}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-3 space-y-3">
                      {infoKeySections.map((section) => (
                        <div
                          key={section.key}
                          className=" bg-white py-3 sm:px-4 sm:py-3  transition-all duration-200 "
                        >
                          {(() => {
                            const iconMeta = highlightIconMap[section.key];
                            const Icon = iconMeta?.Icon;
                            return (
                              <div className="flex items-center gap-3">
                                <div className="min-w-0">
                                  <div className="flex items-center">
                                    {Icon ? (
                                      <Icon
                                        className={`mr-2 text-[14px] ${iconMeta.color}`}
                                      />
                                    ) : null}
                                    <h4 className="text-base font-semibold text-slate-900">
                                      {section.title}
                                    </h4>
                                  </div>
                                </div>
                                <div className="h-px flex-1 bg-gradient-to-r from-slate-200 via-slate-300/70 to-slate-200" />
                                <div className="flex shrink-0 items-center gap-0.5">
                                  <SpecScoreBadge
                                    score={section.score}
                                    size={32}
                                  />
                                </div>
                              </div>
                            );
                          })()}
                          <ul className="mt-2 space-y-2 px-1 sm:px-2">
                            {section.points.map((point, idx) => (
                              <li
                                key={idx}
                                className="flex items-start gap-2.5 text-[14px] text-slate-700 leading-relaxed"
                              >
                                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />
                                <span className="tracking-tight">
                                  {formatSpecValue(point, section.title)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </>
        ) : null}

        {activePrimaryTab === "specs" ? (
          <div className="border-t border-slate-200">
            <div className="flex overflow-x-auto no-scrollbar border-b border-slate-200 bg-white">
              {availableTabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    className={`group relative flex items-center gap-2 px-4 py-3 font-medium text-sm whitespace-nowrap transition-colors duration-200 flex-shrink-0 focus-visible:outline-none ${
                      activeTab === tab.id
                        ? "bg-white"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <IconComponent
                      className={`text-sm ${
                        activeTab === tab.id
                          ? "text-violet-400"
                          : "text-gray-500 group-hover:text-gray-700"
                      }`}
                    />
                    <span
                      className={
                        activeTab === tab.id
                          ? "bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600 bg-clip-text text-transparent"
                          : ""
                      }
                    >
                      {tab.label}
                    </span>
                    {activeTab === tab.id ? (
                      <span className="pointer-events-none absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600" />
                    ) : null}
                  </button>
                );
              })}
            </div>
            <div className="p-2 sm:p-3">{renderTabContent()}</div>
          </div>
        ) : null}

        {activePrimaryTab === "competitors" ? (
          <div className="p-2 sm:p-3 border-t border-slate-200">
            <CompetitorCards
              title={
                mobileData?.name
                  ? `Competitors For ${mobileData.name}`
                  : "Top Competitors"
              }
              productName={
                mobileData?.name || mobileData?.model || "This Device"
              }
              productId={currentProductId}
              onCompare={handlePopularCompare}
              fallbackCompetitors={popularComparisonTargets}
              currentBrand={mobileData?.brand || ""}
              currentPrice={
                currentVariant?.base_price ?? mobileData?.price ?? null
              }
              maxCards={10}
            />
          </div>
        ) : null}
      </div>
      {activePrimaryTab === "info" ? (
        <div className="w-full bg-white">
          <CompetitorCards
            title={
              mobileData?.name
                ? `Competitors For ${mobileData.name}`
                : "Top Competitors"
            }
            productName={mobileData?.name || mobileData?.model || "This Device"}
            productId={currentProductId}
            onCompare={handlePopularCompare}
            fallbackCompetitors={popularComparisonTargets}
            currentBrand={mobileData?.brand || ""}
            currentPrice={
              currentVariant?.base_price ?? mobileData?.price ?? null
            }
            maxCards={10}
            className="w-full"
          />
          <RecommendedSmartphones />
          <ProductDiscoverySections
            productId={currentProductId}
            currentBrand={mobileData?.brand || ""}
            className="w-full"
          />
        </div>
      ) : null}
    </div>
  );
};

export default MobileDetailCard;
