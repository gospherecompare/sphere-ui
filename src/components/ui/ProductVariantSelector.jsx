import React from "react";

const ProductVariantSelector = ({
  label = "Select variant",
  variants = [],
  selectedId,
  onSelect,
}) => {
  if (!variants.length) return null;
  return (
    <div className="mt-3">
      <span className="mb-2 block text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </span>
      <div className="flex flex-wrap gap-2">
        {variants.map((variant, index) => {
          const id = variant.id ?? variant.value ?? index;
          const selected = String(id) === String(selectedId);
          return (
            <button
              key={id}
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onSelect?.(variant, index);
              }}
              aria-pressed={selected}
              className={`inline-flex min-h-10 items-center rounded-xl px-3 text-xs font-bold transition ${selected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
            >
              {variant.label ?? variant.name ?? variant.value ?? id}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ProductVariantSelector;
