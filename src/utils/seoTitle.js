const SITE_NAME = "Hooks";
const BRAND_DUPLICATE_RE = /(?:\s*[|–—-]\s*Hooks){2,}$/i;

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
