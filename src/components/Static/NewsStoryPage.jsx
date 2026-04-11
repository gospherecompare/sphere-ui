import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FaArrowRight } from "react-icons/fa";
import SEO from "../SEO";
import NotFound from "./NotFound";
import { HooksSignature } from "../Home/NewsBrandBadge";
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
import SocialShareButtons from "../News/SocialShareButtons";
import NewsHighlights from "../News/NewsHighlights";

const NewsStoryMedia = ({ story, variant = "hero", className = "" }) => {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [story?.image, story?.slug]);

  const containerClasses = variant === "hero" ? "aspect-[7/5]" : "aspect-[4/3]";

  const fallbackPanel = (
    <div className="flex h-full items-center justify-center bg-slate-50 p-6 text-center">
      <div className="max-w-md">
        <p className={NEWS_BRAND_STYLES.eyebrow}>
          {story?.label || "Newsroom"}
        </p>
        <h2 className="mt-3 text-lg font-black tracking-tight text-slate-900 sm:text-xl">
          {story?.title}
        </h2>
        <p className={`mt-3 ${NEWS_BRAND_STYLES.bodySmall}`}>
          {story?.summary}
        </p>
      </div>
    </div>
  );

  return (
    <div
      className={`relative overflow-hidden ${containerClasses} ${className}`}
    >
      {!imageError && story?.image ? (
        <img
          src={story.image}
          alt={story.title}
          className="absolute inset-0 h-full w-full rounded-3xl p-2"
          loading="lazy"
          onError={() => setImageError(true)}
        />
      ) : (
        fallbackPanel
      )}
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
        <section className="mx-auto max-w-5xl px-0 py-12 sm:px-6 lg:px-8">
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
        <section className="mx-auto max-w-5xl px-0 py-12 sm:px-6 lg:px-8">
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
  const sidebarStories = feedStories
    .filter((item) => item.slug !== story.slug)
    .slice(0, 5);
  const storyHighlights = Array.isArray(story.highlights)
    ? story.highlights
    : [];
  const storyKeywords = [
    story.label,
    story.category,
    ...storyHighlights.map((item) =>
      typeof item === "string" ? item : item?.text,
    ),
  ].filter(Boolean);
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
      keywords: storyKeywords,
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
        <section className="mx-auto max-w-7xl px-0 pt-0 pb-10 sm:px-6 sm:pt-6 sm:pb-10 lg:px-8 lg:py-12">
          <div className="grid gap-8 xl:grid-cols-[14rem_minmax(0,1fr)_20rem]">
            <aside className="hidden space-y-4 xl:block">
              {storyHighlights.length ? (
                <NewsHighlights highlights={storyHighlights} variant="full" />
              ) : null}

              <div className="rounded-md border border-slate-200 bg-white p-4">
                <p className={NEWS_BRAND_STYLES.eyebrow}>Jump to</p>
                <div className="mt-3 space-y-2 text-sm text-slate-700">
                  <a
                    href="#story-body"
                    className="block rounded-md px-2 py-1 hover:bg-slate-50 hover:text-slate-950"
                  >
                    Full story
                  </a>
                  <a
                    href="#related-stories"
                    className="block rounded-md px-2 py-1 hover:bg-slate-50 hover:text-slate-950"
                  >
                    Related stories
                  </a>
                </div>
              </div>
            </aside>

            <article id="story-body" className="min-w-0">
              <div
                className={`overflow-hidden ${NEWS_BRAND_STYLES.cardShell} xl:overflow-visible xl:border-0 xl:bg-transparent`}
              >
                <div className="border-b border-slate-200 bg-white p-6 sm:p-8 lg:p-10 xl:border-0 xl:bg-transparent xl:px-0 xl:pt-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <Link to="/" className="hover:text-slate-900">
                      Home
                    </Link>
                    <span>/</span>
                    <Link to="/news" className="hover:text-slate-900">
                      News
                    </Link>
                    <span>/</span>
                    <span className="truncate text-slate-400">
                      {story.label}
                    </span>
                  </div>

                  <p className={`mt-4 ${NEWS_BRAND_STYLES.eyebrow}`}>
                    Newsroom
                  </p>

                  <h1
                    className="mt-3 max-w-4xl text-2xl font-black leading-[1.08] tracking-tight text-slate-950 sm:text-3xl lg:text-4xl xl:text-4xl"
                    style={{ textWrap: "balance" }}
                  >
                    {story.title}
                  </h1>

                  <p
                    className={`mt-4 max-w-4xl ${NEWS_BRAND_STYLES.bodyLarge}`}
                  >
                    {story.summary}
                  </p>

                  <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-600">
                    <span>By {story.author}</span>
                    <span>Published: {story.publishedAt}</span>
                    <span>Updated: {story.updatedAt}</span>
                  </div>

                  <div className="mt-5">
                    <SocialShareButtons
                      title={story.title}
                      url={`https://tryhook.shop${createNewsStoryPath(story.slug)}`}
                      description={story.summary}
                    />
                  </div>
                </div>

                <NewsStoryMedia
                  story={story}
                  variant="hero"
                  className="mt-3 w-full px-4 sm:px-6 lg:px-10 xl:mt-4 xl:px-0"
                />

                <div className="bg-white p-4 sm:p-8 xl:bg-transparent xl:px-0">
                  <div className="max-w-3xl space-y-6">
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

            <aside className="hidden space-y-4 xl:block xl:sticky xl:top-6">
              <div className="rounded-md border border-slate-200 bg-white p-4">
                <p className={NEWS_BRAND_STYLES.eyebrow}>Trending now</p>
                <h3 className={`mt-2 ${NEWS_BRAND_STYLES.featureTitle}`}>
                  Fast headlines
                </h3>

                <div className="mt-4 divide-y divide-slate-200">
                  {sidebarStories.map((item, index) => (
                    <Link
                      key={item.slug}
                      to={createNewsStoryPath(item.slug)}
                      className={`block px-0 py-4 transition-colors duration-200 hover:text-slate-700 ${
                        index === 0 ? "pt-0" : ""
                      }`}
                    >
                      <p className={NEWS_BRAND_STYLES.labelSmall}>
                        {item.label}
                      </p>
                      <h4 className="mt-2 text-sm font-semibold leading-6 text-slate-900">
                        {item.title}
                      </h4>
                      <p className="mt-2 text-xs text-slate-500">
                        {item.publishedAt}
                      </p>
                    </Link>
                  ))}
                </div>

                <Link
                  to="/news"
                  className="mt-4 inline-flex text-sm font-semibold text-slate-950 hover:text-slate-700"
                >
                  View all stories
                  <FaArrowRight className="ml-2 h-3.5 w-3.5" />
                </Link>
              </div>

              <RecommendedSmartphones variant="sidebar" limit={4} />
            </aside>
          </div>

          <section id="related-stories" className="mt-12 px-2 sm:px-0">
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
