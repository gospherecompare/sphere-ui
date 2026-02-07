// src/components/TrendingSection.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { generateSlug } from "../../utils/slugGenerator";
import {
  FaFire,
  FaMobileAlt,
  FaLaptop,
  FaSnowflake,
  FaWifi,
  FaArrowRight,
} from "react-icons/fa";

const TrendingSection = () => {
  const [activeCategory, setActiveCategory] = useState("smartphone");
  const [currentDevices, setCurrentDevices] = useState([]);
  const [loadingTrending, setLoadingTrending] = useState(false);
  const navigate = useNavigate();

  // Trending categories
  const categories = [
    {
      id: "smartphone",
      name: "Smartphones",
      icon: <FaMobileAlt />,
      activeGradient: "from-blue-600 via-purple-500 to-blue-600",
      inactiveColor: "text-gray-400",
      count: 156,
    },
    {
      id: "laptop",
      name: "Laptops",
      icon: <FaLaptop />,
      activeGradient: "from-blue-600 via-purple-500 to-blue-600",
      inactiveColor: "text-gray-400",
      count: 89,
    },
    {
      id: "appliance",
      name: "Appliances",
      icon: <FaSnowflake />,
      activeGradient: "from-blue-600 via-purple-500 to-blue-600",
      inactiveColor: "text-gray-400",
      count: 124,
    },
    {
      id: "networking",
      name: "Networking",
      icon: <FaWifi />,
      activeGradient: "from-blue-600 via-purple-500 to-blue-600",
      inactiveColor: "text-gray-400",
      count: 67,
    },
  ];

  const apiForCategory = {
    smartphone: "/api/public/trending/smartphones",
    laptop: "/api/public/trending/laptops",
    appliance: "/api/public/trending/appliances",
    networking: "/api/public/trending/networking",
  };

  // Fetch trending products for active category
  useEffect(() => {
    let cancelled = false;
    const fetchTrending = async () => {
      setLoadingTrending(true);
      setCurrentDevices([]);
      const endpoint = apiForCategory[activeCategory];

      try {
        const r = await fetch(`https://api.apisphere.in${endpoint}`);
        if (!r.ok) throw new Error("Failed to fetch trending");
        const json = await r.json();
        if (cancelled) return;

        const rows = json.trending || [];
        const mapped = rows.slice(0, 15).map((row, idx) => {
          const basePrice = row.base_price ?? row.price ?? null;
          const priceStr = basePrice
            ? `₹${Number(basePrice).toLocaleString()}`
            : "N/A";
          const viewsNum = Number(row.views) || 0;

          return {
            id: row.product_id ?? row.id ?? null,
            variantId: row.variant_id ?? row.variantId ?? null,
            name: row.product_name ?? row.name ?? row.model ?? "",
            brand: row.brand ?? "",
            model: row.model ?? "",
            ram: row.ram ?? "",
            storage: row.storage ?? "",
            base_price: basePrice !== null ? String(basePrice) : null,
            price: priceStr,
            rating: row.rating ?? row.avg_rating ?? 0,
            reviews: viewsNum,
            image: row.image ?? row.image_url ?? "",
            raw: row,
          };
        });

        setCurrentDevices(mapped);
      } catch (err) {
        console.error("Failed to load trending:", err);
        setCurrentDevices([]);
      } finally {
        if (!cancelled) setLoadingTrending(false);
      }
    };

    fetchTrending();
    return () => {
      cancelled = true;
    };
  }, [activeCategory]);

  const handleDeviceClick = (device) => {
    const routeMap = {
      smartphone: "/smartphones",
      laptop: "/laptops",
      appliance: "/appliances",
      networking: "/networking",
    };
    const basePath = routeMap[activeCategory] || "/smartphones";
    const rawName =
      device.name || device.model || device.product_name || device.brand || "";
    const slug = generateSlug(rawName || String(device.id || "device"));
    const params = new URLSearchParams();
    if (device.id) params.set("id", String(device.id));
    if (device.variantId) params.set("variantId", String(device.variantId));
    const qs = params.toString();
    navigate(`${basePath}/${slug}${qs ? `?${qs}` : ""}`);
  };

  const handleViewAll = () => {
    const routeMap = {
      smartphone: "/smartphones",
      laptop: "/laptops",
      appliance: "/appliances",
      networking: "/networking",
    };
    navigate(routeMap[activeCategory] || "/");
  };

  return (
    <div className="px-2 lg:px-4 mx-auto bg-white max-w-6xl rounded-xl mb-5 w-full m-0 overflow-hidden pt-5 sm:pt-10">
      {/* Header Section */}
      <div className="mb-6 px-2">
        <div className="flex items-center gap-2 mb-2">
          <FaFire className="text-red-500 text-lg" />
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            Trending{" "}
            <span className="bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600 bg-clip-text text-transparent">
              Products
            </span>
          </h2>
        </div>
        <p className="text-sm text-gray-600">
          Discover the hottest devices trending right now
        </p>
      </div>

      {/* Category Tabs - Single Row */}
      <div className="flex overflow-x-auto gap-2 lg:gap-3 hide-scrollbar no-scrollbar scroll-smooth mb-8">
        {categories.map((category) => {
          const isActive = activeCategory === category.id;

          return (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`flex flex-col items-center p-3 lg:p-4 transition-all duration-300 min-w-[90px] lg:min-w-[110px] shrink-0 group ${
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

              {/* Count Badge */}

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

      {/* Trending Products - Single Row */}
      <div className="mb-4 px-2">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Trending Now</h3>
          <button
            onClick={handleViewAll}
            className="text-sm text-red-600 hover:text-red-800 font-medium flex items-center gap-1"
          >
            View all
            <FaArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Products Grid - Single Row (Max 5 visible on desktop) */}
      <div className="flex md:grid md:grid-cols-5 overflow-x-auto md:overflow-visible gap-3 lg:gap-4 hide-scrollbar no-scrollbar scroll-smooth pb-6">
        {loadingTrending
          ? // Skeleton Loaders
            Array.from({ length: 8 }).map((_, i) => (
              <div
                key={`skeleton-${i}`}
                className="min-w-[120px] sm:min-w-[160px] lg:min-w-[200px] shrink-0 animate-pulse"
              >
                <div className="rounded-2xl bg-white p-3 shadow-sm">
                  <div className="bg-gray-200 rounded-xl w-full h-24 sm:h-32 lg:h-40 mb-3"></div>
                  <div className="h-3 bg-gray-200 rounded mb-2 w-4/5"></div>
                  <div className="h-4 bg-gray-200 rounded mb-3 w-full"></div>
                  <div className="h-3 bg-gray-200 rounded mb-2 w-2/3"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            ))
          : // Actual Products
            currentDevices.slice(0, 5).map((device, i) => (
              <div
                key={`${device.id || "noid"}-${i}`}
                onClick={() => handleDeviceClick(device)}
                className="group min-w-[220px] sm:min-w-[260px] md:min-w-0 cursor-pointer transition-all duration-200"
              >
                <div className="relative rounded-2xl bg-white  p-3 sm:p-4 transition-all duration-200 group-hover:shadow-lg group-hover:shadow-slate-200 group-hover:-translate-y-0.5">
                  <div className="flex flex-col gap-3">
                    {/* Image */}
                    <div className="relative w-full flex-shrink-0">
                      <div className="h-28 sm:h-32 w-full rounded-2xl overflow-hidden bg-gray-100 flex items-center justify-center">
                        {device.image ? (
                          <img
                            src={device.image}
                            alt={device.name}
                            className="max-h-full w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                            onError={(e) => {
                              e.target.style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full  flex items-center justify-center">
                            <span className="text-lg font-bold text-gray-500">
                              {device.brand?.charAt(0) || "P"}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Trending Badge */}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 text-left">
                      {/* Brand - Top Left */}
                      <p className="text-[10px] sm:text-xs uppercase text-purple-600 font-semibold tracking-widest">
                        {device.brand || "Brand"}
                      </p>

                      {/* Title */}
                      <h3
                        className="mt-1 text-sm sm:text-base font-semibold text-gray-900 leading-snug line-clamp-2 
               min-h-[2.5rem] md:min-h-[3rem] 
               group-hover:text-red-600 transition-colors duration-200"
                      >
                        {device.name}
                      </h3>

                      {/* Description (RAM | Storage) */}
                      <p className="mt-0.5 text-[11px] sm:text-xs text-gray-500">
                        {device.ram || "RAM"}{" "}
                        {device.storage && `/ ${device.storage}`}
                      </p>

                      {/* Price */}
                      <div className="mt-2 flex items-center justify-start">
                        <p className="text-base sm:text-lg font-bold text-green-600">
                          {device.price || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
      </div>
    </div>
  );
};

export default TrendingSection;
