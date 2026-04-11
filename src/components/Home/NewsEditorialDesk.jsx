import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FaArrowRight, FaFire, FaRegNewspaper } from "react-icons/fa";
import { NEWS_HOME_TABS } from "./newsDeskStaticData";
import { NEWS_BRAND_STYLES } from "./newsBrandStyles";
import { createNewsStoryPath } from "../../hooks/usePublicNews";

const NewsFeatureMedia = ({ story }) => {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [story?.image, story?.slug]);

  return (
    <div className="relative aspect-[7/5] overflow-hidden bg-white">
      {!imageError && story?.image ? (
        <img
          src={story.image}
          alt={story.title}
          className="absolute inset-0 h-full w-full object-contain p-4 sm:p-5 lg:p-6"
          loading="lazy"
          onError={() => setImageError(true)}
        />
      ) : (
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
      )}
    </div>
  );
};

const NewsCardMedia = ({ story }) => {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [story?.image, story?.slug]);

  return (
    <div className="relative h-full overflow-hidden rounded-2xl bg-slate-100">
      <div className="absolute inset-0 rounded-2xl overflow-hidden">
        {!imageError && story?.image ? (
          <img
            src={story.image}
            alt={story.title}
            className="h-full w-full object-contain"
            loading="lazy"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-slate-50 p-4 text-center">
            <div className="max-w-xs">
              <p className={NEWS_BRAND_STYLES.eyebrow}>
                {story?.label || "Newsroom"}
              </p>
              <h3 className="mt-3 text-sm font-black leading-tight tracking-tight text-slate-900 sm:text-base">
                {story?.title}
              </h3>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const NewsEditorialDesk = ({ stories = [], loading = false, error = "" }) => {
  const [activeCategory, setActiveCategory] = useState("all");
  const [featuredSlug, setFeaturedSlug] = useState("");

  const visibleStories = useMemo(
    () =>
      activeCategory === "all"
        ? stories
        : stories.filter((story) => story.category === activeCategory),
    [activeCategory, stories],
  );

  useEffect(() => {
    if (!visibleStories.length) {
      if (featuredSlug) setFeaturedSlug("");
      return;
    }

    if (!visibleStories.some((story) => story.slug === featuredSlug)) {
      const fallbackSlug = visibleStories[0]?.slug || "";
      if (fallbackSlug !== featuredSlug) setFeaturedSlug(fallbackSlug);
    }
  }, [featuredSlug, visibleStories]);

  const featuredStory =
    visibleStories.find((story) => story.slug === featuredSlug) ||
    visibleStories[0] ||
    null;

  const storyGrid = visibleStories
    .filter((story) => story.slug !== featuredStory?.slug)
    .slice(0, 3);

  const trendingStories = stories.slice(0, 4).map((story, index) => ({
    rank: String(index + 1).padStart(2, "0"),
    note: story.label,
    story,
  }));

  const handleCategoryChange = (categoryId) => {
    setActiveCategory(categoryId);

    const nextStories =
      categoryId === "all"
        ? stories
        : stories.filter((story) => story.category === categoryId);

    const nextFeaturedSlug = nextStories[0]?.slug || "";
    setFeaturedSlug(nextFeaturedSlug);
  };

  const hasAnyStories = stories.length > 0;
  const hasStories = Boolean(featuredStory);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-14">
          <div className="max-w-4xl">
            <p
              className={`inline-flex items-center gap-2 ${NEWS_BRAND_STYLES.eyebrow}`}
            >
              <FaRegNewspaper className="h-3.5 w-3.5" />
              Newsroom
            </p>

            <h1 className={`mt-4 ${NEWS_BRAND_STYLES.pageTitle}`}>
              News & Articles
            </h1>

            <p className={`mt-4 max-w-3xl ${NEWS_BRAND_STYLES.bodyLarge}`}>
              Latest mobile news, gadget updates, launch watch, and cleaner
              guide content in a flatter editorial layout.
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-nowrap gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
              {NEWS_HOME_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleCategoryChange(tab.id)}
                  className={`shrink-0 rounded-md border px-4 py-2 text-sm font-semibold transition-colors duration-200 ${
                    activeCategory === tab.id
                      ? NEWS_BRAND_STYLES.activeSurface
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <Link to="/" className={NEWS_BRAND_STYLES.secondaryButton}>
              Back to home
              <FaArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        {loading && !hasAnyStories ? (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_21rem]">
            <div
              className={`min-h-[22rem] animate-pulse sm:min-h-[28rem] lg:min-h-[34rem] ${NEWS_BRAND_STYLES.cardShell}`}
            />
            <div
              className={`min-h-[22rem] animate-pulse sm:min-h-[28rem] lg:min-h-[34rem] ${NEWS_BRAND_STYLES.cardShell}`}
            />
          </div>
        ) : null}

        {!loading && error && !hasAnyStories ? (
          <div className={`p-6 ${NEWS_BRAND_STYLES.cardShell}`}>
            <p className="text-base font-semibold text-slate-900">
              The newsroom could not load right now.
            </p>
            <p className="mt-2 text-sm text-slate-600">{error}</p>
          </div>
        ) : null}

        {!loading && !error && !hasAnyStories ? (
          <div className={`p-6 ${NEWS_BRAND_STYLES.cardShell}`}>
            <p className="text-base font-semibold text-slate-900">
              No published stories yet.
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Publish a story from the admin newsroom and it will appear here
              automatically.
            </p>
          </div>
        ) : null}

        {hasStories ? (
          <>
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_21rem]">
              <article
                id={featuredStory.slug}
                className={`overflow-hidden ${NEWS_BRAND_STYLES.cardShell}`}
              >
                <div className="grid min-h-[22rem] gap-0 lg:min-h-[34rem] lg:grid-cols-[minmax(0,1.02fr)_minmax(280px,0.98fr)]">
                  <div className="order-2 flex flex-col justify-between border-t border-slate-200 bg-white/95 p-5 backdrop-blur-sm sm:p-6 lg:order-1 lg:border-b-0 lg:border-r lg:border-t-0 lg:p-8">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className={NEWS_BRAND_STYLES.label}>
                          {featuredStory.label}
                        </span>
                        <span className={NEWS_BRAND_STYLES.metaSmall}>/</span>
                        <span className={NEWS_BRAND_STYLES.meta}>
                          {featuredStory.publishedAt}
                        </span>
                      </div>

                      <h2 className={`mt-4 ${NEWS_BRAND_STYLES.sectionTitle}`}>
                        {featuredStory.title}
                      </h2>

                      <p
                        className={`mt-4 max-w-2xl ${NEWS_BRAND_STYLES.bodyLarge}`}
                      >
                        {featuredStory.summary}
                      </p>

                      <div className="mt-6 flex flex-wrap gap-5 border-t border-slate-200 pt-4">
                        {featuredStory.highlights.map((highlight) => (
                          <span
                            key={highlight}
                            className={NEWS_BRAND_STYLES.metaSmall}
                          >
                            {highlight}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-8 flex flex-wrap items-center gap-4">
                      <Link
                        to={createNewsStoryPath(featuredStory.slug)}
                        className={NEWS_BRAND_STYLES.primaryButton}
                      >
                        Read story
                        <FaArrowRight className="h-3.5 w-3.5" />
                      </Link>

                      <p className={NEWS_BRAND_STYLES.meta}>
                        By {featuredStory.author}
                      </p>
                    </div>
                  </div>

                  <div className="order-1 lg:order-2">
                    <NewsFeatureMedia story={featuredStory} />
                  </div>
                </div>
              </article>

              <aside
                className={`overflow-hidden ${NEWS_BRAND_STYLES.cardShell}`}
              >
                <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-5">
                  <div>
                    <p className={NEWS_BRAND_STYLES.eyebrow}>Trending now</p>
                    <h3 className={`mt-2 ${NEWS_BRAND_STYLES.featureTitle}`}>
                      Fast headlines
                    </h3>
                  </div>
                  <FaFire className="h-4 w-4 text-slate-900" />
                </div>

                <div className="divide-y divide-slate-200">
                  {trendingStories.map(({ rank, note, story }) =>
                    (() => {
                      const isActive = featuredStory.slug === story.slug;

                      return (
                        <button
                          key={story.slug}
                          type="button"
                          onClick={() => setFeaturedSlug(story.slug)}
                          className={`group flex w-full items-start gap-4 px-5 py-4 text-left transition-colors duration-200 ${
                            isActive
                              ? NEWS_BRAND_STYLES.activeSurface
                              : "bg-white text-slate-900 hover:bg-slate-50 hover:text-slate-950"
                          }`}
                        >
                          <span
                            className={`text-sm font-black tracking-[0.22em] ${
                              isActive
                                ? "text-white/55"
                                : "text-slate-300 group-hover:text-slate-500"
                            }`}
                          >
                            {rank}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span
                              className={`block text-[11px] font-semibold uppercase tracking-[0.22em] ${
                                isActive
                                  ? "text-white/60"
                                  : "text-slate-400 group-hover:text-slate-600"
                              }`}
                            >
                              {note}
                            </span>
                            <span
                              className={`mt-1 block text-sm font-semibold leading-6 ${
                                isActive
                                  ? "text-white"
                                  : "text-slate-900 group-hover:text-slate-950"
                              }`}
                            >
                              {story.title}
                            </span>
                          </span>
                        </button>
                      );
                    })(),
                  )}
                </div>
              </aside>
            </div>

            <div className="mt-10">
              <div className="max-w-3xl">
                <p className={NEWS_BRAND_STYLES.eyebrow}>
                  Latest News & Articles
                </p>
                <h3 className={`mt-3 ${NEWS_BRAND_STYLES.sectionTitle}`}>
                  Fresh updates, launch notes, and quick guides
                </h3>
                <p className={`mt-4 ${NEWS_BRAND_STYLES.body}`}>
                  A tighter newsroom feed with clear visuals, short summaries,
                  and fast scanning for mobile news, gadget updates, and
                  launches.
                </p>
              </div>

              {storyGrid.length ? (
                <div className="mt-6 grid gap-5 xl:grid-cols-3">
                  {storyGrid.map((story) => (
                    <article
                      key={story.slug}
                      id={story.slug}
                      className="group flex h-full overflow-hidden rounded-2xl border border-slate-200 text-left transition-colors duration-200"
                    >
                      <Link
                        to={createNewsStoryPath(story.slug)}
                        className="grid h-full grid-cols-[9.5rem_minmax(0,1fr)] items-stretch sm:grid-cols-[11rem_minmax(0,1fr)]"
                      >
                        <NewsCardMedia story={story} />

                        <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
                          <h4
                            className={`text-[15px] font-extrabold leading-6 tracking-tight transition-colors duration-200 group-hover:text-slate-700 sm:text-base lg:text-lg`}
                          >
                            {story.title}
                          </h4>
                        </div>
                      </Link>
                    </article>
                  ))}
                </div>
              ) : (
                <div className={`mt-6 p-5 ${NEWS_BRAND_STYLES.cardShell}`}>
                  <p className="text-sm text-slate-600">
                    No stories match the selected newsroom filter yet.
                  </p>
                </div>
              )}
            </div>
          </>
        ) : null}

        {!loading && !error && hasAnyStories && !hasStories ? (
          <div className={`p-6 ${NEWS_BRAND_STYLES.cardShell}`}>
            <p className="text-base font-semibold text-slate-900">
              No stories match this newsroom tab yet.
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Try another category or publish a story in this section from the
              admin newsroom.
            </p>
          </div>
        ) : null}

        {/*
        <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <div className={`${NEWS_BRAND_STYLES.cardShell} p-6`}>
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <p className={NEWS_BRAND_STYLES.eyebrow}>Guide deck</p>
                <h3 className={`mt-3 ${NEWS_BRAND_STYLES.featureTitle}`}>
                  UI rules for article and news layouts
                </h3>
              </div>

              <FaLayerGroup className="hidden h-4 w-4 text-slate-900 sm:block" />
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {NEWS_HOME_GUIDES.map((guide) => (
                <article
                  key={guide.id}
                  className={`${NEWS_BRAND_STYLES.softCardShell} p-5`}
                >
                  <p className={NEWS_BRAND_STYLES.label}>{guide.eyebrow}</p>
                  <h4 className={`mt-3 ${NEWS_BRAND_STYLES.cardTitle} text-lg`}>
                    {guide.title}
                  </h4>
                  <p className={`mt-3 ${NEWS_BRAND_STYLES.bodySmall}`}>
                    {guide.summary}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <div className={`${NEWS_BRAND_STYLES.softCardShell} p-6`}>
            <p className={NEWS_BRAND_STYLES.eyebrow}>Why this works</p>
            <h3 className={`mt-3 ${NEWS_BRAND_STYLES.featureTitle}`}>
              The page feels more editorial when the shapes stay calmer.
            </h3>

            <div className="mt-6 space-y-4">
              {NEWS_HOME_HIGHLIGHTS.map((item) => (
                <div
                  key={item.label}
                  className={`${NEWS_BRAND_STYLES.cardShell} p-4`}
                >
                  <p className={NEWS_BRAND_STYLES.label}>{item.label}</p>
                  <p className={`mt-2 ${NEWS_BRAND_STYLES.bodySmall}`}>
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
        */}
      </section>
    </main>
  );
};

export default NewsEditorialDesk;
