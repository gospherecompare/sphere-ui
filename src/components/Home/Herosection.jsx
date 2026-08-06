import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaArrowRight,
  FaBolt,
  FaChartLine,
  FaExchangeAlt,
  FaSearch,
  FaShieldAlt,
} from "react-icons/fa";
import { useHomeData } from "./HomeDataContext";
import { ProductVisual, ScoreBadge } from "./HomeUi";
import SmartDeviceArt from "./SmartDeviceArt";
import { formatCompact, formatPrice } from "./homeData";

const HeroSection = () => {
  const navigate = useNavigate();
  const { heroProduct, trendingProducts, categoryCounts, loading, error } = useHomeData();
  const [query, setQuery] = useState("");

  const suggestions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];
    return [heroProduct, ...trendingProducts]
      .filter(Boolean)
      .filter((product) =>
        [product.name, product.brand, product.spec]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(normalized),
      )
      .slice(0, 5);
  }, [heroProduct, query, trendingProducts]);

  const submitSearch = (event) => {
    event.preventDefault();
    const value = query.trim();
    if (!value) return;
    const exact = suggestions[0];
    navigate(exact?.path || `/smartphones?search=${encodeURIComponent(value)}`);
  };

  return (
    <section className="home-v2-hero" aria-labelledby="home-v2-title">
      <div className="hooks-container home-v2-hero__layout">
        <div className="home-v2-hero__content">
          <div className="home-v2-live-pill">
            <span /> Live device guide
          </div>
          <h1 id="home-v2-title">
            Find your next device.
            <span>Compare it clearly.</span>
          </h1>
          <p className="home-v2-hero__lead">
            Live prices, key specifications and useful comparisons in one place.
          </p>

          <form className="home-v2-search" onSubmit={submitSearch} role="search">
            <FaSearch aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search phones, brands, chipsets or features"
              aria-label="Search products"
            />
            <button type="submit">Search</button>
            {suggestions.length ? (
              <div className="home-v2-search__suggestions">
                {suggestions.map((product) => (
                  <button
                    key={`${product.type}-${product.id}`}
                    type="button"
                    onClick={() => navigate(product.path)}
                  >
                    <span>{product.name}</span>
                    <small>{product.brand || product.spec || "Product"}</small>
                  </button>
                ))}
              </div>
            ) : null}
          </form>

          <div className="home-v2-hero__actions">
            <Link to="/smartphones" className="home-v2-primary-action">
              Explore smartphones <FaArrowRight aria-hidden="true" />
            </Link>
            <Link to="/compare" className="home-v2-secondary-action">
              <FaExchangeAlt aria-hidden="true" /> Build a comparison
            </Link>
          </div>

          <div className="home-v2-hero__metrics" aria-label="Live catalogue summary">
            <span>
              <b>{formatCompact(categoryCounts.smartphones)}</b>
              <small>smartphones</small>
            </span>
            <span>
              <b>{formatCompact(categoryCounts.brands)}</b>
              <small>active brands</small>
            </span>
            <span>
              <b>{formatCompact(categoryCounts.comparisons)}</b>
              <small>popular matchups</small>
            </span>
          </div>
          {error ? <p className="home-v2-feed-note">{error}</p> : null}
        </div>

        <div className="home-v2-hero__stage">
          <SmartDeviceArt
            variant="ecosystem"
            caption="Phone · Watch · Audio · Computing"
            className="home-v2-hero__device-art"
          />
          <div className="home-v2-stage-orbit home-v2-stage-orbit--one" />
          <div className="home-v2-stage-orbit home-v2-stage-orbit--two" />
          <div className="home-v2-stage-card">
            <div className="home-v2-stage-card__header">
              <span><FaBolt aria-hidden="true" /> Trending right now</span>
              <ScoreBadge score={heroProduct?.score} />
            </div>
            {heroProduct ? (
              <>
                <Link to={heroProduct.path} className="home-v2-stage-card__visual-link">
                  <ProductVisual product={heroProduct} className="is-hero" />
                </Link>
                <div className="home-v2-stage-card__details">
                  <p>{heroProduct.brand || "Featured smartphone"}</p>
                  <h2>{heroProduct.name}</h2>
                  <div className="home-v2-stage-card__specs">
                    <span><FaChartLine aria-hidden="true" /> {heroProduct.spec || "Full specification profile"}</span>
                    <span><FaShieldAlt aria-hidden="true" /> {heroProduct.secondarySpec || "Price and feature tracking"}</span>
                  </div>
                  <div className="home-v2-stage-card__footer">
                    <strong>{formatPrice(heroProduct.price)}</strong>
                    <Link to={heroProduct.path}>View product <FaArrowRight aria-hidden="true" /></Link>
                  </div>
                </div>
              </>
            ) : (
              <div className="home-v2-hero-empty">
                <span className={loading ? "is-loading" : ""} />
                <h2>{loading ? "Loading live products" : "Product feed unavailable"}</h2>
                <p>Browse the complete smartphone catalogue while the live feed refreshes.</p>
                <Link to="/smartphones">Open smartphones</Link>
              </div>
            )}
          </div>

          <div className="home-v2-floating-card home-v2-floating-card--compare">
            <FaExchangeAlt aria-hidden="true" />
            <span><b>Compare clearly</b><small>Differences highlighted</small></span>
          </div>
          <div className="home-v2-floating-card home-v2-floating-card--price">
            <FaChartLine aria-hidden="true" />
            <span><b>Live price view</b><small>Store-ready context</small></span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
