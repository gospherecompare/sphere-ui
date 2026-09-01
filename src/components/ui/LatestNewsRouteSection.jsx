import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FaArrowRight, FaClock } from "react-icons/fa";
import {
  createNewsStoryPath,
  usePublicNewsFeed,
} from "../../hooks/usePublicNews";

const NewsImage = ({ story, className = "" }) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [story?.image, story?.slug]);

  if (story?.image && !failed) {
    return (
      <img
        src={story.image}
        alt={story.heroImageAlt || story.title}
        loading="lazy"
        className={`h-full w-full object-cover ${className}`}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-50 via-white to-slate-100 px-5 text-center">
      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-blue-600">
          {story?.label || "News"}
        </p>
        <p className="mt-2 line-clamp-3 text-sm font-bold leading-5 text-slate-900">
          {story?.title || "Latest update"}
        </p>
      </div>
    </div>
  );
};

const StoryMeta = ({ story, compact = false, light = false }) => (
  <div
    className={`flex flex-wrap items-center gap-x-2 gap-y-1 font-medium ${
      compact ? "text-[10px]" : "text-[11px] sm:text-xs"
    } ${light ? "text-white/75" : "text-slate-500"}`}
  >
    <span>{story.author || "MobilesX News"}</span>
    <span aria-hidden="true">•</span>
    <span>{story.publishedAt}</span>
    {story.readTime ? (
      <>
        <span aria-hidden="true">•</span>
        <span className="inline-flex items-center gap-1">
          <FaClock className="text-[9px]" />
          {story.readTime}
        </span>
      </>
    ) : null}
  </div>
);

const StoryLabel = ({ story, light = false }) => (
  <span
    className={`inline-flex w-fit items-center rounded-md px-2 py-1 text-[9px] font-extrabold uppercase tracking-[0.14em] ${
      light
        ? "bg-white/15 text-white backdrop-blur-sm"
        : "bg-blue-50 text-blue-700"
    }`}
  >
    {story.label || "News"}
  </span>
);

const LeadingStoryCard = ({ story }) => (
  <Link
    to={createNewsStoryPath(story.slug)}
    className="group grid min-h-[320px] overflow-hidden rounded-xl bg-slate-950 lg:grid-cols-[1.08fr_0.92fr]"
  >
    <div className="relative min-h-[260px] overflow-hidden lg:min-h-full">
      <NewsImage
        story={story}
        className="transition-transform duration-500 group-hover:scale-[1.035]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/5 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-transparent lg:to-slate-950/35" />
      <div className="absolute left-4 top-4 lg:hidden">
        <StoryLabel story={story} light />
      </div>
    </div>

    <div className="flex min-w-0 flex-col justify-between p-5 sm:p-6 lg:p-7">
      <div>
        <div className="hidden lg:block">
          <StoryLabel story={story} light />
        </div>
        <h3 className="mt-3 line-clamp-3 text-xl font-black leading-tight tracking-[-0.025em] text-white sm:text-2xl lg:text-[1.75rem]">
          {story.title}
        </h3>
        {story.summary ? (
          <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-300">
            {story.summary}
          </p>
        ) : null}
      </div>

      <div className="mt-6 flex items-end justify-between gap-4">
        <StoryMeta story={story} light />
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blue-600 text-white transition-transform duration-200 group-hover:translate-x-1">
          <FaArrowRight className="text-xs" />
        </span>
      </div>
    </div>
  </Link>
);

const CompactStoryCard = ({ story }) => (
  <Link
    to={createNewsStoryPath(story.slug)}
    className="group grid min-h-[112px] grid-cols-[116px_minmax(0,1fr)] gap-3 rounded-xl bg-[#f7f9fc] p-2.5 transition-colors hover:bg-blue-50/70 sm:grid-cols-[132px_minmax(0,1fr)]"
  >
    <div className="overflow-hidden rounded-lg bg-white">
      <NewsImage
        story={story}
        className="transition-transform duration-300 group-hover:scale-[1.04]"
      />
    </div>

    <div className="flex min-w-0 flex-col justify-between py-1 pr-1">
      <div>
        <StoryLabel story={story} />
        <h3 className="mt-2 line-clamp-2 text-sm font-extrabold leading-5 tracking-tight text-slate-950 sm:text-[15px]">
          {story.title}
        </h3>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <StoryMeta story={story} compact />
        <FaArrowRight className="shrink-0 text-[10px] text-blue-600 transition-transform duration-200 group-hover:translate-x-1" />
      </div>
    </div>
  </Link>
);

const MobileStoryCard = ({ story }) => (
  <Link
    to={createNewsStoryPath(story.slug)}
    className="group w-[88%] shrink-0 snap-center overflow-hidden rounded-xl bg-white sm:w-[72%]"
  >
    <div className="relative h-48 overflow-hidden rounded-xl bg-slate-100 min-[390px]:h-52">
      <NewsImage
        story={story}
        className="transition-transform duration-300 group-hover:scale-[1.035]"
      />
      <div className="absolute left-3 top-3">
        <StoryLabel story={story} light />
      </div>
    </div>

    <div className="px-1 pb-2 pt-3">
      <h3 className="line-clamp-2 text-base font-black leading-5 tracking-tight text-slate-950">
        {story.title}
      </h3>
      {story.summary ? (
        <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-600">
          {story.summary}
        </p>
      ) : null}
      <div className="mt-3 flex items-center justify-between gap-3">
        <StoryMeta story={story} compact />
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700">
          Read <FaArrowRight className="text-[9px]" />
        </span>
      </div>
    </div>
  </Link>
);

