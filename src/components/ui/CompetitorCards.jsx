import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  FaArrowDown,
  FaArrowUp,
  FaCheck,
  FaChevronRight,
  FaPlusSquare,
  FaTimesCircle,
  FaBalanceScale,
  FaThumbsDown,
  FaThumbsUp,
  FaCheckDouble,
  FaAdjust,
  FaCheckCircle,
} from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { createProductPath } from "../../utils/slugGenerator";
import { buildCanonicalComparePath } from "../../utils/compareRoutes";
import { readPreloadedApiResponse } from "../../utils/preloadedApi";
import { resolveSmartphoneBadgeScore } from "../../utils/smartphoneBadgeScore";

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL || "https://api.apisphere.in"
).replace(/\/$/, "");

const formatPrice = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return "Price unavailable";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
};

const normalizeList = (value) =>
  Array.isArray(value)
    ? value.map((item) => String(item || "").trim()).filter(Boolean)
    : [];

const normalizeText = (value) => String(value || "").trim();

const buildCompetitorsEndpoint = (productId, entityType) => {
  const pid = Number(productId);
  if (!Number.isInteger(pid) || pid <= 0) return "";
  const queryEntity = encodeURIComponent(String(entityType || "smartphones"));
  return `${API_BASE}/api/public/product/${encodeURIComponent(
    pid,
  )}/competitors?entity_type=${queryEntity}`;
};

const toFiniteNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const toPriceNumber = (value) => {
  if (value == null || value === "") return null;
  const normalized =
    typeof value === "string" ? value.replace(/[^0-9.]/g, "") : value;
  const n = Number(normalized);
  return Number.isFinite(n) && n > 0 ? n : null;
};

const resolveLowestPrice = (device) => {
  if (!device || typeof device !== "object") return null;
  const candidates = [
    toPriceNumber(
      device.price ??
        device.base_price ??
        device.basePrice ??
        device.numericPrice ??
        null,
    ),
  ];

  const topLevelStores = Array.isArray(device.store_prices)
    ? device.store_prices
    : Array.isArray(device.storePrices)
      ? device.storePrices
      : [];
  for (const store of topLevelStores) {
    candidates.push(toPriceNumber(store?.price));
  }

  const variants = Array.isArray(device.variants) ? device.variants : [];
  for (const variant of variants) {
    candidates.push(
      toPriceNumber(
        variant?.base_price ??
          variant?.price ??
          variant?.basePrice ??
          variant?.numericPrice ??
          null,
      ),
    );

    const stores = Array.isArray(variant?.store_prices)
      ? variant.store_prices
      : Array.isArray(variant?.storePrices)
        ? variant.storePrices
        : [];
    for (const store of stores) {
      candidates.push(toPriceNumber(store?.price));
    }
  }

  const validCandidates = candidates.filter((candidate) => candidate != null);
  return validCandidates.length > 0 ? Math.min(...validCandidates) : null;
};

const resolveBestStoreName = (device) => {
  if (!device || typeof device !== "object") return null;
  if (device.best_store_name) return String(device.best_store_name);

  const topLevelStores = Array.isArray(device.store_prices)
    ? device.store_prices
    : Array.isArray(device.storePrices)
      ? device.storePrices
      : [];
  let best = null;
  for (const store of topLevelStores) {
    const price = toPriceNumber(store?.price);
    if (price == null) continue;
    if (!best || price < best.price) {
      best = {
        price,
        name: store?.store_name || store?.store || store?.storeName || null,
      };
    }
  }

  const variants = Array.isArray(device.variants) ? device.variants : [];
  for (const variant of variants) {
    const stores = Array.isArray(variant?.store_prices)
      ? variant.store_prices
      : Array.isArray(variant?.storePrices)
        ? variant.storePrices
        : [];
    for (const store of stores) {
      const price = toPriceNumber(store?.price);
      if (price == null) continue;
      if (!best || price < best.price) {
        best = {
          price,
          name: store?.store_name || store?.store || store?.storeName || null,
        };
      }
    }
  }
  return best?.name ? String(best.name) : null;
};

const toSlug = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const parseTimeValue = (value) => {
  if (!value) return null;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : null;
};

