// src/components/TVDetailCard.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import useDevice from "../../hooks/useDevice";
import { generateSlug, extractNameFromSlug } from "../../utils/slugGenerator";
import {
  createProductSchema,
  createWebPageSchema,
} from "../../utils/schemaGenerators";
import SEO from "../SEO";
import usePageEngagementTracker from "../../hooks/usePageEngagementTracker";
import Breadcrumbs from "../Breadcrumbs";
import DetailPageNavigator from "../ui/DetailPageNavigator";

// Icons
import {
  FaShare,
  FaCheck,
  FaExternalLinkAlt,
  FaStore,
  FaChevronDown,
  FaChevronLeft,
  FaChevronRight,
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
  FaPlus,
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
import LatestNewsRouteSection from "../ui/LatestNewsRouteSection";
import ProductDiscoverySections from "../ui/ProductDiscoverySections";
import useDeviceFieldProfiles from "../../hooks/useDeviceFieldProfiles";
import { resolveDeviceFieldProfile } from "../../utils/deviceFieldProfiles";
import { buildDeviceSeoKeywords } from "../../utils/seoKeywordBuilder";
import { toCanonicalPageUrl } from "../../utils/publicUrl";

// Ratings UI removed: review submission and inline rating input deleted

// Data comes from API via `useDevice()`; embedded mock removed.
const mockAppliances = [];
const SITE_ORIGIN = "https://mobilex.in";

const TvOrbitArtwork = () => (
  <div
    aria-hidden="true"
    className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
  >
    <div className="absolute left-[12%] top-[10%] h-32 w-32 rounded-full bg-blue-400/10 blur-3xl sm:h-44 sm:w-44" />
    <div className="absolute bottom-[8%] right-[8%] h-36 w-36 rounded-full bg-indigo-400/10 blur-3xl sm:h-52 sm:w-52" />
    <svg
      viewBox="0 0 620 500"
      fill="none"
      className="absolute inset-0 h-full w-full text-blue-500/20"
      preserveAspectRatio="xMidYMid slice"
    >
      <ellipse cx="310" cy="250" rx="198" ry="154" stroke="currentColor" strokeWidth="1.2" strokeDasharray="8 12" />
      <ellipse cx="310" cy="250" rx="148" ry="204" stroke="currentColor" strokeWidth="1" strokeDasharray="3 13" transform="rotate(22 310 250)" />
      <path d="M74 357C160 314 191 349 244 316C302 281 288 210 360 183C417 161 463 185 550 133" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M102 117H174L197 140H247" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M445 374H512L534 352H574" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="102" cy="117" r="4" fill="currentColor" />
      <circle cx="247" cy="140" r="4" fill="currentColor" />
      <circle cx="74" cy="357" r="4" fill="currentColor" />
      <circle cx="360" cy="183" r="4" fill="currentColor" />
      <circle cx="550" cy="133" r="4" fill="currentColor" />
      <circle cx="445" cy="374" r="4" fill="currentColor" />
      <circle cx="574" cy="352" r="4" fill="currentColor" />
    </svg>
    <div className="absolute left-5 top-5 hidden items-center gap-1.5 sm:flex">
      <span className="h-1.5 w-8 rounded-full bg-blue-600/35" />
      <span className="h-1.5 w-3 rounded-full bg-blue-400/25" />
      <span className="h-1.5 w-1.5 rounded-full bg-indigo-500/30" />
    </div>
    <div className="absolute bottom-7 right-6 hidden grid-cols-3 gap-1.5 sm:grid">
      {Array.from({ length: 9 }).map((_, index) => (
        <span
          key={index}
          className={`h-1.5 w-1.5 rounded-full ${
            index === 4 ? "bg-blue-600/40" : "bg-slate-400/20"
          }`}
        />
      ))}
    </div>
  </div>
);

const TvXScoreLogo = ({ className }) => (
  <svg
    viewBox="0 0 874 420"
    className={className}
    preserveAspectRatio="xMidYMid meet"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    role="img"
    aria-label="MobileX"
  >
    <path fill="#111318" d="M0 419H99L101 142L288 327L471 145L400 75L288 185L101 0H0V419Z" />
    <path fill="#111318" d="M365 0L568 202L357 419H476L689 202L488 0H365Z" />
    <path fill="#2563EB" d="M868 0H746L639 117L700 179L868 0Z" />
    <path fill="#2563EB" d="M631 298L746 420H874L694 235L631 298Z" />
  </svg>
);

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

const resolveTvSpecScore = (device, fallbackScore = null) => {
  const directScore = normalizeScore100(
    device?.spec_score ?? device?.specScore,
  );
  if (directScore != null) return directScore;

  const derivedScore = normalizeScore100(fallbackScore);
  if (derivedScore != null) return derivedScore;

  return normalizeScore100(
    device?.spec_score_display ??
      device?.specScoreDisplay ??
      device?.overall_score_display ??
      device?.overallScoreDisplay ??
      device?.overall_score ??
      device?.overallScore ??
      device?.spec_score_v2 ??
      device?.specScoreV2 ??
      device?.overall_score_v2 ??
      device?.overallScoreV2,
  );
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

const TVDetailCard = () => {
  const { getLogo } = useStoreLogos();
  const deviceFieldProfiles = useDeviceFieldProfiles();
  const [activeTab, setActiveTab] = useState("specifications");
  const [activeImage, setActiveImage] = useState(0);
  const [showAllStores, setShowAllStores] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [copied, setCopied] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showHeaderSummaryFull, setShowHeaderSummaryFull] = useState(false);
  const [expandedSpecSections, setExpandedSpecSections] = useState({});
  // Review form removed

  const [loading, setLoading] = useState(false);
  const [applianceData, setApplianceData] = useState(null);
  const navigate = useNavigate();

  // Get category from URL or default to washing machine
  const params = useParams();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const idParam = query.get("id");
  const routeProductId = useMemo(() => {
    const rawId =
      location.state?.productId ??
      location.state?.product_id ??
      location.state?.id ??
      null;
    const numericId = Number(rawId);
    return Number.isInteger(numericId) && numericId > 0 ? numericId : null;
  }, [location.state]);

  // Extract slug from route params (SEO-friendly slug-based URL)
  const routeSlug = params.slug || null;

  // Convert slug to searchable model name
  const modelFromSlug = routeSlug ? extractNameFromSlug(routeSlug) : null;
  const searchModel = query.get("model") || modelFromSlug;

  const {
    homeAppliances,
    homeAppliancesLoading,
    refreshHomeAppliances,
    brands,
  } = useDevice({ resources: ["tvs", "brands"] });

  const doesApplianceMatchSlug = (appliance, slug) => {
    if (!appliance || !slug) return false;
    const searchSlug = generateSlug(slug);
    return [
      appliance.name,
      appliance.product_name,
      appliance.productName,
      appliance.model,
      appliance.model_number,
    ].some((value) => generateSlug(value || "") === searchSlug);
  };

  // Helper function to find appliance by slug locally
  const findApplianceBySlug = (slug) => {
    if (!slug || !Array.isArray(homeAppliances)) return null;
    return homeAppliances.find((appliance) =>
      doesApplianceMatchSlug(appliance, slug),
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
    const resolvedSpecScore = resolveTvSpecScore(a, profileResult.score);

    normalizedAppliance.field_profile = profileResult;
    normalizedAppliance.spec_score = resolvedSpecScore;
    normalizedAppliance.overall_score = resolvedSpecScore;
    normalizedAppliance.spec_score_display = resolvedSpecScore;
    normalizedAppliance.overall_score_display = resolvedSpecScore;

    return normalizedAppliance;
  };

  useEffect(() => {
    setLoading(true);
    setApplianceData(null);
    let cancelled = false;

    const timer = setTimeout(async () => {
      let selected = null;
      let variantIndex = 0;

      const source = Array.isArray(homeAppliances) ? homeAppliances : [];
      const requestedProductId = routeProductId ?? idParam;

      // params we care about
      const brandParam = query.get("brand");
      const modelParam = query.get("model") || query.get("modelNumber");
      const variantIdParam = query.get("variantId") || query.get("variant_id");
      const storeNameParam = query.get("storeName") || query.get("store");

      // An exact product id from search/navigation must win over fuzzy matches.
      if (requestedProductId) {
        selected = source.find(
          (device) =>
            String(device.product_id) === String(requestedProductId) ||
            String(device.productId) === String(requestedProductId) ||
            String(device.id) === String(requestedProductId),
        );
      }

      // Newly added TVs can appear in search before the cached TV list updates.
      if (!selected && requestedProductId) {
        try {
          const response = await fetch(
            `https://api.apisphere.in/api/public/product/${encodeURIComponent(
              requestedProductId,
            )}`,
            { cache: "no-store" },
          );
          if (response.ok) {
            const product = await response.json();
            const productType = String(
              product?.product_type || product?.productType || "",
            ).toLowerCase();
            if (
              product &&
              (productType.includes("tv") ||
                productType.includes("television") ||
                productType.includes("appliance"))
            ) {
              selected = product;
            }
          }
        } catch {
          // The normal not-found state is safer than showing an unrelated TV.
        }
      }

      // 1) Try to find by slug first (for direct slug-based URL access).
      if (!selected && !requestedProductId && routeSlug) {
        selected = findApplianceBySlug(routeSlug);
      }

      // 2) Resolve legacy query-string routes by variant id.
      if (!selected && !requestedProductId && variantIdParam && source.length) {
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

      // 3) Resolve legacy query-string routes by brand and model.
      if (!selected && !requestedProductId && brandParam && modelParam) {
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

      // 4) Brand-only legacy links keep their historical first-brand behavior.
      if (!selected && !requestedProductId && brandParam) {
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

      if (cancelled) return;
      setApplianceData(normalizeAppliance(selected));
      setSelectedVariant(Math.max(0, variantIndex));
      setLoading(false);
    }, 200);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [location.search, homeAppliances, routeProductId, routeSlug]);

  // Redirect to canonical SEO-friendly appliance URL when data is available
  useEffect(() => {
    if (!applianceData) return;
    if (routeSlug && !doesApplianceMatchSlug(applianceData, routeSlug)) return;

    const canonicalSlug = generateSlug(
      applianceData.product_name ||
        applianceData.model_number ||
        applianceData.brand ||
        "",
    );
    if (!canonicalSlug) return;
    const desiredPath = `/tvs/${canonicalSlug}`;
    const currentPath = window.location.pathname;
    if (currentPath !== desiredPath || location.search) {
      navigate(desiredPath, { replace: true, state: location.state });
    }
  }, [applianceData, navigate, location.search, location.state, routeSlug]);

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
        return "blue";
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
      bg: "bg-slate-500",
      text: "text-blue-500",
      light: "bg-slate-50",
      border: "border-blue-500",
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
  const goToPreviousImage = () => {
    if (!galleryImages.length) return;
    setActiveImage((current) =>
      current === 0 ? galleryImages.length - 1 : current - 1,
    );
  };
  const goToNextImage = () => {
    if (!galleryImages.length) return;
    setActiveImage((current) =>
      current === galleryImages.length - 1 ? 0 : current + 1,
    );
  };
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

  usePageEngagementTracker({
    productId: currentProductId,
    pagePath: typeof window !== "undefined" ? window.location.pathname : "/tvs",
    source: "tv-detail",
    enabled: Boolean(currentProductId),
  });
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
  void sectionScores;
  useEffect(() => {
    setActiveImage(0);
  }, [selectedVariant, galleryImages.length]);

  useEffect(() => {
    setShowHeaderSummaryFull(false);
  }, [applianceData?.id, selectedVariant]);

  useEffect(() => {
    setShowAllStores(false);
  }, [selectedVariant]);

  useEffect(() => {
    if (!variants.length) return;
    if (selectedVariant >= variants.length) {
      setSelectedVariant(0);
    }
  }, [selectedVariant, variants.length]);

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
    const path = location?.pathname || "/";
    return toCanonicalPageUrl(path, SITE_ORIGIN);
  }, [location.pathname]);

  const getShareUrl = () => getCanonicalUrl;

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

  const renderSpecTable = (data, limit = 5, sectionId = "tv-specifications") => {
    if (!data || typeof data !== "object") {
      return (
        <div className="rounded-lg border border-dashed border-slate-100 bg-white py-6 text-center text-sm text-slate-500 shadow-[0_2px_2px_rgba(0,0,0,0.1)]">
          No data available
        </div>
      );
    }

    const isScoreKey = (key) => /(^|[_-])score$/i.test(String(key || ""));
    const rows = Object.entries(data).filter(
      ([key, value]) => hasContent(value) && !isScoreKey(key),
    );

    if (!rows.length) {
      return (
        <div className="rounded-lg border border-dashed border-slate-100 bg-white py-6 text-center text-sm text-slate-500 shadow-[0_2px_2px_rgba(0,0,0,0.1)]">
          No data available
        </div>
      );
    }

    const isExpanded = Boolean(expandedSpecSections[sectionId]);
    const displayRows = isExpanded ? rows : rows.slice(0, limit);

    return (
      <>
        <div className="divide-y divide-slate-200/80 sm:hidden">
          {displayRows.map(([key, value]) => (
            <div
              key={key}
              className="grid grid-cols-[5.75rem_minmax(0,1fr)] items-start gap-x-3 gap-y-1 py-3 first:pt-0 last:pb-0"
            >
              <div className="text-sm font-medium leading-5 text-slate-500">
                {toNormalCase(key)}
              </div>
              <div className="break-words text-[15px] font-semibold leading-5 text-slate-900">
                {renderSpecValue(value)}
              </div>
            </div>
          ))}
        </div>

        <div className="hidden divide-y divide-slate-200/80 sm:block">
          {displayRows.map(([key, value]) => (
            <div
              key={key}
              className="grid min-h-11 items-center gap-2 py-3 first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] sm:gap-6"
            >
              <div className="text-sm font-medium text-slate-500">
                {toNormalCase(key)}
              </div>
              <div className="break-words text-sm font-semibold text-slate-900">
                {renderSpecValue(value)}
              </div>
            </div>
          ))}
        </div>
        {rows.length > limit ? (
          <button
            type="button"
            aria-expanded={isExpanded}
            onClick={() =>
              setExpandedSpecSections((current) => ({
                ...current,
                [sectionId]: !current[sectionId],
              }))
            }
            className="mt-4 inline-flex w-full items-center justify-center gap-2 border-t border-slate-200 pt-4 text-sm font-bold text-blue-600 transition-colors hover:text-blue-700"
          >
            {isExpanded ? "View fewer" : "View more"}
            <FaChevronDown
              className={`text-xs transition-transform ${isExpanded ? "rotate-180" : ""}`}
            />
          </button>
        ) : null}
      </>
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

  const detailPageSections = tabs.map(({ id, label, icon: Icon }) => ({
    id: id === "specifications" ? "tv-specifications" : `tv-${id}`,
    label,
    Icon,
  }));
  const activeDetailSection =
    activeTab === "specifications" ? "tv-specifications" : `tv-${activeTab}`;

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
      const renderTvSpecSection = (sectionId, title, data) => {
        if (!hasContent(data)) return null;
        return (
          <section
            id={sectionId}
            className="flex scroll-mt-[136px] flex-col overflow-hidden rounded-2xl border border-blue-200 bg-transparent shadow-none sm:scroll-mt-[148px]"
          >
            <div className="flex items-center gap-3 bg-blue-50/60 px-4 py-4 sm:px-5 sm:py-3.5">
              <span className="h-6 w-1 rounded-full bg-blue-600" aria-hidden="true" />
              <h4 className="text-[17px] font-bold tracking-tight text-slate-950 sm:text-base">
                {title}
              </h4>
            </div>
            <div className="flex flex-1 flex-col bg-transparent px-4 py-4 sm:px-5 sm:py-4">
              {renderSpecTable(data, 5, sectionId)}
            </div>
          </section>
        );
      };

      return (
        <div id="tv-specifications" className="mx-auto w-full max-w-6xl px-2 sm:px-0">
          <div className="text-slate-900">
            <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-blue-600">
              Full Specifications
            </p>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
              Complete hardware and software details
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              {headerTitle} specifications cover display quality, smart TV
              features, audio, connectivity, ports, gaming, and physical
              details.
            </p>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            {renderTvSpecSection("tv-core", "General", generalSection)}
            {renderTvSpecSection(
              "tv-display",
              "Display",
              applianceData.display_json ||
                applianceData.key_specs_json ||
                applianceData.specifications,
            )}
            {renderTvSpecSection(
              "tv-video_engine",
              "Video Engine",
              applianceData.video_engine_json,
            )}
            {renderTvSpecSection("tv-audio", "Audio", applianceData.audio_json)}
            {renderTvSpecSection(
              "tv-smart_tv",
              "Smart TV",
              applianceData.smart_tv_json,
            )}
            {renderTvSpecSection(
              "tv-connectivity",
              "Connectivity",
              applianceData.connectivity_json,
            )}
            {renderTvSpecSection("tv-ports", "Ports", applianceData.ports_json)}
            {renderTvSpecSection(
              "tv-gaming",
              "Gaming",
              applianceData.gaming_json,
            )}
            {renderTvSpecSection("tv-power", "Power", applianceData.power_json)}
            {renderTvSpecSection(
              "tv-physical_details",
              "Physical",
              applianceData.physical_json ||
                applianceData.dimensions_json ||
                applianceData.physical_details,
            )}
            {renderTvSpecSection(
              "tv-product_details",
              "Product Details",
              applianceData.product_details_json,
            )}
            {renderTvSpecSection(
              "tv-in_the_box",
              "In The Box",
              applianceData.in_the_box_json,
            )}
            {renderTvSpecSection(
              "tv-warranty",
              "Warranty",
              applianceData.warranty_json || applianceData.warranty,
            )}
          </div>
        </div>
      );
    }

    return (
      <div id="tv-specifications" className="space-y-6">
        <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-[0_2px_2px_rgba(0,0,0,0.1)] sm:p-6">
          <div className="mb-6 flex items-center justify-between gap-2">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FaMicrochip className={currentColor.text} />
              Technical Specifications
            </h3>
          </div>
          {renderSpecTable(applianceData.specifications || generalSection)}
        </div>
        {hasContent(applianceData.features) && (
          <div
            id="tv-features"
            className="rounded-xl border border-slate-100 bg-white p-5 shadow-[0_2px_2px_rgba(0,0,0,0.1)] sm:p-6"
          >
            <div className="mb-6 flex items-center justify-between gap-2">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FaBolt className={currentColor.text} />
                Features
              </h3>
            </div>
            {renderSpecTable(applianceData.features)}
          </div>
        )}
        {hasContent(applianceData.performance) && (
          <div
            id="tv-performance"
            className="rounded-xl border border-slate-100 bg-white p-5 shadow-[0_2px_2px_rgba(0,0,0,0.1)] sm:p-6"
          >
            <div className="mb-6 flex items-center justify-between gap-2">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FaChartBar className={currentColor.text} />
                Performance
              </h3>
            </div>
            {renderSpecTable(applianceData.performance)}
          </div>
        )}
        {hasContent(applianceData.physical_details) && (
          <div
            id="tv-physical_details"
            className="rounded-xl border border-slate-100 bg-white p-5 shadow-[0_2px_2px_rgba(0,0,0,0.1)] sm:p-6"
          >
            <div className="mb-6 flex items-center justify-between gap-2">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FaRuler className={currentColor.text} />
                Physical Details
              </h3>
            </div>
            {renderSpecTable(applianceData.physical_details)}
          </div>
        )}
        {hasContent(applianceData.warranty) && (
          <div
            id="tv-warranty"
            className="rounded-xl border border-slate-100 bg-white p-5 shadow-[0_2px_2px_rgba(0,0,0,0.1)] sm:p-6"
          >
            <div className="mb-6 flex items-center justify-between gap-2">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FaShieldAlt className={currentColor.text} />
                Warranty
              </h3>
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
            className="border-4 border-cyan-500 border-t-blue-500"
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
      <div className="mx-auto max-w-7xl w-full px-2 py-4 sm:px-4 sm:py-6 lg:px-6 lg:py-8">
        <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center shadow-[0_2px_2px_rgba(0,0,0,0.1)]">
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
  const headerLaunchRaw =
    applianceData?.launch_date ||
    applianceData?.launchDate ||
    applianceData?.created_at ||
    "";
  const headerLaunchDate = headerLaunchRaw ? new Date(headerLaunchRaw) : null;
  const headerLaunchText =
    headerLaunchDate && !Number.isNaN(headerLaunchDate.getTime())
      ? headerLaunchDate.toLocaleDateString("en-US", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : toSafeText(applianceData?.release_year || "");
  const headerSpecScoreValue = normalizeScore100(applianceData?.spec_score);
  const headerSpecScoreBlock =
    headerSpecScoreValue != null ? (
      <div
        className="flex items-center gap-3"
        aria-label={`Spec score ${Math.round(headerSpecScoreValue)} out of 100`}
      >
        <TvXScoreLogo className="h-11 w-11 shrink-0 rounded-xl object-cover" />
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
            Spec score
          </p>
          <div className="mt-1 flex items-end gap-1">
            <span className="text-3xl font-black leading-none text-slate-950">
            {Math.round(headerSpecScoreValue)}
            </span>
            <span className="pb-0.5 text-sm font-semibold text-slate-500">
              /100
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            Based on specifications
          </p>
        </div>
      </div>
    ) : null;
  const headerAudio = toSafeText(
    applianceData?.audio_json?.output_power ||
      applianceData?.key_specs_json?.audio_output ||
      applianceData?.specifications?.audio_output ||
      "",
  );
  const headerOs = toSafeText(
    applianceData?.smart_tv_json?.operating_system ||
      applianceData?.key_specs_json?.operating_system ||
      applianceData?.specifications?.operating_system ||
      "",
  );
  const headerSummary = `${headerTitle} brings ${
    headerPanel || "smart display"
  } picture quality${
    headerRefresh ? ` with a ${headerRefresh} refresh rate` : ""
  }${headerProcessor ? `, powered by ${headerProcessor}` : ""}${
    headerOs ? `, and ${headerOs} smart TV features` : ""
  }${headerAudio ? ` with ${headerAudio} audio output` : ""}. ${
    headlinePrice
      ? `The selected variant starts at ${RUPEE_SYMBOL} ${formatPrice(
          headlinePrice,
        )}.`
      : "Available variants and live store offers are shown below."
  } Compare sizes, display details, connectivity, and store prices before choosing the right screen for your room.`;
  const headerSummaryWords = headerSummary.trim().split(/\s+/).filter(Boolean);
  const headerSummaryLimit = 50;
  const headerSummaryHasMore = headerSummaryWords.length > headerSummaryLimit;
  const headerSummaryPreview = headerSummaryHasMore
    ? `${headerSummaryWords.slice(0, headerSummaryLimit).join(" ")}...`
    : headerSummary;
  const visibleHeaderSummary = showHeaderSummaryFull
    ? headerSummary
    : headerSummaryPreview;
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
  const metaTitleWithMonthYear = metaTitle;
  const metaDescription = tvMeta.description({
    name: metaName,
    brand: metaBrand,
    screenSize: metaScreenSize,
    resolution: metaResolution,
    os: metaOs,
  });
  const _metaKeywords = buildDeviceSeoKeywords({
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
    const productName = metaNameWithBrand || metaName || metaTitle || "";
    if (!productName) return null;
    const schemas = [
      createWebPageSchema({
        name: metaTitleWithMonthYear || metaTitle || productName,
        description: metaDescription,
        url: canonicalUrl,
      }),
      createProductSchema({
        name: productName,
        description: metaDescription,
        image: ogImage || undefined,
        url: canonicalUrl,
        brand: metaBrand || undefined,
      }),
    ];
    return JSON.stringify(schemas);
  })();

  const primarySpecs =
    applianceData?.key_specs_json || applianceData?.specifications || {};
  const buildSummaryPoints = (...values) =>
    dedupeTextParts(
      values
        .map((value) => formatSpecValueText(value))
        .filter((value) => value && value !== "Not specified"),
    );
  const tvSummarySections = applianceData
    ? [
        {
          key: "display",
          title: "Display",
          description: "Basic screen setup for clear, fluid viewing.",
          Icon: FaTv,
          color: currentColor.text,
          points: buildSummaryPoints(
            applianceData.display_json?.screen_size || primarySpecs.screen_size,
            applianceData.display_json?.resolution || primarySpecs.resolution,
            applianceData.display_json?.refresh_rate ||
              primarySpecs.refresh_rate,
          ),
        },
        {
          key: "smart_tv",
          title: "Smart TV",
          description: "Streaming and app platform details for daily use.",
          Icon: FaBolt,
          color: currentColor.text,
          points: buildSummaryPoints(
            applianceData.smart_tv_json?.operating_system ||
              primarySpecs.operating_system,
            applianceData.smart_tv_json?.voice_assistant,
            applianceData.smart_tv_json?.app_store,
          ),
        },
        {
          key: "audio",
          title: "Audio",
          description: "Sound output and speaker setup for movies and shows.",
          Icon: FaVolumeUp,
          color: currentColor.text,
          points: buildSummaryPoints(
            applianceData.audio_json?.output_power || primarySpecs.audio_output,
            applianceData.audio_json?.speaker_type,
            applianceData.audio_json?.audio_features,
          ),
        },
        {
          key: "connectivity",
          title: "Connectivity",
          description: "Ports and wireless options for easy setup.",
          Icon: FaWifi,
          color: currentColor.text,
          points: buildSummaryPoints(
            applianceData.connectivity_json?.wifi,
            applianceData.connectivity_json?.bluetooth,
            applianceData.connectivity_json?.hdmi,
            applianceData.connectivity_json?.usb,
          ),
        },
      ].filter((section) => section.points.length > 0)
    : [];

  return (
    <div className="hooks-product-detail hooks-tv-detail min-h-screen w-full bg-white text-slate-950">
      <SEO
        title={metaTitleWithMonthYear}
        description={metaDescription}
        url={canonicalUrl}
        ogType="product"
        image={ogImage || null}
      >
        {productSchemaJson && (
          <script type="application/ld+json">{productSchemaJson}</script>
        )}
      </SEO>
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

      <div className="overflow-hidden">
        <DetailPageNavigator
          sections={detailPageSections}
          activeId={activeDetailSection}
          onNavigate={(sectionId) =>
            handleTabClick(
              sectionId === "tv-specifications"
                ? "specifications"
                : sectionId.replace(/^tv-/, ""),
            )
          }
        />
        <div className="mx-auto max-w-7xl px-3 pt-3 sm:px-6 lg:px-8">
          <Breadcrumbs variant="plain" />
        </div>
        <section className="hidden w-full text-slate-900" aria-hidden="true">
          <div className="mx-auto max-w-7xl px-3 pt-3 sm:px-6 lg:px-8">
            <Breadcrumbs variant="plain" />
          </div>
          <div className="mx-auto max-w-7xl px-3 pb-0 pt-0 sm:px-6 sm:pb-0 lg:px-8 lg:pb-0">
            <div className="px-3 pb-0 pt-3 sm:px-6 sm:pb-0 sm:pt-4 lg:px-7 lg:pb-0 lg:pt-4">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0 flex-1">
                  {headerDescriptor ? (
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.32em] text-blue-500 sm:text-xs">
                      {headerDescriptor}
                    </p>
                  ) : null}
                  <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-[2rem]">
                      {headerTitle}
                    </h1>
                  </div>

                  <div className="mt-2 max-w-7xl">
                    <p
                      className={`text-sm leading-6 text-slate-600 sm:text-base ${
                        showHeaderSummaryFull ? "" : "line-clamp-1"
                      }`}
                    >
                      {visibleHeaderSummary}
                    </p>
                    {headerSummaryHasMore ? (
                      <button
                        type="button"
                        onClick={() =>
                          setShowHeaderSummaryFull((current) => !current)
                        }
                        className="mt-2 inline-flex items-center text-sm font-semibold text-blue-600 transition-colors hover:text-blue-700"
                        aria-expanded={showHeaderSummaryFull}
                      >
                        {showHeaderSummaryFull ? "Read less" : "Read more"}
                      </button>
                    ) : null}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[13px] sm:text-sm">
                    {currentVariantLabel ? (
                      <span className="rounded-full border border-slate-100 bg-white px-3 py-1 font-medium text-slate-700 shadow-[0_2px_2px_rgba(0,0,0,0.1)]">
                        {currentVariantLabel}
                      </span>
                    ) : null}
                  </div>

                  {headlinePrice || headerSpecScoreBlock ? (
                    <div className="mt-4 flex items-start justify-between gap-3 sm:block">
                      <div className="min-w-0">
                        {headlinePrice ? (
                          <div className="text-[2rem] font-bold tracking-tight text-emerald-600 sm:text-3xl">
                            {RUPEE_SYMBOL} {formatPrice(headlinePrice)}
                          </div>
                        ) : null}
                      </div>
                      {headerSpecScoreBlock ? (
                        <div className="shrink-0 sm:hidden">
                          {headerSpecScoreBlock}
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="mt-5 flex flex-col gap-3 xl:hidden">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleShare}
                        className="rounded-full border border-slate-100 bg-white p-2 shadow-[0_2px_2px_rgba(0,0,0,0.1)] transition-colors hover:bg-slate-50"
                      >
                        <FaShareAlt className="text-lg text-slate-500" />
                      </button>
                    </div>

                    {headerSpecScoreBlock ? (
                      <div className="hidden flex-wrap items-center gap-2 text-[13px] text-slate-600 sm:flex sm:gap-3 sm:text-sm">
                        {headerSpecScoreBlock}
                      </div>
                    ) : null}

                    {headerLaunchText ? (
                      <div className="flex flex-wrap items-center gap-2 text-[13px] text-slate-600 sm:text-sm">
                        <span>
                          Launched On:{" "}
                          <span className="font-semibold text-slate-900">
                            {headerLaunchText}
                          </span>
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="hidden flex-col items-start gap-3 xl:flex xl:items-end">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleShare}
                      className="rounded-full border border-slate-100 bg-white p-2 shadow-[0_2px_2px_rgba(0,0,0,0.1)] transition-colors hover:bg-slate-50"
                    >
                      <FaShareAlt className="text-lg text-slate-500" />
                    </button>
                  </div>

                  {headerSpecScoreBlock ? (
                    <div className="flex flex-wrap items-center gap-2 text-[13px] text-slate-600 sm:gap-3 sm:text-sm">
                      {headerSpecScoreBlock}
                    </div>
                  ) : null}

                  {headerLaunchText ? (
                    <div className="flex flex-wrap items-center gap-2 text-[13px] text-slate-600 sm:text-sm">
                      <span>
                        Launched On:{" "}
                        <span className="font-semibold text-slate-900">
                          {headerLaunchText}
                        </span>
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto w-full max-w-[1440px] px-3 pb-7 pt-5 sm:px-6 sm:pb-9 sm:pt-7 lg:px-8">
          <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-7">
            {/* Images Section */}
            <div className="min-w-0 rounded-[24px] bg-transparent p-3 shadow-none sm:p-5 lg:p-6">
              <div className="grid min-w-0 gap-3 sm:grid-cols-[68px_minmax(0,1fr)]">
                {/* Main Image */}
                <div className="relative order-1 min-w-0 overflow-hidden rounded-[22px] border border-slate-100 bg-white px-4 py-8 shadow-[0_18px_40px_rgba(15,23,42,0.10)] sm:col-start-2 sm:row-start-1 sm:order-2 sm:px-8 sm:py-8">
                  <TvOrbitArtwork />
                  {galleryImages.length > 1 ? (
                    <>
                      <button
                        type="button"
                        onClick={goToPreviousImage}
                        aria-label="Previous image"
                        className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full border border-slate-200 bg-white/95 p-3 text-slate-600 shadow-md transition-all hover:border-blue-300 hover:text-blue-700"
                      >
                        <FaChevronLeft className="text-sm" />
                      </button>
                      <button
                        type="button"
                        onClick={goToNextImage}
                        aria-label="Next image"
                        className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full border border-slate-200 bg-white/95 p-3 text-slate-600 shadow-md transition-all hover:border-blue-300 hover:text-blue-700"
                      >
                        <FaChevronRight className="text-sm" />
                      </button>
                    </>
                  ) : null}
                  <div className="flex min-h-[340px] items-center justify-center sm:min-h-[420px]">
                    <img
                      src={
                        galleryImages?.[activeImage] ||
                        "/placeholder-appliance.jpg"
                      }
                      alt={applianceData.product_name}
                      className="relative z-[1] h-auto max-h-[320px] w-auto object-contain drop-shadow-[0_16px_24px_rgba(15,23,42,0.12)] sm:max-h-[380px]"
                      onError={(e) => {
                        e.target.src =
                          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23ffffff'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='16' fill='%239ca3af'%3ENo Image Available%3C/text%3E%3C/svg%3E";
                      }}
                    />
                  </div>

                  {galleryImages.length > 1 ? (
                    <div className="order-2 flex min-w-0 snap-x snap-mandatory gap-2 overflow-x-auto px-1 py-1 sm:hidden">
                      {galleryImages.slice(0, 6).map((image, index) => (
                        <button
                          key={`${image}-${index}`}
                          type="button"
                          onClick={() => setActiveImage(index)}
                          aria-label={`View ${headerTitle} image ${index + 1}`}
                          className={`flex h-14 w-14 shrink-0 snap-start items-center justify-center overflow-hidden rounded-xl border-2 bg-white p-1.5 transition-all ${
                            activeImage === index
                              ? "border-blue-500 shadow-sm"
                              : "border-transparent hover:border-blue-200"
                          }`}
                        >
                          <img
                            src={image}
                            alt={`${headerTitle} thumbnail ${index + 1}`}
                            loading="lazy"
                            className="h-full w-full object-contain"
                          />
                        </button>
                      ))}
                    </div>
                  ) : null}

                  {galleryImages.length > 1 ? (
                    <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5">
                      {galleryImages.map((_, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setActiveImage(index)}
                          aria-label={`Go to image ${index + 1}`}
                          className={`h-2 rounded-full transition-all duration-300 ${
                            activeImage === index
                              ? "w-10 bg-slate-700"
                              : "w-2.5 bg-slate-300 hover:bg-slate-400"
                          }`}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
                {galleryImages.length > 1 ? (
                  <div className="order-2 hidden min-w-0 gap-2 sm:col-start-1 sm:row-start-1 sm:flex sm:flex-col">
                    {galleryImages.slice(0, 6).map((image, index) => (
                      <button
                        key={`rail-${image}-${index}`}
                        type="button"
                        onClick={() => setActiveImage(index)}
                        aria-label={`View ${headerTitle} image ${index + 1}`}
                        className={`flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 bg-white p-1.5 transition-all ${
                          activeImage === index
                            ? "border-blue-500 shadow-sm"
                            : "border-transparent hover:border-blue-200"
                        }`}
                      >
                        <img
                          src={image}
                          alt={`${headerTitle} thumbnail ${index + 1}`}
                          loading="lazy"
                          className="h-full w-full object-contain"
                        />
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="mb-4 flex gap-2 lg:hidden">
                <button
                  type="button"
                  onClick={handleShare}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-100 bg-white py-3 font-semibold text-slate-700 shadow-[0_2px_2px_rgba(0,0,0,0.1)] transition-all hover:border-blue-200 hover:text-blue-700"
                >
                  <FaShareAlt className="text-blue-500" />
                  <span>Share</span>
                </button>
              </div>

              {/* Variant Selection */}
              {variants && variants.length > 0 && (
                <div className="mb-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-blue-600">
                    Select variant
                  </p>
                  <h4 className="mt-1 text-lg font-black text-slate-950">
                    Choose screen size
                  </h4>
                  <div className="mt-4 grid min-w-0 grid-cols-2 gap-3 sm:flex sm:overflow-x-auto sm:pb-1">
                    {variants.map((variant, index) => (
                      <button
                        key={variant.id || index}
                        onClick={() => setSelectedVariant(index)}
                        aria-pressed={selectedVariant === index}
                        className={`relative min-h-[88px] min-w-0 rounded-xl border-2 p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 sm:min-w-[190px] sm:p-4 ${
                          selectedVariant === index
                            ? "border-blue-500 bg-blue-50"
                            : "border-slate-200 bg-transparent hover:border-blue-300 hover:bg-blue-50/60"
                        }`}
                      >
                        {selectedVariant === index ? (
                          <span className="absolute right-3 top-3 inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white">
                            <FaCheck className="text-[9px]" />
                          </span>
                        ) : null}
                        <div
                          className="pr-6 text-sm font-black leading-tight text-slate-900"
                        >
                          {toSafeText(
                            variant.capacity ||
                              variant.screen_size ||
                              variant.type ||
                              applianceData.specifications?.screen_size ||
                              `Variant ${index + 1}`,
                          ) || `Variant ${index + 1}`}
                        </div>
                        <div
                          className="mt-2 text-[11px] leading-tight text-slate-500"
                        >
                          {toSafeText(
                            variant.resolution ||
                              variant.specification_summary ||
                              applianceData.specifications?.resolution ||
                              applianceData.specifications?.panel_type ||
                              "",
                          )}
                        </div>
                        <div
                          className={`mt-2 text-lg font-black ${
                            selectedVariant === index
                              ? "text-blue-700"
                              : "text-green-600"
                          }`}
                        >
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
            <div className="relative isolate min-w-0 overflow-hidden rounded-[24px] bg-transparent p-4 sm:p-6 lg:p-7">
              <div>
                <div className="relative z-[1] flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700 ring-1 ring-emerald-100">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      In stock
                    </span>
                    <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.24em] text-blue-600">
                      {metaBrand || headerType}
                    </p>
                    <h1 className="mt-1 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-4xl">
                      {headerTitle}
                    </h1>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={handleShare}
                      aria-label="Share TV"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/70 text-slate-600 backdrop-blur-md transition hover:bg-white hover:text-blue-700"
                    >
                      <FaShareAlt className="text-sm" />
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate("/compare")}
                      className="hidden h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white transition hover:bg-blue-700 sm:inline-flex"
                    >
                      <FaPlus className="text-xs" />
                      Compare
                    </button>
                  </div>
                </div>

                <div className="relative z-[1] mt-4">
                  <p
                    className={`text-sm leading-6 text-slate-600 sm:text-[15px] ${
                      showHeaderSummaryFull ? "" : "line-clamp-2"
                    }`}
                  >
                    {visibleHeaderSummary}
                  </p>
                  {headerSummaryHasMore ? (
                    <button
                      type="button"
                      onClick={() =>
                        setShowHeaderSummaryFull((current) => !current)
                      }
                      className="mt-1 text-sm font-bold text-blue-600 hover:text-blue-700"
                    >
                      {showHeaderSummaryFull ? "Show less" : "Read more"}
                    </button>
                  ) : null}
                </div>

                <div className="relative z-[1] mt-5 grid gap-3 sm:grid-cols-2">
                  {headerSpecScoreBlock ? (
                    <div className="rounded-2xl bg-transparent p-4">
                      {headerSpecScoreBlock}
                    </div>
                  ) : null}
                  <div className="rounded-2xl bg-transparent p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                          Market status
                        </p>
                        <p className="mt-1 text-base font-black text-emerald-600">
                          Available
                        </p>
                      </div>
                      {headerLaunchText ? (
                        <span className="text-right text-xs leading-5 text-slate-500">
                          Launched
                          <br />
                          <strong className="text-slate-800">
                            {headerLaunchText}
                          </strong>
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                        Starting price
                      </p>
                      <p className="mt-1 text-2xl font-black tracking-tight text-slate-950">
                        {headlinePrice
                          ? `${RUPEE_SYMBOL} ${formatPrice(headlinePrice)}`
                          : "Price not announced"}
                      </p>
                    </div>
                  </div>
                </div>

                {currentVariantLabel ? (
                  <div className="relative z-[1] mt-4 inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-semibold text-slate-700">
                    {currentVariantLabel}
                  </div>
                ) : null}

                {tvSummarySections.length > 0 ? (
                  <div className="relative z-[1] mt-5 grid grid-cols-2 gap-1 rounded-2xl bg-transparent p-1 sm:grid-cols-4">
                    {tvSummarySections.slice(0, 4).map((item) => {
                      const Icon = item.Icon;
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => handleTabClick(item.key)}
                          className="min-w-0 rounded-xl px-2 py-3 text-left transition hover:bg-white sm:px-3"
                        >
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                            <Icon className="text-xs" />
                          </span>
                          <span className="mt-2 block truncate text-xs font-semibold text-slate-500">
                            {item.title}
                          </span>
                          <span className="mt-1 block line-clamp-2 text-sm font-black leading-5 text-slate-900">
                            {item.points[0]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={() => navigate("/compare")}
                  className="relative z-[1] mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700 sm:hidden"
                >
                  <FaBalanceScale className="text-sm" />
                  Compare with another TV
                </button>
              </div>

              {/* Store Prices Section */}
              {sortedStores.length > 0 && (
                <div className="order-2 mb-5 mt-5">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-blue-600">
                        Best prices
                      </p>
                      <h3 className="mt-1 text-lg font-black text-slate-950">
                        Buy from trusted stores
                      </h3>
                    </div>
                    <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                      {sortedStores.length} offer{sortedStores.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  <div className="mt-4 space-y-3">
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
                          className="flex min-h-[68px] min-w-0 items-center justify-between gap-2 rounded-xl border border-slate-100 bg-[#f8fafc] px-3 py-3 shadow-md transition-all duration-200 hover:border-blue-300 sm:gap-4 sm:px-4"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white p-1.5">
                              <img
                                src={getStoreLogo(store.store_name)}
                                alt={store.store_name}
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  e.target.src = getLogo("");
                                }}
                              />
                              </div>
                            <div className="min-w-0">
                              <h4 className="text-sm font-bold capitalize text-slate-900">
                                {store.store_name}
                              </h4>
                              <p className="mt-1 text-base font-black text-emerald-600">
                                {RUPEE_SYMBOL} {formatPrice(store.price)}
                              </p>
                            </div>
                          </div>
                          <a
                            href={hasStoreUrl ? visitUrl : undefined}
                            target="_blank"
                            rel="noopener noreferrer nofollow"
                            onClick={(e) => {
                              if (!hasStoreUrl) e.preventDefault();
                            }}
                            className={`inline-flex min-w-[84px] shrink-0 items-center justify-center gap-1.5 rounded-lg px-2.5 py-2.5 text-xs font-bold transition-all duration-200 sm:min-w-[96px] sm:px-3 ${
                              hasStoreUrl
                                ? "bg-blue-600 text-white shadow-sm hover:bg-blue-700"
                                : "cursor-not-allowed bg-slate-200 text-slate-500"
                            }`}
                          >
                            <FaExternalLinkAlt className="text-xs" />
                            {hasStoreUrl ? "Buy now" : "Unavailable"}
                          </a>
                          </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {false ? (
                <div className="order-1 mt-5 space-y-5">
                  <div className="max-w-2xl">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-blue-600">
                      Key Specifications
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-slate-900 sm:text-2xl">
                      Main hardware highlights
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-500 sm:text-base">
                      A quick breakdown of the display, audio, smart features,
                      and connectivity details that matter most.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-white p-3 shadow-[0_2px_2px_rgba(0,0,0,0.1)] sm:p-4 md:p-5">
                    <div className="grid items-stretch gap-3 md:grid-cols-2 lg:gap-5">
                      {tvSummarySections.map((section) => {
                        const Icon = section.Icon;
                        return (
                          <div
                            key={section.key}
                            className="flex h-full flex-col rounded-2xl border border-slate-100 bg-white p-4 transition-all duration-200 sm:p-5"
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-50 ring-1 ring-slate-200">
                                <Icon
                                  className={`text-base ${section.color}`}
                                />
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-[1rem] font-semibold leading-snug text-slate-900 sm:text-[1.08rem]">
                                  {section.title}
                                </h4>
                                {section.description ? (
                                  <p className="mt-1 line-clamp-2 text-[13px] leading-5 text-slate-500">
                                    {section.description}
                                  </p>
                                ) : null}
                              </div>
                            </div>

                            <ul className="mt-4 space-y-2.5">
                              {section.points.slice(0, 3).map((point, idx) => (
                                <li
                                  key={idx}
                                  className="flex items-start gap-2.5 text-sm leading-6 text-slate-700"
                                >
                                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                                  <span className="min-w-0">{point}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex justify-center pt-1 sm:justify-end">
                    <button
                      type="button"
                      onClick={() => handleTabClick("specifications")}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-blue-700 bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-blue-800 sm:w-auto sm:py-2"
                    >
                      See full specifications
                      <FaChevronRight className="text-xs" />
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {activeTab === "specifications" ? (
            <div className="mt-6">
              <div className="min-w-0">{renderTabContent()}</div>
            </div>
          ) : (
            <>
              <div className="mt-6 p-0 sm:p-2">{renderTabContent()}</div>

              {currentProductId ? (
                <div className="mt-6 px-4 sm:px-0">
                  <ProductDiscoverySections
                    productId={currentProductId}
                    currentBrand={applianceData?.brand || ""}
                    entityType="tvs"
                    catalogItems={homeAppliances}
                    brandCatalog={brands}
                    className="w-full"
                    layout="latestPhones"
                  />
                </div>
              ) : null}
            </>
          )}

          <LatestNewsRouteSection
            className="mt-6"
            productType="tv"
            subtitle="Fresh TV launches, display technology updates, and buying context from the MobileX news desk."
          />
        </div>
      </div>
    </div>
  );
};

export default TVDetailCard;
