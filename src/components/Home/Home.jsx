import React from "react";
import useTitle from "../../hooks/useTitle";
import BestPriceSection from "./BestPrice";
import LatestSmartphones from "./UpcomingSmartphones";
import FeaturedProduct from "./FeaturedProduct";
import HeroSection from "./Herosection";
import PopularBrands from "./Popularbrand";
import Brandofmonth from "./Brandofmonth";
// BannerSlot disabled until completed.

const Home = () => {
  useTitle({ page: "home" });
  return (
    <div className="">
      <HeroSection />
      <Brandofmonth />
      <FeaturedProduct />
      <PopularBrands />
      <LatestSmartphones />
      <BestPriceSection />
    </div>
  );
};
export default Home;
