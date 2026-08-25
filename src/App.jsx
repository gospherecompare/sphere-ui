// src/App.jsx
import React from "react";
import Header from "./components/Home/Header";
import ScrollToTop from "./components/ScrollToTop";
import Footer from "./components/Home/Footer";
import Breadcrumbs from "./components/Breadcrumbs";
// BannerSlot disabled until completed.
import {
  Route,
  Routes,
  BrowserRouter as Router,
  Navigate,
  useLocation,
  useParams,
} from "react-router-dom";
import MobileBottomNavigation from "./components/ui/MobileBottomNavigation";
import AppPushOptInPrompt from "./components/ui/AppPushOptInPrompt";
import RouteExperience from "./components/ui/RouteExperience";
import { useDevice } from "./hooks/useDevice";
import {
  buildPublicSmartphoneBrandPath as buildSmartphoneBrandPath,
  buildPublicSmartphoneListingPath as buildSmartphoneListingPath,
} from "./utils/smartphoneListingRoutes";
import { toCanonicalPagePath } from "./utils/publicUrl";

const RouteBreadcrumbs = () => {
  const { pathname } = useLocation();
  const isSmartphoneDetailRoute =
    /^\/smartphones\/[^/]+-price-in-indi(?:a)?\/?$/i.test(pathname);
  const isTvDetailRoute = /^\/tvs\/[^/]+\/?$/i.test(pathname);
  const isSmartphonesCatalogRoute = /^\/smartphones\/?$/i.test(pathname);
  const isNewsRoute = /^\/news(?:\/|$)/i.test(pathname);

  if (
    isSmartphoneDetailRoute ||
    isTvDetailRoute ||
    isSmartphonesCatalogRoute ||
    isNewsRoute
  ) {
    return null;
  }

  return <Breadcrumbs />;
};

const Home = React.lazy(() => import("./components/Home/Home"));
const Smartphones = React.lazy(
  () => import("./components/Product/Smartphones"),
);
const UpcomingSmartphonesList = React.lazy(
  () => import("./components/Product/UpcomingSmartphonesList"),
);
const Networking = React.lazy(() => import("./components/Product/Networking"));
const TVs = React.lazy(() => import("./components/Product/TVs"));
const TrendingProductsHub = React.lazy(
  () => import("./components/Product/TrendingProductsHub"),
);
const PopularComparisonsPage = React.lazy(
  () => import("./components/PopularComparisonsPage"),
);
const DeviceComparison = React.lazy(() => import("./components/compare"));
const About = React.lazy(() => import("./components/Static/About"));
const Careers = React.lazy(() => import("./components/Static/Careers"));
const Contact = React.lazy(() => import("./components/Static/Contact"));
const NewsArticlesPage = React.lazy(
  () => import("./components/Static/NewsArticlesPage"),
);
const PrivacyPolicy = React.lazy(
  () => import("./components/Static/PrivacyPolicy.jsx"),
);
const Terms = React.lazy(() => import("./components/Static/Terms.jsx"));
const NotFound = React.lazy(() => import("./components/Static/NotFound"));
const MobileDetailCard = React.lazy(
  () => import("./components/Device detail/Smartphone"),
);
const TVDetailCard = React.lazy(() => import("./components/Device detail/TV"));
const NetworkingDetailCard = React.lazy(
  () => import("./components/Device detail/Network"),
);

