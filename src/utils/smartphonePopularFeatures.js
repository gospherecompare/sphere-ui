import {
  FaBatteryFull,
  FaBolt,
  FaCamera,
  FaFingerprint,
  FaGamepad,
  FaMemory,
  FaMicrochip,
  FaMobileAlt,
  FaRobot,
  FaShieldAlt,
  FaSignal,
  FaTachometerAlt,
  FaWifi,
} from "react-icons/fa";

const parseFirstInt = (val) => {
  if (val === null || val === undefined) return null;
  const m = String(val).match(/(\d{1,6})/);
  return m ? parseInt(m[1], 10) : null;
};

const asLower = (v) => String(v || "").toLowerCase();

const truthySupport = (raw) => {
  if (raw === null || raw === undefined) return false;
  if (typeof raw === "boolean") return raw;
  const s = asLower(raw);
  if (!s) return false;
  if (s === "no" || s === "false" || s === "0") return false;
  if (s.includes("not supported")) return false;
  if (s.includes("not")) return false;
  if (s.includes("unsupported")) return false;
  return s.includes("supported") || s.includes("yes") || s.includes("true");
};

export const getBatteryMah = (d) => {
  const b = d?.battery;
  if (!b) return null;
  if (typeof b === "number") return Number.isFinite(b) ? b : null;
  if (typeof b === "string") return parseFirstInt(b);
  return (
    parseFirstInt(b.battery_capacity_mah) ??
    parseFirstInt(b.capacity_mAh) ??
    parseFirstInt(b.capacity_mah) ??
    parseFirstInt(b.battery_capacity) ??
    parseFirstInt(b.capacity) ??
    null
  );
};

export const getFastChargeWatt = (d) => {
  const b = d?.battery;
  if (!b) return null;
  if (typeof b === "object") {
    const raw =
      b.fast_charging ?? b.fastCharging ?? b.fast_charge ?? b.fastCharge ?? null;
    return raw ? parseFirstInt(raw) : null;
  }
  const s = String(b);
  if (!/w/i.test(s)) return null;
  return parseFirstInt(s);
};

export const getWirelessChargeWatt = (d) => {
  const raw = d?.battery?.wireless_charging ?? d?.battery?.wirelessCharging ?? null;
  return raw ? parseFirstInt(raw) : null;
};

export const getRefreshRateHz = (d) => {
  const disp = d?.display || d?.display_json || {};
  const raw =
    (disp && typeof disp === "object" && (disp.refresh_rate || disp.refreshRate)) ||
    d?.refresh_rate ||
    d?.specs?.refreshRate ||
    "";
  return parseFirstInt(raw);
};

export const getMaxRamGb = (d) => {
  const variants = Array.isArray(d?.variants) ? d.variants : [];
  const maxFromVariants = variants.reduce((acc, v) => {
    const n = parseFirstInt(v?.ram) || 0;
    return Math.max(acc, n);
  }, 0);
  if (maxFromVariants) return maxFromVariants;

  const rOpts = d?.performance?.ram_options;
  if (Array.isArray(rOpts)) {
    const maxFromOpts = rOpts.reduce((acc, v) => {
      const n = parseFirstInt(v) || 0;
      return Math.max(acc, n);
    }, 0);
    if (maxFromOpts) return maxFromOpts;
  }

  return (
    parseFirstInt(d?.performance?.ram) ??
    parseFirstInt(d?.specs?.ram) ??
    null
  );
};

export const getMaxRearCameraMp = (d) => {
  const candidates = [];
  const add = (val) => {
    const n = parseFirstInt(val);
    if (n && Number.isFinite(n)) candidates.push(n);
  };

  // Common flattened fields
  add(d?.camera?.main_camera_megapixels);
  add(d?.camera?.telephoto_camera_megapixels);
  add(d?.camera?.ultrawide_camera_megapixels);

  const cam = d?.camera || {};
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

  // Fallbacks
  addFromLens(cam.main);
  addFromLens(cam.wide);
  addFromLens(cam.telephoto);
  addFromLens(cam.ultra_wide);
  addFromLens(cam.periscope_telephoto);

  return candidates.length ? Math.max(...candidates) : null;
};

export const hasWifi7 = (d) => {
  const w = d?.connectivity?.wifi;
  if (Array.isArray(w))
    return w.some((x) => /wi-?fi\s*7|802\.11be/i.test(String(x)));
  return /wi-?fi\s*7|802\.11be/i.test(String(w || ""));
};

