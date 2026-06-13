import { useEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

// ScrollToTop ensures the window scrolls to top (or to an anchor) on navigation.
// Place this inside a Router so it can observe location changes.
export default function ScrollToTop({ behavior = "smooth" }) {
  const { pathname, hash } = useLocation();
  const navigationType = useNavigationType();
  const previousPathRef = useRef(pathname);

  useEffect(() => {
    const previousPathname = previousPathRef.current;
    const pathChanged = pathname !== previousPathname;
    previousPathRef.current = pathname;

    // If there's a hash (anchor), try to scroll to that element.
    if (hash) {
      const id = hash.replace("#", "");
      let cancelled = false;
      let timerId = null;

      const scrollToAnchor = (attempt = 0) => {
        if (cancelled) return;

        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior, block: "start" });
          try {
            // move focus for accessibility (best-effort)
            el.focus && el.focus();
          } catch {
            /* ignore focus errors */
          }
          return;
        }

        if (attempt < 4) {
          timerId = window.setTimeout(() => scrollToAnchor(attempt + 1), 50);
          return;
        }

        window.scrollTo({ top: 0, left: 0, behavior });
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

    // Keep scroll position for query-only updates and browser back/forward.
    if (!pathChanged || navigationType === "POP") {
      return;
    }

    // Default: scroll to top on actual route change.
    window.scrollTo({ top: 0, left: 0, behavior });
  }, [pathname, hash, behavior, navigationType]);

  return null;
}
