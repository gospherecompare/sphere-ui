import React from "react";
import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import { normalizeSeoTitle } from "../utils/seoTitle";

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

  if (typeof window !== "undefined") {
    const origin = window.location?.origin || SITE_ORIGIN;
    const path = pathname || window.location?.pathname || "/";
    return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
  }

  return `${SITE_ORIGIN}${pathname || "/"}`;
};

const inferImageType = (url) => {
  const raw = String(url || "").toLowerCase();
  if (raw.endsWith(".png")) return "image/png";
  if (raw.endsWith(".webp")) return "image/webp";
  if (raw.endsWith(".avif")) return "image/avif";
  if (raw.endsWith(".gif")) return "image/gif";
  if (raw.endsWith(".svg")) return "image/svg+xml";
  return "image/jpeg";
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
  imageWidth = 1200,
  imageHeight = 630,
  imageAlt = "",
  imageType = null,
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
  const normalizedTitle = React.useMemo(
    () => normalizeSeoTitle(title),
    [title],
  );

  const imageInput = React.useMemo(() => {
    if (!image || typeof image !== "object" || Array.isArray(image)) return null;
    return image;
  }, [image]);

  const imageSource = imageInput
    ? imageInput.url || imageInput.src || imageInput.image || imageInput["@id"]
    : image;

  // Resolve absolute image URL
  const absoluteImage = React.useMemo(
    () => (imageSource ? toAbsoluteUrl(imageSource) : null),
    [imageSource],
  );

  const imageMeta = React.useMemo(() => {
    if (!absoluteImage) return null;

    const widthValue = Number(imageInput?.width ?? imageWidth);
    const heightValue = Number(imageInput?.height ?? imageHeight);
    const resolvedAlt = String(
      imageInput?.alt ||
        imageInput?.caption ||
        imageAlt ||
        normalizedTitle ||
        description ||
        "",
    )
      .replace(/\s+/g, " ")
      .trim();

    return {
      url: absoluteImage,
      width: Number.isFinite(widthValue) && widthValue > 0 ? widthValue : null,
      height: Number.isFinite(heightValue) && heightValue > 0 ? heightValue : null,
      alt: resolvedAlt,
      type: imageType || inferImageType(absoluteImage),
    };
  }, [
    absoluteImage,
    imageInput,
    imageWidth,
    imageHeight,
    imageAlt,
    imageType,
    normalizedTitle,
    description,
  ]);

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
      <title>{normalizedTitle}</title>
      {description && (
        <meta key="description" name="description" content={description} />
      )}
      {keywords ? <meta name="keywords" content={keywords} /> : null}
      <meta name="robots" content={robots} />
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1, viewport-fit=cover"
      />
      <meta charSet="UTF-8" />

      {/* ===== CANONICAL URL ===== */}
      <link key="canonical" rel="canonical" href={canonicalUrl} />

      {/* ===== OPEN GRAPH META TAGS ===== */}
      <meta key="og:title" property="og:title" content={normalizedTitle} />
      {description && (
        <meta
          key="og:description"
          property="og:description"
          content={description}
        />
      )}
      <meta property="og:type" content={ogType} />
      <meta key="og:url" property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content="Hooks" />
      {imageMeta && <meta property="og:image" content={imageMeta.url} />}
      {imageMeta && (
        <meta property="og:image:secure_url" content={imageMeta.url} />
      )}
      {imageMeta && <meta property="og:image:type" content={imageMeta.type} />}
      {imageMeta && imageMeta.width ? (
        <meta property="og:image:width" content={String(imageMeta.width)} />
      ) : null}
      {imageMeta && imageMeta.height ? (
        <meta property="og:image:height" content={String(imageMeta.height)} />
      ) : null}
      {imageMeta && imageMeta.alt ? (
        <meta property="og:image:alt" content={imageMeta.alt} />
      ) : null}

      {/* ===== TWITTER CARD META TAGS ===== */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@tryhooks" />
      {twitterCreator && (
        <meta name="twitter:creator" content={twitterCreator} />
      )}
      <meta key="twitter:title" name="twitter:title" content={normalizedTitle} />
      {description && (
        <meta
          key="twitter:description"
          name="twitter:description"
          content={description}
        />
      )}
      {imageMeta && <meta name="twitter:image" content={imageMeta.url} />}
      {imageMeta && imageMeta.alt ? (
        <meta name="twitter:image:alt" content={imageMeta.alt} />
      ) : null}

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
