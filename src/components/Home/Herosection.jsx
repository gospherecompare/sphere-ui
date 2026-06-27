import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowRight,
  FaBolt,
  FaChartLine,
  FaExchangeAlt,
  FaMobileAlt,
  FaSearch,
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
    id: "tvs",
    label: "TVs",
    path: "/tvs",
    productPathType: "tvs",
    icon: FaTv,
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
    return "";
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

const getImages = (item) =>
  [
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
    CATEGORY_META.find((entry) => entry.id === categoryId);
  if (!category) return null;
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
    brands,
  } = useDevice();
  const [activeCategory, setActiveCategory] = useState("smartphones");
  const [searchQuery, setSearchQuery] = useState("");
  const [liveTrending, setLiveTrending] = useState([]);
  const [featuredPhones, setFeaturedPhones] = useState([]);
  const [featuredPhonesLoading, setFeaturedPhonesLoading] = useState(false);

  const categoryRows = useMemo(() => {
    const phones =
      Array.isArray(smartphoneAll) && smartphoneAll.length
        ? smartphoneAll
        : Array.isArray(smartphone)
          ? smartphone
          : [];

    const sourceMap = {
      smartphones: phones,
      laptops: Array.isArray(laptops) ? laptops : [],
      tvs: Array.isArray(homeAppliances) ? homeAppliances : [],
    };

    return CATEGORY_META.map((category) => ({
      ...category,
      items: sourceMap[category.id] || [],
      count: (sourceMap[category.id] || []).length,
    }));
  }, [homeAppliances, laptops, smartphone, smartphoneAll]);

  useEffect(() => {
    const firstAvailable = categoryRows.find((category) => category.count > 0);
    const current = categoryRows.find(
      (category) => category.id === activeCategory,
    );
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
                firstText(
                  item?.product_type,
                  item?.productType,
                  item?.deviceType,
                ),
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
    <section className="relative overflow-hidden bg-[#050712] text-white">
      <svg
        className="pointer-events-none absolute inset-0 hidden h-full w-full opacity-70 sm:block"
        viewBox="0 0 1440 760"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <path
          d="M-40 268H210c96 0 102-126 192-126h258c100 0 98 156 208 156h612"
          fill="none"
          stroke="rgba(125,211,252,0.18)"
          strokeWidth="3"
        />
        <path
          d="M916 126h214c84 0 86 96 166 96h184"
          fill="none"
          stroke="rgba(216,180,254,0.16)"
          strokeWidth="3"
        />
        <path
          d="M-28 570h246c92 0 100-150 190-150h300c106 0 118 156 230 156h542"
          fill="none"
          stroke="rgba(56,189,248,0.14)"
          strokeWidth="3"
        />
        <rect
          x="1002"
          y="292"
          width="214"
          height="118"
          rx="28"
          fill="none"
          stroke="rgba(125,211,252,0.13)"
          strokeWidth="3"
        />
        <rect
          x="214"
          y="454"
          width="164"
          height="94"
          rx="26"
          fill="none"
          stroke="rgba(216,180,254,0.12)"
          strokeWidth="3"
        />
      </svg>
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-65 sm:hidden"
        viewBox="0 0 390 880"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <path
          d="M-34 146H112c60 0 58 82 116 82h196"
          fill="none"
          stroke="rgba(125,211,252,0.18)"
          strokeWidth="2"
        />
        <path
          d="M52 372h108c45 0 44 68 90 68h176"
          fill="none"
          stroke="rgba(216,180,254,0.15)"
          strokeWidth="2"
        />
        <path
          d="M-20 650h120c52 0 52-76 104-76h214"
          fill="none"
          stroke="rgba(56,189,248,0.12)"
          strokeWidth="2"
        />
        <rect
          x="282"
          y="268"
          width="78"
          height="116"
          rx="20"
          fill="none"
          stroke="rgba(125,211,252,0.13)"
          strokeWidth="2"
        />
        <rect
          x="22"
          y="522"
          width="94"
          height="146"
          rx="22"
          fill="none"
          stroke="rgba(216,180,254,0.12)"
          strokeWidth="2"
        />
        <circle cx="112" cy="146" r="4" fill="rgba(103,232,249,0.55)" />
        <circle cx="250" cy="440" r="4" fill="rgba(216,180,254,0.5)" />
      </svg>
      <div className="pointer-events-none absolute left-[-7rem] top-12 hidden h-80 w-80 rounded-full border border-cyan-300/12 sm:block" />
      <div className="pointer-events-none absolute right-[-8rem] bottom-8 hidden h-80 w-80 rounded-full border border-fuchsia-300/14 sm:block" />
      <div className="pointer-events-none absolute inset-x-0 top-1/2 hidden h-px bg-gradient-to-r from-transparent via-cyan-300/18 to-transparent sm:block" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-[#050712]/32 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#050712]/32 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-8 sm:px-6 sm:pb-16 sm:pt-16 lg:px-8 lg:pb-20 lg:pt-20">
        <div className="grid items-center gap-8 sm:gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
          <div className="min-w-0">
            <p className="inline-flex max-w-full items-center gap-2 rounded-md border border-cyan-200/20 bg-cyan-300/10 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.08em] text-cyan-100 shadow-[0_0_32px_rgba(14,165,233,0.16)] backdrop-blur sm:text-[11px]">
              <FaBolt className="h-3 w-3 text-sky-300" />
              Live Gadget Intelligence
            </p>

            <h1 className="mt-5 max-w-3xl text-[2.45rem] font-black leading-[0.98] text-white sm:mt-6 sm:text-5xl sm:leading-[1.02] lg:text-6xl">
              Find the gadget
              <span className="block bg-gradient-to-r from-sky-200 via-white to-fuchsia-200 bg-clip-text text-transparent">
                worth buying next.
              </span>
            </h1>

            <p className="mt-4 max-w-2xl text-sm font-medium leading-6 text-cyan-50/76 sm:mt-5 sm:text-lg sm:leading-7">
              Search smarter across specs, prices, launches, and real buyer
              interest before you shortlist your next device.
            </p>

            <form
              onSubmit={submitSearch}
              className="mt-6 w-full max-w-2xl overflow-hidden rounded-lg border border-cyan-200/14 bg-white/[0.055] p-2 shadow-[0_16px_42px_rgba(2,6,23,0.14)] sm:mt-8 sm:shadow-[0_18px_48px_rgba(2,6,23,0.14)]"
            >
              <div className="flex gap-2">
                <div className="relative min-w-0 flex-1">
                  <FaSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-100/55" />
                  <input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder={`Search ${activeCategoryMeta.label.toLowerCase()}...`}
                    className="h-12 w-full rounded-md border border-blue-200/12 bg-transparent py-3 pl-11 pr-4 text-sm font-medium text-white outline-none transition placeholder:text-cyan-100/42 focus:border-cyan-300/70 focus:ring-2 focus:ring-cyan-400/24 sm:h-[52px]"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-md bg-gradient-to-r from-blue-500 to-fuchsia-500 px-4 text-xs font-black text-white transition hover:brightness-110 sm:h-[52px] sm:px-5 sm:text-sm"
                >
                  {searchQuery.trim() ? "Search" : "Browse"}
                  <FaArrowRight className="h-3 w-3" />
                </button>
              </div>

              {searchSuggestions.length > 0 ? (
                <div className="mt-2 overflow-hidden rounded-md border border-cyan-200/14 bg-[#0b1120]/96 shadow-[0_16px_42px_rgba(2,6,23,0.14)]">
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
                    aria-pressed={isActive}
                    className={`inline-flex shrink-0 items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold transition ${
                      isActive
                        ? "border-fuchsia-300/55 bg-gradient-to-r from-blue-500/24 to-fuchsia-500/20 text-white shadow-[0_12px_34px_rgba(168,85,247,0.18)]"
                        : "border-white/10 bg-white/[0.055] text-blue-100/76 hover:border-cyan-200/24 hover:bg-white/[0.075]"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {category.label}
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
                    className="shrink-0 rounded-md border border-white/10 bg-white/[0.055] px-3 py-2 text-xs font-semibold text-blue-100/80 transition hover:border-sky-300/40 hover:bg-white/[0.075] hover:text-white"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="relative min-w-0">
            <div className="absolute -inset-3 rounded-lg opacity-60 blur-3xl sm:-inset-4 sm:opacity-70" />
            <div className="relative overflow-hidden rounded-lg border border-cyan-200/14 bg-white/[0.055] p-3 shadow-[0_16px_42px_rgba(2,6,23,0.14)] sm:p-4 sm:shadow-[0_18px_48px_rgba(2,6,23,0.14)]">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_22%_12%,rgba(56,189,248,0.14),transparent_32%),radial-gradient(circle_at_86%_24%,rgba(168,85,247,0.16),transparent_36%)] opacity-90" />
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
                  className="inline-flex shrink-0 items-center gap-2 rounded-md border border-white/10 bg-white/[0.055] px-2.5 py-2 text-xs font-bold text-cyan-50/86 transition hover:border-cyan-200/38 hover:bg-white/[0.075] hover:text-white sm:px-3"
                >
                  Browse
                  <FaArrowRight className="h-3 w-3" />
                </button>
              </div>

              {featuredDevice ? (
                <button
                  type="button"
                  onClick={() => openCard(featuredDevice)}
                  className="group relative mt-4 w-full overflow-hidden rounded-lg border border-cyan-200/14 bg-white/[0.055] p-3 text-left shadow-[0_16px_42px_rgba(2,6,23,0.14)] transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-200/28 hover:bg-white/[0.075] sm:mt-5 sm:p-3.5"
                >
                  <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_22%_12%,rgba(56,189,248,0.16),transparent_32%),radial-gradient(circle_at_86%_28%,rgba(168,85,247,0.18),transparent_36%)] opacity-90" />
                  <span className="pointer-events-none absolute -right-4 -top-3 text-[86px] font-black leading-none text-white/[0.045] sm:-right-5 sm:-top-4 sm:text-[108px]">
                    01
                  </span>
                  <span className="relative grid grid-cols-[96px_minmax(0,1fr)] items-center gap-3 min-[420px]:grid-cols-[112px_minmax(0,1fr)] min-[480px]:grid-cols-[124px_minmax(0,1fr)] sm:gap-4">
                    <span className="relative">
                      <span className="absolute -inset-2 rounded-lg bg-gradient-to-br from-cyan-400/22 to-fuchsia-400/18 blur-xl" />
                      <ProductThumb
                        card={featuredDevice}
                        className="relative h-24 w-full !border-transparent !bg-transparent min-[480px]:h-[124px]"
                        imageClassName="p-1 drop-shadow-[0_24px_34px_rgba(2,6,23,0.44)] transition duration-300 group-hover:scale-110 sm:p-1.5"
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
                      <span className="mt-3 inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-cyan-400/80 to-fuchsia-500/80 px-3 py-2 text-xs font-bold text-white ring-1 ring-white/10 transition group-hover:brightness-110 sm:mt-4 sm:px-3.5">
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
                    return (
                      <button
                        key={`${card.categoryId}-${card.name}-rail`}
                        type="button"
                        onClick={() => openCard(card)}
                        className="group relative flex w-full items-center gap-2.5 rounded-lg border border-cyan-200/12 bg-white/[0.055] p-2 text-left transition hover:border-cyan-200/34 hover:bg-white/[0.075] sm:gap-3 sm:p-2.5"
                      >
                        <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_12%,rgba(34,211,238,0.08),transparent_32%),radial-gradient(circle_at_88%_28%,rgba(168,85,247,0.1),transparent_36%)]" />
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white/[0.075] text-xs font-black text-cyan-50 ring-1 ring-white/10 sm:h-10 sm:w-10">
                          {String(index + 2).padStart(2, "0")}
                        </span>
                        <ProductThumb
                          card={card}
                          className="h-12 w-12 rounded-md border-cyan-200/10 bg-white/[0.045] sm:h-14 sm:w-14"
                          imageClassName="p-1.5 drop-shadow-[0_14px_22px_rgba(2,6,23,0.34)] transition duration-300 group-hover:scale-110"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-black text-white sm:text-sm">
                            {card.name}
                          </span>
                          <span className="mt-0.5 block truncate text-[11px] text-cyan-100/58 sm:text-xs">
                            {[card.brand, card.spec]
                              .filter(Boolean)
                              .join(" / ")}
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
