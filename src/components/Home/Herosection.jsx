import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBolt,
  FaChevronDown,
  FaFire,
  FaLaptop,
  FaMobile,
  FaRupeeSign,
  FaSearch,
  FaStar,
  FaTv,
  FaWifi,
  FaArrowRight,
} from "react-icons/fa";

const DEVICE_TYPE_OPTIONS = [
  { id: "smartphones", label: "Mobile", path: "/smartphones", icon: FaMobile },
  { id: "laptops", label: "Laptop", path: "/laptops", icon: FaLaptop },
  { id: "tvs", label: "TV", path: "/tvs", icon: FaTv },
  { id: "networking", label: "Networking", path: "/networking", icon: FaWifi },
];

const PRICE_RANGE_OPTIONS = [
  {
    id: "under-10000",
    label: "\u20B910,000",
    optionLabel: "\u20B910,000",
    description: "Entry budget",
    min: 0,
    max: 10000,
    smartphoneSlug: "under-10000",
  },
  {
    id: "under-15000",
    label: "\u20B915,000",
    optionLabel: "Under \u20B915,000",
    description: "Budget sweet spot",
    min: 0,
    max: 15000,
    smartphoneSlug: "under-15000",
  },
  {
    id: "under-20000",
    label: "\u20B920,000",
    optionLabel: "Under \u20B920,000",
    description: "Best value picks",
    min: 0,
    max: 20000,
    smartphoneSlug: "under-20000",
  },
  {
    id: "under-25000",
    label: "\u20B925,000",
    optionLabel: "Under \u20B925,000",
    description: "Balanced mid-range",
    min: 0,
    max: 25000,
    smartphoneSlug: "under-25000",
  },
  {
    id: "under-30000",
    label: "\u20B930,000",
    optionLabel: "Under \u20B930,000",
    description: "Upper mid-range",
    min: 0,
    max: 30000,
    smartphoneSlug: "under-30000",
  },
  {
    id: "under-40000",
    label: "\u20B940,000",
    optionLabel: "Under \u20B940,000",
    description: "Premium value",
    min: 0,
    max: 40000,
    smartphoneSlug: "under-40000",
  },
  {
    id: "under-50000",
    label: "\u20B950,000",
    optionLabel: "Under \u20B950,000",
    description: "Flagship killers",
    min: 0,
    max: 50000,
    smartphoneSlug: "under-50000",
  },
  {
    id: "above-50000",
    label: "\u20B950,000+",
    optionLabel: "Above \u20B950,000",
    description: "Premium flagships",
    min: 50000,
    max: 9999999,
    smartphoneSlug: "above-50000",
  },
];

