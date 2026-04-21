import { useEffect, useMemo, useState } from "react";

const API_BASE = (() => {
  const configuredBase = String(import.meta.env.VITE_API_BASE_URL || "").trim();
  if (configuredBase) return configuredBase.replace(/\/$/, "");

  return "https://api.apisphere.in";
})();

const DEFAULT_STORY_IMAGE = "/hook-logo.png";

const CATEGORY_LABELS = {
  news: "Newsroom",
  mobiles: "Mobile update",
  gadgets: "Gadget update",
  guides: "Guide deck",
  launches: "Launch tracker",
};

const CATEGORY_AUTHORS = {
  news: { name: "Hooks news", role: "News desk" },
  mobiles: { name: "Hooks mobile", role: "Mobile editor" },
  gadgets: { name: "Hooks gadgets", role: "Gadgets desk" },
  guides: { name: "Hooks editorial", role: "Editorial guides" },
  launches: { name: "Hooks desk", role: "Launch desk" },
};

const PRODUCT_TYPE_LABELS = {
  smartphone: "Smartphones",
  laptop: "Laptops",
  tv: "TVs",
};

const safeText = (value) => String(value || "").trim();

const parseBlogTags = (value) => {
  if (Array.isArray(value)) {
    return Array.from(
      new Set(
        value
          .map((item) => safeText(item))
          .filter(Boolean),
      ),
    );
  }

  const raw = safeText(value);
  if (!raw) return [];

  return Array.from(
    new Set(
      raw
        .split(/[,;\n]+/)
        .map((item) => safeText(item))
        .filter(Boolean),
    ),
  );
};

const toPlainObject = (value) => {
  if (value && typeof value === "object" && !Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      return {};
    }
  }
  return {};
};

const normalizeBrandLogoUrl = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^(https?:|data:|blob:)/i.test(raw)) return raw;
  if (raw.startsWith("//")) return `https:${raw}`;
  if (raw.startsWith("/")) return raw;
  if (/^(uploads|assets|images)\//i.test(raw)) {
    return `/${raw.replace(/^\/+/, "")}`;
  }
  return raw;
};

const FALLBACK_THEME_BY_CATEGORY = {
  news: { from: "#0f172a", via: "#1d4ed8", to: "#2563eb" },
  mobiles: { from: "#0f172a", via: "#0891b2", to: "#06b6d4" },
  gadgets: { from: "#0f172a", via: "#ea580c", to: "#f97316" },
  guides: { from: "#0f172a", via: "#6d28d9", to: "#8b5cf6" },
  launches: { from: "#0f172a", via: "#16a34a", to: "#22c55e" },
};

const DEFAULT_THEME = FALLBACK_THEME_BY_CATEGORY.news;

const stripMarkup = (value) =>
  safeText(value)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const renderTokenizedContent = (content, tokenMap = {}) =>
  String(content || "").replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (full, key) => {
    const normalizedKey = safeText(key).toLowerCase().replace(/[^a-z0-9_]+/g, "_");
    const value = toPlainObject(tokenMap)[normalizedKey];
    return value == null || value === "" ? "" : String(value);
  });

const cleanPublicStoryText = (value) =>
  String(value || "")
    .replace(/\{\{\s*[^}]+\s*\}\}/g, "")
    .replace(/\bis powered by\s+and\s+/gi, " ")
    .replace(/\bcomes with\s+and\s+/gi, " ")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/^\s+|\s+$/g, "")
    .trim();

const isUsefulParagraph = (value) => {
  const text = cleanPublicStoryText(value);
  if (!text) return false;
  if (/\{\{|\}\}/.test(text)) return false;
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length < 5) return false;
  if (/powered by\s+and/i.test(text)) return false;
  if (/comes with\s+and/i.test(text)) return false;
  return true;
};

