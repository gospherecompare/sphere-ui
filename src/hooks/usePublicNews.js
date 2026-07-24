import { useEffect, useMemo, useState } from "react";
import { readPreloadedApiResponse } from "../utils/preloadedApi";
import { toCanonicalPagePath } from "../utils/publicUrl";
import { buildApiUrl } from "../utils/apiUrl";
import { fetchPublicJson } from "../utils/publicJsonRequest";

const DEFAULT_STORY_IMAGE = "/hook-logo.png";

const CATEGORY_LABELS = {
  news: "News",
  technology: "Technology",
  ai: "AI",
  smartphones: "Smartphones",
  mobiles: "Mobile update",
  chips: "Chips",
  laptops: "Laptops",
  software: "Software",
  cybersecurity: "Cybersecurity",
  "ev-tech": "EV Tech",
  robotics: "Robotics",
  "consumer-tech": "Consumer Tech",
  apps: "Apps",
  internet: "Internet",
  "cloud-services": "Cloud Services",
  science: "Science",
  space: "Space",
  "health-tech": "Health Technology",
  "renewable-energy": "Renewable Energy",
  "quantum-computing": "Quantum Computing",
  "sports-technology": "Sports Technology",
  wearables: "Wearables",
  "sports-science": "Sports Science",
  gadgets: "Gadget update",
  guides: "Guide deck",
  launches: "Launch tracker",
};

const CATEGORY_AUTHORS = {
  news: { name: "Hooks news", role: "News desk" },
  technology: { name: "Hooks tech", role: "Technology desk" },
  ai: { name: "Hooks AI", role: "AI desk" },
  smartphones: { name: "Hooks mobile", role: "Mobile editor" },
  mobiles: { name: "Hooks mobile", role: "Mobile editor" },
  chips: { name: "Hooks silicon", role: "Chip desk" },
  laptops: { name: "Hooks computing", role: "Computing desk" },
  software: { name: "Hooks software", role: "Software desk" },
  cybersecurity: { name: "Hooks security", role: "Cybersecurity desk" },
  "ev-tech": { name: "Hooks mobility", role: "EV technology desk" },
  robotics: { name: "Hooks robotics", role: "Robotics desk" },
  "consumer-tech": { name: "Hooks consumer tech", role: "Consumer tech desk" },
  apps: { name: "Hooks apps", role: "Apps desk" },
  internet: { name: "Hooks internet", role: "Internet desk" },
  "cloud-services": { name: "Hooks cloud", role: "Cloud services desk" },
  science: { name: "Hooks science", role: "Science desk" },
  space: { name: "Hooks space", role: "Space desk" },
  "health-tech": { name: "Hooks health tech", role: "Health technology desk" },
  "renewable-energy": { name: "Hooks energy", role: "Renewable energy desk" },
  "quantum-computing": { name: "Hooks quantum", role: "Quantum computing desk" },
  "sports-technology": { name: "Hooks sports tech", role: "Sports technology desk" },
  wearables: { name: "Hooks wearables", role: "Wearables desk" },
  "sports-science": { name: "Hooks sports science", role: "Sports science desk" },
  gadgets: { name: "Hooks gadgets", role: "Gadgets desk" },
  guides: { name: "Hooks editorial", role: "Editorial guides" },
  launches: { name: "Hooks desk", role: "Launch desk" },
};

const CATEGORY_ALIASES = {
  tech: "technology",
  "tech-news": "technology",
  "technology-news": "technology",
  mobile: "smartphones",
  mobiles: "mobiles",
  phones: "smartphones",
  smartphone: "smartphones",
  "chip-news": "chips",
  semiconductors: "chips",
  semiconductor: "chips",
  "consumer-tech-and-internet": "consumer-tech",
  "consumer-technology": "consumer-tech",
  "health-technology": "health-tech",
  "medical-technology": "health-tech",
  "ev-technology": "ev-tech",
  "electric-vehicles": "ev-tech",
  "sports-tech": "sports-technology",
};

