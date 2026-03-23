import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  FaExchangeAlt,
  FaLaptop,
  FaMobileAlt,
  FaFilter,
  FaFire,
  FaSearch,
  FaSort,
  FaTimes,
  FaTv,
  FaWifi,
} from "react-icons/fa";
import useRevealAnimation from "../hooks/useRevealAnimation";
import SEO from "./SEO";
import RecommendedSmartphones from "./Home/RecommendedSmartphones";
import ProductDiscoverySections from "./ui/ProductDiscoverySections";
import { normalizeScore100Value } from "../utils/groupScoreStats";
import resolveSmartphoneBadgeScore from "../utils/smartphoneBadgeScore";

const ITEMS_PER_PAGE = 12;

const DEVICE_TYPE_OPTIONS = [
  { value: "all", label: "All Devices", hint: "Browse every category" },
  {
    value: "smartphone",
    label: "Smartphones & Mobiles",
    hint: "Phone comparisons and popular face-offs",
  },
  {
    value: "laptop",
    label: "Laptops & Computers",
    hint: "Compare work, study, and gaming laptops",
  },
  {
    value: "tv",
    label: "TVs & Televisions",
    hint: "Smart TV and big-screen matchups",
  },
  {
    value: "network",
    label: "Networking Devices",
    hint: "Routers, Wi-Fi gear, and networking picks",
  },
];

const SORT_OPTIONS = [
  {
    value: "trending",
    label: "Most Compared (Trending)",
  },
  {
    value: "newest",
    label: "Newest First",
  },
];

const FILTER_CHIPS = [
  {
    id: "all",
    label: "All Devices",
    deviceType: "all",
    icon: FaMobileAlt,
  },
  {
    id: "smartphones",
    label: "Smartphones",
    deviceType: "smartphone",
    icon: FaMobileAlt,
  },
  {
    id: "laptops",
    label: "Laptops",
    deviceType: "laptop",
    icon: FaLaptop,
  },
  {
    id: "tvs",
    label: "TVs",
    deviceType: "tv",
    icon: FaTv,
  },
  {
    id: "network",
    label: "Networking",
    deviceType: "network",
    icon: FaWifi,
  },
];

// Spec Score Badge Component
const CircularScoreBadge = ({ score, size = 38 }) => {
  const normalized = normalizeScore100Value(score);
  const percentage = normalized != null ? Number(normalized.toFixed(1)) : null;
  const label = percentage != null ? `${percentage.toFixed(1)}%` : "--";

  return (
    <div
      className="inline-flex flex-col items-center justify-center rounded-md border border-violet-200 bg-violet-50/95 px-1.5 py-1 leading-none"
      style={{ minWidth: `${Math.max(38, Math.round(size))}px` }}
      aria-label={
        percentage != null
          ? `Overall score ${percentage.toFixed(1)} percent`
          : "Overall score unavailable"
      }
    >
      <span className="text-[11px] font-bold text-violet-700">{label}</span>
      <span className="mt-0.5 text-[8px] font-semibold uppercase tracking-wide text-violet-600">
        Spec
      </span>
    </div>
  );
};

const PopularComparisonsPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [deviceTypeFilter, setDeviceTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("trending");
  const [productById, setProductById] = useState({});
  const [smartphoneById, setSmartphoneById] = useState({});
  const isLoaded = useRevealAnimation();

  // Fetch comparisons data
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(
          "https://api.apisphere.in/api/public/trending/most-compared",
        );
        if (!res.ok) return;
        const json = await res.json();
        if (cancelled) return;

        const mapped = (json.mostCompared || []).map((r) => ({
          left_id: r.product_id,
          left_name: r.product_name,
          left_image: r.product_image || null,
          left_type: r.product_type || "unknown",
          right_id: r.compared_product_id,
          right_name: r.compared_product_name,
          right_image: r.compared_product_image || null,
          right_type: r.compared_product_type || "unknown",
          compare_count: Number(r.compare_count) || 0,
        }));
        setData(mapped);
        setLoading(false);
      } catch {
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadSmartphones = async () => {
      try {
        const res = await fetch("https://api.apisphere.in/api/smartphones", {
          cache: "no-store",
        });
        if (!res.ok) return;
        const json = await res.json();
        if (cancelled) return;

        const rows = Array.isArray(json)
          ? json
          : Array.isArray(json.smartphones)
            ? json.smartphones
            : Array.isArray(json.data)
              ? json.data
              : Array.isArray(json.rows)
                ? json.rows
                : [];

        const next = {};
        for (const row of rows) {
          const id = row?.id ?? row?.product_id ?? row?.productId ?? null;
          if (id == null) continue;
          next[String(id)] = row;
        }
        setSmartphoneById(next);
      } catch {
        if (!cancelled) setSmartphoneById({});
      }
    };

    loadSmartphones();
    return () => {
      cancelled = true;
    };
  }, []);

  // Filter and sort logic
  const processedData = useMemo(() => {
    let filtered = data;
    const normalizedSearchQuery = searchQuery.trim().toLowerCase();

    // Apply device type filter
    if (deviceTypeFilter !== "all") {
      filtered = data.filter(
        (item) =>
          item.left_type?.toLowerCase().includes(deviceTypeFilter) ||
          item.right_type?.toLowerCase().includes(deviceTypeFilter),
      );
    }

    if (normalizedSearchQuery) {
      filtered = filtered.filter((item) => {
        const haystacks = [
          item?.left_name,
          item?.right_name,
          item?.left_type,
          item?.right_type,
          `${item?.left_name || ""} vs ${item?.right_name || ""}`,
        ];
        return haystacks.some((value) =>
          String(value || "").toLowerCase().includes(normalizedSearchQuery),
        );
      });
    }

    // Apply sorting
    let sorted = [...filtered];
    if (sortBy === "trending") {
      sorted.sort((a, b) => b.compare_count - a.compare_count);
    } else if (sortBy === "newest") {
      sorted.reverse();
    }

    return sorted;
  }, [data, deviceTypeFilter, searchQuery, sortBy]);

  // Pagination
  const totalPages = Math.ceil(processedData.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedData = processedData.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  const featuredDiscoveryProduct = useMemo(() => {
    if (deviceTypeFilter !== "all" && deviceTypeFilter !== "smartphone") {
      return null;
    }

    for (const item of processedData) {
      const leftType = String(item?.left_type || "").toLowerCase();
      const rightType = String(item?.right_type || "").toLowerCase();
      const leftId = Number(item?.left_id);
      const rightId = Number(item?.right_id);

      if (leftType.includes("smartphone") && Number.isInteger(leftId)) {
        return {
          productId: leftId,
          name: item?.left_name || "this phone",
        };
      }

      if (rightType.includes("smartphone") && Number.isInteger(rightId)) {
        return {
          productId: rightId,
          name: item?.right_name || "this phone",
        };
      }
    }

    return null;
  }, [processedData, deviceTypeFilter]);

  const missingProductIds = useMemo(() => {
    const ids = new Set();
    const rows = Array.isArray(paginatedData) ? paginatedData : [];
    for (const item of rows) {
      const leftId = item?.left_id;
      const rightId = item?.right_id;
      const leftType = String(item?.left_type || "").toLowerCase();
      const rightType = String(item?.right_type || "").toLowerCase();

      if (
        leftId != null &&
        !leftType.includes("smartphone") &&
        !Object.prototype.hasOwnProperty.call(productById, String(leftId))
      ) {
        ids.add(String(leftId));
      }
      if (
        rightId != null &&
        !rightType.includes("smartphone") &&
        !Object.prototype.hasOwnProperty.call(productById, String(rightId))
      ) {
        ids.add(String(rightId));
      }
    }
    return Array.from(ids);
  }, [paginatedData, productById]);

  useEffect(() => {
    if (!missingProductIds.length) return;
    let cancelled = false;

    const loadProducts = async () => {
      const results = await Promise.all(
        missingProductIds.map(async (id) => {
          try {
            const res = await fetch(
              `https://api.apisphere.in/api/public/product/${encodeURIComponent(
                id,
              )}`,
              { cache: "no-store" },
            );
            if (!res.ok) return [id, null];
            const json = await res.json();
            return [id, json];
          } catch {
            return [id, null];
          }
        }),
      );

      if (cancelled) return;
      setProductById((prev) => {
        const next = { ...prev };
        for (const [id, product] of results) {
          next[String(id)] = product;
        }
        return next;
      });
    };

    loadProducts();
    return () => {
      cancelled = true;
    };
  }, [missingProductIds]);

  const pageTitle =
    "Popular Device Comparisons | Compare Trending Products | Hooks";
  const pageDescription =
    "Explore the most popular device comparisons on Hooks. Compare trending smartphones, laptops, TVs, and networking devices. Find the best device for you by comparing top choices.";

  const comparisonSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Popular Device Comparisons",
    description: pageDescription,
    url: "https://tryhook.shop/popular-comparisons",
    mainEntity: {
      "@type": "ItemList",
      itemListElement: paginatedData.slice(0, 10).map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: `${item.left_name} vs ${item.right_name}`,
        url: `https://tryhook.shop/compare?devices=${item.left_id}:0,${item.right_id}:0`,
      })),
    },
  };

  const hasCustomFilter =
    deviceTypeFilter !== "all" ||
    sortBy !== SORT_OPTIONS[0].value ||
    searchQuery.trim().length > 0;
  const showingLabel = `Showing ${processedData.length.toLocaleString()} of ${data.length.toLocaleString()} options`;

  return (
    <div className="px-2 lg:px-4 mx-auto bg-white max-w-4xl w-full m-0 overflow-hidden">
      <SEO
        title={pageTitle}
        description={pageDescription}
        keywords="popular comparisons, device comparison, trending devices, compare smartphones, compare laptops, product comparison"
        url="https://tryhook.shop/popular-comparisons"
        schema={comparisonSchema}
      />

      <div className="py-6 sm:py-8 md:py-10 lg:py-2">
        {/* Header Section */}
        <div
          className={`mb-2 sm:mb-5 transition-all duration-700 ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <div className="inline-flex items-center gap-2 bg-indigo-50 backdrop-blur-sm px-3 py-1.5 rounded-full border border-indigo-200 mb-4 sm:mb-6">
            <FaFire className="text-red-500 text-sm" />
            <span className="text-xs sm:text-sm font-semibold text-indigo-900">
              COMPARISON COLLECTION
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-4xl xl:text-5xl font-bold mb-2 sm:mb-3 md:mb-4 lg:mb-4 leading-tight">
            Popular Device{" "}
            <span className="bg-gradient-to-r from-indigo-600 via-blue-500 to-cyan-500 bg-clip-text text-transparent">
              Comparisons
            </span>
          </h1>

          <h4 className="text-base sm:text-lg md:text-lg lg:text-xl mb-0 text-gray-600 leading-relaxed max-w-3xl">
            Explore the most compared devices trending right now. See what users
            are comparing and make informed buying decisions with accurate specs
            and features.
          </h4>
        </div>

        {/* Filters Section */}
        <div className="mb-6 sm:mb-7 md:mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FaFilter className="text-indigo-600" />
              <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                Popular Categories
              </h3>
            </div>
            {(deviceTypeFilter !== "all" || searchQuery.trim()) && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setDeviceTypeFilter("all");
                  setCurrentPage(1);
                }}
                className="text-xs sm:text-sm text-indigo-700 hover:text-indigo-900 font-semibold"
              >
                Clear
              </button>
            )}
          </div>
          <p className="text-xs text-gray-600 mb-3">
            Popular comparison groups users explore most on Hooks
          </p>
          <div className="flex gap-2.5 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {FILTER_CHIPS.map((chip) => {
              const isActive = deviceTypeFilter === chip.deviceType;
              const Icon = chip.icon;

              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => {
                    setDeviceTypeFilter(chip.deviceType);
                    setCurrentPage(1);
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-full border text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white border-indigo-600 shadow-lg"
                      : "bg-white text-gray-700 border-gray-200 hover:border-indigo-300 hover:text-indigo-700 hover:shadow-md"
                  }`}
                >
                  <span
                    className={isActive ? "text-white" : "text-indigo-600"}
                  >
                    <Icon className="text-base" />
                  </span>
                  <span>{chip.label}</span>
                </button>
              );
            })}
          </div>

          <div className="mb-6 sm:mb-7 md:mb-8">
            <div className="hidden lg:flex items-center justify-between mb-4 md:mb-5 lg:mb-6 gap-4">
              <div className="flex-1 max-w-xl">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FaSearch className="text-purple-500 group-focus-within:text-purple-600 transition-colors duration-200" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search comparisons by brand, model, or device..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-2">
                  <FaFilter className="text-gray-500" />
                  <span className="text-sm text-gray-600">Sort by:</span>
                </div>
                <div className="relative min-w-[210px]">
                  <select
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 text-gray-700 appearance-none cursor-pointer bg-white pr-10 transition-all duration-200 hover:border-purple-400"
                  >
                    {SORT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                    <svg
                      className="fill-current h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>

                {hasCustomFilter && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setDeviceTypeFilter("all");
                      setSortBy("trending");
                      setCurrentPage(1);
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-colors"
                  >
                    <FaTimes />
                    Clear Filters
                  </button>
                )}
              </div>
            </div>

            <div className="lg:hidden space-y-3 sm:space-y-4 mb-4 sm:mb-5 md:mb-6">
              <div className="relative group">
                <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-500 group-focus-within:text-purple-600 transition-colors duration-200" />
                <input
                  type="text"
                  placeholder="Search comparisons..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full h-12 pl-12 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-gray-700 transition-all duration-200 placeholder:text-gray-400"
                />
              </div>

              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full h-12 px-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-gray-700 appearance-none bg-white pr-10 transition-all duration-200"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                  <svg
                    className="fill-current h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>

              {hasCustomFilter && (
                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl border border-purple-200">
                  <div className="flex items-center gap-3">
                    <FaFilter className="text-purple-600" />
                    <div>
                      <span className="text-sm font-medium text-purple-800">
                        Filters are active
                      </span>
                      <p className="text-xs text-purple-700">
                        {showingLabel}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setDeviceTypeFilter("all");
                      setSortBy("trending");
                      setCurrentPage(1);
                    }}
                    className="text-sm font-semibold text-purple-700 hover:text-purple-900"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Available Comparisons
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Browse the most compared device matchups with current filters
                  and sorting applied.
                </p>
              </div>
              <div className="text-sm text-gray-500">{showingLabel}</div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-12">
            <FaSort className="mx-auto text-3xl text-indigo-600 animate-spin" />
            <p className="mt-4 text-gray-600 font-medium">
              Loading popular comparisons...
            </p>
          </div>
        ) : paginatedData.length === 0 ? (
          <div className="text-center py-12">
            <FaExchangeAlt className="mx-auto text-4xl text-gray-400 mb-4" />
            <p className="text-gray-600 font-medium">
              No comparisons found for this filter
            </p>
            <button
              onClick={() => {
                setDeviceTypeFilter("all");
                setCurrentPage(1);
              }}
              className="mt-4 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg hover:shadow-lg hover:shadow-indigo-200 transition-all font-semibold text-sm"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <>
            {/* Comparisons Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mb-8">
              {paginatedData.map((item, index) => {
                const leftProduct =
                  item.left_type === "smartphone"
                    ? smartphoneById[String(item.left_id)] ||
                      productById[String(item.left_id)] ||
                      null
                    : productById[String(item.left_id)] || null;
                const rightProduct =
                  item.right_type === "smartphone"
                    ? smartphoneById[String(item.right_id)] ||
                      productById[String(item.right_id)] ||
                      null
                    : productById[String(item.right_id)] || null;
                const leftResolvedScore =
                  resolveSmartphoneBadgeScore(leftProduct);
                const rightResolvedScore =
                  resolveSmartphoneBadgeScore(rightProduct);
                const showLeftScore =
                  item.left_type === "smartphone"
                    ? Boolean(
                        leftProduct?.allowSpecScore ??
                        leftProduct?.allow_spec_score ??
                        false,
                      )
                    : leftResolvedScore != null;
                const showRightScore =
                  item.right_type === "smartphone"
                    ? Boolean(
                        rightProduct?.allowSpecScore ??
                        rightProduct?.allow_spec_score ??
                        false,
                      )
                    : rightResolvedScore != null;

                return (
                  <Link
                    key={`${item.left_id}-${item.right_id}-${index}`}
                    to={`/compare?devices=${item.left_id}:0,${item.right_id}:0`}
                    className={`group transition-all duration-700 ${
                      isLoaded ? "opacity-100" : "opacity-0"
                    }`}
                    style={{ transitionDelay: `${index * 50}ms` }}
                  >
                    <div className="h-full p-4 sm:p-2 bg-white border border-gray-50 rounded-sm md:hover:border-indigo-300 md:hover:shadow-lg transition-all duration-300 md:hover:scale-105">
                      {/* Comparison Count Badge */}

                      {/* Device Comparison */}
                      <div className="flex items-center justify-between gap-2 overflow-hidden mb-3">
                        {/* Left Device */}
                        <div className="flex-1 text-center overflow-hidden">
                          <div className="relative w-full h-24 sm:h-28 mb-2">
                            {item.left_image ? (
                              <img
                                src={item.left_image}
                                alt={item.left_name}
                                className="w-full h-full object-contain bg-gradient-to-br from-gray-50 to-gray-100 rounded-md p-1 transition-transform duration-300"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex items-center justify-center">
                                <FaMobileAlt className="text-gray-300 text-2xl" />
                              </div>
                            )}
                            {showLeftScore && leftResolvedScore != null && (
                              <div className="absolute left-1.5 top-1.5 z-10 pointer-events-none">
                                <CircularScoreBadge
                                  score={leftResolvedScore}
                                  size={42}
                                />
                              </div>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm font-bold text-gray-900 whitespace-nowrap truncate">
                            {item.left_name}
                          </p>
                        </div>

                        {/* VS Badge */}
                        <div className="flex-shrink-0 px-1">
                          <div className="text-xs font-bold bg-gradient-to-r from-indigo-100 to-blue-100 text-indigo-700 px-2 py-1 rounded-full whitespace-nowrap">
                            VS
                          </div>
                        </div>

                        {/* Right Device */}
                        <div className="flex-1 text-center overflow-hidden">
                          <div className="relative w-full h-24 sm:h-28 mb-2">
                            {item.right_image ? (
                              <img
                                src={item.right_image}
                                alt={item.right_name}
                                className="w-full h-full object-contain bg-gradient-to-br from-gray-50 to-gray-100 rounded-md p-1 transition-transform duration-300"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 rounded-md flex items-center justify-center">
                                <FaMobileAlt className="text-gray-300 text-2xl" />
                              </div>
                            )}
                            {showRightScore && rightResolvedScore != null && (
                              <div className="absolute left-1.5 top-1.5 z-10 pointer-events-none">
                                <CircularScoreBadge
                                  score={rightResolvedScore}
                                  size={42}
                                />
                              </div>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm font-bold text-gray-900 whitespace-nowrap truncate">
                            {item.right_name}
                          </p>
                        </div>
                      </div>

                      {/* CTA Button */}
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mb-8">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 sm:px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-medium"
                >
                  Previous
                </button>

                <div className="flex gap-1">
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    let page;
                    if (totalPages <= 7) {
                      page = i + 1;
                    } else if (currentPage <= 4) {
                      page = i + 1;
                    } else if (currentPage >= totalPages - 3) {
                      page = totalPages - 6 + i;
                    } else {
                      page = currentPage - 3 + i;
                    }
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-2 sm:px-3 py-2 rounded-lg font-semibold text-sm transition ${
                          currentPage === page
                            ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-200"
                            : "border border-gray-200 hover:bg-gray-50 text-gray-900"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-3 sm:px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-medium"
                >
                  Next
                </button>
              </div>
            )}
            {featuredDiscoveryProduct && <RecommendedSmartphones />}

            {featuredDiscoveryProduct && (
              <section className="mt-8 sm:mt-10 overflow-hidden ">
                <ProductDiscoverySections
                  productId={featuredDiscoveryProduct.productId}
                  entityType="smartphones"
                  className="pt-1"
                />
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PopularComparisonsPage;