const splitTitleLines = (value, maxLines = 3, maxCharsPerLine = 18) => {
  const words = stripMarkup(value)
    .split(/\s+/)
    .filter(Boolean);

  if (!words.length) return ["LATEST STORY"];

  const lines = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxCharsPerLine) {
      current = next;
      continue;
    }

    if (current) lines.push(current);
    current = word;
    if (lines.length >= maxLines - 1) break;
  }

  if (current && lines.length < maxLines) lines.push(current);

  const usedWords = lines.reduce(
    (count, line) => count + line.split(/\s+/).filter(Boolean).length,
    0,
  );
  const remaining = words.slice(usedWords);
  if (remaining.length && lines.length < maxLines) {
    lines.push(remaining.join(" ").slice(0, maxCharsPerLine));
  }

  return lines.slice(0, maxLines).map((line) => line.toUpperCase());
};

const escapeSvgText = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const createFallbackStoryArtwork = ({ category, title, brandName, productType }) => {
  const theme = FALLBACK_THEME_BY_CATEGORY[category] || DEFAULT_THEME;
  const titleLines = splitTitleLines(title);
  const categoryLabel = escapeSvgText(CATEGORY_LABELS[category] || "Newsroom");
  const brandLabel = escapeSvgText(
    brandName || PRODUCT_TYPE_LABELS[safeText(productType).toLowerCase()] || "Hooks",
  );
  const descriptorLabel = escapeSvgText(
    productType ? String(productType).toUpperCase() : "EDITORIAL COVER",
  );

  const titleText = titleLines
    .map((line, index) => {
      const y = 264 + index * 54;
      const fontSize = index === 0 ? 42 : 34;
      return `<text x="92" y="${y}" fill="#ffffff" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="800" letter-spacing="-0.02em">${escapeSvgText(
        line,
      )}</text>`;
    })
    .join("");

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 760" role="img" aria-label="${escapeSvgText(
      title,
    )}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${theme.from}" />
          <stop offset="55%" stop-color="${theme.via}" />
          <stop offset="100%" stop-color="${theme.to}" />
        </linearGradient>
        <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.15" />
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0.02" />
        </linearGradient>
      </defs>
      <rect width="1200" height="760" fill="url(#bg)" />
      <g opacity="0.18">
        <circle cx="998" cy="126" r="172" fill="#ffffff" />
        <circle cx="220" cy="630" r="240" fill="#ffffff" />
      </g>
      <g opacity="0.12" stroke="#ffffff">
        <path d="M0 92h1200" />
        <path d="M0 196h1200" />
        <path d="M0 300h1200" />
        <path d="M0 404h1200" />
        <path d="M0 508h1200" />
        <path d="M0 612h1200" />
        <path d="M112 0v760" />
        <path d="M356 0v760" />
        <path d="M600 0v760" />
        <path d="M844 0v760" />
        <path d="M1088 0v760" />
      </g>
      <rect x="80" y="72" width="206" height="44" rx="22" fill="#ffffff" fill-opacity="0.12" />
      <text x="108" y="100" fill="#f8fafc" font-family="Arial, sans-serif" font-size="20" font-weight="700" letter-spacing="4">${categoryLabel}</text>
      <rect x="80" y="150" width="560" height="224" rx="28" fill="url(#accent)" />
      ${titleText}
      <text x="92" y="348" fill="#dbeafe" font-family="Arial, sans-serif" font-size="26" font-weight="500">${brandLabel}</text>
      <text x="92" y="388" fill="#e2e8f0" font-family="Arial, sans-serif" font-size="18" font-weight="500">${descriptorLabel}</text>
      <g>
        <rect x="722" y="136" width="338" height="430" rx="36" fill="#ffffff" fill-opacity="0.08" />
        <rect x="758" y="172" width="266" height="358" rx="30" fill="#ffffff" fill-opacity="0.1" />
        <rect x="800" y="218" width="180" height="10" rx="5" fill="#ffffff" fill-opacity="0.82" />
        <rect x="800" y="246" width="132" height="10" rx="5" fill="#ffffff" fill-opacity="0.48" />
        <rect x="800" y="316" width="170" height="154" rx="24" fill="#020617" fill-opacity="0.26" />
        <circle cx="917" cy="258" r="42" fill="#ffffff" fill-opacity="0.14" />
      </g>
      <g>
        <rect x="80" y="572" width="246" height="112" rx="24" fill="#ffffff" fill-opacity="0.08" />
        <rect x="342" y="572" width="246" height="112" rx="24" fill="#ffffff" fill-opacity="0.08" />
        <rect x="604" y="572" width="246" height="112" rx="24" fill="#ffffff" fill-opacity="0.08" />
      </g>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const clipWords = (value, maxWords = 28) => {
  const words = stripMarkup(value)
    .split(/\s+/)
    .filter(Boolean);

  if (words.length <= maxWords) return words.join(" ");
  return `${words.slice(0, maxWords).join(" ")}...`;
};

const splitParagraphs = (value) =>
  String(value || "")
    .split(/\n\s*\n/)
    .map((entry) => stripMarkup(entry))
    .filter(Boolean);

const formatDateLabel = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recent update";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const estimateReadTime = (value) => {
  const words = stripMarkup(value)
    .split(/\s+/)
    .filter(Boolean).length;
  return `${Math.max(1, Math.ceil(words / 180))} min read`;
};

