import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  FaArrowRight,
  FaRegNewspaper,
} from "react-icons/fa";
import SEO from "../SEO";
import NotFound from "./NotFound";
import { HooksSignature, NewsBrandBadge } from "../Home/NewsBrandBadge";
import RecommendedSmartphones from "../Home/RecommendedSmartphones";
import {
  createBreadcrumbSchema,
  createNewsArticleSchema,
} from "../../utils/schemaGenerators";
import {
  buildRelatedNewsStories,
  createNewsStoryPath,
  usePublicNewsFeed,
  usePublicNewsStory,
} from "../../hooks/usePublicNews";
import { NEWS_BRAND_STYLES } from "../Home/newsBrandStyles";

const STORY_MEDIA_THEMES = {
  news: "from-slate-950 via-blue-950 to-blue-600",
  mobiles: "from-slate-950 via-cyan-950 to-cyan-600",
  gadgets: "from-slate-950 via-orange-950 to-orange-500",
  guides: "from-slate-950 via-violet-950 to-violet-600",
  launches: "from-slate-950 via-emerald-950 to-emerald-600",
};

const getStoryMediaTheme = (category) =>
  STORY_MEDIA_THEMES[category] || STORY_MEDIA_THEMES.news;

const NewsStoryMedia = ({ story, variant = "hero", className = "" }) => {
  const [imageError, setImageError] = useState(false);
  const isHero = variant === "hero";
  const theme = getStoryMediaTheme(story?.category);

  useEffect(() => {
    setImageError(false);
  }, [story?.image, story?.slug]);

  const fallbackPanel = (
    <div
      className={`relative flex h-full min-h-full flex-col justify-between p-6 sm:p-8 text-white ${
        isHero ? "min-h-[28rem]" : "min-h-[16rem]"
      }`}
    >
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
        <h2
          className={`mt-4 font-black tracking-tight ${
            isHero
              ? "text-3xl leading-tight sm:text-4xl"
              : "text-xl leading-snug"
          }`}
        >
          {story?.title}
        </h2>
        <p className="mt-4 text-sm leading-7 text-white/72">{story?.summary}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(story?.highlights || []).slice(0, 3).map((highlight) => (
          <span
            key={highlight}
            className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold tracking-[0.16em] text-white/72"
          >
            {highlight}
          </span>
        ))}
      </div>
    </div>
  );

  if (isHero) {
    return (
      <div
        className={`relative min-h-[28rem] overflow-hidden bg-slate-950 ${className}`}
      >
        <div className={`absolute inset-0 bg-gradient-to-br ${theme}`} />
        {story?.image ? (
          <div
            className="absolute inset-0 bg-cover bg-center blur-3xl scale-110 opacity-35"
            style={{ backgroundImage: `url(${story.image})` }}
            aria-hidden="true"
          />
        ) : null}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.14),transparent_30%),linear-gradient(135deg,rgba(15,23,42,0.16),rgba(15,23,42,0.02))]" />

        {!imageError && story?.image ? (
          <img
            src={story.image}
            alt={story.title}
            className="absolute inset-0 h-full w-full object-contain p-3 sm:p-6"
            loading="lazy"
            onError={() => setImageError(true)}
          />
        ) : (
          fallbackPanel
        )}

        <div className="absolute inset-x-0 bottom-0 border-t border-white/10 bg-slate-950/72 px-5 py-3 backdrop-blur-sm">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-white/70">
            <NewsBrandBadge
              brandName={story?.brandName || "Hooks"}
              brandLogo={story?.brandLogo}
              className="text-white/75"
              textClassName="text-xs font-semibold text-white/75"
            />
            <span>
              {story?.productName || story?.productType || "Editorial cover"}
            </span>
            <HooksSignature />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative min-h-[16rem] overflow-hidden bg-slate-950 sm:min-h-[18rem] ${className}`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${theme}`} />
      {story?.image ? (
        <div
          className="absolute inset-0 scale-110 bg-cover bg-center opacity-35 blur-3xl"
          style={{ backgroundImage: `url(${story.image})` }}
          aria-hidden="true"
        />
      ) : null}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_28%),linear-gradient(135deg,rgba(15,23,42,0.1),rgba(15,23,42,0.02))]" />

      {!imageError && story?.image ? (
        <img
          src={story.image}
          alt={story.title}
          className="absolute inset-0 h-full w-full object-contain p-4 sm:p-6 transition-transform duration-300 group-hover:scale-[1.02]"
          loading="lazy"
          onError={() => setImageError(true)}
        />
      ) : (
        fallbackPanel
      )}

      <div className="absolute inset-x-0 bottom-0 border-t border-white/10 bg-slate-950/72 px-4 py-2 backdrop-blur-sm">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] text-white/70">
          <NewsBrandBadge
            brandName={story?.brandName || story?.label || "Hooks"}
            brandLogo={story?.brandLogo}
            className="text-white/75"
            textClassName="text-[11px] font-semibold text-white/75"
          />
          <span className="min-w-0 flex-1 truncate">
            {story?.productName || story?.productType || story?.title}
          </span>
          <HooksSignature />
        </div>
      </div>
    </div>
  );
};

