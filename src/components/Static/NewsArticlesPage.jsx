import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaChevronRight,
  FaFire,
} from "react-icons/fa";
import SEO from "../SEO";
import NewsPushOptInCard from "../News/NewsPushOptInCard";
import {
  createBreadcrumbSchema,
  createCollectionSchema,
  createItemListSchema,
  createWebPageSchema,
} from "../../utils/schemaGenerators";
import { useDevice } from "../../hooks/useDevice";
import {
  createNewsStoryPath,
  usePublicNewsFeed,
  useStoryListSchemaItems,
} from "../../hooks/usePublicNews";

const NEWS_GRID_LIMIT = 36;
const NEWS_MOBILE_QUERY = "(max-width: 639px)";
const NEWS_HERO_ROTATE_MS = 5200;

const NEWS_TOPICS = [
  { label: "Mobiles", matcher: (story) => isMobileStory(story) },
  { label: "Launches", matcher: (story) => getStoryBucket(story) === "launches" },
  { label: "Reviews", matcher: (story) => getStoryBucket(story) === "reviews" },
  { label: "Guides", matcher: (story) => getStoryBucket(story) === "guides" },
  { label: "Deals", matcher: (story) => /deal|sale|offer|discount/i.test(readStoryText(story)) },
];

const parseStoryTime = (story) => {
  const date = new Date(story?.publishedIso || story?.updatedIso || story?.publishedAt);
  const time = date.getTime();
  return Number.isNaN(time) ? 0 : time;
};

const formatStoryDate = (story) => story?.publishedAt || "Latest";

const formatStoryLabel = (story) => {
  const label = story?.label || "News";
  return label === "Launch Tracker" ? "Launch Coverage" : label;
};

const readStoryText = (story) =>
  `${story?.title || ""} ${story?.summary || ""} ${story?.category || ""} ${
    story?.label || ""
  } ${story?.productType || ""} ${story?.brandName || ""}`.toLowerCase();

const isMobileStory = (story) => {
  const text = readStoryText(story);
  return (
    story?.productType === "smartphone" ||
    story?.category === "mobiles" ||
    /mobile|phone|smartphone|iphone|android|galaxy|nord|redmi|realme|vivo|oppo|oneplus|pixel/.test(
      text,
    )
  );
};

const getStoryBucket = (story) => {
  const text = readStoryText(story);

  if (/review|impression|hands-on|first look/.test(text)) return "reviews";
  if (/guide|how to|tips|trick|best|under|vs|compare|comparison/.test(text)) {
    return "guides";
  }
  if (/launch|launched|debut|announced|price|sale date|available/.test(text)) {
    return "launches";
  }
  return "features";
};

const scoreStory = (story, index) => {
  const ageHours = Math.max(0, (Date.now() - parseStoryTime(story)) / 36e5);
  const recencyScore = Math.max(0, 90 - ageHours / 8);
  const priorityScore =
    (story?.pinned ? 150 : 0) +
    (story?.trending ? 90 : 0) +
    (story?.featured ? 65 : 0);
  const mediaScore = story?.image ? 8 : 0;

  return priorityScore + recencyScore + mediaScore - index * 0.2;
};

