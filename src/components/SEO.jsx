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
 * Handles all SEO meta tags, canonical URLs, Open Graph, and Twitter Cards
 * Features:
 * - Dynamic URL resolution with window.location.href fallback
 * - Complete Open Graph support (og:title, og:description, og:image, etc.)
 * - Twitter Card support
 * - Canonical URL handling
 * - Robots meta control
 *
 * @param {string} title - Page title (required)
 * @param {string} description - Meta description
 * @param {string} image - OG and Twitter image URL (absolute or relative)
 * @param {string} url - Canonical URL (if not provided, uses window.location.href)
 * @param {string} robots - robots meta directive (default: "index, follow")
 * @param {string} ogType - Open Graph type (default: "website")
 * @param {string} twitterCreator - Twitter creator handle (default: "@tryhooks")
 *
 * Example - Product Page:
 * <SEO
 *   title="iPhone 15 Pro - Price & Specs - Hooks"
 *   description="Compare iPhone 15 Pro pricing, full specs, and variants"
 *   image="https://cdn.example.com/iphone-15.jpg"
 *   url={canonicalUrl}
 * />
 */
const SEO = ({
  title,
  description = "",
  keywords = "",
  image = null,
  url = null,
  robots = "index, follow",
  ogType = "website",
  twitterCreator = "@tryhooks",
  schema = null,
  schemaType = null,
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

  const resolvedSchema = React.useMemo(() => {
    if (!schema) return null;
    const base =
      typeof schema === "function"
        ? schema({ canonicalUrl, pathname })
        : schema;
    if (!base) return null;

    const applyDefaults = (entry) => {
      if (!entry || typeof entry !== "object") return entry;
      const next = { ...entry };
      if (!next["@context"]) next["@context"] = "https://schema.org";
      if (schemaType) next["@type"] = schemaType;
      if (!next.url && canonicalUrl) next.url = canonicalUrl;
      return next;
    };

    return Array.isArray(base) ? base.map(applyDefaults) : applyDefaults(base);
  }, [schema, schemaType, canonicalUrl, pathname]);

  const schemaJson = React.useMemo(() => {
    if (!resolvedSchema) return null;
    return typeof resolvedSchema === "string"
      ? resolvedSchema
      : JSON.stringify(resolvedSchema);
  }, [resolvedSchema]);

  return (
    <Helmet prioritizeSeoTags>
      {/* ===== BASIC META TAGS ===== */}
      <title>{title}</title>
      {description && <meta name="description" content={description} />}
      {keywords ? <meta name="keywords" content={keywords} /> : null}
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

      {/* ===== STRUCTURED DATA ===== */}
      {schemaJson && <script type="application/ld+json">{schemaJson}</script>}

      {/* ===== CUSTOM CHILDREN ===== */}
      {children}
    </Helmet>
  );
};

export default SEO;