const PRODUCT_TYPE_LABELS = {
  smartphone: "Smartphones",
  laptop: "Laptops",
  tv: "TVs",
};

const safeText = (value) => String(value || "").trim();

const titleCaseCategory = (value) =>
  safeText(value)
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");

const getCategoryLabel = (category) =>
  CATEGORY_LABELS[safeText(category)] ||
  titleCaseCategory(category) ||
  CATEGORY_LABELS.news;

const readAuthorText = (value) => {
  if (!value) return "";
  if (typeof value === "string" || typeof value === "number") {
    return safeText(value);
  }
  if (typeof value !== "object") return "";

  return (
    safeText(value.author_name) ||
    safeText(value.authorName) ||
    safeText(value.display_name) ||
    safeText(value.displayName) ||
    safeText(value.full_name) ||
    safeText(value.fullName) ||
    safeText(value.name) ||
    safeText(value.user_name) ||
    safeText(value.username) ||
    safeText(value.email)
  );
};

const resolveBlogAuthorName = (blog = {}) =>
  [
    blog.author_name,
    blog.authorName,
    blog.byline,
    blog.assigned_author_name,
    blog.assignedAuthorName,
    blog.author,
    blog.assigned_author,
    blog.assignedAuthor,
    blog.user,
  ]
    .map(readAuthorText)
    .find(Boolean) || "";

const resolveBlogAuthorRole = (blog = {}) =>
  [
    blog.author_role,
    blog.authorRole,
    blog.role_title,
    blog.roleTitle,
    blog.author?.role_title,
    blog.author?.roleTitle,
    blog.author?.role,
    blog.assigned_author?.role_title,
    blog.assignedAuthor?.roleTitle,
    blog.assigned_author?.role,
    blog.assignedAuthor?.role,
  ]
    .map(safeText)
    .find(Boolean) || "";

const decodeHtmlEntitiesOnce = (value) => {
  let text = String(value || "");
  const replacements = [
    ["&lt;", "<"],
    ["&gt;", ">"],
    ["&quot;", '"'],
    ["&#39;", "'"],
    ["&nbsp;", " "],
    ["&amp;", "&"],
  ];

  replacements.forEach(([encoded, decoded]) => {
    text = text.split(encoded).join(decoded);
  });

  return text;
};

const containsArticleMarkup = (value) =>
  /<\s*\/?(?:p|br|h[1-6]|ul|ol|li|table|thead|tbody|tr|th|td|blockquote|pre|code|figure|figcaption|img)\b/i.test(
    String(value || ""),
  );

const normalizeHtmlContent = (value) => {
  let text = String(value || "").replace(/\r\n?/g, "\n").trim();

  for (let pass = 0; pass < 3 && text && !containsArticleMarkup(text); pass += 1) {
    const next = decodeHtmlEntitiesOnce(text);
    if (next === text) break;
    text = next;
  }

  return text;
};

const decodeTextEntities = (value) => {
  let text = String(value || "");

  for (let pass = 0; pass < 3; pass += 1) {
    const next = decodeHtmlEntitiesOnce(text);
    if (next === text) break;
    text = next;
  }

  return text;
};

const escapeHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const applyInlineBoldMarkers = (value) =>
  String(value || "")
    .split(/(<(?:pre|code)\b[^>]*>[\s\S]*?<\/(?:pre|code)>)/gi)
    .map((segment) => {
      if (/^<(?:pre|code)\b/i.test(segment)) return segment;

      return segment
        .split(/(<[^>]+>)/g)
        .map((part) => {
          if (!part || part.startsWith("<")) return part;

          return part
            .replace(/\*\*([\s\S]*?)\*\*/g, (full, inner) => {
              const text = String(inner || "").trim();
              return text ? `<strong>${text}</strong>` : full;
            })
            .replace(/__([\s\S]*?)__/g, (full, inner) => {
              const text = String(inner || "").trim();
              return text ? `<strong>${text}</strong>` : full;
            });
        })
        .join("");
    })
    .join("");

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

