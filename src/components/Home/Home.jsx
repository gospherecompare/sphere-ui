import React from "react";
import useTitle from "../../hooks/useTitle";
import BestPriceSection from "./BestPrice";
import BrandShowcase from "./Brandshowcase";
import FeaturedProduct from "./FeaturedProduct";
import HeroSection from "./Herosection";
import PopularBrands from "./Popularbrand";
import Brandofmonth from "./Brandofmonth";
import CategoryNav from "./Category";

const Home = () => {
  useTitle({ page: "Home" });
  return (
    <main>
      <CategoryNav />
      <HeroSection />
      <PopularBrands />
      <BestPriceSection />
      <BrandShowcase />
    </main>
  );
};
export default Home;
