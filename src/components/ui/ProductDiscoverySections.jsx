import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FaChevronRight } from "react-icons/fa";

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL || "https://api.apisphere.in"
).replace(/\/$/, "");

const normalizeText = (value) => String(value || "").trim();

const normalizeEntityType = (value) => {
  const raw = normalizeText(value).toLowerCase();
  if (!raw) return "smartphones";
  if (raw.includes("tv")) return "tvs";
  if (raw.includes("laptop")) return "laptops";
  if (raw.includes("network")) return "networking";
  return "smartphones";
};

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
      secondaryPopularPath: (brand) => `/laptops?brand=${brand}&category=gaming`,
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
    secondaryPopularPath: (brand) => `/smartphones?brand=${brand}&network=5G`,
  };
};

const toProductPath = (item, entityType = "smartphones") => {
  const config = getEntityConfig(entityType);
  const slug = normalizeText(item?.slug);
  if (slug) return `${config.basePath}/${slug}`;
  const id = Number(item?.id);
  if (Number.isInteger(id) && id > 0) return `${config.basePath}?id=${id}`;
  return config.basePath;
};

const normalizeDiscoveryPath = (rawPath, entityType = "smartphones") => {
  const config = getEntityConfig(entityType);
  const pathValue = normalizeText(rawPath);
  if (!pathValue) return config.basePath;

  try {
    const url = new URL(pathValue, "https://hook.local");
    if (url.searchParams.get("sort") === "latest") {
      url.searchParams.set("sort", "newest");
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return pathValue.startsWith("/") ? pathValue : `/${pathValue}`;
  }
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
        className="h-8 w-8 shrink-0 rounded-sm bg-slate-100 object-contain p-0.5"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-slate-100 text-xs font-semibold uppercase text-slate-500">
      {initial}
    </span>
  );
};

const BrandLogo = ({ src = "", label = "" }) => {
  const [failed, setFailed] = useState(false);
  const imageSrc = normalizeText(src);
  const initial = normalizeText(label).charAt(0).toUpperCase() || "?";

  return (
    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
      {imageSrc && !failed ? (
        <img
          src={imageSrc}
          alt={label || "Brand"}
          loading="lazy"
          className="h-8 w-8 object-contain"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="text-sm font-semibold text-slate-500">{initial}</span>
      )}
    </span>
  );
};

const renderSectionTitle = (title = "") => {
  const value = normalizeText(title).toLowerCase();
  if (value === "latest launches") {
    return (
      <>
        Latest <span className="text-violet-600">Launches</span> in Market
      </>
    );
  }
  if (value === "by price") {
    return (
      <>
        Explore by <span className="text-violet-600">Price</span> Range
      </>
    );
  }
  if (value === "smart popular links") {
    return (
      <>
        Smart <span className="text-violet-600">Popular Links</span>
      </>
    );
  }

  const words = normalizeText(title).split(/\s+/).filter(Boolean);
  if (words.length < 2) return title;
  const highlight = words.pop();
  return (
    <>
      {words.join(" ")} <span className="text-violet-600">{highlight}</span>
    </>
  );
};

const renderSectionSubtitle = (title = "", itemNounLower = "devices") => {
  const value = normalizeText(title).toLowerCase();
  if (value === "smart popular links") {
    return "Quick shortcuts users explore most on Hooks.";
  }
  if (value === "latest launches") {
    return `Freshly launched ${itemNounLower}s you can compare right now.`;
  }
  if (value === "by price") {
    return "Jump into budget-wise picks without extra filters.";
  }
  return "Curated links to help you discover faster.";
};