const normalizeCategory = (value) => {
  const normalized = safeText(value).toLowerCase();
  return CATEGORY_LABELS[normalized] ? normalized : "news";
};

const buildHighlights = (blog, category) => {
  const fallbackByCategory = {
    news: "Latest update",
    mobiles: "Mobile coverage",
    gadgets: "Gadget watch",
    guides: "Editorial guide",
    launches: "Launch watch",
  };

  return [
    CATEGORY_LABELS[category],
    safeText(blog.brand_name),
    safeText(blog.product_name),
    PRODUCT_TYPE_LABELS[safeText(blog.product_type).toLowerCase()],
    fallbackByCategory[category],
  ]
    .filter(Boolean)
    .filter((entry, index, list) => list.indexOf(entry) === index)
    .slice(0, 3);
};

const buildTakeaways = ({ blog, body, category }) => {
  const categoryDetail = {
    news: "Filed as a fast newsroom update.",
    mobiles: "Focused on what matters in real mobile buying decisions.",
    gadgets: "Written for quick scanning before the deeper read.",
    guides: "Structured to read more like an explainer than a breaking update.",
    launches: "Built to surface the most important launch signals first.",
  };

  return [
    safeText(blog.product_name)
      ? `${safeText(blog.product_name)} is the main story reference in this piece.`
      : `${CATEGORY_LABELS[category]} coverage from the Hooks newsroom.`,
    categoryDetail[category] || null,
    body[1]
      ? clipWords(body[1], 18)
      : "The full story below adds the remaining context.",
  ]
    .filter(Boolean)
    .filter((entry, index, list) => list.indexOf(entry) === index)
    .slice(0, 3);
};

const readSnapshotText = (snapshot, keys = []) => {
  const source = toPlainObject(snapshot);
  for (const key of keys) {
    const text = cleanPublicStoryText(source?.[key]);
    if (text) return text;
  }
  return "";
};

const joinSpecParts = (...values) =>
  values
    .map((value) => cleanPublicStoryText(value))
    .filter(Boolean)
    .join(" · ");

