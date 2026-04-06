import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import {
  createAboutPageSchema,
  createCollectionSchema,
  createContactPageSchema,
  createItemListSchema,
  createProductSchema,
  createWebApplicationSchema,
  createWebPageSchema,
} from "./src/utils/schemaGenerators.js";

const require = createRequire(import.meta.url);
const vitePrerender = require("vite-plugin-prerender");
const Renderer = vitePrerender.PuppeteerRenderer;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SITE_ORIGIN = "https://tryhook.shop";
const API_BASE_URL = "https://api.apisphere.in/api";
const API_ORIGIN = "https://api.apisphere.in";
const MAX_DETAIL_ROUTES_PER_CATEGORY = 1000;
const MAX_COMPARE_ROUTES = 300;
const SMARTPHONE_SEO_SUFFIX = "-price-in-india";
const SMARTPHONE_LIST_SLUGS = new Set(["upcoming"]);
const SMARTPHONE_FILTER_SEO = {
  "under-10000": { label: "Under ₹10,000" },
  "under-15000": { label: "Under ₹15,000" },
  "under-20000": { label: "Under ₹20,000" },
  "under-25000": { label: "Under ₹25,000" },
  "under-30000": { label: "Under ₹30,000" },
  "under-40000": { label: "Under ₹40,000" },
  "under-50000": { label: "Under ₹50,000" },
  "above-50000": { label: "Above ₹50,000" },
  new: { label: "Latest" },
};
const PRELOAD_CANONICAL_PATHS = new Set([
  "/",
  "/smartphones",
  "/smartphones/upcoming",
  "/laptops",
  "/tvs",
  "/networking",
  "/trending/smartphones",
  "/trending/laptops",
  "/trending/tvs",
  "/trending/networking",
]);
const PRELOAD_API_ENDPOINTS = [
  `${API_BASE_URL}/smartphones`,
  `${API_BASE_URL}/networking`,
  `${API_BASE_URL}/laptops`,
  `${API_BASE_URL}/tvs`,
  `${API_BASE_URL}/brand`,
  `${API_BASE_URL}/category`,
  `${API_BASE_URL}/public/trending/smartphones?limit=15`,
  `${API_BASE_URL}/public/trending/smartphones?limit=120`,
  `${API_BASE_URL}/public/trending/laptops?limit=15`,
  `${API_BASE_URL}/public/trending/laptops?limit=120`,
  `${API_BASE_URL}/public/trending/tvs?limit=15`,
  `${API_BASE_URL}/public/trending/tvs?limit=120`,
  `${API_BASE_URL}/public/trending/networking?limit=15`,
  `${API_BASE_URL}/public/trending/most-compared`,
  `${API_BASE_URL}/public/popular-features?deviceType=smartphone&days=7&limit=16`,
  `${API_BASE_URL}/public/popular-features?deviceType=laptop&days=7&limit=16`,
  `${API_BASE_URL}/public/popular-features?deviceType=notebook&days=7&limit=16`,
  `${API_BASE_URL}/public/popular-features?deviceType=tv&days=7&limit=16`,
  `${API_BASE_URL}/public/popular-features?deviceType=television&days=7&limit=16`,
  `${API_BASE_URL}/public/popular-features?deviceType=home-appliance&days=7&limit=16`,
  `${API_BASE_URL}/public/online-stores`,
];
const PRELOAD_STRIP_KEY_PATTERNS = [
  /_source$/i,
  /_raw$/i,
  /^field_profile$/i,
  /^hook_rank_score$/i,
  /^spec_score_price$/i,
  /^spec_score_price_band$/i,
  /^spec_score_feature_coverage$/i,
];
const CURRENT_YEAR = new Date().getFullYear();
const BUDGET_PHONE_KEYWORDS =
  "budget phones under 10000, budget phones under 15000, budget phones under 20000, budget phones under 30000, budget phones under 50000";
const DEFAULT_SEO_KEYWORDS = `hook, best gadget comparison site, mobile price comparison india, moblie price comparison india, compare laptops smartphones tvs, compare smartphone tv laptops, compare specs, latest smartphones in india ${CURRENT_YEAR}, best smartphones in ${CURRENT_YEAR}, new launch phones, trending phone in india, most popular mobiles, top selling gadgets india, 5g phones in india, ai phones in india, ${BUDGET_PHONE_KEYWORDS}, latest laptops in india ${CURRENT_YEAR}, laptop prices list ${CURRENT_YEAR}, gaming laptops india, student laptops india, laptop comparison india, vacuum cooler laptop and phone, latest smart tvs in india ${CURRENT_YEAR}, tv prices list ${CURRENT_YEAR}, best 4k tv india, best 8k tv india, oled tv india, android tv price india, led tv under 30000, smart tv comparison india`;
const STATIC_PRERENDER_ROUTES = [
  "/",
  "/career",
  "/trending",
  "/laptop",
  "/mobiles",
  "/appliances",
  "/products",
  "/products/laptop",
  "/products/mobiles",
  "/products/smartphones",
  "/products/laptops",
  "/products/tvs",
  "/products/appliances",
  "/products/networking",
  "/devices",
  "/devices/laptop",
  "/devices/smartphones",
  "/devices/laptops",
  "/devices/tvs",
  "/devices/appliances",
  "/devices/networking",
  "/smartphones",
  "/smartphones/upcoming",
  "/laptops",
  "/tvs",
  "/networking",
  "/compare",
  "/trending/smartphones",
  "/trending/laptops",
  "/trending/tvs",
  "/trending/networking",
  "/about",
  "/careers",
  "/contact",
  "/privacy-policy",
  "/terms",
  "/login",
  "/signup",
  "/account",
  "/wishlist",
];

const normalizePath = (routePath = "/") => {
  if (!routePath) return "/";
  if (routePath.length > 1 && routePath.endsWith("/")) {
    return routePath.slice(0, -1);
  }
  return routePath;
};

