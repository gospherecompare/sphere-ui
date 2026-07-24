const WINDOW_PAYLOAD_KEY = "__HOOKS_PRERENDER_DATA__";

const trimTrailingSlash = (value = "") => {
  const text = String(value || "");
  if (text.length > 1 && text.endsWith("/")) return text.slice(0, -1);
  return text;
};

export const getPreloadedApiMap = () => {
  if (typeof window === "undefined") return null;
  const payload = window[WINDOW_PAYLOAD_KEY];
  const byUrl =
    payload && typeof payload === "object" && payload.byUrl
      ? payload.byUrl
      : null;
  return byUrl && typeof byUrl === "object" ? byUrl : null;
};

const buildCandidateKeys = (input) => {
  if (typeof window === "undefined" || !input) return [];

  let parsed;
  try {
    parsed = new URL(String(input), window.location.origin);
  } catch {
    return [];
  }

  const keys = [
    `${parsed.origin}${parsed.pathname}${parsed.search}`,
    `${window.location.origin}${parsed.pathname}${parsed.search}`,
    `${parsed.pathname}${parsed.search}`,
    `${parsed.origin}${parsed.pathname}`,
    `${window.location.origin}${parsed.pathname}`,
    parsed.pathname,
  ]
    .map((value) => trimTrailingSlash(value))
    .filter(Boolean);

  return [...new Set(keys)];
};

export const readPreloadedApiResponse = (input) => {
  const byUrl = getPreloadedApiMap();
  if (!byUrl) return null;

  const matchedKey = buildCandidateKeys(input).find((key) =>
    Object.prototype.hasOwnProperty.call(byUrl, key),
  );

  return matchedKey ? byUrl[matchedKey] : null;
};

export const hasPreloadedApiResponse = (input) =>
  readPreloadedApiResponse(input) !== null;

export default readPreloadedApiResponse;
