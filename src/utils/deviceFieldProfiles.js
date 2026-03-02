const DEVICE_TYPES = ["smartphone", "laptop", "tv"];

const DEFAULT_DEVICE_FIELD_PROFILES = {
  smartphone: {
    mandatory: {
      name: ["name", "product_name", "model"],
      brand: ["brand_name", "brand"],
      processor: ["performance.processor", "processor", "specs.processor"],
      battery: [
        "battery.capacity",
        "battery.battery_capacity",
        "battery.battery_capacity_mah",
        "battery",
      ],
      display: ["display.size", "display.display_size", "display"],
      camera: [
        "camera.rear_camera.main_camera.resolution",
        "camera.rear_camera.main.resolution",
        "camera.main_camera_megapixels",
        "camera.main_camera",
      ],
      price: ["variants[].base_price", "variants[].store_prices[].price", "price"],
      image: ["images[]", "image"],
    },
    display: {
      processor: ["performance.processor", "processor", "specs.processor"],
      ram: ["performance.ram", "variants[].ram", "specs.ram"],
      storage: ["performance.storage", "variants[].storage", "specs.storage"],
      battery: [
        "battery.capacity",
        "battery.battery_capacity",
        "battery.battery_capacity_mah",
      ],
      main_camera: [
        "camera.rear_camera.main_camera.resolution",
        "camera.rear_camera.main.resolution",
        "camera.main_camera_megapixels",
        "camera.main_camera",
      ],
      display_size: ["display.size", "display.display_size", "specs.display"],
      refresh_rate: ["display.refresh_rate", "display.refreshRate"],
      os: [
        "performance.operating_system",
        "performance.operatingSystem",
        "performance.os",
      ],
      network: [
        "connectivity.network_type",
        "network.network_type",
        "network.5g_support",
      ],
    },
  },
  laptop: {
    mandatory: {
      name: ["name", "product_name", "basic_info.product_name", "model"],
      brand: ["brand_name", "brand", "basic_info.brand_name"],
      processor: [
        "performance.processor",
        "cpu.processor",
        "specifications.processor",
      ],
      ram: ["memory.ram", "variants[].ram", "specifications.ram"],
      storage: ["storage.capacity", "variants[].storage", "specifications.storage"],
      display: ["display.size", "display.display_size", "specifications.display"],
      battery: ["battery.capacity", "specifications.battery"],
      price: ["variants[].base_price", "variants[].store_prices[].price", "price"],
      image: ["images[]", "image"],
    },
    display: {
      processor: [
        "performance.processor",
        "cpu.processor",
        "specifications.processor",
      ],
      ram: ["memory.ram", "variants[].ram", "specifications.ram"],
      storage: ["storage.capacity", "variants[].storage", "specifications.storage"],
      display_size: [
        "display.size",
        "display.display_size",
        "specifications.display_size",
      ],
      resolution: ["display.resolution", "specifications.resolution"],
      battery: ["battery.capacity", "specifications.battery"],
      os: ["software.operating_system", "software.os", "specifications.operating_system"],
      graphics: ["performance.gpu", "specifications.graphics", "graphics.model"],
      weight: ["physical.weight", "specifications.weight"],
    },
  },
  tv: {
    mandatory: {
      name: ["name", "product_name", "basic_info_json.title", "model"],
      brand: ["brand_name", "brand", "basic_info_json.brand_name"],
      screen_size: [
        "key_specs_json.screen_size",
        "display_json.screen_size",
        "specs.screenSize",
      ],
      resolution: ["key_specs_json.resolution", "display_json.resolution", "specs.resolution"],
      os: [
        "key_specs_json.operating_system",
        "smart_tv_json.operating_system",
        "specs.operatingSystem",
      ],
      refresh_rate: [
        "key_specs_json.refresh_rate",
        "display_json.refresh_rate",
        "specs.refreshRate",
      ],
      price: ["variants[].base_price", "variants[].store_prices[].price", "price"],
      image: ["images[]", "image"],
    },
    display: {
      screen_size: [
        "key_specs_json.screen_size",
        "display_json.screen_size",
        "specs.screenSize",
      ],
      resolution: ["key_specs_json.resolution", "display_json.resolution", "specs.resolution"],
      refresh_rate: [
        "key_specs_json.refresh_rate",
        "display_json.refresh_rate",
        "specs.refreshRate",
      ],
      panel_type: [
        "key_specs_json.panel_type",
        "display_json.panel_type",
        "specs.displayType",
      ],
      os: [
        "key_specs_json.operating_system",
        "smart_tv_json.operating_system",
        "specs.operatingSystem",
      ],
      audio_output: ["key_specs_json.audio_output", "audio_json.output_power", "specs.audioOutput"],
      energy_rating: [
        "power_json.energy_rating",
        "power_json.energy_star_rating",
        "specs.energyRating",
      ],
      smart_features: [
        "smart_tv_json.supported_apps",
        "smart_tv_json.voice_assistant",
        "key_specs_json.ai_features",
      ],
    },
  },
};

