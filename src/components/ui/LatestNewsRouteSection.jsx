import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaArrowRight, FaClock } from "react-icons/fa";
import {
  createNewsStoryPath,
  usePublicNewsFeed,
} from "../../hooks/usePublicNews";

const NewsImage = ({ story, className = "", fit = "cover" }) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [story?.image, story?.slug]);

  if (story?.image && !failed) {
    return (
      <img
        src={story.image}
        alt={story.heroImageAlt || story.title}
        loading="lazy"
        decoding="async"
        className={`${fit === "contain" ? "h-auto w-auto max-h-full max-w-full object-contain" : "h-full w-full object-cover"} ${className}`}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-50 via-white to-slate-100 px-5 text-center">
      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-blue-600">
          {story?.label || "News"}
        </p>
        <p className="mt-2 line-clamp-3 text-sm font-bold leading-5 text-slate-900">
          {story?.title || "Latest update"}
        </p>
      </div>
    </div>
  );
};

const StoryMeta = ({ story, compact = false, light = false }) => (
  <div
    className={`flex flex-wrap items-center gap-x-2 gap-y-1 font-medium ${
      compact ? "text-[10px]" : "text-[11px] sm:text-xs"
    } ${light ? "text-white/75" : "text-slate-500"}`}
  >
    <span>{story.author || "MobilesX News"}</span>
    <span aria-hidden="true">•</span>
    <span>{story.publishedAt}</span>
    {story.readTime ? (
      <>
        <span aria-hidden="true">•</span>
        <span className="inline-flex items-center gap-1">
          <FaClock className="text-[9px]" />
          {story.readTime}
        </span>
      </>
    ) : null}
  </div>
);

const StoryLabel = ({ story, light = false }) => (
  <span
    className={`inline-flex w-fit items-center rounded-md px-2 py-1 text-[9px] font-extrabold uppercase tracking-[0.14em] ${
      light
        ? "bg-white/15 text-white backdrop-blur-sm"
        : "bg-blue-50 text-blue-700"
    }`}
  >
    {story.label || "News"}
  </span>
);

const LeadingStoryCard = ({ story }) => (
  <Link
    to={createNewsStoryPath(story.slug)}
    className="group grid min-h-[320px] overflow-hidden rounded-xl bg-slate-950 lg:grid-cols-[1.08fr_0.92fr]"
  >
    <div className="relative min-h-[260px] overflow-hidden lg:min-h-full">
      <NewsImage
        story={story}
        className="transition-transform duration-500 group-hover:scale-[1.035]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/5 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-transparent lg:to-slate-950/35" />
      <div className="absolute left-4 top-4 lg:hidden">
        <StoryLabel story={story} light />
      </div>
    </div>

    <div className="flex min-w-0 flex-col justify-between p-5 sm:p-6 lg:p-7">
      <div>
        <div className="hidden lg:block">
          <StoryLabel story={story} light />
        </div>
        <h3 className="mt-3 line-clamp-3 text-xl font-black leading-tight tracking-[-0.025em] text-white sm:text-2xl lg:text-[1.75rem]">
          {story.title}
        </h3>
        {story.summary ? (
          <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-300">
            {story.summary}
          </p>
        ) : null}
      </div>

      <div className="mt-6 flex items-end justify-between gap-4">
        <StoryMeta story={story} light />
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blue-600 text-white transition-transform duration-200 group-hover:translate-x-1">
          <FaArrowRight className="text-xs" />
        </span>
      </div>
    </div>
  </Link>
);

const CompactStoryCard = ({ story }) => (
  <Link
    to={createNewsStoryPath(story.slug)}
    className="group grid min-h-[92px] grid-cols-[100px_minmax(0,1fr)] items-center gap-2.5 rounded-xl bg-[#f7f9fc] p-2 transition-colors hover:bg-blue-50/70 min-[380px]:min-h-[104px] min-[380px]:grid-cols-[116px_minmax(0,1fr)] min-[380px]:gap-3 min-[380px]:p-2.5 sm:grid-cols-[132px_minmax(0,1fr)]"
  >
    <div className="flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-xl bg-transparent">
      <NewsImage
        story={story}
        fit="contain"
        className="rounded-xl"
      />
    </div>

    <div className="flex min-w-0 flex-col justify-between py-1 pr-1">
      <div>
        <StoryLabel story={story} />
        <h3 className="mt-2 line-clamp-2 text-sm font-extrabold leading-5 tracking-tight text-slate-950 sm:text-[15px]">
          {story.title}
        </h3>
      </div>

      <div className="mt-2 flex min-w-0 items-center justify-between gap-2 min-[380px]:mt-3 min-[380px]:gap-3">
        <StoryMeta story={story} compact />
        <FaArrowRight className="shrink-0 text-[10px] text-blue-600 transition-transform duration-200 group-hover:translate-x-1" />
      </div>
    </div>
  </Link>
);

