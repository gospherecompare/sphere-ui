import React from "react";
import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";

const SITE_ORIGIN = "https://tryhook.shop";

/**
 * Dynamic SEO Component
 * Sets title, canonical URL, and structured data (schema.org) per route
 *
 * Usage:
 * <SEO
 *   title="Page Title"
 *   schema={{
 *     "@context": "https://schema.org",
 *     "@type": "ItemList",
 *     ...
 *   }}
 * />
 */
const SEO = ({ title, description, schema, robots = "index, follow" }) => {
  const { pathname } = useLocation();
  const canonicalUrl = `${SITE_ORIGIN}${pathname}`;

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
      {schema && (
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      )}
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
    url: url || SITE_ORIGIN,
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
    url: url || SITE_ORIGIN,
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
    url: url || SITE_ORIGIN,
    image: image || "",
  };
};

export default SEO;