const isPlainObject = (value) =>
  value && typeof value === "object" && !Array.isArray(value);

const hasValue = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value === "boolean") return true;
  if (Array.isArray(value)) return value.some((item) => hasValue(item));
  if (isPlainObject(value)) return Object.values(value).some((item) => hasValue(item));
  return true;
};

const toDisplayValue = (value) => {
  if (value === null || value === undefined) return null;
  if (Array.isArray(value)) {
    const flattened = value
      .map((item) => toDisplayValue(item))
      .filter((item) => hasValue(item));
    if (!flattened.length) return null;
    return flattened.join(", ");
  }
  if (isPlainObject(value)) {
    const entries = Object.entries(value)
      .map(([key, val]) => {
        const normalized = toDisplayValue(val);
        if (!hasValue(normalized)) return null;
        return `${key}: ${normalized}`;
      })
      .filter(Boolean);
    return entries.length ? entries.join(" | ") : null;
  }
  return String(value).trim();
};

const normalizePathList = (value) => {
  if (!value) return [];
  const list = Array.isArray(value) ? value : [value];
  return list
    .map((path) => String(path || "").trim())
    .filter(Boolean);
};

const normalizeFieldMap = (value, fallback = {}) => {
  const source = isPlainObject(value) ? value : {};
  const output = {};

  const keys = new Set([
    ...Object.keys(isPlainObject(fallback) ? fallback : {}),
    ...Object.keys(source),
  ]);

  keys.forEach((key) => {
    const fallbackPaths = normalizePathList(fallback?.[key]);
    const incomingPaths = normalizePathList(source?.[key]);
    output[key] = incomingPaths.length ? incomingPaths : fallbackPaths;
  });

  return output;
};

const normalizeDeviceType = (type) => {
  const normalized = String(type || "")
    .trim()
    .toLowerCase();
  if (["smartphone", "smartphones", "mobile", "mobiles"].includes(normalized)) {
    return "smartphone";
  }
  if (["laptop", "laptops", "notebook", "notebooks"].includes(normalized)) {
    return "laptop";
  }
  if (
    [
      "tv",
      "tvs",
      "television",
      "televisions",
      "home-appliance",
      "home_appliance",
      "homeappliance",
      "appliance",
      "appliances",
    ].includes(normalized)
  ) {
    return "tv";
  }
  return "smartphone";
};

const normalizeSingleProfile = (value, fallback) => {
  const source = isPlainObject(value) ? value : {};
  return {
    mandatory: normalizeFieldMap(source.mandatory, fallback.mandatory),
    display: normalizeFieldMap(source.display, fallback.display),
  };
};

const normalizeDeviceFieldProfiles = (value) => {
  const source = isPlainObject(value) ? value : {};
  const output = {};

  DEVICE_TYPES.forEach((type) => {
    output[type] = normalizeSingleProfile(
      source[type],
      DEFAULT_DEVICE_FIELD_PROFILES[type],
    );
  });

  return output;
};

