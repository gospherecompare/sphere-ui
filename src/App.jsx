// src/App.jsx
import React from "react";
import Header from "./components/Home/Header";
import ScrollToTop from "./components/ScrollToTop";
import Footer from "./components/Home/Footer";
import Home from "./components/Home/Home";
import Smartphones from "./components/Product/Smartphones";
import Laptops from "./components/Product/Laptops";
import Networking from "./components/Product/Networking";
import TVs from "./components/Product/TVs";
import TrendingProductsHub from "./components/Product/TrendingProductsHub";
import DeviceComparison from "./components/compare";
import Breadcrumbs from "./components/Breadcrumbs";
import About from "./components/Static/About";
import Careers from "./components/Static/Careers";
import Contact from "./components/Static/Contact";
import PrivacyPolicy from "./components/Static/PrivacyPolicy";
import Terms from "./components/Static/Terms";
import NotFound from "./components/Static/NotFound";
import {
  Route,
  Routes,
  BrowserRouter as Router,
  Navigate,
  useLocation,
  useParams,
} from "react-router-dom";
import { Helmet } from "react-helmet-async";
import MobileDetailCard from "./components/Device detail/Smartphone";
import MobileCompare from "./components/compare";
import Login from "./components/Auths/Login";
import Signup from "./components/Auths/Signup";
import TVDetailCard from "./components/Device detail/TV";
import LaptopDetailCard from "./components/Device detail/Laptop";
import NetworkingDetailCard from "./components/Device detail/Network";
import Wishlist from "./components/Wishlist";
import AccountManagement from "./components/AccountManagement";

const SITE_ORIGIN = "https://tryhook.shop";
const CURRENT_YEAR = new Date().getFullYear();
const SMARTPHONE_SEO_SUFFIX = "-price-in-india";
const DEFAULT_SEO_DESCRIPTION =
  "Compare smartphones, laptops, TVs, and networking devices with specs, variants, pricing insights, and trend signals on Hooks.";
const BUDGET_PHONE_KEYWORDS =
  "budget phones under 10000, budget phones under 15000, budget phones under 20000, budget phones under 30000, budget phones under 50000";
const DEFAULT_SEO_KEYWORDS = `hooks, best gadget comparison site, mobile price comparison india, moblie price comparison india, compare laptops smartphones tvs, compare smartphone tv laptops, compare specs, latest smartphones in india ${CURRENT_YEAR}, best smartphones in ${CURRENT_YEAR}, new launch phones, trending phone in india, most popular mobiles, top selling gadgets india, 5g phones in india, ai phones in india, ${BUDGET_PHONE_KEYWORDS}, latest laptops in india ${CURRENT_YEAR}, laptop prices list ${CURRENT_YEAR}, gaming laptops india, student laptops india, laptop comparison india, vacuum cooler laptop and phone, latest smart tvs in india ${CURRENT_YEAR}, tv prices list ${CURRENT_YEAR}, best 4k tv india, best 8k tv india, oled tv india, android tv price india, led tv under 30000, smart tv comparison india`;

const normalizeSeoPath = (pathname) => {
  if (!pathname) return "/";
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
};

const stripSmartphoneSeoSuffix = (slug = "") => {
  const value = String(slug || "").toLowerCase().trim();
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
  const seoSlug = toSmartphoneSeoSlug(tail);
  return seoSlug ? `/smartphones/${seoSlug}` : path;
};

