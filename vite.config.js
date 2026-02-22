import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const vitePrerender = require("vite-plugin-prerender");
const Renderer = vitePrerender.PuppeteerRenderer;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SITE_ORIGIN = "https://tryhook.shop";
const API_BASE_URL = "https://api.apisphere.in/api";
const MAX_DETAIL_ROUTES_PER_CATEGORY = 200;
const CURRENT_YEAR = new Date().getFullYear();
const BUDGET_PHONE_KEYWORDS =
  "budget phones under 10000, budget phones under 15000, budget phones under 20000, budget phones under 30000, budget phones under 50000";
const DEFAULT_SEO_KEYWORDS =
  `hook, best gadget comparison site, mobile price comparison india, moblie price comparison india, compare laptops smartphones tvs, compare smartphone tv laptops, compare specs, latest smartphones in india ${CURRENT_YEAR}, best smartphones in ${CURRENT_YEAR}, new launch phones, trending phone in india, most popular mobiles, top selling gadgets india, 5g phones in india, ai phones in india, ${BUDGET_PHONE_KEYWORDS}, latest laptops in india ${CURRENT_YEAR}, laptop prices list ${CURRENT_YEAR}, gaming laptops india, student laptops india, laptop comparison india, vacuum cooler laptop and phone, latest smart tvs in india ${CURRENT_YEAR}, tv prices list ${CURRENT_YEAR}, best 4k tv india, best 8k tv india, oled tv india, android tv price india, led tv under 30000, smart tv comparison india`;