const collectPathValues = (source, path) => {
  if (!path || !source) return [];
  const segments = String(path)
    .split(".")
    .map((segment) => segment.trim())
    .filter(Boolean);
  if (!segments.length) return [];

  const walk = (current, index) => {
    if (index >= segments.length) return [current];
    if (current === null || current === undefined) return [];

    const segment = segments[index];

    if (segment === "*") {
      if (Array.isArray(current)) {
        return current.flatMap((item) => walk(item, index + 1));
      }
      if (isPlainObject(current)) {
        return Object.values(current).flatMap((item) => walk(item, index + 1));
      }
      return [];
    }

    if (segment.endsWith("[]")) {
      const key = segment.slice(0, -2);
      const target = key ? current?.[key] : current;
      if (!Array.isArray(target)) return [];
      return target.flatMap((item) => walk(item, index + 1));
    }

    if (/^\d+$/.test(segment)) {
      const idx = Number(segment);
      if (!Array.isArray(current) || idx >= current.length) return [];
      return walk(current[idx], index + 1);
    }

    return walk(current?.[segment], index + 1);
  };

  return walk(source, 0).filter((item) => hasValue(item));
};

const resolveValueByPaths = (source, paths = []) => {
  for (const path of paths) {
    const values = collectPathValues(source, path);
    if (!values.length) continue;
    const first = values.find((item) => hasValue(item));
    if (hasValue(first)) return first;
  }
  return null;
};

const resolveDeviceFieldProfile = (type, device, profiles) => {
  const normalizedProfiles = normalizeDeviceFieldProfiles(profiles);
  const normalizedType = normalizeDeviceType(type || device?.product_type);
  const profile = normalizedProfiles[normalizedType] || normalizedProfiles.smartphone;

  const mandatoryValues = {};
  const displayValues = {};
  const missingMandatory = [];

  Object.entries(profile.mandatory).forEach(([key, paths]) => {
    const resolved = resolveValueByPaths(device, paths);
    mandatoryValues[key] = resolved;
    if (!hasValue(resolved)) missingMandatory.push(key);
  });

  Object.entries(profile.display).forEach(([key, paths]) => {
    const resolved = resolveValueByPaths(device, paths);
    displayValues[key] = resolved;
  });

  const mandatoryTotal = Object.keys(profile.mandatory).length;
  const mandatoryAvailable = mandatoryTotal - missingMandatory.length;
  const displayTotal = Object.keys(profile.display).length;
  const displayAvailable = Object.values(displayValues).filter((value) =>
    hasValue(value),
  ).length;

  const mandatoryCoverage =
    mandatoryTotal > 0 ? (mandatoryAvailable / mandatoryTotal) * 100 : 0;
  const displayCoverage =
    displayTotal > 0 ? (displayAvailable / displayTotal) * 100 : 0;

  const score = Number(
    Math.max(0, Math.min(100, mandatoryCoverage * 0.75 + displayCoverage * 0.25)).toFixed(1),
  );

  return {
    type: normalizedType,
    mandatory_values: mandatoryValues,
    display_values: displayValues,
    mandatory_display: Object.fromEntries(
      Object.entries(mandatoryValues).map(([key, value]) => [
        key,
        toDisplayValue(value),
      ]),
    ),
    display_display: Object.fromEntries(
      Object.entries(displayValues).map(([key, value]) => [key, toDisplayValue(value)]),
    ),
    missing_mandatory: missingMandatory,
    mandatory_coverage: Number(mandatoryCoverage.toFixed(1)),
    display_coverage: Number(displayCoverage.toFixed(1)),
    section_scores: {
      core: Number(mandatoryCoverage.toFixed(1)),
      display: Number(displayCoverage.toFixed(1)),
    },
    score,
  };
};

export {
  DEFAULT_DEVICE_FIELD_PROFILES,
  normalizeDeviceFieldProfiles,
  resolveDeviceFieldProfile,
  normalizeDeviceType,
};
