import { toCanonicalPagePath, toCanonicalPageUrl } from "./publicUrl";

export const NEWS_SITE_ORIGIN = "https://mobilex.in";

export const NEWS_LISTING_SEO = Object.freeze({
  title: "Latest Technology News & Product Updates | MobileX",
  description:
    "Technology news, product launches, science updates, consumer tech, sports technology, and practical guides from MobileX News.",
  keywords:
    "technology news, latest mobile news, science news, consumer tech news, sports technology, launch stories, practical guides, MobileX News",
  canonicalPath: "/news",
  canonicalUrl: toCanonicalPageUrl("/news", NEWS_SITE_ORIGIN),
});

const decodeNewsEntitiesOnce = (value = "") =>
  String(value || "")
    .replace(/&#x([0-9a-f]+);/gi, (_match, code) => {
      const point = Number.parseInt(code, 16);
      return Number.isFinite(point) ? String.fromCodePoint(point) : _match;
    })
    .replace(/&#(\d+);/g, (_match, code) => {
      const point = Number.parseInt(code, 10);
      return Number.isFinite(point) ? String.fromCodePoint(point) : _match;
    })
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&");

export const decodeNewsEntities = (value = "") => {
  let text = String(value || "");

  for (let pass = 0; pass < 3; pass += 1) {
    const decoded = decodeNewsEntitiesOnce(text);
    if (decoded === text) break;
    text = decoded;
  }

  return text;
};

export const stripNewsMarkup = (value = "") =>
  decodeNewsEntities(
    String(value || "")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/(\*\*|__)([\s\S]*?)\1/g, " $2 ")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\s+/g, " ")
    .trim();

const clipNewsDescription = (value = "", maxWords = 34) => {
  const text = stripNewsMarkup(value);
  if (!text) return "";
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return text;
  return `${words.slice(0, maxWords).join(" ")}...`;
};

