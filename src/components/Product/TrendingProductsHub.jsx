import React, { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate, useParams } from "react-router-dom";
import {
  FaCalendarAlt,
  FaFilter,
  FaLaptop,
  FaMobileAlt,
  FaSearch,
  FaTv,
  FaTimes,
} from "react-icons/fa";
import Spinner from "../ui/Spinner";
import useDevice from "../../hooks/useDevice";
import { generateSlug } from "../../utils/slugGenerator";
import {
  computePopularSmartphoneFeatures,
  SMARTPHONE_FEATURE_CATALOG,
} from "../../utils/smartphonePopularFeatures";
import {
  computePopularLaptopFeatures,
  getLaptopFeatureSortValue,
  matchesLaptopFeature,
} from "../../utils/laptopPopularFeatures";
import {
  computePopularTvFeatures,
  getTvFeatureSortValue,
  matchesTvFeature,
} from "../../utils/tvPopularFeatures";

const RUPEE = "\u20B9";
const API_BASE = "https://api.apisphere.in";

const CATEGORIES = {
  smartphones: {
    id: "smartphones",
    label: "Smartphones",
    badge: "TRENDING SMARTPHONES",
    title: "Trending Smartphones in India: Prices, Specs, and Best Deals",
    description:
      "Compare trending smartphones with camera, battery, display, and performance specs, plus live prices from top online stores.",
    endpoint: "/api/public/trending/smartphones?limit=120",
    detailPath: "/smartphones",
    icon: FaMobileAlt,
    metaTitle: "Trending Smartphones in India - Specs, Prices, Deals",
    metaDescription:
      "Browse trending smartphones with detailed specs, latest prices, and best online deals.",
    metaKeywords:
      "trending smartphones, smartphone prices in india, best smartphones, smartphone specs, latest phone deals",
    searchPlaceholder: "Search smartphones by brand, model, or specifications...",
  },
  laptops: {
    id: "laptops",
    label: "Laptops",
    badge: "TRENDING LAPTOPS",
    title: "Trending Laptops in India: Prices, Specs, and Best Deals",
    description:
      "Compare trending laptops by processor, RAM, storage, display, and battery life, plus live prices from top online stores.",
    endpoint: "/api/public/trending/laptops?limit=120",
    detailPath: "/laptops",
    icon: FaLaptop,
    metaTitle: "Trending Laptops in India - Specs, Prices, Deals",
    metaDescription:
      "Compare trending laptops by processor, RAM, storage, display, and latest offers.",
    metaKeywords:
      "trending laptops, laptop prices in india, best laptops, laptop specs, latest laptop deals",
    searchPlaceholder: "Search laptops by brand, model, processor, or memory...",
  },
  tvs: {
    id: "tvs",
    label: "TVs",
    badge: "TRENDING TVS",
    title: "Trending TVs in India: Prices, Specs, and Best Deals",
    description:
      "Compare trending TVs by screen size, resolution, refresh rate, panel type, and smart features, plus live prices from top online stores.",
    endpoint: "/api/public/trending/tvs?limit=120",
    detailPath: "/tvs",
    icon: FaTv,
    metaTitle: "Trending TVs in India - Specs, Prices, Deals",
    metaDescription:
      "Browse trending TVs with detailed specifications, latest prices, and direct buy links.",
    metaKeywords:
      "trending tvs, smart tv prices in india, best 4k tv, tv specs, latest tv deals",
    searchPlaceholder: "Search TVs by brand, model, screen size, or panel type...",
  },
};

const ALIASES = {
  smartphone: "smartphones",
  smartphones: "smartphones",
  mobile: "smartphones",
  mobiles: "smartphones",
  laptop: "laptops",
  laptops: "laptops",
  tv: "tvs",
  tvs: "tvs",
  television: "tvs",
  televisions: "tvs",
};

const text = (v) => {
  if (v === null || v === undefined) return "";
  const t = String(v).trim().replace(/\s+/g, " ");
  if (!t) return "";
  const lc = t.toLowerCase();
  if (lc === "null" || lc === "undefined" || lc === "na" || lc === "n/a") return "";
  return t;
};

const first = (...values) => {
  for (const v of values) {
    const t = text(v);
    if (t) return t;
  }
  return "";
};

const num = (v) => {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const n = Number(String(v).replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : null;
};

const priceLabel = (v) => {
  const n = num(v);
  return n === null ? "Price not available" : `${RUPEE}${Math.round(n).toLocaleString("en-IN")}`;
};

const arr = (v) => (Array.isArray(v) ? v : []);
const obj = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});

const getRows = (payload, cat) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.trending)) return payload.trending;
  if (cat === "smartphones") return arr(payload?.smartphones || payload?.data || payload?.rows);
  if (cat === "laptops") return arr(payload?.laptops || payload?.data || payload?.rows);
  return arr(payload?.tvs || payload?.data || payload?.rows);
};

const mapStorePrice = (sp) => {
  const s = obj(sp);
  return {
    storeName: first(s.store_name, s.store, s.storeName, "Store"),
    price: num(s.price),
    url: first(s.url, s.link),
  };
};

const getVariants = (row) => {
  const meta = obj(row.metadata || row.metadata_json);
  const sections = obj(meta.spec_sections);
  const variants =
    arr(row.variants).length
      ? row.variants
      : arr(row.variants_json).length
        ? row.variants_json
        : arr(meta.variants).length
          ? meta.variants
          : arr(meta.variants_json).length
            ? meta.variants_json
            : arr(sections.variants_json);
  return arr(variants).map((v, i) => {
    const parsed = obj(v);
    return {
      id: parsed.variant_id ?? parsed.id ?? i,
      ram: first(parsed.ram, parsed.memory),
      storage: first(parsed.storage, parsed.rom, parsed.internal_storage),
      basePrice: num(parsed.base_price ?? parsed.price),
      stores: arr(parsed.store_prices).map(mapStorePrice),
    };
  });
};

const getImages = (row, cat) => {
  if (cat === "laptops") {
    const meta = obj(row.metadata || row.metadata_json);
    const sections = obj(meta.spec_sections);
    return arr(row.images || meta.images || sections.images_json).map(text).filter(Boolean);
  }
  if (cat === "tvs") return arr(row.images_json || row.images).map(text).filter(Boolean);
  return arr(row.images || row.images_json).map(text).filter(Boolean);
};

