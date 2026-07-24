import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { FaChevronRight, FaFire } from "react-icons/fa";
import SEO from "../SEO";
import NewsStoryArticlePage from "./NewsStoryArticlePage";
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
import GooglePreferredSourceButton from "../News/GooglePreferredSourceButton";

const NEWS_GRID_LIMIT = 50;
const NEWS_MOBILE_QUERY = "(max-width: 639px)";
const NEWS_HERO_ROTATE_MS = 5200;
const NEWS_HERO_STORY_LIMIT = 5;
const NEWS_HERO_LATEST_RATIO = 0.6;

const NEWS_TOPICS = [
  { label: "Mobiles", matcher: (story) => isMobileStory(story) },
  {
    label: "Launches",
    matcher: (story) => getStoryBucket(story) === "launches",
  },
  { label: "Reviews", matcher: (story) => getStoryBucket(story) === "reviews" },
  { label: "Guides", matcher: (story) => getStoryBucket(story) === "guides" },
  {
    label: "Deals",
    matcher: (story) => /deal|sale|offer|discount/i.test(readStoryText(story)),
  },
];

const NEWS_TAXONOMY = [
  {
    slug: "technology",
    label: "Technology",
    title: "Technology News",
    eyebrow: "TryHook Technology Desk",
    description:
      "AI, smartphones, chips, laptops, cybersecurity, software, robotics, and the product shifts shaping what people buy next.",
    accent: "from-[#0f172a] via-[#1d4ed8] to-[#06b6d4]",
    keywords: [
      "technology",
      "tech",
      "ai",
      "artificial intelligence",
      "smartphone",
      "laptop",
      "chip",
      "semiconductor",
      "software",
      "cybersecurity",
      "robotics",
      "ev",
    ],
    categories: [
      "technology",
      "ai",
      "smartphones",
      "mobiles",
      "chips",
      "laptops",
      "software",
      "cybersecurity",
      "ev-tech",
      "robotics",
      "launches",
    ],
    topics: [
      {
        slug: "ai",
        label: "AI",
        title: "AI News",
        description:
          "AI announcements, AI tools, Android AI features, search changes, and practical AI updates.",
        categories: ["ai", "technology", "software"],
        keywords: [
          "ai",
          "artificial intelligence",
          "machine learning",
          "openai",
          "gemini",
          "copilot",
          "android ai",
        ],
      },
      {
        slug: "smartphones",
        label: "Smartphones",
        title: "Smartphone News",
        description:
          "Smartphone launches, software rollouts, pricing updates, leaks, and mobile feature coverage.",
        categories: ["smartphones", "mobiles", "launches"],
        keywords: [
          "smartphone",
          "mobile",
          "phone",
          "android",
          "iphone",
          "galaxy",
          "pixel",
          "oneplus",
          "redmi",
          "realme",
        ],
      },
      {
        slug: "chips",
        label: "Chips",
        title: "Chip & Semiconductor News",
        description:
          "Qualcomm, MediaTek, Apple silicon, GPUs, processors, and semiconductor updates that affect devices.",
        categories: ["chips", "technology"],
        keywords: [
          "chip",
          "processor",
          "semiconductor",
          "snapdragon",
          "mediatek",
          "dimensity",
          "gpu",
          "apple silicon",
        ],
      },
      {
        slug: "laptops",
        label: "Laptops",
        title: "Laptop News",
        description:
          "Laptop launches, CPUs, GPUs, AI PCs, operating system updates, and computing hardware coverage.",
        categories: ["laptops", "technology"],
        keywords: [
          "laptop",
          "pc",
          "notebook",
          "processor",
          "gpu",
          "intel",
          "amd",
          "windows",
          "macbook",
        ],
      },
      {
        slug: "software",
        label: "Software",
        title: "Software News",
        description:
          "Operating systems, app platforms, productivity tools, security updates, and feature rollouts.",
        categories: ["software", "technology", "apps"],
        keywords: [
          "software",
          "android",
          "ios",
          "windows",
          "app",
          "feature",
          "update",
          "rollout",
        ],
      },
    ],
  },
  {
    slug: "consumer-tech",
    label: "Consumer Tech",
    title: "Consumer Tech & Internet",
    eyebrow: "Apps, Internet & Services",
    description:
      "WhatsApp, Google, YouTube, Instagram, broadband, cloud services, internet tools, and everyday technology updates.",
    accent: "from-[#0f172a] via-[#047857] to-[#34d399]",
    categories: [
      "consumer-tech",
      "apps",
      "internet",
      "software",
      "cloud-services",
      "gadgets",
    ],
    keywords: [
      "consumer tech",
      "whatsapp",
      "google",
      "youtube",
      "instagram",
      "internet",
      "broadband",
      "cloud",
      "app",
    ],
    topics: [
      {
        slug: "apps",
        label: "Apps",
        title: "App Feature News",
        description:
          "WhatsApp, YouTube, Instagram, Google apps, and feature updates people use every day.",
        categories: ["apps", "consumer-tech", "software"],
        keywords: [
          "app",
          "whatsapp",
          "youtube",
          "instagram",
          "google",
          "feature",
          "update",
        ],
      },
      {
        slug: "internet",
        label: "Internet",
        title: "Internet News",
        description:
          "Search, broadband, networking, online services, cloud tools, and internet platform changes.",
        categories: ["internet", "consumer-tech", "cloud-services"],
        keywords: [
          "internet",
          "search",
          "broadband",
          "networking",
          "wifi",
          "cloud",
          "service",
        ],
      },
    ],
  },
  {
    slug: "science",
    label: "Science",
    title: "Science & Space News",
    eyebrow: "Science With A Tech Lens",
    description:
      "Space missions, ISRO, NASA, quantum computing, health technology, renewable energy, and discoveries with technology impact.",
    accent: "from-[#020617] via-[#4338ca] to-[#38bdf8]",
    categories: [
      "science",
      "space",
      "health-tech",
      "renewable-energy",
      "quantum-computing",
    ],
    keywords: [
      "science",
      "space",
      "nasa",
      "isro",
      "quantum",
      "health technology",
      "renewable energy",
      "satellite",
    ],
    topics: [
      {
        slug: "space",
        label: "Space",
        title: "Space News",
        description:
          "NASA, ISRO, satellites, space missions, astronomy discoveries, and space technology.",
        categories: ["space", "science"],
        keywords: [
          "space",
          "nasa",
          "isro",
          "satellite",
          "rocket",
          "mission",
          "exoplanet",
          "moon",
          "mars",
        ],
      },
      {
        slug: "renewable-energy",
        label: "Renewable Energy",
        title: "Renewable Energy News",
        description:
          "Solar, batteries, clean energy, grid technology, and renewable energy breakthroughs.",
        categories: ["renewable-energy", "science"],
        keywords: [
          "renewable energy",
          "solar",
          "battery",
          "clean energy",
          "grid",
          "wind",
          "hydrogen",
        ],
      },
      {
        slug: "health-technology",
        label: "Health Technology",
        title: "Health Technology News",
        description:
          "Medical technology, AI in healthcare, lab-grown organs, diagnostics, and health innovation.",
        categories: ["health-tech", "science"],
        keywords: [
          "health technology",
          "medical technology",
          "healthcare",
          "diagnostics",
          "lab-grown",
          "medicine",
        ],
      },
    ],
  },
  {
    slug: "sports-technology",
    label: "Sports Technology",
    title: "Sports Technology News",
    eyebrow: "Tech Behind Modern Sport",
    description:
      "AI officiating, VAR, smart balls, athlete wearables, performance analytics, and sports science.",
    accent: "from-[#0f172a] via-[#15803d] to-[#bef264]",
    categories: ["sports-technology", "wearables", "sports-science"],
    keywords: [
      "sports technology",
      "var",
      "smart ball",
      "wearable",
      "sports science",
      "performance analytics",
      "athlete",
    ],
    topics: [
      {
        slug: "wearables",
        label: "Wearables",
        title: "Sports Wearables News",
        description:
          "Smart wearables, athlete sensors, recovery tech, and performance-tracking devices.",
        categories: ["wearables", "sports-technology"],
        keywords: [
          "wearable",
          "sensor",
          "athlete",
          "smartwatch",
          "fitness tracker",
          "performance",
        ],
      },
      {
        slug: "sports-science",
        label: "Sports Science",
        title: "Sports Science News",
        description:
          "Performance analytics, training technology, recovery science, and AI-assisted sports decisions.",
        categories: ["sports-science", "sports-technology"],
        keywords: [
          "sports science",
          "analytics",
          "training",
          "recovery",
          "ai in sports",
          "officiating",
        ],
      },
    ],
  },
];

