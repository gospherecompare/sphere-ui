// src/components/HeroSection.jsx
import React from "react";
import { FaSearch, FaChartBar, FaBolt, FaStar } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const navigate = useNavigate();
  return (
    <section className="relative bg-white text-gray-900 overflow-hidden mx-3 max-w-6xl sm:mx-4 lg:mx-auto mt-0 mb-6 sm:mb-8 lg:mb-12 ">
      {/* Background Pattern - Subtle */}

      {/* Floating Elements - Subtle */}
      <div className="absolute top-10 left-10 w-4 h-4 bg-blue-500 rounded-full opacity-20 animate-pulse hidden sm:block"></div>
      <div className="absolute bottom-20 right-16 w-3 h-3 bg-purple-500 rounded-full opacity-20 animate-pulse delay-1000 hidden sm:block"></div>
      <div className="absolute top-1/3 right-1/4 w-2 h-2 bg-blue-400 rounded-full opacity-20 animate-pulse delay-500 hidden sm:block"></div>

      <div className="relative z-10 py-8 sm:py-12 lg:py-16 xl:py-20 px-4 sm:px-6 lg:px-8 max-w-6xl">
        <div className="max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-purple-50 backdrop-blur-sm px-3 py-1.5 rounded-full border border-purple-100 mb-4 sm:mb-6">
            <FaStar className="text-purple-600 text-sm" />
            <span className="text-xs sm:text-sm font-semibold text-purple-800">
              SMART DEVICE COMPARISON
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 sm:mb-4 lg:mb-6 leading-tight">
            Discover & Compare{" "}
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Latest Tech Devices
            </span>
            Effortlessly
          </h1>

          {/* Subtitle */}
          <p className="text-[13px] text-base sm:text-lg lg:text-xl mb-6 sm:mb-8 text-gray-700 leading-relaxed max-w-2xl mx-auto lg:mx-0 ">
            Smart Arena helps you explore smartphones, TVs, laptops, wearables,
            and other electronics with accurate specifications, clean comparison
            tools, and fast device updates — all in one place.
          </p>

          {/* Features Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8 max-w-md mx-auto lg:mx-0 lg:max-w-lg">
            <div className="flex items-center gap-2 bg-gray-50 backdrop-blur-sm px-3 py-2 rounded-lg border border-gray-200">
              <FaSearch className="text-purple-600 text-sm" />
              <span className="text-xs sm:text-sm font-medium text-gray-800">
                Smart Search
              </span>
            </div>

            <div className="flex items-center gap-2 bg-gray-50 backdrop-blur-sm px-3 py-2 rounded-lg border border-gray-200">
              <FaChartBar className="text-green-600 text-sm" />
              <span className="text-xs sm:text-sm font-medium text-gray-800">
                Device Comparison
              </span>
            </div>

            <div className="flex items-center gap-2 bg-gray-50 backdrop-blur-sm px-3 py-2 rounded-lg border border-gray-200 col-span-2 sm:col-span-1 justify-center">
              <FaBolt className="text-yellow-600 text-sm" />
              <span className="text-xs sm:text-sm font-medium text-gray-800">
                Latest Updates
              </span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start items-center">
            <button
              onClick={() => navigate("/compare")}
              className="group relative bg-gradient-to-r from-purple-600 to-blue-600 shadow-lg shadow-purple-200 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full font-bold text-sm sm:text-base hover:transform hover:-translate-y-1 transition-all duration-300 hover:shadow-xl hover:shadow-purple-200 w-full sm:w-auto max-w-xs"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transform -skew-x-12 group-hover:translate-x-full transition-all duration-700 rounded-full"></div>
              Start Comparing
            </button>

            <button
              onClick={() => navigate("/smartphones")}
              className="group bg-transparent border-2 border-gray-300 text-gray-800 px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold text-sm sm:text-base hover:bg-gray-50 hover:border-gray-400 hover:text-gray-900 transition-all duration-300 w-full sm:w-auto max-w-xs"
            >
              Browse Devices
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Accent Line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 rounded-full bg-gradient-to-r from-purple-600 via-purple-500 to-blue-600"></div>
    </section>
  );
};

export default HeroSection;