const getStorePrices = (row, variants) => {
  const list = [
    ...variants.flatMap((v) => arr(v.stores)),
    ...arr(row.store_prices).map(mapStorePrice),
  ].filter((s) => s.storeName);
  if (!list.length) {
    const top = num(row.price ?? row.base_price ?? row.starting_price);
    if (top !== null) list.push({ storeName: "Online Store", price: top, url: "" });
  }
  const seen = new Set();
  const dedup = [];
  list.forEach((s) => {
    const key = `${String(s.storeName).toLowerCase()}-${s.price || "na"}-${s.url || ""}`;
    if (seen.has(key)) return;
    seen.add(key);
    dedup.push(s);
  });
  dedup.sort((a, b) => (a.price ?? Number.MAX_SAFE_INTEGER) - (b.price ?? Number.MAX_SAFE_INTEGER));
  return dedup;
};

const cameraLabel = (row) => {
  const camera = obj(row.camera);
  const rear = obj(camera.rear_camera);
  const candidates = [];
  const push = (v) => {
    const n = num(v);
    if (n !== null) candidates.push(n);
  };
  push(camera.main_camera_megapixels);
  push(camera.rear_camera_megapixels);
  Object.values(rear).forEach((lens) => push(obj(lens).resolution));
  return candidates.length ? `${Math.max(...candidates)} MP Camera` : first(camera.resolution);
};

const batteryLabel = (row) => {
  const battery = obj(row.battery);
  const cap = first(battery.capacity, battery.battery_capacity, row.battery_capacity);
  if (!cap) return "";
  const n = num(cap);
  if (n === null) return cap;
  return /wh/i.test(cap) ? `${n} Wh Battery` : `${n} mAh Battery`;
};

const dateLabel = (v) => {
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
};

const ImageCarousel = ({ images = [], fallbackIcon: FallbackIcon = FaMobileAlt }) => {
  const safeImages = arr(images).filter(Boolean);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setCurrentIndex(0);
  }, [safeImages.length]);

  if (!safeImages.length) {
    return (
      <div className="relative w-full h-full flex items-center justify-center rounded-lg bg-gray-100">
        <div className="text-center px-3">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-gray-200">
            <FallbackIcon className="text-gray-400 text-sm" />
          </div>
          <span className="text-xs text-gray-500">No image</span>
        </div>
      </div>
    );
  }

  if (safeImages.length === 1) {
    return (
      <div className="relative w-full h-full">
        <img
          src={safeImages[0]}
          alt="product"
          className="w-full h-full object-contain rounded-lg"
          loading="lazy"
        />
      </div>
    );
  }

  const showNext = (event) => {
    event.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % safeImages.length);
  };

  const showPrev = (event) => {
    event.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + safeImages.length) % safeImages.length);
  };

  return (
    <div className="relative w-full h-full group">
      <div className="w-full h-full flex items-center justify-center">
        <img
          src={safeImages[currentIndex]}
          alt={`product-view-${currentIndex + 1}`}
          className="w-auto h-auto max-w-full max-h-full object-contain rounded-lg"
          loading="lazy"
        />
      </div>
      <div className="absolute inset-0 flex items-center justify-between p-1 pointer-events-none">
        <button
          onClick={showPrev}
          className="pointer-events-auto opacity-0 group-hover:opacity-100 md:opacity-100 bg-black/30 hover:bg-black/50 text-white p-1.5 rounded-full transition-all duration-200 transform -translate-x-1"
          aria-label="Previous image"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={showNext}
          className="pointer-events-auto opacity-0 group-hover:opacity-100 md:opacity-100 bg-black/30 hover:bg-black/50 text-white p-1.5 rounded-full transition-all duration-200 transform translate-x-1"
          aria-label="Next image"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};

const buildProduct = (row, cat, index) => {
  const variants = getVariants(row);
  const stores = getStorePrices(row, variants);
  const lowest = stores[0]?.price ?? num(row.price ?? row.base_price);
  const images = getImages(row, cat);

  if (cat === "laptops") {
    const basic = obj(row.basic_info || row.basic_info_json);
    const performance = obj(row.performance);
    const memory = obj(row.memory);
    const storage = obj(row.storage);
    const display = obj(row.display);
    const ram = first(memory.ram, variants[0]?.ram);
    const rom = first(storage.capacity, variants[0]?.storage);
    const screen = first(display.display_size, display.size_cm);
    const resolution = first(display.resolution);
    const processor = first(performance.processor_name, performance.processor, performance.cpu);
    const normalizedRam = text(ram).replace(/\s+RAM$/i, "");
    const normalizedStorage = text(rom).replace(/\s+(STORAGE|ROM)$/i, "");
    const normalizedScreen = first(screen, resolution);
    return {
      key: row.product_id ?? row.id ?? `${cat}-${index}`,
      id: row.product_id ?? row.id ?? null,
      name: first(row.name, basic.product_name, row.model, basic.model, "Laptop"),
      brand: first(row.brand_name, basic.brand_name, basic.brand),
      image: images[0] || "",
      images,
      stores,
      price: lowest,
      priceText: priceLabel(lowest),
      release: first(basic.launch_date, row.launch_date, row.created_at),
      specLine: [normalizedRam, normalizedStorage, normalizedScreen, processor]
        .filter(Boolean)
        .join(" | "),
      filterMeta: { ram, storage: rom, screen, resolution },
      detailPath: CATEGORIES.laptops.detailPath,
      variantId: variants[0]?.id ?? null,
      featurePayload: {
        specs: {
          cpu: processor,
          cpuBrand: processor,
          ram,
          storage: rom,
          display: [screen, resolution, first(display.refresh_rate)].filter(Boolean).join(" | "),
          refreshRate: first(display.refresh_rate),
          graphics: first(performance.gpu),
          battery: first(obj(row.battery).battery_type, obj(row.battery).battery_life),
          weight: first(obj(row.physical).weight),
        },
        variants: variants.map((v) => ({ ram: v.ram, storage: v.storage })),
      },
    };
  }

  if (cat === "tvs") {
    const keySpecs = obj(row.key_specs_json || row.key_specs);
    const display = obj(row.display_json || row.display);
    const smart = obj(row.smart_tv_json || row.smart_tv);
    const audio = obj(row.audio_json || row.audio);
    const connectivity = obj(row.connectivity_json || row.connectivity);
    const screen = first(keySpecs.screen_size, row.screen_size);
    const resolution = first(keySpecs.resolution, display.resolution);
    const refresh = first(keySpecs.refresh_rate, display.refresh_rate);
    const panel = first(keySpecs.panel_type, display.panel_type);
    const sound = first(keySpecs.audio_output, audio.output_power);
    const os = first(keySpecs.operating_system, smart.operating_system);
    return {
      key: row.product_id ?? row.id ?? `${cat}-${index}`,
      id: row.product_id ?? row.id ?? null,
      name: first(row.product_name, row.name, row.model, "TV"),
      brand: first(row.brand_name, row.brand),
      image: images[0] || "",
      images,
      stores,
      price: lowest,
      priceText: priceLabel(lowest),
      release: first(obj(row.basic_info_json).launch_year, row.launch_year, row.created_at),
      specLine: [screen, resolution, refresh, panel, os || sound].filter(Boolean).join(" | "),
      filterMeta: { ram: "", storage: "", screen, resolution },
      detailPath: CATEGORIES.tvs.detailPath,
      variantId: variants[0]?.id ?? null,
      featurePayload: {
        specs: {
          screenSize: screen,
          capacity: screen,
          resolution,
          displayType: panel,
          type: first(row.category),
          hdr: arr(keySpecs.hdr_support).join(" "),
          audioOutput: sound,
          operatingSystem: first(keySpecs.operating_system, smart.operating_system),
          wifi: first(connectivity.wifi),
          refreshRate: refresh,
        },
      },
    };
  }

  const display = obj(row.display);
  const performance = obj(row.performance);
  const ram = first(variants[0]?.ram);
  const storage = first(variants[0]?.storage);
  return {
    key: row.product_id ?? row.id ?? `${cat}-${index}`,
    id: row.product_id ?? row.id ?? null,
    name: first(row.name, row.product_name, row.model, "Smartphone"),
    brand: first(row.brand_name, row.brand),
    image: images[0] || "",
    images,
    stores,
    price: lowest,
    priceText: priceLabel(lowest),
    release: first(row.launch_date, row.created_at),
    specLine: [ram, storage, cameraLabel(row), batteryLabel(row), first(display.size), first(performance.processor)]
      .filter(Boolean)
      .join(" | "),
    filterMeta: { ram, storage, screen: "", resolution: "" },
    detailPath: CATEGORIES.smartphones.detailPath,
    variantId: variants[0]?.id ?? null,
    featurePayload: row,
  };
};

