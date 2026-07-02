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
 *   - All wishlist, auth, and other features visible
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
import Cookies from "js-cookie";
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
} from "../../utils/mobileNavigation";

// Icons - matching Vijay Sales style
import {
  FaSearch,
  FaBars,
  FaArrowLeft,
  FaArrowRight,
  FaHeart,
  FaUser,
  FaShoppingCart,
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
  FaSignInAlt,
  FaUserPlus,
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
        className={`luckiest-guy-regular inline-block ${brandClass} ${brandTone} ${brandShadow} font-semibold leading-[1.02] pt-1 transition-all`}
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

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDesktopSearchOpen, setIsDesktopSearchOpen] = useState(false);
  const [activeDesktopMenu, setActiveDesktopMenu] = useState("");
  const [isMobileHeaderVisible, setIsMobileHeaderVisible] = useState(true);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
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
  const authDropdownRef = useRef(null);
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);
  const mobileHeaderRef = useRef(null);
  const headerRef = useRef(null);
  const mobileHeaderLastScrollYRef = useRef(0);
  const mobileHeaderTickingRef = useRef(false);
  const inputWasFocusedRef = useRef(false);
  const suppressRestoreRef = useRef(false);
  const deviceCtx = useDevice();
  const brands = (deviceCtx && deviceCtx.brands) || [];
  const smartphones =
    (deviceCtx &&
      (deviceCtx.smartphoneAll?.length
        ? deviceCtx.smartphoneAll
        : deviceCtx.smartphone)) ||
    [];
  const tvs = (deviceCtx && deviceCtx.homeAppliances) || [];

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

  useEffect(() => {
    setActiveDesktopMenu("");
    setIsDesktopSearchOpen(false);
    setIsMobileHeaderVisible(true);
    if (typeof window !== "undefined") {
      mobileHeaderLastScrollYRef.current = Math.max(0, window.scrollY || 0);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (isMenuOpen || isSearchOpen) {
      setIsMobileHeaderVisible(true);
    }
  }, [isMenuOpen, isSearchOpen]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const updateMobileHeaderVisibility = () => {
      mobileHeaderTickingRef.current = false;

      const width = window.innerWidth || 0;
      const currentY = Math.max(0, window.scrollY || window.pageYOffset || 0);

      if (width >= 768 || isMenuOpen || isSearchOpen) {
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
  }, [isMenuOpen, isSearchOpen]);

  // Keep the mobile header height in sync for sticky offsets.
  useEffect(() => {
    const updateMobileHeaderHeight = () => {
      if (typeof window === "undefined") return;

      const width = window.innerWidth;
      const isMobile = width < 768;
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
      const isMobile = window.innerWidth < 768;
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

  const toObjectIfNeeded = (value) => {
    if (!value) return {};
    if (typeof value === "object" && !Array.isArray(value)) return value;
    if (typeof value !== "string") return {};
    const t = value.trim();
    if (!t) return {};
    if (
      (t.startsWith("{") && t.endsWith("}")) ||
      (t.startsWith("[") && t.endsWith("]"))
    ) {
      try {
        const parsed = JSON.parse(t);
        return parsed && typeof parsed === "object" && !Array.isArray(parsed)
          ? parsed
          : {};
      } catch {
        return {};
      }
    }
    return {};
  };

  const toArrayIfNeeded = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value !== "string") return [];
    const t = value.trim();
    if (!t) return [];
    if (t.startsWith("[") || t.startsWith("{")) {
      try {
        const parsed = JSON.parse(t);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
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

  const parsePriceNumber = (value) => {
    if (value === null || value === undefined || value === "") return null;
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    const text = String(value);
    const numeric = Number(text.replace(/[^0-9.]/g, ""));
    return Number.isFinite(numeric) ? numeric : null;
  };

  const toUniqueList = (arr) => {
    const out = [];
    const seen = new Set();
    for (const item of arr || []) {
      const value = String(item || "").trim();
      if (!value) continue;
      const key = value.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(value);
    }
    return out;
  };

  const findMinPrice = (item) => {
    if (!item || typeof item !== "object") return null;
    const candidates = [];

    const addPrice = (v) => {
      const n = parsePriceNumber(v);
      if (n !== null && n > 0) candidates.push(n);
    };

    addPrice(item.min_price);
    addPrice(item.minPrice);
    addPrice(item.price);
    addPrice(item.base_price);
    addPrice(item.starting_price);
    addPrice(item.numericPrice);

    const variants = Array.isArray(item.variants)
      ? item.variants
      : toArrayIfNeeded(item.variants_json);

    variants.forEach((variant) => {
      const v =
        variant && typeof variant === "object"
          ? variant
          : toObjectIfNeeded(variant);
      addPrice(v.base_price);
      addPrice(v.price);
      const storePrices = Array.isArray(v.store_prices)
        ? v.store_prices
        : Array.isArray(v.storePrices)
          ? v.storePrices
          : [];
      storePrices.forEach((sp) => {
        const row = sp && typeof sp === "object" ? sp : toObjectIfNeeded(sp);
        addPrice(row.price ?? row.amount);
      });
    });

    const topStorePrices = Array.isArray(item.store_prices)
      ? item.store_prices
      : Array.isArray(item.storePrices)
        ? item.storePrices
        : [];
    topStorePrices.forEach((sp) => {
      const row = sp && typeof sp === "object" ? sp : toObjectIfNeeded(sp);
      addPrice(row.price ?? row.amount);
    });

    if (!candidates.length) return null;
    return Math.min(...candidates);
  };

  const extractVariantTypes = (item) => {
    if (!item || typeof item !== "object") return [];

    const explicit = item.variant_types || item.variantTypes;
    if (Array.isArray(explicit) && explicit.length) {
      return toUniqueList(explicit).slice(0, 3);
    }

    const variants = Array.isArray(item.variants)
      ? item.variants
      : toArrayIfNeeded(item.variants_json);

    const derived = variants.map((variant) => {
      const v =
        variant && typeof variant === "object"
          ? variant
          : toObjectIfNeeded(variant);

      const ram = readFirstText(v.ram, v.RAM, v.memory);
      const storage = readFirstText(
        v.storage,
        v.storage_size,
        v.internal_storage,
        v.rom,
      );
      const screen = readFirstText(v.screen_size, v.size);
      const resolution = readFirstText(v.resolution);
      const key = readFirstText(v.variant_key, v.name, v.label);

      if (ram && storage) return `${ram}/${storage}`;
      if (ram) return ram;
      if (storage) return storage;
      if (screen && resolution) return `${screen} ${resolution}`.trim();
      if (screen) return screen;
      return key;
    });

    return toUniqueList(derived).slice(0, 3);
  };

  const extractSearchFeatures = (item, type) => {
    const explicit = item?.key_features || item?.keyFeatures;
    if (Array.isArray(explicit) && explicit.length) {
      return toUniqueList(explicit).slice(0, 3);
    }

    const features = [];
    const pushFeature = (value, suffix = "") => {
      const text = readFirstText(value);
      if (!text) return;
      features.push(`${text}${suffix}`.trim());
    };

    const productType = normalizeText(type || item?.product_type);

    if (
      productType.includes("tv") ||
      productType.includes("appliance")
    ) {
      const keySpecs = toObjectIfNeeded(
        item?.key_specs_json || item?.key_specs,
      );
      const displayJson = toObjectIfNeeded(item?.display_json || item?.display);
      const specs = toObjectIfNeeded(item?.specifications);
      pushFeature(
        keySpecs.screen_size ||
          displayJson.screen_size ||
          specs.screen_size ||
          item?.screen_size,
      );
      pushFeature(
        keySpecs.resolution ||
          displayJson.resolution ||
          specs.resolution ||
          item?.resolution,
      );
      pushFeature(
        keySpecs.panel_type ||
          displayJson.panel_type ||
          specs.display_type ||
          item?.display_type,
      );
      pushFeature(
        keySpecs.refresh_rate ||
          displayJson.refresh_rate ||
          specs.refresh_rate ||
          item?.refresh_rate,
      );
    } else {
      pushFeature(
        item?.display?.size ||
          item?.display?.screen_size ||
          item?.display?.display_size,
      );
      pushFeature(
        item?.battery?.capacity ||
          item?.battery?.battery_capacity ||
          item?.battery?.battery_capacity_mah,
      );
      pushFeature(
        item?.camera?.main_camera_megapixels ||
          item?.camera?.rear_camera?.main?.megapixels ||
          item?.camera?.main,
      );
      pushFeature(
        item?.performance?.processor ||
          item?.performance?.cpu ||
          item?.performance?.chipset,
      );
    }

    return toUniqueList(features).slice(0, 3);
  };

  const toSearchSuggestion = (item, fallbackType) => {
    if (!item || typeof item !== "object") return null;
    const name = readFirstText(
      item.name,
      item.model,
      item.model_number,
      item.title,
    );
    if (!name) return null;
    const model = readFirstText(item.model, item.model_number, item.name);
    const brandName = readFirstText(
      item.brand_name,
      item.brand,
      item.brandName,
    );
    const productType = readFirstText(
      item.product_type,
      item.productType,
      fallbackType,
    );

    const image = readFirstText(
      item.image_url,
      item.image,
      item.product_image,
      item.imageUrl,
      Array.isArray(item.images) ? item.images[0] : "",
      toArrayIfNeeded(item.images_json)[0],
    );

    const minPrice = findMinPrice(item);
    const variantTypes = extractVariantTypes(item);
    const keyFeatures = extractSearchFeatures(item, productType);
    const id = item.id ?? item.product_id ?? item.productId ?? null;

    const searchableText = normalizeText(
      [
        name,
        model,
        brandName,
        productType,
        ...variantTypes,
        ...keyFeatures,
      ].join(" "),
    );

    return {
      type: "product",
      id,
      product_id: item.product_id ?? item.productId ?? id,
      name,
      model: model || name,
      product_type: productType || fallbackType,
      canonical_path: createProductPath(
        mapProductTypeToRoute(productType || fallbackType),
        name,
      ),
      brand_name: brandName || null,
      image_url: image || null,
      min_price: minPrice,
      variant_types: variantTypes,
      key_features: keyFeatures,
      searchable_text: searchableText,
    };
  };

  const localSearchSuggestions = React.useMemo(() => {
    const mapped = [
      ...smartphones
        .filter((item) => isPublishedProduct(item))
        .map((item) => toSearchSuggestion(item, "smartphone")),
      ...tvs
        .filter((item) => isPublishedProduct(item))
        .map((item) => toSearchSuggestion(item, "tv")),
    ].filter(Boolean);

    const deduped = [];
    const seen = new Set();

    mapped.forEach((item) => {
      const key = [
        normalizeText(item.product_type),
        normalizeText(item.name),
        normalizeText(item.brand_name),
      ].join("|");
      if (seen.has(key)) return;
      seen.add(key);
      deduped.push(item);
    });

    return deduped;
  }, [smartphones, tvs]);

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
        { label: "Wishlist", href: "/wishlist" },
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

  const desktopNavBaseClass =
    "inline-flex h-12 items-center gap-1.5 border-b-2 px-1 text-[12px] font-black uppercase tracking-[0.13em] transition-colors";

  const desktopNavLinkClass = (active = false) =>
    `${desktopNavBaseClass} ${
      active
        ? "border-[#0057ff] text-[#06122f]"
        : "border-transparent text-slate-600 hover:border-[#0057ff]/45 hover:text-[#06122f]"
    }`;

  const MegaPanel = ({
    children,
    widthClass = "w-[min(980px,calc(100vw-48px))]",
    caretClass = "left-1/2 -translate-x-1/2",
  }) => (
    <div
      className={`absolute left-1/2 top-full z-[70] -translate-x-1/2 pt-3 ${widthClass}`}
    >
      <span
        className={`pointer-events-none absolute top-1 z-[71] h-5 w-5 rotate-45 border-l border-t border-slate-200 bg-white shadow-[-6px_-6px_18px_rgba(15,23,42,0.04)] ${caretClass}`}
      />
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_28px_70px_rgba(15,23,42,0.16)] ring-1 ring-slate-950/5">
        {children}
      </div>
    </div>
  );

  const ExploreMegaMenu = () => (
    <MegaPanel>
      <div className="grid gap-0 md:grid-cols-3">
        {exploreMenuSections.map((section) => (
          <section key={section.title} className="min-w-0 border-r border-slate-100 p-6 last:border-r-0">
            <div className="mb-4 h-0.5 w-full rounded-full bg-[#0057ff]" />
            <h3 className="text-[13px] font-black text-[#071120]">
              {section.title}
            </h3>
            <div className="mt-4 space-y-1.5">
              {section.items.map((item) => (
                <Link
                  key={`${section.title}-${item.label}`}
                  to={toCanonicalPagePath(item.href)}
                  className="flex min-h-[34px] items-center justify-between rounded-lg px-2.5 text-[13px] font-semibold text-slate-600 transition hover:bg-blue-50 hover:text-[#0057ff]"
                >
                  <span className="truncate">{item.label}</span>
                  <FaChevronRight className="h-2.5 w-2.5 shrink-0 opacity-45" />
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </MegaPanel>
  );

  const MoreMegaMenu = () => (
    <MegaPanel
      widthClass="w-[min(1010px,calc(100vw-64px))]"
      caretClass="right-16"
    >
      <div className="grid gap-0 md:grid-cols-3">
        {moreMenuSections.map((section) => {
          const SectionIcon = section.icon || FaInfoCircle;
          return (
            <section
              key={section.title}
              className="min-w-0 border-r border-slate-100 px-8 py-8 last:border-r-0"
            >
              <div className="mb-5 flex items-center gap-4">
                <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[#0057ff] ring-1 ring-blue-100">
                  <SectionIcon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-[16px] font-black uppercase tracking-[0.02em] text-[#071120]">
                    {section.title}
                  </h3>
                  <span className="mt-3 block h-0.5 w-12 rounded-full bg-[#0057ff]" />
                </div>
              </div>
              <div className="mt-5 divide-y divide-slate-100">
                {section.items.map((item) => (
                  <Link
                    key={`${section.title}-${item.label}`}
                    to={toCanonicalPagePath(item.href)}
                    className="group flex min-h-[52px] items-center justify-between gap-4 text-[15px] font-bold text-[#071120] transition hover:text-[#0057ff]"
                  >
                    <span className="truncate">{item.label}</span>
                    <FaChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400 transition group-hover:text-[#0057ff]" />
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
      <div className="px-7 pb-7">
        <div className="flex items-center justify-between gap-6 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-blue-50 px-6 py-5 shadow-inner">
          <div className="flex min-w-0 items-center gap-4">
            <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#0057ff] text-white shadow-[0_14px_30px_rgba(0,87,255,0.24)]">
              <FaBolt className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-[17px] font-black text-[#071120]">
                Start device discovery
              </p>
              <p className="mt-1 text-[14px] font-medium text-slate-600">
                Explore smartphones, comparisons, rankings and more.
              </p>
            </div>
          </div>
          <Link
            to="/smartphones"
            className="inline-flex h-12 shrink-0 items-center gap-3 rounded-xl bg-[#0057ff] px-7 text-[15px] font-black text-white shadow-[0_14px_28px_rgba(0,87,255,0.22)] transition hover:bg-[#0046d5]"
          >
            Explore now
            <FaArrowRight className="h-4 w-4" />
          </Link>
        </div>
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

  // Handle auth
  const handleLogin = () => {
    setIsLoggedIn(true);
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
    navigate("/");
  };

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
              <FaUser className="w-6 h-6 text-blue-600" />
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
              <FaUser className="text-blue-600" />
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
            className="w-full flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg hover:from-blue-700 hover:to-cyan-600 transition mb-3"
          >
            <FaSignInAlt />
            <span>Continue with Email</span>
          </button>
        </div>
      )}
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

  // Main Header Component - Desktop + Mobile (Clean Minimal Design)
  const MainHeader = () => (
    <>
      {/* MOBILE HEADER (≤ 768px) */}
      <div
        ref={mobileHeaderRef}
        className="border-b border-slate-200 bg-white shadow-[0_4px_18px_rgba(15,23,42,0.06)] md:hidden"
      >
        {/* Mobile Top Row: Menu | Logo */}
        <div className="flex min-h-[52px] items-center gap-3 px-3 py-2">
          <div className="flex min-w-0 items-center gap-2">
            <button
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition-all hover:bg-slate-100/60 hover:text-slate-900"
              onClick={() => setIsMenuOpen(true)}
              aria-label="Open menu"
            >
              <FaBars className="h-4 w-4" />
            </button>

            <Link to="/" className="flex min-w-0 items-center">
              <BrandIdentity variant="mobile" />
            </Link>
          </div>
        </div>
      </div>

      {/* DESKTOP HEADER (> 768px) */}
      <div
        className="relative hidden border-b border-slate-200 bg-white shadow-[0_8px_28px_rgba(15,23,42,0.06)] md:block"
        onMouseLeave={() => setActiveDesktopMenu("")}
      >
        <div className="mx-auto flex min-h-[64px] w-full max-w-[1440px] items-center gap-5 px-5 lg:px-8">
          <Link to="/" className="flex min-w-0 shrink-0 items-center">
            <BrandIdentity variant="desktop" />
          </Link>

          <nav
            aria-label="Primary navigation"
            className="hidden min-w-0 flex-1 items-center justify-center gap-4 overflow-x-auto whitespace-nowrap pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden lg:flex xl:gap-6"
          >
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
            >
              Explore
              <FaChevronDown
                className={`h-2.5 w-2.5 transition-transform ${
                  activeDesktopMenu === "explore" ? "rotate-180 text-[#0057ff]" : ""
                }`}
              />
            </button>

            {desktopNavLinks.map((link) => (
              <Link
                key={`${link.name}-${link.link}`}
                to={link.link}
                className={desktopNavLinkClass(isActiveNavLink(link.link))}
                onMouseEnter={() => setActiveDesktopMenu("")}
                onFocus={() => setActiveDesktopMenu("")}
              >
                {link.name}
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
            >
              More
              <FaChevronDown
                className={`h-2.5 w-2.5 transition-transform ${
                  activeDesktopMenu === "more" ? "rotate-180 text-[#0057ff]" : ""
                }`}
              />
            </button>
          </nav>

          <div
            className="ml-auto flex shrink-0 items-center"
            onMouseEnter={() => setActiveDesktopMenu("")}
          >
            {isDesktopSearchOpen ? (
              <form
                ref={searchRef}
                onSubmit={handleSearch}
                className="relative flex items-center"
              >
                <button
                  type="button"
                  onClick={closeDesktopSearch}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-l-md border border-slate-300 bg-slate-100 text-slate-800 transition hover:bg-slate-200 hover:text-[#0057ff]"
                  aria-label="Close search"
                >
                  <FaTimes className="h-4 w-4" />
                </button>
                <div className="relative h-10 w-[min(34vw,380px)] min-w-[270px]">
                  <input
                    ref={searchInputRef}
                    type="search"
                    value={searchQuery}
                    onChange={(e) => handleSearchInputChange(e.target.value)}
                    onFocus={() => {
                      if (searchQuery.trim()) {
                        setShowSearchSuggestions(true);
                      }
                    }}
                    onKeyDown={handleSearchKeyDown}
                    placeholder="Search phones, brands, specs..."
                    className="h-full w-full rounded-r-md border-y border-r border-slate-300 bg-slate-100 pl-4 pr-11 text-[14px] font-semibold text-[#071120] outline-none transition placeholder:text-slate-500 focus:border-[#0057ff] focus:bg-white focus:ring-2 focus:ring-[#0057ff]/10"
                  />
                  <button
                    type="submit"
                    className="absolute right-0 top-0 inline-flex h-10 w-10 items-center justify-center rounded-r-md text-slate-800 transition hover:text-[#0057ff]"
                    aria-label="Search"
                  >
                    <FaSearch className="h-4 w-4" />
                  </button>
                </div>
                <DesktopSearchSuggestionPanel />
              </form>
            ) : (
              <button
                type="button"
                onClick={openDesktopSearch}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-[#0057ff] hover:text-[#0057ff]"
                aria-label="Open search"
              >
                <FaSearch className="h-4 w-4" />
              </button>
            )}
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
      ...(isLoggedIn
        ? [
            {
              id: "wishlist",
              title: "Wishlist",
              icon: FaHeart,
              kind: "link",
              href: "/wishlist",
            },
          ]
        : []),
    ];

    return (
      <>
        {isMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-[70] bg-slate-950/55 backdrop-blur-sm lg:hidden"
              onClick={() => setIsMenuOpen(false)}
            />

            <div
              className={`fixed inset-y-0 left-0 z-[80] w-[min(90vw,22.5rem)] transform overflow-hidden bg-[#f6f8fc] shadow-[18px_0_55px_rgba(15,23,42,0.2)] transition-transform duration-300 lg:hidden ${
                isMenuOpen ? "translate-x-0" : "-translate-x-full"
              }`}
            >
              <div className="flex h-full flex-col">
                <div className="bg-white px-4 pb-4 pt-[calc(env(safe-area-inset-top)+14px)] shadow-[0_8px_26px_rgba(15,23,42,0.06)]">
                  <div className="flex min-h-[42px] items-center justify-between gap-3">
                    <Link
                      to="/"
                      className="flex min-w-0 items-center"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <BrandIdentity variant="drawer" />
                    </Link>
                    <button
                      type="button"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition active:scale-95 active:bg-slate-200"
                      onClick={() => setIsMenuOpen(false)}
                      aria-label="Close menu"
                    >
                      <FaTimes className="h-4 w-4" />
                    </button>
                  </div>

                  <button
                    type="button"
                    className="mt-3 flex h-11 w-full items-center gap-3 rounded-2xl bg-slate-100 px-3 text-left text-[13px] font-semibold text-slate-500 transition active:bg-slate-200"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsSearchOpen(true);
                    }}
                  >
                    <FaSearch className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                    <span className="min-w-0 flex-1 truncate">
                      Search phones, brands, specs...
                    </span>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto px-3 pb-4 pt-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <div className="px-1 pb-2 text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                    Explore
                  </div>

                  <nav className="overflow-hidden rounded-[1.35rem] bg-white shadow-[0_10px_30px_rgba(15,23,42,0.07)]">
                    {drawerItems.map((item) => {
                      const isOpen = openSection === item.id;
                      const ItemIcon = item.icon || FaChevronRight;

                      if (item.kind === "accordion") {
                        return (
                          <section
                            key={item.id}
                            className="bg-white"
                          >
                            <button
                              type="button"
                              onClick={() =>
                                setOpenSection(isOpen ? "" : item.id)
                              }
                              className="flex min-h-[54px] w-full items-center gap-3 border-b border-slate-100 px-3.5 text-left transition active:bg-slate-50"
                            >
                              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#eef5ff] text-[#0b4aa2]">
                                <ItemIcon className="h-3.5 w-3.5" />
                              </span>
                              <span className="min-w-0 flex-1 text-[14px] font-bold text-slate-900">
                                {item.title}
                              </span>
                              {isOpen ? (
                                <FaChevronDown className="h-3 w-3 shrink-0 text-slate-500" />
                              ) : (
                                <FaArrowRight className="h-3 w-3 shrink-0 text-slate-500" />
                              )}
                            </button>

                            {isOpen ? (
                              <div className="bg-slate-50">
                                <ul className="py-1">
                                  {item.items.map((subItem) => (
                                    <li key={`${item.id}-${subItem.label}`}>
                                      <Link
                                        to={subItem.href}
                                        onClick={() => setIsMenuOpen(false)}
                                        className="flex min-h-[43px] items-center justify-between gap-3 px-4 pl-[62px] text-[13px] font-semibold text-slate-600 transition active:bg-white"
                                      >
                                        <span>{subItem.label}</span>
                                        <FaArrowRight className="h-3 w-3 shrink-0 text-slate-400" />
                                      </Link>
                                    </li>
                                  ))}
                                </ul>
                                {item.footer ? (
                                  <Link
                                    to={item.footer.href}
                                    onClick={() => setIsMenuOpen(false)}
                                    className="ml-[62px] inline-flex min-h-[40px] items-center gap-2 text-[13px] font-bold text-blue-700"
                                  >
                                    <span>{item.footer.label}</span>
                                    <FaArrowRight className="h-3 w-3" />
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
                          to={item.href}
                          onClick={() => setIsMenuOpen(false)}
                          className="flex min-h-[54px] items-center gap-3 border-b border-slate-100 bg-white px-3.5 text-[14px] font-bold text-slate-900 transition last:border-b-0 active:bg-slate-50"
                        >
                          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#eef5ff] text-[#0b4aa2]">
                            <ItemIcon className="h-3.5 w-3.5" />
                          </span>
                          <span className="min-w-0 flex-1">{item.title}</span>
                          <FaArrowRight className="h-3 w-3 shrink-0 text-slate-500" />
                        </Link>
                      );
                    })}
                  </nav>
                </div>

              </div>
            </div>
          </>
        )}
      </>
    );
  };

  return (
    <>
      <SearchModal />

      <header
        ref={headerRef}
        className={`fixed left-0 right-0 top-0 isolate z-[60] w-full bg-white transition-transform duration-300 ease-out will-change-transform md:translate-y-0 ${
          isMobileHeaderVisible
            ? "translate-y-0"
            : "pointer-events-none -translate-y-full md:pointer-events-auto"
        }`}
      >
        <MainHeader />

      </header>
      <div
        aria-hidden="true"
        className="h-[var(--mobile-header-height,52px)] md:h-[var(--desktop-header-height,64px)]"
      />

      <MobileMenuDrawer
        key={isMenuOpen ? "mobile-menu-open" : "mobile-menu-closed"}
      />
    </>
  );
};

export default Header;
