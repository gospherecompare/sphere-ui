import React from "react";
import { FaFilter } from "react-icons/fa";
import ListingFeatureChips from "./ListingFeatureChips";

const ListingFeatureSection = ({
  features = [],
  activeId = "",
  onSelect,
  onClear,
  title = "Popular Features",
  subtitle = "Popular choices from other users (last 7 days)",
}) => (
  <section className="scroll-mt-[120px] overflow-hidden pt-0 pb-2 sm:pb-3">
    <div className="mb-2 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <FaFilter className="text-blue-600" />
        <h3 className="text-sm font-semibold text-slate-900 sm:text-base">
          {title}
        </h3>
      </div>
      {activeId ? (
        <button
          type="button"
          onClick={onClear}
          className="text-xs font-semibold text-blue-700 transition-colors hover:text-blue-900 sm:text-sm"
        >
          Clear
        </button>
      ) : null}
    </div>
    {subtitle ? (
      <p className="mb-2 text-xs text-slate-500">{subtitle}</p>
    ) : null}
    <ListingFeatureChips
      features={features}
      activeId={activeId}
      onSelect={onSelect}
    />
  </section>
);

export default ListingFeatureSection;
