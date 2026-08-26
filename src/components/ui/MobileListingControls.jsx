import React from "react";
import {
  FaChevronDown,
  FaFilter,
  FaSearch,
  FaStar,
  FaSyncAlt,
  FaTimes,
} from "react-icons/fa";

const MobileListingControls = ({
  activeFilterCount = 0,
  activeFeatureCount = 0,
  onOpenFilters,
  onOpenPopularFeatures,
  currentFeatureLabel = "Popular Features",
  sortBy = "featured",
  sortOptions = [],
  onSortChange,
  className = "",
  showDesktop = false,
  showPopularFeatures = true,
}) => (
  <div
    className={`smartphones-mobile-toolbar ${showDesktop ? "" : "lg:hidden"} sticky top-[var(--mobile-listing-controls-top,52px)] z-40 -mx-3 mb-3 bg-transparent px-3 py-2  ${className}`}
  >
    <div
      className={`flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${showDesktop ? "lg:gap-3 lg:py-2" : ""}`}
    >
      <button
        type="button"
        onClick={onOpenFilters}
        className={`grid shrink-0 place-items-center border border-[#e2e8f0] bg-transparent text-blue-600 active:border-blue-300 active:bg-blue-50/60     ${showDesktop ? "h-12 w-12 rounded-2xl" : "h-11 w-11 rounded-xl"}`}
        aria-label="Open smartphone filters and search"
      >
        <FaSearch className="text-xs" />
      </button>

      {showPopularFeatures ? (
        <button
          type="button"
          onClick={onOpenPopularFeatures}
          className={`flex shrink-0 items-center gap-2.5 border border-[#e2e8f0] bg-transparent text-left active:border-blue-300 active:bg-blue-50/60    ${showDesktop ? "min-h-12 min-w-[13.5rem] rounded-2xl px-4" : "h-11 min-w-[11.5rem] rounded-xl px-3"}`}
        >
          <FaStar className="shrink-0 text-xs text-blue-600" />
          <span className="min-w-0 flex-1 truncate text-[11px] font-extrabold text-[#0f172a] ">
            {activeFeatureCount > 0 ? currentFeatureLabel : "Popular Features"}
          </span>
          {activeFeatureCount > 0 ? (
            <span className="grid h-4 min-w-4 shrink-0 place-items-center rounded-full bg-blue-600 px-1 text-[8px] font-black text-white">
              {activeFeatureCount}
            </span>
          ) : null}
          <FaChevronDown className="shrink-0 text-[8px] text-slate-500" />
        </button>
      ) : null}

      <button
        type="button"
        onClick={onOpenFilters}
        className={`flex shrink-0 items-center gap-2.5 border border-[#e2e8f0] bg-transparent text-left active:border-blue-300 active:bg-blue-50/60    ${showDesktop ? "min-h-12 min-w-[11.5rem] rounded-2xl px-4" : "h-11 min-w-[9.5rem] rounded-xl px-3"}`}
      >
        <FaFilter className="shrink-0 text-xs text-blue-600" />
        <span className="min-w-0 flex-1 truncate text-[11px] font-extrabold text-[#0f172a] ">
          All Filters
        </span>
        {activeFilterCount > 0 ? (
          <span className="grid h-4 min-w-4 shrink-0 place-items-center rounded-full bg-blue-600 px-1 text-[8px] font-black text-white">
            {activeFilterCount}
          </span>
        ) : null}
        <FaChevronDown className="shrink-0 text-[8px] text-slate-500" />
      </button>

      <label
        className={`flex shrink-0 items-center gap-2.5 border border-[#e2e8f0] bg-transparent active:border-blue-300   ${showDesktop ? "ml-auto min-h-12 min-w-[15.5rem] rounded-2xl px-4" : "h-11 min-w-[12rem] rounded-xl px-3"}`}
      >
        <FaSyncAlt className="shrink-0 text-xs text-blue-600" />
        <span className="min-w-0 flex-1 whitespace-nowrap text-[10px] font-medium text-[#64748b] ">
          Sort by:
          <select
            value={sortBy}
            onChange={(event) => onSortChange?.(event.target.value)}
            aria-label="Sort smartphones"
            className="ml-1 max-w-[7.5rem] cursor-pointer appearance-none bg-transparent pr-4 text-[11px] font-extrabold text-[#0f172a] outline-none  "
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </span>
        <FaChevronDown className="pointer-events-none shrink-0 text-[8px] text-slate-500" />
      </label>
    </div>
  </div>
);

export const MobileSortSheet = ({
  open,
  onClose,
  onChange,
  options = [],
  sortBy,
  subtitle,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div
        className="absolute inset-0 bg-slate-950/50 transition-opacity duration-300"
        onClick={onClose}
      />

      <div className="absolute bottom-0 left-0 right-0 mx-auto flex max-h-[75vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-[#e2e8f0] bg-[#ffffff] sm:bottom-4 sm:rounded-2xl  ">
        <div className="flex items-center justify-between gap-4 border-b border-[#e2e8f0] bg-[#ffffff] px-5 py-4 sm:px-6  ">
          <div className="min-w-0">
            <h3 className="text-xl font-bold text-[#0f172a] ">
              Sort Options
            </h3>
            {subtitle ? (
              <p className="mt-1 text-sm text-[#64748b] ">
                {subtitle}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[#64748b] transition-colors duration-200 hover:bg-slate-100 hover:text-slate-800   "
            aria-label="Close sort options"
          >
            <FaTimes className="text-base" />
          </button>
        </div>

        <div className="space-y-2 overflow-y-auto px-5 py-5 sm:px-6">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                onClose();
              }}
              className={`flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left transition-colors duration-200 ${
                sortBy === option.value
                  ? "border-blue-200 bg-blue-50 text-blue-700   "
                  : "border-slate-100 bg-white text-slate-700 hover:border-blue-200 hover:text-blue-700     "
              }`}
            >
              <span
                className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border ${
                  sortBy === option.value
                    ? "border-blue-500 bg-blue-500"
                    : "border-slate-300 bg-white"
                }`}
              >
                {sortBy === option.value ? (
                  <span className="h-2 w-2 rounded-full bg-white" />
                ) : null}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">
                  {option.label}
                </span>
                {option.description ? (
                  <span className="mt-1 block text-xs leading-relaxed text-slate-500">
                    {option.description}
                  </span>
                ) : null}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MobileListingControls;
