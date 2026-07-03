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
} from "react-icons/fa";
import useRevealAnimation from "../hooks/useRevealAnimation";
import SEO from "./SEO";
// import RecommendedSmartphones from "./Home/RecommendedSmartphones";
import ProductDiscoverySections from "./ui/ProductDiscoverySections";
import {
  buildCanonicalComparePath,
  buildCanonicalComparePathFromDevices,
} from "../utils/compareRoutes";
import {
  getPreloadedApiMap,
  readPreloadedApiResponse,
} from "../utils/preloadedApi";
import {
  createBreadcrumbSchema,
  createCollectionSchema,
  createItemListSchema,
} from "../utils/schemaGenerators";
import { toCanonicalPageUrl } from "../utils/publicUrl";

const ITEMS_PER_PAGE = 12;
const SITE_ORIGIN = "https://tryhook.shop";
const POPULAR_COMPARISONS_PATH = "/popular-comparisons";
const POPULAR_COMPARISONS_URL = toCanonicalPageUrl(
  POPULAR_COMPARISONS_PATH,
  SITE_ORIGIN,
);

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
];

const MOST_COMPARED_ENDPOINT =
  "https://api.apisphere.in/api/public/trending/most-compared?days=180&scope=groups&limit=300";
const SMARTPHONES_ENDPOINT = "https://api.apisphere.in/api/smartphones";
const PRODUCT_ENDPOINT_BASE = "https://api.apisphere.in/api/public/product";

const normalizeComparedProduct = (product = {}) => ({
  product_id: product.product_id ?? product.productId ?? product.id ?? null,
  id: product.product_id ?? product.productId ?? product.id ?? null,
  product_name:
    product.product_name || product.productName || product.name || "Device",
  name: product.product_name || product.productName || product.name || "Device",
  product_type:
    product.product_type ||
    product.productType ||
    product.deviceType ||
    "unknown",
  image_url:
    product.image_url || product.image || product.product_image || null,
  image: product.image_url || product.image || product.product_image || null,
  best_price: product.best_price ?? product.bestPrice ?? product.price ?? null,
  detail_path: product.detail_path || product.detailPath || "",
});

const mapMostComparedRows = (json) =>
  (json?.mostCompared || []).map((r) => {
    const products =
      Array.isArray(r.products) && r.products.length
        ? r.products.map(normalizeComparedProduct)
        : [
            normalizeComparedProduct({
              product_id: r.product_id,
              product_name: r.product_name,
              product_type: r.product_type,
              image_url: r.product_image,
            }),
            normalizeComparedProduct({
              product_id: r.compared_product_id,
              product_name: r.compared_product_name,
              product_type: r.compared_product_type,
              image_url: r.compared_product_image,
            }),
          ].filter((product) => product.product_id != null);
    const [left, right] = products;
    return {
      ...r,
      products,
      product_count: Number(r.product_count) || products.length,
      left_id: left?.product_id ?? r.product_id,
      left_name: left?.product_name ?? r.product_name,
      left_image: left?.image_url ?? r.product_image ?? null,
      left_type: left?.product_type ?? r.product_type ?? "unknown",
      right_id: right?.product_id ?? r.compared_product_id,
      right_name: right?.product_name ?? r.compared_product_name,
      right_image: right?.image_url ?? r.compared_product_image ?? null,
      right_type: right?.product_type ?? r.compared_product_type ?? "unknown",
      compare_count: Number(r.compare_count) || 0,
      unique_users: Number(r.unique_users ?? r.unique_user_count) || 0,
      last_compared_at: r.last_compared_at || null,
      route_path: r.route_path || "",
    };
  });

const mapSmartphonesById = (json) => {
  const rows = Array.isArray(json)
    ? json
    : Array.isArray(json?.smartphones)
      ? json.smartphones
      : Array.isArray(json?.data)
        ? json.data
        : Array.isArray(json?.rows)
          ? json.rows
          : [];

  const next = {};
  for (const row of rows) {
    const id = row?.id ?? row?.product_id ?? row?.productId ?? null;
    if (id == null) continue;
    next[String(id)] = row;
  }
  return next;
};