const stripSmartphoneSeoSuffix = (slug = "") => {
  const value = String(slug || "")
    .toLowerCase()
    .trim();
  if (!value) return "";
  if (value.endsWith(SMARTPHONE_SEO_SUFFIX)) {
    return value.slice(0, -SMARTPHONE_SEO_SUFFIX.length).replace(/-+$/g, "");
  }
  return value;
};

const toSmartphoneSeoSlug = (slug = "") => {
  const base = stripSmartphoneSeoSuffix(slug);
  return base ? `${base}${SMARTPHONE_SEO_SUFFIX}` : "";
};

const ensureSmartphoneSeoDetailPath = (path = "") => {
  if (!path.startsWith("/smartphones/")) return path;
  const tail = path.slice("/smartphones/".length);
  if (!tail || tail.includes("/")) return path;
  if (SMARTPHONE_LIST_SLUGS.has(tail.toLowerCase())) return path;
  const seoSlug = toSmartphoneSeoSlug(tail);
  return seoSlug ? `/smartphones/${seoSlug}` : path;
};

const toReadableTitleFromSlug = (slug = "") => {
  const normalized = (() => {
    try {
      return decodeURIComponent(String(slug || ""));
    } catch {
      return String(slug || "");
    }
  })()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) return "";
  return normalized
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const extractDetailSlugName = (path, prefix, normalizeTail) => {
  if (!path.startsWith(prefix)) return "";
  const tail = path.slice(prefix.length);
  if (!tail || tail.includes("/")) return "";
  const normalizedTail =
    typeof normalizeTail === "function" ? normalizeTail(tail) : tail;
  if (!normalizedTail) return "";
  return toReadableTitleFromSlug(normalizedTail);
};

const extractComparePairNames = (path) => {
  const match = String(path || "").match(/^\/compare\/([^/]+)-vs-([^/]+)$/i);
  if (!match) return null;
  const left = toReadableTitleFromSlug(match[1]);
  const right = toReadableTitleFromSlug(match[2]);
  if (!left || !right) return null;
  return { left, right };
};

const toSlug = (value = "") =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

const toCanonicalPath = (rawPath) => {
  const pathName = normalizePath(rawPath);
  if (pathName === "/smartphones/upcoming") return "/smartphones/upcoming";
  if (pathName.startsWith("/smartphones/filter/upcoming"))
    return "/smartphones/upcoming";
  if (pathName.startsWith("/products/smartphones/upcoming"))
    return "/smartphones/upcoming";
  if (pathName.startsWith("/devices/smartphones/upcoming"))
    return "/smartphones/upcoming";
  if (pathName.startsWith("/products/mobiles/upcoming"))
    return "/smartphones/upcoming";
  if (pathName.startsWith("/devices/mobiles/upcoming"))
    return "/smartphones/upcoming";
  if (pathName === "/career") return "/careers";
  if (pathName === "/blog" || pathName === "/blogs") return "/";
  if (pathName.startsWith("/blog/") || pathName.startsWith("/blogs/")) {
    return "/";
  }
  if (pathName === "/trending") return "/trending/smartphones";
  if (pathName === "/trending/smartphone") return "/trending/smartphones";
  if (pathName === "/trending/laptop") return "/trending/laptops";
  if (pathName === "/trending/tv") return "/trending/tvs";
  if (pathName === "/products" || pathName === "/products/mobiles")
    return "/smartphones";
  if (pathName === "/devices") return "/smartphones";
  if (pathName === "/laptop") return "/laptops";
  if (pathName.startsWith("/laptop/")) {
    return pathName.replace("/laptop/", "/laptops/");
  }
  if (pathName === "/mobiles") return "/smartphones";
  if (pathName.startsWith("/products/mobiles")) {
    return ensureSmartphoneSeoDetailPath(
      pathName.replace("/products/mobiles", "/smartphones"),
    );
  }
  if (pathName.startsWith("/devices/mobiles")) {
    return ensureSmartphoneSeoDetailPath(
      pathName.replace("/devices/mobiles", "/smartphones"),
    );
  }
  if (pathName.startsWith("/products/smartphones")) {
    return ensureSmartphoneSeoDetailPath(
      pathName.replace("/products/smartphones", "/smartphones"),
    );
  }
  if (pathName.startsWith("/devices/smartphones")) {
    return ensureSmartphoneSeoDetailPath(
      pathName.replace("/devices/smartphones", "/smartphones"),
    );
  }
  if (pathName.startsWith("/products/laptops")) {
    return pathName.replace("/products/laptops", "/laptops");
  }
  if (pathName.startsWith("/products/laptop")) {
    return pathName.replace("/products/laptop", "/laptops");
  }
  if (pathName.startsWith("/devices/laptops")) {
    return pathName.replace("/devices/laptops", "/laptops");
  }
  if (pathName.startsWith("/devices/laptop")) {
    return pathName.replace("/devices/laptop", "/laptops");
  }
  if (pathName === "/appliances") return "/tvs";
  if (pathName.startsWith("/appliances/")) {
    return pathName.replace("/appliances/", "/tvs/");
  }
  if (pathName.startsWith("/products/tvs")) {
    return pathName.replace("/products/tvs", "/tvs");
  }
  if (pathName.startsWith("/products/appliances")) {
    return pathName.replace("/products/appliances", "/tvs");
  }
  if (pathName.startsWith("/devices/tvs")) {
    return pathName.replace("/devices/tvs", "/tvs");
  }
  if (pathName.startsWith("/devices/appliances")) {
    return pathName.replace("/devices/appliances", "/tvs");
  }
  if (pathName.startsWith("/products/networking")) {
    return pathName.replace("/products/networking", "/networking");
  }
  if (pathName.startsWith("/devices/networking")) {
    return pathName.replace("/devices/networking", "/networking");
  }
  return ensureSmartphoneSeoDetailPath(pathName);
};

