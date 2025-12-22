import React from "react";

// Smooth, lightweight spinner with proper animation and accessibility
export default function Spinner({
  size = 18,
  className = "",
  color = "#3b82f6", // Tailwind blue-600
  bgColor = "#e5e7eb", // Tailwind gray-200
  speed = "normal",
}) {
  const px = typeof size === "number" ? `${size}px` : size;

  // Animation speed presets
  const speedClasses = {
    slow: "animate-[spin_1.5s_linear_infinite]",
    normal: "animate-[spin_0.75s_linear_infinite]",
    fast: "animate-[spin_0.5s_linear_infinite]",
  };

  // Use custom animation for smoother rendering
  const animationStyle = {
    animation: `${
      speedClasses[speed] || speedClasses.normal
    } 0.75s linear infinite`,
    width: px,
    height: px,
    borderTopColor: color,
    borderLeftColor: color,
    borderRightColor: bgColor,
    borderBottomColor: bgColor,
  };

  return (
    <div
      role="status"
      aria-label="Loading..."
      style={animationStyle}
      className={`
        inline-block rounded-full border-2
        ${speedClasses[speed] || speedClasses.normal}
        ${className}
      `}
    ></div>
  );
}
