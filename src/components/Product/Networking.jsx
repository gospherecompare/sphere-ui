// src/components/NetworkingList.jsx
import React, { useState, useEffect, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import {
  FaStar,
  FaWifi,
  FaFilter,
  FaTimes,
  FaSearch,
  FaStore,
  FaMoneyBill,
  FaSort,
  FaEye,
  FaCalendarAlt,
  FaInfoCircle,
  FaExternalLinkAlt,
  FaSignal,
  FaEthernet,
  FaBroadcastTower,
  FaPlug,
  FaShieldAlt,
  FaUsers,
  FaHome,
  FaServer,
  FaBolt,
  FaTag,
  FaWeightHanging,
  FaRuler,
  FaWifi as FaWifiSolid,
  FaEthernet as FaEthernetSolid,
  FaExchangeAlt,
} from "react-icons/fa";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import {} from "../../store/deviceSlice";
import useStoreLogos from "../../hooks/useStoreLogos";
import Spinner from "../ui/Spinner";
import useTitle from "../../hooks/useTitle";
import { generateSlug } from "../../utils/slugGenerator";
import useDevice from "../../hooks/useDevice";
import Breadcrumbs from "../Breadcrumbs";

// Enhanced Image Carousel
const ImageCarousel = ({ images = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setCurrentIndex(0);
  }, [images]);

  const handleNext = (e) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrev = (e) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (!images || images.length === 0) {
    return (
      <div className="relative w-full h-full flex items-center justify-center rounded-lg bg-gray-100">
        <div className="text-center px-3">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-gray-200">
            <FaWifi className="text-gray-400 text-sm" />
          </div>
          <span className="text-xs text-gray-500">No image</span>
        </div>
      </div>
    );
  }

  if (images.length === 1) {
    return (
      <div className="relative w-full h-full">
        <img
          src={images[0]}
          alt="product"
          className="w-full h-full object-contain rounded-lg"
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full group">
      <div className="w-full h-full flex items-center justify-center">
        <img
          src={images[currentIndex]}
          alt={`product-view-${currentIndex + 1}`}
          className="w-auto h-auto max-w-full max-h-full object-contain rounded-lg"
          loading="lazy"
        />
      </div>

      <div className="absolute inset-0 flex items-center justify-between p-1 pointer-events-none">
        <button
          onClick={handlePrev}
          className="pointer-events-auto opacity-0 group-hover:opacity-100 md:opacity-100 bg-black/30 hover:bg-black/50 text-white p-1.5 rounded-full transition-all duration-200 transform -translate-x-1"
          aria-label="Previous image"
        >
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <button
          onClick={handleNext}
          className="pointer-events-auto opacity-0 group-hover:opacity-100 md:opacity-100 bg-black/30 hover:bg-black/50 text-white p-1.5 rounded-full transition-all duration-200 transform translate-x-1"
          aria-label="Next image"
        >
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

// Data will be loaded from the API endpoint `GET /api/networking`.
// The local mock array was removed to use live API data instead.
const mockNetworkingDevices = [];

const Networking = () => {
  const animationStyles = `
    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(100%);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    .animate-slide-up {
      animation: slideUp 0.3s ease-out forwards;
    }
    .smooth-transition {
      transition: all 0.3s ease-in-out;
    }
    .fade-in-up {
      animation: slideUp 0.5s ease-out forwards;
    }
  `;

  const { getLogo } = useStoreLogos();
  // Helper function to extract numeric price
  const extractNumericPrice = (price) => {
    if (!price || price === "NaN") return 0;
    const numeric = parseInt(String(price).replace(/[^0-9]/g, ""));
    return isNaN(numeric) ? 0 : numeric;
  };

  // Helper function to format price display
  const formatPriceDisplay = (price) => {
    if (!price || price === "NaN") return "Price not available";
    if (typeof price === "string" && price.includes(",")) return `₹${price}`;
    const numeric = extractNumericPrice(price);
    return numeric > 0
      ? `₹ ${numeric.toLocaleString()}`
      : "Price not available";
  };

  // Helper to extract numeric speed from string like "5400 Mbps"
  const extractSpeedValue = (speedStr) => {
    if (!speedStr) return 0;
    const match = speedStr.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  };

  // Helper to extract numeric coverage from string like "3000 sq ft"
  const extractCoverageValue = (coverageStr) => {
    if (!coverageStr) return 0;
    const match = coverageStr.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  };

  // Helper to extract numeric weight
  const extractWeight = (weightStr) => {
    if (!weightStr) return 0;
    const match = weightStr.match(/(\d+(\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
  };

  // Helper to get device type icon
  const getDeviceTypeIcon = (deviceType) => {
    switch (deviceType?.toLowerCase()) {
      case "router":
        return FaWifiSolid;
      case "modem":
        return FaBroadcastTower;
      case "switch":
        return FaServer;
      case "mesh":
        return FaUsers;
      case "extender":
        return FaSignal;
      default:
        return FaWifi;
    }
  };

  // Map API response to device format
  const mapApiToDevice = (apiDevice, idx) => {
    const images = apiDevice.images || [];
    const variants = Array.isArray(apiDevice.variants)
      ? apiDevice.variants
      : [];

    // Aggregate store prices from variants
    let storePrices = [];
    if (variants.length > 0) {
      storePrices = variants.flatMap((v) => {
        const prices = Array.isArray(v.store_prices)
          ? v.store_prices.map((sp) => ({
              id: sp.id,
              variant_id: v.variant_id,
              store: sp.store_name || sp.store || "Store",
              price: sp.price,
              url: sp.url,
              offer_text: sp.offer_text,
              delivery_info: sp.delivery_info,
            }))
          : [];
        if (prices.length === 0 && v.base_price) {
          return [
            {
              id: `v-${v.variant_id || "unknown"}`,
              variant_id: v.variant_id,
              store: "Base Price",
              price: v.base_price,
            },
          ];
        }
        return prices;
      });
    }

    // Compute numeric price
    let numericPrice = 0;
    if (variants.length > 0) {
      const allPrices = variants
        .flatMap((v) => {
          const base = v.base_price || 0;
          const storePrices = Array.isArray(v.store_prices)
            ? v.store_prices.map((sp) => sp.price).filter(Boolean)
            : [];
          return [base, ...storePrices];
        })
        .map((p) => extractNumericPrice(p))
        .filter((p) => p > 0);

      numericPrice = allPrices.length > 0 ? Math.min(...allPrices) : 0;
    }

    // Extract specs
    const wifiSpeed = extractSpeedValue(
      apiDevice.specifications?.wifi_speed || "",
    );
    const coverage = extractCoverageValue(
      apiDevice.performance?.coverage || "",
    );
    const weight = extractWeight(apiDevice.physical_details?.weight || "");

    const totalPorts = apiDevice.specifications?.ports
      ? (apiDevice.specifications.ports.lan || 0) +
        (apiDevice.specifications.ports.wan || 0)
      : 0;

    return {
      id: apiDevice.product_id || idx + 1,
      productId: apiDevice.product_id || apiDevice.id || idx + 1,
      productType: "networking",
      name: apiDevice.name || apiDevice.model || "",
      brand: apiDevice.brand_name || "",
      deviceType: apiDevice.device_type || "",
      model: apiDevice.model_number || "",
      price:
        numericPrice > 0
          ? `₹${numericPrice.toLocaleString()}`
          : "Price not available",
      numericPrice,
      rating: parseFloat(apiDevice.rating) || 0,
      reviews: apiDevice.reviews_count
        ? `${apiDevice.reviews_count} reviews`
        : apiDevice.rating
          ? "No reviews yet"
          : "",
      image: images[0] || "",
      images,
      specs: {
        bands: apiDevice.specifications?.bands || "N/A",
        wifiSpeed: apiDevice.specifications?.wifi_speed || "",
        wifiStandard: apiDevice.connectivity?.wifi_standard || "",
        ethernet: apiDevice.connectivity?.ethernet || "",
        ports: apiDevice.specifications?.ports
          ? `${apiDevice.specifications.ports.lan || 0} LAN, ${
              apiDevice.specifications.ports.wan || 0
            } WAN`
          : "",
        totalPorts,
        coverage: apiDevice.performance?.coverage || "",
        maxDevices: apiDevice.performance?.max_devices || 0,
        antenna: apiDevice.specifications?.antenna || "",
        docsis: apiDevice.specifications?.docsis || "",
        speed: apiDevice.specifications?.speed || "",
      },
      numericSpeed: wifiSpeed,
      numericCoverage: coverage,
      numericWeight: weight,
      launchDate: apiDevice.created_at || "",
      releaseYear: apiDevice.release_year || "",
      storePrices,
      variants,
      features: apiDevice.features || [],
      warranty: apiDevice.warranty?.product || "",
      country: apiDevice.country_of_origin || "",
    };
  };

  // Use global device hook for networking data (fetched via Redux)
  // `useDevice` will dispatch `fetchNetworking` on mount if needed.
  // fall back to `mockNetworkingDevices` if API data unavailable.
  // Note: `mockNetworkingDevices` is intentionally empty; server data is preferred.
  const { networking, networkingLoading, setDevices } = useDevice();

  // do not early-return here — keep hooks consistent; show spinner in UI when loading

  const sourceDevices = Array.isArray(networking) ? networking : [];
  const devices = sourceDevices.map((device, i) => mapApiToDevice(device, i));

  // NOTE: avoid writing `devices` back into the `networking` Redux slice here.
  // Writing the normalized `devices` into the same `networking` key causes
  // the Redux state to change on every render which triggers this component
  // to re-render and creates an infinite update loop. Keep normalization
  // local to this component instead.

  // Build variant-level cards
  const variantCards = devices.flatMap((device) => {
    const vars =
      Array.isArray(device.variants) && device.variants.length
        ? device.variants
        : [];

    if (vars.length === 0) {
      return [{ ...device, id: `${device.id}-default` }];
    }

    return vars.map((v) => {
      const rawVariantStorePrices = Array.isArray(v.store_prices)
        ? v.store_prices
        : [];

      const mappedVariantStores = rawVariantStorePrices.map((sp) => ({
        id: sp.id,
        store: sp.store_name || sp.store || "Store",
        price: sp.price,
        url: sp.url,
        offer_text: sp.offer_text,
        delivery_info: sp.delivery_info,
      }));

      const base = v.base_price || 0;

      const storePrices =
        mappedVariantStores.length > 0
          ? mappedVariantStores
          : base > 0
            ? [
                {
                  id: `variant-base-${
                    v.variant_id || Math.random().toString(36).slice(2, 8)
                  }`,
                  store: "Base Price",
                  price: base,
                  url: null,
                },
              ]
            : device.storePrices || [];

      const candidatePrices = storePrices
        .map((p) => extractNumericPrice(p.price))
        .filter((n) => n > 0);
      const numericPrice = candidatePrices.length
        ? Math.min(...candidatePrices)
        : device.numericPrice || 0;

      const price =
        numericPrice > 0
          ? `₹${numericPrice.toLocaleString()}`
          : "Price not available";

      return {
        ...device,
        id: `${device.id}-${
          v.variant_id || Math.random().toString(36).slice(2, 8)
        }`,
        variant: v,
        storePrices,
        price,
        numericPrice,
      };
    });
  });

  // Extract filter options dynamically from all devices
  const brands = [...new Set(devices.map((d) => d.brand).filter(Boolean))];
  const deviceTypes = [
    ...new Set(devices.map((d) => d.deviceType).filter(Boolean)),
  ];

  // Extract WiFi standards
  const wifiStandards = [
    ...new Set(devices.map((d) => d.specs.wifiStandard).filter(Boolean)),
  ].sort((a, b) => {
    // Sort by WiFi generation (6E > 6 > 5 > etc.)
    const order = { "6E": 3, 6: 2, 5: 1, 4: 0 };
    const aNum = order[a.match(/(\d+E?)/)?.[1]] || 0;
    const bNum = order[b.match(/(\d+E?)/)?.[1]] || 0;
    return bNum - aNum;
  });

  // Extract bands
  const bands = [...new Set(devices.map((d) => d.specs.bands).filter(Boolean))];

  // Extract Ethernet types
  const ethernetTypes = [
    ...new Set(devices.map((d) => d.specs.ethernet).filter(Boolean)),
  ].sort((a, b) => {
    // Sort by speed (Multi-Gig > Gigabit > Fast)
    const order = { "Multi-Gig": 3, "2.5G": 3, Gigabit: 2, Fast: 1, "100M": 0 };
    const aNum = order[a] || 0;
    const bNum = order[b] || 0;
    return bNum - aNum;
  });

  // WiFi Speed ranges (dynamic based on available speeds)
  const getSpeedRanges = () => {
    const speeds = devices
      .map((d) => d.numericSpeed)
      .filter((speed) => speed > 0)
      .sort((a, b) => a - b);

    if (speeds.length === 0) return [];

    const min = Math.floor(Math.min(...speeds) / 1000) * 1000;
    const max = Math.ceil(Math.max(...speeds) / 1000) * 1000;

    const ranges = [];
    for (let i = min; i <= max; i += 1000) {
      if (i + 1000 <= max) {
        ranges.push({
          id: `${i}-${i + 1000}`,
          label: `${i / 1000} - ${(i + 1000) / 1000} Gbps`,
          min: i,
          max: i + 1000,
        });
      } else {
        ranges.push({
          id: `${i}+`,
          label: `${i / 1000} Gbps+`,
          min: i,
          max: Infinity,
        });
      }
    }
    return ranges.slice(0, 5); // Limit to 5 ranges
  };

  const speedRanges = getSpeedRanges();

  // Coverage ranges
  const COVERAGE_RANGES = [
    { id: "small", label: "Small (<1000 sq ft)", min: 0, max: 1000 },
    { id: "medium", label: "Medium (1000-2000 sq ft)", min: 1000, max: 2000 },
    { id: "large", label: "Large (2000-3000 sq ft)", min: 2000, max: 3000 },
    {
      id: "extra-large",
      label: "Extra Large (>3000 sq ft)",
      min: 3000,
      max: Infinity,
    },
  ];

  // Port ranges
  const getPortRanges = () => {
    const ports = devices.map((d) => d.specs.totalPorts).filter((p) => p > 0);
    if (ports.length === 0) return [];

    const uniquePorts = [...new Set(ports)].sort((a, b) => a - b);

    return uniquePorts.map((port) => ({
      id: `${port}`,
      label: `${port} Port${port > 1 ? "s" : ""}`,
      value: port,
    }));
  };

  const portOptions = getPortRanges();

  // Rating ranges
  const RATING_RANGES = [
    { id: "4.5+", label: "4.5+ Stars", min: 4.5, max: 5 },
    { id: "4.0+", label: "4.0+ Stars", min: 4.0, max: 5 },
    { id: "3.5+", label: "3.5+ Stars", min: 3.5, max: 5 },
    { id: "any", label: "Any Rating", min: 0, max: 5 },
  ];

  // Price range
  const MIN_PRICE = 0;
  const MAX_PRICE = 50000;

  const [filters, setFilters] = useState({
    brand: [],
    priceRange: { min: MIN_PRICE, max: MAX_PRICE },
    deviceType: [],
    wifiStandard: [],
    speedRange: [],
    bands: [],
    ethernet: [],
    ports: [],
    coverage: [],
    rating: [],
  });

  const [sortBy, setSortBy] = useState("featured");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [compareItems, setCompareItems] = useState([]);

  // Set page title
  useTitle({
    page: "networking",
  });

  const navigate = useNavigate();
  const { search } = useLocation();
  const [params] = useSearchParams();
  const filter = params.get("filter");
  const dispatch = useDispatch();

  const deviceContext = useDevice();
  const filterBrand =
    Array.isArray(filters?.brand) && filters.brand[0] ? filters.brand[0] : null;
  const currentBrandObj = (() => {
    const b = filterBrand;
    if (!b) return null;
    const all = deviceContext?.brands || [];
    const norm = (s) => (s || "").toString().toLowerCase();
    return (
      all.find((br) => {
        const slug =
          br.slug ||
          (br.name || "").toString().toLowerCase().replace(/\s+/g, "-");
        return (
          slug === b.toString().toLowerCase() ||
          norm(br.name) === b.toString().toLowerCase()
        );
      }) || null
    );
  })();

  // Do not dispatch list fetches from components. Rely on `useDevice()` global loader.

  // Apply query param filters
  useEffect(() => {
    const params = new URLSearchParams(search);
    const brandParam = params.get("brand");
    const typeParam = params.get("type");
    const qParam =
      params.get("q") || params.get("query") || params.get("search") || null;
    const sortParam = params.get("sort");

    // Parse list params
    const toArray = (val) =>
      val && val.length
        ? val
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

    const brandArr = toArray(brandParam);
    const typeArr = toArray(typeParam);
    const wifiArr = toArray(params.get("wifi"));
    const bandArr = toArray(params.get("bands"));

    // Parse price range
    const rawMin = params.get("priceMin") || params.get("minPrice");
    const rawMax = params.get("priceMax") || params.get("maxPrice");
    const priceMin = rawMin ? Number(rawMin) : MIN_PRICE;
    const priceMax = rawMax ? Number(rawMax) : MAX_PRICE;

    setFilters((prev) => ({
      ...prev,
      brand: brandArr.length ? brandArr : prev.brand,
      deviceType: typeArr.length ? typeArr : prev.deviceType,
      wifiStandard: wifiArr.length ? wifiArr : prev.wifiStandard,
      bands: bandArr.length ? bandArr : prev.bands,
      priceRange: {
        min: !isNaN(priceMin) ? priceMin : prev.priceRange.min,
        max: !isNaN(priceMax) ? priceMax : prev.priceRange.max,
      },
    }));

    if (typeParam && !sortParam) {
      setSortBy("newest");
    } else if (sortParam) {
      setSortBy(sortParam);
    }

    if (qParam !== null) {
      setSearchQuery(qParam);
    }
  }, [search]);

  const updatePriceRange = (newMin, newMax) => {
    let min = Number(newMin ?? filters.priceRange.min);
    let max = Number(newMax ?? filters.priceRange.max);
    if (min > max) max = min;
    if (max < min) min = max;
    setFilters((prev) => ({ ...prev, priceRange: { min, max } }));
  };

  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => {
      const currentArr = Array.isArray(prev[filterType])
        ? prev[filterType]
        : [];
      const nextArr = currentArr.includes(value)
        ? currentArr.filter((item) => item !== value)
        : [...currentArr, value];
      return { ...prev, [filterType]: nextArr };
    });
  };

  const handleSortChange = (value) => {
    setSortBy(value);
    setShowSort(false);
    try {
      const params = new URLSearchParams(search);
      if (value && value !== "featured") params.set("sort", value);
      else params.delete("sort");
      const qs = params.toString();
      const path = `/networking${qs ? `?${qs}` : ""}`;
      navigate(path, { replace: true });
    } catch {
      // ignore
    }
  };

  // Filter logic
  const filteredVariants = variantCards.filter((device) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        device.name.toLowerCase().includes(query) ||
        device.brand.toLowerCase().includes(query) ||
        device.deviceType.toLowerCase().includes(query) ||
        device.specs.wifiStandard.toLowerCase().includes(query) ||
        device.features.some((f) => f.toLowerCase().includes(query));
      if (!matchesSearch) return false;
    }

    // Brand filter
    if (filters.brand.length > 0 && !filters.brand.includes(device.brand)) {
      return false;
    }

    // Device type filter
    if (
      filters.deviceType.length > 0 &&
      !filters.deviceType.includes(device.deviceType)
    ) {
      return false;
    }

    // Price range filter
    if (filters.priceRange) {
      const devicePrice = device.numericPrice;
      if (
        devicePrice < filters.priceRange.min ||
        devicePrice > filters.priceRange.max
      )
        return false;
    }

    // WiFi standard filter
    if (filters.wifiStandard.length > 0) {
      const wifiStd = device.specs.wifiStandard || "";
      if (!filters.wifiStandard.some((std) => wifiStd.includes(std)))
        return false;
    }

    // Speed range filter
    if (filters.speedRange.length > 0) {
      const speed = device.numericSpeed || 0;
      const matchesSpeed = filters.speedRange.some((rangeId) => {
        const range = speedRanges.find((r) => r.id === rangeId);
        if (!range) return false;
        return speed >= range.min && speed <= range.max;
      });
      if (!matchesSpeed) return false;
    }

    // Bands filter
    if (filters.bands.length > 0) {
      const band = device.specs.bands || "";
      if (!filters.bands.includes(band)) return false;
    }

    // Ethernet type filter
    if (filters.ethernet.length > 0) {
      const ethernet = device.specs.ethernet || "";
      if (!filters.ethernet.includes(ethernet)) return false;
    }

    // Ports filter
    if (filters.ports.length > 0) {
      const ports = device.specs.totalPorts || 0;
      if (!filters.ports.includes(String(ports))) return false;
    }

    // Coverage filter
    if (filters.coverage.length > 0) {
      const coverage = device.numericCoverage || 0;
      const matchesCoverage = filters.coverage.some((rangeId) => {
        const range = COVERAGE_RANGES.find((r) => r.id === rangeId);
        if (!range) return false;
        return coverage >= range.min && coverage <= range.max;
      });
      if (!matchesCoverage) return false;
    }

    // Rating filter
    if (filters.rating.length > 0) {
      const rating = device.rating || 0;
      const matchesRating = filters.rating.some((rangeId) => {
        const range = RATING_RANGES.find((r) => r.id === rangeId);
        if (!range) return false;
        return rating >= range.min && rating <= range.max;
      });
      if (!matchesRating) return false;
    }

    return true;
  });

  const sortedVariants = [...filteredVariants].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return a.numericPrice - b.numericPrice;
      case "price-high":
        return b.numericPrice - a.numericPrice;
      case "rating":
        return b.rating - a.rating;
      case "newest":
        return new Date(b.launchDate) - new Date(a.launchDate);
      case "speed":
        return b.numericSpeed - a.numericSpeed;
      case "coverage":
        return b.numericCoverage - a.numericCoverage;
      default:
        return 0;
    }
  });

  const clearFilters = () => {
    setFilters({
      brand: [],
      priceRange: { min: MIN_PRICE, max: MAX_PRICE },
      deviceType: [],
      wifiStandard: [],
      speedRange: [],
      bands: [],
      ethernet: [],
      ports: [],
      coverage: [],
      rating: [],
    });
    setSearchQuery("");
    try {
      const params = new URLSearchParams(search);
      params.delete("brand");
      params.delete("type");
      params.delete("q");
      params.delete("wifi");
      params.delete("bands");
      if (sortBy && sortBy !== "featured") {
        params.set("sort", sortBy);
      } else {
        params.delete("sort");
      }
      const qs = params.toString();
      const path = `/networking${qs ? `?${qs}` : ""}`;
      navigate(path, { replace: true });
    } catch {}
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.brand && filters.brand.length) count += filters.brand.length;
    if (filters.deviceType && filters.deviceType.length)
      count += filters.deviceType.length;
    if (filters.wifiStandard && filters.wifiStandard.length)
      count += filters.wifiStandard.length;
    if (filters.speedRange && filters.speedRange.length)
      count += filters.speedRange.length;
    if (filters.bands && filters.bands.length) count += filters.bands.length;
    if (filters.ethernet && filters.ethernet.length)
      count += filters.ethernet.length;
    if (filters.ports && filters.ports.length) count += filters.ports.length;
    if (filters.coverage && filters.coverage.length)
      count += filters.coverage.length;
    if (filters.rating && filters.rating.length) count += filters.rating.length;
    if (
      filters.priceRange &&
      (filters.priceRange.min > 0 || filters.priceRange.max < MAX_PRICE)
    )
      count += 1;
    return count;
  };

  const handleView = (device, e, store) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const params = new URLSearchParams();
    params.set("type", "networking");
    if (device?.brand) params.set("brand", device.brand);
    if (device?.product_name) params.set("model", device.product_name);
    if (device?.model_number) params.set("modelNumber", device.model_number);
    if (device.variant?.variant_id) {
      params.set("variantId", String(device.variant.variant_id));
    }
    if (device.deviceType) params.set("deviceType", device.deviceType);
    if (store?.id) params.set("storeId", String(store.id));
    if (store?.store) params.set("storeName", String(store.store));
    // include id as fallback (not primary for SEO)
    if (device.id) params.set("id", String(device.id));

    // Generate SEO-friendly slug-based URL
    const slug = generateSlug(
      device.product_name ||
        device.model_number ||
        device.brand ||
        String(device.id),
    );
    const qs = params.toString();

    // record view for trending (only if we have a numeric product id)
    try {
      const rawPid = device.product_id ?? device.productId ?? device.id;
      const pid = Number(rawPid);
      if (Number.isInteger(pid) && pid > 0) {
        fetch(`https://api.apisphere.in/api/public/product/${pid}/view`, {
          method: "POST",
        }).catch(() => {});
      }
    } catch {}

    navigate(`/networking/${slug}${qs ? `?${qs}` : ""}`);
  };

  const handleCompareToggle = (device, e) => {
    if (e) e.stopPropagation();
    const deviceId = device.productId ?? device.id ?? device.model;
    setCompareItems((prev) => {
      const isAlreadyAdded = prev.some(
        (item) => (item.productId ?? item.id ?? item.model) === deviceId,
      );
      if (isAlreadyAdded) {
        return prev.filter(
          (item) => (item.productId ?? item.id ?? item.model) !== deviceId,
        );
      } else {
        return [...prev, device];
      }
    });
  };

  const isCompareSelected = (device) => {
    const deviceId = device.productId ?? device.id ?? device.model;
    return compareItems.some(
      (item) => (item.productId ?? item.id ?? item.model) === deviceId,
    );
  };

  const handleCompareNavigate = (e) => {
    if (e) e.stopPropagation();
    if (compareItems.length === 0) return;

    const queryParams = new URLSearchParams();
    compareItems.forEach((device) => {
      const idVal = device.productId ?? device.id ?? device.model;
      queryParams.append("add", String(idVal));
    });

    navigate(`/compare?${queryParams.toString()}`, {
      state: { initialProducts: compareItems },
    });
  };

  // Get device type icon component
  const DeviceTypeIcon = ({ deviceType }) => {
    const IconComponent = getDeviceTypeIcon(deviceType);
    return <IconComponent className="text-sm" />;
  };

  return (
    <div className="min-h-screen ">
      <style>{animationStyles}</style>
      {currentBrandObj ? (
        <Helmet>
          <title>{`${currentBrandObj.name} Networking Devices - SmartArena`}</title>
          <meta
            name="description"
            content={
              currentBrandObj.description ||
              `Explore ${currentBrandObj.name} networking devices, routers, modems and mesh systems on SmartArena.`
            }
          />
        </Helmet>
      ) : (
        <Helmet>
          <title>Networking Devices - SmartArena</title>
          <meta
            name="description"
            content={`Discover routers, modems, switches, mesh systems and extenders on SmartArena.`}
          />
        </Helmet>
      )}
      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-4 sm:p-6 md:p-8 lg:p-10 bg-white">
        {/* Hero Section - Professional Styling */}
        <div className="mb-6 sm:mb-8 md:mb-10 lg:mb-12">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-purple-50 backdrop-blur-sm px-3 py-1.5 rounded-full border border-purple-100 mb-4 sm:mb-6">
            <FaWifi className="text-purple-600 text-sm" />
            <span className="text-xs sm:text-sm font-semibold text-purple-800">
              LATEST COLLECTION
            </span>
          </div>

          {/* Heading with Gradient Text */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-4xl xl:text-5xl font-bold mb-2 sm:mb-3 md:mb-4 lg:mb-6 leading-tight">
            Explore Premium{" "}
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Networking Devices
            </span>
          </h1>

          {/* Subtitle */}
          <h4 className="text-base sm:text-lg md:text-lg lg:text-xl mb-4 sm:mb-6 md:mb-8 text-gray-700 leading-relaxed max-w-3xl">
            Discover detailed specifications, compare models, and find the best
            deals on the latest networking devices. Use our advanced filters to
            narrow down your search from our curated collection.
          </h4>
        </div>

        {/* Control Bar */}
        <div className="mb-6 sm:mb-7 md:mb-8">
          {/* Desktop Search and Sort */}
          <div className="hidden lg:flex items-center justify-between mb-4 md:mb-5 lg:mb-6">
            <div className="flex-1 max-w-2xl">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FaSearch className="text-purple-500 group-focus-within:text-purple-600 transition-colors duration-200" />
                </div>
                <input
                  type="text"
                  placeholder="Search networking devices by brand, model, or specifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl
             bg-gradient-to-br from-purple-600 to-blue-600
             text-gray-700 placeholder:text-gray-400
             focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
             text-sm sm:text-base
             disabled:opacity-50 disabled:cursor-not-allowed
"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <FaFilter className="text-gray-500" />
                <span className="text-sm text-gray-600">Sort by:</span>
              </div>
              <div className="relative min-w-[200px]">
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 text-gray-700 appearance-none cursor-pointer bg-white pr-10 transition-all duration-200 hover:border-purple-400"
                >
                  <option value="featured">Featured Devices</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                  <option value="newest">Newest First</option>
                  <option value="speed">Highest Speed</option>
                  <option value="coverage">Largest Coverage</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                  <svg
                    className="fill-current h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>

              {getActiveFiltersCount() > 0 && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-xl transition-colors"
                >
                  <FaTimes />
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Mobile Search and Filter Bar */}
          <div className="lg:hidden space-y-3 sm:space-y-4 mb-4 sm:mb-5 md:mb-6">
            <div className="group relative">
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-500 group-focus-within:text-purple-600 transition-colors duration-200" />
              <input
                type="text"
                placeholder="Search networking devices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 pl-12 pr-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-100 focus:border-purple-500 text-gray-700 transition-all duration-200 placeholder:text-gray-400"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowFilters(true)}
                className="flex items-center justify-center gap-2 flex-1 h-12 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 rounded-xl transition-all duration-300 font-semibold hover:from-purple-600 hover:to-blue-600 hover:shadow-lg hover:-translate-y-0.5"
              >
                <FaFilter />
                Filters
                {getActiveFiltersCount() > 0 && (
                  <span className="text-purple-200 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {getActiveFiltersCount()}
                  </span>
                )}
              </button>

              <button
                onClick={() => setShowSort(true)}
                className="flex items-center justify-center gap-2 flex-1 h-12   text-gray-700 px-4 rounded-xl border border-gray-900 hover:bg-gray-50 transition-all duration-300 font-semibold"
              >
                <FaSort />
                Sort
              </button>
            </div>

            {/* Active Filters Badge - Mobile */}
            {getActiveFiltersCount() > 0 && (
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl border border-purple-200">
                <div className="flex items-center gap-3">
                  <FaInfoCircle className="text-purple-600" />
                  <div>
                    <span className="text-sm font-medium text-purple-800">
                      {getActiveFiltersCount()} filter
                      {getActiveFiltersCount() > 1 ? "s" : ""} applied
                    </span>
                    <p className="text-xs text-purple-600 mt-0.5">
                      Showing {filteredVariants.length} of {variantCards.length}{" "}
                      options
                    </p>
                  </div>
                </div>
                <button
                  onClick={clearFilters}
                  className="text-purple-600 hover:text-purple-800 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-purple-100 transition-colors duration-200"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* Results Count */}
          <div className="flex items-center justify-between mb-4 sm:mb-5 md:mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Available Networking Devices
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Browse through our curated selection of networking devices with
                detailed specifications and competitive prices
              </p>
            </div>
            <div className="hidden lg:block text-sm text-gray-500">
              Showing {sortedVariants.length} of {variantCards.length} options
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 sm:gap-5 md:gap-6">
          {/* Desktop Filter Sidebar */}
          <div className="hidden lg:block lg:w-80 flex-shrink-0">
            <div className="p-4 md:p-5 lg:p-6 sticky top-6">
              {/* Filters Header */}
              <div
                className="flex justify-between items-center mb-6 sm:mb-7 md:mb-8 pb-3 sm:pb-4
           border-b border-indigo-100 px-2 sm:px-3 md:px-4"
              >
                <div>
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    Refine Search
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Narrow down devices by specifications
                  </p>
                </div>
                {getActiveFiltersCount() > 0 && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 font-semibold transition-colors duration-200 px-3 py-1 rounded-lg hover:bg-purple-50"
                  >
                    <FaTimes />
                    Clear all
                  </button>
                )}
              </div>

              {/* Active Filters Badge */}
              {getActiveFiltersCount() > 0 && (
                <div className="mb-4 sm:mb-5 md:mb-6 p-3 sm:p-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl border border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-purple-800">
                      Active Filters
                    </span>
                    <span className="text-xs font-bold text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                      {getActiveFiltersCount()}
                    </span>
                  </div>
                  <p className="text-xs text-purple-600">
                    Refine further or clear to see all devices
                  </p>
                </div>
              )}

              {/* Price Range Filter */}
              <div className="mb-6 sm:mb-7 md:mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
                    Price Range
                  </h4>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    ₹{filters.priceRange.min?.toLocaleString()} - ₹
                    {filters.priceRange.max?.toLocaleString()}
                  </span>
                </div>
                <div className="bg-gradient-to-br from-purple-600 to-blue-600 border border-indigo-100 rounded-xl p-4">
                  <div className="flex justify-between text-sm font-medium text-gray-700 mb-4">
                    <div className="text-center">
                      <div className="text-xs text-gray-500">Minimum</div>
                      <div className="font-bold">
                        ₹{filters.priceRange.min?.toLocaleString()}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500">Maximum</div>
                      <div className="font-bold">
                        ₹{filters.priceRange.max?.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Dual Range Slider */}
                  <div className="relative mb-8">
                    <div className="absolute h-2 bg-gray-200 rounded-full w-full top-1/2 transform -translate-y-1/2"></div>
                    <div
                      className="absolute h-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full top-1/2 transform -translate-y-1/2"
                      style={{
                        left: `${Math.max(
                          0,
                          Math.min(
                            100,
                            ((filters.priceRange.min || 0) / (MAX_PRICE || 1)) *
                              100,
                          ),
                        )}%`,
                        width: `${Math.max(
                          0,
                          Math.min(
                            100,
                            ((filters.priceRange.max - filters.priceRange.min) /
                              (MAX_PRICE || 1)) *
                              100,
                          ),
                        )}%`,
                      }}
                    ></div>

                    <input
                      type="range"
                      min={MIN_PRICE}
                      max={MAX_PRICE}
                      value={filters.priceRange.min}
                      onChange={(e) =>
                        updatePriceRange(
                          Number(e.target.value),
                          filters.priceRange.max,
                        )
                      }
                      className="absolute w-full top-1/2 transform -translate-y-1/2 appearance-none h-4 bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-blue-500 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer"
                    />

                    <input
                      type="range"
                      min={MIN_PRICE}
                      max={MAX_PRICE}
                      value={filters.priceRange.max}
                      onChange={(e) =>
                        updatePriceRange(
                          filters.priceRange.min,
                          Number(e.target.value),
                        )
                      }
                      className="absolute w-full top-1/2 transform -translate-y-1/2 appearance-none h-4 bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-blue-500 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer"
                    />
                  </div>

                  <div className="flex justify-between items-center text-xs mb-2">
                    <span className="text-gray-500">
                      ₹{MIN_PRICE.toLocaleString()}
                    </span>
                    <span className="text-gray-500">
                      ₹{MAX_PRICE.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Device Type Filter */}
              <div className="mb-6 sm:mb-7 md:mb-8">
                <div className="flex items-center justify-between mb-4 ">
                  <div>
                    <h4 className="font-bold text-gray-900 text-base">
                      Device Type
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      Category of networking device
                    </p>
                  </div>
                  <span className="text-xs font-bold text-purple-600 bg-purple-100 px-2.5 py-1.5 rounded-full">
                    {filters.deviceType.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {deviceTypes.map((type) => {
                    const Icon = getDeviceTypeIcon(type);
                    return (
                      <label
                        key={type}
                        className={`flex items-center justify-between gap-2 cursor-pointer px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                          filters.deviceType.includes(type)
                            ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
                            : "bg-gradient-to-br from-purple-600 to-blue-600 border border-gray-200 text-gray-700 hover:border-gray-300"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={filters.deviceType.includes(type)}
                          onChange={() =>
                            handleFilterChange("deviceType", type)
                          }
                          className="sr-only"
                        />
                        <div className="flex items-center gap-3">
                          <Icon className="text-sm" />
                          <span className="text-sm capitalize">{type}</span>
                        </div>
                        <div
                          className={`w-2 h-2 rounded-full ${
                            filters.deviceType.includes(type)
                              ? "bg-white"
                              : "bg-gray-300"
                          }`}
                        ></div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Brand Filter */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
                    Brand
                  </h4>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {filters.brand.length} selected
                  </span>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {brands.map((brand) => (
                    <label
                      key={brand}
                      className="flex items-center gap-3 cursor-pointer group hover:bg-gray-50 px-3 py-2.5 rounded-lg transition-all duration-200 border border-transparent hover:border-gray-200"
                    >
                      <input
                        type="checkbox"
                        checked={filters.brand.includes(brand)}
                        onChange={() => handleFilterChange("brand", brand)}
                        className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-2 focus:ring-purple-500 focus:ring-offset-1"
                      />
                      <span className="text-gray-700 group-hover:text-gray-900 font-medium flex-1">
                        {brand}
                      </span>
                      <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {devices.filter((d) => d.brand === brand).length}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* WiFi Standard Filter */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
                    WiFi Standard
                  </h4>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {filters.wifiStandard.length} selected
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {wifiStandards.map((standard) => (
                    <label
                      key={standard}
                      className={`flex items-center justify-center gap-2 cursor-pointer px-3 py-2.5 rounded-xl transition-all duration-200 font-medium text-sm ${
                        filters.wifiStandard.includes(standard)
                          ? "bg-gradient-to-b from-purple-600 to-blue-600 text-white shadow-lg"
                          : "bg-gradient-to-br from-purple-600 to-blue-600 border border-gray-200 text-gray-700 hover:border-gray-300 hover:shadow-sm"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={filters.wifiStandard.includes(standard)}
                        onChange={() =>
                          handleFilterChange("wifiStandard", standard)
                        }
                        className="sr-only"
                      />
                      <span>{standard}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Speed Range Filter */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
                    WiFi Speed
                  </h4>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {filters.speedRange.length} selected
                  </span>
                </div>
                <div className="space-y-2">
                  {speedRanges.map((range) => (
                    <label
                      key={range.id}
                      className={`flex items-center justify-between gap-2 cursor-pointer px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                        filters.speedRange.includes(range.id)
                          ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
                          : "bg-gray-50 border border-gray-200 text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={filters.speedRange.includes(range.id)}
                        onChange={() =>
                          handleFilterChange("speedRange", range.id)
                        }
                        className="sr-only"
                      />
                      <div className="flex items-center gap-3">
                        <span className="text-sm">{range.label}</span>
                      </div>
                      <div
                        className={`w-2 h-2 rounded-full ${
                          filters.speedRange.includes(range.id)
                            ? "bg-white"
                            : "bg-gray-300"
                        }`}
                      ></div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Bands Filter */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
                    WiFi Bands
                  </h4>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {filters.bands.length} selected
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {bands.map((band) => (
                    <label
                      key={band}
                      className={`flex items-center justify-center gap-2 cursor-pointer px-3 py-2.5 rounded-xl transition-all duration-200 font-medium text-sm ${
                        filters.bands.includes(band)
                          ? "bg-gradient-to-b from-purple-600 to-blue-600 text-white shadow-lg"
                          : "bg-gradient-to-br from-purple-600 to-blue-600 border border-gray-200 text-gray-700 hover:border-gray-300 hover:shadow-sm"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={filters.bands.includes(band)}
                        onChange={() => handleFilterChange("bands", band)}
                        className="sr-only"
                      />
                      <span>{band}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Ethernet Type Filter */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
                    Ethernet Type
                  </h4>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {filters.ethernet.length} selected
                  </span>
                </div>
                <div className="space-y-2">
                  {ethernetTypes.map((type) => (
                    <label
                      key={type}
                      className={`flex items-center justify-between gap-2 cursor-pointer px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                        filters.ethernet.includes(type)
                          ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
                          : "bg-gradient-to-br from-purple-600 to-blue-600 border border-gray-200 text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={filters.ethernet.includes(type)}
                        onChange={() => handleFilterChange("ethernet", type)}
                        className="sr-only"
                      />
                      <div className="flex items-center gap-3">
                        <span className="text-sm">{type}</span>
                      </div>
                      <div
                        className={`w-2 h-2 rounded-full ${
                          filters.ethernet.includes(type)
                            ? "bg-white"
                            : "bg-gray-300"
                        }`}
                      ></div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Products List - Right */}
          <div className="flex-1">
            {/* Results Summary */}

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6 lg:w-10/12 auto-rows-fr">
              {sortedVariants.map((device, idx) => (
                <div
                  key={`${device.id}-${idx}`}
                  onClick={(e) => handleView(device, e)}
                  className="h-full transition-all duration-300 overflow-hidden rounded-md cursor-pointer hover:shadow-lg hover:scale-105"
                >
                  <div className="p-3 sm:p-4 md:p-5 lg:p-6 pt-4 sm:pt-5 md:pt-6">
                    {/* Top Row: Image and Basic Info */}
                    <div className="flex gap-3 sm:gap-4">
                      {/* Product Image - Fixed container */}
                      <div className="flex-shrink-0 w-52 h-52 bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageCarousel images={device.images} />
                        </div>
                      </div>

                      {/* Basic Info */}
                      <div className="flex-1 min-w-0">
                        {/* Brand and Model */}
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-bold text-blue-600  rounded-full">
                                {device.brand}
                              </span>
                            </div>
                            <h5 className="font-bold text-gray-900 text-sm ">
                              {(() => {
                                const name = device.name || device.model || "";
                                const wifiStandard = String(
                                  device.specs?.wifiStandard || "",
                                ).trim();
                                const bands = String(
                                  device.specs?.bands || "",
                                ).trim();
                                const deviceType = String(
                                  device.deviceType || "",
                                ).trim();

                                const parts = [name];

                                const specsInfo = [
                                  wifiStandard,
                                  bands,
                                  deviceType,
                                ]
                                  .filter(Boolean)
                                  .join(" / ");
                                if (specsInfo) parts.push(specsInfo);

                                return parts.filter(Boolean).join(" | ");
                              })()}
                            </h5>
                          </div>
                        </div>

                        {/* Price and Rating */}
                        <div className="mb-3">
                          <div className="flex items-center justify-between">
                            <div className="text-lg font-bold text-green-600">
                              {device.price}
                            </div>
                            {device.rating > 0 && (
                              <div className="flex items-center gap-1">
                                <FaStar className="text-yellow-500 text-sm" />
                                <span className="font-bold text-gray-900 text-sm">
                                  {device.rating}
                                </span>
                                <span className="text-xs text-gray-500">
                                  ({device.reviews})
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Key Specs Badges */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {device.specs.wifiSpeed && (
                            <div className="flex items-center gap-1 text-xs bg-gray-50 px-2 py-1 rounded">
                              <FaBolt className="text-gray-500" />
                              <span className="font-medium text-gray-700">
                                {device.specs.wifiSpeed}
                              </span>
                            </div>
                          )}
                          {device.specs.bands &&
                            device.specs.bands !== "N/A" && (
                              <div className="flex items-center gap-1 text-xs bg-gray-50 px-2 py-1 rounded">
                                <FaSignal className="text-gray-500" />
                                <span className="font-medium text-gray-700">
                                  {device.specs.bands}
                                </span>
                              </div>
                            )}
                          {device.specs.totalPorts > 0 && (
                            <div className="flex items-center gap-1 text-xs bg-gray-50 px-2 py-1 rounded">
                              <FaEthernet className="text-gray-500" />
                              <span className="font-medium text-gray-700">
                                {device.specs.totalPorts} Ports
                              </span>
                            </div>
                          )}
                          {device.specs.coverage && (
                            <div className="flex items-center gap-1 text-xs bg-gray-50 px-2 py-1 rounded">
                              <FaHome className="text-gray-500" />
                              <span className="font-medium text-gray-700">
                                {device.specs.coverage}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    <div className="mt-3 sm:mt-4 md:mt-5 pt-3 sm:pt-4 md:pt-5 border-t border-indigo-100">
                      {/* Detailed Specifications */}
                      <div className="mb-3 sm:mb-4 md:mb-5">
                        <h4 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
                          <FaInfoCircle className="text-purple-600" />
                          Key Specs
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          {device.specs.wifiStandard && (
                            <div className="text-xs">
                              <div className="text-gray-500">WiFi Standard</div>
                              <div className="font-medium text-gray-900">
                                {device.specs.wifiStandard}
                              </div>
                            </div>
                          )}
                          {device.specs.ethernet && (
                            <div className="text-xs">
                              <div className="text-gray-500">Ethernet</div>
                              <div className="font-medium text-gray-900">
                                {device.specs.ethernet}
                              </div>
                            </div>
                          )}
                          {device.specs.ports && (
                            <div className="text-xs">
                              <div className="text-gray-500">Ports</div>
                              <div className="font-medium text-gray-900">
                                {device.specs.ports}
                              </div>
                            </div>
                          )}
                          {device.specs.maxDevices > 0 && (
                            <div className="text-xs">
                              <div className="text-gray-500">Max Devices</div>
                              <div className="font-medium text-gray-900">
                                {device.specs.maxDevices}
                              </div>
                            </div>
                          )}
                          {device.releaseYear && (
                            <div className="text-xs">
                              <div className="text-gray-500">Release Year</div>
                              <div className="font-medium text-gray-900">
                                {device.releaseYear}
                              </div>
                            </div>
                          )}
                          {device.warranty && (
                            <div className="text-xs">
                              <div className="text-gray-500">Warranty</div>
                              <div className="font-medium text-gray-900">
                                {device.warranty}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Features */}
                      {device.features && device.features.length > 0 && (
                        <div className="mb-4">
                          <h4 className="font-semibold text-gray-900 text-sm mb-2 flex items-center gap-2">
                            <FaShieldAlt className="text-amber-500" />
                            Key Features
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {device.features.slice(0, 4).map((feature, i) => (
                              <span
                                key={i}
                                className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded"
                              >
                                {feature}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Store Availability */}
                      {device.storePrices && device.storePrices.length > 0 && (
                        <div className="mb-4">
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <h4 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                              <FaStore className="text-green-500" />
                              Available At
                            </h4>
                            <button
                              onClick={(e) => handleCompareToggle(device, e)}
                              className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-base font-bold transition-all duration-300 ${
                                isCompareSelected(device)
                                  ? "bg-purple-600 text-white shadow-lg"
                                  : "bg-white border-2 border-purple-600 text-purple-600 hover:bg-purple-50 shadow-md"
                              }`}
                              title="Add to compare"
                            >
                              +
                            </button>
                          </div>
                          <div className="space-y-2">
                            {device.storePrices
                              .slice(0, 3)
                              .map((storePrice, i) => {
                                const logoSrc = getLogo(storePrice.store);
                                return (
                                  <div
                                    key={`${device.id}-store-${i}`}
                                    className="flex items-center justify-between text-sm bg-gradient-to-br from-purple-600 to-blue-600 px-3 py-2 rounded-lg"
                                  >
                                    <div className="flex items-center gap-2">
                                      {logoSrc ? (
                                        <img
                                          src={logoSrc}
                                          alt={storePrice.store}
                                          className="w-6 h-6 object-contain"
                                        />
                                      ) : (
                                        <FaStore className="text-gray-400" />
                                      )}
                                      <span className="font-medium text-gray-900 capitalize">
                                        {storePrice.store || "Online Store"}
                                      </span>
                                    </div>
                                    <div className="font-bold text-green-600">
                                      {formatPriceDisplay(storePrice.price)}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <a
                                        href={storePrice.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="text-blue-600 hover:text-blue-800 text-xs font-medium flex items-center gap-1"
                                      >
                                        Buy Now
                                        <FaExternalLinkAlt className="text-xs opacity-80" />
                                      </a>
                                    </div>
                                  </div>
                                );
                              })}
                            {device.storePrices.length > 3 && (
                              <div className="text-center text-xs text-gray-500">
                                +{device.storePrices.length - 3} more stores
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-4 items-center">
                      <button
                        onClick={(e) => handleCompareToggle(device, e)}
                        className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 ${
                          isCompareSelected(device)
                            ? "bg-purple-600 text-white"
                            : "border-2 border-purple-600 text-purple-600 hover:bg-purple-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isCompareSelected(device)}
                          onChange={(e) => handleCompareToggle(device, e)}
                          className="cursor-pointer"
                        />
                        <span className="hidden sm:inline">Compare</span>
                      </button>
                      <div className="flex-1"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* No Results State */}
            {sortedVariants.length === 0 && (
              <div className="text-center py-16 bg-gradient-to-b from-white to-blue-600 border border-purple-200 rounded-xl  ">
                <div className="max-w-md mx-auto">
                  <FaSearch className="text-gray-300 text-5xl mx-auto mb-4" />
                  <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                    No networking devices found
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Try adjusting your filters or search terms to find what
                    you're looking for. We have a wide range of devices
                    available.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={clearFilters}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-blue-600 transition-all duration-200  "
                    >
                      Clear All Filters
                    </button>
                    <button
                      onClick={() => setShowFilters(true)}
                      className="bg-white text-gray-700 px-6 py-3 rounded-lg font-semibold border border-gray-300 hover:bg-gray-50 transition-colors duration-200"
                    >
                      Adjust Filters
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Results Footer */}
            {sortedVariants.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="text-sm text-gray-600">
                    Showing {sortedVariants.length} of {variantCards.length}{" "}
                    variants
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() =>
                        window.scrollTo({ top: 0, behavior: "smooth" })
                      }
                      className="flex items-center gap-2 text-purple-600 hover:text-purple-700 text-sm font-medium"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 10l7-7m0 0l7 7m-7-7v18"
                        />
                      </svg>
                      Back to top
                    </button>
                    <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                      Last updated: Today
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Sort Modal */}
        {showSort && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div
              className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
              onClick={() => setShowSort(false)}
            ></div>

            <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl transform transition-transform duration-300 max-h-[70vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
                <div className="flex items-center gap-3">
                  <FaSort className="text-purple-600 text-xl" />
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Sort Options
                    </h3>
                    <p className="text-sm text-gray-500">
                      Arrange networking devices by preference
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSort(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <FaTimes className="text-gray-500 text-lg" />
                </button>
              </div>

              <div className="p-6 space-y-3">
                {[
                  {
                    value: "featured",
                    label: "Featured Devices",
                    desc: "Curated selection of popular models",
                  },
                  {
                    value: "price-low",
                    label: "Price: Low to High",
                    desc: "Budget-friendly options first",
                  },
                  {
                    value: "price-high",
                    label: "Price: High to Low",
                    desc: "Premium devices first",
                  },
                  {
                    value: "rating",
                    label: "Top Rated",
                    desc: "Highest user ratings",
                  },
                  {
                    value: "newest",
                    label: "Newest First",
                    desc: "Latest releases",
                  },
                  {
                    value: "speed",
                    label: "Highest Speed",
                    desc: "Fastest WiFi first",
                  },
                  {
                    value: "coverage",
                    label: "Largest Coverage",
                    desc: "Wide coverage areas first",
                  },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleSortChange(option.value)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                      sortBy === option.value
                        ? "bg-purple-50 border-purple-500 text-purple-700"
                        : "bg-gray-50 border-gray-200 text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <div className="font-semibold">{option.label}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      {option.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Mobile Filter Overlay */}
        {showFilters && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div
              className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
              onClick={() => setShowFilters(false)}
            ></div>

            <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl transform transition-transform duration-300 max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
                <div className="flex items-center gap-3">
                  <FaFilter className="text-purple-600 text-xl" />
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Refine Search
                    </h3>
                    <p className="text-sm text-gray-500">
                      Filter networking devices by specifications
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <FaTimes className="text-gray-500 text-lg" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[70vh] pb-40 space-y-6">
                {/* Price Range */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900 text-lg">
                      Price Range
                    </h4>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      ₹{filters.priceRange.min?.toLocaleString()} - ₹
                      {filters.priceRange.max?.toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-gradient-to-b from-purple-600 to-white rounded-xl p-4 border border-gray-200">
                    <div className="relative mb-4">
                      <div className="absolute h-2 bg-gray-200 rounded-full w-full top-1/2 transform -translate-y-1/2"></div>
                      <div
                        className="absolute h-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full top-1/2 transform -translate-y-1/2"
                        style={{
                          left: `${Math.max(
                            0,
                            Math.min(
                              100,
                              ((filters.priceRange.min || 0) /
                                (MAX_PRICE || 1)) *
                                100,
                            ),
                          )}%`,
                          width: `${Math.max(
                            0,
                            Math.min(
                              100,
                              ((filters.priceRange.max -
                                filters.priceRange.min) /
                                (MAX_PRICE || 1)) *
                                100,
                            ),
                          )}%`,
                        }}
                      />

                      <input
                        type="range"
                        min={MIN_PRICE}
                        max={MAX_PRICE}
                        value={filters.priceRange.min}
                        onChange={(e) =>
                          updatePriceRange(
                            Number(e.target.value),
                            filters.priceRange.max,
                          )
                        }
                        className="absolute w-full top-1/2 transform -translate-y-1/2 appearance-none h-4 bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-blue-500 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer"
                      />

                      <input
                        type="range"
                        min={MIN_PRICE}
                        max={MAX_PRICE}
                        value={filters.priceRange.max}
                        onChange={(e) =>
                          updatePriceRange(
                            filters.priceRange.min,
                            Number(e.target.value),
                          )
                        }
                        className="absolute w-full top-1/2 transform -translate-y-1/2 appearance-none h-4 bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-blue-500 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer"
                      />

                      <div className="flex justify-between items-center text-xs mt-6">
                        <span className="text-gray-500">
                          ₹{MIN_PRICE.toLocaleString()}
                        </span>
                        <span className="text-gray-500">
                          ₹{MAX_PRICE.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Device Type */}
                <div>
                  <h4 className="font-semibold text-gray-900 text-lg mb-3">
                    Device Type
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {deviceTypes.map((type) => {
                      const Icon = getDeviceTypeIcon(type);
                      return (
                        <label
                          key={type}
                          className={`flex items-center justify-center gap-2 cursor-pointer px-3 py-2.5 rounded-xl transition-all duration-200 font-medium text-sm ${
                            filters.deviceType.includes(type)
                              ? "bg-gradient-to-b from-purple-600 to-blue-600 text-white shadow-lg"
                              : "bg-gray-50 border border-gray-200 text-gray-700 hover:border-gray-300 hover:shadow-sm"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={filters.deviceType.includes(type)}
                            onChange={() =>
                              handleFilterChange("deviceType", type)
                            }
                            className="sr-only"
                          />
                          <Icon className="text-xs" />
                          <span className="capitalize">{type}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Brand */}
                <div>
                  <h4 className="font-semibold text-gray-900 text-lg mb-3">
                    Brand
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {brands.map((brand) => (
                      <label
                        key={brand}
                        className={`flex items-center justify-center gap-2 cursor-pointer px-3 py-2.5 rounded-xl transition-all duration-200 font-medium text-sm ${
                          filters.brand.includes(brand)
                            ? "bg-gradient-to-b from-purple-600 to-blue-600 text-white shadow-lg"
                            : "bg-gray-50 border border-gray-200 text-gray-700 hover:border-gray-300 hover:shadow-sm"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={filters.brand.includes(brand)}
                          onChange={() => handleFilterChange("brand", brand)}
                          className="sr-only"
                        />
                        <span>{brand}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* WiFi Standard */}
                <div>
                  <h4 className="font-semibold text-gray-900 text-lg mb-3">
                    WiFi Standard
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {wifiStandards.map((standard) => (
                      <label
                        key={standard}
                        className={`flex items-center justify-center gap-2 cursor-pointer px-3 py-2.5 rounded-xl transition-all duration-200 font-medium text-sm ${
                          filters.wifiStandard.includes(standard)
                            ? "bg-gradient-to-b from-purple-600 to-blue-600 text-white shadow-lg"
                            : "bg-gray-50 border border-gray-200 text-gray-700 hover:border-gray-300 hover:shadow-sm"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={filters.wifiStandard.includes(standard)}
                          onChange={() =>
                            handleFilterChange("wifiStandard", standard)
                          }
                          className="sr-only"
                        />
                        <FaWifi className="text-xs" />
                        <span>{standard}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Speed Range */}
                <div>
                  <h4 className="font-semibold text-gray-900 text-lg mb-3">
                    WiFi Speed
                  </h4>
                  <div className="space-y-2">
                    {speedRanges.map((range) => (
                      <label
                        key={range.id}
                        className={`flex items-center justify-between gap-2 cursor-pointer px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                          filters.speedRange.includes(range.id)
                            ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
                            : "bg-gray-50 border border-gray-200 text-gray-700 hover:border-gray-300"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={filters.speedRange.includes(range.id)}
                          onChange={() =>
                            handleFilterChange("speedRange", range.id)
                          }
                          className="sr-only"
                        />
                        <div className="flex items-center gap-3">
                          <FaBolt className="text-sm" />
                          <span className="text-sm">{range.label}</span>
                        </div>
                        <div
                          className={`w-2 h-2 rounded-full ${
                            filters.speedRange.includes(range.id)
                              ? "bg-white"
                              : "bg-gray-300"
                          }`}
                        ></div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Bands */}
                <div>
                  <h4 className="font-semibold text-gray-900 text-lg mb-3">
                    WiFi Bands
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {bands.map((band) => (
                      <label
                        key={band}
                        className={`flex items-center justify-center gap-2 cursor-pointer px-3 py-2.5 rounded-xl transition-all duration-200 font-medium text-sm ${
                          filters.bands.includes(band)
                            ? "bg-gradient-to-b from-purple-600 to-blue-600 text-white shadow-lg"
                            : "bg-gray-50 border border-gray-200 text-gray-700 hover:border-gray-300 hover:shadow-sm"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={filters.bands.includes(band)}
                          onChange={() => handleFilterChange("bands", band)}
                          className="sr-only"
                        />
                        <span>{band}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Apply Button */}
              <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-6">
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowFilters(false)}
                    className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-xl font-semibold hover:bg-gray-200 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-xl font-semibold hover:from-purple-600 hover:to-blue-600 transition-all duration-200 shadow-lg"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Help Section */}
      <div className="max-w-6xl mx-auto p-4 sm:p-6 md:p-8 lg:p-10 bg-white">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6 lg:p-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Need help choosing networking equipment?
              </h3>
              <p className="text-gray-600 mb-4 lg:mb-0">
                Use our comparison tool to side-by-side compare routers, modems,
                switches, and mesh systems based on speed, coverage, and
                features.
              </p>
            </div>
            <button
              onClick={() => navigate("/compare")}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-blue-600 transition-all duration-200 shadow-lg whitespace-nowrap"
            >
              Compare Devices
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Networking;


