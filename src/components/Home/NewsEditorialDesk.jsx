import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FaArrowRight, FaFire, FaRegNewspaper } from "react-icons/fa";
import { NEWS_BRAND_STYLES } from "./newsBrandStyles";
import { createNewsStoryPath } from "../../hooks/usePublicNews";

const SIDEBAR_TABS = [
  { id: "latest", label: "Latest" },
  { id: "popular", label: "Popular" },
  { id: "upcoming", label: "Upcoming" },
];

const TOPIC_CHIPS = ["#android", "#samsung", "#apple", "#iphone"];

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const parseStoryDate = (story) => {
  const rawDate =
    story?.publishedIso || story?.updatedIso || story?.publishedAt;
  const date = new Date(rawDate);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getStoryTimestamp = (story) => parseStoryDate(story)?.getTime() || 0;

const compareStoriesByDate = (left, right) =>
  getStoryTimestamp(right) - getStoryTimestamp(left);

const formatTimelineLabel = (story) => {
  const date = parseStoryDate(story);
  if (!date) return story?.publishedAt || "Recent update";

  const diffHours = Math.round(
    (Date.now() - date.getTime()) / (1000 * 60 * 60),
  );
  if (diffHours < 1) return "Just now";
  if (diffHours < 24) {
    return `${diffHours} Hour${diffHours === 1 ? "" : "s"} Ago`;
  }

  return dateFormatter.format(date);
};

const formatSidebarStamp = (story) => formatTimelineLabel(story);

const StoryImage = ({ story, className = "" }) => {
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
        <div className="flex h-full items-center justify-center bg-slate-200 p-4 text-center">
          <div className="max-w-[12rem]">
            <p className={NEWS_BRAND_STYLES.eyebrow}>
              {story?.label || "Newsroom"}
            </p>
            <h3 className="mt-3 text-sm font-black leading-tight tracking-tight text-slate-900">
              {story?.title}
            </h3>
          </div>
        </div>
      )}
    </div>
  );
};

const TimelineStoryCard = ({ story }) => (
  <article className="group">
    <div className="flex items-center gap-3 pl-1">
      <span className="h-6 w-[2px] rounded-full bg-blue-600" />
      <time className="text-[15px] font-semibold tracking-[-0.01em] text-blue-700">
        {formatTimelineLabel(story)}
      </time>
    </div>

    <div className="mt-3 overflow-hidden rounded-xl border border-slate-300 bg-white">
      <Link
        to={createNewsStoryPath(story.slug)}
        className="grid h-full gap-4 p-5 sm:p-6 md:grid-cols-[minmax(0,1fr)_9rem] md:items-stretch"
      >
        <div className="flex min-w-0 flex-col justify-between">
          <div>
            <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-[11px] font-semibold capitalize tracking-[0.02em] text-blue-700">
              {story.label || "News"}
            </span>

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
              {story.publishedAt}
            </span>
          </div>
        </div>

        <div className="md:pt-1">
          <StoryImage story={story} className="aspect-square rounded-xl" />
        </div>
      </Link>
    </div>
  </article>
);

const SidebarStoryCard = ({ story, highlighted = false }) => (
  <Link
    to={createNewsStoryPath(story.slug)}
    className={`group block rounded-xl border p-3 transition-colors duration-200 ${
      highlighted
        ? "border-blue-400 bg-blue-50"
        : "border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50"
    }`}
  >
    <div className="grid gap-3 sm:grid-cols-[5.75rem_minmax(0,1fr)] sm:items-start">
      <StoryImage story={story} className="aspect-square rounded-xl" />

      <div className="min-w-0">
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold capitalize tracking-[0.02em] text-slate-600">
          {story.label || "News"}
        </span>

        <h3 className="mt-2 line-clamp-2 text-base font-semibold leading-6 text-slate-950 transition-colors group-hover:text-blue-700">
          {story.title}
        </h3>

        <div className="mt-4 flex items-center justify-between gap-2 text-xs text-slate-500">
          <span className="truncate font-medium text-slate-700">
            {story.author}
          </span>
          <span className="shrink-0">{formatSidebarStamp(story)}</span>
        </div>
      </div>
    </div>
  </Link>
);

const FeedSkeleton = () => (
  <div className="space-y-10">
    {[1, 2, 3].map((item) => (
      <article key={item}>
        <div className="flex items-center gap-3 pl-1">
          <span className="h-6 w-px bg-blue-600" />
          <div className="h-4 w-32 rounded-full bg-slate-300" />
        </div>

        <div className="mt-3 overflow-hidden rounded-xl border border-slate-300 bg-white p-4">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_12.5rem]">
            <div className="space-y-4 p-1 sm:p-2">
              <div className="h-6 w-24 rounded-full bg-slate-300" />
              <div className="h-8 w-full rounded-xl bg-slate-300" />
              <div className="h-8 w-5/6 rounded-xl bg-slate-300" />
              <div className="h-16 w-full rounded-xl bg-slate-300" />
              <div className="h-4 w-36 rounded-full bg-slate-300" />
            </div>
            <div className="aspect-[4/3] rounded-xl bg-slate-300" />
          </div>
        </div>
      </article>
    ))}
  </div>
);

