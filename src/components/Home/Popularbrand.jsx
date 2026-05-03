// src/components/PopularBrands.jsx
import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useDevice } from "../../hooks/useDevice";
import useRevealAnimation from "../../hooks/useRevealAnimation";
import RecommendedSmartphones from "./RecommendedSmartphones";
import { buildSmartphoneBrandPath } from "../../utils/smartphoneListingRoutes";
import { FaArrowRight } from "react-icons/fa";
import {
  HOME_SECTION_LEAD_LIGHT,
  HOME_SECTION_TITLE_LIGHT,
} from "./homeSectionTypography";

const BRAND_PLACEHOLDER_LOGO =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Crect width='80' height='80' rx='12' fill='%23f3f4f6'/%3E%3Ctext x='40' y='46' font-family='Arial' font-size='10' text-anchor='middle' fill='%239ca3af'%3ELogo%3C/text%3E%3C/svg%3E";

const BrandCard = ({ brand, index, isActive, isLoaded, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex h-16 w-[84vw] max-w-[240px] shrink-0 snap-start items-center gap-3 rounded-2xl border bg-white px-4 text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 sm:w-[255px] lg:w-[270px] ${
        isActive
          ? "border-blue-200 bg-blue-50 shadow-md"
          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
      } ${isLoaded ? "opacity-100" : "opacity-0 translate-y-2"}`}
      style={{ transitionDelay: `${index * 45}ms` }}
    >
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-colors duration-300 ${
          isActive
            ? "border-blue-200 bg-white"
            : "border-slate-200 bg-slate-50"
        }`}
      >
        <img
          src={brand.logo || BRAND_PLACEHOLDER_LOGO}
          alt={brand.name || "brand"}
          loading="lazy"
          decoding="async"
          className="h-7 w-7 object-contain"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = BRAND_PLACEHOLDER_LOGO;
          }}
        />
      </div>

      <div className="min-w-0 flex flex-1 items-center justify-between gap-3">
        <span
          className={`block truncate text-sm font-semibold leading-none sm:text-base transition-colors duration-300 ${
            isActive ? "text-slate-900" : "text-slate-700"
          }`}
        >
          {brand.name}
        </span>
        <span
          className={`text-sm transition-transform duration-300 group-hover:translate-x-0.5 ${
            isActive ? "text-slate-600" : "text-slate-400"
          }`}
          aria-hidden="true"
        >
          <FaArrowRight className="h-3 w-3" />
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
      className={`relative overflow-hidden border-t border-slate-200 bg-slate-50 transition-all duration-700 ${
        isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
    >
      <div className="relative px-4 pt-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className={HOME_SECTION_TITLE_LIGHT}>
            <span className="block">Explore by</span>
            <span className="bg-gradient-to-r from-cyan-600 via-blue-600 to-sky-600 bg-clip-text text-transparent animate-pulse">
              Popular Brands
            </span>
          </h2>

          <p className={HOME_SECTION_LEAD_LIGHT}>
            Browse trusted brands across smartphones, laptops, TVs, and other
            devices.
          </p>
        </div>
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-6 sm:pb-16 lg:px-8 lg:pb-20">
        {uniqueBrands.length > 0 && (
          <div className="mx-auto mt-8 max-w-6xl">
            <div className="no-scrollbar flex w-full flex-nowrap gap-3 overflow-x-auto pb-5 pt-0 snap-x snap-mandatory sm:gap-4">
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
