import {
  FaDesktop,
  FaFilm,
  FaGamepad,
  FaMicrochip,
  FaTachometerAlt,
  FaTv,
  FaVolumeUp,
  FaWifi,
} from "react-icons/fa";

const parseFirstInt = (val) => {
  if (val === null || val === undefined) return null;
  const m = String(val).match(/(\d{1,6})/);
  return m ? parseInt(m[1], 10) : null;
};

const asLower = (v) => String(v || "").toLowerCase();

const getFeatureText = (d) => {
  const raw = [
    Array.isArray(d?.features) ? d.features.join(" ") : "",
    d?.specs?.type,
    d?.specs?.resolution,
    d?.specs?.displayType,
    d?.specs?.hdr,
    d?.specs?.audioOutput,
    d?.specs?.operatingSystem,
    d?.specs?.wifi,
    d?.specs?.bluetooth,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return raw;
};

const getScreenSizeInches = (d) => {
  const numericCapacity = Number(d?.numericCapacity || 0);
  if (Number.isFinite(numericCapacity) && numericCapacity > 0) {
    return numericCapacity;
  }
  return (
    parseFirstInt(d?.specs?.screenSize) ??
    parseFirstInt(d?.specs?.capacity) ??
    null
  );
};

const getRefreshRateHz = (d) => {
  return parseFirstInt(d?.specs?.refreshRate);
};

const has4k = (d) => {
  const text = asLower(d?.specs?.resolution);
  return /4k|uhd|2160/.test(text);
};

const hasOledQled = (d) => {
  const text = asLower(d?.specs?.displayType || d?.specs?.type);
  return /oled|qled|mini\s*led|qd-?oled/.test(text);
};

const isSmartTv = (d) => {
  const typeText = asLower(d?.specs?.type);
  const osText = asLower(d?.specs?.operatingSystem);
  if (typeText.includes("smart")) return true;
  if (osText && osText !== "na") return true;
  return false;
};

const hasHdr = (d) => {
  const hdrText = asLower(d?.specs?.hdr);
  if (/\bhdr|dolby\s*vision|hlg|hdr10/.test(hdrText)) return true;
  const featureText = getFeatureText(d);
  return /\bhdr|dolby\s*vision|hlg|hdr10/.test(featureText);
};

const hasDolby = (d) => {
  const audio = asLower(d?.specs?.audioOutput);
  if (/dolby/.test(audio)) return true;
  return /dolby/.test(getFeatureText(d));
};

const hasGaming = (d) => {
  const text = getFeatureText(d);
  if (/gaming|allm|vrr|freesync|g-sync|hdmi\s*2\.1/.test(text)) return true;
  return (getRefreshRateHz(d) || 0) >= 120;
};

const hasWifi = (d) => {
  const text = asLower(d?.specs?.wifi);
  return Boolean(text && text !== "na");
};

const hasVoiceAssistant = (d) => {
  return /alexa|google\s*assistant|voice\s*assistant|voice\s*control/.test(
    getFeatureText(d),
  );
};

export const TV_FEATURE_CATALOG = [
  {
    id: "large-screen",
    name: "55\"+ Screen",
    description: "Bigger viewing area",
    icon: FaTv,
    priority: 100,
    match: (d) => (getScreenSizeInches(d) || 0) >= 55,
    sortValue: getScreenSizeInches,
  },
  {
    id: "ultra-hd-4k",
    name: "4K Ultra HD",
    description: "Sharper picture quality",
    icon: FaDesktop,
    priority: 99,
    match: has4k,
  },
  {
    id: "high-refresh-rate",
    name: "120Hz+",
    description: "Smooth motion",
    icon: FaTachometerAlt,
    priority: 98,
    match: (d) => (getRefreshRateHz(d) || 0) >= 120,
    sortValue: getRefreshRateHz,
  },
  {
    id: "oled-qled",
    name: "OLED/QLED",
    description: "Premium panel tech",
    icon: FaTv,
    priority: 97,
    match: hasOledQled,
  },
  {
    id: "smart-tv",
    name: "Smart TV",
    description: "Built-in smart platform",
    icon: FaMicrochip,
    priority: 96,
    match: isSmartTv,
  },
  {
    id: "hdr",
    name: "HDR",
    description: "Better contrast",
    icon: FaFilm,
    priority: 95,
    match: hasHdr,
  },
  {
    id: "dolby-audio",
    name: "Dolby Audio",
    description: "Enhanced sound",
    icon: FaVolumeUp,
    priority: 94,
    match: hasDolby,
  },
  {
    id: "gaming",
    name: "Gaming Ready",
    description: "VRR / ALLM / 120Hz",
    icon: FaGamepad,
    priority: 93,
    match: hasGaming,
  },
  {
    id: "wifi",
    name: "Wi-Fi",
    description: "Wireless connectivity",
    icon: FaWifi,
    priority: 92,
    match: hasWifi,
  },
  {
    id: "voice-assistant",
    name: "Voice Assistant",
    description: "Alexa/Google support",
    icon: FaMicrochip,
    priority: 91,
    match: hasVoiceAssistant,
  },
];

export const computePopularTvFeatures = (devices = [], { limit = 12 } = {}) => {
  const arr = Array.isArray(devices) ? devices : [];

  const withCounts = TV_FEATURE_CATALOG.map((def) => {
    let count = 0;
    if (arr.length) {
      for (const d of arr) {
        try {
          if (def.match(d)) count += 1;
        } catch {
          // ignore per-item matcher errors
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

export const matchesTvFeature = (device, featureId) => {
  const id = String(featureId || "").toLowerCase();
  const def = TV_FEATURE_CATALOG.find((f) => f.id === id);
  if (!def) return true;
  try {
    return Boolean(def.match(device));
  } catch {
    return false;
  }
};

export const getTvFeatureSortValue = (device, featureId) => {
  const id = String(featureId || "").toLowerCase();
  const def = TV_FEATURE_CATALOG.find((f) => f.id === id);
  if (!def || typeof def.sortValue !== "function") return null;
  try {
    return def.sortValue(device);
  } catch {
    return null;
  }
};
