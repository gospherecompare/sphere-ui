import React from "react";

export default function MobileXLogo({
  className,
  title = "MobileX",
  "aria-label": ariaLabel = "MobileX",
  brandName = "MobileX",
  darkBackground = true,
}) {
  const altText = ariaLabel || title || brandName || "MobileX";
  const primaryColor = darkBackground ? "#FFFFFF" : "#111318";

  return (
    <svg
      className={className}
      viewBox="0 0 874 420"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={altText}
      aria-labelledby={title ? "mobilex-logo-title" : undefined}
    >
      {title && <title id="mobilex-logo-title">{title}</title>}

      {/* M / LEFT GEOMETRY */}
      <path
        fill={primaryColor}
        d="
          M0 419
          H99
          L101 142
          L288 327
          L471 145
          L400 75
          L288 185
          L101 0
          H0
          Z
        "
      />

      {/* CENTRAL CHEVRON / CUT */}
      <path
        fill={primaryColor}
        d="
          M365 0
          L568 202
          L357 419
          H476
          L689 202
          L488 0
          Z
        "
      />

      {/* BLUE X - TOP */}
      <path
        fill="#2563EB"
        d="
          M868 0
          H746
          L639 117
          L700 179
          Z
        "
      />

      {/* BLUE X - BOTTOM */}
      <path
        fill="#2563EB"
        d="
          M631 298
          L746 420
          H874
          L694 235
          Z
        "
      />
    </svg>
  );
}