const buildNewsLayout = (stories = []) => {
  const validStories = [...stories].filter((story) => story?.slug && story?.title);
  const ranked = [...validStories].sort(
    (left, right) => scoreStory(right, 0) - scoreStory(left, 0),
  );
  const recent = [...validStories].sort(
    (left, right) => parseStoryTime(right) - parseStoryTime(left),
  );
  const used = new Set();

  const take = (source, count, matcher = () => true) => {
    const picked = [];

    for (const story of source) {
      if (picked.length >= count) break;
      if (used.has(story.slug) || !matcher(story)) continue;
      used.add(story.slug);
      picked.push(story);
    }

    return picked;
  };

  const hero = take(ranked, 1)[0] || recent[0] || null;
  const spotlight = take(ranked, 4);
  const trending = ranked
    .filter((story) => story.trending || story.featured || story.pinned)
    .concat(ranked)
    .filter(
      (story, index, list) =>
        story?.slug && list.findIndex((item) => item.slug === story.slug) === index,
    )
    .slice(0, 8);
  const launches = take(ranked, 6, (story) => getStoryBucket(story) === "launches");
  const reviews = take(ranked, 4, (story) => getStoryBucket(story) === "reviews");
  const guides = take(ranked, 6, (story) => getStoryBucket(story) === "guides");
  const latest = recent.slice(0, 12);
  const topNews = take(ranked, 9);

  return {
    hero,
    spotlight,
    topNews: topNews.length ? topNews : latest.slice(0, 9),
    reviews,
    guides,
    launches,
    latest,
    trending,
    topics: NEWS_TOPICS.map((topic) => ({
      ...topic,
      count: validStories.filter(topic.matcher).length,
    })).filter((topic) => topic.count > 0),
  };
};

const uniqueStoriesBySlug = (items = []) => {
  const seen = new Set();

  return items.filter((story) => {
    if (!story?.slug || seen.has(story.slug)) return false;
    seen.add(story.slug);
    return true;
  });
};

const getBrandShortLabel = (name = "") =>
  String(name || "Brand")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

const normalizeBrandKey = (brand = {}) =>
  String(brand?.slug || brand?.name || brand?.id || "")
    .trim()
    .toLowerCase();

const buildNewsBrands = (brands = []) => {
  const seen = new Set();

  return brands
    .filter((brand) => {
      const key = normalizeBrandKey(brand);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return Boolean(brand?.name);
    })
    .sort((left, right) => {
      const leftProducts = Number(left?.published_products || 0);
      const rightProducts = Number(right?.published_products || 0);
      if (rightProducts !== leftProducts) return rightProducts - leftProducts;
      return String(left?.name || "").localeCompare(String(right?.name || ""));
    })
    .slice(0, 8);
};

const useIsNewsMobileLayout = () => {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(NEWS_MOBILE_QUERY).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const mediaQuery = window.matchMedia(NEWS_MOBILE_QUERY);
    const syncLayout = () => setIsMobile(mediaQuery.matches);

    syncLayout();
    mediaQuery.addEventListener("change", syncLayout);

    return () => {
      mediaQuery.removeEventListener("change", syncLayout);
    };
  }, []);

  return isMobile;
};

const StoryImage = ({ story, className = "" }) => (
  <div className={`overflow-hidden bg-[#eaf0f8] ${className}`}>
    <img
      src={story?.image}
      alt={story?.heroImageAlt || story?.title || "News story"}
      loading="lazy"
      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
    />
  </div>
);

const StoryMeta = ({ story, light = false }) => (
  <div
    className={`mt-3 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.12em] ${
      light ? "text-white/72" : "text-[#7d8898]"
    }`}
  >
    <span>{formatStoryLabel(story)}</span>
    <span className={light ? "text-white/35" : "text-[#c7d0dd]"}>|</span>
    <span>{formatStoryDate(story)}</span>
  </div>
);