const SidebarSkeleton = () => (
  <div className="rounded-xl border border-slate-300 bg-white p-4">
    <div className="rounded-xl border border-slate-300 bg-slate-50 p-2">
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3].map((item) => (
          <div key={item} className="h-11 rounded-xl bg-slate-300" />
        ))}
      </div>
    </div>

    <div className="mt-4 space-y-4">
      {[1, 2, 3, 4].map((item) => (
        <div
          key={item}
          className="rounded-xl border border-slate-300 bg-white p-3"
        >
          <div className="grid gap-3 sm:grid-cols-[5.75rem_minmax(0,1fr)]">
            <div className="aspect-square rounded-xl bg-slate-300" />
            <div className="space-y-3">
              <div className="h-4 w-20 rounded-full bg-slate-300" />
              <div className="h-6 w-full rounded-xl bg-slate-300" />
              <div className="h-4 w-28 rounded-full bg-slate-300" />
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const NewsEditorialDesk = ({ stories = [], loading = false, error = "" }) => {
  const [sidebarTab, setSidebarTab] = useState("latest");

  const orderedStories = useMemo(
    () => [...stories].sort(compareStoriesByDate),
    [stories],
  );

  const feedStories = orderedStories.slice(0, 4);
  const sidebarPool = orderedStories.slice(4).length
    ? orderedStories.slice(4)
    : orderedStories;

  const sidebarStoriesByTab = useMemo(() => {
    const latest = sidebarPool.slice(0, 4);

    const popular = [...sidebarPool]
      .sort((left, right) => {
        const leftScore = left?.highlights?.length || 0;
        const rightScore = right?.highlights?.length || 0;
        if (rightScore !== leftScore) return rightScore - leftScore;
        return compareStoriesByDate(left, right);
      })
      .slice(0, 4);

    const upcoming = [...sidebarPool]
      .filter(
        (story) =>
          story.category === "launches" ||
          /launch|upcoming|coming soon/i.test(
            `${story.title} ${story.summary}`,
          ),
      )
      .concat(
        sidebarPool.filter(
          (story) =>
            !(
              story.category === "launches" ||
              /launch|upcoming|coming soon/i.test(
                `${story.title} ${story.summary}`,
              )
            ),
        ),
      )
      .slice(0, 4);

    return { latest, popular, upcoming };
  }, [sidebarPool]);

  const sidebarStories =
    sidebarStoriesByTab[sidebarTab] ||
    sidebarStoriesByTab.latest ||
    orderedStories.slice(0, 4) ||
    [];

  const hasStories = orderedStories.length > 0;

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <section className="border-b border-slate-300">
        <div className="mx-auto max-w-[1240px] px-4 pb-8 pt-6 sm:px-6 sm:pb-10 lg:px-8 lg:pb-12 lg:pt-10">
          <div className="max-w-4xl">
            <div className="mt-2 flex items-center gap-4">
              <h1
                className="max-w-2xl text-4xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl lg:text-6xl"
                style={{ textWrap: "balance" }}
              >
                Latest News
              </h1>
              <span className="hidden h-px flex-1 bg-gradient-to-r from-blue-600 via-fuchsia-500 to-orange-400 lg:block" />
            </div>

            <p className={`mt-4 max-w-3xl ${NEWS_BRAND_STYLES.bodyLarge}`}>
              Explore the latest mobile stories, article updates, and launch
              coverage from the Hooks newsroom.
            </p>
          </div>

          <div className="mt-8 flex items-center gap-4 overflow-hidden rounded-full border border-slate-300 bg-white p-2">
            <div className="flex items-center gap-2 px-3 text-sm font-semibold text-orange-500">
              <FaFire className="h-4 w-4" />
              Trending
            </div>

            <div className="flex gap-3 overflow-x-auto pr-3">
              {TOPIC_CHIPS.map((chip, index) => (
                <button
                  key={chip}
                  type="button"
                  className={`whitespace-nowrap rounded-full border px-5 py-2 text-sm font-semibold transition-colors duration-300 ${
                    index === 0
                      ? "border-blue-400 bg-blue-100 text-blue-700"
                      : "border-slate-300 bg-slate-100 text-slate-700 hover:border-slate-400 hover:bg-slate-200"
                  }`}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        {loading && !hasStories ? (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <FeedSkeleton />
            <SidebarSkeleton />
          </div>
        ) : null}

        {!loading && error && !hasStories ? (
          <div className="rounded-xl border border-red-300 bg-red-50 p-6">
            <p className="text-base font-semibold text-red-700">
              The newsroom could not load right now.
            </p>
            <p className="mt-2 text-sm text-red-600">{error}</p>
          </div>
        ) : null}

        {!loading && !error && !hasStories ? (
          <div className="rounded-xl border border-blue-300 bg-blue-50 p-6">
            <p className="text-base font-semibold text-blue-700">
              No published stories yet.
            </p>
            <p className="mt-2 text-sm text-blue-600">
              Publish a story from the admin newsroom and it will appear here
              automatically.
            </p>
          </div>
        ) : null}

        {hasStories ? (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="space-y-8 lg:max-w-[600px]">
              {feedStories.map((story) => (
                <TimelineStoryCard key={story.slug} story={story} />
              ))}
            </div>

            <aside className="space-y-5 lg:sticky lg:top-6">
              <div className="rounded-xl border border-slate-300 bg-white p-4">
                <div className="rounded-xl border border-slate-300 bg-slate-50 p-2">
                  <div className="grid grid-cols-3 gap-2">
                    {SIDEBAR_TABS.map((tab) => {
                      const isActive = sidebarTab === tab.id;

                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setSidebarTab(tab.id)}
                          className={`rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                            isActive
                              ? "bg-blue-100 text-blue-700"
                              : "text-slate-600 hover:bg-slate-200 hover:text-slate-950"
                          }`}
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4 space-y-4">
                  {sidebarStories.map((story, index) => (
                    <SidebarStoryCard
                      key={story.slug}
                      story={story}
                      highlighted={index === 0}
                    />
                  ))}
                </div>

                <Link
                  to="/news"
                  className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 transition-colors duration-300 hover:text-blue-600"
                >
                  View all stories
                  <FaArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </aside>
          </div>
        ) : null}
      </section>
    </main>
  );
};

export default NewsEditorialDesk;
