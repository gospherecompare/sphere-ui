import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LuArrowRight,
  LuBoxes,
  LuFlame,
  LuGitCompareArrows,
  LuRefreshCcw,
  LuSparkles,
  LuStar,
  LuTrendingUp,
  LuUsers,
} from "react-icons/lu";
import useRevealAnimation from "../../hooks/useRevealAnimation";
import { buildCanonicalComparePath } from "../../utils/compareRoutes";
import { readPreloadedApiResponse } from "../../utils/preloadedApi";
import { createProductPath } from "../../utils/slugGenerator";

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL || "https://api.apisphere.in"
).replace(/\/$/, "");
const SEARCH_POPULARITY_ENDPOINT = `${API_BASE}/api/public/search-popularity?productType=smartphone&limit=25`;
const SMARTPHONES_ENDPOINT = `${API_BASE}/api/smartphones`;

const HERO_KPIS = [
  { label: "Devices", value: "250K+", icon: LuBoxes },
  { label: "Benchmarks", value: "1M+", icon: LuUsers },
  { label: "Reviews", value: "50K+", icon: LuStar },
  { label: "Daily Updates", value: "Daily", icon: LuRefreshCcw },
];

const EMPTY_DEVICE = {
  id: "live-device",
  name: "Live device",
  brand: "Hooks",
  brandLogo: "",
  image: "",
  detailPath: "/smartphones",
  score: 88,
  rank: 0,
  compareCount: 0,
  viewCount: 0,
};

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
      toText(value?.title) ||
      toText(value?.display) ||
      ""
    );
  }
  const text = String(value).trim();
  if (!text || /^(null|undefined|n\/a|na)$/i.test(text)) return "";
  return text.replace(/\s+/g, " ");
};

const firstText = (...values) => {
  for (const value of values) {
    const normalized = toText(value);
    if (normalized) return normalized;
  }
  return "";
};

const normalizeSmartphoneDetailPath = (rawPath = "", fallbackName = "") => {
  const pathValue = String(rawPath || "").trim();
  if (pathValue) {
    try {
      const url = new URL(pathValue, "https://hooks.local");
      const pathname = url.pathname.replace(/\/+$/g, "");
      if (pathname.startsWith("/smartphones/")) {
        const slug = pathname.slice("/smartphones/".length);
        if (slug && !slug.includes("/")) {
          return createProductPath("smartphones", slug);
        }
      }
    } catch {
      // Fall back to the product name if the incoming path is malformed.
    }
  }

  return fallbackName
    ? createProductPath("smartphones", fallbackName)
    : "/smartphones";
};

const normalizeHeroScore = (value, fallback = 88) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  if (numeric <= 1)
    return Math.max(84, Math.min(97, Math.round(numeric * 100)));
  if (numeric <= 10)
    return Math.max(84, Math.min(97, Math.round(numeric * 10)));
  if (numeric > 100) {
    const normalized = 78 + Math.log10(Math.max(1, numeric)) * 6;
    return Math.max(84, Math.min(97, Math.round(normalized)));
  }
  return Math.max(84, Math.min(97, Math.round(numeric)));
};

const getInitials = (value = "") => {
  const parts = String(value).split(/\s+/).filter(Boolean).slice(0, 2);

  if (!parts.length) return "HK";
  return parts.map((part) => part.charAt(0).toUpperCase()).join("");
};

const mapSearchDevices = (payload) => {
  const rows = Array.isArray(payload?.devices)
    ? payload.devices
    : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload)
        ? payload
        : [];

  return rows
    .map((device, index) => {
      const name = firstText(device?.name, device?.product_name);
      if (!name) return null;

      return {
        id: device?.product_id ?? device?.id ?? `hero-device-${index + 1}`,
        name,
        brand: firstText(device?.brand_name, device?.brand, "Smartphone"),
        brandLogo: firstText(
          device?.brand_logo,
          device?.brandLogo,
          device?.brand_logo_url,
          device?.brandLogoUrl,
        ),
        image: firstText(
          device?.image_url,
          device?.image,
          device?.product_image,
          device?.images?.[0],
        ),
        detailPath: normalizeSmartphoneDetailPath(device?.detail_path, name),
        score: normalizeHeroScore(
          device?.search_popularity_score ?? device?.hero_score,
          92 - index,
        ),
        rank: Number(device?.hero_rank) || index + 1,
        compareCount: Number(device?.compare_count_30d) || 0,
        viewCount: Number(device?.views_30d) || 0,
        badge: firstText(device?.badge, "Popular"),
      };
    })
    .filter(Boolean);
};

