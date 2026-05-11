import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FaArrowRight, FaChevronRight, FaClock, FaFire } from "react-icons/fa";
import SEO from "../SEO";
import NewsPushOptInCard from "../News/NewsPushOptInCard";
import {
  createCollectionSchema,
  createItemListSchema,
} from "../../utils/schemaGenerators";
import {
  createNewsStoryPath,
  usePublicNewsFeed,
  useStoryListSchemaItems,
} from "../../hooks/usePublicNews";

const NEWS_GRID_LIMIT = 36;
const NEWS_MOBILE_QUERY = "(max-width: 639px)";

const NEWS_TOPICS = [
  { label: "Mobiles", matcher: (story) => isMobileStory(story) },
  { label: "Launches", matcher: (story) => getStoryBucket(story) === "launches" },
  { label: "Reviews", matcher: (story) => getStoryBucket(story) === "reviews" },
  { label: "Guides", matcher: (story) => getStoryBucket(story) === "guides" },
  { label: "Deals", matcher: (story) => /deal|sale|offer|discount/i.test(readStoryText(story)) },
];

const parseStoryTime = (story) => {
  const date = new Date(story?.publishedIso || story?.updatedIso || story?.publishedAt);
  const time = date.getTime();
  return Number.isNaN(time) ? 0 : time;
};

const formatStoryDate = (story) => story?.publishedAt || "Latest";

const readStoryText = (story) =>
  `${story?.title || ""} ${story?.summary || ""} ${story?.category || ""} ${
    story?.label || ""
  } ${story?.productType || ""} ${story?.brandName || ""}`.toLowerCase();

const isMobileStory = (story) => {
  const text = readStoryText(story);
  return (
    story?.productType === "smartphone" ||
    story?.category === "mobiles" ||
    /mobile|phone|smartphone|iphone|android|galaxy|nord|redmi|realme|vivo|oppo|oneplus|pixel/.test(
      text,
    )
  );
};

const getStoryBucket = (story) => {
  const text = readStoryText(story);

  if (/review|impression|hands-on|first look/.test(text)) return "reviews";
  if (/guide|how to|tips|trick|best|under|vs|compare|comparison/.test(text)) {
    return "guides";
  }
  if (/launch|launched|debut|announced|price|sale date|available/.test(text)) {
    return "launches";
  }
  return "features";
};

const scoreStory = (story, index) => {
  const ageHours = Math.max(0, (Date.now() - parseStoryTime(story)) / 36e5);
  const recencyScore = Math.max(0, 90 - ageHours / 8);
  const priorityScore =
    (story?.pinned ? 150 : 0) +
    (story?.trending ? 90 : 0) +
    (story?.featured ? 65 : 0);
  const mediaScore = story?.image ? 8 : 0;

  return priorityScore + recencyScore + mediaScore - index * 0.2;
};

const buildNewsLayout = (stories = []) => {
  const validStories = [...stories].filter((story) => story?.slug && story?.title);
  const ranked = [...validStories].sort(
    (left, right) => scoreStory(right, 0) - scoreStory(left, 0),
  );
  const recent = [...validStories].sort(
    (left, right) => parseStoryTime(right) - parseStoryTime(left),
  );
  const used = new Set();

  const take = (source, count, matcher = () => true) => {
    const picked = [];

    for (const story of source) {
      if (picked.length >= count) break;
      if (used.has(story.slug) || !matcher(story)) continue;
      used.add(story.slug);
      picked.push(story);
    }

    return picked;
  };

  const hero = take(ranked, 1)[0] || recent[0] || null;
  const spotlight = take(ranked, 4);
  const trending = ranked
    .filter((story) => story.trending || story.featured || story.pinned)
    .concat(ranked)
    .filter(
      (story, index, list) =>
        story?.slug && list.findIndex((item) => item.slug === story.slug) === index,
    )
    .slice(0, 8);
  const launches = take(ranked, 6, (story) => getStoryBucket(story) === "launches");
  const reviews = take(ranked, 4, (story) => getStoryBucket(story) === "reviews");
  const guides = take(ranked, 6, (story) => getStoryBucket(story) === "guides");
  const latest = recent.slice(0, 12);
  const topNews = take(ranked, 9);

  return {
    hero,
    spotlight,
    topNews: topNews.length ? topNews : latest.slice(0, 9),
    reviews,
    guides,
    launches,
    latest,
    trending,
    topics: NEWS_TOPICS.map((topic) => ({
      ...topic,
      count: validStories.filter(topic.matcher).length,
    })).filter((topic) => topic.count > 0),
  };
};

