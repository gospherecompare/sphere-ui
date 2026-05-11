const DEFAULT_SITE_ORIGIN = "https://tryhook.shop";

const hasFileExtension = (pathname = "") =>
  /\/[^/?#]+\.[^/?#]+$/.test(String(pathname || ""));

const parseUrlLike = (value = "", baseOrigin = DEFAULT_SITE_ORIGIN) => {
  const raw = String(value || "").trim();
  if (!raw) {
    return {
      origin: baseOrigin,
      pathname: "/",
      search: "",
      hash: "",
      isAbsolute: false,
    };
  }

  if (raw.startsWith("//")) {
    const parsed = new URL(`https:${raw}`);
    return {
      origin: parsed.origin,
      pathname: parsed.pathname || "/",
      search: parsed.search || "",
      hash: parsed.hash || "",
      isAbsolute: true,
    };
  }

  try {
    const parsed = /^https?:\/\//i.test(raw)
      ? new URL(raw)
      : new URL(raw, baseOrigin);
    return {
      origin: parsed.origin || baseOrigin,
      pathname: parsed.pathname || "/",
      search: parsed.search || "",
      hash: parsed.hash || "",
      isAbsolute: /^https?:\/\//i.test(raw),
    };
  } catch {
    const [pathAndSearch = "/", hash = ""] = raw.split("#", 2);
    const [pathname = "/", search = ""] = pathAndSearch.split("?", 2);
    return {
      origin: baseOrigin,
      pathname: pathname.startsWith("/") ? pathname : `/${pathname}`,
      search: search ? `?${search}` : "",
      hash: hash ? `#${hash}` : "",
      isAbsolute: false,
    };
  }
};

export const toCanonicalPagePath = (value = "") => {
  const parsed = parseUrlLike(value);
  let pathname = parsed.pathname || "/";

  if (!pathname.startsWith("/")) pathname = `/${pathname}`;
  if (pathname.length > 1) pathname = pathname.replace(/\/+$/g, "");

  if (pathname !== "/" && !hasFileExtension(pathname)) {
    pathname = `${pathname}/`;
  }

  return `${pathname}${parsed.search || ""}${parsed.hash || ""}`;
};

export const toCanonicalPageUrl = (
  value = "/",
  siteOrigin = DEFAULT_SITE_ORIGIN,
) => {
  const parsed = parseUrlLike(value, siteOrigin);
  const origin = String(parsed.origin || siteOrigin).replace(/\/+$/g, "");
  const path = toCanonicalPagePath(
    `${parsed.pathname || "/"}${parsed.search || ""}${parsed.hash || ""}`,
  );
  return `${origin}${path}`;
};

export default {
  toCanonicalPagePath,
  toCanonicalPageUrl,
};
