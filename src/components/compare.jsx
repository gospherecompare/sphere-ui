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
  Radio,
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
        // filter candidates by normalized type
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

    if (!searchQuery.trim()) return notSelected.slice(0, 20);
    const query = searchQuery.toLowerCase();
    return notSelected
      .filter(
        (it) =>
          (it.base.name || "").toLowerCase().includes(query) ||
          (it.base.brand || "").toLowerCase().includes(query) ||
          (it.base.model || "").toLowerCase().includes(query),
      )
      .slice(0, 20);
  }, [
    availableDevices,
    searchQuery,
    selectedDevices,
    comparedDevices,
    isComparing,
  ]);

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
      const entries = value.filter((entry) => entry != null && entry !== "");
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
      const entries = Object.entries(value).filter(
        ([, nestedValue]) => nestedValue != null && nestedValue !== "",
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

  const cleanSpecs = (specs) => {
    if (!specs || typeof specs !== "object") return {};
    const blocked = new Set(["sphere_rating", "ai_features"]);
    return Object.fromEntries(
      Object.entries(specs).filter(([k, v]) => v && !blocked.has(k)),
    );
  };

  const hasAiFeatures = (device) => {
    if (!device) return false;
    const buckets = [
      device.ai_features,
      device.performance?.ai_features,
      device.camera?.ai_features,
      device.display?.ai_features,
      device.battery?.ai_features,
      device.connectivity?.ai_features,
      device.multimedia?.ai_features,
      device.build_design?.ai_features,
    ];
    return buckets.some((v) => Array.isArray(v) && v.length > 0);
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
      ([k, v]) => k !== "sphere_rating" && v !== "" && v != null && v !== false,
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
          rows.push([toNormalCase(lens), formatSpecValue(spec, lens)]);
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
    if (section === "overview") {
      const selectedVariant = getSelectedVariant(device);
      return {
        rating: device.rating,
        price: formatPrice(selectedVariant?.base_price || device.price || 0),
        variant: `${selectedVariant?.ram || "N/A"} / ${
          selectedVariant?.storage || "N/A"
        }`,
        os: device.performance?.os || device.os || "N/A",
        processor: device.performance?.processor || "N/A",
        launch_date: device.launch_date
          ? new Date(device.launch_date).toLocaleDateString()
          : "N/A",
      };
    }
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
      battery.capacity_mah ||
      battery.capacity ||
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
          if (specs[key] && specs[key] !== "N/A") specKeys.add(key);
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
      isComparing && comparedDevices.length > 0 ? comparedDevices : selectedDevices;
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
            if (prev.some((p) => String(p.id) === String(entry.id))) return prev;
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

        if ((toAdd || devicesParam) && addedAny) {
          navigate(location.pathname, { replace: true });
        }
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
  };

  const buildShareUrl = () => {
    // Build devices param as baseId:variantIndex entries
    const devicesParam = activeDevices
      .map((d) => {
        const baseId =
          d.baseId ?? d.productId ?? d.product_id ?? d.id ?? d.model ?? "";
        const variantIndex =
          variantSelection[d.id] ?? d.selectedVariantIndex ?? 0;
        return baseId ? `${baseId}:${variantIndex}` : "";
      })
      .filter(Boolean)
      .join(",");

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
    if (desc) params.set("desc", desc);

    const url = new URL(window.location.href);
    url.pathname = location.pathname;
    url.search = params.toString();
    url.hash = "";

    return {
      url: url.toString(),
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

  const selectedNames = activeDevices.map((d) => d.name).filter(Boolean);

  const comparisonNames =
    selectedNames.length > 0
      ? selectedNames.slice(0, MAX_DEVICES).join(" vs ")
      : "Device Comparison";

  const currentYear = new Date().getFullYear();
  const metaTitle =
    selectedNames.length > 0
      ? `${comparisonNames} | Compare Specs, Prices & Features ${currentYear}`
      : `Device Comparison | Compare Specs, Prices & Features ${currentYear}`;

  const metaDescription =
    selectedNames.length > 0
      ? `Compare ${comparisonNames} with detailed specifications, prices, performance, and key features side by side to find the right device for your needs.`
      : "Compare smartphones, laptops, and more with detailed specifications, prices, performance, and key features side by side to find the right device for your needs.";

  return (
    <div className="min-h-screen ">
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDescription} />
        {typeof window !== "undefined" && (
          <meta property="og:url" content={window.location.href} />
        )}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={metaTitle} />
        <meta name="twitter:description" content={metaDescription} />
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
        <div className="mb-8 text-center">
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
        {/* Selected Devices Section - COMPACT LAYOUT */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {isComparing ? "Compared Devices" : "Selected Devices"}
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({activeDevices.length}/{MAX_DEVICES})
                </span>
              </h2>
              {activeDevices.length > 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  Use the trash icon to remove a device
                </p>
              )}
            </div>

            {activeDevices.length > 0 && (
              <button
                onClick={() => setShowTips(!showTips)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <AlertCircle className="h-5 w-5 text-gray-500" />
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

          {/* Devices Grid - ULTRA COMPACT LAYOUT */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
            {activeDevices.map((device, index) => {
              const selectedVariant = getSelectedVariant(device);
              const showAiTag = hasAiFeatures(device);
              const variants = Array.isArray(device.variants)
                ? device.variants
                : [];
              const rawVariantIndex =
                variantSelection[device.id] ?? device.selectedVariantIndex ?? 0;
              const safeVariantIndex =
                variants.length > 0 && variants[rawVariantIndex]
                  ? rawVariantIndex
                  : 0;
              const ratingValue = Number(device.rating);
              const hasRating =
                Number.isFinite(ratingValue) && Number(ratingValue) > 0;
              const quickSpecs = [
                {
                  key: "Processor",
                  value: getQuickProcessorText(device),
                  icon: Cpu,
                },
                {
                  key: "Display",
                  value: getQuickDisplayText(device),
                  icon: Monitor,
                },
                {
                  key: "Battery",
                  value: getQuickBatteryText(device),
                  icon: Battery,
                },
                {
                  key: "Camera",
                  value: getQuickCameraText(device),
                  icon: Camera,
                },
              ];
              return (
                <div
                  key={device.id}
                  className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:border-purple-300 hover:shadow-md focus-within:ring-2 focus-within:ring-purple-100"
                >
                  {/* Media */}
                  <div className="relative p-2 sm:p-3 pb-0">
                    <div className="absolute left-2 top-2 sm:left-3 sm:top-3 z-10 inline-flex items-center rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-gray-700 ring-1 ring-gray-200">
                      #{index + 1}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        isComparing
                          ? removeComparedDevice(device.id)
                          : removeDevice(device.id)
                      }
                      className="absolute right-2 top-2 sm:right-3 sm:top-3 z-10 inline-flex items-center justify-center rounded-full bg-white/90 p-1 text-gray-500 ring-1 ring-gray-200 hover:bg-red-50 hover:text-red-600 hover:ring-red-200 transition-colors"
                      aria-label="Remove device"
                      title="Remove"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>

                    <div className="aspect-[16/9] w-full overflow-hidden rounded-xl bg-gray-50 ring-1 ring-gray-200 flex items-center justify-center">
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
                  </div>

                  {/* Content */}
                  <div className="flex flex-1 flex-col p-2 sm:p-3 pt-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs font-semibold text-purple-700 truncate">
                            {device.brand || "Brand"}
                          </span>
                          {hasRating ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-2 py-0.5 text-[10px] font-semibold text-yellow-700 ring-1 ring-yellow-200 shrink-0">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              {ratingValue.toFixed(1)}
                            </span>
                          ) : null}
                          {showAiTag ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-700 ring-1 ring-purple-200 shrink-0">
                              <Sparkles className="h-3 w-3" />
                              AI
                            </span>
                          ) : null}
                        </div>
                        <h3 className="mt-0.5 text-[13px] font-semibold text-gray-900 line-clamp-2 leading-snug min-h-[2.25rem]">
                          {device.name ||
                            device.model ||
                            device.title ||
                            "Device"}
                        </h3>
                      </div>
                    </div>

                    {/* Variant Selector / Info */}
                    {variants.length > 1 ? (
                      <div className="mt-2">
                        <label
                          htmlFor={`variant-${device.id}`}
                          className="sr-only"
                        >
                          Variant
                        </label>
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 flex-shrink-0 text-purple-500" />
                          <select
                            id={`variant-${device.id}`}
                            value={safeVariantIndex}
                            onChange={(e) =>
                              updateDeviceVariant(
                                device.id,
                                Number(e.target.value),
                              )
                            }
                            className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-gray-700 outline-none transition-colors focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                          >
                            {variants.map((v, vi) => (
                              <option key={vi} value={vi}>
                                {formatVariantLabel(v, vi)}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ) : selectedVariant ? (
                      <div className="mt-2">
                        <div className="flex items-center gap-2 text-[11px] text-gray-600">
                          <Package className="h-4 w-4 flex-shrink-0 text-purple-500" />
                          <span className="font-medium truncate text-gray-700">
                            RAM {selectedVariant.ram || "N/A"} | ROM{" "}
                            {selectedVariant.storage || "N/A"}
                          </span>
                        </div>
                      </div>
                    ) : null}

                    <div className="mt-2 grid grid-cols-2 gap-1.5">
                      {quickSpecs.map((item) => {
                        const SpecIcon = item.icon;
                        const value =
                          item.value == null || item.value === ""
                            ? "N/A"
                            : String(item.value);
                        return (
                          <div
                            key={`${device.id}-${item.key}`}
                            className="rounded-lg border border-gray-100 bg-gray-50 px-2 py-1.5"
                            title={`${item.key}: ${value}`}
                          >
                            <div className="flex items-center gap-1 text-[10px] font-semibold text-gray-500">
                              <SpecIcon className="h-3 w-3 text-purple-500" />
                              <span>{item.key}</span>
                            </div>
                            <div className="mt-0.5 text-[11px] font-semibold text-gray-800 truncate">
                              {value}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Price + Details */}
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div
                        className={`text-sm sm:text-base font-bold ${
                          selectedVariant?.base_price || device.price
                            ? "text-green-600"
                            : "text-gray-400"
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
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          openDetailsModal(device, "specifications")
                        }
                        className="inline-flex items-center justify-center rounded-full bg-purple-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-purple-700 transition-all duration-200"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Add Device Button - COMPACT */}
            {remainingSlots > 0 && (
              <button
                onClick={() => setShowSearch(true)}
                className="group relative flex h-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-white p-4 text-center transition-all duration-200 hover:border-purple-300 hover:bg-gray-50"
              >
                <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600 shadow-sm transition-transform duration-200 group-hover:scale-105">
                  <Plus className="h-5 w-5 text-white" />
                </div>
                <div className="text-[13px] font-semibold text-gray-900">
                  Add Device
                </div>
                <div className="mt-1 text-xs text-gray-500">
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
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col border border-gray-200 animate-in slide-in-from-bottom-4 duration-300">
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
                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
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
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-100 focus:border-purple-500 outline-none text-base placeholder-gray-400 transition-all duration-200"
                    autoFocus
                  />
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
                          className="text-left bg-white border border-gray-200 rounded-xl p-4 hover:bg-gray-50 hover:border-purple-200 transition-all duration-200 group"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-24 h-24 bg-gray-100 rounded-xl  flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
                              <img
                                src={getPrimaryImage(base) || null}
                                alt={base.name}
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="mb-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <div className="text-sm font-semibold text-purple-600">
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
                              </div>

                              {/* Rating */}

                              {/* Variant & Price */}
                              <div className="flex items-center justify-between">
                                {displayVariant && (
                                  <div className="text-xs text-gray-600">
                                    <div className="flex items-center gap-1">
                                      <span>{displayVariant.ram || "N/A"}</span>
                                      <span>/</span>
                                      <span>
                                        {displayVariant.storage || "N/A"}
                                      </span>
                                    </div>
                                  </div>
                                )}
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
              <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
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
            <div className="bg-white rounded-xl">
              <div className="px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-purple-600" />
                      Detailed Comparison
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Compare section-wise specifications across the selected
                      devices.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {remainingSlots > 0 ? (
                      <button
                        type="button"
                        onClick={() => setShowSearch(true)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-full bg-white border border-gray-200 text-gray-700 hover:border-purple-300 hover:bg-purple-50 transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add Device
                      </button>
                    ) : null}
                    <div className="text-xs font-semibold text-purple-700 bg-purple-100 px-3 py-1.5 rounded-full">
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
                  <div
                    key={`section-${section.id}`}
                    className="bg-white rounded-xl"
                  >
                    <div
                      id={`spec-${section.id}`}
                      className="px-1 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4"
                    >
                      <h4 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                        <Icon className={iconColorClass} />
                        {section.label}
                      </h4>

                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100">
                          <thead className="bg-white">
                            <tr>
                              <th className="px-6 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide w-1/3 align-top">
                                Specification
                              </th>
                              {comparedDevices.map((device) => {
                                const selectedVariant =
                                  getSelectedVariant(device);
                                const ranking = section.id === "overview"
                                  ? rankingByDeviceId[String(device.id)] || null
                                  : null;
                                const name =
                                  device.name ||
                                  device.model ||
                                  device.title ||
                                  "Device";

                                return (
                                  <th
                                    key={`${section.id}-head-${device.id}`}
                                    className="px-6 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide align-top"
                                  >
                                    <div className="min-w-[180px] relative pr-6">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          removeComparedDevice(device.id)
                                        }
                                        className="absolute top-0 right-0 p-1 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                        title="Remove device from comparison"
                                        aria-label="Remove device from comparison"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                      {device.brand ? (
                                        <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide truncate">
                                          {device.brand}
                                        </div>
                                      ) : null}
                                      <div className="text-xs font-semibold text-gray-900 normal-case truncate">
                                        {name}
                                      </div>
                                      {ranking ? (
                                        <div
                                          className="mt-1 inline-flex h-11 w-11 items-center justify-center rounded-full border-[2px] border-red-500 bg-white text-red-600 shadow-sm"
                                          title={`Overall score ${ranking.totalScore}/100`}
                                        >
                                          <div className="text-center leading-none">
                                            <div className="text-[6px] font-bold uppercase tracking-wide">
                                              Overall
                                            </div>
                                            <div className="mt-0.5 text-[10px] font-extrabold">
                                              {ranking.totalScore}
                                            </div>
                                          </div>
                                        </div>
                                      ) : null}
                                      {selectedVariant ? (
                                        <div className="text-[10px] text-gray-500 font-medium normal-case truncate">
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
                          <tbody className="bg-white">
                            {specKeys.map((specKey, idx) => {
                              const isOverview = section.id === "overview";
                              const isRating =
                                isOverview && specKey === "rating";
                              const isPrice = isOverview && specKey === "price";
                              const isVariant =
                                isOverview && specKey === "variant";
                              const specHint = getSpecHint(
                                section.id,
                                specKey,
                              );

                              return (
                                <tr
                                  key={`${section.id}-${specKey}`}
                                  className={
                                    idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                                  }
                                >
                                  <td className="px-6 py-2 text-sm font-medium text-gray-600 w-1/3 align-top">
                                    <div className="inline-flex items-center gap-1.5">
                                      <span>{toNormalCase(specKey)}</span>
                                      {specHint ? (
                                        <span
                                          className="inline-flex text-gray-400 hover:text-gray-600 cursor-help"
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

                                    return (
                                      <td
                                        key={`${section.id}-${device.id}-${specKey}`}
                                        className="px-6 py-2 text-sm text-gray-900 align-top min-w-[180px]"
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
                                            <span className="font-semibold text-gray-900 text-sm">
                                              {value}
                                            </span>
                                          </div>
                                        ) : (
                                          <div
                                            className={`${
                                              isEmpty
                                                ? "text-gray-400 italic"
                                                : isPrice
                                                  ? "font-semibold text-green-600"
                                                  : isVariant
                                                    ? "font-semibold text-purple-600"
                                                    : "text-gray-900"
                                            }`}
                                          >
                                            {isEmpty
                                              ? "N/A"
                                              : renderStructuredSpecValue(
                                                  value,
                                                  specKey,
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
                          value: modalDevice.camera?.main_camera_megapixels
                            ? `${modalDevice.camera.main_camera_megapixels} MP`
                            : "N/A",
                        },
                        {
                          label: "Front Camera",
                          value: modalDevice.camera?.front_camera || "N/A",
                        },
                        {
                          label: "Recording",
                          value: modalDevice.camera?.recording || "N/A",
                        },
                        {
                          label: "Features",
                          value: modalDevice.camera?.features
                            ? Array.isArray(modalDevice.camera.features)
                              ? modalDevice.camera.features.join(", ")
                              : String(modalDevice.camera.features)
                            : "N/A",
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
                            {item.value}
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
                          value: modalDevice.battery?.battery_capacity_mah
                            ? `${modalDevice.battery.battery_capacity_mah} mAh`
                            : "N/A",
                        },
                        {
                          label: "Type",
                          value: modalDevice.battery?.type || "N/A",
                        },
                        {
                          label: "Fast Charging",
                          value: modalDevice.battery?.fast_charging || "N/A",
                        },
                        {
                          label: "Wireless Charging",
                          value:
                            modalDevice.battery?.wireless_charging || "N/A",
                        },
                      ].map((item, idx) => (
                        <tr
                          key={idx}
                          className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                        >
                          <td className="px-6 py-3 text-sm font-medium text-gray-600 w-1/3">
                            {item.label}
                          </td>
                          <td className="px-6 py-3 text-sm font-semibold text-gray-900 w-2/3"></td>
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
                          value: modalDevice.network?.["5g"] || "N/A",
                        },
                        {
                          label: "WiFi",
                          value: modalDevice.network?.wifi || "N/A",
                        },
                        {
                          label: "Bluetooth",
                          value: modalDevice.network?.bluetooth || "N/A",
                        },
                        {
                          label: "GPS",
                          value: modalDevice.network?.gps || "N/A",
                        },
                        {
                          label: "NFC",
                          value: modalDevice.network?.nfc || "N/A",
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
                            {item.value}
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