const getCatalogRows = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.smartphones)) return payload.smartphones;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.rows)) return payload.rows;
  return [];
};

const normalizeLookupKey = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const hydrateHeroDevicesWithCatalog = (devices = [], payload) => {
  const rows = getCatalogRows(payload);
  if (!rows.length) return devices;

  const byId = new Map();
  const byName = new Map();

  rows.forEach((row) => {
    const rowId = row?.product_id ?? row?.productId ?? row?.id ?? null;
    const rowName = firstText(row?.name, row?.product_name, row?.model);
    const normalized = {
      brandLogo: firstText(
        row?.brand_logo,
        row?.brandLogo,
        row?.brand_logo_url,
        row?.brandLogoUrl,
      ),
      image: firstText(
        row?.image,
        row?.image_url,
        row?.product_image,
        row?.images?.[0],
      ),
    };

    if (rowId != null) byId.set(String(rowId), normalized);
    if (rowName) byName.set(normalizeLookupKey(rowName), normalized);
  });

  return devices.map((device) => {
    const match =
      byId.get(String(device.id)) ||
      byName.get(normalizeLookupKey(device.name));
    if (!match) return device;

    return {
      ...device,
      brandLogo: device.brandLogo || match.brandLogo || "",
      image: device.image || match.image || "",
    };
  });
};

const selectHeroPair = (devices = []) => {
  const sorted = devices.slice().sort((left, right) => {
    if ((right.compareCount || 0) !== (left.compareCount || 0)) {
      return (right.compareCount || 0) - (left.compareCount || 0);
    }
    if ((right.viewCount || 0) !== (left.viewCount || 0)) {
      return (right.viewCount || 0) - (left.viewCount || 0);
    }
    if ((right.score || 0) !== (left.score || 0)) {
      return (right.score || 0) - (left.score || 0);
    }
    return (left.rank || 999) - (right.rank || 999);
  });

  if (!sorted.length) return [EMPTY_DEVICE, EMPTY_DEVICE];

  const primary = sorted[0];
  const secondary =
    sorted.find(
      (device) =>
        String(device?.id) !== String(primary?.id) &&
        String(device?.brand || "").toLowerCase() !==
          String(primary?.brand || "").toLowerCase(),
    ) ||
    sorted.find((device) => String(device?.id) !== String(primary?.id)) ||
    primary;

  return [primary, secondary];
};

const splitDeviceName = (name = "") => {
  const words = String(name).split(/\s+/).filter(Boolean);
  if (words.length <= 2) return [name];
  if (words.length === 3) return [words.slice(0, 2).join(" "), words[2]];

  const midpoint = Math.ceil(words.length / 2);
  return [words.slice(0, midpoint).join(" "), words.slice(midpoint).join(" ")];
};

const getBrandPillTone = (brand = "") => {
  const value = String(brand).toLowerCase();
  if (value.includes("samsung"))
    return "bg-blue-500/20 text-blue-200 ring-blue-400/20";
  if (value.includes("apple"))
    return "bg-violet-500/20 text-violet-200 ring-violet-400/20";
  if (value.includes("oneplus"))
    return "bg-rose-500/20 text-rose-200 ring-rose-400/20";
  if (value.includes("realme"))
    return "bg-amber-500/20 text-amber-100 ring-amber-400/20";
  if (value.includes("oppo"))
    return "bg-emerald-500/20 text-emerald-100 ring-emerald-400/20";
  if (value.includes("pixel") || value.includes("google"))
    return "bg-cyan-500/20 text-cyan-100 ring-cyan-400/20";
  return "bg-white/10 text-white/75 ring-white/10";
};

