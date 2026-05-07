import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaArrowRight } from "react-icons/fa";
import { HooksSignature } from "./NewsBrandBadge";
import { NEWS_BRAND_STYLES } from "./newsBrandStyles";
import LatestNewsRouteSection from "../ui/LatestNewsRouteSection";
import {
  createNewsStoryPath,
  usePublicNewsFeed,
} from "../../hooks/usePublicNews";
import {
  HOME_SECTION_LEAD_LIGHT,
  HOME_SECTION_TITLE_LIGHT,
} from "./homeSectionTypography";

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
    <section className="border-t border-slate-200 bg-gradient-to-b from-sky-50 via-white to-cyan-50/40">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
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
        <LatestNewsRouteSection />

        {leadStory ? (
          <div className="mt-10 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            {/* Featured Article */}

            {/* Side Articles */}
            <div className="flex flex-col gap-4">
              {listStories.map((story) => (
                <article
                  key={story.slug}
                  className="flex flex-col gap-4 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm p-4 sm:flex-row"
                >
                  <div className="h-44 w-full flex-shrink-0 overflow-hidden rounded-lg bg-slate-100 sm:h-24 sm:w-24">
                    <NewsStoryMedia story={story} />
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                          {story.label}
                        </span>
                        <span className="text-xs text-slate-500">|</span>
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
