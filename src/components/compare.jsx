import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { FaExchangeAlt } from "react-icons/fa";
import { useDevice } from "../hooks/useDevice";
import useStoreLogos from "../hooks/useStoreLogos";
import ContinueBrowsingSmartphones from "./ui/ContinueBrowsingSmartphones";
import ProductDiscoverySections from "./ui/ProductDiscoverySections";
import { buildApiUrl } from "../utils/apiUrl";
import { readPreloadedApiResponse } from "../utils/preloadedApi";
import { fetchPublicJson } from "../utils/publicJsonRequest";

const MIN_COMPARE_DEVICES = 2;
const MAX_COMPARE_DEVICES = 3;
const SYSTEM_COMPARE_SUGGESTIONS_ENDPOINT = buildApiUrl(
  "/public/compare-pages/routes?limit=6",
);
const SECTION_DEFINITIONS = [
  { id: "overview", label: "Overview", sources: [] },
  { id: "display", label: "Display", sources: ["display", "display_json"] },
  {
    id: "performance",
    label: "Performance",
    sources: ["performance", "performance_json", "specs.performance"],
  },
  { id: "camera", label: "Camera", sources: ["camera", "camera_json"] },
  { id: "battery", label: "Battery", sources: ["battery", "battery_json"] },
  {
    id: "build",
    label: "Build & Design",
    sources: ["build_design", "buildDesign", "physical", "physical_json"],
  },
  {
    id: "connectivity",
    label: "Connectivity",
    sources: [
      "connectivity",
      "connectivity_json",
      "network",
      "network_json",
      "ports",
    ],
  },
  {
    id: "audio",
    label: "Audio & Multimedia",
    sources: ["audio", "multimedia", "multimedia_json"],
  },
  {
    id: "features",
    label: "Features & Sensors",
    sources: ["features", "features_json", "sensors"],
  },
];

const FIELD_LABELS = {
  os: "Operating System",
  ram: "RAM",
  rom: "Storage",
  gpu: "GPU",
  cpu: "CPU",
  ip_rating: "IP Rating",
  refresh_rate: "Refresh Rate",
  peak_brightness: "Peak Brightness",
  screen_size: "Screen Size",
  display_size: "Display Size",
  display_type: "Display Type",
  wired_charging: "Wired Charging",
  wireless_charging: "Wireless Charging",
  battery_capacity: "Battery Capacity",
  rear_camera: "Rear Camera",
  front_camera: "Front Camera",
  main_camera: "Main Camera",
  ultrawide_camera: "Ultra-wide Camera",
  ultra_wide_camera: "Ultra-wide Camera",
  resolution: "Resolution",
  nfc: "NFC",
  usb_type: "USB Type",
  bluetooth_version: "Bluetooth Version",
  wifi: "Wi-Fi",
  five_g: "5G",
};

const OMIT_KEYS = new Set([
  "id",
  "product_id",
  "productid",
  "variant_id",
  "created_at",
  "updated_at",
  "deleted_at",
  "slug",
  "image",
  "images",
  "product_url",
  "url",
  "status",
  "spec_score",
  "specscore",
  "spec_score_v2",
  "specscorev2",
  "spec_score_v2_raw",
  "specscorev2raw",
  "spec_score_v2_source",
  "specscorev2source",
  "specification_score",
  "specificationscore",
  "mobilesx_specification_score",
  "mobilesxspecificationscore",
  "mobilesx_score",
  "mobilesxscore",
  "hook_score",
  "hookscore",
  "pros",
  "cons",
  "advantages",
  "disadvantages",
  "drawbacks",
  "limitations",
  "strengths",
  "_raw",
]);

const toObject = (value) => {
  if (!value) return {};
  if (typeof value === "object" && !Array.isArray(value)) return value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return {};
    try {
      const parsed = JSON.parse(trimmed);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? parsed
        : {};
    } catch {
      return {};
    }
  }
  return {};
};

// Catalog resources do not always use the same ID field. Skip blank values
// rather than letting an empty productId hide a valid id/baseId/model.
const getProductId = (device) => {
  const candidates = [
    device?.productId,
    device?.product_id,
    device?.id,
    device?.smartphoneId,
    device?.smartphone_id,
    device?.deviceId,
    device?.device_id,
    device?.phoneId,
    device?.phone_id,
    device?.baseId,
    device?.base_id,
    device?._id,
    device?.model,
    device?.slug,
  ];
  return (
    candidates.find(
      (value) =>
        value !== null && value !== undefined && String(value).trim() !== "",
    ) ?? null
  );
};

const getProductName = (device) =>
  device?.name ||
  device?.model ||
  device?.title ||
  device?.product_name ||
  "Device";

const getProductType = (device) =>
  String(
    device?.productType ||
      device?.deviceType ||
      device?.product_type ||
      "smartphone",
  )
    .toLowerCase()
    .replace(/homeappliance/g, "tv");

const slugify = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-price-in-india$/i, "");

const parseRetailPrice = (value) => {
  if (typeof value === "number")
    return Number.isFinite(value) && value > 0 ? value : null;
  if (value === null || value === undefined || String(value).trim() === "")
    return null;
  // Accept a single currency amount, but reject ranges/text (e.g. "₹16,999 onwards")
  // rather than silently converting them to a misleading integer.
  const normalized = String(value)
    .trim()
    .replace(/^(?:₹|rs\.?|inr)\s*/i, "")
    .replace(/\s*(?:inr|rs\.?)$/i, "")
    .replace(/\s*\/\-\s*$/, "")
    .replace(/,/g, "")
    .trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return null;
  const amount = Number(normalized);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
};

const formatPrice = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return "Price unavailable";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(number);
};

const formatLabel = (raw) => {
  const normalized = String(raw || "").replace(/([a-z0-9])([A-Z])/g, "$1 $2");
  const key = normalized
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
  if (FIELD_LABELS[key]) return FIELD_LABELS[key];
  return normalized
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const formatValue = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) {
    return (
      value
        .map((item) => {
          if (item == null) return "";
          if (typeof item === "object") {
            return Object.entries(item)
              .filter(
                ([, fieldValue]) => fieldValue != null && fieldValue !== "",
              )
              .map(
                ([key, fieldValue]) =>
                  `${formatLabel(key)}: ${formatValue(fieldValue)}`,
              )
              .join(", ");
          }
          return String(item);
        })
        .filter(Boolean)
        .join(", ") || "—"
    );
  }
  if (typeof value === "object") {
    return (
      Object.entries(value)
        .filter(([, fieldValue]) => fieldValue != null && fieldValue !== "")
        .map(
          ([key, fieldValue]) =>
            `${formatLabel(key)}: ${formatValue(fieldValue)}`,
        )
        .join(" · ") || "—"
    );
  }
  if (typeof value === "number") return String(value);
  return String(value).trim() || "—";
};

// Give meaningful specifications stronger visual hierarchy while keeping unavailable values quiet.
const getSpecValueClass = (value) => {
  const text = formatValue(value);
  if (/^(—|n\/?a|not available|unknown)$/i.test(text))
    return "font-normal text-slate-400";
  if (
    /\d|\b(amoled|oled|ips|snapdragon|dimensity|adreno|mali|wi-fi|wifi|bluetooth|nfc|5g|4g|usb-c|dual sim|yes|no)\b/i.test(
      text,
    )
  ) {
    return "font-semibold text-slate-950";
  }
  return "font-medium text-slate-800";
};

const flattenSpecs = (object, prefix = "", depth = 0) => {
  if (!object || typeof object !== "object" || depth > 3) return [];
  return Object.entries(object).flatMap(([key, value]) => {
    const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (OMIT_KEYS.has(key.toLowerCase()) || OMIT_KEYS.has(normalizedKey))
      return [];
    if (value === null || value === undefined || value === "") return [];
    const fullKey = prefix ? `${prefix}__${key}` : key;
    if (typeof value === "object" && !Array.isArray(value)) {
      return flattenSpecs(value, fullKey, depth + 1);
    }
    return [[fullKey, value]];
  });
};

const getSectionValues = (device, section) => {
  const values = {};
  const rawSpecs = toObject(
    device?.specifications_json ||
      device?.specifications ||
      device?.specs_json ||
      device?.specs,
  );
  const sourcePaths =
    SECTION_DEFINITIONS.find((item) => item.id === section)?.sources || [];

  sourcePaths.forEach((path) => {
    const parts = path.split(".");
    let value = device;
    for (const part of parts) value = value?.[part];
    if (value == null && parts.length > 1) {
      value = rawSpecs;
      for (const part of parts) value = value?.[part];
    }
    Object.assign(values, toObject(value));
  });

  if (!Object.keys(values).length) {
    const fallbackKeys =
      {
        display: ["display", "display_json"],
        performance: ["performance", "performance_json"],
        camera: ["camera", "camera_json"],
        battery: ["battery", "battery_json"],
        build: ["build_design", "buildDesign", "physical", "physical_json"],
        connectivity: [
          "connectivity",
          "connectivity_json",
          "network",
          "network_json",
          "ports",
        ],
        audio: ["audio", "multimedia", "multimedia_json"],
        features: ["features", "features_json", "sensors"],
      }[section] || [];
    fallbackKeys.forEach((key) =>
      Object.assign(values, toObject(rawSpecs?.[key])),
    );
  }
  return Object.fromEntries(flattenSpecs(values));
};

