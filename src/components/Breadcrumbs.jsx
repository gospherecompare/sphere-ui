import React, { useEffect, useMemo, useState } from "react";
import { FaChevronRight, FaHome } from "react-icons/fa";
import { Helmet } from "react-helmet-async";
import { Link, useLocation } from "react-router-dom";
import { createBreadcrumbSchema } from "../utils/schemaGenerators";
import { toCanonicalPagePath, toCanonicalPageUrl } from "../utils/publicUrl";

const decodeSegment = (value = "") => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const titleCase = (value = "") =>
  decodeSegment(String(value || ""))
    .replace(/-price-in-india$/i, "")
    .replace(/-comparison$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace(/\s+/g, " ")
    .trim();

const filterLabels = {
  new: "Latest Smartphones",
  "under-10000": "Phones Under ₹10,000",
  "under-15000": "Phones Under ₹15,000",
  "under-20000": "Phones Under ₹20,000",
  "under-25000": "Phones Under ₹25,000",
  "under-30000": "Phones Under ₹30,000",
  "under-40000": "Phones Under ₹40,000",
  "under-50000": "Phones Under ₹50,000",
  "above-50000": "Phones Above ₹50,000",
};

const routeLabels = {
  smartphones: "Smartphones",
  laptops: "Laptops",
  tvs: "TVs",
  networking: "Networking",
  trending: "Trending",
  compare: "Compare",
  "popular-comparisons": "Popular Comparisons",
  news: "News",
  about: "About MobileX",
  careers: "Careers",
  contact: "Contact",
  "privacy-policy": "Privacy Policy",
  terms: "Terms & Conditions",
  brand: "Brands",
  feature: "Features",
  filter: "Browse by Price",
  upcoming: "Upcoming Smartphones",
};

const detailRoutePrefixes = new Set([
  "smartphones",
  "laptops",
  "tvs",
  "networking",
]);

const resolveVisibleHeading = () => {
  if (typeof document === "undefined") return "";
  const heading = document.querySelector("main h1, [role='main'] h1, h1");
  const value = heading?.textContent?.replace(/\s+/g, " ").trim();
  if (!value || value.length > 140) return "";
  return value;
};

const buildCrumbs = (pathname, dynamicHeading) => {
  const cleanPath = String(pathname || "/").replace(/\/+$/g, "") || "/";
  if (cleanPath === "/") return [];

  const segments = cleanPath.split("/").filter(Boolean);
  const crumbs = [{ label: "Home", path: "/" }];
  let accumulated = "";

  segments.forEach((segment, index) => {
    accumulated += `/${segment}`;
    const previous = segments[index - 1];
    const isLast = index === segments.length - 1;
    const isProductDetail =
      segments.length === 2 &&
      detailRoutePrefixes.has(segments[0]) &&
      index === 1;
    const isNewsDetail =
      segments[0] === "news" && segments.length === 2 && index === 1;
    const isCompareDetail =
      segments[0] === "compare" && segments.length === 2 && index === 1;

    let label = routeLabels[segment] || titleCase(segment);

    if (previous === "filter")
      label = filterLabels[segment] || titleCase(segment);
    if (previous === "brand") label = `${titleCase(segment)} Phones`;
    if (previous === "feature") label = titleCase(segment);
    if ((isProductDetail || isNewsDetail) && isLast && dynamicHeading) {
      label = dynamicHeading;
    }
    if (isCompareDetail) {
      label = titleCase(segment).replace(/\bAnd\b/g, "vs");
    }

    const shouldSkipUtilitySegment = ["filter", "feature", "brand"].includes(
      segment,
    );
    if (!shouldSkipUtilitySegment) {
      crumbs.push({ label, path: toCanonicalPagePath(accumulated) });
    }
  });

  return crumbs;
};

const Breadcrumbs = ({ variant = "default" }) => {
  const location = useLocation();
  const [dynamicHeading, setDynamicHeading] = useState("");

  useEffect(() => {
    setDynamicHeading("");
    if (typeof document === "undefined") return undefined;

    const update = () => {
      const heading = resolveVisibleHeading();
      if (heading) setDynamicHeading(heading);
    };

    update();
    const observer = new MutationObserver(update);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    const timeout = window.setTimeout(update, 1200);

    return () => {
      observer.disconnect();
      window.clearTimeout(timeout);
    };
  }, [location.pathname]);

  const crumbs = useMemo(
    () => buildCrumbs(location.pathname, dynamicHeading),
    [location.pathname, dynamicHeading],
  );

  const schema = useMemo(
    () =>
      createBreadcrumbSchema(
        crumbs.map((crumb) => ({
          label: crumb.label,
          url: toCanonicalPageUrl(crumb.path),
        })),
      ),
    [crumbs],
  );

  const isPlain = variant === "plain";
  const isCompareRoute =
    location.pathname === "/compare" ||
    location.pathname.startsWith("/compare/");

  if (crumbs.length <= 1 || (!isPlain && isCompareRoute)) return null;

  return (
    <div className={isPlain ? "bg-white" : "hooks-breadcrumb-wrap"}>
      <Helmet>
        <script type="application/ld+json" data-hooks-breadcrumb-schema="true">
          {JSON.stringify(schema)}
        </script>
      </Helmet>

      <div className="mx-auto w-full max-w-[1440px] px-3 sm:px-5 lg:px-8">
        <nav
          aria-label="Breadcrumb"
          className={
            isPlain
              ? " no-scrollbar flex min-h-10 items-center gap-2 overflow-x-auto py-2.5 text-xs sm:text-sm"
              : "hooks-breadcrumbs no-scrollbar flex items-center gap-1 overflow-x-auto py-1.5"
          }
        >
          {crumbs.map((crumb, index) => {
            const isLast = index === crumbs.length - 1;
            return (
              <React.Fragment key={`${crumb.path}-${index}`}>
                {index > 0 ? (
                  isPlain ? (
                    <span
                      className="shrink-0 text-slate-300 dark:text-slate-600"
                      aria-hidden="true"
                    >
                      ›
                    </span>
                  ) : (
                    <FaChevronRight
                      className="hooks-breadcrumb-separator h-2.5 w-2.5 shrink-0"
                      aria-hidden="true"
                    />
                  )
                ) : null}

                {isLast ? (
                  <span
                    className={
                      isPlain
                        ? "max-w-[19rem] shrink-0 truncate font-semibold text-slate-900 dark:text-slate-100"
                        : "hooks-breadcrumb-current max-w-[19rem] shrink-0 truncate"
                    }
                    aria-current="page"
                  >
                    {!isPlain && index === 0 ? (
                      <FaHome className="mr-1.5 h-3 w-3" />
                    ) : null}
                    {crumb.label}
                  </span>
                ) : (
                  <Link
                    to={crumb.path}
                    className={
                      isPlain
                        ? "max-w-[15rem] shrink-0 truncate font-medium text-slate-500 transition-colors hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
                        : "hooks-breadcrumb-link max-w-[15rem] shrink-0 truncate"
                    }
                  >
                    {!isPlain && index === 0 ? (
                      <FaHome className="mr-1.5 h-3 w-3" />
                    ) : null}
                    {crumb.label}
                  </Link>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default Breadcrumbs;
