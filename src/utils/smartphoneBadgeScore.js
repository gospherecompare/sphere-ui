import { normalizeScore100Value } from "./groupScoreStats";

const resolveFirstScore = (...values) => {
  for (const value of values) {
    if (value == null || value === "") continue;
    const normalized = normalizeScore100Value(value);
    if (normalized != null) return normalized;
  }
  return null;
};

const resolveServerScore = (value, source) => {
  if (value == null || value === "") return null;
  const normalized = normalizeScore100Value(value);
  if (normalized == null) return null;

  const sourceKey = String(source || "")
    .trim()
    .toLowerCase();
  if (sourceKey.includes("fallback") || sourceKey.includes("unavailable")) {
    return null;
  }

  return normalized;
};

export const resolveSmartphoneBadgeScore = (device) => {
  if (!device || typeof device !== "object") return null;

  const specSource = device?.spec_score_source ?? device?.specScoreSource;
  const hookSource = device?.hook_score_source ?? device?.hookScoreSource;

  return resolveFirstScore(
    resolveServerScore(device?.spec_score, specSource),
    resolveServerScore(device?.specScore, specSource),
    resolveServerScore(device?.hook_score, hookSource),
    resolveServerScore(device?.hookScore, hookSource),
    resolveServerScore(device?.Hookss_score, hookSource),
    resolveServerScore(device?.HookssScore, hookSource),
  );
};

export const formatSmartphoneBadgeScore = (value) => {
  const normalized = normalizeScore100Value(value);
  if (normalized == null) return null;

  return String(Math.round(normalized));
};

export default resolveSmartphoneBadgeScore;
