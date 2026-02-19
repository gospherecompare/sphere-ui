import {
  FaBatteryFull,
  FaDesktop,
  FaLaptop,
  FaMemory,
  FaMicrochip,
  FaWeightHanging,
  FaWindowRestore,
} from "react-icons/fa";

const parseFirstInt = (val) => {
  if (val === null || val === undefined) return null;
  const m = String(val).match(/(\d{1,6})/);
  return m ? parseInt(m[1], 10) : null;
};

const parseMaxInt = (val) => {
  if (val === null || val === undefined) return null;
  const nums = [...String(val).matchAll(/(\d{1,6})/g)]
    .map((m) => Number(m[1]))
    .filter((n) => Number.isFinite(n) && n > 0);
  return nums.length ? Math.max(...nums) : null;
};

const asLower = (v) => String(v || "").toLowerCase();

const parseRamValuesGb = (raw) => {
  if (raw === null || raw === undefined) return [];
  const text = String(raw);
  const values = [];
  const withUnit = [...text.matchAll(/(\d+(?:\.\d+)?)\s*(gb|tb)/gi)];
  if (withUnit.length) {
    for (const m of withUnit) {
      const n = Number(m[1]);
      const unit = String(m[2] || "").toLowerCase();
      if (!Number.isFinite(n) || n <= 0) continue;
      values.push(unit === "tb" ? Math.round(n * 1024) : Math.round(n));
    }
    return values;
  }
  const fallback = parseFirstInt(text);
  return fallback ? [fallback] : [];
};

const parseStorageValuesGb = (raw) => {
  if (raw === null || raw === undefined) return [];
  const text = String(raw);
  const values = [];
  const withUnit = [...text.matchAll(/(\d+(?:\.\d+)?)\s*(gb|tb)/gi)];
  if (withUnit.length) {
    for (const m of withUnit) {
      const n = Number(m[1]);
      const unit = String(m[2] || "").toLowerCase();
      if (!Number.isFinite(n) || n <= 0) continue;
      values.push(unit === "tb" ? Math.round(n * 1024) : Math.round(n));
    }
    return values;
  }
  const fallback = parseFirstInt(text);
  return fallback ? [fallback] : [];
};

const getMaxRamGb = (d) => {
  const values = [];
  if (Array.isArray(d?.variants)) {
    for (const v of d.variants) values.push(...parseRamValuesGb(v?.ram));
  }
  values.push(...parseRamValuesGb(d?.variant?.ram));
  values.push(...parseRamValuesGb(d?.specs?.ram));
  return values.length ? Math.max(...values) : null;
};

const getMaxStorageGb = (d) => {
  const values = [];
  if (Array.isArray(d?.variants)) {
    for (const v of d.variants) values.push(...parseStorageValuesGb(v?.storage));
  }
  values.push(...parseStorageValuesGb(d?.variant?.storage));
  values.push(...parseStorageValuesGb(d?.specs?.storage));
  return values.length ? Math.max(...values) : null;
};

const getRefreshRateHz = (d) => {
  const direct = d?.specs?.refreshRate;
  if (direct) {
    const hzVals = [...String(direct).matchAll(/(\d{2,3})(?=\s*hz)/gi)]
      .map((m) => Number(m[1]))
      .filter((n) => Number.isFinite(n) && n > 0);
    if (hzVals.length) return Math.max(...hzVals);
    const fromRange = parseMaxInt(direct);
    if (fromRange) return fromRange;
  }

  const fromDisplay = String(d?.specs?.display || "");
  const hzVals = [...fromDisplay.matchAll(/(\d{2,3})(?=\s*hz)/gi)]
    .map((m) => Number(m[1]))
    .filter((n) => Number.isFinite(n) && n > 0);
  return hzVals.length ? Math.max(...hzVals) : null;
};

const getBatteryWh = (d) => {
  const byNumeric = Number(d?.numericBattery || 0);
  if (Number.isFinite(byNumeric) && byNumeric > 0) return byNumeric;

  const parseWh = (raw) => {
    if (raw === null || raw === undefined) return null;
    const text = String(raw);
    const whVals = [...text.matchAll(/(\d+(?:\.\d+)?)\s*wh\b/gi)]
      .map((m) => Number(m[1]))
      .filter((n) => Number.isFinite(n) && n > 0);
    if (whVals.length) return Math.max(...whVals);
    const max = parseMaxInt(text);
    return max && max > 0 ? max : null;
  };

  const candidates = [
    d?.specs?.battery,
    d?.specs?.battery_capacity,
    d?.battery?.capacity,
    d?.battery?.battery_capacity,
    d?.battery?.battery_type,
  ];
  for (const c of candidates) {
    const v = parseWh(c);
    if (v != null) return v;
  }
  return null;
};

const getWeightKg = (d) => {
  const byNumeric = Number(d?.numericWeight || 0);
  if (Number.isFinite(byNumeric) && byNumeric > 0) return byNumeric;
  const raw = String(d?.specs?.weight || "");
  const m = raw.match(/(\d+(?:\.\d+)?)/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) && n > 0 ? n : null;
};

const getFeaturesText = (d) => {
  const buckets = [
    Array.isArray(d?.features) ? d.features.join(" ") : "",
    d?.specs?.features,
    d?.specs?.display,
    d?.specs?.graphics,
    d?.specs?.cpu,
  ];
  return buckets.filter(Boolean).join(" ").toLowerCase();
};

