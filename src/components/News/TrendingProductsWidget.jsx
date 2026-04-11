import React from "react";
import { FaRupeeSign, FaFire, FaStore } from "react-icons/fa";
import { Link } from "react-router-dom";

const TrendingProductCard = ({ product, index = 0 }) => {
  if (!product) return null;

  const {
    name = "Product",
    price = "₹0",
    image = "",
    store = "Store",
    storeUrl = "",
    specs = [],
    badge = "",
    category = "Mobile",
  } = product;

  return (
    <div className="group overflow-hidden rounded-lg border border-slate-200 bg-white transition-all hover:border-slate-300 hover:shadow-md">
      {/* Product Image */}
      <div className="relative h-40 overflow-hidden bg-slate-100">
        {image ? (
          <img
            src={image}
            alt={name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-6xl opacity-10">📱</div>
          </div>
        )}

        {badge && (
          <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
            {badge}
          </div>
        )}

        {/* Rank Badge */}
        {index < 3 && (
          <div
            className={`absolute top-2 left-2 h-7 w-7 rounded-full flex items-center justify-center text-white text-xs font-bold ${
              index === 0
                ? "bg-yellow-500"
                : index === 1
                  ? "bg-gray-400"
                  : "bg-orange-600"
            }`}
          >
            {index + 1}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-3">
        {/* Name */}
        <h4 className="text-sm font-bold text-slate-900 line-clamp-2 h-10 leading-[1.25]">
          {name}
        </h4>

        {/* Price */}
        <div className="mt-2 flex items-baseline gap-1">
          <FaRupeeSign className="h-3 w-3 text-slate-600" />
          <span className="text-base font-bold text-slate-900">{price}</span>
        </div>

        {/* Specs */}
        {specs && specs.length > 0 && (
          <div className="mt-2 space-y-1">
            {specs.slice(0, 2).map((spec, idx) => (
              <p
                key={idx}
                className="text-xs text-slate-600 line-clamp-1 leading-tight"
              >
                {spec}
              </p>
            ))}
          </div>
        )}

        {/* Store Button */}
        {storeUrl ? (
          <a
            href={storeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded text-xs font-semibold transition-colors"
          >
            <FaStore className="h-3 w-3" />
            Buy Now
          </a>
        ) : (
          <button className="mt-3 flex items-center justify-center gap-2 w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 px-3 rounded text-xs font-semibold transition-colors">
            <FaStore className="h-3 w-3" />
            {store}
          </button>
        )}
      </div>
    </div>
  );
};

const TrendingProductsWidget = ({
  title = "Trending Products",
  products = [],
}) => {
  if (!products || products.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <FaFire className="h-4 w-4 text-blue-600" />
        <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-slate-900">
          {title}
        </h3>
      </div>

      {/* Products */}
      <div className="grid gap-3 xl:grid-cols-1">
        {products.slice(0, 4).map((product, idx) => (
          <TrendingProductCard key={idx} product={product} index={idx} />
        ))}
      </div>

      {/* View All Link */}
      {products.length > 4 && (
        <Link
          to="/smartphones"
          className="mt-3 block text-center py-2 px-3 rounded border border-blue-600 text-blue-600 hover:bg-blue-50 text-xs font-semibold transition-colors"
        >
          View All Trending →
        </Link>
      )}
    </div>
  );
};

export default TrendingProductsWidget;
export { TrendingProductCard };
