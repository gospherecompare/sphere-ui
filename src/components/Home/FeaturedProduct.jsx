// src/components/MobilePriceFinder.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaRupeeSign, FaArrowRight, FaFilter } from "react-icons/fa";

const priceRanges = [
  {
    label: "Under ₹10,000",
    value: 10000,
    slug: "under-10000",
    gradient: "from-blue-600 via-purple-500 to-blue-600",
    color: "bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600",
    icon: "💰",
  },
  {
    label: "Under ₹15,000",
    value: 15000,
    slug: "under-15000",
    gradient: "from-blue-600 via-purple-500 to-blue-600",
    color: "bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600",
    icon: "📱",
  },
  {
    label: "Under ₹20,000",
    value: 20000,
    slug: "under-20000",
    gradient: "from-blue-600 via-purple-500 to-blue-600",
    color: "bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600",
    icon: "⚡",
  },
  {
    label: "Under ₹25,000",
    value: 25000,
    slug: "under-25000",
    gradient: "from-blue-600 via-purple-500 to-blue-600",
    color: "bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600",
    icon: "📸",
  },
  {
    label: "Under ₹30,000",
    value: 30000,
    slug: "under-30000",
    gradient: "from-blue-600 via-purple-500 to-blue-600",
    color: "bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600",
    icon: "🎮",
  },
  {
    label: "Under ₹40,000",
    value: 40000,
    slug: "under-40000",
    gradient: "from-blue-600 via-purple-500 to-blue-600",
    color: "bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600",
    icon: "🌟",
  },
  {
    label: "Under ₹50,000",
    value: 50000,
    slug: "under-50000",
    gradient: "from-blue-600 via-purple-500 to-blue-600",
    color: "bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600",
    icon: "💎",
  },
  {
    label: "Above ₹50,000",
    value: "above",
    slug: "above-50000",
    gradient: "from-blue-600 via-purple-500 to-blue-600",
    color: "bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600",
    icon: "👑",
  },
];

const MobilePriceFinder = () => {
  const navigate = useNavigate();
  const [activePrice, setActivePrice] = useState();
  const [hoveredPrice, setHoveredPrice] = useState(null);

  const handleClick = (price, gradient, slug) => {
    setActivePrice(price);
    navigate(`/smartphones/filter/${slug}`);
  };

  return (
    <div className="px-4 lg:px-6 mx-auto bg-white max-w-6xl mb-8 w-full overflow-hidden py-8 sm:py-10 rounded-lg ">
      {/* Header Section */}
      <div className="mb-8 px-2">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 shadow-lg">
            <FaFilter className="text-white text-lg" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
              Find Your Perfect Phone by{" "}
              <span className="bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600 bg-clip-text text-transparent">
                Budget
              </span>
            </h2>
            <p className="text-gray-500 text-sm sm:text-base sm:mt-1">
              Select your price range to discover smartphones that match your
              budget
            </p>
          </div>
        </div>

        {/* Stats Bar */}
      </div>

      {/* Price Buttons Grid */}
      <div className="relative">
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-8 gap-3 px-2">
          {priceRanges.map((item) => {
            const isActive = activePrice === item.value;
            const isHovered = hoveredPrice === item.value;

            return (
              <button
                key={item.label}
                onClick={() =>
                  handleClick(item.value, item.gradient, item.slug)
                }
                onMouseEnter={() => setHoveredPrice(item.value)}
                onMouseLeave={() => setHoveredPrice(null)}
                className={`relative overflow-hidden group transition-all duration-300 bg-gray-50 ${
                  isActive
                    ? "transform -translate-y-1 "
                    : " hover:shadow-xl hover:-translate-y-0.5 "
                } rounded-xl`}
              >
                {/* Background Gradient */}
                <div
                  className={`absolute inset-0 transition-opacity duration-300 ${
                    isActive
                      ? `opacity-20 ${item.color}`
                      : isHovered
                        ? `opacity-10 ${item.color}`
                        : "opacity-0"
                  }`}
                />

                {/* Card Content */}
                <div className="relative z-10 p-4 bg-white/90 backdrop-blur-sm rounded-md">
                  {/* Icon */}

                  {/* Price Label */}
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <FaRupeeSign
                        className={`text-xs ${
                          isActive ? "text-gray-700" : "text-gray-400"
                        }`}
                      />
                      <span
                        className={`font-semibold text-sm ${
                          isActive ? "text-gray-900" : "text-gray-700"
                        }`}
                      >
                        {item.label.split(" ")[1]}
                      </span>
                    </div>
                  </div>

                  {/* Active Indicator */}
                  <div
                    className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-16 h-1 rounded-t-full transition-all duration-300 ${
                      isActive ? `${item.color} opacity-100` : "opacity-0"
                    }`}
                  />
                </div>

                {/* Hover Border */}
                <div
                  className={`absolute inset-0 rounded-xl border-2 transition-all duration-300 pointer-events-none ${
                    isHovered ? "border-gray-200" : "border-transparent"
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* Decorative Elements */}
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-r from-purple-200 to-red-200 rounded-full blur-2xl opacity-60" />
        <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-gradient-to-r from-purple-200 to-red-200 rounded-full blur-2xl opacity-50" />
      </div>

      {/* Footer CTA */}
      <div className="mt-8 pt-6 border-t border-gray-100">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
          <div className="text-center sm:text-left">
            <p className="text-gray-600 text-sm">
              Can't decide?{" "}
              <span className="font-semibold text-gray-900">
                Explore all smartphones
              </span>
            </p>
            <p className="text-gray-400 text-xs mt-1">
              Filter by brand, features, and more
            </p>
          </div>

          <button
            onClick={() => navigate("/smartphones")}
            className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600 text-white rounded-full hover:from-purple-600 hover:to-red-600 transition-all duration-300 shadow-lg hover:shadow-xl hover:gap-3"
          >
            <span className="font-semibold">View All Phones</span>
            <FaArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobilePriceFinder;
