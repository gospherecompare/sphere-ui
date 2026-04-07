// src/components/PopularBrands.jsx
import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useDevice } from "../../hooks/useDevice";
import useRevealAnimation from "../../hooks/useRevealAnimation";
import { FaChartLine, FaFire, FaTag } from "react-icons/fa";
import RecommendedSmartphones from "./RecommendedSmartphones";
import { buildSmartphoneBrandPath } from "../../utils/smartphoneListingRoutes";

const BRAND_PLACEHOLDER_LOGO =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Crect width='80' height='80' rx='12' fill='%23f3f4f6'/%3E%3Ctext x='40' y='46' font-family='Arial' font-size='10' text-anchor='middle' fill='%239ca3af'%3ELogo%3C/text%3E%3C/svg%3E";

const BrandCard = ({ brand, index, isActive, isLoaded, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex h-16 w-[84vw] max-w-[240px] shrink-0 snap-start items-center gap-0 rounded-2xl bg-transparent px-1 text-left transition-all duration-500 hover:-translate-y-0.5 sm:w-[255px] lg:w-[270px] ${
        isLoaded ? "opacity-100" : "opacity-0 translate-y-2"
      }`}
      style={{ transitionDelay: `${index * 45}ms` }}
    >
      <img
        src={brand.logo || BRAND_PLACEHOLDER_LOGO}
        alt={brand.name || "brand"}
        loading="lazy"
        decoding="async"
        className={`h-12 w-12 shrink-0 rounded-2xl object-contain p-1.5 transition-transform duration-300 sm:h-14 sm:w-14 sm:p-2 ${
          isActive ? "scale-105" : "scale-100 opacity-90"
        }`}
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = BRAND_PLACEHOLDER_LOGO;
        }}
      />

      <div className="min-w-0 flex h-14 flex-1 items-center">
        <span
          className={`block truncate text-xl font-black leading-none sm:text-[2rem] ${
            isActive ? "text-blue-700" : "text-slate-900"
          }`}
        >
          {brand.name}
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
      className={`relative isolate overflow-hidden transition-all duration-700 ${
        isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
    >
      <div className="relative px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="relative mx-auto max-w-5xl text-center">
          <h1 className="mt-6 text-3xl font-bold leading-tight text-slate-900 sm:text-4xl lg:text-5xl">
            Mobiles by{" "}
            <span className="bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 bg-clip-text text-transparent">
              Popular Brands
            </span>
          </h1>

          <p className="mx-auto mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base lg:text-lg">
            Jump into the brands people search for most and browse straight to
            their latest devices.
          </p>
        </div>

        <div className="mt-6 flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200  px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 ">
            <FaChartLine className="h-3.5 w-3.5 text-cyan-500" />
            Brand shortcuts
          </span>
          <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:inline-block" />
          <span className="max-w-xs text-center text-xs font-medium text-slate-500 sm:max-w-none sm:text-left">
            Tap any brand to jump to products instantly
          </span>
        </div>
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-12 sm:px-6 sm:pb-16 lg:px-8 lg:pb-20">
        {uniqueBrands.length > 0 && (
          <div className="mx-auto mt-8 max-w-6xl">
            <div className="no-scrollbar flex w-full flex-nowrap gap-0 overflow-x-auto pb-5 pt-0 snap-x snap-mandatory sm:gap-4">
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

        <RecommendedSmartphones />
      </div>
    </section>
  );
};

export default PopularBrands;
