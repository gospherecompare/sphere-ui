import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SITE_ORIGIN = "https://tryhook.shop";
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.resolve(scriptDir, "..");
const distDir = path.join(clientRoot, "dist");
const newsDir = path.join(distDir, "news");

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

const stripMarkup = (value = "") =>
  decodeHtml(String(value || "").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();

const extract = (html, pattern, label) => {
  const value = html.match(pattern)?.[1] || "";
  assert(value, `Missing ${label}`);
  return decodeHtml(value.trim());
};

const inspectHead = (html, routeLabel) => {
  const title = extract(html, /<title>([\s\S]*?)<\/title>/i, `${routeLabel} title`);
  const description = extract(
    html,
    /<meta\s+name=["']description["'][^>]*content=["']([^"']+)["']/i,
    `${routeLabel} meta description`,
  );
  const robots = extract(
    html,
    /<meta\s+name=["']robots["'][^>]*content=["']([^"']+)["']/i,
    `${routeLabel} robots meta`,
  );
  const canonical = extract(
    html,
    /<link\s+rel=["']canonical["'][^>]*href=["']([^"']+)["']/i,
    `${routeLabel} canonical`,
  );
  const ogUrl = extract(
    html,
    /<meta\s+property=["']og:url["'][^>]*content=["']([^"']+)["']/i,
    `${routeLabel} og:url`,
  );

  assert(!/noindex/i.test(robots), `${routeLabel} unexpectedly contains noindex`);
  assert(/\bindex\b/i.test(robots), `${routeLabel} is missing index`);
  assert(/\bfollow\b/i.test(robots), `${routeLabel} is missing follow`);
  assert(canonical === ogUrl, `${routeLabel} canonical and og:url differ`);
  assert(canonical.endsWith("/"), `${routeLabel} canonical lacks trailing slash`);
  assert(
    !/<meta\s+http-equiv=["']refresh["']/i.test(html),
    `${routeLabel} contains a meta refresh`,
  );

  return { title, description, canonical };
};

const assertTrailingNewsLinks = (html, routeLabel) => {
  const hrefs = [...html.matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)].map(
    (match) => decodeHtml(match[1]),
  );
  const articleLinks = hrefs.filter((href) => {
    try {
      const pathname = new URL(href, SITE_ORIGIN).pathname;
      return pathname.startsWith("/news/") && pathname !== "/news/";
    } catch {
      return false;
    }
  });

  articleLinks.forEach((href) => {
    const pathname = new URL(href, SITE_ORIGIN).pathname;
    assert(pathname.endsWith("/"), `${routeLabel} links to ${href} without a trailing slash`);
  });

  return articleLinks;
};

const findDuplicates = (rows, field) => {
  const grouped = new Map();
  rows.forEach((row) => {
    const key = String(row[field] || "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
    if (!key) return;
    grouped.set(key, [...(grouped.get(key) || []), row.slug]);
  });
  return [...grouped.values()].filter((slugs) => slugs.length > 1);
};

const run = async () => {
  const listingHtml = await fs.readFile(path.join(newsDir, "index.html"), "utf8");
  const sitemapXml = await fs.readFile(path.join(distDir, "sitemap.xml"), "utf8");
  const listingHead = inspectHead(listingHtml, "/news/");

  assert(
    listingHead.canonical === `${SITE_ORIGIN}/news/`,
    `/news/ canonical is ${listingHead.canonical}`,
  );
  assert(
    /<main\b[^>]*data-news-prerendered=["']listing["']/i.test(listingHtml),
    "/news/ is missing semantic prerendered content",
  );
  assert(/<h1\b/i.test(listingHtml), "/news/ is missing an initial h1");
  assert(
    /["']@type["']\s*:\s*["']BreadcrumbList["']/i.test(listingHtml),
    "/news/ is missing initial BreadcrumbList JSON-LD",
  );
  assert(
    /["']@type["']\s*:\s*["']ItemList["']/i.test(listingHtml),
    "/news/ is missing initial ItemList JSON-LD",
  );
  assert(
    !/["']@type["']\s*:\s*["']NewsArticle["']/i.test(listingHtml),
    "/news/ must not contain NewsArticle JSON-LD",
  );
  const listingLinks = assertTrailingNewsLinks(listingHtml, "/news/");
  assert(listingLinks.length > 0, "/news/ has no crawlable article links");

  const directoryEntries = await fs.readdir(newsDir, { withFileTypes: true });
  const articleDirectories = directoryEntries.filter((entry) => entry.isDirectory());
  assert(articleDirectories.length > 0, "No generated news article routes were found");

  const rows = [];
  for (const entry of articleDirectories) {
    const slug = entry.name;
    const routeLabel = `/news/${slug}/`;
    const html = await fs.readFile(
      path.join(newsDir, slug, "index.html"),
      "utf8",
    );
    const head = inspectHead(html, routeLabel);
    const expectedCanonical = `${SITE_ORIGIN}${routeLabel}`;

    assert(
      head.canonical === expectedCanonical,
      `${routeLabel} canonical is ${head.canonical}`,
    );
    assert(
      /<main\b[^>]*data-news-prerendered=["']article["']/i.test(html),
      `${routeLabel} is missing semantic prerendered content`,
    );
    assert(/<h1\b/i.test(html), `${routeLabel} is missing an initial h1`);
    const articleMarkup = extract(
      html,
      /<article\b[^>]*>([\s\S]*?)<\/article>/i,
      `${routeLabel} article body`,
    );
    const articleText = stripMarkup(articleMarkup);
    assert(
      articleText.length >= 100,
      `${routeLabel} initial article body is unexpectedly short`,
    );
    assert(
      /["']@type["']\s*:\s*["']NewsArticle["']/i.test(html),
      `${routeLabel} is missing initial NewsArticle JSON-LD`,
    );
    assert(
      /["']@type["']\s*:\s*["']BreadcrumbList["']/i.test(html),
      `${routeLabel} is missing initial BreadcrumbList JSON-LD`,
    );
    assertTrailingNewsLinks(html, routeLabel);
    assert(
      sitemapXml.includes(`<loc>${expectedCanonical}</loc>`),
      `${routeLabel} canonical is absent from dist/sitemap.xml`,
    );
    assert(
      !head.title.includes("Hooks | Smart Device Comparison Platform"),
      `${routeLabel} has the generic fallback title`,
    );

    rows.push({
      slug,
      title: head.title,
      description: head.description,
      canonical: head.canonical,
      articleText,
    });
  }

  for (const field of ["title", "description", "canonical", "articleText"]) {
    const duplicates = findDuplicates(rows, field);
    assert(
      duplicates.length === 0,
      `Duplicate ${field} values found: ${duplicates.map((group) => group.join(", ")).join("; ")}`,
    );
  }

  console.log(
    `[news-indexing] Verified /news/ and ${rows.length} article routes: initial content, metadata, schemas, canonical links, sitemap parity, and duplicate checks passed.`,
  );

};

await run();