export const has5g = (d) => {
  const n = d?.network || d?.connectivity || d?.connectivity_network || {};
  if (!n) return false;
  const bands = n["5g_bands"] || n.five_g_bands || n.fiveGBands || n.five_g || n.fiveG || n["5g"];
  if (Array.isArray(bands)) return bands.length > 0;
  return /5g/i.test(String(n));
};

export const hasIpRating = (d) => {
  const bd = d?.build_design || d?.design || {};
  const raw =
    (bd && typeof bd === "object" && (bd.water_dust_resistance || bd.waterDustResistance)) ||
    d?.water_dust_resistance ||
    "";
  return /\bip\d{2}\b/i.test(String(raw));
};

export const hasAiFeatures = (d) => {
  const buckets = [
    d?.ai_features,
    d?.features,
    d?.performance?.ai_features,
    d?.camera?.ai_features,
    d?.connectivity?.ai_features,
    d?.multimedia?.ai_features,
  ];
  for (const b of buckets) {
    if (!b) continue;
    if (Array.isArray(b) && b.length) return true;
    if (typeof b === "string" && /\bai\b/i.test(b)) return true;
  }
  return false;
};

export const hasEsim = (d) => {
  const raw =
    d?.connectivity?.esim ??
    d?.connectivity?.eSIM ??
    d?.network?.sim ??
    d?.network?.sim_type ??
    d?.network?.simType ??
    d?.connectivity?.sim ??
    null;
  if (raw === null || raw === undefined) return false;
  if (typeof raw === "boolean") return raw;
  if (Array.isArray(raw)) return raw.some((x) => /esim/i.test(String(x)));
  return /esim/i.test(String(raw));
};

export const hasNfc = (d) => {
  const raw = d?.connectivity?.nfc ?? d?.nfc ?? null;
  return truthySupport(raw);
};

export const hasOis = (d) => {
  const cam = d?.camera || {};
  const rear = cam?.rear_camera;
  const lenses = [];
  if (rear && typeof rear === "object") lenses.push(...Object.values(rear));
  lenses.push(cam.main, cam.wide, cam.telephoto, cam.ultra_wide, cam.periscope_telephoto);
  for (const lens of lenses) {
    if (!lens) continue;
    const raw = lens?.ois ?? lens?.OIS ?? null;
    if (raw == null) continue;
    if (typeof raw === "boolean") return raw;
    if (typeof raw === "string") {
      if (/not/i.test(raw)) continue;
      if (/supported|yes|true/i.test(raw)) return true;
    }
  }
  return false;
};

export const hasPeriscope = (d) => {
  return Boolean(
    d?.camera?.rear_camera?.periscope_telephoto || d?.camera?.periscope_telephoto,
  );
};

export const hasUfs4 = (d) => {
  const raw = d?.performance?.storage_type ?? d?.performance?.storageType ?? "";
  return /ufs\s*4/i.test(String(raw));
};

export const hasLpddr5x = (d) => {
  const raw = d?.performance?.ram_type ?? d?.performance?.ramType ?? "";
  return /lpddr\s*5x/i.test(String(raw));
};

export const hasFingerprint = (d) => {
  const s = d?.sensors ?? d?.specs?.sensors ?? null;
  if (!s) return false;
  if (Array.isArray(s)) return s.some((x) => /fingerprint/i.test(String(x)));
  return /fingerprint/i.test(String(s));
};

export const isGamingPhone = (d) => {
  const proc = asLower(d?.performance?.processor || d?.processor || "");
  const cat = asLower(d?.category || "");
  return (
    /snapdragon\s*8|dimensity|exynos|apple\s*a|mediatek/i.test(proc) ||
    cat.includes("flagship") ||
    cat.includes("gaming")
  );
};

