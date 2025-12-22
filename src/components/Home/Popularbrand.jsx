// src/components/PopularBrands.jsx
import React from "react";
import { useState } from "react";
import useDevice from "../../hooks/useDevice";
import { useNavigate } from "react-router-dom";
import { FaCrown, FaChevronRight, FaStar } from "react-icons/fa";
import "../../styles/hideScrollbar.css";

const PopularBrands = () => {
  const [activeBrand, setActiveBrand] = useState("all");

  const { brands: ctxBrands = [] } = useDevice() || {};

  // Only render brands where status is true (visible). The server may store
  // status as string "true"/"false"; `DeviceContext` already normalizes it
  // to boolean, but guard here as well.
  const visibleBrands = (ctxBrands || []).filter((b) => {
    if (typeof b.status === "boolean") return b.status;
    const s = String(b.status || "").toLowerCase();
    return s === "true" || s === "1" || s === "visible";
  });

  // Build categories dynamically from visibleBrands' `category` field
  const categoryCounts = {};
  visibleBrands.forEach((b) => {
    const cat = b.category ? String(b.category).toLowerCase() : null;
    if (!cat) return;
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  const categories = [
    { id: "all", name: "All Brands", count: visibleBrands.length },
    ...Object.keys(categoryCounts).map((k) => ({
      id: k,
      name: k.charAt(0).toUpperCase() + k.slice(1),
      count: categoryCounts[k],
    })),
  ];

  const filteredBrands =
    activeBrand === "all"
      ? visibleBrands
      : visibleBrands.filter(
          (brand) => (brand.category || "").toLowerCase() === activeBrand
        );

  return (
    <section className="my-8 sm:my-12 mx-3 sm:mx-4 lg:mx-auto max-w-7xl">
      {/* Section Header */}
      <div className="flex flex-col lg:flex-row justify-between items-center lg:items-end mb-6 lg:mb-8">
        <div className="mb-4 lg:mb-0 text-center lg:text-left">
          <div className="flex items-center justify-center lg:justify-start gap-2 mb-2">
            <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-400 px-3 py-1 rounded-full">
              <FaCrown className="text-white text-sm" />
              <span className="text-white text-xs font-bold">
                POPULAR BRANDS
              </span>
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent mb-2">
            Trusted Brands
          </h2>
          <p className="text-gray-600 font-medium text-sm sm:text-base max-w-2xl">
            Discover premium products from world-renowned brands you can trust
          </p>
        </div>

        {/* View All Button - Hidden on mobile */}
        <button className="hidden lg:flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-sm group">
          <span>View All Brands</span>
          <FaChevronRight className="group-hover:translate-x-1 transition-transform duration-200" />
        </button>
      </div>

      {/* Category Filters */}
      <div className="flex gap-2 sm:gap-3 mb-6 lg:mb-8 overflow-x-auto no-scrollbar pb-3">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setActiveBrand(category.id)}
            className={`inline-flex flex-shrink-0 items-center px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 border-2 ${
              activeBrand === category.id
                ? "bg-gradient-to-r from-blue-600 to-purple-700 text-white border-transparent shadow-lg"
                : "bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:shadow-md"
            }`}
          >
            <span className="whitespace-nowrap">{category.name}</span>
            <span
              className={`ml-2 px-2 py-1 rounded-full text-xs font-bold min-w-6 ${
                activeBrand === category.id
                  ? "bg-white/20 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {category.count}
            </span>
          </button>
        ))}
      </div>

      {/* Brands Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4 lg:gap-6">
        {filteredBrands.map((brand) => (
          <BrandItem key={brand.id} brand={brand} />
        ))}
      </div>

      {/* Mobile View All Button */}
      <div className="flex justify-center mt-6 lg:hidden">
        <button className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-700 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:shadow-lg transition-all duration-300">
          <span>View All Brands</span>
          <FaChevronRight className="text-sm" />
        </button>
      </div>
    </section>
  );
};

// Clickable brand item that navigates to Smartphonelist with brand filter
const BrandItem = ({ brand }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(
      `/devicelist/smartphones?brand=${encodeURIComponent(
        brand.name
      )}&sort=newest`
    );
  };

  return (
    <div
      onClick={handleClick}
      onKeyDown={(e) => e.key === "Enter" && handleClick()}
      role="button"
      tabIndex={0}
      className="group cursor-pointer bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4  hover:border-blue-300 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
    >
      <div className="flex flex-col items-center text-center">
        {/* Brand Logo Container */}
        <div className="relative mb-2 sm:mb-3">
          <div
            className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center p-2 transition-all duration-300 ${
              brand.featured
                ? "bg-gradient-to-br from-blue-50 to-purple-50 group-hover:from-blue-100 group-hover:to-purple-100 "
                : "bg-gray-50 group-hover:bg-blue-50 "
            }`}
          >
            <img
              src={brand.logo}
              alt={brand.name}
              className="w-full h-full object-contain"
            />
          </div>

          {/* Featured Badge */}
          {brand.featured && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-sm">
              <FaStar className="text-white text-xs" />
            </div>
          )}
        </div>

        {/* Brand Name */}
        <h3
          className={`font-semibold text-xs sm:text-sm transition-colors duration-300 ${
            brand.featured
              ? "text-gray-900 group-hover:text-blue-600"
              : "text-gray-700 group-hover:text-blue-600"
          }`}
        >
          {brand.name}
        </h3>

        {/* Category Tag */}
      </div>
    </div>
  );
};

export default PopularBrands;