const routesFromSitemap = () => {
  try {
    const sitemapPath = path.join(__dirname, "public", "sitemap.xml");
    const xml = fs.readFileSync(sitemapPath, "utf8");
    const locMatches = [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)];
    const parsed = locMatches
      .map((m) => m?.[1]?.trim())
      .filter(Boolean)
      .map((loc) => {
        if (loc.startsWith("/")) return normalizePath(loc);
        try {
          const parsedUrl = new URL(loc);
          return normalizePath(parsedUrl.pathname || "/");
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .map((routePath) => toCanonicalPath(routePath));

    return parsed;
  } catch (err) {
    console.warn(
      "[prerender] Failed to read sitemap routes, using static route list only.",
    );
    return [];
  }
};

const parseApiRows = (body, preferredKeys = []) => {
  if (Array.isArray(body)) return body;
  for (const key of preferredKeys) {
    if (Array.isArray(body?.[key])) return body[key];
    if (Array.isArray(body?.data?.[key])) return body.data[key];
  }
  if (Array.isArray(body?.data)) return body.data;
  if (Array.isArray(body?.results)) return body.results;
  if (Array.isArray(body?.items)) return body.items;
  if (Array.isArray(body?.payload)) return body.payload;
  if (Array.isArray(body?.rows)) return body.rows;
  if (Array.isArray(body?.data?.rows)) return body.data.rows;
  return [];
};

const getPreloadedRows = (payload, endpoint, preferredKeys = []) =>
  parseApiRows(payload?.byUrl?.[endpoint], preferredKeys);

const getSmartphoneDetailName = (canonicalPath) => {
  const name = extractDetailSlugName(
    canonicalPath,
    "/smartphones/",
    stripSmartphoneSeoSuffix,
  );
  const tail = canonicalPath.startsWith("/smartphones/")
    ? canonicalPath.slice("/smartphones/".length)
    : "";
  if (SMARTPHONE_LIST_SLUGS.has(String(tail || "").toLowerCase())) return "";
  return name;
};

const buildItemListFromRows = (rows = [], options = {}) => {
  const {
    basePath = "",
    toDetailSlug = (slug) => slug,
    getName = (item) => item?.name || item?.model || item?.product_name,
    getImage = (item) =>
      (Array.isArray(item?.images) ? item.images.find(Boolean) : null) ||
      item?.image ||
      item?.photo ||
      item?.thumbnail ||
      null,
  } = options;

  return rows
    .slice(0, 20)
    .map((row) => {
      const name = String(getName(row) || "").trim();
      if (!name) return null;
      const baseSlug = toSlug(name);
      if (!baseSlug) return null;
      const detailSlug = toDetailSlug(baseSlug, row);
      if (!detailSlug) return null;
      const image = getImage(row) || undefined;
      return {
        name,
        url: `${basePath}/${detailSlug}`.replace(/\/+/g, "/"),
        image,
      };
    })
    .filter(Boolean);
};

const fetchApiRows = async (endpoint, preferredKeys = []) => {
  if (typeof fetch !== "function") return [];
  try {
    const response = await fetch(endpoint);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const body = await response.json();
    return parseApiRows(body, preferredKeys);
  } catch (error) {
    console.warn(
      `[prerender] Failed to fetch detail routes from ${endpoint}: ${error?.message || error}`,
    );
    return [];
  }
};

const fetchApiBody = async (endpoint) => {
  if (typeof fetch !== "function") return null;
  try {
    const response = await fetch(endpoint);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.warn(
      `[prerender] Failed to fetch preloaded payload from ${endpoint}: ${error?.message || error}`,
    );
    return null;
  }
};

const shouldStripPreloadKey = (key = "") =>
  PRELOAD_STRIP_KEY_PATTERNS.some((pattern) => pattern.test(String(key)));

const sanitizePreloadValue = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizePreloadValue(item));
  }
  if (!value || typeof value !== "object") return value;

  const next = {};
  for (const [key, child] of Object.entries(value)) {
    if (shouldStripPreloadKey(key)) continue;
    next[key] = sanitizePreloadValue(child);
  }
  return next;
};

const fetchPreloadedApiPayload = async () => {
  const byUrl = {};
  for (const endpoint of PRELOAD_API_ENDPOINTS) {
    const body = await fetchApiBody(endpoint);
    if (body != null) byUrl[endpoint] = sanitizePreloadValue(body);
  }
  if (Object.keys(byUrl).length === 0) return null;
  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    apiOrigin: API_ORIGIN,
    byUrl,
  };
};

