import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FaCompass,
  FaExchangeAlt,
  FaHome,
  FaRegNewspaper,
  FaSearch,
} from "react-icons/fa";
import {
  MOBILE_OPEN_EXPLORE_EVENT,
  MOBILE_OPEN_SEARCH_EVENT,
} from "../../utils/mobileNavigation";

const dispatchMobileNavigationEvent = (eventName) => {
  window.dispatchEvent(new CustomEvent(eventName));
};

const MobileBottomNavigation = () => {
  const location = useLocation();
  const pathname = String(location.pathname || "").toLowerCase();
  const isExplorePath = [
    "/smartphones",
    "/mobiles",
    "/laptops",
    "/laptop",
    "/tvs",
    "/networking",
    "/devices",
  ].some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

  const items = [
    {
      label: "Home",
      icon: FaHome,
      href: "/",
      active: pathname === "/",
    },
    {
      label: "Search",
      icon: FaSearch,
      onClick: () => dispatchMobileNavigationEvent(MOBILE_OPEN_SEARCH_EVENT),
    },
    {
      label: "Explore",
      icon: FaCompass,
      onClick: () => dispatchMobileNavigationEvent(MOBILE_OPEN_EXPLORE_EVENT),
      active: isExplorePath,
    },
    {
      label: "Compare",
      icon: FaExchangeAlt,
      href: "/compare",
      active: pathname === "/compare" || pathname.startsWith("/compare/"),
    },
    {
      label: "News",
      icon: FaRegNewspaper,
      href: "/news",
      active: pathname.startsWith("/news"),
    },
  ];

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/98 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden"
    >
      <div className="mx-auto grid min-h-[58px] max-w-md grid-cols-5">
        {items.map((item) => {
          const Icon = item.icon;
          const className = `relative flex min-w-0 flex-col items-center justify-center gap-1 px-1 py-2 text-[10px] font-medium transition-colors ${
            item.active
              ? "text-blue-700"
              : "text-slate-600 hover:text-blue-700"
          }`;
          const content = (
            <>
              {item.active ? (
                <span className="absolute inset-x-3 top-0 h-0.5 rounded-b-full bg-blue-600" />
              ) : null}
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </>
          );

          if (item.href) {
            return (
              <Link key={item.label} to={item.href} className={className}>
                {content}
              </Link>
            );
          }

          return (
            <button
              key={item.label}
              type="button"
              onClick={item.onClick}
              className={className}
            >
              {content}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNavigation;
