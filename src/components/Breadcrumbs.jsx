import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import useBreadcrumbs from "use-react-router-breadcrumbs";
import { FaChevronRight, FaHome } from "react-icons/fa";

const PRODUCT_DETAIL_PATH_RE =
  /^\/(smartphones|laptops|tvs|appliances|networking)\/[^/]+\/?$/i;
const LEGACY_DETAILS_PATH_RE =
  /^\/(smartphones|laptops|tvs|appliances|networking)\/details\/?$/i;
const DETAIL_QUERY_KEYS = [
  "name",
  "product_name",
  "product",
  "title",
  "model",
];

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

const cleanDocumentTitle = (value) => {
  let title = String(value || "").trim();
  if (!title) return "";
  // Remove date suffix used in detail pages: [dd/mm/yyyy]
  title = title.replace(/\s*\[\d{2}\/\d{2}\/\d{4}\]\s*$/i, "");
  // Remove optional site suffix if present
  title = title.replace(/\s+\|\s+hooks\s*$/i, "");
  if (/^details$/i.test(title)) return "";
  return title;
};

const toProductLabel = (value) => {
  let text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text) return "";
  text = text.replace(/\s*\[\d{2}\/\d{2}\/\d{4}\]\s*$/i, "");
  text = text.replace(/\s+\|\s+hooks\s*$/i, "");
  // Product headings often append specs with " - " or " | ".
  if (text.includes(" - ")) text = text.split(" - ")[0].trim();
  if (text.includes(" | ")) text = text.split(" | ")[0].trim();
  if (/^details$/i.test(text)) return "";
  return text;
};

const cleanHeadingText = (value) => {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text) return "";
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
  { path: "/trending", breadcrumb: "Products" },
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
  { path: "/smartphones", breadcrumb: "Smartphones" },
  { path: "/laptops", breadcrumb: "Laptops" },
  { path: "/networking", breadcrumb: "Networking" },
  { path: "/tvs", breadcrumb: "TVs" },
  { path: "/appliances", breadcrumb: "TVs" },
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
      const heading = toProductLabel(
        document.querySelector("h1")?.textContent,
      );
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
    if (label !== "details") return true;
    const next = arr[idx + 1];
    if (!next) return true;
    const nextPath = String(next.match?.pathname || "").toLowerCase();
    return !/\/smartphones\/details\/(under|above)[-_ ]?\d+/.test(nextPath);
  });

  return (
    <div className="px-2 lg:px-4 mx-auto bg-white max-w-6xl w-full m-0 overflow-hidden pb-1">
      <nav
        aria-label="breadcrumb"
        className="flex items-center overflow-x-auto gap-1 hide-scrollbar no-scrollbar scroll-smooth py-2"
      >
        {visibleBreadcrumbs.map((bc, idx) => {
          const isLast = idx === visibleBreadcrumbs.length - 1;
          const to = bc.match.pathname;
          const rawLabel =
            typeof bc.breadcrumb === "function"
              ? bc.breadcrumb(bc.match)
              : bc.breadcrumb;
          let label = formatPriceBreadcrumb(rawLabel, bc.match.pathname);
          const labelText = getLabelText(label).trim().toLowerCase();

          const path = String(location.pathname || "");
          const isLegacyDetailsPath = LEGACY_DETAILS_PATH_RE.test(path);
          const isProductDetailPath = PRODUCT_DETAIL_PATH_RE.test(path);

          // Always prefer resolved product title on detail pages for the last crumb.
          if (isLast && isProductDetailPath && detailCrumbLabel) {
            label = detailCrumbLabel;
          } else if (labelText === "details" && isLegacyDetailsPath && detailCrumbLabel) {
            label = detailCrumbLabel;
          }

          return (
            <div key={to + idx} className="flex items-center shrink-0">
              {/* Breadcrumb Item */}
              {!isLast ? (
                <Link
                  to={to}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm transition-all duration-200 group relative"
                >
                  {/* Home Icon for first item */}
                  {idx === 0 ? (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-100 to-red-50 flex items-center justify-center group-hover:from-purple-50 group-hover:to-red-100 transition-all duration-200">
                        <FaHome className="text-gray-500 group-hover:text-red-600 text-sm transition-colors" />
                      </div>
                      <span className="text-gray-600 group-hover:text-gray-900 font-medium transition-colors">
                        {label}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <span className="text-gray-600 group-hover:text-gray-900 font-medium transition-colors">
                        {label}
                      </span>
                    </div>
                  )}

                  {/* Hover effect line */}
                  <div className="absolute bottom-0 left-3 right-3 h-0.5 bg-gradient-to-r from-purple-600 to-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                </Link>
              ) : (
                <div className="flex items-center gap-1 px-3 py-1.5 relative">
                  {/* Current page indicator */}
                  <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-purple-600 to-red-600 absolute -left-1"></div>
                  <span className="text-gray-900 font-semibold text-sm bg-gradient-to-r from-purple-600 to-purple-600 bg-clip-text text-transparent">
                    {label}
                  </span>
                </div>
              )}

              {/* Separator (not for last item) */}
              {!isLast && (
                <div className="flex items-center px-1">
                  <FaChevronRight className="text-gray-300 text-xs" />
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Current Page Indicator Line */}
      <div className="h-px bg-gradient-to-r from-purple-100 via-purple-200 to-red-200"></div>

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
  );
}
