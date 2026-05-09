// src/components/Home/RecommendedSmartphones.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { createProductPath } from "../../utils/slugGenerator";
import useRevealAnimation from "../../hooks/useRevealAnimation";
import { FaArrowRight, FaMobileAlt } from "react-icons/fa";
import { HOME_SECTION_LEAD_DARK } from "./homeSectionTypography";

const RECENT_STORAGE_KEY = "hooks_recent_smartphones_v1";
const FALLBACK_CACHE_KEY = "hooks_reco_fallback_cache_v1";
const SEED_STORAGE_KEY = "hooks_reco_seed_v1";
const ROUTE_FEED_CACHE_KEY = "hooks_smartphone_route_feed_v1";
const MAX_RECOMMENDATIONS = 12;
const MIN_RECOMMENDATIONS = 5;

const toText = (value) => {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) {
    for (const item of value) {
      const normalized = toText(item);
      if (normalized) return normalized;
    }
    return "";
  }
  if (typeof value === "object") {
    return (
      toText(value?.value) ||
      toText(value?.label) ||
      toText(value?.name) ||
      toText(value?.text) ||
      toText(value?.title) ||
      toText(value?.display) ||
      ""
    );
  }
  return String(value).trim();
};

const firstText = (...values) => {
  for (const value of values) {
    const normalized = toText(value);
    if (normalized) return normalized;
  }
  return "";
};

const normalizeToken = (value) => toText(value).toLowerCase();

