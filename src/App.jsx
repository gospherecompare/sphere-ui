// src/App.jsx
import React from "react";
import Header from "./components/Home/Header";
import ScrollToTop from "./components/ScrollToTop";
import Footer from "./components/Home/Footer";
import Home from "./components/Home/Home";
import Smartphones from "./components/Product/Smartphones";
import UpcomingSmartphonesList from "./components/Product/UpcomingSmartphonesList";
import Laptops from "./components/Product/Laptops";
import Networking from "./components/Product/Networking";
import TVs from "./components/Product/TVs";
import TrendingProductsHub from "./components/Product/TrendingProductsHub";
import PopularComparisonsPage from "./components/PopularComparisonsPage";
import DeviceComparison from "./components/compare";
import Breadcrumbs from "./components/Breadcrumbs";
// BannerSlot disabled until completed.
import About from "./components/Static/About";
import Careers from "./components/Static/Careers";
import Contact from "./components/Static/Contact";
import NewsArticlesPage from "./components/Static/NewsArticlesPage";
import NewsStoryPage from "./components/Static/NewsStoryPage";
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
import { useDevice } from "./hooks/useDevice";
import {
  createOrganizationSchema,
  createWebsiteSchema,
} from "./utils/schemaGenerators";
import { normalizeSeoTitle } from "./utils/seoTitle";
import {
  buildSmartphoneBrandPath,
  buildSmartphoneListingPath,
} from "./utils/smartphoneListingRoutes";

