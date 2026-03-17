/**
 * Schema.org generators for SEO
 * Creates structured data objects for different content types
 */

const SITE_ORIGIN = "https://tryhook.shop";

/**
 * Convert relative/absolute URLs to full absolute URLs
 */
const toAbsoluteUrl = (value, fallbackPath = "/") => {
  if (!value) return `${SITE_ORIGIN}${fallbackPath}`;

  const raw = String(value).trim();
  if (!raw) return `${SITE_ORIGIN}${fallbackPath}`;

  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("//")) return `https:${raw}`;
  if (raw.startsWith("/")) return `${SITE_ORIGIN}${raw}`;

  return `${SITE_ORIGIN}/${raw}`;
};

/**
 * Generate Product schema for product detail pages
 * Always pass the dynamic URL!
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
  sku = null,
  mpn = null,
} = {}) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: name || "",
    description: description || "",
    url: url || SITE_ORIGIN,
  };

  if (image) {
    schema.image = Array.isArray(image) ? image : [image];
  }

  if (brand) {
    schema.brand = {
      "@type": "Brand",
      name: brand,
    };
  }

  if (price) {
    schema.offers = {
      "@type": "Offer",
      price: String(price),
      priceCurrency: priceCurrency,
      availability: `https://schema.org/${availability}`,
      url: url || SITE_ORIGIN,
    };
  }

  if (sku) schema.sku = String(sku);
  if (mpn) schema.mpn = String(mpn);

  if (rating && ratingCount) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: String(rating),
      ratingCount: String(ratingCount),
    };
  }

  return schema;
};

/**
 * Generate ItemList schema for category/filter pages
 */
export const createItemListSchema = ({
  name,
  url,
  items = [],
  description = null,
} = {}) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: name || "Products",
    url: url || SITE_ORIGIN,
  };

  if (description) {
    schema.description = description;
  }

  if (items.length > 0) {
    schema.itemListElement = items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name || "",
      url: item.url ? toAbsoluteUrl(item.url) : "",
      image: item.image ? toAbsoluteUrl(item.image) : "",
    }));
  }

  return schema;
};

/**
 * Generate BreadcrumbList schema for navigation
 */
export const createBreadcrumbSchema = (breadcrumbs = []) => {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label || "",
      item: item.url ? toAbsoluteUrl(item.url) : SITE_ORIGIN,
    })),
  };
};

/**
 * Generate CollectionPage schema for category pages
 */
export const createCollectionSchema = ({
  name,
  description,
  url,
  image = null,
} = {}) => {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: name || "",
    description: description || "",
    url: url || SITE_ORIGIN,
    image: image || `${SITE_ORIGIN}/hook-logo.svg`,
  };
};

/**
 * Generate Organization schema (place in global layout/root)
 */
export const createOrganizationSchema = () => {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Hooks",
    url: SITE_ORIGIN,
    logo: `${SITE_ORIGIN}/hook-logo.svg`,
    description:
      "Compare smartphones, laptops, TVs, and gadgets with specs, prices, and reviews",
    sameAs: [
      "https://www.instagram.com/tryhooks",
      "https://www.twitter.com/tryhooks",
      "https://www.facebook.com/tryhooks",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Customer Support",
      email: "support@tryhook.shop",
    },
  };
};

/**
 * Generate WebSite schema with search action (place in global layout/root)
 */
export const createWebsiteSchema = () => {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Hooks",
    url: SITE_ORIGIN,
    description: "Smart device comparison platform",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_ORIGIN}/search?q={search_term_string}`,
      },
      query_input: "required name=search_term_string",
    },
  };
};

/**
 * Generate WebApplication schema for comparison tool
 */
export const createWebApplicationSchema = ({
  name,
  description,
  url,
  applicationCategory = "Productivity",
} = {}) => {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: name || "Device Comparison Tool",
    description:
      description ||
      "Compare smartphones, laptops, TVs, and networking devices side-by-side",
    url: url || `${SITE_ORIGIN}/compare`,
    applicationCategory: applicationCategory,
    operatingSystem: "Any",
    browserRequirements: "Requires JavaScript",
  };
};

/**
 * Generate ContactPage schema for contact pages
 */
export const createContactPageSchema = ({
  name,
  description,
  url,
  contactEmail = "support@tryhook.shop",
  contactPhone = null,
  contactAddress = null,
} = {}) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: name || "Contact Us",
    description: description || "Get in touch with Hooks support team",
    url: url || `${SITE_ORIGIN}/contact`,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Customer Support",
      email: contactEmail,
    },
  };

  if (contactPhone) {
    schema.contactPoint.telephone = contactPhone;
  }

  if (contactAddress) {
    schema.contactPoint.areaServed = contactAddress;
  }

  return schema;
};

/**
 * Generate AboutPage schema for about pages
 */
export const createAboutPageSchema = ({
  name,
  description,
  url,
  organizationName = "Hooks",
} = {}) => {
  return {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: name || "About Us",
    description:
      description ||
      "Learn about Hooks - a device comparison and research platform",
    url: url || `${SITE_ORIGIN}/about`,
    about: {
      "@type": "Organization",
      name: organizationName,
      url: SITE_ORIGIN,
      logo: `${SITE_ORIGIN}/hook-logo.svg`,
      description:
        "Compare smartphones, laptops, TVs, and gadgets with specs, prices, and trend insights",
    },
  };
};

/**
 * Generate WebPage schema for generic pages (legal, info)
 */
export const createWebPageSchema = ({
  name,
  description,
  url,
  pageType = "WebPage",
} = {}) => {
  return {
    "@context": "https://schema.org",
    "@type": pageType || "WebPage",
    name: name || "Page",
    description: description || "",
    url: url || SITE_ORIGIN,
  };
};

export default {
  createProductSchema,
  createItemListSchema,
  createBreadcrumbSchema,
  createCollectionSchema,
  createOrganizationSchema,
  createWebsiteSchema,
  createWebApplicationSchema,
  createContactPageSchema,
  createAboutPageSchema,
  createWebPageSchema,
};