const useIsNewsMobileLayout = () => {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(NEWS_MOBILE_QUERY).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const mediaQuery = window.matchMedia(NEWS_MOBILE_QUERY);
    const syncLayout = () => setIsMobile(mediaQuery.matches);

    syncLayout();
    mediaQuery.addEventListener("change", syncLayout);

    return () => {
      mediaQuery.removeEventListener("change", syncLayout);
    };
  }, []);

  return isMobile;
};

const StoryImage = ({ story, className = "" }) => (
  <div className={`overflow-hidden bg-[#eaf0f8] ${className}`}>
    <img
      src={story?.image}
      alt={story?.heroImageAlt || story?.title || "News story"}
      loading="lazy"
      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
    />
  </div>
);

const StoryMeta = ({ story, light = false }) => (
  <div
    className={`mt-3 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.12em] ${
      light ? "text-white/72" : "text-[#7d8898]"
    }`}
  >
    <span>{story?.label || "News"}</span>
    <span className={light ? "text-white/35" : "text-[#c7d0dd]"}>|</span>
    <span>{formatStoryDate(story)}</span>
  </div>
);

const HeroStoryCard = ({ story }) => {
  if (!story) return null;

  return (
    <Link
      to={createNewsStoryPath(story.slug)}
      className="group relative isolate min-h-[20rem] overflow-hidden bg-[#111827] text-white sm:min-h-[30rem] lg:min-h-[34rem]"
    >
      <StoryImage story={story} className="absolute inset-0 h-full w-full opacity-70" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0b1020] via-[#1e3a8a]/60 to-transparent" />

      <div className="relative flex h-full min-h-[20rem] flex-col justify-end p-4 sm:min-h-[30rem] sm:p-7 lg:min-h-[34rem] lg:p-8">
        <div className="mb-4 inline-flex w-fit items-center gap-2 bg-white px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-[#2563eb]">
          <FaFire className="h-3 w-3 text-[#7c3aed]" />
          Top Story
        </div>
        <h1 className="line-clamp-3 max-w-4xl text-[23px] font-black leading-[1.08] tracking-[-0.04em] sm:text-[42px] lg:text-[52px]">
          {story.title}
        </h1>
        <p className="mt-3 line-clamp-3 max-w-2xl text-[14px] leading-6 text-white/82 sm:mt-4 sm:text-[17px] sm:leading-7">
          {story.summary}
        </p>
        <StoryMeta story={story} light />
      </div>
    </Link>
  );
};

const NewsGridCard = ({ story, compact = false, rowCard = false }) => (
  <Link
    to={createNewsStoryPath(story.slug)}
    className={`group block overflow-hidden bg-white transition-all hover:border-[#bfdbfe] ${
      rowCard
        ? "min-w-[84%] snap-start border border-[#dde7f3] sm:min-w-0"
        : "border border-[#e5e7eb]"
    }`}
  >
    <StoryImage
      story={story}
      className={
        rowCard
          ? "aspect-[16/9] w-full sm:aspect-[4/3]"
          : compact
            ? "aspect-[16/10] w-full"
            : "aspect-[4/3] w-full"
      }
    />
    <div className={rowCard ? "p-4 sm:p-4" : "p-3 sm:p-4"}>
      <StoryMeta story={story} />
      <h3
        className={`mt-2 font-semibold leading-[1.35] text-[#20242b] transition-colors group-hover:text-[#2563eb] ${
          compact
            ? "line-clamp-2 text-[14px]"
            : rowCard
              ? "line-clamp-2 text-[16px]"
              : "line-clamp-3 text-[16px]"
        }`}
      >
        {story.title}
      </h3>
      {!compact ? (
        <p className="mt-2 line-clamp-2 text-[13px] leading-6 text-[#667689]">
          {story.summary}
        </p>
      ) : null}
    </div>
  </Link>
);

const SpotlightList = ({ stories = [] }) => (
  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
    {stories.map((story) => (
      <Link
        key={story.slug}
        to={createNewsStoryPath(story.slug)}
        className="group grid grid-cols-[88px_minmax(0,1fr)] gap-3 border border-[#e5e7eb] bg-white p-2 transition-colors hover:border-[#bfdbfe] sm:grid-cols-[92px_minmax(0,1fr)]"
      >
        <StoryImage story={story} className="aspect-square w-full" />
        <div className="min-w-0 self-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#7c3aed]">
            {story.label || "News"}
          </p>
          <h3 className="mt-1 line-clamp-3 text-[14px] font-semibold leading-5 text-[#20242b] group-hover:text-[#2563eb]">
            {story.title}
          </h3>
        </div>
      </Link>
    ))}
  </div>
);

