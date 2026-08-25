import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  FaArrowRight,
  FaExchangeAlt,
  FaFire,
  FaMobileAlt,
} from "react-icons/fa";
import { buildCanonicalComparePath } from "../../utils/compareRoutes";
import { useHomeData } from "./HomeDataContext";
import { HomeSectionHeader, HomeSkeleton } from "./HomeUi";
import { formatCompact } from "./homeData";

const DevicePortrait = ({ image, name }) => (
  <div className="home-v2-compare-device__visual">
    {image ? (
      <img src={image} alt={name} loading="lazy" decoding="async" />
    ) : (
      <FaMobileAlt aria-hidden="true" />
    )}
  </div>
);

const RecommendedSmartphones = () => {
  const { comparisons, catalog, loading } = useHomeData();

  const rows = useMemo(() => {
    if (comparisons.length) return comparisons;
    const phones = catalog
      .filter((product) => product.type === "smartphones")
      .slice(0, 8);
    return phones
      .slice(0, 6)
      .map((product, index) => {
        const other = phones[(index + 1) % phones.length];
        if (!other || other.id === product.id) return null;
        return {
          leftId: product.id,
          leftName: product.name,
          leftImage: product.image,
          rightId: other.id,
          rightName: other.name,
          rightImage: other.image,
          count: 0,
        };
      })
      .filter(Boolean);
  }, [catalog, comparisons]);

  const lead = rows[0] || null;
  const rest = rows.slice(1, 6);

  return (
    <section
      className="home-v2-section home-v2-compare"
      aria-labelledby="home-v2-compare-title"
    >
      <div className="hooks-container">
        <HomeSectionHeader
          eyebrow="Comparison arena"
          titleId="home-v2-compare-title"
          title="See the decision, not just two spec sheets"
          copy="Popular real-world matchups from the MobileX comparison feed, arranged as one focused arena with supporting battles."
          actionTo="/popular-comparisons"
          actionLabel="View popular comparisons"
          artVariant="compare"
          artCaption={`${rows.length} active comparison matchups`}
        />

        {loading && !lead ? <HomeSkeleton count={5} variant="compare" /> : null}
        {!loading && !lead ? (
          <div className="home-v2-empty-state">
            <FaExchangeAlt aria-hidden="true" />
            <h3>Comparison activity is building</h3>
            <p>Create the first side-by-side decision.</p>
            <Link to="/compare">Start comparing</Link>
          </div>
        ) : null}

        {lead ? (
          <div className="home-v2-compare-arena">
            <Link
              to={buildCanonicalComparePath({
                leftName: lead.leftName,
                rightName: lead.rightName,
              })}
              className="home-v2-compare-main"
            >
              <div className="home-v2-compare-main__signal">
                <FaFire aria-hidden="true" /> Most compared matchup
              </div>
              <div className="home-v2-compare-main__devices">
                <div className="home-v2-compare-device">
                  <DevicePortrait image={lead.leftImage} name={lead.leftName} />
                  <h3>{lead.leftName}</h3>
                </div>
                <span className="home-v2-compare-vs">VS</span>
                <div className="home-v2-compare-device">
                  <DevicePortrait
                    image={lead.rightImage}
                    name={lead.rightName}
                  />
                  <h3>{lead.rightName}</h3>
                </div>
              </div>
              <div className="home-v2-compare-main__footer">
                <span>
                  <b>{formatCompact(lead.count)}</b>
                  <small>comparison actions</small>
                </span>
                <strong>
                  Open full comparison <FaArrowRight aria-hidden="true" />
                </strong>
              </div>
            </Link>

            <div className="home-v2-compare-list">
              {rest.map((comparison, index) => (
                <Link
                  key={`${comparison.leftId}-${comparison.rightId}-${index}`}
                  to={buildCanonicalComparePath({
                    leftName: comparison.leftName,
                    rightName: comparison.rightName,
                  })}
                >
                  <span className="home-v2-compare-list__rank">
                    0{index + 2}
                  </span>
                  <div>
                    <p>{comparison.leftName}</p>
                    <span>versus</span>
                    <p>{comparison.rightName}</p>
                  </div>
                  <small>
                    {comparison.count
                      ? `${formatCompact(comparison.count)} compares`
                      : "Compare now"}
                  </small>
                  <FaArrowRight aria-hidden="true" />
                </Link>
              ))}
              <Link to="/compare" className="home-v2-compare-list__create">
                <span>
                  <FaExchangeAlt aria-hidden="true" />
                </span>
                <div>
                  <b>Create your own matchup</b>
                  <small>Choose any two published products</small>
                </div>
                <FaArrowRight aria-hidden="true" />
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default RecommendedSmartphones;
