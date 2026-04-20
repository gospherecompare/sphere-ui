import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FaFire } from "react-icons/fa";
import { createNewsStoryPath } from "../../hooks/usePublicNews";
import { NEWS_BRAND_STYLES } from "./newsBrandStyles";

const DEFAULT_TOPIC_TAGS = ["#vivo", "#tecno", "#samsung", "#apple", "#iphone"];

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

const compareStoriesByDate = (left, right) => {
  const leftDate = parseStoryDate(left)?.getTime() || 0;
  const rightDate = parseStoryDate(right)?.getTime() || 0;
  return rightDate - leftDate;
};

const formatRelativeLabel = (story) => {
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

const formatAbsoluteDate = (story) => {
  const date = parseStoryDate(story);
  if (!date) return story?.publishedAt || "Recent update";
  return dateFormatter.format(date);
};

const buildTopicTags = (stories = []) => {
  const derivedTags = [];

  stories.forEach((story) => {
    const source =
      story?.brandName || story?.productName || story?.label || story?.category;
    const normalized = String(source || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "");

    if (!normalized) return;

    const tag = `#${normalized}`;
    if (!derivedTags.includes(tag)) derivedTags.push(tag);
  });

  return [...derivedTags, ...DEFAULT_TOPIC_TAGS]
    .filter((tag, index, list) => list.indexOf(tag) === index)
    .slice(0, 5);
};

const StoryMedia = ({ story, className = "", eager = false }) => {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [story?.image, story?.slug]);

  const hasImage = Boolean(story?.image) && !imageError;

  return (
    <div className={`relative overflow-hidden bg-slate-100 ${className}`}>
      {hasImage ? (
        <img
          src={story.image}
          alt={story.title}
          className="h-full w-full object-cover"
          loading={eager ? "eager" : "lazy"}
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-fuchsia-900 p-4 text-center">
          <div className="max-w-[12rem]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/75">
              {story?.label || "Newsroom"}
            </p>
            <h3 className="mt-3 text-sm font-black leading-tight tracking-tight text-white sm:text-base">
              {story?.title || "Editorial coverage"}
            </h3>
          </div>
        </div>
      )}
    </div>
  );
};

const LoadingState = () => (
  <div className="mt-8 space-y-8">
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
      <div className="h-[440px] animate-pulse rounded-[30px] bg-white/35" />
      <div className="space-y-4">
        <div className="h-[160px] animate-pulse rounded-[26px] bg-white/30" />
        <div className="h-[160px] animate-pulse rounded-[26px] bg-white/30" />
        <div className="h-[160px] animate-pulse rounded-[26px] bg-white/30" />
      </div>
    </div>

    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-8">
        <div className="h-[360px] animate-pulse rounded-[24px] bg-slate-100" />
        <div className="h-[360px] animate-pulse rounded-[24px] bg-slate-100" />
      </div>
      <div className="h-[760px] animate-pulse rounded-[28px] bg-amber-100" />
    </div>
  </div>
);

const EmptyState = () => (
  <div className="mt-8 rounded-[30px] border border-white/70 bg-white/60 p-8 backdrop-blur-sm">
    <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-700">
      Newsroom
    </p>
    <h2 className="mt-3 text-2xl font-black tracking-[-0.04em] text-[#173570] sm:text-3xl">
      No stories published yet
    </h2>
    <p className={`mt-3 max-w-2xl ${NEWS_BRAND_STYLES.bodyLarge}`}>
      Publish a story from the admin newsroom and it will appear here
      automatically.
    </p>
    <Link
      to="/news"
      className="mt-6 inline-flex items-center rounded-full bg-[#173570] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#102750]"
    >
      View the newsroom
    </Link>
  </div>
);

const ErrorState = ({ error = "" }) => (
  <div className="mt-8 rounded-[30px] border border-rose-200 bg-rose-50 p-8">
    <p className="text-sm font-semibold uppercase tracking-[0.22em] text-rose-700">
      Newsroom
    </p>
    <h2 className="mt-3 text-2xl font-black tracking-[-0.04em] text-rose-900 sm:text-3xl">
      We could not load the stories
    </h2>
    <p className="mt-3 max-w-2xl text-sm leading-7 text-rose-700">{error}</p>
    <Link
      to="/news"
      className="mt-6 inline-flex items-center rounded-full bg-rose-700 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-rose-800"
    >
      Try again later
    </Link>
  </div>
);

