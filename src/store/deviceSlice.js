import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import Cookies from "js-cookie";

// Normalization helpers (copied from previous DeviceContext)
const toNumber = (v) => {
  if (v == null || v === "") return null;
  const n = Number(String(v).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : null;
};

const normalizeSensors = (s) => {
  if (s == null) return null;
  if (typeof s === "string") {
    const t = s.trim();
    if (t.startsWith("{") || t.startsWith("[")) {
      try {
        return JSON.parse(t);
      } catch (e) {
        return s;
      }
    }
    return s;
  }
  return s;
};

const normalizeColors = (c) => {
  if (c == null) return [];
  if (Array.isArray(c)) {
    return c
      .map((item) => {
        if (item && typeof item === "object") return item;
        if (typeof item === "string") {
          const t = item.trim();
          if (t === "[object Object]") return null;
          if (t.startsWith("{") || t.startsWith("[")) {
            try {
              return JSON.parse(t);
            } catch (e) {
              return t;
            }
          }
          return t;
        }
        return item;
      })
      .filter(Boolean);
  }
  if (typeof c === "string") {
    const t = c.trim();
    if (t.startsWith("[") || t.startsWith("{")) {
      try {
        const parsed = JSON.parse(t);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch (e) {
        return [t];
      }
    }
    return [t];
  }
  return [];
};

const normalizeImages = (imgs) => {
  if (imgs == null) return [];
  if (Array.isArray(imgs)) return imgs.filter(Boolean).map(String);
  if (typeof imgs === "string") {
    const t = imgs.trim();
    if (t.startsWith("[") || t.startsWith("{")) {
      try {
        const parsed = JSON.parse(t);
        return Array.isArray(parsed)
          ? parsed.filter(Boolean).map(String)
          : [String(parsed)];
      } catch (e) {
        return [t];
      }
    }
    return [t];
  }
  return [];
};

const normalizeStorePrices = (sp) => {
  if (!Array.isArray(sp)) return [];
  return sp
    .filter(Boolean)
    .map((p) => {
      const price =
        toNumber(p.price ?? p.amount ?? p.base_price) ??
        p.price ??
        p.amount ??
        null;
      const url = p.url ?? p.link ?? p.url_link ?? null;
      const store = p.store ?? p.store_name ?? p.storeName ?? null;
      const offer = p.offer_text ?? p.offer ?? null;
      const delivery = p.delivery_info ?? p.delivery ?? null;
      return {
        ...p,
        price,
        url,
        store,
        offer,
        delivery,
      };
    })
    .map((p) => ({ ...p }));
};

// Normalize variants to always be an array of objects
const normalizeVariants = (d) => {
  if (!d) return [];
  let v = d.variants ?? d.variant ?? null;

  const makeVariant = (item, idx) => {
    if (item == null) return null;
    let vItem = item;
    if (typeof vItem === "string") {
      const t = vItem.trim();
      if (t.startsWith("[") || t.startsWith("{")) {
        try {
          vItem = JSON.parse(t);
        } catch (e) {
          // leave as string price fallback
          return {
            id: `${d.id}-${idx}`,
            ram: null,
            storage: null,
            base_price: toNumber(t) ?? t,
            store_prices: [],
          };
        }
      } else {
        return {
          id: `${d.id}-${idx}`,
          ram: null,
          storage: null,
          base_price: toNumber(t) ?? t,
          store_prices: [],
        };
      }
    }

    if (Array.isArray(vItem)) {
      return null;
    }

    const id = vItem.id ?? vItem.variant_id ?? `${d.id}-${idx}`;
    const ram = vItem.ram ?? vItem.RAM ?? vItem.memory ?? null;
    const storage =
      vItem.storage ??
      vItem.internal_storage ??
      vItem.storage_capacity ??
      vItem.rom ??
      null;
    const base_price =
      toNumber(vItem.price ?? vItem.base_price ?? vItem.amount) ??
      vItem.price ??
      vItem.base_price ??
      null;
    const store_prices = normalizeStorePrices(
      vItem.store_prices ?? vItem.storePrices ?? d.store_prices ?? [],
    );

    return { ...vItem, id, ram, storage, base_price, store_prices };
  };

  if (Array.isArray(v)) {
    return v.map((it, i) => makeVariant(it, i)).filter((x) => x != null);
  }

  if (v && typeof v === "object") {
    const single = makeVariant(v, 0);
    return single ? [single] : [];
  }

  // fallback: construct a single variant from top-level fields if available
  const topRam = d.ram ?? d.RAM ?? null;
  const topStorage =
    d.storage ?? d.internal_storage ?? d.storage_capacity ?? null;
  const topPrice = toNumber(d.price) ?? (d.price || null);
  if (topRam || topStorage || topPrice) {
    return [
      {
        id: `${d.id}-0`,
        ram: topRam,
        storage: topStorage,
        base_price: topPrice,
        store_prices: normalizeStorePrices(d.store_prices),
      },
    ];
  }

  return [];
};

const normalizeDate = (d) => {
  if (!d) return null;
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return d;
  return dt.toISOString();
};

export const fetchSmartphones = createAsyncThunk(
  "device/fetchSmartphones",
  // Accept an optional options object: { feature }
  async (opts = {}, { rejectWithValue }) => {
    try {
      const res = await fetch("https://api.apisphere.in/api/smartphones");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const arr = Array.isArray(data)
        ? data
        : Array.isArray(data.smartphones)
          ? data.smartphones
          : Array.isArray(data.data)
            ? data.data
            : Array.isArray(data.rows)
              ? data.rows
              : [];

      const publishArr = Array.isArray(data.publish) ? data.publish : [];
      const publishMap = {};
      for (const p of publishArr)
        publishMap[p.smartphone_id ?? p.product_id ?? p.id] = p;

      const mapped = (arr || []).map((d) => {
        const id = d.product_id ?? d.id ?? null;
        const variants = normalizeVariants(d);

        // aggregate store prices from variants (variants already normalize their store_prices)
        const aggregatedStorePrices = (variants || []).flatMap(
          (v) => v.store_prices || [],
        );

        // derive a numeric price (lowest variant price if present, else top-level price)
        const priceFromVariants = (variants || []).reduce((acc, v) => {
          const p =
            toNumber(v.base_price ?? v.price) ?? v.base_price ?? v.price;
          if (p == null) return acc;
          if (acc == null) return p;
          return Math.min(acc, p);
        }, null);

        const price = priceFromVariants ?? toNumber(d.price) ?? d.price ?? null;

        return {
          ...d,
          id,
          product_id: d.product_id ?? d.id ?? null,
          name: d.name ?? d.model ?? null,
          product_type: d.product_type ?? null,
          brand: d.brand_name ?? d.brand ?? null,
          category: d.category ?? null,
          model: d.model ?? d.name ?? null,
          published: publishMap[id] ? !!publishMap[id].published : false,
          sensors: normalizeSensors(d.sensors),
          colors: normalizeColors(d.colors),
          images: normalizeImages(d.images),
          price,
          store_prices: aggregatedStorePrices,
          launch_date: normalizeDate(d.launch_date ?? d.created_at),
          variants,
        };
      });

      return mapped;
    } catch (err) {
      return rejectWithValue(err.message || String(err));
    }
  },
);

// Trending smartphones (DB-driven)
export const fetchTrendingSmartphones = createAsyncThunk(
  "device/fetchTrendingSmartphones",
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch(
        "https://api.apisphere.in/api/public/trending/smartphones",
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const arr = Array.isArray(data)
        ? data
        : Array.isArray(data.smartphones)
          ? data.smartphones
          : Array.isArray(data.data)
            ? data.data
            : Array.isArray(data.rows)
              ? data.rows
              : [];

      const publishArr = Array.isArray(data.publish) ? data.publish : [];
      const publishMap = {};
      for (const p of publishArr)
        publishMap[p.smartphone_id ?? p.product_id ?? p.id] = p;

      const mapped = (arr || []).map((d) => {
        const id = d.product_id ?? d.id ?? null;
        const variants = normalizeVariants(d);

        let storePrices = (variants || []).flatMap((v) => v.store_prices || []);

        const priceFromVariants = (variants || []).reduce((acc, v) => {
          const p =
            toNumber(v.base_price ?? v.price) ?? v.base_price ?? v.price;
          if (p == null) return acc;
          if (acc == null) return p;
          return Math.min(acc, p);
        }, null);

        const price = priceFromVariants ?? toNumber(d.price) ?? d.price ?? null;

        return {
          ...d,
          id,
          product_id: d.product_id ?? d.id ?? null,
          name: d.name ?? d.model ?? null,
          product_type: d.product_type ?? null,
          brand: d.brand_name ?? d.brand ?? null,
          category: d.category ?? null,
          model: d.model ?? d.name ?? null,
          published: publishMap[id] ? !!publishMap[id].published : false,
          sensors: normalizeSensors(d.sensors),
          colors: normalizeColors(d.colors),
          images: normalizeImages(d.images),
          price,
          store_prices: storePrices,
          launch_date: normalizeDate(d.launch_date ?? d.created_at),
          variants,
        };
      });

      return mapped;
    } catch (err) {
      return rejectWithValue(err.message || String(err));
    }
  },
);

// New launches - latest products
export const fetchNewLaunchSmartphones = createAsyncThunk(
  "device/fetchNewLaunchSmartphones",
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch(
        "https://api.apisphere.in/api/public/new/smartphones",
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const arr = Array.isArray(data)
        ? data
        : Array.isArray(data.smartphones)
          ? data.smartphones
          : Array.isArray(data.data)
            ? data.data
            : Array.isArray(data.rows)
              ? data.rows
              : [];

      const publishArr = Array.isArray(data.publish) ? data.publish : [];
      const publishMap = {};
      for (const p of publishArr)
        publishMap[p.smartphone_id ?? p.product_id ?? p.id] = p;

      const mapped = (arr || []).map((d) => {
        const id = d.product_id ?? d.id ?? null;
        const variants = normalizeVariants(d);
        let storePrices = (variants || []).flatMap((v) => v.store_prices || []);

        const priceFromVariants = (variants || []).reduce((acc, v) => {
          const p =
            toNumber(v.base_price ?? v.price) ?? v.base_price ?? v.price;
          if (p == null) return acc;
          if (acc == null) return p;
          return Math.min(acc, p);
        }, null);

        const price = priceFromVariants ?? toNumber(d.price) ?? d.price ?? null;

        return {
          ...d,
          id,
          product_id: d.product_id ?? d.id ?? null,
          name: d.name ?? d.model ?? null,
          product_type: d.product_type ?? null,
          brand: d.brand_name ?? d.brand ?? null,
          category: d.category ?? null,
          model: d.model ?? d.name ?? null,
          published: publishMap[id] ? !!publishMap[id].published : false,
          sensors: normalizeSensors(d.sensors),
          colors: normalizeColors(d.colors),
          images: normalizeImages(d.images),
          price,
          store_prices: storePrices,
          launch_date: normalizeDate(d.launch_date ?? d.created_at),
          variants,
        };
      });

      return mapped;
    } catch (err) {
      return rejectWithValue(err.message || String(err));
    }
  },
);