const SectionHeader = ({
  title,
  eyebrow,
  actionLabel = "More News",
  dark = false,
  singleRow = false,
}) => (
  <div
    className={`mb-4 flex items-end justify-between gap-4 border-b pb-3 ${
      dark ? "border-white/15" : "border-[#d9dee7]"
    }`}
  >
    <div>
      {eyebrow ? (
        <p
          className={`text-[11px] font-black uppercase tracking-[0.16em] ${
            dark ? "text-[#c4b5fd]" : "text-[#7c3aed]"
          }`}
        >
          {eyebrow}
        </p>
      ) : null}
      <h2
        className={`mt-1 text-[20px] font-black uppercase tracking-[-0.02em] ${
          dark ? "text-white" : "text-[#18212f]"
        }`}
      >
        {title}
      </h2>
    </div>
    <Link
      to="/news"
      className="hidden items-center gap-1 text-[12px] font-semibold text-[#2563eb] sm:inline-flex"
    >
      {actionLabel}
      <FaChevronRight className="h-2.5 w-2.5" />
    </Link>
    {singleRow ? (
      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#94a3b8] sm:hidden">
        Swipe
      </span>
    ) : null}
  </div>
);

const StorySection = ({
  title,
  eyebrow,
  stories = [],
  dark = false,
  singleRow = false,
}) => {
  if (!stories.length) return null;

  return (
    <section className={dark ? "bg-[#2b3038] p-4 sm:p-5" : ""}>
      <SectionHeader
        title={title}
        eyebrow={eyebrow}
        dark={dark}
        singleRow={singleRow}
      />
      <div className={singleRow ? "relative" : ""}>
        <div
          className={
            singleRow
              ? "-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3"
              : "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          }
        >
          {stories.map((story) => (
            <NewsGridCard
              key={story.slug}
              story={story}
              compact={dark}
              rowCard={singleRow}
            />
          ))}
        </div>
        {singleRow ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-4 right-0 top-0 w-10 bg-gradient-to-l from-[#f7f8fb] to-transparent sm:hidden"
          />
        ) : null}
      </div>
    </section>
  );
};

const SideList = ({ title, stories = [] }) => {
  if (!stories.length) return null;

  return (
    <section className="border border-[#e5e7eb] bg-white">
      <div className="bg-gradient-to-r from-[#2563eb] to-[#7c3aed] px-4 py-2 text-[12px] font-black uppercase tracking-[0.12em] text-white">
        {title}
      </div>
      <div className="divide-y divide-[#eceff3] p-3">
        {stories.map((story) => (
          <Link
            key={story.slug}
            to={createNewsStoryPath(story.slug)}
            className="group grid grid-cols-[72px_minmax(0,1fr)] gap-3 py-3 first:pt-0 last:pb-0"
          >
            <StoryImage story={story} className="aspect-[4/3] w-full" />
            <div className="min-w-0">
              <h3 className="line-clamp-3 text-[13px] font-semibold leading-5 text-[#20242b] group-hover:text-[#2563eb]">
                {story.title}
              </h3>
              <p className="mt-1 text-[11px] text-[#7d8898]">{formatStoryDate(story)}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

const LatestLaunches = ({ stories = [] }) => {
  if (!stories.length) return null;

  return (
    <section className="border border-[#e5e7eb] bg-white">
      <div className="bg-gradient-to-r from-[#2563eb] to-[#7c3aed] px-4 py-2 text-[12px] font-black uppercase tracking-[0.12em] text-white">
        Latest Launches
      </div>
      <div className="divide-y divide-[#edf0f4] p-3">
        {stories.slice(0, 6).map((story) => (
          <Link
            key={story.slug}
            to={createNewsStoryPath(story.slug)}
            className="group flex items-start gap-3 py-3 first:pt-0 last:pb-0"
          >
            <StoryImage story={story} className="h-16 w-16 shrink-0" />
            <div className="min-w-0">
              <h3 className="line-clamp-2 text-[13px] font-semibold leading-5 text-[#20242b] group-hover:text-[#2563eb]">
                {story.productName || story.title}
              </h3>
              <p className="mt-1 text-[11px] text-[#7d8898]">
                {story.brandName || story.label || "Launch"} | {formatStoryDate(story)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

const LoadingGrid = () => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: 9 }).map((_, index) => (
      <div key={index} className="animate-pulse border border-[#e5e7eb] bg-white">
        <div className="aspect-[4/3] bg-[#e9eef5]" />
        <div className="space-y-3 p-4">
          <div className="h-3 w-20 bg-[#e9eef5]" />
          <div className="h-4 w-full bg-[#e9eef5]" />
          <div className="h-4 w-3/4 bg-[#e9eef5]" />
        </div>
      </div>
    ))}
  </div>
);

const NewsArticlesPage = () => {
  const canonical = "https://tryhook.shop/news";
  const { stories, loading, error } = usePublicNewsFeed({ limit: NEWS_GRID_LIMIT });
  const storySchemaItems = useStoryListSchemaItems(stories);
  const layout = useMemo(() => buildNewsLayout(stories), [stories]);
  const isMobileLayout = useIsNewsMobileLayout();
  const display = useMemo(
    () => ({
      spotlight: layout.spotlight.slice(0, isMobileLayout ? 2 : 4),
      topNews: layout.topNews.slice(0, isMobileLayout ? 3 : 9),
      reviews: layout.reviews.slice(0, isMobileLayout ? 2 : 4),
      guides: layout.guides.slice(0, isMobileLayout ? 2 : 6),
      launches: layout.launches.slice(0, isMobileLayout ? 2 : 6),
      latest: layout.latest.slice(0, isMobileLayout ? 3 : 12),
      trendingSide: layout.trending.slice(0, isMobileLayout ? 3 : 5),
      recentSide: layout.latest.slice(0, isMobileLayout ? 3 : 6),
      launchSide: layout.launches.slice(0, isMobileLayout ? 3 : 6),
    }),
    [isMobileLayout, layout],
  );

  const pageSchema = [
    createCollectionSchema({
      name: "Hooks News & Articles",
      description:
        "Browse the latest tech news, mobile updates, gadget guides, and launch coverage on Hooks.",
      url: canonical,
      image: "https://tryhook.shop/hook-logo.svg",
    }),
    createItemListSchema({
      name: "Latest News & Articles",
      url: canonical,
      items: storySchemaItems,
    }),
  ];

  return (
    <>
      <SEO
        title="News & Articles - Latest Mobile News, Gadget Guides & Launch Updates - Hooks"
        description="Browse the latest mobile news, gadget updates, launch coverage, and editorial guides on Hooks."
        url={canonical}
        robots="index, follow"
        ogType="website"
        image="https://tryhook.shop/hook-logo.svg"
        schema={pageSchema}
      />
      <NewsPushOptInCard />

      <main className="bg-[#f7f8fb] text-[#111827]">
        <section>
          <div className="mx-auto max-w-[1280px] px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center gap-2 text-[12px] text-[#7d8898]">
              <Link to="/" className="hover:text-[#2563eb]">
                Home
              </Link>
              <FaChevronRight className="h-2.5 w-2.5 text-[#b6c2cf]" />
              <span className="font-semibold text-[#1f2937]">News & Articles</span>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-[1280px] px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
          {error ? (
            <div className="mb-6 border border-[#bfdbfe] bg-[#eff6ff] p-4 text-sm text-[#1d4ed8]">
              {error}
            </div>
          ) : null}

          {loading && !stories.length ? (
            <LoadingGrid />
          ) : (
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px] xl:items-start">
              <div className="space-y-7 sm:space-y-9">
                <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
                  <HeroStoryCard story={layout.hero} />
                  <SpotlightList stories={display.spotlight} />
                </section>

                <StorySection
                  title="Top News"
                  eyebrow="Trending Now"
                  stories={display.topNews}
                  singleRow
                />

                <StorySection
                  title="Reviews"
                  eyebrow="Hands-on"
                  stories={display.reviews}
                />

                <StorySection
                  title="Guides & Features"
                  eyebrow="Guides & Context"
                  stories={display.guides}
                />

                <StorySection
                  title="Launch Tracker"
                  eyebrow="Prices & Availability"
                  stories={display.launches}
                  dark
                />

                <StorySection
                  title="Recent Updates"
                  eyebrow="Latest"
                  stories={display.latest}
                />
              </div>

              <aside className="space-y-5 xl:sticky xl:top-6">
                <SideList title="Trending" stories={display.trendingSide} />
                <SideList title="Recent" stories={display.recentSide} />
                <LatestLaunches stories={display.launchSide} />

                <section className="border border-[#e5e7eb] bg-white p-4">
                  <div className="flex items-center gap-2 text-[12px] font-black uppercase tracking-[0.14em] text-[#7c3aed]">
                    <FaClock className="h-3.5 w-3.5" />
                    How We Rank
                  </div>
                  <p className="mt-3 text-[13px] leading-6 text-[#667689]">
                    Trending uses pinned, trending, featured, freshness, and image
                    signals. Recent is sorted strictly by publish time.
                  </p>
                  <Link
                    to="/news"
                    className="mt-4 inline-flex items-center gap-2 text-[13px] font-semibold text-[#2563eb]"
                  >
                    Explore all stories
                    <FaArrowRight className="h-3 w-3" />
                  </Link>
                </section>
              </aside>
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default NewsArticlesPage;
