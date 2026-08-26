import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaArrowRight,
  FaBalanceScale,
  FaChevronRight,
  FaFire,
  FaSearch,
  FaStar,
  FaThLarge,
  FaWallet,
} from "react-icons/fa";
import { createProductPath } from "../../utils/slugGenerator";
import { readPreloadedApiResponse } from "../../utils/preloadedApi";
import {
  buildPublicSmartphoneBrandPath as buildSmartphoneBrandPath,
  buildPublicSmartphoneListingPath as buildSmartphoneListingPath,
} from "../../utils/smartphoneListingRoutes";
import {
  matchesTvFeature,
  TV_FEATURE_CATALOG,
} from "../../utils/tvPopularFeatures";
import { TV_DISCOVERY_PRICE_BUCKETS } from "../../utils/tvPriceRanges";
import {
  LAPTOP_FEATURE_CATALOG,
  matchesLaptopFeature,
} from "../../utils/laptopPopularFeatures";
import {
  buildLaptopListingPath,
  LAPTOP_DISCOVERY_PRICE_BUCKETS,
  stripLaptopSeoQueryParams,
} from "../../utils/laptopListingRoutes";
import { buildApiUrl } from "../../utils/apiUrl";
import { fetchPublicJson } from "../../utils/publicJsonRequest";

const normalizeText = (value) => String(value || "").trim();

const normalizeEntityType = (value) => {
  const raw = normalizeText(value).toLowerCase();
  if (!raw) return "smartphones";
  if (raw.includes("tv")) return "tvs";
  if (raw.includes("laptop")) return "laptops";
  if (raw.includes("network")) return "networking";
  return "smartphones";
};

const supportsDiscoveryApi = (entityType) =>
  normalizeEntityType(entityType) === "smartphones";

const SMARTPHONE_DETAIL_RESERVED_SEGMENTS = new Set([
  "brand",
  "feature",
  "filter",
  "upcoming",
]);

const getEntityConfig = (entityType) => {
  const type = normalizeEntityType(entityType);
  if (type === "tvs") {
    return {
      type,
      basePath: "/tvs",
      pluralTitle: "TVs",
      singularTitle: "TV",
      itemNounLower: "tv",
      brandSuffix: "TVs",
      defaultPriceLabel: "Under \u20B950,000",
      secondaryPopularLabel: "Latest {brand} TVs",
      secondaryPopularPath: (brand) => `/tvs?brand=${brand}&sort=newest`,
    };
  }

  if (type === "laptops") {
    return {
      type,
      basePath: "/laptops",
      pluralTitle: "Laptops",
      singularTitle: "Laptop",
      itemNounLower: "laptop",
      brandSuffix: "Laptops",
      defaultPriceLabel: "Under \u20B950,000",
      secondaryPopularLabel: "{brand} Gaming Laptops",
      secondaryPopularPath: (brand) =>
        buildLaptopListingPath({ brand, feature: "gaming" }),
      brandBudgetPath: (brand) =>
        buildLaptopListingPath({ brand, budget: 50000 }),
    };
  }

  return {
    type: "smartphones",
    basePath: "/smartphones",
    pluralTitle: "Phones",
    singularTitle: "Phone",
    itemNounLower: "smartphone",
    brandSuffix: "Mobiles",
    defaultPriceLabel: "Under \u20B920,000",
    secondaryPopularLabel: "{brand} 5G Phones",
    secondaryPopularPath: (brand) =>
      buildSmartphoneBrandPath(brand, { network: "5G" }),
  };
};

const toProductPath = (item, entityType = "smartphones") => {
  const config = getEntityConfig(entityType);
  const productLabel = normalizeText(
    item?.name ||
      item?.product_name ||
      item?.model ||
      item?.title ||
      item?.slug,
  );
  if (productLabel) return createProductPath(config.basePath, productLabel);
  return config.basePath;
};

const normalizeSmartphoneDetailPath = (pathname = "") => {
  const normalizedPath =
    String(pathname || "").replace(/\/+$/g, "") || "/smartphones";
  if (!normalizedPath.startsWith("/smartphones/")) return normalizedPath;
  const tail = normalizedPath.slice("/smartphones/".length);
  if (!tail || tail.includes("/")) return normalizedPath;
  if (SMARTPHONE_DETAIL_RESERVED_SEGMENTS.has(tail.toLowerCase())) {
    return normalizedPath;
  }
  return createProductPath("smartphones", tail);
};

const normalizeDiscoveryPath = (rawPath, entityType = "smartphones") => {
  const config = getEntityConfig(entityType);
  const pathValue = normalizeText(rawPath);
  if (!pathValue) return config.basePath;

  try {
    const url = new URL(pathValue, "https://hook.local");
    if (
      config.type === "smartphones" &&
      url.pathname.replace(/\/+$/g, "") === config.basePath
    ) {
      const brand = url.searchParams.get("brand") || "";
      const feature = url.searchParams.get("feature") || "";
      if (brand || feature) {
        if (url.searchParams.get("sort") === "latest") {
          url.searchParams.set("sort", "newest");
        }
        url.searchParams.delete("brand");
        url.searchParams.delete("feature");
        return buildSmartphoneListingPath({
          brand,
          feature,
          query: url.searchParams,
        });
      }
    }
    if (
      config.type === "laptops" &&
      url.pathname.replace(/\/+$/g, "") === config.basePath
    ) {
      const brand = url.searchParams.get("brand") || "";
      const feature = url.searchParams.get("feature") || "";
      const budget =
        url.searchParams.get("maxPrice") ||
        url.searchParams.get("priceMax") ||
        "";
      const latest = url.searchParams.get("filter") === "new";
      if (brand || feature || budget || latest) {
        return buildLaptopListingPath({
          brand,
          feature,
          budget,
          latest,
          query: stripLaptopSeoQueryParams(url.search),
        });
      }
    }
    if (url.searchParams.get("sort") === "latest") {
      url.searchParams.set("sort", "newest");
    }
    const normalizedPathname =
      config.type === "smartphones"
        ? normalizeSmartphoneDetailPath(url.pathname)
        : url.pathname.replace(/\/+$/g, "") || config.basePath;
    return `${normalizedPathname}${url.search}${url.hash}`;
  } catch {
    const fallbackPath = pathValue.startsWith("/")
      ? pathValue
      : `/${pathValue}`;
    return config.type === "smartphones"
      ? normalizeSmartphoneDetailPath(fallbackPath)
      : fallbackPath;
  }
};

const buildDiscoveryEndpoint = (productId, entityType) => {
  const pid = Number(productId);
  if (!Number.isInteger(pid) || pid <= 0) return "";
  const queryEntity = encodeURIComponent(normalizeEntityType(entityType));
  return buildApiUrl(
    `/public/product/${encodeURIComponent(
      pid,
    )}/discovery?entity_type=${queryEntity}`,
  );
};

const fixCurrencyText = (value = "") => {
  const text = normalizeText(value);
  if (!text) return "";

  return text
    .replace(/Ã¢â€šÂ¹|â‚¹|₹/g, "\u20B9")
    .replace(/\bunder\s*\u20B9?\s*/i, "Under \u20B9")
    .replace(/\babove\s*\u20B9?\s*/i, "Above \u20B9");
};

const formatPriceTag = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return "";
  return `\u20B9${new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(Math.round(amount))}`;
};

const formatMonthTag = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
};

const formatCountTag = (value, noun = "items") => {
  const count = Number(value);
  if (!Number.isFinite(count) || count <= 0) return "";
  const normalizedNoun =
    count === 1 && noun.endsWith("s") ? noun.slice(0, -1) : noun;
  return `${new Intl.NumberFormat("en-IN").format(count)} ${normalizedNoun}`;
};

