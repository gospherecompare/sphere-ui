import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  FaArrowRight,
  FaFacebookF,
  FaFire,
  FaInstagram,
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

const parseStoryDate = (story) => {
  const raw = story?.publishedIso || story?.updatedIso || story?.publishedAt;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
};

const stripMarkup = (value) =>
  String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const clipText = (value, maxWords = 18) => {
  const words = stripMarkup(value).split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return words.join(" ");
  return `${words.slice(0, maxWords).join(" ")}...`;
};

const hasStructuredArticleMarkup = (value) =>
  /<\s*(?:p|h[1-6]|ul|ol|table|blockquote)\b/i.test(String(value || ""));

const sanitizeArticleHtml = (value) => {
  const normalized = String(value || "")
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

  return normalized
    .replace(
      /<(?!\/?(?:p|br|strong|em|b|i|u|a|ul|ol|li|h2|h3|h4|h5|h6|blockquote|table|thead|tbody|tr|th|td)\b)[^>]+>/gi,
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

const formatPublishedLabel = (story) =>
  `Published ${formatRelativeTime(story)}`;

const formatAbsoluteDate = (story) => {
  const date = parseStoryDate(story);
  if (!date) return story?.publishedAt || "Recent update";
  return DATE_FORMATTER.format(date);
};

const getInitials = (name = "") => {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "HK";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
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

const createSafeShareFileName = (value = "story") => {
  const normalized = String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "story";
};

const useStoryImageState = (story) => {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [story?.image, story?.slug]);

  return [imageError, setImageError];
};

const StoryImageFallback = ({ story }) => (
  <div className="flex h-full w-full items-end bg-gradient-to-br from-[#0f172a] via-[#1e3a8a] to-[#2563eb] p-5 text-white">
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
      window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
    }
  };

  const items = [
    {
      name: "Facebook",
      icon: FaFacebookF,
      mobileHidden: true,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedQuote}`,
    },
    {
      name: "WhatsApp",
      icon: FaWhatsapp,
      url: `https://wa.me/?text=${encodedText}%0A%0A${encodedUrl}`,
    },
    {
      name: "Instagram",
      icon: FaInstagram,
      mobileHidden: true,
      onClick: shareOnInstagram,
    },
    {
      name: "X",
      icon: FaXTwitter,
      mobileHidden: true,
      url: `https://x.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
      {items.map((item) => {
        const Icon = item.icon;
        const visibilityClass = item.mobileHidden ? "hidden sm:inline-flex" : "inline-flex";

        if (item.onClick) {
          return (
            <button
              key={item.name}
              type="button"
              onClick={item.onClick}
              aria-label={`Share on ${item.name}`}
              className={`${visibilityClass} h-9 w-9 items-center justify-center rounded-full border border-[#dbe6f3] bg-white text-[#1d4ed8] transition-colors hover:bg-[#f3f7ff] sm:h-10 sm:w-10`}
            >
              <Icon className="h-4 w-4" />
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
            className={`${visibilityClass} h-9 w-9 items-center justify-center rounded-full border border-[#dbe6f3] bg-white text-[#1d4ed8] transition-colors hover:bg-[#f3f7ff] sm:h-10 sm:w-10`}
          >
            <Icon className="h-4 w-4" />
          </a>
        );
      })}

      <button
        type="button"
        onClick={copyLink}
        aria-label="Copy link"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#dbe6f3] bg-white text-[#1d4ed8] transition-colors hover:bg-[#f3f7ff] sm:h-10 sm:w-10"
      >
        <FaLink className="h-4 w-4" />
      </button>

      {copied ? (
        <span className="text-xs font-semibold text-[#5f6d7f]">Link copied</span>
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
  <div className="border-b border-[#e6ebf2] pb-4">
    {eyebrow ? (
      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#1d4ed8]">
        {eyebrow}
      </p>
    ) : null}
    <h2 className="mt-2 text-[22px] font-black tracking-[-0.04em] text-[#151515] sm:text-[24px]">
      {title}
    </h2>
    {subtitle ? (
      <p
        className={`mt-3 max-w-3xl text-sm leading-7 text-[#5f6c7d] sm:text-base ${hideSubtitleOnMobile ? "hidden sm:block" : ""}`}
      >
        {subtitle}
      </p>
    ) : null}
  </div>
);

const TrendingStoryCard = ({ story }) => (
  <Link
    to={createNewsStoryPath(story.slug)}
    className="group flex gap-3 py-3 first:pt-0 last:pb-0 sm:py-4"
  >
    <StoryImage story={story} className="h-[76px] w-[76px] shrink-0 rounded-lg" />

    <div className="min-w-0 flex-1">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1d4ed8]">
        {getStoryCategory(story)}
      </p>
      <h3 className="mt-2 line-clamp-2 text-[15px] font-semibold leading-6 text-[#171717] transition-colors group-hover:text-[#1d4ed8]">
        {story.title}
      </h3>
      <p className="mt-2 hidden text-[11px] uppercase tracking-[0.18em] text-[#7d8898] sm:block">
        {formatAbsoluteDate(story)}
      </p>
    </div>
  </Link>
);

