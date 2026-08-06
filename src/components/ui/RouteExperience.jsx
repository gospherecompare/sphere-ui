import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const resolveRouteGroup = (pathname = "/") => {
  if (pathname === "/") return "home";
  if (pathname.startsWith("/news")) return "news";
  if (pathname.startsWith("/compare") || pathname.startsWith("/popular-comparisons")) {
    return "compare";
  }
  if (/^\/(smartphones|laptops|tvs|networking)\/[^/]+\/?$/.test(pathname)) {
    return "product-detail";
  }
  if (/^\/(smartphones|laptops|tvs|networking|trending)/.test(pathname)) {
    return "products";
  }
  if (/^\/(about|careers|contact|privacy-policy|terms)/.test(pathname)) {
    return "company";
  }
  return "general";
};

const RouteExperience = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.routeGroup = resolveRouteGroup(pathname);
    root.dataset.routePath = pathname;
    document.body.classList.add("hooks-body");

    return () => {
      delete root.dataset.routeGroup;
      delete root.dataset.routePath;
    };
  }, [pathname]);

  return null;
};

export default RouteExperience;
