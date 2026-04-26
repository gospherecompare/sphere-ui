import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  FaArrowDown,
  FaArrowUp,
  FaCheck,
  FaChevronRight,
  FaPlusSquare,
  FaTimesCircle,
  FaBalanceScale,
  FaThumbsDown,
  FaThumbsUp,
  FaCheckDouble,
  FaAdjust,
  FaCheckCircle,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { createProductPath } from "../../utils/slugGenerator";
import { resolveSmartphoneBadgeScore } from "../../utils/smartphoneBadgeScore";

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
          item?.overallScoreV2 ??
          item?.overall_score ??
          item?.overallScore ??
          item?.spec_score_v2 ??
          item?.specScoreV2 ??
          item?.spec_score ??
          item?.specScore ??
          null,
      );
      const overallScoreDisplay = resolveSmartphoneBadgeScore(item);
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
        spec_score: toFiniteNumber(
          item?.spec_score_v2 ??
            item?.specScoreV2 ??
            item?.spec_score ??
            item?.specScore ??
            null,
        ),
        overall_score: overallScoreRaw,
        spec_score_v2: toFiniteNumber(
          item?.spec_score_v2 ?? item?.specScoreV2 ?? null,
        ),
        overall_score_v2: toFiniteNumber(
          item?.overall_score_v2 ?? item?.overallScoreV2 ?? null,
        ),
        spec_score_display: toFiniteNumber(
          item?.spec_score_v2_display_80_98 ??
            item?.spec_score_display ??
            item?.specScoreDisplay ??
            item?.specScoreV2Display8098 ??
            null,
        ),
        specScoreDisplay: toFiniteNumber(
          item?.spec_score_v2_display_80_98 ??
            item?.spec_score_display ??
            item?.specScoreDisplay ??
            item?.specScoreV2Display8098 ??
            null,
        ),
        spec_score_v2_display_80_98: toFiniteNumber(
          item?.spec_score_v2_display_80_98 ??
            item?.specScoreV2Display8098 ??
            null,
        ),
        specScoreV2Display8098: toFiniteNumber(
          item?.spec_score_v2_display_80_98 ??
            item?.specScoreV2Display8098 ??
            null,
        ),
        overall_score_v2_display_80_98: overallScoreDisplay,
        overallScoreV2Display8098: overallScoreDisplay,
        overall_score_display: overallScoreDisplay,
        overallScoreDisplay: overallScoreDisplay,
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
      Icon: FaThumbsUp,
      iconClass: "text-emerald-500",
    };
  }

  if (type === "disadvantage") {
    return {
      Icon: FaThumbsDown,
      iconClass: "text-rose-500",
    };
  }

  return {
    Icon: FaCheckCircle,
    iconClass: "text-blue-500",
  };
};