const HeroStoryCarousel = ({ stories = [] }) => {
  const carouselStories = useMemo(
    () => uniqueStoriesBySlug(stories).slice(0, 5),
    [stories],
  );
  const carouselKey = carouselStories.map((story) => story.slug).join("|");
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    setActiveIndex(0);
  }, [carouselKey]);

  useEffect(() => {
    if (carouselStories.length <= 1 || isPaused) return undefined;

    const timerId = window.setInterval(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % carouselStories.length);
    }, NEWS_HERO_ROTATE_MS);

    return () => window.clearInterval(timerId);
  }, [carouselStories.length, isPaused]);

  const activeStory = carouselStories[activeIndex] || carouselStories[0];

  if (!activeStory) return null;

  return (
    <div
      className="group relative isolate min-h-[20rem] w-full max-w-full overflow-hidden rounded-[22px] bg-[#111827] text-white shadow-[0_24px_70px_rgba(15,23,42,0.16)] sm:min-h-[30rem] sm:rounded-[24px] lg:min-h-[34rem]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
    >
      <div className="absolute inset-0 overflow-hidden rounded-[inherit]">
        <StoryImage
          key={activeStory.slug}
          story={activeStory}
          className="h-full w-full opacity-70"
        />
        <div className="absolute inset-0 rounded-[inherit] bg-gradient-to-t from-[#0b1020] via-[#1e3a8a]/60 to-transparent" />
      </div>
      <Link
        to={createNewsStoryPath(activeStory.slug)}
        aria-label={`Read top story: ${activeStory.title}`}
        className="absolute inset-0 z-10"
      />

      <div className="pointer-events-none relative z-20 flex h-full min-h-[20rem] flex-col justify-end p-4 sm:min-h-[30rem] sm:p-7 lg:min-h-[34rem] lg:p-8">
        <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-[#2563eb]">
          <FaFire className="h-3 w-3 text-[#7c3aed]" />
          Top Story
        </div>
        <h1 className="line-clamp-3 max-w-4xl break-words text-[23px] font-black leading-[1.08] tracking-[-0.04em] sm:text-[42px] lg:text-[52px]">
          {activeStory.title}
        </h1>
        <p className="mt-3 line-clamp-3 max-w-2xl break-words text-[14px] leading-6 text-white/82 sm:mt-4 sm:text-[17px] sm:leading-7">
          {activeStory.summary}
        </p>
        <StoryMeta story={activeStory} light />
      </div>

      {carouselStories.length > 1 ? (
        <div className="absolute bottom-4 right-4 z-30 flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-2.5 py-2 backdrop-blur-md sm:bottom-6 sm:right-6">
          {carouselStories.map((story, index) => (
            <button
              key={story.slug}
              type="button"
              aria-label={`Show top story ${index + 1}`}
              aria-current={index === activeIndex ? "true" : undefined}
              onClick={() => setActiveIndex(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === activeIndex
                  ? "w-7 bg-white"
                  : "w-2 bg-white/45 hover:bg-white/75"
              }`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
};

const NewsGridCard = ({
  story,
  compact = false,
  rowCard = false,
  desktopRow = false,
}) => (
  <Link
    to={createNewsStoryPath(story.slug)}
    className={`group block overflow-hidden bg-white transition-all hover:border-[#bfdbfe] ${
      rowCard && compact
        ? desktopRow
          ? "min-w-[76%] snap-start border border-white/15 bg-[#1f2631] sm:min-w-[15.5rem] sm:border-[#e5e7eb] sm:bg-white lg:min-w-[17rem] xl:min-w-[18rem]"
          : "min-w-[76%] snap-start border border-white/15 bg-[#1f2631] sm:min-w-0 sm:border-[#e5e7eb] sm:bg-white"
        : rowCard
          ? desktopRow
            ? "min-w-[84%] snap-start border border-[#dde7f3] sm:min-w-[15.5rem] lg:min-w-[17rem] xl:min-w-[18rem]"
            : "min-w-[84%] snap-start border border-[#dde7f3] sm:min-w-0"
          : "border border-[#e5e7eb]"
    }`}
  >
    <div className="p-3 sm:p-4">
      <StoryImage
        story={story}
        className={
          rowCard
            ? "aspect-[16/9] w-full rounded-2xl sm:aspect-[4/3]"
            : compact
              ? "aspect-[16/10] w-full rounded-2xl"
              : "aspect-[4/3] w-full rounded-2xl"
        }
      />
      <div className="pt-3 sm:pt-4">
        <StoryMeta story={story} />
        <h3
          className={`mt-2 font-semibold leading-[1.35] text-[#20242b] transition-colors group-hover:text-[#2563eb] ${
            compact
              ? rowCard
                ? "line-clamp-3 text-[14px] text-white sm:line-clamp-2 sm:text-[#20242b]"
                : "line-clamp-2 text-[14px]"
              : rowCard
                ? "line-clamp-2 text-[16px]"
                : "line-clamp-3 text-[16px]"
          }`}
        >
          {story.title}
        </h3>
        {!compact ? (
          <p className="mt-2 line-clamp-2 text-[13px] leading-6 text-[#667689]">
            {story.summary}
          </p>
        ) : null}
      </div>
    </div>
  </Link>
);

const RecentStoryCard = ({ story, desktopRow = false }) => (
  <Link
    to={createNewsStoryPath(story.slug)}
    className={`group grid grid-cols-[92px_minmax(0,1fr)] gap-3 border-b border-[#e5e7eb] bg-white py-3 first:pt-0 last:border-b-0 last:pb-0 sm:block sm:overflow-hidden sm:border sm:bg-white sm:p-3 sm:transition-colors sm:hover:border-[#bfdbfe] ${
      desktopRow
        ? "sm:min-w-[15.5rem] lg:min-w-[17rem] xl:min-w-[18rem]"
        : ""
    }`}
  >
    <StoryImage
      story={story}
      className="aspect-square w-full rounded-md sm:aspect-[4/3] sm:rounded-xl"
    />
    <div className="min-w-0 sm:px-1 sm:pb-1 sm:pt-4">
      <StoryMeta story={story} />
      <h3 className="mt-1 line-clamp-3 text-[14px] font-semibold leading-5 text-[#20242b] transition-colors group-hover:text-[#2563eb] sm:mt-2 sm:text-[16px] sm:leading-[1.35]">
        {story.title}
      </h3>
      <p className="mt-2 hidden text-[13px] leading-6 text-[#667689] sm:line-clamp-2">
        {story.summary}
      </p>
    </div>
  </Link>
);

const SpotlightList = ({ stories = [] }) => (
  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
    {stories.map((story) => (
      <Link
        key={story.slug}
        to={createNewsStoryPath(story.slug)}
        className="group grid grid-cols-[88px_minmax(0,1fr)] gap-3 border border-[#e5e7eb] bg-white p-2 transition-colors hover:border-[#bfdbfe] sm:grid-cols-[92px_minmax(0,1fr)]"
      >
        <StoryImage story={story} className="aspect-square w-full rounded-xl" />
        <div className="min-w-0 self-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#7c3aed]">
            {formatStoryLabel(story)}
          </p>
          <h3 className="mt-1 line-clamp-3 text-[14px] font-semibold leading-5 text-[#20242b] group-hover:text-[#2563eb]">
            {story.title}
          </h3>
        </div>
      </Link>
    ))}
  </div>
);

const SectionHeader = ({
  title,
  eyebrow,
  actionLabel = "More News",
  showAction = true,
  dark = false,
  singleRow = false,
}) => (
  <div
    className={`mb-4 flex items-end justify-between gap-4 border-b pb-3 ${
      dark ? "border-white/15" : "border-[#d9dee7]"
    }`}
  >
    <div>
      {eyebrow ? (
        <p
          className={`text-[11px] font-black uppercase tracking-[0.16em] ${
            dark ? "text-[#c4b5fd]" : "text-[#7c3aed]"
          }`}
        >
          {eyebrow}
        </p>
      ) : null}
      <h2
        className={`mt-1 text-[20px] font-black uppercase tracking-[-0.02em] ${
          dark ? "text-white" : "text-[#18212f]"
        }`}
      >
        {title}
      </h2>
    </div>
    <div className="flex items-center gap-2 sm:gap-3">
      {showAction ? (
        <Link
          to="/news"
          className="hidden items-center gap-1 text-[12px] font-semibold text-[#2563eb] sm:inline-flex"
        >
          {actionLabel}
          <FaChevronRight className="h-2.5 w-2.5" />
        </Link>
      ) : null}
      {singleRow ? (
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#94a3b8] sm:hidden">
          Swipe
        </span>
      ) : null}
    </div>
  </div>
);

const StorySection = ({
  title,
  eyebrow,
  stories = [],
  dark = false,
  singleRow = false,
  desktopSingleRow = false,
  hideOnMobile = false,
  compactMobile = false,
}) => {
  const hasStories = stories.length > 0;
  const railRef = useRef(null);
  const [isRailDragging, setIsRailDragging] = useState(false);
  const dragStateRef = useRef({
    active: false,
    moved: false,
    startX: 0,
    scrollLeft: 0,
  });

  const isMouseDraggableRow = singleRow && desktopSingleRow;

  const stopRailDrag = () => {
    dragStateRef.current.active = false;
    setIsRailDragging(false);
  };

  const handleRailMouseDown = (event) => {
    if (!isMouseDraggableRow) return;

    const rail = railRef.current;
    if (!rail) return;

    event.preventDefault();
    dragStateRef.current = {
      active: true,
      moved: false,
      startX: event.pageX,
      scrollLeft: rail.scrollLeft,
    };
    setIsRailDragging(true);
  };

  const handleRailMouseMove = (event) => {
    if (!isMouseDraggableRow || !dragStateRef.current.active) return;

    const rail = railRef.current;
    if (!rail) return;

    const deltaX = event.pageX - dragStateRef.current.startX;
    if (Math.abs(deltaX) > 6) {
      dragStateRef.current.moved = true;
      event.preventDefault();
    }

    rail.scrollLeft = dragStateRef.current.scrollLeft - deltaX;
  };

  const handleRailClickCapture = (event) => {
    if (!dragStateRef.current.moved) return;

    event.preventDefault();
    event.stopPropagation();
    dragStateRef.current.moved = false;
  };

  if (!hasStories) return null;

  return (
    <section
      className={`${hideOnMobile ? "hidden sm:block" : ""} ${
        dark ? "rounded-[24px] bg-[#2b3038] p-3 sm:p-5" : ""
      }`}
    >
      <SectionHeader
        title={title}
        eyebrow={eyebrow}
        dark={dark}
        singleRow={singleRow && !compactMobile}
      />
      <div className={singleRow ? "relative" : ""}>
        <div
          ref={isMouseDraggableRow ? railRef : null}
          onMouseDown={handleRailMouseDown}
          onMouseMove={handleRailMouseMove}
          onMouseUp={stopRailDrag}
          onMouseLeave={stopRailDrag}
          onClickCapture={handleRailClickCapture}
          onDragStart={(event) => {
            if (isMouseDraggableRow) event.preventDefault();
          }}
          className={
            singleRow
              ? desktopSingleRow
                ? compactMobile
                  ? `grid grid-cols-1 gap-0 sm:flex sm:gap-4 sm:overflow-x-auto sm:pb-2 sm:[scrollbar-width:none] sm:[&::-webkit-scrollbar]:hidden sm:select-none ${
                      isRailDragging ? "sm:cursor-grabbing" : "sm:cursor-grab"
                    }`
                  : `-mx-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-3 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:snap-none sm:gap-4 sm:px-0 sm:pb-2 sm:select-none ${
                      isRailDragging ? "sm:cursor-grabbing" : "sm:cursor-grab"
                    }`
                : "-mx-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-3 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3"
              : compactMobile
                ? "grid grid-cols-1 gap-0 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3"
                : "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          }
        >
          {stories.map((story) => (
            compactMobile ? (
              <RecentStoryCard
                key={story.slug}
                story={story}
                desktopRow={desktopSingleRow}
              />
            ) : (
              <NewsGridCard
                key={story.slug}
                story={story}
                compact={dark}
                rowCard={singleRow}
                desktopRow={desktopSingleRow}
              />
            )
          ))}
        </div>
        {singleRow && !compactMobile ? (
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute bottom-4 right-0 top-0 w-10 bg-gradient-to-l ${
              dark ? "from-[#2b3038]" : "from-[#f7f8fb]"
            } to-transparent sm:hidden`}
          />
        ) : null}
      </div>
    </section>
  );
};

const BrandRailCard = ({ brand }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const showLogo = Boolean(brand?.logo) && !imageFailed;
  const shortLabel = getBrandShortLabel(brand?.name);

  return (
    <Link
      to={`/brand/${encodeURIComponent(brand?.slug || brand?.name || "")}`}
      className="group block w-[5.75rem] min-w-[5.75rem] shrink-0 sm:w-[6.25rem] sm:min-w-[6.25rem] lg:w-[6.5rem] lg:min-w-[6.5rem]"
      title={brand?.name || "Brand"}
    >
      <div className="flex aspect-square w-full items-center justify-center rounded-2xl bg-[#edf3fb] p-3 transition-colors group-hover:bg-[#e6f0ff] sm:p-4">
        {showLogo ? (
          <img
            src={brand.logo}
            alt={brand.name}
            loading="lazy"
            className="max-h-8 w-auto max-w-full object-contain sm:max-h-10"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <span className="text-sm font-black uppercase tracking-[0.08em] text-[#f97316] sm:text-base">
            {shortLabel}
          </span>
        )}
      </div>
    </Link>
  );
};

const BrandRailSection = ({ brands = [] }) => {
  const railRef = useRef(null);
  const [isRailDragging, setIsRailDragging] = useState(false);
  const dragStateRef = useRef({
    active: false,
    moved: false,
    startX: 0,
    scrollLeft: 0,
  });

  const stopRailDrag = () => {
    dragStateRef.current.active = false;
    setIsRailDragging(false);
  };

  const handleRailMouseDown = (event) => {
    const rail = railRef.current;
    if (!rail) return;

    event.preventDefault();
    dragStateRef.current = {
      active: true,
      moved: false,
      startX: event.pageX,
      scrollLeft: rail.scrollLeft,
    };
    setIsRailDragging(true);
  };

  const handleRailMouseMove = (event) => {
    if (!dragStateRef.current.active) return;

    const rail = railRef.current;
    if (!rail) return;

    const deltaX = event.pageX - dragStateRef.current.startX;
    if (Math.abs(deltaX) > 6) {
      dragStateRef.current.moved = true;
      event.preventDefault();
    }

    rail.scrollLeft = dragStateRef.current.scrollLeft - deltaX;
  };

  const handleRailClickCapture = (event) => {
    if (!dragStateRef.current.moved) return;

    event.preventDefault();
    event.stopPropagation();
    dragStateRef.current.moved = false;
  };

  if (!brands.length) return null;

  return (
    <section>
      <SectionHeader
        title="Popular Brands"
        eyebrow="Browse By Brand"
        showAction={false}
        singleRow
      />
      <div className="relative">
        <div
          ref={railRef}
          onMouseDown={handleRailMouseDown}
          onMouseMove={handleRailMouseMove}
          onMouseUp={stopRailDrag}
          onMouseLeave={stopRailDrag}
          onClickCapture={handleRailClickCapture}
          onDragStart={(event) => event.preventDefault()}
          className={`-mx-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-3 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:snap-none sm:gap-4 sm:px-0 sm:pb-2 sm:select-none ${
            isRailDragging ? "sm:cursor-grabbing" : "sm:cursor-grab"
          }`}
        >
          {brands.map((brand) => (
            <BrandRailCard
              key={brand?.id || brand?.slug || brand?.name}
              brand={brand}
            />
          ))}
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-4 right-0 top-0 w-10 bg-gradient-to-l from-[#f7f8fb] to-transparent sm:hidden"
        />
      </div>
    </section>
  );
};

const SideList = ({ title, stories = [] }) => {
  if (!stories.length) return null;

  return (
    <section className="overflow-hidden border border-[#e5e7eb] bg-white">
      <div className="bg-gradient-to-r from-[#2563eb] to-[#7c3aed] px-4 py-2 text-[12px] font-black uppercase tracking-[0.12em] text-white">
        {title}
      </div>
      <div className="divide-y divide-[#eceff3] p-3">
        {stories.map((story) => (
          <Link
            key={story.slug}
            to={createNewsStoryPath(story.slug)}
            className="group grid grid-cols-[72px_minmax(0,1fr)] gap-3 py-3 first:pt-0 last:pb-0"
          >
            <StoryImage story={story} className="aspect-[4/3] w-full rounded-md" />
            <div className="min-w-0">
              <h3 className="line-clamp-3 text-[13px] font-semibold leading-5 text-[#20242b] group-hover:text-[#2563eb]">
                {story.title}
              </h3>
              <p className="mt-1 text-[11px] text-[#7d8898]">{formatStoryDate(story)}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

const LatestLaunches = ({ stories = [] }) => {
  if (!stories.length) return null;

  return (
    <section className="overflow-hidden border border-[#e5e7eb] bg-white">
      <div className="bg-gradient-to-r from-[#2563eb] to-[#7c3aed] px-4 py-2 text-[12px] font-black uppercase tracking-[0.12em] text-white">
        Latest Launches
      </div>
      <div className="divide-y divide-[#edf0f4] p-3">
        {stories.slice(0, 6).map((story) => (
          <Link
            key={story.slug}
            to={createNewsStoryPath(story.slug)}
            className="group flex items-start gap-3 py-3 first:pt-0 last:pb-0"
          >
            <StoryImage story={story} className="h-16 w-16 shrink-0 rounded-md" />
            <div className="min-w-0">
              <h3 className="line-clamp-2 text-[13px] font-semibold leading-5 text-[#20242b] group-hover:text-[#2563eb]">
                {story.productName || story.title}
              </h3>
              <p className="mt-1 text-[11px] text-[#7d8898]">
                {story.brandName || story.label || "Launch"} | {formatStoryDate(story)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

const LoadingGrid = () => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: 9 }).map((_, index) => (
      <div key={index} className="animate-pulse overflow-hidden border border-[#e5e7eb] bg-white">
        <div className="aspect-[4/3] rounded-2xl bg-[#e9eef5]" />
        <div className="space-y-3 p-4">
          <div className="h-3 w-20 bg-[#e9eef5]" />
          <div className="h-4 w-full bg-[#e9eef5]" />
          <div className="h-4 w-3/4 bg-[#e9eef5]" />
        </div>
      </div>
    ))}
  </div>
);

const NewsArticlesPage = () => {
  const canonical = "https://tryhook.shop/news";
  const { stories, loading, error } = usePublicNewsFeed({ limit: NEWS_GRID_LIMIT });
  const deviceContext = useDevice();
  const storySchemaItems = useStoryListSchemaItems(stories);
  const layout = useMemo(() => buildNewsLayout(stories), [stories]);
  const featuredBrands = useMemo(
    () => buildNewsBrands(deviceContext?.brands || []),
    [deviceContext?.brands],
  );
  const isMobileLayout = useIsNewsMobileLayout();
  const display = useMemo(
    () => ({
      spotlight: layout.spotlight.slice(0, isMobileLayout ? 2 : 4),
      topNews: layout.topNews.slice(0, isMobileLayout ? 3 : 9),
      reviews: layout.reviews.slice(0, isMobileLayout ? 2 : 4),
      guides: layout.guides.slice(0, isMobileLayout ? 2 : 6),
      launches: layout.launches.slice(0, isMobileLayout ? 2 : 6),
      latest: layout.latest.slice(0, isMobileLayout ? 3 : 12),
      trendingSide: layout.trending.slice(0, isMobileLayout ? 3 : 5),
      recentSide: layout.latest.slice(0, isMobileLayout ? 3 : 6),
      launchSide: layout.launches.slice(0, isMobileLayout ? 3 : 6),
    }),
    [isMobileLayout, layout],
  );
  const heroCarouselStories = useMemo(
    () =>
      uniqueStoriesBySlug([
        layout.hero,
        ...layout.trending,
        ...layout.latest,
        ...layout.topNews,
      ]).slice(0, 5),
    [layout],
  );

  const pageSchema = [
    createBreadcrumbSchema([
      { label: "Home", url: "https://tryhook.shop/" },
      { label: "News", url: canonical },
    ]),
    createCollectionSchema({
      name: "Hooks News & Articles",
      description:
        "Browse the latest tech news, mobile updates, gadget guides, and launch coverage on Hooks.",
      url: canonical,
      image: "https://tryhook.shop/hook-logo.svg",
    }),
    createWebPageSchema({
      name: "Hooks News & Articles",
      description:
        "Browse the latest tech news, mobile updates, gadget guides, and launch coverage on Hooks.",
      url: canonical,
    }),
    createItemListSchema({
      name: "Latest News & Articles",
      url: canonical,
      items: storySchemaItems,
    }),
  ];

  return (
    <>
      <SEO
        title="News & Articles - Latest Mobile News, Gadget Guides & Launch Updates - Hooks"
        description="Browse the latest mobile news, gadget updates, launch coverage, and editorial guides on Hooks."
        url={canonical}
        robots="index, follow"
        ogType="website"
        image="https://tryhook.shop/hook-logo.svg"
        schema={pageSchema}
      />
      <NewsPushOptInCard />

      <main className="overflow-x-hidden bg-[#f7f8fb] text-[#111827]">
        <section>
          <div className="mx-auto max-w-[1280px] px-4 py-4 sm:px-6 lg:px-8">
            <nav
              aria-label="Breadcrumb"
              className="flex flex-wrap items-center gap-2 text-[12px] text-[#7d8898]"
            >
              <Link to="/" className="hover:text-[#2563eb]">
                Home
              </Link>
              <FaChevronRight className="h-2.5 w-2.5 text-[#b6c2cf]" />
              <span className="font-semibold text-[#1f2937]">News</span>
            </nav>
          </div>
        </section>

        <div className="mx-auto max-w-[1280px] px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
          {error ? (
            <div className="mb-6 rounded-2xl border border-[#bfdbfe] bg-[#eff6ff] p-4 text-sm text-[#1d4ed8]">
              {error}
            </div>
          ) : null}

          {loading && !stories.length ? (
            <LoadingGrid />
          ) : (
            <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_300px] xl:items-start">
              <div className="min-w-0 space-y-7 sm:space-y-9">
                <section className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
                  <HeroStoryCarousel stories={heroCarouselStories} />
                  <SpotlightList stories={display.spotlight} />
                </section>

                <StorySection
                  title="Top News"
                  eyebrow="Trending Now"
                  stories={display.topNews}
                  singleRow
                  desktopSingleRow
                />

                <StorySection
                  title="Reviews"
                  eyebrow="Hands-on"
                  stories={display.reviews}
                />

                <StorySection
                  title="Guides & Features"
                  eyebrow="Guides & Context"
                  stories={display.guides}
                />

                <BrandRailSection brands={featuredBrands} />

                <StorySection
                  title="Recent Updates"
                  eyebrow="Latest"
                  stories={display.latest}
                  singleRow
                  desktopSingleRow
                  compactMobile
                />
              </div>

              <aside className="min-w-0 space-y-5 xl:sticky xl:top-6">
                <SideList title="Trending" stories={display.trendingSide} />
                <SideList title="Recent" stories={display.recentSide} />
                <LatestLaunches stories={display.launchSide} />
              </aside>
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default NewsArticlesPage;