const HeroStoryCard = ({ story }) => {
  if (!story) return null;

  return (
    <Link
      to={createNewsStoryPath(story.slug)}
      className="relative block overflow-hidden rounded-[18px] bg-slate-950"
    >
      <div className="relative min-h-[300px] sm:min-h-[440px]">
        <StoryMedia
          story={story}
          className="absolute inset-0 h-full w-full"
          eager
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />

        <div className="absolute inset-x-2.5 bottom-2.5 rounded-[18px] bg-[#f5f4f0]/95 p-3 backdrop-blur-sm sm:inset-x-4 sm:bottom-4 sm:rounded-[22px] sm:p-5">
          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
            {story.label || "News"}
          </span>

          <h2
            className="mt-3 text-[20px] font-black leading-[1.18] tracking-[-0.05em] text-[#173570] sm:mt-4 sm:text-[28px] lg:text-[32px]"
            style={{ textWrap: "balance" }}
          >
            {story.title}
          </h2>

          <div className="mt-4 flex items-center justify-between gap-3 sm:mt-6">
            <span className="text-sm font-semibold text-blue-700">
              {story.author}
            </span>
            <span className="text-sm text-slate-500">
              {formatRelativeLabel(story)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

const SideStoryCard = ({ story }) => {
  if (!story) return null;

  return (
    <Link
      to={createNewsStoryPath(story.slug)}
      className="flex gap-2.5 rounded-[14px] bg-[#ebe3ff] p-2 backdrop-blur-sm sm:gap-3 sm:p-3"
    >
      <StoryMedia
        story={story}
        className="h-[76px] w-[76px] shrink-0 rounded-[12px] sm:h-[124px] sm:w-[124px]"
      />

      <div className="min-w-0 flex-1">
        <h3
          className="line-clamp-3 text-[14px] font-semibold leading-5 tracking-[-0.03em] text-[#173570] sm:text-[18px] sm:font-bold sm:leading-6"
          style={{ textWrap: "balance" }}
        >
          {story.title}
        </h3>

        <div className="mt-3 flex items-center justify-between gap-3 text-[11px] sm:mt-5 sm:text-[14px]">
          <span className="truncate font-medium text-blue-700">
            {story.author}
          </span>
          <span className="shrink-0 text-slate-500">
            {formatRelativeLabel(story)}
          </span>
        </div>
      </div>
    </Link>
  );
};

const TimelineStoryCard = ({ story }) => {
  if (!story) return null;

  return (
    <article>
      <div className="flex items-center gap-3 pl-1">
        <span className="h-6 w-[2px] rounded-full bg-blue-600" />
        <time className="text-[15px] font-semibold tracking-[-0.01em] text-blue-700">
          {formatRelativeLabel(story)}
        </time>
      </div>

      <Link
        to={createNewsStoryPath(story.slug)}
        className="mt-3 block overflow-hidden rounded-[12px] border border-slate-200 bg-white p-2.5 sm:p-3"
      >
        <div className="grid grid-cols-[minmax(0,1fr)_78px] items-start gap-2.5 sm:grid-cols-[minmax(0,1fr)_128px] sm:gap-4 lg:grid-cols-[minmax(0,1fr)_210px] lg:items-center">
          <div className="min-w-0">
            <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600 sm:px-3 sm:text-[11px]">
              {story.label || "News"}
            </span>

            <h3
              className="mt-1 text-[15px] font-semibold leading-[1.25] tracking-[-0.04em] text-[#173570] sm:mt-4 sm:text-[24px] sm:font-black"
              style={{ textWrap: "balance" }}
            >
              {story.title}
            </h3>

            <div className="mt-2.5 flex items-center justify-between gap-3 sm:mt-8">
              <span className="text-[11px] font-semibold text-blue-700 sm:text-[15px]">
                {story.author}
              </span>
              <span className="text-[11px] text-slate-500 sm:text-[14px]">
                {formatAbsoluteDate(story)}
              </span>
            </div>
          </div>

          <StoryMedia
            story={story}
            className="h-[74px] rounded-[10px] sm:h-[128px] lg:h-[210px] lg:w-[210px] lg:justify-self-end"
          />
        </div>
      </Link>
    </article>
  );
};

const TrendingStoryCard = ({ story }) => {
  if (!story) return null;

  return (
    <Link
      to={createNewsStoryPath(story.slug)}
      className="block border-b border-amber-200/80 py-4 last:border-b-0 last:pb-0 first:pt-0"
    >
      <div className="flex gap-3">
        <StoryMedia
          story={story}
          className="h-[74px] w-[74px] shrink-0 rounded-[12px] border border-amber-100"
        />

        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-[17px] font-semibold leading-6 tracking-[-0.03em] text-[#173570]">
            {story.title}
          </h3>

          <div className="mt-2 flex items-center gap-2 text-[13px] text-slate-700">
            <span className="truncate max-w-[7rem]">{story.author}</span>
            <span className="shrink-0">|</span>
            <span className="shrink-0">{formatAbsoluteDate(story)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

const NewEditorial = ({ stories = [], loading = false, error = "" }) => {
  const normalizedStories = useMemo(
    () => (Array.isArray(stories) ? stories.filter(Boolean) : []),
    [stories],
  );

  const orderedStories = useMemo(
    () => [...normalizedStories].sort(compareStoriesByDate),
    [normalizedStories],
  );

  const topicTags = useMemo(
    () => buildTopicTags(orderedStories),
    [orderedStories],
  );

  const heroStory = orderedStories[0] || null;
  const sideStories = orderedStories.slice(1, 4);
  const timelineStories = orderedStories.slice(1, 5).length
    ? orderedStories.slice(1, 5)
    : orderedStories.slice(0, 4);

  const trendingStories = useMemo(() => {
    const pool = sideStories.length ? sideStories : orderedStories;

    return [...pool]
      .sort((left, right) => {
        const leftScore = left?.highlights?.length || 0;
        const rightScore = right?.highlights?.length || 0;

        if (rightScore !== leftScore) return rightScore - leftScore;
        return compareStoriesByDate(left, right);
      })
      .slice(0, 3);
  }, [orderedStories, sideStories]);

  const hasStories = orderedStories.length > 0;
  const showLoadingState = loading && !hasStories;
  const showErrorState = !loading && Boolean(error) && !hasStories;
  const showEmptyState = !loading && !error && !hasStories;

  return (
    <main className="min-h-screen bg-[#eef3ff] text-slate-900">
      <section
        className="relative isolate overflow-hidden"
        style={{
          backgroundImage:
            "linear-gradient(180deg, #fbf2ff 0%, #e9ddff 38%, #d8d8ff 100%)",
        }}
      >
        <div className="absolute inset-0 opacity-70 [background-image:radial-gradient(circle_at_top_left,rgba(255,255,255,0.92),transparent_32%),radial-gradient(circle_at_top_right,rgba(199,210,254,0.65),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.45),transparent_35%)]" />
        <div className="absolute -left-16 top-10 h-52 w-52 rounded-full bg-white/45 blur-3xl" />
        <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-indigo-300/20 blur-3xl" />

        <div className="relative mx-auto max-w-[1240px] p-1 pb-16 sm:pb-20">
          <div className="flex items-end gap-4">
            <h1 className="text-[clamp(2.4rem,5vw,4rem)]  font-black leading-none tracking-[-0.06em] text-[#163b7d]">
              News
            </h1>
            <span className="hidden h-px flex-1 bg-gradient-to-r from-[#c6b7ff] via-[#cfd0ff] to-transparent sm:block" />
          </div>

          <div className="mt-2 flex items-center gap-4 overflow-hidden  p-2 backdrop-blur-xl">
            <div className="flex items-center gap-2 px-4 text-sm font-semibold text-orange-500">
              <FaFire className="h-4 w-4" />
              Trending
            </div>

            <div className="flex gap-3 overflow-x-auto pr-3">
              {topicTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex min-w-[108px] shrink-0 items-center justify-center rounded-full border border-slate-200/70 bg-[#eef0ff] px-6 py-3 text-[15px] font-semibold text-[#173570]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {showLoadingState ? <LoadingState /> : null}
          {showErrorState ? <ErrorState error={error} /> : null}
          {showEmptyState ? <EmptyState /> : null}

          {hasStories ? (
            <div className="mt-2 grid gap-4 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
              <HeroStoryCard story={heroStory} />

              <div className="space-y-4">
                {(sideStories.length
                  ? sideStories
                  : orderedStories.slice(0, 3)
                ).map((story) => (
                  <SideStoryCard key={story.slug} story={story} />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {hasStories ? (
        <section className="relative -mt-10 rounded-t-[1.8rem] bg-white pt-14 sm:-mt-16 sm:rounded-t-[5rem] sm:pt-16">
          <div className="mx-auto max-w-[1240px] p-1">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
              <div className="space-y-8">
                <div className="max-w-3xl">
                  <h2 className="text-2xl font-black tracking-[-0.04em] text-[#173570] sm:text-3xl">
                    Latest News
                  </h2>
                  <div className="mt-4 h-[2px] w-full bg-gradient-to-r from-blue-600 via-fuchsia-500 to-orange-500" />
                </div>

                <div className="space-y-8">
                  {timelineStories.map((story) => (
                    <TimelineStoryCard key={story.slug} story={story} />
                  ))}
                </div>
              </div>

              <aside className="lg:sticky lg:top-6">
                <div className="rounded-[16px] border border-amber-200 bg-[#fae7c5] p-5">
                  <h2 className="text-center text-2xl font-black tracking-[-0.04em] text-[#173570]">
                    Trending News
                  </h2>

                  <div className="mt-6 space-y-0 divide-y divide-amber-200/80">
                    {trendingStories.map((story) => (
                      <TrendingStoryCard key={story.slug} story={story} />
                    ))}
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
