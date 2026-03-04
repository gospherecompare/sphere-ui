// src/components/MobileCompare.jsx
import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  X,
  Cpu,
  Camera,
  Battery,
  Wifi,
  Music,
  Smartphone,
  Monitor,
  MemoryStick,
  Zap,
  Headphones,
  ChevronRight,
  Plus,
  Trash2,
  BarChart3,
  Star,
  ChevronLeft,
  ChevronRight as RightArrow,
  Smartphone as PhoneIcon,
  Sparkles,
  Filter,
  Share2,
  AlertCircle,
  Package,
  HardDrive,
  DollarSign,
  Info,
} from "lucide-react";
import {
  FaBatteryFull,
  FaBolt,
  FaCamera,
  FaMobileAlt,
  FaRobot,
  FaSignal,
  FaTachometerAlt,
  FaTimes,
  FaWifi,
} from "react-icons/fa";
import "../styles/hideScrollbar.css";
import useDevice from "../hooks/useDevice";
import { useLocation, useNavigate } from "react-router-dom";
import normalizeProduct from "../utils/normalizeProduct";
import { Helmet } from "react-helmet-async";

const SECTIONS = [
  {
    id: "overview",
    label: "Overview",
    icon: Smartphone,
    color: "blue",
  },
  {
    id: "display",
    label: "Display",
    icon: Monitor,
    color: "purple",
  },
  {
    id: "camera",
    label: "Camera",
    icon: Camera,
    color: "pink",
  },
  {
    id: "performance",
    label: "Performance",
    icon: Cpu,
    color: "green",
  },
  {
    id: "battery",
    label: "Battery",
    icon: Battery,
    color: "amber",
  },
  {
    id: "network",
    label: "Network",
    icon: Wifi,
    color: "indigo",
  },
  {
    id: "audio",
    label: "Audio",
    icon: Headphones,
    color: "cyan",
  },
  {
    id: "features",
    label: "Features",
    icon: Zap,
    color: "orange",
  },
];

const MAX_DEVICES = 4;
const MIN_DEVICES = 2;
const SITE_ORIGIN = "https://tryhook.shop";

const normalizeVariantIndex = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
};

const isDigitsOnly = (value = "") => /^\d+$/.test(String(value || "").trim());

const dedupeCompareEntries = (entries = []) => {
  const seen = new Set();
  const output = [];
  for (const entry of entries) {
    const baseId = String(entry?.baseId || "").trim();
    if (!baseId) continue;
    const variantIndex = normalizeVariantIndex(entry?.variantIndex ?? 0);
    const key = `${baseId}:${variantIndex}`;
    if (seen.has(key)) continue;
    seen.add(key);
    output.push({ baseId, variantIndex });
  }
  return output;
};

const parseCompareDevicesParam = (value = "") => {
  if (!value) return [];
  const parts = String(value)
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  const entries = parts.map((part) => {
    const [baseIdRaw, variantRaw] = part.split(":");
    const baseId = String(baseIdRaw || "").trim();
    if (!baseId) return null;
    return {
      baseId,
      variantIndex: normalizeVariantIndex(variantRaw ?? 0),
    };
  });

  return dedupeCompareEntries(entries.filter(Boolean));
};

const sortCompareEntries = (left, right) => {
  const leftId = String(left?.baseId || "");
  const rightId = String(right?.baseId || "");

  if (isDigitsOnly(leftId) && isDigitsOnly(rightId)) {
    const diff = Number(leftId) - Number(rightId);
    if (diff !== 0) return diff;
  } else {
    const diff = leftId.localeCompare(rightId);
    if (diff !== 0) return diff;
  }

  return (
    normalizeVariantIndex(left?.variantIndex) -
    normalizeVariantIndex(right?.variantIndex)
  );
};

const stringifyCompareDevicesParam = (entries = []) =>
  dedupeCompareEntries(entries)
    .map((entry) => `${entry.baseId}:${normalizeVariantIndex(entry.variantIndex)}`)
    .join(",");

const upsertMetaTag = (selector, attributes) => {
  if (typeof document === "undefined") return;
  let tag = document.head.querySelector(selector);
  if (!tag) {
    tag = document.createElement("meta");
    document.head.appendChild(tag);
  }
  Object.entries(attributes || {}).forEach(([key, value]) => {
    if (value == null) return;
    tag.setAttribute(key, String(value));
  });
};

const upsertCanonicalLink = (href) => {
  if (typeof document === "undefined" || !href) return;
  let link = document.head.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.setAttribute("href", href);
};

const getResolvedProductId = (device) =>
  device?.productId ||
  device?.product_id ||
  device?.id ||
  device?.smartphoneId ||
  device?.model ||
  null;

const getResolvedProductType = (device) =>
  device?.productType || device?.deviceType || device?.product_type || null;

const SCORING_GLOSSARY = {
  chipset:
    "Chipset is the main processor family. Newer flagship tiers are scored higher.",
  refreshRate:
    "Refresh rate (Hz) means how many times screen updates per second. Higher is smoother.",
  panelType:
    "Panel type (AMOLED, OLED, IPS) affects contrast, colors, and viewing quality.",
  megapixels:
    "Main camera megapixels indicate sensor resolution. It is one factor, not full photo quality.",
  sensorCount:
    "Camera sensor count estimates lens versatility (main, ultrawide, telephoto, etc.).",
  batteryCapacity:
    "Battery capacity is measured in mAh. Larger battery usually means longer usage.",
  priceValue:
    "Value score compares spec strength against current selected variant price.",
};

const QUICK_FILTER_CHIPS = [
  { id: "wireless", label: "Wireless", icon: FaSignal },
  { id: "highMpCamera", label: "High MP Camera", icon: FaCamera },
  { id: "fiveG", label: "5G", icon: FaMobileAlt },
  { id: "fastCharge", label: "Fast Charge", icon: FaBolt },
  { id: "aiFeatures", label: "AI Features", icon: FaRobot },
  { id: "longBattery", label: "Long Battery", icon: FaBatteryFull },
  { id: "amoled", label: "AMOLED", icon: FaMobileAlt },
  { id: "refresh120", label: "120Hz+", icon: FaTachometerAlt },
  { id: "wifi", label: "Wi-Fi", icon: FaWifi },
];

