// src/components/NetworkingDetailCard.jsx
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
  FaWifi,
  FaEthernet,
  FaServer,
  FaSignal,
  FaBroadcastTower,
  FaShieldAlt,
  FaPlug,
  FaBolt,
  FaWeight,
  FaRuler,
  FaThermometerHalf,
  FaLock,
  FaUsers,
  FaMicrochip,
  FaMemory,
  FaBatteryFull,
  FaChartBar,
  FaPlus,
  FaShareAlt,
  FaWhatsapp,
  FaFacebook,
  FaTwitter,
  FaEnvelope,
  FaLink,
  FaRegStar,
  FaStarHalfAlt,
  FaNetworkWired,
  FaSatelliteDish,
  FaRoute,
  FaFire,
  FaTachometerAlt,
  FaInfoCircle,
  FaGlobe,
  FaCogs,
  FaDesktop,
  FaMobile,
  FaGamepad,
  FaVideo,
  FaHome,
  FaBuilding,
} from "react-icons/fa";

import "../../styles/hideScrollbar.css";
import Spinner from "../ui/Spinner";
import { Helmet } from "react-helmet-async";
import { networkingMeta } from "../../constants/meta";
import RatingReview from "../ui/RatingReview";
import useStoreLogos from "../../hooks/useStoreLogos";

// Rating Input Component
const InlineRatingInput = ({
  value,
  onChange,
  size = "md",
  readOnly = false,
}) => {
  const sizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  };

  const handleClick = (rating) => {
    if (!readOnly && onChange) {
      onChange(rating);
    }
  };

  const renderStar = (position) => {
    const fullStar = value >= position;
    const halfStar = value >= position - 0.5 && value < position;

    if (fullStar) {
      return (
        <FaStar
          className={`${sizes[size]} cursor-pointer text-yellow-400 ${
            readOnly ? "" : "hover:text-yellow-500"
          }`}
          onClick={() => handleClick(position)}
        />
      );
    } else if (halfStar) {
      return (
        <FaStarHalfAlt
          className={`${sizes[size]} cursor-pointer text-yellow-400 ${
            readOnly ? "" : "hover:text-yellow-500"
          }`}
          onClick={() => handleClick(position)}
        />
      );
    } else {
      return (
        <FaRegStar
          className={`${sizes[size]} cursor-pointer text-gray-300 ${
            readOnly ? "" : "hover:text-yellow-300"
          }`}
          onClick={() => handleClick(position)}
        />
      );
    }
  };

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className="cursor-pointer">
          {renderStar(star)}
        </span>
      ))}
      {!readOnly && (
        <span className="ml-2 text-sm text-gray-600">{value.toFixed(1)}/5</span>
      )}
    </div>
  );
};

// Removed embedded mock data; API-provided `networking` data is used instead.

// Default ratings data