const toCatalogProductKey = (item = {}) =>
  normalizeText(
    item?.productId ||
      item?.product_id ||
      item?.id ||
      item?.name ||
      item?.product_name ||
      item?.model,
  ).toLowerCase();

const toCatalogPrice = (item = {}) => {
  const prices = [];
  const appendPrice = (value) => {
    const parsedPrice = Number(
      String(value ?? "")
        .replace(/[^\d.]/g, "")
        .trim(),
    );
    if (Number.isFinite(parsedPrice) && parsedPrice > 0) {
      prices.push(parsedPrice);
    }
  };
  const toArray = (value) => {
    if (Array.isArray(value)) return value;
    if (typeof value !== "string") return [];
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  [item?.numericPrice, item?.price, item?.base_price, item?.basePrice].forEach(
    appendPrice,
  );

  toArray(item?.variants || item?.variants_json).forEach((variant) => {
    [
      variant?.numericPrice,
      variant?.price,
      variant?.base_price,
      variant?.basePrice,
    ].forEach(appendPrice);
    toArray(variant?.store_prices || variant?.storePrices).forEach((store) => {
      appendPrice(store?.price);
    });
  });

  return prices.length ? Math.min(...prices) : 0;
};

const buildTvCatalogSections = (catalogItems = [], brandCatalog = []) => {
  const uniqueItems = [];
  const seenProducts = new Set();
  const brandLogoByName = new Map();

  (Array.isArray(brandCatalog) ? brandCatalog : []).forEach((brand) => {
    const brandName = normalizeText(brand?.name || brand?.brand_name);
    const logoUrl = normalizeText(
      brand?.logo || brand?.image || brand?.logo_url || brand?.logoUrl,
    );
    if (!brandName || !logoUrl) return;
    brandLogoByName.set(brandName.toLowerCase(), logoUrl);
  });

  for (const item of Array.isArray(catalogItems) ? catalogItems : []) {
    const key = toCatalogProductKey(item);
    if (!key || seenProducts.has(key)) continue;
    seenProducts.add(key);
    uniqueItems.push(item);
  }

  if (!uniqueItems.length) return {};

  const brandCounts = new Map();
  uniqueItems.forEach((item) => {
    const brand = normalizeText(item?.brand || item?.brand_name);
    if (!brand) return;
    const catalogLogo = brandLogoByName.get(brand.toLowerCase()) || "";
    const existing = brandCounts.get(brand) || {
      brand_name: brand,
      logo_url:
        catalogLogo || normalizeText(item?.brand_logo || item?.logo_url),
      product_count: 0,
    };
    if (!existing.logo_url && catalogLogo) existing.logo_url = catalogLogo;
    existing.product_count += 1;
    brandCounts.set(brand, existing);
  });

  const budgetSegments = TV_DISCOVERY_PRICE_BUCKETS.map((maxPrice) => {
    const productCount = uniqueItems.filter((item) => {
      const price = toCatalogPrice(item);
      return price > 0 && price <= maxPrice;
    }).length;
    return {
      label: `Under \u20B9${new Intl.NumberFormat("en-IN").format(maxPrice)}`,
      path: `/tvs?maxPrice=${maxPrice}`,
      product_count: productCount,
    };
  });

  const smartDiscoveries = [
    {
      label: "Latest Smart TVs in India",
      path: "/tvs/filter/new",
    },
    ...TV_FEATURE_CATALOG.filter((feature) =>
      uniqueItems.some((item) => matchesTvFeature(item, feature.id)),
    ).map((feature) => ({
      label: `Best ${feature.name} TVs`,
      path: `/tvs/features/${feature.id}`,
    })),
  ];

  const latestReleases = [...uniqueItems]
    .sort(
      (a, b) =>
        new Date(b?.launchDate || b?.launch_date || b?.created_at || 0) -
        new Date(a?.launchDate || a?.launch_date || a?.created_at || 0),
    )
    .slice(0, 5)
    .map((item) => ({
      ...item,
      brand_name: normalizeText(item?.brand || item?.brand_name),
      image_url: normalizeText(item?.image || item?.image_url),
      price: toCatalogPrice(item),
      launch_date: item?.launchDate || item?.launch_date || item?.created_at,
    }));

  return {
    latest_releases: latestReleases,
    budget_segments: budgetSegments,
    brand_hub: Array.from(brandCounts.values()).sort(
      (a, b) =>
        b.product_count - a.product_count ||
        a.brand_name.localeCompare(b.brand_name),
    ),
    smart_discoveries: smartDiscoveries,
  };
};

const buildLaptopCatalogSections = (catalogItems = [], brandCatalog = []) => {
  const uniqueItems = [];
  const seenProducts = new Set();
  const brandLogoByName = new Map();

  (Array.isArray(brandCatalog) ? brandCatalog : []).forEach((brand) => {
    const brandName = normalizeText(brand?.name || brand?.brand_name);
    const logoUrl = normalizeText(
      brand?.logo || brand?.image || brand?.logo_url || brand?.logoUrl,
    );
    if (!brandName || !logoUrl) return;
    brandLogoByName.set(brandName.toLowerCase(), logoUrl);
  });

  for (const item of Array.isArray(catalogItems) ? catalogItems : []) {
    const key = toCatalogProductKey(item);
    if (!key || seenProducts.has(key)) continue;
    seenProducts.add(key);
    uniqueItems.push(item);
  }

  if (!uniqueItems.length) return {};

  const brandCounts = new Map();
  uniqueItems.forEach((item) => {
    const brand = normalizeText(item?.brand || item?.brand_name);
    if (!brand) return;
    const catalogLogo = brandLogoByName.get(brand.toLowerCase()) || "";
    const existing = brandCounts.get(brand) || {
      brand_name: brand,
      logo_url:
        catalogLogo || normalizeText(item?.brand_logo || item?.logo_url),
      product_count: 0,
    };
    if (!existing.logo_url && catalogLogo) existing.logo_url = catalogLogo;
    existing.product_count += 1;
    brandCounts.set(brand, existing);
  });

  const budgetSegments = LAPTOP_DISCOVERY_PRICE_BUCKETS.map((maxPrice) => {
    const productCount = uniqueItems.filter((item) => {
      const price = toCatalogPrice(item);
      return price > 0 && price <= maxPrice;
    }).length;
    return {
      label: `Under \u20B9${new Intl.NumberFormat("en-IN").format(maxPrice)}`,
      path: buildLaptopListingPath({ budget: maxPrice }),
      product_count: productCount,
    };
  });

  const smartDiscoveries = [
    {
      label: "Latest Laptops in India",
      path: buildLaptopListingPath({ latest: true }),
    },
    ...LAPTOP_FEATURE_CATALOG.filter((feature) =>
      uniqueItems.some((item) => matchesLaptopFeature(item, feature.id)),
    ).map((feature) => ({
      label: `Best ${feature.name} Laptops`,
      path: buildLaptopListingPath({ feature: feature.id }),
    })),
  ];

  const latestReleases = [...uniqueItems]
    .sort((a, b) => new Date(b?.created_at || 0) - new Date(a?.created_at || 0))
    .slice(0, 5)
    .map((item) => ({
      ...item,
      brand_name: normalizeText(item?.brand || item?.brand_name),
      image_url: normalizeText(item?.image || item?.image_url),
      price: toCatalogPrice(item),
      created_at: item?.created_at,
    }));

  return {
    latest_releases: latestReleases,
    budget_segments: budgetSegments,
    brand_hub: Array.from(brandCounts.values()).sort(
      (a, b) =>
        b.product_count - a.product_count ||
        a.brand_name.localeCompare(b.brand_name),
    ),
    smart_discoveries: smartDiscoveries,
  };
};

const RowVisual = ({ src = "", label = "" }) => {
  const [failed, setFailed] = useState(false);
  const imageSrc = normalizeText(src);
  const initial = normalizeText(label).charAt(0).toUpperCase() || "?";

  if (imageSrc && !failed) {
    return (
      <img
        src={imageSrc}
        alt={label || "Item"}
        loading="lazy"
        className="h-9 w-9 shrink-0 rounded-xl border border-slate-200 bg-white object-contain p-1.5 sm:h-10 sm:w-10"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white text-xs font-semibold uppercase text-slate-500 sm:h-10 sm:w-10">
      {initial}
    </span>
  );
};

const BrandLogo = ({ src = "", label = "", flat = false }) => {
  const [failed, setFailed] = useState(false);
  const imageSrc = normalizeText(src);
  const initial = normalizeText(label).charAt(0).toUpperCase() || "?";

  return (
    <span
      className={`flex h-11 w-11 items-center justify-center rounded-xl sm:h-14 sm:w-14 ${
        flat
          ? "bg-slate-50   "
          : "bg-white     "
      }`}
    >
      {imageSrc && !failed ? (
        <img
          src={imageSrc}
          alt={label || "Brand"}
          loading="lazy"
          className="h-8 w-8 object-contain   sm:h-9 sm:w-9"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="text-sm font-semibold text-slate-500 ">
          {initial}
        </span>
      )}
    </span>
  );
};

const renderSectionTitle = (title = "", accentClass = "text-blue-600") => {
  const value = normalizeText(title).toLowerCase();
  if (value === "latest launches") {
    return (
      <>
        Latest <span className={accentClass}>Launches</span> in Market
      </>
    );
  }
  if (value === "by price") {
    return (
      <>
        Explore by <span className={accentClass}>Price</span> Range
      </>
    );
  }
  if (value === "smart popular links") {
    return (
      <>
        Smart <span className={accentClass}>Popular Links</span>
      </>
    );
  }

  const words = normalizeText(title).split(/\s+/).filter(Boolean);
  if (words.length < 2) return title;
  const highlight = words.pop();
  return (
    <>
      {words.join(" ")} <span className={accentClass}>{highlight}</span>
    </>
  );
};

const renderSectionSubtitle = (title = "", itemNounLower = "devices") => {
  const value = normalizeText(title).toLowerCase();
  if (value === "latest phones") {
    return "Freshly launched phones you can compare right now.";
  }
  if (value === "smart popular links") {
    return "Quick shortcuts users explore most on MobileX.";
  }
  if (value === "latest launches") {
    return `Freshly launched ${itemNounLower}s you can compare right now.`;
  }
  if (value === "by price") {
    return "Jump into budget-wise picks without extra filters.";
  }
  return "Curated links to help you discover faster.";
};

const getSectionMeta = (title = "") => {
  const value = normalizeText(title).toLowerCase();
  if (value === "latest phones") {
    return {
      badge: "Fresh Picks",
      accentClass: "text-sky-600",
      badgeClass:
        "border-sky-100 bg-sky-50 text-sky-700 group-hover:border-sky-200 group-hover:bg-sky-100 group-hover:text-sky-800",
    };
  }
  if (value === "smart popular links") {
    return {
      badge: "Quick Paths",
      accentClass: "text-blue-600",
      badgeClass:
        "border-blue-100 bg-blue-50 text-blue-700 group-hover:border-blue-200 group-hover:bg-blue-100 group-hover:text-blue-800",
    };
  }
  if (value === "latest launches") {
    return {
      badge: "Fresh Picks",
      accentClass: "text-sky-600",
      badgeClass:
        "border-sky-100 bg-sky-50 text-sky-700 group-hover:border-sky-200 group-hover:bg-sky-100 group-hover:text-sky-800",
    };
  }
  if (value === "by price") {
    return {
      badge: "Budget Guide",
      accentClass: "text-emerald-600",
      badgeClass:
        "border-emerald-100 bg-emerald-50 text-emerald-700 group-hover:border-emerald-200 group-hover:bg-emerald-100 group-hover:text-emerald-800",
    };
  }
  return {
    badge: "Discover",
    accentClass: "text-blue-600",
    badgeClass:
      "border-blue-100 bg-blue-50 text-blue-700 group-hover:border-blue-200 group-hover:bg-blue-100 group-hover:text-blue-800",
  };
};

const LinkListBlock = ({
  title = "",
  items = [],
  withVisual = false,
  entityType = "smartphones",
  itemNounLower = "device",
  surface = "card",
}) => {
  if (!Array.isArray(items) || items.length === 0) return null;
  const sectionMeta = getSectionMeta(title);
  const isPlainSurface = surface === "plain";

  return (
    <div
      className={
        isPlainSurface
          ? "overflow-hidden rounded-2xl border border-slate-200/80 bg-white  "
          : "overflow-hidden rounded-lg bg-white"
      }
    >
      {title ? (
        <div
          className={
            isPlainSurface
              ? "px-4 pt-4 sm:px-6"
              : "bg-white px-1 py-3 sm:px-5 sm:py-4"
          }
        >
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-[15px] font-semibold tracking-tight text-slate-900 sm:text-base">
                  {renderSectionTitle(title, sectionMeta.accentClass)}
                </h4>
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.28em] ${sectionMeta.badgeClass}`}
                >
                  {sectionMeta.badge}
                </span>
              </div>
              <p className="mt-1 text-[13px] leading-relaxed text-slate-500 sm:text-sm">
                {renderSectionSubtitle(title, itemNounLower)}
              </p>
            </div>
          </div>
          {isPlainSurface ? <DiscoveryHeaderDivider /> : null}
        </div>
      ) : null}

      <div
        className={
          isPlainSurface
            ? "p-0"
            : "border-t border-slate-100 bg-white p-3 sm:p-4"
        }
      >
        <div
          className={isPlainSurface ? "divide-y divide-[#e5eaf5]" : "space-y-2"}
        >
          {items.map((item, index) => {
            const subtitle = normalizeText(item?.subtitle);
            const meta = normalizeText(item?.meta);
            const badge = normalizeText(item?.badge);

            return (
              <Link
                key={`${item.path || item.label || "item"}-${index}`}
                to={normalizeDiscoveryPath(item.path || "", entityType)}
                aria-label={item.label || "Explore"}
                className={
                  isPlainSurface
                    ? "group flex items-center gap-3 px-4 py-3.5 text-sm text-slate-700 no-underline transition-colors duration-200 ease-out hover:bg-blue-50/60 hover:no-underline focus-visible:bg-blue-50/60 sm:px-6 sm:py-4"
                    : "group flex items-center gap-3 px-3 py-3 text-sm text-slate-700 no-underline transition-all duration-200 ease-out hover:-translate-y-px hover:border-blue-200 hover:bg-white hover:no-underline focus-visible:border-blue-200 focus-visible:bg-white sm:py-3.5"
                }
              >
                {withVisual ? null : null}

                <span className="flex min-w-0 flex-1 items-center gap-3">
                  {withVisual ? (
                    <RowVisual
                      src={
                        item.image_url ||
                        item.logo_url ||
                        item.image ||
                        item.logo ||
                        ""
                      }
                      label={item.label || "Explore"}
                    />
                  ) : null}

                  <span className="min-w-0 pr-2">
                    <span className="block truncate text-sm font-semibold text-slate-800 transition-colors duration-200 ease-out group-hover:text-blue-700">
                      {item.label || "Explore"}
                    </span>

                    {withVisual || subtitle || meta ? (
                      <span className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500 transition-colors duration-200 ease-out">
                        {subtitle ? (
                          <span className="truncate">{subtitle}</span>
                        ) : null}
                        {meta ? (
                          <>
                            {subtitle ? (
                              <span className="shrink-0 text-slate-300">
                                {"\u2022"}
                              </span>
                            ) : null}
                            <span className="truncate">{meta}</span>
                          </>
                        ) : null}
                      </span>
                    ) : null}
                  </span>
                </span>

                {badge ? (
                  <span
                    className={`ml-auto rounded-full border px-2.5 py-1 text-[10px] font-semibold transition-colors duration-200 ease-out ${sectionMeta.badgeClass}`}
                  >
                    {badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const DiscoveryHeaderDivider = () => (
  <div className="mt-4 h-px w-full bg-gradient-to-r from-[#6fa8ff] via-[#8e87ff] to-[#d2b6ff]" />
);

const DiscoveryCardHeader = ({ title = "" }) => (
  <div className="px-3.5 pt-3.5 sm:px-5 sm:pt-4">
    <div className="flex items-start gap-3">
      <h4 className="text-[15px] font-semibold tracking-tight text-slate-900 sm:text-base">
        {title}
      </h4>
    </div>
    <DiscoveryHeaderDivider />
  </div>
);

const toCompactPriceLabel = (label = "") => {
  const cleaned = fixCurrencyText(label)
    .replace(/^Best\s+\S+\s+/i, "")
    .replace(/^in\s+/i, "")
    .trim();
  return cleaned || fixCurrencyText(label) || "Explore";
};

const SmartphoneDiscoveryPanelHeader = ({
  icon: Icon,
  title,
  subtitle,
  tone = "blue",
}) => {
  const tones = {
    blue: {
      line: "bg-blue-600 ",
      icon: "bg-blue-50 text-blue-600  ",
    },
    green: {
      line: "bg-emerald-500 ",
      icon: "bg-emerald-50 text-emerald-600  ",
    },
    violet: {
      line: "bg-violet-600 ",
      icon: "bg-violet-50 text-violet-600  ",
    },
  };
  const palette = tones[tone] || tones.blue;

  return (
    <div className="relative flex min-h-[92px] items-start gap-3 border-b border-slate-200 px-4 py-4  sm:px-5">
      <span className={`absolute inset-y-0 left-0 w-1 ${palette.line}`} />
      <span
        className={`grid h-11 w-11 shrink-0 place-items-center rounded-md text-lg ${palette.icon}`}
        aria-hidden="true"
      >
        <Icon />
      </span>
      <span className="min-w-0 pt-0.5">
        <strong className="block text-base font-black tracking-tight text-slate-950  sm:text-lg">
          {title}
        </strong>
        <span className="mt-1 block text-xs leading-5 text-slate-500  sm:text-sm">
          {subtitle}
        </span>
      </span>
    </div>
  );
};

const SmartphoneDiscoveryPricePanel = ({ items = [], entityType }) => (
  <article className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-b from-white via-slate-50/80 to-blue-50/80    ">
    <SmartphoneDiscoveryPanelHeader
      icon={FaWallet}
      title="Discover by Price"
      subtitle="Find phones that fit your budget"
      tone="blue"
    />

    <div className="grid flex-1 grid-cols-2 gap-px bg-slate-200  sm:grid-cols-3 lg:grid-cols-1">
      {items.slice(0, 6).map((item, index) => (
        <Link
          key={`${item.path || item.label || "price"}-${index}`}
          to={normalizeDiscoveryPath(item.path || "", entityType)}
          className="group flex min-h-14 items-center gap-3 bg-white px-3 py-3 text-slate-800 no-underline transition-colors hover:bg-blue-50/70 hover:no-underline    sm:px-4 lg:min-h-[58px]"
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-blue-50 text-sm font-black text-blue-600  ">
            ₹
          </span>
          <span className="min-w-0 flex-1 truncate text-[11px] font-bold sm:text-xs lg:text-sm">
            {toCompactPriceLabel(item.label)}
          </span>
          <FaChevronRight className="hidden shrink-0 text-[10px] text-blue-500  sm:block" />
        </Link>
      ))}
    </div>

    <Link
      to="/compare"
      className="group flex min-h-12 items-center justify-center gap-2 border-t border-blue-100 bg-blue-50/70 px-4 text-xs font-extrabold text-blue-700 no-underline transition-colors hover:bg-blue-100 hover:no-underline     sm:text-sm"
    >
      <FaBalanceScale />
      Compare phones side by side
      <FaArrowRight className="text-[10px] transition-transform group-hover:translate-x-0.5" />
    </Link>
  </article>
);

const SmartphoneDiscoveryBrandPanel = ({ items = [], entityType }) => (
  <article className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-b from-white via-slate-50/80 to-blue-50/80    ">
    <SmartphoneDiscoveryPanelHeader
      icon={FaStar}
      title="Discover by Brand"
      subtitle="Explore phones by top brands"
      tone="green"
    />

    <div className="grid flex-1 grid-cols-3 gap-px bg-slate-200 p-px  sm:grid-cols-5 lg:grid-cols-3">
      {items.slice(0, 5).map((item, index) => {
        const rawBrandName = normalizeText(item?.name || item?.label);
        const brandName = rawBrandName.replace(/\s+Mobiles$/i, "");
        return (
          <Link
            key={`${item.path || brandName || "brand"}-${index}`}
            to={normalizeDiscoveryPath(item.path || "", entityType)}
            className="group flex min-h-[106px] min-w-0 flex-col items-center justify-center bg-white px-2 py-3 text-center no-underline transition-colors hover:bg-emerald-50/70 hover:no-underline   sm:min-h-[112px] lg:min-h-[142px]"
          >
            <BrandLogo
              src={item.logo_url || item.image_url || ""}
              label={brandName || "Brand"}
              flat
            />
            <span className="mt-2 w-full truncate text-[10px] font-bold text-slate-700 group-hover:text-emerald-700   sm:text-[11px] lg:text-xs">
              {brandName || "Brand"}
            </span>
          </Link>
        );
      })}

      <Link
        to="/smartphones"
        className="group flex min-h-[106px] min-w-0 flex-col items-center justify-center bg-white px-2 py-3 text-center no-underline transition-colors hover:bg-emerald-50/70 hover:no-underline   sm:min-h-[112px] lg:min-h-[142px]"
      >
        <span className="grid h-11 w-11 place-items-center rounded-md bg-emerald-50 text-emerald-600  ">
          <FaThLarge />
        </span>
        <span className="mt-2 text-[10px] font-bold text-slate-700 group-hover:text-emerald-700   sm:text-[11px] lg:text-xs">
          More Brands
        </span>
      </Link>
    </div>

    <Link
      to="/smartphones"
      className="group flex min-h-12 items-center justify-center gap-2 border-t border-emerald-100 bg-emerald-50/70 px-4 text-xs font-extrabold text-emerald-700 no-underline transition-colors hover:bg-emerald-100 hover:no-underline     sm:text-sm"
    >
      <FaThLarge />
      View all brands
      <FaArrowRight className="text-[10px] transition-transform group-hover:translate-x-0.5" />
    </Link>
  </article>
);

const SmartphoneDiscoverySearchPanel = ({ items = [], entityType }) => (
  <article className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-b from-white via-slate-50/80 to-blue-50/80    ">
    <SmartphoneDiscoveryPanelHeader
      icon={FaSearch}
      title="Popular Searches"
      subtitle="What people are searching for"
      tone="violet"
    />

    <div className="flex flex-1 flex-col divide-y divide-slate-200 ">
      {items.slice(0, 5).map((item, index) => (
        <Link
          key={`${item.path || item.label || "popular"}-${index}`}
          to={normalizeDiscoveryPath(item.path || "", entityType)}
          className="group flex min-h-[58px] items-center gap-3 px-3 py-3 text-slate-800 no-underline transition-colors hover:bg-violet-50/70 hover:no-underline   sm:px-4"
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-violet-50 text-[11px] text-violet-600  ">
            <FaFire />
          </span>
          <span className="min-w-0 flex-1 truncate text-xs font-bold sm:text-sm">
            {item.label || "Explore"}
          </span>
          <FaChevronRight className="shrink-0 text-[10px] text-violet-500 " />
        </Link>
      ))}
    </div>

    <Link
      to="/smartphones"
      className="group flex min-h-12 items-center justify-center gap-2 border-t border-violet-100 bg-violet-50/70 px-4 text-xs font-extrabold text-violet-700 no-underline transition-colors hover:bg-violet-100 hover:no-underline     sm:text-sm"
    >
      <FaFire />
      Explore all searches
      <FaArrowRight className="text-[10px] transition-transform group-hover:translate-x-0.5" />
    </Link>
  </article>
);

const SmartphoneDiscoveryHero = () => (
  <header className="relative overflow-hidden bg-gradient-to-r from-slate-50/80 via-white/80 to-blue-50/80 px-1 py-1    sm:px-0 sm:py-0">
    <div className="relative z-10 max-w-2xl pr-24 sm:pr-40 lg:pr-0">
      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-600 sm:text-xs">
        Explore smartphones
      </p>
      <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950  sm:text-3xl lg:text-4xl">
        Find your next smartphone
      </h2>
      <p className="mt-2 max-w-xl text-xs leading-5 text-slate-500  sm:text-sm lg:text-base">
        Browse by price, brand, or see what everyone is searching for.
      </p>
    </div>

    <div className="pointer-events-none absolute -right-2 bottom-0 top-0 hidden w-[330px] overflow-hidden sm:block lg:w-[380px]">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_0%,rgba(37,99,235,0.05)_45%,rgba(124,58,237,0.09)_100%)] " />
      <div className="absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-200/80 bg-blue-50/30 shadow-[0_0_30px_rgba(96,165,250,0.18)]  " />

      <div className="absolute left-[12%] top-[18%] h-[170px] w-[84px] -rotate-[14deg] rounded-[26px] bg-slate-950 p-1.5 shadow-[0_18px_30px_rgba(15,23,42,0.22)] sm:h-[188px] sm:w-[94px]">
        <div className="relative h-full w-full overflow-hidden rounded-[20px] bg-gradient-to-br from-slate-700 via-blue-700 to-indigo-700">
          <div className="absolute left-2.5 top-2.5 grid h-8 w-8 grid-cols-2 gap-1 rounded-xl bg-slate-950/70 p-1.5">
            <span className="rounded-full bg-blue-200" />
            <span className="rounded-full bg-slate-400" />
            <span className="rounded-full bg-indigo-300" />
            <span className="rounded-full bg-slate-700" />
          </div>
          <div className="absolute inset-x-3 bottom-3 h-1 rounded-full bg-white/40" />
        </div>
      </div>

      <div className="absolute left-[43%] top-[4%] h-[190px] w-[92px] rotate-[8deg] rounded-[28px] bg-slate-950 p-1.5 shadow-[0_25px_35px_rgba(37,99,235,0.18)] sm:h-[214px] sm:w-[104px]">
        <div className="relative h-full w-full overflow-hidden rounded-[22px] bg-gradient-to-br from-cyan-300 via-blue-500 to-indigo-700">
          <span className="absolute left-1/2 top-2.5 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-slate-950/80" />
          <span className="absolute -left-9 top-10 h-28 w-28 rounded-full border-[17px] border-white/20" />
          <span className="absolute -right-10 bottom-5 h-24 w-24 rounded-full border-[14px] border-cyan-100/25" />
          <span className="absolute bottom-5 left-1/2 h-2.5 w-10 -translate-x-1/2 rounded-full bg-white/30" />
        </div>
      </div>

      <div className="absolute right-[10%] top-[18%] h-[170px] w-[82px] rotate-[14deg] rounded-[26px] bg-slate-950 p-1.5 shadow-[0_18px_30px_rgba(20,184,166,0.22)] sm:h-[188px] sm:w-[94px]">
        <div className="relative h-full w-full overflow-hidden rounded-[20px] bg-gradient-to-br from-teal-200 via-emerald-300 to-cyan-500">
          <span className="absolute left-1/2 top-3 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-slate-950/80" />
          <span className="absolute bottom-5 left-1/2 h-6 w-10 -translate-x-1/2 rounded-full bg-white/25" />
        </div>
      </div>

      <div className="absolute left-2 top-4 grid h-10 w-10 place-items-center rounded-xl bg-white/80 text-[10px] font-black text-blue-600 ring-1 ring-blue-100 shadow-sm backdrop-blur-sm   ">
        AI
      </div>
      <div className="absolute bottom-7 left-5 grid h-10 w-10 place-items-center rounded-xl bg-white/80 text-[10px] font-black text-blue-600 ring-1 ring-blue-100 shadow-sm backdrop-blur-sm   ">
        5G
      </div>
      <div className="absolute right-5 top-9 grid h-10 w-10 place-items-center rounded-xl bg-white/80 text-[9px] font-black text-blue-600 ring-1 ring-blue-100 shadow-sm backdrop-blur-sm   ">
        CAM
      </div>
      <span className="absolute right-3 top-1/2 h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.9)]" />
      <span className="absolute bottom-9 left-[35%] h-2 w-2 rounded-full bg-indigo-400 shadow-[0_0_12px_rgba(129,140,248,0.9)]" />
    </div>
  </header>
);

const SmartphoneCompareBanner = () => {
  return (
    <aside className="relative mt-4 overflow-hidden rounded-[20px] border border-blue-200/80 bg-gradient-to-r from-[#edf5ff] via-[#f3f7ff] to-[#eff6ff] px-4 py-4 shadow-[inset_0_0_0_1px_rgba(147,197,253,0.1)]     sm:px-6 sm:py-5 lg:flex lg:min-h-[152px] lg:items-center lg:justify-between lg:gap-6 lg:px-8">
      <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-64 overflow-hidden sm:block lg:flex lg:items-center">
        <div className="relative h-28 w-56 lg:h-32 lg:w-64">
          <div className="absolute left-2 bottom-0 h-24 w-20 -rotate-12 rounded-[20px] bg-slate-950 p-1.5 shadow-[0_18px_25px_rgba(15,23,42,0.18)]">
            <div className="relative h-full w-full overflow-hidden rounded-[16px] bg-gradient-to-br from-slate-700 via-blue-700 to-indigo-700">
              <span className="absolute left-2 top-2 grid h-7 w-7 grid-cols-2 gap-1 rounded-lg bg-slate-950/70 p-1">
                <span className="rounded-full bg-blue-200" />
                <span className="rounded-full bg-slate-400" />
                <span className="rounded-full bg-indigo-300" />
                <span className="rounded-full bg-slate-700" />
              </span>
              <span className="absolute inset-x-3 bottom-3 h-1 rounded-full bg-white/40" />
            </div>
          </div>
          <div className="absolute left-14 bottom-1 h-28 w-20 rotate-2 rounded-[20px] bg-slate-950 p-1.5 shadow-[0_18px_25px_rgba(37,99,235,0.16)]">
            <div className="relative h-full w-full overflow-hidden rounded-[16px] bg-gradient-to-br from-cyan-300 via-blue-500 to-indigo-700">
              <span className="absolute left-1/2 top-2.5 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-slate-950/80" />
              <span className="absolute -left-8 top-10 h-20 w-20 rounded-full border-[12px] border-white/20" />
              <span className="absolute inset-x-3 bottom-3 h-2 rounded-full bg-white/35" />
            </div>
          </div>
          <div className="absolute left-24 bottom-0 h-24 w-20 rotate-12 rounded-[20px] bg-slate-950 p-1.5 shadow-[0_18px_25px_rgba(20,184,166,0.18)]">
            <div className="relative h-full w-full overflow-hidden rounded-[16px] bg-gradient-to-br from-teal-200 via-emerald-300 to-cyan-500">
              <span className="absolute left-1/2 top-2.5 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-slate-950/80" />
              <span className="absolute inset-x-3 bottom-3 h-2 rounded-full bg-white/35" />
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex-1 px-0 sm:pl-40 lg:pl-52">
        <p className="text-[9px] font-black uppercase tracking-[0.22em] text-blue-600 sm:text-[10px]">
          Smart comparison
        </p>
        <h3 className="mt-1 text-[22px] font-black tracking-[-0.04em] text-slate-950  sm:text-[28px] lg:text-[32px]">
          Compare phones side by side
        </h3>
        <p className="mt-1 max-w-xl text-xs leading-5 text-slate-500  sm:text-sm">
          Compare specs, cameras, battery, and features to find the right phone.
        </p>
      </div>

      <Link
        to="/compare"
        className="relative z-10 mt-4 inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-extrabold text-white no-underline shadow-[0_12px_20px_rgba(37,99,235,0.22)] transition-colors hover:bg-blue-700 hover:no-underline sm:ml-2 sm:mt-0 sm:w-auto lg:ml-0"
      >
        <span className="grid h-7 w-7 place-items-center rounded-full bg-white/15 text-base">
          <FaBalanceScale className="text-[14px]" />
        </span>
        Start Comparing
        <FaArrowRight className="text-[12px]" />
      </Link>
    </aside>
  );
};

const AdvancedSmartphoneDiscovery = ({
  priceItems = [],
  brandItems = [],
  popularItems = [],
  latestItems = [],
  entityType = "smartphones",
}) => (
  <div className="smartphones-discovery-section overflow-hidden bg-transparent px-0 py-5 text-slate-950  sm:px-0 sm:py-7">
    <SmartphoneDiscoveryHero latestItems={latestItems} />
    <div className="mt-5 grid grid-cols-1 gap-3 bg-transparent sm:gap-4 lg:grid-cols-3">
      <SmartphoneDiscoveryPricePanel
        items={priceItems}
        entityType={entityType}
      />
      <SmartphoneDiscoveryBrandPanel
        items={brandItems}
        entityType={entityType}
      />
      <SmartphoneDiscoverySearchPanel
        items={popularItems}
        entityType={entityType}
      />
    </div>
    <div className="mt-4 bg-transparent">
      <SmartphoneCompareBanner />
    </div>
  </div>
);

const PriceDiscoveryBlock = ({ items = [], entityType = "smartphones" }) => {
  if (!Array.isArray(items) || items.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white  ">
      <DiscoveryCardHeader title="Discover by Price" />
      <div className="grid grid-cols-2 gap-2 px-3.5 py-3.5 sm:flex sm:flex-wrap sm:px-5 sm:py-4">
        {items.slice(0, 8).map((item, index) => (
          <Link
            key={`${item.path || item.label || "price"}-${index}`}
            to={normalizeDiscoveryPath(item.path || "", entityType)}
            className="inline-flex min-h-9 items-center justify-center rounded-full bg-blue-50 px-3 py-2 text-center text-[11px] font-semibold leading-snug text-blue-700 no-underline transition-colors hover:bg-blue-100 hover:text-blue-800 hover:no-underline sm:min-h-0 sm:px-3.5 sm:text-xs"
          >
            {toCompactPriceLabel(item.label)}
          </Link>
        ))}
      </div>
    </div>
  );
};

const PopularSearchesBlock = ({ items = [], entityType = "smartphones" }) => {
  if (!Array.isArray(items) || items.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white  ">
      <DiscoveryCardHeader title="Popular Searches" />
      <div className="grid grid-cols-2 gap-2 px-3.5 py-3.5 sm:flex sm:flex-wrap sm:px-5 sm:py-4">
        {items.slice(0, 10).map((item, index) => (
          <Link
            key={`${item.path || item.label || "popular"}-${index}`}
            to={normalizeDiscoveryPath(item.path || "", entityType)}
            className="inline-flex min-h-9 items-center justify-center rounded-full bg-blue-50 px-3 py-2 text-center text-[11px] font-semibold leading-snug text-blue-700 no-underline transition-colors hover:bg-blue-100 hover:text-blue-800 hover:no-underline sm:min-h-0 sm:px-3.5 sm:text-xs"
          >
            {item.label || "Explore"}
          </Link>
        ))}
      </div>
    </div>
  );
};

const TopBrandsBlock = ({
  items = [],
  entityType = "smartphones",
  titleText = "Brand",
  subtitleText = "Explore products by key features",
  trimMobilesSuffix = true,
  surface = "card",
  headingPrefix = "Explore by",
}) => {
  if (!Array.isArray(items) || items.length === 0) return null;
  const sectionMeta = getSectionMeta("brand");
  const isPlainSurface = surface === "plain";
  const visibleItems = items.slice(0, 5);

  return (
    <div
      className={
        isPlainSurface
          ? "overflow-hidden rounded-2xl border border-slate-200/80 bg-white  "
          : "overflow-hidden rounded-xl border border-slate-200/80 bg-white   "
      }
    >
      <div
        className={
          isPlainSurface
            ? "px-3.5 pt-3.5 sm:px-6 sm:pt-4"
            : "px-1 pt-3.5 sm:px-5 sm:pt-4"
        }
      >
        <div className="flex items-start gap-3">
          <div className="flex items-start gap-3">
            <div className="min-w-0">
              <h4 className="text-[15px] font-semibold tracking-tight text-slate-900 sm:text-base">
                {headingPrefix}{" "}
                <span className={sectionMeta.accentClass}>{titleText}</span>
              </h4>
              <p className="mt-1 text-[13px] leading-relaxed text-slate-500 sm:text-sm">
                {subtitleText}
              </p>
            </div>
          </div>
        </div>
        <DiscoveryHeaderDivider />
      </div>

      <div>
        <div className="px-3.5 py-4 sm:px-6 sm:py-5">
          <div className="grid grid-cols-5 items-start gap-2 sm:flex sm:justify-start sm:gap-4">
            {visibleItems.map((item, index) => {
              const rawBrandName = normalizeText(item?.name || item?.label);
              const brandName = trimMobilesSuffix
                ? rawBrandName.replace(/\s+Mobiles$/i, "")
                : rawBrandName;

              return (
                <Link
                  key={`${item.path || brandName || "brand"}-${index}`}
                  to={normalizeDiscoveryPath(item.path || "", entityType)}
                  className="group flex min-w-0 flex-col items-center gap-2 rounded-2xl bg-transparent px-1 py-2.5 text-center transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-blue-50/40 sm:w-[96px] sm:shrink-0 sm:px-2.5 sm:py-3"
                >
                  <BrandLogo
                    src={item.logo_url || item.image_url || ""}
                    label={brandName || "Brand"}
                  />
                  <span className="w-full truncate text-[11px] font-semibold text-slate-700 transition-colors group-hover:text-blue-700">
                    {brandName || "Brand"}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

const SidebarTileVisual = ({ src = "", label = "" }) => {
  const [failed, setFailed] = useState(false);
  const imageSrc = normalizeText(src);
  const initial = normalizeText(label).charAt(0).toUpperCase() || "?";

  return (
    <div className="relative h-[5.5rem] w-24 shrink-0 overflow-hidden rounded-[22px] bg-gradient-to-br from-sky-100 via-blue-50 to-violet-100">
      <div className="absolute -left-6 top-1/2 h-24 w-24 -translate-y-1/2 rounded-full bg-white/40" />
      {imageSrc && !failed ? (
        <img
          src={imageSrc}
          alt={label || "Explore"}
          loading="lazy"
          className="relative z-10 h-full w-full object-contain p-2.5"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="relative z-10 flex h-full w-full items-center justify-center text-lg font-semibold text-slate-500">
          {initial}
        </span>
      )}
    </div>
  );
};

const BudgetSidebarBlock = ({ items = [], entityType = "smartphones" }) => {
  if (!Array.isArray(items) || items.length === 0) return null;

  return (
    <div className="w-full">
      <div className="px-3 pb-4 pt-1 text-center">
        <h3 className="text-[2rem] font-semibold leading-tight tracking-tight text-blue-600">
          Feeling these phones?{" "}
          <span className="italic text-blue-600">Check out more here</span>
        </h3>
      </div>

      <div className="space-y-3.5">
        {items.map((item, index) => (
          <Link
            key={`${item.path || item.label || "sidebar"}-${index}`}
            to={normalizeDiscoveryPath(item.path || "", entityType)}
            className="group flex items-center gap-4 rounded-[24px] border border-[#cfdcf6] bg-white/90 px-4 py-3 text-slate-800  transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 "
          >
            <SidebarTileVisual
              src={item.image_url || item.logo_url || ""}
              label={item.label || "Explore"}
            />
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-[1.02rem] font-semibold leading-snug text-slate-800 transition-colors duration-200 group-hover:text-blue-700">
                {item.label || "Explore"}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

const ProductDiscoverySections = ({
  productId,
  currentBrand = "",
  entityType = "smartphones",
  catalogItems = [],
  brandCatalog = [],
  layout = "full",
  variant = "default",
  className = "",
}) => {
  const discoveryEndpoint = useMemo(
    () => buildDiscoveryEndpoint(productId, entityType),
    [entityType, productId],
  );
  const [payload, setPayload] = useState(() =>
    discoveryEndpoint ? readPreloadedApiResponse(discoveryEndpoint) : null,
  );
  const [loading, setLoading] = useState(
    () =>
      Boolean(discoveryEndpoint) &&
      !readPreloadedApiResponse(discoveryEndpoint),
  );
  const [error, setError] = useState("");

  useEffect(() => {
    if (!discoveryEndpoint) {
      setPayload(null);
      setLoading(false);
      return;
    }

    if (!supportsDiscoveryApi(entityType)) {
      setLoading(false);
      setError("");
      setPayload(null);
      return;
    }

    const preloadedPayload = readPreloadedApiResponse(discoveryEndpoint);
    if (preloadedPayload) {
      setLoading(false);
      setError("");
      setPayload(preloadedPayload);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await fetchPublicJson(discoveryEndpoint, {
          signal: controller.signal,
        });
        if (!cancelled) setPayload(data);
      } catch (err) {
        if (err?.name === "AbortError") return;
        if (!cancelled) {
          setError("Unable to load discovery insights right now.");
          setPayload(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [discoveryEndpoint, entityType]);

  const entityConfig = useMemo(() => getEntityConfig(entityType), [entityType]);
  const catalogSections = useMemo(() => {
    if (entityConfig.type === "tvs") {
      return buildTvCatalogSections(catalogItems, brandCatalog);
    }
    if (entityConfig.type === "laptops") {
      return buildLaptopCatalogSections(catalogItems, brandCatalog);
    }
    return {};
  }, [brandCatalog, catalogItems, entityConfig.type]);
  const isLatestPhonesLayout = layout === "latestPhones";
  const isBudgetSidebarLayout =
    layout === "budgetSidebar" && entityConfig.type === "smartphones";
  const isSidebarVariant = variant === "sidebar";

  const { latestReleases, budgetSegments, brandHub, smartDiscoveries } =
    useMemo(() => {
      const sections = payload?.sections || catalogSections;
      return {
        latestReleases: Array.isArray(sections.latest_releases)
          ? sections.latest_releases
          : [],
        budgetSegments: Array.isArray(sections.budget_segments)
          ? sections.budget_segments
          : [],
        brandHub: Array.isArray(sections.brand_hub) ? sections.brand_hub : [],
        smartDiscoveries: Array.isArray(sections.smart_discoveries)
          ? sections.smart_discoveries
          : [],
      };
    }, [catalogSections, payload]);

  const brandName = normalizeText(payload?.brand_name || currentBrand);

  const popularLinks = useMemo(() => {
    const links = [];

    if (brandName) {
      const brandBrowsePath =
        entityConfig.type === "smartphones"
          ? buildSmartphoneBrandPath(brandName)
          : entityConfig.type === "laptops"
            ? buildLaptopListingPath({ brand: brandName })
            : `${entityConfig.basePath}?brand=${encodeURIComponent(brandName)}`;
      links.push({
        label: `All ${brandName} ${entityConfig.pluralTitle}`,
        path: normalizeDiscoveryPath(brandBrowsePath, entityConfig.type),
      });
      links.push({
        label: entityConfig.secondaryPopularLabel.replace("{brand}", brandName),
        path: normalizeDiscoveryPath(
          entityConfig.secondaryPopularPath(brandName),
          entityConfig.type,
        ),
      });
      links.push({
        label: `${brandName} ${entityConfig.pluralTitle} ${entityConfig.defaultPriceLabel}`,
        path: normalizeDiscoveryPath(
          entityConfig.brandBudgetPath?.(brandName) || brandBrowsePath,
          entityConfig.type,
        ),
      });
    }

    const seen = new Set(links.map((item) => `${item.label}|${item.path}`));
    for (const item of smartDiscoveries) {
      const label = fixCurrencyText(item?.label);
      const path = normalizeText(item?.path);
      if (!label || !path) continue;
      const key = `${label}|${path}`;
      if (seen.has(key)) continue;
      seen.add(key);
      links.push({
        label,
        path: normalizeDiscoveryPath(path, entityConfig.type),
      });
    }

    if (!links.some((item) => item.path === entityConfig.basePath)) {
      links.push({
        label: `All ${entityConfig.pluralTitle}`,
        path: entityConfig.basePath,
      });
    }

    return links.slice(0, 5);
  }, [brandName, smartDiscoveries, entityConfig]);

  const byPriceLinks = useMemo(() => {
    const links = budgetSegments.slice(0, 5).map((segment) => ({
      label: `Best ${entityConfig.pluralTitle} ${fixCurrencyText(segment?.label)}`,
      path: normalizeDiscoveryPath(
        segment?.path || entityConfig.basePath,
        entityConfig.type,
      ),
      badge: formatCountTag(
        segment?.product_count,
        entityConfig.pluralTitle.toLowerCase(),
      ),
    }));

    links.push({
      label: `Best ${entityConfig.pluralTitle} in Any Price Range`,
      path: entityConfig.basePath,
    });

    return links.slice(0, 6);
  }, [budgetSegments, entityConfig]);

  const latestLaunchLinks = useMemo(
    () =>
      latestReleases.slice(0, 5).map((item) => {
        const brand = normalizeText(item?.brand_name);
        const priceTag = formatPriceTag(item?.price);
        const isLaptopEntry = entityConfig.type === "laptops";
        const monthTag = formatMonthTag(
          isLaptopEntry ? item?.created_at : item?.launch_date,
        );

        return {
          label:
            normalizeText(item?.name) || `Latest ${entityConfig.singularTitle}`,
          path: normalizeDiscoveryPath(
            toProductPath(item, entityConfig.type),
            entityConfig.type,
          ),
          image_url: normalizeText(item?.image_url),
          subtitle: brand
            ? `${brand} ${entityConfig.itemNounLower}`
            : isLaptopEntry
              ? `Recently added ${entityConfig.itemNounLower}`
              : `Newly launched ${entityConfig.itemNounLower}`,
          meta:
            [priceTag, monthTag].filter(Boolean).join(" \u2022 ") ||
            (isLaptopEntry ? "Recently added" : "New launch"),
        };
      }),
    [latestReleases, entityConfig],
  );

  const topBrandLinks = useMemo(
    () =>
      brandHub
        .slice(0, 7)
        .map((item) => {
          const labelBrand = normalizeText(item?.brand_name);
          if (!labelBrand) return null;
          const brandPath =
            entityConfig.type === "smartphones"
              ? buildSmartphoneBrandPath(labelBrand)
              : entityConfig.type === "laptops"
                ? buildLaptopListingPath({ brand: labelBrand })
                : `${entityConfig.basePath}?brand=${encodeURIComponent(labelBrand)}`;
          return {
            name: labelBrand,
            label: `${labelBrand} ${entityConfig.brandSuffix}`,
            path: normalizeDiscoveryPath(brandPath, entityConfig.type),
            logo_url: normalizeText(item?.logo_url),
          };
        })
        .filter(Boolean),
    [brandHub, entityConfig],
  );

  const budgetSidebarLinks = useMemo(() => {
    const links = [];
    const seen = new Set();
    const latestImages = latestLaunchLinks
      .map((item) => normalizeText(item?.image_url))
      .filter(Boolean);

    const pushLink = (item, imageOverride = "", fallbackLabel = "") => {
      const label = fixCurrencyText(
        fallbackLabel ||
          item?.label ||
          item?.name ||
          item?.subtitle ||
          "Explore",
      );
      const path = normalizeText(item?.path);
      if (!label || !path) return;
      const key = `${label}|${path}`;
      if (seen.has(key)) return;
      seen.add(key);
      links.push({
        label,
        path,
        image_url:
          normalizeText(imageOverride) ||
          normalizeText(item?.image_url) ||
          normalizeText(item?.logo_url) ||
          "",
      });
    };

    popularLinks.slice(0, 2).forEach((item, index) => {
      pushLink(item, latestImages[index] || "");
    });

    topBrandLinks.slice(0, 2).forEach((item, index) => {
      pushLink(
        item,
        latestImages[index + 2] || item?.logo_url || "",
        item?.name ? `${item.name} Mobile Phones` : item?.label,
      );
    });

    if (!links.length) {
      latestLaunchLinks.slice(0, 4).forEach((item) => pushLink(item));
    }

    return links.slice(0, 4);
  }, [latestLaunchLinks, popularLinks, topBrandLinks]);

  const hasContent = isBudgetSidebarLayout
    ? budgetSidebarLinks.length > 0
    : isLatestPhonesLayout
      ? byPriceLinks.length > 0 ||
        topBrandLinks.length > 0 ||
        popularLinks.length > 0
      : popularLinks.length > 0 ||
        byPriceLinks.length > 0 ||
        latestLaunchLinks.length > 0 ||
        topBrandLinks.length > 0;

  if (loading && !hasContent) {
    return (
      <section className={`w-full overflow-hidden bg-transparent ${className}`}>
        <div
          className={
            isLatestPhonesLayout || isBudgetSidebarLayout
              ? "mx-auto max-w-7xl px-1 py-4 text-sm text-slate-600 sm:px-5 sm:py-5"
              : "mx-auto max-w-7xl rounded-[28px] border border-slate-200 bg-white px-1 py-4 text-sm text-slate-600 sm:px-5 sm:py-5"
          }
        >
          Loading discovery sections...
        </div>
      </section>
    );
  }

  if (!loading && !hasContent && !error) return null;

  return (
    <section
      className={`mx-auto w-full max-w-7xl      ${
        isLatestPhonesLayout
          ? "overflow-visible"
          : "overflow-hidden rounded-2xl border border-slate-200/80 bg-white  "
      } ${className}`}
    >
      <div className="mx-auto max-w-7xl ">
        {!isLatestPhonesLayout ? (
          <div className="px-1 pt-4 sm:px-5 sm:pt-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-blue-600">
                    Discovery Hub
                  </p>
                  <h3 className="mt-2 text-base font-semibold tracking-tight text-slate-900 sm:text-lg">
                    Popular Links
                  </h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-slate-500 sm:text-sm">
                    Continue exploring with curated shortcuts,{" "}
                    {entityConfig.type === "laptops"
                      ? "recently added models"
                      : "fresh launches"}
                    , and brand-led discovery paths.
                  </p>
                </div>
              </div>
            </div>
            <DiscoveryHeaderDivider />
          </div>
        ) : null}

        {error ? (
          <div className="mx-4 mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 sm:mx-5">
            {error}
          </div>
        ) : null}

        {isBudgetSidebarLayout ? (
          <div className="p-0">
            <BudgetSidebarBlock
              items={budgetSidebarLinks}
              entityType={entityConfig.type}
            />
          </div>
        ) : isLatestPhonesLayout ? (
          entityConfig.type === "smartphones" && !isSidebarVariant ? (
            <AdvancedSmartphoneDiscovery
              priceItems={byPriceLinks}
              brandItems={topBrandLinks}
              popularItems={popularLinks}
              latestItems={latestLaunchLinks}
              entityType={entityConfig.type}
            />
          ) : (
            <div
              className={
                isSidebarVariant
                  ? "grid grid-cols-1 gap-4 sm:gap-5"
                  : "grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2 xl:grid-cols-3"
              }
            >
              <div className="min-w-0">
                <PriceDiscoveryBlock
                  items={byPriceLinks}
                  entityType={entityConfig.type}
                />
              </div>
              <div className="min-w-0">
                <TopBrandsBlock
                  items={topBrandLinks}
                  entityType={entityConfig.type}
                  titleText="Brand"
                  subtitleText={`Explore ${entityConfig.pluralTitle} by key features`}
                  trimMobilesSuffix={entityConfig.type === "smartphones"}
                  surface="plain"
                  headingPrefix="Discover by"
                />
              </div>
              {popularLinks.length > 0 ? (
                <div
                  className={
                    isSidebarVariant
                      ? "min-w-0"
                      : "min-w-0 lg:col-span-2 xl:col-span-1"
                  }
                >
                  <PopularSearchesBlock
                    items={popularLinks}
                    entityType={entityConfig.type}
                  />
                </div>
              ) : null}
            </div>
          )
        ) : (
          <div className="grid grid-cols-1 gap-3 p-3 sm:gap-4 sm:p-5 md:grid-cols-2 md:gap-4">
            <div className="space-y-3 sm:space-y-4 md:pr-1">
              <LinkListBlock
                title={
                  entityConfig.type === "laptops"
                    ? "Laptop Popular Links"
                    : "Smart Popular Links"
                }
                items={popularLinks}
              />
            </div>

            <div className="space-y-3 sm:space-y-4">
              <LinkListBlock
                title="By Price"
                items={byPriceLinks}
                entityType={entityConfig.type}
                itemNounLower={entityConfig.itemNounLower}
              />
              <TopBrandsBlock
                items={topBrandLinks}
                entityType={entityConfig.type}
                titleText="Brand"
                subtitleText={`Explore ${entityConfig.pluralTitle} by key features`}
                trimMobilesSuffix={entityConfig.type === "smartphones"}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductDiscoverySections;
