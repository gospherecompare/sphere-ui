import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaArrowRight } from "react-icons/fa";
import { HooksSignature } from "./NewsBrandBadge";
import { NEWS_BRAND_STYLES } from "./newsBrandStyles";
import {
  createNewsStoryPath,
  usePublicNewsFeed,
} from "../../hooks/usePublicNews";

const NewsStoryMedia = ({ story }) => {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [story?.image, story?.slug]);

  const containerClasses = "aspect-[4/3]";

  return (
    <div
      className={`overflow-hidden rounded-2xl bg-slate-50 ${containerClasses}`}
    >
      {!imageError && story?.image ? (
        <img
          src={story.image}
          alt={story.title}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="flex h-full items-center justify-center bg-slate-50 p-5 text-center">
          <div className="max-w-md">
            <p className={NEWS_BRAND_STYLES.eyebrow}>
              {story?.label || "Newsroom"}
            </p>
            <h3 className="mt-3 text-base font-black leading-tight tracking-tight text-slate-900 sm:text-lg">
              {story?.title}
            </h3>
          </div>
        </div>
      )}
    </div>
  );
};

const LatestNewsArticlesSection = () => {
  const { stories, loading, error } = usePublicNewsFeed({ limit: 4 });
  const leadStory = stories[0] || null;
  const listStories = stories.slice(1, 4);

  return (
    <section className="border-t border-slate-200 bg-gradient-to-b from-white via-slate-50 to-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="inline-block h-1 w-8 rounded-full bg-blue-600"></span>
              <p className={NEWS_BRAND_STYLES.eyebrow}>Latest stories</p>
            </div>
            <h2 className={`mt-4 ${NEWS_BRAND_STYLES.sectionTitle}`}>
              Latest News & Articles
            </h2>
            <p className={`mt-3 max-w-2xl text-slate-600`}>
              Stay updated with the newest gadget launches, tech reviews,
              industry news, and buying guides.
            </p>
          </div>

          <Link
            to="/news"
            className={`${NEWS_BRAND_STYLES.primaryButton} whitespace-nowrap`}
          >
            Explore all news
            <FaArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loading && !leadStory ? (
          <div className="mt-10 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="h-96 animate-pulse rounded-2xl border border-slate-200 bg-slate-100" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-32 animate-pulse rounded-xl border border-slate-200 bg-slate-100"
                />
              ))}
            </div>
          </div>
        ) : null}

        {!loading && error && !leadStory ? (
          <div className="mt-10 rounded-xl border border-red-200 bg-red-50 p-6 sm:p-8">
            <p className="font-semibold text-red-900">Unable to load news</p>
            <p className="mt-2 text-red-700">{error}</p>
          </div>
        ) : null}

        {!loading && !error && !leadStory ? (
          <div className="mt-10 rounded-xl border border-slate-200 bg-slate-50 p-8 text-center">
            <p className="font-semibold text-slate-900">
              No stories published yet
            </p>
            <p className="mt-2 text-slate-600">
              Check back soon for the latest news and articles.
            </p>
          </div>
        ) : null}

        {leadStory ? (
          <div className="mt-10 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            {/* Featured Article */}
            <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="grid gap-0 lg:grid-cols-2">
                <div className="relative overflow-hidden bg-slate-100">
                  <NewsStoryMedia story={leadStory} />
                </div>

                <div className="flex flex-col justify-between p-6 sm:p-7 lg:p-8">
                  {/* Header */}
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-700`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-600"></span>
                        {leadStory.label}
                      </span>
                      <span className="text-xs font-medium text-slate-500">
                        {leadStory.publishedAt}
                      </span>
                    </div>

                    <h3 className="mt-5 text-2xl font-black leading-tight tracking-tight text-slate-950 sm:text-3xl">
                      {leadStory.title}
                    </h3>
                  </div>

                  {/* Highlights */}
                  {leadStory.highlights?.length > 0 && (
                    <div className="my-6 flex flex-wrap gap-2 border-y border-slate-200 py-4">
                      {leadStory.highlights.slice(0, 3).map((highlight) => (
                        <span
                          key={highlight}
                          className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700"
                        >
                          <span className="h-1 w-1 rounded-full bg-slate-400"></span>
                          {highlight}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between gap-4 pt-4">
                    <HooksSignature variant="light" className="shrink-0" />
                    <Link
                      to={createNewsStoryPath(leadStory.slug)}
                      className="inline-flex items-center gap-2 font-semibold text-blue-600 transition-all duration-200 hover:text-blue-700 hover:gap-3"
                    >
                      Read Story
                      <FaArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </article>

            {/* Side Articles */}
            <div className="flex flex-col gap-4">
              {listStories.map((story) => (
                <article
                  key={story.slug}
                  className="flex gap-4 overflow-hidden rounded-xl border border-slate-200 bg-white p-4"
                >
                  <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
                    <NewsStoryMedia story={story} />
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="inline-block h-0.5 w-4 rounded-full bg-blue-600"></span>
                        <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                          {story.label}
                        </span>
                        <span className="text-xs text-slate-500">•</span>
                        <span className="text-xs text-slate-500">
                          {story.publishedAt}
                        </span>
                      </div>

                      <h4 className="mt-2 line-clamp-2 font-bold leading-tight text-slate-900">
                        {story.title}
                      </h4>
                    </div>

                    <Link
                      to={createNewsStoryPath(story.slug)}
                      className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 transition-all duration-200 hover:text-blue-700 hover:gap-2"
                    >
                      Read
                      <FaArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default LatestNewsArticlesSection;