const mergeProducts = (items) => {
  const dedupeStores = (stores) => {
    const seen = new Set();
    const deduped = [];
    arr(stores).forEach((store) => {
      const key = `${String(store.storeName || "").toLowerCase()}-${store.price || "na"}-${store.url || ""}`;
      if (seen.has(key)) return;
      seen.add(key);
      deduped.push(store);
    });
    deduped.sort(
      (a, b) => (a.price ?? Number.MAX_SAFE_INTEGER) - (b.price ?? Number.MAX_SAFE_INTEGER),
    );
    return deduped;
  };

  const map = new Map();
  items.forEach((item) => {
    const key = item.id != null ? String(item.id) : item.key;
    if (!map.has(key)) {
      map.set(key, item);
      return;
    }
    const existing = map.get(key);
    if (num(item.price) !== null && (num(existing.price) === null || num(item.price) < num(existing.price))) {
      existing.price = item.price;
      existing.priceText = item.priceText;
      existing.variantId = item.variantId || existing.variantId;
      existing.specLine = item.specLine || existing.specLine;
    }
    if (!existing.image && item.image) existing.image = item.image;
    if ((!existing.images || !existing.images.length) && arr(item.images).length) {
      existing.images = item.images;
    }
    existing.stores = dedupeStores([...existing.stores, ...item.stores]);
  });
  return Array.from(map.values());
};

const getProductId = (item) => {
  const id =
    item?.product_id ??
    item?.id ??
    item?.productId ??
    item?.basic_info?.product_id ??
    item?.basic_info_json?.product_id ??
    null;
  return id == null ? null : String(id);
};

const pickFirstArray = (...values) => {
  for (const value of values) {
    if (arr(value).length) return arr(value);
  }
  return [];
};

const enrichRowWithCatalog = (row, catalogItem) => {
  if (!catalogItem) return row;

  const merged = { ...catalogItem, ...row };

  const objectSectionKeys = [
    "battery",
    "camera",
    "display",
    "performance",
    "memory",
    "storage",
    "physical",
    "connectivity",
    "network",
    "audio",
    "multimedia",
    "basic_info",
    "basic_info_json",
    "key_specs_json",
    "display_json",
    "audio_json",
    "smart_tv_json",
    "gaming_json",
    "ports_json",
    "connectivity_json",
    "product_details_json",
    "metadata_json",
  ];

  objectSectionKeys.forEach((section) => {
    const catalogSection = obj(catalogItem[section]);
    const rowSection = obj(row[section]);
    if (Object.keys(catalogSection).length || Object.keys(rowSection).length) {
      merged[section] = { ...catalogSection, ...rowSection };
    }
  });

  const catalogMeta = obj(catalogItem.metadata || catalogItem.metadata_json);
  const rowMeta = obj(row.metadata || row.metadata_json);
  if (Object.keys(catalogMeta).length || Object.keys(rowMeta).length) {
    merged.metadata = { ...catalogMeta, ...rowMeta };
    const catalogSpecSections = obj(catalogMeta.spec_sections);
    const rowSpecSections = obj(rowMeta.spec_sections);
    if (Object.keys(catalogSpecSections).length || Object.keys(rowSpecSections).length) {
      merged.metadata.spec_sections = {
        ...catalogSpecSections,
        ...rowSpecSections,
      };
    }
  }

  const rowSpecSections = obj(rowMeta.spec_sections);
  const catalogSpecSections = obj(catalogMeta.spec_sections);

  const variants = pickFirstArray(
    row.variants,
    row.variants_json,
    rowMeta.variants,
    rowMeta.variants_json,
    rowSpecSections.variants_json,
    catalogItem.variants,
    catalogItem.variants_json,
    catalogMeta.variants,
    catalogMeta.variants_json,
    catalogSpecSections.variants_json,
  );
  if (variants.length) merged.variants = variants;

  const images = pickFirstArray(
    row.images,
    row.images_json,
    rowMeta.images,
    rowSpecSections.images_json,
    catalogItem.images,
    catalogItem.images_json,
    catalogMeta.images,
    catalogSpecSections.images_json,
  );
  if (images.length) merged.images = images;

  const storePrices = pickFirstArray(row.store_prices, catalogItem.store_prices);
  if (storePrices.length) merged.store_prices = storePrices;

  return merged;
};

