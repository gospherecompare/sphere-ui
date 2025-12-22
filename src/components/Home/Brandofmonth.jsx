import React from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaStar, FaRocket, FaAward } from "react-icons/fa";

const Brandofmonth = () => {
  const navigate = useNavigate();

  return (
    <div className="my-6 sm:my-8 mx-3 sm:mx-4 lg:mx-auto max-w-7xl">
      <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-purple-700 rounded-2xl shadow-lg border border-white/20 overflow-hidden">
        <div className="relative p-4 sm:p-6 lg:p-8 text-white">
          {/* Header Badge - Mobile Optimized */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 mb-4">
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/30 w-fit">
              <FaAward className="text-yellow-300 text-xs sm:text-sm" />
              <span className="text-xs font-semibold">BRAND OF THE MONTH</span>
            </div>
            <div className="flex items-center gap-1 bg-white/10 backdrop-blur-sm px-2 py-1 rounded-full w-fit">
              <FaStar className="text-yellow-300 text-xs" />
              <span className="text-xs font-medium">Featured</span>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4 sm:gap-6">
            {/* Brand Info Section */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 w-full lg:w-auto">
              {/* Brand Logo */}
              <div className="relative">
                <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-white/20 backdrop-blur-sm rounded-xl sm:rounded-2xl flex items-center justify-center p-2 sm:p-3 border-2 border-white/30 shadow-lg">
                  <img
                    src="https://static.vecteezy.com/system/resources/previews/020/975/547/non_2x/samsung-logo-samsung-icon-transparent-free-png.png"
                    alt="Samsung"
                    className="w-full h-full object-contain filter brightness-0 invert"
                  />
                </div>
                {/* Decorative Element */}
                <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                  <FaRocket className="text-white text-xs" />
                </div>
              </div>

              {/* Brand Text */}
              <div className="text-center sm:text-left flex-1 max-w-full">
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                  Samsung
                </h3>
                <p className="text-blue-100 text-xs sm:text-sm lg:text-base mb-2 sm:mb-3 leading-relaxed">
                  Innovation that inspires the world with cutting-edge
                  technology
                </p>

                {/* Features List - Mobile Optimized */}
                <div className="flex flex-wrap gap-1 sm:gap-2 justify-center sm:justify-start">
                  <div className="flex items-center gap-1 bg-white/10 backdrop-blur-sm px-2 py-1 rounded-lg border border-white/20">
                    <FaStar className="text-yellow-300 text-xs" />
                    <span className="text-xs">5G</span>
                  </div>
                  <div className="flex items-center gap-1 bg-white/10 backdrop-blur-sm px-2 py-1 rounded-lg border border-white/20">
                    <FaStar className="text-yellow-300 text-xs" />
                    <span className="text-xs">AMOLED</span>
                  </div>
                  <div className="flex items-center gap-1 bg-white/10 backdrop-blur-sm px-2 py-1 rounded-lg border border-white/20">
                    <FaStar className="text-yellow-300 text-xs" />
                    <span className="text-xs">Camera</span>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Button Section - Mobile Stacked */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full lg:w-auto">
              {/* Main Button */}
              <button
                onClick={() =>
                  navigate(
                    `/devicelist/smartphones?brand=${encodeURIComponent(
                      "Samsung"
                    )}&sort=newest`
                  )
                }
                className="group relative bg-white text-blue-600 px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold hover:bg-gray-50 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 border-2 border-white/50 overflow-hidden w-full sm:w-auto"
              >
                {/* Animated Background */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transform -skew-x-12 group-hover:translate-x-full transition-all duration-700"></div>

                <FaEye className="text-sm sm:text-base group-hover:scale-110 transition-transform duration-300" />
                <span className="text-xs sm:text-sm font-bold">
                  Explore Samsung
                </span>
              </button>

              {/* Secondary Stats - Mobile Horizontal */}
              <div className="flex items-center justify-between sm:justify-center gap-2 sm:gap-4 bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 border border-white/20 w-full sm:w-auto">
                <div className="text-center flex-1 sm:flex-none">
                  <div className="text-sm sm:text-base font-bold text-white">
                    50+
                  </div>
                  <div className="text-xs text-blue-100">Models</div>
                </div>
                <div className="h-4 sm:h-6 w-px bg-white/30"></div>
                <div className="text-center flex-1 sm:flex-none">
                  <div className="text-sm sm:text-base font-bold text-white">
                    4.5★
                  </div>
                  <div className="text-xs text-blue-100">Rating</div>
                </div>
                <div className="h-4 sm:h-6 w-px bg-white/30"></div>
                <div className="text-center flex-1 sm:flex-none">
                  <div className="text-sm sm:text-base font-bold text-white">
                    2024
                  </div>
                  <div className="text-xs text-blue-100">Latest</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Gradient Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500"></div>
        </div>
      </div>
    </div>
  );
};

export default Brandofmonth;
