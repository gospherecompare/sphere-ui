import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FaBolt, FaChevronRight, FaFire, FaStore, FaTag } from "react-icons/fa";
import {
  buildSmartphoneBrandPath,
  buildSmartphoneListingPath,
} from "../../utils/smartphoneListingRoutes";

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

const supportsDiscoveryApi = (entityType) =>
  normalizeEntityType(entityType) === "smartphones";

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
        `/laptops?brand=${brand}&category=gaming`,
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

const BrandLogo = ({ src = "", label = "" }) => {
  const [failed, setFailed] = useState(false);
  const imageSrc = normalizeText(src);
  const initial = normalizeText(label).charAt(0).toUpperCase() || "?";

  return (
    <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white sm:h-14 sm:w-14">
      {imageSrc && !failed ? (
        <img
          src={imageSrc}
          alt={label || "Brand"}
          loading="lazy"
          className="h-9 w-9 object-contain"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="text-sm font-semibold text-slate-500">{initial}</span>
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

const getSectionMeta = (title = "") => {
  const value = normalizeText(title).toLowerCase();
  if (value === "latest phones") {
    return {
      icon: FaFire,
      badge: "Fresh Picks",
      iconTone: "text-sky-600",
      iconBg: "from-sky-50 to-blue-50",
      accentClass: "text-sky-600",
      badgeClass:
        "border-sky-100 bg-sky-50 text-sky-700 group-hover:border-sky-200 group-hover:bg-sky-100 group-hover:text-sky-800",
    };
  }
  if (value === "smart popular links") {
    return {
      icon: FaBolt,
      badge: "Quick Paths",
      iconTone: "text-blue-600",
      iconBg: "from-blue-50 to-cyan-50",
      accentClass: "text-blue-600",
      badgeClass:
        "border-blue-100 bg-blue-50 text-blue-700 group-hover:border-blue-200 group-hover:bg-blue-100 group-hover:text-blue-800",
    };
  }
  if (value === "latest launches") {
    return {
      icon: FaFire,
      badge: "Fresh Picks",
      iconTone: "text-sky-600",
      iconBg: "from-sky-50 to-blue-50",
      accentClass: "text-sky-600",
      badgeClass:
        "border-sky-100 bg-sky-50 text-sky-700 group-hover:border-sky-200 group-hover:bg-sky-100 group-hover:text-sky-800",
    };
  }
  if (value === "by price") {
    return {
      icon: FaTag,
      badge: "Budget Guide",
      iconTone: "text-emerald-600",
      iconBg: "from-emerald-50 to-cyan-50",
      accentClass: "text-emerald-600",
      badgeClass:
        "border-emerald-100 bg-emerald-50 text-emerald-700 group-hover:border-emerald-200 group-hover:bg-emerald-100 group-hover:text-emerald-800",
    };
  }
  return {
    icon: FaStore,
    badge: "Discover",
    iconTone: "text-blue-600",
    iconBg: "from-blue-50 to-slate-50",
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
  const SectionIcon = sectionMeta.icon;
  const isPlainSurface = surface === "plain";

  return (
    <div
      className={
        isPlainSurface
          ? "overflow-hidden rounded-2xl"
          : "overflow-hidden rounded-lg border border-slate-200 bg-white"
      }
    >
      {title ? (
        <div
          className={
            isPlainSurface
              ? "px-4 py-3 sm:px-5 sm:py-4"
              : "bg-slate-50/60 px-4 py-3 sm:px-5 sm:py-4"
          }
        >
          <div className="flex items-start gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl  ring-1 ring-slate-200/80`}
            >
              <SectionIcon className={`text-base ${sectionMeta.iconTone}`} />
            </div>
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
        </div>
      ) : null}

      <div
        className={
          isPlainSurface
            ? "p-0"
            : "border-t border-slate-100 bg-slate-50 p-3 sm:p-4"
        }
      >
        <div className="space-y-2">
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
                    ? "group flex items-center gap-3 px-3 py-3 text-sm text-slate-700 no-underline transition-all duration-200 ease-out hover:-translate-y-px hover:bg-white hover:no-underline focus-visible:bg-white sm:py-3.5"
                    : "group flex items-center gap-3 px-3 py-3 text-sm text-slate-700 no-underline transition-all duration-200 ease-out hover:-translate-y-px hover:border-blue-200 hover:bg-white hover:no-underline focus-visible:border-blue-200 focus-visible:bg-white sm:py-3.5"
                }
              >
                {withVisual ? null : (
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition-all duration-200 group-hover:bg-blue-100">
                    <FaChevronRight className="text-[11px] transition-all duration-200 ease-out group-hover:translate-x-0.5" />
                  </span>
                )}

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
                ) : (
                  <span className="ml-auto text-slate-300 transition-colors duration-200 group-hover:text-blue-500">
                    <FaChevronRight className="text-[11px]" />
                  </span>
                )}
              </Link>
            );
          })}
        </div>
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
  surface = "card",
}) => {
  if (!Array.isArray(items) || items.length === 0) return null;
  const sectionMeta = getSectionMeta("brand");
  const SectionIcon = sectionMeta.icon;
  const isPlainSurface = surface === "plain";

  return (
    <div
      className={
        isPlainSurface
          ? "overflow-hidden rounded-2xl"
          : "overflow-hidden rounded-lg border border-slate-200"
      }
    >
      <div
        className={
          isPlainSurface
            ? "flex items-start justify-between gap-3 px-4 py-3.5 sm:px-5 sm:py-4"
            : "flex items-start justify-between gap-3 border-b border-slate-200/80 bg-slate-50/60 px-4 py-3.5 sm:px-5 sm:py-4"
        }
      >
        <div className="flex items-start gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${sectionMeta.iconBg} ring-1 ring-slate-200/80`}
          >
            <SectionIcon className={`text-base ${sectionMeta.iconTone}`} />
          </div>
          <div className="min-w-0">
            <h4 className="text-[15px] font-semibold tracking-tight text-slate-900 sm:text-base">
              Explore by{" "}
              <span className={sectionMeta.accentClass}>{titleText}</span>
            </h4>
            <p className="mt-1 text-[13px] leading-relaxed text-slate-500 sm:text-sm">
              {subtitleText}
            </p>
          </div>
        </div>
        <Link
          to={normalizeDiscoveryPath(viewAllPath, entityType)}
          className="inline-flex shrink-0 items-center gap-1 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-[11px] font-semibold text-blue-700 transition-colors duration-200 ease-out hover:border-blue-200 hover:bg-blue-100 hover:text-blue-800"
        >
          View all
          <FaChevronRight className="text-[10px]" />
        </Link>
      </div>

      <div>
        <div className="no-scrollbar overflow-x-auto px-4 py-4 scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:px-5">
          <div className="flex min-w-max items-start gap-4 pr-2">
            {items.map((item, index) => {
              const rawBrandName = normalizeText(item?.name || item?.label);
              const brandName = trimMobilesSuffix
                ? rawBrandName.replace(/\s+Mobiles$/i, "")
                : rawBrandName;

              return (
                <Link
                  key={`${item.path || brandName || "brand"}-${index}`}
                  to={normalizeDiscoveryPath(item.path || "", entityType)}
                  className="group flex w-[88px] shrink-0 flex-col items-center gap-2 rounded-2xl px-2.5 py-3 text-center transition-all duration-200 ease-out"
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

const ProductDiscoverySections = ({
  productId,
  currentBrand = "",
  entityType = "smartphones",
  layout = "full",
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

    if (!supportsDiscoveryApi(entityType)) {
      setLoading(false);
      setError("");
      setPayload(null);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const queryEntity = encodeURIComponent(normalizeEntityType(entityType));
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

  const entityConfig = useMemo(() => getEntityConfig(entityType), [entityType]);
  const isLatestPhonesLayout =
    layout === "latestPhones" && entityConfig.type === "smartphones";
  const HeaderIcon = isLatestPhonesLayout ? FaFire : FaStore;

  const { latestReleases, budgetSegments, brandHub, smartDiscoveries } =
    useMemo(() => {
      const sections = payload?.sections || {};
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
    }, [payload]);

  const brandName = normalizeText(payload?.brand_name || currentBrand);

  const popularLinks = useMemo(() => {
    const links = [];

    if (brandName) {
      const brandBrowsePath =
        entityConfig.type === "smartphones"
          ? buildSmartphoneBrandPath(brandName)
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
        path: normalizeDiscoveryPath(brandBrowsePath, entityConfig.type),
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
    const links = budgetSegments.slice(0, 4).map((segment) => ({
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
          meta:
            [priceTag, monthTag].filter(Boolean).join(" \u2022 ") ||
            "New launch",
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

  const hasContent = isLatestPhonesLayout
    ? byPriceLinks.length > 0 || topBrandLinks.length > 0
    : popularLinks.length > 0 ||
      byPriceLinks.length > 0 ||
      latestLaunchLinks.length > 0 ||
      topBrandLinks.length > 0;

  if (loading && !hasContent) {
    return (
      <section className={`w-full overflow-hidden bg-transparent ${className}`}>
        <div
          className={
            isLatestPhonesLayout
              ? "mx-auto max-w-7xl px-4 py-4 text-sm text-slate-600 sm:px-5 sm:py-5"
              : "mx-auto max-w-7xl rounded-[28px] border border-slate-200 bg-white px-4 py-4 text-sm text-slate-600 sm:px-5 sm:py-5"
          }
        >
          Loading discovery sections...
        </div>
      </section>
    );
  }

  if (!loading && !hasContent && !error) return null;

  return (
    <section className={`w-full overflow-hidden  ${className}`}>
      <div className="mx-auto max-w-7xl rounded-[28px] ">
        {!isLatestPhonesLayout ? (
          <div className="flex items-start justify-between gap-3 border-b border-slate-200/80 px-4 py-4 sm:px-5 sm:py-5">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 ring-1 ring-slate-200/80">
                <HeaderIcon className="text-base text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-blue-600">
                  Discovery Hub
                </p>
                <h3 className="mt-2 text-base font-semibold tracking-tight text-slate-900 sm:text-lg">
                  Popular Links
                </h3>
                <p className="mt-1 text-[13px] leading-relaxed text-slate-500 sm:text-sm">
                  Continue exploring with curated shortcuts, fresh launches, and
                  brand-led discovery paths.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="mx-4 mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 sm:mx-5">
            {error}
          </div>
        ) : null}

        {isLatestPhonesLayout ? (
          <div className="space-y-3 p-3 sm:space-y-4 sm:p-5">
            <LinkListBlock
              title="By Price"
              items={byPriceLinks}
              entityType={entityConfig.type}
              itemNounLower={entityConfig.itemNounLower}
              surface="plain"
            />
            <TopBrandsBlock
              items={topBrandLinks}
              viewAllPath={entityConfig.basePath}
              entityType={entityConfig.type}
              titleText="Brand"
              subtitleText={`Explore ${entityConfig.pluralTitle} by key features`}
              trimMobilesSuffix={entityConfig.type === "smartphones"}
              surface="plain"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 p-3 sm:gap-4 sm:p-5 md:grid-cols-2 md:gap-4">
            <div className="space-y-3 sm:space-y-4 md:pr-1">
              <LinkListBlock title="Smart Popular Links" items={popularLinks} />
              <LinkListBlock
                title="Latest Launches"
                items={latestLaunchLinks}
                withVisual
                entityType={entityConfig.type}
                itemNounLower={entityConfig.itemNounLower}
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
                viewAllPath={entityConfig.basePath}
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
