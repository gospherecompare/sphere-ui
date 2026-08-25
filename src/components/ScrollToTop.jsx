import { useEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname, search, hash, key } = useLocation();
  const navigationType = useNavigationType();
  const previousRouteRef = useRef(`${pathname}${search}`);
  const scrollPositionsRef = useRef(new Map());

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const positions = scrollPositionsRef.current;
    const saveScrollPosition = () => {
      positions.set(key, {
        left: window.scrollX || 0,
        top: window.scrollY || 0,
      });
    };

    window.history.scrollRestoration = "manual";
    window.addEventListener("scroll", saveScrollPosition, { passive: true });

    return () => {
      saveScrollPosition();
      window.removeEventListener("scroll", saveScrollPosition);
    };
  }, [key]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const route = `${pathname}${search}`;
    const routeChanged = route !== previousRouteRef.current;
    previousRouteRef.current = route;

    if (hash) {
      let id = hash.slice(1);
      try {
        id = decodeURIComponent(id);
      } catch {
        // Keep the raw hash when it is not valid URI encoding.
      }
      let cancelled = false;
      let timerId = null;

      const scrollToAnchor = (attempt = 0) => {
        if (cancelled) return;

        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
          try {
            el.focus?.({ preventScroll: true });
          } catch {
            // Focus is best-effort for non-focusable anchors.
          }
          return;
        }

        if (attempt < 4) {
          timerId = window.setTimeout(() => scrollToAnchor(attempt + 1), 50);
          return;
        }

        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      };

      // allow the new route to paint before trying to find the anchor
      timerId = window.setTimeout(() => scrollToAnchor(), 50);
      return () => {
        cancelled = true;
        if (timerId != null) {
          window.clearTimeout(timerId);
        }
      };
    }

    if (!routeChanged) {
      return;
    }

    if (navigationType === "POP") {
      const position = scrollPositionsRef.current.get(key);
      const restore = () =>
        window.scrollTo({
          top: position?.top || 0,
          left: position?.left || 0,
          behavior: "auto",
        });
      window.requestAnimationFrame(() => window.requestAnimationFrame(restore));
      return undefined;
    }

    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    return undefined;
  }, [pathname, search, hash, key, navigationType]);

  return null;
}
