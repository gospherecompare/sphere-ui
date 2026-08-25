const SITE_NAME = "MobileX";
export const SMARTPHONE_FEATURE_TITLE_MAP = {
  "high mp camera": "Camera Phones",
  "long battery": "Battery Phones",
  gaming: "Gaming Phones",
  amoled: "AMOLED Display Phones",
  "5g": "5G Smartphones",
  nfc: "Smartphones with NFC",
  "high-refresh-rate": "High Refresh Rate Phones",
  "fast-charge": "Fast Charging Phones",
};

export const getSmartphoneFeatureTitle = (feature = "") => {
  const normalized = String(feature || "").trim().toLowerCase();
  return SMARTPHONE_FEATURE_TITLE_MAP[normalized] || `${feature} Smartphones`;
};

const BRAND_DUPLICATE_RE = /(?:\s*[|–—-]\s*MobileX){2,}$/i;

/**
 * Keep page titles readable and descriptive without stripping useful punctuation.
 * Google may rewrite titles, so this helper focuses on clarity rather than a
 * brittle character-count rule.
 */
export const normalizeSeoTitle = (value = "") => {
  const text = String(value || "")
    .replace(/[\u2013\u2014]/g, "–")
    .replace(/\s*[|]\s*/g, " | ")
    .replace(/\s+[–-]\s+/g, " – ")
    .replace(/\s+/g, " ")
    .replace(BRAND_DUPLICATE_RE, ` | ${SITE_NAME}`)
    .trim();

  return text || `${SITE_NAME} – Compare tech with clarity`;
};
