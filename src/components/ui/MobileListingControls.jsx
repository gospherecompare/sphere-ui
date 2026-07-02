import React from "react";
import { FaChevronDown, FaSort, FaTimes } from "react-icons/fa";

const MobileListingControls = ({
  activeFilterCount = 0,
  onOpenFilters,
  onOpenSort,
  className = "",
}) => (
  <div
    className={`sticky top-[64px] z-30 -mx-4 mb-3 border-y border-slate-100 bg-white/95 px-4 py-2.5 shadow-[0_2px_2px_rgba(0,0,0,0.1)] backdrop-blur lg:hidden ${className}`}
  >
    <div className="grid grid-cols-2 gap-2">
      <button
        type="button"
        onClick={onOpenFilters}
        className="flex h-11 items-center justify-between rounded-xl border border-slate-100 bg-white px-3 text-xs font-semibold text-slate-800 shadow-[0_2px_2px_rgba(0,0,0,0.1)] transition-colors hover:border-blue-200 hover:text-blue-700"
      >
        <span className="flex items-center gap-2">
          Filters
          {activeFilterCount > 0 ? (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full border border-blue-200 bg-blue-50 px-1 text-[10px] font-bold text-blue-700">
              {activeFilterCount}
            </span>
          ) : null}
        </span>
        <FaChevronDown className="text-[10px] text-slate-400" />
      </button>

      <button
        type="button"
        onClick={onOpenSort}
        className="flex h-11 items-center justify-between rounded-xl border border-slate-100 bg-white px-3 text-xs font-semibold text-slate-800 shadow-[0_2px_2px_rgba(0,0,0,0.1)] transition-colors hover:border-blue-200 hover:text-blue-700"
      >
        <span className="flex items-center gap-2">
          Sort
        </span>
        <FaChevronDown className="text-[10px] text-slate-400" />
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
        className="absolute inset-0 bg-slate-950/50 transition-opacity duration-300"
        onClick={onClose}
      />

      <div className="absolute bottom-0 left-0 right-0 mx-auto flex max-h-[75vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-slate-100 bg-white shadow-[0_2px_2px_rgba(0,0,0,0.1)] sm:bottom-4 sm:rounded-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h3 className="text-xl font-bold text-slate-900">Sort Options</h3>
            {subtitle ? (
              <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-800"
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
                  ? "border-blue-200 bg-blue-50 text-blue-700"
                  : "border-slate-100 bg-white text-slate-700 shadow-[0_2px_2px_rgba(0,0,0,0.1)] hover:border-blue-200 hover:text-blue-700"
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
