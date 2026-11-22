const toValidSamples = (samples = []) =>
  samples
    .map(Number)
    .filter((value) => Number.isFinite(value) && value >= 0);

export const calculateMbps = (bytes, durationMs) => {
  const transferredBytes = Number(bytes);
  const elapsedMs = Number(durationMs);
  if (
    !Number.isFinite(transferredBytes) ||
    transferredBytes <= 0 ||
    !Number.isFinite(elapsedMs) ||
    elapsedMs <= 0
  ) {
    return 0;
  }

  return (transferredBytes * 8) / elapsedMs / 1000;
};

export const calculateMedian = (samples = []) => {
  const values = toValidSamples(samples).sort((left, right) => left - right);
  if (!values.length) return null;

  const middle = Math.floor(values.length / 2);
  return values.length % 2 === 0
    ? (values[middle - 1] + values[middle]) / 2
    : values[middle];
};

export const calculateAverage = (samples = []) => {
  const values = toValidSamples(samples);
  if (!values.length) return null;
  return values.reduce((total, value) => total + value, 0) / values.length;
};

export const calculateJitter = (samples = []) => {
  const values = toValidSamples(samples);
  if (values.length < 2) return null;

  let totalDifference = 0;
  for (let index = 1; index < values.length; index += 1) {
    totalDifference += Math.abs(values[index] - values[index - 1]);
  }

  return totalDifference / (values.length - 1);
};

export const calculatePacketLossPercent = (failedProbes, totalProbes) => {
  const total = Number(totalProbes);
  const failed = Number(failedProbes);
  if (!Number.isFinite(total) || total <= 0 || !Number.isFinite(failed)) {
    return null;
  }

  return (Math.min(total, Math.max(0, failed)) / total) * 100;
};
