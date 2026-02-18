// src/components/PopularBrands.jsx
import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useDevice } from "../../hooks/useDevice";
import {
  FaMobileAlt,
  FaWifi,
  FaLaptop,
  FaPlug,
  FaTag,
  FaTv,
} from "react-icons/fa";
import { Helmet } from "react-helmet-async";

const PopularBrands = () => {
  const [activeBrand, setActiveBrand] = useState("all");
  const navigate = useNavigate();

  const deviceCtx = useDevice();
  const allBrands = (deviceCtx && deviceCtx.brands) || [];

  // Get unique brands with their categories
  const brandCategories = useMemo(() => {
    const categories = [
      {
        id: "all",
        name: "All Brands",
        icon: <FaTag />,
        activeGradient: "from-blue-600 via-purple-500 to-blue-600",
        inactiveColor: "text-gray-400",
        count: allBrands.length,
      },
    ];

    // Group brands by category
    const smartphoneBrands = allBrands.filter((b) => {
      const type = String(b.category || b.product_type || "").toLowerCase();
      return (
        type.includes("smartphone") ||
        type.includes("mobile") ||
        (type.includes("smart") && !type.includes("home"))
      );
    });

    const laptopBrands = allBrands.filter((b) => {
      const type = String(b.category || b.product_type || "").toLowerCase();
      return (
        type.includes("laptop") ||
        type.includes("computer") ||
        type.includes("notebook")
      );
    });

    const applianceBrands = allBrands.filter((b) => {
      const type = String(b.category || b.product_type || "").toLowerCase();
      return (
        type.includes("appliance") ||
        type.includes("home appliance") ||
        type.includes("kitchen") ||
        type.includes("television") ||
        type.includes("tv")
      );
    });

    const networkingBrands = allBrands.filter((b) => {
      const type = String(b.category || b.product_type || "").toLowerCase();
      return (
        type.includes("network") ||
        type.includes("router") ||
        type.includes("modem") ||
        type.includes("wifi")
      );
    });

    // Add category entries if they have brands
    if (smartphoneBrands.length > 0) {
      categories.push({
        id: "smartphone",
        name: "Smartphones",
        icon: <FaMobileAlt />,
        activeGradient: "from-blue-600 via-purple-500 to-blue-600",
        inactiveColor: "text-gray-400",
        count: smartphoneBrands.length,
        brands: smartphoneBrands,
      });
    }

    if (laptopBrands.length > 0) {
      categories.push({
        id: "laptop",
        name: "Laptops",
        icon: <FaLaptop />,
        activeGradient: "from-blue-600 via-purple-500 to-blue-600",
        inactiveColor: "text-gray-400",
        count: laptopBrands.length,
        brands: laptopBrands,
      });
    }

    if (applianceBrands.length > 0) {
      categories.push({
        id: "appliance",
        name: "TVs",
        icon: <FaTv />,
        activeGradient: "from-blue-600 via-purple-500 to-blue-600",
        inactiveColor: "text-gray-400",
        count: applianceBrands.length,
        brands: applianceBrands,
      });
    }

    if (networkingBrands.length > 0) {
      categories.push({
        id: "networking",
        name: "Networking",
        icon: <FaWifi />,
        activeGradient: "from-blue-600 via-purple-500 to-blue-600",
        inactiveColor: "text-gray-400",
        count: networkingBrands.length,
        brands: networkingBrands,
      });
    }

    return categories;
  }, [allBrands]);

  // Get unique individual brands for horizontal scrolling
  const uniqueBrands = useMemo(() => {
    const seen = new Set();
    const brandsList = [];

    allBrands.forEach((brand) => {
      const brandName = brand.name?.trim();
      if (brandName && !seen.has(brandName.toLowerCase())) {
        seen.add(brandName.toLowerCase());

        // Determine brand category for icon
        const type = String(
          brand.category || brand.product_type || "",
        ).toLowerCase();
        let icon = <FaTag />;
        let gradient = "from-blue-600 via-purple-500 to-blue-600";

        if (type.includes("smartphone") || type.includes("mobile")) {
          icon = <FaMobileAlt />;
          gradient = "from-blue-600 via-purple-500 to-blue-600";
        } else if (type.includes("laptop") || type.includes("computer")) {
          icon = <FaLaptop />;
          gradient = "from-blue-600 via-purple-500 to-blue-600";
        } else if (type.includes("television") || type.includes("tv")) {
          icon = <FaTv />;
          gradient = "from-blue-600 via-purple-500 to-blue-600";
        } else if (type.includes("appliance") || type.includes("home")) {
          icon = <FaPlug />;
          gradient = "from-blue-600 via-purple-500 to-blue-600";
        } else if (
          type.includes("network") ||
          type.includes("router") ||
          type.includes("wifi")
        ) {
          icon = <FaWifi />;
          gradient = "from-blue-600 via-purple-500 to-blue-600";
        }

        brandsList.push({
          id: brand.id || brandName.toLowerCase().replace(/\s+/g, "-"),
          name: brandName,
          logo: brand.logo || brand.image || "",
          slug: brand.slug || brandName.toLowerCase().replace(/\s+/g, "-"),
          category: brand.category || brand.product_type || "",
          originalBrand: brand,
          icon,
          activeGradient: gradient,
          inactiveColor: "text-gray-400",
          productCount:
            brand.product_count || Math.floor(Math.random() * 100) + 10,
        });
      }
    });

    return brandsList.sort((a, b) => a.name.localeCompare(b.name));
  }, [allBrands]);

  const handleBrandClick = (brandId, brandData = null) => {
    setActiveBrand(brandId);

    if (brandData) {
      // Handle individual brand click
      const brandSlug =
        brandData.originalBrand.slug ||
        brandData.name.toLowerCase().replace(/\s+/g, "-");
      const category = (brandData.originalBrand.category || "").toLowerCase();

      if (category.includes("smart") || category.includes("mobile")) {
        navigate(`/smartphones?brand=${encodeURIComponent(brandSlug)}`);
      } else if (
        category.includes("lap") ||
        category.includes("laptop") ||
        category.includes("computer")
      ) {
        navigate(`/laptops?brand=${encodeURIComponent(brandSlug)}`);
      } else if (
        category.includes("appliance") ||
        category.includes("home") ||
        category.includes("television") ||
        category.includes("tv")
      ) {
        navigate(`/tvs?brand=${encodeURIComponent(brandSlug)}`);
      } else if (
        category.includes("network") ||
        category.includes("router") ||
        category.includes("wifi")
      ) {
        navigate(`/networking?brand=${encodeURIComponent(brandSlug)}`);
      } else {
        navigate(`/products?brand=${encodeURIComponent(brandSlug)}`);
      }
    } else {
      // Handle category click
      if (brandId === "all") {
        navigate("/brands");
      } else {
        navigate(`/products?category=${brandId}`);
      }
    }
  };

  const activeBrandData = useMemo(
    () => uniqueBrands.find((b) => b.id === activeBrand) || null,
    [uniqueBrands, activeBrand],
  );

  const sanitizeDescription = (desc = "") => {
    const text = String(desc || "")
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim();
    return text.length > 180 ? `${text.slice(0, 177)}...` : text;
  };

  const metaTitle = activeBrandData
    ? `${activeBrandData.name} Devices | Hook`
    : "Popular Electronics Brands | Hook";

  const metaDescription = sanitizeDescription(
    activeBrandData?.originalBrand?.description ||
      "Explore popular electronics brands on Hook, including smartphones, laptops, TVs, and networking gear with curated recommendations.",
  );

  return (
    <>
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta name="twitter:title" content={metaTitle} />
        <meta name="twitter:description" content={metaDescription} />
      </Helmet>

      <div className="px-2 lg:px-4 mx-auto bg-white max-w-6xl w-full m-5 rounded-lg overflow-hidden pt-8 sm:pt-12">
      {/* Header Section */}
      <div className="mb-2 px-2">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
          Explore by{" "}
          <span className="bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600 bg-clip-text text-transparent">
            Brand
          </span>
        </h2>
        <p className="text-sm text-gray-600">
          Explore Phones by Key Features
        </p>
      </div>

      {/* Category Tabs - Single Row */}

      {/* Individual Brands - Single Row */}
      {uniqueBrands.length > 0 && (
        <>
          <div className="mb-6 px-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-left">
                <h4 className="text-lg font-semibold text-gray-900">
                  All Brands
                </h4>
                <p className="text-gray-600 text-sm">
                  Can't decide?{" "}
                  <span className="font-semibold text-gray-900">
                    Explore all brands
                  </span>
                </p>
                <p className="text-gray-400 text-xs mt-1">
                  Filter by category, features, and more
                </p>
              </div>
              <button
                onClick={() => navigate("/brands")}
                className="text-sm text-purple-600 hover:text-red-800 font-medium flex items-center gap-1"
              >
                View all
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex overflow-x-auto gap-3 lg:gap-4 hide-scrollbar no-scrollbar scroll-smooth pb-6 pt-2">
            {uniqueBrands.map((brand) => {
              const isActive = activeBrand === brand.id;

              return (
                <button
                  key={brand.id}
                  onClick={() => handleBrandClick(brand.id, brand)}
                  className={`flex flex-col items-center p-3 lg:p-4 transition-all duration-300 min-w-[80px] lg:min-w-[90px] shrink-0 group ${
                    isActive
                      ? "text-gray-900 transform -translate-y-1"
                      : "text-gray-600 hover:text-gray-900 hover:transform hover:scale-105"
                  }`}
                >
                  {/* Icon Container */}
                  <div
                    className={`w-10 h-10 lg:w-12 lg:h-12 flex items-center justify-center rounded-xl p-2 transition-all duration-300 mb-2 ${
                      isActive
                        ? `bg-gradient-to-br ${brand.activeGradient} shadow-lg shadow-red-200/50`
                        : "bg-gray-100 group-hover:bg-gray-200 group-hover:shadow-md"
                    }`}
                  >
                    <div className="w-full h-full flex items-center justify-center">
                      <img
                        src={
                          brand.logo ||
                          "https://via.placeholder.com/80?text=Logo"
                        }
                        alt={brand.name || "brand"}
                        loading="lazy"
                        decoding="async"
                        className={`w-full h-full object-contain transition-transform duration-300 ${
                          isActive ? "scale-105" : "scale-100 opacity-80"
                        }`}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src =
                            "https://via.placeholder.com/80?text=No+Logo";
                        }}
                      />
                    </div>
                  </div>

                  {/* Brand Name */}
                  <span
                    className={`font-medium text-xs text-center transition-all duration-300 line-clamp-2 ${
                      isActive
                        ? "text-gray-900 font-semibold"
                        : "text-gray-600 group-hover:text-gray-900"
                    }`}
                  >
                    {brand.name}
                  </span>

                  {/* Product Count (Small) */}

                  {/* Active Indicator Dot */}
                  <div
                    className={`mt-1 w-1 h-1 rounded-full transition-all duration-300 ${
                      isActive
                        ? `bg-gradient-to-r ${brand.activeGradient} opacity-100`
                        : "bg-transparent opacity-0"
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </>
      )}
      </div>
    </>
  );
};

export default PopularBrands;