const KNOWN_STORY_BRANDS = [
  "Qualcomm",
  "Motorola",
  "MediaTek",
  "Microsoft",
  "Instagram",
  "WhatsApp",
  "Nintendo",
  "Samsung",
  "YouTube",
  "OnePlus",
  "Nothing",
  "Infinix",
  "Google",
  "Redmi",
  "Xiaomi",
  "Apple",
  "Nvidia",
  "Lenovo",
  "realme",
  "iQOO",
  "OPPO",
  "vivo",
  "Sony",
  "Honor",
  "Huawei",
  "Tecno",
  "NASA",
  "ISRO",
  "Meta",
  "Intel",
  "AMD",
  "Dell",
  "Asus",
  "Acer",
  "MSI",
  "HP",
].sort((left, right) => right.length - left.length);

const normalizeBrandMatchText = (value) =>
  ` ${String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()} `;

const inferBlogBrandName = (blog = {}, linkedProducts = []) => {
  const directBrand = [
    blog.brand_name,
    blog.brandName,
    ...linkedProducts.map((product) => product?.brandName),
  ]
    .map(safeText)
    .find(Boolean);
  if (directBrand) return directBrand;

  const haystack = normalizeBrandMatchText(
    [
      blog.product_name,
      blog.productName,
      blog.title,
      blog.excerpt,
      blog.meta_description,
      ...(Array.isArray(blog.tags) ? blog.tags : []),
    ].join(" "),
  );

  return (
    KNOWN_STORY_BRANDS.find((brand) =>
      haystack.includes(normalizeBrandMatchText(brand)),
    ) || ""
  );
};

const FALLBACK_THEME_BY_CATEGORY = {
  news: { from: "#0f172a", via: "#1d4ed8", to: "#2563eb" },
  technology: { from: "#0f172a", via: "#2563eb", to: "#06b6d4" },
  ai: { from: "#111827", via: "#7c3aed", to: "#22d3ee" },
  smartphones: { from: "#0f172a", via: "#0891b2", to: "#06b6d4" },
  mobiles: { from: "#0f172a", via: "#0891b2", to: "#06b6d4" },
  chips: { from: "#111827", via: "#ea580c", to: "#facc15" },
  laptops: { from: "#111827", via: "#334155", to: "#60a5fa" },
  software: { from: "#0f172a", via: "#4f46e5", to: "#a78bfa" },
  cybersecurity: { from: "#111827", via: "#be123c", to: "#fb7185" },
  "consumer-tech": { from: "#0f172a", via: "#059669", to: "#34d399" },
  science: { from: "#0f172a", via: "#0369a1", to: "#38bdf8" },
  space: { from: "#020617", via: "#4338ca", to: "#818cf8" },
  "sports-technology": { from: "#0f172a", via: "#16a34a", to: "#bef264" },
  gadgets: { from: "#0f172a", via: "#ea580c", to: "#f97316" },
  guides: { from: "#0f172a", via: "#6d28d9", to: "#8b5cf6" },
  launches: { from: "#0f172a", via: "#16a34a", to: "#22c55e" },
};

const DEFAULT_THEME = FALLBACK_THEME_BY_CATEGORY.news;

const stripMarkup = (value) =>
  decodeTextEntities(
    safeText(value)
      .replace(/(\*\*|__)([\s\S]*?)\1/g, " $2 ")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\s+/g, " ")
    .trim();

const renderTokenizedContent = (
  content,
  tokenMap = {},
  { preserveUnknown = true } = {},
) => {
  const normalizedTokens = toPlainObject(tokenMap);

  return String(content || "").replace(
    /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g,
    (full, key) => {
      const normalizedKey = safeText(key)
        .toLowerCase()
        .replace(/[^a-z0-9_]+/g, "_");
      const value = normalizedTokens[normalizedKey];
      return value == null || value === ""
        ? preserveUnknown
          ? full
          : ""
        : escapeHtml(String(value));
    },
  );
};