const fetchDetailRoutesFromApi = async () => {
  const sources = [
    {
      endpoint: `${API_BASE_URL}/smartphones`,
      preferredKeys: ["smartphones"],
      basePath: "/smartphones",
      getName: (item) => item?.name || item?.model || item?.product_name,
      toDetailSlug: (slug) => toSmartphoneSeoSlug(slug),
    },
    {
      endpoint: `${API_BASE_URL}/laptops`,
      preferredKeys: ["laptops"],
      basePath: "/laptops",
      getName: (item) =>
        item?.product_name ||
        item?.name ||
        item?.model_number ||
        item?.model ||
        item?.basic_info?.product_name ||
        item?.basic_info?.title ||
        item?.basic_info?.model_number ||
        item?.basic_info?.model,
    },
    {
      endpoint: `${API_BASE_URL}/tvs`,
      preferredKeys: ["tvs"],
      basePath: "/tvs",
      getName: (item) =>
        item?.product_name ||
        item?.name ||
        item?.model_number ||
        item?.model ||
        item?.basic_info?.product_name ||
        item?.basic_info?.title ||
        item?.basic_info?.model_number ||
        item?.basic_info?.model,
    },
    {
      endpoint: `${API_BASE_URL}/networking`,
      preferredKeys: ["networking"],
      basePath: "/networking",
      getName: (item) =>
        item?.product_name ||
        item?.name ||
        item?.model_number ||
        item?.model ||
        item?.basic_info?.product_name ||
        item?.basic_info?.title ||
        item?.basic_info?.model_number ||
        item?.basic_info?.model,
    },
  ];

  const routes = [];

  for (const source of sources) {
    const rows = await fetchApiRows(source.endpoint, source.preferredKeys);
    let addedCount = 0;

    for (const row of rows) {
      const baseSlug = toSlug(source.getName(row));
      if (!baseSlug) continue;
      const detailSlug = source.toDetailSlug
        ? source.toDetailSlug(baseSlug, row)
        : baseSlug;
      if (!detailSlug) continue;
      routes.push(`${source.basePath}/${detailSlug}`);
      addedCount += 1;
      if (addedCount >= MAX_DETAIL_ROUTES_PER_CATEGORY) break;
    }
  }

  const aliasRoutes = routes.flatMap((routePath) => {
    if (routePath.startsWith("/smartphones/")) {
      const slug = routePath.slice("/smartphones/".length);
      const baseSlug = stripSmartphoneSeoSuffix(slug);
      const aliases = [
        `/products/smartphones/${slug}`,
        `/products/mobiles/${slug}`,
        `/devices/smartphones/${slug}`,
        `/devices/mobiles/${slug}`,
      ];
      if (baseSlug && baseSlug !== slug) {
        aliases.push(
          `/smartphones/${baseSlug}`,
          `/products/smartphones/${baseSlug}`,
          `/products/mobiles/${baseSlug}`,
          `/devices/smartphones/${baseSlug}`,
          `/devices/mobiles/${baseSlug}`,
        );
      }
      return aliases;
    }

    if (routePath.startsWith("/laptops/")) {
      const slug = routePath.slice("/laptops/".length);
      return [
        `/laptop/${slug}`,
        `/products/laptop/${slug}`,
        `/products/laptops/${slug}`,
        `/devices/laptop/${slug}`,
        `/devices/laptops/${slug}`,
      ];
    }

    if (routePath.startsWith("/tvs/")) {
      const slug = routePath.slice("/tvs/".length);
      return [
        `/appliances/${slug}`,
        `/products/tvs/${slug}`,
        `/products/appliances/${slug}`,
        `/devices/tvs/${slug}`,
        `/devices/appliances/${slug}`,
      ];
    }

    if (routePath.startsWith("/networking/")) {
      const slug = routePath.slice("/networking/".length);
      return [`/products/networking/${slug}`, `/devices/networking/${slug}`];
    }

    return [];
  });

  return [...new Set([...routes, ...aliasRoutes])];
};

const fetchCompareRoutesFromApi = async () => {
  const rows = await fetchApiRows(
    `${API_BASE_URL}/public/trending/most-compared`,
    ["mostCompared"],
  );
  const routes = [];

  for (const row of rows) {
    if (routes.length >= MAX_COMPARE_ROUTES) break;
    const leftType = String(row?.product_type || "")
      .trim()
      .toLowerCase();
    const rightType = String(row?.compared_product_type || "")
      .trim()
      .toLowerCase();
    if (leftType && rightType && leftType !== rightType) continue;
    const leftSlug = toSlug(row?.product_name || row?.left_product_name || "");
    const rightSlug = toSlug(
      row?.compared_product_name || row?.right_product_name || "",
    );
    if (!leftSlug || !rightSlug || leftSlug === rightSlug) continue;
    routes.push(`/compare/${leftSlug}-vs-${rightSlug}`);
  }

  return [...new Set(routes)];
};

const getPrerenderRoutes = async () => {
  const sitemapRoutes = routesFromSitemap();
  const detailRoutes = await fetchDetailRoutesFromApi();
  const compareRoutes = await fetchCompareRoutesFromApi();
  return [
    ...new Set([
      "/",
      ...STATIC_PRERENDER_ROUTES,
      ...sitemapRoutes,
      ...detailRoutes,
      ...compareRoutes,
    ]),
  ];
};

const NOINDEX_SITEMAP_PATHS = new Set([
  "/login",
  "/signup",
  "/account",
  "/wishlist",
]);

const shouldIncludeInSitemap = (routePath = "/") => {
  const normalized = normalizePath(routePath);
  if (!normalized) return false;
  return !NOINDEX_SITEMAP_PATHS.has(normalized);
};