const SITE_ORIGIN = "https://tryhook.shop";
const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/hook-logo.svg`;
const CURRENT_YEAR = new Date().getFullYear();
const CURRENT_MONTH_YEAR = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "numeric",
}).format(new Date());
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
  if (pathname === "/smartphones/latest") return "/smartphones/filter/new";
  if (pathname === "/smartphones/top") return "/trending/smartphones";
  return pathname;
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

const getCatalogBasePath = (value = "") => {
  const text = String(value || "")
    .toLowerCase()
    .trim();
  if (text.includes("laptop") || text.includes("computer")) return "/laptops";
  if (
    text.includes("television") ||
    text === "tv" ||
    text === "tvs" ||
    text.includes("appliance") ||
    text.includes("home")
  ) {
    return "/tvs";
  }
  if (
    text.includes("network") ||
    text.includes("router") ||
    text.includes("wifi")
  ) {
    return "/networking";
  }
  return "/smartphones";
};

const toSeoTextWithoutCommas = (value = "") =>
  String(value || "").replace(/,/g, "");

const toCanonicalPath = (path) => {
  if (path === "/smartphones/upcoming") return "/smartphones/upcoming";
  if (path.startsWith("/smartphones/filter/upcoming"))
    return "/smartphones/upcoming";
  if (path.startsWith("/devices/smartphones/upcoming"))
    return "/smartphones/upcoming";
  if (path.startsWith("/devices/mobiles/upcoming"))
    return "/smartphones/upcoming";
  if (path === "/career") return "/careers";
  if (path === "/articles") return "/news";
  if (path.startsWith("/articles/")) return "/news";
  if (path === "/blog" || path === "/blogs") return "/news";
  if (path.startsWith("/blog/") || path.startsWith("/blogs/")) return "/news";
  if (path === "/trending") return "/trending/smartphones";
  if (path === "/trending/smartphone") return "/trending/smartphones";
  if (path === "/trending/laptop") return "/trending/laptops";
  if (path === "/trending/tv") return "/trending/tvs";
  if (path === "/devices") return "/smartphones";
  if (path === "/laptop") return "/laptops";
  if (path.startsWith("/laptop/")) {
    return path.replace("/laptop/", "/laptops/");
  }

  if (path === "/mobiles") return "/smartphones";
  if (path.startsWith("/devices/mobiles")) {
    return ensureSmartphoneSeoDetailPath(
      path.replace("/devices/mobiles", "/smartphones"),
    );
  }
  if (path.startsWith("/devices/smartphones")) {
    return ensureSmartphoneSeoDetailPath(
      path.replace("/devices/smartphones", "/smartphones"),
    );
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
  if (path.startsWith("/devices/tvs")) {
    return path.replace("/devices/tvs", "/tvs");
  }
  if (path.startsWith("/devices/appliances")) {
    return path.replace("/devices/appliances", "/tvs");
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
  const smartphoneFilterSlug = (() => {
    const match = canonicalPath.match(/^\/smartphones\/filter\/([^/]+)$/i);
    if (!match) return "";
    return String(match[1] || "").toLowerCase();
  })();
  const smartphoneFilterMeta =
    smartphoneFilterSlug && SMARTPHONE_FILTER_SEO[smartphoneFilterSlug]
      ? SMARTPHONE_FILTER_SEO[smartphoneFilterSlug]
      : null;
  const smartphoneFilterSeoLabel = smartphoneFilterMeta
    ? toSeoTextWithoutCommas(smartphoneFilterMeta.label)
    : "";

  const rules = [
    {
      test: (p) => p.startsWith("/news"),
      title:
        "News & Articles - Latest Mobile News, Gadget Guides & Launch Updates - Hooks",
      description:
        "Browse the latest mobile news, gadget updates, launch coverage, and editorial guides on Hooks.",
      keywords:
        "news and articles, mobile news, gadget news, launch updates, tech guides, latest gadgets india, smartphone news india",
    },
    {
      test: (p) => p === "/",
      title:
        "Compare Smartphones, Laptops & TVs in India - Specs, Prices & Reviews - Hooks",
      description:
        "Compare smartphones, laptops, TVs, and networking devices in India with specs, prices, variants, and trend insights. Discover latest launches on Hooks.",
      keywords: `hooks, best gadget comparison site, mobile price comparison india, compare laptops smartphones tvs, latest smartphones in india ${CURRENT_YEAR}, best smartphones in ${CURRENT_YEAR}, latest laptops in india ${CURRENT_YEAR}, latest smart tvs in india ${CURRENT_YEAR}, new launch and trending gadgets, top selling gadgets india, compare specs`,
    },
    {
      test: () => Boolean(smartphoneDetailName),
      title: `${smartphoneDetailName} Price, Specs & Comparison in India (${CURRENT_MONTH_YEAR}) - Hooks`,
      description: `Compare ${smartphoneDetailName} price in India, full specifications, variants, and launch details on Hooks.`,
      keywords: `${smartphoneDetailName.toLowerCase()}, ${smartphoneDetailName.toLowerCase()} price in india, ${smartphoneDetailName.toLowerCase()} specifications, ${smartphoneDetailName.toLowerCase()} launch date, compare smartphones, mobile price comparison india`,
    },
    {
      test: () => Boolean(laptopDetailName),
      title: `${laptopDetailName} Price, Specs & Comparison in India (${CURRENT_MONTH_YEAR}) - Hooks`,
      description: `Compare ${laptopDetailName} laptop price in India, full specifications, variants, and best store offers on Hooks.`,
      keywords: `${laptopDetailName.toLowerCase()}, ${laptopDetailName.toLowerCase()} price in india, ${laptopDetailName.toLowerCase()} specs, compare laptops india, laptop prices list ${CURRENT_YEAR}`,
    },
    {
      test: () => Boolean(tvDetailName),
      title: `${tvDetailName} Price, Specs & TV Comparison in India (${CURRENT_MONTH_YEAR}) - Hooks`,
      description: `Compare ${tvDetailName} TV price in India, size variants, display specs, smart features, and store offers on Hooks.`,
      keywords: `${tvDetailName.toLowerCase()}, ${tvDetailName.toLowerCase()} tv price in india, ${tvDetailName.toLowerCase()} specifications, smart tv comparison india, tv prices list ${CURRENT_YEAR}`,
    },
    {
      test: (p) => p === "/smartphones/upcoming",
      title: `Upcoming Smartphones (${CURRENT_MONTH_YEAR}) - Expected Launches & Preorders - Hooks`,
      description:
        "Track upcoming smartphones, expected launch timelines, and preorder-ready devices to plan your next upgrade.",
      keywords: `upcoming smartphones ${CURRENT_YEAR}, preorder phones, expected launch mobiles, new launch phones, smartphones launch calendar india`,
    },
    {
      test: () => Boolean(smartphoneFilterMeta),
      title:
        smartphoneFilterSlug === "new"
          ? `Latest Smartphones (${CURRENT_MONTH_YEAR}) - New Launches & Prices - Hooks`
          : `Best Smartphones ${smartphoneFilterSeoLabel} (${CURRENT_MONTH_YEAR}) - Reviews Specs & Deals - Hooks`,
      description:
        smartphoneFilterSlug === "new"
          ? "Discover newly launched smartphones with updated prices, full specifications, and reviews. Stay updated with the latest mobile releases on Hooks."
          : `Explore the best smartphones ${String(
              smartphoneFilterSeoLabel || "",
            ).toLowerCase()} with detailed specs latest prices reviews and comparisons to choose the right phone for your budget.`,
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
      test: (p) => p.startsWith("/smartphones") || p === "/mobiles",
      title: `Best Smartphones (${CURRENT_MONTH_YEAR}) - Compare Prices, Specs & Variants - Hooks`,
      description:
        "Compare smartphones by price, RAM/ROM variants, camera, battery, and performance. Find trending and latest mobile launches on Hooks.",
      keywords: `smartphones, latest smartphones in india ${CURRENT_YEAR}, best smartphones in ${CURRENT_YEAR}, new launch mobiles, trending phone in india, most popular mobiles, mobile price comparison india, moblie price comparison india, compare smartphone specs, compare smartphone prices, 5g phones in india, ai phone, ai budget phone, ${BUDGET_PHONE_KEYWORDS}`,
    },
    {
      test: (p) => p.startsWith("/laptops"),
      title: `Best Laptops (${CURRENT_MONTH_YEAR}) - Compare Models, Prices & Specifications - Hooks`,
      description:
        "Discover and compare laptops by processor, RAM, storage, display, and price. View current deals and top laptop picks on Hooks.",
      keywords: `laptops, latest laptops in india ${CURRENT_YEAR}, laptop prices list ${CURRENT_YEAR}, compare laptops india, laptop comparison site, laptop compare specs, gaming laptops india, student laptops india, productivity laptops, vacuum cooler laptop and phone`,
    },
    {
      test: (p) => p.startsWith("/tvs") || p.startsWith("/appliances"),
      title: `Best TVs (${CURRENT_MONTH_YEAR}) - Compare Screen Sizes, Specs & Prices - Hooks`,
      description:
        "Compare TVs across 43, 55, 65, and larger screen sizes with full specifications, variant pricing, and store availability on Hooks.",
      keywords: `tvs, latest smart tvs in india ${CURRENT_YEAR}, tv prices list ${CURRENT_YEAR}, smart tv comparison india, compare tv prices india, compare tv specs, 43 inch tv, 55 inch tv, 65 inch tv, 75 inch tv, best 4k tv india, best 8k tv india, oled tv india, android tv price india, led tv under 30000`,
    },
    {
      test: (p) => p.startsWith("/networking"),
      title: `Networking Devices (${CURRENT_MONTH_YEAR}) - Compare Routers & More - Hooks`,
      description:
        "Compare routers and networking products with speed, band, and connectivity specs to choose the right setup for your needs.",
      keywords:
        "networking devices, routers, wifi routers, dual band router, compare routers, modem router specs",
    },
    {
      test: (p) => p.startsWith("/compare"),
      title: "Device Comparison - Side by Side Specs & Prices - Hooks",
      description:
        "Compare devices side by side with full specs, pricing, and feature differences to make faster buying decisions.",
      keywords:
        "device comparison, compare smartphones laptops tvs, compare smartphone tv laptops, compare spec online, compare prices india, side by side comparison, best gadget comparison site",
    },
    {
      test: (p) => p.startsWith("/trending"),
      title: `Trending Devices (${CURRENT_MONTH_YEAR}) - Smartphones, Laptops & TVs - Hooks`,
      description:
        "Track trending smartphones, laptops, and TVs based on momentum and user interest to spot what is hot right now.",
      keywords: `trending smartphones india, trending laptops india, trending tvs india, trending phone in india, most popular mobiles, top selling gadgets india, new launch and trending devices, latest smartphones in india ${CURRENT_YEAR}`,
    },
    {
      test: (p) => p.startsWith("/careers") || p.startsWith("/career"),
      title: "Careers at Hooks - Join Hooks Team",
      description:
        "Apply for frontend, backend, content developer, and fullstack opportunities at Hooks through a simple step-by-step application form.",
      keywords:
        "careers at hooks, frontend jobs, backend jobs, fullstack jobs, content developer jobs, tech careers",
    },
    {
      test: (p) => p.startsWith("/about"),
      title: "About Hooks - Product Discovery & Comparison Platform",
      description:
        "Learn about Hooks, our mission, and how we help users compare technology products with structured and transparent information.",
      keywords:
        "about hooks, product comparison platform, technology discovery, gadget research platform",
    },
    {
      test: (p) => p.startsWith("/contact"),
      title: "Contact Hooks - Support, Partnerships & Press",
      description:
        "Contact Hooks for product support, partnerships, and press queries. Reach the team through verified contact channels.",
      keywords:
        "contact hooks, support hooks, partnerships, press inquiries, hooks contact details",
    },
    {
      test: (p) => p.startsWith("/privacy-policy"),
      title: "Privacy Policy - Hooks",
      description:
        "Read Hooks privacy policy to understand what data we collect, why we collect it, and how you can control your information.",
      keywords:
        "privacy policy, data privacy, hooks policy, personal data rights",
    },
    {
      test: (p) => p.startsWith("/terms"),
      title: "Terms of Use - Hooks",
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
      description:
        "Secure account pages for your Hooks profile and saved data.",
      keywords: "hooks account, user account, login, signup, wishlist",
      robots: "noindex, nofollow",
    },
  ];

  const matched = rules.find((rule) => rule.test(canonicalPath));

  return {
    path,
    canonicalPath,
    title: matched?.title || "Hooks - Smart Device Comparison Platform",
    description: matched?.description || DEFAULT_SEO_DESCRIPTION,
    keywords: matched?.keywords || DEFAULT_SEO_KEYWORDS,
    robots: matched?.robots || "index, follow",
  };
};

const RouteSeoFallback = () => {
  const { pathname } = useLocation();

  // Initialize all hooks before any conditional returns
  const seo = resolveSeoMeta(pathname);
  const canonicalUrl = `${SITE_ORIGIN}${seo.canonicalPath}`;
  const normalizedTitle = normalizeSeoTitle(seo.title);
  const schemaJson = React.useMemo(() => {
    if (seo.canonicalPath === "/") {
      return JSON.stringify([
        createWebsiteSchema(),
        createOrganizationSchema(),
      ]);
    }
    return null;
  }, [seo.canonicalPath]);

  // Skip product pages - let component Helmet handle SEO
  if (pathname.startsWith("/compare")) return null;
  if (pathname.startsWith("/popular-comparisons")) return null;
  if (pathname.startsWith("/news")) return null;
  if (pathname.startsWith("/smartphones")) return null;
  if (pathname.startsWith("/laptops")) return null;
  if (pathname.startsWith("/tvs")) return null;
  if (pathname.startsWith("/networking")) return null;
  if (pathname.startsWith("/trending")) return null;
  if (pathname.startsWith("/devices")) return null;
  if (pathname.startsWith("/mobiles")) return null;
  if (pathname.startsWith("/about")) return null;
  if (pathname.startsWith("/contact")) return null;
  if (pathname.startsWith("/privacy-policy")) return null;
  if (pathname.startsWith("/terms")) return null;
  if (pathname.startsWith("/careers")) return null;

  return (
    <Helmet prioritizeSeoTags>
      <title>{normalizedTitle}</title>
      <meta name="description" content={seo.description} />
      <meta name="keywords" content={seo.keywords} />
      <meta name="robots" content={seo.robots} />
      <link rel="canonical" href={canonicalUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={normalizedTitle} />
      <meta property="og:description" content={seo.description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={DEFAULT_OG_IMAGE} />
      <meta property="og:image:secure_url" content={DEFAULT_OG_IMAGE} />
      <meta property="og:image:type" content="image/svg+xml" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="Hooks preview image" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={normalizedTitle} />
      <meta name="twitter:description" content={seo.description} />
      <meta name="twitter:image" content={DEFAULT_OG_IMAGE} />
      <meta name="twitter:image:alt" content="Hooks preview image" />
      {schemaJson && <script type="application/ld+json">{schemaJson}</script>}
    </Helmet>
  );
};

function App() {
  const NewsRedirect = () => <Navigate to="/news" replace />;

  const AppliancesListRedirect = () => {
    const location = useLocation();
    return <Navigate to={`/tvs${location.search || ""}`} replace />;
  };

  const LegacySearchRedirect = () => {
    const location = useLocation();
    return <Navigate to={`/smartphones${location.search || ""}`} replace />;
  };

  const BrandsRedirect = () => {
    const location = useLocation();
    return <Navigate to={`/smartphones${location.search || ""}`} replace />;
  };

  const BrandLandingRedirect = () => {
    const { slug = "" } = useParams();
    const location = useLocation();
    const deviceContext = useDevice();
    const brands = Array.isArray(deviceContext?.brands)
      ? deviceContext.brands
      : [];
    const normalizedSlug = String(slug || "")
      .toLowerCase()
      .trim();

    const matchedBrand =
      brands.find((brand) => {
        const name = String(brand?.name || "")
          .toLowerCase()
          .trim();
        const brandSlug = String(brand?.slug || brand?.name || brand?.id || "")
          .toLowerCase()
          .trim()
          .replace(/\s+/g, "-");
        return (
          normalizedSlug === brandSlug ||
          normalizedSlug === name ||
          normalizedSlug === name.replace(/\s+/g, "-")
        );
      }) || null;

    const brandName = matchedBrand?.name || toReadableTitleFromSlug(slug);
    const targetPath = getCatalogBasePath(
      matchedBrand?.category ||
        matchedBrand?.product_type ||
        matchedBrand?.type,
    );
    const params = new URLSearchParams(location.search || "");
    if (targetPath === "/smartphones") {
      params.delete("brand");
      const query = params.toString();
      return (
        <Navigate
          to={buildSmartphoneBrandPath(
            matchedBrand?.slug || brandName || slug,
            query,
          )}
          replace
        />
      );
    }

    if (brandName && !params.get("brand")) {
      params.set("brand", brandName);
    }
    const query = params.toString();
    return <Navigate to={`${targetPath}${query ? `?${query}` : ""}`} replace />;
  };

  const SmartphoneListingOrderRedirect = () => {
    const { brandSlug = "", featureSlug = "" } = useParams();
    const location = useLocation();
    const query = location.search ? location.search.slice(1) : "";
    return (
      <Navigate
        to={buildSmartphoneListingPath({
          brand: brandSlug,
          feature: featureSlug,
          query,
        })}
        replace
      />
    );
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
      <div className="min-h-screen w-full overflow-x-hidden ">
        <Header />

        <ScrollToTop />
        <aside className="hidden xl:block absolute right-45 top-20 h-40 z-30 w-[170px]">
          {/* BannerSlot disabled (incomplete). */}
        </aside>
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
          <Route path="/search" element={<LegacySearchRedirect />} />
          <Route path="/brands" element={<BrandsRedirect />} />
          <Route path="/brand/:slug" element={<BrandLandingRedirect />} />
          <Route path="/smartphones" element={<Smartphones />} />
          <Route
            path="/smartphones/feature/:featureSlug/brand/:brandSlug"
            element={<SmartphoneListingOrderRedirect />}
          />
          <Route
            path="/smartphones/brand/:brandSlug/feature/:featureSlug"
            element={<Smartphones />}
          />
          <Route
            path="/smartphones/brand/:brandSlug"
            element={<Smartphones />}
          />
          <Route
            path="/smartphones/feature/:featureSlug"
            element={<Smartphones />}
          />
          <Route
            path="/smartphones/upcoming"
            element={<UpcomingSmartphonesList />}
          />
          <Route
            path="/smartphones/filter/:filterSlug"
            element={<Smartphones />}
          />
          <Route
            path="/smartphones/latest"
            element={<Navigate to="/smartphones/filter/new" replace />}
          />
          <Route
            path="/smartphones/top"
            element={<Navigate to="/trending/smartphones" replace />}
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

          <Route
            path="/devices/smartphones/:slug"
            element={<ProductDetailRedirect toBasePath="/smartphones" />}
          />
          <Route
            path="/devices/mobiles/:slug"
            element={<ProductDetailRedirect toBasePath="/smartphones" />}
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
            path="/devices/tvs/:slug"
            element={<ProductDetailRedirect toBasePath="/tvs" />}
          />
          <Route
            path="/devices/appliances/:slug"
            element={<ProductDetailRedirect toBasePath="/tvs" />}
          />

          {/* Comparison */}
          <Route path="/compare/:compareSlug" element={<DeviceComparison />} />
          <Route path="/compare" element={<DeviceComparison />} />
          <Route
            path="/popular-comparisons"
            element={<PopularComparisonsPage />}
          />

          {/* Placeholder routes for footer links (can be implemented later) */}
          <Route path="/about" element={<About />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/career" element={<Navigate to="/careers" replace />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/news/:slug" element={<NewsStoryPage />} />
          <Route path="/news" element={<NewsArticlesPage />} />
          <Route path="/articles" element={<NewsRedirect />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/blogs" element={<NewsRedirect />} />
          <Route path="/blogs/:slug" element={<NewsRedirect />} />
          <Route path="/blog" element={<NewsRedirect />} />
          <Route path="/blog/:slug" element={<NewsRedirect />} />

          {/* 404 Fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Breadcrumbs />
        {/* BannerSlot disabled (incomplete). */}
        <Footer />
        {/* BannerSlot disabled (incomplete). */}
      </div>
    </Router>
  );
}

export default App;
