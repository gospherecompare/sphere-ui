// src/components/HeroSection.jsx
import React from "react";
import { FaSearch, FaChartBar, FaBolt, FaStar } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const navigate = useNavigate();
  return (
    <section className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-purple-700 text-white   shadow-2xl overflow-hidden mx-3 sm:mx-4 lg:mx-auto max-w-7xl my-6 sm:my-8 lg:my-12">
      {/* Background Glow Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-br from-white via-transparent to-white transform rotate-45 scale-150"></div>
      </div>

      {/* Floating Lights */}
      <div className="absolute top-10 left-10 w-4 h-4 bg-yellow-400 rounded-full opacity-60 animate-pulse hidden sm:block"></div>
      <div className="absolute bottom-20 right-16 w-3 h-3 bg-blue-300 rounded-full opacity-50 animate-pulse delay-1000 hidden sm:block"></div>
      <div className="absolute top-1/3 right-1/4 w-2 h-2 bg-green-300 rounded-full opacity-40 animate-pulse delay-500 hidden sm:block"></div>

      <div className="relative z-10 py-8 sm:py-12 lg:py-16 xl:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/30 mb-4 sm:mb-6">
            <FaStar className="text-yellow-300 text-sm" />
            <span className="text-xs sm:text-sm font-semibold">
              SMART DEVICE COMPARISON
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 sm:mb-4 lg:mb-6 leading-tight">
            Discover & Compare{" "}
            <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
              Latest Tech Devices
            </span>
            Effortlessly
          </h1>

          {/* Subtitle */}
          <h6 className="text-base sm:text-lg lg:text-xl mb-6 sm:mb-8 opacity-90 leading-relaxed max-w-2xl mx-auto lg:mx-0">
            Smart Arena helps you explore smartphones, TVs, laptops, wearables,
            and other electronics with accurate specifications, clean comparison
            tools, and fast device updates — all in one place.
          </h6>

          {/* Features Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8 max-w-md mx-auto lg:mx-0 lg:max-w-lg">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/20">
              <FaSearch className="text-blue-300 text-sm" />
              <span className="text-xs sm:text-sm font-medium">
                Smart Search
              </span>
            </div>

            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/20">
              <FaChartBar className="text-green-300 text-sm" />
              <span className="text-xs sm:text-sm font-medium">
                Device Comparison
              </span>
            </div>

            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/20 col-span-2 sm:col-span-1 justify-center">
              <FaBolt className="text-yellow-300 text-sm" />
              <span className="text-xs sm:text-sm font-medium">
                Latest Updates
              </span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start items-center">
            <button
              onClick={() => navigate("/compare")}
              className="group relative bg-white text-blue-600 px-6 sm:px-8 py-3 sm:py-4 rounded-full font-bold text-sm sm:text-base hover:transform hover:-translate-y-1 transition-all duration-300 hover:shadow-2xl w-full sm:w-auto max-w-xs"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transform -skew-x-12 group-hover:translate-x-full transition-all duration-700 rounded-full"></div>
              Start Comparing
            </button>

            <button
              onClick={() => navigate("/devicelist/smartphones")}
              className="group bg-transparent border-2 border-white/50 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold text-sm sm:text-base hover:bg-white/10 hover:border-white transition-all duration-300 w-full sm:w-auto max-w-xs"
            >
              Browse Devices
            </button>
          </div>

          {/* Stats */}
        </div>
      </div>

      {/* Bottom Gradient Line */}
      <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500"></div>
    </section>
  );
};

export default HeroSection;
