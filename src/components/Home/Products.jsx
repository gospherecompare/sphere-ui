// src/components/ProductsNav.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../../styles/hideScrollbar.css";
import { FaMobileAlt, FaWifi, FaLaptop, FaHome, FaPlug } from "react-icons/fa";

const ProductsNav = () => {
  const [activeProducts, setActiveProducts] = useState("smartphones");
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Derive active Products from the current pathname
  useEffect(() => {
    if (pathname === "/") {
      setActiveProducts("home");
      return;
    }

    const parts = pathname.split("/").filter(Boolean);
    if (parts.length === 0) {
      setActiveProducts("home");
      return;
    }

    // support both /products/:category and direct /:category routes
    if (parts[0] === "products" && parts[1]) {
      setActiveProducts(parts[1]);
      return;
    }

    const validIds = [
      "home",
      "smartphones",
      "appliances",
      "networking",
      "laptops",
    ];
    if (validIds.includes(parts[0])) {
      setActiveProducts(parts[0]);
      return;
    }
  }, [pathname]);

  const categories = [
    {
      id: "home",
      name: "Home",
      icon: <FaHome />,
      activeGradient: "from-purple-600 to-red-600",
      inactiveColor: "text-gray-400",
    },
    {
      id: "smartphones",
      name: "Smartphones",
      icon: <FaMobileAlt />,
      activeGradient: "from-purple-600 to-red-600",
      inactiveColor: "text-gray-400",
    },
    {
      id: "appliances",
      name: "Appliances",
      icon: <FaPlug />,
      activeGradient: "from-purple-600 to-red-600",
      inactiveColor: "text-gray-400",
    },
    {
      id: "networking",
      name: "Networking",
      icon: <FaWifi />,
      activeGradient: "from-purple-600 to-red-600",
      inactiveColor: "text-gray-400",
    },
    {
      id: "laptops",
      name: "Laptops",
      icon: <FaLaptop />,
      activeGradient: "from-purple-600 to-red-600",
      inactiveColor: "text-gray-400",
    },
  ];

  const handleProductsClick = (ProductsId) => {
    // Navigation drives active state via location; avoid setting local state
    if (ProductsId === "home") {
      navigate("/");
    } else {
      // use SEO-friendly category path
      navigate(`/products/${ProductsId}`);
    }
  };

  return (
    <div className=" mx-auto  max-w-6xl mb-5 w-full pt-18 overflow-hidden  sm:pt-10">
      <div
        className="
    grid grid-cols-5 gap-2 bg-white rounded-lg p-2
    sm:flex sm:overflow-x-auto sm:gap-3 sm:p-0
    hide-scrollbar no-scrollbar scroll-smooth
  "
      >
        {categories.map((Products) => {
          const isActive = activeProducts === Products.id;

          return (
            <button
              key={Products.id}
              onClick={() => handleProductsClick(Products.id)}
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
                    ? `bg-gradient-to-br ${Products.activeGradient} text-white shadow-lg shadow-red-200/50`
                    : "bg-gray-100 text-gray-400 group-hover:bg-gray-200 group-hover:shadow-md"
                }`}
              >
                <span
                  className={`text-lg lg:text-xl transition-colors duration-300 ${
                    isActive ? "text-white" : Products.inactiveColor
                  }`}
                >
                  {Products.icon}
                </span>
              </div>

              {/* Products Name */}
              <span
                className={`font-medium text-xs lg:text-sm text-center transition-all duration-300 ${
                  isActive
                    ? "text-gray-900 font-semibold"
                    : "text-gray-600 group-hover:text-gray-900"
                }`}
              >
                {Products.name}
              </span>

              {/* Active Indicator Dot */}
              <div
                className={`mt-1 w-1 h-1 rounded-full transition-all duration-300 ${
                  isActive
                    ? `bg-gradient-to-r ${Products.activeGradient} opacity-100`
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

export default ProductsNav;
