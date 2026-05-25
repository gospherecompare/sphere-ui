import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowRight,
  FaBolt,
  FaChartLine,
  FaExchangeAlt,
  FaLaptop,
  FaMobileAlt,
  FaNetworkWired,
  FaRegLightbulb,
  FaSearch,
  FaSignal,
  FaTv,
} from "react-icons/fa";
import useDevice from "../../hooks/useDevice";
import { createProductPath } from "../../utils/slugGenerator";
import "../../styles/hideScrollbar.css";

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL || "https://api.apisphere.in/api"
).replace(/\/$/, "");

const CATEGORY_META = [
  {
    id: "smartphones",
    label: "Smartphones",
    path: "/smartphones",
    productPathType: "smartphones",
    icon: FaMobileAlt,
  },
  {
    id: "laptops",
    label: "Laptops",
    path: "/laptops",
    productPathType: "laptops",
    icon: FaLaptop,
  },
  {
    id: "tvs",
    label: "TVs",
    path: "/tvs",
    productPathType: "tvs",
    icon: FaTv,
  },
  {
    id: "networking",
    label: "Networking",
    path: "/networking",
    productPathType: "networking",
    icon: FaNetworkWired,
  },
];

const HERO_POPULAR_CARD_LIMIT = 5;

const firstText = (...values) => {
  for (const value of values) {
    if (value == null) continue;
    if (Array.isArray(value)) {
      const nested = firstText(...value);
      if (nested) return nested;
      continue;
    }
    const text = String(value).trim();
    if (text && text !== "[object Object]") return text;
  }
  return "";
};

const parseJsonArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return [];
  const trimmed = value.trim();
  if (!trimmed.startsWith("[") && !trimmed.startsWith("{")) return [];
  try {
    const parsed = JSON.parse(trimmed);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return [];
  }
};

