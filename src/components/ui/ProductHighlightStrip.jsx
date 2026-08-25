import React from "react";

const ProductHighlightStrip = ({ items = [], className = "" }) => (
  <div
    className={`grid grid-cols-4 overflow-hidden rounded-2xl bg-slate-50/70 ${className}`}
  >
    {items.slice(0, 4).map(({ label, value, icon: Icon }) => {
      const labelText = String(label || "");
      const valueText = String(value || "Not specified");
      const labelClass =
        labelText.length > 10
          ? "text-[9px] leading-3"
          : "text-[10px] leading-4";
      const valueClass =
        valueText.length > 24
          ? "text-[10px] leading-4"
          : valueText.length > 14
            ? "text-xs leading-4"
            : "text-sm leading-5";

      return (
        <div
          key={label}
          className="min-w-0 border-slate-200/70 px-3 py-3 sm:border-r sm:px-4 last:border-r-0"
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            {Icon ? <Icon className="text-xs" /> : null}
          </span>
          <p
            className={`mt-2 whitespace-nowrap font-bold uppercase tracking-[0.08em] text-slate-500 ${labelClass}`}
          >
            {labelText}
          </p>
          <p
            className={`mt-1 whitespace-normal break-words font-black text-slate-900 ${valueClass}`}
          >
            {valueText}
          </p>
        </div>
      );
    })}
  </div>
);

export default ProductHighlightStrip;
