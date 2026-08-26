import React, { useMemo, useState } from "react";
import { FaChevronDown, FaMinus, FaPlus } from "react-icons/fa";

const cleanFaqText = (value) =>
  String(value || "")
    .replace(/\s+/g, " ")
    .trim();

const SmartphoneFaqSection = ({
  items = [],
  title = "Frequently Asked Questions",
  initialLimit = 6,
  className = "",
}) => {
  const [openId, setOpenId] = useState(null);
  const [showAll, setShowAll] = useState(false);

  const faqs = useMemo(
    () =>
      (Array.isArray(items) ? items : [])
        .map((item, index) => ({
          id: item?.id || `faq-${index}`,
          question: cleanFaqText(item?.question),
          answer: cleanFaqText(item?.answer),
          category: cleanFaqText(item?.category),
        }))
        .filter((item) => item.question && item.answer),
    [items],
  );

  if (!faqs.length) return null;

  const visibleLimit = Math.max(1, Number(initialLimit) || 6);
  const visibleFaqs = showAll ? faqs : faqs.slice(0, visibleLimit);
  const hasMore = faqs.length > visibleLimit;
  const renderFaqCard = (faq) => {
    const isOpen = openId === faq.id;

    return (
      <article
        key={faq.id}
        className="overflow-hidden border-b border-slate-200 bg-transparent shadow-none last:border-b-0 "
      >
        <button
          type="button"
          onClick={() =>
            setOpenId((current) => (current === faq.id ? null : faq.id))
          }
          className="group flex w-full items-start justify-between gap-4 px-0 py-4 text-left focus-visible:outline-none"
          aria-expanded={isOpen}
        >
          <span className="min-w-0">
            {faq.category ? (
              <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-500">
                {faq.category}
              </span>
            ) : null}
            <span className="text-[15px] font-bold leading-6 text-slate-900 transition-colors group-hover:text-blue-700  ">
              {faq.question}
            </span>
          </span>
          <span
            className={`mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors group-focus-visible:ring-2 group-focus-visible:ring-blue-500 group-focus-visible:ring-offset-2 ${
              isOpen
                ? "bg-blue-600 text-white"
                : "bg-slate-50 text-blue-600 group-hover:bg-blue-50   "
            }`}
            aria-hidden="true"
          >
            {isOpen ? (
              <FaMinus className="text-[9px]" />
            ) : (
              <FaPlus className="text-[9px]" />
            )}
          </span>
        </button>

        {isOpen ? (
          <div className="border-t border-slate-200 px-0 pb-5 pt-4 ">
            <p className="text-[15px] leading-7 text-slate-600 ">
              {faq.answer}
            </p>
          </div>
        ) : null}
      </article>
    );
  };

  return (
    <section
      className={`overflow-hidden rounded-[20px] bg-transparent  ${className}`}
    >
      <header className="flex flex-col gap-2 px-4 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-blue-600  sm:text-[11px]">
            Helpful answers
          </p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950 ">
            {title}
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-500 ">
            Quick answers about price, launch status, specifications, and everyday use.
          </p>
        </div>
        <span className="text-xs font-semibold text-slate-400">
          {faqs.length} questions
        </span>
      </header>

      <div className="flex flex-col gap-0 px-4 pb-4 sm:px-6 sm:pb-6 lg:hidden">
        {visibleFaqs.map(renderFaqCard)}
      </div>

      <div className="hidden grid-cols-2 items-start gap-4 px-6 pb-6 lg:grid">
        <div>
          {visibleFaqs.filter((_, index) => index % 2 === 0).map(renderFaqCard)}
        </div>
        <div>
          {visibleFaqs.filter((_, index) => index % 2 === 1).map(renderFaqCard)}
        </div>
      </div>

      {hasMore ? (
        <div className="flex justify-center px-4 pb-5 sm:px-6">
          <button
            type="button"
            onClick={() => setShowAll((current) => !current)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-2.5 text-sm font-bold text-blue-700 transition hover:bg-blue-100  "
          >
            {showAll ? "Show fewer questions" : "View all questions"}
            <FaChevronDown
              className={`text-[10px] transition-transform ${showAll ? "rotate-180" : ""}`}
            />
          </button>
        </div>
      ) : null}
    </section>
  );
};

export default SmartphoneFaqSection;