const FEATURE_OPTIONS_BY_DEVICE = {
  smartphones: [
    {
      id: "overall",
      label: "Overall",
      optionLabel: "Overall",
      description: "All matching results",
      icon: FaBolt,
      searchMode: null,
    },
    {
      id: "5g",
      label: "5G",
      optionLabel: "5G",
      description: "5G phones",
      icon: FaBolt,
      searchMode: "feature",
    },
    {
      id: "amoled",
      label: "AMOLED",
      optionLabel: "AMOLED",
      description: "Vivid displays",
      icon: FaBolt,
      searchMode: "feature",
    },
    {
      id: "high-refresh-rate",
      label: "120Hz+",
      optionLabel: "120Hz+",
      description: "Smooth display",
      icon: FaBolt,
      searchMode: "feature",
    },
    {
      id: "long-battery",
      label: "Long Battery",
      optionLabel: "Long Battery",
      description: "6000mAh+",
      icon: FaBolt,
      searchMode: "feature",
    },
    {
      id: "fast-charging",
      label: "Fast Charge",
      optionLabel: "Fast Charge",
      description: "65W+ charging",
      icon: FaBolt,
      searchMode: "feature",
    },
    {
      id: "gaming",
      label: "Gaming",
      optionLabel: "Gaming",
      description: "Performance phones",
      icon: FaBolt,
      searchMode: "feature",
    },
  ],
  laptops: [
    {
      id: "overall",
      label: "Overall",
      optionLabel: "Overall",
      description: "All matching results",
      icon: FaBolt,
      searchMode: null,
    },
    {
      id: "gaming",
      label: "Gaming",
      optionLabel: "Gaming",
      description: "RTX/GTX graphics",
      icon: FaLaptop,
      searchMode: "feature",
    },
    {
      id: "high-ram",
      label: "16GB+ RAM",
      optionLabel: "16GB+ RAM",
      description: "Better multitasking",
      icon: FaLaptop,
      searchMode: "feature",
    },
    {
      id: "high-storage",
      label: "512GB+ SSD",
      optionLabel: "512GB+ SSD",
      description: "Fast storage",
      icon: FaLaptop,
      searchMode: "feature",
    },
    {
      id: "lightweight",
      label: "Lightweight",
      optionLabel: "Lightweight",
      description: "Portable design",
      icon: FaLaptop,
      searchMode: "feature",
    },
    {
      id: "oled-display",
      label: "OLED Display",
      optionLabel: "OLED Display",
      description: "Vibrant panels",
      icon: FaLaptop,
      searchMode: "feature",
    },
  ],
  tvs: [
    {
      id: "overall",
      label: "Overall",
      optionLabel: "Overall",
      description: "All matching results",
      icon: FaBolt,
      searchMode: null,
    },
    {
      id: "smart-tv",
      label: "Smart TV",
      optionLabel: "Smart TV",
      description: "Built-in smart platform",
      icon: FaTv,
      searchMode: "feature",
    },
    {
      id: "ultra-hd-4k",
      label: "4K Ultra HD",
      optionLabel: "4K Ultra HD",
      description: "Sharper picture quality",
      icon: FaTv,
      searchMode: "feature",
    },
    {
      id: "high-refresh-rate",
      label: "120Hz+",
      optionLabel: "120Hz+",
      description: "Smooth motion",
      icon: FaTv,
      searchMode: "feature",
    },
    {
      id: "oled-qled",
      label: "OLED/QLED",
      optionLabel: "OLED/QLED",
      description: "Premium panel tech",
      icon: FaTv,
      searchMode: "feature",
    },
    {
      id: "gaming",
      label: "Gaming",
      optionLabel: "Gaming",
      description: "VRR / ALLM / 120Hz",
      icon: FaTv,
      searchMode: "feature",
    },
  ],
  networking: [
    {
      id: "overall",
      label: "Overall",
      optionLabel: "Overall",
      description: "All matching results",
      icon: FaBolt,
      searchMode: null,
    },
    {
      id: "wifi-7",
      label: "Wi-Fi 7",
      optionLabel: "Wi-Fi 7",
      description: "Latest wireless standard",
      icon: FaWifi,
      searchMode: "query",
      query: "Wi-Fi 7",
    },
    {
      id: "mesh",
      label: "Mesh",
      optionLabel: "Mesh",
      description: "Whole-home coverage",
      icon: FaWifi,
      searchMode: "query",
      query: "mesh",
    },
    {
      id: "dual-band",
      label: "Dual Band",
      optionLabel: "Dual Band",
      description: "2.4GHz + 5GHz performance",
      icon: FaWifi,
      searchMode: "query",
      query: "dual band",
    },
    {
      id: "gigabit",
      label: "Gigabit",
      optionLabel: "Gigabit",
      description: "Fast wired networking",
      icon: FaWifi,
      searchMode: "query",
      query: "gigabit",
    },
    {
      id: "wpa3",
      label: "WPA3",
      optionLabel: "WPA3",
      description: "Modern security",
      icon: FaWifi,
      searchMode: "query",
      query: "wpa3",
    },
  ],
};

const HERO_TRENDING_CHIP_LIMIT = 6;
const HERO_POPULAR_CARD_LIMIT = 5;

const stats = [
  { value: 50000, label: "Active Users", suffix: "+", compact: true },
  { value: 1000, label: "Device Models", suffix: "+", compact: false },
  { value: 500, label: "Comparisons Monthly", suffix: "+", compact: false },
];

const formatHeroCount = (value, compact = false) => {
  const safeValue = Number.isFinite(value) ? value : 0;
  try {
    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 0,
      notation: compact ? "compact" : "standard",
    }).format(safeValue);
  } catch {
    return String(Math.round(safeValue));
  }
};

const CountUpNumber = ({
  end,
  suffix = "",
  compact = false,
  play = false,
  duration = 1500,
}) => {
  const [current, setCurrent] = useState(play ? end : 0);

  useEffect(() => {
    if (!play) {
      setCurrent(0);
      return undefined;
    }

    let frameId = 0;
    let startTime = 0;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(end * eased));

      if (progress < 1) {
        frameId = window.requestAnimationFrame(animate);
      }
    };

    frameId = window.requestAnimationFrame(animate);

    return () => {
      if (frameId) window.cancelAnimationFrame(frameId);
    };
  }, [duration, end, play]);

  return (
    <span className="inline-flex min-w-[6ch] tabular-nums">
      {formatHeroCount(current, compact)}
      {suffix}
    </span>
  );
};