const CompetitorCard = ({
  competitor,
  baseProductName,
  productLabel = "Device",
  expanded = false,
  onExpandAll,
  onCollapseSelf,
  onCompare,
  compareDisabled = false,
}) => {
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
    competitor?.best_store_name || competitor?.brand_name || "Hooks";

  return (
    <article className="group relative w-[84vw] max-w-[320px] shrink-0 overflow-hidden rounded-lg border border-slate-200/80 bg-white  transition-colors duration-200 hover:border-blue-200 sm:w-[280px]">
      <div className="flex h-full flex-col">
        <div className="p-3 pb-3 sm:p-4">
          <div className="mx-auto mt-3 h-24 w-24 overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-b from-blue-50/70 to-white p-1.5">
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
          <h3 className="space-grotesk-title mt-3 line-clamp-2 text-[14px] leading-tight text-slate-900 sm:text-[15px]">
            {displayName}
          </h3>
          <p className="mt-1 text-[12px] leading-snug text-slate-600">
            From <span className="font-semibold text-slate-900">{buyFrom}</span>
          </p>
          <div className="mt-2 flex items-center justify-between gap-2">
            <p className="inline-flex items-center rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[14px] font-semibold text-emerald-600">
              {formatPrice(competitor?.price)}
            </p>
          </div>
          <p className="mt-2 line-clamp-2 text-[12px] leading-snug text-slate-500">
            {descriptor}
          </p>
        </div>

        <div className="border-t border-slate-100 bg-slate-50/60 p-3 sm:p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-blue-600">
              Quick Comparison
            </p>
          </div>

          <ul className="space-y-1.5 rounded-2xl border border-slate-200 bg-white px-3 py-3">
            {orderedInsights.map((item, index) => {
              const meta = insightMeta(item.type);
              return (
                <li
                  key={`insight-${index}`}
                  className="flex items-start gap-2 py-1 first:pt-0 last:pb-0"
                >
                  <meta.Icon
                    className={`mt-0.5 shrink-0 text-[12px] ${meta.iconClass}`}
                  />
                  <span className="text-[12px] leading-snug text-slate-600">
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
            className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-blue-600 transition hover:text-blue-700"
          >
            {expanded ? "Show less" : "Show more"}
            <FaChevronRight
              className={`text-[10px] transition-transform ${expanded ? "-rotate-90" : "rotate-90"}`}
            />
          </button>
        </div>

        <div className="mt-auto border-t border-slate-100 bg-white">
          <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-3">
            <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
              <div className="min-w-0">
                <p className="text-[9px] font-semibold uppercase tracking-[0.26em] text-slate-400">
                  This device
                </p>
                <p className="truncate text-[12px] font-semibold text-slate-700">
                  {baseProductName || `This ${productLabel}`}
                </p>
              </div>
              <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 sm:h-10 sm:w-10 animate-pulse reduced-motion:animate-none">
                <span className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 via-cyan-500 to-blue-600 opacity-10" />
                <span className="absolute inset-[5px] rounded-full border border-blue-200 bg-white" />
                <span className="relative space-grotesk-title text-[9px] font-semibold tracking-[0.3em] text-blue-700">
                  VS
                </span>
              </div>
              <div className="min-w-0 text-right">
                <p className="text-[9px] font-semibold uppercase tracking-[0.26em] text-slate-400">
                  Competitor
                </p>
                <p className="truncate text-[12px] font-semibold text-slate-700">
                  {displayName}
                </p>
              </div>
            </div>
          </div>
          <div className="px-3 py-4 sm:px-4">
            <button
              type="button"
              onClick={() => {
                if (compareDisabled) return;
                onCompare?.(competitor);
              }}
              disabled={compareDisabled}
              className={`inline-flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-semibold transition-colors ${
                compareDisabled
                  ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                  : "border-blue-600 bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 text-white hover:from-blue-700 hover:via-cyan-700 hover:to-blue-700"
              }`}
            >
              Compare Now
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

const RecentLaunchesPanel = ({ brandName = "", items = [], onOpenProduct }) => {
  if (!Array.isArray(items) || items.length === 0) return null;

  return (
    <aside className="rounded-2xl border border-slate-200 bg-white p-4">
      <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.34em] text-blue-600">
        Recent Launches By {brandName || "This Brand"}
      </h4>
      <div className="space-y-2">
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
              className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left text-[12px] font-medium text-slate-700 transition-colors hover:border-blue-200 hover:bg-blue-50/50"
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
  productBasePath = "/smartphones",
  productLabel = "Device",
  entityType = "smartphones",
  className = "",
  compareDisabled = false,
}) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [payload, setPayload] = useState(null);
  const [expandAll, setExpandAll] = useState(false);
  const [collapsedMap, setCollapsedMap] = useState({});
  const railRef = useRef(null);
  const [railControls, setRailControls] = useState({
    canScrollLeft: false,
    canScrollRight: false,
  });

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
        const queryEntity = encodeURIComponent(
          String(entityType || "smartphones"),
        );
        const response = await fetch(
          `${API_BASE}/api/public/product/${encodeURIComponent(
            pid,
          )}/competitors?entity_type=${queryEntity}`,
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
  }, [productId, entityType]);

  const competitors = useMemo(() => {
    const raw = Array.isArray(payload?.competitors) ? payload.competitors : [];
    const fromApi = raw.filter((row) => Number(row?.id) > 0);
    const fallbackRows = buildFallbackCompetitorRows({
      productId,
      fallbackCompetitors,
      currentBrand,
      currentPrice,
    });
    const limit = Number.isFinite(Number(maxCards))
      ? Math.max(1, Math.floor(Number(maxCards)))
      : 6;

    if (fromApi.length === 0) return fallbackRows;
    if (fromApi.length >= limit || fallbackRows.length === 0) return fromApi;

    const seen = new Set(
      fromApi
        .map((row) => Number(row?.id))
        .filter((id) => Number.isFinite(id) && id > 0),
    );
    const merged = [...fromApi];
    for (const row of fallbackRows) {
      const rid = Number(row?.id);
      if (Number.isFinite(rid) && rid > 0 && seen.has(rid)) continue;
      merged.push(row);
      if (Number.isFinite(rid) && rid > 0) seen.add(rid);
      if (merged.length >= limit) break;
    }
    return merged;
  }, [
    payload,
    productId,
    fallbackCompetitors,
    currentBrand,
    currentPrice,
    maxCards,
  ]);

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
  const hasRecentLaunches = showRecentLaunches && recentLaunchRows.length > 0;

  useEffect(() => {
    setExpandAll(false);
    setCollapsedMap({});
  }, [productId, limitedCompetitors.length]);

  useEffect(() => {
    const updateRailControls = () => {
      const node = railRef.current;
      if (!node) {
        setRailControls({
          canScrollLeft: false,
          canScrollRight: false,
        });
        return;
      }

      const maxScrollLeft = Math.max(0, node.scrollWidth - node.clientWidth);
      const threshold = 4;

      setRailControls({
        canScrollLeft: node.scrollLeft > threshold,
        canScrollRight: maxScrollLeft - node.scrollLeft > threshold,
      });
    };

    const node = railRef.current;
    if (!node) {
      setRailControls({
        canScrollLeft: false,
        canScrollRight: false,
      });
      return undefined;
    }

    const frameId = window.requestAnimationFrame(updateRailControls);
    const handleResize = () => updateRailControls();

    node.addEventListener("scroll", updateRailControls, { passive: true });
    window.addEventListener("resize", handleResize);

    return () => {
      window.cancelAnimationFrame(frameId);
      node.removeEventListener("scroll", updateRailControls);
      window.removeEventListener("resize", handleResize);
    };
  }, [limitedCompetitors.length, hasRecentLaunches]);

  const handleCompare = (competitor) => {
    if (compareDisabled) return;
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
    const basePath = String(productBasePath || "/smartphones").replace(
      /\/$/,
      "",
    );
    if (slug) {
      navigate(createProductPath(basePath, slug));
      return;
    }
    if (Number.isInteger(id) && id > 0) {
      navigate(`${basePath}?id=${id}`);
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

  const scrollRail = (direction) => {
    const node = railRef.current;
    if (!node) return;

    const step = Math.max(node.clientWidth * 0.82, 260);
    node.scrollBy({
      left: direction * step,
      behavior: "smooth",
    });
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
  const showRailControls =
    railControls.canScrollLeft || railControls.canScrollRight;

  return (
    <div className={`w-full p-3 sm:p-4 font-sans ${className}`}>
      <div className=" px-4 py-4 sm:px-5 sm:py-5">
        <div className="mb-3 border-b border-slate-200/80 pb-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-blue-600">
            Recommended Comparisons
          </p>
          <h3 className="space-grotesk-title mt-2 text-lg tracking-tight text-slate-900 sm:text-2xl">
            {headingParts.prefix}{" "}
            {headingParts.highlight ? (
              <span className="text-blue-600">{headingParts.highlight}</span>
            ) : null}
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Compare close alternatives by price, specs, and practical
            differences.
          </p>
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
            {showRailControls ? (
              <div className="mb-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => scrollRail(-1)}
                  disabled={!railControls.canScrollLeft}
                  aria-label="Scroll competitors left"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors hover:border-blue-200 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-500"
                >
                  <FaChevronRight className="rotate-180 text-sm" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollRail(1)}
                  disabled={!railControls.canScrollRight}
                  aria-label="Scroll competitors right"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors hover:border-blue-200 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-500"
                >
                  <FaChevronRight className="text-sm" />
                </button>
              </div>
            ) : null}
            <div
              ref={railRef}
              className="no-scrollbar flex gap-3 overflow-x-auto pb-1 scroll-smooth"
            >
              {limitedCompetitors.map((competitor) => (
                <CompetitorCard
                  key={String(competitor.id)}
                  competitor={competitor}
                  baseProductName={productName}
                  productLabel={productLabel}
                  expanded={expandAll && !collapsedMap[String(competitor.id)]}
                  onExpandAll={handleExpandAll}
                  onCollapseSelf={handleCollapseSingle}
                  onCompare={handleCompare}
                  compareDisabled={compareDisabled}
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
    </div>
  );
};

export default CompetitorCards;