const hasDedicatedGraphics = (d) => {
  const text = asLower(d?.specs?.graphics);
  if (!text) return false;
  const hasDedicatedFamily = /rtx|gtx|geforce|radeon\s*rx/.test(text);
  const hasDiscreteHint = /\bdedicated|discrete\b/.test(text);
  const hasIntegratedHint = /\bintegrated|igpu\b/.test(text);
  if (hasIntegratedHint && !hasDiscreteHint) return false;
  return hasDedicatedFamily || hasDiscreteHint;
};

const isGamingLaptop = (d) => {
  if (hasDedicatedGraphics(d)) return true;
  const text = getFeaturesText(d);
  return /\bgaming\b/.test(text);
};

const isIntel = (d) => {
  const text = asLower(d?.specs?.cpuBrand || d?.specs?.cpu);
  return text.includes("intel");
};

const isAmd = (d) => {
  const text = asLower(d?.specs?.cpuBrand || d?.specs?.cpu);
  return text.includes("amd");
};

const hasOled = (d) => {
  const text = asLower(d?.specs?.display);
  return /oled/.test(text);
};

const hasTouchscreen = (d) => {
  const touchRaw = d?.specs?.touchscreen ?? d?.specs?.touch_screen;
  if (typeof touchRaw === "boolean") return touchRaw;
  if (touchRaw !== null && touchRaw !== undefined) {
    const s = String(touchRaw).toLowerCase();
    if (/true|yes|supported|touch/.test(s)) return true;
  }
  const text = getFeaturesText(d);
  return /\btouch\b/.test(text);
};

const hasHighRam = (d) => (getMaxRamGb(d) || 0) >= 16;
const hasHighStorage = (d) => (getMaxStorageGb(d) || 0) >= 512;
const hasLongBattery = (d) => (getBatteryWh(d) || 0) >= 60;
const hasHighRefreshRate = (d) => (getRefreshRateHz(d) || 0) >= 120;
const isLightweight = (d) => {
  const w = getWeightKg(d);
  return w !== null && w <= 1.5;
};

export const LAPTOP_FEATURE_CATALOG = [
  {
    id: "gaming",
    name: "Gaming",
    description: "RTX/GTX graphics",
    icon: FaMicrochip,
    priority: 100,
    match: isGamingLaptop,
  },
  {
    id: "high-ram",
    name: "16GB+ RAM",
    description: "Higher multitasking",
    icon: FaMemory,
    priority: 98,
    match: hasHighRam,
    sortValue: getMaxRamGb,
  },
  {
    id: "high-storage",
    name: "512GB+ SSD",
    description: "Large fast storage",
    icon: FaDesktop,
    priority: 97,
    match: hasHighStorage,
    sortValue: getMaxStorageGb,
  },
  {
    id: "lightweight",
    name: "Lightweight",
    description: "Portable design",
    icon: FaWeightHanging,
    priority: 96,
    match: isLightweight,
    sortValue: (d) => {
      const w = getWeightKg(d);
      return w === null ? null : -w;
    },
  },
  {
    id: "long-battery",
    name: "Long Battery",
    description: "60Wh+ battery",
    icon: FaBatteryFull,
    priority: 95,
    match: hasLongBattery,
    sortValue: getBatteryWh,
  },
  {
    id: "high-refresh-rate",
    name: "120Hz+",
    description: "Smoother visuals",
    icon: FaWindowRestore,
    priority: 94,
    match: hasHighRefreshRate,
    sortValue: getRefreshRateHz,
  },
  {
    id: "oled-display",
    name: "OLED Display",
    description: "Vibrant colors",
    icon: FaLaptop,
    priority: 93,
    match: hasOled,
  },
  {
    id: "touchscreen",
    name: "Touchscreen",
    description: "Touch support",
    icon: FaWindowRestore,
    priority: 92,
    match: hasTouchscreen,
  },
  {
    id: "intel",
    name: "Intel",
    description: "Intel processors",
    icon: FaMicrochip,
    priority: 90,
    match: isIntel,
  },
  {
    id: "amd",
    name: "AMD",
    description: "AMD processors",
    icon: FaMicrochip,
    priority: 89,
    match: isAmd,
  },
];

export const computePopularLaptopFeatures = (devices = [], { limit = 12 } = {}) => {
  const arr = Array.isArray(devices) ? devices : [];

  const withCounts = LAPTOP_FEATURE_CATALOG.map((def) => {
    let count = 0;
    if (arr.length) {
      for (const d of arr) {
        try {
          if (def.match(d)) count += 1;
        } catch {
          // ignore matcher errors per item
        }
      }
    }
    return { ...def, count };
  });

  const filtered = arr.length
    ? withCounts.filter((f) => f.count > 0)
    : withCounts;

  const sorted = [...filtered].sort((a, b) => {
    const pd = (b.priority || 0) - (a.priority || 0);
    if (pd) return pd;
    const cd = (b.count || 0) - (a.count || 0);
    if (cd) return cd;
    return String(a.name || "").localeCompare(String(b.name || ""));
  });

  return limit ? sorted.slice(0, limit) : sorted;
};

export const matchesLaptopFeature = (device, featureId) => {
  const id = String(featureId || "").toLowerCase();
  const def = LAPTOP_FEATURE_CATALOG.find((f) => f.id === id);
  if (!def) return true;
  try {
    return Boolean(def.match(device));
  } catch {
    return false;
  }
};

export const getLaptopFeatureSortValue = (device, featureId) => {
  const id = String(featureId || "").toLowerCase();
  const def = LAPTOP_FEATURE_CATALOG.find((f) => f.id === id);
  if (!def || typeof def.sortValue !== "function") return null;
  try {
    return def.sortValue(device);
  } catch {
    return null;
  }
};
