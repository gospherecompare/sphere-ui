import React from "react";
import { FaCheck, FaStar, FaSyncAlt, FaTimes } from "react-icons/fa";

const PopularFeatureFilterSheet = ({
  open,
  features = [],
  pendingFeature = "",
  onPendingChange,
  onApply,
  onCancel,
  title = "Popular Features",
  subtitle = "Choose one popular buying signal",
  selectionLabel = "All popular features",
  applyLabel = "Apply feature",
}) => {
  if (!open) return null;

  const pendingName =
    features.find((feature) => feature.id === pendingFeature)?.name ||
    selectionLabel;

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center p-0 sm:items-center sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-[3px]"
        aria-label="Close popular features"
        onClick={onCancel}
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[24px] bg-white ring-1 ring-slate-200 sm:max-h-[86vh] sm:max-w-4xl sm:rounded-[24px]"
      >
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-7 sm:py-5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600">
              <FaStar className="text-sm" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xl font-black tracking-[-0.02em] text-slate-950 sm:text-2xl">
                  {title}
                </h3>
                {pendingFeature ? (
                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-blue-700">
                    1 selected
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">
                {subtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200 hover:text-slate-950"
            aria-label="Close popular features"
          >
            <FaTimes />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
          <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-blue-100 bg-blue-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-blue-600">
                Current selection
              </p>
              <p className="mt-1 text-sm font-black text-slate-950">
                {pendingName}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onPendingChange?.("")}
              className="inline-flex min-h-9 items-center justify-center gap-2 self-start rounded-xl bg-white px-3 text-xs font-bold text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50"
            >
              <FaSyncAlt className="text-[10px]" />
              Clear
            </button>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              const selected = pendingFeature === feature.id;
              return (
                <button
                  key={feature.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onPendingChange?.(selected ? "" : feature.id)}
                  className={`group flex min-h-[76px] items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition ${
                    selected
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-slate-50"
                  }`}
                >
                  <span
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                      selected
                        ? "bg-blue-600 text-white"
                        : "bg-slate-50 text-blue-600"
                    }`}
                  >
                    {Icon ? <Icon /> : <FaStar />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-black">
                      {feature.name}
                    </span>
                    <span
                      className={`mt-0.5 block truncate text-[10px] font-medium ${
                        selected ? "text-blue-600" : "text-slate-400"
                      }`}
                    >
                      {feature.description || "Select feature"}
                    </span>
                  </span>
                  <span
                    className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[10px] ${
                      selected
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {selected ? <FaCheck /> : "+"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <footer className="grid shrink-0 grid-cols-2 gap-3 border-t border-slate-100 bg-white px-5 py-3.5 sm:px-7 sm:py-4">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-11 rounded-xl bg-slate-100 px-5 py-3 text-[13px] font-bold text-slate-700 transition hover:bg-slate-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onApply}
            className="min-h-11 rounded-xl bg-blue-600 px-5 py-3 text-[13px] font-black text-white transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20"
          >
            {pendingFeature ? applyLabel : "Show all features"}
          </button>
        </footer>
      </section>
    </div>
  );
};

export default PopularFeatureFilterSheet;