const SidebarStoryCard = ({ story }) => (
  <Link
    to={createNewsStoryPath(story.slug)}
    className="group grid grid-cols-[70px_minmax(0,1fr)] items-start gap-3 border-b border-[#dde6f0] py-4 first:pt-0 last:border-b-0 last:pb-0"
  >
    <StoryImage story={story} className="aspect-[4/3] w-full rounded-lg" />

    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-2 text-[10px] font-medium uppercase tracking-[0.18em] text-[#7d8898] sm:text-[11px]">
        <span className="text-[#1d4ed8]">{getStoryCategory(story)}</span>
        <span className="h-1 w-1 rounded-full bg-[#c6d1df]" />
        <span className="whitespace-nowrap">{formatAbsoluteDate(story)}</span>
      </div>
      <h3 className="mt-2 text-[14px] font-semibold leading-[1.3] text-[#171717] transition-colors group-hover:text-[#1d4ed8]">
        {story.title}
      </h3>
    </div>
  </Link>
);

const RelatedStoryRow = ({ story, index }) => (
  <li className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-3 border-b border-[#e6ebf2] py-5 first:pt-0 last:border-b-0 last:pb-0 sm:grid-cols-[2.75rem_minmax(0,1fr)]">
    <span className="text-[21px] font-black leading-none tracking-[-0.04em] text-[#1d4ed8] tabular-nums sm:text-[24px]">
      {String(index + 1).padStart(2, "0")}
    </span>

    <Link
      to={createNewsStoryPath(story.slug)}
      className="group block"
    >
      <h3
        className="text-[15px] font-semibold leading-[1.34] text-[#171717] transition-colors group-hover:text-[#1d4ed8] sm:text-[18px]"
        style={{ textWrap: "balance" }}
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
    className="group grid gap-4 border-b border-[#e6ebf2] py-5 first:pt-0 last:border-b-0 last:pb-0 sm:grid-cols-[7rem_minmax(0,1fr)] sm:items-center"
  >
    <StoryImage
      story={story}
      className="aspect-[4/3] w-full rounded-lg sm:h-[7rem] sm:w-[7rem]"
    />

    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1d4ed8]">
        {getStoryCategory(story)}
      </p>
      <h3
        className="mt-2 text-[16px] font-semibold leading-[1.32] text-[#171717] transition-colors group-hover:text-[#1d4ed8] sm:text-[20px]"
        style={{ textWrap: "balance" }}
      >
        {story.title}
      </h3>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-[#7d8898] sm:text-[12px]">
        <span className="font-medium normal-case tracking-normal text-[#4d5968]">
          {story.author || "Hooks newsroom"}
        </span>
        <span className="h-1 w-1 rounded-full bg-[#c6d1df]" />
        <span>{formatAbsoluteDate(story)}</span>
      </div>
    </div>
  </Link>
);

const TopicChip = ({ label }) => (
  <span className="inline-flex rounded-full border border-[#dbe5f4] bg-[#f3f7ff] px-2.5 py-1.5 text-[11px] font-medium text-[#344256] sm:px-3 sm:py-2 sm:text-[13px]">
    {label}
  </span>
);

const LinkListPanel = ({ title, subtitle, items }) => (
  <section className="rounded-lg bg-white p-5">
    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#1d4ed8]">
      Buying Guides
    </p>
    <h2 className="mt-3 text-[20px] font-black tracking-[-0.04em] text-[#171717] sm:text-[21px]">
      {title}
    </h2>
    {subtitle ? (
      <p className="mt-3 text-sm leading-7 text-[#5f6c7d]">{subtitle}</p>
    ) : null}

    <div className="mt-5 divide-y divide-[#e6ebf2]">
      {items.map((item) => (
        <Link
          key={item}
          to="/smartphones"
          className="flex items-center justify-between gap-3 py-3 text-[15px] font-medium text-[#173570] transition-colors hover:text-[#1d4ed8]"
        >
          <span>{item}</span>
          <FaArrowRight className="h-3 w-3 shrink-0 text-[#7d8898]" />
        </Link>
      ))}
    </div>
  </section>
);

const LoadingState = () => (
  <main className="min-h-screen bg-[#f6f8fc] text-slate-900">
    <section className="border-b border-[#e6ebf2] bg-[linear-gradient(180deg,#ffffff_0%,#f5f8fc_100%)]">
      <div className="mx-auto max-w-[1280px] px-4 pb-10 pt-6 sm:px-6 sm:pb-12 sm:pt-8 lg:px-8">
        <div className="h-4 w-36 animate-pulse rounded-full bg-slate-200" />
        <div className="mt-5 h-16 max-w-5xl animate-pulse rounded-[22px] bg-slate-200" />
        <div className="mt-4 h-6 max-w-4xl animate-pulse rounded-full bg-slate-100" />
        <div className="mt-6 h-12 w-full max-w-3xl animate-pulse rounded-[18px] bg-slate-100" />
        <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="h-[360px] animate-pulse rounded-[22px] bg-slate-200" />
          <div className="h-[360px] animate-pulse rounded-lg bg-[#eef3fa]" />
        </div>
      </div>
    </section>

    <section className="bg-white">
      <div className="mx-auto max-w-[1280px] px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <div className="h-8 w-48 animate-pulse rounded-full bg-slate-200" />
            <div className="h-64 animate-pulse rounded-lg bg-slate-100" />
            <div className="h-64 animate-pulse rounded-lg bg-slate-100" />
          </div>
          <div className="space-y-5">
            <div className="h-72 animate-pulse rounded-lg bg-[#eef3fa]" />
            <div className="h-72 animate-pulse rounded-lg bg-slate-100" />
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

  const storyTags = [
    story?.label,
    story?.category,
    story?.brandName,
    story?.productName,
  ]
    .map((value) => stripMarkup(value))
    .filter(Boolean)
    .filter((value, index, list) => list.indexOf(value) === index)
    .slice(0, 4);

  const storyAuthor =
    String(story?.author || "Hooks newsroom").trim() || "Hooks newsroom";

  const storyHighlights = useMemo(() => {
    const highlights = Array.isArray(story?.highlights)
      ? story.highlights.map(stripMarkup).filter(Boolean)
      : [];

    if (highlights.length) return highlights.slice(0, 4);

    return articleParagraphs.map((paragraph) => clipText(paragraph, 16)).slice(0, 4);
  }, [articleParagraphs, story?.highlights]);

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
    () => buildRelatedNewsStories(feedStoriesOrdered, story, 4),
    [feedStoriesOrdered, story],
  );

  const recommendedStories = useMemo(() => {
    const relatedSet = new Set(relatedStories.map((item) => item.slug));

    return feedStoriesOrdered
      .filter(
        (item) => item.slug !== story?.slug && !relatedSet.has(item.slug),
      )
      .slice(0, 4);
  }, [feedStoriesOrdered, relatedStories, story?.slug]);

  const moreStories = useMemo(() => {
    const excluded = new Set(trendingStories.map((item) => item.slug));
    excluded.add(story?.slug);

    return feedStoriesOrdered
      .filter((item) => !excluded.has(item.slug))
      .slice(0, 3);
  }, [feedStoriesOrdered, story?.slug, trendingStories]);

  const schema = story
    ? [
        createBreadcrumbSchema([
          { label: "Home", url: "https://tryhook.shop/" },
          { label: "News", url: "https://tryhook.shop/news" },
          { label: story.title, url: canonicalUrl },
        ]),
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

      <main className="min-h-screen bg-[#f6f8fc] text-[#111111]">
        <section className="border-b border-[#e6ebf2] bg-[linear-gradient(180deg,#ffffff_0%,#f5f8fc_100%)]">
          <div className="mx-auto max-w-[1280px] px-4 pb-8 pt-4 sm:px-6 sm:pb-12 sm:pt-8 lg:px-8">
            <div className="hidden flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a8a8a] sm:flex">
              <Link to="/" className="transition-colors hover:text-[#1d4ed8]">
                Home
              </Link>
              <span>/</span>
              <Link
                to="/news"
                className="transition-colors hover:text-[#1d4ed8]"
              >
                News
              </Link>
              <span>/</span>
              <span className="text-[#1a1a1a]">{getStoryCategory(story)}</span>
            </div>

            <div className="mt-2 max-w-5xl sm:mt-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#1d4ed8]">
                {getStoryCategory(story)}
              </p>
              <h1
                className="mt-3 text-[27px] font-black leading-[1.04] tracking-[-0.05em] text-[#121212] sm:text-[44px] lg:text-[52px]"
                style={{ textWrap: "balance" }}
              >
                {story.title}
              </h1>
              <p className="mt-4 max-w-4xl text-[14px] leading-7 text-[#576273] sm:text-base sm:leading-8">
                {articleDescription}
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-4 border-t border-[#e6ebf2] pt-5 xl:flex-row xl:items-end xl:justify-between">
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e8f0ff] text-sm font-black uppercase tracking-wide text-[#1d4ed8]">
                    {getInitials(storyAuthor)}
                  </div>
                  <div>
                    <p className="text-[13px] text-[#667689] sm:text-sm">
                      Written by{" "}
                      <span className="font-semibold text-[#151515]">
                        {storyAuthor}
                      </span>
                    </p>
                    <p className="mt-1 hidden text-sm text-[#7d8898] sm:block">
                      {formatPublishedLabel(story)}
                    </p>
                  </div>
                </div>

                {storyTags.length ? (
                  <div className="hidden flex-wrap gap-2 sm:flex">
                    {storyTags.map((tag) => (
                      <TopicChip key={tag} label={tag} />
                    ))}
                  </div>
                ) : null}
              </div>

              <HeroShareButtons
                title={story.title}
                description={articleDescription}
                image={story.image}
                url={canonicalUrl}
              />
            </div>

            <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px] xl:items-start">
              <div>
                <StoryImage
                  story={story}
                  eager
                  className="aspect-[16/10] w-full rounded-[22px]"
                />
                <div className="mt-3 hidden flex-wrap items-center justify-between gap-3 text-[10px] font-medium uppercase tracking-[0.16em] text-[#7d8898] sm:flex sm:text-[11px] sm:tracking-[0.18em]">
                  <span>Image credit: {formatImageCredit(story)}</span>
                  <span>{formatAbsoluteDate(story)}</span>
                </div>
              </div>

              <aside className="hidden rounded-lg bg-[#f8fbff] p-5 md:block">
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#1d4ed8]">
                  Story Snapshot
                </p>
                <h2 className="mt-3 text-[20px] font-black tracking-[-0.04em] text-[#171717]">
                  Key details
                </h2>

                <ol className="mt-5 space-y-4">
                  {storyHighlights.map((item, index) => (
                    <li
                      key={`${story.slug}-highlight-${index + 1}`}
                      className="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-3"
                    >
                      <span className="text-[18px] font-black leading-none tracking-[-0.04em] text-[#1d4ed8]">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <p className="text-[14px] leading-7 text-[#4f5c6d]">
                        {item}
                      </p>
                    </li>
                  ))}
                </ol>
              </aside>
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-[1280px] px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-10">
              <article className="min-w-0 lg:max-w-[780px]">
                {hasStructuredArticle && articleHtml ? (
                  <div
                    className="text-[16px] leading-7 text-[#4d5868] sm:text-[18px] sm:leading-9 [&_p]:mb-5 [&_p:last-child]:mb-0 [&_p:first-of-type]:text-[18px] [&_p:first-of-type]:text-[#3f4b5a] sm:[&_p:first-of-type]:text-[19px] [&_h2]:mt-10 [&_h2]:text-[24px] [&_h2]:font-black [&_h2]:leading-[1.15] [&_h2]:tracking-[-0.04em] [&_h2]:text-[#151515] sm:[&_h2]:text-[28px] [&_h3]:mt-8 [&_h3]:text-[20px] [&_h3]:font-black [&_h3]:leading-[1.2] [&_h3]:tracking-[-0.03em] [&_h3]:text-[#151515] sm:[&_h3]:text-[23px] [&_h4]:mt-8 [&_h4]:text-[18px] [&_h4]:font-bold [&_h4]:text-[#151515] sm:[&_h4]:text-[20px] [&_ul]:my-6 [&_ul]:list-disc [&_ul]:space-y-3 [&_ul]:pl-5 [&_ol]:my-6 [&_ol]:list-decimal [&_ol]:space-y-3 [&_ol]:pl-5 [&_li]:pl-1 [&_blockquote]:my-8 [&_blockquote]:border-l-4 [&_blockquote]:border-[#1d4ed8] [&_blockquote]:bg-[#f7faff] [&_blockquote]:px-4 [&_blockquote]:py-3 [&_blockquote]:text-[#334155] [&_a]:font-semibold [&_a]:text-[#1d4ed8] [&_a]:underline [&_a]:decoration-[#bfdbfe] [&_a]:underline-offset-4 [&_strong]:font-semibold [&_strong]:text-[#171717] [&_div.article-table-wrap]:my-6 [&_div.article-table-wrap]:overflow-x-auto [&_table]:min-w-[560px] [&_table]:w-full [&_table]:border-collapse [&_table]:text-left [&_table]:text-[14px] sm:[&_table]:text-[15px] [&_thead]:bg-[#f3f7ff] [&_th]:border [&_th]:border-[#dbe6f3] [&_th]:px-3 [&_th]:py-2.5 [&_th]:font-semibold [&_th]:text-[#173570] [&_td]:border [&_td]:border-[#e6ebf2] [&_td]:px-3 [&_td]:py-2.5 [&_td]:align-top [&_td]:text-[#4d5868]"
                    dangerouslySetInnerHTML={{ __html: articleHtml }}
                  />
                ) : (
                  <div className="space-y-5 text-[16px] leading-7 text-[#4d5868] sm:space-y-6 sm:text-[18px] sm:leading-9">
                    {articleParagraphs.map((paragraph, index) => (
                      <p
                        key={`${story.slug}-paragraph-${index + 1}`}
                        className={index === 0 ? "text-[18px] sm:text-[19px]" : ""}
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                )}

                <div className="mt-10 hidden border-t border-[#e6ebf2] pt-6 md:block">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#1d4ed8]">
                        Source
                      </p>
                      <p className="mt-2 text-[15px] font-semibold text-[#171717]">
                        {story?.authorRole || storyAuthor}
                      </p>
                    </div>

                    {storyTags.length ? (
                      <div className="sm:max-w-[60%]">
                        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#1d4ed8]">
                          Tags
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {storyTags.map((tag) => (
                            <TopicChip key={`story-tag-${tag}`} label={tag} />
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>

                {relatedStories.length ? (
                  <section className="mt-14">
                    <SectionTitle
                      eyebrow="Related"
                      title="Related Articles"
                    />

                    <ol className="mt-6">
                      {relatedStories.map((item, index) => (
                        <RelatedStoryRow
                          key={item.slug}
                          story={item}
                          index={index}
                        />
                      ))}
                    </ol>
                  </section>
                ) : null}

                {recommendedStories.length ? (
                  <section className="mt-14 hidden md:block">
                    <SectionTitle
                      eyebrow="Recommended"
                      title="More From The Newsroom"
                    />

                    <div className="mt-6">
                      {recommendedStories.map((item) => (
                        <RecommendedStoryRow key={item.slug} story={item} />
                      ))}
                    </div>
                  </section>
                ) : null}
              </article>

              <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
                <section className="rounded-lg bg-[#f8fbff] p-4 sm:p-5">
                  <div className="flex items-center gap-2 text-[#1d4ed8]">
                    <FaFire className="h-4 w-4" />
                    <p className="text-[11px] font-bold uppercase tracking-[0.24em]">
                      Trending
                    </p>
                  </div>

                  <h2 className="mt-3 text-[20px] font-black tracking-[-0.04em] text-[#171717] sm:text-[21px]">
                    Trending News
                  </h2>

                  <div className="mt-5 divide-y divide-[#dbe5f1]">
                    {trendingStories.map((item) => (
                      <TrendingStoryCard key={item.slug} story={item} />
                    ))}
                  </div>

                  {moreStories.length ? (
                    <div className="mt-6 hidden border-t border-[#d9e4f1] pt-6 md:block">
                      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#1d4ed8]">
                        More Stories
                      </p>
                      <div className="mt-4">
                        {moreStories.map((item) => (
                          <SidebarStoryCard key={item.slug} story={item} />
                        ))}
                      </div>
                    </div>
                  ) : null}
                </section>

                <div className="hidden lg:block">
                  <LinkListPanel
                    title="Popular Mobile List"
                    subtitle="High-intent buying links readers often explore after launch and specs coverage."
                    items={POPULAR_MOBILE_LIST}
                  />
                </div>
              </aside>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default NewsStoryArticlePage;
