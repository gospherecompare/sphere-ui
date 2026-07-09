import React from "react";

const PREFERRED_SOURCE_DOMAIN = "tryhook.shop";
const PREFERRED_SOURCE_URL = `https://google.com/preferences/source?q=${encodeURIComponent(
  PREFERRED_SOURCE_DOMAIN,
)}`;

const GoogleMark = () => (
  <span
    aria-hidden="true"
    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[20px] font-black leading-none"
  >
    <span className="bg-gradient-to-r from-[#4285f4] via-[#34a853] to-[#fbbc05] bg-clip-text text-transparent">
      G
    </span>
  </span>
);

const GooglePreferredSourceButton = ({
  className = "",
  panel = false,
  compact = false,
}) => {
  const button = (
    <a
      href={PREFERRED_SOURCE_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Add Hooks as a preferred source on Google"
      className={[
        "inline-flex max-w-full items-center gap-3 rounded-[8px] bg-[#111111] px-4 py-3 text-left text-white shadow-[0_10px_24px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:bg-[#202124] focus:outline-none focus:ring-2 focus:ring-[#4285f4] focus:ring-offset-2",
        compact ? "w-full" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <GoogleMark />
      <span className="min-w-0">
        <span className="block text-[13px] font-bold leading-4 sm:text-[14px]">
          Add Hooks as a preferred source
        </span>
        <span className="mt-0.5 block text-[11px] font-medium leading-4 text-white/72">
          on Google
        </span>
      </span>
    </a>
  );

  if (!panel) return button;

  return (
    <section className="bg-white p-4">
      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#5f6b7a]">
        Google
      </p>
      <div className="mt-3">{button}</div>
    </section>
  );
};

export { PREFERRED_SOURCE_DOMAIN, PREFERRED_SOURCE_URL };
export default GooglePreferredSourceButton;
