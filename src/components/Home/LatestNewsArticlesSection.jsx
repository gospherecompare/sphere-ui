import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaArrowRight } from "react-icons/fa";
import { HooksSignature, NewsBrandBadge } from "./NewsBrandBadge";
import { NEWS_BRAND_STYLES } from "./newsBrandStyles";
import {
  createNewsStoryPath,
  usePublicNewsFeed,
} from "../../hooks/usePublicNews";

const STORY_MEDIA_THEMES = {
  news: "from-slate-950 via-blue-950 to-blue-600",
  mobiles: "from-slate-950 via-cyan-950 to-cyan-600",
  gadgets: "from-slate-950 via-orange-950 to-orange-500",
  guides: "from-slate-950 via-violet-950 to-violet-600",
  launches: "from-slate-950 via-emerald-950 to-emerald-600",
};

const getStoryMediaTheme = (category) =>
  STORY_MEDIA_THEMES[category] || STORY_MEDIA_THEMES.news;

const NewsStoryMedia = ({ story, variant = "lead" }) => {
  const [imageError, setImageError] = useState(false);
  const theme = getStoryMediaTheme(story?.category);

  useEffect(() => {
    setImageError(false);
  }, [story?.image, story?.slug]);

  const isLead = variant === "lead";
  const containerClasses = isLead
    ? "min-h-[22rem] lg:min-h-[24rem]"
    : "min-h-[10rem] sm:min-h-[12rem]";

  return (
    <div
      className={`relative overflow-hidden bg-slate-950 ${containerClasses}`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${theme}`} />
      {story?.image ? (
        <div
          className="absolute inset-0 scale-110 bg-cover bg-center opacity-35 blur-3xl"
          style={{ backgroundImage: `url(${story.image})` }}
          aria-hidden="true"
        />
      ) : null}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_28%),linear-gradient(135deg,rgba(15,23,42,0.12),rgba(15,23,42,0.02))]" />

      {!imageError && story?.image ? (
        <img
          src={story.image}
          alt={story.title}
          className={`absolute inset-0 h-full w-full object-contain ${
            isLead ? "p-4 sm:p-6" : "p-2 sm:p-3"
          }`}
          loading="lazy"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="relative flex h-full min-h-full flex-col justify-between p-5 text-white sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/75">
              {story?.label || "Newsroom"}
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/45">
              Fallback cover
            </span>
          </div>

          <div className="max-w-lg">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/55">
              {story?.brandName || story?.productType || "Hooks newsroom"}
            </p>
            <h3 className="mt-3 text-lg font-black leading-tight tracking-tight text-white sm:text-xl">
              {story?.title}
            </h3>
            <p className="mt-3 text-sm leading-7 text-white/72">
              {story?.summary}
            </p>
          </div>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 border-t border-white/10 bg-slate-950/72 px-4 py-3 backdrop-blur-sm">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-white/70">
          <NewsBrandBadge
            brandName={story?.brandName || "Hooks"}
            brandLogo={story?.brandLogo}
            className="text-white/75"
            textClassName="text-xs font-semibold text-white/75"
          />
          <span>{story?.productName || story?.productType || "Editorial cover"}</span>
          <HooksSignature />
        </div>
      </div>
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
            <p className={NEWS_BRAND_STYLES.eyebrow}>
              Latest stories
            </p>
            <h2 className={`mt-3 ${NEWS_BRAND_STYLES.sectionTitle}`}>
              Latest News & Articles
            </h2>
            <p className={`mt-4 ${NEWS_BRAND_STYLES.body}`}>
              A lighter home preview with flatter cards and a direct path into
              the full newsroom page.
            </p>
          </div>

          <Link
            to="/news"
            className={NEWS_BRAND_STYLES.primaryButton}
          >
            View all news
            <FaArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loading && !leadStory ? (
          <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)]">
            <div className={`min-h-[28rem] animate-pulse ${NEWS_BRAND_STYLES.softCardShell}`} />
            <div className={`min-h-[28rem] animate-pulse ${NEWS_BRAND_STYLES.cardShell}`} />
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

                <p className={`mt-4 ${NEWS_BRAND_STYLES.bodySmall} sm:text-base`}>
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

                      <h3 className={`mt-3 ${NEWS_BRAND_STYLES.cardTitle} text-lg`}>
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
