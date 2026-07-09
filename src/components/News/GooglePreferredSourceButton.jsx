import React from "react";

const PREFERRED_SOURCE_DOMAIN = "tryhook.shop";
const PREFERRED_SOURCE_URL = `https://google.com/preferences/source?q=${encodeURIComponent(
  PREFERRED_SOURCE_DOMAIN,
)}`;

const GoogleGLogo = ({ className = "h-5 w-5" }) => (
  <svg
    aria-hidden="true"
    className={className}
    viewBox="0 0 48 48"
    focusable="false"
  >
    <path
      fill="#EA4335"
      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
    />
    <path
      fill="#4285F4"
      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
    />
    <path
      fill="#FBBC05"
      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z"
    />
    <path
      fill="#34A853"
      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
    />
    <path fill="none" d="M0 0h48v48H0z" />
  </svg>
);

const GoogleMark = ({ compact = false }) => (
  <span
    aria-hidden="true"
    className={[
      "inline-flex shrink-0 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-black/5",
      compact ? "h-8 w-8" : "h-10 w-10",
    ].join(" ")}
  >
    <GoogleGLogo className={compact ? "h-5 w-5" : "h-6 w-6"} />
  </span>
);

const GooglePreferredSourceButton = ({
  className = "",
  panel = false,
  compact = false,
  variant = "badge",
}) => {
  const isArticle = variant === "article";

  const button = (
    <a
      href={PREFERRED_SOURCE_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Add Hooks as a preferred source on Google"
      className={[
        isArticle
          ? "group flex w-full max-w-full flex-col items-start gap-3 rounded-sm bg-[#f8fafc] px-4 py-3 text-left transition hover:bg-[#f3f6fb] focus:outline-none focus:ring-2 focus:ring-[#4285f4] focus:ring-offset-2 sm:min-h-[64px] sm:flex-row sm:items-center sm:justify-between"
          : "inline-flex max-w-full items-center gap-3 rounded-[8px] bg-[#111111] px-4 py-3 text-left text-white shadow-[0_10px_24px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:bg-[#202124] focus:outline-none focus:ring-2 focus:ring-[#4285f4] focus:ring-offset-2",
        compact ? "w-full" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="flex min-w-0 items-center gap-3">
        <GoogleMark compact={!isArticle} />
        <span className="min-w-0">
          <span
            className={[
              "block font-bold",
              isArticle
                ? "text-[13px] leading-5 text-[#111827] sm:text-[14px]"
                : "text-[13px] leading-4 text-white sm:text-[14px]",
            ].join(" ")}
          >
            {isArticle
              ? "Add Hooks as a preferred source on Google"
              : "Add Hooks as a preferred source"}
          </span>
          <span
            className={[
              "mt-0.5 block font-medium",
              isArticle
                ? "text-[11px] leading-4 text-[#667085] sm:text-[12px]"
                : "text-[11px] leading-4 text-white/72",
            ].join(" ")}
          >
            {isArticle
              ? "Open Google source preferences for this publication"
              : "on Google"}
          </span>
        </span>
      </span>
      {isArticle ? (
        <span className="hidden shrink-0 rounded-full bg-[#111827] px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.12em] text-white transition group-hover:bg-[#2563eb] sm:inline-flex">
          Add
        </span>
      ) : null}
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