const buildSitemapXml = (routes = []) => {
  const today = new Date().toISOString().slice(0, 10);
  const canonicalRoutes = [
    ...new Set(
      routes
        .map((routePath) => toCanonicalPath(routePath))
        .map((routePath) => normalizePath(routePath))
        .filter((routePath) => shouldIncludeInSitemap(routePath)),
    ),
  ];

  canonicalRoutes.sort((a, b) => {
    if (a === "/") return -1;
    if (b === "/") return 1;
    return a.localeCompare(b);
  });

  const urls = canonicalRoutes
    .map((routePath) => {
      const loc =
        routePath === "/" ? SITE_ORIGIN : `${SITE_ORIGIN}${routePath}`;
      const isDetailPage =
        routePath.startsWith("/smartphones/") ||
        routePath.startsWith("/laptops/") ||
        routePath.startsWith("/tvs/") ||
        routePath.startsWith("/networking/");
      const priority = routePath === "/" ? "1.0" : isDetailPage ? "0.8" : "0.7";
      return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
};

const writeSitemapFile = (outputPath, routes = []) => {
  const xml = buildSitemapXml(routes);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, xml, "utf8");
  return outputPath;
};

const syncPublicSitemap = (routes = []) =>
  writeSitemapFile(path.join(__dirname, "public", "sitemap.xml"), routes);

const createSitemapPlugin = (routes = []) => ({
  name: "hook-generate-sitemap",
  apply: "build",
  closeBundle() {
    const outputDir = path.join(__dirname, "dist");
    const outputPath = path.join(outputDir, "sitemap.xml");
    writeSitemapFile(outputPath, routes);
    console.log(`[sitemap] Generated ${outputPath}`);
  },
});

const resolveSeo = (routePath) => {
  const canonicalPath = toCanonicalPath(routePath);
  const smartphoneDetailName = (() => {
    const name = extractDetailSlugName(
      canonicalPath,
      "/smartphones/",
      stripSmartphoneSeoSuffix,
    );
    const tail = canonicalPath.startsWith("/smartphones/")
      ? canonicalPath.slice("/smartphones/".length)
      : "";
    if (SMARTPHONE_LIST_SLUGS.has(tail.toLowerCase())) return "";
    return name;
  })();
  const laptopDetailName = extractDetailSlugName(canonicalPath, "/laptops/");
  const tvDetailName = extractDetailSlugName(canonicalPath, "/tvs/");
  const comparePair = extractComparePairNames(canonicalPath);
  const smartphoneFilterSlug = (() => {
    const match = canonicalPath.match(/^\/smartphones\/filter\/([^/]+)$/i);
    if (!match) return "";
    return String(match[1] || "").toLowerCase();
  })();
  const smartphoneFilterMeta =
    smartphoneFilterSlug && SMARTPHONE_FILTER_SEO[smartphoneFilterSlug]
      ? SMARTPHONE_FILTER_SEO[smartphoneFilterSlug]
      : null;
  const rules = [
    {
      test: (p) => p === "/",
      title:
        "Compare Smartphones, Laptops & TVs in India | Specs, Prices & Reviews | Hooks",
      description:
        "Compare smartphones, laptops, TVs, and networking devices in India with specs, prices, variants, and trend insights. Discover latest launches on Hooks.",
      keywords: `hook, best gadget comparison site, mobile price comparison india, compare laptops smartphones tvs, latest smartphones in india ${CURRENT_YEAR}, best smartphones in ${CURRENT_YEAR}, latest laptops in india ${CURRENT_YEAR}, latest smart tvs in india ${CURRENT_YEAR}, new launch and trending gadgets, top selling gadgets india, compare specs`,
    },
    {
      test: () => Boolean(smartphoneDetailName),
      title: `${smartphoneDetailName} Price, Specs & Comparison in India (${CURRENT_YEAR}) | Hooks`,
      description: `Compare ${smartphoneDetailName} price in India, full specifications, variants, launch details, and latest offers on Hook.`,
      keywords: `${smartphoneDetailName.toLowerCase()}, ${smartphoneDetailName.toLowerCase()} price in india, ${smartphoneDetailName.toLowerCase()} specifications, ${smartphoneDetailName.toLowerCase()} launch date, compare smartphones, mobile price comparison india`,
    },
    {
      test: () => Boolean(laptopDetailName),
      title: `${laptopDetailName} Price, Specs & Comparison in India (${CURRENT_YEAR}) | Hooks`,
      description: `Compare ${laptopDetailName} laptop price in India, full specifications, variants, and best store offers on Hook.`,
      keywords: `${laptopDetailName.toLowerCase()}, ${laptopDetailName.toLowerCase()} price in india, ${laptopDetailName.toLowerCase()} specs, compare laptops india, laptop prices list ${CURRENT_YEAR}`,
    },
    {
      test: () => Boolean(tvDetailName),
      title: `${tvDetailName} Price, Specs & TV Comparison in India (${CURRENT_YEAR}) | Hooks`,
      description: `Compare ${tvDetailName} TV price in India, size variants, display specs, smart features, and store offers on Hook.`,
      keywords: `${tvDetailName.toLowerCase()}, ${tvDetailName.toLowerCase()} tv price in india, ${tvDetailName.toLowerCase()} specifications, smart tv comparison india, tv prices list ${CURRENT_YEAR}`,
    },
    {
      test: (p) => p === "/smartphones/upcoming",
      title: `Upcoming Smartphones ${CURRENT_YEAR} - Expected Launches & Preorders | Hooks`,
      description:
        "Track upcoming smartphones, expected launch timelines, and preorder-ready devices to plan your next upgrade.",
      keywords: `upcoming smartphones ${CURRENT_YEAR}, preorder phones, expected launch mobiles, new launch phones, smartphones launch calendar india`,
    },
    {
      test: () => Boolean(smartphoneFilterMeta),
      title:
        smartphoneFilterSlug === "new"
          ? `Latest Smartphones ${CURRENT_YEAR} - New Launches & Prices | Hooks`
          : `Best Smartphones ${smartphoneFilterMeta?.label} in ${CURRENT_YEAR} - Reviews, Specs & Deals | Hooks`,
      description:
        smartphoneFilterSlug === "new"
          ? "Discover newly launched smartphones with updated prices, full specifications, and reviews. Stay updated with the latest mobile releases on Hooks."
          : `Explore the best smartphones ${String(
              smartphoneFilterMeta?.label || "",
            ).toLowerCase()} with detailed specs, latest prices, reviews, and comparisons to choose the right phone for your budget.`,
      keywords:
        smartphoneFilterSlug === "new"
          ? `latest smartphones ${CURRENT_YEAR}, new launch mobiles, upcoming phones india, smartphone releases`
          : `smartphones ${String(
              smartphoneFilterMeta?.label || "",
            ).toLowerCase()}, best smartphones ${String(
              smartphoneFilterMeta?.label || "",
            ).toLowerCase()}, mobile price comparison india, compare smartphone specs, ${BUDGET_PHONE_KEYWORDS}`,
    },
    {
      test: (p) => p.startsWith("/smartphones"),
      title: "Smartphones - Compare Prices, Specs & Variants | Hooks",
      description:
        "Compare smartphones by price, RAM/ROM variants, camera, battery, and performance. Find trending and latest mobile launches on Hooks.",
      keywords: `smartphones, latest smartphones in india ${CURRENT_YEAR}, best smartphones in ${CURRENT_YEAR}, new launch mobiles, trending phone in india, most popular mobiles, mobile price comparison india, moblie price comparison india, compare smartphone specs, compare smartphone prices, 5g phones in india, ai phone, ai budget phone, ${BUDGET_PHONE_KEYWORDS}`,
    },
    {
      test: (p) => p.startsWith("/laptops"),
      title: "Laptops - Compare Models, Prices & Specifications | Hooks",
      description:
        "Discover and compare laptops by processor, RAM, storage, display, and price. View current deals and top laptop picks on Hook.",
      keywords: `laptops, latest laptops in india ${CURRENT_YEAR}, laptop prices list ${CURRENT_YEAR}, compare laptops india, laptop comparison site, laptop compare specs, gaming laptops india, student laptops india, productivity laptops, vacuum cooler laptop and phone`,
    },
    {
      test: (p) => p.startsWith("/tvs"),
      title: "TVs - Compare Screen Sizes, Specs & Prices | Hooks",
      description:
        "Compare TVs across 43, 55, 65, and larger screen sizes with full specifications, variant pricing, and store availability on Hook.",
      keywords: `tvs, latest smart tvs in india ${CURRENT_YEAR}, tv prices list ${CURRENT_YEAR}, smart tv comparison india, compare tv prices india, compare tv specs, 43 inch tv, 55 inch tv, 65 inch tv, 75 inch tv, best 4k tv india, best 8k tv india, oled tv india, android tv price india, led tv under 30000`,
    },
    {
      test: (p) => p.startsWith("/networking"),
      title: "Networking Devices - Compare Routers & More | Hooks",
      description:
        "Compare routers and networking products with speed, band, and connectivity specs to choose the right setup for your needs.",
      keywords:
        "networking devices, routers, wifi routers, dual band router, compare routers, modem router specs",
    },
    {
      test: (p) => p.startsWith("/compare"),
      title: comparePair
        ? `${comparePair.left} vs ${comparePair.right}: Specs, Price & Feature Comparison | Hooks`
        : "Device Comparison - Side by Side Specs & Prices | Hooks",
      description: comparePair
        ? `Compare ${comparePair.left} and ${comparePair.right} side by side with full specifications, pricing, and feature differences on Hook.`
        : "Compare devices side by side with full specs, pricing, and feature differences to make faster buying decisions.",
      keywords: comparePair
        ? `${comparePair.left.toLowerCase()} vs ${comparePair.right.toLowerCase()}, ${comparePair.left.toLowerCase()} comparison, ${comparePair.right.toLowerCase()} comparison, compare devices india, side by side comparison`
        : "device comparison, compare smartphones laptops tvs, compare smartphone tv laptops, compare spec online, compare prices india, side by side comparison, best gadget comparison site",
    },
    {
      test: (p) => p.startsWith("/trending"),
      title: "Trending Devices - Smartphones, Laptops & TVs | Hooks",
      description:
        "Track trending smartphones, laptops, and TVs based on momentum and user interest to spot what is hot right now.",
      keywords: `trending smartphones india, trending laptops india, trending tvs india, trending phone in india, most popular mobiles, top selling gadgets india, new launch and trending devices, latest smartphones in india ${CURRENT_YEAR}`,
    },
    {
      test: (p) => p.startsWith("/careers"),
      title: "Careers at Hook | Apply for Open Roles",
      description:
        "Apply for frontend, backend, content developer, and fullstack opportunities at Hook through a simple step-by-step application form.",
      keywords:
        "careers at hook, frontend jobs, backend jobs, fullstack jobs, content developer jobs, tech careers",
    },
    {
      test: (p) => p.startsWith("/about"),
      title: "About Hook | Product Discovery & Comparison Platform",
      description:
        "Learn about Hook, our mission, and how we help users compare technology products with structured and transparent information.",
      keywords:
        "about hook, product comparison platform, technology discovery, gadget research platform",
    },
    {
      test: (p) => p.startsWith("/contact"),
      title: "Contact Hook | Support, Partnerships & Press",
      description:
        "Contact Hook for product support, partnerships, and press queries. Reach the team through verified contact channels.",
      keywords:
        "contact hook, support hook, partnerships, press inquiries, hook contact details",
    },
    {
      test: (p) => p.startsWith("/privacy-policy"),
      title: "Privacy Policy | Hooks",
      description:
        "Read Hook privacy policy to understand what data we collect, why we collect it, and how you can control your information.",
      keywords:
        "privacy policy, data privacy, hook policy, personal data rights",
    },
    {
      test: (p) => p.startsWith("/terms"),
      title: "Terms of Use | Hooks",
      description:
        "Read Hook terms of use covering platform usage, content accuracy, and service limitations.",
      keywords: "terms of use, hook terms, website terms, usage policy",
    },
    {
      test: (p) =>
        p.startsWith("/account") ||
        p.startsWith("/wishlist") ||
        p.startsWith("/login") ||
        p.startsWith("/signup"),
      title: "Hook Account",
      description: "Secure account pages for your Hook profile and saved data.",
      keywords: "hook account, user account, login, signup, wishlist",
      robots: "noindex, nofollow",
    },
  ];

  const matched = rules.find((rule) => rule.test(canonicalPath));
  return {
    canonicalPath,
    title: matched?.title || "Hook | Smart Device Comparison Platform",
    description:
      matched?.description ||
      "Compare smartphones, laptops, TVs, and networking devices with specs, variants, pricing insights, and trend signals on Hook.",
    keywords: matched?.keywords || DEFAULT_SEO_KEYWORDS,
    robots: matched?.robots || "index, follow",
  };
};

const buildStructuredDataForRoute = (routePath, preloadedApiPayload) => {
  const seo = resolveSeo(routePath);
  const canonicalPath = seo.canonicalPath;
  const canonicalUrl = `${SITE_ORIGIN}${canonicalPath}`;

  if (canonicalPath === "/") return [];

  const smartphoneDetailName = getSmartphoneDetailName(canonicalPath);
  if (smartphoneDetailName) {
    return [
      createProductSchema({
        name: smartphoneDetailName,
        description: seo.description,
        url: canonicalUrl,
      }),
    ];
  }

  const laptopDetailName = extractDetailSlugName(canonicalPath, "/laptops/");
  if (laptopDetailName) {
    return [
      createProductSchema({
        name: laptopDetailName,
        description: seo.description,
        url: canonicalUrl,
      }),
    ];
  }

  const tvDetailName = extractDetailSlugName(canonicalPath, "/tvs/");
  if (tvDetailName) {
    return [
      createProductSchema({
        name: tvDetailName,
        description: seo.description,
        url: canonicalUrl,
      }),
    ];
  }

  const networkingDetailName = extractDetailSlugName(
    canonicalPath,
    "/networking/",
  );
  if (networkingDetailName) {
    return [
      createProductSchema({
        name: networkingDetailName,
        description: seo.description,
        url: canonicalUrl,
      }),
    ];
  }

  if (canonicalPath.startsWith("/compare")) {
    return [
      createWebApplicationSchema({
        name: seo.title,
        description: seo.description,
        url: canonicalUrl,
        applicationCategory: "UtilityApplication",
      }),
    ];
  }

  if (canonicalPath.startsWith("/about")) {
    return [
      createAboutPageSchema({
        name: "About Hooks",
        description: seo.description,
        url: canonicalUrl,
      }),
    ];
  }

  if (canonicalPath.startsWith("/contact")) {
    return [
      createContactPageSchema({
        name: "Contact Hooks",
        description: seo.description,
        url: canonicalUrl,
        contactEmail: "gospherecompare@gmail.com",
      }),
    ];
  }

  if (
    canonicalPath.startsWith("/privacy-policy") ||
    canonicalPath.startsWith("/terms") ||
    canonicalPath.startsWith("/careers")
  ) {
    return [
      createWebPageSchema({
        name: seo.title,
        description: seo.description,
        url: canonicalUrl,
      }),
    ];
  }

  if (canonicalPath.startsWith("/smartphones")) {
    const rows = getPreloadedRows(
      preloadedApiPayload,
      `${API_BASE_URL}/smartphones`,
      ["smartphones"],
    );
    const items = buildItemListFromRows(rows, {
      basePath: "/smartphones",
      toDetailSlug: (slug) => toSmartphoneSeoSlug(slug),
    });
    return [
      createCollectionSchema({
        name: seo.title,
        description: seo.description,
        url: canonicalUrl,
      }),
      createItemListSchema({
        name: seo.title,
        url: canonicalUrl,
        items,
      }),
    ];
  }

  if (canonicalPath.startsWith("/laptops")) {
    const rows = getPreloadedRows(
      preloadedApiPayload,
      `${API_BASE_URL}/laptops`,
      ["laptops"],
    );
    const items = buildItemListFromRows(rows, {
      basePath: "/laptops",
    });
    return [
      createCollectionSchema({
        name: seo.title,
        description: seo.description,
        url: canonicalUrl,
      }),
      createItemListSchema({
        name: seo.title,
        url: canonicalUrl,
        items,
      }),
    ];
  }

  if (canonicalPath.startsWith("/tvs")) {
    const rows = getPreloadedRows(preloadedApiPayload, `${API_BASE_URL}/tvs`, [
      "tvs",
    ]);
    const items = buildItemListFromRows(rows, {
      basePath: "/tvs",
    });
    return [
      createCollectionSchema({
        name: seo.title,
        description: seo.description,
        url: canonicalUrl,
      }),
      createItemListSchema({
        name: seo.title,
        url: canonicalUrl,
        items,
      }),
    ];
  }

  if (canonicalPath.startsWith("/networking")) {
    const rows = getPreloadedRows(
      preloadedApiPayload,
      `${API_BASE_URL}/networking`,
      ["networking"],
    );
    const items = buildItemListFromRows(rows, {
      basePath: "/networking",
    });
    return [
      createCollectionSchema({
        name: seo.title,
        description: seo.description,
        url: canonicalUrl,
      }),
      createItemListSchema({
        name: seo.title,
        url: canonicalUrl,
        items,
      }),
    ];
  }

  if (canonicalPath.startsWith("/trending")) {
    const category = canonicalPath.split("/")[2] || "smartphones";
    const endpointByCategory = {
      smartphones: `${API_BASE_URL}/public/trending/smartphones?limit=120`,
      laptops: `${API_BASE_URL}/public/trending/laptops?limit=120`,
      tvs: `${API_BASE_URL}/public/trending/tvs?limit=120`,
      networking: `${API_BASE_URL}/public/trending/networking?limit=120`,
    };
    const endpoint =
      endpointByCategory[category] || endpointByCategory.smartphones;
    const rows = getPreloadedRows(preloadedApiPayload, endpoint, ["results"]);
    const basePath =
      category === "laptops"
        ? "/laptops"
        : category === "tvs"
          ? "/tvs"
          : category === "networking"
            ? "/networking"
            : "/smartphones";
    const items = buildItemListFromRows(rows, {
      basePath,
      toDetailSlug:
        basePath === "/smartphones"
          ? (slug) => toSmartphoneSeoSlug(slug)
          : (slug) => slug,
      getName: (item) =>
        item?.product_name || item?.name || item?.model || item?.title || "",
      getImage: (item) =>
        item?.image ||
        (Array.isArray(item?.images) ? item.images.find(Boolean) : null) ||
        null,
    });
    return [
      createCollectionSchema({
        name: seo.title,
        description: seo.description,
        url: canonicalUrl,
      }),
      createItemListSchema({
        name: seo.title,
        url: canonicalUrl,
        items,
      }),
    ];
  }

  return [];
};

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const replaceMetaTag = (html, regex, tag) =>
  regex.test(html)
    ? html.replace(regex, tag)
    : html.replace("</head>", `${tag}\n</head>`);

const escapeInlineJson = (value) =>
  JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");

const injectPreloadedPayload = (html, payload) => {
  if (!payload) return html;
  if (html.includes('id="hook-prerender-data"')) return html;
  const scriptTag = `<script id="hook-prerender-data">window.__HOOKS_PRERENDER_DATA__=${escapeInlineJson(payload)};</script>`;
  return html.replace("</head>", `${scriptTag}\n</head>`);
};

const injectStructuredData = (html, routePath, preloadedApiPayload) => {
  const existing = [
    ...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>/gi),
  ];
  if (existing.length > 2) return html;

  const schemas = buildStructuredDataForRoute(routePath, preloadedApiPayload);
  if (!schemas || schemas.length === 0) return html;

  const entries = Array.isArray(schemas) ? schemas : [schemas];
  const scripts = entries
    .map(
      (schema) =>
        `<script type="application/ld+json">${escapeInlineJson(schema)}</script>`,
    )
    .join("\n");
  return html.replace("</head>", `${scripts}\n</head>`);
};

