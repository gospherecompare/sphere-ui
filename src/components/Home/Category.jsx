// src/components/CategoryNav.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../../styles/hideScrollbar.css";
import { FaMobileAlt, FaWifi, FaLaptop, FaHome } from "react-icons/fa";

const CategoryNav = () => {
  const [activeCategory, setActiveCategory] = useState("smartphones");
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Derive active category from the current pathname
  useEffect(() => {
    if (pathname === "/") {
      setActiveCategory("home");
      return;
    }

    const parts = pathname.split("/").filter(Boolean);
    if (parts.length >= 2 && parts[0] === "devicelist") {
      setActiveCategory(parts[1]);
      return;
    }
  }, [pathname]);

  const categories = [
    {
      id: "home",
      name: "Home",
      icon: <FaHome />,
      activeGradient: "from-blue-600 to-purple-700",
      inactiveColor: "text-gray-400",
    },
    {
      id: "smartphones",
      name: "Smartphones",
      icon: <FaMobileAlt />,
      activeGradient: "from-blue-600 to-purple-700",
      inactiveColor: "text-gray-400",
    },
    // {
    //   id: "networking",
    //   name: "Networking",
    //   icon: <FaWifi />,
    //   activeGradient: "from-purple-600 to-pink-700",
    //   inactiveColor: "text-gray-400"
    // },
    // {
    //   id: "laptop",
    //   name: "Laptops",
    //   icon: <FaLaptop />,
    //   activeGradient: "from-green-600 to-emerald-700",
    //   inactiveColor: "text-gray-400"
    // },
  ];

  const handleCategoryClick = (categoryId) => {
    setActiveCategory(categoryId);
    if (categoryId === "home") {
      navigate("/");
    } else {
      navigate(`/devicelist/${categoryId}`);
    }
  };

  return (
    <div className="px-2 lg:px-4 mx-auto my-4 lg:my-6 max-w-7xl overflow-hidden">
      <div className="flex overflow-x-auto gap-2 lg:gap-3 hide-scrollbar no-scrollbar scroll-smooth">
        {categories.map((category) => {
          const isActive = activeCategory === category.id;

          return (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category.id)}
              className={`flex flex-col items-center p-3 lg:p-4 transition-all duration-300 min-w-[80px] lg:min-w-[100px] shrink-0 group ${
                isActive
                  ? "text-gray-900 transform -translate-y-1"
                  : "text-gray-600 hover:text-gray-900 hover:transform hover:scale-105"
              }`}
            >
              {/* Icon Container */}
              <div
                className={`w-12 h-12 lg:w-14 lg:h-14 flex items-center justify-center rounded-2xl p-2 lg:p-3 transition-all duration-300 mb-2 lg:mb-2 ${
                  isActive
                    ? `bg-gradient-to-br ${category.activeGradient} text-white shadow-lg shadow-blue-200/50`
                    : "bg-gray-100 text-gray-400 group-hover:bg-gray-200 group-hover:shadow-md"
                }`}
              >
                <span
                  className={`text-lg lg:text-xl transition-colors duration-300 ${
                    isActive ? "text-white" : category.inactiveColor
                  }`}
                >
                  {category.icon}
                </span>
              </div>

              {/* Category Name */}
              <span
                className={`font-medium text-xs lg:text-sm text-center transition-all duration-300 ${
                  isActive
                    ? "text-gray-900 font-semibold"
                    : "text-gray-600 group-hover:text-gray-900"
                }`}
              >
                {category.name}
              </span>

              {/* Active Indicator Dot */}
              <div
                className={`mt-1 w-1 h-1 rounded-full transition-all duration-300 ${
                  isActive
                    ? `bg-gradient-to-r ${category.activeGradient} opacity-100`
                    : "bg-transparent opacity-0"
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryNav;