const NewsStoryPage = () => {
  const { slug = "" } = useParams();
  const { story, loading, error, notFound } = usePublicNewsStory(slug);
  const { stories: feedStories } = usePublicNewsFeed({ limit: 18 });

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900">
        <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
          <div
            className={`min-h-[24rem] animate-pulse ${NEWS_BRAND_STYLES.cardShell}`}
          />
        </section>
      </main>
    );
  }

  if (notFound) {
    return <NotFound />;
  }

  if (!story) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900">
        <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
          <div className={`${NEWS_BRAND_STYLES.cardShell} p-6`}>
            <p className="text-base font-semibold text-slate-900">
              Story could not be loaded.
            </p>
            <p className="mt-2 text-sm text-slate-600">
              {error || "The newsroom story is unavailable right now."}
            </p>
          </div>
        </section>
      </main>
    );
  }

  const canonical = `https://tryhook.shop${createNewsStoryPath(story.slug)}`;
  const relatedStories = buildRelatedNewsStories(feedStories, story, 3);
  const articleParagraphs =
    Array.isArray(story.body) && story.body.length > 1
      ? story.body.slice(1)
      : Array.isArray(story.body)
        ? story.body
        : [];

  const schema = [
    createBreadcrumbSchema([
      { label: "Home", url: "https://tryhook.shop/" },
      { label: "News", url: "https://tryhook.shop/news" },
      { label: story.title, url: canonical },
    ]),
    createNewsArticleSchema({
      headline: story.title,
      description: story.summary,
      url: canonical,
      image: story.image,
      datePublished: story.publishedIso,
      dateModified: story.updatedIso,
      authorName: story.author,
      articleSection: story.label,
      keywords: [story.label, story.category, ...story.highlights],
    }),
  ];

  return (
    <>
      <SEO
        title={`${story.title} - Hooks`}
        description={story.summary}
        url={canonical}
        robots="index, follow"
        ogType="article"
        image={story.image}
        schema={schema}
      />

      <main className="min-h-screen bg-slate-50 text-slate-900">
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <article id="story-body" className="min-w-0">
              <div className={`overflow-hidden ${NEWS_BRAND_STYLES.cardShell}`}>
                <div className="border-b border-slate-200 bg-white p-6 sm:p-8 lg:p-10">
                  <p
                    className={`inline-flex items-center gap-2 ${NEWS_BRAND_STYLES.eyebrow}`}
                  >
                    <FaRegNewspaper className="h-3.5 w-3.5" />
                    {story.label}
                  </p>

                  <h1 className={`mt-4 ${NEWS_BRAND_STYLES.pageTitle}`}>
                    {story.title}
                  </h1>

                  <div className="mt-6 flex flex-wrap gap-2">
                    {story.highlights.map((highlight) => (
                      <span
                        key={highlight}
                        className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600"
                      >
                        {highlight}
                      </span>
                    ))}
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <a
                      href="#story-body"
                      className={NEWS_BRAND_STYLES.primaryButton}
                    >
                      Jump to story
                      <FaArrowRight className="h-3.5 w-3.5" />
                    </a>

                    <Link
                      to="/news"
                      className={NEWS_BRAND_STYLES.secondaryButton}
                    >
                      More stories
                    </Link>
                  </div>
                </div>

                <NewsStoryMedia
                  story={story}
                  variant="card"
                  className="border-b border-slate-200"
                />

                <div className="bg-white p-6 sm:p-8">
                  <p className={NEWS_BRAND_STYLES.eyebrow}>Full story</p>

                  <div className="mt-5 max-w-3xl space-y-6">
                    {(articleParagraphs.length
                      ? articleParagraphs
                      : story.body.length
                        ? story.body
                        : [story.summary]
                    ).map((paragraph, index) => (
                      <p
                        key={`${story.slug}-paragraph-${index + 1}`}
                        className={`leading-8 text-slate-700 ${
                          index === 0 ? "text-lg" : NEWS_BRAND_STYLES.body
                        }`}
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>

                  <div className="mt-8 border-t border-slate-200 pt-5">
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                      <span className="inline-flex items-center gap-2">
                        <span className="font-semibold text-slate-900">
                          Published:
                        </span>
                        <span className={NEWS_BRAND_STYLES.meta}>
                          {story.publishedAt}
                        </span>
                      </span>

                      <span className="inline-flex items-center gap-2">
                        <span className="font-semibold text-slate-900">
                          Author:
                        </span>
                        <span className={NEWS_BRAND_STYLES.meta}>
                          {story.author}
                        </span>
                      </span>

                      <HooksSignature variant="light" />
                    </div>
                  </div>
                </div>
              </div>
            </article>

            <aside className="space-y-4 lg:sticky lg:top-6">
              <RecommendedSmartphones
                variant="sidebar"
                limit={4}
              />
            </aside>
          </div>

          <section className="mt-12">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-3xl">
                <p className={NEWS_BRAND_STYLES.eyebrow}>Related stories</p>
                <h2 className={`mt-3 ${NEWS_BRAND_STYLES.sectionTitle}`}>
                  More from the newsroom
                </h2>
              </div>

              <Link to="/news" className={NEWS_BRAND_STYLES.inlineAction}>
                View all stories
                <FaArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {relatedStories.length ? (
              <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {relatedStories.map((item) => (
                    <article
                      key={item.slug}
                    className={`overflow-hidden ${NEWS_BRAND_STYLES.cardShell}`}
                    >
                      <Link
                        to={createNewsStoryPath(item.slug)}
                        className="group block"
                      >
                      <NewsStoryMedia story={item} variant="card" />

                      <div className="p-5">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className={NEWS_BRAND_STYLES.labelSmall}>
                            {item.label}
                          </span>
                          <span className={NEWS_BRAND_STYLES.metaSmall}>
                            {item.publishedAt}
                          </span>
                        </div>

                        <h3
                          className={`mt-3 ${NEWS_BRAND_STYLES.cardTitle} transition-colors duration-200 group-hover:text-slate-700`}
                        >
                          {item.title}
                        </h3>

                        <p className={`mt-3 ${NEWS_BRAND_STYLES.bodySmall}`}>
                          {item.summary}
                        </p>
                      </div>
                    </Link>
                  </article>
                ))}
              </div>
            ) : (
              <div className={`mt-6 p-5 ${NEWS_BRAND_STYLES.cardShell}`}>
                <p className="text-sm text-slate-600">
                  More published newsroom stories will appear here
                  automatically.
                </p>
              </div>
            )}
          </section>
        </section>
      </main>
    </>
  );
};

export default NewsStoryPage;
