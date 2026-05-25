// src/components/PopularBrands.jsx
import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useDevice } from "../../hooks/useDevice";
import useRevealAnimation from "../../hooks/useRevealAnimation";
// import RecommendedSmartphones from "./RecommendedSmartphones";
import { buildPublicSmartphoneBrandPath as buildSmartphoneBrandPath } from "../../utils/smartphoneListingRoutes";
import { FaArrowRight } from "react-icons/fa";
import "../../styles/hideScrollbar.css";

const getBrandMetaLabel = (brand) => {
  const category = String(
    brand?.category ||
      brand?.originalBrand?.category ||
      brand?.originalBrand?.product_type ||
      "",
  ).toLowerCase();

  if (category.includes("smart") || category.includes("mobile")) {
    return "Smartphones";
  }
  if (category.includes("lap") || category.includes("computer")) {
    return "Laptops";
  }
  if (
    category.includes("appliance") ||
    category.includes("television") ||
    category.includes("tv")
  ) {
    return "TVs";
  }
  if (
    category.includes("network") ||
    category.includes("router") ||
    category.includes("wifi")
  ) {
    return "Networking";
  }

  return "Browse brand";
};

const getBrandShortLabel = (name) =>
  String(name || "Brand")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

const BRAND_TONES = [
  {
    accent: "from-cyan-300 via-sky-500 to-blue-600",
    glow: "bg-cyan-300/18",
    chip: "border-cyan-200/18 bg-cyan-300/10 text-cyan-50",
    logo: "from-cyan-300/14 via-sky-500/10 to-blue-600/12",
  },
  {
    accent: "from-blue-300 via-indigo-500 to-violet-600",
    glow: "bg-blue-300/18",
    chip: "border-blue-200/18 bg-blue-300/10 text-blue-50",
    logo: "from-blue-300/14 via-indigo-500/10 to-violet-600/12",
  },
  {
    accent: "from-fuchsia-300 via-purple-500 to-blue-500",
    glow: "bg-fuchsia-300/18",
    chip: "border-fuchsia-200/18 bg-fuchsia-300/10 text-fuchsia-50",
    logo: "from-fuchsia-300/14 via-purple-500/10 to-blue-500/12",
  },
  {
    accent: "from-sky-300 via-cyan-500 to-emerald-400",
    glow: "bg-sky-300/18",
    chip: "border-sky-200/18 bg-sky-300/10 text-sky-50",
    logo: "from-sky-300/14 via-cyan-500/10 to-emerald-400/12",
  },
];

const getBrandTone = (metaLabel, index) => {
  if (metaLabel === "Smartphones") return BRAND_TONES[2];
  if (metaLabel === "Laptops") return BRAND_TONES[0];
  if (metaLabel === "TVs") return BRAND_TONES[1];
  if (metaLabel === "Networking") return BRAND_TONES[3];
  return BRAND_TONES[index % BRAND_TONES.length];
};

