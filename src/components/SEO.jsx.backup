import React from "react";
import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";

const SITE_ORIGIN = "https://tryhook.shop";

const toAbsoluteUrl = (value, fallbackPath = "/") => {
  const raw = String(value || "").trim();
  if (!raw) return `${SITE_ORIGIN}${fallbackPath}`;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("//")) return `https:${raw}`;
  if (raw.startsWith("/")) return `${SITE_ORIGIN}${raw}`;
  return `${SITE_ORIGIN}/${raw}`;
};

const resolveSchemaUrl = (url, fallbackPath = "/") => {
  if (url) return toAbsoluteUrl(url, fallbackPath);
  if (typeof window !== "undefined" && window.location?.href) {
    return window.location.href;
  }
  return `${SITE_ORIGIN}${fallbackPath}`;
};

/**
 * Dynamic SEO Component
 * Sets title, canonical URL, and structured data (schema.org) per route
 *
 * Usage:
 * <SEO
 *   title="Page Title"
 *   schemaType="ItemList"
 *   schema={({ canonicalUrl }) => ({
 *     "@context": "https://schema.org",
 *     name: "Latest Smartphones",
 *     url: canonicalUrl,
 *   })}
 * />
 */
const SEO = ({
  title,
  description,
  schema,
  schemaType,
  robots = "index, follow",
  canonicalPath,
  canonicalUrl: canonicalUrlProp,
  includeQuery = false,
}) => {
  const { pathname, search } = useLocation();
  const resolvedPath = canonicalPath || pathname || "/";
  const resolvedQuery = includeQuery ? search || "" : "";
  const canonicalUrl = toAbsoluteUrl(
    canonicalUrlProp || `${resolvedPath}${resolvedQuery}`,
    resolvedPath,
  );
  const resolvedSchema = React.useMemo(() => {
    if (!schema) return null;
    const base =
      typeof schema === "function"
        ? schema({ canonicalUrl, pathname: resolvedPath })
        : schema;
    if (!base) return null;

    const applyDefaults = (entry) => {
      if (!entry || typeof entry !== "object") return entry;
      const next = { ...entry };
      if (schemaType) next["@type"] = schemaType;
      if (!next.url) next.url = canonicalUrl;
      return next;
    };

    return Array.isArray(base) ? base.map(applyDefaults) : applyDefaults(base);
  }, [schema, schemaType, canonicalUrl, resolvedPath]);

  const schemaJson = React.useMemo(() => {
    if (!resolvedSchema) return null;
    return typeof resolvedSchema === "string"
      ? resolvedSchema
      : JSON.stringify(resolvedSchema);
  }, [resolvedSchema]);

  return (
    <Helmet prioritizeSeoTags>
      <title>{title}</title>
      {description && <meta name="description" content={description} />}
      <meta name="robots" content={robots} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph */}
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content="website" />
      {title && <meta property="og:title" content={title} />}
      {description && <meta property="og:description" content={description} />}

      {/* Structured Data */}
      {schemaJson && <script type="application/ld+json">{schemaJson}</script>}
    </Helmet>
  );
};

// ============================================================================
// SCHEMA GENERATORS
// ============================================================================

/**
 * For search/filter listing pages like /smartphones/filter/new
 */
export const createItemListSchema = ({
  name,
  url,
  itemCount = null,
  items = [],
} = {}) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: name || "Products",
    url: resolveSchemaUrl(url, "/"),
  };

  if (itemCount) schema.itemListElement = { itemCount };
  if (items.length > 0) {
    schema.itemListElement = items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: item.url || "",
      name: item.name || "",
      image: item.image || "",
    }));
  }

  return schema;
};

/**
 * For product detail pages like /smartphones/pixel-10-pro-price-in-india
 */
export const createProductSchema = ({
  name,
  description,
  image,
  price,
  priceCurrency = "INR",
  url,
  brand = "Various",
  rating = null,
  ratingCount = null,
  availability = "InStock",
} = {}) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: name || "",
    description: description || "",
    image: image || [],
    brand: {
      "@type": "Brand",
      name: brand,
    },
    url: resolveSchemaUrl(url, "/"),
  };

  if (price) {
    schema.offers = {
      "@type": "Offer",
      price: price,
      priceCurrency: priceCurrency,
      availability: `https://schema.org/${availability}`,
    };
  }

  if (rating && ratingCount) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: rating,
      ratingCount: ratingCount,
    };
  }

  return schema;
};

/**
 * For breadcrumb navigation
 */
export const createBreadcrumbSchema = (breadcrumbs = []) => {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label || "",
      item: `${SITE_ORIGIN}${item.url || ""}`,
    })),
  };
};

/**
 * For category pages
 */
export const createCollectionSchema = ({
  name,
  description,
  url,
  image,
} = {}) => {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: name || "",
    description: description || "",
    url: resolveSchemaUrl(url, "/"),
    image: image || "",
  };
};

export default SEO;