const buildDeviceSpecs = (snapshot) => {
  const specs = [];
  const addSpec = (label, value) => {
    const text = clipWords(cleanPublicStoryText(value), 14);
    if (!text) return;
    specs.push({ label, value: text });
  };

  addSpec(
    "Display",
    joinSpecParts(
      readSnapshotText(snapshot, ["display", "display_size", "screen_size"]),
      readSnapshotText(snapshot, ["resolution"]),
      readSnapshotText(snapshot, ["refresh_rate"]),
    ),
  );

  addSpec(
    "OS",
    readSnapshotText(snapshot, ["os", "operating_system", "software_os"]),
  );

  addSpec(
    "Camera",
    joinSpecParts(
      readSnapshotText(snapshot, ["main_camera", "camera"]),
      readSnapshotText(snapshot, ["front_camera"]),
    ),
  );

  addSpec(
    "Connectivity",
    joinSpecParts(
      readSnapshotText(snapshot, ["network", "network_type"]),
      readSnapshotText(snapshot, ["connectivity"]),
    ),
  );

  const fallbackSpecs = [
    ["Processor", ["processor", "chipset"]],
    ["Battery", ["battery", "battery_capacity", "capacity"]],
    ["RAM", ["ram", "memory"]],
    ["Storage", ["storage", "internal_storage"]],
  ];

  for (const [label, keys] of fallbackSpecs) {
    if (specs.length >= 4) break;
    addSpec(label, readSnapshotText(snapshot, keys));
  }

  return specs.slice(0, 4);
};

const normalizeBlogStory = (blog) => {
  if (!blog || typeof blog !== "object") return null;

  const slug = safeText(blog.slug);
  const title = safeText(blog.title);
  if (!slug || !title) return null;

  const category = normalizeCategory(blog.category);
  const tokenSnapshot = toPlainObject(blog.token_snapshot);
  const sourceContent = safeText(blog.content_template)
    ? blog.content_template
    : blog.content_rendered;
  const renderedContent = cleanPublicStoryText(
    renderTokenizedContent(sourceContent, tokenSnapshot),
  );
  const body = splitParagraphs(renderedContent).filter(Boolean);
  const summarySource =
    safeText(blog.excerpt) ||
    safeText(blog.meta_description) ||
    body.find(isUsefulParagraph) ||
    null;
  const authorName = safeText(blog.author_name);
  const fallbackSummaryByCategory = {
    news: `${title} is the latest newsroom update from Hooks.`,
    mobiles: `${title} keeps the mobile section focused on the most useful device details.`,
    gadgets: `${title} covers the gadget changes worth a quick scan.`,
    guides: `${title} is a calmer guide-led story for readers who want context first.`,
    launches: `${title} tracks the launches worth paying attention to.`,
  };
  const summary = clipWords(
    summarySource && isUsefulParagraph(summarySource)
      ? summarySource
      : fallbackSummaryByCategory[category],
    24,
  );
  const publishedIso = safeText(blog.published_at) || safeText(blog.updated_at);
  const updatedIso = safeText(blog.updated_at) || publishedIso;
  const author = authorName
    ? { name: authorName, role: "Editorial byline" }
    : CATEGORY_AUTHORS[category] || CATEGORY_AUTHORS.news;
  const highlights = buildHighlights(blog, category);
  const image = safeText(blog.hero_image)
    ? safeText(blog.hero_image)
    : createFallbackStoryArtwork({
        category,
        title,
        brandName: blog.brand_name,
        productType: blog.product_type,
      });

  return {
    id: Number(blog.id) || slug,
    slug,
    category,
    label: CATEGORY_LABELS[category] || CATEGORY_LABELS.news,
    title,
    summary,
    publishedAt: formatDateLabel(publishedIso || updatedIso),
    publishedIso: publishedIso || new Date().toISOString(),
    updatedIso: updatedIso || publishedIso || new Date().toISOString(),
    readTime: estimateReadTime(blog.content_rendered || summarySource),
    author: author.name,
    authorRole: author.role,
    highlights,
    takeaways: buildTakeaways({
      blog,
      body: body.length ? body : [summary],
      category,
    }),
    body: body.length ? body : [summary],
    image: image || DEFAULT_STORY_IMAGE,
    heroImageSource: safeText(blog.hero_image_source),
    heroImageAlt: safeText(blog.hero_image_alt) || title,
    heroImageCaption: safeText(blog.hero_image_caption),
    tags: parseBlogTags(blog.tags),
    featured: Boolean(blog.featured),
    trending: Boolean(blog.trending),
    pinned: Boolean(blog.pinned),
    productName: safeText(blog.product_name),
    productType: safeText(blog.product_type).toLowerCase(),
    brandName: safeText(blog.brand_name),
    brandLogo: normalizeBrandLogoUrl(blog.brand_logo),
    tokenSnapshot,
    deviceSpecs: buildDeviceSpecs(tokenSnapshot),
    metaTitle: safeText(blog.meta_title),
    metaDescription: safeText(blog.meta_description),
  };
};