const formatLaunchDate = (value) => {
  const ts = parseTimeValue(value);
  if (ts == null) return "";
  try {
    return new Date(ts).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
};

const formatCompetitorName = (value) => {
  const raw = String(value || "")
    .replace(/\s+/g, " ")
    .trim();
  if (!raw) return "Competitor";

  const fixes = [
    ["iqoo", "iQOO"],
    ["oneplus", "OnePlus"],
    ["oppo", "OPPO"],
    ["vivo", "vivo"],
    ["realme", "realme"],
    ["redmi", "Redmi"],
    ["xiaomi", "Xiaomi"],
    ["motorola", "Motorola"],
    ["google", "Google"],
    ["infinix", "Infinix"],
  ];

  let out = raw;
  for (const [pattern, replacement] of fixes) {
    out = out.replace(new RegExp(`\\b${pattern}\\b`, "ig"), replacement);
  }
  return out;
};

const clampNumber = (value, min = 0, max = 100) =>
  Math.min(max, Math.max(min, value));

const stringifySpecValue = (value) => {
  if (value == null) return "";
  if (Array.isArray(value)) return value.map(stringifySpecValue).join(" ");
  if (typeof value === "object") {
    return Object.values(value).map(stringifySpecValue).join(" ");
  }
  return String(value);
};

const pickSpecValue = (...values) =>
  values.find((value) => normalizeText(stringifySpecValue(value))) ?? "";

const normalizeSpecText = (value) =>
  stringifySpecValue(value)
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const parseSpecNumber = (value) => {
  const text = stringifySpecValue(value).replace(/,/g, "");
  const match = text.match(/\d+(?:\.\d+)?/);
  if (!match) return null;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseGbValue = (value) => {
  const text = normalizeSpecText(value);
  const parsed = parseSpecNumber(text);
  if (parsed == null) return null;
  return /\btb\b/.test(text) ? parsed * 1024 : parsed;
};

const maxParsedValue = (values, parser = parseSpecNumber) => {
  const parsed = values
    .flat()
    .map((value) => parser(value))
    .filter((value) => Number.isFinite(value) && value > 0);
  return parsed.length > 0 ? Math.max(...parsed) : null;
};

const getVariantRows = (device) =>
  Array.isArray(device?.variants)
    ? device.variants
    : Array.isArray(device?.variant)
      ? device.variant
      : [];

const resolveCandidateScore = (device) => {
  const values = [
    resolveSmartphoneBadgeScore(device),
    device?.spec_score_v2_display_80_98,
    device?.specScoreV2Display8098,
    device?.spec_score_display,
    device?.specScoreDisplay,
    device?.spec_score_v2,
    device?.specScoreV2,
    device?.spec_score,
    device?.specScore,
    device?.overall_score_v2_display_80_98,
    device?.overallScoreV2Display8098,
    device?.overall_score_v2,
    device?.overallScoreV2,
    device?.overall_score,
    device?.overallScore,
  ];

  for (const value of values) {
    const parsed = toFiniteNumber(value) ?? parseSpecNumber(value);
    if (parsed != null) return clampNumber(parsed);
  }
  return null;
};

const getProcessorTokens = (value) => {
  const ignored = new Set([
    "qualcomm",
    "mediatek",
    "processor",
    "chipset",
    "mobile",
    "octa",
    "core",
    "gen",
    "soc",
  ]);
  return normalizeSpecText(value)
    .split(" ")
    .filter((token) => token.length > 1 && !ignored.has(token));
};

const tokenOverlapRatio = (leftTokens, rightTokens) => {
  if (!leftTokens.length || !rightTokens.length) return null;
  const left = new Set(leftTokens);
  const right = new Set(rightTokens);
  const matches = [...left].filter((token) => right.has(token)).length;
  return matches / Math.max(left.size, right.size);
};

const numericSimilarityRatio = (left, right, tolerance) => {
  if (left == null || right == null || tolerance <= 0) return null;
  return clampNumber(1 - Math.abs(left - right) / tolerance, 0, 1);
};

const scorePriceFit = (currentPrice, competitorPrice) => {
  if (!(currentPrice > 0) || !(competitorPrice > 0)) return 55;
  const denominator = Math.max(currentPrice, competitorPrice);
  const diffRatio = Math.abs(currentPrice - competitorPrice) / denominator;
  if (diffRatio <= 0.15) return 100;
  if (diffRatio <= 0.3) return 90;
  if (diffRatio <= 0.5) return 72;
  return clampNumber(62 - (diffRatio - 0.5) * 80, 20, 62);
};

const resolveRatingScore = (device) => {
  const rating = toFiniteNumber(device?.rating ?? device?.avg_rating);
  if (rating == null || rating <= 0) return 55;
  return rating <= 5 ? clampNumber(rating * 20) : clampNumber(rating);
};

const resolveRecencyScore = (device) => {
  const launchTime = parseTimeValue(
    device?.launch_date || device?.launchDate || device?.created_at,
  );
  if (launchTime == null) return 55;
  const ageDays = Math.max(0, (Date.now() - launchTime) / 86400000);
  return clampNumber(100 - ageDays / 4, 45, 100);
};

const buildDeviceSignals = (device, overrides = {}) => {
  const variants = getVariantRows(device);
  const performance = device?.performance || {};
  const display = device?.display || {};
  const camera = device?.camera || device?.cameras || {};
  const battery = device?.battery || {};
  const processorText = pickSpecValue(
    performance.processor,
    performance.chipset,
    device?.processor,
    device?.chipset,
    device?.cpu,
  );
  const displayType = normalizeSpecText(
    pickSpecValue(
      display.display_type,
      display.displayType,
      display.type,
      device?.display_type,
      device?.screen_type,
    ),
  );
  const networkText = normalizeSpecText(
    pickSpecValue(
      device?.network,
      device?.network_connectivity,
      device?.connectivity,
      device?.general,
      device?.sim,
      device?.technology,
    ),
  );

  return {
    brand: normalizeSpecText(
      overrides.brand || device?.brand || device?.brand_name,
    ),
    price:
      overrides.price && overrides.price > 0
        ? overrides.price
        : resolveLowestPrice(device),
    score: resolveCandidateScore(device),
    ratingScore: resolveRatingScore(device),
    recencyScore: resolveRecencyScore(device),
    processorText: normalizeText(stringifySpecValue(processorText)),
    processorTokens: getProcessorTokens(processorText),
    ramGb: maxParsedValue(
      [
        variants.map((variant) => variant?.ram ?? variant?.memory),
        performance.ram,
        performance.ram_options,
        device?.ram,
        device?.memory,
      ],
      parseGbValue,
    ),
    storageGb: maxParsedValue(
      [
        variants.map((variant) => variant?.storage ?? variant?.ROM_storage),
        performance.storage,
        performance.storage_options,
        performance.ROM_storage,
        device?.storage,
      ],
      parseGbValue,
    ),
    batteryMah: maxParsedValue([
      battery.battery_capacity_mah,
      battery.battery_capacity,
      battery.capacity,
      device?.battery_capacity_mah,
      device?.battery_capacity,
      device?.battery,
    ]),
    chargingW: maxParsedValue([
      battery.charging_wattage,
      battery.fast_charging,
      battery.quick_charging,
      battery.charging,
      device?.charging,
    ]),
    refreshHz: maxParsedValue([
      display.refresh_rate,
      display.refreshRate,
      display.screen_refresh_rate,
      device?.refresh_rate,
      device?.refreshRate,
    ]),
    displaySize: maxParsedValue([
      display.size,
      display.screen_size,
      display.screenSize,
      device?.screen_size,
    ]),
    displayType,
    rearCameraMp: maxParsedValue([
      camera.rear_camera,
      camera.rearCamera,
      camera.rear,
      device?.rear_camera,
      device?.main_camera,
    ]),
    frontCameraMp: maxParsedValue([
      camera.front_camera,
      camera.frontCamera,
      camera.front,
      device?.front_camera,
      device?.selfie_camera,
    ]),
    networkGeneration: /\b5g\b/.test(networkText)
      ? "5g"
      : /\b(4g|lte)\b/.test(networkText)
        ? "4g"
        : "",
  };
};

const scoreSpecSimilarity = (currentSignals, competitorSignals) => {
  const weighted = [];
  const add = (ratio, weight) => {
    if (ratio == null) return;
    weighted.push({ ratio: clampNumber(ratio, 0, 1), weight });
  };

  add(
    tokenOverlapRatio(
      currentSignals.processorTokens,
      competitorSignals.processorTokens,
    ),
    18,
  );
  add(
    numericSimilarityRatio(
      currentSignals.ramGb,
      competitorSignals.ramGb,
      Math.max((currentSignals.ramGb || 0) * 0.75, 4),
    ),
    10,
  );
  add(
    numericSimilarityRatio(
      currentSignals.storageGb,
      competitorSignals.storageGb,
      Math.max((currentSignals.storageGb || 0) * 0.75, 128),
    ),
    8,
  );
  add(
    numericSimilarityRatio(
      currentSignals.batteryMah,
      competitorSignals.batteryMah,
      Math.max((currentSignals.batteryMah || 0) * 0.35, 1500),
    ),
    10,
  );
  add(
    numericSimilarityRatio(
      currentSignals.chargingW,
      competitorSignals.chargingW,
      Math.max((currentSignals.chargingW || 0) * 0.75, 35),
    ),
    5,
  );
  add(
    numericSimilarityRatio(
      currentSignals.refreshHz,
      competitorSignals.refreshHz,
      Math.max((currentSignals.refreshHz || 0) * 0.5, 60),
    ),
    8,
  );
  add(
    numericSimilarityRatio(
      currentSignals.displaySize,
      competitorSignals.displaySize,
      0.8,
    ),
    5,
  );
  add(
    numericSimilarityRatio(
      currentSignals.rearCameraMp,
      competitorSignals.rearCameraMp,
      Math.max((currentSignals.rearCameraMp || 0) * 0.7, 50),
    ),
    7,
  );
  add(
    numericSimilarityRatio(
      currentSignals.frontCameraMp,
      competitorSignals.frontCameraMp,
      Math.max((currentSignals.frontCameraMp || 0) * 0.75, 20),
    ),
    4,
  );
  if (currentSignals.networkGeneration && competitorSignals.networkGeneration) {
    add(
      currentSignals.networkGeneration === competitorSignals.networkGeneration
        ? 1
        : 0,
      7,
    );
  }
  if (currentSignals.displayType && competitorSignals.displayType) {
    add(currentSignals.displayType === competitorSignals.displayType ? 1 : 0, 4);
  }

  const totalWeight = weighted.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight <= 0) return 55;
  const total = weighted.reduce(
    (sum, item) => sum + item.ratio * item.weight,
    0,
  );
  return clampNumber((total / totalWeight) * 100);
};

const buildCompetitorReasons = ({
  sameBrand,
  priceScore,
  specSimilarity,
  currentSignals,
  competitorSignals,
}) => {
  const parts = [];
  if (priceScore >= 80) parts.push("Close price band");
  if (sameBrand) parts.push("Same brand option");
  if (specSimilarity >= 74) parts.push("Similar core specs");
  if (
    tokenOverlapRatio(
      currentSignals.processorTokens,
      competitorSignals.processorTokens,
    ) >= 0.5
  ) {
    parts.push("Similar processor class");
  }
  if (
    currentSignals.networkGeneration &&
    currentSignals.networkGeneration === competitorSignals.networkGeneration
  ) {
    parts.push(`${currentSignals.networkGeneration.toUpperCase()} ready`);
  }
  if (parts.length === 0) parts.push("Worth comparing");
  return parts;
};

const buildComparableSpecBullets = ({
  priceScore,
  specSimilarity,
  competitorSignals,
}) => {
  const bullets = [];
  if (priceScore >= 80) bullets.push("Close in price");
  if (specSimilarity >= 74) bullets.push("Similar everyday specs");
  if (competitorSignals.processorText) {
    bullets.push(`Processor: ${competitorSignals.processorText}`);
  }
  if (competitorSignals.ramGb || competitorSignals.storageGb) {
    const ram = competitorSignals.ramGb
      ? `${Math.round(competitorSignals.ramGb)} GB RAM`
      : "";
    const storage = competitorSignals.storageGb
      ? `${Math.round(competitorSignals.storageGb)} GB storage`
      : "";
    bullets.push([ram, storage].filter(Boolean).join(" / "));
  }
  if (competitorSignals.batteryMah) {
    bullets.push(`Battery: ${Math.round(competitorSignals.batteryMah)} mAh`);
  }
  if (competitorSignals.rearCameraMp) {
    bullets.push(`Rear camera: ${Math.round(competitorSignals.rearCameraMp)} MP`);
  }
  return bullets.filter(Boolean).slice(0, 5);
};

const humanizeComparisonText = (value) => {
  let text = normalizeText(value).replace(/\s+/g, " ");
  if (!text) return "";

  const replacements = [
    [/^Weaker processor tier$/i, "Lower processor class"],
    [/^Higher Weight:\s*/i, "Heavier build: "],
    [/^Lower Weight:\s*/i, "Lighter build: "],
    [/^Higher Screen Size:\s*/i, "Larger screen: "],
    [/^Lower Screen Size:\s*/i, "Smaller screen: "],
    [/^Higher Brightness:\s*/i, "Brighter display: "],
    [/^Lower Brightness:\s*/i, "Lower display brightness: "],
    [/^Higher Battery Capacity:\s*/i, "Bigger battery: "],
    [/^Lower Battery Capacity:\s*/i, "Smaller battery: "],
    [/^Rear Camera:\s*/i, "Rear camera: "],
    [/^Front Camera:\s*/i, "Front camera: "],
    [/^Higher /i, "More "],
    [/^Lower /i, "Less "],
    [/\bScreen Size\b/g, "screen size"],
    [/\bBattery Capacity\b/g, "battery"],
    [/\bBrightness\b/g, "brightness"],
    [/\bWeight\b/g, "weight"],
  ];

  for (const [pattern, replacement] of replacements) {
    text = text.replace(pattern, replacement);
  }

  return text;
};

const formatMatchSummary = (competitor) => {
  const reasonParts = normalizeText(competitor?.reason)
    .split("|")
    .map(humanizeComparisonText)
    .filter(Boolean);
  if (reasonParts.length > 0) return reasonParts.slice(0, 2).join(" / ");
  return "Balanced alternative with close pricing and practical specs.";
};

const buildFallbackCompetitorRows = ({
  productId,
  fallbackCompetitors,
  currentDevice,
  currentBrand,
  currentPrice,
}) => {
  const list = Array.isArray(fallbackCompetitors) ? fallbackCompetitors : [];
  const currentId = Number(productId);
  const currentSignals = buildDeviceSignals(currentDevice || {}, {
    brand: currentBrand,
    price: currentPrice,
  });

  return list
    .map((item) => {
      const competitorId = Number(
        item?.id ?? item?.product_id ?? item?.productId,
      );
      if (!Number.isInteger(competitorId) || competitorId <= 0) return null;
      if (Number.isInteger(currentId) && competitorId === currentId)
        return null;

      const brand = String(item?.brand || item?.brand_name || "").trim();
      const price = resolveLowestPrice(item);
      const bestStoreName = resolveBestStoreName(item);
      const sameBrand =
        currentSignals.brand && brand
          ? currentSignals.brand === normalizeSpecText(brand)
          : false;

      const competitorSignals = buildDeviceSignals(item, { price });
      const priceScore = scorePriceFit(currentSignals.price, price);
      const specSimilarity = scoreSpecSimilarity(
        currentSignals,
        competitorSignals,
      );

      const hookScore = toFiniteNumber(item?.hook_score);
      const overallScoreRaw = toFiniteNumber(
        item?.overall_score_v2 ??
          item?.overallScoreV2 ??
          item?.overall_score ??
          item?.overallScore ??
          item?.spec_score_v2 ??
          item?.specScoreV2 ??
          item?.spec_score ??
          item?.specScore ??
          null,
      );
      const candidateScore = resolveCandidateScore(item);
      const overallScoreDisplay =
        resolveSmartphoneBadgeScore(item) ?? candidateScore;
      const competitionScore = Math.round(
        Math.min(
          98,
          Math.max(
            45,
            priceScore * 0.38 +
              (candidateScore != null ? candidateScore : 70) * 0.24 +
              specSimilarity * 0.22 +
              (sameBrand ? 100 : 55) * 0.07 +
              competitorSignals.ratingScore * 0.05 +
              competitorSignals.recencyScore * 0.04 +
              (hookScore != null ? hookScore : 0) * 0.02,
          ),
        ),
      );

      const reasonParts = buildCompetitorReasons({
        sameBrand,
        priceScore,
        specSimilarity,
        currentSignals,
        competitorSignals,
      });
      const commonFeatures = buildComparableSpecBullets({
        priceScore,
        specSimilarity,
        competitorSignals,
      });

      return {
        id: competitorId,
        name: item?.name || item?.model || "Competitor",
        brand_name: brand || null,
        image_url: item?.image_url || item?.images?.[0] || item?.image || null,
        best_store_name: bestStoreName || null,
        price,
        spec_score: toFiniteNumber(
          item?.spec_score_v2 ??
            item?.specScoreV2 ??
            item?.spec_score ??
            item?.specScore ??
            null,
        ),
        overall_score: overallScoreRaw,
        spec_score_v2: toFiniteNumber(
          item?.spec_score_v2 ?? item?.specScoreV2 ?? null,
        ),
        overall_score_v2: toFiniteNumber(
          item?.overall_score_v2 ?? item?.overallScoreV2 ?? null,
        ),
        spec_score_display: toFiniteNumber(
          item?.spec_score_v2_display_80_98 ??
            item?.spec_score_display ??
            item?.specScoreDisplay ??
            item?.specScoreV2Display8098 ??
            null,
        ),
        specScoreDisplay: toFiniteNumber(
          item?.spec_score_v2_display_80_98 ??
            item?.spec_score_display ??
            item?.specScoreDisplay ??
            item?.specScoreV2Display8098 ??
            null,
        ),
        spec_score_v2_display_80_98: toFiniteNumber(
          item?.spec_score_v2_display_80_98 ??
            item?.specScoreV2Display8098 ??
            null,
        ),
        specScoreV2Display8098: toFiniteNumber(
          item?.spec_score_v2_display_80_98 ??
            item?.specScoreV2Display8098 ??
            null,
        ),
        overall_score_v2_display_80_98: overallScoreDisplay,
        overallScoreV2Display8098: overallScoreDisplay,
        overall_score_display: overallScoreDisplay,
        overallScoreDisplay: overallScoreDisplay,
        competition_score: competitionScore,
        match_score: competitionScore,
        price_match_score: Math.round(priceScore),
        spec_match_score: Math.round(specSimilarity),
        reason: reasonParts.slice(0, 2).join(" | "),
        common_features:
          commonFeatures.length > 0
            ? commonFeatures
            : ["Relevant alternative in this segment"],
        advantages: [],
        disadvantages: [],
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      const matchDiff =
        (b.match_score ?? b.competition_score ?? 0) -
        (a.match_score ?? a.competition_score ?? 0);
      if (matchDiff !== 0) return matchDiff;
      const scoreDiff =
        (b.overall_score_display ?? b.spec_score_display ?? 0) -
        (a.overall_score_display ?? a.spec_score_display ?? 0);
      if (scoreDiff !== 0) return scoreDiff;
      return (a.price ?? Number.MAX_SAFE_INTEGER) -
        (b.price ?? Number.MAX_SAFE_INTEGER);
    });
};

const buildInsights = (competitor) => {
  const advantages = normalizeList(competitor?.advantages)
    .map((text) => ({
      text: humanizeComparisonText(text),
      type: "advantage",
    }))
    .filter((item) => item.text);
  const disadvantages = normalizeList(competitor?.disadvantages)
    .map((text) => ({
      text: humanizeComparisonText(text),
      type: "disadvantage",
    }))
    .filter((item) => item.text);
  const common = normalizeList(competitor?.common_features)
    .map((text) => ({
      text: humanizeComparisonText(text),
      type: "common",
    }))
    .filter((item) => item.text);
  const merged = [...advantages, ...disadvantages, ...common];
  if (merged.length > 0) return merged;
  return [
    {
      type: "common",
      text:
        formatMatchSummary(competitor) ||
        "Strong alternative in similar price and performance segment.",
    },
  ];
};

const buildExtendedInsights = (competitor) => {
  const base = buildInsights(competitor);
  const extras = [];

  const compareCount = toFiniteNumber(competitor?.compare_count);
  if (compareCount != null && compareCount > 0) {
    extras.push({
      type: "common",
      text: `Users compared this ${Math.round(compareCount)} times recently`,
    });
  }

  const all = [...base, ...extras];
  const seen = new Set();
  const unique = [];
  for (const item of all) {
    const key = `${item.type}|${item.text}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
  }

  // Keep show more meaningful on every card.
  const filler = [
    { type: "common", text: "Balanced pick in this segment" },
    { type: "common", text: "Useful side-by-side comparison" },
  ];
  while (unique.length < 4 && filler.length > 0) {
    unique.push(filler.shift());
  }

  return unique;
};

const insightMeta = (type) => {
  if (type === "advantage") {
    return {
      Icon: FaThumbsUp,
      iconClass: "text-emerald-500",
    };
  }

  if (type === "disadvantage") {
    return {
      Icon: FaThumbsDown,
      iconClass: "text-rose-500",
    };
  }

  return {
    Icon: FaCheckCircle,
    iconClass: "text-blue-500",
  };
};

const CompetitorCard = ({
  competitor,
  baseProductName,
  productLabel = "Device",
  expanded = false,
  productPath = "",
  comparePath = "",
  onExpandAll,
  onCollapseSelf,
  onCompare,
  compareDisabled = false,
}) => {
  const insights = useMemo(
    () => buildExtendedInsights(competitor),
    [competitor],
  );
  const visibleInsights = useMemo(
    () => (expanded ? insights : insights.slice(0, 5)),
    [expanded, insights],
  );
  const insightGroups = useMemo(() => {
    const groups = {
      advantage: [],
      disadvantage: [],
      common: [],
    };
    for (const item of visibleInsights) {
      if (item?.type === "advantage") groups.advantage.push(item);
      else if (item?.type === "disadvantage") groups.disadvantage.push(item);
      else groups.common.push(item);
    }
    return groups;
  }, [visibleInsights]);
  const orderedInsights = useMemo(
    () => [
      ...insightGroups.common,
      ...insightGroups.advantage,
      ...insightGroups.disadvantage,
    ],
    [insightGroups],
  );
  const displayName = formatCompetitorName(competitor?.name);
  const displayScore =
    resolveCandidateScore(competitor) ??
    toFiniteNumber(competitor?.competition_score);
  const descriptor =
    normalizeText(competitor?.reason).replace(/\s*\|\s*/g, " • ") ||
    "Close match in similar price and performance segment.";
  const buyFrom =
    competitor?.best_store_name || competitor?.brand_name || "Hooks";
  const matchSummary = formatMatchSummary(competitor);
  const cardProductPath =
    productPath || createProductPath("/smartphones", displayName);
  const compareLabel = `Compare ${baseProductName || "this device"} vs ${displayName}`;

  return (
    <article className="group relative w-[84vw] max-w-[320px] shrink-0 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_2px_2px_rgba(0,0,0,0.1)] transition-colors duration-200 hover:border-blue-200 sm:w-[292px]">
      <div className="flex h-full flex-col">
        <div className="p-4 pb-3">
          <div className="flex items-center justify-between gap-2">
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-600">
              Recommended Pick
            </span>
            {displayScore != null ? (
              <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                {Math.round(displayScore)}% match
              </span>
            ) : null}
          </div>
          <div className="mt-4 flex items-center gap-3">
            <Link
              to={cardProductPath}
              aria-label={`View ${displayName} specs, price, and details`}
              className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-b from-blue-50/70 to-white p-1.5 transition hover:border-blue-200"
            >
              {competitor?.image_url ? (
                <img
                  src={competitor.image_url}
                  alt={displayName}
                  className="h-full w-full object-contain"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              ) : null}
            </Link>
            <div className="min-w-0 flex-1">
              <h3 className="space-grotesk-title line-clamp-2 text-[14px] leading-tight text-slate-900 sm:text-[15px]">
                <Link
                  to={cardProductPath}
                  className="transition hover:text-blue-600"
                >
                  {displayName}
                </Link>
              </h3>
              <p className="mt-1 text-[12px] leading-snug text-slate-600">
                By{" "}
                <span className="font-semibold text-slate-900">{buyFrom}</span>
              </p>
              <p className="mt-2 inline-flex items-center rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[13px] font-semibold text-emerald-600">
                {formatPrice(competitor?.price)}
              </p>
            </div>
          </div>
          <p className="mt-3 line-clamp-2 text-[12px] leading-snug text-slate-500">
            {matchSummary}
          </p>
        </div>

        <div className="border-t border-slate-100 p-4 pt-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-blue-600">
              Why It Matches
            </p>
          </div>

          <ul className="space-y-1.5 rounded-2xl bg-slate-50 px-3 py-3">
            {orderedInsights.map((item, index) => {
              const meta = insightMeta(item.type);
              return (
                <li
                  key={`insight-${index}`}
                  className="grid grid-cols-[14px_minmax(0,1fr)] items-start gap-2 py-1 first:pt-0 last:pb-0"
                >
                  <meta.Icon
                    className={`mt-0.5 text-[12px] ${meta.iconClass}`}
                  />
                  <span className="text-[12px] leading-snug text-slate-600">
                    {item.text}
                  </span>
                </li>
              );
            })}
          </ul>

          <button
            type="button"
            onClick={() => {
              if (expanded) onCollapseSelf?.(competitor?.id);
              else onExpandAll?.();
            }}
            className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-blue-600 transition hover:text-blue-700"
          >
            {expanded ? "Show less" : "Show more"}
            <FaChevronRight
              className={`text-[10px] transition-transform ${expanded ? "-rotate-90" : "rotate-90"}`}
            />
          </button>
        </div>

        <div className="mt-auto border-t border-slate-100 bg-white">
          <div className="border-b border-slate-100 bg-blue-50/80 px-4 py-3">
            <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
              <div className="min-w-0">
                <p className="text-[9px] font-semibold uppercase tracking-[0.26em] text-slate-400">
                  This device
                </p>
                <p className="truncate text-[12px] font-semibold text-slate-700">
                  {baseProductName || `This ${productLabel}`}
                </p>
              </div>
              <div className="relative flex h-9 w-9 items-center justify-center sm:h-10 sm:w-10 ">
                <span className="absolute inset-0 opacity-10" />
                <span className="absolute inset-[5px] " />
                <span className="relative space-grotesk-title text-[12px] font-semibold tracking-[0.3em] text-purple-700 animate-pulse reduced-motion:animate-none">
                  VS
                </span>
              </div>
              <div className="min-w-0 text-right">
                <p className="text-[9px] font-semibold uppercase tracking-[0.26em] text-slate-400">
                  Competitor
                </p>
                <p className="truncate text-[12px] font-semibold text-slate-700">
                  {displayName}
                </p>
              </div>
            </div>
          </div>
          <div className="px-3 py-4 sm:px-4">
            {comparePath && !compareDisabled ? (
              <Link
                to={comparePath}
                onClick={(event) => {
                  if (typeof onCompare !== "function") return;
                  event.preventDefault();
                  onCompare(competitor);
                }}
                aria-label={compareLabel}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-blue-600 bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 px-3 py-2.5 text-xs font-semibold text-white transition-colors hover:from-blue-700 hover:via-cyan-700 hover:to-blue-700"
              >
                <span>Compare Now</span>
                <span className="sr-only">{compareLabel}</span>
              </Link>
            ) : (
              <button
                type="button"
                disabled
                className="inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-100 px-3 py-2.5 text-xs font-semibold text-slate-400"
              >
                Compare Now
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};

const RecentLaunchesPanel = ({
  brandName = "",
  items = [],
  productBasePath = "/smartphones",
  onOpenProduct,
}) => {
  if (!Array.isArray(items) || items.length === 0) return null;

  return (
    <aside className="rounded-2xl border border-slate-200 bg-white p-4">
      <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.34em] text-blue-600">
        Recent Launches By {brandName || "This Brand"}
      </h4>
      <div className="space-y-2">
        {items.map((item, index) => {
          const key = String(item?.id ?? item?.name ?? `item-${index}`);
          const launch = formatLaunchDate(
            item?.launch_date || item?.launchDate,
          );
          const itemName = item?.name || "Device";
          const itemPath = createProductPath(productBasePath, itemName);
          return (
            <Link
              key={key}
              to={itemPath}
              onClick={(event) => {
                if (typeof onOpenProduct !== "function") return;
                event.preventDefault();
                onOpenProduct(item);
              }}
              aria-label={`View ${itemName} specs and price`}
              className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left text-[12px] font-medium text-slate-700 transition-colors hover:border-blue-200 hover:bg-blue-50/50"
            >
              <div className="min-w-0">
                <p className="truncate">{itemName}</p>
                {launch ? (
                  <p className="text-[11px] font-normal text-slate-500">
                    {launch}
                  </p>
                ) : null}
              </div>
              <FaChevronRight className="shrink-0 text-[10px] text-slate-500" />
            </Link>
          );
        })}
      </div>
    </aside>
  );
};

const CompetitorCards = ({
  productId,
  onCompare,
  fallbackCompetitors = [],
  recentLaunches = [],
  currentDevice = null,
  currentBrand = "",
  currentPrice = null,
  title = "",
  productName = "",
  maxCards = 6,
  recentLaunchesLimit = 3,
  showRecentLaunches = false,
  productBasePath = "/smartphones",
  productLabel = "Device",
  entityType = "smartphones",
  className = "",
  compareDisabled = false,
}) => {
  const navigate = useNavigate();
  const competitorsEndpoint = useMemo(
    () => buildCompetitorsEndpoint(productId, entityType),
    [entityType, productId],
  );
  const [payload, setPayload] = useState(() =>
    competitorsEndpoint ? readPreloadedApiResponse(competitorsEndpoint) : null,
  );
  const [loading, setLoading] = useState(
    () =>
      Boolean(competitorsEndpoint) &&
      !readPreloadedApiResponse(competitorsEndpoint),
  );
  const [error, setError] = useState("");
  const [expandAll, setExpandAll] = useState(false);
  const [collapsedMap, setCollapsedMap] = useState({});
  const railRef = useRef(null);
  const [railControls, setRailControls] = useState({
    canScrollLeft: false,
    canScrollRight: false,
  });

  useEffect(() => {
    if (!competitorsEndpoint) {
      setPayload(null);
      setLoading(false);
      return;
    }

    const preloadedPayload = readPreloadedApiResponse(competitorsEndpoint);
    if (preloadedPayload) {
      setPayload(preloadedPayload);
      setLoading(false);
      setError("");
      return;
    }

    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(competitorsEndpoint);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        if (!cancelled) {
          setPayload(data);
        }
      } catch {
        if (!cancelled) {
          setError("Unable to load competitor insights right now.");
          setPayload(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [competitorsEndpoint]);

  const competitors = useMemo(() => {
    const raw = Array.isArray(payload?.competitors) ? payload.competitors : [];
    const fromApi = raw.filter((row) => Number(row?.id) > 0);
    const fallbackRows = buildFallbackCompetitorRows({
      productId,
      fallbackCompetitors,
      currentDevice,
      currentBrand,
      currentPrice,
    });
    const limit = Number.isFinite(Number(maxCards))
      ? Math.max(1, Math.floor(Number(maxCards)))
      : 6;

    if (fromApi.length === 0) return fallbackRows;
    if (fromApi.length >= limit || fallbackRows.length === 0) return fromApi;

    const seen = new Set(
      fromApi
        .map((row) => Number(row?.id))
        .filter((id) => Number.isFinite(id) && id > 0),
    );
    const merged = [...fromApi];
    for (const row of fallbackRows) {
      const rid = Number(row?.id);
      if (Number.isFinite(rid) && rid > 0 && seen.has(rid)) continue;
      merged.push(row);
      if (Number.isFinite(rid) && rid > 0) seen.add(rid);
      if (merged.length >= limit) break;
    }
    return merged;
  }, [
    payload,
    productId,
    fallbackCompetitors,
    currentDevice,
    currentBrand,
    currentPrice,
    maxCards,
  ]);

  const limitedCompetitors = useMemo(() => {
    const limit = Number.isFinite(Number(maxCards))
      ? Math.max(1, Math.floor(Number(maxCards)))
      : 6;
    return competitors.slice(0, limit);
  }, [competitors, maxCards]);

  const recentLaunchRows = useMemo(() => {
    const source =
      Array.isArray(recentLaunches) && recentLaunches.length > 0
        ? recentLaunches
        : fallbackCompetitors;
    if (!Array.isArray(source) || source.length === 0) return [];

    const excludedIds = new Set(
      limitedCompetitors
        .map((item) => Number(item?.id))
        .filter((id) => Number.isInteger(id) && id > 0),
    );
    const currentId = Number(productId);
    if (Number.isInteger(currentId) && currentId > 0) {
      excludedIds.add(currentId);
    }

    const normalized = source
      .map((item) => ({
        id: Number(item?.id ?? item?.product_id ?? item?.productId) || null,
        name: String(item?.name || item?.model || "").trim(),
        brand: String(item?.brand || item?.brand_name || "").trim(),
        launch_date: item?.launch_date || item?.launchDate || null,
      }))
      .filter((item) => item.name && !excludedIds.has(Number(item.id)));

    if (normalized.length === 0) return [];

    const currentBrandText = String(currentBrand || "")
      .trim()
      .toLowerCase();
    const sameBrand = normalized.filter((item) =>
      currentBrandText ? item.brand.toLowerCase() === currentBrandText : true,
    );
    const base = sameBrand.length > 0 ? sameBrand : normalized;

    const seen = new Set();
    const unique = [];
    for (const item of base) {
      const key = item.id ? `id:${item.id}` : `name:${item.name.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(item);
    }

    unique.sort((a, b) => {
      const ta = parseTimeValue(a.launch_date) ?? 0;
      const tb = parseTimeValue(b.launch_date) ?? 0;
      if (tb !== ta) return tb - ta;
      return a.name.localeCompare(b.name);
    });

    const limit = Number.isFinite(Number(recentLaunchesLimit))
      ? Math.max(1, Math.floor(Number(recentLaunchesLimit)))
      : 3;
    return unique.slice(0, limit);
  }, [
    recentLaunches,
    fallbackCompetitors,
    limitedCompetitors,
    currentBrand,
    productId,
    recentLaunchesLimit,
  ]);
  const hasRecentLaunches = showRecentLaunches && recentLaunchRows.length > 0;

  useEffect(() => {
    setExpandAll(false);
    setCollapsedMap({});
  }, [productId, limitedCompetitors.length]);

  useEffect(() => {
    const updateRailControls = () => {
      const node = railRef.current;
      if (!node) {
        setRailControls({
          canScrollLeft: false,
          canScrollRight: false,
        });
        return;
      }

      const maxScrollLeft = Math.max(0, node.scrollWidth - node.clientWidth);
      const threshold = 4;

      setRailControls({
        canScrollLeft: node.scrollLeft > threshold,
        canScrollRight: maxScrollLeft - node.scrollLeft > threshold,
      });
    };

    const node = railRef.current;
    if (!node) {
      setRailControls({
        canScrollLeft: false,
        canScrollRight: false,
      });
      return undefined;
    }

    const frameId = window.requestAnimationFrame(updateRailControls);
    const handleResize = () => updateRailControls();

    node.addEventListener("scroll", updateRailControls, { passive: true });
    window.addEventListener("resize", handleResize);

    return () => {
      window.cancelAnimationFrame(frameId);
      node.removeEventListener("scroll", updateRailControls);
      window.removeEventListener("resize", handleResize);
    };
  }, [limitedCompetitors.length, hasRecentLaunches]);

  const handleCompare = (competitor) => {
    if (compareDisabled) return;
    const competitorId = Number(competitor?.id);
    const pid = Number(productId);
    if (!Number.isInteger(competitorId) || competitorId <= 0) return;
    if (typeof onCompare === "function") {
      onCompare(competitor);
      return;
    }
    if (Number.isInteger(pid) && pid > 0) {
      navigate(
        buildCanonicalComparePath({
          leftName: productName,
          rightName: competitor?.name || competitor?.model,
          leftId: pid,
          rightId: competitorId,
          type: entityType === "smartphones" ? "smartphone" : entityType,
        }),
      );
    }
  };

  const handleOpenRecentProduct = (item) => {
    const id = Number(item?.id);
    const slug = toSlug(item?.name);
    const basePath = String(productBasePath || "/smartphones").replace(
      /\/$/,
      "",
    );
    if (slug) {
      navigate(createProductPath(basePath, slug));
      return;
    }
    navigate(basePath);
  };

  const handleExpandAll = () => {
    setExpandAll(true);
    setCollapsedMap({});
  };

  const handleCollapseSingle = (competitorId) => {
    const key = String(competitorId || "");
    if (!key) return;
    setExpandAll(true);
    setCollapsedMap((prev) => ({
      ...prev,
      [key]: true,
    }));
  };

  const scrollRail = (direction) => {
    const node = railRef.current;
    if (!node) return;

    const step = Math.max(node.clientWidth * 0.82, 260);
    node.scrollBy({
      left: direction * step,
      behavior: "smooth",
    });
  };

  if (loading && limitedCompetitors.length === 0) {
    return (
      <div className="w-full border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        Loading competitor insights...
      </div>
    );
  }

  if (error && limitedCompetitors.length === 0) {
    return (
      <div className="w-full border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
        {error}
      </div>
    );
  }

  if (limitedCompetitors.length === 0) {
    return (
      <div className="w-full border border-slate-200 bg-white p-4 text-sm text-slate-600">
        Competitor insights are being prepared for this device.
      </div>
    );
  }

  const heading = title || `Competitors For ${productName || "This Device"}`;
  const headingParts = (() => {
    const text = String(heading || "").trim();
    if (!text) return { prefix: "Competitors For", highlight: "This Device" };

    const match = text.match(/^(.*?\bfor\b)\s+(.+)$/i);
    if (match) {
      return {
        prefix: match[1],
        highlight: match[2],
      };
    }
    return { prefix: text, highlight: "" };
  })();
  const showRailControls =
    railControls.canScrollLeft || railControls.canScrollRight;

  return (
    <div className={`w-full p-3 sm:p-4 font-sans ${className}`}>
      <div className=" px-4 py-4 sm:px-5 sm:py-5">
        <div className="mb-3 border-b border-slate-200/80 pb-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-blue-600">
            Recommended Comparisons
          </p>
          <h3 className="space-grotesk-title mt-2 text-lg tracking-tight text-slate-900 sm:text-2xl">
            {headingParts.prefix}{" "}
            {headingParts.highlight ? (
              <span className="text-blue-600">{headingParts.highlight}</span>
            ) : null}
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Compare close alternatives by price, specs, and practical
            differences.
          </p>
        </div>

        {error ? (
          <div className="mb-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">
            Showing fallback competitors while live competitor insights are
            syncing.
          </div>
        ) : null}

        <div
          className={`grid gap-3 ${
            hasRecentLaunches ? "lg:grid-cols-[minmax(0,1fr)_220px]" : ""
          }`}
        >
          <div className="min-w-0">
            {showRailControls ? (
              <div className="mb-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => scrollRail(-1)}
                  disabled={!railControls.canScrollLeft}
                  aria-label="Scroll competitors left"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors hover:border-blue-200 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-500"
                >
                  <FaChevronRight className="rotate-180 text-sm" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollRail(1)}
                  disabled={!railControls.canScrollRight}
                  aria-label="Scroll competitors right"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors hover:border-blue-200 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-500"
                >
                  <FaChevronRight className="text-sm" />
                </button>
              </div>
            ) : null}
            <div
              ref={railRef}
              className="no-scrollbar flex gap-3 overflow-x-auto pb-1 scroll-smooth"
            >
              {limitedCompetitors.map((competitor) => {
                const competitorId = Number(competitor?.id);
                const currentId = Number(productId);
                const competitorName =
                  competitor?.name || competitor?.model || "Competitor";
                const productPath = createProductPath(
                  productBasePath,
                  competitorName,
                );
                const comparePath =
                  Number.isInteger(currentId) &&
                  currentId > 0 &&
                  Number.isInteger(competitorId) &&
                  competitorId > 0
                    ? buildCanonicalComparePath({
                        leftName: productName,
                        rightName: competitorName,
                        leftId: currentId,
                        rightId: competitorId,
                        type:
                          entityType === "smartphones"
                            ? "smartphone"
                            : entityType,
                      })
                    : "";

                return (
                  <CompetitorCard
                    key={String(competitor.id)}
                    competitor={competitor}
                    baseProductName={productName}
                    productLabel={productLabel}
                    productPath={productPath}
                    comparePath={comparePath}
                    expanded={expandAll && !collapsedMap[String(competitor.id)]}
                    onExpandAll={handleExpandAll}
                    onCollapseSelf={handleCollapseSingle}
                    onCompare={handleCompare}
                    compareDisabled={compareDisabled}
                  />
                );
              })}
            </div>
          </div>
          {hasRecentLaunches ? (
            <RecentLaunchesPanel
              brandName={currentBrand}
              items={recentLaunchRows}
              productBasePath={productBasePath}
              onOpenProduct={handleOpenRecentProduct}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default CompetitorCards;
