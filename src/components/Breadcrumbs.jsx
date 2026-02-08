import React from "react";
import { Link, useLocation } from "react-router-dom";
import useBreadcrumbs from "use-react-router-breadcrumbs";
import { FaChevronRight, FaHome } from "react-icons/fa";

const slugToTitle = (slug) => {
  if (!slug) return "Details";
  return slug
    .toString()
    .split(/[-_]/g)
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
};

const routes = [
  { path: "/", breadcrumb: "Home" },
  { path: "/smartphones", breadcrumb: "Smartphones" },
  { path: "/laptops", breadcrumb: "Laptops" },
  { path: "/networking", breadcrumb: "Networking" },
  { path: "/appliances", breadcrumb: "Appliances" },
  {
    path: "/smartphones/:slug",
    breadcrumb: (match) =>
      slugToTitle(
        (match && match.params && (match.params.slug || match.params.id)) ||
          "Details",
      ),
  },
  {
    path: "/laptops/:slug",
    breadcrumb: (match) =>
      slugToTitle(
        (match && match.params && (match.params.slug || match.params.id)) ||
          "Details",
      ),
  },
  {
    path: "/appliances/:slug",
    breadcrumb: (match) =>
      slugToTitle(
        (match && match.params && (match.params.slug || match.params.id)) ||
          "Details",
      ),
  },
  {
    path: "/networking/:slug",
    breadcrumb: (match) =>
      slugToTitle(
        (match && match.params && (match.params.slug || match.params.id)) ||
          "Details",
      ),
  },
  { path: "/compare", breadcrumb: "Compare" },
  { path: "/login", breadcrumb: "Login" },
  { path: "/signup", breadcrumb: "Signup" },
  { path: "/brands", breadcrumb: "Brands" },
  { path: "/product/:id", breadcrumb: (match) => "Product Details" },
  { path: "/about", breadcrumb: "About" },
  { path: "/contact", breadcrumb: "Contact" },
  { path: "/privacy-policy", breadcrumb: "Privacy Policy" },
  { path: "/terms", breadcrumb: "Terms" },
];

export default function Breadcrumbs() {
  const breadcrumbs = useBreadcrumbs(routes);
  const location = useLocation();

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

  return (
    <div className="px-2 lg:px-4 mx-auto bg-white max-w-6xl w-full m-0 overflow-hidden pb-1">
      <nav
        aria-label="breadcrumb"
        className="flex items-center overflow-x-auto gap-1 hide-scrollbar no-scrollbar scroll-smooth py-2"
      >
        {breadcrumbs
          .filter((bc, idx, arr) => {
            const rawLabel =
              typeof bc.breadcrumb === "function"
                ? bc.breadcrumb(bc.match)
                : bc.breadcrumb;
            const label = String(rawLabel || "").toLowerCase();
            if (label !== "details") return true;
            const next = arr[idx + 1];
            if (!next) return true;
            const nextPath = String(next.match?.pathname || "").toLowerCase();
            return !/\/smartphones\/details\/(under|above)[-_ ]?\d+/.test(
              nextPath,
            );
          })
          .map((bc, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            const to = bc.match.pathname;
            const rawLabel =
              typeof bc.breadcrumb === "function"
                ? bc.breadcrumb(bc.match)
                : bc.breadcrumb;
            const label = formatPriceBreadcrumb(rawLabel, bc.match.pathname);

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
