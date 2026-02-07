// src/components/MobileFeaturesFinder.jsx
import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  FaCamera,
  FaBatteryFull,
  FaMemory,
  FaMobileAlt,
  FaGamepad,
  FaFingerprint,
  FaBolt,
  FaCheckCircle,
  FaArrowRight,
} from "react-icons/fa";

const MobileFeaturesFinder = () => {
  const navigate = useNavigate();

  const popularFeatures = [
    {
      id: "high-camera",
      name: "High MP Camera",
      icon: <FaCamera />,
      activeGradient: "from-blue-600 via-purple-500 to-blue-600",
      inactiveColor: "text-gray-400",
      description: "50MP+ cameras",
      count: 124,
    },
    {
      id: "long-battery",
      name: "Long Battery",
      icon: <FaBatteryFull />,
      activeGradient: "from-blue-600 via-purple-500 to-blue-600",
      inactiveColor: "text-gray-400",
      description: "5000mAh+",
      count: 89,
    },
    {
      id: "high-ram",
      name: "High RAM",
      icon: <FaMemory />,
      activeGradient: "from-blue-600 via-purple-500 to-blue-600",
      inactiveColor: "text-gray-400",
      description: "8GB+ RAM",
      count: 156,
    },
    {
      id: "gaming",
      name: "Gaming",
      icon: <FaGamepad />,
      activeGradient: "from-blue-600 via-purple-500 to-blue-600",
      inactiveColor: "text-gray-400",
      description: "Gaming phones",
      count: 45,
    },
    {
      id: "fast-charging",
      name: "Fast Charge",
      icon: <FaBolt />,
      activeGradient: "from-blue-600 via-purple-500 to-blue-600",
      inactiveColor: "text-gray-400",
      description: "65W+ charging",
      count: 67,
    },
    {
      id: "amoled",
      name: "AMOLED",
      icon: <FaMobileAlt />,
      activeGradient: "from-blue-600 via-purple-500 to-blue-600",
      inactiveColor: "text-gray-400",
      description: "AMOLED displays",
      count: 98,
    },
    {
      id: "fingerprint",
      name: "In-display FP",
      icon: <FaFingerprint />,
      activeGradient: "from-blue-600 via-purple-500 to-blue-600",
      inactiveColor: "text-gray-400",
      description: "In-display sensor",
      count: 112,
    },
    {
      id: "5g",
      name: "5G Ready",
      icon: <FaCheckCircle />,
      activeGradient: "from-blue-600 via-purple-500 to-blue-600",
      inactiveColor: "text-gray-400",
      description: "5G connectivity",
      count: 178,
    },
  ];

  const [activeFeature, setActiveFeature] = useState();

  const [params] = useSearchParams();

  React.useEffect(() => {
    const f = params.get("feature");
    setActiveFeature(f || undefined);
  }, [params]);

  const handleFeatureClick = (featureId) => {
    setActiveFeature(featureId);
    navigate(`/smartphones?feature=${featureId}`);
  };

  const handleViewAll = () => {
    navigate("/smartphones");
  };

  return (
    <div className="px-2 lg:px-4 mx-auto bg-white max-w-6xl w-full m-5 rounded-lg overflow-hidden pt-5 sm:pt-10">
      {/* Header Section */}
      <div className="mb-6 px-2">
        <div className="flex items-center gap-2 mb-2">
          <FaMobileAlt className="text-purple-500 text-lg" />
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            Mobiles by{" "}
            <span className="bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600 bg-clip-text text-transparent">
              Popular Features
            </span>
          </h2>
        </div>
        <p className="text-sm text-gray-600">
          Find smartphones based on your preferred features
        </p>
      </div>

      {/* Features Grid - Single Row */}
      <div
        className="
    grid grid-cols-4
    sm:flex sm:overflow-x-auto sm:gap-4 sm:pb-6
    hide-scrollbar no-scrollbar scroll-smooth
  "
      >
        {popularFeatures.map((feature) => {
          const isActive = activeFeature === feature.id;

          return (
            <button
              key={feature.id}
              onClick={() => handleFeatureClick(feature.id)}
              className={`flex flex-col items-center p-2 transition-all duration-300 min-w-[100px] lg:min-w-[120px] shrink-0 group ${
                isActive
                  ? "text-gray-900 transform -translate-y-1"
                  : "text-gray-600 hover:text-gray-900 hover:transform hover:scale-105"
              }`}
            >
              {/* Icon Container */}
              <div
                className={`w-14 h-14 lg:w-16 lg:h-16 flex items-center justify-center rounded-2xl p-3 transition-all duration-300 mb-3 ${
                  isActive
                    ? `bg-gradient-to-br ${feature.activeGradient} text-white shadow-lg shadow-red-200/50`
                    : "bg-gray-100 text-gray-400 group-hover:bg-gray-200 group-hover:shadow-md"
                }`}
              >
                <span
                  className={`text-xl lg:text-2xl transition-colors duration-300 ${
                    isActive ? "text-white" : feature.inactiveColor
                  }`}
                >
                  {feature.icon}
                </span>
              </div>

              {/* Feature Name */}
              <span
                className={`font-bold text-xs lg:text-sm text-center transition-all duration-300 mb-1 ${
                  isActive
                    ? "text-gray-900"
                    : "text-gray-600 group-hover:text-gray-900"
                }`}
              >
                {feature.name}
              </span>

              {/* Feature Description */}
              <span className="text-[10px] text-gray-500 mb-2">
                {feature.description}
              </span>

              {/* Count Badge */}

              {/* Active Indicator Dot */}
              <div
                className={`mt-2 w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  isActive
                    ? `bg-gradient-to-r ${feature.activeGradient} opacity-100`
                    : "bg-transparent opacity-0"
                }`}
              />
            </button>
          );
        })}
      </div>

      {/* View All Button */}
    </div>
  );
};

export default MobileFeaturesFinder;