const parsePriceNumber = (value) => {
  if (value == null || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const numeric = Number(String(value).replace(/[^0-9.]/g, ""));
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
};

const formatCount = (value) => {
  const safeValue = Number(value) || 0;
  try {
    return new Intl.NumberFormat("en-IN", {
      notation: safeValue >= 1000 ? "compact" : "standard",
      maximumFractionDigits: 1,
    }).format(safeValue);
  } catch {
    return String(safeValue);
  }
};

const formatPrice = (value) => {
  const price = parsePriceNumber(value);
  if (!price) return "";
  try {
    return `Rs. ${new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: 0,
    }).format(price)}`;
  } catch {
    return `Rs. ${Math.round(price)}`;
  }
};

const resolveCategoryFromType = (value = "") => {
  const text = String(value || "").toLowerCase();
  if (text.includes("laptop") || text.includes("notebook")) return "laptops";
  if (
    text.includes("tv") ||
    text.includes("television") ||
    text.includes("appliance")
  ) {
    return "tvs";
  }
  if (
    text.includes("network") ||
    text.includes("router") ||
    text.includes("wifi")
  ) {
    return "networking";
  }
  return "smartphones";
};

const normalizeSmartphoneDetailPath = (rawPath = "", fallbackName = "") => {
  const pathValue = String(rawPath || "").trim();
  if (pathValue) {
    try {
      const url = new URL(pathValue, "https://hook.local");
      const pathname = url.pathname.replace(/\/+$/g, "");
      if (pathname.startsWith("/smartphones/")) {
        const tail = pathname.slice("/smartphones/".length);
        if (tail && !tail.includes("/")) {
          return createProductPath("smartphones", tail);
        }
      }
    } catch {
      // Fall back to the product name if an API path is malformed.
    }
  }

  return fallbackName
    ? createProductPath("smartphones", fallbackName)
    : "/smartphones";
};

const getImages = (item) => [
  firstText(
    item?.image,
    item?.image_url,
    item?.imageUrl,
    item?.product_image,
    item?.productImage,
    item?.thumbnail,
  ),
  firstText(parseJsonArray(item?.images)?.[0]),
  firstText(parseJsonArray(item?.images_json)?.[0]),
  firstText(item?.metadata?.images?.[0]),
].filter(Boolean);

const getVariants = (item) => {
  if (Array.isArray(item?.variants)) return item.variants;
  if (Array.isArray(item?.variants_json)) return item.variants_json;
  return parseJsonArray(item?.variants_json || item?.variants);
};

const getLowestPrice = (item) => {
  const prices = [
    parsePriceNumber(item?.price),
    parsePriceNumber(item?.base_price),
    parsePriceNumber(item?.basePrice),
    parsePriceNumber(item?.starting_price),
    parsePriceNumber(item?.min_price),
    parsePriceNumber(item?.minPrice),
  ].filter(Boolean);

  getVariants(item).forEach((variant) => {
    prices.push(
      ...[
        parsePriceNumber(variant?.price),
        parsePriceNumber(variant?.base_price),
        parsePriceNumber(variant?.basePrice),
      ].filter(Boolean),
    );

    const stores = Array.isArray(variant?.store_prices)
      ? variant.store_prices
      : Array.isArray(variant?.storePrices)
        ? variant.storePrices
        : [];
    stores.forEach((store) => {
      const storePrice = parsePriceNumber(store?.price);
      if (storePrice) prices.push(storePrice);
    });
  });

  const storePrices = Array.isArray(item?.store_prices)
    ? item.store_prices
    : Array.isArray(item?.storePrices)
      ? item.storePrices
      : [];
  storePrices.forEach((store) => {
    const storePrice = parsePriceNumber(store?.price);
    if (storePrice) prices.push(storePrice);
  });

  return prices.length ? Math.min(...prices) : null;
};

const getPrimarySpec = (item) =>
  firstText(
    item?.chipset,
    item?.processor,
    item?.performance?.chipset,
    item?.performance?.processor,
    item?.display?.screen_size,
    item?.display?.display_size,
    item?.screen_size,
    item?.network?.wifi,
    item?.connectivity?.wifi,
  );

const normalizeCard = (item, fallbackCategory = "smartphones", source = "") => {
  const name = firstText(
    item?.name,
    item?.product_name,
    item?.productName,
    item?.model,
    item?.title,
  );
  if (!name) return null;

  const categoryId =
    fallbackCategory ||
    resolveCategoryFromType(
      firstText(item?.product_type, item?.productType, item?.deviceType),
    );
  const category =
    CATEGORY_META.find((entry) => entry.id === categoryId) || CATEGORY_META[0];
  const price = getLowestPrice(item);
  const image = getImages(item)[0] || "";
  const brand = firstText(item?.brand, item?.brand_name, item?.brandName);
  const signal = Number(
    item?.trend_score ??
      item?.trending_score ??
      item?.search_popularity_score ??
      item?.search_count_30d ??
      0,
  );

  return {
    id: firstText(item?.product_id, item?.productId, item?.id, name),
    name,
    brand,
    categoryId: category.id,
    categoryLabel: category.label,
    image,
    price,
    priceLabel: formatPrice(price),
    spec: getPrimarySpec(item),
    source,
    signal: Number.isFinite(signal) ? signal : 0,
    path: createProductPath(category.productPathType, name),
  };
};

const normalizePopularDevice = (device, index) => {
  const name = firstText(
    device?.name,
    device?.product_name,
    device?.productName,
    device?.model,
  );
  if (!name) return null;

  const searchCount = Number(
    device?.search_count_30d ??
      device?.searchCount30d ??
      device?.search_count ??
      0,
  );
  const score = Number(
    device?.search_popularity_score ??
      device?.popularity_score ??
      device?.score ??
      0,
  );

  return {
    id: firstText(device?.product_id, device?.productId, device?.id, name),
    name,
    brand: firstText(device?.brand_name, device?.brandName, device?.brand),
    categoryId: "smartphones",
    categoryLabel: "Smartphones",
    image: firstText(
      device?.image_url,
      device?.imageUrl,
      device?.image,
      device?.thumbnail,
    ),
    price: null,
    priceLabel: "",
    spec: searchCount ? `${formatCount(searchCount)} searches in 30 days` : "",
    source: "popular",
    signal: Number.isFinite(score) ? score : 0,
    path: normalizeSmartphoneDetailPath(
      firstText(device?.detail_path, device?.detailPath),
      name,
    ),
    rank: Number(device?.hero_rank ?? device?.rank ?? index + 1),
    searchCount: Number.isFinite(searchCount) ? searchCount : 0,
  };
};

const dedupeCards = (cards) => {
  const seen = new Set();
  const output = [];
  for (const card of cards) {
    if (!card?.name) continue;
    const key = `${card.categoryId}:${card.name}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(card);
  }
  return output;
};

const HeroSection = () => {
  const navigate = useNavigate();
  const {
    smartphone,
    smartphoneAll,
    laptops,
    homeAppliances,
    networking,
    brands,
  } = useDevice();
  const [activeCategory, setActiveCategory] = useState("smartphones");
  const [searchQuery, setSearchQuery] = useState("");
  const [liveTrending, setLiveTrending] = useState([]);
  const [featuredPhones, setFeaturedPhones] = useState([]);
  const [featuredPhonesLoading, setFeaturedPhonesLoading] = useState(false);

  const categoryRows = useMemo(() => {
    const phones = Array.isArray(smartphoneAll) && smartphoneAll.length
      ? smartphoneAll
      : Array.isArray(smartphone)
        ? smartphone
        : [];

    const sourceMap = {
      smartphones: phones,
      laptops: Array.isArray(laptops) ? laptops : [],
      tvs: Array.isArray(homeAppliances) ? homeAppliances : [],
      networking: Array.isArray(networking) ? networking : [],
    };

    return CATEGORY_META.map((category) => ({
      ...category,
      items: sourceMap[category.id] || [],
      count: (sourceMap[category.id] || []).length,
    }));
  }, [homeAppliances, laptops, networking, smartphone, smartphoneAll]);

  useEffect(() => {
    const firstAvailable = categoryRows.find((category) => category.count > 0);
    const current = categoryRows.find((category) => category.id === activeCategory);
    if (firstAvailable && (!current || current.count === 0)) {
      setActiveCategory(firstAvailable.id);
    }
  }, [activeCategory, categoryRows]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const loadTrending = async () => {
      try {
        const response = await fetch(`${API_BASE}/public/trending/all`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const payload = await response.json();
        const rows = Array.isArray(payload?.trending)
          ? payload.trending
          : Array.isArray(payload?.results)
            ? payload.results
            : Array.isArray(payload?.data)
              ? payload.data
              : [];
        if (!cancelled) setLiveTrending(rows);
      } catch (error) {
        if (!cancelled && error?.name !== "AbortError") setLiveTrending([]);
      }
    };

    loadTrending();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    const loadPopularDevices = async () => {
      setFeaturedPhonesLoading(true);
      try {
        const response = await fetch(
          `${API_BASE}/public/search-popularity?productType=smartphone&limit=${HERO_POPULAR_CARD_LIMIT}`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const json = await response.json();
        const devices = Array.isArray(json?.devices)
          ? json.devices
          : Array.isArray(json?.data)
            ? json.data
            : [];

        if (!mounted) return;

        setFeaturedPhones(
          devices
            .map((device, index) => normalizePopularDevice(device, index))
            .filter(Boolean)
            .slice(0, HERO_POPULAR_CARD_LIMIT),
        );
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

  const allStoreCards = useMemo(
    () =>
      dedupeCards(
        categoryRows.flatMap((category) =>
          category.items
            .map((item) => normalizeCard(item, category.id, "catalog"))
            .filter(Boolean),
        ),
      ),
    [categoryRows],
  );

  const liveCards = useMemo(
    () =>
      dedupeCards(
        liveTrending
          .map((item) =>
            normalizeCard(
              item,
              resolveCategoryFromType(
                firstText(item?.product_type, item?.productType, item?.deviceType),
              ),
              "live",
            ),
          )
          .filter(Boolean),
      ),
    [liveTrending],
  );

  const discoveryCards = useMemo(
    () =>
      dedupeCards([...liveCards, ...allStoreCards]).sort(
        (left, right) => right.signal - left.signal,
      ),
    [allStoreCards, liveCards],
  );

  const activeCategoryMeta =
    categoryRows.find((category) => category.id === activeCategory) ||
    categoryRows[0] ||
    CATEGORY_META[0];
  const featuredDevices = useMemo(
    () => featuredPhones.slice(0, HERO_POPULAR_CARD_LIMIT),
    [featuredPhones],
  );
  const featuredDevice = featuredDevices[0] || null;
  const featuredRail = featuredDevices.slice(1);
  const searchPool = useMemo(
    () => dedupeCards([...featuredDevices, ...discoveryCards]),
    [discoveryCards, featuredDevices],
  );
  const visibleStats = [
    {
      label: "Indexed devices",
      value: allStoreCards.length,
      icon: FaSignal,
    },
    {
      label: `${activeCategoryMeta.label} available`,
      value: activeCategoryMeta.count,
      icon: activeCategoryMeta.icon,
    },
    {
      label: "Active brands",
      value: Array.isArray(brands) ? brands.length : 0,
      icon: FaRegLightbulb,
    },
    {
      label: "Live signals",
      value: liveCards.length,
      icon: FaChartLine,
    },
  ];

  const dynamicChips = useMemo(() => {
    const brandChips = (Array.isArray(brands) ? brands : [])
      .map((brand) => firstText(brand?.name, brand))
      .filter(Boolean);
    const productChips = searchPool.map((card) => card.name).filter(Boolean);
    return Array.from(new Set([...productChips, ...brandChips])).slice(0, 9);
  }, [brands, searchPool]);

  const searchSuggestions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];
    return searchPool
      .filter((card) =>
        [card.name, card.brand, card.categoryLabel, card.spec]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query),
      )
      .slice(0, 5);
  }, [searchPool, searchQuery]);

  const submitSearch = (event) => {
    event?.preventDefault?.();
    const query = searchQuery.trim();
    const target = query
      ? `${activeCategoryMeta.path}?q=${encodeURIComponent(query)}`
      : activeCategoryMeta.path;
    navigate(target);
  };

  const openCard = (card) => {
    if (!card) return;
    navigate(card.path);
  };

  return (
    <section className="relative overflow-hidden bg-[#02030B] text-white">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#020617_0%,#090B2E_24%,#24105E_50%,#073C8C_76%,#050712_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(14,165,233,0.34),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(168,85,247,0.42),transparent_34%),radial-gradient(circle_at_54%_82%,rgba(59,130,246,0.28),transparent_40%)]" />
      <div className="absolute left-[-58%] top-[7%] h-28 w-[34rem] -rotate-12 rounded-[999px] bg-gradient-to-r from-cyan-400/18 via-blue-500/24 to-fuchsia-500/22 blur-2xl sm:left-[-18%] sm:h-32 sm:w-[58rem]" />
      <div className="absolute right-[-72%] top-[38%] h-32 w-[34rem] rotate-12 rounded-[999px] bg-gradient-to-r from-purple-600/24 via-blue-500/22 to-sky-400/16 blur-2xl sm:right-[-22%] sm:top-[34%] sm:h-40 sm:w-[54rem]" />
      <div className="absolute bottom-[-16%] left-[-36%] h-56 w-[36rem] rounded-[999px] bg-gradient-to-r from-blue-600/18 via-violet-600/24 to-fuchsia-500/18 blur-3xl sm:bottom-[-20%] sm:left-[12%] sm:h-72 sm:w-[68rem]" />
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-45 mix-blend-screen sm:opacity-90"
        viewBox="0 0 1440 760"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="heroCircuit" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.18" />
            <stop offset="42%" stopColor="#3B82F6" stopOpacity="0.72" />
            <stop offset="100%" stopColor="#D946EF" stopOpacity="0.34" />
          </linearGradient>
          <linearGradient id="heroPulse" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0" />
            <stop offset="50%" stopColor="#C084FC" stopOpacity="0.92" />
            <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M-40 160H196C242 160 250 226 304 226H512C577 226 586 112 660 112H862C936 112 956 218 1034 218H1480"
          stroke="url(#heroCircuit)"
          strokeWidth="2"
          fill="none"
        />
        <path
          d="M-70 520H226C280 520 304 444 360 444H566C646 444 652 584 732 584H918C998 584 1000 480 1080 480H1490"
          stroke="url(#heroPulse)"
          strokeWidth="2"
          fill="none"
        />
        <path
          d="M214 160V86H418M862 112V52H1084M566 444V374H748M1034 218V302H1202"
          stroke="rgba(191,219,254,0.28)"
          strokeWidth="1.5"
          fill="none"
        />
        <rect
          x="104"
          y="92"
          width="110"
          height="188"
          rx="22"
          stroke="rgba(191,219,254,0.3)"
          strokeWidth="2"
          fill="rgba(37,99,235,0.08)"
        />
        <rect
          x="1124"
          y="114"
          width="188"
          height="116"
          rx="18"
          stroke="rgba(216,180,254,0.32)"
          strokeWidth="2"
          fill="rgba(168,85,247,0.08)"
        />
        <rect
          x="1030"
          y="520"
          width="142"
          height="88"
          rx="16"
          stroke="rgba(125,211,252,0.3)"
          strokeWidth="2"
          fill="rgba(14,165,233,0.07)"
        />
        <path
          d="M1082 608H1120M1120 608L1132 636H1070L1082 608Z"
          stroke="rgba(125,211,252,0.26)"
          strokeWidth="2"
          fill="none"
        />
        <path
          d="M128 138H190M128 168H178M128 198H184M1156 154H1276M1156 184H1238M1060 554H1140M1060 580H1116"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {[
          [196, 160],
          [304, 226],
          [660, 112],
          [862, 112],
          [1034, 218],
          [360, 444],
          [732, 584],
          [1080, 480],
        ].map(([cx, cy]) => (
          <circle
            key={`${cx}-${cy}`}
            cx={cx}
            cy={cy}
            r="5"
            fill="#BAE6FD"
            opacity="0.54"
          />
        ))}
      </svg>
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#02030B] to-transparent sm:h-28" />

      <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-8 sm:px-6 sm:pb-20 sm:pt-16 lg:px-8 lg:pb-24 lg:pt-20">
        <div className="grid items-center gap-8 sm:gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
          <div className="min-w-0">
            <p className="inline-flex max-w-full items-center gap-2 rounded-md border border-cyan-200/20 bg-blue-500/12 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.06em] text-blue-100 shadow-[0_0_32px_rgba(14,165,233,0.16)] backdrop-blur sm:text-[11px]">
              <FaBolt className="h-3 w-3 text-sky-300" />
              Live Gadget Intelligence
            </p>

            <h1 className="mt-5 max-w-3xl text-[2.45rem] font-black leading-[0.98] text-white sm:mt-6 sm:text-5xl sm:leading-[1.02] lg:text-6xl">
              Find the gadget
              <span className="block bg-gradient-to-r from-sky-200 via-white to-fuchsia-200 bg-clip-text text-transparent">
                worth buying next.
              </span>
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-blue-100/78 sm:mt-5 sm:text-lg sm:leading-7">
              Search once and see what is worth shortlisting, from specs and
              variants to prices, launches, and real buyer interest.
            </p>

            <form
              onSubmit={submitSearch}
              className="mt-6 w-full max-w-2xl overflow-hidden rounded-lg border border-cyan-200/18 bg-[#070B24]/76 p-2 shadow-[0_30px_100px_rgba(37,99,235,0.22)] backdrop-blur-xl sm:mt-8 sm:shadow-[0_30px_100px_rgba(37,99,235,0.28)]"
            >
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative min-w-0 flex-1">
                  <FaSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-100/55" />
                  <input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder={`Search ${activeCategoryMeta.label.toLowerCase()}...`}
                    className="h-12 w-full rounded-md border border-blue-200/12 bg-[#071024]/92 py-3 pl-11 pr-4 text-sm font-medium text-white outline-none transition focus:border-cyan-300/70 focus:ring-2 focus:ring-cyan-400/24 sm:h-[52px]"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-gradient-to-r from-sky-400 via-blue-500 to-fuchsia-500 px-5 text-sm font-bold text-white shadow-[0_16px_36px_rgba(59,130,246,0.34)] transition hover:brightness-110 sm:h-[52px] sm:w-auto"
                >
                  Discover
                  <FaArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              {searchSuggestions.length > 0 ? (
                <div className="mt-2 overflow-hidden rounded-md border border-cyan-200/14 bg-[#070C1B]/95 shadow-[0_18px_50px_rgba(14,165,233,0.16)]">
                  {searchSuggestions.map((card) => (
                    <button
                      key={`${card.categoryId}-${card.name}`}
                      type="button"
                      onClick={() => openCard(card)}
                      className="flex w-full items-center gap-3 border-b border-white/8 px-3 py-3 text-left transition last:border-b-0 hover:bg-white/8"
                    >
                      <ProductThumb card={card} className="h-10 w-10" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-white">
                          {card.name}
                        </span>
                        <span className="block truncate text-xs text-blue-100/60">
                          {[card.brand, card.categoryLabel, card.priceLabel]
                            .filter(Boolean)
                            .join(" / ")}
                        </span>
                      </span>
                      <FaArrowRight className="h-3 w-3 text-blue-100/50" />
                    </button>
                  ))}
                </div>
              ) : null}
            </form>

            <div className="no-scrollbar mt-5 flex w-full flex-nowrap gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
              {categoryRows.map((category) => {
                const Icon = category.icon;
                const isActive = category.id === activeCategory;
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setActiveCategory(category.id)}
                    className={`inline-flex shrink-0 items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold transition ${
                      isActive
                        ? "border-fuchsia-300/55 bg-gradient-to-r from-blue-500/24 to-fuchsia-500/20 text-white shadow-[0_12px_34px_rgba(168,85,247,0.18)]"
                        : "border-white/10 bg-[#0B1230]/58 text-blue-100/76 hover:border-cyan-200/24 hover:bg-blue-500/12"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {category.label}
                    <span className="text-xs text-blue-100/55">
                      {formatCount(category.count)}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
              <button
                type="button"
                onClick={() => navigate("/compare")}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-cyan-200/20 bg-blue-500/14 px-3 py-3 text-center text-xs font-bold text-white transition hover:border-sky-300/50 hover:bg-blue-400/18 sm:px-4 sm:text-sm"
              >
                <FaExchangeAlt className="h-3.5 w-3.5 text-sky-300" />
                Start comparison
              </button>
              <button
                type="button"
                onClick={() => navigate("/trending/smartphones")}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-fuchsia-200/20 bg-purple-500/14 px-3 py-3 text-center text-xs font-bold text-white transition hover:border-purple-300/50 hover:bg-purple-400/18 sm:px-4 sm:text-sm"
              >
                <FaChartLine className="h-3.5 w-3.5 text-purple-200" />
                View trends
              </button>
            </div>

            {dynamicChips.length > 0 ? (
              <div className="no-scrollbar mt-5 flex w-full gap-2 overflow-x-auto pb-1 sm:mt-6">
                {dynamicChips.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => {
                      setSearchQuery(chip);
                      navigate(
                        `${activeCategoryMeta.path}?q=${encodeURIComponent(chip)}`,
                      );
                    }}
                    className="shrink-0 rounded-md border border-white/10 bg-[#0B1230]/58 px-3 py-2 text-xs font-semibold text-blue-100/80 transition hover:border-sky-300/40 hover:bg-blue-500/14 hover:text-white"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="relative min-w-0">
            <div className="absolute -inset-3 rounded-lg bg-[conic-gradient(from_150deg_at_50%_50%,rgba(34,211,238,0.34),rgba(37,99,235,0.28),rgba(168,85,247,0.34),rgba(217,70,239,0.28),rgba(34,211,238,0.34))] opacity-70 blur-3xl sm:-inset-4 sm:opacity-80" />
            <div className="relative overflow-hidden rounded-lg border border-white/14 bg-[#050817]/88 p-3 shadow-[0_26px_90px_rgba(30,64,175,0.28)] backdrop-blur-xl sm:p-4 sm:shadow-[0_34px_130px_rgba(30,64,175,0.34)]">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(14,165,233,0.24),transparent_28%),radial-gradient(circle_at_92%_12%,rgba(217,70,239,0.28),transparent_30%),linear-gradient(150deg,rgba(37,99,235,0.18),rgba(88,28,135,0.22)_68%,rgba(4,10,30,0))]" />
              <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/70 to-transparent" />

              <div className="relative flex items-start justify-between gap-3">
                <div>
                  <span className="inline-flex rounded-md border border-cyan-200/18 bg-cyan-300/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-100">
                    Popular Choices
                  </span>
                  <h2 className="mt-3 max-w-[14rem] text-xl font-black leading-[1.05] text-white sm:text-2xl">
                    Most Searched
                    <span className="block bg-gradient-to-r from-cyan-200 to-fuchsia-200 bg-clip-text text-transparent">
                      Devices
                    </span>
                  </h2>
                  <p className="mt-2 text-xs font-medium text-blue-100/62">
                    {featuredPhonesLoading
                      ? "Updating the ranking..."
                      : "Live demand signals from recent searches."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/smartphones")}
                  className="inline-flex shrink-0 items-center gap-2 rounded-md border border-fuchsia-200/22 bg-white/[0.06] px-2.5 py-2 text-xs font-bold text-fuchsia-50/86 transition hover:border-cyan-200/38 hover:bg-cyan-300/12 hover:text-white sm:px-3"
                >
                  Browse
                  <FaArrowRight className="h-3 w-3" />
                </button>
              </div>

              {featuredDevice ? (
                <button
                  type="button"
                  onClick={() => openCard(featuredDevice)}
                  className="group relative mt-4 w-full overflow-hidden rounded-lg border border-cyan-200/18 bg-[linear-gradient(135deg,rgba(8,47,73,0.78),rgba(30,64,175,0.42)_45%,rgba(88,28,135,0.72))] p-3 text-left transition hover:border-fuchsia-200/42 hover:shadow-[0_22px_70px_rgba(14,165,233,0.18)] sm:mt-5 sm:p-3.5"
                >
                  <span className="pointer-events-none absolute -right-4 -top-3 text-[86px] font-black leading-none text-white/[0.045] sm:-right-5 sm:-top-4 sm:text-[108px]">
                    01
                  </span>
                  <span className="relative grid grid-cols-[96px_minmax(0,1fr)] items-center gap-3 min-[420px]:grid-cols-[112px_minmax(0,1fr)] min-[480px]:grid-cols-[124px_minmax(0,1fr)] sm:gap-4">
                    <span className="relative">
                      <span className="absolute -inset-2 rounded-lg bg-gradient-to-br from-cyan-400/22 to-fuchsia-400/18 blur-xl" />
                      <ProductThumb
                        card={featuredDevice}
                        className="relative h-24 w-full rounded-md border-cyan-200/18 bg-[#071333]/88 shadow-[inset_0_0_34px_rgba(14,165,233,0.12)] min-[480px]:h-[124px]"
                        imageClassName="p-2 transition duration-300 group-hover:scale-105 sm:p-2.5"
                      />
                    </span>
                    <span className="min-w-0">
                      <span className="inline-flex rounded-md bg-gradient-to-r from-cyan-300 to-fuchsia-300 px-2.5 py-1 text-[9px] font-black uppercase text-[#071024] sm:px-3 sm:text-[10px]">
                        #{featuredDevice.rank || 1} most searched
                      </span>
                      <span className="mt-2 block text-lg font-black leading-tight text-white sm:mt-3 sm:text-2xl">
                        {featuredDevice.name}
                      </span>
                      <span className="mt-1 block line-clamp-2 text-xs leading-5 text-cyan-100/70 sm:mt-1.5 sm:text-sm">
                        {[featuredDevice.brand, featuredDevice.spec]
                          .filter(Boolean)
                          .join(" / ")}
                      </span>
                      <span className="mt-3 inline-flex items-center gap-2 rounded-md bg-white/[0.09] px-3 py-2 text-xs font-bold text-white ring-1 ring-white/10 transition group-hover:bg-white/[0.14] sm:mt-4 sm:px-3.5">
                        View details
                        <FaArrowRight className="h-3 w-3" />
                      </span>
                    </span>
                  </span>
                </button>
              ) : (
                <div className="relative mt-5 rounded-lg border border-white/10 bg-white/[0.06] p-6 text-sm text-blue-100/70">
                  {featuredPhonesLoading
                    ? "Loading most searched devices..."
                    : "No search popularity data is available right now."}
                </div>
              )}

              {featuredRail.length > 0 ? (
                <div className="relative mt-3 space-y-2.5">
                  {featuredRail.map((card, index) => {
                    const rowColor =
                      index % 2 === 0
                        ? "from-sky-400/14 via-blue-500/10 to-fuchsia-400/12"
                        : "from-fuchsia-400/13 via-violet-500/11 to-cyan-400/10";

                    return (
                      <button
                        key={`${card.categoryId}-${card.name}-rail`}
                        type="button"
                        onClick={() => openCard(card)}
                        className={`group flex w-full items-center gap-2.5 rounded-lg border border-white/10 bg-gradient-to-r ${rowColor} p-2 text-left transition hover:border-cyan-200/34 hover:brightness-110 sm:gap-3 sm:p-2.5`}
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#071333]/72 text-xs font-black text-cyan-50 ring-1 ring-white/10 sm:h-10 sm:w-10">
                          {String(index + 2).padStart(2, "0")}
                        </span>
                        <ProductThumb
                          card={card}
                          className="h-12 w-12 rounded-md border-cyan-200/12 bg-[#071333]/84 sm:h-14 sm:w-14"
                          imageClassName="p-1.5 transition duration-300 group-hover:scale-105"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-black text-white sm:text-sm">
                            {card.name}
                          </span>
                          <span className="mt-0.5 block truncate text-[11px] text-cyan-100/58 sm:text-xs">
                            {[card.brand, card.spec].filter(Boolean).join(" / ")}
                          </span>
                        </span>
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/[0.06] text-fuchsia-100/50 transition group-hover:bg-cyan-300/14 group-hover:text-cyan-100 sm:h-8 sm:w-8">
                          <FaArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" />
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-10 hidden gap-3 lg:grid lg:grid-cols-4">
          {visibleStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="rounded-md border border-cyan-200/14 bg-gradient-to-br from-blue-500/12 via-violet-500/10 to-fuchsia-500/10 px-4 py-4 shadow-[0_18px_50px_rgba(2,6,23,0.18)] backdrop-blur"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-bold uppercase text-blue-100/58">
                    {stat.label}
                  </span>
                  <Icon className="h-4 w-4 text-sky-300" />
                </div>
                <p className="mt-3 text-3xl font-black text-white">
                  {formatCount(stat.value)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

const ProductThumb = ({ card, className = "", imageClassName = "p-2.5" }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const initials = firstText(card?.brand, card?.name)
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("");

  return (
    <span
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-white/10 bg-[#071024] ${className}`}
    >
      {card?.image && !imageFailed ? (
        <img
          src={card.image}
          alt={card.name}
          className={`h-full w-full object-contain ${imageClassName}`}
          loading="lazy"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span className="px-3 text-center text-sm font-black uppercase text-blue-100/55">
          {initials || "HD"}
        </span>
      )}
    </span>
  );
};

export default HeroSection;
