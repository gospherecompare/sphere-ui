import React, { useEffect, useRef, useState } from "react";
import SEO from "../SEO";
import InternalLinkHub from "../ui/InternalLinkHub";
import { HomeDataProvider } from "./HomeDataContext";
import HeroSection from "./Herosection";
import DecisionStudio from "./DecisionStudio";
import "./home-v2.css";
import "./homepage-responsive.css";

const loadFeaturedProduct = () => import("./FeaturedProduct");
const loadPopularBrands = () => import("./Popularbrand");
const loadLatestSmartphones = () => import("./LatestSmartphones");
const loadBestPriceSection = () => import("./BestPrice");
const loadRecommendedSmartphones = () => import("./RecommendedSmartphones");
const loadLatestNewsArticlesSection = () =>
  import("./LatestNewsArticlesSection");

const BelowFoldSection = ({ load, height = 620 }) => {
  const sectionRef = useRef(null);
  const [Section, setSection] = useState(null);

  useEffect(() => {
    if (Section || !sectionRef.current) return undefined;
    if (typeof IntersectionObserver === "undefined") {
      setSection(() => React.lazy(load));
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setSection(() => React.lazy(load));
        observer.disconnect();
      },
      { rootMargin: "400px 0px" },
    );
    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [Section, load]);

  return (
    <div
      ref={sectionRef}
      className="home-v2-lazy-section"
      style={{ "--home-v2-placeholder-height": `${height}px` }}
    >
      {Section ? (
        <React.Suspense fallback={null}>
          <Section />
        </React.Suspense>
      ) : null}
    </div>
  );
};

const Home = () => {
  return (
    <>
      <SEO
        title="Compare Smartphones, TVs & Gadgets in India | MobilesX"
        description="Compare smartphones, laptops, TVs and technology products with specifications, prices, feature comparisons and practical buying information."
        url="https://mobilesx.in/"
      />
      <HomeDataProvider>
        <main className="hooks-home home-v2 min-h-screen overflow-x-hidden [&_h1]:font-[Space_Grotesk] [&_h2]:font-[Space_Grotesk] [&_h3]:font-[Space_Grotesk]">
          <HeroSection />
          <DecisionStudio />
          <BelowFoldSection load={loadFeaturedProduct} height={760} />
          <BelowFoldSection load={loadPopularBrands} height={480} />
          <BelowFoldSection load={loadLatestSmartphones} height={700} />
          <BelowFoldSection load={loadBestPriceSection} height={720} />
          <BelowFoldSection load={loadRecommendedSmartphones} height={620} />
          <BelowFoldSection load={loadLatestNewsArticlesSection} height={720} />
          <div className="home-v2-internal-links">
            <InternalLinkHub variant="directory" />
          </div>
        </main>
      </HomeDataProvider>
    </>
  );
};

export default Home;
