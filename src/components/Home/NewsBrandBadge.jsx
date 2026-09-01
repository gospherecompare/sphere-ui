import React, { useEffect, useState } from "react";
import MobilesXLogo from "../ui/MobileX";

export const NewsBrandBadge = ({
  brandName = "MobilesX",
  brandLogo = "",
  className = "",
  logoClassName = "",
  textClassName = "",
}) => {
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    setLogoError(false);
  }, [brandLogo, brandName]);

  const showLogo = Boolean(brandLogo) && !logoError;

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      {showLogo ? (
        <img
          src={brandLogo}
          alt={`${brandName} logo`}
          className={`h-4 w-auto shrink-0 object-contain sm:h-5 ${logoClassName}`}
          loading="lazy"
          onError={() => setLogoError(true)}
        />
      ) : null}

      <span className={textClassName}>{brandName}</span>
    </span>
  );
};

export const MobilesXSignature = ({ variant = "dark", className = "" }) => {
  const isDark = variant === "dark";

  return (
    <span
      className={`inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] ${
        isDark ? "text-white/75" : "text-slate-700"
      } ${className}`}
    >
      <MobilesXLogo
        className={`h-3.5 w-3.5 shrink-0 object-contain ${
          isDark ? "" : "opacity-90"
        }`}
      />
      MobilesX
    </span>
  );
};
