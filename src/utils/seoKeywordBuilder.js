const toText = (value) =>
  String(value == null ? "" : value)
    .replace(/\s+/g, " ")
    .trim();

const uniquePush = (arr, seen, value) => {
  const text = toText(value);
  if (!text) return;
  const key = text.toLowerCase();
  if (seen.has(key)) return;
  seen.add(key);
  arr.push(text);
};

const getByPath = (obj, path) => {
  if (!obj || !path) return undefined;
  const parts = String(path)
    .split(".")
    .map((p) => p.trim())
    .filter(Boolean);
  let cur = obj;
  for (const part of parts) {
    if (cur == null) return undefined;
    cur = cur[part];
  }
  return cur;
};

const flattenToStrings = (value, depth = 0) => {
  if (value == null || depth > 3) return [];

  if (typeof value === "string" || typeof value === "number") {
    const text = toText(value);
    return text ? [text] : [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((entry) => flattenToStrings(entry, depth + 1));
  }

  if (typeof value === "object") {
    return Object.values(value)
      .slice(0, 10)
      .flatMap((entry) => flattenToStrings(entry, depth + 1));
  }

  return [];
};

const collectFirstValue = (device, paths = []) => {
  for (const path of paths) {
    const value = getByPath(device, path);
    const list = flattenToStrings(value).filter(Boolean);
    if (list.length > 0) return list[0];
  }
  return "";
};

const collectValues = (device, paths = [], max = 5) => {
  const out = [];
  const seen = new Set();
  for (const path of paths) {
    const value = getByPath(device, path);
    const list = flattenToStrings(value);
    for (const item of list) {
      uniquePush(out, seen, item);
      if (out.length >= max) return out;
    }
  }
  return out;
};

const MONTH_NAMES = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

const parseMonthYear = (raw) => {
  const text = toText(raw).toLowerCase();
  if (!text) return { month: "", year: "" };

  const yearMatch = text.match(/\b(20\d{2}|19\d{2})\b/);
  const month = MONTH_NAMES.find((m) => text.includes(m)) || "";
  const year = yearMatch ? yearMatch[1] : "";

  if (month || year) return { month, year };

  const dt = new Date(text);
  if (!Number.isNaN(dt.getTime())) {
    return {
      month: MONTH_NAMES[dt.getUTCMonth()] || "",
      year: String(dt.getUTCFullYear() || ""),
    };
  }

  return { month: "", year: "" };
};

const extractInches = (value) => {
  const text = toText(value);
  if (!text) return "";
  const direct = text.match(/(\d+(?:\.\d+)?)\s*(?:inches|inch|in)\b/i);
  if (direct) return `${direct[1]} inches`;

  const cm = text.match(/(\d+(?:\.\d+)?)\s*cm\b/i);
  if (cm) {
    const inches = (Number(cm[1]) / 2.54).toFixed(2);
    return `${inches} inches`;
  }
  return "";
};

const SPEC_PATHS = {
  refreshRate: [
    "refresh_rate",
    "refreshRate",
    "specs.refresh_rate",
    "specifications.refresh_rate",
    "display.refresh_rate",
    "display.refreshRate",
    "display_json.refresh_rate",
    "screen.refresh_rate",
  ],
  ai: [
    "ai_features",
    "features.ai",
    "specs.ai_features",
    "specifications.ai_features",
    "performance.ai_features",
    "camera.ai_features",
    "multimedia.ai_features",
    "ai",
  ],
  display: [
    "display.display_type",
    "display.type",
    "display.panel",
    "display.panel_type",
    "specifications.display_type",
    "specifications.display",
    "specs.display",
    "display_json.display_type",
  ],
  audio: [
    "audio",
    "sound",
    "specs.audio",
    "specifications.audio",
    "multimedia.audio",
    "multimedia.speakers",
    "specifications.speakers",
  ],
  resolution: [
    "resolution",
    "specs.resolution",
    "specifications.resolution",
    "display.resolution",
    "display_json.resolution",
  ],
  camera: [
    "camera.rear_camera.main_camera",
    "camera.main_camera",
    "rear_camera",
    "specs.camera",
    "specifications.camera",
    "camera",
  ],
  cameraTypes: [
    "camera.rear_camera.periscope",
    "camera.rear_camera.telephoto",
    "camera.rear_camera.ultra_wide_camera",
    "camera.rear_camera.ultra_wide",
    "camera.front_camera",
    "camera.periscope",
    "camera.telephoto",
    "camera.ultra_wide",
  ],
  processor: [
    "processor",
    "cpu",
    "chipset",
    "soc",
    "specs.processor",
    "specs.cpu",
    "specs.chipset",
    "specifications.processor",
    "specifications.cpu",
    "performance.processor",
    "performance.cpu",
    "performance.chipset",
  ],
  periscope: [
    "camera.rear_camera.periscope",
    "camera.periscope",
    "specs.periscope",
    "specifications.periscope",
  ],
  network: [
    "network",
    "network_technology",
    "connectivity_network.network_technology",
    "connectivity.network_technology",
    "connectivity.network",
    "specs.network",
    "specifications.network",
  ],
  panel: [
    "panel",
    "panel_type",
    "display.panel",
    "display.panel_type",
    "display_json.panel",
    "specifications.panel",
    "specifications.panel_type",
  ],
  ram: [
    "ram",
    "memory",
    "specs.ram",
    "specifications.ram",
    "performance.ram",
    "variants.0.ram",
  ],
  mount: [
    "mount",
    "wall_mount",
    "vesa_mount",
    "specifications.mount",
    "specifications.wall_mount",
    "specifications.vesa_mount",
    "design.mount",
  ],
  inches: [
    "screen_size",
    "display.screen_size",
    "display.size",
    "specifications.screen_size",
    "specs.screen_size",
    "variant.screen_size",
    "variants.0.screen_size",
  ],
  features: [
    "features",
    "specs.features",
    "specifications.features",
    "highlights",
    "popular_features",
    "ai_features",
  ],
  launch: [
    "launch_date",
    "launchDate",
    "released",
    "release_date",
    "expected_launch",
    "expectedLaunch",
    "announce_date",
  ],
};

const extractSignals = (device) => {
  const refreshRate = collectFirstValue(device, SPEC_PATHS.refreshRate);
  const aiValues = collectValues(device, SPEC_PATHS.ai, 3);
  const display = collectFirstValue(device, SPEC_PATHS.display);
  const audio = collectFirstValue(device, SPEC_PATHS.audio);
  const resolution = collectFirstValue(device, SPEC_PATHS.resolution);
  const camera = collectFirstValue(device, SPEC_PATHS.camera);
  const cameraTypes = collectValues(device, SPEC_PATHS.cameraTypes, 4);
  const processor = collectFirstValue(device, SPEC_PATHS.processor);
  const periscope = collectFirstValue(device, SPEC_PATHS.periscope);
  const network = collectFirstValue(device, SPEC_PATHS.network);
  const panel = collectFirstValue(device, SPEC_PATHS.panel);
  const ram = collectFirstValue(device, SPEC_PATHS.ram);
  const mount = collectFirstValue(device, SPEC_PATHS.mount);
  const inchesRaw = collectFirstValue(device, SPEC_PATHS.inches);
  const inches = extractInches(inchesRaw) || inchesRaw;
  const featureValues = collectValues(device, SPEC_PATHS.features, 6);
  const launchRaw = collectFirstValue(device, SPEC_PATHS.launch);
  const { month, year } = parseMonthYear(launchRaw);

  return {
    refreshRate,
    aiValues,
    display,
    audio,
    resolution,
    camera,
    cameraTypes,
    processor,
    periscope,
    network,
    panel,
    ram,
    month,
    year,
    featureValues,
    mount,
    inches,
  };
};

const appendSignalKeywords = (add, name, signals) => {
  if (!name) return;

  if (signals.refreshRate) add(`${name} ${signals.refreshRate} refresh rate`);
  if (signals.aiValues.length > 0) {
    add(`${name} AI features`);
    signals.aiValues.forEach((v) => add(`${name} ${v}`));
  }
  if (signals.display) add(`${name} display ${signals.display}`);
  if (signals.audio) add(`${name} audio ${signals.audio}`);
  if (signals.resolution) add(`${name} resolution ${signals.resolution}`);
  if (signals.camera) add(`${name} camera ${signals.camera}`);
  if (signals.cameraTypes.length > 0) {
    add(`${name} camera types`);
    signals.cameraTypes.forEach((v) => add(`${name} ${v} camera`));
  }
  if (signals.processor) add(`${name} processor ${signals.processor}`);
  if (signals.periscope) add(`${name} periscope ${signals.periscope}`);
  if (signals.network) add(`${name} network ${signals.network}`);
  if (signals.panel) add(`${name} panel ${signals.panel}`);
  if (signals.ram) add(`${name} ${signals.ram} RAM`);
  if (signals.month) add(`${name} ${signals.month}`);
  if (signals.year) add(`${name} ${signals.year}`);
  if (signals.featureValues.length > 0) {
    add(`${name} features`);
    signals.featureValues.forEach((v) => add(`${name} ${v}`));
  }
  if (signals.mount) add(`${name} mount ${signals.mount}`);
  if (signals.inches) add(`${name} ${signals.inches}`);
};

const resolveName = (device, productName) =>
  toText(
    productName ||
      device?.name ||
      device?.product_name ||
      device?.model ||
      device?.title ||
      "",
  );

const resolveBrand = (device, brand) =>
  toText(brand || device?.brand || device?.brand_name || "");

export const buildDeviceSeoKeywords = ({
  device,
  productName = "",
  brand = "",
  category = "",
  currentYear = "",
  baseTerms = [],
  maxKeywords = 45,
}) => {
  const keywords = [];
  const seen = new Set();
  const add = (value) => uniquePush(keywords, seen, value);

  baseTerms.forEach(add);
  const name = resolveName(device, productName);
  const brandName = resolveBrand(device, brand);
  const categoryText = toText(category);

  if (categoryText) add(categoryText);
  if (currentYear) add(`${categoryText || "devices"} ${currentYear}`);
  if (name) {
    add(name);
    add(`${name} price in india`);
    add(`${name} specifications`);
    add(`${name} review`);
  }
  if (brandName && categoryText) add(`${brandName} ${categoryText}`);
  if (brandName) add(`${brandName} devices`);

  const signals = extractSignals(device || {});
  appendSignalKeywords(add, name, signals);

  return keywords.slice(0, maxKeywords).join(", ");
};

export const buildListSeoKeywords = ({
  devices = [],
  category = "",
  currentYear = "",
  baseTerms = [],
  contextTerms = [],
  maxKeywords = 45,
}) => {
  const keywords = [];
  const seen = new Set();
  const add = (value) => uniquePush(keywords, seen, value);

  baseTerms.forEach(add);
  contextTerms.forEach(add);
  const categoryText = toText(category);
  if (categoryText) add(categoryText);
  if (currentYear) add(`${categoryText || "devices"} ${currentYear}`);

  const sample = Array.isArray(devices) ? devices.slice(0, 14) : [];
  for (const device of sample) {
    const name = resolveName(device);
    const brand = resolveBrand(device);
    if (brand && categoryText) add(`${brand} ${categoryText}`);
    if (name) {
      add(name);
      add(`${name} price in india`);
      add(`${name} specifications`);
    }
    const signals = extractSignals(device || {});
    appendSignalKeywords(add, name, signals);
  }

  return keywords.slice(0, maxKeywords).join(", ");
};

export default {
  buildDeviceSeoKeywords,
  buildListSeoKeywords,
};

