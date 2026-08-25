import React from "react";
import { FaChevronRight } from "react-icons/fa";

const ProductCardFooter = ({
  onCompare,
  compareChecked = false,
  compareLabel = "Compare",
  onView,
  viewLabel = "View full details",
}) => (
  <div className="mt-3 flex min-h-10 items-center justify-between gap-2 border-t border-slate-200/80 bg-transparent px-1 pt-3">
    {onCompare ? (
      <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700 transition hover:text-blue-700">
        <input
          type="checkbox"
          checked={compareChecked}
          onChange={onCompare}
          onClick={(event) => event.stopPropagation()}
          className="h-4 w-4 appearance-none rounded border border-slate-300 bg-white checked:border-blue-600 checked:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1"
        />
        {compareLabel}
      </label>
    ) : (
      <span />
    )}
    <button
      type="button"
      onClick={onView}
      className="inline-flex items-center gap-1 text-sm font-bold text-blue-700 transition hover:text-blue-800"
    >
      {viewLabel}
      <FaChevronRight className="text-xs" />
    </button>
  </div>
);

export default ProductCardFooter;
