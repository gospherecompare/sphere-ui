// src/components/LaptopDetailCard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import useDevice from "../../hooks/useDevice";
import useStoreLogos from "../../hooks/useStoreLogos";
import {
  FaHeart,
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
  FaApple,
  FaLinux,
  FaDesktop,
  FaStore,
  FaHdd,
  FaExternalLinkAlt,
  FaChevronDown,
  FaWhatsapp,
  FaFacebook,
  FaLink,
  FaCopy,
  FaCheck,
} from "react-icons/fa";
import Cookies from "js-cookie";
import Spinner from "../ui/Spinner";
import { laptopMeta } from "../../constants/meta";
import { Helmet } from "react-helmet-async";
import { generateSlug, extractNameFromSlug } from "../../utils/slugGenerator";

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
        performance.cores ?? performance.cpu_cores ?? existingSpecs.cpu_cores ?? "",
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
      color_gamut: pickFirstString(display.color_gamut, existingSpecs.color_gamut),
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
      ram_type: pickFirstString(memory.ram_type, memory.type, existingSpecs.ram_type),
      ram_speed: pickFirstString(memory.ram_speed, memory.speed, existingSpecs.ram_speed),
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
        battery.battery_type,
        existingSpecs.battery_capacity,
      ),
      battery_life: pickFirstString(
        battery.life,
        battery.backup_time,
        existingSpecs.battery_life,
      ),
      fast_charging:
        battery.fast_charging ?? existingSpecs.fast_charging ?? "",
      wifi: pickFirstString(
        connectivity.wifi,
        connectivity.wireless,
        existingSpecs.wifi,
      ),
      bluetooth: pickFirstString(connectivity.bluetooth, existingSpecs.bluetooth),
      usb_ports: pickFirstString(
        ports.ports_description,
        existingSpecs.usb_ports,
      ),
      hdmi: ports.hdmi ?? existingSpecs.hdmi ?? "",
      audio_jack:
        ports.audio_combo_jack ?? ports.audio_jack ?? existingSpecs.audio_jack ?? "",
      sd_card_reader:
        ports.sd_card_reader ?? existingSpecs.sd_card_reader ?? "",
      thunderbolt:
        ports.thunderbolt_4 ?? ports.thunderbolt ?? existingSpecs.thunderbolt ?? "",
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

    return {
      ...l,
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
        l.model_number || l.model || basicInfo.model || basicInfo.sku || l.sku || "",
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

  const { laptops } = useDevice();

  // local state
  const navigate = useNavigate();
  const [laptopData, setLaptopData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [showAllSpecs, setShowAllSpecs] = useState(false);
  const [showAllStores, setShowAllStores] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [activeStoreId, setActiveStoreId] = useState(null);
  const [activeTab, setActiveTab] = useState("specifications");

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
    const slugify = (str = "") =>
      String(str)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

    const resolvedId =
      query.get("id") ||
      laptopData.id ||
      laptopData.product_id ||
      laptopData.model_number;
    if (!resolvedId) return;
    const canonicalSlug = generateSlug(
      laptopData.product_name ||
        laptopData.model_number ||
        laptopData.model ||
        "",
    );
    if (!canonicalSlug) return;
    const desiredPath = `/laptops/${canonicalSlug}`;
    const currentPath = window.location.pathname;
    if (currentPath !== desiredPath) {
      navigate(desiredPath + (location.search || ""), { replace: true });
    }
  }, [laptopData, query, navigate, location.search]);

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

  // Get laptop type color
  const getLaptopColor = () => {
    switch (laptopData?.product_type?.toLowerCase()) {
      case "gaming laptop":
        return "red";
      case "ultrabook":
        return "blue";
      case "business laptop":
        return "purple";
      case "2-in-1":
        return "green";
      case "chromebook":
        return "yellow";
      default:
        return "indigo";
    }
  };

  const laptopColor = getLaptopColor();
  const colorClasses = {
    red: {
      bg: "bg-red-500",
      text: "text-red-500",
      light: "bg-red-50",
      border: "border-red-500",
    },
    blue: {
      bg: "bg-blue-500",
      text: "text-blue-500",
      light: "bg-blue-50",
      border: "border-blue-500",
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
    yellow: {
      bg: "bg-yellow-500",
      text: "text-yellow-500",
      light: "bg-yellow-50",
      border: "border-yellow-500",
    },
    indigo: {
      bg: "bg-indigo-500",
      text: "text-indigo-500",
      light: "bg-indigo-50",
      border: "border-indigo-500",
    },
  };

  const currentColor = colorClasses[laptopColor] || colorClasses.blue;

  const variants = laptopData?.variants || [];
  const currentVariant = variants?.[selectedVariant];

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

  const formatPrice = (price) => {
    if (price == null || price === "") return "N/A";
    return new Intl.NumberFormat("en-IN").format(price);
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
    title: `${laptopData?.brand} ${laptopData?.product_name}`,
    text: `Check out ${laptopData?.brand} ${laptopData?.product_name} - ${
      laptopData?.product_type
    }. Price starts at ₹${
      currentVariant?.base_price
        ? formatPrice(currentVariant.base_price)
        : "N/A"
    }`,
    url: window.location.href,
  };

  // Generate detailed share content with product information
  const generateShareContent = () => {
    const brand = laptopData?.brand || laptopData?.manufacturer || "Laptop";
    const model = laptopData?.product_name || laptopData?.model || "Unknown";
    const processor =
      laptopData?.specifications?.processor ||
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
    const price = currentVariant?.base_price
      ? `₹${formatPrice(currentVariant.base_price)}`
      : "Price not available";
    return {
      title: `${brand} ${model}`,
      description: `${processor} | ${ram} RAM | ${storage} Storage | ${display}" Display | ${gpu} GPU | Price: ${price}`,
      shortDescription: `${brand} ${model} - ${processor}, ${ram}, ${storage}, Price: ${price}`,
      fullDetails: `
💻 ${brand} ${model}
🔧 Processor: ${processor}
📦 RAM: ${ram}
💾 Storage: ${storage}
📺 Display: ${display}"
🎮 GPU: ${gpu}
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
        laptopData?.product_name ||
          laptopData?.model_number ||
          laptopData?.model ||
          "",
      );
      if (!slug) return window.location.href;
      const path = `/laptops/${slug}`;
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

    const productId = laptopData?.id || laptopData?.model_number;

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
            product_type: "laptop",
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
      const productId = laptopData?.id || laptopData?.model_number;
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
  }, [laptopData?.id, laptopData?.model_number]);

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
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 shadow-none">
            <tbody className="bg-white">
              {displayEntries.map(([key, value], idx) => (
                <tr key={key} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-6 py-2 text-sm font-medium text-gray-600 w-1/3 align-top">
                    {toNormalCase(key)}
                  </td>
                  <td className="px-6 py-2 text-sm text-gray-900 w-2/3">
                    {toDisplayValue(value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {entries.length > limit && (
          <button
            onClick={() => setShowAllSpecs(!showAllSpecs)}
            className="w-full mt-4 py-2 text-purple-600 hover:text-purple-700 font-medium text-sm flex items-center justify-center gap-1 hover:bg-purple-50 rounded-lg transition-colors"
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

  const availableTabs = tabs.filter((tab) => hasSectionData(getSectionData(tab.id)));

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

    return (
      <div id="spec-specifications" className="space-y-6">
        <div className="bg-white overflow-hidden">
          <div className="divide-y divide-gray-100">
            {hasSectionData(sectionSpecifications) && (
              <div
                id="spec-specifications-main"
                className="px-1 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4"
              >
                <h4 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                  <FaMicrochip className="text-purple-500" />
                  Processor & Memory
                </h4>
                {renderSpecItems(sectionSpecifications)}
              </div>
            )}

            {hasSectionData(sectionDisplay) && (
              <div
                id="spec-display"
                className="px-1 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4"
              >
                <h4 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                  <FaExpand className="text-green-500" />
                  Display
                </h4>
                {renderSpecItems(sectionDisplay)}
              </div>
            )}

            {hasSectionData(sectionPerformance) && (
              <div
                id="spec-performance"
                className="px-1 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4"
              >
                <h4 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                  <FaBolt className="text-yellow-500" />
                  Performance
                </h4>
                {renderSpecItems(sectionPerformance)}
              </div>
            )}

            {hasSectionData(sectionBattery) && (
              <div
                id="spec-battery"
                className="px-1 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4"
              >
                <h4 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                  <FaBatteryFull className="text-blue-500" />
                  Battery
                </h4>
                {renderSpecItems(sectionBattery)}
              </div>
            )}

            {hasSectionData(sectionBuild) && (
              <div
                id="spec-build"
                className="px-1 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4"
              >
                <h4 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                  <FaShieldAlt className="text-indigo-500" />
                  Build & Design
                </h4>
                {renderSpecItems(sectionBuild)}
              </div>
            )}

            {hasSectionData(sectionConnectivity) && (
              <div
                id="spec-connectivity"
                className="px-1 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4"
              >
                <h4 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                  <FaUsb className="text-purple-500" />
                  Connectivity
                </h4>
                {renderSpecItems(sectionConnectivity)}
              </div>
            )}

            {hasSectionData(sectionSoftware) && (
              <div
                id="spec-software"
                className="px-1 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4"
              >
                <h4 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                  <FaWindows className="text-purple-500" />
                  Software & Warranty
                </h4>
                {renderSpecItems(sectionSoftware)}
              </div>
            )}
          </div>
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
            className="border-4 border-violet-500 border-t-blue-500"
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
      <div className="max-w-6xl mx-auto p-4">
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

  // Get OS icon based on operating system
  const getOSIcon = () => {
    const os = laptopData?.specifications?.operating_system || "";
    if (os.toLowerCase().includes("windows")) return FaWindows;
    if (os.toLowerCase().includes("mac")) return FaApple;
    if (os.toLowerCase().includes("linux")) return FaLinux;
    return FaDesktop;
  };

  const OSIcon = getOSIcon();
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
  const metaDescription = laptopMeta.description({
    name: metaBaseName,
    cpu: metaCpu,
    ram: metaRam,
    storage: metaStorage,
    brand: metaBrand,
  });
  const canonicalUrl = getCanonicalUrl();
  const metaImage = laptopData?.images?.[0] || null;

  return (
    <div className="px-2 lg:px-4 mx-auto max-w-6xl w-full bg-white">
      <Helmet>
        <title>{metaTitle}</title>
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
                X
              </button>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => {
                  const urlToShare = getCanonicalUrl();
                  const message = `${shareData.title}\n${shareData.text}\n\n${urlToShare}`;
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
                  const urlToShare = getCanonicalUrl();
                  const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                    urlToShare,
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
        <div className="p-4 bg-white border-b border-gray-200 lg:hidden">
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${currentColor.bg} text-white`}
                >
                  {laptopData.product_type}
                </span>
                {laptopData.release_year && (
                  <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
                    {laptopData.release_year}
                  </span>
                )}
              </div>
              <h1 className="text-xl font-extrabold tracking-tight mb-1 text-gray-900 leading-tight">
                {laptopData.product_name}
              </h1>
              <p className="text-purple-700 text-sm font-medium flex items-center gap-2">
                <span>{laptopData.brand}</span>
                {laptopData.series ? <span>{laptopData.series}</span> : null}
                {laptopData.model_number ? (
                  <span>| {laptopData.model_number}</span>
                ) : null}
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
            {currentVariant && (
              <span className="text-2xl font-bold text-green-600">
                ₹{formatPrice(currentVariant.base_price)}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row">
          {/* Images Section */}
          <div className="lg:w-1/2 p-4 border-b lg:border-b-0 lg:border-r border-indigo-200">
            {/* Main Image */}
            <div className="rounded-xl bg-gray-50 p-8 mb-6 relative">
              <div className="absolute top-3 left-3">
                <FaLaptop className={`text-2xl ${currentColor.text}`} />
              </div>
              <img
                src={
                  laptopData.images?.[activeImage] || "/placeholder-laptop.jpg"
                }
                alt={laptopData.product_name}
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
            {laptopData.images && laptopData.images.length > 1 && (
              <div className="flex gap-3 mb-6 overflow-x-auto no-scrollbar">
                {laptopData.images.slice(0, 4).map((image, index) => (
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
                      alt={`${laptopData.product_name} view ${index + 1}`}
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
                  Available Configurations
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
                        {variant.ram} / {variant.storage}
                      </div>
                      <div className="text-xs text-gray-600 mb-2">
                        {variant.processor}
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
              {laptopData.specifications &&
                [
                  {
                    key: "processor",
                    label: "Processor",
                    icon: FaMicrochip,
                    maxLength: 15,
                  },
                  { key: "ram", label: "RAM", icon: FaMemory },
                  { key: "storage", label: "Storage", icon: FaHdd },
                ].map((item) => {
                  const value = laptopData.specifications[item.key];
                  if (!value) return null;
                  let displayValue = value;
                  if (item.maxLength && value.length > item.maxLength) {
                    displayValue = value.substring(0, item.maxLength) + "...";
                  }
                  return (
                    <div
                      key={item.key}
                      className={`text-center p-3 rounded-lg ${currentColor.light}`}
                    >
                      <item.icon
                        className={`${currentColor.text} text-lg mx-auto mb-1`}
                      />
                      <div className={`font-bold ${currentColor.text} text-xs`}>
                        {displayValue}
                      </div>
                      <div className="text-xs text-gray-600">{item.label}</div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Details Section */}
          <div className="lg:w-1/2 p-4">
            {/* Desktop Header */}
            <div className="hidden lg:block mb-6">
              <div className="flex items-start justify-between mb-2">
                <div>
                <div className="flex items-center gap-3 mb-3">
                  <span
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold ${currentColor.bg} text-white`}
                  >
                    {laptopData.product_type}
                  </span>
                    {laptopData.release_year && (
                      <span className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm text-gray-700">
                        Launch: {laptopData.release_year}
                      </span>
                    )}
                    {laptopData.country && (
                      <span className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm text-gray-700">
                        Made in {laptopData.country}
                      </span>
                    )}
                  </div>
                  <h1 className="text-2xl font-extrabold tracking-tight mb-2">
                    {laptopData.product_name}
                  </h1>
                  <p className="text-purple-700 mb-3 font-medium text-sm flex items-center gap-2">
                    <span>{laptopData.brand}</span>
                    {laptopData.series ? <span>{laptopData.series}</span> : null}
                    {laptopData.model_number ? (
                      <span>| {laptopData.model_number}</span>
                    ) : null}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleFavorite}
                    className="p-2 rounded-full hover:bg-gray-100"
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
                    className="p-2 rounded-full hover:bg-gray-100 relative"
                    title="Share"
                  >
                    <FaShareAlt className="text-xl text-gray-600" />
                  </button>
                  <button
                    onClick={handleCopyLink}
                    className="p-2 rounded-full hover:bg-gray-100 relative"
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

              <div className="flex items-center gap-3 mb-6">
                {currentVariant && (
                  <div>
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
              <div className="mb-6 mt-6">
                <div className="flex items-center justify-between mb-4">
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

                <div className="space-y-3">
                  {displayedStores.map((store, index) => (
                    <div
                      key={store.id || index}
                      className="bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 transition-all duration-200"
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
            <div className="hidden lg:grid grid-cols-4 gap-4 mb-6">
              {laptopData.specifications &&
                [
                  {
                    key: "processor",
                    label: "Processor",
                    icon: FaMicrochip,
                    format: (v) => v.split(" ")[0] + " " + v.split(" ")[1],
                  },
                  {
                    key: "ram",
                    label: "RAM",
                    icon: FaMemory,
                    format: (v) => v,
                  },
                  {
                    key: "storage",
                    label: "Storage",
                    icon: FaHdd,
                    format: (v) => v.split(" ")[0],
                  },
                  {
                    key: "screen_size",
                    label: "Display",
                    icon: FaExpand,
                    format: (v) => v,
                  },
                ].map((item) => {
                  const value = laptopData.specifications[item.key];
                  if (!value) return null;
                  const displayValue = item.format ? item.format(value) : value;
                  return (
                    <div
                      key={item.key}
                      className={`text-center p-4 rounded-xl ${currentColor.light} border ${currentColor.border}`}
                    >
                      <item.icon
                        className={`${currentColor.text} text-xl mx-auto mb-2`}
                      />
                      <div className={`font-bold text-lg ${currentColor.text}`}>
                        {displayValue}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {item.label}
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* OS Badge */}
            {laptopData.specifications?.operating_system && (
              <div
                className={`hidden lg:flex items-center gap-2 mb-6 px-4 py-3 rounded-lg ${currentColor.light} border ${currentColor.border}`}
              >
                <OSIcon className={`${currentColor.text} text-xl`} />
                <div>
                  <div className="text-sm font-semibold text-gray-900">
                    {laptopData.specifications.operating_system}
                  </div>
                  <div className="text-xs text-gray-600">
                    Pre-installed Operating System
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tabs Section */}
        <div className="border-t border-indigo-200">
          <div className="flex overflow-x-auto no-scrollbar border-b border-indigo-200">
            {availableTabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors duration-200 flex-shrink-0 ${
                    activeTab === tab.id
                      ? "border-purple-500 text-purple-600 bg-purple-50"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <IconComponent className="text-sm" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="p-4">{renderTabContent()}</div>

        </div>
      </div>
    </div>
  );
};

export default LaptopDetailCard;
