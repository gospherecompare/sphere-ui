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
import ThemeToggle from "../ThemeToggle";
import "./header-redesign.css";
import { isPublishedProduct } from "../../utils/publishedProducts";
import {
  MOBILE_OPEN_EXPLORE_EVENT,
  MOBILE_OPEN_SEARCH_EVENT,
} from "../../utils/mobileNavigation";

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
} from "react-icons/fa";

const BrandIdentity = ({ variant = "desktop" }) => {
  const isDesktop = variant === "desktop";
  const isMobile = variant === "mobile";

  const brandClass = isDesktop
    ? "text-[24px] tracking-[0.03em] lg:text-[26px]"
    : isMobile
      ? "text-[18px] tracking-[0.02em] sm:text-[19px]"
      : "text-[18px] tracking-[0.02em]";
  const wrapperClass = isDesktop ? "gap-2.5" : "gap-2";
  const brandTone = "bg-blue-500 bg-clip-text text-transparent";
  const brandShadow = isDesktop
    ? "drop-shadow-[0_10px_22px_rgba(99,102,241,0.18)]"
    : "drop-shadow-[0_8px_16px_rgba(99,102,241,0.14)]";

  return (
    <span className={`inline-flex items-center min-w-0 ${wrapperClass} group`}>
      <span
        className={`hooks-brand-wordmark luckiest-guy-regular inline-block ${brandClass} ${brandTone} ${brandShadow} font-semibold leading-[1.02] pt-1 transition-all`}
      >
        Hooks
      </span>
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

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDesktopSearchOpen, setIsDesktopSearchOpen] = useState(false);
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
      const nearBottom = maxScroll - currentY <= MOBILE_HEADER_SHOW_BOTTOM_OFFSET;
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
        (isDesktop ? headerRef.current : mobileHeaderRef.current)
          ?.getBoundingClientRect().height || 0,
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

  useEffect(() => {
    if (isDesktopSearchOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isDesktopSearchOpen]);

  // Lock body scroll while a mobile navigation surface is open.
  useEffect(() => {
    if (isSearchOpen || isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isSearchOpen, isMenuOpen]);

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
        navigator.sendBeacon(
          "https://api.apisphere.in/api/public/search-interest",
          blob,
        );
        return;
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
    // prevent focus restoration while we're intentionally navigating
    suppressRestoreRef.current = true;

    // Navigate FIRST before closing anything
    if (item.type === "product") {
      const path = resolveProductSuggestionPath(item);
      // Navigate directly to the canonical detail path so crawlers do not
      // discover duplicate query-string variants for the same product.
      navigate(path, {
        state: {
          productId: item.product_id ?? item.productId ?? item.id ?? null,
          source: "header-search",
        },
      });
      if (!isLocalDevHost) {
        Promise.resolve().then(() =>
          trackSearchInterest({
            query: String(item.name || item.model || searchQuery || "").trim(),
            product_id: item.id,
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
      if (!isLocalDevHost) {
        Promise.resolve().then(() =>
          trackSearchInterest({
            query: String(item.name || searchQuery || "").trim(),
            source: "brand-suggestion",
          }),
        );
      }
    } else {
      navigate(
        buildKeywordSearchPath(
          item.name || item,
          item.product_type || item.productType,
        ),
      );
      if (!isLocalDevHost) {
        Promise.resolve().then(() =>
          trackSearchInterest({
            query: String(item.name || searchQuery || "").trim(),
            source: "search-suggestion",
          }),
        );
      }
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
        { label: "Careers", href: "/careers" },
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
        ...(categoriesWithBrands
          .find((category) => String(category.id || "") === "smartphones")
          ?.topBrands || []),
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
        { label: "Under 10000", href: buildSmartphoneFilterPath("under-10000") },
        { label: "10000 to 15000", href: buildSmartphoneFilterPath("under-15000") },
        { label: "15000 to 25000", href: buildSmartphoneFilterPath("under-25000") },
        { label: "25000 to 40000", href: buildSmartphoneFilterPath("under-40000") },
        { label: "Above 40000", href: buildSmartphoneFilterPath("above-40000") },
      ],
    },
  ];

  const desktopNavLinkClass = (active = false) =>
    `hooks-desktop-nav__link ${active ? "is-active" : ""}`;

  const MegaPanel = ({ children, variant = "explore" }) => (
    <div className={`hooks-nav-mega hooks-nav-mega--${variant}`}>
      <div className="hooks-nav-mega__surface">{children}</div>
    </div>
  );

  const ExploreMegaMenu = () => (
    <MegaPanel variant="explore">
      <div className="hooks-nav-mega-v2">
        <header className="hooks-nav-mega-v2__head">
          <div className="hooks-nav-mega-v2__intro">
            <span className="hooks-nav-mega-v2__eyebrow">
              <FaCompass aria-hidden="true" /> Device discovery
            </span>
            <h2>Find the right device without digging through endless menus.</h2>
            <p>
              Start from what matters: a fresh launch, a clear budget, a trusted
              brand or a direct comparison.
            </p>
          </div>

          <div className="hooks-nav-mega-v2__spotlight" aria-hidden="true">
            <span className="hooks-nav-mega-v2__orb is-one" />
            <span className="hooks-nav-mega-v2__orb is-two" />
            <span className="hooks-nav-mega-v2__device is-back" />
            <span className="hooks-nav-mega-v2__device is-front">
              <i />
              <b />
            </span>
            <span className="hooks-nav-mega-v2__signal">5G</span>
          </div>

          <div className="hooks-nav-mega-v2__head-actions">
            <Link
              to="/smartphones"
              onClick={() => setActiveDesktopMenu("")}
              className="hooks-nav-mega-v2__primary"
            >
              Browse all phones <FaArrowRight aria-hidden="true" />
            </Link>
            <Link
              to="/compare"
              onClick={() => setActiveDesktopMenu("")}
              className="hooks-nav-mega-v2__text-link"
            >
              Open compare
            </Link>
          </div>
        </header>

        <div className="hooks-nav-mega-v2__body">
          <section className="hooks-nav-mega-v2__start">
            <div className="hooks-nav-mega-v2__section-title">
              <div>
                <small>Start here</small>
                <h3>Popular research paths</h3>
              </div>
              <span>Updated daily</span>
            </div>

            <div className="hooks-nav-mega-v2__start-grid">
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
                    className={`hooks-nav-mega-v2__start-card is-${item.tone}`}
                  >
                    <span className="hooks-nav-mega-v2__start-icon">
                      <ItemIcon aria-hidden="true" />
                    </span>
                    <span className="hooks-nav-mega-v2__start-copy">
                      <b>{item.label}</b>
                      <small>{item.copy}</small>
                    </span>
                    <FaArrowRight aria-hidden="true" />
                  </Link>
                );
              })}
            </div>
          </section>

          <section className="hooks-nav-mega-v2__brands">
            <div className="hooks-nav-mega-v2__section-title">
              <div>
                <small>Brand directory</small>
                <h3>Popular phone makers</h3>
              </div>
            </div>
            <nav className="hooks-nav-mega-v2__brand-grid" aria-label="Popular brands">
              {desktopBrandMenuItems.map((item, index) => (
                <Link
                  key={item.label}
                  to={toCanonicalPagePath(item.href)}
                  onClick={() => setActiveDesktopMenu("")}
                >
                  <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                  <b>{item.label}</b>
                  <FaChevronRight aria-hidden="true" />
                </Link>
              ))}
            </nav>
          </section>

          <aside className="hooks-nav-mega-v2__budget">
            <div className="hooks-nav-mega-v2__section-title">
              <div>
                <small>Budget shortcuts</small>
                <h3>Shop by price</h3>
              </div>
            </div>
            <nav className="hooks-nav-mega-v2__budget-list" aria-label="Shop by price">
              {exploreMenuSections[2].items.map((item) => (
                <Link
                  key={item.label}
                  to={toCanonicalPagePath(item.href)}
                  onClick={() => setActiveDesktopMenu("")}
                >
                  <span>{item.label}</span>
                  <FaArrowRight aria-hidden="true" />
                </Link>
              ))}
            </nav>
            <Link
              to="/compare"
              onClick={() => setActiveDesktopMenu("")}
              className="hooks-nav-mega-v2__compare-card"
            >
              <span><FaAlignJustify aria-hidden="true" /></span>
              <div>
                <small>Decision tool</small>
                <b>Compare two phones side by side</b>
              </div>
              <FaArrowRight aria-hidden="true" />
            </Link>
          </aside>
        </div>
      </div>
    </MegaPanel>
  );

  const MoreMegaMenu = () => (
    <MegaPanel variant="more">
      <div className="hooks-nav-more-v2">
        <section className="hooks-nav-more-v2__lead">
          <span className="hooks-nav-mega-v2__eyebrow">
            <FaInfoCircle aria-hidden="true" /> Hooks directory
          </span>
          <h2>Useful pages, editorial tools and support in one place.</h2>
          <p>
            Learn how Hooks works, reach the team or continue researching beyond
            the main device catalogue.
          </p>
          <Link
            to="/about"
            onClick={() => setActiveDesktopMenu("")}
            className="hooks-nav-mega-v2__primary"
          >
            About Hooks <FaArrowRight aria-hidden="true" />
          </Link>
        </section>

        <div className="hooks-nav-more-v2__directory">
          {moreMenuSections.map((section) => {
            const SectionIcon = section.icon || FaInfoCircle;
            return (
              <section key={section.title} className="hooks-nav-more-v2__group">
                <div className="hooks-nav-more-v2__group-head">
                  <span><SectionIcon aria-hidden="true" /></span>
                  <div>
                    <small>Directory</small>
                    <h3>{section.title}</h3>
                  </div>
                </div>
                <nav aria-label={section.title}>
                  {section.items.map((item) => (
                    <Link
                      key={`${section.title}-${item.label}`}
                      to={toCanonicalPagePath(item.href)}
                      onClick={() => setActiveDesktopMenu("")}
                    >
                      <span>{item.label}</span>
                      <FaArrowRight aria-hidden="true" />
                    </Link>
                  ))}
                </nav>
              </section>
            );
          })}
        </div>

        <Link
          to="/news"
          onClick={() => setActiveDesktopMenu("")}
          className="hooks-nav-more-v2__news"
        >
          <span><FaInfoCircle aria-hidden="true" /></span>
          <div>
            <small>Hooks newsroom</small>
            <b>Latest launches, updates and practical buying context</b>
          </div>
          <FaArrowRight aria-hidden="true" />
        </Link>
      </div>
    </MegaPanel>
  );
  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    const query = String(searchQuery || "").trim();
    if (query) {
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

      navigate(buildKeywordSearchPath(query));
      if (!isLocalDevHost) {
        trackSearchInterest({
          query,
          source: "header",
        });
      }
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
    setIsSearchOpen(true);
  };

  const openDesktopSearch = () => {
    setActiveDesktopMenu("");
    setIsDesktopSearchOpen(true);
    setShowSearchSuggestions(Boolean(String(searchQuery || "").trim()));
  };

  const closeDesktopSearch = () => {
    setIsDesktopSearchOpen(false);
    setSearchQuery("");
    setSearchSuggestions([]);
    setShowSearchSuggestions(false);
    setSelectedSuggestionIndex(-1);
  };

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
            ? "group rounded-2xl border border-blue-100/70 bg-white/80 px-4 py-4 shadow-sm"
            : "w-full flex items-center gap-3 border-b border-blue-100/70 px-4 py-4 last:border-b-0"
        }`}
      >
        <div className="h-12 w-12 shrink-0 rounded-md bg-gradient-to-br from-blue-100 via-indigo-100 to-cyan-100 ring-1 ring-blue-100" />
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
      <div className="flex h-14 w-14 items-center justify-center rounded-md bg-gradient-to-br from-blue-50 via-white to-cyan-50 text-[#345ce3] ring-1 ring-blue-100">
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

  const HighlightText = ({ text }) => text || "";

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

    const buttonClasses = isMobileVariant
      ? `group flex w-full items-center gap-2.5 overflow-hidden rounded-2xl border px-3 py-3 text-left shadow-[0_10px_24px_rgba(59,130,246,0.08)] transition-all duration-200 ${
          selected
            ? "border-blue-200 bg-blue-50/90 shadow-[0_14px_30px_rgba(59,130,246,0.12)]"
            : "border-blue-100 bg-white/95 hover:border-blue-200 hover:shadow-[0_14px_30px_rgba(59,130,246,0.1)] active:bg-blue-50"
        }`
      : `group relative flex w-full items-center gap-3 px-4 py-3.5 text-left transition-all duration-200 border-b border-blue-100/70 last:border-b-0 ${
          selected
            ? "bg-blue-50/90"
            : "bg-white/90 hover:bg-blue-50/60 active:bg-blue-100/70"
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
            className={`absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-[#345ce3] via-blue-500 to-cyan-400 transition-opacity duration-200 ${
              selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            }`}
          />
        ) : null}

        <div
          className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-md ring-1 ring-blue-100 transition group-hover:ring-blue-200 ${
            isMobileVariant ? "h-11 w-11" : "h-12 w-12"
          } ${
            imageUrl
              ? "bg-white"
              : "bg-gradient-to-br from-blue-50 via-white to-cyan-50"
          }`}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={suggestion.name}
              className={`h-full w-full object-contain ${
                isMobileVariant ? "p-1" : "p-1.5"
              }`}
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
          <p className="line-clamp-2 text-[13px] font-semibold leading-snug text-slate-900 transition group-hover:text-[#345ce3] sm:text-[15px]">
            <HighlightText
              text={readFirstText(suggestion?.name, suggestion?.model)}
              query={query}
            />
          </p>
        </div>

        <FaChevronRight
          className={`relative shrink-0 transition group-hover:translate-x-0.5 group-hover:text-[#345ce3] ${
            isMobileVariant
              ? "h-3.5 w-3.5 text-slate-400"
              : "h-3.5 w-3.5 text-slate-300"
          }`}
        />
      </button>
    );
  };

  const DesktopSearchSuggestionPanel = () => {
    if (!isDesktopSearchOpen || !(showSearchSuggestions || searchQuery.trim())) {
      return null;
    }

    return (
      <div className="absolute right-0 top-full z-[80] mt-2 w-[min(440px,calc(100vw-48px))] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_22px_50px_rgba(15,23,42,0.18)] ring-1 ring-slate-950/5">
        <div className="max-h-[420px] overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {!searchSuggestions || searchSuggestions.length === 0 ? (
            searchQuery.trim() ? (
              <>
                {isSearching &&
                  [...Array(3)].map((_, index) => (
                    <SkeletonSuggestion key={`desktop-inline-skeleton-${index}`} />
                  ))}
                {!isSearching &&
                  searchSuggestions &&
                  searchSuggestions.length === 0 && (
                    <SuggestionEmptyState
                      query={searchQuery}
                      variant="desktop"
                    />
                  )}
              </>
            ) : null
          ) : (
            searchSuggestions
              .slice(0, SEARCH_SUGGESTION_LIMIT)
              .map((sugg, index) => (
                <SuggestionRow
                  key={`${sugg.id || sugg.name || index}-desktop-inline`}
                  suggestion={sugg}
                  query={searchQuery}
                  selected={selectedSuggestionIndex === index}
                  variant="desktop"
                  onActivate={handleSuggestionClick}
                  onMouseEnter={() => setSelectedSuggestionIndex(index)}
                />
              ))
          )}
        </div>
      </div>
    );
  };

  // Flipkart-Style Search Modal - Mobile Optimized
  const SearchModal = () => {
    return (
      <>
        {isSearchOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-[70] bg-black bg-opacity-50"
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
              className="fixed inset-0 z-[80] flex flex-col overflow-hidden bg-white lg:inset-auto lg:left-0 lg:right-0 lg:top-16 lg:shadow-lg"
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
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleSearch(e);
                          return;
                        }
                        handleSearchKeyDown(e);
                      }}
                      className="w-full px-4 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-gradient-to-r from-blue-50/80 via-white to-cyan-50/60 border border-blue-100 rounded-full focus:outline-none focus:border-[#345ce3] focus:ring-2 focus:ring-[#345ce3]/10 transition-all placeholder-slate-400 font-medium"
                    />

                    {/* Suggestions Dropdown - Flipkart Style with Images & Highlighting */}
                    {(showSearchSuggestions || searchQuery.trim()) && (
                      <div className="hidden md:block absolute top-full left-0 right-0 mt-2 max-h-96 overflow-hidden overflow-y-auto rounded-2xl border border-blue-100/80 bg-gradient-to-br from-white via-white to-blue-50/60 shadow-[0_28px_70px_rgba(15,23,42,0.16)] backdrop-blur z-50 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        {/* Loading / Empty State */}
                        {!searchSuggestions ||
                        searchSuggestions.length === 0 ? (
                          searchQuery.trim() ? (
                            <>
                              {/* Show skeleton loaders while fetching */}
                              {isSearching &&
                                [...Array(3)].map((_, i) => (
                                  <SkeletonSuggestion
                                    key={`desktop-skeleton-${i}`}
                                  />
                                ))}
                              {/* No Results - only show after loaded */}
                              {!isSearching &&
                                searchSuggestions &&
                                searchSuggestions.length === 0 && (
                                  <SuggestionEmptyState
                                    query={searchQuery}
                                    variant="desktop"
                                  />
                                )}
                            </>
                          ) : null
                        ) : (
                          /* Suggestions List */
                          <>
                            {searchSuggestions
                              .slice(0, SEARCH_SUGGESTION_LIMIT)
                              .map((sugg, index) => (
                                <SuggestionRow
                                  key={`${sugg.id || sugg.name || index}-desktop`}
                                  suggestion={sugg}
                                  query={searchQuery}
                                  selected={selectedSuggestionIndex === index}
                                  variant="desktop"
                                  onActivate={handleSuggestionClick}
                                  onMouseEnter={() =>
                                    setSelectedSuggestionIndex(index)
                                  }
                                />
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
                  <div className="px-2.5 py-3 sm:px-6 sm:py-6">
                    {/* Loading State */}
                    {!searchSuggestions || searchSuggestions.length === 0 ? (
                      <>
                        {/* Show skeleton loaders while fetching */}
                        {isSearching &&
                          [...Array(3)].map((_, i) => (
                            <SkeletonSuggestion
                              key={`mobile-skeleton-${i}`}
                              variant="mobile"
                            />
                          ))}
                        {/* No Results - only show after loaded */}
                        {!isSearching &&
                          searchSuggestions &&
                          searchSuggestions.length === 0 && (
                            <SuggestionEmptyState
                              query={searchQuery}
                              variant="mobile"
                            />
                          )}
                      </>
                    ) : (
                      /* Suggestions List for Mobile */
                      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-white via-white to-blue-50/60 p-2 shadow-[0_18px_44px_rgba(15,23,42,0.1)] sm:rounded-[1.35rem] sm:p-3">
                        <div className="space-y-2.5 sm:space-y-3">
                          {searchSuggestions
                            .slice(0, SEARCH_SUGGESTION_LIMIT)
                            .map((sugg, index) => (
                              <SuggestionRow
                                key={`${sugg.id || sugg.name || index}-mobile`}
                                suggestion={sugg}
                                query={searchQuery}
                                selected={selectedSuggestionIndex === index}
                                variant="mobile"
                                onActivate={handleSuggestionClick}
                                onMouseEnter={() =>
                                  setSelectedSuggestionIndex(index)
                                }
                              />
                            ))}
                        </div>
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

  const mobileQuickLinks = [
    { label: "Latest", href: "/smartphones/filter/new", icon: FaCalendarAlt },
    { label: "Upcoming", href: "/smartphones/upcoming", icon: FaBolt },
    { label: "Trending", href: "/trending/smartphones", icon: FaStar },
    { label: "TVs", href: "/tvs", icon: FaTv },
    {
      label: "Under ₹25K",
      href: buildSmartphoneFilterPath("under-25000"),
      icon: FaTag,
    },
  ];

  // Responsive application header: dedicated mobile/tablet and desktop systems.
  const MainHeader = () => (
    <>
      <div ref={mobileHeaderRef} className="hooks-mobile-header lg:hidden">
        <div className="hooks-mobile-header__main">
          <button
            type="button"
            className="hooks-mobile-header__menu"
            onClick={() => setIsMenuOpen(true)}
            aria-label="Open navigation"
            aria-expanded={isMenuOpen}
          >
            <FaBars aria-hidden="true" />
          </button>

          <Link to="/" className="hooks-mobile-header__brand" aria-label="Hooks home">
            <BrandIdentity variant="mobile" />
            <small>Device intelligence</small>
          </Link>

          <div className="hooks-mobile-header__actions">
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="hooks-mobile-header__action"
              aria-label="Search Hooks"
            >
              <FaSearch aria-hidden="true" />
            </button>
            <ThemeToggle className="hooks-mobile-theme-toggle" />
          </div>
        </div>

        <nav className="hooks-mobile-header__rail" aria-label="Quick navigation">
          <button
            type="button"
            className="hooks-mobile-quick-link is-explore"
            onClick={() => setIsMenuOpen(true)}
          >
            <FaCompass aria-hidden="true" />
            <span>Explore</span>
          </button>
          {mobileQuickLinks.map((item) => {
            const ItemIcon = item.icon;
            return (
              <Link
                key={item.href}
                to={toCanonicalPagePath(item.href)}
                className={`hooks-mobile-quick-link ${isActiveNavLink(item.href) ? "is-active" : ""}`}
              >
                <ItemIcon aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div
        className="hooks-desktop-header hidden lg:block"
        onMouseLeave={() => setActiveDesktopMenu("")}
      >
        <div className="hooks-desktop-header__bar">
          <Link to="/" className="hooks-desktop-header__brand" aria-label="Hooks home">
            <BrandIdentity variant="desktop" />
            <span>
              <small>Research smarter</small>
              <b>Device intelligence</b>
            </span>
          </Link>

          <nav className="hooks-desktop-nav" aria-label="Primary navigation">
            <button
              type="button"
              className={desktopNavLinkClass(
                activeDesktopMenu === "explore" || currentPath.startsWith("/smartphones"),
              )}
              onMouseEnter={() => setActiveDesktopMenu("explore")}
              onFocus={() => setActiveDesktopMenu("explore")}
              onClick={() =>
                setActiveDesktopMenu((menu) => (menu === "explore" ? "" : "explore"))
              }
              aria-expanded={activeDesktopMenu === "explore"}
            >
              <FaCompass aria-hidden="true" />
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

            <button
              type="button"
              className={desktopNavLinkClass(activeDesktopMenu === "more")}
              onMouseEnter={() => setActiveDesktopMenu("more")}
              onFocus={() => setActiveDesktopMenu("more")}
              onClick={() =>
                setActiveDesktopMenu((menu) => (menu === "more" ? "" : "more"))
              }
              aria-expanded={activeDesktopMenu === "more"}
            >
              <span>More</span>
              <FaChevronDown aria-hidden="true" />
            </button>
          </nav>

          <div
            className="hooks-desktop-header__actions"
            onMouseEnter={() => setActiveDesktopMenu("")}
          >
            {isDesktopSearchOpen ? (
              <form ref={searchRef} onSubmit={handleSearch} className="hooks-desktop-search">
                <button
                  type="button"
                  onClick={closeDesktopSearch}
                  className="hooks-desktop-search__close"
                  aria-label="Close search"
                >
                  <FaTimes aria-hidden="true" />
                </button>
                <input
                  ref={searchInputRef}
                  type="search"
                  value={searchQuery}
                  onChange={(event) => handleSearchInputChange(event.target.value)}
                  onFocus={() => {
                    if (searchQuery.trim()) setShowSearchSuggestions(true);
                  }}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Search devices, brands or specifications"
                  aria-label="Search Hooks"
                />
                <button type="submit" className="hooks-desktop-search__submit" aria-label="Search">
                  <FaSearch aria-hidden="true" />
                </button>
                <DesktopSearchSuggestionPanel />
              </form>
            ) : (
              <button
                type="button"
                onClick={openDesktopSearch}
                className="hooks-desktop-header__action"
                aria-label="Open search"
              >
                <FaSearch aria-hidden="true" />
                <span>Search</span>
              </button>
            )}
            <ThemeToggle className="hooks-desktop-theme-toggle" />
          </div>
        </div>

        {activeDesktopMenu === "explore" ? <ExploreMegaMenu /> : null}
        {activeDesktopMenu === "more" ? <MoreMegaMenu /> : null}
      </div>
    </>
  );

  // Mobile Menu Drawer
  const MobileMenuDrawer = () => {
    const [openSection, setOpenSection] = useState("");
    const smartphoneCategory =
      categoriesWithBrands.find(
        (category) => String(category.id || "").toLowerCase() === "smartphones",
      ) ||
      categoriesWithBrands[0] ||
      null;
    const fallbackBrands = [
      "Samsung",
      "OnePlus",
      "Vivo",
      "Realme",
      "Oppo",
      "Apple",
    ];

    const normalizeName = (value) =>
      String(value || "")
        .trim()
        .replace(/\s+/g, " ");

    const brandNames = [
      ...(Array.isArray(smartphoneCategory?.topBrands)
        ? smartphoneCategory.topBrands
            .map((brand) => normalizeName(brand?.name || brand))
            .filter(Boolean)
        : []),
      ...fallbackBrands,
    ];

    const brandItems = Array.from(new Set(brandNames))
      .slice(0, 6)
      .map((name) => ({
        label: name,
        href: buildBrandListingPath(name, "smartphones"),
      }));

    const priceItems = [
      {
        label: "Best Phones Under 10,000",
        href: buildSmartphoneFilterPath("under-10000"),
      },
      {
        label: "Best Phones Under 15,000",
        href: buildSmartphoneFilterPath("under-15000"),
      },
      {
        label: "Best Phones Under 20,000",
        href: buildSmartphoneFilterPath("under-20000"),
      },
      {
        label: "Best Phones Under 25,000",
        href: buildSmartphoneFilterPath("under-25000"),
      },
      {
        label: "Best Phones Under 30,000",
        href: buildSmartphoneFilterPath("under-30000"),
      },
      {
        label: "Best Phones Under 40,000",
        href: buildSmartphoneFilterPath("under-40000"),
      },
      {
        label: "Best Phones Under 50,000",
        href: buildSmartphoneFilterPath("under-50000"),
      },
      {
        label: "Best Phones Under 60,000",
        href: buildSmartphoneFilterPath("under-60000"),
      },
    ];

    const featureItems = [
      { label: "5G Phones", href: buildFeatureListingPath("5g") },
      { label: "AMOLED", href: buildFeatureListingPath("amoled") },
      {
        label: "120Hz+",
        href: buildFeatureListingPath("high-refresh-rate"),
      },
      {
        label: "Long Battery",
        href: buildFeatureListingPath("long-battery"),
      },
      {
        label: "Fast Charge",
        href: buildFeatureListingPath("fast-charging"),
      },
      { label: "Gaming", href: buildFeatureListingPath("gaming") },
    ];

    const smartphoneItems = [
      { label: "All Smartphones", href: "/smartphones" },
      { label: "Latest Smartphones", href: "/smartphones/filter/new" },
      { label: "Upcoming Smartphones", href: "/smartphones/upcoming" },
      { label: "Trending Smartphones", href: "/trending/smartphones" },
    ];

    const tvItems = [
      { label: "Best TVs", href: "/tvs" },
      { label: "4K Ultra HD TVs", href: "/tvs/features/ultra-hd-4k" },
      { label: "OLED/QLED TVs", href: "/tvs/features/oled-qled" },
      { label: "Gaming TVs", href: "/tvs/features/gaming" },
    ];

    const drawerItems = [
      {
        id: "price",
        title: "Best Phones by Price",
        icon: FaTag,
        kind: "accordion",
        items: priceItems,
      },
      {
        id: "brands",
        title: "Popular Brands",
        icon: FaStore,
        kind: "accordion",
        items: brandItems,
        footer: { label: "All Brands", href: "/smartphones" },
      },
      {
        id: "features",
        title: "Browse by Feature",
        icon: FaBolt,
        kind: "accordion",
        items: featureItems,
      },
      {
        id: "smartphones",
        title: "Smartphones",
        icon: FaMobileAlt,
        kind: "accordion",
        items: smartphoneItems,
      },
      {
        id: "compare",
        title: "Compare Devices",
        icon: FaAlignJustify,
        kind: "link",
        href: toCanonicalPagePath("/compare"),
      },
      {
        id: "tvs",
        title: "TVs",
        icon: FaTv,
        kind: "accordion",
        items: tvItems,
      },
      {
        id: "finder",
        title: "Phone Finder",
        icon: FaSearch,
        kind: "link",
        href: "/",
      },
      {
        id: "news",
        title: "News",
        icon: FaInfoCircle,
        kind: "link",
        href: toCanonicalPagePath("/news"),
      },
      {
        id: "trending",
        title: "Trending Mobiles",
        icon: FaBolt,
        kind: "link",
        href: toCanonicalPagePath("/trending/smartphones"),
      },
    ];

    return (
      <>
        {isMenuOpen ? (
          <div className="hooks-mobile-drawer-layer lg:hidden">
            <button
              type="button"
              className="hooks-mobile-drawer-layer__backdrop"
              onClick={() => setIsMenuOpen(false)}
              aria-label="Close navigation"
            />

            <aside
              className="hooks-mobile-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Hooks navigation"
            >
              <header className="hooks-mobile-drawer__header">
                <div className="hooks-mobile-drawer__brand-row">
                  <Link to="/" onClick={() => setIsMenuOpen(false)}>
                    <BrandIdentity variant="drawer" />
                  </Link>
                  <div className="hooks-mobile-drawer__header-actions">
                    <ThemeToggle className="hooks-mobile-drawer__theme" />
                    <button
                      type="button"
                      onClick={() => setIsMenuOpen(false)}
                      aria-label="Close menu"
                    >
                      <FaTimes aria-hidden="true" />
                    </button>
                  </div>
                </div>
                <div className="hooks-mobile-drawer__welcome">
                  <span><i aria-hidden="true" /> Live device guide</span>
                  <h2>What are you researching today?</h2>
                  <p>Jump to a device, budget, brand or buying guide.</p>
                </div>
                <button
                  type="button"
                  className="hooks-mobile-drawer__search"
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsSearchOpen(true);
                  }}
                >
                  <FaSearch aria-hidden="true" />
                  <span>Search phones, brands or specifications</span>
                  <FaArrowRight aria-hidden="true" />
                </button>
                <div className="hooks-mobile-drawer__quick-actions">
                  <Link to="/smartphones" onClick={() => setIsMenuOpen(false)}>
                    <span><FaMobileAlt aria-hidden="true" /></span>
                    <div>
                      <b>Phone finder</b>
                      <small>Browse every model</small>
                    </div>
                    <FaArrowRight aria-hidden="true" />
                  </Link>
                  <Link to="/compare" onClick={() => setIsMenuOpen(false)}>
                    <span><FaAlignJustify aria-hidden="true" /></span>
                    <div>
                      <b>Compare</b>
                      <small>See differences</small>
                    </div>
                    <FaArrowRight aria-hidden="true" />
                  </Link>
                  <Link to="/news" onClick={() => setIsMenuOpen(false)}>
                    <span><FaInfoCircle aria-hidden="true" /></span>
                    <div>
                      <b>Newsroom</b>
                      <small>Launches and updates</small>
                    </div>
                    <FaArrowRight aria-hidden="true" />
                  </Link>
                </div>
              </header>

              <div className="hooks-mobile-drawer__body">
                <div className="hooks-mobile-drawer__section-label">
                  <div>
                    <span>Browse Hooks</span>
                    <small>Choose a section to reveal its links</small>
                  </div>
                  <b>Live</b>
                </div>

                <nav className="hooks-mobile-drawer__nav" aria-label="Mobile navigation">
                  {drawerItems.map((item, itemIndex) => {
                    const isOpen = openSection === item.id;
                    const ItemIcon = item.icon || FaChevronRight;
                    const itemDescription = {
                      price: "Shortlists for every budget",
                      brands: "Jump to a trusted phone maker",
                      features: "5G, AMOLED, gaming and more",
                      smartphones: "Latest, upcoming and trending",
                      compare: "Place specifications side by side",
                      tvs: "Smart TV guides and display types",
                      finder: "Start a guided phone search",
                      news: "Launches, updates and explainers",
                      trending: "Most researched phones right now",
                    }[item.id];

                    if (item.kind === "accordion") {
                      return (
                        <section
                          key={item.id}
                          className={`hooks-mobile-drawer__group is-${item.id} ${isOpen ? "is-open" : ""}`}
                        >
                          <button
                            type="button"
                            onClick={() => setOpenSection(isOpen ? "" : item.id)}
                            aria-expanded={isOpen}
                          >
                            <span className="hooks-mobile-drawer__group-index">
                              {String(itemIndex + 1).padStart(2, "0")}
                            </span>
                            <span className="hooks-mobile-drawer__group-copy">
                              <b>{item.title}</b>
                              <small>{itemDescription}</small>
                            </span>
                            <span className="hooks-mobile-drawer__group-icon">
                              <ItemIcon aria-hidden="true" />
                            </span>
                            <FaChevronDown className="hooks-mobile-drawer__chevron" aria-hidden="true" />
                          </button>

                          {isOpen ? (
                            <div className="hooks-mobile-drawer__subnav">
                              {item.items.map((subItem) => (
                                <Link
                                  key={`${item.id}-${subItem.label}`}
                                  to={toCanonicalPagePath(subItem.href)}
                                  onClick={() => setIsMenuOpen(false)}
                                >
                                  <span>{subItem.label}</span>
                                  <FaArrowRight aria-hidden="true" />
                                </Link>
                              ))}
                              {item.footer ? (
                                <Link
                                  to={toCanonicalPagePath(item.footer.href)}
                                  onClick={() => setIsMenuOpen(false)}
                                  className="is-footer-link"
                                >
                                  <span>{item.footer.label}</span>
                                  <FaArrowRight aria-hidden="true" />
                                </Link>
                              ) : null}
                            </div>
                          ) : null}
                        </section>
                      );
                    }

                    return (
                      <Link
                        key={item.id}
                        to={toCanonicalPagePath(item.href)}
                        onClick={() => setIsMenuOpen(false)}
                        className="hooks-mobile-drawer__direct-link"
                      >
                        <span className="hooks-mobile-drawer__group-index">
                          {String(itemIndex + 1).padStart(2, "0")}
                        </span>
                        <span className="hooks-mobile-drawer__group-copy">
                          <b>{item.title}</b>
                          <small>{itemDescription}</small>
                        </span>
                        <span className="hooks-mobile-drawer__group-icon">
                          <ItemIcon aria-hidden="true" />
                        </span>
                        <FaArrowRight aria-hidden="true" />
                      </Link>
                    );
                  })}
                </nav>

                <footer className="hooks-mobile-drawer__footer">
                  <div>
                    <span>Hooks</span>
                    <small>Independent device research and buying context.</small>
                  </div>
                  <nav aria-label="Company links">
                    <Link to="/about" onClick={() => setIsMenuOpen(false)}>About</Link>
                    <Link to="/contact" onClick={() => setIsMenuOpen(false)}>Contact</Link>
                    <Link to="/privacy-policy" onClick={() => setIsMenuOpen(false)}>Privacy</Link>
                    <Link to="/terms" onClick={() => setIsMenuOpen(false)}>Terms</Link>
                  </nav>
                </footer>
              </div>
            </aside>
          </div>
        ) : null}
      </>
    );
  };

  return (
    <>
      <SearchModal />

      <header
        ref={headerRef}
        className={`hooks-site-header fixed left-0 right-0 top-0 isolate z-[60] w-full transition-transform duration-300 ease-out will-change-transform ${
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
