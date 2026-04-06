import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import useBreadcrumbs from "use-react-router-breadcrumbs";
import { FaChevronRight, FaHome } from "react-icons/fa";

const PRODUCT_DETAIL_PATH_RE =
  /^\/(smartphones|laptops|tvs|appliances|networking)\/[^/]+\/?$/i;
const LEGACY_DETAILS_PATH_RE =
  /^\/(smartphones|laptops|tvs|appliances|networking)\/details\/?$/i;
const DETAIL_QUERY_KEYS = ["name", "product_name", "product", "title", "model"];

const safeDecode = (value) => {
  try {
    return decodeURIComponent(String(value || ""));
  } catch {
    return String(value || "");
  }
};

const toReadableTitle = (text) => {
  const raw = String(text || "").trim();
  if (!raw) return "";
  return raw
    .split(/[-_]/g)
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
};

const toProductLabel = (value) => {
  let text = String(value || "")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return "";
  text = text.replace(/\s*\[\d{2}\/\d{2}\/\d{4}\]\s*$/i, "");
  text = text.replace(/\s+\|\s+hooks\s*$/i, "");
  // Product headings often append specs with " - " or " | ".
  if (text.includes(" - ")) text = text.split(" - ")[0].trim();
  if (text.includes(" | ")) text = text.split(" | ")[0].trim();
  if (/^details$/i.test(text)) return "";
  return text;
};

const getDetailLabelFromSearch = (search) => {
  const query = new URLSearchParams(search || "");
  for (const key of DETAIL_QUERY_KEYS) {
    const value = query.get(key);
    if (value) {
      return toReadableTitle(safeDecode(value));
    }
  }
  return "";
};

const slugToTitle = (slug) => {
  if (!slug) return "Details";
  const raw = safeDecode(slug);
  return raw
    .split(/[-_]/g)
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
};

const renderSlugBreadcrumb = ({ match }) =>
  slugToTitle(
    (match && match.params && (match.params.slug || match.params.id)) ||
      "Details",
  );

const renderFilterBreadcrumb = ({ match }) =>
  (() => {
    const raw = String(
      (match && match.params && match.params.filterSlug) || "Filter",
    )
      .trim()
      .toLowerCase();

    if (raw === "new") return "Latest Mobiles";
    if (raw === "trending") return "Top Mobiles";
    if (raw === "upcoming") return "Upcoming Mobiles";

    return slugToTitle(raw || "Filter");
  })();

const getLabelText = (label) => {
  if (typeof label === "string" || typeof label === "number") {
    return String(label);
  }
  if (React.isValidElement(label)) {
    const child = label.props?.children;
    if (typeof child === "string" || typeof child === "number") {
      return String(child);
    }
  }
  return "";
};

const routes = [
  { path: "/", breadcrumb: "Home" },
  { path: "/trending", breadcrumb: "Trending" },
  {
    path: "/trending/:category",
    breadcrumb: ({ match }) => {
      const raw = String(match?.params?.category || "").toLowerCase();
      if (raw.includes("smartphone") || raw.includes("mobile")) {
        return "Smartphones";
      }
      if (raw.includes("laptop") || raw.includes("notebook")) {
        return "Laptops";
      }
      if (raw.includes("tv") || raw.includes("television")) {
        return "TVs";
      }
      return slugToTitle(raw || "products");
    },
  },
  { path: "/products", breadcrumb: "Explore" },
  { path: "/smartphones", breadcrumb: "Smartphones" },
  { path: "/smartphones/upcoming", breadcrumb: "Upcoming Mobiles" },
  { path: "/smartphones/latest", breadcrumb: "Latest Mobiles" },
  { path: "/smartphones/top", breadcrumb: "Top Mobiles" },
  { path: "/laptops", breadcrumb: "Laptops" },
  { path: "/networking", breadcrumb: "Networking" },
  { path: "/tvs", breadcrumb: "TVs" },
  { path: "/appliances", breadcrumb: "TVs" },
  { path: "/smartphones/filter", breadcrumb: null },
  {
    path: "/smartphones/filter/:filterSlug",
    breadcrumb: renderFilterBreadcrumb,
  },
  {
    path: "/smartphones/:slug",
    breadcrumb: renderSlugBreadcrumb,
  },
  {
    path: "/laptops/:slug",
    breadcrumb: renderSlugBreadcrumb,
  },
  {
    path: "/tvs/:slug",
    breadcrumb: renderSlugBreadcrumb,
  },
  {
    path: "/appliances/:slug",
    breadcrumb: renderSlugBreadcrumb,
  },
  {
    path: "/networking/:slug",
    breadcrumb: renderSlugBreadcrumb,
  },
  { path: "/compare", breadcrumb: "Compare" },
  { path: "/login", breadcrumb: "Login" },
  { path: "/signup", breadcrumb: "Signup" },
  { path: "/brands", breadcrumb: "Brands" },
  { path: "/product/:id", breadcrumb: () => "Product Details" },
  { path: "/about", breadcrumb: "About" },
  { path: "/blogs", breadcrumb: "Blogs" },
  {
    path: "/blogs/:slug",
    breadcrumb: renderSlugBreadcrumb,
  },
  {
    path: "/blog/:slug",
    breadcrumb: renderSlugBreadcrumb,
  },
  { path: "/contact", breadcrumb: "Contact" },
  { path: "/privacy-policy", breadcrumb: "Privacy Policy" },
  { path: "/terms", breadcrumb: "Terms" },
];

