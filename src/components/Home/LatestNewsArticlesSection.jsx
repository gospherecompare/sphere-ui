import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FaArrowRight } from "react-icons/fa";
import { NEWS_BRAND_STYLES } from "./newsBrandStyles";
import {
  createNewsStoryPath,
  usePublicNewsFeed,
} from "../../hooks/usePublicNews";
import {
  HOME_SECTION_LEAD_LIGHT,
  HOME_SECTION_TITLE_LIGHT,
} from "./homeSectionTypography";
import "../../styles/hideScrollbar.css";

const NewsStoryMedia = ({
  story,
  className = "aspect-[4/3]",
  imageClassName = "",
}) => {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [story?.image, story?.slug]);

  return (
    <div className={`overflow-hidden bg-slate-50 ${className}`}>
      {!imageError && story?.image ? (
        <img
          src={story.image}
          alt={story.title}
          className={`h-full w-full object-cover ${imageClassName}`}
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

const buildStoryExcerpt = (story) => {
  const rawText = String(
    story?.excerpt ||
      story?.metaDescription ||
      story?.description ||
      story?.title ||
      "",
  )
    .replace(/\s+/g, " ")
    .trim();

  if (!rawText) return "Tap into the full story from the Hooks newsroom.";
  if (rawText.length <= 150) return rawText;
  return `${rawText.slice(0, 147).trim()}...`;
};

const LatestNewsArticlesSection = () => {
  const { stories, loading, error } = usePublicNewsFeed({ limit: 4 });
  const leadStory = stories[0] || null;
  const listStories = stories.slice(1, 4);
  const mobileStories = useMemo(
    () => stories.slice(0, 4).filter(Boolean),
    [stories],
  );
  const mobileCarouselRef = useRef(null);
  const [activeMobileIndex, setActiveMobileIndex] = useState(0);

  useEffect(() => {
    setActiveMobileIndex(0);
    const container = mobileCarouselRef.current;
    if (container) {
      container.scrollTo({ left: 0, behavior: "auto" });
    }
  }, [mobileStories.length]);

  const syncActiveMobileIndex = () => {
    const container = mobileCarouselRef.current;
    if (!container) return;

    const cards = Array.from(container.children);
    if (!cards.length) return;

    const viewportCenter = container.scrollLeft + container.clientWidth / 2;
    let nextIndex = 0;
    let smallestDistance = Number.POSITIVE_INFINITY;

    cards.forEach((card, index) => {
      const cardCenter = card.offsetLeft + card.clientWidth / 2;
      const distance = Math.abs(cardCenter - viewportCenter);
      if (distance < smallestDistance) {
        smallestDistance = distance;
        nextIndex = index;
      }
    });

    setActiveMobileIndex(nextIndex);
  };

  const scrollToMobileStory = (index) => {
    const container = mobileCarouselRef.current;
    const target = container?.children?.[index];
    if (!container || !target) return;

    const nextLeft = Math.max(
      target.offsetLeft - (container.clientWidth - target.clientWidth) / 2,
      0,
    );

    container.scrollTo({
      left: nextLeft,
      behavior: "smooth",
    });
    setActiveMobileIndex(index);
  };

  return (
    <section className="border-t border-slate-200 ">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="flex flex-col gap-5 sm:gap-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.32em] text-sky-700">
                Latest News
              </p>
              <h2 className={HOME_SECTION_TITLE_LIGHT}>
                News cards that stay sharp, swipe cleanly, and feel made for
                mobile.
              </h2>
              <p className={HOME_SECTION_LEAD_LIGHT}>
                Fresh launches, quick context, and product updates from the
                Hooks newsroom with a cleaner image-first layout.
              </p>
            </div>

            <Link
              to="/news"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-[0_12px_30px_rgba(15,23,42,0.06)] transition-all duration-200 hover:border-slate-300 hover:shadow-[0_16px_36px_rgba(15,23,42,0.1)] sm:w-auto"
            >
              View all stories
              <FaArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {loading && !leadStory ? (
            <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="h-[24rem] animate-pulse rounded-2xl border border-slate-200 bg-white/80" />
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-white/80"
                  />
                ))}
              </div>
            </div>
          ) : null}

          {!loading && error && !leadStory ? (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6 sm:p-8">
              <p className="font-semibold text-red-900">Unable to load news</p>
              <p className="mt-2 text-red-700">{error}</p>
            </div>
          ) : null}

          {!loading && !error && !leadStory ? (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white/80 p-8 text-center">
              <p className="font-semibold text-slate-900">
                No stories published yet
              </p>
              <p className="mt-2 text-slate-600">
                Check back soon for the latest news and articles.
              </p>
            </div>
          ) : null}

          {mobileStories.length ? (
            <div className="mt-6 lg:hidden">
              <div
                ref={mobileCarouselRef}
                onScroll={syncActiveMobileIndex}
                className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2"
              >
                {mobileStories.map((story) => (
                  <Link
                    key={story.slug}
                    to={createNewsStoryPath(story.slug)}
                    className="group w-[84vw] max-w-[21rem] shrink-0 snap-center rounded-2xl  bg-white p-3 shadow-[0_22px_50px_rgba(15,23,42,0.08)]"
                  >
                    <div className="relative overflow-hidden rounded-2xl">
                      <NewsStoryMedia
                        story={story}
                        className="aspect-[1/1.06]"
                        imageClassName="transition-transform duration-500 group-hover:scale-[1.03]"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/18 to-transparent" />

                      <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/75">
                          <span className="truncate">
                            {story.label || "Newsroom"}
                          </span>
                          <span className="h-1 w-1 rounded-full bg-white/60" />
                          <span className="truncate">{story.publishedAt}</span>
                        </div>

                        <h3 className="mt-2 line-clamp-2 text-[1.1rem] font-black leading-tight tracking-tight">
                          {story.title}
                        </h3>
                      </div>
                    </div>

                    <div className="px-1 pb-1 pt-4">
                      <p className="line-clamp-2 text-sm leading-6 text-slate-600">
                        {buildStoryExcerpt(story)}
                      </p>

                      <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-sky-700 transition-all duration-200 group-hover:gap-2 group-hover:text-sky-800">
                        Read story
                        <FaArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>

              {mobileStories.length > 1 ? (
                <div className="mt-5 flex justify-center gap-2">
                  {mobileStories.map((story, index) => (
                    <button
                      key={`${story.slug}-dot`}
                      type="button"
                      aria-label={`Go to story ${index + 1}`}
                      onClick={() => scrollToMobileStory(index)}
                      className={`h-2 rounded-full transition-all duration-200 ${
                        activeMobileIndex === index
                          ? "w-6 bg-slate-700"
                          : "w-2 bg-slate-300 hover:bg-slate-400"
                      }`}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {leadStory ? (
            <div className="mt-6 hidden gap-6 lg:grid lg:grid-cols-[1.15fr_0.85fr]">
              <Link
                to={createNewsStoryPath(leadStory.slug)}
                className="group overflow-hidden rounded-2xl border border-white/80 bg-white p-4 shadow-[0_24px_60px_rgba(15,23,42,0.08)]"
              >
                <div className="overflow-hidden rounded-2xl">
                  <NewsStoryMedia
                    story={leadStory}
                    className="aspect-[16/11]"
                    imageClassName="transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                </div>

                <div className="mt-5 flex flex-col gap-4">
                  <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    <span className="text-sky-700">
                      {leadStory.label || "Newsroom"}
                    </span>
                    <span>{leadStory.publishedAt}</span>
                  </div>

                  <h3 className="text-[1.75rem] font-black leading-[1.05] tracking-tight text-slate-950">
                    {leadStory.title}
                  </h3>

                  <p className="max-w-2xl text-base leading-8 text-slate-600">
                    {buildStoryExcerpt(leadStory)}
                  </p>

                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 transition-all duration-200 group-hover:gap-3 group-hover:text-sky-700">
                    Read featured story
                    <FaArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>

              <div className="flex flex-col gap-4">
                {listStories.map((story) => (
                  <article
                    key={story.slug}
                    className="overflow-hidden rounded-2xl border border-white/80 bg-white p-4 shadow-[0_18px_42px_rgba(15,23,42,0.06)]"
                  >
                    <Link
                      to={createNewsStoryPath(story.slug)}
                      className="group flex items-stretch gap-4"
                    >
                      <div className="w-40 flex-shrink-0 overflow-hidden rounded-2xl">
                        <NewsStoryMedia
                          story={story}
                          className="aspect-[1/1.06] h-full"
                          imageClassName="transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                      </div>

                      <div className="flex min-w-0 flex-1 flex-col justify-between py-1">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                            <span className="truncate text-sky-700">
                              {story.label || "Newsroom"}
                            </span>
                            <span className="h-1 w-1 rounded-full bg-slate-300" />
                            <span className="truncate">
                              {story.publishedAt}
                            </span>
                          </div>

                          <h4 className="mt-3 line-clamp-2 text-lg font-black leading-tight tracking-tight text-slate-900 transition-colors duration-200 group-hover:text-sky-800">
                            {story.title}
                          </h4>

                          <p className="mt-3 line-clamp-3 text-sm leading-7 text-slate-600">
                            {buildStoryExcerpt(story)}
                          </p>
                        </div>

                        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-900 transition-all duration-200 group-hover:gap-2 group-hover:text-sky-700">
                          Read
                          <FaArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    </Link>
                  </article>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
};

export default LatestNewsArticlesSection;