const getChipTone = (brand = "") => {
  const value = String(brand).toLowerCase();
  if (value.includes("samsung")) return "bg-blue-400";
  if (value.includes("apple")) return "bg-violet-400";
  if (value.includes("oneplus")) return "bg-rose-400";
  if (value.includes("realme")) return "bg-amber-300";
  if (value.includes("oppo")) return "bg-emerald-300";
  if (value.includes("google") || value.includes("pixel")) return "bg-cyan-300";
  return "bg-white/60";
};

const HeroScoreBar = ({ score }) => (
  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
    <div
      className="h-full rounded-full bg-gradient-to-r from-[#7C3AED] to-[#2563EB]"
      style={{ width: `${Math.max(0, Math.min(100, Number(score) || 0))}%` }}
    />
  </div>
);

const HeroPhoneArtwork = ({ device, align = "left" }) => {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div className="relative flex h-[172px] w-full items-center justify-center overflow-hidden rounded-[24px] bg-[radial-gradient(circle_at_50%_10%,rgba(124,58,237,0.16),transparent_54%),linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.01))]">
      <div
        className={`absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(124,58,237,0.12),transparent_55%)] ${
          align === "right" ? "opacity-70" : "opacity-100"
        }`}
      />
      {device.image && !imageFailed ? (
        <img
          src={device.image}
          alt={device.name}
          className="relative z-10 h-full w-full object-contain p-3"
          loading="lazy"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div className="relative z-10 flex h-24 w-24 items-center justify-center rounded-[28px] bg-gradient-to-br from-[#7C3AED] to-[#2563EB] text-3xl font-bold text-white shadow-[0_20px_45px_rgba(37,99,235,0.22)]">
          {getInitials(device.name)}
        </div>
      )}
    </div>
  );
};

const BrandLogoImage = ({
  brand = "",
  brandLogo = "",
  className = "h-3.5 w-auto max-w-[42px] object-contain opacity-95",
}) => {
  const [logoFailed, setLogoFailed] = useState(false);
  if (!brandLogo || logoFailed) return null;

  return (
    <img
      src={brandLogo}
      alt={brand}
      className={className}
      loading="lazy"
      onError={() => setLogoFailed(true)}
    />
  );
};

const BrandPill = ({ brand, brandLogo = "" }) => {
  const showLogo = Boolean(brandLogo);

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-medium ring-1 ${getBrandPillTone(
        brand,
      )}`}
    >
      {showLogo ? <BrandLogoImage brand={brand} brandLogo={brandLogo} /> : null}
      <span>{brand}</span>
    </span>
  );
};

const HeroScoreCard = ({ score, align = "left" }) => (
  <div
    className={`mt-4 w-full max-w-[168px] rounded-[18px] border border-white/10 bg-[rgba(8,15,32,0.78)] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] ${
      align === "right" ? "ml-auto" : ""
    }`}
  >
    <div
      className={`flex items-end gap-3 ${
        align === "right" ? "justify-end" : "justify-start"
      }`}
    >
      <span className="text-[50px] font-semibold leading-none tracking-[-0.04em] text-white">
        {score}
      </span>
      <div
        className={`pb-0.5 ${align === "right" ? "text-right" : "text-left"}`}
      >
        <p className="text-[11px] font-medium leading-none text-white/80">
          HookScore
        </p>
        <p className="mt-1 text-[11px] font-medium leading-none text-white/48">
          Out of 100
        </p>
      </div>
    </div>
    <HeroScoreBar score={score} />
  </div>
);

const HeroDevicePanel = ({ device, align = "left", onClick }) => {
  const alignment =
    align === "right" ? "items-end text-right" : "items-start text-left";
  const titleLines = splitDeviceName(device.name || "");
  const headerDirection = align === "right" ? "flex-row-reverse" : "flex-row";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex h-full w-full flex-col justify-between ${alignment} rounded-[24px] px-5 py-4 transition-all duration-300`}
    >
      <div className="w-full">
        <div className={`flex items-start gap-3 ${headerDirection}`}>
          <div
            className={`flex ${
              align === "right" ? "justify-end" : "justify-start"
            }`}
          >
            <BrandLogoImage
              brand={device.brand}
              brandLogo={device.brandLogo}
              className="h-7 w-auto max-w-[30px] object-contain opacity-95"
            />
          </div>
          <div className="min-w-0">
            <div className="space-y-1">
              {titleLines.map((line) => (
                <h6
                  key={`${device.id}-${line}`}
                  className="text-[28px] font-semibold leading-[1.06] tracking-[-0.03em] text-white md:text-[18px]"
                  style={{
                    textShadow:
                      "0 1px 0 rgba(255,255,255,0.06), 0 0 18px rgba(37,99,235,0.08)",
                  }}
                >
                  {line}
                </h6>
              ))}
            </div>
            <div
              className={`mt-3 ${align === "right" ? "flex justify-end" : ""}`}
            >
              <BrandPill brand={device.brand} brandLogo="" />
            </div>
          </div>
        </div>

        <div className="mt-6">
          <HeroPhoneArtwork device={device} align={align} />
        </div>
      </div>

      <HeroScoreCard score={device.score} align={align} />
    </button>
  );
};