const normalizeDescriptionKey = (value = "") =>
  stripNewsMarkup(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const isUsefulNewsDescription = (value, title) => {
  const text = stripNewsMarkup(value);
  if (text.length < 48) return false;

  const normalized = normalizeDescriptionKey(text);
  const normalizedTitle = normalizeDescriptionKey(title);
  if (!normalized || normalized === normalizedTitle) return false;

  return (
    !/^read the latest\b/i.test(text) &&
    !/official announcements, launch details, pricing, availability, specifications, features, and expert analysis/i.test(
      text,
    )
  );
};

const buildContextAwareDescription = (source = {}) => {
  const title = stripNewsMarkup(
    source?.title ||
      source?.headline ||
      source?.metaTitle ||
      source?.meta_title,
  );
  if (!title)
    return "MobileX editorial coverage with the key details and context.";

  const rawTags = Array.isArray(source?.tags)
    ? source.tags
    : String(source?.tags || "").split(",");
  const context = [
    title,
    source?.category,
    source?.label,
    source?.brandName,
    source?.brand_name,
    source?.productName,
    source?.product_name,
    ...rawTags,
  ]
    .map(stripNewsMarkup)
    .join(" ")
    .toLowerCase();

  if (/(gta|game|gaming|pre[-\s]?order|release date)/i.test(context)) {
    return `${title} coverage with release timing, edition details, pre-order updates, and what players should know.`;
  }

  if (
    /(whatsapp|google wallet|aadhaar|instagram|app|software|android|ios|username|account|wallet)/i.test(
      context,
    )
  ) {
    return `${title} explained with rollout details, user impact, availability, and the practical changes to know.`;
  }

  if (
    /(phone|mobile|smartphone|oneplus|realme|vivo|oppo|samsung|xiaomi|pixel|battery|mah|display|dimensity|snapdragon|camera)/i.test(
      context,
    )
  ) {
    return `${title} coverage with launch context, key hardware details, pricing signals, availability, and buyer-relevant takeaways.`;
  }

  return `${title} coverage with the key details, background context, and why the update matters.`;
};

export const buildNewsArticleDescription = (
  source = {},
  articleParagraphs = [],
) => {
  const title = source?.title || source?.headline || "";
  const candidates = [
    source?.metaDescription,
    source?.meta_description,
    source?.description,
    source?.excerpt,
    source?.summary,
    ...articleParagraphs,
    source?.contentHtml,
    source?.content_rendered,
  ];
  const useful = candidates.find((candidate) =>
    isUsefulNewsDescription(candidate, title),
  );

  return clipNewsDescription(
    useful || buildContextAwareDescription(source),
    34,
  );
};

const appendMobileXBrand = (value = "") => {
  const title = stripNewsMarkup(value);
  if (!title) return "MobileX News";
  return /(?:^|[|\-—:]\s*)mobilex$/i.test(title) ? title : `${title} | MobileX`;
};

export const buildNewsArticleCanonicalPath = (slug = "") => {
  const cleanSlug = String(slug || "").trim();
  return cleanSlug
    ? toCanonicalPagePath(`/news/${encodeURIComponent(cleanSlug)}`)
    : toCanonicalPagePath("/news");
};

export const buildNewsArticleSeo = (
  source = {},
  { articleParagraphs = [] } = {},
) => {
  const slug = String(source?.slug || "").trim();
  const headline = stripNewsMarkup(
    source?.title ||
      source?.headline ||
      source?.metaTitle ||
      source?.meta_title,
  );
  const editorialTitle = stripNewsMarkup(
    source?.metaTitle || source?.meta_title || headline,
  );
  const canonicalPath = buildNewsArticleCanonicalPath(slug);

  return {
    slug,
    headline,
    title: appendMobileXBrand(editorialTitle || headline),
    description: buildNewsArticleDescription(source, articleParagraphs),
    canonicalPath,
    canonicalUrl: toCanonicalPageUrl(canonicalPath, NEWS_SITE_ORIGIN),
  };
};

export const escapeNewsHtml = (value = "") =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

export const sanitizeNewsArticleHtml = (value = "") => {
  const decoded = decodeNewsEntities(value)
    .replace(/<!--([\s\S]*?)-->/g, "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(
      /<(?:iframe|object|embed|form|input|button|textarea|select)\b[^>]*>[\s\S]*?<\/(?:iframe|object|embed|form|button|textarea|select)>/gi,
      "",
    )
    .replace(/<(?:iframe|object|embed|input)\b[^>]*\/?\s*>/gi, "")
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(
      /\s(?:style|class|id|aria-[\w-]+|data-[\w-]+)\s*=\s*("[^"]*"|'[^']*')/gi,
      "",
    )
    .replace(/\s(?:style|class|id)\s*=\s*[^\s>]+/gi, "")
    .replace(/href\s*=\s*(['"])\s*javascript:[^'"]*\1/gi, 'href="#"')
    .replace(/src\s*=\s*(['"])\s*javascript:[^'"]*\1/gi, "")
    .replace(/<h1\b/gi, "<h2")
    .replace(/<\/h1>/gi, "</h2>")
    .trim();

  if (!decoded) return "";
  if (
    /<\s*\/?(?:p|h[2-6]|ul|ol|li|table|blockquote|pre|figure)\b/i.test(decoded)
  ) {
    return decoded;
  }

  return decoded
    .split(/\n{2,}/)
    .map((paragraph) => stripNewsMarkup(paragraph))
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeNewsHtml(paragraph)}</p>`)
    .join("\n");
};

export default {
  NEWS_LISTING_SEO,
  NEWS_SITE_ORIGIN,
  buildNewsArticleCanonicalPath,
  buildNewsArticleDescription,
  buildNewsArticleSeo,
  decodeNewsEntities,
  escapeNewsHtml,
  sanitizeNewsArticleHtml,
  stripNewsMarkup,
};