const BrandCard = ({ brand, index, isActive, isLoaded, onClick }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const metaLabel = getBrandMetaLabel(brand);
  const rank = String(index + 1).padStart(2, "0");
  const shortLabel = getBrandShortLabel(brand.name);
  const tone = getBrandTone(metaLabel, index);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative w-[72vw] max-w-[13.5rem] shrink-0 overflow-hidden rounded-lg border p-[1px] text-left text-white backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 sm:w-[13.5rem] sm:max-w-none ${
        isActive
          ? `border-cyan-200/45 bg-gradient-to-br ${tone.accent} shadow-[0_22px_70px_rgba(14,165,233,0.2)]`
          : "border-white/10 bg-white/[0.08] shadow-[0_18px_60px_rgba(2,6,23,0.12)] hover:border-cyan-200/30 hover:bg-white/[0.12]"
      } ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
      style={{ transitionDelay: `${index * 40}ms` }}
    >
      <span
        className={`pointer-events-none absolute right-[-36%] top-[-48%] h-32 w-32 rounded-full ${tone.glow} blur-3xl transition group-hover:scale-125`}
      />
      <span
        className={`pointer-events-none absolute left-[-42%] bottom-[-60%] h-36 w-36 rounded-full bg-gradient-to-br ${tone.accent} opacity-[0.12] blur-3xl transition group-hover:opacity-[0.18]`}
      />

      <div className="relative z-10 flex min-h-[148px] flex-col justify-between gap-4 rounded-[7px] bg-[#071126]/72 p-3 ring-1 ring-white/[0.04] transition duration-300 group-hover:bg-[#0B1733]/78">
        <span
          className={`pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${tone.accent} opacity-80`}
        />
        <span className="pointer-events-none absolute bottom-4 right-4 text-5xl font-black leading-none text-white/[0.035] transition group-hover:text-white/[0.06]">
          {shortLabel || rank}
        </span>

        <div className="flex items-start justify-between gap-3">
          <div
            className={`relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-gradient-to-br ${tone.logo} transition-colors duration-300 ${
              isActive
                ? "border-cyan-200/38 bg-white/[0.14]"
                : "border-cyan-200/14 bg-[#061225]/68 group-hover:border-cyan-200/30"
            }`}
          >
            <span className="absolute inset-x-3 bottom-2 h-5 rounded-full bg-cyan-100/18 blur-xl" />
            {brand.logo && !imageFailed ? (
              <img
                src={brand.logo}
                alt={brand.name || "brand"}
                loading="lazy"
                decoding="async"
                className="relative h-12 w-12 object-contain p-1 transition-transform duration-300 group-hover:scale-110"
                onError={() => {
                  setImageFailed(true);
                }}
              />
            ) : (
              <span className="relative text-base font-black tracking-wide text-cyan-100/72">
                {shortLabel}
              </span>
            )}
          </div>

          <span className="flex flex-col items-end gap-1.5">
            <span className="rounded-md border border-white/10 bg-white/[0.06] px-2 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-cyan-100/62">
              {rank}
            </span>
            <span
              className={`rounded-md border px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em] ${tone.chip}`}
            >
              {metaLabel}
            </span>
          </span>
        </div>

        <div className="min-w-0">
          <p className="truncate text-base font-black leading-snug text-white transition-colors duration-300">
            {brand.name}
          </p>
          <p className="mt-1 flex items-center gap-2 text-[11px] font-semibold text-cyan-100/58 transition-colors duration-300">
            <span
              className={`h-1.5 w-1.5 rounded-full bg-gradient-to-r ${tone.accent}`}
            />
            Brand lane ready
          </p>
        </div>

        <span className="flex items-center justify-between gap-2 border-t border-white/10 pt-2.5">
          <span className="text-xs font-bold text-blue-100/68">
            Explore
          </span>
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-r ${tone.accent} text-white opacity-70 shadow-[0_12px_28px_rgba(14,165,233,0.14)] transition group-hover:opacity-100`}
            aria-hidden="true"
          >
            <FaArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-0.5" />
          </span>
        </span>
      </div>
    </button>
  );
};

const PopularBrands = () => {
  const [activeBrand, setActiveBrand] = useState(null);
  const navigate = useNavigate();
  const isLoaded = useRevealAnimation();

  const deviceCtx = useDevice();
  const allBrands = useMemo(() => deviceCtx?.brands || [], [deviceCtx?.brands]);

  // Get unique individual brands for horizontal scrolling
  const uniqueBrands = useMemo(() => {
    const seen = new Set();
    const brandsList = [];

    allBrands.forEach((brand) => {
      const brandName = brand.name?.trim();
      if (brandName && !seen.has(brandName.toLowerCase())) {
        seen.add(brandName.toLowerCase());

        brandsList.push({
          id: brand.id || brandName.toLowerCase().replace(/\s+/g, "-"),
          name: brandName,
          logo: brand.logo || brand.image || "",
          slug: brand.slug || brandName.toLowerCase().replace(/\s+/g, "-"),
          category: brand.category || brand.product_type || "",
          originalBrand: brand,
        });
      }
    });

    return brandsList.sort((a, b) => a.name.localeCompare(b.name));
  }, [allBrands]);

  const handleBrandClick = (brandId, brandData = null) => {
    setActiveBrand(brandId);

    if (brandData) {
      // Handle individual brand click
      const brandSlug =
        brandData.originalBrand.slug ||
        brandData.name.toLowerCase().replace(/\s+/g, "-");
      const category = (brandData.originalBrand.category || "").toLowerCase();

      if (category.includes("smart") || category.includes("mobile")) {
        navigate(buildSmartphoneBrandPath(brandSlug));
      } else if (
        category.includes("lap") ||
        category.includes("laptop") ||
        category.includes("computer")
      ) {
        navigate(`/laptops?brand=${encodeURIComponent(brandSlug)}`);
      } else if (
        category.includes("appliance") ||
        category.includes("home") ||
        category.includes("television") ||
        category.includes("tv")
      ) {
        navigate(`/tvs?brand=${encodeURIComponent(brandSlug)}`);
      } else if (
        category.includes("network") ||
        category.includes("router") ||
        category.includes("wifi")
      ) {
        navigate(`/networking?brand=${encodeURIComponent(brandSlug)}`);
      } else {
        navigate(`/products?brand=${encodeURIComponent(brandSlug)}`);
      }
    } else {
      // Handle category click
      if (brandId === "all") {
        navigate("/brands");
      } else {
        navigate(`/products?category=${brandId}`);
      }
    }
  };

  return (
    <section
      className={`relative overflow-hidden bg-[#02030B] text-white transition-all duration-700 ${
        isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
    >
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#020617_0%,#080E2A_30%,#1D1450_56%,#063D83_80%,#050712_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(14,165,233,0.22),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(168,85,247,0.3),transparent_34%),radial-gradient(circle_at_54%_82%,rgba(59,130,246,0.2),transparent_40%)]" />
      <div className="absolute left-[-52%] top-[10%] h-28 w-[34rem] -rotate-12 rounded-[999px] bg-gradient-to-r from-cyan-400/12 via-blue-500/18 to-fuchsia-500/14 blur-2xl sm:left-[-18%] sm:h-32 sm:w-[58rem]" />
      <div className="absolute right-[-68%] bottom-[10%] h-32 w-[34rem] rotate-12 rounded-[999px] bg-gradient-to-r from-purple-600/18 via-blue-500/16 to-sky-400/12 blur-2xl sm:right-[-22%] sm:h-40 sm:w-[54rem]" />
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-35 mix-blend-screen sm:opacity-70"
        viewBox="0 0 1440 520"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="brandTrace" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#22D3EE" stopOpacity="0" />
            <stop offset="48%" stopColor="#60A5FA" stopOpacity="0.54" />
            <stop offset="100%" stopColor="#D946EF" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M-80 130H180C244 130 252 212 318 212H508C586 212 592 92 674 92H832C918 92 934 194 1016 194H1520"
          stroke="url(#brandTrace)"
          strokeWidth="2"
          fill="none"
        />
        <path
          d="M-90 420H190C260 420 286 340 356 340H560C638 340 660 456 736 456H958C1034 456 1058 376 1138 376H1530"
          stroke="url(#brandTrace)"
          strokeWidth="2"
          fill="none"
        />
      </svg>
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#02030B] to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-10 sm:px-6 sm:pb-16 sm:pt-14 lg:px-8 lg:pb-20 lg:pt-20">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-end">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-md border border-cyan-200/20 bg-blue-500/12 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.1em] text-blue-100 shadow-[0_0_32px_rgba(14,165,233,0.14)] backdrop-blur sm:text-[11px]">
              Brand Radar
            </p>

            <h2 className="mt-5 text-[2rem] font-black leading-[1.02] text-white sm:text-4xl lg:text-5xl">
              Choose a brand
              <span className="block bg-gradient-to-r from-sky-200 via-white to-fuchsia-200 bg-clip-text text-transparent">
                before the model.
              </span>
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-blue-100/70 sm:text-base sm:leading-7">
              Browse the labels people keep checking across phones, laptops,
              TVs, and networking gear.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 rounded-lg border border-cyan-200/14 bg-white/[0.055] p-3 backdrop-blur-xl sm:max-w-xl lg:justify-self-end">
            {[
              ["Brands", uniqueBrands.length],
              [
                "Mobile",
                uniqueBrands.filter(
                  (brand) => getBrandMetaLabel(brand) === "Smartphones",
                ).length,
              ],
              [
                "More",
                uniqueBrands.filter(
                  (brand) => getBrandMetaLabel(brand) !== "Smartphones",
                ).length,
              ],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-md border border-white/10 bg-[#071126]/58 px-3 py-3 text-center"
              >
                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-cyan-100/48">
                  {label}
                </p>
                <p className="mt-1 text-xl font-black text-white">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex items-center gap-4 sm:mt-10">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-200/44 to-transparent" />
          <span className="whitespace-nowrap text-[10px] font-black uppercase tracking-[0.24em] text-cyan-100/58 sm:text-xs">
            Brand Radar
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-fuchsia-200/36 to-transparent" />
        </div>

        {uniqueBrands.length > 0 && (
          <div className="relative mt-6">
            <div className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2">
              {uniqueBrands.map((brand, index) => {
                const isActive = activeBrand === brand.id;

                return (
                  <BrandCard
                    key={brand.id}
                    brand={brand}
                    index={index}
                    isActive={isActive}
                    isLoaded={isLoaded}
                    onClick={() => handleBrandClick(brand.id, brand)}
                  />
                );
              })}
            </div>
            <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#02030B] via-[#02030B]/70 to-transparent" />
          </div>
        )}

        {/* <RecommendedSmartphones /> */}
      </div>
    </section>
  );
};

export default PopularBrands;