const HeroKpiCard = ({ icon: Icon, value, label }) => (
  <div className="flex min-h-[88px] items-center gap-4 rounded-[18px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.025))] px-4 py-4 backdrop-blur-xl">
    <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-gradient-to-br from-[#7C3AED]/38 to-[#2563EB]/32 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
      <Icon className="h-5 w-5" />
    </span>
    <div>
      <p className="text-[22px] font-bold leading-none text-white sm:text-[24px]">
        {value}
      </p>
      <p className="mt-1 text-sm font-medium text-white/62">{label}</p>
    </div>
  </div>
);

const HeroSection = () => {
  const navigate = useNavigate();
  const isLoaded = useRevealAnimation();
  const [heroDevices, setHeroDevices] = useState([]);

  useEffect(() => {
    let cancelled = false;
    const controller =
      typeof AbortController !== "undefined" ? new AbortController() : null;

    (async () => {
      try {
        const preloadedPopularity = readPreloadedApiResponse(
          SEARCH_POPULARITY_ENDPOINT,
        );
        const preloadedCatalog = readPreloadedApiResponse(SMARTPHONES_ENDPOINT);

        let popularityPayload = preloadedPopularity;
        let catalogPayload = preloadedCatalog;

        if (!popularityPayload) {
          const popularityResponse = await fetch(SEARCH_POPULARITY_ENDPOINT, {
            cache: "no-store",
            signal: controller?.signal,
          });
          if (popularityResponse.ok) {
            popularityPayload = await popularityResponse.json();
          }
        }

        if (!catalogPayload) {
          const catalogResponse = await fetch(SMARTPHONES_ENDPOINT, {
            cache: "force-cache",
            signal: controller?.signal,
          });
          if (catalogResponse.ok) {
            catalogPayload = await catalogResponse.json();
          }
        }

        if (cancelled) return;

        const mapped = mapSearchDevices(popularityPayload);
        setHeroDevices(hydrateHeroDevicesWithCatalog(mapped, catalogPayload));
      } catch {
        if (!cancelled) setHeroDevices([]);
      }
    })();

    return () => {
      cancelled = true;
      controller?.abort?.();
    };
  }, []);

  const [primaryDevice, secondaryDevice] = useMemo(
    () => selectHeroPair(heroDevices),
    [heroDevices],
  );

  const trendingSearches = useMemo(
    () =>
      heroDevices
        .slice()
        .sort((left, right) => (left.rank || 999) - (right.rank || 999))
        .slice(0, 6),
    [heroDevices],
  );

  const comparePath = useMemo(
    () =>
      buildCanonicalComparePath({
        leftName: primaryDevice?.name || "",
        rightName: secondaryDevice?.name || "",
      }),
    [primaryDevice?.name, secondaryDevice?.name],
  );

  return (
    <section
      className={`relative overflow-hidden bg-[linear-gradient(180deg,#020617_0%,#050816_38%,#0B1120_100%)] text-white transition-all duration-700 ${
        isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(124,58,237,0.16),transparent_22%),radial-gradient(circle_at_82%_24%,rgba(37,99,235,0.16),transparent_24%),radial-gradient(circle_at_90%_82%,rgba(124,58,237,0.18),transparent_18%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.06)_1px,transparent_1px)] [background-size:24px_24px] opacity-35 [mask-image:radial-gradient(circle_at_center,white,transparent_88%)]" />
      <div className="absolute inset-y-0 left-[26%] hidden w-[380px] bg-[radial-gradient(circle,rgba(124,58,237,0.12)_1px,transparent_1px)] [background-size:10px_10px] opacity-50 [mask-image:radial-gradient(circle_at_center,white,transparent_76%)] lg:block" />
      <div className="absolute inset-y-0 right-[-4%] hidden w-[360px] bg-[radial-gradient(circle,rgba(37,99,235,0.2)_1px,transparent_1px)] [background-size:10px_10px] opacity-55 [mask-image:radial-gradient(circle_at_center,white,transparent_78%)] lg:block" />
      <div className="pointer-events-none absolute inset-x-0 top-[34%] hidden lg:block">
        <svg
          viewBox="0 0 1440 260"
          className="h-[260px] w-full opacity-95"
          fill="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="hooksHeroWave" x1="0" y1="0" x2="1440" y2="0">
              <stop offset="0%" stopColor="rgba(124,58,237,0)" />
              <stop offset="34%" stopColor="#7C3AED" />
              <stop offset="68%" stopColor="#2563EB" />
              <stop offset="100%" stopColor="rgba(37,99,235,0)" />
            </linearGradient>
            <filter
              id="hooksHeroGlow"
              x="-20%"
              y="-80%"
              width="140%"
              height="260%"
            >
              <feGaussianBlur stdDeviation="7" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path
            d="M-40 178C108 217 194 224 308 188C431 150 503 67 652 90C794 113 868 226 1010 214C1145 203 1250 120 1480 146"
            stroke="url(#hooksHeroWave)"
            strokeWidth="3"
            strokeLinecap="round"
            filter="url(#hooksHeroGlow)"
          />
          <path
            d="M18 194C154 217 249 208 348 163C454 114 546 85 663 111C783 137 855 224 983 215C1112 206 1238 123 1454 137"
            stroke="rgba(124,58,237,0.46)"
            strokeWidth="1.5"
            strokeDasharray="2 10"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#0B1120] to-transparent" />

      <div className="relative mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="grid min-h-[560px] grid-cols-1 items-center gap-12 py-12 lg:grid-cols-[minmax(0,44%)_minmax(0,56%)] lg:gap-10 lg:py-14">
          <div className="w-full">
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(124,58,237,0.22)] bg-[rgba(124,58,237,0.14)] px-[14px] py-[8px] text-[12px] font-semibold uppercase tracking-[0.12em] text-violet-200">
              <LuSparkles className="h-3.5 w-3.5 text-violet-300" />
              Gadget Intelligence
            </div>

            <h1 className="mt-6 max-w-[680px] text-[42px] font-extrabold leading-[1.02] tracking-[-0.04em] text-white sm:text-[54px] lg:text-[68px]">
              Discover the best gadgets with{" "}
              <span className="bg-gradient-to-r from-[#7C3AED] to-[#2563EB] bg-clip-text text-transparent">
                gadget intelligence.
              </span>
            </h1>

            <p className="mt-6 max-w-[580px] text-base font-medium leading-8 text-white/72 sm:text-lg lg:text-[20px]">
              Real specifications. Benchmark performance. Expert reviews. All in
              one place.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <button
                type="button"
                onClick={() => navigate("/smartphones")}
                className="inline-flex h-[52px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#7C3AED] px-7 text-sm font-semibold text-white shadow-[0_12px_32px_rgba(124,58,237,0.22)] transition-transform duration-300 hover:-translate-y-0.5"
              >
                Explore Devices
                <LuArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => navigate(comparePath)}
                className="inline-flex h-[52px] items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/[0.05] px-7 text-sm font-semibold text-white backdrop-blur-xl transition-all duration-300 hover:bg-white/[0.08]"
              >
                Compare Now
                <LuGitCompareArrows className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-10">
              <div className="flex items-center gap-2 text-sm font-medium text-white/80">
                <LuTrendingUp className="h-4 w-4 text-violet-300" />
                Trending Searches
              </div>

              <div className="mt-4 flex gap-3 overflow-x-auto pb-2 no-scrollbar lg:flex-nowrap">
                {trendingSearches.map((item, index) => (
                  <button
                    key={item.id || `${item.name}-${index}`}
                    type="button"
                    onClick={() =>
                      navigate(
                        `/smartphones?q=${encodeURIComponent(item.name)}`,
                      )
                    }
                    className="inline-flex h-[34px] shrink-0 items-center gap-2 rounded-full border border-white/8 bg-white/[0.04] px-3.5 text-[12px] font-medium text-white/85 transition-all duration-300 hover:border-white/16 hover:bg-white/[0.07]"
                  >
                    {item.brandLogo ? (
                      <BrandLogoImage
                        brand={item.brand}
                        brandLogo={item.brandLogo}
                        className="h-3.5 w-auto max-w-[20px] object-contain opacity-95"
                      />
                    ) : index === 0 ? (
                      <LuFlame className="h-3.5 w-3.5 text-violet-300" />
                    ) : (
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${getChipTone(
                          item.brand,
                        )}`}
                      />
                    )}
                    {item.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="w-full">
            <div className="flex justify-end">
              <div className="grid w-full max-w-[718px] gap-4 lg:grid-cols-[minmax(0,520px)_170px] lg:items-stretch">
                <div className="relative rounded-[18px] border border-[rgba(37,99,235,0.72)] bg-[linear-gradient(180deg,rgba(5,10,27,0.92),rgba(8,14,30,0.96))] p-5 shadow-[0_0_0_1px_rgba(124,58,237,0.18),0_0_24px_rgba(37,99,235,0.14),0_18px_60px_rgba(3,7,18,0.58)] backdrop-blur-2xl">
                  <div className="absolute inset-0 rounded-[18px] bg-[radial-gradient(circle_at_18%_16%,rgba(124,58,237,0.08),transparent_24%),radial-gradient(circle_at_90%_20%,rgba(37,99,235,0.1),transparent_22%)]" />
                  <div className="pointer-events-none absolute inset-[1px] rounded-[17px] ring-1 ring-white/6" />
                  <div className="pointer-events-none absolute bottom-6 left-1/2 top-6 hidden w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-white/8 to-transparent lg:block" />

                  <div className="relative flex flex-col gap-3 lg:flex-row lg:items-stretch">
                    <HeroDevicePanel
                      device={primaryDevice}
                      align="left"
                      onClick={() =>
                        navigate(primaryDevice.detailPath || "/smartphones")
                      }
                    />

                    <div className="z-10 mx-auto flex h-[74px] w-[74px] shrink-0 items-center justify-center self-center rounded-full border border-violet-400/85 bg-[#091225] text-[20px] font-semibold text-white shadow-[0_0_34px_rgba(124,58,237,0.34)]">
                      VS
                    </div>

                    <HeroDevicePanel
                      device={secondaryDevice}
                      align="right"
                      onClick={() =>
                        navigate(secondaryDevice.detailPath || "/smartphones")
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
                  {HERO_KPIS.map((item) => (
                    <HeroKpiCard
                      key={item.label}
                      icon={item.icon}
                      value={item.value}
                      label={item.label}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
