import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  FaArrowRight,
  FaChevronLeft,
  FaChevronRight,
  FaFacebookF,
  FaLink,
  FaWhatsapp,
} from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import SEO from "../SEO";
import NotFound from "./NotFound";
import NewsPushOptInCard from "../News/NewsPushOptInCard";
import {
  createBreadcrumbSchema,
  createNewsArticleSchema,
} from "../../utils/schemaGenerators";
import {
  buildRelatedNewsStories,
  createNewsStoryPath,
  usePublicNewsFeed,
  usePublicNewsStory,
} from "../../hooks/usePublicNews";

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const POPULAR_MOBILE_LIST = [
  "Best Mobile Phones Under 30000",
  "Best Mobile Phones Under 20000",
  "Best Mobile Phones Under 15000",
  "Samsung Galaxy S Series Mobile Phones",
  "6000mAh Battery Mobile Phones",
  "Fast Charging Mobile Phones",
];

const MOBILE_RELATED_STORIES_PER_PAGE = 2;
const DESKTOP_RELATED_STORIES_PER_PAGE = 4;
const RELATED_STORIES_MOBILE_QUERY = "(max-width: 639px)";

const parseStoryDate = (story) => {
  const raw = story?.publishedIso || story?.updatedIso || story?.publishedAt;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
};

const parseStoryUpdatedDate = (story) => {
  const raw = story?.updatedIso || story?.updatedAt;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
};

const stripMarkup = (value) =>
  decodeTextEntities(
    String(value || "")
      .replace(/(\*\*|__)([\s\S]*?)\1/g, " $2 ")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\s+/g, " ")
    .trim();