export const fetchNetworking = createAsyncThunk(
  "device/fetchNetworking",
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch("https://api.apisphere.in/api/networking");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json();
      const arr = Array.isArray(body)
        ? body
        : Array.isArray(body.networking)
          ? body.networking
          : Array.isArray(body.data)
            ? body.data
            : Array.isArray(body.rows)
              ? body.rows
              : [];
      return arr;
    } catch (err) {
      return rejectWithValue(err.message || String(err));
    }
  },
);

// Trending networking
export const fetchTrendingNetworking = createAsyncThunk(
  "device/fetchTrendingNetworking",
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch(
        "https://api.apisphere.in/api/public/trending/networking",
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json();
      const arr = Array.isArray(body)
        ? body
        : Array.isArray(body.trending)
          ? body.trending
          : Array.isArray(body.data)
            ? body.data
            : Array.isArray(body.rows)
              ? body.rows
              : [];
      return arr;
    } catch (err) {
      return rejectWithValue(err.message || String(err));
    }
  },
);

// New launch networking
export const fetchNewLaunchNetworking = createAsyncThunk(
  "device/fetchNewLaunchNetworking",
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch(
        "https://api.apisphere.in/api/public/new/networking",
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json();
      const arr = Array.isArray(body)
        ? body
        : Array.isArray(body.new)
          ? body.new
          : Array.isArray(body.data)
            ? body.data
            : Array.isArray(body.rows)
              ? body.rows
              : [];
      return arr;
    } catch (err) {
      return rejectWithValue(err.message || String(err));
    }
  },
);

