import { render } from "vike/abort";

export { data };

const knownRoute = (pathname = "") => {
  const path = String(pathname || "/").replace(/\/+$/g, "") || "/";

  if (
    [
      "/",
      "/search",
      "/brands",
      "/smartphones",
      "/smartphones/latest",
      "/smartphones/top",
      "/smartphones/upcoming",
      "/tvs",
      "/tvs/latest",
      "/appliances",
      "/networking",
      "/trending",
      "/trending/smartphones",
      "/mobiles",
      "/devices/smartphones",
      "/devices/tvs",
      "/devices/appliances",
      "/devices/networking",
      "/compare",
      "/popular-comparisons",
      "/about",
      "/careers",
      "/career",
      "/contact",
      "/news",
      "/privacy-policy",
      "/terms",
    ].includes(path)
  ) {
    return true;
  }

  return [
    /^\/brand\/[^/]+$/,
    /^\/smartphones\/(?:feature\/[^/]+(?:\/brand\/[^/]+)?|brand\/[^/]+(?:\/feature\/[^/]+)?|filter\/[^/]+)$/,
    /^\/tvs\/(?:features\/[^/]+|[^/]+)$/,
    /^\/(?:appliances|networking)\/[^/]+$/,
    /^\/trending\/[^/]+$/,
    /^\/devices\/(?:smartphones|mobiles|tvs|appliances|networking)\/[^/]+$/,
    /^\/smartphone\/[^/]+$/,
    /^\/compare\/[^/]+$/,
    /^\/news\/[^/]+$/,
  ].some((pattern) => pattern.test(path));
};

async function data(pageContext) {
  if (!knownRoute(pageContext?.urlPathname)) {
    throw render(404, "Page not found");
  }

  return {};
}
