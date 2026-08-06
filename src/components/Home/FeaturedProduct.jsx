import React from "react";
import { Link } from "react-router-dom";
import { FaArrowRight, FaBolt, FaChartLine } from "react-icons/fa";
import { useHomeData } from "./HomeDataContext";
import { HomeSectionHeader, HomeSkeleton, ProductCard, ProductVisual, ScoreBadge } from "./HomeUi";
import { formatPrice } from "./homeData";

const FeaturedProduct = () => {
  const { trendingProducts, loading } = useHomeData();
  const lead = trendingProducts[0] || null;
  const rest = trendingProducts.slice(1, 6);

  return (
    <section className="home-v2-section home-v2-trending" aria-labelledby="home-v2-trending-title">
      <div className="hooks-container">
        <HomeSectionHeader
          eyebrow="Live demand signals"
          titleId="home-v2-trending-title"
          title="What people are researching now"
          copy="A real-time view of products attracting search and comparison interest across Hooks."
          actionTo="/smartphones"
          actionLabel="See all smartphones"
          artVariant="performance"
          artCaption={`${trendingProducts.length} live research signals`}
        />

        {loading && !lead ? <HomeSkeleton count={5} variant="bento" /> : null}
        {!loading && !lead ? (
          <div className="home-v2-empty-state">
            <FaChartLine aria-hidden="true" />
            <h3>Trending data is refreshing</h3>
            <p>The full smartphone catalogue is still available.</p>
            <Link to="/smartphones">Browse smartphones</Link>
          </div>
        ) : null}

        {lead ? (
          <div className="home-v2-trending__bento">
            <Link to={lead.path} className="home-v2-trending-lead">
              <div className="home-v2-trending-lead__content">
                <div className="home-v2-trending-lead__meta">
                  <span><FaBolt aria-hidden="true" /> Momentum leader</span>
                  <ScoreBadge score={lead.score} />
                </div>
                <p>{lead.brand || "Trending smartphone"}</p>
                <h3>{lead.name}</h3>
                <div className="home-v2-trending-lead__specs">
                  <span>{lead.spec || "Complete performance profile"}</span>
                  <span>{lead.secondarySpec || "Display, battery and camera details"}</span>
                </div>
                <div className="home-v2-trending-lead__price">
                  <strong>{formatPrice(lead.price)}</strong>
                  <span>Open details <FaArrowRight aria-hidden="true" /></span>
                </div>
              </div>
              <ProductVisual product={lead} className="is-feature" />
            </Link>

            <div className="home-v2-trending__rail">
              {rest.map((product, index) => (
                <ProductCard
                  key={`${product.type}-${product.id}`}
                  product={product}
                  rank={index + 2}
                  compact
                  label="Trending"
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default FeaturedProduct;