const TrendingProductsHub = () => {
  const navigate = useNavigate();
  const { category } = useParams();
  const deviceStore = useDevice();

  const activeCategory = ALIASES[String(category || "").toLowerCase()] || "smartphones";
  const config = CATEGORIES[activeCategory];
  const HeroIcon = config.icon;

  const [rawRows, setRawRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("featured");
  const [selectedFeature, setSelectedFeature] = useState("");
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedRam, setSelectedRam] = useState([]);
  const [selectedStorage, setSelectedStorage] = useState([]);
  const [selectedScreen, setSelectedScreen] = useState([]);
  const [selectedResolution, setSelectedResolution] = useState([]);
  const [brandFilterQuery, setBrandFilterQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const smartphoneCatalog = useMemo(() => {
    if (arr(deviceStore?.smartphoneAll).length) return deviceStore.smartphoneAll;
    return arr(deviceStore?.smartphone);
  }, [deviceStore?.smartphoneAll, deviceStore?.smartphone]);

  const laptopCatalog = useMemo(
    () => arr(deviceStore?.laptops),
    [deviceStore?.laptops],
  );

  const tvCatalog = useMemo(
    () => arr(deviceStore?.homeAppliances),
    [deviceStore?.homeAppliances],
  );

  const catalogLookup = useMemo(() => {
    const source =
      activeCategory === "laptops"
        ? laptopCatalog
        : activeCategory === "tvs"
          ? tvCatalog
          : smartphoneCatalog;

    const lookup = new Map();
    source.forEach((item) => {
      const id = getProductId(item);
      if (id) lookup.set(id, item);
    });
    return lookup;
  }, [activeCategory, smartphoneCatalog, laptopCatalog, tvCatalog]);

  useEffect(() => {
    if (!category || activeCategory !== category) {
      navigate(`/trending/${activeCategory}`, { replace: true });
    }
  }, [category, activeCategory, navigate]);

  useEffect(() => {
    setSearch("");
    setSortBy("featured");
    setSelectedFeature("");
    setSelectedBrands([]);
    setSelectedRam([]);
    setSelectedStorage([]);
    setSelectedScreen([]);
    setSelectedResolution([]);
    setBrandFilterQuery("");
    setShowFilters(false);
  }, [activeCategory]);

  useEffect(() => {
    let canceled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API_BASE}${config.endpoint}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const payload = await res.json();
        if (canceled) return;
        const rows = getRows(payload, activeCategory);
        setRawRows(rows);
      } catch {
        if (!canceled) {
          setRawRows([]);
          setError("Unable to load products right now.");
        }
      } finally {
        if (!canceled) setLoading(false);
      }
    };
    load();
    return () => {
      canceled = true;
    };
  }, [activeCategory, config.endpoint]);

  const products = useMemo(() => {
    const enrichedRows = rawRows.map((row) => {
      const id = getProductId(row);
      const catalogItem = id ? catalogLookup.get(id) : null;
      return enrichRowWithCatalog(row, catalogItem);
    });
    return mergeProducts(
      enrichedRows.map((row, index) => buildProduct(row, activeCategory, index)),
    );
  }, [rawRows, activeCategory, catalogLookup]);

  const popularFeatures = useMemo(() => {
    if (activeCategory === "laptops") {
      return computePopularLaptopFeatures(products.map((p) => p.featurePayload), { limit: 16 });
    }
    if (activeCategory === "tvs") {
      return computePopularTvFeatures(products.map((p) => p.featurePayload), { limit: 16 });
    }
    return computePopularSmartphoneFeatures(products.map((p) => p.featurePayload), { limit: 16 });
  }, [products, activeCategory]);

  const visible = useMemo(() => {
    const q = text(search).toLowerCase();
    const byFeature = (p) => {
      if (!selectedFeature) return true;
      if (activeCategory === "laptops") return matchesLaptopFeature(p.featurePayload, selectedFeature);
      if (activeCategory === "tvs") return matchesTvFeature(p.featurePayload, selectedFeature);
      const def = SMARTPHONE_FEATURE_CATALOG.find((f) => f.id === selectedFeature);
      return def ? Boolean(def.match(p.featurePayload)) : true;
    };
    const filtered = products.filter((p) => {
      if (selectedBrands.length && !selectedBrands.includes(text(p.brand))) return false;
      if (selectedRam.length && !selectedRam.includes(text(p.filterMeta?.ram))) return false;
      if (selectedStorage.length && !selectedStorage.includes(text(p.filterMeta?.storage)))
        return false;
      if (selectedScreen.length && !selectedScreen.includes(text(p.filterMeta?.screen)))
        return false;
      if (
        selectedResolution.length &&
        !selectedResolution.includes(text(p.filterMeta?.resolution))
      )
        return false;
      if (!byFeature(p)) return false;
      if (q && !`${p.name} ${p.brand} ${p.specLine}`.toLowerCase().includes(q)) return false;
      return true;
    });
    const sorted = [...filtered];
    if (sortBy === "price-low") sorted.sort((a, b) => (a.price ?? Number.MAX_SAFE_INTEGER) - (b.price ?? Number.MAX_SAFE_INTEGER));
    else if (sortBy === "price-high") sorted.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    else if (sortBy === "newest") sorted.sort((a, b) => new Date(b.release).getTime() - new Date(a.release).getTime());
    else if (selectedFeature && activeCategory === "laptops") {
      sorted.sort((a, b) => (getLaptopFeatureSortValue(b.featurePayload, selectedFeature) ?? -1) - (getLaptopFeatureSortValue(a.featurePayload, selectedFeature) ?? -1));
    } else if (selectedFeature && activeCategory === "tvs") {
      sorted.sort((a, b) => (getTvFeatureSortValue(b.featurePayload, selectedFeature) ?? -1) - (getTvFeatureSortValue(a.featurePayload, selectedFeature) ?? -1));
    }
    return sorted;
  }, [
    products,
    search,
    selectedBrands,
    selectedRam,
    selectedStorage,
    selectedScreen,
    selectedResolution,
    selectedFeature,
    sortBy,
    activeCategory,
  ]);

  const brands = useMemo(
    () => Array.from(new Set(products.map((p) => text(p.brand)).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [products],
  );

  const filteredBrandOptions = useMemo(() => {
    const query = text(brandFilterQuery).toLowerCase();
    if (!query) return brands;
    return brands.filter((brand) => brand.toLowerCase().includes(query));
  }, [brands, brandFilterQuery]);

  const ramOptions = useMemo(
    () =>
      Array.from(new Set(products.map((p) => text(p.filterMeta?.ram)).filter(Boolean))).sort(
        (a, b) => (num(a) || 0) - (num(b) || 0),
      ),
    [products],
  );

  const storageOptions = useMemo(
    () =>
      Array.from(
        new Set(products.map((p) => text(p.filterMeta?.storage)).filter(Boolean)),
      ).sort((a, b) => (num(a) || 0) - (num(b) || 0)),
    [products],
  );

  const screenOptions = useMemo(
    () =>
      Array.from(new Set(products.map((p) => text(p.filterMeta?.screen)).filter(Boolean))).sort(
        (a, b) => (num(a) || 0) - (num(b) || 0),
      ),
    [products],
  );

  const resolutionOptions = useMemo(
    () =>
      Array.from(
        new Set(products.map((p) => text(p.filterMeta?.resolution)).filter(Boolean)),
      ).sort((a, b) => a.localeCompare(b)),
    [products],
  );

  const activeFilterCount =
    selectedBrands.length +
    selectedRam.length +
    selectedStorage.length +
    selectedScreen.length +
    selectedResolution.length +
    (selectedFeature ? 1 : 0);

  const clearAllFilters = () => {
    setSelectedFeature("");
    setSelectedBrands([]);
    setSelectedRam([]);
    setSelectedStorage([]);
    setSelectedScreen([]);
    setSelectedResolution([]);
  };

  const openDetail = (p) => {
    const slug = generateSlug(p.name || `product-${p.id || ""}`);
    const params = new URLSearchParams();
    if (p.id != null) params.set("id", String(p.id));
    if (p.variantId != null) params.set("variantId", String(p.variantId));
    navigate(`${p.detailPath}/${slug}${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const seoTitle = `${config.metaTitle} | Hook`;
  const seoDescription = config.metaDescription;
  const seoKeywords = config.metaKeywords;
  const canonicalPath = `/trending/${activeCategory}`;
  const canonicalUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${canonicalPath}`
      : canonicalPath;
  const ogImage = first(
    arr(visible).find((p) => text(p?.image))?.image,
    arr(products).find((p) => text(p?.image))?.image,
  );

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 md:p-8 lg:p-10 bg-white">
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <meta name="keywords" content={seoKeywords} />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <link rel="canonical" href={canonicalUrl} />

        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Hook" />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:url" content={canonicalUrl} />
        {ogImage ? <meta property="og:image" content={ogImage} /> : null}

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDescription} />
        {ogImage ? <meta name="twitter:image" content={ogImage} /> : null}
      </Helmet>

      <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-1">
        {Object.values(CATEGORIES).map((c) => {
          const Icon = c.icon;
          const active = c.id === activeCategory;
          return (
            <button
              key={c.id}
              onClick={() => navigate(`/trending/${c.id}`)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold border transition-colors whitespace-nowrap ${
                active ? "bg-purple-600 text-white border-purple-600" : "bg-white text-gray-700 border-gray-200 hover:border-purple-300 hover:text-purple-700"
              }`}
            >
              <Icon className="text-sm" />
              <span>{c.label}</span>
            </button>
          );
        })}
      </div>

      <div className="mb-8">
        <div className="inline-flex items-center gap-2 bg-purple-50 px-3 py-1.5 rounded-full border border-purple-100 mb-4">
          <HeroIcon className="text-purple-600 text-sm" />
          <span className="text-xs sm:text-sm font-semibold text-purple-800">{config.badge}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 leading-tight">{config.title}</h1>
        <p className="text-base sm:text-lg text-gray-700 leading-relaxed max-w-3xl">{config.description}</p>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FaFilter className="text-purple-600" />
            <h3 className="text-sm sm:text-base font-semibold text-gray-900">Popular Features</h3>
          </div>
          {selectedFeature ? (
            <button onClick={() => setSelectedFeature("")} className="text-xs sm:text-sm text-purple-700 hover:text-purple-900 font-semibold">Clear</button>
          ) : null}
        </div>
        <div className="flex gap-2.5 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {popularFeatures.map((feature) => {
            const Icon = feature.icon;
            const active = selectedFeature === feature.id;
            return (
              <button
                key={feature.id}
                onClick={() => setSelectedFeature(active ? "" : feature.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-full border text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors ${
                  active ? "bg-purple-600 text-white border-purple-600" : "bg-white text-gray-700 border-gray-200 hover:border-purple-300 hover:text-purple-700"
                }`}
              >
                {Icon ? <Icon className={active ? "text-white text-base" : "text-purple-600 text-base"} /> : null}
                <span>{feature.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-6 flex flex-col lg:flex-row lg:items-center gap-3 lg:justify-between">
        <div className="relative flex-1 max-w-3xl">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <FaSearch className="text-purple-500" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={config.searchPlaceholder}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        <div className="hidden lg:flex items-center gap-4">
          <div className="flex items-center gap-2">
            <FaFilter className="text-gray-500" />
            <span className="text-sm text-gray-600">Sort by:</span>
          </div>
          <div className="relative min-w-[220px]">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-700 appearance-none cursor-pointer bg-white pr-10 transition-all duration-200 hover:border-purple-400"
            >
              <option value="featured">Featured Devices</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="newest">Newest First</option>
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
        </div>

        <div className="lg:hidden flex gap-3">
          <button
            onClick={() => setShowFilters(true)}
            className="flex items-center justify-center gap-2 flex-1 h-12 bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600 text-white px-4 rounded-xl transition-all duration-300 font-semibold"
          >
            <FaFilter />
            Filters
            {activeFilterCount > 0 && (
              <span className="text-purple-200 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          <div className="relative flex-1">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full h-12 px-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-700 appearance-none cursor-pointer bg-white pr-10 transition-all duration-200 hover:border-purple-400"
            >
              <option value="featured">Featured Devices</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="newest">Newest First</option>
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
        </div>

        {activeFilterCount > 0 && (
          <div className="lg:hidden flex items-center justify-between p-3 bg-purple-50 rounded-xl border border-purple-200">
            <span className="text-sm font-medium text-purple-800">
              {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} applied
            </span>
            <button
              onClick={clearAllFilters}
              className="text-purple-600 hover:text-purple-800 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-purple-100 transition-colors duration-200"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="hidden lg:block lg:w-80 flex-shrink-0">
          <div className="p-4 sm:p-5 lg:p-6 sticky top-6">
            <div className="flex justify-between items-center mb-6 sm:mb-7 lg:mb-8 pb-3 sm:pb-4 border-b border-indigo-100 px-2 sm:px-3 md:px-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  Refine Search
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Narrow down {config.label.toLowerCase()} by specifications
                </p>
              </div>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 font-semibold transition-colors duration-200 px-3 py-1 rounded-lg hover:bg-purple-50"
                >
                  <FaTimes />
                  Clear all
                </button>
              )}
            </div>

            {activeFilterCount > 0 && (
              <div className="mb-4 sm:mb-5 lg:mb-6 p-3 sm:p-4 bg-gradient-to-r from-purple-100 to-blue-50 rounded-xl border border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-purple-800">
                    Active Filters
                  </span>
                  <span className="text-xs font-bold text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                    {activeFilterCount}
                  </span>
                </div>
                <p className="text-xs text-purple-600">
                  Refine further or clear to see all devices
                </p>
              </div>
            )}

            <div className="mb-6 sm:mb-7 lg:mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-bold text-gray-900 text-base">Brands</h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Select devices by manufacturer
                  </p>
                </div>
                <span className="text-xs font-bold text-purple-600 bg-purple-100 px-2.5 py-1.5 rounded-full">
                  {selectedBrands.length}
                </span>
              </div>
              <div className="relative mb-3">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                <input
                  type="text"
                  value={brandFilterQuery}
                  onChange={(e) => setBrandFilterQuery(e.target.value)}
                  placeholder="Search brand..."
                  className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {filteredBrandOptions.map((brand) => (
                  <label
                    key={brand}
                    className="flex items-center gap-3 cursor-pointer group hover:bg-gray-50 px-3 py-2.5 rounded-lg transition-all duration-200 border border-transparent hover:border-gray-200"
                  >
                    <input
                      type="checkbox"
                      checked={selectedBrands.includes(brand)}
                      onChange={() =>
                        setSelectedBrands((prev) =>
                          prev.includes(brand)
                            ? prev.filter((b) => b !== brand)
                            : [...prev, brand],
                        )
                      }
                      className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-2 focus:ring-purple-500 focus:ring-offset-1"
                    />
                    <span className="text-gray-700 group-hover:text-gray-900 font-medium flex-1">
                      {brand}
                    </span>
                    <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {products.filter((p) => text(p.brand) === brand).length}
                    </div>
                  </label>
                ))}
                {filteredBrandOptions.length === 0 && (
                  <div className="text-sm text-gray-500 px-2 py-1">
                    No brands found
                  </div>
                )}
              </div>
            </div>

            {(activeCategory === "smartphones" || activeCategory === "laptops") && (
              <>
                {ramOptions.length > 0 && (
                  <div className="mb-6 sm:mb-7 lg:mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-bold text-gray-900 text-base">
                          Memory (RAM)
                        </h4>
                        <p className="text-xs text-gray-500 mt-1">
                          Multitasking performance
                        </p>
                      </div>
                      <span className="text-xs font-bold text-purple-600 bg-purple-100 px-2.5 py-1.5 rounded-full">
                        {selectedRam.length}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {ramOptions.map((ram) => (
                        <label
                          key={ram}
                          className={`flex items-center justify-center gap-2 cursor-pointer px-3 py-2.5 rounded-xl transition-all duration-200 font-medium ${
                            selectedRam.includes(ram)
                              ? "bg-gradient-to-b from-purple-200 to-blue-200 text-blue-500"
                              : "text-gray-700 hover:border-gray-300 bg-gradient-to-br from-purple-50 to-blue-50 border border-indigo-100"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedRam.includes(ram)}
                            onChange={() =>
                              setSelectedRam((prev) =>
                                prev.includes(ram)
                                  ? prev.filter((value) => value !== ram)
                                  : [...prev, ram],
                              )
                            }
                            className="sr-only"
                          />
                          <span>{ram}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {storageOptions.length > 0 && (
                  <div className="mb-6 sm:mb-7 lg:mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-bold text-gray-900 text-base">
                          Storage Capacity
                        </h4>
                        <p className="text-xs text-gray-500 mt-1">
                          Apps and media space
                        </p>
                      </div>
                      <span className="text-xs font-bold text-purple-600 bg-purple-100 px-2.5 py-1.5 rounded-full">
                        {selectedStorage.length}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {storageOptions.map((storage) => (
                        <label
                          key={storage}
                          className={`flex items-center justify-center gap-2 cursor-pointer px-3 py-2.5 rounded-xl transition-all duration-200 font-medium ${
                            selectedStorage.includes(storage)
                              ? "bg-gradient-to-b from-purple-200 to-blue-200 text-blue-500"
                              : "bg-gradient-to-br from-purple-50 to-blue-50 border border-indigo-100 text-gray-700 hover:border-gray-300"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedStorage.includes(storage)}
                            onChange={() =>
                              setSelectedStorage((prev) =>
                                prev.includes(storage)
                                  ? prev.filter((value) => value !== storage)
                                  : [...prev, storage],
                              )
                            }
                            className="sr-only"
                          />
                          <span>{storage}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {activeCategory === "tvs" && (
              <>
                {screenOptions.length > 0 && (
                  <div className="mb-6 sm:mb-7 lg:mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-bold text-gray-900 text-base">
                          Screen Size
                        </h4>
                        <p className="text-xs text-gray-500 mt-1">
                          Select preferred display size
                        </p>
                      </div>
                      <span className="text-xs font-bold text-purple-600 bg-purple-100 px-2.5 py-1.5 rounded-full">
                        {selectedScreen.length}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {screenOptions.map((screen) => (
                        <label
                          key={screen}
                          className={`flex items-center justify-between gap-2 cursor-pointer px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                            selectedScreen.includes(screen)
                              ? "bg-gradient-to-r from-purple-200 to-blue-200 text-blue-500"
                              : "bg-gradient-to-br from-purple-50 to-blue-50 border border-indigo-100 text-gray-700 hover:border-gray-300"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedScreen.includes(screen)}
                            onChange={() =>
                              setSelectedScreen((prev) =>
                                prev.includes(screen)
                                  ? prev.filter((value) => value !== screen)
                                  : [...prev, screen],
                              )
                            }
                            className="sr-only"
                          />
                          <span>{screen}</span>
                          <div
                            className={`w-2 h-2 rounded-full ${
                              selectedScreen.includes(screen)
                                ? "bg-blue-500"
                                : "bg-gray-300"
                            }`}
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {resolutionOptions.length > 0 && (
                  <div className="mb-6 sm:mb-7 lg:mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-bold text-gray-900 text-base">
                          Resolution
                        </h4>
                        <p className="text-xs text-gray-500 mt-1">
                          Filter by panel resolution
                        </p>
                      </div>
                      <span className="text-xs font-bold text-purple-600 bg-purple-100 px-2.5 py-1.5 rounded-full">
                        {selectedResolution.length}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {resolutionOptions.map((resolution) => (
                        <label
                          key={resolution}
                          className={`flex items-center justify-between gap-2 cursor-pointer px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                            selectedResolution.includes(resolution)
                              ? "bg-gradient-to-r from-purple-200 to-blue-200 text-blue-500"
                              : "bg-gradient-to-br from-purple-50 to-blue-50 border border-indigo-100 text-gray-700 hover:border-gray-300"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedResolution.includes(resolution)}
                            onChange={() =>
                              setSelectedResolution((prev) =>
                                prev.includes(resolution)
                                  ? prev.filter((value) => value !== resolution)
                                  : [...prev, resolution],
                              )
                            }
                            className="sr-only"
                          />
                          <span>{resolution}</span>
                          <div
                            className={`w-2 h-2 rounded-full ${
                              selectedResolution.includes(resolution)
                                ? "bg-blue-500"
                                : "bg-gray-300"
                            }`}
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Available {config.label}</h2>
            <p className="text-sm text-gray-500">Showing {visible.length} of {products.length} options</p>
          </div>

          {loading ? <div className="py-20 flex items-center justify-center"><Spinner /></div> : null}
          {!loading && error ? <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">{error}</div> : null}

          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:[&>*:nth-child(2n)]:border-l md:[&>*:nth-child(2n)]:border-gray-200 md:[&>*:nth-child(2n)]:pl-6 md:[&>*:nth-child(2n+1)]:pr-6">
              {visible.map((p) => {
                const storeLink = p.stores.find((s) => s.url)?.url || `https://www.google.com/search?q=${encodeURIComponent(`${p.brand || ""} official store`)}`;
                return (
                  <article
                    key={p.key}
                    onClick={() => openDetail(p)}
                    className="h-full overflow-hidden rounded-2xl bg-white cursor-pointer md:rounded-none"
                  >
                    <div className="p-3 sm:p-4 md:p-5 lg:p-4 pt-4 sm:pt-5 md:pt-6 transition-all duration-300">
                      <div className="grid grid-cols-[minmax(0,8.5rem)_minmax(0,1fr)] sm:grid-cols-[minmax(0,9rem)_minmax(0,1fr)] gap-3 w-full items-start">
                        <div className="relative flex-shrink-0 w-full h-36 sm:h-48 rounded-2xl overflow-hidden group bg-gray-50 border border-gray-200">
                          <div className="w-full h-full flex items-center justify-center p-1.5 sm:p-2">
                            <ImageCarousel
                              images={arr(p.images).length ? p.images : p.image ? [p.image] : []}
                              fallbackIcon={HeroIcon}
                            />
                          </div>
                          <div
                            onClick={(event) => event.stopPropagation()}
                            className="absolute top-2 right-2 z-10 rounded-md transition-all duration-200 cursor-pointer"
                            title="Add to compare"
                          >
                            <input
                              type="checkbox"
                              onClick={(event) => event.stopPropagation()}
                              className="w-3 h-3 m-1 accent-purple-600 cursor-pointer"
                              aria-label="Select for compare"
                            />
                          </div>
                        </div>

                        <div className="min-w-0">
                          {activeCategory === "tvs" ? (
                            <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700 mb-1">
                              {p.brand || "Brand"}
                            </span>
                          ) : (
                            <span className="text-xs font-semibold text-purple-700">{p.brand || "Brand"}</span>
                          )}
                          <h3 className="font-bold text-gray-900 text-[15px] leading-5 mb-1">
                            {p.name}
                          </h3>
                          {p.specLine ? (
                            <p className="text-[12px] text-gray-600 leading-5 mb-2 whitespace-normal break-normal">
                              {p.specLine}
                            </p>
                          ) : null}
                          {p.brand ? (
                            <a
                              href={storeLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-block w-full mb-1 text-[12px] font-medium leading-snug whitespace-nowrap overflow-hidden text-ellipsis text-blue-700 hover:text-blue-800 hover:underline"
                            >
                              Visit the {p.brand} Store
                            </a>
                          ) : null}

                          {activeCategory === "laptops" ? (
                            <p className="text-sm text-gray-500">Starting from</p>
                          ) : null}
                          <div className="text-lg font-bold text-green-600">
                            {p.priceText}
                          </div>
                        </div>
                      </div>

                      {text(p.release) && activeCategory === "smartphones" ? (
                        <div className="mt-3 flex items-center gap-2 text-xs text-gray-600">
                          <FaCalendarAlt className="text-gray-400" />
                          <span>Released: {dateLabel(p.release)}</span>
                        </div>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showFilters && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50 transition-opacity duration-300"
            onClick={() => setShowFilters(false)}
          />

          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Refine Search</h3>
                <p className="text-sm text-gray-500">
                  Narrow down {config.label.toLowerCase()} by specifications
                </p>
              </div>
              <button
                onClick={() => setShowFilters(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <FaTimes className="text-gray-500 text-lg" />
              </button>
            </div>

            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              {activeFilterCount > 0 && (
                <div className="p-4 bg-gradient-to-r from-purple-100 to-blue-50 rounded-xl border border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-purple-800">
                      Active Filters
                    </span>
                    <span className="text-xs font-bold text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                      {activeFilterCount}
                    </span>
                  </div>
                  <p className="text-xs text-purple-600">
                    Refine further or clear to see all devices
                  </p>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-bold text-gray-900 text-base">Brands</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      Select devices by manufacturer
                    </p>
                  </div>
                  <span className="text-xs font-bold text-purple-600 bg-purple-100 px-2.5 py-1.5 rounded-full">
                    {selectedBrands.length}
                  </span>
                </div>
                <div className="relative mb-3">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                  <input
                    type="text"
                    value={brandFilterQuery}
                    onChange={(e) => setBrandFilterQuery(e.target.value)}
                    placeholder="Search brand..."
                    className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {filteredBrandOptions.map((brand) => (
                    <label
                      key={brand}
                      className="flex items-center gap-3 cursor-pointer group hover:bg-gray-50 px-3 py-2.5 rounded-lg transition-all duration-200 border border-transparent hover:border-gray-200"
                    >
                      <input
                        type="checkbox"
                        checked={selectedBrands.includes(brand)}
                        onChange={() =>
                          setSelectedBrands((prev) =>
                            prev.includes(brand)
                              ? prev.filter((b) => b !== brand)
                              : [...prev, brand],
                          )
                        }
                        className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-2 focus:ring-purple-500 focus:ring-offset-1"
                      />
                      <span className="text-gray-700 font-medium flex-1">{brand}</span>
                      <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {products.filter((p) => text(p.brand) === brand).length}
                      </div>
                    </label>
                  ))}
                  {filteredBrandOptions.length === 0 && (
                    <div className="text-sm text-gray-500 px-2 py-1">
                      No brands found
                    </div>
                  )}
                </div>
              </div>

              {(activeCategory === "smartphones" || activeCategory === "laptops") && (
                <>
                  {ramOptions.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-bold text-gray-900 text-base">Memory (RAM)</h4>
                          <p className="text-xs text-gray-500 mt-1">
                            Multitasking performance
                          </p>
                        </div>
                        <span className="text-xs font-bold text-purple-600 bg-purple-100 px-2.5 py-1.5 rounded-full">
                          {selectedRam.length}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {ramOptions.map((ram) => (
                          <label
                            key={ram}
                            className={`flex items-center justify-center cursor-pointer px-3 py-2.5 rounded-xl transition-all duration-200 font-medium ${
                              selectedRam.includes(ram)
                                ? "bg-gradient-to-b from-purple-200 to-blue-200 text-blue-500"
                                : "text-gray-700 hover:border-gray-300 bg-gradient-to-br from-purple-50 to-blue-50 border border-indigo-100"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedRam.includes(ram)}
                              onChange={() =>
                                setSelectedRam((prev) =>
                                  prev.includes(ram)
                                    ? prev.filter((value) => value !== ram)
                                    : [...prev, ram],
                                )
                              }
                              className="sr-only"
                            />
                            <span>{ram}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {storageOptions.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-bold text-gray-900 text-base">Storage Capacity</h4>
                          <p className="text-xs text-gray-500 mt-1">
                            Apps and media space
                          </p>
                        </div>
                        <span className="text-xs font-bold text-purple-600 bg-purple-100 px-2.5 py-1.5 rounded-full">
                          {selectedStorage.length}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {storageOptions.map((storage) => (
                          <label
                            key={storage}
                            className={`flex items-center justify-center cursor-pointer px-3 py-2.5 rounded-xl transition-all duration-200 font-medium ${
                              selectedStorage.includes(storage)
                                ? "bg-gradient-to-b from-purple-200 to-blue-200 text-blue-500"
                                : "bg-gradient-to-br from-purple-50 to-blue-50 border border-indigo-100 text-gray-700 hover:border-gray-300"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedStorage.includes(storage)}
                              onChange={() =>
                                setSelectedStorage((prev) =>
                                  prev.includes(storage)
                                    ? prev.filter((value) => value !== storage)
                                    : [...prev, storage],
                                )
                              }
                              className="sr-only"
                            />
                            <span className="text-sm">{storage}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {activeCategory === "tvs" && (
                <>
                  {screenOptions.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-bold text-gray-900 text-base">Screen Size</h4>
                          <p className="text-xs text-gray-500 mt-1">
                            Select preferred display size
                          </p>
                        </div>
                        <span className="text-xs font-bold text-purple-600 bg-purple-100 px-2.5 py-1.5 rounded-full">
                          {selectedScreen.length}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {screenOptions.map((screen) => (
                          <label
                            key={screen}
                            className={`flex items-center justify-between gap-2 cursor-pointer px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                              selectedScreen.includes(screen)
                                ? "bg-gradient-to-r from-purple-200 to-blue-200 text-blue-500"
                                : "bg-gradient-to-br from-purple-50 to-blue-50 border border-indigo-100 text-gray-700 hover:border-gray-300"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedScreen.includes(screen)}
                              onChange={() =>
                                setSelectedScreen((prev) =>
                                  prev.includes(screen)
                                    ? prev.filter((value) => value !== screen)
                                    : [...prev, screen],
                                )
                              }
                              className="sr-only"
                            />
                            <span>{screen}</span>
                            <div
                              className={`w-2 h-2 rounded-full ${
                                selectedScreen.includes(screen)
                                  ? "bg-blue-500"
                                  : "bg-gray-300"
                              }`}
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {resolutionOptions.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-bold text-gray-900 text-base">Resolution</h4>
                          <p className="text-xs text-gray-500 mt-1">
                            Filter by panel resolution
                          </p>
                        </div>
                        <span className="text-xs font-bold text-purple-600 bg-purple-100 px-2.5 py-1.5 rounded-full">
                          {selectedResolution.length}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {resolutionOptions.map((resolution) => (
                          <label
                            key={resolution}
                            className={`flex items-center justify-between gap-2 cursor-pointer px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                              selectedResolution.includes(resolution)
                                ? "bg-gradient-to-r from-purple-200 to-blue-200 text-blue-500"
                                : "bg-gradient-to-br from-purple-50 to-blue-50 border border-indigo-100 text-gray-700 hover:border-gray-300"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedResolution.includes(resolution)}
                              onChange={() =>
                                setSelectedResolution((prev) =>
                                  prev.includes(resolution)
                                    ? prev.filter((value) => value !== resolution)
                                    : [...prev, resolution],
                                )
                              }
                              className="sr-only"
                            />
                            <span>{resolution}</span>
                            <div
                              className={`w-2 h-2 rounded-full ${
                                selectedResolution.includes(resolution)
                                  ? "bg-blue-500"
                                  : "bg-gray-300"
                              }`}
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="p-4 border-t border-gray-200 bg-white flex gap-3">
              <button
                onClick={clearAllFilters}
                className="flex-1 h-11 border border-gray-300 text-gray-700 rounded-xl font-semibold"
              >
                Clear all
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="flex-1 h-11 bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600 text-white rounded-xl font-semibold"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrendingProductsHub;
