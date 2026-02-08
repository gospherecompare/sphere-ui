// src/components/Header/Header.jsx
/**
 * SmartArena Header Component
 *
 * RESPONSIVE DESIGN:
 * ─────────────────
 * MOBILE (≤ 768px):
 *   - Top Row: Hamburger Menu | SmartArena Logo | Search + Compare Icons
 *   - No inline search input (uses full-screen modal)
 *   - Hamburger opens vertical drawer/sidebar
 *   - Compare icon navigates to /compare page
 *   - Clean, minimal Flipkart-style UX
 *
 * DESKTOP (> 768px):
 *   - Full-width horizontal layout
 *   - Logo | Inline Search Bar | Spacer | Utility Icons + Auth
 *   - Full mega menu support for categories (CategoryNavBar)
 *   - All wishlist, auth, and other features visible
 *
 * ARCHITECTURE:
 * ─────────────
 * - MainHeader: Conditional rendering based on breakpoint (md:)
 *   └─ Mobile section: md:hidden (visible on mobile only)
 *   └─ Desktop section: hidden md:block (visible on desktop+)
 * - SearchModal: Full-screen overlay search with discover section
 * - MobileMenuDrawer: Vertical sidebar for categories (hamburger)
 * - QuickNavTabs: Optional mobile navigation tabs below header
 * - CategoryNavBar: Desktop mega menus (hidden on mobile)
 *
 * WHY PREVIOUS INPUT RENDERING BROKE:
 * ────────────────────────────────────
 * Earlier implementation had overlapping z-index layers and mixed
 * responsive utilities (lg:hidden, sm:flex, etc.) causing:
 * 1. Input visibility issues on small screens (hidden by header)
 * 2. Keyboard overlap on mobile without proper viewport handling
 * 3. Confusing layout logic with multiple conditional renders
 *
 * CURRENT FIX:
 * ───────────
 * - Clear mobile/desktop separation using md: breakpoint
 * - Mobile: Uses 100dvh SearchModal (full viewport height)
 * - No inline input on mobile (cleaner UI, no overflow)
 * - Desktop: Inline search with proper spacing and suggestions
 * - Single logo component (updated to "SmartArena")
 */
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import Cookies from "js-cookie";
import { useDevice } from "../../hooks/useDevice";
import { Scale } from "lucide-react";
import { createProductPath, generateSlug } from "../../utils/slugGenerator";
import HookLogo from "../ui/HookLogo";