const normalizeTagKey = (value) =>
  stripMarkup(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

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

const normalizeArticleHtml = (value) => {
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

const hasStructuredArticleMarkup = (value) =>
  /<\s*(?:p|h[1-6]|ul|ol|table|blockquote|pre|code|figure|figcaption|img)\b/i.test(
    normalizeArticleHtml(value),
  );

const sanitizeArticleHtml = (value) => {
  const normalized = normalizeArticleHtml(value)
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(
      /<(script|style|iframe|object|embed|form|input|button|textarea|select|svg|canvas)[^>]*>[\s\S]*?<\/\1>/gi,
      "",
    )
    .replace(/<h1\b/gi, "<h2")
    .replace(/<\/h1>/gi, "</h2>")
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(
      /\s(?:style|class|id|aria-[\w-]+|data-[\w-]+)\s*=\s*("[^"]*"|'[^']*')/gi,
      "",
    )
    .replace(/\s(?:style|class|id)\s*=\s*[^\s>]+/gi, "")
    .replace(/href\s*=\s*(['"])\s*javascript:[^'"]*\1/gi, 'href="#"')
    .replace(/src\s*=\s*(['"])\s*javascript:[^'"]*\1/gi, "");

  return applyInlineBoldMarkers(normalized)
    .replace(
      /<(?!\/?(?:p|br|strong|em|b|i|u|s|del|code|pre|a|ul|ol|li|h2|h3|h4|h5|h6|blockquote|table|thead|tbody|tr|th|td|figure|figcaption|img)\b)[^>]+>/gi,
      "",
    )
    .replace(/<table\b([^>]*)>/gi, '<div class="article-table-wrap"><table$1>')
    .replace(/<\/table>/gi, "</table></div>")
    .trim();
};

const getStoryCategory = (story) =>
  stripMarkup(story?.label || story?.category || "News");

const formatAbsoluteDate = (story) => {
  const date = parseStoryDate(story);
  if (!date) return story?.publishedAt || "Recent update";
  return DATE_FORMATTER.format(date);
};

const formatUpdatedDate = (story) => {
  const updatedDate = parseStoryUpdatedDate(story);
  if (!updatedDate) return "";

  const publishedDate = parseStoryDate(story);
  if (
    publishedDate &&
    Math.abs(updatedDate.getTime() - publishedDate.getTime()) < 60 * 1000
  ) {
    return "";
  }

  return DATE_FORMATTER.format(updatedDate);
};

const formatImageCredit = (story) => {
  const raw = String(
    story?.heroImageCaption || story?.heroImageSource || "",
  ).trim();
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

const buildStoryBreadcrumbs = (story, canonicalUrl) => {
  const items = [
    { label: "Home", to: "/", url: "https://tryhook.shop/" },
    { label: "News", to: "/news", url: "https://tryhook.shop/news" },
  ];
  if (story?.title) items.push({ label: story.title, url: canonicalUrl });

  return items;
};

const createShortBreadcrumbLabel = (label, wordLimit = 3) => {
  const words = stripMarkup(label).split(/\s+/).filter(Boolean);

  if (words.length <= wordLimit) return words.join(" ");
  return `${words.slice(0, wordLimit).join(" ")}...`;
};

const createAnchorId = (value, fallback = "section") => {
  const normalized = stripMarkup(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || fallback;
};

const extractArticleHeadings = (html) => {
  const headings = [];
  const seen = new Map();

  String(html || "").replace(
    /<h([2-4])\b[^>]*>([\s\S]*?)<\/h\1>/gi,
    (full, level, inner) => {
      const text = stripMarkup(inner);
      if (!text) return full;

      const baseId = createAnchorId(text, `section-${headings.length + 1}`);
      const count = seen.get(baseId) || 0;
      const id = count ? `${baseId}-${count + 1}` : baseId;

      seen.set(baseId, count + 1);
      headings.push({ id, text, level: Number(level) });
      return full;
    },
  );

  return headings;
};

const injectHeadingIds = (html, headings = []) => {
  let headingIndex = 0;

  return String(html || "").replace(
    /<h([2-4])\b([^>]*)>/gi,
    (full, level, attrs = "") => {
      const heading = headings[headingIndex];
      headingIndex += 1;

      if (!heading || /\sid\s*=/.test(attrs)) return full;
      return `<h${level}${attrs} id="${heading.id}">`;
    },
  );
};

const splitStructuredArticleHtml = (html, paragraphCount = 2) => {
  if (!html) return { leadHtml: "", restHtml: "" };
  if (typeof DOMParser === "undefined") {
    return { leadHtml: html, restHtml: "" };
  }

  const parsed = new DOMParser().parseFromString(
    `<article data-news-article-root>${html}</article>`,
    "text/html",
  );
  const root = parsed.querySelector("[data-news-article-root]");
  if (!root) return { leadHtml: html, restHtml: "" };

  const nodes = Array.from(root.childNodes).filter(
    (node) => node.nodeType !== 3 || String(node.textContent || "").trim(),
  );
  let topLevelParagraphs = 0;
  let splitAfter = -1;

  nodes.forEach((node, index) => {
    if (splitAfter >= 0 || node.nodeType !== 1) return;
    if (String(node.nodeName || "").toLowerCase() !== "p") return;

    topLevelParagraphs += 1;
    if (topLevelParagraphs >= paragraphCount) splitAfter = index;
  });

  if (splitAfter < 0) return { leadHtml: root.innerHTML, restHtml: "" };

  const serialize = (items) =>
    items
      .map((node) => (node.nodeType === 1 ? node.outerHTML : node.textContent))
      .join("");

  return {
    leadHtml: serialize(nodes.slice(0, splitAfter + 1)),
    restHtml: serialize(nodes.slice(splitAfter + 1)),
  };
};

const ARTICLE_PROSE_CLASS =
  "news-article-prose pt-3 text-[15px] leading-7 text-[#32363d] sm:pt-4 sm:text-[18px] sm:leading-9 [&_p]:mb-5 sm:[&_p]:mb-6 [&_p:last-child]:mb-0 [&_p]:text-[15px] [&_p]:leading-7 sm:[&_p]:text-[18px] sm:[&_p]:leading-9 [&_h2]:scroll-mt-28 [&_h2]:mt-9 [&_h2]:text-[22px] [&_h2]:font-black [&_h2]:leading-[1.16] [&_h2]:text-[#1f2937] sm:[&_h2]:mt-10 sm:[&_h2]:text-[30px] [&_h3]:scroll-mt-28 [&_h3]:mt-7 [&_h3]:text-[19px] [&_h3]:font-bold [&_h3]:leading-[1.24] [&_h3]:text-[#1f2937] sm:[&_h3]:mt-8 sm:[&_h3]:text-[24px] [&_h4]:mt-7 [&_h4]:text-[17px] [&_h4]:font-bold [&_h4]:text-[#1f2937] sm:[&_h4]:text-[18px] [&_ul]:my-5 [&_ul]:list-disc [&_ul]:space-y-2.5 [&_ul]:pl-5 sm:[&_ul]:my-6 sm:[&_ul]:space-y-3 [&_ol]:my-5 [&_ol]:list-decimal [&_ol]:space-y-2.5 [&_ol]:pl-5 sm:[&_ol]:my-6 sm:[&_ol]:space-y-3 [&_li]:pl-1 [&_blockquote]:my-7 [&_blockquote]:border-l-4 [&_blockquote]:border-[#2563eb] [&_blockquote]:bg-[#eff6ff] [&_blockquote]:px-4 [&_blockquote]:py-4 [&_blockquote]:text-[#30343a] sm:[&_blockquote]:my-8 sm:[&_blockquote]:px-5 [&_pre]:my-6 [&_pre]:overflow-x-auto [&_pre]:bg-[#111827] [&_pre]:px-4 [&_pre]:py-4 [&_pre]:text-[13px] [&_pre]:leading-6 [&_pre]:text-[#f8fafc] sm:[&_pre]:text-[14px] [&_code]:font-mono [&_a]:font-medium [&_a]:text-[#2563eb] [&_a]:underline [&_a]:decoration-[#c4b5fd] [&_a]:underline-offset-4 [&_strong]:font-semibold [&_strong]:text-[#171717] [&_figure]:my-6 [&_figure]:overflow-hidden [&_figure]:border [&_figure]:border-[#e5e7eb] [&_figure]:bg-[#fafafa] sm:[&_figure]:my-7 [&_figure_figcaption]:border-t [&_figure_figcaption]:border-[#e5e7eb] [&_figure_figcaption]:px-4 [&_figure_figcaption]:py-3 [&_figure_figcaption]:text-[11px] [&_figure_figcaption]:font-semibold [&_figure_figcaption]:uppercase [&_figure_figcaption]:tracking-[0.12em] [&_figure_figcaption]:text-[#6b7280] [&_figure_img]:w-full [&_img]:my-6 [&_img]:w-full sm:[&_img]:my-7 [&_div.article-table-wrap]:my-6 [&_div.article-table-wrap]:overflow-x-auto [&_div.article-table-wrap]:border [&_div.article-table-wrap]:border-[#e5e7eb] sm:[&_div.article-table-wrap]:my-7 [&_table]:min-w-[560px] [&_table]:w-full [&_table]:border-collapse [&_table]:text-left [&_table]:text-[14px] sm:[&_table]:text-[15px] [&_thead]:bg-[#f6f7fb] [&_th]:border-b [&_th]:border-[#dde3eb] [&_th]:px-4 [&_th]:py-3 [&_th]:font-semibold [&_th]:text-[#202938] [&_td]:border-b [&_td]:border-[#ebedf0] [&_td]:px-4 [&_td]:py-3 [&_td]:align-top [&_td]:text-[#424955] [&_tbody_tr:last-child_td]:border-b-0";

const ARTICLE_PROSE_CONTINUATION_CLASS = ARTICLE_PROSE_CLASS.replace(
  /\b(?:sm:)?pt-\d+\s*/g,
  "",
).trim();

const useStoryImageState = (story) => {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [story?.image, story?.slug]);

  return [imageError, setImageError];
};

const StoryImageFallback = ({ story }) => (
  <div className="flex h-full w-full items-end bg-gradient-to-br from-[#0f172a] via-[#2563eb] to-[#7c3aed] p-5 text-white">
    <div className="max-w-[13rem]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">
        {getStoryCategory(story)}
      </p>
      <h3 className="mt-3 text-sm font-black leading-tight sm:text-base">
        {story?.title || "Hooks editorial"}
      </h3>
    </div>
  </div>
);

const StoryImage = ({ story, className = "", eager = false }) => {
  const [imageError, setImageError] = useStoryImageState(story);
  const hasImage = Boolean(story?.image) && !imageError;

  return (
    <div className={`relative overflow-hidden bg-[#eef2f7] ${className}`}>
      {hasImage ? (
        <img
          src={story.image}
          alt={story?.heroImageAlt || story?.title}
          className="h-full w-full object-cover object-center"
          loading={eager ? "eager" : "lazy"}
          onError={() => setImageError(true)}
        />
      ) : (
        <StoryImageFallback story={story} />
      )}
    </div>
  );
};

const InstagramBrandIcon = ({ className = "" }) => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
    className={className}
  >
    <defs>
      <linearGradient
        id="instagram-share-gradient"
        x1="3"
        y1="21"
        x2="21"
        y2="3"
      >
        <stop offset="0" stopColor="#feda75" />
        <stop offset="0.28" stopColor="#fa7e1e" />
        <stop offset="0.5" stopColor="#d62976" />
        <stop offset="0.74" stopColor="#962fbf" />
        <stop offset="1" stopColor="#4f5bd5" />
      </linearGradient>
    </defs>
    <rect
      x="3.25"
      y="3.25"
      width="17.5"
      height="17.5"
      rx="5.2"
      fill="none"
      stroke="url(#instagram-share-gradient)"
      strokeWidth="2"
    />
    <circle
      cx="12"
      cy="12"
      r="4.1"
      fill="none"
      stroke="url(#instagram-share-gradient)"
      strokeWidth="2"
    />
    <circle cx="17.1" cy="6.9" r="1.25" fill="url(#instagram-share-gradient)" />
  </svg>
);

const ArticleShareLinks = ({ title, description, url }) => {
  const [copied, setCopied] = useState(false);
  const fallbackUrl = typeof window !== "undefined" ? window.location.href : "";
  const currentUrl = url || fallbackUrl;
  const shareTitle = stripMarkup(title || "Hooks");
  const shareDescription = stripMarkup(description || "");
  const shareText = [shareTitle, shareDescription].filter(Boolean).join("\n\n");
  const encodedUrl = encodeURIComponent(currentUrl || "");
  const encodedText = encodeURIComponent(shareText || shareTitle || "");
  const encodedQuote = encodeURIComponent(shareDescription || shareTitle || "");

  const copyLink = async () => {
    if (!currentUrl || typeof navigator === "undefined") return;

    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard access can be unavailable in older browsers or insecure origins.
    }
  };

  const shareOnInstagram = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: shareTitle || "Hooks",
          text: shareText || shareTitle || "Hooks",
          url: currentUrl,
        });
        return;
      }
    } catch {
      // If native share is cancelled or unavailable, fall back to opening Instagram.
    }

    await copyLink();
    if (typeof window !== "undefined") {
      window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
    }
  };

  const shareLinks = [
    {
      name: "Facebook",
      icon: FaFacebookF,
      className: "text-[#1877f2]",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedQuote}`,
    },
    {
      name: "X",
      icon: FaXTwitter,
      className: "text-[#111827]",
      url: `https://x.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    },
    {
      name: "WhatsApp",
      icon: FaWhatsapp,
      className: "text-[#25d366]",
      url: `https://wa.me/?text=${encodedText}%0A%0A${encodedUrl}`,
    },
    {
      name: "Instagram",
      icon: InstagramBrandIcon,
      className: "text-[#d62976]",
      onClick: shareOnInstagram,
    },
  ];

  return (
    <div
      className="mt-4 flex flex-wrap items-center gap-2 sm:mt-5"
      aria-label="Share this article"
    >
      {shareLinks.map((item) => {
        const Icon = item.icon;
        const className = `inline-flex h-8 w-8 items-center justify-center rounded-[4px] bg-[#f5f7fb] transition-opacity hover:opacity-75 ${item.className}`;

        if (item.onClick) {
          return (
            <button
              key={item.name}
              type="button"
              onClick={item.onClick}
              aria-label={`Share on ${item.name}`}
              className={className}
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          );
        }

        return (
          <a
            key={item.name}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Share on ${item.name}`}
            className={className}
          >
            <Icon className="h-3.5 w-3.5" />
          </a>
        );
      })}

      <button
        type="button"
        onClick={copyLink}
        aria-label="Copy article link"
        className="inline-flex h-8 w-8 items-center justify-center rounded-[4px] bg-[#f5f7fb] text-[#475569] transition-opacity hover:opacity-75"
      >
        <FaLink className="h-3.5 w-3.5" />
      </button>

      {copied ? (
        <span className="text-xs font-medium text-[#667689]">Link copied</span>
      ) : null}
    </div>
  );
};

const SectionTitle = ({
  eyebrow,
  title,
  subtitle = "",
  hideSubtitleOnMobile = false,
}) => (
  <div className="border-b border-[#e5e7eb] pb-3 sm:pb-4">
    {eyebrow ? (
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#7c3aed]">
        {eyebrow}
      </p>
    ) : null}
    <h2 className="mt-2 text-[22px] font-black tracking-[-0.02em] text-[#222222] sm:text-[30px]">
      {title}
    </h2>
    {subtitle ? (
      <p
        className={`mt-3 max-w-3xl text-sm leading-7 text-[#5f6670] sm:text-[15px] ${hideSubtitleOnMobile ? "hidden sm:block" : ""}`}
      >
        {subtitle}
      </p>
    ) : null}
  </div>
);

const TrendingStoryCard = ({ story }) => (
  <Link
    to={createNewsStoryPath(story.slug)}
    className="group flex items-start gap-3 py-3 first:pt-0 last:pb-0"
  >
    <StoryImage
      story={story}
      className="h-16 w-16 shrink-0 rounded-md"
    />

    <div className="min-w-0">
      <h3 className="line-clamp-2 text-[13px] font-semibold leading-5 text-[#20242b] transition-colors group-hover:text-[#2563eb]">
        {story.title}
      </h3>
      <p className="mt-1 text-[11px] text-[#7d8898]">
        {story.brandName || getStoryCategory(story)} |{" "}
        {formatAbsoluteDate(story)}
      </p>
    </div>
  </Link>
);

const SidebarStoryCard = ({ story }) => (
  <Link
    to={createNewsStoryPath(story.slug)}
    className="group flex items-start gap-3 py-3 first:pt-0 last:pb-0"
  >
    <StoryImage
      story={story}
      className="h-16 w-16 shrink-0 rounded-md"
    />

    <div className="min-w-0">
      <h3 className="line-clamp-2 text-[13px] font-semibold leading-5 text-[#20242b] transition-colors group-hover:text-[#2563eb]">
        {story.title}
      </h3>
      <p className="mt-1 text-[11px] text-[#7d8898]">
        {story.brandName || getStoryCategory(story)} |{" "}
        {formatAbsoluteDate(story)}
      </p>
    </div>
  </Link>
);

const RelatedStoryRow = ({ story, index }) => (
  <li className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3 border-b border-[#e6ebf2] py-5 first:pt-0 last:border-b-0 last:pb-0 sm:grid-cols-[3rem_minmax(0,1fr)] sm:gap-4">
    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#ede9fe] text-[16px] font-black leading-none tracking-[-0.04em] text-[#7c3aed] tabular-nums sm:h-11 sm:w-11 sm:text-[17px]">
      {String(index + 1).padStart(2, "0")}
    </span>

    <Link to={createNewsStoryPath(story.slug)} className="group block">
      <h3 className="text-[15px] font-semibold leading-[1.45] text-[#18212f] transition-colors group-hover:text-[#2563eb] sm:text-[18px]">
        {story.title}
      </h3>
      <p className="mt-3 hidden text-[11px] uppercase tracking-[0.18em] text-[#7d8898] sm:block">
        {getStoryCategory(story)} | {formatAbsoluteDate(story)}
      </p>
    </Link>
  </li>
);

const RailPanel = ({ title, items = [], linkable = false }) => {
  if (!items.length) return null;

  return (
    <section className="border-t-2 border-[#d8dbe1] pt-3">
      <h2 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#5f6670]">
        {title}
      </h2>

      <div className="mt-3 border-y border-[#e5e7eb]">
        {items.map((item, index) => {
          const label = typeof item === "string" ? item : item?.text || "";
          const href =
            linkable && typeof item === "object" && item?.id
              ? `#${item.id}`
              : "";

          if (!label) return null;

          const classes = `flex items-start gap-3 py-3 text-[13px] leading-6 text-[#343a40] sm:text-[14px] ${
            index !== items.length - 1 ? "border-b border-[#eceff3]" : ""
          }`;

          const marker = href ? (
            <span className="pt-[2px] text-[15px] text-[#9aa0a6]">
              &rsaquo;
            </span>
          ) : (
            <span className="mt-[9px] h-[5px] w-[5px] rounded-full bg-[#7c3aed]" />
          );

          if (!href) {
            return (
              <div key={`${title}-${label}-${index}`} className={classes}>
                {marker}
                <span className="min-w-0 flex-1">{label}</span>
              </div>
            );
          }

          return (
            <a
              key={`${title}-${label}-${index}`}
              href={href}
              className={`${classes} transition-colors hover:text-[#2563eb]`}
            >
              {marker}
              <span className="min-w-0 flex-1">{label}</span>
            </a>
          );
        })}
      </div>
    </section>
  );
};

const SidebarSection = ({ title, children }) => (
  <section className="overflow-hidden bg-white">
    <div className="bg-gradient-to-r from-[#2563eb] to-[#7c3aed] px-4 py-2 text-[12px] font-black uppercase tracking-[0.12em] text-white">
      {title}
    </div>
    <div className="p-3">{children}</div>
  </section>
);

const RelatedStoryTile = ({ story }) => (
  <Link
    to={createNewsStoryPath(story.slug)}
    className="group overflow-hidden border border-[#e5e7eb] bg-white"
  >
    <StoryImage story={story} className="aspect-[4/3] w-full" />

    <div className="bg-gradient-to-r from-[#1e293b] to-[#312e81] px-3 py-3">
      <h3 className="line-clamp-3 text-[15px] font-semibold leading-5 text-white transition-colors group-hover:text-[#ddd6fe]">
        {story.title}
      </h3>
      <p className="mt-2 text-[11px] text-white/70">
        {formatAbsoluteDate(story)}
      </p>
    </div>
  </Link>
);

const LinkListPanel = ({ title, subtitle, items }) => (
  <SidebarSection title={title}>
    {subtitle ? (
      <p className="pb-3 text-[12px] leading-5 text-[#667689]">{subtitle}</p>
    ) : null}

    <div className="divide-y divide-[#eceff3]">
      {items.map((item) => (
        <Link
          key={item}
          to="/smartphones"
          className="flex items-center justify-between gap-3 py-3 text-[13px] font-semibold leading-5 text-[#20242b] transition-colors first:pt-0 last:pb-0 hover:text-[#2563eb]"
        >
          <span>{item}</span>
          <FaArrowRight className="h-3 w-3 shrink-0 text-[#9aa0a6]" />
        </Link>
      ))}
    </div>
  </SidebarSection>
);

const LoadingState = () => (
  <main className="min-h-screen bg-[#f5f7fb] text-slate-900">
    <section className="border-b border-[#e6ebf2] bg-white">
      <div className="mx-auto max-w-[1200px] px-4 pb-10 pt-6 sm:px-6 sm:pb-12 sm:pt-8 lg:px-8">
        <div className="h-4 w-36 animate-pulse rounded-full bg-slate-200" />
        <div className="mt-5 h-16 max-w-5xl animate-pulse rounded-[22px] bg-slate-200" />
        <div className="mt-4 h-6 max-w-4xl animate-pulse rounded-full bg-slate-100" />
        <div className="mt-6 h-12 w-full max-w-3xl animate-pulse rounded-[18px] bg-slate-100" />
        <div className="mt-8 h-[320px] animate-pulse rounded-[28px] border border-slate-200 bg-slate-200 sm:h-[420px]" />
      </div>
    </section>

    <section className="bg-[#f5f7fb]">
      <div className="mx-auto max-w-[1280px] px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <div className="h-[420px] animate-pulse rounded-[28px] border border-slate-200 bg-white" />
            <div className="h-[280px] animate-pulse rounded-[28px] border border-slate-200 bg-white" />
            <div className="h-[320px] animate-pulse rounded-[28px] border border-slate-200 bg-white" />
          </div>
          <div className="space-y-5">
            <div className="h-[420px] animate-pulse rounded-[24px] border border-slate-200 bg-white" />
            <div className="h-[280px] animate-pulse rounded-[24px] border border-slate-200 bg-white" />
          </div>
        </div>
      </div>
    </section>
  </main>
);

const ErrorState = ({ message = "" }) => (
  <main className="min-h-screen bg-[#f6f8fc] text-slate-900">
    <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-lg bg-[#fff5f5] p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-rose-700">
          Hooks News
        </p>
        <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-rose-900">
          We could not load the story
        </h2>
        <p className="mt-4 max-w-2xl text-[15px] leading-7 text-rose-700">
          {message || "The article is unavailable right now."}
        </p>
        <Link
          to="/news"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-rose-700 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-rose-800"
        >
          Back to stories
          <FaArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  </main>
);

const NewsStoryArticlePage = () => {
  const { slug = "" } = useParams();
  const { story, loading, error, notFound } = usePublicNewsStory(slug);
  const { stories: feedStories = [] } = usePublicNewsFeed({ limit: 18 });
  const [relatedPage, setRelatedPage] = useState(0);
  const [isRelatedMobileLayout, setIsRelatedMobileLayout] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(RELATED_STORIES_MOBILE_QUERY).matches;
  });

  const canonicalUrl = `https://tryhook.shop${createNewsStoryPath(slug)}`;

  const feedStoriesOrdered = useMemo(
    () =>
      [...feedStories].sort((a, b) => {
        const left = parseStoryDate(a)?.getTime() || 0;
        const right = parseStoryDate(b)?.getTime() || 0;
        return right - left;
      }),
    [feedStories],
  );

  const articleParagraphs = useMemo(() => {
    const body = Array.isArray(story?.body)
      ? story.body.map(stripMarkup).filter(Boolean)
      : [];

    if (body.length) return body;

    const summary = stripMarkup(story?.summary);
    return summary ? [summary] : [];
  }, [story?.body, story?.summary]);

  const articleDescription =
    stripMarkup(story?.summary) ||
    articleParagraphs[0] ||
    "Hooks editorial coverage.";
  const articleHtml = useMemo(
    () => sanitizeArticleHtml(story?.contentHtml || ""),
    [story?.contentHtml],
  );
  const hasStructuredArticle = useMemo(
    () => hasStructuredArticleMarkup(story?.contentHtml || ""),
    [story?.contentHtml],
  );

  const storyTags = (() => {
    const candidates = [
      ...(Array.isArray(story?.tags) ? story.tags : []),
      story?.label,
      story?.brandName,
      story?.productName,
    ]
      .map((value) => stripMarkup(value))
      .filter(Boolean);

    const seen = new Set();
    return candidates
      .filter((value) => {
        const key = normalizeTagKey(value);
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 4);
  })();

  const storyAuthor =
    String(story?.author || "Hooks editorial").trim() || "Hooks editorial";
  const imageCredit = formatImageCredit(story);
  const updatedDateLabel = formatUpdatedDate(story);
  const articleHeadings = useMemo(
    () => extractArticleHeadings(articleHtml),
    [articleHtml],
  );
  const articleHtmlWithAnchors = useMemo(
    () => injectHeadingIds(articleHtml, articleHeadings),
    [articleHtml, articleHeadings],
  );
  const { leadHtml: structuredLeadHtml, restHtml: structuredRestHtml } =
    useMemo(
      () => splitStructuredArticleHtml(articleHtmlWithAnchors, 2),
      [articleHtmlWithAnchors],
    );
  const introParagraphs = articleParagraphs.slice(0, 2);
  const remainingParagraphs = articleParagraphs.slice(2);

  const editorialHighlights = useMemo(() => {
    const candidates = [
      ...(Array.isArray(story?.takeaways) ? story.takeaways : []),
      ...(Array.isArray(story?.highlights) ? story.highlights : []),
      articleDescription,
    ]
      .map((value) => stripMarkup(value))
      .filter(Boolean);

    const seen = new Set();
    return candidates
      .filter((value) => {
        const key = normalizeTagKey(value);
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 3);
  }, [articleDescription, story?.highlights, story?.takeaways]);

  const jumpRailItems = useMemo(() => {
    if (articleHeadings.length) return articleHeadings.slice(0, 5);
    return editorialHighlights.map((text) => ({ text }));
  }, [articleHeadings, editorialHighlights]);

  const trendingStories = useMemo(() => {
    const pool = feedStoriesOrdered.filter((item) => item.slug !== story?.slug);

    return [...pool]
      .sort((left, right) => {
        const leftScore = left?.highlights?.length || 0;
        const rightScore = right?.highlights?.length || 0;
        if (rightScore !== leftScore) return rightScore - leftScore;
        const leftDate = parseStoryDate(left)?.getTime() || 0;
        const rightDate = parseStoryDate(right)?.getTime() || 0;
        return rightDate - leftDate;
      })
      .slice(0, 4);
  }, [feedStoriesOrdered, story?.slug]);

  const relatedStories = useMemo(
    () => buildRelatedNewsStories(feedStoriesOrdered, story, 12),
    [feedStoriesOrdered, story],
  );

  useEffect(() => {
    setRelatedPage(0);
  }, [story?.slug]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const mediaQuery = window.matchMedia(RELATED_STORIES_MOBILE_QUERY);
    const syncRelatedLayout = () =>
      setIsRelatedMobileLayout(mediaQuery.matches);

    syncRelatedLayout();
    mediaQuery.addEventListener("change", syncRelatedLayout);

    return () => {
      mediaQuery.removeEventListener("change", syncRelatedLayout);
    };
  }, []);

  const moreStories = useMemo(() => {
    const excluded = new Set(trendingStories.map((item) => item.slug));
    excluded.add(story?.slug);

    return feedStoriesOrdered
      .filter((item) => !excluded.has(item.slug))
      .slice(0, 3);
  }, [feedStoriesOrdered, story?.slug, trendingStories]);
  const relatedStoriesPerPage = isRelatedMobileLayout
    ? MOBILE_RELATED_STORIES_PER_PAGE
    : DESKTOP_RELATED_STORIES_PER_PAGE;
  const relatedPageCount = Math.max(
    1,
    Math.ceil(relatedStories.length / relatedStoriesPerPage),
  );
  const currentRelatedPage = Math.min(relatedPage, relatedPageCount - 1);
  const paginatedRelatedStories = useMemo(
    () =>
      relatedStories.slice(
        currentRelatedPage * relatedStoriesPerPage,
        currentRelatedPage * relatedStoriesPerPage + relatedStoriesPerPage,
      ),
    [currentRelatedPage, relatedStories, relatedStoriesPerPage],
  );
  const articleKeywords = useMemo(() => {
    const candidates = [
      story?.productName,
      story?.brandName,
      story?.label,
      ...storyTags,
    ]
      .map((value) => stripMarkup(value))
      .filter(Boolean);

    const seen = new Set();
    return candidates
      .filter((value) => {
        const key = normalizeTagKey(value);
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 6);
  }, [story?.brandName, story?.label, story?.productName, storyTags]);

  const storyBreadcrumbs = useMemo(
    () => buildStoryBreadcrumbs(story, canonicalUrl),
    [story, canonicalUrl],
  );

  const schema = story
    ? [
        createBreadcrumbSchema(
          storyBreadcrumbs.map(({ label, url }) => ({ label, url })),
        ),
        createNewsArticleSchema({
          headline: story.title,
          description: articleDescription,
          url: canonicalUrl,
          image: story.image,
          datePublished: story.publishedIso,
          dateModified: story.updatedIso,
          authorName: storyAuthor,
          articleSection: story.label,
          keywords: [story.label, story.category, ...storyTags].filter(Boolean),
        }),
      ]
    : [];

  if (loading) return <LoadingState />;
  if (notFound) return <NotFound />;
  if (!story) return <ErrorState message={error} />;

  return (
    <>
      <SEO
        title={`${story.title} - Hooks`}
        description={articleDescription}
        url={canonicalUrl}
        robots="index, follow"
        ogType="article"
        image={story.image}
        schema={schema}
      />
      <NewsPushOptInCard />

      <main className="min-h-screen bg-white text-[#111111]">
        <section className="bg-white">
          <div className="mx-auto max-w-[1280px] px-4 pb-1 pt-2 sm:px-6 sm:pt-2 lg:px-8">
            <nav
              aria-label="Breadcrumb"
              className="line-clamp-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] leading-5 text-[#7b8796] sm:text-[12px]"
            >
              {storyBreadcrumbs.map((item, index) => {
                const isLast = index === storyBreadcrumbs.length - 1;

                return (
                  <React.Fragment key={`${item.label}-${index}`}>
                    {item.to && !isLast ? (
                      <Link
                        to={item.to}
                        className="transition-colors hover:text-[#1d4ed8]"
                      >
                        {item.label}
                      </Link>
                    ) : (
                      <span
                        title={isLast ? item.label : undefined}
                        className={
                          isLast
                            ? "font-semibold text-[#1f2937]"
                            : "text-[#7b8796]"
                        }
                      >
                        {isLast
                          ? createShortBreadcrumbLabel(item.label)
                          : item.label}
                      </span>
                    )}
                    {!isLast ? (
                      <FaChevronRight
                        aria-hidden="true"
                        className="h-2.5 w-2.5 text-[#b6c2cf]"
                      />
                    ) : null}
                  </React.Fragment>
                );
              })}
            </nav>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-[1280px] px-4 pb-3 pt-1 sm:px-6 sm:pb-4 sm:pt-2 lg:px-8 lg:pb-3">
            <div className="max-w-[1120px]">
              <h1 className="news-article-headline text-[21px] leading-[1.18] text-[#20242b] sm:text-[28px] sm:leading-[1.14] lg:text-[32px] xl:text-[36px]">
                {story.title}
              </h1>
              <p className="news-article-deck mt-2 max-w-[72ch] text-[15px] leading-6 text-[#5f6670] sm:mt-3 sm:text-[19px] sm:leading-8">
                {articleDescription}
              </p>
              <ArticleShareLinks
                title={story.title}
                description={articleDescription}
                url={canonicalUrl}
              />
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-[1280px] px-4 pb-4 pt-2 sm:px-6 sm:pb-8 sm:pt-3 lg:px-8 lg:pb-10 lg:pt-0">
            <div className="grid gap-5 sm:gap-8 xl:grid-cols-[160px_minmax(0,1fr)_300px] xl:items-start xl:gap-10">
              <aside className="hidden xl:block xl:self-start">
                <div className="sticky top-6 max-h-[calc(100vh-3rem)] space-y-8 overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <RailPanel title="Highlights" items={editorialHighlights} />
                  <RailPanel
                    title="Jump To"
                    items={jumpRailItems}
                    linkable={articleHeadings.length > 0}
                  />
                </div>
              </aside>

              <div className="min-w-0">
                <div>
                  <StoryImage
                    story={story}
                    eager
                    className="aspect-[16/10] w-full rounded-sm border border-[#e5e7eb] sm:aspect-[16/9]"
                  />
                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-[#e5eaf0] pb-4 text-[10px] font-semibold uppercase tracking-[0.13em] text-[#64748b] sm:gap-x-4 sm:text-[11px] sm:tracking-[0.14em]">
                    <span className="inline-flex rounded-full bg-[#f1f5f9] px-3 py-1.5 text-[#334155]">
                      {story.readTime}
                    </span>
                    <span className="inline-flex items-center normal-case tracking-normal text-[#334155]">
                      By {storyAuthor}
                    </span>
                    <span className="inline-flex items-center">
                      Published {formatAbsoluteDate(story)}
                    </span>
                    {updatedDateLabel ? (
                      <span className="inline-flex items-center">
                        Updated {updatedDateLabel}
                      </span>
                    ) : null}
                    {imageCredit ? (
                      <span className="basis-full text-[#7d8898] sm:ml-auto sm:basis-auto">
                        Photo: {imageCredit}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="mt-5 hidden gap-5 sm:mt-6 sm:grid xl:hidden">
                  <RailPanel title="Highlights" items={editorialHighlights} />
                  <RailPanel
                    title="Jump To"
                    items={jumpRailItems}
                    linkable={articleHeadings.length > 0}
                  />
                </div>

                <article>
                  {hasStructuredArticle && articleHtmlWithAnchors ? (
                    <>
                      {structuredLeadHtml ? (
                        <div
                          className={ARTICLE_PROSE_CLASS}
                          dangerouslySetInnerHTML={{
                            __html: structuredLeadHtml,
                          }}
                        />
                      ) : null}

                      {structuredRestHtml ? (
                        <div
                          className={ARTICLE_PROSE_CONTINUATION_CLASS}
                          dangerouslySetInnerHTML={{
                            __html: structuredRestHtml,
                          }}
                        />
                      ) : null}
                    </>
                  ) : (
                    <>
                      <div className="news-article-prose space-y-5 pt-3 text-[15px] leading-7 text-[#32363d] sm:space-y-7 sm:pt-4 sm:text-[18px] sm:leading-9">
                        {introParagraphs.map((paragraph, index) => (
                          <p key={`${story.slug}-intro-${index + 1}`}>
                            {paragraph}
                          </p>
                        ))}
                      </div>

                      {remainingParagraphs.length ? (
                        <div className="news-article-prose space-y-5 text-[15px] leading-7 text-[#32363d] sm:space-y-7 sm:text-[18px] sm:leading-9">
                          {remainingParagraphs.map((paragraph, index) => (
                            <p key={`${story.slug}-rest-${index + 1}`}>
                              {paragraph}
                            </p>
                          ))}
                        </div>
                      ) : null}
                    </>
                  )}

                  {articleKeywords.length ? (
                    <div className="mt-7 border-t border-[#eceff3] pt-4 text-[13px] leading-6 text-[#6b7280] sm:mt-10 sm:pt-5">
                      <span className="font-semibold text-[#202226]">
                        Further reading:
                      </span>{" "}
                      {articleKeywords.join(", ")}
                    </div>
                  ) : null}
                </article>

                {relatedStories.length ? (
                  <section className="mt-8 sm:mt-12">
                    <SectionTitle eyebrow="Related" title="Related News" />

                    <div className="mt-4 grid grid-cols-2 gap-3 sm:mt-6 sm:grid-cols-4 sm:gap-4">
                      {paginatedRelatedStories.map((item) => (
                        <RelatedStoryTile key={item.slug} story={item} />
                      ))}
                    </div>

                    {relatedPageCount > 1 ? (
                      <div className="mt-4 flex justify-center border-t border-[#eceff3] pt-4 sm:mt-5">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              setRelatedPage((page) => Math.max(0, page - 1))
                            }
                            disabled={currentRelatedPage === 0}
                            aria-label="Show previous related stories"
                            className="inline-flex h-8 w-8 items-center justify-center bg-transparent text-[#334155] transition-opacity hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <FaChevronLeft className="h-3.5 w-3.5" />
                          </button>

                          <div className="flex items-center gap-2">
                            {Array.from({ length: relatedPageCount }).map(
                              (_, index) => {
                                const isActive = index === currentRelatedPage;
                                return (
                                  <button
                                    key={`related-page-${index + 1}`}
                                    type="button"
                                    onClick={() => setRelatedPage(index)}
                                    aria-label={`Show related stories page ${index + 1}`}
                                    aria-current={isActive ? "page" : undefined}
                                    className={`h-2 rounded-full transition-all ${
                                      isActive
                                        ? "w-10 bg-[#334155]"
                                        : "w-2.5 bg-[#cbd5e1] hover:bg-[#94a3b8]"
                                    }`}
                                  />
                                );
                              },
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              setRelatedPage((page) =>
                                Math.min(relatedPageCount - 1, page + 1),
                              )
                            }
                            disabled={
                              currentRelatedPage >= relatedPageCount - 1
                            }
                            aria-label="Show next related stories"
                            className="inline-flex h-8 w-8 items-center justify-center bg-transparent text-[#334155] transition-opacity hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <FaChevronRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </section>
                ) : null}

              </div>

              <aside className="space-y-5 xl:sticky xl:top-6 xl:max-h-[calc(100vh-3rem)] xl:self-start xl:overflow-y-auto xl:pr-1 xl:[scrollbar-width:none] xl:[&::-webkit-scrollbar]:hidden">
                <SidebarSection title="Trending News">
                  <div className="divide-y divide-[#eceff3]">
                    {trendingStories.map((item) => (
                      <TrendingStoryCard key={item.slug} story={item} />
                    ))}
                  </div>
                </SidebarSection>

                {moreStories.length ? (
                  <SidebarSection title="Latest Reads">
                    <div className="divide-y divide-[#eceff3]">
                      {moreStories.map((item) => (
                        <SidebarStoryCard key={item.slug} story={item} />
                      ))}
                    </div>
                  </SidebarSection>
                ) : null}

                <LinkListPanel
                  title="Popular Mobile List"
                  subtitle="High-intent buying links readers often explore after launch and specs coverage."
                  items={POPULAR_MOBILE_LIST}
                />
              </aside>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default NewsStoryArticlePage;
