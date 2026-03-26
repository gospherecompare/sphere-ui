// src/components/TVDetailCard.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import useDevice from "../../hooks/useDevice";
import Cookies from "js-cookie";
import { generateSlug, extractNameFromSlug } from "../../utils/slugGenerator";
import { createProductSchema } from "../../utils/schemaGenerators";
import { Helmet } from "react-helmet-async";

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
  FaTv,
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
import { tvMeta } from "../../constants/meta";
import useStoreLogos from "../../hooks/useStoreLogos";
import ProductDiscoverySections from "../ui/ProductDiscoverySections";
import useDeviceFieldProfiles from "../../hooks/useDeviceFieldProfiles";
import { resolveDeviceFieldProfile } from "../../utils/deviceFieldProfiles";
import { buildDeviceSeoKeywords } from "../../utils/seoKeywordBuilder";

// Ratings UI removed: review submission and inline rating input deleted

// Data comes from API via `useDevice()`; embedded mock removed.
const mockAppliances = [];
const SITE_ORIGIN = "https://tryhook.shop";

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
  const stores = Array.isArray(variant?.store_prices)
    ? variant.store_prices
    : [];
  const storePrices = stores
    .map((store) => toNumericPrice(store?.price))
    .filter((price) => price !== null && price > 0);
  if (storePrices.length) return Math.min(...storePrices);

  const base = toNumericPrice(variant?.base_price);
  return base !== null && base > 0 ? base : null;
};

const normalizeScore100 = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  if (n <= 1) return Math.max(0, Math.min(100, n * 100));
  if (n <= 10) return Math.max(0, Math.min(100, n * 10));
  return Math.max(0, Math.min(100, n));
};

const isPlainObject = (value) =>
  value && typeof value === "object" && !Array.isArray(value);

const toSafeText = (value) => {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number")
    return Number.isFinite(value) ? String(value) : "";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) {
    return value
      .map((item) => toSafeText(item))
      .filter(Boolean)
      .join(", ");
  }
  if (isPlainObject(value)) {
    return Object.entries(value)
      .map(([key, val]) => {
        const formatted = toSafeText(val);
        return formatted ? `${key}: ${formatted}` : "";
      })
      .filter(Boolean)
      .join(" | ");
  }
  return String(value);
};

const dedupeTextParts = (parts = []) => {
  const seen = new Set();
  const out = [];
  parts.forEach((part) => {
    const raw = String(part || "").trim();
    if (!raw) return;
    const key = raw.toLowerCase().replace(/[^a-z0-9]+/g, "");
    if (!key || seen.has(key)) return;
    seen.add(key);
    out.push(raw);
  });
  return out;
};

const SpecScoreBadge = ({
  score,
  size = 42,
  showSpecLabel = false,
  zeroFallback = false,
}) => {
  const normalized = normalizeScore100(score);
  const percentageRaw =
    normalized != null
      ? Number(normalized.toFixed(1))
      : zeroFallback
        ? 0
        : null;
  const percentage = percentageRaw;
  const label = percentage != null ? `${percentage.toFixed(1)}%` : "--";
  const compact = size <= 34;

  if (showSpecLabel) {
    return (
      <div
        className="inline-flex flex-col items-center justify-center rounded-2xl border border-violet-200 bg-violet-50/95 px-2 py-1.5 leading-none"
        style={{ minWidth: `${Math.max(44, Math.round(size * 1.2))}px` }}
        aria-label={
          percentage != null
            ? `Overall score ${percentage.toFixed(1)} percent`
            : "Overall score unavailable"
        }
      >
        <span
          className={`${compact ? "text-[11px]" : "text-[12px]"} font-bold text-violet-700`}
        >
          {label}
        </span>
        <span className="mt-0.5 text-[8px] font-semibold uppercase tracking-wide text-violet-600">
          Spec
        </span>
      </div>
    );
  }

  return (
    <div
      className="relative inline-flex items-center rounded-[26px] border border-violet-200 bg-violet-50/95 pl-7 pr-3 py-2 leading-none"
      style={{ minWidth: `${Math.max(88, Math.round(size * 1.9))}px` }}
      aria-label={
        percentage != null
          ? `Overall score ${percentage.toFixed(1)} percent`
          : "Overall score unavailable"
      }
    >
      <span
        className={`${compact ? "text-[11px]" : "text-[12px]"} font-bold text-violet-700`}
      >
        {label}
      </span>
    </div>
  );
};

