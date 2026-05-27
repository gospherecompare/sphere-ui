// src/components/PopularBrands.jsx
import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowRight } from "react-icons/fa";
import { useDevice } from "../../hooks/useDevice";
import useRevealAnimation from "../../hooks/useRevealAnimation";
// import RecommendedSmartphones from "./RecommendedSmartphones";
import { buildPublicSmartphoneBrandPath as buildSmartphoneBrandPath } from "../../utils/smartphoneListingRoutes";
import "../../styles/hideScrollbar.css";

const getBrandShortLabel = (name) =>
  String(name || "Brand")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

const BRAND_WAVE_OFFSETS = [-6, 10, -2, 14, 2, 8, -4, 12];

const BrandCard = ({ brand, index, isActive, isLoaded, onClick }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const shortLabel = getBrandShortLabel(brand.name);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Explore ${brand.name || "brand"}`}
      title={brand.name || "Brand"}
      className={`group relative flex h-16 w-28 shrink-0 snap-start items-center justify-center overflow-visible rounded-md text-white transition-all duration-300 hover:-translate-y-1 sm:h-24 sm:w-36 lg:w-40 ${
        isActive
          ? "opacity-100"
          : "opacity-80 hover:opacity-100"
      } ${isLoaded ? "translate-y-0" : "opacity-0 translate-y-2"}`}
      style={{
        marginTop: `${BRAND_WAVE_OFFSETS[index % BRAND_WAVE_OFFSETS.length]}px`,
        transitionDelay: `${index * 40}ms`,
      }}
    >
      <span className="pointer-events-none absolute left-1/2 top-1/2 h-11 w-20 -translate-x-1/2 -translate-y-1/2 rounded-md bg-white/[0.1] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_16px_34px_rgba(2,6,23,0.12)] backdrop-blur-sm transition-all duration-300 group-hover:bg-white/[0.14] sm:h-14 sm:w-24" />
      <span className="pointer-events-none absolute inset-x-5 bottom-2 h-6 rounded-full bg-cyan-100/[0.12] opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-100" />
      <span className="pointer-events-none absolute inset-x-8 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-100/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      {brand.logo && !imageFailed ? (
        <img
          src={brand.logo}
          alt=""
          loading="lazy"
          decoding="async"
          className="relative z-10 max-h-11 max-w-[88px] object-contain drop-shadow-[0_18px_26px_rgba(2,6,23,0.22)] transition-transform duration-300 group-hover:scale-110 sm:max-h-14 sm:max-w-[116px]"
          onError={() => {
            setImageFailed(true);
          }}
        />
      ) : (
        <span className="relative z-10 text-xl font-black tracking-wide text-cyan-100/72 transition-transform duration-300 group-hover:scale-110 sm:text-2xl">
          {shortLabel}
        </span>
      )}
      <span className="sr-only">{brand.name || "Brand"}</span>
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
      className={`relative overflow-hidden bg-[#050712] text-white transition-all duration-700 ${
        isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
    >
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#073C8C_0%,#24105E_34%,#0B1547_62%,#073C8C_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_14%,rgba(34,211,238,0.28),transparent_31%),radial-gradient(circle_at_82%_16%,rgba(217,70,239,0.28),transparent_34%),radial-gradient(circle_at_52%_86%,rgba(59,130,246,0.2),transparent_42%)]" />
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
      <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-[#050712]/28 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#050712]/26 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4 pb-8 pt-8 sm:px-6 sm:pb-12 sm:pt-10 lg:px-8 lg:pb-14 lg:pt-12">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-md border border-cyan-200/20 bg-cyan-300/10 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-cyan-100 shadow-[0_0_32px_rgba(14,165,233,0.14)] backdrop-blur sm:text-[11px]">
              Popular Brands
            </p>

            <h2 className="mt-4 text-3xl font-black leading-[1.02] tracking-[-0.035em] text-white sm:text-4xl lg:text-5xl">
              Explore Top Brands
            </h2>
            <p className="mt-3 max-w-xl text-sm font-medium leading-6 text-cyan-50/72 sm:text-base">
              Browse products from the brands people search and compare most.
            </p>
          </div>

          <div className="flex w-full flex-wrap gap-3 sm:w-auto sm:justify-end">
            <span className="inline-flex items-center rounded-md border border-white/10 bg-white/[0.055] px-3 py-2 text-xs font-black text-cyan-50/72 backdrop-blur">
              {uniqueBrands.length} brands
            </span>
            <button
              type="button"
              onClick={() => navigate("/brands")}
              className="inline-flex items-center gap-2 rounded-md border border-cyan-200/18 bg-cyan-300/10 px-3 py-2 text-xs font-black text-cyan-50/86 transition hover:border-fuchsia-200/30 hover:bg-fuchsia-400/12 hover:text-white"
            >
              View all brands
              <FaArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>

        <div className="mt-7 flex items-center gap-4 sm:mt-8">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-200/44 to-transparent" />
          <span className="whitespace-nowrap rounded-md border border-white/10 bg-white/[0.055] px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-cyan-100/62 backdrop-blur sm:text-xs">
            Choose a brand
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-fuchsia-200/36 to-transparent" />
        </div>

        {uniqueBrands.length > 0 && (
          <div className="relative mt-5 overflow-hidden py-8 sm:mt-6 sm:py-10">
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-36 w-[42rem] -translate-x-1/2 -translate-y-1/2 rounded-[999px] border border-cyan-200/12 bg-white/[0.025] blur-[0.2px]" />
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-20 w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-[999px] border border-fuchsia-200/12" />
            <div className="pointer-events-none absolute left-0 right-0 top-1/2 h-px bg-gradient-to-r from-transparent via-cyan-200/32 to-transparent" />
            <div className="pointer-events-none absolute left-10 right-10 top-[calc(50%+18px)] h-px bg-gradient-to-r from-transparent via-fuchsia-200/18 to-transparent" />
            <div className="pointer-events-none absolute left-20 right-20 top-[calc(50%-22px)] h-px bg-gradient-to-r from-transparent via-blue-200/16 to-transparent" />
            <span className="pointer-events-none absolute left-[12%] top-[calc(50%-4px)] h-2 w-2 rounded-full bg-cyan-200/60 shadow-[0_0_22px_rgba(34,211,238,0.6)]" />
            <span className="pointer-events-none absolute right-[16%] top-[calc(50%+16px)] h-2 w-2 rounded-full bg-fuchsia-200/50 shadow-[0_0_22px_rgba(217,70,239,0.5)]" />
            <div className="no-scrollbar relative z-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-2 pb-4 pr-14 sm:gap-7 sm:px-4 sm:pr-20">
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
          </div>
        )}

        {/* <RecommendedSmartphones /> */}
      </div>
    </section>
  );
};

export default PopularBrands;
