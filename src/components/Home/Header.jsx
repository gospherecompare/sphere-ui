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
 *   - Logo | Inline Search Bar | Spacer | Utility actions
 *
 * ARCHITECTURE:
 * ─────────────
 * - MainHeader: Conditional rendering based on breakpoint (md:)
 *   └─ Mobile section: md:hidden (visible on mobile only)
 *   └─ Desktop section: hidden md:block (visible on desktop+)
 * - SearchModal: Full-screen overlay search with discover section
 * - MobileMenuDrawer: Vertical sidebar for categories (hamburger)
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
import { useDevice } from "../../hooks/useDevice";
import { createProductPath } from "../../utils/slugGenerator";
import {
  buildPublicSmartphoneBrandPath as buildSmartphoneBrandPath,
  buildPublicSmartphoneFeaturePath as buildSmartphoneFeaturePath,
  buildPublicSmartphoneFilterPath as buildSmartphoneFilterPath,
} from "../../utils/smartphoneListingRoutes";
import { toCanonicalPagePath } from "../../utils/publicUrl";
import { isPublishedProduct } from "../../utils/publishedProducts";
import {
  MOBILE_OPEN_EXPLORE_EVENT,
  MOBILE_OPEN_SEARCH_EVENT,
  MOBILE_OPEN_ASSISTANT_EVENT,
} from "../../utils/mobileNavigation";
import "./header-redesign.css";

// Icons - matching Vijay Sales style
import {
  FaSearch,
  FaBars,
  FaArrowLeft,
  FaArrowRight,
  FaChevronRight,
  FaChevronDown,
  FaInfoCircle,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaTag,
  FaBolt,
  FaGift,
  FaStar,
  FaMobileAlt,
  FaApple,
  FaTv,
  FaPlug,
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
  FaStore,
  FaCreditCard,
  FaShippingFast,
  FaTruck,
  FaPercentage,
  FaCalendarAlt,
  FaWeight,
  FaHandsHelping,
  FaAlignJustify,
  FaBriefcase,
  FaTimes,
  FaCompass,
  FaHistory,
  FaFire,
  FaNewspaper,
  FaComments,
} from "react-icons/fa";

