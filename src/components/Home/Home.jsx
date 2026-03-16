import React from "react";
import useTitle from "../../hooks/useTitle";
import { Helmet } from "react-helmet-async";
import BestPriceSection from "./BestPrice";
import UpcomingSmartphones from "./UpcomingSmartphones";
import RecommendedSmartphones from "./RecommendedSmartphones";
import PopularComparisons from "./Brandshowcase";
import FeaturedProduct from "./FeaturedProduct";
import HeroSection from "./Herosection";
import PopularBrands from "./Popularbrand";
import Brandofmonth from "./Brandofmonth";
import ProductsNav from "./Products";
// BannerSlot disabled until completed.

const Home = () => {
  useTitle({ page: "home" });
  const websiteJsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Hooks",
    url: "https://tryhook.shop",
  });
  return (
    <div className="px-4 sm:px-0">
      <Helmet>
        <script type="application/ld+json">{websiteJsonLd}</script>
      </Helmet>
      <ProductsNav />
      {/* BannerSlot disabled (incomplete). */}
      <Brandofmonth />
      <FeaturedProduct />
      <PopularBrands />
      <UpcomingSmartphones />
      <RecommendedSmartphones />
      <BestPriceSection />
      <PopularComparisons />
    </div>
  );
};
export default Home;
