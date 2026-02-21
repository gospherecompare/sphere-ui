import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const vitePrerender = require("vite-plugin-prerender");
const Renderer = vitePrerender.PuppeteerRenderer;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SITE_ORIGIN = "https://tryhook.shop";

const prerenderRoutes = [
  "/",
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
];

const normalizePath = (routePath = "/") => {
  if (!routePath) return "/";
  if (routePath.length > 1 && routePath.endsWith("/")) {
    return routePath.slice(0, -1);
  }
  return routePath;
};

const toCanonicalPath = (rawPath) => {
  const pathName = normalizePath(rawPath);
  if (pathName === "/career") return "/careers";
  if (pathName === "/trending") return "/trending/smartphones";
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

const resolveSeo = (routePath) => {
  const canonicalPath = toCanonicalPath(routePath);
  const rules = [
    {
      test: (p) => p === "/",
      title: "Hook | Compare Smartphones, Laptops, TVs & Networking Devices",
      description:
        "Explore and compare smartphones, laptops, TVs, and networking devices with clear specs, pricing, and trend insights.",
    },
    {
      test: (p) => p.startsWith("/smartphones"),
      title: "Smartphones - Compare Prices, Specs & Variants | Hook",
      description:
        "Compare smartphones by price, RAM/ROM variants, camera, battery, and performance. Find trending and latest mobile launches on Hook.",
    },
    {
      test: (p) => p.startsWith("/laptops"),
      title: "Laptops - Compare Models, Prices & Specifications | Hook",
      description:
        "Discover and compare laptops by processor, RAM, storage, display, and price. View current deals and top laptop picks on Hook.",
    },
    {
      test: (p) => p.startsWith("/tvs"),
      title: "TVs - Compare Screen Sizes, Specs & Prices | Hook",
      description:
        "Compare TVs across 43, 55, 65, and larger screen sizes with full specifications, variant pricing, and store availability on Hook.",
    },
    {
      test: (p) => p.startsWith("/networking"),
      title: "Networking Devices - Compare Routers & More | Hook",
      description:
        "Compare routers and networking products with speed, band, and connectivity specs to choose the right setup for your needs.",
    },
    {
      test: (p) => p.startsWith("/compare"),
      title: "Device Comparison - Side by Side Specs & Prices | Hook",
      description:
        "Compare devices side by side with full specs, pricing, and feature differences to make faster buying decisions.",
    },
    {
      test: (p) => p.startsWith("/trending"),
      title: "Trending Devices - Smartphones, Laptops & TVs | Hook",
      description:
        "Track trending smartphones, laptops, and TVs based on momentum and user interest to spot what is hot right now.",
    },
    {
      test: (p) => p.startsWith("/careers"),
      title: "Careers at Hook | Apply for Open Roles",
      description:
        "Apply for frontend, backend, content developer, and fullstack opportunities at Hook through a simple step-by-step application form.",
    },
    {
      test: (p) => p.startsWith("/about"),
      title: "About Hook | Product Discovery & Comparison Platform",
      description:
        "Learn about Hook, our mission, and how we help users compare technology products with structured and transparent information.",
    },
    {
      test: (p) => p.startsWith("/contact"),
      title: "Contact Hook | Support, Partnerships & Press",
      description:
        "Contact Hook for product support, partnerships, and press queries. Reach the team through verified contact channels.",
    },
    {
      test: (p) => p.startsWith("/privacy-policy"),
      title: "Privacy Policy | Hook",
      description:
        "Read Hook privacy policy to understand what data we collect, why we collect it, and how you can control your information.",
    },
    {
      test: (p) => p.startsWith("/terms"),
      title: "Terms of Use | Hook",
      description:
        "Read Hook terms of use covering platform usage, content accuracy, and service limitations.",
    },
  ];

  const matched = rules.find((rule) => rule.test(canonicalPath));
  return {
    canonicalPath,
    title: matched?.title || "Hook | Smart Device Comparison Platform",
    description:
      matched?.description ||
      "Compare smartphones, laptops, TVs, and networking devices with specs, variants, pricing insights, and trend signals on Hook.",
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
    /<meta\s+name=["']description["'][^>]*>/i,
    `<meta name="description" content="${escapeHtml(seo.description)}">`,
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

export default defineConfig({
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
});
