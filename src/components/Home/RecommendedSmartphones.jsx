// src/components/Home/RecommendedSmartphones.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { generateSlug } from "../../utils/slugGenerator";
import useRevealAnimation from "../../hooks/useRevealAnimation";
import { FaMobileAlt } from "react-icons/fa";

const RECENT_STORAGE_KEY = "hooks_recent_smartphones_v1";
const FALLBACK_CACHE_KEY = "hooks_reco_fallback_cache_v1";
const SEED_STORAGE_KEY = "hooks_reco_seed_v1";
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
    <div className="inline-flex flex-col items-center justify-center rounded-md border border-violet-200 bg-violet-50/95 px-1.5 py-1 leading-none">
      <span className="text-[10px] font-bold text-violet-700">{label}</span>
      <span className="mt-0.5 text-[8px] font-semibold uppercase tracking-wide text-violet-600">
        Spec
      </span>
    </div>
  );
};

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

const RecommendedSmartphones = () => {
  const [recentDevices, setRecentDevices] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const isLoaded = useRevealAnimation();

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

    const fetchRecommendations = async () => {
      if (typeof window === "undefined") return;
      const recent = readRecent();
      if (!cancelled) setRecentDevices(recent);

      setLoading(true);
      try {
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

        const recentIds = new Set(recent.map((item) => String(item?.id ?? "")));

        const candidates = rows
          .map((row, index) => {
            const id =
              row.product_id ??
              row.productId ??
              row.id ??
              row.basic_info?.id ??
              null;
            return {
              id,
              name: getRowName(row),
              image: getRowImage(row),
              price: getRowPrice(row),
              brand: firstText(
                row?.brand,
                row?.brand_name,
                row?.basic_info?.brand_name,
              ),
              segment: getRowSegment(row),
              processor: getRowProcessor(row),
              cameraMp: parseCameraMp(getRowCamera(row)),
              score: getRowDisplayScore(row),
              _rowIndex: index,
            };
          })
          .filter((item) => item.name);

        const scored = candidates
          .filter((item) => !recentIds.has(String(item.id ?? "")))
          .map((item) => {
            const bestScore = recent.reduce((acc, r) => {
              const s = scoreSimilarity(item, r);
              return s > acc ? s : acc;
            }, 0);
            return { ...item, _score: bestScore };
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
          next = next.concat(
            filler.slice(0, MIN_RECOMMENDATIONS - next.length),
          );
        }

        if (next.length === 0 && recent.length > 0) {
          next = recent.slice(0, MAX_RECOMMENDATIONS);
        }

        if (next.length > 0) writeFallbackCache(next);
        if (!cancelled) setRecommended(next.slice(0, MAX_RECOMMENDATIONS));
      } catch (err) {
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
  }, []);

  const handleDeviceClick = (device) => {
    const basePath = "/smartphones";
    const rawName = device.name || String(device.id || "device");
    const slug = generateSlug(rawName || String(device.id || "device"));
    const params = new URLSearchParams();
    if (device.id) params.set("id", String(device.id));
    const qs = params.toString();
    navigate(`${basePath}/${slug}${qs ? `?${qs}` : ""}`);
  };

  const showEmpty = !loading && recommended.length === 0;

  const displayItems = useMemo(
    () => (recommended.length > 0 ? recommended : recentDevices),
    [recommended, recentDevices],
  );

  return (
    <div
      className={`px-2 lg:px-4 mx-auto bg-white max-w-4xl mb-5 w-full m-0 overflow-hidden pt-5 sm:pt-10 transition-all duration-700 ${
        isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
    >
      <div className="mb-6 px-2">
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            Recommended{" "}
            <span className="bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600 bg-clip-text text-transparent">
              For You
            </span>
          </h2>
        </div>
        <p className="text-sm text-gray-600">
          Recommendations tailored to your recent browsing.
        </p>
      </div>

      {showEmpty ? (
        <div className="px-2 text-sm text-gray-500">
          Browse a smartphone to unlock recommendations.
        </div>
      ) : null}

      <div className="flex overflow-x-auto gap-4 lg:gap-5 hide-scrollbar no-scrollbar scroll-smooth pb-6">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div
                key={`skeleton-${i}`}
                className="w-[220px] h-[200px] shrink-0 animate-pulse"
              >
                <div className="rounded-2xl bg-white p-3 shadow-sm">
                  <div className="bg-gray-200 rounded-xl w-full h-24 sm:h-32 lg:h-40 mb-3"></div>
                  <div className="h-3 bg-gray-200 rounded mb-2 w-4/5"></div>
                  <div className="h-4 bg-gray-200 rounded mb-3 w-full"></div>
                  <div className="h-3 bg-gray-200 rounded mb-2 w-2/3"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            ))
          : displayItems.map((device, i) => (
              <div
                key={`${device.id || "noid"}-${i}`}
                onClick={() => handleDeviceClick(device)}
                className={`group shrink-0 cursor-pointer transition-all duration-500 ${
                  isLoaded
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-2"
                }`}
                style={{ transitionDelay: `${i * 45}ms` }}
              >
                <div className="relative h-full w-32 rounded-lg overflow-hidden p-2 transition-all duration-200 group-hover:-translate-y-0.5">
                  <div className="flex h-full flex-col gap-2">
                    <div className="relative w-full flex-shrink-0">
                      {Number.isFinite(device.score) ? (
                        <div className="absolute left-1 top-1 z-10 pointer-events-none">
                          <TrendSpecScoreBadge score={device.score} />
                        </div>
                      ) : null}
                      <div className="mx-auto h-28 sm:h-32 w-28 rounded-md shadow-md border border-gray-100 overflow-hidden bg-gray-100 flex items-center justify-center">
                        {device.image ? (
                          <img
                            src={device.image}
                            alt={device.name}
                            className="h-full w-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                            onError={(e) => {
                              e.target.style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="text-center px-3">
                            <div className="mx-auto mb-1.5 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-gray-200">
                              <FaMobileAlt className="text-gray-400 text-sm" />
                            </div>
                            <span className="text-[11px] text-gray-500">
                              No image
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 text-left">
                      <h6 className="mt-1 text-sm sm:text-base font-semibold text-gray-900 leading-snug line-clamp-2 group-hover:text-purple-600 transition-colors duration-200">
                        {device.name}
                      </h6>
                    </div>
                  </div>
                </div>
              </div>
            ))}
      </div>
    </div>
  );
};

export default RecommendedSmartphones;
