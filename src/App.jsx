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
const DEFAULT_SEO_DESCRIPTION =
  "Compare smartphones, laptops, TVs, and networking devices with specs, variants, pricing insights, and trend signals on Hook.";

const normalizeSeoPath = (pathname) => {
  if (!pathname) return "/";
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
};

const toCanonicalPath = (path) => {
  if (path === "/career") return "/careers";
  if (path === "/trending") return "/trending/smartphones";

  if (path === "/mobiles") return "/smartphones";
  if (path.startsWith("/products/smartphones")) {
    return path.replace("/products/smartphones", "/smartphones");
  }
  if (path.startsWith("/devices/smartphones")) {
    return path.replace("/devices/smartphones", "/smartphones");
  }

  if (path.startsWith("/products/laptops")) {
    return path.replace("/products/laptops", "/laptops");
  }
  if (path.startsWith("/devices/laptops")) {
    return path.replace("/devices/laptops", "/laptops");
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

  return path;
};

const resolveSeoMeta = (pathname) => {
  const path = normalizeSeoPath(pathname);
  const canonicalPath = toCanonicalPath(path);

  const rules = [
    {
      test: (p) => p === "/",
      title: "Hook | Compare Smartphones, Laptops, TVs & Networking Devices",
      description:
        "Explore and compare smartphones, laptops, TVs, and networking devices with clear specs, pricing, and trend insights.",
    },
    {
      test: (p) => p.startsWith("/smartphones") || p === "/mobiles",
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
      test: (p) => p.startsWith("/tvs") || p.startsWith("/appliances"),
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
      test: (p) => p.startsWith("/careers") || p.startsWith("/career"),
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
    {
      test: (p) =>
        p.startsWith("/account") ||
        p.startsWith("/wishlist") ||
        p.startsWith("/login") ||
        p.startsWith("/signup"),
      title: "Hook Account",
      description: "Secure account pages for your Hook profile and saved data.",
      robots: "noindex, nofollow",
    },
  ];

  const matched = rules.find((rule) => rule.test(canonicalPath));

  return {
    path,
    canonicalPath,
    title: matched?.title || "Hook | Smart Device Comparison Platform",
    description: matched?.description || DEFAULT_SEO_DESCRIPTION,
    robots: matched?.robots || "index, follow",
  };
};

const RouteSeoFallback = () => {
  const { pathname } = useLocation();
  const seo = resolveSeoMeta(pathname);
  const canonicalUrl = `${SITE_ORIGIN}${seo.canonicalPath}`;

  return (
    <Helmet prioritizeSeoTags>
      <title>{seo.title}</title>
      <meta name="description" content={seo.description} />
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
        return <Smartphones />;
      case "laptops":
        return <Laptops />;
      case "tvs":
      case "tv":
      case "television":
      case "televisions":
        return <TVs />;
      case "appliances":
        return <Navigate to={`/products/tvs${location.search || ""}`} replace />;
      case "networking":
        return <Networking />;
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
          <Route path="/products" element={<Smartphones />} />
          <Route path="/products/:category" element={<CategoryRouter />} />

          {/* Category shortcuts */}
          <Route path="/mobiles" element={<Smartphones />} />
          <Route path="/devices/smartphones" element={<Smartphones />} />
          <Route path="/devices/laptops" element={<Laptops />} />
          <Route path="/devices/tvs" element={<TVs />} />
          <Route path="/devices/appliances" element={<AppliancesListRedirect />} />
          <Route path="/devices/networking" element={<Networking />} />

          {/* Product Detail Pages - SEO-friendly slug-based routes */}
          <Route path="/smartphones/:slug" element={<MobileDetailCard />} />
          <Route path="/laptops/:slug" element={<LaptopDetailCard />} />
          <Route path="/tvs/:slug" element={<TVDetailCard />} />
          <Route path="/appliances/:slug" element={<AppliancesDetailRedirect />} />
          <Route path="/networking/:slug" element={<NetworkingDetailCard />} />

          {/* Comparison */}
          <Route path="/compare" element={<DeviceComparison />} />

          {/* Placeholder routes for footer links (can be implemented later) */}
          <Route
            path="/about"
            element={<About />}
          />
          <Route path="/careers" element={<Careers />} />
          <Route path="/career" element={<Navigate to="/careers" replace />} />
          <Route
            path="/contact"
            element={<Contact />}
          />
          <Route
            path="/privacy-policy"
            element={<PrivacyPolicy />}
          />
          <Route
            path="/terms"
            element={<Terms />}
          />

          {/* 404 Fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      <Footer />
    </Router>
  );
}

export default App;
