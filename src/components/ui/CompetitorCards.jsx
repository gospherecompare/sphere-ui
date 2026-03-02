import React, { useEffect, useMemo, useState } from "react";
import {
  FaArrowDown,
  FaArrowUp,
  FaCheck,
  FaChevronRight,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL || "https://api.apisphere.in"
).replace(/\/$/, "");

const formatPrice = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return "Price unavailable";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
};

const normalizeList = (value) =>
  Array.isArray(value)
    ? value.map((item) => String(item || "").trim()).filter(Boolean)
    : [];

const normalizeText = (value) => String(value || "").trim();

const toFiniteNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const normalizeScore100 = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  if (n <= 1) return Math.max(0, Math.min(100, n * 100));
  if (n <= 10) return Math.max(0, Math.min(100, n * 10));
  return Math.max(0, Math.min(100, n));
};

const mapScoreToDisplayBand = (score, minTarget = 80, maxTarget = 98) => {
  const normalized = normalizeScore100(score);
  if (normalized == null) return null;
  const mapped = minTarget + (normalized / 100) * (maxTarget - minTarget);
  return Number(mapped.toFixed(1));
};

const resolveLowestPrice = (device) => {
  if (!device || typeof device !== "object") return null;
  const direct = toFiniteNumber(device.price ?? device.base_price);
  const variants = Array.isArray(device.variants) ? device.variants : [];
  const variantMin = variants.reduce((min, variant) => {
    const candidate = toFiniteNumber(
      variant?.base_price ?? variant?.price ?? variant?.basePrice,
    );
    if (candidate == null) return min;
    if (min == null) return candidate;
    return Math.min(min, candidate);
  }, null);
  if (direct != null && variantMin != null) return Math.min(direct, variantMin);
  return variantMin != null ? variantMin : direct;
};

const resolveBestStoreName = (device) => {
  if (!device || typeof device !== "object") return null;
  if (device.best_store_name) return String(device.best_store_name);

  const variants = Array.isArray(device.variants) ? device.variants : [];
  let best = null;
  for (const variant of variants) {
    const stores = Array.isArray(variant?.store_prices)
      ? variant.store_prices
      : [];
    for (const store of stores) {
      const price = toFiniteNumber(store?.price);
      if (price == null) continue;
      if (!best || price < best.price) {
        best = {
          price,
          name: store?.store_name || store?.store || null,
        };
      }
    }
  }
  return best?.name ? String(best.name) : null;
};

const toSlug = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const parseTimeValue = (value) => {
  if (!value) return null;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : null;
};

