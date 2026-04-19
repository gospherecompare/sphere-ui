import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  FaArrowRight,
  FaFacebookF,
  FaFire,
  FaLink,
  FaRegNewspaper,
  FaTwitter,
  FaWhatsapp,
} from "react-icons/fa";
import SEO from "../SEO";
import NotFound from "./NotFound";
import { HooksSignature } from "../Home/NewsBrandBadge";
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
import { NEWS_BRAND_STYLES } from "../Home/newsBrandStyles";

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const SIDEBAR_TABS = [
  { id: "latest", label: "Latest" },
  { id: "popular", label: "Popular" },
  { id: "upcoming", label: "Upcoming" },
];

const POPULAR_MOBILE_LIST = [
  "Best Mobile Phones Under 30000",
  "Best Mobile Phones Under 12000",
  "Best Mobile Phones Under 20000",
  "Best Mobile Phones Under 15000",
  "Samsung Galaxy S Series Mobile Phones",
  "Samsung Galaxy A Series Mobile Phones",
  "Samsung Galaxy Z Series Mobile Phones",
  "6000mAh Battery Mobile Phones",
  "Fast Charging Mobile Phones",
];

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
  if (diffHours < 24)
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
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

const NewsStoryMedia = ({ story, className = "" }) => {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [story?.image, story?.slug]);

  return (
    <div className={`relative overflow-hidden bg-slate-100 ${className}`}>
      {!imageError && story?.image ? (
        <img
          src={story.image}
          alt={story.title}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-6 text-center">
          <div className="max-w-xs">
            <h3 className="mt-3 text-base font-black leading-tight tracking-tight text-slate-900">
              {story?.title}
            </h3>
          </div>
        </div>
      )}
    </div>
  );
};