export default function Breadcrumbs() {
  const breadcrumbs = useBreadcrumbs(routes);
  const location = useLocation();
  const [detailCrumbLabel, setDetailCrumbLabel] = useState("");

  const queryDerivedLabel = useMemo(
    () => getDetailLabelFromSearch(location.search),
    [location.search],
  );

  useEffect(() => {
    const pathname = String(location.pathname || "");
    const isProductDetailPath = PRODUCT_DETAIL_PATH_RE.test(pathname);

    if (!isProductDetailPath) {
      setDetailCrumbLabel("");
      return;
    }

    if (queryDerivedLabel) {
      setDetailCrumbLabel(queryDerivedLabel);
      return;
    }

    const resolveDetailLabel = () => {
      // Prefer visible page heading first, then metadata fallbacks.
      const heading = toProductLabel(document.querySelector("h1")?.textContent);
      if (heading) return heading;

      const ogTitle = toProductLabel(
        document
          .querySelector("meta[property='og:title']")
          ?.getAttribute("content"),
      );
      if (ogTitle) return ogTitle;

      const title = toProductLabel(document.title);
      if (title) return title;

      return "";
    };

    const updateDetailLabel = () => {
      const nextLabel = resolveDetailLabel();
      if (nextLabel) setDetailCrumbLabel(nextLabel);
    };

    updateDetailLabel();

    const observer = new MutationObserver(updateDetailLabel);
    observer.observe(document.head, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => observer.disconnect();
  }, [location.pathname, queryDerivedLabel]);

  const formatPriceBreadcrumb = (label, pathname) => {
    const source = String(pathname || label || "").toLowerCase();
    const match = source.match(/(under|above)[-_ ]?(\d+)/);
    if (!match) return label;
    const [, dir, raw] = match;
    const value = Number(raw);
    if (!Number.isFinite(value)) return label;
    const formatted = value.toLocaleString();
    const prefix = dir === "above" ? "Above" : "Under";
    return `${prefix} ₹${formatted}`;
  };

  // Do not render breadcrumbs on the root/home page
  if (location && location.pathname === "/") return null;

  if (!breadcrumbs || breadcrumbs.length <= 1) return null;

  const visibleBreadcrumbs = breadcrumbs.filter((bc, idx, arr) => {
    const rawLabel =
      typeof bc.breadcrumb === "function"
        ? bc.breadcrumb(bc.match)
        : bc.breadcrumb;
    const label = getLabelText(rawLabel).toLowerCase();
    const crumbPath = String(bc.match?.pathname || "").toLowerCase();
    const currentPath = String(location.pathname || "").toLowerCase();

    if (
      label === "filter" &&
      /\/(smartphones|laptops|tvs|appliances|networking)\/filter(\/|$)/.test(
        currentPath,
      ) &&
      /\/filter(\/|$)/.test(crumbPath || currentPath)
    ) {
      return false;
    }

    if (label !== "details") return true;
    const next = arr[idx + 1];
    if (!next) return true;
    const nextPath = String(next.match?.pathname || "").toLowerCase();
    return !/\/smartphones\/details\/(under|above)[-_ ]?\d+/.test(nextPath);
  });

  const path = String(location.pathname || "");
  const isLegacyDetailsPath = LEGACY_DETAILS_PATH_RE.test(path);
  const isProductDetailPath = PRODUCT_DETAIL_PATH_RE.test(path);
  const shouldCompactOnMobile = visibleBreadcrumbs.length > 2;
  const mobileBreadcrumbs = shouldCompactOnMobile
    ? [visibleBreadcrumbs[0], visibleBreadcrumbs[visibleBreadcrumbs.length - 1]]
    : visibleBreadcrumbs;

  const renderBreadcrumbItem = (bc, idx, isLast, compact = false) => {
    const to = bc.match.pathname;
    const rawLabel =
      typeof bc.breadcrumb === "function"
        ? bc.breadcrumb(bc.match)
        : bc.breadcrumb;
    let label = formatPriceBreadcrumb(rawLabel, bc.match.pathname);
    const labelText = getLabelText(label).trim().toLowerCase();

    // Always prefer resolved product title on detail pages for the last crumb.
    if (isLast && isProductDetailPath && detailCrumbLabel) {
      label = detailCrumbLabel;
    } else if (
      labelText === "details" &&
      isLegacyDetailsPath &&
      detailCrumbLabel
    ) {
      label = detailCrumbLabel;
    }

    if (compact) {
      return (
        <div key={to + idx} className="flex items-center shrink-0">
          {!isLast ? (
            <Link
              to={to}
              className="group flex items-center gap-1 px-2 py-0.5 text-xs transition-all duration-200 relative"
            >
              {idx === 0 ? (
                <div className="flex items-center gap-1.5">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full transition-all duration-200 group-hover:from-purple-50 group-hover:to-red-100">
                    <FaHome className="text-gray-500 text-[10px] transition-colors group-hover:text-red-600" />
                  </div>
                  <span className="max-w-[6.5rem] truncate font-medium text-gray-700 transition-colors group-hover:text-gray-900">
                    {label}
                  </span>
                </div>
              ) : (
                <span className="max-w-[8rem] truncate font-semibold text-gray-900">
                  {label}
                </span>
              )}
            </Link>
          ) : (
            <div className="px-2 py-0.5 text-xs">
              <span className="max-w-[9rem] truncate font-semibold text-gray-900">
                {label}
              </span>
            </div>
          )}
        </div>
      );
    }

    return (
      <div key={to + idx} className="flex items-center shrink-0">
        {!isLast ? (
          <Link
            to={to}
            className="group flex items-center gap-1 px-2.5 py-0.5 text-xs transition-all duration-200"
          >
            {idx === 0 ? (
              <div className="flex items-center gap-1.5">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-purple-100 to-red-50 transition-all duration-200 group-hover:from-purple-50 group-hover:to-red-100">
                  <FaHome className="text-[10px] text-gray-500 transition-colors group-hover:text-red-600" />
                </div>
                <span className="font-medium text-gray-600 transition-colors group-hover:text-gray-900">
                  {label}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <span className="font-medium text-gray-600 transition-colors group-hover:text-gray-900">
                  {label}
                </span>
              </div>
            )}
          </Link>
        ) : (
          <div className="relative flex items-center gap-1 px-2.5 py-0.5">
            <div className="absolute -left-1 h-1.5 w-1.5 rounded-full bg-gradient-to-r from-purple-600 to-red-600" />
            <span className="bg-gradient-to-r from-purple-600 to-purple-600 bg-clip-text text-sm font-semibold text-transparent">
              {label}
            </span>
          </div>
        )}

        {!isLast && (
          <div className="flex items-center px-1">
            <FaChevronRight className="text-xs text-gray-300" />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-transparent border-b border-gray-200">
      <div className="mx-auto w-full max-w-6xl overflow-hidden px-2 pb-0 pt-0.5 lg:px-4">
        <nav
          aria-label="breadcrumb"
          className="flex items-center gap-1 overflow-x-auto py-0.5 sm:hidden hide-scrollbar no-scrollbar scroll-smooth"
        >
          {mobileBreadcrumbs.map((bc, idx) => {
            const isLast = idx === mobileBreadcrumbs.length - 1;
            return (
              <React.Fragment key={`${bc.match.pathname}-${idx}`}>
                {renderBreadcrumbItem(bc, idx, isLast, true)}
                {shouldCompactOnMobile && idx === 0 ? (
                  <span className="flex-shrink-0 px-1 text-xs font-semibold text-gray-400">
                    ...
                  </span>
                ) : null}
              </React.Fragment>
            );
          })}
        </nav>

        <nav
          aria-label="breadcrumb"
          className="hidden items-center gap-1 overflow-x-auto py-0.5 sm:flex hide-scrollbar no-scrollbar scroll-smooth"
        >
          {visibleBreadcrumbs.map((bc, idx) => {
            const isLast = idx === visibleBreadcrumbs.length - 1;
            return renderBreadcrumbItem(bc, idx, isLast, false);
          })}
        </nav>

        <style>{`
        /* Custom scrollbar for consistency */
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      </div>
    </div>
  );
}
