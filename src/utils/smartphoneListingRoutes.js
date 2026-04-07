const SMARTPHONE_LISTING_BASE_PATH = "/smartphones";

export const SMARTPHONE_FEATURE_ROUTE_META = {
  "ai-features": {
    name: "AI Features",
    description: "AI tools & assistants",
  },
  "high-camera": {
    name: "High MP Camera",
    description: "50MP+ cameras",
  },
  "long-battery": {
    name: "Long Battery",
    description: "6000mAh+",
  },
  "fast-charging": {
    name: "Fast Charge",
    description: "65W+ charging",
  },
  "wireless-charging": {
    name: "Wireless",
    description: "Wireless charging",
  },
  amoled: {
    name: "AMOLED",
    description: "AMOLED displays",
  },
  "high-refresh-rate": {
    name: "120Hz+",
    description: "Smooth display",
  },
  "5g": {
    name: "5G",
    description: "5G connectivity",
  },
  "wifi-7": {
    name: "Wi-Fi 7",
    description: "Latest Wi-Fi",
  },
  "ip-rating": {
    name: "IP Rated",
    description: "IP68/IP69",
  },
  "high-ram": {
    name: "High RAM",
    description: "12GB+ RAM",
  },
  gaming: {
    name: "Gaming",
    description: "Gaming phones",
  },
  esim: {
    name: "eSIM",
    description: "eSIM support",
  },
  nfc: {
    name: "NFC",
    description: "Tap to pay",
  },
  ois: {
    name: "OIS",
    description: "Optical stabilization",
  },
  periscope: {
    name: "Periscope",
    description: "Periscope lens",
  },
  "ufs-4": {
    name: "UFS 4.x",
    description: "Fast storage",
  },
  lpddr5x: {
    name: "LPDDR5X",
    description: "Fast RAM",
  },
  fingerprint: {
    name: "Fingerprint",
    description: "Fingerprint sensor",
  },
};

const safeDecode = (value = "") => {
  try {
    return decodeURIComponent(String(value || ""));
  } catch {
    return String(value || "");
  }
};

export const normalizeSmartphoneListingSlug = (value = "") =>
  safeDecode(value)
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const toReadableListingLabel = (value = "") => {
  const normalized = safeDecode(value)
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) return "";
  return normalized
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export const getSmartphoneFeatureRouteMeta = (featureValue = "") => {
  const id = normalizeSmartphoneListingSlug(featureValue);
  if (!id) return null;
  const matched = SMARTPHONE_FEATURE_ROUTE_META[id] || null;
  return {
    id,
    name: matched?.name || toReadableListingLabel(id),
    description: matched?.description || toReadableListingLabel(id),
  };
};

const toQueryString = (query = null) => {
  if (!query) return "";
  if (typeof query === "string") {
    const normalized = query.replace(/^\?+/, "").trim();
    return normalized ? `?${normalized}` : "";
  }

  if (query instanceof URLSearchParams) {
    const text = query.toString();
    return text ? `?${text}` : "";
  }

  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value == null) return;
    if (Array.isArray(value)) {
      const joined = value.map((item) => String(item || "").trim()).filter(Boolean);
      if (joined.length) params.set(key, joined.join(","));
      return;
    }
    const text = String(value).trim();
    if (text) params.set(key, text);
  });
  const text = params.toString();
  return text ? `?${text}` : "";
};

export const buildSmartphoneListingPath = ({
  brand = "",
  feature = "",
  query = null,
} = {}) => {
  const brandSlug = normalizeSmartphoneListingSlug(brand);
  const featureSlug = normalizeSmartphoneListingSlug(feature);

  let path = SMARTPHONE_LISTING_BASE_PATH;
  if (brandSlug) path += `/brand/${brandSlug}`;
  if (featureSlug) path += `/feature/${featureSlug}`;

  return `${path}${toQueryString(query)}`;
};

export const buildSmartphoneBrandPath = (brand = "", query = null) =>
  buildSmartphoneListingPath({ brand, query });

export const buildSmartphoneFeaturePath = (feature = "", query = null) =>
  buildSmartphoneListingPath({ feature, query });

export const stripSmartphoneSeoQueryParams = (search = "") => {
  const params = new URLSearchParams(search || "");
  params.delete("brand");
  params.delete("feature");
  return params;
};

export const parseSmartphoneListingPath = (pathname = "") => {
  const normalizedPath = String(pathname || "")
    .trim()
    .replace(/\/+$/g, "") || SMARTPHONE_LISTING_BASE_PATH;

  if (normalizedPath === SMARTPHONE_LISTING_BASE_PATH) {
    return {
      brandSlug: "",
      featureSlug: "",
      canonicalPath: SMARTPHONE_LISTING_BASE_PATH,
    };
  }

  const brandFeatureMatch = normalizedPath.match(
    /^\/smartphones\/brand\/([^/]+)\/feature\/([^/]+)$/i,
  );
  if (brandFeatureMatch) {
    const brandSlug = normalizeSmartphoneListingSlug(brandFeatureMatch[1]);
    const featureSlug = normalizeSmartphoneListingSlug(brandFeatureMatch[2]);
    return {
      brandSlug,
      featureSlug,
      canonicalPath: buildSmartphoneListingPath({
        brand: brandSlug,
        feature: featureSlug,
      }),
    };
  }

  const featureBrandMatch = normalizedPath.match(
    /^\/smartphones\/feature\/([^/]+)\/brand\/([^/]+)$/i,
  );
  if (featureBrandMatch) {
    const featureSlug = normalizeSmartphoneListingSlug(featureBrandMatch[1]);
    const brandSlug = normalizeSmartphoneListingSlug(featureBrandMatch[2]);
    return {
      brandSlug,
      featureSlug,
      canonicalPath: buildSmartphoneListingPath({
        brand: brandSlug,
        feature: featureSlug,
      }),
    };
  }

  const brandOnlyMatch = normalizedPath.match(/^\/smartphones\/brand\/([^/]+)$/i);
  if (brandOnlyMatch) {
    const brandSlug = normalizeSmartphoneListingSlug(brandOnlyMatch[1]);
    return {
      brandSlug,
      featureSlug: "",
      canonicalPath: buildSmartphoneListingPath({ brand: brandSlug }),
    };
  }

  const featureOnlyMatch = normalizedPath.match(
    /^\/smartphones\/feature\/([^/]+)$/i,
  );
  if (featureOnlyMatch) {
    const featureSlug = normalizeSmartphoneListingSlug(featureOnlyMatch[1]);
    return {
      brandSlug: "",
      featureSlug,
      canonicalPath: buildSmartphoneListingPath({ feature: featureSlug }),
    };
  }

  return null;
};
