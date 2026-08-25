import React from "react";
import MobileXSpecScore from "./MobileXSpecScore";

const ProductCardIdentity = ({ brand, title, score, price, meta = null }) => (
  <div className="min-w-0 space-y-2">
    <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-blue-600">
      {brand || "Product"}
    </p>
    <h3 className="line-clamp-2 text-xl font-black leading-tight tracking-tight text-slate-950 sm:text-2xl">
      {title || "Product"}
    </h3>
    <MobileXSpecScore score={score} compact />
    {meta ? (
      <div className="text-[11px] font-semibold leading-5 text-slate-500 sm:text-xs">
        {meta}
      </div>
    ) : null}
    {price ? (
      <div className="text-xl font-black leading-none tracking-tight text-slate-950 sm:text-2xl">
        {price}
      </div>
    ) : null}
  </div>
);

export default ProductCardIdentity;
