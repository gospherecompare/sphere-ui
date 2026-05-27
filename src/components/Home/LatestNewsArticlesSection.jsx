import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FaArrowRight } from "react-icons/fa";
import { NEWS_BRAND_STYLES } from "./newsBrandStyles";
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
    <section className="relative overflow-hidden bg-[#050712] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,#073C8C_0%,#24105E_34%,#0B1547_62%,#073C8C_100%)]" />
      <div className="pointer-events-none absolute inset-0 hidden bg-[radial-gradient(circle_at_15%_14%,rgba(34,211,238,0.22),transparent_30%),radial-gradient(circle_at_84%_18%,rgba(217,70,239,0.2),transparent_34%),radial-gradient(circle_at_50%_94%,rgba(59,130,246,0.18),transparent_42%)] sm:block" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(34,211,238,0.18),transparent_42%),radial-gradient(circle_at_92%_22%,rgba(217,70,239,0.16),transparent_42%),radial-gradient(circle_at_38%_86%,rgba(59,130,246,0.15),transparent_48%)] sm:hidden" />

      <svg
        className="pointer-events-none absolute inset-0 hidden h-full w-full opacity-70 mix-blend-screen sm:block"
        viewBox="0 0 1440 760"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="newsHomeTrace" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#22D3EE" stopOpacity="0" />
            <stop offset="45%" stopColor="#60A5FA" stopOpacity="0.56" />
            <stop offset="100%" stopColor="#D946EF" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="newsHomeFrame" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#67E8F9" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#C084FC" stopOpacity="0.18" />
          </linearGradient>
        </defs>
        <path
          d="M-80 170H202C286 170 292 272 378 272H626C724 272 732 140 830 140H1052C1148 140 1160 258 1254 258H1520"
          stroke="url(#newsHomeTrace)"
          strokeWidth="2"
          fill="none"
        />
        <path
          d="M-80 610H210C290 610 306 520 388 520H646C742 520 750 632 844 632H1072C1170 632 1186 508 1282 508H1520"
          stroke="url(#newsHomeTrace)"
          strokeWidth="2"
          fill="none"
        />
        <rect
          x="82"
          y="334"
          width="184"
          height="114"
          rx="22"
          fill="rgba(14,165,233,0.04)"
          stroke="url(#newsHomeFrame)"
          strokeWidth="2"
        />
        <rect
          x="1150"
          y="284"
          width="190"
          height="118"
          rx="22"
          fill="rgba(168,85,247,0.05)"
          stroke="url(#newsHomeFrame)"
          strokeWidth="2"
        />
        <circle cx="378" cy="272" r="5" fill="rgba(186,230,253,0.42)" />
        <circle cx="844" cy="632" r="5" fill="rgba(216,180,254,0.38)" />
      </svg>

      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-40 mix-blend-screen sm:hidden"
        viewBox="0 0 390 820"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="newsHomeMobileTrace" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#22D3EE" stopOpacity="0" />
            <stop offset="48%" stopColor="#60A5FA" stopOpacity="0.46" />
            <stop offset="100%" stopColor="#D946EF" stopOpacity="0" />
          </linearGradient>
          <linearGradient
            id="newsHomeMobileFrame"
            x1="0"
            y1="0"
            x2="1"
            y2="1"
          >
            <stop offset="0%" stopColor="#67E8F9" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#C084FC" stopOpacity="0.15" />
          </linearGradient>
        </defs>
        <path
          d="M-34 88H78C116 88 122 146 164 146H258C302 146 306 92 426 92"
          stroke="url(#newsHomeMobileTrace)"
          strokeWidth="1.6"
          fill="none"
        />
        <path
          d="M-36 570H86C128 570 140 504 184 504H260C304 504 314 612 426 612"
          stroke="url(#newsHomeMobileTrace)"
          strokeWidth="1.6"
          fill="none"
        />
        <rect
          x="-18"
          y="302"
          width="84"
          height="114"
          rx="18"
          fill="rgba(14,165,233,0.04)"
          stroke="url(#newsHomeMobileFrame)"
          strokeWidth="1.5"
        />
        <rect
          x="302"
          y="420"
          width="86"
          height="116"
          rx="20"
          fill="rgba(168,85,247,0.05)"
          stroke="url(#newsHomeMobileFrame)"
          strokeWidth="1.5"
        />
        <circle cx="78" cy="88" r="3.5" fill="rgba(186,230,253,0.38)" />
        <circle cx="184" cy="504" r="3.5" fill="rgba(216,180,254,0.34)" />
      </svg>

      <div className="pointer-events-none absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-[#050712]/30 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#050712]/40 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="flex flex-col gap-5 sm:gap-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="inline-flex rounded-md border border-cyan-200/20 bg-cyan-300/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.24em] text-cyan-100">
                Latest News
              </p>
              <h2 className="mt-5 max-w-4xl text-[2.45rem] font-black leading-[0.98] tracking-[-0.05em] text-white sm:text-5xl sm:leading-[1.02] lg:text-6xl">
                News cards that stay sharp,
                <span className="block bg-gradient-to-r from-sky-200 via-white to-fuchsia-200 bg-clip-text text-transparent">
                  swipe cleanly, and feel made for mobile.
                </span>
              </h2>
              <p className="mt-5 max-w-2xl text-sm font-semibold leading-6 text-cyan-50/72 sm:text-base sm:leading-7">
                Fresh launches, quick context, and product updates from the
                Hooks newsroom with a cleaner image-first layout.
              </p>
            </div>

            <Link
              to="/news"
              className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-cyan-200/18 bg-cyan-300/10 px-5 py-3 text-sm font-bold text-cyan-50/90 shadow-[0_16px_42px_rgba(14,165,233,0.12)] backdrop-blur-xl transition-all duration-200 hover:border-fuchsia-200/30 hover:bg-fuchsia-400/12 hover:text-white sm:w-auto"
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
