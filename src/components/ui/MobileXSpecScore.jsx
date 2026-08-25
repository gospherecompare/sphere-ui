import React from "react";

const MobileXScoreLogo = ({ className = "h-8 w-8" }) => (
  <svg
    viewBox="0 0 874 420"
    className={className}
    preserveAspectRatio="xMidYMid meet"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    aria-hidden="true"
  >
    <path
      fill="#111318"
      d="M0 419H99L101 142L288 327L471 145L400 75L288 185L101 0H0V419Z"
    />
    <path fill="#111318" d="M365 0L568 202L357 419H476L689 202L488 0H365Z" />
    <path fill="#2563EB" d="M868 0H746L639 117L700 179L868 0Z" />
    <path fill="#2563EB" d="M631 298L746 420H874L694 235L631 298Z" />
  </svg>
);

const normalizeScore = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  if (number <= 1) return Math.max(0, Math.min(100, number * 100));
  if (number <= 10) return Math.max(0, Math.min(100, number * 10));
  return Math.max(0, Math.min(100, number));
};

const MobileXSpecScore = ({ score, compact = false, className = "" }) => {
  const normalized = normalizeScore(score);
  if (normalized == null) return null;

  return (
    <div
      className={`inline-flex max-w-full items-center gap-1.5 rounded-xl bg-blue-50 px-3 py-2 text-blue-700 ${compact ? "h-9 rounded-lg px-2.5" : ""} ${className}`}
      aria-label={`Spec score ${Math.round(normalized)} out of 100`}
    >
      <MobileXScoreLogo className={compact ? "h-7 w-7" : "h-8 w-8"} />
      <span className="flex min-w-0 items-baseline">
        <strong
          className={`${compact ? "text-xl" : "text-2xl"} font-black leading-none`}
        >
          {Math.round(normalized)}
        </strong>
        <small className="ml-0.5 text-[10px] font-bold text-blue-500">
          /100
        </small>
      </span>
      <span className="border-l border-blue-200 pl-2 text-[9px] font-extrabold uppercase tracking-[0.12em] text-blue-700">
        Spec score
      </span>
    </div>
  );
};

export default MobileXSpecScore;