const toCanonicalPath = (path) => {
  if (path === "/career") return "/careers";
  if (path === "/blog") return "/blogs";
  if (path.startsWith("/blog/")) {
    return path.replace("/blog/", "/blogs/");
  }
  if (path === "/trending") return "/trending/smartphones";
  if (path === "/trending/smartphone") return "/trending/smartphones";
  if (path === "/trending/laptop") return "/trending/laptops";
  if (path === "/trending/tv") return "/trending/tvs";
  if (path === "/products" || path === "/products/mobiles")
    return "/smartphones";
  if (path === "/devices") return "/smartphones";
  if (path === "/laptop") return "/laptops";
  if (path.startsWith("/laptop/")) {
    return path.replace("/laptop/", "/laptops/");
  }

  if (path === "/mobiles") return "/smartphones";
  if (path.startsWith("/products/mobiles")) {
    return ensureSmartphoneSeoDetailPath(
      path.replace("/products/mobiles", "/smartphones"),
    );
  }
  if (path.startsWith("/devices/mobiles")) {
    return ensureSmartphoneSeoDetailPath(
      path.replace("/devices/mobiles", "/smartphones"),
    );
  }
  if (path.startsWith("/products/smartphones")) {
    return ensureSmartphoneSeoDetailPath(
      path.replace("/products/smartphones", "/smartphones"),
    );
  }
  if (path.startsWith("/devices/smartphones")) {
    return ensureSmartphoneSeoDetailPath(
      path.replace("/devices/smartphones", "/smartphones"),
    );
  }

  if (path.startsWith("/products/laptops")) {
    return path.replace("/products/laptops", "/laptops");
  }
  if (path.startsWith("/products/laptop")) {
    return path.replace("/products/laptop", "/laptops");
  }
  if (path.startsWith("/devices/laptops")) {
    return path.replace("/devices/laptops", "/laptops");
  }
  if (path.startsWith("/devices/laptop")) {
    return path.replace("/devices/laptop", "/laptops");
  }

  if (path === "/appliances") return "/tvs";
  if (path.startsWith("/appliances/")) {
    return path.replace("/appliances/", "/tvs/");
  }
  if (path.startsWith("/products/tvs")) {
    return path.replace("/products/tvs", "/tvs");
  }
  if (path.startsWith("/products/appliances")) {
    return path.replace("/products/appliances", "/tvs");
  }
  if (path.startsWith("/devices/tvs")) {
    return path.replace("/devices/tvs", "/tvs");
  }
  if (path.startsWith("/devices/appliances")) {
    return path.replace("/devices/appliances", "/tvs");
  }

  if (path.startsWith("/products/networking")) {
    return path.replace("/products/networking", "/networking");
  }
  if (path.startsWith("/devices/networking")) {
    return path.replace("/devices/networking", "/networking");
  }

  return ensureSmartphoneSeoDetailPath(path);
};

const toReadableTitleFromSlug = (slug = "") => {
  const raw = (() => {
    try {
      return decodeURIComponent(String(slug || ""));
    } catch {
      return String(slug || "");
    }
  })()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!raw) return "";
  return raw
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

