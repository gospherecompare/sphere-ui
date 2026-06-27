import React, { useEffect, useRef, useState } from "react";
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

const SHOW_TOP_OFFSET = 80;
const SHOW_BOTTOM_OFFSET = 160;
const HIDE_SCROLL_DELTA = 12;
const SHOW_SCROLL_DELTA = 6;

const MobileBottomNavigation = () => {
  const location = useLocation();
  const pathname = String(location.pathname || "").toLowerCase();
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollYRef = useRef(0);
  const tickingRef = useRef(false);

  useEffect(() => {
    setIsVisible(true);
    if (typeof window !== "undefined") {
      lastScrollYRef.current = Math.max(0, window.scrollY || 0);
    }
  }, [pathname]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const updateVisibility = () => {
      tickingRef.current = false;

      const currentY = Math.max(0, window.scrollY || window.pageYOffset || 0);
      const doc = document.documentElement;
      const maxScroll = Math.max(0, doc.scrollHeight - window.innerHeight);
      const nearTop = currentY <= SHOW_TOP_OFFSET;
      const nearBottom = maxScroll - currentY <= SHOW_BOTTOM_OFFSET;
      const delta = currentY - lastScrollYRef.current;

      if (nearTop || nearBottom) {
        setIsVisible(true);
        lastScrollYRef.current = currentY;
        return;
      }

      if (delta > HIDE_SCROLL_DELTA) {
        setIsVisible(false);
        lastScrollYRef.current = currentY;
        return;
      }

      if (delta < -SHOW_SCROLL_DELTA) {
        setIsVisible(true);
        lastScrollYRef.current = currentY;
      }
    };

    const onScroll = () => {
      if (tickingRef.current) return;
      tickingRef.current = true;
      window.requestAnimationFrame(updateVisibility);
    };

    const onResize = () => {
      setIsVisible(true);
      lastScrollYRef.current = Math.max(0, window.scrollY || 0);
    };

    lastScrollYRef.current = Math.max(0, window.scrollY || 0);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      if (tickingRef.current) {
        tickingRef.current = false;
      }
    };
  }, []);

  const handleMobileAction = (eventName) => {
    setIsVisible(true);
    dispatchMobileNavigationEvent(eventName);
  };

  const isExplorePath = [
    "/smartphones",
    "/mobiles",
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
      onClick: () => handleMobileAction(MOBILE_OPEN_SEARCH_EVENT),
    },
    {
      label: "Explore",
      icon: FaCompass,
      onClick: () => handleMobileAction(MOBILE_OPEN_EXPLORE_EVENT),
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
      active: pathname === "/news",
    },
  ];

  return (
    <nav
      aria-label="Mobile navigation"
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/98 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgba(15,23,42,0.08)] backdrop-blur transition-[transform,opacity] duration-300 ease-out lg:hidden ${
        isVisible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-full opacity-0"
      }`}
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
