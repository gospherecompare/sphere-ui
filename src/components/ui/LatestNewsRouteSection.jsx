import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FaArrowRight } from "react-icons/fa";
import {
  createNewsStoryPath,
  usePublicNewsFeed,
} from "../../hooks/usePublicNews";

const NewsImage = ({ story }) => {
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
        className="h-full w-full object-cover"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-blue-50 px-4 text-center">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-blue-600">
          {story?.label || "News"}
        </p>
        <p className="mt-2 line-clamp-3 text-sm font-semibold leading-5 text-slate-900">
          {story?.title || "Latest update"}
        </p>
      </div>
    </div>
  );
};

const LatestNewsRouteSection = ({
  className = "",
  limit = 4,
  title = "Latest News",
  subtitle = "Fresh mobile launches, product updates, and buying context from the Hooks news desk.",
  productType = "",
  newsLinkLabel = "",
}) => {
  const { stories, loading, error } = usePublicNewsFeed({ limit, productType });
  const visibleStories = stories.slice(0, limit);
  const mobileCarouselRef = useRef(null);
  const [activeMobileIndex, setActiveMobileIndex] = useState(0);
  const resolvedNewsLinkLabel =
    newsLinkLabel ||
    (productType === "tv"
      ? "Latest TV news"
      : productType === "laptop"
        ? "Latest laptop news"
        : "Latest smartphone news");
  const mobileStorySignature = visibleStories
    .map((story) => story?.slug || "")
    .join("|");

  useEffect(() => {
    setActiveMobileIndex(0);
    const container = mobileCarouselRef.current;
    if (container) {
      container.scrollTo({ left: 0, behavior: "auto" });
    }
  }, [visibleStories.length]);

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

  useEffect(() => {
    if (visibleStories.length <= 1) return undefined;

    const intervalId = window.setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;

      const container = mobileCarouselRef.current;
      if (!container) return;

      const cards = Array.from(container.children);
      if (!cards.length) return;

      const viewportCenter = container.scrollLeft + container.clientWidth / 2;
      let currentIndex = 0;
      let smallestDistance = Number.POSITIVE_INFINITY;

      cards.forEach((card, index) => {
        const cardCenter = card.offsetLeft + card.clientWidth / 2;
        const distance = Math.abs(cardCenter - viewportCenter);
        if (distance < smallestDistance) {
          smallestDistance = distance;
          currentIndex = index;
        }
      });

      const nextIndex = (currentIndex + 1) % cards.length;
      const target = cards[nextIndex];
      const nextLeft = Math.max(
        target.offsetLeft - (container.clientWidth - target.clientWidth) / 2,
        0,
      );

      container.scrollTo({
        left: nextLeft,
        behavior: "smooth",
      });
      setActiveMobileIndex(nextIndex);
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [mobileStorySignature, visibleStories.length]);

  if (!loading && (!visibleStories.length || error)) return null;

  return (
    <section
      className={`mx-auto w-full max-w-7xl overflow-hidden rounded-2xl bg-purple-50 px-3 py-4 shadow-[0_2px_8px_rgba(15,23,42,0.08)] sm:px-5 sm:py-8 md:px-6 md:py-10 ${className}`}
    >
      <div className="mb-3 flex flex-col items-start justify-between gap-2 border-b border-blue-500 pb-3 sm:mb-6 sm:flex-row sm:items-center sm:gap-4 sm:pb-4">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-purple-700 sm:text-[11px]">
            Latest Updates
          </p>
          <h2 className="mt-1 text-sm font-semibold tracking-tight text-slate-900 sm:mt-2 sm:text-lg md:text-xl">
            {title}
          </h2>
          <p className="mt-1 max-w-2xl text-[11px] leading-relaxed text-slate-600 sm:text-[13px] sm:leading-relaxed">
            {subtitle}
          </p>
        </div>

        <Link
          to="/news"
          className="hidden w-full shrink-0 items-center justify-center gap-2 rounded-md bg-purple-600 px-3 py-2 text-[11px] font-semibold leading-5 text-white transition-colors hover:bg-purple-700 sm:inline-flex sm:w-auto sm:text-[12px]"
        >
          {resolvedNewsLinkLabel}
          <FaArrowRight className="text-[10px] sm:text-[11px]" />
        </Link>
      </div>

      {loading && !visibleStories.length ? (
        <>
          <div className="sm:hidden">
            <div className="flex snap-x snap-mandatory gap-0 overflow-x-auto pb-1 scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-[202px] w-full shrink-0 snap-center animate-pulse rounded-xl bg-white min-[390px]:h-[220px]"
                />
              ))}
            </div>
          </div>

          <div className="hidden grid-cols-2 gap-4 sm:grid lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-56 animate-pulse rounded-lg bg-white md:h-64 lg:h-72"
              />
            ))}
          </div>
        </>
      ) : null}

      {visibleStories.length ? (
        <>
          <div className="sm:hidden">
            <div
              ref={mobileCarouselRef}
              onScroll={syncActiveMobileIndex}
              className="flex snap-x snap-mandatory gap-0 overflow-x-auto pb-1 scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {visibleStories.map((story) => (
                <Link
                  key={story.slug}
                  to={createNewsStoryPath(story.slug)}
                  className="group relative h-[202px] w-full shrink-0 snap-center overflow-hidden rounded-xl bg-white shadow-sm transition-all duration-200 hover:shadow-lg min-[390px]:h-[220px]"
                >
                  <div className="absolute inset-0">
                    <NewsImage story={story} />
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/25 to-transparent transition-opacity group-hover:opacity-90" />

                  <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                    <h3 className="line-clamp-2 text-[12px] font-semibold leading-4">
                      {story.title}
                    </h3>

                    <div className="mt-2 flex items-end justify-between gap-3 text-[9px] leading-3">
                      <span className="min-w-0 truncate font-semibold">
                        {story.author || "By Hooks"}
                      </span>
                      <span className="shrink-0 whitespace-nowrap text-right opacity-90">
                        <span className="block">{story.publishedAt}</span>
                        {story.updatedAt &&
                        story.updatedAt !== story.publishedAt ? (
                          <span className="block opacity-75">
                            Updated {story.updatedAt}
                          </span>
                        ) : null}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {visibleStories.length > 1 ? (
              <div className="mt-4 flex justify-center gap-2">
                {visibleStories.map((story, index) => (
                  <button
                    key={`${story.slug}-dot`}
                    type="button"
                    aria-label={`Go to story ${index + 1}`}
                    onClick={() => scrollToMobileStory(index)}
                    className={`h-2 rounded-full transition-all duration-200 ${
                      activeMobileIndex === index
                        ? "w-6 bg-purple-700"
                        : "w-2 bg-purple-300 hover:bg-purple-400"
                    }`}
                  />
                ))}
              </div>
            ) : null}

            <Link
              to="/news"
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md bg-purple-600 px-3 py-2.5 text-[11px] font-semibold leading-5 text-white transition-colors hover:bg-purple-700"
            >
              {resolvedNewsLinkLabel}
              <FaArrowRight className="text-[10px]" />
            </Link>
          </div>

          <div className="hidden grid-cols-2 gap-4 sm:grid lg:grid-cols-3 xl:grid-cols-4">
            {visibleStories.map((story) => (
              <Link
                key={story.slug}
                to={createNewsStoryPath(story.slug)}
                className="group relative h-56 overflow-hidden rounded-lg bg-white transition-all duration-200 hover:shadow-lg md:h-64 lg:h-72 sm:rounded-xl"
              >
                <div className="absolute inset-0">
                  <NewsImage story={story} />
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent transition-opacity group-hover:opacity-90" />

                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <h3 className="line-clamp-2 text-sm font-semibold leading-5">
                    {story.title}
                  </h3>

                  <div className="mt-3 flex items-center justify-between text-[12px]">
                    <span className="truncate pr-2 font-medium">
                      {story.author || "By Hooks"}
                    </span>
                    <span className="whitespace-nowrap text-right opacity-90">
                      <span className="block">{story.publishedAt}</span>
                      {story.updatedAt &&
                      story.updatedAt !== story.publishedAt ? (
                        <span className="block opacity-75">
                          Updated {story.updatedAt}
                        </span>
                      ) : null}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
};

export default LatestNewsRouteSection;
