import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FaArrowRight, FaChevronDown, FaLayerGroup } from "react-icons/fa";
import { buildPublicSmartphoneBrandPath } from "../../utils/smartphoneListingRoutes";
import { useHomeData } from "./HomeDataContext";
import { HomeSectionHeader, HomeSkeleton } from "./HomeUi";

const BrandMark = ({ brand }) => {
  const [failed, setFailed] = useState(false);
  if (brand.logo && !failed) {
    return (
      <img
        src={brand.logo}
        alt={`${brand.name} logo`}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
      />
    );
  }
  return <span>{brand.name.slice(0, 2).toUpperCase()}</span>;
};

const getBrandPath = (brand) => {
  const category = String(brand?.category || "").toLowerCase();
  if (category.includes("tv") || category.includes("television") || category.includes("appliance")) {
    return `/tvs?brand=${encodeURIComponent(brand.slug)}`;
  }
  if (category.includes("network") || category.includes("router") || category.includes("wifi")) {
    return `/networking?brand=${encodeURIComponent(brand.slug)}`;
  }
  if (category.includes("laptop") || category.includes("computer")) {
    return "/brands";
  }
  return buildPublicSmartphoneBrandPath(brand.slug);
};

const getCollapsedBrandLimit = () => {
  if (typeof window === "undefined") return 12;
  if (window.matchMedia("(max-width: 640px)").matches) return 8;
  if (window.matchMedia("(max-width: 1024px)").matches) return 9;
  return 12;
};

const PopularBrands = () => {
  const { brands, loading } = useHomeData();
  const [showAllBrands, setShowAllBrands] = useState(false);
  const [collapsedLimit, setCollapsedLimit] = useState(getCollapsedBrandLimit);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const mobileQuery = window.matchMedia("(max-width: 640px)");
    const tabletQuery = window.matchMedia("(max-width: 1024px)");
    const updateLimit = () => setCollapsedLimit(getCollapsedBrandLimit());

    mobileQuery.addEventListener("change", updateLimit);
    tabletQuery.addEventListener("change", updateLimit);
    return () => {
      mobileQuery.removeEventListener("change", updateLimit);
      tabletQuery.removeEventListener("change", updateLimit);
    };
  }, []);

  const visibleBrands = useMemo(
    () => (showAllBrands ? brands : brands.slice(0, collapsedLimit)),
    [brands, collapsedLimit, showAllBrands],
  );
  const hiddenBrandCount = Math.max(brands.length - collapsedLimit, 0);

  return (
    <section className="home-v2-section home-v2-brands" aria-labelledby="home-v2-brands-title">
      <div className="hooks-container">
        <HomeSectionHeader
          eyebrow="Brand navigator"
          titleId="home-v2-brands-title"
          title="Jump directly to the makers you trust"
          copy="Real brands from the Hooks catalogue, arranged as a fast visual index instead of another product-card grid."
          actionTo="/brands"
          actionLabel="Browse every brand"
          artVariant="brands"
          artCaption={`${brands.length} active catalogue brands`}
        />

        {loading && !brands.length ? <HomeSkeleton count={10} variant="brands" /> : null}
        {!loading && !brands.length ? (
          <div className="home-v2-empty-state is-inline">
            <FaLayerGroup aria-hidden="true" />
            <p>Brand data is refreshing. Explore the full product catalogue meanwhile.</p>
            <Link to="/smartphones">Browse products</Link>
          </div>
        ) : null}

        {brands.length ? (
          <div className="home-v2-brand-index">
            <div className="home-v2-brand-index__label">
              <span>Catalogue index</span>
              <b>{brands.length}</b>
              <small>active brands</small>
            </div>
            <div className="home-v2-brand-index__content">
              <div className="home-v2-brand-index__rail" id="home-v2-brand-list">
                {visibleBrands.map((brand, index) => (
                  <Link
                    key={`${brand.id}-${brand.name}`}
                    to={getBrandPath(brand)}
                    className="home-v2-brand-chip"
                    style={{ "--brand-index": index }}
                    aria-label={`Browse ${brand.name} smartphones`}
                  >
                    <span className="home-v2-brand-chip__mark"><BrandMark brand={brand} /></span>
                    <span className="home-v2-brand-chip__name">{brand.name}</span>
                    <FaArrowRight aria-hidden="true" />
                  </Link>
                ))}
              </div>

              {hiddenBrandCount > 0 ? (
                <div className="home-v2-brand-index__actions">
                  <button
                    type="button"
                    className={`home-v2-brand-index__toggle${showAllBrands ? " is-expanded" : ""}`}
                    aria-expanded={showAllBrands}
                    aria-controls="home-v2-brand-list"
                    onClick={() => setShowAllBrands((current) => !current)}
                  >
                    <span>
                      <b>{showAllBrands ? "Show fewer brands" : `View ${hiddenBrandCount} more brands`}</b>
                      <small>
                        {showAllBrands
                          ? `All ${brands.length} catalogue brands are visible`
                          : `Showing ${Math.min(collapsedLimit, brands.length)} of ${brands.length} brands`}
                      </small>
                    </span>
                    <FaChevronDown aria-hidden="true" />
                  </button>

                  <Link to="/brands" className="home-v2-brand-index__directory-link">
                    Full brand directory <FaArrowRight aria-hidden="true" />
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default PopularBrands;
