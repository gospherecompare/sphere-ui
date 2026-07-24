// src/components/LaptopDetailCard.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import useDevice from "../../hooks/useDevice";
import useStoreLogos from "../../hooks/useStoreLogos";
import {
  FaShareAlt,
  FaShare,
  FaLaptop,
  FaMicrochip,
  FaMemory,
  FaExpand,
  FaBolt,
  FaBatteryFull,
  FaShieldAlt,
  FaUsb,
  FaWindows,
  FaStore,
  FaHdd,
  FaExternalLinkAlt,
  FaCheck,
  FaChevronLeft,
  FaChevronDown,
  FaChevronRight,
  FaWhatsapp,
  FaFacebook,
  FaLink,
} from "react-icons/fa";
import Spinner from "../ui/Spinner";
import { laptopMeta } from "../../constants/meta";
import { generateSlug, extractNameFromSlug } from "../../utils/slugGenerator";
import {
  createProductSchema,
  createWebPageSchema,
} from "../../utils/schemaGenerators";
import { Helmet } from "react-helmet-async";
import { buildDeviceSeoKeywords } from "../../utils/seoKeywordBuilder";
import { toCanonicalPageUrl } from "../../utils/publicUrl";
import usePageEngagementTracker from "../../hooks/usePageEngagementTracker";
import LatestNewsRouteSection from "../ui/LatestNewsRouteSection";
import ProductDiscoverySections from "../ui/ProductDiscoverySections";

const SITE_ORIGIN = "https://tryhook.shop";

const normalizeScore100 = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  if (n <= 1) return Math.max(0, Math.min(100, n * 100));
  if (n <= 10) return Math.max(0, Math.min(100, n * 10));
  return Math.max(0, Math.min(100, n));
};