const formatLaunchDate = (value) => {
  const ts = parseTimeValue(value);
  if (ts == null) return "";
  try {
    return new Date(ts).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
};

const formatCompetitorName = (value) => {
  const raw = String(value || "")
    .replace(/\s+/g, " ")
    .trim();
  if (!raw) return "Competitor";

  const fixes = [
    ["iqoo", "iQOO"],
    ["oneplus", "OnePlus"],
    ["oppo", "OPPO"],
    ["vivo", "vivo"],
    ["realme", "realme"],
    ["redmi", "Redmi"],
    ["xiaomi", "Xiaomi"],
    ["motorola", "Motorola"],
    ["google", "Google"],
    ["infinix", "Infinix"],
  ];

  let out = raw;
  for (const [pattern, replacement] of fixes) {
    out = out.replace(new RegExp(`\\b${pattern}\\b`, "ig"), replacement);
  }
  return out;
};

const buildFallbackCompetitorRows = ({
  productId,
  fallbackCompetitors,
  currentBrand,
  currentPrice,
}) => {
  const list = Array.isArray(fallbackCompetitors) ? fallbackCompetitors : [];
  const currentId = Number(productId);

  return list
    .map((item) => {
      const competitorId = Number(
        item?.id ?? item?.product_id ?? item?.productId,
      );
      if (!Number.isInteger(competitorId) || competitorId <= 0) return null;
      if (Number.isInteger(currentId) && competitorId === currentId)
        return null;

      const brand = String(item?.brand || item?.brand_name || "").trim();
      const price = resolveLowestPrice(item);
      const bestStoreName = resolveBestStoreName(item);
      const sameBrand =
        currentBrand && brand
          ? currentBrand.toLowerCase() === brand.toLowerCase()
          : false;

      let priceScore = 60;
      if (currentPrice != null && price != null && currentPrice > 0) {
        const diff = Math.abs(price - currentPrice);
        const tolerance = Math.max(currentPrice * 0.35, 7000);
        priceScore = Math.max(20, 100 - (diff / tolerance) * 100);
      }

      const hookScore = toFiniteNumber(item?.hook_score);
      const overallScoreRaw = toFiniteNumber(
        item?.overall_score_v2 ??
          item?.spec_score_v2 ??
          item?.overall_score ??
          item?.spec_score ??
          null,
      );
      const overallScoreDisplay =
        toFiniteNumber(
          item?.overall_score_display ??
            item?.overall_score_v2_display_80_98 ??
            item?.spec_score_v2_display_80_98 ??
            null,
        ) ?? mapScoreToDisplayBand(overallScoreRaw);
      const competitionScore = Math.round(
        Math.min(
          95,
          Math.max(
            45,
            priceScore * 0.65 +
              (hookScore != null ? hookScore : 65) * 0.25 +
              (sameBrand ? 10 : 0),
          ),
        ),
      );

      const reasonParts = [];
      if (sameBrand) reasonParts.push("Same brand alternative");
      if (currentPrice != null && price != null)
        reasonParts.push("Similar price range");
      reasonParts.push("Popular compare pick");

      return {
        id: competitorId,
        name: item?.name || item?.model || "Competitor",
        brand_name: brand || null,
        image_url: item?.image_url || item?.images?.[0] || item?.image || null,
        best_store_name: bestStoreName || null,
        price,
        spec_score: overallScoreRaw,
        overall_score: overallScoreRaw,
        spec_score_v2: overallScoreRaw,
        overall_score_v2: overallScoreRaw,
        spec_score_v2_display_80_98: overallScoreDisplay,
        overall_score_v2_display_80_98: overallScoreDisplay,
        overall_score_display: overallScoreDisplay,
        competition_score: competitionScore,
        reason: reasonParts.slice(0, 2).join(" | "),
        common_features: ["Comparable segment and demand"],
        advantages: [],
        disadvantages: [],
      };
    })
    .filter(Boolean);
};

const buildInsights = (competitor) => {
  const advantages = normalizeList(competitor?.advantages).map((text) => ({
    text,
    type: "advantage",
  }));
  const disadvantages = normalizeList(competitor?.disadvantages).map(
    (text) => ({
      text,
      type: "disadvantage",
    }),
  );
  const common = normalizeList(competitor?.common_features).map((text) => ({
    text,
    type: "common",
  }));
  const merged = [...advantages, ...disadvantages, ...common];
  if (merged.length > 0) return merged;
  return [
    {
      type: "common",
      text:
        competitor?.reason ||
        "Strong alternative in similar price and performance segment.",
    },
  ];
};

const buildExtendedInsights = (competitor) => {
  const base = buildInsights(competitor);
  const extras = [];

  const compareCount = toFiniteNumber(competitor?.compare_count);
  if (compareCount != null && compareCount > 0) {
    extras.push({
      type: "common",
      text: `Users compared this ${Math.round(compareCount)} times recently`,
    });
  }

  const all = [...base, ...extras];
  const seen = new Set();
  const unique = [];
  for (const item of all) {
    const key = `${item.type}|${item.text}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
  }

  // Keep show more meaningful on every card.
  const filler = [
    { type: "common", text: "Strong alternative in the same segment" },
    { type: "common", text: "Competitive option for side-by-side comparison" },
  ];
  while (unique.length < 4 && filler.length > 0) {
    unique.push(filler.shift());
  }

  return unique;
};

const insightMeta = (type) => {
  if (type === "advantage") {
    return {
      Icon: FaArrowUp,
      iconClass: "text-emerald-600",
    };
  }
  if (type === "disadvantage") {
    return {
      Icon: FaArrowDown,
      iconClass: "text-rose-600",
    };
  }
  return {
    Icon: FaCheck,
    iconClass: "text-slate-500",
  };
};

const SpecScoreBadge = ({ score }) => {
  const normalized = normalizeScore100(score);
  const value = normalized != null ? Number(normalized.toFixed(1)) : null;
  const label = value != null ? `${value.toFixed(1)}%` : "--";

  return (
    <div
      className="inline-flex flex-col rounded-sm border border-violet-200 bg-violet-50 px-1.5 py-1 text-violet-700"
      aria-label={value != null ? `Spec score ${value.toFixed(1)} percent` : "Spec score unavailable"}
    >
      <span className="text-[11px] font-extrabold leading-none">{label}</span>
      <span className="text-[8px] font-semibold leading-none mt-0.5">Spec</span>
      <span className="text-[8px] font-semibold leading-none">Score</span>
    </div>
  );
};

const CompetitorCard = ({
  competitor,
  baseProductName,
  expanded = false,
  onExpandAll,
  onCollapseSelf,
  onCompare,
}) => {
  const score = useMemo(() => {
    const directDisplay = toFiniteNumber(
      competitor?.overall_score_display ??
        competitor?.overall_score_v2_display_80_98 ??
        competitor?.spec_score_v2_display_80_98,
    );
    if (directDisplay != null) return directDisplay;

    const raw = toFiniteNumber(
      competitor?.overall_score_v2 ??
        competitor?.spec_score_v2 ??
        competitor?.overall_score ??
        competitor?.spec_score ??
        competitor?.competition_score,
    );
    return mapScoreToDisplayBand(raw) ?? 0;
  }, [competitor]);
  const insights = useMemo(
    () => buildExtendedInsights(competitor),
    [competitor],
  );
  const visibleInsights = useMemo(
    () => (expanded ? insights : insights.slice(0, 6)),
    [expanded, insights],
  );
  const insightGroups = useMemo(() => {
    const groups = {
      advantage: [],
      disadvantage: [],
      common: [],
    };
    for (const item of visibleInsights) {
      if (item?.type === "advantage") groups.advantage.push(item);
      else if (item?.type === "disadvantage") groups.disadvantage.push(item);
      else groups.common.push(item);
    }
    return groups;
  }, [visibleInsights]);
  const orderedInsights = useMemo(
    () => [
      ...insightGroups.disadvantage,
      ...insightGroups.advantage,
      ...insightGroups.common,
    ],
    [insightGroups],
  );
  const displayName = formatCompetitorName(competitor?.name);
  const descriptor =
    normalizeText(competitor?.reason).replace(/\s*\|\s*/g, " • ") ||
    "Close match in similar price and performance segment.";
  const buyFrom =
    competitor?.best_store_name || competitor?.brand_name || "Hook";

  return (
    <article className="group rounded-md relative min-w-[212px] max-w-[254px] border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition">
      <div className="absolute left-2 top-2 z-10">
        <SpecScoreBadge score={score} />
      </div>

      <div className="flex h-full flex-col">
        <div className="p-3 pb-2">
          <div className="mx-auto mt-1 h-24 w-24 overflow-hidden rounded-lg  bg-slate-100 p-1">
            {competitor?.image_url ? (
              <img
                src={competitor.image_url}
                alt={displayName}
                className="h-full w-full object-contain"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            ) : null}
          </div>
          <h3 className="mt-3  line-clamp-2 text-[14px] font-semibold leading-tight text-slate-900">
            {displayName}
          </h3>
          <p className="mt-1 text-[12px] text-slate-500">
            Vist the{" "}
            <span className="font-semibold text-violet-700">{buyFrom}</span>
          </p>
          <p className=" text-[16px] font-extrabold text-green-600">
            {formatPrice(competitor?.price)}
          </p>
          <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-slate-500">
            {descriptor}
          </p>
        </div>

        <div className="border-t border-slate-200 bg-white p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Quick Comparison
            </p>
            <span className="text-[10px] font-medium text-slate-400">
              {insights.length} points
            </span>
          </div>

          <ul className="space-y-1.5">
            {orderedInsights.map((item, index) => {
              const meta = insightMeta(item.type);
              return (
                <li
                  key={`insight-${index}`}
                  className="flex items-start gap-2 px-1 py-1"
                >
                  <meta.Icon
                    className={`mt-0.5 shrink-0 text-[10px] ${meta.iconClass}`}
                  />
                  <span className="text-[12px] leading-snug text-slate-700">
                    {item.text}
                  </span>
                </li>
              );
            })}
          </ul>

          <button
            type="button"
            onClick={() => {
              if (expanded) onCollapseSelf?.(competitor?.id);
              else onExpandAll?.();
            }}
            className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-slate-600 transition hover:text-slate-900"
          >
            {expanded ? "Show less" : "Show more"}
            <FaChevronRight
              className={`text-[10px] transition-transform ${expanded ? "-rotate-90" : "rotate-90"}`}
            />
          </button>
        </div>

        <div className="mt-auto border-t border-slate-200 bg-white px-3 py-3 text-center">
          <p className="truncate text-[12px] font-semibold text-slate-700">
            {baseProductName || "This Phone"}
          </p>
          <div className="my-1 border border-purple-700 inline-flex h-6 w-6 items-center justify-center rounded-full  text-[10px] font-bold text-purple-700">
            VS
          </div>
          <p className="truncate text-[12px] font-semibold text-slate-700">
            {displayName}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onCompare?.(competitor)}
          className="m-3 mt-2 inline-flex items-center justify-center rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-violet-700"
        >
          Compare Now
        </button>
      </div>
    </article>
  );
};

const RecentLaunchesPanel = ({ brandName = "", items = [], onOpenProduct }) => {
  if (!Array.isArray(items) || items.length === 0) return null;

  return (
    <aside className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <h4 className="mb-2 text-sm font-semibold text-slate-900">
        Recent Launches By {brandName || "This Brand"}
      </h4>
      <div className="space-y-1.5">
        {items.map((item, index) => {
          const key = String(item?.id ?? item?.name ?? `item-${index}`);
          const launch = formatLaunchDate(
            item?.launch_date || item?.launchDate,
          );
          return (
            <button
              key={key}
              type="button"
              onClick={() => onOpenProduct?.(item)}
              className="flex w-full items-center justify-between rounded-md border border-slate-200 bg-white px-2.5 py-2 text-left text-[12px] font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
            >
              <div className="min-w-0">
                <p className="truncate">{item?.name || "Device"}</p>
                {launch ? (
                  <p className="text-[11px] font-normal text-slate-500">
                    {launch}
                  </p>
                ) : null}
              </div>
              <FaChevronRight className="shrink-0 text-[10px] text-slate-500" />
            </button>
          );
        })}
      </div>
    </aside>
  );
};

const CompetitorCards = ({
  productId,
  onCompare,
  fallbackCompetitors = [],
  recentLaunches = [],
  currentBrand = "",
  currentPrice = null,
  title = "",
  productName = "",
  maxCards = 6,
  recentLaunchesLimit = 3,
  showRecentLaunches = false,
  className = "",
}) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [payload, setPayload] = useState(null);
  const [expandAll, setExpandAll] = useState(false);
  const [collapsedMap, setCollapsedMap] = useState({});

  useEffect(() => {
    const pid = Number(productId);
    if (!Number.isInteger(pid) || pid <= 0) {
      setPayload(null);
      return;
    }

    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(
          `${API_BASE}/api/public/product/${encodeURIComponent(
            pid,
          )}/competitors`,
        );
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        if (!cancelled) {
          setPayload(data);
        }
      } catch {
        if (!cancelled) {
          setError("Unable to load competitor insights right now.");
          setPayload(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  const competitors = useMemo(() => {
    const raw = Array.isArray(payload?.competitors) ? payload.competitors : [];
    const fromApi = raw.filter((row) => Number(row?.id) > 0);
    if (fromApi.length > 0) return fromApi;
    return buildFallbackCompetitorRows({
      productId,
      fallbackCompetitors,
      currentBrand,
      currentPrice,
    });
  }, [payload, productId, fallbackCompetitors, currentBrand, currentPrice]);

  const limitedCompetitors = useMemo(() => {
    const limit = Number.isFinite(Number(maxCards))
      ? Math.max(1, Math.floor(Number(maxCards)))
      : 6;
    return competitors.slice(0, limit);
  }, [competitors, maxCards]);

  const recentLaunchRows = useMemo(() => {
    const source =
      Array.isArray(recentLaunches) && recentLaunches.length > 0
        ? recentLaunches
        : fallbackCompetitors;
    if (!Array.isArray(source) || source.length === 0) return [];

    const excludedIds = new Set(
      limitedCompetitors
        .map((item) => Number(item?.id))
        .filter((id) => Number.isInteger(id) && id > 0),
    );
    const currentId = Number(productId);
    if (Number.isInteger(currentId) && currentId > 0) {
      excludedIds.add(currentId);
    }

    const normalized = source
      .map((item) => ({
        id: Number(item?.id ?? item?.product_id ?? item?.productId) || null,
        name: String(item?.name || item?.model || "").trim(),
        brand: String(item?.brand || item?.brand_name || "").trim(),
        launch_date: item?.launch_date || item?.launchDate || null,
      }))
      .filter((item) => item.name && !excludedIds.has(Number(item.id)));

    if (normalized.length === 0) return [];

    const currentBrandText = String(currentBrand || "")
      .trim()
      .toLowerCase();
    const sameBrand = normalized.filter((item) =>
      currentBrandText ? item.brand.toLowerCase() === currentBrandText : true,
    );
    const base = sameBrand.length > 0 ? sameBrand : normalized;

    const seen = new Set();
    const unique = [];
    for (const item of base) {
      const key = item.id ? `id:${item.id}` : `name:${item.name.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(item);
    }

    unique.sort((a, b) => {
      const ta = parseTimeValue(a.launch_date) ?? 0;
      const tb = parseTimeValue(b.launch_date) ?? 0;
      if (tb !== ta) return tb - ta;
      return a.name.localeCompare(b.name);
    });

    const limit = Number.isFinite(Number(recentLaunchesLimit))
      ? Math.max(1, Math.floor(Number(recentLaunchesLimit)))
      : 3;
    return unique.slice(0, limit);
  }, [
    recentLaunches,
    fallbackCompetitors,
    limitedCompetitors,
    currentBrand,
    productId,
    recentLaunchesLimit,
  ]);

  useEffect(() => {
    setExpandAll(false);
    setCollapsedMap({});
  }, [productId, limitedCompetitors.length]);

  const handleCompare = (competitor) => {
    const competitorId = Number(competitor?.id);
    const pid = Number(productId);
    if (!Number.isInteger(competitorId) || competitorId <= 0) return;
    if (typeof onCompare === "function") {
      onCompare(competitor);
      return;
    }
    if (Number.isInteger(pid) && pid > 0) {
      navigate(`/compare?devices=${pid}:0,${competitorId}:0`);
    }
  };

  const handleOpenRecentProduct = (item) => {
    const id = Number(item?.id);
    const slug = toSlug(item?.name);
    if (slug) {
      navigate(`/smartphones/${slug}`);
      return;
    }
    if (Number.isInteger(id) && id > 0) {
      navigate(`/smartphones?id=${id}`);
    }
  };

  const handleExpandAll = () => {
    setExpandAll(true);
    setCollapsedMap({});
  };

  const handleCollapseSingle = (competitorId) => {
    const key = String(competitorId || "");
    if (!key) return;
    setExpandAll(true);
    setCollapsedMap((prev) => ({
      ...prev,
      [key]: true,
    }));
  };

  if (loading && limitedCompetitors.length === 0) {
    return (
      <div className="w-full border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        Loading competitor insights...
      </div>
    );
  }

  if (error && limitedCompetitors.length === 0) {
    return (
      <div className="w-full border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
        {error}
      </div>
    );
  }

  if (limitedCompetitors.length === 0) {
    return (
      <div className="w-full border border-slate-200 bg-white p-4 text-sm text-slate-600">
        Competitor insights are being prepared for this device.
      </div>
    );
  }

  const heading = title || `Competitors For ${productName || "This Device"}`;
  const headingParts = (() => {
    const text = String(heading || "").trim();
    if (!text) return { prefix: "Competitors For", highlight: "This Device" };

    const match = text.match(/^(.*?\bfor\b)\s+(.+)$/i);
    if (match) {
      return {
        prefix: match[1],
        highlight: match[2],
      };
    }
    return { prefix: text, highlight: "" };
  })();
  const hasRecentLaunches = showRecentLaunches && recentLaunchRows.length > 0;

  return (
    <div className={`w-full bg-white p-3 sm:p-4 ${className}`}>
      <div className="mb-2 flex items-center justify-between gap-2 pb-2">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            {headingParts.prefix}{" "}
            {headingParts.highlight ? (
              <span className="text-violet-600">{headingParts.highlight}</span>
            ) : null}
          </h3>
          <p className="mt-0.5 text-sm text-slate-600">
            Compare close alternatives by price, specs, and practical
            differences.
          </p>
        </div>
      </div>

      {error ? (
        <div className="mb-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">
          Showing fallback competitors while live competitor insights are
          syncing.
        </div>
      ) : null}

      <div
        className={`grid gap-3 ${
          hasRecentLaunches ? "lg:grid-cols-[minmax(0,1fr)_220px]" : ""
        }`}
      >
        <div className="min-w-0">
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {limitedCompetitors.map((competitor) => (
              <CompetitorCard
                key={String(competitor.id)}
                competitor={competitor}
                baseProductName={productName}
                expanded={expandAll && !collapsedMap[String(competitor.id)]}
                onExpandAll={handleExpandAll}
                onCollapseSelf={handleCollapseSingle}
                onCompare={handleCompare}
              />
            ))}
          </div>
        </div>
        {hasRecentLaunches ? (
          <RecentLaunchesPanel
            brandName={currentBrand}
            items={recentLaunchRows}
            onOpenProduct={handleOpenRecentProduct}
          />
        ) : null}
      </div>
    </div>
  );
};

export default CompetitorCards;
