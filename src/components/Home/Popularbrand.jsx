// src/components/PopularBrands.jsx
import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useDevice } from "../../hooks/useDevice";
import useRevealAnimation from "../../hooks/useRevealAnimation";
// import RecommendedSmartphones from "./RecommendedSmartphones";
import { buildPublicSmartphoneBrandPath as buildSmartphoneBrandPath } from "../../utils/smartphoneListingRoutes";
import { FaArrowRight } from "react-icons/fa";
import { HOME_SECTION_LEAD_LIGHT } from "./homeSectionTypography";

const BRAND_PLACEHOLDER_LOGO =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Crect width='80' height='80' rx='12' fill='%23f3f4f6'/%3E%3Ctext x='40' y='46' font-family='Arial' font-size='10' text-anchor='middle' fill='%239ca3af'%3ELogo%3C/text%3E%3C/svg%3E";

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

const BrandCard = ({ brand, index, isActive, isLoaded, onClick }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const metaLabel = getBrandMetaLabel(brand);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex min-w-[160px] sm:min-w-[180px] md:min-w-[200px] shrink-0 flex-col gap-2.5 rounded-2xl  bg-transparent sm:rounded-3xl p-4 sm:p-5 text-left shadow-[0_18px_45px_-30px_rgba(15,23,42,0.1)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_55px_-34px_rgba(15,23,42,0.18)] ${
        isActive ? "border-sky-200" : " hover:border-slate-300"
      } ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
      style={{ transitionDelay: `${index * 60}ms` }}
    >
      <div
        className={`flex h-32 w-full sm:h-40 lg:h-44 items-center justify-center overflow-hidden rounded-xl sm:rounded-2xl border transition-colors duration-300 ${
          isActive ? "border-sky-200 bg-white" : "border-slate-200 bg-slate-50"
        }`}
      >
        {brand.logo && !imageFailed ? (
          <img
            src={brand.logo}
            alt={brand.name || "brand"}
            loading="lazy"
            decoding="async"
            className="h-16 w-16 object-contain p-1 transition-transform duration-300 group-hover:scale-110 sm:h-20 sm:w-20"
            onError={() => {
              setImageFailed(true);
            }}
          />
        ) : (
          <span className="text-base sm:text-lg font-bold tracking-wide text-slate-400">
            {getBrandShortLabel(brand.name)}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p
          className={`truncate text-xs sm:text-sm font-bold leading-snug transition-colors duration-300 ${
            isActive ? "text-slate-900" : "text-slate-800"
          }`}
        >
          {brand.name}
        </p>
        <p
          className={`mt-0.5 text-[10px] sm:text-xs font-medium transition-colors duration-300 ${
            isActive ? "text-slate-600" : "text-slate-500"
          }`}
        >
          {metaLabel}
        </p>
      </div>

      <div
        className={`flex items-center justify-between gap-2 border-t pt-2.5 sm:pt-3 ${
          isActive ? "border-sky-200" : "border-slate-200"
        }`}
      >
        <span
          className={`text-[10px] sm:text-xs font-semibold transition-colors duration-300 ${
            isActive ? "text-slate-700" : "text-slate-600"
          }`}
        >
          Explore Brand
        </span>
        <span
          className={`transition-transform duration-300 group-hover:translate-x-1 ${
            isActive ? "text-slate-600" : "text-slate-500"
          }`}
          aria-hidden="true"
        >
          <FaArrowRight className="h-2.5 w-2.5 sm:h-3 sm:w-3.5" />
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
      className={`relative overflow-hidden border-t border-slate-200 bg-transparent transition-all duration-700 ${
        isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] [background-size:34px_34px] [mask-image:radial-gradient(circle_at_center,white,transparent_88%)]" />
      <div className="relative px-4 pt-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl text-center">
          <h1 className="text-[11px] font-bold uppercase tracking-[0.32em] text-purple-600 sm:text-xs">
            Popular Brands
          </h1>

          <p className={`${HOME_SECTION_LEAD_LIGHT} mt-4`}>
            Jump into top brands across smartphones, laptops, TVs, and home tech
            with a cleaner card-first browse.
          </p>
        </div>
      </div>

      <div className="mt-10 flex items-center gap-4">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-300 to-transparent" />
        <span className="whitespace-nowrap text-xs font-bold uppercase tracking-[0.3em] text-slate-500">
          Browse by Brand
        </span>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-300 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-6 sm:pb-16 lg:px-8 lg:pb-20">
        {uniqueBrands.length > 0 && (
          <div className="mx-auto mt-8 max-w-6xl">
            <div className="no-scrollbar flex w-full items-center gap-3 overflow-x-auto pb-2 pt-0 sm:gap-4 md:gap-5">
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
