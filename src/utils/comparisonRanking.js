const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const toFiniteNumber = (value) => {
  if (value == null || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const match = String(value)
    .replace(/,/g, "")
    .match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeText = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const CHIPSET_RULES = [
  {
    pattern: /(snapdragon\s*8\s*elite|8\s*elite)/i,
    score: 100,
    reason: "Latest flagship tier from Qualcomm.",
  },
  {
    pattern: /snapdragon\s*8\s*gen\s*4/i,
    score: 98,
    reason: "Very recent premium flagship generation.",
  },
  {
    pattern: /snapdragon\s*8\s*gen\s*3/i,
    score: 95,
    reason: "Current high-end flagship performance class.",
  },
  {
    pattern: /dimensity\s*9400/i,
    score: 97,
    reason: "Latest flagship class from MediaTek.",
  },
  {
    pattern: /dimensity\s*9300/i,
    score: 92,
    reason: "Top-tier flagship performance class.",
  },
  {
    pattern: /apple\s*a18|a18\s*pro|apple\s*a17\s*pro|a17\s*pro/i,
    score: 98,
    reason: "Latest Apple flagship silicon class.",
  },
  {
    pattern: /snapdragon\s*8\s*gen\s*2|dimensity\s*9200|apple\s*a16/i,
    score: 89,
    reason: "Previous-generation flagship class.",
  },
  {
    pattern: /snapdragon\s*7\s*gen\s*3|dimensity\s*8300/i,
    score: 75,
    reason: "Strong upper mid-range performance class.",
  },
  {
    pattern: /snapdragon\s*7|dimensity\s*8|tensor\s*g2|tensor\s*g3/i,
    score: 72,
    reason: "Balanced mid-to-upper performance class.",
  },
  {
    pattern: /snapdragon\s*6|dimensity\s*7|exynos\s*13/i,
    score: 62,
    reason: "Mainstream mid-range performance class.",
  },
  {
    pattern: /snapdragon\s*4|helio|unisoc|exynos\s*8/i,
    score: 50,
    reason: "Entry-level performance class.",
  },
];

const scoreChipsetHeuristic = (processorText) => {
  const text = normalizeText(processorText);
  if (!text) {
    return {
      score: 45,
      reason: "Chipset data missing, using neutral baseline.",
    };
  }

  for (const rule of CHIPSET_RULES) {
    if (rule.pattern.test(text)) {
      return { score: rule.score, reason: rule.reason };
    }
  }

  const snapdragonGenMatch = text.match(
    /snapdragon\s*([0-9])\s*gen\s*([0-9]+)/i,
  );
  if (snapdragonGenMatch) {
    const series = Number(snapdragonGenMatch[1]);
    const gen = Number(snapdragonGenMatch[2]);
    const score = clamp(50 + series * 8 + gen * 2, 52, 96);
    return {
      score,
      reason: "Estimated from Snapdragon series and generation.",
    };
  }

  const dimensityMatch = text.match(/dimensity\s*([0-9]{4})/i);
  if (dimensityMatch) {
    const model = Number(dimensityMatch[1]);
    let score = 58;
    if (model >= 9400) score = 97;
    else if (model >= 9300) score = 92;
    else if (model >= 8300) score = 78;
    else if (model >= 8200) score = 74;
    else if (model >= 7300) score = 66;
    return {
      score,
      reason: "Estimated from Dimensity model tier.",
    };
  }

  const appleMatch = text.match(
    /apple\s*a([0-9]{2})|a([0-9]{2})\s*(pro|bionic)?/i,
  );
  if (appleMatch) {
    const chipNum = Number(appleMatch[1] || appleMatch[2]);
    const score = clamp(74 + (chipNum - 14) * 4, 70, 99);
    return {
      score,
      reason: "Estimated from Apple A-series generation.",
    };
  }

  if (text.includes("tensor")) {
    return {
      score: 74,
      reason: "Google Tensor class estimated as upper mid-range flagship.",
    };
  }

  if (text.includes("exynos")) {
    return {
      score: 68,
      reason: "Exynos class estimated from known mainstream tiers.",
    };
  }

  return {
    score: 60,
    reason: "Unknown chipset, assigned conservative baseline score.",
  };
};

const extractRefreshRate = (display) => {
  if (!display || typeof display !== "object") return null;
  const candidates = [
    display.refresh_rate,
    display.refreshRate,
    display.max_refresh_rate,
    display.screen_refresh_rate,
    display.frame_rate,
  ];

  for (const candidate of candidates) {
    const value = toFiniteNumber(candidate);
    if (value != null) return value;
  }
  return null;
};

const scoreRefreshRate = (refreshRate) => {
  if (refreshRate == null) return 28;
  const normalized = clamp(refreshRate, 60, 165);
  return Math.round(20 + ((normalized - 60) / (165 - 60)) * 40);
};

const detectPanelType = (display) => {
  const text = normalizeText(
    display?.panel_type ||
      display?.panel ||
      display?.type ||
      display?.technology,
  );
  if (!text)
    return { panelType: "Unknown", score: 20, reason: "Panel not specified." };
  if (text.includes("ltpo")) {
    return {
      panelType: "LTPO AMOLED",
      score: 40,
      reason: "Adaptive flagship display panel.",
    };
  }
  if (text.includes("amoled")) {
    return {
      panelType: "AMOLED",
      score: 34,
      reason: "High-contrast panel with deeper blacks.",
    };
  }
  if (text.includes("oled")) {
    return {
      panelType: "OLED",
      score: 32,
      reason: "Good contrast and efficient pixels.",
    };
  }
  if (text.includes("mini led") || text.includes("mini-led")) {
    return {
      panelType: "Mini LED",
      score: 33,
      reason: "High brightness and local dimming class.",
    };
  }
  if (text.includes("ips") || text.includes("lcd")) {
    return {
      panelType: "IPS LCD",
      score: 24,
      reason: "Reliable but not premium contrast class.",
    };
  }
  if (text.includes("tft")) {
    return {
      panelType: "TFT",
      score: 16,
      reason: "Entry-level display panel class.",
    };
  }
  return {
    panelType: String(
      display?.panel_type || display?.panel || display?.type || "Unknown",
    ),
    score: 22,
    reason: "Panel type not in known table, using neutral score.",
  };
};

const collectMegapixelValues = (value, bucket) => {
  if (value == null) return;
  if (typeof value === "number" && Number.isFinite(value)) {
    bucket.push(value);
    return;
  }
  if (typeof value === "string") {
    const matches = value.match(/(\d+(?:\.\d+)?)\s*mp/gi);
    if (matches) {
      matches.forEach((entry) => {
        const n = toFiniteNumber(entry);
        if (n != null) bucket.push(n);
      });
      return;
    }
    const n = toFiniteNumber(value);
    if (n != null && n <= 250) bucket.push(n);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectMegapixelValues(item, bucket));
    return;
  }
  if (typeof value === "object") {
    Object.values(value).forEach((nested) =>
      collectMegapixelValues(nested, bucket),
    );
  }
};

const extractMainMegapixel = (camera) => {
  if (!camera || typeof camera !== "object") return null;
  const values = [];
  collectMegapixelValues(camera.main_camera_megapixels, values);
  collectMegapixelValues(camera.main, values);
  collectMegapixelValues(camera.rear_camera, values);
  collectMegapixelValues(camera.primary, values);
  if (values.length === 0) return null;
  return Math.max(...values);
};

const countCameraSensors = (camera) => {
  if (!camera || typeof camera !== "object") return 0;
  const rear = camera.rear_camera;
  if (rear && typeof rear === "object" && !Array.isArray(rear)) {
    return Object.entries(rear).filter(([, val]) => val != null && val !== "")
      .length;
  }
  if (Array.isArray(rear)) return rear.filter(Boolean).length;
  const fallback = [
    camera.main,
    camera.ultra_wide,
    camera.telephoto,
    camera.periscope,
    camera.macro,
    camera.depth,
  ].filter((value) => value != null && value !== "").length;
  return fallback > 0 ? fallback : 1;
};

const scoreBatteryCapacity = (capacity) => {
  if (capacity == null) return 35;
  if (capacity <= 3000) return 25;
  if (capacity <= 4000) return 45;
  if (capacity <= 4500) return 60;
  if (capacity <= 5000) return 75;
  if (capacity <= 5500) return 86;
  if (capacity <= 6000) return 94;
  return 100;
};

const extractBatteryCapacity = (battery) => {
  if (!battery || typeof battery !== "object") return null;
  const candidates = [
    battery.battery_capacity_mah,
    battery.capacity_mah,
    battery.capacity,
    battery.mAh,
    battery.value,
  ];
  for (const candidate of candidates) {
    const value = toFiniteNumber(candidate);
    if (value != null) return value;
  }
  return null;
};

const extractPrice = (device, variantSelection = {}) => {
  const selectedIndex = Number(variantSelection?.[device?.id] ?? 0);
  const variants = Array.isArray(device?.variants) ? device.variants : [];
  const selectedVariant = variants[selectedIndex] || variants[0] || null;
  const fromVariant = toFiniteNumber(
    selectedVariant?.base_price ??
      selectedVariant?.basePrice ??
      selectedVariant?.price ??
      null,
  );
  if (fromVariant != null && fromVariant > 0) return fromVariant;
  const fromDevice = toFiniteNumber(device?.price);
  return fromDevice != null && fromDevice > 0 ? fromDevice : null;
};

const roundOne = (value) => Math.round((value + Number.EPSILON) * 10) / 10;

export const COMPARE_SCORE_WEIGHTS = {
  performance: 0.36,
  display: 0.2,
  camera: 0.2,
  battery: 0.14,
  priceValue: 0.1,
};

export const SCORING_GLOSSARY = {
  chipset:
    "Chipset is the main processor family (for example Snapdragon, Dimensity, Apple A-series). Newer flagship tiers are scored higher.",
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
  ranking:
    "Final rank is weighted: Performance 36%, Display 20%, Camera 20%, Battery 14%, Value 10%.",
};

export const buildComparisonRanking = (devices = [], variantSelection = {}) => {
  const scored = (devices || []).map((device) => {
    const processorText =
      device?.performance?.processor ||
      device?.performance?.chipset ||
      device?.processor ||
      "";
    const chipset = scoreChipsetHeuristic(processorText);

    const display = device?.display || {};
    const refreshRate = extractRefreshRate(display);
    const refreshRateScore = scoreRefreshRate(refreshRate);
    const panel = detectPanelType(display);
    const displayScore = clamp(refreshRateScore + panel.score, 0, 100);

    const camera = device?.camera || {};
    const mainMegapixel = extractMainMegapixel(camera);
    const cameraSensors = countCameraSensors(camera);
    const megapixelScore =
      mainMegapixel == null ? 24 : clamp((mainMegapixel / 108) * 65, 18, 65);
    const sensorScore = clamp(cameraSensors * 8.75, 10, 35);
    const cameraScore = clamp(megapixelScore + sensorScore, 0, 100);

    const batteryCapacity = extractBatteryCapacity(device?.battery || {});
    const batteryScore = scoreBatteryCapacity(batteryCapacity);

    const baseSpecScore =
      chipset.score * 0.4 +
      displayScore * 0.2 +
      cameraScore * 0.25 +
      batteryScore * 0.15;
    const price = extractPrice(device, variantSelection);
    const valueRaw = price && price > 0 ? baseSpecScore / price : null;

    return {
      deviceId: String(
        device?.id ?? device?.productId ?? device?.product_id ?? "",
      ),
      deviceName: device?.name || device?.model || "Device",
      price,
      valueRaw,
      breakdown: {
        performance: roundOne(chipset.score),
        display: roundOne(displayScore),
        camera: roundOne(cameraScore),
        battery: roundOne(batteryScore),
        priceValue: 0,
      },
      details: {
        processorText: processorText || "N/A",
        chipsetReason: chipset.reason,
        refreshRate: refreshRate ?? "N/A",
        panelType: panel.panelType,
        panelReason: panel.reason,
        mainMegapixel: mainMegapixel ?? "N/A",
        cameraSensors,
        batteryCapacity: batteryCapacity ?? "N/A",
      },
    };
  });

  const validValueRows = scored.filter((row) => row.valueRaw != null);
  const minValue = validValueRows.length
    ? Math.min(...validValueRows.map((row) => row.valueRaw))
    : null;
  const maxValue = validValueRows.length
    ? Math.max(...validValueRows.map((row) => row.valueRaw))
    : null;

  const scoredWithValue = scored.map((row) => {
    let valueScore = 50;
    if (row.valueRaw == null) {
      valueScore = 45;
    } else if (minValue != null && maxValue != null) {
      if (maxValue === minValue) valueScore = 70;
      else {
        valueScore =
          35 + ((row.valueRaw - minValue) / (maxValue - minValue)) * 65;
      }
    }
    const priceValue = roundOne(clamp(valueScore, 0, 100));
    const totalScore =
      row.breakdown.performance * COMPARE_SCORE_WEIGHTS.performance +
      row.breakdown.display * COMPARE_SCORE_WEIGHTS.display +
      row.breakdown.camera * COMPARE_SCORE_WEIGHTS.camera +
      row.breakdown.battery * COMPARE_SCORE_WEIGHTS.battery +
      priceValue * COMPARE_SCORE_WEIGHTS.priceValue;

    return {
      ...row,
      breakdown: {
        ...row.breakdown,
        priceValue,
      },
      totalScore: roundOne(totalScore),
    };
  });

  const ranked = [...scoredWithValue].sort((a, b) => {
    if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
    const aPrice = a.price ?? Number.POSITIVE_INFINITY;
    const bPrice = b.price ?? Number.POSITIVE_INFINITY;
    if (aPrice !== bPrice) return aPrice - bPrice;
    return a.deviceName.localeCompare(b.deviceName);
  });

  return ranked.map((row, index) => ({
    ...row,
    rank: index + 1,
  }));
};

export default buildComparisonRanking;
