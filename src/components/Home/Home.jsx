import React from "react";
import useTitle from "../../hooks/useTitle";
import HeroSection from "./Herosection";
// BannerSlot disabled until completed.

const FeaturedProduct = React.lazy(() => import("./FeaturedProduct"));
const PopularBrands = React.lazy(() => import("./Popularbrand"));
const LatestSmartphones = React.lazy(() => import("./LatestSmartphones"));
const BestPriceSection = React.lazy(() => import("./BestPrice"));
const RecommendedSmartphones = React.lazy(() => import("./RecommendedSmartphones"));
const LatestNewsArticlesSection = React.lazy(() =>
  import("./LatestNewsArticlesSection"),
);

const BelowFoldSection = ({ children }) => (
  <div className="[content-visibility:auto] [contain-intrinsic-size:1px_720px]">
    <React.Suspense fallback={null}>{children}</React.Suspense>
  </div>
);

const Home = () => {
  useTitle({ page: "home" });
  return (
    <div className="min-h-screen overflow-x-hidden ">
      <HeroSection />
      <BelowFoldSection>
        <FeaturedProduct />
      </BelowFoldSection>
      <BelowFoldSection>
        <PopularBrands />
      </BelowFoldSection>
      <BelowFoldSection>
        <LatestSmartphones />
      </BelowFoldSection>
      <BelowFoldSection>
        <BestPriceSection />
      </BelowFoldSection>
      <BelowFoldSection>
        <RecommendedSmartphones />
      </BelowFoldSection>
      <BelowFoldSection>
        <LatestNewsArticlesSection />
      </BelowFoldSection>
    </div>
  );
};
export default Home;
