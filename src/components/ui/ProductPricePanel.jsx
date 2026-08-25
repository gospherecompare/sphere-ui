import React from "react";
import ProductStoreRow from "./ProductStoreRow";

const ProductPricePanel = ({
  stores = [],
  title = "Check Price On",
  getStoreProps,
}) => {
  if (!stores.length) return null;
  return (
    <section className="mt-4 border-t border-slate-100 pt-3">
      <div className="mb-1 text-xs font-bold text-slate-800">{title}</div>
      {stores.slice(0, 2).map((store, index) => (
        <ProductStoreRow
          key={store.id ?? index}
          {...store}
          {...getStoreProps?.(store, index)}
        />
      ))}
    </section>
  );
};

export default ProductPricePanel;