const MobileCompare = () => {
  const [selectedDevices, setSelectedDevices] = useState([]);
  const [comparedDevices, setComparedDevices] = useState([]);
  const [variantSelection, setVariantSelection] = useState({});
  const [rankingByDeviceId, setRankingByDeviceId] = useState({});
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isComparing, setIsComparing] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [sharedDescription, setSharedDescription] = useState("");
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [modalDevice, setModalDevice] = useState(null);
  const [modalSection, setModalSection] = useState("specifications");
  const [trendSignalsByProductId, setTrendSignalsByProductId] = useState({});
  const [compareSignalsByProductId, setCompareSignalsByProductId] = useState(
    {},
  );
  const [signalsFetched, setSignalsFetched] = useState(false);
  const [activeQuickFilter, setActiveQuickFilter] = useState("all");

  const {
    devices: availableDevices = [],
    loading,
    fetchDevice,
    getDevice,
    setDevice,
  } = useDevice();
  const location = useLocation();
  const navigate = useNavigate();

  const activeDevices = isComparing ? comparedDevices : selectedDevices;
  const usedSlots = isComparing
    ? comparedDevices.length + selectedDevices.length
    : selectedDevices.length;
  const remainingSlots = Math.max(0, MAX_DEVICES - usedSlots);

  const queryDeviceEntries = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return parseCompareDevicesParam(params.get("devices"));
  }, [location.search]);

  const activeCompareEntries = useMemo(() => {
    if (activeDevices.length > 0) {
      const entries = activeDevices
        .map((device) => {
          const baseIdRaw =
            device?.baseId ??
            device?.productId ??
            device?.product_id ??
            device?.id ??
            device?.model ??
            "";
          const baseId = String(baseIdRaw || "").trim();
          if (!baseId) return null;

          const variantIndex = normalizeVariantIndex(
            variantSelection[device.id] ?? device.selectedVariantIndex ?? 0,
          );

          return { baseId, variantIndex };
        })
        .filter(Boolean);

      return dedupeCompareEntries(entries);
    }

    return queryDeviceEntries;
  }, [activeDevices, queryDeviceEntries, variantSelection]);

  const canonicalCompareEntries = useMemo(() => {
    const entries = [...activeCompareEntries];
    entries.sort(sortCompareEntries);
    return entries;
  }, [activeCompareEntries]);

  const canonicalDevicesParam = useMemo(
    () => stringifyCompareDevicesParam(canonicalCompareEntries),
    [canonicalCompareEntries],
  );

  const canonicalComparePath = useMemo(() => {
    const basePath = location.pathname || "/compare";
    if (!canonicalDevicesParam) return basePath;
    const params = new URLSearchParams();
    params.set("devices", canonicalDevicesParam);
    return `${basePath}?${params.toString()}`;
  }, [location.pathname, canonicalDevicesParam]);

  const canonicalCompareUrl = useMemo(
    () => `${SITE_ORIGIN}${canonicalComparePath}`,
    [canonicalComparePath],
  );

  useEffect(() => {
    const currentParams = new URLSearchParams(location.search);
    const currentDevicesParam = stringifyCompareDevicesParam(
      parseCompareDevicesParam(currentParams.get("devices")),
    );

    const nextParams = new URLSearchParams(location.search);
    if (canonicalDevicesParam) nextParams.set("devices", canonicalDevicesParam);
    else nextParams.delete("devices");

    const compareType = getResolvedProductType(activeDevices?.[0]);
    if (compareType) nextParams.set("type", String(compareType));
    else nextParams.delete("type");

    const nextSearch = nextParams.toString();
    const nextUrl = `${location.pathname}${nextSearch ? `?${nextSearch}` : ""}`;
    const currentUrl = `${location.pathname}${location.search}`;

    const hasDeviceParamChanged = currentDevicesParam !== canonicalDevicesParam;
    const hasTypeChanged =
      String(currentParams.get("type") || "") !== String(compareType || "");

    if (!hasDeviceParamChanged && !hasTypeChanged) return;
    if (nextUrl === currentUrl) return;

    navigate(nextUrl, { replace: true });
  }, [
    activeDevices,
    canonicalDevicesParam,
    location.pathname,
    location.search,
    navigate,
  ]);

  // If navigation state provides an initialProduct, use it immediately
  useEffect(() => {
    try {
      const initial = location.state?.initialProduct;
      if (!initial) return;

      const typeVal =
        initial.productType || initial.deviceType || initial.product_type || "";
      const normalized = normalizeProduct(initial, typeVal);
      const deviceObj = { ...initial, ...normalized };

      const resolvedProductId = deviceObj.productId || null;
      const resolvedType = deviceObj.productType || null;
      const resolvedName =
        deviceObj.name || deviceObj.model || deviceObj.title || null;

      const id = `${resolvedProductId}`;
      const entry = {
        ...deviceObj,
        id,
        productId: resolvedProductId,
        baseId: resolvedProductId,
        productType: resolvedType,
        name: resolvedName,
        selectedVariantIndex: 0,
      };

      setSelectedDevices((prev) => {
        if (prev.some((p) => String(p.id) === String(entry.id))) return prev;
        return [entry, ...prev];
      });
      setVariantSelection((vs) => ({ ...vs, [entry.id]: 0 }));

      // Remove initialProduct from history (prevent re-processing on navigation)
      try {
        navigate(location.pathname, { replace: true });
      } catch (e) {}
    } catch (err) {
      // defensive
    }
    // run when navigation state changes
  }, [location.state]);

  // Record comparison on initial render when URL/devices present
  useEffect(() => {
    try {
      // Parse devices from URL or current selectedDevices once comparison starts
      const params = new URLSearchParams(location.search);
      const devicesParam = params.get("devices");
      // If there is a devices param, it contains entries like "<id>:<variant>"
      const ids = [];
      const fallbackDevices = isComparing ? comparedDevices : selectedDevices;

      // Only proceed automatically if URL contains devices OR the comparison UI is active
      if (!devicesParam && !isComparing) return;

      if (devicesParam) {
        const parts = devicesParam
          .split(",")
          .map((p) => p.trim())
          .filter(Boolean);
        parts.forEach((part) => {
          const [idOrModel] = part.split(":");
          const n = Number(idOrModel);
          if (Number.isInteger(n) && n > 0) ids.push(n);
        });
      } else if (fallbackDevices && fallbackDevices.length >= 2) {
        // fallback to currently selected devices in the UI
        fallbackDevices.forEach((d) => {
          const baseId = d.baseId ?? d.id;
          const n = Number(baseId);
          if (Number.isInteger(n) && n > 0) ids.push(n);
        });
      }

      if (ids.length < 2) return;

      // Use only first two ids for recording a pairwise compare on page load
      const [aRaw, bRaw] = [ids[0], ids[1]];
      if (!aRaw || !bRaw) return;
      const [l, r] = [Number(aRaw), Number(bRaw)].sort((x, y) => x - y);
      const sessionKey = `compare_${l}_${r}`;
      if (
        typeof sessionStorage !== "undefined" &&
        sessionStorage.getItem(sessionKey)
      )
        return;

      // Post the normalized comparison to backend
      (async () => {
        try {
          await fetch(`https://api.apisphere.in/api/public/compare`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              left_product_id: l,
              right_product_id: r,
              product_type:
                fallbackDevices[0]?.productType ||
                fallbackDevices[0]?.deviceType ||
                fallbackDevices[0]?.product_type ||
                null,
            }),
          });
        } catch (err) {
          // ignore network errors
        }

        try {
          if (typeof sessionStorage !== "undefined")
            sessionStorage.setItem(sessionKey, "true");
        } catch (err) {}
      })();
    } catch (err) {
      // defensive
    }
    // Run when location.search changes or when comparison UI is activated
  }, [location.search, isComparing, comparedDevices, selectedDevices]);

  // Build a list of candidate items: one entry per variant. Each item has { base, variantIndex, variant }
  const filteredDevices = useMemo(() => {
    const parseNumber = (input) => {
      if (typeof input === "number" && Number.isFinite(input)) return input;
      if (typeof input !== "string") return null;
      const match = input.replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
      if (!match) return null;
      const parsed = Number(match[1]);
      return Number.isFinite(parsed) ? parsed : null;
    };

    const mergeObjects = (...objects) =>
      objects.reduce((acc, obj) => {
        if (obj && typeof obj === "object" && !Array.isArray(obj)) {
          return { ...acc, ...obj };
        }
        return acc;
      }, {});

    const toLowerBlob = (value) => {
      if (value == null) return "";
      if (Array.isArray(value)) {
        return value.map((entry) => toLowerBlob(entry)).join(" ");
      }
      if (typeof value === "object") {
        return Object.values(value)
          .map((entry) => toLowerBlob(entry))
          .join(" ");
      }
      return String(value).toLowerCase();
    };

    const readMainCameraMp = (camera) => {
      const direct = parseNumber(camera?.main_camera_megapixels);
      if (direct) return direct;

      const rear = camera?.rear_camera;
      if (!rear) return null;

      if (typeof rear === "string") {
        return parseNumber(rear);
      }

      if (typeof rear === "object") {
        let highest = null;
        Object.values(rear).forEach((lensSpec) => {
          if (lensSpec == null) return;
          if (typeof lensSpec === "object" && !Array.isArray(lensSpec)) {
            const candidate =
              parseNumber(lensSpec?.resolution) ||
              parseNumber(lensSpec?.megapixels) ||
              parseNumber(lensSpec?.main_camera_megapixels);
            if (candidate && (highest == null || candidate > highest)) {
              highest = candidate;
            }
            return;
          }
          const candidate = parseNumber(lensSpec);
          if (candidate && (highest == null || candidate > highest)) {
            highest = candidate;
          }
        });
        return highest;
      }

      return null;
    };

    const readChargingWatt = (battery) => {
      const explicit =
        parseNumber(battery?.charging_speed_watt) ||
        parseNumber(battery?.fast_charging_watt) ||
        parseNumber(battery?.charging_wattage) ||
        parseNumber(battery?.wired_charging);
      if (explicit) return explicit;

      const chargingText = [
        battery?.charging,
        battery?.charging_speed,
        battery?.fast_charging,
        battery?.charging_tech,
      ]
        .filter(Boolean)
        .join(" ");
      const wattMatch = chargingText.match(/(\d+(?:\.\d+)?)\s*w/i);
      if (!wattMatch) return null;
      const watt = Number(wattMatch[1]);
      return Number.isFinite(watt) ? watt : null;
    };

    const readRefreshRate = (display) => {
      const explicit =
        parseNumber(display?.refresh_rate) ||
        parseNumber(display?.max_refresh_rate) ||
        parseNumber(display?.screen_refresh_rate) ||
        parseNumber(display?.refreshRate);
      if (explicit) return explicit;

      const blob = toLowerBlob(display);
      const match = blob.match(/(\d+(?:\.\d+)?)\s*hz/);
      if (!match) return null;
      const refresh = Number(match[1]);
      return Number.isFinite(refresh) ? refresh : null;
    };

    const getTrendSortScore = (base) => {
      const productId = getResolvedProductId(base);
      if (productId == null) return 0;
      const key = String(productId);
      const trend = trendSignalsByProductId[key] || {};
      const compareCount = Number(
        compareSignalsByProductId[key] ??
          base?.compare_count ??
          base?.compareCount ??
          0,
      );
      const views7d = Number(trend?.views7d ?? 0);
      const viewsPrev7d = Number(trend?.viewsPrev7d ?? 0);
      const trendScore = Number(trend?.trendScore ?? 0);
      const rank = Number(trend?.rank ?? 9999);

      const safeViews = Number.isFinite(views7d) ? Math.max(0, views7d) : 0;
      const safePrev = Number.isFinite(viewsPrev7d)
        ? Math.max(0, viewsPrev7d)
        : 0;
      const safeCompare = Number.isFinite(compareCount)
        ? Math.max(0, compareCount)
        : 0;
      const safeTrendScore = Number.isFinite(trendScore)
        ? Math.max(0, trendScore)
        : 0;
      const growthRatio =
        safePrev > 0
          ? (safeViews - safePrev) / safePrev
          : safeViews > 0
            ? 1
            : 0;
      const growthBoost = Math.max(0, Math.min(2, growthRatio));
      const rankBoost =
        Number.isFinite(rank) && rank > 0 ? Math.max(0, 140 - rank * 2.5) : 0;

      return (
        safeTrendScore * 5 +
        Math.log1p(safeViews) * 18 +
        Math.log1p(safeCompare) * 26 +
        growthBoost * 20 +
        rankBoost
      );
    };

    const quickFilterMatch = (base, variant) => {
      if (activeQuickFilter === "all") return true;

      const display = mergeObjects(base?.display, base?.display_json);
      const performance = mergeObjects(
        base?.performance,
        base?.performance_json,
      );
      const camera = mergeObjects(base?.camera, base?.camera_json);
      const battery = mergeObjects(base?.battery, base?.battery_json);
      const connectivity = mergeObjects(
        base?.connectivity,
        base?.network,
        base?.network_json,
        base?.ports,
      );

      const displayBlob = toLowerBlob(display);
      const performanceBlob = toLowerBlob(performance);
      const batteryBlob = toLowerBlob(battery);
      const networkBlob = toLowerBlob(connectivity);
      const aiBlob = toLowerBlob([
        base?.ai_features,
        performance?.ai_features,
        camera?.ai_features,
        display?.ai_features,
        battery?.ai_features,
      ]);

      const cameraMp = readMainCameraMp(camera) || 0;
      const batteryCapacity =
        parseNumber(battery?.battery_capacity_mah) ||
        parseNumber(battery?.battery_capacity) ||
        parseNumber(battery?.capacity_mah) ||
        parseNumber(battery?.capacity) ||
        0;
      const chargingWatt = readChargingWatt(battery) || 0;
      const refreshRate = readRefreshRate(display) || 0;

      const ramValue =
        parseNumber(variant?.ram) ||
        parseNumber(base?.ram) ||
        parseNumber(performance?.ram) ||
        0;
      const storageValue =
        parseNumber(variant?.storage) ||
        parseNumber(base?.storage) ||
        parseNumber(base?.internal_storage) ||
        0;

      switch (activeQuickFilter) {
        case "wireless":
          return (
            /wireless\s*(charging|charge|power)/i.test(batteryBlob) ||
            /\bqi\b/.test(batteryBlob)
          );
        case "highMpCamera":
          return cameraMp >= 50;
        case "fiveG":
          return (
            /\b5g\b/.test(networkBlob) ||
            /\b5g\b/.test(performanceBlob) ||
            /\b5g\b/.test(toLowerBlob(base?.name))
          );
        case "fastCharge":
          return chargingWatt >= 44;
        case "aiFeatures":
          return aiBlob.trim().length > 0;
        case "longBattery":
          return batteryCapacity >= 5000;
        case "amoled":
          return /\bamoled\b|\boled\b|\bp-?oled\b|\bltpo\b/.test(displayBlob);
        case "refresh120":
          return refreshRate >= 120;
        case "wifi":
          return (
            /wi[\s-]?fi/.test(networkBlob) ||
            /802\.11/.test(networkBlob) ||
            /\bwlan\b/.test(networkBlob)
          );
        case "highRam":
          return ramValue >= 8;
        case "highStorage":
          return storageValue >= 256;
        default:
          return true;
      }
    };

    let candidates = (availableDevices || []).flatMap((device) => {
      const vars =
        Array.isArray(device.variants) && device.variants.length
          ? device.variants
          : [null];
      return vars.map((v, vi) => ({
        base: device,
        variant: v,
        variantIndex: vi,
      }));
    });

    const chosenDevices = isComparing
      ? [...comparedDevices, ...selectedDevices]
      : selectedDevices;
    const typeSource =
      (isComparing && comparedDevices.length > 0
        ? comparedDevices
        : selectedDevices) || [];

    // If there's already a selected device, restrict candidates to that deviceType
    if (typeSource.length > 0) {
      const allowedType = getResolvedProductType(typeSource[0]);
      if (allowedType) {
        candidates = candidates.filter((c) => {
          const t = getResolvedProductType(c.base);
          return t === allowedType;
        });
      }
    }

    // Remove already-selected devices (regardless of which variant is shown in the search list)
    const notSelected = candidates.filter((it) => {
      const candidateId = getResolvedProductId(it.base);
      if (candidateId == null) return true;
      return !chosenDevices.some((sd) => String(sd.id) === String(candidateId));
    });

    const query = searchQuery.trim().toLowerCase();
    const searched = query
      ? notSelected.filter(
          (it) =>
            (it.base.name || "").toLowerCase().includes(query) ||
            (it.base.brand || "").toLowerCase().includes(query) ||
            (it.base.model || "").toLowerCase().includes(query),
        )
      : notSelected;

    const quickFiltered = searched.filter((it) =>
      quickFilterMatch(it.base, it.variant),
    );

    return quickFiltered
      .map((it) => ({
        ...it,
        trendSortScore: getTrendSortScore(it.base),
      }))
      .sort((a, b) => {
        const trendDiff = (b.trendSortScore || 0) - (a.trendSortScore || 0);
        if (Math.abs(trendDiff) > 0.001) return trendDiff;

        const aCompare = Number(
          compareSignalsByProductId[String(getResolvedProductId(a.base))] || 0,
        );
        const bCompare = Number(
          compareSignalsByProductId[String(getResolvedProductId(b.base))] || 0,
        );
        if (aCompare !== bCompare) return bCompare - aCompare;

        return String(a.base?.name || "").localeCompare(
          String(b.base?.name || ""),
        );
      })
      .slice(0, 20)
      .map(({ trendSortScore, ...item }) => item);
  }, [
    availableDevices,
    searchQuery,
    selectedDevices,
    comparedDevices,
    isComparing,
    trendSignalsByProductId,
    compareSignalsByProductId,
    activeQuickFilter,
  ]);

  useEffect(() => {
    if (!showSearch || signalsFetched) return;

    let cancelled = false;

    const loadSignals = async () => {
      try {
        const [trendingRes, comparedRes] = await Promise.all([
          fetch("https://api.apisphere.in/api/public/trending/all"),
          fetch("https://api.apisphere.in/api/public/trending/most-compared"),
        ]);

        if (!cancelled && trendingRes.ok) {
          const trendingJson = await trendingRes.json();
          const rows = Array.isArray(trendingJson?.trending)
            ? trendingJson.trending
            : [];

          const trendMap = {};
          rows.forEach((row, index) => {
            const pid = Number(
              row?.product_id ?? row?.productId ?? row?.id ?? null,
            );
            if (!Number.isFinite(pid)) return;

            const views7d = Number(
              row?.trend_views_7d ?? row?.views_7d ?? row?.views ?? 0,
            );
            const viewsPrev7d = Number(
              row?.trend_views_prev_7d ?? row?.views_prev_7d ?? 0,
            );
            const trendScore = Number(
              row?.trend_score ?? row?.trending_score ?? 0,
            );

            trendMap[String(pid)] = {
              views7d: Number.isFinite(views7d) ? views7d : 0,
              viewsPrev7d: Number.isFinite(viewsPrev7d) ? viewsPrev7d : 0,
              trendScore: Number.isFinite(trendScore) ? trendScore : 0,
              rank: index + 1,
            };
          });

          setTrendSignalsByProductId(trendMap);
        }

        if (!cancelled && comparedRes.ok) {
          const comparedJson = await comparedRes.json();
          const rows = Array.isArray(comparedJson?.mostCompared)
            ? comparedJson.mostCompared
            : [];

          const compareMap = {};
          rows.forEach((row) => {
            const count = Number(row?.compare_count ?? row?.compareCount ?? 0);
            if (!Number.isFinite(count) || count <= 0) return;

            [row?.product_id, row?.compared_product_id].forEach((idRaw) => {
              const pid = Number(idRaw);
              if (!Number.isFinite(pid)) return;
              const key = String(pid);
              compareMap[key] = (compareMap[key] || 0) + count;
            });
          });

          setCompareSignalsByProductId(compareMap);
        }
      } catch {
        // ignore signal fetch failures
      } finally {
        if (!cancelled) setSignalsFetched(true);
      }
    };

    loadSignals();
    return () => {
      cancelled = true;
    };
  }, [showSearch, signalsFetched]);

  useEffect(() => {
    if (!showSearch) {
      setActiveQuickFilter("all");
    }
  }, [showSearch]);

  // Get device specs
  // Format price (hoisted so it can be used by other functions)
  function formatPrice(price) {
    if (!price || price === 0) return "N/A";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  }

  const toNormalCase = (raw) => {
    if (!raw) return "";
    let s = String(raw);
    s = s.replace(/_/g, " ").replace(/([a-z0-9])([A-Z])/g, "$1 $2");
    const parts = s.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
    return parts
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  };

  const formatSpecValue = (value, key, depth = 0) => {
    if (value == null || value === "") return "N/A";
    if (Array.isArray(value)) {
      const items = value
        .map((item) => formatSpecValue(item, key, depth + 1))
        .filter((item) => item && item !== "N/A");
      return items.length ? items.join(", ") : "N/A";
    }
    if (typeof value === "object") {
      const parts = Object.entries(value)
        .map(([k, v]) => {
          if (v == null || v === "") return null;
          const nested = formatSpecValue(v, k, depth + 1);
          if (!nested || nested === "N/A") return null;
          if (typeof v === "object") {
            if (Array.isArray(v)) return `${toNormalCase(k)}: ${nested}`;
            return `${toNormalCase(k)} (${nested})`;
          }
          return `${toNormalCase(k)}: ${nested}`;
        })
        .filter(Boolean);
      return parts.length ? parts.join(depth === 0 ? " | " : ", ") : "N/A";
    }
    if (value === true) return "Yes";
    if (value === false) return "No";
    return String(value);
  };

  const renderStructuredSpecValue = (value, specKey) => {
    if (value == null || value === "" || value === "N/A") {
      return "N/A";
    }

    if (Array.isArray(value)) {
      const entries = value.filter((entry) => hasRenderableValue(entry));
      if (entries.length === 0) return "N/A";

      return (
        <div className="space-y-1">
          {entries.map((entry, index) => (
            <div
              key={`${specKey}-array-${index}`}
              className="leading-5 break-words"
            >
              {formatSpecValue(entry, specKey, 1)}
            </div>
          ))}
        </div>
      );
    }

    if (typeof value === "object") {
      const entries = Object.entries(value).filter(([, nestedValue]) =>
        hasRenderableValue(nestedValue),
      );

      if (entries.length === 0) return "N/A";

      return (
        <div className="space-y-1">
          {entries.map(([nestedKey, nestedValue]) => (
            <div
              key={`${specKey}-${nestedKey}`}
              className="leading-5 break-words"
            >
              <span className="font-semibold text-gray-700">
                {toNormalCase(nestedKey)}:
              </span>{" "}
              <span>{formatSpecValue(nestedValue, nestedKey, 1)}</span>
            </div>
          ))}
        </div>
      );
    }

    return formatSpecValue(value, specKey);
  };

  const renderCameraComparisonValue = (value, specKey) => {
    if (value == null || value === "" || value === "N/A") return "N/A";

    const CAMERA_FIELD_ALIASES = {
      fov: "FOV",
      ois: "OIS",
      eis: "EIS",
      af: "Autofocus",
      autofocus: "Autofocus",
      focus: "Focus",
      lens: "Lens",
      lenses: "Lens",
      aperture: "Aperture",
      pixel: "Pixel Size",
      pixelsize: "Pixel Size",
      resolution: "Resolution",
      megapixel: "Resolution",
      megapixels: "Resolution",
      sensor: "Sensor",
      sensorsize: "Sensor",
      focallength: "Focal Length",
      macrodistance: "Macro Distance",
      stabilization: "Stabilization",
      features: "Features",
      flash: "Flash",
    };

    const CAMERA_FIELD_ORDER = [
      "Resolution",
      "Sensor",
      "Aperture",
      "Pixel Size",
      "OIS",
      "EIS",
      "Autofocus",
      "Focus",
      "FOV",
      "Focal Length",
      "Lens",
      "Macro Distance",
      "Stabilization",
      "Flash",
      "Features",
    ];

    const CAMERA_SECTION_ORDER = [
      "Main Camera",
      "Rear Camera",
      "Ultra Wide Camera",
      "Telephoto Camera",
      "Periscope Camera",
      "Depth Camera",
      "Macro Camera",
      "Front Camera",
      "Rear Video",
      "Video Recording",
      "Camera Features",
      "Features",
    ];

    const getFieldOrderIndex = (field) => {
      const index = CAMERA_FIELD_ORDER.indexOf(field);
      return index === -1 ? 999 : index;
    };

    const normalizeFieldToken = (token) =>
      String(token || "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");

    const normalizeCameraField = (raw) => {
      const token = String(raw || "").trim();
      if (!token) return "";
      const compact = normalizeFieldToken(token);
      const aliased = CAMERA_FIELD_ALIASES[compact];
      if (aliased) return aliased;
      if (compact === "hdr") return "HDR";
      return toNormalCase(token);
    };

    const dedupeAndSortPairs = (pairs) => {
      const map = new Map();
      (pairs || []).forEach(([field, fieldValue]) => {
        if (!field || !fieldValue) return;
        const normalizedField = normalizeCameraField(field);
        const normalizedValue = String(fieldValue).trim();
        if (!normalizedField || !normalizedValue) return;
        if (map.has(normalizedField)) {
          const existing = map.get(normalizedField);
          if (!existing.includes(normalizedValue)) {
            map.set(normalizedField, `${existing} | ${normalizedValue}`);
          }
          return;
        }
        map.set(normalizedField, normalizedValue);
      });

      return Array.from(map.entries()).sort((a, b) => {
        const orderDiff = getFieldOrderIndex(a[0]) - getFieldOrderIndex(b[0]);
        if (orderDiff !== 0) return orderDiff;
        return a[0].localeCompare(b[0]);
      });
    };

    const sortSections = (sections) =>
      [...(sections || [])].sort((a, b) => {
        const aLabel = a?.label || "";
        const bLabel = b?.label || "";
        const aIndex = CAMERA_SECTION_ORDER.indexOf(aLabel);
        const bIndex = CAMERA_SECTION_ORDER.indexOf(bLabel);
        const left = aIndex === -1 ? 999 : aIndex;
        const right = bIndex === -1 ? 999 : bIndex;
        if (left !== right) return left - right;
        return aLabel.localeCompare(bLabel);
      });

    const FEATURE_ITEM_LIMIT = 10;
    const featureKey = String(specKey || "").toLowerCase();
    const isFeatureLikeSpec =
      featureKey.includes("feature") || featureKey.includes("mode");

    const normalizeFeatureItem = (rawItem) => {
      const item = String(rawItem || "")
        .replace(/\s+/g, " ")
        .trim();
      if (!item) return "";

      const supportedMatch = item.match(/^(.*?):\s*(yes|true|supported)$/i);
      if (supportedMatch?.[1]) {
        return toNormalCase(supportedMatch[1].trim());
      }

      if (/^(na|n\/a|null|undefined|not specified)$/i.test(item)) return "";

      return item.length > 48 ? `${item.slice(0, 45)}...` : item;
    };

    const toFeatureItems = (input) => {
      const flatText = String(formatSpecValue(input, specKey, 1) || "").trim();
      if (!flatText || flatText === "N/A") return [];

      return Array.from(
        new Set(
          flatText
            .replace(/\r?\n/g, ",")
            .replace(/\|/g, ",")
            .replace(/;/g, ",")
            .split(",")
            .map((token) => normalizeFeatureItem(token))
            .filter(Boolean),
        ),
      );
    };

    const toPairsFromText = (text) => {
      const normalized = String(text || "")
        .replace(/\r?\n/g, " | ")
        .replace(/;/g, " | ")
        .replace(/,\s+(?=[A-Za-z][A-Za-z0-9 ()/+.-]{1,32}\s*:)/g, " | ")
        .replace(/\s+/g, " ")
        .trim();

      if (!normalized || !normalized.includes(":")) return [];

      return normalized
        .split("|")
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part) => {
          const separatorIndex = part.indexOf(":");
          if (separatorIndex === -1) return null;
          const field = normalizeCameraField(part.slice(0, separatorIndex));
          const fieldValue = part.slice(separatorIndex + 1).trim();
          if (!field || !fieldValue) return null;
          return [field, fieldValue];
        })
        .filter(Boolean);
    };

    const sectionRegex =
      /(Main Camera|Rear Camera|Ultra Wide Camera|Front Camera|Telephoto Camera|Periscope Camera|Macro Camera|Depth Camera|Rear Video|Video Recording|Camera Features|Features)\s*:/gi;

    const toSectionsFromText = (text) => {
      const source = String(text || "").trim();
      if (!source) return [];

      const matches = Array.from(source.matchAll(sectionRegex));
      if (matches.length < 2) return [];

      return matches
        .map((match, index) => {
          const start = (match.index ?? 0) + match[0].length;
          const end =
            index + 1 < matches.length
              ? (matches[index + 1].index ?? source.length)
              : source.length;
          const sectionLabel = normalizeCameraField(match[1]);
          const body = source.slice(start, end).trim();
          const pairs = toPairsFromText(body);
          return { label: sectionLabel, pairs, text: body };
        })
        .filter((section) => hasRenderableValue(section.text));
    };

    const toSectionsFromObject = (obj, label = null) => {
      if (!obj || typeof obj !== "object" || Array.isArray(obj)) return [];

      const primitivePairs = [];
      const nestedSections = [];

      Object.entries(obj).forEach(([nestedKey, nestedValue]) => {
        if (!hasRenderableValue(nestedValue)) return;

        if (
          nestedValue &&
          typeof nestedValue === "object" &&
          !Array.isArray(nestedValue)
        ) {
          nestedSections.push(
            ...toSectionsFromObject(
              nestedValue,
              normalizeCameraField(nestedKey),
            ),
          );
          return;
        }

        const formatted = formatSpecValue(nestedValue, nestedKey, 1);
        if (!formatted || formatted === "N/A") return;
        primitivePairs.push([normalizeCameraField(nestedKey), formatted]);
      });

      const sections = [];
      if (primitivePairs.length) {
        sections.push({ label, pairs: primitivePairs, text: "" });
      }
      if (nestedSections.length) {
        sections.push(...nestedSections);
      }
      return sections;
    };

    const renderPairsTable = (pairs, keyPrefix) => {
      if (!Array.isArray(pairs) || pairs.length === 0) return null;

      const normalizedPairs = dedupeAndSortPairs(pairs);
      if (normalizedPairs.length === 0) return null;

      const visiblePairs = normalizedPairs.slice(0, 8);
      const hiddenCount = normalizedPairs.length - visiblePairs.length;

      return (
        <div className="bg-white">
          <table className="w-full">
            <tbody className="divide-y divide-slate-100">
              {visiblePairs.map(([field, fieldValue], index) => (
                <tr key={`${keyPrefix}-${field}-${index}`}>
                  <td className="w-[42%] px-2 py-1.5 text-[11px] font-semibold text-slate-600">
                    {field}
                  </td>
                  <td className="px-2 py-1.5 text-[11px] text-slate-900 break-words">
                    {fieldValue}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {hiddenCount > 0 ? (
            <p className="px-2 pt-1 text-[10px] font-medium text-slate-500">
              +{hiddenCount} more details
            </p>
          ) : null}
        </div>
      );
    };

    const renderSectionList = (sections, keyPrefix) => (
      <div className="space-y-2">
        {sortSections(sections).map((section, index) => (
          <div key={`${keyPrefix}-section-${index}`} className="space-y-1">
            {section.label ? (
              <p className="text-[11px] font-semibold text-slate-700">
                {section.label}
              </p>
            ) : null}
            {section.pairs?.length ? (
              renderPairsTable(section.pairs, `${keyPrefix}-${index}`)
            ) : (
              <p className="text-[12px] leading-5 text-slate-800">
                {section.text}
              </p>
            )}
          </div>
        ))}
      </div>
    );

    if (typeof value === "object" && !Array.isArray(value)) {
      const objectSections = toSectionsFromObject(value);
      if (objectSections.length > 0) {
        return renderSectionList(objectSections, `${specKey}-object`);
      }
    }

    if (Array.isArray(value)) {
      const entries = value
        .map((item) => String(formatSpecValue(item, specKey, 1) || "").trim())
        .filter((item) => item && item !== "N/A");
      if (entries.length === 0) return "N/A";
      return (
        <div className="space-y-1">
          {entries.map((entry, index) => (
            <p
              key={`${specKey}-array-${index}`}
              className="text-[12px] leading-5 text-slate-800"
            >
              {entry}
            </p>
          ))}
        </div>
      );
    }

    const text = String(formatSpecValue(value, specKey) || "").trim();
    if (!text || text === "N/A") return "N/A";

    if (isFeatureLikeSpec) {
      const featureItems = toFeatureItems(value);
      if (featureItems.length > 0) {
        const visibleItems = featureItems.slice(0, FEATURE_ITEM_LIMIT);
        const hiddenCount = featureItems.length - visibleItems.length;

        return (
          <div className="space-y-1.5">
            <p className="text-[11px] font-medium text-slate-500">
              {featureItems.length} features
            </p>
            <div className="flex flex-wrap gap-1.5">
              {visibleItems.map((item, index) => (
                <span
                  key={`${specKey}-feature-${index}`}
                  className="inline-flex items-center border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] leading-4 text-slate-700"
                >
                  {item}
                </span>
              ))}
              {hiddenCount > 0 ? (
                <span className="inline-flex items-center border border-violet-200 bg-violet-50 px-2 py-0.5 text-[11px] font-medium leading-4 text-violet-600">
                  +{hiddenCount} more
                </span>
              ) : null}
            </div>
          </div>
        );
      }
    }

    const textSections = toSectionsFromText(text);
    if (textSections.length > 0) {
      return renderSectionList(textSections, `${specKey}-text-sections`);
    }

    const textPairs = toPairsFromText(text);
    if (textPairs.length >= 2) {
      return renderPairsTable(textPairs, `${specKey}-text-pairs`);
    }

    return (
      <p className="text-[12px] leading-5 text-slate-800 break-words">{text}</p>
    );
  };

  const hasRenderableValue = (value) => {
    if (value == null || value === false) return false;
    if (typeof value === "string") {
      const t = value.trim();
      if (!t) return false;
      const lower = t.toLowerCase();
      if (
        lower === "n/a" ||
        lower === "na" ||
        lower === "null" ||
        lower === "undefined" ||
        lower === "not specified" ||
        t === "{}" ||
        t === "[]"
      ) {
        return false;
      }
      return true;
    }
    if (typeof value === "number") return Number.isFinite(value);
    if (Array.isArray(value))
      return value.some((entry) => hasRenderableValue(entry));
    if (typeof value === "object") {
      return Object.values(value).some((entry) => hasRenderableValue(entry));
    }
    return Boolean(value);
  };

  const mergeSpecObjects = (...objects) =>
    objects.reduce((acc, obj) => {
      if (obj && typeof obj === "object" && !Array.isArray(obj)) {
        return { ...acc, ...obj };
      }
      return acc;
    }, {});

  const toArray = (value) => {
    if (Array.isArray(value))
      return value.filter((item) => item != null && item !== "");
    if (typeof value === "string") return value.trim() ? [value.trim()] : [];
    return [];
  };

  const collectAiFeatures = (device) => {
    const buckets = [
      device?.ai_features,
      device?.performance?.ai_features,
      device?.camera?.ai_features,
      device?.display?.ai_features,
      device?.battery?.ai_features,
      device?.connectivity?.ai_features,
      device?.multimedia?.ai_features,
      device?.build_design?.ai_features,
      device?.buildDesign?.ai_features,
    ];

    return Array.from(
      new Set(
        buckets.flatMap((bucket) =>
          toArray(bucket).map((x) => String(x).trim()),
        ),
      ),
    ).filter(Boolean);
  };

  const cleanSpecs = (specs) => {
    if (!specs || typeof specs !== "object") return {};
    const blocked = new Set(["sphere_rating", "ai_features"]);
    return Object.fromEntries(
      Object.entries(specs).filter(
        ([k, v]) =>
          !blocked.has(k) &&
          !/(^|[_-])score$/i.test(k) &&
          hasRenderableValue(v),
      ),
    );
  };

  const hasAiFeatures = (device) => {
    return collectAiFeatures(device).length > 0;
  };

  // Render specification table with professional styling
  const renderSpecTable = (specs) => {
    if (
      !specs ||
      (typeof specs === "object" && Object.keys(specs).length === 0)
    ) {
      return (
        <div className="text-center py-4 text-gray-500">No data available</div>
      );
    }

    const entries = Object.entries(specs).filter(
      ([k, v]) =>
        k !== "sphere_rating" &&
        !/(^|[_-])score$/i.test(k) &&
        hasRenderableValue(v),
    );

    if (entries.length === 0) {
      return (
        <div className="text-center py-4 text-gray-500">No data available</div>
      );
    }

    return (
      <div className="space-y-2">
        {entries.map(([key, value]) => (
          <div
            key={key}
            className="flex justify-between items-center py-3 px-4 bg-white rounded-lg border border-slate-100 hover:border-gray-200 hover:shadow-sm hover:bg-gray-50 transition-all duration-200"
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
    );
  };

  // Render camera specifications table
  const renderCameraTable = (camera) => {
    if (!camera) {
      return (
        <div className="text-center py-4 text-gray-500">
          No camera data available
        </div>
      );
    }

    const rows = [];

    if (camera.main_camera_megapixels) {
      rows.push(["Main Camera", `${camera.main_camera_megapixels} MP`]);
    }

    if (camera.rear_camera) {
      if (
        typeof camera.rear_camera === "object" &&
        !Array.isArray(camera.rear_camera)
      ) {
        Object.entries(camera.rear_camera).forEach(([lens, spec]) => {
          if (hasRenderableValue(spec)) {
            rows.push([toNormalCase(lens), formatSpecValue(spec, lens)]);
          }
        });
      } else {
        rows.push([
          "Rear Camera",
          formatSpecValue(camera.rear_camera, "rear_camera"),
        ]);
      }
    }

    if (camera.front_camera) {
      const frontVal =
        typeof camera.front_camera === "object"
          ? Object.entries(camera.front_camera)
              .map(([k, v]) => `${toNormalCase(k)}: ${formatSpecValue(v, k)}`)
              .join(" | ")
          : String(camera.front_camera);
      rows.push(["Front Camera", frontVal]);
    }

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

    if (rows.length === 0) {
      return (
        <div className="text-center py-4 text-gray-500">
          No camera data available
        </div>
      );
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

  // Get device specs
  const getDeviceSpecs = (device, section) => {
    const displaySpecs = mergeSpecObjects(
      device?.display,
      device?.display_json,
    );
    const performanceSpecs = mergeSpecObjects(
      device?.performance,
      device?.performance_json,
    );
    const cameraSpecs = mergeSpecObjects(device?.camera, device?.camera_json);
    const batterySpecs = mergeSpecObjects(
      device?.battery,
      device?.battery_json,
    );
    const networkSpecs = mergeSpecObjects(
      device?.connectivity,
      device?.connectivity_json,
      device?.network,
      device?.network_json,
      device?.ports,
    );
    const audioSpecs = mergeSpecObjects(
      device?.audio,
      device?.multimedia,
      device?.multimedia_json,
    );
    const featureSpecs = {
      ai_features: collectAiFeatures(device),
      design_features:
        device?.build_design?.design_features ||
        device?.buildDesign?.design_features ||
        [],
      durability:
        device?.build_design?.durability ||
        device?.build_design?.military_grade_certification ||
        device?.buildDesign?.durability ||
        null,
      water_dust_resistance:
        device?.build_design?.water_dust_resistance ||
        device?.buildDesign?.water_dust_resistance ||
        null,
      protection:
        device?.display?.cover_glass ||
        device?.build_design?.front_protection ||
        device?.build_design?.protection_glass ||
        null,
      sensors: device?.sensors || null,
    };

    if (section === "overview") {
      const selectedVariant = getSelectedVariant(device);
      const launchDateRaw = device?.launch_date ?? device?.launchDate ?? null;
      const launchDateText =
        launchDateRaw && typeof launchDateRaw !== "object"
          ? (() => {
              const dt = new Date(launchDateRaw);
              return Number.isNaN(dt.getTime())
                ? "N/A"
                : dt.toLocaleDateString();
            })()
          : "N/A";
      return {
        rating: device.rating,
        price: formatPrice(
          selectedVariant?.base_price ||
            selectedVariant?.basePrice ||
            selectedVariant?.price ||
            device.price ||
            0,
        ),
        variant: `${selectedVariant?.ram || "N/A"} / ${
          selectedVariant?.storage || "N/A"
        }`,
        os:
          performanceSpecs?.operating_system ||
          performanceSpecs?.os ||
          device.os ||
          "N/A",
        processor:
          performanceSpecs?.processor || performanceSpecs?.chipset || "N/A",
        launch_date: launchDateText,
      };
    }

    if (section === "display") return cleanSpecs(displaySpecs);
    if (section === "camera") return cleanSpecs(cameraSpecs);
    if (section === "performance") return cleanSpecs(performanceSpecs);
    if (section === "battery") return cleanSpecs(batterySpecs);
    if (section === "network") return cleanSpecs(networkSpecs);
    if (section === "audio") return cleanSpecs(audioSpecs);
    if (section === "features") return cleanSpecs(featureSpecs);

    return cleanSpecs(device[section] || {});
  };

  // Get selected variant for a device
  const getSelectedVariant = (device) => {
    const variantIndex = variantSelection[device.id] || 0;
    if (Array.isArray(device.variants) && device.variants.length > 0) {
      return device.variants[variantIndex] || device.variants[0];
    }
    return null;
  };

  useEffect(() => {
    if (!isComparing || comparedDevices.length < MIN_DEVICES) {
      setRankingByDeviceId({});
      return;
    }

    const dedupe = new Set();
    const payloadDevices = comparedDevices
      .map((device) => {
        const productId = Number(
          device?.productId ?? device?.product_id ?? device?.id,
        );
        if (!Number.isInteger(productId) || productId <= 0) return null;
        if (dedupe.has(productId)) return null;
        dedupe.add(productId);

        const selectedIndex = Number(
          variantSelection[device.id] ?? device.selectedVariantIndex ?? 0,
        );
        const variants = Array.isArray(device?.variants) ? device.variants : [];
        const selectedVariant = variants[selectedIndex] || variants[0] || null;
        const variantId = Number(
          selectedVariant?.variant_id ?? selectedVariant?.id,
        );

        const entry = { product_id: productId };
        if (Number.isInteger(variantId) && variantId > 0) {
          entry.variant_id = variantId;
        } else if (Number.isInteger(selectedIndex) && selectedIndex >= 0) {
          entry.variant_index = selectedIndex;
        }

        return entry;
      })
      .filter(Boolean);

    if (payloadDevices.length < MIN_DEVICES) {
      setRankingByDeviceId({});
      return;
    }

    const controller = new AbortController();

    (async () => {
      try {
        const response = await fetch(
          "https://api.apisphere.in/api/public/compare/scores",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ devices: payloadDevices }),
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        const rows = Array.isArray(data?.scores) ? data.scores : [];
        const nextScores = {};

        rows.forEach((row) => {
          const productId = String(row?.product_id ?? "");
          const overallScore = Number(row?.overall_score);
          if (!productId || !Number.isFinite(overallScore)) return;
          nextScores[productId] = { totalScore: overallScore };
        });

        if (!controller.signal.aborted) {
          setRankingByDeviceId(nextScores);
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Failed to fetch compare scores:", error);
        setRankingByDeviceId({});
      }
    })();

    return () => controller.abort();
  }, [isComparing, comparedDevices, variantSelection]);

  const getSpecHint = (sectionId, specKey) => {
    const key = String(specKey || "").toLowerCase();
    if (key.includes("processor") || key.includes("chipset")) {
      return SCORING_GLOSSARY.chipset;
    }
    if (key.includes("refresh")) {
      return SCORING_GLOSSARY.refreshRate;
    }
    if (sectionId === "display" && (key === "type" || key.includes("panel"))) {
      return SCORING_GLOSSARY.panelType;
    }
    if (key.includes("megapixel") || key.includes("resolution")) {
      return SCORING_GLOSSARY.megapixels;
    }
    if (key.includes("sensor")) {
      return SCORING_GLOSSARY.sensorCount;
    }
    if (key.includes("battery") || key.includes("capacity")) {
      return SCORING_GLOSSARY.batteryCapacity;
    }
    if (sectionId === "overview" && key === "price") {
      return SCORING_GLOSSARY.priceValue;
    }
    return null;
  };

  const parseMegapixelValue = (value) => {
    if (value == null || value === "") return null;
    if (typeof value === "number") return `${value} MP`;
    const match = String(value).match(/(\d+(?:\.\d+)?)\s*mp/i);
    return match ? `${match[1]} MP` : null;
  };

  const getQuickProcessorText = (device) =>
    device?.performance?.processor ||
    device?.performance?.chipset ||
    device?.processor ||
    "N/A";

  const getQuickDisplayText = (device) => {
    const display = device?.display || {};
    const size = display.size_inches || display.screen_size || display.size;
    const resolution = display.resolution || display.screen_resolution;

    if (size && resolution) {
      const sizeText = String(size);
      return `${sizeText.includes('"') ? sizeText : `${sizeText}"`} | ${resolution}`;
    }
    if (size) {
      const sizeText = String(size);
      return sizeText.includes('"') ? sizeText : `${sizeText}"`;
    }
    return resolution || "N/A";
  };

  const getQuickBatteryText = (device) => {
    const battery = device?.battery || {};
    const capacity =
      battery.battery_capacity_mah ||
      battery.battery_capacity ||
      battery.capacity_mah ||
      battery.capacity ||
      battery.battery ||
      null;
    if (!capacity) return battery.type || "N/A";
    const capacityText = String(capacity);
    return /mah/i.test(capacityText) ? capacityText : `${capacityText} mAh`;
  };

  const getQuickCameraText = (device) => {
    const camera = device?.camera || {};

    const directMain = parseMegapixelValue(camera.main_camera_megapixels);
    if (directMain) return directMain;

    const rear = camera.rear_camera;
    if (rear && typeof rear === "object" && !Array.isArray(rear)) {
      const rearValues = Object.values(rear);
      for (const lensSpec of rearValues) {
        if (!lensSpec) continue;
        if (typeof lensSpec === "object" && !Array.isArray(lensSpec)) {
          const nestedValue =
            lensSpec.resolution ||
            lensSpec.megapixels ||
            lensSpec.main_camera_megapixels;
          const parsedNested = parseMegapixelValue(nestedValue);
          if (parsedNested) return parsedNested;
        }
        const parsedLens = parseMegapixelValue(lensSpec);
        if (parsedLens) return parsedLens;
      }
    }

    const parsedRear = parseMegapixelValue(rear);
    if (parsedRear) return parsedRear;

    const parsedFront = parseMegapixelValue(camera.front_camera);
    if (parsedFront) return `Front ${parsedFront}`;

    return "N/A";
  };

  const sectionSpecKeys = useMemo(() => {
    const out = {};
    for (const s of SECTIONS) out[s.id] = [];
    const devicesForSpecs = isComparing ? comparedDevices : selectedDevices;
    if (devicesForSpecs.length === 0) return out;

    const overviewOrder = [
      "rating",
      "price",
      "variant",
      "processor",
      "os",
      "launch_date",
    ];

    for (const section of SECTIONS) {
      const specKeys = new Set();
      devicesForSpecs.forEach((device) => {
        const specs = getDeviceSpecs(device, section.id);
        Object.keys(specs).forEach((key) => {
          if (hasRenderableValue(specs[key])) specKeys.add(key);
        });
      });

      const sortedKeys = Array.from(specKeys).sort((a, b) => {
        if (section.id === "overview") {
          const aIndex = overviewOrder.indexOf(a);
          const bIndex = overviewOrder.indexOf(b);
          if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
          if (aIndex !== -1) return -1;
          if (bIndex !== -1) return 1;
        }
        return toNormalCase(a).localeCompare(toNormalCase(b));
      });

      out[section.id] = sortedKeys;
    }

    return out;
  }, [selectedDevices, comparedDevices, isComparing, variantSelection]);

  // Open details modal
  const openDetailsModal = (device, section = "specifications") => {
    setModalDevice(device);
    setModalSection(section);
    setShowDetailsModal(true);
  };

  const makeSelectedEntry = (base, variantIndex = 0) => {
    const resolvedProductId = getResolvedProductId(base);
    const resolvedType = getResolvedProductType(base);
    const resolvedName = base?.name || base?.model || base?.title || null;
    const id = `${resolvedProductId}`;
    return {
      ...base,
      id,
      productId: resolvedProductId,
      baseId: resolvedProductId,
      productType: resolvedType,
      name: resolvedName,
      selectedVariantIndex: variantIndex,
    };
  };

  const formatVariantLabel = (variant, index) => {
    if (!variant || typeof variant !== "object") return `Variant ${index + 1}`;
    const ram = variant.ram || variant.variantRam || null;
    const storage = variant.storage || variant.variantStorage || null;
    const price =
      variant.base_price ?? variant.basePrice ?? variant.price ?? null;

    const main = [ram, storage].filter(Boolean).join(" / ");
    const priceText =
      price != null && !Number.isNaN(Number(price))
        ? ` | ${formatPrice(Number(price))}`
        : "";

    return `${main || `Variant ${index + 1}`}${priceText}`;
  };

  // Add device (base device + variantIndex)
  const addDevice = (baseDevice, variantIndex = 0) => {
    const entry = makeSelectedEntry(baseDevice, variantIndex);

    const existsInPending = selectedDevices.some(
      (s) => String(s.id) === String(entry.id),
    );
    const existsInCompared = comparedDevices.some(
      (s) => String(s.id) === String(entry.id),
    );

    if (existsInPending || existsInCompared) {
      setVariantSelection((vs) => ({ ...vs, [entry.id]: variantIndex }));
      setSelectedDevices((prev) =>
        prev.map((d) =>
          String(d.id) === String(entry.id)
            ? { ...d, selectedVariantIndex: variantIndex }
            : d,
        ),
      );
      setComparedDevices((prev) =>
        prev.map((d) =>
          String(d.id) === String(entry.id)
            ? { ...d, selectedVariantIndex: variantIndex }
            : d,
        ),
      );
      setShowSearch(false);
      setSearchQuery("");
      return;
    }

    if (usedSlots >= MAX_DEVICES) {
      alert(`Maximum ${MAX_DEVICES} devices can be compared`);
      return;
    }

    // If there is already a selected device, enforce same product type
    const typeSource =
      isComparing && comparedDevices.length > 0
        ? comparedDevices
        : selectedDevices;
    if (typeSource.length > 0) {
      const existingType = getResolvedProductType(typeSource[0]);
      const newType = getResolvedProductType(baseDevice);
      if (existingType && newType && String(existingType) !== String(newType)) {
        alert(
          `Cannot compare different device types. Selected devices must all be the same type.`,
        );
        return;
      }
    }

    if (isComparing) {
      setComparedDevices((prev) => [...prev, entry].slice(0, MAX_DEVICES));
    } else {
      setSelectedDevices((prev) => [...prev, entry]);
    }
    setVariantSelection((vs) => ({ ...vs, [entry.id]: variantIndex }));
    setShowSearch(false);
    setSearchQuery("");
  };

  // Auto-add device from URL
  useEffect(() => {
    (async () => {
      try {
        const params = new URLSearchParams(location.search);
        // Support single `add` param OR a comma-separated `devices` param.
        const toAdd = params.get("add");
        const devicesParam = params.get("devices");
        const forcedType = params.get("type");
        const descParam = params.get("desc");

        const getProductType = (d) =>
          d?.productType || d?.deviceType || d?.product_type || null;
        const getProductId = (d) =>
          d?.productId ?? d?.id ?? d?.product_id ?? null;

        const addNormalizedToSelection = (base, variantIndex = 0) => {
          if (!base) return;
          const normalizedType =
            base.productType || base.deviceType || base.product_type || null;
          if (selectedDevices.length > 0) {
            const existingType =
              selectedDevices[0].productType ||
              selectedDevices[0].deviceType ||
              selectedDevices[0].product_type ||
              null;
            if (
              existingType &&
              normalizedType &&
              String(existingType) !== String(normalizedType)
            )
              return;
          }
          const entry = makeSelectedEntry(base, variantIndex);
          setSelectedDevices((prev) => {
            if (prev.some((p) => String(p.id) === String(entry.id)))
              return prev;
            return [...prev, entry];
          });
          setVariantSelection((vs) => {
            if (vs[entry.id] === variantIndex) return vs;
            return { ...vs, [entry.id]: variantIndex };
          });
          return true;
        };

        const resolveAndAdd = async (idValue, typeValue, variantIndex = 0) => {
          if (!idValue) return false;
          // If type provided, prefer registry/list for that type then API
          if (typeValue) {
            let found = null;
            try {
              found = getDevice ? getDevice(typeValue, idValue) : null;
            } catch (e) {
              found = null;
            }
            if (found) {
              return addNormalizedToSelection(found, variantIndex);
            }

            // fetch from API: GET /api/public/product/:type/:id
            try {
              const res = await fetch(
                `https://api.apisphere.in/api/public/product/${encodeURIComponent(
                  typeValue,
                )}/${encodeURIComponent(idValue)}`,
              );
              if (res && res.ok) {
                const body = await res.json();
                const normalized = normalizeProduct(body, typeValue);
                const deviceObj = { ...body, ...normalized };
                try {
                  if (setDevice)
                    setDevice(typeValue, normalized.productId, deviceObj);
                } catch (e) {}
                return addNormalizedToSelection(deviceObj, variantIndex);
              }
            } catch (err) {}
            return false;
          }

          // No type provided: try to find in combined availableDevices
          const foundAny = (availableDevices || []).find((d) => {
            const pid = String(getProductId(d) ?? "");
            return pid && String(pid) === String(idValue);
          });
          if (foundAny) {
            return addNormalizedToSelection(foundAny, variantIndex);
          }

          // Fallback: fetch public product by id (type not required)
          try {
            const res = await fetch(
              `https://api.apisphere.in/api/public/product/${encodeURIComponent(
                idValue,
              )}`,
            );
            if (res && res.ok) {
              const body = await res.json();
              const normalized = normalizeProduct(body, "");
              const deviceObj = { ...body, ...normalized };
              return addNormalizedToSelection(deviceObj, variantIndex);
            }
          } catch (err) {}
          return false;
        };

        let addedAny = false;
        if (toAdd) {
          addedAny = (await resolveAndAdd(toAdd, forcedType, 0)) || addedAny;
        }

        if (devicesParam) {
          const parts = devicesParam
            .split(",")
            .map((p) => p.trim())
            .filter(Boolean);
          for (const part of parts) {
            const [idOrModel, variantIdxRaw] = part.split(":");
            const variantIdx = variantIdxRaw ? parseInt(variantIdxRaw, 10) : 0;
            addedAny =
              (await resolveAndAdd(idOrModel, forcedType, variantIdx || 0)) ||
              addedAny;
          }
        }

        if (descParam) setSharedDescription(String(descParam));

        // Keep `devices` in the URL so SEO/share metadata can stay in sync.
      } catch (err) {
        // ignore
      }
    })();
  }, [
    location.search,
    availableDevices,
    navigate,
    location.pathname,
    fetchDevice,
    getDevice,
    setDevice,
  ]);
  // Sync variant selection
  useEffect(() => {
    setVariantSelection((prev) => {
      const next = { ...prev };
      const all = [...comparedDevices, ...selectedDevices];
      all.forEach((d) => {
        if (d?.id == null) return;
        if (next[d.id] === undefined) next[d.id] = 0;
      });
      Object.keys(next).forEach((k) => {
        if (!all.some((d) => String(d.id) === String(k))) {
          delete next[k];
        }
      });
      return next;
    });
  }, [selectedDevices, comparedDevices]);

  // Remove pending device
  const removeDevice = (deviceId) => {
    setSelectedDevices((prev) =>
      prev.filter((d) => String(d.id) !== String(deviceId)),
    );
  };

  // Remove compared device
  const removeComparedDevice = (deviceId) => {
    setComparedDevices((prev) =>
      prev.filter((d) => String(d.id) !== String(deviceId)),
    );
  };

  const updateDeviceVariant = (deviceId, variantIndex) => {
    setVariantSelection((vs) => ({ ...vs, [deviceId]: variantIndex }));
    setSelectedDevices((prev) =>
      prev.map((d) =>
        String(d.id) === String(deviceId)
          ? { ...d, selectedVariantIndex: variantIndex }
          : d,
      ),
    );
    setComparedDevices((prev) =>
      prev.map((d) =>
        String(d.id) === String(deviceId)
          ? { ...d, selectedVariantIndex: variantIndex }
          : d,
      ),
    );
  };

  // (formatPrice hoisted above)

  // Get device image
  const getPrimaryImage = (device) => {
    if (!device) return "";
    if (device.image) return device.image;
    if (Array.isArray(device.images) && device.images.length)
      return device.images[0];
    return "";
  };

  const normalizeScore100 = (value) => {
    const n = Number(value);
    if (!Number.isFinite(n)) return null;
    if (n <= 1) return Math.max(0, Math.min(100, n * 100));
    if (n <= 10) return Math.max(0, Math.min(100, n * 10));
    return Math.max(0, Math.min(100, n));
  };

  const pickScore100 = (...values) => {
    for (const value of values) {
      const normalized = normalizeScore100(value);
      if (normalized != null) return normalized;
    }
    return null;
  };

  const getDeviceSpecScore = (device) => {
    if (!device) return null;

    const normalizeScoreSource = (value) =>
      String(value || "")
        .trim()
        .toLowerCase();
    const resolvePersistedScore = (value, source) => {
      const normalized = normalizeScore100(value);
      if (normalized == null) return null;

      const sourceKey = normalizeScoreSource(source);
      if (sourceKey && sourceKey.includes("fallback")) {
        return null;
      }

      return normalized;
    };

    const specScoreV2Source =
      device?.spec_score_v2_source ?? device?.specScoreV2Source;
    const overallScoreV2Source =
      device?.overall_score_v2_source ?? device?.overallScoreV2Source;
    const specScoreSource =
      device?.spec_score_source ?? device?.specScoreSource;
    const overallScoreSource =
      device?.overall_score_source ?? device?.overallScoreSource;

    const persistedSpecScore = pickScore100(
      resolvePersistedScore(device?.spec_score_v2, specScoreV2Source),
      resolvePersistedScore(device?.specScoreV2, specScoreV2Source),
      resolvePersistedScore(device?.spec_score, specScoreSource),
      resolvePersistedScore(device?.specScore, specScoreSource),
    );

    const persistedOverallScore = pickScore100(
      resolvePersistedScore(device?.overall_score_v2, overallScoreV2Source),
      resolvePersistedScore(device?.overallScoreV2, overallScoreV2Source),
      resolvePersistedScore(device?.overall_score, overallScoreSource),
      resolvePersistedScore(device?.overallScore, overallScoreSource),
      resolvePersistedScore(device?.scores?.overall_score, overallScoreSource),
      resolvePersistedScore(device?.scores?.overall, overallScoreSource),
    );

    const persistedOverallScoreDisplay = pickScore100(
      resolvePersistedScore(
        device?.overall_score_v2_display_80_98,
        overallScoreV2Source,
      ),
      resolvePersistedScore(
        device?.overallScoreV2Display8098,
        overallScoreV2Source,
      ),
      resolvePersistedScore(
        device?.spec_score_v2_display_80_98,
        specScoreV2Source,
      ),
      resolvePersistedScore(device?.specScoreV2Display8098, specScoreV2Source),
    );

    const derivedOverall = pickScore100(
      persistedOverallScore,
      persistedSpecScore,
    );
    const scoreFromDevice = pickScore100(
      persistedOverallScoreDisplay,
      derivedOverall,
    );
    if (scoreFromDevice != null) return Number(scoreFromDevice.toFixed(1));

    const rankingKeys = [
      device?.id,
      device?.productId,
      device?.product_id,
      getResolvedProductId(device),
    ]
      .filter((entry) => entry != null)
      .map((entry) => String(entry));

    for (const key of rankingKeys) {
      const parsed = pickScore100(rankingByDeviceId?.[key]?.totalScore);
      if (parsed != null) return parsed;
    }

    return null;
  };

  const formatSpecScoreLabel = (score) => {
    if (score == null || !Number.isFinite(score)) return null;
    return `${score.toFixed(1)}%`;
  };
  const getCardSummary = (device, variant) => {
    const performance = mergeSpecObjects(
      device?.performance,
      device?.performance_json,
    );
    const display = mergeSpecObjects(device?.display, device?.display_json);
    const battery = mergeSpecObjects(device?.battery, device?.battery_json);

    const processorRaw = String(
      performance?.processor || performance?.chipset || "",
    )
      .replace(/\s+/g, " ")
      .trim();
    const processor = processorRaw
      ? processorRaw
          .replace(/mobile platform/i, "")
          .replace(/\s+/g, " ")
          .trim()
      : "";

    const displaySizeRaw = String(display?.size || "").trim();
    const displaySize = displaySizeRaw
      ? `${displaySizeRaw.replace(/\"/g, "")} display`
      : "";

    const batteryRaw = String(
      battery?.battery_capacity_mah ||
        battery?.battery_capacity ||
        battery?.capacity_mah ||
        battery?.capacity ||
        "",
    ).trim();
    const batteryText = batteryRaw
      ? /\bmah\b/i.test(batteryRaw)
        ? `${batteryRaw} battery`
        : `${batteryRaw} mAh battery`
      : "";

    const variantText = [
      variant?.ram ? `${variant.ram} RAM` : "",
      variant?.storage ? `${variant.storage} storage` : "",
    ]
      .filter(Boolean)
      .join(" | ");

    const parts = [variantText, processor, displaySize, batteryText].filter(
      Boolean,
    );
    if (parts.length) return parts.slice(0, 3).join(" | ");

    return "Balanced specs for daily use";
  };

  const getCardSignalLabel = (device) => {
    const productId = getResolvedProductId(device);
    const key = productId != null ? String(productId) : null;
    if (!key) return "";

    const trend = trendSignalsByProductId[key] || {};
    const views7d = Number(trend?.views7d ?? 0);
    const trendScore = Number(trend?.trendScore ?? 0);
    const compareCount = Number(
      compareSignalsByProductId[key] ??
        device?.compare_count ??
        device?.compareCount ??
        device?.comparison_count ??
        0,
    );

    const parts = [];

    if (
      (Number.isFinite(views7d) && views7d > 0) ||
      (Number.isFinite(trendScore) && trendScore >= 70)
    ) {
      parts.push("Trending in last 7 days");
    }

    if (Number.isFinite(compareCount) && compareCount > 0) {
      if (compareCount >= 8) {
        parts.push("Most compared in last 7 days");
      } else {
        parts.push("Compared in last 7 days");
      }
    }

    return parts.join(" | ");
  };

  // Start comparison
  const startComparison = () => {
    const scrollToComparison = () => {
      setTimeout(() => {
        document.getElementById("comparison-section")?.scrollIntoView({
          behavior: "smooth",
        });
      }, 100);
    };

    if (!isComparing) {
      if (selectedDevices.length < MIN_DEVICES) {
        alert(`Please select at least ${MIN_DEVICES} devices to compare`);
        return;
      }
      setComparedDevices(selectedDevices);
      setSelectedDevices([]);
      setIsComparing(true);
      scrollToComparison();
      return;
    }

    scrollToComparison();
  };

  // Clear all
  const clearAll = () => {
    setSelectedDevices([]);
    setComparedDevices([]);
    setIsComparing(false);
    navigate(location.pathname, { replace: true });
  };

  const buildShareUrl = () => {
    const devicesParam = stringifyCompareDevicesParam(activeCompareEntries);

    // Build a human-friendly description from content (overview processor + price), truncated
    const overviewDesc = activeDevices
      .map((d) => {
        try {
          const specs = getDeviceSpecs(d, "overview");
          return `${d.name} - ${specs.processor || ""} - ${
            specs.price || ""
          }`.trim();
        } catch {
          return d.name;
        }
      })
      .join(" | ");
    const desc =
      overviewDesc.length > 240
        ? overviewDesc.slice(0, 237) + "..."
        : overviewDesc;

    const params = new URLSearchParams();
    if (devicesParam) params.set("devices", devicesParam);
    const compareType = getResolvedProductType(activeDevices[0]);
    if (compareType) params.set("type", String(compareType));
    if (desc) params.set("desc", desc);

    const basePath = location.pathname || "/compare";
    const query = params.toString();
    const url = `${SITE_ORIGIN}${basePath}${query ? `?${query}` : ""}`;

    return {
      url,
      desc,
    };
  };

  const copyToClipboard = async (text) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.top = "-9999px";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(textarea);
      return ok;
    } catch (err) {
      return false;
    }
  };

  // Share comparison
  const shareComparison = async () => {
    if (!activeDevices || activeDevices.length === 0) {
      alert("No devices selected to share");
      return;
    }

    const { url, desc } = buildShareUrl();

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Device Comparison",
          text: desc ? `Compare: ${desc}` : "Compare these devices",
          url,
        });
        return;
      } catch (err) {
        // fall back to copy if share is cancelled or fails
      }
    }

    const copied = await copyToClipboard(url);
    if (copied) {
      alert("Comparison link copied to clipboard!");
    } else {
      alert("Unable to copy link. Please copy it from the address bar.");
    }
  };

  const querySelectedNames = useMemo(() => {
    if (!queryDeviceEntries.length || !Array.isArray(availableDevices)) return [];

    const nameByProductId = new Map();
    (availableDevices || []).forEach((device) => {
      const productId = getResolvedProductId(device);
      const key = String(productId || "").trim();
      const name = device?.name || device?.model || device?.title || "";
      if (!key || !name || nameByProductId.has(key)) return;
      nameByProductId.set(key, name);
    });

    return queryDeviceEntries
      .map((entry) => nameByProductId.get(String(entry.baseId || "")))
      .filter(Boolean);
  }, [queryDeviceEntries, availableDevices]);

  const selectedNames = activeDevices.map((d) => d.name).filter(Boolean);
  const seoSelectedNames =
    selectedNames.length > 0 ? selectedNames : querySelectedNames;

  const comparisonNames =
    seoSelectedNames.length > 0
      ? seoSelectedNames.slice(0, MAX_DEVICES).join(" vs ")
      : canonicalCompareEntries.length > 0
        ? `Selected ${canonicalCompareEntries.length} Devices`
        : "Device Comparison";

  const currentYear = new Date().getFullYear();
  const metaTitle =
    seoSelectedNames.length > 0
      ? `${comparisonNames} | Compare Specs, Prices & Features ${currentYear}`
      : canonicalCompareEntries.length > 0
        ? `Compare Selected Devices | Specs, Prices & Features ${currentYear}`
      : `Device Comparison | Compare Specs, Prices & Features ${currentYear}`;

  const metaDescription =
    seoSelectedNames.length > 0
      ? `Compare ${comparisonNames} with detailed specifications, prices, performance, and key features side by side to find the right device for your needs.`
      : canonicalCompareEntries.length > 0
        ? "Compare selected devices side by side with detailed specifications, prices, performance, and feature differences to choose the right one."
      : "Compare smartphones, laptops, and more with detailed specifications, prices, performance, and key features side by side to find the right device for your needs.";

  useEffect(() => {
    if (typeof document === "undefined") return;

    document.title = metaTitle;
    upsertMetaTag('meta[name="description"]', {
      name: "description",
      content: metaDescription,
    });
    upsertMetaTag('meta[property="og:title"]', {
      property: "og:title",
      content: metaTitle,
    });
    upsertMetaTag('meta[property="og:description"]', {
      property: "og:description",
      content: metaDescription,
    });
    upsertMetaTag('meta[property="og:url"]', {
      property: "og:url",
      content: canonicalCompareUrl,
    });
    upsertMetaTag('meta[name="twitter:title"]', {
      name: "twitter:title",
      content: metaTitle,
    });
    upsertMetaTag('meta[name="twitter:description"]', {
      name: "twitter:description",
      content: metaDescription,
    });
    upsertMetaTag('meta[name="twitter:url"]', {
      name: "twitter:url",
      content: canonicalCompareUrl,
    });
    upsertCanonicalLink(canonicalCompareUrl);
  }, [canonicalCompareUrl, metaDescription, metaTitle]);

  return (
    <div className="min-h-screen ">
      <Helmet prioritizeSeoTags>
        <title key="compare-title">{metaTitle}</title>
        <meta key="compare-description" name="description" content={metaDescription} />
        <link key="compare-canonical" rel="canonical" href={canonicalCompareUrl} />
        <meta key="compare-og-type" property="og:type" content="website" />
        <meta key="compare-og-title" property="og:title" content={metaTitle} />
        <meta
          key="compare-og-description"
          property="og:description"
          content={metaDescription}
        />
        <meta key="compare-og-url" property="og:url" content={canonicalCompareUrl} />
        <meta key="compare-twitter-card" name="twitter:card" content="summary" />
        <meta key="compare-twitter-title" name="twitter:title" content={metaTitle} />
        <meta
          key="compare-twitter-description"
          name="twitter:description"
          content={metaDescription}
        />
        <meta key="compare-twitter-url" name="twitter:url" content={canonicalCompareUrl} />
      </Helmet>
      {/* Floating Header */}
      <div className="top-0 z-40 bg-white  max-w-6xl mx-auto sm:p-6 md:p-8 lg:p-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-600 rounded-lg">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Compare</h1>
                <p className="text-xs text-gray-500">
                  {activeDevices.length} device
                  {activeDevices.length !== 1 ? "s" : ""} selected
                </p>
                {sharedDescription ? (
                  <p className="text-xs text-gray-500 mt-1">
                    {sharedDescription}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {(activeDevices.length > 0 || selectedDevices.length > 0) && (
                <>
                  {activeDevices.length > 0 ? (
                    <button
                      onClick={shareComparison}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Share comparison"
                    >
                      <Share2 className="h-5 w-5 text-gray-600" />
                    </button>
                  ) : null}
                  <button
                    onClick={clearAll}
                    className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    Clear
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 sm:p-6 md:p-8 lg:p-10 bg-white">
        {/* Hero Section */}
        <div className="mb-1 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Device Comparison
          </h1>
          <p className="text-gray-600 mb-4">
            Compare up to {MAX_DEVICES} devices side by side
          </p>

          {usedSlots === 0 && (
            <div className="rounded-2xl p-6 max-w-2xl mx-auto">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Sparkles className="h-8 w-8 text-purple-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  How to Compare
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-200">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3 mx-auto">
                    <span className="text-purple-600 font-bold">1</span>
                  </div>
                  <p className="text-sm text-gray-700">Add 2-4 devices</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3 mx-auto">
                    <span className="text-blue-600 font-bold">2</span>
                  </div>
                  <p className="text-sm text-gray-700">Select categories</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3 mx-auto">
                    <span className="text-purple-600 font-bold">3</span>
                  </div>
                  <p className="text-sm text-gray-700">Compare & decide</p>
                </div>
              </div>
            </div>
          )}
        </div>
        {/* Selected Devices Section */}
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-[32px] leading-none font-bold text-slate-900 sm:text-3xl">
                {isComparing ? "Compared Devices" : "Selected Devices"}
                <span className="ml-2 text-xl font-medium text-slate-500">
                  ({activeDevices.length}/{MAX_DEVICES})
                </span>
              </h2>
              {activeDevices.length > 0 && (
                <p className="mt-2 text-sm text-slate-500">
                  Use the trash icon to remove a device
                </p>
              )}
            </div>

            {activeDevices.length > 0 && (
              <button
                onClick={() => setShowTips(!showTips)}
                className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                <AlertCircle className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Tips Card */}
          {showTips && activeDevices.length > 0 && (
            <div className="mb-4 p-4  rounded-xl border border-amber-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-amber-900 mb-1">
                    Comparison Tips
                  </h4>
                  <ul className="text-sm text-amber-800 space-y-1 list-disc pl-4">
                    <li>Swipe horizontally to see all devices</li>
                    <li>Change the variant (RAM/storage) from the dropdown</li>
                    <li>Ratings and prices update with variant selection</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Devices Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {activeDevices.map((device, index) => {
              const selectedVariant = getSelectedVariant(device);
              const variants = Array.isArray(device.variants)
                ? device.variants
                : [];
              const rawVariantIndex =
                variantSelection[device.id] ?? device.selectedVariantIndex ?? 0;
              const safeVariantIndex =
                variants.length > 0 && variants[rawVariantIndex]
                  ? rawVariantIndex
                  : 0;
              const specScore = getDeviceSpecScore(device);
              const summaryText = getCardSummary(
                device,
                selectedVariant || variants[safeVariantIndex] || null,
              );
              const signalLabel = getCardSignalLabel(device);
              return (
                <div
                  key={device.id}
                  className={`group relative flex h-full min-h-[260px] flex-col overflow-hidden  bg-white transition-all duration-200  focus-within:ring-2 focus-within:ring-purple-100`}
                >
                  <div className="absolute left-2 top-2 z-10 inline-flex items-center rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-gray-700 ring-1 ring-gray-200">
                    #{index + 1}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      isComparing
                        ? removeComparedDevice(device.id)
                        : removeDevice(device.id)
                    }
                    className="absolute right-2 top-2 z-10 inline-flex items-center justify-center rounded-full bg-white/90 p-1 text-gray-500 ring-1 ring-gray-200 hover:bg-red-50 hover:text-red-600 hover:ring-red-200 transition-colors"
                    aria-label="Remove device"
                    title="Remove"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>

                  {/* Content */}
                  <div className="flex flex-1 flex-col p-3 pt-8">
                    <div className="flex items-start gap-3">
                      <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100">
                        {specScore != null ? (
                          <div
                            className="absolute left-1 top-1 z-10 inline-flex flex-col items-center justify-center rounded-2xl border border-violet-200 bg-violet-50/95 px-2 py-1.5 leading-none"
                            style={{ minWidth: "44px" }}
                          >
                            <span className="text-[11px] font-bold text-violet-700">
                              {formatSpecScoreLabel(specScore)}
                            </span>
                            <span className="text-[8px] font-semibold uppercase tracking-wide text-violet-600">
                              Spec
                            </span>
                          </div>
                        ) : null}
                        <img
                          src={getPrimaryImage(device) || null}
                          alt={device.name}
                          className="h-full w-full object-contain p-2"
                          onError={(e) => {
                            e.target.src = `/api/placeholder/320/240?text=${encodeURIComponent(
                              (device.brand || "D").slice(0, 1),
                            )}`;
                          }}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-purple-600">
                          {device.brand || "Brand"}
                        </div>
                        <h3 className="mt-0.5 text-[16px] font-bold leading-tight text-slate-900 line-clamp-2 sm:text-[17px]">
                          {device.name ||
                            device.model ||
                            device.title ||
                            "Device"}
                        </h3>
                        <p className="mt-1 text-[12px] text-slate-500 line-clamp-2 leading-snug">
                          {summaryText}
                        </p>
                        {signalLabel ? (
                          <p className="mt-1 text-[12px] font-medium text-violet-600 line-clamp-1">
                            {signalLabel}
                          </p>
                        ) : null}
                        <p
                          className={`mt-1 text-[16px] font-extrabold ${
                            selectedVariant?.base_price || device.price
                              ? "text-green-600"
                              : "text-slate-400"
                          }`}
                          title={
                            selectedVariant?.base_price || device.price
                              ? "Price"
                              : "Price not available"
                          }
                        >
                          {selectedVariant
                            ? formatPrice(selectedVariant.base_price)
                            : formatPrice(device.price || 0)}
                        </p>
                      </div>
                    </div>

                    {/* Variant Selector / Info */}
                  </div>
                </div>
              );
            })}

            {/* Add Device Button - COMPACT */}
            {remainingSlots > 0 && (
              <button
                onClick={() => setShowSearch(true)}
                className="group relative flex min-h-[120px] h-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white p-6 text-center transition-all duration-200 hover:border-purple-300 hover:bg-slate-50"
              >
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-600  transition-transform duration-200 group-hover:scale-105">
                  <Plus className="h-5 w-5 text-white" />
                </div>
                <div className="text-base font-semibold text-slate-900">
                  Add Device
                </div>
                <div className="mt-1 text-sm text-slate-500">
                  {remainingSlots} slot{remainingSlots !== 1 ? "s" : ""} left
                </div>
              </button>
            )}
          </div>

          {/* Compare Button */}
          {!isComparing && selectedDevices.length >= MIN_DEVICES && (
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={startComparison}
                className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-all duration-300 flex items-center gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                Start Comparing
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
        {/* Search Modal */}
        {showSearch && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center p-4 pt-16 sm:p-6">
            <div className="bg-white rounded-none w-full max-w-2xl max-h-[85vh] flex flex-col border border-gray-200 animate-in slide-in-from-bottom-4 duration-300">
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Add Devices
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Select devices to compare
                    </p>
                  </div>
                  <button
                    onClick={() => setShowSearch(false)}
                    className="p-2 hover:bg-gray-100 rounded-none transition-colors"
                  >
                    <X className="h-5 w-5 text-gray-500" />
                  </button>
                </div>

                {/* Search Input */}
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-purple-500 group-focus-within:text-purple-600 transition-colors duration-200" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search by brand, model, or feature..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-100 focus:border-purple-500 outline-none text-base placeholder-gray-400 transition-all duration-200"
                    autoFocus
                  />
                </div>

                <div className="mt-4">
                  <div className="mb-1 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-purple-600" />
                      <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                        Popular Features
                      </h3>
                    </div>
                    {activeQuickFilter !== "all" ? (
                      <button
                        type="button"
                        onClick={() => setActiveQuickFilter("all")}
                        className="text-xs sm:text-sm text-purple-700 hover:text-purple-900 font-semibold"
                      >
                        Clear
                      </button>
                    ) : null}
                  </div>
                  <p className="mb-2 text-xs text-gray-600">
                    Popular choices from other users (last 7 days)
                  </p>
                  <div className="flex gap-2.5 overflow-x-auto pb-2 hide-scrollbar">
                    {QUICK_FILTER_CHIPS.map((chip) => {
                      const Icon = chip.icon;
                      const active = activeQuickFilter === chip.id;
                      return (
                        <button
                          key={chip.id}
                          type="button"
                          onClick={() =>
                            setActiveQuickFilter((prev) =>
                              prev === chip.id ? "all" : chip.id,
                            )
                          }
                          className={`flex items-center gap-2 px-3 py-2 rounded-full border text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                            active
                              ? "bg-purple-50 text-purple-700 border-purple-400"
                              : "bg-white text-gray-700 border-gray-200 hover:border-purple-300 hover:text-purple-700"
                          }`}
                        >
                          <span
                            className={
                              active ? "text-purple-600" : "text-purple-600"
                            }
                          >
                            <Icon className="h-4 w-4" />
                          </span>
                          <span>{chip.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Search Results */}
              <div className="flex-1 overflow-y-auto">
                {filteredDevices.length === 0 ? (
                  <div className="p-12 text-center">
                    <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      No devices found
                    </h4>
                    <p className="text-gray-500">
                      Try different keywords or browse all devices
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4">
                    {filteredDevices.map((it, _idx) => {
                      const base = it.base;
                      const variant = it.variant;
                      const vi = it.variantIndex ?? 0;
                      const showAiTag = hasAiFeatures(base);
                      const specScore = getDeviceSpecScore(base);
                      const summaryText = getCardSummary(base, variant);
                      const signalLabel = getCardSignalLabel(base);
                      const baseId =
                        base?.id ||
                        base?.product_id ||
                        base?.productId ||
                        base?.smartphoneId ||
                        base?.model ||
                        null;
                      const key = `${baseId ?? "unknown"}-${vi}-${_idx}`;
                      const displayVariant =
                        variant || (base.variants && base.variants[vi]) || null;
                      return (
                        <button
                          key={key}
                          onClick={() => addDevice(base, vi)}
                          className="text-left rounded-none p-4 hover:bg-gray-50 hover:border-purple-200 transition-all duration-200 group"
                        >
                          <div className="flex items-start gap-3">
                            <div className="relative w-24 h-24 p-1 bg-gray-100 rounded-md flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
                              {specScore != null ? (
                                <div
                                  className="absolute left-1 top-1 z-10 inline-flex flex-col items-center justify-center rounded-2xl border border-violet-200 bg-violet-50/95 px-2 py-1.5 leading-none"
                                  style={{ minWidth: "44px" }}
                                >
                                  <span className="text-[11px] font-bold text-violet-700">
                                    {formatSpecScoreLabel(specScore)}
                                  </span>
                                  <span className="text-[8px] font-semibold uppercase tracking-wide text-violet-600">
                                    Spec
                                  </span>
                                </div>
                              ) : null}
                              <img
                                src={getPrimaryImage(base) || null}
                                alt={base.name}
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="mb-1">
                                <div className="mb-1 flex flex-wrap items-center gap-1.5">
                                  <div className="text-xs font-semibold text-purple-600">
                                    {base.brand}
                                  </div>
                                  {showAiTag && (
                                    <span className="inline-flex items-center gap-1 rounded-full  px-2 py-0.5 text-[10px] font-semibold text-purple-700 ring-1 ring-purple-200 whitespace-nowrap">
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
                                  )}
                                </div>
                                <h4 className="font-bold text-gray-900 text-sm line-clamp-2 leading-tight">
                                  {base.name}
                                </h4>
                                <p className="mt-1 text-[11px] text-gray-500 line-clamp-2 leading-snug">
                                  {summaryText}
                                </p>
                                {signalLabel ? (
                                  <p className="mt-1 text-[11px] font-medium text-violet-600 line-clamp-2 leading-snug">
                                    {signalLabel}
                                  </p>
                                ) : null}
                              </div>

                              {/* Rating */}

                              {/* Variant & Price */}
                              <div className="flex items-center justify-between">
                                <div className="text-sm font-bold text-green-600">
                                  {displayVariant
                                    ? formatPrice(displayVariant.base_price)
                                    : formatPrice(base.price || 0)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-none">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <span className="text-gray-600">
                      {filteredDevices.length} devices
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-gray-600">
                        {remainingSlots} slots available
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowSearch(false)}
                    className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Comparison Section */}
        {isComparing && comparedDevices.length >= MIN_DEVICES && (
          <div
            id="comparison-section"
            className="space-y-6 animate-in fade-in duration-500"
          >
            {/* Detailed Comparison Header (smartphone-style: no tabs) */}
            <div className="rounded-2xl border border-slate-200 bg-white">
              <div className="px-4 py-4 sm:px-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                      <BarChart3 className="h-5 w-5 text-violet-500" />
                      Detailed Comparison
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      Compare section-wise specifications across the selected
                      devices.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {remainingSlots > 0 ? (
                      <button
                        type="button"
                        onClick={() => setShowSearch(true)}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:border-violet-300 hover:bg-violet-50"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add Device
                      </button>
                    ) : null}
                    <div className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700">
                      {comparedDevices.length} devices
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section Details (tables like Smartphone detail UI) */}
            <div className="space-y-6">
              {SECTIONS.map((section) => {
                const specKeys = sectionSpecKeys[section.id] || [];
                if (specKeys.length === 0) return null;

                const Icon = section.icon;
                const iconColorClass =
                  {
                    overview: "text-purple-500",
                    display: "text-green-500",
                    camera: "text-purple-500",
                    performance: "text-yellow-500",
                    battery: "text-red-500",
                    network: "text-purple-500",
                    audio: "text-indigo-500",
                    features: "text-orange-500",
                  }[section.id] || "text-purple-500";

                return (
                  <div key={`section-${section.id}`} className="bg-white">
                    <div
                      id={`spec-${section.id}`}
                      className="px-1 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4"
                    >
                      <h4 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-700 sm:text-sm">
                        <Icon className={iconColorClass} />
                        {section.label}
                      </h4>

                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                          <thead className="bg-slate-50/80">
                            <tr>
                              <th className="w-1/3 px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 align-top">
                                Specification
                              </th>
                              {comparedDevices.map((device) => {
                                const selectedVariant =
                                  getSelectedVariant(device);
                                const ranking =
                                  section.id === "overview"
                                    ? rankingByDeviceId[String(device.id)] ||
                                      null
                                    : null;
                                const name =
                                  device.name ||
                                  device.model ||
                                  device.title ||
                                  "Device";

                                return (
                                  <th
                                    key={`${section.id}-head-${device.id}`}
                                    className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 align-top"
                                  >
                                    <div className="min-w-[180px] relative pr-6">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          removeComparedDevice(device.id)
                                        }
                                        className="absolute top-0 right-0 rounded-full p-1 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                                        title="Remove device from comparison"
                                        aria-label="Remove device from comparison"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                      {device.brand ? (
                                        <div className="truncate text-[11px] font-semibold normal-case tracking-normal text-violet-600">
                                          {device.brand}
                                        </div>
                                      ) : null}
                                      <div className="truncate text-[13px] font-semibold normal-case text-slate-900">
                                        {name}
                                      </div>

                                      {selectedVariant ? (
                                        <div className="truncate text-[11px] font-medium normal-case text-slate-500">
                                          {selectedVariant.ram || "N/A"} /{" "}
                                          {selectedVariant.storage || "N/A"}
                                        </div>
                                      ) : null}
                                    </div>
                                  </th>
                                );
                              })}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {specKeys.map((specKey, idx) => {
                              const isOverview = section.id === "overview";
                              const isRating =
                                isOverview && specKey === "rating";
                              const isPrice = isOverview && specKey === "price";
                              const isVariant =
                                isOverview && specKey === "variant";
                              const specHint = getSpecHint(section.id, specKey);

                              return (
                                <tr
                                  key={`${section.id}-${specKey}`}
                                  className={
                                    idx % 2 === 0
                                      ? "bg-white hover:bg-violet-50/20"
                                      : "bg-slate-50/50 hover:bg-violet-50/30"
                                  }
                                >
                                  <td className="w-1/3 px-6 py-3 text-sm font-semibold text-slate-700 align-top">
                                    <div className="inline-flex items-center gap-1.5">
                                      <span>{toNormalCase(specKey)}</span>
                                      {specHint ? (
                                        <span
                                          className="inline-flex cursor-help text-slate-400 hover:text-violet-500"
                                          title={specHint}
                                        >
                                          <Info className="h-3.5 w-3.5" />
                                        </span>
                                      ) : null}
                                    </div>
                                  </td>
                                  {comparedDevices.map((device) => {
                                    const specs = getDeviceSpecs(
                                      device,
                                      section.id,
                                    );
                                    const value = specs[specKey];
                                    const isEmpty =
                                      value === undefined ||
                                      value === null ||
                                      value === "" ||
                                      value === "N/A";
                                    const renderedValue = isEmpty
                                      ? null
                                      : section.id === "camera"
                                        ? renderCameraComparisonValue(
                                            value,
                                            specKey,
                                          )
                                        : renderStructuredSpecValue(
                                            value,
                                            specKey,
                                          );
                                    const shouldRenderNaIcon =
                                      isEmpty || renderedValue === "N/A";

                                    return (
                                      <td
                                        key={`${section.id}-${device.id}-${specKey}`}
                                        className="min-w-[180px] px-6 py-3 text-sm text-slate-800 align-top"
                                      >
                                        {isRating && !isEmpty ? (
                                          <div className="flex items-center gap-2">
                                            <div className="flex gap-0.5">
                                              {[...Array(5)].map((_, i) => (
                                                <Star
                                                  key={i}
                                                  className={`h-3.5 w-3.5 ${
                                                    i <
                                                    Math.floor(
                                                      Number(value) || 0,
                                                    )
                                                      ? "text-yellow-400 fill-yellow-400"
                                                      : "text-gray-200"
                                                  }`}
                                                />
                                              ))}
                                            </div>
                                            <span className="text-sm font-semibold text-slate-900">
                                              {value}
                                            </span>
                                          </div>
                                        ) : (
                                          <div
                                            className={`${
                                              shouldRenderNaIcon
                                                ? "text-violet-500"
                                                : isPrice
                                                  ? "font-semibold text-emerald-600"
                                                  : isVariant
                                                    ? "font-semibold text-violet-700"
                                                    : "text-slate-800"
                                            }`}
                                          >
                                            {shouldRenderNaIcon ? (
                                              <span
                                                title="Not available"
                                                className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-violet-50 text-violet-500 ring-1 ring-violet-200"
                                              >
                                                <FaTimes
                                                  className="h-3 w-3"
                                                  aria-hidden="true"
                                                />
                                                <span className="sr-only">
                                                  Not available
                                                </span>
                                              </span>
                                            ) : (
                                              renderedValue
                                            )}
                                          </div>
                                        )}
                                      </td>
                                    );
                                  })}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={shareComparison}
                className="p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Share2 className="h-4 w-4 text-gray-700" />
                <span className="font-medium text-gray-700 text-sm">
                  Share Comparison
                </span>
              </button>
              <button
                onClick={() => navigate("/smartphones")}
                className="p-3 bg-purple-600 border border-purple-600 rounded-xl hover:bg-purple-700 transition-all duration-200 flex items-center justify-center gap-2 text-white"
              >
                <Plus className="h-4 w-4" />
                <span className="font-medium text-sm">Browse More</span>
              </button>
            </div>
          </div>
        )}
        {/* Empty State */}
        {usedSlots === 0 && !showSearch && (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="h-10 w-10 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Start Comparing
            </h3>
            <p className="text-gray-600 mb-4 max-w-md mx-auto">
              Add 2-4 devices to see detailed specifications side by side
            </p>
            <button
              onClick={() => setShowSearch(true)}
              className="px-6 py-2.5 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-all duration-300 inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Your First Device
            </button>
          </div>
        )}
        {/* Details Modal */}
        {showDetailsModal && modalDevice && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-300">
              {/* Modal Header */}
              <div className="sticky top-0 z-20 bg-white px-6 py-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-50 border border-purple-100 rounded-lg p-1 flex-shrink-0 overflow-hidden">
                      <img
                        src={getPrimaryImage(modalDevice)}
                        alt={modalDevice.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">
                        {modalDevice.name}
                      </h2>
                      <p className="text-sm text-gray-600">
                        {modalDevice.brand}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Modal Content - Single View */}
              <div className="p-6 space-y-6 overflow-y-auto">
                {/* Specifications Section */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {[
                      {
                        label: "Brand",
                        value: modalDevice.brand,
                        icon: "🏷️",
                      },
                      {
                        label: "Model",
                        value: modalDevice.model || modalDevice.name,
                        icon: "📱",
                      },
                      {
                        label: "Price",
                        value: formatPrice(
                          getSelectedVariant(modalDevice)?.base_price ||
                            modalDevice.price ||
                            0,
                        ),
                        icon: "💰",
                        color: "green",
                      },
                      {
                        label: "Variant",
                        value: getSelectedVariant(modalDevice)
                          ? `${getSelectedVariant(modalDevice).ram}/${getSelectedVariant(modalDevice).storage}`
                          : "N/A",
                        icon: "📦",
                      },
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="text-2xl mb-2">{item.icon}</div>
                        <div className="text-xs text-gray-600 font-medium mb-1">
                          {item.label}
                        </div>
                        <div
                          className={`font-bold text-sm ${
                            item.color === "green"
                              ? "text-green-600"
                              : "text-gray-900"
                          }`}
                        >
                          {item.value}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <table className="w-full">
                      <tbody className="divide-y divide-gray-100">
                        {[
                          {
                            label: "Operating System",
                            value: modalDevice.performance?.os || "N/A",
                          },
                          {
                            label: "Processor",
                            value: modalDevice.performance?.processor || "N/A",
                          },
                          {
                            label: "RAM",
                            value:
                              getSelectedVariant(modalDevice)?.ram ||
                              modalDevice.performance?.ram ||
                              "N/A",
                          },
                          {
                            label: "Storage",
                            value:
                              getSelectedVariant(modalDevice)?.storage ||
                              modalDevice.performance?.storage ||
                              "N/A",
                          },
                          {
                            label: "Launch Date",
                            value: modalDevice.launch_date
                              ? new Date(
                                  modalDevice.launch_date,
                                ).toLocaleDateString()
                              : "N/A",
                          },
                        ].map((item, idx) => (
                          <tr
                            key={idx}
                            className={
                              idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                            }
                          >
                            <td className="px-6 py-3 text-sm font-medium text-gray-600 w-1/3">
                              {item.label}
                            </td>
                            <td className="px-6 py-3 text-sm font-semibold text-gray-900 w-2/3">
                              {item.value}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Performance Section */}
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
                  <div className="p-2 bg-yellow-500 rounded-lg">
                    <Cpu className="h-5 w-5 text-white" />
                  </div>
                  Performance
                </h3>
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <table className="w-full">
                    <tbody className="divide-y divide-gray-100">
                      {modalDevice.performance &&
                        Object.entries(modalDevice.performance)
                          .filter(
                            ([k, v]) =>
                              v &&
                              !["ai_features", "sphere_rating"].includes(k),
                          )
                          .map(([key, value], idx) => (
                            <tr
                              key={key}
                              className={
                                idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                              }
                            >
                              <td className="px-6 py-3 text-sm font-medium text-gray-600 w-1/3">
                                {toNormalCase(key)}
                              </td>
                              <td className="px-6 py-3 text-sm font-semibold text-gray-900 w-2/3">
                                {formatSpecValue(value, key)}
                              </td>
                            </tr>
                          ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Display Section */}
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
                  <div className="p-2 bg-purple-500 rounded-lg">
                    <Monitor className="h-5 w-5 text-white" />
                  </div>
                  Display
                </h3>
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <table className="w-full">
                    <tbody className="divide-y divide-gray-100">
                      {modalDevice.display &&
                        Object.entries(modalDevice.display)
                          .filter(([k, v]) => v && !["ai_features"].includes(k))
                          .map(([key, value], idx) => (
                            <tr
                              key={key}
                              className={
                                idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                              }
                            >
                              <td className="px-6 py-3 text-sm font-medium text-gray-600 w-1/3">
                                {toNormalCase(key)}
                              </td>
                              <td className="px-6 py-3 text-sm font-semibold text-gray-900 w-2/3">
                                {formatSpecValue(value, key)}
                              </td>
                            </tr>
                          ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Camera Section */}
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
                  <div className="p-2 bg-pink-500 rounded-lg">
                    <Camera className="h-5 w-5 text-white" />
                  </div>
                  Camera
                </h3>
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <table className="w-full">
                    <tbody className="divide-y divide-gray-100">
                      {[
                        {
                          label: "Main Camera",
                          value: (() => {
                            const cam = modalDevice.camera || {};
                            if (cam.main_camera_megapixels) {
                              return `${cam.main_camera_megapixels} MP`;
                            }
                            const rearMain =
                              cam.rear_camera?.main_camera ||
                              cam.rear_camera?.main ||
                              cam.main_camera ||
                              cam.main ||
                              null;
                            if (!rearMain) return "N/A";
                            if (typeof rearMain === "object") {
                              return (
                                rearMain.resolution ||
                                rearMain.megapixels ||
                                formatSpecValue(rearMain, "main_camera")
                              );
                            }
                            return formatSpecValue(rearMain, "main_camera");
                          })(),
                        },
                        {
                          label: "Front Camera",
                          value: modalDevice.camera?.front_camera
                            ? formatSpecValue(
                                modalDevice.camera.front_camera,
                                "front_camera",
                              )
                            : "N/A",
                        },
                        {
                          label: "Recording",
                          value:
                            modalDevice.camera?.video_recording ||
                            modalDevice.camera?.recording ||
                            "N/A",
                        },
                        {
                          label: "Features",
                          value:
                            modalDevice.camera
                              ?.rear_camera_photography_features ||
                            modalDevice.camera?.features ||
                            modalDevice.camera?.ai_features ||
                            "N/A",
                        },
                      ].map((item, idx) => (
                        <tr
                          key={idx}
                          className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                        >
                          <td className="px-6 py-3 text-sm font-medium text-gray-600 w-1/3">
                            {item.label}
                          </td>
                          <td className="px-6 py-3 text-sm font-semibold text-gray-900 w-2/3">
                            {formatSpecValue(item.value, item.label)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Battery Section */}
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <Battery className="h-5 w-5 text-white" />
                  </div>
                  Battery
                </h3>
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <table className="w-full">
                    <tbody className="divide-y divide-gray-100">
                      {[
                        {
                          label: "Capacity",
                          value: (() => {
                            const b = modalDevice.battery || {};
                            const cap =
                              b.battery_capacity_mah ||
                              b.battery_capacity ||
                              b.capacity_mah ||
                              b.capacity ||
                              b.battery ||
                              null;
                            if (!cap) return "N/A";
                            const capText = String(cap);
                            return /mah/i.test(capText)
                              ? capText
                              : `${capText} mAh`;
                          })(),
                        },
                        {
                          label: "Type",
                          value:
                            modalDevice.battery?.type ||
                            modalDevice.battery?.battery_type ||
                            "N/A",
                        },
                        {
                          label: "Fast Charging",
                          value:
                            modalDevice.battery?.fast_charging ||
                            modalDevice.battery?.charging_power ||
                            modalDevice.battery?.charging ||
                            "N/A",
                        },
                        {
                          label: "Wireless Charging",
                          value:
                            modalDevice.battery?.wireless_charging ||
                            modalDevice.battery?.wireless_reverse_charging ||
                            "N/A",
                        },
                      ].map((item, idx) => (
                        <tr
                          key={idx}
                          className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                        >
                          <td className="px-6 py-3 text-sm font-medium text-gray-600 w-1/3">
                            {item.label}
                          </td>
                          <td className="px-6 py-3 text-sm font-semibold text-gray-900 w-2/3">
                            {formatSpecValue(item.value, item.label)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Network Section */}
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
                  <div className="p-2 bg-cyan-500 rounded-lg">
                    <Wifi className="h-5 w-5 text-white" />
                  </div>
                  Network
                </h3>
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <table className="w-full">
                    <tbody className="divide-y divide-gray-100">
                      {[
                        {
                          label: "5G",
                          value:
                            modalDevice.network?.["5g"] ||
                            modalDevice.network?.["5g_bands"] ||
                            modalDevice.network?.five_g ||
                            modalDevice.connectivity?.["5g_bands"] ||
                            modalDevice.connectivity?.network_type ||
                            "N/A",
                        },
                        {
                          label: "WiFi",
                          value:
                            modalDevice.connectivity?.wifi ||
                            modalDevice.network?.wifi ||
                            "N/A",
                        },
                        {
                          label: "Bluetooth",
                          value:
                            modalDevice.connectivity?.bluetooth ||
                            modalDevice.network?.bluetooth ||
                            "N/A",
                        },
                        {
                          label: "GPS",
                          value:
                            modalDevice.network?.gps ||
                            modalDevice.connectivity?.gps ||
                            "N/A",
                        },
                        {
                          label: "NFC",
                          value:
                            modalDevice.connectivity?.nfc ||
                            modalDevice.network?.nfc ||
                            "N/A",
                        },
                      ].map((item, idx) => (
                        <tr
                          key={idx}
                          className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                        >
                          <td className="px-6 py-3 text-sm font-medium text-gray-600 w-1/3">
                            {item.label}
                          </td>
                          <td className="px-6 py-3 text-sm font-semibold text-gray-900 w-2/3">
                            {formatSpecValue(item.value, item.label)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 border-t border-gray-200 bg-gray-50 px-6 py-4 flex gap-3">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileCompare;
