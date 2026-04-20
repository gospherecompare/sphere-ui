import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FaFacebookF, FaInstagram, FaLink, FaWhatsapp } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { FcGoogle } from "react-icons/fc";
import SEO from "../SEO";
import NotFound from "./NotFound";
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

const parseStoryDate = (story) => {
  const raw = story?.publishedIso || story?.updatedIso || story?.publishedAt;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
};

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

const getInitials = (name = "") => {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "HK";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const formatImageCredit = (story) => {
  const raw = String(story?.heroImageSource || "").trim();
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
  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-fuchsia-900 p-4 text-center">
    <div className="max-w-[12rem]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/75">
        {story?.label || "Newsroom"}
      </p>
      <h3 className="mt-3 text-sm font-black leading-tight tracking-tight text-white sm:text-base">
        {story?.title || "Editorial coverage"}
      </h3>
    </div>
  </div>
);

const HeroNewsImage = ({ story, eager = false }) => {
  const [imageError, setImageError] = useStoryImageState(story);
  const hasImage = Boolean(story?.image) && !imageError;

  return (
    <div className="relative h-full w-full overflow-hidden">
      {hasImage ? (
        <img
          src={story.image}
          alt={story.title}
          className="block h-full w-full object-cover object-center"
          loading={eager ? "eager" : "lazy"}
          onError={() => setImageError(true)}
        />
      ) : (
        <StoryImageFallback story={story} />
      )}
    </div>
  );
};

const TrendingNewsImage = ({ story }) => {
  const [imageError, setImageError] = useStoryImageState(story);
  const hasImage = Boolean(story?.image) && !imageError;

  return (
    <div className="relative flex h-[74px] w-[74px] shrink-0 items-center justify-center overflow-hidden rounded-[12px] bg-white">
      {hasImage ? (
        <img
          src={story.image}
          alt={story.title}
          className="block h-full w-full object-cover object-center"
          loading="lazy"
          onError={() => setImageError(true)}
        />
      ) : (
        <StoryImageFallback story={story} />
      )}
    </div>
  );
};

const RecommendedNewsImage = ({ story }) => {
  const [imageError, setImageError] = useStoryImageState(story);
  const hasImage = Boolean(story?.image) && !imageError;

  return (
    <div className="relative flex h-[4.75rem] w-[4.75rem] flex-none items-center justify-center overflow-hidden rounded-[12px] bg-slate-50 sm:h-[7.5rem] sm:w-[7.5rem] sm:rounded-[18px]">
      {hasImage ? (
        <img
          src={story.image}
          alt={story.title}
          className="block h-full w-full object-cover object-center"
          loading="lazy"
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
      // fall through to fallback behavior below
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
      onClick: shareOnInstagram,
    },
    {
      name: "X",
      icon: FaXTwitter,
      url: `https://x.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3">
      {items.map((item) => {
        const Icon = item.icon;
        if (item.onClick) {
          return (
            <button
              key={item.name}
              type="button"
              onClick={item.onClick}
              aria-label={`Share on ${item.name}`}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/35 text-white/90 transition-colors hover:border-white hover:bg-white/10"
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
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/35 text-white/90 transition-colors hover:border-white hover:bg-white/10"
          >
            <Icon className="h-4 w-4" />
          </a>
        );
      })}

      <button
        type="button"
        onClick={copyLink}
        aria-label="Copy link"
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/35 text-white/90 transition-colors hover:border-white hover:bg-white/10"
      >
        <FaLink className="h-4 w-4" />
      </button>

      {copied ? (
        <span className="text-xs font-semibold text-white/80">Link copied</span>
      ) : null}
    </div>
  );
};

const TrendingStoryCard = ({ story }) => (
    <Link
      to={createNewsStoryPath(story.slug)}
      className="block border-b border-amber-200/80 py-4 last:border-b-0 last:pb-0 first:pt-0"
    >
    <div className="flex gap-3">
      <TrendingNewsImage story={story} />

      <div className="min-w-0 flex-1">
        <h3 className="line-clamp-2 text-[16px] font-semibold leading-6 tracking-[-0.03em] text-[#173570]">
          {story.title}
        </h3>

        <div className="mt-2 flex items-center gap-2 text-[12px] text-slate-700">
          <span className="truncate max-w-[7rem]">{story.author}</span>
          <span className="shrink-0">|</span>
          <span className="shrink-0">{formatRelativeTime(story)}</span>
        </div>
      </div>
    </div>
  </Link>
);

const RecommendedStoryRow = ({ story }) => (
  <Link
    to={createNewsStoryPath(story.slug)}
    className="flex items-start gap-3 py-4 sm:items-center sm:gap-4 sm:py-5 border-b border-slate-200 last:border-b-0"
  >
    <RecommendedNewsImage story={story} />

    <div className="min-w-0">
      <h3
        className="line-clamp-2 text-[14px] font-semibold leading-[1.35] tracking-[-0.03em] text-[#173570] sm:text-[22px] sm:leading-7"
        style={{ textWrap: "balance" }}
      >
        {story.title}
      </h3>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px] text-slate-500 sm:mt-4 sm:text-sm">
        <span className="truncate font-medium">{story.author}</span>
        <span className="shrink-0">|</span>
        <span className="shrink-0">{formatRelativeTime(story)}</span>
      </div>
    </div>
  </Link>
);

const SectionTitle = ({ title }) => (
  <div className="flex items-center gap-3">
    <h2 className="text-[22px] font-semibold tracking-[-0.03em] text-slate-700 sm:text-3xl">
      {title}
    </h2>
    <span className="h-px flex-1 bg-slate-200" />
  </div>
);

const LoadingState = () => (
  <main className="min-h-screen bg-white text-slate-900">
    <section className="relative isolate overflow-hidden bg-gradient-to-br from-[#0b3f7b] via-[#0d4f93] to-[#0a3570] text-white">
      <div className="mx-auto max-w-[1240px] px-4 pt-8 sm:px-6 lg:px-8 lg:pt-10">
        <div className="h-8 w-28 animate-pulse rounded-full bg-white/15" />
        <div className="mt-6 h-20 max-w-5xl animate-pulse rounded-2xl bg-white/12" />
        <div className="mt-5 h-6 max-w-4xl animate-pulse rounded-full bg-white/12" />
        <div className="mt-8 flex items-center justify-between gap-4">
          <div className="h-12 w-56 animate-pulse rounded-full bg-white/12" />
          <div className="flex gap-3">
            <div className="h-10 w-10 animate-pulse rounded-full bg-white/12" />
            <div className="h-10 w-10 animate-pulse rounded-full bg-white/12" />
            <div className="h-10 w-10 animate-pulse rounded-full bg-white/12" />
            <div className="h-10 w-10 animate-pulse rounded-full bg-white/12" />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1240px] px-4 pb-12 pt-10 sm:px-6 lg:px-8 lg:pb-16">
        <div className="h-[380px] animate-pulse rounded-[28px] bg-white/10" />
        <div className="mt-4 h-5 w-64 animate-pulse rounded-full bg-white/10" />
      </div>
    </section>

    <section className="relative -mt-10 rounded-t-[3.5rem] bg-white pt-14 sm:-mt-16 sm:rounded-t-[5rem] sm:pt-16">
      <div className="mx-auto max-w-[1240px] px-4 pb-16 sm:px-6 lg:px-8 lg:pb-24">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-8">
            <div className="h-[280px] animate-pulse rounded-[26px] bg-slate-100" />
            <div className="h-[420px] animate-pulse rounded-[26px] bg-slate-100" />
            <div className="h-[340px] animate-pulse rounded-[26px] bg-slate-100" />
          </div>
          <div className="h-[720px] animate-pulse rounded-[26px] bg-amber-100" />
        </div>
      </div>
    </section>
  </main>
);

const ErrorState = ({ message = "" }) => (
  <main className="min-h-screen bg-white text-slate-900">
    <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-rose-700">
          Newsroom
        </p>
        <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-rose-900">
          We could not load the story
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-rose-700">
          {message || "The article is unavailable right now."}
        </p>
        <Link
          to="/news"
          className="mt-6 inline-flex items-center rounded-full bg-rose-700 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-rose-800"
        >
          Back to news
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

  const summaryParagraphs = useMemo(() => {
    const body = Array.isArray(story?.body) ? story.body.filter(Boolean) : [];
    return body.length ? body : story?.summary ? [story.summary] : [];
  }, [story?.body, story?.summary]);

  const articleDescription =
    story?.summary || summaryParagraphs[0] || "Hooks newsroom coverage.";

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
      .slice(0, 3);
  }, [feedStoriesOrdered, story?.slug]);

  const relatedStories = useMemo(
    () => buildRelatedNewsStories(feedStoriesOrdered, story, 5),
    [feedStoriesOrdered, story],
  );

  const recommendedStories = useMemo(
    () => buildRelatedNewsStories(feedStoriesOrdered, story, 4),
    [feedStoriesOrdered, story],
  );

  const storyTags = [
    story?.label,
    story?.category,
    story?.brandName,
    story?.productName,
  ]
    .filter(Boolean)
    .filter((value, index, list) => list.indexOf(value) === index)
    .slice(0, 3);

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
          authorName: story.author,
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

      <main className="min-h-screen bg-white text-slate-900">
        <section className="relative isolate overflow-hidden bg-gradient-to-br from-slate-950 via-blue-900 to-indigo-950 text-white">
          <div className="absolute inset-0 opacity-50 [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:72px_72px]" />
          <div className="absolute -top-40 -left-32 h-96 w-96 rounded-full bg-gradient-to-br from-cyan-500/30 to-blue-500/20 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-gradient-to-tl from-purple-600/25 to-pink-500/15 blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-1 sm:px-6 lg:px-8 lg:pb-16 lg:pt-10">
            <div className="max-w-5xl">
              <h1
                className="mt-5 max-w-7xl text-4xl font-black leading-[1.08] tracking-[-0.04em] sm:text-5xl lg:text-[4rem]"
                style={{ textWrap: "balance" }}
              >
                {story.title}
              </h1>

              <p className="mt-5 max-w-4xl text-base leading-8 text-white/86 sm:text-lg">
                {story.summary}
              </p>

              <div className="mt-7 flex flex-wrap items-center justify-between gap-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/30 bg-white/10 text-sm font-black uppercase tracking-wide">
                    {getInitials(story.author)}
                  </div>
                  <div>
                    <p className="text-sm text-white/80">
                      by{" "}
                      <span className="font-semibold text-white">
                        {story.author}
                      </span>
                    </p>
                    <p className="text-sm text-white/65">
                      {formatPublishedLabel(story)}
                    </p>
                  </div>
                </div>

                <HeroShareButtons
                  title={story.title}
                  description={articleDescription}
                  image={story.image}
                  url={canonicalUrl}
                />
              </div>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-7xl px-4 pb-12 sm:px-6 lg:px-8 lg:pb-16">
            <div className="mx-auto aspect-[4/3] w-full max-w-[860px] overflow-hidden rounded-[28px] bg-slate-950">
              <HeroNewsImage story={story} eager />
            </div>
            <p className="mt-4 text-center text-[14px] italic text-white/72">
              Image Credit: {formatImageCredit(story)}
            </p>
          </div>

          <div className="relative -mt-10 rounded-t-[1.8rem] bg-white pt-14 sm:-mt-16 sm:rounded-t-[5rem] sm:pt-16">
            <div className="mx-auto max-w-[1240px] px-4 pb-16 sm:px-6 lg:px-8 lg:pb-24">
              <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
                <div className="min-w-0 space-y-8">
                  <div className="rounded-[18px] border-2 border-slate-900 bg-[#fae7d8] p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-[18px] font-semibold leading-7 tracking-[-0.03em] text-[#173570]">
                        Click Here to Add Hooks Gadgets As A Trusted Source
                      </p>
                      <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm">
                        <FcGoogle className="h-5 w-5 shrink-0" />
                        <span className="max-w-[8rem] leading-tight">
                          Add as a preferred source on Google
                        </span>
                      </span>
                    </div>
                  </div>

                  <article className="space-y-6">
                    <h2 className="text-2xl font-black tracking-[-0.04em] text-[#173570] sm:text-3xl lg:text-[2.35rem]">
                      {story.title}
                    </h2>

                    <div className="space-y-6 text-[17px] leading-8 text-slate-700 sm:text-[18px] sm:leading-9">
                      {summaryParagraphs.map((paragraph, index) => (
                        <p
                          key={`${story.slug}-paragraph-${index + 1}`}
                          className={
                            index === 0 ? "text-[18px] sm:text-[19px]" : ""
                          }
                        >
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </article>

                  {relatedStories.length ? (
                    <section className="pt-2">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <span className="h-px flex-1 bg-slate-300/80" />
                        <h2 className="shrink-0 text-[20px] font-bold tracking-[-0.03em] text-slate-300 sm:text-3xl">
                          Related Articles
                        </h2>
                        <span className="h-px flex-1 bg-slate-300/80" />
                      </div>

                      <div className="relative mt-6 overflow-hidden rounded-[22px] bg-[#24305a] px-4 py-4 text-white sm:mt-8 sm:rounded-[30px] sm:p-6">
                        <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(rgba(255,255,255,0.14)_1px,transparent_1px)] [background-size:10px_10px]" />
                        <ol className="relative z-10 space-y-4 sm:space-y-5">
                          {relatedStories.map((item, index) => (
                            <li
                              key={item.slug}
                              className="grid grid-cols-[2.5rem_minmax(0,1fr)] items-start gap-3 border-b border-white/10 pb-4 last:border-b-0 last:pb-0 sm:grid-cols-[3rem_minmax(0,1fr)] sm:gap-4 sm:pb-5"
                            >
                              <span className="text-[20px] font-black leading-none text-white/90 sm:text-2xl">
                                {String(index + 1).padStart(2, "0")}
                              </span>
                              <Link
                                to={createNewsStoryPath(item.slug)}
                                className="block text-[15px] font-semibold leading-6 tracking-[-0.02em] text-white transition-colors hover:text-blue-200 sm:text-lg sm:leading-7"
                                style={{ textWrap: "balance" }}
                              >
                                {item.title}
                              </Link>
                            </li>
                          ))}
                        </ol>
                      </div>
                    </section>
                  ) : null}

                  <section className="pt-2">
                    <SectionTitle title="Recommended For You" />

                    <div className="mt-4 sm:mt-6">
                      {recommendedStories.map((item) => (
                        <RecommendedStoryRow key={item.slug} story={item} />
                      ))}
                    </div>
                  </section>
                </div>

                <aside className="lg:sticky lg:top-6">
                  <section className="rounded-[28px] border border-amber-200 bg-[#fae7c5] p-4">
                    <h2 className="text-center text-2xl font-black tracking-[-0.04em] text-[#173570]">
                      Trending News
                    </h2>

                    <div className="mt-6 divide-y divide-amber-200/80">
                      {trendingStories.map((item) => (
                        <TrendingStoryCard key={item.slug} story={item} />
                      ))}
                    </div>
                  </section>
                </aside>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default NewsStoryArticlePage;