const fetchJson = async (url, { signal } = {}) => {
  const response = await fetch(url, {
    signal,
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  const contentType = String(response.headers.get("content-type") || "").toLowerCase();
  const data = contentType.includes("application/json")
    ? await response.json().catch(() => ({}))
    : null;

  if (!response.ok) {
    const error = new Error(data?.message || "Failed to fetch news data");
    error.status = response.status;
    throw error;
  }

  if (!contentType.includes("application/json")) {
    throw new Error("News API returned a non-JSON response");
  }

  return data;
};

export const createNewsStoryPath = (slug = "") =>
  `/news/${encodeURIComponent(safeText(slug))}`;

export const buildRelatedNewsStories = (stories = [], currentStory = null, limit = 3) => {
  const currentSlug = safeText(currentStory?.slug);
  if (!currentSlug) return stories.slice(0, limit);

  const sameCategory = stories.filter(
    (story) =>
      story.slug !== currentSlug && story.category === currentStory.category,
  );
  const otherStories = stories.filter(
    (story) =>
      story.slug !== currentSlug && story.category !== currentStory.category,
  );

  return [...sameCategory, ...otherStories].slice(0, limit);
};

export const usePublicNewsFeed = ({ limit = 12, category = "" } = {}) => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    const loadStories = async () => {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams();
        params.set("limit", String(limit));
        if (safeText(category)) params.set("category", safeText(category));

        const data = await fetchJson(
          `${API_BASE}/api/public/blogs?${params.toString()}`,
          {
            signal: controller.signal,
          },
        );

        if (!active) return;
        const nextStories = Array.isArray(data?.blogs)
          ? data.blogs.map(normalizeBlogStory).filter(Boolean)
          : [];
        setStories(nextStories);
      } catch (err) {
        if (!active || err?.name === "AbortError") return;
        setStories([]);
        setError(err?.message || "Failed to load newsroom stories");
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadStories();

    return () => {
      active = false;
      controller.abort();
    };
  }, [category, limit]);

  return { stories, loading, error };
};

export const usePublicNewsStory = (slug = "") => {
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const normalizedSlug = safeText(slug);
    if (!normalizedSlug) {
      setStory(null);
      setLoading(false);
      setError("");
      setNotFound(true);
      return undefined;
    }

    const controller = new AbortController();
    let active = true;

    const loadStory = async () => {
      setLoading(true);
      setError("");
      setNotFound(false);

      try {
        const data = await fetchJson(
          `${API_BASE}/api/public/blogs/${encodeURIComponent(normalizedSlug)}`,
          { signal: controller.signal },
        );

        if (!active) return;
        setStory(normalizeBlogStory(data?.blog));
      } catch (err) {
        if (!active || err?.name === "AbortError") return;
        setStory(null);
        if (err?.status === 404) {
          setNotFound(true);
          setError("");
        } else {
          setNotFound(false);
          setError(err?.message || "Failed to load story");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadStory();

    return () => {
      active = false;
      controller.abort();
    };
  }, [slug]);

  return { story, loading, error, notFound };
};

export const useStoryListSchemaItems = (stories = []) =>
  useMemo(
    () =>
      stories.map((story) => ({
        name: story.title,
        url: `https://tryhook.shop${createNewsStoryPath(story.slug)}`,
        image: story.image,
      })),
    [stories],
  );
