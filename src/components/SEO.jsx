import React from "react";
import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";

const SITE_ORIGIN = "https://tryhook.shop";

/**
 * Convert relative/absolute URLs to full absolute URLs
 * Ensures all URLs are complete with origin
 */
const toAbsoluteUrl = (value, fallbackPath = "/") => {
  if (!value) return `${SITE_ORIGIN}${fallbackPath}`;

  const raw = String(value).trim();
  if (!raw) return `${SITE_ORIGIN}${fallbackPath}`;

  // Already absolute
  if (/^https?:\/\//i.test(raw)) return raw;

  // Protocol-relative
  if (raw.startsWith("//")) return `https:${raw}`;

  // Path-relative
  if (raw.startsWith("/")) return `${SITE_ORIGIN}${raw}`;

  // Relative path
  return `${SITE_ORIGIN}/${raw}`;
};

/**
 * Get the canonical URL for the current page
 * Falls back to window.location.href if available
 */
const getCanonicalUrl = (customUrl, pathname) => {
  if (customUrl) return toAbsoluteUrl(customUrl);

  if (typeof window !== "undefined" && window.location?.href) {
    return window.location.href;
  }

  return `${SITE_ORIGIN}${pathname || "/"}`;
};

/**
 * Production-Ready SEO Component
 * Handles all SEO meta tags, canonical URLs, Open Graph, Twitter Cards, and Structured Data
 * Features:
 * - Dynamic URL resolution with window.location.href fallback
 * - Complete Open Graph support (og:title, og:description, og:image, etc.)
 * - Twitter Card support
 * - Structured Data (Schema.org) with automatic URL injection
 * - Canonical URL handling
 * - Robots meta control
 *
 * @param {string} title - Page title (required)
 * @param {string} description - Meta description
 * @param {string} image - OG and Twitter image URL (absolute or relative)
 * @param {string} url - Canonical URL (if not provided, uses window.location.href)
 * @param {string} robots - robots meta directive (default: "index, follow")
 * @param {object|function} schema - Schema.org structured data
 * @param {string} ogType - Open Graph type (default: "website")
 * @param {string} twitterCreator - Twitter creator handle (default: "@tryhooks")
 *
 * Example - Product Page:
 * <SEO
 *   title="iPhone 15 Pro - Price & Specs | Hooks"
 *   description="Compare iPhone 15 Pro pricing, full specs, and variants"
 *   image="https://cdn.example.com/iphone-15.jpg"
 *   url={canonicalUrl}
 *   schema={{
 *     "@context": "https://schema.org",
 *     "@type": "Product",
 *     name: "iPhone 15 Pro",
 *     description: "Apple iPhone 15 Pro with 48MP camera",
 *     image: imageUrl,
 *     brand: { "@type": "Brand", name: "Apple" },
 *     offers: {
 *       "@type": "Offer",
 *       priceCurrency: "INR",
 *       price: "99999",
 *       availability: "https://schema.org/InStock"
 *     }
 *   }}
 * />
 */
const SEO = ({
  title,
  description = "",
  image = null,
  url = null,
  robots = "index, follow",
  schema = null,
  ogType = "website",
  twitterCreator = "@tryhooks",
  children = null,
}) => {
  const { pathname } = useLocation();

  // Resolve canonical URL - critical for dynamic pages!
  // Falls back to current window.location.href if url not provided
  const canonicalUrl = React.useMemo(
    () => getCanonicalUrl(url, pathname),
    [url, pathname],
  );

  // Resolve absolute image URL
  const absoluteImage = React.useMemo(
    () => (image ? toAbsoluteUrl(image) : null),
    [image],
  );

  // Process and stringify schema with dynamic URL injection
  const schemaJson = React.useMemo(() => {
    if (!schema) return null;

    try {
      let processedSchema = schema;

      // If schema is a function, call it with context
      if (typeof schema === "function") {
        processedSchema = schema({ canonicalUrl, pathname });
        if (!processedSchema) return null;
      }

      // If array of schemas, process each one
      if (Array.isArray(processedSchema)) {
        processedSchema = processedSchema.map((s) => {
          if (!s.url) {
            return { ...s, url: canonicalUrl };
          }
          return s;
        });
      } else if (processedSchema && typeof processedSchema === "object") {
        // Single schema object
        if (!processedSchema.url) {
          processedSchema = { ...processedSchema, url: canonicalUrl };
        }
      }

      return JSON.stringify(processedSchema);
    } catch (error) {
      console.error("SEO Component: Error processing schema", error);
      return null;
    }
  }, [schema, canonicalUrl, pathname]);

  return (
    <Helmet prioritizeSeoTags>
      {/* ===== BASIC META TAGS ===== */}
      <title>{title}</title>
      {description && <meta name="description" content={description} />}
      <meta name="robots" content={robots} />
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1, viewport-fit=cover"
      />
      <meta charSet="UTF-8" />

      {/* ===== CANONICAL URL ===== */}
      <link rel="canonical" href={canonicalUrl} />

      {/* ===== OPEN GRAPH META TAGS ===== */}
      <meta property="og:title" content={title} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content="Hooks" />
      {absoluteImage && <meta property="og:image" content={absoluteImage} />}
      {absoluteImage && (
        <meta property="og:image:secure_url" content={absoluteImage} />
      )}
      {absoluteImage && <meta property="og:image:type" content="image/jpeg" />}
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />

      {/* ===== TWITTER CARD META TAGS ===== */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@tryhooks" />
      {twitterCreator && (
        <meta name="twitter:creator" content={twitterCreator} />
      )}
      <meta name="twitter:title" content={title} />
      {description && <meta name="twitter:description" content={description} />}
      {absoluteImage && <meta name="twitter:image" content={absoluteImage} />}

      {/* ===== ADDITIONAL OPTIMIZATION ===== */}
      <meta name="theme-color" content="#ffffff" />
      <meta name="color-scheme" content="light dark" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta
        name="apple-mobile-web-app-status-bar-style"
        content="black-translucent"
      />
      <meta name="apple-mobile-web-app-title" content="Hooks" />
      <meta name="format-detection" content="telephone=no" />

      {/* ===== STRUCTURED DATA (SCHEMA.ORG) ===== */}
      {schemaJson && <script type="application/ld+json">{schemaJson}</script>}

      {/* ===== CUSTOM CHILDREN ===== */}
      {children}
    </Helmet>
  );
};

export default SEO;