const HeroShareButtons = ({ title, url }) => {
  const [copied, setCopied] = useState(false);
  const fallbackUrl = typeof window !== "undefined" ? window.location.href : "";
  const currentUrl = url || fallbackUrl;

  const encodedUrl = encodeURIComponent(currentUrl || "");
  const encodedTitle = encodeURIComponent(title || "");

  const items = [
    {
      name: "Facebook",
      icon: FaFacebookF,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      name: "WhatsApp",
      icon: FaWhatsapp,
      url: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    },
    {
      name: "Twitter",
      icon: FaTwitter,
      url: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    },
  ];

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

  return (
    <div className="flex flex-wrap items-center gap-3">
      {items.map((item) => {
        const Icon = item.icon;
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

const StoryCard = ({ story }) => (
  <article className="group">
    <div className="flex items-center gap-3 pl-1">
      <span className="h-6 w-[2px] rounded-full bg-blue-600" />
      <time className="text-[15px] font-semibold tracking-[-0.01em] text-blue-700">
        {formatRelativeTime(story)}
      </time>
    </div>

    <div className="mt-3 overflow-hidden rounded-[28px] border border-slate-200 bg-white">
      <Link
        to={createNewsStoryPath(story.slug)}
        className="grid h-full gap-4 p-4 sm:p-5 md:grid-cols-[minmax(0,1fr)_11.75rem] md:items-stretch"
      >
        <div className="flex min-w-0 flex-col justify-between">
          <div>
            <h2
              className="mt-4 max-w-[26rem] text-[20px] font-black leading-[1.14] tracking-[-0.035em] text-slate-950 sm:max-w-[30rem] sm:text-[24px]"
              style={{ textWrap: "balance" }}
            >
              {story.title}
            </h2>
          </div>

          <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <span className="text-[15px] font-semibold text-blue-700">
              {story.author}
            </span>
            <span className="text-[13px] text-slate-500">
              {DATE_FORMATTER.format(parseStoryDate(story) || new Date())}
            </span>
          </div>
        </div>

        <div className="md:pt-1">
          <NewsStoryMedia story={story} className="aspect-[4/3] rounded-2xl" />
        </div>
      </Link>
    </div>
  </article>
);

const SidebarStoryCard = ({ story, highlighted = false }) => (
  <Link
    to={createNewsStoryPath(story.slug)}
    className={`group block rounded-[20px] border p-3 transition-colors duration-200 ${
      highlighted
        ? "border-blue-200 bg-white"
        : "border-slate-200 bg-white/80 hover:border-slate-300 hover:bg-white"
    }`}
  >
    <div className="grid gap-3 sm:grid-cols-[5.75rem_minmax(0,1fr)] sm:items-start">
      <NewsStoryMedia story={story} className="aspect-square rounded-[16px]" />

      <div className="min-w-0">
        <h3 className="mt-2 line-clamp-2 text-base font-semibold leading-6 text-slate-950 transition-colors group-hover:text-blue-700">
          {story.title}
        </h3>

        <div className="mt-4 flex items-center justify-between gap-2 text-xs text-slate-500">
          <span className="truncate font-medium text-slate-700">
            {story.author}
          </span>
          <span className="shrink-0">{formatRelativeTime(story)}</span>
        </div>
      </div>
    </div>
  </Link>
);

const ListPanel = ({ title, items }) => (
  <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white">
    <div className="px-5 pt-5 text-center">
      <h3 className="text-2xl font-bold tracking-[-0.03em] text-slate-700">
        {title}
      </h3>
    </div>

    <div className="mt-4 border-t border-slate-300" />

    <div className="divide-y divide-slate-200">
      {items.map((item) => (
        <Link
          key={item}
          to="/smartphones"
          className="block px-5 py-4 text-[16px] font-semibold leading-7 text-slate-600 transition-colors hover:text-blue-700"
        >
          {item}
        </Link>
      ))}
    </div>
  </section>
);

const SectionTitle = ({ title, subtitle = "", dark = false }) => (
  <div className="max-w-4xl">
    <div className="flex items-center gap-4">
      <h2
        className={`text-2xl font-black tracking-[-0.03em] sm:text-3xl ${
          dark ? "text-white" : "text-slate-700"
        }`}
      >
        {title}
      </h2>
      <span
        className={`h-px flex-1 ${dark ? "bg-white/35" : "bg-slate-200"}`}
      />
    </div>
    {subtitle ? (
      <p
        className={`mt-3 text-sm sm:text-base ${
          dark ? "text-white/70" : "text-slate-600"
        }`}
      >
        {subtitle}
      </p>
    ) : null}
  </div>
);

const NewsStoryPage = () => {
  const { slug = "" } = useParams();
  const { story, loading, error, notFound } = usePublicNewsStory(slug);
  const { stories: feedStories } = usePublicNewsFeed({ limit: 18 });
  const [sidebarTab, setSidebarTab] = useState("latest");

  const canonical = `https://tryhook.shop${createNewsStoryPath(slug)}`;

  const feedStoriesOrdered = useMemo(
    () =>
      [...feedStories].sort((a, b) => {
        const left = parseStoryDate(a)?.getTime() || 0;
        const right = parseStoryDate(b)?.getTime() || 0;
        return right - left;
      }),
    [feedStories],
  );

  const sidebarPool = useMemo(
    () => feedStoriesOrdered.filter((item) => item.slug !== story?.slug),
    [feedStoriesOrdered, story?.slug],
  );

  const sidebarStoriesByTab = useMemo(() => {
    const latest = sidebarPool.slice(0, 4);
    const popular = [...sidebarPool]
      .sort((left, right) => {
        const leftScore = left?.highlights?.length || 0;
        const rightScore = right?.highlights?.length || 0;
        if (rightScore !== leftScore) return rightScore - leftScore;
        const leftDate = parseStoryDate(left)?.getTime() || 0;
        const rightDate = parseStoryDate(right)?.getTime() || 0;
        return rightDate - leftDate;
      })
      .slice(0, 4);
    const upcoming = sidebarPool
      .filter(
        (item) =>
          item.category === "launches" ||
          /launch|upcoming|coming soon/i.test(`${item.title} ${item.summary}`),
      )
      .concat(
        sidebarPool.filter(
          (item) =>
            !(
              item.category === "launches" ||
              /launch|upcoming|coming soon/i.test(
                `${item.title} ${item.summary}`,
              )
            ),
        ),
      )
      .slice(0, 4);

    return { latest, popular, upcoming };
  }, [sidebarPool]);

  const sidebarStories =
    sidebarStoriesByTab[sidebarTab] || sidebarStoriesByTab.latest || [];

  const relatedStories = useMemo(
    () => buildRelatedNewsStories(feedStoriesOrdered, story, 5),
    [feedStoriesOrdered, story],
  );

  const recommendedStories = useMemo(() => {
    const relatedSlugs = new Set(relatedStories.map((item) => item.slug));
    return feedStoriesOrdered
      .filter(
        (item) => item.slug !== story?.slug && !relatedSlugs.has(item.slug),
      )
      .slice(0, 4);
  }, [feedStoriesOrdered, relatedStories, story?.slug]);

  const heroTimeLabel = formatPublishedLabel(story);
  const articleParagraphs =
    Array.isArray(story?.body) && story.body.length
      ? story.body
      : story?.summary
        ? [story.summary]
        : [];
  const storyTags = [
    story?.label,
    story?.category,
    story?.brandName,
    story?.productName,
    story?.authorRole,
  ]
    .filter(Boolean)
    .filter((value, index, list) => list.indexOf(value) === index)
    .slice(0, 3);
  const sourceLabel = story?.authorRole || story?.author || "Hooks newsroom";
  const canonicalUrl = canonical;

  const schema = story
    ? [
        createBreadcrumbSchema([
          { label: "Home", url: "https://tryhook.shop/" },
          { label: "News", url: "https://tryhook.shop/news" },
          { label: story.title, url: canonicalUrl },
        ]),
        createNewsArticleSchema({
          headline: story.title,
          description: story.summary,
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

  if (loading) {
    return (
      <main className="min-h-screen bg-white text-slate-900">
        <section className="bg-[#0b427e] text-white">
          <div className="mx-auto max-w-[1240px] px-4 py-12 sm:px-6 lg:px-8">
            <div className="h-10 w-48 animate-pulse rounded-full bg-white/15" />
            <div className="mt-6 h-20 max-w-4xl animate-pulse rounded-2xl bg-white/12" />
            <div className="mt-5 h-6 max-w-3xl animate-pulse rounded-full bg-white/12" />
            <div className="mt-8 grid gap-4 md:grid-cols-[minmax(0,1fr)_280px]">
              <div className="h-[18rem] animate-pulse rounded-[28px] bg-white/10" />
              <div className="space-y-4">
                <div className="h-[5.5rem] animate-pulse rounded-[20px] bg-white/10" />
                <div className="h-[5.5rem] animate-pulse rounded-[20px] bg-white/10" />
                <div className="h-[5.5rem] animate-pulse rounded-[20px] bg-white/10" />
              </div>
            </div>
          </div>
        </section>
        <section className="mx-auto max-w-[1240px] px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="space-y-6">
              <div className="h-10 w-2/3 animate-pulse rounded-full bg-slate-100" />
              <div className="h-32 animate-pulse rounded-[28px] bg-slate-100" />
              <div className="h-32 animate-pulse rounded-[28px] bg-slate-100" />
            </div>
            <div className="h-[40rem] animate-pulse rounded-[28px] bg-slate-100" />
          </div>
        </section>
      </main>
    );
  }

  if (notFound) {
    return <NotFound />;
  }

  if (!story) {
    return (
      <main className="min-h-screen bg-white text-slate-900">
        <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="rounded-[28px] border border-slate-200 p-6">
            <p className="text-base font-semibold text-slate-900">
              Story could not be loaded.
            </p>
            <p className="mt-2 text-sm text-slate-600">
              {error || "The newsroom story is unavailable right now."}
            </p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <>
      <SEO
        title={`${story.title} - Hooks`}
        description={story.summary}
        url={canonicalUrl}
        robots="index, follow"
        ogType="article"
        image={story.image}
        schema={schema}
      />

      <main className="min-h-screen bg-white text-slate-900">
        <section className="relative isolate overflow-hidden bg-gradient-to-br from-slate-950 via-blue-900 to-indigo-950 text-white">
          <div className="absolute inset-0 opacity-50 [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:72px_72px]" />
          <div className="absolute -top-40 -left-32 h-96 w-96 rounded-full bg-gradient-to-br from-cyan-500/30 to-blue-500/20 blur-3xl animate-pulse" />
          <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-gradient-to-tl from-purple-600/25 to-pink-500/15 blur-3xl animate-pulse" />
          <div className="absolute top-1/2 left-1/3 h-72 w-72 rounded-full bg-gradient-to-r from-indigo-600/20 to-transparent blur-3xl animate-pulse" />

          <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-6 lg:px-8 lg:pb-20 lg:pt-10">
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
                    <p className="text-sm text-white/65">{heroTimeLabel}</p>
                  </div>
                </div>

                <HeroShareButtons title={story.title} url={canonicalUrl} />
              </div>
            </div>
          </div>
        </section>

        <section className="relative bg-white">
          <div className="mx-auto max-w-7xl px-4 pt-12 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl">
              <NewsStoryMedia
                story={story}
                className="aspect-[4/3] rounded-[30px]"
              />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1240px] px-4 pb-16 pt-12 sm:px-6 lg:px-8 lg:pb-24 lg:pt-16">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <article className="min-w-0 lg:max-w-[760px]">
              <div className="space-y-8">
                <div className="max-w-[760px] space-y-6 text-[18px] leading-9 text-slate-700">
                  {(articleParagraphs.length
                    ? articleParagraphs
                    : [story.summary]
                  ).map((paragraph, index) => (
                    <p
                      key={`${story.slug}-paragraph-${index + 1}`}
                      className={index === 0 ? "text-[19px]" : ""}
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>

                <div className="rounded-[24px] border border-slate-200 bg-white p-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                      #Tags
                    </span>
                    {storyTags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <span className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Source
                    </span>
                    <span className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-semibold text-slate-700">
                      {sourceLabel}
                    </span>
                  </div>
                </div>

                <div className="overflow-hidden rounded-[26px] border border-slate-200 bg-[#222531] text-white">
                  <div className="grid gap-4 p-5 sm:grid-cols-[5.5rem_minmax(0,1fr)] sm:items-center sm:p-6">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-xl font-black uppercase">
                      {getInitials(story.author)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-2xl font-black tracking-[-0.03em]">
                        {story.author}
                      </p>
                      <p className="mt-1 text-sm text-white/65">
                        {story.authorRole || "News Editor"}
                      </p>
                    </div>
                  </div>
                  <div className="h-px bg-gradient-to-r from-orange-400 via-fuchsia-500 to-cyan-400" />
                  <div className="p-5 text-sm leading-7 text-white/75">
                    Hooks newsroom coverage focused on launch watch, mobile
                    updates, and clearer reading flow.
                  </div>
                  <div className="px-5 pb-5">
                    <HooksSignature variant="dark" />
                  </div>
                </div>
              </div>

              <section className="mt-14">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-bold tracking-[-0.03em] text-slate-700 sm:text-3xl">
                    Related Articles
                  </h2>
                  <span className="h-px flex-1 bg-slate-200" />
                </div>

                <div className="mt-8 rounded-[30px] bg-[#24305a] p-6 text-white">
                  <ol className="space-y-5">
                    {relatedStories.map((item, index) => (
                      <li
                        key={item.slug}
                        className="grid gap-4 border-b border-white/10 pb-5 last:border-b-0 last:pb-0 sm:grid-cols-[3rem_minmax(0,1fr)]"
                      >
                        <span className="text-2xl font-black text-white/90">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <Link
                          to={createNewsStoryPath(item.slug)}
                          className="text-lg font-semibold leading-7 text-white transition-colors hover:text-blue-200"
                        >
                          {item.title}
                        </Link>
                      </li>
                    ))}
                  </ol>
                </div>
              </section>

              <section className="mt-14">
                <SectionTitle
                  title="Recommended For You"
                  subtitle="More related reading from the newsroom."
                />

                <div className="mt-8 divide-y divide-slate-200">
                  {recommendedStories.map((item) => (
                    <article key={item.slug} className="py-5 first:pt-0">
                      <Link
                        to={createNewsStoryPath(item.slug)}
                        className="grid gap-4 sm:grid-cols-[7.5rem_minmax(0,1fr)] sm:items-center"
                      >
                        <NewsStoryMedia
                          story={item}
                          className="aspect-square rounded-[20px]"
                        />

                        <div className="min-w-0">
                          <h3 className="text-2xl font-semibold leading-[1.2] tracking-[-0.03em] text-slate-700">
                            {item.title}
                          </h3>
                          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                            <span>{item.author}</span>
                            <span>|</span>
                            <span>{formatRelativeTime(item)}</span>
                          </div>
                        </div>
                      </Link>
                    </article>
                  ))}
                </div>
              </section>
            </article>

            <aside className="space-y-6 lg:sticky lg:top-6">
              <section className="rounded-[28px] border border-slate-200 bg-[#fff0d8] p-4">
                <div className="mb-4 flex items-center gap-2 px-1 text-sm font-semibold uppercase tracking-[0.18em] text-orange-500">
                  <FaFire className="h-4 w-4" />
                  Trending News
                </div>

                <div className="rounded-[22px] border border-white/80 bg-white/80 p-2">
                  <div className="grid grid-cols-3 gap-2">
                    {SIDEBAR_TABS.map((tab) => {
                      const active = sidebarTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setSidebarTab(tab.id)}
                          className={`rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                            active
                              ? "bg-slate-100 text-slate-950"
                              : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                          }`}
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4 space-y-4">
                  {sidebarStories.map((item, index) => (
                    <SidebarStoryCard
                      key={item.slug}
                      story={item}
                      highlighted={index === 0}
                    />
                  ))}
                </div>

                <Link
                  to="/news"
                  className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-900 transition-colors hover:text-blue-700"
                >
                  View all stories
                  <FaArrowRight className="h-3.5 w-3.5" />
                </Link>
              </section>

              <ListPanel
                title="Popular Mobile List"
                items={POPULAR_MOBILE_LIST}
              />
            </aside>
          </div>
        </section>
      </main>
    </>
  );
};

export default NewsStoryPage;
