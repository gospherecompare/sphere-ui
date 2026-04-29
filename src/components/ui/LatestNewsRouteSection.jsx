import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaArrowRight } from "react-icons/fa";
import {
  createNewsStoryPath,
  usePublicNewsFeed,
} from "../../hooks/usePublicNews";

const NewsImage = ({ story }) => {
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
        className="h-full w-full object-cover rounded-lg"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-blue-50 px-4 text-center">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-blue-600">
          {story?.label || "Newsroom"}
        </p>
        <p className="mt-2 line-clamp-3 text-sm font-semibold leading-5 text-slate-900">
          {story?.title || "Latest update"}
        </p>
      </div>
    </div>
  );
};

const LatestNewsRouteSection = ({
  className = "",
  limit = 4,
  title = "Latest News & Articles",
  subtitle = "Fresh mobile launches, product updates, and buying context from the Hooks newsroom.",
}) => {
  const { stories, loading, error } = usePublicNewsFeed({ limit });
  const visibleStories = stories.slice(0, limit);

  if (!loading && (!visibleStories.length || error)) return null;

  return (
    <section
      className={`mx-auto w-full max-w-7xl rounded-lg bg-purple-100 px-3 py-6 sm:px-5 sm:py-8 md:px-6 md:py-10 ${className}`}
    >
      <div className="mb-4 flex flex-col items-start justify-between gap-3 sm:mb-6 sm:flex-row sm:items-center sm:gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-purple-700 sm:text-[11px]">
            Latest News
          </p>
          <h2 className="mt-1 text-base font-semibold tracking-tight text-slate-900 sm:mt-2 sm:text-lg md:text-xl">
            {title}
          </h2>
          <p className="mt-1 text-[12px] leading-relaxed text-slate-600 sm:text-[13px] sm:leading-relaxed">
            {subtitle}
          </p>
        </div>

        <Link
          to="/news"
          className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-md bg-purple-600 px-3 py-2 text-[11px] font-semibold leading-5 text-white transition-colors hover:bg-purple-700 sm:w-auto sm:text-[12px]"
        >
          View all
          <FaArrowRight className="text-[10px] sm:text-[11px]" />
        </Link>
      </div>

      {loading && !visibleStories.length ? (
        <div className="grid gap-3 grid-cols-1 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-48 animate-pulse rounded-lg bg-white sm:h-56 md:h-64 lg:h-72"
            />
          ))}
        </div>
      ) : null}

      {visibleStories.length ? (
        <div className="grid gap-3 grid-cols-1 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visibleStories.map((story) => (
            <Link
              key={story.slug}
              to={createNewsStoryPath(story.slug)}
              className="group relative h-48 overflow-hidden rounded-lg bg-white transition-all duration-200 hover:shadow-lg sm:h-56 md:h-64 lg:h-72 sm:rounded-xl"
            >
              <div className="absolute inset-0">
                <NewsImage story={story} />
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60 transition-opacity group-hover:opacity-70" />

              <div className="absolute bottom-0 left-0 right-0 p-3 text-white sm:p-4">
                <h3 className="line-clamp-2 text-xs font-semibold leading-4 sm:text-sm sm:leading-5">
                  {story.title}
                </h3>

                <div className="mt-2 flex items-center justify-between text-[10px] sm:mt-3 sm:text-[12px]">
                  <span className="truncate font-medium pr-2">
                    {story.author || "By Hooks"}
                  </span>
                  <span className="whitespace-nowrap opacity-90">
                    {story.publishedAt}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  );
};

export default LatestNewsRouteSection;