// Icons - matching Vijay Sales style
import {
  FaSearch,
  FaBars,
  FaArrowLeft,
  FaHeart,
  FaUser,
  FaShoppingCart,
  FaChevronRight,
  FaChevronDown,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaTag,
  FaBolt,
  FaGift,
  FaStar,
  FaMobileAlt,
  FaApple,
  FaTv,
  FaLaptop,
  FaPlug,
  FaSnowflake,
  FaCamera,
  FaGamepad,
  FaHeadphones,
  FaVolumeUp,
  FaBluetooth,
  FaGlasses,
  FaTabletAlt,
  FaCarBattery,
  FaChair,
  FaShieldAlt,
  FaSignInAlt,
  FaUserPlus,
  FaStore,
  FaHome,
  FaCreditCard,
  FaShippingFast,
  FaTruck,
  FaPercentage,
  FaCalendarAlt,
  FaWeight,
  FaWeightHanging,
  FaHandsHelping,
  FaAlignJustify,
  FaStream,
  FaTimes,
} from "react-icons/fa";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [pinnedCategory, setPinnedCategory] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showAuthDropdown, setShowAuthDropdown] = useState(false);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const megaMenuRef = useRef(null);
  const authDropdownRef = useRef(null);
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);
  const inputWasFocusedRef = useRef(false);
  const suppressRestoreRef = useRef(false);
  const deviceCtx = useDevice();
  const brands = (deviceCtx && deviceCtx.brands) || [];

  const readAuthFromCookies = () => {
    const token = Cookies.get("arenak");

    if (token) {
      try {
        const userData = JSON.parse(Cookies.get("user_data") || "{}");
        const fullName =
          `${userData.f_name || ""} ${userData.l_name || ""}`.trim() ||
          userData.username ||
          "User";
        const email = userData.email || "user@example.com";

        setIsLoggedIn(true);
        setUserName(fullName);
        setUserEmail(email);
      } catch (err) {
        console.error("Error parsing user data:", err);
        setIsLoggedIn(false);
        setUserName("");
        setUserEmail("");
      }
    } else {
      setIsLoggedIn(false);
      setUserName("");
      setUserEmail("");
    }
  };

  // Check if user is logged in and get user data from cookies
  useEffect(() => {
    readAuthFromCookies();
  }, []);

  // Re-read auth after navigation (e.g., after login redirect)
  useEffect(() => {
    readAuthFromCookies();
  }, [location.pathname]);

  // Check scroll for header effects
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mega menu on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (megaMenuRef.current) {
        const clickedInsideMega =
          megaMenuRef.current.contains(event.target) ||
          Boolean(event.target.closest(".advanced-mega-menu"));
        if (!clickedInsideMega) {
          const isCategoryButton = event.target.closest(".category-button");
          if (!isCategoryButton) {
            setActiveCategory(null);
            setPinnedCategory(null);
          }
        }
      }

      if (
        authDropdownRef.current &&
        !authDropdownRef.current.contains(event.target)
      ) {
        const isAuthButton = event.target.closest(".auth-button");
        if (!isAuthButton) {
          setShowAuthDropdown(false);
        }
      }

      // Close search suggestions on outside click
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchSuggestions(false);
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-focus search input when opened
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isSearchOpen]);

  // Lock body scroll when search modal is open
  useEffect(() => {
    if (isSearchOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isSearchOpen]);

  // Debounce / abort helpers for live suggestions
  const debounceRef = useRef(null);
  const abortRef = useRef(null);

  const mapProductTypeToRoute = (ptype) => {
    if (!ptype) return "smartphones"; // default
    const t = String(ptype).toLowerCase().trim();
    if (t.includes("phone") || t.includes("smart") || t === "smartphone")
      return "smartphones";
    if (t.includes("laptop") || t === "laptop") return "laptops";
    if (t.includes("appliance") || t.includes("home") || t === "appliance")
      return "appliances";
    if (t.includes("network") || t === "networking") return "networking";
    // Default to smartphones if can't determine
    return "smartphones";
  };

  // Fetch suggestions from server (debounced)
  const handleSearchInputChange = (value) => {
    // remember whether input was focused before updating state
    try {
      inputWasFocusedRef.current = !!(
        searchInputRef.current &&
        document.activeElement === searchInputRef.current
      );
    } catch (e) {
      inputWasFocusedRef.current = false;
    }
    setSearchQuery(value);
    setSelectedSuggestionIndex(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortRef.current) {
      try {
        abortRef.current.abort();
      } catch {}
    }

    if (!value || !value.trim()) {
      setIsSearching(false);
      setSearchSuggestions([]);
      setShowSearchSuggestions(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const q = value.trim();
      const controller = new AbortController();
      abortRef.current = controller;
      setIsSearching(true);
      setShowSearchSuggestions(true);
      try {
        const url = `https://api.apisphere.in/api/search?q=${encodeURIComponent(
          q,
        )}`;
        const r = await fetch(url, {
          signal: controller.signal,
        });
        if (!r.ok) throw new Error(`Search failed: ${r.status}`);
        const json = await r.json();
        const results = (json.results || []).map((it) => ({
          ...it,
        }));
        setSearchSuggestions(results);
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error("Search suggestions error:", err);
        setSearchSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 220);
  };

  const handleSuggestionClick = (item) => {
    if (!item) return;
    // prevent focus restoration while we're intentionally navigating
    suppressRestoreRef.current = true;

    // Navigate FIRST before closing anything
    if (item.type === "product") {
      // Prefer navigating using the product `model` (or name fallback)
      const category = mapProductTypeToRoute(item.product_type);
      const productKey = item.model || item.name || "";
      const path = createProductPath(category, productKey);
      console.log("Product suggestion clicked:", {
        item,
        product_type: item.product_type,
        category,
        path,
      });
      // Navigate to canonical slug path. Keep `id` as optional query param for
      // servers that prefer numeric lookup, but rely on model-based routing.
      const finalPath = item.id
        ? `${path}?id=${encodeURIComponent(item.id)}`
        : path;
      navigate(finalPath);
    } else if (item.type === "brand") {
      // Navigate to brand search / results
      navigate(`/search?brand=${encodeURIComponent(item.name)}`);
    } else {
      // Fallback: perform a general search
      navigate(`/search?q=${encodeURIComponent(item.name || item)}`);
    }
    // Cleanup state AFTER navigation is triggered (do not blur input before navigation)
    // Use microtask to let navigation begin; suppression flag prevents accidental restore
    Promise.resolve().then(() => {
      setShowSearchSuggestions(false);
      setIsSearchOpen(false);
      setSearchQuery("");
      suppressRestoreRef.current = false;
    });
  };

  const handleSearchKeyDown = (e) => {
    if (!showSearchSuggestions || !searchSuggestions.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedSuggestionIndex((i) =>
        Math.min(i + 1, searchSuggestions.length - 1),
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedSuggestionIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      if (selectedSuggestionIndex >= 0) {
        e.preventDefault();
        handleSuggestionClick(searchSuggestions[selectedSuggestionIndex]);
      }
    } else if (e.key === "Escape") {
      setShowSearchSuggestions(false);
    }
  };

  // Restore focus synchronously after controlled updates when the input was
  // focused before the update. This avoids losing focus on desktop when
  // suggestions appear. We use useLayoutEffect to run before the browser paints.
  React.useLayoutEffect(() => {
    if (
      inputWasFocusedRef.current &&
      searchInputRef.current &&
      document.activeElement !== searchInputRef.current &&
      !suppressRestoreRef.current
    ) {
      try {
        searchInputRef.current.focus({ preventScroll: true });
        const len = searchInputRef.current.value?.length || 0;
        if (typeof searchInputRef.current.setSelectionRange === "function") {
          searchInputRef.current.setSelectionRange(len, len);
        }
      } catch (e) {
        // defensive - don't crash if focus fails
      }
    }
  }, [searchQuery, showSearchSuggestions, searchSuggestions]);

  // Top announcement bar data (like Vijay Sales)
  const announcements = [
    {
      text: "Diwali Dhamaka! Upto 60% OFF + Extra ₹5000 Instant Discount",
      icon: <FaGift />,
    },

    {
      text: "EMI Starting from ₹0 Interest | No Cost EMI Available",
      icon: <FaCreditCard />,
    },
    {
      text: "Same Day Delivery in 3 Hours* | Free Shipping",
      icon: <FaTruck />,
    },
  ];

  const categories = [
    {
      id: "smartphones",
      name: "Smartphones",
      icon: <FaMobileAlt />,
      // Column 1 – Browse
      subcategories: [
        { name: "All Smartphones" },
        { name: "New Launches" },
        { name: "Trending Phones" },
        { name: "Compare Phones" },
      ],
      // Column 2 – By Price (mapped into popularProducts column)
      popularProducts: [
        { name: "Under ₹10,000" },
        { name: "Under ₹20,000" },
        { name: "Under ₹30,000" },
        { name: "Under ₹50,000" },
        { name: "Flagship Phones" },
      ],
      // Column 3 – By Features (mapped into featured column)
      featured: [
        { name: "5G Phones", discount: "", icon: <FaBolt /> },
        { name: "Gaming Phones", discount: "", icon: <FaGamepad /> },
        { name: "Camera Phones", discount: "", icon: <FaCamera /> },
        { name: "Long Battery Phones", discount: "", icon: <FaCarBattery /> },
      ],
      // Column 4 – By Brand
    },
    {
      id: "laptops",
      name: "Laptops",
      icon: <FaLaptop />,
      // Column 1 – Browse
      subcategories: [
        { name: "All Laptops" },
        { name: "New Launches" },
        { name: "Trending Laptops" },
        { name: "Compare Laptops" },
      ],
      // Column 2 – By Use Case (mapped into popularProducts column)
      popularProducts: [
        { name: "Gaming Laptops", price: "", discount: "" },
        { name: "Student Laptops", price: "", discount: "" },
        { name: "Business Laptops", price: "", discount: "" },
        { name: "Creator Laptops", price: "", discount: "" },
      ],
      // Column 3 – By Price (mapped into featured column)
      featured: [
        { name: "Under ₹40,000", discount: "", icon: <FaTag /> },
        { name: "Under ₹60,000", discount: "", icon: <FaTag /> },
        { name: "Under ₹80,000", discount: "", icon: <FaTag /> },
        { name: "Premium Laptops", discount: "", icon: <FaStar /> },
      ],
      // Column 4 – By Brand
    },
    {
      id: "Home Appliances",
      name: "Home Appliances",
      icon: <FaSnowflake />,
      // Column 1 – Categories
      subcategories: [
        { name: "Refrigerators" },
        { name: "Washing Machines" },
        { name: "Air Conditioners" },
        { name: "Televisions" },
      ],
      // Column 2 – By Type (mapped into popularProducts column)
      popularProducts: [
        { name: "Front Load", price: "", discount: "" },
        { name: "Top Load", price: "", discount: "" },
        { name: "Inverter AC", price: "", discount: "" },
        { name: "Smart TV", price: "", discount: "" },
      ],
      // Column 3 – Energy & Size (mapped into featured column)
      featured: [
        { name: "5 Star Rated", discount: "", icon: <FaStar /> },
        { name: "Large Capacity", discount: "", icon: <FaWeightHanging /> },
        { name: "Compact Appliances", discount: "", icon: <FaHome /> },
      ],
      // Column 4 – Popular Brands
    },
    {
      id: "networking",
      name: "Networking",
      icon: <FaPlug />,
      // Column 1 – Devices
      subcategories: [
        { name: "Wi-Fi Routers" },
        { name: "Mesh Systems" },
        { name: "Modems" },
        { name: "Range Extenders" },
      ],
      // Column 2 – By Usage (mapped into popularProducts column)
      popularProducts: [
        { name: "Home Networking", price: "", discount: "" },
        { name: "Gaming Routers", price: "", discount: "" },
        { name: "Office Routers", price: "", discount: "" },
      ],
      // Column 3 – Technology (mapped into featured column)
      featured: [
        { name: "Wi-Fi 6", discount: "", icon: <FaBluetooth /> },
        { name: "Wi-Fi 6E", discount: "", icon: <FaBluetooth /> },
        { name: "Dual Band", discount: "", icon: <FaBolt /> },
        { name: "Tri-Band", discount: "", icon: <FaBolt /> },
      ],
      // Column 4 – Brands
    },
  ];

  // Merge dynamic brands from store into category `topBrands` (fallback to static)
  const categoriesWithBrands = (categories || []).map((cat) => {
    try {
      const matched = (brands || []).filter((b) => {
        const catField = String(
          b.category || b.product_type || b.type || "",
        ).toLowerCase();
        const nameField = String(b.name || "").toLowerCase();
        return (
          catField.includes(String(cat.id).toLowerCase()) ||
          nameField.includes(String(cat.name || "").toLowerCase())
        );
      });

      const topBrands =
        matched && matched.length > 0
          ? matched.slice(0, 6)
          : Array.isArray(cat.topBrands)
            ? cat.topBrands.map((n, i) => ({ id: `fallback-${i}`, name: n }))
            : [];
      return { ...cat, topBrands };
    } catch (e) {
      return cat;
    }
  });

  // Top navigation links
  const directLinks = [
    { name: "Trending", link: "/trending" },
    { name: "New Launches", link: "/smartphones?filter=new" },
    { name: "Compare", link: "/compare" },
  ];

  // Utility items with counts
  const utilityItems = [
    { name: "Wishlist", icon: <FaHeart />, count: 1, link: "/wishlist" },
  ];

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
    }
  };

  // Handle auth
  const handleLogin = () => {
    setIsLoggedIn(true);
    setShowAuthDropdown(false);
    navigate("/login");
  };

  const handleLogout = () => {
    // Clear all authentication cookies
    Cookies.remove("arenak");
    Cookies.remove("user_data");
    Cookies.remove("remembered_email");

    // Clear any legacy individual user cookies if they exist
    Cookies.remove("userEmail");
    Cookies.remove("username");
    Cookies.remove("userId");
    Cookies.remove("userName");
    Cookies.remove("authToken");
    Cookies.remove("user");

    setIsLoggedIn(false);
    setUserName("");
    setUserEmail("");
    setShowAuthDropdown(false);
    navigate("/");
  };

  // Announcement Bar Component
  const AnnouncementBar = () => (
    <div className="bg-gradient-to-r from-purple-600 via-purple-400 to-red-600 text-white py-2 overflow-hidden">
      <div className="container max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 overflow-hidden">
            <div className="animate-marquee whitespace-nowrap flex items-center space-x-8">
              {announcements.map((announcement, index) => (
                <div key={index} className="inline-flex items-center space-x-3">
                  <span>{announcement.icon}</span>
                  <span className="text-sm font-medium">
                    {announcement.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <button className="ml-4 px-3 py-1 bg-white text-purple-600 text-sm font-bold rounded-full hover:bg-purple-50 transition">
            SHOP NOW
          </button>
        </div>
      </div>
      <style>{`
        @keyframes marquee {
          0% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}</style>
    </div>
  );

  // Top Navigation Bar

  // Advanced Category Mega Menu Component
  const AdvancedMegaMenu = ({ category }) => (
    <div className="absolute top-full left-0 w-[900px] bg-white text-gray-800 z-50 advanced-mega-menu rounded-b-lg shadow-2xl border border-gray-200 border-t-0 animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="p-8">
        <div className="grid grid-cols-4 gap-8">
          {/* Column 1: Subcategories */}
          <div>
            <h4 className="font-bold text-base mb-5 text-gray-900 border-b-2 border-red-600 pb-3">
              Browse
            </h4>
            <div className="space-y-2">
              {category.subcategories.map((sub, idx) => {
                const name = String(sub.name || "").toLowerCase();
                let href = `/${category.id}`;
                if (name.includes("new")) href = `/${category.id}?filter=new`;
                else if (name.includes("trending"))
                  href = `/${category.id}?filter=trending`;
                else if (name.includes("compare"))
                  href = `/compare?type=${category.id}`;

                return (
                  <Link
                    key={idx}
                    to={href}
                    onClick={() => setPinnedCategory(null)}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-purple-50 group transition-all duration-150 hover:pl-4"
                  >
                    <div className="flex items-center">
                      <div>
                        <div className="font-medium group-hover:text-purple-700 text-sm">
                          {sub.name}
                        </div>
                        <div className="text-xs text-gray-500">{sub.count}</div>
                      </div>
                    </div>
                    <FaChevronRight className="w-3 h-3 text-gray-400 group-hover:text-red-600 group-hover:translate-x-1 transition-all duration-150" />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Column 2: Popular Products */}
          <div>
            <h4 className="font-bold text-base mb-5 text-gray-900 border-b-2 border-purple-600 pb-3">
              By Price
            </h4>
            <div className="space-y-3">
              {category.popularProducts.map((product, idx) => (
                <div
                  key={idx}
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-purple-50 group transition-all duration-150"
                >
                  <div className="flex-1">
                    <div className="font-medium text-sm group-hover:text-purple-700 transition-colors">
                      {product.name}
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="font-bold text-gray-800 text-sm">
                        {product.price}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 3: Featured Offers */}
          <div>
            <h4 className="font-bold text-base mb-5 text-gray-900 border-b-2 border-red-600 pb-3">
              By Features
            </h4>
            <div className="space-y-3">
              {category.featured.map((offer, idx) => (
                <div
                  key={idx}
                  className="block p-4 rounded-lg border border-red-200 hover:border-red-400 bg-gradient-to-br from-purple-600 to-red-600 group transition-all duration-200 hover:shadow-md"
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-red-600 group-hover:text-red-700 text-lg">
                      {offer.icon}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 group-hover:text-red-800 text-sm">
                        {offer.name}
                      </div>
                      <div className="text-sm text-red-600 font-medium">
                        {offer.discount}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Limited time offer
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 4: Top Brands */}
          <div>
            <h4 className="font-bold text-base mb-5 text-gray-900 border-b-2 border-red-600 pb-3">
              By Brand
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {(category.topBrands || []).slice(0, 6).map((b, idx) => {
                // `b` may be a brand object from the store or a fallback object {id, name}
                const name = b && (b.name || b);
                const id = b && (b.id || b.name || `brand-${idx}`);
                const slug =
                  (b &&
                    (b.slug ||
                      (b.name && b.name.toLowerCase().replace(/\s+/g, "-")))) ||
                  String(name || "")
                    .toLowerCase()
                    .replace(/\s+/g, "-");
                const logo = b && (b.logo || b.image_url || null);

                // If the item looks like a 'View All' label, route to /brands
                if (
                  typeof name === "string" &&
                  name.toLowerCase().includes("view all")
                ) {
                  return (
                    <Link
                      key={id}
                      to="/brands"
                      onClick={() => setPinnedCategory(null)}
                      className="flex items-center justify-center p-3 border border-gray-200 rounded-lg hover:border-red-400 hover:bg-red-50 group transition-all duration-200"
                    >
                      <span className="font-medium text-gray-700 group-hover:text-red-700 text-sm">
                        {name}
                      </span>
                    </Link>
                  );
                }

                return (
                  <Link
                    key={id}
                    to={`/brand/${slug}`}
                    onClick={() => setPinnedCategory(null)}
                    className="flex items-center justify-center p-3 border border-gray-200 rounded-lg hover:border-red-400 hover:bg-red-50 group transition-all duration-200"
                  >
                    <div className="flex items-center space-x-2">
                      {logo ? (
                        <img
                          src={logo}
                          alt={name}
                          className="w-5 h-5 object-contain"
                        />
                      ) : (
                        <div className="w-5 h-5 rounded bg-gray-100 flex items-center justify-center text-xs text-gray-700 font-bold">
                          {String(name || "")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                      )}
                      <span className="font-medium text-gray-700 group-hover:text-red-700 truncate text-sm">
                        {name}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <Link
              to={`/${category.id}`}
              onClick={() => setPinnedCategory(null)}
              className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-purple-600 to-red-600 text-white rounded-lg hover:from-purple-600 hover:to-red-600 transition-all duration-200 font-semibold text-sm shadow-md hover:shadow-lg"
            >
              View All in {category.name}
              <FaChevronRight className="ml-2 w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );

  // Auth Dropdown Component
  const AuthDropdown = () => (
    <div
      ref={authDropdownRef}
      className="absolute top-full right-0 mt-2 w-72 bg-white rounded-lg shadow-xl z-50 border border-gray-200"
    >
      {isLoggedIn ? (
        <div className="p-4">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center">
              <FaUser className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h4 className="font-bold text-gray-800">Welcome, {userName}!</h4>
              <p className="text-sm text-gray-600">{userEmail}</p>
            </div>
          </div>
          <div className="space-y-2">
            <a
              href="/account"
              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100"
            >
              <FaUser className="text-purple-600" />
              <span>My Account</span>
            </a>

            <a
              href="/wishlist"
              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100"
            >
              <FaHeart className="text-red-600" />
              <span>My Wishlist</span>
            </a>
          </div>
          <div className="mt-4 pt-4 border-t">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
            >
              <span>Logout</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4">
          <h4 className="font-bold text-lg mb-4 text-gray-800">
            Login / Sign Up
          </h4>
          <p className="text-sm text-gray-600 mb-4">
            Access your wishlist, and recommendations by logging in.
          </p>

          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-purple-600 to-red-600 text-white rounded-lg hover:from-purple-600 hover:to-red-600 transition mb-3"
          >
            <FaSignInAlt />
            <span>Continue with Email</span>
          </button>
        </div>
      )}
    </div>
  );

  // Skeleton Loader Component
  const SkeletonSuggestion = () => (
    <div className="w-full flex items-center gap-3 px-4 sm:px-5 py-4 border-b border-gray-100 animate-pulse">
      <div className="w-10 h-10 rounded-md bg-gray-200 flex-shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
      </div>
    </div>
  );

  // Text Highlight Component
  const HighlightText = ({ text, query }) => {
    if (!query || !text) return text;
    const parts = String(text).split(new RegExp(`(${query})`, "gi"));
    return (
      <>
        {parts.map((part, idx) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <span key={idx} className="font-bold text-purple-600 bg-purple-50">
              {part}
            </span>
          ) : (
            <span key={idx}>{part}</span>
          ),
        )}
      </>
    );
  };

  // Flipkart-Style Search Modal - Mobile Optimized
  const SearchModal = () => {
    const discoverItems = [
      { label: "All Products", link: "/all-products", icon: <FaTag /> },
      { label: "Best Deals", link: "/deals", icon: <FaBolt /> },
      { label: "New Launches", link: "/new-launches", icon: <FaStar /> },
      { label: "Top Brands", link: "/brands", icon: <FaStore /> },
    ];

    return (
      <>
        {isSearchOpen && (
          <>
            {/* Backdrop - Lower z-index */}
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setIsSearchOpen(false);
                  setSearchQuery("");
                  setShowSearchSuggestions(false);
                }
              }}
            />

            {/* Search Modal - Full screen on mobile using 100dvh */}
            <div
              className="fixed inset-0 lg:inset-auto lg:top-16 lg:left-0 lg:right-0 z-50 bg-white lg:shadow-lg overflow-hidden flex flex-col"
              style={{
                height: "100dvh",
                maxHeight: "100dvh",
                WebkitOverflowScrolling: "touch",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Search Input Section - Sticky */}
              <div className="w-full px-2 sm:px-4 py-3 sm:py-4 bg-white sticky top-0 z-10 border-b border-gray-100 flex-shrink-0 shadow-sm">
                <div className="flex items-center gap-2 sm:gap-3">
                  {/* Back Button */}
                  <button
                    onClick={() => {
                      setIsSearchOpen(false);
                      setSearchQuery("");
                      setShowSearchSuggestions(false);
                    }}
                    className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                    aria-label="Go back"
                  >
                    <FaArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
                  </button>

                  {/* Search Input */}
                  <div className="flex-1 relative ">
                    <input
                      ref={searchInputRef}
                      autoFocus
                      type="text"
                      placeholder="Search products, brands..."
                      value={searchQuery}
                      onChange={(e) => handleSearchInputChange(e.target.value)}
                      onKeyDown={(e) => {
                        handleSearchKeyDown(e);
                        if (
                          e.key === "Enter" &&
                          searchQuery.trim() &&
                          selectedSuggestionIndex < 0
                        ) {
                          navigate(
                            `/search?q=${encodeURIComponent(searchQuery)}`,
                          );
                          setSearchQuery("");
                          setShowSearchSuggestions(false);
                          setIsSearchOpen(false);
                        }
                      }}
                      className="w-full lg:hi px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-purple-50 border-0 rounded-full focus:outline-none transition-all placeholder-gray-400 font-medium"
                    />

                    {/* Suggestions Dropdown - Flipkart Style with Images & Highlighting */}
                    {(showSearchSuggestions || searchQuery.trim()) && (
                      <div className="hidden md:block absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        {/* Loading / Empty State */}
                        {!searchSuggestions ||
                        searchSuggestions.length === 0 ? (
                          searchQuery.trim() ? (
                            <>
                              {/* Show skeleton loaders while fetching */}
                              {isSearching &&
                                [...Array(3)].map((_, i) => (
                                  <SkeletonSuggestion key={`skeleton-${i}`} />
                                ))}
                              {/* No Results - only show after loaded */}
                              {!isSearching &&
                                searchSuggestions &&
                                searchSuggestions.length === 0 && (
                                  <div className="w-full text-center py-8 px-4">
                                    <div className="text-gray-400 text-4xl mb-2">
                                      🔍
                                    </div>
                                    <p className="text-sm text-gray-500">
                                      No products found for "{searchQuery}"
                                    </p>
                                    <p className="text-xs text-gray-400 mt-2">
                                      Try searching for brands or other devices
                                    </p>
                                  </div>
                                )}
                            </>
                          ) : null
                        ) : (
                          /* Suggestions List */
                          <>
                            {searchSuggestions
                              .slice(0, 7)
                              .map((sugg, index) => (
                                <button
                                  key={index}
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleSuggestionClick(sugg);
                                  }}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleSuggestionClick(sugg);
                                  }}
                                  onMouseEnter={() =>
                                    setSelectedSuggestionIndex(index)
                                  }
                                  className={`w-full flex items-center gap-3 px-4 sm:px-5 py-4 border-b border-gray-100 last:border-b-0 text-left transition-all duration-150 min-h-[56px] sm:min-h-[60px] hover:bg-purple-50 active:bg-purple-100 ${
                                    selectedSuggestionIndex === index
                                      ? "bg-purple-50"
                                      : ""
                                  }`}
                                >
                                  {/* Product Thumbnail */}
                                  <div className="w-12 h-12 flex-shrink-0 overflow-hidden flex items-center justify-center">
                                    {sugg.image_url ? (
                                      <img
                                        src={sugg.image_url}
                                        alt={sugg.name}
                                        className="w-full h-full object-contain"
                                        loading="lazy"
                                        onError={(e) => {
                                          e.currentTarget.style.display =
                                            "none";
                                        }}
                                      />
                                    ) : (
                                      <span className="font-bold text-lg text-purple-600">
                                        {(sugg.brand_name || sugg.name || "")
                                          .charAt(0)
                                          .toUpperCase()}
                                      </span>
                                    )}
                                  </div>

                                  {/* Text Content */}
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm sm:text-base font-medium text-gray-900 truncate leading-snug">
                                      <HighlightText
                                        text={sugg.name}
                                        query={searchQuery}
                                      />
                                    </div>
                                    <div className="text-xs sm:text-sm text-gray-500 truncate mt-0.5">
                                      {sugg.type === "product"
                                        ? sugg.brand_name ||
                                          sugg.model ||
                                          "Smartphone"
                                        : sugg.type || ""}
                                    </div>
                                  </div>

                                  {/* Chevron Icon */}
                                </button>
                              ))}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Scrollable Content Area */}
              <div className="flex-1 overflow-y-auto">
                {/* Mobile Search Suggestions - Display in Scrollable Area */}
                {searchQuery.trim() && (
                  <div className="px-4 sm:px-6 py-4 sm:py-6">
                    {/* Loading State */}
                    {!searchSuggestions || searchSuggestions.length === 0 ? (
                      <>
                        {/* Show skeleton loaders while fetching */}
                        {isSearching &&
                          [...Array(3)].map((_, i) => (
                            <SkeletonSuggestion key={`skeleton-${i}`} />
                          ))}
                        {/* No Results - only show after loaded */}
                        {!isSearching &&
                          searchSuggestions &&
                          searchSuggestions.length === 0 && (
                            <div className="w-full text-center py-12 px-4">
                              <div className="text-gray-400 text-5xl mb-3">
                                🔍
                              </div>
                              <p className="text-sm font-medium text-gray-900 mb-1">
                                No products found
                              </p>
                              <p className="text-xs text-gray-500">
                                No results for "{searchQuery}"
                              </p>
                              <p className="text-xs text-gray-400 mt-2">
                                Try searching for brands or other devices
                              </p>
                            </div>
                          )}
                      </>
                    ) : (
                      /* Suggestions List for Mobile */
                      <div className="space-y-2">
                        {searchSuggestions.slice(0, 7).map((sugg, index) => (
                          <button
                            key={index}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleSuggestionClick(sugg);
                            }}
                            // Fallback for touch/mobile
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleSuggestionClick(sugg);
                            }}
                            className="w-full flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:border-purple-300 active:bg-purple-50 transition-all duration-150 min-h-[64px] text-left"
                          >
                            {/* Product Thumbnail */}

                            {/* Text Content */}
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900 truncate leading-snug">
                                <HighlightText
                                  text={sugg.name}
                                  query={searchQuery}
                                />
                              </div>
                              <div className="text-xs text-gray-500 truncate mt-1">
                                {sugg.type === "product"
                                  ? sugg.brand_name ||
                                    sugg.model ||
                                    "Smartphone"
                                  : sugg.type || ""}
                              </div>
                            </div>

                            {/* Chevron Icon */}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </>
    );
  };

  // Main Header Component - Desktop + Mobile
  const MainHeader = () => (
    <>
      {/* MOBILE HEADER (≤ 768px) */}
      <div className="md:hidden border-b bg-white border-purple-50 z-40">
        {/* Mobile Top Row: Logo (left) | Icons (right) */}
        <div className="flex items-center justify-between px-4 py-3 gap-3">
          {/* Logo (mobile) */}
          <Link to="/" className="flex items-center min-w-0">
            <HookLogo className="block h-8 w-auto max-w-[180px] text-gray-900 sm:h-9 sm:max-w-[220px]" />
          </Link>

          {/* Right Icons: Compare + Menu */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              to="/compare"
              className="p-2.5 rounded-lg hover:bg-gray-100 transition-all duration-200 text-gray-600 hover:text-gray-900"
              aria-label="Compare"
            >
              <Scale className="w-5 h-5" />
            </Link>

            <button
              className="p-2.5 rounded-lg hover:bg-gray-100 transition-all duration-200 flex-shrink-0 text-gray-600 hover:text-gray-900"
              onClick={() => setIsMenuOpen(true)}
              aria-label="Open menu"
            >
              <FaStream className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Search Input Row */}
        <div className="px-4 py-3 max-w-6xl mx-auto">
          <div className="relative">
            {/* Search Icon */}

            <FaSearch className="fa fa-search absolute left-3 top-1/2 -translate-y-1/2 text-purple-400 pointer-events-none" />

            <input
              type="text"
              placeholder="Search products, brands and more..."
              value={searchQuery}
              onChange={(e) => {
                handleSearchInputChange(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              onKeyDown={(e) => {
                handleSearchKeyDown(e);
                if (
                  e.key === "Enter" &&
                  searchQuery.trim() &&
                  selectedSuggestionIndex < 0
                ) {
                  navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
                  setSearchQuery("");
                  setShowSearchSuggestions(false);
                  setIsSearchOpen(false);
                }
              }}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-300 font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all placeholder-gray-500"
              aria-label="Search"
            />
          </div>
        </div>
      </div>

      {/* DESKTOP HEADER (> 768px) */}
      <div className="hidden md:block bg-white  z-40 py-2 sm:py-2.5 px-2">
        <div className="max-w-7xl mx-auto px-3 sm:px-6">
          <div className="flex items-center justify-between gap-2 sm:gap-8">
            {/* Logo */}
            <Link to="/" className="flex items-center flex-shrink-0">
              <HookLogo className="block h-9 w-auto text-gray-900 lg:h-10" />
            </Link>

            {/* Desktop Search Bar - Professional Style */}
            <div
              ref={searchRef}
              className="flex-1 min-w-[240px] max-w-2xl lg:max-w-3xl xl:max-w-[900px] mx-2 sm:mx-6 relative search-input-wrapper"
            >
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search for products, brands and more..."
                value={searchQuery}
                onChange={(e) => handleSearchInputChange(e.target.value)}
                onKeyDown={(e) => {
                  handleSearchKeyDown(e);
                  if (
                    e.key === "Enter" &&
                    searchQuery.trim() &&
                    selectedSuggestionIndex < 0
                  ) {
                    navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
                    setSearchQuery("");
                    setShowSearchSuggestions(false);
                  }
                }}
                className="w-full pl-10 pr-4 py-3 text-sm bg-gray-50 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 search-input rounded-lg transition-all placeholder-gray-500 font-medium"
              />

              {/* Desktop Suggestions Dropdown - Enhanced with Images & Highlighting */}
              {showSearchSuggestions && searchQuery.trim() && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-96 overflow-y-auto mega-menu-slide [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {isSearching ? (
                    <div className="p-4 space-y-2">
                      {[...Array(3)].map((_, i) => (
                        <SkeletonSuggestion key={`desktop-skel-${i}`} />
                      ))}
                    </div>
                  ) : searchSuggestions.length === 0 ? (
                    <div className="w-full text-center py-10 px-4">
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        No products found
                      </p>
                      <p className="text-xs text-gray-500">
                        No results for "{searchQuery}"
                      </p>
                    </div>
                  ) : (
                    searchSuggestions.slice(0, 7).map((sugg, index) => (
                      <button
                        key={index}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleSuggestionClick(sugg);
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleSuggestionClick(sugg);
                        }}
                        onMouseEnter={() => setSelectedSuggestionIndex(index)}
                        className={`w-full flex items-center gap-4 px-5 py-4 border-b border-gray-100 last:border-b-0 text-left transition-all duration-150 min-h-[64px] mega-menu-item ${
                          selectedSuggestionIndex === index
                            ? "bg-purple-50"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        {/* Product Image */}
                        <div className="w-12 h-12 overflow-hidden flex items-center justify-center flex-shrink-0">
                          {sugg.image ||
                          sugg.image_url ||
                          sugg.product_image ||
                          sugg.imageUrl ? (
                            <img
                              src={
                                sugg.image ||
                                sugg.image_url ||
                                sugg.product_image ||
                                sugg.imageUrl
                              }
                              alt={sugg.name}
                              className="w-full h-full object-contain"
                              loading="lazy"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            <span className="font-bold text-sm text-purple-600">
                              {(
                                sugg.brand_name ||
                                sugg.model ||
                                sugg.name ||
                                ""
                              )
                                .charAt(0)
                                .toUpperCase()}
                            </span>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="text-base font-semibold text-gray-900 truncate">
                            <HighlightText
                              text={sugg.name}
                              query={searchQuery}
                            />
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {sugg.type === "product"
                              ? sugg.brand_name || sugg.model || "Smartphone"
                              : sugg.type || ""}
                          </div>
                        </div>

                        {/* Chevron */}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Utility Icons - Desktop */}
            <div className="flex items-center space-x-8 ml-auto">
              {directLinks.map((linkItem, index) => (
                <a
                  key={index}
                  href={linkItem.link}
                  className="text-gray-600 hover:text-red-600 font-medium text-sm transition-all duration-200 relative group"
                >
                  {linkItem.name}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-red-600 group-hover:w-full transition-all duration-300" />
                </a>
              ))}
              {utilityItems.map((item, index) => (
                <a
                  key={index}
                  href={item.link}
                  className="relative group flex items-center justify-center transition-all duration-200"
                >
                  <div className="relative">
                    <div className="p-2.5 rounded-lg hover:bg-gray-100 transition-all duration-200 text-gray-600 hover:text-gray-900">
                      <span className="text-lg">{item.icon}</span>
                    </div>
                    {item.count && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-md">
                        {item.count}
                      </span>
                    )}
                  </div>

                  {item.name === "Cart" && (
                    <div className="absolute -bottom-10 hidden group-hover:block bg-gray-900 text-white text-xs px-3 py-1.5 rounded-md whitespace-nowrap shadow-lg z-50 font-medium">
                      ₹24,599
                    </div>
                  )}
                </a>
              ))}

              {/* Auth Dropdown Trigger */}
              <div className="relative auth-button">
                <button
                  className="flex items-center justify-center transition-all duration-200"
                  onClick={() => setShowAuthDropdown(!showAuthDropdown)}
                >
                  <div className="p-2.5 rounded-lg hover:bg-gray-100 transition-all duration-200 text-gray-600 hover:text-gray-900">
                    <FaUser className="w-5 h-5" />
                  </div>
                </button>
                {showAuthDropdown && <AuthDropdown />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  // Category Navigation Bar with Mega Menus
  // NOTE: Desktop category navigation logic is commented out for responsive/debugging purposes.
  // The original implementation rendered a complex mega-menu for lg+ viewports.
  // To temporarily disable that behavior (while preserving the codebase),
  // the component now returns null. Restore the original JSX to re-enable.
  const CategoryNavBar = () => {
    return null;
  };

  // Mobile Menu Drawer
  const MobileMenuDrawer = () => (
    <>
      {isMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Drawer */}
          <div
            className={`fixed top-0 left-0 bottom-0 w-80 bg-white z-50 transform transition-transform duration-300 lg:hidden shadow-2xl ring-1 ring-black/5 ${
              isMenuOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <div className="flex flex-col h-full">
              {/* Drawer Header */}
              <div className="bg-white border-b border-gray-200">
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <HookLogo className="h-9 w-auto text-gray-900" />
                    <button
                      type="button"
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                      onClick={() => setIsMenuOpen(false)}
                      aria-label="Close menu"
                    >
                      <FaTimes className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>

                  {isLoggedIn ? (
                    <div className="mt-4 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
                        <FaUser className="w-4 h-4 text-gray-700" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-900 truncate">
                          {userName}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {userEmail}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-gray-600">
                      <Link
                        to="/login"
                        onClick={() => setIsMenuOpen(false)}
                        className="font-semibold text-gray-900 hover:text-purple-700 transition-colors"
                      >
                        Login
                      </Link>
                      <span className="mx-1 text-gray-400">/</span>
                      <Link
                        to="/signup"
                        onClick={() => setIsMenuOpen(false)}
                        className="font-semibold text-gray-900 hover:text-purple-700 transition-colors"
                      >
                        Signup
                      </Link>
                    </p>
                  )}
                </div>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto">
                {/* Quick Links */}
                <div className="p-4">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Quick Links
                  </h4>
                  <div className="space-y-1">
                    <button
                      type="button"
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-gray-900"
                      onClick={() => {
                        navigate("/");
                        setIsMenuOpen(false);
                      }}
                    >
                      <FaHome className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium">Home</span>
                    </button>

                    <button
                      type="button"
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-gray-900"
                      onClick={() => {
                        navigate("/compare");
                        setIsMenuOpen(false);
                      }}
                    >
                      <Scale className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium">Compare</span>
                    </button>

                    <button
                      type="button"
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-gray-900"
                      onClick={() => {
                        navigate("/wishlist");
                        setIsMenuOpen(false);
                      }}
                    >
                      <FaHeart className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium">Wishlist</span>
                    </button>
                  </div>
                </div>

                {/* Categories */}
                <div className="px-4 pb-4">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Categories
                  </h4>
                  <div className="divide-y divide-gray-200 rounded-lg border border-gray-200 overflow-hidden">
                    {categoriesWithBrands.map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        className="w-full flex items-center justify-between px-3 py-2.5 bg-white hover:bg-gray-50 transition-colors group"
                        onClick={() => {
                          const route = `/${mapProductTypeToRoute(
                            category.id,
                          )}`;
                          navigate(route || "/");
                          setIsMenuOpen(false);
                        }}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-gray-500 group-hover:text-purple-600 transition-colors">
                            {category.icon}
                          </span>
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {category.name}
                          </span>
                        </div>
                        <FaChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-700 transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Logout / Today's Deals */}
                <div className="p-4 border-t border-gray-200 space-y-3">
                  {isLoggedIn ? (
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMenuOpen(false);
                      }}
                      type="button"
                      className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <FaTimes className="text-lg" />
                      <span>Logout</span>
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );

  // Quick Navigation Tabs - Mobile Only
  const QuickNavTabs = () => {
    const navTabs = [
      { label: "Mobiles", link: "/smartphones", icon: <FaMobileAlt /> },
      { label: "Laptops", link: "/laptops", icon: <FaLaptop /> },
      { label: "Appliances", link: "/appliances", icon: <FaSnowflake /> },
      { label: "Networking", link: "/networking", icon: <FaPlug /> },
    ];

    return (
      <div className="bg-white border-b border-gray-200 lg:hidden">
        <div className="max-w-6xl mx-auto px-2 sm:px-4">
          <div className="overflow-x-auto no-scrollbar">
            <nav className="flex gap-6 py-2 min-w-max">
              {navTabs.map((tab, index) => {
                const isActive =
                  location.pathname === tab.link ||
                  location.pathname.startsWith(`${tab.link}/`);

                return (
                  <Link
                    key={index}
                    to={tab.link}
                    className={`flex items-center gap-2 px-1 pb-2 border-b-2 transition-colors duration-200 font-medium text-sm sm:text-base whitespace-nowrap flex-shrink-0 ${
                      isActive
                        ? "text-purple-700 border-purple-600"
                        : "text-gray-600 border-transparent hover:text-gray-900"
                    }`}
                  >
                    <span
                      className={`transition-colors ${
                        isActive ? "text-purple-700" : "text-gray-500"
                      }`}
                    >
                      {tab.icon}
                    </span>
                    <span>{tab.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <SearchModal />

      <header className="fixed top-0 left-0 right-0 z-40 bg-white lg:sticky lg:z-40">
        <MainHeader />
        <CategoryNavBar />
      </header>

      <MobileMenuDrawer />

      {/* Spacer for fixed header (mobile only) */}
      <div className="h-32 md:hidden" />

      <QuickNavTabs />
    </>
  );
};

export default Header;
