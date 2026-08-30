import { normalizeScore100Value } from "./groupScoreStats";

export const roundSpecScoreDisplay = (value) => {
  const normalized = normalizeScore100Value(value);
  if (normalized == null) return null;
  return Math.round(normalized);
};

export const resolveSmartphoneBadgeScore = (device) => {
  if (!device || typeof device !== "object") return null;

  const directValue = device.spec_score ?? device.specScore ?? null;

  if (directValue == null || directValue === "") return null;

  const numeric = Number(directValue);
  if (!Number.isFinite(numeric)) return null;

  return normalizeScore100Value(numeric);
};

export const formatSmartphoneBadgeScore = (value) => {
  const rounded = roundSpecScoreDisplay(value);
  return rounded == null ? null : String(rounded);
};

export default resolveSmartphoneBadgeScore;
