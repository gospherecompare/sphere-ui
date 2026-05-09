import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  FaArrowRight,
  FaChevronLeft,
  FaChevronRight,
  FaFacebookF,
  FaFire,
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

const stripMarkup = (value) =>
  String(value || "")
    .replace(/(\*\*|__)([\s\S]*?)\1/g, " $2 ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const clipText = (value, maxWords = 18) => {
  const words = stripMarkup(value).split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return words.join(" ");
  return `${words.slice(0, maxWords).join(" ")}...`;
};

const normalizeTagKey = (value) =>
  stripMarkup(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const decodeHtmlEntities = (value) => {
  let text = String(value || "");
  if (!text) return "";

  const replacements = [
    ["&lt;", "<"],
    ["&gt;", ">"],
    ["&quot;", '"'],
    ["&#39;", "'"],
    ["&nbsp;", " "],
    ["&amp;", "&"],
  ];

  for (let pass = 0; pass < 2; pass += 1) {
    let next = text;
    replacements.forEach(([encoded, decoded]) => {
      next = next.split(encoded).join(decoded);
    });
    if (next === text) break;
    text = next;
  }

  return text;
};

const applyInlineBoldMarkers = (value) =>
  String(value || "")
    .split(/(<[^>]+>)/g)
    .map((segment) => {
      if (!segment || segment.startsWith("<")) return segment;

      return segment
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

const hasStructuredArticleMarkup = (value) =>
  /<\s*(?:p|h[1-6]|ul|ol|table|blockquote|figure|figcaption|img)\b/i.test(
    decodeHtmlEntities(value),
  );

const sanitizeArticleHtml = (value) => {
  const normalized = decodeHtmlEntities(value)
    .replace(/\r\n?/g, "\n")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(
      /<(script|style|iframe|object|embed|form|input|button|textarea|select|svg|canvas)[^>]*>[\s\S]*?<\/\1>/gi,
      "",
    )
    .replace(/<h1\b/gi, "<h2")
    .replace(/<\/h1>/gi, "</h2>")
    .replace(/\son[a-z]+\s*=\s*(\"[^\"]*\"|'[^']*'|[^\s>]+)/gi, "")
    .replace(
      /\s(?:style|class|id|aria-[\w-]+|data-[\w-]+)\s*=\s*(\"[^\"]*\"|'[^']*')/gi,
      "",
    )
    .replace(/\s(?:style|class|id)\s*=\s*[^\s>]+/gi, "")
    .replace(/href\s*=\s*(['"])\s*javascript:[^'"]*\1/gi, 'href="#"')
    .replace(/src\s*=\s*(['"])\s*javascript:[^'"]*\1/gi, "");

  return applyInlineBoldMarkers(normalized)
    .replace(
      /<(?!\/?(?:p|br|strong|em|b|i|u|a|ul|ol|li|h2|h3|h4|h5|h6|blockquote|table|thead|tbody|tr|th|td|figure|figcaption|img)\b)[^>]+>/gi,
      "",
    )
    .replace(/<table\b([^>]*)>/gi, '<div class="article-table-wrap"><table$1>')
    .replace(/<\/table>/gi, "</table></div>")
    .trim();
};

const getStoryCategory = (story) =>
  stripMarkup(story?.label || story?.category || "Newsroom");

const formatRelativeTime = (story) => {
  const date = parseStoryDate(story);
  if (!date) return story?.publishedAt || "Recently";

  const diffHours = Math.round(
    (Date.now() - date.getTime()) / (1000 * 60 * 60),
  );

  if (diffHours < 1) return "just now";
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  }

  return DATE_FORMATTER.format(date);
};

const formatAbsoluteDate = (story) => {
  const date = parseStoryDate(story);
  if (!date) return story?.publishedAt || "Recent update";
  return DATE_FORMATTER.format(date);
};

const formatHeaderDateTime = (story) => {
  const date = parseStoryDate(story);
  if (!date) return `${formatAbsoluteDate(story)} IST`;

  const parts = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Kolkata",
  }).formatToParts(date);

  const lookup = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  const day = lookup.day || "";
  const month = lookup.month || "";
  const year = lookup.year || "";
  const hour = lookup.hour || "";
  const minute = lookup.minute || "";

  return `${day} ${month} ${year} ${hour}:${minute} IST`.trim();
};

const formatImageCredit = (story) => {
  const raw = String(
    story?.heroImageCaption || story?.heroImageSource || "",
  ).trim();
  if (!raw) return "Hooks newsroom";
  if (/^(asset|url)$/i.test(raw)) return "Hooks newsroom";
  if (/^https?:\/\//i.test(raw)) {
    try {
      return new URL(raw).hostname.replace(/^www\./i, "");
    } catch {
      return "Hooks newsroom";
    }
  }
  return raw;
};

const getStoryHeaderMeta = (story) => {
  const productType = String(story?.productType || "")
    .trim()
    .toLowerCase();
  const category = String(story?.category || "")
    .trim()
    .toLowerCase();

  if (productType === "smartphone" || category === "mobiles") {
    return {
      parent: {
        label: "Mobiles",
        to: "/smartphones",
        url: "https://tryhook.shop/smartphones",
      },
      section: {
        label: "Mobiles News",
        to: "/news",
        url: "https://tryhook.shop/news",
      },
    };
  }

  if (productType === "laptop") {
    return {
      parent: {
        label: "Laptops",
        to: "/laptops",
        url: "https://tryhook.shop/laptops",
      },
      section: {
        label: "Laptop News",
        to: "/news",
        url: "https://tryhook.shop/news",
      },
    };
  }

  if (productType === "tv") {
    return {
      parent: { label: "TVs", to: "/tvs", url: "https://tryhook.shop/tvs" },
      section: {
        label: "TV News",
        to: "/news",
        url: "https://tryhook.shop/news",
      },
    };
  }

  if (productType === "networking") {
    return {
      parent: {
        label: "Networking",
        to: "/networking",
        url: "https://tryhook.shop/networking",
      },
      section: {
        label: "Networking News",
        to: "/news",
        url: "https://tryhook.shop/news",
      },
    };
  }

  return {
    parent: null,
    section: { label: "News", to: "/news", url: "https://tryhook.shop/news" },
  };
};

const buildStoryBreadcrumbs = (story, canonicalUrl) => {
  const headerMeta = getStoryHeaderMeta(story);
  const items = [{ label: "Home", to: "/", url: "https://tryhook.shop/" }];

  if (headerMeta.parent) items.push(headerMeta.parent);
  if (headerMeta.section) items.push(headerMeta.section);
  if (story?.title) items.push({ label: story.title, url: canonicalUrl });

  return items;
};

const createSafeShareFileName = (value = "story") => {
  const normalized = String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "story";
};

const HEADLINE_WORD_TARGET = 8;
const HEADLINE_MIN_LAST_LINE_WORDS = 3;
const HEADLINE_END_AVOID = new Set([
  "a",
  "an",
  "and",
  "at",
  "by",
  "for",
  "from",
  "in",
  "of",
  "on",
  "or",
  "the",
  "to",
  "with",
]);

const normalizeHeadlineWord = (value) =>
  String(value || "")
    .replace(/^[^a-z0-9]+|[^a-z0-9]+$/gi, "")
    .toLowerCase();

const shouldKeepHeadlineWordsTogether = (word, nextWord) => {
  if (!word || !nextWord) return false;

  const current = String(word || "").replace(/[^\w%+.-]+$/g, "");
  const next = String(nextWord || "").replace(/^[^\w%+.-]+/g, "");

  return /\d/.test(current) && /^[a-z]/i.test(next);
};

const splitHeadlineLines = (value) => {
  const words = String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length <= HEADLINE_WORD_TARGET + HEADLINE_MIN_LAST_LINE_WORDS) {
    return [words.join(" ")];
  }

  const lines = [];
  let remaining = [...words];

  while (remaining.length > HEADLINE_WORD_TARGET + HEADLINE_MIN_LAST_LINE_WORDS) {
    let count = HEADLINE_WORD_TARGET;
    const currentWord = normalizeHeadlineWord(remaining[count - 1]);

    if (HEADLINE_END_AVOID.has(currentWord) && count > 6) {
      count -= 1;
    }

    if (
      shouldKeepHeadlineWordsTogether(remaining[count - 1], remaining[count]) &&
      remaining.length - (count + 1) >= HEADLINE_MIN_LAST_LINE_WORDS
    ) {
      count += 1;
    }

    lines.push(remaining.slice(0, count).join(" "));
    remaining = remaining.slice(count);
  }

  if (remaining.length) {
    lines.push(remaining.join(" "));
  }

  return lines.filter(Boolean);
};

const HeadlineText = ({ lines = [], title = "", slug = "" }) => (
  <>
    <span className="sm:hidden">{title}</span>
    <span className="hidden sm:block">
      {lines.map((line, index) => (
        <span key={`${slug}-headline-${index + 1}`} className="block">
          {line}
        </span>
      ))}
    </span>
  </>
);

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

  const matcher = /<\/p>/gi;
  let count = 0;
  let match = matcher.exec(html);

  while (match) {
    count += 1;
    if (count === paragraphCount) {
      const splitIndex = match.index + match[0].length;
      return {
        leadHtml: html.slice(0, splitIndex),
        restHtml: html.slice(splitIndex),
      };
    }
    match = matcher.exec(html);
  }

  return { leadHtml: html, restHtml: "" };
};

const getInitials = (value = "Hooks") =>
  String(value || "Hooks")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "H";

const ARTICLE_PROSE_CLASS =
  'pt-5 text-[15px] leading-7 text-[#32363d] sm:pt-6 sm:text-[18px] sm:leading-9 [&_p]:mb-5 sm:[&_p]:mb-6 [&_p:last-child]:mb-0 [&_p]:text-[15px] [&_p]:leading-7 [&_p:first-of-type]:text-[16px] [&_p:first-of-type]:leading-8 [&_p:first-of-type]:text-[#1f2937] sm:[&_p]:text-[18px] sm:[&_p]:leading-9 sm:[&_p:first-of-type]:text-[20px] sm:[&_p:first-of-type]:leading-9 [&_h2]:scroll-mt-28 [&_h2]:mt-9 [&_h2]:text-[22px] [&_h2]:font-black [&_h2]:leading-[1.16] [&_h2]:text-[#1f2937] sm:[&_h2]:mt-10 sm:[&_h2]:text-[30px] [&_h3]:scroll-mt-28 [&_h3]:mt-7 [&_h3]:text-[19px] [&_h3]:font-bold [&_h3]:leading-[1.24] [&_h3]:text-[#1f2937] sm:[&_h3]:mt-8 sm:[&_h3]:text-[24px] [&_h4]:mt-7 [&_h4]:text-[17px] [&_h4]:font-bold [&_h4]:text-[#1f2937] sm:[&_h4]:text-[18px] [&_ul]:my-5 [&_ul]:list-disc [&_ul]:space-y-2.5 [&_ul]:pl-5 sm:[&_ul]:my-6 sm:[&_ul]:space-y-3 [&_ol]:my-5 [&_ol]:list-decimal [&_ol]:space-y-2.5 [&_ol]:pl-5 sm:[&_ol]:my-6 sm:[&_ol]:space-y-3 [&_li]:pl-1 [&_blockquote]:my-7 [&_blockquote]:border-l-4 [&_blockquote]:border-[#2563eb] [&_blockquote]:bg-[#eff6ff] [&_blockquote]:px-4 [&_blockquote]:py-4 [&_blockquote]:text-[#30343a] sm:[&_blockquote]:my-8 sm:[&_blockquote]:px-5 [&_a]:font-medium [&_a]:text-[#2563eb] [&_a]:underline [&_a]:decoration-[#c4b5fd] [&_a]:underline-offset-4 [&_strong]:font-semibold [&_strong]:text-[#171717] [&_figure]:my-6 [&_figure]:overflow-hidden [&_figure]:border [&_figure]:border-[#e5e7eb] [&_figure]:bg-[#fafafa] sm:[&_figure]:my-7 [&_figure_figcaption]:border-t [&_figure_figcaption]:border-[#e5e7eb] [&_figure_figcaption]:px-4 [&_figure_figcaption]:py-3 [&_figure_figcaption]:text-[11px] [&_figure_figcaption]:font-semibold [&_figure_figcaption]:uppercase [&_figure_figcaption]:tracking-[0.12em] [&_figure_figcaption]:text-[#6b7280] [&_figure_img]:w-full [&_img]:my-6 [&_img]:w-full sm:[&_img]:my-7 [&_div.article-table-wrap]:my-6 [&_div.article-table-wrap]:overflow-x-auto [&_div.article-table-wrap]:border [&_div.article-table-wrap]:border-[#e5e7eb] sm:[&_div.article-table-wrap]:my-7 [&_table]:min-w-[560px] [&_table]:w-full [&_table]:border-collapse [&_table]:text-left [&_table]:text-[14px] sm:[&_table]:text-[15px] [&_thead]:bg-[#f6f7fb] [&_th]:border-b [&_th]:border-[#dde3eb] [&_th]:px-4 [&_th]:py-3 [&_th]:font-semibold [&_th]:text-[#202938] [&_td]:border-b [&_td]:border-[#ebedf0] [&_td]:px-4 [&_td]:py-3 [&_td]:align-top [&_td]:text-[#424955] [&_tbody_tr:last-child_td]:border-b-0';

const ARTICLE_PROSE_CONTINUATION_CLASS = ARTICLE_PROSE_CLASS.replace(
  /^pt-6\s*/,
  "",
);

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
        {story?.title || "Hooks newsroom"}
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
      <linearGradient id="instagram-share-gradient" x1="3" y1="21" x2="21" y2="3">
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

const HeroShareButtons = ({ title, description, image, url }) => {
  const [copied, setCopied] = useState(false);
  const fallbackUrl = typeof window !== "undefined" ? window.location.href : "";
  const currentUrl = url || fallbackUrl;
  const shareTitle = String(title || "Hooks").trim();
  const shareDescription = String(description || "").trim();
  const shareText = [shareTitle, shareDescription].filter(Boolean).join("\n\n");
  const shareImageUrl = (() => {
    if (!image) return "";
    try {
      return new URL(image, currentUrl || fallbackUrl).href;
    } catch {
      return String(image).trim();
    }
  })();

  const encodedUrl = encodeURIComponent(currentUrl || "");
  const encodedText = encodeURIComponent(shareText || shareTitle || "");
  const encodedQuote = encodeURIComponent(shareDescription || shareTitle || "");

  const loadShareImageFile = async () => {
    if (!shareImageUrl || typeof File === "undefined") return null;

    try {
      const response = await fetch(shareImageUrl, { mode: "cors" });
      if (!response.ok) return null;

      const blob = await response.blob();
      if (!blob.size) return null;

      const type = blob.type || "image/jpeg";
      const extension = type.split("/")[1] || "jpg";
      const fileName = `${createSafeShareFileName(shareTitle)}.${extension}`;

      return new File([blob], fileName, { type });
    } catch {
      return null;
    }
  };

  const copyLink = async () => {
    try {
      if (!currentUrl) return;
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore clipboard failures
    }
  };

  const shareOnInstagram = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        const shareData = {
          title: shareTitle || "Hooks",
          text: shareText || shareTitle || "Hooks",
          url: currentUrl,
        };

        const imageFile = await loadShareImageFile();
        if (
          imageFile &&
          typeof navigator.canShare === "function" &&
          navigator.canShare({ files: [imageFile] })
        ) {
          shareData.files = [imageFile];
        }

        await navigator.share(shareData);
        return;
      }
    } catch {
      // fall through
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

  const items = [
    {
      name: "Facebook",
      icon: FaFacebookF,
      className: "text-[#4f46e5]",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedQuote}`,
    },
    {
      name: "X",
      icon: FaXTwitter,
      className: "text-[#475569]",
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
    <div className="flex flex-wrap items-center gap-2">
      {items.map((item) => {
        const Icon = item.icon;
        const buttonClass = `inline-flex h-9 w-9 items-center justify-center rounded-[4px] bg-transparent transition-opacity hover:opacity-75 sm:h-10 sm:w-10 ${item.className}`;

        if (item.onClick) {
          return (
            <button
              key={item.name}
              type="button"
              onClick={item.onClick}
              aria-label={`Share on ${item.name}`}
              className={buttonClass}
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
            className={buttonClass}
          >
            <Icon className="h-3.5 w-3.5" />
          </a>
        );
      })}

      <button
        type="button"
        onClick={copyLink}
        aria-label="Copy link"
        className="inline-flex h-9 w-9 items-center justify-center rounded-[4px] bg-transparent text-[#475569] transition-opacity hover:opacity-75 sm:h-10 sm:w-10"
      >
        <FaLink className="h-3.5 w-3.5" />
      </button>

      {copied ? <span className="text-xs text-[#6b7280]">Link copied</span> : null}
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
    className="group grid grid-cols-[78px_minmax(0,1fr)] items-start gap-3 py-4 first:pt-0 last:pb-0 sm:grid-cols-[92px_minmax(0,1fr)]"
  >
    <StoryImage
      story={story}
      className="aspect-[4/3] w-full border border-[#e5e7eb]"
    />

    <div className="min-w-0 flex-1">
      <h3 className="line-clamp-4 text-[14px] font-semibold leading-5 text-[#2a2a2a] transition-colors group-hover:text-[#2563eb]">
        {story.title}
      </h3>
      <p className="mt-2 text-[11px] text-[#7c828d]">
        {formatAbsoluteDate(story)}
      </p>
    </div>
  </Link>
);

const SidebarStoryCard = ({ story }) => (
  <Link
    to={createNewsStoryPath(story.slug)}
    className="group grid grid-cols-[78px_minmax(0,1fr)] items-start gap-3 border-b border-[#eceff3] pb-4 last:border-b-0 last:pb-0 sm:grid-cols-[92px_minmax(0,1fr)]"
  >
    <StoryImage
      story={story}
      className="aspect-[4/3] w-full border border-[#e5e7eb]"
    />

    <div className="min-w-0">
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7c3aed]">
        {getStoryCategory(story)}
      </div>
      <h3 className="mt-2 text-[14px] font-semibold leading-[1.35] text-[#2a2a2a] transition-colors group-hover:text-[#2563eb]">
        {story.title}
      </h3>
      <p className="mt-2 text-[11px] text-[#7c828d]">{formatAbsoluteDate(story)}</p>
    </div>
  </Link>
);

const RelatedStoryRow = ({ story, index }) => (
  <li className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3 border-b border-[#e6ebf2] py-5 first:pt-0 last:border-b-0 last:pb-0 sm:grid-cols-[3rem_minmax(0,1fr)] sm:gap-4">
    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#ede9fe] text-[16px] font-black leading-none tracking-[-0.04em] text-[#7c3aed] tabular-nums sm:h-11 sm:w-11 sm:text-[17px]">
      {String(index + 1).padStart(2, "0")}
    </span>

    <Link to={createNewsStoryPath(story.slug)} className="group block">
      <h3
        className="text-[15px] font-semibold leading-[1.45] text-[#18212f] transition-colors group-hover:text-[#2563eb] sm:text-[18px]"
      >
        {story.title}
      </h3>
      <p className="mt-3 hidden text-[11px] uppercase tracking-[0.18em] text-[#7d8898] sm:block">
        {getStoryCategory(story)} | {formatAbsoluteDate(story)}
      </p>
    </Link>
  </li>
);

const RecommendedStoryRow = ({ story }) => (
  <Link
    to={createNewsStoryPath(story.slug)}
    className="group min-w-[72%] overflow-hidden border border-[#e8ebef] bg-white sm:grid sm:min-w-0 sm:grid-cols-[7rem_minmax(0,1fr)] sm:items-center sm:gap-4 sm:border-x-0 sm:border-t-0 sm:py-5 sm:first:pt-0 sm:last:border-b-0 sm:last:pb-0"
  >
    <StoryImage
      story={story}
      className="aspect-[4/3] w-full border-b border-[#e5e7eb] sm:h-[7rem] sm:w-[7rem] sm:border"
    />

    <div className="min-w-0 p-3 sm:p-0">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7c3aed] sm:text-[11px] sm:tracking-[0.18em]">
        {getStoryCategory(story)}
      </p>
      <h3
        className="mt-2 line-clamp-3 text-[14px] font-semibold leading-[1.4] text-[#262626] transition-colors group-hover:text-[#2563eb] sm:text-[20px]"
      >
        {story.title}
      </h3>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-[#7d8898] sm:text-[12px]">
        <span className="hidden font-medium normal-case tracking-normal text-[#4d5968] sm:inline">
          {story.author || "Hooks newsroom"}
        </span>
        <span className="hidden h-1 w-1 rounded-full bg-[#c6d1df] sm:inline-flex" />
        <span>{formatAbsoluteDate(story)}</span>
      </div>
    </div>
  </Link>
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
            <span className="pt-[2px] text-[15px] text-[#9aa0a6]">&rsaquo;</span>
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

const SidebarSection = ({ title, children, mobileSoft = false }) => (
  <section
    className={`bg-white ${
      mobileSoft ? "border-t border-[#e5e7eb] pt-5 sm:border sm:pt-0" : "border border-[#e5e7eb]"
    }`}
  >
    <div
      className={`px-4 py-2 text-[12px] font-bold uppercase tracking-[0.12em] text-white ${
        mobileSoft
          ? "bg-none px-0 pb-3 pt-0 text-[#18212f] sm:bg-gradient-to-r sm:from-[#2563eb] sm:to-[#7c3aed] sm:px-4 sm:py-2 sm:text-white"
          : "bg-gradient-to-r from-[#2563eb] to-[#7c3aed]"
      }`}
    >
      {title}
    </div>
    <div className={`${mobileSoft ? "p-0 sm:p-4" : "p-3 sm:p-4"}`}>{children}</div>
  </section>
);

const InlineStoryLinksPanel = ({ stories = [] }) => {
  if (!stories.length) return null;

  return (
    <section className="my-7 border border-[#d8dbe1] bg-[#fafafa] sm:my-8">
      <div className="flex items-center gap-3 border-b border-[#e5e7eb] px-4 py-3">
        <span className="inline-flex h-7 w-7 items-center justify-center bg-[#ede9fe] text-[#7c3aed]">
          <FaArrowRight className="h-3 w-3" />
        </span>
        <p className="text-[15px] font-semibold text-[#262626]">Also See</p>
      </div>

      <div className="divide-y divide-[#eceff3]">
        {stories.slice(0, 3).map((story) => (
          <Link
            key={story.slug}
            to={createNewsStoryPath(story.slug)}
            className="flex items-start gap-3 px-4 py-3 text-[14px] leading-6 text-[#2563eb] transition-colors hover:text-[#7c3aed] sm:text-[15px]"
          >
            <span className="mt-[10px] h-[5px] w-[5px] rounded-full bg-[#7c3aed]" />
            <span className="min-w-0 flex-1">{story.title}</span>
          </Link>
        ))}
      </div>
    </section>
  );
};

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
      <p className="mt-2 text-[11px] text-white/70">{formatAbsoluteDate(story)}</p>
    </div>
  </Link>
);

const LinkListPanel = ({ title, subtitle, items }) => (
  <SidebarSection title={title}>
    {subtitle ? (
      <p className="pb-3 text-[13px] leading-6 text-[#5f6670]">{subtitle}</p>
    ) : null}

    <div className="divide-y divide-[#eceff3]">
      {items.map((item) => (
        <Link
          key={item}
          to="/smartphones"
          className="flex items-center justify-between gap-3 py-3 text-[14px] font-medium text-[#29303a] transition-colors hover:text-[#2563eb]"
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
          Hooks Newsroom
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
          Back to news
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
    "Hooks newsroom coverage.";
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
    String(story?.author || "Hooks newsroom").trim() || "Hooks newsroom";
  const headlineLines = useMemo(
    () => splitHeadlineLines(story?.title),
    [story?.title],
  );
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

  const recommendedStories = useMemo(() => {
    const relatedSet = new Set(relatedStories.map((item) => item.slug));

    return feedStoriesOrdered
      .filter((item) => item.slug !== story?.slug && !relatedSet.has(item.slug))
      .slice(0, 4);
  }, [feedStoriesOrdered, relatedStories, story?.slug]);

  const moreStories = useMemo(() => {
    const excluded = new Set(trendingStories.map((item) => item.slug));
    excluded.add(story?.slug);

    return feedStoriesOrdered
      .filter((item) => !excluded.has(item.slug))
      .slice(0, 3);
  }, [feedStoriesOrdered, story?.slug, trendingStories]);
  const inlineStories = useMemo(
    () =>
      (recommendedStories.length ? recommendedStories : relatedStories).slice(0, 3),
    [recommendedStories, relatedStories],
  );
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
        <section className="border-b border-[#e5e7eb] bg-white">
          <div className="mx-auto max-w-[1280px] px-4 pb-6 pt-4 sm:px-6 sm:pb-10 sm:pt-5 lg:px-8">
            <div className="line-clamp-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] leading-5 text-[#7b8796] sm:text-[12px]">
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
                        className={
                          isLast
                            ? "font-medium text-[#334155]"
                            : "text-[#7b8796]"
                        }
                      >
                        {item.label}
                      </span>
                    )}
                    {!isLast ? (
                      <span className="text-[#b6c2cf]">&gt;</span>
                    ) : null}
                  </React.Fragment>
                );
              })}
            </div>

            <div className="mt-3 max-w-[1120px] sm:mt-4">
              <h1 className="text-[21px] font-black leading-[1.16] tracking-[-0.02em] text-[#20242b] sm:text-[28px] sm:leading-[1.1] lg:text-[32px] xl:text-[36px]">
                <HeadlineText lines={headlineLines} title={story.title} slug={story.slug} />
              </h1>
              <p className="mt-3 max-w-[72ch] text-[14px] leading-6 text-[#5f6670] sm:text-[17px] sm:leading-7">
                {articleDescription}
              </p>
            </div>

            <div className="mt-5 flex flex-col gap-3 pb-4 sm:flex-row sm:items-end sm:justify-between sm:gap-4 sm:border-b sm:border-[#eceff3] sm:pb-5">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] leading-5 text-[#667689] sm:text-[13.5px]">
                <span>Written by</span>
                <span className="font-semibold text-[#2563eb]">{storyAuthor}</span>
                {story?.authorRole ? (
                  <>
                    <span className="hidden text-[#cbd5e1] sm:inline">|</span>
                    <span>{story.authorRole}</span>
                  </>
                ) : null}
                <span className="hidden text-[#cbd5e1] sm:inline">|</span>
                <span className="text-[#7d8898]">
                  Updated {formatHeaderDateTime(story)}
                </span>
              </div>

              <HeroShareButtons
                title={story.title}
                description={articleDescription}
                image={story.image}
                url={canonicalUrl}
              />
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
            <div className="grid gap-6 sm:gap-8 xl:grid-cols-[160px_minmax(0,1fr)_300px] xl:items-start xl:gap-10">
              <aside className="hidden xl:block">
                <div className="sticky top-6 space-y-8">
                  <RailPanel title="Highlights" items={editorialHighlights} />
                  <RailPanel
                    title="Jump To"
                    items={jumpRailItems}
                    linkable={articleHeadings.length > 0}
                  />
                </div>
              </aside>

              <div className="min-w-0">
                <div className="border-b border-[#eceff3]">
                  <StoryImage
                    story={story}
                    eager
                    className="aspect-[4/3] w-full border border-[#e5e7eb] sm:aspect-[16/9]"
                  />
                  <div className="mt-3 flex flex-col gap-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-[#7d8898] sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3 sm:tracking-[0.14em]">
                    <span>Image credit: {formatImageCredit(story)}</span>
                    <span>{formatAbsoluteDate(story)}</span>
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

                <article className="mt-7 sm:mt-8">
                  <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.12em] sm:gap-2.5 sm:text-[11px] sm:tracking-[0.14em]">
                    <span className="inline-flex items-center font-medium text-[#5f6670]">
                      {story.readTime}
                    </span>
                    <span className="inline-flex items-center font-medium text-[#5f6670]">
                      {formatAbsoluteDate(story)}
                    </span>
                  </div>

                  {hasStructuredArticle && articleHtmlWithAnchors ? (
                    <>
                      {structuredLeadHtml ? (
                        <div
                          className={ARTICLE_PROSE_CLASS}
                          dangerouslySetInnerHTML={{ __html: structuredLeadHtml }}
                        />
                      ) : null}

                      <InlineStoryLinksPanel stories={inlineStories} />

                      {structuredRestHtml ? (
                        <div
                          className={ARTICLE_PROSE_CONTINUATION_CLASS}
                          dangerouslySetInnerHTML={{ __html: structuredRestHtml }}
                        />
                      ) : null}
                    </>
                  ) : (
                    <>
                      <div className="space-y-5 pt-5 text-[15px] leading-7 text-[#32363d] sm:space-y-7 sm:pt-6 sm:text-[18px] sm:leading-9">
                        {introParagraphs.map((paragraph, index) => (
                          <p
                            key={`${story.slug}-intro-${index + 1}`}
                            className={
                              index === 0
                                ? "text-[16px] leading-8 text-[#1f2937] sm:text-[20px] sm:leading-9"
                                : "text-[15px] leading-7 sm:text-[18px] sm:leading-9"
                            }
                          >
                            {paragraph}
                          </p>
                        ))}
                      </div>

                      <InlineStoryLinksPanel stories={inlineStories} />

                      {remainingParagraphs.length ? (
                        <div className="space-y-5 text-[15px] leading-7 text-[#32363d] sm:space-y-7 sm:text-[18px] sm:leading-9">
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
                    <div className="mt-8 border-t border-[#eceff3] pt-5 text-[13px] leading-6 text-[#6b7280] sm:mt-10">
                      <span className="font-semibold text-[#202226]">
                        Further reading:
                      </span>{" "}
                      {articleKeywords.join(", ")}
                    </div>
                  ) : null}

                </article>

                {relatedStories.length ? (
                  <section className="mt-10 sm:mt-12">
                    <SectionTitle eyebrow="Related" title="Related Stories" />

                    <div className="mt-5 grid grid-cols-2 gap-3 sm:mt-6 sm:grid-cols-4 sm:gap-4">
                      {paginatedRelatedStories.map((item) => (
                        <RelatedStoryTile key={item.slug} story={item} />
                      ))}
                    </div>

                    {relatedPageCount > 1 ? (
                      <div className="mt-5 flex justify-center border-t border-[#eceff3] pt-4">
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
                          {Array.from({ length: relatedPageCount }).map((_, index) => {
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
                            className="inline-flex h-8 w-8 items-center justify-center bg-transparent text-[#334155] transition-opacity hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <FaChevronRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </section>
                ) : null}

                {recommendedStories.length ? (
                  <section className="mt-10 sm:mt-12">
                    <SectionTitle
                      eyebrow="Recommended"
                      title="More From The Newsroom"
                    />

                    <div className="-mx-4 mt-5 flex gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:mt-6 sm:block sm:overflow-visible sm:px-0 sm:pb-0">
                      {recommendedStories.map((item) => (
                        <RecommendedStoryRow key={item.slug} story={item} />
                      ))}
                    </div>
                  </section>
                ) : null}
              </div>

              <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
                <SidebarSection title="Trending News" mobileSoft>
                  <div className="mb-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#7c3aed]">
                    <FaFire className="h-3.5 w-3.5" />
                    Live from the newsroom
                  </div>

                  <div className="divide-y divide-[#eceff3]">
                    {trendingStories.map((item) => (
                      <TrendingStoryCard key={item.slug} story={item} />
                    ))}
                  </div>
                </SidebarSection>

                {moreStories.length ? (
                  <SidebarSection title="Latest Reads">
                    <div className="space-y-4">
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