const buildHeroSearchUrl = ({ device, price, feature }) => {
  if (!device) return "/smartphones";

  const params = new URLSearchParams();

  if (device.id === "smartphones") {
    const path = price?.smartphoneSlug
      ? `/smartphones/filter/${price.smartphoneSlug}`
      : device.path;

    if (
      feature?.id &&
      feature.id !== "overall" &&
      feature.searchMode === "feature"
    ) {
      params.set("feature", feature.id);
    }

    return `${path}${params.toString() ? `?${params.toString()}` : ""}`;
  }

  if (price) {
    params.set("priceMin", String(price.min));
    params.set("priceMax", String(price.max));
  }

  if (feature?.id && feature.id !== "overall") {
    if (feature.searchMode === "feature") {
      params.set("feature", feature.id);
    } else if (feature.searchMode === "query") {
      params.set("q", feature.query || feature.label);
    }
  }

  return `${device.path}${params.toString() ? `?${params.toString()}` : ""}`;
};

const SearchDropdown = ({
  label,
  icon: Icon,
  value,
  selectedId,
  options,
  isOpen,
  onToggle,
  onSelect,
  className = "",
}) => {
  const selectedOption =
    options.find((option) => option.id === selectedId) || options[0];
  const suggestionOptions = options.filter(
    (option) => option.id !== selectedId,
  );
  const SelectedIcon = selectedOption.icon || Icon || FaBolt;

  return (
    <div className={`relative ${isOpen ? "z-[70]" : "z-10"} ${className}`}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={onToggle}
        className="group flex min-h-16 w-full flex-col justify-center bg-white px-4 py-3 text-left transition-colors duration-300 hover:bg-slate-50 sm:min-h-20 sm:px-6 sm:py-4"
      >
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 sm:text-[11px]">
          {label}
        </span>
        <span className="mt-1.5 flex items-center justify-between gap-3 sm:mt-2 sm:gap-4">
          <span className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 ring-1 ring-slate-200 transition group-hover:bg-white sm:h-10 sm:w-10">
              <Icon className="h-4 w-4" />
            </span>
            <span className="truncate text-sm font-semibold text-slate-900 sm:text-base">
              {value}
            </span>
          </span>
          <FaChevronDown
            className={`h-4 w-4 shrink-0 text-slate-400 transition ${
              isOpen
                ? "rotate-180 text-slate-500"
                : "group-hover:text-slate-500"
            }`}
          />
        </span>
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 z-[80] mb-2 w-full overflow-hidden border border-slate-200/80 bg-gradient-to-br from-white via-white to-slate-50 shadow-[0_28px_70px_rgba(15,23,42,0.18)] backdrop-blur lg:bottom-full lg:top-auto lg:mb-2 lg:mt-0">
          <div className="p-2">
            {selectedOption && (
              <button
                type="button"
                onClick={() => onSelect(selectedOption.id)}
                className="flex w-full flex-col items-start gap-2 border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-cyan-50 px-3 py-3 text-left text-slate-900 shadow-sm transition hover:border-blue-200 hover:shadow-md sm:flex-row sm:items-center sm:justify-between sm:px-4"
              >
                <span className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 ring-1 ring-blue-100 sm:h-10 sm:w-10">
                    <SelectedIcon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold leading-tight">
                      {selectedOption.optionLabel || selectedOption.label}
                    </span>
                    {selectedOption.description && (
                      <span className="mt-0.5 block text-[11px] text-slate-500 sm:text-xs">
                        {selectedOption.description}
                      </span>
                    )}
                  </span>
                </span>
                <span className="self-start whitespace-nowrap bg-blue-600/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-blue-600 sm:ml-3 sm:self-auto sm:px-3 sm:text-[10px]">
                  Selected
                </span>
              </button>
            )}

            {suggestionOptions.length > 0 && (
              <div className="my-2 h-px bg-slate-200/80" />
            )}

            <div className="max-h-56 space-y-1 overflow-y-auto pr-1 sm:max-h-64">
              {suggestionOptions.map((option) => {
                const OptionIcon = option.icon || Icon || FaBolt;

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => onSelect(option.id)}
                    className="flex w-full items-center gap-3 border border-transparent px-3 py-2.5 text-left text-slate-700 transition hover:border-slate-200/80 hover:bg-slate-50 hover:shadow-sm sm:px-4 sm:py-3"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 ring-1 ring-slate-200 transition sm:h-10 sm:w-10">
                      <OptionIcon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold leading-tight">
                        {option.optionLabel || option.label}
                      </span>
                      {option.description && (
                        <span className="mt-0.5 block text-[11px] text-slate-500 sm:text-xs">
                          {option.description}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const HeroSection = () => {
  const navigate = useNavigate();
  const heroSearchRef = useRef(null);
  const heroStatsRef = useRef(null);
  const [selectedDeviceType, setSelectedDeviceType] = useState("smartphones");
  const [selectedPriceRange, setSelectedPriceRange] = useState("under-10000");
  const [selectedFeature, setSelectedFeature] = useState("overall");
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [heroStatsInView, setHeroStatsInView] = useState(false);
  const [featuredPhones, setFeaturedPhones] = useState([]);
  const [featuredPhonesLoading, setFeaturedPhonesLoading] = useState(false);
  const trendingSearches = useMemo(() => {
    const names = featuredPhones
      .map((device) => device?.name || "")
      .filter(Boolean);
    return Array.from(new Set(names)).slice(0, HERO_TRENDING_CHIP_LIMIT);
  }, [featuredPhones]);
  const featuredDevices = useMemo(
    () => featuredPhones.slice(0, HERO_POPULAR_CARD_LIMIT),
    [featuredPhones],
  );

  const selectedDevice =
    DEVICE_TYPE_OPTIONS.find((option) => option.id === selectedDeviceType) ||
    DEVICE_TYPE_OPTIONS[0];
  const selectedPrice =
    PRICE_RANGE_OPTIONS.find((option) => option.id === selectedPriceRange) ||
    PRICE_RANGE_OPTIONS[0];
  const currentFeatureOptions =
    FEATURE_OPTIONS_BY_DEVICE[selectedDevice.id] ||
    FEATURE_OPTIONS_BY_DEVICE.smartphones;
  const selectedFeatureOption =
    currentFeatureOptions.find((option) => option.id === selectedFeature) ||
    currentFeatureOptions[0];

  useEffect(() => {
    if (!heroSearchRef.current) return undefined;

    const handlePointerDown = (event) => {
      if (!heroSearchRef.current?.contains(event.target)) {
        setActiveDropdown(null);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setActiveDropdown(null);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (
      !currentFeatureOptions.some((option) => option.id === selectedFeature)
    ) {
      setSelectedFeature("overall");
    }
  }, [currentFeatureOptions, selectedFeature]);

  useEffect(() => {
    const node = heroStatsRef.current;
    if (!node) return undefined;

    if (typeof IntersectionObserver === "undefined") {
      setHeroStatsInView(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHeroStatsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 },
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    const loadPopularDevices = async () => {
      setFeaturedPhonesLoading(true);
      try {
        const url =
          "https://api.apisphere.in/api/public/search-popularity?productType=smartphone&limit=5";
        const response = await fetch(url, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const json = await response.json();
        const devices = Array.isArray(json?.devices) ? json.devices : [];

        if (!mounted) return;

        const mappedDevices = devices.length
          ? devices.map((device, index) => ({
              id: device?.product_id ?? device?.id ?? `device-${index + 1}`,
              name: device?.name || `Device ${index + 1}`,
              short:
                device?.brand_name ||
                String(device?.name || "")
                  .split(" ")
                  .slice(0, 2)
                  .map((part) => part.slice(0, 1).toUpperCase())
                  .join("") ||
                `D${index + 1}`,
              image: device?.image_url || "",
              badge: device?.badge || "Popular",
              detailPath: device?.detail_path || "/smartphones",
              brandName: device?.brand_name || "Smartphone",
              searchCount: device?.search_count_30d || 0,
              score: device?.search_popularity_score || 0,
              rank: device?.hero_rank || index + 1,
            }))
          : [];

        setFeaturedPhones(mappedDevices.slice(0, 5));
      } catch (error) {
        if (error?.name !== "AbortError") {
          setFeaturedPhones([]);
        }
      } finally {
        if (mounted) setFeaturedPhonesLoading(false);
      }
    };

    loadPopularDevices();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, []);

  const handleSearch = (event) => {
    event?.preventDefault?.();
    trackSearchInterest({
      query: selectedDevice.id,
      device_type: selectedDevice.id,
      source: "hero",
    });
    navigate(
      buildHeroSearchUrl({
        device: selectedDevice,
        price: selectedPrice,
        feature: selectedFeatureOption,
      }),
    );
  };

  const selectAndClose = (setter) => (nextValue) => {
    setter(nextValue);
    setActiveDropdown(null);
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
    } catch {
      // analytics should not block navigation
    }
  };

  return (
    <section className="relative isolate overflow-visible bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950">
      <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:72px_72px]" />
      <div className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-[#1e40af]/20 blur-3xl animate-pulse" />
      <div
        className="absolute right-0 top-20 h-80 w-80 rounded-full bg-[#06b6b4]/20 blur-3xl animate-pulse"
        style={{ animationDelay: "1s" }}
      />
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/10 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-10 sm:px-6 sm:pb-20 sm:pt-16 lg:px-8 lg:pb-24 lg:pt-24">
        <div className="mx-auto max-w-5xl text-center">
          <h1 className="mt-6 text-3xl font-black leading-[1.05] text-white sm:mt-8 sm:text-5xl lg:text-6xl">
            <span className="block">Find Your Perfect</span>
            <span className="bg-gradient-to-r from-yellow-200 via-blue-200 to-purple-100 bg-clip-text text-transparent animate-pulse">
              Device
            </span>
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base font-medium leading-7 text-white/85 sm:mt-6 sm:text-xl sm:leading-8">
            Smart comparisons, real-time prices, and expert insights to help you
            make the right choice - instantly.
          </p>

          <div
            ref={heroStatsRef}
            className="mt-8 grid grid-cols-3 gap-2 sm:grid-cols-1 sm:gap-3 lg:flex lg:justify-center lg:gap-6"
          >
            {stats.map((stat, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 border-0 bg-transparent px-0 py-0 text-left sm:gap-3 sm:rounded-2xl sm:border sm:border-white/10 sm:bg-white/5 sm:px-4 sm:py-3 lg:rounded-none lg:border-0 lg:bg-transparent lg:px-0 lg:py-0"
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20 sm:h-12 sm:w-12">
                  <span className="text-base font-bold text-cyan-200">✓</span>
                </div>
                <div className="min-w-0">
                  <p className="text-base font-black leading-none tracking-tight text-white sm:text-2xl">
                    <CountUpNumber
                      end={stat.value}
                      suffix={stat.suffix}
                      compact={stat.compact}
                      play={heroStatsInView}
                    />
                  </p>
                  <p className="text-[10px] leading-none text-white/70 sm:text-xs">
                    {stat.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div ref={heroSearchRef} className="mx-auto mt-10 max-w-5xl sm:mt-14">
          <form
            onSubmit={handleSearch}
            className="overflow-visible bg-white/10 shadow-2xl  backdrop-blur"
          >
            <div className="border-b border-slate-100 bg-white px-4 py-3 sm:px-6 sm:py-4">
              <p className="text-sm font-semibold text-slate-900">
                Quick Search
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto]">
              <SearchDropdown
                label="Device Type"
                icon={selectedDevice.icon}
                value={selectedDevice.label}
                selectedId={selectedDevice.id}
                options={DEVICE_TYPE_OPTIONS}
                isOpen={activeDropdown === "device"}
                onToggle={() =>
                  setActiveDropdown((current) =>
                    current === "device" ? null : "device",
                  )
                }
                onSelect={selectAndClose(setSelectedDeviceType)}
                className="border-b border-slate-100 lg:border-b-0 lg:border-r"
              />

              <SearchDropdown
                label="Price Range"
                icon={FaRupeeSign}
                value={selectedPrice.label}
                selectedId={selectedPrice.id}
                options={PRICE_RANGE_OPTIONS}
                isOpen={activeDropdown === "price"}
                onToggle={() =>
                  setActiveDropdown((current) =>
                    current === "price" ? null : "price",
                  )
                }
                onSelect={selectAndClose(setSelectedPriceRange)}
                className="border-b border-slate-100 lg:border-b-0 lg:border-r"
              />

              <SearchDropdown
                label="Features"
                icon={selectedFeatureOption.icon || FaBolt}
                value={selectedFeatureOption.label}
                selectedId={selectedFeatureOption.id}
                options={currentFeatureOptions}
                isOpen={activeDropdown === "feature"}
                onToggle={() =>
                  setActiveDropdown((current) =>
                    current === "feature" ? null : "feature",
                  )
                }
                onSelect={selectAndClose(setSelectedFeature)}
                className="border-b border-slate-100 lg:border-b-0 lg:border-r"
              />

              <button
                type="submit"
                className="group relative flex w-full min-h-16 items-center justify-center gap-3 bg-gradient-to-br from-[#1e40af] to-[#3962e7] px-4 py-3 text-white transition-all duration-300  active:scale-95 sm:min-h-20 sm:px-8 sm:py-4 lg:w-auto"
              >
                <span className="flex h-12 w-12 items-center justify-center  transition group-hover:bg-white/25 sm:h-14 sm:w-14">
                  <FaSearch className="h-4 w-4 sm:h-5 sm:w-5" />
                </span>
                <div className="text-left">
                  <p className="text-xs font-bold sm:text-sm">Explore Now</p>
                  <p className="text-[11px] text-white/70 sm:text-xs">
                    Find your match
                  </p>
                </div>
              </button>
            </div>
          </form>
        </div>

        <div className="mt-10 sm:mt-12">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            <span className="inline-flex items-center gap-2 whitespace-nowrap text-xs font-bold uppercase tracking-[0.3em] text-white/80">
              <FaFire className="h-3.5 w-3.5 text-yellow-300" />
              Trending Searches
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          </div>

          <div className="mt-5 flex items-center justify-start gap-2 overflow-x-auto pb-2 no-scrollbar sm:mt-6 sm:justify-center sm:gap-3">
            {trendingSearches.map((item, idx) => (
              <button
                key={item}
                type="button"
                onClick={() =>
                  navigate(`/smartphones?q=${encodeURIComponent(item)}`)
                }
                className="group relative rounded-3xl whitespace-nowrap border border-white/25  px-4 py-2 text-xs font-semibold text-white/95  transition-all duration-300 hover:border-white/40 hover:bg-white/15 hover:shadow-lg sm:px-5 sm:py-2.5 sm:text-sm"
              >
                <span className="flex items-center gap-2">
                  {idx === 0 && <FaFire className="h-3 w-3 text-yellow-300" />}
                  {item}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-12 sm:mt-16">
          <div className="space-y-1 text-center sm:space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-white/70 sm:text-xs sm:tracking-[0.3em]">
              Popular Choices
            </p>
            <h2 className="text-xl font-bold text-white sm:text-2xl">
              Most Searched Devices
            </h2>
            <p className="text-[11px] font-medium text-white/65">
              {featuredPhonesLoading
                ? "Updating the ranking from recent search activity..."
                : "Live ranking from recent search activity."}
            </p>
          </div>

          <div className="mt-8">
            {featuredDevices.length > 0 ? (
              <div className="no-scrollbar grid grid-flow-col auto-cols-[minmax(14.5rem,72vw)] gap-4 overflow-x-auto pb-2 snap-x snap-mandatory sm:grid-flow-row sm:auto-cols-auto sm:overflow-visible sm:pb-0 sm:grid-cols-2 lg:grid-cols-5">
                {featuredDevices.map((phone) => (
                  <button
                    key={phone.id || phone.name}
                    type="button"
                    onClick={() =>
                      navigate(
                        phone.detailPath ||
                          `/smartphones?q=${encodeURIComponent(phone.name)}`,
                      )
                    }
                    className="group relative flex snap-start flex-col gap-3 p-4 text-left text-white/95 transition-all duration-300"
                  >
                    <div className="flex h-50 w-full items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-white/20 via-white/10 to-cyan-300/5 ring-1 ring-white/15">
                      {phone.image ? (
                        <img
                          src={phone.image}
                          alt={phone.name}
                          className="h-full w-full object-contain p-3 transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <span className="text-lg font-bold tracking-wide text-white/60">
                          {phone.short}
                        </span>
                      )}
                    </div>

                    <div className="flex-1">
                      <p className="text-sm font-bold leading-snug text-white">
                        {phone.name}
                      </p>
                      <p className="mt-1 text-[11px] font-medium text-white/65">
                        {phone.brandName}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-2 border-t border-white/10 pt-2">
                      <span className="text-xs font-medium text-white/70">
                        View Details
                      </span>
                      <span className="transition-transform group-hover:translate-x-1">
                        <FaArrowRight className="h-3 w-3 text-white/70" />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-white/15 bg-white/5 p-6 text-center text-white/80">
                {featuredPhonesLoading
                  ? "Loading live devices..."
                  : "No live devices available right now."}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
