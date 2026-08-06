import React from "react";
import { FaArrowRight } from "react-icons/fa";
import { Link } from "react-router-dom";

const SectionHeading = ({
  eyebrow,
  title,
  description,
  actionLabel,
  actionTo,
  align = "left",
  className = "",
}) => (
  <div
    className={`hooks-section-heading ${align === "center" ? "text-center" : ""} ${className}`}
  >
    <div>
      {eyebrow ? <p className="hooks-eyebrow">{eyebrow}</p> : null}
      <h2 className="hooks-section-title">{title}</h2>
      {description ? <p className="hooks-section-copy">{description}</p> : null}
    </div>
    {actionLabel && actionTo ? (
      <Link to={actionTo} className="hooks-text-link">
        {actionLabel}
        <FaArrowRight aria-hidden="true" />
      </Link>
    ) : null}
  </div>
);

export default SectionHeading;
