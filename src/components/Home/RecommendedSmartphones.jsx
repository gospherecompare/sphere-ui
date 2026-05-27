// src/components/Home/RecommendedSmartphones.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { createProductPath } from "../../utils/slugGenerator";
import useRevealAnimation from "../../hooks/useRevealAnimation";
import { FaArrowRight, FaMobileAlt } from "react-icons/fa";

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
  const label = value != null ? `${value.toFixed(1)}%` : "Live";
  return (
    <div className="inline-flex flex-col items-center justify-center rounded-md border border-cyan-200/20 bg-cyan-300/10 px-2 py-1 leading-none shadow-[0_10px_28px_rgba(8,145,178,0.16)] backdrop-blur">
      <span className="text-[10px] font-black text-cyan-100">{label}</span>
      <span className="mt-0.5 text-[8px] font-bold uppercase tracking-wide text-cyan-200/70">
        Match
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
  priceLabel,
  shortLabel,
}) => {
  const [imageFailed, setImageFailed] = useState(false);
  const brandLabel = device.brand || metaLabel || "Smartphone pick";
  const visiblePrice = priceLabel || "View details";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex min-w-[15.5rem] shrink-0 snap-start flex-col overflow-hidden rounded-lg border border-cyan-200/14 bg-white/[0.055] p-3 text-left text-white shadow-[0_24px_70px_rgba(2,6,23,0.22)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-cyan-200/28 hover:bg-white/[0.075] sm:min-w-[16.75rem] sm:p-3.5 lg:min-w-[18rem] ${
        isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
      style={{ transitionDelay: `${index * 60}ms` }}
    >
      <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_22%_12%,rgba(56,189,248,0.16),transparent_32%),radial-gradient(circle_at_86%_28%,rgba(168,85,247,0.18),transparent_36%)] opacity-90" />
      <span className="pointer-events-none absolute -right-6 top-12 text-8xl font-black leading-none text-white/[0.035] transition-transform duration-300 group-hover:scale-110">
        {String(index + 1).padStart(2, "0")}
      </span>

      <div className="relative z-10 flex items-center justify-between gap-3">
        <span className="rounded-md border border-white/10 bg-white/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-100">
          For you {String(index + 1).padStart(2, "0")}
        </span>
        <TrendSpecScoreBadge score={device.score} />
      </div>

      <div className="relative z-10 mt-4 flex h-32 w-full items-center justify-center overflow-visible sm:h-36 lg:h-40">
        <span className="absolute bottom-3 h-12 w-28 rounded-full bg-cyan-200/10 blur-2xl" />
        <span className="absolute h-24 w-24 rounded-full bg-gradient-to-br from-cyan-300/12 via-blue-500/10 to-fuchsia-400/12 blur-xl" />
        {device.image && !imageFailed ? (
          <img
            src={device.image}
            alt={device.name}
            className="relative z-10 h-full w-full object-contain p-1 drop-shadow-[0_24px_34px_rgba(2,6,23,0.4)] transition-transform duration-300 group-hover:scale-110"
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <span className="relative z-10 text-lg font-black tracking-wide text-cyan-100/75">
            {shortLabel}
          </span>
        )}
      </div>

      <div className="relative z-10 mt-3 min-w-0 flex-1">
        <p className="line-clamp-2 text-base font-black leading-snug text-white">
          {device.name}
        </p>
        <p className="mt-1 truncate text-xs font-bold text-cyan-100/65">
          {brandLabel}
        </p>
      </div>

      <div className="relative z-10 mt-4 flex items-center justify-between gap-3 border-t border-cyan-100/10 pt-3">
        <span className="text-sm font-black text-white">
          {visiblePrice}
        </span>
        <span className="grid h-8 w-8 place-items-center rounded-md bg-gradient-to-br from-cyan-400/80 to-fuchsia-500/80 text-white transition-transform duration-300 group-hover:translate-x-1">
          <FaArrowRight className="h-3 w-3" />
        </span>
      </div>
    </button>
  );
};