const getCatalogBasePath = (value = "") => {
  const text = String(value || "")
    .toLowerCase()
    .trim();
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

function App() {
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
    const deviceContext = useDevice({ resources: ["brands"] });
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
    return (
      <Navigate
        to={toCanonicalPagePath(`${targetPath}${query ? `?${query}` : ""}`)}
        replace
      />
    );
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
    return <Navigate to={toCanonicalPagePath(`/tvs/${slug}`)} replace />;
  };

  const ProductDetailRedirect = ({ toBasePath, preserveSearch = true }) => {
    const { slug } = useParams();
    const location = useLocation();
    const search = preserveSearch ? location.search || "" : "";
    return (
      <Navigate
        to={toCanonicalPagePath(`${toBasePath}/${slug}${search}`)}
        replace
      />
    );
  };

  return (
    <Router>
      <RouteExperience />
      <AppPushOptInPrompt />
      <div className="hooks-app-shell min-h-screen w-full overflow-x-hidden pb-[calc(64px+env(safe-area-inset-bottom))] lg:pb-0">
        <Header />

        <ScrollToTop />
        <aside className="hidden xl:block absolute right-45 top-20 h-40 z-30 w-[170px]">
          {/* BannerSlot disabled (incomplete). */}
        </aside>
        <React.Suspense fallback={null}>
          <RouteBreadcrumbs />
          <Routes>
            {/* Home */}
            <Route path="/" element={<Home />} />

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
            <Route
              path="/smartphones/upcoming"
              element={<UpcomingSmartphonesList />}
            />
            <Route path="/tvs" element={<TVs />} />
            <Route path="/tvs/latest" element={<TVs />} />
            <Route path="/tvs/filter/:filterSlug" element={<TVs />} />
            <Route path="/tvs/features/:featureSlug" element={<TVs />} />
            <Route path="/appliances" element={<AppliancesListRedirect />} />
            <Route path="/networking" element={<Networking />} />

            {/* Unified Trending Product Explorer */}
            <Route
              path="/trending"
              element={<Navigate to="/trending/smartphones" replace />}
            />
            <Route path="/trending/smartphones" element={<Smartphones />} />
            <Route
              path="/trending/:category"
              element={<TrendingProductsHub />}
            />

            {/* Category shortcuts */}
            <Route path="/mobiles" element={<Smartphones />} />
            <Route path="/devices/smartphones" element={<Smartphones />} />
            <Route path="/devices/tvs" element={<TVs />} />
            <Route
              path="/devices/appliances"
              element={<AppliancesListRedirect />}
            />
            <Route path="/devices/networking" element={<Networking />} />

            {/* Product Detail Pages - SEO-friendly slug-based routes */}
            <Route path="/smartphones/:slug" element={<MobileDetailCard />} />
            <Route
              path="/smartphone/:slug"
              element={<ProductDetailRedirect toBasePath="/smartphones" />}
            />
            <Route path="/tvs/:slug" element={<TVDetailCard />} />
            <Route
              path="/appliances/:slug"
              element={<AppliancesDetailRedirect />}
            />
            <Route
              path="/networking/:slug"
              element={<NetworkingDetailCard />}
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
              path="/devices/tvs/:slug"
              element={
                <ProductDetailRedirect
                  toBasePath="/tvs"
                  preserveSearch={false}
                />
              }
            />
            <Route
              path="/devices/appliances/:slug"
              element={
                <ProductDetailRedirect
                  toBasePath="/tvs"
                  preserveSearch={false}
                />
              }
            />

            {/* Comparison */}
            <Route
              path="/compare/:compareSlug"
              element={<DeviceComparison />}
            />
            <Route path="/compare" element={<DeviceComparison />} />
            <Route
              path="/popular-comparisons"
              element={<PopularComparisonsPage />}
            />

            {/* Placeholder routes for footer links (can be implemented later) */}
            <Route path="/about" element={<About />} />
            <Route path="/careers" element={<Careers />} />
            <Route
              path="/career"
              element={<Navigate to="/careers" replace />}
            />
            <Route path="/contact" element={<Contact />} />
            <Route path="/news" element={<NewsArticlesPage />} />
            <Route path="/news/:slug" element={<NewsArticlesPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<Terms />} />

            {/* 404 Fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </React.Suspense>

        {/* BannerSlot disabled (incomplete). */}
        <Footer />
        <MobileBottomNavigation />
        {/* BannerSlot disabled (incomplete). */}
      </div>
    </Router>
  );
}

export default App;
