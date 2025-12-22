import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// ScrollToTop ensures the window scrolls to top (or to an anchor) on navigation.
// Place this inside a Router so it can observe location changes.
export default function ScrollToTop({ behavior = "auto" }) {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    // If there's a hash (anchor), try to scroll to that element.
    if (hash) {
      const id = hash.replace("#", "");
      // small timeout to allow the new route to paint
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior });
          try {
            // move focus for accessibility (best-effort)
            el.focus && el.focus();
          } catch {
            /* ignore focus errors */
          }
        } else {
          window.scrollTo({ top: 0, left: 0, behavior });
        }
      }, 50);
      return;
    }

    // Default: scroll to top on route change
    window.scrollTo({ top: 0, left: 0, behavior });
  }, [pathname, search, hash, behavior]);

  return null;
}
