import { normalizeScore100Value } from "./groupScoreStats";

const resolveFirstScore = (...values) => {
  for (const value of values) {
    if (value == null || value === "") continue;
    const normalized = normalizeScore100Value(value);
    if (normalized != null) return normalized;
  }
  return null;
};

const resolveServerScore = (value, source, options = {}) => {
  if (value == null || value === "") return null;
  const normalized = normalizeScore100Value(value);
  if (normalized == null) return null;

  const { requireSource = false } = options;
  const sourceKey = String(source || "")
    .trim()
    .toLowerCase();
  if (requireSource && !sourceKey) {
    return null;
  }
  if (sourceKey.includes("fallback") || sourceKey.includes("unavailable")) {
    return null;
  }

  return normalized;
};

export const resolveSmartphoneBadgeScore = (device) => {
  if (!device || typeof device !== "object") return null;

  const specSource = device?.spec_score_source ?? device?.specScoreSource;
  return resolveFirstScore(
    resolveServerScore(device?.spec_score, specSource),
    resolveServerScore(device?.specScore, specSource),
  );
};

export const formatSmartphoneBadgeScore = (value) => {
  const normalized = normalizeScore100Value(value);
  if (normalized == null) return null;

  return String(Math.round(normalized));
};

export default resolveSmartphoneBadgeScore;
