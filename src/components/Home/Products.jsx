// src/components/ProductsNav.jsx
import React from "react";
import { Link, useLocation } from "react-router-dom";
import "../../styles/hideScrollbar.css";
import { FaMobileAlt, FaWifi, FaLaptop, FaPlug, FaStream } from "react-icons/fa";

const TOP_CATEGORIES = [
  {
    id: "smartphones",
    name: "Smartphones",
    icon: <FaMobileAlt />,
    activeGradient: "from-blue-600 via-purple-500 to-blue-600",
    inactiveColor: "text-gray-400",
  },
  {
    id: "laptops",
    name: "Laptops",
    icon: <FaLaptop />,
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
];

const getActiveCategoryFromPathname = (pathname) => {
  const path = String(pathname || "").trim();
  if (!path || path === "/") return null;

  const parts = path.split("/").filter(Boolean);
  if (parts.length === 0) return null;

  let candidate = parts[0];
  if (candidate === "products" && parts[1]) candidate = parts[1];
  if (candidate === "devices" && parts[1]) candidate = parts[1];

  const normalized = String(candidate || "")
    .toLowerCase()
    .trim();
  const aliasMap = {
    mobiles: "smartphones",
    smartphone: "smartphones",
    laptop: "laptops",
    appliance: "appliances",
    network: "networking",
  };

  const resolved = aliasMap[normalized] || normalized;
  const validIds = new Set([
    "smartphones",
    "laptops",
    "appliances",
    "networking",
  ]);
  if (resolved === "products") return "smartphones";
  return validIds.has(resolved) ? resolved : null;
};

const ProductsNav = () => {
  const { pathname } = useLocation();

  const activeCategoryId = React.useMemo(
    () => getActiveCategoryFromPathname(pathname),
    [pathname],
  );

  return (
    <section className="mx-auto max-w-6xl mb-5 w-full bg-white rounded-lg overflow-hidden px-2 lg:px-4 pt-4 sm:pt-6 pb-3 sm:pb-4 lg:mt-3 mt-4 sm:mt-0">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <FaStream className="text-purple-500 text-lg" />
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            Browse by{" "}
            <span className="bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600 bg-clip-text text-transparent">
              Category
            </span>
          </h2>
        </div>
        <p className="text-sm text-gray-600">
          Explore smartphones, laptops, appliances, and networking devices
        </p>
      </div>

      <nav
        aria-label="Browse by category"
        className="
          grid grid-cols-4 gap-2 py-2
          sm:flex sm:overflow-x-auto sm:gap-3 sm:py-2
          hide-scrollbar no-scrollbar scroll-smooth
        "
      >
        {TOP_CATEGORIES.map((category) => {
          const isActive = activeCategoryId === category.id;
          const to = `/products/${category.id}`;

          return (
            <Link
              key={category.id}
              to={to}
              title={`Browse ${category.name}`}
              aria-label={`Browse ${category.name}`}
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
                    ? `bg-gradient-to-br ${category.activeGradient} text-white shadow-lg shadow-red-200/50`
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

              {/* Products Name */}
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
            </Link>
          );
        })}
      </nav>
    </section>
  );
};

export default ProductsNav;
