import React, { useId } from "react";

export default function HookLogo({
  className,
  title = "Hook",
  "aria-label": ariaLabel = "Hook",
}) {
  const reactId = useId();
  const gradientId = `hook-logo-gradient-${reactId.replace(/:/g, "")}`;

  return (
<svg width="160" height="160" viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg">

  <defs>
    <linearGradient id="deviceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3B82F6"/>
      <stop offset="100%" stop-color="#8B5CF6"/>
    </linearGradient>
  </defs>

  <rect width="160" height="160" rx="28" fill="white"/>

  <!-- Left device -->
  <rect x="35" y="40" width="35" height="80"
        rx="10"
        stroke="url(#deviceGradient)"
        stroke-width="6"
        fill="none"/>

  <!-- Right device -->
  <rect x="90" y="40" width="35" height="80"
        rx="10"
        stroke="url(#deviceGradient)"
        stroke-width="6"
        fill="none"/>

</svg>
  );
}
