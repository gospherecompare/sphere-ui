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
      className={`hooks-mobile-dock lg:hidden ${
        isVisible ? "is-visible" : "is-hidden"
      }`}
    >
      <div className="hooks-mobile-dock__surface">
        {items.map((item) => {
          const Icon = item.icon;
          const isPrimary = item.label === "Explore";
          const className = `hooks-mobile-dock__item ${
            item.active ? "is-active" : ""
          } ${isPrimary ? "is-primary" : ""}`;
          const content = (
            <>
              <span className="hooks-mobile-dock__icon">
                <Icon aria-hidden="true" />
              </span>
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
              aria-pressed={Boolean(item.active)}
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
