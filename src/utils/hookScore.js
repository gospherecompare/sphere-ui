const toNumber = (v) => {
  if (v == null || v === "") return null;
  const n = Number(String(v).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : null;
};

export function getHookScoreLabel(hookScore) {
  const score = toNumber(hookScore);
  if (score == null) return null;
  if (score >= 80) return "Very High Buyer Interest";
  if (score >= 60) return "Strong Buying Interest";
  if (score >= 40) return "Moderate Interest";
  return "Low Activity";
}

export function getHookBadge(device) {
  const hookScore = toNumber(device?.hook_score ?? device?.hookScore);
  const buyerIntent = toNumber(device?.buyer_intent ?? device?.buyerIntent);
  const trendVelocity = toNumber(
    device?.trend_velocity ?? device?.trendVelocity,
  );
  const freshness = toNumber(device?.freshness);

  // Prefer a specific "reason" badge over a generic score label.
  if (freshness >= 100) {
    return {
      key: "fresh",
      label: "New Launch",
      className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
      title: "Recently launched",
    };
  }

  if (trendVelocity != null && trendVelocity >= 70) {
    return {
      key: "trend",
      label: "Fast Rising",
      className: "bg-orange-50 text-orange-700 ring-orange-200",
      title: "Rising quickly this week",
    };
  }

  if (buyerIntent != null && buyerIntent >= 70) {
    return {
      key: "intent",
      label: "High Buyer Interest",
      className: "bg-rose-50 text-rose-700 ring-rose-200",
      title: "High buying signals",
    };
  }

  if (hookScore != null && hookScore >= 60) {
    return {
      key: "score",
      label: getHookScoreLabel(hookScore),
      className: "bg-sky-50 text-sky-700 ring-sky-200",
      title: "Based on buyer intent, trend velocity, and freshness",
    };
  }

  return null;
}

