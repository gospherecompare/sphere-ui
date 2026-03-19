import { normalizeScore100Value } from "./groupScoreStats";

const resolveFirstScore = (...values) => {
  for (const value of values) {
    const normalized = normalizeScore100Value(value);
    if (normalized != null) return normalized;
  }
  return null;
};

export const resolveSmartphoneBadgeScore = (device) => {
  if (!device || typeof device !== "object") return null;

  const displayScore = resolveFirstScore(
    device?.spec_score_v2_display_80_98,
    device?.specScoreV2Display8098,
    device?.overall_score_v2_display_80_98,
    device?.overallScoreV2Display8098,
    device?.spec_score_display,
    device?.specScoreDisplay,
    device?.overall_score_display,
    device?.overallScoreDisplay,
  );
  if (displayScore != null) return displayScore;

  return resolveFirstScore(
    device?.spec_score_v2,
    device?.specScoreV2,
    device?.overall_score_v2,
    device?.overallScoreV2,
    device?.spec_score,
    device?.specScore,
    device?.overall_score,
    device?.overallScore,
  );
};

export default resolveSmartphoneBadgeScore;
