// src/components/ApplianceDetailCard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import useDevice from "../../hooks/useDevice";
import Cookies from "js-cookie";
import { generateSlug, extractNameFromSlug } from "../../utils/slugGenerator";

// Icons
import {
  FaStar,
  FaHeart,
  FaShare,
  FaCopy,
  FaCheck,
  FaExternalLinkAlt,
  FaStore,
  FaChevronDown,
  FaTag,
  FaInfoCircle,
  FaBolt,
  FaWater,
  FaSnowflake,
  FaTv,
  FaFan,
  FaThermometerHalf,
  FaWeight,
  FaRuler,
  FaShieldAlt,
  FaWrench,
  FaClock,
  FaVolumeUp,
  FaGamepad,
  FaShoppingCart,
  FaBalanceScale,
  FaMicrochip,
  FaExpand,
  FaWifi,
  FaBluetooth,
  FaFire,
  FaWind,
  FaBatteryFull,
  FaMemory,
  FaMobile,
  FaCamera,
  FaChartBar,
  FaShareAlt,
  FaWhatsapp,
  FaFacebook,
  FaTwitter,
  FaEnvelope,
  FaLink,
  FaRegStar,
  FaStarHalfAlt,
} from "react-icons/fa";

import "../../styles/hideScrollbar.css";
import Spinner from "../ui/Spinner";
import { Helmet } from "react-helmet-async";
import { homeApplianceMeta } from "../../constants/meta";
import RatingReview from "../ui/RatingReview";
import useStoreLogos from "../../hooks/useStoreLogos";

// Ratings UI removed: review submission and inline rating input deleted

// Data comes from API via `useDevice()`; embedded mock removed.
const mockAppliances = [];

// Default ratings data
const DEFAULT_RATINGS = {
  averageRating: 4.2,
  totalRatings: 128,
  performance: 4.3,
  features: 4.1,
  durability: 4.4,
  energyEfficiency: 4.0,
  design: 4.2,
};