export const fetchLaptops = createAsyncThunk(
  "device/fetchLaptops",
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch("https://api.apisphere.in/api/laptops");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json();
      const arr = Array.isArray(body)
        ? body
        : Array.isArray(body.laptops)
          ? body.laptops
          : Array.isArray(body.data)
            ? body.data
            : Array.isArray(body.rows)
              ? body.rows
              : [];
      return arr;
    } catch (err) {
      return rejectWithValue(err.message || String(err));
    }
  },
);

// Trending laptops
export const fetchTrendingLaptops = createAsyncThunk(
  "device/fetchTrendingLaptops",
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch(
        "https://api.apisphere.in/api/public/trending/laptops",
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json();
      const arr = Array.isArray(body)
        ? body
        : Array.isArray(body.laptops)
          ? body.laptops
          : Array.isArray(body.data)
            ? body.data
            : Array.isArray(body.rows)
              ? body.rows
              : [];
      return arr;
    } catch (err) {
      return rejectWithValue(err.message || String(err));
    }
  },
);

// New launch laptops
export const fetchNewLaunchLaptops = createAsyncThunk(
  "device/fetchNewLaunchLaptops",
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch(
        "https://api.apisphere.in/api/public/new/laptops",
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json();
      const arr = Array.isArray(body)
        ? body
        : Array.isArray(body.laptops)
          ? body.laptops
          : Array.isArray(body.data)
            ? body.data
            : Array.isArray(body.rows)
              ? body.rows
              : [];
      return arr;
    } catch (err) {
      return rejectWithValue(err.message || String(err));
    }
  },
);

