import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

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
  return sp.filter(Boolean).map((p) => ({
    ...p,
    price: toNumber(p.price) ?? (p.price || null),
    url: p.url || null,
    store: p.store || null,
  }));
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
      vItem.store_prices ?? vItem.storePrices ?? d.store_prices ?? []
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
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch("http://localhost:5000/api/smartphone");
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
      for (const p of publishArr) publishMap[p.smartphone_id] = p;

      const mapped = (arr || []).map((d) => ({
        ...d,
        published: publishMap[d.id] ? !!publishMap[d.id].published : false,
        sensors: normalizeSensors(d.sensors),
        colors: normalizeColors(d.colors),
        images: normalizeImages(d.images),
        price: toNumber(d.price) ?? (d.price || null),
        store_prices: normalizeStorePrices(d.store_prices),
        launch_date: normalizeDate(d.launch_date || d.created_at),
        variants: normalizeVariants(d),
      }));

      return mapped;
    } catch (err) {
      return rejectWithValue(err.message || String(err));
    }
  }
);

export const fetchBrands = createAsyncThunk(
  "device/fetchBrands",
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch("http://localhost:5000/api/categories");
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
        return str === "true" || str === "1" || str === "visible";
      };

      // Rename category info to `brands` for downstream components
      const normalized = arr.map((c) => ({
        ...c,
        status: normalizeStatus(c.status),
        brands: c.category || c.categoryType || c.name || null,
      }));

      return normalized;
    } catch (err) {
      return rejectWithValue(err.message || String(err));
    }
  }
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
        // try fetch by id
        const res = await fetch(
          `http://localhost:5000/api/smartphone/${encodeURIComponent(
            identifier
          )}`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const body = await res.json();
        // body may be the object itself or wrapped
        const obj = body && (body.smartphone || body || null);
        if (!obj || (Array.isArray(obj) && obj.length === 0))
          throw new Error("Device not found");
        const result = Array.isArray(obj) ? obj[0] : obj;
        return mapSingle(result);
      }

      // fallback: fetch list and find by model/name
      const res = await fetch("http://localhost:5000/api/smartphone");
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

      const found = (arr || []).find(
        (d) =>
          String(d.model) === String(identifier) ||
          String(d.name) === String(identifier) ||
          String(d.id) === String(identifier)
      );
      if (!found) throw new Error("Device not found");
      return mapSingle(found);
    } catch (err) {
      return rejectWithValue(err.message || String(err));
    }
  }
);

const initialState = {
  smartphone: [],
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
  brandsLoading: false,
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
      const dev = (state.smartphone || []).find(
        (s) => String(s.id) === String(id) || String(s.name) === String(id)
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
      const dev = (state.smartphone || []).find(
        (s) => String(s.model) === String(model)
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
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSmartphones.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSmartphones.fulfilled, (state, action) => {
        state.smartphone = action.payload || [];
        state.loading = false;
        state.loaded = true;
        state.error = null;
      })
      .addCase(fetchSmartphones.rejected, (state, action) => {
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
      })
      .addCase(fetchBrands.rejected, (state, action) => {
        state.brandsLoading = false;
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
        state.selectedDevice = action.payload || null;
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
} = deviceSlice.actions;

export default deviceSlice.reducer;