const resolveBlogContentHtml = (blog, tokenSnapshot = {}) => {
  const rendered = applyInlineBoldMarkers(
    normalizeHtmlContent(blog?.content_rendered),
  );
  if (rendered) return rendered;

  const template = normalizeHtmlContent(blog?.content_template);
  if (!template) return "";

  return applyInlineBoldMarkers(
    normalizeHtmlContent(
      renderTokenizedContent(template, tokenSnapshot, {
        preserveUnknown: true,
      }),
    ),
  );
};

const cleanPublicStoryText = (value) =>
  String(value || "")
    .replace(/(\*\*|__)([\s\S]*?)\1/g, "$2")
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
  const categoryLabel = escapeSvgText(getCategoryLabel(category));
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
  normalizeHtmlContent(value)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(
      /<\/(p|h[1-6]|li|blockquote|tr|table|div|section|article|figure|figcaption)>/gi,
      "$&\n\n",
    )
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

const parseDateValue = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const shouldUseUpdatedDate = (publishedValue, updatedValue) => {
  const updatedDate = parseDateValue(updatedValue);
  if (!updatedDate) return false;

  const publishedDate = parseDateValue(publishedValue);
  if (!publishedDate) return true;
  if (updatedDate.getTime() <= publishedDate.getTime()) return false;

  return formatDateLabel(updatedDate) !== formatDateLabel(publishedDate);
};

const formatImageCreditLabel = (...values) => {
  const raw = values.map(safeText).find(Boolean);
  if (!raw || /^(asset|url|hooks newsroom)$/i.test(raw)) return "";
  if (/^https?:\/\//i.test(raw)) {
    try {
      return new URL(raw).hostname.replace(/^www\./i, "");
    } catch {
      return "";
    }
  }
  return raw;
};

const estimateReadTime = (value) => {
  const words = stripMarkup(value)
    .split(/\s+/)
    .filter(Boolean).length;
  return `${Math.max(1, Math.ceil(words / 180))} min read`;
};