const LaptopDetailCard = () => {
  const { getLogo } = useStoreLogos();
  const normalizeLaptop = (l) => {
    if (!l) return l;

    const toObject = (value) =>
      value && typeof value === "object" && !Array.isArray(value) ? value : {};
    const toArray = (value) => (Array.isArray(value) ? value : []);
    const pickFirstObject = (...values) => {
      for (const value of values) {
        const obj = toObject(value);
        if (Object.keys(obj).length > 0) return obj;
      }
      return {};
    };
    const pickFirstArray = (...values) => {
      for (const value of values) {
        if (Array.isArray(value)) return value;
      }
      return [];
    };
    const pickFirstString = (...values) => {
      for (const value of values) {
        if (value === null || value === undefined) continue;
        const text = String(value).trim();
        if (text) return text;
      }
      return "";
    };

    const basicInfo = pickFirstObject(l.basic_info, l.basicInfo);
    const metadata = pickFirstObject(l.metadata, l.meta);
    const performance = pickFirstObject(l.performance, l.cpu);
    const display = pickFirstObject(l.display);
    const memory = pickFirstObject(l.memory);
    const storage = pickFirstObject(l.storage);
    const battery = pickFirstObject(l.battery);
    const connectivity = pickFirstObject(l.connectivity, metadata.connectivity);
    const physical = pickFirstObject(l.physical);
    const software = pickFirstObject(l.software);
    const warranty = pickFirstObject(l.warranty, metadata.warranty);
    const multimedia = pickFirstObject(l.multimedia);
    const security = pickFirstObject(l.security);
    const ports = pickFirstObject(l.ports);
    const camera = pickFirstObject(l.camera);

    const normalizeStorePrices = (storeRows) =>
      toArray(storeRows).map((store) => {
        const sp = toObject(store);
        return {
          ...sp,
          id: sp.id || sp.store_id || null,
          store_name: sp.store_name || sp.store || "",
          price: sp.price ?? sp.amount ?? null,
          url: sp.url || sp.link || "",
          offer_text: sp.offer_text || sp.offer || "",
          delivery_info: sp.delivery_info || sp.offers || null,
          delivery_time: sp.delivery_info || sp.delivery_time || null,
        };
      });

    const rawVariants = toArray(l.variants).length
      ? toArray(l.variants)
      : toArray(metadata.variants).length
        ? toArray(metadata.variants)
        : l.variant
          ? Array.isArray(l.variant)
            ? l.variant
            : [l.variant]
          : [];

    const variants = rawVariants.map((variant) => {
      const v = toObject(variant);
      const storePrices = normalizeStorePrices(
        toArray(v.store_prices).length ? v.store_prices : v.stores,
      );

      return {
        ...v,
        id: v.id || v.variant_id || v.variantId || null,
        variant_id: v.variant_id || v.id || v.variantId || null,
        ram: v.ram || v.memory || "",
        storage: v.storage || v.storage_size || "",
        base_price: v.base_price ?? v.price ?? v.mrp ?? null,
        store_prices: storePrices,
      };
    });

    const imageCandidates = [
      ...pickFirstArray(l.images, metadata.images, l.pictures),
      l.image,
      l.image_url,
    ].filter(Boolean);
    const images = Array.from(new Set(imageCandidates));

    const features = pickFirstArray(l.features, multimedia.features)
      .filter(Boolean)
      .map((item) => String(item));

    const processor = pickFirstString(
      performance.processor_name,
      performance.processor,
      `${performance.brand || ""} ${performance.model || ""}`.trim(),
      l.specifications?.processor,
    );

    const normalizedColors = [
      ...new Set(
        toArray(basicInfo.colors)
          .map((color) =>
            typeof color === "object"
              ? color.name || color.label || color.value
              : color,
          )
          .filter(Boolean)
          .map((value) => String(value)),
      ),
    ];

    const existingSpecs = {
      ...toObject(l.specifications),
      ...toObject(l.specs),
      ...toObject(l.spec),
    };

    const launchDate = pickFirstString(
      l.launch_date,
      basicInfo.launch_date,
      metadata.launch_date,
    );
    const launchDateObj = launchDate ? new Date(launchDate) : null;
    const launchYear =
      launchDateObj && !Number.isNaN(launchDateObj.getTime())
        ? launchDateObj.getFullYear()
        : "";

    const warrantyText = pickFirstString(
      warranty.warranty,
      warranty.service,
      warranty.years ? `${warranty.years} years` : "",
      existingSpecs.warranty,
    );
    const yearsMatch = String(warrantyText).match(/(\d+(\.\d+)?)/);
    const warrantyYears =
      warranty.years ??
      existingSpecs.warranty_years ??
      (yearsMatch ? Number(yearsMatch[1]) : "");

    const specifications = {
      ...existingSpecs,
      operating_system: pickFirstString(
        software.operating_system,
        software.os,
        existingSpecs.operating_system,
      ),
      processor: pickFirstString(processor, existingSpecs.processor),
      processor_generation: pickFirstString(
        performance.processor_generation,
        performance.generation,
        existingSpecs.processor_generation,
      ),
      cpu_cores:
        performance.cores ??
        performance.cpu_cores ??
        existingSpecs.cpu_cores ??
        "",
      cpu_threads:
        performance.threads ??
        performance.cpu_threads ??
        existingSpecs.cpu_threads ??
        "",
      cache: pickFirstString(performance.cache, existingSpecs.cache),
      screen_size: pickFirstString(
        display.display_size,
        display.size,
        display.size_cm,
        existingSpecs.screen_size,
      ),
      panel_type: pickFirstString(
        display.panel_type,
        display.type,
        display.panel,
        existingSpecs.panel_type,
      ),
      display: pickFirstString(
        [
          pickFirstString(display.display_size, display.size),
          pickFirstString(display.panel_type, display.type),
          pickFirstString(display.resolution),
        ]
          .filter(Boolean)
          .join(" "),
        existingSpecs.display,
      ),
      resolution: pickFirstString(display.resolution, existingSpecs.resolution),
      refresh_rate: pickFirstString(
        display.refresh_rate,
        existingSpecs.refresh_rate,
      ),
      brightness: pickFirstString(display.brightness, existingSpecs.brightness),
      color_gamut: pickFirstString(
        display.color_gamut,
        existingSpecs.color_gamut,
      ),
      touch_screen:
        display.touchscreen ??
        display.touch_support ??
        existingSpecs.touch_screen ??
        "",
      ram: pickFirstString(
        memory.ram,
        memory.capacity,
        memory.size,
        variants[0]?.ram,
        existingSpecs.ram,
      ),
      ram_type: pickFirstString(
        memory.ram_type,
        memory.type,
        existingSpecs.ram_type,
      ),
      ram_speed: pickFirstString(
        memory.ram_speed,
        memory.speed,
        existingSpecs.ram_speed,
      ),
      ram_upgradable:
        memory.expandable ??
        memory.ram_expandable ??
        existingSpecs.ram_upgradable ??
        "",
      storage: pickFirstString(
        storage.capacity,
        storage.storage,
        storage.size,
        variants[0]?.storage,
        existingSpecs.storage,
      ),
      storage_type: pickFirstString(
        storage.storage_type,
        storage.type,
        existingSpecs.storage_type,
      ),
      gpu: pickFirstString(performance.gpu, existingSpecs.gpu),
      battery_capacity: pickFirstString(
        battery.capacity,
        battery.battery_capacity,
        battery.capacity_wh,
        battery.wh,
        battery.battery_type,
        existingSpecs.battery_capacity,
      ),
      battery_life: pickFirstString(
        battery.battery_life,
        battery.life,
        battery.backup_time,
        existingSpecs.battery_life,
      ),
      fast_charging: pickFirstString(
        battery.fast_charging,
        existingSpecs.fast_charging,
      ),
      charger_type: pickFirstString(
        battery.adapter,
        battery.charger,
        existingSpecs.charger_type,
      ),
      wifi: pickFirstString(
        connectivity.wifi,
        connectivity.wireless,
        existingSpecs.wifi,
      ),
      bluetooth: pickFirstString(
        connectivity.bluetooth,
        existingSpecs.bluetooth,
      ),
      usb_ports: pickFirstString(
        ports.ports_description,
        existingSpecs.usb_ports,
      ),
      hdmi: ports.hdmi ?? existingSpecs.hdmi ?? "",
      audio_jack:
        ports.audio_combo_jack ??
        ports.audio_jack ??
        existingSpecs.audio_jack ??
        "",
      sd_card_reader:
        ports.sd_card_reader ?? existingSpecs.sd_card_reader ?? "",
      thunderbolt:
        ports.thunderbolt_4 ??
        ports.thunderbolt ??
        existingSpecs.thunderbolt ??
        "",
      weight: pickFirstString(physical.weight, existingSpecs.weight),
      thickness: pickFirstString(
        physical.thickness,
        physical.depth,
        existingSpecs.thickness,
      ),
      body_material: pickFirstString(
        physical.material,
        existingSpecs.body_material,
      ),
      color: pickFirstString(
        normalizedColors.join(" / "),
        physical.color,
        existingSpecs.color,
      ),
      keyboard: pickFirstString(multimedia.keyboard, existingSpecs.keyboard),
      webcam: pickFirstString(camera.webcam, existingSpecs.webcam),
      speakers: pickFirstString(
        toArray(multimedia.audio_features).join(", "),
        multimedia.speaker,
        existingSpecs.speakers,
      ),
      fingerprint_scanner:
        security.fingerprint ?? existingSpecs.fingerprint_scanner ?? "",
      security_features: pickFirstString(
        toArray(security.security_features).join(", "),
        existingSpecs.security_features,
      ),
      warranty: warrantyText,
      warranty_years: warrantyYears,
      features: features.length ? features : toArray(existingSpecs.features),
    };
    const serverSpecScore = normalizeScore100(l.spec_score_v2 ?? l.specScoreV2);

    const normalizedLaptop = {
      ...l,
      spec_score_v2: serverSpecScore,
      spec_score: serverSpecScore,
      overall_score: serverSpecScore,
      id: l.id || l.product_id || null,
      product_id: l.product_id || l.id || null,
      product_name:
        l.product_name ||
        l.name ||
        basicInfo.product_name ||
        basicInfo.title ||
        l.model ||
        l.productName ||
        "",
      model_number:
        l.model_number ||
        l.model ||
        basicInfo.model ||
        basicInfo.sku ||
        l.sku ||
        "",
      brand:
        l.brand ||
        l.brand_name ||
        basicInfo.brand_name ||
        basicInfo.brand ||
        l.manufacturer ||
        "",
      series: l.series || basicInfo.series || "",
      product_type: l.product_type || basicInfo.product_type || "Laptop",
      release_year: l.release_year || launchYear,
      launch_date: launchDate || null,
      country: pickFirstString(
        l.country,
        metadata.in_the_box?.country_of_origin,
        metadata.import_details?.country_of_origin,
      ),
      performance,
      display,
      memory,
      storage,
      battery,
      connectivity,
      physical,
      software,
      warranty,
      multimedia,
      security,
      ports,
      camera,
      features,
      variants,
      specifications,
      images,
    };

    return normalizedLaptop;
  };

  // Read URL and route params and select laptop by brand/model/variant details
  const params = useParams();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const categoryParam = query.get("category") || "gaming_laptop";

  // Extract slug from route params (SEO-friendly slug-based URL)
  const routeSlug = params.slug || null;

  // Convert slug to searchable model name
  const modelFromSlug = routeSlug ? extractNameFromSlug(routeSlug) : null;
  const searchModel = query.get("model") || modelFromSlug;

  const { laptops, brands } = useDevice({
    resources: ["laptops", "brands"],
  });

  // local state
  const navigate = useNavigate();
  const [laptopData, setLaptopData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [showAllStores, setShowAllStores] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [activeStoreId, setActiveStoreId] = useState(null);
  const [activeTab, setActiveTab] = useState("specifications");
  const [showHeaderSummaryFull, setShowHeaderSummaryFull] = useState(false);

  // Helper function to find laptop by slug locally
  const findLaptopBySlug = (slug) => {
    if (!slug || !Array.isArray(laptops)) return null;
    const searchSlug = generateSlug(slug);
    return laptops.find(
      (l) =>
        generateSlug(l.product_name || l.name || l.model || "") ===
          searchSlug || generateSlug(l.model_number || "") === searchSlug,
    );
  };

  useEffect(() => {
    setLoading(true);

    const timer = setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      const brandParam = params.get("brand");
      const modelParam = params.get("model");
      const ramParam = params.get("ram");
      const storageParam = params.get("storage");
      const variantIdParam = params.get("variantId");
      const cpuParam = params.get("cpu");
      const osParam = params.get("os");

      let selectedLaptop = null;
      let variantIndex = 0;

      // 0) Try to find by slug first (for direct slug-based URL access)
      if (!selectedLaptop && routeSlug && Array.isArray(laptops)) {
        selectedLaptop = findLaptopBySlug(routeSlug);
      }

      // 1) If a variantId is provided, prefer that
      if (variantIdParam && Array.isArray(laptops) && laptops.length) {
        for (const laptop of laptops) {
          const variants = Array.isArray(laptop.variants)
            ? laptop.variants
            : laptop.variant
              ? Array.isArray(laptop.variant)
                ? laptop.variant
                : [laptop.variant]
              : [];
          const idx = variants.findIndex(
            (v) =>
              String(v.id) === variantIdParam ||
              String(v.variant_id) === variantIdParam,
          );
          if (idx >= 0) {
            selectedLaptop = laptop;
            variantIndex = idx;
            break;
          }
        }
      }

      // 2) Match by brand + model (prefer exact brand and product_name/model_number)
      if (
        !selectedLaptop &&
        brandParam &&
        modelParam &&
        Array.isArray(laptops)
      ) {
        const b = brandParam.toLowerCase();
        const m = modelParam.toLowerCase();
        for (const laptop of laptops) {
          const brandVal = (laptop.brand || laptop.brand_name || "")
            .toString()
            .toLowerCase();
          const nameVal = (
            laptop.product_name ||
            laptop.name ||
            laptop.model ||
            ""
          )
            .toString()
            .toLowerCase();
          const modelNum = (laptop.model_number || laptop.model || "")
            .toString()
            .toLowerCase();
          const brandMatch = brandVal === b;
          const nameMatch = nameVal.includes(m);
          const modelNumMatch = modelNum === m;
          if (brandMatch && (nameMatch || modelNumMatch)) {
            selectedLaptop = laptop;

            if (ramParam || storageParam) {
              const variants = Array.isArray(laptop.variants)
                ? laptop.variants
                : laptop.variant
                  ? Array.isArray(laptop.variant)
                    ? laptop.variant
                    : [laptop.variant]
                  : [];
              const idx = variants.findIndex((v) => {
                const ramOk = ramParam
                  ? String(v.ram).toLowerCase() ===
                    String(ramParam).toLowerCase()
                  : true;
                const storageOk = storageParam
                  ? String(v.storage).toLowerCase() ===
                    String(storageParam).toLowerCase()
                  : true;
                return ramOk && storageOk;
              });
              if (idx >= 0) variantIndex = idx;
            }

            break;
          }
        }
      }

      // 3) Match by brand only
      if (!selectedLaptop && brandParam && Array.isArray(laptops)) {
        const b = brandParam.toLowerCase();
        for (const laptop of laptops) {
          const brandVal = (laptop.brand || laptop.brand_name || "")
            .toString()
            .toLowerCase();
          if (brandVal === b) {
            selectedLaptop = laptop;
            break;
          }
        }
      }

      // 4) Fallback to id param or first laptop
      if (!selectedLaptop && Array.isArray(laptops)) {
        const idParam = query.get("id");
        if (idParam) {
          selectedLaptop = laptops.find(
            (lp) =>
              String(lp.id) === String(idParam) ||
              String(lp.product_id) === String(idParam) ||
              String(lp.model) === String(idParam),
          );
        }
        if (!selectedLaptop) selectedLaptop = laptops[0] || null;
      }

      setLaptopData(normalizeLaptop(selectedLaptop));
      setSelectedVariant(Math.max(0, variantIndex));
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [location.search, laptops, routeSlug]);

  // Redirect to canonical SEO-friendly path when laptopData is available
  useEffect(() => {
    if (!laptopData) return;

    const canonicalSlug = generateSlug(
      laptopData.product_name ||
        laptopData.model_number ||
        laptopData.model ||
        "",
    );
    if (!canonicalSlug) return;
    const desiredPath = `/laptops/${canonicalSlug}`;
    const currentPath = window.location.pathname;
    if (currentPath !== desiredPath || location.search) {
      navigate(desiredPath, { replace: true });
    }
  }, [laptopData, navigate, location.search]);

  // Record a single product view per browser session for laptops.
  useEffect(() => {
    const productIdRaw =
      laptopData?.product_id || laptopData?.productId || laptopData?.id;
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
  }, [laptopData?.product_id, laptopData?.productId, laptopData?.id]);

  const variants = laptopData?.variants || [];
  const currentVariant = variants?.[selectedVariant];
  const currentProductId =
    laptopData?.id ?? laptopData?.product_id ?? laptopData?.productId ?? null;

  usePageEngagementTracker({
    productId: currentProductId,
    pagePath:
      typeof window !== "undefined" ? window.location.pathname : "/laptops",
    source: "laptop-detail",
    enabled: Boolean(currentProductId),
  });
  const overallScore = normalizeScore100(laptopData?.spec_score_v2);
  const allStorePrices =
    variants?.flatMap(
      (variant) =>
        variant.store_prices?.map((store) => ({
          ...store,
          variantName: `${variant.ram}/${variant.storage}`,
          variantSpec: variant.specification_summary || "",
        })) || [],
    ) || [];

  const variantStorePrices =
    currentVariant?.store_prices?.map((sp) => ({
      ...sp,
      variantName: `${currentVariant.ram}/${currentVariant.storage}`,
      variantSpec: currentVariant.specification_summary || "",
    })) || [];

  const getStoreLogo = (storeName) => getLogo(storeName);

  const toPriceNumber = (price) => {
    if (typeof price === "number") {
      return Number.isFinite(price) && price > 0 ? price : null;
    }
    const normalized = Number(String(price ?? "").replace(/[^\d.]/g, ""));
    return Number.isFinite(normalized) && normalized > 0 ? normalized : null;
  };

  const getVariantBestPrice = (variant) => {
    const prices = [
      variant?.base_price,
      ...(Array.isArray(variant?.store_prices)
        ? variant.store_prices.map((store) => store?.price)
        : []),
    ]
      .map(toPriceNumber)
      .filter((price) => price != null);

    return prices.length ? Math.min(...prices) : null;
  };

  const formatPrice = (price) => {
    const normalized = toPriceNumber(price);
    if (normalized == null) return "N/A";
    return new Intl.NumberFormat("en-IN").format(normalized);
  };
  const RUPEE_SYMBOL = "\u20B9";

  const getCompactProcessorLabel = (raw) => {
    const text = String(raw || "").trim();
    if (!text) return "";

    const coreUltra = text.match(/(?:Intel\s+)?Core\s+Ultra\s+\d+/i);
    if (coreUltra) return coreUltra[0].replace(/^intel\s+/i, "");

    const coreI = text.match(/(?:Intel\s+)?Core\s+i[3579](?:-\d+\w*)?/i);
    if (coreI) return coreI[0].replace(/^intel\s+/i, "");

    const ryzen = text.match(/Ryzen\s+\d+\s*[A-Za-z0-9-]*/i);
    if (ryzen) return ryzen[0].trim();

    const apple = text.match(/Apple\s+M\d+\s*(?:Pro|Max|Ultra)?/i);
    if (apple) return apple[0].trim();

    return text.split(/\s+/).slice(0, 3).join(" ");
  };

  const getCompactRamLabel = (raw) => {
    const text = String(raw || "").trim();
    if (!text) return "";
    const m = text.match(/(\d+(?:\.\d+)?)\s*(TB|GB|MB)/i);
    if (m) return `${m[1]}${String(m[2]).toUpperCase()}`;
    return text.replace(/\s+/g, "");
  };

  const getCompactDisplayLabel = (raw) => {
    const text = String(raw || "").trim();
    if (!text) return "";
    const m = text.match(/(\d+(?:\.\d+)?)\s*(?:inch|inches|in|")/i);
    if (m) return `${m[1]}"`;
    return text.replace(/\s+inch(es)?/i, '"');
  };

  const getCompactStorageLabel = (raw) => {
    const text = String(raw || "").trim();
    if (!text) return "";
    const m = text.match(/(\d+(?:\.\d+)?)\s*(TB|GB)/i);
    if (m) return `${m[1]}${String(m[2]).toUpperCase()}`;
    return text.split(/\s+/).slice(0, 2).join(" ");
  };

  const getCompactBatteryLabel = (raw) => {
    const text = String(raw || "").trim();
    if (!text) return "";
    const wh = text.match(/(\d+(?:\.\d+)?)\s*wh/i);
    if (wh) return `${wh[1]}Wh`;
    const mah = text.match(/(\d+(?:\.\d+)?)\s*mah/i);
    if (mah) return `${mah[1]}mAh`;
    return text.split(/\s+/).slice(0, 3).join(" ");
  };

  const normalizeInlineText = (value) =>
    String(value || "")
      .replace(/\s+/g, " ")
      .trim();

  const escapeRegex = (value) =>
    String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const cleanSeriesLabel = (seriesRaw, brandRaw) => {
    const brand = normalizeInlineText(brandRaw);
    let series = normalizeInlineText(seriesRaw);
    if (!series) return "";
    if (brand) {
      const brandPrefix = new RegExp(`^${escapeRegex(brand)}\\s+`, "i");
      series = normalizeInlineText(series.replace(brandPrefix, ""));
      if (series.toLowerCase() === brand.toLowerCase()) return "";
    }
    return series;
  };

  const buildCleanLaptopTitle = (data, brandRaw, modelRaw) => {
    const brand = normalizeInlineText(brandRaw);
    const model = normalizeInlineText(modelRaw);
    let title = normalizeInlineText(
      data?.product_name || data?.name || data?.model || model || "Laptop",
    );

    if (!title) return "Laptop";

    // Collapse duplicated brand prefixes like "HP HP ..."
    if (brand) {
      const repeatedBrand = new RegExp(
        `^(${escapeRegex(brand)})(?:\\s+${escapeRegex(brand)})+\\b`,
        "i",
      );
      title = normalizeInlineText(title.replace(repeatedBrand, "$1"));
    }

    if (model && !title.toLowerCase().includes(model.toLowerCase())) {
      title = `${title} ${model}`;
    }

    return title || "Laptop";
  };

  const capitalizeFirst = (raw) => {
    const text = normalizeInlineText(raw);
    if (!text) return "";
    return text.charAt(0).toUpperCase() + text.slice(1);
  };

  const toNormalCase = (raw) => {
    if (raw == null) return "";
    const ACRONYMS = new Set([
      "GB",
      "TB",
      "SSD",
      "HDD",
      "NVMe",
      "PCIe",
      "DDR4",
      "DDR5",
      "LPDDR5",
      "RAM",
      "CPU",
      "GPU",
      "GHz",
      "MHz",
      "Wh",
      "W",
      "V",
      "Hz",
      "IPS",
      "OLED",
      "LCD",
      "LED",
      "QHD",
      "FHD",
      "UHD",
      "4K",
      "HD",
      "FHD",
      "HDR",
      "Dolby",
      "Atmos",
      "WiFi",
      "Bluetooth",
      "USB",
      "HDMI",
      "Thunderbolt",
      "USB-C",
      "USB-A",
      "PD",
      "CNC",
      "TPM",
      "FHD",
      "UHD",
      "RGB",
      "AI",
      "TPM",
      "WPA3",
      "WPA2",
      "MP",
      "K",
      "X",
      "GB",
      "MB",
      "KB",
      "mm",
      "cm",
      "kg",
      "lb",
      "oz",
      "in",
      "ft",
      "m",
      "km",
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
    const priceA = toPriceNumber(a?.price) ?? Infinity;
    const priceB = toPriceNumber(b?.price) ?? Infinity;
    return priceA - priceB;
  });

  const sortedVariantStores = variantStorePrices.slice().sort((a, b) => {
    const priceA = toPriceNumber(a?.price) ?? Infinity;
    const priceB = toPriceNumber(b?.price) ?? Infinity;
    return priceA - priceB;
  });
  const selectedVariantPrice = getVariantBestPrice(currentVariant);

  const displayedStores = showAllStores
    ? sortedStores
    : sortedVariantStores.slice(0, 3);

  // Generate detailed share content with product information
  const generateShareContent = () => {
    const brand =
      laptopData?.brand ||
      laptopData?.brand_name ||
      laptopData?.manufacturer ||
      "Laptop";
    const model =
      laptopData?.product_name ||
      laptopData?.model ||
      laptopData?.model_number ||
      "Unknown";
    const processor =
      laptopData?.specifications?.processor ||
      laptopData?.specifications?.processor_name ||
      laptopData?.processor ||
      laptopData?.cpu ||
      laptopData?.specs?.processor ||
      "Processor info not available";
    const ram =
      laptopData?.specifications?.ram ||
      laptopData?.ram ||
      laptopData?.specs?.ram ||
      "RAM info not available";
    const storage =
      laptopData?.specifications?.storage ||
      laptopData?.storage ||
      laptopData?.specs?.storage ||
      "Storage info not available";
    const display =
      laptopData?.specifications?.display ||
      laptopData?.display ||
      laptopData?.specs?.display ||
      "Display info not available";
    const gpu =
      laptopData?.specifications?.gpu ||
      laptopData?.gpu ||
      laptopData?.specs?.gpu ||
      "GPU info not available";
    const price = selectedVariantPrice
      ? `${RUPEE_SYMBOL}${formatPrice(selectedVariantPrice)}`
      : "Price not available";

    return {
      title: `${brand} ${model}`,
      description: `${processor} | ${ram} RAM | ${storage} Storage | ${display} Display | ${gpu} GPU | Price: ${price}`,
      shortDescription: `${brand} ${model} - ${processor}, ${ram}, ${storage}, Price: ${price}`,
      fullDetails: [
        `${brand} ${model}`,
        `Processor: ${processor}`,
        `RAM: ${ram}`,
        `Storage: ${storage}`,
        `Display: ${display}`,
        `GPU: ${gpu}`,
        `Price: ${price}`,
      ].join("\n"),
    };
  };

  const getCanonicalUrl = useMemo(() => {
    const path = location?.pathname || "/";
    return toCanonicalPageUrl(path, SITE_ORIGIN);
  }, [location.pathname]);

  const getShareUrl = () => {
    try {
      const base = getCanonicalUrl;
      const url = new URL(base);
      const productId =
        laptopData?.id ||
        laptopData?.product_id ||
        laptopData?.productId ||
        laptopData?.model_number ||
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
      setShowShareMenu(false);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Tabs configuration for laptops
  const mobileTabs = [
    { id: "specifications", label: "Tech Specs", icon: FaMicrochip },
    { id: "display", label: "Display", icon: FaExpand },
    { id: "performance", label: "Performance", icon: FaBolt },
    { id: "battery", label: "Battery", icon: FaBatteryFull },
    { id: "build", label: "Build", icon: FaShieldAlt },
  ];

  const desktopTabs = [
    ...mobileTabs,
    { id: "connectivity", label: "Ports", icon: FaUsb },
    { id: "software", label: "Software", icon: FaWindows },
  ];

  const tabs = window.innerWidth < 768 ? mobileTabs : desktopTabs;

  const isScoreKey = (key) => /(^|[_-])score$/i.test(String(key || ""));

  const renderSpecItems = (data) => {
    if (!data || typeof data !== "object") {
      return (
        <div className="text-center py-4 text-gray-500">No data available</div>
      );
    }

    const entries = Object.entries(data).filter(
      ([key, value]) =>
        value !== "" && value != null && value !== false && !isScoreKey(key),
    );

    if (entries.length === 0) {
      return (
        <div className="text-center py-4 text-gray-500">No data available</div>
      );
    }

    const toDisplayValue = (value) => {
      if (value === true) return "Yes";
      if (value === false) return "No";
      if (Array.isArray(value)) return value.filter(Boolean).join(", ");
      if (
        value &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        Object.keys(value).length > 0
      ) {
        return Object.entries(value)
          .map(([k, v]) => `${toNormalCase(k)}: ${String(v)}`)
          .join(", ");
      }
      return value || "Not specified";
    };

    return (
      <>
        <div className="space-y-3 sm:hidden">
          {entries.map(([key, value]) => (
            <div
              key={key}
              className="grid grid-cols-[6.5rem_minmax(0,1fr)] items-start gap-x-4 gap-y-1 py-1"
            >
              <div className="text-[13px] font-medium leading-5 text-[#45608f]">
                {toNormalCase(key)}
              </div>
              <div className="break-words text-[15px] font-semibold leading-6 text-[#0d347f]">
                {toDisplayValue(value)}
              </div>
            </div>
          ))}
        </div>

        <div className="hidden space-y-4 sm:block">
          {entries.map(([key, value]) => (
            <div
              key={key}
              className="grid gap-2 py-1 sm:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] sm:gap-6"
            >
              <div className="text-sm font-medium text-[#58709d]">
                {toNormalCase(key)}
              </div>
              <div className="break-words text-sm font-semibold text-[#123986]">
                {toDisplayValue(value)}
              </div>
            </div>
          ))}
        </div>
      </>
    );
  };

  // Filter specifications by category
  const filterSpecsByCategory = (category) => {
    if (!laptopData?.specifications) return {};

    const specMapping = {
      specifications: [
        "processor",
        "processor_generation",
        "cpu_cores",
        "cpu_threads",
        "base_clock_speed",
        "max_clock_speed",
        "cache",
        "ram",
        "ram_type",
        "ram_speed",
        "ram_slots",
        "max_ram_support",
        "ram_upgradable",
        "storage",
        "storage_type",
        "storage_slots",
        "expandedable_storage",
        "gpu",
        "gpu_memory",
      ],
      display: [
        "screen_size",
        "resolution",
        "panel_type",
        "refresh_rate",
        "brightness",
        "color_gamut",
        "touch_screen",
        "hdr_support",
      ],
      battery: [
        "battery_capacity",
        "battery_life",
        "fast_charging",
        "charger_type",
      ],
      build: [
        "weight",
        "thickness",
        "body_material",
        "color",
        "keyboard",
        "fingerprint_scanner",
        "webcam",
        "speakers",
      ],
      connectivity: [
        "wifi",
        "bluetooth",
        "usb_ports",
        "hdmi",
        "audio_jack",
        "sd_card_reader",
        "ethernet",
        "thunderbolt",
        "magsafe",
      ],
      software: [
        "operating_system",
        "preinstalled_apps",
        "security_features",
        "warranty",
        "warranty_type",
        "warranty_terms",
      ],
    };

    const filteredSpecs = {};
    const keys = specMapping[category] || [];

    keys.forEach((key) => {
      if (laptopData.specifications[key] !== undefined) {
        filteredSpecs[key] = laptopData.specifications[key];
      }
    });

    return filteredSpecs;
  };

  const hasSectionData = (data) => {
    if (!data || typeof data !== "object") return false;
    return Object.values(data).some((value) => {
      if (value === "" || value == null || value === false) return false;
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === "object") return Object.keys(value).length > 0;
      return true;
    });
  };

  const getSectionData = (sectionId) => {
    switch (sectionId) {
      case "specifications":
        return filterSpecsByCategory("specifications");
      case "display":
        return filterSpecsByCategory("display");
      case "performance":
        return laptopData?.performance || {};
      case "battery":
        return filterSpecsByCategory("battery");
      case "build":
        return filterSpecsByCategory("build");
      case "connectivity":
        return filterSpecsByCategory("connectivity");
      case "software":
        return filterSpecsByCategory("software");
      default:
        return {};
    }
  };

  const availableTabs = tabs.filter((tab) =>
    hasSectionData(getSectionData(tab.id)),
  );

  useEffect(() => {
    if (!availableTabs || availableTabs.length === 0) return;
    if (!availableTabs.some((tab) => tab.id === activeTab)) {
      setActiveTab(availableTabs[0].id);
    }
  }, [availableTabs, activeTab]);

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);

    if (tabId === "specifications") {
      const topEl = document.getElementById("spec-specifications");
      if (topEl) topEl.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    window.requestAnimationFrame(() => {
      const sectionEl = document.getElementById(`spec-${tabId}`);
      if (sectionEl) {
        sectionEl.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  };

  const renderTabContent = () => {
    if (!laptopData) return null;

    const sectionSpecifications = filterSpecsByCategory("specifications");
    const sectionDisplay = filterSpecsByCategory("display");
    const sectionPerformance = laptopData.performance || {};
    const sectionBattery = filterSpecsByCategory("battery");
    const sectionBuild = filterSpecsByCategory("build");
    const sectionConnectivity = filterSpecsByCategory("connectivity");
    const sectionSoftware = filterSpecsByCategory("software");
    const generalSection = {
      brand: laptopData.brand || laptopData.brand_name || "",
      model: laptopData.model_number || laptopData.model || "",
      category: laptopData.product_type || "laptop",
      processor: laptopData.specifications?.processor || "",
      ram: laptopData.specifications?.ram || currentVariant?.ram || "",
      storage:
        laptopData.specifications?.storage || currentVariant?.storage || "",
      operating_system: laptopData.specifications?.operating_system || "",
      release_year: laptopData.release_year || "",
    };

    const hasAnySection =
      hasSectionData(sectionSpecifications) ||
      hasSectionData(sectionDisplay) ||
      hasSectionData(sectionPerformance) ||
      hasSectionData(sectionBattery) ||
      hasSectionData(sectionBuild) ||
      hasSectionData(sectionConnectivity) ||
      hasSectionData(sectionSoftware);

    if (!hasAnySection) {
      return (
        <div className="bg-white rounded-lg p-4">
          <div className="text-center py-12 text-gray-500">
            <FaLaptop className="text-4xl mx-auto mb-4 text-gray-300" />
            <p>No data available for this section</p>
          </div>
        </div>
      );
    }

    const specSections = [
      {
        id: "spec-general",
        title: "General",
        data: generalSection,
      },
      {
        id: "spec-specifications-main",
        title: "Processor & Memory",
        icon: FaMicrochip,
        color: "text-cyan-500",
        data: sectionSpecifications,
      },
      {
        id: "spec-display",
        title: "Display",
        icon: FaExpand,
        color: "text-green-500",
        data: sectionDisplay,
      },
      {
        id: "spec-performance",
        title: "Performance",
        icon: FaBolt,
        color: "text-yellow-500",
        data: sectionPerformance,
      },
      {
        id: "spec-battery",
        title: "Battery",
        icon: FaBatteryFull,
        color: "text-blue-500",
        data: sectionBattery,
      },
      {
        id: "spec-build",
        title: "Build & Design",
        icon: FaShieldAlt,
        color: "text-blue-500",
        data: sectionBuild,
      },
      {
        id: "spec-connectivity",
        title: "Connectivity",
        icon: FaUsb,
        color: "text-cyan-500",
        data: sectionConnectivity,
      },
      {
        id: "spec-software",
        title: "Software & Warranty",
        icon: FaWindows,
        color: "text-cyan-500",
        data: sectionSoftware,
      },
    ].filter((section) => hasSectionData(section.data));

    return (
      <div id="spec-specifications" className="w-full max-w-4xl px-2 sm:px-0">
        <div className="hidden text-slate-900 sm:block">
          <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-blue-600">
            Full Specifications
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[#556b95]">
            {headerTitle} specifications cover processor, memory, display,
            battery, build, ports, and software details.
          </p>
        </div>

        <div className="space-y-4 sm:mt-6 sm:space-y-5">
          {specSections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              className="overflow-hidden rounded-2xl border border-[#dde1ff] bg-gradient-to-br from-[#edf4ff] via-[#fbfcff] to-[#f3efff] shadow-[0_18px_44px_rgba(99,102,241,0.10)]"
            >
              <div className="px-4 pt-4 sm:px-6 sm:pt-6">
                <h4 className="text-xl font-semibold tracking-tight text-[#123986] sm:text-2xl">
                  {section.title}
                </h4>
                <div className="mt-4 h-px w-full bg-gradient-to-r from-[#6fa8ff] via-[#8e87ff] to-[#d2b6ff]" />
              </div>
              <div className="mt-5 px-4 pb-4 sm:px-6 sm:pb-6">
                {renderSpecItems(section.data)}
              </div>
            </section>
          ))}
        </div>
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
            Loading Laptop Details...
          </p>
        </div>
      </div>
    );
  }

  if (!loading && !laptopData) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
          <div className="text-gray-300 text-5xl mb-4 flex justify-center">
            <FaLaptop />
          </div>
          <h3 className="text-2xl font-semibold text-gray-900 mb-3">
            Laptop Not Found
          </h3>
          <p className="text-gray-600">
            The requested laptop could not be found.
          </p>
        </div>
      </div>
    );
  }

  const headerBrand = normalizeInlineText(
    laptopData?.brand || laptopData?.brand_name || "",
  );
  const headerModel = normalizeInlineText(
    laptopData?.model_number || laptopData?.model || "",
  );
  const headerSeries = cleanSeriesLabel(laptopData?.series, headerBrand);
  const headerTitle = capitalizeFirst(
    buildCleanLaptopTitle(laptopData, headerBrand, headerModel),
  );
  const headerType = toNormalCase(
    normalizeInlineText(laptopData?.product_type || "Laptop"),
  );
  const headerProcessor = getCompactProcessorLabel(
    laptopData?.specifications?.processor ||
      laptopData?.specifications?.processor_name ||
      laptopData?.cpu ||
      "",
  );
  const headerDisplay = getCompactDisplayLabel(
    laptopData?.specifications?.screen_size ||
      laptopData?.specifications?.display ||
      "",
  );
  const headerDescriptor = [
    headerType,
    headerProcessor,
    headerDisplay && `${headerDisplay} Display`,
  ]
    .filter(Boolean)
    .join(" | ");
  const headerModelSubtitle =
    headerModel &&
    !headerTitle.toLowerCase().includes(headerModel.toLowerCase())
      ? headerModel
      : "";
  const headerSubtitle = [headerBrand, headerSeries, headerModelSubtitle]
    .filter(Boolean)
    .map((part) => capitalizeFirst(part))
    .join(" | ");
  const headerVariantLabel = currentVariant
    ? [currentVariant.ram, currentVariant.storage].filter(Boolean).join(" / ")
    : "";
  const headerSpecScoreLabel = Number.isFinite(overallScore)
    ? Math.round(Number(overallScore))
    : null;
  const headerRatingValue = Number(
    laptopData?.rating ?? laptopData?.avg_rating ?? Number.NaN,
  );
  const headerRatingLabel = Number.isFinite(headerRatingValue)
    ? headerRatingValue.toFixed(1)
    : null;
  const headerOsLabel = normalizeInlineText(
    laptopData?.specifications?.operating_system || "",
  );
  const galleryImages = Array.isArray(laptopData?.images)
    ? laptopData.images.filter(Boolean)
    : [];
  const goToPreviousImage = () => {
    if (galleryImages.length <= 1) return;
    setActiveImage((current) =>
      current === 0 ? galleryImages.length - 1 : current - 1,
    );
  };
  const goToNextImage = () => {
    if (galleryImages.length <= 1) return;
    setActiveImage((current) =>
      current === galleryImages.length - 1 ? 0 : current + 1,
    );
  };
  const generatedHeaderSummary = [
    headerTitle,
    headerProcessor ? `is powered by ${headerProcessor}` : "",
    headerDisplay ? `and features a ${headerDisplay} display` : "",
    headerVariantLabel ? `with a ${headerVariantLabel} configuration` : "",
    headerOsLabel ? `running ${headerOsLabel}` : "",
  ]
    .filter(Boolean)
    .join(" ");
  const headerSummary = normalizeInlineText(
    laptopData?.description ||
      laptopData?.short_description ||
      laptopData?.summary ||
      generatedHeaderSummary,
  );
  const headerSummaryHasMore = headerSummary.length > 280;
  const visibleHeaderSummary =
    headerSummaryHasMore && !showHeaderSummaryFull
      ? `${headerSummary.slice(0, 277).trim()}...`
      : headerSummary;
  const headerSpecScoreBlock =
    headerSpecScoreLabel != null ? (
      <div className="flex items-end gap-1 leading-none">
        <span className="text-3xl font-semibold leading-none text-blue-600">
          {headerSpecScoreLabel}
        </span>
        <span className="pb-0.5 text-sm font-semibold text-blue-600">/100</span>
        <div className="flex flex-col items-start pb-0.5 leading-none">
          <span className="text-[8px] font-semibold uppercase tracking-[0.32em] text-blue-400">
            Spec
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-blue-500">
            Score
          </span>
        </div>
      </div>
    ) : null;
  const buildLaptopPoints = (...values) =>
    values.map((value) => normalizeInlineText(value)).filter(Boolean);
  const laptopSummarySections = [
    {
      key: "processor",
      title: "Processor",
      description: "Basic chipset setup for smooth daily use.",
      icon: FaMicrochip,
      color: "text-blue-500",
      points: buildLaptopPoints(
        getCompactProcessorLabel(
          laptopData?.specifications?.processor ||
            laptopData?.specifications?.processor_name ||
            laptopData?.cpu ||
            "",
        ),
        [
          laptopData?.specifications?.cpu_cores
            ? `${laptopData.specifications.cpu_cores} Cores`
            : "",
          laptopData?.specifications?.cpu_threads
            ? `${laptopData.specifications.cpu_threads} Threads`
            : "",
        ]
          .filter(Boolean)
          .join(" | "),
        [
          getCompactRamLabel(
            currentVariant?.ram || laptopData?.specifications?.ram || "",
          ),
          laptopData?.specifications?.ram_type || "",
        ]
          .filter(Boolean)
          .join(" / "),
      ),
    },
    {
      key: "display",
      title: "Display",
      description: "Basic screen for clear, fluid viewing.",
      icon: FaExpand,
      color: "text-green-500",
      points: buildLaptopPoints(
        [
          getCompactDisplayLabel(
            laptopData?.specifications?.screen_size ||
              laptopData?.specifications?.display ||
              "",
          ),
          laptopData?.specifications?.panel_type || "",
        ]
          .filter(Boolean)
          .join(" | "),
        laptopData?.specifications?.resolution || "",
        laptopData?.specifications?.refresh_rate
          ? `Up to ${laptopData.specifications.refresh_rate} Hz refresh rate`
          : "",
      ),
    },
    {
      key: "memory",
      title: "Memory",
      description: "Balanced memory setup for smoother multitasking.",
      icon: FaMemory,
      color: "text-indigo-500",
      points: buildLaptopPoints(
        getCompactRamLabel(
          laptopData?.specifications?.ram ||
            currentVariant?.ram ||
            laptopData?.ram ||
            "",
        ),
        laptopData?.specifications?.ram_type || "",
        laptopData?.specifications?.ram_speed || "",
      ),
    },
    {
      key: "battery",
      title: "Battery",
      description: "Basic battery for longer screen time.",
      icon: FaBatteryFull,
      color: "text-orange-500",
      points: buildLaptopPoints(
        getCompactBatteryLabel(
          laptopData?.specifications?.battery_capacity || "",
        ),
        laptopData?.specifications?.fast_charging || "",
        laptopData?.specifications?.storage_type || "",
      ),
    },
  ].filter((section) => section.points.length > 0);

  // SEO meta
  const metaName = laptopData?.product_name || laptopData?.model || "";
  const metaBrand = laptopData?.brand || laptopData?.brand_name || "";
  const metaCpu =
    laptopData?.specifications?.processor || laptopData?.cpu || "";
  const metaRam =
    (laptopData?.variants && laptopData.variants[0]?.ram) ||
    laptopData?.specifications?.ram ||
    "";
  const metaStorage =
    (laptopData?.variants && laptopData.variants[0]?.storage) ||
    laptopData?.specifications?.storage ||
    "";
  const metaBaseName = metaName || "Laptop";
  const metaNameWithBrand =
    metaBrand && metaBaseName
      ? metaBaseName.toLowerCase().includes(metaBrand.toLowerCase())
        ? metaBaseName
        : `${metaBrand} ${metaBaseName}`
      : metaBaseName;
  const metaTitle = laptopMeta.title({
    name: metaNameWithBrand,
    cpu: metaCpu,
    ram: metaRam,
    storage: metaStorage,
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
  const metaDescription = laptopMeta.description({
    name: metaBaseName,
    cpu: metaCpu,
    ram: metaRam,
    storage: metaStorage,
    brand: metaBrand,
  });
  const metaKeywords = buildDeviceSeoKeywords({
    device: laptopData,
    productName: metaNameWithBrand || metaBaseName || "",
    brand: metaBrand,
    category: "laptops",
    currentYear: new Date().getFullYear(),
    baseTerms: [
      "laptops",
      "laptop price in india",
      "compare laptop specifications",
      metaCpu ? `${metaCpu} laptop` : "",
      metaRam ? `${metaRam} RAM laptop` : "",
      metaStorage ? `${metaStorage} storage laptop` : "",
    ],
    maxKeywords: 45,
  });
  const canonicalUrl = getCanonicalUrl;
  const metaImage = laptopData?.images?.[0] || null;
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
    const productName = metaNameWithBrand || metaBaseName || metaTitle || "";
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
  const showHiddenLaptopSections = false;

  return (
    <div className="w-full">
      <Helmet prioritizeSeoTags>
        <title>{metaTitleWithMonthYear}</title>
        <meta name="description" content={metaDescription} />
        <meta name="keywords" content={metaKeywords} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="product" />
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDescription} />
        {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
        {ogImage && <meta property="og:image" content={ogImage} />}
        <meta
          name="twitter:card"
          content={ogImage ? "summary_large_image" : "summary"}
        />
        <meta name="twitter:title" content={metaTitle} />
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
                X
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
        {/* Mobile Header */}
        <div className="hidden">
          <div className="flex justify-between items-start mb-3">
            <div>
              {showHiddenLaptopSections ? (
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
                    {laptopData.release_year}
                  </span>
                </div>
              ) : null}
              {headerDescriptor ? (
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 mb-1">
                  {headerDescriptor}
                </p>
              ) : null}
              <h1 className="text-xl font-extrabold tracking-tight mb-1 text-gray-900 leading-tight">
                {headerTitle}
              </h1>
              {headerSubtitle ? (
                <p className="text-cyan-700 text-sm font-medium flex items-center gap-2">
                  {headerSubtitle}
                </p>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <FaShareAlt className="text-lg text-gray-600" />
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between mt-4">
            {currentVariant && (
              <span className="text-2xl font-bold text-green-600">
                ₹{formatPrice(selectedVariantPrice)}
              </span>
            )}
          </div>
        </div>

        <section className="w-full text-slate-900">
          <div className="mx-auto max-w-7xl px-3 pb-4 pt-0 sm:px-6 sm:pb-5 lg:px-8 lg:pb-6">
            <div className="px-3 pb-3 pt-3 sm:px-6 sm:pb-6 sm:pt-4 lg:px-7 lg:pb-7 lg:pt-4">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0 flex-1">
              {headerDescriptor ? (
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.32em] text-blue-500 sm:text-xs">
                  {headerDescriptor}
                </p>
              ) : null}
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-[2rem]">
                {headerTitle}
              </h1>

              {visibleHeaderSummary ? (
                <div className="mt-2 max-w-3xl">
                  <p className="text-sm leading-6 text-slate-600 sm:text-base">
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
                      {showHeaderSummaryFull ? "Show less" : "Read more"}
                    </button>
                  ) : null}
                </div>
              ) : null}

              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                {headerVariantLabel ? (
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-medium text-slate-700">
                    {headerVariantLabel}
                  </span>
                ) : null}
                {headerOsLabel ? (
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-medium text-slate-700">
                    {headerOsLabel}
                  </span>
                ) : null}
              </div>

              {currentVariant ? (
                <div className="mt-4 flex flex-wrap items-end gap-2">
                  <div className="text-3xl font-bold tracking-tight text-emerald-600">
                    ₹ {formatPrice(selectedVariantPrice)}
                  </div>
                  <div className="pb-0.5 text-sm text-slate-500">
                    ({currentVariant.ram} / {currentVariant.storage})
                  </div>
                </div>
              ) : null}
            </div>
            <div className="flex flex-col items-start gap-3 xl:items-end">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleShare}
                  className="rounded-full border border-slate-200 p-2 transition-colors hover:bg-slate-50"
                  title="Share"
                >
                  <FaShareAlt className="text-lg text-slate-500" />
                </button>
              </div>

              {headerSpecScoreBlock}

            </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row">
          {/* Images Section */}
          <div className="lg:w-2/5 rounded-md bg-transparent p-4 shadow-none sm:p-6">
            {/* Main Image */}
            <div className="relative mb-4 overflow-hidden rounded-[28px] bg-white px-4 py-8 sm:px-10 sm:py-12">
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
                  src={galleryImages[activeImage] || "/placeholder-laptop.jpg"}
                  alt={laptopData.product_name}
                  className="h-auto max-h-[320px] w-auto object-contain drop-shadow-[0_16px_24px_rgba(15,23,42,0.12)] sm:max-h-[380px]"
                  onError={(e) => {
                    e.target.src =
                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23ffffff'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='16' fill='%239ca3af'%3ENo Image Available%3C/text%3E%3C/svg%3E";
                  }}
                />
              </div>
              {galleryImages.length > 1 ? (
                <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2">
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

            {/* Thumbnails */}
            {galleryImages.length > 1 && (
              <div className="mb-6 flex gap-3 overflow-x-auto pb-1 no-scrollbar">
                {galleryImages.slice(0, 4).map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveImage(index)}
                    className={`flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-md border p-1.5 transition-all duration-200 ${
                      activeImage === index
                        ? "border-blue-500 bg-white shadow-sm ring-2 ring-blue-100"
                        : "border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-white"
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${laptopData.product_name} view ${index + 1}`}
                      className="h-full w-full object-contain"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Variant Selection */}
            {variants.length > 0 ? (
              <div className="mb-6">
                <h4 className="mb-3 text-base font-semibold text-slate-900">
                  Available Variants
                </h4>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {variants.map((variant, index) => (
                    <button
                      key={variant.id || index}
                      type="button"
                      onClick={() => setSelectedVariant(index)}
                      aria-pressed={selectedVariant === index}
                      className={`relative rounded-2xl border p-3 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 sm:p-4 ${
                        selectedVariant === index
                          ? "border-blue-600 bg-gradient-to-br from-blue-600 via-blue-500 to-blue-600 text-white shadow-md"
                          : "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/40"
                      }`}
                    >
                      {selectedVariant === index ? (
                        <span className="absolute right-2 top-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm">
                          <FaCheck className="text-[9px]" />
                        </span>
                      ) : null}
                      <div
                        className={`mb-1 text-sm font-semibold leading-tight ${selectedVariant === index ? "text-white" : "text-gray-900"}`}
                      >
                        {variant.ram} / {variant.storage}
                      </div>
                      {variant.processor ? (
                        <div
                          className={`mb-1.5 text-[11px] leading-tight ${selectedVariant === index ? "text-white/80" : "text-gray-500"}`}
                        >
                          {variant.processor}
                        </div>
                      ) : null}
                      <div
                        className={`text-sm font-bold ${selectedVariant === index ? "text-emerald-200" : "text-green-600"}`}
                      >
                        ₹{formatPrice(getVariantBestPrice(variant))}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Quick Specs - Mobile Only */}
            <div className="lg:hidden grid grid-cols-2 gap-2 mb-6">
              {laptopData.specifications &&
                [
                  {
                    key: "processor",
                    label: "Processor",
                    icon: FaMicrochip,
                    format: (v) => getCompactProcessorLabel(v),
                  },
                  {
                    key: "ram",
                    label: "RAM",
                    icon: FaMemory,
                    format: (v) => getCompactRamLabel(v),
                  },
                  {
                    key: "storage",
                    label: "Storage",
                    icon: FaHdd,
                    format: (v) => getCompactStorageLabel(v),
                  },
                  {
                    key: "battery_capacity",
                    label: "Battery",
                    icon: FaBatteryFull,
                    format: (v) => getCompactBatteryLabel(v),
                  },
                ].map((item) => {
                  const rawValue = laptopData.specifications[item.key];
                  if (
                    rawValue === undefined ||
                    rawValue === null ||
                    rawValue === ""
                  )
                    return null;
                  const normalizedValue =
                    typeof item.format === "function"
                      ? item.format(String(rawValue))
                      : String(rawValue);
                  if (!normalizedValue) return null;
                  const displayValue = normalizedValue;
                  return (
                    <div
                      key={item.key}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-center"
                    >
                      <div className="font-semibold text-sm leading-tight text-slate-900 whitespace-nowrap">
                        {displayValue}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Details Section */}
          <div className="flex flex-col lg:w-3/5">
            {/* Desktop Header */}
            <div className="hidden">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  {headerDescriptor ? (
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">
                      {headerDescriptor}
                    </p>
                  ) : null}
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-[2rem]">
                      {headerTitle}
                    </h1>
                  </div>

                  {headerSubtitle ? (
                    <p className="mt-2 text-sm font-medium text-cyan-700">
                      {headerSubtitle}
                    </p>
                  ) : null}

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                    {headerVariantLabel ? (
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-medium text-slate-700">
                        {headerVariantLabel}
                      </span>
                    ) : null}
                    {headerOsLabel ? (
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-medium text-slate-700">
                        {headerOsLabel}
                      </span>
                    ) : null}
                  </div>

                  {currentVariant ? (
                    <div className="mt-4 flex flex-wrap items-end gap-2">
                      <div className="text-3xl font-bold tracking-tight text-emerald-600">
                        ₹ {formatPrice(selectedVariantPrice)}
                      </div>
                      <div className="pb-0.5 text-sm text-slate-500">
                        ({currentVariant.ram} / {currentVariant.storage})
                      </div>
                    </div>
                  ) : null}
                </div>
                <div className="flex flex-col items-start gap-3 lg:items-end">
                  <button
                    onClick={handleShare}
                    className="rounded-full border border-slate-200 p-2 transition-colors hover:bg-slate-50"
                    title="Share"
                  >
                    <FaShareAlt className="text-lg text-slate-500" />
                  </button>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                    {headerSpecScoreLabel != null ? (
                      <div className="flex items-end gap-1 leading-none">
                        <span className="text-3xl font-semibold leading-none text-blue-600">
                          {headerSpecScoreLabel}
                        </span>
                        <div className="flex flex-col items-start leading-none">
                          <span className="text-[8px] font-semibold uppercase tracking-[0.32em] text-blue-400">
                            Spec
                          </span>
                          <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-blue-500">
                            Score
                          </span>
                        </div>
                      </div>
                    ) : null}
                    {headerRatingLabel ? (
                      <span className="pb-0.5 font-medium text-slate-800">
                        {headerRatingLabel}/5
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="hidden items-center gap-3 mb-6">
                {currentVariant && (
                  <div>
                    <div className="text-sm text-gray-500 mb-1">
                      Starting from
                    </div>
                    <div className="text-4xl font-bold text-green-600">
                      ₹ {formatPrice(selectedVariantPrice)}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Store Prices Section */}
            {sortedStores.length > 0 && (
              <div className="order-2 mb-5 mt-5">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                      <FaStore className="text-green-500" />
                      Check Price On
                    </h3>
                    <p className="text-sm leading-6 text-slate-500">
                      Compare live offers from trusted stores for{" "}
                      {metaBrand || "this laptop"}.
                    </p>
                  </div>
                  {sortedStores.length > 3 && (
                    <button
                      onClick={() => setShowAllStores(!showAllStores)}
                      className="flex items-center gap-1 text-sm font-medium text-blue-600 transition-colors hover:text-blue-500"
                    >
                      {showAllStores ? "Show Less" : "View All"}
                      <FaChevronDown
                        className={`text-xs text-blue-400 transition-transform ${
                          showAllStores ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {displayedStores.map((store, index) => {
                    const hasStoreUrl = Boolean(store?.url);
                    return (
                      <div
                        key={store.id || index}
                        className="rounded-xl border border-slate-200 bg-white p-2.5 transition-all duration-200 hover:border-blue-300 hover:shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex min-w-0 flex-1 items-center gap-2.5">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 p-2 shadow-sm">
                              <img
                                src={getStoreLogo(store.store_name)}
                                alt={store.store_name}
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  e.target.src = getLogo("");
                                }}
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="truncate text-sm font-bold capitalize text-slate-900">
                                {store.store_name}
                              </h4>
                              {store.variantSpec ? (
                                <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                                  {store.variantSpec}
                                </p>
                              ) : null}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="text-sm font-bold text-green-600">
                                {RUPEE_SYMBOL} {formatPrice(store.price)}
                              </div>
                            </div>
                            <a
                              href={hasStoreUrl ? store.url : undefined}
                              target="_blank"
                              rel="noopener noreferrer nofollow"
                              onClick={(e) => {
                                if (!hasStoreUrl) e.preventDefault();
                              }}
                              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                                hasStoreUrl
                                  ? "bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 text-white shadow-sm hover:from-blue-700 hover:via-blue-600 hover:to-blue-700 hover:shadow-md"
                                  : "cursor-not-allowed bg-slate-200 text-slate-500"
                              }`}
                            >
                              <FaExternalLinkAlt className="text-[10px]" />
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

            {laptopSummarySections.length > 0 ? (
              <div className="order-1 mt-5 space-y-5">
                <div className="max-w-2xl">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-blue-600">
                    Key Specifications
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-slate-900 sm:text-2xl">
                    Main hardware highlights
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500 sm:text-base">
                    A quick breakdown of the processor, display, memory, and
                    battery details that matter most.
                  </p>
                </div>
                <div className="rounded-2xl border border-[#dce4f3] bg-gradient-to-br from-[#eef3ff] via-[#f7f8ff] to-[#f2eeff] p-3 sm:p-4 md:p-5">
                  <div className="grid items-stretch gap-3 md:grid-cols-2 lg:gap-5">
                    {laptopSummarySections.map((section) => {
                      const Icon = section.icon;
                      return (
                        <div
                          key={section.key}
                          className="flex h-full flex-col rounded-2xl border border-[#dce4f3] bg-white/75 p-4 transition-all duration-200 sm:p-5"
                        >
                        <div className="flex items-start gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-50 ring-1 ring-slate-200">
                            {Icon ? (
                              <Icon className={`text-base ${section.color}`} />
                            ) : null}
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

        <LatestNewsRouteSection
          className="mt-6"
          productType="laptop"
          subtitle="Fresh laptop launches, processor updates, and buying context from the Hooks news desk."
        />

        <div className="mt-6 p-0 sm:p-2">{renderTabContent()}</div>

        {currentProductId ? (
          <ProductDiscoverySections
            productId={currentProductId}
            currentBrand={laptopData?.brand || ""}
            entityType="laptops"
            catalogItems={laptops}
            brandCatalog={brands}
            className="mt-6 w-full px-4 sm:px-0"
          />
        ) : null}
        </div>
      </div>
    </div>
  );
};

export default LaptopDetailCard;