const applySeoToHtml = (html, routePath) => {
  const seo = resolveSeo(routePath);
  const canonicalUrl = `${SITE_ORIGIN}${seo.canonicalPath}`;
  const normalizedRoute = normalizePath(routePath || "/");
  const isAliasRoute = normalizedRoute !== seo.canonicalPath;
  let next = html;

  next = next.replace(
    /<title>[\s\S]*?<\/title>/i,
    `<title>${escapeHtml(seo.title)}</title>`,
  );
  next = replaceMetaTag(
    next,
    /<meta\s+name=["']robots["'][^>]*>/i,
    `<meta name="robots" content="${escapeHtml(seo.robots)}">`,
  );
  next = replaceMetaTag(
    next,
    /<meta\s+name=["']description["'][^>]*>/i,
    `<meta name="description" content="${escapeHtml(seo.description)}">`,
  );
  next = replaceMetaTag(
    next,
    /<meta\s+name=["']keywords["'][^>]*>/i,
    `<meta name="keywords" content="${escapeHtml(seo.keywords)}">`,
  );
  next = replaceMetaTag(
    next,
    /<meta\s+property=["']og:title["'][^>]*>/i,
    `<meta property="og:title" content="${escapeHtml(seo.title)}">`,
  );
  next = replaceMetaTag(
    next,
    /<meta\s+property=["']og:description["'][^>]*>/i,
    `<meta property="og:description" content="${escapeHtml(seo.description)}">`,
  );
  next = replaceMetaTag(
    next,
    /<meta\s+property=["']og:url["'][^>]*>/i,
    `<meta property="og:url" content="${escapeHtml(canonicalUrl)}">`,
  );
  next = replaceMetaTag(
    next,
    /<meta\s+name=["']twitter:title["'][^>]*>/i,
    `<meta name="twitter:title" content="${escapeHtml(seo.title)}">`,
  );
  next = replaceMetaTag(
    next,
    /<meta\s+name=["']twitter:description["'][^>]*>/i,
    `<meta name="twitter:description" content="${escapeHtml(seo.description)}">`,
  );
  next = replaceMetaTag(
    next,
    /<link\s+rel=["']canonical["'][^>]*>/i,
    `<link rel="canonical" href="${escapeHtml(canonicalUrl)}">`,
  );

  if (isAliasRoute) {
    next = replaceMetaTag(
      next,
      /<meta\s+http-equiv=["']refresh["'][^>]*>/i,
      `<meta http-equiv="refresh" content="0;url=${escapeHtml(canonicalUrl)}">`,
    );
  }

  return next;
};

const processRouteHtml = (html, routePath, preloadedApiPayload) => {
  const normalizedRoute = normalizePath(routePath || "/");
  let nextHtml = applySeoToHtml(html, normalizedRoute);
  nextHtml = injectStructuredData(
    nextHtml,
    normalizedRoute,
    preloadedApiPayload,
  );

  if (PRELOAD_CANONICAL_PATHS.has(toCanonicalPath(normalizedRoute))) {
    nextHtml = injectPreloadedPayload(nextHtml, preloadedApiPayload);
  }

  return nextHtml;
};

export default defineConfig(async () => {
  const prerenderRoutes = await getPrerenderRoutes();
  syncPublicSitemap(prerenderRoutes);
  const preloadedApiPayload = await fetchPreloadedApiPayload();
  const processHtml = (html, routePath) =>
    processRouteHtml(html, routePath, preloadedApiPayload);

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: "hooks-route-seo-dev",
        apply: "serve",
        transformIndexHtml(html, ctx) {
          const rawPath = String(ctx?.path || ctx?.url || "/")
            .split("?")[0]
            .split("#")[0];
          return processHtml(html, rawPath || "/");
        },
      },
      vitePrerender({
        staticDir: path.join(__dirname, "dist"),
        routes: prerenderRoutes,
        renderer: new Renderer({
          renderAfterTime: 1500,
          maxConcurrentRoutes: 4,
          consoleHandler(route, message) {
            const type = message?.type?.() || "log";
            const text = message?.text?.() || "";
            if (type === "error" || text.includes("Error")) {
              console.log(`[prerender:${route}] ${type}: ${text}`);
            }
          },
        }),
        postProcess(renderedRoute) {
          renderedRoute.route =
            renderedRoute.originalRoute || renderedRoute.route;
          const routePath = renderedRoute.route || "/";
          renderedRoute.html = processHtml(renderedRoute.html || "", routePath);
          return renderedRoute;
        },
      }),
      createSitemapPlugin(prerenderRoutes),
    ],
    server: {
      port: 3000,
      host: true,
    },
    base: "/",
  };
});