const RecommendationRailSkeleton = ({ index, isLoaded }) => (
  <div
    className={`relative flex min-w-[15.5rem] shrink-0 flex-col overflow-hidden rounded-lg border border-cyan-200/12 bg-white/[0.055] p-3 backdrop-blur-xl transition-all duration-300 animate-pulse sm:min-w-[16.75rem] sm:p-3.5 lg:min-w-[18rem] ${
      isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
    }`}
    style={{ transitionDelay: `${index * 60}ms` }}
  >
    <div className="flex items-center justify-between gap-3">
      <div className="h-7 w-24 rounded-md bg-white/10" />
      <div className="h-8 w-12 rounded-md bg-white/10" />
    </div>

    <div className="mt-4 flex h-32 w-full items-center justify-center sm:h-36 lg:h-40">
      <div className="h-24 w-20 rounded-md bg-white/10" />
    </div>

    <div className="mt-3 min-w-0 flex-1">
      <div className="h-4 w-4/5 rounded bg-white/12" />
      <div className="mt-2 h-3 w-24 rounded bg-white/10" />
    </div>

    <div className="mt-4 flex items-center justify-between gap-3 border-t border-cyan-100/10 pt-3">
      <div className="h-4 w-20 rounded bg-white/12" />
      <div className="h-8 w-8 rounded-md bg-white/10" />
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
      className={`relative overflow-hidden bg-[#050712] transition-all duration-700 ${
        isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,#073C8C_0%,#24105E_34%,#0B1547_62%,#073C8C_100%)]" />
      <div className="pointer-events-none absolute inset-0 hidden bg-[radial-gradient(circle_at_14%_18%,rgba(34,211,238,0.25),transparent_30%),radial-gradient(circle_at_84%_16%,rgba(217,70,239,0.22),transparent_32%),radial-gradient(circle_at_46%_95%,rgba(59,130,246,0.2),transparent_42%)] sm:block" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(34,211,238,0.2),transparent_40%),radial-gradient(circle_at_92%_22%,rgba(217,70,239,0.18),transparent_42%),radial-gradient(circle_at_38%_82%,rgba(59,130,246,0.16),transparent_45%)] sm:hidden" />
      <svg
        className="pointer-events-none absolute inset-0 hidden h-full w-full opacity-70 sm:block"
        viewBox="0 0 1440 620"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <path
          d="M-40 310H210c96 0 102-132 192-132h260c100 0 98 164 208 164h620"
          fill="none"
          stroke="rgba(125,211,252,0.18)"
          strokeWidth="3"
        />
        <path
          d="M910 120h214c84 0 86 98 166 98h190"
          fill="none"
          stroke="rgba(216,180,254,0.16)"
          strokeWidth="3"
        />
        <rect
          x="1040"
          y="250"
          width="210"
          height="118"
          rx="28"
          fill="none"
          stroke="rgba(125,211,252,0.13)"
          strokeWidth="3"
        />
      </svg>
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-65 sm:hidden"
        viewBox="0 0 390 780"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <path
          d="M-34 124H112c60 0 58 82 116 82h196"
          fill="none"
          stroke="rgba(125,211,252,0.18)"
          strokeWidth="2"
        />
        <path
          d="M52 342h108c45 0 44 68 90 68h176"
          fill="none"
          stroke="rgba(216,180,254,0.15)"
          strokeWidth="2"
        />
        <path
          d="M-20 600h120c52 0 52-76 104-76h214"
          fill="none"
          stroke="rgba(56,189,248,0.12)"
          strokeWidth="2"
        />
        <rect
          x="282"
          y="252"
          width="78"
          height="116"
          rx="20"
          fill="none"
          stroke="rgba(125,211,252,0.13)"
          strokeWidth="2"
        />
        <rect
          x="22"
          y="488"
          width="94"
          height="146"
          rx="22"
          fill="none"
          stroke="rgba(216,180,254,0.12)"
          strokeWidth="2"
        />
        <circle cx="112" cy="124" r="4" fill="rgba(103,232,249,0.55)" />
        <circle cx="250" cy="410" r="4" fill="rgba(216,180,254,0.5)" />
      </svg>
      <div className="pointer-events-none absolute left-[-7rem] top-12 hidden h-80 w-80 rounded-full border border-cyan-300/12 sm:block" />
      <div className="pointer-events-none absolute right-[-8rem] bottom-8 hidden h-80 w-80 rounded-full border border-fuchsia-300/14 sm:block" />
      <div className="pointer-events-none absolute inset-x-0 top-1/2 hidden h-px bg-gradient-to-r from-transparent via-cyan-300/18 to-transparent sm:block" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-[#050712]/32 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#050712]/32 to-transparent" />
      <div className="relative mx-auto w-full px-4 py-9 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <span className="inline-flex rounded-md border border-cyan-200/20 bg-cyan-300/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.24em] text-cyan-100">
                Smart picks
              </span>
              <h2 className="mt-4 text-3xl font-black leading-[1.03] tracking-[-0.04em] text-white sm:text-5xl lg:text-6xl">
                Recommended Smartphones
              </h2>
              <p className="mt-4 max-w-xl text-sm font-semibold leading-6 text-cyan-50/72 sm:text-base">
                Picks shaped by your recent browsing and live smartphone demand
                signals.
              </p>
            </div>

            <p className="hidden max-w-xs rounded-lg border border-white/10 bg-white/[0.055] p-4 text-xs font-bold leading-5 text-cyan-50/70 backdrop-blur-xl sm:block">
              The rail adapts as people compare, shortlist, and search across
              Hooks.
            </p>
          </div>

          {showEmpty ? (
            <div className="mt-8 rounded-lg border border-cyan-200/14 bg-white/[0.055] px-6 py-8 text-center text-sm font-semibold text-cyan-50/70 backdrop-blur-xl">
              Browse a smartphone to unlock recommendations.
            </div>
          ) : null}

          <div className="mt-7 flex items-center gap-3 sm:mt-8 sm:gap-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-300/35 to-transparent" />
            <span className="whitespace-nowrap rounded-md border border-white/10 bg-white/[0.06] px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-100/70 sm:tracking-[0.28em]">
              Personalized picks
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-fuchsia-300/30 to-transparent" />
          </div>

          <div className="no-scrollbar mt-5 flex snap-x snap-mandatory items-stretch gap-3 overflow-x-auto pb-2 pr-8 sm:mt-6 sm:gap-4 sm:pr-12 md:gap-5">
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
                    metaLabel={device.brand || "Recommended pick"}
                    priceLabel={
                      formatPriceLabel(device.price) !== "Price not available"
                        ? formatPriceLabel(device.price)
                        : "View details"
                    }
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
