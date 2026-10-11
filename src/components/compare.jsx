import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { useDevice } from "../hooks/useDevice";
import useStoreLogos from "../hooks/useStoreLogos";

const MIN_COMPARE_DEVICES = 2;
const MAX_COMPARE_DEVICES = 3;
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
  { id: "pros", label: "Pros", sources: [] },
  { id: "cons", label: "Cons", sources: [] },
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

const getProductId = (device) =>
  device?.productId ??
  device?.product_id ??
  device?.id ??
  device?.smartphoneId ??
  null;

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
    store_prices: Array.isArray(variant?.store_prices)
      ? variant.store_prices
      : Array.isArray(variant?.storePrices)
        ? variant.storePrices
        : [],
  }));
};

const getSelectedVariant = (device) => {
  const variants = getVariants(device);
  if (!variants.length) return null;
  const index = Math.max(0, Number(device?.selectedVariantIndex) || 0);
  return variants[index] || variants[0];
};

const getPrice = (device) => {
  const variant = getSelectedVariant(device);
  const direct = Number(
    variant?.base_price ??
      variant?.price ??
      device?.price ??
      device?.base_price ??
      device?.basePrice,
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

const getStoreRows = (device) => {
  const variant = getSelectedVariant(device);
  const variantStores = Array.isArray(variant?.store_prices)
    ? variant.store_prices
    : [];
  const deviceStores = Array.isArray(device?.store_prices)
    ? device.store_prices
    : Array.isArray(device?.storePrices)
      ? device.storePrices
      : [];
  // Some catalog variants omit retailer prices even when product-level prices exist.
  const stores = variantStores.length ? variantStores : deviceStores;
  if (!Array.isArray(stores)) return [];
  return stores
    .filter(Boolean)
    .map((store) => ({
      name:
        store?.store_name ||
        store?.storeName ||
        store?.store ||
        store?.merchant ||
        "Store",
      price: store?.price ?? store?.amount ?? null,
      url:
        store?.url ||
        store?.link ||
        store?.url_link ||
        store?.product_url ||
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
    device?.thumbnail ||
    images.find(Boolean) ||
    pictures.find(Boolean);
  return typeof candidate === "string"
    ? candidate
    : candidate?.url || candidate?.src || "";
};

const normalizeSpecScore100 = (rawValue) => {
  if (
    rawValue === null ||
    rawValue === undefined ||
    String(rawValue).trim() === ""
  )
    return null;
  const value = Number(rawValue);
  if (!Number.isFinite(value) || value <= 0 || value > 100) return null;
  if (value <= 1) return value * 100;
  if (value <= 10) return value * 10;
  return value;
};

// Only use dedicated MobilesX specification-score fields. Generic `score`,
// store ratings and hook/trending scores are different metrics and must not be
// rendered as a specification score.
const getScore = (device) => {
  if (!device) return "—";
  const v2Source = String(
    device?.spec_score_v2_source ?? device?.specScoreV2Source ?? "",
  ).toLowerCase();
  const legacySource = String(
    device?.spec_score_source ?? device?.specScoreSource ?? "",
  ).toLowerCase();
  const candidates = [
    {
      value: device?.spec_score_v2_raw ?? device?.specScoreV2Raw,
      source: v2Source,
    },
    { value: device?.spec_score_v2 ?? device?.specScoreV2, source: v2Source },
    { value: device?.spec_score ?? device?.specScore, source: legacySource },
  ];
  for (const candidate of candidates) {
    if (candidate.source.includes("fallback")) continue;
    const score100 = normalizeSpecScore100(candidate.value);
    if (score100 != null) return `${(score100 / 10).toFixed(1)}/10`;
  }
  return "—";
};

const getVariantLabel = (device) => {
  const variant = getSelectedVariant(device);
  const ram = variant?.ram || variant?.memory || "";
  const storage =
    variant?.storage || variant?.internal_storage || variant?.rom || "";
  const value = [ram, storage].filter(Boolean).join(" · ");
  return (
    value || device?.variant_label || device?.variant || "Variant not listed"
  );
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

const normalizeEditorialItems = (value) => {
  if (value == null || value === "") return [];
  if (Array.isArray(value)) {
    return value.flatMap((item) => {
      if (item == null || item === "") return [];
      if (typeof item === "object") {
        const text =
          item.text ??
          item.title ??
          item.description ??
          item.value ??
          item.content ??
          item.name;
        return text == null || String(text).trim() === ""
          ? []
          : [String(text).trim()];
      }
      return [
        String(item)
          .replace(/^\s*[•●▪*-]\s*/, "")
          .trim(),
      ].filter(Boolean);
    });
  }
  if (typeof value === "object") {
    for (const key of [
      "items",
      "list",
      "points",
      "pros",
      "cons",
      "advantages",
      "disadvantages",
    ]) {
      if (value[key] != null) {
        const nested = normalizeEditorialItems(value[key]);
        if (nested.length) return nested;
      }
    }
    return Object.entries(value).flatMap(([key, item]) => {
      if (item == null || item === false || item === "") return [];
      if (item === true) return [formatLabel(key)];
      if (typeof item === "string" || typeof item === "number")
        return [String(item).trim()].filter(Boolean);
      return normalizeEditorialItems(item);
    });
  }
  const text = String(value).trim();
  if (!text) return [];
  if (text.startsWith("[") || text.startsWith("{")) {
    try {
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === "object")
        return normalizeEditorialItems(parsed);
    } catch {
      // A plain text value can still be a single editorial point.
    }
  }
  return text
    .split(/\r?\n|[•●▪]\s*|;\s*/)
    .map((item) => item.replace(/^\s*[-*]\s*/, "").trim())
    .filter(Boolean);
};

const getProsConsItems = (device, kind) => {
  const isPros = kind === "pros";
  const alternatives = isPros
    ? ["advantages", "strengths"]
    : ["cons", "disadvantages", "drawbacks", "limitations"];
  const rootCandidates = [
    toObject(device?.pros_cons_json),
    toObject(device?.prosCons),
    toObject(device?.pros_cons),
    toObject(device?.review),
    toObject(device?.review_json),
    toObject(device?.reviews_json),
    toObject(
      device?.specifications_json ||
        device?.specifications ||
        device?.specs_json ||
        device?.specs,
    ),
  ];
  const candidates = [
    device?.[kind],
    device?.[`${kind}_json`],
    ...alternatives.map((field) => device?.[field]),
    ...rootCandidates.flatMap((root) => [
      root?.[kind],
      root?.[`${kind}_json`],
      ...alternatives.map((field) => root?.[field]),
    ]),
  ];
  for (const candidate of candidates) {
    const items = normalizeEditorialItems(candidate);
    if (items.length) return Array.from(new Set(items));
  }
  return [];
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

const MobileCompare = () => {
  const { devices: availableDevices = [], loading } = useDevice({
    resources: ["smartphones", "laptops", "tvs", "networking"],
  });
  const { getStoreLogo } = useStoreLogos();
  const location = useLocation();
  const { compareSlug = "" } = useParams();
  const [selectedDevices, setSelectedDevices] = useState([]);
  const [showPicker, setShowPicker] = useState(false);
  const [search, setSearch] = useState("");
  const [activeSection, setActiveSection] = useState("overview");
  const [hideCommonSpecs, setHideCommonSpecs] = useState(false);
  const hydratedRoute = useRef("");

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
  const compatibleDevices = useMemo(() => {
    const query = search.trim().toLowerCase();
    return availableDevices
      .filter((device) => {
        const sameType =
          !selectedDevices.length || getProductType(device) === selectedType;
        const notSelected = !selectedDevices.some(
          (selected) =>
            String(getProductId(selected)) === String(getProductId(device)),
        );
        const matches =
          !query ||
          [getProductName(device), device?.brand, device?.model].some((value) =>
            String(value || "")
              .toLowerCase()
              .includes(query),
          );
        return sameType && notSelected && matches;
      })
      .slice(0, 40);
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
    if (!device || selectedDevices.length >= MAX_COMPARE_DEVICES) return;
    if (
      selectedDevices.some(
        (item) => String(getProductId(item)) === String(getProductId(device)),
      )
    )
      return;
    if (selectedDevices.length && getProductType(device) !== selectedType)
      return;
    setSelectedDevices((current) =>
      [...current, normalizeSelected(device, 0)].filter(Boolean),
    );
    setShowPicker(false);
    setSearch("");
  };

  const removeDevice = (id) => {
    setSelectedDevices((current) =>
      current.filter((device) => String(getProductId(device)) !== String(id)),
    );
  };

  const changeVariant = (id, index) => {
    setSelectedDevices((current) =>
      current.map((device) =>
        String(getProductId(device)) === String(id)
          ? { ...device, selectedVariantIndex: Number(index) || 0 }
          : device,
      ),
    );
  };

  const overviewRows = useMemo(
    () => [
      { key: "launch_date", label: "Launch Date", value: getLaunchLabel },
      { key: "availability", label: "Status", value: getAvailability },
      {
        key: "starting_price",
        label: "Starting Price",
        value: (device) => formatPrice(getPrice(device)),
      },
      {
        key: "variants",
        label: "Variants",
        value: (device) => {
          const variants = getVariants(device);
          const values = variants
            .map((variant) =>
              [
                variant?.ram || variant?.memory,
                variant?.storage || variant?.internal_storage,
              ]
                .filter(Boolean)
                .join(" / "),
            )
            .filter(Boolean);
          return values.length
            ? Array.from(new Set(values)).join(", ")
            : getVariantLabel(device);
        },
      },
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
        if (section.id === "pros" || section.id === "cons") {
          const values = selectedDevices.map((device) =>
            getProsConsItems(device, section.id),
          );
          return {
            ...section,
            rows: [
              {
                key: "editorial-items",
                label:
                  section.id === "pros"
                    ? "What stands out"
                    : "Things to consider",
                values,
              },
            ],
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
      .map((section) => {
        if (section.id === "pros" || section.id === "cons") return section;
        return {
          ...section,
          rows: section.rows.filter((row) => {
            const values = row.values.map((value) =>
              formatValue(value).toLowerCase().replace(/\s+/g, " "),
            );
            return !values.every((value) => value === values[0]);
          }),
        };
      })
      .filter((section) => section.rows.length > 0);
  }, [hideCommonSpecs, sectionRows, selectedDevices.length]);

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
    <main className="min-h-screen min-w-0 bg-white font-sans text-slate-900">
      <div className="mx-auto w-full max-w-[1600px] min-w-0 px-3 pb-10 pt-4 sm:px-5 sm:pb-14 sm:pt-6 lg:px-8">
        <header className="mb-5 flex min-w-0 flex-col gap-3 border-b border-slate-200 pb-4 sm:mb-6 sm:flex-row sm:items-end sm:justify-between sm:gap-6 sm:pb-5">
          <div className="min-w-0">
            <p className="mb-1 text-xs font-medium text-slate-400 sm:text-sm">
              <span className="text-blue-600">Home</span>
              <span className="px-2">/</span>Compare
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl lg:text-4xl">
              Compare{" "}
              {selectedType === "smartphone"
                ? "Mobiles"
                : selectedType
                  ? `${selectedType.charAt(0).toUpperCase()}${selectedType.slice(1)}s`
                  : "Devices"}
            </h1>
            <p className="mt-1 text-sm leading-5 text-slate-500 sm:text-base">
              Compare prices and specifications side by side.
            </p>
          </div>
          <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end">
            <span className="text-xs font-medium text-slate-500 sm:text-sm">
              {selectedDevices.length} of {MAX_COMPARE_DEVICES} selected
            </span>
            <button
              type="button"
              onClick={() => {
                setShowPicker(true);
                setSearch("");
              }}
              disabled={selectedDevices.length >= MAX_COMPARE_DEVICES}
              className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-11 sm:px-5"
            >
              <span aria-hidden="true" className="text-lg leading-none">
                +
              </span>{" "}
              Add phone
            </button>
          </div>
        </header>

        {selectedDevices.length === 0 ? (
          <section className="flex min-h-64 flex-col items-center justify-center border border-dashed border-slate-300 px-4 py-12 text-center sm:min-h-80 sm:px-6">
            <div className="mb-4 flex h-14 w-14 items-center justify-center border border-blue-200 text-3xl font-light text-blue-600">
              +
            </div>
            <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">
              Select mobiles to compare
            </h2>
            <p className="mt-2 max-w-lg text-sm leading-6 text-slate-500 sm:text-base">
              Choose 2 or 3 devices to compare their price, display,
              performance, camera and other specifications.
            </p>
            <button
              type="button"
              onClick={() => setShowPicker(true)}
              className="mt-5 inline-flex min-h-11 items-center gap-2 border border-blue-600 px-5 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50"
            >
              + Select a phone
            </button>
          </section>
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
              const variants = getVariants(device);
              const selectedIndex = Number(device.selectedVariantIndex) || 0;
              const score = getScore(device);
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
                    {variants.length > 1 ? (
                      <label className="mt-3 block max-w-xs">
                        <span className="mb-1 block text-xs font-medium text-slate-600">
                          Variant
                        </span>
                        <select
                          aria-label={`Select variant for ${getProductName(device)}`}
                          value={Math.min(selectedIndex, variants.length - 1)}
                          onChange={(event) =>
                            changeVariant(id, event.target.value)
                          }
                          className="min-h-10 w-full border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500"
                        >
                          {variants.map((variant, variantIndex) => {
                            const label =
                              [
                                variant?.ram || variant?.memory,
                                variant?.storage ||
                                  variant?.internal_storage ||
                                  variant?.rom,
                              ]
                                .filter(Boolean)
                                .join(" · ") || `Variant ${variantIndex + 1}`;
                            return (
                              <option
                                key={`${id}-single-variant-${variantIndex}`}
                                value={variantIndex}
                              >
                                {label}
                              </option>
                            );
                          })}
                        </select>
                      </label>
                    ) : (
                      <p className="mt-2 text-sm text-slate-500">
                        {getVariantLabel(device)}
                      </p>
                    )}
                    <p className="mt-3 text-xl font-bold text-blue-700 sm:text-2xl">
                      {formatPrice(getPrice(device))}
                    </p>
                    {score !== "—" ? (
                      <p className="mt-1 text-xs text-slate-500">
                        MobilesX specification score:{" "}
                        <span className="font-semibold text-slate-800">
                          {score}
                        </span>
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2 sm:flex-col">
                    <button
                      type="button"
                      onClick={() => {
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
            <div className="mb-4 flex flex-col gap-3 border-b border-slate-200 pb-3 sm:mb-5 sm:flex-row sm:items-center sm:justify-between">
              <nav
                aria-label="Comparison sections"
                className="flex max-w-full gap-2 overflow-x-auto pb-1 [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent]"
              >
                {visibleSections.map((section) => (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => scrollToSection(section.id)}
                    className={`shrink-0 border px-3 py-2 text-xs font-semibold transition-colors sm:px-4 sm:text-sm ${activeSection === section.id ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700"}`}
                  >
                    {section.label}
                  </button>
                ))}
              </nav>
              <label className="flex shrink-0 items-center gap-2 text-xs text-slate-600 sm:text-sm">
                <input
                  type="checkbox"
                  checked={hideCommonSpecs}
                  onChange={(event) => setHideCommonSpecs(event.target.checked)}
                  className="h-4 w-4 accent-blue-600"
                />
                Hide common specifications
              </label>
            </div>

            <div className="mb-2 hidden items-center gap-2 text-xs text-slate-500 sm:text-sm md:flex">
              <span aria-hidden="true" className="text-base text-blue-600">
                ↔
              </span>
              <span>
                Scroll horizontally to compare all selected phones and
                specifications.
              </span>
            </div>

            {/* Mobile layout follows a phone-comparison pattern: device columns stay visible, while each spec name gets its own full-width band. */}
            <div className="md:hidden">
              <div
                className={`${selectedDevices.length > 3 ? "overflow-x-auto overscroll-x-contain" : "overflow-visible"} [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent]`}
                style={{ WebkitOverflowScrolling: "touch" }}
              >
                <div
                  className="min-w-0"
                  style={{
                    minWidth:
                      selectedDevices.length > 3
                        ? `${selectedDevices.length * 132}px`
                        : "100%",
                  }}
                >
                  <div
                    className="grid border-t border-slate-200"
                    style={{
                      gridTemplateColumns: `repeat(${Math.max(selectedDevices.length, 1)}, minmax(0, 1fr))`,
                    }}
                  >
                    {selectedDevices.map((device) => {
                      const id = getProductId(device);
                      const variants = getVariants(device);
                      const selectedIndex =
                        Number(device.selectedVariantIndex) || 0;
                      const image = getImage(device);
                      const score = getScore(device);
                      return (
                        <article
                          key={`mobile-product-${id}`}
                          className="relative flex min-w-0 flex-col items-center border-b border-r border-slate-200 bg-white px-2 pb-3 pt-4 text-center"
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
                          {variants.length > 1 ? (
                            <select
                              aria-label={`Select variant for ${getProductName(device)}`}
                              value={Math.min(
                                selectedIndex,
                                variants.length - 1,
                              )}
                              onChange={(event) =>
                                changeVariant(id, event.target.value)
                              }
                              className="mt-2 min-h-8 w-full min-w-0 border border-slate-200 bg-white px-1 text-[11px] text-slate-700 outline-none focus:border-blue-500"
                            >
                              {variants.map((variant, variantIndex) => {
                                const label =
                                  [
                                    variant?.ram || variant?.memory,
                                    variant?.storage ||
                                      variant?.internal_storage ||
                                      variant?.rom,
                                  ]
                                    .filter(Boolean)
                                    .join(" · ") ||
                                  `Variant ${variantIndex + 1}`;
                                return (
                                  <option
                                    key={`${id}-mobile-variant-${variantIndex}`}
                                    value={variantIndex}
                                  >
                                    {label}
                                  </option>
                                );
                              })}
                            </select>
                          ) : (
                            <p className="mt-2 min-h-8 w-full text-[11px] leading-4 text-slate-500">
                              {getVariantLabel(device)}
                            </p>
                          )}
                          <p className="mt-1 break-words text-base font-bold leading-5 text-slate-950">
                            {formatPrice(getPrice(device))}
                          </p>
                          <div className="mt-3 flex min-h-[44px] w-full items-center justify-center border-t border-slate-100 pt-2">
                            {score !== "—" ? (
                              <div className="rounded-sm border border-blue-100 bg-blue-50 px-2 py-1 text-left text-blue-800">
                                <span className="block text-base font-bold leading-5">
                                  {score}
                                </span>
                                <span className="block text-[9px] leading-3">
                                  Spec score
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400">
                                Score unavailable
                              </span>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>

                  {/* Compact device strip stays visible while the user scrolls through long specification groups. */}
                  <div
                    className="sticky top-0 z-30 grid border-b border-slate-300 bg-white/95 backdrop-blur-sm"
                    style={{
                      gridTemplateColumns: `repeat(${Math.max(selectedDevices.length, 1)}, minmax(0, 1fr))`,
                    }}
                  >
                    {selectedDevices.map((device) => {
                      const image = getImage(device);
                      return (
                        <div
                          key={`mobile-sticky-${getProductId(device)}`}
                          className="flex min-h-[76px] min-w-0 items-center gap-1.5 border-r border-slate-200 px-1.5 py-2"
                        >
                          {image ? (
                            <img
                              src={image}
                              alt=""
                              loading="lazy"
                              className="h-10 w-7 shrink-0 object-contain"
                            />
                          ) : null}
                          <div className="min-w-0 flex-1">
                            <p className="line-clamp-2 break-words text-[10px] font-semibold leading-[14px] text-slate-800">
                              {getProductName(device)}
                            </p>
                            <p className="mt-1 break-words text-xs font-bold leading-4 text-slate-950">
                              {formatPrice(getPrice(device))}
                            </p>
                          </div>
                        </div>
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
                                  ) : (
                                    <span
                                      className={`break-words text-xs ${hasPrice ? "font-semibold text-slate-900" : "text-slate-400"}`}
                                    >
                                      {hasPrice
                                        ? formatPrice(numericPrice)
                                        : "—"}
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
                      className="scroll-mt-20 border-b border-slate-200"
                    >
                      <div className="flex items-center gap-2 border-b border-slate-200 bg-blue-50 px-3 py-3">
                        <h3 className="text-sm font-bold text-slate-950">
                          {section.label}
                        </h3>
                        <span className="text-[11px] text-slate-500">
                          ({section.rows.length})
                        </span>
                      </div>
                      {section.rows.map((row) => (
                        <div key={`mobile-row-${section.id}-${row.key}`}>
                          <div className="border-b border-slate-200 bg-blue-50 px-3 py-2 text-[13px] font-semibold leading-5 text-slate-900">
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
                                className={`flex min-h-[54px] min-w-0 items-center justify-center border-b border-r border-slate-200 px-2 py-3 text-center text-[13px] leading-5 ${section.id === "pros" ? "bg-blue-50/50 text-slate-700" : section.id === "cons" ? "bg-slate-50 text-slate-700" : "bg-white text-slate-700"}`}
                              >
                                {section.id === "pros" ||
                                section.id === "cons" ? (
                                  Array.isArray(row.values[index]) &&
                                  row.values[index].length ? (
                                    <ul className="w-full space-y-2 text-left text-[12px] leading-5 sm:text-sm">
                                      {row.values[index].map(
                                        (item, itemIndex) => (
                                          <li
                                            key={`${section.id}-${getProductId(device)}-${itemIndex}`}
                                            className="flex items-start gap-1.5"
                                          >
                                            <span
                                              className="mt-0.5 shrink-0 font-bold text-blue-600"
                                              aria-hidden="true"
                                            >
                                              {section.id === "pros"
                                                ? "+"
                                                : "−"}
                                            </span>
                                            <span className="break-words">
                                              {item}
                                            </span>
                                          </li>
                                        ),
                                      )}
                                    </ul>
                                  ) : (
                                    <span className="text-xs text-slate-400">
                                      Not listed
                                    </span>
                                  )
                                ) : (
                                  <span className="whitespace-normal break-words">
                                    {formatValue(row.values[index])}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </section>
                  ))}
                </div>
              </div>
            </div>

            {/* Desktop mirrors the mobile comparison rhythm: product columns first, then full-width labels and aligned values. */}
            <div className="hidden min-w-0 md:block">
              <div
                aria-label="Scrollable device comparison table"
                className="w-full min-w-0 max-w-full overflow-x-auto overscroll-x-contain border border-slate-200 bg-white [scrollbar-color:#bfdbfe_#f8fafc] [scrollbar-width:thin]"
                style={{ WebkitOverflowScrolling: "touch" }}
                tabIndex={0}
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
                      const variants = getVariants(device);
                      const selectedIndex =
                        Number(device.selectedVariantIndex) || 0;
                      const image = getImage(device);
                      const score = getScore(device);
                      return (
                        <article
                          key={`desktop-product-${id}`}
                          className="relative flex min-w-0 flex-col items-center border-r border-slate-200 px-4 pb-5 pt-5 text-center last:border-r-0 lg:px-6 lg:pt-6"
                        >
                          <button
                            type="button"
                            onClick={() => removeDevice(id)}
                            aria-label={`Remove ${getProductName(device)}`}
                            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center text-2xl leading-none text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-700"
                            title="Remove phone"
                          >
                            ×
                          </button>
                          <div className="flex h-36 w-full items-center justify-center lg:h-40">
                            {image ? (
                              <img
                                src={image}
                                alt={getProductName(device)}
                                loading="lazy"
                                className="max-h-32 max-w-[150px] object-contain lg:max-h-36 lg:max-w-[170px]"
                              />
                            ) : (
                              <div className="flex h-24 w-20 items-center justify-center border border-slate-200 text-xs text-slate-400">
                                No image
                              </div>
                            )}
                          </div>
                          <h2 className="mt-3 min-h-12 w-full max-w-[320px] break-words text-base font-bold leading-6 text-slate-950 lg:text-lg">
                            {getProductName(device)}
                          </h2>
                          {variants.length > 1 ? (
                            <select
                              aria-label={`Select variant for ${getProductName(device)}`}
                              value={Math.min(
                                selectedIndex,
                                variants.length - 1,
                              )}
                              onChange={(event) =>
                                changeVariant(id, event.target.value)
                              }
                              className="mt-2 min-h-10 w-full max-w-[280px] border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            >
                              {variants.map((variant, variantIndex) => {
                                const label =
                                  [
                                    variant?.ram || variant?.memory,
                                    variant?.storage ||
                                      variant?.internal_storage ||
                                      variant?.rom,
                                  ]
                                    .filter(Boolean)
                                    .join(" · ") ||
                                  `Variant ${variantIndex + 1}`;
                                return (
                                  <option
                                    key={`${id}-desktop-variant-${variantIndex}`}
                                    value={variantIndex}
                                  >
                                    {label}
                                  </option>
                                );
                              })}
                            </select>
                          ) : (
                            <p className="mt-2 min-h-10 text-sm leading-5 text-slate-500">
                              {getVariantLabel(device)}
                            </p>
                          )}
                          <p className="mt-3 text-2xl font-bold tracking-tight text-blue-700 lg:text-3xl">
                            {formatPrice(getPrice(device))}
                          </p>
                          <div className="mt-4 w-full max-w-[280px] border border-blue-100 bg-blue-50 px-3 py-3">
                            {score !== "—" ? (
                              <>
                                <p className="text-2xl font-bold tabular-nums text-blue-800 lg:text-3xl">
                                  {score}
                                </p>
                                <p className="mt-1 text-xs font-medium text-blue-700">
                                  MobilesX specification score
                                </p>
                              </>
                            ) : (
                              <p className="text-sm text-slate-500">
                                Specification score unavailable
                              </p>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>

                  <section
                    id="compare-store-prices"
                    className="border-b border-slate-200"
                  >
                    <div className="border-b border-blue-100 bg-blue-50 px-4 py-4 lg:px-6">
                      <h3 className="text-base font-bold text-blue-900 lg:text-lg">
                        Compare Prices
                      </h3>
                      <p className="mt-1 text-sm text-slate-600">
                        Compare retailer prices for each selected variant.
                      </p>
                    </div>
                    {storePriceRows.map((storeRow) => {
                      const logo = getStoreLogo(storeRow.label);
                      return (
                        <div key={`desktop-store-${storeRow.key}`}>
                          <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 lg:px-6">
                            {logo ? (
                              <img
                                src={logo}
                                alt={`${storeRow.label} logo`}
                                loading="lazy"
                                className="h-7 w-10 shrink-0 object-contain"
                              />
                            ) : (
                              <span className="flex h-7 w-10 shrink-0 items-center justify-center border border-slate-200 bg-white text-xs font-bold uppercase text-slate-500">
                                {storeRow.label.slice(0, 2)}
                              </span>
                            )}
                            <span className="text-sm font-semibold text-slate-800 lg:text-base">
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
                                  className="flex min-h-14 min-w-0 items-center justify-center border-b border-r border-slate-200 px-4 py-3 text-center last:border-r-0 lg:min-h-16 lg:px-6"
                                >
                                  {hasPrice && store?.url ? (
                                    <a
                                      href={store.url}
                                      target="_blank"
                                      rel="nofollow sponsored noopener noreferrer"
                                      className="break-words text-base font-semibold text-blue-700 underline-offset-4 hover:underline lg:text-lg"
                                    >
                                      {priceLabel}
                                      <span
                                        aria-hidden="true"
                                        className="ml-1 text-sm"
                                      >
                                        ↗
                                      </span>
                                    </a>
                                  ) : (
                                    <span
                                      className={`text-base lg:text-lg ${hasPrice ? "font-semibold text-slate-900" : "text-slate-400"}`}
                                    >
                                      {priceLabel}
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
                      className="scroll-mt-24 border-b border-slate-200"
                    >
                      <div className="flex items-center gap-3 border-b border-blue-100 bg-blue-50 px-4 py-4 lg:px-6">
                        <span className="h-6 w-1.5 bg-blue-600" />
                        <h3 className="text-base font-bold text-blue-950 lg:text-lg">
                          {section.label}
                        </h3>
                        <span className="text-sm text-slate-500">
                          ({section.rows.length})
                        </span>
                      </div>
                      {section.rows.map((row) => (
                        <div key={`desktop-row-${section.id}-${row.key}`}>
                          <div
                            className={`border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800 lg:px-6 lg:text-base ${section.id === "pros" ? "bg-blue-50/70" : section.id === "cons" ? "bg-slate-50" : "bg-slate-50"}`}
                          >
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
                                className={`flex min-h-14 min-w-0 items-center justify-center border-b border-r border-slate-200 px-4 py-4 text-center last:border-r-0 lg:min-h-16 lg:px-6 ${section.id === "pros" ? "bg-blue-50/30" : "bg-white"}`}
                              >
                                {section.id === "pros" ||
                                section.id === "cons" ? (
                                  Array.isArray(row.values[index]) &&
                                  row.values[index].length ? (
                                    <ul className="w-full max-w-sm space-y-3 text-left text-sm leading-6 text-slate-700 lg:text-base">
                                      {row.values[index].map(
                                        (item, itemIndex) => (
                                          <li
                                            key={`${section.id}-${getProductId(device)}-${itemIndex}`}
                                            className="flex items-start gap-2"
                                          >
                                            <span
                                              className="mt-px shrink-0 font-bold text-blue-600"
                                              aria-hidden="true"
                                            >
                                              {section.id === "pros"
                                                ? "+"
                                                : "−"}
                                            </span>
                                            <span className="break-words">
                                              {item}
                                            </span>
                                          </li>
                                        ),
                                      )}
                                    </ul>
                                  ) : (
                                    <span className="text-sm text-slate-400">
                                      Not listed
                                    </span>
                                  )
                                ) : (
                                  <span className="whitespace-normal break-words text-sm leading-6 text-slate-700 lg:text-base">
                                    {formatValue(row.values[index])}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
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
      </div>

      {showPicker ? (
        <div
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowPicker(false);
          }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/30 sm:items-center sm:p-5"
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-device-title"
            className="flex max-h-[92dvh] w-full max-w-2xl flex-col border border-slate-200 bg-white sm:max-h-[85vh]"
          >
            <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3 sm:px-5 sm:py-4">
              <div>
                <h2
                  id="add-device-title"
                  className="text-lg font-bold text-slate-950 sm:text-xl"
                >
                  Select a mobile to compare
                </h2>
                <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                  Search the catalogue and add a device to the table.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPicker(false)}
                aria-label="Close device picker"
                className="flex h-9 w-9 items-center justify-center text-2xl text-slate-500 hover:bg-slate-100"
              >
                ×
              </button>
            </header>
            <div className="border-b border-slate-200 p-3 sm:p-4">
              <input
                autoFocus
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name or brand…"
                className="w-full border border-slate-300 bg-white px-3 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:px-4 sm:text-base"
              />
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {compatibleDevices.map((device) => {
                const image = getImage(device);
                return (
                  <button
                    key={String(getProductId(device))}
                    type="button"
                    onClick={() => addDevice(device)}
                    className="flex w-full items-center gap-3 border-b border-slate-100 px-3 py-3 text-left last:border-b-0 hover:bg-blue-50/50 sm:gap-4 sm:px-5 sm:py-4"
                  >
                    {image ? (
                      <img
                        src={image}
                        alt=""
                        loading="lazy"
                        className="h-16 w-12 shrink-0 object-contain sm:h-20 sm:w-16"
                      />
                    ) : (
                      <span className="h-16 w-12 shrink-0 border border-slate-200 sm:h-20 sm:w-16" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-900 sm:text-base">
                        {getProductName(device)}
                      </span>
                      <span className="mt-1 block text-xs text-slate-500 sm:text-sm">
                        {device?.brand || device?.manufacturer || ""}{" "}
                        {getPrice(device)
                          ? `· ${formatPrice(getPrice(device))}`
                          : ""}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs font-semibold text-blue-700 sm:text-sm">
                      Add +
                    </span>
                  </button>
                );
              })}
              {!compatibleDevices.length ? (
                <p className="px-5 py-10 text-center text-sm text-slate-500">
                  No matching devices found.
                </p>
              ) : null}
            </div>
            <footer className="border-t border-slate-200 px-4 py-3 text-right sm:px-5 sm:py-4">
              <button
                type="button"
                onClick={() => setShowPicker(false)}
                className="min-h-10 border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
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