const mapPreloadedProductsById = () => {
  const byUrl = getPreloadedApiMap();
  if (!byUrl) return {};

  const next = {};

  Object.entries(byUrl).forEach(([rawUrl, value]) => {
    try {
      const parsed = new URL(rawUrl, window.location.origin);
      if (parsed.search) return;

      const segments = parsed.pathname.split("/").filter(Boolean);
      if (
        segments.length !== 4 ||
        segments[0] !== "api" ||
        segments[1] !== "public" ||
        segments[2] !== "product"
      ) {
        return;
      }

      const productId = String(segments[3] || "").trim();
      if (!productId) return;
      next[productId] = value;
    } catch {
      // Ignore malformed payload keys.
    }
  });

  return next;
};

const PopularComparisonsPage = () => {
  const [data, setData] = useState(() =>
    mapMostComparedRows(readPreloadedApiResponse(MOST_COMPARED_ENDPOINT) || {}),
  );
  const [loading, setLoading] = useState(
    () => !readPreloadedApiResponse(MOST_COMPARED_ENDPOINT),
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [deviceTypeFilter, setDeviceTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("trending");
  const [productById, setProductById] = useState(() =>
    mapPreloadedProductsById(),
  );
  const [smartphoneById, setSmartphoneById] = useState(() =>
    mapSmartphonesById(readPreloadedApiResponse(SMARTPHONES_ENDPOINT) || {}),
  );
  const isLoaded = useRevealAnimation();

  // Fetch comparisons data
  useEffect(() => {
    const preloadedPayload = readPreloadedApiResponse(MOST_COMPARED_ENDPOINT);
    if (preloadedPayload) {
      setData(mapMostComparedRows(preloadedPayload));
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(MOST_COMPARED_ENDPOINT);
        if (!res.ok) return;
        const json = await res.json();
        if (cancelled) return;
        setData(mapMostComparedRows(json));
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
    const preloadedPayload = readPreloadedApiResponse(SMARTPHONES_ENDPOINT);
    if (preloadedPayload) {
      setSmartphoneById(mapSmartphonesById(preloadedPayload));
      return undefined;
    }

    let cancelled = false;

    const loadSmartphones = async () => {
      try {
        const res = await fetch(SMARTPHONES_ENDPOINT, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const json = await res.json();
        if (cancelled) return;
        setSmartphoneById(mapSmartphonesById(json));
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
          (Array.isArray(item.products) ? item.products : []).some((product) =>
            String(product?.product_type || "")
              .toLowerCase()
              .includes(deviceTypeFilter),
          ) ||
          item.left_type?.toLowerCase().includes(deviceTypeFilter) ||
          item.right_type?.toLowerCase().includes(deviceTypeFilter),
      );
    }

    if (normalizedSearchQuery) {
      filtered = filtered.filter((item) => {
        const haystacks = [
          ...(Array.isArray(item.products)
            ? item.products.map((product) => product?.product_name)
            : []),
          item?.left_name,
          item?.right_name,
          item?.left_type,
          item?.right_type,
          (Array.isArray(item.products) ? item.products : [])
            .map((product) => product?.product_name)
            .filter(Boolean)
            .join(" vs ") ||
            `${item?.left_name || ""} vs ${item?.right_name || ""}`,
        ];
        return haystacks.some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(normalizedSearchQuery),
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
      const products =
        Array.isArray(item?.products) && item.products.length
          ? item.products
          : [
              {
                product_id: item?.left_id,
                product_type: item?.left_type,
                product_name: item?.left_name,
              },
              {
                product_id: item?.right_id,
                product_type: item?.right_type,
                product_name: item?.right_name,
              },
            ];

      const phone = products.find((product) =>
        String(product?.product_type || "")
          .toLowerCase()
          .includes("smartphone"),
      );
      const phoneId = Number(phone?.product_id);
      if (Number.isInteger(phoneId)) {
        return {
          productId: phoneId,
          name: phone?.product_name || "this phone",
        };
      }
    }

    return null;
  }, [processedData, deviceTypeFilter]);

  const missingProductIds = useMemo(() => {
    const ids = new Set();
    const rows = Array.isArray(paginatedData) ? paginatedData : [];
    for (const item of rows) {
      const products =
        Array.isArray(item?.products) && item.products.length
          ? item.products
          : [
              {
                product_id: item?.left_id,
                product_type: item?.left_type,
              },
              {
                product_id: item?.right_id,
                product_type: item?.right_type,
              },
            ];

      for (const product of products) {
        const id = product?.product_id;
        const type = String(product?.product_type || "").toLowerCase();
        if (
          id != null &&
          !type.includes("smartphone") &&
          !Object.prototype.hasOwnProperty.call(productById, String(id))
        ) {
          ids.add(String(id));
        }
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
              `${PRODUCT_ENDPOINT_BASE}/${encodeURIComponent(id)}`,
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
    "Popular Mobile Phone & Device Comparisons in India - Hooks";
  const pageDescription =
    "Explore popular mobile phone and device comparisons in India on Hooks. Compare trending smartphones, laptops, and TVs side by side before you buy.";
  const pageKeywords =
    "popular mobile comparisons, popular phone comparisons India, compare mobile phones, smartphone comparison India, compare laptops, compare TVs, device comparison, trending product comparisons";

  const listSchemaItems = useMemo(() => {
    return processedData.slice(0, 20).map((item) => {
      const products =
        Array.isArray(item.products) && item.products.length
          ? item.products
          : [
              {
                product_id: item.left_id,
                product_name: item.left_name,
                product_type: item.left_type,
                image_url: item.left_image,
              },
              {
                product_id: item.right_id,
                product_name: item.right_name,
                product_type: item.right_type,
                image_url: item.right_image,
              },
            ].filter((product) => product.product_id != null);

      const path =
        item.route_path ||
        buildCanonicalComparePathFromDevices({
          devices: products,
          getName: (product) => product?.product_name || product?.name || "",
          getId: (product) => product?.product_id || product?.id || null,
        }) ||
        buildCanonicalComparePath({
          leftName: item.left_name,
          rightName: item.right_name,
        });

      const image = products
        .map((product) => {
          const productId = String(product?.product_id ?? "");
          const isPhone = String(product?.product_type || "")
            .toLowerCase()
            .includes("smartphone");
          const resolvedProduct = isPhone
            ? smartphoneById[productId] || productById[productId] || null
            : productById[productId] || null;
          return (
            product?.image_url ||
            product?.image ||
            resolvedProduct?.image_url ||
            resolvedProduct?.image ||
            (Array.isArray(resolvedProduct?.images)
              ? resolvedProduct.images.find(Boolean)
              : null)
          );
        })
        .find(Boolean);

      return {
        name:
          products
            .map((product) => product?.product_name || product?.name)
            .filter(Boolean)
            .join(" vs ") || `${item.left_name} vs ${item.right_name}`,
        url: toCanonicalPageUrl(path || "/compare", SITE_ORIGIN),
        image: image || undefined,
      };
    });
  }, [processedData, productById, smartphoneById]);

  const pageOgImageMeta = useMemo(() => {
    const firstComparisonImage = listSchemaItems.find(
      (item) => item.image,
    )?.image;
    return {
      url: firstComparisonImage || `${SITE_ORIGIN}/hook-logo.png`,
      width: 1200,
      height: 630,
      alt: "Popular mobile phone and device comparisons on Hooks",
    };
  }, [listSchemaItems]);

  const comparisonSchema = useMemo(
    () => [
      createCollectionSchema({
        name: "Popular Mobile Phone & Device Comparisons in India",
        description: pageDescription,
        url: POPULAR_COMPARISONS_URL,
        image: pageOgImageMeta,
      }),
      createItemListSchema({
        name: "Popular Mobile Phone & Device Comparisons",
        description: pageDescription,
        url: POPULAR_COMPARISONS_URL,
        items: listSchemaItems,
      }),
      createBreadcrumbSchema([
        { label: "Home", url: SITE_ORIGIN },
        { label: "Popular Comparisons", url: POPULAR_COMPARISONS_URL },
      ]),
    ],
    [listSchemaItems, pageDescription, pageOgImageMeta],
  );

  const hasCustomFilter =
    deviceTypeFilter !== "all" ||
    sortBy !== SORT_OPTIONS[0].value ||
    searchQuery.trim().length > 0;
  const showingLabel = `Showing ${processedData.length.toLocaleString()} of ${data.length.toLocaleString()} options`;

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <SEO
        title={pageTitle}
        description={pageDescription}
        keywords={pageKeywords}
        image={pageOgImageMeta}
        url={POPULAR_COMPARISONS_URL}
        robots="index, follow, max-image-preview:large"
        schema={comparisonSchema}
      />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        {/* Header Section */}
        <div
          className={`mb-6 sm:mb-8 transition-all duration-700 ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <div className="mb-3 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.32em] text-blue-600 sm:text-xs">
            <FaFire className="text-sm" />
            <span>COMPARISON COLLECTION</span>
          </div>

          <h1 className="max-w-4xl text-2xl font-semibold tracking-tight text-[#14255e] sm:text-3xl md:text-4xl">
            Popular Device Comparisons
          </h1>

          <h4 className="mt-3 max-w-4xl text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">
            Explore the most compared devices trending right now. See what users
            are comparing and make informed buying decisions with accurate specs
            and features.
          </h4>
        </div>

        {/* Filters Section */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FaFilter className="text-blue-600" />
              <h3 className="text-sm font-semibold text-slate-900 sm:text-base">
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
                className="text-xs font-semibold text-blue-700 transition-colors hover:text-blue-900 sm:text-sm"
              >
                Clear
              </button>
            )}
          </div>
          <p className="mb-3 text-xs text-slate-500">
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
                  className={`flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-2 text-xs font-semibold transition-colors duration-200 sm:text-sm ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  <span className={isActive ? "text-white" : "text-blue-600"}>
                    <Icon className="text-base" />
                  </span>
                  <span>{chip.label}</span>
                </button>
              );
            })}
          </div>

          <div className="mb-6 sm:mb-8">
            <div className="mb-4 hidden items-center justify-between gap-4 md:mb-5 lg:mb-6 lg:flex">
              <div className="flex-1 max-w-xl">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FaSearch className="text-slate-400 transition-colors duration-200 group-focus-within:text-blue-500" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search comparisons by brand, model, or device..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full rounded-lg border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm text-slate-900 transition-all placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-400 sm:text-base"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-2">
                  <FaFilter className="text-slate-400" />
                  <span className="text-sm text-slate-600">Sort by:</span>
                </div>
                <div className="relative min-w-[210px]">
                  <select
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white px-4 py-2.5 pr-10 text-slate-700 transition-all duration-200 hover:border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    {SORT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
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
                    className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-blue-600 transition-colors hover:bg-slate-100 hover:text-blue-700"
                  >
                    <FaTimes />
                    Clear Filters
                  </button>
                )}
              </div>
            </div>

            <div className="mb-4 space-y-3 sm:mb-5 sm:space-y-4 md:mb-6 lg:hidden">
              <div className="relative group">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors duration-200 group-focus-within:text-blue-500" />
                <input
                  type="text"
                  placeholder="Search comparisons..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-12 w-full rounded-lg border border-slate-200 py-2 pl-12 pr-4 text-slate-900 transition-all duration-200 placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-12 w-full appearance-none rounded-lg border border-slate-200 bg-white px-4 pr-10 text-slate-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
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
                <div className="flex items-center justify-between rounded-lg border border-blue-100 bg-[#f8fbff] p-4">
                  <div className="flex items-center gap-3">
                    <FaFilter className="text-blue-600" />
                    <div>
                      <span className="text-sm font-semibold text-slate-900">
                        Filters are active
                      </span>
                      <p className="text-xs text-slate-600">{showingLabel}</p>
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
                    className="text-sm font-semibold text-blue-700 hover:text-blue-900"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 border-t border-slate-200 pt-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="text-xl font-semibold tracking-tight text-[#14255e] sm:text-2xl">
                  Available Comparisons
                </h3>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Browse the most compared device matchups with current filters
                  and sorting applied.
                </p>
              </div>
              <div className="text-sm font-medium text-slate-500">
                {showingLabel}
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-12">
            <FaSort className="mx-auto animate-spin text-3xl text-blue-600" />
            <p className="mt-4 font-medium text-slate-600">
              Loading popular comparisons...
            </p>
          </div>
        ) : paginatedData.length === 0 ? (
          <div className="text-center py-12">
            <FaExchangeAlt className="mx-auto mb-4 text-4xl text-slate-400" />
            <p className="font-medium text-slate-600">
              No comparisons found for this filter
            </p>
            <button
              onClick={() => {
                setDeviceTypeFilter("all");
                setCurrentPage(1);
              }}
              className="mt-4 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <>
            {/* Comparisons Grid */}
            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
              {paginatedData.map((item, index) => {
                const products = (
                  Array.isArray(item.products) && item.products.length
                    ? item.products
                    : [
                        {
                          product_id: item.left_id,
                          product_name: item.left_name,
                          product_type: item.left_type,
                          image_url: item.left_image,
                        },
                        {
                          product_id: item.right_id,
                          product_name: item.right_name,
                          product_type: item.right_type,
                          image_url: item.right_image,
                        },
                      ]
                )
                  .filter((product) => product?.product_id != null)
                  .slice(0, 4);
                const enrichedProducts = products.map((product) => {
                  const productId = String(product.product_id);
                  const isPhone = String(product.product_type || "")
                    .toLowerCase()
                    .includes("smartphone");
                  const resolvedProduct = isPhone
                    ? smartphoneById[productId] ||
                      productById[productId] ||
                      null
                    : productById[productId] || null;
                  return {
                    ...product,
                    resolvedProduct,
                    imageUrl:
                      product.image_url ||
                      product.image ||
                      resolvedProduct?.image_url ||
                      resolvedProduct?.image ||
                      (Array.isArray(resolvedProduct?.images)
                        ? resolvedProduct.images.find(Boolean)
                        : null),
                  };
                });
                const compareTitle =
                  enrichedProducts
                    .map((product) => product?.product_name || product?.name)
                    .filter(Boolean)
                    .join(" vs ") ||
                  `${item.left_name || "Device"} vs ${item.right_name || "Device"}`;
                const comparePath =
                  item.route_path ||
                  buildCanonicalComparePathFromDevices({
                    devices: enrichedProducts,
                    getName: (product) =>
                      product?.product_name || product?.name || "",
                    getId: (product) =>
                      product?.product_id || product?.id || null,
                  }) ||
                  buildCanonicalComparePath({
                    leftName: item.left_name,
                    rightName: item.right_name,
                  });

                return (
                  <Link
                    key={`${item.product_ids?.join("-") || `${item.left_id}-${item.right_id}`}-${index}`}
                    to={comparePath}
                    state={
                      comparePath === "/compare"
                        ? {
                            initialProducts: enrichedProducts.map(
                              (product) => ({
                                ...(product.resolvedProduct || product),
                                id: product.product_id,
                                productId: product.product_id,
                                product_id: product.product_id,
                                name: product.product_name,
                                product_name: product.product_name,
                                productType: product.product_type,
                                product_type: product.product_type,
                              }),
                            ),
                          }
                        : undefined
                    }
                    className={`group transition-all duration-700 ${
                      isLoaded ? "opacity-100" : "opacity-0"
                    }`}
                    style={{ transitionDelay: `${index * 50}ms` }}
                  >
                    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white p-4 transition-all duration-300 hover:border-blue-200 hover:bg-slate-50">
                      <div
                        className="grid gap-3 overflow-hidden"
                        style={{
                          gridTemplateColumns: `repeat(${Math.max(2, enrichedProducts.length)}, minmax(0, 1fr))`,
                        }}
                      >
                        {enrichedProducts.map((product) => (
                          <div
                            key={`${item.compare_count}-${product.product_id}`}
                            className="min-w-0 text-center"
                          >
                            <div className="relative mb-2 flex h-24 w-full items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-2 sm:h-28">
                              {product.imageUrl ? (
                                <img
                                  src={product.imageUrl}
                                  alt={product.product_name}
                                  className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.03]"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center rounded-md bg-white">
                                  <FaMobileAlt className="text-2xl text-slate-300" />
                                </div>
                              )}
                            </div>
                            <p className="truncate text-xs font-semibold text-[#14255e] sm:text-sm">
                              {product.product_name}
                            </p>
                            <p className="mt-0.5 truncate text-[10px] font-medium capitalize text-slate-500">
                              {product.product_type || "device"}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-blue-100 bg-[#f8fbff] px-3 py-2.5">
                        <span className="min-w-0 truncate text-[12px] font-semibold leading-5 text-slate-700">
                          {compareTitle}
                        </span>
                        <span className="shrink-0 text-[12px] font-semibold text-blue-700 transition-colors group-hover:text-blue-800">
                          Compare
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mb-8 flex items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4"
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
                        className={`rounded-lg px-2 py-2 text-sm font-semibold transition sm:px-3 ${
                          currentPage === page
                            ? "bg-blue-600 text-white"
                            : "border border-slate-200 text-slate-900 hover:bg-slate-50"
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
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4"
                >
                  Next
                </button>
              </div>
            )}
            {/* {featuredDiscoveryProduct && <RecommendedSmartphones />} */}

            {featuredDiscoveryProduct && (
              <section className="mt-8 sm:mt-10 overflow-hidden ">
                <ProductDiscoverySections
                  productId={featuredDiscoveryProduct.productId}
                  entityType="smartphones"
                  className="px-4 pt-1 sm:px-0"
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