const TVDetailCard = () => {
  const { getLogo } = useStoreLogos();
  const deviceFieldProfiles = useDeviceFieldProfiles();
  const [activePrimaryTab, setActivePrimaryTab] = useState("info");
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
    const videoEngineJson = toObjectIfNeeded(
      a.video_engine_json ||
        a.video_engine ||
        a.videoEngine ||
        a.performance_json ||
        a.performance,
    );
    const audioJson = toObjectIfNeeded(a.audio_json || a.audio);
    const smartTvJson = toObjectIfNeeded(a.smart_tv_json || a.smart_tv);
    const connectivityJson = toObjectIfNeeded(
      a.connectivity_json || a.connectivity,
    );
    const portsJson = toObjectIfNeeded(a.ports_json || a.ports);
    const powerJson = toObjectIfNeeded(
      a.power_json || a.power || a.performance,
    );
    const physicalJson = toObjectIfNeeded(
      a.physical_json ||
        a.physical ||
        a.physical_details ||
        a.dimensions_json ||
        a.dimensions,
    );
    const dimensionsJson = toObjectIfNeeded(
      a.dimensions_json || a.dimensions || a.physical_details || physicalJson,
    );
    const designJson = toObjectIfNeeded(a.design_json || a.design);
    const gamingJson = toObjectIfNeeded(a.gaming_json || a.gaming);
    const productDetailsJson = toObjectIfNeeded(
      a.product_details_json || a.product_details,
    );
    const inTheBoxJson = toObjectIfNeeded(a.in_the_box_json || a.in_the_box);
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
      (Array.isArray(keySpecs.hdr_support) &&
        keySpecs.hdr_support.join(", ")) ||
      (Array.isArray(displayJson.hdr_formats) &&
        displayJson.hdr_formats.join(", ")) ||
      "";

    const features = [
      ...(Array.isArray(keySpecs.hdr_support) ? keySpecs.hdr_support : []),
      ...(Array.isArray(keySpecs.ai_features) ? keySpecs.ai_features : []),
      ...(Array.isArray(displayJson.gaming_features)
        ? displayJson.gaming_features
        : []),
      ...(Array.isArray(audioJson.audio_features)
        ? audioJson.audio_features
        : []),
      ...(Array.isArray(smartTvJson.supported_apps)
        ? smartTvJson.supported_apps
        : []),
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
    const normalizedAppliance = {
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
        ...videoEngineJson,
        ...displayJson,
        ...audioJson,
        ...gamingJson,
        ...powerJson,
      },
      physical_details: {
        ...(a.physical_details || {}),
        ...physicalJson,
        ...dimensionsJson,
        ...designJson,
        dimensions,
      },
      warranty: { ...(a.warranty || {}), ...warrantyJson },
      images,
      basic_info_json: basicInfo,
      key_specs_json: keySpecs,
      display_json: displayJson,
      video_engine_json: videoEngineJson,
      audio_json: audioJson,
      smart_tv_json: smartTvJson,
      connectivity_json: connectivityJson,
      ports_json: portsJson,
      power_json: powerJson,
      physical_json: physicalJson,
      dimensions_json: dimensionsJson,
      design_json: designJson,
      gaming_json: gamingJson,
      product_details_json: productDetailsJson,
      in_the_box_json: inTheBoxJson,
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
    const profileResult = resolveDeviceFieldProfile(
      "tv",
      normalizedAppliance,
      deviceFieldProfiles,
    );
    normalizedAppliance.field_profile = profileResult;
    const incomingScore = normalizeScore100(
      normalizedAppliance.spec_score ??
        normalizedAppliance.overall_score ??
        normalizedAppliance.hook_score,
    );
    const fallbackProfileScore = normalizeScore100(profileResult.score);
    if (
      (incomingScore == null || incomingScore <= 0) &&
      fallbackProfileScore != null &&
      fallbackProfileScore > 0
    ) {
      normalizedAppliance.spec_score = fallbackProfileScore;
      normalizedAppliance.overall_score = fallbackProfileScore;
    }

    return normalizedAppliance;
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
  const currentVariantSize = toSafeText(
    currentVariant?.screen_size || currentVariant?.capacity || "",
  );
  const currentVariantResolution = toSafeText(
    currentVariant?.resolution ||
      currentVariant?.specification_summary ||
      applianceData?.specifications?.resolution ||
      applianceData?.display_json?.resolution ||
      "",
  );
  const currentVariantLabel = dedupeTextParts([
    currentVariantSize,
    currentVariantResolution,
  ]).join(" / ");
  const currentProductId =
    applianceData?.id ??
    applianceData?.product_id ??
    applianceData?.productId ??
    null;
  const pickScore100 = (...values) => {
    for (const value of values) {
      const normalized = normalizeScore100(value);
      if (normalized != null) return normalized;
    }
    return null;
  };
  const pickPositiveScore100 = (...values) => {
    for (const value of values) {
      const normalized = normalizeScore100(value);
      if (normalized != null && normalized > 0) return normalized;
    }
    return null;
  };
  const normalizeScoreSource = (value) =>
    String(value || "")
      .trim()
      .toLowerCase();
  const resolvePersistedScore = (value, source) => {
    const normalized = normalizeScore100(value);
    if (normalized == null) return null;

    const sourceKey = normalizeScoreSource(source);
    if (sourceKey && sourceKey.includes("fallback")) {
      return null;
    }

    return normalized;
  };
  const specScoreV2Source =
    applianceData?.spec_score_v2_source ?? applianceData?.specScoreV2Source;
  const overallScoreV2Source =
    applianceData?.overall_score_v2_source ??
    applianceData?.overallScoreV2Source;
  const specScoreSource =
    applianceData?.spec_score_source ?? applianceData?.specScoreSource;
  const overallScoreSource =
    applianceData?.overall_score_source ?? applianceData?.overallScoreSource;
  const persistedSpecScore = pickScore100(
    resolvePersistedScore(applianceData?.spec_score_v2, specScoreV2Source),
    resolvePersistedScore(applianceData?.specScoreV2, specScoreV2Source),
    resolvePersistedScore(applianceData?.spec_score, specScoreSource),
    resolvePersistedScore(applianceData?.specScore, specScoreSource),
  );
  const persistedOverallScore = pickScore100(
    resolvePersistedScore(
      applianceData?.overall_score_v2,
      overallScoreV2Source,
    ),
    resolvePersistedScore(applianceData?.overallScoreV2, overallScoreV2Source),
    resolvePersistedScore(applianceData?.overall_score, overallScoreSource),
    resolvePersistedScore(applianceData?.overallScore, overallScoreSource),
  );
  const persistedOverallScoreDisplay = pickScore100(
    resolvePersistedScore(
      applianceData?.overall_score_v2_display_80_98,
      overallScoreV2Source,
    ),
    resolvePersistedScore(
      applianceData?.overallScoreV2Display8098,
      overallScoreV2Source,
    ),
    resolvePersistedScore(
      applianceData?.spec_score_v2_display_80_98,
      specScoreV2Source,
    ),
    resolvePersistedScore(
      applianceData?.specScoreV2Display8098,
      specScoreV2Source,
    ),
  );
  const coreSectionFallback =
    pickPositiveScore100(
      applianceData?.field_profile?.section_scores?.core,
      applianceData?.field_profile?.mandatory_coverage,
      applianceData?.field_profile?.score,
    ) ?? pickScore100(applianceData?.field_profile?.section_scores?.core);
  const displaySectionFallback =
    pickPositiveScore100(
      applianceData?.field_profile?.section_scores?.display,
      applianceData?.field_profile?.display_coverage,
      applianceData?.field_profile?.score,
    ) ?? pickScore100(applianceData?.field_profile?.section_scores?.display);
  const sectionScores = {
    specifications:
      pickPositiveScore100(
        applianceData?.specifications?.score,
        applianceData?.key_specs_json?.score,
        coreSectionFallback,
      ) ??
      pickScore100(
        applianceData?.specifications?.score,
        applianceData?.key_specs_json?.score,
        coreSectionFallback,
      ),
    display:
      pickPositiveScore100(
        applianceData?.display_json?.score,
        applianceData?.key_specs_json?.display_score,
        applianceData?.specifications?.display_score,
        displaySectionFallback,
      ) ??
      pickScore100(
        applianceData?.display_json?.score,
        applianceData?.key_specs_json?.display_score,
        applianceData?.specifications?.display_score,
        displaySectionFallback,
      ),
    video_engine:
      pickPositiveScore100(
        applianceData?.video_engine_json?.score,
        applianceData?.performance?.video_engine_score,
        coreSectionFallback,
      ) ??
      pickScore100(
        applianceData?.video_engine_json?.score,
        applianceData?.performance?.video_engine_score,
        coreSectionFallback,
      ),
    audio:
      pickPositiveScore100(
        applianceData?.audio_json?.score,
        displaySectionFallback,
      ) ??
      pickScore100(applianceData?.audio_json?.score, displaySectionFallback),
    smart_tv:
      pickPositiveScore100(
        applianceData?.smart_tv_json?.score,
        applianceData?.performance?.smart_tv_score,
        displaySectionFallback,
      ) ??
      pickScore100(
        applianceData?.smart_tv_json?.score,
        applianceData?.performance?.smart_tv_score,
        displaySectionFallback,
      ),
    connectivity:
      pickPositiveScore100(
        applianceData?.connectivity_json?.score,
        applianceData?.specifications?.connectivity_score,
        applianceData?.specifications?.network_score,
        displaySectionFallback,
      ) ??
      pickScore100(
        applianceData?.connectivity_json?.score,
        applianceData?.specifications?.connectivity_score,
        applianceData?.specifications?.network_score,
        displaySectionFallback,
      ),
    ports:
      pickPositiveScore100(
        applianceData?.ports_json?.score,
        displaySectionFallback,
      ) ??
      pickScore100(applianceData?.ports_json?.score, displaySectionFallback),
    gaming:
      pickPositiveScore100(
        applianceData?.gaming_json?.score,
        displaySectionFallback,
      ) ??
      pickScore100(applianceData?.gaming_json?.score, displaySectionFallback),
    power:
      pickPositiveScore100(
        applianceData?.power_json?.score,
        coreSectionFallback,
      ) ?? pickScore100(applianceData?.power_json?.score, coreSectionFallback),
    physical_details:
      pickPositiveScore100(
        applianceData?.physical_json?.score,
        applianceData?.dimensions_json?.score,
        applianceData?.physical_details?.score,
        coreSectionFallback,
      ) ??
      pickScore100(
        applianceData?.physical_json?.score,
        applianceData?.dimensions_json?.score,
        applianceData?.physical_details?.score,
        coreSectionFallback,
      ),
    product_details:
      pickPositiveScore100(
        applianceData?.product_details_json?.score,
        coreSectionFallback,
      ) ??
      pickScore100(
        applianceData?.product_details_json?.score,
        coreSectionFallback,
      ),
    in_the_box:
      pickPositiveScore100(
        applianceData?.in_the_box_json?.score,
        coreSectionFallback,
      ) ??
      pickScore100(applianceData?.in_the_box_json?.score, coreSectionFallback),
    warranty:
      pickPositiveScore100(
        applianceData?.warranty_json?.score,
        applianceData?.warranty?.score,
        coreSectionFallback,
      ) ??
      pickScore100(
        applianceData?.warranty_json?.score,
        applianceData?.warranty?.score,
        coreSectionFallback,
      ),
    features:
      pickPositiveScore100(
        applianceData?.features?.score,
        displaySectionFallback,
      ) ?? pickScore100(applianceData?.features?.score, displaySectionFallback),
    performance:
      pickPositiveScore100(
        applianceData?.performance?.score,
        coreSectionFallback,
      ) ?? pickScore100(applianceData?.performance?.score, coreSectionFallback),
  };
  const numericSectionScores = Object.values(sectionScores).filter(
    (score) => Number.isFinite(score) && score > 0,
  );
  const sectionAverageScore = numericSectionScores.length
    ? numericSectionScores.reduce((sum, score) => sum + score, 0) /
      numericSectionScores.length
    : null;
  const overallScoreRaw =
    pickPositiveScore100(
      persistedOverallScore,
      persistedSpecScore,
      applianceData?.hook_score,
      applianceData?.hookScore,
      applianceData?.field_profile?.score,
      applianceData?.rating,
      applianceData?.avg_rating,
      sectionAverageScore,
    ) ??
    pickScore100(
      persistedOverallScore,
      persistedSpecScore,
      applianceData?.hook_score,
      applianceData?.hookScore,
      applianceData?.field_profile?.score,
      applianceData?.rating,
      applianceData?.avg_rating,
      sectionAverageScore,
    );
  const overallScore = overallScoreRaw;
  const overallScoreBadge =
    pickScore100(persistedOverallScoreDisplay, overallScoreRaw) ??
    overallScoreRaw;
  const getSectionScore = (key) =>
    sectionScores[key] != null ? sectionScores[key] : overallScore;

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
    const normalizedStore = String(storeName || "")
      .toLowerCase()
      .trim();
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

  const isLikelyModelCode = (value) => {
    if (!value) return false;
    const s = String(value).trim();
    if (!s || /\s/.test(s)) return false;
    return /^(?:[a-z]{0,3})?[a-z]+[-]?\d+[a-z0-9-]*$/i.test(s);
  };

  const getDisplayProductName = (data) => {
    if (!data) return "";
    const preferred = String(
      data.product_name || data.name || data.title || "",
    ).trim();
    const modelNumber = String(data.model_number || "").trim();
    if (preferred) {
      if (modelNumber) {
        const escaped = modelNumber.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const stripped = preferred
          .replace(new RegExp(escaped, "ig"), " ")
          .replace(/\s+/g, " ")
          .trim();
        if (stripped) return stripped;
      }
      return preferred;
    }

    const model = String(data.model || "").trim();
    if (model && !isLikelyModelCode(model)) return model;

    return String(data.brand || data.brand_name || "").trim() || "TV";
  };

  // Build descriptive title similar to smartphone details header style
  const buildDescriptiveTitle = (data, variant) => {
    if (!data) return "";

    const model = getDisplayProductName(data) || "TV";

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
      data.specifications?.refresh_rate ||
      data.display_json?.refresh_rate ||
      "";
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
      !isPrimitive(panelRaw) || panelRaw === ""
        ? ""
        : formatSpecValue(panelRaw);

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
    : (sortedVariantStores.length ? sortedVariantStores : sortedStores).slice(
        0,
        3,
      );

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

  const getCanonicalUrl = useMemo(() => {
    if (!applianceData) {
      return SITE_ORIGIN;
    }
    try {
      const slug = generateSlug(
        applianceData.product_name || applianceData.model_number || "",
      );
      if (!slug) return SITE_ORIGIN;
      const path = `/tvs/${slug}`;
      return `${SITE_ORIGIN}${path}`;
    } catch (e) {
      return SITE_ORIGIN;
    }
  }, [applianceData]);

  const getShareUrl = () => {
    try {
      const base = getCanonicalUrl;
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
      return getCanonicalUrl;
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
        { id: "video_engine", label: "Video", icon: FaChartBar },
        { id: "audio", label: "Audio", icon: FaVolumeUp },
        { id: "smart_tv", label: "Smart TV", icon: FaBolt },
        { id: "connectivity", label: "Connectivity", icon: FaWifi },
        { id: "ports", label: "Ports", icon: FaPlug },
        { id: "gaming", label: "Gaming", icon: FaGamepad },
        { id: "power", label: "Power", icon: FaBatteryFull },
        { id: "physical_details", label: "Physical", icon: FaRuler },
        { id: "product_details", label: "Details", icon: FaInfoCircle },
        { id: "in_the_box", label: "In Box", icon: FaShoppingCart },
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
  const primaryTabs = [
    { id: "info", label: "Info" },
    { id: "specs", label: "Specs" },
  ];

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

  const formatSpecValueText = (value) => {
    if (value === null || value === undefined || value === "") {
      return "Not specified";
    }
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (Array.isArray(value)) {
      const filtered = value
        .map((v) => formatSpecValueText(v))
        .map((v) => v.trim())
        .filter(Boolean);
      return filtered.length ? filtered.join(", ") : "Not specified";
    }
    if (typeof value === "object") {
      const entries = Object.entries(value)
        .filter(([_, v]) => hasContent(v))
        .map(([k, v]) => `${toNormalCase(k)}: ${formatSpecValueText(v)}`);
      return entries.length ? entries.join(" | ") : "Not specified";
    }
    return String(value);
  };

  const isVariantSizeLabel = (label) =>
    /^\s*\d+(\.\d+)?\s*(inch|inches|cm|mm|")\s*$/i.test(
      String(label || "").trim(),
    );

  const parseVariantRowsFromString = (rawValue) => {
    const text = String(rawValue || "").trim();
    if (!text || !text.includes("|")) return null;

    const tokens = text
      .split("|")
      .map((token) => token.trim())
      .filter(Boolean);
    if (tokens.length < 2) return null;

    const rows = [];
    let currentRow = null;
    let foundVariantToken = false;

    tokens.forEach((token) => {
      const match = token.match(
        /^(\d+(\.\d+)?\s*(inch|inches|cm|mm|"))\s*:\s*(.*)$/i,
      );
      if (match) {
        foundVariantToken = true;
        currentRow = {
          label: match[1].trim(),
          parts: [],
        };
        const remainder = (match[4] || "").trim();
        if (remainder) currentRow.parts.push(remainder);
        rows.push(currentRow);
        return;
      }

      if (currentRow) currentRow.parts.push(token);
    });

    if (!foundVariantToken || !rows.length) return null;

    const normalized = rows
      .map((row) => ({
        label: row.label,
        value: row.parts.join(" | ").trim(),
      }))
      .filter((row) => row.label && row.value);

    return normalized.length ? normalized : null;
  };

  const parseVariantRowsFromObject = (value) => {
    if (!value || typeof value !== "object" || Array.isArray(value))
      return null;
    const entries = Object.entries(value).filter(([_, v]) => hasContent(v));
    if (!entries.length) return null;
    if (!entries.every(([k]) => isVariantSizeLabel(k))) return null;

    const normalized = entries.map(([label, rowValue]) => ({
      label: String(label).trim(),
      value: formatSpecValueText(rowValue),
    }));
    return normalized.length ? normalized : null;
  };

  const parseMeasurementGroups = (rawValue) => {
    const text = String(rawValue || "").trim();
    if (!text || !text.includes("|")) return null;

    const tokens = text
      .split("|")
      .map((token) => token.trim())
      .filter(Boolean);
    if (!tokens.length) return null;

    const metricPattern =
      /^(width|height|length|depth|weight|thickness|diagonal)\s*:\s*(.+)$/i;
    const groupHintPattern =
      /^(with|without|stand|packing|package|base|mount|wall|net|gross)\b/i;

    const groups = [];
    let currentGroup = null;
    let metricCount = 0;

    const startGroup = (label) => {
      currentGroup = {
        label: toNormalCase(label || "General"),
        metrics: {},
        others: [],
      };
      groups.push(currentGroup);
    };

    tokens.forEach((token) => {
      const metricMatch = token.match(metricPattern);
      if (metricMatch) {
        if (!currentGroup) startGroup("General");
        currentGroup.metrics[String(metricMatch[1]).toLowerCase()] = String(
          metricMatch[2],
        ).trim();
        metricCount += 1;
        return;
      }

      const colonIndex = token.indexOf(":");
      if (colonIndex > -1) {
        const prefix = token.slice(0, colonIndex).trim();
        const rest = token.slice(colonIndex + 1).trim();

        if (groupHintPattern.test(prefix)) {
          startGroup(prefix);
          if (rest) {
            const nestedMetricMatch = rest.match(metricPattern);
            if (nestedMetricMatch) {
              currentGroup.metrics[String(nestedMetricMatch[1]).toLowerCase()] =
                String(nestedMetricMatch[2]).trim();
              metricCount += 1;
            } else {
              currentGroup.others.push(rest);
            }
          }
          return;
        }
      }

      if (!currentGroup) startGroup("General");
      currentGroup.others.push(token);
    });

    if (!metricCount) return null;

    return groups.map((group) => {
      const otherMetrics = Object.entries(group.metrics)
        .filter(([key]) => !["width", "height", "length"].includes(key))
        .map(([key, value]) => `${toNormalCase(key)}: ${value}`);
      return {
        label: group.label,
        width: group.metrics.width || "",
        height: group.metrics.height || "",
        length: group.metrics.length || "",
        others: [...group.others, ...otherMetrics].filter(Boolean).join(" | "),
      };
    });
  };

  const renderVariantRows = (rows) => {
    const expandedRows = rows.flatMap((row) => {
      const measurementGroups = parseMeasurementGroups(row.value);
      if (measurementGroups?.length) {
        return measurementGroups.map((group) => ({
          size: row.label,
          type: group.label || "-",
          width: group.width || "-",
          height: group.height || "-",
          length: group.length || "-",
          others: group.others || "-",
          hasMeasurement: true,
        }));
      }
      return [
        {
          size: row.label,
          value: row.value || "-",
          hasMeasurement: false,
        },
      ];
    });

    const hasMeasurement = expandedRows.some((row) => row.hasMeasurement);

    if (hasMeasurement) {
      const groupedBySize = expandedRows.reduce((acc, row) => {
        const sizeKey = row.size || "-";
        if (!acc[sizeKey]) acc[sizeKey] = [];
        acc[sizeKey].push(row);
        return acc;
      }, {});

      const groupedRows = Object.entries(groupedBySize).map(
        ([size, items]) => ({
          size,
          items,
        }),
      );

      return (
        <div className="rounded-md">
          <div className="space-y-2 sm:hidden">
            {groupedRows.map(({ size, items }) => (
              <div key={size} className="px-2.5 py-2 text-[11px]">
                <div className="font-semibold text-gray-800 break-words">
                  {size}
                </div>
                <div className="mt-1.5 space-y-1.5">
                  {items.map((item, itemIndex) => (
                    <div
                      key={`${size}-${itemIndex}`}
                      className="rounded-md bg-gray-50 px-2 py-1.5"
                    >
                      {item.type && item.type !== "-" ? (
                        <div className="font-medium text-gray-700 break-words">
                          {item.type}
                        </div>
                      ) : null}
                      <div className="mt-1 grid grid-cols-2 gap-x-2 gap-y-1 text-gray-700">
                        {item.width && item.width !== "-" ? (
                          <div>
                            <span className="font-medium text-gray-500">
                              Width:{" "}
                            </span>
                            <span className="break-words">{item.width}</span>
                          </div>
                        ) : null}
                        {item.height && item.height !== "-" ? (
                          <div>
                            <span className="font-medium text-gray-500">
                              Height:{" "}
                            </span>
                            <span className="break-words">{item.height}</span>
                          </div>
                        ) : null}
                        {item.length && item.length !== "-" ? (
                          <div>
                            <span className="font-medium text-gray-500">
                              Length:{" "}
                            </span>
                            <span className="break-words">{item.length}</span>
                          </div>
                        ) : null}
                        {item.others && item.others !== "-" ? (
                          <div className="col-span-2">
                            <span className="font-medium text-gray-500">
                              Others:{" "}
                            </span>
                            <span className="break-words">{item.others}</span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="hidden sm:block">
            <table className="w-full table-fixed text-[11px] sm:text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-left font-semibold text-gray-700">
                    Size
                  </th>
                  <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-left font-semibold text-gray-700">
                    Type
                  </th>
                  <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-left font-semibold text-gray-700">
                    Width
                  </th>
                  <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-left font-semibold text-gray-700">
                    Height
                  </th>
                  <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-left font-semibold text-gray-700">
                    Length
                  </th>
                  <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-left font-semibold text-gray-700">
                    Others
                  </th>
                </tr>
              </thead>
              <tbody>
                {expandedRows.map((row, index) => (
                  <tr
                    key={`${row.size}-${index}`}
                    className="odd:bg-white even:bg-gray-50"
                  >
                    <td className="px-2 sm:px-3 py-1.5 sm:py-2 font-semibold text-gray-700 align-top break-words">
                      {row.size}
                    </td>
                    <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-gray-900 align-top break-words">
                      {row.hasMeasurement ? row.type : "-"}
                    </td>
                    <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-gray-900 align-top break-words">
                      {row.hasMeasurement ? row.width : "-"}
                    </td>
                    <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-gray-900 align-top break-words">
                      {row.hasMeasurement ? row.height : "-"}
                    </td>
                    <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-gray-900 align-top break-words">
                      {row.hasMeasurement ? row.length : "-"}
                    </td>
                    <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-gray-900 align-top break-words">
                      {row.hasMeasurement ? row.others : row.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    return (
      <div className="rounded-md">
        <div className="space-y-2 sm:hidden">
          {expandedRows.map((row, index) => (
            <div key={`${row.size}-${index}`} className="px-2.5 py-2">
              <div className="text-[11px] font-semibold text-gray-700 break-words">
                {row.size}
              </div>
              <div className="mt-0.5 text-xs text-gray-900 break-words">
                {row.value || "-"}
              </div>
            </div>
          ))}
        </div>
        <div className="hidden sm:block">
          <table className="w-full table-fixed text-xs sm:text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-left font-semibold text-gray-700 w-[100px]">
                  Size
                </th>
                <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-left font-semibold text-gray-700">
                  Value
                </th>
              </tr>
            </thead>
            <tbody>
              {expandedRows.map((row, index) => (
                <tr
                  key={`${row.size}-${index}`}
                  className="odd:bg-white even:bg-gray-50"
                >
                  <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs font-semibold text-gray-700 align-top break-words">
                    {row.size}
                  </td>
                  <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-900 align-top break-words">
                    {row.value || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderSpecValue = (value) => {
    if (value === null || value === undefined || value === "") {
      return "Not specified";
    }

    if (typeof value === "string") {
      const variantRows = parseVariantRowsFromString(value);
      if (variantRows) return renderVariantRows(variantRows);
      return value;
    }

    if (typeof value === "object" && !Array.isArray(value)) {
      const variantRows = parseVariantRowsFromObject(value);
      if (variantRows) return renderVariantRows(variantRows);
    }

    return formatSpecValueText(value);
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
      <div className="rounded-md">
        <div className="space-y-2 sm:hidden">
          {rows.map(([key, value], idx) => (
            <div
              key={key}
              className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} px-2.5 py-2`}
            >
              <div className="text-[11px] font-semibold text-gray-600 break-words">
                {toNormalCase(key)}
              </div>
              <div className="mt-1 text-xs text-gray-900 break-words whitespace-normal">
                {renderSpecValue(value)}
              </div>
            </div>
          ))}
        </div>
        <div className="hidden sm:block">
          <table className="w-full table-fixed shadow-none">
            <tbody className="bg-white">
              {rows.map(([key, value], idx) => (
                <tr
                  key={key}
                  className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  <td className="px-2.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-gray-600 w-[34%] align-top break-words">
                    {toNormalCase(key)}
                  </td>
                  <td className="px-2.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-gray-900 align-top break-words whitespace-normal">
                    {renderSpecValue(value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    const sectionId =
      tabId === "specifications" ? "tv-specifications" : `tv-${tabId}`;
    window.requestAnimationFrame(() => {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const renderTabContent = () => {
    if (!applianceData) return null;

    const primarySpecs =
      applianceData.key_specs_json || applianceData.specifications || {};
    const generalSection = {
      brand: applianceData.brand || applianceData.brand_name || "",
      model: applianceData.model_number || applianceData.model || "",
      category: applianceData.category || applianceData.appliance_type || "",
      screen_size:
        primarySpecs.screen_size ||
        applianceData.display_json?.screen_size ||
        "",
      resolution:
        primarySpecs.resolution || applianceData.display_json?.resolution || "",
      refresh_rate:
        primarySpecs.refresh_rate ||
        applianceData.display_json?.refresh_rate ||
        "",
      panel_type:
        primarySpecs.panel_type || applianceData.display_json?.panel_type || "",
      operating_system:
        primarySpecs.operating_system ||
        applianceData.smart_tv_json?.operating_system ||
        "",
      audio_output:
        primarySpecs.audio_output ||
        applianceData.audio_json?.output_power ||
        "",
      energy_rating:
        applianceData.power_json?.energy_rating ||
        applianceData.power_json?.energy_star_rating ||
        primarySpecs.energy_rating ||
        "",
      release_year: applianceData.release_year || "",
      country_of_origin:
        applianceData.country ||
        applianceData.product_details_json?.country_of_origin ||
        applianceData.warranty_json?.country_of_origin ||
        "",
    };

    if (isTvProduct) {
      return (
        <div id="tv-specifications" className="space-y-6">
          <div className="bg-white rounded-lg p-3 sm:p-4">
            <div className="mb-6 flex items-center justify-between gap-2">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FaMicrochip className={currentColor.text} />
                Core Specifications
              </h3>
              <SpecScoreBadge
                score={getSectionScore("specifications")}
                size={38}
              />
            </div>
            {renderSpecTable(generalSection)}
          </div>

          {hasContent(
            applianceData.key_specs_json || applianceData.specifications,
          ) && (
            <div id="tv-display" className="bg-white rounded-lg p-3 sm:p-4">
              <div className="mb-6 flex items-center justify-between gap-2">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FaTv className={currentColor.text} />
                  Display
                </h3>
                <SpecScoreBadge score={getSectionScore("display")} size={38} />
              </div>
              {renderSpecTable(
                applianceData.display_json ||
                  applianceData.key_specs_json ||
                  applianceData.specifications,
              )}
            </div>
          )}

          {hasContent(applianceData.video_engine_json) && (
            <div
              id="tv-video_engine"
              className="bg-white rounded-lg p-3 sm:p-4"
            >
              <div className="mb-6 flex items-center justify-between gap-2">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FaChartBar className={currentColor.text} />
                  Video Engine
                </h3>
                <SpecScoreBadge
                  score={getSectionScore("video_engine")}
                  size={38}
                />
              </div>
              {renderSpecTable(applianceData.video_engine_json)}
            </div>
          )}

          {hasContent(applianceData.audio_json) && (
            <div id="tv-audio" className="bg-white rounded-lg p-3 sm:p-4">
              <div className="mb-6 flex items-center justify-between gap-2">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FaVolumeUp className={currentColor.text} />
                  Audio
                </h3>
                <SpecScoreBadge score={getSectionScore("audio")} size={38} />
              </div>
              {renderSpecTable(applianceData.audio_json)}
            </div>
          )}

          {hasContent(applianceData.smart_tv_json) && (
            <div id="tv-smart_tv" className="bg-white rounded-lg p-3 sm:p-4">
              <div className="mb-6 flex items-center justify-between gap-2">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FaBolt className={currentColor.text} />
                  Smart TV
                </h3>
                <SpecScoreBadge score={getSectionScore("smart_tv")} size={38} />
              </div>
              {renderSpecTable(applianceData.smart_tv_json)}
            </div>
          )}

          {hasContent(applianceData.connectivity_json) && (
            <div
              id="tv-connectivity"
              className="bg-white rounded-lg p-3 sm:p-4"
            >
              <div className="mb-6 flex items-center justify-between gap-2">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FaWifi className={currentColor.text} />
                  Connectivity
                </h3>
                <SpecScoreBadge
                  score={getSectionScore("connectivity")}
                  size={38}
                />
              </div>
              {renderSpecTable(applianceData.connectivity_json)}
            </div>
          )}

          {hasContent(applianceData.ports_json) && (
            <div id="tv-ports" className="bg-white rounded-lg p-3 sm:p-4">
              <div className="mb-6 flex items-center justify-between gap-2">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FaPlug className={currentColor.text} />
                  Ports
                </h3>
                <SpecScoreBadge score={getSectionScore("ports")} size={38} />
              </div>
              {renderSpecTable(applianceData.ports_json)}
            </div>
          )}

          {hasContent(applianceData.gaming_json) && (
            <div id="tv-gaming" className="bg-white rounded-lg p-3 sm:p-4">
              <div className="mb-6 flex items-center justify-between gap-2">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FaGamepad className={currentColor.text} />
                  Gaming
                </h3>
                <SpecScoreBadge score={getSectionScore("gaming")} size={38} />
              </div>
              {renderSpecTable(applianceData.gaming_json)}
            </div>
          )}

          {hasContent(applianceData.power_json) && (
            <div id="tv-power" className="bg-white rounded-lg p-3 sm:p-4">
              <div className="mb-6 flex items-center justify-between gap-2">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FaBatteryFull className={currentColor.text} />
                  Power
                </h3>
                <SpecScoreBadge score={getSectionScore("power")} size={38} />
              </div>
              {renderSpecTable(applianceData.power_json)}
            </div>
          )}

          {hasContent(
            applianceData.physical_json ||
              applianceData.dimensions_json ||
              applianceData.physical_details,
          ) && (
            <div
              id="tv-physical_details"
              className="bg-white rounded-lg p-3 sm:p-4"
            >
              <div className="mb-6 flex items-center justify-between gap-2">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FaRuler className={currentColor.text} />
                  Physical
                </h3>
                <SpecScoreBadge
                  score={getSectionScore("physical_details")}
                  size={38}
                />
              </div>
              {renderSpecTable(
                applianceData.physical_json ||
                  applianceData.dimensions_json ||
                  applianceData.physical_details,
              )}
            </div>
          )}

          {hasContent(applianceData.product_details_json) && (
            <div
              id="tv-product_details"
              className="bg-white rounded-lg p-3 sm:p-4"
            >
              <div className="mb-6 flex items-center justify-between gap-2">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FaInfoCircle className={currentColor.text} />
                  Product Details
                </h3>
                <SpecScoreBadge
                  score={getSectionScore("product_details")}
                  size={38}
                />
              </div>
              {renderSpecTable(applianceData.product_details_json)}
            </div>
          )}

          {hasContent(applianceData.in_the_box_json) && (
            <div id="tv-in_the_box" className="bg-white rounded-lg p-3 sm:p-4">
              <div className="mb-6 flex items-center justify-between gap-2">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FaShoppingCart className={currentColor.text} />
                  In The Box
                </h3>
                <SpecScoreBadge
                  score={getSectionScore("in_the_box")}
                  size={38}
                />
              </div>
              {renderSpecTable(applianceData.in_the_box_json)}
            </div>
          )}

          {hasContent(
            applianceData.warranty_json || applianceData.warranty,
          ) && (
            <div id="tv-warranty" className="bg-white rounded-lg p-3 sm:p-4">
              <div className="mb-6 flex items-center justify-between gap-2">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FaShieldAlt className={currentColor.text} />
                  Warranty
                </h3>
                <SpecScoreBadge score={getSectionScore("warranty")} size={38} />
              </div>
              {renderSpecTable(
                applianceData.warranty_json || applianceData.warranty,
              )}
            </div>
          )}
        </div>
      );
    }

    return (
      <div id="tv-specifications" className="space-y-6">
        <div className="bg-white rounded-lg p-3 sm:p-4">
          <div className="mb-6 flex items-center justify-between gap-2">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FaMicrochip className={currentColor.text} />
              Technical Specifications
            </h3>
            <SpecScoreBadge
              score={getSectionScore("specifications")}
              size={38}
            />
          </div>
          {renderSpecTable(applianceData.specifications || generalSection)}
        </div>
        {hasContent(applianceData.features) && (
          <div id="tv-features" className="bg-white rounded-lg p-3 sm:p-4">
            <div className="mb-6 flex items-center justify-between gap-2">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FaBolt className={currentColor.text} />
                Features
              </h3>
              <SpecScoreBadge score={getSectionScore("features")} size={38} />
            </div>
            {renderSpecTable(applianceData.features)}
          </div>
        )}
        {hasContent(applianceData.performance) && (
          <div id="tv-performance" className="bg-white rounded-lg p-3 sm:p-4">
            <div className="mb-6 flex items-center justify-between gap-2">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FaChartBar className={currentColor.text} />
                Performance
              </h3>
              <SpecScoreBadge
                score={getSectionScore("performance")}
                size={38}
              />
            </div>
            {renderSpecTable(applianceData.performance)}
          </div>
        )}
        {hasContent(applianceData.physical_details) && (
          <div
            id="tv-physical_details"
            className="bg-white rounded-lg p-3 sm:p-4"
          >
            <div className="mb-6 flex items-center justify-between gap-2">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FaRuler className={currentColor.text} />
                Physical Details
              </h3>
              <SpecScoreBadge
                score={getSectionScore("physical_details")}
                size={38}
              />
            </div>
            {renderSpecTable(applianceData.physical_details)}
          </div>
        )}
        {hasContent(applianceData.warranty) && (
          <div id="tv-warranty" className="bg-white rounded-lg p-3 sm:p-4">
            <div className="mb-6 flex items-center justify-between gap-2">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FaShieldAlt className={currentColor.text} />
                Warranty
              </h3>
              <SpecScoreBadge score={getSectionScore("warranty")} size={38} />
            </div>
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
      <div className="px-2 lg:px-4 mx-auto max-w-4xl w-full p-4">
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
  const headerTitle =
    getDisplayProductName(applianceData) || applianceData?.product_name || "TV";
  const headerType = toNormalCase(
    applianceData?.product_type || applianceData?.category || "Smart TV",
  );
  const headerProcessor = toSafeText(
    applianceData?.display_json?.picture_processor ||
      applianceData?.specifications?.picture_processor ||
      applianceData?.performance?.processor ||
      "",
  );
  const headerPanel = toSafeText(
    applianceData?.specifications?.panel_type ||
      applianceData?.display_json?.panel_type ||
      "",
  );
  const headerRefreshRaw = toSafeText(
    applianceData?.specifications?.refresh_rate ||
      applianceData?.display_json?.refresh_rate ||
      "",
  );
  const headerRefresh =
    headerRefreshRaw && /^\d+(\.\d+)?$/.test(headerRefreshRaw)
      ? `${headerRefreshRaw}Hz`
      : headerRefreshRaw;
  const headerDescriptor = dedupeTextParts([
    headerType,
    headerProcessor,
    headerPanel,
    headerRefresh,
  ]).join(" | ");
  const metaName =
    descriptiveTitle || getDisplayProductName(applianceData) || "TV";
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
  const currentMonthYearLabel = new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
  }).format(new Date());
  const metaTitleWithMonthYear = String(metaTitle).includes(
    currentMonthYearLabel,
  )
    ? metaTitle
    : `${metaTitle} (${currentMonthYearLabel})`;
  const metaDescription = tvMeta.description({
    name: metaName,
    brand: metaBrand,
    screenSize: metaScreenSize,
    resolution: metaResolution,
    os: metaOs,
  });
  const metaKeywords = buildDeviceSeoKeywords({
    device: applianceData,
    productName: metaNameWithBrand || metaName || "",
    brand: metaBrand,
    category: "smart tv",
    currentYear: new Date().getFullYear(),
    baseTerms: [
      "smart tv",
      "tv price in india",
      "compare tv specifications",
      metaScreenSize ? `${metaScreenSize} tv` : "",
      metaResolution ? `${metaResolution} tv` : "",
      metaOs ? `${metaOs} tv` : "",
    ],
    maxKeywords: 45,
  });
  const canonicalUrl = getCanonicalUrl;
  const metaImage = applianceData?.images?.[0] || null;
  const toAbsoluteUrl = (url) => {
    if (!url) return "";
    if (/^https?:\/\//i.test(url)) return url;
    if (typeof window === "undefined") return url;
    const origin = window.location.origin;
    if (!origin) return url;
    return url.startsWith("/") ? `${origin}${url}` : `${origin}/${url}`;
  };
  const ogImage = toAbsoluteUrl(metaImage);
  const productSchemaJson = (() => {
    const name = metaNameWithBrand || metaName || metaTitle || "";
    if (!name) return null;
    const schema = createProductSchema({
      name,
      description: metaDescription,
      image: ogImage || undefined,
      url: canonicalUrl,
      brand: metaBrand || undefined,
    });
    return JSON.stringify(schema);
  })();

  return (
    <div className="px-2 lg:px-4 mx-auto max-w-4xl w-full bg-white">
      <Helmet prioritizeSeoTags>
        <title>{metaTitleWithMonthYear}</title>
        <meta name="description" content={metaDescription} />
        <meta name="keywords" content={metaKeywords} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="product" />
        <meta property="og:title" content={metaTitleWithMonthYear} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:site_name" content="Hooks" />
        {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
        {ogImage && <meta property="og:image" content={ogImage} />}
        {ogImage && (
          <meta property="og:image:secure_url" content={ogImage} />
        )}
        {ogImage && <meta property="og:image:type" content="image/jpeg" />}
        {ogImage && <meta property="og:image:width" content="1200" />}
        {ogImage && <meta property="og:image:height" content="630" />}
        <meta
          name="twitter:card"
          content={ogImage ? "summary_large_image" : "summary"}
        />
        <meta name="twitter:site" content="@tryhooks" />
        <meta name="twitter:creator" content="@tryhooks" />
        <meta name="twitter:title" content={metaTitleWithMonthYear} />
        <meta name="twitter:description" content={metaDescription} />
        {ogImage && <meta name="twitter:image" content={ogImage} />}
        {productSchemaJson && (
          <script type="application/ld+json">{productSchemaJson}</script>
        )}
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
        <div className="p-4 border-b border-gray-200 lg:hidden">
          <div className="flex justify-between items-start mb-3">
            <div>
              {headerDescriptor ? (
                <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  {headerDescriptor}
                </p>
              ) : null}
              <h1 className="text-xl font-extrabold tracking-tight mb-1 text-gray-900 leading-tight">
                {headerTitle}
              </h1>
              {currentVariantLabel ? (
                <p className="text-purple-700 text-sm font-medium">
                  {currentVariantLabel}
                </p>
              ) : null}
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
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-3">
              {popularComparisonTargets.map((d) => {
                const otherId = d?.id ?? d?.product_id ?? d?.productId ?? null;
                const otherName =
                  d?.product_name || d?.name || d?.model || "TV";
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

        <div className="border-t border-slate-200 bg-white">
          <div className="flex overflow-x-auto no-scrollbar border-b border-slate-200 bg-white">
            {primaryTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActivePrimaryTab(tab.id)}
                className={`group relative flex items-center gap-2 px-4 py-3 font-medium text-sm whitespace-nowrap transition-colors duration-200 flex-shrink-0 focus-visible:outline-none ${
                  activePrimaryTab === tab.id
                    ? "bg-white"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <span
                  className={
                    activePrimaryTab === tab.id
                      ? "bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600 bg-clip-text text-transparent"
                      : ""
                  }
                >
                  {tab.label}
                </span>
                {activePrimaryTab === tab.id ? (
                  <span className="pointer-events-none absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600" />
                ) : null}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row">
          {/* Images Section */}
          <div className="lg:w-2/5 p-4">
            {/* Main Image */}
            <div className="rounded-xl bg-gray-100 p-8 mb-6 relative">
              <div className="absolute left-2 top-2 z-10 pointer-events-none">
                <SpecScoreBadge
                  score={overallScoreBadge}
                  size={40}
                  showSpecLabel
                  zeroFallback
                />
              </div>
              <img
                src={
                  galleryImages?.[activeImage] || "/placeholder-appliance.jpg"
                }
                alt={applianceData.product_name}
                className="w-full h-64 object-contain "
                onError={(e) => {
                  e.target.src =
                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23ffffff'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='16' fill='%239ca3af'%3ENo Image Available%3C/text%3E%3C/svg%3E";
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
                        : "border-gray-100 hover:border-gray-200"
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
                <h4 className="text-sm font-semibold text-gray-800 mb-2">
                  Available Variants
                </h4>
                <div className="grid grid-cols-2 gap-2.5">
                  {variants.map((variant, index) => (
                    <button
                      key={variant.id || index}
                      onClick={() => setSelectedVariant(index)}
                      aria-pressed={selectedVariant === index}
                      className={`relative p-2.5 rounded-xl border-2 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${
                        selectedVariant === index
                          ? "border-violet-600 bg-violet-50 shadow-sm"
                          : "border-slate-200 bg-white hover:border-violet-300 hover:bg-violet-50/40"
                      }`}
                    >
                      {selectedVariant === index ? (
                        <span className="absolute top-2 right-2 inline-flex items-center justify-center w-4 h-4 rounded-full bg-violet-600 text-white">
                          <FaCheck className="text-[9px]" />
                        </span>
                      ) : null}
                      <div className="font-semibold text-gray-900 text-sm mb-1 leading-tight">
                        {toSafeText(
                          variant.capacity ||
                            variant.screen_size ||
                            variant.type ||
                            applianceData.specifications?.screen_size ||
                            `Variant ${index + 1}`,
                        ) || `Variant ${index + 1}`}
                      </div>
                      <div className="text-[11px] text-gray-500 mb-1.5 leading-tight">
                        {toSafeText(
                          variant.resolution ||
                            variant.specification_summary ||
                            applianceData.specifications?.resolution ||
                            applianceData.specifications?.panel_type ||
                            "",
                        )}
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
          </div>

          {/* Details Section */}
          <div className="lg:w-3/5 p-4">
            {/* Desktop Header */}
            <div className="hidden lg:block mb-8">
              <div className="flex items-start justify-between mb-4">
                <div>
                  {headerDescriptor ? (
                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                      {headerDescriptor}
                    </p>
                  ) : null}
                  <h1 className="text-2xl font-extrabold tracking-tight mb-2 text-gray-900">
                    {headerTitle}
                  </h1>
                  {currentVariantLabel ? (
                    <h4 className="text-purple-700 mb-3 font-medium text-sm">
                      {currentVariantLabel}
                    </h4>
                  ) : null}
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

              <div className="mb-4">
                {headlinePrice ? (
                  <span className="text-3xl font-bold text-green-600">
                    {RUPEE_SYMBOL} {formatPrice(headlinePrice)}
                  </span>
                ) : null}
              </div>
            </div>

            {/* Store Prices Section */}
            {sortedStores.length > 0 && (
              <div className="mb-5 mt-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <FaStore className="text-purple-500" />
                    Check Price on
                  </h3>
                  {sortedStores.length > 3 && (
                    <button
                      onClick={() => setShowAllStores(!showAllStores)}
                      className="text-purple-600 text-sm font-medium flex items-center gap-1"
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

                <div className="space-y-3">
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
                    const hasStoreUrl = Boolean(visitUrl);

                    return (
                      <div
                        key={store.id || index}
                        className="bg-white border rounded-xl p-2.5 transition-all duration-200 border-gray-200 hover:border-violet-300 hover:shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5 flex-1">
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center p-2 shadow-sm">
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
                              <h4 className="font-bold text-gray-900 text-sm capitalize">
                                {store.store_name}
                              </h4>
                              <p className="text-[11px] text-gray-500">
                                {store.variantName || store.variantSpec}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="text-sm font-bold text-green-600">
                                {RUPEE_SYMBOL} {formatPrice(store.price)}
                              </div>
                            </div>
                            <a
                              href={hasStoreUrl ? visitUrl : undefined}
                              target="_blank"
                              rel="noopener noreferrer nofollow"
                              onClick={(e) => {
                                if (!hasStoreUrl) e.preventDefault();
                              }}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs transition-all duration-200 ${
                                hasStoreUrl
                                  ? "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-sm hover:shadow-md"
                                  : "bg-gray-200 text-gray-500 cursor-not-allowed"
                              }`}
                            >
                              <FaExternalLinkAlt className="text-xs" />
                              {hasStoreUrl ? "Buy Now" : "Unavailable"}
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Ratings summary removed */}

        {activePrimaryTab === "info" ? (
          <div className="border-t border-slate-200">
            <div className="p-0 sm:p-2">
              <div className="bg-white p-3 sm:p-4">
                <div className="mb-3 flex items-center justify-between gap-2 pb-2">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      Key Specs
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Quick TV essentials for display, audio, and daily
                      experience.
                    </p>
                  </div>
                  <SpecScoreBadge
                    score={getSectionScore("specifications")}
                    size={38}
                  />
                </div>
                {renderSpecTable(
                  applianceData.key_specs_json ||
                    applianceData.specifications ||
                    {},
                )}
              </div>
            </div>

            {currentProductId ? (
              <ProductDiscoverySections
                productId={currentProductId}
                currentBrand={applianceData?.brand || ""}
                entityType="tvs"
                className="w-full border-t border-slate-200"
              />
            ) : null}
          </div>
        ) : null}

        {activePrimaryTab === "specs" ? (
          <div className="border-t border-indigo-200">
            <div className="flex overflow-x-auto no-scrollbar border-b border-indigo-200">
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    className={`group relative flex items-center gap-2 px-4 py-3 font-medium text-sm whitespace-nowrap transition-colors duration-200 flex-shrink-0 focus-visible:outline-none ${
                      activeTab === tab.id
                        ? "bg-white"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <IconComponent
                      className={`text-sm ${
                        activeTab === tab.id
                          ? "text-violet-400"
                          : "text-gray-500 group-hover:text-gray-700"
                      }`}
                    />
                    <span
                      className={
                        activeTab === tab.id
                          ? "bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600 bg-clip-text text-transparent"
                          : ""
                      }
                    >
                      {tab.label}
                    </span>
                    {activeTab === tab.id ? (
                      <span className="pointer-events-none absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600" />
                    ) : null}
                  </button>
                );
              })}
            </div>

            <div className="p-0 sm:p-2">{renderTabContent()}</div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default TVDetailCard;
