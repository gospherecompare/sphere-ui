import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaArrowRight, FaMobileAlt, FaStar } from "react-icons/fa";
import { formatPrice } from "./homeData";
import SmartDeviceArt from "./SmartDeviceArt";

export const HomeSectionHeader = ({
  eyebrow,
  title,
  copy,
  actionTo,
  actionLabel,
  artVariant,
  artCaption,
  titleId,
}) => (
  <div className="home-v2-section-head">
    <div className="home-v2-section-head__copy">
      {eyebrow ? <p className="home-v2-eyebrow">{eyebrow}</p> : null}
      <h2 id={titleId}>{title}</h2>
      {copy ? <p>{copy}</p> : null}
    </div>
    <div className="home-v2-section-head__aside">
      {artVariant ? (
        <SmartDeviceArt
          variant={artVariant}
          caption={artCaption}
          className="home-v2-section-head__art"
        />
      ) : null}
      {actionTo && actionLabel ? (
        <Link to={actionTo} className="home-v2-link">
          {actionLabel}
          <FaArrowRight aria-hidden="true" />
        </Link>
      ) : null}
    </div>
  </div>
);

export const ProductVisual = ({ product, className = "" }) => {
  const [failed, setFailed] = useState(false);
  return (
    <div className={`home-v2-product-visual ${className}`}>
      <span className="home-v2-product-visual__halo" />
      <span className="home-v2-product-visual__signal" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      {product?.image && !failed ? (
        <img
          src={product.image}
          alt={product.name || "Technology product"}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="home-v2-product-fallback" aria-hidden="true">
          <FaMobileAlt />
          <span>
            {String(product?.brand || product?.name || "MobileX").slice(0, 2)}
          </span>
        </div>
      )}
    </div>
  );
};

export const ScoreBadge = ({ score }) => {
  if (!Number.isFinite(score)) return null;
  return (
    <span
      className="home-v2-score"
      aria-label={`MobileX score ${score} out of 100`}
    >
      <FaStar aria-hidden="true" />
      {score}
    </span>
  );
};

export const ProductCard = ({ product, rank, compact = false, label = "" }) => {
  if (!product) return null;
  return (
    <Link
      to={product.path}
      className={`home-v2-product-card ${compact ? "is-compact" : ""}`}
      aria-label={`View ${product.name}`}
    >
      <div className="home-v2-product-card__topline">
        <span>{label || product.brand || "Product"}</span>
        {rank ? (
          <b>{String(rank).padStart(2, "0")}</b>
        ) : (
          <ScoreBadge score={product.score} />
        )}
      </div>
      <ProductVisual product={product} />
      <div className="home-v2-product-card__body">
        <h3>{product.name}</h3>
        <p>
          {product.spec ||
            product.secondarySpec ||
            "Full specifications and price comparison"}
        </p>
        <div className="home-v2-product-card__footer">
          <strong>{formatPrice(product.price)}</strong>
          <span>
            View details <FaArrowRight aria-hidden="true" />
          </span>
        </div>
      </div>
    </Link>
  );
};

export const HomeSkeleton = ({ count = 4, variant = "cards" }) => (
  <div
    className={`home-v2-skeleton home-v2-skeleton--${variant}`}
    aria-hidden="true"
  >
    {Array.from({ length: count }, (_, index) => (
      <span key={index} />
    ))}
  </div>
);
