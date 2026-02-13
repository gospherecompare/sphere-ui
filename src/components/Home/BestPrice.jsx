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

const toText = (value) => {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  if (!text) return null;
  const lower = text.toLowerCase();
  if (
    lower === "null" ||
    lower === "undefined" ||
    lower === "n/a" ||
    lower === "na"
  ) {
    return null;
  }
  return text.replace(/\s+/g, " ");
};

const parseObjectIfNeeded = (value) => {
  if (!value) return null;
  if (typeof value === "object") return value;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
};

const firstText = (...values) => {
  for (const value of values) {
    const normalized = toText(value);
    if (normalized) return normalized;
  }
  return null;
};

const normalizeRamLabel = (value) => {
  const ram = toText(value);
  if (!ram) return null;
  return /\bram\b/i.test(ram) ? ram : `${ram} RAM`;
};

const normalizeRomLabel = (value) => {
  const storage = toText(value);
  if (!storage) return null;
  return /\brom\b/i.test(storage) ? storage : `${storage} ROM`;
};

const parseVariantRamStorage = (label) => {
  const text = toText(label);
  if (!text) return { ram: null, storage: null };

  const pair = text.match(
    /(\d+(?:\.\d+)?)\s*(GB|MB)\s*(?:RAM)?\s*(?:\/|\+|\|)\s*(\d+(?:\.\d+)?)\s*(GB|TB)/i,
  );
  if (pair) {
    return {
      ram: `${pair[1]} ${pair[2]}`.toUpperCase(),
      storage: `${pair[3]} ${pair[4]}`.toUpperCase(),
    };
  }

  const ram = text.match(/(\d+(?:\.\d+)?)\s*(GB|MB)\s*RAM/i);
  const storage = text.match(/(\d+(?:\.\d+)?)\s*(GB|TB)\s*(?:ROM|STORAGE)?/i);

  return {
    ram: ram ? `${ram[1]} ${ram[2]}`.toUpperCase() : null,
    storage: storage ? `${storage[1]} ${storage[2]}`.toUpperCase() : null,
  };
};

const getRamStorageFromTrendingRow = (row) => {
  const attrs = parseObjectIfNeeded(
    row?.attributes ?? row?.variant_attributes ?? row?.variantAttributes,
  );
  const specs = parseObjectIfNeeded(row?.specs);
  const perf = parseObjectIfNeeded(row?.performance);
  const variant = parseObjectIfNeeded(row?.variant);

  let ram = firstText(
    row?.ram,
    row?.RAM,
    row?.memory,
    row?.variant_ram,
    row?.variantRam,
    attrs?.ram,
    attrs?.RAM,
    attrs?.memory,
    specs?.ram,
    specs?.RAM,
    perf?.ram,
    perf?.RAM,
    variant?.ram,
    variant?.RAM,
  );

  let storage = firstText(
    row?.storage,
    row?.internal_storage,
    row?.storage_capacity,
    row?.rom,
    row?.ROM,
    row?.variant_storage,
    row?.variantStorage,
    attrs?.storage,
    attrs?.internal_storage,
    attrs?.rom,
    attrs?.ROM,
    specs?.storage,
    specs?.rom,
    specs?.ROM,
    perf?.storage,
    perf?.rom,
    perf?.ROM_storage,
    variant?.storage,
    variant?.rom,
  );

  if (!ram || !storage) {
    const fromLabel = parseVariantRamStorage(
      firstText(
        row?.variant_name,
        row?.variant_title,
        row?.variant_label,
        row?.title,
      ),
    );
    if (!ram) ram = fromLabel.ram;
    if (!storage) storage = fromLabel.storage;
  }

  return { ram, storage };
};

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
    smartphone: "smartphone",
    laptop: "laptop",
    appliance: "home_appliance",
    networking: "networking",
  };

  // Fetch trending products for active category
  useEffect(() => {
    let cancelled = false;
    const fetchTrending = async () => {
      setLoadingTrending(true);
      setCurrentDevices([]);
      const type = apiForCategory[activeCategory] || "smartphone";
      const qs = new URLSearchParams({ type, limit: "15" }).toString();
      const endpoint =
        activeCategory === "smartphone"
          ? "/api/public/trending/smartphones"
          : `/api/public/trending-products?${qs}`;

      try {
        const r = await fetch(`https://api.apisphere.in${endpoint}`);
        if (!r.ok) throw new Error("Failed to fetch trending");
        const json = await r.json();
        if (cancelled) return;

        const rows = Array.isArray(json?.trending)
          ? json.trending
          : Array.isArray(json)
            ? json
            : [];
        const mapped = rows.slice(0, 15).map((row) => {
          const basePrice =
            row.price ?? row.base_price ?? row.starting_price ?? null;
          const specs = getRamStorageFromTrendingRow(row);
          const priceStr =
            basePrice !== null && basePrice !== undefined && basePrice !== ""
              ? `₹${Number(basePrice).toLocaleString()}`
              : "N/A";

          return {
            id: row.id ?? row.product_id ?? null,
            variantId: row.variant_id ?? row.variantId ?? null,
            name: row.name ?? row.product_name ?? row.model ?? "",
            brand: row.brand ?? row.brand_name ?? "",
            badge: row.badge ?? row.trend_label ?? "Trending",
            base_price: basePrice !== null ? String(basePrice) : null,
            price: priceStr,
            ram: specs.ram,
            storage: specs.storage,
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
            Top Trending{" "}
            <span className="bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600 bg-clip-text text-transparent">
              Smartphones & Gadgets
            </span>
          </h2>
        </div>
        <p className="text-sm text-gray-600">
          Explore trending smartphones, laptops, appliances, and networking devices
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-left">
            <h3 className="text-lg font-semibold text-gray-900">Trending Now</h3>
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
                        className={`mt-1 text-sm sm:text-base font-semibold text-gray-900 leading-snug line-clamp-2 group-hover:text-red-600 transition-colors duration-200 ${
                          device.ram || device.storage
                            ? "min-h-[2rem] md:min-h-[2.5rem]"
                            : "min-h-[2.5rem] md:min-h-[3rem]"
                        }`}
                      >
                        {device.name}
                      </h3>
                      {(device.ram || device.storage) && (
                        <p className="mt-0.5 text-xs sm:text-sm text-gray-500 line-clamp-1">
                          {[normalizeRamLabel(device.ram), normalizeRomLabel(device.storage)]
                            .filter(Boolean)
                            .join(" | ")}
                        </p>
                      )}
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

