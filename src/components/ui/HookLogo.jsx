import React from "react";

export default function HookLogo({
  className,
  title = "HOOKS",
  "aria-label": ariaLabel = "HOOKS",
  brandName = "HOOKS",
}) {
  const altText = ariaLabel || title || brandName || "HOOKS";

  return (
    <img
      src="/hook-logo.svg"
      alt={altText}
      title={title}
      className={className}
    />
  );
}
