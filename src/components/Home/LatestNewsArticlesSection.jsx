import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaArrowRight } from "react-icons/fa";
import { HooksSignature } from "./NewsBrandBadge";
import { NEWS_BRAND_STYLES } from "./newsBrandStyles";
import {
  createNewsStoryPath,
  usePublicNewsFeed,
} from "../../hooks/usePublicNews";

const NewsStoryMedia = ({ story, variant = "lead" }) => {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [story?.image, story?.slug]);

  const isLead = variant === "lead";
  const containerClasses = isLead ? "aspect-[7/5]" : "aspect-[4/3]";

  return (
    <div
      className={`relative overflow-hidden rounded-lg bg-white ${containerClasses}`}
    >
      {!imageError && story?.image ? (
        <img
          src={story.image}
          alt={story.title}
          className="absolute inset-0 h-full w-full object-contain p-4 sm:p-5"
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
            <p className={`mt-3 ${NEWS_BRAND_STYLES.bodySmall}`}>
              {story?.summary}
            </p>
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
    <section className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className={NEWS_BRAND_STYLES.eyebrow}>Latest stories</p>
            <h2 className={`mt-3 ${NEWS_BRAND_STYLES.sectionTitle}`}>
              Latest News & Articles
            </h2>
            <p className={`mt-4 ${NEWS_BRAND_STYLES.body}`}>
              A lighter home preview with flatter cards and a direct path into
              the full newsroom page.
            </p>
          </div>

          <Link to="/news" className={NEWS_BRAND_STYLES.primaryButton}>
            View all news
            <FaArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loading && !leadStory ? (
          <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)]">
            <div
              className={`min-h-[28rem] animate-pulse ${NEWS_BRAND_STYLES.softCardShell}`}
            />
            <div
              className={`min-h-[28rem] animate-pulse ${NEWS_BRAND_STYLES.cardShell}`}
            />
          </div>
        ) : null}

        {!loading && error && !leadStory ? (
          <div className={`mt-8 p-5 ${NEWS_BRAND_STYLES.cardShell}`}>
            <p className="text-sm font-semibold text-slate-900">
              News feed is not available right now.
            </p>
            <p className="mt-2 text-sm text-slate-600">{error}</p>
          </div>
        ) : null}

        {!loading && !error && !leadStory ? (
          <div className={`mt-8 p-5 ${NEWS_BRAND_STYLES.cardShell}`}>
            <p className="text-sm font-semibold text-slate-900">
              No published stories yet.
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Publish a story from the admin newsroom to show it here.
            </p>
          </div>
        ) : null}

        {leadStory ? (
          <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)]">
            <article
              className={`overflow-hidden ${NEWS_BRAND_STYLES.softCardShell}`}
            >
              <NewsStoryMedia story={leadStory} variant="lead" />

              <div className="p-5 sm:p-6">
                <div className="flex flex-wrap items-center gap-3">
                  <span className={NEWS_BRAND_STYLES.label}>
                    {leadStory.label}
                  </span>
                  <span className={NEWS_BRAND_STYLES.meta}>
                    {leadStory.publishedAt}
                  </span>
                </div>

                <h3 className={`mt-4 ${NEWS_BRAND_STYLES.featureTitle}`}>
                  {leadStory.title}
                </h3>

                <p
                  className={`mt-4 ${NEWS_BRAND_STYLES.bodySmall} sm:text-base`}
                >
                  {leadStory.summary}
                </p>

                <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-200 pt-4">
                  <HooksSignature variant="light" className="shrink-0" />

                  <Link
                    to={createNewsStoryPath(leadStory.slug)}
                    className={NEWS_BRAND_STYLES.inlineAction}
                  >
                    Read story
                    <FaArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </article>

            <div className={`overflow-hidden ${NEWS_BRAND_STYLES.cardShell}`}>
              {listStories.map((story, index) => (
                <article
                  key={story.slug}
                  className={`${index !== 0 ? "border-t border-slate-200" : ""}`}
                >
                  <div className="grid gap-0 sm:grid-cols-[160px_minmax(0,1fr)]">
                    <NewsStoryMedia story={story} variant="compact" />

                    <div className="p-5">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className={NEWS_BRAND_STYLES.labelSmall}>
                          {story.label}
                        </span>
                        <span className={NEWS_BRAND_STYLES.metaSmall}>
                          {story.publishedAt}
                        </span>
                      </div>

                      <h3
                        className={`mt-3 ${NEWS_BRAND_STYLES.cardTitle} text-lg`}
                      >
                        {story.title}
                      </h3>

                      <p className={`mt-2 ${NEWS_BRAND_STYLES.bodySmall}`}>
                        {story.summary}
                      </p>

                      <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-200 pt-3">
                        <HooksSignature variant="light" className="shrink-0" />
                        <Link
                          to={createNewsStoryPath(story.slug)}
                          className={NEWS_BRAND_STYLES.inlineAction}
                        >
                          Read
                          <FaArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
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
