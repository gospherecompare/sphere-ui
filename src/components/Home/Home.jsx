import React from "react";
import useTitle from "../../hooks/useTitle";
import BestPriceSection from "./BestPrice";
import PopularComparisons from "./Brandshowcase";
import FeaturedProduct from "./FeaturedProduct";
import HeroSection from "./Herosection";
import PopularBrands from "./Popularbrand";
import Brandofmonth from "./Brandofmonth";
import ProductsNav from "./Products";
// BannerSlot disabled until completed.

const Home = () => {
  useTitle({ page: "home" });
  return (
    <div className="px-4 sm:px-0">
      <ProductsNav />
      {/* BannerSlot disabled (incomplete). */}
      <Brandofmonth />
      <FeaturedProduct />
      <PopularBrands />
      <BestPriceSection />
      <PopularComparisons />
    </div>
  );
};
export default Home;