const getVariants = (device) => {
  const variants = Array.isArray(device?.variants) ? device.variants : [];
  return variants.map((variant) => ({
    ...variant,
    base_price:
      variant?.base_price ?? variant?.basePrice ?? variant?.price ?? null,
    // The API can return retailer offers under `stores` after payload normalization.
    store_prices:
      Array.isArray(variant?.store_prices) && variant.store_prices.length
        ? variant.store_prices
        : Array.isArray(variant?.storePrices) && variant.storePrices.length
          ? variant.storePrices
          : Array.isArray(variant?.stores)
            ? variant.stores
            : [],
  }));
};

const getSelectedVariant = (device) => {
  const variants = getVariants(device);
  if (!variants.length) return null;
  const requestedIndex = Math.max(0, Number(device?.selectedVariantIndex) || 0);
  const index = Math.min(requestedIndex, variants.length - 1);
  return variants[index] || variants[0];
};

const getSelectedVariantLabel = (device) => {
  const variant = getSelectedVariant(device);
  if (!variant) return "";
  const ram = variant.ram ?? variant.RAM ?? variant.memory;
  const storage =
    variant.storage ??
    variant.internal_storage ??
    variant.storage_capacity ??
    variant.rom;
  return [
    ram != null && ram !== "" ? `${formatValue(ram)} RAM` : null,
    storage != null && storage !== ""
      ? `${formatValue(storage)} storage`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");
};

const getPrice = (device) => {
  const variants = getVariants(device);
  const variant = getSelectedVariant(device);
  const direct = Number(
    variant?.base_price ??
      variant?.price ??
      (variants.length <= 1
        ? (device?.price ?? device?.base_price ?? device?.basePrice)
        : null),
  );
  if (Number.isFinite(direct) && direct > 0) return direct;
  const storePrices = variant?.store_prices || [];
  const prices = storePrices
    .map((store) => Number(store?.price ?? store?.amount))
    .filter((price) => Number.isFinite(price) && price > 0);
  return prices.length ? Math.min(...prices) : null;
};

const normalizeStoreKey = (name) => {
  const normalized = String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  if (normalized.includes("amazon")) return "amazon";
  if (normalized.includes("flipkart")) return "flipkart";
  return normalized;
};

const getVariantScopedStoreRows = (device, variant, variantIndex) => {
  // Some API responses provide a flattened retailer-price list for all variants.
  // Only reuse those rows when the row explicitly identifies this exact variant.
  const allRows = [
    device?.variant_store_prices,
    device?.variantStorePrices,
    device?.store_prices,
    device?.storePrices,
  ]
    .filter(Array.isArray)
    .flat();
  const variantIds = [variant?.id, variant?.variant_id, variant?.variantId]
    .filter(
      (value) =>
        value !== null && value !== undefined && String(value).trim() !== "",
    )
    .map(String);
  const variantKeys = [variant?.variant_key, variant?.variantKey, variant?.key]
    .filter(
      (value) =>
        value !== null && value !== undefined && String(value).trim() !== "",
    )
    .map((value) => String(value).trim().toLowerCase());

  return allRows.filter((store) => {
    if (!store || typeof store !== "object") return false;
    const rowId = store.variant_id ?? store.variantId;
    const rowIndex = store.variant_index ?? store.variantIndex;
    const rowKey = store.variant_key ?? store.variantKey;
    if (rowId !== null && rowId !== undefined && String(rowId).trim() !== "") {
      return variantIds.includes(String(rowId));
    }
    if (
      rowIndex !== null &&
      rowIndex !== undefined &&
      String(rowIndex).trim() !== ""
    ) {
      return Number(rowIndex) === variantIndex;
    }
    if (
      rowKey !== null &&
      rowKey !== undefined &&
      String(rowKey).trim() !== ""
    ) {
      return variantKeys.includes(String(rowKey).trim().toLowerCase());
    }
    return false;
  });
};

const getStoreRows = (device) => {
  const variants = getVariants(device);
  const requestedIndex = Math.max(0, Number(device?.selectedVariantIndex) || 0);
  const variantIndex = variants.length
    ? Math.min(requestedIndex, variants.length - 1)
    : 0;
  const variant = getSelectedVariant(device);
  const variantStores = Array.isArray(variant?.store_prices)
    ? variant.store_prices
    : [];
  const directDeviceStores = Array.isArray(device?.store_prices)
    ? device.store_prices
    : Array.isArray(device?.storePrices)
      ? device.storePrices
      : [];

  let stores = variantStores;
  if (!stores.length && variants.length > 1) {
    stores = getVariantScopedStoreRows(device, variant, variantIndex);
    // Do not use an unscoped aggregate price list for a multi-variant phone:
    // it can select a price from a different RAM/storage configuration.
    if (!stores.length) return [];
  } else if (!stores.length && variants.length <= 1) {
    stores = directDeviceStores;
  }

  return stores
    .filter(Boolean)
    .map((store) => ({
      name:
        store?.display_store_name ||
        store?.displayStoreName ||
        store?.store_name ||
        store?.storeName ||
        store?.store ||
        store?.merchant ||
        "Store",
      price: parseRetailPrice(
        store?.price ??
          store?.current_price ??
          store?.currentPrice ??
          store?.sale_price ??
          store?.salePrice ??
          store?.amount ??
          store?.base_price,
      ),
      url:
        store?.url ||
        store?.link ||
        store?.url_link ||
        store?.product_url ||
        store?.affiliate_url ||
        store?.affiliateUrl ||
        null,
    }))
    .filter((store) => store.name && (store.price != null || store.url))
    .sort((left, right) => {
      const leftPrice = Number(left.price);
      const rightPrice = Number(right.price);
      return (
        (Number.isFinite(leftPrice) && leftPrice > 0 ? leftPrice : Infinity) -
        (Number.isFinite(rightPrice) && rightPrice > 0 ? rightPrice : Infinity)
      );
    });
};

const getImage = (device) => {
  const images = Array.isArray(device?.images)
    ? device.images
    : [device?.images];
  const pictures = Array.isArray(device?.pictures)
    ? device.pictures
    : [device?.pictures];
  const candidate =
    device?.image ||
    device?.image_url ||
    device?.product_image ||
    device?.productImage ||
    device?.thumbnail ||
    images.find(Boolean) ||
    pictures.find(Boolean);
  return typeof candidate === "string"
    ? candidate
    : candidate?.url || candidate?.src || "";
};

const getSuggestedPhones = (suggestion, devices) => {
  if (Array.isArray(suggestion.phones) && suggestion.phones.length) {
    return suggestion.phones;
  }

  const productSlugs = String(suggestion.slug || "")
    .replace(/-comparison$/i, "")
    .split("-and-")
    .filter(Boolean);

  return productSlugs.map((productSlug) => {
    const device = devices.find((candidate) => {
      const candidateSlugs = [
        slugify(getProductName(candidate)),
        slugify(candidate?.model),
      ].filter(Boolean);
      return candidateSlugs.some(
        (candidateSlug) =>
          candidateSlug === productSlug ||
          candidateSlug.startsWith(`${productSlug}-`) ||
          productSlug.startsWith(`${candidateSlug}-`),
      );
    });

    return {
      name:
        (device && getProductName(device)) ||
        productSlug
          .replace(/-/g, " ")
          .replace(/\b\w/g, (letter) => letter.toUpperCase()),
      image: device ? getImage(device) : "",
    };
  });
};

const getLaunchLabel = (device) => {
  const value =
    device?.launch_date ||
    device?.launchDate ||
    device?.release_date ||
    device?.releaseDate;
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return formatValue(value);
  return parsed.toLocaleDateString("en-IN", {
    month: "short",
    year: "numeric",
  });
};

const getAvailability = (device) =>
  device?.availability ||
  device?.availability_status ||
  device?.launch_status ||
  device?.status ||
  "—";

const getColors = (device) => {
  const colors =
    device?.colors ||
    device?.color ||
    device?.colour ||
    device?.available_colors;
  if (Array.isArray(colors))
    return (
      colors
        .map((item) =>
          typeof item === "object"
            ? item?.name || item?.color || item?.colour || ""
            : item,
        )
        .filter(Boolean)
        .join(", ") || "—"
    );
  return formatValue(colors);
};

const normalizeSelected = (device, variantIndex = 0) => {
  if (!device) return null;
  const id = getProductId(device);
  if (id == null) return null;
  return {
    ...device,
    id: String(id),
    productId: id,
    selectedVariantIndex: Math.max(0, Number(variantIndex) || 0),
  };
};

const mapSystemCompareSuggestions = (payload) =>
  (Array.isArray(payload?.routes) ? payload.routes : [])
    .map((item) => {
      const routePath = String(
        item?.route_path ||
          (item?.slug ? `/compare/${String(item.slug).replace(/^\/+/, "")}` : ""),
      ).trim();
      if (!routePath.startsWith("/compare/") || routePath.startsWith("//")) {
        return null;
      }

      return {
        routePath,
        slug:
          String(item?.slug || "").trim() ||
          routePath.split("/").filter(Boolean).pop() ||
          "",
      };
    })
    .filter(Boolean);

const loadCompareSuggestionPhones = async (suggestion, signal) => {
  const endpoint = buildApiUrl(
    `/public/compare-pages/resolve?slug=${encodeURIComponent(suggestion.slug)}`,
  );
  try {
    const payload =
      readPreloadedApiResponse(endpoint) ||
      (await fetchPublicJson(endpoint, { signal }));
    const items = Array.isArray(payload?.page?.items)
      ? payload.page.items
      : Array.isArray(payload?.items)
        ? payload.items
        : [];
    const phones = items
      .slice(0, 2)
      .map((item) => ({
        name: String(item?.product_name || item?.name || "").trim(),
        image: String(item?.image_url || item?.image || "").trim(),
      }))
      .filter((phone) => phone.name && phone.image);
    return phones.length >= 2 ? { ...suggestion, phones } : suggestion;
  } catch (error) {
    if (error?.name !== "AbortError") {
      console.warn("Failed to load a popular compare preview:", error);
    }
    return suggestion;
  }
};

const MobileCompare = () => {
  const location = useLocation();
  const { compareSlug = "" } = useParams();
  const [showPicker, setShowPicker] = useState(false);
  const searchParams = new URLSearchParams(location.search || "");
  const needsDeviceCatalog =
    showPicker ||
    Boolean(compareSlug) ||
    searchParams.has("devices") ||
    searchParams.has("add");
  const { devices: availableDevices = [], loading } = useDevice({
    resources: needsDeviceCatalog
      ? ["smartphones", "laptops", "tvs", "networking"]
      : [],
  });
  const { getStoreLogo } = useStoreLogos();
  const [selectedDevices, setSelectedDevices] = useState([]);
  const [draftDeviceIds, setDraftDeviceIds] = useState(["", "", ""]);
  const [openDraftSlot, setOpenDraftSlot] = useState(null);
  const [draftSearch, setDraftSearch] = useState("");
  const [activeDraftOptionIndex, setActiveDraftOptionIndex] = useState(0);
  const [search, setSearch] = useState("");
  const [pickerMessage, setPickerMessage] = useState("");
  const [activeSection, setActiveSection] = useState("overview");
  const [hideCommonSpecs, setHideCommonSpecs] = useState(false);
  const hydratedRoute = useRef("");
  const draftPickerRef = useRef(null);
  const draftSearchRef = useRef(null);
  const draftTriggerRefs = useRef([]);
  const draftOptionRefs = useRef([]);
  const [systemCompareSuggestions, setSystemCompareSuggestions] = useState(
    () =>
      mapSystemCompareSuggestions(
        readPreloadedApiResponse(SYSTEM_COMPARE_SUGGESTIONS_ENDPOINT),
      ),
  );

  useEffect(() => {
    const preloadedPayload = readPreloadedApiResponse(
      SYSTEM_COMPARE_SUGGESTIONS_ENDPOINT,
    );
    let cancelled = false;
    const controller =
      typeof AbortController !== "undefined" ? new AbortController() : null;
    const applySuggestions = async (payload) => {
      const suggestions = mapSystemCompareSuggestions(payload);
      const resolved = await Promise.all(
        suggestions
          .slice(0, 4)
          .map((suggestion) =>
            loadCompareSuggestionPhones(suggestion, controller?.signal),
          ),
      );
      if (!cancelled) setSystemCompareSuggestions(resolved);
    };

    if (preloadedPayload) {
      void applySuggestions(preloadedPayload);
      return () => {
        cancelled = true;
        controller?.abort?.();
      };
    }

    const loadSuggestions = async () => {
      try {
        const payload = await fetchPublicJson(
          SYSTEM_COMPARE_SUGGESTIONS_ENDPOINT,
          { signal: controller?.signal },
        );
        await applySuggestions(payload);
      } catch (error) {
        if (error?.name !== "AbortError" && !cancelled) {
          console.error("Failed to load system compare suggestions:", error);
          setSystemCompareSuggestions([]);
        }
      }
    };

    loadSuggestions();
    return () => {
      cancelled = true;
      controller?.abort?.();
    };
  }, []);

  useEffect(() => {
    if (!showPicker) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setShowPicker(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showPicker]);

  useEffect(() => {
    if (openDraftSlot === null) return undefined;

    const handlePointerDown = (event) => {
      if (!draftPickerRef.current?.contains(event.target)) {
        setOpenDraftSlot(null);
        setDraftSearch("");
      }
    };
    const focusSearch = window.requestAnimationFrame(() =>
      draftSearchRef.current?.focus(),
    );

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    return () => {
      window.cancelAnimationFrame(focusSearch);
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [openDraftSlot]);

  useEffect(() => {
    if (loading) return;
    const initialProducts = Array.isArray(location.state?.initialProducts)
      ? location.state.initialProducts
      : location.state?.initialProduct
        ? [location.state.initialProduct]
        : [];
    const routeKey = `${location.pathname}|${location.search}|${initialProducts.map((item) => getProductId(item)).join(",")}`;
    if (hydratedRoute.current === routeKey) return;
    // Wait until the catalog exists before consuming an ID/slug-based route.
    // Navigation-state products can be hydrated directly even before the list is available.
    if (!availableDevices.length && !initialProducts.length) return;

    const params = new URLSearchParams(location.search);
    const devicesParam = params.get("devices");
    const addParam = params.get("add");
    const found = [];
    const resolve = (candidate, variantIndex = 0) => {
      if (!candidate) return;
      const candidateId = getProductId(candidate);
      const match = availableDevices.find(
        (item) => String(getProductId(item)) === String(candidateId),
      );
      const normalized = normalizeSelected(
        match ? { ...match, ...candidate } : candidate,
        variantIndex,
      );
      if (normalized) found.push(normalized);
    };

    if (initialProducts.length) {
      initialProducts.forEach((item) =>
        resolve(item, item?.selectedVariantIndex ?? item?.variantIndex ?? 0),
      );
    } else if (devicesParam) {
      devicesParam
        .split(",")
        .filter(Boolean)
        .forEach((part) => {
          const [id, variantRaw] = part.split(":");
          const device = availableDevices.find(
            (item) => String(getProductId(item)) === String(id),
          );
          if (device)
            resolve(device, Number.parseInt(variantRaw || "0", 10) || 0);
        });
    } else if (addParam) {
      const device = availableDevices.find(
        (item) => String(getProductId(item)) === String(addParam),
      );
      if (device) resolve(device, 0);
    } else if (compareSlug) {
      const cleanSlug = compareSlug.replace(/-comparison$/i, "");
      const parts = cleanSlug.split("-and-").filter(Boolean);
      parts.forEach((part) => {
        const match = availableDevices.find((item) => {
          const nameSlug = slugify(getProductName(item));
          const modelSlug = slugify(item?.model || "");
          return (
            nameSlug === part ||
            modelSlug === part ||
            nameSlug.startsWith(`${part}-`) ||
            part.startsWith(`${nameSlug}-`)
          );
        });
        if (match) resolve(match, 0);
      });
    }

    const unique = Array.from(
      new Map(
        found.map((device) => [String(getProductId(device)), device]),
      ).values(),
    );
    if (unique.length) setSelectedDevices(unique.slice(0, MAX_COMPARE_DEVICES));
    hydratedRoute.current = routeKey;
  }, [
    availableDevices,
    compareSlug,
    loading,
    location.pathname,
    location.search,
    location.state,
  ]);

  const selectedType = getProductType(selectedDevices[0]);
  const suggestedMobileDevices = useMemo(() => {
    const seen = new Set();
    return availableDevices
      .filter((device) => {
        if (getProductType(device) !== "smartphone") return false;
        const id = getProductId(device);
        if (id == null || seen.has(String(id))) return false;
        seen.add(String(id));
        return true;
      })
      .slice(0, 3);
  }, [availableDevices]);

  const draftCompareDevices = draftDeviceIds
    .filter(Boolean)
    .map((id) =>
      availableDevices.find(
        (device) => String(getProductId(device)) === String(id),
      ),
    )
    .filter(Boolean);

  const getDraftOptions = (slotIndex, searchTerm = draftSearch) => {
    const query = searchTerm.trim().toLowerCase();
    return availableDevices.filter((device) => {
      if (getProductType(device) !== "smartphone") return false;
      const productId = getProductId(device);
      if (productId == null) return false;
      const id = String(productId);
      if (
        id !== draftDeviceIds[slotIndex] &&
        draftDeviceIds.some(
          (draftId, index) => index !== slotIndex && draftId === id,
        )
      ) {
        return false;
      }
      return (
        !query ||
        [
          getProductName(device),
          device?.brand,
          device?.manufacturer,
          device?.model,
        ].some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(query),
        )
      );
    });
  };

  const compatibleDevices = useMemo(() => {
    const query = search.trim().toLowerCase();
    const matchesQuery = (device) =>
      !query ||
      [
        getProductName(device),
        device?.brand,
        device?.manufacturer,
        device?.model,
      ].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(query),
      );
    const selectedIds = new Set(
      selectedDevices.map((device) => String(getProductId(device))),
    );
    // Keep selected devices visible at the top so the picker clearly shows what has been added.
    const selectedMatches = selectedDevices.filter(matchesQuery);
    const availableMatches = availableDevices.filter((device) => {
      const sameType =
        !selectedDevices.length || getProductType(device) === selectedType;
      return (
        sameType &&
        !selectedIds.has(String(getProductId(device))) &&
        matchesQuery(device)
      );
    });
    return [...selectedMatches, ...availableMatches].slice(0, 60);
  }, [availableDevices, search, selectedDevices, selectedType]);

  const storePriceRows = useMemo(() => {
    const knownStores = [
      { key: "amazon", label: "Amazon" },
      { key: "flipkart", label: "Flipkart" },
    ];
    const byKey = new Map(knownStores.map((store) => [store.key, store]));
    selectedDevices.forEach((device) => {
      getStoreRows(device).forEach((store) => {
        const key = normalizeStoreKey(store.name);
        if (!key || byKey.has(key)) return;
        byKey.set(key, { key, label: store.name });
      });
    });
    return Array.from(byKey.values());
  }, [selectedDevices]);

  const getPriceForStore = (device, storeKey) => {
    const matching = getStoreRows(device).filter(
      (store) => normalizeStoreKey(store.name) === storeKey,
    );
    return (
      matching.find((store) => Number(store.price) > 0) || matching[0] || null
    );
  };

  const addDevice = (device) => {
    setPickerMessage("");
    if (!device) {
      setPickerMessage(
        "This device could not be selected. Please choose another phone.",
      );
      return;
    }

    const deviceId = getProductId(device);
    if (deviceId == null || String(deviceId).trim() === "") {
      setPickerMessage(
        "This catalogue item is missing a usable device ID. Refresh the catalogue and try again.",
      );
      return;
    }
    if (selectedDevices.length >= MAX_COMPARE_DEVICES) {
      setPickerMessage(
        `You can compare up to ${MAX_COMPARE_DEVICES} devices at a time.`,
      );
      return;
    }
    if (
      selectedDevices.some(
        (item) => String(getProductId(item)) === String(deviceId),
      )
    ) {
      setPickerMessage(`${getProductName(device)} is already selected.`);
      return;
    }
    if (selectedDevices.length && getProductType(device) !== selectedType) {
      setPickerMessage(
        "Choose a device of the same type as the phones already selected.",
      );
      return;
    }

    const normalized = normalizeSelected(device, 0);
    if (!normalized) {
      setPickerMessage(
        "We could not prepare this device for comparison. Please try another item.",
      );
      return;
    }

    // Keep the picker open so users can add their second and third devices in one session.
    setSelectedDevices((current) => {
      if (current.length >= MAX_COMPARE_DEVICES) return current;
      if (
        current.some((item) => String(getProductId(item)) === String(deviceId))
      )
        return current;
      if (
        current.length &&
        getProductType(device) !== getProductType(current[0])
      )
        return current;
      return [...current, normalized];
    });
    setPickerMessage(
      `${getProductName(device)} added. Press Done to view your updated comparison.`,
    );
  };

  const removeDevice = (id) => {
    setSelectedDevices((current) =>
      current.filter((device) => String(getProductId(device)) !== String(id)),
    );
  };

  const overviewRows = useMemo(
    () => [
      { key: "launch_date", label: "Launch Date", value: getLaunchLabel },
      { key: "availability", label: "Status", value: getAvailability },
      { key: "colors", label: "Colors", value: getColors },
    ],
    [],
  );

  const sectionRows = useMemo(
    () =>
      SECTION_DEFINITIONS.map((section) => {
        if (section.id === "overview") {
          return {
            ...section,
            rows: overviewRows.map((row) => ({
              ...row,
              values: selectedDevices.map((device) => row.value(device)),
            })),
          };
        }
        const maps = selectedDevices.map((device) =>
          getSectionValues(device, section.id),
        );
        const allKeys = Array.from(
          new Set(maps.flatMap((specs) => Object.keys(specs))),
        );
        const preferredOrder =
          {
            display: [
              "display_type",
              "panel_type",
              "display_size",
              "screen_size",
              "resolution",
              "refresh_rate",
              "peak_brightness",
              "protection",
            ],
            performance: [
              "chipset",
              "processor",
              "cpu",
              "gpu",
              "ram",
              "memory",
              "storage",
              "internal_storage",
            ],
            camera: [
              "rear_camera",
              "main_camera",
              "ultrawide_camera",
              "telephoto_camera",
              "front_camera",
              "video_recording",
            ],
            battery: [
              "capacity",
              "battery_capacity",
              "charging",
              "wired_charging",
              "wireless_charging",
            ],
          }[section.id] || [];
        allKeys.sort((left, right) => {
          const leftRank = preferredOrder.indexOf(left.toLowerCase());
          const rightRank = preferredOrder.indexOf(right.toLowerCase());
          if (leftRank >= 0 || rightRank >= 0) {
            if (leftRank < 0) return 1;
            if (rightRank < 0) return -1;
            if (leftRank !== rightRank) return leftRank - rightRank;
          }
          return formatLabel(left.replace(/__/g, " ")).localeCompare(
            formatLabel(right.replace(/__/g, " ")),
          );
        });
        const rows = allKeys.map((key) => ({
          key,
          label: formatLabel(key.replace(/__/g, " ")),
          values: maps.map((specs) => specs[key] ?? null),
        }));
        return { ...section, rows };
      }).filter((section) => section.rows.length > 0),
    [overviewRows, selectedDevices],
  );

  const visibleSections = useMemo(() => {
    if (!hideCommonSpecs || selectedDevices.length < 2) return sectionRows;
    return sectionRows
      .map((section) => ({
        ...section,
        rows: section.rows.filter((row) => {
          const values = row.values.map((value) =>
            formatValue(value).toLowerCase().replace(/\s+/g, " "),
          );
          return !values.every((value) => value === values[0]);
        }),
      }))
      .filter((section) => section.rows.length > 0);
  }, [hideCommonSpecs, sectionRows, selectedDevices.length]);

  const smartphoneBrandCatalog = useMemo(() => {
    const brands = new Map();
    availableDevices
      .filter((device) => getProductType(device) === "smartphone")
      .forEach((device) => {
        const name = String(device?.brand || device?.manufacturer || "").trim();
        if (!name) return;
        const key = name.toLowerCase();
        if (!brands.has(key)) {
          brands.set(key, {
            name,
            logo_url:
              device?.brand_logo ||
              device?.brandLogo ||
              device?.brand_image ||
              device?.brandImage ||
              "",
          });
        }
      });
    return Array.from(brands.values());
  }, [availableDevices]);

  const suggestedCompareCards = useMemo(() => {
    const currentPath = location.pathname.replace(/\/+$/, "");
    return systemCompareSuggestions
      .filter((item) => item.routePath.replace(/\/+$/, "") !== currentPath)
      .map((suggestion) => ({
        ...suggestion,
        phones: getSuggestedPhones(suggestion, availableDevices),
      }))
      .filter(
        (suggestion) =>
          suggestion.phones.length >= 2 &&
          suggestion.phones.every((phone) => phone.image),
      )
      .slice(0, 3);
  }, [availableDevices, location.pathname, systemCompareSuggestions]);

  const scrollToSection = (sectionId) => {
    setActiveSection(sectionId);
    const isMobile =
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 767px)").matches;
    const targetId = isMobile
      ? `compare-mobile-section-${sectionId}`
      : `compare-section-${sectionId}`;
    document
      .getElementById(targetId)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main className="mx-compare-page min-h-screen min-w-0 bg-slate-50 font-sans text-slate-900">
      <style>{`
        .compare-hidden-scrollbar { scrollbar-width: none !important; -ms-overflow-style: none !important; }
        .compare-hidden-scrollbar::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
      `}</style>
      <div className="mx-auto w-full max-w-[1360px] min-w-0 px-0 pb-10 pt-4 sm:px-5 sm:pb-14 sm:pt-6 lg:px-6 xl:px-8">
        <header className="mb-5 flex min-w-0 flex-col gap-3 border-b border-slate-200 px-4 pb-4 sm:mb-6 sm:flex-row sm:items-end sm:justify-between sm:gap-6 sm:px-0 sm:pb-5">
          <div className="min-w-0">
            <p className="mb-1 text-xs font-medium text-slate-400 sm:text-sm">
              <span className="text-blue-600">Home</span>
              <span className="px-2">/</span>Compare
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl lg:text-3xl">
              Compare Phones Your Way
            </h1>
            <p className="mt-1 text-sm leading-5 text-slate-500 sm:text-base">
              Compare prices, specifications and features side by side to find
              the right phone for you.
            </p>
          </div>
          <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end">
            <span className="text-xs font-medium text-slate-500 sm:text-sm">
              {selectedDevices.length} of {MAX_COMPARE_DEVICES} selected
            </span>
            <button
              type="button"
              onClick={() => {
                setPickerMessage("");
                setShowPicker(true);
                setSearch("");
              }}
              disabled={selectedDevices.length >= MAX_COMPARE_DEVICES}
              className="mx-primary-button inline-flex min-h-10 shrink-0 items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-11 sm:px-5"
            >
              <span aria-hidden="true" className="text-lg leading-none">
                +
              </span>{" "}
              Add Phone
            </button>
          </div>
        </header>

        {selectedDevices.length === 0 ? (
          <>
            <section className="flex min-h-64 flex-col items-center justify-center px-4 py-10 text-center sm:min-h-72">
              <span
                aria-hidden="true"
                className="mb-4 flex h-10 w-10 items-center justify-center text-3xl font-light leading-none text-blue-600"
              >
                +
              </span>
              <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">
                Start Your Comparison
              </h2>
              <p className="mt-2 max-w-lg text-sm leading-6 text-slate-500 sm:text-base">
                Select 2 or 3 phones to explore their differences.
              </p>
              <button
                type="button"
                onClick={() => {
                  setPickerMessage("");
                  setShowPicker(true);
                  setSearch("");
                }}
                className="mt-5 inline-flex min-h-10 items-center gap-2 px-2 py-2 text-sm font-semibold text-blue-700 transition-colors hover:text-blue-800 focus-visible:outline-none focus-visible:underline"
              >
                + Select a phone
              </button>
            </section>
            <section className="border-t-4 border-slate-100 bg-transparent px-4 py-5 sm:px-0 sm:py-6">
            <div className="mb-4">
              <h2 className="border-l-4 border-blue-600 pl-3 text-base font-semibold text-slate-900 sm:text-lg">
                Build Your Phone Comparison
              </h2>
              <p className="mt-1 pl-4 text-sm text-slate-500">
                Choose 2 or 3 smartphones to compare their prices, features and
                specifications.
              </p>
            </div>
            <div
              ref={draftPickerRef}
              className="grid items-center gap-2 sm:grid-cols-[minmax(0,1fr)_32px_minmax(0,1fr)_32px_minmax(0,1fr)]"
            >
              {draftDeviceIds.map((selectedId, index) => (
                <React.Fragment key={`compare-slot-${index}`}>
                  {index > 0 ? (
                    <span
                      aria-hidden="true"
                      className="flex h-7 w-7 items-center justify-center justify-self-center rounded-full border border-blue-200 bg-blue-50 text-blue-600 shadow-sm"
                    >
                      <FaExchangeAlt className="text-xs" />
                    </span>
                  ) : null}
                  <div className="relative min-w-0">
                    <button
                      ref={(element) => {
                        draftTriggerRefs.current[index] = element;
                      }}
                      type="button"
                      aria-label={`Select ${index + 1}${index === 0 ? "st" : index === 1 ? "nd" : "rd"} mobile to compare`}
                      aria-haspopup="listbox"
                      aria-expanded={openDraftSlot === index}
                      aria-controls={`compare-device-list-${index}`}
                      onClick={() => {
                        setDraftSearch("");
                        setActiveDraftOptionIndex(0);
                        draftOptionRefs.current[index] = [];
                        setOpenDraftSlot((current) =>
                          current === index ? null : index,
                        );
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "ArrowDown" || event.key === "Enter") {
                          event.preventDefault();
                          setDraftSearch("");
                          setActiveDraftOptionIndex(0);
                          draftOptionRefs.current[index] = [];
                          setOpenDraftSlot(index);
                        } else if (
                          event.key === "Escape" &&
                          openDraftSlot === index
                        ) {
                          event.preventDefault();
                          setOpenDraftSlot(null);
                        }
                      }}
                      className={`flex h-12 w-full min-w-0 items-center justify-between border-2 bg-white px-3 text-left text-sm outline-none transition-colors focus:ring-2 focus:ring-blue-100 ${
                        openDraftSlot === index
                          ? "border-blue-500"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <span
                        className={`truncate ${
                          selectedId ? "text-slate-700" : "text-slate-500"
                        }`}
                      >
                        {selectedId
                          ? getProductName(
                              availableDevices.find(
                                (device) =>
                                  String(getProductId(device)) === selectedId,
                              ),
                            )
                          : loading
                            ? "Loading mobiles…"
                            : "Select a product"}
                      </span>
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className={`ml-3 h-4 w-4 shrink-0 text-slate-500 transition-transform ${
                          openDraftSlot === index ? "rotate-180" : ""
                        }`}
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.22 7.47a.75.75 0 0 1 1.06 0L10 11.19l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 8.53a.75.75 0 0 1 0-1.06Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                    {openDraftSlot === index ? (
                      <div className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden border border-slate-200 bg-white shadow-xl">
                        <div className="border-b border-slate-200 p-2">
                          <input
                            ref={draftSearchRef}
                            type="search"
                            value={draftSearch}
                            aria-label="Search mobiles"
                            aria-autocomplete="list"
                            aria-controls={`compare-device-list-${index}`}
                            aria-activedescendant={
                              activeDraftOptionIndex >= 0
                                ? `compare-device-option-${index}-${activeDraftOptionIndex}`
                                : undefined
                            }
                            onChange={(event) => {
                              draftOptionRefs.current[index] = [];
                              setDraftSearch(event.target.value);
                              setActiveDraftOptionIndex(0);
                            }}
                            onKeyDown={(event) => {
                              const optionCount =
                                draftOptionRefs.current[index]?.length || 0;
                              if (
                                (event.key === "ArrowDown" ||
                                  event.key === "ArrowUp") &&
                                optionCount
                              ) {
                                event.preventDefault();
                                const nextIndex =
                                  event.key === "ArrowDown"
                                    ? 0
                                    : optionCount - 1;
                                setActiveDraftOptionIndex(nextIndex);
                                draftOptionRefs.current[index][
                                  nextIndex
                                ]?.focus();
                              } else if (
                                event.key === "Enter" &&
                                optionCount
                              ) {
                                event.preventDefault();
                                draftOptionRefs.current[index][
                                  activeDraftOptionIndex
                                ]?.click();
                              } else if (
                                event.key === "Escape" ||
                                event.key === "Tab"
                              ) {
                                if (event.key === "Escape") {
                                  event.preventDefault();
                                  draftTriggerRefs.current[index]?.focus();
                                }
                                setOpenDraftSlot(null);
                                setDraftSearch("");
                              }
                            }}
                            placeholder="Search mobiles…"
                            className="h-9 w-full border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                          />
                        </div>
                        <ul
                          id={`compare-device-list-${index}`}
                          role="listbox"
                          aria-label="Available mobiles"
                          className="max-h-56 overflow-y-auto py-1"
                        >
                          <li>
                            <button
                              ref={(element) => {
                                if (!draftOptionRefs.current[index]) {
                                  draftOptionRefs.current[index] = [];
                                }
                                draftOptionRefs.current[index][0] = element;
                              }}
                              id={`compare-device-option-${index}-0`}
                              type="button"
                              role="option"
                              aria-selected={!selectedId}
                              onMouseEnter={() =>
                                setActiveDraftOptionIndex(0)
                              }
                              onClick={() => {
                                setDraftDeviceIds((current) =>
                                  current.map((draftId, slotIndex) =>
                                    slotIndex === index ? "" : draftId,
                                  ),
                                );
                                setOpenDraftSlot(null);
                                setDraftSearch("");
                                draftTriggerRefs.current[index]?.focus();
                              }}
                              onKeyDown={(event) => {
                                if (
                                  event.key === "ArrowDown" ||
                                  event.key === "ArrowUp"
                                ) {
                                  event.preventDefault();
                                  const optionCount =
                                    draftOptionRefs.current[index]?.length || 0;
                                  const nextIndex =
                                    event.key === "ArrowDown"
                                      ? 1 % optionCount
                                      : optionCount - 1;
                                  setActiveDraftOptionIndex(nextIndex);
                                  draftOptionRefs.current[index][
                                    nextIndex
                                  ]?.focus();
                                } else if (event.key === "Escape") {
                                  event.preventDefault();
                                  setOpenDraftSlot(null);
                                  setDraftSearch("");
                                  draftTriggerRefs.current[index]?.focus();
                                } else if (event.key === "Tab") {
                                  setOpenDraftSlot(null);
                                  setDraftSearch("");
                                }
                              }}
                              className={`flex min-h-10 w-full items-center px-3 py-2 text-left text-sm transition-colors ${
                                !selectedId
                                  ? "bg-blue-50 font-semibold text-blue-800"
                                  : activeDraftOptionIndex === 0
                                    ? "bg-slate-100 text-slate-900"
                                    : "text-slate-700 hover:bg-slate-50"
                              }`}
                            >
                              Select a product
                            </button>
                          </li>
                          {getDraftOptions(index).map((device, optionIndex) => {
                            const id = String(getProductId(device));
                            const focusIndex = optionIndex + 1;
                            const isSelected = id === selectedId;
                            const isActive =
                              focusIndex === activeDraftOptionIndex;
                            return (
                              <li key={id}>
                                <button
                                  ref={(element) => {
                                    if (!draftOptionRefs.current[index]) {
                                      draftOptionRefs.current[index] = [];
                                    }
                                    draftOptionRefs.current[index][
                                      focusIndex
                                    ] = element;
                                  }}
                                  id={`compare-device-option-${index}-${focusIndex}`}
                                  type="button"
                                  role="option"
                                  aria-selected={isSelected}
                                  onMouseEnter={() =>
                                    setActiveDraftOptionIndex(focusIndex)
                                  }
                                  onClick={() => {
                                    setDraftDeviceIds((current) =>
                                      current.map((draftId, slotIndex) =>
                                        slotIndex === index ? id : draftId,
                                      ),
                                    );
                                    setOpenDraftSlot(null);
                                    setDraftSearch("");
                                    draftTriggerRefs.current[index]?.focus();
                                  }}
                                  onKeyDown={(event) => {
                                    if (
                                      event.key === "ArrowDown" ||
                                      event.key === "ArrowUp"
                                    ) {
                                      event.preventDefault();
                                      const direction =
                                        event.key === "ArrowDown" ? 1 : -1;
                                      const optionCount =
                                        draftOptionRefs.current[index]?.length ||
                                        0;
                                      const nextIndex =
                                        (focusIndex +
                                          direction +
                                          optionCount) %
                                        optionCount;
                                      setActiveDraftOptionIndex(nextIndex);
                                      draftOptionRefs.current[index][
                                        nextIndex
                                      ]?.focus();
                                    } else if (event.key === "Escape") {
                                      event.preventDefault();
                                      setOpenDraftSlot(null);
                                      setDraftSearch("");
                                      draftTriggerRefs.current[index]?.focus();
                                    } else if (event.key === "Tab") {
                                      setOpenDraftSlot(null);
                                      setDraftSearch("");
                                    }
                                  }}
                                  className={`flex min-h-10 w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors ${
                                    isSelected
                                      ? "bg-blue-50 font-semibold text-blue-800"
                                      : isActive
                                        ? "bg-slate-100 text-slate-900"
                                        : "text-slate-700 hover:bg-slate-50"
                                  }`}
                                >
                                  <span className="truncate">
                                    {getProductName(device)}
                                  </span>
                                  {isSelected ? (
                                    <span
                                      aria-hidden="true"
                                      className="ml-2 text-xs text-blue-600"
                                    >
                                      ✓
                                    </span>
                                  ) : null}
                                </button>
                              </li>
                            );
                          })}
                          {!getDraftOptions(index).length ? (
                            <li className="px-3 py-4 text-center text-sm text-slate-500">
                              {loading
                                ? "Loading mobiles…"
                                : "No mobiles found."}
                            </li>
                          ) : null}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                </React.Fragment>
              ))}
            </div>
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                disabled={draftCompareDevices.length < MIN_COMPARE_DEVICES}
                onClick={() => {
                  const devices = draftCompareDevices
                    .slice(0, MAX_COMPARE_DEVICES)
                    .map((device) => normalizeSelected(device, 0))
                    .filter(Boolean);
                  if (devices.length >= MIN_COMPARE_DEVICES) {
                    setSelectedDevices(devices);
                  }
                }}
                className="min-h-11 w-full max-w-xs border-2 border-slate-200 bg-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 transition-colors enabled:border-blue-600 enabled:bg-blue-600 enabled:text-white enabled:hover:bg-blue-700 disabled:cursor-not-allowed sm:text-base"
              >
                Compare Now!
              </button>
            </div>

            {suggestedMobileDevices.length ? (
              <div className="mt-8">
                <div className="mb-3">
                  <h3 className="border-l-4 border-blue-600 pl-3 text-base font-semibold text-slate-900 sm:text-lg">
                    Phones Worth Comparing
                  </h3>
                  <p className="mt-1 pl-4 text-sm text-slate-500">
                    Explore recommended smartphones and add them to your
                    comparison.
                  </p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {suggestedMobileDevices.map((device) => {
                    const image = getImage(device);
                    const id = String(getProductId(device));
                    return (
                      <article
                        key={`suggested-mobile-${id}`}
                        className="flex min-h-[92px] min-w-0 items-center gap-3 border-2 border-slate-200 bg-transparent px-3 py-2"
                      >
                        <div className="flex h-14 w-12 shrink-0 items-center justify-center">
                          {image ? (
                            <img
                              src={image}
                              alt=""
                              loading="lazy"
                              className="max-h-full max-w-full object-contain"
                            />
                          ) : (
                            <span
                              aria-hidden="true"
                              className="text-xs text-slate-400"
                            >
                              Mobile
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-sm font-semibold leading-5 text-slate-900">
                            {getProductName(device)}
                          </p>
                          <button
                            type="button"
                            onClick={() => addDevice(device)}
                            className="mt-1 inline-flex min-h-7 items-center gap-2 text-xs font-medium text-slate-600 transition-colors hover:text-blue-700 focus-visible:outline-none focus-visible:underline"
                          >
                            <span
                              aria-hidden="true"
                              className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-sm leading-none"
                            >
                              +
                            </span>
                            Add to Compare
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            ) : null}
            </section>
          </>
        ) : selectedDevices.length < MIN_COMPARE_DEVICES ? (
          <section className="mx-auto max-w-4xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-4 sm:px-6 sm:py-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
                One device selected
              </p>
              <h2 className="mt-1 text-lg font-bold text-slate-950 sm:text-xl">
                Add one more device to compare
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                A comparison needs at least {MIN_COMPARE_DEVICES} devices. You
                can compare up to {MAX_COMPARE_DEVICES} devices at a time.
              </p>
            </div>
            {selectedDevices.map((device) => {
              const id = getProductId(device);
              const image = getImage(device);
              return (
                <article
                  key={`single-device-${id}`}
                  className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-6 sm:p-6"
                >
                  <div className="flex h-28 shrink-0 items-center justify-center sm:h-36 sm:w-32">
                    {image ? (
                      <img
                        src={image}
                        alt={getProductName(device)}
                        loading="lazy"
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <span className="text-sm text-slate-400">
                        Image unavailable
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-bold text-slate-950 sm:text-lg">
                      {getProductName(device)}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {device?.brand || device?.manufacturer || selectedType}
                    </p>
                    <p className="mt-3 text-xl font-bold text-blue-700 sm:text-2xl">
                      {formatPrice(getPrice(device))}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 sm:flex-col">
                    <button
                      type="button"
                      onClick={() => {
                        setPickerMessage("");
                        setShowPicker(true);
                        setSearch("");
                      }}
                      className="inline-flex min-h-11 items-center justify-center gap-2 bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      <span aria-hidden="true" className="text-lg leading-none">
                        +
                      </span>{" "}
                      Add second device
                    </button>
                    <button
                      type="button"
                      onClick={() => removeDevice(id)}
                      className="inline-flex min-h-10 items-center justify-center border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                    >
                      Remove device
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        ) : (
          <>
            <div className="mb-4 flex min-w-0 flex-col gap-2 border-b border-slate-200 px-4 pb-3 sm:mb-5 sm:px-0 md:flex-row md:items-center md:justify-between md:gap-4">
              {/* Keep section tabs off small screens to avoid a multi-row toolbar. Desktop uses one compact, scrollbar-free tab rail. */}
              <nav
                aria-label="Comparison sections"
                className="compare-hidden-scrollbar hidden min-w-0 flex-1 items-center gap-1.5 overflow-x-auto pb-1 md:flex md:flex-nowrap lg:gap-2"
              >
                {visibleSections.map((section) => (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => scrollToSection(section.id)}
                    aria-current={
                      activeSection === section.id ? "true" : undefined
                    }
                    className={`shrink-0 whitespace-nowrap border-0 border-b-2 bg-transparent px-2.5 py-2 text-xs font-medium transition-colors lg:px-3 lg:py-2.5 ${activeSection === section.id ? "border-b-blue-600 text-blue-700" : "border-b-transparent text-slate-600 hover:border-b-blue-300 hover:text-blue-700"}`}
                  >
                    {section.label}
                  </button>
                ))}
              </nav>
              <label className="flex shrink-0 cursor-pointer items-center gap-2 self-end text-xs text-slate-600 sm:text-sm md:self-auto md:pl-2">
                <input
                  type="checkbox"
                  checked={hideCommonSpecs}
                  onChange={(event) => setHideCommonSpecs(event.target.checked)}
                  className="h-4 w-4 accent-blue-600"
                />
                Hide common specifications
              </label>
            </div>

            {/* Mobile layout follows a phone-comparison pattern: device columns stay visible, while each spec name gets its own full-width band. */}
            <div className="md:hidden">
              <div className="compare-hidden-scrollbar overflow-visible">
                <div className="min-w-0 w-full">
                  <div
                    className="grid border-t border-slate-200"
                    style={{
                      gridTemplateColumns: `repeat(${Math.max(selectedDevices.length, 1)}, minmax(0, 1fr))`,
                    }}
                  >
                    {selectedDevices.map((device) => {
                      const id = getProductId(device);
                      const image = getImage(device);
                      return (
                        <article
                          key={`mobile-product-${id}`}
                          className="relative flex min-w-0 flex-col items-center border-b border-r border-slate-200 bg-white px-2 pb-4 pt-4 text-center"
                        >
                          <button
                            type="button"
                            onClick={() => removeDevice(id)}
                            aria-label={`Remove ${getProductName(device)}`}
                            className="absolute right-1 top-1 z-10 flex h-7 w-7 items-center justify-center text-xl leading-none text-slate-500"
                            title="Remove phone"
                          >
                            ×
                          </button>
                          <div className="flex h-[104px] w-full items-center justify-center">
                            {image ? (
                              <img
                                src={image}
                                alt={getProductName(device)}
                                loading="lazy"
                                className="max-h-24 max-w-full object-contain"
                              />
                            ) : (
                              <span className="text-[10px] text-slate-400">
                                No image
                              </span>
                            )}
                          </div>
                          <h2 className="mt-2 min-h-[42px] w-full break-words text-[13px] font-semibold leading-[1.2] text-slate-950">
                            {getProductName(device)}
                          </h2>
                          {getSelectedVariantLabel(device) ? (
                            <p className="mt-1 text-[10px] leading-4 text-slate-500">
                              {getSelectedVariantLabel(device)}
                            </p>
                          ) : null}
                        </article>
                      );
                    })}
                  </div>

                  <section
                    id="compare-store-prices-mobile"
                    className="border-b border-slate-200"
                  >
                    <div className="border-b border-slate-200 bg-blue-50 px-3 py-3">
                      <h3 className="text-sm font-bold text-slate-900">
                        Compare Prices
                      </h3>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Retailer prices are shown only when tied to the
                        displayed variant. “Not listed” means no verified
                        variant price is available.
                      </p>
                    </div>
                    {storePriceRows.map((storeRow) => {
                      const logo = getStoreLogo(storeRow.label);
                      return (
                        <div key={`mobile-store-${storeRow.key}`}>
                          <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2">
                            {logo ? (
                              <img
                                src={logo}
                                alt={`${storeRow.label} logo`}
                                loading="lazy"
                                className="h-5 w-8 object-contain"
                              />
                            ) : (
                              <span className="text-xs font-bold text-slate-500">
                                {storeRow.label.slice(0, 2)}
                              </span>
                            )}
                            <span className="text-xs font-semibold text-slate-800">
                              {storeRow.label}
                            </span>
                          </div>
                          <div
                            className="grid"
                            style={{
                              gridTemplateColumns: `repeat(${Math.max(selectedDevices.length, 1)}, minmax(0, 1fr))`,
                            }}
                          >
                            {selectedDevices.map((device) => {
                              const store = getPriceForStore(
                                device,
                                storeRow.key,
                              );
                              const numericPrice = Number(store?.price);
                              const hasPrice =
                                Number.isFinite(numericPrice) &&
                                numericPrice > 0;
                              return (
                                <div
                                  key={`mobile-store-price-${storeRow.key}-${getProductId(device)}`}
                                  className="flex min-h-12 min-w-0 items-center justify-center border-b border-r border-slate-200 px-1 py-2 text-center"
                                >
                                  {hasPrice && store?.url ? (
                                    <a
                                      href={store.url}
                                      target="_blank"
                                      rel="nofollow sponsored noopener noreferrer"
                                      className="break-words text-xs font-semibold text-blue-700"
                                    >
                                      {formatPrice(numericPrice)}{" "}
                                      <span aria-hidden="true">›</span>
                                    </a>
                                  ) : hasPrice ? (
                                    <span
                                      title="Retailer price recorded, but no product link is available"
                                      className="break-words text-xs font-semibold text-slate-900"
                                    >
                                      {formatPrice(numericPrice)}
                                    </span>
                                  ) : store?.url ? (
                                    <a
                                      href={store.url}
                                      target="_blank"
                                      rel="nofollow sponsored noopener noreferrer"
                                      className="break-words text-xs font-semibold text-blue-700"
                                    >
                                      View offer{" "}
                                      <span aria-hidden="true">›</span>
                                    </a>
                                  ) : (
                                    <span
                                      title="No variant-matched retailer price or offer link is recorded"
                                      className="break-words text-xs text-slate-400"
                                    >
                                      Not listed
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </section>

                  {visibleSections.map((section) => (
                    <section
                      key={`mobile-${section.id}`}
                      id={`compare-mobile-section-${section.id}`}
                      className="scroll-mt-20"
                    >
                      <div className="flex items-center gap-2 bg-blue-50 px-3 py-3">
                        <span
                          aria-hidden="true"
                          className="h-5 w-1 shrink-0 bg-blue-600"
                        />
                        <h3 className="text-sm font-bold text-slate-950">
                          {section.label}
                        </h3>
                        <span className="text-[11px] text-slate-500">
                          ({section.rows.length})
                        </span>
                      </div>
                      <div className="border-x border-t border-slate-200">
                        {section.rows.map((row) => (
                          <div key={`mobile-row-${section.id}-${row.key}`}>
                            <div className="border-b border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold leading-5 text-slate-800">
                              {row.label}
                            </div>
                            <div
                              className="grid"
                              style={{
                                gridTemplateColumns: `repeat(${Math.max(selectedDevices.length, 1)}, minmax(0, 1fr))`,
                              }}
                            >
                              {selectedDevices.map((device, index) => (
                                <div
                                  key={`mobile-value-${section.id}-${row.key}-${getProductId(device)}`}
                                  className="flex min-h-[58px] min-w-0 items-center justify-center border-b border-r border-slate-200 bg-white px-2.5 py-3 text-center last:border-r-0"
                                >
                                  <span
                                    className={`whitespace-normal break-words text-sm leading-6 ${getSpecValueClass(row.values[index])}`}
                                  >
                                    {formatValue(row.values[index])}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              </div>
            </div>

            {/* Desktop mirrors the mobile comparison rhythm: product columns first, then full-width labels and aligned values. */}
            <div className="mx-auto hidden min-w-0 md:block">
              <div
                aria-label="Device comparison table"
                className="w-full min-w-0 max-w-full bg-white compare-hidden-scrollbar"
              >
                <div className="min-w-0">
                  <div
                    className="grid border-b border-slate-200"
                    style={{
                      gridTemplateColumns: `repeat(${Math.max(selectedDevices.length, 1)}, minmax(0, 1fr))`,
                    }}
                  >
                    {selectedDevices.map((device) => {
                      const id = getProductId(device);
                      const image = getImage(device);
                      return (
                        <article
                          key={`desktop-product-${id}`}
                          className="relative flex min-w-0 flex-col items-center border-r border-slate-200 px-3 pb-3 pt-3 text-center last:border-r-0 xl:px-4 xl:pt-4"
                        >
                          <button
                            type="button"
                            onClick={() => removeDevice(id)}
                            aria-label={`Remove ${getProductName(device)}`}
                            className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center text-xl leading-none text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-700"
                            title="Remove phone"
                          >
                            ×
                          </button>
                          <div className="flex h-28 w-full items-center justify-center xl:h-32">
                            {image ? (
                              <img
                                src={image}
                                alt={getProductName(device)}
                                loading="lazy"
                                className="max-h-24 max-w-[112px] object-contain xl:max-h-28 xl:max-w-[132px]"
                              />
                            ) : (
                              <div className="flex h-24 w-20 items-center justify-center border border-slate-200 text-xs text-slate-400">
                                No image
                              </div>
                            )}
                          </div>
                          <h2 className="mt-2 min-h-10 w-full max-w-[260px] break-words text-sm font-bold leading-5 text-slate-950 xl:text-base">
                            {getProductName(device)}
                          </h2>
                          {getSelectedVariantLabel(device) ? (
                            <p className="mt-1 text-xs leading-4 text-slate-500">
                              {getSelectedVariantLabel(device)}
                            </p>
                          ) : null}
                        </article>
                      );
                    })}
                  </div>

                  <section
                    id="compare-store-prices"
                    className="border-b border-slate-200"
                  >
                    <div className="border-b border-blue-100 bg-blue-50 px-3 py-3 xl:px-4">
                      <h3 className="text-sm font-bold text-blue-900 xl:text-base">
                        Compare Prices
                      </h3>
                      <p className="mt-0.5 text-xs leading-5 text-slate-600 xl:text-sm">
                        Retailer prices are shown only when tied to the
                        displayed variant. “Not listed” means no verified
                        variant price is available.
                      </p>
                    </div>
                    {storePriceRows.map((storeRow) => {
                      const logo = getStoreLogo(storeRow.label);
                      return (
                        <div key={`desktop-store-${storeRow.key}`}>
                          <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2 xl:px-4">
                            {logo ? (
                              <img
                                src={logo}
                                alt={`${storeRow.label} logo`}
                                loading="lazy"
                                className="h-6 w-8 shrink-0 object-contain"
                              />
                            ) : (
                              <span className="flex h-6 w-8 shrink-0 items-center justify-center border border-slate-200 bg-white text-[10px] font-bold uppercase text-slate-500">
                                {storeRow.label.slice(0, 2)}
                              </span>
                            )}
                            <span className="text-xs font-semibold text-slate-800 xl:text-sm">
                              {storeRow.label}
                            </span>
                          </div>
                          <div
                            className="grid"
                            style={{
                              gridTemplateColumns: `repeat(${Math.max(selectedDevices.length, 1)}, minmax(0, 1fr))`,
                            }}
                          >
                            {selectedDevices.map((device) => {
                              const store = getPriceForStore(
                                device,
                                storeRow.key,
                              );
                              const numericPrice = Number(store?.price);
                              const hasPrice =
                                Number.isFinite(numericPrice) &&
                                numericPrice > 0;
                              const priceLabel = hasPrice
                                ? formatPrice(numericPrice)
                                : "—";
                              return (
                                <div
                                  key={`desktop-store-price-${storeRow.key}-${getProductId(device)}`}
                                  className="flex min-h-11 min-w-0 items-center justify-center border-b border-r border-slate-200 px-2 py-2 text-center last:border-r-0 xl:min-h-12 xl:px-3"
                                >
                                  {hasPrice && store?.url ? (
                                    <a
                                      href={store.url}
                                      target="_blank"
                                      rel="nofollow sponsored noopener noreferrer"
                                      className="break-words text-sm font-semibold text-blue-700 underline-offset-4 hover:underline xl:text-base"
                                    >
                                      {priceLabel}
                                      <span
                                        aria-hidden="true"
                                        className="ml-1 text-sm"
                                      >
                                        ↗
                                      </span>
                                    </a>
                                  ) : hasPrice ? (
                                    <span
                                      title="Retailer price recorded, but no product link is available"
                                      className="text-sm font-semibold text-slate-900 xl:text-base"
                                    >
                                      {priceLabel}
                                    </span>
                                  ) : store?.url ? (
                                    <a
                                      href={store.url}
                                      target="_blank"
                                      rel="nofollow sponsored noopener noreferrer"
                                      className="break-words text-sm font-semibold text-blue-700 underline-offset-4 hover:underline xl:text-base"
                                    >
                                      View offer{" "}
                                      <span
                                        aria-hidden="true"
                                        className="ml-1 text-sm"
                                      >
                                        ↗
                                      </span>
                                    </a>
                                  ) : (
                                    <span
                                      title="No variant-matched retailer price or offer link is recorded"
                                      className="text-xs text-slate-400 xl:text-sm"
                                    >
                                      Not listed
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </section>

                  {visibleSections.map((section) => (
                    <section
                      key={`desktop-${section.id}`}
                      id={`compare-section-${section.id}`}
                      className="scroll-mt-24"
                    >
                      <div className="flex items-center gap-2 bg-blue-50 px-3 py-3 xl:px-4">
                        <span className="h-5 w-1 bg-blue-600" />
                        <h3 className="text-sm font-bold text-blue-950 xl:text-base">
                          {section.label}
                        </h3>
                        <span className="text-xs text-slate-500">
                          ({section.rows.length})
                        </span>
                      </div>
                      <div className="border-x border-t border-slate-200">
                        {section.rows.map((row) => (
                          <div key={`desktop-row-${section.id}-${row.key}`}>
                            <div className="border-b border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold leading-5 text-slate-800 xl:px-4">
                              {row.label}
                            </div>
                            <div
                              className="grid"
                              style={{
                                gridTemplateColumns: `repeat(${Math.max(selectedDevices.length, 1)}, minmax(0, 1fr))`,
                              }}
                            >
                              {selectedDevices.map((device, index) => (
                                <div
                                  key={`desktop-value-${section.id}-${row.key}-${getProductId(device)}`}
                                  className="flex min-h-14 min-w-0 items-center justify-center border-b border-r border-slate-200 bg-white px-3 py-3.5 text-center last:border-r-0 xl:min-h-16 xl:px-4 xl:py-4"
                                >
                                  <span
                                    className={`whitespace-normal break-words text-sm leading-6 ${getSpecValueClass(row.values[index])}`}
                                  >
                                    {formatValue(row.values[index])}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {loading && !availableDevices.length ? (
          <p className="py-10 text-center text-sm text-slate-500 sm:text-base">
            Loading device catalogue…
          </p>
        ) : null}

        {suggestedCompareCards.length ? (
          <section
            aria-labelledby="system-compare-suggestions-title"
            className="mt-8 border-t border-slate-200 px-4 pt-5 sm:px-0 sm:pt-6"
          >
            <div className="mb-4">
              <h2
                id="system-compare-suggestions-title"
                className="border-l-4 border-blue-600 pl-3 text-lg font-semibold text-slate-900"
              >
                Popular Phone Matchups
              </h2>
              <p className="mt-1 pl-4 text-sm text-slate-500">
                Explore popular smartphone combinations and see how their
                features stack up.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {suggestedCompareCards.map(({ routePath, phones }) => (
                <Link
                  key={routePath}
                  to={routePath}
                  aria-label={`Compare ${phones.map((phone) => phone.name).join(" with ")}`}
                  className="group flex min-h-20 items-center gap-2 rounded-lg border-2 border-slate-200 bg-transparent px-3 py-2 transition-colors hover:border-blue-300 hover:bg-blue-50/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:px-3"
                >
                  {phones.map((phone, index) => (
                    <React.Fragment key={`${routePath}-phone-${index}`}>
                      {index > 0 ? (
                        <span
                          aria-hidden="true"
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-blue-600 shadow-sm"
                        >
                          <FaExchangeAlt className="text-xs" />
                        </span>
                      ) : null}
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <img
                          src={phone.image}
                          alt=""
                          loading="lazy"
                          className="h-10 w-8 shrink-0 object-contain sm:h-12 sm:w-9"
                        />
                        <span className="line-clamp-2 min-w-0 text-xs font-semibold leading-5 text-slate-900 group-hover:text-blue-800 sm:text-sm">
                          {phone.name}
                        </span>
                      </div>
                    </React.Fragment>
                  ))}
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {selectedType === "smartphone" ? (
          <>
            <section className="mt-8 px-4 sm:px-0">
              <ProductDiscoverySections
                entityType="smartphones"
                catalogItems={availableDevices}
                brandCatalog={smartphoneBrandCatalog}
                layout="latestPhones"
                showComparisonBanner={false}
              />
            </section>
            <ContinueBrowsingSmartphones transparentBackground />
          </>
        ) : null}
      </div>

      {showPicker ? (
        <div
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowPicker(false);
          }}
          onTouchStart={(event) => {
            if (event.target === event.currentTarget) setShowPicker(false);
          }}
          className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/40 sm:items-center sm:p-4"
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-device-title"
            aria-describedby="add-device-description"
            className="flex h-[92dvh] max-h-[92dvh] w-full flex-col overflow-hidden border border-slate-200 bg-white sm:h-auto sm:max-h-[min(84vh,760px)] sm:max-w-xl sm:rounded-xl lg:max-w-2xl"
          >
            <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-4 py-4 sm:px-5 sm:py-5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2
                    id="add-device-title"
                    className="text-base font-bold tracking-tight text-slate-950 sm:text-lg"
                  >
                    Select a{" "}
                    {selectedType === "smartphone" ? "mobile" : selectedType} to
                    compare
                  </h2>
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold tabular-nums text-blue-700">
                    {selectedDevices.length}/{MAX_COMPARE_DEVICES} selected
                  </span>
                </div>
                <p
                  id="add-device-description"
                  className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm"
                >
                  Search the catalogue and add up to {MAX_COMPARE_DEVICES}{" "}
                  compatible devices.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPicker(false)}
                aria-label="Close device picker"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-2xl leading-none text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                ×
              </button>
            </header>

            <div className="shrink-0 border-b border-slate-200 px-4 py-3 sm:px-5">
              <label htmlFor="compare-device-search" className="sr-only">
                Search phones by name or brand
              </label>
              <div className="flex items-center gap-3 border border-slate-300 bg-white px-3 transition-colors focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-5 w-5 shrink-0 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <circle cx="10.8" cy="10.8" r="6.8" />
                  <path d="m16 16 4.2 4.2" strokeLinecap="round" />
                </svg>
                <input
                  id="compare-device-search"
                  autoFocus
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by phone name or brand"
                  className="min-w-0 flex-1 border-0 bg-transparent py-3 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:outline-none focus:ring-0 sm:text-base"
                />
                {search ? (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="shrink-0 px-1 py-2 text-xs font-semibold text-blue-700 hover:text-blue-900"
                    aria-label="Clear search"
                  >
                    Clear
                  </button>
                ) : null}
              </div>
              <div className="mt-2 flex items-center justify-between gap-3 text-xs text-slate-500">
                <span>
                  {compatibleDevices.length}{" "}
                  {compatibleDevices.length === 1 ? "device" : "devices"} shown
                </span>
                {selectedDevices.length >= MAX_COMPARE_DEVICES ? (
                  <span className="font-medium text-slate-600">
                    Comparison limit reached
                  </span>
                ) : (
                  <span>
                    {MAX_COMPARE_DEVICES - selectedDevices.length} slot
                    {MAX_COMPARE_DEVICES - selectedDevices.length === 1
                      ? ""
                      : "s"}{" "}
                    available
                  </span>
                )}
              </div>
              {pickerMessage ? (
                <p
                  role="status"
                  aria-live="polite"
                  className="mt-2 border-l-2 border-blue-600 bg-blue-50 px-3 py-2 text-xs leading-5 text-blue-800 sm:text-sm"
                >
                  {pickerMessage}
                </p>
              ) : null}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              {compatibleDevices.map((device) => {
                const id = String(getProductId(device));
                const image = getImage(device);
                const isSelected = selectedDevices.some(
                  (selected) => String(getProductId(selected)) === id,
                );
                const limitReached =
                  selectedDevices.length >= MAX_COMPARE_DEVICES;
                const price = getPrice(device);
                return (
                  <div
                    key={id}
                    className={`grid grid-cols-[3.5rem_minmax(0,1fr)_5.25rem] items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0 sm:grid-cols-[4.25rem_minmax(0,1fr)_5.75rem] sm:gap-4 sm:px-5 sm:py-3.5 ${isSelected ? "bg-blue-50/60" : "bg-white hover:bg-slate-50"}`}
                  >
                    <div className="flex h-14 w-14 items-center justify-center sm:h-16 sm:w-16">
                      {image ? (
                        <img
                          src={image}
                          alt=""
                          loading="lazy"
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <span
                          className="flex h-11 w-9 items-center justify-center bg-slate-100 text-lg text-slate-400"
                          aria-hidden="true"
                        >
                          ▯
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 py-1">
                      <p className="line-clamp-2 break-words text-sm font-semibold leading-5 text-slate-900 sm:text-[15px]">
                        {getProductName(device)}
                      </p>
                      <p className="mt-1 truncate text-xs leading-4 text-slate-500 sm:text-sm">
                        {[
                          device?.brand || device?.manufacturer,
                          price ? formatPrice(price) : null,
                        ]
                          .filter(Boolean)
                          .join(" · ") || "Price unavailable"}
                      </p>
                    </div>
                    <div className="flex justify-end">
                      {isSelected ? (
                        <span
                          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 sm:text-sm"
                          aria-label="Already added"
                        >
                          <svg
                            aria-hidden="true"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="h-4 w-4"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.704 5.29a1 1 0 0 1 .006 1.414l-7.2 7.26a1 1 0 0 1-1.42.005L3.3 9.2a1 1 0 0 1 1.4-1.43l4.08 3.997 6.51-6.47a1 1 0 0 1 1.414-.006Z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Added
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => addDevice(device)}
                          disabled={limitReached}
                          className="inline-flex min-h-9 items-center justify-center gap-1 border border-blue-600 px-2.5 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-600 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 sm:min-h-10 sm:px-3 sm:text-sm"
                        >
                          <span
                            aria-hidden="true"
                            className="text-base leading-none"
                          >
                            +
                          </span>{" "}
                          Add
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {!compatibleDevices.length ? (
                <div className="flex min-h-44 flex-col items-center justify-center px-6 py-10 text-center">
                  <div
                    className="mb-3 flex h-10 w-10 items-center justify-center bg-slate-100 text-slate-400"
                    aria-hidden="true"
                  >
                    ⌕
                  </div>
                  <p className="text-sm font-semibold text-slate-800">
                    {loading
                      ? "Loading device catalogue…"
                      : "No matching devices found"}
                  </p>
                  <p className="mt-1 max-w-xs text-xs leading-5 text-slate-500">
                    Try a different phone name or brand.
                  </p>
                </div>
              ) : null}
            </div>

            <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3 sm:px-5 sm:py-4">
              <p className="min-w-0 text-xs leading-5 text-slate-500 sm:text-sm">
                {selectedDevices.length < MIN_COMPARE_DEVICES
                  ? `Select at least ${MIN_COMPARE_DEVICES} devices to compare.`
                  : `${selectedDevices.length} devices ready to compare.`}
              </p>
              <button
                type="button"
                onClick={() => setShowPicker(false)}
                className="min-h-10 shrink-0 bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                Done
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </main>
  );
};

export default MobileCompare;
