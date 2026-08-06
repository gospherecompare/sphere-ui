import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FaArrowRight, FaChartBar, FaRupeeSign } from "react-icons/fa";
import { buildPublicSmartphoneFilterPath } from "../../utils/smartphoneListingRoutes";
import { useHomeData } from "./HomeDataContext";
import { HomeSectionHeader, HomeSkeleton, ProductVisual, ScoreBadge } from "./HomeUi";
import { formatPrice } from "./homeData";

const BUDGETS = [
  { label: "Under ₹15K", max: 15000, slug: "under-15000" },
  { label: "Under ₹25K", max: 25000, slug: "under-25000" },
  { label: "Under ₹40K", max: 40000, slug: "under-40000" },
  { label: "Under ₹60K", max: 60000, slug: "under-60000" },
  { label: "Premium", max: Number.POSITIVE_INFINITY, slug: "above-60000" },
];

const BestPrice = () => {
  const { valueProducts, catalog, loading } = useHomeData();
  const [activeBudget, setActiveBudget] = useState(BUDGETS[1]);

  const budgetProducts = useMemo(() => {
    const source = catalog.filter((product) => Number.isFinite(product.price) && product.price > 0);
    const min = activeBudget.max === Number.POSITIVE_INFINITY ? 60000 : 0;
    const matches = source.filter((product) => product.price > min && product.price <= activeBudget.max);
    const preferred = matches.length ? matches : valueProducts;
    return preferred.slice(0, 5);
  }, [activeBudget, catalog, valueProducts]);

  const lead = budgetProducts[0] || valueProducts[0] || null;
  const rest = budgetProducts.slice(1, 5);

  return (
    <section className="home-v2-section home-v2-value" aria-labelledby="home-v2-value-title">
      <div className="home-v2-value__mesh" aria-hidden="true" />
      <div className="hooks-container">
        <HomeSectionHeader
          eyebrow="Budget intelligence"
          titleId="home-v2-value-title"
          title="Start with a price, finish with a reason"
          copy="The value desk uses published catalogue prices to surface relevant products within each budget instead of showing fixed demo cards."
          actionTo="/smartphones"
          actionLabel="Use all filters"
          artVariant="value"
          artCaption={`${budgetProducts.length} matches in ${activeBudget.label}`}
        />

        <div className="home-v2-budget-tabs" role="tablist" aria-label="Smartphone budgets">
          {BUDGETS.map((budget) => (
            <button
              key={budget.label}
              type="button"
              role="tab"
              aria-selected={activeBudget.label === budget.label}
              className={activeBudget.label === budget.label ? "is-active" : ""}
              onClick={() => setActiveBudget(budget)}
            >
              {budget.label}
            </button>
          ))}
        </div>

        {loading && !lead ? <HomeSkeleton count={5} variant="value" /> : null}
        {!loading && !lead ? (
          <div className="home-v2-empty-state">
            <FaRupeeSign aria-hidden="true" />
            <h3>Price data is refreshing</h3>
            <p>Open the complete filters to continue browsing.</p>
            <Link to="/smartphones">Open filters</Link>
          </div>
        ) : null}

        {lead ? (
          <div className="home-v2-value-board">
            <Link to={lead.path} className="home-v2-value-spotlight">
              <div className="home-v2-value-spotlight__top">
                <span><FaChartBar aria-hidden="true" /> Best current fit</span>
                <ScoreBadge score={lead.score} />
              </div>
              <ProductVisual product={lead} className="is-value" />
              <div className="home-v2-value-spotlight__copy">
                <p>{lead.brand || activeBudget.label}</p>
                <h3>{lead.name}</h3>
                <span>{lead.spec || "Specification profile available"}</span>
                <strong>{formatPrice(lead.price)}</strong>
              </div>
            </Link>

            <div className="home-v2-value-list">
              {rest.map((product, index) => (
                <Link
                  key={`${product.type}-${product.id}`}
                  to={product.path}
                  className="home-v2-value-item"
                >
                  <span className="home-v2-value-list__rank">{String(index + 2).padStart(2, "0")}</span>
                  <ProductVisual product={product} className="home-v2-value-item__visual" />
                  <div className="home-v2-value-item__copy">
                    <p>{product.brand || "Smartphone"}</p>
                    <h3>{product.name}</h3>
                    <span>{product.spec || product.secondarySpec || "Full details"}</span>
                  </div>
                  <strong className="home-v2-value-item__price">{formatPrice(product.price)}</strong>
                  <FaArrowRight className="home-v2-value-item__arrow" aria-hidden="true" />
                </Link>
              ))}
              <Link
                to={buildPublicSmartphoneFilterPath(activeBudget.slug)}
                className="home-v2-value-list__all"
              >
                <span><FaRupeeSign aria-hidden="true" /></span>
                <div>
                  <h3>View every {activeBudget.label.toLowerCase()} option</h3>
                  <p>Open the complete filtered catalogue.</p>
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

export default BestPrice;