const resolveSeoMeta = (pathname) => {
  const path = normalizeSeoPath(pathname);
  const canonicalPath = toCanonicalPath(path);
  const smartphoneDetailName = extractDetailSlugName(
    canonicalPath,
    "/smartphones/",
    stripSmartphoneSeoSuffix,
  );
  const laptopDetailName = extractDetailSlugName(canonicalPath, "/laptops/");
  const tvDetailName = extractDetailSlugName(canonicalPath, "/tvs/");
  const blogDetailName = extractDetailSlugName(canonicalPath, "/blogs/");

  const rules = [
    {
      test: (p) => p === "/",
      title: "Tech Reviews: Compare Smartphones, Laptops & TVs in India | Hooks",
      description:
        "Explore and compare smartphones, laptops, TVs, and networking devices with clear specs, pricing, and trend insights.",
      keywords: `hooks, best gadget comparison site, mobile price comparison india, compare laptops smartphones tvs, latest smartphones in india ${CURRENT_YEAR}, best smartphones in ${CURRENT_YEAR}, latest laptops in india ${CURRENT_YEAR}, latest smart tvs in india ${CURRENT_YEAR}, new launch and trending gadgets, top selling gadgets india, compare specs`,
    },
    {
      test: () => Boolean(smartphoneDetailName),
      title: `${smartphoneDetailName} Price, Specs & Comparison in India (${CURRENT_YEAR}) | Hooks`,
      description: `Compare ${smartphoneDetailName} price in India, full specifications, variants, launch details, and latest offers on Hooks.`,
      keywords: `${smartphoneDetailName.toLowerCase()}, ${smartphoneDetailName.toLowerCase()} price in india, ${smartphoneDetailName.toLowerCase()} specifications, ${smartphoneDetailName.toLowerCase()} launch date, compare smartphones, mobile price comparison india`,
    },
    {
      test: () => Boolean(laptopDetailName),
      title: `${laptopDetailName} Price, Specs & Comparison in India (${CURRENT_YEAR}) | Hooks`,
      description: `Compare ${laptopDetailName} laptop price in India, full specifications, variants, and best store offers on Hooks.`,
      keywords: `${laptopDetailName.toLowerCase()}, ${laptopDetailName.toLowerCase()} price in india, ${laptopDetailName.toLowerCase()} specs, compare laptops india, laptop prices list ${CURRENT_YEAR}`,
    },
    {
      test: () => Boolean(tvDetailName),
      title: `${tvDetailName} Price, Specs & TV Comparison in India (${CURRENT_YEAR}) | Hooks`,
      description: `Compare ${tvDetailName} TV price in India, size variants, display specs, smart features, and store offers on Hooks.`,
      keywords: `${tvDetailName.toLowerCase()}, ${tvDetailName.toLowerCase()} tv price in india, ${tvDetailName.toLowerCase()} specifications, smart tv comparison india, tv prices list ${CURRENT_YEAR}`,
    },
    {
      test: () => Boolean(blogDetailName),
      title: `${blogDetailName} | Hooks Blog`,
      description: `Read ${blogDetailName} and more product insights, specifications, and buying guidance on Hooks.`,
      keywords: `${blogDetailName.toLowerCase()}, hooks blog, gadget blog, product insights`,
    },
    {
      test: (p) => p.startsWith("/smartphones") || p === "/mobiles",
      title: "Smartphones - Compare Prices, Specs & Variants | Hooks",
      description:
        "Compare smartphones by price, RAM/ROM variants, camera, battery, and performance. Find trending and latest mobile launches on Hooks.",
      keywords: `smartphones, latest smartphones in india ${CURRENT_YEAR}, best smartphones in ${CURRENT_YEAR}, new launch mobiles, trending phone in india, most popular mobiles, mobile price comparison india, moblie price comparison india, compare smartphone specs, compare smartphone prices, 5g phones in india, ai phone, ai budget phone, ${BUDGET_PHONE_KEYWORDS}`,
    },
    {
      test: (p) => p.startsWith("/laptops"),
      title: "Laptops - Compare Models, Prices & Specifications | Hooks",
      description:
        "Discover and compare laptops by processor, RAM, storage, display, and price. View current deals and top laptop picks on Hooks.",
      keywords: `laptops, latest laptops in india ${CURRENT_YEAR}, laptop prices list ${CURRENT_YEAR}, compare laptops india, laptop comparison site, laptop compare specs, gaming laptops india, student laptops india, productivity laptops, vacuum cooler laptop and phone`,
    },
    {
      test: (p) => p.startsWith("/tvs") || p.startsWith("/appliances"),
      title: "TVs - Compare Screen Sizes, Specs & Prices | Hooks",
      description:
        "Compare TVs across 43, 55, 65, and larger screen sizes with full specifications, variant pricing, and store availability on Hooks.",
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
      title: "Device Comparison - Side by Side Specs & Prices | Hooks",
      description:
        "Compare devices side by side with full specs, pricing, and feature differences to make faster buying decisions.",
      keywords:
        "device comparison, compare smartphones laptops tvs, compare smartphone tv laptops, compare spec online, compare prices india, side by side comparison, best gadget comparison site",
    },
    {
      test: (p) => p.startsWith("/trending"),
      title: "Trending Devices - Smartphones, Laptops & TVs | Hooks",
      description:
        "Track trending smartphones, laptops, and TVs based on momentum and user interest to spot what is hot right now.",
      keywords: `trending smartphones india, trending laptops india, trending tvs india, trending phone in india, most popular mobiles, top selling gadgets india, new launch and trending devices, latest smartphones in india ${CURRENT_YEAR}`,
    },
    {
      test: (p) => p.startsWith("/blogs") || p.startsWith("/blog"),
      title: "Hooks Blogs | Product Insights and Buying Guides",
      description:
        "Read Hooks blogs for smartphones, laptops, and TVs with practical product insights and buying guidance.",
      keywords:
        "hooks blogs, gadget blog india, smartphone blog, laptop blog, tv buying guide, product insights",
    },
    {
      test: (p) => p.startsWith("/careers") || p.startsWith("/career"),
      title: "Careers at Hooks | Join Hooks Team",
      description:
        "Apply for frontend, backend, content developer, and fullstack opportunities at Hooks through a simple step-by-step application form.",
      keywords:
        "careers at hooks, frontend jobs, backend jobs, fullstack jobs, content developer jobs, tech careers",
    },
    {
      test: (p) => p.startsWith("/about"),
      title: "About Hooks | Product Discovery & Comparison Platform",
      description:
        "Learn about Hooks, our mission, and how we help users compare technology products with structured and transparent information.",
      keywords:
        "about hooks, product comparison platform, technology discovery, gadget research platform",
    },
    {
      test: (p) => p.startsWith("/contact"),
      title: "Contact Hooks | Support, Partnerships & Press",
      description:
        "Contact Hooks for product support, partnerships, and press queries. Reach the team through verified contact channels.",
      keywords:
        "contact hooks, support hooks, partnerships, press inquiries, hooks contact details",
    },
    {
      test: (p) => p.startsWith("/privacy-policy"),
      title: "Privacy Policy | Hooks",
      description:
        "Read Hooks privacy policy to understand what data we collect, why we collect it, and how you can control your information.",
      keywords:
        "privacy policy, data privacy, hooks policy, personal data rights",
    },
    {
      test: (p) => p.startsWith("/terms"),
      title: "Terms of Use | Hooks",
      description:
        "Read Hooks terms of use covering platform usage, content accuracy, and service limitations.",
      keywords: "terms of use, hooks terms, website terms, usage policy",
    },
    {
      test: (p) =>
        p.startsWith("/account") ||
        p.startsWith("/wishlist") ||
        p.startsWith("/login") ||
        p.startsWith("/signup"),
      title: "Hooks Account",
      description: "Secure account pages for your Hooks profile and saved data.",
      keywords: "hooks account, user account, login, signup, wishlist",
      robots: "noindex, nofollow",
    },
  ];

  const matched = rules.find((rule) => rule.test(canonicalPath));

  return {
    path,
    canonicalPath,
    title: matched?.title || "Hooks | Smart Device Comparison Platform",
    description: matched?.description || DEFAULT_SEO_DESCRIPTION,
    keywords: matched?.keywords || DEFAULT_SEO_KEYWORDS,
    robots: matched?.robots || "index, follow",
  };
};

