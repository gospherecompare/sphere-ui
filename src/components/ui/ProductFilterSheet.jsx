import React, { useEffect, useMemo, useState } from "react";
import {
  FaChevronLeft,
  FaChevronRight,
  FaFilter,
  FaTimes,
} from "react-icons/fa";

const SectionRow = ({ section, active = false, onClick }) => {
  const Icon = section?.icon || FaFilter;
  const badge = Number(section?.badge || 0);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-left shadow-none transition-colors ${
        active
          ? "border-blue-500 bg-blue-50 text-blue-700"
          : "border-blue-200 bg-transparent text-slate-700 hover:border-blue-300 hover:bg-blue-50/30"
      }`}
      aria-current={active ? "page" : undefined}
    >
      <span className="flex min-w-0 items-center gap-3">
        <span
          className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
            active ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-600"
          }`}
        >
          <Icon className="text-[11px]" />
        </span>
        <span className="min-w-0 truncate text-[13px] font-bold">
          {section?.title || section?.id}
        </span>
      </span>

      <span className="flex shrink-0 items-center gap-2">
        {badge > 0 ? (
          <span
            className={`inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-1 text-[9px] font-black ${
              active
                ? "bg-blue-100 text-blue-700"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {badge}
          </span>
        ) : null}
        <FaChevronRight
          className={`text-[9px] ${active ? "text-blue-600" : "text-slate-400"}`}
        />
      </span>
    </button>
  );
};

const ProductFilterSheet = ({
  open,
  onClose,
  onReset,
  onApply,
  title = "Filters",
  subtitle = "Refine products by specifications and features",
  applyLabel = "Apply filters",
  resultCount,
  sections = [],
  activeSection,
  onSectionChange,
  desktopContent,
  mobileContent,
  mobileSections = [],
  selectedSummary,
}) => {
  const normalizedSections = useMemo(
    () => sections.filter((section) => section && !section.hidden),
    [sections],
  );
  const normalizedMobileSections = useMemo(
    () =>
      mobileSections.length
        ? mobileSections.filter((section) => section && !section.hidden)
        : [],
    [mobileSections],
  );

  const [mobileSectionId, setMobileSectionId] = useState(null);

  useEffect(() => {
    if (!open || typeof document === "undefined") return undefined;
    const previous = document.activeElement;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (previous && typeof previous.focus === "function") previous.focus();
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) setMobileSectionId(null);
  }, [open]);

  if (!open) return null;

  const selectedMobileSection = normalizedMobileSections.find(
    (section) => section.id === mobileSectionId,
  );

  const hasMobileSectionSystem = normalizedMobileSections.length > 0;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-0 lg:p-6">
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-slate-950/45 backdrop-blur-[3px]"
        onClick={onClose}
        aria-label="Close filters"
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative flex h-full w-full flex-col overflow-hidden bg-white ring-1 ring-blue-200 sm:my-3 sm:h-[calc(100%-1.5rem)] sm:max-w-md sm:rounded-[24px] lg:h-[min(820px,calc(100vh-3rem))] lg:w-[min(1180px,calc(100vw-3rem))] lg:max-w-none lg:rounded-[24px]"
      >
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-blue-200 bg-white px-4 py-3.5 sm:px-5 lg:px-7 lg:py-5">
          <div className="flex min-w-0 items-center gap-3 lg:gap-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600 lg:h-12 lg:w-12 lg:rounded-2xl">
              <FaFilter className="text-sm lg:text-base" />
            </span>
            <div className="min-w-0">
              <h3 className="text-[18px] font-black tracking-[-0.02em] text-slate-950 lg:text-2xl">
                {title}
              </h3>
              <p className="mt-0.5 max-w-[54rem] text-[10px] font-medium leading-4 text-slate-500 sm:text-[11px] lg:mt-1 lg:text-sm lg:leading-5">
                {subtitle}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={onReset}
              className="hidden rounded-xl px-3 py-2 text-sm font-bold text-blue-600 transition hover:bg-blue-50 lg:inline-flex"
            >
              Clear all
            </button>
            <button
              type="button"
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200 hover:text-slate-950 sm:h-10 sm:w-10 lg:h-11 lg:w-11"
              aria-label="Close filters"
            >
              <FaTimes className="text-xs lg:text-sm" />
            </button>
          </div>
        </header>

        <div className="hidden min-h-0 flex-1 lg:grid lg:grid-cols-[18rem_minmax(0,1fr)]">
          <nav className="min-h-0 overflow-y-auto border-r border-blue-200 bg-white px-4 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="space-y-1.5">
              {normalizedSections.map((section) => {
                const id = section.id || section.title;
                return (
                  <SectionRow
                    key={id}
                    section={section}
                    active={id === activeSection}
                    onClick={() => onSectionChange?.(id)}
                  />
                );
              })}
            </div>

            {selectedSummary ? (
              <div className="mt-5 border-t border-slate-100 pt-5">
                {selectedSummary}
              </div>
            ) : null}
          </nav>

          <div className="min-h-0 overflow-y-auto bg-white px-7 py-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {desktopContent}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-transparent lg:hidden">
          {hasMobileSectionSystem ? (
            <>
              {!selectedMobileSection ? (
                <div className="space-y-2.5 bg-transparent px-3.5 py-3.5 sm:px-4">
                  {normalizedMobileSections.map((section) => (
                    <SectionRow
                      key={section.id}
                      section={section}
                      onClick={() => setMobileSectionId(section.id)}
                    />
                  ))}

                  {selectedSummary ? (
                    <div className="mt-3 rounded-2xl border border-blue-200 bg-transparent p-4 shadow-none">
                      {selectedSummary}
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="min-h-full">
                  <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-blue-200 bg-transparent px-4 py-3.5 backdrop-blur sm:px-5">
                    <button
                      type="button"
                      onClick={() => setMobileSectionId(null)}
                      className="inline-flex items-center gap-2 text-[12px] font-black text-slate-700"
                    >
                      <FaChevronLeft className="text-[10px]" />
                      Filters
                    </button>

                    <span className="min-w-0 flex-1 truncate px-2 text-center text-[13px] font-black text-slate-950">
                      {selectedMobileSection.title}
                    </span>

                    <button
                      type="button"
                      onClick={onReset}
                      className="text-[11px] font-bold text-blue-600"
                    >
                      Clear
                    </button>
                  </div>

                  <div className="bg-transparent px-3.5 py-4 sm:px-4">
                    <div className="rounded-2xl border border-blue-200 bg-transparent p-4 shadow-none sm:p-5">
                      {selectedMobileSection.content}
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="px-4 py-4">{mobileContent}</div>
          )}
        </div>

        <footer className="grid shrink-0 grid-cols-2 gap-2.5 border-t border-blue-200 bg-white px-3.5 py-3.5 sm:px-4 lg:gap-3 lg:px-7 lg:py-4">
          <button
            type="button"
            onClick={onReset}
            className="min-h-11 rounded-xl bg-slate-100 px-4 py-3 text-[12px] font-bold text-slate-700 transition hover:bg-slate-200 lg:text-[13px]"
          >
            Reset all
          </button>
          <button
            type="button"
            onClick={onApply}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-[12px] font-black text-white transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 lg:text-[13px]"
          >
            <FaFilter className="text-[10px]" />
            <span>{applyLabel}</span>
            {resultCount != null ? ` (${resultCount})` : ""}
          </button>
        </footer>
      </section>
    </div>
  );
};

export default ProductFilterSheet;
