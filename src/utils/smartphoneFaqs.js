const FAQ_ENGINE = "client-buyer-intent-v1";
const CURRENT_YEAR = new Date().getFullYear();

const cleanText = (value) => {
  if (value == null) return "";
  if (Array.isArray(value)) return value.map(cleanText).filter(Boolean).join(", ");
  if (typeof value === "object") {
    return cleanText(
      value.name ||
        value.title ||
        value.label ||
        value.value ||
        value.text ||
        value.display_value,
    );
  }
  const text = String(value).replace(/\s+/g, " ").trim();
  return /^(n\/a|na|null|undefined|\[object object\]|-)$/i.test(text)
    ? ""
    : text;
};

const toObject = (value) => {
  if (!value) return {};
  if (typeof value === "object" && !Array.isArray(value)) return value;
  if (typeof value !== "string") return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : {};
  } catch {
    return {};
  }
};

const normalizeKey = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const findDeep = (source, aliases, seen = new Set()) => {
  if (!source || typeof source !== "object") return "";
  if (seen.has(source)) return "";
  seen.add(source);

  const wanted = new Set(aliases.map(normalizeKey));
  if (Array.isArray(source)) {
    for (const item of source) {
      const nested = findDeep(item, aliases, seen);
      if (nested) return nested;
    }
    return "";
  }

  for (const [key, value] of Object.entries(source)) {
    if (wanted.has(normalizeKey(key))) {
      const cleaned = cleanText(value);
      if (cleaned) return cleaned;
    }
  }

  for (const value of Object.values(source)) {
    if (value && typeof value === "object") {
      const nested = findDeep(value, aliases, seen);
      if (nested) return nested;
    }
  }
  return "";
};

const findFirst = (sources, aliases) => {
  for (const source of sources) {
    const found = findDeep(source, aliases);
    if (found) return found;
  }
  return "";
};

const parseNumber = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const match = cleanText(value).replace(/,/g, "").match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
};

const formatPrice = (value) => {
  const price = parseNumber(value);
  return price ? `Rs. ${Math.round(price).toLocaleString("en-IN")}` : "";
};

const joinNatural = (items, fallback = "") => {
  const values = [...new Set(items.map(cleanText).filter(Boolean))];
  if (!values.length) return fallback;
  if (values.length === 1) return values[0];
  if (values.length === 2) return `${values[0]} and ${values[1]}`;
  return `${values.slice(0, -1).join(", ")} and ${values[values.length - 1]}`;
};

const toArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    return value
      .split(/[,/|]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

const yesNo = (value) => {
  const text = cleanText(value).toLowerCase();
  if (/^(yes|true|supported|available|included|present)$/.test(text)) return "Yes";
  if (/^(no|false|not supported|unavailable|missing|absent)$/.test(text)) return "No";
  return cleanText(value);
};

const getFacts = ({ smartphone = {}, selectedVariant = null } = {}) => {
  const product = toObject(smartphone);
  const variant = toObject(selectedVariant);
  const specs = toObject(product.specifications || product.specs);
  const sources = [variant, product, specs];

  const name =
    findFirst(sources, ["name", "product_name", "title", "model"]) ||
    "this smartphone";
  const processor = findFirst(sources, ["processor", "chipset", "soc", "cpu"]);
  const ram = findFirst(sources, ["ram", "memory_ram", "memory"]);
  const storage = findFirst(sources, ["storage", "rom", "internal_storage"]);
  const displaySize = findFirst(sources, ["display_size", "screen_size", "size"]);
  const displayType = findFirst(sources, ["display_type", "screen_type", "panel"]);
  const refreshRate = findFirst(sources, ["refresh_rate", "refreshrate"]);
  const mainCamera = findFirst(sources, [
    "main_camera",
    "rear_camera",
    "primary_camera",
  ]);
  const frontCamera = findFirst(sources, ["front_camera", "selfie_camera"]);
  const batteryCapacity = findFirst(sources, [
    "battery",
    "battery_capacity",
    "capacity",
    "battery_mah",
  ]);
  const charging = findFirst(sources, [
    "charging",
    "fast_charging",
    "wired_charging",
    "charging_speed",
  ]);
  const network = findFirst(sources, ["network", "network_type", "5g_support"]);
  const os = findFirst(sources, ["os", "operating_system", "android"]);
  const ui = findFirst(sources, ["ui", "skin", "custom_ui"]);
  const displaySummary = joinNatural([displaySize, displayType, refreshRate]);
  const cameraSummary = joinNatural([
    mainCamera,
    frontCamera && `${frontCamera} selfie camera`,
  ]);
  const batterySummary = joinNatural([
    batteryCapacity,
    charging && `${charging} charging`,
  ]);
  const has5g = /5g/i.test([network, product.network_type, product.connectivity].join(" "));
  const strengths = [
    processor && `${processor} performance`,
    displaySummary && `${displaySummary} display`,
    parseNumber(batteryCapacity) >= 5000 && `${batteryCapacity} battery`,
    parseNumber(charging) >= 45 && `${charging} fast charging`,
    parseNumber(mainCamera) >= 50 && `${mainCamera} rear camera`,
    has5g && "5G connectivity",
  ].filter(Boolean);

  return {
    name,
    year: CURRENT_YEAR,
    price: formatPrice(
      variant.base_price ||
        variant.price ||
        product.price ||
        product.price_in_india ||
        product.starting_price ||
        product.min_price,
    ),
    processor,
    ram,
    storage,
    displaySummary,
    mainCamera,
    frontCamera,
    cameraSummary,
    batteryCapacity,
    charging,
    batterySummary,
    network,
    os,
    ui,
    ois: yesNo(findFirst(sources, ["ois", "stabilization"])),
    wirelessCharging: yesNo(findFirst(sources, ["wireless_charging", "wirelessCharging"])),
    ipRating: yesNo(findFirst(sources, ["ip_rating", "water_resistance", "waterproof"])),
    colors: toArray(product.colors || product.color_options),
    competitors: toArray(product.competitors || product.top_competitors)
      .map((item) => cleanText(item.name || item.title || item))
      .filter(Boolean),
    has5g,
    strengths,
  };
};

const templates = [
  ["worth_buying", "purchase", ["name"], "Should you buy {name} in {year}?", "{name} is worth considering if you want {strengths}. It is best compared with other phones in the same price range before buying."],
  ["who_should_buy", "purchase", ["name"], "Who should buy the {name}?", "{name} is suitable for users who care about {strengths}."],
  ["value_money", "purchase", ["price"], "Does {name} offer good value for money?", "At {price}, {name} should be judged against phones with similar performance, camera, battery and software support."],
  ["gaming", "performance", ["processor"], "How well does {name} handle gaming?", "{name} uses {processor}, so it should handle casual and mainstream games well. Heavy gaming depends on cooling and software tuning."],
  ["multitasking", "performance", ["ram"], "How smooth is {name} for multitasking?", "{name} should multitask well with {ram}, especially for social apps, browsing and everyday switching."],
  ["camera_good", "camera", ["cameraSummary"], "How good is the camera on {name}?", "{name} has {cameraSummary}. It should be good for regular photos, while final quality depends on tuning and low-light processing."],
  ["selfie", "camera", ["frontCamera"], "How good is the selfie camera on {name} for video calls?", "The {frontCamera} front camera should be fine for selfies and video calls in good lighting."],
  ["battery_day", "battery", ["batteryCapacity"], "Can {name} battery last a full day?", "{name} has {batteryCapacity} battery capacity, so it should last a full day for many users. Gaming and hotspot use can reduce backup."],
  ["charging", "battery", ["charging"], "How fast does {name} charge?", "{name} supports {charging} charging. Actual charging time depends on charger, battery size and charging curve."],
  ["wireless", "battery", ["wirelessCharging"], "Does {name} support wireless charging?", "{name} lists wireless charging as {wirelessCharging}."],
  ["display_movies", "display", ["displaySummary"], "How is {name} display for watching movies?", "{name} has {displaySummary}, making it suitable for streaming and video playback."],
  ["supports_5g", "connectivity", ["name"], "Does {name} support 5G?", "{fiveGAnswer}"],
  ["software", "software", ["os"], "Which software does {name} run?", "{name} runs {os}. Future updates depend on the brand update policy."],
  ["ui", "software", ["ui"], "Does {name} have a clean UI?", "{name} runs {ui}. Check reviews for pre-installed apps, ads and notification behavior."],
  ["waterproof", "build", ["ipRating"], "What water resistance does {name} offer?", "{name} lists water resistance as {ipRating}. Check the exact IP rating before using it around water."],
  ["colors", "buying", ["colors"], "What colors are available for {name}?", "{name} is listed in {colors}. Availability can vary by store and variant."],
  ["variant", "buying", ["ram", "storage"], "Which variant of {name} should I buy?", "Choose {ram} + {storage} or higher if you multitask, play games or store many photos and videos."],
  ["compare", "comparison", ["competitors"], "What are the alternatives to {name}?", "Good alternatives to {name} include {competitors}. Compare price, camera, battery and software support before deciding."],
];

export const buildClientSmartphoneFaqs = ({
  smartphone,
  selectedVariant,
  limit = 15,
} = {}) => {
  const facts = getFacts({ smartphone, selectedVariant });
  const values = {
    ...facts,
    strengths: joinNatural(facts.strengths, "a balanced smartphone experience"),
    colors: joinNatural(facts.colors, "the listed color options"),
    competitors: joinNatural(facts.competitors, "similarly priced smartphones"),
    fiveGAnswer: facts.has5g
      ? `${facts.name} supports 5G where your carrier has coverage.`
      : `${facts.name}'s 5G support is not clearly listed, so check the network specifications before buying.`,
  };
  const render = (text) =>
    String(text).replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key) =>
      cleanText(values[key]),
    );

  return templates
    .filter(([, , required]) =>
      required.every((key) => {
        if (key === "colors") return facts.colors.length > 0;
        if (key === "competitors") return facts.competitors.length > 0;
        return Boolean(cleanText(facts[key]));
      }),
    )
    .slice(0, Math.max(1, Number(limit) || 15))
    .map(([id, category, , question, answer], index) => ({
      id,
      category,
      question: render(question),
      answer: render(answer),
      position: index + 1,
      engine: FAQ_ENGINE,
    }));
};

export default buildClientSmartphoneFaqs;
