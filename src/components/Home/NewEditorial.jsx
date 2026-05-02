import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FaArrowRight, FaFire } from "react-icons/fa";
import { createNewsStoryPath } from "../../hooks/usePublicNews";

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const TOPIC_IGNORE_LIST = new Set(["news", "newsroom", "hooks"]);

const parseStoryDate = (story) => {
  const rawDate =
    story?.publishedIso || story?.updatedIso || story?.publishedAt;
  const date = new Date(rawDate);
  return Number.isNaN(date.getTime()) ? null : date;
};

const compareStoriesByDate = (left, right) => {
  const leftDate = parseStoryDate(left)?.getTime() || 0;
  const rightDate = parseStoryDate(right)?.getTime() || 0;
  return rightDate - leftDate;
};

const stripMarkup = (value) =>
  String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const clipText = (value, maxWords = 26) => {
  const words = stripMarkup(value).split(/\s+/).filter(Boolean);

  if (words.length <= maxWords) return words.join(" ");
  return `${words.slice(0, maxWords).join(" ")}...`;
};

const getStoryCategory = (story) =>
  stripMarkup(story?.label || story?.category || "News");

const getStorySummary = (story, maxWords = 28) => {
  const summary =
    stripMarkup(story?.summary) ||
    stripMarkup(story?.excerpt) ||
    stripMarkup(story?.description);

  if (summary) return clipText(summary, maxWords);

  if (Array.isArray(story?.highlights) && story.highlights.length) {
    return clipText(story.highlights.join(" "), maxWords);
  }

  return clipText(story?.title, maxWords);
};

const formatRelativeLabel = (story) => {
  const date = parseStoryDate(story);
  if (!date) return story?.publishedAt || "Recently";

  const diffHours = Math.round(
    (Date.now() - date.getTime()) / (1000 * 60 * 60),
  );

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  }

  return DATE_FORMATTER.format(date);
};

const formatAbsoluteLabel = (story) => {
  const date = parseStoryDate(story);
  if (!date) return story?.publishedAt || "Recent update";
  return DATE_FORMATTER.format(date);
};

const formatByline = (story) => `Written by ${story?.author || "Hooks Desk"}`;

const extractTopicCandidates = (story) =>
  [
    story?.brandName,
    story?.productName,
    story?.label,
    story?.category,
    ...(Array.isArray(story?.tags) ? story.tags : []),
  ]
    .map((value) => stripMarkup(value))
    .filter((value) => value && !TOPIC_IGNORE_LIST.has(value.toLowerCase()));

const buildTopicCollections = (stories = []) => {
  const latest = [];
  const counts = new Map();

  stories.forEach((story) => {
    extractTopicCandidates(story).forEach((label) => {
      const key = label.toLowerCase();

      if (!latest.some((topic) => topic.key === key)) {
        latest.push({ key, label });
      }

      const current = counts.get(key) || { label, count: 0 };
      counts.set(key, {
        label: current.label || label,
        count: current.count + 1,
      });
    });
  });

  const popular = [...counts.entries()]
    .sort((left, right) => {
      if (right[1].count !== left[1].count) {
        return right[1].count - left[1].count;
      }
      return left[1].label.localeCompare(right[1].label);
    })
    .map(([key, value]) => ({ key, label: value.label }));

  return {
    latest: latest.slice(0, 10),
    popular: popular.slice(0, 10),
  };
};

const StoryMedia = ({ story, className = "", eager = false }) => {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [story?.image, story?.slug]);

  const hasImage = Boolean(story?.image) && !imageError;

  return (
    <div className={`relative overflow-hidden bg-[#ededed] ${className}`}>
      {hasImage ? (
        <img
          src={story.image}
          alt={story.title}
          className="h-full w-full object-cover"
          loading={eager ? "eager" : "lazy"}
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="flex h-full items-end bg-gradient-to-br from-[#0f172a] via-[#1e3a8a] to-[#2563eb] p-5 text-white">
          <div className="max-w-[15rem]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">
              {getStoryCategory(story)}
            </p>
            <h3 className="mt-3 text-base font-black leading-tight">
              {story?.title || "Hooks Newsroom"}
            </h3>
          </div>
        </div>
      )}
    </div>
  );
};