const BrandIdentity = ({ variant = "desktop", darkBackground = false }) => {
  const isDesktop = variant === "desktop";

  const logoClass = isDesktop
    ? "h-[34px] w-[72px] lg:h-[28px] lg:w-[80px]"
    : "h-[20px] w-[50px]";
  // White header  -> dark M / blue X
  // Dark favicon   -> white M / blue X
  const primaryColor = darkBackground ? "#FFFFFF" : "#111318";
  const accentColor = "#2563EB";

  return (
    <span
      className={`inline-flex shrink-0 items-center ${logoClass}`}
      aria-label="MobilesX"
      role="img"
    >
      <svg
        viewBox="0 0 874 420"
        className="block h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
      >
        {/* =========================
            M / LEFT GEOMETRY
        ========================== */}
        <path
          fill={primaryColor}
          d="
            M0 419
            H99
            L101 142
            L288 327
            L471 145
            L400 75
            L288 185
            L101 0
            H0
            Z
          "
        />

        {/* =========================
            CENTRAL CHEVRON / CUT
        ========================== */}
        <path
          fill={primaryColor}
          d="
            M365 0
            L568 202
            L357 419
            H476
            L689 202
            L488 0
            Z
          "
        />

        {/* =========================
            X - TOP ARM
        ========================== */}
        <path
          fill={accentColor}
          d="
            M868 0
            H746
            L639 117
            L700 179
            Z
          "
        />

        {/* =========================
            X - BOTTOM ARM
        ========================== */}
        <path
          fill={accentColor}
          d="
            M631 298
            L746 420
            H874
            L694 235
            Z
          "
        />
      </svg>
    </span>
  );
};
const SEARCH_SUGGESTION_LIMIT = 5;
const MOBILE_HEADER_SHOW_TOP_OFFSET = 80;
const MOBILE_HEADER_SHOW_BOTTOM_OFFSET = 160;
const MOBILE_HEADER_HIDE_SCROLL_DELTA = 12;
const MOBILE_HEADER_SHOW_SCROLL_DELTA = 6;
const DESKTOP_HEADER_SHOW_TOP_OFFSET = 110;
const DESKTOP_HEADER_HIDE_SCROLL_DELTA = 14;
const DESKTOP_HEADER_SHOW_SCROLL_DELTA = 8;
const SEARCH_RECENTS_STORAGE_KEY = "mobilesx-search-recents";
const DEFAULT_RECENT_SEARCHES = ["Samsung Galaxy F70 Pro", "iPhone 17"];
const SEARCH_RESULT_CATEGORIES = [
  "All",
  "Smartphones",
  "Brands",
  "News",
  "TVs",
];
const TRENDING_SEARCHES = [
  "Latest Samsung phones",
  "Best phones under ₹20,000",
  "Best 5G phones",
  "iPhone 17",
];

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const saved = JSON.parse(
        window.localStorage.getItem(SEARCH_RECENTS_STORAGE_KEY) || "null",
      );
      return Array.isArray(saved) && saved.length
        ? saved.filter((item) => typeof item === "string").slice(0, 5)
        : DEFAULT_RECENT_SEARCHES;
    } catch {
      return DEFAULT_RECENT_SEARCHES;
    }
  });
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDesktopSearchOpen, setIsDesktopSearchOpen] = useState(false);
  const [activeSearchCategory, setActiveSearchCategory] = useState("All");
  const [activeDesktopMenu, setActiveDesktopMenu] = useState("");
  const [isMobileHeaderVisible, setIsMobileHeaderVisible] = useState(true);
  const [isDesktopHeaderVisible, setIsDesktopHeaderVisible] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = (() => {
    const path = String(location.pathname || "").toLowerCase();
    if (!path || path === "/") return "/";
    return path.replace(/\/+$/g, "");
  })();
  const isLocalDevHost =
    typeof window !== "undefined" &&
    /^(localhost|127\.0\.0\.1|::1)$/.test(window.location.hostname || "");
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);
  const mobileHeaderRef = useRef(null);
  const headerRef = useRef(null);
  const mobileHeaderLastScrollYRef = useRef(0);
  const mobileHeaderTickingRef = useRef(false);
  const desktopHeaderLastScrollYRef = useRef(0);
  const desktopHeaderTickingRef = useRef(false);
  const inputWasFocusedRef = useRef(false);
  const suppressRestoreRef = useRef(false);
  const deviceCtx = useDevice({ resources: ["brands"] });
  const brands = (deviceCtx && deviceCtx.brands) || [];

  const rememberSearchTerm = (value) => {
    const term = String(value || "").trim().replace(/\s+/g, " ");
    if (!term) return;
    setRecentSearches((current) => [
      term,
      ...current.filter(
        (item) => String(item).toLowerCase() !== term.toLowerCase(),
      ),
    ].slice(0, 5));
  };

  useEffect(() => {
    try {
      window.localStorage.setItem(
        SEARCH_RECENTS_STORAGE_KEY,
        JSON.stringify(recentSearches),
      );
    } catch {
      // Search suggestions still work when browser storage is unavailable.
    }
  }, [recentSearches]);

  const isSmartphoneDetailRoute = /^\/smartphones\/[^/]+$/i.test(currentPath);

  useEffect(() => {
    setActiveDesktopMenu("");
    setIsDesktopSearchOpen(false);
    setIsMobileHeaderVisible(true);
    setIsDesktopHeaderVisible(true);
    if (typeof window !== "undefined") {
      const currentY = Math.max(0, window.scrollY || 0);
      mobileHeaderLastScrollYRef.current = currentY;
      desktopHeaderLastScrollYRef.current = currentY;
    }
  }, [location.pathname]);

  useEffect(() => {
    if (isMenuOpen || isSearchOpen) {
      setIsMobileHeaderVisible(true);
    }
    if (isDesktopSearchOpen || activeDesktopMenu) {
      setIsDesktopHeaderVisible(true);
    }
  }, [activeDesktopMenu, isDesktopSearchOpen, isMenuOpen, isSearchOpen]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const updateMobileHeaderVisibility = () => {
      mobileHeaderTickingRef.current = false;

      const width = window.innerWidth || 0;
      const currentY = Math.max(0, window.scrollY || window.pageYOffset || 0);

      if (
        width >= 1024 ||
        isSmartphoneDetailRoute ||
        isMenuOpen ||
        isSearchOpen
      ) {
        setIsMobileHeaderVisible(true);
        mobileHeaderLastScrollYRef.current = currentY;
        return;
      }

      const doc = document.documentElement;
      const maxScroll = Math.max(0, doc.scrollHeight - window.innerHeight);
      const nearTop = currentY <= MOBILE_HEADER_SHOW_TOP_OFFSET;
      const nearBottom =
        maxScroll - currentY <= MOBILE_HEADER_SHOW_BOTTOM_OFFSET;
      const delta = currentY - mobileHeaderLastScrollYRef.current;

      if (nearTop || nearBottom) {
        setIsMobileHeaderVisible(true);
        mobileHeaderLastScrollYRef.current = currentY;
        return;
      }

      if (delta > MOBILE_HEADER_HIDE_SCROLL_DELTA) {
        setIsMobileHeaderVisible(false);
        mobileHeaderLastScrollYRef.current = currentY;
        return;
      }

      if (delta < -MOBILE_HEADER_SHOW_SCROLL_DELTA) {
        setIsMobileHeaderVisible(true);
        mobileHeaderLastScrollYRef.current = currentY;
      }
    };

    const onScroll = () => {
      if (mobileHeaderTickingRef.current) return;
      mobileHeaderTickingRef.current = true;
      window.requestAnimationFrame(updateMobileHeaderVisibility);
    };

    const onResize = () => {
      setIsMobileHeaderVisible(true);
      mobileHeaderLastScrollYRef.current = Math.max(0, window.scrollY || 0);
    };

    mobileHeaderLastScrollYRef.current = Math.max(0, window.scrollY || 0);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      mobileHeaderTickingRef.current = false;
    };
  }, [isMenuOpen, isSearchOpen, isSmartphoneDetailRoute]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const updateDesktopHeaderVisibility = () => {
      desktopHeaderTickingRef.current = false;

      const width = window.innerWidth || 0;
      const currentY = Math.max(0, window.scrollY || window.pageYOffset || 0);

      if (
        width < 1024 ||
        !isSmartphoneDetailRoute ||
        isDesktopSearchOpen ||
        Boolean(activeDesktopMenu)
      ) {
        setIsDesktopHeaderVisible(true);
        desktopHeaderLastScrollYRef.current = currentY;
        return;
      }

      const nearTop = currentY <= DESKTOP_HEADER_SHOW_TOP_OFFSET;
      const delta = currentY - desktopHeaderLastScrollYRef.current;

      if (nearTop) {
        setIsDesktopHeaderVisible(true);
        desktopHeaderLastScrollYRef.current = currentY;
        return;
      }

      if (delta > DESKTOP_HEADER_HIDE_SCROLL_DELTA) {
        setIsDesktopHeaderVisible(false);
        desktopHeaderLastScrollYRef.current = currentY;
        return;
      }

      if (delta < -DESKTOP_HEADER_SHOW_SCROLL_DELTA) {
        setIsDesktopHeaderVisible(true);
        desktopHeaderLastScrollYRef.current = currentY;
      }
    };

    const onScroll = () => {
      if (desktopHeaderTickingRef.current) return;
      desktopHeaderTickingRef.current = true;
      window.requestAnimationFrame(updateDesktopHeaderVisibility);
    };

    const onResize = () => {
      setIsDesktopHeaderVisible(true);
      desktopHeaderLastScrollYRef.current = Math.max(0, window.scrollY || 0);
    };

    desktopHeaderLastScrollYRef.current = Math.max(0, window.scrollY || 0);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      desktopHeaderTickingRef.current = false;
    };
  }, [activeDesktopMenu, isDesktopSearchOpen, isSmartphoneDetailRoute]);

  // Keep the mobile header height in sync for sticky offsets.
  useEffect(() => {
    const updateMobileHeaderHeight = () => {
      if (typeof window === "undefined") return;

      const width = window.innerWidth;
      const isMobile = width < 1024;
      const measuredMobile = Math.ceil(
        mobileHeaderRef.current?.getBoundingClientRect().height || 0,
      );
      const measuredDesktop = Math.ceil(
        headerRef.current?.getBoundingClientRect().height || 0,
      );

      if (isMobile) {
        if (measuredMobile > 0) {
          document.documentElement.style.setProperty(
            "--mobile-header-height",
            `${measuredMobile}px`,
          );
        }
        document.documentElement.style.setProperty(
          "--mobile-listing-controls-top",
          `${measuredMobile}px`,
        );
        document.documentElement.style.setProperty(
          "--desktop-header-height",
          "0px",
        );
        return;
      }

      document.documentElement.style.setProperty(
        "--mobile-header-height",
        "0px",
      );
      document.documentElement.style.setProperty(
        "--mobile-listing-controls-top",
        "0px",
      );
      document.documentElement.style.setProperty(
        "--desktop-header-height",
        `${measuredDesktop}px`,
      );
    };

    updateMobileHeaderHeight();
    window.addEventListener("resize", updateMobileHeaderHeight);

    let resizeObserver = null;
    if (typeof ResizeObserver !== "undefined" && mobileHeaderRef.current) {
      resizeObserver = new ResizeObserver(updateMobileHeaderHeight);
      resizeObserver.observe(mobileHeaderRef.current);
      if (headerRef.current) {
        resizeObserver.observe(headerRef.current);
      }
    }

    return () => {
      window.removeEventListener("resize", updateMobileHeaderHeight);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const updateListingControlsOffset = () => {
      const isMobile = window.innerWidth < 1024;
      const measuredMobile = Math.ceil(
        mobileHeaderRef.current?.getBoundingClientRect().height || 52,
      );

      document.documentElement.style.setProperty(
        "--mobile-listing-controls-top",
        isMobile && isMobileHeaderVisible ? `${measuredMobile}px` : "0px",
      );
    };

    updateListingControlsOffset();
    window.addEventListener("resize", updateListingControlsOffset);

    return () => {
      window.removeEventListener("resize", updateListingControlsOffset);
    };
  }, [isMobileHeaderVisible]);

  // Publish the currently visible header height so page-level sticky controls
  // can move to the viewport top when the header hides and settle below it
  // when the header returns.
  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const updateVisibleHeaderOffset = () => {
      const isDesktop = window.innerWidth >= 1024;
      const measuredHeight = Math.ceil(
        (isDesktop
          ? headerRef.current
          : mobileHeaderRef.current
        )?.getBoundingClientRect().height || 0,
      );
      const isVisible = isDesktop
        ? isDesktopHeaderVisible
        : isMobileHeaderVisible;

      document.documentElement.style.setProperty(
        "--site-sticky-header-offset",
        isVisible && measuredHeight > 0 ? `${measuredHeight}px` : "0px",
      );
    };

    updateVisibleHeaderOffset();
    window.addEventListener("resize", updateVisibleHeaderOffset);

    const transitionTimer = window.setTimeout(updateVisibleHeaderOffset, 320);

    return () => {
      window.removeEventListener("resize", updateVisibleHeaderOffset);
      window.clearTimeout(transitionTimer);
    };
  }, [isDesktopHeaderVisible, isMobileHeaderVisible]);

  // Close mega menu on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchSuggestions(false);
        if (isDesktopSearchOpen) {
          setIsDesktopSearchOpen(false);
          setSearchQuery("");
          setSearchSuggestions([]);
          setSelectedSuggestionIndex(-1);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDesktopSearchOpen]);

  // Auto-focus search input when opened
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isSearchOpen]);

  useEffect(() => {
    if (isDesktopSearchOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isDesktopSearchOpen]);

  // Keep the page behind an active search or navigation surface stationary.
  useEffect(() => {
    if (isSearchOpen || isDesktopSearchOpen || isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isSearchOpen, isDesktopSearchOpen, isMenuOpen]);

  // Debounce / abort helpers for live suggestions
  const debounceRef = useRef(null);
  const abortRef = useRef(null);

  const mapProductTypeToRoute = (ptype) => {
    if (!ptype) return "smartphones"; // default
    const t = String(ptype).toLowerCase().trim();
    if (
      t.includes("television") ||
      t === "tv" ||
      t === "tvs" ||
      t.includes("appliance") ||
      t.includes("home") ||
      t === "appliance"
    ) {
      return "tvs";
    }
    if (t.includes("phone") || t.includes("smart") || t === "smartphone")
      return "smartphones";
    if (t.includes("network") || t === "networking") return "networking";
    // Default to smartphones if can't determine
    return "smartphones";
  };

  const getCatalogBasePath = (ptype) => `/${mapProductTypeToRoute(ptype)}`;

  const buildCatalogPath = (ptype, params = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      const text = String(value == null ? "" : value).trim();
      if (text) queryParams.set(key, text);
    });
    const query = queryParams.toString();
    const basePath = getCatalogBasePath(ptype);
    return `${basePath}${query ? `?${query}` : ""}`;
  };

  const buildBrandListingPath = (brandName, ptype) => {
    const category = mapProductTypeToRoute(ptype);
    if (category === "smartphones") {
      return buildSmartphoneBrandPath(brandName);
    }
    return buildCatalogPath(ptype, { brand: brandName });
  };

  const buildFeatureListingPath = (featureId) =>
    buildSmartphoneFeaturePath(featureId);

  const buildKeywordSearchPath = (query, ptype) =>
    buildCatalogPath(ptype, { q: query });

  const resolveProductSuggestionPath = (item) => {
    const directPath = readFirstText(
      item?.route_path,
      item?.routePath,
      item?.canonical_path,
      item?.canonicalPath,
      item?.path,
      item?.href,
    );

    if (directPath && isLikelyProductDetailPath(directPath)) {
      return toCanonicalPagePath(directPath);
    }

    const category = mapProductTypeToRoute(
      item?.product_type || item?.productType,
    );
    const productKey = readFirstText(
      item?.name,
      item?.product_name,
      item?.productName,
      item?.model,
      item?.model_number,
      item?.modelNumber,
    );

    return createProductPath(category, productKey);
  };

  const getSuggestionTypeIcon = (sugg) => {
    const suggestionType = String(sugg?.type || "").toLowerCase();
    if (suggestionType === "brand") return FaStore;

    const productType = String(
      sugg?.product_type || sugg?.productType || "",
    ).toLowerCase();

    if (productType.includes("tv") || productType.includes("appliance"))
      return FaTv;
    if (productType.includes("network")) return FaPlug;
    if (productType.includes("phone") || productType.includes("smart"))
      return FaMobileAlt;

    return FaSearch;
  };

  const getSuggestionImage = (sugg) =>
    sugg?.image ||
    sugg?.image_url ||
    sugg?.product_image ||
    sugg?.imageUrl ||
    null;

  const getSuggestionPriceLabel = (suggestion) => {
    const rawPrice =
      suggestion?.min_price ??
      suggestion?.minPrice ??
      suggestion?.starting_price ??
      suggestion?.startingPrice ??
      suggestion?.price ??
      suggestion?.price_min ??
      suggestion?.priceMin;
    const numericPrice =
      typeof rawPrice === "number"
        ? rawPrice
        : Number(String(rawPrice || "").replace(/[^\d.]/g, ""));
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) return "";
    return `From ₹${new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: 0,
    }).format(numericPrice)}`;
  };

  const getSuggestionVariantTypes = (sugg) => {
    const raw = sugg?.variant_types || sugg?.variantTypes;
    if (Array.isArray(raw)) {
      return raw
        .map((x) => String(x || "").trim())
        .filter(Boolean)
        .slice(0, 3);
    }
    return [];
  };

  const getSuggestionFeatures = (sugg) => {
    const raw = sugg?.key_features || sugg?.keyFeatures;
    if (Array.isArray(raw)) {
      return raw
        .map((x) => String(x || "").trim())
        .filter(Boolean)
        .slice(0, 3);
    }
    return [];
  };

  const normalizeText = (value) =>
    String(value || "")
      .toLowerCase()
      .trim();

  const readFirstText = (...values) => {
    for (const value of values) {
      if (value === null || value === undefined) continue;
      const text = String(value).trim();
      if (text) return text;
    }
    return "";
  };

  const isLikelyProductDetailPath = (value) => {
    const normalized = String(value || "")
      .trim()
      .replace(/\/+$/g, "")
      .toLowerCase();

    if (!normalized.startsWith("/")) return false;

    return [
      /^\/smartphones\/[^/]+$/i,
      /^\/smartphone\/[^/]+$/i,
      /^\/tvs\/[^/]+$/i,
      /^\/appliances\/[^/]+$/i,
      /^\/networking\/[^/]+$/i,
      /^\/devices\/(?:smartphones|mobiles|tvs|appliances|networking)\/[^/]+$/i,
    ].some((pattern) => pattern.test(normalized));
  };

  // Search suggestions come from the server on demand. Keeping full catalogs
  // in the global header caused every route to download smartphone and TV data.
  const localSearchSuggestions = React.useMemo(() => [], []);

  const localProductSuggestionsById = React.useMemo(() => {
    const byId = new Map();
    localSearchSuggestions.forEach((item) => {
      const id = item?.id ?? item?.product_id ?? item?.productId;
      if (id === null || id === undefined || id === "") return;
      byId.set(String(id), item);
    });
    return byId;
  }, [localSearchSuggestions]);

  const enrichApiSuggestion = (item) => {
    if (!item || typeof item !== "object") return item;
    if (normalizeText(item.type || "product") !== "product") return item;

    const id = item.id ?? item.product_id ?? item.productId;
    const localItem =
      id === null || id === undefined || id === ""
        ? null
        : localProductSuggestionsById.get(String(id));

    if (!localItem) return item;

    const localVariants = getSuggestionVariantTypes(localItem);
    const localFeatures = getSuggestionFeatures(localItem);

    return {
      ...item,
      name: localItem.name || item.name,
      model: localItem.model || item.model,
      product_type: item.product_type || localItem.product_type,
      canonical_path: localItem.canonical_path || item.canonical_path,
      brand_name: item.brand_name || localItem.brand_name || null,
      image_url: item.image_url || localItem.image_url || null,
      min_price: item.min_price ?? localItem.min_price ?? null,
      variant_types:
        localVariants.length > 0
          ? localVariants
          : getSuggestionVariantTypes(item),
      key_features:
        localFeatures.length > 0 ? localFeatures : getSuggestionFeatures(item),
      searchable_text: localItem.searchable_text,
    };
  };

  const mergeSuggestions = (apiResults, localResults) => {
    const merged = new Map();

    const buildKey = (item) => {
      const baseType = normalizeText(item.type || "product");
      const rawId = item.id ?? item.product_id ?? item.productId ?? "";
      if (baseType === "product" && String(rawId).trim()) {
        return `${baseType}|${String(rawId).trim()}`;
      }
      const normalizedName = normalizeText(item.name);
      const normalizedBrand = normalizeText(item.brand_name || item.brand);
      const normalizedProductType = normalizeText(item.product_type);
      return [
        baseType,
        normalizedProductType,
        normalizedName,
        normalizedBrand,
        String(rawId).trim(),
      ].join("|");
    };

    const upsert = (item, priority) => {
      if (!item || !item.name) return;
      const key = buildKey(item);
      const existing = merged.get(key);

      if (!existing) {
        merged.set(key, { ...item, __priority: priority });
        return;
      }

      const existingPrice = existing.min_price ?? existing.minPrice ?? null;
      const incomingPrice = item.min_price ?? item.minPrice ?? null;
      const existingVariants = getSuggestionVariantTypes(existing);
      const incomingVariants = getSuggestionVariantTypes(item);
      const existingFeatures = getSuggestionFeatures(existing);
      const incomingFeatures = getSuggestionFeatures(item);

      merged.set(key, {
        ...existing,
        ...item,
        id: existing.id ?? item.id ?? null,
        product_type: existing.product_type || item.product_type,
        brand_name: existing.brand_name || item.brand_name || null,
        image_url:
          existing.image_url ||
          existing.image ||
          item.image_url ||
          item.image ||
          null,
        min_price: existingPrice ?? incomingPrice,
        variant_types:
          existingVariants.length > 0 ? existingVariants : incomingVariants,
        key_features:
          existingFeatures.length > 0 ? existingFeatures : incomingFeatures,
        __priority: Math.min(existing.__priority, priority),
      });
    };

    (apiResults || []).forEach((item) => upsert(item, 0));
    (localResults || []).forEach((item) => upsert(item, 1));

    return Array.from(merged.values()).sort(
      (a, b) => a.__priority - b.__priority,
    );
  };

  const getSuggestionMatchRank = (item, query) => {
    const normalizedQuery = normalizeText(query);
    if (!normalizedQuery) return Number.MAX_SAFE_INTEGER;

    const name = normalizeText(item?.name);
    const model = normalizeText(item?.model);
    const brand = normalizeText(item?.brand_name || item?.brand);
    const searchableText = normalizeText(
      item?.searchable_text ||
        [name, model, brand, item?.product_type].filter(Boolean).join(" "),
    );
    const tokens = normalizedQuery.split(/\s+/).filter(Boolean);

    const containsAllTokens =
      tokens.length > 0 &&
      tokens.every((token) => searchableText.includes(token));
    const nameTokens = name.split(/\s+/).filter(Boolean);
    const modelTokens = model.split(/\s+/).filter(Boolean);

    if (name === normalizedQuery) return 0;
    if (model && model === normalizedQuery) return 1;
    if (name.startsWith(normalizedQuery)) return 2;
    if (model && model.startsWith(normalizedQuery)) return 3;
    if (brand === normalizedQuery) return 4;
    if (brand.startsWith(normalizedQuery)) return 5;
    if (
      nameTokens.some((token) => token.startsWith(normalizedQuery)) ||
      modelTokens.some((token) => token.startsWith(normalizedQuery))
    ) {
      return 6;
    }
    if (containsAllTokens) return 7;
    if (name.includes(normalizedQuery)) return 8;
    if (model && model.includes(normalizedQuery)) return 9;
    if (brand.includes(normalizedQuery)) return 10;
    if (searchableText.includes(normalizedQuery)) return 11;
    return Number.MAX_SAFE_INTEGER;
  };

  const sortSuggestionsByRelevance = (items, query) =>
    [...(items || [])].sort((a, b) => {
      const priorityA = Number.isFinite(Number(a?.__priority))
        ? Number(a.__priority)
        : 99;
      const priorityB = Number.isFinite(Number(b?.__priority))
        ? Number(b.__priority)
        : 99;
      if (priorityA !== priorityB) return priorityA - priorityB;

      const rankA = getSuggestionMatchRank(a, query);
      const rankB = getSuggestionMatchRank(b, query);
      if (rankA !== rankB) return rankA - rankB;

      const nameA = normalizeText(a?.name);
      const nameB = normalizeText(b?.name);
      if (nameA.length !== nameB.length) return nameA.length - nameB.length;

      return nameA.localeCompare(nameB);
    });

  const stripSuggestionInternals = (items) =>
    (items || []).map((item) => {
      if (!item || typeof item !== "object") return item;
      const next = { ...item };
      delete next.__priority;
      delete next.searchable_text;
      return next;
    });

  // Fetch suggestions from server (debounced)
  const handleSearchInputChange = (value) => {
    // remember whether input was focused before updating state
    try {
      inputWasFocusedRef.current = !!(
        searchInputRef.current &&
        document.activeElement === searchInputRef.current
      );
    } catch {
      inputWasFocusedRef.current = false;
    }
    setSearchQuery(value);
    setSelectedSuggestionIndex(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortRef.current) {
      try {
        abortRef.current.abort();
      } catch {
        // Ignore abort races between quick keystrokes.
      }
    }

    if (!value || !value.trim()) {
      setIsSearching(false);
      setSearchSuggestions([]);
      setShowSearchSuggestions(false);
      return;
    }

    setSearchSuggestions([]);
    setShowSearchSuggestions(true);
    setIsSearching(true);

    debounceRef.current = setTimeout(async () => {
      const q = value.trim();
      const qLower = q.toLowerCase();
      const controller = new AbortController();
      abortRef.current = controller;
      setIsSearching(true);
      setShowSearchSuggestions(true);
      try {
        const url = `https://api.apisphere.in/api/search?q=${encodeURIComponent(
          q,
        )}&limit=${SEARCH_SUGGESTION_LIMIT}`;
        const r = await fetch(url, {
          signal: controller.signal,
        });
        if (!r.ok) throw new Error(`Search failed: ${r.status}`);
        const json = await r.json();
        const apiResults = (json.results || [])
          .filter((item) => isPublishedProduct(item))
          .map((it) => enrichApiSuggestion(it));

        const localMatches = localSearchSuggestions
          .filter((item) => item.searchable_text.includes(qLower))
          .sort((a, b) => {
            const rankA = getSuggestionMatchRank(a, qLower);
            const rankB = getSuggestionMatchRank(b, qLower);
            if (rankA !== rankB) return rankA - rankB;
            return normalizeText(a.name).localeCompare(normalizeText(b.name));
          })
          .slice(0, SEARCH_SUGGESTION_LIMIT);

        const merged = stripSuggestionInternals(
          sortSuggestionsByRelevance(
            mergeSuggestions(apiResults, localMatches).filter((item) =>
              isPublishedProduct(item),
            ),
            qLower,
          ).slice(0, SEARCH_SUGGESTION_LIMIT),
        );
        setSearchSuggestions(merged);
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error("Search suggestions error:", err);
        const localMatches = localSearchSuggestions
          .filter((item) => item.searchable_text.includes(qLower))
          .sort((a, b) => {
            const rankA = getSuggestionMatchRank(a, qLower);
            const rankB = getSuggestionMatchRank(b, qLower);
            if (rankA !== rankB) return rankA - rankB;
            return normalizeText(a.name).localeCompare(normalizeText(b.name));
          })
          .slice(0, SEARCH_SUGGESTION_LIMIT);
        const cleaned = stripSuggestionInternals(localMatches);
        setSearchSuggestions(cleaned);
      } finally {
        setIsSearching(false);
      }
    }, 250);
  };

  const searchForTerm = (term) => {
    handleSearchInputChange(term);
    setShowSearchSuggestions(true);
  };

  const trackSearchInterest = (payload) => {
    if (isLocalDevHost) return;
    try {
      const body = JSON.stringify({
        ...payload,
        event_id:
          payload?.event_id ||
          (typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : undefined),
      });

      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        const blob = new Blob([body], { type: "application/json" });
        const queued = navigator.sendBeacon(
          "https://api.apisphere.in/api/public/search-interest",
          blob,
        );
        if (queued) return;
      }

      fetch("https://api.apisphere.in/api/public/search-interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        credentials: "omit",
        keepalive: true,
      }).catch(() => {});
    } catch {
      // analytics should never block navigation
    }
  };

  const handleSuggestionClick = (item) => {
    if (!item) return;
    rememberSearchTerm(searchQuery || item.name || item.model);
    // prevent focus restoration while we're intentionally navigating
    suppressRestoreRef.current = true;

    // Navigate FIRST before closing anything
    if (item.type === "product") {
      const path = resolveProductSuggestionPath(item);
      const productId = item.product_id ?? item.productId ?? item.id;
      // Navigate directly to the canonical detail path so crawlers do not
      // discover duplicate query-string variants for the same product.
      navigate(path, {
        state: {
          productId: productId ?? null,
          source: "header-search",
        },
      });
      if (!isLocalDevHost) {
        Promise.resolve().then(() =>
          trackSearchInterest({
            query: String(searchQuery || item.name || item.model || "").trim(),
            product_id: productId,
            source: "suggestion",
          }),
        );
      }
    } else if (item.type === "brand") {
      navigate(
        buildBrandListingPath(
          item.name,
          item.category || item.product_type || item.productType,
        ),
      );
    } else if (/news|article|guide|story/.test(normalizeText(item.type))) {
      const articlePath = readFirstText(
        item.route_path,
        item.routePath,
        item.canonical_path,
        item.canonicalPath,
        item.path,
        item.href,
      );
      navigate(
        articlePath && articlePath.startsWith("/")
          ? toCanonicalPagePath(articlePath)
          : buildKeywordSearchPath(item.name || item),
      );
    } else {
      navigate(
        buildKeywordSearchPath(
          item.name || item,
          item.product_type || item.productType,
        ),
      );
    }
    // Cleanup state AFTER navigation is triggered (do not blur input before navigation)
    // Use microtask to let navigation begin; suppression flag prevents accidental restore
    Promise.resolve().then(() => {
      setShowSearchSuggestions(false);
      setIsSearchOpen(false);
      setIsDesktopSearchOpen(false);
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
      e.preventDefault();
      handleSearch(e);
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
      } catch {
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
        { name: "Latest Releases" },
        { name: "Top Phones" },
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
      id: "tvs",
      name: "TVs",
      icon: <FaTv />,
      // Column 1 – Categories
      subcategories: [
        { name: "All TVs" },
        { name: "Latest Releases" },
        { name: "Top TVs" },
        { name: "Compare TVs" },
      ],
      // Column 2 – By Type (mapped into popularProducts column)
      popularProducts: [
        { name: "4K Smart TVs", price: "", discount: "" },
        { name: "QLED TVs", price: "", discount: "" },
        { name: "OLED TVs", price: "", discount: "" },
        { name: "Gaming TVs", price: "", discount: "" },
      ],
      // Column 3 – By Price (mapped into featured column)
      featured: [
        { name: "Under ₹30,000", discount: "", icon: <FaTag /> },
        { name: "Under ₹50,000", discount: "", icon: <FaTag /> },
        { name: "Under ₹80,000", discount: "", icon: <FaTag /> },
        { name: "Premium TVs", discount: "", icon: <FaStar /> },
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
    } catch {
      return cat;
    }
  });

  // Desktop navigation follows a white editorial mega-header pattern.
  const desktopNavLinks = [
    { name: "Compare", link: toCanonicalPagePath("/compare") },
    { name: "Phone Finder", link: toCanonicalPagePath("/phone-finder") },
    { name: "TVs", link: toCanonicalPagePath("/tvs") },
    {
      name: "Latest Mobiles",
      link: toCanonicalPagePath("/smartphones/filter/new"),
    },
    {
      name: "Upcoming Mobiles",
      link: toCanonicalPagePath("/smartphones/upcoming"),
    },
    {
      name: "Trending Mobiles",
      link: toCanonicalPagePath("/trending/smartphones"),
    },
    { name: "News", link: toCanonicalPagePath("/news") },
  ];

  const moreMenuSections = [
    {
      title: "Company",
      icon: FaStore,
      items: [
        { label: "About", href: "/about" },
        { label: "Contact", href: "/contact" },
      ],
    },
    {
      title: "Support",
      icon: FaHandsHelping,
      items: [
        { label: "Privacy Policy", href: "/privacy-policy" },
        { label: "Terms", href: "/terms" },
      ],
    },
    {
      title: "Explore More",
      icon: FaCompass,
      items: [
        { label: "Popular Comparisons", href: "/popular-comparisons" },
        { label: "Networking", href: "/networking" },
        { label: "Smartphones", href: "/smartphones" },
      ],
    },
  ];

  const isActiveNavLink = (href) => {
    const target =
      String(href || "")
        .toLowerCase()
        .replace(/\/+$/g, "") || "/";
    if (!target) return false;
    if (target === "/") return currentPath === "/";
    if (target === "/compare")
      return currentPath === "/compare" || currentPath.startsWith("/compare/");
    if (target === "/smartphones/filter/new")
      return currentPath === "/smartphones/filter/new";
    if (target === "/trending/smartphones")
      return currentPath === "/trending/smartphones";
    if (target === "/news") return currentPath === "/news";
    if (target === "/tvs") return currentPath === "/tvs";
    return currentPath === target || currentPath.startsWith(`${target}/`);
  };
  const desktopBrandMenuItems = Array.from(
    new Set(
      [
        ...(categoriesWithBrands.find(
          (category) => String(category.id || "") === "smartphones",
        )?.topBrands || []),
        "Samsung",
        "OnePlus",
        "Vivo",
        "Realme",
        "Oppo",
        "Apple",
      ]
        .map((brand) => String(brand?.name || brand || "").trim())
        .filter(Boolean),
    ),
  )
    .slice(0, 8)
    .map((name) => ({
      label: name,
      href: buildBrandListingPath(name, "smartphones"),
    }));

  const exploreMenuSections = [
    {
      title: "Devices",
      accent: "blue",
      items: [
        { label: "All Smartphones", href: "/smartphones" },
        { label: "Latest Mobiles", href: "/smartphones/filter/new" },
        { label: "Upcoming Mobiles", href: "/smartphones/upcoming" },
        { label: "Trending Mobiles", href: "/trending/smartphones" },
        { label: "TVs", href: "/tvs" },
      ],
    },

    {
      title: "Popular Brands",
      accent: "indigo",
      items: desktopBrandMenuItems,
    },
    {
      title: "By Price",
      accent: "emerald",
      items: [
        {
          label: "Under 10000",
          href: buildSmartphoneFilterPath("under-10000"),
        },
        {
          label: "10000 to 15000",
          href: buildSmartphoneFilterPath("under-15000"),
        },
        {
          label: "15000 to 25000",
          href: buildSmartphoneFilterPath("under-25000"),
        },
        {
          label: "25000 to 40000",
          href: buildSmartphoneFilterPath("under-40000"),
        },
        {
          label: "Above 40000",
          href: buildSmartphoneFilterPath("above-40000"),
        },
      ],
    },
  ];

  const desktopNavLinkClass = (active = false) =>
    `relative inline-flex min-h-[42px] items-center justify-center gap-[0.38rem] rounded-[10px] border-0 bg-transparent px-[0.72rem] py-[0.55rem] font-[900] text-[0.8rem] tracking-[0.015em] text-[var(--hooks-text-soft)] no-underline whitespace-nowrap transition-colors duration-[170ms] after:absolute after:bottom-[0.15rem] after:left-[0.7rem] after:right-[0.7rem] after:h-0.5 after:origin-center after:scale-x-50 after:rounded-full after:bg-[var(--hooks-brand)] after:opacity-0 after:transition-all after:duration-[160ms] hover:bg-[var(--hooks-surface-soft)] hover:text-[var(--hooks-brand)] hover:after:scale-x-100 hover:after:opacity-100 [&>svg:first-child]:h-3 [&>svg:first-child]:w-3 [&>svg:first-child]:text-[var(--hooks-brand)] [&>svg:last-child]:h-[9px] [&>svg:last-child]:w-[9px] ${active ? "bg-[var(--hooks-surface-soft)] text-[var(--hooks-brand)] after:scale-x-100 after:opacity-100" : ""}`;

  const MegaPanel = ({ children }) => (
    <div className="absolute left-1/2 top-[calc(100%-1px)] z-[80] w-[min(1260px,calc(100vw-2rem))] -translate-x-1/2 pt-[0.6rem]">
      <div className="overflow-hidden  border border-[color-mix(in_srgb,var(--hooks-line)_88%,transparent)] bg-[var(--hooks-surface)] shadow-[0_30px_85px_rgba(8,23,48,0.23)]">
        {children}
      </div>
    </div>
  );

  const ExploreMegaMenu = () => (
    <MegaPanel variant="explore">
      <div className="bg-[var(--hooks-surface)]">
        <header className="relative grid min-h-[172px] grid-cols-[minmax(0,1fr)_220px_auto] items-center gap-6 overflow-hidden px-[1.7rem] py-[1.55rem] bg-[radial-gradient(circle_at_74%_8%,rgba(112,171,255,0.2),transparent_12rem),radial-gradient(circle_at_92%_90%,rgba(130,104,255,0.24),transparent_14rem),linear-gradient(125deg,#071529_0%,#0b2340_54%,#172a5a_100%)] text-white">
          <div className="relative z-[2]">
            <span className="inline-flex items-center gap-[0.45rem] text-[0.6rem] font-[900] uppercase tracking-[0.11em] text-[#9fc3ff] [&_svg]:h-3 [&_svg]:w-3">
              <FaCompass aria-hidden="true" /> Device discovery
            </span>
            <h2>
              Find the right device without digging through endless menus.
            </h2>
            <p>
              Start from what matters: a fresh launch, a clear budget, a trusted
              brand or a direct comparison.
            </p>
          </div>

          <div
            className="relative z-[2] h-[126px] w-[190px] justify-self-center"
            aria-hidden="true"
          >
            <span className="absolute block rounded-full blur-[1px] top-2 left-3 h-[82px] w-[82px] bg-[rgba(55,192,255,0.16)]" />
            <span className="absolute block rounded-full blur-[1px] right-0 bottom-0 h-[106px] w-[106px] bg-[rgba(139,98,255,0.16)]" />
            <span className="absolute block h-[104px] w-[54px] rounded-[15px] border border-[rgba(255,255,255,0.28)] bg-[linear-gradient(155deg,rgba(117,194,255,0.34),rgba(125,96,255,0.13))] shadow-[inset_0_0_0_4px_rgba(4,15,32,0.58),0_18px_36px_rgba(0,0,0,0.28)] top-[13px] left-[52px] rotate-[-12deg]" />
            <span className="absolute block h-[104px] w-[54px] rounded-[15px] border border-[rgba(255,255,255,0.28)] bg-[linear-gradient(155deg,rgba(117,194,255,0.34),rgba(125,96,255,0.13))] shadow-[inset_0_0_0_4px_rgba(4,15,32,0.58),0_18px_36px_rgba(0,0,0,0.28)] top-1.5 right-[34px] rotate-[8deg]">
              <i className="absolute left-1/2 top-2 h-[3px] w-4 -translate-x-1/2 rounded-full bg-[rgba(255,255,255,0.32)]" />
              <b className="absolute bottom-[9px] left-2 right-2 h-[30px] rounded-[9px] bg-[linear-gradient(135deg,rgba(75,225,190,0.5),rgba(55,138,255,0.3))]" />
            </span>
            <span className="absolute top-1 right-0 grid h-[37px] w-[37px] place-items-center rounded-full border border-[rgba(255,255,255,0.18)] bg-[rgba(4,16,34,0.72)] text-[0.54rem] font-[950] text-[#71ebc7]">
              5G
            </span>
          </div>

          <div className="relative z-[2] grid min-w-[170px] justify-items-stretch gap-[0.65rem]">
            <Link
              to="/smartphones"
              onClick={() => setActiveDesktopMenu("")}
              className="relative z-[2] inline-flex min-h-10 items-center justify-center gap-2 rounded-[11px] bg-white px-[0.85rem] py-[0.64rem] text-[0.68rem] font-[900] text-[#0c2a53] no-underline shadow-[0_13px_30px_rgba(0,0,0,0.18)] [&_svg]:h-2.5 [&_svg]:w-2.5"
            >
              Browse all phones <FaArrowRight aria-hidden="true" />
            </Link>
            <Link
              to="/compare"
              onClick={() => setActiveDesktopMenu("")}
              className="inline-flex min-h-0 items-center justify-center gap-2 rounded-[11px] px-[0.85rem] py-1 text-[0.68rem] font-[900] text-[#c6d9fb] no-underline [&_svg]:h-2.5 [&_svg]:w-2.5"
            >
              Open compare
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-[minmax(0,1.35fr)_minmax(250px,0.82fr)_minmax(250px,0.78fr)] gap-4 bg-[var(--hooks-canvas-strong)] p-[1.1rem]">
          <section className="min-w-0  bg-[var(--hooks-surface)] p-4">
            <div className="mb-3 flex min-h-[38px] items-start justify-between gap-4 [&_small]:block [&_small]:text-[0.54rem] [&_small]:font-[900] [&_small]:uppercase [&_small]:tracking-[0.1em] [&_small]:text-[var(--hooks-muted)] [&_h3]:mt-[0.16rem] [&_h3]:text-[0.88rem] [&_h3]:font-[920] [&_h3]:tracking-[-0.02em] [&>span]:text-[0.56rem] [&>span]:font-[850] [&>span]:text-[var(--hooks-success)]">
              <div>
                <small>Start here</small>
                <h3>Popular research paths</h3>
              </div>
              <span>Updated daily</span>
            </div>

            <div className="grid grid-cols-2 gap-[0.55rem]">
              {[
                {
                  label: "Latest mobiles",
                  copy: "Newly launched and recently listed phones",
                  href: "/smartphones/filter/new",
                  icon: FaCalendarAlt,
                  tone: "blue",
                },
                {
                  label: "Upcoming phones",
                  copy: "Expected launches, dates and early specifications",
                  href: "/smartphones/upcoming",
                  icon: FaBolt,
                  tone: "violet",
                },
                {
                  label: "Trending now",
                  copy: "Phones readers are researching today",
                  href: "/trending/smartphones",
                  icon: FaStar,
                  tone: "amber",
                },
                {
                  label: "TV buying guide",
                  copy: "Browse display types, sizes and smart platforms",
                  href: "/tvs",
                  icon: FaTv,
                  tone: "cyan",
                },
              ].map((item) => {
                const ItemIcon = item.icon;
                return (
                  <Link
                    key={item.label}
                    to={toCanonicalPagePath(item.href)}
                    onClick={() => setActiveDesktopMenu("")}
                    className={`grid min-h-[78px] min-w-0 grid-cols-[36px_minmax(0,1fr)_12px] items-center gap-[0.65rem] rounded-[14px] border border-transparent p-[0.7rem] text-[var(--hooks-text)] no-underline transition-all duration-[160ms] hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--hooks-brand)_24%,var(--hooks-line))] hover:shadow-[var(--hooks-shadow-sm)] ${item.tone === "blue" ? "bg-[color-mix(in_srgb,#2f78ff_8%,var(--hooks-surface))]" : item.tone === "violet" ? "bg-[color-mix(in_srgb,#7758ff_8%,var(--hooks-surface))]" : item.tone === "amber" ? "bg-[color-mix(in_srgb,#f1a21a_9%,var(--hooks-surface))]" : "bg-[color-mix(in_srgb,#06a9c8_8%,var(--hooks-surface))]"}`}
                  >
                    <span className="grid h-9 w-9 place-items-center rounded-[11px] bg-[var(--hooks-surface)] text-[var(--hooks-brand)] shadow-[0_8px_20px_rgba(22,44,83,0.08)] [&_svg]:h-[13px] [&_svg]:w-[13px]">
                      <ItemIcon aria-hidden="true" />
                    </span>
                    <span className="grid min-w-0 gap-[0.15rem] [&_b]:text-[0.7rem] [&_b]:font-[900] [&_b]:text-[var(--hooks-text)] [&_small]:overflow-hidden [&_small]:text-ellipsis [&_small]:text-[0.56rem] [&_small]:leading-[1.35] [&_small]:text-[var(--hooks-muted)]">
                      <b>{item.label}</b>
                      <small>{item.copy}</small>
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>

          <section className="min-w-0  bg-[var(--hooks-surface)] p-4">
            <div className="mb-3 flex min-h-[38px] items-start justify-between gap-4 [&_small]:block [&_small]:text-[0.54rem] [&_small]:font-[900] [&_small]:uppercase [&_small]:tracking-[0.1em] [&_small]:text-[var(--hooks-muted)] [&_h3]:mt-[0.16rem] [&_h3]:text-[0.88rem] [&_h3]:font-[920] [&_h3]:tracking-[-0.02em] [&>span]:text-[0.56rem] [&>span]:font-[850] [&>span]:text-[var(--hooks-success)]">
              <div>
                <small>Brand directory</small>
                <h3>Popular phone makers</h3>
              </div>
            </div>
            <nav
              className="grid grid-cols-2 gap-[0.45rem] [&_a]:grid [&_a]:min-h-10 [&_a]:grid-cols-[24px_minmax(0,1fr)_10px] [&_a]:items-center [&_a]:gap-2 [&_a]:rounded-[9px] [&_a]:px-[0.45rem] [&_a]:py-[0.42rem] [&_a]:text-[0.62rem] [&_a]:font-[800] [&_a]:text-[var(--hooks-text-soft)] [&_a]:no-underline [&_a:hover]:bg-[var(--hooks-brand-soft)] [&_a:hover]:text-[var(--hooks-brand)] [&_a>span]:text-[0.52rem] [&_a>span]:font-[900] [&_a>span]:text-[var(--hooks-muted)] [&_a>svg]:h-[9px] [&_a>svg]:w-[9px]"
              aria-label="Popular brands"
            >
              {desktopBrandMenuItems.map((item, index) => (
                <Link
                  key={item.label}
                  to={toCanonicalPagePath(item.href)}
                  onClick={() => setActiveDesktopMenu("")}
                >
                  <strong>{item.label}</strong>
                </Link>
              ))}
            </nav>
          </section>

          <aside className="min-w-0 ,transparent)] bg-[var(--hooks-surface)] p-4">
            <div className="mb-3 flex min-h-[38px] items-start justify-between gap-4 [&_small]:block [&_small]:text-[0.54rem] [&_small]:font-[900] [&_small]:uppercase [&_small]:tracking-[0.1em] [&_small]:text-[var(--hooks-muted)] [&_h3]:mt-[0.16rem] [&_h3]:text-[0.88rem] [&_h3]:font-[920] [&_h3]:tracking-[-0.02em] [&>span]:text-[0.56rem] [&>span]:font-[850] [&>span]:text-[var(--hooks-success)]">
              <div>
                <small>Budget shortcuts</small>
                <h3>Shop by price</h3>
              </div>
            </div>
            <nav
              className="grid gap-[0.4rem] [&_a]:flex [&_a]:min-h-[34px] [&_a]:items-center [&_a]:justify-between [&_a]:gap-[0.7rem] [&_a]:rounded-[9px] [&_a]:bg-[var(--hooks-surface-soft)] [&_a]:px-[0.55rem] [&_a]:py-[0.42rem] [&_a]:text-[0.62rem] [&_a]:font-[820] [&_a]:text-[var(--hooks-text-soft)] [&_a]:no-underline [&_a:hover]:bg-[var(--hooks-brand-soft)] [&_a:hover]:text-[var(--hooks-brand)] [&_a>svg]:h-[9px] [&_a>svg]:w-[9px]"
              aria-label="Shop by price"
            >
              {exploreMenuSections[2].items.map((item) => (
                <Link
                  key={item.label}
                  to={toCanonicalPagePath(item.href)}
                  onClick={() => setActiveDesktopMenu("")}
                >
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </aside>
        </div>
      </div>
    </MegaPanel>
  );

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    const query = String(searchQuery || "").trim();
    if (query) {
      rememberSearchTerm(query);
      const suggestionIndex =
        selectedSuggestionIndex >= 0 ? selectedSuggestionIndex : 0;
      const activeSuggestion =
        showSearchSuggestions && searchSuggestions.length > 0
          ? searchSuggestions[suggestionIndex] || searchSuggestions[0]
          : null;

      if (activeSuggestion) {
        handleSuggestionClick(activeSuggestion);
        return;
      }

      const resultType = searchSuggestions.find(
        (item) => normalizeText(item?.type) !== "brand",
      )?.product_type;
      navigate(buildKeywordSearchPath(query, resultType));
      setSearchQuery("");
      setShowSearchSuggestions(false);
      setSelectedSuggestionIndex(-1);
      setIsDesktopSearchOpen(false);
    }
  };

  const openSearchOverlay = () => {
    setIsDesktopSearchOpen(false);
    setShowSearchSuggestions(false);
    setSelectedSuggestionIndex(-1);
    setActiveSearchCategory("All");
    setIsSearchOpen(true);
  };

  const openDesktopSearch = () => {
    setActiveDesktopMenu("");
    setIsDesktopSearchOpen(true);
    setShowSearchSuggestions(true);
  };

  const closeDesktopSearch = () => {
    setIsDesktopSearchOpen(false);
    setSearchQuery("");
    setSearchSuggestions([]);
    setShowSearchSuggestions(false);
    setSelectedSuggestionIndex(-1);
  };

  useEffect(() => {
    if (!isSearchOpen && !isDesktopSearchOpen) return undefined;
    const handleEscape = (event) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      if (isDesktopSearchOpen) {
        closeDesktopSearch();
      } else {
        setIsSearchOpen(false);
        setSearchQuery("");
        setSearchSuggestions([]);
        setShowSearchSuggestions(false);
        setActiveSearchCategory("All");
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isSearchOpen, isDesktopSearchOpen]);

  useEffect(() => {
    const handleOpenSearch = () => openSearchOverlay();
    const handleOpenExplore = () => setIsMenuOpen(true);

    window.addEventListener(MOBILE_OPEN_SEARCH_EVENT, handleOpenSearch);
    window.addEventListener(MOBILE_OPEN_EXPLORE_EVENT, handleOpenExplore);

    return () => {
      window.removeEventListener(MOBILE_OPEN_SEARCH_EVENT, handleOpenSearch);
      window.removeEventListener(MOBILE_OPEN_EXPLORE_EVENT, handleOpenExplore);
    };
  }, []);

  // Announcement Bar Component
  const AnnouncementBar = () => (
    <div className="bg-blue-500 text-white py-2 overflow-hidden">
      <div className="container max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 overflow-hidden">
            <div className="animate-marquee whitespace-nowrap flex items-center space-x-8">
              {announcements.map((announcement, index) => (
                <div key={index} className="inline-flex items-center space-x-3">
                  <span>{announcement.icon}</span>
                  <span className="text-[13px] font-medium">
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
    <div className="absolute top-full left-0 w-[900px]  text-gray-800 z-50  animate-in fade-in slide-in-from-top-2 duration-200">
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
                const categoryId = String(category.id || "").toLowerCase();
                const isSmartphonesCategory =
                  categoryId === "smartphones" || categoryId === "mobiles";
                let href = toCanonicalPagePath(`/${category.id}`);
                if (name.includes("new")) {
                  href = isSmartphonesCategory
                    ? toCanonicalPagePath("/smartphones/filter/new")
                    : toCanonicalPagePath(`/${category.id}?filter=new`);
                } else if (name.includes("trending")) {
                  href = isSmartphonesCategory
                    ? toCanonicalPagePath("/trending/smartphones")
                    : toCanonicalPagePath(`/${category.id}?filter=trending`);
                } else if (name.includes("compare")) {
                  href = toCanonicalPagePath("/compare");
                }

                return (
                  <Link
                    key={idx}
                    to={href}
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
            <h4 className="font-bold text-base mb-5 text-slate-900 border-b-2 border-blue-600 pb-3">
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
                  className="block p-4 rounded-lg border border-blue-200 hover:border-blue-400 bg-gradient-to-br from-blue-600 to-cyan-500 group transition-all duration-200 hover:shadow-md"
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
                const logo = b && (b.logo || b.image_url || null);

                // If the item looks like a 'View All' label, route to the
                // current category listing instead of a missing brands page.
                if (
                  typeof name === "string" &&
                  name.toLowerCase().includes("view all")
                ) {
                  return (
                    <Link
                      key={id}
                      to={getCatalogBasePath(category.id || category.name)}
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
                    to={buildBrandListingPath(
                      name,
                      category.id || category.name,
                    )}
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
              className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg hover:from-blue-700 hover:to-cyan-600 transition-all duration-200 font-semibold text-sm shadow-md hover:shadow-lg"
            >
              View All in {category.name}
              <FaChevronRight className="ml-2 w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );

  // Skeleton Loader Component
  const SkeletonSuggestion = ({ variant = "desktop" }) => {
    const isMobileVariant = variant === "mobile";

    return (
      <div
        className={`animate-pulse ${
          isMobileVariant
            ? "group rounded-xl border border-slate-200 bg-slate-50 px-4 py-4"
            : "w-full flex items-center gap-3 border-b border-slate-200 px-4 py-4 last:border-b-0"
        }`}
      >
        <div className="h-12 w-12 shrink-0 rounded-md bg-slate-200 ring-1 ring-slate-200" />
        <div className="min-w-0 flex-1">
          <div className="h-4 w-3/5 rounded-full bg-slate-200/90" />
        </div>
        {!isMobileVariant ? (
          <div className="h-4 w-4 shrink-0 rounded-full bg-slate-200/80" />
        ) : null}
      </div>
    );
  };

  const SuggestionEmptyState = ({ query, variant = "desktop" }) => (
    <div
      className={`flex flex-col items-center justify-center text-center ${
        variant === "mobile" ? "px-6 py-10" : "px-4 py-8"
      }`}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-[#345ce3]">
        <FaSearch className="h-5 w-5" />
      </div>
      <p className="mt-4 text-sm font-semibold text-slate-900">
        No matches found
      </p>
      <p className="mt-1 text-xs text-slate-500">
        Try a brand, model, or feature.
      </p>
      {query ? (
        <p className="mt-2 text-[11px] font-medium text-slate-400">
          Searched for "{query}"
        </p>
      ) : null}
    </div>
  );

  const SearchTermSection = ({ title, terms, icon: SectionIcon, onSelect }) => (
    <section className="min-w-0">
      <h3 className="mb-1 flex items-center gap-2 px-3 pt-3 text-sm font-bold text-slate-900">
        <SectionIcon className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
        {title}
      </h3>
      <div className="px-2 pb-2">
        {terms.map((term) => (
          <button
            key={`${title}-${term}`}
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onSelect(term)}
            className="flex min-h-10 w-full items-center gap-3 rounded-lg px-2.5 text-left text-[13px] font-medium text-slate-700 transition-colors hover:bg-blue-50 hover:text-blue-700 focus:bg-blue-50 focus:outline-none"
          >
            <FaSearch className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate">{term}</span>
            <FaArrowRight className="h-3 w-3 shrink-0 text-slate-400" aria-hidden="true" />
          </button>
        ))}
      </div>
    </section>
  );

  const SearchStartingPoints = () => (
    <div className="grid divide-y divide-slate-100 md:grid-cols-2 md:divide-x md:divide-y-0">
      <SearchTermSection
        title="Recent searches"
        terms={recentSearches.slice(0, 5)}
        icon={FaHistory}
        onSelect={searchForTerm}
      />
      <SearchTermSection
        title="Trending searches"
        terms={TRENDING_SEARCHES}
        icon={FaFire}
        onSelect={searchForTerm}
      />
    </div>
  );

  const HighlightText = ({ text }) => text || "";

  const getSuggestionBrandAndModel = (suggestion) => {
    const rawName = readFirstText(
      suggestion?.name,
      suggestion?.model,
      suggestion?.product_name,
      suggestion?.productName,
      suggestion?.model_name,
      suggestion?.modelName,
    );
    const explicitBrand = readFirstText(
      suggestion?.brand,
      suggestion?.brand_name,
      suggestion?.brandName,
      suggestion?.manufacturer,
    );
    const knownBrands = [
      ...(Array.isArray(brands)
        ? brands.map((item) =>
            typeof item === "string"
              ? item
              : readFirstText(item?.name, item?.brand, item?.brand_name),
          )
        : []),
      "Samsung",
      "Apple",
      "Xiaomi",
      "Redmi",
      "POCO",
      "Motorola",
      "OnePlus",
      "vivo",
      "OPPO",
      "realme",
      "Nothing",
      "Google",
      "ASUS",
      "Nokia",
      "Tecno",
      "Infinix",
      "iQOO",
    ]
      .filter(Boolean)
      .sort((a, b) => String(b).length - String(a).length);
    const brand =
      explicitBrand ||
      knownBrands.find((candidate) =>
        String(rawName || "")
          .toLowerCase()
          .startsWith(`${String(candidate).toLowerCase()} `),
      ) ||
      "";

    if (brand && rawName) {
      const normalizedBrand = String(brand).trim();
      const normalizedName = String(rawName).trim();
      if (
        normalizedName.toLowerCase().startsWith(normalizedBrand.toLowerCase())
      ) {
        const model = normalizedName.slice(normalizedBrand.length).trim();
        return {
          brand: normalizedBrand,
          model: model || normalizedName,
        };
      }
    }

    return {
      brand: brand || "",
      model: rawName || "",
    };
  };

  const getSuggestionTypeLabel = (suggestion) => {
    const typeText = readFirstText(
      suggestion?.type,
      suggestion?.product_type,
      suggestion?.productType,
      suggestion?.category,
    );
    if (!typeText) return "Product";
    const normalized = String(typeText).trim();
    if (normalized.toLowerCase() === "smartphone") return "Smartphone";
    if (normalized.toLowerCase() === "tv") return "TV";
    if (normalized.toLowerCase() === "brand") return "Brand";
    return normalized;
  };

  const SuggestionRow = ({
    suggestion,
    query,
    selected = false,
    variant = "desktop",
    onActivate,
    onMouseEnter,
  }) => {
    if (!suggestion) return null;

    const isMobileVariant = variant === "mobile";
    const TypeIcon = getSuggestionTypeIcon(suggestion);
    const imageUrl = getSuggestionImage(suggestion);
    const { brand, model } = getSuggestionBrandAndModel(suggestion);
    const typeLabel = getSuggestionTypeLabel(suggestion);
    const priceLabel = getSuggestionPriceLabel(suggestion);
    const modelText =
      model || brand || readFirstText(suggestion?.name, suggestion?.model);

    const buttonClasses = isMobileVariant
      ? `group flex min-h-[60px] w-full items-center gap-3 px-2 py-2.5 text-left transition-colors duration-200 border-b border-slate-200 bg-transparent last:border-b-0 ${
          selected ? "bg-blue-50/40" : "hover:bg-slate-50 focus:bg-blue-50/40"
        } focus:outline-none`
      : `group relative flex min-h-[60px] w-full items-center gap-3 px-4 py-2.5 text-left transition-colors duration-200 border-b border-slate-200 last:border-b-0 ${
          selected
            ? "border-blue-500 bg-blue-50/50"
            : "bg-white hover:border-blue-300 hover:bg-blue-50/20 active:bg-blue-50/30"
        }`;

    return (
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onActivate?.(suggestion);
        }}
        onMouseEnter={onMouseEnter}
        aria-selected={selected}
        className={buttonClasses}
      >
        {!isMobileVariant ? (
          <span
            className={`absolute inset-y-0 left-0 w-1 rounded-r-md bg-blue-500 transition-opacity duration-200 ${
              selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            }`}
          />
        ) : null}

        <div
          className={`relative grid shrink-0 place-items-center overflow-hidden bg-slate-50 ${
            isMobileVariant ? "h-10 w-10 rounded-lg" : "h-10 w-10 rounded-lg"
          }`}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={suggestion.name}
              className="h-full w-full object-contain p-1.5"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <TypeIcon className="h-5 w-5 text-[#345ce3]" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          {brand ? (
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-blue-600">
              <HighlightText text={brand} query={query} />
            </p>
          ) : null}
          <p
            className={`text-[15px] font-bold leading-5 text-slate-900 ${
              isMobileVariant ? "truncate" : "truncate"
            }`}
          >
            <HighlightText text={modelText} query={query} />
          </p>
        </div>
        {priceLabel ? (
          <span className="max-w-[96px] shrink-0 truncate whitespace-nowrap text-[11px] font-semibold text-blue-600 sm:text-xs">
            {priceLabel}
          </span>
        ) : null}
        <FaChevronRight
          className="h-3 w-3 shrink-0 text-slate-400"
          aria-hidden="true"
        />
      </button>
    );
  };

  const getBrandAliases = (name) => {
    const normalizedName = normalizeText(name);
    if (normalizedName === "apple") return ["iphone", "ip"];
    if (normalizedName === "samsung") return ["galaxy"];
    if (normalizedName === "xiaomi") return ["mi", "redmi", "poco"];
    if (normalizedName === "oneplus") return ["one plus"];
    return [];
  };

  const brandNameMatchesQuery = (name, query) => {
    const queryKey = normalizeText(query).replace(/[^a-z0-9]/g, "");
    if (queryKey.length < 2) return false;
    const brandKey = normalizeText(name).replace(/[^a-z0-9]/g, "");
    return (
      brandKey.includes(queryKey) ||
      queryKey.startsWith(brandKey) ||
      getBrandAliases(name).some((alias) => {
        const aliasKey = normalizeText(alias).replace(/[^a-z0-9]/g, "");
        return aliasKey.startsWith(queryKey) || queryKey.startsWith(aliasKey);
      })
    );
  };

  const getSearchBrandSuggestions = (query, items = searchSuggestions) => {
    const apiBrands = items.filter(
      (item) => normalizeText(item?.type) === "brand",
    );
    const matchedProductBrands = items
      .filter((item) => normalizeText(item?.type) !== "brand")
      .map((item) => getSuggestionBrandAndModel(item).brand)
      .filter(Boolean);
    const catalogNames = desktopBrandMenuItems.map((item) => item.label);
    const candidateNames = [
      ...apiBrands.map((item) => readFirstText(item.name, item.brand_name)),
      ...matchedProductBrands,
      ...catalogNames.filter(
        (name) => !String(query || "").trim() || brandNameMatchesQuery(name, query),
      ),
      ...catalogNames,
    ].filter(Boolean);
    const uniqueNames = Array.from(
      new Map(
        candidateNames.map((name) => [normalizeText(name), name]),
      ).values(),
    );
    const brandCatalog = Array.isArray(brands) ? brands : [];

    return uniqueNames.slice(0, 6).map((name) => {
      const apiResult = apiBrands.find(
        (item) =>
          normalizeText(item.name || item.brand_name) === normalizeText(name),
      );
      const brandRecord = brandCatalog.find(
        (item) => normalizeText(item?.name) === normalizeText(name),
      );
      const logo = readFirstText(
        brandRecord?.logo_url,
        brandRecord?.logo,
        brandRecord?.image_url,
        brandRecord?.image,
        apiResult?.logo_url,
        apiResult?.logo,
        apiResult?.image_url,
      );
      return {
        ...(apiResult || {}),
        id: apiResult?.id || `header-brand-${normalizeText(name)}`,
        name,
        brand: name,
        brand_name: name,
        type: "brand",
        product_type: "smartphones",
        image: logo || apiResult?.image || null,
      };
    });
  };

  const getContextualSearchTerms = (query, items = searchSuggestions) => {
    const cleanQuery = String(query || "").trim().replace(/\s+/g, " ");
    if (!cleanQuery) return TRENDING_SEARCHES.slice(0, 5);

    const products = items.filter(
      (item) => normalizeText(item?.type) !== "brand",
    );
    const matchingBrand = desktopBrandMenuItems.find((item) =>
      brandNameMatchesQuery(item.label, cleanQuery),
    );

    if (matchingBrand?.label.toLowerCase() === "apple") {
      const modelTerms = products
        .map((item) => getSuggestionBrandAndModel(item).model)
        .filter((term) => term && normalizeText(term) !== "apple");
      if (modelTerms.length) {
        return [
          "Latest iPhone models",
          "Apple phones",
          ...Array.from(new Set(modelTerms)).slice(1, 4),
        ].slice(0, 5);
      }
    }

    if (matchingBrand) {
      const brandName = matchingBrand.label;
      const series = products
        .map((item) => getSuggestionBrandAndModel(item).model)
        .map((model) => model.match(/\b([A-Z])\s?\d{2,}\b/i)?.[1])
        .find(Boolean);
      return [
        `${brandName} phones`,
        `${brandName} upcoming phones`,
        `${brandName} under ₹20,000`,
        `${brandName} 5G phones`,
        series ? `${brandName} ${series.toUpperCase()} series` : `${brandName} latest phones`,
      ];
    }

    const productTerms = products
      .map((item) => getSuggestionBrandAndModel(item).model)
      .filter(Boolean);
    if (productTerms.length) return Array.from(new Set(productTerms)).slice(0, 5);

    const base = cleanQuery.replace(/\s+(phones?|mobiles?)$/i, "") || cleanQuery;
    return [
      `${base} phones`,
      `${base} upcoming phones`,
      `${base} under ₹20,000`,
      `${base} 5G phones`,
      `${base} latest models`,
    ];
  };

  const getResultsForSearchCategory = (category, query = searchQuery) => {
    if (category === "Brands") return getSearchBrandSuggestions(query);
    if (category === "All") {
      return searchSuggestions.filter(
        (item) => normalizeText(item?.type) !== "brand",
      );
    }

    return searchSuggestions.filter((item) => {
      const itemType = normalizeText(item?.type);
      const productType = normalizeText(
        item?.product_type || item?.productType || item?.category,
      );
      if (category === "News") {
        return /news|article|guide|story/.test(`${itemType} ${productType}`);
      }
      if (category === "TVs") {
        return /tv|television/.test(`${itemType} ${productType}`);
      }
      if (category === "Smartphones") {
        return (
          /phone|smartphone|mobile/.test(`${itemType} ${productType}`) ||
          (!productType && itemType === "product")
        );
      }
      return true;
    });
  };

  const SearchCategoryTabs = () => (
    <nav
      aria-label="Search categories"
      className="flex min-h-[48px] shrink-0 gap-4 overflow-x-auto border-b border-slate-200 px-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:justify-center sm:gap-8"
    >
      {SEARCH_RESULT_CATEGORIES.map((category) => (
        <button
          key={category}
          type="button"
          onClick={() => setActiveSearchCategory(category)}
          aria-current={activeSearchCategory === category ? "page" : undefined}
          className={`relative inline-flex shrink-0 items-center px-1 text-[13px] font-semibold transition-colors ${
            activeSearchCategory === category
              ? "text-blue-600"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          {category}
          {activeSearchCategory === category ? (
            <span className="absolute inset-x-0 bottom-0 h-[2px] rounded-full bg-blue-600" />
          ) : null}
        </button>
      ))}
    </nav>
  );

  const SearchBrandRow = ({ brand }) => {
    const imageUrl = getSuggestionImage(brand);
    return (
      <button
        type="button"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => handleSuggestionClick(brand)}
        className="flex min-h-12 w-full items-center gap-3 rounded-lg px-2.5 text-left text-sm font-medium text-slate-800 transition-colors hover:bg-blue-50"
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-blue-50 text-[11px] font-extrabold text-blue-700">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt=""
              className="h-full w-full object-contain p-1"
              loading="lazy"
            />
          ) : (
            String(brand.name || "").slice(0, 2).toUpperCase()
          )}
        </span>
        <span className="min-w-0 flex-1 truncate">{brand.name}</span>
        <FaChevronRight className="h-3 w-3 shrink-0 text-slate-400" aria-hidden="true" />
      </button>
    );
  };

  const DesktopSearchSuggestionPanel = () => {
    if (!isDesktopSearchOpen) return null;

    const query = String(searchQuery || "").trim();
    const topResults = searchSuggestions.filter(
      (item) => normalizeText(item?.type) !== "brand",
    );
    const refinementTerms = getContextualSearchTerms(query, searchSuggestions);
    const brandSuggestions = getSearchBrandSuggestions(query, searchSuggestions);

    return (
      <div className="absolute right-0 top-full z-[80] mt-2 w-[min(680px,calc(100vw-2rem))] overflow-hidden rounded-[18px] border border-[#e2eaf5] bg-white shadow-[0_12px_36px_rgba(15,35,75,0.12)] mx-search-panel">
        <div className="max-h-[min(640px,calc(100dvh-7rem))] overflow-y-auto overscroll-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {!query ? (
            <SearchStartingPoints />
          ) : (
            <div className="grid divide-y divide-slate-100 lg:grid-cols-[minmax(210px,0.82fr)_minmax(0,1.18fr)] lg:divide-x lg:divide-y-0">
              <aside className="min-w-0 bg-slate-50/60">
                <SearchTermSection
                  title="Suggestions"
                  terms={refinementTerms}
                  icon={FaSearch}
                  onSelect={searchForTerm}
                />
                {brandSuggestions.length ? (
                  <section className="border-t border-slate-100 px-2 pb-2">
                    <h3 className="px-3 pt-3 text-sm font-bold text-slate-900">
                      Brands
                    </h3>
                    {brandSuggestions.slice(0, 5).map((brand) => (
                      <SearchBrandRow
                        key={`${brand.id || brand.name}-desktop-brand`}
                        brand={brand}
                      />
                    ))}
                  </section>
                ) : null}
              </aside>
              <section className="min-w-0">
                <h3 className="border-b border-slate-100 px-4 py-3 text-sm font-bold text-slate-900">
                  Top results
                </h3>
                {topResults.length ? (
                  topResults.slice(0, SEARCH_SUGGESTION_LIMIT).map((suggestion, index) => (
                    <SuggestionRow
                      key={`${suggestion.id || suggestion.name || index}-desktop-result`}
                      suggestion={suggestion}
                      query={query}
                      selected={selectedSuggestionIndex === index}
                      variant="desktop"
                      onActivate={handleSuggestionClick}
                      onMouseEnter={() => setSelectedSuggestionIndex(index)}
                    />
                  ))
                ) : isSearching ? (
                  [...Array(3)].map((_, index) => (
                    <SkeletonSuggestion key={`desktop-result-skeleton-${index}`} />
                  ))
                ) : brandSuggestions.length ? (
                  <p className="px-4 py-5 text-sm text-slate-500">
                    Matching brands are listed beside these suggestions.
                  </p>
                ) : (
                  <SuggestionEmptyState query={query} variant="desktop" />
                )}
                {!isSearching ? (
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      rememberSearchTerm(query);
                      const resultType = searchSuggestions.find(
                        (item) => normalizeText(item?.type) !== "brand",
                      )?.product_type;
                      navigate(buildKeywordSearchPath(query, resultType));
                      closeDesktopSearch();
                    }}
                    className="flex min-h-11 w-full items-center gap-2 border-t border-slate-100 px-4 text-left text-sm font-semibold text-blue-600 hover:bg-blue-50"
                  >
                    View all results for “{query}”
                    <FaArrowRight className="h-3 w-3" aria-hidden="true" />
                  </button>
                ) : null}
              </section>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Flipkart-Style Search Modal - Mobile Optimized
  const SearchModal = () => {
    const query = String(searchQuery || "").trim();
    const categoryResults = getResultsForSearchCategory(activeSearchCategory, query);
    const relatedSearches = getContextualSearchTerms(query, searchSuggestions);
    const brandResults = getSearchBrandSuggestions(query, searchSuggestions);
    const startSearchesByCategory = {
      Smartphones: ["Latest Samsung phones", "Best 5G phones", "Phones under ₹20,000"],
      News: ["Latest smartphone news", "Upcoming phone launches", "New phone reviews"],
      TVs: ["Best smart TVs", "4K TVs", "Samsung TVs"],
    };
    const closeSearchModal = () => {
      setIsSearchOpen(false);
      setSearchQuery("");
      setSearchSuggestions([]);
      setShowSearchSuggestions(false);
      setActiveSearchCategory("All");
    };

    return (
      <>
        {isSearchOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-[90] bg-black/40"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  closeSearchModal();
                }
              }}
            />

            {/* Search Modal - Full screen on mobile using 100dvh */}
            <div
              className="fixed inset-0 z-[100] flex h-[100dvh] flex-col overflow-hidden bg-white lg:inset-auto lg:left-1/2 lg:top-16 lg:h-[calc(100dvh-5rem)] lg:max-h-[calc(100dvh-5rem)] lg:w-[min(720px,calc(100vw-2rem))] lg:-translate-x-1/2 lg:rounded-[18px] lg:border lg:border-[#e2eaf5] lg:shadow-[0_12px_36px_rgba(15,35,75,0.12)] mx-search-modal"
              role="dialog"
              aria-modal="true"
              aria-label="Search MobilesX"
              style={{
                WebkitOverflowScrolling: "touch",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Search Input Section - Sticky */}
              <div className="sticky top-0 z-10 w-full flex-shrink-0 border-b border-slate-200 bg-white px-2 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-4 sm:py-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  {/* Back Button */}
                  <button
                    onClick={closeSearchModal}
                    className="p-1.5 sm:p-2 hover:bg-slate-50 rounded-lg transition-colors flex-shrink-0 text-slate-700"
                    aria-label="Go back"
                  >
                    <FaArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>

                  {/* Search Input */}
                  <div className="relative min-w-0 flex-1">
                    <input
                      ref={searchInputRef}
                      autoFocus
                      type="text"
                      placeholder="Search phones, brands, specifications..."
                      value={searchQuery}
                      onChange={(e) => handleSearchInputChange(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleSearch(e);
                          return;
                        }
                        handleSearchKeyDown(e);
                      }}
                      className="h-11 w-full rounded-xl border border-blue-600 bg-white pl-10 pr-11 text-[14px] font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-600 focus:ring-0 focus:shadow-none"
                    />
                    <FaSearch
                      className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-blue-600"
                      aria-hidden="true"
                    />
                    {query ? (
                      <button
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => handleSearchInputChange("")}
                        aria-label="Clear search"
                        className="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"
                      >
                        <FaTimes className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>

              <SearchCategoryTabs />

              {/* Scrollable Content Area */}
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)]">
                <div className="min-h-full px-2.5 py-3 sm:px-6 sm:py-5">
                  {query ? (
                    <>
                      {activeSearchCategory === "All" ? (
                        <SearchTermSection
                          title="Suggestions"
                          terms={relatedSearches}
                          icon={FaSearch}
                          onSelect={searchForTerm}
                        />
                      ) : null}

                      <h2 className="mb-1 mt-3 border-t border-slate-100 px-3 pt-4 text-sm font-bold text-slate-900">
                        {activeSearchCategory === "All"
                          ? "Products"
                          : activeSearchCategory}
                      </h2>

                      {activeSearchCategory === "Brands" ? (
                        brandResults.length ? (
                          <div className="divide-y divide-slate-100 px-2">
                            {brandResults.map((brand) => (
                              <SearchBrandRow
                                key={`${brand.id || brand.name}-mobile-brand`}
                                brand={brand}
                              />
                            ))}
                          </div>
                        ) : isSearching ? (
                          [...Array(3)].map((_, index) => (
                            <SkeletonSuggestion
                              key={`mobile-brand-skeleton-${index}`}
                              variant="mobile"
                            />
                          ))
                        ) : (
                          <SuggestionEmptyState query={query} variant="mobile" />
                        )
                      ) : categoryResults.length ? (
                        <div className="divide-y divide-slate-100 px-2">
                          {categoryResults
                            .slice(0, SEARCH_SUGGESTION_LIMIT)
                            .map((suggestion, index) => (
                              <SuggestionRow
                                key={`${suggestion.id || suggestion.name || index}-mobile`}
                                suggestion={suggestion}
                                query={query}
                                selected={selectedSuggestionIndex === index}
                                variant="mobile"
                                onActivate={handleSuggestionClick}
                                onMouseEnter={() =>
                                  setSelectedSuggestionIndex(index)
                                }
                              />
                            ))}
                        </div>
                      ) : isSearching ? (
                        [...Array(3)].map((_, index) => (
                          <SkeletonSuggestion
                            key={`mobile-result-skeleton-${index}`}
                            variant="mobile"
                          />
                        ))
                      ) : (
                        <SuggestionEmptyState query={query} variant="mobile" />
                      )}

                      {!isSearching && activeSearchCategory === "All" ? (
                        <button
                          type="button"
                          onClick={() => {
                            rememberSearchTerm(query);
                            const resultType = searchSuggestions.find(
                              (item) => normalizeText(item?.type) !== "brand",
                            )?.product_type;
                            navigate(buildKeywordSearchPath(query, resultType));
                            closeSearchModal();
                          }}
                          className="mt-2 flex min-h-12 w-full items-center gap-2 border-t border-slate-200 px-3 text-left text-sm font-semibold text-blue-600"
                        >
                          View all results for “{query}”
                          <FaArrowRight className="h-3 w-3" aria-hidden="true" />
                        </button>
                      ) : null}

                      {!isSearching &&
                      activeSearchCategory !== "All" &&
                      categoryResults.length <= 2 ? (
                        <div className="mt-3 border-t border-slate-200 pt-1">
                          <SearchTermSection
                            title="Related searches"
                            terms={relatedSearches.slice(0, 4)}
                            icon={FaFire}
                            onSelect={searchForTerm}
                          />
                        </div>
                      ) : null}
                    </>
                  ) : activeSearchCategory === "All" ? (
                    <SearchStartingPoints />
                  ) : activeSearchCategory === "Brands" ? (
                    <>
                      <h2 className="mb-2 px-3 text-sm font-bold text-slate-900">
                        Popular brands
                      </h2>
                      <div className="divide-y divide-slate-100 px-2">
                        {brandResults.map((brand) => (
                          <SearchBrandRow
                            key={`${brand.id || brand.name}-mobile-popular-brand`}
                            brand={brand}
                          />
                        ))}
                      </div>
                    </>
                  ) : (
                    <SearchTermSection
                      title={`Popular ${activeSearchCategory.toLowerCase()} searches`}
                      terms={startSearchesByCategory[activeSearchCategory] || TRENDING_SEARCHES}
                      icon={activeSearchCategory === "News" ? FaNewspaper : FaFire}
                      onSelect={searchForTerm}
                    />
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </>
    );
  };

  const mobileQuickLinks = [
    { label: "Latest", href: "/smartphones/filter/new", icon: FaCalendarAlt },
    { label: "Upcoming", href: "/smartphones/upcoming", icon: FaBolt },
    { label: "Finder", href: "/phone-finder", icon: FaMobileAlt },
    { label: "Trending", href: "/trending/smartphones", icon: FaStar },
    { label: "TVs", href: "/tvs", icon: FaTv },
  ];

  // Responsive application header: dedicated mobile/tablet and desktop systems.
  const MainHeader = () => (
    <>
      <div
        ref={mobileHeaderRef}
        className="text-[var(--hooks-text)] border-0 bg-white shadow-none lg:hidden"
      >
        <div className="grid min-h-[58px] grid-cols-[minmax(0,1fr)_auto] items-center gap-[0.7rem] px-[0.8rem] pb-2 pt-[max(0.55rem,env(safe-area-inset-top))]">
          <Link
            to="/"
            className="inline-grid min-w-0 w-max gap-[0.05rem] text-[var(--hooks-text)] no-underline [&_small]:overflow-hidden [&_small]:text-ellipsis [&_small]:whitespace-nowrap [&_small]:text-[0.55rem] [&_small]:font-[800] [&_small]:uppercase [&_small]:tracking-[0.12em] [&_small]:text-[var(--hooks-muted)]"
            aria-label="MobilesX home"
          >
            <BrandIdentity variant="mobile" />
            <small className="hidden md:block">Device intelligence</small>{" "}
          </Link>

          <div className="flex items-center gap-[0.45rem]">
            <button
              type="button"
                  onClick={openSearchOverlay}
              className="inline-flex h-10 w-10 items-center justify-center rounded-[14px] text-[var(--hooks-text-soft)] transition-all duration-[170ms] hover:-translate-y-px hover:border-[color-mix(in_srgb,var(--hooks-brand)_40%,var(--hooks-line))] hover:text-[var(--hooks-brand)]"
              aria-label="Search MobilesX"
            >
              <FaSearch aria-hidden="true" />
            </button>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-[14px] border-0 text-[var(--hooks-text-soft)] shadow-[inset_0_1px_rgba(255,255,255,0.62)] transition-all duration-[170ms] hover:-translate-y-px hover:text-[var(--hooks-brand)]"
              onClick={() => setIsMenuOpen(true)}
              aria-label="Open navigation"
              aria-expanded={isMenuOpen}
            >
              <FaBars aria-hidden="true" />
            </button>
          </div>
        </div>

        <nav
          className="flex min-w-0 gap-[0.42rem] overflow-x-auto px-[0.8rem] pb-0 [scrollbar-width:none] snap-x snap-proximity [&::-webkit-scrollbar]:hidden"
          aria-label="Quick navigation"
        >
          <button
            type="button"
            className="inline-flex min-h-[34px] shrink-0 snap-start items-center gap-[0.4rem] rounded-full border-0 bg-[var(--hooks-surface)] px-[0.72rem] py-[0.42rem] text-[0.69rem] font-[850] text-[var(--hooks-text-soft)] no-underline transition-colors duration-[170ms] hover:bg-[var(--hooks-brand-soft)] hover:text-[var(--hooks-brand)] [&_svg]:h-[11px] [&_svg]:w-[11px] is-explore"
            onClick={() => setIsMenuOpen(true)}
          >
            <span>Explore</span>
          </button>
          {mobileQuickLinks.map((item) => {
            const ItemIcon = item.icon;
            return (
              <Link
                key={item.href}
                to={toCanonicalPagePath(item.href)}
                className={`inline-flex min-h-[34px] shrink-0 snap-start items-center gap-[0.4rem] rounded-full border-0 bg-[var(--hooks-surface)] px-[0.72rem] py-[0.42rem] text-[0.69rem] font-[850] text-[var(--hooks-text-soft)] no-underline transition-colors duration-[170ms] hover:bg-[var(--hooks-brand-soft)] hover:text-[var(--hooks-brand)] [&_svg]:h-[11px] [&_svg]:w-[11px] ${isActiveNavLink(item.href) ? "bg-[var(--hooks-brand-soft)] text-[var(--hooks-brand)]" : ""}`}
              >
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div
        className="relative border-0 bg-white text-[var(--hooks-text)] shadow-none hidden lg:block"
        onMouseLeave={() => setActiveDesktopMenu("")}
      >
        <div className="mx-auto grid min-h-[70px] w-[min(calc(100%-2rem),92rem)] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-[clamp(1rem,2vw,2.2rem)]">
          <Link
            to="/"
            className="flex items-center text-inherit no-underline"
            aria-label="MobilesX home"
          >
            <BrandIdentity variant="desktop" />
          </Link>
          <nav
            className="flex min-w-0 items-center justify-center gap-[0.08rem] border-0  p-0"
            aria-label="Primary navigation"
          >
            <button
              type="button"
              className={desktopNavLinkClass(
                activeDesktopMenu === "explore" ||
                  currentPath.startsWith("/smartphones"),
              )}
              onMouseEnter={() => setActiveDesktopMenu("explore")}
              onFocus={() => setActiveDesktopMenu("explore")}
              onClick={() =>
                setActiveDesktopMenu((menu) =>
                  menu === "explore" ? "" : "explore",
                )
              }
              aria-expanded={activeDesktopMenu === "explore"}
            >
              <span>Explore</span>
              <FaChevronDown aria-hidden="true" />
            </button>

            {desktopNavLinks.map((link) => (
              <Link
                key={`${link.name}-${link.link}`}
                to={link.link}
                data-nav-name={link.name}
                className={desktopNavLinkClass(isActiveNavLink(link.link))}
                onMouseEnter={() => setActiveDesktopMenu("")}
                onFocus={() => setActiveDesktopMenu("")}
              >
                <span>{link.name}</span>
              </Link>
            ))}
          </nav>

          <div
            className="flex items-center gap-[0.55rem]"
            onMouseEnter={() => setActiveDesktopMenu("")}
          >
            {isDesktopSearchOpen ? (
              <form
                ref={searchRef}
                onSubmit={handleSearch}
                className="relative grid w-[min(36vw,430px)] min-w-[300px] grid-cols-[42px_minmax(0,1fr)_42px] items-center rounded-[15px] border border-slate-200 bg-white"
              >
                <span
                  className="inline-flex h-[42px] w-[42px] items-center justify-center border-0 bg-transparent text-[var(--hooks-text-soft)] transition-all hover:-translate-y-px hover:text-[var(--hooks-brand)]"
                  aria-hidden="true"
                >
                  <FaSearch aria-hidden="true" />
                </span>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(event) =>
                    handleSearchInputChange(event.target.value)
                  }
                  onFocus={() => {
                    if (searchQuery.trim()) setShowSearchSuggestions(true);
                  }}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Search phones, brands, specifications..."
                  aria-label="Search MobilesX"
                  className="w-full border-0 bg-transparent px-2 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                />
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    if (searchQuery.trim()) {
                      handleSearchInputChange("");
                      searchInputRef.current?.focus();
                    } else {
                      closeDesktopSearch();
                    }
                  }}
                  className="inline-flex h-[42px] w-[42px] items-center justify-center border-0 bg-transparent text-[var(--hooks-text-soft)] transition-all hover:-translate-y-px hover:text-[var(--hooks-brand)]"
                  aria-label={searchQuery.trim() ? "Clear search" : "Close search"}
                >
                  <FaTimes aria-hidden="true" />
                </button>
                <DesktopSearchSuggestionPanel />
              </form>
            ) : (
              <button
                type="button"
                onClick={openDesktopSearch}
                className="inline-flex min-h-[42px] items-center justify-center gap-[0.48rem] rounded-[14px] border border-[var(--hooks-line)] bg-[var(--hooks-surface-soft)] px-[0.9rem] text-[0.72rem] font-[850] text-[var(--hooks-text-soft)] transition-all duration-[170ms] hover:-translate-y-px hover:text-[var(--hooks-brand)]"
                aria-label="Open search"
              >
                <FaSearch aria-hidden="true" />
                <span>Search</span>
              </button>
            )}
          </div>
        </div>

        {activeDesktopMenu === "explore" ? <ExploreMegaMenu /> : null}
      </div>
    </>
  );

  // Full-screen mobile explore menu
  const MobileMenuDrawer = () => {
    const categoryCards = [
      {
        title: "Best Phones by Price",
        description: "Shortlists for every budget",
        icon: FaTag,
        href: buildSmartphoneFilterPath("under-20000"),
        surface: "bg-amber-50",
        color: "text-amber-600",
        iconSurface: "bg-amber-100",
      },
      {
        title: "Popular Brands",
        description: "Jump to a trusted phone maker",
        icon: FaStore,
        href: "/brands",
        surface: "bg-rose-50",
        color: "text-rose-600",
        iconSurface: "bg-rose-100",
      },
      {
        title: "Browse by Feature",
        description: "5G, AMOLED, gaming and more",
        icon: FaBolt,
        href: buildFeatureListingPath("5g"),
        surface: "bg-violet-50",
        color: "text-violet-600",
        iconSurface: "bg-violet-100",
      },
      {
        title: "Smartphones",
        description: "Latest, upcoming and trending",
        icon: FaMobileAlt,
        href: "/smartphones",
        surface: "bg-emerald-50",
        color: "text-emerald-600",
        iconSurface: "bg-emerald-100",
      },
      {
        title: "TVs",
        description: "Smart TV guides and comparisons",
        icon: FaTv,
        href: "/tvs",
        surface: "bg-blue-50",
        color: "text-blue-600",
        iconSurface: "bg-blue-100",
      },
      {
        title: "Guides & Articles",
        description: "Buying guides, tips and tech news",
        icon: FaNewspaper,
        href: "/news",
        surface: "bg-orange-50",
        color: "text-orange-600",
        iconSurface: "bg-orange-100",
      },
    ];

    const quickLinks = [
      {
        title: "Phone Finder",
        description: "Find the right phone for you",
        icon: FaMobileAlt,
        href: "/phone-finder",
        surface: "bg-blue-50",
        color: "text-blue-600",
        iconSurface: "bg-blue-100",
      },
      {
        title: "Compare",
        description: "Compare devices side by side",
        icon: FaAlignJustify,
        href: "/compare",
        surface: "bg-violet-50",
        color: "text-violet-600",
        iconSurface: "bg-violet-100",
      },
    ];

    return isMenuOpen ? (
      <div className="fixed inset-0 z-[120] overflow-hidden bg-slate-950/55 lg:hidden">
        <button
          type="button"
          className="absolute inset-0 h-full w-full border-0 bg-transparent"
          onClick={() => setIsMenuOpen(false)}
          aria-label="Close navigation"
        />
        <aside
          className="absolute inset-y-0 right-0 h-[100dvh] w-[calc(100%-16px)] overflow-x-hidden overflow-y-auto overscroll-contain rounded-tl-[24px] bg-white text-slate-950"
          role="dialog"
          aria-modal="true"
          aria-label="Explore MobilesX"
        >
          <header className="sticky top-0 z-20 flex items-center justify-between gap-3 bg-white px-5 pb-4 pt-[max(1.1rem,env(safe-area-inset-top))] sm:px-8 sm:pb-5 sm:pt-7">
            <Link
              to="/"
              onClick={() => setIsMenuOpen(false)}
              className="flex min-w-0 items-center gap-3 text-slate-950 no-underline"
            >
              <BrandIdentity variant="desktop" />
              <span className="min-w-0">
                <strong className="block truncate text-[1.35rem] font-black leading-none tracking-[-0.04em] text-slate-950 sm:text-3xl">
                  Mobiles<span className="text-blue-600">X</span>
                </strong>
              </span>
            </Link>
            <button
              type="button"
              onClick={() => setIsMenuOpen(false)}
              aria-label="Close menu"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full border-0 bg-blue-50 text-[1.2rem] text-slate-950 transition-colors hover:bg-blue-100"
            >
              <FaTimes aria-hidden="true" />
            </button>
          </header>

          <main className="px-5 pb-5 sm:px-8 sm:pb-7">
            <section className="pt-5 sm:pt-8">
              <h1 className="max-w-[700px] text-[1.8rem] font-black leading-[1.08] tracking-[-0.04em] sm:text-5xl">
                What are you researching <span className="text-blue-600">today?</span>
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-500 sm:mt-4 sm:text-lg sm:leading-7">
                Search phones, brands, specifications or buying guides.
              </p>

              <button
                type="button"
                className="mt-6 grid min-h-[56px] w-full grid-cols-[22px_minmax(0,1fr)_42px] items-center gap-3 rounded-full border border-blue-200 bg-white px-3 text-left text-slate-500 shadow-[0_8px_20px_rgba(37,99,235,0.08)] transition-colors hover:border-blue-400 sm:mt-8 sm:min-h-[70px] sm:px-5"
                onClick={() => {
                  setIsMenuOpen(false);
                  openSearchOverlay();
                }}
              >
                <FaSearch className="ml-1 text-lg text-blue-600" aria-hidden="true" />
                <span className="truncate text-[0.78rem] sm:text-base">
                  Search phones, brands or specifications...
                </span>
                <span className="grid h-10 w-10 place-items-center rounded-full bg-blue-600 text-lg text-white sm:h-12 sm:w-12">
                  <FaArrowRight aria-hidden="true" />
                </span>
              </button>
            </section>

            <section className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-5">
              {quickLinks.map((item) => {
                const ItemIcon = item.icon;
                const { color: iconColor, iconSurface } = item;
                return (
                  <Link
                    key={item.title}
                    to={toCanonicalPagePath(item.href)}
                    onClick={() => setIsMenuOpen(false)}
                    className={`group relative grid min-h-[92px] grid-cols-[40px_minmax(0,1fr)] items-center gap-2.5 rounded-2xl p-3 text-slate-950 no-underline transition-transform hover:-translate-y-0.5 sm:min-h-[98px] sm:grid-cols-[58px_minmax(0,1fr)] sm:gap-3 sm:p-4 ${item.surface}`}
                  >
                    <span className={`grid h-10 w-10 place-items-center rounded-xl text-base sm:h-[58px] sm:w-[58px] sm:rounded-2xl sm:text-2xl ${iconColor} ${iconSurface}`}>
                      <ItemIcon aria-hidden="true" />
                    </span>
                    <span className="min-w-0 pr-4">
                      <b className="block text-[0.82rem] font-black leading-4 sm:text-lg sm:leading-6">
                        {item.title}
                      </b>
                      <small className="mt-1 block text-[0.68rem] leading-[1.4] text-slate-600 sm:text-sm sm:leading-5">
                        {item.description}
                      </small>
                    </span>
                    <FaChevronRight className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[0.65rem] text-slate-700 sm:right-4 sm:text-base" aria-hidden="true" />
                  </Link>
                );
              })}
            </section>

            <div className="my-6 border-t border-slate-200 sm:my-8" />

            <section>
              <h2 className="text-xl font-black tracking-tight sm:text-3xl">
                Browse Categories
              </h2>
              <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-base">
                Explore sections and find what you need.
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3 sm:mt-6 sm:gap-5">
                {categoryCards.map((item) => {
                  const ItemIcon = item.icon;
                  const { surface, color: iconColor, iconSurface } = item;
                  return (
                    <Link
                      key={item.title}
                      to={toCanonicalPagePath(item.href)}
                      onClick={() => setIsMenuOpen(false)}
                      className={`group relative grid min-h-[112px] grid-cols-[40px_minmax(0,1fr)] items-center gap-3 rounded-2xl p-3 text-slate-950 no-underline transition-transform hover:-translate-y-0.5 sm:min-h-[126px] sm:grid-cols-[64px_minmax(0,1fr)] sm:gap-4 sm:p-5 ${surface}`}
                    >
                      <span className={`grid h-10 w-10 place-items-center rounded-xl text-base sm:h-16 sm:w-16 sm:rounded-2xl sm:text-3xl ${iconColor} ${iconSurface}`}>
                        <ItemIcon aria-hidden="true" />
                      </span>
                      <span className="min-w-0 pb-3 pr-2">
                        <b className="block text-[0.78rem] font-black leading-[1.3] sm:text-lg sm:leading-6">
                          {item.title}
                        </b>
                        <small className="mt-1 block line-clamp-2 text-[0.64rem] leading-[1.4] text-slate-600 sm:text-sm sm:leading-5">
                          {item.description}
                        </small>
                      </span>
                      <span className={`absolute bottom-2 right-2 grid h-5 w-5 place-items-center rounded-full bg-white/70 sm:bottom-4 sm:right-4 sm:h-9 sm:w-9 ${iconColor}`}>
                        <FaChevronRight className="text-[0.55rem] sm:text-sm" aria-hidden="true" />
                      </span>
                    </Link>
                  );
                })}
              </div>
            </section>
          </main>

          <footer className="mt-6 border-t border-slate-200 px-5 pb-[max(1.1rem,env(safe-area-inset-bottom))] pt-5 sm:mx-8 sm:mb-6 sm:px-0 sm:py-6">
            <div className="grid grid-cols-[42px_minmax(0,1fr)] items-center gap-x-3 gap-y-3 rounded-2xl bg-blue-50 p-4 sm:grid-cols-[64px_minmax(0,1fr)_auto] sm:gap-4 sm:p-5">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-slate-950 sm:h-16 sm:w-16">
                <span className="scale-[0.74] sm:scale-100"><BrandIdentity variant="drawer" darkBackground /></span>
              </span>
              <span className="min-w-0">
                <b className="block truncate text-sm font-black tracking-tight sm:text-2xl">
                  MobilesX Assistant
                </b>
                <small className="mt-1 block text-[0.72rem] leading-4 text-slate-600 sm:text-base sm:leading-6">
                  Get quick answers, compare phones and find the best deals.
                </small>
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  window.dispatchEvent(new Event(MOBILE_OPEN_ASSISTANT_EVENT));
                }}
                className="col-span-2 inline-flex min-h-10 items-center justify-center gap-2 rounded-full border-0 bg-blue-600 px-4 text-xs font-bold text-white transition-colors hover:bg-blue-700 sm:col-span-1 sm:min-h-[58px] sm:px-6 sm:text-base"
              >
                <FaComments aria-hidden="true" />
                Start Chat
              </button>
            </div>
          </footer>
        </aside>
      </div>
    ) : null;
  };

  return (
    <>
      <SearchModal />

      {isDesktopSearchOpen ? (
        <button
          type="button"
          aria-label="Close search"
          onClick={closeDesktopSearch}
          className="fixed inset-0 z-[55] hidden bg-slate-950/10 lg:block"
        />
      ) : null}

      <header
        ref={headerRef}
        className={`fixed inset-x-0 top-0 z-[60] isolate w-full border-0 bg-transparent shadow-none backdrop-blur-0 transition-transform duration-300 ease-out will-change-transform fixed left-0 right-0 top-0 isolate z-[60] w-full transition-transform duration-300 ease-out will-change-transform ${
          isMobileHeaderVisible
            ? "translate-y-0"
            : "pointer-events-none -translate-y-full"
        } ${
          isDesktopHeaderVisible
            ? "lg:pointer-events-auto lg:translate-y-0"
            : "lg:pointer-events-none lg:-translate-y-full"
        }`}
      >
        <MainHeader />
      </header>
      <div
        aria-hidden="true"
        className="h-[var(--mobile-header-height,104px)] lg:h-[var(--desktop-header-height,76px)]"
      />

      <MobileMenuDrawer
        key={isMenuOpen ? "mobile-menu-open" : "mobile-menu-closed"}
      />
    </>
  );
};

export default Header;