const LinkListBlock = ({
  title = "",
  items = [],
  withVisual = false,
  entityType = "smartphones",
  itemNounLower = "device",
}) => {
  if (!Array.isArray(items) || items.length === 0) return null;

  return (
    <div className="overflow-hidden bg-white">
      {title ? (
        <div className="px-3 py-2.5">
          <h4 className="text-sm font-semibold text-slate-900">
            {renderSectionTitle(title)}
          </h4>
          <p className="mt-1 text-xs text-slate-500">
            {renderSectionSubtitle(title, itemNounLower)}
          </p>
        </div>
      ) : null}

      <div className="divide-y divide-slate-100 bg-white">
        {items.map((item, index) => {
          const subtitle = normalizeText(item?.subtitle);
          const meta = normalizeText(item?.meta);
          const badge = normalizeText(item?.badge);

          return (
            <Link
              key={`${item.path || item.label || "item"}-${index}`}
              to={normalizeDiscoveryPath(item.path || "", entityType)}
              aria-label={item.label || "Explore"}
              className="group flex items-center justify-between gap-3 px-3 py-2.5 text-sm text-slate-700 transition-all duration-200 ease-out hover:bg-slate-50/70 focus-visible:bg-slate-50/70"
            >
              <span className="flex min-w-0 items-center gap-2.5">
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
                  <span className="block truncate text-sm font-medium text-slate-800 transition-colors duration-200 ease-out">
                    {item.label || "Explore"}
                  </span>

                  {withVisual || subtitle || meta ? (
                    <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-500 transition-colors duration-200 ease-out">
                      {subtitle ? <span className="truncate">{subtitle}</span> : null}
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

              <span className="flex shrink-0 items-center gap-2">
                {badge ? (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 transition-colors duration-200 ease-out">
                    {badge}
                  </span>
                ) : null}
                <FaChevronRight className="text-[11px] text-violet-500 transition-all duration-200 ease-out group-hover:translate-x-0.5 group-hover:text-violet-700" />
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

const TopBrandsBlock = ({
  items = [],
  viewAllPath = "/smartphones",
  entityType = "smartphones",
  titleText = "Brand",
  subtitleText = "Explore products by key features",
  trimMobilesSuffix = true,
}) => {
  if (!Array.isArray(items) || items.length === 0) return null;

  return (
    <div className="overflow-hidden bg-white">
      <div className="flex items-start justify-between gap-2 bg-white px-3 py-2.5">
        <div>
          <h4 className="text-lg font-semibold text-slate-900">
            Explore by <span className="text-violet-600">{titleText}</span>
          </h4>
          <p className="mt-1 text-sm text-slate-600">
            {subtitleText}
          </p>
        </div>
        <Link
          to={normalizeDiscoveryPath(viewAllPath, entityType)}
          className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-violet-700 transition-colors duration-200 ease-out hover:text-violet-800"
        >
          View all
          <FaChevronRight className="text-[10px] text-violet-600" />
        </Link>
      </div>

      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-white to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-white to-transparent" />
        <div className="no-scrollbar overflow-x-auto px-3 py-3 scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex min-w-max items-start gap-5 pr-2">
            {items.map((item, index) => {
              const rawBrandName = normalizeText(item?.name || item?.label);
              const brandName = trimMobilesSuffix
                ? rawBrandName.replace(/\s+Mobiles$/i, "")
                : rawBrandName;

              return (
                <Link
                  key={`${item.path || brandName || "brand"}-${index}`}
                  to={normalizeDiscoveryPath(item.path || "", entityType)}
                  className="group flex w-[72px] shrink-0 flex-col items-center gap-2 text-center"
                >
                  <BrandLogo
                    src={item.logo_url || item.image_url || ""}
                    label={brandName || "Brand"}
                  />
                  <span className="w-full truncate text-[11px] font-medium text-slate-700 transition-colors group-hover:text-violet-700">
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

const ProductDiscoverySections = ({
  productId,
  currentBrand = "",
  entityType = "smartphones",
  className = "",
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [payload, setPayload] = useState(null);

  useEffect(() => {
    const pid = Number(productId);
    if (!Number.isInteger(pid) || pid <= 0) {
      setPayload(null);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const queryEntity = encodeURIComponent(
          normalizeEntityType(entityType),
        );
        const response = await fetch(
          `${API_BASE}/api/public/product/${encodeURIComponent(
            pid,
          )}/discovery?entity_type=${queryEntity}`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
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
  }, [productId, entityType]);

  const entityConfig = useMemo(
    () => getEntityConfig(entityType),
    [entityType],
  );

  const { newFromBrand, latestReleases, budgetSegments, brandHub, smartDiscoveries } =
    useMemo(() => {
      const sections = payload?.sections || {};
      return {
        newFromBrand: Array.isArray(sections.new_from_brand)
          ? sections.new_from_brand
          : [],
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
    }, [payload]);

  const brandName = normalizeText(payload?.brand_name || currentBrand);

  const popularLinks = useMemo(() => {
    const links = [];
    const encodedBrand = brandName ? encodeURIComponent(brandName) : "";

    if (brandName) {
      links.push({
        label: `All ${brandName} ${entityConfig.pluralTitle}`,
        path: normalizeDiscoveryPath(
          `${entityConfig.basePath}?brand=${encodedBrand}`,
          entityConfig.type,
        ),
      });
      links.push({
        label: entityConfig.secondaryPopularLabel.replace("{brand}", brandName),
        path: normalizeDiscoveryPath(
          entityConfig.secondaryPopularPath(encodedBrand),
          entityConfig.type,
        ),
      });
      links.push({
        label: `${brandName} ${entityConfig.pluralTitle} ${entityConfig.defaultPriceLabel}`,
        path: normalizeDiscoveryPath(
          `${entityConfig.basePath}?brand=${encodedBrand}`,
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
      links.push({ label, path: normalizeDiscoveryPath(path, entityConfig.type) });
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
    const links = budgetSegments.slice(0, 4).map((segment) => ({
      label: `Best ${entityConfig.pluralTitle} ${fixCurrencyText(segment?.label)}`,
      path: normalizeDiscoveryPath(
        segment?.path || entityConfig.basePath,
        entityConfig.type,
      ),
      badge: formatCountTag(segment?.product_count, entityConfig.pluralTitle.toLowerCase()),
    }));

    links.push({
      label: `Best ${entityConfig.pluralTitle} in Any Price Range`,
      path: entityConfig.basePath,
    });

    return links.slice(0, 5);
  }, [budgetSegments, entityConfig]);

  const latestLaunchLinks = useMemo(
    () =>
      latestReleases.slice(0, 5).map((item) => {
        const brand = normalizeText(item?.brand_name);
        const priceTag = formatPriceTag(item?.price);
        const monthTag = formatMonthTag(item?.launch_date);

        return {
          label: normalizeText(item?.name) || "Latest Phone",
          path: normalizeDiscoveryPath(
            toProductPath(item, entityConfig.type),
            entityConfig.type,
          ),
          image_url: normalizeText(item?.image_url),
          subtitle: brand
            ? `${brand} ${entityConfig.itemNounLower}`
            : `Newly launched ${entityConfig.itemNounLower}`,
          meta: [priceTag, monthTag].filter(Boolean).join(" \u2022 ") || "New launch",
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
          return {
            name: labelBrand,
            label: `${labelBrand} ${entityConfig.brandSuffix}`,
            path: normalizeDiscoveryPath(
              `${entityConfig.basePath}?brand=${encodeURIComponent(labelBrand)}`,
              entityConfig.type,
            ),
            logo_url: normalizeText(item?.logo_url),
          };
        })
        .filter(Boolean),
    [brandHub, entityConfig],
  );

  const hasContent =
    popularLinks.length > 0 ||
    byPriceLinks.length > 0 ||
    latestLaunchLinks.length > 0 ||
    topBrandLinks.length > 0 ||
    newFromBrand.length > 0;

  if (loading && !hasContent) {
    return (
      <div
        className={`w-full bg-white p-3 text-sm text-slate-600 sm:p-4 ${className}`}
      >
        Loading discovery sections...
      </div>
    );
  }

  if (!loading && !hasContent && !error) return null;

  return (
    <section className={`w-full overflow-hidden bg-white ${className}`}>
      <div className="flex items-center justify-between gap-2 px-3 py-2.5 sm:px-4">
        <h3 className="text-lg font-semibold text-slate-900">Popular Links</h3>
      </div>

      {error ? (
        <div className="mx-3 mt-3 border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 sm:mx-4">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 p-3 sm:p-4 md:grid-cols-2 md:gap-3">
        <div className="space-y-4 md:pr-3">
          <LinkListBlock title="Smart Popular Links" items={popularLinks} />
          <LinkListBlock
            title="Latest Launches"
            items={latestLaunchLinks}
            withVisual
            entityType={entityConfig.type}
            itemNounLower={entityConfig.itemNounLower}
          />
        </div>

        <div className="space-y-4">
          <LinkListBlock
            title="By Price"
            items={byPriceLinks}
            entityType={entityConfig.type}
            itemNounLower={entityConfig.itemNounLower}
          />
          <TopBrandsBlock
            items={topBrandLinks}
            viewAllPath={entityConfig.basePath}
            entityType={entityConfig.type}
            titleText="Brand"
            subtitleText={`Explore ${entityConfig.pluralTitle} by key features`}
            trimMobilesSuffix={entityConfig.type === "smartphones"}
          />
        </div>
      </div>
    </section>
  );
};

export default ProductDiscoverySections;