const parsePriceNumber = (value) => {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const cleaned = String(value).replace(/[^\d.]/g, "");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseCameraMp = (value) => {
  if (!value) return null;
  const text = String(value);
  const match = text.match(/(\d+(?:\.\d+)?)\s*mp/i);
  if (match) return Number(match[1]);
  const numMatch = text.match(/(\d{1,4}(?:\.\d+)?)/);
  return numMatch ? Number(numMatch[1]) : null;
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

const pickScoreValue = (...values) => {
  for (const value of values) {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
};

const getRowDisplayScore = (row) => {
  const displayScore = pickScoreValue(
    row?.overall_score_display,
    row?.overallScoreDisplay,
    row?.overall_score_v2_display_80_98,
    row?.overallScoreV2Display8098,
    row?.spec_score_v2_display_80_98,
    row?.specScoreV2Display8098,
  );
  if (displayScore != null) return Number(displayScore.toFixed(1));

  const rawScore = pickScoreValue(
    row?.overall_score_v2,
    row?.overallScoreV2,
    row?.spec_score_v2,
    row?.specScoreV2,
    row?.overall_score,
    row?.overallScore,
    row?.spec_score,
    row?.specScore,
    row?.hook_score,
    row?.hookScore,
  );
  return mapScoreToDisplayBand(rawScore);
};

const TrendSpecScoreBadge = ({ score }) => {
  const value = Number.isFinite(Number(score)) ? Number(score) : null;
  const label = value != null ? `${value.toFixed(1)}%` : "--";
  return (
    <div className="inline-flex flex-col items-center justify-center rounded-md border border-blue-200 bg-blue-50/95 px-1.5 py-1 leading-none">
      <span className="text-[10px] font-bold text-blue-700">{label}</span>
      <span className="mt-0.5 text-[8px] font-semibold uppercase tracking-wide text-blue-600">
        Spec
      </span>
    </div>
  );
};

const getRecommendationShortLabel = (device) => {
  const source = firstText(device?.brand, device?.name) || "Phone";
  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
};

const RecommendationRailCard = ({
  device,
  index,
  isLoaded,
  onClick,
  metaLabel,
  shortLabel,
}) => {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex min-w-[160px] sm:min-w-[180px] md:min-w-[200px] shrink-0 flex-col gap-2.5 rounded-2xl sm:rounded-3xl p-4 sm:p-5 text-left text-slate-100 backdrop-blur-lg transition-all duration-300 hover:-translate-y-0.5 ${
        isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
      style={{ transitionDelay: `${index * 60}ms` }}
    >
      <div className="flex h-32 w-full sm:h-40 lg:h-44 items-center justify-center overflow-hidden rounded-xl sm:rounded-2xl border border-sky-300/20 bg-blue-950/40">
        {device.image && !imageFailed ? (
          <img
            src={device.image}
            alt={device.name}
            className="h-full w-full object-contain p-2 sm:p-3 transition-transform duration-300 group-hover:scale-110"
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <span className="text-base sm:text-lg font-bold tracking-wide text-slate-500">
            {shortLabel}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-xs sm:text-sm font-bold leading-snug text-white">
          {device.name}
        </p>
        <p className="mt-0.5 truncate text-[10px] sm:text-xs font-medium text-sky-200/70">
          {metaLabel}
        </p>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-sky-300/20 pt-2.5 sm:pt-3">
        <span className="text-[10px] sm:text-xs font-semibold text-sky-200">
          View Details
        </span>
        <span className="transition-transform duration-300 group-hover:translate-x-1">
          <FaArrowRight className="h-2.5 w-2.5 sm:h-3 sm:w-3.5 text-sky-200" />
        </span>
      </div>
    </button>
  );
};

const RecommendationRailSkeleton = ({ index, isLoaded }) => (
  <div
    className={`flex min-w-[160px] sm:min-w-[180px] md:min-w-[200px] shrink-0 flex-col gap-2.5 rounded-2xl sm:rounded-3xl p-4 sm:p-5 text-slate-100 backdrop-blur-lg transition-all duration-300 animate-pulse ${
      isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
    }`}
    style={{ transitionDelay: `${index * 60}ms` }}
  >
    <div className="flex h-32 w-full items-center justify-center overflow-hidden rounded-xl sm:rounded-2xl border border-sky-300/20 bg-blue-950/40 sm:h-40 lg:h-44">
      <div className="h-12 w-12 rounded bg-white/10" />
    </div>

    <div className="min-w-0 flex-1">
      <div className="h-3 w-4/5 rounded bg-white/15" />
      <div className="mt-2 h-2 w-24 rounded bg-white/10" />
    </div>

    <div className="flex items-center justify-between gap-2 border-t border-sky-300/20 pt-2.5 sm:pt-3">
      <div className="h-2.5 w-20 rounded bg-white/15" />
      <div className="h-3 w-3 rounded-full bg-white/15 sm:h-3.5 sm:w-3.5" />
    </div>
  </div>
);

const mulberry32 = (seed) => () => {
  let t = (seed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const getStableSeed = () => {
  if (typeof window === "undefined") return Math.floor(Math.random() * 1e9);
  try {
    const existing = window.localStorage.getItem(SEED_STORAGE_KEY);
    if (existing) return Number(existing);
    const seed = Math.floor(Math.random() * 1e9);
    window.localStorage.setItem(SEED_STORAGE_KEY, String(seed));
    return seed;
  } catch {
    return Math.floor(Math.random() * 1e9);
  }
};

const pickRandomItems = (items, count, seed) => {
  if (!Array.isArray(items) || items.length === 0) return [];
  const rng = mulberry32(seed);
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(count, copy.length));
};

const getRowImage = (row) =>
  firstText(row?.image, row?.image_url, row?.product_image) ||
  firstText(row?.images?.[0], row?.metadata?.images?.[0]) ||
  "";

const getRowName = (row) =>
  firstText(
    row?.name,
    row?.product_name,
    row?.model,
    row?.basic_info?.product_name,
    row?.basic_info?.title,
    row?.basic_info?.model,
  );

const splitQueryTerms = (value) =>
  String(value || "")
    .split(/[\s,./_-]+/)
    .map((part) => normalizeToken(part))
    .filter(Boolean);

const getRowSegment = (row) =>
  firstText(
    row?.category,
    row?.segment,
    row?.product_type,
    row?.basic_info?.category,
    row?.basic_info?.segment,
  );

const getRowProcessor = (row) =>
  firstText(
    row?.performance?.processor,
    row?.processor,
    row?.cpu,
    row?.specs?.processor,
  );

const getRowCamera = (row) =>
  firstText(
    row?.camera?.main_camera_megapixels,
    row?.camera?.main,
    row?.specs?.camera,
    row?.camera?.primary,
  );

const buildRecommendationCandidate = (row, index = 0) => {
  const id =
    row?.product_id ?? row?.productId ?? row?.id ?? row?.basic_info?.id ?? null;
  return {
    id,
    name: getRowName(row),
    image: getRowImage(row),
    price: getRowPrice(row),
    brand: firstText(row?.brand, row?.brand_name, row?.basic_info?.brand_name),
    segment: getRowSegment(row),
    processor: getRowProcessor(row),
    cameraMp: parseCameraMp(getRowCamera(row)),
    score: getRowDisplayScore(row),
    _rowIndex: index,
  };
};

const buildRecommendationCandidates = (rows) =>
  (Array.isArray(rows) ? rows : [])
    .map((row, index) => buildRecommendationCandidate(row, index))
    .filter((item) => item.name);

const getRowPrice = (row) => {
  const topLevel = parsePriceNumber(
    row?.price ?? row?.base_price ?? row?.starting_price ?? row?.min_price,
  );
  if (topLevel != null) return topLevel;
  const variants = Array.isArray(row?.variants) ? row.variants : [];
  if (!variants.length) return null;
  const base = parsePriceNumber(
    variants?.[0]?.base_price ?? variants?.[0]?.price,
  );
  return base ?? null;
};

const scoreSimilarity = (candidate, recent) => {
  let score = 0;
  const candidateSegment = normalizeToken(candidate.segment);
  const recentSegment = normalizeToken(recent.segment);
  if (candidateSegment && recentSegment && candidateSegment === recentSegment) {
    score += 3;
  }

  const candidateProcessor = normalizeToken(candidate.processor);
  const recentProcessor = normalizeToken(recent.processor);
  if (
    candidateProcessor &&
    recentProcessor &&
    (candidateProcessor.includes(recentProcessor) ||
      recentProcessor.includes(candidateProcessor))
  ) {
    score += 2;
  }

  if (candidate.cameraMp && recent.cameraMp) {
    const diff = Math.abs(candidate.cameraMp - recent.cameraMp);
    const threshold = Math.max(4, recent.cameraMp * 0.2);
    if (diff <= threshold) score += 2;
  }

  if (candidate.price && recent.price) {
    const diffRatio = Math.abs(candidate.price - recent.price) / recent.price;
    if (diffRatio <= 0.15) score += 2;
  }

  const candidateBrand = normalizeToken(candidate.brand);
  const recentBrand = normalizeToken(recent.brand);
  if (candidateBrand && recentBrand && candidateBrand === recentBrand) {
    score += 1;
  }

  return score;
};

const scoreContextMatch = (candidate, context = {}) => {
  let score = 0;
  const candidateBrand = normalizeToken(candidate.brand);
  const candidateName = normalizeToken(candidate.name);
  const candidateSegment = normalizeToken(candidate.segment);
  const contextBrand = normalizeToken(context.brandName);
  const contextProduct = normalizeToken(context.productName);
  const contextTerms = Array.isArray(context.productTerms)
    ? context.productTerms
    : [];

  if (contextBrand && candidateBrand) {
    if (candidateBrand === contextBrand) {
      score += 5;
    } else if (
      candidateBrand.includes(contextBrand) ||
      contextBrand.includes(candidateBrand)
    ) {
      score += 3;
    }
  }

  if (contextProduct && candidateName) {
    if (candidateName === contextProduct) {
      score += 4;
    } else if (
      candidateName.includes(contextProduct) ||
      contextProduct.includes(candidateName)
    ) {
      score += 3;
    }
  }

  for (const term of contextTerms) {
    if (!term) continue;
    if (candidateName.includes(term)) score += 1.5;
    if (candidateBrand.includes(term)) score += 1;
    if (candidateSegment.includes(term)) score += 0.5;
  }

  return score;
};

const RecommendedSmartphones = ({
  variant = "rail",
  limit = MAX_RECOMMENDATIONS,
  className = "",
  brandName = "",
  productName = "",
}) => {
  const [recentDevices, setRecentDevices] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeFeed, setActiveFeed] = useState("latest");
  const navigate = useNavigate();
  const { smartphone, smartphoneAll } = useSelector(
    (state) => state.device || {},
  );
  const isLoaded = useRevealAnimation();
  const contextBrandName = normalizeToken(brandName);
  const contextProductName = normalizeToken(productName);
  const contextProductTerms = useMemo(
    () => splitQueryTerms(productName),
    [productName],
  );
  const catalogRows = useMemo(() => {
    if (Array.isArray(smartphone) && smartphone.length) return smartphone;
    if (Array.isArray(smartphoneAll) && smartphoneAll.length)
      return smartphoneAll;
    return [];
  }, [smartphone, smartphoneAll]);

  useEffect(() => {
    let cancelled = false;

    const readRecent = () => {
      try {
        const raw = window.localStorage.getItem(RECENT_STORAGE_KEY);
        const parsed = JSON.parse(raw || "[]");
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    };

    const readFallbackCache = () => {
      try {
        const raw = window.localStorage.getItem(FALLBACK_CACHE_KEY);
        const parsed = JSON.parse(raw || "[]");
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    };

    const readRouteFeedCache = () => {
      try {
        const raw = window.localStorage.getItem(ROUTE_FEED_CACHE_KEY);
        const parsed = JSON.parse(raw || "[]");
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    };

    const writeFallbackCache = (items) => {
      try {
        window.localStorage.setItem(
          FALLBACK_CACHE_KEY,
          JSON.stringify(items || []),
        );
      } catch {
        // ignore cache failures
      }
    };

    const scoreRows = (rows, recent) => {
      const recentIds = new Set(recent.map((item) => String(item?.id ?? "")));

      const candidates = buildRecommendationCandidates(rows);
      const scored = candidates
        .filter((item) => !recentIds.has(String(item.id ?? "")))
        .map((item) => {
          const recentScore = recent.reduce((acc, r) => {
            const s = scoreSimilarity(item, r);
            return s > acc ? s : acc;
          }, 0);
          const contextScore = scoreContextMatch(item, {
            brandName: contextBrandName,
            productName: contextProductName,
            productTerms: contextProductTerms,
          });
          return { ...item, _score: recentScore + contextScore };
        })
        .filter((item) => item._score > 0)
        .sort((a, b) => {
          if (b._score !== a._score) return b._score - a._score;
          if (a.price == null && b.price != null) return 1;
          if (a.price != null && b.price == null) return -1;
          if (a.price != null && b.price != null) return a.price - b.price;
          return a._rowIndex - b._rowIndex;
        });

      const seed = getStableSeed();
      const randomFallback = pickRandomItems(
        candidates.filter((item) => !recentIds.has(String(item.id ?? ""))),
        MAX_RECOMMENDATIONS,
        seed,
      );

      let next = scored.slice(0, MAX_RECOMMENDATIONS);
      if (next.length < MIN_RECOMMENDATIONS) {
        const filler = randomFallback.filter(
          (item) =>
            !next.some((picked) => String(picked.id) === String(item.id)),
        );
        next = next.concat(filler.slice(0, MIN_RECOMMENDATIONS - next.length));
      }

      if (next.length === 0 && recent.length > 0) {
        next = recent.slice(0, MAX_RECOMMENDATIONS);
      }

      if (next.length > 0) writeFallbackCache(next);
      if (!cancelled) setRecommended(next.slice(0, MAX_RECOMMENDATIONS));
    };

    const fetchRecommendations = async () => {
      if (typeof window === "undefined") return;
      const recent = readRecent();
      if (!cancelled) setRecentDevices(recent);

      setLoading(true);
      try {
        const routeFeedRows = readRouteFeedCache();
        const hasContext = Boolean(contextBrandName || contextProductName);
        let sourceRows = [];
        if (!hasContext && routeFeedRows.length > 0) {
          sourceRows = routeFeedRows;
        } else if (catalogRows.length > 0) {
          sourceRows = catalogRows;
        } else if (routeFeedRows.length > 0) {
          sourceRows = routeFeedRows;
        }

        if (sourceRows.length > 0) {
          scoreRows(sourceRows, recent);
          return;
        }

        const r = await fetch(
          "https://api.apisphere.in/api/public/trending/smartphones?limit=120",
        );
        if (!r.ok) throw new Error("Failed to fetch recommendations");
        const json = await r.json();
        if (cancelled) return;

        const rows = Array.isArray(json?.trending)
          ? json.trending
          : Array.isArray(json?.smartphones)
            ? json.smartphones
            : Array.isArray(json)
              ? json
              : [];
        scoreRows(rows, recent);
      } catch {
        const cached = readFallbackCache();
        if (!cancelled) setRecommended(cached.slice(0, MAX_RECOMMENDATIONS));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchRecommendations();
    return () => {
      cancelled = true;
    };
  }, [catalogRows, contextBrandName, contextProductName, contextProductTerms]);

  const getDevicePath = (device) => {
    const rawName = device.name || String(device.id || "device");
    return createProductPath("smartphones", rawName);
  };

  const handleDeviceClick = (device) => {
    navigate(getDevicePath(device));
  };

  const showEmpty =
    !loading && recommended.length === 0 && recentDevices.length === 0;

  const displayItems = useMemo(
    () => (recommended.length > 0 ? recommended : recentDevices),
    [recommended, recentDevices],
  );

  const isSidebar = variant === "sidebar";

  const sidebarItems = useMemo(() => {
    const base = displayItems.slice(0, Math.max(3, Math.min(limit, 8)));
    if (!isSidebar) return base;

    let next = base;
    if (activeFeed === "popular") {
      next = [...base].sort((a, b) => {
        const scoreA = Number(a?.score ?? a?.rating ?? 0) || 0;
        const scoreB = Number(b?.score ?? b?.rating ?? 0) || 0;
        if (scoreB !== scoreA) return scoreB - scoreA;
        const priceA = parsePriceNumber(a?.price);
        const priceB = parsePriceNumber(b?.price);
        if (priceA == null && priceB != null) return 1;
        if (priceA != null && priceB == null) return -1;
        if (priceA != null && priceB != null) return priceA - priceB;
        return 0;
      });
    }

    if (next.length === 0) next = base;
    return next.slice(0, Math.min(limit, MAX_RECOMMENDATIONS));
  }, [activeFeed, displayItems, isSidebar, limit]);

  const formatPriceLabel = (value) => {
    const n = parsePriceNumber(value);
    const rupee = "\u20B9";
    if (n != null) return `${rupee} ${n.toLocaleString("en-IN")}`;
    const raw = String(value || "").trim();
    return raw
      ? raw.startsWith(rupee)
        ? raw
        : `${rupee} ${raw}`
      : "Price not available";
  };

  const adaptiveTitle = brandName
    ? `${brandName} smartphones`
    : productName
      ? "Related smartphones"
      : "Latest smartphones";
  const adaptiveSubtitle =
    brandName || productName
      ? `Live picks related to ${productName || brandName}.`
      : "Live picks from the smartphone catalog.";

  if (isSidebar) {
    return (
      <div className={`mx-auto w-full ${className}`}>
        <div className="border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
          <div className="mb-4 text-center">
            <h3 className="text-2xl font-semibold tracking-tight text-slate-900">
              {adaptiveTitle}
            </h3>
            <p className="mt-2 text-sm text-slate-600">{adaptiveSubtitle}</p>
          </div>

          <div className="grid grid-cols-2 gap-1 border border-slate-200 bg-slate-50 p-1">
            {[
              { id: "latest", label: "Latest" },
              { id: "popular", label: "Popular" },
            ].map((tab) => {
              const active = activeFeed === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveFeed(tab.id)}
                  className={`rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                    active
                      ? "bg-white text-indigo-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="mt-4 space-y-3">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={`sidebar-skeleton-${i}`}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3"
                >
                  <div className="h-20 w-20 animate-pulse rounded-xl bg-slate-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-24 rounded bg-slate-200" />
                    <div className="h-4 w-40 rounded bg-slate-200" />
                    <div className="h-5 w-24 rounded bg-slate-200" />
                  </div>
                </div>
              ))
            ) : sidebarItems.length > 0 ? (
              sidebarItems.map((device, i) => (
                <button
                  key={`${device.id || "noid"}-${i}`}
                  type="button"
                  onClick={() => handleDeviceClick(device)}
                  className="group flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left transition-all duration-300"
                >
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                    {device.image ? (
                      <img
                        src={device.image}
                        alt={device.name}
                        className="h-full w-full object-contain p-2"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <FaMobileAlt className="text-2xl text-slate-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    {device.brand ? (
                      <p className="truncate text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">
                        {device.brand}
                      </p>
                    ) : null}
                    <h6 className="mt-1 line-clamp-2 text-base font-semibold leading-snug text-slate-900 group-hover:text-blue-600">
                      {device.name}
                    </h6>
                    <div className="mt-2 text-lg font-bold text-slate-900">
                      {formatPriceLabel(device.price)}
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                Browse a smartphone to unlock recommendations.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <section
      className={`relative mt-12 overflow-hidden  border-t border-sky-900/60 bg-gradient-to-b from-[#030b19] via-[#0a2f6d] to-[#030b19] transition-all duration-700 ${
        isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(186,230,253,0.28),_transparent_30%),radial-gradient(circle_at_75%_18%,_rgba(56,189,248,0.22),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(34,211,238,0.18),_transparent_28%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(186,230,253,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(186,230,253,0.07)_1px,transparent_1px)] [background-size:34px_34px] [mask-image:radial-gradient(circle_at_center,white,transparent_88%)]" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-sky-950/20 to-transparent" />
      <div className="relative mx-auto w-full px-4 py-10 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-8 max-w-4xl text-center">
            <h1 className="text-[11px] font-bold uppercase tracking-[0.32em] text-sky-600 sm:text-xs">
              Recommended Smartphones
            </h1>

            <p
              className={`${HOME_SECTION_LEAD_DARK} max-w-[22rem] sm:max-w-2xl`}
            >
              Recommendations based on your browsing history and current trends
              in the smartphone world.
            </p>
          </div>

          {showEmpty ? (
            <div className="rounded-2xl border border-slate-700/30 bg-slate-800/30 px-6 py-8 text-center text-sm text-slate-400">
              Browse a smartphone to unlock recommendations.
            </div>
          ) : null}

          <div className="no-scrollbar mt-8 flex items-center gap-3 overflow-x-auto pb-2 sm:gap-4 md:gap-5">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <RecommendationRailSkeleton
                    key={`skeleton-${i}`}
                    index={i}
                    isLoaded={isLoaded}
                  />
                ))
              : displayItems.map((device, i) => (
                  <RecommendationRailCard
                    key={`${device.id || "noid"}-${i}`}
                    device={device}
                    index={i}
                    isLoaded={isLoaded}
                    onClick={() => handleDeviceClick(device)}
                    metaLabel={[
                      device.brand,
                      formatPriceLabel(device.price) !== "Price not available"
                        ? formatPriceLabel(device.price)
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "Recommended pick"}
                    shortLabel={getRecommendationShortLabel(device)}
                  />
                ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default RecommendedSmartphones;
