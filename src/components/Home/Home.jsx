import React from "react";
import useTitle from "../../hooks/useTitle";
import InternalLinkHub from "../ui/InternalLinkHub";
import { HomeDataProvider } from "./HomeDataContext";
import HeroSection from "./Herosection";
import DecisionStudio from "./DecisionStudio";
import "./home-v2.css";
import "./homepage-responsive.css";

const FeaturedProduct = React.lazy(() => import("./FeaturedProduct"));
const PopularBrands = React.lazy(() => import("./Popularbrand"));
const LatestSmartphones = React.lazy(() => import("./LatestSmartphones"));
const BestPriceSection = React.lazy(() => import("./BestPrice"));
const RecommendedSmartphones = React.lazy(() => import("./RecommendedSmartphones"));
const LatestNewsArticlesSection = React.lazy(() =>
  import("./LatestNewsArticlesSection"),
);

const BelowFoldSection = ({ children, height = 620 }) => (
  <div
    className="home-v2-lazy-section"
    style={{ "--home-v2-placeholder-height": `${height}px` }}
  >
    <React.Suspense fallback={null}>{children}</React.Suspense>
  </div>
);

const Home = () => {
  useTitle({ page: "home" });
  return (
    <HomeDataProvider>
      <main className="hooks-home home-v2 min-h-screen overflow-x-hidden">
        <HeroSection />
        <DecisionStudio />
        <BelowFoldSection height={760}>
          <FeaturedProduct />
        </BelowFoldSection>
        <BelowFoldSection height={480}>
          <PopularBrands />
        </BelowFoldSection>
        <BelowFoldSection height={700}>
          <LatestSmartphones />
        </BelowFoldSection>
        <BelowFoldSection height={720}>
          <BestPriceSection />
        </BelowFoldSection>
        <BelowFoldSection height={620}>
          <RecommendedSmartphones />
        </BelowFoldSection>
        <BelowFoldSection height={720}>
          <LatestNewsArticlesSection />
        </BelowFoldSection>
        <div className="home-v2-internal-links">
          <InternalLinkHub variant="directory" />
        </div>
      </main>
    </HomeDataProvider>
  );
};

export default Home;