const LatestNewsRouteSection = ({
  className = "",
  limit = 4,
  title = "Latest News",
  subtitle = "Fresh mobile launches, product updates, and buying context from the MobilesX news desk.",
  productType = "",
  newsLinkLabel = "",
}) => {
  const { stories, loading, error } = usePublicNewsFeed({ limit, productType });
  const visibleStories = stories.slice(0, limit);
  const leadingStory = visibleStories[0] || null;
  const compactStories = visibleStories.slice(1);
  const mobileCarouselRef = useRef(null);
  const [activeMobileIndex, setActiveMobileIndex] = useState(0);

  const resolvedNewsLinkLabel =
    newsLinkLabel ||
    (productType === "tv"
      ? "Latest TV news"
      : productType === "laptop"
        ? "Latest laptop news"
        : "Latest smartphone news");

  const mobileStorySignature = useMemo(
    () => visibleStories.map((story) => story?.slug || "").join("|"),
    [visibleStories],
  );

  useEffect(() => {
    setActiveMobileIndex(0);
    const container = mobileCarouselRef.current;
    if (container) {
      container.scrollTo({ left: 0, behavior: "auto" });
    }
  }, [mobileStorySignature]);

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

    container.scrollTo({ left: nextLeft, behavior: "smooth" });
    setActiveMobileIndex(index);
  };

  useEffect(() => {
    if (visibleStories.length <= 1) return undefined;

    const intervalId = window.setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      const nextIndex = (activeMobileIndex + 1) % visibleStories.length;
      scrollToMobileStory(nextIndex);
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [activeMobileIndex, mobileStorySignature, visibleStories.length]);

  if (!loading && (!visibleStories.length || error)) return null;

  return (
    <section
      className={`smartphones-news-section mx-auto w-full max-w-7xl rounded-[20px] bg-transparent p-0           sm:p-6 ${className}`}
    >
      <div className="mb-5 flex items-end justify-between gap-4 sm:mb-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <p className="text-[10px] font-extrabold uppercase tracking-[0.28em] text-blue-700 sm:text-[11px]">
              Latest Updates
            </p>
          </div>
          <h2 className="mt-2 text-xl font-black tracking-[-0.025em] text-slate-950 sm:text-2xl lg:text-3xl">
            {title}
          </h2>
          <p className="mt-1.5 max-w-2xl text-xs leading-5 text-slate-600 sm:text-sm sm:leading-6">
            {subtitle}
          </p>
        </div>

        <Link
          to="/news"
          className="hidden shrink-0 items-center gap-2 rounded-full bg-blue-600 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-blue-700 sm:inline-flex"
        >
          {resolvedNewsLinkLabel}
          <FaArrowRight className="text-[10px]" />
        </Link>
      </div>

      {loading && !visibleStories.length ? (
        <div className="grid gap-3 lg:grid-cols-[1.45fr_0.85fr]">
          <div className="min-h-[360px] animate-pulse rounded-2xl bg-slate-200" />
          <div className="space-y-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-[112px] animate-pulse rounded-xl bg-slate-100"
              />
            ))}
          </div>
        </div>
      ) : null}

      {visibleStories.length ? (
        <>
          <div className="hidden gap-3 sm:grid lg:grid-cols-[1.45fr_0.85fr]">
            {leadingStory ? <LeadingStoryCard story={leadingStory} /> : null}
            <div className="grid content-start gap-3">
              {compactStories.map((story) => (
                <CompactStoryCard key={story.slug} story={story} />
              ))}
            </div>
          </div>

          <div className="sm:hidden">
            <div
              ref={mobileCarouselRef}
              onScroll={syncActiveMobileIndex}
              className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-2 pr-7 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {visibleStories.map((story) => (
                <MobileStoryCard key={story.slug} story={story} />
              ))}
            </div>

            {visibleStories.length > 1 ? (
              <div className="mt-3 flex justify-center gap-1.5">
                {visibleStories.map((story, index) => (
                  <button
                    key={`${story.slug}-dot`}
                    type="button"
                    aria-label={`Go to story ${index + 1}`}
                    onClick={() => scrollToMobileStory(index)}
                    className={`h-1.5 rounded-full transition-all duration-200 ${
                      activeMobileIndex === index
                        ? "w-5 bg-blue-600"
                        : "w-1.5 bg-slate-300"
                    }`}
                  />
                ))}
              </div>
            ) : null}

            <Link
              to="/news"
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-xs font-bold text-white"
            >
              {resolvedNewsLinkLabel}
              <FaArrowRight className="text-[10px]" />
            </Link>
          </div>
        </>
      ) : null}
    </section>
  );
};

export default LatestNewsRouteSection;
