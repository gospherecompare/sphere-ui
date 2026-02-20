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
import MobileDetailCard from "./components/Device detail/Smartphone";
import MobileCompare from "./components/compare";
import Login from "./components/Auths/Login";
import Signup from "./components/Auths/Signup";
import TVDetailCard from "./components/Device detail/TV";
import LaptopDetailCard from "./components/Device detail/Laptop";
import NetworkingDetailCard from "./components/Device detail/Network";
import Wishlist from "./components/Wishlist";
import AccountManagement from "./components/AccountManagement";
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
