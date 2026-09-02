import React, { useEffect, useRef, useState } from "react";

const readRootPixelValue = (propertyName, fallback = 0) => {
  if (typeof window === "undefined") return fallback;
  const value = parseFloat(
    window
      .getComputedStyle(document.documentElement)
      .getPropertyValue(propertyName),
  );
  return Number.isFinite(value) ? value : fallback;
};

const DetailPageNavigator = ({
  sections = [],
  activeId = "",
  onNavigate,
  className = "",
}) => {
  const slotRef = useRef(null);
  const navigatorRef = useRef(null);
  const scrollRef = useRef(null);
  const buttonRefs = useRef(new Map());
  const frameRef = useRef(null);
  const directionAnchorYRef = useRef(0);
  const scrollDirectionRef = useRef(0);
  const [navigatorHeight, setNavigatorHeight] = useState(0);
  const [isPinned, setIsPinned] = useState(false);
  const [stickyTopOffset, setStickyTopOffset] = useState(0);

  const visibleSections = (Array.isArray(sections) ? sections : []).filter(
    (section) => section?.id && section?.label,
  );

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const publishHeight = () => {
      const height = Math.ceil(
        navigatorRef.current?.getBoundingClientRect().height || 0,
      );

      setNavigatorHeight((currentHeight) =>
        currentHeight === height ? currentHeight : height,
      );
      document.documentElement.style.setProperty(
        "--detail-page-nav-height",
        height > 0 ? `${height}px` : "0px",
      );
    };

    publishHeight();
    window.addEventListener("resize", publishHeight);
    window.visualViewport?.addEventListener("resize", publishHeight);

    let observer = null;
    if (typeof ResizeObserver !== "undefined" && navigatorRef.current) {
      observer = new ResizeObserver(publishHeight);
      observer.observe(navigatorRef.current);
    }

    return () => {
      window.removeEventListener("resize", publishHeight);
      window.visualViewport?.removeEventListener("resize", publishHeight);
      observer?.disconnect();
      document.documentElement.style.setProperty(
        "--detail-page-nav-height",
        "0px",
      );
    };
  }, [visibleSections.length]);

  useEffect(() => {
    if (typeof window === "undefined" || !visibleSections.length) {
      return undefined;
    }

    directionAnchorYRef.current = Math.max(0, window.scrollY || 0);

    const updatePinnedState = () => {
      frameRef.current = null;
      const slot = slotRef.current;
      if (!slot) return;

      const headerOffset = readRootPixelValue("--site-sticky-header-offset", 0);
      const reservedHeaderOffset = Math.max(
        readRootPixelValue("--mobile-header-height", 0),
        readRootPixelValue("--desktop-header-height", 0),
      );
      const safeAreaTop = readRootPixelValue("--safe-area-top", 0);
      const pinTriggerTop = Math.max(
        headerOffset,
        reservedHeaderOffset,
        safeAreaTop,
      );
      const currentY = Math.max(0, window.scrollY || window.pageYOffset || 0);
      const directionDelta = currentY - directionAnchorYRef.current;

      if (directionDelta > 12) {
        scrollDirectionRef.current = 1;
        directionAnchorYRef.current = currentY;
      } else if (directionDelta < -6) {
        scrollDirectionRef.current = -1;
        directionAnchorYRef.current = currentY;
      }

      const anticipatedHeaderOffset =
        scrollDirectionRef.current < 0 ? reservedHeaderOffset : headerOffset;
      const nextStickyTopOffset = Math.max(
        anticipatedHeaderOffset,
        safeAreaTop,
      );

      setStickyTopOffset((currentOffset) =>
        currentOffset === nextStickyTopOffset
          ? currentOffset
          : nextStickyTopOffset,
      );

      const slotTop = slot.getBoundingClientRect().top;

      setIsPinned((currentPinned) => {
        const hysteresis = currentPinned ? 6 : 1;
        const nextPinned = slotTop <= pinTriggerTop + hysteresis;
        return currentPinned === nextPinned ? currentPinned : nextPinned;
      });
    };

    const scheduleUpdate = () => {
      if (frameRef.current != null) return;
      frameRef.current = window.requestAnimationFrame(updatePinnedState);
    };

    scheduleUpdate();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    window.visualViewport?.addEventListener("resize", scheduleUpdate);

    let rootStyleObserver = null;
    if (typeof MutationObserver !== "undefined") {
      rootStyleObserver = new MutationObserver(scheduleUpdate);
      rootStyleObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["style", "class"],
      });
    }

    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      window.visualViewport?.removeEventListener("resize", scheduleUpdate);
      rootStyleObserver?.disconnect();
      if (frameRef.current != null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [visibleSections.length]);

  useEffect(() => {
    const activeButton = buttonRefs.current.get(activeId);
    const scroller = scrollRef.current;
    if (!activeButton || !scroller) return;

    const scrollActiveButtonIntoView = () => {
      const scrollerRect = scroller.getBoundingClientRect();
      const buttonRect = activeButton.getBoundingClientRect();
      const isOutsideLeft = buttonRect.left < scrollerRect.left + 12;
      const isOutsideRight = buttonRect.right > scrollerRect.right - 12;

      if (isOutsideLeft || isOutsideRight) {
        const activeCenter =
          activeButton.offsetLeft + activeButton.offsetWidth / 2;
        const maxScrollLeft = Math.max(
          0,
          scroller.scrollWidth - scroller.clientWidth,
        );
        const nextScrollLeft = Math.min(
          maxScrollLeft,
          Math.max(0, activeCenter - scroller.clientWidth / 2),
        );
        const prefersReducedMotion = window.matchMedia?.(
          "(prefers-reduced-motion: reduce)",
        ).matches;

        scroller.scrollTo({
          left: nextScrollLeft,
          behavior: prefersReducedMotion ? "auto" : "smooth",
        });
      }
    };

    const timer = window.setTimeout(scrollActiveButtonIntoView, 60);
    return () => window.clearTimeout(timer);
  }, [activeId]);

  if (!visibleSections.length) return null;

  const navigate = (id) => {
    if (typeof onNavigate === "function") {
      onNavigate(id);
      return;
    }

    const target = document.getElementById(id);
    if (!target) return;

    const headerOffset = readRootPixelValue("--site-sticky-header-offset", 0);
    const measuredNavigatorHeight = readRootPixelValue(
      "--detail-page-nav-height",
      navigatorHeight || 54,
    );
    const top =
      target.getBoundingClientRect().top +
      window.scrollY -
      headerOffset -
      measuredNavigatorHeight -
      10;

    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  };

  return (
    <div
      ref={slotRef}
      className="relative z-[55] w-full bg-white"
      style={
        isPinned && navigatorHeight > 0
          ? { height: navigatorHeight }
          : undefined
      }
    >
      <div
        ref={navigatorRef}
        data-detail-page-navigator
        style={isPinned ? { top: stickyTopOffset } : undefined}
        className={`${
          isPinned ? "fixed left-0 right-0" : "relative"
        } z-[55] w-full !bg-white shadow-none transition-[top] duration-300 ease-out  ${className}`}
      >
        <div className="mx-auto w-full max-w-[1440px] px-2 py-0 sm:px-5 lg:px-8 lg:py-1.5 ">
          <nav
            ref={scrollRef}
            aria-label="Smartphone detail page sections"
            className="no-scrollbar mx-auto flex w-full max-w-7xl touch-auto snap-x snap-mandatory items-center gap-1.5 overflow-x-auto overscroll-x-contain scroll-smooth sm:gap-2"
          >
            {visibleSections.map((section) => {
              const Icon = section.Icon;
              const isActive = activeId === section.id;

              return (
                <button
                  key={section.id}
                  ref={(node) => {
                    if (node) buttonRefs.current.set(section.id, node);
                    else buttonRefs.current.delete(section.id);
                  }}
                  type="button"
                  onClick={() => navigate(section.id)}
                  aria-current={isActive ? "location" : undefined}
                  className={`inline-flex min-h-9 shrink-0 snap-center items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-colors sm:min-h-10 sm:gap-2 sm:px-4 sm:text-[13px] ${
                    isActive
                      ? "bg-blue-600 text-white "
                      : "text-slate-600 hover:bg-blue-50 hover:text-blue-700    "
                  }`}
                >
                  {Icon ? (
                    <Icon
                      className="shrink-0 text-[10px] sm:text-[11px]"
                      aria-hidden="true"
                    />
                  ) : null}
                  <span className="whitespace-nowrap">{section.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
};

export default DetailPageNavigator;