export const fetchHomeAppliances = createAsyncThunk(
  "device/fetchHomeAppliances",
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch("https://api.apisphere.in/api/homeappliances");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json();
      const arr = Array.isArray(body)
        ? body
        : Array.isArray(body.home_appliances)
          ? body.home_appliances
          : Array.isArray(body.data)
            ? body.data
            : Array.isArray(body.rows)
              ? body.rows
              : [];
      return arr;
    } catch (err) {
      return rejectWithValue(err.message || String(err));
    }
  },
);

// Trending home appliances
export const fetchTrendingHomeAppliances = createAsyncThunk(
  "device/fetchTrendingHomeAppliances",
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch(
        "https://api.apisphere.in/api/public/trending/appliances",
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json();
      const arr = Array.isArray(body)
        ? body
        : Array.isArray(body.trending)
          ? body.trending
          : Array.isArray(body.data)
            ? body.data
            : Array.isArray(body.rows)
              ? body.rows
              : [];
      return arr;
    } catch (err) {
      return rejectWithValue(err.message || String(err));
    }
  },
);

// New launch home appliances
export const fetchNewLaunchHomeAppliances = createAsyncThunk(
  "device/fetchNewLaunchHomeAppliances",
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch(
        "https://api.apisphere.in/api/public/new/appliances",
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json();
      const arr = Array.isArray(body)
        ? body
        : Array.isArray(body.new)
          ? body.new
          : Array.isArray(body.data)
            ? body.data
            : Array.isArray(body.rows)
              ? body.rows
              : [];
      return arr;
    } catch (err) {
      return rejectWithValue(err.message || String(err));
    }
  },
);