const parseStoryTime = (story) => {
  const date = new Date(
    story?.publishedIso || story?.updatedIso || story?.publishedAt,
  );
  const time = date.getTime();
  return Number.isNaN(time) ? 0 : time;
};

const formatStoryDate = (story) => story?.publishedAt || "Latest";

const formatStoryAuthorDate = (story) =>
  [story?.author, formatStoryDate(story)].filter(Boolean).join(" | ");

const formatStoryLabel = (story) => {
  if (!story) return "News";
  return story.label || "News";
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

const normalizeNewsRouteSlug = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const NEWS_TAXONOMY_BY_SLUG = new Map(
  NEWS_TAXONOMY.map((pillar) => [pillar.slug, pillar]),
);

const resolveNewsTaxonomyRoute = (pillarSlug = "", topicSlug = "") => {
  const pillar = NEWS_TAXONOMY_BY_SLUG.get(normalizeNewsRouteSlug(pillarSlug));
  if (!pillar) return null;

  const normalizedTopic = normalizeNewsRouteSlug(topicSlug);
  const topic = normalizedTopic
    ? (pillar.topics || []).find((item) => item.slug === normalizedTopic)
    : null;

  if (normalizedTopic && !topic) return null;

  return {
    pillar,
    topic,
    slug: topic?.slug || pillar.slug,
    label: topic?.label || pillar.label,
    title: topic?.title || pillar.title,
    eyebrow: topic ? pillar.label : pillar.eyebrow,
    description: topic?.description || pillar.description,
    categories: topic?.categories || pillar.categories || [],
    matchCategories: [topic?.categories?.[0] || topic?.slug || pillar.slug].map(
      normalizeNewsRouteSlug,
    ),
    keywords: topic?.keywords || pillar.keywords || [],
    accent: pillar.accent,
    path: "/news",
  };
};

const storyMatchesTaxonomyRoute = (story, route) => {
  if (!route) return true;
  const storyCategory = normalizeNewsRouteSlug(story?.category);
  const routeCategories = (route.matchCategories || []).map(
    normalizeNewsRouteSlug,
  );
  return Boolean(
    storyCategory &&
    routeCategories.some((category) => category === storyCategory),
  );
};

const filterStoriesForTaxonomyRoute = (stories = [], route = null) =>
  route
    ? stories.filter((story) => storyMatchesTaxonomyRoute(story, route))
    : stories;

const getNewsPageTitle = (route = null) =>
  route
    ? `${route.title} - TryHook News`
    : "News - Technology, Science & Product Updates - Hooks";

const getNewsPageDescription = (route = null) =>
  route
    ? route.description
    : "Read the latest technology news, smartphone launches, AI updates, gadget releases, industry trends, and expert insights from India and around the world on TryHook.";

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

const buildWeightedHeroStories = ({
  latest = [],
  pinned = [],
  fallback = [],
  limit = NEWS_HERO_STORY_LIMIT,
} = {}) => {
  const latestCount = Math.ceil(limit * NEWS_HERO_LATEST_RATIO);
  const pinnedCount = Math.max(0, limit - latestCount);
  const picked = [];
  const used = new Set();

  const pushStories = (source = [], count = limit) => {
    for (const story of source) {
      if (picked.length >= limit || count <= 0) break;
      if (!story?.slug || used.has(story.slug)) continue;
      used.add(story.slug);
      picked.push(story);
      count -= 1;
    }
  };

  pushStories(latest, latestCount);
  pushStories(pinned, pinnedCount);
  pushStories(latest, limit - picked.length);
  pushStories(pinned, limit - picked.length);
  pushStories(fallback, limit - picked.length);

  return picked;
};

const buildNewsLayout = (stories = []) => {
  const validStories = [...stories].filter(
    (story) => story?.slug && story?.title,
  );
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
        story?.slug &&
        list.findIndex((item) => item.slug === story.slug) === index,
    )
    .slice(0, 8);
  const pinned = recent.filter((story) => story.pinned).slice(0, 12);
  const launches = recent
    .filter((story) => getStoryBucket(story) === "launches")
    .slice(0, 12);
  const reviews = take(
    ranked,
    4,
    (story) => getStoryBucket(story) === "reviews",
  );
  const guides = take(ranked, 6, (story) => getStoryBucket(story) === "guides");
  const latest = recent.slice(0, 12);
  const topNews = take(ranked, 9);

  return {
    hero,
    pinned,
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
      alt={story?.heroImageAlt || story?.title || "Story image"}
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
      setActiveIndex(
        (currentIndex) => (currentIndex + 1) % carouselStories.length,
      );
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
    className={`group block overflow-hidden rounded-2xl bg-white transition-all hover:border-[#bfdbfe] ${
      rowCard && compact
        ? desktopRow
          ? "min-w-[76%] snap-start border border-white/15 bg-[#1f2631] sm:min-w-[15.5rem] sm:border-[#e5e7eb] sm:bg-white lg:min-w-[17rem] xl:min-w-[18rem]"
          : "min-w-[76%] snap-start border border-white/15 bg-[#1f2631] sm:min-w-0 sm:border-[#e5e7eb] sm:bg-white"
        : rowCard
          ? desktopRow
            ? "min-w-[84%] snap-start sm:min-w-[15.5rem] lg:min-w-[17rem] xl:min-w-[18rem]"
            : "min-w-[84%] snap-start sm:min-w-0"
          : ""
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
    className={`group grid grid-cols-[92px_minmax(0,1fr)] gap-3 bg-white py-3 first:pt-0 last:pb-0 sm:block sm:overflow-hidden sm:rounded-xl sm:p-3 sm:transition-colors sm:hover:bg-[#f8fbff] ${
      desktopRow ? "sm:min-w-[15.5rem] lg:min-w-[17rem] xl:min-w-[18rem]" : ""
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
        className="group grid grid-cols-[88px_minmax(0,1fr)] items-center gap-3 rounded-xl bg-white p-2 transition-colors hover:bg-[#f8fbff] sm:grid-cols-[92px_minmax(0,1fr)]"
      >
        <StoryImage story={story} className="aspect-square w-full rounded-xl" />
        <div className="min-w-0">
          <p className="mb-1 text-[11px] font-semibold leading-none text-[#7d8898]">
            {story.brandName || story.label || "News"}
          </p>
          <h3 className="line-clamp-3 text-[14px] font-semibold leading-[1.28] text-[#20242b] group-hover:text-[#2563eb]">
            {story.title}
          </h3>
          <p className="mt-1 text-[11px] leading-none text-[#7d8898]">
            {formatStoryAuthorDate(story)}
          </p>
        </div>
      </Link>
    ))}
  </div>
);

