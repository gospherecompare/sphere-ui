// src/components/Header.jsx
import React, { useEffect, useRef, useState } from "react";
import {
  FaSearch,
  FaBars,
  FaTimes,
  FaMobileAlt,
  FaTag,
  FaHeart,
  FaBalanceScale,
  FaLaptop,
  FaSignal,
  FaFire,
  FaStar,
  FaGamepad,
  FaBolt,
  FaCamera,
  FaShieldAlt,
  FaArrowLeft,
  FaTv,
  FaWifi,
  FaTabletAlt,
  FaChartLine,
  FaChevronDown,
  FaChevronRight,
  FaHistory,
  FaCaretDown,
  FaPercent,
  FaRocket,
  FaCrown,
  FaBatteryFull,
  FaMemory,
  FaMicrochip,
  FaCameraRetro,
  FaDesktop,
  FaPlug,
  FaServer,
  FaVideo,
  FaVolumeUp,
  FaSitemap,
  FaEthernet,
  FaNetworkWired,
  FaFilter,
  FaChevronLeft,
  FaHome,
} from "react-icons/fa";
import useDevice from "../../hooks/useDevice";
import { useNavigate, useLocation } from "react-router-dom";
import { STORE_LOGOS } from "../../constants/storeLogos";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeMegaMenu, setActiveMegaMenu] = useState(null);
  const [mobileActiveCategory, setMobileActiveCategory] = useState(null);
  const headerRef = React.useRef(null);
  const megaMenuRef = useRef(null);
  const [spacerHeight, setSpacerHeight] = useState(0);
  const {
    smartphone = [],
    selectDeviceByModel,
    setFilters,
    brands = [],
  } = useDevice() || {};
  const navigate = useNavigate();
  const location = useLocation();

  // Reset mobile states when route changes
  useEffect(() => {
    setIsMenuOpen(false);
    setIsSearchOpen(false);
    setMobileActiveCategory(null);
    setActiveMegaMenu(null);
  }, [location.pathname]);

  // Compute popular brands dynamically from `smartphone` data
  const BRAND_COLOR_MAP = {
    Apple: "text-gray-800",
    Samsung: "text-blue-500",
    OnePlus: "text-red-500",
    Xiaomi: "text-orange-500",
    Google: "text-green-500",
    Nothing: "text-gray-700",
  };

  const getBrandColor = (brandName) => {
    if (!brandName) return "text-gray-700";
    const key = String(brandName).trim();
    return BRAND_COLOR_MAP[key] || "text-gray-700";
  };

  // Prefer brands fetched from the store; fall back to inferring from `smartphone` data
  const popularBrandsFromData = (() => {
    try {
      if (Array.isArray(brands) && brands.length > 0) {
        return brands
          .filter((b) => b && b.status)
          .slice(0, 6)
          .map((b) => {
            const name =
              b.name ||
              b.brands ||
              b.category ||
              b.categoryType ||
              (typeof b === "string" ? b : "");
            return { name, color: getBrandColor(name) };
          });
      }

      // fallback: infer from smartphone list
      const list = Array.isArray(smartphone) ? smartphone : [];
      const counts = list.reduce((acc, item) => {
        const b = (item.brand || item.manufacturer || "").trim();
        if (!b) return acc;
        acc[b] = (acc[b] || 0) + 1;
        return acc;
      }, {});

      return Object.entries(counts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 6)
        .map(([name]) => ({ name, color: getBrandColor(name) }));
    } catch {
      return [];
    }
  })();

  // Search state
  const [searchText, setSearchText] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const suggestionsRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close mega menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (megaMenuRef.current && !megaMenuRef.current.contains(event.target)) {
        const isCategoryClick = event.target.closest(".category-item");
        if (!isCategoryClick) {
          setActiveMegaMenu(null);
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update suggestions when searchText changes
  useEffect(() => {
    const q = String(searchText || "")
      .trim()
      .toLowerCase();
    if (!q) {
      setSuggestions([]);
      setShowSuggestions(false);
      setHighlightIndex(-1);
      return;
    }

    const results = (smartphone || [])
      .filter((s) => {
        const name = (s.name || "").toLowerCase();
        const brand = (s.brand || "").toLowerCase();
        const model = (s.model || "").toLowerCase();
        return name.includes(q) || brand.includes(q) || model.includes(q);
      })
      .slice(0, 8);

    setSuggestions(results);
    setShowSuggestions(results.length > 0);
    setHighlightIndex(-1);
  }, [searchText, smartphone]);

  // Click outside to close suggestions and search
  useEffect(() => {
    function onDocClick(e) {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(e.target)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  // Focus search input when search is opened
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Measure header height and update spacer
  useEffect(() => {
    function measure() {
      const h = headerRef.current
        ? headerRef.current.getBoundingClientRect().height
        : 0;
      setSpacerHeight(Math.ceil(h));
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [isSearchOpen, isMenuOpen, activeMegaMenu, mobileActiveCategory]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMenuOpen || mobileActiveCategory) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen, mobileActiveCategory]);

  const selectSuggestion = (device) => {
    if (!device) return;
    setSearchText(device.name || "");
    setShowSuggestions(false);
    setSuggestions([]);
    setHighlightIndex(-1);
    setIsSearchOpen(false);
    try {
      if (selectDeviceByModel && device.model)
        selectDeviceByModel(device.model);
      if (device.model) {
        const url = `/devicedetail/smartphone?identifier=${encodeURIComponent(
          String(device.model)
        )}`;
        navigate(url);
      }
    } catch {
      // ignore
    }
  };

  const onInputKeyDown = (e) => {
    if (!showSuggestions) return;
    const len = suggestions.length;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) => (prev + 1 + len) % len);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) => (prev - 1 + len) % len);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightIndex >= 0 && suggestions[highlightIndex]) {
        selectSuggestion(suggestions[highlightIndex]);
      } else if (suggestions[0]) {
        selectSuggestion(suggestions[0]);
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setIsSearchOpen(false);
    }
  };

  // Navigate to devicelist with query when user presses Enter
  const onSearchEnter = (e) => {
    if (e.key !== "Enter") return;
    const q = String(searchText || "").trim();
    if (!q) return;
    setShowSuggestions(false);
    setIsSearchOpen(false);
    navigate(`/devicelist/smartphones?q=${encodeURIComponent(q)}`);
  };

  const handleSearchToggle = () => {
    setIsSearchOpen(!isSearchOpen);
    setSearchText("");
    setShowSuggestions(false);
    if (!isSearchOpen) {
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 100);
    }
  };

  const handleCloseSearch = () => {
    setIsSearchOpen(false);
    setSearchText("");
    setShowSuggestions(false);
    setSuggestions([]);
  };

  // Format price function
  const formatPrice = (price) => {
    if (!price) return "Price not available";
    if (typeof price === "number") {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(price);
    }
    return price;
  };

  // Suggestion helpers
  const getSuggestionBasePrice = (item) => {
    try {
      if (item == null) return null;
      const variants = Array.isArray(item.variants)
        ? item.variants
        : item.variant
        ? [item.variant]
        : [];

      if (variants.length > 0) {
        const vals = variants
          .map((v) => v?.base_price ?? v?.basePrice ?? v?.base ?? null)
          .map((val) => {
            if (val == null) return null;
            const n = Number(String(val).replace(/[^0-9.-]/g, ""));
            return Number.isFinite(n) && n > 0 ? n : null;
          })
          .filter(Boolean);
        if (vals.length > 0) return Math.min(...vals);
      }

      if (Array.isArray(item.store_prices) && item.store_prices.length > 0) {
        const vals = item.store_prices
          .map((p) => p.price || p.price_inr || null)
          .map((val) => {
            if (val == null) return null;
            const n = Number(String(val).replace(/[^0-9.-]/g, ""));
            return Number.isFinite(n) && n > 0 ? n : null;
          })
          .filter(Boolean);
        if (vals.length > 0) return Math.min(...vals);
      }

      const top = item.price ?? item.base_price ?? null;
      if (top != null) {
        const n = Number(String(top).replace(/[^0-9.-]/g, ""));
        if (Number.isFinite(n) && n > 0) return n;
      }
    } catch {
      // ignore
    }
    return null;
  };

  const getSuggestionRam = (item) => {
    try {
      if (item == null) return null;
      const variants = Array.isArray(item.variants)
        ? item.variants
        : item.variant
        ? [item.variant]
        : [];
      if (variants.length > 0) {
        const v = variants[0];
        const r = v?.ram ?? v?.RAM ?? v?.memory ?? null;
        if (r) return String(r).toUpperCase();
      }
      const pr =
        item.performance && (item.performance.ram || item.performance.RAM);
      if (pr) return String(pr).toUpperCase();
    } catch {
      // ignore
    }
    return null;
  };

  // Mega Menu Categories
  const megaMenuCategories = [
    {
      id: "home",
      name: "Home",
      icon: FaHome,
      color: "text-gray-700",
      bgColor: "bg-gray-50",
      action: () => navigate("/"),
    },
    {
      id: "smartphones",
      name: "Smartphones",
      icon: FaMobileAlt,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      featured: [
        {
          name: "5G Phones",
          icon: FaSignal,
          count: "120+",
          color: "text-blue-500",
        },
        {
          name: "Gaming Phones",
          icon: FaGamepad,
          count: "45+",
          color: "text-green-500",
        },
        {
          name: "Camera Phones",
          icon: FaCameraRetro,
          count: "85+",
          color: "text-purple-500",
        },
        {
          name: "Budget Phones",
          icon: FaShieldAlt,
          count: "200+",
          color: "text-orange-500",
        },
        {
          name: "Flagship Phones",
          icon: FaCrown,
          count: "60+",
          color: "text-yellow-500",
        },
      ],
      brands: popularBrandsFromData,
      priceRanges: [
        {
          range: "Under ₹10,000",
          count: 150,
          color: "bg-green-100 text-green-800",
        },
        {
          range: "₹10,000 - ₹20,000",
          count: 200,
          color: "bg-blue-100 text-blue-800",
        },
        {
          range: "₹20,000 - ₹40,000",
          count: 180,
          color: "bg-purple-100 text-purple-800",
        },
        {
          range: "Above ₹40,000",
          count: 120,
          color: "bg-yellow-100 text-yellow-800",
        },
      ],
    },
    {
      id: "deals",
      name: "Hot Deals",
      icon: FaFire,
      color: "text-red-600",
      bgColor: "bg-red-50",
      // route: when present, use this as the devicelist base route instead of the category id
      route: "smartphones",
      featured: [
        {
          name: "Flash Sales",
          icon: FaBolt,
          count: "Today Only",
          color: "text-yellow-500",
        },
        {
          name: "Clearance Sale",
          icon: FaPercent,
          count: "Up to 70% off",
          color: "text-red-500",
        },
        {
          name: "New Arrivals",
          icon: FaRocket,
          count: "Just Launched",
          color: "text-blue-500",
        },
        {
          name: "Best Sellers",
          icon: FaCrown,
          count: "Top Rated",
          color: "text-purple-500",
        },
        {
          name: "Price Drop Alerts",
          icon: FaChartLine,
          count: "Track Prices",
          color: "text-green-500",
        },
      ],
      deals: [
        { name: "Festive Offers", discount: "Up to 50% off" },
        { name: "Exchange Offers", discount: "Extra ₹5,000 off" },
        { name: "Bank Offers", discount: "10% Cashback" },
        { name: "Bundle Deals", discount: "Save ₹8,000" },
      ],
    },
  ];

  // User actions
  const userActions = [
    {
      name: "Compare",
      icon: FaBalanceScale,
      count: 3,
      color: "text-blue-600",
      action: () => navigate("/compare"),
    },
  ];

  // Quick actions for mobile
  const mobileQuickActions = [
    {
      name: "Home",
      icon: FaHome,
      color: "text-gray-700",
      action: () => navigate("/"),
    },
    {
      name: "Compare",
      icon: FaBalanceScale,
      color: "text-blue-500",
      action: () => navigate("/compare"),
    },
    {
      name: "Categories",
      icon: FaBars,
      color: "text-green-500",
      action: () => setIsMenuOpen(true),
    },
  ];

  // Handle mega menu navigation
  const handleMegaMenuNavigate = (categoryId, filter) => {
    setActiveMegaMenu(null);
    setMobileActiveCategory(null);
    const category = megaMenuCategories.find((c) => c.id === categoryId);
    const base = (category && category.route) || categoryId;
    navigate(`/devicelist/${base}${filter ? `?${filter}` : ""}`);
  };

  // Render Mega Menu Content for Desktop
  const renderMegaMenu = () => {
    if (!activeMegaMenu) return null;

    const category = megaMenuCategories.find((c) => c.id === activeMegaMenu);
    if (!category) return null;

    return (
      <div
        ref={megaMenuRef}
        className="absolute left-0 right-0 top-full bg-white border-t border-gray-200 shadow-2xl z-40"
      >
        <div className="container mx-auto px-6 py-8">
          <div className="grid grid-cols-4 gap-8">
            {/* Featured Section */}
            <div className="col-span-1">
              <div className="flex items-center mb-4">
                <category.icon className={`text-2xl mr-3 ${category.color}`} />
                <h3 className="text-xl font-bold text-gray-900">
                  Featured {category.name}
                </h3>
              </div>
              <div className="space-y-3">
                {category.featured?.slice(0, 5).map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() =>
                      handleMegaMenuNavigate(
                        category.id,
                        `type=${item.name.toLowerCase().replace(/\s+/g, "-")}`
                      )
                    }
                    className="flex items-center justify-between w-full p-3 rounded-lg hover:bg-gray-50 transition-all group"
                  >
                    <div className="flex items-center">
                      <item.icon className={`text-lg mr-3 ${item.color}`} />
                      <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">
                        {item.name}
                      </span>
                    </div>
                    <span className="text-xs font-semibold px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                      {item.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Brands Section */}
            <div className="col-span-1">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                Popular Brands
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {category.brands?.slice(0, 6).map((brand, idx) => (
                  <button
                    key={idx}
                    onClick={() =>
                      handleMegaMenuNavigate(
                        category.id,
                        `brand=${encodeURIComponent(brand.name)}`
                      )
                    }
                    className="flex items-center p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all group"
                  >
                    <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">
                      {brand.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Price Ranges */}
            <div className="col-span-1">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                Price Range
              </h4>
              <div className="space-y-3">
                {category.priceRanges?.map((range, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      const priceRange = range.range
                        .replace(/[^\d,-]/g, "")
                        .split("-");
                      handleMegaMenuNavigate(
                        category.id,
                        `min=${priceRange[0]?.replace(/[^\d]/g, "") || 0}&max=${
                          priceRange[1]?.replace(/[^\d]/g, "") || 999999
                        }`
                      );
                    }}
                    className="flex items-center justify-between w-full p-3 rounded-lg hover:bg-gray-50 transition-all group"
                  >
                    <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">
                      {range.range}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${range.color}`}
                    >
                      {range.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Special Deals or Additional Info */}
            <div className="col-span-1">
              {category.deals ? (
                <>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">
                    Special Offers
                  </h4>
                  <div className="space-y-3">
                    {category.deals.map((deal, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-gradient-to-r from-red-50 to-orange-50 border border-red-100"
                      >
                        <div className="font-semibold text-gray-900">
                          {deal.name}
                        </div>
                        <div className="text-sm text-red-600 font-bold">
                          {deal.discount}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-100">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">
                    Need Help Choosing?
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Our experts can help you find the perfect{" "}
                    {category.name.toLowerCase()} for your needs.
                  </p>
                  <button className="w-full py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all">
                    Get Expert Advice
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Banner */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <FaFilter className="text-blue-500" />
                <span className="text-sm font-medium text-gray-700">
                  Advanced filters available for precise matching
                </span>
              </div>
              <button
                onClick={() => {
                  setActiveMegaMenu(null);
                  const base = category.route || category.id;
                  navigate(`/devicelist/${base}`);
                }}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
              >
                View All {category.name}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render Mobile Category Menu
  const renderMobileCategoryMenu = () => {
    const category = megaMenuCategories.find(
      (c) => c.id === mobileActiveCategory
    );
    if (!category) return null;

    return (
      <div className="lg:hidden absolute inset-0 bg-white z-50 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 flex items-center">
          <button
            onClick={() => setMobileActiveCategory(null)}
            className="p-2 mr-3 hover:bg-gray-100 rounded-lg"
          >
            <FaArrowLeft className="text-gray-600" />
          </button>
          <div className="flex items-center">
            <category.icon className={`text-xl mr-3 ${category.color}`} />
            <h2 className="text-lg font-bold text-gray-900">{category.name}</h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Featured */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Featured
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {category.featured?.slice(0, 4).map((item, idx) => (
                <button
                  key={idx}
                  onClick={() =>
                    handleMegaMenuNavigate(
                      category.id,
                      `type=${item.name.toLowerCase().replace(/\s+/g, "-")}`
                    )
                  }
                  className="p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-all"
                >
                  <div className="flex items-center mb-2">
                    <item.icon className={`text-lg mr-2 ${item.color}`} />
                    <span className="text-xs font-medium text-gray-700">
                      {item.name}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">{item.count}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Brands */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Popular Brands
            </h3>
            <div className="flex flex-wrap gap-2">
              {category.brands?.slice(0, 6).map((brand, idx) => (
                <button
                  key={idx}
                  onClick={() =>
                    handleMegaMenuNavigate(
                      category.id,
                      `brand=${encodeURIComponent(brand.name)}`
                    )
                  }
                  className="px-3 py-2 bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-700 rounded-full text-xs transition-colors"
                >
                  {brand.name}
                </button>
              ))}
            </div>
          </div>

          {/* View All Button */}
          <button
            onClick={() => {
              setMobileActiveCategory(null);
              const base = category.route || category.id;
              navigate(`/devicelist/${base}`);
            }}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg mt-4"
          >
            View All {category.name}
          </button>
        </div>
      </div>
    );
  };

  // Main mobile header component
  const MobileHeader = () => (
    <div className="lg:hidden">
      {!mobileActiveCategory ? (
        <div className="container mx-auto px-4 py-3">
          {/* Top row with menu, logo, and search */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="w-10 h-10 flex items-center justify-center p-2 hover:bg-blue-50 rounded-lg transition-all duration-200 group"
              aria-label="Toggle menu"
            >
              <FaBars className="w-5 h-5 text-gray-700 group-hover:text-blue-600" />
            </button>

            <a href="/" className="text-xl font-bold flex-1 text-center">
              <img
                src={STORE_LOGOS.smartarena}
                alt="SmartArena logo"
                className="h-8 inline-block object-contain mx-auto"
                loading="lazy"
              />
              <span className="bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent font-orbitron text-sm tracking-widest uppercase">
                Smart Arena
              </span>
            </a>

            <button
              onClick={handleSearchToggle}
              className="w-10 h-10 flex items-center justify-center p-2 hover:bg-blue-50 rounded-lg transition-all duration-200 group"
              aria-label="Toggle search"
            >
              <FaSearch className="w-4 h-4 text-gray-700 group-hover:text-blue-600" />
            </button>
          </div>

          {/* Quick Actions */}
          <div className="flex justify-around items-center mt-3 pt-3 border-t border-gray-100">
            {mobileQuickActions.map((action, idx) => (
              <button
                key={idx}
                onClick={action.action}
                className="flex flex-col items-center p-2 hover:bg-gray-50 rounded-lg transition-all"
              >
                <action.icon className={`text-lg mb-1 ${action.color}`} />
                <span className="text-xs text-gray-600">{action.name}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );

  // Search overlay for mobile
  const MobileSearchOverlay = () => (
    <div
      className={`lg:hidden fixed inset-0 bg-white z-50 ${
        isSearchOpen ? "block" : "hidden"
      }`}
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center w-full space-x-3">
          <button
            onClick={handleCloseSearch}
            className="w-10 h-10 flex items-center justify-center p-2 hover:bg-gray-100 rounded-lg transition-all duration-200"
            aria-label="Close search"
          >
            <FaChevronLeft className="w-5 h-5 text-gray-600" />
          </button>

          <div className="flex-1 relative">
            <input
              ref={searchInputRef}
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => {
                onInputKeyDown(e);
                onSearchEnter(e);
              }}
              placeholder="Search smartphones, brands, models..."
              className="w-full h-10 rounded-full pl-4 pr-10 border-2 border-blue-500 bg-white text-sm focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all duration-200"
              aria-autocomplete="list"
              aria-expanded={showSuggestions}
            />

            {showSuggestions && (
              <div
                ref={suggestionsRef}
                className="absolute left-0 right-0 mt-2 bg-white shadow-2xl rounded-xl border border-gray-200 z-50 overflow-hidden"
              >
                <div className="p-3 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-gray-50">
                  <h3 className="text-sm font-semibold text-gray-700 flex items-center">
                    <FaMobileAlt className="mr-2 text-blue-500" />
                    Search Results ({suggestions.length})
                  </h3>
                </div>
                <ul className="max-h-64 overflow-auto">
                  {suggestions.map((s, idx) => (
                    <li
                      key={s.model || s.name || idx}
                      onMouseEnter={() => setHighlightIndex(idx)}
                      onClick={() => selectSuggestion(s)}
                      className={`px-4 py-3 cursor-pointer transition-all duration-150 border-l-2 ${
                        highlightIndex === idx
                          ? "bg-blue-50 border-blue-500"
                          : "border-transparent hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-100 to-purple-100 rounded flex items-center justify-center mt-1 shadow-sm">
                          <FaMobileAlt className="text-blue-600 text-xs" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-gray-900 truncate">
                            {s.name}
                          </h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs text-blue-600 font-medium">
                              {s.brand}
                            </span>
                            <span className="text-xs text-gray-500 flex items-center">
                              <FaTag className="mr-1 text-xs" />
                              {s.model}
                            </span>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <header
        ref={headerRef}
        className="fixed top-0 left-0 z-50 w-full bg-white border-b border-gray-100"
      >
        {/* Mobile Header */}
        <MobileHeader />

        {/* Mobile Search Overlay */}
        <MobileSearchOverlay />

        {/* Desktop Navigation */}
        <div className="hidden lg:block">
          {/* Top Bar with Logo, Search, and User Actions */}
          <div className="shadow-sm bg-white">
            <div className="container mx-auto px-6 py-3">
              <div className="flex items-center justify-between">
                {/* Logo */}
                <a
                  href="/"
                  className="text-2xl font-bold text-gray-900 flex items-center hover:scale-105 transition-transform duration-200"
                >
                  <img
                    src={STORE_LOGOS.smartarena}
                    alt="SmartArena logo"
                    className="h-10 w-auto object-contain mr-3"
                    loading="lazy"
                  />
                  <span className="bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent font-orbitron text-xl tracking-widest uppercase">
                    Smart Arena
                  </span>
                </a>

                {/* Search Bar */}
                <div className="flex-1 max-w-md mx-8 relative">
                  <div className="flex w-full h-12 overflow-hidden rounded-full border-2 border-gray-200 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100 transition-all duration-300">
                    <div className="flex items-center pl-4 pr-2 bg-gray-50 border-r border-gray-200">
                      <FaSearch className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      onKeyDown={onInputKeyDown}
                      placeholder="Search devices, brands, specs..."
                      className="flex-1 border-none px-4 bg-white text-sm placeholder-gray-400 font-medium focus:outline-none"
                      aria-autocomplete="list"
                      aria-expanded={showSuggestions}
                      ref={searchInputRef}
                    />
                  </div>

                  {/* Search Suggestions */}
                  {showSuggestions && (
                    <div
                      ref={suggestionsRef}
                      className="absolute left-0 right-0 mt-2 bg-white shadow-2xl rounded-xl border border-gray-200 z-50 overflow-hidden"
                    >
                      <div className="p-3 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-gray-50">
                        <h3 className="text-sm font-semibold text-gray-700 flex items-center">
                          <FaSearch className="mr-2 text-blue-500" />
                          Search Results ({suggestions.length})
                        </h3>
                      </div>
                      <ul className="max-h-80 overflow-auto">
                        {suggestions.map((s, idx) => (
                          <li
                            key={s.model || s.name || idx}
                            onMouseEnter={() => setHighlightIndex(idx)}
                            onClick={() => selectSuggestion(s)}
                            className={`px-4 py-3 cursor-pointer transition-all duration-200 border-l-2 ${
                              highlightIndex === idx
                                ? "bg-blue-50 border-blue-500 shadow-sm"
                                : "border-transparent hover:bg-gray-50"
                            }`}
                          >
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center mt-1 shadow-sm">
                                <FaMobileAlt className="text-blue-600 text-sm" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <h4 className="text-sm font-semibold text-gray-900 truncate">
                                      {s.name}
                                    </h4>
                                    <div className="flex items-center space-x-2 mt-1">
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                        {s.brand}
                                      </span>
                                      <span className="text-xs text-gray-500 flex items-center">
                                        <FaTag className="mr-1 text-xs" />
                                        {s.model}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-right ml-2">
                                    <div className="text-sm font-bold text-gray-900">
                                      {(() => {
                                        const p = getSuggestionBasePrice(s);
                                        return p
                                          ? formatPrice(p)
                                          : formatPrice(s.price);
                                      })()}
                                    </div>
                                    {(() => {
                                      const r = getSuggestionRam(s);
                                      return r ? (
                                        <div className="text-xs text-gray-500 mt-1">
                                          {r}
                                        </div>
                                      ) : null;
                                    })()}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                      <div className="p-3 bg-gray-50 border-t border-gray-200">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center">
                            <kbd className="px-2 py-1 mx-1 bg-white border border-gray-300 rounded shadow-sm">
                              ↑↓
                            </kbd>
                            Navigate
                          </div>
                          <div className="flex items-center">
                            <kbd className="px-2 py-1 mx-1 bg-white border border-gray-300 rounded shadow-sm">
                              Enter
                            </kbd>
                            Select
                          </div>
                          <div className="flex items-center">
                            <kbd className="px-2 py-1 mx-1 bg-white border border-gray-300 rounded shadow-sm">
                              ESC
                            </kbd>
                            Close
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* User Actions */}
                <div className="flex items-center space-x-3">
                  {userActions.map((action, idx) => (
                    <button
                      key={idx}
                      onClick={action.action}
                      className="relative p-2 hover:bg-gray-100 rounded-lg transition-all group flex flex-col items-center"
                      title={action.name}
                    >
                      <action.icon
                        className={`w-5 h-5 ${action.color} group-hover:scale-110 transition-transform`}
                      />
                      {action.count && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                          {action.count}
                        </span>
                      )}
                      <span className="text-xs text-gray-600 mt-1">
                        {action.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Category Bar with Mega Menu */}
          <div className="relative border-t border-gray-50 shadow-sm bg-white ">
            <div className="container mx-auto px-6">
              <div className="flex items-center">
                {/* Category Navigation */}
                <div className="flex items-center space-x-1">
                  {megaMenuCategories.map((category) => (
                    <div key={category.id} className="relative category-item">
                      <button
                        onClick={() => {
                          if (typeof category.action === "function") {
                            category.action();
                            setActiveMegaMenu(null);
                          } else {
                            setActiveMegaMenu((prev) =>
                              prev === category.id ? null : category.id
                            );
                          }
                        }}
                        className={`flex items-center px-5 py-3 text-sm font-medium transition-all ${
                          activeMegaMenu === category.id
                            ? `${category.color}`
                            : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                        }`}
                      >
                        <category.icon className={`mr-2 ${category.color}`} />
                        {category.name}
                      </button>

                      {/* Active indicator */}
                      {!category.action && activeMegaMenu === category.id && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Quick Links */}
                <div className="ml-auto flex items-center space-x-4">
                  <button
                    onClick={() => navigate("/devicelist/smartphones")}
                    className="flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 px-3 py-2 hover:bg-blue-50 rounded-lg"
                  >
                    <FaFire className="mr-2 text-orange-500" />
                    Today's Deals
                  </button>
                  <button
                    onClick={() => navigate("/compare")}
                    className="flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 px-3 py-2 hover:bg-blue-50 rounded-lg"
                  >
                    <FaBalanceScale className="mr-2 text-blue-500" />
                    Compare
                  </button>
                </div>
              </div>
            </div>

            {/* Mega Menu Dropdown */}
            {renderMegaMenu()}
          </div>
        </div>
      </header>

      {/* Enhanced Mobile Menu Drawer */}
      {isMenuOpen && !mobileActiveCategory && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-40 z-40 backdrop-blur-sm lg:hidden"
            onClick={() => setIsMenuOpen(false)}
            aria-hidden
          />

          {/* Enhanced Drawer */}
          <aside className="fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-2xl overflow-y-auto transform transition-transform duration-300 ease-in-out lg:hidden">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="px-6 py-6 border-b border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <a
                    href="/"
                    className="flex items-center hover:scale-105 transition-transform duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <img
                      src={STORE_LOGOS.smartarena}
                      alt="SmartArena logo"
                      className="h-10 w-auto object-contain mr-3"
                      loading="lazy"
                    />
                    <span className="bg-gradient-to-r from-purple-600 font-semibold font-sm  to-blue-500 bg-clip-text text-transparent font-orbitron text-xl tracking-widest uppercase">
                      Smart Arena
                    </span>
                  </a>
                  <button
                    onClick={() => setIsMenuOpen(false)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-all duration-200 group"
                    aria-label="Close menu"
                  >
                    <FaTimes className="w-5 h-5 text-gray-600 group-hover:text-red-600" />
                  </button>
                </div>
              </div>

              {/* Main Categories Section */}
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                  <FaBars className="mr-2 text-blue-500" />
                  All Categories
                </h3>
                <div className="space-y-2">
                  {megaMenuCategories.map((category, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setIsMenuOpen(false);
                        setMobileActiveCategory(category.id);
                      }}
                      className="flex items-center justify-between w-full p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all duration-200 group"
                    >
                      <div className="flex items-center">
                        <category.icon
                          className={`text-lg mr-3 ${category.color} group-hover:scale-110 transition-transform`}
                        />
                        <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">
                          {category.name}
                        </span>
                      </div>
                      <FaChevronRight className="text-gray-400 group-hover:text-blue-500" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                  <FaBolt className="mr-2 text-yellow-500" />
                  Quick Actions
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {userActions.map((action, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        action.action();
                        setIsMenuOpen(false);
                      }}
                      className="flex flex-col items-center p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition-all"
                    >
                      <action.icon className={`text-xl mb-2 ${action.color}`} />
                      <span className="text-xs font-medium text-gray-700">
                        {action.name}
                      </span>
                      {action.count && (
                        <span className="text-xs text-gray-500 mt-1">
                          {action.count} items
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Top Deals Section */}
              <div className="px-6 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700 flex items-center">
                    <FaFire className="mr-2 text-orange-500" />
                    Hot Deals
                  </h3>
                </div>

                <div className="space-y-2">
                  {[
                    "Best smartphone Under ₹10,000",
                    "5G smartphone Under ₹20,000",
                    "Gaming Laptops Under ₹60,000",
                    "Smart TV Under ₹30,000",
                  ].map((deal, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setIsMenuOpen(false);
                        navigate(`/devicelist/smartphones`);
                      }}
                      className="w-full p-3 text-left rounded-lg border border-gray-100 hover:border-blue-200 hover:shadow-sm transition-all duration-200 group bg-gradient-to-r from-gray-50 to-white"
                    >
                      <div className="flex items-center">
                        <FaFire className="mr-3 text-orange-500 group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-medium text-gray-800 leading-tight">
                          {deal}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 mt-auto border-t border-gray-100 bg-gray-50">
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-2">
                    Find your perfect device
                  </p>
                  <div className="flex justify-center space-x-3">
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        navigate("/devicelist/smartphones");
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-semibold rounded-full hover:shadow-lg transition-all duration-200"
                    >
                      Browse All
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </>
      )}

      {/* Mobile Category Menu */}
      {mobileActiveCategory && renderMobileCategoryMenu()}

      {/* spacer to prevent content jump when header is fixed */}
      <div style={{ height: `${spacerHeight}px` }} />
    </>
  );
};

export default Header;
