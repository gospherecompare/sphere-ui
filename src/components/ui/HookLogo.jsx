import React, { useId } from "react";

export default function HookLogo({
  className,
  title = "MobileX",
  "aria-label": ariaLabel = "MobileX",
  brandName = "MobileX",
  showText = true,
}) {
  const gradientId = `hooks-logo-gradient-${useId().replace(/:/g, "")}`;

  return showText ? (
    <svg
      viewBox="0 0 520 120"
      preserveAspectRatio="xMinYMid meet"
      role="img"
      aria-label={ariaLabel || brandName || "MobileX"}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {title ? <title>{title}</title> : null}
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
      <rect
        x="20"
        y="30"
        width="28"
        height="60"
        rx="8"
        stroke={`url(#${gradientId})`}
        strokeWidth="4"
        fill="none"
      />
      <rect
        x="60"
        y="30"
        width="28"
        height="60"
        rx="8"
        stroke={`url(#${gradientId})`}
        strokeWidth="4"
        fill="none"
      />
      <text
        x="110"
        y="60"
        dominantBaseline="middle"
        fontFamily="Poppins, Inter, Arial, sans-serif"
        fontSize="50"
        fontWeight="800"
        letterSpacing="2"
        fill="#111"
      >
        {brandName}
      </text>
    </svg>
  ) : (
    <svg
      viewBox="0 0 120 120"
      role="img"
      aria-label={ariaLabel || brandName || "MobileX"}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {title ? <title>{title}</title> : null}
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
      <rect
        x="20"
        y="30"
        width="28"
        height="60"
        rx="8"
        stroke={`url(#${gradientId})`}
        strokeWidth="4"
        fill="none"
      />
      <rect
        x="60"
        y="30"
        width="28"
        height="60"
        rx="8"
        stroke={`url(#${gradientId})`}
        strokeWidth="4"
        fill="none"
      />
    </svg>
  );
}
