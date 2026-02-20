// src/components/TVDetailCard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import useDevice from "../../hooks/useDevice";
import Cookies from "js-cookie";
import { generateSlug, extractNameFromSlug } from "../../utils/slugGenerator";

// Icons
import {
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
  FaPlug,
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
  FaSyncAlt,
} from "react-icons/fa";

import "../../styles/hideScrollbar.css";
import Spinner from "../ui/Spinner";
import { Helmet } from "react-helmet-async";
import { tvMeta } from "../../constants/meta";
import useStoreLogos from "../../hooks/useStoreLogos";

// Ratings UI removed: review submission and inline rating input deleted

// Data comes from API via `useDevice()`; embedded mock removed.
const mockAppliances = [];

const toNumericPrice = (value) => {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  const cleaned = String(value).replace(/[^0-9.]/g, "");
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
};

const getVariantBestPrice = (variant) => {
  const stores = Array.isArray(variant?.store_prices) ? variant.store_prices : [];
  const storePrices = stores
    .map((store) => toNumericPrice(store?.price))
    .filter((price) => price !== null && price > 0);
  if (storePrices.length) return Math.min(...storePrices);

  const base = toNumericPrice(variant?.base_price);
  return base !== null && base > 0 ? base : null;
};

const TVDetailCard = () => {
  const { getLogo } = useStoreLogos();
  const [activeTab, setActiveTab] = useState("specifications");
  const [activeImage, setActiveImage] = useState(0);
  const [showAllStores, setShowAllStores] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [copied, setCopied] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  // Review form removed

  const [loading, setLoading] = useState(false);
  const [applianceData, setApplianceData] = useState(null);
  const navigate = useNavigate();

  // Get category from URL or default to washing machine
  const params = useParams();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
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

    const toObjectIfNeeded = (value) => {
      if (!value) return {};
      if (typeof value === "object" && !Array.isArray(value)) return value;
      if (typeof value !== "string") return {};
      const t = value.trim();
      if (!t) return {};
      if ((t.startsWith("{") && t.endsWith("}")) || t.startsWith("[")) {
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

    const firstNonEmpty = (...values) => {
      for (const value of values) {
        if (value === null || value === undefined) continue;
        if (typeof value === "string") {
          const trimmed = value.trim();
          if (trimmed) return trimmed;
          continue;
        }
        return value;
      }
      return "";
    };

    const basicInfo = toObjectIfNeeded(a.basic_info_json || a.basic_info);
    const keySpecs = toObjectIfNeeded(
      a.key_specs_json || a.key_specs || a.specifications,
    );
    const displayJson = toObjectIfNeeded(a.display_json || a.display);
    const audioJson = toObjectIfNeeded(a.audio_json || a.audio);
    const smartTvJson = toObjectIfNeeded(a.smart_tv_json || a.smart_tv);
    const connectivityJson = toObjectIfNeeded(
      a.connectivity_json || a.connectivity,
    );
    const portsJson = toObjectIfNeeded(a.ports_json || a.ports);
    const powerJson = toObjectIfNeeded(a.power_json || a.power || a.performance);
    const dimensionsJson = toObjectIfNeeded(
      a.dimensions_json || a.dimensions || a.physical_details,
    );
    const designJson = toObjectIfNeeded(a.design_json || a.design);
    const gamingJson = toObjectIfNeeded(a.gaming_json || a.gaming);
    const productDetailsJson = toObjectIfNeeded(
      a.product_details_json || a.product_details,
    );
    const warrantyJson = toObjectIfNeeded(a.warranty_json || a.warranty);
    const legacySpecs = { ...(a.specifications || {}), ...(a.specs || {}) };

    const rawVariants = Array.isArray(a.variants_json)
      ? a.variants_json
      : Array.isArray(a.variants)
      ? a.variants
      : a.variant
        ? Array.isArray(a.variant)
          ? a.variant
          : [a.variant]
        : [];

    const variants = rawVariants.map((v, variantIndex) => {
      const variantScreenSize = firstNonEmpty(
        v.screen_size,
        v.size,
        v.attributes?.screen_size,
        v.attributes?.size,
        keySpecs.screen_size,
        displayJson.screen_size,
      );
      const variantSummary = firstNonEmpty(
        v.specification_summary,
        v.variant_key,
        variantScreenSize,
        keySpecs.resolution,
      );
      const rawStoreRows = Array.isArray(v.store_prices)
        ? v.store_prices
        : Array.isArray(v.attributes?.stores)
          ? v.attributes.stores
          : [];
      const normalizedStores = rawStoreRows
        .map((sp, storeIndex) => ({
          ...sp,
          id: sp?.id || sp?.store_id || `${variantIndex}-${storeIndex}`,
          store_name: firstNonEmpty(
            sp?.store_name,
            sp?.store,
            sp?.storeName,
            "Store",
          ),
          price: toNumericPrice(sp?.price ?? sp?.amount),
          url: sp?.url || sp?.link || "",
          offer_text: sp?.offer_text || sp?.offer || null,
          delivery_time: sp?.delivery_info || sp?.delivery_time || null,
        }))
        .filter((sp) => Boolean(sp.store_name));
      const storesByName = new Map();
      normalizedStores.forEach((store) => {
        const key = String(store.store_name || "")
          .trim()
          .toLowerCase();
        if (!key) return;
        const prev = storesByName.get(key);
        if (!prev) {
          storesByName.set(key, store);
          return;
        }
        const prevPrice = toNumericPrice(prev.price);
        const nextPrice = toNumericPrice(store.price);
        const shouldReplace =
          (nextPrice !== null && prevPrice === null) ||
          (nextPrice !== null && prevPrice !== null && nextPrice < prevPrice);
        if (shouldReplace) storesByName.set(key, store);
      });
      const storePrices = Array.from(storesByName.values());
      const variantImages = [
        ...toArrayIfNeeded(v.images_json),
        ...(Array.isArray(v.images) ? v.images : []),
        ...(Array.isArray(v.variant_images) ? v.variant_images : []),
        ...toArrayIfNeeded(v.variant_images_json),
      ]
        .map((img) => String(img || "").trim())
        .filter(Boolean);

      return {
        ...v,
        id: v.id || v.variant_id || v.variantId || v.variant_key || null,
        variant_id:
          v.variant_id || v.id || v.variantId || v.variant_key || null,
        variant_key: firstNonEmpty(v.variant_key, variantScreenSize),
        base_price: toNumericPrice(
          v.base_price ?? v.price ?? v.attributes?.base_price,
        ),
        store_prices: storePrices,
        screen_size: variantScreenSize || "",
        screen_size_value:
          v.screen_size_value ||
          (variantScreenSize.match(/(\d+(\.\d+)?)/)?.[1]
            ? Number(variantScreenSize.match(/(\d+(\.\d+)?)/)?.[1])
            : null),
        specification_summary: variantSummary || "",
        images: Array.from(new Set(variantImages)),
      };
    });

    const images = (() => {
      const fromJson = toArrayIfNeeded(a.images_json);
      if (fromJson.length) return fromJson.filter(Boolean);
      if (Array.isArray(a.images)) return a.images.filter(Boolean);
      if (Array.isArray(a.pictures)) return a.pictures.filter(Boolean);
      return [];
    })();

    const screenSize = firstNonEmpty(
      keySpecs.screen_size,
      displayJson.screen_size,
      variants[0]?.screen_size,
      legacySpecs.screen_size,
      legacySpecs.capacity,
    );
    const resolution = firstNonEmpty(
      keySpecs.resolution,
      displayJson.resolution,
      legacySpecs.resolution,
    );
    const refreshRate = firstNonEmpty(
      keySpecs.refresh_rate,
      displayJson.refresh_rate,
      legacySpecs.refresh_rate,
    );
    const panelType = firstNonEmpty(
      keySpecs.panel_type,
      displayJson.panel_type,
      legacySpecs.display_type,
    );
    const operatingSystem = firstNonEmpty(
      keySpecs.operating_system,
      smartTvJson.operating_system,
      legacySpecs.operating_system,
    );
    const rawEnergyRating = firstNonEmpty(
      powerJson.energy_rating,
      powerJson.energy_star_rating,
      keySpecs.energy_rating,
      keySpecs.energy_star_rating,
      legacySpecs.energy_rating,
    );
    const energyRating =
      rawEnergyRating && /^\d+(\.\d+)?$/.test(String(rawEnergyRating))
        ? `${rawEnergyRating} Star`
        : rawEnergyRating;
    const hdrSupport =
      (Array.isArray(keySpecs.hdr_support) && keySpecs.hdr_support.join(", ")) ||
      (Array.isArray(displayJson.hdr_formats) &&
        displayJson.hdr_formats.join(", ")) ||
      "";

    const features = [
      ...(Array.isArray(keySpecs.hdr_support) ? keySpecs.hdr_support : []),
      ...(Array.isArray(keySpecs.ai_features) ? keySpecs.ai_features : []),
      ...(Array.isArray(displayJson.gaming_features)
        ? displayJson.gaming_features
        : []),
      ...(Array.isArray(audioJson.audio_features) ? audioJson.audio_features : []),
      ...(Array.isArray(smartTvJson.supported_apps) ? smartTvJson.supported_apps : []),
      ...(Array.isArray(smartTvJson.voice_assistant)
        ? smartTvJson.voice_assistant
        : []),
    ].filter(Boolean);

    const dimensions = [
      dimensionsJson.width || legacySpecs.width,
      dimensionsJson.height || legacySpecs.height,
      dimensionsJson.depth || legacySpecs.depth,
    ]
      .filter(Boolean)
      .join(" x ");
    return {
      ...a,
      id: a.product_id || a.id || a.productId || null,
      product_name: firstNonEmpty(a.product_name, a.name, basicInfo.title),
      model_number: firstNonEmpty(
        a.model_number,
        a.model,
        basicInfo.model_number,
      ),
      brand: firstNonEmpty(
        a.brand_name,
        a.brand,
        basicInfo.brand_name,
        basicInfo.brand,
      ),
      appliance_type: firstNonEmpty(
        a.appliance_type,
        a.category,
        a.type,
        a.product_type,
      ),
      category: /tv|television/i.test(
        String(
          firstNonEmpty(a.category, a.appliance_type, a.product_type),
        ).toLowerCase(),
      )
        ? "television"
        : firstNonEmpty(a.category, a.appliance_type, a.applianceType),
      variants,
      specifications: {
        ...legacySpecs,
        ...keySpecs,
        capacity: screenSize || legacySpecs.capacity || "",
        screen_size: screenSize || "",
        resolution: resolution || "",
        refresh_rate: refreshRate || "",
        panel_type: panelType || "",
        operating_system: operatingSystem || "",
        energy_rating: energyRating || "",
        hdr_support: hdrSupport || "",
        audio_output: firstNonEmpty(
          keySpecs.audio_output,
          audioJson.output_power,
          legacySpecs.audio_output,
        ),
        dimensions:
          dimensions || legacySpecs.dimensions || legacySpecs.dimension || "",
        width: dimensionsJson.width || legacySpecs.width || "",
        height: dimensionsJson.height || legacySpecs.height || "",
        depth: dimensionsJson.depth || legacySpecs.depth || "",
        weight: dimensionsJson.weight || legacySpecs.weight || "",
        color:
          designJson.body_color ||
          designJson.stand_color ||
          legacySpecs.color ||
          "",
      },
      features: features.length ? features : a.features || [],
      performance: {
        ...(a.performance || {}),
        ...displayJson,
        ...audioJson,
        ...gamingJson,
        ...powerJson,
      },
      physical_details: {
        ...(a.physical_details || {}),
        ...dimensionsJson,
        ...designJson,
        dimensions,
      },
      warranty: { ...(a.warranty || {}), ...warrantyJson },
      images,
      key_specs_json: keySpecs,
      display_json: displayJson,
      audio_json: audioJson,
      smart_tv_json: smartTvJson,
      connectivity_json: connectivityJson,
      ports_json: portsJson,
      power_json: powerJson,
      dimensions_json: dimensionsJson,
      design_json: designJson,
      gaming_json: gamingJson,
      warranty_json: warrantyJson,
      release_year:
        a.release_year ||
        basicInfo.launch_year ||
        productDetailsJson.launch_year ||
        a.launch_year ||
        "",
      country: firstNonEmpty(
        warrantyJson.country_of_origin,
        productDetailsJson.country_of_origin,
        a.country_of_origin,
      ),
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
  }, [location.search, homeAppliances, routeSlug]);

  // Redirect to canonical SEO-friendly appliance URL when data is available
  useEffect(() => {
    if (!applianceData) return;

    const canonicalSlug = generateSlug(
      applianceData.product_name ||
        applianceData.model_number ||
        applianceData.brand ||
        "",
    );
    if (!canonicalSlug) return;
    const desiredPath = `/tvs/${canonicalSlug}`;
    const currentPath = window.location.pathname;
    if (currentPath !== desiredPath) {
      navigate(desiredPath + (location.search || ""), { replace: true });
    }
  }, [applianceData, navigate, location.search]);

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
  const variantImages = Array.isArray(currentVariant?.images)
    ? currentVariant.images.filter(Boolean)
    : [];
  const galleryImages =
    variantImages.length > 0
      ? variantImages
      : Array.isArray(applianceData?.images)
        ? applianceData.images
        : [];
  const currentVariantBestPrice = getVariantBestPrice(currentVariant);
  const fallbackBestPrice = variants
    .map((variant) => getVariantBestPrice(variant))
    .filter((price) => price !== null && price > 0)
    .sort((a, b) => a - b)[0];
  const headlinePrice = currentVariantBestPrice ?? fallbackBestPrice ?? null;
  const currentProductId =
    applianceData?.id ??
    applianceData?.product_id ??
    applianceData?.productId ??
    null;

  useEffect(() => {
    setActiveImage(0);
  }, [selectedVariant, galleryImages.length]);

  useEffect(() => {
    setShowAllStores(false);
  }, [selectedVariant]);

  useEffect(() => {
    if (!variants.length) return;
    if (selectedVariant >= variants.length) {
      setSelectedVariant(0);
    }
  }, [selectedVariant, variants.length]);

  const popularComparisonTargets = (() => {
    const list = Array.isArray(homeAppliances) ? homeAppliances : [];
    if (!currentProductId || list.length === 0) return [];

    const normalizePrice = (d) => {
      const vars = Array.isArray(d?.variants) ? d.variants : [];
      const variantPrices = vars
        .map((variant) => getVariantBestPrice(variant))
        .filter((price) => price !== null && price > 0);
      if (variantPrices.length) return Math.min(...variantPrices);
      const fallback = toNumericPrice(d?.base_price ?? d?.price ?? null);
      return fallback !== null && fallback > 0 ? fallback : null;
    };

    const normalized = list
      .map((d) => normalizeAppliance(d))
      .filter(Boolean)
      .filter((d) => {
        const typeText = String(
          d?.category || d?.appliance_type || d?.product_type || "",
        ).toLowerCase();
        return typeText.includes("tv") || typeText.includes("television");
      })
      .filter((d) => String(d.id ?? "") !== String(currentProductId));

    const currentBrand = String(applianceData?.brand || "").toLowerCase();

    return normalized
      .map((d) => {
        const brand = String(d.brand || "").toLowerCase();
        const sameBrand = Boolean(currentBrand && brand === currentBrand);
        const rating = Number(d.rating ?? d.avg_rating ?? d.score ?? 0) || 0;
        const price = normalizePrice(d);
        return { d, sameBrand, rating, price };
      })
      .sort((a, b) => {
        if (a.sameBrand !== b.sameBrand) return a.sameBrand ? -1 : 1;
        if (b.rating !== a.rating) return b.rating - a.rating;
        if (a.price == null && b.price != null) return 1;
        if (a.price != null && b.price == null) return -1;
        if (a.price != null && b.price != null) return a.price - b.price;
        return 0;
      })
      .slice(0, 6)
      .map((x) => x.d);
  })();

  const handlePopularCompare = (other) => {
    const otherId = other?.id ?? other?.product_id ?? other?.productId ?? null;
    if (!currentProductId || !otherId) return;
    navigate(`/compare?devices=${currentProductId}:0,${otherId}:0`, {
      state: { initialProduct: applianceData },
    });
  };

  const allStorePrices =
    variants?.flatMap((variant) => {
      const stores = Array.isArray(variant?.store_prices)
        ? variant.store_prices
        : [];
      const mappedStores = stores.map((store) => ({
        ...store,
        price: toNumericPrice(store?.price),
        variantName: `${
          variant.model ||
          variant.capacity ||
          variant.screen_size ||
          variant.type ||
          variant.variant_key ||
          ""
        }`,
        variantSpec: variant.specification_summary || "",
      }));
      if (mappedStores.length) return mappedStores;

      const base = toNumericPrice(variant?.base_price);
      if (base !== null && base > 0) {
        return [
          {
            id: `base-${
              variant?.variant_id || variant?.id || variant?.variant_key || "tv"
            }`,
            store_name: "Base Price",
            price: base,
            variantName:
              variant.screen_size || variant.variant_key || "Default Variant",
            variantSpec: variant.specification_summary || "",
            url: "",
          },
        ];
      }
      return [];
    }) || [];

  const variantStorePrices =
    currentVariant?.store_prices?.map((sp) => ({
      ...sp,
      price: toNumericPrice(sp?.price),
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
    const numeric = toNumericPrice(price);
    if (numeric === null) return "N/A";
    return new Intl.NumberFormat("en-IN").format(numeric);
  };

  const RUPEE_SYMBOL = "\u20B9";

  const buildStoreSearchUrl = (storeName, query) => {
    const normalizedStore = String(storeName || "").toLowerCase().trim();
    const normalizedQuery = String(query || "").trim();
    if (!normalizedStore || !normalizedQuery) return "";
    if (normalizedStore.includes("base price")) return "";

    const encodedQuery = encodeURIComponent(normalizedQuery);
    if (normalizedStore.includes("amazon")) {
      return `https://www.amazon.in/s?k=${encodedQuery}`;
    }
    if (normalizedStore.includes("flipkart")) {
      return `https://www.flipkart.com/search?q=${encodedQuery}`;
    }
    if (normalizedStore.includes("croma")) {
      return `https://www.croma.com/searchB?q=${encodedQuery}%3Arelevance`;
    }
    if (normalizedStore.includes("reliance")) {
      return `https://www.reliancedigital.in/search?q=${encodedQuery}`;
    }
    if (normalizedStore.includes("vijay sales")) {
      return `https://www.vijaysales.com/search/${encodedQuery}`;
    }

    return `https://www.google.com/search?q=${encodeURIComponent(
      `${storeName} ${normalizedQuery}`,
    )}`;
  };

  const getStoreVisitUrl = (rawUrl, storeName, query) => {
    const resolvedUrl = String(rawUrl || "").trim();
    if (/^https?:\/\//i.test(resolvedUrl)) return resolvedUrl;
    if (/^\/\//.test(resolvedUrl)) return `https:${resolvedUrl}`;
    return buildStoreSearchUrl(storeName, query);
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

  const isPrimitive = (v) =>
    v == null || (typeof v !== "object" && typeof v !== "function");

  // Build descriptive title similar to smartphone details header style
  const buildDescriptiveTitle = (data, variant) => {
    if (!data) return "";

    const model =
      data.product_name || data.model_number || data.model || data.name || "TV";

    const processorRaw =
      data.display_json?.picture_processor ||
      data.specifications?.picture_processor ||
      data.performance?.picture_processor ||
      data.performance?.processor ||
      data.key_specs_json?.ai_features?.[0] ||
      "";
    const processor =
      !isPrimitive(processorRaw) || processorRaw === ""
        ? ""
        : formatSpecValue(processorRaw);

    const screenSizeRaw =
      variant?.screen_size ||
      data.specifications?.screen_size ||
      data.specifications?.capacity ||
      "";
    const screenSize =
      !isPrimitive(screenSizeRaw) || screenSizeRaw === ""
        ? ""
        : formatSpecValue(screenSizeRaw);

    const resolutionRaw =
      data.specifications?.resolution || data.display_json?.resolution || "";
    const resolution =
      !isPrimitive(resolutionRaw) || resolutionRaw === ""
        ? ""
        : formatSpecValue(resolutionRaw);

    const refreshRaw =
      data.specifications?.refresh_rate || data.display_json?.refresh_rate || "";
    let refreshRate =
      !isPrimitive(refreshRaw) || refreshRaw === ""
        ? ""
        : formatSpecValue(refreshRaw);
    if (
      refreshRate &&
      /^\d+(\.\d+)?$/.test(refreshRate) &&
      !/hz/i.test(refreshRate)
    ) {
      refreshRate = `${refreshRate}Hz`;
    }

    const panelRaw =
      data.specifications?.panel_type || data.display_json?.panel_type || "";
    const panelType =
      !isPrimitive(panelRaw) || panelRaw === "" ? "" : formatSpecValue(panelRaw);

    const specs = [];
    if (processor) specs.push(processor);
    if (screenSize || resolution) {
      specs.push([screenSize, resolution].filter(Boolean).join(" / "));
    }
    if (refreshRate) specs.push(refreshRate);
    if (panelType) specs.push(panelType);

    return specs.length ? `${model} - ${specs.join(" ")}` : model;
  };

  const sortedStores = allStorePrices.slice().sort((a, b) => {
    const priceA = toNumericPrice(a?.price) ?? Number.POSITIVE_INFINITY;
    const priceB = toNumericPrice(b?.price) ?? Number.POSITIVE_INFINITY;
    return priceA - priceB;
  });

  const sortedVariantStores = variantStorePrices.slice().sort((a, b) => {
    const priceA = toNumericPrice(a?.price) ?? Number.POSITIVE_INFINITY;
    const priceB = toNumericPrice(b?.price) ?? Number.POSITIVE_INFINITY;
    return priceA - priceB;
  });

  const displayedStores = showAllStores
    ? sortedStores
    : (sortedVariantStores.length
        ? sortedVariantStores
        : sortedStores
      ).slice(0, 3);

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
    const screenSize =
      currentVariant?.screen_size ||
      applianceData?.specifications?.screen_size ||
      applianceData?.specifications?.capacity ||
      applianceData?.capacity ||
      "Screen size info not available";
    const resolution =
      currentVariant?.specification_summary ||
      applianceData?.specifications?.resolution ||
      applianceData?.display_json?.resolution ||
      "Resolution info not available";
    const color =
      applianceData?.specifications?.color ||
      applianceData?.color ||
      applianceData?.specs?.color ||
      "Various";
    const price = headlinePrice
      ? `${RUPEE_SYMBOL}${formatPrice(headlinePrice)}`
      : "Price not available";

    return {
      title: `${brand} ${model}`,
      description: `${category} | Screen: ${screenSize} | Resolution: ${resolution} | Color: ${color} | Price: ${price}`,
      shortDescription: `${brand} ${model} - ${category}, ${screenSize}, ${resolution}, Price: ${price}`,
      fullDetails: [
        `${brand} ${model}`,
        `Category: ${category}`,
        `Screen: ${screenSize}`,
        `Resolution: ${resolution}`,
        `Color: ${color}`,
        `Price: ${price}`,
      ].join("\n"),
    };
  };

  const getCanonicalUrl = () => {
    try {
      const slug = generateSlug(
        applianceData?.product_name || applianceData?.model_number || "",
      );
      if (!slug) return window.location.href;
      const path = `/tvs/${slug}`;
      return window.location.origin + path;
    } catch (e) {
      return window.location.href;
    }
  };

  const getShareUrl = () => {
    try {
      const base = getCanonicalUrl();
      const url = new URL(base);
      const productId =
        applianceData?.id ||
        applianceData?.product_id ||
        applianceData?.productId ||
        applianceData?.model_number ||
        "";
      if (productId) url.searchParams.set("id", String(productId));
      url.searchParams.set("shared", "1");
      return url.toString();
    } catch (e) {
      return getCanonicalUrl();
    }
  };

  const copyTextToClipboard = async (text) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise((resolve, reject) => {
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(ta);
        if (ok) resolve();
        else reject(new Error("copy failed"));
      } catch (e) {
        reject(e);
      }
    });
  };

  const handleShare = async () => {
    const url = getShareUrl();
    const content = generateShareContent();
    const payload = {
      title: content.title,
      text: content.description,
      url: url,
    };
    if (navigator.share) {
      try {
        await navigator.share(payload);
        return;
      } catch (err) {
        console.warn("Native share failed:", err);
      }
    }

    try {
      await copyTextToClipboard(url);
      setShowShareMenu(true);
    } catch (err) {
      console.error("Clipboard fallback failed:", err);
      setShowShareMenu(true);
    }
  };

  const handleCopyLink = async () => {
    const url = getShareUrl();
    const content = generateShareContent();
    const textToCopy = `${content.fullDetails}\n\nView details: ${url}`;
    try {
      await copyTextToClipboard(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
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

  // Tabs configuration
  const isTvProduct = /tv|television/.test(
    String(
      applianceData?.category ||
        applianceData?.appliance_type ||
        applianceData?.product_type ||
        "",
    ).toLowerCase(),
  );

  const mobileTabs = isTvProduct
    ? [
        { id: "specifications", label: "Specs", icon: FaMicrochip },
        { id: "display", label: "Display", icon: FaTv },
        { id: "audio", label: "Audio", icon: FaVolumeUp },
        { id: "smart_tv", label: "Smart TV", icon: FaBolt },
        { id: "connectivity", label: "Connectivity", icon: FaWifi },
        { id: "ports", label: "Ports", icon: FaPlug },
        { id: "gaming", label: "Gaming", icon: FaGamepad },
        { id: "physical_details", label: "Dimensions", icon: FaRuler },
        { id: "warranty", label: "Warranty", icon: FaShieldAlt },
      ]
    : [
        { id: "specifications", label: "Specs", icon: FaMicrochip },
        { id: "features", label: "Features", icon: FaBolt },
        { id: "performance", label: "Performance", icon: FaChartBar },
        { id: "physical_details", label: "Dimensions", icon: FaRuler },
        { id: "warranty", label: "Warranty", icon: FaShieldAlt },
      ];

  const desktopTabs = mobileTabs;

  const tabs = window.innerWidth < 768 ? mobileTabs : desktopTabs;

  const hasContent = (value) => {
    if (value === null || value === undefined) return false;
    if (typeof value === "string") return value.trim() !== "";
    if (typeof value === "number") return Number.isFinite(value);
    if (typeof value === "boolean") return value;
    if (Array.isArray(value)) return value.some((v) => hasContent(v));
    if (typeof value === "object") {
      return Object.values(value).some((v) => hasContent(v));
    }
    return false;
  };

  const formatSpecValue = (value) => {
    if (value === null || value === undefined || value === "") {
      return "Not specified";
    }
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (Array.isArray(value)) {
      const filtered = value
        .map((v) => (typeof v === "object" ? JSON.stringify(v) : String(v)))
        .map((v) => v.trim())
        .filter(Boolean);
      return filtered.length ? filtered.join(", ") : "Not specified";
    }
    if (typeof value === "object") {
      const entries = Object.entries(value)
        .filter(([_, v]) => hasContent(v))
        .map(([k, v]) => `${toNormalCase(k)}: ${formatSpecValue(v)}`);
      return entries.length ? entries.join(" | ") : "Not specified";
    }
    return String(value);
  };

  const renderSpecTable = (data) => {
    if (!data || typeof data !== "object") {
      return (
        <div className="text-center py-4 text-gray-500">No data available</div>
      );
    }

    const isScoreKey = (key) => /(^|[_-])score$/i.test(String(key || ""));
    const rows = Object.entries(data).filter(
      ([key, value]) => hasContent(value) && !isScoreKey(key),
    );

    if (!rows.length) {
      return (
        <div className="text-center py-4 text-gray-500">No data available</div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <tbody className="bg-white">
            {rows.map(([key, value], idx) => (
              <tr key={key} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td className="px-6 py-3 text-sm font-medium text-gray-600 w-1/3 align-top">
                  {toNormalCase(key)}
                </td>
                <td className="px-6 py-3 text-sm text-gray-900 w-2/3">
                  {formatSpecValue(value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    const sectionId = tabId === "specifications" ? "tv-specifications" : `tv-${tabId}`;
    window.requestAnimationFrame(() => {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const renderTabContent = () => {
    if (!applianceData) return null;

    const generalSection = {
      brand: applianceData.brand || applianceData.brand_name || "",
      model: applianceData.model_number || applianceData.model || "",
      category: applianceData.category || applianceData.appliance_type || "",
      release_year: applianceData.release_year || "",
      country_of_origin:
        applianceData.country || applianceData.warranty_json?.country_of_origin || "",
    };

    if (isTvProduct) {
      return (
        <div id="tv-specifications" className="space-y-6">
          <div className="bg-white rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <FaMicrochip className={currentColor.text} />
              TV Specifications
            </h3>
            {renderSpecTable(generalSection)}
          </div>

          {hasContent(applianceData.key_specs_json || applianceData.specifications) && (
            <div id="tv-display" className="bg-white rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <FaTv className={currentColor.text} />
                Display
              </h3>
              {renderSpecTable(
                applianceData.display_json ||
                  applianceData.key_specs_json ||
                  applianceData.specifications,
              )}
            </div>
          )}

          {hasContent(applianceData.audio_json) && (
            <div id="tv-audio" className="bg-white rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <FaVolumeUp className={currentColor.text} />
                Audio
              </h3>
              {renderSpecTable(applianceData.audio_json)}
            </div>
          )}

          {hasContent(applianceData.smart_tv_json) && (
            <div id="tv-smart_tv" className="bg-white rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <FaBolt className={currentColor.text} />
                Smart TV
              </h3>
              {renderSpecTable(applianceData.smart_tv_json)}
            </div>
          )}

          {hasContent(applianceData.connectivity_json) && (
            <div
              id="tv-connectivity"
              className="bg-white rounded-lg p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <FaWifi className={currentColor.text} />
                Connectivity
              </h3>
              {renderSpecTable(applianceData.connectivity_json)}
            </div>
          )}

          {hasContent(applianceData.ports_json) && (
            <div id="tv-ports" className="bg-white rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <FaPlug className={currentColor.text} />
                Ports
              </h3>
              {renderSpecTable(applianceData.ports_json)}
            </div>
          )}

          {hasContent(applianceData.gaming_json) && (
            <div id="tv-gaming" className="bg-white rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <FaGamepad className={currentColor.text} />
                Gaming
              </h3>
              {renderSpecTable(applianceData.gaming_json)}
            </div>
          )}

          {hasContent(applianceData.dimensions_json || applianceData.physical_details) && (
            <div
              id="tv-physical_details"
              className="bg-white rounded-lg p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <FaRuler className={currentColor.text} />
                Dimensions
              </h3>
              {renderSpecTable(
                applianceData.dimensions_json || applianceData.physical_details,
              )}
            </div>
          )}

          {hasContent(applianceData.warranty_json || applianceData.warranty) && (
            <div id="tv-warranty" className="bg-white rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <FaShieldAlt className={currentColor.text} />
                Warranty
              </h3>
              {renderSpecTable(applianceData.warranty_json || applianceData.warranty)}
            </div>
          )}
        </div>
      );
    }

    return (
      <div id="tv-specifications" className="space-y-6">
        <div className="bg-white rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <FaMicrochip className={currentColor.text} />
            Technical Specifications
          </h3>
          {renderSpecTable(applianceData.specifications || generalSection)}
        </div>
        {hasContent(applianceData.features) && (
          <div id="tv-features" className="bg-white rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <FaBolt className={currentColor.text} />
              Features
            </h3>
            {renderSpecTable(applianceData.features)}
          </div>
        )}
        {hasContent(applianceData.performance) && (
          <div id="tv-performance" className="bg-white rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <FaChartBar className={currentColor.text} />
              Performance
            </h3>
            {renderSpecTable(applianceData.performance)}
          </div>
        )}
        {hasContent(applianceData.physical_details) && (
          <div
            id="tv-physical_details"
            className="bg-white rounded-lg p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <FaRuler className={currentColor.text} />
              Physical Details
            </h3>
            {renderSpecTable(applianceData.physical_details)}
          </div>
        )}
        {hasContent(applianceData.warranty) && (
          <div id="tv-warranty" className="bg-white rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <FaShieldAlt className={currentColor.text} />
              Warranty
            </h3>
            {renderSpecTable(applianceData.warranty)}
          </div>
        )}
      </div>
    );
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
      <div className="px-2 lg:px-4 mx-auto max-w-6xl w-full p-4">
          <div className="bg-white  p-12 text-center border border-gray-200">
          <div className="text-gray-400 text-6xl mb-4">TV</div>
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

  const descriptiveTitle = buildDescriptiveTitle(applianceData, currentVariant);
  const metaName =
    descriptiveTitle ||
    applianceData?.product_name ||
    applianceData?.model_number ||
    applianceData?.model ||
    "TV";
  const metaBrand = applianceData?.brand || applianceData?.brand_name || "";
  const metaScreenSize =
    applianceData?.specifications?.screen_size ||
    applianceData?.specifications?.capacity ||
    currentVariant?.screen_size ||
    "";
  const metaResolution =
    applianceData?.specifications?.resolution ||
    applianceData?.display_json?.resolution ||
    "";
  const metaOs =
    applianceData?.specifications?.operating_system ||
    applianceData?.smart_tv_json?.operating_system ||
    "";
  const metaNameWithBrand =
    metaBrand && metaName
      ? metaName.toLowerCase().includes(metaBrand.toLowerCase())
        ? metaName
        : `${metaBrand} ${metaName}`
      : metaName;
  const metaTitle = tvMeta.title({
    name: metaNameWithBrand,
    screenSize: metaScreenSize,
    resolution: metaResolution,
  });
  const currentDateLabel = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const metaTitleWithDate = `${metaTitle} [${currentDateLabel}]`;
  const metaDescription = tvMeta.description({
    name: metaName,
    brand: metaBrand,
    screenSize: metaScreenSize,
    resolution: metaResolution,
    os: metaOs,
  });
  const canonicalUrl = getCanonicalUrl();
  const metaImage = applianceData?.images?.[0] || null;

  return (
    <div className="px-2 lg:px-4 mx-auto max-w-6xl w-full bg-white">
      <Helmet>
        <title>{metaTitleWithDate}</title>
        <meta name="description" content={metaDescription} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="product" />
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDescription} />
        {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
        {metaImage && <meta property="og:image" content={metaImage} />}
        <meta
          name="twitter:card"
          content={metaImage ? "summary_large_image" : "summary"}
        />
        <meta name="twitter:title" content={metaTitle} />
        <meta name="twitter:description" content={metaDescription} />
        {metaImage && <meta name="twitter:image" content={metaImage} />}
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
                &times;
              </button>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => {
                  const content = generateShareContent();
                  const shareUrl = getShareUrl();
                  const message = `${content.fullDetails}\n\nCheck it out: ${shareUrl}`;
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
                  const shareUrl = getShareUrl();
                  const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                    shareUrl,
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
                  const content = generateShareContent();
                  const shareUrl = getShareUrl();
                  const tweet = `Check out: ${content.title}\n${content.shortDescription}\n\n#TV #SmartTV`;
                  const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
                    tweet,
                  )}&url=${encodeURIComponent(shareUrl)}`;
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
              <h1 className="text-xl font-extrabold tracking-tight mb-1 text-gray-900 leading-tight">
                {descriptiveTitle || applianceData.product_name}
              </h1>
              <p className="text-gray-600 text-sm">
                {applianceData.brand} | {applianceData.model_number}
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
          <div className="flex items-center justify-end mt-4">
            {headlinePrice ? (
              <span className="text-2xl font-bold text-green-600">
                {RUPEE_SYMBOL}
                {formatPrice(headlinePrice)}
              </span>
            ) : null}
          </div>
        </div>

        {/* Popular Comparisons */}
        {popularComparisonTargets.length > 0 && (
          <div className="px-4 pt-4 pb-1">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-gray-900">
                Popular comparisons
              </h2>
              <button
                type="button"
                onClick={() =>
                  navigate("/compare", {
                    state: { initialProduct: applianceData },
                  })
                }
                className="text-xs font-semibold text-purple-700 hover:text-purple-800"
              >
                Open compare
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-3">
              {popularComparisonTargets.map((d) => {
                const otherId = d?.id ?? d?.product_id ?? d?.productId ?? null;
                const otherName = d?.product_name || d?.name || d?.model || "TV";
                const otherImg = d?.images?.[0] || d?.image || "";

                return (
                  <button
                    key={String(otherId || otherName)}
                    type="button"
                    onClick={() => handlePopularCompare(d)}
                    className="min-w-[240px] max-w-[280px] flex-shrink-0 rounded-xl border border-gray-200 bg-white p-3 hover:border-purple-200 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center flex-shrink-0">
                        {otherImg ? (
                          <img
                            src={otherImg}
                            alt={otherName}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <FaTv className="text-gray-400 text-sm" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] text-gray-500 truncate">
                          Compare with
                        </div>
                        <div className="text-sm font-semibold text-gray-900 truncate">
                          {otherName}
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-purple-700">
                        Compare
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

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
                  galleryImages?.[activeImage] ||
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
            {galleryImages && galleryImages.length > 1 && (
              <div className="flex gap-3 mb-8 overflow-x-auto no-scrollbar">
                {galleryImages.slice(0, 6).map((image, index) => (
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
                          applianceData.specifications?.screen_size ||
                          `Variant ${index + 1}`}
                      </div>
                      <div className="text-xs text-gray-600 mb-2">
                        {variant.specification_summary ||
                          applianceData.specifications?.resolution ||
                          applianceData.specifications?.panel_type ||
                          ""}
                      </div>
                      <div className="text-sm font-bold text-green-600">
                        {RUPEE_SYMBOL}
                        {formatPrice(getVariantBestPrice(variant))}
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
                  {
                    key: "screen_size",
                    fallback: "capacity",
                    label: "Screen",
                    icon: FaTv,
                  },
                  {
                    key: "resolution",
                    label: "Resolution",
                    icon: FaRuler,
                  },
                  {
                    key: "refresh_rate",
                    fallback: "refreshRate",
                    label: "Refresh",
                    icon: FaSyncAlt,
                  },
                ].map((item) => {
                  const value =
                    applianceData.specifications[item.key] ||
                    (item.fallback
                      ? applianceData.specifications[item.fallback]
                      : null);
                  if (!value) return null;
                  return (
                    <div
                      key={item.key}
                      className="text-center p-3 rounded-xl bg-white border border-gray-200 shadow-sm"
                    >
                      <item.icon className={`${currentColor.text} text-base mx-auto mb-2`} />
                      <div className="font-semibold text-gray-900 text-sm leading-5">
                        {value}
                      </div>
                      <div className="text-[11px] mt-1 text-gray-500">
                        {item.label}
                      </div>
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
                  <h1 className="text-2xl font-extrabold tracking-tight mb-2 text-gray-900">
                    {descriptiveTitle || applianceData.product_name}
                  </h1>
                  <p className="text-gray-600 text-lg mb-4">
                    {applianceData.brand} | Model: {applianceData.model_number}
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

              <div className="flex items-center justify-end mb-6">
                {headlinePrice ? (
                  <div className="text-right">
                    <div className="text-sm text-gray-500 mb-1">
                      Starting from
                    </div>
                    <div className="text-4xl font-bold text-green-600">
                      {RUPEE_SYMBOL} {formatPrice(headlinePrice)}
                    </div>
                  </div>
                ) : null}
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
                  {displayedStores.map((store, index) => {
                    const visitUrl = getStoreVisitUrl(
                      store.url,
                      store.store_name,
                      [
                        applianceData?.brand,
                        applianceData?.product_name ||
                          applianceData?.model_number,
                        store.variantName || store.variantSpec,
                        applianceData?.specifications?.screen_size,
                        applianceData?.specifications?.resolution,
                      ]
                        .filter(Boolean)
                        .join(" "),
                    );

                    return (
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
                            <a
                              href={visitUrl || "#"}
                              target="_blank"
                              rel="noopener noreferrer nofollow"
                              onClick={(e) => {
                                if (!visitUrl) e.preventDefault();
                              }}
                              className="text-blue-600 hover:text-blue-800 text-xs font-medium inline-flex items-center gap-1 mb-1"
                            >
                              {`Visit Store ${store.store_name || "Store"}`}
                            </a>
                            <div className="text-lg font-bold text-green-600">
                              {RUPEE_SYMBOL} {formatPrice(store.price)}
                            </div>
                            {store.delivery_time && (
                              <div className="text-xs text-gray-500">
                                Delivery: {store.delivery_time}
                              </div>
                            )}
                          </div>
                          <a
                            href={visitUrl || "#"}
                            target="_blank"
                            rel="noopener noreferrer nofollow"
                            onClick={(e) => {
                              if (!visitUrl) e.preventDefault();
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 transition-all duration-200"
                          >
                            <FaExternalLinkAlt className="text-xs" />
                            Buy Now
                          </a>
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Desktop Quick Specs */}
            <div className="hidden lg:grid grid-cols-4 gap-4 mb-8">
              {applianceData.specifications &&
                [
                  {
                    key: "screen_size",
                    fallback: "capacity",
                    label: "Screen Size",
                    icon: FaTv,
                    unit: "",
                  },
                  {
                    key: "resolution",
                    label: "Resolution",
                    icon: FaRuler,
                    unit: "",
                  },
                  {
                    key: "energy_rating",
                    fallback: "energyRating",
                    label: "Energy Rating",
                    icon: FaBatteryFull,
                    unit: "",
                  },
                  {
                    key: "refresh_rate",
                    fallback: "refreshRate",
                    label: "Refresh Rate",
                    icon: FaSyncAlt,
                    unit: "",
                  },
                ].map((item) => {
                  const value =
                    applianceData.specifications[item.key] ||
                    (item.fallback
                      ? applianceData.specifications[item.fallback]
                      : null);
                  if (!value) return null;
                  return (
                    <div
                      key={item.key}
                      className="text-center p-4 rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      <item.icon className={`${currentColor.text} text-xl mx-auto mb-2`} />
                      <div className="font-bold text-lg text-gray-900 leading-snug">
                        {value}
                        {item.unit && ` ${item.unit}`}
                      </div>
                      <div className="text-sm mt-1 text-gray-500">
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
                  onClick={() => handleTabClick(tab.id)}
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
        </div>
      </div>
    </div>
  );
};

export default TVDetailCard;





