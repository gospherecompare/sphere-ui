import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FaTimes } from "react-icons/fa";

const AiSummary = ({ summary = "" }) => {
  const [open, setOpen] = useState(false);
  const [visibleSummary, setVisibleSummary] = useState("");

  useEffect(() => {
    if (!open) return undefined;

    const closeOnEscape = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("keydown", closeOnEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open || !summary) {
      setVisibleSummary("");
      return undefined;
    }

    const normalizedSummary = String(summary).replace(/\s+/g, " ").trim();
    const revealSpeed =
      normalizedSummary.length > 700
        ? 8
        : normalizedSummary.length > 300
          ? 12
          : 16;

    setVisibleSummary("");
    let currentIndex = 0;
    const interval = window.setInterval(() => {
      currentIndex += 1;
      setVisibleSummary(normalizedSummary.slice(0, currentIndex));

      if (currentIndex >= normalizedSummary.length) {
        window.clearInterval(interval);
      }
    }, revealSpeed);

    return () => window.clearInterval(interval);
  }, [open, summary]);

  if (!summary) {
    return null;
  }

  return (
    <section className="m-0" aria-label="AI summary">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="ai-summary-trigger"
      >
        AI Summary
      </button>

      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6"
              role="presentation"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) setOpen(false);
              }}
            >
              <div
                className="relative max-h-[88vh] w-[calc(100vw-2rem)] max-w-5xl overflow-y-auto rounded-none border-0 bg-white px-5 py-6 font-[Inter,sans-serif] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:w-[calc(100vw-4rem)] sm:px-10 sm:py-9"
                role="dialog"
                aria-modal="true"
                aria-labelledby="ai-summary-title"
              >
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="absolute right-5 top-5 inline-flex h-10 w-10 items-center justify-center border-0 bg-transparent text-xl text-slate-900 transition-colors hover:bg-blue-50 hover:text-blue-700"
                  aria-label="Close AI summary"
                >
                  <FaTimes />
                </button>

                <h2
                  id="ai-summary-title"
                  className="pr-12 text-[30px] font-bold leading-[1.2] tracking-normal text-slate-950"
                >
                  AI Summary
                </h2>

                <div className="mt-4 text-[17px] font-normal leading-[1.75] tracking-[0.01em] text-slate-800">
                  <span>{visibleSummary}</span>
                  {visibleSummary.length <
                  String(summary).replace(/\s+/g, " ").trim().length ? (
                    <span
                      className="ml-0.5 inline-block h-5 w-[2px] translate-y-0.5 animate-pulse bg-blue-600 align-middle"
                      aria-hidden="true"
                    />
                  ) : null}
                </div>

                <div className="mt-6 border-t border-slate-200 pt-5">
                  <p className="text-[14px] font-normal leading-[1.6] text-slate-500">
                    AI-generated for quick reference. It may contain
                    inaccuracies or omit important details. Please verify the
                    full article for complete and accurate information.
                  </p>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </section>
  );
};

export default AiSummary;
