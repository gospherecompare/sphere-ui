/**
 * Responsive Breadcrumbs Component
 * Mobile-optimized navigation breadcrumbs
 */
import React from "react";
import { Link, useLocation } from "react-router-dom";
import PropTypes from "prop-types";

const formatLabel = (segment) =>
  segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const ResponsiveBreadcrumbs = ({ maxItemsOnMobile = 2 }) => {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter(Boolean);

  if (pathnames.length === 0) return null;

  const getVisibleBreadcrumbs = () => {
    if (pathnames.length <= maxItemsOnMobile) {
      return pathnames.map((name, index) => ({
        name,
        label: formatLabel(name),
        path: `/${pathnames.slice(0, index + 1).join("/")}`,
        index,
      }));
    }

    return [
      {
        name: pathnames[0],
        label: formatLabel(pathnames[0]),
        path: `/${pathnames[0]}`,
        index: 0,
      },
      {
        name: pathnames[pathnames.length - 1],
        label: formatLabel(pathnames[pathnames.length - 1]),
        path: `/${pathnames.join("/")}`,
        index: pathnames.length - 1,
      },
    ];
  };

  const breadcrumbs = getVisibleBreadcrumbs();

  return (
    <div className="bg-white">
      <div className="mx-auto w-full max-w-7xl px-4 pb-1 pt-3 sm:px-6 sm:pt-3 lg:px-8">
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-2 text-[12px] text-[#7d8898]"
        >
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/"
              className="transition-colors duration-200 hover:text-[#2563eb] inline-flex items-center gap-2"
            >
              <span className="text-[12px] text-[#7d8898]">
                Home
              </span>
            </Link>
            <span className="text-[12px] font-medium text-[#b6c2cf]">/</span>
          </div>

          {breadcrumbs.map((breadcrumb, index) => {
            const isLast = index === breadcrumbs.length - 1;

            return (
              <div
                key={breadcrumb.index || index}
                className="flex items-center gap-2"
              >
                {!isLast ? (
                  <Link
                    to={breadcrumb.path}
                    className="transition-colors duration-200 hover:text-[#2563eb]"
                  >
                    <span className="text-[12px] text-[#7d8898] max-w-xs truncate">
                      {breadcrumb.label}
                    </span>
                  </Link>
                ) : (
                  <span className="text-[12px] font-semibold text-[#1f2937] max-w-xs truncate">
                    {breadcrumb.label}
                  </span>
                )}

                {!isLast ? (
                  <span className="text-[12px] font-medium text-[#b6c2cf]">
                    /
                  </span>
                ) : null}
              </div>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

ResponsiveBreadcrumbs.propTypes = {
  maxItemsOnMobile: PropTypes.number,
};

export default ResponsiveBreadcrumbs;