export const fetchBrands = createAsyncThunk(
  "device/fetchBrands",
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch("https://api.apisphere.in/api/brand");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const arr = Array.isArray(data)
        ? data
        : Array.isArray(data.data)
          ? data.data
          : Array.isArray(data.rows)
            ? data.rows
            : [];
      const normalizeStatus = (s) => {
        if (typeof s === "boolean") return s;
        if (s === null || typeof s === "undefined") return false;
        const str = String(s).toLowerCase();
        return (
          str === "true" ||
          str === "1" ||
          str === "visible" ||
          str === "active" ||
          str === "yes"
        );
      };

      // Normalize brand objects from various possible API shapes
      const normalizeBrand = (c) => {
        const id = c?.id ?? c?.brand_id ?? c?._id ?? null;
        const name = (c?.name ?? c?.brand_name ?? c?.title ?? "") || null;
        const logo =
          c?.logo ??
          c?.image ??
          c?.logo_url ??
          c?.thumbnail ??
          c?.logoUrl ??
          null;
        const published_products =
          toNumber(
            c?.published_products ??
              c?.published_products_count ??
              c?.products_count ??
              c?.products,
          ) ??
          toNumber(c?.published) ??
          null;
        const slug =
          c?.slug ??
          (name ? String(name).toLowerCase().replace(/\s+/g, "-") : null);
        const category = c?.category ?? c?.cat ?? c?.type ?? null;
        const created_at = normalizeDate(
          c?.created_at ?? c?.createdAt ?? c?.created,
        );

        return {
          id,
          name,
          logo,
          category,
          created_at,
          published_products,
          status: normalizeStatus(
            c?.status ?? c?.is_visible ?? c?.published ?? c?.active ?? true,
          ),
          slug,
          raw: c,
        };
      };

      // If API returned categories that contain `brands` arrays, preserve that structure
      const looksLikeCategory = (item) => item && Array.isArray(item.brands);
      if (arr.length > 0 && looksLikeCategory(arr[0])) {
        return arr.map((cat) => ({
          ...cat,
          status: normalizeStatus(cat.status),
          brands: Array.isArray(cat.brands)
            ? cat.brands.map(normalizeBrand)
            : [],
        }));
      }

      // Otherwise treat the response as a flat list of brand objects
      const normalized = arr.map((c) => normalizeBrand(c));
      return normalized;
    } catch (err) {
      return rejectWithValue(err.message || String(err));
    }
  },
  {
    condition: (_, { getState }) => {
      const state = getState();
      return !state?.device?.brandsLoading && !state?.device?.brandsLoaded;
    },
  },
);

