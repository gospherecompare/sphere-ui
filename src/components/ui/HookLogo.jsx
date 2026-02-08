import React, { useId } from "react";

export default function HookLogo({
  className,
  title = "Hook",
  "aria-label": ariaLabel = "Hook",
}) {
  const reactId = useId();
  const gradientId = `hook-logo-gradient-${reactId.replace(/:/g, "")}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 420 120"
      preserveAspectRatio="xMinYMid meet"
      role="img"
      aria-label={ariaLabel}
      className={["text-gray-900", className].filter(Boolean).join(" ")}
    >
      {title ? <title>{title}</title> : null}

      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="50%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
      </defs>

      <rect
        x="12"
        y="20"
        width="36"
        height="80"
        rx="18"
        fill={`url(#${gradientId})`}
      />
      <rect
        x="52"
        y="16"
        width="36"
        height="88"
        rx="18"
        fill={`url(#${gradientId})`}
      />

      <circle cx="49" cy="60" r="7" fill="#fff" />
      <circle cx="34" cy="42" r="5" fill="#fff" />
      <circle cx="34" cy="78" r="5" fill="#fff" />

      <text
        fontSize="72"
        fontWeight="700"
        fill="#111827"
        x="110"
        y="82"
        stroke="#111827"
        strokeWidth="1.2"
        paintOrder="stroke fill"
        fontFamily="Snell Roundhand, Apple Chancery, cursive"
      >
        ook
      </text>
    </svg>
  );
}