const getLatestStoryPill = (story) =>
  story?.brandName || story?.productName || story?.label || "News";

const LatestNewsTimeline = ({ stories = [] }) => {
  if (!stories.length) return null;

  return (
    <section className="min-w-0">
      <div className="mb-6 border-b border-[#d9dee7] pb-4 sm:mb-8">
        <h2 className="text-[28px] font-black leading-none tracking-[-0.04em] text-[#06133a] sm:text-[34px]">
          Latest News
        </h2>
      </div>

      <div className="ml-1 space-y-8 border-l border-dashed border-[#d7deeb] pl-5 sm:ml-0 sm:space-y-10 sm:pl-7">
        {stories.map((story) => (
          <article key={story.slug} className="relative">
            <div className="relative mb-4 flex items-center gap-3 sm:mb-5">
              <span className="absolute -left-[21px] h-6 border-l-2 border-[#0066ff] sm:-left-[29px]" />
              <time className="text-[14px] font-black text-[#0066ff] sm:text-[15px]">
                {formatStoryDate(story)}
              </time>
            </div>

            <Link
              to={createNewsStoryPath(story.slug)}
              className="group block rounded-2xl transition-transform duration-300 hover:-translate-y-0.5"
            >
              <div className="grid gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_2px_2px_rgba(0,0,0,0.1)] sm:grid-cols-[minmax(0,1fr)_220px] sm:items-center sm:gap-7 sm:p-5">
                <div className="min-w-0">
                  <span className="mb-3 inline-flex w-fit rounded-md bg-[#eef3fb] px-3 py-1 text-[10px] font-bold text-[#06133a] sm:mb-4 sm:text-[11px]">
                    {getLatestStoryPill(story)}
                  </span>
                  <h3 className="line-clamp-3 text-[17px] font-black leading-[1.32] tracking-[-0.02em] text-[#06133a] transition-colors group-hover:text-[#005dff] sm:line-clamp-2 sm:text-[20px]">
                    {story.title}
                  </h3>
                  <p className="mt-3 line-clamp-3 max-w-2xl text-[12px] leading-6 text-[#6b7890] sm:line-clamp-2 sm:text-[13px]">
                    {story.summary}
                  </p>
                  <p className="mt-4 text-[12px] font-semibold text-[#0050b8] sm:text-[13px]">
                    {story.author || "Hooks news"}
                  </p>
                </div>

                <StoryImage
                  story={story}
                  className="aspect-[16/9] w-full rounded-xl sm:h-[160px] sm:w-[220px]"
                />
              </div>
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
};

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
          {stories.map((story) =>
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
            ),
          )}
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
      <div className="mb-8">
        <h2 className="text-[24px] font-black leading-none tracking-[-0.04em] text-[#06133a] sm:text-[34px]">
          Popular Brands
        </h2>
        <div className="mt-4 h-[2px] w-full border-t border-[#d9dee7]" />
      </div>

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
    <section className="overflow-hidden bg-white">
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
            <StoryImage
              story={story}
              className="aspect-[4/3] w-full rounded-md"
            />
            <div className="min-w-0">
              <h3 className="line-clamp-3 text-[13px] font-semibold leading-5 text-[#20242b] group-hover:text-[#2563eb]">
                {story.title}
              </h3>
              <p className="mt-1 text-[11px] text-[#7d8898]">
                {formatStoryDate(story)}
              </p>
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
    <section className="overflow-hidden bg-white">
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
            <StoryImage
              story={story}
              className="h-16 w-16 shrink-0 rounded-md"
            />
            <div className="min-w-0">
              <h3 className="line-clamp-2 text-[13px] font-semibold leading-5 text-[#20242b] group-hover:text-[#2563eb]">
                {story.productName || story.title}
              </h3>
              <p className="mt-1 text-[11px] text-[#7d8898]">
                {story.brandName || story.label || "Launch"} |{" "}
                {formatStoryDate(story)}
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
      <div
        key={index}
        className="animate-pulse overflow-hidden border border-[#e5e7eb] bg-white"
      >
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
  const { slug = "", "*": newsRouteTail = "" } = useParams();
  const newsRouteTailSegments = useMemo(
    () =>
      String(newsRouteTail || "")
        .split("/")
        .map(normalizeNewsRouteSlug)
        .filter(Boolean),
    [newsRouteTail],
  );
  const topicSlug = newsRouteTailSegments[0] || "";
  const hasExtraNewsRouteSegments = newsRouteTailSegments.length > 1;
  const routePillarSlug = slug;
  const taxonomyRoute = useMemo(
    () =>
      routePillarSlug
        ? resolveNewsTaxonomyRoute(routePillarSlug, topicSlug)
        : null,
    [routePillarSlug, topicSlug],
  );
  const hasNewsRouteTail = Boolean(routePillarSlug);
  const shouldRenderArticle = hasNewsRouteTail && !taxonomyRoute && !topicSlug;
  const shouldRedirectUnknownRoute =
    hasNewsRouteTail &&
    !shouldRenderArticle &&
    (!taxonomyRoute || hasExtraNewsRouteSegments);
  const canonicalPath = taxonomyRoute?.path || "/news";
  const canonical = `https://tryhook.shop${canonicalPath}`;
  const { stories, loading, error } = usePublicNewsFeed({
    limit: NEWS_GRID_LIMIT,
  });
  const routedStories = useMemo(
    () => filterStoriesForTaxonomyRoute(stories, taxonomyRoute),
    [stories, taxonomyRoute],
  );
  const deviceContext = useDevice({ resources: ["brands"] });
  const storySchemaItems = useStoryListSchemaItems(routedStories);
  const layout = useMemo(() => buildNewsLayout(routedStories), [routedStories]);
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
      buildWeightedHeroStories({
        latest: layout.latest,
        pinned: layout.pinned,
        fallback: [layout.hero, ...layout.topNews],
      }),
    [layout],
  );
  const pageTitle = getNewsPageTitle(taxonomyRoute);
  const pageDescription = getNewsPageDescription(taxonomyRoute);

  if (shouldRenderArticle) {
    return <NewsStoryArticlePage />;
  }

  if (shouldRedirectUnknownRoute) {
    return <Navigate to="/news" replace />;
  }

  const pageSchema = [
    createBreadcrumbSchema([
      { label: "Home", url: "https://tryhook.shop/" },
      { label: "News", url: "https://tryhook.shop/news" },
      ...(taxonomyRoute
        ? [{ label: taxonomyRoute.title, url: canonical }]
        : []),
    ]),
    createCollectionSchema({
      name: taxonomyRoute?.title || "Hooks News",
      description: pageDescription,
      url: canonical,
      image: "https://tryhook.shop/hook-logo.png",
    }),
    createWebPageSchema({
      name: taxonomyRoute?.title || "Hooks News",
      description: pageDescription,
      url: canonical,
    }),
    createItemListSchema({
      name: taxonomyRoute ? `${taxonomyRoute.title} Stories` : "Latest News",
      url: canonical,
      items: storySchemaItems,
    }),
  ];

  return (
    <>
      <SEO
        title={pageTitle}
        description={pageDescription}
        url={canonical}
        robots="index, follow, max-image-preview:large"
        ogType="website"
        image="https://tryhook.shop/hook-logo.png"
        schema={pageSchema}
      />

      <main className="overflow-x-hidden bg-white text-[#111827]">
        <section>
          <div className="mx-auto max-w-[1280px] px-4 pb-1 pt-3 sm:px-6 sm:pt-3 lg:px-8">
            <nav
              aria-label="Breadcrumb"
              className="flex flex-wrap items-center gap-2 text-[12px] text-[#7d8898]"
            >
              <Link to="/" className="hover:text-[#2563eb]">
                Home
              </Link>
              <span className="text-[12px] font-medium text-[#b6c2cf]">
                /
              </span>
              {taxonomyRoute ? (
                <Link to="/news" className="hover:text-[#2563eb]">
                  News
                </Link>
              ) : (
                <span className="font-semibold text-[#1f2937]">News</span>
              )}
              {taxonomyRoute ? (
                <>
                  <span className="text-[12px] font-medium text-[#b6c2cf]">
                    /
                  </span>
                  <span className="font-semibold text-[#1f2937]">
                    {taxonomyRoute.title}
                  </span>
                </>
              ) : null}
            </nav>
          </div>
        </section>

        <div className="mx-auto max-w-[1280px] px-4 pb-5 pt-2 sm:px-6 sm:pb-8 sm:pt-3 lg:px-8">
          {error ? (
            <div className="mb-6 rounded-2xl border border-[#bfdbfe] bg-[#eff6ff] p-4 text-sm text-[#1d4ed8]">
              {error}
            </div>
          ) : null}

          {loading && !stories.length ? (
            <LoadingGrid />
          ) : taxonomyRoute && !routedStories.length ? (
            <div className="rounded-[28px] border border-[#dbe5f2] bg-white p-8 text-center shadow-[0_18px_55px_rgba(15,23,42,0.06)]">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#7c3aed]">
                Route is ready
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-[#111827]">
                No published stories in {taxonomyRoute.title} yet
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-[#64748b]">
                Publish a story with this category or matching tags, and it will
                automatically appear on this route.
              </p>
              <Link
                to="/news"
                className="mt-5 inline-flex rounded-full bg-[#111827] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#2563eb]"
              >
                Browse all news
              </Link>
            </div>
          ) : (
            <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_300px] xl:items-start">
              <div className="min-w-0 space-y-7 sm:space-y-9">
                <section className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
                  <HeroStoryCarousel stories={heroCarouselStories} />
                  <SpotlightList stories={display.spotlight} />
                </section>

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

                <LatestNewsTimeline stories={display.latest} />
              </div>

              <aside className="min-w-0 space-y-5 xl:sticky xl:top-6">
                <GooglePreferredSourceButton panel compact />
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