export const SMARTPHONE_FEATURE_CATALOG = [
  {
    id: "ai-features",
    name: "AI Features",
    description: "AI tools & assistants",
    icon: FaRobot,
    priority: 100,
    match: hasAiFeatures,
  },
  {
    id: "high-camera",
    name: "High MP Camera",
    description: "50MP+ cameras",
    icon: FaCamera,
    priority: 95,
    match: (d) => (getMaxRearCameraMp(d) || 0) >= 50,
  },
  {
    id: "long-battery",
    name: "Long Battery",
    description: "6000mAh+",
    icon: FaBatteryFull,
    priority: 94,
    match: (d) => (getBatteryMah(d) || 0) >= 6000,
  },
  {
    id: "fast-charging",
    name: "Fast Charge",
    description: "65W+ charging",
    icon: FaBolt,
    priority: 93,
    match: (d) => (getFastChargeWatt(d) || 0) >= 65,
  },
  {
    id: "wireless-charging",
    name: "Wireless",
    description: "Wireless charging",
    icon: FaSignal,
    priority: 90,
    match: (d) => {
      const raw =
        d?.battery?.wireless_charging ?? d?.battery?.wirelessCharging ?? null;
      if (raw === null || raw === undefined) return false;
      if (typeof raw === "number") return Number.isFinite(raw) && raw > 0;
      if (typeof raw === "string") return raw.trim() !== "";
      return true;
    },
  },
  {
    id: "amoled",
    name: "AMOLED",
    description: "AMOLED displays",
    icon: FaMobileAlt,
    priority: 92,
    match: (d) => asLower(d?.display?.panel || d?.display?.type || d?.display || "").includes("amoled"),
  },
  {
    id: "high-refresh-rate",
    name: "120Hz+",
    description: "Smooth display",
    icon: FaTachometerAlt,
    priority: 91,
    match: (d) => (getRefreshRateHz(d) || 0) >= 120,
  },
  {
    id: "5g",
    name: "5G",
    description: "5G connectivity",
    icon: FaSignal,
    priority: 89,
    match: has5g,
  },
  {
    id: "wifi-7",
    name: "Wi‑Fi 7",
    description: "Latest Wi‑Fi",
    icon: FaWifi,
    priority: 88,
    match: hasWifi7,
  },
  {
    id: "ip-rating",
    name: "IP Rated",
    description: "IP68/IP69",
    icon: FaShieldAlt,
    priority: 87,
    match: hasIpRating,
  },
  {
    id: "high-ram",
    name: "High RAM",
    description: "12GB+ RAM",
    icon: FaMemory,
    priority: 86,
    match: (d) => (getMaxRamGb(d) || 0) >= 12,
  },
  {
    id: "gaming",
    name: "Gaming",
    description: "Gaming phones",
    icon: FaGamepad,
    priority: 85,
    match: isGamingPhone,
  },
  {
    id: "esim",
    name: "eSIM",
    description: "eSIM support",
    icon: FaMobileAlt,
    priority: 83,
    match: hasEsim,
  },
  {
    id: "nfc",
    name: "NFC",
    description: "Tap to pay",
    icon: FaSignal,
    priority: 82,
    match: hasNfc,
  },
  {
    id: "ois",
    name: "OIS",
    description: "Optical stabilization",
    icon: FaCamera,
    priority: 81,
    match: hasOis,
  },
  {
    id: "periscope",
    name: "Periscope",
    description: "Periscope lens",
    icon: FaCamera,
    priority: 80,
    match: hasPeriscope,
  },
  {
    id: "ufs-4",
    name: "UFS 4.x",
    description: "Fast storage",
    icon: FaMicrochip,
    priority: 79,
    match: hasUfs4,
  },
  {
    id: "lpddr5x",
    name: "LPDDR5X",
    description: "Fast RAM",
    icon: FaMemory,
    priority: 78,
    match: hasLpddr5x,
  },
  {
    id: "fingerprint",
    name: "Fingerprint",
    description: "Fingerprint sensor",
    icon: FaFingerprint,
    priority: 75,
    match: hasFingerprint,
  },
];

export const computePopularSmartphoneFeatures = (
  devices = [],
  { limit = 12 } = {},
) => {
  const arr = Array.isArray(devices) ? devices : [];

  const withCounts = SMARTPHONE_FEATURE_CATALOG.map((def) => {
    let count = 0;
    if (arr.length) {
      for (const d of arr) {
        try {
          if (def.match(d)) count += 1;
        } catch (e) {
          // ignore per-device matcher errors
        }
      }
    }
    return { ...def, count };
  });

  const filtered = arr.length ? withCounts.filter((f) => f.count > 0) : withCounts;

  const sorted = [...filtered].sort((a, b) => {
    const pd = (b.priority || 0) - (a.priority || 0);
    if (pd) return pd;
    const cd = (b.count || 0) - (a.count || 0);
    if (cd) return cd;
    return String(a.name || "").localeCompare(String(b.name || ""));
  });

  return limit ? sorted.slice(0, limit) : sorted;
};
