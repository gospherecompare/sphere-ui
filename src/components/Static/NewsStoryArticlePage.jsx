import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  FaArrowRight,
  FaChevronLeft,
  FaChevronRight,
  FaFacebookF,
  FaLink,
  FaUser,
  FaWhatsapp,
} from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

import SEO from "../SEO";
import NotFound from "./NotFound";
import AiSummary from "../News/AiSummary";

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

import GoogleSwgBasic from "../News/GoogleSwgBasic";
import GooglePreferredSourceButton from "../News/GooglePreferredSourceButton";
import MobileXLogo from "../ui/MoblieX";

import "./news-article.css";

import { buildNewsArticleSeo } from "../../utils/newsSeo";

const SITE_ORIGIN = "https://mobilex.in";

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const POPULAR_MOBILE_LIST = [
  {
    label: "Best Phones Under ₹30,000",
    href: "/smartphones/filter/under-30000",
  },
  {
    label: "Best Phones Under ₹20,000",
    href: "/smartphones/filter/under-20000",
  },
  {
    label: "Best Phones Under ₹15,000",
    href: "/smartphones/filter/under-15000",
  },
  {
    label: "Samsung Galaxy S Series",
    href: "/smartphones/samsung",
  },
  {
    label: "Best 6000mAh Battery Phones",
    href: "/smartphones",
  },
  {
    label: "Best Fast Charging Phones",
    href: "/smartphones",
  },
];

const MOBILE_RELATED_STORIES_PER_PAGE = 2;
const DESKTOP_RELATED_STORIES_PER_PAGE = 4;
const RELATED_STORIES_MOBILE_QUERY = "(max-width: 639px)";