const LoadingState = () => (
  <div className="mt-8 space-y-10">
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1.5fr)_360px]">
      <div className="h-[400px] animate-pulse rounded-[22px] bg-[#e9edf4]" />
      <div className="space-y-4">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="h-[92px] animate-pulse rounded-lg bg-[#eef2f7]"
          />
        ))}
      </div>
    </div>

    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-5">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="h-[200px] animate-pulse rounded-lg bg-[#eef2f7]"
          />
        ))}
      </div>
      <div className="space-y-5">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="h-[200px] animate-pulse rounded-lg bg-[#f3f6fb]"
          />
        ))}
      </div>
    </div>
  </div>
);

const EmptyState = () => (
  <div className="mt-8 rounded-lg bg-[#f7faff] p-8">
    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#1d4ed8]">
      Hooks Newsroom
    </p>
    <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-[#111111]">
      No stories published yet
    </h2>
    <p className="mt-4 max-w-2xl text-[15px] leading-7 text-[#575757]">
      Publish a story from the admin newsroom and it will appear here
      automatically.
    </p>
    <Link
      to="/"
      className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#111111] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#22304d]"
    >
      Go back home
      <FaArrowRight className="h-3.5 w-3.5" />
    </Link>
  </div>
);

const ErrorState = ({ error = "" }) => (
  <div className="mt-8 rounded-lg bg-[#f7faff] p-8">
    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#1d4ed8]">
      Hooks Newsroom
    </p>
    <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-[#111111]">
      We could not load the news feed
    </h2>
    <p className="mt-4 max-w-2xl text-[15px] leading-7 text-[#4b5f82]">
      {error || "Please try again in a moment."}
    </p>
    <Link
      to="/"
      className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#1d4ed8] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1e40af]"
    >
      Return home
      <FaArrowRight className="h-3.5 w-3.5" />
    </Link>
  </div>
);

const LeadStoryCard = ({ story }) => {
  if (!story) return null;

  return (
    <Link
      to={createNewsStoryPath(story.slug)}
      className="group overflow-hidden rounded-[22px] bg-white lg:grid lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]"
    >
      <StoryMedia
        story={story}
        className="aspect-[16/9] w-full lg:h-full lg:min-h-[320px] lg:aspect-auto"
        eager
      />

      <div className="p-4 sm:p-5 lg:p-6">
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#767676]">
          <span className="inline-flex rounded-full bg-[#e8f0ff] px-3 py-1 text-[#1d4ed8]">
            {getStoryCategory(story)}
          </span>
          <span>{formatAbsoluteLabel(story)}</span>
        </div>

        <h2
          className="mt-3 text-[22px] font-black leading-[1.08] tracking-[-0.04em] text-[#121212] transition-colors group-hover:text-[#1d4ed8] sm:text-[28px] lg:text-[32px]"
          style={{ textWrap: "balance" }}
        >
          {story.title}
        </h2>

        <p className="mt-3 max-w-3xl text-[14px] leading-7 text-[#555555] sm:text-base">
          {getStorySummary(story, 30)}
        </p>

        {Array.isArray(story?.highlights) && story.highlights.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {story.highlights.slice(0, 3).map((highlight) => (
              <span
                key={highlight}
                className="rounded-full border border-[#dde5f1] bg-[#f7f9fc] px-3 py-1.5 text-[12px] font-medium text-[#4a4a4a]"
              >
                {highlight}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-5 flex flex-col items-start gap-3 border-t border-[#ebeff5] pt-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm font-semibold text-[#252525]">
            {formatByline(story)}
          </span>
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#1d4ed8]">
            Read story
            <FaArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </div>
    </Link>
  );
};

const TopStoryCard = ({ story, index }) => {
  if (!story) return null;

  return (
    <Link
      to={createNewsStoryPath(story.slug)}
      className="group block border-b border-[#dfe5ee] py-4 transition-colors last:border-b-0 last:pb-0 first:pt-0"
    >
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#1d4ed8]">
          Top Story {index + 1}
        </p>

        <h3 className="mt-2 text-[15px] font-bold leading-[1.32] text-[#171717] transition-colors group-hover:text-[#1d4ed8] sm:text-[16px]">
          {story.title}
        </h3>

        <div className="mt-4 grid grid-cols-[minmax(0,1fr)_84px] items-start gap-3 sm:grid-cols-[minmax(0,1fr)_104px]">
          <p className="line-clamp-2 text-[13px] leading-6 text-[#5d5d5d] sm:line-clamp-3">
            {getStorySummary(story, 18)}
          </p>

          <StoryMedia
            story={story}
            className="aspect-[4/3] w-full rounded-lg border border-[#e9edf3]"
          />
        </div>

        <p className="mt-4 text-[11px] uppercase tracking-[0.18em] text-[#828282]">
          {getStoryCategory(story)} | {formatAbsoluteLabel(story)}
        </p>
      </div>
    </Link>
  );
};

const FeedStoryCard = ({ story }) => {
  if (!story) return null;

  return (
    <article className="py-4 first:pt-0 sm:py-6">
      <Link
        to={createNewsStoryPath(story.slug)}
        className="group grid gap-4 rounded-lg bg-[#fbfdff] p-4 transition-all duration-300 hover:bg-white sm:grid-cols-[minmax(0,1fr)_190px] sm:gap-5 sm:rounded-none sm:bg-transparent sm:p-0"
      >
        <div className="order-2 min-w-0 sm:order-1">
          <h3
            className="text-[18px] font-black leading-[1.16] tracking-[-0.035em] text-[#171717] transition-colors group-hover:text-[#1d4ed8] sm:text-[22px]"
            style={{ textWrap: "balance" }}
          >
            {story.title}
          </h3>

          <p className="mt-3 text-[14px] leading-7 text-[#555555] sm:text-[15px]">
            {getStorySummary(story, 28)}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2.5 text-[13px] text-[#646464] sm:gap-3 sm:text-sm">
            <span className="font-semibold text-[#242424]">
              {formatByline(story)}
            </span>
            <span className="h-1 w-1 rounded-full bg-[#cccccc]" />
            <span>{formatRelativeLabel(story)}</span>
          </div>
        </div>

        <StoryMedia
          story={story}
          className="order-1 aspect-[16/10] w-full rounded-lg border border-[#e9edf3] sm:order-2"
        />
      </Link>
    </article>
  );
};

const PopularStoryCard = ({ story, index }) => {
  if (!story) return null;

  return (
    <Link
      to={createNewsStoryPath(story.slug)}
      className="group grid grid-cols-[2.25rem_minmax(0,1fr)] items-start gap-3 border-b border-[#e2e8f0] py-4 transition-colors last:border-b-0 last:pb-0 first:pt-0 sm:grid-cols-[2.75rem_minmax(0,1fr)] sm:gap-4 sm:py-5"
    >
      <span className="pt-0.5 text-[21px] font-black leading-none tracking-[-0.04em] text-[#1d4ed8] tabular-nums sm:text-[24px]">
        {String(index + 1).padStart(2, "0")}
      </span>

      <div className="min-w-0">
        <h3 className="text-[14px] font-semibold leading-[1.32] text-[#161616] transition-colors group-hover:text-[#1d4ed8] sm:text-[16px]">
          {story.title}
        </h3>

        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-medium uppercase tracking-[0.18em] text-[#7d8898] sm:text-[11px]">
          <span>{getStoryCategory(story)}</span>
          <span className="h-1 w-1 rounded-full bg-[#c6d1df]" />
          <span className="whitespace-nowrap">
            {formatAbsoluteLabel(story)}
          </span>
        </div>
      </div>
    </Link>
  );
};

const SidebarStoryCard = ({ story }) => {
  if (!story) return null;

  return (
    <Link
      to={createNewsStoryPath(story.slug)}
      className="group grid grid-cols-[68px_minmax(0,1fr)] items-start gap-3 border-b border-[#e2e8f0] py-4 transition-colors last:border-b-0 last:pb-0 first:pt-0 sm:grid-cols-[76px_minmax(0,1fr)]"
    >
      <StoryMedia
        story={story}
        className="aspect-[4/3] w-full rounded-lg border border-[#e9edf3]"
      />

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-medium uppercase tracking-[0.18em] text-[#7d8898] sm:text-[11px]">
          <span className="text-[#1d4ed8]">{getStoryCategory(story)}</span>
          <span className="h-1 w-1 rounded-full bg-[#c6d1df]" />
          <span className="whitespace-nowrap">
            {formatAbsoluteLabel(story)}
          </span>
        </div>

        <h3 className="mt-2 text-[13px] font-semibold leading-[1.3] text-[#171717] transition-colors group-hover:text-[#1d4ed8] sm:text-[15px]">
          {story.title}
        </h3>
      </div>
    </Link>
  );
};

const TopicChip = ({ label }) => (
  <span className="inline-flex rounded-full border border-[#dbe5f4] bg-[#f3f7ff] px-3 py-2 text-[12px] font-medium text-[#344256] sm:text-[13px]">
    {label}
  </span>
);

const NewEditorial = ({ stories = [], loading = false, error = "" }) => {
  const orderedStories = useMemo(
    () =>
      Array.isArray(stories)
        ? [...stories].filter(Boolean).sort(compareStoriesByDate)
        : [],
    [stories],
  );

  const topicCollections = useMemo(
    () => buildTopicCollections(orderedStories),
    [orderedStories],
  );

  const heroStory = orderedStories[0] || null;
  const topStories = orderedStories.slice(1, 5);
  const promotedCount = 1 + topStories.length;
  const feedStories = orderedStories.slice(promotedCount);
  const fallbackFeedStories =
    feedStories.length > 0
      ? feedStories
      : orderedStories.slice(topStories.length + 1);

  const popularStories = useMemo(
    () =>
      [...orderedStories]
        .sort((left, right) => {
          const leftScore = Array.isArray(left?.highlights)
            ? left.highlights.length
            : 0;
          const rightScore = Array.isArray(right?.highlights)
            ? right.highlights.length
            : 0;

          if (rightScore !== leftScore) return rightScore - leftScore;
          return compareStoriesByDate(left, right);
        })
        .slice(0, 5),
    [orderedStories],
  );

  const sidebarPicks = orderedStories.slice(1, 4);
  const headerTopics = topicCollections.latest.slice(0, 7);
  const latestTopics = topicCollections.latest.slice(0, 8);
  const popularTopics = topicCollections.popular.slice(0, 8);

  const hasStories = orderedStories.length > 0;
  const showLoadingState = loading && !hasStories;
  const showErrorState = !loading && Boolean(error) && !hasStories;
  const showEmptyState = !loading && !error && !hasStories;

  return (
    <main className="min-h-screen bg-[#f6f8fc] text-[#111111]">
      <section className="border-b border-[#e2e2e2]">
        <div className="mx-auto max-w-[1280px] px-4 pb-10 pt-6 sm:px-6 sm:pb-12 sm:pt-8 lg:px-8">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a8a8a]">
            <Link to="/" className="transition-colors hover:text-[#1d4ed8]">
              Home
            </Link>
            <span>/</span>
            <span className="text-[#1a1a1a]">News</span>
          </div>

          <div className="mt-5">
            <div className="max-w-4xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#1d4ed8]">
                Hooks Newsroom
              </p>
              <h2 className="mt-3 text-[28px] font-black leading-[1.02] tracking-[-0.05em] text-[#121212] sm:text-[44px] lg:text-[50px]">
                Technology News & Articles
              </h2>
              <p className="mt-4 max-w-3xl text-[14px] leading-7 text-[#575757] sm:text-base">
                Fresh gadget launches, mobile updates, reviews, buying guides,
                and editorial coverage arranged in a cleaner, more
                newspaper-like reading flow.
              </p>
            </div>
          </div>

          {headerTopics.length ? (
            <div className="mt-8 border-t border-[#ececec] pt-5">
              <div className="no-scrollbar -mx-4 overflow-x-auto px-4 sm:mx-0 sm:overflow-visible sm:px-0">
                <div className="flex min-w-max gap-2.5 sm:min-w-0 sm:flex-wrap sm:gap-3">
                  {headerTopics.map((topic) => (
                    <TopicChip key={topic.key} label={topic.label} />
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {showLoadingState ? <LoadingState /> : null}
          {showErrorState ? <ErrorState error={error} /> : null}
          {showEmptyState ? <EmptyState /> : null}

          {hasStories ? (
            <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_360px] xl:gap-8">
              <div>
                <div className="mb-4 flex items-center justify-between gap-4 border-b border-[#e5e5e5] pb-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#1d4ed8]">
                      Top Story
                    </p>
                    <h2 className="mt-2 text-[24px] font-black tracking-[-0.04em] text-[#141414]">
                      Lead Coverage
                    </h2>
                  </div>
                </div>

                <LeadStoryCard story={heroStory} />
              </div>

              <aside>
                <div className="rounded-lg bg-[#f8fbff] p-4 sm:p-5">
                  <div className="flex items-center gap-2 text-[#1d4ed8]">
                    <FaFire className="h-4 w-4" />
                    <p className="text-[11px] font-bold uppercase tracking-[0.24em]">
                      Top Stories
                    </p>
                  </div>

                  <h2 className="mt-3 text-[20px] font-black tracking-[-0.04em] text-[#171717] sm:text-[22px]">
                    Most Recent Coverage
                  </h2>

                  <div className="mt-4">
                    {(topStories.length
                      ? topStories
                      : orderedStories.slice(1, 5)
                    ).map((story, index) => (
                      <TopStoryCard
                        key={story.slug || `${story.title}-${index}`}
                        story={story}
                        index={index}
                      />
                    ))}
                  </div>
                </div>
              </aside>
            </div>
          ) : null}
        </div>
      </section>

      {hasStories ? (
        <section className="bg-white">
          <div className="mx-auto max-w-[1280px] px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-10">
              <div className="order-2 lg:order-1">
                <div className="flex items-end justify-between gap-4 border-b border-[#dfdfdf] pb-4">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#1d4ed8]">
                      Technology News
                    </p>
                    <h2 className="mt-2 text-[22px] font-black tracking-[-0.04em] text-[#151515] sm:text-[24px]">
                      Latest Updates
                    </h2>
                  </div>

                  <span className="hidden text-sm text-[#727272] sm:block">
                    {fallbackFeedStories.length} stories in the main feed
                  </span>
                </div>

                <div className="divide-y divide-[#e3e3e3] pt-2">
                  {fallbackFeedStories.map((story) => (
                    <FeedStoryCard key={story.slug} story={story} />
                  ))}
                </div>
              </div>

              <aside className="order-1 space-y-6 lg:order-2 lg:sticky lg:top-6 lg:self-start">
                <div className="rounded-lg bg-[#f8fbff] p-5">
                  <div className="flex items-center gap-2 text-[#1d4ed8]">
                    <FaFire className="h-4 w-4" />
                    <p className="text-[11px] font-bold uppercase tracking-[0.24em]">
                      Popular
                    </p>
                  </div>

                  <h2 className="mt-3 text-[20px] font-black tracking-[-0.04em] text-[#171717] sm:text-[21px]">
                    Trending Reads
                  </h2>

                  <div className="mt-5">
                    {popularStories.map((story, index) => (
                      <PopularStoryCard
                        key={story.slug || `${story.title}-${index}`}
                        story={story}
                        index={index}
                      />
                    ))}
                  </div>
                  {sidebarPicks.length ? (
                    <div className="mt-6 border-t border-[#d9e4f1] pt-6">
                      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#1d4ed8]">
                        More Stories
                      </p>

                      <div className="mt-4">
                        {sidebarPicks.map((story) => (
                          <SidebarStoryCard key={story.slug} story={story} />
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="hidden rounded-lg bg-white p-5 md:block">
                  <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#1d4ed8]">
                    Topics
                  </p>
                  <h2 className="mt-3 text-[20px] font-black tracking-[-0.04em] text-[#171717] sm:text-[21px]">
                    Trending Gadgets & Topics
                  </h2>

                  <div className="mt-5 space-y-5">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#8a8a8a]">
                        Latest
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {latestTopics.map((topic) => (
                          <TopicChip
                            key={`latest-${topic.key}`}
                            label={topic.label}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-[#ededed] pt-5">
                      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#8a8a8a]">
                        Popular
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {popularTopics.map((topic) => (
                          <TopicChip
                            key={`popular-${topic.key}`}
                            label={topic.label}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
};

export default NewEditorial;
