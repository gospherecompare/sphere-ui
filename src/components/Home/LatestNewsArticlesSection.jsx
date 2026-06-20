import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FaArrowRight } from "react-icons/fa";
import {
  createNewsStoryPath,
  usePublicNewsFeed,
} from "../../hooks/usePublicNews";
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
    <div className={`overflow-hidden bg-[#071024]/80 ${className}`}>
      {!imageError && story?.image ? (
        <img
          src={story.image}
          alt={story.title}
          className={`h-full w-full object-cover ${imageClassName}`}
          loading="lazy"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_20%_18%,rgba(34,211,238,0.16),transparent_38%),radial-gradient(circle_at_82%_84%,rgba(217,70,239,0.16),transparent_42%),#071024] p-5 text-center">
          <div className="max-w-md">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-100/70">
              {story?.label || "News"}
            </p>
            <h3 className="mt-3 text-base font-black leading-tight tracking-tight text-white sm:text-lg">
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

  if (!rawText) return "Tap into the full story from the Hooks news desk.";
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
    <section className="relative overflow-hidden bg-[#050712] text-white">
      <svg
        className="pointer-events-none absolute inset-0 hidden h-full w-full opacity-70 sm:block"
        viewBox="0 0 1440 760"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <path
          d="M-36 170H220c94 0 102-118 192-118h254c100 0 98 150 208 150h606"
          fill="none"
          stroke="rgba(125,211,252,0.18)"
          strokeWidth="3"
        />
        <path
          d="M910 136h214c84 0 86 104 166 104h194"
          fill="none"
          stroke="rgba(216,180,254,0.16)"
          strokeWidth="3"
        />
        <path
          d="M-18 618h248c88 0 104-144 196-144h320c104 0 114 158 224 158h490"
          fill="none"
          stroke="rgba(56,189,248,0.14)"
          strokeWidth="3"
        />
        <rect
          x="1018"
          y="278"
          width="214"
          height="118"
          rx="28"
          fill="none"
          stroke="rgba(125,211,252,0.13)"
          strokeWidth="3"
        />
        <rect
          x="166"
          y="466"
          width="184"
          height="104"
          rx="28"
          fill="none"
          stroke="rgba(216,180,254,0.12)"
          strokeWidth="3"
        />
      </svg>

      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-65 sm:hidden"
        viewBox="0 0 390 820"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <path
          d="M-34 92H108c60 0 58 82 116 82h202"
          fill="none"
          stroke="rgba(125,211,252,0.18)"
          strokeWidth="2"
        />
        <path
          d="M52 370h108c45 0 44 68 90 68h176"
          fill="none"
          stroke="rgba(216,180,254,0.15)"
          strokeWidth="2"
        />
        <path
          d="M-20 670h120c52 0 52-76 104-76h214"
          fill="none"
          stroke="rgba(56,189,248,0.12)"
          strokeWidth="2"
        />
        <rect
          x="286"
          y="294"
          width="78"
          height="110"
          rx="20"
          fill="none"
          stroke="rgba(125,211,252,0.13)"
          strokeWidth="2"
        />
        <rect
          x="24"
          y="552"
          width="92"
          height="138"
          rx="22"
          fill="none"
          stroke="rgba(216,180,254,0.12)"
          strokeWidth="2"
        />
        <circle cx="108" cy="92" r="4" fill="rgba(103,232,249,0.55)" />
        <circle cx="250" cy="438" r="4" fill="rgba(216,180,254,0.5)" />
      </svg>

      <div className="pointer-events-none absolute left-[-7rem] top-12 hidden h-80 w-80 rounded-full border border-cyan-300/12 sm:block" />
      <div className="pointer-events-none absolute right-[-8rem] bottom-8 hidden h-80 w-80 rounded-full border border-fuchsia-300/14 sm:block" />
      <div className="pointer-events-none absolute inset-x-0 top-1/2 hidden h-px bg-gradient-to-r from-transparent via-cyan-300/18 to-transparent sm:block" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-[#050712]/32 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#050712]/32 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="flex flex-col gap-5 sm:gap-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="inline-flex rounded-md border border-cyan-200/20 bg-cyan-300/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.24em] text-cyan-100">
                Latest Updates
              </p>
              <h2 className="mt-5 max-w-4xl text-[2.45rem] font-black leading-[0.98] tracking-[-0.05em] text-white sm:text-5xl sm:leading-[1.02] lg:text-6xl">
                Story cards that stay sharp,
                <span className="block bg-gradient-to-r from-sky-200 via-white to-fuchsia-200 bg-clip-text text-transparent">
                  swipe cleanly, and feel made for mobile.
                </span>
              </h2>
              <p className="mt-5 max-w-2xl text-sm font-semibold leading-6 text-cyan-50/72 sm:text-base sm:leading-7">
                Fresh launches, quick context, and product updates from the
                Hooks news desk with a cleaner image-first layout.
              </p>
            </div>

            <Link
              to="/news"
              className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-cyan-200/18 bg-cyan-300/10 px-5 py-3 text-sm font-bold text-cyan-50/90 shadow-[0_16px_42px_rgba(14,165,233,0.12)] transition-all duration-200 hover:border-fuchsia-200/30 hover:bg-fuchsia-400/12 hover:text-white sm:w-auto"
            >
              View all stories
              <FaArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {loading && !leadStory ? (
            <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="h-[24rem] animate-pulse rounded-lg border border-cyan-200/14 bg-white/[0.055]" />
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-32 animate-pulse rounded-lg border border-cyan-200/14 bg-white/[0.055]"
                  />
                ))}
              </div>
            </div>
          ) : null}

          {!loading && error && !leadStory ? (
            <div className="mt-6 rounded-lg border border-red-300/20 bg-red-500/10 p-6 text-red-50 shadow-[0_18px_54px_rgba(2,6,23,0.18)] sm:p-8">
              <p className="font-semibold text-white">Unable to load stories</p>
              <p className="mt-2 text-sm text-red-100/75">{error}</p>
            </div>
          ) : null}

          {!loading && !error && !leadStory ? (
            <div className="mt-6 rounded-lg border border-cyan-200/14 bg-white/[0.055] p-8 text-center">
              <p className="font-semibold text-white">
                No stories published yet
              </p>
              <p className="mt-2 text-cyan-50/70">
                Check back soon for the latest stories and updates.
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
                {mobileStories.map((story, index) => (
                  <Link
                    key={story.slug}
                    to={createNewsStoryPath(story.slug)}
                    className="group relative w-[84vw] max-w-[21rem] shrink-0 snap-center overflow-hidden rounded-lg border border-cyan-200/16 bg-white/[0.055] p-3 shadow-[0_16px_42px_rgba(2,6,23,0.14)] transition-all duration-300 hover:border-cyan-200/28 hover:bg-white/[0.075]"
                  >
                    <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_22%_12%,rgba(56,189,248,0.16),transparent_32%),radial-gradient(circle_at_86%_28%,rgba(168,85,247,0.18),transparent_36%)] opacity-90" />
                    <span className="pointer-events-none absolute -right-6 top-12 text-8xl font-black leading-none text-white/[0.035] transition-transform duration-300 group-hover:scale-110">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="relative z-10 overflow-hidden rounded-lg">
                      <NewsStoryMedia
                        story={story}
                        className="aspect-[1/1.06]"
                        imageClassName="transition-transform duration-500 group-hover:scale-[1.03]"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-[#050712] via-[#050712]/20 to-transparent" />

                      <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/75">
                          <span className="truncate">
                            {story.label || "News"}
                          </span>
                          <span className="h-1 w-1 rounded-full bg-white/60" />
                          <span className="truncate">{story.publishedAt}</span>
                        </div>

                        <h3 className="mt-2 line-clamp-2 text-[1.1rem] font-black leading-tight tracking-tight">
                          {story.title}
                        </h3>
                      </div>
                    </div>

                    <div className="relative z-10 px-1 pb-1 pt-4">
                      <p className="line-clamp-2 text-sm font-medium leading-6 text-cyan-50/70">
                        {buildStoryExcerpt(story)}
                      </p>

                      <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-cyan-100 transition-all duration-200 group-hover:gap-2 group-hover:text-white">
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
                          ? "w-6 bg-cyan-100"
                          : "w-2 bg-white/[0.22] hover:bg-white/[0.38]"
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
                className="group relative overflow-hidden rounded-lg border border-cyan-200/16 bg-white/[0.055] p-4 shadow-[0_16px_42px_rgba(2,6,23,0.14)] transition-all duration-300 hover:border-cyan-200/28 hover:bg-white/[0.075]"
              >
                <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_22%_12%,rgba(56,189,248,0.16),transparent_32%),radial-gradient(circle_at_86%_28%,rgba(168,85,247,0.18),transparent_36%)] opacity-90" />
                <span className="pointer-events-none absolute -right-6 top-12 text-8xl font-black leading-none text-white/[0.035] transition-transform duration-300 group-hover:scale-110">
                  01
                </span>
                <div className="relative z-10 overflow-hidden rounded-lg">
                  <NewsStoryMedia
                    story={leadStory}
                    className="aspect-[16/11]"
                    imageClassName="transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                </div>

                <div className="relative z-10 mt-5 flex flex-col gap-4">
                  <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-100/60">
                    <span className="rounded-md border border-white/10 bg-white/10 px-2.5 py-1 text-[10px] font-black text-cyan-100">
                      Story 01
                    </span>
                    <span className="text-cyan-100">
                      {leadStory.label || "News"}
                    </span>
                    <span>{leadStory.publishedAt}</span>
                  </div>

                  <h3 className="text-[1.75rem] font-black leading-[1.05] tracking-tight text-white">
                    {leadStory.title}
                  </h3>

                  <p className="max-w-2xl text-base font-medium leading-8 text-cyan-50/70">
                    {buildStoryExcerpt(leadStory)}
                  </p>

                  <span className="inline-flex items-center gap-2 text-sm font-bold text-cyan-100 transition-all duration-200 group-hover:gap-3 group-hover:text-white">
                    Read featured story
                    <FaArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>

              <div className="flex flex-col gap-4">
                {listStories.map((story, index) => (
                  <article
                    key={story.slug}
                    className="relative overflow-hidden rounded-lg border border-cyan-200/14 bg-white/[0.055] p-4 shadow-[0_14px_34px_rgba(2,6,23,0.12)] transition-all duration-300 hover:border-cyan-200/26 hover:bg-white/[0.075]"
                  >
                    <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_22%_12%,rgba(56,189,248,0.12),transparent_30%),radial-gradient(circle_at_86%_28%,rgba(168,85,247,0.14),transparent_34%)] opacity-90" />
                    <span className="pointer-events-none absolute -right-4 top-6 text-7xl font-black leading-none text-white/[0.03] transition-transform duration-300 group-hover:scale-110">
                      {String(index + 2).padStart(2, "0")}
                    </span>
                    <Link
                      to={createNewsStoryPath(story.slug)}
                      className="group relative z-10 flex items-stretch gap-4"
                    >
                      <div className="w-40 flex-shrink-0 overflow-hidden rounded-lg">
                        <NewsStoryMedia
                          story={story}
                          className="aspect-[1/1.06] h-full"
                          imageClassName="transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                      </div>

                      <div className="flex min-w-0 flex-1 flex-col justify-between py-1">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-100/56">
                            <span className="rounded-md border border-white/10 bg-white/10 px-2 py-1 text-[9px] font-black text-cyan-100">
                              Story {String(index + 2).padStart(2, "0")}
                            </span>
                            <span className="truncate text-cyan-100">
                              {story.label || "News"}
                            </span>
                            <span className="h-1 w-1 rounded-full bg-cyan-100/38" />
                            <span className="truncate">
                              {story.publishedAt}
                            </span>
                          </div>

                          <h4 className="mt-3 line-clamp-2 text-lg font-black leading-tight tracking-tight text-white transition-colors duration-200 group-hover:text-cyan-100">
                            {story.title}
                          </h4>

                          <p className="mt-3 line-clamp-3 text-sm font-medium leading-7 text-cyan-50/64">
                            {buildStoryExcerpt(story)}
                          </p>
                        </div>

                        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-cyan-100 transition-all duration-200 group-hover:gap-2 group-hover:text-white">
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
