import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FaTimes } from "react-icons/fa";

const AiSummary = ({ summary = "" }) => {
  const [open, setOpen] = useState(false);

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

  if (!summary) {
    return null;
  }

  return (
    <section className="mt-6" aria-label="AI summary">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full border-2 border-blue-600 bg-white px-4 py-2 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-50"
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

            <p className="mt-4 text-[17px] font-normal leading-[1.75] tracking-[0.01em] text-slate-800">
              {summary}
            </p>

            <div className="mt-6 border-t border-slate-200 pt-5">
              <p className="text-[14px] font-normal leading-[1.6] text-slate-500">
                AI-generated for quick reference. It may contain inaccuracies
                or omit important details. Please verify the full article for
                complete and accurate information.
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
