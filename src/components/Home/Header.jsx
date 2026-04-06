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
import { createProductPath } from "../../utils/slugGenerator";

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
  FaLaptop,
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
  FaHome,
  FaCreditCard,
  FaShippingFast,
  FaTruck,
  FaPercentage,
  FaCalendarAlt,
  FaWeight,
  FaHandsHelping,
  FaAlignJustify,
  FaStream,
  FaTimes,
  FaBalanceScale,
  FaBriefcase,
} from "react-icons/fa";

const BrandIdentity = ({ variant = "desktop" }) => {
  const isDesktop = variant === "desktop";
  const isMobile = variant === "mobile";

  const brandClass = isDesktop
    ? "text-[26px] lg:text-[28px]"
    : isMobile
      ? "text-[18px] sm:text-[20px]"
      : "text-[18px]";
  const wrapperClass = isDesktop ? "gap-3" : "gap-2.5";
  const brandTone = "text-[#345ce3] font-normal";

  return (
    <span className={`flex items-center min-w-0 ${wrapperClass} group`}>
      <span
        className={`luckiest-guy-regular ${brandClass} ${brandTone} leading-[1.02] pt-1 transition-all`}
      >
        Hooks
      </span>
    </span>
  );
};

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
  const [mobileHeaderHeight, setMobileHeaderHeight] = useState(112);
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = String(location.pathname || "").toLowerCase();
  const megaMenuRef = useRef(null);
  const authDropdownRef = useRef(null);
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);
  const mobileHeaderRef = useRef(null);
  const headerRef = useRef(null);
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
  const laptops = (deviceCtx && deviceCtx.laptops) || [];
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

  // Check scroll for header effects
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
          setMobileHeaderHeight(measuredMobile);
          document.documentElement.style.setProperty(
            "--mobile-header-height",
            `${measuredMobile}px`,
          );
        }
        document.documentElement.style.setProperty(
          "--desktop-header-height",
          "0px",
        );
        return;
      }

      setMobileHeaderHeight(0);
      document.documentElement.style.setProperty(
        "--mobile-header-height",
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
    }

    return () => {
      window.removeEventListener("resize", updateMobileHeaderHeight);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
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
    if (t.includes("network") || t === "networking") return "networking";
    // Default to smartphones if can't determine
    return "smartphones";
  };

  const formatINR = (value) => {
    const n = Number(value);
    if (!Number.isFinite(n)) return null;
    try {
      return `₹${new Intl.NumberFormat("en-IN", {
        maximumFractionDigits: 0,
      }).format(n)}`;
    } catch (e) {
      return `₹${Math.round(n)}`;
    }
  };

  const escapeRegExp = (value) =>
    String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const getSuggestionTypeLabel = (sugg) => {
    const suggestionType = String(sugg?.type || "").toLowerCase();
    if (suggestionType === "brand") return "Brand";

    const productType = String(
      sugg?.product_type || sugg?.productType || "",
    ).toLowerCase();

    if (productType.includes("laptop")) return "Laptop";
    if (productType.includes("tv") || productType.includes("appliance"))
      return "TV";
    if (productType.includes("network")) return "Networking";
    if (productType.includes("phone") || productType.includes("smart"))
      return "Smartphone";

    return suggestionType === "product" ? "Product" : "Search";
  };

  const getSuggestionTypeIcon = (sugg) => {
    const suggestionType = String(sugg?.type || "").toLowerCase();
    if (suggestionType === "brand") return FaStore;

    const productType = String(
      sugg?.product_type || sugg?.productType || "",
    ).toLowerCase();

    if (productType.includes("laptop")) return FaLaptop;
    if (productType.includes("tv") || productType.includes("appliance"))
      return FaTv;
    if (productType.includes("network")) return FaPlug;
    if (productType.includes("phone") || productType.includes("smart"))
      return FaMobileAlt;

    return FaSearch;
  };

  const getSuggestionSubtitle = (sugg) => {
    if (!sugg || typeof sugg !== "object") return "";
    const suggestionType = String(sugg?.type || "").toLowerCase();
    const brandName = readFirstText(sugg?.brand_name, sugg?.brand);
    const modelName = readFirstText(sugg?.model, sugg?.model_number);
    const typeLabel = getSuggestionTypeLabel(sugg);

    if (suggestionType === "brand") {
      return `Explore the full ${readFirstText(sugg?.name) || "brand"} lineup`;
    }

    const summaryParts = [brandName, modelName || typeLabel].filter(Boolean);
    if (summaryParts.length) return summaryParts.join(" • ");
    return typeLabel;
  };

  const buildSuggestionChips = (sugg, variant = "desktop") => {
    const chips = [];
    const suggestionType = String(sugg?.type || "").toLowerCase();
    const isMobileVariant = variant === "mobile";
    const brandName = readFirstText(sugg?.brand_name, sugg?.brand);
    const priceLabel = formatINR(sugg?.min_price ?? sugg?.minPrice);

    if (suggestionType === "brand") {
      chips.push({
        label: "Brand",
        tone: "bg-amber-50 text-amber-700 ring-amber-100",
      });
      chips.push({
        label: `Explore ${readFirstText(sugg?.name) || "products"}`,
        tone: "bg-blue-50 text-[#345ce3] ring-blue-100",
      });
      return chips;
    }

    if (brandName && normalizeText(brandName) !== normalizeText(sugg?.name)) {
      chips.push({
        label: brandName,
        tone: "bg-slate-100 text-slate-700 ring-slate-200",
      });
    }

    getSuggestionVariantTypes(sugg)
      .slice(0, isMobileVariant ? 1 : 2)
      .forEach((variantType) => {
        chips.push({
          label: variantType,
          tone: "bg-blue-50 text-[#345ce3] ring-blue-100",
        });
      });

    if (priceLabel) {
      chips.push({
        label: `From ${priceLabel}`,
        tone: "bg-emerald-50 text-emerald-700 ring-emerald-100",
      });
    }

    getSuggestionFeatures(sugg)
      .slice(0, isMobileVariant ? 1 : 2)
      .forEach((feature) => {
        chips.push({
          label: feature,
          tone: "bg-cyan-50 text-cyan-700 ring-cyan-100",
        });
      });

    return chips.slice(0, isMobileVariant ? 3 : 4);
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

    if (productType.includes("laptop")) {
      pushFeature(
        item?.cpu?.processor_name ||
          item?.cpu?.processor ||
          item?.performance?.processor_name ||
          item?.performance?.processor ||
          item?.performance?.chipset,
      );
      pushFeature(
        item?.display?.display_size ||
          item?.display?.size ||
          item?.display?.screen_size,
      );
      pushFeature(
        item?.memory?.ram ||
          item?.memory?.capacity ||
          item?.memory?.size ||
          item?.ram,
      );
      pushFeature(
        item?.storage?.capacity ||
          item?.storage?.storage ||
          item?.storage?.size ||
          item?.storage_capacity,
      );
    } else if (
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
      name,
      model: model || name,
      product_type: productType || fallbackType,
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
      ...smartphones.map((item) => toSearchSuggestion(item, "smartphone")),
      ...laptops.map((item) => toSearchSuggestion(item, "laptop")),
      ...tvs.map((item) => toSearchSuggestion(item, "tv")),
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
  }, [smartphones, laptops, tvs]);

  const mergeSuggestions = (apiResults, localResults) => {
    const merged = new Map();

    const buildKey = (item) => {
      const baseType = normalizeText(item.type || "product");
      const normalizedName = normalizeText(item.name);
      const normalizedBrand = normalizeText(item.brand_name || item.brand);
      const normalizedProductType = normalizeText(item.product_type);
      const rawId = item.id ?? item.product_id ?? item.productId ?? "";
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

    return Array.from(merged.values())
      .sort((a, b) => a.__priority - b.__priority)
      .map(({ __priority, searchable_text, ...rest }) => rest);
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
      const qLower = q.toLowerCase();
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
        const apiResults = (json.results || []).map((it) => ({
          ...it,
        }));

        const localMatches = localSearchSuggestions
          .filter((item) => item.searchable_text.includes(qLower))
          .slice(0, 12);

        const merged = mergeSuggestions(apiResults, localMatches).slice(0, 12);
        setSearchSuggestions(merged);
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error("Search suggestions error:", err);
        const localMatches = localSearchSuggestions
          .filter((item) => item.searchable_text.includes(qLower))
          .slice(0, 12)
          .map(({ searchable_text, ...rest }) => rest);
        setSearchSuggestions(localMatches);
      } finally {
        setIsSearching(false);
      }
    }, 250);
  };

  const trackSearchInterest = (payload) => {
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
        keepalive: true,
      }).catch(() => {});
    } catch (err) {
      // analytics should never block navigation
    }
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
      trackSearchInterest({
        query: String(item.name || item.model || searchQuery || "").trim(),
        product_id: item.id,
        source: "suggestion",
      });
      navigate(finalPath);
    } else if (item.type === "brand") {
      trackSearchInterest({
        query: String(item.name || searchQuery || "").trim(),
        source: "brand-suggestion",
      });
      // Navigate to brand search / results
      navigate(`/search?brand=${encodeURIComponent(item.name)}`);
    } else {
      trackSearchInterest({
        query: String(item.name || searchQuery || "").trim(),
        source: "search-suggestion",
      });
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
        { name: "Latest Releases" },
        { name: "Upcoming Phones" },
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
      id: "laptops",
      name: "Laptops",
      icon: <FaLaptop />,
      // Column 1 – Browse
      subcategories: [
        { name: "All Laptops" },
        { name: "Latest Releases" },
        { name: "Top Laptops" },
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
        { name: "Under â‚¹30,000", discount: "", icon: <FaTag /> },
        { name: "Under â‚¹50,000", discount: "", icon: <FaTag /> },
        { name: "Under â‚¹80,000", discount: "", icon: <FaTag /> },
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
    } catch (e) {
      return cat;
    }
  });

  // Top navigation links
  const exploreDropdownLinks = [
    { name: "Smartphones", link: "/smartphones" },
    { name: "Laptops", link: "/laptops" },
    { name: "TVs", link: "/tvs" },
  ];
  const isCompareRoute = currentPath.startsWith("/compare");
  const browseNavLabel = isCompareRoute ? "Home" : "Explore";
  const browseNavLink = isCompareRoute ? "/" : "explore";

  const directLinks = [
    {
      name: browseNavLabel,
      link: browseNavLink,
      caret: !isCompareRoute,
      dropdownItems: isCompareRoute ? undefined : exploreDropdownLinks,
    },
    { name: "Compare", link: "/compare" },
    { name: "Upcoming Mobiles", link: "/smartphones/upcoming" },
    { name: "Latest Mobiles", link: "/smartphones/filter/new" },
    { name: "Trending Mobiles", link: "/trending/smartphones" },
    { name: "Phone Finder", link: "/" },
    // { name: "News & Articles", link: "/blogs", caret: true },
  ];

  const isActiveNavLink = (href) => {
    const target = String(href || "").toLowerCase();
    if (!target) return false;
    if (target === "/") return currentPath === "/";
    if (target === "/compare")
      return currentPath === "/compare" || currentPath.startsWith("/compare/");
    if (target === "/smartphones/upcoming")
      return currentPath === "/smartphones/upcoming";
    if (target === "/smartphones/filter/new")
      return currentPath === "/smartphones/filter/new";
    if (target === "/trending/smartphones")
      return currentPath === "/trending/smartphones";
    if (target === "/laptops") return currentPath === "/laptops";
    if (target === "/tvs") return currentPath === "/tvs";
    return currentPath === target || currentPath.startsWith(`${target}/`);
  };

  const utilityItems = [
    { name: "Wishlist", icon: <FaHeart />, count: 1, link: "/wishlist" },
  ];

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    const query = String(searchQuery || "").trim();
    if (query) {
      trackSearchInterest({
        query,
        source: "header",
      });
      navigate(`/search?q=${encodeURIComponent(query)}`);
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
                let href = `/${category.id}`;
                if (name.includes("new")) {
                  href = isSmartphonesCategory
                    ? "/smartphones/filter/new"
                    : `/${category.id}?filter=new`;
                } else if (name.includes("trending")) {
                  href = isSmartphonesCategory
                    ? "/smartphones/filter/trending"
                    : `/${category.id}?filter=trending`;
                } else if (name.includes("compare")) {
                  href = `/compare?type=${category.id}`;
                }

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
            : "w-full flex items-center gap-3 border-b border-blue-100/70 px-4 sm:px-5 py-4 last:border-b-0"
        }`}
      >
        <div className="h-12 w-12 shrink-0 rounded-2xl bg-gradient-to-br from-blue-100 via-indigo-100 to-cyan-100 ring-1 ring-blue-100" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-4 w-3/5 rounded-full bg-slate-200/90" />
          <div className="h-3 w-4/5 rounded-full bg-slate-100" />
          <div className="flex flex-wrap gap-2 pt-1">
            <div className="h-5 w-16 rounded-full bg-blue-100/80" />
            <div className="h-5 w-20 rounded-full bg-slate-100" />
          </div>
        </div>
        {!isMobileVariant ? (
          <div className="h-4 w-4 shrink-0 rounded-full bg-slate-200/80" />
        ) : null}
      </div>
    );
  };

  const SuggestionPanelHeader = ({
    query,
    count,
    isSearching: panelSearching = false,
  }) => (
    <div className="border-b border-blue-100/70 bg-gradient-to-r from-blue-50 via-white to-cyan-50 px-4 py-3 sm:px-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#345ce3] via-blue-500 to-cyan-400 text-white shadow-[0_12px_24px_rgba(52,92,227,0.24)]">
            <FaSearch className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#345ce3]">
              Hooks search
            </p>
            <p className="truncate text-sm font-semibold text-slate-900">
              Suggestions for "{query}"
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {panelSearching ? (
            <span className="rounded-full bg-[#345ce3]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#345ce3]">
              Live
            </span>
          ) : null}
          <span className="rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold text-slate-600 ring-1 ring-blue-100">
            {count} matches
          </span>
        </div>
      </div>
    </div>
  );

  const SuggestionEmptyState = ({ query, variant = "desktop" }) => (
    <div
      className={`flex flex-col items-center justify-center text-center ${
        variant === "mobile" ? "px-6 py-10" : "px-4 py-8"
      }`}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 via-white to-cyan-50 text-[#345ce3] ring-1 ring-blue-100">
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

  // Text Highlight Component
  const HighlightText = ({ text, query }) => {
    if (!query || !text) return text;
    const safeQuery = escapeRegExp(query);
    if (!safeQuery) return text;
    const parts = String(text).split(new RegExp(`(${safeQuery})`, "gi"));
    return (
      <>
        {parts.map((part, idx) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <span
              key={idx}
              className="rounded-md bg-[#345ce3]/10 px-1.5 py-0.5 font-semibold text-[#345ce3]"
            >
              {part}
            </span>
          ) : (
            <span key={idx}>{part}</span>
          ),
        )}
      </>
    );
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
    const typeLabel = getSuggestionTypeLabel(suggestion);
    const subtitle = getSuggestionSubtitle(suggestion);
    const chips = buildSuggestionChips(suggestion, variant);
    const TypeIcon = getSuggestionTypeIcon(suggestion);
    const imageUrl = getSuggestionImage(suggestion);
    const isBrand = String(suggestion?.type || "").toLowerCase() === "brand";

    const buttonClasses = isMobileVariant
      ? `group w-full overflow-hidden rounded-2xl border px-4 py-4 text-left shadow-[0_12px_30px_rgba(59,130,246,0.08)] transition-all duration-200 ${
          selected
            ? "border-blue-200 bg-blue-50/90 shadow-[0_16px_36px_rgba(59,130,246,0.14)]"
            : "border-blue-100 bg-white/95 hover:border-blue-200 hover:shadow-[0_16px_36px_rgba(59,130,246,0.12)] active:bg-blue-50"
        }`
      : `group relative flex w-full items-center gap-3 px-4 sm:px-5 py-3.5 text-left transition-all duration-200 border-b border-blue-100/70 last:border-b-0 ${
          selected
            ? "bg-blue-50/90"
            : "bg-white/90 hover:bg-blue-50/60 active:bg-blue-100/70"
        }`;

    const badgeClasses = isBrand
      ? "bg-amber-50 text-amber-700 ring-amber-100"
      : "bg-blue-50 text-[#345ce3] ring-blue-100";

    return (
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onActivate?.(suggestion);
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
          className={`relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md ring-1 ring-blue-100 transition group-hover:ring-blue-200 ${
            imageUrl
              ? "bg-white"
              : "bg-gradient-to-br from-blue-50 via-white to-cyan-50"
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
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold leading-snug text-slate-900 transition group-hover:text-[#345ce3] sm:text-[15px]">
                <HighlightText
                  text={readFirstText(suggestion?.name, suggestion?.model)}
                  query={query}
                />
              </p>
              <p className="mt-0.5 truncate text-xs text-slate-500 sm:text-[13px]">
                {subtitle}
              </p>
            </div>

            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ring-1 ${badgeClasses}`}
            >
              {typeLabel}
            </span>
          </div>

          {chips.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {chips.map((chip) => (
                <span
                  key={`${chip.label}-${chip.tone}`}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${chip.tone}`}
                >
                  {chip.label}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <FaChevronRight
          className={`relative shrink-0 transition group-hover:translate-x-0.5 group-hover:text-[#345ce3] ${
            isMobileVariant
              ? "h-4 w-4 text-slate-400"
              : "h-3.5 w-3.5 text-slate-300"
          }`}
        />
      </button>
    );
  };

  // Flipkart-Style Search Modal - Mobile Optimized
  const SearchModal = () => {
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
                      className="w-full px-4 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-gradient-to-r from-blue-50/80 via-white to-cyan-50/60 border border-blue-100 rounded-full shadow-sm focus:outline-none focus:border-[#345ce3] focus:ring-2 focus:ring-[#345ce3]/10 transition-all placeholder-slate-400 font-medium"
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
                                  <SkeletonSuggestion key={`skeleton-${i}`} />
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
                              .slice(0, 7)
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
                            <SuggestionEmptyState
                              query={searchQuery}
                              variant="mobile"
                            />
                          )}
                      </>
                    ) : (
                      /* Suggestions List for Mobile */
                      <div className="space-y-3">
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
                            className="group relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border border-blue-100 bg-white/95 p-4 text-left shadow-[0_12px_30px_rgba(59,130,246,0.08)] transition-all duration-200 hover:border-blue-200 hover:shadow-[0_16px_36px_rgba(59,130,246,0.12)] active:bg-blue-50 min-h-[64px]"
                          >
                            {/* Product Thumbnail */}
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-white to-cyan-50 ring-1 ring-blue-100">
                              {getSuggestionImage(sugg) ? (
                                <img
                                  src={getSuggestionImage(sugg)}
                                  alt={sugg.name}
                                  className="w-full h-full object-contain"
                                  loading="lazy"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                  }}
                                />
                              ) : (
                                <span className="font-bold text-sm text-[#345ce3]">
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

                            {/* Text Content */}
                            <div className="flex-1 min-w-0">
                              <div className="truncate text-[13px] font-semibold leading-snug text-slate-900 group-hover:text-[#345ce3]">
                                <HighlightText
                                  text={sugg.name}
                                  query={searchQuery}
                                />
                              </div>
                              <div className="mt-1 text-xs text-slate-500">
                                {sugg.type === "product" ? (
                                  <div className="min-w-0">
                                    <div className="truncate">
                                      {sugg.brand_name ||
                                        sugg.model ||
                                        sugg.product_type ||
                                        "Product"}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                      {getSuggestionVariantTypes(sugg).map(
                                        (v) => (
                                          <span
                                            key={v}
                                            className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-[#345ce3] ring-1 ring-blue-100"
                                          >
                                            {v}
                                          </span>
                                        ),
                                      )}
                                      {formatINR(
                                        sugg.min_price ?? sugg.minPrice,
                                      ) && (
                                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-100">
                                          From{" "}
                                          {formatINR(
                                            sugg.min_price ?? sugg.minPrice,
                                          )}
                                        </span>
                                      )}
                                    </div>
                                    {getSuggestionFeatures(sugg).length > 0 && (
                                      <div className="mt-1 truncate text-[11px] text-slate-500">
                                        {getSuggestionFeatures(sugg).join(
                                          " • ",
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  sugg.type || ""
                                )}
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

  // Main Header Component - Desktop + Mobile (Clean Minimal Design)
  const MainHeader = () => (
    <>
      {/* MOBILE HEADER (≤ 768px) */}
      <div
        ref={mobileHeaderRef}
        className="md:hidden border-b bg-white border-gray-200 z-40"
      >
        {/* Mobile Top Row: Menu | Logo | Actions */}
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <button
              className="inline-flex h-10 w-10 items-center justify-center  text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
              onClick={() => setIsMenuOpen(true)}
              aria-label="Open menu"
            >
              <FaBars className="h-5 w-5" />
            </button>

            <Link to="/" className="flex min-w-0 items-center">
              <BrandIdentity variant="mobile" />
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setShowSearchSuggestions(false);
                setSelectedSuggestionIndex(-1);
                setIsSearchOpen(true);
              }}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
              aria-label="Open search"
            >
              <FaSearch className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* DESKTOP HEADER (> 768px) - Clean Minimal Design like Beebom */}
      <div className="hidden md:block bg-white sticky top-0 z-40 border-b border-gray-200">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 lg:py-4">
          {/* Header Row: Logo | Search | Login */}
          <div className="flex items-center justify-between gap-3 sm:gap-4 lg:gap-6">
            {/* Logo */}
            <Link to="/" className="flex-shrink-0">
              <BrandIdentity variant="desktop" />
            </Link>

            {/* Search Bar - Responsive */}
            <div
              ref={searchRef}
              className="flex-1 min-w-0 max-w-sm sm:max-w-md lg:max-w-lg xl:max-w-2xl relative"
            >
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#345ce3] sm:w-4 sm:h-4" />
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
                className="w-full rounded-full border border-blue-100 bg-gradient-to-r from-blue-50/80 via-white to-cyan-50/60 py-2 pl-9 pr-3 text-sm placeholder-slate-400  transition-all focus:outline-none focus:border-[#345ce3] focus:ring-2 focus:ring-[#345ce3]/10 sm:py-2.5 sm:text-base"
              />

              {/* Desktop Suggestions Dropdown */}
              {showSearchSuggestions && searchQuery.trim() && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                  {isSearching ? (
                    <div className="p-3 space-y-2">
                      {[...Array(3)].map((_, i) => (
                        <SkeletonSuggestion key={`skel-${i}`} />
                      ))}
                    </div>
                  ) : searchSuggestions.length === 0 ? (
                    <div className="w-full text-center py-8 px-4">
                      <p className="text-sm font-medium text-gray-900">
                        No products found
                      </p>
                      <p className="text-xs text-gray-500">
                        Try different keywords
                      </p>
                    </div>
                  ) : (
                    searchSuggestions.slice(0, 6).map((sugg, index) => (
                      <button
                        key={index}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSuggestionClick(sugg);
                        }}
                        onMouseEnter={() => setSelectedSuggestionIndex(index)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-purple-50 text-left text-sm sm:text-base border-b border-gray-100 last:border-b-0 transition-colors"
                      >
                        {sugg.image_url && (
                          <img
                            src={sugg.image_url}
                            alt={sugg.name}
                            className="w-8 h-8 sm:w-10 sm:h-10 object-contain flex-shrink-0"
                          />
                        )}
                        <span className="font-medium text-gray-900 truncate">
                          {sugg.name}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Account Menu */}
            <div className="relative flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowAuthDropdown((prev) => !prev)}
                className="auth-button inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-blue-200 hover:bg-slate-50 hover:text-slate-900"
                aria-haspopup="menu"
                aria-expanded={showAuthDropdown}
              >
                <FaUser className="h-4 w-4 text-slate-500" />
                <span>Account</span>
                <FaChevronDown
                  className={`h-3 w-3 text-slate-400 transition-transform duration-200 ${
                    showAuthDropdown ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showAuthDropdown ? <AuthDropdown /> : null}
            </div>
          </div>
        </div>
        {/* Navigation Links */}
        <div className="w-full bg-blue-50">
          <div className="mx-auto max-w-7xl px-6">
            <div className="flex items-center gap-2 py-1 overflow-visible">
              {directLinks.map((link) =>
                link.dropdownItems &&
                !(
                  currentPath.startsWith("/compare") && link.name === "Explore"
                ) ? (
                  <div
                    key={`${link.link}-${link.name}`}
                    className="relative group"
                  >
                    <button
                      type="button"
                      className={`inline-flex cursor-default items-center gap-1 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition ${
                        currentPath.startsWith("/compare") ||
                        currentPath.startsWith("/smartphones") ||
                        currentPath.startsWith("/trending")
                          ? "text-gray-700 hover:text-blue-600"
                          : "text-gray-700 hover:text-blue-600"
                      }`}
                    >
                      {link.name}
                      {link.caret && <FaChevronDown className="h-3 w-3" />}
                    </button>

                    <div className="absolute left-0 top-full z-50 mt-1 hidden min-w-56  border border-blue-100 bg-white p-2 group-hover:block group-focus-within:block">
                      <div className="px-3 py-2">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-500">
                          Browse categories
                        </p>
                      </div>
                      <div className="space-y-1">
                        {link.dropdownItems.map((item) => (
                          <Link
                            key={item.link}
                            to={item.link}
                            className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-blue-50 hover:text-blue-700"
                          >
                            <span>{item.name}</span>
                            <FaChevronRight className="h-3 w-3 text-gray-400" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <Link
                    key={`${link.link}-${link.name}`}
                    to={
                      currentPath.startsWith("/compare") &&
                      link.name === "Explore"
                        ? "/"
                        : link.link
                    }
                    className={`inline-flex items-center gap-1 whitespace-nowrap px-3 py-2 text-sm font-medium transition ${
                      isActiveNavLink(link.link)
                        ? "text-blue-700"
                        : "text-gray-700 hover:text-blue-600"
                    }`}
                  >
                    {link.name}
                    {link.caret &&
                    !(
                      currentPath.startsWith("/compare") &&
                      link.name === "Explore"
                    ) ? (
                      <FaChevronDown className="h-3 w-3" />
                    ) : null}
                  </Link>
                ),
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Navigation Bar (Optional) */}
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
  const MobileMenuDrawer = () => {
    const [openSection, setOpenSection] = useState("");
    const smartphoneCategory =
      categoriesWithBrands.find(
        (category) => String(category.id || "").toLowerCase() === "smartphones",
      ) ||
      categoriesWithBrands[0] ||
      null;
    const phoneSource = Array.isArray(smartphones) ? smartphones : [];
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

    const getTitle = (device) =>
      normalizeName(
        device?.name || device?.model || device?.title || device?.slug || "",
      );

    const parseDate = (device) => {
      const candidates = [
        device?.updated_at,
        device?.updatedAt,
        device?.created_at,
        device?.createdAt,
        device?.launch_date,
        device?.launchDate,
        device?.release_date,
        device?.releaseDate,
      ];
      for (const candidate of candidates) {
        if (!candidate) continue;
        const timestamp = Date.parse(candidate);
        if (!Number.isNaN(timestamp)) return timestamp;
      }
      return 0;
    };

    const isUpcomingDevice = (device) => {
      const text = [
        device?.launch_status,
        device?.status,
        device?.availability,
        device?.release_status,
        device?.name,
        device?.model,
        device?.title,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (
        /(upcoming|coming soon|expected|launching soon|preorder|pre-order|announced|rumored)/i.test(
          text,
        )
      ) {
        return true;
      }

      const futureDates = [
        device?.launch_date,
        device?.launchDate,
        device?.release_date,
        device?.releaseDate,
      ].filter(Boolean);
      return futureDates.some((value) => {
        const ts = Date.parse(value);
        return !Number.isNaN(ts) && ts > Date.now();
      });
    };

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
        href: `/smartphones?brand=${encodeURIComponent(name)}`,
      }));

    const priceItems = [
      {
        label: "Best Phones Under 10,000",
        href: "/smartphones?priceMax=10000",
      },
      {
        label: "Best Phones Under 15,000",
        href: "/smartphones?priceMax=15000",
      },
      {
        label: "Best Phones Under 20,000",
        href: "/smartphones?priceMax=20000",
      },
      {
        label: "Best Phones Under 25,000",
        href: "/smartphones?priceMax=25000",
      },
      {
        label: "Best Phones Under 30,000",
        href: "/smartphones?priceMax=30000",
      },
      {
        label: "Best Phones Under 40,000",
        href: "/smartphones?priceMax=40000",
      },
      {
        label: "Best Phones Under 50,000",
        href: "/smartphones?priceMax=50000",
      },
      {
        label: "Best Phones Under 60,000",
        href: "/smartphones?priceMax=60000",
      },
    ];

    const featureItems = [
      { label: "5G Phones", href: "/smartphones?feature=5g" },
      { label: "AMOLED", href: "/smartphones?feature=amoled" },
      { label: "120Hz+", href: "/smartphones?feature=high-refresh-rate" },
      { label: "Long Battery", href: "/smartphones?feature=long-battery" },
      { label: "Fast Charge", href: "/smartphones?feature=fast-charging" },
      { label: "Gaming", href: "/smartphones?feature=gaming" },
    ];

    const popularItems = phoneSource.slice(0, 6).map((device) => ({
      label: getTitle(device),
      href: createProductPath(
        "smartphones",
        device?.model || device?.name || device?.slug || device?.id || "",
      ),
    }));

    const latestItems = [...phoneSource]
      .sort((a, b) => parseDate(b) - parseDate(a))
      .slice(0, 6)
      .map((device) => ({
        label: getTitle(device),
        href: createProductPath(
          "smartphones",
          device?.model || device?.name || device?.slug || device?.id || "",
        ),
      }));

    const upcomingSource = phoneSource.filter(isUpcomingDevice).slice(0, 6);
    const upcomingItems = upcomingSource.length
      ? upcomingSource.map((device) => ({
          label: getTitle(device),
          href: createProductPath(
            "smartphones",
            device?.model || device?.name || device?.slug || device?.id || "",
          ),
        }))
      : [{ label: "View upcoming phones", href: "/smartphones/upcoming" }];

    const quickLinks = [
      { label: "Home", href: "/", icon: <FaHome className="h-4 w-4" /> },
      {
        label: "Compare",
        href: "/compare",
        icon: <FaBalanceScale className="h-4 w-4" />,
      },
      {
        label: "Brands",
        href: "/brands",
        icon: <FaStore className="h-4 w-4" />,
      },
      {
        label: "Explore",
        icon: <FaTag className="h-4 w-4" />,
        dropdownItems: exploreDropdownLinks,
      },
      ...(isLoggedIn
        ? [
            {
              label: "Wishlist",
              href: "/wishlist",
              icon: <FaHeart className="h-4 w-4" />,
            },
          ]
        : []),
    ];

    const sections = [
      { id: "price", title: "Best Phones by Price", items: priceItems },
      {
        id: "brands",
        title: "Popular Brands",
        items: brandItems,
        footer: { label: "All Brands", href: "/brands" },
      },
      { id: "features", title: "Browse by Feature", items: featureItems },
      { id: "popular", title: "Popular Mobiles", items: popularItems },
      { id: "latest", title: "Latest Phones", items: latestItems },
      { id: "upcoming", title: "Upcoming Mobiles", items: upcomingItems },
    ];

    return (
      <>
        {isMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-sm lg:hidden"
              onClick={() => setIsMenuOpen(false)}
            />

            <div
              className={`fixed inset-y-0 left-0 z-50 w-[296px] max-w-[84vw] transform overflow-hidden rounded-none border-r border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] shadow-[24px_0_60px_rgba(15,23,42,0.18)] transition-transform duration-300 lg:hidden ${
                isMenuOpen ? "translate-x-0" : "-translate-x-full"
              }`}
            >
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f3f8ff_100%)] px-4 py-4">
                  <Link
                    to="/"
                    className="flex items-center min-w-0"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <BrandIdentity variant="drawer" />
                  </Link>
                  <button
                    type="button"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition-colors duration-200 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                    onClick={() => setIsMenuOpen(false)}
                    aria-label="Close menu"
                  >
                    <FaTimes className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto px-3 py-4">
                  <div className="mb-5">
                    <div className="px-3 pb-2 pt-1">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-600">
                        Quick Links
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Start with the most used pages
                      </p>
                    </div>
                    <div className="space-y-1">
                      {quickLinks.map((item) =>
                        item.dropdownItems ? (
                          <div
                            key={item.label}
                            className="overflow-hidden border border-slate-100 bg-slate-50/60"
                          >
                            <button
                              type="button"
                              className="group flex w-full cursor-default items-center justify-between px-3 py-3 text-[13px] font-medium text-slate-800 transition-all duration-200 hover:bg-slate-100 hover:text-slate-950"
                            >
                              <span className="flex min-w-0 items-center gap-3">
                                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-gradient-to-br from-blue-50 via-white to-cyan-50 text-blue-700 transition-colors group-hover:border-blue-100 group-hover:text-blue-800">
                                  {item.icon}
                                </span>
                                <span className="truncate transition-colors">
                                  {item.label}
                                </span>
                              </span>
                              <FaChevronDown className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
                            </button>
                            <div className="border-t border-slate-100 bg-white p-2">
                              <div className="grid grid-cols-1 gap-1">
                                {item.dropdownItems.map((dropdownItem) => (
                                  <Link
                                    key={dropdownItem.link}
                                    to={dropdownItem.link}
                                    onClick={() => setIsMenuOpen(false)}
                                    className="group flex items-center justify-between rounded-lg px-3 py-2.5 text-[13px] font-medium text-slate-700 transition-colors hover:bg-blue-50 hover:text-blue-700"
                                  >
                                    <span>{dropdownItem.name}</span>
                                    <FaChevronRight className="h-3 w-3 text-slate-400 transition-colors group-hover:text-blue-600" />
                                  </Link>
                                ))}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <Link
                            key={item.label}
                            to={item.href}
                            onClick={() => setIsMenuOpen(false)}
                            className="group flex items-center justify-between rounded-xl px-3 py-3 text-[13px] font-medium text-slate-800 transition-all duration-200 hover:bg-slate-50 hover:text-slate-950"
                          >
                            <span className="flex min-w-0 items-center gap-3">
                              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-gradient-to-br from-blue-50 via-white to-cyan-50 text-blue-700 transition-colors group-hover:border-blue-100 group-hover:text-blue-800">
                                {item.icon}
                              </span>
                              <span className="truncate transition-colors">
                                {item.label}
                              </span>
                            </span>
                            <FaChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-slate-400 transition-colors group-hover:text-blue-600" />
                          </Link>
                        ),
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {sections.map((section) => {
                      const isOpen = openSection === section.id;

                      return (
                        <section
                          key={section.id}
                          className="overflow-hidden bg-white transition-all duration-200"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setOpenSection(isOpen ? "" : section.id)
                            }
                            className={`flex w-full items-center justify-between px-4 py-4 text-left transition-colors duration-200 ${
                              isOpen ? "bg-blue-50/70" : "hover:bg-slate-50"
                            }`}
                          >
                            <span
                              className={`text-[15px] font-semibold ${
                                isOpen ? "text-blue-900" : "text-slate-900"
                              }`}
                            >
                              {section.title}
                            </span>
                            <span
                              className={`flex h-8 w-8 items-center justify-center rounded-full border transition-all duration-200 ${
                                isOpen
                                  ? "border-blue-200 bg-white text-blue-700"
                                  : "border-slate-200 bg-slate-50 text-slate-700"
                              }`}
                            >
                              <FaChevronDown
                                className={`h-4 w-4 transition-transform duration-200 ${
                                  isOpen ? "rotate-180" : ""
                                }`}
                              />
                            </span>
                          </button>

                          {isOpen ? (
                            <div className="bg-slate-50/80 p-2">
                              <ul className="space-y-0.5">
                                {section.items.map((item) => (
                                  <li key={`${section.id}-${item.label}`}>
                                    <Link
                                      to={item.href}
                                      onClick={() => setIsMenuOpen(false)}
                                      className="group flex items-start gap-3 rounded-xl px-3 py-2.5 text-[14px] leading-6 text-slate-800 transition-all duration-200 hover:bg-white hover:text-blue-700 hover:shadow-sm"
                                    >
                                      <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-blue-600/80 transition-colors group-hover:bg-blue-700" />
                                      <span className="font-medium">
                                        {item.label}
                                      </span>
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                              {section.footer ? (
                                <Link
                                  to={section.footer.href}
                                  onClick={() => setIsMenuOpen(false)}
                                  className="mt-2 inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-[14px] font-semibold text-blue-700 transition-colors hover:bg-blue-50 hover:text-blue-800"
                                >
                                  <span>{section.footer.label}</span>
                                  <FaChevronRight className="h-3.5 w-3.5" />
                                </Link>
                              ) : null}
                            </div>
                          ) : null}
                        </section>
                      );
                    })}
                  </div>
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
        className="sticky top-0 left-0 right-0 z-40 bg-white"
      >
        <MainHeader />
        <CategoryNavBar />
      </header>

      <MobileMenuDrawer
        key={isMenuOpen ? "mobile-menu-open" : "mobile-menu-closed"}
      />
    </>
  );
};

export default Header;