const ApplianceDetailCard = () => {
  const { getLogo } = useStoreLogos();
  const [activeTab, setActiveTab] = useState("specifications");
  const [activeImage, setActiveImage] = useState(0);
  const [showAllSpecs, setShowAllSpecs] = useState(false);
  const [showAllStores, setShowAllStores] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [copied, setCopied] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [ratingsData, setRatingsData] = useState(DEFAULT_RATINGS);
  // Review form removed

  const [loading, setLoading] = useState(false);
  const [applianceData, setApplianceData] = useState(null);
  const navigate = useNavigate();

  // Get category from URL or default to washing machine
  const params = useParams();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const categoryParam = query.get("category") || "washing_machine";
  let idParam = query.get("id");

  // Extract slug from route params (SEO-friendly slug-based URL)
  const routeSlug = params.slug || null;

  // Convert slug to searchable model name
  const modelFromSlug = routeSlug ? extractNameFromSlug(routeSlug) : null;
  const searchModel = query.get("model") || modelFromSlug;

  const { homeAppliances, homeAppliancesLoading, refreshHomeAppliances } =
    useDevice();

  // Helper function to find appliance by slug locally
  const findApplianceBySlug = (slug) => {
    if (!slug || !Array.isArray(homeAppliances)) return null;
    const searchSlug = generateSlug(slug);
    return homeAppliances.find(
      (a) =>
        generateSlug(a.name || a.product_name || a.model || "") ===
          searchSlug || generateSlug(a.model_number || "") === searchSlug,
    );
  };

  const normalizeAppliance = (a) => {
    if (!a) return null;

    const rawVariants = Array.isArray(a.variants)
      ? a.variants
      : a.variant
        ? Array.isArray(a.variant)
          ? a.variant
          : [a.variant]
        : [];

    const variants = rawVariants.map((v) => {
      const storePrices = Array.isArray(v.store_prices)
        ? v.store_prices.map((sp) => ({
            ...sp,
            id: sp.id || sp.store_id || null,
            store_name: sp.store_name || sp.store || "",
            price: sp.price ?? sp.amount ?? null,
            url: sp.url || sp.link || "",
            delivery_time: sp.delivery_info || sp.delivery_time || null,
          }))
        : Array.isArray(v.attributes?.stores)
          ? v.attributes.stores.map((sp) => ({
              id: sp.id || null,
              store_name: sp.store_name || sp.store || "",
              price: sp.price ?? sp.amount ?? null,
              url: sp.url || sp.link || "",
              delivery_time: sp.delivery_info || null,
            }))
          : [];

      return {
        ...v,
        id: v.id || v.variant_id || v.variantId || null,
        variant_id: v.variant_id || v.id || v.variantId || null,
        base_price: v.base_price ?? v.attributes?.base_price ?? null,
        store_prices: storePrices,
        specification_summary: v.specification_summary || v.variant_key || "",
      };
    });

    return {
      ...a,
      id: a.product_id || a.id || a.productId || null,
      product_name: a.name || a.product_name || "",
      model_number: a.model_number || a.model || "",
      brand: a.brand_name || a.brand || "",
      appliance_type: a.appliance_type || a.category || a.type || "",
      category: a.category || a.appliance_type || a.applianceType || "",
      variants,
      specifications: { ...(a.specifications || {}), ...(a.specs || {}) },
      images: a.images || a.pictures || [],
    };
  };

  useEffect(() => {
    setLoading(true);

    const timer = setTimeout(() => {
      let selected = null;
      let variantIndex = 0;

      const source = Array.isArray(homeAppliances) ? homeAppliances : [];

      // params we care about
      const brandParam = query.get("brand");
      const modelParam = query.get("model") || query.get("modelNumber");
      const variantIdParam = query.get("variantId") || query.get("variant_id");
      const storeNameParam = query.get("storeName") || query.get("store");

      // 0) Try to find by slug first (for direct slug-based URL access)
      if (!selected && routeSlug && Array.isArray(source)) {
        selected = findApplianceBySlug(routeSlug);
      }

      // 1) variantId preferred
      if (variantIdParam && Array.isArray(source) && source.length) {
        for (const dev of source) {
          const vars = Array.isArray(dev.variants) ? dev.variants : [];
          const idx = vars.findIndex(
            (v) =>
              String(v.variant_id || v.id || v.variantId) ===
              String(variantIdParam),
          );
          if (idx >= 0) {
            selected = dev;
            variantIndex = idx;
            break;
          }
        }
      }

      // 2) brand + model
      if (!selected && brandParam && modelParam && Array.isArray(source)) {
        const b = brandParam.toLowerCase();
        const m = modelParam.toLowerCase();
        for (const dev of source) {
          const brandVal = (dev.brand_name || dev.brand || "")
            .toString()
            .toLowerCase();
          const nameVal = (
            dev.name ||
            dev.product_name ||
            dev.model_number ||
            ""
          )
            .toString()
            .toLowerCase();
          if (brandVal === b && (nameVal.includes(m) || nameVal === m)) {
            selected = dev;
            break;
          }
        }
      }

      // 3) brand only
      if (!selected && brandParam && Array.isArray(source)) {
        const b = brandParam.toLowerCase();
        for (const dev of source) {
          const brandVal = (dev.brand_name || dev.brand || "")
            .toString()
            .toLowerCase();
          if (brandVal === b) {
            selected = dev;
            break;
          }
        }
      }

      // 4) id fallback or first
      if (!selected && Array.isArray(source) && source.length) {
        if (idParam) {
          selected = source.find(
            (d) =>
              String(d.product_id) === String(idParam) ||
              String(d.id) === String(idParam),
          );
        }
        if (!selected) selected = source[0] || null;
      }

      // try to pick variant by store name
      if (selected && storeNameParam) {
        const vars = Array.isArray(selected.variants) ? selected.variants : [];
        for (let i = 0; i < vars.length; i++) {
          const v = vars[i];
          const sp = Array.isArray(v.store_prices) ? v.store_prices : [];
          if (
            sp.find(
              (s) =>
                (s.store_name || s.store || "").toString().toLowerCase() ===
                storeNameParam.toLowerCase(),
            )
          ) {
            variantIndex = i;
            break;
          }
        }
      }

      setApplianceData(normalizeAppliance(selected));
      setSelectedVariant(Math.max(0, variantIndex));
      setLoading(false);
    }, 200);

    return () => clearTimeout(timer);
  }, [window.location.search, homeAppliances]);

  // Redirect to canonical SEO-friendly appliance URL when data available
  useEffect(() => {
    if (!applianceData || !routeSlug) return;

    const canonicalSlug = generateSlug(
      applianceData.name || applianceData.model || applianceData.brand || "",
    );
    if (!canonicalSlug) return;
    const desiredPath = `/appliances/${canonicalSlug}`;
    const currentPath = window.location.pathname;
    if (currentPath !== desiredPath) {
      navigate(desiredPath + (location.search || ""), { replace: true });
    }
  }, [applianceData, routeSlug, navigate, location.search]);

  // Record a single product view per browser session for home appliances.
  useEffect(() => {
    const productIdRaw =
      applianceData?.product_id ||
      applianceData?.productId ||
      applianceData?.id;
    const pid = Number(productIdRaw);
    if (!Number.isInteger(pid) || pid <= 0) return;

    try {
      const viewedKey = `viewed_product_${pid}`;
      if (
        typeof sessionStorage !== "undefined" &&
        sessionStorage.getItem(viewedKey)
      )
        return;

      fetch(`https://api.apisphere.in/api/public/product/${pid}/view`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }).catch((err) => console.error("View insert failed", err));

      try {
        if (typeof sessionStorage !== "undefined")
          sessionStorage.setItem(viewedKey, "true");
      } catch (err) {}
    } catch (err) {
      console.error("Product view tracking error:", err);
    }
  }, [applianceData?.product_id, applianceData?.productId, applianceData?.id]);

  // Get category-specific icon
  const getCategoryIcon = () => {
    switch (applianceData?.category?.toLowerCase()) {
      case "washing machine":
        return FaWater;
      case "air conditioner":
      case "ac":
        return FaSnowflake;
      case "television":
      case "tv":
        return FaTv;
      case "refrigerator":
        return FaThermometerHalf;
      case "microwave":
        return FaFire;
      case "fan":
        return FaFan;
      case "air purifier":
        return FaWind;
      default:
        return FaBolt;
    }
  };

  const CategoryIcon = getCategoryIcon();

  // Get category-specific color
  const getCategoryColor = () => {
    switch (applianceData?.category?.toLowerCase()) {
      case "washing machine":
        return "blue";
      case "air conditioner":
      case "ac":
        return "cyan";
      case "television":
      case "tv":
        return "purple";
      case "refrigerator":
        return "green";
      case "microwave":
        return "orange";
      case "fan":
        return "blue";
      case "air purifier":
        return "teal";
      default:
        return "indigo";
    }
  };

  const categoryColor = getCategoryColor();
  const colorClasses = {
    blue: {
      bg: "bg-blue-500",
      text: "text-blue-500",
      light: "bg-blue-50",
      border: "border-blue-500",
    },
    cyan: {
      bg: "bg-cyan-500",
      text: "text-cyan-500",
      light: "bg-cyan-50",
      border: "border-cyan-500",
    },
    purple: {
      bg: "bg-purple-500",
      text: "text-purple-500",
      light: "bg-purple-50",
      border: "border-purple-500",
    },
    green: {
      bg: "bg-green-500",
      text: "text-green-500",
      light: "bg-green-50",
      border: "border-green-500",
    },
    orange: {
      bg: "bg-orange-500",
      text: "text-orange-500",
      light: "bg-orange-50",
      border: "border-orange-500",
    },
    teal: {
      bg: "bg-teal-500",
      text: "text-teal-500",
      light: "bg-teal-50",
      border: "border-teal-500",
    },
    indigo: {
      bg: "bg-indigo-500",
      text: "text-indigo-500",
      light: "bg-indigo-50",
      border: "border-indigo-500",
    },
  };

  const currentColor = colorClasses[categoryColor] || colorClasses.blue;

  const variants = applianceData?.variants || [];
  const currentVariant = variants?.[selectedVariant];

  const allStorePrices =
    variants?.flatMap(
      (variant) =>
        variant.store_prices?.map((store) => ({
          ...store,
          variantName: `${
            variant.model ||
            variant.capacity ||
            variant.screen_size ||
            variant.type ||
            ""
          }`,
          variantSpec: variant.specification_summary || "",
        })) || [],
    ) || [];

  const variantStorePrices =
    currentVariant?.store_prices?.map((sp) => ({
      ...sp,
      variantName: `${
        currentVariant.model ||
        currentVariant.capacity ||
        currentVariant.screen_size ||
        currentVariant.type ||
        ""
      }`,
      variantSpec: currentVariant.specification_summary || "",
    })) || [];

  const getStoreLogo = (storeName) => {
    return getLogo(storeName);
  };

  const formatPrice = (price) => {
    if (price == null || price === "") return "N/A";
    return new Intl.NumberFormat("en-IN").format(price);
  };

  const toNormalCase = (raw) => {
    if (raw == null) return "";
    const ACRONYMS = new Set([
      "MP",
      "FOV",
      "ROM",
      "RAM",
      "NFC",
      "GPS",
      "USB",
      "AI",
      "OS",
      "GPU",
      "CPU",
      "Hz",
      "FPS",
      "GB",
      "mah",
      "Ghz",
      "cm",
      "gm",
      "IP",
      "5g",
      "K",
      "X",
      "Li-on",
      "BTU",
      "W",
      "V",
      "Hz",
      "kg",
      "lb",
      "sq",
      "ft",
      "LED",
      "LCD",
      "OLED",
      "QLED",
      "HD",
      "FHD",
      "UHD",
      "4K",
      "8K",
      "HDR",
      "Dolby",
      "Atmos",
      "WiFi",
      "Bluetooth",
      "RFID",
      "NFC",
      "GPS",
      "AC",
      "DC",
      "RPM",
      "PM",
      "dB",
      "CE",
      "ISO",
      "BEE",
      "ENERGY",
      "STAR",
      "WIFI",
      "BT",
      "IR",
      "RF",
      "USB",
      "HDMI",
      "ARC",
      "eARC",
      "R32",
    ]);

    let s = String(raw);
    s = s.replace(/_/g, " ").replace(/([a-z0-9])([A-Z])/g, "$1 $2");

    const parts = s.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);

    const normalized = parts
      .map((w) => {
        const clean = w.replace(/[^a-zA-Z0-9/()-]/g, "");
        const upper = clean.toUpperCase();
        if (ACRONYMS.has(upper)) return upper;
        if (/\d/.test(w) || /\//.test(w) || /[()\-]/.test(w)) {
          return w.charAt(0).toUpperCase() + w.slice(1);
        }
        return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
      })
      .join(" ");

    return normalized;
  };

  const sortedStores = allStorePrices.slice().sort((a, b) => {
    const priceA = a?.price || Infinity;
    const priceB = b?.price || Infinity;
    return priceA - priceB;
  });

  const sortedVariantStores = variantStorePrices.slice().sort((a, b) => {
    const priceA = a?.price || Infinity;
    const priceB = b?.price || Infinity;
    return priceA - priceB;
  });

  const displayedStores = showAllStores
    ? sortedStores
    : sortedVariantStores.slice(0, 3);

  // Share functionality
  const shareData = {
    title: `${applianceData?.brand} ${applianceData?.product_name}`,
    text: `Check out ${applianceData?.brand} ${applianceData?.product_name} - ${
      applianceData?.category
    }. Price starts at ₹${
      currentVariant?.base_price
        ? formatPrice(currentVariant.base_price)
        : "N/A"
    }`,
    url: window.location.href,
  };

  // Generate detailed share content with product information
  const generateShareContent = () => {
    const brand =
      applianceData?.brand || applianceData?.manufacturer || "Appliance";
    const model =
      applianceData?.product_name || applianceData?.model || "Unknown";
    const category =
      applianceData?.category ||
      applianceData?.type ||
      applianceData?.product_type ||
      "Appliance";
    const capacity =
      applianceData?.specifications?.capacity ||
      applianceData?.capacity ||
      applianceData?.specs?.capacity ||
      "Capacity info not available";
    const voltage =
      applianceData?.specifications?.voltage ||
      applianceData?.voltage ||
      applianceData?.specs?.voltage ||
      "Voltage info not available";
    const color =
      applianceData?.specifications?.color ||
      applianceData?.color ||
      applianceData?.specs?.color ||
      "Various";
    const price = currentVariant?.base_price
      ? `₹${formatPrice(currentVariant.base_price)}`
      : "Price not available";
    const rating = applianceData?.rating || ratingsData?.averageRating || 0;

    return {
      title: `${brand} ${model}`,
      description: `${category} | Capacity: ${capacity} | Voltage: ${voltage} | Color: ${color} | Rating: ${rating}/5 | Price: ${price}`,
      shortDescription: `${brand} ${model} - ${category}, ${capacity}, Price: ${price}`,
      fullDetails: `
🏠 ${brand} ${model}
📁 Category: ${category}
📦 Capacity: ${capacity}
⚡ Voltage: ${voltage}
🎨 Color: ${color}
⭐ Rating: ${rating}/5
💰 Price: ${price}
      `,
    };
  };

  const slugify = (str = "") =>
    String(str)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const getCanonicalUrl = () => {
    try {
      const slug = generateSlug(
        applianceData?.name || applianceData?.model || "",
      );
      if (!slug) return window.location.href;
      const path = `/appliances/${slug}`;
      return window.location.origin + path + (location.search || "");
    } catch (e) {
      return window.location.href;
    }
  };

  const handleShare = async () => {
    const url = getCanonicalUrl();
    const content = generateShareContent();
    const payload = {
      title: content.title,
      text: content.description,
      url: url,
    };
    if (navigator.share) {
      try {
        await navigator.share(payload);
      } catch (err) {
        console.log("Error sharing:", err);
      }
    } else {
      setShowShareMenu(true);
    }
  };

  const handleCopyLink = () => {
    const url = getCanonicalUrl();
    const content = generateShareContent();
    // Copy with product details and link
    const textToCopy = `${content.title}\n${content.description}\n\n${url}`;
    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => {
        console.error("Failed to copy:", err);
        const textArea = document.createElement("textarea");
        textArea.value = textToCopy;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
  };

  const toggleFavorite = async () => {
    const token = Cookies.get("arenak");
    if (!token) {
      navigate("/login", { state: { returnTo: location.pathname } });
      return;
    }

    const productId = applianceData?.id || applianceData?.model_number;

    if (!isFavorite) {
      try {
        const res = await fetch("https://api.apisphere.in/api/wishlist", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            product_id: productId,
            product_type: "homeappliance",
          }),
        });

        if (res.status === 401) {
          navigate("/login");
          return;
        }

        if (!res.ok) throw new Error(`Add favorite failed: ${res.status}`);
        setIsFavorite(true);
      } catch (err) {
        console.error("Failed to add favorite via API:", err);
      }
    } else {
      try {
        const res = await fetch(
          `https://api.apisphere.in/api/wishlist/${encodeURIComponent(productId)}`,
          {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (res.status === 401) {
          navigate("/login");
          return;
        }

        if (!res.ok) throw new Error(`Remove favorite failed: ${res.status}`);
        setIsFavorite(false);
      } catch (err) {
        console.error("Failed to remove favorite via API:", err);
      }
    }
  };

  useEffect(() => {
    const initFavorite = async () => {
      const token = Cookies.get("arenak");
      if (!token) return;
      const productId = applianceData?.id || applianceData?.model_number;
      if (!productId) return;

      try {
        const res = await fetch("https://api.apisphere.in/api/wishlist", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const json = await res.json();
        const items = json.rows || json.wishlist || json.items || json || [];
        const found = (Array.isArray(items) ? items : []).some(
          (it) =>
            String(it.product_id || it.id || it.favoriteId) ===
            String(productId),
        );
        if (found) setIsFavorite(true);
      } catch (err) {
        console.error("Failed to initialize favorite status:", err);
      }
    };

    initFavorite();
  }, [applianceData?.id, applianceData?.model_number]);

  // Rating submission removed

  const renderStars = (rating, size = "sm") => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    const sizeClasses = {
      xs: "text-xs",
      sm: "text-sm",
      md: "text-base",
      lg: "text-lg",
      xl: "text-xl",
    };

    return (
      <div className="flex items-center gap-1">
        {[...Array(fullStars)].map((_, i) => (
          <FaStar
            key={`full-${i}`}
            className={`text-yellow-400 ${sizeClasses[size] || sizeClasses.sm}`}
          />
        ))}
        {hasHalfStar && (
          <FaStarHalfAlt
            className={`text-yellow-400 ${sizeClasses[size] || sizeClasses.sm}`}
          />
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <FaRegStar
            key={`empty-${i}`}
            className={`text-gray-300 ${sizeClasses[size] || sizeClasses.sm}`}
          />
        ))}
        <span className="ml-2 text-gray-600 font-medium">
          {rating.toFixed(1)}
        </span>
      </div>
    );
  };

  // Rating summary removed

  // Tabs configuration
  const mobileTabs = [
    { id: "specifications", label: "Specs", icon: FaMicrochip },
    { id: "features", label: "Features", icon: FaBolt },
    { id: "performance", label: "Performance", icon: FaChartBar },
    { id: "physical_details", label: "Dimensions", icon: FaRuler },
    { id: "warranty", label: "Warranty", icon: FaShieldAlt },
  ];

  const desktopTabs = [...mobileTabs];

  const tabs = window.innerWidth < 768 ? mobileTabs : desktopTabs;

  const renderSpecItems = (data, limit = 6) => {
    if (!data || typeof data !== "object") {
      return (
        <div className="text-center py-4 text-gray-500">No data available</div>
      );
    }

    const entries = Object.entries(data).filter(
      ([_, value]) => value !== "" && value != null && value !== false,
    );

    if (entries.length === 0) {
      return (
        <div className="text-center py-4 text-gray-500">No data available</div>
      );
    }

    const displayEntries = showAllSpecs ? entries : entries.slice(0, limit);

    return (
      <>
        <div className="space-y-3">
          {displayEntries.map(([key, value]) => (
            <div
              key={key}
              className="flex justify-between items-start py-3 border-b border-gray-100 last:border-b-0"
            >
              <span className="text-gray-700 font-medium text-sm flex-1 pr-4">
                {toNormalCase(key)}
              </span>
              <span className="text-gray-900 font-semibold text-sm text-right flex-1 break-words">
                {value === true
                  ? "Yes"
                  : value === false
                    ? "No"
                    : value || "Not specified"}
              </span>
            </div>
          ))}
        </div>
        {entries.length > limit && (
          <button
            onClick={() => setShowAllSpecs(!showAllSpecs)}
            className={`w-full mt-4 py-2 ${currentColor.text} font-medium text-sm flex items-center justify-center gap-1`}
          >
            {showAllSpecs ? "Show Less" : `Show ${entries.length - limit} More`}
            <FaChevronDown
              className={`text-xs transition-transform ${
                showAllSpecs ? "rotate-180" : ""
              }`}
            />
          </button>
        )}
      </>
    );
  };

  const renderTabContent = () => {
    if (!applianceData) return null;

    switch (activeTab) {
      case "specifications":
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <FaMicrochip className={currentColor.text} />
                Technical Specifications
              </h3>
              {renderSpecItems(applianceData.specifications)}
            </div>
          </div>
        );

      case "features":
        return (
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <FaBolt className={currentColor.text} />
              Key Features
            </h3>
            {renderSpecItems(applianceData.features)}
          </div>
        );

      case "performance":
        return (
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <FaChartBar className={currentColor.text} />
              Performance Details
            </h3>
            {renderSpecItems(applianceData.performance)}
          </div>
        );

      case "physical_details":
        return (
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <FaRuler className={currentColor.text} />
              Physical Dimensions & Details
            </h3>
            {renderSpecItems(applianceData.physical_details)}
          </div>
        );

      case "warranty":
        return (
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <FaShieldAlt className={currentColor.text} />
              Warranty & Support
            </h3>
            {renderSpecItems(applianceData.warranty)}
          </div>
        );

      default:
        return (
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="text-center py-12 text-gray-500">
              <CategoryIcon className="text-4xl mx-auto mb-4 text-gray-300" />
              <p>No data available for this section</p>
            </div>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4 rounded-2xl px-8 py-6 shadow-xl">
          <Spinner
            size={40}
            className="border-4 border-violet-500 border-t-blue-500"
          />
          <p className="text-lg font-bold text-white tracking-wide">
            Loading Product Details...
          </p>
        </div>
      </div>
    );
  }

  if (!loading && !applianceData) {
    return (
      <div className="max-w-8xl mx-auto p-4">
        <div className="bg-white  p-12 text-center border border-gray-200">
          <div className="text-gray-400 text-6xl mb-4">🏠</div>
          <h3 className="text-2xl font-semibold text-gray-900 mb-3">
            Product Not Found
          </h3>
          <p className="text-gray-600">
            The requested appliance could not be found.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-8xl mx-auto bg-white">
      <Helmet>
        <title>
          {homeApplianceMeta.title({
            name: applianceData?.name || applianceData?.model || "",
            applianceType:
              applianceData?.appliance_type ||
              applianceData?.applianceType ||
              "",
            capacity:
              applianceData?.capacity ||
              applianceData?.specifications?.capacity ||
              "",
          })}
        </title>
        <meta
          name="description"
          content={homeApplianceMeta.description({
            name: applianceData?.name || applianceData?.model || "",
            applianceType:
              applianceData?.appliance_type ||
              applianceData?.applianceType ||
              "",
            capacity:
              applianceData?.capacity ||
              applianceData?.specifications?.capacity ||
              "",
            brand: applianceData?.brand || applianceData?.brand_name || "",
          })}
        />
      </Helmet>
      {/* Share Menu Modal */}
      {showShareMenu && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Share Product
              </h3>
              <button
                onClick={() => setShowShareMenu(false)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ×
              </button>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => {
                  const message = `${shareData.title}\n${shareData.text}\n\n${shareData.url}`;
                  const url = `https://wa.me/?text=${encodeURIComponent(
                    message,
                  )}`;
                  window.open(url, "_blank");
                  setShowShareMenu(false);
                }}
                className="w-full flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg text-green-700 font-medium transition-colors"
              >
                <FaWhatsapp className="text-xl" />
                <span>Share on WhatsApp</span>
              </button>
              <button
                onClick={() => {
                  const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                    window.location.href,
                  )}`;
                  window.open(url, "_blank");
                  setShowShareMenu(false);
                }}
                className="w-full flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-blue-700 font-medium transition-colors"
              >
                <FaFacebook className="text-xl" />
                <span>Share on Facebook</span>
              </button>
              <button
                onClick={() => {
                  const tweet = `${
                    shareData.title
                  } - ${shareData.text.substring(0, 100)}...`;
                  const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
                    tweet,
                  )}&url=${encodeURIComponent(window.location.href)}`;
                  window.open(url, "_blank");
                  setShowShareMenu(false);
                }}
                className="w-full flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-blue-400 font-medium transition-colors"
              >
                <FaTwitter className="text-xl" />
                <span>Share on Twitter</span>
              </button>
              <button
                onClick={handleCopyLink}
                className="w-full flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-700 font-medium transition-colors"
              >
                <FaLink className="text-xl" />
                <span>Copy Link</span>
              </button>
            </div>
            <button
              onClick={() => setShowShareMenu(false)}
              className="w-full mt-6 py-3 text-gray-600 hover:text-gray-800 font-medium border-t border-gray-200 pt-4"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="overflow-hidden  ">
        {/* Mobile Header */}
        <div className="p-5 border-b border-gray-200 lg:hidden">
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${currentColor.bg} text-white`}
                >
                  {applianceData.category}
                </span>
                {applianceData.release_year && (
                  <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
                    {applianceData.release_year}
                  </span>
                )}
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-1">
                {applianceData.product_name}
              </h1>
              <p className="text-gray-600 text-sm">
                {applianceData.brand} • {applianceData.model_number}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleFavorite}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <FaHeart
                  className={`text-lg ${
                    isFavorite ? "text-red-500 fill-current" : "text-gray-400"
                  }`}
                />
              </button>
              <button
                onClick={handleShare}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <FaShareAlt className="text-lg text-gray-600" />
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between mt-4">
            {ratingsData?.averageRating && (
              <div className="flex items-center gap-2">
                {renderStars(ratingsData.averageRating)}
                <span className="text-sm text-gray-600">
                  ({ratingsData.totalRatings})
                </span>
              </div>
            )}
            {currentVariant && (
              <span className="text-2xl font-bold text-green-600">
                ₹{formatPrice(currentVariant.base_price)}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row">
          {/* Images Section */}
          <div className="lg:w-2/5 p-5 border-b lg:border-b-0 lg:border-r border-gray-200">
            {/* Main Image */}
            <div className="rounded-xl bg-gray-50 p-8 mb-6 relative">
              <div className="absolute top-3 left-3">
                <CategoryIcon className={`text-2xl ${currentColor.text}`} />
              </div>
              <img
                src={
                  applianceData.images?.[activeImage] ||
                  "/placeholder-appliance.jpg"
                }
                alt={applianceData.product_name}
                className="w-full h-64 object-contain"
                onError={(e) => {
                  e.target.src =
                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f9fafb'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='16' fill='%239ca3af'%3ENo Image Available%3C/text%3E%3C/svg%3E";
                }}
              />
              <div className="absolute top-3 right-3 flex flex-col gap-2">
                <button
                  onClick={toggleFavorite}
                  className="p-2 bg-white rounded-full shadow-md hover:shadow-lg"
                >
                  <FaHeart
                    className={`${
                      isFavorite ? "text-red-500 fill-current" : "text-gray-600"
                    }`}
                  />
                </button>
                <button
                  onClick={handleShare}
                  className="p-2 bg-white rounded-full shadow-md hover:shadow-lg"
                >
                  <FaShare className="text-gray-600" />
                </button>
              </div>
            </div>

            {/* Thumbnails */}
            {applianceData.images && applianceData.images.length > 1 && (
              <div className="flex gap-3 mb-8 overflow-x-auto no-scrollbar">
                {applianceData.images.slice(0, 4).map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveImage(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg p-2 border-2 transition-all duration-200 ${
                      activeImage === index
                        ? `${currentColor.border} bg-white`
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${applianceData.product_name} view ${index + 1}`}
                      className="w-full h-full object-contain"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Variant Selection */}
            {variants && variants.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Available Variants
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {variants.map((variant, index) => (
                    <button
                      key={variant.id || index}
                      onClick={() => setSelectedVariant(index)}
                      className={`p-4 rounded-xl border-2 transition-all duration-150 text-left ${
                        selectedVariant === index
                          ? `${currentColor.border} ${currentColor.light}`
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="font-semibold text-gray-900 text-sm mb-1">
                        {variant.model ||
                          variant.capacity ||
                          variant.screen_size ||
                          variant.type ||
                          "Standard"}
                      </div>
                      <div className="text-xs text-gray-600 mb-2">
                        {variant.specification_summary || ""}
                      </div>
                      <div className="text-sm font-bold text-green-600">
                        ₹{formatPrice(variant.base_price)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Specs - Mobile Only */}
            <div className="lg:hidden grid grid-cols-3 gap-3 mb-6">
              {applianceData.specifications &&
                [
                  { key: "capacity", label: "Capacity", icon: FaWeight },
                  { key: "power_consumption", label: "Power", icon: FaBolt },
                  {
                    key: "energy_rating",
                    label: "Energy",
                    icon: FaBatteryFull,
                  },
                ].map((item) => {
                  const value = applianceData.specifications[item.key];
                  if (!value) return null;
                  return (
                    <div
                      key={item.key}
                      className={`text-center p-3 rounded-lg ${currentColor.light}`}
                    >
                      <item.icon
                        className={`${currentColor.text} text-lg mx-auto mb-1`}
                      />
                      <div className={`font-bold ${currentColor.text} text-sm`}>
                        {value}
                      </div>
                      <div className="text-xs text-gray-600">{item.label}</div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Details Section */}
          <div className="lg:w-3/5 p-5">
            {/* Desktop Header */}
            <div className="hidden lg:block mb-8">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <span
                      className={`px-3 py-1.5 rounded-full text-sm font-semibold ${currentColor.bg} text-white`}
                    >
                      {applianceData.category}
                    </span>
                    {applianceData.release_year && (
                      <span className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm text-gray-700">
                        Launch: {applianceData.release_year}
                      </span>
                    )}
                    {applianceData.country && (
                      <span className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm text-gray-700">
                        Made in {applianceData.country}
                      </span>
                    )}
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {applianceData.product_name}
                  </h1>
                  <p className="text-gray-600 text-lg mb-4">
                    {applianceData.brand} • Model: {applianceData.model_number}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleFavorite}
                    className="p-3 rounded-full hover:bg-gray-100"
                    title="Add to favorites"
                  >
                    <FaHeart
                      className={`text-xl ${
                        isFavorite
                          ? "text-red-500 fill-current"
                          : "text-gray-400"
                      }`}
                    />
                  </button>
                  <button
                    onClick={handleShare}
                    className="p-3 rounded-full hover:bg-gray-100 relative"
                    title="Share"
                  >
                    <FaShareAlt className="text-xl text-gray-600" />
                  </button>
                  <button
                    onClick={handleCopyLink}
                    className="p-3 rounded-full hover:bg-gray-100 relative"
                    title="Copy link"
                  >
                    {copied && (
                      <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs whitespace-nowrap shadow-lg">
                        Link copied!
                      </div>
                    )}
                    {copied ? (
                      <FaCheck className="text-xl text-green-600" />
                    ) : (
                      <FaCopy className="text-xl text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between mb-6">
                {ratingsData?.averageRating && (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-gray-50 px-4 py-2.5 rounded-xl">
                      {renderStars(ratingsData.averageRating, "md")}
                      <span className="text-gray-700 font-medium">
                        {ratingsData.averageRating.toFixed(1)}
                      </span>
                      <span className="text-gray-500 text-sm">
                        ({ratingsData.totalRatings} ratings)
                      </span>
                    </div>
                  </div>
                )}
                {currentVariant && (
                  <div className="text-right">
                    <div className="text-sm text-gray-500 mb-1">
                      Starting from
                    </div>
                    <div className="text-4xl font-bold text-green-600">
                      ₹ {formatPrice(currentVariant.base_price)}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Store Prices Section */}
            {sortedStores.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <FaStore className={currentColor.text} />
                    Available at Online Stores
                  </h3>
                  {sortedStores.length > 3 && (
                    <button
                      onClick={() => setShowAllStores(!showAllStores)}
                      className={`text-sm font-medium flex items-center gap-1 ${currentColor.text}`}
                    >
                      {showAllStores ? "Show Less" : "View All"}
                      <FaChevronDown
                        className={`text-xs transition-transform ${
                          showAllStores ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  {displayedStores.map((store, index) => (
                    <div
                      key={store.id || index}
                      className="bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-14 h-14 bg-white border border-gray-200 rounded-lg flex items-center justify-center p-2">
                            <img
                              src={getStoreLogo(store.store_name)}
                              alt={store.store_name}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                e.target.src = getLogo("");
                              }}
                            />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-900 text-md">
                              {store.store_name}
                            </h4>
                            <p className="text-xs text-gray-500 mt-1">
                              {store.variantSpec}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <div className="text-lg font-bold text-green-600">
                              ₹ {formatPrice(store.price)}
                            </div>
                            {store.delivery_time && (
                              <div className="text-xs text-gray-500">
                                Delivery: {store.delivery_time}
                              </div>
                            )}
                          </div>
                          <a
                            href={store.url}
                            target="_blank"
                            rel="noopener noreferrer nofollow"
                            className={`${currentColor.bg} hover:opacity-90 text-white px-5 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 transition-all duration-200`}
                          >
                            <FaExternalLinkAlt className="text-xs" />
                            Buy Now
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Desktop Quick Specs */}
            <div className="hidden lg:grid grid-cols-4 gap-4 mb-8">
              {applianceData.specifications &&
                [
                  {
                    key: "capacity",
                    label: "Capacity",
                    icon: FaWeight,
                    unit: "",
                  },
                  {
                    key: "power_rating",
                    label: "Power",
                    icon: FaBolt,
                    unit: "W",
                  },
                  {
                    key: "energy_rating",
                    label: "Energy Rating",
                    icon: FaBatteryFull,
                    unit: "",
                  },
                  {
                    key: "weight",
                    label: "Weight",
                    icon: FaWeight,
                    unit: "kg",
                  },
                ].map((item) => {
                  const value = applianceData.specifications[item.key];
                  if (!value) return null;
                  return (
                    <div
                      key={item.key}
                      className={`text-center p-4 rounded-xl ${currentColor.light} border ${currentColor.border}`}
                    >
                      <item.icon
                        className={`${currentColor.text} text-xl mx-auto mb-2`}
                      />
                      <div className={`font-bold text-lg ${currentColor.text}`}>
                        {value}
                        {item.unit && ` ${item.unit}`}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {item.label}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Ratings summary removed */}

        {/* Tabs Section */}
        <div className="border-t border-gray-200">
          <div className="flex overflow-x-auto no-scrollbar border-b border-gray-200">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-4 font-medium text-sm whitespace-nowrap border-b-2 transition-colors duration-200 flex-shrink-0 ${
                    activeTab === tab.id
                      ? `${currentColor.border} ${currentColor.text} ${currentColor.light}`
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <IconComponent className="text-sm" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="p-5">{renderTabContent()}</div>

          {/* Ratings Section - Rendered Directly Under Specs */}
          <div className="border-t border-gray-200 p-5">
            <RatingReview
              productId={applianceData?.id || applianceData?.product_id}
              productName={applianceData?.product_name}
              brand={applianceData?.brand}
              isLoading={loading}
              onReviewSubmitted={() => {
                // Optionally refresh product data
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplianceDetailCard;
