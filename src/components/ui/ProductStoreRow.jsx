import React from "react";
import { FaExternalLinkAlt, FaStore } from "react-icons/fa";

const ProductStoreRow = ({ store, name, price, logo, href, onClick }) => (
  <div className="flex min-h-12 items-center justify-between gap-3 py-2.5">
    <div className="flex min-w-0 items-center gap-2">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white">
        {logo ? (
          <img
            src={logo}
            alt={name || store || "Store"}
            className="h-full w-full object-contain"
          />
        ) : (
          <FaStore className="text-xs text-slate-400" />
        )}
      </span>
      <span className="truncate text-sm font-semibold text-slate-700">
        {name || store || "Online Store"}
      </span>
    </div>
    <div className="flex shrink-0 items-center gap-3">
      <span className="whitespace-nowrap text-sm font-extrabold text-emerald-600">
        {price || "Price unavailable"}
      </span>
      <a
        href={href || undefined}
        onClick={onClick}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className={`inline-flex items-center gap-1 rounded-md px-3 py-2 text-xs font-bold ${href ? "bg-blue-600 text-white hover:bg-blue-700" : "cursor-not-allowed bg-slate-200 text-slate-500"}`}
      >
        {href ? "Buy Now" : "Unavailable"}
        {href ? <FaExternalLinkAlt className="text-[9px]" /> : null}
      </a>
    </div>
  </div>
);

export default ProductStoreRow;
