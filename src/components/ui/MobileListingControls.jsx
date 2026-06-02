import React from "react";
import {
  FaChevronDown,
  FaFilter,
  FaSort,
  FaTimes,
} from "react-icons/fa";

const MobileListingControls = ({
  activeFilterCount = 0,
  onOpenFilters,
  onOpenSort,
  className = "",
}) => (
  <div
    className={`sticky top-[64px] z-30 -mx-4 mb-3 border-y border-slate-200/90 bg-white/95 px-4 py-2 shadow-[0_4px_12px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden ${className}`}
  >
    <div className="grid grid-cols-2 gap-2">
      <button
        type="button"
        onClick={onOpenFilters}
        className="flex h-10 items-center justify-between rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 shadow-sm transition-colors hover:border-blue-300 hover:text-blue-700"
      >
        <span className="flex items-center gap-2">
          <FaFilter className="text-blue-600" />
          Filters
          {activeFilterCount > 0 ? (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white">
              {activeFilterCount}
            </span>
          ) : null}
        </span>
        <FaChevronDown className="text-[10px] text-slate-500" />
      </button>

      <button
        type="button"
        onClick={onOpenSort}
        className="flex h-10 items-center justify-between rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 shadow-sm transition-colors hover:border-blue-300 hover:text-blue-700"
      >
        <span className="flex items-center gap-2">
          <FaSort className="text-blue-600" />
          Sort
        </span>
        <FaChevronDown className="text-[10px] text-slate-500" />
      </button>
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
        className="absolute inset-0 bg-black/50 transition-opacity duration-300"
        onClick={onClose}
      />

      <div className="absolute bottom-0 left-0 right-0 max-h-[75vh] overflow-hidden rounded-t-3xl border border-slate-100 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <FaSort className="text-xl text-blue-600" />
            <div>
              <h3 className="text-lg font-bold text-slate-900">Sort Options</h3>
              <p className="text-sm text-slate-500">{subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 transition-colors duration-200 hover:bg-slate-100"
            aria-label="Close sort options"
          >
            <FaTimes className="text-lg text-slate-500" />
          </button>
        </div>

        <div className="space-y-2 overflow-y-auto p-5">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                onClose();
              }}
              className={`w-full rounded-xl border p-3 text-left transition-all duration-200 ${
                sortBy === option.value
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white"
              }`}
            >
              <div className="text-sm font-semibold">{option.label}</div>
              {option.description ? (
                <div className="mt-1 text-xs text-slate-500">
                  {option.description}
                </div>
              ) : null}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MobileListingControls;
