import React from "react";
import { FaMoon, FaSun } from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";

const ThemeToggle = ({ className = "" }) => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`hooks-theme-toggle ${className}`}
      aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={isDarkMode}
      title={isDarkMode ? "Use light mode" : "Use dark mode"}
    >
      <span className="hooks-theme-toggle__icon" aria-hidden="true">
        {isDarkMode ? <FaSun /> : <FaMoon />}
      </span>
    </button>
  );
};

export default ThemeToggle;
