import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SITE_ORIGIN = "https://mobilex.in";
const MAX_COMPARE_PAYLOAD_BYTES = 75_000;
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.resolve(scriptDir, "..");
const distDir = path.join(clientRoot, "dist");

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const decodeHtml = (value = "") =>
  String(value || "")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&")
    .replace(/&nbsp;/gi, " ");

const extract = (html, pattern, label) => {
  const value = html.match(pattern)?.[1] || "";
  assert(value, `Missing ${label}`);
  return decodeHtml(value.trim());
};

const normalizeDuplicateValue = (value = "") =>
  String(value || "").replace(/\s+/g, " ").trim().toLowerCase();

const routeFileFromUrl = (url) => {
  const pathname = new URL(url).pathname;
  const routeParts = pathname.split("/").filter(Boolean);
  return path.join(distDir, ...routeParts, "index.html");
};

const readRouteHtml = async (url) => {
  const filePath = routeFileFromUrl(url);
  try {
    return await fs.readFile(filePath, "utf8");
  } catch (error) {
    throw new Error(`Missing generated HTML for ${url}: ${filePath}`, {
      cause: error,
    });
  }
};

const inspectIndexableHead = (html, url) => {
  const title = extract(html, /<title>([\s\S]*?)<\/title>/i, `${url} title`);
  const description = extract(
    html,
    /<meta\s+name=["']description["'][^>]*content=["']([^"']+)["']/i,
    `${url} meta description`,
  );
  const robots = extract(
    html,
    /<meta\s+name=["']robots["'][^>]*content=["']([^"']+)["']/i,
    `${url} robots meta`,
  );
  const canonical = extract(
    html,
    /<link\s+rel=["']canonical["'][^>]*href=["']([^"']+)["']/i,
    `${url} canonical`,
  );
  const ogUrl = extract(
    html,
    /<meta\s+property=["']og:url["'][^>]*content=["']([^"']+)["']/i,
    `${url} og:url`,
  );

  assert(title.length >= 15, `${url} has an unexpectedly short title`);
  assert(
    description.length >= 50,
    `${url} has an unexpectedly short meta description`,
  );
  assert(/\bindex\b/i.test(robots), `${url} is missing robots index`);
  assert(/\bfollow\b/i.test(robots), `${url} is missing robots follow`);
  assert(!/noindex/i.test(robots), `${url} unexpectedly contains noindex`);
  assert(canonical === url, `${url} canonical points to ${canonical}`);
  assert(ogUrl === url, `${url} og:url points to ${ogUrl}`);
  assert(
    !/<meta\s+http-equiv=["']refresh["']/i.test(html),
    `${url} contains a meta refresh redirect`,
  );

  return { title, description, canonical };
};

const getPreloadedPayload = (html, url) => {
  const source = extract(
    html,
    /<script\s+id=["']hook-prerender-data["'][^>]*>\s*window\.__HOOKS_PRERENDER_DATA__=([\s\S]*?);\s*<\/script>/i,
    `${url} route-specific prerender payload`,
  );
  const bytes = Buffer.byteLength(source, "utf8");
  assert(
    bytes <= MAX_COMPARE_PAYLOAD_BYTES,
    `${url} embeds ${bytes.toLocaleString()} payload bytes; expected no more than ${MAX_COMPARE_PAYLOAD_BYTES.toLocaleString()}`,
  );

  try {
    return { bytes, payload: JSON.parse(source) };
  } catch (error) {
    throw new Error(`${url} has invalid prerender payload JSON`, { cause: error });
  }
};

const findDuplicateGroups = (rows, field) => {
  const groups = new Map();
  rows.forEach((row) => {
    const key = normalizeDuplicateValue(row[field]);
    if (!key) return;
    groups.set(key, [...(groups.get(key) || []), row.url]);
  });
  return [...groups.values()].filter((urls) => urls.length > 1);
};

const assertNoDuplicates = (rows, field) => {
  const duplicates = findDuplicateGroups(rows, field);
  assert(
    duplicates.length === 0,
    `Duplicate comparison ${field} values: ${duplicates
      .map((urls) => urls.join(", "))
      .join("; ")}`,
  );
};

const verifyControlRoute = async (urls, pathnamePattern, label) => {
  const url = urls.find((candidate) => pathnamePattern.test(new URL(candidate).pathname));
  assert(url, `Sitemap has no ${label} control URL`);
  const html = await readRouteHtml(url);
  inspectIndexableHead(html, url);
  return url;
};

const run = async () => {
  const sitemapXml = await fs.readFile(path.join(distDir, "sitemap.xml"), "utf8");
  const urls = [...sitemapXml.matchAll(/<loc>([\s\S]*?)<\/loc>/gi)].map(
    (match) => decodeHtml(match[1].trim()),
  );

  assert(urls.length > 0, "dist/sitemap.xml contains no URLs");
  assert(new Set(urls).size === urls.length, "dist/sitemap.xml contains duplicate URLs");
  urls.forEach((url) => {
    const parsed = new URL(url);
    assert(parsed.origin === SITE_ORIGIN, `Sitemap URL uses another origin: ${url}`);
    assert(!parsed.search && !parsed.hash, `Sitemap URL contains a query or hash: ${url}`);
    assert(
      parsed.pathname === "/" || !parsed.pathname.endsWith("/"),
      `Sitemap URL has an unexpected trailing slash: ${url}`,
    );
  });

  const compareUrls = urls.filter((url) => /^\/compare\/[^/]+\/$/.test(new URL(url).pathname));
  assert(compareUrls.length > 0, "Sitemap contains no comparison detail URLs");

  const rows = [];
  let totalPayloadBytes = 0;
  for (const url of compareUrls) {
    const html = await readRouteHtml(url);
    const head = inspectIndexableHead(html, url);

    assert(
      /<main\b[^>]*data-compare-prerendered=["']detail["']/i.test(html),
      `${url} is missing semantic initial comparison HTML`,
    );
    assert(/<h1\b[^>]*>[\s\S]*?<\/h1>/i.test(html), `${url} is missing an initial h1`);
    const productArticles = html.match(/<article\b/gi) || [];
    assert(
      productArticles.length >= 2 && productArticles.length <= 3,
      `${url} has ${productArticles.length} initial product cards`,
    );
    for (const schemaType of ["BreadcrumbList", "WebApplication", "ItemList"]) {
      assert(
        new RegExp(`["']@type["']\\s*:\\s*["']${schemaType}["']`, "i").test(html),
        `${url} is missing ${schemaType} JSON-LD`,
      );
    }

    const { bytes, payload } = getPreloadedPayload(html, url);
    const payloadEntries = Object.entries(payload?.byUrl || {});
    assert(
      payloadEntries.length === 1,
      `${url} embeds ${payloadEntries.length} API payloads instead of one route-specific payload`,
    );
    const [endpoint, response] = payloadEntries[0] || [];
    assert(
      /\/public\/compare-pages\/resolve\?slug=/i.test(endpoint || ""),
      `${url} prerender payload is not the comparison resolver response`,
    );
    const items = Array.isArray(response?.page?.items) ? response.page.items : [];
    assert(
      items.length >= 2 && items.length <= 3,
      `${url} resolver payload has ${items.length} products`,
    );
    assert(
      new URL(url).pathname.replace(/\/$/, "") ===
        String(response.page.route_path || "").replace(/\/$/, ""),
      `${url} resolver route_path does not match its canonical path`,
    );

    totalPayloadBytes += bytes;
    rows.push({ url, ...head });
  }

  for (const field of ["title", "description", "canonical"]) {
    assertNoDuplicates(rows, field);
  }

  const controls = await Promise.all([
    verifyControlRoute(
      urls,
      /^\/smartphones\/(?!brand\/|filter\/|feature\/)[^/]+\/$/,
      "smartphone detail",
    ),
    verifyControlRoute(
      urls,
      /^\/tvs\/(?!brand\/|filter\/|feature\/)[^/]+\/$/,
      "TV detail",
    ),
    verifyControlRoute(urls, /^\/news\/[^/]+\/$/, "news article"),
  ]);

  console.log(
    `[indexable-routes] Verified ${compareUrls.length} comparison detail URLs, ${controls.length} unrelated control routes, sitemap/canonical parity, initial comparison content, schemas, unique metadata, and slim route-specific payloads (${Math.round(totalPayloadBytes / compareUrls.length).toLocaleString()} average bytes).`,
  );
};

await run();
