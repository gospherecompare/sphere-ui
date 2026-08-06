import React from "react";
import { Link } from "react-router-dom";
import { FaArrowRight, FaCalendarAlt, FaMobileAlt } from "react-icons/fa";
import { useHomeData } from "./HomeDataContext";
import { HomeSectionHeader, HomeSkeleton, ProductVisual, ScoreBadge } from "./HomeUi";
import { formatLaunchDate, formatPrice } from "./homeData";

const LatestSmartphones = () => {
  const { latestProducts, loading } = useHomeData();
  const lead = latestProducts[0] || null;
  const timeline = latestProducts.slice(1, 8);

  return (
    <section className="home-v2-section home-v2-launches" aria-labelledby="home-v2-launches-title">
      <div className="hooks-container">
        <HomeSectionHeader
          eyebrow="Launch tracker"
          titleId="home-v2-launches-title"
          title="New smartphones, presented as a release desk"
          copy="Freshly added devices appear in chronological context, with direct access to their price and specification pages."
          actionTo="/smartphones"
          actionLabel="Open launch catalogue"
          artVariant="launch"
          artCaption={`${latestProducts.length} recent published launches`}
        />

        {loading && !lead ? <HomeSkeleton count={7} variant="timeline" /> : null}
        {!loading && !lead ? (
          <div className="home-v2-empty-state">
            <FaCalendarAlt aria-hidden="true" />
            <h3>No new launches available yet</h3>
            <p>Browse all published smartphones instead.</p>
            <Link to="/smartphones">View smartphones</Link>
          </div>
        ) : null}

        {lead ? (
          <div className="home-v2-launch-desk">
            <Link to={lead.path} className="home-v2-launch-feature">
              <div className="home-v2-launch-feature__copy">
                <div className="home-v2-launch-feature__date">
                  <FaCalendarAlt aria-hidden="true" />
                  {formatLaunchDate(lead.launchDate)}
                </div>
                <p>{lead.brand || "Latest smartphone"}</p>
                <h3>{lead.name}</h3>
                <div className="home-v2-launch-feature__facts">
                  <span>{lead.spec || "Full performance details"}</span>
                  <span>{lead.secondarySpec || "Camera, display and battery profile"}</span>
                </div>
                <div className="home-v2-launch-feature__footer">
                  <strong>{formatPrice(lead.price)}</strong>
                  <ScoreBadge score={lead.score} />
                </div>
              </div>
              <ProductVisual product={lead} className="is-launch" />
              <span className="home-v2-launch-feature__cta">View launch <FaArrowRight aria-hidden="true" /></span>
            </Link>

            <ol className="home-v2-launch-timeline">
              {timeline.map((product, index) => (
                <li key={`${product.type}-${product.id}`}>
                  <span className="home-v2-launch-timeline__marker">{String(index + 2).padStart(2, "0")}</span>
                  <Link to={product.path}>
                    <div className="home-v2-launch-timeline__image">
                      <ProductVisual product={product} />
                    </div>
                    <div className="home-v2-launch-timeline__copy">
                      <span>{formatLaunchDate(product.launchDate)}</span>
                      <h3>{product.name}</h3>
                      <p>{product.brand || product.spec || "New smartphone"}</p>
                    </div>
                    <strong>{formatPrice(product.price)}</strong>
                    <FaArrowRight aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default LatestSmartphones;
