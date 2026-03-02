export const normalizeScore100Value = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  if (n <= 1) return Math.max(0, Math.min(100, n * 100));
  if (n <= 10) return Math.max(0, Math.min(100, n * 10));
  return Math.max(0, Math.min(100, n));
};

export const normalizeGroupKey = (value, fallback = "all") => {
  const text = String(value ?? fallback).trim().toLowerCase();
  return text || fallback;
};

export const remapScoreToBand = (value, minScore = 80, maxScore = 98) => {
  const normalized = normalizeScore100Value(value);
  if (normalized == null) return null;
  const min = Number.isFinite(minScore) ? minScore : 80;
  const max = Number.isFinite(maxScore) ? maxScore : 98;
  const clampedMin = Math.max(0, Math.min(100, min));
  const clampedMax = Math.max(clampedMin, Math.min(100, max));
  const ratio = normalized / 100;
  const scaled = clampedMin + ratio * (clampedMax - clampedMin);
  return Number(scaled.toFixed(1));
};

export const computeGroupScoreSnapshot = ({
  currentScore,
  peerScores = [],
  minScore = 80,
  maxScore = 98,
}) => {
  const normalizedCurrent = normalizeScore100Value(currentScore);
  const normalizedPeers = Array.isArray(peerScores)
    ? peerScores
        .map((score) => normalizeScore100Value(score))
        .filter((score) => Number.isFinite(score))
    : [];

  const pool = [
    ...(normalizedCurrent != null ? [normalizedCurrent] : []),
    ...normalizedPeers,
  ];
  const average =
    pool.length > 0 ? pool.reduce((sum, score) => sum + score, 0) / pool.length : null;
  const best = pool.length > 0 ? Math.max(...pool) : null;

  return {
    current: remapScoreToBand(normalizedCurrent, minScore, maxScore),
    average: remapScoreToBand(average, minScore, maxScore),
    best: remapScoreToBand(best, minScore, maxScore),
    sampleSize: pool.length,
  };
};