const normalizeCategory = (value) => {
  const normalized = safeText(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const aliased = CATEGORY_ALIASES[normalized] || normalized;
  return aliased || "news";
};

const buildHighlights = (blog, category) => {
  const fallbackByCategory = {
    news: "Latest update",
    technology: "Technology watch",
    ai: "AI watch",
    smartphones: "Smartphone coverage",
    mobiles: "Mobile coverage",
    chips: "Silicon watch",
    laptops: "Computing coverage",
    software: "Software update",
    cybersecurity: "Security watch",
    "consumer-tech": "Consumer tech",
    science: "Science briefing",
    space: "Space watch",
    "sports-technology": "Sports tech",
    gadgets: "Gadget watch",
    guides: "Editorial guide",
    launches: "Launch watch",
  };

  return [
    getCategoryLabel(category),
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
    news: "Filed as a fast news update.",
    technology: "Focused on the technology shift behind the headline.",
    ai: "Built around practical AI context, not hype alone.",
    smartphones: "Focused on what matters in real mobile buying decisions.",
    mobiles: "Focused on what matters in real mobile buying decisions.",
    chips: "Tracks silicon changes that can affect future devices.",
    laptops: "Connects computing updates to real-world buying and usage.",
    software: "Explains the feature, rollout, or platform change clearly.",
    cybersecurity: "Highlights the risk, impact, and user-facing context.",
    "consumer-tech": "Keeps everyday apps, internet, and services in focus.",
    science: "Connects the science update to technology and future impact.",
    space: "Keeps mission and discovery context easy to scan.",
    "sports-technology": "Covers the technology layer behind modern sport.",
    gadgets: "Written for quick scanning before the deeper read.",
    guides: "Structured to read more like an explainer than a breaking update.",
    launches: "Built to surface the most important launch signals first.",
  };

  return [
    safeText(blog.product_name)
      ? `${safeText(blog.product_name)} is the main story reference in this piece.`
      : `${getCategoryLabel(category)} coverage from the Hooks news desk.`,
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

const normalizeLinkedProductEntries = (blog) => {
  const products = Array.isArray(blog?.products) ? blog.products : [];
  const productIds = Array.isArray(blog?.product_ids) ? blog.product_ids : [];
  const byId = new Map();

  products.forEach((product) => {
    const productId = Number(
      product?.product_id ?? product?.productId ?? product?.id,
    );
    if (!Number.isInteger(productId) || productId <= 0) return;

    byId.set(productId, {
      productId,
      productType: safeText(product?.product_type || product?.productType).toLowerCase(),
      name: safeText(product?.name || product?.product_name || product?.productName),
      brandName: safeText(product?.brand_name || product?.brandName),
    });
  });

  const orderedIds = Array.from(
    new Set(
      productIds
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value > 0),
    ),
  );
  const orderedProducts = orderedIds
    .map((productId) => byId.get(productId) || { productId })
    .filter(Boolean);

  if (orderedProducts.length > 0) {
    return orderedProducts;
  }

  const fallbackId = Number(blog?.product_id);
  if (!Number.isInteger(fallbackId) || fallbackId <= 0) {
    return [];
  }

  return [
    {
      productId: fallbackId,
      productType: safeText(blog?.product_type).toLowerCase(),
      name: safeText(blog?.product_name),
      brandName: safeText(blog?.brand_name),
    },
  ];
};

const normalizeBlogStory = (blog) => {
  if (!blog || typeof blog !== "object") return null;

  const slug = safeText(blog.slug);
  const title = safeText(blog.title);
  if (!slug || !title) return null;

  const linkedProducts = normalizeLinkedProductEntries(blog);
  const primaryLinkedProduct = linkedProducts[0] || null;
  const linkedProductIds = linkedProducts
    .map((product) => Number(product?.productId))
    .filter((productId) => Number.isInteger(productId) && productId > 0);
  const linkedProductNames = linkedProducts
    .map((product) => safeText(product?.name))
    .filter(Boolean);
  const linkedProductTypes = linkedProducts
    .map((product) => safeText(product?.productType).toLowerCase())
    .filter(Boolean);
  const linkedProductId = primaryLinkedProduct?.productId || null;
  const category = normalizeCategory(blog.category);
  const tokenSnapshot = toPlainObject(blog.token_snapshot);
  const articleHtml = resolveBlogContentHtml(blog, tokenSnapshot);
  const body = splitParagraphs(articleHtml).filter(Boolean);
  const summarySource =
    safeText(blog.excerpt) ||
    safeText(blog.meta_description) ||
    body.find(isUsefulParagraph) ||
    null;
  const authorName = resolveBlogAuthorName(blog);
  const authorRole = resolveBlogAuthorRole(blog);
  const fallbackSummaryByCategory = {
    news: `${title} is the latest news update from Hooks.`,
    technology: `${title} is part of the latest technology coverage from Hooks.`,
    ai: `${title} tracks an AI update with practical technology context.`,
    smartphones: `${title} keeps the smartphone section focused on useful device details.`,
    mobiles: `${title} keeps the mobile section focused on the most useful device details.`,
    chips: `${title} follows the semiconductor changes shaping upcoming devices.`,
    laptops: `${title} covers computing updates for laptop and PC readers.`,
    software: `${title} explains a software or platform change worth tracking.`,
    cybersecurity: `${title} highlights a security update with user-facing context.`,
    "consumer-tech": `${title} covers the apps, internet, and services people use every day.`,
    science: `${title} connects science news with technology and future impact.`,
    space: `${title} follows space technology, missions, and discoveries.`,
    "sports-technology": `${title} looks at the technology changing modern sport.`,
    gadgets: `${title} covers the gadget changes worth a quick scan.`,
    guides: `${title} is a calmer guide-led story for readers who want context first.`,
    launches: `${title} tracks the launches worth paying attention to.`,
  };
  const summary = clipWords(
    summarySource && isUsefulParagraph(summarySource)
      ? summarySource
      : fallbackSummaryByCategory[category] ||
          `${title} is the latest ${getCategoryLabel(
            category,
          ).toLowerCase()} update from Hooks.`,
    24,
  );
  const publishedIso = safeText(blog.published_at) || safeText(blog.updated_at);
  const rawUpdatedIso = safeText(blog.updated_at) || publishedIso;
  const hasDisplayableUpdate = shouldUseUpdatedDate(publishedIso, rawUpdatedIso);
  const updatedIso = hasDisplayableUpdate ? rawUpdatedIso : publishedIso;
  const publishedDateLabel = formatDateLabel(publishedIso || updatedIso);
  const updatedDateLabel = formatDateLabel(updatedIso || publishedIso);
  const fallbackAuthor = CATEGORY_AUTHORS[category] || CATEGORY_AUTHORS.news;
  const author = authorName
    ? {
        name: authorName,
        role: authorRole || fallbackAuthor?.role || "Hooks news",
      }
    : fallbackAuthor;
  const brandName = inferBlogBrandName(blog, linkedProducts);
  const brandedBlog = brandName ? { ...blog, brand_name: brandName } : blog;
  const highlights = buildHighlights(brandedBlog, category);
  const image = safeText(blog.hero_image)
    ? safeText(blog.hero_image)
    : createFallbackStoryArtwork({
        category,
        title,
        brandName,
        productType: blog.product_type,
      });
  const heroImageSource = safeText(blog.hero_image_source);
  const heroImageCaption = safeText(blog.hero_image_caption);
  const imageCredit = formatImageCreditLabel(
    blog.image_credit,
    blog.imageCredit,
    blog.hero_image_credit,
    blog.heroImageCredit,
    blog.photo_credit,
    blog.photoCredit,
    blog.credit,
    blog.credits,
    heroImageCaption,
    heroImageSource,
  );

  return {
    id: Number(blog.id) || slug,
    productId: linkedProductId,
    productIds: linkedProductIds,
    productTypes: linkedProductTypes,
    linkedProducts,
    linkedProductNames,
    linkedProductCount: linkedProductIds.length,
    productLinked: linkedProductIds.length > 0,
    slug,
    category,
    label: getCategoryLabel(category),
    title,
    summary,
    publishedAt: publishedDateLabel,
    updatedAt: updatedDateLabel,
    publishedLabel: `Published ${publishedDateLabel}`,
    updatedLabel: hasDisplayableUpdate ? `Updated ${updatedDateLabel}` : "",
    publishedIso: publishedIso || new Date().toISOString(),
    updatedIso: updatedIso || publishedIso || new Date().toISOString(),
    readTime: estimateReadTime(articleHtml || summarySource),
    author: author.name,
    authorRole: author.role,
    highlights,
    takeaways: buildTakeaways({
      blog: brandedBlog,
      body: body.length ? body : [summary],
      category,
    }),
    body: body.length ? body : [summary],
    contentHtml: articleHtml,
    image: image || DEFAULT_STORY_IMAGE,
    heroImageSource,
    heroImageAlt: safeText(blog.hero_image_alt) || title,
    heroImageCaption,
    imageCredit,
    credit: imageCredit,
    tags: parseBlogTags(blog.tags),
    featured: Boolean(blog.featured),
    trending: Boolean(blog.trending),
    pinned: Boolean(blog.pinned),
    productName: safeText(primaryLinkedProduct?.name || blog.product_name),
    productType: safeText(primaryLinkedProduct?.productType || blog.product_type).toLowerCase(),
    brandName,
    brandLogo: normalizeBrandLogoUrl(blog.brand_logo),
    tokenSnapshot,
    deviceSpecs: buildDeviceSpecs(tokenSnapshot),
    metaTitle: safeText(blog.meta_title),
    metaDescription: safeText(blog.meta_description),
  };
};

const fetchJson = async (url, { signal } = {}) => {
  return fetchPublicJson(url, {
    signal,
    cacheTtlMs: 30_000,
  });
};

const buildNewsFeedEndpoint = ({
  limit = 12,
  category = "",
  productId = null,
  productType = "",
} = {}) => {
  const params = new URLSearchParams();
  params.set("limit", String(limit));
  if (safeText(category)) params.set("category", safeText(category));
  if (productId != null && productId !== "") {
    params.set("productId", String(productId));
  }
  if (safeText(productType)) params.set("productType", safeText(productType));
  return buildApiUrl(`/public/blogs?${params.toString()}`);
};

const buildNewsStoryEndpoint = (slug = "") =>
  buildApiUrl(`/public/blogs/${encodeURIComponent(safeText(slug))}`);

const normalizeStoriesFromPayload = (payload) =>
  Array.isArray(payload?.blogs)
    ? payload.blogs.map(normalizeBlogStory).filter(Boolean)
    : [];

export const createNewsStoryPath = (slug = "") => {
  const normalizedSlug = safeText(slug);
  return normalizedSlug
    ? toCanonicalPagePath(`/news/${encodeURIComponent(normalizedSlug)}`)
    : toCanonicalPagePath("/news");
};

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

export const usePublicNewsFeed = ({
  limit = 12,
  category = "",
  productId = null,
  productType = "",
  enabled = true,
} = {}) => {
  const endpoint = useMemo(
    () => buildNewsFeedEndpoint({ limit, category, productId, productType }),
    [category, limit, productId, productType],
  );
  const preloadedStories = useMemo(
    () => normalizeStoriesFromPayload(readPreloadedApiResponse(endpoint)),
    [endpoint],
  );
  const [stories, setStories] = useState(() => preloadedStories);
  const [loading, setLoading] = useState(Boolean(enabled && !preloadedStories.length));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!enabled) {
      setStories([]);
      setLoading(false);
      setError("");
      return undefined;
    }

    const preloadedPayload = readPreloadedApiResponse(endpoint);
    if (preloadedPayload) {
      setStories(normalizeStoriesFromPayload(preloadedPayload));
      setLoading(false);
      setError("");
      return undefined;
    }

    const controller = new AbortController();
    let active = true;

    const loadStories = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await fetchJson(endpoint, { signal: controller.signal });

        if (!active) return;
        setStories(normalizeStoriesFromPayload(data));
      } catch (err) {
        if (!active || err?.name === "AbortError") return;
        setStories([]);
        setError(err?.message || "Failed to load news stories");
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadStories();

    return () => {
      active = false;
      controller.abort();
    };
  }, [enabled, endpoint]);

  return { stories, loading, error };
};

export const usePublicNewsStory = (slug = "") => {
  const storyEndpoint = useMemo(
    () => buildNewsStoryEndpoint(slug),
    [slug],
  );
  const preloadedStory = useMemo(() => {
    const payload = readPreloadedApiResponse(storyEndpoint);
    return payload?.blog ? normalizeBlogStory(payload.blog) : null;
  }, [storyEndpoint]);
  const [story, setStory] = useState(() => preloadedStory);
  const [loading, setLoading] = useState(() => !preloadedStory);
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

    const preloadedPayload = readPreloadedApiResponse(storyEndpoint);
    if (preloadedPayload?.blog) {
      setStory(normalizeBlogStory(preloadedPayload.blog));
      setLoading(false);
      setError("");
      setNotFound(false);
      return undefined;
    }

    const controller = new AbortController();
    let active = true;

    const loadStory = async () => {
      setLoading(true);
      setError("");
      setNotFound(false);

      try {
        const data = await fetchJson(storyEndpoint, { signal: controller.signal });

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
  }, [slug, storyEndpoint]);

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
