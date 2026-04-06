import React from "react";
import useTitle from "../../hooks/useTitle";
import BestPriceSection from "./BestPrice";
import UpcomingSmartphones from "./UpcomingSmartphones";
import FeaturedProduct from "./FeaturedProduct";
import HeroSection from "./Herosection";
import PopularBrands from "./Popularbrand";
import Brandofmonth from "./Brandofmonth";
// BannerSlot disabled until completed.

const Home = () => {
  useTitle({ page: "home" });
  return (
    <div className="">
      {/* BannerSlot disabled (incomplete). */}
      <HeroSection />
      <Brandofmonth />
      <FeaturedProduct />
      <PopularBrands />
      <UpcomingSmartphones />
      <BestPriceSection />
    </div>
  );
};
export default Home;