const LatestNewsRouteSection = ({
  className = "",
  limit = 4,
  title = "Latest News",
  subtitle = "Fresh mobile launches, product updates, and buying context from the MobilesX news desk.",
  productId = null,
  productType = "",
  newsLinkLabel = "",
  showWhenEmpty = false,
  emptyMessage = "No related news is available yet.",
}) => {
  const { stories, loading, error } = usePublicNewsFeed({
    limit,
    productId,
    productType,
  });
  const visibleStories = stories.slice(0, limit);
  const leadingStory = visibleStories[0] || null;
  const compactStories = visibleStories.slice(1);
  const resolvedNewsLinkLabel =
    newsLinkLabel ||
    (productType === "tv"
      ? "Latest TV news"
      : productType === "laptop"
        ? "Latest laptop news"
        : "Latest smartphone news");
  if (!loading && (error || !visibleStories.length) && !showWhenEmpty) return null;

  return (
    <section
      className={`smartphones-news-section mx-auto w-full max-w-7xl rounded-[20px] bg-transparent p-0           sm:p-6 ${className}`}
    >
      <div className="mb-5 flex items-end justify-between gap-4 sm:mb-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <p className="text-[10px] font-extrabold uppercase tracking-[0.28em] text-blue-700 sm:text-[11px]">
              Latest Updates
            </p>
          </div>
          <h2 className="mt-2 text-xl font-black tracking-[-0.025em] text-slate-950 sm:text-2xl lg:text-3xl">
            {title}
          </h2>
          <p className="mt-1.5 max-w-2xl text-xs leading-5 text-slate-600 sm:text-sm sm:leading-6">
            {subtitle}
          </p>
        </div>

        <Link
          to="/news"
          className="hidden shrink-0 items-center gap-2 rounded-full bg-blue-600 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-blue-700 sm:inline-flex"
        >
          {resolvedNewsLinkLabel}
          <FaArrowRight className="text-[10px]" />
        </Link>
      </div>

      {loading && !visibleStories.length ? (
        <>
          <div className="grid gap-3 sm:hidden">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-[104px] animate-pulse rounded-xl bg-slate-100"
              />
            ))}
          </div>
          <div className="hidden gap-3 sm:grid lg:grid-cols-[1.45fr_0.85fr]">
            <div className="min-h-[360px] animate-pulse rounded-2xl bg-slate-200" />
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-[112px] animate-pulse rounded-xl bg-slate-100"
                />
              ))}
            </div>
          </div>
        </>
      ) : null}

      {!loading && !error && !visibleStories.length && showWhenEmpty ? (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-5 text-sm text-slate-600">
          {emptyMessage}
        </div>
      ) : null}

      {visibleStories.length ? (
        <>
          <div
            className={`hidden gap-3 sm:grid ${
              compactStories.length
                ? "lg:grid-cols-[1.45fr_0.85fr]"
                : "grid-cols-1"
            }`}
          >
            {leadingStory ? <LeadingStoryCard story={leadingStory} /> : null}
            <div className="grid content-start gap-3">
              {compactStories.map((story) => (
                <CompactStoryCard key={story.slug} story={story} />
              ))}
            </div>
          </div>

          <div className="grid gap-2.5 sm:hidden min-[380px]:gap-3">
            {visibleStories.map((story) => (
              <CompactStoryCard key={story.slug} story={story} />
            ))}

            <Link
              to="/news"
              className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-xs font-bold text-white"
            >
              {resolvedNewsLinkLabel}
              <FaArrowRight className="text-[10px]" />
            </Link>
          </div>
        </>
      ) : null}
    </section>
  );
};

export default LatestNewsRouteSection;