const NetworkingDetailCard = () => {
  const { getLogo } = useStoreLogos();
  const [activeTab, setActiveTab] = useState("wireless");
  const [activeImage, setActiveImage] = useState(0);
  const [showAllSpecs, setShowAllSpecs] = useState(false);
  const [showAllStores, setShowAllStores] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [copied, setCopied] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [ratingsData, setRatingsData] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 0,
    performance: 0,
    coverage: 0,
    reliability: 0,
    features: 0,
    ease_of_use: 0,
  });

  const [loading, setLoading] = useState(false);
  const [deviceData, setDeviceData] = useState(null);
  const navigate = useNavigate();

  // Read URL and route params (SEO-friendly) and prefer API-provided data from `useDevice()`
  const params = useParams();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const brandParam = query.get("brand");
  const modelParam = query.get("model") || query.get("modelNumber");
  const variantIdParam = query.get("variantId");
  const storeNameParam = query.get("storeName") || query.get("store");
  const deviceTypeParam = query.get("deviceType") || query.get("category");
  let idParam = query.get("id");

  // Extract slug from route params (SEO-friendly slug-based URL)
  const routeSlug = params.slug || null;

  // Convert slug to searchable model name
  const modelFromSlug = routeSlug ? extractNameFromSlug(routeSlug) : null;
  const searchModel = modelParam || modelFromSlug;

  const { networking, networkingLoading, refreshNetworking } = useDevice();

  // Normalize device data to ensure consistent field names
  const normalizeDevice = (device) => {
    if (!device) return device;

    const rawVariants = Array.isArray(device.variants)
      ? device.variants
      : device.variant
        ? Array.isArray(device.variant)
          ? device.variant
          : [device.variant]
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
        : [];

      return {
        ...v,
        id: v.id || v.variant_id || v.variantId || null,
        variant_id: v.variant_id || v.id || v.variantId || null,
        base_price: v.base_price ?? v.price ?? v.mrp ?? null,
        store_prices: storePrices,
        specification_summary: v.specification_summary || "",
      };
    });

    const specifications = {
      device_type: device.device_type || device.deviceType || "",
      wifi_standard: device.wireless?.wifi_standard || "",
      total_speed: device.wireless?.total_speed || "",
      coverage_area: device.wireless?.coverage_area || "",
      bands: device.wireless?.bands || "",
      ethernet: device.ports?.ethernet || device.ports?.ethernet_type || "",
      lan_ports: device.ports?.lan_ports || "",
      wan_ports: device.ports?.wan_ports || "",
      usb_ports: device.ports?.usb_ports || "",
      rating: device.rating || 0,
      ...device.specifications,
      ...device.specs,
    };

    // Provide top-level convenience objects used throughout the UI
    const wireless = {
      wifi_standard:
        specifications.wifi_standard || device.wireless?.wifi_standard || "",
      total_speed:
        specifications.total_speed || device.wireless?.total_speed || "",
      coverage_area:
        specifications.coverage_area || device.wireless?.coverage_area || "",
      bands: specifications.bands || device.wireless?.bands || "",
      ...device.wireless,
    };

    const ports = {
      ethernet:
        specifications.ethernet ||
        device.ports?.ethernet ||
        device.ports?.ethernet_type ||
        "",
      lan_ports: specifications.lan_ports || device.ports?.lan_ports || "",
      wan_ports: specifications.wan_ports || device.ports?.wan_ports || "",
      usb_ports: specifications.usb_ports || device.ports?.usb_ports || "",
      ...device.ports,
    };

    return {
      ...device,
      product_name: device.product_name || device.name || device.model || "",
      model_number: device.model_number || device.model || device.sku || "",
      brand: device.brand || device.brand_name || device.manufacturer || "",
      device_type: device.device_type || device.deviceType || "",
      variants,
      specifications,
      wireless,
      ports,
      images: device.images || device.pictures || [],
    };
  };

  // Helper function to find networking device by slug locally
  const findNetworkingBySlug = (slug) => {
    if (!slug || !Array.isArray(networking)) return null;
    const searchSlug = generateSlug(slug);
    return networking.find(
      (d) =>
        generateSlug(d.product_name || d.name || d.model || "") ===
          searchSlug || generateSlug(d.model_number || "") === searchSlug,
    );
  };

  useEffect(() => {
    setLoading(true);

    const timer = setTimeout(() => {
      let selectedDevice = null;
      let variantIndex = 0;

      const source = Array.isArray(networking) ? networking : [];

      // 0) Try to find by slug first (for direct slug-based URL access)
      if (!selectedDevice && routeSlug && Array.isArray(source)) {
        selectedDevice = findNetworkingBySlug(routeSlug);
      }

      // 1) If variantId provided, prefer matching variant in API data
      if (variantIdParam && Array.isArray(source) && source.length) {
        for (const dev of source) {
          const variants = Array.isArray(dev.variants) ? dev.variants : [];
          const idx = variants.findIndex(
            (v) =>
              String(v.id) === variantIdParam ||
              String(v.variant_id) === variantIdParam,
          );
          if (idx >= 0) {
            selectedDevice = dev;
            variantIndex = idx;
            break;
          }
        }
      }

      // 2) Match by brand + model (prefer product_name, then model_number)
      if (
        !selectedDevice &&
        brandParam &&
        modelParam &&
        Array.isArray(source)
      ) {
        const b = brandParam.toLowerCase();
        const m = modelParam.toLowerCase();
        for (const dev of source) {
          const brandVal = (dev.brand || dev.brand_name || "")
            .toString()
            .toLowerCase();
          const productName = (dev.product_name || dev.name || "")
            .toString()
            .toLowerCase();
          const modelNum = (dev.model_number || dev.model || "")
            .toString()
            .toLowerCase();

          const brandMatch = brandVal === b;
          const nameMatch = productName.includes(m) || productName === m;
          const modelMatch = modelNum.includes(m) || modelNum === m;

          if (brandMatch && (nameMatch || modelMatch)) {
            selectedDevice = dev;
            break;
          }
        }
      }

      // 3) Match by brand only
      if (!selectedDevice && brandParam && Array.isArray(source)) {
        const b = brandParam.toLowerCase();
        for (const dev of source) {
          const brandVal = (dev.brand || dev.brand_name || "")
            .toString()
            .toLowerCase();
          if (brandVal === b) {
            selectedDevice = dev;
            break;
          }
        }
      }

      // 4) Match by id param (fallback) or deviceType/category
      if (!selectedDevice && Array.isArray(source) && source.length) {
        if (idParam) {
          selectedDevice = source.find(
            (d) =>
              String(d.id) === String(idParam) ||
              String(d.product_id) === String(idParam),
          );
        }
        if (!selectedDevice && deviceTypeParam) {
          selectedDevice = source.find(
            (d) =>
              (d.device_type || d.deviceType || "").toString().toLowerCase() ===
              deviceTypeParam.toLowerCase(),
          );
        }
        if (!selectedDevice) selectedDevice = source[0] || null;
      }

      // If a storeName param exists, try to set selectedVariant to variant that contains that store
      if (selectedDevice && storeNameParam) {
        const variants = Array.isArray(selectedDevice.variants)
          ? selectedDevice.variants
          : [];
        for (let i = 0; i < variants.length; i++) {
          const v = variants[i];
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

      setDeviceData(normalizeDevice(selectedDevice));
      setSelectedVariant(Math.max(0, variantIndex));
      setLoading(false);
    }, 250);

    return () => clearTimeout(timer);
  }, [window.location.search, networking]);

  // Redirect to canonical SEO-friendly networking URL when data is available
  useEffect(() => {
    if (!deviceData || !routeSlug) return;

    const canonicalSlug = generateSlug(
      deviceData.name || deviceData.model || deviceData.brand || "",
    );
    if (!canonicalSlug) return;
    const desiredPath = `/networking/${canonicalSlug}`;
    const currentPath = window.location.pathname;
    if (currentPath !== desiredPath) {
      navigate(desiredPath + (location.search || ""), { replace: true });
    }
  }, [deviceData, routeSlug, navigate, location.search]);

  // Record a single product view per browser session for networking devices.
  useEffect(() => {
    const productIdRaw =
      deviceData?.product_id || deviceData?.productId || deviceData?.id;
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
  }, [deviceData?.product_id, deviceData?.productId, deviceData?.id]);

  // Get device type color
  const getDeviceColor = () => {
    switch (deviceData?.device_type?.toLowerCase()) {
      case "wi-fi router":
      case "router":
        return "blue";
      case "network switch":
      case "switch":
        return "green";
      case "range extender":
      case "access point":
        return "orange";
      case "firewall/router":
      case "firewall":
        return "red";
      case "modem":
        return "purple";
      case "network cable":
        return "gray";
      default:
        return "indigo";
    }
  };

  const deviceColor = getDeviceColor();
  const colorClasses = {
    blue: {
      bg: "bg-blue-500",
      text: "text-blue-500",
      light: "bg-blue-50",
      border: "border-blue-500",
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
    red: {
      bg: "bg-red-500",
      text: "text-red-500",
      light: "bg-red-50",
      border: "border-red-500",
    },
    purple: {
      bg: "bg-purple-500",
      text: "text-purple-500",
      light: "bg-purple-50",
      border: "border-purple-500",
    },
    gray: {
      bg: "bg-gray-500",
      text: "text-gray-500",
      light: "bg-gray-50",
      border: "border-gray-500",
    },
    indigo: {
      bg: "bg-indigo-500",
      text: "text-indigo-500",
      light: "bg-indigo-50",
      border: "border-indigo-500",
    },
  };

  const currentColor = colorClasses[deviceColor] || colorClasses.blue;

  const variants = deviceData?.variants || [];
  const currentVariant = variants?.[selectedVariant];

  const allStorePrices =
    variants?.flatMap(
      (variant) =>
        variant.store_prices?.map((store) => ({
          ...store,
          variantName: variant.specification_summary || "",
        })) || [],
    ) || [];

  const variantStorePrices =
    currentVariant?.store_prices?.map((sp) => ({
      ...sp,
      variantName: currentVariant.specification_summary || "",
    })) || [];

  const getStoreLogo = (storeName) => getLogo(storeName);

  const formatPrice = (price) => {
    if (price == null || price === "") return "N/A";
    return new Intl.NumberFormat("en-IN").format(price);
  };

  const toNormalCase = (raw) => {
    if (raw == null) return "";
    const ACRONYMS = new Set([
      "Mbps",
      "Gbps",
      "GHz",
      "MHz",
      "W",
      "V",
      "A",
      "AC",
      "DC",
      "LAN",
      "WAN",
      "USB",
      "SFP",
      "RJ45",
      "POE",
      "VPN",
      "PPTP",
      "L2TP",
      "IPS",
      "IDS",
      "QoS",
      "SSID",
      "MU-MIMO",
      "OFDMA",
      "WPA2",
      "WPA3",
      "NAT",
      "DMZ",
      "UPnP",
      "DDNS",
      "MAC",
      "IPv4",
      "IPv6",
      "TCP",
      "UDP",
      "HTTP",
      "HTTPS",
      "SSL",
      "TLS",
      "RADIUS",
      "DNS",
      "DHCP",
      "NTP",
      "SNMP",
      "VLAN",
      "802.11ax",
      "802.11ac",
      "802.11n",
      "802.11b/g",
      "Wi-Fi",
      "LED",
      "RAM",
      "CPU",
      "GB",
      "MB",
      "KB",
      "mm",
      "cm",
      "kg",
      "dBm",
      "dBi",
      "FTP",
      "SFTP",
      "SSH",
      "Telnet",
      "GUI",
      "CLI",
      "API",
      "JSON",
      "XML",
      "HTML",
      "CSS",
      "JavaScript",
      "PHP",
      "Python",
      "Java",
      "C++",
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
    title: `${deviceData?.brand} ${deviceData?.product_name}`,
    text: `Check out ${deviceData?.brand} ${deviceData?.product_name} - ${
      deviceData?.device_type
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
      deviceData?.brand || deviceData?.manufacturer || "Networking Device";
    const model = deviceData?.product_name || deviceData?.model || "Unknown";
    const deviceType =
      deviceData?.device_type ||
      deviceData?.type ||
      deviceData?.product_type ||
      "Device";
    const wifiStandard =
      deviceData?.specifications?.wifi_standard ||
      deviceData?.wifi_standard ||
      deviceData?.specs?.wifi_standard ||
      "WiFi Standard info not available";
    const speed =
      deviceData?.specifications?.total_speed ||
      deviceData?.speed ||
      deviceData?.specs?.speed ||
      "Speed info not available";
    const coverage =
      deviceData?.specifications?.coverage_area ||
      deviceData?.coverage_area ||
      deviceData?.specs?.coverage ||
      "Coverage area info not available";
    const price = currentVariant?.base_price
      ? `₹${formatPrice(currentVariant.base_price)}`
      : "Price not available";
    const rating = deviceData?.rating || ratingsData?.averageRating || 0;

    return {
      title: `${brand} ${model}`,
      description: `${deviceType} | WiFi: ${wifiStandard} | Speed: ${speed} | Coverage: ${coverage} | Rating: ${rating}/5 | Price: ${price}`,
      shortDescription: `${brand} ${model} - ${deviceType}, ${wifiStandard}, Price: ${price}`,
      fullDetails: `
📡 ${brand} ${model}
🔌 Type: ${deviceType}
📶 WiFi Standard: ${wifiStandard}
⚡ Speed: ${speed}
📍 Coverage Area: ${coverage}
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
      const slug = generateSlug(deviceData?.name || deviceData?.model || "");
      if (!slug) return window.location.href;
      const path = `/networking/${slug}`;
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

    const productId = deviceData?.id || deviceData?.model_number;

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
            product_type: "networking",
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
      const productId = deviceData?.id || deviceData?.model_number;
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
  }, [deviceData?.id, deviceData?.model_number]);

  const handleRatingChange = (category, value) => {
    const updatedReview = { ...newReview, [category]: value };

    if (category !== "rating") {
      const categories = [
        "performance",
        "coverage",
        "reliability",
        "features",
        "ease_of_use",
      ];
      const sum = categories.reduce(
        (total, cat) => total + (updatedReview[cat] || 0),
        0,
      );
      updatedReview.rating = parseFloat((sum / categories.length).toFixed(1));
    }

    setNewReview(updatedReview);
  };

  const submitReview = () => {
    if (ratingsData) {
      const prev = ratingsData;
      const oldTotal = Number(prev.totalRatings) || 0;
      const newTotal = oldTotal + 1;

      const newPerformance =
        oldTotal > 0
          ? parseFloat(
              (
                (Number(prev.performance || 0) * oldTotal +
                  newReview.performance) /
                newTotal
              ).toFixed(1),
            )
          : newReview.performance;
      const newCoverage =
        oldTotal > 0
          ? parseFloat(
              (
                (Number(prev.coverage || 0) * oldTotal + newReview.coverage) /
                newTotal
              ).toFixed(1),
            )
          : newReview.coverage;
      const newReliability =
        oldTotal > 0
          ? parseFloat(
              (
                (Number(prev.reliability || 0) * oldTotal +
                  newReview.reliability) /
                newTotal
              ).toFixed(1),
            )
          : newReview.reliability;
      const newFeatures =
        oldTotal > 0
          ? parseFloat(
              (
                (Number(prev.features || 0) * oldTotal + newReview.features) /
                newTotal
              ).toFixed(1),
            )
          : newReview.features;
      const newEaseOfUse =
        oldTotal > 0
          ? parseFloat(
              (
                (Number(prev.ease_of_use || 0) * oldTotal +
                  newReview.ease_of_use) /
                newTotal
              ).toFixed(1),
            )
          : newReview.ease_of_use;

      const newAverage = parseFloat(
        (
          (newPerformance +
            newCoverage +
            newReliability +
            newFeatures +
            newEaseOfUse) /
          5
        ).toFixed(1),
      );

      setRatingsData({
        averageRating: newAverage,
        totalRatings: newTotal,
        performance: newPerformance,
        coverage: newCoverage,
        reliability: newReliability,
        features: newFeatures,
        ease_of_use: newEaseOfUse,
      });
    }

    setNewReview({
      rating: 0,
      performance: 0,
      coverage: 0,
      reliability: 0,
      features: 0,
      ease_of_use: 0,
    });
    setShowReviewForm(false);

    alert("Thank you for your rating! Your feedback has been recorded.");
  };

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

  // Ratings summary removed

  // Get device type icon
  const getDeviceIcon = () => {
    switch (deviceData?.device_type?.toLowerCase()) {
      case "wi-fi router":
      case "router":
        return FaWifi;
      case "network switch":
      case "switch":
        return FaNetworkWired;
      case "range extender":
      case "access point":
        return FaBroadcastTower;
      case "firewall/router":
      case "firewall":
        return FaFire;
      case "modem":
        return FaSatelliteDish;
      case "network cable":
        return FaNetworkWired;
      default:
        return FaServer;
    }
  };

  const DeviceIcon = getDeviceIcon();

  // Tabs configuration based on device type
  const getTabsForDevice = () => {
    const baseTabs = [
      { id: "overview", label: "Overview", icon: FaInfoCircle },
      { id: "wireless", label: "Wireless", icon: FaWifi },
      { id: "ports", label: "Ports", icon: FaEthernet },
      { id: "performance", label: "Performance", icon: FaTachometerAlt },
      { id: "security", label: "Security", icon: FaShieldAlt },
      { id: "physical", label: "Physical", icon: FaRuler },
    ];

    // Filter tabs based on device type
    const deviceType = deviceData?.device_type?.toLowerCase() || "";

    if (deviceType.includes("router") || deviceType.includes("firewall")) {
      return baseTabs;
    } else if (deviceType.includes("switch")) {
      return baseTabs.filter((tab) =>
        ["overview", "ports", "performance", "physical"].includes(tab.id),
      );
    } else if (
      deviceType.includes("extender") ||
      deviceType.includes("access point")
    ) {
      return baseTabs.filter((tab) =>
        ["overview", "wireless", "ports", "performance", "physical"].includes(
          tab.id,
        ),
      );
    } else if (deviceType.includes("modem")) {
      return baseTabs.filter((tab) =>
        ["overview", "ports", "performance", "physical"].includes(tab.id),
      );
    }

    return baseTabs;
  };

  const tabs = getTabsForDevice();

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
    if (!deviceData) return null;

    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-6">
            <div className=" rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <DeviceIcon className={currentColor.text} />
                Device Overview
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-700 font-medium">Brand</span>
                  <span className="text-gray-900 font-semibold">
                    {deviceData.brand}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-700 font-medium">Model</span>
                  <span className="text-gray-900 font-semibold">
                    {deviceData.model_number}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-700 font-medium">Device Type</span>
                  <span className="text-gray-900 font-semibold">
                    {deviceData.device_type}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-700 font-medium">
                    Release Year
                  </span>
                  <span className="text-gray-900 font-semibold">
                    {deviceData.release_year}
                  </span>
                </div>
                {deviceData.country && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-700 font-medium">
                      Country of Origin
                    </span>
                    <span className="text-gray-900 font-semibold">
                      {deviceData.country}
                    </span>
                  </div>
                )}
                {deviceData.description && (
                  <div className="pt-4">
                    <h4 className="text-md font-semibold text-gray-900 mb-2">
                      Description
                    </h4>
                    <p className="text-gray-700">{deviceData.description}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Key Features */}
            {deviceData.features && (
              <div className="bg-white  p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <FaCogs className={currentColor.text} />
                  Key Features
                </h3>
                {renderSpecItems(deviceData.features)}
              </div>
            )}
          </div>
        );

      case "wireless":
        return deviceData.wireless ? (
          <div className="bg-white rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <FaWifi className={currentColor.text} />
              Wireless Specifications
            </h3>
            {renderSpecItems(deviceData.wireless)}
          </div>
        ) : (
          <div className="bg-white rounded-lg p-6">
            <div className="text-center py-12 text-gray-500">
              <FaWifi className="text-4xl mx-auto mb-4 text-gray-300" />
              <p>No wireless specifications available for this device</p>
            </div>
          </div>
        );

      case "ports":
        return deviceData.ports || deviceData.hardware ? (
          <div className="space-y-6">
            {deviceData.ports && (
              <div className="bg-white rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <FaEthernet className={currentColor.text} />
                  Ports & Connectivity
                </h3>
                {renderSpecItems(deviceData.ports)}
              </div>
            )}
            {deviceData.hardware && (
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <FaMicrochip className={currentColor.text} />
                  Hardware Specifications
                </h3>
                {renderSpecItems(deviceData.hardware)}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="text-center py-12 text-gray-500">
              <FaEthernet className="text-4xl mx-auto mb-4 text-gray-300" />
              <p>No port specifications available for this device</p>
            </div>
          </div>
        );

      case "performance":
        return deviceData.performance ? (
          <div className="bg-white rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <FaTachometerAlt className={currentColor.text} />
              Performance & Specifications
            </h3>
            {renderSpecItems(deviceData.performance)}
          </div>
        ) : (
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="text-center py-12 text-gray-500">
              <FaTachometerAlt className="text-4xl mx-auto mb-4 text-gray-300" />
              <p>No performance specifications available for this device</p>
            </div>
          </div>
        );

      case "security":
        return deviceData.security ? (
          <div className="bg-white rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <FaShieldAlt className={currentColor.text} />
              Security & Management
            </h3>
            {renderSpecItems(deviceData.security)}
          </div>
        ) : (
          <div className="bg-white rounded-lg p-6">
            <div className="text-center py-12 text-gray-500">
              <FaShieldAlt className="text-4xl mx-auto mb-4 text-gray-300" />
              <p>No security specifications available for this device</p>
            </div>
          </div>
        );

      case "physical":
        return deviceData.physical || deviceData.power ? (
          <div className="space-y-6">
            {deviceData.physical && (
              <div className="bg-white rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <FaRuler className={currentColor.text} />
                  Physical Specifications
                </h3>
                {renderSpecItems(deviceData.physical)}
              </div>
            )}
            {deviceData.power && (
              <div className="bg-white rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <FaPlug className={currentColor.text} />
                  Power Specifications
                </h3>
                {renderSpecItems(deviceData.power)}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg p-6">
            <div className="text-center py-12 text-gray-500">
              <FaRuler className="text-4xl mx-auto mb-4 text-gray-300" />
              <p>No physical specifications available for this device</p>
            </div>
          </div>
        );

      default:
        return (
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="text-center py-12 text-gray-500">
              <DeviceIcon className="text-4xl mx-auto mb-4 text-gray-300" />
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
            Loading Device Details...
          </p>
        </div>
      </div>
    );
  }

  if (!loading && !deviceData) {
    return (
      <div className="max-w-8xl mx-auto p-4">
        <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
          <div className="text-gray-400 text-6xl mb-4">🌐</div>
          <h3 className="text-2xl font-semibold text-gray-900 mb-3">
            Device Not Found
          </h3>
          <p className="text-gray-600">
            The requested networking device could not be found.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-8xl mx-auto bg-white">
      {/* SEO Helmet */}
      <Helmet>
        <title>
          {networkingMeta.title({
            name: deviceData?.name || deviceData?.model || "",
            deviceType:
              deviceData?.device_type ||
              deviceData?.deviceType ||
              deviceData?.product_type ||
              "",
          })}
        </title>
        <meta
          name="description"
          content={networkingMeta.description({
            name: deviceData?.name || deviceData?.model || "",
            deviceType:
              deviceData?.device_type ||
              deviceData?.deviceType ||
              deviceData?.product_type ||
              "",
            brand: deviceData?.brand || deviceData?.brand_name || "",
          })}
        />
      </Helmet>
      {/* Share Menu Modal */}
      {showShareMenu && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Share Device
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

      <div className=" overflow-hidden ">
        {/* Mobile Header */}
        <div className="p-5 border-b border-gray-200 lg:hidden">
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${currentColor.bg} text-white`}
                >
                  {deviceData.device_type}
                </span>
                {deviceData.release_year && (
                  <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
                    {deviceData.release_year}
                  </span>
                )}
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-1">
                {deviceData.product_name} hi
              </h1>
              <p className="text-gray-600 text-sm">
                {deviceData.brand} • {deviceData.model_number}
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

        <div className="flex flex-col lg:flex-row ">
          {/* Images Section */}
          <div className="lg:w-2/5 p-5 border-b  lg:border-b-0 lg:border-r border-gray-200">
            {/* Main Image */}
            <div className="rounded-xl  p-8 mb-6 relative  border border-gray-200">
              <div className="absolute top-3 left-3">
                <DeviceIcon className={`text-2xl ${currentColor.text}`} />
              </div>
              <img
                src={
                  deviceData.images?.[activeImage] ||
                  "/placeholder-networking.jpg"
                }
                alt={deviceData.product_name}
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
            {deviceData.images && deviceData.images.length > 1 && (
              <div className="flex gap-3 mb-8 overflow-x-auto no-scrollbar">
                {deviceData.images.slice(0, 4).map((image, index) => (
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
                      alt={`${deviceData.product_name} view ${index + 1}`}
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
                        {variant.color || variant.region || "Standard"}
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
              {deviceData.wireless?.total_speed && (
                <div
                  className={`text-center p-3 rounded-lg ${currentColor.light}`}
                >
                  <FaWifi
                    className={`${currentColor.text} text-lg mx-auto mb-1`}
                  />
                  <div className={`font-bold ${currentColor.text} text-sm`}>
                    {deviceData.wireless.total_speed}
                  </div>
                  <div className="text-xs text-gray-600">Wi-Fi Speed</div>
                </div>
              )}
              {deviceData.ports?.lan_ports && (
                <div
                  className={`text-center p-3 rounded-lg ${currentColor.light}`}
                >
                  <FaEthernet
                    className={`${currentColor.text} text-lg mx-auto mb-1`}
                  />
                  <div className={`font-bold ${currentColor.text} text-sm`}>
                    {deviceData.ports.lan_ports.split("x")[0].trim()} Ports
                  </div>
                  <div className="text-xs text-gray-600">LAN Ports</div>
                </div>
              )}
              {deviceData.wireless?.coverage_area && (
                <div
                  className={`text-center p-3 rounded-lg ${currentColor.light}`}
                >
                  <FaSignal
                    className={`${currentColor.text} text-lg mx-auto mb-1`}
                  />
                  <div className={`font-bold ${currentColor.text} text-sm`}>
                    {deviceData.wireless.coverage_area.split(" ")[2] || "N/A"}
                  </div>
                  <div className="text-xs text-gray-600">Coverage</div>
                </div>
              )}
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
                      {deviceData.device_type}
                    </span>
                    {deviceData.release_year && (
                      <span className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm text-gray-700">
                        Launch: {deviceData.release_year}
                      </span>
                    )}
                    {deviceData.country && (
                      <span className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm text-gray-700">
                        Made in {deviceData.country}
                      </span>
                    )}
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {deviceData.product_name}
                  </h1>
                  <p className="text-gray-600 text-lg mb-4">
                    {deviceData.brand} • Model: {deviceData.model_number}
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
                              src={getLogo(store.store_name)}
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
                              {store.variantName}
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
              {deviceData.wireless?.total_speed && (
                <div
                  className={`text-center p-4 rounded-xl ${currentColor.light} border ${currentColor.border}`}
                >
                  <FaWifi
                    className={`${currentColor.text} text-xl mx-auto mb-2`}
                  />
                  <div className={`font-bold text-lg ${currentColor.text}`}>
                    {deviceData.wireless.total_speed}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Wi-Fi Speed</div>
                </div>
              )}
              {deviceData.wireless?.wifi_standard && (
                <div
                  className={`text-center p-4 rounded-xl ${currentColor.light} border ${currentColor.border}`}
                >
                  <FaSignal
                    className={`${currentColor.text} text-xl mx-auto mb-2`}
                  />
                  <div className={`font-bold text-lg ${currentColor.text}`}>
                    {deviceData.wireless.wifi_standard}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Wi-Fi Standard
                  </div>
                </div>
              )}
              {deviceData.ports?.lan_ports && (
                <div
                  className={`text-center p-4 rounded-xl ${currentColor.light} border ${currentColor.border}`}
                >
                  <FaEthernet
                    className={`${currentColor.text} text-xl mx-auto mb-2`}
                  />
                  <div className={`font-bold text-lg ${currentColor.text}`}>
                    {deviceData.ports.lan_ports.split("x")[0].trim()} Ports
                  </div>
                  <div className="text-sm text-gray-600 mt-1">LAN Ports</div>
                </div>
              )}
              {deviceData.wireless?.coverage_area && (
                <div
                  className={`text-center p-4 rounded-xl ${currentColor.light} border ${currentColor.border}`}
                >
                  <FaBroadcastTower
                    className={`${currentColor.text} text-xl mx-auto mb-2`}
                  />
                  <div className={`font-bold text-lg ${currentColor.text}`}>
                    {deviceData.wireless.coverage_area.split(" ")[2] || "N/A"}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Coverage</div>
                </div>
              )}
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
              productId={deviceData?.id || deviceData?.product_id}
              productName={deviceData?.model_number}
              brand={deviceData?.brand}
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

export default NetworkingDetailCard;