const STATIC_PRERENDER_ROUTES = [
  "/",
  "/career",
  "/trending",
  "/mobiles",
  "/appliances",
  "/products",
  "/products/mobiles",
  "/products/smartphones",
  "/products/laptops",
  "/products/tvs",
  "/products/appliances",
  "/products/networking",
  "/devices",
  "/devices/smartphones",
  "/devices/laptops",
  "/devices/tvs",
  "/devices/appliances",
  "/devices/networking",
  "/smartphones",
  "/laptops",
  "/tvs",
  "/networking",
  "/compare",
  "/trending/smartphones",
  "/trending/laptops",
  "/trending/tvs",
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

const extractDetailSlugName = (path, prefix) => {
  if (!path.startsWith(prefix)) return "";
  const tail = path.slice(prefix.length);
  if (!tail || tail.includes("/")) return "";
  return toReadableTitleFromSlug(tail);
};

const toSlug = (value = "") =>
  String(value || "")
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const toCanonicalPath = (rawPath) => {
  const pathName = normalizePath(rawPath);
  if (pathName === "/career") return "/careers";
  if (pathName === "/trending") return "/trending/smartphones";
  if (pathName === "/trending/smartphone") return "/trending/smartphones";
  if (pathName === "/trending/laptop") return "/trending/laptops";
  if (pathName === "/trending/tv") return "/trending/tvs";
  if (pathName === "/products" || pathName === "/products/mobiles") return "/smartphones";
  if (pathName === "/devices") return "/smartphones";
  if (pathName === "/mobiles") return "/smartphones";
  if (pathName.startsWith("/products/smartphones")) {
    return pathName.replace("/products/smartphones", "/smartphones");
  }
  if (pathName.startsWith("/devices/smartphones")) {
    return pathName.replace("/devices/smartphones", "/smartphones");
  }
  if (pathName.startsWith("/products/laptops")) {
    return pathName.replace("/products/laptops", "/laptops");
  }
  if (pathName.startsWith("/devices/laptops")) {
    return pathName.replace("/devices/laptops", "/laptops");
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
  return pathName;
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
    console.warn("[prerender] Failed to read sitemap routes, using static route list only.");
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

const fetchDetailRoutesFromApi = async () => {
  const sources = [
    {
      endpoint: `${API_BASE_URL}/smartphones`,
      preferredKeys: ["smartphones"],
      basePath: "/smartphones",
      getName: (item) => item?.name || item?.model || item?.product_name,
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
  ];

  const routes = [];

  for (const source of sources) {
    const rows = await fetchApiRows(source.endpoint, source.preferredKeys);
    let addedCount = 0;

    for (const row of rows) {
      const slug = toSlug(source.getName(row));
      if (!slug) continue;
      routes.push(`${source.basePath}/${slug}`);
      addedCount += 1;
      if (addedCount >= MAX_DETAIL_ROUTES_PER_CATEGORY) break;
    }
  }

  return [...new Set(routes)];
};

const getPrerenderRoutes = async () => {
  const sitemapRoutes = routesFromSitemap();
  const detailRoutes = await fetchDetailRoutesFromApi();
  return [...new Set(["/", ...STATIC_PRERENDER_ROUTES, ...sitemapRoutes, ...detailRoutes])];
};

const resolveSeo = (routePath) => {
  const canonicalPath = toCanonicalPath(routePath);
  const smartphoneDetailName = extractDetailSlugName(
    canonicalPath,
    "/smartphones/",
  );
  const laptopDetailName = extractDetailSlugName(canonicalPath, "/laptops/");
  const tvDetailName = extractDetailSlugName(canonicalPath, "/tvs/");
  const rules = [
    {
      test: (p) => p === "/",
      title: "Hook | Compare Smartphones, Laptops, TVs & Networking Devices",
      description:
        "Explore and compare smartphones, laptops, TVs, and networking devices with clear specs, pricing, and trend insights.",
      keywords:
        `hook, best gadget comparison site, mobile price comparison india, compare laptops smartphones tvs, latest smartphones in india ${CURRENT_YEAR}, best smartphones in ${CURRENT_YEAR}, latest laptops in india ${CURRENT_YEAR}, latest smart tvs in india ${CURRENT_YEAR}, new launch and trending gadgets, top selling gadgets india, compare specs`,
    },
    {
      test: () => Boolean(smartphoneDetailName),
      title: `${smartphoneDetailName} Price, Specs & Comparison in India (${CURRENT_YEAR}) | Hook`,
      description: `Compare ${smartphoneDetailName} price in India, full specifications, variants, launch details, and latest offers on Hook.`,
      keywords: `${smartphoneDetailName.toLowerCase()}, ${smartphoneDetailName.toLowerCase()} price in india, ${smartphoneDetailName.toLowerCase()} specifications, ${smartphoneDetailName.toLowerCase()} launch date, compare smartphones, mobile price comparison india`,
    },
    {
      test: () => Boolean(laptopDetailName),
      title: `${laptopDetailName} Price, Specs & Comparison in India (${CURRENT_YEAR}) | Hook`,
      description: `Compare ${laptopDetailName} laptop price in India, full specifications, variants, and best store offers on Hook.`,
      keywords: `${laptopDetailName.toLowerCase()}, ${laptopDetailName.toLowerCase()} price in india, ${laptopDetailName.toLowerCase()} specs, compare laptops india, laptop prices list ${CURRENT_YEAR}`,
    },
    {
      test: () => Boolean(tvDetailName),
      title: `${tvDetailName} Price, Specs & TV Comparison in India (${CURRENT_YEAR}) | Hook`,
      description: `Compare ${tvDetailName} TV price in India, size variants, display specs, smart features, and store offers on Hook.`,
      keywords: `${tvDetailName.toLowerCase()}, ${tvDetailName.toLowerCase()} tv price in india, ${tvDetailName.toLowerCase()} specifications, smart tv comparison india, tv prices list ${CURRENT_YEAR}`,
    },
    {
      test: (p) => p.startsWith("/smartphones"),
      title: "Smartphones - Compare Prices, Specs & Variants | Hook",
      description:
        "Compare smartphones by price, RAM/ROM variants, camera, battery, and performance. Find trending and latest mobile launches on Hook.",
      keywords:
        `smartphones, latest smartphones in india ${CURRENT_YEAR}, best smartphones in ${CURRENT_YEAR}, new launch mobiles, trending phone in india, most popular mobiles, mobile price comparison india, moblie price comparison india, compare smartphone specs, compare smartphone prices, 5g phones in india, ai phone, ai budget phone, ${BUDGET_PHONE_KEYWORDS}`,
    },
    {
      test: (p) => p.startsWith("/laptops"),
      title: "Laptops - Compare Models, Prices & Specifications | Hook",
      description:
        "Discover and compare laptops by processor, RAM, storage, display, and price. View current deals and top laptop picks on Hook.",
      keywords:
        `laptops, latest laptops in india ${CURRENT_YEAR}, laptop prices list ${CURRENT_YEAR}, compare laptops india, laptop comparison site, laptop compare specs, gaming laptops india, student laptops india, productivity laptops, vacuum cooler laptop and phone`,
    },
    {
      test: (p) => p.startsWith("/tvs"),
      title: "TVs - Compare Screen Sizes, Specs & Prices | Hook",
      description:
        "Compare TVs across 43, 55, 65, and larger screen sizes with full specifications, variant pricing, and store availability on Hook.",
      keywords:
        `tvs, latest smart tvs in india ${CURRENT_YEAR}, tv prices list ${CURRENT_YEAR}, smart tv comparison india, compare tv prices india, compare tv specs, 43 inch tv, 55 inch tv, 65 inch tv, 75 inch tv, best 4k tv india, best 8k tv india, oled tv india, android tv price india, led tv under 30000`,
    },
    {
      test: (p) => p.startsWith("/networking"),
      title: "Networking Devices - Compare Routers & More | Hook",
      description:
        "Compare routers and networking products with speed, band, and connectivity specs to choose the right setup for your needs.",
      keywords:
        "networking devices, routers, wifi routers, dual band router, compare routers, modem router specs",
    },
    {
      test: (p) => p.startsWith("/compare"),
      title: "Device Comparison - Side by Side Specs & Prices | Hook",
      description:
        "Compare devices side by side with full specs, pricing, and feature differences to make faster buying decisions.",
      keywords:
        "device comparison, compare smartphones laptops tvs, compare smartphone tv laptops, compare spec online, compare prices india, side by side comparison, best gadget comparison site",
    },
    {
      test: (p) => p.startsWith("/trending"),
      title: "Trending Devices - Smartphones, Laptops & TVs | Hook",
      description:
        "Track trending smartphones, laptops, and TVs based on momentum and user interest to spot what is hot right now.",
      keywords:
        `trending smartphones india, trending laptops india, trending tvs india, trending phone in india, most popular mobiles, top selling gadgets india, new launch and trending devices, latest smartphones in india ${CURRENT_YEAR}`,
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
      title: "Privacy Policy | Hook",
      description:
        "Read Hook privacy policy to understand what data we collect, why we collect it, and how you can control your information.",
      keywords: "privacy policy, data privacy, hook policy, personal data rights",
    },
    {
      test: (p) => p.startsWith("/terms"),
      title: "Terms of Use | Hook",
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

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const replaceMetaTag = (html, regex, tag) =>
  regex.test(html) ? html.replace(regex, tag) : html.replace("</head>", `${tag}\n</head>`);

const applySeoToHtml = (html, routePath) => {
  const seo = resolveSeo(routePath);
  const canonicalUrl = `${SITE_ORIGIN}${seo.canonicalPath}`;
  let next = html;

  next = next.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(seo.title)}</title>`);
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

  return next;
};

export default defineConfig(async () => {
  const prerenderRoutes = await getPrerenderRoutes();

  return {
    plugins: [
      react(),
      tailwindcss(),
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
          renderedRoute.route = renderedRoute.originalRoute || renderedRoute.route;
          renderedRoute.html = applySeoToHtml(
            renderedRoute.html || "",
            renderedRoute.route || "/",
          );
          return renderedRoute;
        },
      }),
    ],
    server: {
      port: 3000,
      host: true,
    },
    base: "/",
  };
});
