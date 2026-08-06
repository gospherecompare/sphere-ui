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
}) => (
  <div
    className={`smartphones-mobile-toolbar sticky top-[var(--mobile-listing-controls-top,52px)] z-40 -mx-3 mb-3 bg-transparent px-3 py-2 lg:hidden dark:text-[#f3f7ff] ${className}`}
  >
    <div className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <button
        type="button"
        onClick={onOpenFilters}
        className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[#e2e8f0] bg-transparent text-blue-600 active:border-blue-300 active:bg-blue-50/60 dark:border-[#2a3d58] dark:text-[#8eb0ff] dark:active:border-[#4c6f9f] dark:active:bg-[#132640]"
        aria-label="Open smartphone search"
      >
        <FaSearch className="text-xs" />
      </button>

      <button
        type="button"
        onClick={onOpenPopularFeatures}
        className="flex h-11 min-w-[11.5rem] items-center gap-2.5 rounded-xl border border-[#e2e8f0] bg-transparent px-3 text-left active:border-blue-300 active:bg-blue-50/60 dark:border-[#2a3d58] dark:active:border-[#4c6f9f] dark:active:bg-[#132640]"
      >
        <FaStar className="shrink-0 text-xs text-blue-600" />
        <span className="min-w-0 flex-1 truncate text-[11px] font-extrabold text-[#0f172a] dark:text-[#eaf1ff]">
          {activeFeatureCount > 0 ? currentFeatureLabel : "Popular Features"}
        </span>
        {activeFeatureCount > 0 ? (
          <span className="grid h-4 min-w-4 shrink-0 place-items-center rounded-full bg-blue-600 px-1 text-[8px] font-black text-white">
            {activeFeatureCount}
          </span>
        ) : null}
        <FaChevronDown className="shrink-0 text-[8px] text-slate-500" />
      </button>

      <button
        type="button"
        onClick={onOpenFilters}
        className="flex h-11 min-w-[9.5rem] items-center gap-2.5 rounded-xl border border-[#e2e8f0] bg-transparent px-3 text-left active:border-blue-300 active:bg-blue-50/60 dark:border-[#2a3d58] dark:active:border-[#4c6f9f] dark:active:bg-[#132640]"
      >
        <FaFilter className="shrink-0 text-xs text-blue-600" />
        <span className="min-w-0 flex-1 truncate text-[11px] font-extrabold text-[#0f172a] dark:text-[#eaf1ff]">
          All Filters
        </span>
        {activeFilterCount > 0 ? (
          <span className="grid h-4 min-w-4 shrink-0 place-items-center rounded-full bg-blue-600 px-1 text-[8px] font-black text-white">
            {activeFilterCount}
          </span>
        ) : null}
        <FaChevronDown className="shrink-0 text-[8px] text-slate-500" />
      </button>

      <label className="flex h-11 min-w-[12rem] items-center gap-2.5 rounded-xl border border-[#e2e8f0] bg-transparent px-3 active:border-blue-300 dark:border-[#2a3d58] dark:active:border-[#4c6f9f]">
        <FaSyncAlt className="shrink-0 text-xs text-blue-600" />
        <span className="min-w-0 flex-1 whitespace-nowrap text-[10px] font-medium text-[#64748b] dark:text-[#94a4bd]">
          Sort by:
          <select
            value={sortBy}
            onChange={(event) => onSortChange?.(event.target.value)}
            aria-label="Sort smartphones"
            className="ml-1 max-w-[7.5rem] cursor-pointer appearance-none bg-transparent pr-4 text-[11px] font-extrabold text-[#0f172a] outline-none dark:text-[#eaf1ff] dark:[&>option]:bg-[#0f1c2d]"
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

      <div className="absolute bottom-0 left-0 right-0 mx-auto flex max-h-[75vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-[#e2e8f0] bg-[#ffffff] sm:bottom-4 sm:rounded-2xl dark:border-[#2a3d58] dark:bg-[#0f1c2d]">
        <div className="flex items-center justify-between gap-4 border-b border-[#e2e8f0] bg-[#ffffff] px-5 py-4 sm:px-6 dark:border-[#263750] dark:bg-[#0f1c2d]">
          <div className="min-w-0">
            <h3 className="text-xl font-bold text-[#0f172a] dark:text-[#f3f7ff]">Sort Options</h3>
            {subtitle ? (
              <p className="mt-1 text-sm text-[#64748b] dark:text-[#94a4bd]">{subtitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[#64748b] transition-colors duration-200 hover:bg-slate-100 hover:text-slate-800 dark:text-[#94a4bd] dark:hover:bg-[#132238] dark:hover:text-[#eaf1ff]"
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
                  ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-[#3d67a7] dark:bg-[#142b52] dark:text-[#a9c2ff]"
                  : "border-slate-100 bg-white text-slate-700 hover:border-blue-200 hover:text-blue-700 dark:border-[#263750] dark:bg-[#0f1c2d] dark:text-[#c7d2e5] dark:hover:border-[#4c6f9f] dark:hover:text-[#a9c2ff]"
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
