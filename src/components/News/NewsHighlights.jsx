import React from "react";
import { FaCheck, FaLightbulb, FaFire, FaStar } from "react-icons/fa";

const ICON_MAP = {
  check: FaCheck,
  lightbulb: FaLightbulb,
  fire: FaFire,
  star: FaStar,
};

const NewsHighlights = ({ highlights = [], variant = "full" }) => {
  if (!highlights || highlights.length === 0) {
    return null;
  }

  // If it's just an array of strings, convert to objects with default icon
  const normalizedHighlights = highlights.map((h) =>
    typeof h === "string" ? { text: h, icon: "check" } : h,
  );

  if (variant === "badges") {
    return (
      <div className="flex flex-wrap gap-2">
        {normalizedHighlights.map((item, idx) => (
          <span
            key={idx}
            className="rounded-md border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700"
          >
            {typeof item === "string" ? item : item.text}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3  bg-gradient-to-br from-blue-50 to-slate-50 p-4 sm:p-5">
      <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-slate-900">
        Key Highlights
      </h3>

      <ul className="space-y-2.5">
        {normalizedHighlights.map((item, idx) => {
          const Icon =
            ICON_MAP[typeof item === "object" ? item.icon : "check"] || FaCheck;
          const text = typeof item === "string" ? item : item.text;

          return (
            <li
              key={idx}
              className="flex items-start gap-3 text-sm leading-relaxed text-slate-700"
            >
              <Icon className="mt-1 h-3.5 w-3.5 flex-shrink-0 text-blue-600" />
              <span>{text}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default NewsHighlights;
