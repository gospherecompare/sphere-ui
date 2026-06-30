import React, { useMemo, useState } from "react";
import { FaChevronDown } from "react-icons/fa";

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

  return (
    <section
      className={`overflow-hidden rounded-2xl border border-[#e5eaf5] bg-white shadow-[0_18px_44px_rgba(15,23,42,0.06)] ${className}`}
    >
      <div className="flex items-center justify-between gap-3 border-b border-blue-500 px-4 py-4 sm:px-6">
        <h2 className="text-lg font-bold tracking-tight text-[#07122f] sm:text-xl">
          {title}
        </h2>
        {hasMore ? (
          <button
            type="button"
            onClick={() => setShowAll((current) => !current)}
            className="shrink-0 text-sm font-bold text-blue-600 transition hover:text-blue-700"
          >
            {showAll ? "Show less" : "View all"}
          </button>
        ) : null}
      </div>

      <div className="divide-y divide-[#e5eaf5] bg-white">
        {visibleFaqs.map((faq) => {
          const isOpen = openId === faq.id;
          return (
            <article key={faq.id} className="bg-white">
              <button
                type="button"
                onClick={() =>
                  setOpenId((current) => (current === faq.id ? null : faq.id))
                }
                className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left sm:px-6"
                aria-expanded={isOpen}
              >
                <span className="text-sm font-bold leading-6 text-[#07122f] sm:text-base">
                  {faq.question}
                </span>
                <span
                  className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-blue-200 text-blue-600 transition ${
                    isOpen ? "rotate-180 bg-blue-50" : "bg-white"
                  }`}
                  aria-hidden="true"
                >
                  <FaChevronDown className="text-xs" />
                </span>
              </button>

              {isOpen ? (
                <div className="px-4 pb-4 pr-12 sm:px-6 sm:pr-16">
                  <p className="text-sm leading-7 text-[#44516f]">
                    {faq.answer}
                  </p>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default SmartphoneFaqSection;
