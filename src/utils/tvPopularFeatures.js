import {
  FaBluetoothB,
  FaDesktop,
  FaFilm,
  FaGamepad,
  FaMagic,
  FaMicrochip,
  FaPlug,
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

const asSearchText = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return "";
  }
};

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
    d?.specs?.hdmi,
    d?.specs?.usb,
    asSearchText(d?.display_json),
    asSearchText(d?.video_engine_json),
    asSearchText(d?.audio_json),
    asSearchText(d?.smart_tv_json),
    asSearchText(d?.connectivity_json),
    asSearchText(d?.ports_json),
    asSearchText(d?.gaming_json),
    asSearchText(d?.product_details_json),
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
    seoName: "55 Inch and Above",
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
    seoName: "120Hz",
    description: "Smooth motion",
    icon: FaTachometerAlt,
    priority: 98,
    match: (d) => (getRefreshRateHz(d) || 0) >= 120,
    sortValue: getRefreshRateHz,
  },
  {
    id: "oled-qled",
    name: "OLED/QLED",
    seoName: "OLED and QLED",
    description: "Premium panel tech",
    icon: FaTv,
    priority: 97,
    match: hasOledQled,
  },
  {
    id: "smart-tv",
    name: "Smart TV",
    seoName: "Smart",
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
    seoName: "Gaming",
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

export const TV_ADDITIONAL_FEATURE_CATALOG = [
  {
    id: "bluetooth",
    name: "Bluetooth",
    description: "Wireless audio and accessories",
    icon: FaBluetoothB,
    match: (d) => /\bbluetooth\b|\bbt\s*\d/.test(getFeatureText(d)),
  },
  {
    id: "hdmi-2-1",
    name: "HDMI 2.1",
    description: "Modern high-bandwidth HDMI input",
    icon: FaPlug,
    match: (d) => /hdmi\s*2(?:\.|\s*)1/.test(getFeatureText(d)),
  },
  {
    id: "earc",
    name: "eARC",
    description: "Enhanced audio return channel",
    icon: FaVolumeUp,
    match: (d) => /\bearc\b|enhanced\s+audio\s+return/.test(getFeatureText(d)),
  },
  {
    id: "dolby-vision",
    name: "Dolby Vision",
    description: "Premium dynamic HDR format",
    icon: FaFilm,
    match: (d) => /dolby\s*vision/.test(getFeatureText(d)),
  },
  {
    id: "ai-features",
    name: "AI Features",
    description: "AI picture, sound, or upscaling",
    icon: FaMagic,
    match: (d) =>
      /\bai\b|artificial\s+intelligence|ai[-\s]?(picture|sound|upscal|processor|enhance)/.test(
        getFeatureText(d),
      ),
  },
  {
    id: "av-input",
    name: "AV Input",
    description: "Legacy AV or composite input",
    icon: FaPlug,
    match: (d) => /\bav\s*(input|in)\b|composite|rca/.test(getFeatureText(d)),
  },
  {
    id: "usb",
    name: "USB",
    description: "USB media and accessory support",
    icon: FaPlug,
    match: (d) => /\busb\b/.test(getFeatureText(d)),
  },
  {
    id: "wifi-6",
    name: "Wi-Fi 6",
    description: "Faster 802.11ax wireless",
    icon: FaWifi,
    match: (d) => /wi-?fi\s*6|802\.11ax/.test(getFeatureText(d)),
  },
  {
    id: "wifi-7",
    name: "Wi-Fi 7",
    description: "Latest 802.11be wireless",
    icon: FaWifi,
    match: (d) => /wi-?fi\s*7|802\.11be/.test(getFeatureText(d)),
  },
  {
    id: "dolby-atmos",
    name: "Dolby Atmos",
    description: "Immersive spatial audio",
    icon: FaVolumeUp,
    match: (d) => /dolby\s*atmos/.test(getFeatureText(d)),
  },
  {
    id: "hdr10-plus",
    name: "HDR10+",
    description: "Dynamic HDR enhancement",
    icon: FaFilm,
    match: (d) => /hdr\s*10\s*\+|hdr10plus/.test(getFeatureText(d)),
  },
  {
    id: "vrr",
    name: "VRR",
    description: "Variable refresh rate gaming",
    icon: FaGamepad,
    match: (d) => /\bvrr\b|variable\s+refresh\s+rate/.test(getFeatureText(d)),
  },
  {
    id: "allm",
    name: "ALLM",
    description: "Automatic low-latency gaming",
    icon: FaGamepad,
    match: (d) => /\ballm\b|auto(?:matic)?\s+low\s+latency/.test(getFeatureText(d)),
  },
  {
    id: "memc",
    name: "MEMC",
    description: "Smoother motion processing",
    icon: FaFilm,
    match: (d) => /\bmemc\b|motion\s+estimation/.test(getFeatureText(d)),
  },
  {
    id: "filmmaker-mode",
    name: "Filmmaker Mode",
    description: "Cinema-accurate picture preset",
    icon: FaFilm,
    match: (d) => /filmmaker\s+mode/.test(getFeatureText(d)),
  },
  {
    id: "screen-mirroring",
    name: "Screen Mirroring",
    description: "Cast a phone or laptop screen",
    icon: FaDesktop,
    match: (d) =>
      /screen\s+mirror|miracast|screen\s+cast|cast\s+screen/.test(
        getFeatureText(d),
      ),
  },
  {
    id: "airplay",
    name: "AirPlay",
    description: "Apple wireless casting",
    icon: FaDesktop,
    match: (d) => /airplay/.test(getFeatureText(d)),
  },
  {
    id: "chromecast",
    name: "Chromecast",
    description: "Google casting support",
    icon: FaDesktop,
    match: (d) => /chromecast|google\s+cast/.test(getFeatureText(d)),
  },
  {
    id: "google-tv",
    name: "Google TV",
    description: "Google smart TV platform",
    icon: FaMicrochip,
    match: (d) => /google\s+tv/.test(getFeatureText(d)),
  },
  {
    id: "ethernet",
    name: "Ethernet / LAN",
    seoName: "Ethernet LAN",
    description: "Wired network connection",
    icon: FaPlug,
    match: (d) => /\bethernet\b|\blan\b|rj-?45/.test(getFeatureText(d)),
  },
  {
    id: "optical-audio",
    name: "Optical Audio",
    description: "Digital optical audio output",
    icon: FaVolumeUp,
    match: (d) => /optical|s\/?pdif|toslink/.test(getFeatureText(d)),
  },
  {
    id: "headphone-jack",
    name: "Headphone Jack",
    description: "Wired headphone audio output",
    icon: FaVolumeUp,
    match: (d) => /headphone|3\.5\s*mm|audio\s+jack/.test(getFeatureText(d)),
  },
  {
    id: "rf-input",
    name: "RF Input",
    description: "Antenna or cable TV input",
    icon: FaPlug,
    match: (d) => /\brf\s*(input|in)\b|antenna\s*(input|in)/.test(getFeatureText(d)),
  },
];

const TV_ROUTE_FEATURE_CATALOG = [
  ...TV_FEATURE_CATALOG,
  ...TV_ADDITIONAL_FEATURE_CATALOG,
];

export const getTvRouteFeatureMeta = (featureSlug) => {
  const normalizedSlug = String(featureSlug || "")
    .trim()
    .toLowerCase();
  if (!normalizedSlug) return null;
  const feature = TV_ROUTE_FEATURE_CATALOG.find(
    (candidate) => candidate.id === normalizedSlug,
  );
  if (!feature) return null;
  return {
    ...feature,
    seoName:
      feature.seoName ||
      (feature.id === "ai-features" ? "AI Smart" : feature.name),
  };
};

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

export const computeAdditionalTvFeatures = (
  devices = [],
  { limit = 0 } = {},
) => {
  const arr = Array.isArray(devices) ? devices : [];
  const withCounts = TV_ADDITIONAL_FEATURE_CATALOG.map((def) => {
    let count = 0;
    for (const device of arr) {
      try {
        if (def.match(device)) count += 1;
      } catch {
        // ignore per-item matcher errors
      }
    }
    return { ...def, count };
  });
  const filtered = arr.length
    ? withCounts.filter((feature) => feature.count > 0)
    : withCounts;
  return limit ? filtered.slice(0, limit) : filtered;
};

export const matchesTvFeature = (device, featureId) => {
  const id = String(featureId || "").toLowerCase();
  const def = getTvRouteFeatureMeta(id);
  if (!def) return true;
  try {
    return Boolean(def.match(device));
  } catch {
    return false;
  }
};

export const matchesTvAdditionalFeature = (device, featureId) => {
  const id = String(featureId || "").toLowerCase();
  const def = TV_ADDITIONAL_FEATURE_CATALOG.find((feature) => feature.id === id);
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