// Fetch categories (public/admin endpoint). Includes auth token if available.
export const fetchCategories = createAsyncThunk(
  "device/fetchCategories",
  async (_, { rejectWithValue }) => {
    try {
      // Use the public categories endpoint (no auth) to avoid 401 on public site
      const res = await fetch("https://api.apisphere.in/api/category", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json();

      let rows = [];
      if (Array.isArray(body)) rows = body;
      else if (Array.isArray(body?.data)) rows = body.data;
      else if (Array.isArray(body?.categories)) rows = body.categories;
      else if (Array.isArray(body?.rows)) rows = body.rows;
      else rows = [];

      // Normalize to a simple category shape
      const normalized = (rows || []).map((c) => ({
        id: c.id ?? c.category_id ?? c.name ?? null,
        name:
          c.name ??
          c.title ??
          c.product_type ??
          String(c.id || "").toLowerCase(),
        product_type: c.product_type ?? c.type ?? null,
        description: c.description ?? null,
        brands: Array.isArray(c.brands) ? c.brands : [],
        raw: c,
      }));

      return normalized;
    } catch (err) {
      return rejectWithValue(err.message || String(err));
    }
  },
  {
    condition: (_, { getState }) => {
      const state = getState();
      return (
        !state?.device?.categoriesLoading && !state?.device?.categoriesLoaded
      );
    },
  },
);

// Fetch a single smartphone by id (numeric) or by model/name (non-numeric).
export const fetchSmartphone = createAsyncThunk(
  "device/fetchSmartphone",
  async (identifier, { rejectWithValue }) => {
    try {
      if (!identifier) throw new Error("Missing identifier");

      const mapSingle = (d) => ({
        ...d,
        sensors: normalizeSensors(d.sensors),
        colors: normalizeColors(d.colors),
        images: normalizeImages(d.images),
        price: toNumber(d.price) ?? (d.price || null),
        store_prices: normalizeStorePrices(d.store_prices),
        launch_date: normalizeDate(d.launch_date || d.created_at),
        variants: normalizeVariants(d),
      });

      const numericId = Number(identifier);
      if (!Number.isNaN(numericId) && String(identifier).trim() !== "") {
        // try fetch by id using public endpoint
        const res = await fetch(
          `https://api.apisphere.in/api/public/product/${encodeURIComponent(
            identifier,
          )}`,
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const body = await res.json();
        console.log("Public product response:", body);

        if (!body || !body.id) {
          throw new Error("Invalid product data");
        }

        // Body is already flattened, use it directly
        return mapSingle(body);
      }

      // fallback: throw error
      throw new Error("Device not found by identifier");
    } catch (err) {
      return rejectWithValue(err.message || String(err));
    }
  },
);

const initialState = {
  categories: [],
  categoriesLoading: false,
  categoriesLoaded: false,
  smartphone: [],
  // always keep the full list available (feature/trending/new pages can set `smartphone`)
  smartphoneAll: [],
  networking: [],
  homeAppliances: [],
  // flat registry for quick lookups by type:id
  devicesById: {},
  brands: [],
  history: [],
  selectedDevice: null,
  filters: {
    brand: [],
    priceRange: { min: 0, max: 300000 },
    ram: [],
    storage: [],
    battery: [],
    processor: [],
    network: [],
    refreshRate: [],
    camera: [],
  },
  loading: false,
  error: null,
  loaded: false,
  networkingLoading: false,
  networkingLoaded: false,
  homeAppliancesLoading: false,
  homeAppliancesLoaded: false,
  brandsLoading: false,
  brandsLoaded: false,
  laptops: [],
  laptopsLoading: false,
  laptopsLoaded: false,
};

const deviceSlice = createSlice({
  name: "device",
  initialState,
  reducers: {
    addToHistory(state, action) {
      const payload = action.payload || {};
      const entry = {
        id: payload.id ?? null,
        model: payload.model ?? null,
        timestamp: Date.now(),
      };
      state.history = [...state.history, entry];
    },
    clearHistory(state) {
      state.history = [];
    },
    setFilters(state, action) {
      state.filters = { ...(state.filters || {}), ...(action.payload || {}) };
    },
    selectDeviceById(state, action) {
      const id = action.payload;
      if (id == null) {
        state.selectedDevice = null;
        return;
      }
      const list =
        (state.smartphoneAll && state.smartphoneAll.length
          ? state.smartphoneAll
          : state.smartphone) || [];
      const dev = list.find(
        (s) => String(s.id) === String(id) || String(s.name) === String(id),
      );
      if (dev) {
        state.selectedDevice = dev;
        state.history = [
          ...state.history,
          {
            id: dev.id ?? null,
            model: dev.model ?? null,
            timestamp: Date.now(),
          },
        ];
      } else if (!state.loading) {
        state.selectedDevice = null;
      }
    },
    selectDeviceByModel(state, action) {
      const model = action.payload;
      if (!model) {
        state.selectedDevice = null;
        return;
      }
      const list =
        (state.smartphoneAll && state.smartphoneAll.length
          ? state.smartphoneAll
          : state.smartphone) || [];
      const dev = list.find(
        (s) => String(s.model) === String(model),
      );
      if (dev) {
        state.selectedDevice = dev;
        state.history = [
          ...state.history,
          {
            id: dev.id ?? null,
            model: dev.model ?? null,
            timestamp: Date.now(),
          },
        ];
      } else if (!state.loading) {
        state.selectedDevice = null;
      }
    },
    // Allow registering normalized devices into the store for a given category
    setDevicesForType(state, action) {
      const payload = action.payload || {};
      const type = payload.type || null;
      const devices = Array.isArray(payload.devices) ? payload.devices : [];
      if (!type) return;
      // map known types to state keys
      const keyMap = {
        smartphone: "smartphone",
        smartphones: "smartphone",
        laptop: "laptops",
        laptops: "laptops",
        networking: "networking",
        "home-appliance": "homeAppliances",
        home_appliance: "homeAppliances",
        appliances: "homeAppliances",
        homeappliance: "homeAppliances",
      };
      const key = keyMap[type] || type;
      if (state.hasOwnProperty(key)) {
        const existing = state[key] || [];

        // If lengths differ, replace. Otherwise compare ids to avoid
        // replacing with a new array reference when contents are identical.
        const existingIds = new Set(
          existing.map((d) => d?.id ?? d?.product_id ?? d?.productId),
        );
        const incomingIds = (devices || []).map(
          (d) => d?.id ?? d?.product_id ?? d?.productId,
        );

        const isSame =
          existing.length === incomingIds.length &&
          incomingIds.every((id) => existingIds.has(id));

        if (!isSame) {
          state[key] = devices;
        }
      }
    },
    // set a single device into flat registry by productType and productId
    setDevice(state, action) {
      const payload = action.payload || {};
      const type = payload.productType || payload.type || null;
      const id = payload.productId ?? payload.id ?? null;
      const device = payload.device || payload;
      if (!type || id == null) return;
      const key = `${type}:${String(id)}`;
      state.devicesById = state.devicesById || {};
      state.devicesById[key] = device;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSmartphones.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSmartphones.fulfilled, (state, action) => {
        state.smartphone = action.payload || [];
        state.smartphoneAll = action.payload || [];
        state.loading = false;
        state.loaded = true;
        state.error = null;
      })
      .addCase(fetchSmartphones.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload || action.error?.message || String(action.error);
      })
      .addCase(fetchTrendingSmartphones.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTrendingSmartphones.fulfilled, (state, action) => {
        state.smartphone = action.payload || [];
        state.loading = false;
      })
      .addCase(fetchTrendingSmartphones.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload || action.error?.message || String(action.error);
      })
      .addCase(fetchNewLaunchSmartphones.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNewLaunchSmartphones.fulfilled, (state, action) => {
        state.smartphone = action.payload || [];
        state.loading = false;
      })
      .addCase(fetchNewLaunchSmartphones.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload || action.error?.message || String(action.error);
      })
      .addCase(fetchBrands.pending, (state) => {
        state.brandsLoading = true;
        state.error = null;
      })
      .addCase(fetchBrands.fulfilled, (state, action) => {
        state.brands = action.payload || [];
        state.brandsLoading = false;
        state.brandsLoaded = true;
      })
      .addCase(fetchBrands.rejected, (state, action) => {
        state.brandsLoading = false;
        state.brandsLoaded = true;
        state.error =
          action.payload || action.error?.message || String(action.error);
      });
    // categories
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.categoriesLoading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories = action.payload || [];
        state.categoriesLoading = false;
        state.categoriesLoaded = true;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.categoriesLoading = false;
        state.categoriesLoaded = true;
        state.error =
          action.payload || action.error?.message || String(action.error);
      });
    // networking list
    builder
      .addCase(fetchNetworking.pending, (state) => {
        state.networkingLoading = true;
        state.error = null;
      })
      .addCase(fetchNetworking.fulfilled, (state, action) => {
        state.networking = action.payload || [];
        state.networkingLoading = false;
        state.networkingLoaded = true;
      })
      .addCase(fetchNetworking.rejected, (state, action) => {
        state.networkingLoading = false;
        state.error =
          action.payload || action.error?.message || String(action.error);
      });
    // trending/new networking
    builder
      .addCase(fetchTrendingNetworking.pending, (state) => {
        state.networkingLoading = true;
        state.error = null;
      })
      .addCase(fetchTrendingNetworking.fulfilled, (state, action) => {
        state.networking = action.payload || [];
        state.networkingLoading = false;
      })
      .addCase(fetchTrendingNetworking.rejected, (state, action) => {
        state.networkingLoading = false;
        state.error =
          action.payload || action.error?.message || String(action.error);
      })
      .addCase(fetchNewLaunchNetworking.pending, (state) => {
        state.networkingLoading = true;
        state.error = null;
      })
      .addCase(fetchNewLaunchNetworking.fulfilled, (state, action) => {
        state.networking = action.payload || [];
        state.networkingLoading = false;
      })
      .addCase(fetchNewLaunchNetworking.rejected, (state, action) => {
        state.networkingLoading = false;
        state.error =
          action.payload || action.error?.message || String(action.error);
      });
    // home appliances list
    builder
      .addCase(fetchHomeAppliances.pending, (state) => {
        state.homeAppliancesLoading = true;
        state.error = null;
      })
      .addCase(fetchHomeAppliances.fulfilled, (state, action) => {
        state.homeAppliances = action.payload || [];
        state.homeAppliancesLoading = false;
        state.homeAppliancesLoaded = true;
      })
      .addCase(fetchHomeAppliances.rejected, (state, action) => {
        state.homeAppliancesLoading = false;
        state.error =
          action.payload || action.error?.message || String(action.error);
      });
    // trending/new home appliances
    builder
      .addCase(fetchTrendingHomeAppliances.pending, (state) => {
        state.homeAppliancesLoading = true;
        state.error = null;
      })
      .addCase(fetchTrendingHomeAppliances.fulfilled, (state, action) => {
        state.homeAppliances = action.payload || [];
        state.homeAppliancesLoading = false;
      })
      .addCase(fetchTrendingHomeAppliances.rejected, (state, action) => {
        state.homeAppliancesLoading = false;
        state.error =
          action.payload || action.error?.message || String(action.error);
      })
      .addCase(fetchNewLaunchHomeAppliances.pending, (state) => {
        state.homeAppliancesLoading = true;
        state.error = null;
      })
      .addCase(fetchNewLaunchHomeAppliances.fulfilled, (state, action) => {
        state.homeAppliances = action.payload || [];
        state.homeAppliancesLoading = false;
      })
      .addCase(fetchNewLaunchHomeAppliances.rejected, (state, action) => {
        state.homeAppliancesLoading = false;
        state.error =
          action.payload || action.error?.message || String(action.error);
      });
    // laptops list
    builder
      .addCase(fetchLaptops.pending, (state) => {
        state.laptopsLoading = true;
        state.error = null;
      })
      .addCase(fetchLaptops.fulfilled, (state, action) => {
        state.laptops = action.payload || [];
        state.laptopsLoading = false;
        state.laptopsLoaded = true;
      })
      .addCase(fetchLaptops.rejected, (state, action) => {
        state.laptopsLoading = false;
        state.error =
          action.payload || action.error?.message || String(action.error);
      });
    // trending / new laptops
    builder
      .addCase(fetchTrendingLaptops.pending, (state) => {
        state.laptopsLoading = true;
        state.error = null;
      })
      .addCase(fetchTrendingLaptops.fulfilled, (state, action) => {
        state.laptops = action.payload || [];
        state.laptopsLoading = false;
      })
      .addCase(fetchTrendingLaptops.rejected, (state, action) => {
        state.laptopsLoading = false;
        state.error =
          action.payload || action.error?.message || String(action.error);
      })
      .addCase(fetchNewLaunchLaptops.pending, (state) => {
        state.laptopsLoading = true;
        state.error = null;
      })
      .addCase(fetchNewLaunchLaptops.fulfilled, (state, action) => {
        state.laptops = action.payload || [];
        state.laptopsLoading = false;
      })
      .addCase(fetchNewLaunchLaptops.rejected, (state, action) => {
        state.laptopsLoading = false;
        state.error =
          action.payload || action.error?.message || String(action.error);
      });
    // single smartphone fetch handlers
    builder
      .addCase(fetchSmartphone.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSmartphone.fulfilled, (state, action) => {
        // Wrap the single device in a structure that matches what Smartphone.jsx expects
        const device = action.payload;
        state.selectedDevice = {
          smartphones: [device],
          ...device,
        };
        state.loading = false;
      })
      .addCase(fetchSmartphone.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload || action.error?.message || String(action.error);
      });
  },
});

export const {
  addToHistory,
  clearHistory,
  setFilters,
  selectDeviceById,
  selectDeviceByModel,
  setDevicesForType,
  setDevice,
} = deviceSlice.actions;

export default deviceSlice.reducer;