const RouteSeoFallback = () => {
  const { pathname } = useLocation();
  if (pathname.startsWith("/compare")) return null;
  const seo = resolveSeoMeta(pathname);
  const canonicalUrl = `${SITE_ORIGIN}${seo.canonicalPath}`;

  return (
    <Helmet prioritizeSeoTags>
      <title>{seo.title}</title>
      <meta name="description" content={seo.description} />
      <meta name="keywords" content={seo.keywords} />
      <meta name="robots" content={seo.robots} />
      <link rel="canonical" href={canonicalUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={seo.title} />
      <meta property="og:description" content={seo.description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={seo.title} />
      <meta name="twitter:description" content={seo.description} />
    </Helmet>
  );
};

function App() {
  // Router for /products/:category to keep SEO-friendly category paths
  const CategoryRouter = () => {
    const { category } = useParams();
    const location = useLocation();
    switch (category) {
      case "smartphones":
      case "mobiles":
        return <Navigate to={`/smartphones${location.search || ""}`} replace />;
      case "laptops":
      case "laptop":
        return <Navigate to={`/laptops${location.search || ""}`} replace />;
      case "tvs":
      case "tv":
      case "television":
      case "televisions":
        return <Navigate to={`/tvs${location.search || ""}`} replace />;
      case "appliances":
        return <Navigate to={`/tvs${location.search || ""}`} replace />;
      case "networking":
        return <Navigate to={`/networking${location.search || ""}`} replace />;
      default:
        return <NotFound />;
    }
  };

  const AppliancesListRedirect = () => {
    const location = useLocation();
    return <Navigate to={`/tvs${location.search || ""}`} replace />;
  };

  const AppliancesDetailRedirect = () => {
    const { slug } = useParams();
    const location = useLocation();
    return <Navigate to={`/tvs/${slug}${location.search || ""}`} replace />;
  };

  const ProductDetailRedirect = ({ toBasePath }) => {
    const { slug } = useParams();
    const location = useLocation();
    return (
      <Navigate to={`${toBasePath}/${slug}${location.search || ""}`} replace />
    );
  };

  return (
    <Router>
      <RouteSeoFallback />
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
        <Header />
        <ScrollToTop />
        <Breadcrumbs />
        <Routes>
          {/* Home */}
          <Route path="/" element={<Home />} />

          {/* Authentication */}
          <Route path="/login" element={<Login asPage />} />
          <Route path="/signup" element={<Signup asPage />} />

          {/* User Account */}
          <Route path="/account" element={<AccountManagement />} />
          <Route path="/wishlist" element={<Wishlist />} />

          {/* Product Listings - SEO friendly category paths */}
          <Route path="/smartphones" element={<Smartphones />} />
          <Route
            path="/smartphones/filter/:filterSlug"
            element={<Smartphones />}
          />
          <Route path="/laptops" element={<Laptops />} />
          <Route path="/laptop" element={<Navigate to="/laptops" replace />} />
          <Route path="/tvs" element={<TVs />} />
          <Route path="/appliances" element={<AppliancesListRedirect />} />
          <Route path="/networking" element={<Networking />} />

          {/* Unified Trending Product Explorer */}
          <Route
            path="/trending"
            element={<Navigate to="/trending/smartphones" replace />}
          />
          <Route path="/trending/:category" element={<TrendingProductsHub />} />

          {/* Support /products/:category SEO paths */}
          <Route
            path="/products"
            element={<Navigate to="/smartphones" replace />}
          />
          <Route path="/products/:category" element={<CategoryRouter />} />

          {/* Category shortcuts */}
          <Route path="/mobiles" element={<Smartphones />} />
          <Route path="/devices/smartphones" element={<Smartphones />} />
          <Route path="/devices/laptops" element={<Laptops />} />
          <Route
            path="/devices/laptop"
            element={<Navigate to="/laptops" replace />}
          />
          <Route path="/devices/tvs" element={<TVs />} />
          <Route
            path="/devices/appliances"
            element={<AppliancesListRedirect />}
          />
          <Route path="/devices/networking" element={<Networking />} />

          {/* Product Detail Pages - SEO-friendly slug-based routes */}
          <Route path="/smartphones/:slug" element={<MobileDetailCard />} />
          <Route path="/laptops/:slug" element={<LaptopDetailCard />} />
          <Route
            path="/laptop/:slug"
            element={<ProductDetailRedirect toBasePath="/laptops" />}
          />
          <Route path="/tvs/:slug" element={<TVDetailCard />} />
          <Route
            path="/appliances/:slug"
            element={<AppliancesDetailRedirect />}
          />
          <Route path="/networking/:slug" element={<NetworkingDetailCard />} />

          {/* Detail alias redirects to canonical SEO routes */}
          <Route
            path="/products/smartphones/:slug"
            element={<ProductDetailRedirect toBasePath="/smartphones" />}
          />
          <Route
            path="/products/mobiles/:slug"
            element={<ProductDetailRedirect toBasePath="/smartphones" />}
          />
          <Route
            path="/devices/smartphones/:slug"
            element={<ProductDetailRedirect toBasePath="/smartphones" />}
          />
          <Route
            path="/devices/mobiles/:slug"
            element={<ProductDetailRedirect toBasePath="/smartphones" />}
          />
          <Route
            path="/products/laptops/:slug"
            element={<ProductDetailRedirect toBasePath="/laptops" />}
          />
          <Route
            path="/products/laptop/:slug"
            element={<ProductDetailRedirect toBasePath="/laptops" />}
          />
          <Route
            path="/devices/laptops/:slug"
            element={<ProductDetailRedirect toBasePath="/laptops" />}
          />
          <Route
            path="/devices/laptop/:slug"
            element={<ProductDetailRedirect toBasePath="/laptops" />}
          />
          <Route
            path="/products/tvs/:slug"
            element={<ProductDetailRedirect toBasePath="/tvs" />}
          />
          <Route
            path="/products/appliances/:slug"
            element={<ProductDetailRedirect toBasePath="/tvs" />}
          />
          <Route
            path="/devices/tvs/:slug"
            element={<ProductDetailRedirect toBasePath="/tvs" />}
          />
          <Route
            path="/devices/appliances/:slug"
            element={<ProductDetailRedirect toBasePath="/tvs" />}
          />

          {/* Comparison */}
          <Route path="/compare/:leftSlug-vs-:rightSlug" element={<DeviceComparison />} />
          <Route path="/compare" element={<DeviceComparison />} />

          {/* Placeholder routes for footer links (can be implemented later) */}
          <Route path="/about" element={<About />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/career" element={<Navigate to="/careers" replace />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<Terms />} />

          {/* 404 Fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      <Footer />
    </Router>
  );
}

export default App;