const ArticleAuthorAvatar = ({ story, className = "" }) => {
  const [authorImageFailed, setAuthorImageFailed] = useState(false);

  useEffect(() => {
    setAuthorImageFailed(false);
  }, [story?.authorImage, story?.slug]);

  const useHooksLogo = !story?.authorImage || authorImageFailed;

  return (
    <span
      className={[
        "hooks-article-author-avatar",
        useHooksLogo ? "is-hooks-logo" : "is-author-photo",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-hidden="true"
    >
      {useHooksLogo ? (
        <FaUser
          className="hooks-article-author-avatar__user"
          aria-hidden="true"
        />
      ) : (
        <img
          src={story.authorImage}
          alt=""
          loading="lazy"
          onError={() => setAuthorImageFailed(true)}
          className="hooks-article-author-avatar__photo"
        />
      )}
    </span>
  );
};

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

const clipDescription = (value, maxWords = 34) => {
  const text = stripMarkup(value);

  if (!text) return "";

  const words = text.split(/\s+/).filter(Boolean);

  if (words.length <= maxWords) return text;

  return `${words.slice(0, maxWords).join(" ")}...`;
};

const normalizeTagKey = (value) =>
  stripMarkup(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const dedupeStories = (stories = []) => {
  const seen = new Set();

  return stories.filter((item) => {
    const key = String(item?.slug || normalizeTagKey(item?.title || "")).trim();

    if (!key || seen.has(key)) return false;

    seen.add(key);

    return true;
  });
};

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
  let text = String(value || "")
    .replace(/\r\n?/g, "\n")
    .trim();

  for (
    let pass = 0;
    pass < 3 && text && !containsArticleMarkup(text);
    pass += 1
  ) {
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

const getRelatedStoryMetaLabel = (story) => {
  const brandOrProduct = stripMarkup(story?.brandName || story?.productName);

  if (brandOrProduct) return brandOrProduct;

  const category = stripMarkup(story?.category).toLowerCase();

  if (category === "launches") return "Launches";

  return getStoryCategory(story);
};

const formatAbsoluteDate = (story) => {
  const date = parseStoryDate(story);

  if (!date) return story?.publishedAt || "Recent update";

  return DATE_FORMATTER.format(date);
};

const formatUpdatedDate = (story) => {
  const updatedDate = parseStoryUpdatedDate(story);

  if (!updatedDate) return "";

  const publishedDate = parseStoryDate(story);

  const updatedLabel = DATE_FORMATTER.format(updatedDate);

  const publishedLabel = publishedDate
    ? DATE_FORMATTER.format(publishedDate)
    : "";

  if (publishedLabel && updatedLabel === publishedLabel) {
    return "";
  }

  return updatedLabel;
};

const formatImageCredit = (story) => {
  const raw = [
    story?.imageCredit,
    story?.credit,
    story?.heroImageCredit,
    story?.hero_image_credit,
    story?.photoCredit,
    story?.photo_credit,
    story?.credits,
    story?.heroImageCaption,
    story?.heroImageSource,
  ]
    .map((value) => String(value || "").trim())
    .find(Boolean);

  if (!raw || /^(asset|url|mobilex news)$/i.test(raw)) return "";

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
    {
      label: "Home",
      to: "/",
      url: `${SITE_ORIGIN}/`,
    },
    {
      label: "News",
      to: "/news",
      url: `${SITE_ORIGIN}/news`,
    },
  ];

  if (story?.title) {
    items.push({
      label: story.title,
      url: canonicalUrl,
    });
  }

  return items;
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

      headings.push({
        id,
        text,
        level: Number(level),
      });

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

      if (!heading || /\sid\s*=/.test(attrs)) {
        return full;
      }

      return `<h${level}${attrs} id="${heading.id}">`;
    },
  );
};

const splitStructuredArticleHtml = (html, paragraphCount = 2) => {
  if (!html) {
    return {
      leadHtml: "",
      restHtml: "",
    };
  }

  if (typeof DOMParser === "undefined") {
    return {
      leadHtml: html,
      restHtml: "",
    };
  }

  const parsed = new DOMParser().parseFromString(
    `<article data-news-article-root>${html}</article>`,
    "text/html",
  );

  const root = parsed.querySelector("[data-news-article-root]");

  if (!root) {
    return {
      leadHtml: html,
      restHtml: "",
    };
  }

  const nodes = Array.from(root.childNodes).filter(
    (node) => node.nodeType !== 3 || String(node.textContent || "").trim(),
  );

  let topLevelParagraphs = 0;
  let splitAfter = -1;

  nodes.forEach((node, index) => {
    if (splitAfter >= 0 || node.nodeType !== 1) {
      return;
    }

    if (String(node.nodeName || "").toLowerCase() !== "p") {
      return;
    }

    topLevelParagraphs += 1;

    if (topLevelParagraphs >= paragraphCount) {
      splitAfter = index;
    }
  });

  if (splitAfter < 0) {
    return {
      leadHtml: root.innerHTML,
      restHtml: "",
    };
  }

  const serialize = (items) =>
    items
      .map((node) => (node.nodeType === 1 ? node.outerHTML : node.textContent))
      .join("");

  return {
    leadHtml: serialize(nodes.slice(0, splitAfter + 1)),
    restHtml: serialize(nodes.slice(splitAfter + 1)),
  };
};

const ARTICLE_PROSE_CLASS = "news-article-prose hooks-article-prose";

const ARTICLE_PROSE_CONTINUATION_CLASS =
  "news-article-prose hooks-article-prose hooks-article-prose--continuation";

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
        {story?.title || "MobileX editorial"}
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

  const shareTitle = stripMarkup(title || "MobileX");

  const shareDescription = stripMarkup(description || "");

  const shareText = [shareTitle, shareDescription].filter(Boolean).join("\n\n");

  const encodedUrl = encodeURIComponent(currentUrl || "");

  const encodedText = encodeURIComponent(shareText || shareTitle || "");

  const encodedQuote = encodeURIComponent(shareDescription || shareTitle || "");

  const copyLink = async () => {
    if (!currentUrl || typeof navigator === "undefined") {
      return;
    }

    try {
      await navigator.clipboard.writeText(currentUrl);

      setCopied(true);

      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard access can be unavailable.
    }
  };

  const shareOnInstagram = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: shareTitle || "MobileX",
          text: shareText || shareTitle || "MobileX",
          url: currentUrl,
        });

        return;
      }
    } catch {
      // Native share cancelled or unavailable.
    }

    await copyLink();

    if (typeof window !== "undefined") {
      window.open(
        "https://www.instagram.com/",
        "_blank",
        "noopener,noreferrer",
      );
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
    <div className="hooks-article-share" aria-label="Share this article">
      {shareLinks.map((item) => {
        const Icon = item.icon;

        const className = `hooks-article-share__button ${item.className}`;

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
        className="hooks-article-share__button text-[#475569]"
      >
        <FaLink className="h-3.5 w-3.5" />
      </button>

      {copied ? (
        <span className="hooks-article-share__copied">Link copied</span>
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
  <div className="hooks-article-section-heading">
    <div>
      {eyebrow ? <p>{eyebrow}</p> : null}
      <h2>{title}</h2>
    </div>

    {subtitle ? (
      <span className={hideSubtitleOnMobile ? "hide-on-mobile" : ""}>
        {subtitle}
      </span>
    ) : null}
  </div>
);

const TrendingStoryCard = ({ story, index }) => (
  <Link to={createNewsStoryPath(story.slug)} className="hooks-trending-story">
    <span className="hooks-trending-story__index">
      {String(index + 1).padStart(2, "0")}
    </span>

    <div className="hooks-trending-story__copy">
      <h3>{story.title}</h3>

      <p>
        {story.brandName || getStoryCategory(story)} ·{" "}
        {formatAbsoluteDate(story)}
      </p>
    </div>
  </Link>
);

const SidebarStoryCard = ({ story }) => (
  <Link to={createNewsStoryPath(story.slug)} className="hooks-sidebar-story">
    <StoryImage story={story} className="hooks-sidebar-story__image" />

    <div>
      <p>{story.brandName || getStoryCategory(story)}</p>

      <h3>{story.title}</h3>

      <span>{formatAbsoluteDate(story)}</span>
    </div>
  </Link>
);

const RailPanel = ({ title, items = [], linkable = false }) => {
  if (!items.length) return null;

  return (
    <section className="hooks-article-rail-panel">
      <div className="hooks-article-rail-panel__title">
        <span />
        <h2>{title}</h2>
      </div>

      <div className="hooks-article-rail-panel__items">
        {items.map((item, index) => {
          const label = typeof item === "string" ? item : item?.text || "";

          const href =
            linkable && typeof item === "object" && item?.id
              ? `#${item.id}`
              : "";

          if (!label) return null;

          if (!href) {
            return (
              <div
                key={`${title}-${label}-${index}`}
                className="hooks-article-rail-item"
              >
                <span className="hooks-article-rail-item__dot" />
                <span>{label}</span>
              </div>
            );
          }

          return (
            <a
              key={`${title}-${label}-${index}`}
              href={href}
              className="hooks-article-rail-link"
            >
              <span>{String(index + 1).padStart(2, "0")}</span>

              <strong>{label}</strong>
            </a>
          );
        })}
      </div>
    </section>
  );
};

const SidebarSection = ({ title, children }) => (
  <section className="hooks-article-sidebar-section">
    <div className="hooks-article-sidebar-section__header">
      <span className="hooks-article-sidebar-section__pulse" />
      <h2>{title}</h2>
    </div>

    <div className="hooks-article-sidebar-section__body">{children}</div>
  </section>
);

const RelatedStoryTile = ({ story, featured = false }) => (
  <Link
    to={createNewsStoryPath(story.slug)}
    className={`hooks-related-story${featured ? " is-featured" : ""}`}
  >
    <div className="hooks-related-story__media">
      <StoryImage story={story} className="hooks-related-story__image" />

      <span className="hooks-related-story__category">
        {getRelatedStoryMetaLabel(story)}
      </span>
    </div>

    <div className="hooks-related-story__content">
      <div className="hooks-related-story__meta">
        <span>{formatAbsoluteDate(story)}</span>

        <i aria-hidden="true" />

        <span>{story.readTime || "3 min read"}</span>
      </div>

      <h3>{story.title}</h3>

      {featured ? (
        <p className="hooks-related-story__summary">
          {clipDescription(
            story.summary || story.description || story.excerpt,
            28,
          )}
        </p>
      ) : null}

      <div className="hooks-related-story__footer">
        <strong>Read article</strong>

        <span aria-hidden="true">
          <FaArrowRight />
        </span>
      </div>
    </div>
  </Link>
);

const LoadingState = () => (
  <main className="min-h-screen bg-white text-slate-900">
    <section className="border-b border-[#e6ebf2] bg-white">
      <div className="mx-auto max-w-[1200px] px-4 pb-10 pt-6 sm:px-6 sm:pb-12 sm:pt-8 lg:px-8">
        <div className="h-4 w-36 animate-pulse rounded-full bg-slate-200" />

        <div className="mt-5 h-16 max-w-5xl animate-pulse rounded-[22px] bg-slate-200" />

        <div className="mt-4 h-6 max-w-4xl animate-pulse rounded-full bg-slate-100" />

        <div className="mt-6 h-12 w-full max-w-3xl animate-pulse rounded-[18px] bg-slate-100" />

        <div className="mt-8 h-[320px] animate-pulse rounded-[28px] border border-slate-200 bg-slate-200 sm:h-[420px]" />
      </div>
    </section>

    <section className="bg-white">
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
          MobileX News
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

  const { stories: feedStories = [] } = usePublicNewsFeed({
    limit: 18,
  });

  const [relatedPage, setRelatedPage] = useState(0);

  const [isRelatedMobileLayout, setIsRelatedMobileLayout] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.matchMedia(RELATED_STORIES_MOBILE_QUERY).matches;
  });

  const canonicalUrl = `${SITE_ORIGIN}${createNewsStoryPath(slug)}`;

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

  const articleSeo = useMemo(
    () =>
      buildNewsArticleSeo(story, {
        articleParagraphs,
      }),
    [story, articleParagraphs],
  );

  const articleDescription = articleSeo.description;

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

        if (!key || seen.has(key)) {
          return false;
        }

        seen.add(key);

        return true;
      })
      .slice(0, 4);
  })();

  const storyAuthor =
    String(story?.author || "MobileX editorial").trim() || "MobileX editorial";

  const storyEditor = String(
    story?.editor || story?.editedBy || story?.editorName || "",
  ).trim();

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

        if (!key || seen.has(key)) {
          return false;
        }

        seen.add(key);

        return true;
      })
      .slice(0, 3);
  }, [articleDescription, story?.highlights, story?.takeaways]);

  const trendingStories = useMemo(() => {
    const pool = feedStoriesOrdered.filter((item) => item.slug !== story?.slug);

    return [...pool]
      .sort((left, right) => {
        const leftScore = left?.highlights?.length || 0;

        const rightScore = right?.highlights?.length || 0;

        if (rightScore !== leftScore) {
          return rightScore - leftScore;
        }

        const leftDate = parseStoryDate(left)?.getTime() || 0;

        const rightDate = parseStoryDate(right)?.getTime() || 0;

        return rightDate - leftDate;
      })
      .slice(0, 4);
  }, [feedStoriesOrdered, story?.slug]);

  const relatedStories = useMemo(
    () =>
      dedupeStories(
        buildRelatedNewsStories(feedStoriesOrdered, story, 18),
      ).slice(0, 12),
    [feedStoriesOrdered, story],
  );

  useEffect(() => {
    setRelatedPage(0);
  }, [story?.slug]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

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
      .slice(0, 4);
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

        if (!key || seen.has(key)) {
          return false;
        }

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
          storyBreadcrumbs.map(({ label, url }) => ({
            label,
            url,
          })),
        ),

        createNewsArticleSchema({
          headline: articleSeo.headline,
          description: articleDescription,
          url: canonicalUrl,
          image: story.image,
          imageAlt: story.heroImageAlt || story.title,
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

  if (!story) {
    return <ErrorState message={error} />;
  }

  return (
    <>
      <SEO
        title={articleSeo.title}
        description={articleDescription}
        keywords={articleKeywords.join(", ")}
        url={canonicalUrl}
        robots="index, follow, max-image-preview:large"
        ogType="article"
        image={story.image}
        imageAlt={story.heroImageAlt || story.title}
        schema={schema}
      />

      <GoogleSwgBasic />

      <main className="hooks-article-page">
        <section className="hooks-article-header">
          <div className="hooks-article-shell hooks-article-header__grid">
            <div className="hooks-article-header__headline">
              <h1>{story.title}</h1>

              <p className="hooks-article-deck">{articleDescription}</p>
            </div>

            <div className="hooks-article-lead-grid">
              <div className="hooks-article-lead-main">
                <div className="hooks-article-header__meta">
                  <div className="hooks-article-byline-row">
                    <ArticleAuthorAvatar story={story} />

                    <div className="hooks-article-byline-copy">
                      <p>
                        Written by <strong>{storyAuthor}</strong>
                        {storyEditor ? (
                          <>
                            <span className="hooks-article-byline-separator">
                              •
                            </span>
                            Edited by <strong>{storyEditor}</strong>
                          </>
                        ) : null}
                      </p>

                      <span>
                        Updated: {updatedDateLabel || formatAbsoluteDate(story)}
                        <span className="hooks-article-byline-separator">
                          •
                        </span>
                        {story.readTime || "3 min read"}
                      </span>
                    </div>
                  </div>

                  <ArticleShareLinks
                    title={story.title}
                    description={articleDescription}
                    url={canonicalUrl}
                  />
                </div>

                <figure className="hooks-article-hero-media">
                  <StoryImage
                    story={story}
                    eager
                    className="hooks-article-hero-media__image"
                  />

                  <figcaption>
                    <span>{story.heroImageAlt || story.title}</span>

                    {imageCredit ? <p>Photo Credit: {imageCredit}</p> : null}
                  </figcaption>
                </figure>
              </div>

              <aside className="hooks-article-lead-rail">
                <div className="hooks-article-source-card">
                  <div className="hooks-article-source-card__brand">
                    <MobileXLogo
                      className="hooks-article-source-card__logo"
                      aria-label="MobileX"
                      darkBackground={false}
                    />

                    <div>
                      <strong>MobileX News</strong>

                      <span>Research smarter</span>
                    </div>
                  </div>

                  <p>
                    Add MobileX as a preferred source to see our technology
                    reporting more often.
                  </p>

                  <GooglePreferredSourceButton variant="article" />
                </div>

                <div className="hooks-article-media-side">
                  <SidebarSection title="Trending Now">
                    <div className="hooks-trending-list">
                      {trendingStories.slice(0, 3).map((item, index) => (
                        <TrendingStoryCard
                          key={item.slug}
                          story={item}
                          index={index}
                        />
                      ))}
                    </div>
                  </SidebarSection>
                </div>
              </aside>
            </div>
          </div>
        </section>

        <section className="hooks-article-content-section">
          <div className="hooks-article-shell hooks-article-body-grid">
            <aside
              className="hooks-article-share-rail"
              aria-label="Article actions"
            >
              <div className="hooks-article-share-rail__sticky">
                <span>Share</span>

                <ArticleShareLinks
                  title={story.title}
                  description={articleDescription}
                  url={canonicalUrl}
                />
              </div>
            </aside>

            <div className="hooks-article-main-column">
              <article className="hooks-article-content-card">
                {editorialHighlights.length ? (
                  <section className="hooks-article-highlights">
                    <div className="hooks-article-highlights__title">
                      <span>Highlights</span>
                    </div>

                    <ul>
                      {editorialHighlights
                        .slice(0, 3)
                        .map((highlight, index) => (
                          <li key={`${story.slug}-highlight-${index + 1}`}>
                            {highlight}
                          </li>
                        ))}
                    </ul>
                  </section>
                ) : null}

                {story.aiSummary ? (
                  <AiSummary summary={story.aiSummary} />
                ) : null}

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

                    {relatedStories.length ? (
                      <section className="hooks-article-also-read">
                        <span>Also read</span>

                        <div>
                          {relatedStories.slice(0, 3).map((item) => (
                            <Link
                              key={item.slug}
                              to={createNewsStoryPath(item.slug)}
                            >
                              {item.title}

                              <FaArrowRight />
                            </Link>
                          ))}
                        </div>
                      </section>
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
                    <div className={ARTICLE_PROSE_CLASS}>
                      {introParagraphs.map((paragraph, index) => (
                        <p key={`${story.slug}-intro-${index + 1}`}>
                          {paragraph}
                        </p>
                      ))}
                    </div>

                    {relatedStories.length ? (
                      <section className="hooks-article-also-read">
                        <span>Also read</span>

                        <div>
                          {relatedStories.slice(0, 3).map((item) => (
                            <Link
                              key={item.slug}
                              to={createNewsStoryPath(item.slug)}
                            >
                              {item.title}

                              <FaArrowRight />
                            </Link>
                          ))}
                        </div>
                      </section>
                    ) : null}

                    {remainingParagraphs.length ? (
                      <div className={ARTICLE_PROSE_CONTINUATION_CLASS}>
                        {remainingParagraphs.map((paragraph, index) => (
                          <p key={`${story.slug}-rest-${index + 1}`}>
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    ) : null}
                  </>
                )}

                {storyTags.length ? (
                  <footer className="hooks-article-topic-footer">
                    <div>
                      <span>Further reading</span>

                      {storyTags.map((tag) => (
                        <strong key={tag}>{tag}</strong>
                      ))}
                    </div>
                  </footer>
                ) : null}

                <section className="hooks-article-author-card">
                  <ArticleAuthorAvatar
                    story={story}
                    className="hooks-article-author-card__avatar"
                  />

                  <div>
                    <span>About the author</span>

                    <h2>{storyAuthor}</h2>

                    <p>
                      {story?.authorBio ||
                        "Technology reporting and buying intelligence from MobileX news."}
                    </p>
                  </div>
                </section>
              </article>

              {relatedStories.length ? (
                <section className="hooks-related-section">
                  <div className="hooks-related-section__topline">
                    <SectionTitle
                      eyebrow="Continue reading"
                      title="Related News"
                      subtitle="Fresh reporting selected for this story."
                      hideSubtitleOnMobile
                    />

                    <Link
                      to="/news"
                      className="hooks-related-section__all-link"
                    >
                      View all news <FaArrowRight />
                    </Link>
                  </div>

                  <div className="hooks-related-grid">
                    {paginatedRelatedStories.map((item, index) => (
                      <RelatedStoryTile
                        key={item.slug}
                        story={item}
                        featured={index === 0}
                      />
                    ))}
                  </div>

                  {relatedPageCount > 1 ? (
                    <div className="hooks-related-pagination">
                      <button
                        type="button"
                        onClick={() =>
                          setRelatedPage((page) => Math.max(0, page - 1))
                        }
                        disabled={currentRelatedPage === 0}
                        aria-label="Show previous related stories"
                      >
                        <FaChevronLeft />
                      </button>

                      <div>
                        {Array.from({
                          length: relatedPageCount,
                        }).map((_, index) => {
                          const isActive = index === currentRelatedPage;

                          return (
                            <button
                              key={`related-page-${index + 1}`}
                              type="button"
                              onClick={() => setRelatedPage(index)}
                              aria-label={`Show related stories page ${index + 1}`}
                              aria-current={isActive ? "page" : undefined}
                              className={isActive ? "is-active" : ""}
                            />
                          );
                        })}
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setRelatedPage((page) =>
                            Math.min(relatedPageCount - 1, page + 1),
                          )
                        }
                        disabled={currentRelatedPage >= relatedPageCount - 1}
                        aria-label="Show next related stories"
                      >
                        <FaChevronRight />
                      </button>
                    </div>
                  ) : null}
                </section>
              ) : null}
            </div>

            <aside className="hooks-article-right-rail">
              <div className="hooks-article-sticky-stack hooks-article-sticky-stack--right">
                {/* MobileX News card */}
                <section
                  className="
                    relative overflow-hidden
                    rounded-2xl
                    border border-slate-200
                    bg-white
                    p-6 sm:p-7
                  "
                >
                  <div
                    aria-hidden="true"
                    className="
                      pointer-events-none
                      absolute -right-16 -top-16
                      h-40 w-40
                      rounded-full
                      bg-[#2563EB]/[0.06]
                      blur-3xl
                    "
                  />

                  <div className="relative z-10">
                    <div className="flex items-center gap-3">
                      <MobileXLogo
                        className="h-7 w-auto sm:h-8"
                        aria-label="MobileX"
                        darkBackground={false}
                      />

                      <span
                        className="
                          text-[0.68rem]
                          font-extrabold
                          tracking-[0.16em]
                          text-[#2563EB]
                        "
                      >
                        MOBILEX NEWS
                      </span>
                    </div>

                    <h2
                      className="
                        mt-6
                        max-w-[420px]
                        text-xl
                        font-bold
                        tracking-[-0.025em]
                        text-slate-900
                        sm:text-2xl
                      "
                    >
                      News with buying context.
                    </h2>

                    <p
                      className="
                        mt-3
                        max-w-[500px]
                        text-sm
                        leading-6
                        text-slate-600
                        sm:text-[0.95rem]
                      "
                    >
                      Technology launches, practical comparisons and device
                      intelligence without the noise.
                    </p>

                    <Link
                      to="/news"
                      className="
                        mt-6
                        inline-flex
                        items-center
                        gap-2
                        rounded-lg
                        bg-[#2563EB]
                        px-4
                        py-2.5
                        text-sm
                        font-bold
                        text-white
                        no-underline
                        transition
                        hover:bg-[#1D4ED8]
                        focus:outline-none
                        focus:ring-2
                        focus:ring-[#2563EB]/30
                        focus:ring-offset-2
                        focus:ring-offset-white
                      "
                    >
                      Latest News
                      <FaArrowRight className="text-xs" aria-hidden="true" />
                    </Link>
                  </div>
                </section>

                {/* Latest News */}
                {moreStories.length ? (
                  <section className="border-t border-slate-200 pt-6">
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <p
                          className="
                            text-[10px]
                            font-extrabold
                            uppercase
                            tracking-[0.18em]
                            text-[#2563EB]
                          "
                        >
                          Latest
                        </p>

                        <h2
                          className="
                            mt-1
                            text-lg
                            font-black
                            tracking-[-0.025em]
                            text-slate-900
                          "
                        >
                          Latest News
                        </h2>
                      </div>

                      <Link
                        to="/news"
                        className="
                          inline-flex
                          items-center
                          gap-1.5
                          text-xs
                          font-bold
                          text-slate-500
                          no-underline
                          transition
                          hover:text-[#2563EB]
                        "
                      >
                        View all
                        <FaArrowRight className="h-3 w-3" aria-hidden="true" />
                      </Link>
                    </div>

                    <div className="mt-5 space-y-4">
                      {moreStories.map((item) => (
                        <Link
                          key={item.slug}
                          to={createNewsStoryPath(item.slug)}
                          className="
                              group
                              grid
                              grid-cols-[84px_minmax(0,1fr)]
                              gap-3
                              border-b
                              border-slate-100
                              pb-4
                              no-underline
                              last:border-b-0
                            "
                        >
                          <StoryImage
                            story={item}
                            className="h-[68px] w-[84px] rounded-lg"
                          />

                          <div className="min-w-0">
                            <p
                              className="
                                  text-[10px]
                                  font-bold
                                  uppercase
                                  tracking-[0.08em]
                                  text-[#2563EB]
                                "
                            >
                              {item.brandName || getStoryCategory(item)}
                            </p>

                            <h3
                              className="
                                  mt-1
                                  line-clamp-2
                                  text-sm
                                  font-bold
                                  leading-5
                                  text-slate-900
                                  transition
                                  group-hover:text-[#2563EB]
                                "
                            >
                              {item.title}
                            </h3>

                            <p
                              className="
                                  mt-1
                                  text-[11px]
                                  text-slate-400
                                "
                            >
                              {formatAbsoluteDate(item)}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </section>
                ) : null}

                {/* Popular Mobile Lists */}
                <section className="border-t border-slate-200 pt-6">
                  <div>
                    <p
                      className="
                        text-[10px]
                        font-extrabold
                        uppercase
                        tracking-[0.18em]
                        text-[#2563EB]
                      "
                    >
                      Explore
                    </p>

                    <h2
                      className="
                        mt-1
                        text-lg
                        font-black
                        tracking-[-0.025em]
                        text-slate-900
                      "
                    >
                      Popular Mobile Lists
                    </h2>

                    <p
                      className="
                        mt-1
                        text-xs
                        leading-5
                        text-slate-500
                      "
                    >
                      Useful smartphone research paths for faster buying
                      decisions.
                    </p>
                  </div>

                  <div
                    className="
                      mt-4
                      overflow-hidden
                      rounded-xl
                      border
                      border-slate-200
                      bg-white
                    "
                  >
                    {POPULAR_MOBILE_LIST.map((item, index) => (
                      <Link
                        key={item.label}
                        to={item.href}
                        className="
                            group
                            flex
                            items-center
                            gap-3
                            border-b
                            border-slate-100
                            px-4
                            py-3.5
                            no-underline
                            last:border-b-0
                            transition
                            hover:bg-slate-50
                          "
                      >
                        <span
                          className="
                              flex
                              h-7
                              w-7
                              shrink-0
                              items-center
                              justify-center
                              rounded-md
                              bg-[#2563EB]/[0.08]
                              text-[10px]
                              font-black
                              text-[#2563EB]
                            "
                        >
                          {String(index + 1).padStart(2, "0")}
                        </span>

                        <span
                          className="
                              min-w-0
                              flex-1
                              text-sm
                              font-semibold
                              leading-5
                              text-slate-700
                              transition
                              group-hover:text-slate-900
                            "
                        >
                          {item.label}
                        </span>

                        <FaArrowRight
                          className="
                              h-3
                              w-3
                              shrink-0
                              text-slate-300
                              transition
                              group-hover:translate-x-0.5
                              group-hover:text-[#2563EB]
                            "
                          aria-hidden="true"
                        />
                      </Link>
                    ))}
                  </div>
                </section>
              </div>
            </aside>
          </div>
        </section>
      </main>
    </>
  );
};

export default NewsStoryArticlePage;
